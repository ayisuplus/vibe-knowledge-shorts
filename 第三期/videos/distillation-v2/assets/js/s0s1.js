// S0 开场（0–10.69）· S1 片名（10.69–17.05）。开场装置在 S9（148.86 起）复用。
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene01 = () => {
    const cam = D.wrap(D.L.mid, "cam-hook");
    const camIn = el(cam, "g", { transform: "translate(0 65)" }); // 让装置落在桌面线（y=1400）上
    const st = D.still(camIn, "still-hook", {});
    D.hook = st;
    const tagT = D.tag(camIn, "tag-teacher", st.B.x - 34, st.neckTop + 60, 90, st.neckTop + 130, "老师 · 大模型", { rot: -5 });
    const tagS = D.tag(camIn, "tag-student", st.S.x - 18, st.S.y - st.S.r - 30, 560, 1280, "学生 · 小模型", { rot: 3 });

    // 小瓶液面：每落一滴涨一点（S9 继续）
    const SM = [[0, 0.16], [2.45, 0.16], [2.7, 0.22], [4.32, 0.22], [4.55, 0.28], [8.57, 0.28], [8.9, 0.36], [154.97, 0.36], [155.2, 0.42], [156.04, 0.42], [156.3, 0.48], [157.11, 0.48], [157.5, 0.58]];
    const FL = [[0, 1], [148.0, 1], [148.86, 0], [149.8, 1], [157.37, 1], [157.9, 0]];
    D.onFrame((t) => {
      if (!(t < 11.6 || t > 148.4)) return;
      st.tick(t, { flame: D.keyed(FL, t), big: 0.05, small: D.keyed(SM, t), gold: t > 150.9 });
      tagT.swing(t, t < 100 ? 2.18 : 148.9);
      tagS.swing(t, t < 100 ? 4.32 : 149.4);
    });
    st.dropAt(2.45);
    st.dropAt(4.32);
    st.dropAt(8.57, { gold: true });

    D.cap("大模型很<em>聪明</em>，但又大又贵", 0.06, 5.39);
    D.cap("它的本事，能<em>「蒸」</em>进一个小瓶子里吗？", 5.39, 10.69);

    D.step(() => {
      tl.fromTo("#cam-hook", { scale: 1, svgOrigin: "540 960" }, { scale: 1.04, svgOrigin: "540 960", duration: 6.4, ease: "none", immediateRender: true }, 0);
      tl.set(["#tag-teacher", "#tag-student"], { opacity: 0 }, 0);
      tl.to("#tag-teacher", { opacity: 1, duration: 0.15 }, 2.18);
      tl.to("#tag-student", { opacity: 1, duration: 0.15 }, 4.32);
      tl.to("#cam-hook", { opacity: 0, duration: 0.6, ease: "power2.in" }, 10.5);
    });

    // ---------------- S1 片名 ----------------
    const rays = D.wrap(D.L.bg, "title-rays", { opacity: 0 });
    const rin = el(rays, "g");
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; el(rin, "line", { x1: 540, y1: 850, x2: 540 + Math.cos(a) * 1000, y2: 850 + Math.sin(a) * 1000, stroke: "url(#goldFade)", "stroke-width": i % 3 ? 1 : 2 }); }
    el(rays, "ellipse", { cx: 540, cy: 860, rx: 460, ry: 300, fill: "url(#glowWarm)", opacity: 0.35 });
    D.onFrame((t) => { if (t > 10 && t < 17.5) rin.setAttribute("transform", `rotate(${D.f((t - 10) * 1.6)} 540 850)`); });
    const lineG = D.wrap(D.L.mid, "title-line", { opacity: 0 });
    const lp = el(lineG, "path", { d: "M150 1170 H330 M330 1170 C300 1170 290 1130 300 1110 C320 1070 370 1060 390 1090 L392 1030 L408 1030 L410 1090 C430 1060 480 1070 500 1110 C510 1130 500 1170 470 1170 M408 1045 L700 1130 L700 1150 C690 1150 680 1170 700 1170 C720 1170 712 1150 700 1150 M700 1170 H930", fill: "none", stroke: C.gold, "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" });
    const len = lp.getTotalLength();
    lp.setAttribute("stroke-dasharray", D.f(len));
    const lineDot = el(lineG, "circle", { cx: 700, cy: 1163, r: 4, fill: C.goldHi, opacity: 0 });

    D.text("DE · DISTILLATIONE", 540, 610, { id: "t-latin", anchor: "center", cls: "latin" });
    D.text("蒸馏", 540, 680, { id: "t-title", anchor: "center", cls: "title", style: "left:0;right:0;width:auto" });
    D.text("大模型，如何把本事传给小模型", 540, 1220, { id: "t-lead", anchor: "center", cls: "lead" });
    D.text("— on knowledge distillation —", 540, 1298, { id: "t-gi", anchor: "center", cls: "gi" });

    D.step(() => {
      const T = 10.69;
      tl.fromTo("#title-rays", { opacity: 0 }, { opacity: 0.25, duration: 1.0, immediateRender: false }, T);
      tl.to("#title-rays", { opacity: 0, duration: 0.5 }, 16.6);
      tl.fromTo("#t-title", { opacity: 1, clipPath: "inset(0% 100% 0% 0%)", scale: 1.04 }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.9, ease: "power2.inOut", immediateRender: false }, T);
      tl.fromTo("#t-latin", { opacity: 0, letterSpacing: "26px" }, { opacity: 1, letterSpacing: "14px", duration: 1.0, ease: "power2.out", immediateRender: false }, T + 0.2);
      tl.fromTo("#title-line", { opacity: 1 }, { opacity: 1, duration: 0.01, immediateRender: false }, 11.2);
      tl.fromTo(lp, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", immediateRender: true }, 11.2);
      tl.fromTo(lineDot, { opacity: 0, scale: 0.2, svgOrigin: "700 1163" }, { opacity: 1, scale: 1, svgOrigin: "700 1163", duration: 0.4, ease: "back.out(2)", immediateRender: false }, 12.75);
      tl.fromTo("#t-lead", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 12.82);
      tl.fromTo("#t-gi", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, 13.35);
      tl.to(["#t-title", "#t-latin", "#t-lead", "#t-gi", "#title-line"], { opacity: 0, duration: 0.45, ease: "power1.in" }, 16.55);
    });
  };
})();
