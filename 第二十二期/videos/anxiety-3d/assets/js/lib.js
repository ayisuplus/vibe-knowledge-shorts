// 无累积状态；所有入场、离场和插值都由时间直接算出。
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a, b, p) => a + (b - a) * p;
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 4; };
export const easeIn = (x) => { x = clamp(x); return x * x * x; };
export const ramp = (n, a, d) => ease((n - a) / d);
export const win = (n, a, b) => n >= a && n < b;
export const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** 落下：从 big 倍猛地缩到 1 */
export const slam = (n, at, big = 2.6, d = .32) => mix(big, 1, easeOut((n - at) / d));
/** 每拍衰减一次 */
export const beat = (n, r = 3.4) => Math.exp(-(((n % 1) + 1) % 1) * r);
/** 单次脉冲 */
export const after = (n, at, r = 6) => (n >= at ? Math.exp(-(n - at) * r) : 0);
/** 从 from 到 n 对速度积分（固定步长，结果只取决于 n） */
export function integ(f, n, from = 0, dn = .1) { let s = 0; for (let x = from; x < n; x += dn) s += f(x) * Math.min(dn, n - x); return s; }
