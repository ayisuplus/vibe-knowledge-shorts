// S6 2019 · DistilBERT（93.59–102.10） · S7 2025 · DeepSeek（102.10–121.23）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene67 = () => {
    const S6 = 93.59, S7 = 102.1, S8 = 121.23;
    D.year(S6, "2019");
    D.year(S7, "2025");
    D.caseInfo(S6, S7, { place: "Hugging Face · 桑等人", en: "DistilBERT, a distilled version of BERT", zh: "《DistilBERT：BERT 的蒸馏版》", by: "桑 · 德布 · 肖蒙 · 沃尔夫 · 2019", seal: "精" });
    D.caseInfo(S7, S8, { place: "杭州 · DeepSeek", en: "DeepSeek-R1", zh: "《用强化学习激发大模型的推理能力》", by: "DeepSeek-AI · 2025", seal: "抄" });

    // ================= S6 =================
    const s6 = D.wrap(D.L.mid, "s6", { opacity: 0 });
    el(s6, "ellipse", { cx: 330, cy: 905, rx: 200, ry: 22, fill: "url(#shadow)" });
    el(s6, "ellipse", { cx: 780, cy: 1050, rx: 130, ry: 16, fill: "url(#shadow)" });
    const bigF = D.flask(s6, 330, 760, 140, { level: 0.6, neck: 0.75 });
    const smF = D.flask(s6, 780, 960, 80, { level: 0.1, neck: 0.6 });
    const arcD = `M330 ${bigF.top} C330 420 780 520 780 ${smF.top}`;
    el(s6, "path", { d: arcD, fill: "none", stroke: "#000", "stroke-opacity": 0.35, "stroke-width": 20 });
    el(s6, "path", { d: arcD, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.45, "stroke-width": 14 });
    el(s6, "path", { d: arcD, fill: "none", stroke: "#1d150e", "stroke-width": 10 });
    const arcP = el(s6, "path", { d: arcD, fill: "none", stroke: "none" });
    const arcL = arcP.getTotalLength();
    const arcDrops = [];
    for (let k = 0; k < 9; k++) arcDrops.push(el(s6, "circle", { r: 4.5, fill: "#f0b45a", opacity: 0.9 }));
    const tB = D.tag(s6, "tag-bert", 300, bigF.top + 30, 70, bigF.top + 90, "BERT", { rot: -5 });
    const tD = D.tag(s6, "tag-dbert", 760, smF.top + 20, 430, smF.top + 120, "DistilBERT", { rot: 4, size: 30 });
    const s6tiles = [["体积", "−40%"], ["速度", "+60%"], ["能力保留", "97%"]].map(([k, v], i) => {
      const id = `s6t-${i}`, w = D.wrap(s6, id, { opacity: 0 });
      const x = 110 + i * 295;
      D.tile(w, x, 1160, 270, 170);
      el(w, "text", { x: x + 135, y: 1212, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 700, "font-size": 30, fill: "#6b4a2a" }, k);
      el(w, "text", { x: x + 135, y: 1300, "text-anchor": "middle", "font-family": "Gara", "font-size": 76, fill: C.ink }, v);
      return { id, cx: x + 135 };
    });
    D.onFrame((t) => {
      if (t < 93 || t > 102.6) return;
      arcDrops.forEach((c, k) => { const u = (k / 9 + t * 0.22) % 1; const pt = arcP.getPointAtLength(arcL * u); c.setAttribute("cx", D.f(pt.x)); c.setAttribute("cy", D.f(pt.y)); });
      smF.set(D.keyed([[94.2, 0.1], [98, 0.62]], t));
      tB.swing(t, 93.9); tD.swing(t, 94.5);
    });
    D.cap("一个有名的例子：<em>DistilBERT</em>", S6, 97.85);
    D.cap("小了 40%，快了 60%，|本事留下 <em>97%</em>", 97.85, S7);
    D.step(() => {
      tl.fromTo("#s6", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S6);
      [95.72, 96.79, 97.85].forEach((tt, i) => tl.fromTo(`#${s6tiles[i].id}`, { opacity: 0, scaleY: 0, svgOrigin: `${s6tiles[i].cx} 1245` }, { opacity: 1, scaleY: 1, svgOrigin: `${s6tiles[i].cx} 1245`, duration: 0.35, ease: "power3.out", immediateRender: true }, tt - 0.2));
      tl.to("#s6", { opacity: 0, duration: 0.45 }, S7 - 0.3);
    });

    // ================= S7 抄作文 =================
    const s7 = D.wrap(D.L.mid, "s7", { opacity: 0 });
    el(s7, "ellipse", { cx: 540, cy: 800, rx: 220, ry: 24, fill: "url(#shadow)" });
    const r1 = D.flask(s7, 540, 640, 140, { level: 0.62, neck: 0.7 });
    const tR = D.tag(s7, "tag-r1", 510, r1.top + 30, 230, r1.top + 80, "R1 · 老师", { rot: -4 });
    // 飘出来的纸，落成一摞
    const sheets = [];
    const sg = D.g(s7, {});
    for (let i = 0; i < 28; i++) {
      const g = el(sg, "g", { opacity: 0 });
      el(g, "rect", { x: -48, y: -60, width: 96, height: 120, fill: "url(#paper)", stroke: "#b8a07a", "stroke-width": 1 });
      for (let j = 0; j < 6; j++) el(g, "line", { x1: -36, y1: -44 + j * 17, x2: j === 5 ? 6 : 36, y2: -44 + j * 17, stroke: "#6b4a2a", "stroke-width": 2, opacity: 0.5 });
      const k = i;
      sheets.push({ g, t0: 102.4 + i * 0.27, px: 250 + (D.hash(i) - 0.5) * 30, py: 1300 - k * 13, rot: (D.hash(i + 3) - 0.5) * 16, wob: D.hash(i * 5) });
    }
    D.onFrame((t) => {
      if (t < 102 || t > 111) return;
      for (const s of sheets) {
        const k = (t - s.t0) / 1.3;
        if (k < 0) { s.g.setAttribute("opacity", 0); continue; }
        const u = D.clamp(k);
        const e = D.ease.inOut(u);
        const x = D.lerp(540, s.px, e) + Math.sin(u * 6 + s.wob * 6) * 30 * (1 - u);
        const y = u < 0.25 ? D.lerp(r1.top - 10, r1.top - 120, u / 0.25) : D.lerp(r1.top - 120, s.py, D.ease.in((u - 0.25) / 0.75) * 0.6 + ((u - 0.25) / 0.75) * 0.4);
        const rot = D.lerp(0, s.rot, e) + Math.sin(u * 9 + s.wob * 4) * 20 * (1 - u);
        const sc = D.lerp(0.4, 1, D.clamp(u / 0.3));
        s.g.setAttribute("transform", `translate(${D.f(x)} ${D.f(y)}) rotate(${D.f(rot)}) scale(${D.f(sc)})`);
        s.g.setAttribute("opacity", D.f(D.clamp(k * 5)));
      }
    });
    const stu = D.flask(s7, 830, 1250, 85, { level: 0.08, neck: 0.6 });
    const tS = D.tag(s7, "tag-15b", 810, stu.top + 20, 640, stu.top - 70, "1.5B · 学生", { rot: 3, size: 30 });
    const cnt = D.text("0 万份", 540, 1120, { id: "cnt-80", anchor: "center", cls: "stat", style: "font-size:96px" });
    D.onFrame((t) => {
      if (t < 102 || t > 111) return;
      stu.set(D.keyed([[106.6, 0.08], [110.2, 0.75]], t));
      const e = document.getElementById(cnt); if (e) e.textContent = Math.round(80 * D.ease.out(D.clamp((t - 106.61) / 1.8))) + " 万份";
      tR.swing(t, 102.4); tS.swing(t, 106.7);
    });

    // AIME 对比：两支大试管
    const s7b = D.wrap(D.L.mid, "s7b", { opacity: 0 });
    const big1 = D.tube(s7b, 360, 1330, 560, { w: 150, hot: true });
    const big2 = D.tube(s7b, 720, 1330, 560, { w: 150 });
    const v1 = el(s7b, "text", { x: 360, y: 900, "text-anchor": "middle", "font-family": "Gara", "font-size": 72, fill: C.goldHi }, "");
    const v2 = el(s7b, "text", { x: 720, y: 900, "text-anchor": "middle", "font-family": "Gara", "font-size": 72, fill: C.ivory }, "");
    el(s7b, "text", { x: 360, y: 1384, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 36, fill: C.goldHi }, "R1 蒸馏版 1.5B");
    el(s7b, "text", { x: 720, y: 1384, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 36, fill: C.ivoryDim }, "GPT-4o");
    D.text("美国数学邀请赛 · AIME 2024", 540, 640, { id: "aime-h", anchor: "center", cls: "note", style: "font-size:38px" });
    D.onFrame((t) => {
      if (t < 110.3 || t > 117.5) return;
      const k1 = D.ease.out(D.clamp((t - 110.8) / 1.0)), k2 = D.ease.out(D.clamp((t - 111.0) / 1.0));
      const y1 = big1.set((28.9 / 32) * k1), y2 = big2.set((9.3 / 32) * k2);
      v1.textContent = (28.9 * k1).toFixed(1) + "%"; const in1 = (28.9 / 32) * k1 > 0.7; v1.setAttribute("y", D.f(in1 ? y1 + 80 : y1 - 26)); v1.setAttribute("fill", in1 ? C.ink : C.goldHi); v1.setAttribute("font-size", in1 ? 54 : 72);
      v2.textContent = (9.3 * k2).toFixed(1) + "%"; v2.setAttribute("y", D.f(y2 - 26));
    });

    // 你电脑上的 DeepSeek-R1 7B → Qwen
    const s7c = D.wrap(D.L.mid, "s7c", { opacity: 0 });
    el(s7c, "ellipse", { cx: 540, cy: 1160, rx: 220, ry: 24, fill: "url(#shadow)" });
    const q = D.flask(s7c, 540, 1000, 150, { level: 0.5, neck: 0.55 });
    const tagA = D.tag(s7c, "tag-7b", 520, q.top + 30, 220, q.top + 100, "DeepSeek-R1 7B", { rot: -4, size: 30 });
    const tagB = D.tag(s7c, "tag-qwen", 520, q.top + 30, 220, q.top + 100, "Qwen", { rot: -4, w: tagA.W });
    D.onFrame((t) => { if (t > 116.5 && t < 121.6) { tagA.swing(t, 117.0); tagB.swing(t, 117.0); } });
    D.text(`<span style="font-family:'Gara';font-size:40px;color:#2a1d12">$ ollama run deepseek-r1:7b</span>`, 540, 520, { id: "cmd", anchor: "center", cls: "card", style: "width:620px;left:230px;text-align:center;padding:22px 30px" });

    D.cap("这一次，学生不看打分，|<em>直接抄</em>老师写好的作文", S7, 106.61);
    D.cap("DeepSeek-R1 写了 <em>80 万份</em>，|教出一个 15 亿参数的小模型", 106.61, 110.61);
    D.cap("数学竞赛题上，它赢了 <em>GPT-4o</em>", 110.61, 116.98, { note: "只比数学；对比的是 2024 年版 GPT-4o", noteAt: 111.2 });
    D.cap("你电脑上跑的「DeepSeek-R1 7B」，|其实是蒸出来的 <em>Qwen</em>", 116.98, S8, { note: "完整版有 6710 亿参数", noteAt: 117.6 });

    D.step(() => {
      tl.fromTo("#s7", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S7);
      tl.set("#tag-15b", { opacity: 0 }, 0);
      tl.to("#tag-15b", { opacity: 1, duration: 0.15 }, 106.7);
      tl.fromTo("#cmd", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 117.1);
      tl.to("#cmd", { opacity: 0, duration: 0.35 }, S8 - 0.2);
      tl.fromTo("#cnt-80", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 106.61);
      tl.to(["#s7", "#cnt-80"], { opacity: 0, duration: 0.4 }, 110.35);
      tl.fromTo("#s7b", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, 110.61);
      tl.fromTo("#aime-h", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, immediateRender: false }, 110.7);
      tl.to(["#s7b", "#aime-h"], { opacity: 0, duration: 0.4 }, 116.75);
      tl.fromTo("#s7c", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 116.98);
      tl.set("#tag-qwen", { opacity: 0 }, 0);
      tl.to("#tag-7b", { scaleX: 0, svgOrigin: `${220 + tagA.W / 2} ${q.top + 133}`, duration: 0.15, ease: "power2.in" }, 120.28);
      tl.fromTo("#tag-qwen", { opacity: 1, scaleX: 0, svgOrigin: `${220 + tagA.W / 2} ${q.top + 133}` }, { opacity: 1, scaleX: 1, svgOrigin: `${220 + tagA.W / 2} ${q.top + 133}`, duration: 0.2, ease: "power2.out", immediateRender: false }, 120.43);
      tl.to("#s7c", { opacity: 0, duration: 0.35 }, S8 - 0.2);
    });
  };
})();
