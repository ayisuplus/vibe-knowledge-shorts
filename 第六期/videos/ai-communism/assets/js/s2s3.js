// S2 1958：公共食堂"吃饭不要钱" → 锅空了 → 1981 年决议"急于求成"（20.14–34.66）
// S3 马克思的前提（大白话）→ 门后的一天（34.66–59.40）
(function () {
  const D = window.D;

  // 线描小图标（96×96 视框，墨线）
  const ICON = {
    hunt: `<path d="M20 78 C 40 50, 40 30, 22 14" /><path d="M22 14 L 22 78" stroke-dasharray="3 5"/><path d="M14 46 L 82 46"/><path d="M70 38 L 84 46 L 70 54"/>`,
    fish: `<path d="M18 14 L 18 70"/><path d="M18 14 Q 60 10 74 40"/><path d="M74 40 L 74 58"/><path d="M50 70 q 14 -12 28 0 q -14 12 -28 0 z"/><path d="M78 70 l 10 -7 l 0 14 z"/>`,
    herd: `<ellipse cx="50" cy="52" rx="26" ry="16"/><circle cx="80" cy="44" r="8"/><path d="M34 66 L 34 80 M 46 68 L 46 82 M 58 68 L 58 82 M 68 66 L 68 80"/><path d="M30 44 q 6 -10 14 -2 q 6 -10 14 -2 q 6 -10 14 0"/>`,
    pen: `<path d="M16 76 L 16 24 Q 34 18 48 26 Q 62 18 80 24 L 80 76 Q 62 70 48 78 Q 34 70 16 76 Z"/><path d="M48 26 L 48 78"/><path d="M66 10 L 84 28 L 60 52 L 50 54 L 52 44 Z"/>`,
    code: `<rect x="12" y="18" width="72" height="48" rx="4"/><path d="M4 74 L 92 74"/><path d="M38 32 L 28 42 L 38 52 M 58 32 L 68 42 L 58 52 M 52 30 L 44 54"/>`,
    paint: `<path d="M48 14 C 20 14 10 40 16 58 C 22 76 40 70 44 62 C 48 54 58 58 64 62 C 76 70 88 50 84 36 C 80 22 66 14 48 14 Z"/><circle cx="32" cy="34" r="5"/><circle cx="50" cy="28" r="5"/><circle cx="68" cy="36" r="5"/><path d="M60 84 L 86 58"/>`,
    ball: `<circle cx="48" cy="48" r="32"/><path d="M48 32 L 62 42 L 57 58 L 39 58 L 34 42 Z"/><path d="M48 32 L 48 16 M 62 42 L 78 36 M 57 58 L 66 72 M 39 58 L 30 72 M 34 42 L 18 36"/>`,
    film: `<rect x="10" y="22" width="76" height="52" rx="4"/><path d="M10 34 L 86 34 M 10 62 L 86 62"/><path d="M22 22 L 22 34 M 38 22 L 38 34 M 54 22 L 54 34 M 70 22 L 70 34 M 22 62 L 22 74 M 38 62 L 38 74 M 54 62 L 54 74 M 70 62 L 70 74"/><path d="M42 40 L 58 48 L 42 56 Z"/>`,
  };

  D.scene23 = () => {
    const L = D.L.back;

    // ---------- S2 1958：公共食堂"吃饭不要钱" → 锅空了 → "急于求成"（20.14–34.66） ----------
    // 木刻版画风格的插画（不用写实图，避免被当成历史照片）；只用官方文件原话
    // v4 时间（配乐加长后）：食堂 20.14–31.90 → 空锅 31.90 → 1981 决议 35.4 → "为什么不行" 41.0–45.6
    const s2a = D.scene(L, 19.3, 32.7, 0.9, 0.01); // v15：从褪色的门叠化进来
    D.plate(s2a, "canteen-1958.jpg", { keys: [[20.14, 1.04, 0, 0], [32.0, 1.16, -50, 12]] });
    const dimA = D.black(s2a, 0);
    const fromWhite = D.el(s2a, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#fffaf0", opacity: 1 });
    D.op(fromWhite, 0); // v15：不再白闪
    D.onFrame((t) => { if (t > 20 && t < 32.1) D.op(dimA, 0.45 * D.prog(t, 24.7, 0.5)); });
    D.text("1958 年", 120, 90, { cls: "serif", style: "font-size:120px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [20.14, 24.9], slam: 1.4 });
    D.text(`<span class="chip" style="background:rgba(200,40,30,.9);color:#fff4e0;font-size:46px">农村公共食堂：吃饭不要钱</span><br><span style="font-size:28px;font-weight:700;color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.9)">当时的口号</span>`, 120, 260, { win: [20.8, 24.9] });
    D.sheet({
      x: 290, y: 250, w: 1340, h: 420, size: 52,
      lines: ["“看来，共产主义在我国的实现，", "已经<b>不是什么遥远将来的事情了</b>”"],
      src: "《中共中央关于在农村建立人民公社问题的决议》· 1958", write: [25.1, 27.6], win: [24.9, 31.8], slap: 24.9,
    });
    D.text("有人想：<em>提前跑进共产主义</em>", 960, 760, { anchor: "center", cls: "serif", style: "font-size:60px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [27.3, 31.8] });

    const s2b = D.scene(L, 31.9, 46.5, 0.8, 0.01); // v11：从满座的食堂叠化成空食堂
    D.plate(s2b, "canteen-empty.jpg", { keys: [[31.9, 1.14, 0, 0], [45.7, 1.02, 0, 0]] });
    const dimB = D.black(s2b, 0);
    D.onFrame((t) => { if (t > 31.8 && t < 45.8) D.op(dimB, 0.5 * D.prog(t, 35.2, 0.5)); });
    D.text("可粮食，很快就<em>不够了</em>", 960, 120, { anchor: "center", cls: "serif", style: "font-size:84px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [31.9, 35.3], slam: 1.3 });
    D.qcard("“急于求成，夸大了主观意志<br>和主观努力的作用”", "《关于建国以来党的若干历史问题的决议》· 1981", 960, 210, 1100, { win: [35.4, 45.5], size: 52, anchor: "center" });
    D.text(`<span style="font-size:34px;font-weight:700">后来的历史决议，这样总结</span>`, 960, 140, { anchor: "center", style: "color:#fff;text-shadow:0 2px 12px rgba(0,0,0,.9)", win: [35.6, 40.9] });
    D.text("为什么不行？", 960, 620, { anchor: "center", cls: "serif", style: "font-size:96px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [41.0, 45.5], slam: 1.3 });
    D.text("生产力还远远不够：机器太少，活全靠人干", 960, 790, { anchor: "center", cls: "serif", style: "font-size:48px;color:#f2cf7a;font-weight:800;letter-spacing:6px;text-shadow:0 4px 24px rgba(0,0,0,.9)", win: [42.2, 45.5] });

    // ---------- S3：马克思的前提（45.6–51.2）→ 看起来是一扇门，其实是双层门（51.2–60.17，门在 s4s5）→ 门后的生活（60.17–70.55） ----------
    const M = D.L.mid;
    // 马克思的前提：同一个人，"为了活着而干活" → 机器替他干活、他去读书画画（用户 2026-10-14："这么核心的观点，画面太简陋"）
    const pr = D.scene(M, 45.6, 51.25, 0.8, 0.3); // v11：从 1958 叠化进来
    D.plate(pr, "premise-before.jpg", { keys: [[45.6, 1.1, 60, 0], [48.9, 1.04, 30, 0]] });
    const prClip = D.el(D.defsEl, "clipPath", { id: "premClip" });
    const prRect = D.el(prClip, "rect", { x: 0, y: 0, width: 0, height: 1080 });
    const after = D.g(pr, { "clip-path": "url(#premClip)" });
    D.plate(after, "premise-after.jpg", { keys: [[48.3, 1.08, 40, 0], [51.25, 1.02, 0, 0]] });
    const prShade = D.el(pr, "rect", { x: 960, y: 0, width: 960, height: 1080, fill: "url(#premShade)" });
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="premShade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>`);
    // 擦除线：从左到右扫过去
    const wipeLine = D.el(pr, "rect", { x: 0, y: 0, width: 8, height: 1080, fill: "#fff6d6", filter: "url(#glow)", opacity: 0 });
    D.onFrame((t) => {
      if (t < 45.5 || t > 51.4) return;
      const k = D.prog(t, 48.3, 0.9, D.ease.inOut);
      D.attr(prRect, "width", 1920 * k);
      D.attr(wipeLine, "x", 1920 * k - 4);
      D.op(wipeLine, k > 0 && k < 1 ? 1 : 0);
    });
    D.sheet({
      x: 1130, y: 60, w: 720, h: 270, size: 34, rot: 1.2,
      lines: ["“劳动已经<b>不仅仅是谋生的手段</b>，", "而且本身成了生活的第一需要”"],
      src: "《哥达纲领批判》", write: [45.85, 47.4],
      seal: { text: "马克思 · 1875", t: 47.6, x: 40, y: 30, size: 26 },
      win: [45.6, 51.1], slap: 45.6,
    });
    D.text("回到马克思那个设想：", 1400, 470, { anchor: "center", cls: "serif", style: "font-size:46px;color:#f2cf7a;" + "font-weight:800;color:#fff;letter-spacing:5px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)".replace("color:#fff;", ""), win: [45.8, 51.1] });
    D.text("等机器能干完<br>大部分的活", 1400, 560, { anchor: "center", cls: "serif", style: "font-size:70px;line-height:1.35;font-weight:800;color:#fff;letter-spacing:5px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [46.2, 48.4] });
    D.text("人才能<em>不再为了<br>活着而干活</em>", 1400, 560, { anchor: "center", cls: "serif", style: "font-size:70px;line-height:1.35;font-weight:800;color:#fff;letter-spacing:5px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [48.6, 51.1] });
    // v17：同一扇门，看起来是一扇，其实是双层（门画在 s4s5 里；53.5 一道光扫过，外层变透明露出里层）
    const DS = "font-size:58px;font-weight:800;color:#1e1b18;letter-spacing:3px;line-height:1.55";
    D.text("看起来，<br>这是<em style='color:#c8281e'>一扇门</em>", 330, 400, { anchor: "center", cls: "serif", style: DS, win: [51.4, 53.7] });
    D.text("其实，<br>它是<em style='color:#c8281e'>双层门</em>", 330, 400, { anchor: "center", cls: "serif", style: DS, win: [53.9, 60.1] });
    D.text("外层：<em style='color:#c8281e'>生产力</em><br><span style='font-size:38px;color:#5a4630'>机器够不够能干</span><br><br>里层：<em style='color:#c8281e'>分配</em><br><span style='font-size:38px;color:#5a4630'>东西怎么分</span>", 1600, 260, { anchor: "center", cls: "serif", style: "font-size:52px;font-weight:800;color:#1e1b18;letter-spacing:3px;line-height:1.35", win: [54.4, 57.1] });
    D.text("门上写着这个社会的口号", 1600, 300, { anchor: "center", cls: "serif", style: "font-size:40px;font-weight:700;color:#5a4630;letter-spacing:3px", win: [57.2, 60.1] });
    D.text("能干多少，干多少<br>需要多少，拿多少", 1600, 380, { anchor: "center", cls: "serif", style: "font-size:52px;font-weight:800;color:#c8281e;letter-spacing:4px;line-height:1.5", win: [57.6, 60.1] });
    D.text("↖ 这八个字的意思", 1600, 560, { anchor: "center", style: "font-size:30px;font-weight:500;color:rgba(42,32,24,.7)", win: [57.6, 60.1] });
    // 门后的生活（60.17–70.55）
    D.text("门后面的生活", 960, 40, { anchor: "center", cls: "serif", style: "font-size:56px;font-weight:800;color:#1e1b18;letter-spacing:6px", win: [60.17, 70.45] });
    D.sheet({
      x: 260, y: 130, w: 1400, h: 200, size: 42,
      lines: ["“上午打猎，下午捕鱼，傍晚从事畜牧，晚饭后从事批判”"], src: "马克思、恩格斯《德意志意识形态》· 1845",
      write: [60.3, 61.9], win: [60.17, 70.45], slap: 60.17,
    });
    D.text("放到今天 →", 960, 352, { anchor: "center", cls: "serif", style: "font-size:42px;font-weight:800;color:#1f5f7a;letter-spacing:4px", win: [66.41, 70.4] });
    const tiles = D.g(M);
    const TIMES = [60.6, 61.99, 63.38, 64.77], FLIPS = [66.41, 67.1, 67.8, 68.49];
    const OLD = [["上午", "打猎", "hunt"], ["下午", "捕鱼", "fish"], ["傍晚", "畜牧", "herd"], ["晚饭后", "批判", "pen"]];
    const NEW = [["上午", "写代码", "code"], ["下午", "画画", "paint"], ["傍晚", "踢球", "ball"], ["晚饭后", "剪视频", "film"]];
    const cards = OLD.map((o, i) => {
      const g = D.g(tiles), face = D.g(g, { transform: "scale(1.05)" });
      const mk = ([when, what, ic], modern) => {
        const f = D.g(face);
        D.el(f, "rect", { x: -165, y: -200, width: 330, height: 400, rx: 18, fill: modern ? "#f4f7f8" : "#e9dcc0", stroke: modern ? "#7fc8e8" : "#5a4630", "stroke-width": 4, filter: "url(#shadowD)" });
        D.el(f, "text", { y: -140, "text-anchor": "middle", class: "serif", "font-size": 36, fill: modern ? "#2a6f8f" : "#5a4630" }, when);
        D.svg(f, ICON[ic], { transform: "translate(-96 -112) scale(2)", fill: "none", stroke: modern ? "#1f3440" : "#2a1c10", "stroke-width": 3.2, "stroke-linecap": "round", "stroke-linejoin": "round" });
        D.el(f, "text", { y: 150, "text-anchor": "middle", class: "serif", "font-size": 54, fill: "#1e1b18", "letter-spacing": 4 }, what);
        return f;
      };
      return { g, face, a: mk(o, false), b: mk(NEW[i], true), x: 315 + i * 430 };
    });
    D.onFrame((t) => {
      if (t < 60 || t > 70.7) { cards.forEach((c) => D.op(c.g, 0)); return; }
      cards.forEach((c, i) => {
        const s = t < TIMES[i] ? 0 : D.pop(t, TIMES[i], 0.45);
        D.tf(c.g, c.x, 650, s);
        D.op(c.g, t < TIMES[i] ? 0 : 1 - D.prog(t, 70.1, 0.35));
        const k = D.clamp((t - FLIPS[i]) / 0.42);
        const sx = Math.abs(Math.cos(k * Math.PI));
        c.face.setAttribute("transform", `scale(${D.f(1.05 * Math.max(0.02, sx))} 1.05)`);
        D.op(c.a, k < 0.5 ? 1 : 0); D.op(c.b, k >= 0.5 ? 1 : 0);
      });
    });
  };
})();
