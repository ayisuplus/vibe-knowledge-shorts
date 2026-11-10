import { BEAT, CUE, ERA, CARD_N, Q_N, END_N } from "./beats.js";
import { clamp, ease, mix, hash, ramp } from "./lib.js";
import { glow } from "./rig.js";

// 全片是摊在深色桌面上的一叠旧报纸：翻页、盖章、铅字落下都由拍数 n 算出。
// 镜头是一张关键帧表（拍, 中心 x, 中心 y, 缩放），帧间平滑插值，缩放烘进画布 transform。
const a = (i) => CUE[i][0];
const CAM = [
  [0, 960, 540, 1.0], [a(2), 960, 540, 1.0], [a(2) + 5, 1040, 520, 1.05], [a(4) - 1, 1040, 520, 1.05], [a(4) + 1, 960, 540, 1.0],
  [a(6), 960, 540, 1.0], [a(7), 960, 530, 1.03], [a(9), 960, 540, 1.0], [a(13), 960, 540, 1.02], [a(15), 960, 540, 1.0],
  [a(16), 960, 540, 1.0], [a(19), 960, 530, 1.03], [a(20), 960, 540, 1.0], [a(23), 960, 540, 1.0], [a(25), 960, 530, 1.04],
  [a(26), 960, 540, 1.0], [a(34), 960, 540, 1.0], [CARD_N[0], 960, 540, 1.04], [END_N, 960, 540, 1.1],
];
function cam(n, t) {
  let k = CAM.length - 1;
  for (let i = 0; i < CAM.length - 1; i++) if (n < CAM[i + 1][0]) { k = i; break; }
  const p = CAM[k], q = CAM[Math.min(k + 1, CAM.length - 1)], u = q[0] > p[0] ? ease((n - p[0]) / (q[0] - p[0])) : 0;
  // 呼吸：极小幅度的漂移，保证没有整秒静止
  return [mix(p[1], q[1], u) + 5 * Math.sin(t * .31), mix(p[2], q[2], u) + 3 * Math.sin(t * .23 + 1), mix(p[3], q[3], u) * (1 + .006 * Math.sin(t * .5))];
}

export function build() {
  const canvas = document.getElementById("cv"), ctx = canvas.getContext("2d");
  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="mark"></div><div class="era"></div><div class="note"></div>';
  const era = hud.querySelector(".era"), mark = hud.querySelector(".mark"), note = hud.querySelector(".note");
  const w = { canvas, ctx, n: 0, t: 0, camT: [1, 0, 0, 1, 0, 0], dpr: 1 };

  function desk(t) {
    const g = ctx.createRadialGradient(960, 420, 60, 960, 420, 1250);
    g.addColorStop(0, "#2d2519"); g.addColorStop(.55, "#191510"); g.addColorStop(1, "#0b0906");
    ctx.fillStyle = g; ctx.fillRect(-300, -200, 2520, 1480);
    // 慢慢飘的浮尘：很少、很大，不做密集小点
    for (let i = 0; i < 14; i++) {
      const x = hash(i) * 1920 + 40 * Math.sin(t * .17 + i), y = 90 + ((hash(i + 40) * 700 + t * (5 + 5 * hash(i + 2))) % 700);
      ctx.fillStyle = `rgba(240,222,180,${.05 + .09 * hash(i + 7)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 + 2.2 * hash(i + 11), 0, Math.PI * 2); ctx.fill();
    }
    glow(ctx, 960, 400, 900, 460, "rgba(255,226,170,A)", .05);
  }

  function begin(t) {
    const dpr = window.devicePixelRatio || 1, W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    const n = t / BEAT, [cx, cy, s] = cam(n, t);
    w.dpr = dpr; w.camT = [dpr * s, 0, 0, dpr * s, dpr * (960 - s * cx), dpr * (540 - s * cy)];
    w.n = n; w.t = t;
    w.useCam(); desk(t);
    let label = ERA[0][1]; for (const [start, txt] of ERA) if (t >= start) label = txt; era.textContent = label;
    era.style.opacity = (1 - ramp(n, Q_N[0] - 1, 1)).toFixed(3);
    note.textContent = ""; mark.textContent = "";
  }
  w.begin = begin;
  w.useCam = () => ctx.setTransform(...w.camT);
  w.screen = () => ctx.setTransform(w.dpr, 0, 0, w.dpr, 0, 0);
  w.setNote = (s) => { note.textContent = s || ""; };
  w.setMark = (s) => { mark.textContent = s || ""; };
  return w;
}
