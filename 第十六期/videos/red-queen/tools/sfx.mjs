// 第十六期拟音脚本：只写「在第几拍放什么」。合成 / 混响 / 压限 / 写文件全部来自共享引擎 tools/lib/sfx-engine.mjs。
// 事件时间一律由 beats.js 的 B(n) 与 sections.js 里同一批常量（奔跑步频、卡位、宿主换锁、工人入场…）算出，与画面同源；
// 改了画面节奏，要把下面「与 sections.js 同源」的表同步一遍再重跑本脚本。
//
// 素材策略（重要）：历期 sfx/raw 里很多样本的「响点」并不在开头——例如 R9/thud 前 1.1 s 几乎无声、R2/hit 要到 1.04 s 才响、
// R9/chime 与 clack 在 0.6 s、R2/whoosh 与 R9/whoosh 是「底噪 + 末尾一击」。直接 cut(0, …) 会把这些事件切成静音。
// 所以：起音就在样本开头、或本身是连续底（沙、水、珠、涌、嗡、笔、打字、跳字）的，才用历期素材（并按包络核过）；
// 所有需要「落在拍点上的一击」——挥动、冲击、木块、扫频、咔哒、裂、脚步、叮——全部在本脚本里合成，起音恒在 0。
// 没有用任何生成式模型。调式：bgm-270 为 F 小调，拨弦 / 铃取 F 小调五声音阶 F  A♭ B♭ C E♭。
// 电平：BGM 峰值约 −3 dBFS；拟音峰值压在 0.45（−7 dBFS）以内，即比 BGM 峰值低 3 dB 以上（分镜第四节）。
// 用法（在 videos/red-queen 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { BEAT, B, DUR, ERA } from "../assets/js/beats.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
// BGM 的峰值包络（25 ms 一格，前后各抹一格）：成片里 BGM 与拟音是两条轨直接相加，没有总线限幅，
// 所以拟音在每一刻的上限 = 0.90 − 当时 BGM 的峰值（再夹在 0.10–0.45 之间），相加后峰值留在 −1 dBFS 以内（实测见 BRIEF）。
const BGM_PEAK_CEIL = 0.9, ENV_DT = 0.025;
const bgmEnv = (() => {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", resolve(HERE, "../assets/audio/bgm.m4a"), "-ac", "1", "-ar", "44100", "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  const f = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), W = Math.round(44100 * ENV_DT), env = [];
  for (let i = 0; i + W <= f.length; i += W) { let m = 0; for (let k = 0; k < W; k++) { const v = Math.abs(f[i + k]); if (v > m) m = v; } env.push(m); }
  return env.map((_, i) => Math.max(env[i - 1] ?? 0, env[i], env[i + 1] ?? 0));
})();
const limitAt = (t) => Math.max(0.1, Math.min(0.45, BGM_PEAK_CEIL - (bgmEnv[Math.floor(t / ENV_DT)] ?? 0)));
// 片尾硬切：拟音不做 1.5 s 的尾淡出，只留 0.15 s 防爆音
const fx = await createSfxEngine({ dur: DUR, repo: REPO, out: resolve(HERE, "../assets/audio/sfx.m4a"), tail: 0.15, limitAt });
const { place, cut, raw, mono, norm, gen, rng, SR } = fx;
const TAU = Math.PI * 2;

const P1 = "第一期/videos/info-funnel/sfx/raw/", P2 = "第二期/videos/she-economy/sfx/raw/", P3 = "第三期/videos/distillation-v2/sfx/raw/", P6 = "第六期/videos/ai-communism/sfx/raw/", P9 = "第九期/videos/markdown/sfx/raw/";
const r1 = (n) => raw(P1 + n + ".flac"), r2 = (n) => raw(P2 + n + ".flac"), r3 = (n) => raw(P3 + n + ".flac"), r6 = (n) => raw(P6 + n + ".flac"), r9 = (n) => raw(P9 + n + ".flac");
const NOTE = { A3b: 207.65, B3b: 233.08, C4: 261.63, E4b: 311.13, F4: 349.23, A4b: 415.3, B4b: 466.16, C5: 523.25, E5b: 622.25, F5: 698.46, A5b: 830.61 };
const PENTA = [NOTE.A3b, NOTE.B3b, NOTE.C4, NOTE.E4b, NOTE.F4, NOTE.A4b, NOTE.B4b, NOTE.C5, NOTE.E5b, NOTE.F5, NOTE.A5b];

/* ============================================================ 合成件（起音恒在 t = 0；risers 的最响处在末尾） */
const noise = (dur, seed) => { const r = rng(seed); return gen(dur, () => r() * 2 - 1); };
/** 时变带通（状态变量滤波）：中心频率在 fA → fB 之间按指数扫过 */
function svfSweep(x, fA, fB, q) {
  const n = x.length, y = new Float32Array(n), q1 = 1 / q;
  let low = 0, band = 0;
  for (let i = 0; i < n; i++) {
    const f = fA * Math.pow(fB / fA, i / n), g = 2 * Math.sin(Math.PI * Math.min(f, SR * 0.22) / SR);
    const high = x[i] - low - q1 * band; band += g * high; low += g * band; y[i] = band;
  }
  return y;
}
/** 飞过的「嗖」：噪声过扫频带通，音量在 peak（0–1）处最大 */
function swoosh(dur, fA, fB, peak = 0.4, seed = 1) {
  const y = svfSweep(noise(dur, seed), fA, fB, 1.8), N = y.length;
  for (let i = 0; i < N; i++) { const u = i / N, e = u < peak ? Math.sin((Math.PI / 2) * (u / peak)) ** 2 : Math.cos((Math.PI / 2) * ((u - peak) / (1 - peak))) ** 1.5; y[i] *= e; }
  return mono(norm(y));
}
/** 上升的蓄势：噪声扫频 + 啁啾，越来越响，最响在末尾（把它放在「事件时刻 − dur」） */
function riser(dur, fA, fB, seed = 2) {
  const y = svfSweep(noise(dur, seed), fA, fB, 2.4), N = y.length;
  let ph = 0;
  for (let i = 0; i < N; i++) { const u = i / N; ph += (TAU * (fA * 0.5 + (fB * 0.5 - fA * 0.5) * u * u)) / SR; y[i] = (y[i] * 1.0 + 0.55 * Math.sin(ph)) * u ** 2.2 * Math.min(1, (N - i) / (0.004 * SR)); }
  return mono(norm(y));
}
/** 冲击：低频下坠的正弦 + 一粒噪声起音 + 倍频的身体，慢慢衰减（相撞 / 碎裂 / 转场的「咚」） */
function impact(dur = 1.4, f0 = 62, seed = 3) {
  const r = rng(seed);
  return mono(norm(gen(dur, (t) => {
    const sub = Math.sin(TAU * (f0 * t + (f0 * 2.2 * (1 - Math.exp(-t * 16))) / 16)) * Math.exp(-t * 3.4);
    const body = Math.sin(TAU * f0 * 2.01 * t) * Math.exp(-t * 7) * 0.35;
    const click = (r() * 2 - 1) * Math.exp(-t * 85) * 0.6;
    return Math.min(1, t / 0.002) * (sub + body + click);
  })));
}
/** 闷响（短）：软的「咚」，加码 / 落位用 */
function thump(dur = 0.45, f0 = 96, seed = 4) {
  const r = rng(seed);
  return mono(norm(gen(dur, (t) => Math.min(1, t / 0.0015) * (Math.sin(TAU * (f0 * t + (f0 * 0.8 * (1 - Math.exp(-t * 30))) / 30)) * Math.exp(-t * 15) + (r() * 2 - 1) * Math.exp(-t * 160) * 0.35))));
}
/** 木块「咔」：带通噪声一粒 + 一声 800 Hz 的短鸣（卡入 / 落位） */
function clack(seed = 5) {
  const x = svfSweep(noise(0.16, seed), 1900, 1900, 3.5), N = x.length;
  return mono(norm(gen(0.16, (t, i) => x[i] * Math.exp(-t * 48) + Math.sin(TAU * 790 * t) * Math.exp(-t * 38) * 0.45)));
}
/** 裂：几粒很短的噪声脉冲（微分后偏高频），随机分布在 0.45 s 内 */
function crackSyn(seed = 6) {
  const r = rng(seed), dur = 0.5, N = Math.ceil(dur * SR), out = new Float32Array(N);
  for (let k = 0; k < 9; k++) {
    const t0 = k === 0 ? 0 : r() * 0.4, len = Math.floor((0.003 + r() * 0.01) * SR), a = 1 - k * 0.09;
    let prev = 0;
    for (let i = 0; i < len && t0 * SR + i < N; i++) { const v = r() * 2 - 1; out[Math.floor(t0 * SR) + i] += (v - prev) * a * Math.exp((-i / len) * 3); prev = v; }
  }
  return mono(norm(out));
}
/** 脚步：低通噪声一粒 + 80 Hz 的软「咚」 */
function footstep(seed = 7) {
  const r = rng(seed); let lp = 0;
  return mono(norm(gen(0.14, (t) => { lp += 0.1 * ((r() * 2 - 1) - lp); return Math.min(1, t / 0.002) * (lp * 3.2 * Math.exp(-t * 50) + Math.sin(TAU * 78 * t) * Math.exp(-t * 38) * 0.7); })));
}
/** 高频的闪烁：随机时刻、随机音高（2.4–7 kHz）的短鸣，越往后越稀 */
function sparkle(dur = 1.0, seed = 8, n = 16) {
  const r = rng(seed), pings = Array.from({ length: n }, () => ({ t: r() ** 1.6 * dur * 0.8, f: 2400 + r() * 4600, a: 0.4 + r() * 0.6 }));
  return mono(norm(gen(dur, (t) => { let v = 0; for (const p of pings) { const d = t - p.t; if (d > 0) v += Math.sin(TAU * p.f * d) * Math.exp(-d * 24) * p.a; } return v; })));
}
/** 上升 / 下降的啁啾，音量按 shape 走 */
function chirp(f0, f1, dur, shape = (u) => u * u) {
  let ph = 0;
  return mono(norm(gen(dur, (t) => { const u = t / dur, f = f0 + (f1 - f0) * u * u; ph += (TAU * f) / SR; return Math.sin(ph) * shape(u) * (0.8 + 0.2 * Math.sin(TAU * 7 * t)); })));
}
/** 在拍点 n 放一个拨弦音（目标音高 hz） */
function pluckAt(n, hz, gain, o = {}) { const p = fx.pluck(hz, Math.round(hz) + (o.seed || 0)); place(p.snd, B(n), gain, { rate: hz / p.f, fade: 0.25, ...o }); }
const R = rng(2026);
const pan = (a = 0.3) => (R() * 2 - 1) * a;
const bellAt = (n, hz, gain, o = {}) => place(fx.bell(hz, o.d || 1.6), B(n), gain, { fade: 0.5, ...o });

/* ============================================================ S1 · 冷开场 n0–n22 */
place(r1("swell"), B(0.4), 0.09, { fade: 0.8, tag: "open-air" });                                    // 暗场里一点空气（连续底）
for (const d of [0, 0.25, 0.5, 0.75, 1.0, 1.25]) place(swoosh(0.9, 700, 3400, 0.25, 11 + Math.round(d * 4)), B(2 + d), 0.08, { pan: -0.35 + d * 0.3, rate: 1 + d * 0.05, fade: 0.2, tag: "arrow-in" });   // n2 起：箭头入「嗖」
place(riser(2.0, 300, 3600, 21), B(8) - 2.0, 0.10, { fade: 0.02, tag: "merge-rise" });                // n7–n8 汇拢
bellAt(8, NOTE.C5 * 2, 0.15, { tag: "merge-chime" });                                                // n8：「合」
place(cut(r9("shimmer"), 0, 1.8), B(8), 0.10, { fade: 0.5, tag: "merge-shimmer" });
place(thump(0.5, 100, 31), B(8), 0.18, { fade: 0.15, tag: "merge-thump" });
place(crackSyn(41), B(13.4), 0.12, { fade: 0.1, tag: "split-crack" });                               // n13.4：断开
place(swoosh(0.8, 2200, 500, 0.35, 42), B(13.4), 0.10, { fade: 0.2, tag: "flip" });
place(chirp(110, 760, 4 * BEAT), B(16), 0.12, { fade: 0.05, tag: "charge-chirp" });                    // n16–n20 越逼越近
place(fx.drone([87.31, 130.81], 4 * BEAT, (u) => u ** 1.6, 9), B(16), 0.10, { fade: 0.05, tag: "charge-drone" });
place(impact(2.0, 58, 51), B(20), 0.36, { fade: 0.5, tag: "impact-boom" });                          // n20 整拍：相撞、抵消归零
place(thump(0.6, 80, 52), B(20), 0.16, { fade: 0.2, tag: "impact-thump" });
place(cut(r9("shimmer"), 0, 2.4), B(20.2), 0.11, { fade: 0.8, tag: "impact-tail" });
place(cut(r9("sand"), 0, 2.2), B(21.2), 0.13, { fade: 0.6, tag: "mirror-sand" });                    // n21–n22 转场「沙」（连续底）
place(swoosh(1.3, 500, 2600, 0.55, 53), B(21.0), 0.10, { fade: 0.3, tag: "mirror-whoosh" });

/* ============================================================ S2 · 镜中世界 + 引文 + 论文 n22–n56 */
for (const [t, s] of ERA.slice(1).filter(([, s]) => s)) place(fx.tick, t, 0.10, { rate: 0.9, tag: "tag-roll" });
{ // 脚步：与 sections.js 同源 —— 奔跑者每 T_STEP/2 落一次脚（一个全步 T_STEP = 0.62 s），n21.6–n46.2 之间
  const T_STEP = 0.62; let k = 0;
  for (let t = Math.ceil(B(21.6) / (T_STEP / 2)) * (T_STEP / 2); t < B(46.2); t += T_STEP / 2, k++) {
    place(footstep(70 + (k % 4)), t, 0.07 * (0.85 + 0.3 * ((k * 7) % 5) / 4), { pan: k % 2 ? 0.16 : -0.16, rate: 0.92 + 0.06 * (k % 3), fade: 0.04, tag: "footstep" });
  }
}
place(fx.blip, B(27.5), 0.07, { pan: 0.2, tag: "pair-up" }); place(fx.blip, B(27.9), 0.07, { pan: -0.2, rate: 0.75, tag: "pair-down" });
place(clack(61), B(36), 0.16, { fade: 0.05, tag: "quote-in" });                                      // n36 引文卡入（半拍内）
for (let k = 0; k < 10; k++) place(cut(r2("typewriter"), 0, 0.38), B(37 + k * 0.85), 0.055, { fade: 0.18, pan: -0.15, tag: "quote-type" });
place(cut(r9("pageflip"), 0, 1.3), B(47.8), 0.22, { rate: 1.1, fade: 0.3, pan: -0.2, tag: "paper-in" });   // n48 论文页
place(cut(r2("sparkle"), 0, 1.2), B(48.7), 0.07, { fade: 0.4, tag: "paper-sheen" });
place(cut(r6("pen"), 0, 1.4), B(50.2), 0.12, { fade: 0.3, pan: 0.2, tag: "axes-draw" });
for (const n of [51.2, 51.75, 52.3]) place(fx.knock, B(n), 0.08, { pan: 0.15, rate: 1.4, tag: "line-draw" });
place(swoosh(1.3, 350, 4200, 0.6, 62), B(54.4), 0.20, { fade: 0.3, tag: "to-field-whoosh" });          // n55–n56 纸页化为坐标场
place(cut(r1("shimmer"), 0, 1.6), B(55.4), 0.09, { fade: 0.5, tag: "to-field-shimmer" });

/* ============================================================ S3 · 机制 n56–n108 */
place(cut(r1("twinkle"), 0, 1.2), B(55.6), 0.06, { fade: 0.4, tag: "grid-on" });
for (const n of [58.1, 60.6]) { place(fx.tick, B(n), 0.11, { tag: "arrow-draw" }); place(cut(r6("pen"), 0, 0.9), B(n), 0.07, { fade: 0.25, pan: 0.15, tag: "pen" }); }
bellAt(64.2, NOTE.F5, 0.06, { d: 1.2, pan: -0.25, tag: "kind-same" }); bellAt(64.5, NOTE.C5, 0.06, { d: 1.2, pan: 0.25, tag: "kind-opp" });
for (const n of [70, 70.5]) place(cut(r6("pen"), 0, 0.8), B(n), 0.09, { fade: 0.25, pan: -0.2, tag: "pen-add" });
place(swoosh(0.8, 700, 2600, 0.5, 71), B(72.0), 0.09, { fade: 0.2, tag: "slide-join" });
bellAt(73, NOTE.C5 * 2, 0.15, { tag: "add-chime" });                                                 // n73：同向相加「合」
place(cut(r9("shimmer"), 0, 1.8), B(73), 0.10, { fade: 0.5, tag: "add-shimmer" });
place(thump(0.5, 100, 72), B(73), 0.18, { fade: 0.15, tag: "add-thump" });
place(swoosh(0.9, 600, 1800, 0.45, 73), B(73.4), 0.09, { fade: 0.25, tag: "descend" });
place(fx.drone([87.31, 130.81], B(82.6) - B(74.4), (u) => Math.sin(Math.PI * u) ** 0.8, 4), B(74.4), 0.08, { fade: 0.3, tag: "carry-hum" });
place(cut(r1("twinkle"), 0, 1.4), B(82.6), 0.12, { fade: 0.5, tag: "arrive" });
place(swoosh(1.0, 3200, 500, 0.3, 74), B(83.0), 0.12, { pan: -0.5, fade: 0.2, tag: "rush-L" }); place(swoosh(1.0, 3200, 500, 0.3, 75), B(83.04), 0.12, { pan: 0.5, rate: 0.94, fade: 0.2, tag: "rush-R" });
place(impact(1.8, 66, 76), B(84), 0.32, { fade: 0.4, tag: "cancel-slam" });                          // n84 整拍：对顶相撞，相消
place(thump(0.6, 90, 77), B(84), 0.18, { fade: 0.2, tag: "cancel-thump" });
for (let q = 1; q <= 8; q++) place(cut(r9("spark"), 0, 0.6), B(84 + q * 0.5), 0.04, { pan: pan(0.4), rate: 0.9 + 0.2 * R(), fade: 0.15, tag: "cancel-spark" });
for (const n of [88, 91.5]) { place(thump(0.6, 84, 78 + Math.round(n)), B(n), 0.20, { fade: 0.2, tag: "raise" }); place(clack(79), B(n), 0.08, { fade: 0.05, tag: "raise-clack" }); }
place(riser(1.2, 300, 2600, 80), B(98) - 1.2 + 0.3, 0.14, { fade: 0.2, tag: "ring-in" }); place(cut(r1("swell"), 0, 2.4), B(97.6), 0.08, { fade: 0.8, tag: "ring-swell" });
place(fx.drone([65.41, 98.0, 130.81], 5.6 * BEAT, (u) => Math.sin(Math.PI * u) ** 0.7, 6), B(98), 0.12, { fade: 0.4, tag: "coord-fail-hum" });   // n98 低「嗡」铺底
[[104.4, 1.0], [105.3, 1.12], [106.1, 0.94], [106.9, 1.06]].forEach(([n, rt]) => bellAt(n, NOTE.C5, 0.05, { rate: rt * 0.62, pan: 0.45, fade: 0.6, tag: "cowbell-far" }));   // n104 牛铃（远）

/* ============================================================ S4 · 位置与引擎 n108–n160 */
place(swoosh(1.3, 500, 3000, 0.55, 81), B(107.1), 0.18, { fade: 0.3, tag: "to-ladder" });
place(swoosh(1.2, 300, 1400, 0.6, 82), B(108.0), 0.11, { fade: 0.3, tag: "rails-grow" });
for (let i = 5; i >= 0; i--) pluckAt(108.6 + 0.28 * (5 - i), PENTA[5 - i + 1], 0.08, { pan: -0.2 + 0.08 * (5 - i), seed: i, tag: "rung-light" });    // 自下而上一级级亮起
{ // 人群入场：与 sections.js 同源（第 i 个人 i ≥ 6：B(109.0 + (i−6)×0.62)）
  for (let i = 6; i < 24; i++) place(footstep(90 + i), B(109.0 + (i - 6) * 0.62), 0.06, { pan: pan(0.5), rate: 0.85 + 0.3 * R(), fade: 0.04, tag: "person-in" });
  for (const n of [113.0, 115.0, 117.0, 119.0, 121.0, 122.4]) {            // 卡位：一个人上去（嗖），落位（嗒 + 闷响），另一个人下来
    place(swoosh(0.5, 900, 2600, 0.4, 100 + Math.round(n)), B(n), 0.08, { fade: 0.1, tag: "climb" });
    place(fx.knock, B(n) + 0.62, 0.11, { rate: 1.2, fade: 0.05, tag: "seat-knock" }); place(thump(0.4, 90, 110 + Math.round(n)), B(n) + 0.62, 0.09, { fade: 0.1, tag: "seat-thump" });
  }
}
place(swoosh(1.0, 500, 2800, 0.5, 83), B(123.4), 0.14, { fade: 0.25, tag: "cards-in" });
for (const n of [124.4, 124.75]) place(clack(84 + Math.round(n)), B(n), 0.12, { pan: n < 124.5 ? -0.3 : 0.3, fade: 0.05, tag: "card-clack" });
place(cut(r6("crack"), 0, 1.0), B(135.9), 0.20, { fade: 0.2, tag: "crack-warn" });
place(cut(r1("shatter"), 0.12, 2.8), B(136), 0.34, { fade: 0.6, tag: "shatter" });                    // n136 整拍：梯子碎裂
place(impact(1.5, 64, 85), B(136), 0.20, { fade: 0.3, tag: "shatter-boom" });
place(cut(r1("vortex"), 0, 2.6), B(137.4), 0.09, { fade: 0.7, tag: "reassemble-vortex" });
place(cut(r9("beads"), 0, 2.6), B(138), 0.08, { fade: 0.7, pan: 0.2, tag: "reassemble-beads" });
place(cut(r1("shimmer"), 0, 1.8), B(139.4), 0.12, { fade: 0.6, tag: "reassemble-shimmer" });
[141.0, 143.2, 145.2].forEach((n, i) => { place(sparkle(0.7, 120 + i), B(n), 0.09, { pan: -0.2 + 0.2 * i, fade: 0.2, tag: "recomb-sparkle" }); pluckAt(n, [NOTE.C5, NOTE.E5b, NOTE.A5b][i], 0.07, { pan: 0.2, tag: "recomb-note" }); });
place(cut(r1("twinkle"), 0, 1.2), B(147.4), 0.08, { fade: 0.4, tag: "host-in" });
{ // 寄生虫的光弹：与 sections.js 同源（SHOTS 起射拍；命中 = 第一发）；宿主换锁 HOP
  const SHOTS = [148.6, 150.2, 151.6, 152.8], HOP = [149.6, 150.6, 152.0, 153.2];
  SHOTS.forEach((n, i) => {
    place(swoosh(0.7, 3000, 700, 0.25, 130 + i), B(n), 0.12, { pan: -0.45, fade: 0.15, tag: "dart" });
    if (i === 0) { place(impact(0.7, 120, 140), B(n + 0.7), 0.14, { pan: 0.3, fade: 0.15, tag: "dart-hit" }); place(sparkle(0.5, 141, 10), B(n + 0.7), 0.08, { pan: 0.3, tag: "dart-hit-spark" }); }
    else place(cut(r1("ping"), 0, 0.5), B(n + 0.7), 0.08, { pan: 0.3, rate: 0.8 + 0.06 * i, fade: 0.15, tag: "dart-miss" });
  });
  HOP.forEach((n) => { place(r6("unlock"), B(n), 0.16, { pan: 0.25, fade: 0.1, tag: "re-lock-1" }); place(cut(r6("lock"), 0.84, 1.5), B(n + 0.35), 0.10, { pan: 0.25, fade: 0.15, tag: "re-lock-2" }); });   // 「换锁」
}
place(swoosh(1.0, 3200, 500, 0.3, 150), B(153.5), 0.12, { pan: -0.5, fade: 0.2, tag: "rush2-L" }); place(swoosh(1.0, 3200, 500, 0.3, 151), B(153.55), 0.12, { pan: 0.5, rate: 0.94, fade: 0.2, tag: "rush2-R" });
place(swoosh(1.3, 450, 3800, 0.5, 152), B(153.7), 0.22, { fade: 0.3, tag: "turn-whoosh" });          // n154 整拍：「转向」
pluckAt(154, NOTE.F5, 0.10, { tag: "turn-note" });
place(cut(r1("rise"), 0, 1.6), B(154.4), 0.08, { fade: 0.3, tag: "turn-rise" });
bellAt(156, NOTE.C5 * 2, 0.12, { d: 2.0, tag: "merge2-chime" }); place(cut(r1("shimmer"), 0, 1.6), B(156), 0.09, { fade: 0.5, tag: "merge2-shimmer" });
place(swoosh(1.1, 1800, 400, 0.4, 153), B(158), 0.10, { fade: 0.3, tag: "axis-roll" });

/* ============================================================ S5 · 现实 · 内卷 n160–n198 */
place(swoosh(1.3, 500, 3200, 0.55, 160), B(159.3), 0.20, { fade: 0.3, tag: "to-field2" });            // n160 整拍：新轴化为田
place(impact(1.2, 74, 161), B(160), 0.14, { fade: 0.4, tag: "to-field2-boom" });
{ // 工人入场：与 sections.js 同源（T_WK(i)：i<4 → B(161.4+0.3i)，否则 B(162.2+0.52(i−4))）
  for (let i = 0; i < 20; i++) place(fx.pop, i < 4 ? B(161.4 + i * 0.3) : B(162.2 + (i - 4) * 0.52), 0.05, { pan: (i % 2 ? 1 : -1) * 0.35, rate: 0.9 + 0.2 * R(), fade: 0.06, tag: "worker-in" });
}
place(cut(r9("pour"), 0, 2.2), B(162.4), 0.07, { fade: 0.6, pan: -0.2, tag: "field-water" }); place(cut(r9("pour"), 0, 2.2), B(166.6), 0.07, { fade: 0.6, pan: 0.2, tag: "field-water" });
place(cut(r9("sand"), 0, 3.0), B(163.5), 0.05, { fade: 1.0, tag: "field-work" });
for (const n of [172.6, 176.2, 179.8]) place(cut(r6("ticker"), 0, 1.4), B(n), 0.08, { fade: 0.3, pan: 0.2, tag: "chart-tick" });
place(clack(170), B(183.8), 0.16, { fade: 0.05, tag: "data-in" });                                   // n184 数据卡入
place(cut(r2("ding"), 0, 1.2), B(184), 0.08, { fade: 0.4, tag: "data-ding" });
for (const n of [184.6, 185.5]) place(r3("odometer"), B(n), 0.09, { fade: 0.3, rate: 1.0 + (n - 184.6) * 0.05, tag: "odometer" });
place(cut(r1("shimmer"), 0, 2.0), B(194), 0.09, { rate: 0.8, fade: 0.8, tag: "calm" });

/* ============================================================ S6 · 结语 n198–结束 */
place(cut(r1("swell"), 0, 2.6), B(195.2), 0.09, { fade: 0.9, tag: "river-in" });
place(impact(1.4, 72, 180), B(198), 0.16, { fade: 0.4, tag: "to-end-boom" }); place(swoosh(1.2, 500, 3000, 0.55, 181), B(197.7), 0.14, { fade: 0.3, tag: "to-end-whoosh" });
bellAt(200, NOTE.C5, 0.14, { d: 2.4, fade: 0.7, tag: "thesis-chime" });                              // n200 主句：静
[[200, NOTE.F4], [200.5, NOTE.A4b], [201, NOTE.C5]].forEach(([n, hz]) => pluckAt(n, hz, 0.05, { pan: 0.1, tag: "thesis-arp" }));
place(cut(r6("pen"), 0, 0.9), B(202.2), 0.08, { fade: 0.25, tag: "thesis-underline" });
place(clack(190), B(207.8), 0.14, { fade: 0.05, tag: "refs-in" });                                   // n208 引用卡
for (let i = 0; i < 8; i++) place(fx.tick, B(208.6 + i * 0.4), 0.07, { rate: 1 + 0.05 * i, pan: i % 2 ? 0.25 : -0.25, tag: "ref-tick" });
place(swoosh(1.2, 500, 3200, 0.5, 191), B(215.9), 0.16, { fade: 0.3, tag: "question-whoosh" });        // n216 问句自画
place(chirp(300, 1500, 3.4 * BEAT), B(216.2), 0.08, { fade: 0.1, tag: "question-chirp" });
place(fx.drone([87.31, 130.81, 174.61], DUR - B(216), (u) => 0.35 + 0.65 * u, 8), B(216), 0.10, { fade: 0.05, tag: "end-pad" });
place(riser(4.5 * BEAT, 250, 4200, 192), DUR - 4.5 * BEAT, 0.14, { fade: 0.05, tag: "final-riser" });  // 最后一冲
place(impact(0.5, 62, 193), DUR - 0.5, 0.30, { fade: 0.05, tag: "final-flash" });                    // 一闪的那一下，随后硬切

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR}s；峰值 ${r.pkBefore.toFixed(2)} → ${r.pkAfter.toFixed(2)}；每 5 s 事件数 ${r.bins.join(" ")}`);
