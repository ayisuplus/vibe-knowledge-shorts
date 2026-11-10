// S8 开瓶鉴定（129.73–148.86） · S9 此刻 · 你（148.86–157.37） · S10 片尾（157.37–160.17）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene810 = () => {
    const S8 = 129.73, S9 = 148.86, S10 = 157.37;
    D.caseInfo(S8, S9, { place: "鉴定 · 瓶里装的是什么" });
    D.caseInfo(S9, 157.2, { place: "此刻 · 你" });

    // ---------- 三次开瓶 ----------
    const OPENS = [
      { t: S8, t1: 132.4, color: C.colleague, name: "同事.skill", rows: [["瓶里装的", "一份说明书"], ["怎么来的", "整理聊天记录，", "模型参数一个没变"]] },
      { t: 132.66, t1: 135.9, color: C.sun, name: "AI 孙燕姿", rows: [["瓶里装的", "一个声音模型"], ["怎么来的", "用她的歌训练，", "老师是人，不是模型"]] },
      { t: 136.12, t1: 139.85, color: C.ghibli, name: "吉卜力风", rows: [["瓶里装的", "一句提示词"], ["怎么来的", "什么都没训练"]] },
    ];
    const VX = 250, VY = 860, VR = 105;
    OPENS.forEach((o, k) => {
      const g = D.wrap(D.L.mid, `open-${k}`, { opacity: 0 });
      const v = D.vial(g, `ov-${k}`, VX, VY, VR, o.color, { level: 0.6 });
      D.label(g, VX, VY + 30, o.name, o.color, { size: 32 });
      // 瓶里浮出来的东西
      const out = D.wrap(g, `oo-${k}`, { opacity: 0 }, true);
      if (k === 0) {
        const pg = el(out, "g", { filter: "url(#drop)" });
        el(pg, "rect", { x: 440, y: 360, width: 560, height: 470, fill: "url(#paper)" });
        el(pg, "rect", { x: 440, y: 360, width: 560, height: 26, fill: "#cdb98c" });
        el(pg, "rect", { x: 440, y: 804, width: 560, height: 26, fill: "#cdb98c" });
        const L = [["SKILL.md", "Gara", 44, C.ink], ["## 说话习惯", "DSerif", 32, "#8e2a1e"], ["回消息先说「收到」", "DSerif", 30, C.ink], ["## 工作偏好", "DSerif", 32, "#8e2a1e"], ["先要需求文档再动手", "DSerif", 30, C.ink], ["## 口头禅", "DSerif", 32, "#8e2a1e"], ["「我看下」", "DSerif", 30, C.ink]];
        L.forEach(([txt, f, sz, c], i) => el(pg, "text", { x: 480, y: 440 + i * 54, "font-family": f, "font-weight": f === "Gara" ? 400 : 800, "font-size": sz, fill: c }, txt));
      } else if (k === 1) {
        let d = "M450 520";
        for (let i = 1; i <= 110; i++) { const x = 450 + i * 5; const a = Math.sin(i * 0.31) * Math.sin(i * 0.071 + 1) * 70 * (0.5 + 0.5 * Math.sin(i * 0.9)); d += ` L${x} ${D.f(520 - a)}`; }
        el(out, "path", { d, fill: "none", stroke: C.goldHi, "stroke-width": 4, "stroke-linejoin": "round", filter: "url(#softGlow)" });
        el(out, "ellipse", { cx: 760, cy: 812, rx: 120, ry: 14, fill: "url(#shadow)" });
        D.flask(out, 760, 720, 82, { level: 0.6, neck: 0.6, color: C.sun });
        el(out, "text", { x: 880, y: 700, "font-family": "DSerif", "font-weight": 800, "font-size": 32, fill: C.goldHi }, "声音");
        el(out, "text", { x: 880, y: 742, "font-family": "DSerif", "font-weight": 800, "font-size": 32, fill: C.goldHi }, "模型");
      } else {
        const pg = el(out, "g", { filter: "url(#drop)", transform: "rotate(-3 730 600)" });
        el(pg, "rect", { x: 450, y: 540, width: 560, height: 120, fill: "url(#paper)" });
        el(pg, "text", { x: 730, y: 614, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 34, fill: C.ink }, "「把这张照片画成吉卜力风」");
      }
      D.specimen(D.L.front, `spec-o${k}`, 100, 990, 880, { color: o.color, name: o.name, rows: o.rows });
      o.v = v;
    });

    D.em = D.EM.colleague;
    D.cap("同事.skill：摄走的只是一份<em>说明书</em>，|模型一个参数都没变", S8, 132.66);
    D.cap("AI 孙燕姿：用她的歌<em>训练</em>出的声音模型，|老师是人，不是模型", 132.66, 136.12, { em: D.EM.sun });
    D.cap("吉卜力风：只是<em>一句提示词</em>，|什么都没训练", 136.12, 140.1, { em: D.EM.ghibli });

    D.step(() => {
      OPENS.forEach((o, k) => {
        tl.fromTo(`#open-${k}`, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", immediateRender: false }, o.t);
        tl.fromTo(`#ov-${k}-cork`, { x: 0, y: 0, opacity: 1 }, { x: 60, y: -150, opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, o.t + 0.35);
        tl.fromTo(`#oo-${k}`, { opacity: 0, scale: 0.6, x: 250 * 0.4, y: 300 }, { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, o.t + 0.45);
        tl.fromTo(`#spec-o${k}`, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, o.t + 0.9);
        tl.to([`#open-${k}`, `#spec-o${k}`], { opacity: 0, duration: 0.3 }, o.t1);
      });
    });

    // ---------- 对照表 ----------
    const X = 60, Y = 380, W = 960, rowH = 186;
    const ROWS = [
      [C.amber, "酒", "酒精本身", "靠沸点不同分开"],
      [C.ai, "AI 蒸馏", "一个新的小模型", "学大模型的打分，参数被训练"],
      [C.colleague, "同事.skill", "一份说明书", "整理聊天记录，参数一个没变"],
      [C.sun, "AI 孙燕姿", "一个声音模型", "用她的歌训练，老师是人"],
      [C.ghibli, "吉卜力风", "一句提示词", "什么都没训练"],
    ];
    const H = 96 + ROWS.length * rowH + 20;
    const led = D.wrap(D.L.front, "ledger", { opacity: 0 });
    const pg = el(led, "g", { filter: "url(#drop)" });
    el(pg, "rect", { x: X, y: Y, width: W, height: H, fill: "url(#paper)" });
    el(pg, "rect", { x: X + 12, y: Y + 12, width: W - 24, height: H - 24, fill: "none", stroke: C.ink, "stroke-opacity": 0.6, "stroke-width": 1.6 });
    const col1 = X + 200, col2 = X + 570;
    el(led, "text", { x: col1, y: Y + 66, "font-family": "DSerif", "font-weight": 700, "font-size": 28, fill: "#6b5a44" }, "瓶里装的");
    el(led, "text", { x: col2, y: Y + 66, "font-family": "DSerif", "font-weight": 700, "font-size": 28, fill: "#6b5a44" }, "怎么来的");
    const hl = D.wrap(led, "ledger-hl", { opacity: 0 });
    el(hl, "rect", { x: X + 22, y: Y + 96 + 6, width: W - 44, height: rowH - 12, rx: 6, fill: "#f6e6c4", "fill-opacity": 0.8, stroke: C.amber, "stroke-width": 4 });
    ROWS.forEach(([c, name, what, how], i) => {
      const y0 = Y + 96 + i * rowH;
      const r = D.wrap(led, `lr-${i}`);
      el(r, "line", { x1: X + 30, y1: y0, x2: X + W - 30, y2: y0, stroke: C.ink, "stroke-opacity": 0.3, "stroke-width": 1.2 });
      D.vial(r, `lr-${i}-v`, X + 92, y0 + 150, 34, c, { level: 0.6, glow: false });
      el(r, "text", { x: X + 92, y: y0 + 178, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 800, "font-size": 22, fill: C.ink }, name);
      el(r, "text", { x: col1, y: y0 + 100, "font-family": "DSerif", "font-weight": 900, "font-size": 40, fill: C.ink }, what);
      const ws = how.split("，");
      ws.forEach((w, k) => el(r, "text", { x: col2, y: y0 + 84 + k * 44 + (ws.length === 1 ? 16 : 0), "font-family": "DSerif", "font-weight": 700, "font-size": 32, fill: "#3a2a1a" }, w));
    });
    // 区别：模型本身有没有被改变（AI 蒸馏、孙燕姿＝改；同事.skill、吉卜力＝未改）；只有化学那瓶是本义的蒸馏
    const sealRow = (ch, i, t, ink, rot) => D.sealAt(ch, X + W - 124, Y + 96 + i * rowH + 56, 76, t, 148.6, { id: `seal-r${i}`, rot, ink, fs: ch.length > 1 ? 28 : 40 });
    sealRow("改", 1, 144.42, false, 6);
    sealRow("改", 3, 144.69, false, -5);
    sealRow("未改", 2, 144.96, true, 5);
    sealRow("未改", 4, 145.23, true, -6);
    D.sealAt("本义", X + W - 124, Y + 96 + 50, 90, 146.74, 148.6, { id: "seal-ledger", rot: -8, fs: 34 });

    D.cap("看起来都是「蒸馏」，|瓶里装的<em>完全不同</em>", 140.1, 144.2, { em: D.EM.gold });
    D.cap("区别在于：|模型本身，有没有被<em>改变</em>", 144.2, 146.74, { em: D.EM.gold });
    D.cap("只有化学的那一瓶，|是真正的<em>「蒸馏」</em>", 146.74, S9, { em: D.EM.amber });
    D.step(() => {
      tl.fromTo("#ledger", { opacity: 0 }, { opacity: 1, duration: 0.35, immediateRender: false }, 140.1);
      ROWS.forEach((_, i) => tl.fromTo(`#lr-${i}`, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out", immediateRender: true }, 140.25 + i * 0.16));
      tl.fromTo("#ledger-hl", { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, 146.74);
      [1, 2, 3, 4].forEach((i) => tl.to(`#lr-${i}`, { opacity: 0.45, duration: 0.4 }, 146.74));
      tl.to("#ledger", { opacity: 0, duration: 0.4 }, S9 - 0.3);
    });

    // ---------- S9 此刻 · 你：有人出钱买你的灵魂（插图由 Codex CLI 生成，02-风格样张-v4/gen2/bargain.jpg） ----------
    const bg = D.wrap(D.L.mid, "bargain", { opacity: 0 });
    const bgImg = D.wrap(bg, "bargain-img", {}, true);
    el(bgImg, "image", { href: "assets/img/bargain.jpg", x: 0, y: 120, width: 1080, height: 1620, preserveAspectRatio: "xMidYMid slice" });
    el(bg, "rect", { x: 0, y: 0, width: 1080, height: 1920, fill: "url(#soulShade)" });
    // 金币上的闪光（卡在三个重音上）+ 从胸口飘向金币的魂
    const COIN = [654, 816], CHEST = [359, 668];
    const glint = el(bg, "circle", { cx: COIN[0], cy: COIN[1], r: 90, fill: "url(#glowGold)", opacity: 0 });
    const motes = [];
    for (let i = 0; i < 14; i++) motes.push({ el: el(bg, "circle", { r: 1.6 + D.hash(i) * 2.4, fill: i % 4 ? "#f6e2a8" : "#bfeef2", filter: "url(#softGlow)", opacity: 0 }), ph: D.hash(i * 3), sp: 0.22 + D.hash(i * 7) * 0.12, dy: (D.hash(i * 11) - 0.5) * 50 });
    D.onFrame((t) => {
      const on = t > S9 - 0.2 && t < 158.2;
      const hit = [154.97, 156.04, 157.11].reduce((a, tt, k) => Math.max(a, (t >= tt ? Math.exp(-(t - tt) * 3.2) : 0) * (k === 2 ? 1.3 : 1)), 0);
      glint.setAttribute("opacity", D.f(on ? D.clamp(0.25 + 0.15 * Math.sin(t * 2.3) + 0.75 * hit) : 0));
      for (const m of motes) {
        if (!on) { m.el.setAttribute("opacity", 0); continue; }
        const u = (t * m.sp + m.ph) % 1;
        const x = D.lerp(CHEST[0], COIN[0], u), y = D.lerp(CHEST[1], COIN[1], u) - Math.sin(Math.PI * u) * 150 + m.dy * Math.sin(Math.PI * u);
        m.el.setAttribute("cx", D.f(x)); m.el.setAttribute("cy", D.f(y));
        m.el.setAttribute("opacity", D.f(Math.sin(Math.PI * u) * 0.85));
      }
    });
    D.cap("最后问你一个问题：", S9, 151.5, { em: D.EM.gold });
    D.cap("如果有人出钱买你的<em>灵魂</em>，|你会怎么做？", 151.5, S10, { em: D.EM.gold });
    D.step(() => {
      tl.fromTo("#bargain", { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "power2.out", immediateRender: false }, S9);
      tl.fromTo("#bargain-img", { scale: 1, x: 0, y: 0 }, { scale: 1.05, x: -33, y: -40, duration: 8.6, ease: "none", immediateRender: false }, S9);
      tl.to("#bargain", { opacity: 0, duration: 0.6, ease: "power1.inOut" }, 157.4);
    });

    // ---------- 片尾 ----------
    D.text("蒸馏", 540, 200, { id: "end-title", anchor: "center", cls: "title", style: "left:0;right:0;width:auto;font-size:170px;letter-spacing:20px" });
    D.text("AI摄魂术", 540, 1290, { id: "end-wan", anchor: "center", style: "font-size:64px;font-weight:900;letter-spacing:16px;padding-left:16px;color:#f6e6c2;text-shadow:0 0 22px rgba(241,215,156,.45)" });
    D.text("参考文献<br>辛顿等《提炼神经网络中的知识》2015 · DeepSeek-AI《DeepSeek-R1》2025<br>Anthropic《检测与防范蒸馏攻击》2026 · 澎湃新闻《同事.skill》2026<br>澎湃新闻《孙燕姿回应 AI 孙燕姿》2023 · NBC News《ChatGPT 吉卜力风潮》2025<br>Etymonline「spirit」词条",
      540, 1430, { id: "end-cred", anchor: "center", cls: "credits" });
    D.step(() => {
      tl.fromTo("#end-title", { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", immediateRender: false }, S10 + 0.2);
      tl.fromTo("#end-wan", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S10 + 0.45);
      tl.fromTo("#end-cred", { opacity: 0 }, { opacity: 1, duration: 0.8, immediateRender: false }, S10 + 0.6);
    });
  };
})();
