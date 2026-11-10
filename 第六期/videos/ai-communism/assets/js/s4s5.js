// 背景（45.6–163.7）+ 两道门（全片前半段的主角）：第一道门 = 生产力，第二道门 = 分配
// S3 门出现，门楣"各尽所能，按需分配"（40.17–48.44）
// S4 推开它的条件 → 蒸汽机、流水线、电脑撞门，只开一条缝；凯恩斯 15 vs 48.6（70.55–105.13）
// S5 直到 AI：左扇门推开；三格；右扇门挂着一把锁"分配"，推不开（105.13–139.71）
// S6 末尾的锁孔特写也在这里（153.1–158.12）
(function () {
  const D = window.D;

  const MACH = {
    steam: `<rect x="-70" y="-40" width="120" height="60" rx="8"/><rect x="40" y="-90" width="26" height="70"/><circle cx="-40" cy="40" r="34"/><circle cx="40" cy="40" r="22"/><path d="M-40 40 L 40 40"/>`,
    belt: `<rect x="-90" y="10" width="180" height="22" rx="11"/><circle cx="-78" cy="21" r="9"/><circle cx="78" cy="21" r="9"/><rect x="-70" y="-30" width="38" height="38"/><rect x="-14" y="-30" width="38" height="38"/><rect x="42" y="-30" width="38" height="38"/><path d="M-30 -80 L -30 -40 M -46 -40 L -14 -40"/>`,
    pc: `<rect x="-80" y="-70" width="160" height="110" rx="8"/><rect x="-66" y="-58" width="132" height="86" rx="2"/><path d="M-20 40 L -30 70 L 30 70 L 20 40"/><path d="M-50 -40 L 10 -40 M -50 -22 L 40 -22 M -50 -4 L 20 -4"/>`,
  };

  // ---------- 门：局部坐标，门框 600×670，中心在原点 ----------
  const W2 = 300, H2 = 335;
  // hx 门轴 x；dir=+1 门板向右延伸（左扇），-1 向左（右扇）；a 开门角度（度）；box=[u0,u1,v0,v1] 取门板上的一块
  const leafPts = (hx, dir, a, box = [0, 1, 0, 1]) => {
    const r = (a * Math.PI) / 180, w = W2 * Math.cos(r), dz = 46 * Math.sin(r);
    // v16：门往里开（推门）——门板的外沿离观众越来越远，所以越来越矮（之前画成越来越高，看起来像往外拉）
    const P = (u, v) => [hx + dir * w * u, D.lerp(-H2, -H2 + dz, u) + v * D.lerp(2 * H2, 2 * H2 - 2 * dz, u)];
    const [u0, u1, v0, v1] = box;
    return [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)];
  };
  const pts = (arr) => arr.map(([x, y]) => `${D.f(x)},${D.f(y)}`).join(" ");

  // 一组双扇门（门框 + 两扇门板），画在 parent 里，局部坐标同上
  const mkDoubleDoor = (parent) => {
    const g = D.g(parent);
    D.el(g, "rect", { x: -W2 - 14, y: -H2 - 14, width: 2 * W2 + 28, height: 2 * H2 + 14, fill: "none", stroke: "#2a1c10", "stroke-width": 14 });
    const mkLeaf = () => {
      const lg = D.g(g);
      return {
        lg,
        body: D.el(lg, "polygon", { fill: "url(#wood)", stroke: "#2a1c10", "stroke-width": 5 }),
        p1: D.el(lg, "polygon", { fill: "none", stroke: "rgba(42,28,16,.55)", "stroke-width": 4 }),
        p2: D.el(lg, "polygon", { fill: "none", stroke: "rgba(42,28,16,.55)", "stroke-width": 4 }),
        knob: D.el(lg, "circle", { r: 12, fill: "#c99a3c", stroke: "#2a1c10", "stroke-width": 3 }),
      };
    };
    const Lf = mkLeaf(), Rf = mkLeaf();
    const setLeaves = (aL, aR, leafOp = 1) => {
      [[Lf, -W2, 1, aL], [Rf, W2, -1, aR]].forEach(([lf, hx, dir, a]) => {
        D.attr(lf.body, "points", pts(leafPts(hx, dir, a)));
        D.attr(lf.p1, "points", pts(leafPts(hx, dir, a, [0.16, 0.84, 0.08, 0.44])));
        D.attr(lf.p2, "points", pts(leafPts(hx, dir, a, [0.16, 0.84, 0.54, 0.92])));
        const [kx, ky] = leafPts(hx, dir, a, [0.88, 0.88, 0.52, 0.52])[0];
        D.attr(lf.knob, "cx", kx); D.attr(lf.knob, "cy", ky);
        D.op(lf.lg, leafOp);
      });
    };
    return { g, setLeaves };
  };

  // 两道门：第一道门（生产力）在前，打开后露出走廊尽头的第二道门（分配，挂着锁）
  const D2Y = 95, D2S = 0.5;
  D.makeDoors = (parent) => {
    const g = D.g(parent);
    const spill = D.el(g, "polygon", { points: "", fill: "#f6d98a", opacity: 0, filter: "url(#blur16)" });
    const corr = D.g(g);
    D.el(corr, "rect", { x: -W2, y: -H2, width: 2 * W2, height: 2 * H2, fill: "#f3e8d2" });
    const fx0 = -W2 * D2S, fx1 = W2 * D2S, fy0 = D2Y - H2 * D2S, fy1 = D2Y + H2 * D2S;
    D.el(corr, "polygon", { points: `${-W2},${-H2} ${fx0},${fy0} ${fx0},${fy1} ${-W2},${H2}`, fill: "#e6d6b8" });
    D.el(corr, "polygon", { points: `${W2},${-H2} ${fx1},${fy0} ${fx1},${fy1} ${W2},${H2}`, fill: "#e6d6b8" });
    D.el(corr, "polygon", { points: `${-W2},${H2} ${fx0},${fy1} ${fx1},${fy1} ${W2},${H2}`, fill: "#d9c5a0" });
    D.el(corr, "polygon", { points: `${-W2},${-H2} ${fx0},${fy0} ${fx1},${fy0} ${W2},${-H2}`, fill: "#efe2c8" });
    const d2 = D.g(corr, { transform: `translate(0 ${D2Y}) scale(${D2S})` });
    D.el(d2, "rect", { x: -W2, y: -H2, width: 2 * W2, height: 2 * H2, fill: "#fff9ea" });
    const door2 = mkDoubleDoor(d2);
    door2.setLeaves(0, 0);
    const plate2 = D.g(d2);
    D.el(plate2, "rect", { x: -260, y: -H2 - 120, width: 520, height: 92, rx: 6, fill: "#efe4cc", stroke: "#2a1c10", "stroke-width": 6 });
    D.el(plate2, "text", { x: 0, y: -H2 - 56, "text-anchor": "middle", class: "serif", "font-size": 58, "font-weight": 800, fill: "#a3241b", "letter-spacing": 6 }, "里层门 · 分配");
    // v11：第二道门的锁——一条铁链横穿两边把手，正中缝挂一把黄铜挂锁，锁身刻"分配"
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d27c"/><stop offset=".5" stop-color="#c9973a"/><stop offset="1" stop-color="#8c6321"/></linearGradient><linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7f868c"/><stop offset=".5" stop-color="#e6eaed"/><stop offset="1" stop-color="#737a81"/></linearGradient>`);
    const CHX = 170, CHN = 13, SAG = 16;
    const chainG = D.g(d2);
    const links = Array.from({ length: CHN }, (_, i) => D.el(chainG, "ellipse", { rx: 17, ry: i % 2 ? 4 : 10, fill: "none", stroke: "#4c5157", "stroke-width": 7 }));
    const linksHi = Array.from({ length: CHN }, (_, i) => D.el(chainG, "ellipse", { rx: 17, ry: i % 2 ? 4 : 10, fill: "none", stroke: "#c3c8cc", "stroke-width": 2.5 }));
    const lockG = D.g(d2);
    const lockGlow = D.el(lockG, "ellipse", { cx: 0, cy: 120, rx: 190, ry: 170, fill: "url(#redglow)", opacity: 0 });
    const lockBody = D.g(lockG);
    const SHK = "M-46 76 V 30 a46 46 0 0 1 92 0 V76";
    D.el(lockBody, "path", { d: SHK, fill: "none", stroke: "#3a3e43", "stroke-width": 28, "stroke-linecap": "round" });
    D.el(lockBody, "path", { d: SHK, fill: "none", stroke: "url(#steel)", "stroke-width": 19, "stroke-linecap": "round" });
    D.el(lockBody, "rect", { x: -88, y: 66, width: 176, height: 140, rx: 26, fill: "url(#brass)", stroke: "#5b3f10", "stroke-width": 6, filter: "url(#shadowD)" });
    D.el(lockBody, "rect", { x: -74, y: 76, width: 148, height: 14, rx: 7, fill: "rgba(255,248,222,.5)" });
    D.el(lockBody, "text", { "data-layout-ignore": "", "aria-hidden": "true", x: 1.5, y: 139.5, "text-anchor": "middle", class: "serif", "font-size": 52, "font-weight": 800, fill: "rgba(255,240,200,.55)", "letter-spacing": 4 }, "分配");
    D.el(lockBody, "text", { x: 0, y: 138, "text-anchor": "middle", class: "serif", "font-size": 52, "font-weight": 800, fill: "#7a1a10", "letter-spacing": 4 }, "分配");
    const KH = "M0 152 a12 12 0 1 1 -0.1 0 Z M-6 166 L6 166 L10 190 L-10 190 Z";
    D.el(lockBody, "path", { d: KH, fill: "#1b1209" });
    const khGlow = D.el(lockBody, "path", { d: KH, fill: "#ff4a2e", opacity: 0 });
    const lock = {
      set: ({ red = 0, shake = 0 } = {}) => {
        D.op(lockGlow, red * 0.9); D.op(khGlow, red * 0.7);
        lockBody.setAttribute("transform", `rotate(${D.f(shake * 1.1)} 0 -16)`);
      },
    };
    lock.set();
    const lightGlow = D.el(g, "ellipse", { cx: 0, cy: 0, rx: 280, ry: 340, fill: "url(#warm)", opacity: 0 });
    const door1 = mkDoubleDoor(g);
    const plate1 = D.g(g);
    D.el(plate1, "rect", { x: -200, y: -H2 + 10, width: 400, height: 70, rx: 6, fill: "#efe4cc", stroke: "#2a1c10", "stroke-width": 4 });
    D.el(plate1, "text", { x: 0, y: -H2 + 58, "text-anchor": "middle", class: "serif", "font-size": 40, "font-weight": 800, fill: "#2a2018", "letter-spacing": 4 }, "外层门 · 生产力");
    const lintel = D.g(g);
    D.el(lintel, "rect", { x: -390, y: -H2 - 130, width: 780, height: 100, rx: 6, fill: "#efe4cc", stroke: "#2a1c10", "stroke-width": 5 });
    D.el(lintel, "text", { x: 0, y: -H2 - 62, "text-anchor": "middle", class: "serif", "font-size": 60, "font-weight": 800, fill: "#c8281e", "letter-spacing": 10 }, "各尽所能，按需分配");
    D.el(g, "line", { x1: -520, y1: H2, x2: 520, y2: H2, stroke: "#2a1c10", "stroke-width": 5 });
    // 锁孔：锁挂在两把手连线的正中，锁孔在锁的局部 y≈170
    const knobY = leafPts(-W2, 1, 0, [0.88, 0.88, 0.52, 0.52])[0][1];
    const keyhole = [0, D2Y + D2S * (knobY + SAG + 156)];
    const set = ({ x = 960, y = 590, s = 1, a1 = 0, a1R = 0, xray = 0, op = 1, lintelOp = 1, plateOp = 0, lockOp = 0, red = 0, rattle = 0, glow = 0 } = {}) => {
      D.op(g, op);
      if (op <= 0) return;
      D.tf(g, x, y, s);
      door1.setLeaves(a1, a1R, 1 - 0.8 * xray);
      door2.setLeaves(0, rattle);
      const open = D.clamp(Math.max(a1, a1R) / 80);
      D.attr(spill, "points", `${-W2},${H2} ${W2},${H2} ${D.f(W2 + 300 * open)},${H2 + 260} ${D.f(-W2 - 300 * open)},${H2 + 260}`);
      D.op(spill, 0.45 * open);
      D.op(lightGlow, glow);
      D.op(lintel, lintelOp);
      D.op(plate1, plateOp);
      // 铁链：左端跟着左扇门，右端跟着被撞得晃动的右扇门；锁挂在中点
      const [, kyL] = leafPts(-W2, 1, 0, [0.88, 0.88, 0.52, 0.52])[0];
      const [kxR, kyR] = leafPts(W2, -1, rattle, [0.88, 0.88, 0.52, 0.52])[0];
      const dxR = kxR - 36, dyR = kyR - kyL;
      links.forEach((ln, i) => {
        const u = i / (CHN - 1), x = D.lerp(-CHX, CHX + dxR, u), y = kyL + u * dyR + SAG * 4 * u * (1 - u);
        for (const e of [ln, linksHi[i]]) { D.attr(e, "cx", x); D.attr(e, "cy", y); }
      });
      D.tf(lockG, dxR / 2, kyL + dyR / 2 + SAG, 1);
      lock.set({ red, shake: rattle * 1.5 });
      D.op(lockG, lockOp); D.op(chainG, lockOp);
    };
    return { g, set, keyhole };
  };

  D.scene45 = () => {
    const L = D.L.back, M = D.L.mid;

    // ---------- 背景：纸面（34.66–83.01）→ 明亮冷白（83.01–136） ----------
    const bg = D.scene(L, 45.6, 163.75, 0.8, 0.01); // v11：从 1958 叠化进来
    const warmBg = D.g(bg);
    D.el(warmBg, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "url(#paperbg)" });
    D.plate(warmBg, "parchment.jpg").g.setAttribute("opacity", 0.5);
    D.ghost(warmBg, [["劳动 · 机器 · 时间", 170], ["能干多少干多少", 560], ["需要多少拿多少", 1030]], { size: 150, op: 0.045, t0: 45.6 });
    const aiBg = D.g(bg);
    D.el(aiBg, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "url(#aibg)" });
    for (let x = 0; x <= 1920; x += 80) D.el(aiBg, "line", { x1: x, y1: 0, x2: x, y2: 1080, stroke: "#7fc8e8", "stroke-width": 1, opacity: 0.18 });
    for (let y = 0; y <= 1080; y += 80) D.el(aiBg, "line", { x1: 0, y1: y, x2: 1920, y2: y, stroke: "#7fc8e8", "stroke-width": 1, opacity: 0.18 });
    D.ghost(aiBg, [["写作 · 翻译 · 编程 · 设计", 200], ["一般社会知识", 600], ["直接的生产力", 1000]], { size: 150, fill: "#1f6f8f", op: 0.06, t0: 105 });
    const flash = D.el(bg, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#ffffff", opacity: 0 });
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a5434"/><stop offset=".55" stop-color="#5c3d24"/><stop offset="1" stop-color="#43301e"/></linearGradient>`);

    // ---------- 两道门（v8：整体上移到 y=530，底部留给字幕） ----------
    const door = D.makeDoors(bg);
    D.door = door;
    // v17：一道光从左到右扫过外层门（53.5–54.3），扫过的地方外层变透明、露出里层
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="sweepg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6dc" stop-opacity="0"/><stop offset=".5" stop-color="#fff6dc" stop-opacity=".95"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>`);
    const sweep = D.el(D.L.mid, "rect", { y: 530 - 350, width: 160, height: 700, fill: "url(#sweepg)", opacity: 0 });
    D.onFrame((t) => {
      if (t < 53.3 || t > 54.6) { D.op(sweep, 0); return; }
      const k = D.prog(t, 53.45, 0.9, D.ease.inOut);
      D.attr(sweep, "x", D.lerp(960 - 330 - 80, 960 + 330 - 80, k));
      D.op(sweep, Math.sin(Math.PI * k) * 0.9);
    });
    const DY = 530;
    // 51.2 门出现；53.4–57.2 第一道门半透明露出第二道门；57.2 门楣；门后生活时隐藏；70.55 回来，三次撞第一道门；
    // 105.13 "直到 AI"（门隐藏，先讲 AI 会干什么）；112.4 门回来，小螃蟹走来，114.80 推开第一道门、庆祝；
    // 124.49 走进走廊；127.25 第二道门上出现锁；131.39 / 134.16 / 136.92 三次猛撞；155.0 锁孔特写；162.6 钻进锁孔
    const PUSH = [73.31, 76.08, 78.84];
    const OPEN = 114.8;
    const RAMS = [131.39, 134.16, 136.92];
    const OP = [[51.0, 0], [51.6, 1], [59.9, 1], [60.3, 0], [70.3, 0], [70.8, 1], [84.8, 1], [85.3, 0], [112.1, 0], [112.4, 1], [139.5, 1], [139.8, 0], [155.0, 0], [155.6, 1], [163.7, 1], [163.72, 0]];
    // 推近第二道门的镜头：以第二道门中心 (960, DY+95) 为锚点放大 CAM_C 倍，并把它移到 (960, 480)
    const CAM = (t) => { const k = t < 139.7 ? D.prog(t, 126.2, 1.0, D.ease.inOut) : 0; return { c: D.lerp(1, 1.9, k), ax: 960, ay: DY + 95, tx: 960, ty: D.lerp(DY + 95, 480, k) }; };
    const camPt = (cm, x, y) => [cm.tx + (x - cm.ax) * cm.c, cm.ty + (y - cm.ay) * cm.c];
    D.camDoor = CAM; D.camPt = camPt;
    const impactK = (t, list, d = 0.25) => list.reduce((acc, h) => acc + (t >= h ? Math.max(0, 1 - (t - h) / d) : 0), 0);
    D.onFrame((t) => {
      if (t < 45.4 || t > 163.8) return;
      // v11：纸面慢慢变成冷白（不再闪白硬切）
      D.op(warmBg, 1 - D.prog(t, 104.35, 1.1, D.ease.inOut));
      D.op(aiBg, D.prog(t, 104.35, 1.1, D.ease.inOut));
      D.op(flash, 0);
      let aL = 0;
      PUSH.forEach((p, i) => { if (t >= p) aL = D.lerp(i * 10, (i + 1) * 10, D.prog(t, p, 0.35, D.ease.out)); });
      const op1 = D.prog(t, OPEN, 0.8, D.ease.out);
      const a1 = D.lerp(aL, 80, op1), a1R = D.lerp(0, 80, op1);
      let rattle = 0;
      RAMS.forEach((h, i) => (rattle += Math.max(0, D.shake(t, h, 7 + 2 * i, 0.7, 26))));
      const red = D.prog(t, RAMS[0], 0.2) * (1 - D.prog(t, 139.5, 0.3)) + D.prog(t, 155.6, 0.4);
      const xray = D.win(t, 53.55, 57.2, 0.6); // v17：跟着扫过的光一起变透明
      const [kx, ky] = door.keyhole;
      const kz = D.prog(t, 155.0, 1.2, D.ease.inOut), dive = D.prog(t, 162.6, 1.06, D.ease.in);
      const bump = 1 + 0.025 * impactK(t, RAMS, 0.25) + 0.015 * impactK(t, PUSH, 0.25);
      const s = D.lerp(1, 4.2, kz) * Math.pow(150, dive) * bump; // v11：锁孔放大到盖满画面，再切夜之城
      const hitFlash = impactK(t, PUSH, 0.4) + impactK(t, RAMS, 0.35);
      const cm = CAM(t);
      const [cx0, cy0] = camPt(cm, 960, DY);
      door.set({
        x: D.lerp(cx0, D.lerp(700, 960, dive) - kx * s, kz), y: D.lerp(cy0, D.lerp(560, 540, dive) - ky * s, kz), s: kz > 0 ? s : s * cm.c, a1, a1R, xray, op: D.keyed(OP, t, D.ease.lin),
        glow: Math.max(op1 * 0.6, Math.min(1, hitFlash) * 0.8) * (t > 154.9 ? 0.3 : 1), lintelOp: D.prog(t, 57.2, 0.8) * (1 - kz),
        plateOp: D.prog(t, 54.0, 0.5) * (1 - kz),
        lockOp: D.prog(t, 127.25, 0.3) * (t < 139.7 || t > 154.8 ? 1 : 0), red: red * (1 - dive), rattle,
      });
    });

    // ---------- 小螃蟹（代表 AI；用户指定用 Claude 的吉祥物形象）----------
    const crabG = D.g(M), crab = D.g(crabG);
    const C = "#d97757", CD = "#b85f42";
    const legs = [-48, -24, 12, 36].map((x) => D.el(crab, "rect", { x, y: -22, width: 12, height: 22, fill: CD }));
    const armL = D.el(crab, "rect", { x: -84, y: -60, width: 26, height: 16, fill: C });
    const armR = D.el(crab, "rect", { x: 58, y: -60, width: 26, height: 16, fill: C });
    D.el(crab, "rect", { x: -60, y: -86, width: 120, height: 66, fill: C });
    D.el(crab, "rect", { x: -60, y: -32, width: 120, height: 12, fill: CD });
    const eyes = [-30, 18].map((x) => D.el(crab, "rect", { x, y: -72, width: 12, height: 20, fill: "#1a1410" }));
    const qm = D.el(crabG, "text", { x: 0, y: -170, "text-anchor": "middle", class: "serif", "font-size": 100, "font-weight": 800, fill: "#c8281e" }, "?");
    // 撞晕时头上转的星星
    const stars = D.g(crabG);
    const starEls = [0, 1, 2, 3].map(() => D.el(stars, "text", { "text-anchor": "middle", "font-size": 40, fill: "#e8b030" }, "✦"));
    // 庆祝彩纸
    const confG = D.g(M);
    const conf = Array.from({ length: 44 }, (_, i) => ({ el: D.el(confG, "rect", { width: 14, height: 9, fill: ["#c8281e", "#d9a441", "#f2cf7a", "#d97757"][i % 4] }), vx: -380 + 760 * D.hash(i * 1.7), vy: -900 - 500 * D.hash(i * 2.3), rs: 400 * (D.hash(i * 5.1) - 0.5) }));
    // 撞门的冲击线（第二道门的锁附近）
    const ramBurst = D.g(M);
    const ramRays = Array.from({ length: 10 }, () => D.el(ramBurst, "line", { stroke: "#c8281e", "stroke-width": 8, "stroke-linecap": "round" }));
    const CK = { x: [[112.4, -220], [114.3, 560], [120.3, 560], [122.0, 960], [140, 960]], y: [[124.49, 865], [126.4, 800]], s: [[124.49, 2.0], [126.4, 1.05]] };
    D.onFrame((t) => {
      const vis = t >= 112.4 && t < 139.6;
      D.op(crabG, vis ? 1 : 0);
      if (!vis) { D.op(confG, 0); D.op(ramBurst, 0); return; }
      const x = D.keyed(CK.x, t, D.ease.lin);
      const walking = (t > 112.4 && t < 114.3) || (t > 120.3 && t < 122.0) || (t > 124.49 && t < 126.4);
      legs.forEach((l, i) => D.attr(l, "y", -22 - (walking ? Math.max(0, Math.sin(t * 22 + i * Math.PI / 2)) * 8 : 0)));
      let y = t < 124.49 ? 865 : D.keyed(CK.y, t, D.ease.lin);
      let sc = t < 124.49 ? 2.0 : D.keyed(CK.s, t, D.ease.lin);
      let rot = 0;
      // 推第一道门：伸手
      const reach = Math.sin(D.clamp((t - 114.45) / 0.5) * Math.PI) * 44;
      // 推开后庆祝：连跳三下，双手举高，撒彩纸
      const cel = t > 114.95 && t < 116.4;
      let hop = 0;
      if (cel) { const k = (t - 114.95) / 0.48; hop = Math.abs(Math.sin(k * Math.PI)) * 60; }
      // 撞第二道门：后退蓄力 → 冲刺 → 撞上 → 被弹飞翻滚（第三次直接四脚朝天）
      let dy = 0, ds = 0, starsK = 0;
      RAMS.forEach((h, i) => {
        if (t >= h - 0.9 && t < h - 0.35) { const k = D.ease.out((t - (h - 0.9)) / 0.55); dy += 50 * k; ds += 0.12 * k; }
        else if (t >= h - 0.35 && t < h) { const k = D.ease.in((t - (h - 0.35)) / 0.35); dy += D.lerp(50, -18, k); ds += D.lerp(0.12, -0.06, k); }
        else if (t >= h && t < h + 0.8) {
          const k = (t - h) / 0.8;
          const back = i < 2 ? 90 : 30;
          dy += D.lerp(-18, back, D.ease.out(k)); ds += D.lerp(-0.06, i < 2 ? 0.18 : 0.04, D.ease.out(k));
          hop += Math.sin(Math.min(1, k * 1.6) * Math.PI) * 70;
          rot += i < 2 ? Math.sin(k * Math.PI * 3) * 18 * (1 - k) : 180 * D.ease.out(Math.min(1, k * 1.4));
        }
        if (i < 2 && t >= h + 0.8 && t < RAMS[i + 1] - 0.9) { dy += 90 * (1 - D.prog(t, h + 0.8, 0.4)); ds += 0.18 * (1 - D.prog(t, h + 0.8, 0.4)); }
        if (i === 2 && t >= h + 0.8) { dy += 30; ds += 0.04; rot = 180; }
        if (t >= h && t < h + 1.0) starsK = Math.max(starsK, 1 - (t - h) / 1.0);
      });
      if (t > 137.7) starsK = Math.max(starsK, 0.8);
      sc += ds;
      const cm = D.camDoor(t);
      const [cxp, cyp] = D.camPt(cm, x, y + dy - hop);
      D.tf(crabG, cxp, cyp, sc * cm.c);
      crab.setAttribute("transform", rot ? `rotate(${D.f(rot)} 0 -50)` : "");
      // 手臂：推门时向右伸；庆祝时举高；撞门时向前伸
      if (cel) {
        D.attr(armL, "x", -84); D.attr(armL, "y", -120); D.attr(armL, "width", 16); D.attr(armL, "height", 46);
        D.attr(armR, "x", 68); D.attr(armR, "y", -120); D.attr(armR, "width", 16); D.attr(armR, "height", 46);
      } else {
        const fwd = RAMS.some((h) => t >= h - 0.35 && t < h + 0.15) ? 30 : 0;
        D.attr(armL, "x", -84 - fwd); D.attr(armL, "y", -60); D.attr(armL, "width", 26 + fwd); D.attr(armL, "height", 16);
        D.attr(armR, "x", 58); D.attr(armR, "y", -60); D.attr(armR, "width", 26 + (t < 117 ? reach : fwd)); D.attr(armR, "height", 16);
      }
      const squint = RAMS.some((h) => t >= h && t < h + 0.5) || t > 137.6;
      eyes.forEach((e) => { D.attr(e, "height", squint ? 6 : 20); D.attr(e, "y", squint ? -64 : -72); });
      // 星星
      D.op(stars, starsK);
      starEls.forEach((e, i) => { const a = t * 6 + i * Math.PI / 2; e.setAttribute("x", D.f(Math.cos(a) * 80)); e.setAttribute("y", D.f(-120 + Math.sin(a) * 22)); });
      D.op(qm, D.prog(t, 138.0, 0.3));
      D.attr(qm, "y", -175 - 10 * Math.sin(t * 4));
      // 彩纸
      const ck = t - 115.0;
      D.op(confG, ck > 0 && ck < 1.6 ? 1 - Math.max(0, (ck - 1.1) / 0.5) : 0);
      if (ck > 0 && ck < 1.6) conf.forEach((c) => { c.el.setAttribute("transform", `translate(${D.f(560 + c.vx * ck)} ${D.f(720 + c.vy * ck + 900 * ck * ck)}) rotate(${D.f(c.rs * ck)})`); });
      // 撞门冲击线
      const h = [...RAMS].reverse().find((v) => t >= v);
      const rk = h == null ? 1 : D.clamp((t - h) / 0.35);
      D.op(ramBurst, h == null ? 0 : 1 - rk);
      ramRays.forEach((r, i) => {
        const a = (i / 10) * Math.PI * 2, r0 = 70 + 110 * rk, r1 = 150 + 220 * rk, [cx, cy] = D.camPt(D.camDoor(t), 960, 740);
        D.attr(r, "x1", cx + Math.cos(a) * r0); D.attr(r, "y1", cy + Math.sin(a) * r0);
        D.attr(r, "x2", cx + Math.cos(a) * r1); D.attr(r, "y2", cy + Math.sin(a) * r1);
      });
    });

    // ---------- S4：推开它的条件 → 三代机器撞门（70.55–85.0） ----------
    const s4 = D.scene(M, 70.55, 85.0, 0.3);
    const MLAB = [["1850", "蒸汽机"], ["1950", "流水线"], ["2000", "电脑"]];
    const machs = ["steam", "belt", "pc"].map((k, i) => {
      const g = D.g(s4), body = D.g(g);
      D.svg(body, MACH[k], { fill: "rgba(255,255,255,.85)", stroke: "#2a2018", "stroke-width": 5, "stroke-linejoin": "round" });
      const lab = D.g(g);
      D.el(lab, "text", { y: 150, "text-anchor": "middle", class: "serif", "font-size": 40, "font-weight": 800, fill: "#c8281e" }, MLAB[i][0]);
      D.el(lab, "text", { y: 200, "text-anchor": "middle", class: "serif", "font-size": 46, "font-weight": 800, fill: "#2a2018" }, MLAB[i][1]);
      return { g, body };
    });
    D.onFrame((t) => {
      if (t < 70.4 || t > 85.1) return;
      machs.forEach((m, i) => {
        const p = PUSH[i];
        // 从画面左边慢慢冲过来（1.4 秒），撞上门（x≈560），弹回一点，然后缩小停到左侧一列
        const come = D.prog(t, p - 1.4, 1.4, D.ease.in), recoil = Math.sin(D.clamp((t - p) / 0.45) * Math.PI);
        const park = D.prog(t, p + 1.0, 0.8, D.ease.inOut);
        const x = D.lerp(-260, 500, come) - 80 * recoil;
        D.tf(m.g, D.lerp(x, 170, park), D.lerp(500, 180 + i * 250, park), D.lerp(1.8, 0.62, park));
        D.op(m.g, t < p - 1.4 ? 0 : 1);
      });
    });
    // 撞击点的冲击线
    const burst = D.g(s4);
    const rays = Array.from({ length: 8 }, (_, i) => D.el(burst, "line", { stroke: "#c8281e", "stroke-width": 7, "stroke-linecap": "round" }));
    D.onFrame((t) => {
      if (t < 73 || t > 80) { D.op(burst, 0); return; }
      const p = [...PUSH].reverse().find((x) => t >= x);
      const k = p == null ? 1 : D.clamp((t - p) / 0.4);
      D.op(burst, p == null ? 0 : 1 - k);
      rays.forEach((r, i) => {
        const a = (i / 8) * Math.PI * 2, r0 = 40 + 60 * k, r1 = 90 + 110 * k;
        D.attr(r, "x1", 660 + Math.cos(a) * r0); D.attr(r, "y1", 500 + Math.sin(a) * r0);
        D.attr(r, "x2", 660 + Math.cos(a) * r1); D.attr(r, "y2", 500 + Math.sin(a) * r1);
      });
    });
    D.text("推开外层门的条件：<br>机器得<em style='color:#c8281e'>足够能干</em>", 1610, 380, { anchor: "center", cls: "serif", style: "font-size:58px;font-weight:800;color:#1e1b18;letter-spacing:4px;line-height:1.5", win: [70.55, 73.2] });
    D.text("一代代机器去撞它", 1610, 420, { anchor: "center", cls: "serif", style: "font-size:56px;font-weight:800;color:#1e1b18;letter-spacing:4px", win: [73.31, 79.5] });
    D.text("门只开了一条缝<br><span style='font-size:42px;color:#5a4630'>机器只能替人的手<br>替不了人的脑</span>", 1610, 360, { anchor: "center", cls: "serif", style: "font-size:60px;font-weight:800;color:#c8281e;letter-spacing:3px;line-height:1.45", win: [79.6, 84.9] });

    // ---------- v11：这把锁早就在了——美国生产率与普通工人时薪（EPI，1948 = 100）----------
    // 放映时间 = 下面的时间 + 41.35（重排 + 片名前加长）
    const EPI = [[1948,102.7,103.1],[1949,104.7,110.3],[1950,112.9,112.1],[1951,114.3,113.7],[1952,117.5,117.3],[1953,119.7,122.6],[1954,126.8,127.8],[1955,131.8,132.3],[1956,134.3,135.8],[1957,136.5,138.5],[1958,141.9,140],[1959,144.5,143.3],[1960,144.9,146.5],[1961,153.8,149.1],[1962,158.9,153.3],[1963,165.4,157.2],[1964,168.7,160.4],[1965,178.5,164.8],[1966,179.4,165.7],[1967,182.3,169.2],[1968,188,172.9],[1969,189.6,177.2],[1970,193.9,178.9],[1971,202.6,184.9],[1972,213.7,193.9],[1973,211.8,189.9],[1974,207,186.6],[1975,214.7,186.6],[1976,218.6,190.7],[1977,220.3,193.5],[1978,224,195.4],[1979,216.8,190.7],[1980,214.7,187.7],[1981,216,186.5],[1982,215.9,187.1],[1983,225.2,188.5],[1984,228.7,187.4],[1985,232.3,187.2],[1986,236.7,189.3],[1987,237,186.4],[1988,239.6,186.7],[1989,240.4,187.1],[1990,237.7,183.8],[1991,245.1,186.4],[1992,254.6,187],[1993,254.5,187.8],[1994,256.3,188.2],[1995,256.8,187.8],[1996,258.9,187.9],[1997,264.9,191.6],[1998,270.9,195.8],[1999,276.3,198],[2000,280.7,200],[2001,285.8,205],[2002,292.4,209.1],[2003,307.3,210],[2004,312.8,209.3],[2005,316.7,209],[2006,319.8,212.6],[2007,322.7,212.7],[2008,321.9,217.6],[2009,337.1,222.1],[2010,344.7,224.8],[2011,338.6,221.4],[2012,339.6,219.8],[2013,347,224],[2014,348.5,225.2],[2015,353.6,229.9],[2016,357.9,231.4],[2017,362.7,232.8],[2018,365.2,236.7],[2019,374.1,240],[2020,389.9,248],[2021,395.8,246.1],[2022,390.4,242.5],[2023,400.4,247.2],[2024,407.5,251.2],[2025,416.7,254.7],[2026.4,419.9,253]];
    const cht = D.scene(M, 85.3, 104.2, 0.4); // 必须在 104.3 前完全消失：104.3 之后的旧时间被重排到「直到 AI」之前
    const CX0 = 300, CX1 = 1540, CY0 = 760, CY1 = 260;
    const yr2x = (y) => CX0 + ((y - 1948) / (2026.4 - 1948)) * (CX1 - CX0);
    const v2y = (v) => CY0 - ((v - 100) / (430 - 100)) * (CY0 - CY1);
    D.el(cht, "line", { x1: CX0, y1: CY0, x2: CX1 + 20, y2: CY0, stroke: "#2a2018", "stroke-width": 4 });
    [1948, 1979, 2026].forEach((y) => D.el(cht, "text", { x: yr2x(y), y: CY0 + 46, "text-anchor": "middle", class: "serif", "font-size": 32, "font-weight": 700, fill: "#5a4630" }, String(y)));
    const mark79 = D.el(cht, "line", { x1: yr2x(1979), y1: CY1 - 10, x2: yr2x(1979), y2: CY0, stroke: "#5a4630", "stroke-width": 3, "stroke-dasharray": "10 10", opacity: 0 });
    const gap = D.el(cht, "polygon", { fill: "#c8281e", opacity: 0 });
    const lineP = D.el(cht, "polyline", { fill: "none", stroke: "#1e1b18", "stroke-width": 8, "stroke-linejoin": "round", "stroke-linecap": "round" });
    const lineW = D.el(cht, "polyline", { fill: "none", stroke: "#c8281e", "stroke-width": 8, "stroke-linejoin": "round", "stroke-linecap": "round" });
    const dotP = D.el(cht, "circle", { r: 11, fill: "#1e1b18" }), dotW = D.el(cht, "circle", { r: 11, fill: "#c8281e" });
    const upTo = (yr) => {
      const out = [];
      for (let i = 0; i < EPI.length; i++) {
        const [y, p, w] = EPI[i];
        if (y <= yr) { out.push([y, p, w]); continue; }
        const [y0, p0, w0] = EPI[i - 1], k = (yr - y0) / (y - y0);
        out.push([yr, D.lerp(p0, p, k), D.lerp(w0, w, k)]); break;
      }
      return out;
    };
    D.onFrame((t) => {
      if (t < 85.2 || t > 104.6) return;
      const yr = t < 89.6 ? D.lerp(1948, 1979, D.prog(t, 86.0, 3.5, D.ease.inOut)) : D.lerp(1979, 2026.4, D.prog(t, 90.1, 4.9, D.ease.inOut));
      const pts = upTo(yr);
      D.attr(lineP, "points", pts.map(([y, p]) => `${D.f(yr2x(y))},${D.f(v2y(p))}`).join(" "));
      D.attr(lineW, "points", pts.map(([y, , w]) => `${D.f(yr2x(y))},${D.f(v2y(w))}`).join(" "));
      const [ly, lp, lw] = pts[pts.length - 1];
      D.attr(dotP, "cx", yr2x(ly)); D.attr(dotP, "cy", v2y(lp)); D.attr(dotW, "cx", yr2x(ly)); D.attr(dotW, "cy", v2y(lw));
      D.op(mark79, D.prog(t, 89.4, 0.4));
      const g79 = pts.filter(([y]) => y >= 1979);
      D.attr(gap, "points", g79.length > 1 ? [...g79.map(([y, p]) => `${D.f(yr2x(y))},${D.f(v2y(p))}`), ...g79.reverse().map(([y, , w]) => `${D.f(yr2x(y))},${D.f(v2y(w))}`)].join(" ") : "");
      D.op(gap, 0.2 * D.prog(t, 91.0, 1.5));
    });
    const HS = "font-weight:800;color:#1e1b18;letter-spacing:4px";
    D.text("这把锁，其实<em style='color:#c8281e'>早就在了</em>", 960, 60, { anchor: "center", cls: "serif", style: `font-size:58px;${HS}`, win: [85.3, 104.3] });
    D.text("美国 · 每小时产出 vs 普通工人时薪（1948 年 = 100）", 960, 150, { anchor: "center", style: "font-size:30px;font-weight:600;color:rgba(42,32,24,.72)", win: [85.6, 104.3] });
    D.text("1948–1979：<br>产出涨，<br>工资也<em style='color:#c8281e'>跟着涨</em>", 560, 300, { anchor: "center", cls: "serif", style: "font-size:50px;line-height:1.45;font-weight:800;color:#1e1b18;letter-spacing:3px", win: [86.8, 89.9] });
    D.text("<div style='font-size:30px;color:#5a4630'>每小时产出</div><div class='num' style='font-size:64px;color:#1e1b18'>+93.7%</div>", 1560, 200, { win: [94.6, 104.3] });
    D.text("<div style='font-size:30px;color:#a3241b'>普通工人时薪</div><div class='num' style='font-size:64px;color:#c8281e'>+32.7%</div>", 1560, 470, { win: [94.9, 104.3] });
    D.text("1979 年之后", 1560, 640, { style: "font-size:28px;font-weight:600;color:#5a4630", win: [94.6, 104.3] });
    D.text("多出来的钱，大多<br><em style='color:#c8281e'>没有分到普通干活的人手里</em>", 760, 330, { anchor: "center", cls: "serif", style: "font-size:52px;line-height:1.5;font-weight:800;color:#1e1b18;letter-spacing:3px", win: [96.4, 104.3] });
    D.text("数据：美国经济政策研究所（EPI），2026", 1540, 828, { anchor: "right", style: "font-size:24px;font-weight:500;color:rgba(42,32,24,.7)", win: [86.0, 104.3] });

    // ---------- S5 ----------
    D.text("直到 AI", 960, 360, { anchor: "center", cls: "serif", style: "font-size:220px;font-weight:800;color:#0f2a36;letter-spacing:24px;text-shadow:0 0 50px rgba(255,255,255,.95)", win: [105.0, 107.2], d: 0.8 });

    // 三格：写文章 / 画画 / 写代码
    const panes = D.scene(M, 107.3, 112.4, 0.3);
    D.text("这一次，机器开始替人的<em style='color:#1f6f8f'>脑</em>", 960, 90, { anchor: "center", cls: "serif", style: "font-size:76px;font-weight:800;color:#0f2a36;letter-spacing:6px", win: [107.3, 112.3] });
    const PT = [107.3, 107.9, 108.5];
    const paneG = [0, 1, 2].map((i) => {
      const g = D.g(panes);
      D.el(g, "rect", { x: -270, y: -200, width: 540, height: 400, rx: 18, fill: "#ffffff", stroke: "#7fc8e8", "stroke-width": 3, filter: "url(#shadowD)" });
      D.el(g, "rect", { x: 190, y: -184, width: 64, height: 36, rx: 8, fill: "#7fc8e8" });
      D.el(g, "text", { x: 222, y: -157, "text-anchor": "middle", "font-size": 24, fill: "#07131a" }, "AI");
      D.el(g, "text", { x: 0, y: 270, "text-anchor": "middle", class: "serif", "font-size": 50, "font-weight": 800, fill: "#0f2a36" }, ["写文章", "画画", "写代码"][i]);
      return g;
    });
    const lines1 = [0, 1, 2, 3, 4, 5].map((j) => D.el(paneG[0], "rect", { x: -220, y: -110 + j * 52, width: 0, height: 18, rx: 9, fill: "#9fb3bd", opacity: 0.9 }));
    const cursor = D.el(paneG[0], "rect", { x: -220, y: -116, width: 6, height: 30, fill: "#7fc8e8" });
    const stroke = D.el(paneG[1], "path", { d: "M-220 110 C -160 -40, -90 -60, -40 40 S 60 -120, 120 10 S 200 60, 230 -20", fill: "none", stroke: "#d9a441", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": 900, "stroke-dashoffset": 900 });
    const sun = D.el(paneG[1], "circle", { cx: 150, cy: -90, r: 0, fill: "#ff8a5c" });
    const CODE = [["def", "#c8281e", " build():"], ["  ", "#1e1b18", "plan = think()"], ["  ", "#1e1b18", "for step in plan:"], ["    ", "#1f6f8f", "run(step)"], ["  ", "#b07a12", "return result"]];
    const codeEls = CODE.map(([a, c, b], j) => D.el(paneG[2], "text", { x: -220, y: -100 + j * 56, "font-size": 34, fill: c, style: "font-family:Consolas,monospace;font-weight:700" }, a + b));

    // 门两侧的标签：外层门（生产力）、里层门（分配）
    D.text(`<span class="chip" style="background:rgba(255,255,255,.9);color:#1f5f7a;border:2px solid #7fc8e8;font-size:44px">外层门：生产力<br><small style="font-size:30px;font-weight:500">AI 推开了</small></span>`, 230, 360, { win: [116.4, 139.5] });
    D.text(`<span class="chip" style="background:rgba(255,245,240,.92);color:#a3241b;border:2px solid #e8a090;font-size:44px">里层门：分配<br><small style="font-size:30px;font-weight:500">机器干的活，钱归谁？</small></span>`, 1700, 360, { anchor: "right", win: [124.49, 139.5] });

    D.onFrame((t) => {
      if (t < 107.1 || t > 112.6) return;
      paneG.forEach((g, i) => D.tf(g, 380 + i * 580, 500, t < PT[i] ? 0 : D.pop(t, PT[i], 0.45)));
      lines1.forEach((r, j) => D.attr(r, "width", 440 * (j === 5 ? 0.55 : 1) * D.clamp((t - 107.6 - j * 0.6) / 0.5)));
      const li = Math.min(5, Math.max(0, Math.floor((t - 107.6) / 0.6)));
      D.attr(cursor, "y", -116 + li * 52); D.attr(cursor, "x", -220 + 440 * D.clamp((t - 107.6 - li * 0.6) / 0.5) * (li === 5 ? 0.55 : 1) + 6);
      D.op(cursor, Math.sin(t * 12) > 0 ? 1 : 0.2);
      D.attr(stroke, "stroke-dashoffset", 900 * (1 - D.prog(t, 108.1, 3.4, D.ease.inOut)));
      D.attr(sun, "r", 34 * D.pop(t, 111.2, 0.5));
      codeEls.forEach((e, j) => D.op(e, D.prog(t, 108.9 + j * 0.6, 0.2)));
    });
  };
})();
