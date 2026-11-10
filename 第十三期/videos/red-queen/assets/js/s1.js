// S1 · 片名 8.60–13.20
// 机器沉到黑里，标题浮上来。整片只有这一次把标题写全。
import { el, vis, ramp, ease, lerp } from "./lib.js";

export function build(world) {
  const wrap = el(
    `<div class="title">社会进步了<br>为什么我<em>反而更累</em></div>`,
    "titlebox", "hud", "position:absolute;left:0;right:0;top:300px;text-align:center"
  );

  return {
    state(t) {
      if (t < 8.6 || t > 13.4) { vis(wrap, 0); return; }
      const f = ease(ramp(t, 9.0, 1.1)) * (1 - ease(ramp(t, 12.5, 0.9)));
      const dy = (1 - ease(ramp(t, 9.0, 1.4))) * 26;
      vis(wrap, f, `translateY(${dy.toFixed(1)}px)`);
      world.tick(t, {
        effort: 0.34,
        lean: 5,
        mDim: 1,
        rDim: 1,
        dim: lerp(0.55, 0.16, ease(ramp(t, 8.8, 1.6))),
      });
    },
  };
}
