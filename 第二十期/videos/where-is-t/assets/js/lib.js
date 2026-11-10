// 通用小工具（沿用第十八期）：缓动、关键帧轨道、HUD 元素。全部是"给时间 t，算出状态"的纯函数，可任意跳帧。
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const ramp = (t, t0, d) => clamp((t - t0) / d); // t0 起 d 秒内 0→1
export const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeIn = (x) => clamp(x) ** 2.2;
export const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
export const easeOutBack = (x, s = 1.6) => { x = clamp(x) - 1; return 1 + x * x * ((s + 1) * x + s); };
// 进 / 出两段淡变：tIn 起 dIn 秒淡入，tOut 起 dOut 秒淡出
export const win = (t, tIn, tOut, dIn = 0.35, dOut = 0.35) => ease(ramp(t, tIn, dIn)) * (1 - ease(ramp(t, tOut, dOut)));

/**
 * 关键帧轨道：keys = [[t, value], ...]，value 是数字或数组。
 * 用单调三次插值（Fritsch–Carlson）：经过每个关键帧、速度连续、不会冲过头。
 * 首尾两帧速度为 0。
 */
export function track(keys) {
  const T = keys.map((k) => k[0]);
  const arr = Array.isArray(keys[0][1]);
  const V = keys.map((k) => (arr ? k[1] : [k[1]]));
  const n = T.length, dim = V[0].length;
  const M = []; // 每个维度每个关键帧的斜率
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

// ---------- HUD ----------
const hud = () => document.getElementById("hud");
export function el(html, cls = "", style = "") {
  const e = document.createElement("div");
  e.className = cls; e.innerHTML = html;
  if (style) e.style.cssText = style;
  e.style.visibility = "hidden";
  hud().appendChild(e);
  return e;
}
// 设置透明度并顺带管 visibility（0 时隐藏，避免挡住别的东西）
export function show(e, o, transform) {
  e.style.visibility = o > 0.001 ? "visible" : "hidden";
  e.style.opacity = o.toFixed(4);
  if (transform !== undefined) e.style.transform = transform;
}

// 一组跟着 3D 点走的标签（HUD）。set(i, html, p, o, cls) 每帧调用；project 来自 world
export function labelPool(n, cls, project) {
  const els = Array.from({ length: n }, () => el("", cls));
  const last = els.map(() => ({ html: null, cls: null }));
  return {
    els,
    set(i, html, p, o, extra = "", dy = -135) {
      const e = els[i], L = last[i];
      if (html !== L.html) { e.innerHTML = html; L.html = html; }
      const c = `${cls} ${extra}`;
      if (c !== L.cls) { e.className = c; L.cls = c; }
      if (!p || o <= 0.001) { show(e, 0); return; }
      const q = project(p);
      show(e, q.behind ? 0 : o, `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) translate(-50%, ${dy}%)`);
    },
    hideFrom(i) { for (let j = i; j < n; j++) show(els[j], 0); },
  };
}
export const pulse = (t, t0, d) => { const k = (t - t0) / d; return k < 0 || k > 1 ? 0 : Math.sin(Math.PI * k); };

// 「已经走了多远」：对速度 f 从 0 积分到 t（梯形法，步长固定），不用逐帧累加（AGENTS 4.2）
export function integ(f, t, dt = 1 / 60) {
  let s = 0, a = f(0);
  const n = Math.floor(t / dt);
  for (let i = 1; i <= n; i++) { const b = f(i * dt); s += (a + b) * dt / 2; a = b; }
  return s + a * (t - n * dt);
}
// 固定种子随机数：同一个种子永远同一串数，跳帧一致
export function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
