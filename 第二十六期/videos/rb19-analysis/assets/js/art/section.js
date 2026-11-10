// S3 前半、S4：车底侧面剖面（示意），画在赛道沥青近景上。车头朝右，气流相对车从右往左。
// 气流按「连续性」示意：通道越窄流速越快（v ∝ 1/间隙）；粒子位置由「飞行时间表」反查，纯 t 函数，可任意跳帧。
// S4：车身越压越低 → 中段气流断、变灰 → 下压力箭头消失 → 车弹起 → 又被吸下，两次；之后车身高度画成一条波浪线。
import { svg, show } from "./svg.js";
import { defineLabels, defineMarks } from "../hud.js";
import { clamp, mix, ease, hash, curve } from "../lib.js";
import { CUTS, DOWNF, LOWER, STALL_HITS, WAVE, PEAKS } from "../timeline.js";

const G = 762, X0 = 120, X1 = 1800, CAR = [260, 1660];
const gap0 = curve([[X0, 110], [CAR[0] - 40, 110], [CAR[0], 95], [500, 60], [800, 26], [1100, 22], [1350, 30], [1500, 60], [CAR[1], 80], [CAR[1] + 40, 110], [X1, 110]]);
const top = curve([[CAR[0], 95], [400, 140], [700, 165], [1000, 182], [1250, 175], [1450, 128], [CAR[1], 80]]);
/** 车身相对正常高度的上下（px，负＝更贴地） */
const [h1, h2] = STALL_HITS;
const ride = curve([[0, 0], [LOWER[0], 0], [LOWER[1], -12], [h1 - .1, -14], [h1 + .3, 34], [h1 + .62, 6], [h2 - .1, -14], [h2 + .3, 34], [h2 + .62, 6], [h2 + 1.1, 0], [200, 0]]);
/** 失速 0..1：贴得太近，中段气流断了 */
const stall = (t) => Math.max(...STALL_HITS.map((h) => clamp((t - h + .5) / .12) * (1 - clamp((t - h - .15) / .2))));
const gap = (x, t) => Math.max(5, gap0(x) + (x > CAR[0] - 40 && x < CAR[1] + 40 ? ride(t) : 0));
const on = (t) => (t >= CUTS.s3a && t < CUTS.s3b) || (t >= CUTS.s4a && t < CUTS.s4b);

const layer = svg("g", {});
const lowP = svg("path", { fill: "rgba(70,140,255,.55)", stroke: "none" }, layer);
// 车轮（不在剖面里，虚线示意位置，交代车头朝右）
const wheels = [[400, 96], [1460, 92]].map(([x, r]) => svg("circle", { cx: x, cy: G - r, r, fill: "none", stroke: "rgba(216,236,255,.45)", "stroke-width": 4, "stroke-dasharray": "12 10" }, layer));
const body = svg("path", { fill: "rgba(14,24,38,.92)", stroke: "#d8ecff", "stroke-width": 4, "stroke-linejoin": "round" }, layer);
const ceilLine = svg("path", { fill: "none", stroke: "#ffb454", "stroke-width": 5 }, layer);
const ground = svg("line", { x1: 0, y1: G, x2: 1920, y2: G, stroke: "rgba(220,230,240,.55)", "stroke-width": 3 }, layer);
const tag = svg("text", { x: CAR[0] + 30, y: G - 150, fill: "#9fb6cf", "font-family": "NotoSC", "font-size": 30, "font-weight": 600 }, layer); tag.textContent = "车底剖面（示意）";
// 粒子：四条流道，每条 26 颗
const LANES = [.2, .42, .64, .86], PER = 26, parts = [];
for (const L of LANES) for (let i = 0; i < PER; i++) parts.push({ L, ph: (i + hash(i * 7 + L * 100) * .6) / PER, e: svg("line", { "stroke-width": 4, "stroke-linecap": "round" }, layer) });
// 飞行时间表：从车头前方（X1）到 x 的用时，速度 ∝ 1/间隙
const NT = 400, TT = [];
{ let acc = 0; for (let i = 0; i <= NT; i++) { const x = X1 - (X1 - X0) * i / NT; if (i) acc += ((X1 - X0) / NT) * gap0(x) / 110 / 900; TT.push([acc, x]); } }
const TTOT = TT[NT][0];
const xAt = (tau) => { let a = 0, b = NT; while (b - a > 1) { const m = (a + b) >> 1; if (TT[m][0] < tau) a = m; else b = m; } const [ta, xa] = TT[a], [tb, xb] = TT[b]; return mix(xa, xb, (tau - ta) / (tb - ta || 1)); };
// 下压力箭头
const ARX = [900, 1120, 1340];
// 波浪轨迹
const wave = svg("polyline", { fill: "none", stroke: "#ffb454", "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round", filter: "url(#glow)" }, layer);
const WX = [180, 1740], WY = 330, WT = [LOWER[0], h2 + 1.1];
const wavePts = []; for (let i = 0; i <= 240; i++) { const s = mix(WT[0], WT[1], i / 240); wavePts.push([mix(WX[0], WX[1], i / 240), WY - ride(s) * 3.2]); }
const wpeak = [];
for (let i = 1; i < 240; i++) { const [, y0] = wavePts[i - 1], [, y] = wavePts[i], [, y1] = wavePts[i + 1]; if ((y < y0 && y <= y1) || (y > y0 && y >= y1)) wpeak.push(wavePts[i]); }

function arrowsAmt(t) {
  if (t < CUTS.s3b) return ease((t - DOWNF) / .6);
  return (t < LOWER[0] ? 1 : 1 + .4 * ease((t - LOWER[0]) / 2)) * (1 - stall(t)) * (1 - ease((t - WAVE[0]) / .4));
}
defineMarks(ARX.map((x, i) => ({
  kind: "arrow", a: DOWNF + i * .12, b: CUTS.s4b, w: 10, color: "#ffb454",
  pts: (t) => { if (!on(t)) return null; const y = G - gap(x, t) - top(x) - 20; return [[x, y - 120], [x, y]]; },
  grow: (t) => arrowsAmt(t),
})).concat(wpeak.map((p, i) => ({
  kind: "arrow", a: PEAKS + i * .05, b: 90.8, w: 7, color: "#ffb454",
  pts: (t) => [[p[0], p[1] - 90], [p[0], p[1] - 14]],
  grow: (t) => .35 + .65 * (.5 + .5 * Math.sin(t * 6 + i * 2.1)),
}))));
defineLabels([
  { k: "proc", t: "通道变窄 → 气流加速", a: 42.4, b: 47.0, at: () => [1100, G - 120], dy: -170 },
  { k: "proc", t: "低压", a: 43.6, b: 47.0, at: () => [1000, G - 10], dy: 60, c: "blue" },
  { k: "proc", t: "下压力", a: DOWNF + .4, b: 51.8, at: () => [1340, G - 300], dx: 220 },
  { k: "proc", t: "越贴地 → 吸得越牢", a: LOWER[0] + .2, b: h1 - .55, at: () => [1000, 280] },
  { k: "proc", t: "太近了 → 气流断了", a: h1 - .5, b: h1 + .2, at: () => [1000, 280] },
  { k: "proc", t: "↑ 车弹起", a: h1 + .2, b: h2 + .9, at: () => [1000, 280] },
  { k: "proc", t: "海豚跳（porpoising）", a: WAVE[0] + 1.2, b: 90.8, at: () => [960, 190] },
]);

export function sectionState(t) {
  const o = on(t) ? 1 : 0; show(layer, o); if (!o) return;
  const wv = t >= WAVE[0] ? 1 : 0, dim = wv ? mix(1, .45, ease((t - WAVE[0]) / .6)) : 1;
  // 车身与通道顶线
  let dB = "", dC = "", dL = "";
  for (let x = CAR[0]; x <= CAR[1]; x += 20) { const y = G - gap(x, t); dC += (dC ? " L" : "M") + `${x},${y.toFixed(1)}`; }
  dB = dC; for (let x = CAR[1]; x >= CAR[0]; x -= 20) dB += ` L${x},${(G - gap(x, t) - top(x)).toFixed(1)}`; dB += " Z";
  dL = `M720,${G}`; for (let x = 720; x <= 1380; x += 20) dL += ` L${x},${(G - gap(x, t) + 2).toFixed(1)}`;
  dL += ` L1380,${G} Z`;
  wheels.forEach((w, i) => w.setAttribute("cy", (G - [96, 92][i] - Math.max(0, ride(t)) * .3).toFixed(1)));
  body.setAttribute("d", dB); ceilLine.setAttribute("d", dC); lowP.setAttribute("d", dL);
  const st = stall(t);
  show(lowP, (t < 43.2 ? clamp((t - 43.2 + .5) / .5) : 1) * (1 - st) * dim);
  body.style.opacity = dim.toFixed(3); ceilLine.style.opacity = dim.toFixed(3);
  // 粒子
  for (const p of parts) {
    const tau = ((t * .55 + p.ph * TTOT) % TTOT + TTOT) % TTOT, x = xAt(tau), g = gap(x, t), y = G - g * p.L;
    const v = 110 / gap0(x), mid = x > 700 && x < 1400;
    const chaos = mid ? st : 0, j = Math.floor(t * 24);
    const jx = chaos * (hash(j + p.ph * 999) - .5) * 40, jy = chaos * (hash(j * 3 + p.ph * 777) - .5) * g * .9;
    const len = 6 + v * 9 * (1 - chaos * .7);
    const warm = clamp((v - 1.2) / 3) * (1 - chaos);
    const c = chaos > .3 ? "#8b939c" : `rgb(${Math.round(mix(150, 255, warm))},${Math.round(mix(205, 180, warm))},${Math.round(mix(255, 84, warm))})`;
    p.e.setAttribute("x1", (x + jx).toFixed(1)); p.e.setAttribute("x2", (x + jx + len).toFixed(1));
    p.e.setAttribute("y1", (y + jy).toFixed(1)); p.e.setAttribute("y2", (y + jy).toFixed(1)); p.e.setAttribute("stroke", c);
    p.e.style.opacity = ((x < CAR[0] - 60 || x > CAR[1] + 60 ? .45 : 1) * dim).toFixed(3);
  }
  // 波浪轨迹：按时间画出
  show(wave, wv); if (wv) { const n = Math.max(2, Math.round(clamp((t - WAVE[0]) / (WAVE[1] - WAVE[0])) * 240)); wave.setAttribute("points", wavePts.slice(0, n + 1).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")); }
}
