// S7 · 收 75.40–85.00
// 皮带减速到停，灯亮起来。不停在「加油」，停在一个问句上。
import { el, vis, ramp, ease, lerp } from "./lib.js";

export function build(world) {
  const light = el("", "glowup", "hud", "position:absolute;inset:0;background:radial-gradient(46% 52% at 50% 44%, rgba(255,216,172,.66), rgba(255,186,132,.18) 46%, transparent 74%)");

  return {
    state(t) {
      if (t < 75.4) { vis(light, 0); return; }
      vis(light, ease(ramp(t, 78.4, 4.4)) * 0.92);
      world.bl.reveal(1 - ease(ramp(t, 78.6, 3.0)));
      world.tick(t, {
        effort: lerp(0.8, 0.2, ease(ramp(t, 75.4, 3.4))),
        lean: lerp(9, 2, ease(ramp(t, 76.0, 3.0))),
        mDim: 1 - ease(ramp(t, 79.4, 3.2)),
        rDim: 1,
        dim: 1,
      });
    },
  };
}
