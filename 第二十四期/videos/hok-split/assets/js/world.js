import { ERA } from "./beats.js";
import { clamp } from "./lib.js";
import { rays } from "./rig.js";

// 场景根：画布、底色与放射线、镜头、抖动、HUD（角标 / 章节条 / 注释带）。
// 每帧 begin(t) 清空重画；各段在 state(t) 里画自己的东西，并用 w.note()/w.tag() 声明这一帧的注释与角标，
// end(t) 统一写进 DOM——没声明就隐藏，所以跳帧不会留下残影。
// 抖动只给 4 下（用户反馈：频繁抖动会晕），时刻由 sections 登记在 w.hits 里。
export function build() {
  const canvas = document.getElementById("cv"), ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="tag"></div><div class="era"></div><div class="note"></div>';
  const elTag = hud.querySelector(".tag"), elEra = hud.querySelector(".era"), elNote = hud.querySelector(".note");
  const w = { canvas, ctx, t: 0, hits: [], _note: "", _tag: "", _bg: null };

  /** 这一帧的抖动偏移（4 下撞击，各自 0.35 秒衰减） */
  w.shake = (t) => {
    let x = 0, y = 0;
    for (const [h, amp] of w.hits) { const d = t - h; if (d < 0 || d > 0.35) continue; const k = (1 - d / 0.35) ** 2 * amp; x += Math.sin(d * 90) * k; y += Math.cos(d * 70) * k * 0.7; }
    return [x, y];
  };
  /** 镜头：画面中心对准 (cx, cy)，缩放 z，叠加抖动；各段画之前调用 */
  w.cam = (cx = 960, cy = 540, z = 1, rot = 0) => {
    const [sx, sy] = w.shake(w.t);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(960 + sx, 540 + sy); ctx.rotate(rot); ctx.scale(z, z); ctx.translate(-cx, -cy);
  };
  w.note = (s) => { w._note = s; };
  w.tag = (s) => { w._tag = s; };
  /** 底色：bg = {top, bot, ray, rayA, cx, cy}，由各段每帧给定；默认深蓝 */
  w.bg = (o) => { w._bg = o; };

  w.begin = (t) => {
    w.t = t; w._note = ""; w._tag = ""; w._bg = null;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, 1920, 1080);
  };
  w.paintBg = (t) => {
    const o = Object.assign({ top: "#1b2a5c", bot: "#070b1c", rayA: 0.045, cx: 960, cy: 470, ray: "#ffffff" }, w._bg || {});
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createRadialGradient(o.cx, o.cy, 60, o.cx, o.cy, 1300); g.addColorStop(0, o.top); g.addColorStop(1, o.bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1920, 1080);
    if (o.rayA > 0) rays(ctx, o.cx, o.cy, t, o.rayA, 24, o.ray);
    ctx.restore();
  };
  w.end = (t) => {
    // 字幕区压一条渐暗带，画面元素铺到底部时字幕仍然清楚
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const g = ctx.createLinearGradient(0, 860, 0, 1080); g.addColorStop(0, "rgba(5,8,20,0)"); g.addColorStop(1, "rgba(5,8,20,.72)");
    ctx.fillStyle = g; ctx.fillRect(0, 860, 1920, 220);
    let era = ""; for (const [t0, s] of ERA) if (t >= t0) era = s;
    elEra.textContent = era; elEra.style.visibility = era && era !== "⑥" ? "visible" : "hidden";
    elNote.textContent = w._note; elNote.style.visibility = w._note ? "visible" : "hidden";
    elTag.textContent = w._tag; elTag.style.visibility = w._tag ? "visible" : "hidden";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };
  return w;
}
export const inWin = (t, a, b) => t >= a && t < b;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
