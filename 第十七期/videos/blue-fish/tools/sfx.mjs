// 第十七期拟音脚本：只写「在第几拍放什么」。合成 / 混响 / 压限 / 写文件全部来自共享引擎 tools/lib/sfx-engine.mjs。
// 事件时间一律由 beats.js 的 B(n) 算出，与 sections.js 里的同一批拍号同源（改了画面节奏，要把这里同步一遍再重跑）。
// 素材策略：本期**全部合成**，不用历期 sfx/raw（那些样本的响点常不在开头，见 BRIEF）；起音恒在 t = 0，riser 最响处在末尾。
// 没有用任何生成式模型。调式：bgm-270 为 F 小调，拨弦 / 铃取 F 小调五声音阶 F  A♭ B♭ C E♭。
// 电平：拟音每一刻的峰值上限 = 0.90 − 当时 BGM 的峰值（再夹在 0.10–0.45 之间），相加后峰值留在 −1 dBFS 以内。
// A 句语音不在本轨（单独的 assets/audio/voice.m4a）。
// 用法（在 videos/blue-fish 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
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
const { place, mono, norm, gen, rng, SR } = fx;
const TAU = Math.PI * 2;
const NOTE = { A3b: 207.65, B3b: 233.08, C4: 261.63, E4b: 311.13, F4: 349.23, A4b: 415.3, B4b: 466.16, C5: 523.25, E5b: 622.25, F5: 698.46, A5b: 830.61, B5b: 932.33, C6: 1046.5 };
const PENTA = [NOTE.F4, NOTE.A4b, NOTE.B4b, NOTE.C5, NOTE.E5b, NOTE.F5, NOTE.A5b, NOTE.B5b, NOTE.C6];

/* ============================================================ 合成件（与第十六期同一套写法） */
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
/** 「嗖」：噪声过扫频带通，音量在 peak（0–1）处最大 */
function swoosh(dur, fA, fB, peak = 0.4, seed = 1) {
  const y = svfSweep(noise(dur, seed), fA, fB, 1.8), N = y.length;
  for (let i = 0; i < N; i++) { const u = i / N, e = u < peak ? Math.sin((Math.PI / 2) * (u / peak)) ** 2 : Math.cos((Math.PI / 2) * ((u - peak) / (1 - peak))) ** 1.5; y[i] *= e; }
  return mono(norm(y));
}
/** 蓄势：最响在末尾（放在「事件时刻 − dur」） */
function riser(dur, fA, fB, seed = 2) {
  const y = svfSweep(noise(dur, seed), fA, fB, 2.4), N = y.length;
  let ph = 0;
  for (let i = 0; i < N; i++) { const u = i / N; ph += (TAU * (fA * 0.5 + (fB * 0.5 - fA * 0.5) * u * u)) / SR; y[i] = (y[i] + 0.55 * Math.sin(ph)) * u ** 2.2 * Math.min(1, (N - i) / (0.004 * SR)); }
  return mono(norm(y));
}
/** 冲击：低频下坠正弦 + 起音噪粒 + 倍频 */
function impact(dur = 1.4, f0 = 62, seed = 3) {
  const r = rng(seed);
  return mono(norm(gen(dur, (t) => {
    const sub = Math.sin(TAU * (f0 * t + (f0 * 2.2 * (1 - Math.exp(-t * 16))) / 16)) * Math.exp(-t * 3.4);
    const body = Math.sin(TAU * f0 * 2.01 * t) * Math.exp(-t * 7) * 0.35;
    const click = (r() * 2 - 1) * Math.exp(-t * 85) * 0.6;
    return Math.min(1, t / 0.002) * (sub + body + click);
  })));
}
/** 闷响（短） */
function thump(dur = 0.45, f0 = 96, seed = 4) {
  const r = rng(seed);
  return mono(norm(gen(dur, (t) => Math.min(1, t / 0.0015) * (Math.sin(TAU * (f0 * t + (f0 * 0.8 * (1 - Math.exp(-t * 30))) / 30)) * Math.exp(-t * 15) + (r() * 2 - 1) * Math.exp(-t * 160) * 0.35))));
}
/** 撕纸：带通噪声，两段（撕—拉），带颗粒 */
function tearSyn(seed = 9) {
  const r = rng(seed), dur = 0.62, base = svfSweep(noise(dur, seed), 2600, 1400, 1.2), N = base.length;
  let g = 0;
  for (let i = 0; i < N; i++) { const t = i / SR; if (r() < 0.004) g = 1; g *= 0.996; const env = (t < 0.22 ? Math.sin(Math.PI * t / 0.22) : 0.7 * Math.sin(Math.PI * Math.min(1, (t - 0.22) / 0.4))) ; base[i] *= env * (0.55 + 0.45 * g); }
  return mono(norm(base));
}
/** 高频闪烁 */
function sparkle(dur = 1.0, seed = 8, n = 16) {
  const r = rng(seed), pings = Array.from({ length: n }, () => ({ t: r() ** 1.6 * dur * 0.8, f: 2400 + r() * 4600, a: 0.4 + r() * 0.6 }));
  return mono(norm(gen(dur, (t) => { let v = 0; for (const p of pings) { const d = t - p.t; if (d > 0) v += Math.sin(TAU * p.f * d) * Math.exp(-d * 24) * p.a; } return v; })));
}
/** 啁啾（上升 / 下降） */
function chirp(f0, f1, dur, shape = (u) => u * u) {
  let ph = 0;
  return mono(norm(gen(dur, (t) => { const u = t / dur, f = f0 + (f1 - f0) * u * u; ph += (TAU * f) / SR; return Math.sin(ph) * shape(u) * (0.8 + 0.2 * Math.sin(TAU * 7 * t)); })));
}
const R = rng(1717);
const pan = (a = 0.3) => (R() * 2 - 1) * a;
const bellAt = (n, hz, gain, o = {}) => place(fx.bell(hz, o.d || 1.6), B(n), gain, { fade: 0.5, ...o });
function pluckAt(n, hz, gain, o = {}) { const p = fx.pluck(hz, Math.round(hz) + (o.seed || 0)); place(p.snd, B(n), gain, { rate: hz / p.f, fade: 0.25, ...o }); }
const popAt = (n, gain = 0.16, rate = 1, o = {}) => place(fx.pop, B(n), gain, { rate, pan: pan(0.35), ...o });
const tickRun = (n0, n1, step, gain = 0.07, tag = "type") => { for (let n = n0; n < n1 - 1e-6; n += step) place(fx.tick, B(n), gain * (0.8 + 0.4 * R()), { rate: 0.9 + 0.3 * R(), pan: pan(0.2), tag }); };
const LUB = thump(0.32, 58, 41), DUB = thump(0.28, 64, 42);
const heart = (n, gain = 0.2) => { place(LUB, B(n), gain, { tag: "heart" }); place(DUB, B(n) + 0.17, gain * 0.7, { tag: "heart" }); };

/* ============================================================ S1 冷开场 n0–n24 */
place(swoosh(0.5, 2600, 500, 0.7, 11), 0.0, 0.10, { tag: "card-fall" });
place(thump(0.45, 90, 12), 0.42, 0.26, { tag: "card-land" });
heart(1.6, 0.14); heart(3.6, 0.12);
place(fx.blip, B(7), 0.10, { tag: "chat" });
popAt(7.5, 0.12, 1.1);
tickRun(10, 12.2, 0.25, 0.07);
bellAt(12.2, NOTE.F5, 0.13, { tag: "result" });
tickRun(13, 15.4, 0.25, 0.05);
bellAt(15.4, NOTE.C6, 0.06, { tag: "self" });
[0, 1, 2, 3, 4, 5].forEach((i) => popAt(16 + i * 0.5, 0.17, 0.9 + i * 0.08, { tag: "sticker" }));
place(swoosh(0.8, 500, 2400, 0.6, 13), B(22), 0.08, { tag: "push" });
place(swoosh(0.9, 2400, 600, 0.35, 14), B(23.5), 0.10, { tag: "fly" });

/* ============================================================ S2 溯源 n24–n54 */
place(swoosh(1.1, 400, 2600, 0.5, 21), B(24), 0.09, { pan: -0.3, tag: "line" });
popAt(26, 0.12, 1.2);
bellAt(30, NOTE.C5, 0.14, { tag: "node" }); popAt(30, 0.12);
popAt(38, 0.14); tickRun(38.5, 43, 0.5, 0.06, "prog"); bellAt(43, NOTE.E5b, 0.12, { tag: "done" });
place(swoosh(1.0, 800, 2000, 0.5, 22), B(44.5), 0.08, { pan: -0.4, tag: "slide" });
popAt(46, 0.14); bellAt(46, NOTE.F5, 0.10);
place(swoosh(0.6, 900, 2200, 0.5, 23), B(47), 0.07, { tag: "merge" });
place(impact(1.0, 80, 24), B(48), 0.16, { tag: "viral" }); bellAt(48, NOTE.A5b, 0.12); bellAt(48, NOTE.C5, 0.10);
place(sparkle(1.2, 25), B(48), 0.08);
for (let i = 0; i < 8; i++) popAt(49.6 + i * 0.18, 0.12, 0.8 + i * 0.07, { tag: "meme" });
place(swoosh(0.9, 2600, 500, 0.4, 26), B(52.5), 0.09, { tag: "collapse" });

/* ============================================================ S3 机制 n54–n150 */
place(swoosh(0.7, 600, 2400, 0.6, 31), B(53.6), 0.08);
for (let i = 0; i < 6; i++) popAt(54 + i * 0.35, 0.13, 0.95 + i * 0.05, { tag: "sticker" });
for (let i = 0; i < 6; i++) pluckAt(56 + i * 0.5, PENTA[2 + i], 0.15, { tag: "feature", seed: i });
place(impact(1.4, 60, 32), B(60), 0.24, { tag: "quote" }); bellAt(60, NOTE.F5, 0.12); bellAt(60, NOTE.C5, 0.10);
place(swoosh(1.5, 1200, 3000, 0.5, 33), B(61), 0.05, { tag: "circle" });
place(thump(0.4, 110, 34), B(61.5), 0.18, { tag: "seal" });
[65.5, 66, 66.5].forEach((n, i) => { popAt(n, 0.14, 1 + i * 0.1); pluckAt(n, PENTA[3 + i * 2], 0.10); });
place(swoosh(0.9, 500, 2200, 0.6, 35), B(70.5), 0.08, { tag: "zoom" });
// ELIZA：打字
tickRun(72.5, 73.5, 0.125); tickRun(74, 75.6, 0.125); tickRun(76, 77, 0.125); tickRun(78, 79.6, 0.125);
place(fx.blip, B(81), 0.09, { rate: 0.9, tag: "link" }); place(fx.blip, B(82.2), 0.09, { rate: 1.1, tag: "link" });
popAt(81.5, 0.12);
place(thump(0.5, 70, 36), B(86), 0.12, { tag: "person" });
place(riser(2.6, 300, 1600, 37), B(92.5) - 2.6, 0.05, { tag: "fill" }); bellAt(92.5, NOTE.A4b, 0.10);
// 婴儿图式
place(swoosh(0.8, 2200, 700, 0.4, 38), B(94.6), 0.08);
[96, 97, 98].forEach((n, i) => place(swoosh(0.5, 1800 + i * 200, 2600, 0.5, 39 + i), B(n), 0.05, { tag: "pen" }));
for (let i = 0; i < 4; i++) popAt(96 + i * 0.75, 0.11, 1 + i * 0.05);
popAt(102.6, 0.10);
place(fx.tick, B(103.5), 0.10); place(chirp(500, 1300, 0.45, (u) => Math.sin(Math.PI * u)), B(107.4), 0.07, { tag: "needle" }); bellAt(107.6, NOTE.C5, 0.10);
place(swoosh(0.7, 600, 2000, 0.6, 44), B(110.8), 0.08);
popAt(111.5, 0.10);
place(chirp(500, 1300, 0.45, (u) => Math.sin(Math.PI * u)), B(115.6), 0.06);
place(impact(1.1, 72, 45), B(116), 0.16, { tag: "lamp" }); bellAt(116, NOTE.F5, 0.14); bellAt(116, NOTE.A5b, 0.09);
// 恐怖谷
tickRun(119.5, 125, 0.5, 0.06, "curve");
for (let i = 0; i < 5; i++) popAt(119.6 + i * (i < 3 ? 1.6 : 2.6), 0.11, 0.9 + i * 0.06);
place(chirp(900, 160, 1.1, (u) => (1 - u) ** 0.6 * Math.min(1, u * 20)), B(127.6), 0.10, { tag: "drop" });
place(thump(0.6, 50, 46), B(129.2), 0.20, { tag: "valley" });
place(chirp(300, 1100, 0.4, (u) => Math.sin(Math.PI * u)), B(134), 0.08, { tag: "bounce" }); bellAt(134.8, NOTE.E5b, 0.12);
popAt(134.6, 0.12); place(thump(0.4, 110, 47), B(135.6), 0.16, { tag: "seal" });
// 三者合一
for (let i = 0; i < 3; i++) popAt(142.4 + i * 0.25, 0.11);
[NOTE.C5, NOTE.E5b, NOTE.F5].forEach((hz, i) => bellAt(143.6 + i * 0.5 + 0.4 / 0.53116, hz, 0.12, { tag: "trio" }));
place(sparkle(1.4, 48), B(145), 0.08);

/* ============================================================ S4 反转 n150–n210 */
[150, 150.5, 151].forEach((n, i) => popAt(n, 0.15, 1 + i * 0.1, { tag: "say" }));
place(tearSyn(51), B(155), 0.22, { tag: "tear" }); place(thump(0.4, 90, 52), B(155.2), 0.18, { tag: "logo-back" });   // 撕开 → 露出没脸的 Logo
place(swoosh(0.8, 2200, 600, 0.4, 53), B(161.5), 0.08, { tag: "logo-away" });
[162.4, 162.8, 163.2].forEach((n, i) => popAt(n, 0.12, 0.95 + i * 0.07));
[164, 172, 180].forEach((n, i) => { place(swoosh(0.45, 900, 2600, 0.5, 54 + i), B(n) - 0.25, 0.07, { tag: "flip" }); bellAt(n, PENTA[3 + i], 0.12); });
place(thump(0.4, 90, 57), B(166.6), 0.10, { tag: "stencil" });
place(sparkle(1.0, 58), B(174.4), 0.06);
place(chirp(400, 900, 0.8, (u) => Math.sin(Math.PI * u)), B(181), 0.04, { tag: "ghost" });
place(swoosh(0.7, 600, 2200, 0.6, 63), B(187.2), 0.07, { tag: "logo-center" }); pluckAt(188.6, NOTE.C5, 0.08, { tag: "reform" });
place(swoosh(1.6, 1600, 400, 0.5, 59), B(189.5), 0.07, { tag: "turn" });
for (let n = 192; n <= 198; n += 1) heart(n, 0.10 + (n - 192) * 0.02);
place(riser(1.2, 300, 3000, 60), B(200) - 1.2, 0.12, { tag: "pre-hit" });
place(impact(1.8, 52, 61), B(200), 0.38, { tag: "HIT" }); bellAt(200, NOTE.F5, 0.16, { d: 2.4 }); bellAt(200, NOTE.C5, 0.14, { d: 2.4 }); bellAt(200, NOTE.A5b, 0.08, { d: 2.4 });
place(sparkle(1.6, 62, 24), B(200), 0.10);
for (let n = 202; n < 210; n += 2) heart(n, 0.10);

/* ============================================================ S5 现实 n210–n241 */
for (let i = 0; i < 5; i++) popAt(210 + i * 0.4, 0.13, 0.9 + i * 0.08, { tag: "split" });
place(swoosh(0.7, 600, 2200, 0.6, 71), B(217.6), 0.08);
place(fx.drone([NOTE.F4 / 4, NOTE.C4 / 2], B(8), (u) => Math.sin(Math.PI * Math.min(1, u * 1.2)) ** 0.6), B(218), 0.07, { tag: "standoff" });
[226, 226.5].forEach((n, i) => popAt(n, 0.15, 1 + i * 0.12, { tag: "canon" }));
place(sparkle(0.8, 72, 10), B(227), 0.07);
place(swoosh(0.6, 2600, 800, 0.6, 73), B(228.6), 0.08);
place(thump(0.4, 100, 74), B(229.4), 0.12);
place(thump(0.45, 120, 75), B(230), 0.22, { tag: "stamp" });
for (let i = 0; i < 4; i++) place(chirp(500 + i * 60, 1400 + i * 120, 0.35, (u) => Math.sin(Math.PI * u)), B(234.3 + i * 0.5), 0.06, { pan: [-0.5, -0.2, 0.2, 0.5][i], tag: "arrow" });

/* ============================================================ S6 回响 n241–n300.3（问句 → 她的独白 → 去拥抱明天 → 硬切） */
place(swoosh(0.8, 500, 2400, 0.6, 81), B(240.6), 0.08); bellAt(241, NOTE.C5, 0.10);
heart(242.5, 0.10); heart(244.5, 0.11); heart(246.5, 0.12);
place(riser(1.2, 300, 3000, 82), B(248) - 1.2, 0.12, { tag: "pre-q" });
place(impact(1.6, 56, 83), B(248), 0.28, { tag: "Q" }); bellAt(248, NOTE.F5, 0.13, { d: 2.0 }); bellAt(248, NOTE.C6, 0.07, { d: 2.0 });
// 独白：每句起头一声很轻的拨弦，「影子」与「碰不到」各一记轻心跳；贴纸散掉时一串闪烁
[[254, NOTE.C5], [260, NOTE.A4b], [267, NOTE.F4], [274, NOTE.E5b], [282, NOTE.C5]].forEach(([n, hz], i) => pluckAt(n, hz, 0.07, { tag: "voice", seed: 300 + i }));
heart(260.5, 0.08); heart(267.5, 0.08);
for (let i = 0; i < 6; i++) place(sparkle(0.6, 90 + i, 6), B(276.5 + i * 0.75), 0.035, { pan: pan(0.5), tag: "forget" });
for (let i = 0; i < 22; i++) pluckAt(256 + i * 1.5, PENTA[(i * 3) % PENTA.length], 0.035, { tag: "bloom", seed: 100 + i });
// 去拥抱明天：音乐在 n292 抬起，晨光、满屏花开，一路亮到最后一闪
place(riser(2.2, 250, 3600, 84), B(291) - 2.2, 0.13, { tag: "pre-dawn" });
place(impact(1.8, 60, 85), B(291), 0.22, { tag: "dawn" }); bellAt(291, NOTE.F5, 0.14, { d: 2.4 }); bellAt(291, NOTE.C5, 0.12, { d: 2.4 }); bellAt(291, NOTE.A5b, 0.07, { d: 2.4 });
for (let i = 0; i < 26; i++) pluckAt(291.5 + 8 * Math.pow(i / 26, 0.8), PENTA[(i * 2) % PENTA.length], 0.05, { seed: 200 + i, tag: "bloom2" });
place(sparkle(2.4, 86, 30), B(291.5), 0.09);
place(riser(0.5, 1200, 6000, 87), DUR - 0.4 - 0.5 + 0.3, 0.10, { tag: "flash" });

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR}s；峰值 ${r.pkBefore?.toFixed?.(3)} → ${r.pkAfter?.toFixed?.(3)}`);
