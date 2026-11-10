// S8 2026 · 争议（121.23–148.86） · S9 此刻 · 你（148.86–157.37） · S10 片尾（157.37–160.17）
(function () {
  const D = window.D, C = D.C, tl = D.tl, el = D.el;

  D.scene810 = () => {
    const S8 = 121.23, S9 = 148.86, S10 = 157.37;
    D.year(S8, "2026");
    D.caseInfo(S8, S9, { place: "美国 · 中国", en: "Detecting and preventing distillation attacks", zh: "《检测与防范蒸馏攻击》", by: "一家美国 AI 公司 · 2026", seal: "争" });
    D.caseInfo(S9, 157.2, { place: "此刻 · 你" });

    // ---------- 老师的瓶子 + 火漆封印 ----------
    const s8 = D.wrap(D.L.mid, "s8", { opacity: 0 });
    el(s8, "ellipse", { cx: 540, cy: 875, rx: 240, ry: 24, fill: "url(#shadow)" });
    const tf = D.flask(s8, 540, 700, 160, { level: 0.6, neck: 0.75 });
    el(s8, "rect", { x: 540 - 46, y: tf.top - 30, width: 92, height: 36, rx: 6, fill: "#6b4a2a" });
    const wax = D.wrap(s8, "wax", { opacity: 0 });
    el(wax, "path", { d: `M${540 - 58} ${tf.top - 34} C${540 - 40} ${tf.top - 60} ${540 + 40} ${tf.top - 60} ${540 + 58} ${tf.top - 34} C${540 + 62} ${tf.top - 10} ${540 + 50} ${tf.top + 18} ${540 + 40} ${tf.top + 30} C${540 + 34} ${tf.top + 10} ${540 + 20} ${tf.top + 8} ${540 + 10} ${tf.top + 14} C${540} ${tf.top + 40} ${540 - 14} ${tf.top + 40} ${540 - 18} ${tf.top + 10} C${540 - 30} ${tf.top + 6} ${540 - 50} ${tf.top + 14} ${540 - 58} ${tf.top - 34} Z`, fill: "#8e2a1e", filter: "url(#drop)" });
    el(wax, "circle", { cx: 540, cy: tf.top - 20, r: 24, fill: "#a8382a", stroke: "#6e1c12", "stroke-width": 3 });
    el(wax, "text", { x: 540, y: tf.top - 10, "text-anchor": "middle", "font-family": "DSerif", "font-weight": 900, "font-size": 26, fill: "#f2d6c8" }, "封");
    // 伸进来的吸管
    const straws = D.wrap(s8, "straws", { opacity: 0 });
    const sList = [];
    for (let i = 0; i < 22; i++) {
      const left = i % 2 === 0;
      const sy = 360 + D.hash(i * 3) * 1000;
      const ex = 540 + (left ? -1 : 1) * (20 + D.hash(i * 7) * 90), ey = 640 + D.hash(i * 11) * 140;
      const sx = left ? -30 : 1110;
      const d = `M${sx} ${D.f(sy)} C${D.f(left ? 220 : 860)} ${D.f(sy - 60)} ${D.f(ex + (left ? -160 : 160))} ${D.f(ey - 220)} ${D.f(ex)} ${D.f(ey)}`;
      const glassP = el(straws, "path", { d, fill: "none", stroke: "#f6e7c8", "stroke-opacity": 0.45, "stroke-width": 5, "stroke-linecap": "round" });
      const L = glassP.getTotalLength();
      glassP.setAttribute("stroke-dasharray", D.f(L)); glassP.setAttribute("stroke-dashoffset", D.f(L));
      const dot = el(straws, "circle", { r: 3.2, fill: "#f0b45a", opacity: 0 });
      sList.push({ p: glassP, L, dot, t0: 125.48 + D.hash(i * 13) * 1.2, ph: D.hash(i) });
    }
    D.onFrame((t) => {
      if (t < 125 || t > 140.8) return;
      for (const s of sList) {
        const k = D.clamp((t - s.t0) / 0.8);
        s.p.setAttribute("stroke-dashoffset", D.f(s.L * (1 - D.ease.out(k))));
        if (k >= 1) { const u = 1 - ((s.ph + (t - s.t0) * 0.4) % 1); const pt = s.p.getPointAtLength(s.L * u); s.dot.setAttribute("cx", D.f(pt.x)); s.dot.setAttribute("cy", D.f(pt.y)); s.dot.setAttribute("opacity", 0.9); }
        else s.dot.setAttribute("opacity", 0);
      }
    });

    // ---------- 账簿卡片 ----------
    D.text(`<span class="k">2026 年 2 月 · 一家美国 AI 公司称</span><div class="big"><span id="num-1600">0</span>万+ <span class="s" style="font-family:'DSerif';font-weight:800;font-size:44px">次对话</span></div><div class="s">约 2.4 万个账号</div>`, 140, 1010, { id: "led-1", cls: "card", style: "width:800px" });
    D.sealAt("指控", 820, 990, 120, 129.9, 136.2, { fs: 40, rot: -8, id: "seal-a1" });
    D.onFrame((t) => { if (t < 132 || t > 136.5) return; const e = document.getElementById("num-1600"); if (e) e.textContent = String(Math.round(1600 * D.ease.out(D.clamp((t - 132.66) / 0.8)))); });
    D.text(`<span class="k">2026 年 4 月 · 美国白宫备忘录</span><div class="zhbig" style="font-size:44px">存在主要来自中国的<br>「工业规模」蒸馏行动</div>`, 140, 960, { id: "led-2", cls: "card", style: "width:800px" });
    D.sealAt("指控", 820, 940, 120, 136.35, 140.4, { fs: 40, rot: -8, id: "seal-a2" });
    D.text(`<div class="zhbig">中国大使馆：毫无根据</div>`, 140, 1230, { id: "led-3", cls: "card", style: "width:800px;background:linear-gradient(180deg,#f6eedb,#e3d6b8)" });
    D.sealAt("否认", 820, 1210, 120, 138.45, 140.4, { fs: 40, rot: 8, ink: true, id: "seal-d" });

    // ---------- 天平 ----------
    const bal = D.wrap(D.L.mid, "balance", { opacity: 0 });
    el(bal, "ellipse", { cx: 540, cy: 1265, rx: 230, ry: 22, fill: "url(#shadow)" });
    el(bal, "path", { d: "M440 1260 L640 1260 L600 1225 L480 1225 Z", fill: "url(#brass)" });
    el(bal, "rect", { x: 530, y: 560, width: 20, height: 670, rx: 8, fill: "url(#brass)" });
    el(bal, "circle", { cx: 540, cy: 556, r: 18, fill: "url(#brass)" });
    const beam = el(bal, "g");
    el(beam, "rect", { x: 230, y: 548, width: 620, height: 16, rx: 8, fill: "url(#brass)", filter: "url(#drop)" });
    el(beam, "path", { d: "M540 556 L520 520 L560 520 Z", fill: "url(#brassV)" });
    const pan = (side) => {
      const g = el(bal, "g");
      [-70, 0, 70].forEach((dx) => el(g, "line", { x1: 0, y1: 0, x2: dx, y2: 300, stroke: "#c9a66a", "stroke-width": 2 }));
      el(g, "path", { d: "M-110 300 Q0 360 110 300 Z", fill: "url(#brass)", filter: "url(#drop)" });
      el(g, "circle", { cx: 0, cy: 0, r: 7, fill: "url(#brass)" });
      if (side === "L") {
        [["#6b2a1a", 0], ["#3e4a2a", 1], ["#2a3a5a", 2]].forEach(([c, k]) => { el(g, "rect", { x: -70 + k * 6, y: 266 - k * 30, width: 140, height: 28, rx: 3, fill: c, stroke: "#d6b06a", "stroke-width": 1.5 }); el(g, "line", { x1: -60 + k * 6, y1: 272 - k * 30, x2: 60 + k * 6, y2: 272 - k * 30, stroke: "#d6b06a", "stroke-width": 1, opacity: 0.6 }); });
      } else {
        [0, 1, 2, 3].forEach((k) => { el(g, "rect", { x: -64 + (k % 2) * 20, y: 268 - k * 26, width: 108, height: 24, rx: 11, fill: "url(#paper)", stroke: "#8a6e42", "stroke-width": 1.2 }); el(g, "line", { x1: -50 + (k % 2) * 20, y1: 280 - k * 26, x2: 20 + (k % 2) * 20, y2: 280 - k * 26, stroke: "#6b4a2a", "stroke-width": 2, opacity: 0.5 }); });
      }
      return g;
    };
    const pL = pan("L"), pR = pan("R");
    D.onFrame((t) => {
      if (t < 140 || t > 149) return;
      const a = 7 * Math.sin((t - 140.4) * 1.7) + 3 * Math.sin((t - 140.4) * 0.63 + 1);
      beam.setAttribute("transform", `rotate(${D.f(a)} 540 556)`);
      const rad = (a * Math.PI) / 180;
      const lx = 540 - 300 * Math.cos(rad), ly = 556 - 300 * Math.sin(rad), rx = 540 + 300 * Math.cos(rad), ry = 556 + 300 * Math.sin(rad);
      pL.setAttribute("transform", `translate(${D.f(lx)} ${D.f(ly)})`);
      pR.setAttribute("transform", `translate(${D.f(rx)} ${D.f(ry)})`);
    });
    D.text("用人写的书训练 AI：<br>合理使用", 240, 1000, { id: "bal-l", anchor: "center", cls: "note", style: "width:430px;left:25px;font-size:34px;white-space:normal;line-height:1.4;color:#efe5cf" });
    D.text("用 AI 的回答训练 AI：<br><span style='color:#e0735a'>攻击？</span>", 840, 1000, { id: "bal-r", anchor: "center", cls: "note", style: "width:430px;left:625px;font-size:34px;white-space:normal;line-height:1.4;color:#efe5cf" });

    D.cap("如果老师<em>没同意</em>呢？", S8, 125.48);
    D.cap("蒸馏本身各家都在用，|争议在于：没经允许，拿别人的模型<em>当老师</em>", 125.48, 129.73);
    D.cap("2026 年 2 月，一家美国 AI 公司称：", 129.73, 136.12, { note: "以上为指控方单方说法", noteAt: 132.9 });
    D.cap("有人质疑：", 140.37, 146.74, { note: "Lawfare《AI 模型蒸馏悖论》", noteAt: 140.8 });
    D.cap("目前还<em>没有定论</em>", 146.74, S9);

    D.step(() => {
      tl.fromTo("#warm", { opacity: 0 }, { opacity: 1, duration: 0.9, ease: "power1.inOut", immediateRender: false }, S8);
      tl.to("#warm", { opacity: 0, duration: 1.5, ease: "power1.inOut" }, 146.74);
      tl.fromTo("#s8", { opacity: 0 }, { opacity: 1, duration: 0.6, immediateRender: false }, S8);
      tl.fromTo("#wax", { opacity: 0, scaleY: 0.2, svgOrigin: `540 ${tf.top - 40}` }, { opacity: 1, scaleY: 1, svgOrigin: `540 ${tf.top - 40}`, duration: 0.6, ease: "power2.out", immediateRender: false }, S8 + 0.3);
      tl.fromTo("#straws", { opacity: 0 }, { opacity: 1, duration: 0.01, immediateRender: false }, 125.48);
      tl.fromTo("#led-1", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, 129.73);
      tl.to("#led-1", { opacity: 0, duration: 0.35 }, 135.9);
      tl.fromTo("#led-2", { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 136.12);
      tl.fromTo("#led-3", { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, 138.24);
      [0, 1, 2, 3, 4, 5].forEach((k) => tl.to(["#led-2", "#led-3", "#seal-a2", "#seal-d"], { x: k % 2 ? -8 : 8, duration: 0.04, ease: "none" }, 140.1 + k * 0.04));
      tl.to(["#led-2", "#led-3", "#seal-a2", "#seal-d"], { x: 0, duration: 0.04 }, 140.34);
      tl.to(["#led-2", "#led-3", "#s8"], { opacity: 0, duration: 0.35 }, 140.3);
      tl.fromTo("#balance", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, 140.37);
      tl.fromTo("#bal-l", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, 140.6);
      tl.fromTo("#bal-r", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, immediateRender: false }, 142.49);
      tl.to(["#balance", "#bal-l", "#bal-r"], { opacity: 0, duration: 0.45 }, S9 - 0.3);
      // S9 回到开场装置
      tl.fromTo("#cam-hook", { opacity: 0, scale: 1.04, svgOrigin: "540 960" }, { opacity: 1, scale: 1.0, svgOrigin: "540 960", duration: 1.0, ease: "power2.out", immediateRender: false }, S9);
      tl.to("#cam-hook", { opacity: 0.12, duration: 1.0, ease: "power1.inOut" }, 157.7);
      tl.to(["#tag-teacher", "#tag-student"], { opacity: 0, duration: 0.5 }, 157.5);
    });
    D.hook.dropAt(154.97);
    D.hook.dropAt(156.04);
    D.hook.dropAt(157.11, { gold: true });
    D.cap("所以，蒸馏<em>蒸的是什么</em>？", S9, 150.99);
    D.cap("不只是答案，|是老师的<em>「犹豫」</em>", 150.99, S10);

    // ---------- 片尾 ----------
    D.text("蒸馏", 540, 600, { id: "end-title", anchor: "center", cls: "title", style: "left:0;right:0;width:auto;font-size:170px;letter-spacing:20px" });
    D.text("参考文献<br>布奇卢阿等《模型压缩》2006 · 辛顿等《提炼神经网络中的知识》2015<br>桑等《DistilBERT》2019 · DeepSeek-AI《DeepSeek-R1》2025<br>Anthropic《检测与防范蒸馏攻击》2026 · Lawfare《AI 模型蒸馏悖论》2026",
      540, 1000, { id: "end-cred", anchor: "center", cls: "credits" });
    D.step(() => {
      tl.fromTo("#end-title", { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out", immediateRender: false }, S10 + 0.2);
      tl.fromTo("#end-cred", { opacity: 0 }, { opacity: 1, duration: 0.8, immediateRender: false }, S10 + 0.6);
    });
  };
})();
