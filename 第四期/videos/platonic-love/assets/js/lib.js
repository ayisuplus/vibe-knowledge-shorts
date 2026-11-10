// 共用：色板、SVG 构建、时间线工具、字幕、档案头。画面状态全部由 onFrame(t) 按时间直接算出，逐帧可复现、跳帧安全。
(function () {
  const D = (window.D = window.D || {});
  const NS = "http://www.w3.org/2000/svg";

  D.W = 1920;
  D.H = 1080;
  D.DUR = 160.17;
  D.BAR = 2.136;
  D.BEAT = 0.534;

  D.C = {
    marble: "#f3ebdd", ink: "#2a1e16", ink2: "#6b5646",
    gold: "#c99a4a", goldHi: "#ebc57a", rose: "#d4505e", roseSoft: "#f4b3b3", roseGlow: "#ff8a8f",
    clay: "#c8643b", line: "#2a140b", glaze: "#1e1612", cream: "#f6ead2", seal: "#a8382a",
  };

  // ---------- 小工具 ----------
  D.f = (n) => Math.round(n * 100) / 100;
  D.rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  D.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  D.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  D.lerp = (a, b, k) => a + (b - a) * k;
  D.ease = {
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    sine: (k) => 0.5 - 0.5 * Math.cos(Math.PI * k),
    back: (k) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    lin: (k) => k,
  };
  // 关键帧插值：keys = [[t, v], ...]
  D.keyed = (keys, t, ease = D.ease.inOut) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return D.lerp(v0, v1, ease((t - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  };
  // 0..1 进度
  D.prog = (t, t0, d, ease = D.ease.out) => ease(D.clamp((t - t0) / d));
  // 0..1 的窗口：t0 起 d 秒淡入，t1 前 d 秒淡出
  D.win = (t, t0, t1, d = 0.4) => D.clamp((t - t0) / d) * (1 - D.clamp((t - (t1 - d)) / d));

  D.el = (parent, tag, attrs = {}, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, typeof attrs[k] === "number" ? D.f(attrs[k]) : attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  D.g = (parent, attrs = {}) => D.el(parent, "g", attrs);
  // 把一段 SVG 字符串塞进一个新组
  D.svg = (parent, str, attrs = {}) => { const g = D.g(parent, attrs); g.insertAdjacentHTML("beforeend", str); return g; };
  // 每帧设置：位置 / 旋转 / 缩放 / 透明度（只写属性，不经过 GSAP）
  D.tf = (el, x = 0, y = 0, s = 1, r = 0) => el.setAttribute("transform", `translate(${D.f(x)} ${D.f(y)})${r ? ` rotate(${D.f(r)})` : ""}${s !== 1 ? ` scale(${Math.round(s * 1000) / 1000})` : ""}`);
  D.op = (el, o) => { const v = D.f(D.clamp(o)); el.setAttribute("opacity", v); el.style.display = v <= 0 ? "none" : ""; };
  D.hop = (el, o) => { const v = D.f(D.clamp(o)); el.style.opacity = v; el.style.visibility = v <= 0 ? "hidden" : "visible"; };
  D.$ = (id) => document.getElementById(id);

  // ---------- 时间线 ----------
  const tl = gsap.timeline({ paused: true });
  D.tl = tl;
  D.steps = [];
  D.step = (fn) => D.steps.push(fn);
  D.frameFns = [];
  D.onFrame = (fn) => D.frameFns.push(fn);

  // ---------- HTML 层 ----------
  D.html = [];
  let txtN = 0;
  // 按时间显示的 HTML 文字：o.win = [t0, t1]，进场轻微上移
  D.text = (html, x, y, o = {}) => {
    const id = o.id || `txt-${txtN++}`;
    const anchor = o.anchor || "left";
    const pos = anchor === "center" ? `left:${x - 800}px;width:1600px;text-align:center` : anchor === "right" ? `right:${D.W - x}px;text-align:right` : `left:${x}px`;
    D.html.push(`<div id="${id}" class="t ${o.cls || ""}" style="${pos};top:${y}px;${o.style || ""}">${html}</div>`);
    if (o.win) {
      const [t0, t1] = o.win, d = o.d ?? 0.45;
      D.onFrame((t) => {
        const e = D.$(id), k = D.win(t, t0, t1, d);
        D.hop(e, k);
        if (k > 0 && !o.still) e.style.transform = `translateY(${D.f((1 - D.ease.out(D.clamp((t - t0) / d))) * 14)}px)`;
      });
    }
    return id;
  };

  // 字幕：底部宋体，<em> 暖玫红；o.dark 用于黑釉陶罐上（浅色字）。中文按标点分段，"|" 强制换行。
  const seg1 = (s) => s.split(/(?<=[，：；？。、])/).map((x) => `<span class="seg">${x}</span>`).join("");
  const seg = (s) => (s.includes("|") ? s.split("|").map((x) => `<span class="line">${seg1(x)}</span>`).join("") : seg1(s));
  let capN = 0;
  D.cap = (main, t0, t1, o = {}) => {
    const id = `cap-${capN++}`;
    const note = o.note ? `<i>${o.note}</i>` : "";
    D.html.push(`<div id="${id}" class="cap ${o.dark ? "dark" : ""} ${o.cls || ""}"><b>${seg(main)}</b>${note}</div>`);
    D.onFrame((t) => {
      const e = D.$(id), k = D.win(t, t0, t1, 0.3);
      D.hop(e, k);
      if (k > 0 && !o.noslide) e.firstChild.style.transform = `translateY(${D.f((1 - D.ease.out(D.clamp((t - t0) / 0.45))) * 14)}px)`;
    });
    return id;
  };

  // ---------- 档案头 ----------
  // 每段一组：大年份（或文字）+ 金线 + 地点人物；o.dark 时地点行用浅色
  let headN = 0;
  D.head = (t0, t1, { year, place, num = false, dark = false, fade = 0.5 } = {}) => {
    const id = `head-${headN++}`;
    D.html.push(`<div id="${id}" class="head ${dark ? "dark" : ""}"><div class="year ${num ? "num" : ""}">${year}</div><div class="rule"></div><div class="place">${place || ""}</div></div>`);
    D.onFrame((t) => {
      const e = D.$(id), k = D.win(t, t0, t1, fade);
      D.hop(e, k);
      if (k > 0) e.style.transform = `translateX(${D.f((1 - D.ease.out(D.clamp((t - t0) / 0.6))) * -24)}px)`;
    });
    return id;
  };
  let refN = 0;
  D.ref = (t0, t1, { en, zh, dark = false } = {}) => {
    const id = `ref-${refN++}`;
    D.html.push(`<div id="${id}" class="ref ${dark ? "dark" : ""}"><div class="orig">${en}</div><div class="zh">${zh}</div><div class="rule"></div></div>`);
    D.onFrame((t) => D.hop(D.$(id), D.win(t, t0, t1, 0.5)));
    return id;
  };

  // ---------- 通用 SVG 定义 ----------
  D.defs = (svg) => {
    // 默认按元素边界外扩；横竖直线（包围盒宽或高为 0）用 local 坐标的固定区域（glowL / glL）
    const big = `x="-60%" y="-60%" width="220%" height="220%"`;
    const loc = `filterUnits="userSpaceOnUse" x="-700" y="-700" width="1400" height="1400"`;
    svg.insertAdjacentHTML("afterbegin", `<defs>
      <filter id="soft" ${big}><feGaussianBlur stdDeviation="1.2"/></filter>
      <filter id="blur6" ${big}><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur20" ${big}><feGaussianBlur stdDeviation="20"/></filter>
      <filter id="glow" ${big}><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glowL" ${loc}><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glScreen" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="gl" ${big}><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="bigglow" ${big}><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadow" ${big}><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#5a3a1e" flood-opacity=".3"/></filter>
      <linearGradient id="goldFade" x1="0" x2="1"><stop offset="0" stop-color="#c99a4a"/><stop offset="1" stop-color="#c99a4a" stop-opacity="0"/></linearGradient>
      <radialGradient id="flash" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6dc" stop-opacity=".95"/><stop offset=".18" stop-color="#ffe2a0" stop-opacity=".5"/><stop offset=".5" stop-color="#d98a3a" stop-opacity=".12"/><stop offset="1" stop-color="#d98a3a" stop-opacity="0"/></radialGradient>
      <radialGradient id="roseRing" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#ff8a8f" stop-opacity="0"/><stop offset=".78" stop-color="#ff8a8f" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a8f" stop-opacity="0"/></radialGradient>
      <radialGradient id="sky" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffdf6"/><stop offset=".25" stop-color="#fff2d0" stop-opacity=".85"/><stop offset=".6" stop-color="#f6d79a" stop-opacity=".25"/><stop offset="1" stop-color="#f6d79a" stop-opacity="0"/></radialGradient>
      <radialGradient id="goldDot" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff3cf"/><stop offset=".4" stop-color="#ebc57a" stop-opacity=".8"/><stop offset="1" stop-color="#ebc57a" stop-opacity="0"/></radialGradient>
    </defs>`);
  };

  // 漂浮的金色微尘（每帧缓慢漂移）
  D.dust = (parent, { n = 60, seed = 1, x0 = 0, x1 = 1920, y0 = 0, y1 = 1080, color = "#d9a94e", op = .6, max = 3.6 } = {}) => {
    const R = D.rng(seed), g = D.g(parent), ps = [];
    for (let i = 0; i < n; i++) {
      const p = { x: x0 + R() * (x1 - x0), y: y0 + R() * (y1 - y0), r: .8 + R() * max, o: (.25 + R() * .75) * op, sp: 4 + R() * 10, ph: R() * 6.28 };
      p.e = D.el(g, "circle", { r: p.r, fill: color, opacity: p.o, filter: "url(#soft)" });
      ps.push(p);
    }
    D.onFrame((t) => {
      for (const p of ps) {
        const y = y0 + ((p.y - y0 - t * p.sp) % (y1 - y0) + (y1 - y0)) % (y1 - y0);
        p.e.setAttribute("cx", D.f(p.x + Math.sin(t * .4 + p.ph) * 14));
        p.e.setAttribute("cy", D.f(y));
      }
    });
    return g;
  };
})();
