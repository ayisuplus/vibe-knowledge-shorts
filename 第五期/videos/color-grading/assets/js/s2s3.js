// S2 往下问（17.05–31.95）：为什么 4 合 1 → 为什么每格只量一种颜色（拜耳，绿占一半）
// S3 问到人眼（31.95–57.46）：三种感色细胞 → 黄光 = 红光 + 绿光 → 屏幕上没有黄色的点 → 一个颜色 = 三个数 → 3760 万个数字
(function () {
  const D = window.D, C = D.C, E = D.ease;

  D.scene23 = function () {
    const L = D.L.mid;

    // ---------- 追问链（左侧，17.05–40.4） ----------
    const chainQ = ["为什么要 4 合 1？", "为什么每格只量一种颜色？", "为什么是红、绿、蓝三种？"];
    const chainT = [17.05, 23.45, 31.95];
    const ch = D.g(L);
    const CX = 110, CY = [250, 420, 590], CY4 = 790;
    const spine = D.el(ch, "line", { x1: CX, y1: CY[0], x2: CX, y2: CY[0], stroke: C.ink3, "stroke-width": 4, "stroke-linecap": "round" });
    const spineHot = D.el(ch, "line", { x1: CX, y1: CY[0], x2: CX, y2: CY[0], stroke: C.hi, "stroke-width": 6, "stroke-linecap": "round", filter: "url(#glowL)" });
    const dots = CY.map((y) => D.el(ch, "circle", { cx: CX, cy: y, r: 14, fill: C.paper, stroke: C.ink3, "stroke-width": 4 }));
    const end = D.g(ch);
    D.el(end, "circle", { cx: CX, cy: CY4, r: 22, fill: C.hi, filter: "url(#glow)" });
    chainQ.forEach((q, i) => D.text(q, CX + 40, CY[i] - 24, { cls: "chain", id: `chq${i}` }));
    D.text("人眼：三种感色细胞", CX + 48, CY4 - 30, { cls: "chain", id: "chq3", style: "font-size:38px;color:#ec7a2c" });
    D.onFrame((t) => {
      const vis = D.win(t, 16.9, 40.6, 0.4);
      D.op(ch, vis);
      chainQ.forEach((_, i) => {
        const on = D.prog(t, chainT[i], 0.4), cur = i === chainT.filter((x) => t >= x).length - 1 && t < 38.34;
        D.hop(D.$(`chq${i}`), vis * on * (cur || t >= 38.34 ? 1 : 0.45));
        D.$(`chq${i}`).style.transform = `translateX(${D.f((1 - on) * -20)}px)`;
        D.op(dots[i], on);
        D.attr(dots[i], "stroke", cur || t >= 38.34 ? C.hi : C.ink3);
        D.attr(dots[i], "fill", t >= 38.34 ? C.hi : C.paper);
      });
      const n = chainT.filter((x) => t >= x).length;
      const yEnd = n === 0 ? CY[0] : D.lerp(CY[Math.max(0, n - 2)], CY[n - 1], D.prog(t, chainT[n - 1], 0.4));
      D.attr(spine, "y2", t >= 38.0 ? D.lerp(CY[2], CY4, D.prog(t, 38.0, 0.34)) : yEnd);
      const hot = D.prog(t, 38.34, 0.5, E.out);
      D.attr(spineHot, "y2", D.lerp(CY[0], CY4, hot)); D.op(spineHot, hot);
      D.op(end, D.pop(t, 38.34, 0.4));
      D.hop(D.$("chq3"), vis * D.prog(t, 38.4, 0.35));
    });

    // 右侧内容区中心
    const RX = 1220;

    // ---------- S2a 光桶：小感光点接到的光少，数字乱跳；4 个合起来稳定（19.2–21.33） ----------
    const bk = D.scene(L, 17.2, 21.6);
    const bucket = (x, y, w, h) => {
      const g = D.g(bk);
      D.el(g, "path", { d: `M${x - w / 2} ${y - h / 2} L${x - w / 2 + 6} ${y + h / 2} L${x + w / 2 - 6} ${y + h / 2} L${x + w / 2} ${y - h / 2}`, fill: "rgba(255,253,249,.9)", stroke: C.ink, "stroke-width": 4, "stroke-linejoin": "round" });
      const n = D.el(g, "text", { x, y: y + h / 2 + 58, "text-anchor": "middle", class: "mono", "font-size": 48, fill: C.ink }, "0");
      return { g, n, x, y, w, h };
    };
    const small = [[800, 400], [990, 400], [800, 660], [990, 660]].map(([x, y]) => bucket(x, y, 130, 130));
    const bigB = bucket(1520, 520, 290, 290);
    D.text("1 个感光点", 895, 220, { cls: "lab", anchor: "center", win: [17.4, 21.5] });
    D.text("4 个合成 1 个", 1520, 220, { cls: "lab", anchor: "center", win: [17.4, 21.5] });
    // 光子：确定性的落点
    const ph = D.g(bk), phs = [];
    for (let i = 0; i < 70; i++) phs.push({ e: D.el(ph, "circle", { r: 5, fill: "#f6c24a", filter: "url(#soft)" }), x: i < 35 ? 745 + D.hash(i) * 310 : 1385 + D.hash(i) * 270, ph: D.hash(i + 99) * 1.2, sp: 0.9 + D.hash(i + 7) * 0.5 });
    D.onFrame((t) => {
      if (t < 17 || t > 21.7) return;
      for (const p of phs) { const k = ((t * p.sp + p.ph) % 1.2) / 1.2; D.attr(p.e, "cx", p.x); D.attr(p.e, "cy", 260 + k * 400); D.attr(p.e, "opacity", 1 - k * 0.6); }
      const tick = Math.floor(t * 4);
      small.forEach((b, i) => { const v = Math.round(3 + (D.hash(tick * 4 + i) - 0.5) * 6); b.n.textContent = Math.max(0, v); });
      const s = 13 + Math.round((D.hash(tick + 500) - 0.5) * 3);
      bigB.n.textContent = s;
    });

    // ---------- S2a' 暗光对比（21.33–23.45） ----------
    const nz = D.scene(L, 21.33, 23.7);
    const panel = (x, href, lab) => {
      const cr = D.clipRect(x - 290, 230, 580, 580, 22);
      const g = D.g(nz, { filter: "url(#shadow)" });
      D.el(D.g(g, { "clip-path": cr.url }), "image", { href, x: x - 290, y: 230, width: 580, height: 580, preserveAspectRatio: "xMidYMid slice" });
      D.text(lab, x, 830, { cls: "lab", anchor: "center", win: [21.4, 23.6], style: "font-size:30px;color:#23262b;font-weight:700" });
    };
    panel(910, "assets/img/noise-single.jpg", "1 个感光点：满是噪点");
    panel(1530, "assets/img/noise-quad.jpg", "4 合 1：干净，但格子更大");

    // ---------- S2b 感光点剖面 → 戴上有色眼镜 → 拜耳棋盘（23.45–31.95） ----------
    const sb = D.scene(L, 23.6, 32.6);
    // 剖面（25.58–27.2）
    const cut = D.g(sb);
    D.el(cut, "rect", { x: RX - 150, y: 440, width: 300, height: 260, rx: 18, fill: "#e9e3d8", stroke: C.ink, "stroke-width": 4 });
    D.el(cut, "text", { x: RX, y: 590, "text-anchor": "middle", "font-size": 34, fill: C.ink2 }, "感光点");
    const rays = [[C.r, -90], [C.g, 0], [C.b, 90]].map(([c, dx]) => D.el(cut, "line", { x1: RX + dx * 1.8, y1: 200, x2: RX + dx * 0.6, y2: 440, stroke: c, "stroke-width": 10, "stroke-linecap": "round", opacity: 0.9 }));
    const out = D.el(cut, "text", { x: RX, y: 790, "text-anchor": "middle", class: "mono", "font-size": 64, fill: C.ink }, "173");
    D.el(cut, "text", { x: RX + 180, y: 785, "font-size": 28, "font-weight": 500, fill: C.ink2 }, "← 只有一个数");
    D.onFrame((t) => {
      const k = D.win(t, 23.6, 27.1, 0.3);
      D.op(cut, k);
      rays.forEach((r, i) => { const p = D.prog(t, 24.0 + i * 0.12, 0.5); D.attr(r, "y2", D.lerp(200, 440, p)); });
      D.op(out, D.prog(t, 25.0, 0.3));
    });
    // 拜耳棋盘（27.0–31.95）
    const bay = D.g(sb), tiles = [];
    const BC = 8, BR = 6, BS = 92, BX = RX - (BC * BS) / 2, BY = 200;
    for (let j = 0; j < BR; j++) for (let i = 0; i < BC; i++) {
      const c = j % 2 === 0 ? (i % 2 === 0 ? 0 : 1) : (i % 2 === 0 ? 1 : 2);
      D.el(bay, "rect", { x: BX + i * BS + 4, y: BY + j * BS + 4, width: BS - 8, height: BS - 8, rx: 8, fill: "#d9d2c6" });
      tiles.push({ e: D.el(bay, "rect", { x: BX + i * BS + 4, width: BS - 8, height: BS - 8, rx: 8, fill: [C.r, C.g, C.b][c] }), c, y: BY + j * BS + 4, d: (i + j) * 0.035 });
    }
    const cnt = D.g(bay);
    [["绿", "50%", C.g], ["红", "25%", C.r], ["蓝", "25%", C.b]].forEach(([n, v, c], i) => {
      D.el(cnt, "text", { x: BX + i * 260, y: BY + BR * BS + 80, "font-size": 40, fill: c }, n);
      D.el(cnt, "text", { x: BX + 52 + i * 260, y: BY + BR * BS + 80, class: "mono", "font-size": 44, fill: C.ink }, v);
    });
    D.onFrame((t) => {
      D.op(bay, D.win(t, 26.9, 31.9, 0.35));
      for (const q of tiles) {
        const k = D.prog(t, 27.0 + q.d, 0.4, E.out5);
        const pop = q.c === 1 ? Math.sin(D.clamp((t - 28.49) / 0.45) * Math.PI) * 0.18 : 0;
        D.attr(q.e, "y", D.lerp(q.y - 260, q.y, k)); D.attr(q.e, "opacity", k * (t > 28.49 && q.c !== 1 ? D.lerp(1, 0.35, D.prog(t, 28.49, 0.3)) : 1));
        q.e.setAttribute("transform", pop ? `translate(${D.f(+q.e.getAttribute("x") + 42)} ${D.f(q.y + 42)}) scale(${D.f(1 + pop)}) translate(${D.f(-(+q.e.getAttribute("x") + 42))} ${D.f(-(q.y + 42))})` : "");
      }
      D.op(cnt, D.prog(t, 28.6, 0.35));
    });

    // ---------- S3a 眼睛 → 三种感色细胞的感光曲线（33.68–44.71） ----------
    const eye = D.scene(L, 32.2, 34.6, 0.3);
    const eyeIn = D.g(eye);
    D.el(eyeIn, "path", { d: "M-320 0 Q0 -230 320 0 Q0 230 -320 0 Z", fill: "#fffdf9", stroke: C.ink, "stroke-width": 6 });
    D.el(eyeIn, "circle", { r: 130, fill: "#6f8fa8", stroke: C.ink, "stroke-width": 5 });
    D.el(eyeIn, "circle", { r: 58, fill: "#17191d" });
    D.el(eyeIn, "circle", { cx: -30, cy: -34, r: 18, fill: "#fff", opacity: 0.85 });
    D.onFrame((t) => { const z = Math.exp(D.lerp(0, Math.log(9), D.prog(t, 33.68, 0.9, E.in))); D.tf(eyeIn, RX, 520, D.prog(t, 32.0, 0.5, E.back) * z); });

    // 感光曲线：示意模型（高斯，峰值取教科书常用值 S 430 / M 540 / L 565 nm）
    const cone = [{ mu: 430, sd: 30, n: "短波", c: "#3a8edb" }, { mu: 540, sd: 45, n: "中波", c: "#24935a" }, { mu: 565, sd: 50, n: "长波", c: "#c4860c" }];
    const resp = (k, nm) => Math.exp(-((nm - cone[k].mu) ** 2) / (2 * cone[k].sd ** 2));
    const sp = D.scene(L, 34.0, 44.71, 0.35);
    const AX = 640, AW = 860, AY = 690, AH = 360, nm2x = (nm) => AX + ((nm - 400) / 300) * AW;
    D.el(sp, "rect", { x: AX, y: AY + 14, width: AW, height: 26, rx: 6, fill: "url(#spectrum)" });
    [400, 500, 600, 700].forEach((nm) => D.el(sp, "text", { x: nm2x(nm), y: AY + 80, "text-anchor": "middle", class: "mono", "font-size": 24, fill: C.ink2 }, `${nm}`));
    D.el(sp, "text", { x: AX + AW, y: AY + 118, "text-anchor": "end", "font-size": 22, "font-weight": 500, fill: C.ink3 }, "光的波长（nm）· 示意");
    D.el(sp, "line", { x1: AX, y1: AY, x2: AX + AW, y2: AY, stroke: C.ink3, "stroke-width": 2 });
    const curves = cone.map((c, k) => {
      let d = "";
      for (let nm = 400; nm <= 700; nm += 3) d += `${nm === 400 ? "M" : "L"}${D.f(nm2x(nm))} ${D.f(AY - resp(k, nm) * AH)} `;
      const p = D.el(sp, "path", { d, fill: "none", stroke: c.c, "stroke-width": 6, "stroke-linejoin": "round" });
      const len = 1400; p.setAttribute("stroke-dasharray", len);
      const lab = D.el(sp, "text", { x: nm2x(c.mu) + (k === 2 ? 44 : k === 1 ? -30 : 0), y: AY - AH - 22, "text-anchor": "middle", "font-size": 30, fill: c.c }, c.n);
      return { p, lab, len };
    });
    // 单色光竖线 + 三个强度条
    const beams = D.g(sp);
    const beam = (nm, c) => D.el(beams, "line", { x1: nm2x(nm), y1: AY - AH - 60, x2: nm2x(nm), y2: AY, stroke: c, "stroke-width": 8, filter: "url(#glowL)" });
    const bY = beam(580, "#f2c230"), bR = beam(610, "#ff5a2e"), bG = beam(540, "#3ac46a");
    const bars = (x0, lab) => {
      const g = D.g(sp);
      D.el(g, "text", { x: x0 + 95, y: AY + 70, "text-anchor": "middle", "font-size": 28, fill: C.ink }, lab);
      const rs = cone.map((c, k) => { D.el(g, "rect", { x: x0 + k * 66, y: AY - 300, width: 50, height: 300, rx: 6, fill: "#e6dfd3" }); return { r: D.el(g, "rect", { x: x0 + k * 66, width: 50, rx: 6, fill: c.c }), n: D.el(g, "text", { x: x0 + k * 66 + 25, "text-anchor": "middle", class: "mono", "font-size": 24, fill: C.ink }) }; });
      return { g, rs };
    };
    const barY = bars(1560, "黄光"), barRG = bars(1820, "红光 + 绿光");
    const eq = D.el(sp, "text", { x: 1785, y: AY - 120, "text-anchor": "middle", "font-size": 90, fill: C.hi }, "=");
    const vY = [0, 1, 2].map((k) => resp(k, 580)), vRG = [0, 1, 2].map((k) => 0.9 * resp(k, 610) + 0.4 * resp(k, 540));
    D.onFrame((t) => {
      if (t < 33.9 || t > 44.9) return;
      // 曲线依次画出，整体左移给强度条让位
      curves.forEach((c, k) => { const p = D.prog(t, 34.3 + k * 0.9, 1.2, E.inOut); D.attr(c.p, "stroke-dashoffset", c.len * (1 - p)); D.op(c.lab, D.prog(t, 34.6 + k * 0.9, 0.4)); });
      const flash = t > 38.34 ? Math.max(0, 1 - (t - 38.34) / 0.5) : 0;
      curves.forEach((c) => D.attr(c.p, "stroke-width", 6 + flash * 6));
      const shift = D.prog(t, 40.3, 0.5, E.inOut);
      sp.setAttribute("transform", `translate(${D.f(-shift * 220)} 0)`);
      D.op(bY, D.win(t, 40.46, 42.7, 0.25)); D.op(bR, D.prog(t, 42.59, 0.25)); D.op(bG, D.prog(t, 42.59, 0.25));
      const fillBars = (b, v, t0, x) => { const k = D.prog(t, t0, 0.5, E.out); b.g.setAttribute("transform", `translate(${x} 0)`); b.rs.forEach((r, i) => { const h = 300 * v[i] * k; D.attr(r.r, "y", AY - h); D.attr(r.r, "height", h); D.attr(r.n, "y", AY - h - 12); r.n.textContent = (v[i] * k).toFixed(2); }); };
      D.op(barY.g, D.prog(t, 40.6, 0.3)); fillBars(barY, vY, 40.7, 0);
      D.op(barRG.g, D.prog(t, 42.7, 0.3)); fillBars(barRG, vRG, 42.8, 0);
      D.op(eq, D.pop(t, 43.38, 0.4));
    });

    // ---------- S3b 屏幕子像素（44.71–48.96） ----------
    const s3b = D.scene(L, 44.6, 49.2, 0.3);
    const P = [131.5, 596.5], C0 = D.coverPt(P);
    const hp = D.photo(s3b, "assets/img/hero.jpg", { raw: true, pixelated: true });
    const subBg = D.el(s3b, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#0c0d10" });
    const sub = D.g(s3b), stripes = [];
    const blk = PX.orange.block;
    for (let j = 0; j < blk.length; j++) for (let i = 0; i < blk[0].length; i++) {
      const x = 960 + (i - 8.5) * 110, y = 540 + (j - 5.5) * 110;
      blk[j][i].forEach((v, k) => {
        const col = ["255,70,50", "60,255,90", "60,120,255"][k];
        stripes.push(D.el(sub, "rect", { x: x + 8 + k * 33, y: y + 8, width: 26, height: 94, rx: 8, fill: `rgba(${col},${D.f(v / 255)})` }));
      });
    }
    D.onFrame((t) => {
      if (t < 44.5 || t > 49.3) return;
      const S = Math.exp(D.lerp(Math.log(1.25), Math.log(110), D.prog(t, 44.75, 1.1, E.inOut)));
      const lk = (Math.log(S) - Math.log(1.25)) / (Math.log(110) - Math.log(1.25));
      const cx = D.lerp(C0[0], 960, D.clamp(lk * 1.4)), cy = D.lerp(C0[1], 540, D.clamp(lk * 1.4));
      D.cam(hp.g, P, cx, cy, S);
      const k = D.prog(t, 45.9, 0.7, E.inOut);
      D.op(subBg, k); D.op(sub, k);
      sub.setAttribute("filter", k > 0.5 ? "url(#glow)" : "");
    });

    // ---------- S3c 一个颜色 = 三个数（48.96–53.21） ----------
    const s3c = D.scene(L, 48.8, 53.4, 0.3);
    const hp2 = D.photo(s3c, "assets/img/hero.jpg", { raw: true });
    D.tf(hp2.g, 0, -100, 1.25);
    const O = D.coverPt(P);
    const lensC = D.clipCircle(O[0] + 330, O[1] - 260, 150);
    const lensG = D.g(s3c);
    const lensImg = D.g(lensG, { "clip-path": lensC.url });
    const lp = D.photo(lensImg, "assets/img/hero.jpg", { raw: true, pixelated: true });
    D.cam(lp.g, P, O[0] + 330, O[1] - 260, 60);
    D.el(lensG, "circle", { cx: O[0] + 330, cy: O[1] - 260, r: 150, fill: "none", stroke: "#fffdf9", "stroke-width": 10, filter: "url(#shadow)" });
    D.el(lensG, "line", { x1: O[0] + 6, y1: O[1] - 6, x2: O[0] + 225, y2: O[1] - 155, stroke: "#fffdf9", "stroke-width": 4 });
    D.el(lensG, "rect", { x: O[0] + 330 - 30, y: O[1] - 260 - 30, width: 60, height: 60, fill: "none", stroke: C.hi, "stroke-width": 4 });
    const card = D.pxcard(O[0] + 500, O[1] - 400, { title: "这一格", win: [49.1, 53.3], cls: "big" });
    D.onFrame((t) => {
      if (t < 48.8 || t > 53.4) return;
      D.op(lensG, D.pop(t, 49.0, 0.45));
      const v = PX.orange.rgb;
      // 51.08：三个数各自 0 → 255 → 回到真实值
      const roll = (x, i) => { const a = t - 51.08 - i * 0.08; if (a < 0) return x; if (a < 0.45) return D.lerp(x, 0, a / 0.45); if (a < 0.95) return D.lerp(0, 255, (a - 0.45) / 0.5); if (a < 1.3) return D.lerp(255, x, (a - 0.95) / 0.35); return x; };
      card.set(v.map(roll));
    });
    D.text('<span class="mono" style="font-size:60px">256 × 256 × 256 = <em>16,777,216</em></span>', 1840, 90, { anchor: "right", win: [52.41, 53.5], d: 0.3, style: "padding:14px 30px;border-radius:18px;background:rgba(255,253,249,.92);box-shadow:0 14px 40px rgba(40,30,20,.2)" });

    // ---------- S3d 数字墙（53.21–57.46） ----------
    const wall = D.scene(L, 53.21, 57.6, 0.3);
    D.el(wall, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#121316" });
    const wg = D.g(wall);
    const Wd = PX.wall, cw = 48, chh = 40;
    Wd.forEach((rowc, j) => rowc.forEach((c, i) => {
      const tx = D.el(wg, "text", { x: i * cw + 24, y: j * chh + 12, "text-anchor": "middle", class: "mono", "font-size": 12.5, fill: `rgb(${c.map((v) => Math.min(255, v + 40)).join(",")})` });
      c.forEach((v, k) => D.el(tx, "tspan", { x: i * cw + 24, dy: k === 0 ? 0 : 12.5 }, String(v)));
    }));
    const wp = D.photo(wall, "assets/img/hero.jpg", { raw: true });
    D.tf(wp.g, 0, -100, 1.25);
    D.text('<span class="mono wh" style="font-size:60px">12,533,760 × 3 ≈ <em>3760 万</em> 个数字</span>', 960, 470, { anchor: "center", win: [54.2, 56.2], d: 0.3, style: "text-shadow:0 0 30px #000,0 0 12px #000" });
    D.onFrame((t) => {
      if (t < 53.1 || t > 57.7) return;
      const shake = t > 56.13 && t < 56.5 ? Math.sin((t - 56.13) * 90) * 10 * (1 - (t - 56.13) / 0.37) : 0;
      const scl = D.lerp(1.12, 1, D.prog(t, 53.21, 1.2, E.out));
      wg.setAttribute("transform", `translate(${D.f(960 - 960 * scl + shake)} ${D.f(540 - 540 * scl)}) scale(${D.f(scl)})`);
      D.op(wp.g, D.prog(t, 56.3, 0.7, E.inOut));
    });
  };
})();
