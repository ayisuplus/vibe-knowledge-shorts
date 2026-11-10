// 本期拟音脚本：只负责「在第几拍放什么」。合成、压限、写文件全部来自共享引擎。
// 用法（在 videos/anxiety-engine 下）：node tools/sfx.mjs
// 落点与 sections.js 同源：都从 beats.js 的 CUE 算出，改文案不用改这里。全部合成，不用历期素材。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR, CUE, CARD_N, Q_N, END_N, SEC_N } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
// 拟音峰值跟着 BGM 走：BGM 响的地方让一让（BGM 和拟音是两条轨直接相加，没有总线压限）
const bgm = resolve(here, "../assets/audio/bgm.m4a"), dt = .025, sr = 44100;
const buf = execFileSync("ffmpeg", ["-v", "error", "-i", bgm, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
const pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), size = Math.round(sr * dt), env = [];
for (let i = 0; i < pcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(pcm.length, i + size); j++) pk = Math.max(pk, Math.abs(pcm[j])); env.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt), peak = Math.max(env[i - 1] || 0, env[i] || 0, env[i + 1] || 0); return Math.max(.05, Math.min(.34, .86 - peak)); };
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: .34, master: 1.25, tail: .08, limitAt });
const put = (snd, n, g, tag, pan = 0, rate = 1) => fx.place(snd, B(n), g, { tag, pan, rate });
const A = (i) => CUE[i][0], Z = (i) => CUE[i][1];
const F = { f4: 349.23, ab4: 415.3, bb4: 466.16, c5: 523.25, eb5: 622.25, f5: 698.46 };
const page = (n, g = .08, pan = 0) => { put(fx.creak(.28, 40 + Math.round(n)), n, g, "page", pan); };
const slap = (n, g = .2, pan = 0) => { put(fx.knock, n, g, "slap", pan, .8); put(fx.tick, n, g * .5, "slap", pan); };
const stampIt = (n, g = .17, pan = 0) => { put(fx.knock, n, g, "stamp", pan, .62); put(fx.tick, n + .02, g * .3, "stamp", pan); };
const beep = (n, g = .05, pan = .3) => { put(fx.blip, n, g, "alarm", pan); put(fx.blip, n + .5, g * .8, "alarm", pan); };
const roll = (n, beats, g = .035, pan = 0) => { for (let i = 0; i < beats * 3; i++) put(fx.tick, n + i / 3, g, "roll", pan); };
const ring = (n, g = .07) => put(fx.creak(.45, 90 + Math.round(n)), n, g, "pen", .2);

// ── S1 ──
page(0, .05);
slap(Z(1) - 1.5, .22, .15); beep(Z(1) - 1, .05);
put(fx.bell(F.c5, 1.4), A(2) + .5, .05, "wire", .3);
beep(A(2) + 3, .05);
stampIt(A(3), .14, .3); for (let n = A(3) + 1; n < Z(3); n += 2) beep(n, .045);

// ── S2 ──
page(SEC_N.s2[0], .09); put(fx.bell(F.f4, 2), SEC_N.s2[0], .08, "chapter");
roll(A(4) + 1, 5, .03, -.3);
roll(A(5) + 2, 4.5, .03, .3); put(fx.knock, A(5) + 6.5, .17, "num", .3); ring(Z(5) - 3);
slap(A(6) + 1, .24);
slap(A(7) + .8, .22, .3); beep(A(7) + 1.2, .05);
roll(A(8) + 1, 5, .05);

// ── S3 ──
page(A(9), .09, -.3); put(fx.knock, A(9) + .4, .09, "bottle", -.3, 1.4);
for (const k of [1.6, 2.6, 3.6, 4.6]) page(A(9) + k, .06, .35);
put(fx.bell(F.ab4, 1.5), A(9) + 5.5, .06, "word", .35); ring(A(9) + 8);
stampIt(A(10) + 3.5, .13, .35);
page(A(11), .08); put(fx.bell(F.f4, 2), A(11) + 2, .05, "story");
beep(A(12) + 3.4, .05, 0);
stampIt(A(13), .14, .3); roll(A(13) + 2, 7, .03, .3); put(fx.knock, A(13) + 9, .2, "num", .3); put(fx.bell(F.c5, 1.4), A(13) + 9, .05, "num", .3);
for (const k of [1.5, 4, 6.5]) stampIt(A(14) + k, .18, .25);

// ── S4 ──
put(fx.knock, A(15) + 2, .14, "open", 0, 1.3); put(fx.creak(.5, 11), A(15) + 2.2, .08, "open");
put(fx.pop, A(16) + 1.5, .08, "toast", -.3); put(fx.blip, A(16) + 3, .05, "alarm", .4); put(fx.blip, A(16) + 3.5, .05, "alarm", .4); put(fx.blip, A(16) + 4, .05, "alarm", .4);
page(A(17), .07); put(fx.blip, A(17) + .6, .03, "small", -.4);
put(fx.drone([70, 105, 140], 2.6, (u) => Math.sin(Math.PI * Math.min(1, u)) ** .6, 7), A(17) + 3.4, .1, "fire", .3);
stampIt(A(18) + .3, .12); beep(A(18) + 2, .04, 0);
put(fx.knock, A(19) + .5, .08, "weight", -.2); put(fx.knock, A(19) + 1.2, .2, "weight", .2, .6);
for (let i = 0; i < 12; i++) put(fx.blip, A(19) + 1 + i * .58, .036 - i * .002, "false", -.3 + i * .05);
stampIt(A(19) + 4, .13);
page(A(20), .07); put(fx.knock, A(20) + 4.6, .2, "scale", .3, .7); stampIt(Z(20) - 3.4, .12, -.3);
put(fx.pop, A(21) + 3, .06, "piece", .3); put(fx.knock, A(21) + 7, .18, "click", 0, 1.1); put(fx.bell(F.eb5, 1.6), A(21) + 7, .06, "click");
page(A(22) + .2, .1);

// ── S5 ──
page(A(23), .08); put(fx.knock, A(23) + 3, .1, "bottle", -.4, 1.2);
// 「一会儿安静」：拟音全部收住，只留 BGM
slap(A(25) + .8, .24); put(fx.blip, A(25) + 1.3, .05, "alarm"); put(fx.blip, A(25) + 1.8, .05, "alarm");
const dGear = (Z(26) - A(26) - 3) / 4;
for (let i = 0; i < 4; i++) { put(fx.knock, A(26) + .3 + i * dGear, .13, "gear", [-.4, .4, .4, -.4][i], .9); put(fx.tick, A(26) + .3 + i * dGear, .07, "gear", [-.4, .4, .4, -.4][i]); }
put(fx.knock, A(27), .24, "ignite", 0, .5); put(fx.bell(F.f4, 2.4), A(27), .08, "ignite"); put(fx.drone([55, 82.5, 110], 3, (u) => Math.min(1, u * 5) * (1 - u) ** .5, 9), A(27), .12, "ignite");
// 发动机的律动：每拍一下，贴着 BGM；批评那句之后加密
for (let n = A(27) + 1; n < A(28); n += 1) put(fx.knock, n, .06, "engine", 0, .55);
for (let n = A(28); n < A(30); n += 2) put(fx.knock, n, .035, "engine", 0, .55);
put(fx.creak(.35, 21), A(28) + 4.5, .09, "flip", -.2); put(fx.bell(F.c5, 1.4), A(28) + 5.2, .05, "free", -.2);
stampIt(A(29) + 3, .1, -.4);
put(fx.creak(.3, 23), A(30) + .4, .08, "flip", .1); put(fx.creak(.5, 25), A(30) + 2.6, .14, "strike", .1); put(fx.knock, A(30) + 3.3, .2, "strike", 0, .7);
for (let n = A(30) + 3.5; n < A(32); n += .5) put(fx.knock, n, .06, "engine", 0, .55);
put(fx.blip, A(31) + 1, .04, "alarm"); put(fx.blip, A(31) + 3, .04, "alarm");
page(A(32), .07); put(fx.blip, A(32) + 1, .04, "alarm", .3);
put(fx.bell(F.c5, 1.8), A(33) + 1, .07, "gold", .3); put(fx.bell(F.f5, 1.8), Z(33) - 2, .06, "gold", .3);

// ── S6 ──
put(fx.knock, A(34), .2, "hit", 0, .7); page(A(34), .08);
for (const i of [35, 36, 37]) stampIt(A(i) + .3, .2, (i - 36) * .4);
// 飞掠：越来越密
{ let n = A(38) - 1, gap = 2; while (n < Q_N[0]) { put(fx.creak(.2, Math.round(n * 7)), n, .05 + .004 * (n - A(38)), "fly", Math.sin(n) * .5); n += gap; gap = Math.max(.5, gap * .93); } }
put(fx.knock, Z(38) - 3, .26, "button", 0, .55); put(fx.bell(F.f5, 2), Z(38) - 3, .07, "button");
put(fx.bell(F.c5, 2), CARD_N[0], .04, "card");
for (let n = CARD_N[0]; n < END_N - 1; n += 1) put(fx.knock, n, .07, "engine", 0, .55);
put(fx.knock, Q_N[0], .24, "dive", 0, .5); put(fx.bell(F.f4, 2.4), Q_N[0], .08, "q"); put(fx.bell(F.f5, 2.4), Q_N[0], .06, "q");
for (let n = Q_N[0] + 1; n < END_N - 1; n += 1) put(fx.blip, n, .03 + .004 * (n - Q_N[0]), "alarm");
put(fx.knock, END_N - .7, .2, "flash"); put(fx.bell(F.f5 * 2, 1), END_N - .7, .06, "flash");

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
