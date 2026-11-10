// 总装：各段按时间接力，每帧调用它们的 state(t)。全是 DOM，没有 3D 引擎。
import { el, show, win } from "./lib.js";
import * as S0 from "./s0.js";
import * as S3 from "./s3.js";
import * as S4 from "./s4.js";
import * as S5 from "./s5.js";
import * as S6 from "./s6.js";
import * as S7 from "./s7.js";

await document.fonts.load('800 190px "NotoSerifSC"');
await document.fonts.load('600 40px "NotoSC"');
await document.fonts.load('400 52px "WenKai"');

// 纸纹和窗光：最底层，不参与动画
const paper = document.getElementById("paper");
for (const c of ["winlight", "winbars", "grain"]) {
  const d = document.createElement("div");
  d.className = c;
  paper.appendChild(d);
}

const scenes = [S0.build(), S3.build(), S4.build(), S5.build(), S6.build(), S7.build()];

// 字幕预览（?caps=1）。成片不烧字幕，交付 SRT
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS
  ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt.replace(/\n/g, "<br>")}</b>`, "cap", "hud") }))
  : [];

function frame(t) {
  for (const s of scenes) s.state(t);
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
