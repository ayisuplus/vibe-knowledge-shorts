// S7 大模型怎么蒸（93.59–121.23）
(function () {
  const D = window.D, C = D.C, tl = D.tl;

  D.scene7 = () => {
    const S7 = 93.59, S8 = 121.23;
    const root = D.wrap(D.L.mid, "s7", { opacity: 0 });

    // ---- 三根管道 ----
    const PX = [300, 540, 780], PT = 650, PB = 1170, PW = 100;
    const pipes = PX.map((x, i) => {
      const id = `pipe-${i}`;
      const w = D.wrap(root, id);
      const clip = D.el(D.defsEl, "clipPath", { id: `pclip-${i}` });
      D.el(clip, "rect", { x: x - PW / 2 + 4, y: PT + 4, width: PW - 8, height: PB - PT - 8, rx: 16 });
      D.el(w, "rect", { x: x - PW / 2, y: PT, width: PW, height: PB - PT, rx: 20, ...D.glass({ fill: "rgba(61,242,255,0.05)" }) });
      const inner = D.g(w, { "clip-path": `url(#pclip-${i})` });
      return { id, x, w, inner, items: [] };
    });
    // 管道 1：一个个字，每个字下面一排小光柱（老师对每个字的打分）
    for (let k = 0; k < 9; k++) {
      const g = D.g(pipes[0].inner, {});
      D.el(g, "rect", { x: -40, y: -16, width: 34, height: 34, rx: 4, fill: "none", stroke: C.ice, "stroke-width": 2 });
      D.el(g, "text", { x: -23, y: 9, "text-anchor": "middle", "font-size": 22, fill: C.ice, "font-family": "DSans", "font-weight": 700 }, "字");
      [24, 12, 7, 4].forEach((h, j) => D.el(g, "rect", { x: 2 + j * 10, y: 18 - h, width: 7, height: h, fill: j === 0 ? C.holo : C.heat }));
      pipes[0].items.push(g);
    }
    // 管道 2：一页页写好的回答
    for (let k = 0; k < 6; k++) {
      const g = D.g(pipes[1].inner, {});
      D.el(g, "rect", { x: -34, y: -44, width: 68, height: 88, rx: 4, fill: "rgba(232,253,255,0.08)", stroke: C.ice, "stroke-width": 2 });
      for (let j = 0; j < 5; j++) D.el(g, "line", { x1: -24, y1: -28 + j * 14, x2: j === 4 ? 6 : 24, y2: -28 + j * 14, stroke: C.ice, "stroke-width": 2, opacity: 0.7 });
      pipes[1].items.push(g);
    }
    // 管道 3：学生往上写（青色），老师往下圈改（琥珀）
    for (let k = 0; k < 8; k++) {
      const g = D.g(pipes[2].inner, {});
      D.el(g, "line", { x1: -30, y1: 0, x2: 30, y2: 0, stroke: C.holo, "stroke-width": 4, "stroke-linecap": "round" });
      D.el(g, "line", { x1: -30, y1: 12, x2: 10, y2: 12, stroke: C.holo, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.7 });
      pipes[2].items.push(g);
    }
    const marks = [];
    for (let k = 0; k < 5; k++) marks.push(D.el(pipes[2].inner, "ellipse", { cx: 0, cy: 0, rx: 26, ry: 14, fill: "none", stroke: C.heat, "stroke-width": 3, filter: "url(#glowS)" }));
    D.onFrame((t) => {
      if (t < S7 - 0.5 || t > 111.5) return;
      const H = PB - PT;
      pipes[0].items.forEach((g, k) => { const y = PT + ((k * 70 + t * 70) % (9 * 70)) - 20; g.setAttribute("transform", `translate(${pipes[0].x} ${D.f(y)})`); });
      pipes[1].items.forEach((g, k) => { const y = PT + ((k * 110 + t * 90) % (6 * 110)) - 50; g.setAttribute("transform", `translate(${pipes[1].x} ${D.f(y)})`); });
      pipes[2].items.forEach((g, k) => { const y = PB - ((k * 70 + t * 60) % (8 * 70)) + 10; g.setAttribute("transform", `translate(${pipes[2].x} ${D.f(y)})`); });
      marks.forEach((m, k) => { const y = PT + ((k * 112 + t * 75) % (5 * 112)) - 10; m.setAttribute("cx", pipes[2].x); m.setAttribute("cy", D.f(y)); });
    });
    // 管道汇向学生
    const fun = D.g(root, D.stroke({ "stroke-width": 2.4, opacity: 0.6 }));
    PX.forEach((x) => D.el(fun, "path", { d: `M${x} ${PB} Q${x} ${PB + 70} 540 ${PB + 110}` }));
    D.text("看草稿", 300, 584, null, null, { id: "pl-0", anchor: "center", cls: "tag small pl" });
    D.text("抄作文", 540, 584, null, null, { id: "pl-1", anchor: "center", cls: "tag small pl" });
    D.text("老师批改", 780, 584, null, null, { id: "pl-2", anchor: "center", cls: "tag small pl" });
    D.buildCrystal(D.L.mid, "student3", 50);

    D.cap("大模型的蒸法，主要有三种", S7, 97.85);
    D.cap("看草稿：学老师对每一个字的打分", 97.85, 102.1, { sub: "要拿得到老师的内部数据", subAt: 98.3 });
    D.cap("抄作文：只拿老师写好的回答来学", 102.1, 106.61, { sub: "只要能调用老师就行", subAt: 102.55 });
    D.cap("老师批改：学生自己写，老师逐字纠正", 106.61, 110.61);

    // ---- 110.61 80 万份作文 → 15 亿参数 ----
    const pile = D.wrap(D.L.mid, "pile", { opacity: 0 });
    const pileIds = [];
    for (let k = 0; k < 16; k++) {
      const id = `pg-${k}`, w = D.wrap(pile, id);
      const x = 110 + (D.hash(k) - 0.5) * 24, y = 560 - k * 22;
      D.el(w, "rect", { x, y, width: 280, height: 64, rx: 4, fill: "rgba(232,253,255,0.07)", stroke: C.ice, "stroke-width": 2, opacity: 0.85 });
      D.el(w, "line", { x1: x + 20, y1: y + 22, x2: x + 220, y2: y + 22, stroke: C.ice, "stroke-width": 2, opacity: 0.5 });
      D.el(w, "line", { x1: x + 20, y1: y + 40, x2: x + 170, y2: y + 40, stroke: C.ice, "stroke-width": 2, opacity: 0.5 });
      pileIds.push(id);
    }
    const arrow = D.wrap(D.L.mid, "pile-arrow", { opacity: 0 });
    D.el(arrow, "path", { d: "M420 420 C520 380 600 380 700 400", ...D.stroke({ stroke: C.heat, "stroke-width": 4, "stroke-dasharray": "12 10" }) });
    D.el(arrow, "path", { d: "M684 380 L712 402 L680 420", ...D.stroke({ stroke: C.heat, "stroke-width": 4 }) });
    D.text("80 万份", 250, 650, null, null, { id: "pile-n", anchor: "center", cls: "statS heat" });
    D.text("15 亿参数", 800, 560, null, null, { id: "stu-n", anchor: "center", cls: "statS" });

    // 成绩对比
    const chart = D.wrap(D.L.mid, "chart", { opacity: 0 });
    const base = 1330, sc = 11.5;
    D.el(chart, "line", { x1: 150, y1: base, x2: 930, y2: base, stroke: C.holo, "stroke-width": 2, opacity: 0.7 });
    const cb = [{ x: 230, v: 28.9, name: "R1 蒸馏版 1.5B", col: C.holo }, { x: 630, v: 9.3, name: "GPT-4o", col: C.ice }].map((b) => {
      const fill = D.el(chart, "rect", { x: b.x, y: base, width: 220, height: 0, fill: b.col === C.holo ? "url(#fillHolo)" : "url(#fillIce)" });
      const cap = D.el(chart, "rect", { x: b.x, y: base - 3, width: 220, height: 6, fill: b.col, filter: "url(#glow)" });
      const val = D.el(chart, "text", { x: b.x + 110, y: base - 24, "text-anchor": "middle", "font-size": 64, fill: b.col, "font-family": "DMono", filter: "url(#glowS)" }, "0.0%");
      D.el(chart, "text", { x: b.x + 110, y: base + 50, "text-anchor": "middle", "font-size": 38, "font-weight": 800, fill: b.col, "font-family": "DSans" }, b.name);
      return { ...b, fill, cap, val };
    });
    D.text("美国数学邀请赛 AIME 2024", 540, 800, null, null, { id: "chart-h", anchor: "center", cls: "tag ice small" });
    D.text("只比数学；对比的是 2024 年版 GPT-4o", 540, 1404, null, null, { id: "chart-f", anchor: "center", cls: "foot" });
    D.onFrame((t) => {
      if (t < 112.8 || t > 117.5) return;
      cb.forEach((b, i) => {
        const k = D.ease.out(D.clamp((t - 112.99 - i * 0.15) / 0.8));
        const h = b.v * sc * k;
        b.fill.setAttribute("y", D.f(base - h)); b.fill.setAttribute("height", D.f(h));
        b.cap.setAttribute("y", D.f(base - h - 3));
        b.val.setAttribute("y", D.f(base - h - 24));
        b.val.textContent = (b.v * k).toFixed(1) + "%";
      });
    });
    D.cap("DeepSeek-R1 用 80 万份作文，教出了一个 15 亿参数的小模型", 110.61, 116.98);
    D.ghost("80万", 110.61, 116.98, { y: 1000, size: 380, op: 0.04, x: 560 });

    // ---- 116.98 你电脑上的 DeepSeek-R1 7B ----
    const lap = D.wrap(D.L.mid, "laptop", { opacity: 0 });
    D.el(lap, "rect", { x: 170, y: 560, width: 740, height: 460, rx: 18, ...D.glass({ fill: "rgba(61,242,255,0.04)" }) });
    D.el(lap, "rect", { x: 196, y: 586, width: 688, height: 408, rx: 6, fill: "none", stroke: C.holo, "stroke-width": 1.5, opacity: 0.5 });
    D.el(lap, "path", { d: "M120 1060 L170 1020 H910 L960 1060 Z", ...D.glass() });
    D.el(lap, "text", { x: 222, y: 640, "font-size": 30, fill: C.ice, "font-family": "DMono" }, "$ ollama run deepseek-r1:7b");
    const cursor = D.el(lap, "rect", { x: 222, y: 664, width: 16, height: 30, fill: C.holo });
    D.onFrame((t) => { if (t > 116.5 && t < 121.5) cursor.setAttribute("opacity", Math.floor(t / 0.4) % 2 ? 0.2 : 1); });
    D.buildCrystal(D.L.mid, "student4", 58);
    D.text("DeepSeek-R1 7B", 540, 900, null, null, { id: "lap-a", anchor: "center", cls: "chipS" });
    D.text("Qwen", 540, 900, null, null, { id: "lap-b", anchor: "center", cls: "chipS heat" });
    D.cap("你电脑上跑的「DeepSeek-R1 7B」，其实是蒸出来的 Qwen", 116.98, S8, { sub: "完整版有 6710 亿参数", subAt: 117.6 });

    D.step(() => {
      tl.fromTo("#s7", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, S7);
      pipes.forEach((p, i) => tl.fromTo(`#${p.id}`, { opacity: 0, scaleY: 0, svgOrigin: `${p.x} ${PT}` }, { opacity: 1, scaleY: 1, svgOrigin: `${p.x} ${PT}`, duration: 0.45, ease: "power3.out", immediateRender: true }, S7 + i * D.BEAT));
      [0, 1, 2].forEach((i) => tl.fromTo(`#pl-${i}`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.3, immediateRender: true }, S7 + 0.2 + i * D.BEAT));
      tl.fromTo("#student3", { x: 540, y: 1340, scale: 0, opacity: 0 }, { x: 540, y: 1340, scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)", immediateRender: true }, S7 + 1.6);
      // 逐根高亮
      const focus = (i, t) => pipes.forEach((p, j) => tl.to([`#${p.id}`, `#pl-${j}`], { opacity: j === i ? 1 : 0.3, duration: 0.3 }, t));
      focus(0, 97.85); focus(1, 102.1); focus(2, 106.61);
      tl.fromTo("#pipe-2", { scale: 1, svgOrigin: `780 ${PT}` }, { scale: 1.04, svgOrigin: `780 ${PT}`, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, 109.27);
      // 110.61
      tl.to(["#s7", "#pl-0", "#pl-1", "#pl-2", "#student3", "#teacher"], { opacity: 0, duration: 0.35 }, 110.45);
      tl.fromTo("#pile", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: true }, 110.61);
      pileIds.forEach((id, k) => tl.fromTo(`#${id}`, { opacity: 0, y: -120 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.in", immediateRender: true }, 110.61 + k * 0.05));
      tl.fromTo("#pile-n", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: true }, 111.5);
      tl.fromTo("#pile-arrow", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: true }, 111.8);
      tl.fromTo("#student4", { x: 800, y: 400, scale: 0, opacity: 0 }, { x: 800, y: 400, scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)", immediateRender: true }, 112.1);
      tl.fromTo("#stu-n", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.3, immediateRender: true }, 112.3);
      tl.fromTo("#chart", { opacity: 0 }, { opacity: 1, duration: 0.2, immediateRender: true }, 112.85);
      tl.fromTo("#chart-h", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: true }, 112.85);
      tl.fromTo("#chart-f", { opacity: 0 }, { opacity: 0.8, duration: 0.3, immediateRender: true }, 114.0);
      // 116.98 笔记本
      tl.to(["#pile", "#pile-arrow", "#pile-n", "#stu-n", "#chart", "#chart-h", "#chart-f"], { opacity: 0, duration: 0.3 }, 116.8);
      tl.fromTo("#laptop", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", immediateRender: true }, 116.98);
      tl.to("#student4", { x: 540, y: 820, scale: 0.9, duration: 0.6, ease: "power3.inOut" }, 116.98);
      tl.fromTo("#lap-a", { opacity: 0, scaleY: 1 }, { opacity: 1, scaleY: 1, duration: 0.3, immediateRender: true }, 117.6);
      tl.to("#lap-a", { scaleY: 0, duration: 0.15, ease: "power2.in" }, 120.28);
      tl.fromTo("#lap-b", { opacity: 0, scaleY: 0 }, { opacity: 1, scaleY: 1, duration: 0.2, ease: "back.out(2)", immediateRender: true }, 120.43);
      tl.to(["#laptop", "#student4", "#lap-b"], { opacity: 0, duration: 0.3 }, S8 - 0.15);
    });
  };
})();
