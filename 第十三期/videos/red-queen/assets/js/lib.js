// 通用小工具：缓动、关键帧轨道、元素工厂。全部是"给时间 t，算出状态"的纯函数，可任意跳帧。（沿用第八期）
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

/** ∫₀ᵗ f dτ（辛普森法）。用来从「速度」得到「已经走了多远」，保证任意跳帧结果一致、不累积误差。 */
export function integ(f, t, n = 160) {
  if (t <= 0) return 0;
  if (n % 2) n += 1;
  const h = t / n;
  let s = f(0) + f(t);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(i * h);
  return (s * h) / 3;
}

/** 关键帧轨道：keys = [[t, value], ...]，value 是数字或数组。单调三次插值，首尾速度为 0。 */
export function track(keys) {
  const T = keys.map((k) => k[0]);
  const arr = Array.isArray(keys[0][1]);
  const V = keys.map((k) => (arr ? k[1] : [k[1]]));
  const n = T.length, dim = V[0].length;
  const M = [];
  for (let d = 0; d < dim; d++) {
    const delta = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) delta.push((V[i + 1][d] - V[i][d]) / (T[i + 1] - T[i]));
    for (let i = 1; i < n - 1; i++) {
      if (delta[i - 1] * delta[i] <= 0) m[i] = 0;
      else { const w1 = 2 * (T[i + 1] - T[i]) + (T[i] - T[i - 1]), w2 = (T[i + 1] - T[i]) + 2 * (T[i] - T[i - 1]); m[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]); }
    }
    M.push(m);
  }
  return (t) => {
    if (t <= T[0]) return arr ? V[0].slice() : V[0][0];
    if (t >= T[n - 1]) return arr ? V[n - 1].slice() : V[n - 1][0];
    let i = 0;
    while (t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], s = (t - T[i]) / h, s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const out = [];
    for (let d = 0; d < dim; d++) out.push(h00 * V[i][d] + h10 * h * M[d][i] + h01 * V[i + 1][d] + h11 * h * M[d][i + 1]);
    return arr ? out : out[0];
  };
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
// 设置透明度并顺带管 visibility（0 时隐藏，避免挡住别的东西）
export function show(e, o, transform) {
  e.style.visibility = o > 0.001 ? "visible" : "hidden";
  e.style.opacity = o.toFixed(4);
  if (transform !== undefined) e.style.transform = transform;
}
