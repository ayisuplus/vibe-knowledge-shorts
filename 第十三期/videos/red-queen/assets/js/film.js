// 入口：一段驱动 tween，每帧把 t 交给各段。所有画面状态都由 t 算出，可任意跳帧。
import { build } from "./world.js";
import { sections } from "./sections.js";
import { floorLayer, gaugeLayer, ringsLayer, crowdLayer } from "./overlays.js";
import { DUR } from "./beats.js";
import { ramp } from "./lib.js";

const hud = document.getElementById("hud");
const stageEl = document.getElementById("stage");

const SHOW_CAPS = !!window.__FORCE_CAPS || /[?&]caps=1/.test(location.search);

/* ---------------- 字幕层 ---------------- */
const caps = [];
function buildCaps() {
  const list = window.CAPTIONS || [];
  for (const [t0, t1, text] of list) {
    const e = document.createElement("div");
    e.className = "cap";
    e.style.opacity = 0;
    e.style.visibility = "hidden";
    e.innerHTML = text.replace(/<hi>/g, '<span style="color:#ff8f5e">').replace(/<\/hi>/g, "</span>");
    hud.appendChild(e);
    caps.push({ e, t0, t1 });
  }
}
function drawCaps(t) {
  if (!SHOW_CAPS) return;
  for (const c of caps) {
    const a = ramp(t, c.t0, 0.14) * (1 - ramp(t, c.t1 - 0.14, 0.14));
    c.e.style.opacity = a.toFixed(3);
    c.e.style.visibility = a > 0.004 ? "visible" : "hidden";
  }
}

/* ---------------- 场景 ---------------- */
const world = build();
const floor = floorLayer(world);
const crowd = crowdLayer();
const gauge = gaugeLayer();
const rings = ringsLayer();
const segs = sections(world);
buildCaps();

// 段间插点：镜头怼到读数上（起止都在拍上）
const GAUGE = { t0: 29.75, t1: 31.55, from: 1.4, to: 2.4 };

function frame(t) {
  floor.state(t);
  crowd.state(t);
  rings.state(t);
  gauge.state(t, GAUGE);

  // 插点期间跑道让位
  const cover = ramp(t, GAUGE.t0 - 0.1, 0.2) * (1 - ramp(t, GAUGE.t1 - 0.2, 0.2));
  stageEl.style.opacity = (1 - 0.85 * cover).toFixed(3);

  for (const s of segs) s.state(t);
  drawCaps(t);
}

/* ---------------- 驱动 ---------------- */
window.__timelines = window.__timelines || {};
const tl = (window.__timelines["main"] = gsap.timeline({ paused: true }));
const drv = { k: 0 };
tl.to(drv, { k: 1, duration: DUR, ease: "none", onUpdate: () => frame(drv.k * DUR) });
frame(0);

window.__DUR = DUR;
