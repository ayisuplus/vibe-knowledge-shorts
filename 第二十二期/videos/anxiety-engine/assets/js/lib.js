// 无累积状态；所有入场、离场和插值都由时间直接算出。
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 3; };
export const easeIn = (x) => { x = clamp(x); return x * x * x; };
export const mix = (a, b, p) => a + (b - a) * p;
export const mixP = (p, q, k) => [mix(p[0], q[0], k), mix(p[1], q[1], k)];
/** 从 start 开始、历时 dur 的 0→1（单位随调用方：秒或拍） */
export const ramp = (t, start, dur = .6) => ease((t - start) / dur);
/** a 进、b 出的窗口，两头各 fade 渐变 */
export const windowed = (t, a, b, fade = .42) => ramp(t, a, fade) * (1 - ramp(t, b - fade, fade));
/** 落地回弹（只看当前进度） */
export const bounce = (x) => { x = clamp(x); return x < .7 ? easeIn(x / .7) : 1 - .08 * Math.sin((x - .7) / .3 * Math.PI); };
/** 单次脉冲：x∈[0,1] 内 0→1→0 */
export const bump = (x) => (x <= 0 || x >= 1) ? 0 : Math.sin(Math.PI * x);
/** 确定性伪随机（同一个种子永远同一个值） */
export const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** 三次贝塞尔采样成折线 */
export function bez(p0, p1, p2, p3, n = 32) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, v = 1 - u;
    out.push([v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
              v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]);
  }
  return out;
}
export function ellipsePts(cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = mix(a0, a1, i / n); out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
  return out;
}
/** 折线上按弧长取点（u∈[0,1]） */
export function along(pts, u) {
  let L = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
  let want = clamp(u) * L;
  for (let i = 0; i < seg.length; i++) {
    if (want <= seg[i] || i === seg.length - 1) { const k = seg[i] ? clamp(want / seg[i]) : 0; return mixP(pts[i], pts[i + 1], k); }
    want -= seg[i];
  }
  return pts[pts.length - 1];
}
