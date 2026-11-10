// 共用：色板、SVG 构建、时间线工具、字幕。所有随机都来自带种子的 rng，保证逐帧可复现。
(function () {
  const D = (window.D = window.D || {});
  const NS = "http://www.w3.org/2000/svg";

  D.W = 1080;
  D.H = 1920;
  D.DUR = 160.17;
  D.BAR = 2.136; // 一小节
  D.BEAT = 0.534;

  D.C = {
    bg: "#02070d",
    bg2: "#04121c",
    holo: "#3df2ff",
    holoDim: "#1a7f8c",
    ice: "#e8fdff",
    heat: "#ffb547",
    heatHot: "#ffd27a",
    flameCore: "#fff4d6",
    alert: "#ff4d3a",
  };

  // ---------- 小工具 ----------
  D.f = (n) => Math.round(n * 100) / 100;
  D.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  D.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  D.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  D.lerp = (a, b, k) => a + (b - a) * k;
  // 0..1 的缓动（给"按时间计算状态"的函数用）
  D.ease = {
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
  };
  // 分段关键帧：keys = [[t, v], ...]，在 t 之间用 inOut 插值
  D.keyed = (keys, t, ease = D.ease.inOut) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        return D.lerp(v0, v1, ease((t - t0) / (t1 - t0)));
      }
    }
    return keys[keys.length - 1][1];
  };

  D.el = (parent, tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, typeof attrs[k] === "number" ? D.f(attrs[k]) : attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  D.g = (parent, attrs = {}) => D.el(parent, "g", attrs);
  // 可动画的包装组：外层 g 只给 GSAP 动（不写 transform 属性），内层放内容
  D.wrap = (parent, id, attrs = {}) => {
    const outer = D.el(parent, "g", { id, ...attrs });
    return outer;
  };

  // ---------- 滤镜与渐变 ----------
  D.defs = (svg) => {
    const d = D.el(svg, "defs");
    const glow = (id, std, k = 1) => {
      // userSpaceOnUse：避免纯竖线/横线包围盒宽度为 0 被滤镜吃掉
      const f = D.el(d, "filter", { id, filterUnits: "userSpaceOnUse", x: -400, y: -400, width: 1880, height: 2720 });
      D.el(f, "feGaussianBlur", { in: "SourceGraphic", stdDeviation: std, result: "b1" });
      D.el(f, "feGaussianBlur", { in: "SourceGraphic", stdDeviation: std * 3.5, result: "b2" });
      const m = D.el(f, "feMerge");
      D.el(m, "feMergeNode", { in: "b2" });
      for (let i = 0; i < k; i++) D.el(m, "feMergeNode", { in: "b1" });
      D.el(m, "feMergeNode", { in: "SourceGraphic" });
    };
    glow("glow", 3, 2);
    glow("glowS", 1.6, 1);
    glow("glowL", 7, 2);
    const lg = (id, c, a0, a1) => {
      const g = D.el(d, "linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
      D.el(g, "stop", { offset: 0, "stop-color": c, "stop-opacity": a0 });
      D.el(g, "stop", { offset: 1, "stop-color": c, "stop-opacity": a1 });
    };
    lg("fillHolo", D.C.holo, 0.3, 0.05);
    lg("fillHeat", D.C.heat, 0.55, 0.08);
    lg("fillIce", D.C.ice, 0.16, 0.02);
    lg("fillAlert", D.C.alert, 0.35, 0.04);
    const rg = D.el(d, "radialGradient", { id: "flame", cx: 0.5, cy: 0.75, r: 0.6 });
    D.el(rg, "stop", { offset: 0, "stop-color": D.C.flameCore });
    D.el(rg, "stop", { offset: 0.35, "stop-color": D.C.heatHot });
    D.el(rg, "stop", { offset: 0.8, "stop-color": D.C.heat, "stop-opacity": 0.7 });
    D.el(rg, "stop", { offset: 1, "stop-color": "#ff8a1f", "stop-opacity": 0 });
    const bloom = D.el(d, "radialGradient", { id: "bloom", cx: 0.5, cy: 0.5, r: 0.5 });
    D.el(bloom, "stop", { offset: 0, "stop-color": D.C.holo, "stop-opacity": 0.35 });
    D.el(bloom, "stop", { offset: 1, "stop-color": D.C.holo, "stop-opacity": 0 });
    const bloomH = D.el(d, "radialGradient", { id: "bloomHeat", cx: 0.5, cy: 0.5, r: 0.5 });
    D.el(bloomH, "stop", { offset: 0, "stop-color": D.C.heat, "stop-opacity": 0.4 });
    D.el(bloomH, "stop", { offset: 1, "stop-color": D.C.heat, "stop-opacity": 0 });
    D.defsEl = d;
    return d;
  };

  // 通用描边样式
  D.stroke = (extra = {}) => ({ fill: "none", stroke: D.C.holo, "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round", filter: "url(#glowS)", ...extra });
  D.glass = (extra = {}) => ({ stroke: D.C.holo, "stroke-width": 3.2, fill: "url(#fillIce)", filter: "url(#glowS)", "stroke-linejoin": "round", "stroke-linecap": "round", ...extra });
  D.path = (g, d, extra = {}) => D.el(g, "path", { d, ...D.stroke(extra) });

  // HUD 角框
  D.brackets = (parent, x, y, w, h, { color = D.C.holo, len = 34, sw = 3, op = 0.9 } = {}) => {
    const g = D.el(parent, "g", { stroke: color, "stroke-width": sw, fill: "none", opacity: op, filter: "url(#glowS)" });
    const p = (d) => D.el(g, "path", { d });
    p(`M${x} ${y + len}V${y}H${x + len}`);
    p(`M${x + w - len} ${y}H${x + w}V${y + len}`);
    p(`M${x + w} ${y + h - len}V${y + h}H${x + w - len}`);
    p(`M${x + len} ${y + h}H${x}V${y + h - len}`);
    return g;
  };

  // ---------- 时间线 ----------
  const tl = gsap.timeline({ paused: true });
  D.tl = tl;
  const ID = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0 };
  D.show = (sel, t, from = { opacity: 0, y: 24 }, d = 0.4, ease = "power3.out", to = {}) => {
    const end = {};
    Object.keys(from).forEach((k) => (end[k] = k in to ? to[k] : ID[k] ?? from[k]));
    Object.assign(end, to);
    tl.fromTo(sel, from, { ...end, duration: d, ease, immediateRender: false }, t);
  };
  D.hide = (sel, t, d = 0.3) => tl.to(sel, { opacity: 0, duration: d, ease: "power1.in" }, t);
  D.fx = (sel, t, from, to, d = 0.4, ease = "power2.out") => tl.fromTo(sel, from, { ...to, duration: d, ease, immediateRender: false }, t);

  // 每帧按时间计算状态的函数（光柱、液滴、旋钮……）
  D.frameFns = [];
  D.onFrame = (fn) => D.frameFns.push(fn);

  // ---------- HTML 文字层 ----------
  D.html = { hud: [] };
  D.steps = [];
  D.step = (fn) => D.steps.push(fn);

  // 底部字幕带：主文字 + 可选副文字，底边对齐 y=1640
  let capN = 0;
  // 中文按标点分段，每段不拆开，换行只发生在标点之后
  const seg = (s) => s.split(/(?<=[，：；])/).map((x) => `<span class="seg">${x}</span>`).join("");
  D.cap = (main, t0, t1, o = {}) => {
    const id = `cap-${capN++}`;
    main = seg(main);
    if (o.sub) o.sub = seg(o.sub);
    const sub = o.sub ? `<i id="${id}-sub">${o.sub}</i>` : "";
    const size = o.size ? ` style="font-size:${o.size}px"` : "";
    D.html.hud.push(`<div id="${id}" class="cap${o.cls ? " " + o.cls : ""}"><b${size}>${main}</b>${sub}</div>`);
    D.step(() => {
      D.show(`#${id} b`, t0, { opacity: 0, y: 26 }, 0.38);
      tl.set(`#${id}`, { opacity: 1 }, t0);
      if (o.sub) D.show(`#${id}-sub`, o.subAt ?? t0 + 0.15, { opacity: 0, y: 16 }, 0.35);
      D.hide(`#${id}`, t1 - 0.25, 0.25);
    });
    return id;
  };
  // 任意位置的文字块（标题、标签）
  let txtN = 0;
  D.text = (html, x, y, t0, t1, o = {}) => {
    const id = o.id || `txt-${txtN++}`;
    const anchor = o.anchor || "left"; // left | center | right
    const pos = anchor === "center" ? `left:${x - 470}px;width:940px;text-align:center` : anchor === "right" ? `right:${D.W - x}px;text-align:right` : `left:${x}px`;
    D.html.hud.push(`<div id="${id}" class="txt ${o.cls || ""}" style="${pos};top:${y}px;${o.style || ""}"${o.attrs ? " " + o.attrs : ""}>${html}</div>`);
    if (t0 != null) D.step(() => {
      if (o.enter) o.enter(id, t0); else D.show(`#${id}`, t0, { opacity: 0, y: 20 }, 0.35);
      if (t1 != null) D.hide(`#${id}`, t1 - 0.25, 0.25);
    });
    return id;
  };

  // 故障闪：青/琥珀两色副本在量化时间上抖动，然后归零（chromatic-glitch，不用红蓝）
  D.glitch = (stackSel, t, dur = 0.35, max = 22) => {
    const amp = { a: 0 };
    D.step(() => {
      const copies = gsap.utils.toArray(`${stackSel} .gc`);
      tl.set(amp, { a: 1 }, t);
      tl.set(copies, { opacity: 0.85 }, t);
      tl.to(amp, {
        a: 0, duration: dur, ease: "power3.in",
        onUpdate: () => {
          const step = Math.floor(tl.time() / 0.045);
          copies.forEach((el, i) => {
            gsap.set(el, { x: (D.hash(step * 13 + i * 7) * 2 - 1) * max * amp.a, y: (D.hash(step * 29 + i * 11) * 2 - 1) * max * 0.3 * amp.a });
          });
        },
      }, t);
      tl.set(copies, { x: 0, y: 0, opacity: 0 }, t + dur);
    });
  };
  D.glitchStack = (text, cls = "") => `<span class="gstack ${cls}"><span class="gc warm" aria-hidden="true">${text}</span><span class="gc cool" aria-hidden="true">${text}</span><span class="gb">${text}</span></span>`;
})();
