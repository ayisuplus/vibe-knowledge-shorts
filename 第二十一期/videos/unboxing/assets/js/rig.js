// 本片的道具和笔触。每个函数只按传入的状态画当前这一帧，不记时间、不建 DOM。
import { clamp, mix, mixP, hash } from "./lib.js";

export const C = {
  amber: "#ffb347", amberHi: "#ffcf8a", core: "#fffbe9",
  chalk: "#f2eee4", chalkDim: "#bdb6a8", hand: "#ffc58a",
  kraft: "#c69255", kraftD: "#8e6232", kraftS: "#6d4a24", kraftTop: "#d3a467", tape: "#e3cc9c",
  paper: "#efe5cf", ink: "#2c2417", text: "#f4eee4", grey: "#8e98a6", greyD: "#4a5566",
  screen: "#101a28", phone: "#0b0f16",
};

export function group(ctx, a, fn) { if (a <= .002) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
export function rr(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
export function poly(ctx, pts, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.moveTo(...pts[0]); for (const p of pts.slice(1)) ctx.lineTo(...p); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
const FONT = { sans: "NotoSC", serif: "NotoSerifSC", hand: "WenKai" };
export function text(ctx, str, x, y, size = 40, color = C.text, o = {}) {
  ctx.save(); ctx.fillStyle = color;
  ctx.font = `${o.weight || 700} ${size}px ${FONT[o.font || "sans"]}`;
  ctx.textAlign = o.align || "left"; ctx.textBaseline = o.baseline || "middle";
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = 14; }
  ctx.fillText(str, x, y); ctx.restore();
}
/** 手写字：p∈[0,1] 逐字写出，最后一个字淡入 */
export function hand(ctx, str, x, y, size, color, p = 1, o = {}) {
  const chars = Array.from(str), k = clamp(p) * chars.length, n = Math.floor(k);
  if (k <= 0) return;
  ctx.save(); ctx.font = `${size}px WenKai`; ctx.textBaseline = "middle"; ctx.fillStyle = color;
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  let cx = o.align === "center" ? -ctx.measureText(str).width / 2 : 0;
  chars.forEach((ch, i) => {
    if (i > n) return; ctx.globalAlpha = i < n ? 1 : k - n;
    ctx.fillText(ch, cx, (hash(i * 7 + str.length) - .5) * size * .06); cx += ctx.measureText(ch).width;
  });
  ctx.restore();
}

// ── 「想要」的光：全片唯一主角，颜色恒定 ──
export function orb(ctx, x, y, r, k = 1) {
  if (k <= .002 || r <= .5) return;
  ctx.save();
  let g = ctx.createRadialGradient(x, y, 0, x, y, r * 4.4);
  g.addColorStop(0, `rgba(255,179,71,${.5 * k})`); g.addColorStop(1, "rgba(255,179,71,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4.4, 0, Math.PI * 2); ctx.fill();
  g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
  g.addColorStop(0, `rgba(255,251,233,${k})`); g.addColorStop(.35, `rgba(255,216,144,${k})`); g.addColorStop(1, "rgba(255,179,71,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,253,244,${k})`; ctx.beginPath(); ctx.arc(x, y, r * .42, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
/** 光点拖出的轨迹：沿 f(u) 从 u0 到 u1 撒一串渐隐圆点 */
export function trail(ctx, f, u0, u1, n = 12, rMax = 8, k = 1) {
  if (u1 <= u0 || k <= .002) return;
  ctx.save(); ctx.fillStyle = C.amber;
  for (let i = 0; i < n; i++) {
    const s = i / n, [x, y] = f(mix(u0, u1, s));
    ctx.globalAlpha = k * (.1 + .6 * s); ctx.beginPath(); ctx.arc(x, y, rMax * (.35 + .65 * s), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
/** 柔光圈（台灯光池、物件自发光） */
export function glow(ctx, x, y, rx, ry, color, a) {
  if (a <= .002) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color.replace("A", a.toFixed(3))); g.addColorStop(1, color.replace("A", "0"));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}

// ── 粉笔线：按弧长写到 p，叠一层错位细线做出粉笔的颗粒感 ──
function cut(pts, p) {
  if (p >= 1) return pts;
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let want = clamp(p) * L; const out = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (want >= seg[i]) { out.push(pts[i + 1]); want -= seg[i]; continue; }
    out.push(mixP(pts[i], pts[i + 1], seg[i] ? want / seg[i] : 0)); break;
  }
  return out;
}
export function chalk(ctx, pts, p = 1, color = C.chalk, w = 5, seed = 1) {
  if (p <= 0 || pts.length < 2) return;
  const q = cut(pts, p); if (q.length < 2) return;
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = color;
  const path = (dx, dy, jit) => { ctx.beginPath(); q.forEach(([x, y], i) => { const j = jit * (hash(seed * 31 + i) - .5); i ? ctx.lineTo(x + dx + j, y + dy + j) : ctx.moveTo(x + dx, y + dy); }); ctx.stroke(); };
  ctx.globalAlpha *= .92; ctx.lineWidth = w; path(0, 0, w * .35);
  ctx.globalAlpha *= .4; ctx.lineWidth = w * .45; path(w * .3, -w * .25, w * .8);
  ctx.restore();
}
export function chalkArrow(ctx, pts, p, color = C.hand, w = 4, seed = 3) {
  chalk(ctx, pts, p, color, w, seed);
  if (p < .95) return;
  const a = pts[pts.length - 1], b = pts[pts.length - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]), r = 20;
  chalk(ctx, [[a[0] - r * Math.cos(ang - .5), a[1] - r * Math.sin(ang - .5)], a, [a[0] - r * Math.cos(ang + .5), a[1] - r * Math.sin(ang + .5)]], 1, color, w, seed + 1);
}

// ── 手机：物流页 ──
// st = { rows:[{label, sub, tone:"hot"|"done"|"grey", glow}], pull, spin, a }
export function phone(ctx, x, y, rot, st) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const W = 360, H = 610;
  ctx.shadowColor = "#000d"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rr(ctx, -W / 2, -H / 2, W, H, 46, C.phone, "#2e3a4c", 3); ctx.shadowColor = "transparent";
  rr(ctx, -W / 2 + 18, -H / 2 + 20, W - 36, H - 40, 32, C.screen);
  ctx.save(); ctx.beginPath(); ctx.roundRect(-W / 2 + 18, -H / 2 + 20, W - 36, H - 40, 32); ctx.clip();
  // 屏幕自己的微光
  const sg = ctx.createLinearGradient(0, -H / 2, 0, H / 2); sg.addColorStop(0, "#1a2638"); sg.addColorStop(1, "#0d131e");
  ctx.fillStyle = sg; ctx.fillRect(-W / 2, -H / 2, W, H);
  text(ctx, "物流详情", -W / 2 + 44, -H / 2 + 74, 34, "#e7edf5", { weight: 800 });
  const top = -H / 2 + 150 + (st.pull || 0) * 46;
  if (st.spin > .01) { // 下拉刷新的转圈
    ctx.save(); ctx.globalAlpha = st.spin; ctx.strokeStyle = "#8ea4bd"; ctx.lineWidth = 4; ctx.lineCap = "round";
    const a0 = (st.spinA || 0); ctx.beginPath(); ctx.arc(0, -H / 2 + 118, 13, a0, a0 + 4.2); ctx.stroke(); ctx.restore();
  }
  const rows = st.rows || [], gap = 104;
  ctx.strokeStyle = "#2c3a4e"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-W / 2 + 62, top + 8); ctx.lineTo(-W / 2 + 62, top + gap * (rows.length - 1) + 8); ctx.stroke();
  rows.forEach((r, i) => {
    const yy = top + i * gap + (r.dy || 0), a = r.a ?? 1;
    group(ctx, a, () => {
      const col = r.tone === "hot" ? C.amberHi : r.tone === "grey" ? "#8e98a6" : "#c4ccd6";
      const dot = r.tone === "hot" ? C.amber : r.tone === "grey" ? C.greyD : "#8995a5";
      if (r.tone === "hot" && r.glow) glow(ctx, -W / 2 + 62, yy + 8, 46, 46, "rgba(255,179,71,A)", .55 * r.glow);
      ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(-W / 2 + 62, yy + 8, r.tone === "hot" ? 11 : 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, r.label, -W / 2 + 96, yy, 36, col, { weight: r.tone === "hot" ? 800 : 600 });
      if (r.sub) text(ctx, r.sub, -W / 2 + 98, yy + 44, 26, col, { weight: 500 });
    });
  });
  ctx.restore(); ctx.restore();
}

// ── 纸箱：open∈[0,1] 翻盖，tape∈[0,1] 胶带撕开的进度。以 (1090,600) 为原点的样张坐标 ──
const B0 = [1090, 600];
const BOX = {
  hole: [[1000, 500], [1300, 500], [1240, 540], [940, 540]],
  front: [[940, 540], [1240, 540], [1250, 722], [930, 722]],
  side: [[1240, 540], [1300, 500], [1306, 676], [1250, 722]],
  L: { h: [[940, 540], [1000, 500]], open: [[905, 452], [842, 494]], shut: [[1150, 500], [1090, 540]] },
  R: { h: [[1240, 540], [1300, 500]], open: [[1388, 548], [1330, 592]], shut: [[1150, 500], [1090, 540]] },
  K: { h: [[1000, 500], [1300, 500]], open: [[1318, 418], [1018, 418]], shut: [[1270, 540], [970, 540]] },
  F: { h: [[940, 540], [1240, 540]], open: [[1220, 600], [924, 600]], shut: [[1270, 500], [970, 500]] },
};
export function box(ctx, x, y, s, open = 0, tape = 0, alpha = 1) {
  group(ctx, alpha, () => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-B0[0], -B0[1]);
    glow(ctx, 1090, 728, 260, 30, "rgba(0,0,0,A)", .7);
    const flap = (f, k, fill) => poly(ctx, [f.h[0], f.h[1], mixP(f.shut[0], f.open[0], k), mixP(f.shut[1], f.open[1], k)], fill);
    const kLR = clamp(open / .6), kFB = clamp((open - .3) / .7);
    poly(ctx, BOX.hole, "#120b05");
    if (kFB > 0) { flap(BOX.K, kFB, "#9b6c38"); }
    const fg = ctx.createLinearGradient(0, 540, 0, 722); fg.addColorStop(0, C.kraft); fg.addColorStop(1, C.kraftD);
    poly(ctx, BOX.front, fg);
    const sgr = ctx.createLinearGradient(1240, 0, 1306, 0); sgr.addColorStop(0, "#7e552a"); sgr.addColorStop(1, "#5c3c1c");
    poly(ctx, BOX.side, sgr);
    rr(ctx, 1077, 540, 26, 182, 0, "rgba(227,204,156,.42)");
    if (kFB > 0) flap(BOX.F, kFB, "rgba(201,154,96,.6)");
    flap(BOX.L, kLR, "#b07d44"); flap(BOX.R, kLR, "#a87640");
    if (kLR < .05) { // 封箱胶带：沿合缝；撕开时从前往后缩短
      const a = [1090, 540], b = [1150, 500], k = clamp(1 - tape);
      if (k > 0) { ctx.strokeStyle = C.tape; ctx.lineWidth = 22; ctx.lineCap = "butt"; ctx.beginPath(); ctx.moveTo(...mixP(b, a, k)); ctx.lineTo(...b); ctx.stroke(); }
    }
    ctx.restore();
  });
}
/** 箱子里拿出来的东西：一台小相机（不出现任何品牌） */
export function item(ctx, x, y, s = 1, shine = 0, alpha = 1) {
  group(ctx, alpha, () => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    glow(ctx, 0, 0, 170, 120, "rgba(255,207,138,A)", .35 * shine);
    ctx.shadowColor = "#000b"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 16;
    rr(ctx, -40, -76, 62, 24, 6, "#2f333d");
    rr(ctx, -96, -58, 192, 120, 18, "#2a2e38", "#4b5260", 3); ctx.shadowColor = "transparent";
    rr(ctx, -96, -14, 192, 6, 0, "#20232b");
    ctx.fillStyle = "#151820"; ctx.beginPath(); ctx.arc(10, 4, 44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8d95a5"; ctx.lineWidth = 6; ctx.stroke();
    ctx.fillStyle = "#2c4c6a"; ctx.beginPath(); ctx.arc(10, 4, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#cfe3ff"; ctx.globalAlpha *= .7; ctx.beginPath(); ctx.arc(1, -6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = C.amberHi; ctx.beginPath(); ctx.arc(-70, -34, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}
/** 从画面右侧滑出来的木抽屉（略俯视：上面看得见内膛，前面是抽屉面板）。open∈[0,1] */
export function drawer(ctx, open) {
  if (open <= .002) return;
  const x = mix(2060, 1460, open), y = 560, w = 360;
  ctx.save();
  ctx.shadowColor = "#000c"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  poly(ctx, [[x, y], [x + w, y], [x + w + 30, y - 46], [x + 30, y - 46]], "#5a4030");
  ctx.shadowColor = "transparent";
  poly(ctx, [[x + 14, y - 4], [x + w - 10, y - 4], [x + w + 18, y - 40], [x + 40, y - 40]], "#1a120c");
  const g = ctx.createLinearGradient(0, y, 0, y + 130); g.addColorStop(0, "#8a6244"); g.addColorStop(1, "#5c3f2a");
  rr(ctx, x, y, w, 130, 6, g, "#a07a58", 3);
  rr(ctx, x + w / 2 - 50, y + 56, 100, 16, 8, "#d9b78a");
  ctx.restore();
}

// ── 粉笔小道具（S2 实验图） ──
export function bulbPts(x, y, r) {
  const pts = [];
  for (let i = 0; i <= 40; i++) { const a = Math.PI * .75 + i / 40 * Math.PI * 1.5; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
  return pts.concat([[x + r * .55, y + r * 1.25], [x - r * .55, y + r * 1.25], [x - r * Math.cos(Math.PI * .25), y + r * Math.sin(Math.PI * .25)]]);
}
