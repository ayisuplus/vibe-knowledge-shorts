// HUD：画面标注（AGENTS.md 1.3.1「画面自解释」）、示意线（标尺、力箭头）、字幕、注释带。全是 t 的纯函数。
// 标注不关心锚点从哪来：at(t) 直接给屏幕坐标 [x, y]（线稿、照片、机械特写各自负责投影），返回 null 表示看不见。
// 三种标注：full＝部件名＋一句作用（带引线）；tag＝只有名字（带引线）；proc＝过程说明（琥珀色大字，无框）。
import { clamp } from "./lib.js";

const hud = document.getElementById("hud");
const NS = "http://www.w3.org/2000/svg";
const svg = document.createElementNS(NS, "svg"); svg.setAttribute("class", "marks"); svg.setAttribute("width", 1920); svg.setAttribute("height", 1080);
svg.innerHTML = '<defs><marker id="mk-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>';
hud.append(svg);
const noteEl = Object.assign(document.createElement("div"), { className: "note" }); hud.append(noteEl);
const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > .002 ? "visible" : "hidden"; };
const fade = (t, a, b, f = .18) => clamp((t - a) / f) * (1 - clamp((t - b + f) / f));

// ── 标注 ──
let LABELS = [];
/** 注册标注：{ k:'full'|'tag'|'proc', t 名字, f 作用, a 入秒, b 出秒, at:(t)=>[x,y]|null, dx, dy, c 额外类名 } */
export function defineLabels(list) {
  LABELS.push(...list.map((l) => {
    const el = document.createElement("div"); el.className = `lbl ${l.k}${l.c ? " " + l.c : ""}`;
    el.innerHTML = l.k === "full" ? `<div class="nm">${l.t}</div><div class="fn">${l.f}</div>` : l.t;
    const line = l.k === "proc" ? null : Object.assign(document.createElement("div"), { className: "lead" });
    if (line) hud.append(line); hud.append(el); return { dx: 0, dy: 0, ...l, el, line };
  }));
}
function labels(t) {
  for (const l of LABELS) {
    let o = fade(t, l.a, l.b); const p = o > .002 ? l.at(t) : null; if (!p) o = 0;
    show(l.el, o); if (l.line) show(l.line, o); if (o <= .002) continue;
    const [x, y] = p, w = l.el.offsetWidth, h = l.el.offsetHeight;
    // 安全区：不压顶部注释带（y < 135）和底部字幕带（y > 840）
    if (l.k === "proc") {
      const X = clamp(x + l.dx, 40 + w / 2, 1880 - w / 2), Y = clamp(y + l.dy, 135 + h / 2, 840 - h / 2);
      l.el.style.transform = `translate(${(X - w / 2).toFixed(1)}px,${(Y - h / 2).toFixed(1)}px) scale(${(.9 + .1 * clamp((t - l.a) / .25)).toFixed(3)})`; continue;
    }
    const X = clamp(x + l.dx, l.dx < 0 ? 40 + w : 40, l.dx < 0 ? 1880 : 1880 - w), Y = clamp(y + l.dy, l.dy < 0 ? 135 + h : 135, l.dy < 0 ? 840 : 840 - h);
    const len = Math.hypot(X - x, Y - y), ang = Math.atan2(Y - y, X - x);
    l.el.style.transform = `translate(${(X - (l.dx < 0 ? w : 0)).toFixed(1)}px,${(Y - (l.dy < 0 ? h : 0)).toFixed(1)}px)`;
    l.line.style.width = (len * clamp((t - l.a) / .25)).toFixed(1) + "px"; l.line.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
  }
}

// ── 示意线：箭头（力、气流）、标尺（高度差）。{ kind:'arrow'|'dim'|'line', a, b, pts:(t)=>[[x,y],...]|null, color, w, dash, off:(t)=>虚线偏移, col:(t)=>颜色, grow:(t)=>0..1 } ──
let MARKS = [];
export function defineMarks(list) {
  MARKS.push(...list.map((m) => {
    const g = document.createElementNS(NS, "g"); svg.append(g);
    const path = document.createElementNS(NS, "path"); path.setAttribute("fill", "none"); path.setAttribute("stroke", m.color || "#ffb454");
    path.setAttribute("stroke-width", m.w || 5); path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-linejoin", "round");
    if (m.dash) path.setAttribute("stroke-dasharray", m.dash);
    if (m.kind === "arrow") path.setAttribute("marker-end", "url(#mk-arr)");
    if (m.kind === "dim") { path.setAttribute("marker-start", "url(#mk-arr)"); path.setAttribute("marker-end", "url(#mk-arr)"); }
    g.append(path); return { ...m, g, path };
  }));
}
function marks(t) {
  for (const m of MARKS) {
    let o = fade(t, m.a, m.b, .25); const P = o > .002 ? m.pts(t) : null; if (!P) o = 0;
    show(m.g, o); if (o <= .002) continue;
    let pts = P;
    if (m.grow) { const k = clamp(m.grow(t)), [a, b] = [P[0], P[P.length - 1]]; pts = [a, [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]]; if (k < .02) { show(m.g, 0); continue; } }
    m.path.setAttribute("d", "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L"));
    if (m.off) m.path.style.strokeDashoffset = m.off(t).toFixed(1);
    if (m.col) m.path.setAttribute("stroke", m.col(t));
  }
}

// ── 字幕、注释带（来自 captions.js，由 script.py 生成） ──
const caps = window.CAPTIONS.filter((c) => c[3] !== "noshow").map(([a, b, s]) => {
  const el = document.createElement("div"); el.className = "caption";
  el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>"); hud.appendChild(el); return { el, a, b };
});
export function hudState(t, { hideCaptions = false } = {}) {
  for (const c of caps) show(c.el, hideCaptions ? 0 : clamp((t - c.a) / .1) * (1 - clamp((t - c.b + .1) / .1)));
  marks(t); labels(t);
  let nt = ""; for (const [a, b, s] of window.NOTES) if (t >= a && t < b) nt = s; if (noteEl.textContent !== nt) noteEl.textContent = nt;
}
