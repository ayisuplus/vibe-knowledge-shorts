// 无累积状态；所有入场、离场和插值均由时间直接算出。
export const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const mix = (a, b, p) => a + (b - a) * p;
export const ramp = (t, start, duration = .6) => ease((t - start) / duration);
export const windowed = (t, a, b, fade = .42) => ramp(t, a, fade) * (1 - ramp(t, b - fade, fade));
export const beats = (t, beat) => t / beat;
