// 线稿层的 SVG 基元：建元素、逐笔描出、毫米坐标 → 屏幕坐标。全部只改属性，不重建 DOM（AGENTS.md 4.2）。
import { clamp } from "../lib.js";

export const NS = "http://www.w3.org/2000/svg";
export const stage = document.createElementNS(NS, "svg");
stage.setAttribute("width", 1920); stage.setAttribute("height", 1080); stage.setAttribute("viewBox", "0 0 1920 1080");
stage.innerHTML = `<defs>
  <marker id="art-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker>
  <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="9" stroke="#ffb454" stroke-width="3"/></pattern>
  <filter id="glow" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;
document.getElementById("art").append(stage);

/** 建一个 SVG 元素：svg('path', { d, ... }, parent) */
export function svg(tag, attrs = {}, parent = stage) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  parent.append(e); return e;
}
export const show = (e, o) => { e.style.opacity = o.toFixed(3); e.style.visibility = o > .002 ? "visible" : "hidden"; };

/** 让一条线可以逐笔画出：p 0..1 */
export function drawable(e) { e.setAttribute("pathLength", "1"); e.style.strokeDasharray = "1 1"; e.style.strokeDashoffset = "1"; return e; }
export function draw(e, p) { e.style.strokeDashoffset = (1 - clamp(p)).toFixed(4); }

/** 毫米坐标系的「机位」：屏幕上 (x, y) 处放车身原点（车尾、地面），比例 s 像素/毫米，y 向上 */
export const cam = (x, y, s, rot = 0) => ({ x, y, s, rot });
export const camAttr = (c) => `translate(${c.x.toFixed(2)} ${c.y.toFixed(2)}) scale(${c.s.toFixed(5)} ${(-c.s).toFixed(5)})${c.rot ? ` rotate(${c.rot.toFixed(3)})` : ""}`;
/** 毫米点 → 屏幕点（不含 rot，用于标注锚点） */
export const toScreen = (c, [mx, my]) => [c.x + mx * c.s, c.y - my * c.s];
