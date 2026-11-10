// S5 · 凯恩斯与今天 52.60–63.55
// 一根十五小时的条，和两根今天的条放在同一把尺子上。数据用冷青，橙色不参与。
import { el, vis, win, ramp, ease, lerp } from "./lib.js";

const ROWS = [
  { nm: "凯恩斯设想 · 1930", v: 15.0, t0: 53.4 },
  { nm: "美国私营部门 · 2026 年 9 月", v: 34.4, t0: 58.3 },
  { nm: "中国企业就业人员 · 2024", v: 49.0, t0: 59.4 },
];
const MAXW = 520, SCALE = 50;

const rowHtml = (r) => `<div class="barrow" style="display:block;margin-bottom:26px;opacity:0">
    <div class="nm" style="font-family:NotoSC,sans-serif;font-size:24px;letter-spacing:.04em;color:#a9c0d4;margin-bottom:9px;width:auto;text-align:left">${r.nm}</div>
    <div style="display:flex;align-items:center;gap:18px">
      <div class="bar" style="width:0"></div>
      <div class="vl">${r.v.toFixed(1)}<span style="font-size:18px;color:#5b8fa8;letter-spacing:.06em;margin-left:5px">h</span></div>
    </div>
  </div>`;

export function build(world) {
  const box = el("", "block", "hud", "left:130px;top:300px;width:760px");
  box.innerHTML =
    `<div class="tag" style="margin-bottom:30px">每周工作小时</div>` +
    ROWS.map(rowHtml).join("");

  const rows = [...box.querySelectorAll(".barrow")].map((e) => ({
    e, bar: e.querySelector(".bar"), vl: e.querySelector(".vl"),
  }));

  return {
    state(t) {
      if (t < 52.6 || t > 63.55) { vis(box, 0); return; }
      vis(box, win(t, 52.9, 63.0, 0.7, 0.5));
      world.bl.reveal(0);
      world.tick(t, {
        effort: 0.5,
        lean: 9,
        mDim: 1,
        rDim: 1,
        dim: lerp(0.6, 1, ease(ramp(t, 52.6, 1.4))),
      });

      ROWS.forEach((r, i) => {
        const k = ease(ramp(t, r.t0, i === 0 ? 1.0 : 1.3));
        rows[i].e.style.opacity = k.toFixed(3);
        rows[i].bar.style.width = (k * (r.v / SCALE) * MAXW).toFixed(1) + "px";
        rows[i].vl.style.opacity = k.toFixed(3);
      });
    },
  };
}