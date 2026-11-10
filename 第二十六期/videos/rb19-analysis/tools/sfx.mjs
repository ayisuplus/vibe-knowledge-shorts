// 本期拟音（v2 技术解析）：落点全部读 assets/js/timeline.js（与画面同一张时刻表）。
// 素材引用第二十三期的 OpenGameArt CC0 金属样本与 Woosh 生成样本（权重 CC BY-NC 4.0，仅限非商用；不复制进本期）；风声、电流声等代码合成。
// 用法（在 videos/rb19-analysis 下，顺序 bgm → sfx → duck）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { DUR, OUT, Q, H, BEAT } from "../assets/js/beats.js";
import * as T from "../assets/js/timeline.js";
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
const tick = (t, g = .12, pan = 0, rate = 1.6) => at(G.tink, t, g, "tick", pan, rate);
const clink = (t, g = .34) => { at(G.latch, t, g, "ring", .3, 1.15); at(S.hit5, t, g * .5, "ring", .3, 1.5); };

// S1：五盏灯，一盏一声；熄灭那一下音乐进；方格旗、奖杯、赛季条、片名
for (const L of T.LIGHTS) { at(SUB_M, L, .34, "lamp"); at(G.latch3, L, .2, "lamp", 0, .7); }
swish(OUT, .2, .8, 2); at(SUB_H, OUT, .7, "sub"); at(S.boom, OUT, .26, "boom", 0, .6);
swish(T.FLAG + .5, .2, 1.0, 3, false); at(S.hit5, T.TROPHY, .22, "trophy", 0, 1.9);
for (const i of T.VER) tick(T.litAt(i), .1, -.6 + i / 22 * 1.2, 1.7);
tick(T.litAt(2), .16, -.5, 1.4); tick(T.litAt(4), .16, -.4, 1.4); at(S.hit3, T.litAt(15), .1, "cell", .2, .7);
swish(T.TO_CORNER, .14, .8, 4); at(SUB_M, T.TITLE, .32, "title"); swish(T.TITLE, .16, 1.2, 5);
// S2：线稿描边（细笔触）、隧道亮、年份牌、平板盖下、纸页、流线断
fx.place(air(3.2, 2600, 5200, 6, .5, 2.4), T.DRAW2[0], .05, { tag: "pen" });
fx.place(whine(1.0, 500, 900, lin(.1, 1.0, .5), 7), T.TUN2, .06, { tag: "glow" });
for (const y of [T.Y78, T.SLAM - .25, T.Y22 - .25]) for (let k = 0; k < 6; k++) tick(y + k * .05, .07, 0, 1.9 + k * .05);
at(G.slide, T.SLAM - .7, .28, "plate", .2, .8); heavy(T.SLAM, .7, 0, .85); at(S.close, T.SLAM, .26, "plate");
at(G.hatch, T.Y22, .3, "plate", 0, .9); swish(T.Y22, .12, .6, 8);
at(G.slide2, T.PAPER, .2, "paper", 0, 1.3); fx.place(air(.6, 3000, 1200, 9, .3, 1.6), T.PAPER, .08, { tag: "paper" });
at(S.hit3, T.BREAK, .16, "break", .2, 1.4); at(SUB_M, T.BREAK, .28, "break");
// S3：剖面风声（窄处音高升）、下压力、换俯视、斜线、进气口、车底亮、闪烁
fx.place(wind(T.CUTS.s3b - 42, (t) => Math.min(1, t / .8) * Math.min(1, (T.CUTS.s3b - 42 - t) / .3), (t) => 600 + 700 * Math.min(1, t / 4), 31), 42, .14, { tag: "wind" });
heavy(T.DOWNF, .45, 0, 1.1); swish(T.CUTS.s3b, .12, .6, 10); at(G.servo, T.HATCH, .14, "hatch", 0, 1.3);
swish(T.INLET, .12, .6, 11); at(G.lock, T.BIG, .3, "inlet", 0, 1.1); at(SUB_M, T.BIG, .3, "inlet");
fx.place(hum(T.CUTS.s4a - T.FLOOR_GLOW, 110, lin(.4, T.CUTS.s4a - T.FLOOR_GLOW, .6)), T.FLOOR_GLOW, .06, { tag: "hum" }); at(SUB_M, T.FLOOR_GLOW, .3, "glow");
for (let k = 0; k < 10; k++) at(G.connector, T.FLICKER + .6 + k * .55, .06, "flicker", 0, 1.4 + (k % 3) * .2);
// S4：剖面风声，失速两下风声断、车身闷撞；波浪；推向车头
const S4L = T.CUTS.s4b - 75;
fx.place(wind(S4L, (t) => { const tt = t + 75; let e = Math.min(1, t / .8) * Math.min(1, (S4L - t) / .3); for (const h of T.STALL_HITS) if (tt > h - .5 && tt < h + .2) e *= .25; return e * (tt > T.WAVE[0] ? .55 : 1); }, (t) => 600 + 900 * Math.min(1, t / 2.5), 32), 75, .15, { tag: "wind" });
for (const h of T.STALL_HITS) { at(SUB_M, h, .5, "stall"); at(S.hit3, h + .3, .2, "bounce", 0, .6); at(SUB_M, h + .62, .32, "down"); }
fx.place(whine(T.WAVE[1] - T.WAVE[0], 300, 700, lin(.3, T.WAVE[1] - T.WAVE[0], .5), 33), T.WAVE[0], .05, { tag: "wave" });
swish(T.CUTS.s4b, .14, 1.2, 12); at(G.servo, T.CUTS.s4b + 1.2, .14, "sus", 0, .9);
// S5：对比车刹车、机械特写刹车两次（摩擦＋低频＋金属）、两车并排、流线、链条前两环
const brake = (t, g = 1) => { fx.place(air(.9, 4800, 2400, 34 + Math.round(t), .1, 3.2), t, .12 * g, { tag: "brake", pan: .2 }); at(SUB_M, t, .4 * g, "brake"); at(G.lock, t + .12, .18 * g, "susp", 0, .8); };
brake(T.COMP_BRAKE, .8); swish(98.8, .14, 1.0, 13);
at(SUB_M, T.MECH5[0] + .2, .3, "mech"); for (const [on] of T.BRAKES5) brake(on, 1.1);
at(SUB_H, T.CUT5, .3, "cut"); brake(T.DUAL_BRAKE, .9);
fx.place(wind(4.4, lin(.5, 4.4, .6), () => 900, 35), T.FLOW5, .1, { tag: "flow" });
clink(T.RINGS[0]); clink(T.RINGS[1]);
// S6：梁翼缩小、阻力箭头、DRS 开合（作动器液压＋翻起的气动声）、印章、链条后两环
at(G.latch3, T.BEAM_SHRINK, .26, "beam", 0, .9); at(SUB_M, T.BEAM_SHRINK, .3, "beam");
fx.place(air(1.0, 500, 1400, 36, .5, 1.6), T.DRAG, .1, { tag: "drag" });
swish(T.MECH6[0] + .2, .14, 1.0, 14);
const servo = (t, open) => { at(G.servo, t - .1, .26, "act", 0, open ? 1.2 : 1.0); at(G.hatch, t, .32, "drs", 0, open ? 1.1 : .9); fx.place(air(.5, open ? 900 : 400, open ? 300 : 900, 37 + Math.round(t), .1, 1.2), t, .2, { tag: "drs" }); };
for (const [a, b] of T.DRS) { servo(a, true); servo(b, false); }
fx.place(wind(T.MECH6[1] - T.DRS[1][0] + 1.4, lin(.4, T.MECH6[1] - T.DRS[1][0] + 1.4, .4), () => 800, 38), T.DRS[1][0] - 1.4, .09, { tag: "wind" });
at(SUB_M, T.STAMP, .5, "stamp"); at(S.hit3, T.STAMP, .26, "stamp", 0, .6);
clink(T.RINGS[2]); clink(T.RINGS[3]);
// S7：链条四声依次亮、被罚重击、两块数字牌、赛季打勾
swish(155.0, .14, .9, 15);
T.CHAIN_LIT.forEach((t, i) => { at(G.latch, t, .26, "lit", -.45 + i * .3, 1.1 + i * .08); at(SUB_M, t, .22, "lit"); });
heavy(T.PENALTY, .6, 0, .8); at(SUB_M, T.RECORD, .42, "plate"); at(S.hit5, T.RECORD, .16, "plate", 0, 1.2);
for (let i = 1; i <= 22; i++) i === T.SGP ? at(S.hit3, T.tickAt(i), .12, "tick", .1, .7) : tick(T.tickAt(i), .11, -.6 + i / 22 * 1.2, 1.6 + i * .01);
// S8：线稿收拢、问句；结尾硬切不收
fx.place(air(1.0, 2600, 5200, 61, .5, 2.6), 175.1, .07, { tag: "pen" }); swish(176.2, .12, .8, 16); at(SUB_M, T.QUESTION, .34, "q");

const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
