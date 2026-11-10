// HUD：画面标注（AGENTS.md 1.3.1「画面自解释」）、字幕、注释带。全是 t 的纯函数。
// 三种标注：full＝部件名＋一句作用（带引线）；tag＝只有名字（带引线）；proc＝过程说明（琥珀色大字，无框）。
import * as THREE from "three";
import { camera } from "./world.js";
import { clamp } from "./lib.js";

const hud = document.getElementById("hud");
hud.innerHTML = '<div class="note"></div>';
const noteEl = hud.querySelector(".note");
const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > .002 ? "visible" : "hidden"; };

let LABELS = [];
/** 注册标注：{ k, t, f, a, b, at: (t) => Vector3（世界坐标）, dx, dy } */
export function defineLabels(list) {
  LABELS = list.map((l) => {
    const el = document.createElement("div"); el.className = `lbl ${l.k}${l.c ? " " + l.c : ""}`;
    el.innerHTML = l.k === "full" ? `<div class="nm">${l.t}</div><div class="fn">${l.f}</div>` : l.t;
    const line = l.k === "proc" ? null : Object.assign(document.createElement("div"), { className: "lead" });
    if (line) hud.append(line); hud.append(el); return { ...l, el, line };
  });
}
const _v = new THREE.Vector3();
function labels(t) {
  for (const l of LABELS) {
    const o = clamp((t - l.a) / .18) * (1 - clamp((t - l.b + .15) / .15));
    show(l.el, o); if (l.line) show(l.line, o); if (o <= .002) continue;
    _v.copy(l.at(t)).project(camera);
    const x = (_v.x + 1) * 960, y = (1 - _v.y) * 540, w = l.el.offsetWidth, h = l.el.offsetHeight;
    // 安全区：不压顶部注释带（y < 120）和底部字幕带（y > 840）
    const X = Math.min(Math.max(x + l.dx, l.k === "proc" ? 40 + w / 2 : l.dx < 0 ? 40 + w : 40), l.k === "proc" ? 1880 - w / 2 : l.dx < 0 ? 1880 : 1880 - w);
    const Y = Math.min(Math.max(y + l.dy, l.k === "proc" ? 120 + h / 2 : l.dy < 0 ? 120 + h : 120), l.k === "proc" ? 840 - h / 2 : l.dy < 0 ? 840 : 840 - h);
    if (l.k === "proc") { l.el.style.transform = `translate(${(X - l.el.offsetWidth / 2).toFixed(1)}px,${(Y - l.el.offsetHeight / 2).toFixed(1)}px) scale(${(.9 + .1 * clamp((t - l.a) / .25)).toFixed(3)})`; continue; }
    const len = Math.hypot(X - x, Y - y), ang = Math.atan2(Y - y, X - x);
    l.el.style.transform = `translate(${(X - (l.dx < 0 ? l.el.offsetWidth : 0)).toFixed(1)}px,${(Y - (l.dy < 0 ? l.el.offsetHeight : 0)).toFixed(1)}px)`;
    l.line.style.width = (len * clamp((t - l.a) / .25)).toFixed(1) + "px"; l.line.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
  }
}
const caps = window.CAPTIONS.map(([a, b, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>"); hud.appendChild(el); return { el, a, b }; });

export function hudState(t, { hideCaptions = false } = {}) {
  for (const c of caps) show(c.el, hideCaptions ? 0 : clamp((t - c.a) / .1) * (1 - clamp((t - c.b + .1) / .1)));
  labels(t);
  let nt = ""; for (const [a, b, s] of window.NOTES) if (t >= a && t < b) nt = s; if (noteEl.textContent !== nt) noteEl.textContent = nt;
}
