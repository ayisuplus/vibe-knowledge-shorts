// S4 亮度与过曝（57.46–68.09）· S5 对比度与逆光（68.09–76.59）· S6 曲线（76.59–87.21）· S7 留白（87.21–93.59）
// 照片上的变化全部是滤镜真算的；柱状图里的数字用同一套公式算。
(function () {
  const D = window.D, C = D.C, E = D.ease;
  const cl = (v) => Math.max(0, Math.min(255, v));

  // 曲线族（输入输出都在 0..1）
  D.CURVE = {
    id: (x) => x,
    bright: (x) => Math.min(1, x + 0.18),
    contrast: (x) => D.clamp(0.5 + (x - 0.5) * 1.6),
    shadow: (x) => x + (Math.pow(x, 0.45) - x) * (1 - x) * (1 - x),
  };

  // 竖条图：vals 0–255，画在 (x, y0) 往上，高 h
  const barRow = (parent, vals, { x, y0, h, w = 54, gap = 22, color = C.ink2 }) => {
    const g = D.g(parent);
    const bs = vals.map((v, i) => ({ r: D.el(g, "rect", { x: x + i * (w + gap), width: w, rx: 6, fill: color }), n: D.el(g, "text", { x: x + i * (w + gap) + w / 2, "text-anchor": "middle", class: "mono", "font-size": 24, fill: C.ink }) }));
    const set = (vs, cols) => vs.forEach((v, i) => { const hh = (cl(v) / 255) * h; D.attr(bs[i].r, "y", y0 - hh); D.attr(bs[i].r, "height", Math.max(hh, 2)); D.attr(bs[i].n, "y", y0 - hh - 12); bs[i].n.textContent = Math.round(cl(v)); if (cols) D.attr(bs[i].r, "fill", cols[i]); });
    return { g, set };
  };

  D.scene47 = function () {
    const L = D.L.mid;

    // 简化演示标签（59.59–127.61）
    D.text("简化演示", 1824, 60, { anchor: "right", cls: "tag", win: [59.59, 127.61], still: true });

    // ---------- S4a 过曝照片砸进来 ----------
    const s4a = D.scene(L, 57.3, 59.8, 0.2);
    const op = D.photo(s4a, "assets/img/bad-overexposed.jpg", { raw: true });
    D.onFrame((t) => {
      if (t < 57.2 || t > 59.9) return;
      const k = D.prog(t, 57.46, 0.35, E.out5), shake = t < 58.0 ? Math.sin((t - 57.46) * 70) * 12 * (1 - (t - 57.46) / 0.54) : 0;
      const s = D.lerp(1.45, 1.27, k);
      D.tf(op.g, 960 - 768 * s + shake, 540 - 512 * s, s);
    });

    // ---------- S4b 亮度 = 加；过曝 = 截断 ----------
    const s4 = D.scene(L, 59.59, 68.3, 0.3);
    const PX0 = 96, PY0 = 110, PW = 880, PH = 660;
    const pc = D.clipRect(PX0, PY0, PW, PH, 26);
    const pg = D.g(s4, { filter: "url(#shadow)" });
    const pin = D.g(pg, { "clip-path": pc.url });
    const ph = D.photo(pin, "assets/img/hero.jpg");
    D.tf(ph.g, PX0 - (905 - 450), PY0 - 0, 1);              // 云那一格落在面板 (450, 166)
    const LX = PX0 + 450, LY = PY0 + 166;
    const lens = D.g(s4);
    D.el(lens, "line", { x1: LX, y1: LY, x2: LX + 0, y2: LY + 120, stroke: "#fffdf9", "stroke-width": 4 });
    const lensC = { x: LX, y: LY + 300 };
    D.el(lens, "circle", { cx: lensC.x, cy: lensC.y, r: 150, fill: "#fffdf9", filter: "url(#shadow)" });
    const pa = D.el(lens, "path", { d: `M${lensC.x} ${lensC.y - 140} A140 140 0 0 0 ${lensC.x} ${lensC.y + 140} Z` });
    const pb = D.el(lens, "path", { d: `M${lensC.x} ${lensC.y - 140} A140 140 0 0 1 ${lensC.x} ${lensC.y + 140} Z` });
    D.el(lens, "line", { x1: lensC.x, y1: lensC.y - 140, x2: lensC.x, y2: lensC.y + 140, stroke: "#e3ddd3", "stroke-width": 3 });
    D.el(lens, "text", { x: lensC.x - 70, y: lensC.y + 16, "text-anchor": "middle", class: "mono", "font-size": 44, fill: C.ink3 }, "A");
    D.el(lens, "text", { x: lensC.x + 70, y: lensC.y + 16, "text-anchor": "middle", class: "mono", "font-size": 44, fill: C.ink3 }, "B");
    D.el(lens, "rect", { x: LX - 10, y: LY - 10, width: 20, height: 20, fill: "none", stroke: C.hi, "stroke-width": 4 });

    // 右侧柱状图：纵轴只画 200–285
    const CHX = 1060, CHY = 110, CHW = 760, CHH = 690;
    const ch = D.g(s4);
    D.el(ch, "rect", { x: CHX, y: CHY, width: CHW, height: CHH, rx: 26, fill: C.card, filter: "url(#shadow)" });
    const y0 = CHY + 538, yTop = CHY + 90, vMin = 200, vMax = 285, Y = (v) => y0 - ((v - vMin) / (vMax - vMin)) * (y0 - yTop);
    D.el(ch, "line", { x1: CHX + 40, y1: y0, x2: CHX + CHW - 40, y2: y0, stroke: "#d8d1c5", "stroke-width": 2 });
    D.el(ch, "text", { x: CHX + CHW - 44, y: CHY + 44, "text-anchor": "end", "font-size": 20, "font-weight": 500, fill: C.ink3 }, "只画 200 以上");
    const ceil = D.el(ch, "line", { x1: CHX + 60, y1: Y(255), x2: CHX + CHW - 40, y2: Y(255), stroke: C.clip, "stroke-width": 4, filter: "url(#glowL)" });
    D.el(ch, "text", { x: CHX + 33, y: Y(255) + 9, "text-anchor": "middle", class: "mono", "font-size": 26, fill: C.clip }, "255");
    const PXA = PX.cloud.a, PXB = PX.cloud.b, cols = [C.r, C.g, C.b];
    const mk = (px, gx, name) => {
      const items = px.map((v, i) => {
        const x = CHX + gx + i * 96;
        return { v, x, over: D.el(ch, "rect", { x, width: 74, fill: "rgba(216,58,46,.18)", stroke: C.clip, "stroke-width": 2, "stroke-dasharray": "6 5" }), bar: D.el(ch, "rect", { x, width: 74, rx: 8, fill: cols[i] }), mark: D.el(ch, "line", { x1: x - 6, x2: x + 80, y1: Y(v), y2: Y(v), stroke: "rgba(35,38,43,.55)", "stroke-width": 4, "stroke-dasharray": "8 6" }), now: D.el(ch, "text", { x: x + 37, "text-anchor": "middle", class: "mono", "font-size": 28, fill: "#fff" }), would: D.el(ch, "text", { x: x + 37, "text-anchor": "middle", class: "mono", "font-size": 26, fill: C.clip, "text-decoration": "line-through" }) };
      });
      D.el(ch, "text", { x: CHX + gx + 133, y: CHY + 600, "text-anchor": "middle", "font-size": 30, fill: C.ink }, `像素 ${name}`);
      const cur = D.el(ch, "text", { x: CHX + gx + 133, y: CHY + 645, "text-anchor": "middle", class: "mono", "font-size": 28, fill: C.ink2 });
      return { items, cur };
    };
    const gA = mk(PXA, 70, "A"), gB = mk(PXB, 410, "B");
    const neq = D.el(ch, "text", { x: CHX + 380, y: CHY + 360, "text-anchor": "middle", "font-size": 110, fill: C.hi }, "≠");
    const sl = D.slider(s4, "亮度", { x: 300, y: 870, w: 1300, min: -60, max: 60 });

    const bIn = (t) => 20 * D.prog(t, 61.44, 0.9, E.inOut);       // 往右拖 +20
    const bBack = (t) => -20 * D.prog(t, 65.17, 0.8, E.inOut);    // 往回拖 −20（截断之后）
    D.onFrame((t) => {
      if (t < 59.4 || t > 68.4) return;
      const b = bIn(t), b2 = bBack(t);
      ph.set({ b, b2 });
      sl.set(b + b2);
      const show = (grp) => {
        const res = grp.items.map((it) => {
          const w = it.v + b, c = cl(w), fin = cl(c + b2);
          D.attr(it.bar, "y", Y(fin)); D.attr(it.bar, "height", y0 - Y(fin));
          const ov = w > 255 && b2 > -0.5 ? 1 : 0;
          D.attr(it.over, "y", Y(w)); D.attr(it.over, "height", Math.max(0, Y(255) - Y(w))); D.op(it.over, ov);
          D.attr(it.would, "y", Y(w) - 10); it.would.textContent = Math.round(w); D.op(it.would, ov);
          D.attr(it.now, "y", Y(fin) + 36); it.now.textContent = Math.round(fin);
          D.op(it.mark, D.prog(t, 61.44, 0.3));
          return Math.round(fin);
        });
        grp.cur.textContent = res.join(" ");
        return res;
      };
      const ra = show(gA), rb = show(gB);
      D.attr(pa, "fill", `rgb(${ra.join(",")})`); D.attr(pb, "fill", `rgb(${rb.join(",")})`);
      D.op(lens, D.prog(t, 60.0, 0.4));
      const hit = t > 63.58 ? Math.max(0, 1 - (t - 63.58) / 0.4) : 0;
      D.attr(ceil, "stroke-width", 4 + hit * 8);
      // 65.97："≠" 变成 "="
      const sw = D.prog(t, 65.97, 0.35);
      neq.textContent = sw > 0.5 ? "=" : "≠";
      D.op(neq, sw > 0 ? D.pop(t, 65.97, 0.4) : 0);
    });

    // ---------- S5 对比度 → 逆光只抬暗部 ----------
    const s5 = D.scene(L, 68.0, 76.75, 0.3);
    const QX = 80, QY = 150, QW = 960, QH = 640;
    const qc = D.clipRect(QX, QY, QW, QH, 26);
    const qg = D.g(s5, { filter: "url(#shadow)" });
    const qin = D.g(qg, { "clip-path": qc.url });
    const hc = D.photo(qin, "assets/img/hero.jpg"); D.tf(hc.g, QX, QY - 10, QW / 1536);
    const bl = D.photo(qin, "assets/img/bad-backlit.jpg"); D.tf(bl.g, QX, QY - 10, QW / 1536);
    const bp = D.g(s5);
    D.el(bp, "rect", { x: 1100, y: 150, width: 740, height: 640, rx: 26, fill: C.card, filter: "url(#shadow)" });
    const BY0 = 720, BH = 500;
    const mid = D.el(bp, "line", { x1: 1130, x2: 1810, y1: BY0 - (128 / 255) * BH, y2: BY0 - (128 / 255) * BH, stroke: C.hi, "stroke-width": 3, "stroke-dasharray": "10 8" });
    const midL = D.el(bp, "text", { x: 1812, y: BY0 - (128 / 255) * BH - 12, "text-anchor": "end", class: "mono", "font-size": 24, fill: C.hi }, "128");
    const rowA = barRow(bp, PX.row, { x: 1146, y0: BY0, h: BH, w: 56, gap: 20 });
    const rowB = barRow(bp, PX.backlit, { x: 1146, y0: BY0, h: BH, w: 56, gap: 20 });
    D.el(bp, "line", { x1: 1130, x2: 1810, y1: BY0, y2: BY0, stroke: "#d8d1c5", "stroke-width": 2 });
    const bpl = D.el(bp, "text", { x: 1470, y: 770, "text-anchor": "middle", "font-size": 26, "font-weight": 500, fill: C.ink2 }, "");
    const sl5 = D.slider(s5, "对比度", { x: 300, y: 880, w: 1300, min: -100, max: 100 });
    D.onFrame((t) => {
      if (t < 67.9 || t > 76.9) return;
      const second = t >= 72.34;
      const k = 1 + 0.45 * D.prog(t, 69.42, 0.9, E.inOut);
      const a = D.prog(t, 74.47, 1.0, E.inOut);
      D.op(hc.g, second ? 1 - D.prog(t, 72.34, 0.35) : 1); D.op(bl.g, second ? D.prog(t, 72.34, 0.35) : 0);
      hc.set({ k });
      const lift = (x) => x + (D.CURVE.shadow(x) - x) * a;
      bl.set({ curve: lift });
      D.op(rowA.g, second ? 0 : 1); D.op(rowB.g, second ? 1 : 0);
      D.op(mid, second ? 0 : 1); D.op(midL, second ? 0 : 1);
      rowA.set(PX.row.map((v) => (v - 128) * k + 128), PX.row.map((v) => (v > 128 ? "#7d858f" : "#4a5058")));
      rowB.set(PX.backlit.map((v) => lift(v / 255) * 255), PX.backlit.map((v) => (v < 90 ? C.hi : "#9aa0a8")));
      bpl.textContent = second ? "暗的数抬起来，亮的几乎不动" : "画面里一排像素的亮度";
      sl5.g.style.display = second ? "none" : "";
      sl5.set((k - 1) * 100);
    });
    const sl5b = D.slider(s5, "阴影", { x: 300, y: 880, w: 1300, min: -100, max: 100 });
    D.onFrame((t) => { sl5b.g.style.display = t >= 72.34 ? "" : "none"; sl5b.set(100 * D.prog(t, 74.47, 1.0, E.inOut)); });

    // ---------- S6 曲线 ----------
    const s6 = D.scene(L, 76.45, 87.3, 0.3);
    const GX = 170, GY = 150, GS = 640;
    D.el(s6, "rect", { x: GX - 70, y: GY - 50, width: GS + 120, height: GS + 150, rx: 26, fill: C.card, filter: "url(#shadow)" });
    for (let i = 0; i <= 4; i++) {
      D.el(s6, "line", { x1: GX + (i * GS) / 4, y1: GY, x2: GX + (i * GS) / 4, y2: GY + GS, stroke: "#ebe5da", "stroke-width": 2 });
      D.el(s6, "line", { x1: GX, y1: GY + (i * GS) / 4, x2: GX + GS, y2: GY + (i * GS) / 4, stroke: "#ebe5da", "stroke-width": 2 });
    }
    D.el(s6, "rect", { x: GX, y: GY, width: GS, height: GS, fill: "none", stroke: C.ink3, "stroke-width": 2 });
    D.el(s6, "text", { x: GX + GS / 2, y: GY + GS + 50, "text-anchor": "middle", "font-size": 26, "font-weight": 500, fill: C.ink2 }, "原来的数 0 → 255");
    D.el(s6, "text", { x: GX - 30, y: GY + GS / 2, "text-anchor": "middle", "font-size": 26, "font-weight": 500, fill: C.ink2, transform: `rotate(-90 ${GX - 30} ${GY + GS / 2})` }, "改完的数 0 → 255");
    D.el(s6, "line", { x1: GX, y1: GY + GS, x2: GX + GS, y2: GY, stroke: C.ink3, "stroke-width": 2, "stroke-dasharray": "8 8" });
    const cp = D.el(s6, "path", { fill: "none", stroke: C.hi, "stroke-width": 8, "stroke-linecap": "round", "stroke-linejoin": "round" });
    const ceil6 = D.el(s6, "line", { x1: GX, y1: GY, x2: GX + GS, y2: GY, stroke: C.clip, "stroke-width": 5 });
    const tagN = ["亮度", "对比度", "阴影"].map((n) => D.el(s6, "text", { "text-anchor": "middle", "font-size": 40, fill: C.ink }, n));
    const rc = D.clipRect(940, 210, 900, 600, 26);
    const rg = D.g(s6, { filter: "url(#shadow)" });
    const r6 = D.photo(D.g(rg, { "clip-path": rc.url }), "assets/img/hero.jpg"); D.tf(r6.g, 940, 210, 900 / 1536);
    // 时间 → 各曲线的权重
    const W6 = (t) => {
      const ks = [[76.59, [1, 0, 0, 0]], [78.45, [1, 0, 0, 0]], [79.1, [0, 1, 0, 0]], [80.84, [0, 1, 0, 0]], [81.5, [0, 0, 1, 0]], [82.7, [0, 0, 1, 0]], [83.35, [0, 0, 0, 1]], [85.0, [0, 0, 0, 1]], [85.9, [1, 0, 0, 0]]];
      return [0, 1, 2, 3].map((i) => D.keyed(ks.map(([tt, w]) => [tt, w[i]]), t));
    };
    D.onFrame((t) => {
      if (t < 76.3 || t > 87.4) return;
      const w = W6(t), f = (x) => w[0] * x + w[1] * D.CURVE.bright(x) + w[2] * D.CURVE.contrast(x) + w[3] * D.CURVE.shadow(x);
      const draw = D.prog(t, 76.59, 1.0, E.inOut);
      let d = "";
      for (let i = 0; i <= 64 * draw; i++) { const x = i / 64; d += `${i ? "L" : "M"}${D.f(GX + x * GS)} ${D.f(GY + GS - f(x) * GS)} `; }
      D.attr(cp, "d", d || "M0 0");
      r6.set({ curve: f });
      D.op(ceil6, w[1] * D.clamp((t - 78.45) / 0.3));
      // 标签：各自贴在对应弯法旁边；85.34 一起飞到线的中间
      const pos = [[GX + GS * 0.3, GY + GS * 0.35], [GX + GS * 0.8, GY + GS * 0.25], [GX + GS * 0.24, GY + GS * 0.62]];
      const tt = [78.45, 80.84, 82.7];
      tagN.forEach((e, i) => {
        const on = D.prog(t, tt[i], 0.35), fly = D.prog(t, 85.34 + i * 0.08, 0.6, E.inOut);
        const x = D.lerp(pos[i][0], GX + GS / 2 + (i - 1) * 150, fly), y = D.lerp(pos[i][1], GY + GS / 2 - 40 - (i === 1 ? 0 : 0), fly);
        D.attr(e, "x", x); D.attr(e, "y", y); D.op(e, on);
        D.attr(e, "fill", fly > 0.5 ? C.hi : C.ink);
      });
    });

    // ---------- S7 留白：三个数一起变 → 各变各的 ----------
    const s7 = D.scene(L, 87.1, 93.75, 0.4);
    const p7 = D.photo(s7, "assets/img/hero.jpg"); D.tf(p7.g, 0, -100, 1.25);
    D.el(s7, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: C.paper, opacity: 0.35 });
    const chips = [0, 1, 2].map((k) => {
      const g = D.g(s7);
      D.el(g, "rect", { x: -150, y: -70, width: 300, height: 140, rx: 30, fill: C.card, filter: "url(#shadow)" });
      D.el(g, "text", { x: -96, y: 26, "text-anchor": "middle", class: "mono", "font-size": 72, fill: cols[k] }, "RGB"[k]);
      return { g, n: D.el(g, "text", { x: 46, y: 26, "text-anchor": "middle", class: "mono", "font-size": 72, fill: C.ink }) };
    });
    D.onFrame((t) => {
      if (t < 87 || t > 93.8) return;
      const free = D.prog(t, 89.35, 0.8, E.inOut), base = PX.orange.rgb;
      const off = [0, 1, 2].map((k) => free * Math.sin((t - 89.35) * (1.6 + k * 0.7) + k * 2) * 36);
      const lock = (1 - free) * Math.sin((t - 87.21) * 2.4) * 30;
      chips.forEach((c, k) => {
        D.tf(c.g, 560 + k * 400, 520 - (lock + off[k] * 2.2), D.pop(t, 87.3 + k * 0.1, 0.45));
        c.n.textContent = Math.round(cl(base[k] + lock + off[k]));
      });
      p7.set({ g: [1 + off[0] / 255, 1 + off[1] / 255, 1 + off[2] / 255], b: lock });
    });
  };
})();
