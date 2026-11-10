// 总装：一个 3D 世界、一条连续的机位轨道、各段场景按时间接力给出状态和 HUD。
import { buildWorld } from "./wall.js";
import { track, el, show, win } from "./lib.js";
import * as S02 from "./s0s2.js";
import * as S34 from "./s3s4.js";
import * as S57 from "./s5s7.js";

await document.fonts.load("800 40px VibeSerif");
await document.fonts.load("700 40px VibeSans");

const W = buildWorld(document.getElementById("gl"));
const s02 = await S02.build(W);
const scenes = [s02, await S34.build(W), await S57.build(W, { cal: s02.cal })];

// 机位：各段关键帧拼成一条轨道（位置、目标点分开插值）
const keys = scenes.flatMap((s) => s.cam);
const camPos = track(keys.map((k) => [k[0], k[1]]));
const camTgt = track(keys.map((k) => [k[0], k[2]]));

// 字幕预览（?caps=1）。成片不烧字幕，交付 SRT
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt.replace(/\n/g, "<br>")}</b>`, "cap2") })) : [];

function frame(t) {
  const p = camPos(t), q = camTgt(t);
  for (const s of scenes) if (s.camOff) { const o = s.camOff(t); for (let i = 0; i < 3; i++) { p[i] += o[i]; q[i] += o[i]; } }
  W.setCam({ pos: p, tgt: q });
  for (const s of scenes) s.state(t);
  W.render();
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
