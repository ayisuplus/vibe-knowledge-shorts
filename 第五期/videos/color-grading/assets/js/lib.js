// 共用：色板、SVG 构建、时间线工具、照片滤镜（真实像素运算）、滑块、像素小卡、字幕预览。
// 画面状态全部由 onFrame(t) 按时间直接算出，逐帧可复现、跳帧安全。
(function () {
  const D = (window.D = window.D || {});
  const NS = "http://www.w3.org/2000/svg";

  D.W = 1920;
  D.H = 1080;
  D.DUR = 160.17;
  D.BAR = 2.136;
  D.BEAT = 0.534;

  D.C = {
    paper: "#f5f1ea", paper2: "#ebe4d8", ink: "#23262b", ink2: "#5d636c", ink3: "#9aa0a8",
    r: "#e5574a", g: "#34a866", b: "#3a8edb", hi: "#ec7a2c", clip: "#d83a2e", card: "#fffdf9",
  };
  D.W601 = [0.299, 0.587, 0.114];

  // ---------- 小工具 ----------
  D.f = (n) => Math.round(n * 100) / 100;
  D.rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  D.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  D.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  D.lerp = (a, b, k) => a + (b - a) * k;
  D.ease = {
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    out5: (k) => 1 - Math.pow(1 - k, 5),
    in: (k) => k * k * k,
    sine: (k) => 0.5 - 0.5 * Math.cos(Math.PI * k),
    back: (k) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    lin: (k) => k,
  };
  D.keyed = (keys, t, ease = D.ease.inOut) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return D.lerp(v0, v1, ease((t - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  };
  D.prog = (t, t0, d, ease = D.ease.out) => ease(D.clamp((t - t0) / d));
  D.win = (t, t0, t1, d = 0.4) => D.clamp((t - t0) / d) * (1 - D.clamp((t - (t1 - d)) / d));
  // 撞击弹跳：t0 时刻从 0 → 1 带回弹
  D.pop = (t, t0, d = 0.5) => D.ease.back(D.clamp((t - t0) / d));
  D.fmt = (n) => Math.round(n).toLocaleString("en-US");

  D.el = (parent, tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, typeof attrs[k] === "number" ? D.f(attrs[k]) : attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  D.g = (parent, attrs = {}) => D.el(parent, "g", attrs);
  D.svg = (parent, str, attrs = {}) => { const g = D.g(parent, attrs); g.insertAdjacentHTML("beforeend", str); return g; };
  D.tf = (el, x = 0, y = 0, s = 1, r = 0) => el.setAttribute("transform", `translate(${D.f(x)} ${D.f(y)})${r ? ` rotate(${D.f(r)})` : ""}${s !== 1 ? ` scale(${Math.round(s * 10000) / 10000})` : ""}`);
  D.op = (el, o) => { const v = D.f(D.clamp(o)); el.setAttribute("opacity", v); el.style.display = v <= 0 ? "none" : ""; };
  D.hop = (el, o) => { const v = D.f(D.clamp(o)); el.style.opacity = v; el.style.visibility = v <= 0 ? "hidden" : "visible"; };
  D.$ = (id) => document.getElementById(id);
  D.attr = (el, k, v) => { const s = typeof v === "number" ? String(D.f(v)) : v; if (el.getAttribute(k) !== s) el.setAttribute(k, s); };

  // ---------- 时间线 ----------
  const tl = gsap.timeline({ paused: true });
  D.tl = tl;
  D.frameFns = [];
  D.onFrame = (fn) => D.frameFns.push(fn);
  // 场景组：只在 [t0, t1] 内显示，前后各 d 秒淡入淡出
  D.scene = (parent, t0, t1, d = 0.35) => { const g = D.g(parent); D.onFrame((t) => D.op(g, D.win(t, t0, t1, d))); return g; };

  // ---------- HTML 层 ----------
  D.html = [];
  let txtN = 0;
  D.text = (html, x, y, o = {}) => {
    const id = o.id || `txt-${txtN++}`;
    const anchor = o.anchor || "left";
    const pos = anchor === "center" ? `left:${x - 900}px;width:1800px;text-align:center` : anchor === "right" ? `right:${D.W - x}px;text-align:right` : `left:${x}px`;
    D.html.push(`<div id="${id}" class="t ${o.cls || ""}" style="${pos};top:${y}px;${o.style || ""}">${html}</div>`);
    if (o.win) {
      const [t0, t1] = o.win, d = o.d ?? 0.4;
      D.onFrame((t) => {
        const e = D.$(id), k = D.win(t, t0, t1, d);
        D.hop(e, k);
        if (k > 0 && !o.still) e.style.transform = `translateY(${D.f((1 - D.ease.out(D.clamp((t - t0) / d))) * 16)}px)`;
      });
    }
    return id;
  };

  // 字幕预览（成片不显示；index.html?caps=1 时显示，用来检查位置和卡点）
  D.SHOW_CAPS = /[?&]caps=1/.test(location.search);
  D.buildCaps = () => {
    if (!D.SHOW_CAPS) return;
    (window.CAPTIONS || []).forEach(([t0, t1, main, note], i) => {
      const id = `cap-${i}`;
      D.html.push(`<div id="${id}" class="cap"><b>${main}</b>${note ? `<i>${note}</i>` : ""}</div>`);
      D.onFrame((t) => D.hop(D.$(id), D.win(t, t0, t1, 0.2)));
    });
  };

  // ---------- 照片：SVG 滤镜做真实的逐像素运算（在 sRGB 0–255 上算，和片子里讲的公式一致） ----------
  // set({ g:[R,G,B 增益], k:对比度, b:亮度(0–255), b2:第二次亮度(截断之后), s:饱和度, curve:fn(0..1)→0..1 })
  let fN = 0;
  D.defsEl = null;
  D.photo = (parent, href, o = {}) => {
    const w = o.w || 1536, h = o.h || 1024, id = `pf${fN++}`;
    const f = D.el(D.defsEl, "filter", { id, x: 0, y: 0, width: 1, height: 1, "color-interpolation-filters": "sRGB" });
    const ct1 = D.el(f, "feComponentTransfer");
    const f1 = ["R", "G", "B"].map((c) => D.el(ct1, `feFunc${c}`, { type: "linear", slope: 1, intercept: 0 }));
    const ct2 = D.el(f, "feComponentTransfer");
    const f2 = ["R", "G", "B"].map((c) => D.el(ct2, `feFunc${c}`, { type: "linear", slope: 1, intercept: 0 }));
    const cm = D.el(f, "feColorMatrix", { type: "matrix", values: "1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" });
    const ct3 = D.el(f, "feComponentTransfer");
    const f3 = ["R", "G", "B"].map((c) => D.el(ct3, `feFunc${c}`, { type: "identity" }));
    const g = D.g(parent);
    const img = D.el(g, "image", { href, width: w, height: h, preserveAspectRatio: "none", filter: o.raw ? null : `url(#${id})` });
    if (o.pixelated) img.style.imageRendering = "pixelated";
    const set = ({ g: gn = [1, 1, 1], k = 1, b = 0, b2 = 0, s = 1, curve = null } = {}) => {
      f1.forEach((fe, i) => { D.attr(fe, "slope", gn[i] * k); D.attr(fe, "intercept", 0.5 * (1 - k) + b / 255); });
      f2.forEach((fe) => D.attr(fe, "intercept", b2 / 255));
      const [wr, wg, wb] = D.W601, q = 1 - s;
      const m = [wr + (1 - wr) * s, wg * q, wb * q, wr * q, wg + (1 - wg) * s, wb * q, wr * q, wg * q, wb + (1 - wb) * s].map((v) => Math.round(v * 10000) / 10000);
      D.attr(cm, "values", `${m[0]} ${m[1]} ${m[2]} 0 0 ${m[3]} ${m[4]} ${m[5]} 0 0 ${m[6]} ${m[7]} ${m[8]} 0 0 0 0 0 1 0`);
      if (curve) {
        const tv = Array.from({ length: 65 }, (_, i) => Math.round(D.clamp(curve(i / 64)) * 10000) / 10000).join(" ");
        f3.forEach((fe) => { D.attr(fe, "type", "table"); D.attr(fe, "tableValues", tv); });
      } else f3.forEach((fe) => D.attr(fe, "type", "identity"));
    };
    return { g, img, set, w, h };
  };
  // 圆角裁切
  let cN = 0;
  D.clipRect = (x, y, w, h, r = 0) => { const id = `cr${cN++}`; const c = D.el(D.defsEl, "clipPath", { id }); const rect = D.el(c, "rect", { x, y, width: w, height: h, rx: r }); return { url: `url(#${id})`, rect }; };
  D.clipCircle = (cx, cy, r) => { const id = `cc${cN++}`; const c = D.el(D.defsEl, "clipPath", { id }); const circ = D.el(c, "circle", { cx, cy, r }); return { url: `url(#${id})`, circ }; };

  // ---------- 滑块（SVG）----------
  D.slider = (parent, name, { x = 260, y = 844, w = 1400, min = -100, max = 100 } = {}) => {
    const g = D.g(parent);
    D.el(g, "text", { x: x - 30, y: y + 12, "text-anchor": "end", class: "sv-name" }, name);
    D.el(g, "rect", { x, y: y - 4, width: w, height: 8, rx: 4, fill: "#d8d1c5" });
    const zx = x + ((0 - min) / (max - min)) * w;
    D.el(g, "rect", { x: zx - 1, y: y - 14, width: 2, height: 28, fill: D.C.ink3 });
    const fill = D.el(g, "rect", { x: zx, y: y - 4, width: 0, height: 8, rx: 4, fill: D.C.hi });
    const knob = D.el(g, "circle", { cx: zx, cy: y, r: 19, fill: "#fff", stroke: D.C.hi, "stroke-width": 3, filter: "url(#kshadow)" });
    const val = D.el(g, "text", { x: x + w + 30, y: y + 12, class: "sv-val" }, "0");
    const set = (v, label) => {
      const px = x + ((v - min) / (max - min)) * w;
      D.attr(fill, "x", Math.min(px, zx)); D.attr(fill, "width", Math.abs(px - zx)); D.attr(knob, "cx", px);
      const s = label != null ? label : (v > 0.5 ? "+" : "") + Math.round(v);
      if (val.textContent !== s) val.textContent = s;
    };
    return { g, set };
  };

  // ---------- 像素小卡（HTML）：title + R/G/B 三行，可选第二列 ----------
  let pcN = 0;
  D.pxcard = (x, y, { title = "", win = [0, 0], cls = "" } = {}) => {
    const id = `pc${pcN++}`;
    D.html.push(`<div id="${id}" class="pxcard ${cls}" style="left:${x}px;top:${y}px">${title ? `<div class="title">${title}</div>` : ""}
      <div class="row"><span class="k r">R</span><span class="v"></span></div>
      <div class="row"><span class="k g">G</span><span class="v"></span></div>
      <div class="row"><span class="k b">B</span><span class="v"></span></div></div>`);
    let vs = null;
    const set = (rgb) => { vs = vs || [...D.$(id).querySelectorAll(".v")]; rgb.forEach((v, i) => { const s = typeof v === "string" ? v : String(Math.round(v)).padStart(3, " "); if (vs[i].innerHTML !== s) vs[i].innerHTML = s; }); };
    D.onFrame((t) => { const e = D.$(id), k = D.win(t, win[0], win[1], 0.3); D.hop(e, k); if (k > 0) e.style.transform = `scale(${D.f(0.9 + 0.1 * D.ease.back(D.clamp((t - win[0]) / 0.4)))})`; });
    return { id, set };
  };

  // ---------- 通用 SVG 定义 ----------
  D.defs = (svg) => {
    const big = `x="-60%" y="-60%" width="220%" height="220%"`;
    svg.insertAdjacentHTML("afterbegin", `<defs id="defs">
      <filter id="soft" ${big}><feGaussianBlur stdDeviation="1.2"/></filter>
      <filter id="blur8" ${big}><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="blur22" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="22"/></filter>
      <filter id="glow" ${big}><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowL" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#28201a" flood-opacity=".24"/></filter>
      <filter id="shadowD" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#000" flood-opacity=".5"/></filter>
      <filter id="kshadow" ${big}><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#28201a" flood-opacity=".3"/></filter>
      <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d9dde3"/><stop offset="1" stop-color="#8d949e"/></linearGradient>
      <radialGradient id="specbg" cx=".3" cy=".2" r=".9"><stop offset="0" stop-color="#3a3f48"/><stop offset=".7" stop-color="#16181c"/></radialGradient>
      <linearGradient id="spectrum" x1="0" x2="1"><stop offset="0" stop-color="#2f62e8"/><stop offset=".12" stop-color="#3a86ff"/><stop offset=".3" stop-color="#22c3e6"/><stop offset=".45" stop-color="#3ac46a"/><stop offset=".6" stop-color="#d8e03a"/><stop offset=".72" stop-color="#ffb02e"/><stop offset=".85" stop-color="#ff5a2e"/><stop offset="1" stop-color="#c8202a"/></linearGradient>
    </defs>`);
    D.defsEl = svg.querySelector("#defs");
  };

  // 纸面背景上的淡淡网格
  D.gridBg = (parent, { step = 48, op = 0.05 } = {}) => {
    const g = D.g(parent, { opacity: op });
    for (let x = 0; x <= D.W; x += step) D.el(g, "line", { x1: x, y1: 0, x2: x, y2: D.H, stroke: D.C.ink, "stroke-width": 1 });
    for (let y = 0; y <= D.H; y += step) D.el(g, "line", { x1: 0, y1: y, x2: D.W, y2: y, stroke: D.C.ink, "stroke-width": 1 });
    return g;
  };
})();
