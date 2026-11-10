// S10 滤镜与合成（127.61–148.86）· S11 拍照建议（148.86–157.37）· S12 金句（157.37–160.17）
(function () {
  const D = window.D, C = D.C, E = D.ease;
  const W = D.W601;
  // 和 tools/prep.py 里的胶片风 LUT 同一个公式
  const film = (rgb) => {
    const z = rgb.map((v) => v / 255), lum = z[0] * W[0] + z[1] * W[1] + z[2] * W[2];
    const sh = [-0.025, 0.01, 0.035], hl = [0.03, 0.008, -0.03];
    const f = z.map((v, i) => 0.06 + v * 0.9 + (1 - lum) * sh[i] * 0.9 + lum * hl[i]);
    const l2 = f[0] * W[0] + f[1] * W[1] + f[2] * W[2];
    return f.map((v) => D.clamp(l2 + (v - l2) * 0.9) * 255);
  };

  D.scene1012 = function () {
    const L = D.L.mid;

    // ================= S10a 换色表：照片里六种真实颜色 → 胶片风之后的颜色 =================
    const s10 = D.scene(L, 127.45, 136.3, 0.3);
    const SW = [["天空", 1150, 70, [130, 184, 231]], ["树叶", 560, 210, [89, 114, 70]], ["橙子", 131, 596, [226, 151, 30]], ["草莓", 250, 690, [137, 44, 44]], ["皮肤", 1220, 650, [135, 106, 94]], ["木桌", 300, 860, [123, 77, 40]]];
    const LX = 90, LY = 250, LW = 760, LS = LW / 1536;
    const lc = D.clipRect(LX, LY, LW, 1024 * LS, 22);
    const lg = D.g(s10, { filter: "url(#shadow)" });
    const lp = D.photo(D.g(lg, { "clip-path": lc.url }), "assets/img/hero.jpg", { raw: true }); D.tf(lp.g, LX, LY, LS);
    const tb = D.g(s10);
    D.el(tb, "rect", { x: 930, y: 130, width: 910, height: 720, rx: 26, fill: C.card, filter: "url(#shadow)" });
    D.el(tb, "text", { x: 1150, y: 186, "text-anchor": "middle", "font-size": 28, "font-weight": 500, fill: C.ink2 }, "原来的颜色");
    D.el(tb, "text", { x: 1620, y: 186, "text-anchor": "middle", "font-size": 28, "font-weight": 500, fill: C.ink2 }, "换成");
    const rows = SW.map(([n, x, y, rgb], i) => {
      const out = film(rgb).map(Math.round), ry = 220 + i * 102;
      const mk = D.g(lg);
      D.el(mk, "circle", { cx: LX + x * LS, cy: LY + y * LS, r: 16, fill: "none", stroke: "#fff", "stroke-width": 4 });
      D.el(mk, "text", { x: LX + x * LS, y: LY + y * LS - 26, "text-anchor": "middle", "font-size": 24, fill: "#fff", stroke: "rgba(0,0,0,.5)", "stroke-width": 4, "paint-order": "stroke" }, n);
      const left = D.g(tb), right = D.g(tb);
      D.el(left, "text", { x: 960, y: ry + 50, "font-size": 30, fill: C.ink }, n);
      D.el(left, "rect", { x: 1040, y: ry + 10, width: 80, height: 62, rx: 10, fill: `rgb(${rgb.join(",")})` });
      D.el(left, "text", { x: 1134, y: ry + 52, class: "mono", "font-size": 26, fill: C.ink2 }, rgb.map((v) => String(v).padStart(3, " ")).join(" "));
      D.el(right, "text", { x: 1395, y: ry + 54, "text-anchor": "middle", "font-size": 40, fill: C.hi }, "→");
      D.el(right, "rect", { x: 1440, y: ry + 10, width: 80, height: 62, rx: 10, fill: `rgb(${out.join(",")})` });
      D.el(right, "text", { x: 1534, y: ry + 52, class: "mono", "font-size": 26, fill: C.ink }, out.map((v) => String(v).padStart(3, " ")).join(" "));
      return { mk, left, right, i };
    });
    D.onFrame((t) => {
      if (t < 127.3 || t > 136.4) return;
      rows.forEach((r) => { D.op(r.left, D.prog(t, 127.9 + r.i * 0.12, 0.35)); D.op(r.mk, D.prog(t, 127.9 + r.i * 0.12, 0.35)); D.op(r.right, D.prog(t, 129.85 + r.i * 0.16, 0.35)); r.right.setAttribute("transform", `translate(${D.f((1 - D.prog(t, 129.85 + r.i * 0.16, 0.4)) * -40)} 0)`); });
      D.op(tb, 1 - D.prog(t, 132.66, 0.3)); D.op(lg, 1 - D.prog(t, 132.66, 0.3));
      const sk = D.prog(t, 132.66, 1.5, E.inOut);
      D.op(sweep, D.prog(t, 132.5, 0.25));
      D.attr(swc.rect, "width", 1920 * sk); D.attr(swl, "x1", 1920 * sk); D.attr(swl, "x2", 1920 * sk); D.op(swl, sk > 0 && sk < 1 ? 1 : 0);
    });
    // 132.66：整张主图被扫过，变成胶片风
    const sweep = D.g(s10);
    const sw0 = D.photo(sweep, "assets/img/hero.jpg", { raw: true }); D.tf(sw0.g, 0, -100, 1.25);
    const swc = D.clipRect(0, 0, 0, 1080);
    const sw1 = D.photo(D.g(sweep, { "clip-path": swc.url }), "assets/img/hero-film.jpg", { raw: true }); D.tf(sw1.g, 0, -100, 1.25);
    const swl = D.el(sweep, "line", { y1: 0, y2: 1080, stroke: "#fff", "stroke-width": 6, filter: "url(#glowL)" });
    // ================= S10b 从头调一张（136.12–148.86） =================
    const s10b = D.scene(L, 135.95, 149.1, 0.35);
    const GX = 80, GY = 110, GW = 1200, GH = 800;
    const gc = D.clipRect(GX, GY, GW, GH, 26);
    const gwrap = D.g(s10b);
    const gin = D.g(D.g(gwrap, { filter: "url(#shadow)" }), { "clip-path": gc.url });
    const layers = ["hero-flat", "grade1", "grade2", "grade3", "grade4"].map((n) => { const p = D.photo(gin, `assets/img/${n}.png`, { raw: true }); D.tf(p.g, GX, GY - 0.5, GW / 1536 * 1.0); return p; });
    const cmpC = D.clipRect(GX, GY, 0, GH);
    const before = D.photo(D.g(gin, { "clip-path": cmpC.url }), "assets/img/hero-flat.jpg", { raw: true }); D.tf(before.g, GX, GY, GW / 1536);
    const cmpL = D.el(s10b, "line", { y1: GY, y2: GY + GH, stroke: "#fff", "stroke-width": 6 });
    const stepT = [137.2, 138.24, 139.3, 140.1];
    const steps = ["白平衡", "曲线", "自然饱和度", "滤镜"];
    steps.forEach((n, i) => D.text(`<span class="mono" style="color:#ec7a2c">${i + 1}</span>&nbsp;&nbsp;${n}`, 1360, 250 + i * 130, { cls: "big", id: `st${i}`, style: "font-size:54px" }));
    D.text("直出", GX + 30, GY + 24, { cls: "big wh", win: [140.3, 144.8], style: "font-size:44px;text-shadow:0 2px 14px rgba(0,0,0,.5)" });
    D.text("调完", GX + GW - 30, GY + 24, { anchor: "right", cls: "big wh", win: [140.3, 144.8], style: "font-size:44px;text-shadow:0 2px 14px rgba(0,0,0,.5)" });
    D.onFrame((t) => {
      if (t < 135.9 || t > 149.2) return;
      layers.forEach((p, i) => D.op(p.g, i === 0 ? 1 : D.prog(t, stepT[i - 1], 0.45, E.inOut)));
      steps.forEach((_, i) => { const e = D.$(`st${i}`), k = D.prog(t, stepT[i] - 0.25, 0.35); D.hop(e, D.win(t, 136.4, 145.0, 0.3) * (0.35 + 0.65 * k)); e.style.transform = `translateX(${D.f((1 - k) * 30)}px)`; });
      // 140.10：前后对比，分隔线从右扫到中间
      const ck = D.prog(t, 140.1, 0.7, E.out) * (1 - D.prog(t, 144.6, 0.4));
      const xw = GW * 0.5 * ck;
      D.attr(cmpC.rect, "width", xw); D.attr(cmpL, "x1", GX + xw); D.attr(cmpL, "x2", GX + xw); D.op(cmpL, ck > 0.01 ? 1 : 0);
      // 142.49 起：照片缩小、移到中间
      const z = D.prog(t, 144.9, 1.6, E.inOut);
      const s = D.lerp(1, 0.62, z), x = D.lerp(0, 960 - (GX + GW / 2) * 0.62, z) , y = D.lerp(0, 470 - (GY + GH / 2) * 0.62, z);
      gwrap.setAttribute("transform", `translate(${D.f(x)} ${D.f(y)}) scale(${D.f(s)})`);
      D.op(gwrap, 1 - D.prog(t, 148.3, 0.5));
    });

    // ================= S11 三条拍照建议 =================
    const tips = [
      ["别让亮部顶到 255", "点一下屏幕，往下拉一点曝光"],
      ["想要鲜艳，用「自然饱和度」", "别直接拉「饱和度」"],
      ["灯光下，拿白色的东西校白平衡", "拍完点一下画面里白的地方"],
    ];
    const tipT = [148.86, 151.0, 153.12];
    tips.forEach(([a, b], i) => D.html.push(`<div id="tip${i}" class="t tipcard" style="left:110px;top:${230 + i * 190}px"><span class="n">${i + 1}</span>${a}<small>${b}</small></div>`));
    const s11 = D.scene(L, 148.7, 157.5, 0.3);
    // 右侧示意：一个手机取景框，随当前建议换内容
    const FX = 1180, FY = 170, FW = 620, FH = 620;
    D.el(s11, "rect", { x: FX - 18, y: FY - 18, width: FW + 36, height: FH + 36, rx: 44, fill: "#1b1d22", filter: "url(#shadow)" });
    const fcl = D.clipRect(FX, FY, FW, FH, 30);
    const fin = D.g(s11, { "clip-path": fcl.url });
    const v1 = D.photo(fin, "assets/img/hero.jpg"); D.tf(v1.g, FX - 600, FY, 1.0);
    const v3a = D.photo(fin, "assets/img/bad-yellow.jpg"); D.tf(v3a.g, FX - 330, FY - 400, 1.0);
    const v3c = D.clipCircle(FX + 310, FY + 467, 0);
    const v3 = D.photo(D.g(fin, { "clip-path": v3c.url }), "assets/img/bad-yellow.jpg"); D.tf(v3.g, FX - 330, FY - 400, 1.0); v3.set({ g: PX.rice.gains });
    const v2 = D.g(fin);
    D.el(v2, "rect", { x: FX, y: FY, width: FW, height: FH, fill: C.card });
    const sl2 = [["饱和度", false], ["自然饱和度", true]].map(([n, ok], i) => {
      const y = FY + 220 + i * 200;
      D.el(v2, "text", { x: FX + 50, y: y - 40, "font-size": 34, fill: C.ink }, n);
      D.el(v2, "rect", { x: FX + 50, y: y - 4, width: 440, height: 8, rx: 4, fill: "#d8d1c5" });
      const kn = D.el(v2, "circle", { cy: y, r: 20, fill: "#fff", stroke: C.hi, "stroke-width": 3 });
      D.el(v2, "text", { x: FX + 540, y: y + 18, "text-anchor": "middle", "font-size": 56, fill: ok ? C.g : C.clip }, ok ? "✓" : "✗");
      return kn;
    });
    // 曝光小太阳滑条
    const sun = D.g(fin);
    D.el(sun, "line", { x1: FX + FW - 70, y1: FY + 120, x2: FX + FW - 70, y2: FY + 500, stroke: "#ffd23a", "stroke-width": 4 });
    const sunK = D.el(sun, "circle", { cx: FX + FW - 70, r: 18, fill: "#ffd23a" });
    const tapT = D.el(fin, "circle", { cx: FX + 310, cy: FY + 467, r: 34, fill: "none", stroke: "#fff", "stroke-width": 6 });
    D.onFrame((t) => {
      tips.forEach((_, i) => { const e = D.$(`tip${i}`), k = D.prog(t, tipT[i], 0.5, E.back); D.hop(e, D.win(t, tipT[i], 157.3, 0.3)); if (k > 0) e.style.transform = `translateY(${D.f((1 - k) * 80)}px)`; e.style.opacity = D.f(D.win(t, tipT[i], 157.3, 0.3) * (t > tipT[i + 1] && t < 154.97 ? 0.55 : 1)); });
      if (t < 148.6 || t > 157.6) return;
      const which = t < tipT[1] ? 0 : t < tipT[2] ? 1 : 2;
      D.op(v1.g, which === 0 ? 1 : 0); D.op(sun, which === 0 ? 1 : 0); D.op(v2, which === 1 ? 1 : 0);
      D.op(v3a.g, which === 2 ? 1 : 0); D.op(v3.g, which === 2 ? 1 : 0); D.op(tapT, which === 2 ? D.win(t, 153.5, 154.6, 0.2) : 0);
      // ①：先过曝（亮度 +60），太阳往下拉，回到正常
      const e1 = 60 * (1 - D.prog(t, 149.5, 1.0, E.inOut));
      v1.set({ b: e1 }); D.attr(sunK, "cy", FY + 310 - e1 * 2.6);
      // ②：两根滑块都往右拖
      const k2 = D.prog(t, 151.3, 0.9, E.inOut);
      sl2.forEach((kn) => D.attr(kn, "cx", FX + 50 + 220 + 160 * k2));
      // ③：点白碗，颜色扩散恢复
      D.attr(v3c.circ, "r", 700 * D.prog(t, 154.0, 1.0, E.inOut));
    });

    // ================= S12 金句 =================
    const s12 = D.scene(L, 156.9, 160.5, 0.25);
    D.el(s12, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#121316" });
    const wg = D.g(s12);
    PX.wall.forEach((row, j) => row.forEach((c, i) => {
      const tx = D.el(wg, "text", { x: i * 48 + 24, y: j * 40 + 12, "text-anchor": "middle", class: "mono", "font-size": 12.5, fill: `rgb(${c.map((v) => Math.min(255, v + 40)).join(",")})` });
      c.forEach((v, k) => D.el(tx, "tspan", { x: i * 48 + 24, dy: k === 0 ? 0 : 12.5 }, String(v)));
    }));
    const endP = D.photo(s12, "assets/img/grade4.jpg", { raw: true }); D.tf(endP.g, 0, -100, 1.25);
    const shade = D.el(s12, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#000" });
    D.text("照片只是一堆数字。", 960, 380, { anchor: "center", cls: "huge wh", win: [157.11, 161], d: 0.3, style: "text-shadow:0 4px 30px rgba(0,0,0,.45)" });
    D.text("现在，你知道怎么改它们了。", 960, 520, { anchor: "center", cls: "big wh", win: [158.2, 161], d: 0.4, style: "font-size:72px;text-shadow:0 4px 30px rgba(0,0,0,.45)" });
    D.onFrame((t) => {
      if (t < 156.8) return;
      D.op(endP.g, D.prog(t, 157.7, 0.9, E.inOut));
      D.op(shade, 0.32 * D.prog(t, 157.7, 0.9));
      const s = D.lerp(1.15, 1, D.prog(t, 157.11, 1.2, E.out));
      wg.setAttribute("transform", `translate(${D.f(960 - 960 * s)} ${D.f(540 - 540 * s)}) scale(${D.f(s)})`);
    });
  };
})();
