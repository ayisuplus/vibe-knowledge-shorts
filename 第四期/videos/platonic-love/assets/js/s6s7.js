// S6 第俄提玛（93.59–110.61）· S7 爱的阶梯（110.61–133.99）
(function () {
  const D = window.D, C = D.C;
  // 阶梯几何（与样张 C 相同）
  const N = 6, W = 214, H = 98, DX = 34, DY = -24, X0 = 300, FLOOR = 880;
  const stepTop = (i) => FLOOR - (i + 1) * H, xl = (i) => X0 + i * W;
  const tx = (i) => xl(i) + W / 2 + DX / 2, ty = (i) => stepTop(i) + DY / 2;
  const BX = tx(N - 1), BY = stepTop(N - 1) - 150; // 顶端光源
  D.ladderGeo = { N, W, H, DX, DY, X0, FLOOR, stepTop, xl, tx, ty, BX, BY };
  const labels = ["一个人", "所有人", "灵魂", "城邦与法律", "知识", "美本身"];
  const STEP_T = [109.27, 114.86, 116.98, 119.11, 121.23, 123.36]; // 每级"亮起"的时刻

  // 一架阶梯（返回各部件，供 S7 和结尾复用）
  D.buildLadder = (parent, id) => {
    const g = D.g(parent, { id });
    g.insertAdjacentHTML("beforeend", `<defs>
      <linearGradient id="${id}-riser" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8f1e4"/><stop offset=".15" stop-color="#ebdfcb"/><stop offset="1" stop-color="#cdbb9f"/></linearGradient>
      <linearGradient id="${id}-tread" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f3e8d4"/></linearGradient>
      <linearGradient id="${id}-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bba68a"/><stop offset="1" stop-color="#d8c7ab"/></linearGradient></defs>`);
    const steps = [];
    for (let i = 0; i < N; i++) {
      const x = xl(i), y = stepTop(i), s = D.g(g);
      s.insertAdjacentHTML("beforeend", `
        <path d="M${x + W},${y} L${x + W + DX},${y + DY} L${x + W + DX},${FLOOR + DY} L${x + W},${FLOOR} Z" fill="url(#${id}-side)"/>
        <path d="M${x},${y} L${x + DX},${y + DY} L${x + W + DX},${y + DY} L${x + W},${y} Z" fill="url(#${id}-tread)"/>
        <rect x="${x}" y="${y}" width="${W}" height="${FLOOR - y}" fill="url(#${id}-riser)"/>
        ${i > 0 ? `<rect x="${x}" y="${y}" width="14" height="${FLOOR - y}" fill="#a88f70" opacity=".18"/>` : ""}
        <text x="${x + W / 2}" y="${y + 44}" text-anchor="middle" font-weight="700" font-size="26" letter-spacing="3" fill="${i === N - 1 ? "#a8762c" : "#7a6450"}">${labels[i]}</text>
        <line x1="${x + W / 2 - 26}" x2="${x + W / 2 + 26}" y1="${y + 60}" y2="${y + 60}" stroke="${C.gold}" stroke-width="1.5" opacity=".7"/>`);
      const rim = D.el(s, "path", { d: `M${x},${y} H${x + W} L${x + W + DX},${y + DY}`, fill: "none", stroke: C.goldHi, "stroke-width": 3, filter: "url(#gl)" });
      steps.push({ g: s, rim });
    }
    return { g, steps };
  };

  D.scene67 = () => {
    const mid = D.L.mid;
    // ================= S6 =================
    const s6 = D.g(mid, { id: "s6" });
    const sky = D.el(s6, "ellipse", { cx: 960, cy: 40, rx: 900, ry: 380, fill: "url(#sky)" });
    const soc = D.g(s6); D.el(soc, "image", { href: "assets/img/socrates-cut.jpg", x: 0, y: 0, width: 507, height: 760, filter: "url(#shadow)" });
    const dio = D.g(s6); D.el(dio, "image", { href: "assets/img/diotima-cut.jpg", x: 0, y: 0, width: 533, height: 800, filter: "url(#shadow)" });
    // 丰富（满溢的金杯）与贫乏（空碗）→ 带翅膀的小火苗
    const cup = D.g(s6), bowl = D.g(s6);
    cup.insertAdjacentHTML("beforeend", `<path d="M-70,-40 Q-66,30 0,40 Q66,30 70,-40 Z" fill="#e3b660" stroke="#a8762c" stroke-width="3"/><path d="M0,40 v34 M-36,80 h72" stroke="#a8762c" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="0" cy="-40" rx="70" ry="14" fill="#fff0c4"/><path d="M-60,-44 q-8,30 -22,52 M58,-42 q10,26 20,44" stroke="#f4cf7c" stroke-width="7" stroke-linecap="round" fill="none"/>
      <text x="0" y="128" text-anchor="middle" font-size="34" font-weight="800" fill="${C.ink2}" letter-spacing="6">丰富</text>`);
    bowl.insertAdjacentHTML("beforeend", `<path d="M-74,-20 Q-60,44 0,48 Q60,44 74,-20 Z" fill="#d9c9b0" stroke="#8a7458" stroke-width="3"/><ellipse cx="0" cy="-20" rx="74" ry="14" fill="#b7a487"/><ellipse cx="0" cy="-18" rx="60" ry="9" fill="#9c8a70"/>
      <text x="0" y="128" text-anchor="middle" font-size="34" font-weight="800" fill="${C.ink2}" letter-spacing="6">贫乏</text>`);
    const streams = D.g(s6, { fill: "none", "stroke-linecap": "round", filter: "url(#gl)" });
    const st1 = D.el(streams, "path", { d: "M760,530 Q800,400 960,410", stroke: C.goldHi, "stroke-width": 5, "stroke-dasharray": "400" });
    const st2 = D.el(streams, "path", { d: "M1160,560 Q1120,400 960,410", stroke: "#c8b79a", "stroke-width": 5, "stroke-dasharray": "400" });
    const flame = D.g(s6);
    flame.insertAdjacentHTML("beforeend", `<circle r="70" fill="url(#goldDot)" opacity=".7"/>
      <path d="M-12,10 Q-70,-10 -96,-40 Q-60,-34 -30,-20 Q-70,-50 -80,-80 Q-40,-56 -14,-30 Z M12,10 Q70,-10 96,-40 Q60,-34 30,-20 Q70,-50 80,-80 Q40,-56 14,-30 Z" fill="#f3d48e" stroke="#c99a4a" stroke-width="2"/>
      <path d="M0,30 Q-30,0 -10,-40 Q0,-60 0,-80 Q12,-50 18,-36 Q34,0 0,30 Z" fill="#ffe7a8" stroke="#e0a64a" stroke-width="2.5"/>`);
    // 碎陶片里的"另一半"
    const shard = D.g(s6);
    shard.insertAdjacentHTML("beforeend", `<path d="M-170,-190 L60,-220 L190,-120 L170,90 L60,210 L-120,190 L-200,40 Z" fill="${C.glaze}" stroke="#3a2a20" stroke-width="4" filter="url(#shadow)"/>
      <g transform="translate(-6 -10)">${D.roundHuman("s6half", { r: 70, half: -1 })}</g>
      <text x="0" y="-250" text-anchor="middle" font-size="40" font-weight="800" fill="${C.ink}">「另一半」</text>`);
    // 断臂的雕像
    const statue = D.g(s6);
    D.el(statue, "image", { href: "assets/img/statue-body.jpg", x: 0, y: 0, width: 640, height: 960 });
    const armG = D.g(statue);
    D.el(armG, "image", { href: "assets/img/statue-arm-only.jpg", x: 0, y: 0, width: 640, height: 960 });
    const cracks = D.el(armG, "path", { d: "M70,190 l12,18 l-8,14 l10,20 M150,200 l-6,22 l10,12 M210,196 l8,16 l-10,18 l6,14", fill: "none", stroke: "#6b5646", "stroke-width": 2.5, "stroke-dasharray": "260" });
    // 金色微尘：先从断臂飘起，再聚到左下角变成第一级台阶
    const gd = D.g(s6), RG = D.rng(55), gps = [];
    const lg = D.ladderGeo;
    for (let i = 0; i < 70; i++) gps.push({ e: D.el(gd, "circle", { r: 2 + RG() * 4, fill: C.goldHi, filter: "url(#soft)" }), x: 1060 + RG() * 240, y: 210 + RG() * 60, vx: (RG() - .5) * 80, vy: -40 - RG() * 80, tx: lg.xl(0) + RG() * lg.W, ty: lg.stepTop(0) + RG() * 30, d: RG() * .5 });

    D.onFrame((t) => {
      const on = t > 93.3 && t < 110.9;
      D.op(s6, on ? 1 : 0);
      if (!on) return;
      D.op(sky, D.clamp((t - 93.4) / .8) * (.55 + .45 * D.clamp((t - 106.61) / .6)));
      const kIn = D.prog(t, 93.59, .8);
      const busts = (1 - D.clamp((t - 101.9) / .5));
      D.tf(soc, 140, 130 + (1 - kIn) * 40); D.op(soc, kIn * busts);
      D.tf(dio, 1250, 90 + (1 - kIn) * 40); D.op(dio, D.prog(t, 93.9, .8) * busts);
      const kc = D.prog(t, 97.85, .5);
      D.tf(cup, 760, 600, 1.35); D.op(cup, kc * busts);
      D.tf(bowl, 1160, 600, 1.35); D.op(bowl, D.prog(t, 98.1, .5) * busts);
      st1.setAttribute("stroke-dashoffset", D.f(400 * (1 - D.clamp((t - 98.4) / .8))));
      st2.setAttribute("stroke-dashoffset", D.f(400 * (1 - D.clamp((t - 98.6) / .8))));
      D.op(streams, t > 98.4 ? busts * (1 - .6 * D.clamp((t - 99.4) / .5)) : 0);
      const kf = D.clamp((t - 99.1) / .5);
      const reach = t > 99.97 ? D.ease.out(D.clamp((t - 99.97) / 1.2)) * 110 + Math.sin((t - 99.97) * 5) * 12 * D.clamp((t - 100.6) / .5) : 0;
      D.tf(flame, 960, 400 - reach, 1.6 * D.lerp(.4, 1, D.ease.back(kf)) * (1 + Math.sin(t * 9) * .03));
      D.op(flame, t < 99.1 ? 0 : kf * busts);
      // 碎陶片
      const ks = D.prog(t, 102.1, .5);
      D.tf(shard, 560, 560, D.lerp(.85, 1, ks), -4);
      D.op(shard, ks * (1 - D.clamp((t - 108.3) / .5)));
      // 雕像与断臂
      const kst = D.prog(t, 104.0, .5);
      D.tf(statue, 1150, 60 + (1 - kst) * 30, 1);
      D.op(statue, kst * (1 - D.clamp((t - 108.3) / .5)));
      cracks.setAttribute("stroke-dashoffset", D.f(260 * (1 - D.clamp((t - 104.4) / .4))));
      const fall = D.clamp((t - 104.95) / 1.0);
      armG.setAttribute("transform", `translate(${D.f(-fall * 40)} ${D.f(fall * fall * 420)}) rotate(${D.f(-fall * 40)} 240 330)`);
      D.op(armG, 1 - D.clamp((t - 105.6) / .5));
      // 金尘
      gps.forEach((p) => {
        const k1 = t - 105.7 - p.d, k2 = D.ease.inOut(D.clamp((t - 108.47 - p.d * .6) / .8));
        const fx = p.x + p.vx * Math.max(0, k1), fy = p.y + 120 + p.vy * Math.max(0, k1);
        p.e.setAttribute("cx", D.f(D.lerp(fx, p.tx, k2))); p.e.setAttribute("cy", D.f(D.lerp(fy, p.ty, k2)));
        p.e.setAttribute("opacity", D.f(k1 < 0 ? 0 : D.clamp(k1 / .3) * (1 - D.clamp((t - 109.3) / .4))));
      });
    });
    D.head(92.0, 142.6, { year: "约两千四百年前", place: "雅典 · 柏拉图" });
    D.ref(92.0, 110.7, { en: "Symposium", zh: "《会饮篇》" });
    D.cap("苏格拉底说，教他懂得爱的，是一位女性：<em>第俄提玛</em>", 93.59, 97.85);
    D.cap("她说，爱神是「丰富」和「<em>贫乏</em>」的孩子", 97.85, 99.97);
    D.cap("所以爱，总是因为<em>缺</em>，又总想去够", 99.97, 102.1);
    D.cap("但人缺的，不是「另一半」", 102.1, 104.22);
    D.cap("人连自己坏掉的手脚，都会舍弃", 104.22, 106.35);
    D.cap("人爱的，是<em>好</em>的东西", 106.35, 108.47);
    D.cap("而爱，是一架<em>梯子</em>", 108.47, 110.61);

    // ================= S7 阶梯 =================
    const s7 = D.g(mid, { id: "s7" });
    const rays = D.g(s7);
    for (let k = 0; k < 9; k++) {
      const a = Math.PI * (0.56 + k * .05), L = 1900;
      D.el(rays, "path", { d: `M${BX},${BY} L${D.f(BX + Math.cos(a - .025) * L)},${D.f(BY + Math.sin(a - .025) * L)} L${D.f(BX + Math.cos(a + .025) * L)},${D.f(BY + Math.sin(a + .025) * L)} Z`, fill: "#fff4d6", opacity: .18 + (k % 3) * .07 });
    }
    const floor = D.g(s7);
    D.el(floor, "rect", { x: -200, y: FLOOR, width: 2320, height: 300, fill: "#e2d4bd", opacity: .55 });
    D.el(floor, "line", { x1: -200, x2: 2120, y1: FLOOR, y2: FLOOR, stroke: C.gold, "stroke-width": 2, opacity: .5 });
    const lad = D.buildLadder(s7, "lad");
    const ladClip = D.el(D.el(s7, "clipPath", { id: "ladClip" }), "rect", { x: -400, y: -400, width: 2800, height: FLOOR + 402 });
    lad.g.setAttribute("clip-path", "url(#ladClip)");
    const glow = D.g(s7);
    D.el(glow, "circle", { cx: BX, cy: BY, r: 300, fill: "url(#sky)" });
    D.el(glow, "circle", { cx: BX, cy: BY, r: 70, fill: "#fffdf6", filter: "url(#blur20)" });
    const burstLines = D.g(glow);
    for (let k = 0; k < 24; k++) { const a = k / 24 * 6.283, r1 = k % 2 ? 125 : 175; D.el(burstLines, "line", { x1: BX + Math.cos(a) * 70, y1: BY + Math.sin(a) * 70, x2: BX + Math.cos(a) * r1, y2: BY + Math.sin(a) * r1, stroke: C.goldHi, "stroke-width": k % 2 ? 2 : 3.5, "stroke-linecap": "round" }); }
    const icons = D.stepIcons.map((ic, i) => D.svg(s7, `<g fill="none" stroke="${C.goldHi}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#gl)">${ic}</g>`));
    const climber = D.svg(s7, D.climber());
    const newbie = D.svg(s7, D.climber("#5a4636"));
    const white = D.el(D.L.front, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#fffaf0", opacity: 0 });
    // 小人每一级的落脚点
    const footX = (i) => xl(i) + (i === N - 1 ? W / 2 : 52), footY = (i) => ty(i) + 4;
    const CLIMB = [112.73, 114.86, 116.98, 119.11, 121.23, 123.36];

    D.onFrame((t) => {
      const on = t > 108.4 && t < 148.9;
      D.op(s7, on ? (t < 133.99 ? 1 : 1 - .72 * D.clamp((t - 133.99) / .6)) * (1 - D.clamp((t - 141.9) / .6)) : 0);
      if (!on) return;
      // 拉远镜头
      const pull = D.ease.inOut(D.clamp((t - 127.61) / 1.4));
      const sc = 1 - .1 * pull;
      s7.setAttribute("transform", `translate(${D.f(960 * (1 - sc))} ${D.f(520 * (1 - sc))}) scale(${D.f(sc)})`);
      D.op(rays, D.clamp((t - 110.61) / 1.2) * (.7 + .3 * D.clamp((t - 123.36) / .5)));
      D.op(floor, D.clamp((t - 108.47) / .6));
      lad.steps.forEach((s, i) => {
        const t0 = i === 0 ? 108.9 : 110.61 + (i - 1) * .1;
        const k = D.ease.out(D.clamp((t - t0) / (i === 0 ? .4 : .6)));
        s.g.setAttribute("transform", `translate(0 ${D.f((1 - k) * (i === 0 ? 40 : 700))})`);
        D.op(s.g, i === 0 ? k : D.clamp((t - t0) / .2));
        const lit = t > STEP_T[i] ? 1 : .35;
        let flash = t > STEP_T[i] ? Math.exp(-(t - STEP_T[i]) * 3) : 0;
        if (i === 0 && t > 127.61) flash += Math.sin(D.clamp((t - 127.61) / .8) * Math.PI) * (t < 128.6 ? 1 : 0);
        if (t > 132.66) flash += Math.exp(-(t - 132.66) * 3) * .8;
        D.op(s.rim, Math.min(1, lit + flash));
        s.rim.setAttribute("stroke-width", D.f(3 + flash * 4));
      });
      // 顶端光
      const kb = D.clamp((t - 123.36) / .5);
      D.op(glow, D.clamp((t - 110.8) / .8) * (.45 + .55 * kb));
      burstLines.setAttribute("transform", `rotate(${D.f(t * 6)} ${BX} ${BY})`);
      D.op(white, t > 123.36 && t < 125.6 ? .85 * (1 - D.clamp((t - 123.5) / 2)) * D.clamp((t - 123.36) / .12) : 0);
      // 图标
      icons.forEach((ic, i) => { const t0 = CLIMB[i] - .1, k = D.prog(t, t0, .5); D.tf(ic, tx(i), ty(i) - 92 - (1 - k) * 20); D.op(ic, t < t0 ? 0 : k); });
      // 爬梯的小人：每到一个时刻跳上一级
      let idx = -1; for (let i = 0; i < CLIMB.length; i++) if (t >= CLIMB[i] - .35) idx = i;
      if (idx >= 0) {
        const t0 = CLIMB[idx] - .35, k = D.clamp((t - t0) / .35);
        const fx = idx > 0 ? footX(idx - 1) : footX(0) - 120, fy = idx > 0 ? footY(idx - 1) : footY(0);
        const x = D.lerp(fx, footX(idx), D.ease.inOut(k)), y = D.lerp(fy, footY(idx), D.ease.inOut(k)) - Math.sin(k * Math.PI) * 40;
        D.tf(climber, x, y);
        D.op(climber, idx === 0 ? D.clamp((t - t0) / .3) : 1);
      } else D.op(climber, 0);
      const kn = D.prog(t, 131.85, .5);
      D.tf(newbie, footX(0) + 10, footY(0) + (1 - kn) * 20);
      D.op(newbie, t < 131.85 ? 0 : kn);
    });
    D.cap("从爱<em>一个人</em>的美开始", 112.73, 114.86);
    D.cap("再发现，美在很多人身上都有", 114.86, 116.98);
    D.cap("灵魂的美，比外表更<em>珍贵</em>", 116.98, 119.11);
    D.cap("人们一起好好生活的方式，也是美", 119.11, 121.23);
    D.cap("再到知识的美", 121.23, 123.36);
    D.cap("最后，看见「<em>美本身</em>」", 123.36, 127.61);
    D.cap("身体之美是<em>第一级台阶</em>，并没有被禁止", 127.61, 131.85);
    D.cap("只是，<em>别停在那里</em>", 131.85, 133.99);
  };
})();
