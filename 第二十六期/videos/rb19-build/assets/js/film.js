// 《从零造一台 RB19》：一条驱动 tween，每帧状态都由 t 算出（AGENTS.md 4.2）。
import { composer } from "./world.js";
import { DUR } from "./beats.js";
import { state, hud } from "./sections.js";

const NOCAP = /[?&]nocap/.test(location.search);
function frame(t) { state(t); composer.render(); hud(t, NOCAP); }

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
