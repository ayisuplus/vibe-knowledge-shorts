// 古典博物馆风绘图工具（由 02-风格样张-v2/antique.js 改写，加了可动画的句柄）。
(function () {
  const D = window.D, C = D.C, tl = D.tl;
  const el = D.el;

  D.defs = (svg) => {
    const d = el(svg, "defs");
    D.defsEl = d;
    const lin = (id, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 0, units) => {
      const g = el(d, "linearGradient", { id, x1, y1, x2, y2, gradientUnits: units });
      stops.forEach(([o, c, a = 1]) => el(g, "stop", { offset: o, "stop-color": c, "stop-opacity": a }));
    };
    const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => {
      const g = el(d, "radialGradient", { id, cx, cy, r });
      stops.forEach(([o, c, a = 1]) => el(g, "stop", { offset: o, "stop-color": c, "stop-opacity": a }));
    };
    lin("glass", [[0, "#fff4dc", 0.22], [0.18, "#fff4dc", 0.05], [0.5, "#fff4dc", 0.02], [0.8, "#fff4dc", 0.06], [1, "#fff4dc", 0.2]]);
    rad("glassBulb", [[0, "#fff4dc", 0.02], [0.75, "#fff4dc", 0.05], [1, "#fff4dc", 0.2]], 0.42, 0.4, 0.62);
    lin("amber", [[0, "#e7a447", 0.92], [0.55, "#b8701f", 0.9], [1, "#6e3d10", 0.95]], 0, 0, 0, 1);
    rad("amberBulb", [[0, "#f0b45a", 0.95], [0.6, "#b8701f", 0.92], [1, "#5e330c", 0.95]], 0.4, 0.25, 0.8);
    rad("amberHot", [[0, "#ffe2a0", 1], [0.5, "#f0b45a", 0.95], [1, "#9a5a18", 0.95]], 0.5, 0.3, 0.8);
    lin("brass", [[0, "#4a3214"], [0.22, "#b8904c"], [0.38, "#f2d898"], [0.55, "#9a7432"], [0.8, "#d9b56c"], [1, "#4a3214"]]);
    lin("brassV", [[0, "#f2d898"], [0.4, "#a8803c"], [1, "#3e2a10"]], 0, 0, 0, 1);
    lin("iron", [[0, "#1c1712"], [0.4, "#5a4a38"], [0.6, "#7a6650"], [1, "#1c1712"]]);
    lin("wood", [[0, "#6a4a2c"], [1, "#3a2616"]], 0, 0, 0, 1);
    rad("flameOuter", [[0, "#ffd88a", 0.95], [0.5, "#ff9a3a", 0.7], [1, "#ff6a1a", 0]], 0.5, 0.7, 0.6);
    rad("flameCore", [[0, "#fffbe8", 1], [0.6, "#ffe6a8", 0.9], [1, "#ffc060", 0]], 0.5, 0.75, 0.55);
    rad("glowWarm", [[0, "#ffb860", 0.45], [1, "#ffb860", 0]]);
    rad("glowGold", [[0, "#f1d79c", 0.55], [1, "#f1d79c", 0]]);
    rad("shadow", [[0, "#000", 0.65], [1, "#000", 0]]);
    lin("paper", [[0, "#f3ead6"], [1, "#d9cbad"]], 0, 0, 0, 1);
    lin("parch", [[0, "#efe2c2"], [0.5, "#e6d6b0"], [1, "#cdb98c"]], 0, 0, 1, 1);
    lin("ivoryTile", [[0, "#f6eedb"], [1, "#d8c9a6"]], 0, 0, 0, 1);
    lin("goldFade", [[0, "#d6b06a", 0], [0.5, "#d6b06a", 0.9], [1, "#d6b06a", 0]]);
    lin("goldText", [[0, "#fff1c8"], [0.45, "#e7c27a"], [0.75, "#a97d3c"], [1, "#f3d999"]], 0, 0, 0, 1);
    const F = { filterUnits: "userSpaceOnUse", x: -400, y: -400, width: 1880, height: 2720 };
    const blur = (id, s) => { const f = el(d, "filter", { id, ...F }); el(f, "feGaussianBlur", { stdDeviation: s }); };
    blur("blur2", 2); blur("blur6", 6); blur("blur14", 14);
    const soft = el(d, "filter", { id: "softGlow", ...F });
    el(soft, "feGaussianBlur", { in: "SourceGraphic", stdDeviation: 4, result: "b" });
    const m = el(soft, "feMerge"); el(m, "feMergeNode", { in: "b" }); el(m, "feMergeNode", { in: "SourceGraphic" });
    const ds = el(d, "filter", { id: "drop", ...F });
    el(ds, "feDropShadow", { dx: 0, dy: 10, stdDeviation: 12, "flood-color": "#000", "flood-opacity": 0.55 });
    return d;
  };

  D.glass = (p, d, { hl = null, bulb = false } = {}) => {
    const g = el(p, "g");
    el(g, "path", { d, fill: bulb ? "url(#glassBulb)" : "url(#glass)", stroke: "#000", "stroke-opacity": 0.35, "stroke-width": 7 });
    el(g, "path", { d, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.55, "stroke-width": 2.2 });
    if (hl) el(g, "path", { d: hl, fill: "none", stroke: "#fffaf0", "stroke-opacity": 0.55, "stroke-width": 6, "stroke-linecap": "round", filter: "url(#blur2)" });
    return g;
  };

  // 按色值生成一套药水渐变（亮顶深底）。返回 { lin, bulb, hot, glow, hi, c }
  const mix = (hex, t, to) => { const h = (n) => parseInt(n, 16); const a = [h(hex.slice(1, 3)), h(hex.slice(3, 5)), h(hex.slice(5, 7))]; const b = to === "w" ? [255, 250, 236] : [18, 10, 6]; return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  D.mix = mix;
  const LQ = {};
  // "数据流"液体：药水色的深色底 + 稀疏的发光光丝和光点，快慢两层往上流（化学的酒除外）
  const DP = {};
  D.dataPats = (hex) => {
    if (DP[hex]) return DP[hex];
    const id = hex.slice(1), d = D.defsEl, hi = mix(hex, 0.7, "w");
    const sg = el(d, "linearGradient", { id: `dsg${id}`, x1: 0, y1: 0, x2: 0, y2: 1 });
    [[0, hi, 0], [0.45, hi, 0.95], [1, hi, 0]].forEach(([o, c, a]) => el(sg, "stop", { offset: o, "stop-color": c, "stop-opacity": a }));
    // 大块图案、元素随机散布，避免排成行（种子固定，逐帧可复现）
    const rr = D.rng(7);
    const A = el(d, "pattern", { id: `dpA${id}`, patternUnits: "userSpaceOnUse", width: 240, height: 400 });
    for (let i = 0; i < 8; i++) { const w = 2.2 + rr() * 1.2; el(A, "rect", { x: D.f(i * 30 + rr() * 18), y: D.f(rr() * 360), width: D.f(w), height: D.f(28 + rr() * 40), rx: D.f(w / 2), fill: `url(#dsg${id})`, opacity: D.f(0.55 + rr() * 0.45) }); }
    for (let i = 0; i < 4; i++) el(A, "circle", { cx: D.f(20 + rr() * 200), cy: D.f(rr() * 390), r: D.f(1.4 + rr()), fill: hi, opacity: D.f(0.5 + rr() * 0.4) });
    const B = el(d, "pattern", { id: `dpB${id}`, patternUnits: "userSpaceOnUse", width: 300, height: 520 });
    for (let i = 0; i < 3; i++) el(B, "rect", { x: D.f(30 + i * 95 + rr() * 30), y: D.f(rr() * 420), width: 6, height: D.f(70 + rr() * 40), rx: 3, fill: `url(#dsg${id})`, opacity: D.f(0.2 + rr() * 0.15) });
    D.onFrame((t) => {
      A.setAttribute("patternTransform", `translate(${D.f(Math.sin(t * 0.8) * 6)} ${D.f(-((t * 46) % 400))})`);
      B.setAttribute("patternTransform", `translate(${D.f(Math.cos(t * 0.5) * 8)} ${D.f(-((t * 24) % 520))})`);
    });
    return (DP[hex] = [`url(#dpA${id})`, `url(#dpB${id})`]);
  };
  // 液体上的数据流覆盖层（两层矩形）。set(y, h) 跟着液面走；color(hex) 换颜色（非数据色则隐藏）
  D.dataOv = (parent, x, w, hex) => {
    const rs = [0, 1].map(() => el(parent, "rect", { x, y: 0, width: w, height: 0, fill: "none" }));
    const o = {
      set: (y, h) => rs.forEach((r) => { r.setAttribute("y", D.f(y)); r.setAttribute("height", D.f(Math.max(0, h))); }),
      color: (c) => { const L = D.liq(c); rs.forEach((r, i) => r.setAttribute("fill", L.data ? L.pats[i] : "none")); },
    };
    o.color(hex);
    return o;
  };
  const CLASSIC = () => [C.amber, C.pure];
  D.liq = (hex = C.amber) => {
    if (LQ[hex]) return LQ[hex];
    if (!CLASSIC().includes(hex)) {
      const id = hex.slice(1), d = D.defsEl, stops = (g, arr) => arr.forEach(([o, c, a]) => el(g, "stop", { offset: o, "stop-color": c, "stop-opacity": a }));
      stops(el(d, "linearGradient", { id: "L" + id, x1: 0, y1: 0, x2: 0, y2: 1 }), [[0, mix(hex, 0.4), 0.95], [0.5, mix(hex, 0.62), 0.95], [1, mix(hex, 0.8), 0.97]]);
      stops(el(d, "radialGradient", { id: "R" + id, cx: 0.45, cy: 0.3, r: 0.85 }), [[0, mix(hex, 0.38), 0.96], [0.6, mix(hex, 0.62), 0.95], [1, mix(hex, 0.84), 0.97]]);
      stops(el(d, "radialGradient", { id: "H" + id, cx: 0.5, cy: 0.3, r: 0.8 }), [[0, mix(hex, 0.15, "w"), 1], [0.5, mix(hex, 0.2), 0.96], [1, mix(hex, 0.6), 0.96]]);
      stops(el(d, "radialGradient", { id: "G" + id, cx: 0.5, cy: 0.5, r: 0.5 }), [[0, hex, 0.45], [1, hex, 0]]);
      return (LQ[hex] = { lin: `url(#L${id})`, bulb: `url(#R${id})`, hot: `url(#H${id})`, glow: `url(#G${id})`, hi: mix(hex, 0.45, "w"), c: hex, data: true, pats: D.dataPats(hex) });
    }
    const id = hex.slice(1), d = D.defsEl;
    const stops = (g, arr) => arr.forEach(([o, c, a]) => el(g, "stop", { offset: o, "stop-color": c, "stop-opacity": a }));
    stops(el(d, "linearGradient", { id: "L" + id, x1: 0, y1: 0, x2: 0, y2: 1 }), [[0, mix(hex, 0.08, "w"), 0.95], [0.55, hex, 0.92], [1, mix(hex, 0.55), 0.96]]);
    stops(el(d, "radialGradient", { id: "R" + id, cx: 0.4, cy: 0.25, r: 0.8, fx: 0.4, fy: 0.25 }), [[0, mix(hex, 0.14, "w"), 0.97], [0.6, hex, 0.95], [1, mix(hex, 0.5), 0.97]]);
    stops(el(d, "radialGradient", { id: "H" + id, cx: 0.5, cy: 0.3, r: 0.8 }), [[0, mix(hex, 0.6, "w"), 1], [0.5, mix(hex, 0.2, "w"), 0.96], [1, mix(hex, 0.35), 0.96]]);
    stops(el(d, "radialGradient", { id: "G" + id, cx: 0.5, cy: 0.5, r: 0.5 }), [[0, hex, 0.5], [1, hex, 0]]);
    return (LQ[hex] = { lin: `url(#L${id})`, bulb: `url(#R${id})`, hot: `url(#H${id})`, glow: `url(#G${id})`, hi: mix(hex, 0.55, "w"), c: hex });
  };

  // 火焰：返回 set(scale, t) 用于每帧跳动
  D.flame = (p, x, y) => {
    const g = el(p, "g");
    const glow = el(g, "ellipse", { cx: 0, cy: -60, rx: 120, ry: 130, fill: "url(#glowWarm)" });
    el(g, "path", { d: "M0 -120 C26 -80 34 -40 22 -12 C14 6 -14 6 -22 -12 C-34 -40 -26 -80 0 -120 Z", fill: "url(#flameOuter)", filter: "url(#blur2)" });
    el(g, "path", { d: "M0 -78 C13 -54 16 -30 10 -14 C6 -4 -6 -4 -10 -14 C-16 -30 -13 -54 0 -78 Z", fill: "url(#flameCore)" });
    const set = (s, t) => {
      const fy = 1 + 0.07 * Math.sin(t * 17) + 0.04 * Math.sin(t * 29), sk = 0.06 * Math.sin(t * 11);
      g.setAttribute("transform", `translate(${x} ${y}) matrix(${D.f(s * (1 - 0.03 * Math.sin(t * 13)))} 0 ${D.f(sk * s)} ${D.f(s * fy)} 0 0)`);
      glow.setAttribute("opacity", D.f(D.clamp(0.6 + 0.4 * s)));
    };
    set(1, 0);
    return { g, set };
  };

  // 纸签：系点 (ax, ay)，签身左上角 (x, y)。swing(t, t0) 让它从 t0 起荡进来、慢慢停住
  D.tag = (p, id, ax, ay, x, y, text, { rot = -4, w = null, size = 32 } = {}) => {
    const g = D.wrap(p, id);
    const inner = el(g, "g");
    const W = w || [...text].length * (size + 2) + 56, H = 66;
    el(inner, "path", { d: `M${ax} ${ay} C${(ax + x) / 2} ${ay + 40} ${x + 10} ${y - 20} ${x + 22} ${y + H / 2}`, fill: "none", stroke: "#c9b48a", "stroke-width": 2, opacity: 0.8 });
    const t = el(inner, "g", { transform: `rotate(${rot} ${x} ${y + H / 2})`, filter: "url(#drop)" });
    el(t, "path", { d: `M${x} ${y + 14} L${x + 14} ${y} H${x + W} V${y + H} H${x + 14} L${x} ${y + H - 14} Z`, fill: "url(#paper)" });
    el(t, "circle", { cx: x + 22, cy: y + H / 2, r: 6, fill: "#3a2a1a" });
    const tx = el(t, "text", { x: x + 42 + (W - 42) / 2, y: y + H / 2 + size * 0.38, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": size, fill: C.ink }, text);
    const swing = (tt, t0) => {
      const k = tt - t0;
      const a = k < 0 ? -70 : -38 * Math.exp(-k * 1.6) * Math.cos(k * 5.2);
      inner.setAttribute("transform", `rotate(${D.f(a)} ${ax} ${ay})`);
    };
    return { g, inner, swing, text: tx, W, H };
  };

  D.sealSvg = (p, x, y, s, ch, { ink = false } = {}) => {
    const g = el(p, "g", { filter: "url(#drop)" });
    el(g, "rect", { x, y, width: s, height: s, rx: 4, fill: ink ? "#2a1d12" : "#a8382a" });
    el(g, "rect", { x: x + 4, y: y + 4, width: s - 8, height: s - 8, rx: 2, fill: "none", stroke: "#f5e6d6", "stroke-opacity": 0.35, "stroke-width": 2 });
    el(g, "text", { x: x + s / 2, y: y + s * 0.7, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 900, "font-size": s * 0.6, fill: "#f5e6d6" }, ch);
    return g;
  };

  // 试管：set(level 0..1)
  let tubeN = 0;
  D.tube = (p, x, yb, h, { w = 70, hot = false, color } = {}) => {
    const L = D.liq(color);
    const g = el(p, "g");
    const top = yb - h, r = w / 2;
    const d = `M${x - r} ${top} V${yb - r} A${r} ${r} 0 0 0 ${x + r} ${yb - r} V${top}`;
    const cid = `tclip-${tubeN++}`;
    const cp = el(D.defsEl, "clipPath", { id: cid });
    el(cp, "path", { d: d + " Z" });
    const lq = el(g, "g", { "clip-path": `url(#${cid})` });
    const rect = el(lq, "rect", { x: x - r, y: yb, width: w, height: 2, fill: hot ? L.hot : L.lin });
    const ov = D.dataOv(lq, x - r, w, color || C.amber);
    const men = el(lq, "ellipse", { cx: x, cy: yb, rx: r - 2, ry: 5, fill: L.hi, opacity: 0.7 });
    D.glass(g, d, { hl: `M${x - r + 9} ${top + 20} V${yb - r - 6}` });
    el(g, "ellipse", { cx: x, cy: top, rx: r + 6, ry: 7, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.7, "stroke-width": 3 });
    const set = (v) => {
      const ly = yb - (h - 6) * D.clamp(v, 0, 1);
      rect.setAttribute("y", D.f(ly)); rect.setAttribute("height", D.f(yb - ly + 2));
      ov.set(ly, yb - ly + 2);
      men.setAttribute("cy", D.f(ly)); men.setAttribute("opacity", v > 0.01 ? 0.7 : 0);
      return ly;
    };
    set(0);
    return { g, set, rect, men, L, x, yb, h, top, w };
  };

  // 象牙骨牌（左上角 x, y）
  D.tile = (p, x, y, w, h) => {
    const g = el(p, "g", { filter: "url(#drop)" });
    el(g, "rect", { x, y, width: w, height: h, rx: 14, fill: "url(#ivoryTile)" });
    el(g, "rect", { x: x + 3, y: y + 3, width: w - 6, height: h - 6, rx: 12, fill: "none", stroke: "#fffaf0", "stroke-opacity": 0.6, "stroke-width": 2 });
    el(g, "rect", { x: x + 3, y: y + h - 12, width: w - 6, height: 9, rx: 6, fill: "#000", opacity: 0.08 });
    return g;
  };

  // 小烧瓶（中心 x, y，半径 r）：返回 setLevel
  let flaskN = 0;
  D.flask = (p, x, y, r, { level = 0.4, neck = 0.8, color } = {}) => {
    const L = D.liq(color);
    const g = el(p, "g");
    const nw = Math.max(8, r * 0.24), nh = r * neck;
    const d = `M${x - nw} ${y - r + r * 0.1} V${y - r - nh} H${x + nw} V${y - r + r * 0.1} A${r} ${r} 0 1 1 ${x - nw} ${y - r + r * 0.1} Z`;
    const cid = `fclip-${flaskN++}`;
    const cp = el(D.defsEl, "clipPath", { id: cid });
    el(cp, "circle", { cx: x, cy: y, r: r - 3 });
    const lq = el(g, "g", { "clip-path": `url(#${cid})` });
    const rect = el(lq, "rect", { x: x - r, y: y + r, width: r * 2, height: r * 2, fill: L.bulb });
    const ov = D.dataOv(lq, x - r, r * 2, color || C.amber);
    const men = el(lq, "ellipse", { cx: x, cy: y, rx: r * 0.9, ry: Math.max(3, r * 0.06), fill: L.hi, opacity: 0.6 });
    D.glass(g, d, { bulb: true, hl: `M${x - r * 0.66} ${y - r * 0.3} A${r * 0.8} ${r * 0.8} 0 0 0 ${x - r * 0.5} ${y + r * 0.55}` });
    el(g, "ellipse", { cx: x, cy: y - r - nh, rx: nw + 4, ry: 4, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.7, "stroke-width": 2 });
    const set = (v) => { const ly = y + r - 2 * r * D.clamp(v); rect.setAttribute("y", D.f(ly)); ov.set(ly, r * 2); men.setAttribute("cy", D.f(ly)); men.setAttribute("rx", D.f(Math.sqrt(Math.max(0, r * r - (ly - y) ** 2)) * 0.96)); };
    set(level);
    return { g, set, lq, rect, ov, men, x, y, r, top: y - r - nh, nw };
  };

  // 整套蒸馏装置。tick(t, {flame, big, small}) 每帧更新：火、液面、气泡、蒸汽、冷凝管液滴
  D.still = (p, id, o = {}) => {
    const B = { x: 400, y: 880, r: 200, ...(o.big || {}) };
    const S = { x: 860, y: 1218, r: 78, ...(o.small || {}) };
    const noSmall = o.small === false;
    const floor = o.floor ?? 1335;
    const g = D.wrap(p, id);
    const LB = D.liq(o.color), LS = D.liq(o.smallColor || o.color);
    el(g, "ellipse", { cx: B.x, cy: floor + 6, rx: 260, ry: 26, fill: "url(#shadow)" });
    if (!noSmall) el(g, "ellipse", { cx: S.x, cy: floor + 4, rx: 130, ry: 16, fill: "url(#shadow)" });
    if (o.stand !== false) {
      el(g, "rect", { x: 968, y: 430, width: 14, height: floor - 430, rx: 6, fill: "url(#iron)" });
      el(g, "rect", { x: 900, y: floor - 16, width: 150, height: 20, rx: 6, fill: "url(#iron)" });
    }
    const ringY = B.y + B.r + 6;
    el(g, "path", { d: `M${B.x - 150} ${ringY} L${B.x - 175} ${floor} M${B.x + 150} ${ringY} L${B.x + 175} ${floor} M${B.x} ${ringY + 4} L${B.x} ${floor - 8}`, stroke: "url(#brassV)", "stroke-width": 9, "stroke-linecap": "round" });
    el(g, "rect", { x: B.x - 170, y: ringY - 6, width: 340, height: 12, rx: 6, fill: "url(#brass)" });
    const lampY = floor - 4;
    el(g, "path", { d: `M${B.x - 72} ${lampY} C${B.x - 90} ${lampY - 70} ${B.x - 60} ${lampY - 110} ${B.x} ${lampY - 112} C${B.x + 60} ${lampY - 110} ${B.x + 90} ${lampY - 70} ${B.x + 72} ${lampY} Z`, fill: "url(#brass)", filter: "url(#drop)" });
    el(g, "rect", { x: B.x - 16, y: lampY - 132, width: 32, height: 24, rx: 4, fill: "url(#brassV)" });
    el(g, "rect", { x: B.x - 3, y: lampY - 146, width: 6, height: 16, fill: "#3a2a18" });
    const fl = D.flame(g, B.x, lampY - 146);
    // 大瓶
    const neckW = 34, neckTop = B.y - B.r - (o.neck ?? 150);
    const bulbD = `M${B.x - neckW} ${B.y - B.r + 14} V${neckTop} H${B.x + neckW} V${B.y - B.r + 14} A${B.r} ${B.r} 0 1 1 ${B.x - neckW} ${B.y - B.r + 14} Z`;
    const cpB = el(D.defsEl, "clipPath", { id: `${id}-clipBig` });
    el(cpB, "circle", { cx: B.x, cy: B.y, r: B.r - 4 });
    const liq = el(g, "g", { "clip-path": `url(#${id}-clipBig)` });
    const bigRect = el(liq, "rect", { x: B.x - B.r, y: B.y, width: B.r * 2, height: B.r * 2, fill: LB.bulb });
    const bigRect2 = el(liq, "rect", { x: B.x - B.r, y: B.y, width: B.r * 2, height: B.r * 2, fill: LB.bulb, opacity: 0 });
    const bigOv = D.dataOv(liq, B.x - B.r, B.r * 2, o.color || C.amber);
    const bigMen = el(liq, "ellipse", { cx: B.x, cy: B.y, rx: B.r * 0.98, ry: 12, fill: LB.hi, opacity: 0.55 });
    const inLiq = el(liq, "g"); // 液体里漂浮的东西
    const rb = D.rng(9), bubbles = [];
    for (let i = 0; i < 18; i++) bubbles.push({ x: B.x - B.r * 0.7 + rb() * B.r * 1.4, r: 2 + rb() * 6, v: 0.3 + rb() * 0.6, ph: rb(), el: el(liq, "circle", { cx: 0, cy: 0, r: 2 + rb() * 6, fill: "none", stroke: LB.hi, "stroke-opacity": 0.55, "stroke-width": 1.6 }) });
    const vapors = [];
    for (let i = 0; i < 4; i++) {
      const x = B.x - 30 + i * 20;
      vapors.push(el(g, "path", { d: `M${x} ${B.y} C${x - 26} ${B.y - 80} ${x + 26} ${B.y - 150} ${x} ${neckTop + 90} S${x - 14} ${neckTop + 40} ${x} ${neckTop + 10}`, fill: "none", stroke: "#fff3dc", "stroke-opacity": 0.12 + i * 0.03, "stroke-width": 8, "stroke-linecap": "round", filter: "url(#blur6)", "stroke-dasharray": "70 50" }));
    }
    D.glass(g, bulbD, { bulb: true, hl: `M${B.x - B.r * 0.72} ${B.y - B.r * 0.35} A${B.r * 0.8} ${B.r * 0.8} 0 0 0 ${B.x - B.r * 0.55} ${B.y + B.r * 0.62}` });
    el(g, "path", { d: `M${B.x - B.r * 0.42} ${B.y - B.r * 0.72} A${B.r * 0.95} ${B.r * 0.95} 0 0 1 ${B.x + B.r * 0.18} ${B.y - B.r * 0.9}`, fill: "none", stroke: "#fffaf0", "stroke-opacity": 0.35, "stroke-width": 10, "stroke-linecap": "round", filter: "url(#blur6)" });
    const headY = neckTop - 70;
    D.glass(g, `M${B.x - neckW} ${neckTop} V${headY} H${B.x + neckW} V${neckTop}`);
    const cork = el(g, "rect", { x: B.x - neckW - 4, y: headY - 34, width: neckW * 2 + 8, height: 36, rx: 6, fill: "#6b4a2a" });
    if (o.thermo !== false) {
      el(g, "rect", { x: B.x - 5, y: headY - 190, width: 10, height: 300, rx: 5, fill: "url(#glass)", stroke: "#f6e7c8", "stroke-opacity": 0.6, "stroke-width": 1.6 });
      el(g, "rect", { x: B.x - 2.5, y: headY - 60, width: 5, height: 172, fill: "#c0392b" });
      el(g, "circle", { cx: B.x, cy: headY + 112, r: 8, fill: "#c0392b" });
      for (let k = 0; k < 9; k++) el(g, "line", { x1: B.x + 6, y1: headY - 170 + k * 20, x2: B.x + 16, y2: headY - 170 + k * 20, stroke: "#f6e7c8", "stroke-opacity": 0.6, "stroke-width": 1.4 });
    }
    // 冷凝管
    const P0 = [B.x + neckW, headY + 22], P1 = o.condEnd || [S.x, S.y - S.r - 70];
    const ux = P1[0] - P0[0], uy = P1[1] - P0[1], L = Math.hypot(ux, uy), nx = -uy / L, ny = ux / L;
    const at = (t, off = 0) => [P0[0] + ux * t + nx * off, P0[1] + uy * t + ny * off];
    const q = (pt) => pt[0].toFixed(1) + " " + pt[1].toFixed(1);
    const tw = 9, jw = 34, j0 = 0.16, j1 = 0.86;
    D.glass(g, `M${q(at(j0, jw))} L${q(at(j1, jw))} Q${q(at(j1 + 0.03))} ${q(at(j1, -jw))} L${q(at(j0, -jw))} Q${q(at(j0 - 0.03))} ${q(at(j0, jw))} Z`, { hl: `M${q(at(j0 + 0.03, -jw + 8))} L${q(at(j1 - 0.03, -jw + 8))}` });
    el(g, "path", { d: `M${q(at(0, tw))} L${q(at(1, tw))} L${q(at(1, -tw))} L${q(at(0, -tw))} Z`, fill: "url(#glass)", stroke: "#f6e7c8", "stroke-opacity": 0.5, "stroke-width": 1.6 });
    [at(j0 + 0.06, -jw), at(j1 - 0.06, jw)].forEach((pt, i) => el(g, "path", { d: `M${q(pt)} l${D.f((i ? 1 : -1) * nx * 40)} ${D.f((i ? 1 : -1) * ny * 40)}`, stroke: "#f6e7c8", "stroke-opacity": 0.5, "stroke-width": 14, "stroke-linecap": "round" }));
    // 冷凝管里流动的光（模拟液体顺着管子流下去）：一道柔光 + 一道亮芯，沿管子往下走
    const fp = `M${q(at(0.06))} L${q(at(0.98))}`;
    const flowGlow = el(g, "path", { d: fp, fill: "none", stroke: LS.c, "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": "70 90", opacity: 0.55, filter: "url(#blur6)" });
    const flowCore = el(g, "path", { d: fp, fill: "none", stroke: LS.hi, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "70 90", opacity: 0.9 });
    const cl = at(0.5);
    if (o.stand !== false) el(g, "path", { d: `M${D.f(cl[0])} ${D.f(cl[1])} H968`, stroke: "url(#iron)", "stroke-width": 10 });
    el(g, "rect", { x: cl[0] - 10, y: cl[1] - 7, width: 20, height: 14, rx: 3, fill: "url(#brass)" }); // 夹子
    const R = { g, B, S, at, neckTop, headY, P1, flame: fl, cork, floor, inLiq, LB, LS };
    let small = null;
    if (!noSmall) {
      D.glass(g, `M${P1[0] - 9} ${P1[1]} V${S.y - S.r - 6} H${P1[0] + 9} V${P1[1]}`);
      el(g, "path", { d: `M${S.x - 70} ${floor} L${S.x - 52} ${S.y + S.r - 8} H${S.x + 52} L${S.x + 70} ${floor} Z`, fill: "#4a3220", stroke: "#8a6440", "stroke-width": 2 });
      small = D.flask(g, S.x, S.y, S.r, { neck: 0.55, color: o.smallColor || o.color });
      R.small = small;
    }
    // 落进小瓶的液滴（timeline 驱动）
    let dropN = 0;
    R.dropAt = (t, { gold = false } = {}) => {
      const did = `${id}-drop-${dropN++}`;
      const w = D.wrap(g, did, { opacity: 0 });
      const y0 = P1[1] + 10, y1 = S.y + S.r * 0.3;
      el(w, "path", { d: `M${S.x} ${y0} c8 12 9 20 0 23 c-9 -3 -8 -11 0 -23 z`, fill: gold ? "#ffe9b0" : LS.hi, filter: gold ? "url(#softGlow)" : null });
      const rp = D.wrap(g, did + "-rip", { opacity: 0 });
      el(rp, "ellipse", { cx: S.x, cy: y1, rx: S.r * 0.6, ry: 5, fill: "none", stroke: "#fff1c8", "stroke-width": 2 });
      if (gold) el(rp, "circle", { cx: S.x, cy: S.y, r: S.r * 1.3, fill: "url(#glowGold)" });
      D.step(() => {
        tl.fromTo(`#${did}`, { opacity: 1, y: 0 }, { y: y1 - y0 - 10, duration: 0.4, ease: "power2.in", immediateRender: false }, t - 0.4);
        tl.set(`#${did}`, { opacity: 0 }, t);
        tl.fromTo(`#${did}-rip`, { opacity: 1, scale: 0.4, svgOrigin: `${S.x} ${y1}` }, { opacity: 0, scale: gold ? 1.6 : 1.3, svgOrigin: `${S.x} ${y1}`, duration: 0.9, ease: "power2.out", immediateRender: false }, t);
      });
    };
    R.tick = (t, s = {}) => {
      fl.set(s.flame ?? 1, t);
      const lvl = B.y + B.r * (s.big ?? 0.05);
      bigRect.setAttribute("y", D.f(lvl)); bigRect2.setAttribute("y", D.f(lvl)); bigOv.set(lvl, B.r * 2);
      if (s.colA) bigOv.color(s.colA);
      if (s.colA) { const A = D.liq(s.colA), Bq = D.liq(s.colB || s.colA), k = s.colK || 0; bigRect.setAttribute("fill", A.bulb); bigRect2.setAttribute("fill", Bq.bulb); bigRect2.setAttribute("opacity", D.f(k)); bigMen.setAttribute("fill", k < 0.5 ? A.hi : Bq.hi); }
      bigMen.setAttribute("cy", D.f(lvl + Math.sin(t * 3) * 2));
      const boil = s.flame ?? 1;
      for (const b of bubbles) {
        const k = (t * b.v * boil + b.ph) % 1;
        b.el.setAttribute("cx", D.f(b.x + Math.sin(t * 2 + b.ph * 9) * 4));
        b.el.setAttribute("cy", D.f(B.y + B.r * 0.85 - k * (B.y + B.r * 0.85 - lvl)));
        b.el.setAttribute("opacity", D.f(lvl < B.y + B.r * 0.8 ? 0.8 * (1 - k) : 0));
      }
      vapors.forEach((v, i) => { v.setAttribute("stroke-dashoffset", D.f(-((t * 60 * boil + i * 37) % 120))); v.setAttribute("opacity", D.f(D.clamp(0.5 + 0.5 * boil))); });
      const fc = s.gold ? "#ffe2a0" : s.drip || LS.c, off = D.f(-((t * 110) % 160));
      flowGlow.setAttribute("stroke", fc); flowGlow.setAttribute("stroke-dashoffset", off);
      flowCore.setAttribute("stroke", s.gold ? "#fff3d0" : D.mix(fc, 0.5, "w")); flowCore.setAttribute("stroke-dashoffset", off);
      if (small && s.small != null) small.set(s.small);
    };
    return R;
  };

  // ---------- v3 新件 ----------
  // 药剂瓶：圆肚 + 细颈 + 软木塞（软木塞是可单独动画的包装组 `${id}-cork`）。底部中心 (x, yb)
  D.vial = (p, id, x, yb, r, color, { level = 0.62, glow = true, pin = false } = {}) => {
    const g = D.wrap(p, id, {}, pin);
    const L = D.liq(color), cy = yb - r, nw = r * 0.34, nTop = cy - r - r * 0.75;
    let halo = null;
    if (glow) halo = el(g, "circle", { cx: x, cy, r: r * 2.2, fill: L.glow, opacity: 0.55 });
    el(g, "ellipse", { cx: x, cy: yb + 3, rx: r * 1.1, ry: r * 0.16, fill: "url(#shadow)" });
    const d = `M${D.f(x - nw)} ${D.f(cy - r * 0.92)} V${D.f(nTop)} H${D.f(x + nw)} V${D.f(cy - r * 0.92)} A${r} ${r} 0 1 1 ${D.f(x - nw)} ${D.f(cy - r * 0.92)} Z`;
    const cp = el(D.defsEl, "clipPath", { id: `${id}-clip` });
    el(cp, "circle", { cx: x, cy, r: r - 3 });
    const lq = el(g, "g", { "clip-path": `url(#${id}-clip)` });
    const rect = el(lq, "rect", { x: x - r, y: cy, width: r * 2, height: r * 2, fill: L.bulb });
    const ov = D.dataOv(lq, x - r, r * 2, color);
    const men = el(lq, "ellipse", { cx: x, cy, rx: r * 0.9, ry: Math.max(3, r * 0.08), fill: L.hi, opacity: 0.7 });
    D.glass(g, d, { bulb: true, hl: `M${D.f(x - r * 0.66)} ${D.f(cy - r * 0.3)} A${D.f(r * 0.8)} ${D.f(r * 0.8)} 0 0 0 ${D.f(x - r * 0.5)} ${D.f(cy + r * 0.55)}` });
    const cork = D.wrap(g, `${id}-cork`, {}, true);
    el(cork, "path", { d: `M${D.f(x - nw - 3)} ${D.f(nTop + 4)} L${D.f(x - nw + 1)} ${D.f(nTop - r * 0.32)} H${D.f(x + nw - 1)} L${D.f(x + nw + 3)} ${D.f(nTop + 4)} Z`, fill: "#8a5e36", stroke: "#4a3220", "stroke-width": 2 });
    const set = (v) => { const ly = cy + r - 2 * r * D.clamp(v); rect.setAttribute("y", D.f(ly)); ov.set(ly, r * 2); men.setAttribute("cy", D.f(ly)); men.setAttribute("rx", D.f(Math.sqrt(Math.max(0, r * r - (ly - cy) ** 2)) * 0.92)); };
    set(level);
    return { g, id, x, yb, r, cy, nTop, top: nTop - r * 0.32, set, halo, lq, L };
  };

  D.shelf = (p, x0, x1, y, { h = 20 } = {}) => {
    const g = el(p, "g", { filter: "url(#drop)" });
    el(g, "rect", { x: x0, y, width: x1 - x0, height: h, rx: 3, fill: "#5a3d24", stroke: C.woodHi, "stroke-width": 2 });
    el(g, "rect", { x: x0, y: y + h - 5, width: x1 - x0, height: 5, fill: "#3a2616" });
    return g;
  };

  // 小标签条（左侧一道药水色）
  const textW = (text, size) => [...text].reduce((w, ch) => w + (/[ -~]/.test(ch) ? size * 0.5 : size), 0);
  D.textW = textW;
  D.label = (p, x, y, text, color, { size = 26, sub } = {}) => {
    const g = el(p, "g", { filter: "url(#drop)" });
    const W = Math.max(textW(text, size), sub ? textW(sub, size * 0.7) : 0) + 34, H = size + 16 + (sub ? size * 0.85 : 0);
    el(g, "rect", { x: x - W / 2, y, width: W, height: H, rx: 2, fill: "url(#paper)" });
    el(g, "rect", { x: x - W / 2, y, width: 6, height: H, fill: color });
    el(g, "text", { x: x + 3, y: y + size + 3, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": size, fill: C.ink }, text);
    if (sub) el(g, "text", { x: x + 3, y: y + size + 6 + size * 0.8, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 600, "font-size": size * 0.7, fill: "#6b5a44" }, sub);
    return g;
  };

  // 博物馆标本卡：rows = [[键, 值, 值2?], ...]
  D.specimen = (p, id, x, y, w, { color, name, rows }) => {
    const lh = 54;
    const h = 92 + rows.reduce((a, r) => a + lh + (r[2] ? 40 : 0), 0) + 18;
    const g = D.wrap(p, id, { opacity: 0 }, true);
    const inner = el(g, "g", { filter: "url(#drop)" });
    el(inner, "rect", { x, y, width: w, height: h, fill: "url(#paper)" });
    el(inner, "rect", { x: x + 10, y: y + 10, width: w - 20, height: h - 20, fill: "none", stroke: C.ink, "stroke-opacity": 0.7, "stroke-width": 1.6 });
    el(inner, "rect", { x: x + 30, y: y + 32, width: 32, height: 32, fill: color });
    el(inner, "text", { x: x + 78, y: y + 61, "font-family": "DSerif", "font-weight": 900, "font-size": 38, fill: C.ink }, name);
    el(inner, "line", { x1: x + 30, y1: y + 86, x2: x + w - 30, y2: y + 86, stroke: C.ink, "stroke-opacity": 0.35, "stroke-width": 1.2 });
    let ty = y + 86;
    rows.forEach(([k, v, v2]) => {
      ty += lh;
      el(inner, "text", { x: x + 30, y: ty - 10, "font-family": "DSerif", "font-weight": 600, "font-size": 28, fill: "#6b5a44" }, k);
      const vx = x + 30 + textW(k, 28) + 16;
      el(inner, "text", { x: vx, y: ty - 10, "font-family": "DSerif", "font-weight": 800, "font-size": 34, fill: C.ink }, v);
      if (v2) { ty += 40; el(inner, "text", { x: vx, y: ty - 10, "font-family": "DSerif", "font-weight": 800, "font-size": 34, fill: C.ink }, v2); }
    });
    return { g, id, h, x, y, w };
  };

  D.badge = (p, x, y, rot = 0) => {
    const g = el(p, "g", { transform: `rotate(${rot} ${x} ${y})`, opacity: 0.93 });
    el(g, "path", { d: `M${x - 22} ${y - 70} L${x} ${y - 120} L${x + 22} ${y - 70}`, fill: "none", stroke: "#2b6fd6", "stroke-width": 6 });
    el(g, "rect", { x: x - 52, y: y - 72, width: 104, height: 140, rx: 10, fill: "#f6efe0", stroke: "#000", "stroke-opacity": 0.25, "stroke-width": 2 });
    el(g, "rect", { x: x - 18, y: y - 80, width: 36, height: 14, rx: 4, fill: "#8a8a8a" });
    el(g, "rect", { x: x - 30, y: y - 50, width: 60, height: 62, rx: 4, fill: "#c9bda5" });
    el(g, "circle", { cx: x, cy: y - 28, r: 13, fill: "#7a6a55" });
    el(g, "path", { d: `M${x - 24} ${y + 12} C${x - 22} ${y - 8} ${x + 22} ${y - 8} ${x + 24} ${y + 12} Z`, fill: "#7a6a55" });
    el(g, "rect", { x: x - 34, y: y + 24, width: 68, height: 8, rx: 3, fill: "#7a6a55" });
    el(g, "rect", { x: x - 26, y: y + 40, width: 52, height: 6, rx: 3, fill: "#b0a28a" });
    return g;
  };

  D.bubble = (p, x, y, text, { rot = 0, size = 26, fill = "#f6efe0", ink = C.ink, tail = "l" } = {}) => {
    const g = el(p, "g", { transform: `rotate(${rot} ${x} ${y})`, opacity: 0.94 });
    const W = textW(text, size) + 36, H = size + 26;
    el(g, "rect", { x, y, width: W, height: H, rx: H / 2, fill });
    const tx = tail === "l" ? x + 16 : x + W - 16;
    el(g, "path", { d: `M${tx - 8} ${y + H - 4} L${tx + (tail === "l" ? -10 : 10)} ${y + H + 12} L${tx + 10} ${y + H - 4} Z`, fill });
    el(g, "text", { x: x + W / 2, y: y + H / 2 + size * 0.36, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 700, "font-size": size, fill: ink }, text);
    return g;
  };

  // 漂浮微尘（每帧缓慢上飘）
  D.dust = (p, { n = 110, seed = 5, y1 = 1500 } = {}) => {
    const r = D.rng(seed), g = el(p, "g"), pts = [];
    for (let i = 0; i < n; i++) {
      const big = r() < 0.12;
      pts.push({ x: r() * 1080, y: r() * y1, v: 4 + r() * 12, w: 0.5 + r(), ph: r() * 6.28, base: (big ? 0.18 : 0.35) * (0.4 + r() * 0.6),
        el: el(g, "circle", { cx: 0, cy: 0, r: big ? 3 + r() * 3 : 0.8 + r() * 1.6, fill: "#e9c88a", filter: big ? "url(#blur6)" : null }) });
    }
    D.onFrame((t) => {
      for (const p of pts) {
        const y = ((p.y - t * p.v) % y1 + y1) % y1;
        p.el.setAttribute("cx", D.f(p.x + Math.sin(t * 0.3 + p.ph) * 14));
        p.el.setAttribute("cy", D.f(y));
        p.el.setAttribute("opacity", D.f(p.base * (0.6 + 0.4 * Math.sin(t * p.w + p.ph))));
      }
    });
    return g;
  };
})();

// 剪报：真实网页截图贴在纸上（两角胶带、底部注明来源）。整体是可动画的包装组；倾斜写在内层，不参与 GSAP。
(function () {
  const D = window.D, C = D.C, el = D.el;
  D.clipping = (p, id, src, x, y, w, ar, { rot = -2, label = "" } = {}) => {
    const h = Math.round(w / ar), pad = 14, lh = label ? 46 : 0;
    const g = D.wrap(p, id, { opacity: 0 }, true);
    const inner = el(g, "g", { transform: `rotate(${rot} ${x + w / 2} ${y + h / 2})`, filter: "url(#drop)" });
    el(inner, "rect", { x: x - pad, y: y - pad, width: w + pad * 2, height: h + pad * 2 + lh, fill: "url(#paper)" });
    el(inner, "image", { href: `assets/web/${src}`, x, y, width: w, height: h, preserveAspectRatio: "xMidYMid slice" });
    el(inner, "rect", { x, y, width: w, height: h, fill: "none", stroke: C.ink, "stroke-opacity": 0.25, "stroke-width": 1.2 });
    if (label) el(inner, "text", { x: x + w, y: y + h + pad + 26, "text-anchor": "end", "font-family": "DSerif", "font-weight": 700, "font-size": 24, fill: "#6b5a44" }, label);
    [[x - 6, -14], [x + w - 64, 12]].forEach(([tx, r]) => el(inner, "rect", { x: tx, y: y - pad - 14, width: 70, height: 26, fill: "#e8dcb8", opacity: 0.75, transform: `rotate(${r} ${tx + 35} ${y - pad - 1})` }));
    return { g, id, x, y, w, h: h + pad * 2 + lh };
  };
  // 出现 / 收起
  D.clipAt = (id, t0, t1) => D.step(() => {
    D.tl.fromTo(`#${id}`, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, t0);
    D.tl.to(`#${id}`, { opacity: 0, y: -16, duration: 0.35, ease: "power2.in" }, t1 - 0.35);
  });
})();
