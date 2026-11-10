// 通用小工具：缓动、关键帧轨道、元素工厂。全部是"给时间 t，算出状态"的纯函数，可任意跳帧。
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ramp = (t, t0, d) => clamp((t - t0) / d); // t0 起 d 秒内 0→1
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeIn = (x) => clamp(x) ** 2.2;
export const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
export const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2; };
export const easeOutBack = (x, s = 1.6) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
// 进 / 出两段淡变：tIn 起 dIn 秒淡入，tOut 起 dOut 秒淡出
export const win = (t, tIn, tOut, dIn = 0.35, dOut = 0.35) => ease(ramp(t, tIn, dIn)) * (1 - ease(ramp(t, tOut, dOut)));
export const pulse = (t, t0, d) => { const k = (t - t0) / d; return k < 0 || k > 1 ? 0 : Math.sin(Math.PI * k); };

/** 自 at 起，在 dur 秒内完成的进度（带一点加速感） */
export function settle(t, at, dur = 0.18) {
  const p = (t - at) / dur;
  return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
}

// 建一个元素挂到 parent（默认 #stage），初始隐藏
export function el(html, cls = "", parent = "stage", style = "") {
  const e = document.createElement("div");
  e.className = cls; e.innerHTML = html;
  if (style) e.style.cssText = style;
  e.style.visibility = "hidden";
  (typeof parent === "string" ? document.getElementById(parent) : parent).appendChild(e);
  return e;
}
export function vis(e, o, transform) {
  e.style.visibility = o > 0.001 ? 'visible' : 'hidden';
  e.style.opacity = o.toFixed(3);
  if (transform !== undefined) e.style.transform = transform;
}
export function show(e, o, transform) {
  e.style.visibility = o > 0.001 ? "visible" : "hidden";
  e.style.opacity = o.toFixed(4);
  if (transform !== undefined) e.style.transform = transform;
}
