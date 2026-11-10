// 本期拟音脚本：只负责「在第几拍放什么」。合成、压限、写文件全部来自共享引擎。
// 用法（在 videos/unboxing 下）：node tools/sfx.mjs
// 落点与 sections.js 同源：用的是同一张拍号表（刷新、试次等），改画面就改这里。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
// 拟音峰值跟着 BGM 走：BGM 响的地方让一让（往期 SFX 没有总线压限，见 sfx-raw-onsets 备忘）
const bgm = resolve(here, "../assets/audio/bgm.m4a"), dt = .025, sr = 44100;
const buf = execFileSync("ffmpeg", ["-v", "error", "-i", bgm, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
const pcm = new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)), size = Math.round(sr * dt), env = [];
for (let i = 0; i < pcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(pcm.length, i + size); j++) pk = Math.max(pk, Math.abs(pcm[j])); env.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt), peak = Math.max(env[i - 1] || 0, env[i] || 0, env[i + 1] || 0); return Math.max(.05, Math.min(.34, .86 - peak)); };
const fx = await createSfxEngine({ dur: DUR, repo, out: resolve(here, "../assets/audio/sfx.m4a"), peakLimit: .34, master: 1.25, tail: .3, limitAt });
const put = (snd, n, g, tag, pan = 0) => fx.place(snd, B(n), g, { tag, pan });
const F = { f4: 349.23, ab4: 415.3, bb4: 466.16, c5: 523.25, eb5: 622.25, f5: 698.46 };

// ── S1 签收那一刻 ──
for (const n of [2.6, 3.6, 4.6, 5.6, 6.6, 7.6, 8.6, 9.5]) put(fx.tick, n, .07, "refresh", -.35);   // 下拉刷新
put(fx.bell(F.c5, 1.4), 10, .05, "glow");                                                          // 光升起
put(fx.knock, 16, .16, "door", .3); put(fx.knock, 16.35, .13, "door", .3);                         // 敲门
put(fx.knock, 17.05, .2, "land", .1);                                                              // 纸箱落桌
put(fx.creak(.7, 7), 18, .09, "tape", .1);                                                         // 撕胶带
put(fx.pluck(F.ab4, 3).snd, 19, .06, "flap", .15);                                                 // 翻盖
put(fx.bell(F.f5, 1.6), 20, .06, "leave", .2);                                                     // 签收：光离开
put(fx.blip, 20.4, .04, "item", .1);
put(fx.knock, 24, .14, "drawer", .5);                                                              // 抽屉合上
put(fx.bell(F.eb5, 1.8), 28, .05, "where", .4);

// ── S2 灯和果汁 ──
put(fx.bell(F.f4, 2.2), 30, .1, "chapter");
for (const n of [31, 31.5, 32.5, 33, 34, 34.5]) put(fx.tick, n, .045, "chalk", (n % 2) - .5);        // 粉笔
for (const [L, J] of [[40, 42], [44, 46], [49, 51], [53, 55], [62, 64]]) {
  put(fx.blip, L, .05, "bulb", -.1);
  put(fx.pop, J, .06, "drop", -.3);
}
for (const n of [51, 55]) for (let i = 0; i < 4; i++) put(fx.tick, n + i * .12, .05, "spike", .2);  // 放电在果汁处
for (const n of [62]) for (let i = 0; i < 4; i++) put(fx.tick, n + i * .12, .06, "spike", -.1);     // 放电挪到灯上
put(fx.pluck(F.c5, 5).snd, 58.5, .06, "shift");
put(fx.creak(.35, 9), 69, .08, "strike", .2);
put(fx.pluck(F.eb5, 6).snd, 72, .05, "circle", .2);
put(fx.bell(F.ab4, 1.6), 77, .07, "split");
put(fx.pluck(F.f5, 8).snd, 87, .05, "neq", .3);
put(fx.blip, 96, .05, "phone", -.4);
put(fx.pop, 100, .05, "drop", .3);

// ── S3 三周以后 ──
put(fx.pop, 106, .06, "place");
for (const n of [114.5, 115.9, 118, 119.4]) put(fx.knock, n, .07, "pick", .1);                      // 拿起、放下
for (const [n, f] of [[122, F.c5], [124.5, F.eb5], [127, F.f5]]) { put(fx.tick, n, .07, "page", -.5); put(fx.bell(f, 1.4), n + .1, .04, "brighten"); }
for (const n of [130, 130.5, 131, 136.5, 137, 137.5, 138.5, 139]) put(fx.tick, n, .04, "chalk", .2);
put(fx.pluck(F.ab4, 11).snd, 140, .05, "baseline");
put(fx.bell(F.f5, 1.8), 146.5, .05, "leave", .4);

// ── S4 会变的尺子 ──
put(fx.knock, 151, .18, "hit"); put(fx.bell(F.f4, 2.2), 151, .09, "chapter");
for (let i = 0; i < 6; i++) put(fx.tick, 152 + i * .35, .045, "ruler", .3);
put(fx.pluck(F.c5, 12).snd, 155, .05, "good", .3);
put(fx.knock, 160.5, .14, "paper", -.3); put(fx.creak(.25, 13), 160.2, .05, "paper", -.3);
for (const n of [162, 162.3, 162.6]) put(fx.tick, n, .05, "type", -.3);
put(fx.knock, 172, .15, "num", .1); put(fx.knock, 179, .17, "num", .3); put(fx.bell(F.c5, 1.4), 179, .05, "num", .3);
put(fx.creak(.4, 14), 185, .06, "circle", .3);
for (const n of [191.5, 192, 192.5, 193]) put(fx.tick, n, .04, "ring", .3);
put(fx.blip, 194, .04, "you");
for (const n of [199, 200.5]) put(fx.tick, n, .04, "note");
for (const n of [207.5, 208, 208.5]) put(fx.tick, n, .05, "chalk");
put(fx.creak(.5, 15), 215, .07, "redraw", .3); put(fx.pluck(F.ab4, 16).snd, 216, .05, "meh", .3);
put(fx.blip, 219.5, .045, "phone", -.4);
for (const [n, f] of [[221, F.f4], [223.2, F.eb5], [225.8, F.c5]]) { put(fx.tick, n, .06, "swipe", -.4); put(fx.pluck(f, Math.round(n)).snd, n + .2, .05, "drop", .3); }

// ── S5 熄灭的理由 ──
for (const [n, f] of [[229, F.c5], [231, F.eb5], [233, F.f5]]) put(fx.pluck(f, Math.round(n)).snd, n, .06, "icon");
put(fx.bell(F.ab4, 1.6), 236.5, .05, "question");
// n242–251「快乐永远不散」：拟音全部收住，只留 BGM
put(fx.bell(F.f4, 2.4), 251.5, .07, "wild");
for (let i = 0; i < 10; i++) put(fx.tick, 252 + i * .73, .025, "fire", -.2);
put(fx.knock, 259.5, .08, "stand", -.1);
for (let n = 261; n < 275; n += n < 270 ? 1 : .5) put(fx.knock, n, .05, "step", .1);
for (let i = 0; i < 9; i++) put(fx.blip, 270 + i * .3, .025 + i * .002, "lights");
put(fx.bell(F.c5, 1.6), 276.5, .05, "home");
put(fx.tick, 279, .07, "lamp", .4);
put(fx.pluck(F.eb5, 21).snd, 285, .05, "wait", .3);
put(fx.bell(F.f5, 1.6), 293, .05, "window", .4);

// ── S6 往前 ──
put(fx.knock, 295, .16, "hit"); put(fx.bell(F.f5, 2.4), 295, .08, "road");
for (let i = 0, f = [F.c5, F.eb5, F.f5, F.ab4 * 2, F.bb4 * 2]; i < 10; i++) put(fx.pluck(f[i % 5], 30 + i).snd, 297 + i * 2, .04 + i * .002, "rush", (i % 2) - .5);
put(fx.bell(F.c5, 2), 301, .04, "card");
put(fx.bell(F.f4, 2.4), 311.3, .07, "q"); put(fx.bell(F.f5, 2.4), 311.3, .05, "q");
put(fx.knock, 318.3, .15, "flash"); put(fx.bell(F.f5 * 2, 1.2), 318.3, .06, "flash");

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
