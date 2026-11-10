// 本期拟音：拆机动作用小尺度的机械声（assets/audio/sfx-src/gen，tools/gen-sfx.py 生成），重击用 CC0 实录金属样本，低频和风声用干净的合成补。
// 不用引擎的 creak / blip / tick：听起来像棘轮和提示音。落点与 assets/js/sections.js 的动作同拍，零件飞回的落点是 back(n, a, d) 的 a + d。
// 用法（在 videos/iphone-teardown 下，先跑 tools/bgm.mjs）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { B, DUR } from "../assets/js/beats.js";
import { join } from "node:path";
import { TMP, publish } from "./publish.mjs";

const here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../../../..");
const decode = (file, sr) => { const b = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(sr), "-f", "f32le", "-"], { maxBuffer: 1 << 29 }); return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
// BGM 已按重击点让位（tools/bgm.mjs），这里只按它的包络限高，避免相加后破顶
const dt = .025, bgmPcm = decode(resolve(here, "../assets/audio/bgm.m4a"), 44100), size = Math.round(44100 * dt), envB = [];
for (let i = 0; i < bgmPcm.length; i += size) { let pk = 0; for (let j = i; j < Math.min(bgmPcm.length, i + size); j++) pk = Math.max(pk, Math.abs(bgmPcm[j])); envB.push(pk); }
const limitAt = (t) => { const i = Math.floor(t / dt); return Math.max(.1, Math.min(.82, .98 - Math.max(envB[i - 1] || 0, envB[i] || 0, envB[i + 1] || 0))); };
const fx = await createSfxEngine({ dur: DUR, repo, out: join(TMP, "sfx.m4a"), peakLimit: .82, master: 1.13, tail: .08, limitAt });
const { SR, norm, mono } = fx, TAU = Math.PI * 2;
const rng = (seed) => () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

/** 读 CC0 样本并裁掉起音前的空白，让声音正好落在拍上 */
const sample = (name) => { const x = decode(resolve(here, "../assets/audio/sfx-src", name), SR); let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let i = 0; while (i < x.length && Math.abs(x[i]) < pk * .1) i++; return mono(norm(x.slice(Math.max(0, i - 40)))); };
const S = { slam: sample("metal_slam_01.ogg"), boom: sample("explosion_02.ogg"), spring: sample("metal_spring_01.ogg") };
/** 生成样本只取 [t0, t1] 这一段（Woosh 常在片尾多出一下杂音），可选高通去掉低频隆隆声 */
function gen(name, t0, t1, hp = 0) {
  const x = decode(resolve(here, "../assets/audio/sfx-src/gen", name + ".flac"), SR).slice(Math.round(t0 * SR), Math.round(t1 * SR));
  if (hp) { const a = 1 / (1 + TAU * hp / SR); let px = 0, py = 0; for (let i = 0; i < x.length; i++) { const v = x[i]; py = a * (py + v - px); px = v; x[i] = py; } }
  let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v)); let on = 0; while (on < x.length && Math.abs(x[on]) < pk * .1) on++;
  const y = x.slice(Math.max(0, on - 40)), fade = Math.min(y.length, Math.round(.02 * SR)); for (let i = 0; i < fade; i++) y[y.length - 1 - i] *= i / fade;
  return mono(norm(y));
}
/** 把一条连续的咔哒切成单颗，用来拧螺丝 */
function ticks(name, t0, t1) { const x = decode(resolve(here, "../assets/audio/sfx-src/gen", name + ".flac"), SR), hop = 110, out = []; let pk = 0; for (let i = Math.round(t0 * SR); i < t1 * SR; i++) pk = Math.max(pk, Math.abs(x[i])); let last = -1; for (let i = Math.round(t0 * SR); i < t1 * SR - hop; i += hop) { let m = 0; for (let j = i; j < i + hop; j++) m = Math.max(m, Math.abs(x[j])); if (m > pk * .4 && (last < 0 || (i - last) / SR > .06)) { last = i; out.push(gen(name, Math.max(0, i / SR - .002), Math.min(t1, i / SR + .08))); } } return out; }

const G = {
  pry: gen("pry_1", .15, .6), pry2: gen("pry_2", .38, .8), peel: gen("peel_1", .18, 1, 150), peelLong: gen("peel_2", .08, 1.3, 150), connector: gen("connector_2", .06, .4, 200), connector2: gen("connector_3", 1, 1.3, 200),
  hatch: gen("hatch_1", .07, .75), hatch2: gen("hatch_3", .32, .9), slide: gen("slide_1", .28, 1), slide2: gen("slide_2", .34, 1.15), iris: gen("iris_2", .16, .55), irisRun: gen("iris_3", .1, .58), blades: gen("blades_1", .06, 1, 500),
  lens: gen("lens_1", .28, .8), lens2: gen("lens_3", .47, 1), lock: gen("lockdown_2", .05, .75), lock3: gen("lockdown_3", .03, .75), latch: gen("latch_3", .5, .95), latch2: gen("latch_1", .27, .7), servo: gen("servo_3", .09, 1.18), servo2: gen("servo_1", .09, 1.18),
  shield: gen("shield_1", .03, .62), shield3: gen("shield_3", .05, .4), foil: gen("foil_2", .08, 1.38, 400), tink: gen("screwdrop_3", .28, .95), motor: gen("motor_3", .1, 2.48), tick: ticks("unscrew_1", 0, .68),
};

/** 低频撞击：频率快速下滑的正弦，只负责「重量」 */
function sub(f0, f1, d, k = 7) { const n = Math.ceil(d * SR), y = new Float32Array(n); let ph = 0; for (let i = 0; i < n; i++) { const t = i / SR, f = f1 + (f0 - f1) * Math.exp(-t * 26); ph += TAU * f / SR; y[i] = Math.sin(ph) * Math.exp(-t * k) * Math.min(1, t / .002); } return mono(norm(y)); }
/** 干净的风声：噪声过扫频带通，包络平滑、没有脉冲 */
function air(d, f0, f1, seed, peak = .6, q = 1.1) {
  const n = Math.ceil(d * SR), y = new Float32Array(n), r = rng(seed * 991 + 7); let lo = 0, band = 0;
  for (let i = 0; i < n; i++) { const u = i / n, f = f0 * (f1 / f0) ** u, g = 2 * Math.sin(Math.PI * Math.min(f, 9000) / SR), hi = (r() * 2 - 1) - lo - band / q; band += g * hi; lo += g * band; const e = u < peak ? (u / peak) ** 2 : ((1 - u) / (1 - peak)) ** 1.6; y[i] = band * e; }
  return mono(norm(y));
}
const put = (s, n, g, tag, pan = 0, rate = 1) => fx.place(s, B(n), g, { tag, pan, rate });
const sweep = (n, g = .12, d = .55, seed = 1, pan = 0, up = true) => fx.place(air(d, up ? 320 : 2600, up ? 2600 : 420, Math.round(n * 13) + seed), B(n) - d * .6, g, { tag: "air", pan });

const SUB_H = sub(92, 34, .85), SUB_M = sub(140, 52, .35, 12);
/** 重击：低频给重量，机械锁定声给材质 */
const heavy = (n, g = .62, pan = 0) => { put(SUB_H, n, g, "sub"); put(G.lock, n, g * .85, "lock", pan); put(S.slam, n, g * .32, "slam", pan, .86); };
/** 中等落点：一个部件到位 */
const clamp = (n, g = .4, pan = 0, s = G.hatch, rate = 1) => { put(SUB_M, n, g * .4, "sub"); put(s, n, g, "clamp", pan, rate); };
const snap = (n, g = .42, pan = 0, s = G.latch) => put(s, n, g, "snap", pan);
/** 拧出一颗螺丝：转两下，松脱时轻一声 */
const screw = (n, i, pan, g) => { const T = G.tick; put(T[i % T.length], n, g, "screw", pan, 1 + i * .02); put(T[(i + 2) % T.length], n + .16, g * .85, "screw", pan, 1.04 + i * .02); if (i % 3 === 2) put(G.tink, n + .36, g * .5, "tink", pan * 1.4, 1.12); };

// S1 开场：掠过的风很轻，手机转身带一点电机声
put(SUB_M, 0, .25, "sub"); sweep(1.7, .08, .8, 2, -.35); sweep(3.6, .09, .8, 3, .35); sweep(6.4, .15, 1.3, 4, -.2); put(G.servo2, 6, .12, "servo", .15);
// S2 找门：撬开后盖 → 翻开露出线圈 → 面板滑走 → 翻面落定 → 撬屏幕、撕胶、开门
snap(11, .3, .1, G.pry2); put(G.pry, 12, .6, "pry", .05); heavy(12, .58); sweep(13.6, .08, .6, 5, -.3); put(G.peel, 14, .3, "peel", .1); put(G.foil, 15.5, .13, "foil", .15); clamp(17, .3, .15, G.hatch2);
put(G.slide, 21.6, .36, "slide", -.3); sweep(22, .13, .9, 6); clamp(24, .46, 0, G.lock); put(G.pry, 24.1, .42, "pry", -.2); put(G.peelLong, 24.3, .36, "peel", -.3); snap(25.4, .3, -.4, G.connector); put(G.slide2, 26.4, .3, "slide", -.45);
// S3 13 颗螺丝，每半拍一颗，转两下；托盘升起；盖板滑走；托盘飞走
for (let i = 0; i < 13; i++) screw(28 + i * .5, i, i % 2 ? .35 : -.35, .36 + .012 * i);
sweep(35.4, .1, .5, 8); put(G.servo, 35.7, .2, "servo"); heavy(36, .56); put(G.slide, 38, .36, "slide", -.3); snap(39.2, .24, -.3, G.connector2); put(G.slide2, 41, .32, "slide", -.5); snap(41, .3, -.4, G.connector);
// S4 主摄：抽出、下钻、拆镜片、揭盖；叶片炸开、单片、归位；每档光圈一声干脆的机械声；开大时叶片连续滑动
put(G.servo2, 45.8, .22, "servo", .2); clamp(46, .46, .2, G.hatch); fx.place(air(B(2.6), 200, 3600, 21, .9, 1.4), B(47.2), .12, { tag: "dive" }); clamp(48, .34, .3, G.hatch2);
for (let i = 0; i < 3; i++) put(i % 2 ? G.lens2 : G.lens, 48.8 + i * .25, .34, "glass", i % 2 ? .4 : -.4, 1 + i * .06); put(G.shield3, 50, .4, "cover", .2);
put(G.blades, 52, .34, "blades", -.1); put(G.irisRun, 52.1, .32, "blades", .2); sweep(52.2, .07, .6, 10, .3); put(G.irisRun, 54.6, .22, "blade", -.3, .9); put(G.blades, 57.8, .3, "blades", .1); snap(58.6, .4, 0, G.latch);
for (const n of [59, 61, 63, 65]) { put(G.iris, n, .58, "stop"); put(SUB_M, n, .16, "sub"); }
fx.place(air(B(4.4), 120, 1400, 31, .92, 2.2), B(67.4), .1, { tag: "light" }); put(G.irisRun, 68, .34, "iris", 0, .7); put(G.blades, 69, .22, "blades", 0, .9); snap(70.8, .34, 0, G.iris);
// 马达：抽盖、旧转子转起来、新马达弹簧响一下、配重来回跑，声音的起伏和配重同频（wv = sin(2π·3.6·t)）
put(G.slide, 72, .34, "slide", 0); snap(72.3, .32, .2, G.connector2); put(G.servo, 72.7, .3, "servo", .1, .82);
{ const y = new Float32Array(G.motor.l), t0 = B(75.2), n = y.length, e = Math.round(.03 * SR); for (let i = 0; i < n; i++) { const w = Math.sin(TAU * 3.6 * (t0 + i / SR)); y[i] *= (.35 + .65 * w * w) * Math.min(1, i / e); } fx.place(mono(norm(y)), t0, .46, { tag: "motor" }); put(S.spring, 75.2, .3, "spring", .1); }
// S5 主板：弹起、翻转、揭均热板、撬封装盖，然后一路下钻
put(G.connector2, 79.7, .36, "snap", -.2); put(G.servo2, 79.8, .18, "servo"); clamp(80, .46, 0, G.hatch); sweep(80.6, .1, .9, 13, .3); put(G.peel, 82, .34, "peel", .4); put(G.slide2, 82.4, .28, "slide", .5); put(G.shield, 84.2, .54, "shield"); put(G.pry2, 84.2, .3, "pry", 0);
heavy(86, .46); fx.place(air(B(3.9), 180, 5200, 41, .97, 1.4), B(86.2), .22, { tag: "dive" });
put(SUB_H, 90, .6, "sub"); put(S.boom, 90, .32, "boom", 0, .9);
for (const h of [94, 98, 102]) put(SUB_M, h, .2, "sub");
for (let n = 90.8, i = 0; n < 103; n += 1.6, i++) sweep(n, .07 + .02 * (i % 2), .6, 20 + i, i % 2 ? .7 : -.7);
put(G.lock3, 93, .24, "old", 0, 1.1); fx.place(air(B(9.6), 90, 4200, 51, .97, 1.8), B(103.4), .2, { tag: "rise" });
// S6 全片最重一击；零件按飞回的先后依次咬合，落点取 back 的 a + d，越来越密，亮屏后硬切
put(SUB_H, 113, .76, "sub"); put(S.boom, 113, .46, "boom", 0, .85); put(S.slam, 113, .36, "slam", 0, .8); sweep(113.6, .2, 1.1, 60, 0, false);
put(G.shield3, 115, .4, "lock", -.2); put(G.slide, 115.3, .3, "slide", .3); snap(115.8, .42, .3, G.latch2); clamp(116.5, .42, -.2, G.latch); clamp(116.6, .46, .1, G.hatch); clamp(117.3, .52, .3, G.lock); put(G.servo, 117.6, .16, "servo", -.1); clamp(118.8, .56, 0, G.lock3);
for (let i = 0; i < 13; i++) { put(G.tick[i % G.tick.length], 119.4 + i * .1, .44, "screw", i % 2 ? .4 : -.4, 1.05 + i * .03); if (i % 4 === 3) put(G.tink, 119.45 + i * .1, .2, "tink", i % 2 ? -.3 : .3, 1.15); }
clamp(122, .5, -.2, G.hatch2); snap(122, .4, -.2, G.latch); clamp(122.4, .52, .2, G.hatch); snap(122.4, .44, .2, G.latch2);
sweep(122.8, .18, .9, 61, -.4); sweep(124, .15, .7, 62, .4); heavy(125, .6); put(G.latch, 125.05, .4, "snap"); sweep(127.4, .14, .35, 63);
const r = await fx.finalize();
publish(join(TMP, "sfx.m4a"), resolve(here, "../assets/audio/sfx.m4a"));
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR.toFixed(2)}s；峰值 ${r.pkAfter.toFixed(3)}`);
