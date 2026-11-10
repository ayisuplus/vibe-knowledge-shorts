// S3 酒会（38.34–51.08）· S4 另一半的神话（51.08–87.21）· S5 被当场推翻（87.21–93.59）。全部画在陶罐表面上。
(function () {
  const D = window.D, C = D.C;
  const GROUND = 800, R0 = 80, CY = GROUND - R0 * 1.6; // 圆形人站立时的中心高度

  D.scene35 = () => {
    const vase = D.g(D.L.mid, { id: "vase" });
    const belly = "M150,-20 C30,300 30,780 150,1100 L1770,1100 C1890,780 1890,300 1770,-20 Z";
    vase.insertAdjacentHTML("beforeend", `<defs>
      <linearGradient id="glazeG" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stop-color="#070504"/><stop offset=".12" stop-color="#16100c"/>
        <stop offset=".28" stop-color="#2a1f18"/><stop offset=".33" stop-color="#3a2c22"/><stop offset=".38" stop-color="#241a14"/>
        <stop offset=".7" stop-color="${C.glaze}"/><stop offset=".9" stop-color="#110c09"/><stop offset="1" stop-color="#060403"/></linearGradient>
      <linearGradient id="sheen" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".07"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="vaseClip"><path d="${belly}"/></clipPath>
      <clipPath id="friezeClip"><rect x="0" y="262" width="1920" height="556"/></clipPath>
    </defs>
    <path d="${belly}" fill="url(#glazeG)"/>`);
    const inV = D.g(vase, { "clip-path": "url(#vaseClip)" });
    D.el(inV, "rect", { x: 470, y: 0, width: 230, height: 1080, fill: "url(#sheen)" });
    D.svg(inV, D.meander(0, 1920, 228, 34, C.clay, 6) + D.meander(0, 1920, 832, 30, C.clay, 5.5));
    const frieze = D.g(inV, { "clip-path": "url(#friezeClip)" });
    const vcam = D.g(frieze, { id: "vcam" });
    D.el(vcam, "line", { x1: -400, x2: 2400, y1: GROUND, y2: GROUND, stroke: C.clay, "stroke-width": 3, opacity: .7 });
    D.svg(vase, `<path d="M150,-20 C30,300 30,780 150,1100" fill="none" stroke="#5a4232" stroke-width="3" opacity=".7"/><path d="M1770,-20 C1890,300 1890,780 1770,1100" fill="none" stroke="#3a2a20" stroke-width="3" opacity=".7"/>`);

    // ================= S3 酒会 =================
    const ban = D.g(vcam, { id: "banquet" });
    const banClip = D.el(D.el(ban, "clipPath", { id: "banClip" }), "rect", { x: 0, y: 0, width: 0, height: 1080 });
    const banIn = D.g(ban, { "clip-path": "url(#banClip)" });
    const seats = [[420, false], [960, true], [1500, true]];
    const diners = seats.map(([x, beard], i) => {
      const g = D.g(banIn);
      D.svg(g, D.recliner({ beard, cup: "raise" }), { transform: "scale(1.45)" });
      return { g, x, cup: [x + (-4 * 1.45), 690 - 176 * 1.45] };
    });
    [[690, 742], [1230, 742]].forEach(([x, y]) => D.svg(banIn, D.table(), { transform: `translate(${x} ${y})` }));
    // 碰杯溅出的酒滴
    const splash = D.g(ban);
    diners.forEach((d) => { for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .4; D.el(splash, "line", { x1: d.cup[0] + Math.cos(a) * 26, y1: d.cup[1] - 10 + Math.sin(a) * 26, x2: d.cup[0] + Math.cos(a) * 44, y2: d.cup[1] - 10 + Math.sin(a) * 44, stroke: C.cream, "stroke-width": 3, "stroke-linecap": "round" }); } });
    // 打嗝 / 喷嚏
    const hic = [0, 1].map((i) => D.svg(ban, `<rect x="-42" y="-30" width="84" height="56" rx="26" fill="${C.cream}"/><path d="M-10,24 L-22,42 L4,26 Z" fill="${C.cream}"/><text x="0" y="12" text-anchor="middle" font-size="34" font-weight="900" fill="${C.line}">嗝</text>`));
    const sneeze = D.g(ban);
    sneeze.insertAdjacentHTML("beforeend", `<text x="0" y="0" text-anchor="middle" font-size="58" font-weight="900" fill="${C.cream}" transform="rotate(-8)">阿嚏！</text>` +
      Array.from({ length: 10 }, (_, k) => { const a = -Math.PI * .9 + k * .2; return `<line x1="${D.f(Math.cos(a) * 70)}" y1="${D.f(Math.sin(a) * 50 - 20)}" x2="${D.f(Math.cos(a) * 110)}" y2="${D.f(Math.sin(a) * 80 - 20)}" stroke="${C.cream}" stroke-width="4" stroke-linecap="round"/>`; }).join(""));

    // ================= S4 神话 =================
    const myth = D.g(vcam, { id: "myth" });
    const mount = D.svg(myth, D.olympus(), { transform: `translate(330 ${GROUND}) scale(1.15)` });
    const zeus = D.g(myth);
    D.svg(zeus, D.figure({ head: "zeus", arm: "throw", staff: true }));
    D.svg(zeus, D.bolt, { transform: "translate(155 -476) rotate(-28)" });
    const apollo = D.g(myth);
    D.svg(apollo, D.figure({ head: "apollo", arm: "pull" }), { transform: "scale(-1 1)" });
    // 四个圆形人
    const humans = [0, 1, 2, 3].map((i) => D.svg(myth, D.roundHuman(`rh${i}`, { r: R0 })));
    // 被劈开的两半（主角），各有打结后的版本
    const halfL = D.svg(myth, D.roundHuman("hL", { r: R0, half: -1 }));
    const halfR = D.svg(myth, D.roundHuman("hR", { r: R0, half: 1 }));
    const halfLk = D.svg(myth, D.roundHuman("hLk", { r: R0, half: -1, knot: 1, cutOp: 0 }));
    const halfRk = D.svg(myth, D.roundHuman("hRk", { r: R0, half: 1, knot: 1, cutOp: 0 }));
    const knotPop = D.g(myth);
    knotPop.insertAdjacentHTML("beforeend", Array.from({ length: 8 }, (_, k) => { const a = k / 8 * 6.283; return `<line x1="${D.f(Math.cos(a) * 16)}" y1="${D.f(Math.sin(a) * 16)}" x2="${D.f(Math.cos(a) * 30)}" y2="${D.f(Math.sin(a) * 30)}" stroke="${C.cream}" stroke-width="3" stroke-linecap="round"/>`; }).join(""));
    const navel = D.g(myth);
    D.el(navel, "circle", { r: 34, fill: "url(#roseRing)" });
    D.el(navel, "circle", { r: 22, fill: "none", stroke: C.roseGlow, "stroke-width": 2.5, filter: "url(#gl)" });
    // 人群：寻找另一半的半人（半数朝右走、半数朝左走）
    const RC = D.rng(21), crowd = [];
    for (let i = 0; i < 10; i++) {
      const half = i % 2 ? 1 : -1, sc = .55 + RC() * .2;
      crowd.push({ g: D.svg(myth, D.roundHuman(`cr${i}`, { r: R0, half, cutOp: 0 })), half, sc, x0: 260 + i * 150 + RC() * 60, dir: half < 0 ? 1 : -1, sp: 30 + RC() * 30, ph: RC() * 6, yb: CY + (1 - sc) * R0 * 1.6 + (RC() - .5) * 30 });
    }
    // 82.70 起：成对合成的圆（装饰带）
    const pairs = [300, 520, 1400, 1620].map((x, i) => ({ x, g: D.svg(myth, D.roundHuman(`pw${i}`, { r: R0 * .6 })) }));
    const rings = D.g(myth);
    const ringEls = [960, ...pairs.map((p) => p.x)].map((x, i) => D.el(rings, "circle", { cx: x, cy: i ? CY + R0 * .64 : CY - 10, r: i ? 90 : 170, fill: "url(#roseRing)" }));
    const mainRing = D.el(myth, "circle", { cx: 960, cy: CY - 10, r: 120, fill: "none", stroke: C.roseGlow, "stroke-width": 4, filter: "url(#gl)" });
    const merged = D.svg(myth, D.roundHuman("merged", { r: R0 }));
    // 闪电
    const boltPath = "M528,322 L640,380 L610,398 L740,440 L708,458 L852,500 L824,516 L960,560";
    const lightning = D.g(myth);
    lightning.insertAdjacentHTML("beforeend", `<path d="${boltPath}" fill="none" stroke="#ffe7b0" stroke-width="16" filter="url(#bigglow)" opacity=".9"/><path d="${boltPath}" fill="none" stroke="#fffaf0" stroke-width="6"/>`);
    const flashC = D.el(myth, "circle", { cx: 970, cy: 580, r: 300, fill: "url(#flash)", style: "mix-blend-mode:screen" });
    const sparks = D.g(myth);
    const RS = D.rng(7);
    for (let i = 0; i < 16; i++) { const a = RS() * 6.283, d = 120 + RS() * 140, x = 970 + Math.cos(a) * d, y = 580 + Math.sin(a) * d * .8, l = 10 + RS() * 18; D.el(sparks, "line", { x1: x, y1: y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l, stroke: "#ffe7b0", "stroke-width": 3, "stroke-linecap": "round" }); }

    // ================= S5 定格、裂缝、碎裂 =================
    const desat = D.el(inV, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#7a7066", style: "mix-blend-mode:saturation", opacity: 0 });
    const crackD = "M968,200 L948,300 L984,380 L944,470 L990,560 L950,650 L986,740 L956,840 L976,960";
    const crack = D.g(vase);
    crack.insertAdjacentHTML("beforeend", `<path d="${crackD}" fill="none" stroke="#fff1cf" stroke-width="12" filter="url(#bigglow)" opacity=".7"/><path d="${crackD}" fill="none" stroke="#fffaf0" stroke-width="4"/>`);
    const crackPaths = [...crack.querySelectorAll("path")];
    crackPaths.forEach((p) => p.setAttribute("stroke-dasharray", "900"));
    const flash2 = D.el(D.L.mid, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#fff8e8", opacity: 0 });
    // 碎片：把画面切成三角块，从裂缝处向外飞散
    const shards = D.g(D.L.mid, { id: "shards" });
    const RH = D.rng(33), sh = [];
    const GX = 8, GY = 5, pts = [];
    for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) pts.push([i * 1920 / GX + (i % GX ? (RH() - .5) * 140 : 0), j * 1080 / GY + (j % GY ? (RH() - .5) * 120 : 0)]);
    const P = (i, j) => pts[j * (GX + 1) + i];
    for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      [[P(i, j), P(i + 1, j), P(i, j + 1)], [P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)]].forEach((tri) => {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const g = D.g(shards);
        const edge = cx < 160 || cx > 1760;
        D.el(g, "path", { d: `M${tri.map((p) => `${D.f(p[0] - cx)},${D.f(p[1] - cy)}`).join(" L")} Z`, fill: edge ? "#2a1f18" : C.glaze, stroke: "#3a2a20", "stroke-width": 2 });
        if (RH() < .35) D.el(g, "path", { d: `M${D.f((RH() - .5) * 40)},${D.f((RH() - .5) * 40)} l${D.f(20 + RH() * 30)},${D.f(RH() * 20)} l${D.f(-RH() * 30)},${D.f(14 + RH() * 20)} Z`, fill: C.clay, opacity: .9 });
        const dx = cx - 970, dy = cy - 560, d = Math.hypot(dx, dy) || 1;
        sh.push({ g, cx, cy, vx: dx / d * (300 + RH() * 500), vy: dy / d * (200 + RH() * 300) - 200 - RH() * 300, rot: (RH() - .5) * 200, delay: d / 2400 });
      });
    }
    const dust2 = D.g(D.L.mid);
    const RD = D.rng(44), dps = [];
    for (let i = 0; i < 90; i++) dps.push({ e: D.el(dust2, "circle", { r: 2 + RD() * 5, fill: "#fffaf0", filter: "url(#soft)" }), x: 300 + RD() * 1320, y: 200 + RD() * 700, vy: 60 + RD() * 160, vx: (RD() - .5) * 120 });

    // ================= 每帧 =================
    const zoomKeys = [[46.6, [1, 960, 600]], [47.3, [1.7, 940, 520]], [50.6, [1.7, 940, 520]], [51.3, [1, 960, 600]], [67.7, [1, 960, 600]], [68.5, [3.2, 1036, 680]], [69.9, [3.2, 1036, 680]], [70.7, [1, 960, 600]]];
    const zAt = (t) => { if (t <= zoomKeys[0][0]) return zoomKeys[0][1]; for (let i = 1; i < zoomKeys.length; i++) if (t <= zoomKeys[i][0]) { const [t0, a] = zoomKeys[i - 1], [t1, b] = zoomKeys[i], k = D.ease.inOut((t - t0) / (t1 - t0)); return a.map((v, j) => D.lerp(v, b[j], k)); } return zoomKeys[zoomKeys.length - 1][1]; };

    // 圆形人的滚动路线：起点 → 滚向奥林匹斯山 → 被弹回、在中间乱滚 → 定住
    const START = [880, 1130, 1380, 1630];
    const xAt = (i, t) => {
      const x0 = START[i], hit = 640 + i * 150;
      if (t < 52.41) return x0;
      if (t < 56.13 + i * .2) return D.lerp(x0, hit, D.ease.inOut(D.clamp((t - 52.41) / (3.72 + i * .2))));
      const settle = [970, 1250, 1480, 1700][i];
      return D.lerp(hit, settle, D.ease.out(D.clamp((t - 56.13 - i * .2) / 1.6)));
    };

    D.onFrame((t) => {
      const on = t > 37.9 && t < 91.7;
      D.op(vase, on ? (t < 91.46 ? 1 : 1 - D.clamp((t - 91.46) / .15)) : 0);
      if (on) {
        D.tf(vase, 0, D.lerp(1080, 0, D.prog(t, 37.95, .65, D.ease.out)));
        const [zs, zx, zy] = zAt(t);
        vcam.setAttribute("transform", `translate(${D.f(960 - zx * zs)} ${D.f(600 - zy * zs)}) scale(${D.f(zs)})`);
        // ---- 酒会 ----
        D.op(ban, t < 51.1 ? 1 - D.clamp((t - 50.6) / .45) : 0);
        banClip.setAttribute("width", D.f(1920 * D.prog(t, 38.34, 1.3, D.ease.inOut)));
        diners.forEach((d, i) => {
          const bob = t > 42.59 ? Math.sin(D.clamp((t - 42.59 - i * .12) / .8) * Math.PI) * -10 : 0;
          const hicJ = i === 1 && t > 46.84 && t < 48.96 ? -Math.max(0, Math.sin((t - 46.84) / D.BEAT * Math.PI)) * 10 : 0;
          const sn = i === 1 && t > 48.96 ? Math.sin(D.clamp((t - 48.96) / .35) * Math.PI) * -16 : 0;
          D.tf(d.g, d.x, 690 + bob + hicJ + sn);
        });
        D.op(splash, t > 43.38 ? 1 - D.clamp((t - 43.5) / .5) : 0);
        hic.forEach((h, i) => { const t0 = 47.37 + i * .54, k = D.clamp((t - t0) / .2); D.tf(h, 1010 + i * 70, 330 - i * 40, D.lerp(.5, 1, D.ease.back(k))); D.op(h, t < t0 ? 0 : k * (1 - D.clamp((t - 48.96) / .15))); });
        const ks = D.clamp((t - 48.96) / .2);
        D.tf(sneeze, 1080, 350, D.lerp(.6, 1, D.ease.back(ks))); D.op(sneeze, t < 48.96 ? 0 : ks * (1 - D.clamp((t - 50.2) / .5)));
        // ---- 神话 ----
        D.op(myth, t > 51.0 ? D.clamp((t - 51.0) / .5) : 0);
        const tt = Math.min(t, 87.21); // 87.21 起定格
        D.op(mount, D.clamp((t - 51.3) / .6) * (1 - D.clamp((t - 59.4) / .5)));
        const kz = D.clamp((t - 59.59) / .45);
        D.tf(zeus, 385, GROUND, D.lerp(.85, 1, D.ease.out(kz)));
        D.op(zeus, t < 59.59 ? 0 : kz * (1 - D.clamp((t - 64.6) / .5)));
        const ka = D.clamp((t - 63.84) / .45);
        D.tf(apollo, 1330, GROUND, D.lerp(.85, 1, D.ease.out(ka)));
        D.op(apollo, t < 63.84 ? 0 : ka * (1 - D.clamp((t - 69.9) / .5)));
        // 四个圆形人
        humans.forEach((h, i) => {
          const pop = D.clamp((t - 51.08 - i * .18) / .35);
          const x = xAt(i, tt), rolling = tt > 52.41;
          const rot = rolling ? (x - START[i]) / R0 * 57.3 + (tt > 56.4 ? Math.sin(tt * 7 + i) * 14 : 0) : 0;
          const hop = rolling ? -Math.abs(Math.sin((tt - 52.41) * 5.2 + i)) * 26 : 0;
          let px = x, py = CY + hop;
          if (i > 0 && t > 63.58) { const k = D.prog(t, 63.58, 1.1); px += k * (520 + i * 160); py -= Math.sin(k * Math.PI) * 60; }
          D.tf(h, px, py, D.lerp(.5, 1, D.ease.back(pop)), rot);
          const gone = i === 0 ? (t >= 63.58 ? 0 : 1) : 1 - D.clamp((t - 64.3) / .5);
          D.op(h, t < 51.08 + i * .18 ? 0 : Math.min(1, pop * 2) * gone);
        });
        // 劈开
        const ks2 = D.prog(t, 63.58, .55, D.ease.out), land = D.prog(t, 64.15, .5, D.ease.inOut);
        const lx = 970 - D.lerp(ks2 * 110, 76, land), rx = 970 + D.lerp(ks2 * 110, 76, land);
        const ly = CY - ks2 * 30 * (1 - land), lr = -16 * ks2 * (1 - land);
        const showHalves = t >= 63.58 && t < 70.4;
        const knotK = D.clamp((t - 64.9) / .27);
        [[halfL, halfLk, lx, -1], [halfR, halfRk, rx, 1]].forEach(([a, b, x, s]) => {
          D.tf(a, x, ly, 1, s * -lr); D.tf(b, x, ly, 1, s * -lr);
          D.op(a, showHalves ? 1 - knotK : 0); D.op(b, showHalves ? knotK : 0);
        });
        D.tf(knotPop, rx - 4, CY + 8, D.lerp(.4, 1.4, D.clamp((t - 65.17) / .35)));
        D.op(knotPop, t > 65.17 ? 1 - D.clamp((t - 65.3) / .4) : 0);
        const kn = t > 67.9 && t < 70.4 ? D.clamp((t - 67.9) / .4) : 0;
        D.tf(navel, rx - 4, CY + 8, 1 + (t > 69.42 ? .35 * Math.sin(D.clamp((t - 69.42) / .5) * Math.PI) : 0));
        D.op(navel, kn);
        D.op(lightning, t > 63.4 && t < 64.4 ? (1 - D.clamp((t - 63.9) / .5)) * (Math.sin(t * 90) > -.6 ? 1 : .4) : 0);
        D.op(flashC, t > 61.44 && t < 62.2 ? .6 * (1 - D.clamp((t - 61.44) / .7)) : t > 63.58 ? 1 - D.clamp((t - 63.58) / .9) : 0);
        D.op(sparks, t > 63.58 ? 1 - D.clamp((t - 63.7) / .7) : 0);
        sparks.setAttribute("transform", `translate(970 580) scale(${D.f(1 + D.clamp((t - 63.58) / .7) * .6)}) translate(-970 -580)`);
        // 人群
        const crowdOn = t > 70.2 && t < 83.4;
        crowd.forEach((c, i) => {
          const x = c.x0 + c.dir * c.sp * (tt - 70.2) * 1.2;
          const wob = Math.sin(tt * 6 + c.ph) * 5;
          let o = crowdOn ? D.clamp((t - 70.2 - i * .06) / .5) * (1 - D.clamp((t - 82.7) / .5)) : 0;
          if (t > 76.0) o *= 1 - .45 * D.clamp((t - 76.0) / .5);
          c.g.setAttribute("transform", `translate(${D.f(x)} ${D.f(c.yb + Math.abs(Math.sin(tt * 6 + c.ph)) * -6)}) rotate(${D.f(wob)}) scale(${D.f(c.sc * (c.dir > 0 === c.half < 0 ? 1 : -1))} ${D.f(c.sc)})`);
          D.op(c.g, o);
        });
        // 两个主角：擦肩而过 → 回头 → 合成一个圆
        if (t >= 70.4) {
          // A（左半，天生脸朝左）从右边往左走；B（右半，脸朝右）从左边往右走；两人在不同排擦肩而过，74.47 转身走近
          const ax = D.keyed([[70.4, 1500], [72.3, 1100], [73.6, 820], [74.47, 820], [76.4, 925]], tt);
          const bx = D.keyed([[70.4, 420], [72.3, 800], [73.6, 1120], [74.47, 1120], [76.4, 1015]], tt);
          const toRow = D.clamp((tt - 74.47) / 1.9);
          const ay = D.lerp(CY + R0 * 1.6 * .08, CY, toRow) + Math.abs(Math.sin(tt * 6)) * -6, by = D.lerp(CY + 30, CY, toRow) + Math.abs(Math.sin(tt * 6 + 1)) * -6;
          const as = D.lerp(.9, 1, toRow), flip = tt > 74.47 ? -1 : 1;
          const mergeK = D.clamp((t - 76.3) / .3);
          halfLk.setAttribute("transform", `translate(${D.f(ax)} ${D.f(ay)}) scale(${D.f(flip * as)} ${D.f(as)})`);
          halfRk.setAttribute("transform", `translate(${D.f(bx)} ${D.f(by)}) scale(${flip} 1)`);
          D.op(halfLk, t < 87.3 ? 1 - mergeK : 0); D.op(halfRk, t < 87.3 ? 1 - mergeK : 0);
          D.op(merged, mergeK);
          D.tf(merged, 970, CY, 1 + .06 * Math.sin(D.clamp((t - 76.59) / .5) * Math.PI));
        } else D.op(merged, 0);
        const ringK = t > 76.59 ? D.clamp((t - 76.59) / .4) : 0;
        D.op(mainRing, ringK * (.75 + .25 * Math.sin(tt * 3)));
        mainRing.setAttribute("r", D.f(120 + (t > 78.45 ? 40 * D.clamp((t - 78.45) / .6) : 0)));
        D.op(ringEls[0], ringK * (t > 78.45 ? 1 - .5 * D.clamp((t - 78.45) / .6) : 1));
        pairs.forEach((p, i) => { const k = D.clamp((t - 82.7 - i * .12) / .5); D.tf(p.g, p.x, CY + R0 * .64, D.lerp(.6, 1, D.ease.back(k))); D.op(p.g, t < 82.7 ? 0 : k); });
        ringEls.slice(1).forEach((r, i) => D.op(r, t > 85.34 ? Math.sin(D.clamp((t - 85.34) / .8) * Math.PI) : 0));
        if (t > 85.34) D.op(ringEls[0], ringK * (.5 + .5 * Math.sin(D.clamp((t - 85.34) / .8) * Math.PI)));
        // 定格褪色 + 裂缝
        D.op(desat, .55 * D.clamp((t - 87.21) / .5));
        const kc = D.clamp((t - 89.35) / .85);
        crackPaths.forEach((p) => p.setAttribute("stroke-dashoffset", D.f(900 * (1 - kc))));
        D.op(crack, t > 89.35 ? 1 : 0);
      }
      // 碎裂
      D.op(flash2, t > 91.4 && t < 92.2 ? .7 * (1 - D.clamp((t - 91.46) / .7)) : 0);
      const shOn = t > 91.46 && t < 93.4;
      D.op(shards, shOn ? 1 : 0);
      if (shOn) for (const s of sh) {
        const k = Math.max(0, t - 91.46 - s.delay * .4);
        D.tf(s.g, s.cx + s.vx * k, s.cy + s.vy * k + 700 * k * k, 1 - k * .35, s.rot * k);
        D.op(s.g, 1 - D.clamp((k - .5) / .8));
      }
      const dOn = t > 91.5 && t < 94.6;
      D.op(dust2, dOn ? 1 : 0);
      if (dOn) for (const p of dps) { const k = t - 91.5; p.e.setAttribute("cx", D.f(p.x + p.vx * k)); p.e.setAttribute("cy", D.f(p.y - p.vy * k)); p.e.setAttribute("opacity", D.f(D.clamp(k / .3) * (1 - D.clamp((k - 1.6) / 1.4)) * .8)); }
    });

    // ---- 文字 ----
    D.head(38.34, 92.2, { year: "约两千四百年前", place: "雅典 · 柏拉图", dark: true });
    D.head(36.21, 38.7, { year: "约两千四百年前", place: "雅典 · 柏拉图" });
    D.ref(38.8, 92.2, { en: "Symposium", zh: "《会饮篇》", dark: true });
    const dk = { dark: true };
    D.cap("雅典，诗人阿伽通的悲剧得了奖，朋友们来家里庆祝", 38.34, 42.59, dk);
    D.cap("他们约好：今晚不拼酒，<em>轮流赞美爱神</em>", 42.59, 46.84, dk);
    D.cap("轮到喜剧作家<em>阿里斯托芬</em>，他却在打嗝", 46.84, 48.96, dk);
    D.cap("一个喷嚏治好了嗝，他讲了一个故事", 48.96, 51.08, dk);
    D.cap("很久以前，人是<em>圆</em>的：四只手，四条腿，两张脸", 51.08, 55.33, dk);
    D.cap("他们翻着跟头滚，力气大到想<em>攻上天</em>", 55.33, 59.59, dk);
    D.cap("宙斯决定：把每个人<em>劈成两半</em>", 59.59, 63.84, dk);
    D.cap("阿波罗把切口的皮拉到肚子中间，<em>打了个结</em>", 63.84, 68.09, dk);
    D.cap("这个结，就是你的<em>肚脐</em>", 68.09, 70.22, dk);
    D.cap("从此，每一半都在找<em>另一半</em>", 70.22, 76.59, dk);
    D.cap("「对完整的渴望与追求，就叫作<em>爱</em>。」", 76.59, 80.84, { ...dk, note: "—— 阿里斯托芬", cls: "big" });
    D.cap("「另一半」「灵魂伴侣」的想象，<em>最早</em>就在这里", 80.84, 82.97, { ...dk, note: "这两个词本身，到 16、19 世纪才出现" });
    D.cap("直到今天，人们还在用它讲爱情", 82.97, 87.21, dk);
    D.cap("但在同一场酒会上", 87.21, 89.35, dk);
    D.cap("这个故事被<em>当场推翻</em>了", 89.35, 91.6, dk);
    D.cap("这个故事被<em>当场推翻</em>了", 91.46, 93.59, { noslide: true });
  };
})();
