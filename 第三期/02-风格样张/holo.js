// 第三期 · 科幻全息 · 共用绘图工具（静态样张用，正式片会改写成 HyperFrames 模块）
const NS = "http://www.w3.org/2000/svg";
const H = {
  el(parent, tag, attrs = {}, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    parent.appendChild(e);
    return e;
  },
  rng(seed) { // mulberry32，保证每次渲染一样
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  defs(svg) {
    const d = H.el(svg, "defs");
    const glow = (id, color, std, k = 1) => {
      // userSpaceOnUse：避免纯竖线/横线的包围盒宽度为 0 导致整条线被滤镜吃掉
      const f = H.el(d, "filter", { id, filterUnits: "userSpaceOnUse", x: -200, y: -200, width: 1480, height: 2320 });
      H.el(f, "feGaussianBlur", { in: "SourceGraphic", stdDeviation: std, result: "b1" });
      H.el(f, "feGaussianBlur", { in: "SourceGraphic", stdDeviation: std * 3.5, result: "b2" });
      const m = H.el(f, "feMerge");
      H.el(m, "feMergeNode", { in: "b2" });
      for (let i = 0; i < k; i++) H.el(m, "feMergeNode", { in: "b1" });
      H.el(m, "feMergeNode", { in: "SourceGraphic" });
    };
    glow("glow", "#3df2ff", 3, 2);
    glow("glowS", "#3df2ff", 1.6, 1);
    glow("glowL", "#3df2ff", 7, 2);
    // 竖向全息渐变填充
    const lg = (id, c, a0, a1) => {
      const g = H.el(d, "linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 });
      H.el(g, "stop", { offset: 0, "stop-color": c, "stop-opacity": a0 });
      H.el(g, "stop", { offset: 1, "stop-color": c, "stop-opacity": a1 });
    };
    lg("fillHolo", "#3df2ff", 0.28, 0.04);
    lg("fillHeat", "#ffb547", 0.55, 0.08);
    lg("fillAlert", "#ff4d3a", 0.35, 0.04);
    lg("fillIce", "#e8fdff", 0.18, 0.02);
    const rg = H.el(d, "radialGradient", { id: "flame" , cx: .5, cy: .75, r: .6 });
    H.el(rg, "stop", { offset: 0, "stop-color": "#fff4d6" });
    H.el(rg, "stop", { offset: .35, "stop-color": "#ffd27a" });
    H.el(rg, "stop", { offset: .8, "stop-color": "#ffb547", "stop-opacity": .7 });
    H.el(rg, "stop", { offset: 1, "stop-color": "#ff8a1f", "stop-opacity": 0 });
    return d;
  },
  // 透视网格地面
  grid(svg, { y0 = 1500, y1 = 1920, color = "#3df2ff", op = 0.35, vx = 540, rows = 14, cols = 26 } = {}) {
    const g = H.el(svg, "g", { stroke: color, "stroke-width": 1.4, fill: "none", opacity: op });
    for (let i = 0; i <= rows; i++) {
      const t = i / rows, y = y0 + (y1 - y0) * Math.pow(t, 1.9);
      H.el(g, "line", { x1: 0, y1: y, x2: 1080, y2: y, opacity: 0.25 + 0.75 * t });
    }
    for (let j = -cols / 2; j <= cols / 2; j++) {
      const xb = vx + j * 150;
      H.el(g, "line", { x1: vx + j * 14, y1: y0, x2: xb, y2: y1 });
    }
    return g;
  },
  particles(svg, { n = 140, x0 = 0, y0 = 0, x1 = 1080, y1 = 1920, color = "#3df2ff", seed = 7, rmax = 2.6, op = 0.7 } = {}) {
    const r = H.rng(seed), g = H.el(svg, "g", { fill: color });
    for (let i = 0; i < n; i++) {
      const rr = 0.6 + r() * rmax;
      H.el(g, "circle", { cx: x0 + r() * (x1 - x0), cy: y0 + r() * (y1 - y0), r: rr, opacity: (0.15 + r() * 0.85) * op });
    }
    return g;
  },
  brackets(svg, x, y, w, h, { color = "#3df2ff", len = 34, sw = 3, op = 0.9 } = {}) {
    const g = H.el(svg, "g", { stroke: color, "stroke-width": sw, fill: "none", opacity: op, filter: "url(#glowS)" });
    const p = (d) => H.el(g, "path", { d });
    p(`M${x} ${y + len}V${y}H${x + len}`);
    p(`M${x + w - len} ${y}H${x + w}V${y + len}`);
    p(`M${x + w} ${y + h - len}V${y + h}H${x + w - len}`);
    p(`M${x + len} ${y + h}H${x}V${y + h - len}`);
    return g;
  },
  // 3D 感神经网络：每层是一圈椭圆上的节点，层与层之间随机连线
  net(svg, { cx = 540, top = 160, h = 460, w = 860, layers = [8, 14, 18, 18, 14, 8], color = "#3df2ff", seed = 3, tilt = 0.28, lineOp = 0.22, nodeR = 5 } = {}) {
    const r = H.rng(seed);
    const g = H.el(svg, "g", {});
    const pts = layers.map((n, li) => {
      const y = top + (h * li) / (layers.length - 1);
      const rx = (w / 2) * (0.55 + 0.45 * Math.sin(Math.PI * (li + 0.5) / layers.length));
      const ry = rx * tilt * 0.35;
      return Array.from({ length: n }, (_, k) => {
        const a = (2 * Math.PI * k) / n + li * 0.37;
        return { x: cx + rx * Math.cos(a), y: y + ry * Math.sin(a), z: Math.sin(a) };
      });
    });
    const lines = H.el(g, "g", { stroke: color, "stroke-width": 1.1, opacity: lineOp });
    for (let li = 0; li < pts.length - 1; li++)
      for (const a of pts[li]) for (const b of pts[li + 1])
        if (r() < 0.42) H.el(lines, "line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity: 0.35 + 0.65 * ((a.z + b.z + 2) / 4) });
    // 层环
    const rings = H.el(g, "g", { stroke: color, fill: "none", "stroke-width": 1.4, opacity: 0.45 });
    layers.forEach((n, li) => {
      const y = top + (h * li) / (layers.length - 1);
      const rx = (w / 2) * (0.55 + 0.45 * Math.sin(Math.PI * (li + 0.5) / layers.length));
      H.el(rings, "ellipse", { cx, cy: y, rx, ry: rx * tilt * 0.35 });
    });
    const nodes = H.el(g, "g", { fill: color, filter: "url(#glowS)" });
    for (const L of pts) for (const p of L)
      H.el(nodes, "circle", { cx: p.x, cy: p.y, r: nodeR * (0.6 + 0.5 * (p.z + 1) / 2), opacity: 0.45 + 0.55 * (p.z + 1) / 2 });
    return { g, pts };
  },
  // 线框八面体晶体（学生）
  crystal(svg, cx, cy, s, { color = "#3df2ff", op = 1 } = {}) {
    const g = H.el(svg, "g", { stroke: color, "stroke-width": 2.4, fill: "none", opacity: op, filter: "url(#glow)" });
    const T = [cx, cy - s * 1.35], B = [cx, cy + s * 1.35];
    const ring = [[cx - s, cy], [cx - s * 0.35, cy + s * 0.22], [cx + s, cy], [cx + s * 0.35, cy - s * 0.22]];
    H.el(g, "polygon", { points: [T, ...[ring[0], ring[1], ring[2]], B, ring[0]].map(p => p.join(",")).join(" "), fill: "url(#fillHolo)", stroke: "none" });
    for (const p of ring) { H.el(g, "line", { x1: T[0], y1: T[1], x2: p[0], y2: p[1] }); H.el(g, "line", { x1: B[0], y1: B[1], x2: p[0], y2: p[1] }); }
    H.el(g, "polygon", { points: ring.map(p => p.join(",")).join(" ") });
    return g;
  },
};
