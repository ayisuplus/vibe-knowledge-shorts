// 总装：各段按时间接力，每帧调用它们的 state(t)。全是 DOM，没有 3D 引擎。
import { win, el, show } from "./lib.js";
import * as S0 from "./s0.js";
import * as L1 from "./l1.js";
import * as L2 from "./l2.js";
import * as L3 from "./l3.js";
import * as S5 from "./s5.js";

await document.fonts.load("700 40px VibeSerif");
await document.fonts.load("700 40px NotoSC");
await document.fonts.load("400 20px CMono");
await Promise.all(["envelope", "room", "archive", "switch", "letters", "paper"].map((n) => { const i = new Image(); i.src = `assets/img/${n}.jpg`; return i.decode().catch(() => 0); }));

const scenes = [S0.build(), L1.build(), L2.build(), L3.build(), S5.build()];

// 字幕预览（?caps=1）。画面上的字就是正文，SRT 只是给剪映 / 无障碍用
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt.replace(/\n/g, "<br>")}</b>`, "cap2", "hud") })) : [];

function frame(t) {
  for (const s of scenes) s.state(t);
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
