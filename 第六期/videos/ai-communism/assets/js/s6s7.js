// S6 钱是怎么流的（v13，取代《北京折叠》）→ 锁孔特写 → 钥匙 = 一条规则 → 钻进锁孔（v5 绝对时间 139.71–163.66）
// S7 夜之城：巨塔下摇 → 救援只看会员 → Altman 引文（原 136.00–160.00，+27.656 → 163.66–187.66）
(function () {
  const D = window.D;

  // ---------- S6（v5 绝对时间，配乐 v3）：宴会 → 技术早就有了 → 锁孔特写 → 钥匙 = 一条规则 → 钻进锁孔 ----------
  D.scene6 = () => {
    const L = D.L.back, M = D.L.mid;
    // ---------- v13：钱是怎么流的（取代《北京折叠》饭局）——同一张纸面接着图表，风格不跳 ----------
    // 放映时间 = 下面的时间 + 6
    const s6 = D.scene(L, 139.6, 155.2, 0.01, 0.7); // 先淡出，锁孔特写再淡入（不叠在一起）
    D.el(s6, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "url(#paperbg)" });
    D.plate(s6, "parchment.jpg").g.setAttribute("opacity", 0.5);
    D.ghost(s6, [["劳动 · 机器 · 时间", 170], ["能干多少干多少", 560], ["需要多少拿多少", 1030]], { size: 150, op: 0.045, t0: 139.6 });
    const INK = "#2a2018";
    const T0 = 141.4; // 金币开始流
    // 机器（左）
    const MX = 430, MY = 470;
    const machGlow = D.el(s6, "ellipse", { cx: MX, cy: MY, rx: 300, ry: 260, fill: "url(#warm)", opacity: 0 });
    const mach = D.g(s6), machIn = D.g(mach);
    D.el(machIn, "rect", { x: -150, y: -110, width: 300, height: 220, rx: 22, fill: "rgba(255,255,255,.9)", stroke: INK, "stroke-width": 6 });
    D.el(machIn, "rect", { x: 150, y: -26, width: 46, height: 52, fill: "rgba(255,255,255,.9)", stroke: INK, "stroke-width": 6 });
    const teeth = (r, n, w) => Array.from({ length: n }, (_, i) => `<rect x="${-w / 2}" y="${-r - 18}" width="${w}" height="20" fill="${INK}" transform="rotate(${(i * 360) / n})"/>`).join("");
    const gear1 = D.g(machIn), gear2 = D.g(machIn);
    D.svg(gear1, `<circle r="44" fill="none" stroke="${INK}" stroke-width="7"/><circle r="13" fill="${INK}"/>${teeth(44, 8, 18)}`);
    D.svg(gear2, `<circle r="28" fill="none" stroke="${INK}" stroke-width="6"/><circle r="9" fill="${INK}"/>${teeth(28, 6, 14)}`);
    D.el(mach, "text", { x: 0, y: 175, "text-anchor": "middle", class: "serif", "font-size": 44, "font-weight": 800, fill: INK, "letter-spacing": 4 }, "机器 · AI");
    // 人（主人在右上，三个干活的人在右下）
    const person = (x, y, sc, fill) => { const g = D.g(s6); D.svg(g, `<circle cx="0" cy="-74" r="34" fill="${fill}"/><path d="M-58 62 Q -58 -22 0 -26 Q 58 -22 58 62 Z" fill="${fill}"/>`); D.tf(g, x, y, sc); return g; };
    const OX = 1400, OY = 300;
    person(OX, OY, 1.1, "#1e1b18");
    D.el(s6, "text", { x: OX, y: OY + 128, "text-anchor": "middle", class: "serif", "font-size": 42, "font-weight": 800, fill: INK, "letter-spacing": 4 }, "机器的主人");
    const pile = Array.from({ length: 18 }, (_, i) => D.el(s6, "ellipse", { cx: 1210 + (i % 2) * 6, cy: 400 - i * 15, rx: 46, ry: 13, fill: "#e3b04b", stroke: "#8c6321", "stroke-width": 3, opacity: 0 }));
    const WX = [1240, 1400, 1560], WY = 765;
    const workers = WX.map((x) => person(x, WY, 0.82, "#6b5338"));
    D.el(s6, "text", { x: 1400, y: 862, "text-anchor": "middle", class: "serif", "font-size": 40, "font-weight": 800, fill: INK, "letter-spacing": 4 }, "干活的人");
    // 两路金币：利润 → 主人；工资 → 干活的人
    const qb = (p0, c, p1, u) => [(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * c[1] + u * u * p1[1]];
    const ROUTES = [
      { p0: [640, 450], c: [900, 170], p1: [1205, 300], n: 30, rate: (t) => D.lerp(0.45, 1, D.prog(t, 145.6, 1.4)) },
      { p0: [640, 500], c: [980, 760], p1: [1400, 670], n: 16, rate: (t) => D.lerp(0.9, 0.18, D.prog(t, 145.8, 1.4)) },
    ];
    ROUTES.forEach((r) => {
      r.coins = Array.from({ length: r.n }, () => {
        const g = D.g(s6);
        D.el(g, "circle", { r: 15, fill: "#e3b04b", stroke: "#8c6321", "stroke-width": 3 });
        D.el(g, "circle", { r: 7, fill: "none", stroke: "rgba(140,99,33,.6)", "stroke-width": 2 });
        return g;
      });
    });
    D.text("利润", 880, 160, { anchor: "center", cls: "serif", style: "font-size:40px;font-weight:800;color:#8c6321;letter-spacing:4px", win: [142.2, 154.9] });
    D.text("工资", 1010, 715, { anchor: "center", cls: "serif", style: "font-size:40px;font-weight:800;color:#a3241b;letter-spacing:4px", win: [142.6, 154.9] });
    D.onFrame((t) => {
      if (t < 139.5 || t > 156) return;
      const up = D.prog(t, 145.4, 0.9, D.ease.inOut);
      D.tf(mach, MX, MY, 1 + 0.18 * up);
      D.op(machGlow, 0.8 * up);
      const spin = (t - 139.6) * (60 + 140 * up);
      gear1.setAttribute("transform", `translate(-55 -8) rotate(${D.f(spin)})`);
      gear2.setAttribute("transform", `translate(52 38) rotate(${D.f(-spin * 1.5)})`);
      ROUTES.forEach((r) => {
        const rate = r.rate(t);
        r.coins.forEach((g, i) => {
          const born = T0 + i / r.n / 0.5;
          const u = (((t - T0) * 0.5 + i / r.n) % 1 + 1) % 1;
          const on = t >= born && D.hash(i * 3.7 + r.n) < rate;
          const [x, y] = qb(r.p0, r.c, r.p1, u);
          D.tf(g, x, y, 1);
          D.op(g, on ? Math.sin(Math.PI * u) : 0);
        });
      });
      // 主人那边越堆越高；两边的干活的人被机器替掉
      const n = Math.round(D.lerp(1, 5, D.prog(t, 142.4, 3.0, D.ease.lin)) + D.lerp(0, 10, D.prog(t, 146.4, 6.0, D.ease.lin)));
      pile.forEach((e, i) => D.op(e, i < n ? 1 : 0));
      const gone = D.prog(t, 145.9, 1.0);
      D.op(workers[0], 1 - 0.78 * gone); D.op(workers[2], 1 - 0.78 * gone);
      const hl = D.prog(t, 152.1, 0.4) * (1 - D.prog(t, 154.6, 0.3));
      D.tf(workers[1], WX[1], WY, 0.82 * (1 + 0.12 * hl));
    });
    const ST = "font-size:52px;font-weight:800;color:#1e1b18;letter-spacing:4px";
    D.text("为什么？看看钱是<em style='color:#c8281e'>怎么流</em>的", 960, 50, { anchor: "center", cls: "serif", style: "font-size:58px;font-weight:800;color:#1e1b18;letter-spacing:4px", win: [139.9, 154.9] });
    D.text("机器干活赚的钱，分成<em style='color:#c8281e'>两路</em>", 600, 800, { anchor: "center", cls: "serif", style: ST, win: [141.0, 145.3] });
    D.text("机器越能干，需要的人<em style='color:#c8281e'>越少</em>", 600, 800, { anchor: "center", cls: "serif", style: ST, win: [145.4, 149.4] });
    D.text("钱，就越多地流向<em style='color:#c8281e'>机器的主人</em>", 600, 800, { anchor: "center", cls: "serif", style: ST, win: [149.5, 152.0] });
    D.text("可大多数人，只能<em style='color:#c8281e'>靠工资活</em>", 600, 800, { anchor: "center", cls: "serif", style: ST, win: [152.1, 154.9] });

    // 钥匙（锁孔特写时出现在右边）：钥匙 = 一条规则；160.5 起飞向锁孔，162.6 钻进去
    const keyG = D.g(M);
    const key = D.g(keyG);
    D.el(key, "circle", { cx: -170, cy: 0, r: 70, fill: "none", stroke: "#d9a441", "stroke-width": 26 });
    D.el(key, "rect", { x: -100, y: -14, width: 300, height: 28, rx: 6, fill: "#d9a441" });
    D.el(key, "rect", { x: 140, y: 14, width: 24, height: 50, fill: "#d9a441" });
    D.el(key, "rect", { x: 186, y: 14, width: 24, height: 70, fill: "#d9a441" });
    D.onFrame((t) => {
      if (t < 156 || t > 163.7) { D.op(keyG, 0); return; }
      const fly = D.prog(t, 160.6, 1.6, D.ease.inOut);
      const x = D.lerp(1420, 760, fly), y = D.lerp(250, 560, fly), sc = D.lerp(1, 0.35, fly), r = D.lerp(-8, 90, fly);
      D.tf(keyG, x, y, sc * D.pop(t, 156.3, 0.5), r);
      D.op(keyG, 1 - D.prog(t, 162.3, 0.3));
    });
    D.text("这把锁的钥匙，是<em style='color:#f2cf7a'>一条规则</em>", 1430, 420, { anchor: "center", cls: "serif", style: "font-size:60px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [156.3, 160.4] });
    D.text("AI 归谁？<br>AI 赚的钱，怎么分？", 1430, 540, { anchor: "center", cls: "serif", style: "font-size:58px;line-height:1.5;font-weight:800;color:#f2cf7a;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9)", win: [157.0, 160.4] });
    D.text("这条规则，决定了<br>门后是<em style='color:#f2cf7a'>哪座城</em>", 1430, 420, { anchor: "center", cls: "serif", style: "font-size:64px;line-height:1.45;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [160.5, 163.2] });
  };

  // ---------- S7（原时间，main.js 里整体 +27.656 秒）：夜之城 ----------
  D.scene7 = () => {
    const L = D.L.back;

    const s7a = D.scene(L, 136.0, 146.4, 0.01);
    const fromKey = D.black(s7a, 1);
    D.onFrame((t) => { if (t >= 135.9 && t <= 137.5) D.op(fromKey, 1 - D.prog(t, 136.0, 0.9, D.ease.out)); });
    // 从塔尖往下摇到人群
    D.plate(s7a, "city-dystopia.jpg", { keys: [[136.0, 2.0, 0, 520], [140.16, 1.9, 0, 470], [144.6, 1.08, 0, 30], [146.4, 1.05, 0, 0]] });
    // 雨
    const rain = D.g(s7a, { stroke: "rgba(200,230,255,.35)", "stroke-width": 2 });
    const drops = Array.from({ length: 120 }, (_, i) => D.el(rain, "line", { x1: 0, y1: 0, x2: -10, y2: 46 }));
    const rainFn = (t, grp, arr) => arr.forEach((d, i) => {
      const x = (D.hash(i) * 2100 + t * 260) % 2100 - 90, y = (D.hash(i * 3.3) * 1200 + t * (1400 + 600 * D.hash(i * 5.1))) % 1200 - 60;
      d.setAttribute("transform", `translate(${D.f(x)} ${D.f(y)})`);
    });
    D.onFrame((t) => { if (t >= 136 && t <= 146.5) rainFn(t, rain, drops); });

    D.text("如果，AI 和机器只归<em style='color:#2de2e6'>少数人</em>", 960, 380, { anchor: "center", cls: "serif", style: "font-size:100px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [136.3, 140.1] });
    D.text(`<span class="chip" style="background:rgba(5,10,18,.7);color:#2de2e6;border:1px solid rgba(45,226,230,.5);font-size:34px">就像游戏《赛博朋克 2077》里的夜之城</span>`, 70, 70, { win: [140.2, 146.0] });
    D.text("机器替所有人干活<br>钱，只流进<em style='color:#ff6a5a'>一座塔</em>", 960, 600, { anchor: "center", cls: "serif", style: "font-size:76px;line-height:1.4;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [141.6, 146.0] });
    const s7b = D.scene(L, 146.0, 160.0, 0.35);
    D.plate(s7b, "rescue.jpg", { keys: [[146.0, 1.12, 0, -60], [152.0, 1.18, -40, -90], [160.0, 1.24, -60, -120]] });
    const rain2 = D.g(s7b, { stroke: "rgba(200,230,255,.3)", "stroke-width": 2 });
    const drops2 = Array.from({ length: 100 }, () => D.el(rain2, "line", { x1: 0, y1: 0, x2: -10, y2: 46 }));
    D.onFrame((t) => { if (t >= 146 && t <= 160) rainFn(t + 7, rain2, drops2); });
    // 扫描光 + 扫描框
    const beam = D.el(s7b, "polygon", { points: "", fill: "rgba(61,255,122,.22)", filter: "url(#blur8)" });
    const beamCore = D.el(s7b, "line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "#5dff8f", "stroke-width": 3, opacity: 0.8 });
    const box = D.el(s7b, "rect", { x: 110, y: 640, width: 900, height: 280, fill: "none", stroke: "#5dff8f", "stroke-width": 4, "stroke-dasharray": "40 14" });
    const dim7 = D.black(s7b, 0);
    D.text(`<span class="chip" style="background:rgba(30,6,6,.85);color:#ff6a5a;border:2px solid #ff3b4a;font-size:44px;letter-spacing:8px">✕ 非会员</span>`, 120, 566, { win: [147.4, 151.9], slam: 1.4 });
    D.onFrame((t) => {
      if (t < 146 || t > 160) return;
      // 光束先对准倒地的人，149.6 转向街对面的担架
      const sw = D.prog(t, 149.6, 0.8, D.ease.inOut);
      const tx = D.lerp(560, 1560, sw), ty = D.lerp(800, 560, sw);
      const on = D.prog(t, 146.6, 0.3) * (1 - D.prog(t, 151.8, 0.4));
      D.attr(beam, "points", `${D.f(1080)},40 ${D.f(1130)},40 ${D.f(tx + 140)},${D.f(ty)} ${D.f(tx - 140)},${D.f(ty)}`);
      D.op(beam, on);
      D.attr(beamCore, "x1", 1105); D.attr(beamCore, "y1", 40); D.attr(beamCore, "x2", tx); D.attr(beamCore, "y2", ty);
      D.op(beamCore, on * 0.8);
      D.op(box, D.win(t, 147.0, 149.7, 0.2) * (Math.sin(t * 20) > -0.6 ? 1 : 0.4));
      D.op(dim7, 0.62 * D.prog(t, 152.0, 0.6) + 0.38 * D.prog(t, 158.8, 1.1));
    });
    D.text("那么，在这座城市，连被救都要看<em style='color:#ff6a5a'>会员等级</em>", 960, 60, { anchor: "center", cls: "serif", style: "font-size:66px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [146.6, 151.9] });
    D.text(`<span class="chip" style="background:rgba(4,30,14,.8);color:#5dff8f;border:2px solid #5dff8f;font-size:38px">✓ 白金会员</span>`, 1420, 230, { win: [150.2, 151.9] });
    // Altman 引文的前后衔接（用户 2026-10-14："前后缺少衔接"）
    D.text("这不只是<em style='color:#2de2e6'>游戏里</em>的担心", 960, 420, { anchor: "center", cls: "serif", style: "font-size:84px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [152.0, 154.3] });
    D.text("做 AI 的人自己就写过：", 960, 230, { anchor: "center", cls: "serif", style: "font-size:52px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [154.4, 159.3] });
    D.text("问题不在 AI，<br>在<em>那条规则</em>", 960, 400, { anchor: "center", cls: "serif", style: "font-size:84px;line-height:1.45;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [160.15, 162.45], d: 0.3 });
    D.qcard("“如果公共政策不随之调整，<br>大多数人的处境会比今天更差。”", "Sam Altman（OpenAI CEO）·《万物的摩尔定律》2021", 960, 330, 1240, { win: [154.4, 159.4], dark: true, size: 52, anchor: "center" });
  };
})();
