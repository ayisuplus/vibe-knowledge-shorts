// 共用：色板、SVG 构建、时间线工具、字幕、档案头。所有随机都来自带种子的 rng，逐帧可复现。
(function () {
  const D = (window.D = window.D || {});
  const NS = "http://www.w3.org/2000/svg";

  D.W = 1080;
  D.H = 1920;
  D.DUR = 160.17;
  D.BAR = 2.136;
  D.BEAT = 0.534;

  D.C = {
    gold: "#d6b06a", goldHi: "#f1d79c", goldDim: "#8a6e42",
    ivory: "#efe5cf", ivoryDim: "#b9ab8f", ink: "#2a1d12",
    seal: "#a8382a", amber: "#f0b45a", wood: "#4a3220", woodHi: "#8a6440",
    // v3 药水色：每种被复刻的东西一种颜色（不用紫色、洋红）
    ai: "#2fd8f0", colleague: "#f0503a", boss: "#f7c21b", ex: "#ff8a7a", mentor: "#ff9a2e",
    self: "#14b386", anti: "#efe5cf", nuwa: "#e6dcc8", sun: "#4f8ff0", ghibli: "#7ccb4a", pure: "#f4e7c4",
  };
  // 字幕强调字的颜色（药水色提亮，保证在深底上看得清）
  D.EM = { gold: "#f1d79c", ai: "#f1d79c", colleague: "#ff7a62", sun: "#f1d79c", ghibli: "#a8dc7e", self: "#4fd6a6", amber: "#f6c97e" };
  D.em = D.EM.gold;

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
  };
  D.keyed = (keys, t, ease = D.ease.inOut) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return D.lerp(v0, v1, ease((t - t0) / (t1 - t0))); }
    return keys[keys.length - 1][1];
  };
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
  // 可被 GSAP 定位的包装组（不要写 transform 属性；需要 x/y 时登记到 D.pinned）
  D.pinned = [];
  D.wrap = (parent, id, attrs = {}, pin = false) => { const g = D.el(parent, "g", { id, ...attrs }); if (pin) D.pinned.push(id); return g; };

  // ---------- 时间线 ----------
  const tl = gsap.timeline({ paused: true });
  D.tl = tl;
  D.steps = [];
  D.step = (fn) => D.steps.push(fn);
  D.frameFns = [];
  D.onFrame = (fn) => D.frameFns.push(fn);
  // 渐显 / 渐隐（opacity）
  D.fadeIn = (sel, t, d = 0.5, from = {}, to = {}) => tl.fromTo(sel, { opacity: 0, ...from }, { opacity: 1, ...to, duration: d, ease: "power2.out", immediateRender: false }, t);
  D.fadeOut = (sel, t, d = 0.4, to = {}) => tl.to(sel, { opacity: 0, ...to, duration: d, ease: "power1.in" }, t);
  // 初始隐藏（第 0 帧就生效）
  D.hidden = (sel) => tl.set(sel, { opacity: 0 }, 0);

  // ---------- HTML 层 ----------
  D.html = [];
  let txtN = 0;
  D.text = (html, x, y, o = {}) => {
    const id = o.id || `txt-${txtN++}`;
    const anchor = o.anchor || "left";
    const pos = anchor === "center" ? `left:${x - 480}px;width:960px;text-align:center` : anchor === "right" ? `right:${D.W - x}px;text-align:right` : `left:${x}px`;
    D.html.push(`<div id="${id}" class="t ${o.cls || ""}" style="${pos};top:${y}px;${o.style || ""}"${o.attrs ? " " + o.attrs : ""}>${html}</div>`);
    return id;
  };

  // 字幕：底部宋体，<em> 为亮金色；可带一行小字注。中文按标点分段，换行只发生在标点之后。
  const seg1 = (s) => s.split(/(?<=[，：；？。])/).map((x) => `<span class="seg">${x}</span>`).join("");
  // "|" 强制换行：每一段是一个块
  const seg = (s) => (s.includes("|") ? s.split("|").map((x) => `<span class="line">${seg1(x)}</span>`).join("") : seg1(s));
  let capN = 0;
  D.cap = (main, t0, t1, o = {}) => {
    const id = `cap-${capN++}`;
    const note = o.note ? `<i>${o.note}</i>` : "";
    const em = o.em || D.em;
    D.html.push(`<div id="${id}" class="cap"><b style="--em:${em}">${seg(main)}</b>${note}</div>`);
    D.step(() => {
      tl.fromTo(`#${id}`, { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, t0);
      tl.fromTo(`#${id} b`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, t0);
      if (o.note) tl.fromTo(`#${id} i`, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out", immediateRender: false }, o.noteAt ?? t0 + 0.2);
      tl.to(`#${id}`, { opacity: 0, duration: 0.3, ease: "power1.in" }, t1 - 0.3);
    });
    return id;
  };

  // ---------- 档案头 ----------
  // 年份里程表：四列数字条，每列竖排 0–9，滚动到目标数字
  D.yearKeys = []; // [t, "2006"]
  const LH = 116;
  D.buildHeader = () => {
    const col = (i) => `<span class="ycol"><span class="ystrip" id="ys-${i}">${[..."0123456789"].map((d) => `<span>${d}</span>`).join("")}</span></span>`;
    D.html.push(`<div id="hdr" class="hdr"><div class="year">${[0, 1, 2, 3].map(col).join("")}</div><div class="yrule"></div></div>`);
  };
  D.year = (t, y, roll = 0.9) => D.yearKeys.push([t, y, roll]);
  D.yearSteps = () => {
    // 只让窗口里的那个数字可见（其余数字透明），滚动时上下两个数字交叉淡化
    const strips = [0, 1, 2, 3].map((i) => document.getElementById(`ys-${i}`));
    const spans = strips.map((st) => [...st.children]);
    // 位置按时间直接算（不读 GSAP 的当前值：驱动 tween 先于年份 tween 渲染，跳帧时会读到旧值）
    const io3 = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const posAt = (c, t) => {
      let v = +D.yearKeys[0][1][c];
      for (let k = 1; k < D.yearKeys.length; k++) {
        const [tk, y, roll] = D.yearKeys[k], nv = +y[c];
        if (nv === v || t <= tk) { if (t <= tk) break; continue; }
        const dur = roll + c * 0.12;
        v = t >= tk + dur ? nv : D.lerp(v, nv, io3((t - tk) / dur));
        if (t < tk + dur) break;
      }
      return v;
    };
    D.onFrame((t) => {
      strips.forEach((st, c) => {
        const pos = posAt(c, t);
        spans[c].forEach((sp, i) => { sp.style.opacity = String(D.f(D.clamp(1 - Math.abs(i - pos)))); });
      });
    });
    D.step(() => {
      const first = D.yearKeys[0][1];
      [0, 1, 2, 3].forEach((i) => tl.set(`#ys-${i}`, { y: -LH * +first[i] }, 0));
      for (let k = 1; k < D.yearKeys.length; k++) {
        const [t, y, roll] = D.yearKeys[k], prev = D.yearKeys[k - 1][1];
        [0, 1, 2, 3].forEach((i) => { if (y[i] !== prev[i]) tl.fromTo(`#ys-${i}`, { y: -LH * +prev[i] }, { y: -LH * +y[i], duration: roll + i * 0.12, ease: "power3.inOut", immediateRender: false }, t); });
      }
    });
  };
  // 地点 · 人物 / 右上引用 / 印章：每个档案一组，按时间淡入淡出
  let caseN = 0;
  D.caseInfo = (t0, t1, { place, en, zh, by, seal } = {}) => {
    const id = `case-${caseN++}`;
    let h = `<div id="${id}-place" class="t place">${place || ""}</div>`;
    if (zh) h += `<div id="${id}-ref" class="t ref"><span class="en">${en}</span><span class="zh">${zh}</span><span class="by">${by}</span><span class="line"></span></div>`;
    if (seal) h += `<div id="${id}-seal" class="seal" style="right:70px;top:300px;width:46px;height:46px;font-size:28px">${seal}</div>`;
    D.html.push(h);
    D.step(() => {
      tl.fromTo(`#${id}-place`, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, t0 + 0.3);
      tl.to(`#${id}-place`, { opacity: 0, duration: 0.4 }, t1 - 0.4);
      if (zh) {
        tl.fromTo(`#${id}-ref`, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, t0 + 0.4);
        tl.to(`#${id}-ref`, { opacity: 0, duration: 0.4 }, t1 - 0.4);
      }
      if (seal) {
        tl.fromTo(`#${id}-seal`, { opacity: 0, scale: 1.8, rotation: -12 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.25, ease: "power4.in", immediateRender: false }, t0 + 0.9);
        tl.to(`#${id}-seal`, { opacity: 0, duration: 0.4 }, t1 - 0.4);
      }
    });
  };

  // HTML 印章（盖下去：放大 → 一下顿住）
  let sealN = 0;
  D.sealAt = (ch, x, y, s, t0, t1, o = {}) => {
    const id = o.id || `seal-${sealN++}`;
    const bg = o.ink ? "#2a1d12" : "#a8382a";
    D.html.push(`<div id="${id}" class="seal" style="left:${x}px;top:${y}px;width:${s}px;height:${s}px;font-size:${o.fs || Math.round(s * 0.58)}px;background:${bg}">${ch}</div>`);
    D.step(() => {
      tl.fromTo(`#${id}`, { opacity: 0, scale: 2.2, rotation: o.rot ?? -10 }, { opacity: 0.95, scale: 1, rotation: (o.rot ?? -10) * 0.3, duration: 0.22, ease: "power4.in", immediateRender: false }, t0 - 0.22);
      if (t1 != null) tl.to(`#${id}`, { opacity: 0, duration: 0.35 }, t1 - 0.35);
    });
    return id;
  };
})();
