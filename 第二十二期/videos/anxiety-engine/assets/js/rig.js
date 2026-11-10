// 本片的道具和笔触：旧报纸、报警器、价签、印章、齿轮。每个函数只按传入的状态画当前这一帧，不记时间、不建 DOM。
import { clamp, ease, mix, hash, bump } from "./lib.js";

export const C = {
  paper: "#efe2c3", paper2: "#d3bf93", ink: "#20180b", inkSoft: "#5c4522", bar: "#6a5530",
  cinnabar: "#a81f14", red: "#ff3b30", redHi: "#ff6a5e", cream: "#f4ead2", creamDim: "#c8b78f",
  green: "#1d5a3b", gold: "#ffc24d", metal: "#2b241a", metalLine: "#d9c8a0",
};

export function group(ctx, a, fn) { if (a <= .002) return; ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
/** 把原点移到 (x, y) 再画，带旋转和缩放 */
export function at(ctx, x, y, rot, s, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
export function rr(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
const FONT = { sans: "NotoSC", serif: "NotoSerifSC", hand: "WenKai" };
export function text(ctx, str, x, y, size = 40, color = C.ink, o = {}) {
  ctx.save(); ctx.fillStyle = color;
  ctx.font = `${o.italic ? "italic " : ""}${o.weight || 800} ${size}px ${FONT[o.font || "serif"]}`;
  ctx.textAlign = o.align || "center"; ctx.textBaseline = "middle";
  if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.blur || 22; }
  ctx.fillText(str, x, y); ctx.restore();
}
export function glow(ctx, x, y, rx, ry, color, a) {
  if (a <= .002) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color.replace("A", a)); g.addColorStop(1, color.replace("A", 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
/** 一张旧报纸（以中心定位）：渐变纸面、双线边框、投影 */
export function paper(ctx, w, h, o = {}) {
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,.75)"; ctx.shadowBlur = 54; ctx.shadowOffsetY = 26;
  const g = ctx.createLinearGradient(-w * .1, -h / 2, w * .1, h / 2);
  g.addColorStop(0, C.paper); g.addColorStop(1, C.paper2);
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
  // 几道极淡的纸纹，不密
  ctx.strokeStyle = "rgba(92,69,34,.07)"; ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { const y = -h / 2 + (i + .7) * h / 5.2 + 5 * hash(i + w); ctx.beginPath(); ctx.moveTo(-w / 2 + 20, y); ctx.lineTo(w / 2 - 20, y + 3 * hash(i)); ctx.stroke(); }
}
/** 正文用粗色条代替小字 */
export function bars(ctx, x, y, widths, gap = 44, h = 15, color = C.bar) {
  ctx.fillStyle = color;
  widths.forEach((w, i) => { ctx.beginPath(); ctx.roundRect(x, y + i * gap, w, h, h / 2); ctx.fill(); });
}
// ── 全片主角：报警器。lit∈[0,1] 灯的亮度，wave∈[0,1] 声波强度，pulse 让声波往外走 ──
export function alarm(ctx, x, y, r, { lit = 1, wave = 0, pulse = 0 } = {}) {
  ctx.save(); ctx.translate(x, y);
  if (lit > .01) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 3.3);
    g.addColorStop(0, `rgba(255,59,48,${.6 * lit})`); g.addColorStop(.45, `rgba(255,59,48,${.15 * lit})`); g.addColorStop(1, "rgba(255,59,48,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 3.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.beginPath(); ctx.ellipse(0, r * .14, r * 1.04, r * 1.02, 0, 0, Math.PI * 2); ctx.fill();
  const c = ctx.createLinearGradient(0, -r, 0, r); c.addColorStop(0, "#efe2c3"); c.addColorStop(1, "#c4af82");
  ctx.fillStyle = c; ctx.strokeStyle = "#4a3618"; ctx.lineWidth = Math.max(3, r * .04);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = Math.max(2, r * .03); ctx.beginPath(); ctx.arc(0, 0, r * .74, 0, Math.PI * 2); ctx.stroke();
  // 进烟口：几道粗弧，不做密集小孔
  ctx.lineCap = "round"; ctx.lineWidth = r * .09; ctx.globalAlpha *= .8;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + .26; ctx.beginPath(); ctx.arc(0, 0, r * .87, a, a + .62); ctx.stroke(); }
  ctx.globalAlpha /= .8;
  // 灯
  const off = "#5a2019", on = C.red;
  ctx.fillStyle = lit > .5 ? on : off; ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, Math.PI * 2); ctx.fill();
  const l = ctx.createRadialGradient(0, 0, 0, 0, 0, r * .28);
  l.addColorStop(0, `rgba(255,244,239,${lit})`); l.addColorStop(.35, `rgba(255,138,124,${lit})`); l.addColorStop(1, `rgba(255,59,48,${lit})`);
  ctx.fillStyle = l; ctx.beginPath(); ctx.arc(0, 0, r * .28, 0, Math.PI * 2); ctx.fill();
  // 声波：三道大弧，往外走
  if (wave > .01) {
    ctx.strokeStyle = C.red; ctx.lineWidth = Math.max(5, r * .06);
    for (let k = 0; k < 3; k++) {
      const u = (k + pulse % 1) / 3, R = r * mix(1.22, 2.0, u), alpha = wave * (1 - u) * .9;
      ctx.save(); ctx.globalAlpha *= alpha;
      for (const [a0, a1] of [[-.62, .62], [Math.PI - .62, Math.PI + .62]]) { ctx.beginPath(); ctx.arc(0, 0, R, a0, a1); ctx.stroke(); }
      ctx.restore();
    }
  }
  ctx.restore();
}
/** 朱红价签。flip∈[0,1]：0 正面（限时课程），1 背面（免费），中途水平压扁 */
export function priceTag(ctx, x, y, s, rot, flip = 0, o = {}) {
  const sx = Math.abs(Math.cos(flip * Math.PI)), back = flip > .5, w = 430, h = 232;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * Math.max(.02, sx), s);
  ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
  ctx.fillStyle = back ? "#f2e8cf" : C.cinnabar;
  ctx.beginPath(); ctx.moveTo(-w / 2 + 70, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2 + 70, h / 2); ctx.lineTo(-w / 2, 0); ctx.closePath(); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.fillStyle = back ? C.paper2 : "#efe2c3"; ctx.beginPath(); ctx.arc(-w / 2 + 44, 0, 15, 0, Math.PI * 2); ctx.fill();
  if (back) text(ctx, "免费", 34, 0, 110, C.green);
  else { text(ctx, o.a || "限时课程", 34, -42, 46, "#fff3dc"); text(ctx, o.b || "¥ ???", 34, 38, 68, "#fff3dc"); }
  ctx.restore();
}
/** 朱印：p∈[0,1] 从大落到小，落定后轻微墨色 */
export function stamp(ctx, x, y, str, p, o = {}) {
  if (p <= 0) return;
  const size = o.size || 62, color = o.color || C.cinnabar, k = mix(1.9, 1, ease(p));
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -.05); ctx.scale(k, k); ctx.globalAlpha *= clamp(p * 2.4);
  ctx.font = `900 ${size}px NotoSerifSC`;
  const w = Math.max(ctx.measureText(str).width + size * .9, size * 2), h = size * 1.7;
  ctx.strokeStyle = color; ctx.lineWidth = size * .09; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(str, 0, 2);
  ctx.restore();
}
/** 朱笔圈：画一个椭圆，p∈[0,1] 写到哪算哪 */
export function penRing(ctx, x, y, rx, ry, p, color = C.cinnabar, lw = 7) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, -.04, -2.2, -2.2 + Math.PI * 2.08 * clamp(p)); ctx.stroke(); ctx.restore();
}
export function penLine(ctx, x0, y0, x1, y1, p, color = C.cinnabar, lw = 12) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(mix(x0, x1, clamp(p)), mix(y0, y1, clamp(p))); ctx.stroke(); ctx.restore();
}
/** 版画齿轮：描边、几道放射排线、中央标签正立不转 */
export function gear(ctx, x, y, r, teeth, ang, o = {}) {
  const line = o.line || C.metalLine;
  ctx.save(); ctx.translate(x, y); ctx.save(); ctx.rotate(ang);
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2, d = Math.PI / teeth, R = r, q = r * .84;
    for (const [rad, th] of [[q, a - d * .95], [q, a - d * .5], [R, a - d * .36], [R, a + d * .36], [q, a + d * .5]]) {
      const px = rad * Math.cos(th), py = rad * Math.sin(th);
      if (i === 0 && th === a - d * .95) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
  }
  ctx.closePath(); ctx.fillStyle = o.fill || C.metal; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = o.lw || 4; ctx.stroke();
  ctx.lineWidth = 2; ctx.globalAlpha *= .4;
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(r * .46 * Math.cos(a), r * .46 * Math.sin(a)); ctx.lineTo(r * .76 * Math.cos(a), r * .76 * Math.sin(a)); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = o.hub || "#191510"; ctx.strokeStyle = line; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * .44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (o.label) text(ctx, o.label, 0, 2, o.size || r * .3, o.color || C.cream);
  ctx.restore();
}
/** 没有标签的漱口水瓶（版画）：不出现任何品牌 */
export function bottle(ctx, x, y, s) {
  at(ctx, x, y, 0, s, () => {
    ctx.fillStyle = "#b9a678"; ctx.strokeStyle = C.ink; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-26, -170); ctx.lineTo(26, -170); ctx.lineTo(26, -112); ctx.bezierCurveTo(26, -78, 74, -70, 74, -30); ctx.lineTo(74, 138); ctx.quadraticCurveTo(74, 160, 52, 160); ctx.lineTo(-52, 160); ctx.quadraticCurveTo(-74, 160, -74, 138); ctx.lineTo(-74, -30); ctx.bezierCurveTo(-74, -70, -26, -78, -26, -112); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.fillRect(-33, -206, 66, 40);
    ctx.fillStyle = "#efe2c3"; ctx.fillRect(-56, -6, 112, 96); ctx.strokeRect(-56, -6, 112, 96);
    ctx.lineWidth = 3; ctx.globalAlpha *= .55;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(52, -38 + i * 8); ctx.lineTo(66, -40 + i * 42); ctx.stroke(); }
  });
}
/** 剪影版画（一个人的上半身），turn∈[0,1] 转身离开时变窄 */
export function figure(ctx, x, y, s, color = C.ink) {
  at(ctx, x, y, 0, s, () => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(0, -96, 44, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-84, 120); ctx.bezierCurveTo(-92, 0, -58, -44, 0, -44); ctx.bezierCurveTo(58, -44, 92, 0, 84, 120); ctx.closePath(); ctx.fill();
  });
}
/** 火焰：几条缓慢摆动的大色块 */
export function flame(ctx, x, y, w, h, t) {
  for (let k = 0; k < 3; k++) {
    const sc = 1 - k * .28, col = ["#c9321b", "#ee6a1f", "#ffc24d"][k];
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w * sc / 2, y);
    for (let i = 0; i <= 8; i++) {
      const u = i / 8, xx = x - w * sc / 2 + w * sc * u, peak = Math.sin(u * Math.PI);
      const wob = Math.sin(t * 4.1 + u * 9 + k * 2) * .12 + Math.sin(t * 6.3 + u * 17 + k) * .06;
      ctx.lineTo(xx, y - h * sc * peak * (.72 + wob + (i % 2 ? .22 : 0)));
    }
    ctx.lineTo(x + w * sc / 2, y); ctx.closePath(); ctx.fill();
  }
}
/** 拼图块：side = -1 左块（右边带凸），side = 1 右块（左边带凹） */
export function puzzle(ctx, x, y, w, h, side, fill, label, labelColor) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  if (side < 0) { ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, -46); ctx.arc(w / 2, 0, 46, -Math.PI / 2, Math.PI / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); }
  else { ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.lineTo(-w / 2, 46); ctx.arc(-w / 2, 0, 46, Math.PI / 2, -Math.PI / 2, true); }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.stroke();
  text(ctx, label, side < 0 ? -10 : 18, 2, 66, labelColor || C.ink);
  ctx.restore();
}
/** 天平。tilt>0 表示右边沉 */
export function balance(ctx, x, y, w, tilt, left, right) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = C.ink; ctx.fillStyle = C.ink; ctx.lineWidth = 10; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(0, 300); ctx.moveTo(-120, 300); ctx.lineTo(120, 300); ctx.stroke();
  const dx = w / 2 * Math.cos(tilt), dy = w / 2 * Math.sin(tilt);
  ctx.beginPath(); ctx.moveTo(-dx, -dy); ctx.lineTo(dx, dy); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -10, 16, 0, Math.PI * 2); ctx.fill();
  for (const [px, py, label, size, col] of [[-dx, -dy, left, 60, C.ink], [dx, dy, right, 72, C.cinnabar]]) {
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 110, py + 120); ctx.moveTo(px, py); ctx.lineTo(px + 110, py + 120); ctx.stroke();
    ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(px - 136, py + 122); ctx.quadraticCurveTo(px, py + 172, px + 136, py + 122); ctx.stroke();
    ctx.fillStyle = "#e6d6b0"; ctx.fillRect(px - size * .95, py + 82 - size * .6, size * 1.9, size * 1.2);
    text(ctx, label, px, py + 82, size, col);
  }
  ctx.restore();
}
export { bump };
