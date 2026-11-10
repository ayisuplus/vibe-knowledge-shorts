// S8 饱和度（93.59–110.61）· S9 白平衡（110.61–127.61）
(function () {
  const D = window.D, C = D.C, E = D.ease;
  const cl = (v) => Math.max(0, Math.min(255, v));
  const cols = [C.r, C.g, C.b];

  D.scene89 = function () {
    const L = D.L.mid;

    // ================= S8 饱和度 =================
    const s8 = D.scene(L, 93.45, 110.8, 0.35);
    const sat = (t) => D.keyed([[97.85, 1], [98.7, 0], [104.22, 0], [105.0, 1], [106.61, 1], [107.3, 2.6]], t);
    // 右侧照片
    const FX = 800, FY = 110, FW = 1040, FH = 693;
    const fc = D.clipRect(FX, FY, FW, FH, 26);
    const fg = D.g(s8, { filter: "url(#shadow)" });
    const fp = D.photo(D.g(fg, { "clip-path": fc.url }), "assets/img/hero.jpg"); D.tf(fp.g, FX, FY, FW / 1536);
    const SP = PX.strawberry, sx = FX + SP.x * (FW / 1536), sy = FY + SP.y * (FW / 1536);
    const mark = D.el(s8, "rect", { x: sx - 14, y: sy - 14, width: 28, height: 28, fill: "none", stroke: "#fff", "stroke-width": 5 });
    const sl = D.slider(s8, "饱和度", { x: 340, y: 880, w: 1260, min: 0, max: 300 });

    // 左侧：草莓那一格的三根竖条 + 它的灰
    D.el(s8, "rect", { x: 90, y: 110, width: 660, height: 440, rx: 26, fill: C.card, filter: "url(#shadow)" });
    D.el(s8, "text", { x: 130, y: 166, "font-size": 28, "font-weight": 500, fill: C.ink2 }, "草莓上的一格");
    const BY0 = 515, BH = 330, BX = 200;
    D.el(s8, "line", { x1: 130, x2: 710, y1: BY0, y2: BY0, stroke: "#d8d1c5", "stroke-width": 2 });
    const bars = [0, 1, 2].map((k) => ({ r: D.el(s8, "rect", { x: BX + k * 150, width: 90, rx: 8, fill: cols[k] }), n: D.el(s8, "text", { x: BX + k * 150 + 45, "text-anchor": "middle", class: "mono", "font-size": 32, fill: C.ink }), a: D.el(s8, "line", { x1: BX + k * 150 + 108, x2: BX + k * 150 + 108, stroke: C.hi, "stroke-width": 4, "marker-end": "" }) }));
    const grey = D.el(s8, "line", { x1: 150, x2: 690, stroke: "#7d858f", "stroke-width": 5, "stroke-dasharray": "14 8" });
    const greyL = D.el(s8, "text", { x: 700, "text-anchor": "end", "font-size": 26, fill: "#7d858f" }, "灰");
    const Lgray = D.W601.reduce((a, w, i) => a + w * SP.rgb[i], 0);
    const Y = (v) => BY0 - (cl(v) / 255) * BH;

    // 左下：灰怎么算
    const wcard = D.g(s8);
    D.el(wcard, "rect", { x: 90, y: 590, width: 660, height: 230, rx: 26, fill: C.card, filter: "url(#shadow)" });
    const avg = D.g(wcard);
    D.el(avg, "text", { x: 420, y: 720, "text-anchor": "middle", class: "mono", "font-size": 46, fill: C.ink }, "灰 = (R + G + B) ÷ 3 ?");
    const strike = D.el(wcard, "line", { x1: 150, x2: 690, y1: 705, y2: 705, stroke: C.clip, "stroke-width": 6 });
    const wts = D.g(wcard);
    [["R", 0.299, C.r], ["G", 0.587, C.g], ["B", 0.114, C.b]].forEach(([n, w, c], i) => {
      D.el(wts, "text", { x: 130, y: 650 + i * 62, class: "mono", "font-size": 34, fill: c }, n);
      D.el(wts, "rect", { x: 180, y: 624 + i * 62, width: 290 * w / 0.6, height: 34, rx: 6, fill: c });
      D.el(wts, "text", { x: 190 + 290 * w / 0.6, y: 651 + i * 62, class: "mono", "font-size": 30, fill: C.ink }, w.toFixed(3));
    });
    // 拜耳小窗（回到 S2 的伏笔）
    const bay = D.g(s8);
    D.el(bay, "rect", { x: 580, y: 606, width: 154, height: 198, rx: 16, fill: "#fffdf9", stroke: C.g, "stroke-width": 4 });
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const c = j % 2 === 0 ? (i % 2 === 0 ? 0 : 1) : (i % 2 === 0 ? 1 : 2); D.el(bay, "rect", { x: 595 + i * 31, y: 620 + j * 31, width: 27, height: 27, rx: 4, fill: cols[c], opacity: c === 1 ? 1 : 0.35 }); }
    D.el(bay, "text", { x: 657, y: 784, "text-anchor": "middle", "font-size": 24, fill: C.g }, "绿占一半");

    D.onFrame((t) => {
      if (t < 93.3 || t > 110.9) return;
      const s = sat(t);
      fp.set({ s });
      sl.set(s * 100, `${Math.round(s * 100)}%`);
      D.op(mark, D.prog(t, 93.8, 0.3));
      const v = SP.rgb.map((c) => Lgray + (c - Lgray) * s);
      bars.forEach((b, k) => {
        D.attr(b.r, "y", Y(v[k])); D.attr(b.r, "height", Math.max(2, BY0 - Y(v[k]))); D.attr(b.n, "y", Y(v[k]) - 12); b.n.textContent = Math.round(cl(v[k]));
        D.attr(b.a, "y1", Y(Lgray)); D.attr(b.a, "y2", Y(v[k])); D.op(b.a, D.win(t, 95.72, 97.9, 0.3));
        const hit = (v[k] >= 255 || v[k] <= 0) && t > 106.8;
        D.attr(b.r, "stroke", hit ? C.clip : "none"); D.attr(b.r, "stroke-width", 6);
      });
      D.attr(grey, "y1", Y(Lgray)); D.attr(grey, "y2", Y(Lgray)); D.attr(greyL, "y", Y(Lgray) - 12);
      D.op(grey, D.prog(t, 93.9, 0.4)); D.op(greyL, D.prog(t, 93.9, 0.4));
      D.op(wcard, D.prog(t, 99.97, 0.35));
      D.op(avg, 1 - D.prog(t, 102.4, 0.3)); D.op(strike, D.win(t, 102.1, 102.75, 0.15));
      D.attr(strike, "x2", D.lerp(150, 690, D.prog(t, 102.1, 0.25)));
      D.op(wts, D.prog(t, 102.55, 0.35));
      D.op(bay, D.prog(t, 104.22, 0.3) * D.pop(t, 104.22, 0.4));
      bay.setAttribute("transform", `translate(0 ${D.f((1 - D.prog(t, 104.22, 0.4, E.back)) * 60)})`);
    });

    // ================= S9 白平衡 =================
    const s9 = D.scene(L, 110.45, 127.8, 0.3);
    const G = PX.rice.gains;
    const raw = D.photo(s9, "assets/img/bad-yellow.jpg", { raw: true });
    const fixWrap = D.g(s9);
    const split = D.clipRect(0, 0, 960, 1080);
    const circ = D.clipCircle(781, 860, 0);
    const fixA = D.g(fixWrap, { "clip-path": split.url });
    const fixB = D.g(fixWrap, { "clip-path": circ.url });
    const fa = D.photo(fixA, "assets/img/bad-yellow.jpg"); fa.set({ g: G });
    const fb = D.photo(fixB, "assets/img/bad-yellow.jpg"); fb.set({ g: G });
    const ring = D.el(s9, "circle", { cx: 781, cy: 860, r: 0, fill: "none", stroke: "#fff", "stroke-width": 5, filter: "url(#glowL)" });
    const divider = D.el(s9, "line", { x1: 960, x2: 960, y1: 0, y2: 1080, stroke: "#fff", "stroke-width": 5 });
    D.text("你眼里", 480, 70, { anchor: "center", cls: "big wh", win: [112.99, 117.0], style: "text-shadow:0 2px 18px rgba(0,0,0,.5)" });
    D.text("相机里", 1440, 70, { anchor: "center", cls: "big wh", win: [112.99, 117.0], style: "text-shadow:0 2px 18px rgba(0,0,0,.5)" });
    D.text('<span class="tipcard" style="font-size:34px;display:inline-block">大脑：自动减掉灯光的黄色</span>', 480, 170, { anchor: "center", win: [115.65, 117.0] });
    D.text("前", 70, 140, { cls: "big wh", win: [125.0, 127.7], style: "text-shadow:0 2px 18px rgba(0,0,0,.5)" });
    D.text("后", 1850, 140, { anchor: "right", cls: "big wh", win: [125.0, 127.7], style: "text-shadow:0 2px 18px rgba(0,0,0,.5)" });
    const tap = D.g(s9);
    D.el(tap, "circle", { r: 32, fill: "none", stroke: "#fff", "stroke-width": 6 });
    const tapRing = D.el(tap, "circle", { r: 32, fill: "none", stroke: "#fff", "stroke-width": 3 });
    // 读数卡：读数 × 系数 = 结果
    const R0 = PX.rice.rgb;
    D.html.push(`<div id="wbcard" class="pxcard" style="left:1150px;top:150px;width:620px"><div class="title">白米饭 · 本该是白的</div>
      ${[0, 1, 2].map((k) => `<div class="row" style="justify-content:space-between"><span class="k ${"rgb"[k]}">${"RGB"[k]}</span><span>${String(R0[k]).padStart(3, " ")}</span><span class="m" id="wbm${k}">× ${G[k].toFixed(2)}</span><span class="q" id="wbq${k}">=</span><span class="o" id="wbo${k}">${Math.round(R0[k] * G[k])}</span></div>`).join("")}</div>`);
    // 镜头：全屏铺满 → 放大 1.4 倍、米饭碗落在 (781, 860)
    const cam = (t) => D.prog(t, 117.0, 0.8, E.inOut);
    D.onFrame((t) => {
      if (t < 110.3 || t > 127.9) return;
      const k = cam(t), s = D.lerp(1.25, 1.4, k), x = D.lerp(0, -115, k), y = D.lerp(-100, -354, k);
      const slam = D.prog(t, 110.61, 0.35, E.out5), shake = t < 111.1 ? Math.sin((t - 110.61) * 70) * 10 * (1 - (t - 110.61) / 0.49) : 0;
      const s0 = s * D.lerp(1.12, 1, slam);
      [raw, fa, fb].forEach((p) => D.tf(p.g, x - (s0 - s) * 768 + shake, y - (s0 - s) * 512, s0));
      // 分屏：112.99 打开，116.98 合上
      const sp = D.prog(t, 112.99, 0.45, E.out) * (1 - D.prog(t, 116.98, 0.4, E.inOut));
      D.attr(split.rect, "width", 960 * sp); D.attr(divider, "x1", 960 * sp); D.attr(divider, "x2", 960 * sp); D.op(divider, sp > 0.02 ? 1 : 0);
      // 125：前后对比，左前右后
      const cmp = D.prog(t, 125.0, 0.5, E.inOut);
      // 圆形扩散：121.23 从碗开始
      const r = 1500 * D.prog(t, 121.23, 2.0, E.inOut);
      D.attr(circ.circ, "r", r); D.attr(ring, "r", r); D.op(ring, r > 0 && r < 1450 ? 1 : 0);
      if (cmp > 0) { D.attr(split.rect, "x", 960 * cmp); D.attr(split.rect, "width", 1920); D.attr(divider, "x1", 960 * cmp); D.attr(divider, "x2", 960 * cmp); D.op(divider, 1); D.op(fixB, 0); }
      else { D.attr(split.rect, "x", 0); D.op(fixB, 1); }
      D.tf(tap, 781, 815, 1); D.op(tap, D.win(t, 119.11, 123.0, 0.25));
      const pulse = ((t - 119.11) % 0.8) / 0.8; D.attr(tapRing, "r", 32 + pulse * 40); D.attr(tapRing, "opacity", 1 - pulse);
      const card = D.$("wbcard");
      D.hop(card, D.win(t, 119.3, 125.0, 0.3));
      const mk = D.prog(t, 120.43, 0.35);
      [0, 1, 2].forEach((i) => { D.hop(D.$(`wbm${i}`), mk); D.hop(D.$(`wbq${i}`), mk); D.hop(D.$(`wbo${i}`), D.prog(t, 120.7 + i * 0.12, 0.3)); });
    });
  };
})();
