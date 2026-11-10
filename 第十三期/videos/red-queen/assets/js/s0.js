// S0 · 钩子 0.00–8.60
// 一条光带亮起 → 皮带开始跑 → 一个人踩上去，越跑越急 → 字幕先说结论。
import { el, ramp, ease, lerp } from "./lib.js";

export function build(world) {
  const label = el("2026 · 第十三期", "label", "hud", "left:96px;top:88px;opacity:0");

  return {
    state(t) {
      if (t > 11.4) return;
      const e = ease(ramp(t, 4.2, 3.6));
      world.tick(t, {
        effort: lerp(0.28, 0.95, e),
        lean: lerp(5, 13, e),
        mDim: ease(ramp(t, 0.55, 1.35)),
        rDim: ease(ramp(t, 1.25, 0.85)),
        dim: 1 - ease(ramp(t, 8.6, 1.9)),
      });
      label.style.opacity = ease(ramp(t, 1.0, 0.9)).toFixed(3);
    },
  };
}
