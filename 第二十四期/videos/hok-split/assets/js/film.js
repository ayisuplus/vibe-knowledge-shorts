import { build } from "./world.js";
import { sections } from "./sections.js";
import { DUR } from "./beats.js";
import { ramp } from "./lib.js";
import { loadAll } from "./rig.js";

// 字体和图片都加载完成后才注册唯一时间轴，确保 Canvas 绘制和截图一致。
await Promise.all(["900 40px NotoSC", "700 40px NotoSC", "600 40px NotoSC", "40px WenKai"].map((f) => document.fonts.load(f)));
await loadAll();
const world = build(), states = sections(world), hud = document.getElementById("hud"), caps = [];
for (const [t0, t1, content, , flag] of window.CAPTIONS) {
  if (flag === "noshow") continue;
  const el = document.createElement("div"); el.className = "caption";
  el.innerHTML = content.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>");
  hud.appendChild(el); caps.push({ el, t0, t1 });
}
function frame(t) {
  world.begin(t);
  for (const s of states) s.state(t);
  world.end(t);
  for (const c of caps) { const a = ramp(t, c.t0, .12) * (1 - ramp(t, c.t1 - .12, .12)); c.el.style.opacity = a.toFixed(4); c.el.style.visibility = a > .002 ? "visible" : "hidden"; }
}
const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
