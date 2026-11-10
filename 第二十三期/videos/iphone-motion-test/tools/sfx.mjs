// 本期拟音脚本：金属声用 CC0 实录样本（assets/audio/sfx-src，来源见 CREDITS.md），
// 低频撞击和风声用干净的合成补。不再用引擎的 creak / blip / tick：听起来像棘轮和提示音。
// 用法（在 videos/iphone-motion-test 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
const decode = (file, sr) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 28 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
// BGM 已按重击点让位（tools/bgm.mjs），这里只按它的包络限高，避免相加后破顶
const dt = .025, bgmPcm = decode(resolve(here, "../assets/audio/bgm.m4a"), 44100), size = Math.round(44100 * dt), envB = [];
for (let i = 0; i < bgmPcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(bgmPcm.length, i + size); j++) pk = Math.max(pk, Math.abs(bgmPcm[j])); envB.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt); return Math.max(.1, Math.min(.72, .88 - Math.max(envB[i - 1] || 0, envB[i] || 0, envB[i + 1] || 0))); };
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: .72, master: 1, tail: .08, limitAt });
const { SR, norm, mono } = fx, TAU = Math.PI * 2;
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

/** 读样本并裁掉起音前的空白，让声音正好落在拍上 */
const sample = (name) => { const x = decode(resolve(here, "../assets/audio/sfx-src", name), SR); let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let i = 0; while (i < x.length && Math.abs(x[i]) < pk * .1) i++; return mono(norm(x.slice(Math.max(0, i - 40)))); };
const S = { slam: sample("metal_slam_01.ogg"), close: sample("metal_close_01.ogg"), hit3: sample("metal_hit_03.ogg"), sheet4: sample("metal_sheet_04.ogg"), sheet6: sample("metal_sheet_06.ogg"), door: sample("metal_open_01.ogg"), lock: sample("lock_open_01.ogg"), fall: sample("metal_falling_02.ogg"), hit5: sample("metal_hit_05.ogg"), boom: sample("explosion_02.ogg") };

/** 低频撞击：频率快速下滑的正弦，只负责「重量」 */
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
/** 干净的风声：噪声过扫频带通，包络平滑、没有脉冲 */
function air(d, f0, f1, seed, peak = .6, q = 1.1) {
  const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed * 991 + 7); let lo = 0, band = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (f1 / f0) ** u, g = 2 * Math.sin(Math.PI * Math.min(f, 9000) / SR), hi = (r() * 2 - 1) - lo - band / q; band += g * hi; lo += g * band; const e = u < peak ? (u / peak) ** 2 : ((1 - u) / (1 - peak)) ** 1.6; y[i] = band * e; }
  return mono(norm(y));
}
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
const sweep = (n, g = .2, d = .55, seed = 1, pan = 0, up = true) => fx.place(air(d, up ? 320 : 2600, up ? 2600 : 420, Math.round(n * 13) + seed), B(n) - d * .6, g, { tag: "air", pan });

const SUB_H = sub(92, 34, .85), SUB_M = sub(140, 52, .35, 12);
/** 重击：全片只有几下 */
const heavy = (n, g = .62, pan = 0) => { put(SUB_H, n, g, "sub"); put(S.slam, n, g * .72, "slam", pan, .86); put(S.sheet4, n, g * .28, "sheet", pan, .82); };
/** 中等咬合 */
const clamp = (n, g = .34, pan = 0, s = S.close, rate = .92) => { put(SUB_M, n, g * .6, "sub"); put(s, n, g, "clamp", pan, rate); };

// 开场：只有掠过的风和第一下定音。手机还没开始动，不抢。
sweep(1.7, .13, .8, 2, -.35); sweep(3.6, .15, .8, 3, .35); sweep(5.6, .15, .7, 4, -.25);
sweep(7.9, .24, .95, 5); heavy(8, .66);
// 解锁：每个零件一个声音
put(S.lock, 8.6, .22, "lock", .15);
clamp(9, .34, -.3, S.door); sweep(10.15, .18, .5, 6, -.5);
clamp(10.2, .22, 0, S.hit3); heavy(11, .56); sweep(11.1, .2, .6, 7, .5); put(S.fall, 11.15, .09, "debris", .3);
clamp(12, .32, .25, S.sheet6, .85); sweep(12.5, .12, .5, 8, -.4);
for (let i = 0; i < 6; i++) put(S.hit5, 12.45 + i * .05, .07, "screw", i % 2 ? .35 : -.35, 1 + i * .04);
clamp(13, .36, .2, S.door); put(S.fall, 13.1, .07, "debris", .4);
// 电池：一下定音，然后是能量上涨，不用音高
heavy(16, .6); sweep(18, .16, .5, 9, -.5); clamp(18, .2, -.3, S.sheet6, 1);
fx.place(air(2.4, 90, 700, 31, .9, 2.4), B(18.2), .16, { tag: "charge" }); clamp(20, .24, .35, S.hit3, 1);
// 顺着电流飞：风声随镜头
sweep(22, .26, .7, 10); sweep(23.4, .18, .7, 11, .4); sweep(24.8, .2, .7, 12, -.4);
clamp(26, .22, 0, S.close, 1); clamp(28, .4, .2, S.door, .85); heavy(30, .6);
// 俯冲：一条长风声一路顶到 n34，撞进城里只有一下大的
fx.place(air(B(3.7), 180, 5200, 41, .97, 1.4), B(30.3), .3, { tag: "dive" });
put(SUB_H, 34, .72, "sub"); put(S.boom, 34, .46, "boom", 0, .9); put(S.slam, 34, .34, "slam", 0, .8);
// 城里：低音跟拍做骨架，车流只用风声掠过，左右交替
for (const h of [36, 38, 40, 42]) put(SUB_M, h, .3, "sub");
for (let n = 34.8, i = 0; n < 42; n += 1.2, i++) sweep(n, .1 + .03 * (i % 2), .6, 20 + i, i % 2 ? .7 : -.7);
sweep(42, .22, 1.1, 40, 0, false); heavy(46, .46);
const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
