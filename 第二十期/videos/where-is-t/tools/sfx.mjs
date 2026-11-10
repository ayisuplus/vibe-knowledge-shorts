// 第二十期拟音：只写「在什么时刻放什么」；合成与压限由共享引擎 tools/lib/sfx-engine.mjs 完成。
// 所有时刻都从 beats.js 的 C[k]（第 k 句字幕窗口）推出，与 sections.js 里画面的时刻同源（同样的偏移量）。
// 运行（仓库根目录）：node 第二十期/videos/where-is-t/tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { BEAT, C, CARD, DUR, SEC } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
// BGM 包络：拟音峰值上限随 BGM 当时的峰值下降，两轨相加不过 0 dBFS（同第十九期）
const bgm = resolve(here, "../assets/audio/bgm.m4a"), dt = 0.025, sr = 44100;
const buf = execFileSync("ffmpeg", ["-v", "error", "-i", bgm, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
const pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), size = Math.round(sr * dt), env = [];
for (let i = 0; i < pcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(pcm.length, i + size); j++) pk = Math.max(pk, Math.abs(pcm[j])); env.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt), peak = Math.max(env[i - 1] || 0, env[i] || 0, env[i + 1] || 0); return Math.max(0.06, Math.min(0.42, 0.88 - peak)); };
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: 0.42, master: 1.7, tail: 0.6, limitAt });
const { gen, mono, norm, rng, biquadBP, place, tick, knock, pop, blip, bell, pluck, drone, creak } = fx;
const TAU = Math.PI * 2;

// ── 本期合成件 ──
const noise = (d, seed) => { const r = rng(seed); return gen(d, () => r() * 2 - 1); };
// 呼啸：带通噪声，中心频率从 f0 滑到 f1，包络先起后落
function whoosh(d, f0, f1, seed = 3) {
  const x = noise(d, seed), y = new Float32Array(x.length), seg = 256;
  for (let i = 0; i < x.length; i += seg) {
    const u = i / x.length, f = f0 * Math.pow(f1 / f0, u);
    const lo = Math.max(0, i - 512), part = biquadBP(x.slice(lo, i + seg), f, 1.4);
    for (let j = 0; j < seg && i + j < y.length; j++) y[i + j] = part[i - lo + j] * Math.sin(Math.PI * Math.min(1, (i + j) / x.length)) ** 1.6;
  }
  return mono(norm(y));
}
const sub = mono(norm(gen(1.2, (t) => Math.exp(-t * 3.2) * Math.min(1, t / 0.004) * (Math.sin(TAU * (48 + 30 * Math.exp(-t * 9)) * t) + 0.3 * Math.sin(TAU * 96 * t) * Math.exp(-t * 8)))));
const thud = mono(norm(gen(0.5, (t) => Math.exp(-t * 9) * Math.min(1, t / 0.003) * Math.sin(TAU * (70 + 40 * Math.exp(-t * 20)) * t))));
const shatter = (() => { const r = rng(91); const hi = [2637, 3136, 3520, 4186, 4699]; return mono(norm(gen(1.4, (t) => { let v = (r() * 2 - 1) * Math.exp(-t * 7) * 0.7; for (let k = 0; k < hi.length; k++) { const t0 = k * 0.045; if (t > t0) v += 0.35 * Math.sin(TAU * hi[k] * (t - t0)) * Math.exp(-(t - t0) * (9 + k)); } return v * Math.min(1, t / 0.002); }))); })();
const err = mono(norm(gen(0.32, (t) => Math.min(1, t / 0.004) * Math.exp(-t * 9) * (t < 0.14 ? Math.sin(TAU * 392 * t) : Math.sin(TAU * 311 * t)))));
const page = (() => { const x = biquadBP(noise(0.35, 51), 2400, 0.7); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(TAU * 9 * u)); } return mono(norm(x)); })();
const scratch = (() => { const x = biquadBP(noise(0.45, 61), 3800, 2.2); for (let i = 0; i < x.length; i++) { const u = i / x.length; x[i] *= Math.min(1, u * 12) * (1 - u) * (0.5 + 0.5 * Math.abs(Math.sin(TAU * 14 * u))); } return mono(norm(x)); })();
const rewind = mono(norm(gen(2.9, (t) => { const u = t / 2.9, f = 900 * Math.pow(0.18, u); return Math.sin(TAU * f * t * (1 + 0.15 * Math.sin(TAU * 7 * t))) * Math.sin(Math.PI * u) ** 0.8; })));
const bloop = mono(norm(gen(0.5, (t) => Math.exp(-t * 7) * Math.min(1, t / 0.003) * Math.sin(TAU * (1300 * Math.exp(-t * 14) + 260) * t))));
const riseTone = (d) => mono(norm(gen(d, (t) => { const u = t / d; return Math.sin(TAU * (330 + 330 * u * u) * t) * Math.sin(Math.PI * u) ** 1.2; })));
const swell = (d, f = [174.6, 261.6, 349.2]) => drone(f, d, (u) => Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 1.5);
const ping = mono(norm(gen(0.7, (t) => Math.min(1, t / 0.002) * Math.exp(-t * 6) * (Math.sin(TAU * 1568 * t) + 0.3 * Math.sin(TAU * 3136 * t)))));

const P = (s, t, g, tag, pan = 0, o = {}) => place(s, t, g, { tag, pan, ...o });
const r = rng(7);
const keys = (t0, n, cps, g = 0.05, pan = -0.2) => { for (let i = 0; i < n; i++) P(tick, t0 + i / cps, g * (0.8 + 0.4 * r()), "key", pan + (r() - 0.5) * 0.2, { rate: 0.85 + 0.3 * r() }); };
const F = [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25];   // F 小调音阶，跟 BGM 同调

// ══ S1 ══（偏移量与 sections.js 一致）
const T1 = C[1].t0 + 0.3, T2 = C[2].t0 + 0.15, T3 = C[3].t0 + 0.4, ME = C[3].t0 + 0.7, SQ = C[4].t0 + 0.3;
keys(T1, 10, 9, 0.07);
{ let acc = T2; for (const n of [14, 10, 18, 1]) { keys(acc, n, 16, 0.055); acc += n / 16 + 0.08; } }
keys(T3, 26, 15, 0.055);
for (let t = T2; t < C[12].t0; t += BEAT) P(tick, t, 0.022, "beat", 0.35, { rate: 1.6 });   // t 每跳一拍一声极轻的滴答
P(pop, ME, 0.11, "me", 0.3);
P(err, SQ, 0.09, "error"); P(blip, SQ + 0.5, 0.06, "tip", 0.3, { rate: 0.75 });
// ══ S2 ══
P(sub, SEC.s2[0], 0.24, "hit"); P(bell(F[0], 2.2), SEC.s2[0], 0.08, "hit");
P(whoosh(1.4, 300, 2400, 5), C[5].t0 + 0.2, 0.09, "beam");
P(whoosh(1.8, 500, 1500, 6), C[6].t0, 0.07, "book"); P(page, C[6].t0 + 1.1, 0.08, "page", -0.2);
for (let i = 0; i < 3; i++) P(pluck(F[3 + i * 2], 10 + i).snd, C[7].t0 + 0.15 + i * 0.97, 0.07, "quote", -0.3 + i * 0.3);
P(blip, C[8].t0 + 0.15, 0.06, "global");
P(swell(3.0), C[8].t0 + 1.2, 0.1, "clock-rise");
for (const [k, n] of [[0.6, 1], [1.4, 2], [2.2, 3]]) for (let j = 0; j < n * 2; j++) P(tick, C[9].t0 + k + j * 0.06, 0.045, "engrave", (j % 2 ? 0.2 : -0.2), { rate: 1.3 });
P(blip, C[10].t0 + 0.3, 0.05, "label"); P(blip, C[10].t0 + 2.8, 0.05, "label", 0, { rate: 1.12 });
P(bell(F[2], 2.4), C[11].t0 + 0.3, 0.09, "sec");
// ══ S3 ══
P(creak(0.5), C[12].t0, 0.05, "shake");
P(shatter, C[12].t0 + 0.55, 0.2, "shatter"); P(sub, C[12].t0 + 0.55, 0.22, "hit");
for (let i = 0; i < 28; i++) P(tick, C[12].t0 + 2.2 + i * 0.07 + r() * 0.05, 0.035, "land", (r() - 0.5) * 1.2, { rate: 1.1 + 0.6 * r() });
for (let i = 0; i < 16; i++) P(tick, C[14].t0 + 0.2 + i * 0.31, 0.028, "clocks", (i % 2 ? 0.5 : -0.5), { rate: 0.8 + 0.8 * r() });
keys(C[15].t0 + 0.25, 52, 17, 0.045, 0.2);
P(bell(F[5], 2), C[16].t0 + 0.1, 0.08, "me-clock", 0.2);
P(whoosh(2.0, 200, 1800, 7), C[17].t0, 0.09, "fly");
P(whoosh(2.2, 400, 1200, 8), C[18].t0 + 0.3, 0.07, "east", 0.6); P(whoosh(2.2, 1200, 400, 9), C[18].t0 + 2.5, 0.07, "west", -0.6);
for (let i = 0; i < 3; i++) P(pop, C[19].t0 + i * 0.15, 0.07, "trio", -0.5 + i * 0.5, { rate: 1 + i * 0.12 });
for (let i = 0; i < 6; i++) { P(tick, C[19].t0 + 1 + i * 0.5, 0.03, "tick-a", -0.5); P(tick, C[19].t0 + 1.12 + i * 0.47, 0.03, "tick-b", 0.5, { rate: 1.3 }); }
P(whoosh(1.6, 250, 1600, 10), C[19].t1 - 0.3, 0.08, "fly");
P(riseTone(1.2), C[20].t0 + 1.4, 0.05, "lift", 0.3);
for (let i = 0; i < 6; i++) { P(tick, C[21].t0 + i * 0.55, 0.03, "low", -0.4); P(tick, C[21].t0 + i * 0.47, 0.03, "high", 0.4, { rate: 1.4 }); }
P(whoosh(1.5, 300, 1500, 11), C[22].t0 - 0.2, 0.07, "fly"); P(blip, C[22].t0 + 0.5, 0.06, "gps", -0.2, { rate: 1.5 });
for (let i = 0; i < 8; i++) P(ping, C[23].t0 + 0.2 + i * BEAT, 0.035 * (i === 0 ? 1.6 : 1), "sat", 0.5);
P(riseTone(3.6), C[24].t0 + 0.4, 0.045, "drift", -0.2);
// ══ S4 ══
P(knock, C[25].t0 + 0.2, 0.09, "strike"); P(sub, C[25].t0 + 0.2, 0.18, "hit");
keys(C[25].t0 + 0.6, 30, 26, 0.04);
P(whoosh(4.0, 1600, 120, 12), C[26].t0, 0.1, "dive");
for (let i = 0; i < 4; i++) P(scratch, C[27].t0 + 0.3 + i * 0.65, 0.06, "write", -0.3 + i * 0.2);
P(tick, C[29].t0, 0.06, "search-key");
for (let i = 0; i < 4; i++) P(tick, C[29].t0 + 0.25 + i * 0.35, 0.04, "scan", -0.3 + i * 0.2, { rate: 1.5 });
P(thud, C[29].t0 + 1.7, 0.2, "no-match"); P(err, C[29].t0 + 1.7, 0.05, "no-match", 0, { rate: 0.8 });
// C30：拟音全部收住（「宇宙是静止的」）
for (let i = 0; i < 6; i++) P(tick, C[31].t0 + 0.3 + i * BEAT, 0.018, "caret", 0, { rate: 2 });
P(bell(F[6], 2), C[32].t0 + 0.3, 0.08, "ring", -0.3);
for (let i = 0; i < 3; i++) P(pluck(F[4 + i], 30 + i).snd, C[33].t0 + 0.2 + i * 0.4, 0.06, "entangle", -0.4 + i * 0.4);
P(whoosh(3.8, 600, 2000, 13), C[34].t0 + 0.3, 0.05, "sweep");
for (let i = 0; i < 10; i++) P(tick, C[34].t0 + 0.5 + i * 0.36, 0.03, "pass", r() - 0.5, { rate: 1.2 + 0.4 * r() });
for (let i = 0; i < 18; i++) P(tick, C[35].t0 + 0.6 + (i / 17) * 3.6, 0.03, "frame", -0.6 + (i / 17) * 1.2, { rate: 1.6 });
for (let i = 0; i < 3; i++) { P(bell(F[7], 1.2), C[36].t0 + 0.6 + i * 1.3, 0.045, "photon-a", -0.6); P(bell(F[8], 1.2), C[36].t0 + 1.05 + i * 1.3, 0.045, "photon-b", 0.6); }
P(sub, C[37].t0, 0.22, "hit"); for (let i = 0; i < 10; i++) P(tick, C[37].t0 + i / 30, 0.04, "backspace", 0, { rate: 0.7 });
keys(C[37].t0 + 0.45, 32, 34, 0.04);
// ══ S5 ══
const R0 = C[39].t0 + 0.35;
P(blip, C[38].t0 + 0.4, 0.06, "timeline");
P(rewind, R0, 0.11, "rewind");
P(thud, C[40].t0, 0.16, "cut");
P(bloop, C[40].t0 + 0.5, 0.11, "drop"); P(whoosh(3.2, 900, 300, 14), C[40].t0 + 0.6, 0.035, "ink");
P(riseTone(1.0), C[41].t0 + 0.3, 0.05, "entropy");
for (let i = 0; i < 5; i++) keys(C[42].t0 + 0.3 + i * 0.6, 6, 30, 0.035, 0.3);
for (let i = 0; i < 6; i++) P(tick, C[43].t0 + i * BEAT, 0.018, "caret", 0, { rate: 2 });
// ══ S6 ══
P(sub, SEC.s6[0], 0.2, "hit"); P(swell(6.5, [174.6, 261.6, 349.2, 523.3]), SEC.s6[0] + 0.2, 0.11, "rise");
for (let i = 0; i < 14; i++) P(bell(F[3 + (i % 6)], 1.4), SEC.s6[0] + 0.6 + i * 0.32, 0.03, "light", (r() - 0.5) * 1.4);
P(pop, CARD.t0, 0.06, "card");
P(bell(F[5], 3), C[45].t0, 0.08, "question"); P(bell(F[8], 3), C[45].t0 + 0.04, 0.05, "question");

const res = await fx.finalize();
console.log(`拟音 ${res.events} 事件；峰值 ${res.pkBefore.toFixed(3)} → ${res.pkAfter.toFixed(3)}；五秒窗口 ${res.bins.join(",")}`);
