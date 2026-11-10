// S2 · 认账 13.20–25.80
// 先给一个对我不利的数字：工时确实在变短。那个大数字自己往下掉。
import { el, vis, ramp, ease, lerp, win } from "./lib.js";

export function build(world) {
  const box = el("", "block", "hud", "right:150px;top:246px;width:760px;text-align:right");
    box.innerHTML = `<div class="big" style="font-size:172px;line-height:1">3000</div>
    <div class="small" style="margin-top:16px">1870 年代 · 每年工作小时</div>`;
  const num = box.querySelector(".big");
  const lab = box.querySelector(".small");

  return {
    state(t) {
      if (t < 13.2 || t > 25.9) { vis(box, 0); return; }
      world.tick(t, {
        effort: lerp(0.42, 0.58, ease(ramp(t, 16, 7))),
        lean: 8,
        dim: ease(ramp(t, 13.2, 1.3)),
        mDim: 1,
        rDim: 1,
      });

      vis(box, win(t, 16.2, 23.5, 0.6, 0.7));

      const k = ease(ramp(t, 18.6, 1.7));
      num.textContent = Math.round(lerp(3000, 1500, k)).toString();
      lab.textContent = k > 0.5 ? "2010 年代 · 德国" : "1870 年代 · 每年工作小时";
      num.style.color = k > 0.5 ? "#ff8f5e" : "#b9f2ff";
    },
  };
}
