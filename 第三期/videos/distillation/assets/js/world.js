// 背景层（微粒、网格地面、幽灵字）和贯穿全片的主角：老师模型（线框神经网络）、学生晶体、手机、机柜。
(function () {
  const D = window.D, C = D.C, tl = D.tl;

  D.buildWorld = (svg) => {
    D.defs(svg);
    D.L = {
      bg: D.g(svg, { id: "L-bg" }),
      ghost: D.g(svg, { id: "L-ghost", "data-layout-ignore": "", "aria-hidden": "true" }),
      back: D.g(svg, { id: "L-back" }),
      mid: D.g(svg, { id: "L-mid" }),
      front: D.g(svg, { id: "L-front" }),
    };
    buildBackground();
  };

  // ---------- 背景 ----------
  function buildBackground() {
    const bg = D.L.bg;
    // 中心辉光（呼吸）
    const glowW = D.wrap(bg, "bg-bloom");
    D.el(glowW, "ellipse", { cx: 540, cy: 860, rx: 760, ry: 900, fill: "url(#bloom)", opacity: 0.55 });
    D.step(() => tl.fromTo("#bg-bloom", { opacity: 0.75 }, { opacity: 1, duration: D.BAR * 2, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor(D.DUR / (D.BAR * 2)) - 1), immediateRender: false }, 0));

    // 漂浮微粒：位置向上缓慢漂移，亮度各自闪烁（按时间计算）
    const r = D.rng(21), pts = [];
    const pg = D.g(bg, { id: "bg-particles", fill: C.holo });
    for (let i = 0; i < 180; i++) {
      const p = { x: r() * 1080, y: r() * 1920, r: 0.7 + r() * 2.4, base: 0.15 + r() * 0.7, w: 0.6 + r() * 1.6, ph: r() * 6.28, v: 6 + r() * 22 };
      p.el = D.el(pg, "circle", { cx: p.x, cy: p.y, r: p.r, opacity: p.base });
      pts.push(p);
    }
    D.onFrame((t) => {
      for (const p of pts) {
        let y = p.y - t * p.v;
        y = ((y % 1960) + 1960) % 1960 - 20;
        p.el.setAttribute("cy", D.f(y));
        p.el.setAttribute("opacity", D.f(p.base * (0.55 + 0.45 * Math.sin(t * p.w + p.ph))));
      }
    });

    // 透视网格地面：横线朝镜头缓慢移动
    const gg = D.g(bg, { id: "bg-grid", stroke: C.holo, "stroke-width": 1.4, fill: "none", opacity: 0.32 });
    const y0 = 1560, y1 = 1920, vx = 540, rows = 14;
    for (let j = -13; j <= 13; j++) D.el(gg, "line", { x1: vx + j * 14, y1: y0, x2: vx + j * 150, y2: y1 });
    const hl = [];
    for (let i = 0; i < rows; i++) hl.push(D.el(gg, "line", { x1: 0, x2: 1080, y1: y0, y2: y0 }));
    D.onFrame((t) => {
      hl.forEach((ln, i) => {
        const k = ((i + t * 0.35) % rows) / rows;
        const y = y0 + (y1 - y0) * Math.pow(k, 1.9);
        ln.setAttribute("y1", D.f(y)); ln.setAttribute("y2", D.f(y));
        ln.setAttribute("opacity", D.f(0.2 + 0.8 * k));
      });
    });
    D.gridY = (y) => {}; // 预留：以后段落可能要移动地面
  }

  // 幽灵字：大号半透明字，缓慢横向漂移（装饰，不参与可读性检查）
  let ghostN = 0;
  D.ghost = (word, t0, t1, o = {}) => {
    const id = `ghost-${ghostN++}`;
    const g = D.wrap(D.L.ghost, id, { opacity: 0 });
    D.el(g, "text", { x: o.x ?? 540, y: o.y ?? 1000, "text-anchor": "middle", "font-family": o.mono ? "DMono" : "DSans", "font-weight": 900, "font-size": o.size || 420, fill: o.color || C.holo, "fill-opacity": o.op || 0.05 }, word);
    D.step(() => {
      tl.fromTo(`#${id}`, { opacity: 0, x: o.dx ?? 60 }, { opacity: 1, x: -(o.dx ?? 60), duration: Math.max(0.8, t1 - t0), ease: "none", immediateRender: false }, t0);
      tl.fromTo(`#${id}`, { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, t0);
      tl.to(`#${id}`, { opacity: 0, duration: 0.5 }, t1 - 0.5);
    });
    return id;
  };

  // ---------- 老师模型：3D 感神经网络，坐标以 (0,0) 为顶部中心 ----------
  D.buildNet = (parent, { id = "teacher", h = 400, w = 860, layers = [10, 16, 20, 20, 16, 6], color = C.holo, seed = 4, tilt = 0.28, lineOp = 0.22, nodeR = 5 } = {}) => {
    const r = D.rng(seed);
    const outer = D.wrap(parent, id);       // GSAP：位置
    const inner = D.wrap(outer, id + "-in"); // GSAP：呼吸
    const ringRx = (li) => (w / 2) * (0.55 + 0.45 * Math.sin((Math.PI * (li + 0.5)) / layers.length));
    const pts = layers.map((n, li) => {
      const y = (h * li) / (layers.length - 1), rx = ringRx(li), ry = rx * tilt * 0.35;
      return Array.from({ length: n }, (_, k) => {
        const a = (2 * Math.PI * k) / n + li * 0.37;
        return { x: rx * Math.cos(a), y: y + ry * Math.sin(a), z: Math.sin(a), li };
      });
    });
    const lines = D.g(inner, { stroke: color, "stroke-width": 1.1, opacity: lineOp, class: "net-lines" });
    for (let li = 0; li < pts.length - 1; li++)
      for (const a of pts[li]) for (const b of pts[li + 1])
        if (r() < 0.42) D.el(lines, "line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, opacity: 0.35 + 0.65 * ((a.z + b.z + 2) / 4) });
    const rings = D.g(inner, { stroke: color, fill: "none", "stroke-width": 1.4, opacity: 0.45 });
    layers.forEach((n, li) => {
      const rx = ringRx(li);
      D.el(rings, "ellipse", { cx: 0, cy: (h * li) / (layers.length - 1), rx, ry: rx * tilt * 0.35 });
    });
    const ng = D.g(inner, { fill: color, filter: "url(#glowS)" });
    const nodes = [];
    for (const L of pts) for (const p of L) {
      p.base = 0.45 + 0.55 * (p.z + 1) / 2;
      p.el = D.el(ng, "circle", { cx: p.x, cy: p.y, r: nodeR * (0.6 + 0.5 * (p.z + 1) / 2), opacity: p.base });
      p.ph = r() * 6.28; p.w = 0.8 + r() * 1.5;
      nodes.push(p);
    }
    // 节点闪烁：信号一层层往下流（按时间计算）
    D.onFrame((t) => {
      for (const p of nodes) {
        const wave = 0.5 + 0.5 * Math.sin(t * 2.2 - p.li * 0.9 + p.ph * 0.3);
        p.el.setAttribute("opacity", D.f(D.clamp(p.base * (0.55 + 0.6 * wave), 0, 1)));
      }
    });
    D.step(() => tl.fromTo(`#${id}-in`, { scale: 1, svgOrigin: `0 ${h / 2}` }, { scale: 1.025, svgOrigin: `0 ${h / 2}`, duration: D.BAR, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor(D.DUR / D.BAR) - 1), immediateRender: false }, 0));
    return { outer, inner, pts, nodes, h, w };
  };

  // ---------- 学生晶体：线框八面体，以 (0,0) 为中心 ----------
  D.buildCrystal = (parent, id, s = 60) => {
    const outer = D.wrap(parent, id);
    const inner = D.wrap(outer, id + "-in");
    D.el(inner, "circle", { cx: 0, cy: 0, r: s * 2.4, fill: "url(#bloom)", opacity: 0.9 });
    const g = D.g(inner, { stroke: C.holo, "stroke-width": 2.6, fill: "none", filter: "url(#glow)" });
    const T = [0, -s * 1.35], B = [0, s * 1.35];
    const ring = [[-s, 0], [-s * 0.35, s * 0.22], [s, 0], [s * 0.35, -s * 0.22]];
    D.el(g, "polygon", { points: [T, ring[0], ring[1], ring[2], B, ring[0]].map((p) => p.join(",")).join(" "), fill: "url(#fillHolo)", stroke: "none" });
    for (const p of ring) { D.el(g, "line", { x1: T[0], y1: T[1], x2: p[0], y2: p[1] }); D.el(g, "line", { x1: B[0], y1: B[1], x2: p[0], y2: p[1] }); }
    D.el(g, "polygon", { points: ring.map((p) => p.join(",")).join(" ") });
    D.el(inner, "circle", { id: id + "-core", cx: 0, cy: 0, r: s * 0.28, fill: C.ice, opacity: 0.0, filter: "url(#glowL)" });
    return outer;
  };

  // 手机线框（中心 0,0）
  D.buildPhone = (parent, id, w = 260, h = 480) => {
    const outer = D.wrap(parent, id);
    const g = D.g(outer, D.stroke({ "stroke-width": 3, opacity: 0.85 }));
    D.el(g, "rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 34, fill: "rgba(61,242,255,0.04)" });
    D.el(g, "rect", { x: -w / 2 + 14, y: -h / 2 + 40, width: w - 28, height: h - 80, rx: 10, opacity: 0.5 });
    D.el(g, "line", { x1: -24, y1: -h / 2 + 20, x2: 24, y2: -h / 2 + 20 });
    return outer;
  };

  // 服务器机柜线框（左上角 0,0）
  D.buildRack = (parent, w = 150, h = 230) => {
    const g = D.g(parent, D.stroke({ "stroke-width": 2.4 }));
    D.el(g, "rect", { x: 0, y: 0, width: w, height: h, rx: 6, fill: "rgba(61,242,255,0.05)" });
    for (let i = 0; i < 7; i++) {
      const y = 16 + i * 30;
      D.el(g, "rect", { x: 14, y, width: w - 28, height: 20, rx: 3, opacity: 0.7 });
      D.el(g, "circle", { cx: w - 30, cy: y + 10, r: 3.5, fill: i % 3 === 0 ? C.heat : C.holo, stroke: "none" });
    }
    return g;
  };
})();
