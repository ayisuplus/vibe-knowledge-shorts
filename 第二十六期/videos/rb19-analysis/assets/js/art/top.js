// S3 后半（P 房）：RB19 俯视线稿（示意）——侧箱下切用斜线填充，气流绕过缺口钻进车底、流向车尾；
// 进气口截面（旧：高窄 → 新：矮宽，缺口变大，示意）；整块车底亮起 → 开始轻微闪烁（预告海豚跳）。
import { svg, show, drawable, draw } from "./svg.js";
import { defineLabels } from "../hud.js";
import { clamp, mix, ease, hash } from "../lib.js";
import { CUTS, HATCH, INLET, BIG, FLOOR_GLOW, FLICKER } from "../timeline.js";

// 俯视：x 沿车身（车尾 0 → 车头 5625 mm），z 横向；半边轮廓，另一半镜像
const S = .27, CX = 960 - 2800 * S, CY = 470;
const side = (pts) => pts.map(([x, z]) => [x, z]);
const both = (pts) => { const a = side(pts), b = [...a].reverse().map(([x, z]) => [x, -z]); return "M" + [...a, ...b].map(([x, z]) => `${x},${z}`).join(" L") + " Z"; };
const half = (pts, sgn = 1) => "M" + pts.map(([x, z]) => `${x},${z * sgn}`).join(" L");
const POD = [[1700, 300], [2300, 560], [3000, 760], [3450, 800], [3600, 760]];
const FLOOR = [[1100, 640], [1700, 900], [3200, 1000], [3900, 980], [3950, 600]];
const OUTLINE = [[0, 500], [650, 500], [650, 160], [1100, 240], [1700, 300], [2300, 560], [3000, 760], [3450, 800], [3600, 760], [3650, 420], [4400, 300], [5000, 160], [5550, 90]];
const g = svg("g", { fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round", transform: `translate(${CX} ${CY}) scale(${S})` });
const floorFill = svg("path", { d: both(FLOOR), fill: "rgba(255,180,84,.0)", stroke: "none" }, g);
const hatch = [1, -1].map((s) => svg("path", { d: half([...POD, ...[...FLOOR].reverse().filter(([x]) => x >= 1700 && x <= 3900)], s) + " Z", fill: "url(#hatch)", stroke: "none" }, g));
const floorEdge = [1, -1].map((s) => svg("path", { d: half(FLOOR, s), stroke: "#ffb454", "stroke-width": 12, "stroke-dasharray": "50 30" }, g));
const outline = drawable(svg("path", { d: both(OUTLINE), stroke: "#d8ecff", "stroke-width": 14, fill: "rgba(120,170,230,.06)" }, g));
const fw = drawable(svg("path", { d: "M5150,900 L5625,860 L5625,-860 L5150,-900 Z M5150,600 L5560,580 M5150,-600 L5560,-580", stroke: "#d8ecff", "stroke-width": 12 }, g));
const cockpit = drawable(svg("ellipse", { cx: 3500, cy: 0, rx: 330, ry: 190, stroke: "#d8ecff", "stroke-width": 10 }, g));
const wheels = [[4300, 800], [4300, -800], [700, 800], [700, -800]].map(([x, z]) => drawable(svg("rect", { x: x - 360, y: z - 200, width: 720, height: 400, rx: 60, stroke: "#d8ecff", "stroke-width": 14, fill: "#0a1828" }, g)));
const rwing = drawable(svg("path", { d: "M0,-600 L620,-600 L620,600 L0,600 Z", stroke: "#d8ecff", "stroke-width": 12 }, g));
const arms = drawable(svg("path", { d: "M4300,620 L4500,250 M4300,620 L4000,320 M4300,-620 L4500,-250 M4300,-620 L4000,-320 M700,620 L900,380 M700,-620 L900,-380", stroke: "#d8ecff", "stroke-width": 8 }, g));
const ALL = [outline, fw, cockpit, rwing, arms, ...wheels];
// 气流：从前轮后方绕进侧箱下切、沿车底边流向车尾
const FLOWS = [[[4150, 1150], [3800, 1000], [3300, 900], [2600, 760], [1800, 560], [1000, 420], [300, 380]], [[4150, 1250], [3700, 1150], [3100, 1040], [2400, 900], [1700, 700], [900, 560], [200, 520]]];
const fl = [];
for (const s of [1, -1]) for (const f of FLOWS) {
  const d = "M" + f.map(([x, z]) => `${x},${z * s}`).join(" L");
  fl.push({ e: svg("path", { d, stroke: "#58c4ff", "stroke-width": 14, "stroke-dasharray": "110 70" }, g), a: drawable(svg("path", { d, stroke: "#58c4ff", "stroke-width": 14, "marker-end": "url(#art-arr)" }, g)) });
}

// 进气口截面（前视，右侧侧箱；示意，不标尺寸）：车身侧壁在左，地面在下
const cs = svg("g", { fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" });
const csK = (t) => 1.3 * (1 + Math.max(0, t - INLET) * .012);
const floorY = 700;
svg("path", { d: `M640,${floorY} L1400,${floorY}`, stroke: "#8fb6e6", "stroke-width": 5 }, cs);
svg("path", { d: "M700,260 L700,700", stroke: "#d8ecff", "stroke-width": 8 }, cs);
const capA = svg("path", { fill: "url(#hatch)", stroke: "none" }, cs);
const podP = svg("path", { stroke: "#d8ecff", "stroke-width": 8, fill: "rgba(120,170,230,.08)" }, cs);
const oldIn = svg("rect", { x: 1060, y: 320, width: 90, height: 240, rx: 18, stroke: "#9aa3ad", "stroke-width": 6, "stroke-dasharray": "14 10" }, cs);
const newIn = svg("rect", { x: 930, y: 330, width: 270, height: 96, rx: 18, stroke: "#ffb454", "stroke-width": 7 }, cs);
const tOld = svg("text", { x: 1160, y: 300, fill: "#aab3bd", "font-size": 30, "font-family": "NotoSC", "font-weight": 700 }, cs); tOld.textContent = "旧进气口";
const tNew = svg("text", { x: 1215, y: 395, fill: "#ffb454", "font-size": 30, "font-family": "NotoSC", "font-weight": 700 }, cs); tNew.textContent = "新进气口";
/** 侧箱外轮廓：k=0 旧（下部鼓到地面附近）→ 1 新（下部收进去，缺口变大） */
const podPts = (k) => [[700, 300], [1240, 300], [1270, 330], [1270, mix(560, 470, k)], [mix(1180, 1120, k), mix(640, 560, k)], [mix(900, 860, k), mix(668, 600, k)], [700, mix(672, 610, k)]];
const pd = (P) => "M" + P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") + " Z";
const capPts = (k) => { const P = podPts(k); return [P[6], P[5], P[4], P[3], [1270, floorY], [700, floorY]]; };

defineLabels([
  { k: "full", t: "侧箱下切", f: "把气流送进车底", a: HATCH + .2, b: 57.7, at: () => [CX + 2600 * S, CY + 780 * S], dx: 200, dy: 150 },
  { k: "tag", t: "阿塞拜疆站升级", a: BIG + .2, b: 63.4, at: (t) => [960 + (1065 - 970) * csK(t), 520 + (378 - 480) * csK(t)], dx: 260, dy: -120 },
  { k: "proc", t: "缺口更大", a: BIG + .5, b: 63.4, at: (t) => [960 + (960 - 970) * csK(t), 520 + (660 - 480) * csK(t)], dy: 70 },
]);

export function topState(t) {
  const on = t >= CUTS.s3b && t < CUTS.s4a, inl = t >= INLET && t < 63.6;
  show(g, on && !inl ? 1 : 0); show(cs, inl ? clamp((t - INLET) / .3) : 0);
  if (on && !inl) {
    const back = t >= 63.6, z = back ? mix(1.12, .96, ease((t - 63.6) / 1.4)) + (t - 63.6) * .006 : mix(1.06, 1.12, ease((t - CUTS.s3b) / 5.4));
    g.setAttribute("transform", `translate(${960 - 2800 * S * z} ${CY}) scale(${S * z})`);
    ALL.forEach((e, i) => draw(e, back ? 1 : (t - CUTS.s3b - i * .06) / .7));
    const hk = back ? .35 : clamp((t - HATCH) / .4);
    hatch.forEach((h) => show(h, hk)); floorEdge.forEach((e) => show(e, back ? .5 : clamp((t - CUTS.s3b - .6) / .4)));
    fl.forEach((f, i) => { const p = (t - HATCH - .4 - (i % 2) * .25) / 1.0; draw(f.a, p); show(f.a, p < 1.05 && !back ? 1 : 0); show(f.e, p >= 1 && !back ? 1 : 0); f.e.style.strokeDashoffset = (-t * 600).toFixed(0); });
    // 整块车底亮起；之后闪烁
    let gl = back ? clamp((t - FLOOR_GLOW) / .5) : 0;
    if (t >= FLICKER) gl *= .55 + .45 * hash(Math.floor(t * 9)) * (.6 + .4 * Math.sin(t * 13));
    floorFill.setAttribute("fill", `rgba(255,180,84,${(.38 * gl).toFixed(3)})`);
  }
  if (inl) {
    cs.setAttribute("transform", `translate(960 520) scale(${csK(t).toFixed(4)}) translate(-970 -480)`);
    const k = ease((t - BIG) / .8);
    podP.setAttribute("d", pd(podPts(k))); capA.setAttribute("d", pd(capPts(k)));
    show(oldIn, 1 - .5 * k); show(newIn, clamp((t - BIG + .2) / .4)); show(tOld, 1 - .5 * k); show(tNew, clamp((t - BIG) / .4));
  }
}
