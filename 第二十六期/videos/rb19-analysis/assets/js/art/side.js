// 侧视技术线稿：RB19（样张 A2 的毫米坐标）、对比车（同轮廓、灰色、示意）。车头朝右，原点在车尾地面，y 向上。
// 外形参考公开照片，比例与形状为示意。一辆车一个对象，state() 每帧只改属性。
import { svg, show, drawable, draw, camAttr } from "./svg.js";
import { clamp } from "../lib.js";

// [路径, 中心 x（决定描线顺序：车头先画）, 样式]
const BODY = [
  ["M3060,958 C2760,935 2380,820 1980,660 C1600,520 1150,440 700,385", 1900, "ln"],          // 发动机盖
  ["M3060,958 C3110,930 3130,860 3120,760", 3090, "ln"],
  ["M3560,545 C3300,575 2780,560 2520,505 C2180,430 1760,250 1180,120", 2400, "ln"],          // 侧箱顶面
  ["M3560,545 C3600,520 3605,360 3560,335", 3580, "ln"],                                      // 进气口
  ["M3560,335 C3330,235 3000,190 2700,185 C2350,182 2050,120 1700,80", 2600, "pod"],          // 侧箱下切
  ["M3120,700 L3700,700", 3400, "ln"],
  ["M3200,700 C3190,800 3260,895 3345,895 C3440,895 3480,800 3470,700", 3340, "ln"],          // 头盔
  ["M3785,640 C3760,760 3700,830 3540,845 C3360,858 3200,840 3120,812 L3110,700", 3450, "halo"], // Halo
  ["M3660,700 L3610,800 M3520,795 L3740,795 L3740,850 L3520,850 Z", 3630, "thin"],             // 后视镜
  ["M3700,700 C3850,690 4100,650 4420,590 C4700,530 5050,420 5300,330 C5420,285 5500,255 5545,238", 4600, "ln"], // 单体壳
  ["M5545,238 C5530,215 5480,205 5420,212 C5150,245 4750,290 4420,310 C4200,320 4000,250 3920,120 L3920,70", 4700, "ln"],
  ["M3920,70 L1080,70 M3900,40 L1100,40", 2500, "ln"],                                       // 车底板
  ["M260,300 L640,300 L700,380 L1060,420 M260,300 L260,250 L620,250", 600, "thin"],           // 后防撞、变速箱
  ["M700,520 L1000,470 M700,520 L860,560 M700,200 L1000,250 M700,200 L880,170", 850, "thin"], // 后悬架
];
const FWING = [
  "M5120,95 C5300,90 5480,92 5610,108 L5605,128 C5470,118 5300,118 5125,122 Z",
  "M5040,158 C5200,160 5340,170 5450,190 L5440,208 C5330,192 5190,186 5045,182 Z",
  "M4985,222 C5110,228 5220,245 5310,268 L5298,285 C5210,265 5100,250 4988,246 Z",
  "M4955,288 C5040,296 5110,312 5170,334 L5158,350 C5100,330 5030,318 4958,312 Z",
];
const RWING = {
  plate: "M40,455 C30,700 50,880 150,962 L655,962 C620,900 600,700 610,455 Z",
  main: "M95,845 C250,858 450,850 610,815 L615,792 C450,825 250,830 98,820 Z",
  flap: "M110,930 C260,946 420,940 600,905 L605,880 C430,915 260,920 112,905 Z",
  beam: "M175,355 C300,372 430,370 560,350 L560,325 C430,343 300,346 178,330 Z",
  beam2: "M190,290 C310,305 430,303 545,286 L545,264 C430,280 310,282 192,268 Z",   // 第二片梁翼（对比用：做小之前）
};
const FILL = "M3060,958 C2760,935 2380,820 1980,660 C1600,520 1150,440 700,385 L700,300 L1080,70 L3920,70 L3920,120 C4000,250 4200,320 4420,310 C4750,290 5150,245 5420,212 C5480,205 5530,215 5545,238 C5500,255 5420,285 5300,330 C5050,420 4700,530 4420,590 C4100,650 3850,690 3700,700 L3470,700 C3480,800 3440,895 3345,895 C3260,895 3190,800 3200,700 L3120,700 C3130,860 3110,930 3060,958 Z";
export const TUNNEL = "M3880,260 C3500,200 3100,95 2500,80 C1900,80 1350,110 1050,200 C900,250 760,330 660,390";
const FSUS = ["M4300,560 L4520,655 M4300,560 L4080,500", "M4300,175 L4560,250 M4300,175 L4040,215", "M4310,520 L4120,230"];
export const AX = { rear: [700, 360], front: [4300, 360], r: 360 };

const COL = { ln: "#d8ecff", thin: "#d8ecff", pod: "#7fd0ff", halo: "#d8ecff" };
const W = { ln: 12.8, thin: 8, pod: 11.2, halo: 19.2 };

/** 一台侧视线稿车。opts.grey＝对比车 */
export function makeSide(parent, { grey = false } = {}) {
  const ink = grey ? "#8d96a3" : null;
  const root = svg("g", { fill: "none", "stroke-linejoin": "round", "stroke-linecap": "round" }, parent);
  const pitch = svg("g", {}, root);                          // 车身（随刹车点头），车轮不动
  const fill = svg("path", { d: FILL, fill: grey ? "rgba(150,160,175,.06)" : "rgba(120,170,230,.07)", stroke: "none" }, pitch);
  const tunnel = svg("path", { d: TUNNEL, stroke: "#ffb454", "stroke-width": 20, "stroke-dasharray": "40 26" }, pitch);
  const lines = [];
  for (const [d, cx, k] of BODY) lines.push({ e: drawable(svg("path", { d, stroke: ink || COL[k], "stroke-width": W[k] }, pitch)), cx });
  for (const d of FWING) lines.push({ e: drawable(svg("path", { d, stroke: ink || "#d8ecff", "stroke-width": 9.6 }, pitch)), cx: 5300 });
  const rw = {};
  for (const [k, d] of Object.entries(RWING)) { rw[k] = drawable(svg("path", { d, stroke: ink || "#d8ecff", "stroke-width": 11.2 }, pitch)); if (k !== "beam2") lines.push({ e: rw[k], cx: 330 }); }
  const wheels = svg("g", { stroke: ink || "#d8ecff", "stroke-width": 17.6, fill: "#0a1828" }, root);
  const wl = [];
  for (const [x, y] of [AX.front, AX.rear]) for (const r of [360, 232, 40]) wl.push({ e: drawable(svg("circle", { cx: x, cy: y, r }, wheels)), cx: x, wheel: true });
  lines.push(...wl);
  // 前悬架画在车轮上面（否则被填色的车轮盖住），和车身一起点头
  const pitch2 = svg("g", {}, root);
  const sus = FSUS.map((d) => drawable(svg("path", { d, stroke: grey ? "#8d96a3" : "#ffb454", "stroke-width": 11.2 }, pitch2)));
  sus.forEach((e) => lines.push({ e, cx: 4300 }));
  lines.sort((a, b) => b.cx - a.cx);
  const N = lines.length;
  return {
    root, rw, sus, tunnel, lines,
    /** s：{ cam, o 不透明, draw 描线 0..1, pitch 点头角（度，负＝车头向下）, fill, tunnel 0..1, sus 前悬架高亮 0..1, beam2 第二片梁翼 0..1, dim, wheels 车轮不透明 } */
    state(s) {
      show(root, s.o ?? 1); if ((s.o ?? 1) <= .002) return;
      root.setAttribute("transform", camAttr(s.cam));
      const rot = `rotate(${(s.pitch || 0).toFixed(3)} ${AX.rear[0]} ${AX.rear[1]})`; pitch.setAttribute("transform", rot); pitch2.setAttribute("transform", rot);
      wheels.style.opacity = (s.wheels ?? 1).toFixed(3);
      const p = s.draw ?? 1;
      lines.forEach((l, i) => { const a = i / N * .78, k = (p - a) / .22; draw(l.e, k); if (l.wheel) l.e.style.fillOpacity = clamp((k - .8) / .2).toFixed(3); });
      show(fill, (s.fill ?? clamp((p - .85) / .15)) * 1);
      show(tunnel, s.tunnel ?? 0); tunnel.style.strokeDashoffset = (-(s.flow || 0) * 66).toFixed(1);
      tunnel.style.filter = (s.tunnel ?? 0) > .5 ? "url(#glow)" : "";
      for (const e of sus) { e.style.strokeWidth = (11.2 * (1 + 1.2 * (s.sus || 0))).toFixed(1); }
      draw(rw.beam2, s.beam2 ?? 0); show(rw.beam2, (s.beam2 ?? 0) > .01 ? 1 : 0);
      root.style.opacity = ((s.o ?? 1) * (s.dim ?? 1)).toFixed(3);
    },
  };
}
