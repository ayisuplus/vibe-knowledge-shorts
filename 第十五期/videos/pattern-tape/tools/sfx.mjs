// 合成全片音效轨 assets/audio/sfx.m4a（90 s，一条 audio 接进 index.html）。
// 做法：历期留下的 sfx/raw（复用，不入库）+ 本脚本内合成（确定性，种子固定）→ 在 JS 里直接混成 44.1k 立体声 → 压限 → ffmpeg 转 AAC。
// 事件时间一律由 beats.js 的 B(n)、ERA 与 world.js 的 rateOf（主织机行速）算出，与画面同源；改了画面节奏，重跑本脚本即可。
// 调式：bgm-270 实测为 F 小调（chroma 相关 0.81），拨弦 / 铃 / 嘀声都取 F 小调五声音阶 F  A♭ B♭ C E♭。
// 电平：BGM 峰值约 −3 dBFS；拟音峰值压在 0.45（−7 dBFS）以内，即比 BGM 峰值低 3 dB 以上（分镜第三节）。
// 用法（在 videos/pattern-tape 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BEAT, B, DUR, ERA } from "../assets/js/beats.js";
import { rateOf } from "../assets/js/world.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const OUT = resolve(HERE, "../assets/audio/sfx.m4a");
const WAV = resolve(HERE, "../assets/audio/sfx.wav");
const SR = 44100, N = Math.ceil(DUR * SR);
const MIX = [new Float32Array(N), new Float32Array(N)];

/* ------------------------------------------------------------ 素材 */
const RAW2 = "第二期/videos/she-economy/sfx/raw/";
const RAW9 = "第九期/videos/markdown/sfx/raw/";
const RAW6 = "第六期/videos/ai-communism/sfx/raw/";
const RAW1 = "第一期/videos/info-funnel/sfx/raw/";
const cache = new Map();
/** 解码成 {l, r} 并归一到峰值 1；之后每个事件的 gain 就是它的峰值电平 */
function raw(rel) {
  if (cache.has(rel)) return cache.get(rel);
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", resolve(REPO, rel), "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const f = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const n = f.length >> 1, l = new Float32Array(n), r = new Float32Array(n);
  let pk = 1e-9;
  for (let i = 0; i < n; i++) { l[i] = f[2 * i]; r[i] = f[2 * i + 1]; pk = Math.max(pk, Math.abs(l[i]), Math.abs(r[i])); }
  for (let i = 0; i < n; i++) { l[i] /= pk; r[i] /= pk; }
  const s = { l, r };
  cache.set(rel, s);
  return s;
}
const mono = (x) => ({ l: x, r: x });
const cut = (s, t0, t1) => ({ l: s.l.slice(Math.floor(t0 * SR), Math.floor(t1 * SR)), r: s.r.slice(Math.floor(t0 * SR), Math.floor(t1 * SR)) });
const norm = (x) => { let pk = 1e-9; for (const v of x) pk = Math.max(pk, Math.abs(v)); for (let i = 0; i < x.length; i++) x[i] /= pk; return x; };

/* ------------------------------------------------------------ 合成件 */
function rng(seed) { let s = seed >>> 0; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
const gen = (dur, fn) => { const n = Math.ceil(dur * SR), o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = fn(i / SR, i); return o; };
const TAU = Math.PI * 2;
const att = (t, a = 0.003) => Math.min(1, t / a);           // 起音，避免咔嗒
function biquadBP(x, f0, q) {                                   // 带通（RBJ，常数峰值增益）
  const y = new Float32Array(x.length);
  const w0 = TAU * f0 / SR, al = Math.sin(w0) / (2 * q), a0 = 1 + al;
  const b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w0) / a0, a2 = (1 - al) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) { const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
  return y;
}
/** 梭击木：短促的木块「嗒」，模态合成 + 一粒噪声起音 */
const knock = (() => { const r = rng(11); return mono(norm(gen(0.2, (t) => Math.exp(-t * 52) * (0.75 * Math.sin(TAU * 610 * t) + 0.38 * Math.sin(TAU * 1330 * t) + 0.16 * Math.sin(TAU * 2140 * t)) + 0.55 * Math.exp(-t * 800) * (r() * 2 - 1)))); })();
/** 细碎 tick：行速快时用 */
const tick = (() => { const r = rng(23); return mono(norm(gen(0.06, (t) => Math.exp(-t * 230) * (0.5 * Math.sin(TAU * 2600 * t) + 0.7 * (r() * 2 - 1))))); })();
/** 软 pop：下滑的短「噗」 */
const pop = mono(norm(gen(0.14, (t) => { const f0 = 180, f1 = 720, k = 55; return Math.exp(-t * 48) * att(t, 0.002) * Math.sin(TAU * (f0 * t + (f1 - f0) / k * (1 - Math.exp(-k * t)))); })));
/** 嘀声：纯音短嘀，音高可调（用 place 的 rate） */
const blip = mono(norm(gen(0.16, (t) => Math.exp(-t * 26) * att(t, 0.002) * (Math.sin(TAU * 1046.5 * t) + 0.25 * Math.sin(TAU * 2093 * t)))));
/** 铃：软「叮」 */
function bell(f, dur = 1.6) { return mono(norm(gen(dur, (t) => att(t, 0.004) * Math.exp(-t * 3.0) * (Math.sin(TAU * f * t) + 0.42 * Math.sin(TAU * 2.0 * f * t) * Math.exp(-t * 3) + 0.2 * Math.sin(TAU * 3.01 * f * t) * Math.exp(-t * 6))))); }
/** Karplus–Strong 拨弦；返回 {snd, f}，f 为实际音高，用 place 的 rate 校到目标音高 */
function pluck(fTarget, seed) {
  const L = Math.max(2, Math.round(SR / fTarget)), buf = new Float32Array(L), r = rng(seed);
  let lp = 0;
  for (let i = 0; i < L; i++) { lp += 0.55 * ((r() * 2 - 1) - lp); buf[i] = lp * 1.8; }
  const n = Math.ceil(0.9 * SR), y = new Float32Array(n);
  for (let i = 0, k = 0; i < n; i++) { const a = buf[k], b = buf[(k + 1) % L]; y[i] = a; buf[k] = 0.9965 * 0.5 * (a + b); k = (k + 1) % L; }
  for (let i = 0; i < n; i++) y[i] *= Math.min(1, (n - i) / (0.15 * SR));
  return { snd: mono(norm(y)), f: SR / L };
}
/** 低频嗡：基音 + 泛音，音量按 shape(t/dur) 走，给「金线脉冲」和「织锦上升」用 */
function drone(freqs, dur, shape, seed = 5) {
  const r = rng(seed), ph = freqs.map(() => r() * TAU);
  return mono(norm(gen(dur, (t) => {
    let v = 0;
    freqs.forEach((f, i) => { v += (1 / (1 + i * 0.35)) * (Math.sin(TAU * f * t + ph[i]) + 0.4 * Math.sin(TAU * 2 * f * t + ph[i] * 1.3) + 0.18 * Math.sin(TAU * 3 * f * t)); v += 0.5 * Math.sin(TAU * (f + 0.35) * t + ph[i]); });
    return v * shape(t / dur) * (0.92 + 0.08 * Math.sin(TAU * 0.6 * t));
  })));
}
/** 绳索绷紧的吱嘎：噪声经扫频共振带通，叠 30 Hz 左右的脉动 */
function creak(dur, seed = 31) {
  const r = rng(seed), n = Math.ceil(dur * SR), x = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; const pulse = Math.pow(0.5 + 0.5 * Math.sin(TAU * (24 + 14 * t / dur) * t), 3); x[i] = (r() * 2 - 1) * pulse; }
  const y = new Float32Array(n);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < n; i++) {
    if (i % 32 === 0) { var f0 = 650 + 700 * (i / n), w0 = TAU * f0 / SR, al = Math.sin(w0) / 14, a0 = 1 + al; var b0 = al / a0, b2 = -al / a0, a1 = -2 * Math.cos(w0) / a0, a2 = (1 - al) / a0; }
    const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  for (let i = 0; i < n; i++) { const u = i / n; y[i] *= Math.min(1, u * 4) * Math.min(1, (1 - u) * 8); }
  return mono(norm(y));
}

/* ------------------------------------------------------------ 放置 */
const log = [];
/** 把 s 混到 t 秒处。gain = 峰值电平；pan -1..1；rate = 变速（也变调）；dur 截断；fade = 末端淡出秒数 */
function place(s, t, gain, o = {}) {
  const { pan = 0, rate = 1, dur = Infinity, fade = 0.004, tag = "" } = o;
  const len = Math.min(Math.floor(s.l.length / rate), Math.floor(dur * SR));
  const i0 = Math.round(t * SR), a = (pan + 1) * Math.PI / 4, gl = Math.cos(a) * Math.SQRT2, gr = Math.sin(a) * Math.SQRT2;
  const nf = Math.max(1, Math.floor(fade * SR)), ni = Math.floor(0.002 * SR);
  for (let i = 0; i < len; i++) {
    const j = i0 + i; if (j < 0 || j >= N) continue;
    const p = i * rate, k = Math.floor(p), fr = p - k;
    const l = s.l[k] + ((s.l[k + 1] ?? s.l[k]) - s.l[k]) * fr;
    const r = s.r[k] + ((s.r[k + 1] ?? s.r[k]) - s.r[k]) * fr;
    const env = Math.min(1, i / ni) * Math.min(1, (len - i) / nf) * gain;
    MIX[0][j] += l * env * gl; MIX[1][j] += r * env * gr;
  }
  log.push([t, tag]);
}
const at = (n) => B(n);

/* ============================================================ S1 · 冷开场 n0–n16 */
place(cut(raw(RAW2 + "sparkle.flac"), 0, 1.1), at(0.1), 0.13, { fade: 0.5, tag: "glint" });          // n0–n2 高光慢扫
place(cut(raw(RAW2 + "whoosh.flac"), 0, 0.9), at(1.7), 0.17, { fade: 0.2, tag: "shutter-w" });      // n2–n3 暗幕合拢
place(cut(raw(RAW2 + "thud.flac"), 0, 0.7), at(3.0), 0.30, { fade: 0.25, tag: "shutter-thud" });    // n3 幕落，第一梭
for (let n = 3; n <= 13; n++) {                                  // 梭击木：每拍一下，左右交替（n3 起，n4/8/12 打纬重击）
  const heavy = n % 4 === 0;
  place(knock, at(n), heavy ? 0.26 : 0.19, { pan: n % 2 ? 0.35 : -0.35, rate: 0.97 + 0.06 * ((n * 7) % 5) / 4, tag: "knock" });
  if (heavy) place(cut(raw(RAW2 + "thud.flac"), 0, 0.75), at(n), 0.42, { fade: 0.3, tag: "beat-thud" });
}
for (const [t] of ERA.slice(1).filter(([, s]) => s)) place(cut(raw(RAW9 + "marker.flac"), 0, 0.12), t, 0.12, { rate: 1.4, fade: 0.05, tag: "tag-roll" });
place(drone([87.31, 130.81], 2.1, (u) => Math.pow(u, 1.8), 3), at(12.95), 0.13, { fade: 0.12, tag: "hum" });
place(cut(raw(RAW2 + "whoosh.flac"), 0, 1.0), at(14.55), 0.22, { fade: 0.3, tag: "paper-expand" });

/* ============================================================ S2 · 纸页 + 线稿 n16–n40 */
for (const n of [16, 18, 20, 22, 24, 28, 30]) place(cut(raw(RAW2 + "typewriter.flac"), 0, 0.38), at(n + 0.05), 0.085, { fade: 0.18, pan: -0.15, tag: "ink-tick" });
place(raw(RAW9 + "marker.flac"), at(26.0), 0.20, { rate: 0.85, fade: 0.2, tag: "pen-circle" });
place(cut(raw(RAW6 + "pen.flac"), 0, 1.1), at(27.1), 0.17, { fade: 0.25, pan: 0.2, tag: "handwrite" });
place(cut(raw(RAW9 + "pageflip.flac"), 0, 1.0), at(30.9), 0.26, { rate: 1.1, fade: 0.3, pan: -0.2, tag: "page-turn" });
for (const n of [32.2, 33.2, 34.2, 35.6, 37.4, 39.0]) place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(n), 0.11, { pan: 0.1, tag: "line-draw" });
place(cut(raw(RAW6 + "rattle.flac"), 0, 0.85), at(34.5), 0.14, { fade: 0.35, pan: 0.2, tag: "bamboo-rattle" });
for (let i = 0; i < 8; i++) place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(36.05 + i * 0.12), 0.10, { rate: 1.0 + i * 0.07, tag: "dimension" });

/* ============================================================ S3 · 花本 n40–n96 */
const SCALE = [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25, 622.25, 698.46, 830.61, 932.33, 1046.5, 1244.5, 1396.9]; // F3 → F6，F 小调五声
SCALE.forEach((f, i) => { const p = pluck(f, 100 + i); place(p.snd, at(40 + i * 0.25), 0.15, { rate: f / p.f, pan: -0.5 + i / 15, fade: 0.3, tag: "warp-pluck" }); });
place(bell(698.46), at(44.9), 0.12, { pan: -0.1, tag: "light-ding" });
place(bell(1046.5), at(46.9), 0.12, { pan: 0.1, tag: "light-ding" });
for (const n of [45.35, 47.35]) place(knock, at(n), 0.22, { tag: "knock" });
for (const n of [46.0, 48.0]) place(cut(raw(RAW2 + "thud.flac"), 0, 0.6), at(n), 0.30, { fade: 0.2, tag: "beat-thud" });
place(cut(raw(RAW9 + "marker.flac"), 0, 1.0), at(48.2), 0.16, { rate: 0.75, fade: 0.2, tag: "sketch" });
for (let i = 0; i < 16; i++) place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(50 + i * 0.125), 0.085, { pan: -0.4 + 0.8 * (i / 15), tag: "grid" });
for (let i = 0; i < 16; i++) place(pop, at(52 + i * 0.25), 0.13, { rate: 0.9 + 0.5 * ((i * 5) % 7) / 6, pan: ((i % 4) - 1.5) * 0.25, tag: "knot-pop" });
place(creak(1.7), at(58.2), 0.16, { fade: 0.15, tag: "rope-hoist" });
place(cut(raw(RAW9 + "clunk.flac"), 0, 0.6), at(61), 0.32, { fade: 0.25, tag: "clunk" });
place(cut(raw(RAW2 + "thud.flac"), 0, 0.6), at(61), 0.22, { fade: 0.25, tag: "clunk" });

/* ---- 织造：按主织机已织行数 R(t) 的整数穿越点逐行出声；行速快了换 tick，再叠一层随行速起落的丝线摩擦 */
const crossings = [];
{
  let R = 0, prevFloor = 0;
  const dt = 0.001;
  for (let t = 0; t < DUR; t += dt) {
    const rate = rateOf(t / BEAT) / BEAT;                         // 行/秒
    R += rate * dt;
    if (Math.floor(R) > prevFloor) { prevFloor = Math.floor(R); crossings.push({ t, rate: rate * BEAT, row: prevFloor }); }  // rate 换回「行/拍」
  }
}
for (const c of crossings) {
  const n = c.t / BEAT;
  if (n >= 62 && n <= 91) {                                      // S3 织造 + 减速
    if (c.rate > 4.2) place(tick, c.t, 0.085, { rate: 1.0 + 0.04 * c.rate, pan: (c.row % 2 ? 0.3 : -0.3), tag: "weave-tick" });
    else place(knock, c.t, c.rate > 2.2 ? 0.14 : 0.18, { rate: 1.0 + 0.05 * c.rate, pan: (c.row % 2 ? 0.3 : -0.3), tag: "weave-knock" });
  } else if (n >= 109.5 && n <= 121.5) {                          // S4 三匹：轻一点的 knock
    place(knock, c.t, 0.09, { rate: 1.1, pan: (c.row % 2 ? 0.25 : -0.25), tag: "weave4-knock" });
  }
}
{ // 摩擦床
  const r = rng(77), noise = new Float32Array(N);
  for (let i = 0; i < N; i++) noise[i] = r() * 2 - 1;
  const bed = biquadBP(noise, 3200, 0.7);
  norm(bed);
  let g = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR, n = t / BEAT;
    const inWeave = (n >= 61.5 && n <= 91) || (n >= 109.5 && n <= 121.5);
    const target = inWeave ? 0.135 * Math.pow(Math.max(0, rateOf(n)) / 6, 1.1) : 0;
    g += (target - g) * (1 - Math.exp(-1 / (SR * 0.06)));
    MIX[0][i] += bed[i] * g; MIX[1][i] += bed[(i + 977) % N] * g;      // 两声道取不同相位的同一床，得到一点宽度
  }
  log.push([at(62), "weave-bed"]);
}
place(cut(raw(RAW2 + "thud.flac"), 0, 0.6), at(90.05), 0.20, { fade: 0.25, tag: "weave-end" });
place(cut(raw(RAW9 + "shimmer.flac"), 0, 2.4), at(90.1), 0.14, { fade: 0.8, tag: "brocade-shimmer" });
place(cut(raw(RAW9 + "chime.flac"), 0, 2.0), at(90.4), 0.09, { fade: 0.8, tag: "brocade-chime" });
place(cut(raw(RAW2 + "sparkle.flac"), 0, 1.4), at(90.2), 0.12, { fade: 0.6, pan: 0.2, tag: "dust-burst" });

/* ============================================================ S4 · 换花本 n96–n120 */
for (let i = 0; i < 12; i++) place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(100 + i / 6), 0.09, { rate: 1.0 + i * 0.03, tag: "ruler-tick" });
place(cut(raw(RAW6 + "shimmer.flac"), 0, 2.4), at(102.6), 0.08, { fade: 0.8, pan: 0.3, tag: "dots-flow" });
place(cut(raw(RAW2 + "whoosh.flac"), 0, 0.9), at(107.8), 0.20, { fade: 0.25, tag: "tape-swap" });
place(cut(raw(RAW6 + "clack.flac"), 0, 0.3), at(109.0), 0.26, { fade: 0.15, tag: "tape-clack" });
place(cut(raw(RAW2 + "stamp.flac"), 0, 0.5), at(109.0), 0.10, { fade: 0.2, tag: "tape-clack" });
place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(114.4), 0.12, { tag: "equal-tick" });
for (const n of [115.4, 116.4]) place(cut(raw(RAW2 + "click.flac"), 0, 0.05), at(n), 0.14, { rate: 0.8, tag: "equal-tick" });
place(cut(raw(RAW2 + "whoosh.flac"), 0, 0.9), at(118.0), 0.18, { fade: 0.25, tag: "strips-out" });
place(cut(raw(RAW1 + "swell.flac"), 0, 2.6), at(119.4), 0.14, { fade: 0.7, tag: "ribbon-rise" });

/* ============================================================ S5 · 带子的后来 n120–n152 */
{ const r = rng(404), ts = []; for (let i = 0; i < 12; i++) ts.push(126.4 + (r() * 4.2));
  ts.sort((a, b) => a - b);
  ts.forEach((n, i) => place(cut(raw(RAW6 + "clack.flac"), 0, 0.12), at(n), 0.12, { rate: 0.9 + 0.35 * r(), pan: (i % 2 ? 0.2 : -0.2), tag: "punch-click" }));
  for (const n of [129.9, 130.45, 131.0]) place(cut(raw(RAW9 + "slap.flac"), 0, 0.3), at(n), 0.15, { fade: 0.1, tag: "card-slap" }); }
for (let i = 0; i < 6; i++) place(cut(raw(RAW6 + "clack.flac"), 0, 0.2), at(132 + i), 0.16, { rate: 0.92, pan: i % 2 ? 0.15 : -0.15, tag: "card-chain" });
place(cut(raw(RAW6 + "servo.flac"), 0, 2.0), at(138.0), 0.07, { fade: 0.6, tag: "gear-bed" });
place(cut(raw(RAW6 + "servo.flac"), 0, 2.0), at(141.0), 0.07, { rate: 0.8, fade: 0.6, tag: "gear-bed" });
for (let i = 0; i < 22; i++) { const n = 138 + i * 0.25; place(cut(raw(RAW6 + "ticker.flac"), 0, 0.09), at(n), 0.10, { rate: n < 141 ? 1.0 : 0.8, pan: (i % 2 ? 0.3 : -0.3), tag: "gear-tick" }); }
const BL = [523.25, 523.25, 622.25, 698.46, 698.46, 830.61, 932.33, 1046.5, 1046.5, 1244.5, 1396.9, 1396.9, 1661.2, 1864.7, 2093, 2093];
BL.forEach((f, i) => place(blip, at(144 + i * 0.25), 0.075 * (1 - 0.35 * i / 15), { rate: f / 1046.5, pan: ((i * 3) % 7 - 3) * 0.12, tag: "pixel-blip" }));
place(cut(raw(RAW2 + "stamp.flac"), 0, 0.8), at(148.0), 0.38, { fade: 0.3, tag: "stamp-analogy" });
place(cut(raw(RAW2 + "thud.flac"), 0, 0.7), at(148.0), 0.20, { fade: 0.3, tag: "stamp-analogy" });

/* ============================================================ S6 · 声明 + 引用 + 问句 n152–n169.44 */
place(cut(raw(RAW2 + "whoosh.flac"), 0, 1.0), at(152.3), 0.18, { fade: 0.3, tag: "page-rise" });
place(cut(raw(RAW2 + "thud.flac"), 0, 0.5), at(154.0), 0.10, { fade: 0.2, tag: "page-settle" });
place(cut(raw(RAW2 + "typewriter.flac"), 0, 1.6), at(154.0), 0.10, { fade: 0.25, pan: -0.1, tag: "quill-type" });
for (const [n, s] of [[156.0, 0.0], [158.0, 1.0], [160.0, 2.0]]) place(cut(raw(RAW6 + "pen.flac"), s, s + 1.0), at(n), 0.14, { rate: 0.97 + 0.05 * s / 2, fade: 0.25, pan: 0.15, tag: "quill-write" });
place(cut(raw(RAW2 + "whoosh.flac"), 0, 0.8), at(163.0), 0.12, { rate: 0.9, fade: 0.3, tag: "page-lift" });
place(drone([174.61, 261.63, 349.23, 207.65], (DUR - at(163)), (u) => { const rise = Math.min(1, u / 0.35); return rise * rise * (3 - 2 * rise); }, 9), at(163.0), 0.115, { fade: 1.5, tag: "ascend" });

/* ------------------------------------------------------------ 压限 + 收尾淡出 */
const THR = 0.45;
const MASTER = 1.55;   // 事件 gain 按「相对大小」写；整体抬到最响一击 ≈ 0.45（比 BGM 峰值低 3 dB）
{
  for (let i = 0; i < N; i++) { MIX[0][i] *= MASTER; MIX[1][i] *= MASTER; }
  let g = 1; const rel = 1 - Math.exp(-1 / (SR * 0.09));
  let pkBefore = 0, pkAfter = 0;
  const fadeStart = (DUR - 1.5) * SR;
  for (let i = 0; i < N; i++) {
    const a = Math.max(Math.abs(MIX[0][i]), Math.abs(MIX[1][i]));
    pkBefore = Math.max(pkBefore, a);
    const target = a > THR ? THR / a : 1;
    if (target < g) g = target; else g += (1 - g) * rel;
    const fo = i > fadeStart ? Math.max(0, (N - i) / (N - fadeStart)) : 1;
    MIX[0][i] *= g * fo; MIX[1][i] *= g * fo;
    pkAfter = Math.max(pkAfter, Math.abs(MIX[0][i]), Math.abs(MIX[1][i]));
  }
  console.log(`限幅前峰值 ${(20 * Math.log10(pkBefore)).toFixed(1)} dBFS → 限幅后 ${(20 * Math.log10(pkAfter)).toFixed(1)} dBFS`);
}
{ // 自查：每 5 s 的事件数
  const bins = new Array(Math.ceil(DUR / 5)).fill(0);
  for (const [t] of log) bins[Math.min(bins.length - 1, Math.floor(t / 5))]++;
  console.log("事件数/5 s：" + bins.join(" "));
}
{ // 写 16-bit WAV，再转 AAC
  const pcm = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) { pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(MIX[0][i] * 32767))), i * 4); pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(MIX[1][i] * 32767))), i * 4 + 2); }
  const hdr = Buffer.alloc(44);
  hdr.write("RIFF", 0); hdr.writeUInt32LE(36 + pcm.length, 4); hdr.write("WAVEfmt ", 8); hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22);
  hdr.writeUInt32LE(SR, 24); hdr.writeUInt32LE(SR * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write("data", 36); hdr.writeUInt32LE(pcm.length, 40);
  writeFileSync(WAV, Buffer.concat([hdr, pcm]));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", WAV, "-t", String(DUR), "-c:a", "aac", "-b:a", "192k", OUT], { stdio: "inherit" });
}
console.log(`\nsfx.m4a 完成：${log.length} 个事件 / ${DUR}s -> ${OUT}`);
