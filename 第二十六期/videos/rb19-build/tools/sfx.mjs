// 本期拟音：落点全部读 assets/js/timeline.js（与画面同一张时刻表）。
// 素材引用第二十三期的 OpenGameArt CC0 金属样本与 Woosh 生成样本（权重 CC BY-NC 4.0，仅限非商用；不复制进本期）；
// 风声、电流声、涡轮啸叫、引擎声用代码合成。点火不用任何真实比赛录音。
// 用法（在 videos/rb19-build 下，顺序 bgm → sfx → duck）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { DUR, OUT, Q, H } from "../assets/js/beats.js";
import { INSTALL, T_TUB, T_LIVERY, T_DONE, T_FIRE, BRAKE, STALL_HITS, LIGHT0, VER, litAt, tickAt, P0 } from "../assets/js/timeline.js";
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
const S = { slam: sample("metal_slam_01.ogg"), boom: sample("explosion_02.ogg"), hit5: sample("metal_hit_05.ogg"), hit3: sample("metal_hit_03.ogg"), close: sample("metal_close_01.ogg"), sheet: sample("metal_sheet_04.ogg") };
const G = { latch: gen("latch_1", .27, .7), latch3: gen("latch_3", .5, .95), lock: gen("lockdown_2", .05, .75), slide: gen("slide_1", .28, 1), slide2: gen("slide_2", .34, 1.15), tink: gen("screwdrop_3", .28, .95), connector: gen("connector_2", .06, .4), hatch: gen("hatch_1", .07, .75), servo: gen("servo_3", .09, 1.18), unscrew: gen("unscrew_2", .05, .5) };

// ── 合成音 ──
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
function air(d, f0, f1, seed, peak = .6, q = 1.1) {
  const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed * 991 + 7); let lo = 0, band = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (f1 / f0) ** u, g = 2 * Math.sin(Math.PI * Math.min(f, 9000) / SR), hi = (r() * 2 - 1) - lo - band / q; band += g * hi; lo += g * band; const e = u < peak ? (u / peak) ** 2 : ((1 - u) / (1 - peak)) ** 1.6; y[i] = band * e; }
  return mono(norm(y));
}
/** 持续的风声：env(t) 给 0–1 的包络，fc(t) 给中心频率 */
function wind(d, env, fc, seed) { const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed); let lo = 0, band = 0; for (let i = 0; i < n; i++) { const t = i / SR, g = 2 * Math.sin(Math.PI * Math.min(fc(t), 8000) / SR), hi = (r() * 2 - 1) - lo - band / .8; band += g * hi; lo += g * band; y[i] = band * env(t); } return mono(norm(y)); }
/** 电流嗡声：基频加三次谐波、轻微颤动 */
function hum(d, f, env) { const n = Math.ceil(d * SR), y = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR, w = TAU * f * t; y[i] = (Math.sin(w) + .5 * Math.sin(3 * w) + .25 * Math.sin(5 * w)) * (.8 + .2 * Math.sin(TAU * 7 * t)) * env(t); } return mono(norm(y)); }
/** 涡轮啸叫：频率滑动的正弦加一点噪声 */
function whine(d, f0, f1, env, seed) { const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f0 * (f1 / f0) ** (t / d); ph += TAU * f / SR; y[i] = (Math.sin(ph) + .15 * (r() * 2 - 1)) * env(t); } return mono(norm(y)); }
/** 引擎：锯齿状谐波叠加，转速曲线 rpm(t)（Hz） */
function engine(d, rpm, env, seed) { const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed); let ph = 0, lo = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = rpm(t); ph += TAU * f / SR; let v = 0; for (let k = 1; k <= 9; k++) v += Math.sin(ph * k + k * k * .3) / k * (k % 3 === 0 ? 1.4 : 1); lo += .2 * ((r() * 2 - 1) - lo); y[i] = (v * .8 + lo * .6) * env(t); } return mono(norm(y)); }
const SUB_H = sub(80, 30, 1.4, 3.5), SUB_M = sub(140, 52, .35, 12);
const at = (s, sec, g, tag, pan = 0, rate = 1) => fx.place(s, sec, g, { tag, pan, rate });
const heavy = (t, g = .6, pan = 0, rate = 1) => { at(SUB_H, t, g, "sub"); at(G.lock, t, g * .85, "lock", pan, rate); at(S.slam, t, g * .32, "slam", pan, .86 * rate); };
const swish = (t, g, d, seed, up = true, pan = 0) => fx.place(air(d, up ? 320 : 2600, up ? 2600 : 420, seed), t - d * .6, g, { tag: "air", pan });
const lin = (a, b, f) => (t) => Math.min(1, Math.max(0, t / a)) * Math.min(1, Math.max(0, (b - t) / f));

// S1：五盏灯，一盏一声；熄灭那一下音乐进；方格旗、奖杯、赛季条
for (let i = 0; i < 5; i++) { at(SUB_M, LIGHT0 + i, .34, "lamp"); at(G.latch3, LIGHT0 + i, .2, "lamp", 0, .7); }
swish(OUT, .2, .8, 2); at(SUB_H, OUT, .7, "sub"); at(S.boom, OUT, .26, "boom", 0, .6);
swish(OUT + 1.6, .2, 1.0, 3, false); at(S.hit5, 6.95, .22, "trophy", 0, 1.9);
for (const i of VER) at(G.tink, litAt(i), .1, "cell", -.6 + i / 22 * 1.2, 1.7);
at(G.tink, litAt(2), .16, "cell", -.5, 1.4); at(G.tink, litAt(4), .16, "cell", -.4, 1.4); at(S.hit3, litAt(15), .1, "cell", .2, .7);
swish(14.9, .18, 1.2, 5); at(SUB_M, 14.9, .3, "sub");
// S2：单体壳亮相、尺寸框、碰撞、座椅方向盘、Halo
heavy(T_TUB, .45); swish(20.8, .12, 1.0, 6);
fx.place(air(4.4, 1400, 3200, 7, .2, 2.2), 23.0, .06, { tag: "scan" }); at(G.servo, 23.2, .16, "scan", 0, 1.3);
at(G.slide, Q(30.0) - 1.2, .3, "ram", .4, .7); heavy(Q(30.0), .75, .2, .9); at(S.sheet, Q(30.0), .2, "ram", .2, .9); at(G.slide2, 31.2, .18, "ram", .4, .8);
// S3：动力单元滑入、栓紧四声；能量流（电流嗡、涡轮啸叫、放电）
for (const [id, T] of INSTALL) {
  const big = [4, 5, 9, 11, 18, 19].includes(id), pan = id >= 14 && id <= 17 ? (id % 2 ? .5 : -.5) : 0;
  if (id === 5) { at(G.slide2, T - 1.0, .4, "pu", -.2, .7); for (let k = 0; k < 4; k++) at(G.unscrew, T - .6 + k * .2, .26, "bolt", .1, 1.2); heavy(T, .6, 0, .9); continue; }
  if (id >= 14 && id <= 17) { at(G.unscrew, T - .12, .3, "gun", pan, 1.4); at(G.lock, T, .34, "wheel", pan, 1.1); at(SUB_M, T, .3, "sub"); continue; }
  if (big) heavy(T, .5, 0, 1); else { at(G.latch, T, .3, "fit", pan, 1.05); at(G.connector, T + .03, .18, "fit", pan); }
}
fx.place(air(1.6, 300, 1800, 9, .5, 1.6), 48.8, .12, { tag: "xray" });
fx.place(hum(16.2, 110, lin(.6, 16.2, 1.2)), 54.4, .07, { tag: "hum" });
fx.place(whine(5.0, 900, 2600, lin(.4, 5.0, .8), 11), 59.2, .05, { tag: "turbo" });
fx.place(whine(1.4, 300, 1800, lin(.05, 1.4, .6), 12), 64.6, .12, { tag: "release" }); at(SUB_M, 64.6, .3, "sub");
at(SUB_M, Q(71.2), .5, "stamp"); at(S.hit3, Q(71.2), .26, "stamp", 0, .6);
// S4：翻转、沿隧道推进
swish(86.6, .22, 1.6, 13); at(G.servo, 86.6, .18, "flip", 0, .7); fx.place(air(4.6, 220, 900, 14, .5, 1.3), 92.8, .1, { tag: "glide" });
// S5：老车驶过（远处引擎、多普勒）、平底板、年份滚动、剖面风声、两次失速、刹车
fx.place(engine(5.4, (t) => 110 + 40 * Math.exp(-t * .8) - 18 * Math.tanh((t - 2.4) * 2), (t) => Math.min(1, t / .8) * Math.max(0, 1 - Math.max(0, t - 3.8) / 1.6), 21), 98.0, .1, { tag: "oldcar", pan: .3 });
at(G.slide, Q(108.2) - .6, .3, "plate", .4, .8); heavy(Q(108.2), .7, 0, .85); at(S.close, Q(108.2), .26, "plate");
for (let k = 0; k < 14; k++) at(G.tink, 112.8 + k * .11, .08, "year", 0, 1.9 + k * .03);
fx.place(air(1.0, 300, 2600, 15, .6, 1.4), 115.0, .14, { tag: "xray" });
const STL = STALL_HITS;
fx.place(wind(21.6, (t) => { const tt = t + 116.2; let e = Math.min(1, t / 1.5) * Math.min(1, (21.6 - t) / .4); for (const h of STL) if (tt > h && tt < h + .55) e *= .25; return e * (tt > P0 + 8.4 && tt < P0 + 9.05 ? 1.15 : 1); }, (t) => 500 + 900 * Math.min(1, t / 3), 31), 116.2, .16, { tag: "wind" });
for (const h of STL) { at(SUB_M, h, .5, "stall"); at(S.hit3, h + .35, .2, "bounce", 0, .6); at(SUB_M, h + .9, .34, "down"); }
fx.place(air(.9, 4800, 2400, 33, .1, 3.2), BRAKE, .12, { tag: "brake", pan: .2 }); at(SUB_M, BRAKE, .4, "brake");
// S6：两片翅膀、尾翼风、DRS 开合
fx.place(wind(20.2, (t) => Math.min(1, t / 1) * Math.min(1, (20.2 - t) / .4) * (t > 11 && t < 16 ? .65 : 1), (t) => 700 + (t > 5.4 ? 500 : 0), 41), 152.6, .12, { tag: "wind" });
at(G.hatch, Q(163.8), .36, "drs", 0, 1.1); fx.place(air(.5, 900, 300, 42, .1, 1.2), Q(163.8), .2, { tag: "drs" });
at(G.latch, Q(168.6), .3, "drs"); at(SUB_M, Q(169.0), .5, "stamp"); at(S.hit3, Q(169.0), .24, "stamp", 0, .6);
// S7：外壳贴合（在装配表里）、环绕、数字牌、赛季打勾
swish(173.2, .14, 1.4, 51); at(SUB_M, Q(178.2), .42, "plate"); at(S.hit5, Q(178.2), .14, "plate", 0, .7);
for (let i = 1; i <= 22; i++) i === 15 ? at(S.hit3, tickAt(i), .12, "tick", .1, .7) : at(G.tink, tickAt(i), .11, "tick", -.6 + i / 22 * 1.2, 1.6 + i * .01);
at(SUB_M, Q(189.8), .42, "plate"); at(S.hit5, Q(189.8), .16, "plate", 0, 1.2);
// S8：喷漆扫过、完工、点火（全片最响）
fx.place(air(3.0, 2200, 5200, 61, .5, 2.6), 196.8, .12, { tag: "paint" }); at(G.latch3, T_LIVERY, .3, "count"); at(S.hit5, T_DONE, .24, "done", 0, 1.6);
fx.place(engine(8.2, (t) => t < .35 ? 40 + 140 * t : t < 1.2 ? 89 + 260 * (t - .35) : 310 - 120 * Math.min(1, (t - 1.2) / 1.6), (t) => Math.min(1, t / .05) * (t < 1.4 ? 1 : .72), 71), T_FIRE, .62, { tag: "engine" });
at(SUB_H, T_FIRE, .9, "sub"); at(S.boom, T_FIRE, .4, "boom", 0, .7);

const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
