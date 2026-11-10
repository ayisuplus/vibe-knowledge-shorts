// 全息化学蒸馏装置（开场 S1 与结尾 S9 共用）。坐标与样张 A 一致。
(function () {
  const D = window.D, C = D.C, tl = D.tl;
  const FY = 1560; // 地面

  D.buildStill = (parent) => {
    const cam = D.wrap(parent, "still-cam");
    const root = D.wrap(cam, "still");
    const R = { root };
    const part = (id) => D.wrap(root, id);

    // 冷凝管内的热→冷渐变
    const cg = D.el(D.defsEl, "linearGradient", { id: "cool", gradientUnits: "userSpaceOnUse", x1: 668, y1: 515, x2: 170, y2: 1200 });
    D.el(cg, "stop", { offset: 0, "stop-color": C.heat });
    D.el(cg, "stop", { offset: 0.45, "stop-color": "#ffe9b8" });
    D.el(cg, "stop", { offset: 1, "stop-color": C.holo });
    const clip = D.el(D.defsEl, "clipPath", { id: "bulb" });
    D.el(clip, "circle", { cx: 700, cy: 840, r: 158 });
    const rclip = D.el(D.defsEl, "clipPath", { id: "recv" });
    D.el(rclip, "path", { d: `M140 1330 H200 V1372 L300 ${FY - 14} Q306 ${FY} 290 ${FY} H50 Q34 ${FY} 40 ${FY - 14} L140 1372 Z` });

    // 铁架台、升降台、三脚架
    const frame = part("st-frame");
    const stand = D.g(frame, { opacity: 0.55 });
    D.path(stand, `M930 360 V${FY} M840 ${FY} H1010`);
    D.path(stand, "M930 630 H735", { "stroke-width": 2.4 });
    D.el(stand, "rect", { x: 722, y: 618, width: 24, height: 26, rx: 4, fill: "none", stroke: C.holo, "stroke-width": 2.4 });
    const jack = D.g(frame, { opacity: 0.6 });
    D.path(jack, `M545 1300 H855 M545 ${FY - 4} H855`);
    D.path(jack, `M575 1306 L825 ${FY - 10} M825 1306 L575 ${FY - 10}`, { "stroke-width": 2.4 });
    D.el(jack, "circle", { cx: 700, cy: (1306 + FY - 10) / 2, r: 7, fill: "none", stroke: C.holo, "stroke-width": 2.4 });
    const tri = D.g(frame, { opacity: 0.7 });
    D.path(tri, "M560 1012 H840");
    D.path(tri, "M585 1012 L560 1300 M815 1012 L840 1300", { "stroke-width": 2.6 });
    for (let x = 575; x <= 825; x += 18) D.el(tri, "path", { d: `M${x} 1006 L${x + 10} 1018`, stroke: C.holo, "stroke-width": 1.2 });

    // 圆底烧瓶 + 沸腾的液体
    const flask = part("st-flask");
    D.el(flask, "path", { d: "M670 680 V540 H730 V680 A160 160 0 1 1 670 680 Z", ...D.glass() });
    const liq = D.g(flask, { "clip-path": "url(#bulb)" });
    D.el(liq, "rect", { x: 520, y: 870, width: 360, height: 160, fill: "url(#fillHolo)", opacity: 1 });
    const surf = D.el(liq, "path", { d: "", stroke: C.holo, "stroke-width": 3, fill: "none", filter: "url(#glowS)" });
    const rb = D.rng(5), bubbles = [];
    for (let i = 0; i < 30; i++) {
      const b = { x: 570 + rb() * 260, y0: 880 + rb() * 120, r: 3 + rb() * 9, v: 40 + rb() * 70, ph: rb() };
      b.el = D.el(liq, "circle", { cx: b.x, cy: b.y0, r: b.r, fill: "none", stroke: C.ice, "stroke-width": 2, opacity: 0.6 });
      bubbles.push(b);
    }
    // 升起的蒸汽
    const wisps = [];
    for (let i = 0; i < 5; i++) {
      const x = 660 + i * 20;
      wisps.push(D.el(flask, "path", { d: `M${x} 850 C${x - 30} 780 ${x + 30} 720 ${x} 660 S${x - 20} 580 ${x} 530`, fill: "none", stroke: C.heat, "stroke-width": 2.2, "stroke-linecap": "round", opacity: 0.35 + 0.1 * i, filter: "url(#glow)", "stroke-dasharray": "60 50" }));
    }

    // 蒸馏头 + 温度计
    const head = part("st-head");
    D.el(head, "path", { d: "M670 540 V480 H730 V540", ...D.glass({ fill: "none" }) });
    D.path(head, "M700 350 V600", { stroke: C.ice, "stroke-width": 2.4 });
    const merc = D.el(head, "line", { x1: 700, y1: 600, x2: 700, y2: 470, stroke: C.heat, "stroke-width": 4.5, "stroke-linecap": "round", filter: "url(#glowS)" });
    D.el(head, "circle", { cx: 700, cy: 606, r: 10, fill: C.heat, filter: "url(#glowS)" });
    D.el(head, "rect", { x: 686, y: 338, width: 28, height: 14, rx: 3, fill: "none", stroke: C.holo, "stroke-width": 2 });
    for (let y = 380; y <= 580; y += 25) D.el(head, "path", { d: `M700 ${y} h12`, stroke: C.ice, "stroke-width": 1.5, opacity: 0.7 });

    // 冷凝管
    const cond = part("st-cond");
    const P0 = [668, 515], P1 = [170, 1200];
    const ux = P1[0] - P0[0], uy = P1[1] - P0[1], L = Math.hypot(ux, uy), nx = -uy / L, ny = ux / L;
    const at = (t, off = 0) => [P0[0] + ux * t + nx * off, P0[1] + uy * t + ny * off];
    const q = (p) => D.f(p[0]) + " " + D.f(p[1]);
    const j0 = 0.16, j1 = 0.86, RR = 40;
    D.el(cond, "path", { d: `M${q(at(j0, RR))} L${q(at(j1, RR))} Q${q(at(j1 + 0.035))} ${q(at(j1, -RR))} L${q(at(j0, -RR))} Q${q(at(j0 - 0.035))} ${q(at(j0, RR))} Z`, ...D.glass({ fill: "rgba(61,242,255,0.07)" }) });
    const wi = at(j1 - 0.05, -RR), wo = at(j0 + 0.05, RR);
    D.path(cond, `M${q(wi)} l${D.f(-nx * 46)} ${D.f(-ny * 46)}`, { "stroke-width": 7, opacity: 0.7 });
    D.path(cond, `M${q(wo)} l${D.f(nx * 46)} ${D.f(ny * 46)}`, { "stroke-width": 7, opacity: 0.7 });
    D.el(cond, "line", { x1: P0[0], y1: P0[1], x2: P1[0], y2: P1[1], stroke: "url(#cool)", "stroke-width": 16, "stroke-linecap": "round", opacity: 0.25 });
    D.el(cond, "line", { x1: P0[0], y1: P0[1], x2: P1[0], y2: P1[1], stroke: "url(#cool)", "stroke-width": 4, "stroke-linecap": "round", filter: "url(#glow)" });
    const drips = [];
    for (let i = 0; i < 14; i++) drips.push(D.el(cond, "circle", { cx: 0, cy: 0, r: 4.5, fill: C.ice, filter: "url(#glowS)", opacity: 0.9 }));
    D.path(cond, "M170 1200 V1330");

    // 锥形瓶（接收瓶）
    const recv = part("st-recv");
    D.el(recv, "path", { d: `M140 1330 H200 V1372 L300 ${FY - 14} Q306 ${FY} 290 ${FY} H50 Q34 ${FY} 40 ${FY - 14} L140 1372 Z`, ...D.glass() });
    const lvl = D.g(recv, { "clip-path": "url(#recv)" });
    const lvlW = D.wrap(lvl, "st-level");
    D.el(lvlW, "rect", { x: 30, y: 1496, width: 290, height: 80, fill: C.holo, opacity: 0.35, filter: "url(#glowS)" });
    D.el(lvlW, "line", { x1: 30, y1: 1496, x2: 320, y2: 1496, stroke: C.holo, "stroke-width": 3, filter: "url(#glowS)" });
    // 落下的液滴（每次一个新元素，按时间表动画）
    R.dropAt = (id, t, glow = 1) => {
      const w = D.wrap(recv, id, { opacity: 0 });
      D.el(w, "path", { d: "M170 1336 C184 1358 186 1372 170 1378 C154 1372 156 1358 170 1336 Z", fill: C.ice, filter: glow > 1 ? "url(#glowL)" : "url(#glow)" });
      const rp = D.wrap(recv, id + "-rip", { opacity: 0 });
      D.el(rp, "ellipse", { cx: 170, cy: 1497, rx: 50, ry: 7, fill: "none", stroke: C.ice, "stroke-width": 2.4 });
      D.el(rp, "ellipse", { cx: 170, cy: 1497, rx: 86, ry: 11, fill: "none", stroke: C.holo, "stroke-width": 1.6, opacity: 0.6 });
      D.step(() => {
        tl.fromTo(`#${id}`, { opacity: 1, y: 0 }, { y: 130, duration: 0.42, ease: "power2.in", immediateRender: false }, t - 0.42);
        tl.set(`#${id}`, { opacity: 0 }, t);
        tl.fromTo(`#${id}-rip`, { opacity: 1, scale: 0.3, svgOrigin: "170 1497" }, { opacity: 0, scale: 1.8 * glow, svgOrigin: "170 1497", duration: 0.9, ease: "power2.out", immediateRender: false }, t);
      });
    };

    // 酒精灯（火焰在 S4 会飞去变成温度旋钮的中心）
    const lamp = part("st-lamp");
    D.el(lamp, "path", { d: "M630 1298 L645 1205 Q700 1185 755 1205 L770 1298 Z", ...D.glass() });
    D.el(lamp, "rect", { x: 688, y: 1166, width: 24, height: 30, rx: 4, fill: "none", stroke: C.holo, "stroke-width": 2.6 });
    const flameW = D.wrap(root, "st-flame");
    const flameIn = D.g(flameW, {});
    D.el(flameIn, "ellipse", { cx: 700, cy: 1100, rx: 120, ry: 140, fill: "url(#bloomHeat)" });
    D.el(flameIn, "path", { d: "M700 1036 C737 1088 737 1136 700 1168 C663 1136 663 1088 700 1036 Z", fill: "url(#flame)", filter: "url(#glowL)" });
    D.el(flameIn, "path", { d: "M700 1090 C714 1114 714 1138 700 1156 C686 1138 686 1114 700 1090 Z", fill: C.flameCore, opacity: 0.85 });

    // 阶段标签
    R.labels = [];
    const tag = (id, tx, ty, t, c, px, py, anchor = "start") => {
      const w = D.wrap(root, id, { opacity: 0 });
      const ex = anchor === "start" ? tx - 12 : tx + 12;
      D.el(w, "path", { d: `M${px} ${py} L${ex} ${ty - 13}`, stroke: c, "stroke-width": 1.8, opacity: 0.8, fill: "none" });
      D.el(w, "circle", { cx: px, cy: py, r: 5, fill: c });
      D.el(w, "text", { x: tx, y: ty, "font-size": 42, "font-weight": 800, fill: c, filter: "url(#glowS)", "text-anchor": anchor, "font-family": "DSans" }, t);
      R.labels.push({ id, px, py });
    };
    tag("lb-heat", 790, 1120, "加热", C.heat, 728, 1110);
    tag("lb-boil", 880, 860, "沸腾", C.heat, 855, 900);
    tag("lb-vapor", 560, 470, "汽化", C.heatHot, 662, 560, "end");
    tag("lb-cool", 250, 790, "冷凝", C.holo, 400, 868, "end");
    tag("lb-collect", 320, 1460, "收集", C.ice, 228, 1497);

    // 每帧：气泡上升、液面波动、蒸汽流动、冷凝管里的液滴、火焰跳动、温度计
    D.onFrame((t) => {
      if (+getComputedOpacity(root) === 0) return;
      for (const b of bubbles) {
        const k = (t * b.v / 140 + b.ph) % 1;
        b.el.setAttribute("cy", D.f(b.y0 + 20 - k * (b.y0 - 860)));
        b.el.setAttribute("opacity", D.f(0.7 * (1 - k)));
      }
      let d = "M520 872";
      for (let x = 520; x <= 900; x += 20) d += ` L${x} ${D.f(872 + Math.sin(x * 0.05 + t * 7) * 5 + Math.sin(x * 0.11 - t * 4) * 3)}`;
      surf.setAttribute("d", d);
      wisps.forEach((w, i) => w.setAttribute("stroke-dashoffset", D.f(-(t * 120 + i * 37) % 110)));
      drips.forEach((c, i) => {
        const u = (i / drips.length + t * 0.16) % 1;
        const [x, y] = at(u);
        c.setAttribute("cx", D.f(x)); c.setAttribute("cy", D.f(y));
        const amber = t > 150.99 && t < 158;
        c.setAttribute("fill", amber ? C.heat : u < 0.4 ? C.heatHot : C.ice);
        c.setAttribute("r", amber ? 6.5 : 4.5);
      });
      const s = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29);
      const k = 0.05 * Math.sin(t * 11);
      flameIn.setAttribute("transform", `translate(700 1168) matrix(${D.f(1 - 0.04 * Math.sin(t * 13))} 0 ${D.f(k)} ${D.f(s)} 0 0) translate(-700 -1168)`);
      merc.setAttribute("y2", D.f(470 - 6 * Math.sin(t * 0.9)));
    });
    // 只在看得见时计算（静态 opacity 判断，按元素属性/样式，不读布局）
    function getComputedOpacity(el) { const o = gsap.getProperty(el, "opacity"); return o === undefined ? 1 : o; }

    R.at = at;
    return R;
  };
})();
