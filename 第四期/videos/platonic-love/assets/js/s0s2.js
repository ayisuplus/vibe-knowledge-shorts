// S0 钩子（0–10.69）· S1 片名（10.69–17.05）· S2 词的旅程（17.05–38.34）
(function () {
  const D = window.D, C = D.C;

  // 文字宽度估算：中文按 1em，西文按 0.56em
  D.textW = (s, fs) => [...s].reduce((w, ch) => w + (/[\u0000-ÿ]/.test(ch) ? .56 : 1) * fs, 0);
  // 聊天气泡（SVG 字符串，左上角在 0,0）
  D.bubbleS = (text, { fs = 34, me = false, stroke = "", w } = {}) => {
    const pw = fs * .8, ph = fs * .55, bw = w || D.textW(text, fs) + pw * 2, bh = fs * 1.35 + ph * 2;
    const fill = me ? "#f7cfc8" : "#fffaf2", col = me ? "#4a2018" : C.ink;
    const r = bh / 2;
    return `<rect width="${D.f(bw)}" height="${D.f(bh)}" rx="${D.f(r)}" fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="3"` : ""} filter="url(#shadow)"/>
      <text x="${D.f(pw)}" y="${D.f(bh / 2 + fs * .36)}" font-size="${fs}" font-weight="600" fill="${col}" data-layout-allow-overlap="" data-layout-allow-overflow="">${text}</text>`;
  };

  D.scene02 = () => {
    const back = D.L.back, mid = D.L.mid;
    // ================= S0 钩子 =================
    const s0 = D.g(mid, { id: "s0" });
    const msgs = ["我们只是柏拉图式恋爱", "网恋三年没见过面，算柏拉图吗", "柏拉图式，懂的都懂", "异地恋＝柏拉图式恋爱？",
      "我想要一场柏拉图式的爱情", "他说我们是柏拉图式的", "不见面也能爱，很柏拉图", "精神恋爱就是柏拉图式恋爱吧",
      "柏拉图式恋爱，听起来好高级", "只谈心，不碰身体", "我们是柏拉图式恋爱", "柏拉图式恋爱是什么体验"];
    const R = D.rng(11), bubbles = [];
    const IX = 1190, IY = 520; // 胸像中心（冲击点）
    for (let row = 0; row < 10; row++) for (let colI = 0; colI < 4; colI++) {
      const depth = R() < .3 ? 2 : R() < .5 ? 1 : 0;
      const fs = depth === 2 ? 26 : depth === 1 ? 32 : 38;
      const txt = msgs[(row * 4 + colI * 3) % msgs.length];
      const w = D.textW(txt, fs) + fs * 1.6;
      const x = colI * 500 - 60 + R() * 140 + (row % 2) * 120, y = row * 112 - 20 + R() * 30;
      const g = D.svg(s0, D.bubbleS(txt, { fs, me: R() < .35 }), depth ? { filter: depth === 2 ? "url(#blur6)" : "url(#soft)" } : {});
      // 冲击后的去处：落在胸像椭圆里的被推到椭圆外，其余轻推
      const cx = x + w / 2, cy = y + 30, dx = cx - IX, dy = cy - IY;
      const e = Math.sqrt((dx / 520) ** 2 + (dy / 600) ** 2), dist = Math.hypot(dx, dy) || 1;
      const push = e < 1 ? (1 - e) * 560 + 60 : 40 + R() * 30;
      bubbles.push({ g, x, y, w, depth, px: dx / dist * push, py: dy / dist * push * .6, rot: (R() - .5) * 14, sp: 16 + R() * 14 });
    }
    // 胸像（从上方砸下来）
    const bustG = D.g(s0, { id: "bust" });
    D.el(bustG, "ellipse", { cx: 1193, cy: 1020, rx: 330, ry: 34, fill: "#8a6a48", opacity: .28, filter: "url(#blur20)" });
    const bustImg = D.g(bustG);
    D.el(bustImg, "image", { href: "assets/img/plato-cut.jpg", x: -333, y: -1000, width: 667, height: 1000 });
    const puff = D.el(s0, "ellipse", { cx: 1193, cy: 1010, rx: 420, ry: 70, fill: "#e2cfb0", filter: "url(#blur20)", opacity: 0 });
    const impact = D.g(s0);
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * (1.18 + i * .045), x = IX + 40 + Math.cos(a) * 480, y = IY + Math.sin(a) * 440;
      D.el(impact, "line", { x1: x, y1: y, x2: x + Math.cos(a) * 70, y2: y + Math.sin(a) * 70, stroke: C.gold, "stroke-width": 4, "stroke-linecap": "round" });
    }
    // 柏拉图的回复气泡
    const reply = D.g(s0, { id: "reply" });
    reply.insertAdjacentHTML("beforeend", `
      <text x="6" y="-14" font-size="26" font-weight="700" letter-spacing="3" fill="${C.ink2}" data-layout-allow-overlap="">柏拉图</text>
      <path d="M380,92 Q440,110 492,128 Q440,80 420,40 Z" fill="#fffdf8" stroke="${C.gold}" stroke-width="3" stroke-linejoin="round"/>
      <rect width="440" height="116" rx="40" fill="#fffdf8" stroke="${C.gold}" stroke-width="3" filter="url(#shadow)"/>
      <path d="M392,96 Q430,104 470,118" stroke="#fffdf8" stroke-width="8" fill="none"/>
      <text x="40" y="78" font-size="60" font-weight="900" fill="${C.ink}" data-layout-allow-overlap="">我没有说过啊</text>
      <rect x="10" y="134" width="252" height="46" rx="8" fill="#786048" opacity=".12"/>
      <text x="28" y="166" font-size="26" font-weight="500" fill="#7a6450" data-layout-allow-overlap="">引用：柏拉图式恋爱</text>`);
    // 陶杯内底的圆形小人（6.43 出现，8.57 裂成两半）
    const tondo = D.g(s0, { id: "tondo" });
    tondo.insertAdjacentHTML("beforeend", `<circle r="230" fill="${C.glaze}"/><circle r="230" fill="none" stroke="#3a2a20" stroke-width="6"/>${D.meanderRing(214, C.clay, 4)}`);
    const whole = D.svg(tondo, D.roundHuman("t0w", { r: 62 }), { transform: "translate(0 10)" });
    const hl = D.svg(tondo, D.roundHuman("t0l", { r: 62, half: -1 }));
    const hr = D.svg(tondo, D.roundHuman("t0r", { r: 62, half: 1 }));
    const crack = D.el(tondo, "path", { d: "M8,-200 L-6,-120 L12,-60 L-8,0 L10,70 L-4,140 L6,205", fill: "none", stroke: "#fff1cf", "stroke-width": 5, filter: "url(#glow)", "stroke-linejoin": "bevel" });
    const crackLen = 420;
    crack.setAttribute("stroke-dasharray", crackLen);

    D.onFrame((t) => {
      const on = t < 10.95;
      D.op(s0, on ? 1 - D.clamp((t - 10.45) / .5) : 0);
      if (!on) return;
      // 气泡：一直往上刷；2.45 被震开
      const kI = D.prog(t, 2.45, .55, D.ease.out), dim = 1 - .55 * D.clamp((t - 6.1) / .4);
      for (const b of bubbles) {
        const yy = ((b.y - t * b.sp) % 1200 + 1200) % 1200 - 90;
        D.tf(b.g, b.x + b.px * kI, yy + b.py * kI, 1, b.rot * kI);
        const fy = yy + b.py * kI, band = fy > 830 && fy < 1050 ? .3 : 1; // 字幕区的气泡调淡
        D.op(b.g, (b.depth === 2 ? .55 : b.depth === 1 ? .85 : 1) * dim * band);
      }
      // 胸像下落：2.0 开始，2.45 落地，轻微压扁回弹
      const fall = D.clamp((t - 2.0) / .45);
      const by = D.lerp(-1150, 1034, D.ease.in(fall));
      const sq = t > 2.45 ? 1 - .05 * Math.exp(-(t - 2.45) * 9) * Math.cos((t - 2.45) * 30) : 1;
      bustImg.setAttribute("transform", `translate(1193 ${D.f(by)}) scale(${D.f(2 - sq)} ${D.f(sq)})`);
      D.op(bustG, t >= 2.0 ? 1 : 0);
      D.op(puff, t > 2.45 ? .7 * (1 - D.clamp((t - 2.45) / 1.2)) : 0);
      D.op(impact, t > 2.45 ? 1 - D.clamp((t - 2.6) / .7) : 0);
      // 回复气泡：3.25 弹出
      const kR = D.clamp((t - 3.25) / .35);
      D.tf(reply, 560, 300, t < 3.25 ? .01 : D.lerp(.6, 1, D.ease.back(kR)), -2);
      D.op(reply, t < 3.25 ? 0 : Math.min(1, kR * 3) * (1 - D.clamp((t - 6.1) / .3)));
      // 圆形小人
      const kT = D.clamp((t - 6.43) / .4);
      D.tf(tondo, 470, 470, D.lerp(.7, 1, D.ease.back(kT)));
      D.op(tondo, t < 6.43 ? 0 : kT);
      const split = D.prog(t, 8.57, .5, D.ease.out);
      D.op(whole, t < 8.57 ? 1 : 0);
      D.op(hl, t >= 8.57 ? 1 : 0); D.op(hr, t >= 8.57 ? 1 : 0);
      hl.setAttribute("transform", `translate(${D.f(-split * 26)} ${D.f(10 + split * 4)}) rotate(${D.f(-split * 9)})`);
      hr.setAttribute("transform", `translate(${D.f(split * 26)} ${D.f(10 + split * 4)}) rotate(${D.f(split * 9)})`);
      crack.setAttribute("stroke-dashoffset", D.f(crackLen * (1 - D.clamp((t - 8.45) / .2))));
      D.op(crack, t < 8.45 ? 0 : 1 - .6 * D.clamp((t - 9) / .8));
    });
    D.cap("人人都在说「柏拉图式恋爱」", 0.06, 3.25);
    D.cap("但这个词，柏拉图<em>一次都没说过</em>", 3.25, 6.43);
    D.cap("就连「另一半」的说法", 6.43, 8.57);
    D.cap("在他的书里，也被<em>当场推翻</em>了", 8.57, 10.69);

    // ================= S1 片名 =================
    const s1 = D.g(mid, { id: "s1" });
    const fr = D.g(s1);
    fr.insertAdjacentHTML("beforeend", `<rect x="400" y="200" width="1120" height="560" fill="none" stroke="${C.gold}" stroke-width="2"/>
      <rect x="414" y="214" width="1092" height="532" fill="none" stroke="${C.gold}" stroke-width="1" opacity=".6"/>
      ${D.meander(430, 1490, 236, 26, C.gold, 4)}${D.meander(430, 1490, 696, 26, C.gold, 4)}`);
    const frClip = D.el(D.el(s1, "clipPath", { id: "frClip" }), "rect", { x: 380, y: 180, width: 0, height: 600 });
    fr.setAttribute("clip-path", "url(#frClip)");
    D.text("— amor platonicus —", 960, 300, { anchor: "center", cls: "latin", win: [13.35, 16.95] });
    const titleId = D.text("柏拉图式恋爱", 960, 368, { anchor: "center", cls: "title", win: [10.69, 16.95], still: true });
    D.text("一个柏拉图从没说过的词", 960, 600, { anchor: "center", cls: "sub", win: [12.82, 16.95] });
    D.onFrame((t) => {
      D.op(s1, t > 10.6 && t < 17.1 ? 1 - D.clamp((t - 16.6) / .45) : 0);
      frClip.setAttribute("width", D.f(1160 * D.prog(t, 11.2, 1.6, D.ease.inOut)));
      const e = D.$(titleId);
      if (e) { const k = D.prog(t, 10.69, .9, D.ease.inOut); e.style.clipPath = `inset(0 ${D.f((1 - k) * 100)}% 0 0)`; }
    });

    // ================= S2 词的旅程 =================
    const s2 = D.g(mid, { id: "s2" });
    const cam = D.g(s2, { id: "s2cam" });
    const SX = { now: 960, p1636: -1100, p1476: -3200 };
    // 时间轴
    const axis = D.g(cam);
    D.el(axis, "line", { x1: -9000, x2: 2400, y1: 862, y2: 862, stroke: C.gold, "stroke-width": 2.5, opacity: .8 });
    for (let x = -9000; x < 2400; x += 70) D.el(axis, "line", { x1: x, x2: x, y1: 856, y2: 868, stroke: C.gold, "stroke-width": 1.5, opacity: .5 });
    [["今天", SX.now], ["1636", SX.p1636], ["1476", SX.p1476]].forEach(([lab, x]) => {
      D.el(axis, "circle", { cx: x, cy: 862, r: 9, fill: C.gold });
      D.el(axis, "text", { x, y: 836, "text-anchor": "middle", "font-size": 28, "font-weight": 700, fill: C.ink2, "font-family": /\d/.test(lab) ? "GaraB" : "DSerif" }, lab);
    });
    // 今天：一部手机
    const ph = D.g(cam, { transform: `translate(${SX.now} 0)` });
    ph.insertAdjacentHTML("beforeend", `<g filter="url(#shadow)"><rect x="-250" y="96" width="500" height="720" rx="56" fill="#2a1e16"/></g>
      <rect x="-232" y="114" width="464" height="684" rx="42" fill="#f8f2e8"/>
      <rect x="-60" y="128" width="120" height="26" rx="13" fill="#2a1e16"/>
      <text x="0" y="200" text-anchor="middle" font-size="26" font-weight="700" fill="${C.ink2}">聊天</text>
      <line x1="-232" x2="232" y1="222" y2="222" stroke="#e2d6c4" stroke-width="2"/>`);
    const pb1 = D.svg(ph, D.bubbleS("我们是柏拉图式恋爱", { fs: 34 }), {});
    const pb2 = D.svg(ph, D.bubbleS("就是只谈心，不碰身体", { fs: 34, me: true }), {});
    // 1636：木刻戏单
    const pl = D.g(cam, { transform: `translate(${SX.p1636} 0)` });
    pl.insertAdjacentHTML("beforeend", `<g filter="url(#shadow)"><rect x="-470" y="110" width="940" height="700" fill="#f1e6cf"/></g>
      <image href="assets/img/woodcut-lovers.jpg" x="-450" y="190" width="900" height="600" preserveAspectRatio="xMidYMid slice"/>
      <rect x="-450" y="130" width="900" height="660" fill="none" stroke="#1d1712" stroke-width="5"/>
      <rect x="-440" y="140" width="880" height="640" fill="none" stroke="#1d1712" stroke-width="1.6"/>
      <text x="0" y="230" text-anchor="middle" font-family="GaraB" font-size="56" letter-spacing="5" fill="#1d1712">THE PLATONICK LOVERS</text>
      <line x1="-300" x2="300" y1="256" y2="256" stroke="#1d1712" stroke-width="2"/>`);
    const qm = D.g(pl);
    [[-90, 330], [70, 318]].forEach(([x, y], i) => D.el(qm, "text", { x, y, "text-anchor": "middle", "font-family": "GaraB", "font-size": 76, fill: "#1d1712", id: `qm${i}` }, "?"));
    // 1476：羊皮纸信
    const lt = D.g(cam, { transform: `translate(${SX.p1476} 0)` });
    lt.insertAdjacentHTML("beforeend", `<image href="assets/img/parchment.jpg" x="-480" y="150" width="900" height="600" filter="url(#shadow)"/>`);
    const sq = D.g(lt, { opacity: .55 });
    const R2 = D.rng(4);
    for (let i = 0; i < 6; i++) { // 字迹（看不清的草书行，只作纹理）
      let d = `M-360,${470 + i * 44}`; for (let x = -360; x < 220 - (i === 5 ? 260 : 0); x += 18) d += ` q9,${D.f(-10 - R2() * 8)} 18,0`;
      D.el(sq, "path", { d, fill: "none", stroke: "#4a3220", "stroke-width": 2.2 });
    }
    const amor = D.el(lt, "text", { x: -380, y: 400, "font-family": "GaraI", "font-size": 110, fill: "#3a2514" }, "amor platonicus");
    const amClip = D.el(D.el(lt, "clipPath", { id: "amClip" }), "rect", { x: -400, y: 280, width: 0, height: 160 });
    amor.setAttribute("clip-path", "url(#amClip)");
    const quill = D.g(lt);
    quill.insertAdjacentHTML("beforeend", `<path d="M0,0 L120,-200 Q150,-260 200,-280 Q170,-220 150,-170 Q120,-120 10,-6 Z" fill="#f4ecdc" stroke="#6b5646" stroke-width="2.5"/><path d="M0,0 L170,-250" stroke="#6b5646" stroke-width="2"/>`);
    const seal = D.g(lt);
    seal.insertAdjacentHTML("beforeend", `<circle r="52" fill="#a8382a"/><circle r="40" fill="none" stroke="#7d2318" stroke-width="4"/><circle r="52" fill="none" stroke="#c4543f" stroke-width="3" opacity=".6"/>
      <path d="M-14,-18 Q0,-30 14,-18 Q22,0 0,22 Q-22,0 -14,-18 Z" fill="none" stroke="#7d2318" stroke-width="4"/>`);
    // 苏格拉底和学生（金色线描，在信的右边）
    const duo = D.g(lt, { fill: "none", stroke: C.goldHi, "stroke-width": 3, filter: "url(#gl)" });
    duo.insertAdjacentHTML("beforeend", `<g transform="translate(640 560) scale(3.6)">${D.figIcon(-18, 0, 1.15)}${D.figIcon(20, 4, .95)}</g>`);
    // 加速时的流线
    const streak = D.g(s2);
    const R3 = D.rng(8);
    for (let i = 0; i < 26; i++) D.el(streak, "line", { x1: R3() * 1920, x2: 0, y1: 120 + R3() * 700, y2: 0, stroke: C.goldHi, "stroke-width": 1 + R3() * 3, "stroke-linecap": "round", opacity: .3 + R3() * .5, "data-l": 200 + R3() * 500 });

    const camKeys = [[17.05, 0], [20.9, 0], [21.8, SX.now - SX.p1636], [27.6, SX.now - SX.p1636], [28.49, SX.now - SX.p1476], [36.21, SX.now - SX.p1476], [38.34, SX.now - SX.p1476 + 5200]];
    D.onFrame((t) => {
      const on = t > 16.95 && t < 38.6;
      D.op(s2, on ? D.clamp((t - 17.05) / .45) * (1 - D.clamp((t - 37.9) / .45)) : 0);
      if (!on) return;
      const cx = t < 36.21 ? D.keyed(camKeys, t) : D.lerp(SX.now - SX.p1476, SX.now - SX.p1476 + 5200, D.ease.in(D.clamp((t - 36.21) / 2.13)));
      D.tf(cam, cx, 0);
      // 手机气泡
      D.tf(pb1, -210, 250 + (1 - D.prog(t, 17.3, .4)) * 20); D.op(pb1, D.clamp((t - 17.3) / .3));
      D.tf(pb2, 210 - (D.textW("就是只谈心，不碰身体", 34) + 54), 360 + (1 - D.prog(t, 18.4, .4)) * 20); D.op(pb2, D.clamp((t - 18.4) / .3));
      // 问号
      for (let i = 0; i < 2; i++) { const q = D.$(`qm${i}`), k = D.clamp((t - 25.58 - i * .27) / .3); D.op(q, k); q.setAttribute("transform", `translate(0 ${D.f(Math.sin(t * 4 + i) * 6 - (1 - k) * 20)})`); }
      // 羽毛笔写字
      const kW = D.clamp((t - 28.6) / 1.3);
      amClip.setAttribute("width", D.f(kW * 860));
      D.tf(quill, -380 + kW * 820, 392 - Math.abs(Math.sin(kW * 40)) * 14, 1);
      D.op(quill, t < 28.4 ? 0 : 1 - D.clamp((t - 30.1) / .5));
      D.op(sq, .5 * D.clamp((t - 28.3) / .4));
      // 火漆印
      const kS = D.clamp((t - 33.5) / .18);
      D.tf(seal, 300, 660, t < 33.5 ? .01 : D.lerp(1.7, 1, D.ease.in(kS)), -8);
      D.op(seal, t < 33.5 ? 0 : kS);
      D.op(duo, D.clamp((t - 34.09) / .5));
      // 流线
      const ks = D.clamp((t - 36.4) / .8) * (1 - D.clamp((t - 38.1) / .3));
      D.op(streak, ks);
      [...streak.children].forEach((l, i) => { const L = +l.dataset.l * (.4 + ks), x = ((+l.dataset.x + t * 2600 * (1 + i % 3 * .3)) % 2400) - 240; l.setAttribute("x1", D.f(x - L)); l.setAttribute("x2", D.f(x)); l.setAttribute("y2", l.getAttribute("y1")); });
    });
    // streak 的 x1 被每帧改写，先记下初始值
    [...streak.children].forEach((l) => l.setAttribute("data-x", l.getAttribute("x1")));

    D.head(17.05, 21.45, { year: "今天", place: "" });
    D.head(21.33, 28.45, { year: "1636", num: true, place: "伦敦 · 达文南特" });
    D.head(28.49, 36.4, { year: "1476", num: true, place: "佛罗伦萨 · 费奇诺" });
    D.cap("今天，它的意思是：<em>只谈心，不碰身体</em>", 17.05, 21.33);
    D.cap("1636 年，伦敦一部戏<em>第一次</em>用英语写下它", 21.33, 25.58, { note: "目前可查最早的英语用例" });
    D.cap("而这部戏，是在<em>嘲讽</em>宫廷里流行的「只谈心，不越界」", 25.58, 29.83);
    D.cap("1476 年，学者费奇诺在一封信里，<em>造出</em>了这个词", 29.83, 34.09);
    D.cap("他指的是：苏格拉底和学生之间的情谊", 34.09, 36.21);
    D.cap("再往前，一千八百多年……", 36.21, 38.34);
  };
})();
