// 动效测试拟音：落点与 assets/js/ak.js 的运动学同拍。素材引用第二十三期的 CC0 金属样本与 Woosh 生成样本（不复制进本期）。
// 慢放段的声音也放慢（降调），真实速度那一下按真实时间排在 0.1 秒内。击发只用闷的低频，不用写实枪声。
// 用法（在 videos/ak-motion-test 下，先跑 tools/bgm.mjs）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR, REAL } from "../assets/js/beats.js";
import { TMP, publish } from "./publish.mjs";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../.."), SRC = resolve(repo, "第二十三期/videos/iphone-teardown/assets/audio/sfx-src");
const decode = (file, sr) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 29 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const dt = .025, bgmPcm = decode(resolve(here, "../assets/audio/bgm.m4a"), 44100), size = Math.round(44100 * dt), envB = [];
for (let i = 0; i < bgmPcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(bgmPcm.length, i + size); j++) pk = Math.max(pk, Math.abs(bgmPcm[j])); envB.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt); return Math.max(.1, Math.min(.82, .98 - Math.max(envB[i - 1] || 0, envB[i] || 0, envB[i + 1] || 0))); };
const fx = await createSfxEngine({ dur: DUR, repo, out: join(TMP, "sfx.m4a"), peakLimit: .82, master: 1.13, tail: .08, limitAt });
const { SR, norm, mono } = fx, TAU = Math.PI * 2;
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const trim = (x) => { let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let i = 0; while (i < x.length && Math.abs(x[i]) < pk * .1) i++; return mono(norm(x.slice(Math.max(0, i - 40)))); };
const sample = (name) => trim(decode(resolve(SRC, name), SR));
const gen = (name, t0, t1) => { const x = decode(resolve(SRC, "gen", name + ".flac"), SR).slice(Math.round(t0 * SR), Math.round(t1 * SR)); const y = trim(x).l, f = Math.min(y.length, Math.round(.02 * SR)); for (let i = 0; i < f; i++) y[y.length - 1 - i] *= i / f; return mono(y); };
const S = { slam: sample("metal_slam_01.ogg"), boom: sample("explosion_02.ogg"), hit: sample("metal_hit_03.ogg"), hit5: sample("metal_hit_05.ogg"), spring: sample("metal_spring_01.ogg"), open: sample("metal_open_01.ogg"), close: sample("metal_close_01.ogg") };
const G = { latch: gen("latch_1", .27, .7), latch3: gen("latch_3", .5, .95), lock: gen("lockdown_2", .05, .75), slide: gen("slide_1", .28, 1), tink: gen("screwdrop_3", .28, .95), connector: gen("connector_2", .06, .4), hatch: gen("hatch_1", .07, .75) };
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
function air(d, f0, f1, seed, peak = .6, q = 1.1) {
  const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed * 991 + 7); let lo = 0, band = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (f1 / f0) ** u, g = 2 * Math.sin(Math.PI * Math.min(f, 9000) / SR), hi = (r() * 2 - 1) - lo - band / q; band += g * hi; lo += g * band; const e = u < peak ? (u / peak) ** 2 : ((1 - u) / (1 - peak)) ** 1.6; y[i] = band * e; }
  return mono(norm(y));
}
const SUB_H = sub(80, 30, 1.4, 3.5), SUB_M = sub(140, 52, .35, 12);
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
const at = (s, sec, g, tag, pan = 0, rate = 1) => fx.place(s, sec, g, { tag, pan, rate });

// 开场：右半剥离
fx.place(air(1.3, 300, 2600, 2), B(.6), .14, { tag: "air", pan: .3 }); put(S.open, .9, .3, "peel", .3, .8);
// 慢放：击发（放慢的闷响）→ 燃气 → 空跑 → 转开 → 抛壳 → 撞底 → 推弹 → 转回锁死
put(SUB_H, 3, .8, "sub"); put(S.boom, 3, .38, "boom", 0, .5);
fx.place(air(B(2.2), 200, 1800, 5, .3, 1.6), B(4.6), .16, { tag: "gas", pan: .4 });
put(G.slide, 6.2, .22, "slide", -.1, .7); put(G.latch, 7.6, .4, "unlock", 0, .75); put(G.latch3, 9.2, .36, "unlock", 0, .8);
put(G.tink, 11.13, .42, "eject", .4, .9); put(S.hit5, 11.2, .2, "eject", .4, .8);
put(G.connector, 12.08, .3, "pop", -.2, .85);
put(SUB_M, 12.83, .5, "sub"); put(S.slam, 12.83, .42, "slam", -.3, .75); put(S.spring, 12.6, .2, "spring", -.4, .8);
put(G.slide, 13.44, .32, "feed", 0, .8); put(G.slide, 14.3, .26, "feed", .1, .85);
put(G.latch3, 15.2, .36, "lock", 0, .75);
put(SUB_H, 16, .6, "sub"); put(G.lock, 16, .55, "lock", 0, .8); put(S.close, 16, .3, "lock", 0, .8);
// 真实速度：一次循环挤在 0.1 秒里
const t0 = B(REAL);
at(SUB_H, t0, .85, "sub"); at(S.boom, t0, .42, "boom", 0, .95);
at(G.tink, t0 + .022, .32, "eject", .4, 1.1); at(S.slam, t0 + .042, .4, "slam", -.2, 1);
at(G.lock, t0 + .082, .5, "lock", 0, 1); at(S.close, t0 + .082, .3, "lock", 0, 1);
fx.place(air(.9, 2400, 380, 9), t0 + .1, .1, { tag: "air" });

const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
