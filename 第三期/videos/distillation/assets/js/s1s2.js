// S1 开场（0–10.69）：你以为的蒸馏 → 6.43 变形 → 实际上的蒸馏
// S2 片名（10.69–17.05）
(function () {
  const D = window.D, C = D.C, tl = D.tl;

  D.scene12 = () => {
    const st = D.buildStill(D.L.mid);
    D.still = st;

    // ---- 标题（HTML，带故障副本） ----
    D.text(D.glitchStack("你以为的蒸馏"), 540, 150, null, null, { id: "t-think", anchor: "center", cls: "title" });
    D.text(D.glitchStack("实际上的蒸馏"), 540, 150, null, null, { id: "t-real", anchor: "center", cls: "title" });
    D.text("", 540, 312, null, null, { id: "t-rule", anchor: "center", cls: "rule" });

    D.step(() => {
      // 0.06：标题砸下
      tl.fromTo("#t-think", { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.32, ease: "power4.out", immediateRender: true }, 0.06);
      tl.fromTo("#t-rule", { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: "power3.out", immediateRender: true }, 0.2);
      // 装置：第 0 帧就在，缓慢推近
      tl.fromTo("#still-cam", { scale: 1.0, svgOrigin: "540 1000" }, { scale: 1.045, svgOrigin: "540 1000", duration: 6.4, ease: "none", immediateRender: true }, 0);
      tl.fromTo("#still", { opacity: 1 }, { opacity: 1, duration: 0.01, immediateRender: true }, 0);
      // 标签按拍弹出
      [2.18, 2.71, 3.25, 3.78, 4.32].forEach((t, i) => {
        const L = st.labels[i];
        tl.fromTo(`#${L.id}`, { opacity: 0, scale: 0.4, svgOrigin: `${L.px} ${L.py}` }, { opacity: 1, scale: 1, svgOrigin: `${L.px} ${L.py}`, duration: 0.3, ease: "back.out(2.4)", immediateRender: true }, t);
      });
      tl.fromTo("#st-level", { y: 18 }, { y: 0, duration: 4.0, ease: "power1.out", immediateRender: true }, 2.45);
    });
    D.glitch("#t-think", 0.06, 0.3, 26);
    st.dropAt("drop-1", 2.45);
    st.dropAt("drop-2", 4.32);

    // ---- 6.43 变形 ----
    const net = D.buildNet(D.L.mid, { id: "teacher" });
    const beamW = D.wrap(D.L.mid, "beam");
    D.el(beamW, "line", { x1: 540, y1: 830, x2: 540, y2: 1262, stroke: C.holo, "stroke-width": 18, opacity: 0.18 });
    D.el(beamW, "line", { x1: 540, y1: 830, x2: 540, y2: 1262, stroke: C.holo, "stroke-width": 3.5, filter: "url(#glow)" });
    const pulseW = D.wrap(D.L.mid, "beam-pulse", { opacity: 0 });
    D.el(pulseW, "path", { d: "M540 820 C556 846 558 862 540 870 C522 862 524 846 540 820 Z", fill: C.ice, filter: "url(#glowL)" });
    D.buildCrystal(D.L.mid, "student", 62);
    const burst = D.wrap(D.L.mid, "student-burst", { opacity: 0 });
    D.el(burst, "circle", { cx: 540, cy: 1340, r: 90, fill: "none", stroke: C.ice, "stroke-width": 3 });
    D.el(burst, "circle", { cx: 540, cy: 1340, r: 150, fill: "none", stroke: C.holo, "stroke-width": 2, opacity: 0.6 });
    const flash = D.wrap(D.L.front, "flash", { opacity: 0 });
    D.el(flash, "rect", { x: 0, y: 0, width: 1080, height: 1920, fill: C.holo });

    D.text("大模型", 600, 850, null, null, { id: "lb-big", cls: "tag" });
    D.text("小模型", 650, 1312, null, null, { id: "lb-small", cls: "tag" });

    const T = 6.43;
    D.step(() => {
      // 标题切换
      tl.to("#t-think", { opacity: 0, duration: 0.08 }, T);
      tl.fromTo("#t-real", { opacity: 0 }, { opacity: 1, duration: 0.05, immediateRender: true }, T);
      tl.fromTo(["#flash"], { opacity: 0.32 }, { opacity: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, T);
      // 装置散掉：架子先走，烧瓶缩进老师出现的位置，接收瓶缩成晶体
      tl.to(["#st-frame", "#st-lamp", "#st-flame", "#st-head"], { opacity: 0, duration: 0.3, ease: "power2.in" }, T);
      tl.to(st.labels.map((l) => `#${l.id}`), { opacity: 0, duration: 0.2 }, T);
      tl.to("#st-flask", { opacity: 0, scale: 0.6, svgOrigin: "700 840", duration: 0.55, ease: "power3.in" }, T);
      tl.to("#st-cond", { opacity: 0, duration: 0.5, ease: "power2.in" }, T + 0.1);
      tl.to("#st-recv", { x: 370, y: -150, scale: 0.35, svgOrigin: "170 1450", smoothOrigin: false, opacity: 0, duration: 0.8, ease: "power3.inOut" }, T);
      tl.set("#still", { opacity: 0 }, T + 0.95);
      // 老师从烧瓶里长出来
      tl.fromTo("#teacher", { x: 700, y: 700, scale: 0.22, opacity: 0 }, { x: 540, y: 420, scale: 1, opacity: 1, duration: 1.15, ease: "power3.out", immediateRender: true }, T + 0.05);
      // 光束从上往下画出来
      tl.fromTo("#beam", { scaleY: 0, opacity: 1, svgOrigin: "540 830" }, { scaleY: 1, opacity: 1, svgOrigin: "540 830", duration: 0.7, ease: "power3.out", immediateRender: true }, T + 0.5);
      // 晶体弹出
      tl.fromTo("#student", { x: 540, y: 1340, scale: 0, opacity: 0 }, { x: 540, y: 1340, scale: 1, opacity: 1, duration: 0.55, ease: "back.out(2)", immediateRender: true }, T + 0.95);
      tl.fromTo("#student-in", { rotation: 0 }, { rotation: 0, duration: 0.01, immediateRender: true }, 0);
      // 8.57：一滴光落进晶体
      tl.fromTo("#beam-pulse", { opacity: 0, y: 0 }, { opacity: 1, duration: 0.08, immediateRender: false }, 8.07);
      tl.fromTo("#beam-pulse", { y: 0 }, { y: 430, duration: 0.5, ease: "power2.in", immediateRender: false }, 8.07);
      tl.set("#beam-pulse", { opacity: 0 }, 8.57);
      tl.fromTo("#student-core", { opacity: 0 }, { opacity: 0.9, duration: 0.12, immediateRender: false }, 8.57);
      tl.to("#student-core", { opacity: 0.35, duration: 1.2, ease: "power2.out" }, 8.69);
      tl.fromTo("#student-burst", { opacity: 1, scale: 0.4, svgOrigin: "540 1340" }, { opacity: 0, scale: 1.8, svgOrigin: "540 1340", duration: 0.9, ease: "power2.out", immediateRender: false }, 8.57);
      tl.fromTo("#lb-big", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", immediateRender: true }, 8.57);
      tl.fromTo("#lb-small", { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.35, ease: "power3.out", immediateRender: true }, 9.1);
    });
    D.glitch("#t-real", T, 0.4, 30);

    // ---- S2 片名 10.69 ----
    const S2 = 10.69;
    D.text(D.glitchStack("模型蒸馏"), 540, 700, null, null, { id: "t-main", anchor: "center", cls: "hero" });
    D.text("大模型，是怎么被「蒸」成小模型的？", 540, 930, null, null, { id: "t-sub", anchor: "center", cls: "heroSub" });
    D.text("Gemma、Llama、DeepSeek 都发布过蒸馏出来的小模型", 540, 1030, null, null, { id: "t-sub2", anchor: "center", cls: "heroNote" });
    D.step(() => {
      tl.to(["#t-real", "#t-rule", "#lb-big", "#lb-small"], { opacity: 0, duration: 0.3 }, S2 - 0.1);
      tl.to("#teacher", { x: 540, y: 1150, scale: 0.8, opacity: 0.32, duration: 1.0, ease: "power3.inOut" }, S2 - 0.1);
      tl.to(["#beam", "#student"], { opacity: 0, duration: 0.5 }, S2 - 0.1);
      tl.fromTo("#t-main", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out", immediateRender: true }, S2);
      tl.fromTo("#t-sub", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, S2 + 0.53);
      tl.fromTo("#t-sub2", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, 12.82);
      tl.to(["#t-main", "#t-sub", "#t-sub2"], { opacity: 0, duration: 0.3, ease: "power1.in" }, 16.8);
    });
    D.glitch("#t-main", S2, 0.3, 24);
    D.ghost("蒸馏", 0, 10.6, { y: 1080, size: 400, op: 0.04 });
    D.ghost("DISTILL", 10.69, 17.05, { y: 560, size: 230, op: 0.06, mono: true });

    D.net = net;
  };
})();
