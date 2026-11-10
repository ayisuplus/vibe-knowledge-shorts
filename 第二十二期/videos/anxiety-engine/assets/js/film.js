import { build } from "./world.js";
import { sections } from "./sections.js";
import { DUR } from "./beats.js";
import { ramp } from "./lib.js";

// 字体加载完成后才注册唯一时间轴，确保 Canvas 文字和截图一致。
await Promise.all(["700 40px NotoSC", "800 40px NotoSC", "500 40px NotoSC", "700 40px NotoSerifSC", "40px WenKai"].map((f) => document.fonts.load(f)));
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
  for (const c of caps) { const a = ramp(t, c.t0, .16) * (1 - ramp(t, c.t1 - .16, .16)); c.el.style.opacity = a.toFixed(4); c.el.style.visibility = a > .002 ? "visible" : "hidden"; }
}
const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
