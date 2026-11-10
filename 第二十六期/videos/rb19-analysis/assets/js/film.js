// 《RB19 为什么能赢？》：一条驱动 tween，每帧状态都由 t 算出（AGENTS.md 4.2）。
// 层从下到上：环境底图（env）→ 线稿与分析图（art）→ 机械特写（mech）→ 叠层（overlay）→ 标注、字幕（hud）。
import { DUR } from "./beats.js";
import { envState } from "./env.js";
import { overlayState } from "./overlay.js";
import { hudState } from "./hud.js";
import { mechState } from "./mech/host.js";
import { linecarState } from "./art/linecar.js";
import { s2State } from "./art/s2.js";
import { sectionState } from "./art/section.js";
import { topState } from "./art/top.js";
import { chainState } from "./art/chain.js";
import "./s1.js";
import "./mech/suspension.js";
import "./mech/drs.js";

const NOCAP = /[?&]nocap/.test(location.search);
function frame(t) {
  envState(t);
  linecarState(t); s2State(t); sectionState(t); topState(t); chainState(t);
  mechState(t);
  overlayState(t); hudState(t, { hideCaptions: NOCAP });
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
