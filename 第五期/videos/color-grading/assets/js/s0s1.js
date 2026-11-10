// S0 钩子（0–10.69）：5000 万像素 → 照片详情 1250 万 → 4 合 1 → 每格只量一种颜色 → 剩下的是算出来的
// S1 片名（10.69–17.05）
(function () {
  const D = window.D, C = D.C, E = D.ease;

  // 主图镜头：focus 是图上一点（原图像素坐标），落在屏幕 (cx, cy)，S 是放大倍数
  D.cam = (g, P, cx, cy, S) => g.setAttribute("transform", `translate(${D.f(cx - P[0] * S)} ${D.f(cy - P[1] * S)}) scale(${Math.round(S * 10000) / 10000})`);
  // 全屏铺满（cover）时，图上一点在屏幕上的位置
  D.coverPt = (P) => [P[0] * 1.25, P[1] * 1.25 - 100];

  // 像素网格：以 PX.orange.block（16×10）为数据，橙子那一格落在屏幕中心，每格 cell 像素
  D.pixelGrid = (parent, { cell = 110 } = {}) => {
    const blk = PX.orange.block, rows = blk.length, cols = blk[0].length;
    const g = D.g(parent), cells = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = 960 + (i - 8 - 0.5) * cell, y = 540 + (j - 5 - 0.5) * cell;
      const rgb = blk[j][i], ch = j % 2 === 0 ? (i % 2 === 0 ? 0 : 1) : (i % 2 === 0 ? 1 : 2);
      const cg = D.g(g);
      const subs = [0, 1, 2, 3].map(() => D.el(cg, "rect", { rx: 4 }));
      const lab = D.el(cg, "text", { x: x + cell / 2, y: y + cell / 2 + 10, "text-anchor": "middle", class: "mono", "font-size": 30, fill: "#fff", stroke: "rgba(0,0,0,.4)", "stroke-width": 4, "paint-order": "stroke" });
      const tri = [0, 1, 2].map((k) => D.el(cg, "text", { x: x + cell / 2, "text-anchor": "middle", class: "mono", "font-size": 23, fill: "#fff", stroke: "rgba(0,0,0,.55)", "stroke-width": 4, "paint-order": "stroke" }, String(rgb[k])));
      cells.push({ x, y, rgb, ch, subs, lab, tri, i, j });
    }
    // gap: 子格间距（>0 时显示 4 个子格）；mono: 0 全彩 → 1 只剩自己那一种颜色；fill: 0..1 缺的两个数流进来
    const set = ({ gap = 0, mono = 0, label = 0, fill = 0 } = {}) => {
      for (const c of cells) {
        const only = [0, 0, 0]; only[c.ch] = c.rgb[c.ch];
        const m = mono * (1 - fill);
        const col = c.rgb.map((v, k) => Math.round(D.lerp(v, only[k], m)));
        const fillc = `rgb(${col.join(",")})`;
        const pad = 2 + gap * 0.5, s = (cell - 2 * pad - gap) / 2;
        c.subs.forEach((r, k) => {
          const sx = c.x + pad + (k % 2) * (s + gap), sy = c.y + pad + Math.floor(k / 2) * (s + gap);
          if (gap > 0.01) { D.attr(r, "x", sx); D.attr(r, "y", sy); D.attr(r, "width", s); D.attr(r, "height", s); r.style.display = ""; }
          else if (k === 0) { D.attr(r, "x", c.x + 2); D.attr(r, "y", c.y + 2); D.attr(r, "width", cell - 4); D.attr(r, "height", cell - 4); r.style.display = ""; }
          else r.style.display = "none";
          D.attr(r, "fill", fillc);
        });
        D.attr(c.lab, "opacity", label * (1 - D.clamp(fill * 3)));
        if (c.lab.textContent !== String(c.rgb[c.ch])) c.lab.textContent = c.rgb[c.ch];
        // 三个数：自己量的那个不动，另外两个从邻居方向滑进来
        c.tri.forEach((tx, k) => {
          const own = k === c.ch, kk = own ? 1 : D.clamp(fill * 1.6 - (k > c.ch ? 0.3 : 0));
          D.attr(tx, "opacity", fill > 0 ? (own ? D.clamp(fill * 3) : kk) : 0);
          D.attr(tx, "y", c.y + 34 + k * 30);
          D.attr(tx, "fill", own ? "#fff" : "#ffd2a8");
          tx.setAttribute("transform", own ? "" : `translate(${D.f((1 - kk) * (k < c.ch ? -60 : 60))} 0)`);
        });
      }
    };
    return { g, set, cells };
  };

  D.scene01 = function () {
    const L = D.L.mid;
    const s0 = D.g(L);
    D.onFrame((t) => D.op(s0, t < 10.9 ? 1 : 1 - D.clamp((t - 10.9) / 0.3)));

    // --- 虚化的主图做底（0–4.6） ---
    const bgP = D.photo(s0, "assets/img/hero.jpg", { raw: true });
    bgP.img.setAttribute("filter", "url(#blur22)");
    D.tf(bgP.g, -40, -130, 1.3);
    const dim = D.el(s0, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#000", opacity: 0.5 });
    D.onFrame((t) => { const k = 1 - D.prog(t, 4.2, 0.5, E.lin); D.op(bgP.g, k); D.op(dim, 0.5 * k); });

    // --- 参数宣传卡（通用，不出现品牌） ---
    const spec = D.g(s0), specIn = D.g(spec, { filter: "url(#shadowD)" });
    D.el(specIn, "rect", { x: -380, y: -320, width: 760, height: 640, rx: 40, fill: "url(#specbg)" });
    const ring = D.g(specIn, { transform: "translate(230 -170)" });
    [[128, "#2b2f36"], [116, "#101215"], [94, "#3c414a"], [84, "#15171a"], [58, "#0b0c0e"]].forEach(([r, c]) => D.el(ring, "circle", { r, fill: c }));
    D.el(ring, "ellipse", { cx: -20, cy: -24, rx: 17, ry: 12, fill: "#8cbcff", opacity: 0.45, filter: "url(#soft)" });
    D.el(specIn, "rect", { x: -380, y: -320, width: 760, height: 640, rx: 40, fill: "none", stroke: "rgba(255,255,255,.08)", "stroke-width": 2 });
    D.el(specIn, "text", { x: -316, y: 90, "font-size": 210, fill: "url(#metal)", "letter-spacing": -4 }, "5000万");
    D.el(specIn, "text", { x: -310, y: 200, "font-size": 72, fill: "#e8ebef", "letter-spacing": 8 }, "像素");
    D.el(specIn, "text", { x: -306, y: 272, "font-size": 30, "font-weight": 500, fill: "#8d949e", "letter-spacing": 10 }, "超 清 主 摄");
    D.onFrame((t) => {
      if (t > 4.6) return D.op(spec, 0);
      const push = D.lerp(1.0, 1.1, D.clamp(t / 2.4));
      const k = D.prog(t, 2.3, 0.45, E.out5);
      const x = D.lerp(900, 520, k), y = D.lerp(600, 500, k), s = D.lerp(push, 0.92, k), r = D.lerp(0, -5, k);
      D.tf(spec, x, y, s, r);
      D.op(spec, 1 - D.prog(t, 4.25, 0.3, E.lin));
    });

    // --- 相册"照片详情"面板（2.18 起从右侧砸进来） ---
    const info = D.g(s0), inIn = D.g(info, { filter: "url(#shadowD)" });
    const PW = 830, PH = 860;
    const ic = D.clipRect(-PW / 2, -PH / 2, PW, PH, 34);
    const inBody = D.g(inIn, { "clip-path": ic.url });
    D.el(inBody, "rect", { x: -PW / 2, y: -PH / 2, width: PW, height: PH, fill: "#fbfaf7" });
    D.el(inBody, "image", { href: "assets/img/hero.jpg", x: -PW / 2, y: -PH / 2 - 40, width: PW, height: PW / 1.5, preserveAspectRatio: "xMidYMid slice" });
    D.el(inBody, "rect", { x: -PW / 2, y: -PH / 2 + 210, width: PW, height: PH, fill: "#fbfaf7" });
    const X0 = -PW / 2 + 48, X1 = PW / 2 - 48, Y0 = -PH / 2 + 270;
    D.el(inBody, "text", { x: X0, y: Y0, "font-size": 34, fill: C.ink }, "照片详情");
    const row = (y, k, v, hot) => {
      if (hot) D.el(inBody, "rect", { x: X0 - 20, y: y - 46, width: X1 - X0 + 40, height: 68, rx: 14, fill: "rgba(236,122,44,.13)", stroke: C.hi, "stroke-width": 3 });
      else D.el(inBody, "rect", { x: X0, y: y + 22, width: X1 - X0, height: 1.5, fill: "#e7e2da" });
      D.el(inBody, "text", { x: X0, y, "font-size": 30, "font-weight": 500, fill: hot ? C.ink : C.ink2 }, k);
      D.el(inBody, "text", { x: X1, y, "text-anchor": "end", class: "mono", "font-size": hot ? 38 : 28, fill: hot ? C.hi : C.ink, "font-weight": hot ? 700 : 400 }, v);
    };
    row(Y0 + 74, "文件", "IMG_20261013_081204.jpg");
    row(Y0 + 154, "尺寸", "4080 × 3072", true);
    row(Y0 + 234, "大小", "3.4 MB");
    const calc = D.el(inBody, "text", { x: X0, y: Y0 + 330, class: "mono", "font-size": 44, fill: C.ink }, "");
    const resG = D.g(inBody);
    D.el(resG, "text", { x: X0, y: Y0 + 460, class: "mono", "font-size": 70, fill: C.ink3 }, "≈");
    D.el(resG, "text", { x: X0 + 64, y: Y0 + 470, "font-size": 118, fill: C.hi, "letter-spacing": -2 }, "1250万");
    D.el(resG, "text", { x: X0 + 470, y: Y0 + 466, "font-size": 48, fill: C.ink }, "像素");
    D.onFrame((t) => {
      if (t < 2.1 || t > 4.6) return D.op(info, 0);
      const k = D.prog(t, 2.18, 0.42, E.back);
      D.tf(info, D.lerp(2500, 1370, k), 540 + (1 - k) * 40, 1, D.lerp(8, 1.5, k));
      D.op(info, 1 - D.prog(t, 4.25, 0.3, E.lin));
      const n = D.prog(t, 2.75, 0.6, E.out) * 12533760;
      calc.textContent = t < 2.7 ? "" : `4080 × 3072 = ${D.fmt(n)}`;
      const p = D.pop(t, 3.35, 0.45);
      D.op(resG, D.clamp((t - 3.35) / 0.15));
      resG.setAttribute("transform", `translate(${X0} ${Y0 + 440}) scale(${D.f(D.lerp(0.6, 1, p))}) translate(${-X0} ${-(Y0 + 440)})`);
    });

    // --- 4.32 起：主图 → 一路放大到像素 ---
    const P = [131.5, 596.5], C0 = D.coverPt(P);
    const zoomG = D.g(s0);
    const hp = D.photo(zoomG, "assets/img/hero.jpg", { raw: true, pixelated: true });
    const gridBg = D.el(s0, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#17191d" });
    const grid = D.pixelGrid(s0);
    const camS = (t) => {
      if (t < 9.55) { const k = D.prog(t, 4.45, 0.95, E.inOut); return Math.exp(D.lerp(Math.log(1.25), Math.log(110), k)); }
      const k = D.prog(t, 9.55, 1.0, E.inOut); return Math.exp(D.lerp(Math.log(110), Math.log(1.25), k));
    };
    D.onFrame((t) => {
      if (t < 4.0) { D.op(zoomG, 0); D.op(grid.g, 0); D.op(gridBg, 0); return; }
      const S = camS(t), lk = (Math.log(S) - Math.log(1.25)) / (Math.log(110) - Math.log(1.25));
      const cx = D.lerp(C0[0], 960, D.clamp(lk * 1.4)), cy = D.lerp(C0[1], 540, D.clamp(lk * 1.4));
      D.cam(hp.g, P, cx, cy, S);
      D.op(zoomG, D.prog(t, 4.0, 0.35, E.lin));
      // 网格：放大到位后出现，缩回去时消失
      const gk = t < 9.55 ? D.prog(t, 5.1, 0.3, E.lin) : 1 - D.prog(t, 9.6, 0.35, E.lin);
      D.op(grid.g, gk); D.op(gridBg, gk);
      grid.g.setAttribute("transform", `translate(${D.f(cx - 960 * (S / 110))} ${D.f(cy - 540 * (S / 110))}) scale(${Math.round((S / 110) * 10000) / 10000})`);
      grid.set({
        gap: D.lerp(14, 0, D.prog(t, 5.55, 0.6, E.inOut)),
        mono: D.prog(t, 6.43, 0.45, E.out),
        label: D.prog(t, 6.75, 0.35, E.out),
        fill: D.prog(t, 8.57, 0.9, E.inOut),
      });
    });
    // 4 合 1 的示意框：中心那一格加一个描边
    const box = D.el(s0, "rect", { x: 960 - 55 - 6, y: 540 - 55 - 6, width: 122, height: 122, rx: 8, fill: "none", stroke: C.hi, "stroke-width": 6 });
    D.onFrame((t) => D.op(box, D.win(t, 5.2, 6.43, 0.25)));

    // --- S1 片名（10.69–17.05） ---
    const s1 = D.g(L);
    const tp = D.photo(s1, "assets/img/hero.jpg", { raw: true });
    tp.img.setAttribute("filter", "url(#blur22)");
    D.tf(tp.g, -40, -130, 1.3);
    const veil = D.el(s1, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: C.paper, opacity: 0.78 });
    // 一排从数字墙取色的小方块，落成标题下的色带
    const band = D.g(s1), sq = [];
    const W = PX.wall, R = D.rng(11);
    for (let i = 0; i < 40; i++) {
      const c = W[13][i];
      sq.push({ e: D.el(band, "rect", { width: 34, height: 34, rx: 5, fill: `rgb(${c.join(",")})` }), x: 280 + i * 34.5, d: R() * 0.8, y0: -60 - R() * 400 });
    }
    D.onFrame((t) => {
      D.op(s1, D.win(t, 10.55, 17.3, 0.35));
      if (t < 10.4 || t > 17.4) return;
      for (const q of sq) {
        const k = D.prog(t, 10.75 + q.d, 0.55, E.out5), fall = D.prog(t, 14.94 + q.d * 0.6, 0.8, E.in);
        D.attr(q.e, "x", q.x); D.attr(q.e, "y", D.lerp(q.y0, 640, k) + fall * 600);
        D.attr(q.e, "opacity", k * (1 - fall));
      }
    });
    const title = "从第一性原理理解像素与调色";
    D.html.push(`<div id="ttl" class="t title" style="left:0;width:1920px;text-align:center;top:420px">${[...title].map((c) => `<span style="display:inline-block">${c}</span>`).join("")}</div>`);
    D.html.push(`<div id="ttl-sub" class="t sub" style="left:0;width:1920px;text-align:center;top:712px">照片，只是一堆数字</div>`);
    let spans = null;
    D.onFrame((t) => {
      const e = D.$("ttl"), s = D.$("ttl-sub");
      const vis = t > 10.6 && t < 17.3;
      D.hop(e, vis ? 1 : 0); D.hop(s, vis ? D.prog(t, 12.82, 0.5) * (1 - D.prog(t, 14.94, 0.6)) : 0);
      if (!vis) return;
      spans = spans || [...e.children];
      spans.forEach((sp, i) => {
        const k = D.prog(t, 11.1 + i * 0.07, 0.5, E.back), fall = D.prog(t, 14.94 + i * 0.06, 0.9, E.in);
        sp.style.opacity = D.f(D.clamp((t - 11.1 - i * 0.07) / 0.2) * (1 - fall));
        sp.style.transform = `translateY(${D.f((1 - k) * 60 + fall * 500)}px)`;
      });
    });
  };
})();
