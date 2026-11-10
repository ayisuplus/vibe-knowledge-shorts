// S5 没见过的 3（68.09–87.21） · S6 转场（87.21–93.59）
(function () {
  const D = window.D, C = D.C, tl = D.tl;

  // 手写风格数字（60×90 的格子内，左上角为原点）
  const DIG = {
    0: "M30 6 C8 6 4 40 6 50 C8 80 20 86 32 84 C52 82 56 50 54 36 C52 14 42 6 30 6 Z",
    1: "M20 20 L36 6 L36 86 M22 86 L50 86",
    2: "M8 24 C10 6 46 2 50 24 C54 42 30 58 8 84 L54 84",
    3: "M10 14 C24 2 52 6 50 26 C48 40 34 44 26 44 C40 44 56 50 54 66 C52 86 20 90 8 76",
    4: "M40 86 L40 6 L6 60 L56 60",
    5: "M50 8 L14 8 L10 40 C24 32 52 34 52 60 C52 84 22 90 8 76",
    6: "M46 10 C20 4 6 40 8 60 C10 84 48 88 50 62 C52 40 20 40 10 56",
    7: "M8 10 L54 10 L24 86 M18 48 L46 48",
    8: "M30 44 C10 38 10 8 30 8 C52 8 50 38 30 44 C6 50 8 86 30 86 C54 86 54 50 30 44 Z",
    9: "M50 34 C50 6 10 6 10 30 C10 50 46 52 50 34 L46 86",
  };
  const GRID = [7, 3, 1, 8, 0, 5, 2, 8, 3, 6, 5, 9, 3, 0, 5, 4, 8, 1, 6, 9, 8, 3, 2, 5, 1, 5, 7, 0, 3, 8];

  D.scene56 = () => {
    const S5 = 68.09, S6 = 87.21;
    const wall = D.wrap(D.L.mid, "s5", { opacity: 0 });
    const r = D.rng(33);
    const cells = GRID.map((d, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      const cx = 120 + col * 168, cy = 330 + row * 200;
      const id = `dg-${i}`;
      const w = D.wrap(wall, id);
      const rot = (r() - 0.5) * 14, s = 1.45 + (r() - 0.5) * 0.15;
      D.el(w, "rect", { x: cx - 72, y: cy - 88, width: 144, height: 176, rx: 6, fill: "rgba(61,242,255,0.04)", stroke: C.holo, "stroke-opacity": 0.18, "stroke-width": 1.5 });
      const g = D.g(w, { transform: `translate(${cx} ${cy}) rotate(${D.f(rot)}) scale(${D.f(s)}) translate(-30 -46)` });
      D.el(g, "path", { d: DIG[d], ...D.stroke({ stroke: C.ice, "stroke-width": 5 }) });
      return { d, cx, cy, id };
    });
    const threes = cells.filter((c) => c.d === 3), donors = cells.filter((c) => c.d === 5 || c.d === 8);
    // 3 被删掉后留下的虚线空格
    threes.forEach((c, k) => {
      const w = D.wrap(wall, `hole-${k}`, { opacity: 0 });
      D.el(w, "rect", { x: c.cx - 72, y: c.cy - 88, width: 144, height: 176, rx: 6, fill: "none", stroke: C.alert, "stroke-width": 2.5, "stroke-dasharray": "8 8" });
    });
    // 碎片
    const shards = D.wrap(wall, "shards");
    const shardEls = [];
    threes.forEach((c, k) => {
      for (let j = 0; j < 14; j++) {
        const a = D.hash(k * 31 + j) * 6.28, dist = 60 + D.hash(k * 17 + j * 3) * 140;
        const el = D.el(shards, "rect", { x: c.cx - 4, y: c.cy - 4, width: 8, height: 8, fill: j % 3 ? C.ice : C.alert, opacity: 0 });
        shardEls.push({ el, cx: c.cx, cy: c.cy, t0: 72.34 + k * 0.12 + 0.35, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist + 60 });
      }
    });
    // 窗口外也要写入"不可见"状态：跳帧时不能留下上一次的残影
    D.onFrame((t) => {
      if (t < 72 || t > 75.5) { for (const s of shardEls) s.el.setAttribute("opacity", 0); return; }
      for (const s of shardEls) {
        const k = D.clamp((t - s.t0) / 1.1);
        s.el.setAttribute("transform", `translate(${D.f(s.dx * D.ease.out(k))} ${D.f(s.dy * k * k)}) rotate(${D.f(k * 220)} ${s.cx} ${s.cy})`);
        s.el.setAttribute("opacity", D.f(k > 0 && k < 1 ? 1 - k : 0));
      }
    });
    // 红色扫描线
    const scanW = D.wrap(wall, "s5-scan", { opacity: 0 });
    D.el(scanW, "rect", { x: 40, y: 0, width: 1000, height: 4, fill: C.alert, filter: "url(#glow)" });
    D.el(scanW, "rect", { x: 40, y: -60, width: 1000, height: 60, fill: "url(#fillAlert)", transform: "rotate(180 540 -30)" });

    // 拼出来的大 3
    const big = D.wrap(D.L.front, "big3", { opacity: 0 });
    const bigG = D.g(big, { transform: "translate(420 520) scale(4)" });
    const bigPath = D.el(bigG, "path", { d: DIG[3], fill: "none", stroke: C.heatHot, "stroke-width": 3, "stroke-linecap": "round", filter: "url(#glowS)" });
    const L = bigPath.getTotalLength();
    bigPath.setAttribute("stroke-dasharray", D.f(L));
    const targets = Array.from({ length: 70 }, (_, i) => { const p = bigPath.getPointAtLength((L * i) / 69); return [420 + p.x * 4, 520 + p.y * 4]; });
    // 光点：从 5 和 8 身上飘出来，汇到大 3 上
    const motes = D.wrap(D.L.front, "motes", { opacity: 0 });
    const moteEls = targets.map((tg, i) => {
      const src = donors[i % donors.length];
      return { el: D.el(motes, "circle", { cx: src.cx, cy: src.cy, r: 4, fill: C.heatHot, filter: "url(#glowS)" }), sx: src.cx + (D.hash(i) - 0.5) * 60, sy: src.cy + (D.hash(i + 9) - 0.5) * 60, tx: tg[0], ty: tg[1], d: D.hash(i * 7) * 0.6 };
    });
    D.onFrame((t) => {
      if (t < 76 || t > 87.6) return;
      const draw = D.clamp((t - 77.6) / 0.85);
      bigPath.setAttribute("stroke-dashoffset", D.f(L * (1 - draw)));
      for (const m of moteEls) {
        const k = D.ease.inOut(D.clamp((t - 76.7 - m.d) / 1.2));
        const scatter = D.clamp((t - 82.7) / 1.4);
        const x = D.lerp(m.sx, m.tx, k) + (m.tx - 540) * scatter * 0.9;
        const y = D.lerp(m.sy, m.ty, k) + (m.ty - 700) * scatter * 0.9 - scatter * 80;
        m.el.setAttribute("cx", D.f(x + Math.sin(t * 3 + m.d * 20) * 4 * (1 - k)));
        m.el.setAttribute("cy", D.f(y));
        m.el.setAttribute("opacity", D.f((k < 1 ? 0.9 : 0.5) * (1 - scatter)));
      }
    });
    // 8 和 5 连向 3 的细线
    const ties = D.wrap(D.L.front, "ties", { opacity: 0 });
    donors.slice(0, 6).forEach((c) => D.el(ties, "line", { x1: c.cx, y1: c.cy, x2: 540, y2: 700, stroke: C.heat, "stroke-width": 2, "stroke-dasharray": "6 8", opacity: 0.7 }));

    D.text(`<b>Distilling the Knowledge in a Neural Network</b><span>Hinton · Vinyals · Dean · 2015</span>`, 540, 150, null, null, { id: "paper-mini", anchor: "center", cls: "paper mini" });
    D.text("98.6%", 540, 1250, null, null, { id: "stat-986", anchor: "center", cls: "stat" });
    D.ghost("3", 76.59, 87.0, { y: 1300, size: 1100, op: 0.035, mono: true });
    D.ghost("98.6%", 78.45, 87.0, { y: 1330, size: 260, op: 0.05, mono: true });

    D.cap("2015 年，Hinton 团队做过一个实验", S5, 72.34);
    D.cap("把所有的「3」，从学生的课本里删掉", 72.34, 76.59);
    D.cap("学生从没见过 3", 76.59, 78.45);
    D.cap("却认出了 98.6% 的 3", 78.45, 80.84, { sub: "需把「3」的偏置调高一点", subAt: 78.9 });
    D.cap("因为老师一直在说：这个 8 有点像 3，这个 5 也有点像 3", 80.84, S6);

    D.step(() => {
      tl.to(["#teacher"], { opacity: 0, duration: 0.4 }, S5 - 0.3);
      tl.fromTo("#s5", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, S5);
      cells.forEach((c, i) => tl.fromTo(`#${c.id}`, { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "steps(1)", immediateRender: true }, S5 + 0.1 + D.hash(i * 5) * 1.2));
      tl.fromTo("#paper-mini", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: true }, S5 + 0.2);
      // 72.34 红色扫描线选中所有的 3，碎掉
      tl.fromTo("#s5-scan", { opacity: 1, y: 230 }, { opacity: 1, y: 1260, duration: 0.9, ease: "power1.inOut", immediateRender: true }, 72.34);
      tl.to("#s5-scan", { opacity: 0, duration: 0.2 }, 73.24);
      threes.forEach((c, k) => {
        const tt = 72.34 + k * 0.12;
        tl.to(`#${c.id}`, { opacity: 0, scale: 1.25, svgOrigin: `${c.cx} ${c.cy}`, duration: 0.3, ease: "power2.in" }, tt + 0.1);
        tl.fromTo(`#hole-${k}`, { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: true }, tt + 0.35);
      });
      // 76.59 其他数字变暗，只留 5 和 8
      cells.filter((c) => c.d !== 3).forEach((c) => tl.to(`#${c.id}`, { opacity: c.d === 5 || c.d === 8 ? 0.9 : 0.22, duration: 0.5 }, 76.59));
      tl.to(threes.map((c, k) => `#hole-${k}`), { opacity: 0.35, duration: 0.5 }, 76.59);
      tl.fromTo("#motes", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, 76.59);
      tl.fromTo("#big3", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, 77.5);
      tl.fromTo("#stat-986", { opacity: 0, scale: 1.8 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.8)", immediateRender: true }, 78.45);
      tl.fromTo("#ties", { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: true }, 80.84);
      tl.to("#stat-986", { opacity: 0, duration: 0.3 }, 80.6);
      tl.fromTo("#big3", { scale: 1, svgOrigin: "540 700" }, { scale: 1.08, svgOrigin: "540 700", duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, 82.7);
      // 87.21 收掉
      tl.to(["#s5", "#big3", "#motes", "#ties", "#paper-mini"], { opacity: 0, duration: 0.4 }, S6 - 0.2);
    });

    // ================= S6 =================
    D.text(`<b>Distilling the Knowledge in a Neural Network</b><span>Geoffrey Hinton · Oriol Vinyals · Jeff Dean</span><span>2015</span>`, 540, 660, null, null, { id: "paper-big", anchor: "center", cls: "paper big" });
    D.text("REJECTED", 540, 860, null, null, { id: "stamp", anchor: "center", cls: "stamp", attrs: "data-layout-allow-overlap" });
    const fleet = D.wrap(D.L.back, "fleet", { opacity: 0 });
    const fleetIds = [];
    for (let i = 0; i < 24; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      const x = 135 + col * 162, y = 860 + row * 130, id = `fl-${i}`;
      const w = D.wrap(fleet, id);
      for (let k = 0; k < 4; k++) {
        const rx = 34 * (0.6 + 0.4 * Math.sin((Math.PI * (k + 0.5)) / 4));
        D.el(w, "ellipse", { cx: x, cy: y + k * 16, rx, ry: rx * 0.12, fill: "none", stroke: C.holo, "stroke-width": 1.6, opacity: 0.7 });
      }
      fleetIds.push(id);
    }
    D.cap("这篇论文，当年被顶级会议拒稿", S6, 89.35, { sub: "据合著者回忆", subAt: S6 + 0.3 });
    D.cap("后来，它成了大模型公司做小模型的常用方法", 89.35, 91.46);
    D.text("到了大模型时代——", 540, 860, null, null, { id: "era", anchor: "center", cls: "heroSub big" });

    D.step(() => {
      tl.fromTo("#paper-big", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, S6);
      tl.fromTo("#stamp", { opacity: 0, scale: 2.4, rotation: -26 }, { opacity: 1, scale: 1, rotation: -12, duration: 0.22, ease: "power4.in", immediateRender: true }, S6 + 0.35);
      tl.to("#stamp", { opacity: 0.18, duration: 1.0, ease: "power1.inOut" }, S6 + 1.0);
      tl.to(["#paper-big", "#stamp"], { y: -380, scale: 0.8, duration: 0.6, ease: "power3.inOut" }, 89.35);
      tl.fromTo("#fleet", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, 89.35);
      fleetIds.forEach((id, i) => tl.fromTo(`#${id}`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.3, ease: "back.out(2)", immediateRender: true }, 89.5 + i * 0.07));
      tl.to(["#paper-big", "#stamp", "#fleet"], { opacity: 0, duration: 0.3 }, 91.3);
      // 91.46 冲进一个巨大的老师
      tl.fromTo("#teacher", { x: 540, y: 300, scale: 3.4, opacity: 0 }, { x: 540, y: 170, scale: 0.9, opacity: 1, duration: 2.1, ease: "power3.out", immediateRender: false }, 91.46);
      tl.fromTo("#era", { opacity: 0, scale: 1.3 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out", immediateRender: true }, 91.46);
      tl.to("#era", { opacity: 0, duration: 0.25 }, 93.35);
    });
  };
})();
