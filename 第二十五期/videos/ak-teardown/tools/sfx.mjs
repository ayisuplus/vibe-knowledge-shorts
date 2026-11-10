// 本期拟音：落点与 assets/js/sections.js、ak.js 的动作同拍。素材引用第二十三期的 CC0 金属样本与 Woosh 生成样本（不复制进本期）。
// 击发只用闷的低频，不用写实枪声。沙粒落地的时刻用和画面同一个下落公式算。
// 用法（在 videos/ak-teardown 下，顺序 bgm → sfx → duck）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, BEAT, DUR, REAL } from "../assets/js/beats.js";
import { TMP, publish } from "./publish.mjs";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../.."), SRC = resolve(repo, "第二十三期/videos/iphone-teardown/assets/audio/sfx-src");
const decode = (file, sr) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 29 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
const dt = .025, bgmPcm = decode(resolve(here, "../assets/audio/bgm.m4a"), 44100), size = Math.round(44100 * dt), envB = [];
for (let i = 0; i < bgmPcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(bgmPcm.length, i + size); j++) pk = Math.max(pk, Math.abs(bgmPcm[j])); envB.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt); return Math.max(.1, Math.min(.82, .98 - Math.max(envB[i - 1] || 0, envB[i] || 0, envB[i + 1] || 0))); };
const fx = await createSfxEngine({ dur: DUR, repo, out: join(TMP, "sfx.m4a"), peakLimit: .82, master: 1.13, tail: .08, limitAt });
const { SR, norm, mono } = fx, TAU = Math.PI * 2;
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const trim = (x) => { let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let i = 0; while (i < x.length && Math.abs(x[i]) < pk * .1) i++; return mono(norm(x.slice(Math.max(0, i - 40)))); };
const sample = (name) => trim(decode(resolve(SRC, name), SR));
const gen = (name, t0, t1) => { const x = decode(resolve(SRC, "gen", name + ".flac"), SR).slice(Math.round(t0 * SR), Math.round(t1 * SR)); const y = trim(x).l, f = Math.min(y.length, Math.round(.02 * SR)); for (let i = 0; i < f; i++) y[y.length - 1 - i] *= i / f; return mono(y); };
const S = { slam: sample("metal_slam_01.ogg"), boom: sample("explosion_02.ogg"), hit5: sample("metal_hit_05.ogg"), spring: sample("metal_spring_01.ogg"), close: sample("metal_close_01.ogg"), sheet: sample("metal_sheet_04.ogg"), fall: sample("metal_falling_02.ogg") };
const G = { latch: gen("latch_1", .27, .7), latch3: gen("latch_3", .5, .95), lock: gen("lockdown_2", .05, .75), lock3: gen("lockdown_3", .03, .75), slide: gen("slide_1", .28, 1), slide2: gen("slide_2", .34, 1.15), tink: gen("screwdrop_3", .28, .95), connector: gen("connector_2", .06, .4), hatch: gen("hatch_1", .07, .75), servo: gen("servo_3", .09, 1.18) };
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
function air(d, f0, f1, seed, peak = .6, q = 1.1) {
  const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed * 991 + 7); let lo = 0, band = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (f1 / f0) ** u, g = 2 * Math.sin(Math.PI * Math.min(f, 9000) / SR), hi = (r() * 2 - 1) - lo - band / q; band += g * hi; lo += g * band; const e = u < peak ? (u / peak) ** 2 : ((1 - u) / (1 - peak)) ** 1.6; y[i] = band * e; }
  return mono(norm(y));
}
const SUB_H = sub(80, 30, 1.4, 3.5), SUB_M = sub(140, 52, .35, 12);
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
const at = (s, sec, g, tag, pan = 0, rate = 1) => fx.place(s, sec, g, { tag, pan, rate });
const sweep = (n, g, d, seed, up = true, pan = 0) => fx.place(air(d, up ? 320 : 2600, up ? 2600 : 420, seed), B(n) - d * .6, g, { tag: "air", pan });
const heavy = (n, g = .6, pan = 0, rate = 1) => { put(SUB_H, n, g, "sub"); put(G.lock, n, g * .85, "lock", pan, rate); put(S.slam, n, g * .32, "slam", pan, .86 * rate); };

// S1：开场、HUD 碎开
put(SUB_M, 0, .22, "sub"); put(S.hit5, 6, .5, "glass", 0, 1.9); put(S.sheet, 6, .3, "glass", .2, 1.5); fx.place(air(1.1, 4200, 700, 3, .15), B(6), .2, { tag: "glass" }); sweep(9, .1, 1.4, 4, true, -.3);
// S2：卸弹匣、清空、掀盖、抽簧、拉框、拧枪机
heavy(12, .5, -.1); put(G.latch, 11.85, .3, "catch");
put(G.slide, 14, .34, "rack", .2, 1.1); put(G.tink, 14.5, .32, "eject", .4); put(S.fall, 15.1, .14, "eject", .5, 1.3); put(SUB_M, 16, .32, "sub"); put(G.lock3, 16, .48, "rack", .2, 1.05);
put(G.latch3, 17, .36, "button"); put(G.hatch, 17.3, .42, "cover", -.1);
put(G.connector, 21, .3, "spring", -.2); put(S.spring, 21.4, .34, "spring", -.3);
put(G.slide2, 24, .4, "carrier", -.1); put(G.connector, 25.1, .28, "lift", -.1);
put(G.latch, 27.1, .38, "twist", .1); put(G.slide, 28.1, .3, "bolt", .2, 1.2);
// S3：平铺落位、主角亮相
for (const [i, n] of [31.5, 32, 32.5, 33, 33.5, 34].entries()) put(i % 2 ? G.connector : G.tink, n, .2, "lay", i % 2 ? .3 : -.3, 1 + i * .05);
sweep(37, .14, 1.2, 7); put(G.servo, 38.5, .2, "spin", 0, .8); fx.place(air(B(5), 180, 1600, 8, .7, 1.8), B(39), .1, { tag: "glow" });
// S4：装回剖面，慢放一次循环，真实速度一次
put(G.slide, 46.3, .32, "back", -.2); put(G.slide2, 47.2, .28, "back", .2); put(G.connector, 48.6, .3, "seat");
put(SUB_H, 50, .8, "sub"); put(S.boom, 50, .36, "boom", 0, .5);
fx.place(air(B(2.6), 200, 1800, 5, .3, 1.6), B(52.6), .16, { tag: "gas", pan: .4 });
put(G.slide, 55.2, .22, "free", -.1, .7); put(G.latch, 59.6, .4, "unlock", 0, .75); put(G.latch3, 63.2, .36, "unlock", 0, .8);
put(G.tink, 66, .42, "eject", .4, .9); put(S.hit5, 66.1, .2, "eject", .4, .8); put(G.connector, 67.2, .26, "pop", -.2, .85);
put(SUB_M, 69, .5, "sub"); put(S.slam, 69, .42, "slam", -.3, .75); put(S.spring, 68.6, .2, "spring", -.4, .8);
put(G.slide, 70.2, .32, "feed", 0, .8); put(G.slide, 71.6, .26, "feed", .1, .85); put(G.latch3, 73.6, .36, "lock", 0, .75);
put(SUB_H, 75, .6, "sub"); put(G.lock, 75, .55, "lock", 0, .8); put(S.close, 75, .3, "lock", 0, .8);
{ const t0 = B(REAL); at(SUB_H, t0, .85, "sub"); at(S.boom, t0, .42, "boom", 0, .95); at(G.tink, t0 + .022, .32, "eject", .4, 1.1); at(S.slam, t0 + .042, .4, "slam", -.2); at(G.lock, t0 + .082, .5, "lock"); at(S.close, t0 + .082, .3, "lock"); fx.place(air(.9, 2400, 380, 9), t0 + .1, .1, { tag: "air" }); }
// S5：冲进缝里、沙粒、枪机框滑过、晃动、图纸
fx.place(air(B(3.6), 2600, 160, 21, .85, 1.3), B(84), .2, { tag: "dive" });
for (let i = 0; i < 110; i++) { // 与 sections.js 的 sand() 同一套公式；穿过弹匣口的不出声
  const n0 = 87.5 + 7 * hash(i + 3), x = -13 + 11 * hash(i + 11), y0 = 6 + 3 * hash(i + 5), r = .09 + .12 * hash(i * 3.7);
  if (x > -10.6 && x < -2.8) continue; const tl = Math.sqrt(2 * (y0 - (-2.2 + r)) / 70), nl = n0 + tl / BEAT;
  if (nl < 103.4 && i % 2 === 0) put(G.tink, nl, .05 + .06 * hash(i + 1), "grain", (hash(i + 4) - .5) * .8, 1.7 + .7 * hash(i + 2));
}
put(G.slide, 88.2, .3, "sweep", 0, .6); put(G.slide2, 93, .28, "sweep", 0, .65);
for (let k = 0; k < 10; k++) put(G.connector, 97.3 + k * .55, .22 * (1 - k / 12), "rattle", k % 2 ? .3 : -.3, 1.25 + .05 * (k % 3));
put(S.hit5, 103.6, .3, "bp", 0, 1.4); fx.place(air(B(5), 5200, 2400, 33, .2, .7), B(103.8), .1, { tag: "paper" });
// S6：计时归零，零件飞回，空拉拉机柄（全片最响），弹匣卡入
put(SUB_H, 113, .76, "sub"); put(S.boom, 113, .4, "boom", 0, .85); put(S.slam, 113, .34, "slam", 0, .8); sweep(113.6, .2, 1.1, 60, false);
put(G.latch, 114.8, .4, "bolt", .1); put(G.slide2, 115.4, .36, "carrier", -.1); heavy(117, .5, -.1);
put(S.spring, 118, .3, "spring", .2); put(G.hatch, 119.3, .4, "cover"); heavy(120, .52, .1, 1.05);
put(G.slide, 121.6, .42, "rack", .2, 1.05); heavy(123, .82, .1, 1.1); put(S.close, 123, .4, "rack", .2);
put(G.latch3, 124.4, .4, "hook", -.1); heavy(125, .66, -.1); sweep(127.4, .14, .35, 63);

const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
