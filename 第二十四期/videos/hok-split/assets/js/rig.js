// 绘图基元。风格：样张 A 表情包拼贴（粗黑描边、白边贴纸、会咬人的收费站、拟声大字），账单和数字借 C 的干净排版。
// 所有函数只画当下这一帧，参数全部由调用方用 t 算好传进来，不保存任何状态。
import { clamp, mix, ease, hash } from "./lib.js";

export const C = {
  ink: "#0a0a0a", white: "#ffffff", coin: "#ffd21f", coinDark: "#c98a00", red: "#ff3b30", yel: "#ffd21f",
  grn: "#3ddc84", blue: "#3d8bff", navy: "#0d1530", pipe: "#2a3b78", paper: "#fff8d6", card: "#eef2f8", brick: "#c9563c",
};
export const FONT = "NotoSC";

// ---------- 素材 ----------
export const IMG = {};
const APPLE_D = "M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z";
export const APPLE = new Path2D(APPLE_D);   // 814×1000
const load = (src) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });

/** 给抠图描一圈白边（贴纸感），离屏画一次，之后每帧直接贴 */
function outlined(im, r = 9) {
  if (!im) return null;
  const pad = r + 4, c = document.createElement("canvas");
  c.width = im.width + pad * 2; c.height = im.height + pad * 2;
  const g = c.getContext("2d"), s = document.createElement("canvas");
  s.width = c.width; s.height = c.height;
  const sg = s.getContext("2d");
  // 先把半透明的烟雾、光效清掉（低于 0.45 透明度的像素），不然描白边后会变成一团白雾
  const base = document.createElement("canvas"); base.width = im.width; base.height = im.height;
  const bg2 = base.getContext("2d"); bg2.drawImage(im, 0, 0);
  const d = bg2.getImageData(0, 0, im.width, im.height), px = d.data;
  for (let i = 3; i < px.length; i += 4) px[i] = px[i] < 115 ? 0 : Math.min(255, (px[i] - 115) * 1.8);
  bg2.putImageData(d, 0, 0); im = base;
  sg.drawImage(im, pad, pad); sg.globalCompositeOperation = "source-in"; sg.fillStyle = "#fff"; sg.fillRect(0, 0, s.width, s.height);
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.drawImage(s, Math.cos(a) * r, Math.sin(a) * r); }
  g.drawImage(im, pad, pad);
  return c;
}

export async function loadAll() {
  const faces = [106, 109, 112, 113, 131, 144, 152, 166, 167, 169];
  const heroes = [112, 144, 167, 131, 109];
  const jobs = [];
  for (const id of faces) jobs.push(load(`assets/img/face-${id}.png`).then((im) => (IMG[`face${id}`] = im)));
  for (const id of faces) jobs.push(load(`assets/img/skin-${id}.jpg`).then((im) => (IMG[`skin${id}`] = im)));
  for (const id of heroes) jobs.push(load(`assets/img/hero-${id}.png`).then((im) => (IMG[`hero${id}`] = outlined(im, 10))));
  jobs.push(load("assets/img/android.svg").then((im) => (IMG.android = im)));
  jobs.push(load("assets/img/logo-wzry.png").then((im) => (IMG.logo = im)));
  await Promise.all(jobs);
}

// ---------- 通用 ----------
export function rr(ctx, x, y, w, h, r, fill, stroke, lw = 6) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
/** 表情包字：粗黑描边，可旋转、缩放 */
export function mtext(ctx, s, x, y, size, o = {}) {
  const { fill = "#fff", stroke = C.ink, sw = size * 0.14, rot = 0, align = "center", weight = 900, alpha = 1, scale = 1, base = "alphabetic", shadow = true } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = base; ctx.lineJoin = "round";
  if (stroke && shadow) { ctx.fillStyle = C.ink; ctx.fillText(s, 0, size * 0.07); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = fill; ctx.fillText(s, 0, 0);
  ctx.restore();
}
/** 干净的字（C 的排版：账单、注释、卡片），不描边 */
export function ctext(ctx, s, x, y, size, o = {}) {
  const { fill = "#111", align = "left", weight = 700, alpha = 1, base = "alphabetic" } = o;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.font = `${weight} ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = fill; ctx.fillText(s, x, y); ctx.restore();
}
/** 弹入：0→1 过冲回落（只看进度） */
export const pop = (x) => { x = clamp(x); if (x <= 0) return 0; const s = 1.70158 * 1.6; return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2; };
/** 挤压回弹：撞击后 0..1 时间里的形变量 */
export const squash = (x) => (x <= 0 || x >= 1 ? 0 : Math.sin(x * Math.PI * 3) * (1 - x) * 0.18);

// ---------- 背景：漫画放射线 ----------
export function rays(ctx, cx, cy, t, a = 0.05, n = 24, tint = "#ffffff") {
  ctx.save(); ctx.fillStyle = tint; ctx.globalAlpha = a;
  const rot = t * 0.05;
  for (let i = 0; i < n; i++) {
    const u = (i / n) * Math.PI * 2 + rot, v = u + Math.PI / (n * 2);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 3000 * Math.cos(u), cy + 3000 * Math.sin(u)); ctx.lineTo(cx + 3000 * Math.cos(v), cy + 3000 * Math.sin(v)); ctx.fill();
  }
  ctx.restore();
}

// ---------- 主角：一块钱硬币 ----------
/** missing：从 12 点顺时针缺掉的比例；face：happy / shock / cry / blink；look：眼珠偏移 -1..1 */
export function coin(ctx, x, y, r, o = {}) {
  const { missing = 0, face = "happy", rot = 0, label = "¥1", sq = 0, look = 0, alpha = 1, blink = 0, tears = 0 } = o;
  if (alpha <= 0.002 || r <= 0.5) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1 + sq, 1 - sq);
  const path = new Path2D();
  if (missing <= 0) path.arc(0, 0, r, 0, Math.PI * 2);
  else { const a0 = -Math.PI / 2 + missing * Math.PI * 2; path.moveTo(0, 0); path.arc(0, 0, r, a0, -Math.PI / 2 + Math.PI * 2); path.closePath(); }
  ctx.translate(0, r * 0.07); ctx.fillStyle = C.ink; ctx.fill(path); ctx.translate(0, -r * 0.07);
  ctx.fillStyle = C.coin; ctx.fill(path); ctx.lineWidth = Math.max(4, r * 0.07); ctx.lineJoin = "round"; ctx.strokeStyle = C.ink; ctx.stroke(path);
  if (!missing) { ctx.beginPath(); ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2); ctx.strokeStyle = C.coinDark; ctx.lineWidth = r * 0.05; ctx.stroke(); }
  const ex = -r * (missing ? 0.55 : 0.3), ey = -r * 0.02, d = r * 0.34, er = r * 0.1, col = "#1a1200";
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineWidth = Math.max(3, r * 0.06);
  const lx = look * er * 0.6;
  if (face === "shock") {
    for (const k of [0, 1]) { ctx.beginPath(); ctx.arc(ex + k * d, ey, er * 1.5, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(ex + k * d + lx, ey, er * 0.6, 0, 7); ctx.fillStyle = col; ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(ex + d / 2, ey + r * 0.38, r * 0.12, r * 0.17, 0, 0, 7); ctx.fill();
  } else if (face === "cry") {
    for (const k of [0, 1]) { ctx.beginPath(); ctx.moveTo(ex + k * d - er, ey); ctx.quadraticCurveTo(ex + k * d, ey - er, ex + k * d + er, ey); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(ex + d * 0.1, ey + r * 0.42); ctx.quadraticCurveTo(ex + d * 0.5, ey + r * 0.24, ex + d * 0.9, ey + r * 0.42); ctx.stroke();
    const k = (tears % 1 + 1) % 1;
    ctx.fillStyle = "#6fd0ff";
    for (const s of [0, 0.5]) { const q = (k + s) % 1; ctx.globalAlpha = (1 - q) * alpha; ctx.beginPath(); ctx.ellipse(ex - er * 0.4, ey + er * 1.4 + q * r * 0.7, er * 0.55, er * 0.8, 0, 0, 7); ctx.fill(); }
    ctx.globalAlpha = alpha;
  } else {
    const b = clamp(blink);
    for (const k of [0, 1]) { ctx.beginPath(); ctx.ellipse(ex + k * d + lx, ey, er, er * (1 - 0.9 * b), 0, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(ex - d * 0.05, ey + r * 0.25); ctx.quadraticCurveTo(ex + d * 0.5, ey + r * 0.55, ex + d * 1.05, ey + r * 0.25); ctx.stroke();
  }
  if (label) { ctx.font = `900 ${r * 0.34}px ${FONT}`; ctx.textAlign = "center"; ctx.fillStyle = col; ctx.fillText(label, -r * 0.12, -r * 0.3); }
  ctx.restore();
}

// ---------- 收费站：岗亭＋招牌＋栏杆 ----------
/** boom：栏杆 0 = 抬起、1 = 落下；mouth：窗口张嘴 0..1；logo：'apple' / 'android' / null */
export function gate(ctx, x, y, k, o = {}) {
  const { sign = "", logo = null, boom = 1, mouth = -1, alpha = 1, roof = C.red, lit = 0, flag = null } = o;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(k, k);
  const w = 150, h = 170;
  if (lit > 0) { const g = ctx.createRadialGradient(0, -h / 2, 10, 0, -h / 2, 260); g.addColorStop(0, `rgba(255,210,31,${0.55 * lit})`); g.addColorStop(1, "rgba(255,210,31,0)"); ctx.fillStyle = g; ctx.fillRect(-300, -h - 260, 600, 520); }
  // 栏杆（以岗亭左下为轴，抬起时转上去）
  ctx.save(); ctx.translate(-w / 2, -h * 0.32); ctx.rotate(-(1 - clamp(boom)) * Math.PI * 0.42);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? "#fff" : C.red; ctx.fillRect(-230 + i * 46, 0, 46, 18); }
  ctx.strokeStyle = C.ink; ctx.lineWidth = 3.5; ctx.strokeRect(-230, 0, 230, 18);
  ctx.restore();
  rr(ctx, -w / 2, -h, w, h, 10, "#f4f4f4", C.ink, 7);
  ctx.beginPath(); ctx.moveTo(-w * 0.66, -h); ctx.lineTo(0, -h - 62); ctx.lineTo(w * 0.66, -h); ctx.closePath();
  ctx.fillStyle = roof; ctx.fill(); ctx.lineWidth = 7; ctx.lineJoin = "round"; ctx.strokeStyle = C.ink; ctx.stroke();
  rr(ctx, -w * 0.32, -h * 0.78, w * 0.64, h * 0.36, 6, "#bfe3ff", C.ink, 5);
  if (mouth >= 0) {   // 窗口变成一张嘴
    const m = clamp(mouth), top = -h * 0.74, mh = h * 0.3 * m;
    ctx.fillStyle = "#000"; ctx.fillRect(-w * 0.28, top, w * 0.56, mh + 4);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 4; i++) { const tx = -w * 0.24 + i * w * 0.16; ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx + w * 0.05, top + 14); ctx.lineTo(tx + w * 0.1, top); ctx.fill(); ctx.beginPath(); ctx.moveTo(tx, top + mh + 4); ctx.lineTo(tx + w * 0.05, top + mh - 10); ctx.lineTo(tx + w * 0.1, top + mh + 4); ctx.fill(); }
  }
  if (logo || sign) {
    ctx.font = `900 44px ${FONT}`;
    const tw = sign ? ctx.measureText(sign).width : 0;
    const sw = Math.max(150, tw + (logo ? 100 : 44)), sh = 78, sy = -h - 62 - sh - 14;
    rr(ctx, -sw / 2, sy, sw, sh, 12, "#fff", C.ink, 7);
    let tx = 0;
    if (logo === "apple") { ctx.save(); const lk = (sh * 0.66) / 1000; ctx.translate(sign ? -sw / 2 + 22 : -814 * lk / 2, sy + sh * 0.15); ctx.scale(lk, lk); ctx.fillStyle = "#111"; ctx.fill(APPLE); ctx.restore(); tx = sign ? 30 : 0; }
    if (logo === "android") { droid(ctx, -sw / 2 + 44, sy + sh * 0.62, 52); tx = 30; }
    if (sign) { ctx.fillStyle = "#111"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(sign, tx, sy + sh * 0.72); }
  }
  if (flag) { // 小旗：插在屋顶
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * 0.5, -h - 10); ctx.lineTo(w * 0.5, -h - 120); ctx.stroke();
    const wv = flag.wave || 0;
    ctx.beginPath(); ctx.moveTo(w * 0.5, -h - 120); ctx.quadraticCurveTo(w * 0.5 + 40, -h - 120 + wv * 10, w * 0.5 + 76, -h - 108); ctx.lineTo(w * 0.5, -h - 86); ctx.closePath();
    ctx.fillStyle = flag.color || C.yel; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  }
  ctx.restore();
}

/** 安卓机器人（头＋天线），代码画；s = 头宽 */
export function droid(ctx, cx, cy, s) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = "#3ddc84"; ctx.strokeStyle = "#3ddc84"; ctx.lineCap = "round"; ctx.lineWidth = s * 0.07;
  ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.38); ctx.lineTo(-s * 0.4, -s * 0.58); ctx.moveTo(s * 0.28, -s * 0.38); ctx.lineTo(s * 0.4, -s * 0.58); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, s / 2, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.2, s * 0.06, 0, 7); ctx.arc(s * 0.2, -s * 0.2, s * 0.06, 0, 7); ctx.fill();
  ctx.fillStyle = "#3ddc84"; ctx.fillRect(-s / 2, s * 0.06, s, s * 0.5);
  ctx.restore();
}
/** 管道：圆头粗带 */
export function pipe(ctx, x1, y, x2, h, fill = C.pipe) {
  rr(ctx, x1, y - h / 2, x2 - x1, h, h / 2, fill, C.ink, 8);
}

/** 英雄头像贴纸：白边＋投影 */
export function sticker(ctx, id, x, y, r, o = {}) {
  const { rot = 0, scale = 1, alpha = 1 } = o, im = IMG[`face${id}`];
  if (!im || alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.arc(6, 10, r + 14, 0, 7); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(0, 0, r + 14, 0, 7); ctx.fill();
  ctx.drawImage(im, -r, -r, 2 * r, 2 * r);
  ctx.restore();
}
/** 英雄全身抠图（已描白边）；h 为显示高度 */
export function hero(ctx, id, x, y, h, o = {}) {
  const { rot = 0, flip = false, alpha = 1, scale = 1, ax = 0.5, ay = 1 } = o, im = IMG[`hero${id}`];
  if (!im || alpha <= 0.002 || scale <= 0.001) return;
  const k = (h / im.height) * scale;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip ? -k : k, k);
  ctx.drawImage(im, -im.width * ax, -im.height * ay);
  ctx.restore();
}
/** 皮肤卡：原画裁一块，白边圆角卡片 */
export function skinCard(ctx, id, x, y, w, o = {}) {
  const { rot = 0, alpha = 1, scale = 1 } = o, im = IMG[`skin${id}`];
  if (!im || alpha <= 0.002 || scale <= 0.001) return;
  const h = w * 1.32;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  rr(ctx, -w / 2 + 5, -h / 2 + 8, w, h, 14, "rgba(0,0,0,.5)");
  rr(ctx, -w / 2 - 7, -h / 2 - 7, w + 14, h + 14, 18, "#fff", C.ink, 4);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12); ctx.clip();
  const sh = h, sw = sh * (im.width / im.height), cx = im.width * 0.55;   // 原画中段（人物大多在这）
  ctx.drawImage(im, cx - (im.width * (w / sw)) / 2, 0, im.width * (w / sw), im.height, -w / 2, -h / 2, w, h);
  ctx.restore(); ctx.restore();
}

/** 对话气泡：tail = 'bl' / 'br' / 'b' */
export function bubble(ctx, x, y, w, h, s, o = {}) {
  const { tail = "bl", size = 44, rot = 0, scale = 1, alpha = 1, fill = "#fff" } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
  const tx = tail === "bl" ? w * 0.22 : tail === "br" ? w * 0.78 : w * 0.5, td = tail === "bl" ? -40 : tail === "br" ? 40 : 0;
  ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(w - 24, 0); ctx.quadraticCurveTo(w, 0, w, 24); ctx.lineTo(w, h - 24); ctx.quadraticCurveTo(w, h, w - 24, h);
  ctx.lineTo(tx + 26, h); ctx.lineTo(tx + td, h + 46); ctx.lineTo(tx - 14, h); ctx.lineTo(24, h); ctx.quadraticCurveTo(0, h, 0, h - 24); ctx.lineTo(0, 24); ctx.quadraticCurveTo(0, 0, 24, 0); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 7; ctx.lineJoin = "round"; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#111"; ctx.fillText(s, w / 2, h / 2 + 2);
  ctx.restore();
}

/** 小账单（C 的干净排版）：rows = [[名, 值, 进度 0..1, 颜色]] */
export function ledger(ctx, x, y, rows, o = {}) {
  const { title = "这一块钱 · 到手", alpha = 1, w = 470, scale = 1 } = o;
  if (alpha <= 0.002) return;
  const h = 92 + rows.length * 66;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(scale, scale);
  rr(ctx, 6, 10, w, h, 16, "rgba(0,0,0,.5)");
  rr(ctx, 0, 0, w, h, 16, C.paper, C.ink, 6);
  ctext(ctx, title, 30, 58, 38, { weight: 900 });
  rows.forEach(([k, v, p, col], i) => {
    const a = clamp(p);
    ctext(ctx, k, 30, 124 + i * 66, 38, { weight: 600, alpha: a });
    ctx.save(); ctx.translate(w - 30, 124 + i * 66); const s = 1 + 0.35 * Math.sin(clamp(p * 1.6) * Math.PI) * (p < 1 ? 1 : 0); ctx.scale(s, s);
    ctext(ctx, v, 0, 0, 46, { weight: 900, align: "right", fill: col || "#d4380d", alpha: a }); ctx.restore();
  });
  ctx.restore();
}

/** 砖墙：x 范围、y 范围；hole = {cx, cy, rx, ry, k}（k 0..1 洞的大小） */
export function wall(ctx, x0, x1, y0, y1, o = {}) {
  const { hole = null, rise = 1, alpha = 1, bw = 64, bh = 40 } = o;
  if (alpha <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= alpha;
  const rows = Math.ceil((y1 - y0) / bh), top = y1 - (y1 - y0) * clamp(rise);
  for (let r = 0; r < rows; r++) {
    const y = y1 - (r + 1) * bh; if (y + bh < top - 0.5) continue;
    for (let c = -1; c < Math.ceil((x1 - x0) / bw) + 1; c++) {
      const bx0 = x0 + c * bw + (r % 2 ? bw / 2 : 0), bx = Math.max(x0, bx0), w = Math.min(bx0 + bw, x1) - bx;
      if (w <= 3) continue;
      if (hole && hole.k > 0) { const dx = (bx + w / 2 - hole.cx) / (hole.rx * hole.k), dy = (y + bh / 2 - hole.cy) / (hole.ry * hole.k); if (dx * dx + dy * dy < 1) continue; }
      ctx.fillStyle = C.brick; ctx.fillRect(bx, Math.max(y, top), w, bh - Math.max(0, top - y));
      ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(bx, Math.max(y, top), w, bh - Math.max(0, top - y));
    }
  }
  ctx.restore();
}
export function brick(ctx, x, y, rot, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.fillStyle = C.brick; ctx.fillRect(-32, -20, 64, 40); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(-32, -20, 64, 40); ctx.restore();
}

/** 手机：kind = 'android' / 'apple' / 'harmony' */
export function phone(ctx, x, y, h, kind, o = {}) {
  const { rot = 0, alpha = 1, scale = 1, screen = null } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  const w = h * 0.5;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  rr(ctx, -w / 2 + 8, -h / 2 + 12, w, h, 40, "rgba(0,0,0,.5)");
  rr(ctx, -w / 2, -h / 2, w, h, 40, "#1d1f27", C.ink, 8);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, kind === "apple" ? "#3a4a8c" : kind === "harmony" ? "#8c3a3a" : "#2f7a4f"); g.addColorStop(1, "#141a30");
  rr(ctx, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 28, g);
  if (screen) screen(ctx, w - 28, h - 28);
  // 背后的身份牌
  const bx = 0, by = h / 2 - 10;
  rr(ctx, bx - 74, by - 34, 148, 68, 18, "#fff", C.ink, 6);
  if (kind === "apple") { ctx.save(); const lk = 46 / 1000; ctx.translate(bx - 814 * lk / 2, by - 24); ctx.scale(lk, lk); ctx.fillStyle = "#111"; ctx.fill(APPLE); ctx.restore(); }
  else if (kind === "android") droid(ctx, bx, by + 8, 56);
  else ctext(ctx, "鸿蒙", bx, by + 14, 38, { align: "center", weight: 900 });
  ctx.restore();
}

/** 纸卡（官方问答、规则卡）：C 的干净排版 */
export function paperCard(ctx, x, y, w, h, o = {}) {
  const { rot = 0, alpha = 1, scale = 1, head = "", headColor = "#1d2a4d" } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  rr(ctx, -w / 2 + 10, -h / 2 + 14, w, h, 22, "rgba(0,0,0,.5)");
  rr(ctx, -w / 2, -h / 2, w, h, 22, C.card, C.ink, 7);
  if (head) { ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 96, [22, 22, 0, 0]); ctx.fillStyle = headColor; ctx.fill(); ctx.restore(); ctext(ctx, head, -w / 2 + 40, -h / 2 + 64, 42, { fill: "#fff", weight: 900 }); }
  ctx.restore();
}
/** 盖章 */
export function stamp(ctx, s, x, y, size, o = {}) {
  const { rot = -0.18, alpha = 1, scale = 1, color = C.red } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = `900 ${size}px ${FONT}`; const w = ctx.measureText(s).width + size * 0.8, h = size * 1.5;
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.1; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, 0, 2);
  ctx.restore();
}
/** 速度线 */
export function speedLines(ctx, x, y, dir, len, n, t, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.strokeStyle = "#fff"; ctx.lineCap = "round"; ctx.lineWidth = 6;
  for (let i = 0; i < n; i++) { const oy = (hash(i * 3.1) - 0.5) * 80, ph = (t * 3 + hash(i)) % 1; ctx.globalAlpha = alpha * (1 - ph); ctx.beginPath(); ctx.moveTo(x - dir * (30 + ph * len), y + oy); ctx.lineTo(x - dir * (30 + ph * len + len * 0.5), y + oy); ctx.stroke(); }
  ctx.restore();
}
/** 星爆（撞击闪光） */
export function burst(ctx, x, y, r, p, color = C.yel) {
  if (p <= 0 || p >= 1) return;
  const k = ease(p), a = 1 - p;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.fillStyle = color; ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
  ctx.beginPath();
  for (let i = 0; i < 24; i++) { const ang = (i / 24) * Math.PI * 2, rr2 = (i % 2 ? 0.45 : 1) * r * (0.4 + 0.6 * k); ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
/** 金库 */
export function vault(ctx, x, y, w, h, o = {}) {
  const { bars = [0, 0], alpha = 1, shake = 0 } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x + shake, y);
  rr(ctx, -w / 2 + 8, 12, w, h, 26, "rgba(0,0,0,.5)");
  rr(ctx, -w / 2, 0, w, h, 26, "#fff", C.ink, 8);
  mtext(ctx, "¥", 0, h * 0.58, h * 0.46, { fill: "#111", stroke: null });
  const bw = w * 0.7;
  bars.forEach((b, i) => { rr(ctx, -bw / 2, h * 0.72 + i * 34, bw, 20, 10, "#e4e7ee", C.ink, 3); rr(ctx, -bw / 2, h * 0.72 + i * 34, bw * clamp(b), 20, 10, i ? C.red : C.yel); });
  ctx.restore();
}
/** 厚账本 */
export function book(ctx, x, y, w, h, o = {}) {
  const { rot = 0, label = "", open = 0, alpha = 1, scale = 1, color = C.blue } = o;
  if (alpha <= 0.002 || scale <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  rr(ctx, -w / 2 + 8, -h / 2 + 12, w, h, 12, "rgba(0,0,0,.5)");
  rr(ctx, -w / 2, -h / 2, w, h, 12, color, C.ink, 7);
  rr(ctx, -w / 2 + 14, -h / 2 + 20, w - 28, h * 0.28, 8, "#fff", C.ink, 4);
  ctext(ctx, label, 0, -h / 2 + 20 + h * 0.2, Math.min(40, h * 0.17), { align: "center", weight: 900 });
  for (let i = 0; i < 3; i++) rr(ctx, -w / 2 + 24, -h / 2 + h * 0.45 + i * h * 0.15, (w - 48) * (0.9 - 0.2 * hash(i + label.length)), 12, 6, "rgba(255,255,255,.55)");
  ctx.restore();
}
/** 红叉 */
export function cross(ctx, x, y, s, p) {
  if (p <= 0) return; const k = pop(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.lineCap = "round";
  ctx.strokeStyle = C.ink; ctx.lineWidth = s * 0.34; ctx.beginPath(); ctx.moveTo(-s, -s); ctx.lineTo(s, s); ctx.moveTo(s, -s); ctx.lineTo(-s, s); ctx.stroke();
  ctx.strokeStyle = C.red; ctx.lineWidth = s * 0.22; ctx.stroke(); ctx.restore();
}
