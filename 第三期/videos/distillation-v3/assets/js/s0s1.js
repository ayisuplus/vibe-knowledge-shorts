// S0 钩子（0–10.69）· S1 片名（10.69–17.05）。开场装置在 S7（114.85 起）和 S9（148.86 起）复用。
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene01 = () => {
    const cam = D.wrap(D.L.mid, "cam-hook");
    const camIn = el(cam, "g", { transform: "translate(0 65)" }); // 让装置落在桌面线（y=1400）上
    const st = D.still(camIn, "still-hook", { color: C.colleague });
    D.hook = st;
    // 液体里漂着工牌和聊天气泡
    const stuff = D.wrap(st.inLiq, "hook-stuff");
    const bob = el(stuff, "g");
    D.badge(bob, 330, 960, -14);
    D.bubble(bob, 410, 870, "收到", { rot: 8 });
    D.bubble(bob, 395, 985, "我看下", { rot: -6, tail: "r" });
    D.bubble(bob, 245, 830, "这个需求不合理", { rot: -10, size: 22 });
    const tagT = D.tag(camIn, "tag-teacher", st.B.x - 34, st.neckTop + 60, 150, st.neckTop + 130, "同事", { rot: -5 });
    const tagS = D.tag(camIn, "tag-student", st.S.x - 18, st.S.y - st.S.r - 30, 520, 1290, "同事.skill", { rot: 3 });
    const tagY = D.tag(camIn, "tag-you", st.B.x - 34, st.neckTop + 60, 150, st.neckTop + 130, "你", { rot: -5 });
    const tagYS = D.tag(camIn, "tag-youskill", st.S.x - 18, st.S.y - st.S.r - 30, 560, 1290, "你.skill", { rot: 3 });

    // 右上木架：老板、前任、自己
    const shelfG = D.wrap(camIn, "hook-shelf");
    D.shelf(D.wrap(shelfG, "hook-plank"), 590, 955, 535);
    const HV = [[633, C.boss, "老板.skill"], [768, C.ex, "前任.skill"], [903, C.self, "自己.skill"]].map(([x, c, n], i) => {
      const w = D.wrap(shelfG, `hv-${i}`);
      const v = D.vial(w, `hv-${i}-v`, x, 535, 40, c, { level: 0.6 });
      D.label(w, x, 563, n, c, { size: 20 });
      return { x, v };
    });

    // 小瓶液面：每落一滴涨一点
    const SM = [[0, 0.16], [2.45, 0.16], [2.7, 0.22], [4.32, 0.22], [4.55, 0.28], [8.57, 0.28], [8.9, 0.36], [116.98, 0.36], [117.3, 0.44], [148.86, 0.44], [148.87, 0.08], [154.97, 0.08], [155.2, 0.16], [156.04, 0.16], [156.3, 0.24], [157.11, 0.24], [157.5, 0.36]];
    const FL = [[0, 1], [148.0, 1], [148.86, 0], [149.8, 1], [157.37, 1], [157.9, 0]];
    // S9：大瓶从空注满一瓶"数据"
    D.onFrame((t) => {
      const on = t < 11.6 || (t > 114.4 && t < 118.8) || t > 148.4;
      if (!on) return;
      const s9 = t > 148.4;
      const cs = { colA: s9 ? C.ai : C.colleague }; // S9：你的魂也是一瓶"数据"
      st.tick(t, { flame: D.keyed(FL, t), big: s9 ? D.keyed([[149.2, 0.97], [153.8, -0.3]], t) : -0.32, small: D.keyed(SM, t), gold: t > 150.9, drip: s9 ? cs.colA : null, ...cs });
      st.small.rect.setAttribute("fill", D.liq(s9 ? C.ai : C.colleague).bulb);
      st.small.ov.color(s9 ? C.ai : C.colleague);
      bob.setAttribute("transform", `translate(${D.f(Math.sin(t * 0.9) * 6)} ${D.f(Math.sin(t * 1.3) * 8)})`);
      tagT.swing(t, 2.18);
      tagS.swing(t, 4.32);
      tagY.swing(t, 148.9);
      tagYS.swing(t, 149.4);
      const pulse = D.win(t, 8.57, 10.4, 0.15);
      HV.forEach(({ v }) => v.halo.setAttribute("opacity", D.f(0.55 + 0.45 * pulse)));
    });
    st.dropAt(2.45);
    st.dropAt(4.32);
    st.dropAt(8.57);
    st.dropAt(116.98);

    D.em = D.EM.colleague;
    D.cap("同事<em>离职</em>了", 0.06, 2.45);
    D.cap("但他的<em>魂</em>，被蒸进了一个文件", 2.45, 6.41);
    D.cap("老板、前任，|甚至<em>自己</em>，都能蒸", 6.41, 10.69);

    D.step(() => {
      tl.fromTo("#cam-hook", { scale: 1, svgOrigin: "540 960" }, { scale: 1.04, svgOrigin: "540 960", duration: 6.4, ease: "none", immediateRender: true }, 0);
      tl.set(["#tag-teacher", "#tag-student", "#tag-you", "#tag-youskill"], { opacity: 0 }, 0);
      tl.to("#tag-teacher", { opacity: 1, duration: 0.15 }, 2.18);
      tl.to("#tag-student", { opacity: 1, duration: 0.15 }, 4.32);
      tl.fromTo("#hook-plank", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, 6.15);
      [6.41, 7.48, 8.01].forEach((tt, i) => tl.fromTo(`#hv-${i}`, { opacity: 0, scale: 0.3, svgOrigin: `${HV[i].x} 535` }, { opacity: 1, scale: 1, svgOrigin: `${HV[i].x} 535`, duration: 0.4, ease: "back.out(2.2)", immediateRender: true }, tt - 0.1));
      tl.to("#cam-hook", { opacity: 0, duration: 0.6, ease: "power2.in" }, 10.5);
      // S7：回到同事的装置
      tl.fromTo("#cam-hook", { opacity: 0, scale: 1.0 }, { opacity: 1, scale: 1.0, svgOrigin: "540 960", duration: 0.5, ease: "power2.out", immediateRender: false }, 114.85);
      tl.to("#cam-hook", { opacity: 0, duration: 0.3 }, 118.2);
      tl.set("#hook-shelf", { opacity: 0 }, 114.0); // S7 里木架让给剪报
      tl.set("#hook-shelf", { opacity: 1 }, 118.6);
      // S9：换成"你"
      tl.set(["#hook-stuff", "#hook-shelf", "#tag-teacher", "#tag-student"], { opacity: 0 }, 148.86);
      tl.set(["#tag-you", "#tag-youskill"], { opacity: 1 }, 148.86);
    });

    // ---------------- S1 片名：恐怖谷人脸 + 被抽走的魂 ----------------
    // 背景图由 Codex CLI 的图像生成画出（02-风格样张-v4/gen/bg-face-scythe.png）
    const soul = D.wrap(D.L.bg, "soul-bg", { opacity: 0 });
    const soulImg = D.wrap(soul, "soul-img", {}, true);
    el(soulImg, "image", { href: "assets/img/soul.jpg", x: 0, y: 120, width: 1080, height: 1620, preserveAspectRatio: "xMidYMid slice" });
    const sh = el(D.defsEl, "linearGradient", { id: "soulShade", x1: 0, y1: 0, x2: 0, y2: 1 });
    [[0, 1], [0.065, 1], [0.13, 0.55], [0.28, 0], [0.62, 0], [0.8, 0.85], [1, 1]].forEach(([o, a]) => el(sh, "stop", { offset: o, "stop-color": "#0b0806", "stop-opacity": a }));
    el(soul, "rect", { x: 0, y: 0, width: 1080, height: 1920, fill: "url(#soulShade)" });
    // 额头上方往上飘的魂（几颗冷金色的光点）
    const wisp = [];
    const wg = el(soul, "g");
    for (let i = 0; i < 16; i++) wisp.push({ el: el(wg, "circle", { r: 2 + D.hash(i) * 3, fill: i % 3 ? "#f1d79c" : "#ffe9b8", filter: "url(#softGlow)", opacity: 0 }), ph: D.hash(i * 7), sp: 0.18 + D.hash(i * 3) * 0.15, dx: (D.hash(i * 11) - 0.5) * 60 });
    D.onFrame((t) => {
      const on = (t > 10.4 && t < 17.3) || t > 157.2;
      for (const w of wisp) {
        if (!on) { w.el.setAttribute("opacity", 0); continue; }
        const u = (t * w.sp + w.ph) % 1;
        w.el.setAttribute("cx", D.f(540 + Math.sin(u * 7 + w.ph * 6) * 26 + w.dx * u));
        w.el.setAttribute("cy", D.f(760 - u * 620));
        w.el.setAttribute("opacity", D.f(Math.sin(Math.PI * u) * 0.85));
      }
    });

    D.text("SPIRITUS", 540, 150, { id: "t-latin", anchor: "center", cls: "latin" });
    D.text("蒸馏", 540, 190, { id: "t-title", anchor: "center", cls: "title", style: "left:0;right:0;width:auto" });
    const SHE = [..."AI摄魂术"].map((ch, i) => `<span id="she-${i}" style="display:inline-block">${ch}</span>`).join("");
    D.text(SHE, 540, 1290, { id: "t-she", anchor: "center", style: "font-size:120px;font-weight:900;letter-spacing:30px;padding-left:30px;color:#f6e6c2;text-shadow:0 0 30px rgba(241,215,156,.45),0 0 4px rgba(241,215,156,.6)" });
    D.cap("化学的、AI 的、网上的：|它们<em>摄走了什么</em>？", 12.82, 17.05, { em: D.EM.gold });

    D.step(() => {
      const T = 10.69;
      tl.fromTo("#soul-bg", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power2.out", immediateRender: false }, T - 0.1);
      tl.fromTo("#soul-img", { scale: 1.0, x: 0, y: 0 }, { scale: 1.06, x: -32, y: -58, duration: 6.6, ease: "none", immediateRender: false }, T - 0.1);
      tl.to("#soul-bg", { opacity: 0, duration: 0.5 }, 16.6);
      tl.fromTo("#t-title", { opacity: 1, clipPath: "inset(0% 100% 0% 0%)", scale: 1.04 }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 0.9, ease: "power2.inOut", immediateRender: false }, T);
      tl.fromTo("#t-latin", { opacity: 0, letterSpacing: "26px" }, { opacity: 1, letterSpacing: "14px", duration: 1.0, ease: "power2.out", immediateRender: false }, T + 0.2);
      tl.fromTo("#t-she", { opacity: 1 }, { opacity: 1, duration: 0.01, immediateRender: false }, 11.8);
      [0, 1, 2, 3, 4].forEach((i) => tl.fromTo(`#she-${i}`, { opacity: 0, filter: "blur(10px)", y: -10 }, { opacity: 1, filter: "blur(0px)", y: 0, duration: 0.45, ease: "power2.out", immediateRender: true }, 11.8 + i * D.BEAT / 2));
      tl.to(["#t-title", "#t-latin", "#t-she"], { opacity: 0, duration: 0.45, ease: "power1.in" }, 16.55);
      // 片尾再浮现一次（淡）
      tl.fromTo("#soul-bg", { opacity: 0 }, { opacity: 0.45, duration: 1.0, ease: "power1.inOut", immediateRender: false }, 157.5);
    });
  };
})();
