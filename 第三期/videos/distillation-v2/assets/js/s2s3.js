// S2 2006 · 康奈尔（17.05–25.58） · S3 2015 · 山景城（25.58–68.09）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  const CLS = ["柯基", "狐狸", "猫", "面包", "汽车"];
  const Z = [9, 6, 4, 3, -2];
  const soft = (T) => { const e = Z.map((z) => Math.exp(z / T)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
  const P4 = soft(4);
  const lvlOf = (p) => 0.02 + p * 0.95;
  const TK = [[0, 1], [38.34, 1], [39.9, 4], [51.08, 4], [52.7, 8], [53.6, 8], [54.9, 4], [63.84, 4], [64.9, 1]];
  const Tof = (t) => D.keyed(TK, t);

  D.scene23 = () => {
    // ---------- 档案头 ----------
    D.year(17.05, "2006");
    D.year(25.58, "2015");
    D.step(() => {
      tl.fromTo("#hdr", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 17.05);
      tl.to("#hdr", { opacity: 0, duration: 0.4 }, 157.0);
    });
    D.caseInfo(17.05, 25.58, { place: "康奈尔 · 卡鲁阿纳", en: "Model Compression", zh: "《模型压缩》", by: "布奇卢阿 · 卡鲁阿纳 · 尼库列斯库-米齐尔 · 2006", seal: "压" });
    D.caseInfo(25.58, 93.59, { place: "山景城 · 辛顿", en: "Distilling the Knowledge in a Neural Network", zh: "《提炼神经网络中的知识》", by: "辛顿 · 维尼亚尔斯 · 迪恩 · 2015", seal: "蒸" });

    // ================= S2 药柜 =================
    const S2 = 17.05, S3 = 25.58;
    const shelf = D.wrap(D.L.mid, "shelf", { opacity: 0 });
    const planks = [580, 790, 1000];
    el(shelf, "rect", { x: 84, y: 400, width: 16, height: 616, fill: "url(#wood)" });
    el(shelf, "rect", { x: 980, y: 400, width: 16, height: 616, fill: "url(#wood)" });
    const flasks = [];
    planks.forEach((py, row) => {
      const tier = D.wrap(shelf, `tier-${row}`);
      for (let i = 0; i < 8; i++) {
        const x = 150 + i * 112, r = 32;
        const f = D.flask(tier, x, py - r, r, { level: 0.55, neck: 0.9 });
        flasks.push({ x, y: py - r, r });
      }
      el(shelf, "rect", { x: 84, y: py, width: 912, height: 16, rx: 3, fill: "url(#wood)", stroke: C.woodHi, "stroke-width": 1.5 });
    });
    // 流向前面小瓶的细流
    const target = { x: 540, y: 1290, r: 72 };
    const streams = D.wrap(D.L.mid, "streams", { opacity: 0 });
    const sPaths = flasks.map((f, i) => {
      const p = el(streams, "path", { d: `M${f.x} ${f.y + f.r} Q${D.f((f.x + target.x) / 2)} ${D.f(f.y + 260)} ${target.x} ${target.y - target.r - 30}`, fill: "none", stroke: "#f0b45a", "stroke-width": 2.4, opacity: 0.75 });
      const L = p.getTotalLength(); p.setAttribute("stroke-dasharray", D.f(L)); p.setAttribute("stroke-dashoffset", D.f(L));
      return { p, L };
    });
    const tg = D.wrap(D.L.mid, "s2-target", { opacity: 0 });
    el(tg, "ellipse", { cx: target.x, cy: target.y + target.r + 4, rx: 120, ry: 14, fill: "url(#shadow)" });
    el(tg, "rect", { x: target.x - 80, y: target.y + target.r - 6, width: 160, height: 20, rx: 4, fill: "url(#wood)" });
    const tGlow = el(tg, "circle", { cx: target.x, cy: target.y, r: target.r * 2, fill: "url(#glowGold)", opacity: 0 });
    const tf = D.flask(tg, target.x, target.y, target.r, { level: 0.05 });
    D.onFrame((t) => {
      if (t < 16.8 || t > 26) return;
      tf.set(D.keyed([[19.6, 0.05], [21.3, 0.8]], t));
      tGlow.setAttribute("opacity", D.f(D.win(t, 21.33, 25.4, 0.4) * (0.7 + 0.3 * Math.sin(t * 4))));
    });
    const stat = D.wrap(D.L.mid, "s2-stat", { opacity: 0 });
    D.tile(stat, 636, 1246, 370, 110);
    el(stat, "text", { x: 821, y: 1314, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 34, fill: C.ink }, "小 1000 倍 · 快 1000 倍");

    D.cap("成百上千个模型<em>一起投票</em>：|准，但太笨重", S2, 21.33);
    D.cap("让一个<em>小模型</em>去模仿它们的答案", 21.33, S3, { note: "小 1000 倍、快 1000 倍：据卡鲁阿纳主页", noteAt: 22.4 });

    D.step(() => {
      tl.fromTo("#shelf", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S2 - 0.1);
      [0, 1, 2].forEach((row) => tl.fromTo(`#tier-${row}`, { opacity: 0.18 }, { opacity: 1, duration: 0.45, ease: "power2.out", immediateRender: true }, S2 + 0.2 + row * D.BEAT));
      tl.fromTo("#s2-target", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 18.6);
      tl.fromTo("#streams", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 19.2);
      sPaths.forEach((s, i) => tl.fromTo(s.p, { strokeDashoffset: s.L }, { strokeDashoffset: 0, duration: 0.9, ease: "power2.in", immediateRender: false }, 19.2 + D.hash(i) * 0.4));
      tl.to("#streams", { opacity: 0, duration: 0.6 }, 21.2);
      tl.fromTo("#s2-stat", { opacity: 0, rotationX: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, 22.4);
      tl.to(["#shelf", "#s2-target", "#s2-stat"], { opacity: 0, duration: 0.5 }, S3 - 0.2);
    });

    // ================= S3 实验台 =================
    const lab = D.wrap(D.L.mid, "lab", { opacity: 0 });
    const st = D.still(lab, "still-lab", { big: { x: 380, y: 560, r: 125 }, neck: 90, thermo: false, small: false, stand: false, floor: 925, condEnd: [960, 880] });
    el(lab, "rect", { x: 170, y: 925, width: 420, height: 18, rx: 3, fill: C.wood, stroke: C.woodHi, "stroke-width": 2 });
    D.glass(lab, "M951 880 V985 H969 V880");
    D.glass(lab, "M150 985 H969 V1005 H150 Z", { hl: "M165 989 H955" });
    const xs = [175, 335, 495, 655, 815];
    xs.forEach((x) => D.glass(lab, `M${x - 7} 1005 V1046 H${x + 7} V1005`));
    // 分液管里流动的小液滴
    const manDrops = [];
    for (let k = 0; k < 8; k++) manDrops.push(el(lab, "ellipse", { cx: 0, cy: 995, rx: 6, ry: 3, fill: "#f0b45a", opacity: 0.8 }));
    D.onFrame((t) => { if (t < 25 || t > 68.5) return; manDrops.forEach((d, k) => { const u = (k / 8 + t * 0.18) % 1; d.setAttribute("cx", D.f(955 - u * 790)); }); });

    // 老师的试管架（55.33 起缩小到左边）
    const rackT = D.wrap(lab, "rackT");
    el(rackT, "rect", { x: 110, y: 1062, width: 860, height: 22, rx: 4, fill: "#5a3d24", stroke: C.woodHi, "stroke-width": 2 });
    el(rackT, "rect", { x: 110, y: 1384, width: 860, height: 20, rx: 4, fill: C.wood, stroke: C.woodHi, "stroke-width": 2 });
    el(rackT, "rect", { x: 118, y: 1062, width: 14, height: 330, fill: C.wood });
    el(rackT, "rect", { x: 948, y: 1062, width: 14, height: 330, fill: C.wood });
    const breadGlow = el(rackT, "ellipse", { cx: xs[3], cy: 1260, rx: 110, ry: 200, fill: "url(#glowWarm)", opacity: 0 });
    const tubes = xs.map((x, i) => {
      const tb = D.tube(rackT, x, 1380, 300, { w: 76 });
      const lab_ = el(rackT, "text", { x, y: 1300, "text-anchor": "middle", "font-family": "Gara", "font-size": 36, fill: C.ivory, opacity: 0 }, "");
      el(rackT, "text", { x, y: 1452, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 40, fill: i === 3 ? C.goldHi : C.ivoryDim }, CLS[i]);
      return { tb, lab: lab_ };
    });
    // 注释（T=4 时的位置）
    // [管序号, 文字, 文字锚点 x, 文字 y, 对齐]
    const notes = [[1, "有点像狐狸", 365, null, "start"], [3, "有点像面包", 690, 1222, "start"], [4, "绝不像汽车", 850, 1150, "end"]].map(([i, txt, nx, nyFix, anc], k) => {
      const w = D.wrap(rackT, `note-${k}`, { opacity: 0 });
      const ly = 1380 - 294 * lvlOf(P4[i]);
      const ny = nyFix ?? ly - 70;
      el(w, "path", { d: `M${xs[i]} ${D.f(ly - 46)} L${xs[i] + (anc === "end" ? -10 : 24)} ${D.f(ny + 8)}`, stroke: C.gold, "stroke-width": 1.6, fill: "none", opacity: 0.8 });
      el(w, "text", { x: nx, y: ny, "font-family": "DSerif", "font-weight": 700, "font-size": 30, fill: i === 3 ? C.goldHi : C.gold, "text-anchor": anc }, txt);
      return { id: `note-${k}`, x: xs[i], y: ly - 50 };
    });

    // 火力黄铜牌
    const plate = D.wrap(lab, "plate");
    const pg = el(plate, "g", { filter: "url(#drop)" });
    el(pg, "rect", { x: 70, y: 760, width: 230, height: 96, rx: 6, fill: "url(#brass)" });
    el(pg, "rect", { x: 78, y: 768, width: 214, height: 80, rx: 4, fill: "none", stroke: "#3e2a10", "stroke-opacity": 0.5, "stroke-width": 2 });
    el(pg, "text", { x: 185, y: 800, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 24, fill: "#3e2a10" }, "火力 · 温度");
    const tval = el(pg, "text", { x: 185, y: 838, "text-anchor": "middle", "font-family": "Gara", "font-size": 38, fill: C.ink }, "T = 1.0");
    el(plate, "path", { d: "M300 808 C330 820 345 800 352 790", fill: "none", stroke: "#c9b48a", "stroke-width": 2, opacity: 0.7 });

    // 柯基照片卡 + 面包小卡
    const corgiCard = D.wrap(lab, "corgi", { opacity: 0 }, true);
    const cc = el(corgiCard, "g", { filter: "url(#drop)", transform: "rotate(-4 120 460)" });
    el(cc, "rect", { x: 40, y: 380, width: 170, height: 150, fill: "url(#paper)" });
    el(cc, "rect", { x: 50, y: 390, width: 150, height: 108, fill: "#3a2a1a" });
    const cg = el(cc, "g", { transform: "translate(52 386) scale(0.62)", stroke: "#f3ead6", "stroke-width": 4, fill: "rgba(240,180,90,0.35)", "stroke-linecap": "round" });
    el(cg, "path", { d: "M115 62 C70 50 40 80 44 120 C47 150 70 162 98 160 C108 160 113 154 115 146 C117 154 122 160 132 160 C160 162 183 150 186 120 C190 80 160 50 115 62 Z" });
    el(cg, "path", { d: "M115 70 L115 140", fill: "none", opacity: 0.6 });
    el(cg, "path", { d: "M72 160 L70 176 M90 162 L90 176 M140 162 L140 176 M158 160 L160 176", fill: "none" });
    el(cc, "text", { x: 125, y: 520, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 700, "font-size": 18, fill: C.ink }, "这是哪种动物？");
    el(corgiCard, "rect", { x: 112, y: 372, width: 24, height: 30, rx: 3, fill: "url(#brass)" });
    const twin = D.wrap(lab, "twin", { opacity: 0 });
    el(twin, "text", { x: 125, y: 590, "text-anchor": "middle", "font-family": "Gara", "font-size": 54, fill: C.goldHi }, "≈");
    const tw = el(twin, "g", { filter: "url(#drop)", transform: "rotate(3 125 660)" });
    el(tw, "rect", { x: 50, y: 605, width: 150, height: 112, fill: "url(#paper)" });
    const bg = el(tw, "g", { transform: "translate(75 618)", stroke: "#7a4a14", "stroke-width": 3, fill: "rgba(240,180,90,0.55)", "stroke-linecap": "round" });
    el(bg, "path", { d: "M8 50 C0 20 30 2 50 14 C70 2 100 20 92 50 C90 66 84 84 50 84 C16 84 10 66 8 50 Z" });
    el(bg, "path", { d: "M36 30 L44 40 M54 26 L62 36 M70 32 L76 40", fill: "none" });

    // 标准答案纸条
    const slip = D.wrap(lab, "slip", { opacity: 0 });
    const sg = el(slip, "g", { filter: "url(#drop)", transform: "rotate(3 755 735)" });
    el(sg, "rect", { x: 600, y: 690, width: 320, height: 90, fill: "url(#paper)" });
    el(sg, "text", { x: 625, y: 748, "font-family": "DSerif", "font-weight": 800, "font-size": 34, fill: C.ink }, "标准答案：柯基");
    D.sealSvg(sg, 868, 702, 40, "答");

    // 学生的试管架
    const rackS = D.wrap(lab, "rackS", { opacity: 0 }, true);
    const sxs = [672, 748, 824, 900, 976].map((x) => x - 20);
    el(rackS, "rect", { x: 620, y: 1150, width: 380, height: 16, rx: 3, fill: "#5a3d24", stroke: C.woodHi, "stroke-width": 1.5 });
    el(rackS, "rect", { x: 620, y: 1384, width: 380, height: 18, rx: 3, fill: C.wood, stroke: C.woodHi, "stroke-width": 1.5 });
    const STU0 = [0.22, 0.34, 0.06, 0.3, 0.12];
    const vials = sxs.map((x, i) => {
      const v = D.tube(rackS, x, 1380, 220, { w: 50 });
      const ty = 1380 - 214 * lvlOf(P4[i]);
      el(rackS, "line", { x1: x - 30, y1: ty, x2: x + 30, y2: ty, stroke: C.goldHi, "stroke-width": 2.4, "stroke-dasharray": "6 5" });
      return v;
    });
    D.text("老师", 120, 1150, { id: "lb-teacher", cls: "note" });
    D.text("学生 · 小模型", 640, 1090, { id: "lb-student", cls: "note" });
    const flows = D.wrap(lab, "flows", { opacity: 0 });
    const fA = el(flows, "path", { d: "M560 1210 C600 1120 680 1110 760 1150", fill: "none", stroke: "#f0b45a", "stroke-width": 12, "stroke-linecap": "round", "stroke-dasharray": "22 16", opacity: 0.85, filter: "url(#softGlow)" });
    const fB = el(flows, "path", { d: "M760 790 C780 900 860 1000 880 1145", fill: "none", stroke: C.ivory, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "8 8", opacity: 0.9 });
    D.sealAt("成", 880, 1190, 92, 63.58, 67.9, { rot: -8 });
    D.text(`q<sub>i</sub> = e<sup>z<sub>i</sub> / <b>T</b></sup> ÷ Σ e<sup>z<sub>j</sub> / <b>T</b></sup>`, 600, 690, { id: "formula", cls: "card", style: "font-family:'GaraI';font-size:44px;padding:22px 30px" });

    // ---------- 每帧：温度 → 火、牌子、试管、学生 ----------
    D.onFrame((t) => {
      if (t < 25 || t > 68.5) return;
      const T = Tof(t), P = soft(T);
      st.tick(t, { flame: 0.9 + 0.12 * (T - 1), big: 0.1 });
      tval.textContent = "T = " + T.toFixed(1);
      breadGlow.setAttribute("opacity", D.f(D.clamp((T - 1.3) / 2.5) * (0.75 + 0.25 * Math.sin(t * 3))));
      tubes.forEach(({ tb, lab: lb }, i) => {
        const grow = D.ease.out(D.clamp((t - (29.83 + 0.2 + i * D.BEAT)) / 0.55));
        const lv = lvlOf(P[i]) * grow;
        const ly = tb.set(lv);
        tb.rect.setAttribute("fill", i === 3 && T > 1.3 ? "url(#amberHot)" : "url(#amber)");
        const inside = lv > 0.5;
        lb.textContent = (P[i] * 100).toFixed(1) + "%";
        lb.setAttribute("y", D.f(inside ? ly + 48 : ly - 18));
        lb.setAttribute("font-size", inside ? 30 : 36);
        lb.setAttribute("fill", inside ? C.ink : i === 3 && T > 1.3 ? C.goldHi : C.ivory);
        lb.setAttribute("opacity", D.f(grow));
      });
      const m = D.ease.inOut(D.clamp((t - 56.13) / (63.58 - 56.13)));
      vials.forEach((v, i) => {
        const wob = Math.sin(t * 4 + i * 1.7) * 0.05 * (1 - m);
        v.set(D.clamp(D.lerp(STU0[i], lvlOf(P4[i]), m) + wob) * D.ease.out(D.clamp((t - 55.5) / 0.6)));
      });
      fA.setAttribute("stroke-dashoffset", D.f(-(t * 80) % 38));
      fB.setAttribute("stroke-dashoffset", D.f(-(t * 50) % 16));
    });

    // ---------- 字幕 ----------
    D.cap("2015 年，辛顿给这件事|起了个名字：<em>蒸馏</em>", S3, 29.83);
    D.cap("老师看一张照片，给每个答案<em>打分</em>", 29.83, 33.68);
    D.cap("标准答案只说：这是柯基|老师的打分也差不多", 33.68, 38.34);
    D.cap("把火开大，|老师的<em>「犹豫」</em>露出来了", 38.34, 46.84);
    D.cap("错答案的分数里，也藏着<em>知识</em>", 46.84, 48.96);
    D.cap("辛顿管它叫<em>「暗知识」</em>", 48.96, 51.08);
    D.cap("温度越高，分数越平，<em>小概率</em>越看得清", 51.08, 55.33);
    D.cap("学生不只抄答案，|还要学<em>老师怎么打分</em>", 55.33, 59.59);
    D.cap("老师的打分<em>为主</em>，标准答案<em>为辅</em>", 59.59, 63.84);
    D.cap("学完，把火调回去，|学生<em>单独上岗</em>", 63.84, 68.09);

    // ---------- 时间线 ----------
    D.step(() => {
      tl.fromTo("#lab", { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "power2.out", immediateRender: false }, S3);
      tl.fromTo("#corgi", { opacity: 0, x: -60, y: -20 }, { opacity: 1, x: 0, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false }, 29.83);
      tl.fromTo("#slip", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", immediateRender: false }, 33.5);
      tl.to("#slip", { opacity: 0, duration: 0.3 }, 50.8);
      notes.forEach((n, k) => tl.fromTo(`#${n.id}`, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", immediateRender: false }, 43.38 + k * D.BEAT));
      tl.to(notes.map((n) => `#${n.id}`), { opacity: 0, duration: 0.3 }, 50.8);
      tl.fromTo("#twin", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 46.84);
      tl.to("#twin", { opacity: 0, duration: 0.3 }, 50.8);
      tl.fromTo("#formula", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 51.08);
      tl.to("#formula", { opacity: 0, duration: 0.3 }, 55.0);
      // 55.33 学生登场：老师的架子缩到左边
      tl.to("#rackT", { scale: 0.58, svgOrigin: "110 1404", duration: 0.8, ease: "power3.inOut" }, 55.2);
      tl.to("#corgi", { opacity: 0, duration: 0.3 }, 55.2);
      tl.fromTo("#rackS", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 55.45);
      tl.fromTo("#lb-teacher", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 55.8);
      tl.fromTo("#lb-student", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 55.9);
      tl.to("#slip", { opacity: 1, duration: 0.35 }, 59.3);
      tl.fromTo("#flows", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 59.59);
      tl.to(["#flows", "#slip"], { opacity: 0, duration: 0.35 }, 63.6);
      // 63.84 上岗：学生滑到中央，老师暗下去
      tl.to(["#still-lab", "#rackT", "#plate", "#lb-teacher"], { opacity: 0.25, duration: 0.6 }, 63.84);
      tl.to("#rackS", { x: -410, y: -210, scale: 1.15, duration: 0.9, ease: "power3.inOut" }, 64.0);
      tl.to("#lb-student", { x: -200, y: -30, duration: 0.9, ease: "power3.inOut" }, 64.0);
      tl.to(["#lab", "#lb-student", "#lb-teacher"], { opacity: 0, duration: 0.45 }, 67.7);
    });
  };
})();
