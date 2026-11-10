// S3 老师和学生（17.05–29.83） · S4 温度（29.83–68.09）
(function () {
  const D = window.D, C = D.C, tl = D.tl;

  // 示意打分：柯基 9、狐狸 6、猫 4、面包 3、汽车 −2
  const CLS = ["柯基", "狐狸", "猫", "面包", "汽车"];
  const Z = [9, 6, 4, 3, -2];
  const soft = (T) => { const e = Z.map((z) => Math.exp(z / T)); const s = e.reduce((a, b) => a + b, 0); return e.map((x) => x / s); };
  const P4 = soft(4);

  // 温度随时间变化（旋钮与光柱同拍，control-target-sync）
  const TK = [[0, 1], [38.34, 1], [39.9, 4], [51.08, 4], [52.7, 8], [53.6, 8], [54.9, 4], [63.84, 4], [64.9, 1]];
  const Tof = (t) => D.keyed(TK, t);

  D.scene34 = () => {
    const net = D.net;
    const S3 = 17.05, S4 = 29.83;

    // ================= S3 =================
    const racks = D.wrap(D.L.back, "racks", { opacity: 0 });
    [225, 465, 705].forEach((x, i) => { const w = D.wrap(racks, `rack-${i}`); const g = D.g(w, { transform: `translate(${x} 712)` }); D.buildRack(g); });
    D.buildPhone(D.L.back, "phone", 260, 470);
    const link = D.wrap(D.L.back, "s3-link", { opacity: 0 });
    const linkLine = D.el(link, "line", { x1: 540, y1: 700, x2: 540, y2: 962, stroke: C.holo, "stroke-width": 3, "stroke-dasharray": "10 12", filter: "url(#glowS)" });
    D.onFrame((t) => linkLine.setAttribute("stroke-dashoffset", D.f(-t * 40 % 22)));

    D.text("老师", 70, 700, null, null, { id: "lb-teacher", cls: "tag" });
    D.text("学生", 700, 1175, null, null, { id: "lb-student", cls: "tag" });

    D.cap("大模型很聪明，但又大又贵", S3, 21.33);
    D.cap("小模型便宜、跑得快，但没那么聪明", 21.33, 25.58);
    D.cap("能不能让小模型，学到大模型的本事？", 25.58, S4);
    D.ghost("大 → 小", S3, S4, { y: 1060, size: 300, op: 0.045 });

    D.step(() => {
      tl.to("#teacher", { x: 540, y: 250, scale: 1.05, opacity: 1, duration: 0.6, ease: "power3.out" }, S3 - 0.15);
      tl.fromTo("#racks", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, S3);
      [0, 1, 2].forEach((i) => tl.fromTo(`#rack-${i}`, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(1.6)", immediateRender: true }, S3 + 0.27 + i * 0.27));
      tl.fromTo("#phone", { x: 540, y: 1205, scale: 0.6, opacity: 0 }, { x: 540, y: 1205, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.8)", immediateRender: true }, 21.33);
      tl.fromTo("#student", { x: 540, y: 1205, scale: 0, opacity: 0 }, { x: 540, y: 1205, scale: 0.72, opacity: 1, duration: 0.5, ease: "back.out(2)", immediateRender: false }, 21.6);
      tl.to("#racks", { opacity: 0, duration: 0.4 }, 25.4);
      tl.fromTo("#s3-link", { opacity: 0, scaleY: 0, svgOrigin: "540 700" }, { opacity: 1, scaleY: 1, svgOrigin: "540 700", duration: 0.5, ease: "power3.out", immediateRender: true }, 25.58);
      tl.fromTo("#lb-teacher", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.35, immediateRender: true }, 25.58);
      tl.fromTo("#lb-student", { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.35, immediateRender: true }, 26.11);
      // 进入 S4：手机和晶体先退场，老师挪到上方
      tl.to(["#phone", "#s3-link", "#lb-teacher", "#lb-student"], { opacity: 0, duration: 0.3 }, S4 - 0.2);
      tl.to("#student", { opacity: 0, scale: 0.3, duration: 0.3 }, S4 - 0.2);
      tl.to("#teacher", { x: 600, y: 170, scale: 0.9, duration: 0.6, ease: "power3.inOut" }, S4 - 0.2);
    });

    // ================= S4 =================
    const s4 = D.wrap(D.L.mid, "s4", { opacity: 0 });
    D.text("老师模型", 70, 150, null, null, { id: "lb-tm", cls: "tag small" });

    // 输入卡：柯基屁股
    const card = D.wrap(s4, "card");
    const cg = D.g(card, { transform: "translate(70 225)" });
    D.el(cg, "rect", { width: 230, height: 210, rx: 6, fill: "url(#fillIce)", stroke: C.holo, "stroke-opacity": 0.5, "stroke-width": 1.5 });
    D.brackets(cg, 0, 0, 230, 210, { len: 22, sw: 2.5 });
    corgi(cg, 0, 0);
    const feed = D.wrap(s4, "feed");
    const feedPath = D.el(feed, "path", { d: "M300 330 C380 330 420 230 470 205", stroke: C.holo, "stroke-width": 2.4, fill: "none", "stroke-dasharray": "6 8", opacity: 0.8 });
    D.onFrame((t) => feedPath.setAttribute("stroke-dashoffset", D.f(-t * 30 % 14)));
    const outBeam = D.wrap(s4, "outbeam");
    D.el(outBeam, "path", { d: "M560 540 L170 840 L950 840 L640 540 Z", fill: "url(#fillHolo)", opacity: 0.3 });

    // ---- 温度旋钮 ----
    const K = { x: 230, y: 700, r: 100 };
    const knob = D.wrap(s4, "knob");
    D.el(knob, "circle", { cx: K.x, cy: K.y, r: K.r + 26, fill: "none", stroke: C.heat, "stroke-opacity": 0.25, "stroke-width": 2 });
    D.el(knob, "circle", { cx: K.x, cy: K.y, r: K.r, fill: "rgba(255,181,71,0.06)", stroke: C.heat, "stroke-width": 3, filter: "url(#glowS)" });
    const A0 = -225, A1 = 45, ang = (T) => A0 + ((A1 - A0) * (T - 1)) / 9;
    const ticks = [];
    for (let i = 1; i <= 10; i++) {
      const a = (ang(i) * Math.PI) / 180, big = i === 1 || i === 4 || i === 8;
      const r1 = K.r + 8, r2 = K.r + (big ? 30 : 20);
      ticks.push(D.el(knob, "line", { x1: K.x + r1 * Math.cos(a), y1: K.y + r1 * Math.sin(a), x2: K.x + r2 * Math.cos(a), y2: K.y + r2 * Math.sin(a), stroke: C.heat, "stroke-width": big ? 4 : 2.5, opacity: 0.35 }));
      if (i === 1 || i === 4 || i === 8) D.el(knob, "text", { x: K.x + (K.r + 52) * Math.cos(a), y: K.y + (K.r + 52) * Math.sin(a) + 9, "text-anchor": "middle", "font-size": 28, fill: C.heat, "font-family": "DMono" }, i);
    }
    const arc = D.el(knob, "path", { d: "", stroke: C.heatHot, "stroke-width": 6, fill: "none", "stroke-linecap": "round", filter: "url(#glow)" });
    const needle = D.el(knob, "line", { x1: K.x, y1: K.y, x2: K.x, y2: K.y, stroke: C.flameCore, "stroke-width": 5, "stroke-linecap": "round", filter: "url(#glowS)" });
    D.el(knob, "circle", { id: "knob-unlit", cx: K.x, cy: K.y, r: 22, fill: "none", stroke: C.heat, "stroke-width": 2, opacity: 0.5 });
    // 火焰：从开场的酒精灯飞来
    const kf = D.wrap(s4, "knob-flame");
    const kfIn = D.g(kf, {});
    D.el(kfIn, "ellipse", { cx: K.x, cy: K.y, rx: 90, ry: 100, fill: "url(#bloomHeat)" });
    D.el(kfIn, "path", { d: `M${K.x} ${K.y - 62} C${K.x + 30} ${K.y - 26} ${K.x + 34} ${K.y + 6} ${K.x} ${K.y + 28} C${K.x - 34} ${K.y + 6} ${K.x - 30} ${K.y - 26} ${K.x} ${K.y - 62} Z`, fill: "url(#flame)", filter: "url(#glowL)" });
    D.el(kfIn, "circle", { cx: K.x, cy: K.y, r: 9, fill: C.flameCore });

    D.text(`<span class="rd-l">温度</span><span class="rd-v" id="t-val">T=1.0</span><span class="rd-n">平时 T=1</span>`, 420, 610, null, null, { id: "readout", cls: "readout" });
    D.text(`q<sub>i</sub> = e<sup>z<sub>i</sub> / <em>T</em></sup> ÷ Σ e<sup>z<sub>j</sub> / <em>T</em></sup>`, 420, 862, null, null, { id: "formula", cls: "formula" });

    // 柯基 ≈ 面包 小卡
    const twin = D.wrap(s4, "twin", { opacity: 0 });
    const tg = D.g(twin, { transform: "translate(700 615)" });
    D.el(tg, "rect", { width: 236, height: 200, rx: 6, fill: "url(#fillIce)", stroke: C.heat, "stroke-opacity": 0.6, "stroke-width": 1.5 });
    corgi(tg, -10, 0, 0.5);
    bread(tg, 128, 58);
    D.el(tg, "text", { x: 118, y: 120, "text-anchor": "middle", "font-size": 40, fill: C.heat, "font-family": "DMono" }, "≈");

    // ---- 概率光柱 ----
    const base = 1330, sc = 4.7, bw = 104, aw = 26, gw = bw + 8 + aw, gap = 36;
    const x0 = Math.round((1080 - (5 * gw + 4 * gap)) / 2) - 20;
    const bars = D.wrap(s4, "bars");
    D.el(bars, "line", { x1: x0 - 24, y1: base, x2: x0 + 5 * gw + 4 * gap + 24, y2: base, stroke: C.holo, "stroke-width": 2, opacity: 0.7 });
    const B = CLS.map((c, i) => {
      const x = x0 + i * (gw + gap);
      const g = D.g(bars, {});
      const o = {
        x,
        ghost: D.el(g, "rect", { x, y: base, width: bw, height: 0, fill: "none", stroke: C.ice, "stroke-opacity": 0.4, "stroke-dasharray": "5 7", "stroke-width": 2, opacity: 0 }),
        target: D.el(g, "rect", { x, y: base, width: bw, height: 0, fill: "none", stroke: C.heat, "stroke-dasharray": "8 6", "stroke-width": 2.5, opacity: 0 }),
        fill: D.el(g, "rect", { x, y: base, width: bw, height: 0, fill: "url(#fillHolo)" }),
        cap: D.el(g, "rect", { x, y: base - 3, width: bw, height: 6, fill: C.holo, filter: "url(#glow)" }),
        stu: D.el(g, "rect", { x: x + 10, y: base, width: bw - 20, height: 0, fill: C.holo, opacity: 0, filter: "url(#glowS)" }),
        ans: D.el(g, "rect", { x: x + bw + 8, y: base, width: aw, height: 0, fill: C.ice, opacity: 0.9, filter: "url(#glowS)" }),
        val: D.el(g, "text", { x: x + bw / 2, y: base - 20, "text-anchor": "middle", "font-size": 34, fill: C.ice, "font-family": "DMono" }, ""),
        name: D.el(g, "text", { x: x + bw / 2 + 17, y: base + 54, "text-anchor": "middle", "font-size": 42, "font-weight": 800, fill: i === 3 ? C.heat : C.holo, "font-family": "DSans" }, c),
      };
      return o;
    });
    D.el(bars, "text", { id: "ans-key", x: x0 + 5 * gw + 4 * gap, y: 905, "text-anchor": "end", "font-size": 28, fill: C.ice, opacity: 0, "font-family": "DSans" }, "▮ 白色细柱 = 标准答案");
    const legend = D.wrap(bars, "legend", { opacity: 0 });
    D.el(legend, "rect", { x: 650, y: 890, width: 34, height: 18, fill: "none", stroke: C.ice, "stroke-opacity": 0.5, "stroke-dasharray": "5 6", "stroke-width": 2 });
    D.el(legend, "text", { x: 696, y: 907, "font-size": 28, fill: C.ice, opacity: 0.7, "font-family": "DSans" }, "T=1 时的高度");

    // 注释：有点像狐狸 / 有点像面包 / 但绝不像汽车
    const notes = [[1, "有点像狐狸", C.ice], [3, "有点像面包", C.heat], [4, "绝不像汽车", C.ice]].map(([i, txt, col], k) => {
      const w = D.wrap(bars, `note-${k}`, { opacity: 0 });
      const cx = B[i].x + bw / 2, top = base - P4[i] * 100 * sc;
      D.el(w, "text", { x: cx, y: top - 74, "text-anchor": "middle", "font-size": 34, "font-weight": 800, fill: col, "font-family": "DSans", filter: "url(#glowS)" }, txt);
      return { id: `note-${k}`, cx, y: top - 84 };
    });

    // 学生：晶体 + 两股光流 + 标准答案标签
    const sw = D.wrap(s4, "s4-streams", { opacity: 0 });
    const streamA = D.el(sw, "path", { d: "M600 545 C580 700 330 780 240 850", stroke: C.heat, "stroke-width": 14, fill: "none", "stroke-linecap": "round", opacity: 0.85, filter: "url(#glow)", "stroke-dasharray": "26 18" });
    const streamB = D.el(sw, "path", { d: "M470 930 C400 920 330 900 268 890", stroke: C.ice, "stroke-width": 4, fill: "none", "stroke-linecap": "round", opacity: 0.9, filter: "url(#glowS)", "stroke-dasharray": "10 10" });
    D.onFrame((t) => { streamA.setAttribute("stroke-dashoffset", D.f(-t * 90 % 44)); streamB.setAttribute("stroke-dashoffset", D.f(-t * 60 % 20)); });
    D.text("老师的打分", 560, 690, null, null, { id: "lb-streamA", cls: "tag heat small" });
    D.text("标准答案：柯基", 480, 905, null, null, { id: "lb-streamB", cls: "tag ice small" });
    D.text("学生", 150, 990, null, null, { id: "lb-stu", cls: "tag small" });
    D.buildCrystal(D.L.mid, "student2", 54);
    const lock = D.wrap(s4, "lock", { opacity: 0 });
    D.el(lock, "rect", { x: x0 - 20, y: 960, width: 5 * gw + 4 * gap + 40, height: 380, fill: "none", stroke: C.holo, "stroke-width": 3, filter: "url(#glow)" });
    D.buildPhone(D.L.mid, "phone2", 300, 540);
    D.text("T=1", 540, 880, null, null, { id: "t-one", anchor: "center", cls: "chip" });

    // ---- 每帧：温度 → 光柱、旋钮、读数 ----
    const tval = () => document.getElementById("t-val");
    const STU0 = [0.22, 0.3, 0.08, 0.28, 0.12];
    D.onFrame((t) => {
      if (t < S4 - 0.5 || t > 68.5) return;
      const T = Tof(t), P = soft(T), P1 = soft(1);
      const tv = tval(); if (tv) tv.textContent = "T=" + T.toFixed(1);
      // 旋钮
      const a = (ang(T) * Math.PI) / 180;
      needle.setAttribute("x2", D.f(K.x + (K.r - 16) * Math.cos(a)));
      needle.setAttribute("y2", D.f(K.y + (K.r - 16) * Math.sin(a)));
      const r = K.r + 8, p0 = [K.x + r * Math.cos((A0 * Math.PI) / 180), K.y + r * Math.sin((A0 * Math.PI) / 180)], p1 = [K.x + r * Math.cos(a), K.y + r * Math.sin(a)];
      arc.setAttribute("d", T <= 1.01 ? "" : `M${D.f(p0[0])} ${D.f(p0[1])} A${r} ${r} 0 ${ang(T) - A0 > 180 ? 1 : 0} 1 ${D.f(p1[0])} ${D.f(p1[1])}`);
      ticks.forEach((tk, i) => tk.setAttribute("opacity", i + 1 <= T + 0.01 ? 1 : 0.35));
      // 光柱：29.83 起每拍升起一根
      const teacherFade = 1 - D.clamp((t - 55.33) / 0.6);
      B.forEach((b, i) => {
        const grow = D.ease.out(D.clamp((t - (S4 + 0.3 + i * D.BEAT)) / 0.45));
        const h = Math.max(P[i] * 100 * sc, 5) * grow;
        b.fill.setAttribute("y", D.f(base - h)); b.fill.setAttribute("height", D.f(h));
        b.cap.setAttribute("y", D.f(base - h - 3));
        const hot = i === 3 && T > 1.3;
        b.fill.setAttribute("fill", hot ? "url(#fillHeat)" : "url(#fillHolo)");
        b.cap.setAttribute("fill", hot ? C.heat : C.holo);
        b.fill.setAttribute("opacity", D.f(teacherFade)); b.cap.setAttribute("opacity", D.f(teacherFade * grow));
        b.val.textContent = (P[i] * 100).toFixed(1) + "%";
        b.val.setAttribute("y", D.f(base - h - 20));
        b.val.setAttribute("opacity", D.f(grow * teacherFade));
        b.val.setAttribute("fill", hot ? C.heatHot : C.ice);
        b.val.setAttribute("font-size", hot ? 42 : 34);
        // T=1 的虚线幽灵：39.9–51.08 可见
        const gh = Math.max(P1[i] * 100 * sc, 2), gOp = D.clamp((t - 39.0) / 0.5) * (1 - D.clamp((t - 51.0) / 0.4));
        b.ghost.setAttribute("y", D.f(base - gh)); b.ghost.setAttribute("height", D.f(gh)); b.ghost.setAttribute("opacity", D.f(gOp));
        // 标准答案细柱：33.68–38.34
        const ansH = (i === 0 ? 100 : 0.6) * sc * D.ease.out(D.clamp((t - 33.68) / 0.3)) * (1 - D.clamp((t - 38.0) / 0.35));
        b.ans.setAttribute("y", D.f(base - ansH)); b.ans.setAttribute("height", D.f(ansH));
        // 学生阶段：老师的 T=4 形状变成琥珀虚线目标，学生的光柱从乱七八糟长到对齐
        const tgtOp = D.clamp((t - 55.33) / 0.5) * (1 - D.clamp((t - 63.84) / 0.5));
        const th = P4[i] * 100 * sc;
        b.target.setAttribute("y", D.f(base - th)); b.target.setAttribute("height", D.f(th)); b.target.setAttribute("opacity", D.f(tgtOp));
        const m = D.ease.inOut(D.clamp((t - 56.13) / (63.58 - 56.13)));
        const wob = Math.sin(t * 5 + i * 1.7) * 0.05 * (1 - m);
        const sp = D.lerp(STU0[i], P4[i], m) + wob;
        const sh = Math.max(sp * 100 * sc, 4) * D.ease.out(D.clamp((t - 55.6) / 0.5));
        b.stu.setAttribute("y", D.f(base - sh)); b.stu.setAttribute("height", D.f(sh)); b.stu.setAttribute("opacity", D.f(tgtOp > 0 ? 0.85 * tgtOp : 0));
      });
    });

    // 火焰跳动
    D.onFrame((t) => {
      if (t < 38 || t > 56) return;
      const s = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29), k = 0.05 * Math.sin(t * 11);
      kfIn.setAttribute("transform", `translate(${K.x} ${K.y + 28}) matrix(1 0 ${D.f(k)} ${D.f(s)} 0 0) translate(${-K.x} ${-K.y - 28})`);
    });

    // ---- 字幕 ----
    D.cap("老师看一张图，给每个答案打分", S4, 33.68);
    D.cap("标准答案只有一句：这是柯基", 33.68, 38.34, { sub: "平时，老师的打分和它差不多", subAt: 34.6 });
    D.cap("把温度调高", 38.34, 46.84, { sub: "老师的「犹豫」露出来了", subAt: 40.46, cls: "big" });
    D.cap("错答案的分数里，也藏着知识", 46.84, 51.08, { sub: "Hinton 把它叫作「暗知识」", subAt: 48.96 });
    D.cap("温度越高，分数越平，小概率越看得清", 51.08, 55.33);
    D.cap("学生不只学答案，还要学老师怎么打分", 55.33, 59.59);
    D.cap("两样一起学：老师的打分为主，标准答案为辅", 59.59, 63.84);
    D.cap("学完后，温度调回 1，学生单独上岗", 63.84, 68.09);
    D.ghost("T=4", 38.34, 55.33, { y: 1240, size: 480, op: 0.045, mono: true, x: 560 });
    D.ghost("暗知识", 46.84, 55.33, { y: 1500, size: 200, op: 0.05, x: 540 });

    // ---- 时间线 ----
    D.step(() => {
      tl.fromTo("#s4", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, S4 - 0.1);
      tl.fromTo("#lb-tm", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, S4);
      tl.fromTo("#card", { x: -340, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out", immediateRender: true }, S4);
      tl.fromTo("#feed", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, S4 + 0.35);
      tl.fromTo("#outbeam", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: true }, S4 + 0.3);
      tl.fromTo("#knob", { opacity: 0, scale: 0.7, svgOrigin: `${K.x} ${K.y}` }, { opacity: 0.75, scale: 1, svgOrigin: `${K.x} ${K.y}`, duration: 0.45, ease: "back.out(1.8)", immediateRender: true }, S4 + 0.6);
      tl.fromTo("#readout", { opacity: 0, x: -20 }, { opacity: 0.8, x: 0, duration: 0.4, immediateRender: true }, S4 + 0.8);
      tl.fromTo("#ans-key", { opacity: 0 }, { opacity: 0.8, duration: 0.3, immediateRender: true }, 33.68);
      tl.to("#ans-key", { opacity: 0, duration: 0.3 }, 38.05);
      // 38.34 火焰飞进旋钮
      tl.fromTo("#knob-flame", { opacity: 0, x: 344, y: 36, scale: 2.2 }, { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.5, ease: "power3.out", immediateRender: true }, 37.9);
      tl.to("#knob-unlit", { opacity: 0, duration: 0.2 }, 38.34);
      tl.to(["#knob", "#readout"], { opacity: 1, duration: 0.3 }, 38.34);
      tl.fromTo("#legend", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: true }, 40.0);
      tl.to("#legend", { opacity: 0, duration: 0.3 }, 50.9);
      notes.forEach((n, k) => tl.fromTo(`#${n.id}`, { opacity: 0, scale: 0.4, svgOrigin: `${n.cx} ${n.y}` }, { opacity: 1, scale: 1, svgOrigin: `${n.cx} ${n.y}`, duration: 0.32, ease: "back.out(2.4)", immediateRender: true }, 43.38 + k * D.BEAT));
      tl.to(notes.map((n) => `#${n.id}`), { opacity: 0, duration: 0.3 }, 50.8);
      tl.fromTo("#twin", { opacity: 0, scale: 0.6, svgOrigin: "818 715" }, { opacity: 1, scale: 1, svgOrigin: "818 715", duration: 0.4, ease: "back.out(2)", immediateRender: true }, 46.84);
      tl.to("#twin", { opacity: 0, duration: 0.3 }, 50.8);
      tl.fromTo("#formula", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: true }, 51.08);
      // 55.33 学生阶段
      tl.to(["#knob", "#knob-flame", "#readout", "#formula", "#card", "#feed"], { opacity: 0, duration: 0.4 }, 55.2);
      tl.fromTo("#student2", { x: 230, y: 880, scale: 0, opacity: 0 }, { x: 230, y: 880, scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)", immediateRender: true }, 55.33);
      tl.fromTo("#lb-stu", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, 55.6);
      tl.fromTo("#s4-streams", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: true }, 59.59);
      tl.fromTo("#lb-streamA", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, immediateRender: true }, 59.59);
      tl.fromTo("#lb-streamB", { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.3, immediateRender: true }, 60.12);
      tl.fromTo("#lock", { opacity: 0 }, { opacity: 1, duration: 0.06, immediateRender: true }, 63.58);
      tl.to("#lock", { opacity: 0, duration: 0.4 }, 63.7);
      // 63.84 上岗：其他退场，晶体落进手机
      tl.to(["#s4-streams", "#lb-streamA", "#lb-streamB", "#lb-stu", "#bars", "#outbeam", "#lb-tm"], { opacity: 0, duration: 0.4 }, 63.84);
      tl.to("#teacher", { opacity: 0.3, duration: 0.6 }, 63.84);
      tl.fromTo("#phone2", { x: 540, y: 1110, scale: 0.6, opacity: 0 }, { x: 540, y: 1110, scale: 1, opacity: 1, duration: 0.45, ease: "back.out(1.8)", immediateRender: true }, 64.0);
      tl.to("#student2", { x: 540, y: 1110, scale: 1.1, duration: 0.7, ease: "power3.inOut" }, 64.2);
      tl.fromTo("#t-one", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)", immediateRender: true }, 64.9);
      tl.to(["#phone2", "#student2", "#t-one"], { opacity: 0, duration: 0.4 }, 67.8);
    });
  };

  // 柯基屁股（线稿，左上角对齐卡片）
  function corgi(g, ox, oy, s = 1) {
    const w = D.g(g, { transform: `translate(${ox} ${oy}) scale(${s})`, stroke: C.ice, "stroke-width": 3 / s * s, fill: "none", filter: "url(#glowS)", "stroke-linecap": "round", "stroke-linejoin": "round" });
    D.el(w, "path", { d: "M115 62 C70 50 40 80 44 120 C47 150 70 162 98 160 C108 160 113 154 115 146 C117 154 122 160 132 160 C160 162 183 150 186 120 C190 80 160 50 115 62 Z", fill: "rgba(255,181,71,0.16)" });
    D.el(w, "path", { d: "M115 70 L115 140", opacity: 0.7 });
    D.el(w, "path", { d: "M72 160 L70 186 M90 162 L90 186 M140 162 L140 186 M158 160 L160 186" });
    D.el(w, "path", { d: "M108 64 C102 44 118 30 128 46 C124 54 120 60 116 63", fill: "rgba(232,253,255,0.18)" });
  }
  // 面包（线稿）
  function bread(g, ox, oy) {
    const w = D.g(g, { transform: `translate(${ox} ${oy})`, stroke: C.heat, "stroke-width": 3, fill: "rgba(255,181,71,0.18)", filter: "url(#glowS)", "stroke-linecap": "round" });
    D.el(w, "path", { d: "M8 50 C0 20 30 2 50 14 C70 2 100 20 92 50 C90 66 84 84 50 84 C16 84 10 66 8 50 Z" });
    D.el(w, "path", { d: "M36 30 L44 40 M54 26 L62 36 M70 32 L76 40", fill: "none" });
  }
})();
