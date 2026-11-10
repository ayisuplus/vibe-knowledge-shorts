// S6 · 答案 63.40–75.40
// 不止你一个人在升：画面里陆续出现别人的及格线，一根一根往上走。
import { mk, C } from "./rig.js";
import { ramp, ease, lerp } from "./lib.js";

export function build(world) {
  const N = 6;
  const lines = [];
  for (let i = 0; i < N; i++) {
    lines.push(mk("line", {
      x1: 236, y1: 0, x2: 1252, y2: 0,
      stroke: C.warn, "stroke-width": 2, "stroke-dasharray": "20 18", opacity: 0,
    }, world.s.g));
  }

  return {
    state(t) {
      if (t < 63.4 || t > 75.6) { lines.forEach((l) => l.setAttribute("opacity", 0)); return; }
      world.tick(t, {
        effort: lerp(0.55, 0.8, ease(ramp(t, 63.4, 6))),
        lean: 9,
        mDim: 1,
        rDim: 1,
        dim: 1,
      });

      world.bl.reveal(ease(ramp(t, 63.5, 1.0)));
      const fade = 1 - ease(ramp(t, 74.2, 1.0));
      lines.forEach((l, i) => {
        const t0 = 66.2 + i * 0.55;
        const k = ease(ramp(t, t0, 5.2));
        const y = lerp(690, 372 + [0, 38, 72, 118, 158, 196][i], k);
        l.setAttribute("y1", y);
        l.setAttribute("y2", y);
        l.setAttribute("opacity", (ease(ramp(t, t0, 1.2)) * (0.24 + i * 0.035) * fade).toFixed(3));
      });
    },
  };
}
