// v13：数学公式的 MG 动画小工具（全部是 t 的纯函数，可任意跳帧）
// odometer：一串数字像里程表一样逐位滚动停住；gearPath：齿轮轮廓；svg：在 HUD 里建一块 SVG 画布；flyTo：从 A 飞到 B 的弧线位置
import { ramp, ease, easeOut, easeInOut, clamp, lerp, el } from "./util.js";

export const fmt = (n) => Math.round(n).toLocaleString("en-US");

/** 里程表数字。str 里的数字位会滚动，其余字符（逗号）原样 */
export function odometer(str, cls, style = "") {
  const col = Array.from({ length: 11 }, (_, i) => `<b>${i % 10}</b>`).join("");
  const e = el([...str].map((ch) => (/\d/.test(ch) ? `<span class="odo" data-d="${ch}"><i>${col}</i></span>` : `<span class="odc">${ch}</span>`)).join(""), "odom " + cls, "hud", style);
  const digs = [...e.querySelectorAll(".odo")].map((s) => ({ d: +s.dataset.d, i: s.querySelector("i") }));
  /** t0 起所有位一起滚，第 k 位滚 dur + k·stagger 秒（从左到右依次停住） */
  function set(t, t0, stagger = 0.06, dur = 1.1, spins = 2) {
    digs.forEach((g, k) => {
      const p = easeOut(ramp(t, t0, dur + k * stagger)), pos = g.d + 10 * (spins + k * stagger * 3) * (1 - p); // 一起开始转，从左到右依次停
      g.i.style.transform = `translateY(${(-(pos % 10) * 1.0).toFixed(4)}em)`;
    });
  }
  return { e, set };
}

/** 齿轮轮廓（中心在 0,0）：teeth 个齿，节圆半径 r，齿高 h */
export function gearPath(teeth, r, h) {
  // 每个齿是一个梯形：根 0 → 根 0.12 → 顶 0.3 → 顶 0.55 → 根 0.73（按一个齿距的比例）
  const F = [[0, -1], [0.12, -1], [0.3, 1], [0.55, 1], [0.73, -1]], pts = [];
  for (let k = 0; k < teeth; k++) for (const [f, s] of F) {
    const a = ((k + f) / teeth) * Math.PI * 2 - Math.PI / 2 - (0.425 / teeth) * Math.PI * 2, rr = r + (s * h) / 2; // 齿顶中心对准正上方
    pts.push([rr * Math.cos(a), rr * Math.sin(a)]);
  }
  return "M" + pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join("L") + "Z";
}

/** HUD 里的一块 SVG 画布（坐标就是屏幕像素） */
export function svg(inner, style = "") {
  const e = el(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">${inner}</svg>`, "mgsvg", "hud", style);
  return e;
}

/** 从 a 飞到 b（屏幕坐标），k 是进度，中段往上拱 arc 像素 */
export function flyTo(a, b, k, arc = 80) {
  const e = easeInOut(k);
  return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - arc * Math.sin(Math.PI * clamp(k)) };
}
/** 元素中心的屏幕坐标（按 1920×1080 舞台算） */
export function center(e) {
  const r = e.getBoundingClientRect(), s = document.getElementById("root").getBoundingClientRect(), k = 1920 / s.width;
  return { x: (r.left + r.width / 2 - s.left) * k, y: (r.top + r.height / 2 - s.top) * k };
}
