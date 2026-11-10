// S0 钩子：暖光里玻璃外的工人 → 1857 年手稿 → 他的设想 → 化成一扇门（0–21.30，v10）
// S1 片名：半开的门（21.30–26.14；代码里仍写 15.30–20.14，整体 D.shifted 6 秒）
(function () {
  const D = window.D;

  D.scene01 = () => {
    const L = D.L.back;
    const LIGHTS = [1.45, 2.14, 2.83, 3.53];

    // ---------- 开场：暖光里，工人站在玻璃外（0–15.30） ----------
    // v4：去掉黑屏绿点和冷白产线（用户觉得劝退），第一个镜头就给人
    const s0b = D.scene(L, -0.8, 21.4, 0.8, 0.01); // v20：从开场的纸面叠化进来 // 和片名重叠几帧，避免 21.30 那一帧两边都透明
    D.plate(s0b, "factory-warm.jpg", { keys: [[0, 1.22, 200, 30], [7.0, 1.08, 80, 10], [21.3, 1.0, 0, 0]] });
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="topB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140c06" stop-opacity=".72"/><stop offset="1" stop-color="#140c06" stop-opacity="0"/></linearGradient>`);
    D.el(s0b, "rect", { x: 0, y: 0, width: 1920, height: 400, fill: "url(#topB)" });
    const fadeIn = D.black(s0b, 1);
    D.op(fadeIn, 0); // v20：不再从黑里出来
    D.text("这座工厂，已经<em>不需要他了</em>", 1250, 110, { anchor: "center", cls: "serif", style: "font-size:84px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.85),0 0 12px rgba(0,0,0,.5)", win: [0.5, 6.9], slam: 1.3 });
    D.text(`<span class="chip" style="background:rgba(14,12,10,.65);color:#f4ead6;font-size:34px">机器 24 小时运转，不用开灯</span>`, 1250, 250, { anchor: "center", win: [2.4, 6.9] });
    // v10：手稿之后，把他的设想说出来（12.56–16.8）
    const SH = "text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)";
    D.text("他由此写下一个设想：", 1290, 400, { anchor: "center", cls: "serif", style: `font-size:46px;font-weight:800;color:#f2cf7a;letter-spacing:5px;${SH}`, win: [12.56, 16.8] });
    D.text("等机器干完大部分的活，<br>人就不必再<em style='color:#ffb59a'>为了活着而干活</em>", 1290, 480, { anchor: "center", cls: "serif", style: `font-size:60px;line-height:1.45;font-weight:800;color:#fff;letter-spacing:5px;${SH}`, win: [13.1, 16.8] });
    // v22：16.8 起叠化成"工人站在一扇关着的门前"（结尾同一扇门会被推开，首尾呼应）；21.3 叠化成片名里半开的门
    const closed = D.g(s0b, { opacity: 0 });
    D.plate(closed, "door-closed.jpg", { keys: [[16.8, 1.0, 0, 0], [21.4, 1.06, 0, 18]] });
    const dark = D.el(s0b, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#120a05", opacity: 0 });
    // v23：开门前，门缝里的光先亮起来、变宽
    const seamG = D.g(closed);
    const seamGlow = D.el(seamG, "rect", { y: 290, height: 470, fill: "#ffcf7a", filter: "url(#blur16)", opacity: 0 });
    const seam = D.el(seamG, "rect", { y: 305, height: 440, fill: "#fff6e0", opacity: 0 });
    D.onFrame((t) => {
      if (t < 12.5 || t > 21.5) return;
      const k = D.prog(t, 19.9, 1.3, D.ease.in), w = 6 + 50 * k;
      D.attr(seam, "x", D.f(956 - w / 2)); D.attr(seam, "width", D.f(w)); D.op(seam, k);
      D.attr(seamGlow, "x", D.f(956 - w * 2)); D.attr(seamGlow, "width", D.f(w * 4)); D.op(seamGlow, 0.8 * k);
      D.op(dark, 0.4 * D.prog(t, 12.6, 0.6, D.ease.inOut) * (1 - D.prog(t, 16.8, 0.9)));
      D.op(closed, D.prog(t, 16.8, 0.9, D.ease.inOut));
    });
    D.text("这是一扇<em style='color:#ffcf7a'>门</em>", 960, 70, { anchor: "center", cls: "serif", style: `font-size:84px;font-weight:800;color:#fff;letter-spacing:10px;${SH}`, win: [17.3, 20.9] });
    D.text("门后，是马克思说的<em style='color:#ffcf7a'>共产主义</em>", 960, 190, { anchor: "center", cls: "serif", style: `font-size:52px;font-weight:800;color:#fff4dc;letter-spacing:5px;${SH}`, win: [17.9, 20.9] });
    D.text("169 年过去，门一直<em style='color:#ffcf7a'>关着</em>", 960, 270, { anchor: "center", cls: "serif", style: `font-size:46px;font-weight:700;color:rgba(255,244,220,.85);letter-spacing:5px;${SH}`, win: [18.9, 20.9] });
    D.sheet({
      x: 860, y: 150, w: 860, h: 560, rot: 1.6, size: 52, tape: true, slap: 7.01,
      lines: ["“工人不再是生产过程的", "主要作用者，而是", "<b>站在生产过程的旁边</b>。”"],
      src: "《政治经济学批判（1857—1858 年手稿）》", write: [7.12, 9.45],
      seal: { text: "马克思 · 1857", t: 9.8, x: 70, y: 58, size: 40 }, win: [7.01, 13.1],
      alpha: (t) => D.lerp(1, 0.42, D.prog(t, 12.56, 0.8, D.ease.inOut)),
    });

    // ---------- S1 片名（15.30–23.70，v15）：石厅里半开的巨门，片名逐字浮现；然后门暗下来、褪成旧照片色——
    // "在 AI 之前，就有人想推开这扇门"——叠化进 1958。不再冲进门缝：门后面是未来，1958 是门外的一次尝试 ----------
    D.shifted(6.0, () => {
    const s1 = D.scene(L, 14.6, 23.7, 0.8, 0.01); // v22：从关着的门叠化成半开的门
    // 门缝在画面里的位置约 (910, 600)：以它为锚点推进
    const GX = 960, GY = 600; // v23：推向工人和门
    const tk = (t, sc) => [t, sc, (sc - 1) * (960 - GX), (sc - 1) * (540 - GY)];
    const TK = [tk(15.3, 1.0), tk(19.3, 1.07), tk(23.7, 1.14)];
    D.plate(s1, "door-half-worker.jpg", { keys: TK }); // v23：同一个工人，门开了一半
    // 褪色版（旧照片）：同一张图、同样的推进，叠在上面慢慢显出来
    D.defsEl.insertAdjacentHTML("beforeend", `<filter id="oldphoto"><feColorMatrix type="matrix" values="0.36 0.50 0.12 0 0.04  0.30 0.46 0.10 0 0.02  0.22 0.34 0.08 0 0  0 0 0 1 0"/></filter>`);
    const old = D.plate(s1, "door-half-worker.jpg", { keys: TK, filter: "url(#oldphoto)" });
    const dimT = D.el(s1, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#140c06", opacity: 0 });
    // 光线一层轻微呼吸
    const rays = D.el(s1, "ellipse", { cx: GX, cy: GY, rx: 260, ry: 420, fill: "url(#warm)", opacity: 0 });
    const whiteIn = D.el(s1, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "#fffaf0", opacity: 0 });
    D.onFrame((t) => {
      if (t < 15.2 || t > 23.8) return;
      const fadeOld = D.prog(t, 19.7, 1.0, D.ease.inOut);
      D.op(rays, (0.35 + 0.15 * Math.sin(t * 2.4)) * (1 - fadeOld));
      // 进场：白光闪一下（从钩子的白光接过来）；出场：不再白，而是褪色、变暗
      D.op(whiteIn, 0);
      D.op(old.g, fadeOld);
      D.op(dimT, 0.5 * fadeOld);
    });
    // 片名：逐字浮现（每个字从下往上、由虚到实）
    const titleLine = (txt, y, size, color, t0, id, extra = "font-weight:800;letter-spacing:10px;text-shadow:0 0 40px rgba(255,190,90,.55),0 6px 30px rgba(0,0,0,.85)") => {
      const spans = [...txt].map((ch, i) => `<span data-i="${i}"${ch === "，" ? " data-layout-ignore" : ""} style="display:inline-block;opacity:0${ch === "，" ? ";width:0.68em;overflow:visible" : ""}">${ch === " " ? "&nbsp;" : ch}</span>`).join("");
      D.text(spans, 960, y, { id, anchor: "center", cls: "serif", style: `font-size:${size}px;color:${color};${extra}`, win: [t0 - 0.05, 19.9], still: true, d: 0.05 });
      let els = null;
      D.onFrame((t) => {
        if (t < t0 - 0.1 || t > 20.0) return;
        els = els || [...D.$(id).querySelectorAll("span")];
        els.forEach((e, i) => {
          const k = D.ease.out(D.clamp((t - t0 - i * 0.07) / 0.45));
          e.style.opacity = D.f(k);
          e.style.transform = `translateY(${D.f((1 - k) * 26)}px)`;
          e.style.filter = `blur(${D.f((1 - k) * 8)}px)`;
        });
      });
    };
    // v12：两行都用门里的暖光色——上行米白、下行暖金带辉光（不再用大红，和金色门光冲突）
    titleLine("而在今天，", 80, 92, "#fbefd8", 15.45, "title-l1", "font-weight:700;letter-spacing:14px;text-shadow:0 0 30px rgba(255,200,120,.45),0 4px 24px rgba(0,0,0,.9)");
    // 过渡：1958 是 AI 之前的一次尝试（在门外），不是门后面
    const SHB = "text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)";
    D.text("其实，在 AI 之前", 960, 400, { anchor: "center", cls: "serif", style: `font-size:56px;font-weight:700;color:#f0e2c4;letter-spacing:8px;${SHB}`, win: [20.2, 23.4] });
    D.text("就有人想<em style='color:#ffd27a'>推开这扇门</em>", 960, 500, { anchor: "center", cls: "serif", style: `font-size:84px;font-weight:800;color:#fff4dc;letter-spacing:8px;${SHB}`, win: [20.8, 23.4] });
    titleLine("AI 终于把这扇门打开了一半", 205, 104, "#ffd27a", 16.4, "title-l2", "font-weight:900;letter-spacing:12px;text-shadow:0 0 24px rgba(255,205,120,.9),0 0 70px rgba(255,160,60,.55),0 6px 26px rgba(0,0,0,.85)");
    });
  };
})();
