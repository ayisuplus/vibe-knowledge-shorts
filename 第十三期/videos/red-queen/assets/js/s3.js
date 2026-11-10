// S3 · 及格线 25.00–38.60
// 画面里第一次出现橙色。它不是在标「危险」，是在标「及格」。
import { ramp, ease, lerp } from "./lib.js";

export function build(world) {
  return {
    state(t) {
      if (t < 25.0 || t > 38.7) return;

      // 从脚踝升到腰，再升到胸口 —— 两次抬升之间有一次「你跑得越快它涨得越快」
      const a = ease(ramp(t, 28.4, 2.2));
      const b = ease(ramp(t, 34.0, 2.4));
      world.bl.set(lerp(lerp(640, 470, a), 372, b));
      world.bl.sweep(ease(ramp(t, 25.0, 0.9)));
      world.bl.reveal(ease(ramp(t, 25.0, 0.5)));
      world.bl.label.style.opacity = ease(ramp(t, 29.0, 1.0)).toFixed(3);

      const push = ease(ramp(t, 33.4, 2.6));
      world.tick(t, {
        effort: lerp(0.5, 0.95, push),
        lean: lerp(9, 15, push),
        mDim: 1,
        rDim: 1,
        dim: 1,
      });
    },
  };
}
