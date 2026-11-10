// 本期拟音：全部 AI 新生成（Woosh，tools/gen-sfx.py → assets/audio/sfx-src/gen/），低频重量用干净的合成补。
// 落点与 assets/js/sections.js 的动作同源：都用 beats.js 的 B(n) 与 CUE 算，画面改了这里跟着走。
// 每个动作一个声音（用户 ep23 反馈）；重击只给 4 下（墙落地、咬一口、砸墙、全图亮灯）。
// 用法（在 videos/hok-split 下，顺序 bgm → sfx → duck）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, CUE, DUR } from "../assets/js/beats.js";
import { TMP, publish } from "./publish.mjs";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
const decode = (file, sr) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 29 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
// BGM 包络限高：两条轨直接相加、没有总线限幅，拟音峰值要随 BGM 让出余量
const dt = .025, bgmPcm = decode(resolve(here, "../assets/audio/bgm.m4a"), 44100), size = Math.round(44100 * dt), envB = [];
for (let i = 0; i < bgmPcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(bgmPcm.length, i + size); j++) pk = Math.max(pk, Math.abs(bgmPcm[j])); envB.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt); return Math.max(.1, Math.min(.82, .98 - Math.max(envB[i - 1] || 0, envB[i] || 0, envB[i + 1] || 0))); };
const fx = await createSfxEngine({ dur: DUR, repo, out: join(TMP, "sfx.m4a"), peakLimit: .82, master: 1.1, tail: .02, limitAt });
const { SR, norm, mono } = fx, TAU = Math.PI * 2;

/** 读一条 Woosh 生成的音效：从起音（峰值 10%）开始取 len 秒，尾部 20 ms 淡出（Woosh 常在片尾多出一下杂音，所以只取前段） */
const cache = {};
function W(name, k = 1, len = .6, hp = 0) {
  const key = `${name}_${k}_${len}_${hp}`; if (cache[key]) return cache[key];
  let f = resolve(here, "../assets/audio/sfx-src/gen", `${name}_${k}.flac`);
  if (!existsSync(f)) f = resolve(here, "../assets/audio/sfx-src/gen", `${name}_1.flac`);
  const x = decode(f, SR);
  if (hp) { const a = 1 / (1 + TAU * hp / SR); let px = 0, py = 0; for (let i = 0; i < x.length; i++) { const v = x[i]; py = a * (py + v - px); px = v; x[i] = py; } }
  let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let on = 0; while (on < x.length && Math.abs(x[on]) < pk * .1) on++;
  const y = x.slice(Math.max(0, on - 40), Math.max(0, on - 40) + Math.round(len * SR)), fade = Math.min(y.length, Math.round(.02 * SR));
  for (let i = 0; i < fade; i++) y[y.length - 1 - i] *= i / fade;
  return (cache[key] = mono(norm(y)));
}
/** 低频撞击：频率快速下滑的正弦，只负责「重量」 */
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
const SUB_H = sub(96, 36, .8), SUB_M = sub(150, 56, .3, 12);
const at = (s, t, g, tag, pan = 0, rate = 1) => fx.place(s, t, g, { tag, pan, rate });
const Q = (i) => B(CUE[i][0]);
const heavy = (t, s, g = .7) => { at(SUB_H, t, g * .9, "sub"); at(s, t, g, "heavy"); };
const pop = (t, g = .3, pan = 0, k = 1, rate = 1) => at(W("pop", k, .25), t, g, "pop", pan, rate);
const whoosh = (t, g = .22, pan = 0, k = 1, rate = 1) => at(W("whoosh", k, .45), t - .12, g, "whoosh", pan, rate);

// ===== S1 冷开场 =====
{ const a1 = Q(1), a2 = Q(2), a3 = Q(3);
  whoosh(.4, .25); at(W("block", 1, .5), .7, .5, "logo"); at(SUB_M, .7, .3, "sub");
  whoosh(a1 + .2, .18, -.5, 2); whoosh(a1 + .35, .18, .5, 3);
  for (let i = 0; i < 5; i++) { pop(a1 + .7 + i * .25, .2, -.5 + i * .05, 1 + (i % 3), 1 + i * .04); pop(a1 + .9 + i * .25, .2, .5 - i * .05, 1 + ((i + 1) % 3), 1.05 + i * .04); }
  at(W("ding", 1, .6), a1 + 2.3, .2, "ding");
  whoosh(a2, .22, .6, 2); whoosh(a2 + .3, .25, -.2, 3, .9);
  at(W("slice", 2, .5), a2 + .85, .35, "hit"); at(W("pages", 1, .6), a2 + .9, .28, "shatter", -.1);
  at(W("sadhorn", 1, 1.4), a2 + 1.5, .3, "cry", -.4);
  at(W("crumble", 1, .7), a3, .2, "rise"); heavy(B(20), W("wallslam", 1, .9), .72);
  pop(B(20), .3, -.5); pop(B(20) + .25, .3, .5, 2); at(W("boing", 1, .6), B(20) + .5, .3, "boing"); }

// ===== S2 历史锚点 =====
{ const a4 = Q(4), a5 = Q(5), a6 = Q(6), a7 = Q(7), a8 = Q(8), a9 = Q(9), a10 = Q(10);
  whoosh(a4, .25, 0, 1, .9); at(W("stamp", 1, .5), a4 + .5, .45, "stamp", .4);
  at(W("typing", 1, .8), a4 + .6, .22, "type"); at(W("typing", 2, 1.6), a4 + 1.6, .2, "type"); at(W("typing", 3, 1.6), a4 + 3.2, .2, "type");
  pop(a4 + 2, .25, .6); at(W("boing", 2, .5), a4 + 2.3, .2, "boing", .6); at(W("marker", 1, .7), a4 + 5, .3, "marker");
  whoosh(a5, .3, 0, 2, .8); at(SUB_M, a5 + .28, .35, "sub"); at(W("bookslam", 1, .6), a5 + .28, .5, "book");
  at(W("door", 2, .5), a5 + .8, .2, "open"); at(W("pages", 2, 1.4), a5 + 1.25, .3, "pages"); at(W("ding", 2, .7), a5 + 2.6, .22, "ding");
  for (let i = 0; i < 3; i++) at(W("highlight", 1 + i, .45), a6 + .6 + i * .35, .25, "hl", .3);
  pop(a6 + 1.6, .3, -.3); pop(a6 + 2.4, .22, -.4, 2); at(W("door", 1, .6), a6 + 2.7, .3, "door", -.4);
  at(W("door", 3, .5), a7 + .2, .26, "door", 0); pop(a7 + .4, .2, -.3); pop(a7 + .45, .2, .3, 2); pop(a7 + .6, .2, .5, 3);
  at(W("door", 1, .5), a7 + 1.6, .26, "door"); whoosh(a7 + 1.9, .2, -.6, 1, .7); at(W("honk", 1, .8), a7 + 2.0, .3, "honk", -.4); pop(a7 + 2.0, .2, -.5, 2);
  at(W("door", 2, .5), a8, .24, "door"); whoosh(a8 + .2, .18, -.3, 2); whoosh(a8 + .25, .18, .3, 3); pop(a8 + .4, .2, .5); pop(a8 + .5, .2, -.4, 2); pop(a8 + .6, .2, .4, 3);
  at(W("highfive", 1, .5), a8 + 1.45, .5, "five");
  pop(a9 + .2, .28, -.5, 2);
  for (let i = 0; i < 5; i++) { whoosh(a9 + .5 + i * .4, .1, -.3 + i * .15, 1 + (i % 3), 1.2); at(W("coin", 1 + (i % 3), .4), a9 + 1.1 + i * .4, .16, "land", .3 + i * .1, 1 + i * .05); }
  whoosh(a10, .2, -.4, 2); at(W("boing", 3, .6), a10 + .5, .4, "boing"); at(W("block", 2, .4), a10 + .5, .25, "frame"); at(W("buzzer", 1, .7), a10 + .65, .28, "buzz"); at(W("coin", 2, .7), a10 + .9, .22, "spin", -.3, .85); }

// ===== S3 两条收费管道 =====
{ const a11 = Q(11), a12 = Q(12), a13 = Q(13), a14 = Q(14), a15 = Q(15), bite = B(105);
  whoosh(a11, .18); at(W("coin", 1, .6), a11 + .1, .3, "coin"); at(W("boing", 1, .5), a11 + .85, .3, "boing", -.5); whoosh(a11 + 1.0, .15, -.6, 2);
  pop(a12 + .1, .3, 0); pop(a12 + .6, .3, 0, 2, .9); pop(a12 + 1.0, .25, .6, 3);
  at(W("jingle", 1, .9), a13, .12, "roll", -.3); heavy(bite, W("chomp", 1, .7), .7); at(W("kaching", 1, .9), bite + .5, .3, "kaching", -.6);
  for (let i = 0; i < 4; i++) at(W("barrier", 1 + (i % 3), .4), a14 + .4 + i * .25, .26, "barrier", -.2 + i * .15, 1 + i * .03);
  at(W("jingle", 2, 1.2), a14, .1, "roll", -.3); at(SUB_M, a14 + 1.55, .3, "sub"); at(W("slice", 1, .6), a14 + 1.55, .5, "slice", .3);
  at(W("sadhorn", 2, 1.2), a14 + 1.7, .24, "cry", .4); at(W("kaching", 2, .9), a14 + 2.1, .26, "kaching", -.6);
  whoosh(a15, .15, .3); at(W("coin", 3, .5), a15 + .7, .3, "coin", .6); at(W("coin", 2, .5), a15 + .78, .26, "coin", .6, 1.1);
  pop(a15 + 1.4, .25, .5); pop(a15 + 1.7, .25, .6, 2); at(W("squeak", 1, .4), a15 + 1.9, .2, "squeak", .5); }

// ===== S4 拆墙与改道 =====
{ const a16 = Q(16), a17 = Q(17), a18 = Q(18), a19 = Q(19), a20 = Q(20), a21 = Q(21), sm = B(128);
  whoosh(a16, .3, .6, 2, .8); heavy(sm, W("smash", 1, .9), .78); at(W("crumble", 2, 1.2), sm + .15, .3, "crumble");
  pop(a17, .25, -.6); pop(a17 + .1, .25, .6, 2); at(W("jingle", 3, 2.4), a17 + .3, .26, "jingle");
  for (let i = 0; i < 4; i++) whoosh(a18 + i * 1.0 + .1, .14, i % 2 ? .4 : -.4, 1 + (i % 3), 1.1);
  pop(a19 + .1, .3, -.6); pop(a19 + .5, .3, .6, 2); whoosh(a19 + 1.5, .2, 0, 3, .7);
  at(SUB_M, a20 + .25, .3, "sub"); at(W("bookslam", 2, .6), a20 + .25, .45, "book", -.3); at(SUB_M, a20 + .75, .3, "sub"); at(W("bookslam", 3, .6), a20 + .75, .45, "book", .3);
  pop(a20 + 1.0, .22, -.3); pop(a20 + 1.2, .22, .3, 2); at(W("buzzer", 2, .5), a20 + 1.4, .18, "buzz", -.2); at(W("buzzer", 3, .5), a20 + 2.2, .16, "buzz", .2);
  at(W("squeak", 2, .4), a20 + 1.6, .2, "mine", -.4); at(W("squeak", 3, .4), a20 + 1.9, .2, "mine", .4);
  at(SUB_H, a21, .35, "sub"); at(W("marker", 2, 1.6), a21 + .5, .2, "redraw"); at(W("marker", 3, 1.2), a21 + 1.7, .16, "redraw"); }

// ===== S5 收费站地图 =====
{ const a22 = Q(22), a23 = Q(23), a24 = Q(24), a25 = Q(25), a26 = Q(26), a27 = Q(27);
  whoosh(a22, .22, 0, 1, .8); at(W("jingle", 1, 1.6), a22 + .3, .1, "town");
  whoosh(a23, .2, -.4, 2); at(SUB_M, a23 + 1.0, .4, "sub"); at(W("barrier", 1, .6), a23 + 1.0, .55, "barrier", -.3);
  at(W("clock", 1, 2.4), a23 + 1.4, .3, "clock", .1); at(W("barrier", 2, .5), a23 + 4.0, .3, "barrier", -.3, .9); whoosh(a23 + 4.2, .15, .2, 3);
  whoosh(a24, .2, .4, 1); at(W("flip", 1, .8), a24 + .8, .4, "flip", .4); at(W("ding", 3, .8), a24 + 1.6, .28, "ding", .4);
  for (let i = 0; i < 8; i++) at(W("block", 1 + (i % 3), .35), a25 + .2 + i * .16, .26, "block", -.7 + i * .2, 1 + i * .02);
  at(W("boing", 2, .5), a25 + 1.6, .3, "boing", .7);
  for (let i = 0; i < 3; i++) pop(a26 + i * .2, .22, -.6 + i * .2, 1 + i);
  for (let i = 0; i < 3; i++) at(W("ding", 1 + i, .6), a26 + 1.9 + i * .3, .26, "ding", -.2 + i * .2, 1 + i * .12);
  pop(a27, .26, .4); for (let i = 0; i < 6; i++) at(W("block", 1 + (i % 3), .3), a27 + 1.6 + i * .18, .2, "stack", i % 2 ? .4 : -.4, 1.05 + i * .03); }

// ===== S6 硬币登顶 =====
{ const a28 = Q(28), a29 = Q(29);
  const up = [1, 1.12, 1.26, 1.33, 1.5];
  for (let i = 0; i < 5; i++) at(W("coin", 1 + (i % 3), .5), a28 + i * .5 + .25, .3, "hop", -.6 + i * .3, up[i]);
  at(W("boing", 1, .5), a28 + 2.5, .26, "land", .6);
  whoosh(a29, .25, 0, 2, .7); heavy(a29, W("poweron", 1, 1.6), .62); pop(a29 + .3, .3); pop(a29 + .7, .3, 0, 2, 1.1); }

const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
