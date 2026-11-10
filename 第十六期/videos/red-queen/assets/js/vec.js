// 画布上的东西：箭头、光晕、星尘、火花、波纹、泛光、透视。全部是「给时间 t，算出这一帧」的纯函数，可任意跳帧。
// 光一律用 lighter（加色）叠；预渲染的光晕贴图只建一次。配色：金（相加）/ 红（相消）/ 青（换轴·生命）/ 白，无紫、无洋红。
import { clamp, lerp, mod, rng, ease } from "./lib.js";

/* ---------------- 配色 ---------------- */
export const PAL = {
  gold:  { c: [255, 194, 71],  core: [255, 241, 194] },
  amber: { c: [232, 144, 30],  core: [255, 214, 140] },
  red:   { c: [239, 68, 68],   core: [255, 196, 176] },
  cyan:  { c: [79, 216, 232],  core: [214, 250, 255] },
  white: { c: [200, 216, 244], core: [255, 255, 255] },
  blue:  { c: [64, 120, 214],  core: [170, 210, 255] },
};
export const rg = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a < 0 ? 0 : a > 1 ? 1 : +a.toFixed(3)})`;
const P = (col) => (typeof col === "string" ? PAL[col] : col);
/** 两种配色线性混合 */
export function mixPal(a, b, k) {
  const A = P(a), B = P(b), m = (x, y) => x + (y - x) * clamp(k);
  return { c: A.c.map((v, i) => m(v, B.c[i])), core: A.core.map((v, i) => m(v, B.core[i])) };
}

/* ---------------- 画布 / 相机 ---------------- */
export function beginCanvas(cv, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  return dpr;
}
/** 相机：世界点 (cx,cy) 落在屏幕点 (sx,sy)，缩放 s。ox/oy 是全片极轻的浮动。 */
export function setCam(ctx, dpr, { s = 1, cx = 960, cy = 540, sx = 960, sy = 540, ox = 0, oy = 0 } = {}) {
  ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (sx - s * cx + ox), dpr * (sy - s * cy + oy));
}

/* ---------------- 光晕贴图 ---------------- */
const sprites = new Map();
function glowSprite(col) {
  // 渐变色（mixPal）会连续变化：按 16 级量化后再缓存，贴图数量有上限
  const q = (v) => Math.round(v / 16) * 16;
  const raw = P(col);
  const p = typeof col === "string" ? raw : { c: raw.c.map(q), core: raw.core.map(q) };
  const key = typeof col === "string" ? col : p.c.join(",") + "|" + p.core.join(",");
  let s = sprites.get(key);
  if (!s) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rg(p.core, 1));
    gr.addColorStop(0.16, rg(p.c, 0.62));
    gr.addColorStop(0.45, rg(p.c, 0.16));
    gr.addColorStop(1, rg(p.c, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    sprites.set(key, c); s = c;
  }
  return s;
}
/** 在 (x,y) 画一团光，半径 r。要在 lighter 模式下调用才是加色。 */
export function glow(ctx, x, y, r, col = "gold", a = 1) {
  if (a <= 0.003 || r < 0.5) return;
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * clamp(a);
  ctx.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = prev;
}
export const lighter = (ctx) => { ctx.globalCompositeOperation = "lighter"; };
export const normal = (ctx) => { ctx.globalCompositeOperation = "source-over"; };

/* ---------------- 箭头 ---------------- */
/**
 * 箭头：尾（暗）→ 头（亮）。(x,y) 是尾，ang 弧度，len 全长。
 * o: w 轴宽, col, a 透明度, head 头的倍率, glow 光晕强度, hot 头部白热程度
 */
export function arrow(ctx, x, y, ang, len, o = {}) {
  if (len < 3) return;
  const { w = 5, col = "gold", a = 1, head = 1, glow: gl = 1, hot = 0.7 } = o;
  if (a <= 0.003) return;
  const p = P(col);
  const hl = Math.min(len * 0.8, Math.max(16, w * 3.8) * head), hw = hl * 0.5, neck = Math.max(0, len - hl * 0.72);
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang);
  ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, rg(p.c, 0));
  g.addColorStop(0.5, rg(p.c, 0.42 * a));
  g.addColorStop(1, rg(p.c, a));
  // 光晕：三道由宽到窄、各自很淡的描边叠出柔和的衰减（单道宽带会显成一条硬边的矩形）
  ctx.strokeStyle = g; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(neck, 0);
  for (const [k, al] of [[5.6, 0.028], [3.5, 0.05], [2.1, 0.09]]) { ctx.globalAlpha = al * gl; ctx.lineWidth = w * k; ctx.stroke(); }
  ctx.globalAlpha = 1;
  // 杆：尾细头粗
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -w * 0.1); ctx.lineTo(neck, -w * 0.5); ctx.lineTo(neck, w * 0.5); ctx.lineTo(0, w * 0.1);
  ctx.closePath(); ctx.fill();
  // 头
  ctx.fillStyle = rg(p.c, a);
  ctx.beginPath();
  ctx.moveTo(len, 0); ctx.lineTo(len - hl, -hw); ctx.lineTo(len - hl * 0.72, 0); ctx.lineTo(len - hl, hw);
  ctx.closePath(); ctx.fill();
  // 白热的芯
  const g2 = ctx.createLinearGradient(len * 0.3, 0, len, 0);
  g2.addColorStop(0, rg(p.core, 0)); g2.addColorStop(1, rg(p.core, hot * a));
  ctx.strokeStyle = g2; ctx.lineWidth = Math.max(1.2, w * 0.34); ctx.lineCap = "butt";
  ctx.beginPath(); ctx.moveTo(len * 0.3, 0); ctx.lineTo(len - hl * 0.2, 0); ctx.stroke();
  ctx.restore();
  // 头部光团
  const ca = Math.cos(ang), sa = Math.sin(ang), hc = len - hl * 0.45;
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  glow(ctx, x + ca * hc, y + sa * hc, hl * 2.3, col, 0.5 * a * gl);
  ctx.restore();
}
/** 从 (x0,y0) 到 (x1,y1) 的箭头 */
export function arrowTo(ctx, x0, y0, x1, y1, o) {
  arrow(ctx, x0, y0, Math.atan2(y1 - y0, x1 - x0), Math.hypot(x1 - x0, y1 - y0), o);
}

/* ---------------- 线 / 圆 ---------------- */
/** 渐隐的光线（两端各自透明度）：画坐标轴、刻度、光束 */
export function beam(ctx, x0, y0, x1, y1, { col = "white", w = 2, a = 1, a0 = 1, a1 = 1, glow: gl = 0 } = {}) {
  const p = P(col);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rg(p.c, a * a0)); g.addColorStop(1, rg(p.c, a * a1));
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  if (gl > 0) { ctx.strokeStyle = g; ctx.globalAlpha = 0.22 * gl; ctx.lineWidth = w * 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.strokeStyle = g; ctx.lineWidth = w; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.restore();
}
/** 圆环（可压成椭圆 ry/rx，用来画地面上的波纹） */
export function ring(ctx, x, y, r, { col = "red", w = 3, a = 1, squash = 1, glow: gl = 1, dash: dashed = null } = {}) {
  if (a <= 0.003 || r < 1) return;
  const p = P(col);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(x, y); ctx.scale(1, squash);
  if (dashed) ctx.setLineDash(dashed);
  if (gl > 0) { ctx.strokeStyle = rg(p.c, 0.18 * a * gl); ctx.lineWidth = w * 4.5; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.stroke(); }
  ctx.strokeStyle = rg(p.c, a); ctx.lineWidth = w;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.stroke();
  ctx.restore();
}
/** 锥形的圆角肢（人形、DNA 链）：两端宽度 w0 / w1 */
export function limb(ctx, x0, y0, x1, y1, w0, w1, col = "gold", a = 1) {
  const p = P(col), ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang);
  ctx.fillStyle = rg(p.c, a);
  ctx.beginPath();
  ctx.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2);
  ctx.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2);
  ctx.arc(x1, y1, w1 / 2, ang + Math.PI / 2, ang - Math.PI / 2, true);
  ctx.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2);
  ctx.arc(x0, y0, w0 / 2, ang - Math.PI / 2, ang + Math.PI / 2, true);
  ctx.closePath(); ctx.fill();
}

/* ---------------- 星尘 ---------------- */
const starCache = new Map();
function starSet(seed, n) {
  const key = seed + ":" + n;
  let s = starCache.get(key);
  if (!s) {
    const r = rng(seed);
    s = Array.from({ length: n }, () => {
      const big = r() < 0.12, warm = r() < 0.22;
      return { x: r() * 1920, y: r() * 1080, z: 0.25 + r() * 0.75, s: big ? 1.6 + r() * 1.5 : 0.6 + r() * 0.9, ph: r() * 6.28, f: 0.5 + r() * 1.6, warm, big };
    });
    starCache.set(key, s);
  }
  return s;
}
/**
 * 星尘。D = 已漂移的距离（调用方用 integ 积出来，换速度时才不跳）。
 * dir：漂移方向，默认向左；vy：竖向漂移
 */
export function drawStars(ctx, t, D, { n = 150, seed = 3, a = 1, dirX = -1, dirY = 0, y0 = 0, y1 = 1080 } = {}) {
  const set = starSet(seed, n);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const s of set) {
    const x = mod(s.x + dirX * D * s.z, 1920), y = mod(s.y + dirY * D * s.z, 1080);
    if (y < y0 || y > y1) continue;
    const tw = 0.55 + 0.45 * Math.sin(t * s.f + s.ph), al = (0.28 + 0.6 * s.z) * tw * a;
    if (s.big) glow(ctx, x, y, s.s * 5.5, s.warm ? "gold" : "white", al * 0.7);
    ctx.fillStyle = s.warm ? `rgba(255,226,160,${al.toFixed(3)})` : `rgba(206,226,255,${al.toFixed(3)})`;
    ctx.beginPath(); ctx.arc(x, y, s.s, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}
/** 星云：几大团很淡的蓝青光（无紫），随时间极慢漂移 */
export function drawNebula(ctx, t, { a = 1, warm = 0 } = {}) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const blobs = [
    [420 + 60 * Math.sin(t * 0.07), 360 + 30 * Math.cos(t * 0.05), 560, [22, 84, 132], 0.2],
    [1480 + 70 * Math.cos(t * 0.06), 300 + 40 * Math.sin(t * 0.04), 620, [18, 70, 120], 0.18],
    [980 + 90 * Math.sin(t * 0.05 + 1), 820 + 30 * Math.cos(t * 0.06), 700, warm ? [120, 70, 20] : [16, 64, 96], 0.16],
  ];
  for (const [x, y, r, c, al] of blobs) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rg(c, al * a)); g.addColorStop(1, rg(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

/* ---------------- 迸散的火花 ---------------- */
/** 确定性的火花爆：τ = t − t0；每颗粒子带拖尾。 */
export function burst(ctx, x, y, tau, { n = 60, seed = 5, speed = 520, life = 1.1, col = "gold", size = 3, drag = 3.2, spread = 6.2832, dir = 0, a = 1 } = {}) {
  if (tau <= 0 || tau >= life) return;
  const r = rng(seed), u = tau / life;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) {
    const an = dir + (r() - 0.5) * spread, v = speed * (0.25 + 0.75 * r()), k = (1 - Math.exp(-drag * tau)) / drag;
    const px = x + Math.cos(an) * v * k, py = y + Math.sin(an) * v * k;
    const qx = x + Math.cos(an) * v * Math.max(0, (1 - Math.exp(-drag * (tau - 0.05))) / drag), qy = y + Math.sin(an) * v * Math.max(0, (1 - Math.exp(-drag * (tau - 0.05))) / drag);
    const al = (1 - u) ** 1.6 * a, sz = size * (0.5 + r()) * (1 - 0.5 * u);
    ctx.strokeStyle = rg(P(col).c, 0.5 * al); ctx.lineWidth = sz; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(px, py); ctx.stroke();
    glow(ctx, px, py, sz * 3.2, col, al * 0.9);
  }
  ctx.restore();
}

/* ---------------- 泛光 ---------------- */
let bloomA = null, bloomB = null;
/** 便宜的泛光：把已画好的画布缩到 1/4、1/8 再加色叠回去（双线性放大即模糊）。k = 强度。 */
export function bloom(cv, ctx, k = 0.5) {
  if (k <= 0.005) return;
  const W = cv.width, H = cv.height;
  const mk = (c, d) => {
    const w = Math.max(2, Math.round(W / d)), h = Math.max(2, Math.round(H / d));
    if (!c) c = document.createElement("canvas");
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return c;
  };
  bloomA = mk(bloomA, 4); bloomB = mk(bloomB, 10);
  const a = bloomA.getContext("2d"), b = bloomB.getContext("2d");
  a.setTransform(1, 0, 0, 1, 0, 0); a.globalCompositeOperation = "copy"; a.drawImage(cv, 0, 0, bloomA.width, bloomA.height);
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = "copy"; b.drawImage(bloomA, 0, 0, bloomB.width, bloomB.height);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.55 * k; ctx.drawImage(bloomA, 0, 0, W, H);
  ctx.globalAlpha = 0.9 * k; ctx.drawImage(bloomB, 0, 0, W, H);
  ctx.restore();
}

/* ---------------- 透视（把地面、DNA 放进空间里） ---------------- */
/**
 * 简易相机：世界 x 右、y 上、z 向屏幕里。相机在 (0, camY, camZ)，绕 x 轴俯仰 pitch（正 = 向下看）。
 * project(x,y,z) → [sx, sy, s]（s = 该点的缩放），点在相机后面时返回 null。
 */
export function makeProj({ f = 900, cx = 960, cy = 520, camX = 0, camY = 220, camZ = -600, pitch = 0.2, yaw = 0 } = {}) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cyw = Math.cos(yaw), syw = Math.sin(yaw);
  return (x, y, z) => {
    let X = x - camX, Y = y - camY, Z = z - camZ;
    const X2 = X * cyw - Z * syw, Z2 = X * syw + Z * cyw;
    const Y3 = Y * cp + Z2 * sp, Z3 = -Y * sp + Z2 * cp;
    if (Z3 < 20) return null;
    const s = f / Z3;
    return [cx + X2 * s, cy - Y3 * s, s];
  };
}

/* ---------------- 地面上的箭头（把 2D 箭头压扁，贴在透视地面上） ---------------- */
/** (sx,sy) 是尾的屏幕位置；dirLeft 为 true 时朝左。squash = 地面透视的纵向压缩（≈ camY / Z）。 */
export function groundArrow(ctx, sx, sy, lenPx, squash, { dirLeft = true, w = 6, col = "red", a = 1, glow: gl = 0.8 } = {}) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.scale(1, squash);
  arrow(ctx, 0, 0, dirLeft ? Math.PI : 0, lenPx, { w, col, a, glow: gl, head: 1.1 });
  ctx.restore();
}

/* ---------------- 侧视奔跑者 ---------------- */
const smooth = (x) => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
/** 两节腿的反向运动学：髋在原点，脚在 (fx,fy)（y 向下），膝盖朝前（+x） */
function ik(fx, fy, L) {
  let d = Math.hypot(fx, fy);
  const mx = Math.min(d, 2 * L * 0.999);
  const k = d > 0 ? mx / d : 1;
  fx *= k; fy *= k; d = mx;
  const h = Math.sqrt(Math.max(0, L * L - (d / 2) * (d / 2)));
  const nx = fy / (d || 1), ny = -fx / (d || 1);
  return { kx: fx / 2 + nx * h, ky: fy / 2 + ny * h, fx, fy };
}
/** 奔跑者的关节（单位：身高）。phase = 步态相位（弧度，2π 一个全步）；返回各点相对「脚下接触点」的坐标，y 向下为正。 */
export function runnerPose(phase, lean = 0.27) {
  const TWO = 6.2832, L1 = 0.245, hipH = 0.468 + 0.014 * Math.cos(2 * phase);
  const hip = [0, -hipH];
  const leg = (k) => {
    const psi = (((phase / TWO + 0.5 * k) % 1) + 1) % 1;
    let fx, fy;
    if (psi < 0.36) { const s = psi / 0.36; fx = 0.22 + (-0.27 - 0.22) * s; fy = hipH; }
    else { const s = (psi - 0.36) / 0.64; fx = -0.27 + (0.22 + 0.27) * smooth(s); fy = hipH - 0.27 * Math.pow(Math.sin(Math.PI * s), 0.85); }
    const r = ik(fx, fy, L1);
    return { knee: [hip[0] + r.kx, hip[1] + r.ky], foot: [hip[0] + r.fx, hip[1] + r.fy], psi };
  };
  const sl = Math.sin(lean), cl = Math.cos(lean);
  const neck = [hip[0] + 0.3 * sl, hip[1] - 0.3 * cl], shoulder = [hip[0] + 0.265 * sl, hip[1] - 0.265 * cl];
  const head = [neck[0] + 0.1 * Math.sin(lean + 0.06), neck[1] - 0.1 * Math.cos(lean + 0.06)];
  const arm = (k) => {
    const al = 0.95 * Math.sin(phase + Math.PI * (k === 0 ? 1 : 0)), be = al + 1.5 + 0.18 * Math.cos(phase);
    const elbow = [shoulder[0] + 0.17 * Math.sin(al), shoulder[1] + 0.17 * Math.cos(al)];
    const hand = [elbow[0] + 0.16 * Math.sin(be), elbow[1] + 0.16 * Math.cos(be)];
    return { elbow, hand };
  };
  return { hip, neck, shoulder, head, legs: [leg(0), leg(1)], arms: [arm(0), arm(1)] };
}
/**
 * 画奔跑者（发光的锥形肢体 + 白热的芯）。(fx,fy) = 脚下地面接触点，u = 身高 px，flipY = −1 时画镜像（倒影）。
 * 远侧的手脚压暗一半，给点纵深。
 */
export function drawRunner(ctx, fx, fy, u, phase, { col = "gold", a = 1, lean = 0.27, flipY = 1 } = {}) {
  if (a <= 0.004) return;
  const P2 = runnerPose(phase, lean), p = P(col);
  const X = (pt) => fx + pt[0] * u, Y = (pt) => fy + flipY * pt[1] * u;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const seg = (A, Bp, w0, w1, al) => {
    for (const [k, c, aa] of [[2.4, p.c, 0.07], [1, p.c, 0.78], [0.4, p.core, 0.95]]) {
      ctx.fillStyle = rg(c, aa * al * a);
      const x0 = X(A), y0 = Y(A), x1 = X(Bp), y1 = Y(Bp);
      const ang = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(ang), ny = Math.cos(ang), r0 = w0 * u * k / 2, r1 = w1 * u * k / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + nx * r0, y0 + ny * r0); ctx.lineTo(x1 + nx * r1, y1 + ny * r1);
      ctx.arc(x1, y1, r1, ang + Math.PI / 2, ang - Math.PI / 2, true);
      ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
      ctx.arc(x0, y0, r0, ang - Math.PI / 2, ang + Math.PI / 2, true);
      ctx.closePath(); ctx.fill();
    }
  };
  const drawLeg = (lg, al) => {
    seg(P2.hip, lg.knee, 0.054, 0.04, al);
    seg(lg.knee, lg.foot, 0.04, 0.028, al);
    const toe = [lg.foot[0] + 0.08, lg.foot[1] - (lg.psi > 0.36 ? 0.025 : 0)];
    seg(lg.foot, toe, 0.028, 0.02, al);
  };
  const drawArm = (ar, al) => { seg(P2.shoulder, ar.elbow, 0.036, 0.028, al); seg(ar.elbow, ar.hand, 0.028, 0.022, al); };
  drawArm(P2.arms[1], 0.5);
  drawLeg(P2.legs[1], 0.5);
  seg(P2.hip, P2.neck, 0.07, 0.054, 1);
  drawLeg(P2.legs[0], 1);
  drawArm(P2.arms[0], 1);
  // 头
  const hx = X(P2.head), hy = Y(P2.head), hr = 0.056 * u;
  ctx.fillStyle = rg(p.c, 0.35 * a); ctx.beginPath(); ctx.arc(hx, hy, hr * 1.5, 0, 6.2832); ctx.fill();
  ctx.fillStyle = rg(p.c, 0.9 * a); ctx.beginPath(); ctx.arc(hx, hy, hr, 0, 6.2832); ctx.fill();
  ctx.fillStyle = rg(p.core, 0.95 * a); ctx.beginPath(); ctx.arc(hx, hy, hr * 0.55, 0, 6.2832); ctx.fill();
  // 周身的光
  glow(ctx, X(P2.hip), (Y(P2.hip) + Y(P2.neck)) / 2, u * 0.5, col, 0.1 * a);
  ctx.restore();
}

/* ---------------- 渐隐的倒影（镜面） ---------------- */
let reflC = null;
/** 在 (fx,fy) 脚下画奔跑者的倒影：先画进离屏，再用纵向渐变做遮罩，最后以加色叠回主画布。w×h 单位是用户空间的 px。 */
export function drawReflection(ctx, dpr, fx, fy, u, phase, { a = 1, w = 560, h = 380 } = {}) {
  if (a <= 0.004) return;
  const W = Math.round(w * dpr), H = Math.round(h * dpr);
  if (!reflC) reflC = document.createElement("canvas");
  if (reflC.width !== W || reflC.height !== H) { reflC.width = W; reflC.height = H; }
  const g = reflC.getContext("2d");
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRunner(g, w / 2, 0, u, phase, { a: 1, flipY: -1 });
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "destination-in";
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, "rgba(0,0,0,0.9)"); gr.addColorStop(0.45, "rgba(0,0,0,0.3)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a;
  ctx.drawImage(reflC, fx - w / 2, fy, w, h);
  ctx.restore();
}

/* ---------------- 虚化光斑（景深里慢慢飘的大光点）---------------- */
const bokehCache = new Map();
/** 一层很淡的大光斑：给暗底补上「一直在动」的纵深。D = 世界漂移距离（与星尘共用，换速度时一起变）。 */
export function drawBokeh(ctx, t, D, { n = 30, seed = 21, a = 1 } = {}) {
  let set = bokehCache.get(seed + ":" + n);
  if (!set) {
    const r = rng(seed);
    set = Array.from({ length: n }, () => {
      const k = r();
      return { x: r() * 2200, y: r() * 1200, z: 0.3 + 0.7 * r(), size: 18 + 56 * r() ** 1.4, vx: -(6 + 22 * r()), vy: -6 + 14 * r(), ph: r() * 6.28, col: k < 0.42 ? "gold" : k < 0.8 ? "cyan" : "blue", al: 0.04 + 0.06 * r() };
    });
    bokehCache.set(seed + ":" + n, set);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const b of set) {
    const W = 1920 + 2 * b.size, H = 1080 + 2 * b.size;
    const x = mod(b.x + b.vx * t - D * b.z * 0.55, W) - b.size, y = mod(b.y + b.vy * t, H) - b.size;
    glow(ctx, x, y, b.size, b.col, b.al * (0.6 + 0.4 * Math.sin(t * 0.55 + b.ph)) * a);
  }
  ctx.restore();
}

/** 矩形周长上的一点：p ∈ [0, 周长)，顺时针。给「沿卡片边缘巡游的光点」用。 */
export function perimPoint(x, y, w, h, p) {
  const P = 2 * (w + h); p = ((p % P) + P) % P;
  if (p < w) return [x + p, y];
  p -= w; if (p < h) return [x + w, y + p];
  p -= h; if (p < w) return [x + w - p, y + h];
  p -= w; return [x, y + h - p];
}
