// 纯函数工具：缓动、窗口、散列。
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a, b, p) => a + (b - a) * p;
export const mixV = (a, b, p) => a.map((v, i) => mix(v, b[i], p));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 4; };
export const easeIn = (x) => { x = clamp(x); return x * x * x; };
/** 机械动作：先猛冲，过头一点再顶回去 */
export const clunk = (n, a, d) => { const u = clamp((n - a) / d), c = 2.2; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
export const win = (n, a, b) => n >= a && n < b;
export const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** 飞回：n 到 a 时开始，越飞越快，1 → 0 */
export const back = (n, a, d) => 1 - easeIn((n - a) / d);
/** 指数插值，用于连续放大 */
export const expMix = (a, b, p) => Math.exp(mix(Math.log(a), Math.log(b), p));
