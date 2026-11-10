// S8 争议（121.23–148.86） · S9 收尾（148.86–160.17）
(function () {
  const D = window.D, C = D.C, tl = D.tl;
  const RED = C.alert, PALE = "#ffe7e2";

  D.scene89 = () => {
    const S8 = 121.23, S9 = 148.86;

    // ---- 红色老师 + 警戒框 ----
    const tr = D.buildNet(D.L.mid, { id: "teacher-red", color: RED, seed: 4, lineOp: 0.26 });
    const warn = D.wrap(D.L.mid, "warn", { opacity: 0 });
    D.el(warn, "rect", { x: 80, y: 205, width: 920, height: 500, fill: "rgba(255,77,58,0.04)", stroke: RED, "stroke-width": 2, "stroke-dasharray": "14 10", opacity: 0.7 });
    D.brackets(warn, 80, 205, 920, 500, { color: RED, len: 40, sw: 3.5 });
    D.text("老师模型", 100, 222, null, null, { id: "lb-tr", cls: "tag small red" });

    // 红色扫描线（主题切换）
    D.html.hud.push(`<div id="redsweep" class="redsweep"></div>`);

    // ---- 服务条款弹窗 ----
    const tos = D.wrap(D.L.front, "tos", { opacity: 0 });
    const tosIn = D.g(tos, { transform: "translate(-692 -432) scale(1.7)" });
    D.el(tosIn, "rect", { x: 500, y: 760, width: 450, height: 250, rx: 10, fill: "rgba(30,6,4,0.85)", stroke: RED, "stroke-width": 2.5, filter: "url(#glowS)" });
    D.el(tosIn, "rect", { x: 500, y: 760, width: 450, height: 54, rx: 10, fill: RED, opacity: 0.85 });
    D.el(tosIn, "text", { x: 530, y: 798, "font-size": 30, "font-weight": 800, fill: "#1a0402", "font-family": "DSans" }, "服务条款");
    D.el(tosIn, "path", { d: "M560 850 L600 920 L520 920 Z", fill: "none", stroke: RED, "stroke-width": 4, "stroke-linejoin": "round" });
    D.el(tosIn, "text", { x: 560, y: 912, "text-anchor": "middle", "font-size": 40, "font-weight": 900, fill: RED, "font-family": "DSans" }, "!");
    for (let j = 0; j < 5; j++) D.el(tosIn, "line", { x1: 630, y1: 850 + j * 28, x2: j === 4 ? 800 : 920, y2: 850 + j * 28, stroke: PALE, "stroke-width": 3, opacity: 0.6 });

    // ---- 一大片账号，从老师身上抽线 ----
    const accW = D.wrap(D.L.mid, "accounts", { opacity: 0 });
    const r = D.rng(77), acc = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 30; i++) {
      const x = 80 + i * (920 / 29) + (j % 2) * 15 - 8, y = 800 + j * 26;
      acc.push([x, y]);
      D.el(accW, "circle", { cx: x, cy: y - 5, r: 4, fill: PALE, opacity: 0.55 + r() * 0.4 });
      D.el(accW, "path", { d: `M${D.f(x - 7)} ${y + 8} Q${D.f(x)} ${y - 2} ${D.f(x + 7)} ${y + 8}`, stroke: PALE, "stroke-width": 2, fill: "none", opacity: 0.5 });
    }
    const bottom = tr.pts[tr.pts.length - 1];
    const threads = [], thG = D.g(accW, { stroke: RED, "stroke-width": 1.2, fill: "none" });
    for (let k = 0; k < 110; k++) {
      const a = acc[Math.floor(r() * acc.length)], b = bottom[Math.floor(r() * bottom.length)];
      const bx = 540 + b.x, by = 260 + b.y;
      const p = D.el(thG, "path", { d: `M${D.f(bx)} ${D.f(by)} C${D.f(bx)} ${D.f(by + 90)} ${D.f(a[0])} ${D.f(a[1] - 120)} ${D.f(a[0])} ${D.f(a[1] - 14)}`, opacity: 0.12 + r() * 0.35 });
      threads.push(p);
    }
    const dotG = D.g(accW, { fill: C.heat, filter: "url(#glowS)" });
    const dots = Array.from({ length: 46 }, (_, k) => {
      const p = threads[k * 2], L = p.getTotalLength();
      return { p, L, el: D.el(dotG, "circle", { cx: 0, cy: 0, r: 3.2 }), ph: D.hash(k * 3) };
    });
    D.onFrame((t) => {
      if (t < 129.5 || t > 136.5) return;
      for (const d of dots) { const u = (d.ph + t * 0.45) % 1; const pt = d.p.getPointAtLength(d.L * (1 - u)); d.el.setAttribute("cx", D.f(pt.x)); d.el.setAttribute("cy", D.f(pt.y)); }
    });

    // ---- 数字卡 ----
    D.text(
      `<span class="pill">2026 年 2 月</span><div class="row"><b class="num" id="num-1600">0</b><b class="unit">万+</b><em>次对话</em></div><span class="l2">来自约 2.4 万个账号</span><span class="l3">以上为指控方单方说法</span>`,
      70, 1070, null, null, { id: "card-1", cls: "rcard" }
    );
    D.onFrame((t) => {
      if (t < 132.3 || t > 136.5) return;
      const el = document.getElementById("num-1600"); if (el) el.textContent = String(Math.round(1600 * D.ease.out(D.clamp((t - 132.66) / 0.7))));
    });
    D.text(`<span class="pill">2026 年 4 月 · 美国白宫备忘录</span><span class="l1">存在主要来自中国的「工业规模」蒸馏行动</span>`, 70, 900, null, null, { id: "card-2", cls: "rcard wide" });
    D.text(`<span class="l1">中国大使馆：毫无根据</span>`, 70, 1210, null, null, { id: "card-3", cls: "ccard" });

    // ---- 悖论：上下两半 ----
    const para = D.wrap(D.L.mid, "para", { opacity: 0 });
    const halfA = D.wrap(para, "para-a"), halfB = D.wrap(para, "para-b");
    // 上：一摞书 → 模型（青）
    for (let k = 0; k < 5; k++) {
      const y = 600 - k * 46;
      D.el(halfA, "rect", { x: 120 + (k % 2) * 14, y, width: 220, height: 40, rx: 4, fill: "rgba(232,253,255,0.08)", stroke: C.ice, "stroke-width": 2 });
      D.el(halfA, "line", { x1: 150 + (k % 2) * 14, y1: y + 6, x2: 150 + (k % 2) * 14, y2: y + 34, stroke: C.holo, "stroke-width": 3 });
    }
    D.el(halfA, "path", { d: "M370 520 H640", ...D.stroke({ "stroke-width": 4, "stroke-dasharray": "12 10" }) });
    D.el(halfA, "path", { d: "M626 504 L648 520 L626 536", ...D.stroke({ "stroke-width": 4 }) });
    D.buildNet(halfA, { id: "mini-a", h: 170, w: 300, layers: [6, 10, 10, 6], seed: 8, nodeR: 4 });
    // 下：一串对话气泡 → 模型（红）
    for (let k = 0; k < 4; k++) {
      const y = 1000 + k * 64, x = 120 + (k % 2) * 60;
      D.el(halfB, "rect", { x, y, width: 200, height: 48, rx: 22, fill: "rgba(255,77,58,0.08)", stroke: k % 2 ? RED : PALE, "stroke-width": 2 });
      D.el(halfB, "line", { x1: x + 24, y1: y + 24, x2: x + 150, y2: y + 24, stroke: k % 2 ? RED : PALE, "stroke-width": 3, opacity: 0.6 });
    }
    D.el(halfB, "path", { d: "M400 1120 H640", ...D.stroke({ stroke: RED, "stroke-width": 4, "stroke-dasharray": "12 10" }) });
    D.el(halfB, "path", { d: "M626 1104 L648 1120 L626 1136", ...D.stroke({ stroke: RED, "stroke-width": 4 }) });
    D.buildNet(halfB, { id: "mini-b", h: 170, w: 300, layers: [6, 10, 10, 6], seed: 9, nodeR: 4, color: RED });
    D.el(para, "line", { x1: 80, y1: 860, x2: 1000, y2: 860, stroke: PALE, "stroke-width": 1.5, opacity: 0.35 });
    D.text("用人写的书训练 AI，叫合理使用", 540, 700, null, null, { id: "para-ta", anchor: "center", cls: "paraT" });
    D.text("用 AI 的回答训练 AI，却叫攻击？", 540, 1300, null, null, { id: "para-tb", anchor: "center", cls: "paraT red" });

    D.cap("如果老师没同意呢？", S8, 125.48, { cls: "big" });
    D.cap("蒸馏本身各家都在用，争议在于：没经允许，拿别人的模型当老师", 125.48, 129.73);
    D.cap("一家美国 AI 公司称：", 129.73, 136.12);
    D.cap("有人质疑：", 140.37, 146.74, { sub: "Lawfare《AI 模型蒸馏悖论》", subAt: 140.8 });
    D.cap("目前还没有定论", 146.74, S9);
    D.ghost("?", S8, 129.6, { y: 1450, size: 900, op: 0.08, color: RED, mono: true });
    D.ghost("1600万", 129.73, 136.0, { y: 1500, size: 280, op: 0.05, color: RED, x: 560 });

    D.step(() => {
      // 121.23 红色扫描线刷过，主题转红
      tl.fromTo("#redsweep", { y: -40, opacity: 1 }, { y: 1960, opacity: 1, duration: 0.7, ease: "power1.in", immediateRender: true }, S8);
      tl.set("#redsweep", { opacity: 0 }, S8 + 0.7);
      tl.fromTo("#redfill", { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power1.in", immediateRender: true }, S8);
      tl.to(["#bg-particles", "#bg-grid", "#bg-bloom"], { opacity: 0.25, duration: 0.7 }, S8);
      tl.fromTo("#teacher-red", { x: 540, y: 260, scale: 1, opacity: 0 }, { x: 540, y: 260, scale: 1, opacity: 1, duration: 0.5, immediateRender: true }, S8 + 0.2);
      tl.fromTo("#warn", { opacity: 0, scale: 1.08, svgOrigin: "540 455" }, { opacity: 1, scale: 1, svgOrigin: "540 455", duration: 0.35, ease: "power3.out", immediateRender: true }, S8 + 0.45);
      tl.fromTo("#lb-tr", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, S8 + 0.6);
      tl.fromTo("#warn", { opacity: 1 }, { opacity: 0.55, duration: D.BEAT, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }, S8 + 0.8);
      // 125.48 服务条款
      tl.fromTo("#tos", { opacity: 0, scale: 0.6, svgOrigin: "540 1072" }, { opacity: 1, scale: 1, svgOrigin: "540 1072", duration: 0.35, ease: "back.out(2)", immediateRender: true }, 125.48);
      tl.to("#tos", { opacity: 0, duration: 0.25 }, 129.5);
      // 129.73 账号
      tl.to("#warn", { opacity: 0, duration: 0.3 }, 129.6);
      tl.fromTo("#accounts", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", immediateRender: true }, 129.73);
      tl.fromTo("#card-1", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out", immediateRender: true }, 132.4);
      tl.fromTo("#card-1 .row", { scale: 1.25 }, { scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: true }, 132.66);
      // 136.12 白宫备忘录 / 大使馆
      tl.to(["#accounts", "#card-1"], { opacity: 0, duration: 0.3 }, 135.95);
      tl.fromTo("#card-2", { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, 136.12);
      tl.fromTo("#card-3", { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.4, ease: "power3.out", immediateRender: true }, 138.24);
      [0, 1, 2, 3, 4, 5].forEach((k) => tl.to(["#card-2", "#card-3"], { x: k % 2 ? -10 : 10, duration: 0.04, ease: "none" }, 140.1 + k * 0.04));
      tl.to(["#card-2", "#card-3"], { x: 0, duration: 0.04 }, 140.34);
      // 140.37 悖论
      tl.to(["#card-2", "#card-3", "#teacher-red", "#lb-tr"], { opacity: 0, duration: 0.3 }, 140.3);
      tl.fromTo("#para", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, 140.37);
      tl.fromTo("#para-a", { opacity: 0, y: -30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, 140.37);
      tl.fromTo("#mini-a", { x: 790, y: 440 }, { x: 790, y: 440, duration: 0.01, immediateRender: true }, 0);
      tl.fromTo("#mini-b", { x: 790, y: 1040 }, { x: 790, y: 1040, duration: 0.01, immediateRender: true }, 0);
      tl.fromTo("#para-ta", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, immediateRender: true }, 140.6);
      tl.fromTo("#para-b", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, 142.49);
      tl.fromTo("#para-tb", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, immediateRender: true }, 142.7);
      // 146.74 红色退掉
      tl.to(["#para", "#para-ta", "#para-tb"], { opacity: 0, duration: 0.4 }, 146.6);
      tl.to("#redfill", { opacity: 0, duration: 1.4, ease: "power1.inOut" }, 146.74);
      tl.to(["#bg-particles", "#bg-grid", "#bg-bloom"], { opacity: 1, duration: 1.4 }, 146.74);
      tl.fromTo("#teacher", { x: 540, y: 420, scale: 1, opacity: 0 }, { x: 540, y: 420, scale: 1, opacity: 0.9, duration: 1.0, ease: "power2.out", immediateRender: false }, 146.9);
    });

    // ================= S9 =================
    const st = D.still;
    D.text(D.glitchStack("模型蒸馏"), 540, 760, null, null, { id: "t-end", anchor: "center", cls: "hero" });
    D.cap("所以，模型蒸馏蒸的是什么？", S9, 150.99, { cls: "top" });
    D.cap("不只是答案，是老师的「犹豫」", 150.99, 157.37, { cls: "top" });
    st.dropAt("drop-3", 154.97);
    st.dropAt("drop-4", 156.04);
    st.dropAt("drop-5", 157.11, 2);
    D.glitch("#t-end", 157.37, 0.35, 26);

    D.step(() => {
      // 老师缩回烧瓶，装置重新出现
      tl.to("#teacher", { x: 700, y: 700, scale: 0.22, opacity: 0, duration: 1.0, ease: "power3.in" }, S9);
      tl.to("#still", { opacity: 1, duration: 0.01 }, S9);
      tl.fromTo("#still-cam", { scale: 1.06, svgOrigin: "540 1000" }, { scale: 1.0, svgOrigin: "540 1000", duration: 8.5, ease: "none", immediateRender: false }, S9);
      tl.fromTo("#st-flask", { opacity: 0, scale: 0.6, svgOrigin: "700 840" }, { opacity: 1, scale: 1, svgOrigin: "700 840", duration: 0.8, ease: "power3.out", immediateRender: false }, S9 + 0.4);
      tl.fromTo("#st-recv", { x: 370, y: -150, scale: 0.35, opacity: 0, svgOrigin: "170 1450", smoothOrigin: false }, { x: 0, y: 0, scale: 1, opacity: 1, svgOrigin: "170 1450", smoothOrigin: false, duration: 0.8, ease: "power3.inOut", immediateRender: false }, S9 + 0.4);
      tl.fromTo(["#st-frame", "#st-head", "#st-lamp"], { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, S9 + 0.6);
      tl.fromTo("#st-cond", { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, S9 + 0.7);
      tl.fromTo("#st-flame", { opacity: 0, scale: 0.2, svgOrigin: "700 1168" }, { opacity: 1, scale: 1, svgOrigin: "700 1168", duration: 0.45, ease: "back.out(2)", immediateRender: false }, S9 + 0.9);
      // 157.37 火焰熄灭，片名
      tl.to("#st-flame", { opacity: 0, scale: 0.1, svgOrigin: "700 1168", duration: 0.5, ease: "power2.in" }, 157.37);
      tl.to("#still", { opacity: 0.25, duration: 1.2, ease: "power1.inOut" }, 157.6);
      tl.fromTo("#t-end", { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.45, ease: "power4.out", immediateRender: true }, 157.37);
    });
  };
})();
