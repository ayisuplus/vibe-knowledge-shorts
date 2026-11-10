// 总装 v2：一个 3D 世界、一颗魔方、十段场景（scenes/s0…s9.js）。
// 每段给出：时间段 [t0,t1)、转动表 moves、镜头 cam(t)、魔方 cube(t)、自己的 3D 物件 world(t)、HUD hud(t)。
// 当前时刻由「正在演的那一段」决定镜头和魔方；每段的 HUD 自己管显隐。全部只看 t，可任意跳帧。
import * as THREE from "three";
import { buildWorld, buildSet, buildDust } from "./world.js";
import { buildCube } from "./cube.js";
import { buildEnvs } from "./env.js";
import { el, show, win } from "./lib.js";
import S0 from "./scenes/s0.js";
import S1 from "./scenes/s1.js";
import S2 from "./scenes/s2.js";
import S3 from "./scenes/s3.js";
import S4 from "./scenes/s4.js";
import S5 from "./scenes/s5.js";
import S7 from "./scenes/s7.js";
import S8 from "./scenes/s8.js";
import SP from "./scenes/sp.js";
import S9 from "./scenes/s9.js";

await document.fonts.load("900 40px NotoSC"); await document.fonts.load("700 40px CMono");

const Wd = buildWorld(document.getElementById("gl"));
const set = buildSet(Wd.scene);
const dust = buildDust(Wd.scene);
const cube = buildCube({ look: "base" });
Wd.scene.add(cube.root);
const env = await buildEnvs(Wd, set);
const ctx = { THREE, Wd, cube, set, dust, env, hand: document.getElementById("hand") };
// v3 顺序：开场 → 结构 → 1974 → 4325 京（s3）→ 1/12（s5）→ 105（s4）→ 群论应用（s8）→ 上帝之数（s7）→ 哲理（sp）→ 收尾（s9）
const scenes = [S0, S1, S2, S3, S5, S4, S8, S7, SP, S9].map((f) => f(ctx)).sort((a, b) => a.t0 - b.t0);
// 每段背景居中时的镜头朝向：取这一段正中间那一帧
for (const s of scenes) { const c = s.cam((s.t0 + s.t1) / 2); s.yaw0 = s.envYaw0 ?? Math.atan2(c.tgt[0] - c.pos[0], c.tgt[2] - c.pos[2]); }

// 整片转动表：各段拼起来按时间排好；不允许两步重叠（引擎靠这个二分查找）
const SCH = scenes.flatMap((s) => s.moves || []).sort((a, b) => a.t0 - b.t0);
for (let i = 1; i < SCH.length; i++) if (SCH[i].t0 < SCH[i - 1].t0 + SCH[i - 1].d - 1e-6) console.warn("moves overlap at", SCH[i].t0.toFixed(3), SCH[i - 1].tok, SCH[i].tok);
ctx.SCH = SCH;
window.__SCH = SCH.map((m) => [+m.t0.toFixed(4), m.tok, +m.d.toFixed(4)]); // 给音效脚本用（tools/dumpmoves.mjs）

// 甩镜的横向动态模糊：SVG 滤镜挂在画布上
const svgNS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(svgNS, "svg");
svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.position = "absolute";
svg.innerHTML = `<filter id="mb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur id="mbg" stdDeviation="0 0" edgeMode="duplicate"/></filter>`;
document.body.appendChild(svg);
const mbg = svg.querySelector("#mbg"), gl = document.getElementById("gl");

// 字幕预览（?caps=1）。成片不烧字幕，交付 SRT
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt}</b>`, "cap2", "hud") })) : [];

function frame(t) {
  let si = 0;
  for (let i = 0; i < scenes.length; i++) if (t >= scenes[i].t0) si = i;
  const s = scenes[si];
  const c = s.cam(t);
  Wd.setTransparent(!!c.transparent);
  Wd.setCam(c.pos, c.tgt, c.fov || 32);
  env.apply(c.env || s.env || "stage", { transparent: !!c.transparent, yaw0: s.yaw0, zoom: c.bgZoom, bright: c.bgBright, tilt: c.bgTilt, pan: c.bgPan });
  Wd.bloom.strength = c.bloom ?? 0.55;
  const bx = c.blur || 0, by = c.blurY || 0;
  if (bx + by > 0.4) { mbg.setAttribute("stdDeviation", `${bx.toFixed(1)} ${by.toFixed(1)}`); gl.style.filter = "url(#mb)"; } else gl.style.filter = "none";

  const q = s.cube(t);
  cube.root.visible = !q.hide;
  cube.root.position.set(...(q.pos || [0, 2.3, 0]));
  cube.root.rotation.set(...(q.rot || [0, 0, 0]));
  cube.root.scale.setScalar(q.scale ?? 1);
  cube.setGlow(q.glow ?? 0.55);
  for (const cb of cube.cubies) { cube.dim(cb, 0); cb.scale.setScalar(1); } // 各段的 post 可能改了缩放，每帧先复位
  cube.pose(SCH, t, { explode: q.explode || 0, spread: q.spread ?? 0.95, post: q.post || null });
  Wd.coreLight.intensity = q.core ?? 6 * (q.explode || 0);
  Wd.coreLight.position.copy(cube.root.position);
  for (const sc of scenes) sc.world && sc.world(t, sc === s);
  dust.update(t);
  Wd.render();
  for (const sc of scenes) sc.hud && sc.hud(t, sc === s);
  for (const cp of caps) show(cp.e, win(t, cp.t0, cp.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
