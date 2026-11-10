// S6 2026 · 争议（93.59–106.61） · S7 网上的蒸馏，按年份：2023 孙燕姿 → 2025 吉卜力 → 2026 同事.skill（106.61–129.73）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene67 = () => {
    const S6 = 93.59, S7 = 106.61, S8 = 129.73;
    D.year(S6, "2026");
    D.caseInfo(S6, S7, { place: "美国 · 中国", en: "Detecting and preventing distillation attacks", zh: "《检测与防范蒸馏攻击》", by: "一家美国 AI 公司 · 2026", seal: "争" });

    // ================= S6 争议 =================
    const s6 = D.wrap(D.L.mid, "s6", { opacity: 0 });
    el(s6, "ellipse", { cx: 540, cy: 875, rx: 240, ry: 24, fill: "url(#shadow)" });
    const tf = D.flask(s6, 540, 700, 160, { level: 0.6, neck: 0.75, color: C.ai });
    el(s6, "rect", { x: 540 - 46, y: tf.top - 30, width: 92, height: 36, rx: 6, fill: "#6b4a2a" });
    // 纸签：自家的老师 → 别人家的老师
    const tOwn = D.tag(s6, "tag-own", 520, tf.top + 40, 150, tf.top + 110, "自家的老师", { rot: -4, w: 272 });
    const tOther = D.tag(s6, "tag-other", 520, tf.top + 40, 150, tf.top + 110, "别人家的老师", { rot: -4, w: 272 });
    D.onFrame((t) => { if (t > 93 && t < 100) { tOwn.swing(t, 93.8); tOther.swing(t, 93.8); } });
    const wax = D.wrap(s6, "wax", { opacity: 0 });
    el(wax, "path", { d: `M${540 - 58} ${tf.top - 34} C${540 - 40} ${tf.top - 60} ${540 + 40} ${tf.top - 60} ${540 + 58} ${tf.top - 34} C${540 + 62} ${tf.top - 10} ${540 + 50} ${tf.top + 18} ${540 + 40} ${tf.top + 30} C${540 + 34} ${tf.top + 10} ${540 + 20} ${tf.top + 8} ${540 + 10} ${tf.top + 14} C${540} ${tf.top + 40} ${540 - 14} ${tf.top + 40} ${540 - 18} ${tf.top + 10} C${540 - 30} ${tf.top + 6} ${540 - 50} ${tf.top + 14} ${540 - 58} ${tf.top - 34} Z`, fill: "#8e2a1e", filter: "url(#drop)" });
    el(wax, "circle", { cx: 540, cy: tf.top - 20, r: 24, fill: "#a8382a", stroke: "#6e1c12", "stroke-width": 3 });
    el(wax, "text", { x: 540, y: tf.top - 10, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 900, "font-size": 26, fill: "#f2d6c8" }, "封");
    const straws = D.wrap(s6, "straws", { opacity: 0 });
    const sList = [];
    for (let i = 0; i < 22; i++) {
      const left = i % 2 === 0;
      const sy = 360 + D.hash(i * 3) * 1000;
      const ex = 540 + (left ? -1 : 1) * (20 + D.hash(i * 7) * 90), ey = 640 + D.hash(i * 11) * 140;
      const sx = left ? -30 : 1110;
      const d = `M${sx} ${D.f(sy)} C${D.f(left ? 220 : 860)} ${D.f(sy - 60)} ${D.f(ex + (left ? -160 : 160))} ${D.f(ey - 220)} ${D.f(ex)} ${D.f(ey)}`;
      const glassP = el(straws, "path", { d, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.45, "stroke-width": 5, "stroke-linecap": "round" });
      const L = glassP.getTotalLength();
      glassP.setAttribute("stroke-dasharray", D.f(L)); glassP.setAttribute("stroke-dashoffset", D.f(L));
      const dot = el(straws, "path", { d, fill: "none", stroke: D.liq(C.ai).hi, "stroke-width": 3, "stroke-linecap": "round", "stroke-dasharray": "40 120", opacity: 0, filter: "url(#softGlow)" });
      sList.push({ p: glassP, L, dot, t0: 97.81 + D.hash(i * 13) * 1.0, ph: D.hash(i) });
    }
    D.onFrame((t) => {
      if (t < 97.5 || t > 100.2) return;
      for (const s of sList) {
        const k = D.clamp((t - s.t0) / 0.8);
        s.p.setAttribute("stroke-dashoffset", D.f(s.L * (1 - D.ease.out(k))));
        if (k >= 1) { s.dot.setAttribute("stroke-dashoffset", D.f((t * 160 + s.ph * 160) % 160)); s.dot.setAttribute("opacity", 0.85); }
        else s.dot.setAttribute("opacity", 0);
      }
    });
    // 账簿：指控 / 否认
    D.text(`<span class="k">2026 年 4 月 · 美国白宫备忘录</span><div class="zhbig" style="font-size:44px">存在主要来自中国的<br>「工业规模」蒸馏行动</div>`, 140, 900, { id: "led-2", cls: "card", style: "width:800px" });
    D.sealAt("指控", 820, 880, 120, 100.13, 103.0, { fs: 40, rot: -8, id: "seal-a2" });
    D.text(`<div class="zhbig">中国大使馆：毫无根据</div>`, 140, 1180, { id: "led-3", cls: "card", style: "width:800px;background:linear-gradient(180deg,#f6eedb,#e3d6b8)" });
    D.sealAt("否认", 820, 1160, 120, 101.2, 103.0, { fs: 40, rot: 8, ink: true, id: "seal-d" });
    // 天平
    const bal = D.wrap(D.L.mid, "balance", { opacity: 0 });
    el(bal, "ellipse", { cx: 540, cy: 1265, rx: 230, ry: 22, fill: "url(#shadow)" });
    el(bal, "path", { d: "M440 1260 L640 1260 L600 1225 L480 1225 Z", fill: "url(#brass)" });
    el(bal, "rect", { x: 530, y: 560, width: 20, height: 670, rx: 8, fill: "url(#brass)" });
    el(bal, "circle", { cx: 540, cy: 556, r: 18, fill: "url(#brass)" });
    const beam = el(bal, "g");
    el(beam, "rect", { x: 230, y: 548, width: 620, height: 16, rx: 8, fill: "url(#brass)", filter: "url(#drop)" });
    el(beam, "path", { d: "M540 556 L520 520 L560 520 Z", fill: "url(#brassV)" });
    const pan = (side) => {
      const g = el(bal, "g");
      [-70, 0, 70].forEach((dx) => el(g, "line", { x1: 0, y1: 0, x2: dx, y2: 300, stroke: "#c9a66a", "stroke-width": 2 }));
      el(g, "path", { d: "M-110 300 Q0 360 110 300 Z", fill: "url(#brass)", filter: "url(#drop)" });
      el(g, "circle", { cx: 0, cy: 0, r: 7, fill: "url(#brass)" });
      if (side === "L") [["#6b2a1a", 0], ["#3e4a2a", 1], ["#2a3a5a", 2]].forEach(([c, k]) => el(g, "rect", { x: -70 + k * 6, y: 266 - k * 30, width: 140, height: 28, rx: 3, fill: c, stroke: "#d6b06a", "stroke-width": 1.5 }));
      else [0, 1, 2, 3].forEach((k) => el(g, "rect", { x: -64 + (k % 2) * 20, y: 268 - k * 26, width: 108, height: 24, rx: 11, fill: "url(#paper)", stroke: "#8a6e42", "stroke-width": 1.2 }));
      return g;
    };
    const pL = pan("L"), pR = pan("R");
    D.onFrame((t) => {
      if (t < 102.3 || t > 107) return;
      const a = 7 * Math.sin((t - 103.0) * 1.7) + 3 * Math.sin((t - 103.0) * 0.63 + 1);
      beam.setAttribute("transform", `rotate(${D.f(a)} 540 556)`);
      const rad = (a * Math.PI) / 180;
      pL.setAttribute("transform", `translate(${D.f(540 - 300 * Math.cos(rad))} ${D.f(556 - 300 * Math.sin(rad))})`);
      pR.setAttribute("transform", `translate(${D.f(540 + 300 * Math.cos(rad))} ${D.f(556 + 300 * Math.sin(rad))})`);
    });

    // 天平两边：两种"拿来训练"，一个叫合理使用，一个叫攻击（Lawfare《AI 模型蒸馏悖论》）
    D.text("用人写的书训练 AI：<br>法院判<span style='color:#f1d79c'>合理使用</span>", 260, 1090, { id: "bal-l", anchor: "center", cls: "note", style: "width:440px;left:40px;font-size:32px;white-space:normal;line-height:1.4;color:#efe5cf" });
    D.text("用 AI 的回答训练 AI：<br>却叫<span style='color:#ff7a62'>「攻击」</span>？", 820, 1090, { id: "bal-r", anchor: "center", cls: "note", style: "width:440px;left:600px;font-size:32px;white-space:normal;line-height:1.4;color:#efe5cf" });

    D.em = D.EM.colleague;
    D.cap("用自家模型当老师，|是各家的<em>常规操作</em>", S6, 95.72, { em: D.EM.ai });
    D.cap("可如果拿<em>别人家</em>的模型|当老师呢？", 95.72, 97.81);
    D.cap("没经允许这么做，|被叫作<em>「蒸馏攻击」</em>", 97.81, 99.9);
    D.cap("2026 年，美方指控中国公司大规模蒸馏，|中方称<em>毫无根据</em>", 99.9, 102.7);
    D.cap("目前还<em>没有定论</em>", 102.7, S7);

    D.step(() => {
      tl.fromTo("#warm", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power1.inOut", immediateRender: false }, 95.72);
      tl.to("#warm", { opacity: 0, duration: 1.2, ease: "power1.inOut" }, 103.0);
      tl.fromTo("#s6", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S6);
      tl.set("#tag-other", { opacity: 0 }, 0);
      tl.fromTo("#tag-own", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: false }, 93.8);
      tl.to("#tag-own", { scaleX: 0, svgOrigin: `${150 + tOwn.W / 2} ${tf.top + 143}`, duration: 0.15, ease: "power2.in" }, 95.57);
      tl.fromTo("#tag-other", { opacity: 1, scaleX: 0, svgOrigin: `${150 + tOwn.W / 2} ${tf.top + 143}` }, { opacity: 1, scaleX: 1, svgOrigin: `${150 + tOwn.W / 2} ${tf.top + 143}`, duration: 0.2, ease: "power2.out", immediateRender: false }, 95.72);
      tl.fromTo("#wax", { opacity: 0, scaleY: 0.2, svgOrigin: `540 ${tf.top - 40}` }, { opacity: 1, scaleY: 1, svgOrigin: `540 ${tf.top - 40}`, duration: 0.6, ease: "power2.out", immediateRender: false }, 96.25);
      tl.fromTo("#straws", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 97.81);
      tl.to("#s6", { opacity: 0, duration: 0.35 }, 99.7);
      tl.fromTo("#led-2", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 99.9);
      tl.fromTo("#led-3", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 100.97);
      [0, 1, 2, 3, 4, 5].forEach((k) => tl.to(["#led-2", "#led-3", "#seal-a2", "#seal-d"], { x: k % 2 ? -8 : 8, duration: 0.04, ease: "none" }, 102.04 + k * 0.04));
      tl.to(["#led-2", "#led-3", "#seal-a2", "#seal-d"], { x: 0, duration: 0.04 }, 102.28);
      tl.to(["#led-2", "#led-3"], { opacity: 0, duration: 0.3 }, 102.45);
      tl.fromTo("#balance", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 102.7);
      tl.fromTo("#bal-l", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, 102.9);
      tl.fromTo("#bal-r", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, 103.5);
      tl.to(["#bal-l", "#bal-r"], { opacity: 0, duration: 0.3 }, S7 - 0.3);
      tl.to("#balance", { opacity: 0, duration: 0.35 }, S7 - 0.3);
    });

    // ================= S7 网上的蒸馏 =================
    const SG = 110.61, SC = 114.85, SW = 118.5; // 吉卜力、同事.skill、一面墙
    D.year(S7, "2023");
    D.year(SG, "2025");
    D.year(SC, "2026");
    D.caseInfo(S7, SG, { place: "B 站 · AI 孙燕姿", en: "My AI", zh: "《我的AI》", by: "孙燕姿 · 2023", seal: "声" });
    D.caseInfo(SG, SC, { place: "全网 · 吉卜力风", en: "Introducing 4o Image Generation", zh: "《GPT-4o 图像生成》", by: "OpenAI · 2025", seal: "画" });
    D.caseInfo(SC, S8, { place: "上海 · 周天奕", en: "colleague.skill", zh: "《同事.skill》", by: "周天奕 · 2026", seal: "复" });

    // B：一面墙的 xx.skill（110.61 高点）
    const wallG = D.wrap(D.L.mid, "skill-wall", { opacity: 0 }, true);
    const WALL = [[C.colleague, "同事.skill"], [C.boss, "老板.skill"], [C.ex, "前任.skill"], [C.mentor, "导师.skill"], [C.self, "永生.skill", "蒸馏自己"], [C.nuwa, "女娲.skill", "专门造人"]];
    D.shelf(wallG, 90, 990, 860);
    D.shelf(wallG, 90, 990, 1300);
    const wallV = WALL.map(([c, n, sub], i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 240 + col * 300, yb = row ? 1300 : 860;
      const w = D.wrap(wallG, `sw-${i}`);
      const v = D.vial(w, `sw-${i}-v`, x, yb, 78, c, { level: 0.6 });
      D.label(w, x, yb + 30, n, c, { size: 30, sub });
      return { x, yb, v };
    });

    // C：声音、画风
    const sunG = D.wrap(D.L.mid, "sun", { opacity: 0 });
    const sunF = D.flask(sunG, 270, 700, 130, { level: 0.68, neck: 0.6, color: C.sun });
    const notes = el(sunF.lq, "g");
    // 液体里漂着音符和麦克风
    [[220, 690, 1.1, -12], [320, 720, 0.9, 10], [250, 770, 0.8, 6]].forEach(([x, y, k, r]) => {
      const n = el(notes, "g", { transform: `translate(${x} ${y}) rotate(${r}) scale(${k})`, fill: "#f6efe0", opacity: 0.92 });
      el(n, "ellipse", { cx: 0, cy: 0, rx: 13, ry: 10, transform: "rotate(-20)" });
      el(n, "rect", { x: 10, y: -52, width: 5, height: 52 });
      el(n, "path", { d: "M12 -52 C30 -46 34 -32 26 -20 C30 -34 22 -40 12 -40 Z" });
    });
    const mic = el(notes, "g", { transform: "translate(330 640) rotate(18)", opacity: 0.95 });
    el(mic, "rect", { x: -16, y: -40, width: 32, height: 52, rx: 16, fill: "#d9d2c4", stroke: "#6b6256", "stroke-width": 2 });
    el(mic, "rect", { x: -4, y: 12, width: 8, height: 34, fill: "#6b6256" });
    const sunV = D.vial(sunG, "sun-v", 760, 760, 64, C.sun, { level: 0.55 });
    D.label(sunG, 760, 790, "AI 孙燕姿 · 2023", C.sun, { size: 28 });
    const sunArc = el(sunG, "path", { d: `M310 ${sunF.top - 10} C400 470 700 480 760 ${D.f(sunV.top - 10)}`, fill: "none", stroke: C.sun, "stroke-width": 3, "stroke-dasharray": "10 12", opacity: 0.8 });

    const ghG = D.wrap(D.L.mid, "ghibli", { opacity: 0 });
    const ghF = D.flask(ghG, 270, 1180, 130, { level: 0.68, neck: 0.6, color: C.ghibli });
    // 液体里一张照片
    const ph = el(ghF.lq, "g", { transform: "translate(270 1190) rotate(-8)" });
    el(ph, "rect", { x: -56, y: -44, width: 112, height: 88, fill: "#f6efe0" });
    el(ph, "rect", { x: -48, y: -36, width: 96, height: 64, fill: "#7a8590" });
    el(ph, "circle", { cx: -10, cy: -14, r: 12, fill: "#c9bda5" });
    el(ph, "path", { d: "M-34 28 C-30 6 10 6 14 28 Z", fill: "#c9bda5" });
    const ghV = D.vial(ghG, "gh-v", 760, 1250, 64, C.ghibli, { level: 0.55 });
    D.label(ghG, 760, 1280, "吉卜力风 · 2025", C.ghibli, { size: 28 });
    // 滴出来变成一张吉卜力风的小画：蓝天、白云、绿草地、小人
    const pic = D.wrap(ghG, "gh-pic", { opacity: 0 }, true);
    const pg = el(pic, "g", { filter: "url(#drop)", transform: "rotate(5 760 1010)" });
    el(pg, "rect", { x: 670, y: 940, width: 180, height: 140, fill: "#f6efe0" });
    el(pg, "rect", { x: 680, y: 950, width: 160, height: 104, fill: "#8fd0f2" });
    el(pg, "ellipse", { cx: 730, cy: 975, rx: 26, ry: 12, fill: "#fffaf0" });
    el(pg, "ellipse", { cx: 790, cy: 985, rx: 20, ry: 9, fill: "#fffaf0" });
    el(pg, "path", { d: "M680 1030 C720 1010 790 1012 840 1026 V1054 H680 Z", fill: "#7ccb4a" });
    el(pg, "circle", { cx: 752, cy: 1016, r: 7, fill: "#3a2a1a" });
    el(pg, "path", { d: "M745 1022 H759 L762 1040 H742 Z", fill: "#e05a3a" });
    el(ghG, "path", { d: `M310 ${ghF.top - 10} C420 960 560 940 668 990`, fill: "none", stroke: C.ghibli, "stroke-width": 3, "stroke-dasharray": "10 12", opacity: 0.8 });

    // D：所有小瓶站成两排
    const allG = D.wrap(D.L.mid, "skill-all", { opacity: 0 });
    const ALL = [[C.colleague, "同事"], [C.boss, "老板"], [C.ex, "前任"], [C.mentor, "导师"], [C.self, "自己"], [C.sun, "声音"], [C.ghibli, "画风"], [C.ai, "模型"]];
    D.shelf(allG, 70, 1010, 820);
    D.shelf(allG, 70, 1010, 1250);
    const allV = ALL.map(([c, n], i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 180 + col * 240, yb = row ? 1250 : 820;
      const w = D.wrap(allG, `sa-${i}`);
      const inner = el(w, "g");
      D.vial(inner, `sa-${i}-v`, x, yb, 66, c, { level: 0.6 });
      D.label(w, x, yb + 30, n, c, { size: 30 });
      return { x, yb, id: `sa-${i}`, inner };
    });
    D.onFrame((t) => {
      if (t < 124 || t > 130) return;
      const k = D.win(t, 127.6, 129.4, 0.1);
      allV.forEach((v, i) => {
        const a = k * 5 * Math.sin((t - 127.6) * 14 + i) * Math.exp(-(t - 127.6) * 2.2);
        v.inner.setAttribute("transform", `rotate(${D.f(t > 127.6 ? a : 0)} ${v.x} ${v.yb})`);
      });
    });

    D.em = D.EM.colleague;
    D.cap("2023 年，网友复刻了一位歌手：|<em>AI 孙燕姿</em>", S7, SG, { em: D.EM.sun, note: "翻唱已超过 1000 首", noteAt: 107.3 });
    D.cap("2025 年，全网把照片|变成<em>吉卜力风</em>", SG, SC, { em: D.EM.ghibli });
    D.cap("2026 年 4 月，有人把<em>同事</em>|蒸馏成了一个文件", SC, SW, { note: "colleague.skill，开源 10 天 1 万+ 星", noteAt: 115.4 });
    D.cap("接着是老板、前任、导师、自己，|还有专门<em>造人</em>的女娲.skill", SW, 124.7);
    D.cap("模型、性格、声音、画风，|看起来都被<em>「蒸」</em>进了瓶子", 124.7, 127.6, { em: D.EM.gold });
    D.cap("可瓶子里装的，|真的<em>一样</em>吗？", 127.6, S8, { em: D.EM.gold });

    D.step(() => {
      tl.fromTo("#skill-wall", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, SW - 0.1);
      wallV.forEach((v, i) => tl.fromTo(`#sw-${i}`, { opacity: 0, scale: 0.3, svgOrigin: `${v.x} ${v.yb}` }, { opacity: 1, scale: 1, svgOrigin: `${v.x} ${v.yb}`, duration: 0.4, ease: "back.out(2)", immediateRender: true }, SW + i * D.BEAT));
      tl.to("#skill-wall", { opacity: 0, duration: 0.4 }, 124.4);
      tl.fromTo("#sun", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, S7);
      tl.fromTo(sunArc, { strokeDashoffset: 0 }, { strokeDashoffset: -88, duration: 8, ease: "none", immediateRender: false }, S7);
      tl.fromTo("#ghibli", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, SG);
      tl.to("#sun", { opacity: 0, duration: 0.35 }, SG);
      tl.fromTo("#gh-pic", { opacity: 0, scale: 0.4, svgOrigin: "760 1010" }, { opacity: 1, scale: 1, svgOrigin: "760 1010", duration: 0.45, ease: "back.out(1.8)", immediateRender: false }, 111.68);
      tl.to("#ghibli", { opacity: 0, duration: 0.35 }, SC - 0.3);
      tl.fromTo("#skill-all", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 124.6);
      allV.forEach((v, i) => tl.fromTo(`#${v.id}`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out", immediateRender: true }, 124.7 + i * 0.09));
      tl.to("#skill-all", { opacity: 0, duration: 0.35 }, S8 - 0.3);
    });
  };
})();
