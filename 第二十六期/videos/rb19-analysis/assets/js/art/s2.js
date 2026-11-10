// S2 规则与设计者：1978 年莲花 79 的轮廓线稿（只画轮廓，不画涂装）＋车底流线 → 1983 平底板盖下 → 2022 掀开；
// 年份牌；纽维毕业设计的纸页（示意，不是原件）。
import { svg, show, drawable, draw, cam, camAttr, toScreen } from "./svg.js";
import { defineLabels } from "../hud.js";
import { definePlates } from "../overlay.js";
import { clamp, mix, ease, clunk } from "../lib.js";
import { Y78, SLAM, Y22, PAPER, BREAK } from "../timeline.js";

// ── 莲花 79（毫米，车头朝右，原点车尾地面）：楔形车身、长侧箱、高尾翼；比例为示意 ──
const LOTUS = [
  "M4350,170 C4000,230 3500,330 3050,470 L2950,520 C2800,700 2550,760 2450,700 L2380,560 C2000,600 1500,640 1050,600 L700,560",   // 鼻锥 → 座舱 → 发动机盖
  "M4350,170 L4330,120 L3150,110",                       // 鼻锥下沿
  "M3150,110 L3150,330 C2700,380 1600,400 1150,330 L1150,90 Z",   // 侧箱
  "M2780,640 L2700,860 L2600,640",                       // 防滚架
  "M120,1000 L700,1000 L700,930 L120,950 Z M380,950 L380,560 M240,960 L240,560", // 尾翼与支架
];
const layer = svg("g", { fill: "none", stroke: "#cfd8e2", "stroke-width": 12, "stroke-linejoin": "round", "stroke-linecap": "round" });
const lotus = LOTUS.map((d) => drawable(svg("path", { d }, layer)));
const lw = [[800, 330, 330], [3550, 300, 300]].map(([x, y, r]) => drawable(svg("circle", { cx: x, cy: y, r, fill: "#0a1828", "stroke-width": 16 }, layer)));
// 车底流线：侧箱下面的文丘里通道（三条，流动的虚线）
const FLOW = ["M3150,130 C2700,70 2200,40 1700,60 C1400,80 1200,140 1000,240", "M3150,170 C2700,110 2200,90 1700,110 C1400,130 1200,190 1000,290", "M3150,90 C2700,40 2200,22 1700,30 C1400,45 1200,100 1000,190"];
const flows = FLOW.map((d) => svg("path", { d, stroke: "#58c4ff", "stroke-width": 9, "stroke-dasharray": "60 40" }, layer));
// 1983：平底板（从下面盖上来）
const slab = svg("rect", { x: 1000, y: -20, width: 2250, height: 50, fill: "#ffb454", stroke: "none" }, layer);
const C78 = cam(420, 800, .3);

// ── 年份牌 ──
const year = (t) => (t < SLAM - .25 ? "1978" : t < Y22 - .25 ? "1983" : "2022");
definePlates([{ id: "year", a: Y78, b: 32.4, x: 1620, y: 250, html: '<div class="big"></div><div class="sub"></div>',
  update(e, t) { const y = year(t), big = e.querySelector(".big"), sub = e.querySelector(".sub"), s = y === "1978" ? "地面效应登场" : y === "1983" ? "车底必须是平的" : "地面效应回归"; if (big.textContent !== y) { big.textContent = y; sub.textContent = s; } } }]);

// ── 纸页（HTML，压在线稿上面）：手绘风格的课题页，示意 ──
const paper = document.createElement("div"); paper.className = "paper";
paper.innerHTML = `<div class="pt">毕业设计（示意）</div><div class="ps">1980 · 南安普顿大学</div>
<svg viewBox="0 0 900 420" width="900" height="420"><g fill="none" stroke="#2b3440" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">
<rect x="30" y="30" width="840" height="330" stroke-dasharray="14 10" stroke="#6b7685"/>
<path d="M140,250 C200,215 330,190 450,180 C560,172 640,150 700,190 C740,215 770,240 780,260 L140,262 Z"/>
<path d="M300,190 C340,150 420,140 470,165"/><circle cx="250" cy="262" r="36"/><circle cx="660" cy="262" r="36"/>
<line x1="30" y1="300" x2="870" y2="300" stroke="#6b7685"/></g>
<g fill="none" stroke-width="5" stroke-linecap="round" class="pf"><path d="M60,282 C200,278 330,272 450,272 C570,272 700,278 860,282" stroke="#2f78c4" stroke-dasharray="26 16"/>
<g class="pbreak"><path d="M380,282 L520,282" stroke="#ece4d1" stroke-width="16" stroke-dasharray="none"/><path d="M380,282 L520,282" stroke="#8b939c" stroke-width="6" stroke-dasharray="4 16"/><path d="M440,262 L460,302 M470,262 L450,302" stroke="#c0392b" stroke-width="5"/></g></g>
<text x="60" y="400" font-family="NotoSC" font-size="30" fill="#4a5563">车底气流（跑车上的地面效应）</text></svg>`;
document.getElementById("art").append(paper);
const pflow = paper.querySelector(".pf path"), pbreak = paper.querySelector(".pbreak");

defineLabels([
  { k: "tag", t: "1978 · 莲花 79", a: Y78 + .4, b: Y22, at: (t) => toScreen(cam(C78.x - (t - Y78) * 7, C78.y, C78.s * (1 + (t - Y78) * .004)), [2700, 860]), dx: 140, dy: -120 },
  { k: "proc", t: "1983 · 平底规则", a: SLAM + .1, b: Y22, at: (t) => toScreen(cam(C78.x - (t - Y78) * 7, C78.y, C78.s * (1 + (t - Y78) * .004)), [2100, 0]), dx: 0, dy: 120 },
  { k: "proc", t: "2022 · 新规则", a: Y22 + .2, b: 32.6, at: () => [960, 330] },
  { k: "tag", t: "1980 · 南安普顿大学 · 毕业设计（示意）", a: PAPER + .6, b: 41.4, at: () => [960, 300], dx: 0, dy: -150 },
]);

export function s2State(t) {
  // 莲花：1978 画出 → 1983 盖板 → 2022 退场
  const lo = clamp((t - Y78) / .3) * (1 - clamp((t - Y22) / .4));
  show(layer, lo);
  if (lo > .002) {
    layer.setAttribute("transform", camAttr(cam(C78.x - (t - Y78) * 7, C78.y, C78.s * (1 + (t - Y78) * .004))));
    lotus.forEach((e, i) => draw(e, (t - Y78 - .05 - i * .15) / .6)); lw.forEach((e) => draw(e, (t - Y78 - .2) / .6));
    const cut = t >= SLAM;
    flows.forEach((f, i) => { show(f, clamp((t - Y78 - .9 - i * .1) / .3)); f.style.strokeDashoffset = cut ? "0" : (t * 260).toFixed(0); f.setAttribute("stroke", cut ? "#5d6670" : "#58c4ff"); });
    // 平板从地面下方冲上来，盖住通道
    const k = t < SLAM - .25 ? 0 : clunk(t, SLAM - .25, .25);
    slab.setAttribute("y", mix(-420, -20, clamp(k, 0, 1.2)).toFixed(1)); show(slab, t > SLAM - .3 ? 1 : 0);
  }
  // 纸页：滑入、微微漂移；流线某一段断开变灰
  const po = t < PAPER ? 0 : clamp((t - PAPER) / .5) * (1 - clamp((t - 41.6) / .4));
  show(paper, po);
  if (po > .002) {
    const u = easeIn01(1 - clamp((t - PAPER) / .7));
    paper.style.transform = `translate(-50%,-50%) translate(${(Math.sin(t * .7) * 6).toFixed(1)}px,${(u * 600 + Math.cos(t * .6) * 4).toFixed(1)}px) rotate(${(-3 + Math.sin(t * .5) * .6).toFixed(2)}deg)`;
    pflow.style.strokeDashoffset = (-t * 120).toFixed(0);
    const br = clamp((t - BREAK) / .3); pbreak.style.opacity = br.toFixed(3);
  }
}
const easeIn01 = (x) => x * x;
