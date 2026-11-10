// 第十八期拟音脚本：只写「什么时刻放什么」。合成 / 压限 / 写文件来自共享引擎 tools/lib/sfx-engine.mjs。
// 时刻一律取自 assets/js/cues.js（旁白实测时间轴）和 film.js / universe.js 里同一批公式（新星点亮时刻、宝石闪光、日出…），与画面同源。
// 本期母版没有 BGM（《Cornfield Chase》发布时在抖音曲库加），拟音只做空间感和落点，要轻；
// 旁白说话时拟音的峰值上限压到 0.2，句间空隙放开到 0.6（用户 2026-10-27：拟音太轻，整体提亮）（读 vo.m4a 的包络）——人声永远在最前面。
// 全部现场合成，起音恒在 t = 0（历期 sfx/raw 的样本响点常在中间或末尾，不用）。没有用任何生成式模型。
// 调式：D 大调五声（D E F# A B），和《Cornfield Chase》的明亮感不打架。
// 用法（在 videos/model-universe 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { C } from "../assets/js/cues.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const DUR = 120, CUT = 119.5;

// 旁白包络（25 ms 一格，前后各抹 4 格）：有声处拟音上限低，空隙处放开；119.5 秒硬切后全静音
const ENV_DT = 0.025;
const voEnv = (() => {
  const buf = execFileSync("ffmpeg", ["-v", "error", "-i", resolve(HERE, "../assets/audio/vo.m4a"), "-ac", "1", "-ar", "44100", "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
  const f = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), W = Math.round(44100 * ENV_DT), env = [];
  for (let i = 0; i + W <= f.length; i += W) { let m = 0; for (let k = 0; k < W; k++) m = Math.max(m, Math.abs(f[i + k])); env.push(m); }
  return env.map((_, i) => Math.max(...env.slice(Math.max(0, i - 4), i + 5)));
})();
const limitAt = (t) => (t >= CUT ? 0 : (voEnv[Math.floor(t / ENV_DT)] ?? 0) > 0.05 ? 0.2 : 0.6);
const fx = await createSfxEngine({ dur: DUR, repo: REPO, out: resolve(HERE, "../assets/audio/sfx.m4a"), tail: 0.6, limitAt, peakLimit: 0.6, master: 2.6 });
const { place, mono, norm, gen, rng, SR } = fx;
const TAU = Math.PI * 2;
const D = { D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440, B4: 493.88, D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880, B5: 987.77, D6: 1174.66 };
const PENTA = [D.D5, D.E5, D.Fs5, D.A5, D.B5, D.D6];

/* ============================================================ 合成件 */
const noise = (dur, seed) => { const r = rng(seed); return gen(dur, () => r() * 2 - 1); };
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
/** 蓄势：噪声扫频＋啁啾，越来越响，最响在末尾（放在「事件时刻 − dur」） */
function riser(dur, fA, fB, seed = 2) {
  const y = svfSweep(noise(dur, seed), fA, fB, 2.4), N = y.length;
  let ph = 0;
  for (let i = 0; i < N; i++) { const u = i / N; ph += (TAU * (fA * 0.5 + (fB * 0.5 - fA * 0.5) * u * u)) / SR; y[i] = (y[i] + 0.55 * Math.sin(ph)) * u ** 2.2 * Math.min(1, (N - i) / (0.004 * SR)); }
  return mono(norm(y));
}
/** 大爆炸：低频下坠的正弦＋噪声起音＋长尾的气浪 */
function boom(dur = 3.2, f0 = 46, seed = 3) {
  const r = rng(seed); let lp = 0;
  return mono(norm(gen(dur, (t) => {
    const sub = Math.sin(TAU * (f0 * t + (f0 * 2.4 * (1 - Math.exp(-t * 12))) / 12)) * Math.exp(-t * 1.6);
    lp += 0.04 * ((r() * 2 - 1) - lp);
    const air = lp * 4 * Math.exp(-t * 1.1) * Math.min(1, t / 0.05);
    const click = (r() * 2 - 1) * Math.exp(-t * 60) * 0.5;
    return Math.min(1, t / 0.002) * (sub + air * 0.6 + click);
  })));
}
/** 铃：基音＋泛音，长尾（宝石闪光、新星点亮、星簇） */
const bell = (f, d = 2.2) => fx.bell(f, d);
/** 柔和的长音铺底（和弦），按 shape 起伏 */
const pad = (freqs, d, shape, seed = 5) => fx.drone(freqs, d, shape, seed);
/** 高频的闪烁：随机时刻、随机音高的短鸣（星尘） */
function sparkle(dur = 1.0, seed = 8, n = 16) {
  const r = rng(seed), pings = Array.from({ length: n }, () => ({ t: r() * dur * 0.9, f: 2600 + r() * 4400, a: 0.4 + r() * 0.6 }));
  return mono(norm(gen(dur, (t) => { let v = 0; for (const p of pings) { const d = t - p.t; if (d > 0) v += Math.sin(TAU * p.f * d) * Math.exp(-d * 18) * p.a; } return v; })));
}
/** 下坠的啁啾（Llama 暗下去） */
function fall(f0, f1, dur) {
  let ph = 0;
  return mono(norm(gen(dur, (t) => { const u = t / dur, f = f0 * Math.pow(f1 / f0, u); ph += (TAU * f) / SR; return Math.sin(ph) * Math.sin(Math.PI * u) ** 1.5 * (0.85 + 0.15 * Math.sin(TAU * 5 * t)); })));
}
const R = rng(2026);
const pan = (a = 0.3) => (R() * 2 - 1) * a;

/* ============================================================ S1 冷开场 */
place(pad([D.D4 / 2, D.A4 / 2], 3.2, (u) => Math.sin(Math.PI * Math.min(u * 1.6, 1)) ** 2, 1), 0.2, 0.10, { fade: 0.8, tag: "open-air" });   // 暗场里一点空气，光扫过浮雕
place(swoosh(3.4, 260, 2600, 0.45, 11), C[2].t0 - 0.4, 0.24, { fade: 0.6, tag: "pullback" });                       // 急速后拉
place(bell(D.D5, 2.6), C[3].t1 - 0.2, 0.10, { fade: 0.8, tag: "wide-reveal" });                                     // 全景展开
place(swoosh(2.6, 400, 1800, 0.7, 12), C[5].t0, 0.18, { fade: 0.4, tag: "dive-center" });                           // 冲向中心

/* ============================================================ S2 大爆炸 */
place(riser(C[8].t0 - C[7].t0, 120, 2400, 21), C[7].t0, 0.20, { fade: 0.02, tag: "shrink-rise" });                 // 亮点收缩、蓄势
place(boom(3.4, 44, 22), C[8].t0, 0.42, { fade: 0.8, tag: "big-bang" });                                            // 全片最重的一下
for (let i = 0; i < 8; i++) place(swoosh(0.7, 900, 4200, 0.3, 30 + i), C[9].t0 - 0.2 + i * 0.22, 0.12, { pan: (i / 7) * 1.2 - 0.6, rate: 0.95 + 0.04 * (i % 3), fade: 0.15, tag: "stream" });   // 八道光流
[0, 2, 4].forEach((k, j) => place(bell(PENTA[k], 1.6), C[10].t0 + 0.3 + j * 0.35, 0.08, { pan: pan(0.4), fade: 0.5, tag: "sesame" }));   // 掠过芝麻街星团

/* ============================================================ S3 名字 */
place(swoosh(2.0, 300, 2200, 0.6, 41), C[11].t0, 0.16, { fade: 0.4, tag: "to-gemini" });
{ // Gemma 宝石闪光：与 bodies.js 同源 —— 第 i 颗在 sin(1.6t + 1.9i) 的峰值处闪
  for (let i = 0; i < 4; i++) for (let k = -2; k < 40; k++) {
    const t = (Math.PI / 2 + TAU * k - i * 1.9) / 1.6;
    if (t > C[12].t0 && t < C[13].t1 + 0.5) place(bell(PENTA[(i + k) % PENTA.length] * 2, 1.2), t, 0.07, { pan: pan(0.5), fade: 0.4, tag: "gem-glint" });
  }
}
place(swoosh(2.2, 350, 2400, 0.55, 42), C[14].t0 - 0.4, 0.16, { fade: 0.4, tag: "to-trio" });
[D.D5, D.A4, D.D4].forEach((f, j) => place(bell(f, 2.0), [C[15].t0, C[15].t0 + 1.0, C[15].t0 + 2.1][j], 0.10, { fade: 0.6, tag: "trio-note" }));   // 俳句、十四行诗、长篇：由高到低
place(pad([D.D4 / 2, D.A4 / 2, D.D4], 3.0, (u) => Math.sin(Math.PI * u) ** 1.5, 7), C[16].t0 + 0.6, 0.14, { fade: 0.8, tag: "veil-open" });   // 面纱张开
place(swoosh(2.2, 300, 1600, 0.6, 43), C[18].t0 - 0.8, 0.14, { fade: 0.4, tag: "to-kimi" });
place(pad([D.Fs4, D.B4], 3.6, (u) => u ** 1.5 * (1 - u) ** 0.4 * 2.4, 8), C[18].t0 + 1.2, 0.10, { fade: 0.8, tag: "kimi-dark" });           // 绕到暗面，细光亮起

/* ============================================================ S4 转折 */
place(swoosh(1.8, 2600, 260, 0.25, 51), C[19].t0 - 0.3, 0.22, { fade: 0.4, tag: "retreat" });                     // 「可是」：急退
place(sparkle(4.0, 52, 46), C[22].t0, 0.12, { fade: 0.6, tag: "dust" });                                            // 穿过星尘
place(sparkle(3.0, 53, 30), C[23].t0 + 1.0, 0.10, { fade: 0.6, tag: "dust2" });
place(pad([D.D4 / 2, D.Fs4 / 2], 2.6, (u) => Math.sin(Math.PI * u), 9), C[24].t0 + 0.4, 0.14, { fade: 0.6, tag: "muse" });                 // 不透明的新星出现
place(fall(330, 150, 2.6), C[25].t0 - 0.1, 0.14, { fade: 0.4, tag: "llama-dim" });                                 // Llama 暗下去
place(sparkle(3.2, 54, 24), C[26].t0, 0.08, { fade: 0.8, tag: "dust-drift" });                                     // 星尘还在扩散
place(swoosh(2.4, 300, 2000, 0.65, 55), C[27].t0 - 1.9, 0.18, { fade: 0.4, tag: "to-gpt" });

/* ============================================================ S5 日地月 → Astra */
const sunrise = C[28].t0 + 1.0;
place(riser(1.6, 200, 3000, 61), sunrise - 1.6, 0.12, { fade: 0.02, tag: "sun-rise" });
place(pad([D.D4, D.Fs4, D.A4, D.D5], 3.4, (u) => Math.min(1, u * 6) * (1 - u) ** 0.8, 10), sunrise, 0.16, { fade: 1.0, tag: "sunrise" });  // 日出：明亮的长和弦
[0, 2, 3, 5].forEach((k, j) => place(bell(PENTA[k] * 2, 1.8), C[29].t0 + 0.6 + j * 0.28, 0.07, { pan: pan(0.5), fade: 0.5, tag: "astra" }));   // Astra 星簇

/* ============================================================ S6 新星 */
place(swoosh(3.0, 1800, 300, 0.5, 71), C[30].t0 - 0.4, 0.14, { fade: 0.6, tag: "pull-out" });
{ // 新星点亮：与 universe.js / film.js 同源 —— 46 颗，第 i 颗在 n0 + (n1 − n0)·√(i/N)
  const N = 46, n0 = C[30].t0, n1 = C[32].t0 + 1.5;
  for (let i = 0; i < N; i++) {
    const t = n0 + (n1 - n0) * Math.sqrt(i / N);
    if (t < CUT - 0.05) place(bell(PENTA[(i * 3) % PENTA.length] * (i % 4 === 0 ? 1 : 2), 1.4), t, 0.05 + 0.03 * (i / N), { pan: pan(0.7), fade: 0.4, tag: "nova" });
  }
}
place(pad([D.D4, D.A4, D.D5, D.Fs5], 6.5, (u) => u ** 1.2, 11), C[32].t0 - 0.5, 0.12, { fade: 0.05, tag: "question" });   // 问句下面慢慢涨起来，硬切时戛然而止

const r = await fx.finalize();
console.log("events", r.events, "peak before/after", r.pkBefore?.toFixed?.(3), r.pkAfter?.toFixed?.(3));
