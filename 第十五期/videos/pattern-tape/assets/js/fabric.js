// 画布上的织物库：布面、花本、梭、线稿折线、齿轮、金尘、色带。
// 全部是纯函数：给 ctx 与参数，画一帧；不存状态、不读时钟。相机由调用方在 ctx 上设好变换。
import { clamp, lerp, mod, rng } from "./lib.js";

/* ---------------- 色板（样张 D：B 的暗靛金丝） ---------------- */
export const PAL = {
  warp: ["#a9791d", "#e0b043", "#f8dc8a"], gapWarp: "#5e410c",   // 经线浮线（竖纹，金）
  weft: ["#1d2b66", "#2f4491", "#4a62b8"], gapWeft: "#0d1538",   // 纬线浮线（横纹，靛）
  bare: "#6b78a8", cord: "#8791c0", knot: "#f0c15a", glow: "rgba(240,193,90,0.20)",
  beam: "#c79a3b", gold: "#f0c15a", goldLight: "#f8dc8a", ivory: "#f6efdc", muted: "#aab3d6",
  shuttle: ["#e2bb5d", "#8a6420"], shuttleEdge: "#3b2a0a", shuttleSlot: "#2a1d08",
  ink: "#05081a",
};

/* ---------------- 花样（16×16，1 = 提经 = 竖纹） ---------------- */
/** 菱纹涟漪：到中心的曼哈顿距离 m，每 4 一轮，前 2 格为金 */
export const bitD = (r, c) => { const x = c - 7.5, y = r - 7.5; return (Math.abs(x) + Math.abs(y)) % 4 < 2 ? 1 : 0; };
const Q = ["11111111", "10000000", "10111111", "10100000", "10101111", "10101000", "10101011", "10101010"];
/** 回纹：四象限镜像的方螺旋 */
export const bitM = (r, c) => { const rr = r < 8 ? r : 15 - r, cc = c < 8 ? c : 15 - c; return Q[rr][cc] === "1" ? 1 : 0; };
/** 任意整数行列都能取（花本首尾相接成环，布面向两侧重复） */
export const D16 = (r, c) => bitD(mod(r, 16), mod(c, 16));
export const M16 = (r, c) => bitM(mod(r, 16), mod(c, 16));
export const rowCount = (bit, r, cols = 16) => { let n = 0; for (let c = 0; c < cols; c++) n += bit(r, c); return n; };

/* ---------------- 画布 ---------------- */
/** 按 devicePixelRatio 同步画布像素（4K 渲染时 dpr=2，保证不糊），并清屏。返回 dpr。 */
export function beginCanvas(cv, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  return dpr;
}
/** 相机：世界点 (cx,cy) 落在屏幕点 (sx,sy)，缩放 s。ox/oy 是全片极轻的浮动。 */
export function setCam(ctx, dpr, { s = 1, cx = 960, cy = 540, sx = 960, sy = 540, ox = 0, oy = 0 } = {}) {
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (sx - s * cx + ox), dpr * (sy - s * cy + oy));
}

/* ---------------- 线稿折线 ---------------- */
const lenCache = new WeakMap();
export function pathLen(pts) {
  let L = lenCache.get(pts);
  if (L === undefined) {
    L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lenCache.set(pts, L);
  }
  return L;
}
/** 沿折线描出前 k（0..1）。调用前自行设 strokeStyle / lineWidth。 */
export function strokePartial(ctx, pts, k) {
  k = clamp(k);
  if (k <= 0.0005) return;
  const goal = pathLen(pts) * k;
  let d = 0;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (d + seg >= goal) {
      const u = seg > 0 ? (goal - d) / seg : 0;
      ctx.lineTo(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u);
      break;
    }
    ctx.lineTo(x1, y1);
    d += seg;
  }
  ctx.stroke();
}
export const ellipsePts = (cx, cy, rx, ry, n = 56, a0 = 0, a1 = Math.PI * 2) =>
  Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
export const diamondPts = (cx, cy, rho) => [[cx + rho, cy], [cx, cy + rho], [cx - rho, cy], [cx, cy - rho], [cx + rho, cy]];

/* ---------------- 布面 ---------------- */
const OFF = [2, 13, 24]; // 一格 36px 里三根线的起点
/** 把一批格子（[x, y, bit]）画成经纬浮线。同色合并成一条 Path2D，一批只 fill 十次左右。 */
export function paintCells(ctx, cells, S, pal = PAL, alpha = 1) {
  if (!cells.length) return;
  const k = S / 36;
  const gW = new Path2D(), gF = new Path2D();
  const wD = new Path2D(), wM = new Path2D(), wL = new Path2D();
  const fD = new Path2D(), fM = new Path2D(), fL = new Path2D();
  for (const [x, y, b] of cells) {
    if (b) {
      gW.rect(x, y, S, S);
      for (const o of OFF) { const tx = x + o * k; wD.rect(tx, y, 10 * k, S); wM.rect(tx + 1.6 * k, y, 6.8 * k, S); wL.rect(tx + 3.5 * k, y, 3 * k, S); }
    } else {
      gF.rect(x, y, S, S);
      for (const o of OFF) { const ty = y + o * k; fD.rect(x, ty, S, 10 * k); fM.rect(x, ty + 1.6 * k, S, 6.8 * k); fL.rect(x, ty + 3.5 * k, S, 3 * k); }
    }
  }
  const a0 = ctx.globalAlpha;
  ctx.globalAlpha = a0 * alpha;
  ctx.fillStyle = pal.gapWarp; ctx.fill(gW);
  ctx.fillStyle = pal.gapWeft; ctx.fill(gF);
  ctx.fillStyle = pal.warp[0]; ctx.fill(wD); ctx.fillStyle = pal.warp[1]; ctx.fill(wM); ctx.fillStyle = pal.warp[2]; ctx.fill(wL);
  ctx.fillStyle = pal.weft[0]; ctx.fill(fD); ctx.fillStyle = pal.weft[1]; ctx.fill(fM); ctx.fillStyle = pal.weft[2]; ctx.fill(fL);
  ctx.globalAlpha = a0;
}

/** 满屏织锦（S1）：行从 Y0 起向上下无限延伸，没有织口、没有裸经线。 */
export function drawClothFull(ctx, { x0, S, cols, Y0, bit, top = 0, bottom = 1080, alpha = 1, pal = PAL }) {
  const rLo = Math.floor((top - Y0) / S) - 1, rHi = Math.ceil((bottom - Y0) / S) + 1;
  const cells = [];
  for (let r = rLo; r <= rHi; r++) { const y = Y0 + r * S; for (let c = 0; c < cols; c++) cells.push([x0 + c * S, y, bit(r, c)]); }
  paintCells(ctx, cells, S, pal, alpha);
}

/**
 * 织造中的布面。R = 已织行数（实数）：第 r 行的上沿在 FY + (r − R)·S；织口 FY 固定。
 * 织口之上是织好的布（最新一行只织出横向的 g），之下是裸经线。
 */
export function drawCloth(ctx, o) {
  const {
    x0, S, cols, FY, R, bit, top = -1e5, bottom = 1e5, g = 1, rMin = 0,
    bare = 1, bareFrom = null, bareTo = bottom, alpha = 1, xClip = null, pal = PAL,
    lift = 0, liftRow = 0,
  } = o;
  const W = cols * S, k = S / 36;
  const k0 = Math.floor(R), f = R - k0;
  const cl = xClip ? xClip[0] : x0 - 2, cr = xClip ? xClip[1] : x0 + W + 2;
  const yTop = Math.max(top, -1e5);

  ctx.save();
  ctx.beginPath(); ctx.rect(cl, yTop, cr - cl, FY - yTop); ctx.clip();
  const rLo = Math.max(rMin, Math.floor(R + (yTop - FY) / S) - 1);
  const cells = [];
  for (let r = rLo; r < k0; r++) {
    const y = FY + (r - R) * S;
    if (y + S < yTop) continue;
    for (let c = 0; c < cols; c++) cells.push([x0 + c * S, y, bit(r, c)]);
  }
  paintCells(ctx, cells, S, pal, alpha);
  if (k0 >= rMin && (f > 0.002 && g > 0.002)) {
    const y = FY + (k0 - R) * S, n = Math.ceil(cols * Math.min(1, g));
    const row = [];
    for (let c = 0; c < n; c++) row.push([x0 + c * S, y, bit(k0, c)]);
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, yTop, Math.min(1, g) * W, FY - yTop); ctx.clip();
    paintCells(ctx, row, S, pal, alpha);
    ctx.restore();
  }
  ctx.restore();

  if (bare > 0.002) {
    const yB = bareFrom == null ? FY : bareFrom;
    const lines = new Path2D(), liftLines = new Path2D(), chev = new Path2D();
    const wovenTo = k0 >= rMin && f > 0.002 ? Math.min(1, g) * cols : cols;
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * S;
      const isLift = lift > 0.01 && bit(liftRow, c);
      // 当前行还没织到的列，裸经线向上延伸到新行上沿
      const y0 = c >= wovenTo && f > 0.002 ? FY - f * S : yB;
      for (const o2 of [6, 18, 30]) {
        const w = 3 * k, len = Math.max(0, bareTo - y0);
        if (isLift) {           // 提起的经线：织口下一小段亮起，再往下回到暗线
          const up = Math.min(len, 1.7 * S);
          liftLines.rect(x + o2 * k - w / 2, y0, w, up);
          lines.rect(x + o2 * k - w / 2, y0 + up, w, len - up);
        } else lines.rect(x + o2 * k - w / 2, y0, w, len);
      }
      if (isLift) {
        const cx = x + S / 2, cy = FY + 0.7 * S - lift * 0.35 * S;
        chev.moveTo(cx - 7 * k, cy + 7 * k); chev.lineTo(cx, cy); chev.lineTo(cx + 7 * k, cy + 7 * k);
      }
    }
    const a0 = ctx.globalAlpha;
    ctx.globalAlpha = a0 * alpha * bare * 0.85;
    ctx.fillStyle = pal.bare; ctx.fill(lines);
    ctx.globalAlpha = a0 * alpha * bare * (0.55 + 0.45 * lift);
    ctx.fillStyle = pal.warp[2]; ctx.fill(liftLines);
    if (lift > 0.01) { ctx.strokeStyle = pal.goldLight; ctx.lineWidth = 3 * k; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = a0 * alpha * lift; ctx.stroke(chev); }
    ctx.globalAlpha = a0;
  }
}

/* ---------------- 花本（结网 + 绳结） ---------------- */
function rowOpacity(d) {
  if (d < -0.5) return lerp(1, 0.55, clamp((-d - 0.5) / 0.5));
  if (d > 0.5) return lerp(1, 0.34, clamp((d - 0.5) / 0.5));
  return 1;
}
/**
 * 花本：每行一根横向丝绳，bit=1 的地方打一个结；竖向的线把行串成一张网，挂在横梁上。
 * R 同布面：第 r 行的中心在 FY + (r − R)·S + S/2。读行带固定在 FY 上下各半格。
 */
export function drawTape(ctx, o) {
  const {
    x0, S, cols, FY, R, bit, rowA = () => 1, top, bottom, beamY, strGrow = 1, band = 1,
    alpha = 1, pal = PAL, beamA = 1,
  } = o;
  const W = cols * S, k = S / 36;
  const a0 = ctx.globalAlpha;
  ctx.save();
  if (beamA > 0.003) {
    ctx.globalAlpha = a0 * alpha * beamA;
    ctx.fillStyle = pal.beam;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x0 - 26, beamY - 7 * k, W + 52, 14 * k, 7 * k) : ctx.rect(x0 - 26, beamY - 7 * k, W + 52, 14 * k); ctx.fill();
  }
  const sTop = beamY + 7 * k, sBot = lerp(sTop, bottom, clamp(strGrow));
  ctx.beginPath(); ctx.rect(x0 - 60, Math.min(top, sTop), W + 120, bottom - Math.min(top, sTop) + 20); ctx.clip();
  // 两侧的绳与竖线
  ctx.lineCap = "round";
  ctx.strokeStyle = pal.cord;
  ctx.globalAlpha = a0 * alpha * 0.8; ctx.lineWidth = 4 * k;
  for (const x of [x0 - 12 * k, x0 + W + 8 * k]) { ctx.beginPath(); ctx.moveTo(x, sTop); ctx.lineTo(x, sBot); ctx.stroke(); }
  ctx.globalAlpha = a0 * alpha * 0.5; ctx.lineWidth = 2.5 * k;
  ctx.beginPath();
  for (let c = 0; c < cols; c++) { const x = x0 + c * S + S / 2; ctx.moveTo(x, sTop); ctx.lineTo(x, sBot); }
  ctx.stroke();
  // 读行带
  if (band > 0.003) {
    ctx.globalAlpha = a0 * alpha * band; ctx.fillStyle = pal.glow;
    ctx.fillRect(x0 - 44 * k, FY - S / 2, W + 88 * k, S);
  }
  // 行
  const rLo = Math.floor(R + (top - FY) / S) - 1, rHi = Math.ceil(R + (bottom - FY) / S) + 1;
  for (let r = rLo; r <= rHi; r++) {
    const ra = rowA(r);
    if (ra <= 0.003) continue;
    const yc = FY + (r - R) * S + S / 2;
    if (yc < top - S || yc > bottom + S || yc > sBot) continue;
    const d = (yc - FY) / S, op = alpha * ra * rowOpacity(d);
    ctx.globalAlpha = a0 * op; ctx.strokeStyle = pal.cord; ctx.lineWidth = 4 * k;
    ctx.beginPath(); ctx.moveTo(x0, yc); ctx.lineTo(x0 + W, yc); ctx.stroke();
    const hot = Math.abs(d) <= 0.5 && band > 0.003;
    for (let c = 0; c < cols; c++) {
      if (!bit(r, c)) continue;
      const x = x0 + c * S + S / 2;
      if (hot) { ctx.globalAlpha = a0 * op * band; ctx.fillStyle = pal.glow; ctx.beginPath(); ctx.arc(x, yc, 17 * k, 0, 6.2832); ctx.fill(); }
      ctx.globalAlpha = a0 * op; ctx.fillStyle = pal.knot; ctx.beginPath(); ctx.arc(x, yc, 11 * k, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = a0 * op * 0.35; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 3 * k, yc - 3.5 * k, 3.6 * k, 0, 6.2832); ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = a0;
}

/* ---------------- 梭 ---------------- */
export function drawShuttle(ctx, x, y, s = 1, dir = 1, alpha = 1, pal = PAL) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.scale(s * dir, s);
  ctx.beginPath();
  ctx.moveTo(-44, 0); ctx.quadraticCurveTo(-24, -14, -2, -14); ctx.lineTo(34, -5); ctx.lineTo(50, 0); ctx.lineTo(34, 5); ctx.lineTo(-2, 14); ctx.quadraticCurveTo(-24, 14, -44, 0); ctx.closePath();
  const g = ctx.createLinearGradient(0, -14, 0, 14);
  g.addColorStop(0, pal.shuttle[0]); g.addColorStop(1, pal.shuttle[1]);
  ctx.fillStyle = g; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5; ctx.fill();
  ctx.shadowColor = "transparent"; ctx.lineWidth = 2.5; ctx.strokeStyle = pal.shuttleEdge; ctx.stroke();
  ctx.fillStyle = pal.shuttleSlot; ctx.beginPath();
  ctx.moveTo(-16, -4.5); ctx.lineTo(8, -4.5); ctx.arc(8, 0, 4.5, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-16, 4.5); ctx.arc(-16, 0, 4.5, Math.PI / 2, -Math.PI / 2); ctx.fill();
  ctx.restore();
}

/* ---------------- 光带 ---------------- */
/** 一条斜向高光带扫过 [x0,x1]×[y0,y1]；u 0→1 走完。叠加混合，金色。 */
export function drawGlint(ctx, { u, x0 = 0, x1 = 1920, y0 = 0, y1 = 1080, w = 360, a = 0.5, color = "240,193,90" }) {
  if (u <= 0 || u >= 1) return;
  const x = lerp(x0 - w, x1 + w, u);
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(0.5, `rgba(${color},${a})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x - w, y0, 2 * w, y1 - y0);
  ctx.restore();
}
/** 织口上一条横向的光带（织得太快，梭看不清时用它代替梭） */
export function drawStreak(ctx, { x0, x1, y, h = 26, a = 0.5 }) {
  if (a <= 0.003) return;
  const g = ctx.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, "rgba(240,193,90,0)"); g.addColorStop(0.5, `rgba(248,220,138,${a})`); g.addColorStop(1, "rgba(240,193,90,0)");
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x0, y - h, x1 - x0, 2 * h); ctx.restore();
}

/* ---------------- 齿轮 ---------------- */
export function drawGear(ctx, x, y, r, teeth, rot, { col = "#f0c15a", lw = 3, alpha = 1 } = {}) {
  const d = (Math.PI * 2) / teeth, R2 = r * 1.18;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.globalAlpha *= alpha; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round";
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i * d;
    const p = [[a - 0.34 * d, r], [a - 0.18 * d, R2], [a + 0.18 * d, R2], [a + 0.34 * d, r]];
    p.forEach(([an, rr], j) => { const px = Math.cos(an) * rr, py = Math.sin(an) * rr; (i === 0 && j === 0) ? ctx.moveTo(px, py) : ctx.lineTo(px, py); });
  }
  ctx.closePath(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, 6.2832); ctx.stroke();
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34); ctx.lineTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); ctx.stroke(); }
  ctx.restore();
}

/* ---------------- S5：一条带子的四种材质 ---------------- */
const CREAM = ["#d9c9a0", "#f2e7c8"];
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
/**
 * 竖直的带子：同一份位图，三种材质——cord（丝绳结网）、paper（穿孔纸带）、cards（穿孔卡链）。
 * 格是 cw × ch 的长方格；第 r 行的中心在 FY + (r − R)·ch + ch/2，读行带固定在 FY 上下各半格。
 */
export function drawRibbon(ctx, o) {
  const { x0, cw, ch, cols, FY, R, bit, top, bottom, mat = "cord", alpha = 1, band = 0.6, pal = PAL } = o;
  const W = cols * cw, a0 = ctx.globalAlpha;
  const rLo = Math.floor(R + (top - FY) / ch) - 2, rHi = Math.ceil(R + (bottom - FY) / ch) + 2;
  const yc = (r) => FY + (r - R) * ch + ch / 2;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 60, top, W + 120, bottom - top); ctx.clip();
  if (mat === "cord") {
    ctx.lineCap = "round"; ctx.strokeStyle = pal.cord;
    ctx.globalAlpha = a0 * alpha * 0.8; ctx.lineWidth = 4;
    for (const x of [x0 - 10, x0 + W + 10]) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom); ctx.stroke(); }
    ctx.globalAlpha = a0 * alpha * 0.5; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let c = 0; c < cols; c++) { const x = x0 + c * cw + cw / 2; ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    ctx.stroke();
    for (let r = rLo; r <= rHi; r++) {
      const y = yc(r), op = alpha * rowOpacity((y - FY) / ch);
      ctx.globalAlpha = a0 * op; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + W, y); ctx.stroke();
      ctx.fillStyle = pal.knot;
      for (let c = 0; c < cols; c++) if (bit(r, c)) { ctx.beginPath(); ctx.arc(x0 + c * cw + cw / 2, y, cw * 0.4, 0, 6.2832); ctx.fill(); }
    }
  } else if (mat === "paper") {
    const g = ctx.createLinearGradient(x0 - 16, 0, x0 + W + 16, 0);
    g.addColorStop(0, CREAM[0]); g.addColorStop(0.5, CREAM[1]); g.addColorStop(1, CREAM[0]);
    ctx.globalAlpha = a0 * alpha; ctx.fillStyle = g;
    ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 20; ctx.fillRect(x0 - 16, top - 20, W + 32, bottom - top + 40); ctx.shadowColor = "transparent";
    for (let r = rLo; r <= rHi; r++) {
      const y = yc(r), op = alpha * (0.55 + 0.45 * rowOpacity((y - FY) / ch));
      ctx.globalAlpha = a0 * op;
      ctx.fillStyle = "rgba(110,90,50,.55)";
      for (const x of [x0 - 8, x0 + W + 8]) { ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.2832); ctx.fill(); }   // 供纸孔
      ctx.fillStyle = "#0d1538";
      for (let c = 0; c < cols; c++) if (bit(r, c)) { ctx.beginPath(); ctx.arc(x0 + c * cw + cw / 2, y, cw * 0.36, 0, 6.2832); ctx.fill(); }
      ctx.strokeStyle = "rgba(120,100,60,.22)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 - 16, y + ch / 2); ctx.lineTo(x0 + W + 16, y + ch / 2); ctx.stroke();
    }
  } else if (mat === "cards") {
    const gLo = Math.floor(rLo / 2) - 1, gHi = Math.ceil(rHi / 2) + 1;
    for (let gi = gLo; gi <= gHi; gi++) {
      const y0 = FY + (2 * gi - R) * ch + 5, h = 2 * ch - 10;
      const d = (y0 + h / 2 - FY) / ch;
      ctx.globalAlpha = a0 * alpha * (0.6 + 0.4 * rowOpacity(d));
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, CREAM[1]); g.addColorStop(1, CREAM[0]);
      ctx.fillStyle = g; ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
      rrect(ctx, x0 - 14, y0, W + 28, h, 8); ctx.fill();
      ctx.shadowColor = "transparent"; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = "rgba(120,100,60,.5)"; ctx.lineWidth = 1.5; rrect(ctx, x0 - 14, y0, W + 28, h, 8); ctx.stroke();
      ctx.fillStyle = "#0d1538";
      for (const r of [2 * gi, 2 * gi + 1]) for (let c = 0; c < cols; c++) if (bit(r, c)) {
        ctx.fillRect(x0 + c * cw + cw * 0.2, FY + (r - R) * ch + ch * 0.25, cw * 0.6, ch * 0.5);
      }
      // 卡与卡之间的环扣
      ctx.strokeStyle = pal.cord; ctx.lineWidth = 3;
      for (const x of [x0 + 6, x0 + W - 6]) { ctx.beginPath(); ctx.arc(x, y0 + h + 5, 6, 0, 6.2832); ctx.stroke(); }
    }
  }
  if (band > 0.003) {
    ctx.globalAlpha = a0 * alpha * band; ctx.fillStyle = pal.glow;
    ctx.fillRect(x0 - 50, FY - ch / 2, W + 100, ch);
    ctx.fillStyle = "rgba(240,193,90,.7)"; ctx.fillRect(x0 - 50, FY - ch / 2 - 1, W + 100, 2); ctx.fillRect(x0 - 50, FY + ch / 2 - 1, W + 100, 2);
  }
  ctx.restore();
  ctx.globalAlpha = a0;
}

/** 深色玻璃屏：16×16 位图逐行点亮（S5 材质 4）。cx, cy 为屏中心，size 为边长。fill = 点亮的行数 / 16。 */
export function drawScreen(ctx, { cx, cy, size = 448, fill = 1, alpha = 1, bit, pal = PAL }) {
  const H = size / 2, pad = 26, cell = size / 16;
  ctx.save(); ctx.globalAlpha *= alpha;
  const base = ctx.globalAlpha;
  ctx.translate(cx, cy);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(0, -H - pad, 0, H + pad);
  g.addColorStop(0, "#1c2548"); g.addColorStop(1, "#0b1129");
  ctx.fillStyle = g; rrect(ctx, -H - pad, -H - pad, size + 2 * pad, size + 2 * pad, 22); ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(170,179,214,.45)"; ctx.lineWidth = 3; rrect(ctx, -H - pad, -H - pad, size + 2 * pad, size + 2 * pad, 22); ctx.stroke();
  ctx.fillStyle = "#050818"; ctx.fillRect(-H, -H, size, size);
  const rows = fill * 16;
  for (let r = 0; r < 16; r++) {
    const p = clamp(rows - r);
    if (p <= 0) break;
    ctx.globalAlpha = base * p;
    for (let c = 0; c < 16; c++) {
      const on = bit(r, c);
      ctx.fillStyle = on ? "rgba(240,193,90,.95)" : "rgba(47,68,145,.8)";
      if (on) { ctx.shadowColor = "rgba(240,193,90,.7)"; ctx.shadowBlur = 10; }
      ctx.fillRect(-H + c * cell + 2.5, -H + r * cell + 2.5, cell - 5, cell - 5);
      ctx.shadowColor = "transparent";
    }
  }
  const lr = Math.min(15.99, rows);
  if (rows > 0 && rows < 16) { ctx.globalAlpha = base * 0.8; ctx.fillStyle = pal.goldLight; ctx.fillRect(-H, -H + lr * cell + cell - 1.5, size, 3); }
  ctx.restore();
}

/* ---------------- 金尘 ---------------- */
/** D = 已上升的距离（调用方用 integ 从速度积出来，换速度时才不跳）。 */
export function drawDust(ctx, t, D, { n = 28, seed = 11, alpha = 1, w = 1920, h = 1080 } = {}) {
  const r = rng(seed);
  ctx.save(); ctx.fillStyle = PAL.gold;
  for (let i = 0; i < n; i++) {
    const x = r() * w, y0 = r() * h, v = 9 + r() * 14, s = 1 + r() * 1.7, ph = r() * 6.28, sw = 6 + r() * 12;
    const y = mod(y0 - v * D, h + 60) - 30;
    const xx = x + Math.sin(t * 0.4 + ph) * sw;
    ctx.globalAlpha = (0.22 + 0.36 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph))) * alpha;
    ctx.beginPath(); ctx.arc(xx, y, s, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}
