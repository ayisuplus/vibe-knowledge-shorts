import { BEAT, ERA } from "./beats.js";
import { clamp, ease, mix, ramp, windowed, hash } from "./lib.js";
import { C, rr, glow } from "./rig.js";

// 全片都在同一间深夜的房间里。房间的灯光、墙变黑板、整体变亮都由拍数 n 算出；
// 镜头是一张关键帧表（拍, 中心 x, 中心 y, 缩放），帧间平滑插值，缩放烘进画布 transform。
// S5 的荒野长路与 S6 的光路是盖在房间上面的两层「屏幕空间」场景，不跟房间镜头走。
const CAM = [
  [0, 960, 540, 1.0], [2, 960, 540, 1.0], [10, 800, 500, 1.08], [16, 960, 520, 1.04],
  [22, 1080, 520, 1.05], [29, 1240, 430, 1.08], [33, 960, 440, 1.0], [93, 960, 440, 1.03],
  [98, 960, 540, 1.0], [106, 960, 540, 1.0], [121, 980, 530, 1.03], [129, 960, 520, .96],
  [137, 960, 500, 1.0], [146, 1180, 470, 1.05], [151, 980, 520, 1.0], [159, 960, 500, 1.0],
  [212, 960, 500, 1.0], [216, 980, 520, 1.03], [228, 960, 480, 1.0], [242, 960, 500, 1.03],
  [251, 960, 560, 1.12], [276, 960, 540, 1.0], [286, 1040, 500, 1.04], [295, 1520, 330, 1.45],
];
function cam(n, t) {
  let k = CAM.length - 1;
  for (let i = 0; i < CAM.length - 1; i++) if (n < CAM[i + 1][0]) { k = i; break; }
  const a = CAM[k], b = CAM[Math.min(k + 1, CAM.length - 1)], p = b[0] > a[0] ? ease((n - a[0]) / (b[0] - a[0])) : 0;
  // 呼吸：极小幅度的漂移，保证没有整秒静止
  return [mix(a[1], b[1], p) + 5 * Math.sin(t * .31), mix(a[2], b[2], p) + 3 * Math.sin(t * .23 + 1), mix(a[3], b[3], p) * (1 + .006 * Math.sin(t * .5))];
}
/** 房间状态：台灯、黑板、整体底色（S3 享乐适应一档档调亮）、荒野长路（S5）、光路（S6） */
export function env(n) {
  const board = windowed(n, 30, 97, 1.6);
  const steps = .22 * ramp(n, 122, .9) + .22 * ramp(n, 124.5, .9) + .2 * ramp(n, 127, .9);
  const ambient = steps * (1 - .55 * ramp(n, 147, 4)) * (1 - ramp(n, 152, 6));
  const off = ramp(n, 242.5, 1.6) * (1 - ramp(n, 276, 2));
  const road = windowed(n, 251.5, 276.5, 1.6);
  const lr = ramp(n, 294.2, 1.3);
  const survey = windowed(n, 159.5, 213.5, 1.2);   // S4 调查段：窗让开，免得和色块打架
  return { lamp: (1 - .5 * board) * (1 - .78 * off), board, ambient, road, lr, survey };
}
/** S6 光路走了多远：匀加速，直接由拍数算出（不累加） */
export const roadZ = (n) => { const m = Math.max(0, n - 294.5); return .07 * m + .0055 * m * m; };
export const VP = [960, 452];

export function build() {
  const canvas = document.getElementById("cv"), ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="mark"></div><div class="era"></div><div class="note"></div>';
  const era = hud.querySelector(".era"), mark = hud.querySelector(".mark"), note = hud.querySelector(".note");
  const w = { canvas, ctx, n: 0, t: 0, E: null, camT: [1, 0, 0, 1, 0, 0], dpr: 1 };

  function room(t, E) {
    // 墙：深蓝黑，ambient 越高越接近暖灰（S3 用）
    const wall = ctx.createLinearGradient(0, 0, 0, 700);
    wall.addColorStop(0, `rgb(${mix(29, 96, E.ambient)},${mix(34, 90, E.ambient)},${mix(54, 88, E.ambient)})`);
    wall.addColorStop(1, `rgb(${mix(16, 74, E.ambient)},${mix(20, 68, E.ambient)},${mix(31, 66, E.ambient)})`);
    ctx.fillStyle = wall; ctx.fillRect(-400, -300, 2720, 1100);
    // 台灯在画外右上，暖光铺在墙上
    glow(ctx, 1520, 90, 900, 600, "rgba(255,179,71,A)", .13 * E.lamp);
    glow(ctx, 760, 260, 900, 500, "rgba(255,214,160,A)", .04 * E.lamp + .08 * E.ambient);
    // 窗：冷色夜景，几点远处的灯
    ctx.save(); ctx.globalAlpha = (1 - E.board) * (1 - .85 * E.survey);
    rr(ctx, 1460, 120, 300, 380, 4, "rgba(40,62,102,.16)", "rgba(52,66,96,.9)", 4);
    ctx.strokeStyle = "rgba(52,66,96,.9)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(1610, 120); ctx.lineTo(1610, 500); ctx.moveTo(1460, 310); ctx.lineTo(1760, 310); ctx.stroke();
    for (let i = 0; i < 7; i++) { const x = 1475 + hash(i) * 270, y = 360 + hash(i + 9) * 120, a = .25 + .2 * Math.sin(t * .7 + i * 2); ctx.fillStyle = `rgba(255,214,150,${a})`; ctx.fillRect(x, y, 4, 4); }
    ctx.restore();
    // 黑板（S2）：盖在墙上，带方格细线（来自 C 样张）
    if (E.board > .002) {
      ctx.save(); ctx.globalAlpha = E.board;
      rr(ctx, 140, 96, 1640, 524, 6, "#1b1f1d", "#4a3c2e", 10);
      ctx.beginPath(); ctx.rect(146, 102, 1628, 512); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,.04)"; ctx.lineWidth = 1;
      for (let x = 160; x < 1780; x += 40) { ctx.beginPath(); ctx.moveTo(x, 96); ctx.lineTo(x, 620); ctx.stroke(); }
      for (let y = 116; y < 620; y += 40) { ctx.beginPath(); ctx.moveTo(140, y); ctx.lineTo(1780, y); ctx.stroke(); }
      for (let i = 0; i < 6; i++) glow(ctx, 300 + hash(i + 3) * 1300, 200 + hash(i + 5) * 380, 260, 90, "rgba(255,255,255,A)", .035);
      ctx.restore();
      rr(ctx, 140, 614, 1640, 16, 3, `rgba(74,60,46,${E.board})`);
    }
    // 桌面
    const desk = ctx.createLinearGradient(0, 680, 0, 1080);
    desk.addColorStop(0, `rgb(${mix(30, 100, E.ambient)},${mix(32, 92, E.ambient)},${mix(42, 88, E.ambient)})`); desk.addColorStop(1, `rgb(${mix(11, 40, E.ambient)},${mix(12, 38, E.ambient)},${mix(17, 40, E.ambient)})`);
    ctx.fillStyle = desk; ctx.beginPath(); ctx.moveTo(-400, 692); ctx.lineTo(2320, 656); ctx.lineTo(2320, 1400); ctx.lineTo(-400, 1400); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(90,86,84,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-400, 692); ctx.lineTo(2320, 656); ctx.stroke();
    glow(ctx, 1060, 730, 820, 190, "rgba(255,207,138,A)", .26 * E.lamp * (1 - .6 * E.ambient));
    // 灯光里浮着的细尘
    for (let i = 0; i < 26; i++) {
      const x = 700 + hash(i) * 1100 + 30 * Math.sin(t * .17 + i), y = 120 + ((hash(i + 40) * 560 + t * (6 + 6 * hash(i + 2))) % 560);
      ctx.fillStyle = `rgba(255,226,180,${(.10 + .12 * hash(i + 7)) * E.lamp * (1 - E.board)})`; ctx.beginPath(); ctx.arc(x, y, 1.3 + 1.6 * hash(i + 11), 0, Math.PI * 2); ctx.fill();
    }
  }

  // S5：荒野长路（屏幕空间）。天、地平线、一条通向远处的路
  function wild(t, a) {
    ctx.save(); ctx.globalAlpha = a;
    const sky = ctx.createLinearGradient(0, 0, 0, 470); sky.addColorStop(0, "#0b1222"); sky.addColorStop(1, "#2a2433");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 1920, 470);
    for (let i = 0; i < 60; i++) { const x = hash(i + 100) * 1920, y = hash(i + 200) * 380; ctx.fillStyle = `rgba(230,236,255,${.15 + .35 * hash(i + 300) * (.7 + .3 * Math.sin(t * .9 + i))})`; ctx.fillRect(x, y, 2, 2); }
    glow(ctx, 960, 470, 900, 120, "rgba(255,170,110,A)", .18);
    const gr = ctx.createLinearGradient(0, 470, 0, 1080); gr.addColorStop(0, "#15131a"); gr.addColorStop(1, "#08080b");
    ctx.fillStyle = gr; ctx.fillRect(0, 470, 1920, 610);
    ctx.fillStyle = "#1f1d22"; ctx.beginPath(); ctx.moveTo(950, 470); ctx.lineTo(970, 470); ctx.lineTo(1420, 1080); ctx.lineTo(500, 1080); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(220,200,170,.35)"; ctx.lineWidth = 3; ctx.setLineDash([26, 30]);
    ctx.beginPath(); ctx.moveTo(960, 474); ctx.lineTo(960, 1080); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  // S6：光路（屏幕空间）。深色天幕 + 从消失点涌出的光段，速度由 roadZ(n) 决定
  function lightRoad(t, n, a) {
    ctx.save(); ctx.globalAlpha = a;
    const bg = ctx.createRadialGradient(VP[0], VP[1], 0, VP[0], VP[1], 1300); bg.addColorStop(0, "#2a1d12"); bg.addColorStop(.35, "#0e1018"); bg.addColorStop(1, "#05060a");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1920, 1080);
    const heat = clamp((n - 295) / 24);
    glow(ctx, VP[0], VP[1], 520 + 500 * heat, 260 + 200 * heat, "rgba(255,179,71,A)", .3 + .4 * heat);
    const z = roadZ(n), N = 26;
    for (const side of [-1, 1]) for (let i = 0; i < N; i++) {
      const d = ((i / N + z) % 1), p = d * d * d, pn = Math.min(1, (d + .03) ** 3);
      const x0 = VP[0] + side * (14 + 1100 * p), y0 = VP[1] + 640 * p, x1 = VP[0] + side * (14 + 1100 * pn), y1 = VP[1] + 640 * pn;
      ctx.strokeStyle = `rgba(255,${mix(200, 230, d)},${mix(120, 190, d)},${.15 + .85 * d})`; ctx.lineWidth = 2 + 10 * p;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    for (let i = 0; i < N; i++) {
      const d = ((i / N + z * 1.0 + .5 / N) % 1), p = d * d * d, pn = Math.min(1, (d + .025) ** 3);
      ctx.strokeStyle = `rgba(255,236,200,${.2 + .8 * d})`; ctx.lineWidth = 2 + 14 * p;
      ctx.beginPath(); ctx.moveTo(VP[0], VP[1] + 640 * p); ctx.lineTo(VP[0], VP[1] + 640 * pn); ctx.stroke();
    }
    ctx.restore();
  }

  function begin(t) {
    const dpr = window.devicePixelRatio || 1, W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    const n = t / BEAT, [cx, cy, s] = cam(n, t);
    w.dpr = dpr; w.camT = [dpr * s, 0, 0, dpr * s, dpr * (960 - s * cx), dpr * (540 - s * cy)];
    w.n = n; w.t = t; w.E = env(n);
    w.useCam();
    if (w.E.road < .999 && w.E.lr < .999) room(t, w.E);
    if (w.E.road > .002) { w.screen(); wild(t, w.E.road); w.useCam(); }
    if (w.E.lr > .002) { w.screen(); lightRoad(t, n, w.E.lr); w.useCam(); }
    let label = ERA[0][1]; for (const [start, txt] of ERA) if (t >= start) label = txt; era.textContent = label;
    note.textContent = ""; mark.textContent = "";
  }
  w.begin = begin;
  w.useCam = () => ctx.setTransform(...w.camT);
  w.screen = () => ctx.setTransform(w.dpr, 0, 0, w.dpr, 0, 0);
  w.setNote = (s) => { note.textContent = s || ""; };
  w.setMark = (s) => { mark.textContent = s || ""; };
  return w;
}
