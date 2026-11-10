// 共用：色板、SVG 构建、时间线工具、插画（铺满 + 慢推）、手稿纸（逐字写出 + 印章）、铁锁、字幕预览。
// 画面状态全部由 onFrame(t) 按时间直接算出，逐帧可复现、跳帧安全。
(function () {
  const D = (window.D = window.D || {});
  const NS = "http://www.w3.org/2000/svg";

  D.W = 1920;
  D.H = 1080;
  D.DUR = 264.89;
  D.BEAT = 0.6966;
  D.BAR = 2.787;

  D.C = {
    paper: "#ede3d0", ink: "#1e1b18", red: "#c8281e", gold: "#d9a441", goldHi: "#f2cf7a",
    ice: "#7fc8e8", cold: "#e8f1f5", neonC: "#2de2e6", neonR: "#ff3b4a", night: "#0b1220",
  };

  // ---------- 小工具 ----------
  D.f = (n) => Math.round(n * 100) / 100;
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
  D.pop = (t, t0, d = 0.5) => D.ease.back(D.clamp((t - t0) / d));
  // 砸下：从 s0 倍大缩到 1，带一点过冲
  D.slam = (t, t0, d = 0.35, s0 = 1.6) => { const k = D.clamp((t - t0) / d); return k >= 1 ? 1 : D.lerp(1 + (s0 - 1) * 0.25, 1, D.ease.out5(k)); };
  // 撞击后的衰减抖动（像素）
  D.shake = (t, t0, amp = 10, d = 0.45, f = 38) => { const k = (t - t0) / d; return k < 0 || k > 1 ? 0 : amp * (1 - k) * Math.sin(k * f); };

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
  // 整段平移：fn 里注册的所有逐帧函数都按 (t - off) 计算（v4 配乐前半段加长 22.118 秒，后半段整体后移）
  D.shifted = (off, fn) => { const orig = D.onFrame; D.onFrame = (f) => orig((t) => f(t - off)); try { fn(); } finally { D.onFrame = orig; } };
  // 段落重排（v9 凯恩斯挪到锁后面）：fn 里注册的逐帧函数收到 map(t)，也就是重排前的时间
  D.remapped = (map, fn) => { const orig = D.onFrame; D.onFrame = (f) => orig((t) => f(map(t))); try { fn(); } finally { D.onFrame = orig; } };
  D.reorder = (t) => (t < 85.3 ? t : t < 120.65 ? t + 19.0 : t < 139.8 ? t - 35.35 : t);
  // dOut：淡出时长（默认同淡入）。v11 起用来做叠化：后一场提前淡入，前一场晚一点再消失
  D.scene = (parent, t0, t1, d = 0.35, dOut = d) => { const g = D.g(parent); D.onFrame((t) => D.op(g, D.clamp((t - t0) / d) * (1 - D.clamp((t - (t1 - dOut)) / dOut)))); return g; };
  // 过色转场：t0 前后各 d 秒，盖一层纯色（在所有画面之上、文字之下），用在两段画面完全不同的交界
  D.dip = (parent, t0, color, d = 0.45) => { const r = D.el(parent, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: color, opacity: 0 }); D.onFrame((t) => D.op(r, Math.max(0, 1 - Math.abs(t - t0) / d))); };

  // ---------- 插画：铺满画面（slice），按关键帧慢推 ----------
  // keys: [[t, 缩放, x 偏移, y 偏移], ...]，缩放围绕画面中心
  D.plate = (parent, href, { keys = null, filter = null, w = 1920, h = 1080 } = {}) => {
    const g = D.g(parent), inner = D.g(g);
    const img = D.el(inner, "image", { href: `assets/img/${href}`, x: 0, y: 0, width: w, height: h, preserveAspectRatio: "xMidYMid slice", filter });
    if (keys) D.onFrame((t) => {
      if (g.style.display === "none") return;
      const s = D.keyed(keys.map((k) => [k[0], k[1]]), t, D.ease.sine), x = D.keyed(keys.map((k) => [k[0], k[2] || 0]), t, D.ease.sine), y = D.keyed(keys.map((k) => [k[0], k[3] || 0]), t, D.ease.sine);
      D.tf(inner, 960 - 960 * s + x, 540 - 540 * s + y, s);
    });
    return { g, inner, img };
  };
  // 背景大号淡字：铺满空白但不抢戏（rows: [[文本, y], ...]，整体缓慢横移）
  D.ghost = (parent, rows, { size = 120, fill = "#3a2a18", op = 0.06, drift = 30, t0 = 0 } = {}) => {
    const g = D.g(parent, { opacity: op, "data-layout-ignore": "" });
    const els = rows.map(([txt, y], i) => D.el(g, "text", { x: i % 2 ? 1960 : -40, y, "text-anchor": i % 2 ? "end" : "start", class: "serif", "font-size": size, "font-weight": 800, fill, "data-layout-ignore": "" }, txt));
    D.onFrame((t) => { if (g.parentNode.style.display === "none") return; els.forEach((e, i) => e.setAttribute("transform", `translate(${D.f((i % 2 ? 1 : -1) * drift * (t - t0) / 10)} 0)`)); });
    return g;
  };
  D.black = (parent, o = 1, fill = "#000") => D.el(parent, "rect", { x: -20, y: -20, width: 1960, height: 1120, fill, opacity: o });

  // ---------- HTML 层 ----------
  D.html = [];
  let txtN = 0;
  // 文字：o.win=[t0,t1] 自动淡入淡出（默认上移 16px）；o.slam=true 时从大到小砸下
  D.text = (html, x, y, o = {}) => {
    const id = o.id || `txt-${txtN++}`;
    const anchor = o.anchor || "left";
    const pos = anchor === "center" ? `left:${x - 900}px;width:1800px;text-align:center` : anchor === "right" ? `right:${D.W - x}px;text-align:right` : `left:${x}px`;
    D.html.push(`<div id="${id}" class="t ${o.cls || ""}" style="${pos};top:${y}px;${o.style || ""}">${html}</div>`);
    if (o.win) {
      const [t0, t1] = o.win, d = o.d ?? 0.4;
      D.onFrame((t) => {
        const e = D.$(id), k = D.win(t, t0, t1, o.slam ? 0.12 : d);
        D.hop(e, k);
        if (k <= 0) return;
        if (o.slam) e.style.transform = `scale(${D.f(D.slam(t, t0, 0.32, o.slam === true ? 1.5 : o.slam))})`;
        else if (!o.still) e.style.transform = `translateY(${D.f((1 - D.ease.out(D.clamp((t - t0) / d))) * 16)}px)`;
      });
    }
    return id;
  };

  // ---------- 手稿纸：引文逐字写出，红色印章砸下 ----------
  // lines: HTML 片段（可含 <b>），write=[t0,t1] 写出时间，seal={text,t,x,y,size}
  let shN = 0;
  D.sheet = ({ x, y, w, h, rot = 0, size = 48, lines, src = "", write, seal = null, win, tape = false, slap = null, alpha = null, move = null }) => {
    const id = `sh${shN++}`;
    // 把文本拆成逐字 span（保留 <b> 和 <br>）
    let n = 0;
    const html = lines.map((ln) => ln.replace(/(<[^>]+>)|([^<])/g, (m, tag, ch) => (tag ? tag : `<span class="c" data-i="${n++}">${ch}</span>`))).join("<br>");
    const total = n;
    D.html.push(`<div id="${id}" class="sheet" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">
      ${tape ? `<div class="tape" style="left:-30px;top:18px;transform:rotate(-38deg)"></div><div class="tape" style="right:-30px;top:18px;transform:rotate(38deg)"></div>` : ""}
      <div class="q" style="font-size:${size}px">${html}</div>${src ? `<div class="src">${src}</div>` : ""}
      ${seal ? `<div class="seal" style="right:${seal.x ?? 70}px;bottom:${seal.y ?? 56}px;font-size:${seal.size || 40}px">${seal.text}</div>` : ""}</div>`);
    let spans = null, sealEl = null, srcEl = null, shown = -1;
    D.onFrame((t) => {
      const e = D.$(id), k = D.win(t, win[0], win[1], 0.35) * (alpha ? alpha(t) : 1);
      D.hop(e, k);
      if (k <= 0) return;
      spans = spans || [...e.querySelectorAll("span.c")];
      sealEl = sealEl || e.querySelector(".seal");
      srcEl = srcEl || e.querySelector(".src");
      const cnt = Math.round(total * D.clamp((t - write[0]) / (write[1] - write[0])));
      if (cnt !== shown) { spans.forEach((s, i) => { const v = i < cnt ? "1" : "0"; if (s.style.opacity !== v) s.style.opacity = v; }); shown = cnt; }
      if (srcEl) srcEl.style.opacity = D.f(D.prog(t, write[1], 0.5));
      if (sealEl) {
        const ks = D.clamp((t - seal.t) / 0.22);
        sealEl.style.opacity = D.f(ks > 0 ? 0.92 : 0);
        sealEl.style.transform = `rotate(-6deg) scale(${D.f(ks > 0 ? D.lerp(2.2, 1, D.ease.out5(ks)) : 2.2)})`;
      }
      // 贴上来：从放大 + 偏转落到原位
      let s = 1, r = rot, dy = 0;
      if (slap != null) { const kk = D.clamp((t - slap) / 0.3); s = D.lerp(1.25, 1, D.ease.out5(kk)); r = rot + D.lerp(-5, 0, D.ease.out(kk)); }
      let mx = 0, my = 0, ms = 1;
      if (move) [mx, my, ms] = move(t);
      e.style.transform = `translate(${D.f(mx)}px, ${D.f(dy + my)}px) rotate(${D.f(r)}deg) scale(${D.f(s * ms)})`;
    });
    return { id };
  };

  // 引文卡（纸质 / 深色）
  D.qcard = (html, by, x, y, w, { win, dark = false, size = 44, anchor = "left" } = {}) => {
    const left = anchor === "center" ? x - w / 2 : x;
    return D.text(`<div class="qcard ${dark ? "dark" : ""}" style="width:${w}px;font-size:${size}px">${html}<span class="by">${by}</span></div>`, left, y, { win, d: 0.6 });
  };

  // ---------- 铁锁（SVG）：原点在锁身顶边中点，锁身 300×250 ----------
  // set({ open:0..1, dir:±1 开口方向, lit:0..1 冷光, red:0..1 红光, shake:像素, ghost:0..1 晃动残影 })
  D.lock = (parent, label, num, { light = false } = {}) => {
    const g = D.g(parent);
    const glowIce = D.el(g, "ellipse", { cx: 0, cy: 120, rx: 330, ry: 300, fill: "url(#iceglow)", opacity: 0 });
    const glowRed = D.el(g, "ellipse", { cx: 0, cy: 130, rx: 300, ry: 280, fill: "url(#redglow)", opacity: 0 });
    const body = D.g(g);
    const shackleG = D.g(body);
    const shackle = D.el(shackleG, "path", { d: "M-90 40 V-70 a90 90 0 0 1 180 0 V40", fill: "none", stroke: "url(#shackle)", "stroke-width": 42, "stroke-linecap": "round" });
    const iron = D.el(body, "rect", { x: -150, y: 0, width: 300, height: 250, rx: 34, fill: "url(#iron)" });
    const ironLit = D.el(body, "rect", { x: -150, y: 0, width: 300, height: 250, rx: 34, fill: "url(#ironLit)", opacity: 0 });
    D.el(body, "rect", { x: -150, y: 0, width: 300, height: 250, rx: 34, fill: "none", stroke: "rgba(255,255,255,.18)", "stroke-width": 3 });
    D.svg(body, `<g fill="rgba(255,255,255,.25)"><circle cx="-118" cy="30" r="8"/><circle cx="118" cy="30" r="8"/><circle cx="-118" cy="220" r="8"/><circle cx="118" cy="220" r="8"/></g>`);
    D.el(body, "path", { d: "M0 92 a26 26 0 1 1 -0.1 0 Z M-12 128 L12 128 L20 190 L-20 190 Z", fill: "#07090b" });
    const hole = D.el(body, "path", { d: "M0 92 a26 26 0 1 1 -0.1 0 Z M-12 128 L12 128 L20 190 L-20 190 Z", fill: "#ff4a2e", opacity: 0, filter: "url(#soft2)" });
    const vib = D.svg(g, `<g stroke="#ff7a5c" stroke-width="5" stroke-linecap="round"><path d="M-205 70 l-34 -12 M-210 125 l-40 0 M-205 180 l-34 12"/><path d="M205 70 l34 -12 M210 125 l40 0 M205 180 l34 12"/></g>`, { opacity: 0 });
    const lab = D.el(g, "text", { x: 0, y: 352, "text-anchor": "middle", class: "serif", "font-size": 42, "font-weight": 700, fill: light ? "#2a2018" : "#e6e0d6", "letter-spacing": 3 }, label);
    const nm = D.el(g, "text", { x: 0, y: 290, "text-anchor": "middle", class: "serif", "font-size": 30, fill: light ? "rgba(42,32,24,.55)" : "rgba(230,224,214,.55)" }, num);
    const set = ({ open = 0, dir = -1, lit = 0, red = 0, shake = 0 } = {}) => {
      const o = D.clamp(open);
      shackleG.setAttribute("transform", `translate(0 ${D.f(-46 * o)}) rotate(${D.f(32 * o * dir)} ${dir < 0 ? -90 : 90} 40)`);
      D.attr(shackle, "d", dir < 0 ? `M-90 40 V-70 a90 90 0 0 1 180 0 V${D.f(40 - 30 * o)}` : `M-90 ${D.f(40 - 30 * o)} V-70 a90 90 0 0 1 180 0 V40`);
      D.op(ironLit, lit); D.op(glowIce, lit); D.op(glowRed, red); D.op(hole, red * 0.5); D.op(vib, Math.min(1, Math.abs(shake) / 4) * red);
      body.setAttribute("transform", `rotate(${D.f(shake * 0.6)} 0 250)`);
      D.attr(lab, "fill", light ? (red > 0.3 ? "#a3241b" : lit > 0.3 ? "#1f5f7a" : "#2a2018") : (red > 0.3 ? "#f3d9d4" : lit > 0.3 ? "#eef7fb" : "#e6e0d6"));
    };
    set();
    return { g, set, lab };
  };

  // 字幕预览（成片不显示；index.html?caps=1 时显示）
  D.SHOW_CAPS = /[?&]caps=1/.test(location.search);
  D.buildCaps = () => {
    if (!D.SHOW_CAPS) return;
    (window.CAPTIONS || []).forEach(([t0, t1, main], i) => {
      const id = `cap-${i}`;
      D.html.push(`<div id="${id}" class="cap"><b>${main.replace(/\n/g, "<br>")}</b></div>`);
      D.onFrame((t) => D.hop(D.$(id), D.win(t, t0, t1, 0.2)));
    });
  };

  // ---------- 通用 SVG 定义 ----------
  D.defs = (svg) => {
    const big = `x="-60%" y="-60%" width="220%" height="220%"`;
    svg.insertAdjacentHTML("afterbegin", `<defs id="defs">
      <filter id="soft2" ${big}><feGaussianBlur stdDeviation="2"/></filter>
      <filter id="blur8" ${big}><feGaussianBlur stdDeviation="8"/></filter>
      <filter id="blur16" ${big}><feGaussianBlur stdDeviation="16"/></filter>
      <filter id="glow" ${big}><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="shadowD" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="30" stdDeviation="30" flood-color="#000" flood-opacity=".55"/></filter>
      <filter id="dim" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".86 0 0 0 0  0 .86 0 0 0  0 0 .88 0 0  0 0 0 1 0"/></filter>
      <linearGradient id="iron" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6168"/><stop offset=".35" stop-color="#2e3237"/><stop offset=".7" stop-color="#1b1e22"/><stop offset="1" stop-color="#3a3f45"/></linearGradient>
      <linearGradient id="ironLit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9c3cf"/><stop offset=".35" stop-color="#55646d"/><stop offset=".7" stop-color="#2a3238"/><stop offset="1" stop-color="#6f8590"/></linearGradient>
      <linearGradient id="shackle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2e33"/><stop offset=".3" stop-color="#9aa3ab"/><stop offset=".5" stop-color="#d9e0e5"/><stop offset=".7" stop-color="#8b949c"/><stop offset="1" stop-color="#25292d"/></linearGradient>
      <radialGradient id="redglow"><stop offset="0" stop-color="#ff5a3c" stop-opacity=".55"/><stop offset="1" stop-color="#c8281e" stop-opacity="0"/></radialGradient>
      <radialGradient id="iceglow"><stop offset="0" stop-color="#cdeefa" stop-opacity=".5"/><stop offset="1" stop-color="#7fc8e8" stop-opacity="0"/></radialGradient>
      <radialGradient id="warm"><stop offset="0" stop-color="#fff1c4" stop-opacity=".95"/><stop offset=".5" stop-color="#f2cf7a" stop-opacity=".35"/><stop offset="1" stop-color="#d9a441" stop-opacity="0"/></radialGradient>
      <radialGradient id="coldbg" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#1c2630"/><stop offset=".55" stop-color="#0d1218"/><stop offset="1" stop-color="#07090c"/></radialGradient>
      <radialGradient id="paperbg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#f6efe2"/><stop offset=".7" stop-color="#ebe2d0"/><stop offset="1" stop-color="#ddd1ba"/></radialGradient>
      <radialGradient id="aibg" cx=".5" cy=".35" r=".85"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#eaf2f6"/><stop offset="1" stop-color="#d4e2ea"/></radialGradient>
      <radialGradient id="darkbg" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#1a1410"/><stop offset=".6" stop-color="#0b0908"/><stop offset="1" stop-color="#050404"/></radialGradient>
      <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8ebfa" stop-opacity=".32"/><stop offset=".7" stop-color="#7fc8e8" stop-opacity=".06"/><stop offset="1" stop-color="#7fc8e8" stop-opacity="0"/></linearGradient>
    </defs>`);
    D.defsEl = svg.querySelector("#defs");
  };
})();
