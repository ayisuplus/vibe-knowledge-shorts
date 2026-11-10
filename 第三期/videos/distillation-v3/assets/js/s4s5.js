// S4 没见过的 3 + 标本卡②（68.09–87.21） · S5 你电脑上的 DeepSeek（87.21–93.59）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  // 手写数字（60×90 格子，左上角原点）
  const DIG = {
    0: "M30 6 C8 6 4 40 6 50 C8 80 20 86 32 84 C52 82 56 50 54 36 C52 14 42 6 30 6 Z",
    1: "M20 20 L36 6 L36 86 M22 86 L50 86",
    2: "M8 24 C10 6 46 2 50 24 C54 42 30 58 8 84 L54 84",
    3: "M10 14 C24 2 52 6 50 26 C48 40 34 44 26 44 C40 44 56 50 54 66 C52 86 20 90 8 76",
    4: "M40 86 L40 6 L6 60 L56 60",
    5: "M50 8 L14 8 L10 40 C24 32 52 34 52 60 C52 84 22 90 8 76",
    6: "M46 10 C20 4 6 40 8 60 C10 84 48 88 50 62 C52 40 20 40 10 56",
    7: "M8 10 L54 10 L24 86 M18 48 L46 48",
    8: "M30 44 C10 38 10 8 30 8 C52 8 50 38 30 44 C6 50 8 86 30 86 C54 86 54 50 30 44 Z",
    9: "M50 34 C50 6 10 6 10 30 C10 50 46 52 50 34 L46 86",
  };
  const GRID = [7, 3, 1, 8, 0, 5, 2, 8, 3, 6, 9, 0, 5, 4, 8, 3, 6, 8, 2, 5, 1, 5, 7, 3, 8];

  D.scene45 = () => {
    const S4 = 68.09, S5 = 87.21;
    const wall = D.wrap(D.L.mid, "s4", { opacity: 0 });
    const TW = 150, TH = 170, GAP = 18, X0 = 129, Y0 = 360;
    const r = D.rng(41);
    const cells = GRID.map((d, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      const x = X0 + col * (TW + GAP), y = Y0 + row * (TH + GAP), cx = x + TW / 2, cy = y + TH / 2;
      const id = `tl-${i}`;
      // 空位（3 被删掉后露出来）
      if (d === 3) el(wall, "rect", { id: `slot-${i}`, x: x + 4, y: y + 4, width: TW - 8, height: TH - 8, rx: 12, fill: "none", stroke: C.gold, "stroke-width": 2, "stroke-dasharray": "8 8", opacity: 0 });
      const w = D.wrap(wall, id);
      D.tile(w, x, y, TW, TH);
      const rot = (r() - 0.5) * 10;
      el(w, "path", { d: DIG[d], transform: `translate(${cx} ${cy}) rotate(${D.f(rot)}) scale(1.45) translate(-30 -46)`, fill: "none", stroke: C.ink, "stroke-width": 4.2, "stroke-linecap": "round", "stroke-linejoin": "round" });
      return { d, x, y, cx, cy, id, i };
    });
    const threes = cells.filter((c) => c.d === 3), donors = cells.filter((c) => c.d === 5 || c.d === 8);
    // 删掉的印章 + 碎屑
    threes.forEach((c, k) => {
      const sg = D.wrap(wall, `del-${k}`, { opacity: 0 });
      D.sealSvg(sg, c.cx - 40, c.cy - 40, 80, "删");
    });
    const crumbs = [];
    const cg = D.g(wall, {});
    threes.forEach((c, k) => {
      for (let j = 0; j < 22; j++) {
        const a = D.hash(k * 31 + j) * 6.28, dist = 40 + D.hash(k * 17 + j * 3) * 110;
        crumbs.push({ el: el(cg, "rect", { x: c.cx - 5, y: c.cy - 5, width: 10, height: 10, rx: 2, fill: j % 4 ? "#e8dcc0" : C.seal, opacity: 0 }), cx: c.cx, cy: c.cy, t0: 72.34 + k * 0.4 + 0.3, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist * 0.6 + 50 });
      }
    });
    D.onFrame((t) => {
      if (t < 72 || t > 75.5) { for (const s of crumbs) s.el.setAttribute("opacity", 0); return; }
      for (const s of crumbs) {
        const k = D.clamp((t - s.t0) / 1.2);
        s.el.setAttribute("transform", `translate(${D.f(s.dx * D.ease.out(k))} ${D.f(s.dy * k * k)}) rotate(${D.f(k * 200)} ${s.cx} ${s.cy})`);
        s.el.setAttribute("opacity", D.f(k > 0 && k < 1 ? 1 - k : 0));
      }
    });

    // 中央的大骨牌 + 金色的 3
    const big = D.wrap(D.L.front, "big3", { opacity: 0 });
    el(big, "ellipse", { cx: 540, cy: 820, rx: 330, ry: 330, fill: "url(#glowGold)", opacity: 0.6 });
    D.tile(big, 390, 650, 300, 340);
    const bp = el(big, "path", { d: DIG[3], transform: "translate(540 820) scale(3.2) translate(-30 -46)", fill: "none", stroke: "#b8862e", "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round" });
    const bpL = bp.getTotalLength();
    bp.setAttribute("stroke-dasharray", D.f(bpL));
    const targets = Array.from({ length: 64 }, (_, i) => { const p = bp.getPointAtLength((bpL * i) / 63); return [540 + (p.x - 30) * 3.2, 820 + (p.y - 46) * 3.2]; });
    const motes = D.wrap(D.L.front, "motes", { opacity: 0 });
    const mEls = targets.map((tg, i) => {
      const src = donors[i % donors.length];
      return { el: el(motes, "circle", { cx: src.cx, cy: src.cy, r: 3.4, fill: C.goldHi, filter: "url(#softGlow)" }), sx: src.cx + (D.hash(i) - 0.5) * 70, sy: src.cy + (D.hash(i + 9) - 0.5) * 70, tx: tg[0], ty: tg[1], d: D.hash(i * 7) * 0.5 };
    });
    D.onFrame((t) => {
      if (t < 76 || t > 84) return;
      bp.setAttribute("stroke-dashoffset", D.f(bpL * (1 - D.clamp((t - 77.7) / 0.75))));
      for (const m of mEls) {
        const k = D.ease.inOut(D.clamp((t - 76.7 - m.d) / 1.1));
        const sc = D.clamp((t - 82.7) / 1.6);
        m.el.setAttribute("cx", D.f(D.lerp(m.sx, m.tx, k) + (m.tx - 540) * sc * 0.8 + Math.sin(t * 3 + m.d * 20) * 3 * (1 - k)));
        m.el.setAttribute("cy", D.f(D.lerp(m.sy, m.ty, k) + (m.ty - 820) * sc * 0.8 - sc * 60));
        m.el.setAttribute("opacity", D.f((k < 1 ? 0.95 : 0.6) * (1 - sc)));
      }
    });
    const ties = D.wrap(D.L.mid, "ties", { opacity: 0 });
    donors.forEach((c) => el(ties, "line", { x1: c.cx, y1: c.cy, x2: 540, y2: 820, stroke: C.gold, "stroke-width": 1.8, "stroke-dasharray": "6 8", opacity: 0.75 }));
    D.text("98.6%", 540, 1288, { id: "stat-986", anchor: "center", cls: "stat", style: "color:#f1d79c;text-shadow:0 0 26px rgba(241,215,156,.5)" });

    D.em = D.EM.ai;
    D.cap("辛顿还做过一个<em>实验</em>", S4, 72.34);
    D.cap("把所有的<em>「3」</em>，|从学生的课本里删掉", 72.34, 76.59);
    D.cap("学生<em>从没见过</em> 3", 76.59, 78.45);
    D.cap("却认出了 <em>98.6%</em> 的 3", 78.45, 80.84, { note: "需把「3」的偏置调高一点", noteAt: 78.9 });
    D.cap("因为老师一直在说：|这个 8 有点像 3，这个 5 也有点像 3", 80.84, 83.77);
    D.cap("AI 的蒸馏：|瓶里是一个<em>新的小模型</em>", 83.77, S5);

    D.step(() => {
      tl.fromTo("#s4", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, S4);
      cells.forEach((c) => tl.fromTo(`#${c.id}`, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: true }, S4 + 0.1 + (c.i % 5) * 0.12 + Math.floor(c.i / 5) * 0.18));
      threes.forEach((c, k) => {
        const tt = 72.34 + k * 0.4;
        tl.fromTo(`#del-${k}`, { opacity: 0, scale: 2.2, svgOrigin: `${c.cx} ${c.cy}` }, { opacity: 1, scale: 1, svgOrigin: `${c.cx} ${c.cy}`, duration: 0.2, ease: "power4.in", immediateRender: true }, tt);
        tl.to([`#${c.id}`, `#del-${k}`], { opacity: 0, duration: 0.3, ease: "power2.in" }, tt + 0.3);
        tl.fromTo(`#slot-${c.i}`, { opacity: 0 }, { opacity: 0.8, duration: 0.3, immediateRender: true }, tt + 0.45);
      });
      cells.filter((c) => c.d !== 3).forEach((c) => tl.to(`#${c.id}`, { opacity: c.d === 5 || c.d === 8 ? 1 : 0.22, duration: 0.5 }, 76.59));
      tl.fromTo("#motes", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, 76.59);
      tl.fromTo("#big3", { opacity: 0, scale: 0.9, svgOrigin: "540 820" }, { opacity: 1, scale: 1, svgOrigin: "540 820", duration: 0.5, ease: "power2.out", immediateRender: false }, 77.4);
      tl.fromTo("#stat-986", { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out", immediateRender: false }, 78.45);
      tl.fromTo("#ties", { opacity: 0 }, { opacity: 1, duration: 0.5, immediateRender: false }, 80.84);
      tl.fromTo("#big3", { scale: 1 }, { scale: 1.05, svgOrigin: "540 820", duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, 82.7);
      tl.to(["#s4", "#big3", "#motes", "#ties", "#stat-986"], { opacity: 0, duration: 0.4 }, 83.4);
    });

    // ---------- 标本卡②：AI 蒸馏 ----------
    const c2 = D.wrap(D.L.mid, "s4card", { opacity: 0 });
    const v2 = D.vial(c2, "s4-vial", 300, 1150, 120, C.ai, { level: 0.6 });
    D.specimen(D.L.front, "spec-2", 470, 640, 560, { color: C.ai, name: "AI 蒸馏", rows: [["瓶里装的", "一个新的小模型"], ["怎么来的", "学大模型的打分，", "参数被重新训练"]] });
    D.step(() => {
      tl.fromTo("#s4card", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 83.6);
      tl.fromTo("#spec-2", { opacity: 0, x: 60, rotation: 3 }, { opacity: 1, x: 0, rotation: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, 84.3);
      tl.to(["#s4card", "#spec-2"], { opacity: 0, duration: 0.35 }, S5 - 0.3);
    });

    // ================= S5 2025 · 千问：自家大模型蒸出一整个家族 =================
    const S6 = 93.59, SB = 90.4;
    D.year(S5, "2025");
    D.caseInfo(S5, S6, { place: "杭州 · 阿里千问", en: "Qwen3 Technical Report", zh: "《Qwen3 技术报告》", by: "Qwen Team · 2025", seal: "蒸" });
    const s5 = D.wrap(D.L.mid, "s5", { opacity: 0 });
    el(s5, "ellipse", { cx: 260, cy: 905, rx: 190, ry: 20, fill: "url(#shadow)" });
    const qT = D.flask(s5, 260, 760, 140, { level: 0.62, neck: 0.6, color: C.ai });
    D.tag(s5, "tag-q235", 240, qT.top + 30, 60, qT.top - 70, "Qwen3-235B · 老师", { rot: -4, size: 28 });
    // 五个小号：0.6B 到 14B
    D.shelf(s5, 470, 1030, 900);
    const SM = ["0.6B", "1.7B", "4B", "8B", "14B"];
    const fam = SM.map((n, i) => {
      const x = 525 + i * 112, r = 22 + i * 4;
      const v = D.vial(s5, `qv-${i}`, x, 900, r, C.ai, { level: 0.05, glow: true });
      el(s5, "text", { x, y: 948, "text-anchor": "middle", "font-family": "Gara", "font-size": 30, fill: C.goldHi }, n);
      return { x, v, top: v.top };
    });
    // 从老师瓶口流向每个小瓶的光
    const flowsQ = fam.map((f, i) => {
      const d = `M${260} ${D.f(qT.top - 6)} C${D.f(380 + i * 30)} ${D.f(qT.top - 140)} ${D.f(f.x - 40)} ${D.f(f.top - 180)} ${f.x} ${D.f(f.top - 6)}`;
      el(s5, "path", { d, fill: "none", stroke: C.ai, "stroke-width": 7, "stroke-linecap": "round", "stroke-dasharray": "50 70", opacity: 0.5, filter: "url(#blur6)", class: "qflow" });
      return el(s5, "path", { d, fill: "none", stroke: D.liq(C.ai).hi, "stroke-width": 2.5, "stroke-linecap": "round", "stroke-dasharray": "50 70", opacity: 0.9, class: "qflow" });
    });
    // B：衍生模型铺满 —— 一片小瓶 + "30 万"
    const swarm = D.wrap(D.L.mid, "q-swarm", { opacity: 0 });
    const SW = [];
    for (let row = 0; row < 4; row++) for (let col = 0; col < 9; col++) {
      const x = 110 + col * 108 + (row % 2) * 54, yb = 520 + row * 110;
      if (x > 1010) continue;
      const id = `qs-${row}-${col}`;
      const w = D.wrap(swarm, id);
      D.vial(w, `${id}-v`, x, yb, 22, [C.ai, C.colleague, C.boss, C.self, C.ex, C.mentor][(row * 9 + col) % 6], { level: 0.6, glow: false });
      SW.push({ id, k: row * 9 + col });
    }
    D.text("30 万+", 540, 930, { id: "q-count", anchor: "center", cls: "stat", style: "font-size:130px" });
    D.text("个衍生模型", 540, 1090, { id: "q-count2", anchor: "center", cls: "note", style: "font-size:40px" });
    D.onFrame((t) => {
      if (t < 86.8 || t > 94) return;
      const k = D.ease.out(D.clamp((t - 87.6) / 2.4));
      fam.forEach((f, i) => f.v.set(0.05 + 0.55 * D.clamp(k * 1.3 - i * 0.06)));
      document.querySelectorAll(".qflow").forEach((p) => p.setAttribute("stroke-dashoffset", D.f(-((t * 120) % 120))));
      const e = document.getElementById("q-count"); if (e) e.textContent = Math.round(30 * D.ease.out(D.clamp((t - 90.6) / 1.4))) + " 万+";
    });
    D.cap("千问的一整个小模型家族，|是自家大模型<em>蒸</em>出来的", S5, SB, { note: "0.6B 到 14B：Qwen3 技术报告，2025", noteAt: 87.8 });
    D.cap("开源之后，又被全世界|改出 <em>30 万</em>多个衍生模型", SB, S6, { note: "阿里官方数据，2026 年 8 月", noteAt: 90.9 });
    D.step(() => {
      tl.fromTo("#s5", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, S5);
      tl.to("#s5", { opacity: 0, duration: 0.35 }, SB - 0.2);
      tl.fromTo("#q-swarm", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, SB);
      SW.forEach((sv) => tl.fromTo(`#${sv.id}`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out", immediateRender: true }, SB + 0.1 + sv.k * 0.035));
      tl.fromTo("#q-count", { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out", immediateRender: false }, SB + 0.2);
      tl.fromTo("#q-count2", { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, SB + 0.5);
      tl.to(["#s5", "#q-swarm", "#q-count", "#q-count2"], { opacity: 0, duration: 0.35 }, S6 - 0.3);
    });
  };
})();
