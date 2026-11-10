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
/** 从速度积分出路程：∫₀ᵗ f(s) ds（Simpson，步数固定，纯函数） */
export const integ = (f, t, n = 240) => { if (t <= 0) return 0; const h = t / n; let s = f(0) + f(t); for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
/** 平滑插值表：[[x, y], ...]（任意顺序，内部按 x 排序），Catmull-Rom */
export const curve = (tab0) => { const tab = [...tab0].sort((a, b) => a[0] - b[0]); return (x) => {
  if (x <= tab[0][0]) return tab[0][1]; const L = tab.length; if (x >= tab[L - 1][0]) return tab[L - 1][1];
  let i = 0; while (x > tab[i + 1][0]) i++;
  const p0 = tab[Math.max(0, i - 1)][1], p1 = tab[i][1], p2 = tab[i + 1][1], p3 = tab[Math.min(L - 1, i + 2)][1], u = (x - tab[i][0]) / (tab[i + 1][0] - tab[i][0]);
  return .5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
}; };
