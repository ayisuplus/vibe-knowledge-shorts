// 本期拟音脚本：只负责「在第几拍放什么」。合成、压限、写文件全部来自共享引擎。
// 用法（在 videos/anxiety-3d 下）：node tools/sfx.mjs
// 落点和画面同源（assets/js/score.js），改文案不用改这里。全部合成，不用历期素材。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";
import * as P from "../assets/js/score.js";

const { A, Z, HARD, HITS, Q_N, CARD_N, END_N } = P;
const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
// 拟音峰值跟着 BGM 走：BGM 响的地方让一让（BGM 和拟音是两条轨直接相加，没有总线压限）
const bgm = resolve(here, "../assets/audio/bgm.m4a"), dt = .025, sr = 44100;
const buf = execFileSync("ffmpeg", ["-v", "error", "-i", bgm, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
const pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), size = Math.round(sr * dt), env = [];
for (let i = 0; i < pcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(pcm.length, i + size); j++) pk = Math.max(pk, Math.abs(pcm[j])); env.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt), peak = Math.max(env[i - 1] || 0, env[i] || 0, env[i + 1] || 0); return Math.max(.08, Math.min(.42, .9 - peak)); };
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: .42, master: 1.25, tail: .08, limitAt });
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
const F = { f4: 349.23, ab4: 415.3, c5: 523.25, eb5: 622.25, f5: 698.46 };
const whoosh = (n, g = .12) => put(fx.creak(.42, Math.round(n * 9) + 3), n, g, "whoosh", Math.sin(n) * .5, 1.6);
const beep = (n, g = .05) => { put(fx.blip, n, g, "alarm"); put(fx.blip, n + .5, g * .8, "alarm"); };
const roll = (n, beats, g = .04, pan = 0) => { for (let i = 0; i < beats * 3; i++) put(fx.tick, n + i / 3, g, "roll", pan); };

// 所有重击点：低音一下；强重击更重。「一会儿安静」那几拍在 HITS 里本来就没有。
for (const [h, w] of HITS) { const hard = w === 1; put(fx.knock, h, hard ? .3 : .15, "hit", 0, .55); put(fx.tick, h, hard ? .08 : .04, "hit"); }

// ── S1 ──
beep(0, .06); beep(1, .06); whoosh(1.2); whoosh(3); whoosh(5, .15); whoosh(7.4);
for (let i = 0; i < 12; i++) put(fx.knock, A(2) + .1 + i * .34, .07, "part", (i % 2) - .5, 1.2);
put(fx.bell(F.f5, 1.6), P.ALARM_SLAM, .07, "ring");
for (let n = P.AI_SLAM; n < P.DIVE - 1; n += 1) put(fx.blip, n, .045, "alarm");
whoosh(P.DIVE - 1.4, .16);
// ── S2 ──
roll(A(4) + .4, 3.2, .035, -.2); put(fx.bell(F.f4, 2), P.N54_SLAM, .08, "ring");
whoosh(A(5), .14); roll(P.N62_SMASH - 3, 3, .045, .2); whoosh(P.N62_SMASH - 1, .18); put(fx.bell(F.f5, 2), P.N62_SMASH, .09, "ring");
for (let i = 0; i < 18; i++) put(fx.pop, P.STORM + i * .33, .03, "tag", Math.sin(i) * .7);
roll(P.YEAR + .7, 5, .05);
// ── S3 ──
whoosh(A(8), .12); for (let i = 0; i < 5; i++) put(fx.creak(.2, 40 + i), P.WORD0 - 2.2 + i * .44, .08, "flip", .2);
for (let i = 0; i < 9; i++) put(fx.tick, P.WORD0 + i * .48, .09, "letter", -.4 + i * .1);
whoosh(A(9) + 3, .12); whoosh(P.XUEMING - 1.4, .18); put(fx.bell(F.ab4, 1.6), P.XUEMING, .07, "stamp");
roll(A(10) + 3, 4, .04, .1); put(fx.bell(F.c5, 1.6), P.M500, .08, "num");
for (let i = 0; i < 10; i++) put(fx.creak(.14, 70 + i), P.M500 + i * .22, .04, "paper", Math.cos(i) * .7);
for (const at of P.STAMPS) put(fx.knock, at, .2, "stamp", 0, .62);
// ── S4 ──
put(fx.creak(.5, 11), P.EXPLODE, .1, "open"); put(fx.pop, P.SMOKE + .4, .08, "toast", -.3);
for (const k of [2, 2.5, 3, 3.5]) put(fx.blip, P.SMOKE + k, .045, "alarm", .4);
put(fx.drone([62, 93, 124], 2.4, (u) => Math.sin(Math.PI * Math.min(1, u)) ** .6, 7), P.FIRE, .16, "fire");
for (let i = 0; i < 6; i++) put(fx.creak(.3, 90 + i), P.FIRE + i * .5, .08, "fire", Math.sin(i));
whoosh(A(14), .12); whoosh(A(15), .13); whoosh(A(15) + 1.6, .13); put(fx.bell(F.eb5, 1.6), P.CLICK, .07, "click"); whoosh(P.WHIP, .16);
// ── S5 ──
for (let n = A(17); n < P.BOTTLE_HIT; n += .5) put(fx.blip, n, .045, "alarm");
whoosh(P.BOTTLE_HIT - 1.2, .13);
// Z(17)–P.NEWWORD：拟音全部收住，只留 BGM
beep(P.NEWWORD + .2, .06);
for (const at of P.GEARS) { put(fx.knock, at, .17, "gear", 0, .9); put(fx.creak(.2, Math.round(at)), at, .07, "gear"); }
for (let n = P.GEARS[3]; n < P.IGNITE; n += .5) put(fx.tick, n, .05, "gear");
put(fx.bell(F.f4, 2.4), P.IGNITE, .09, "ignite"); put(fx.drone([55, 82.5, 110], 3, (u) => Math.min(1, u * 5) * (1 - u) ** .5, 9), P.IGNITE, .16, "ignite");
for (let n = P.IGNITE + 1; n < A(22); n += 1) put(fx.knock, n, .08, "engine", 0, .5);
for (let n = A(22); n < P.SLASH; n += 2) put(fx.knock, n, .04, "engine", 0, .5);
whoosh(P.FLIP - .4, .12); put(fx.bell(F.c5, 1.4), P.FLIP + .6, .05, "free"); put(fx.tick, P.GREEN, .08, "stamp");
whoosh(P.COVER, .1); put(fx.creak(.5, 25), P.SLASH, .17, "slash"); for (let i = 0; i < 8; i++) put(fx.tick, P.TEAR + i * .16, .05, "tear", Math.sin(i * 2));
for (let n = P.TEAR + 1; n < A(25); n += .5) put(fx.knock, n, .07, "engine", 0, .5);
put(fx.bell(F.c5, 2), P.GOLD, .07, "gold", .2); put(fx.bell(F.f5, 2), P.GOLD_PEAK, .08, "gold", .2);
// ── S6 ──
for (const at of P.PLATES) put(fx.knock, at, .18, "plate", 0, .7);
for (const at of P.MARKS) put(fx.knock, at, .24, "stamp", 0, .62);
{ let n = A(31) - .5, gap = 1.6; while (n < Q_N[0]) { put(fx.creak(.2, Math.round(n * 7)), n, .06 + .003 * (n - A(31)), "fly", Math.sin(n) * .5, 1.5); n += gap; gap = Math.max(.5, gap * .92); } }
put(fx.bell(F.f5, 2), P.PRESS, .08, "button"); put(fx.bell(F.c5, 2), CARD_N[0], .04, "card");
for (let n = CARD_N[0]; n < Q_N[0]; n += 1) put(fx.knock, n, .08, "engine", 0, .5);
put(fx.bell(F.f4, 2.4), Q_N[0], .09, "q"); put(fx.bell(F.f5, 2.4), Q_N[0], .07, "q");
for (let n = Q_N[0] + 1; n < END_N - 1; n += 1) put(fx.blip, n, .03 + .004 * (n - Q_N[0]), "alarm");
put(fx.knock, END_N - .7, .24, "flash"); put(fx.bell(F.f5 * 2, 1), END_N - .7, .06, "flash");
void HARD; void Z;

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
