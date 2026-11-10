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
    D.year(25.58, "2015");
    D.step(() => {
      tl.fromTo("#hdr", { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.7, ease: "power2.out", immediateRender: false }, 25.58);
      tl.to("#hdr", { opacity: 0, duration: 0.4 }, 157.0);
    });
    D.caseInfo(25.58, 87.21, { place: "山景城 · 辛顿", en: "Distilling the Knowledge in a Neural Network", zh: "《提炼神经网络中的知识》", by: "辛顿 · 维尼亚尔斯 · 迪恩 · 2015", seal: "蒸" });

    // ================= S2 本来的蒸馏：化学 =================
    const S2 = 17.05, S3 = 25.58;
    const camC = D.wrap(D.L.mid, "chem", { opacity: 0 });
    const chemIn = el(camC, "g", { transform: "translate(0 65)" });
    const ch = D.still(chemIn, "still-chem", { color: C.amber, smallColor: C.pure });
    // 温度计旁的两个刻度标签：酒精 78℃（红柱顶端）/ 水 100℃
    const thx = ch.B.x, thTop = ch.headY - 60;
    const bp = D.wrap(chemIn, "bp-labels", { opacity: 0 });
    [[thTop, "酒精 78℃", C.goldHi], [thTop - 70, "水 100℃", C.ivoryDim]].forEach(([y, txt, c]) => {
      el(bp, "line", { x1: thx - 14, y1: y, x2: thx - 70, y2: y, stroke: c, "stroke-width": 2 });
      el(bp, "text", { x: thx - 82, y: y + 12, "text-anchor": "end", "font-family": "DSerif", "font-weight": 800, "font-size": 36, fill: c }, txt);
    });
    const SMC = [[18.6, 0.04], [24.2, 0.62]];
    D.onFrame((t) => {
      if (t < 16.8 || t > 26) return;
      ch.tick(t, { flame: D.keyed([[17.05, 0.35], [17.6, 1.1]], t), big: 0.05, small: D.keyed(SMC, t), drip: "#fbf1d6" });
    });
    [19.75, 20.82, 21.89, 22.96, 24.03].forEach((tt) => ch.dropAt(tt));
    const card1 = D.specimen(D.L.front, "spec-1", 560, 300, 460, { color: C.amber, name: "酒", rows: [["瓶里装的", "酒精本身"], ["怎么来的", "靠沸点不同分开"]] });

    D.em = D.EM.amber;
    D.cap("本来的蒸馏：|加热，<em>沸点低</em>的先变成蒸汽", S2, 19.75);
    D.cap("冷却下来，得到更<em>纯</em>的酒", 19.75, 22.4);
    D.cap("炼金术士管蒸出来的东西|叫 <em>spiritus</em>：灵魂", 22.4, S3, { note: "烈酒的英文至今叫 spirits", noteAt: 23.2 });

    D.step(() => {
      tl.fromTo("#chem", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S2 - 0.1);
      tl.fromTo("#bp-labels", { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 19.2);
      tl.fromTo("#spec-1", { opacity: 0, x: 60, rotation: 4 }, { opacity: 1, x: 0, rotation: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, 23.47);
      tl.to(["#chem", "#spec-1"], { opacity: 0, duration: 0.5 }, S3 - 0.3);
    });

    // ================= S3 实验台 =================
    const lab = D.wrap(D.L.mid, "lab", { opacity: 0 });
    const st = D.still(lab, "still-lab", { big: { x: 380, y: 560, r: 125 }, neck: 90, thermo: false, small: false, stand: false, floor: 925, condEnd: [960, 880], color: C.ai });
    el(lab, "rect", { x: 170, y: 925, width: 420, height: 18, rx: 3, fill: C.wood, stroke: C.woodHi, "stroke-width": 2 });
    D.glass(lab, "M951 880 V985 H969 V880");
    D.glass(lab, "M150 985 H969 V1005 H150 Z", { hl: "M165 989 H955" });
    const xs = [175, 335, 495, 655, 815];
    xs.forEach((x) => D.glass(lab, `M${x - 7} 1005 V1046 H${x + 7} V1005`));
    // 每个出口往下面的试管滴液：分数越高滴得越勤（每帧按当前温度下的分数算）
    const spoutDrops = xs.map((x, i) => [0, 1, 2].map((k) => ({ el: el(lab, "path", { d: `M${x} 1044 c7 11 8 18 0 21 c-8 -3 -7 -10 0 -21 z`, fill: D.liq(C.ai).hi, filter: "url(#softGlow)", opacity: 0 }), ph: (k / 3 + D.hash(i * 5 + k) * 0.2) })));
    const tubeLy = xs.map(() => 1380);
    // 分液管里流动的小液滴
    // 分液横管里流动的光
    const manG = el(lab, "path", { d: "M960 995 H160", fill: "none", stroke: C.ai, "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": "80 70", opacity: 0.5, filter: "url(#blur6)" });
    const manC = el(lab, "path", { d: "M960 995 H160", fill: "none", stroke: D.liq(C.ai).hi, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "80 70", opacity: 0.9 });
    D.onFrame((t) => { if (t < 25 || t > 68.5) return; const off = D.f(-((t * 120) % 150)); manG.setAttribute("stroke-dashoffset", off); manC.setAttribute("stroke-dashoffset", off); });

    // 老师的试管架（55.33 起缩小到左边）
    const rackT = D.wrap(lab, "rackT");
    el(rackT, "rect", { x: 110, y: 1062, width: 860, height: 22, rx: 4, fill: "#5a3d24", stroke: C.woodHi, "stroke-width": 2 });
    el(rackT, "rect", { x: 110, y: 1384, width: 860, height: 20, rx: 4, fill: C.wood, stroke: C.woodHi, "stroke-width": 2 });
    el(rackT, "rect", { x: 118, y: 1062, width: 14, height: 330, fill: C.wood });
    el(rackT, "rect", { x: 948, y: 1062, width: 14, height: 330, fill: C.wood });
    const breadGlow = el(rackT, "ellipse", { cx: xs[3], cy: 1260, rx: 110, ry: 200, fill: D.liq(C.ai).glow, opacity: 0 });
    const tubes = xs.map((x, i) => {
      const tb = D.tube(rackT, x, 1380, 300, { w: 76, color: C.ai });
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

    // 学生：55.33 起画面上下分开。上半是老师（整套装置缩小），下半是学生：
    // 五支试管（学老师怎么打分）→ 底下汇流管 → 汇进一个小烧瓶，小烧瓶才是"小模型"
    const KS = 0.55, OX = 540, OY = 300;
    const TX = xs.map((x) => OX + (x - OX) * KS);
    const SYB = 1150, SH = 190, MY = 1196, FX = 515, FCY = 1318, FR = 62;
    const stu = D.wrap(D.L.mid, "stu", { opacity: 0 }, true);
    const rig = D.wrap(stu, "stu-rig");                       // 试管 + 汇流管（上岗时退场）
    el(rig, "rect", { x: 300, y: 972, width: 430, height: 12, rx: 3, fill: "#5a3d24", stroke: C.woodHi, "stroke-width": 1.5 });
    const STU0 = [0.22, 0.34, 0.06, 0.3, 0.12];
    const vials = TX.map((x, i) => {
      D.glass(rig, `M${D.f(x - 5)} ${SYB - 2} V${MY} H${D.f(x + 5)} V${SYB - 2}`); // 出口
      const v = D.tube(rig, x, SYB, SH, { w: 52, color: C.ai });
      const ty = SYB - (SH - 6) * lvlOf(P4[i]);
      el(rig, "line", { x1: D.f(x - 33), y1: D.f(ty), x2: D.f(x + 33), y2: D.f(ty), stroke: C.goldHi, "stroke-width": 2.4, "stroke-dasharray": "6 5" });
      return v;
    });
    D.glass(rig, `M${D.f(TX[0] - 14)} ${MY} H${D.f(TX[4] + 14)} V${MY + 14} H${FX + 7} V${FCY - FR - 30} H${FX - 7} V${MY + 14} H${D.f(TX[0] - 14)} Z`, { hl: `M${D.f(TX[0])} ${MY + 3} H${D.f(TX[4])}` });
    // 汇流管里的光：从两头流向中间，再往下流进小烧瓶
    const mflow = [`M${D.f(TX[0])} ${MY + 7} H${FX} V${FCY - FR - 26}`, `M${D.f(TX[4])} ${MY + 7} H${FX} V${FCY - FR - 26}`].map((d) => [
      el(rig, "path", { d, fill: "none", stroke: C.ai, "stroke-width": 8, "stroke-linecap": "round", "stroke-dasharray": "40 50", opacity: 0.5, filter: "url(#blur6)" }),
      el(rig, "path", { d, fill: "none", stroke: D.liq(C.ai).hi, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "40 50", opacity: 0.9 }),
    ]).flat();
    // 小烧瓶（学生 · 小模型）：外层负责移动，内层负责放大
    const sf = D.wrap(stu, "stu-flask", {}, true);
    const sfIn = D.wrap(sf, "stu-flask-in");
    el(sfIn, "ellipse", { cx: FX, cy: FCY + FR + 6, rx: 90, ry: 11, fill: "url(#shadow)" });
    const stuF = D.flask(sfIn, FX, FCY, FR, { level: 0.06, neck: 0.48, color: C.ai });
    const tagStu = D.tag(sfIn, "tag-stu", FX - 12, FCY - FR - 8, 140, FCY - 10, "学生 · 小模型", { rot: -3, size: 26 });
    D.text("老师 ·<br>大模型", 70, 400, { id: "lb-teacher", cls: "note", style: "line-height:1.35" });
    // 老师的每支试管各连一道数据流，直直流进学生对应的试管
    const flows = D.wrap(D.L.mid, "flows", { opacity: 0 });
    const fAs = TX.map((x) => el(flows, "path", { d: `M${D.f(x)} 944 V964`, fill: "none", stroke: C.ai, "stroke-width": 7, "stroke-linecap": "round", "stroke-dasharray": "10 9", opacity: 0.9, filter: "url(#softGlow)" }));
    // 标准答案纸条（缩小后约在 (750, 545)）接一根玻璃导管，沿右侧下来，接进学生的汇流管
    const ansD = `M752 548 H862 Q880 548 880 566 V${MY + 7} H${D.f(TX[4] + 14)}`;
    const ansT = D.wrap(D.L.mid, "ans-tube", { opacity: 0 });
    el(ansT, "path", { d: ansD, fill: "none", stroke: "#000", "stroke-opacity": 0.35, "stroke-width": 18, "stroke-linejoin": "round" });
    el(ansT, "path", { d: ansD, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.5, "stroke-width": 13, "stroke-linejoin": "round" });
    el(ansT, "path", { d: ansD, fill: "none", stroke: "#1d150e", "stroke-width": 9, "stroke-linejoin": "round" });
    el(ansT, "path", { d: ansD, fill: "none", stroke: C.ivory, "stroke-width": 5, "stroke-linecap": "round", "stroke-dasharray": "34 46", opacity: 0.45, filter: "url(#blur6)", class: "ansflow" });
    const fB = el(ansT, "path", { d: ansD, fill: "none", stroke: "#fff8e6", "stroke-width": 2.2, "stroke-linecap": "round", "stroke-dasharray": "34 46", opacity: 0.95, class: "ansflow" });
    D.sealAt("成", 760, 640, 100, 64.95, 67.9, { rot: -8 });
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
        tubeLy[i] = ly;
        tb.rect.setAttribute("fill", i === 3 && T > 1.3 ? tb.L.hot : tb.L.lin);
        const inside = lv > 0.5;
        lb.textContent = (P[i] * 100).toFixed(1) + "%";
        lb.setAttribute("y", D.f(inside ? ly + 48 : ly - 18));
        lb.setAttribute("font-size", inside ? 30 : 36);
        lb.setAttribute("fill", inside ? "#fff6e0" : i === 3 && T > 1.3 ? C.goldHi : C.ivory);
        lb.setAttribute("opacity", D.f(grow));
      });
      // 出口滴液：周期随分数变（0.45 秒到 2 秒），分数太小就不滴
      spoutDrops.forEach((ds, i) => {
        const on = t > 29.9 + i * D.BEAT && t < 63.84 && P[i] > 0.012;
        const per = 0.45 + (1 - Math.sqrt(P[i])) * 1.55;
        ds.forEach((dp) => {
          if (!on) { dp.el.setAttribute("opacity", 0); return; }
          const u = ((t / per + dp.ph) % 1) * 3; // 只在三分之一的时间里下落，其余时间等待
          if (u > 1) { dp.el.setAttribute("opacity", 0); return; }
          const y = (tubeLy[i] - 1050) * u * u;
          dp.el.setAttribute("transform", `translate(0 ${D.f(y)})`);
          dp.el.setAttribute("opacity", D.f(0.95 * (1 - u * 0.3)));
        });
      });
      const m = D.ease.inOut(D.clamp((t - 56.13) / (63.58 - 56.13)));
      vials.forEach((v, i) => {
        const wob = Math.sin(t * 4 + i * 1.7) * 0.05 * (1 - m);
        v.set(D.clamp(D.lerp(STU0[i], lvlOf(P4[i]), m) + wob) * D.ease.out(D.clamp((t - 55.5) / 0.6)));
      });
      fAs.forEach((f) => f.setAttribute("stroke-dashoffset", D.f(-(t * 60) % 19)));
      mflow.forEach((f) => f.setAttribute("stroke-dashoffset", D.f(-((t * 90) % 90))));
      stuF.set(D.lerp(0.06, 0.62, m));
      tagStu.swing(t, 55.6);
      document.querySelectorAll(".ansflow").forEach((f) => f.setAttribute("stroke-dashoffset", D.f(-((t * 90) % 80))));
    });

    // ---------- 字幕 ----------
    D.em = D.EM.ai;
    D.cap("2015 年，辛顿把这个词|<em>借</em>给了 AI", S3, 27.71);
    D.cap("大模型当<em>老师</em>，小模型当<em>学生</em>", 27.71, 29.83);
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
      tl.to("#lab", { scale: KS, svgOrigin: `${OX} ${OY}`, duration: 0.8, ease: "power3.inOut" }, 55.2);
      tl.to("#corgi", { opacity: 0, duration: 0.3 }, 55.2);
      tl.fromTo("#stu", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 55.45);
      tl.fromTo("#lb-teacher", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 55.8);
      tl.to("#slip", { opacity: 1, duration: 0.35 }, 59.3);
      tl.fromTo("#flows", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 56.13);
      tl.fromTo("#ans-tube", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 59.4);
      tl.to("#ans-tube", { opacity: 0, duration: 0.35 }, 63.6);
      tl.to(["#flows", "#slip"], { opacity: 0, duration: 0.35 }, 63.6);
      // 63.84 上岗：学生滑到中央，老师暗下去
      // 63.84 上岗：老师退场，学生升到画面中央
      tl.to(["#lab", "#lb-teacher"], { opacity: 0, duration: 0.6 }, 63.84);
      tl.to("#stu-rig", { opacity: 0, duration: 0.5 }, 63.84);
      tl.to("#stu-flask", { x: 540 - FX, y: 880 - FCY, duration: 0.9, ease: "power3.inOut" }, 64.0);
      tl.to("#stu-flask-in", { scale: 1.4, svgOrigin: `${FX} ${FCY}`, duration: 0.9, ease: "power3.inOut" }, 64.0);
      tl.to("#stu", { opacity: 0, duration: 0.45 }, 67.7);
    });
  };
})();
