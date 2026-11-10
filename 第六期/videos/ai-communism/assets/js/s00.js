// S00 开场（0–17.531，v20）：AI 时代，人人都在聊各种主义 → 三个主义各一句话 →
// "这些主义，大多在回答：一个人该怎么活" → "今天聊一个回答'所有人该怎么活'的主义：共产主义" →
// "听起来很遥远？要聊它，得先从今天的一座工厂说起" → 叠化进工厂。
// 时间都踩在配乐 M1 开头的拍点上（每拍约 0.43 秒）；背景是三层慢慢漂过的"主义"，镜头缓缓推近。
(function () {
  const D = window.D;

  D.INTRO = 17.531; // M1 第 0 拍到第 40 拍；之后全片整体后移这么多
  const B = [0.163, 0.604, 0.998, 1.44, 1.881, 2.299, 2.717, 3.158, 3.576, 3.994, 4.412, 4.853, 5.271, 5.759, 6.246, 6.734, 7.198, 7.639, 8.057, 8.475,
    8.986, 9.474, 9.938, 10.379, 10.797, 11.192, 11.656, 12.098, 12.516, 12.934, 13.375, 13.793, 14.234, 14.675, 15.093, 15.534, 15.975, 16.393, 16.834, 17.252];
  D.INTRO_BEATS = B;

  D.sceneIntro = () => {
    const L = D.L.back;
    const s = D.scene(L, -1, D.INTRO + 0.05, 0.01);
    const cam = D.g(s);
    D.el(cam, "rect", { x: -100, y: -100, width: 2120, height: 1280, fill: "url(#paperbg)" });
    D.plate(cam, "parchment.jpg").g.setAttribute("opacity", 0.45);

    // ---------- 背景：三层慢慢漂过的"主义"（远小淡、近大浓，速度不同、方向交替）----------
    const ISMS = ["存在主义", "虚无主义", "唯物主义", "消费主义", "长期主义", "极简主义", "躺平主义", "实用主义", "享乐主义", "理想主义", "斯多葛主义", "完美主义",
      "乐观主义", "悲观主义", "浪漫主义", "现实主义", "功利主义", "怀疑主义", "唯心主义", "经验主义", "犬儒主义", "禁欲主义", "个人主义", "折中主义"];
    D.defsEl.insertAdjacentHTML("beforeend", `<filter id="farblur"><feGaussianBlur stdDeviation="2.2"/></filter>`);
    const LAYERS = [
      { rows: [110, 330, 560, 790, 1000], size: 42, op: 0.05, speed: 14, filter: "url(#farblur)" },
      { rows: [220, 450, 680, 900], size: 64, op: 0.065, speed: 26, filter: "" },
      { rows: [160, 620, 960], size: 104, op: 0.06, speed: 44, filter: "" },
    ];
    const drift = [];
    LAYERS.forEach((ly, li) => {
      const lg = D.g(cam, ly.filter ? { filter: ly.filter } : {});
      ly.rows.forEach((y, ri) => {
        const dir = (ri + li) % 2 ? 1 : -1;
        const row = D.g(lg);
        let x = -200 + D.hash(li * 9 + ri) * 300;
        for (let k = 0; k < 14; k++) {
          const w = ISMS[(li * 7 + ri * 5 + k * 3) % ISMS.length];
          D.el(row, "text", { x, y, class: k % 3 ? "" : "serif", "font-size": ly.size, "font-weight": 700, fill: "#2a2018", opacity: ly.op }, w);
          x += w.length * ly.size + 70 + D.hash(k * 3.1 + ri) * 120;
        }
        drift.push({ row, dir, speed: ly.speed, base: dir > 0 ? -900 : 0 });
      });
    });
    const bgWords = D.g(cam); // 占位：让 drift 层整体可调暗
    // 中央留白：和纸同色的柔光，主文字在上面更清楚
    D.defsEl.insertAdjacentHTML("beforeend", `<radialGradient id="clearing"><stop offset="0" stop-color="#efe5cf" stop-opacity=".92"/><stop offset=".6" stop-color="#efe5cf" stop-opacity=".6"/><stop offset="1" stop-color="#efe5cf" stop-opacity="0"/></radialGradient>`);
    D.el(cam, "ellipse", { cx: 960, cy: 520, rx: 900, ry: 420, fill: "url(#clearing)" });
    D.onFrame((t) => {
      if (t > D.INTRO + 0.1) return;
      // 镜头缓缓推近
      const z = 1 + 0.06 * D.clamp(t / D.INTRO);
      cam.setAttribute("transform", `translate(960 540) scale(${D.f(z)}) translate(-960 -540)`);
      // 背景词：先淡入，到"这些主义，大多在回答"时暗下去
      const dim = (1 - D.prog(t, B[22] - 0.2, 0.8)) * D.prog(t, 0, 1.4) + 0.25 * D.prog(t, B[22] - 0.2, 0.8);
      drift.forEach((d) => {
        d.row.setAttribute("transform", `translate(${D.f(d.base + d.dir * d.speed * t)} 0)`);
        D.op(d.row, dim);
      });
    });

    // ---------- 逐字浮现（由虚到实、从下往上）----------
    let n = 0;
    const reveal = (txt, x, y, style, t0, t1, step = 0.06) => {
      const id = `intro-${n++}`;
      const spans = [...txt].map((ch, i) => `<span data-i="${i}" style="display:inline-block;opacity:0">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
      D.text(spans, x, y, { id, anchor: "center", cls: "serif", style, win: [t0 - 0.05, t1], still: true, d: 0.35 });
      let els = null;
      D.onFrame((t) => {
        if (t < t0 - 0.1 || t > t1 + 0.1) return;
        els = els || [...D.$(id).querySelectorAll("span")];
        els.forEach((e, i) => {
          const k = D.ease.out(D.clamp((t - t0 - i * step) / 0.5));
          e.style.opacity = D.f(k);
          e.style.transform = `translateY(${D.f((1 - k) * 22)}px)`;
          e.style.filter = `blur(${D.f((1 - k) * 7)}px)`;
        });
      });
      return id;
    };
    const INK = "color:#1e1b18", SOFT = "color:#4a3a28";

    // ① AI 时代 / 人人都在聊各种主义
    reveal("AI 时代", 960, 300, `font-size:170px;font-weight:800;${INK};letter-spacing:22px`, B[0], B[6] + 0.3, 0.1);
    D.text("人人都在聊各种<em style='color:#c8281e'>「主义」</em>", 960, 540, { anchor: "center", cls: "serif", style: `font-size:60px;font-weight:700;${SOFT};letter-spacing:8px`, win: [B[4], B[6] + 0.3], d: 0.45 });

    // ② 三个主义，各配一句话
    const CARD = [
      ["存在主义", "人生的意义，得自己去找", B[7], B[11] + 0.3],
      ["虚无主义", "反正，一切都没有意义", B[12], B[16] + 0.3],
      ["唯物主义", "先有物质，后有意识", B[17], B[21] + 0.25],
    ];
    CARD.forEach(([name, gloss, t0, t1], i) => {
      reveal(name, 960, 330, `font-size:150px;font-weight:800;${INK};letter-spacing:18px`, t0, t1, 0.08);
      D.text(gloss, 960, 560, { anchor: "center", cls: "serif", style: `font-size:58px;font-weight:600;${SOFT};letter-spacing:6px`, win: [t0 + 0.45, t1], d: 0.45 });
      // 一笔墨线
      const ul = D.el(s, "path", { d: "M700 535 C 820 545, 1100 528, 1220 538", fill: "none", stroke: "#2a2018", "stroke-width": 6, "stroke-linecap": "round", opacity: 0.5 });
      const len = 530;
      D.onFrame((t) => {
        if (t < t0 - 0.1 || t > t1 + 0.4) { D.op(ul, 0); return; }
        D.attr(ul, "stroke-dasharray", `${len} ${len}`);
        D.attr(ul, "stroke-dashoffset", D.f(len * (1 - D.ease.inOut(D.prog(t, t0 + 0.25, 0.5)))));
        D.op(ul, 0.5 * (1 - D.prog(t, t1 - 0.3, 0.4)));
      });
    });

    // ③ 转折：一个人 vs 所有人
    D.text("这些主义，大多在回答：", 960, 300, { anchor: "center", cls: "serif", style: `font-size:56px;font-weight:700;${SOFT};letter-spacing:6px`, win: [B[22], B[25] + 0.3], d: 0.45 });
    reveal("一个人，该怎么活", 960, 400, `font-size:104px;font-weight:800;${INK};letter-spacing:12px`, B[23], B[25] + 0.3, 0.07);
    D.text("今天，我们聊一个回答", 960, 230, { anchor: "center", cls: "serif", style: `font-size:56px;font-weight:700;${SOFT};letter-spacing:6px`, win: [B[26], B[33] + 0.2], d: 0.45 });
    reveal("「所有人该怎么活」的主义", 960, 320, `font-size:84px;font-weight:800;${INK};letter-spacing:8px`, B[27], B[33] + 0.2, 0.05);
    const glow = D.el(s, "ellipse", { cx: 960, cy: 600, rx: 640, ry: 190, fill: "url(#redglow)", opacity: 0 });
    reveal("共产主义", 960, 470, "font-size:200px;font-weight:900;color:#c8281e;letter-spacing:30px;text-shadow:0 6px 40px rgba(200,40,30,.3)", B[29], D.INTRO - 0.45, 0.14);
    const red = D.el(s, "path", { d: "M560 735 C 760 752, 1160 722, 1370 740", fill: "none", stroke: "#c8281e", "stroke-width": 12, "stroke-linecap": "round", opacity: 0 });
    D.onFrame((t) => {
      if (t > D.INTRO + 0.1) return;
      D.op(glow, 0.5 * D.prog(t, B[29], 0.8) * (1 - D.prog(t, D.INTRO - 1.2, 0.8)));
      D.attr(red, "stroke-dasharray", "830 830");
      D.attr(red, "stroke-dashoffset", D.f(830 * (1 - D.ease.inOut(D.prog(t, B[30], 0.7)))));
      D.op(red, (t > B[30] ? 0.85 : 0) * (1 - D.prog(t, D.INTRO - 1.0, 0.6)));
    });

    // ④ 接正片：听起来很遥远？要聊它，得先从今天的一座工厂说起（工厂画面随后叠化进来）
    D.text("听起来很遥远？", 960, 770, { anchor: "center", cls: "serif", style: `font-size:46px;font-weight:700;${SOFT};letter-spacing:6px`, win: [B[34], D.INTRO - 0.4], d: 0.4 });
    D.text("要聊它，得先从<em style='color:#c8281e'>一个工人和他的工厂</em>说起", 960, 830, { anchor: "center", cls: "serif", style: `font-size:40px;font-weight:700;${SOFT};letter-spacing:5px`, win: [B[35], D.INTRO - 0.4], d: 0.4 });
    void bgWords;
  };
})();
