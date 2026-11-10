// 总装：一个 3D 世界、一条连续的机位轨道、各段场景按时间接力给出世界状态和 HUD。
import { buildWorld } from "./world.js";
import { track, el, show, win } from "./lib.js";
import * as S0 from "./s0s2.js";
import * as S34 from "./s3s4.js";
import * as S56 from "./s5s6.js";
import * as S79 from "./s7s9.js";

const W = buildWorld(document.getElementById("gl"), { seed: 7 });
const scenes = [{ end: S0.END, ...S0.build(W) }, { end: S34.END, ...S34.build(W) }, { end: S56.END, ...S56.build(W) }];
const b79 = S79.build(W);
scenes.push({ end: S79.END, ...b79 });

// 机位：各段关键帧拼成一条轨道（位置、目标点分开插值）
const keys = [...S0.CAM, ...S34.CAM, ...S56.CAM, ...S79.cams(b79)];
const camPos = track(keys.map((k) => [k[0], k[1]]));
const camTgt = track(keys.map((k) => [k[0], k[2]]));

// 字幕预览（?caps=1）。成片不烧字幕，交付 SRT
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt.replace(/\n/g, "<br>")}</b>`, "cap") })) : [];

function frame(t) {
  // 每段场景都更新自己的 HUD 和物体；世界状态由当前段决定（最后一段在结束后保持）
  W.setCam({ pos: camPos(t), tgt: camTgt(t) });
  let st = null;
  for (const s of scenes) { const r = s.state(t); if (!st && t < s.end) st = r; if (!st && s === scenes[scenes.length - 1]) st = r; }
  W.render(st);
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
