// S8 星际迷航：静默 → 光明城 → 复制机 → 舰长台词 → 分屏滑杆（160.00–191.40）
// S9 走向明天：工人推门走进晨光，金色结语（191.40–206.64）
(function () {
  const D = window.D;

  D.scene89 = () => {
    const L = D.L.back;

    // ---------- S8 ----------
    // v20 星星之火（用户 2026-10-15：不要火苗，做纸被火点燃）：光明城上盖着一张深色的纸；
    // 静音里先出现一两个小焦洞，《国际歌》进来后更多的洞接连烧开——每个洞先慢后快、越烧越大，最后整张纸烧尽，露出光明城。
    // 洞的边缘：外面一圈发亮的火线，里面一圈烧焦的深褐色。
    const u = D.scene(L, 160.5, 168.0, 1.3, 0.01);
    const up = D.plate(u, "city-utopia.jpg", { keys: [[160.5, 1.16, 0, 30], [168.0, 1.04, 0, 0]] });
    D.defsEl.insertAdjacentHTML("beforeend", `
      <filter id="ragged2" x="-200" y="-200" width="2320" height="1480" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="11"/><feDisplacementMap in="SourceGraphic" scale="70" xChannelSelector="R" yChannelSelector="G"/></filter>
      <mask id="paperburn" maskUnits="userSpaceOnUse" x="-200" y="-200" width="2320" height="1480"><rect x="-200" y="-200" width="2320" height="1480" fill="#fff"/><g id="paperholes" filter="url(#ragged2)"></g></mask>
      <filter id="paperEdge" x="-200" y="-200" width="2320" height="1480" filterUnits="userSpaceOnUse">
        <feMorphology in="SourceAlpha" operator="erode" radius="26" result="er"/><feComposite in="SourceAlpha" in2="er" operator="out" result="charBand"/>
        <feFlood flood-color="#1a0c04"/><feComposite in2="charBand" operator="in" result="charC"/><feGaussianBlur in="charC" stdDeviation="7" result="char"/>
        <feMorphology in="SourceAlpha" operator="erode" radius="7" result="er2"/><feComposite in="SourceAlpha" in2="er2" operator="out" result="emberBand"/>
        <feFlood flood-color="#ff7a1e"/><feComposite in2="emberBand" operator="in" result="emC"/><feGaussianBlur in="emC" stdDeviation="3" result="ember"/>
        <feMorphology in="SourceAlpha" operator="dilate" radius="10" result="dl"/><feComposite in="dl" in2="SourceAlpha" operator="out" result="glowBand"/>
        <feFlood flood-color="#ffc25a"/><feComposite in2="glowBand" operator="in" result="glC"/><feGaussianBlur in="glC" stdDeviation="8" result="glow"/>
        <feMerge><feMergeNode in="char"/><feMergeNode in="glow"/><feMergeNode in="ember"/></feMerge></filter>`);
    // 纸：深色、有纸纹
    const paper = D.g(up.inner, { mask: "url(#paperburn)" });
    D.el(paper, "rect", { x: -100, y: -100, width: 2120, height: 1280, fill: "#14100c" });
    const pt = D.plate(paper, "parchment.jpg"); pt.g.setAttribute("opacity", 0.16);
    const edge = D.g(up.inner, { filter: "url(#paperEdge)" });
    D.el(edge, "rect", { x: -100, y: -100, width: 2120, height: 1280, fill: "#000", mask: "url(#paperburn)" });
    const holesG = document.getElementById("paperholes");
    // 洞：位置铺开（不规则），点燃时间由疏到密；半径 r = Rmax · ((t - tb) / T)^2.2（先慢后快）
    const HOLES = [
      [880, 820, 160.95, 6.4], [1260, 560, 161.9, 5.6], [420, 640, 162.75, 4.7], [1560, 860, 163.35, 4.1], [700, 330, 163.85, 3.7],
      [1500, 250, 164.25, 3.3], [240, 930, 164.55, 3.05], [1080, 980, 164.8, 2.85], [180, 260, 165.0, 2.7], [1780, 520, 165.15, 2.6], [980, 140, 165.3, 2.45],
    ];
    const holes = HOLES.map(([x, y, tb, T]) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 0); c.setAttribute("fill", "#000");
      holesG.appendChild(c);
      return { c, tb, T };
    });
    const warm = D.el(up.inner, "rect", { x: -100, y: -100, width: 2120, height: 1280, fill: "#ffb060", opacity: 0 });
    D.onFrame((t) => {
      if (t < 160.4 || t > 168.2) return;
      holes.forEach((h) => h.c.setAttribute("r", D.f(t < h.tb ? 0 : 2000 * Math.pow(D.clamp((t - h.tb) / h.T), 2.2))));
      D.op(edge, t < 167.6 ? 1 : 0);
      D.op(paper, t < 167.6 ? 1 : 0);
      D.op(warm, 0.12 * Math.sin(Math.PI * D.clamp((t - 165.6) / 1.8)));
    });

    D.text("如果，AI 和机器归<em style='color:#f2cf7a'>所有人</em>", 960, 90, { anchor: "center", cls: "serif", style: "font-size:100px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.85),0 0 12px rgba(0,0,0,.6)", win: [163.5, 167.4] });
    const r = D.scene(L, 167.4, 172.6, 0.5);
    D.plate(r, "replicator.jpg", { keys: [[167.4, 1.02, 0, 0], [172.6, 1.12, 0, -20]] });

    D.text("复制机：想要什么，机器做出来", 960, 70, { anchor: "center", cls: "serif", style: "font-size:72px;font-weight:800;color:#0f2a36;letter-spacing:6px;text-shadow:0 0 30px rgba(255,255,255,.95),0 0 10px rgba(255,255,255,.9)", win: [167.6, 172.1] });
    D.text("《星际迷航》里的设定", 960, 175, { anchor: "center", style: "font-size:34px;font-weight:700;color:#0f2a36;text-shadow:0 0 16px rgba(255,255,255,.9)", win: [167.9, 172.1] });
    const c = D.scene(L, 172.2, 181.95, 0.5);
    D.plate(c, "captain.jpg", { keys: [[172.2, 1.04, 0, 0], [181.9, 1.12, -60, 0]] });
    D.text("人工作，<em style='color:#f2cf7a'>不再是为了活下去</em>", 1420, 700, { anchor: "center", cls: "serif", style: "font-size:56px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [177.0, 181.7] });
    D.qcard("“24 世纪没有钱。<br>获取财富不再是我们生活的动力。<br>我们工作，是为了完善自己和全人类。”", "《星际迷航：第一类接触》· 1996", 980, 340, 880, { win: [172.6, 181.8], size: 42 });

    // 分屏滑杆：左边夜之城，右边光明城，金色滑杆
    const sp = D.scene(L, 181.2, 191.55, 0.7, 0.01); // v11：从舰长叠化进来
    const left = D.plate(sp, "city-dystopia.jpg");
    const clip = D.el(D.defsEl, "clipPath", { id: "splitR" });
    const clipRect = D.el(clip, "rect", { x: 960, y: 0, width: 960, height: 1080 });
    const rightG = D.g(sp, { "clip-path": "url(#splitR)" });
    D.plate(rightG, "city-utopia.jpg");
    const shade = D.el(sp, "rect", { x: 0, y: 600, width: 1920, height: 480, fill: "url(#shadeB)" });
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="shadeB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity=".78"/></linearGradient>`);
    const rail = D.el(sp, "rect", { x: 957, y: 0, width: 6, height: 1080, fill: "#f2cf7a", filter: "url(#glow)" });
    const knob = D.g(sp);
    D.el(knob, "circle", { r: 48, fill: "#d9a441", stroke: "#fff4cf", "stroke-width": 4, filter: "url(#shadowD)" });
    D.el(knob, "path", { d: "M-14 -14 L -30 0 L -14 14 Z M 14 -14 L 30 0 L 14 14 Z", fill: "rgba(60,40,10,.8)" });
    const SX = [[181.8, 1720], [183.4, 240], [185.0, 1500], [186.6, 960], [191.4, 960]];
    D.onFrame((t) => {
      if (t < 181.7 || t > 191.6) return;
      const x = D.keyed(SX, t, D.ease.inOut);
      D.attr(clipRect, "x", x); D.attr(clipRect, "width", 1920 - x);
      D.attr(rail, "x", x - 3); D.tf(knob, x, 540);
    });
    D.text(`<span class="chip" style="background:rgba(5,10,18,.65);color:#2de2e6;text-shadow:0 0 18px rgba(45,226,230,.7)">机器归少数人</span>`, 70, 70, { win: [182.0, 191.4] });
    D.text(`<span class="chip" style="background:rgba(255,248,236,.8);color:#3a2a0a">机器归所有人</span>`, 1850, 70, { anchor: "right", win: [182.0, 191.4] });
    D.text("同样的机器", 960, 730, { anchor: "center", cls: "serif", style: "font-size:76px;font-weight:800;color:#fff;letter-spacing:12px;text-shadow:0 4px 30px rgba(0,0,0,.9)", win: [181.8, 186.5] });
    D.text("门后是哪座城，取决于那把锁", 960, 790, { anchor: "center", cls: "serif", style: "font-size:44px;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [187.4, 191.4] });
    D.text("唯一的区别：机器归谁", 960, 650, { anchor: "center", cls: "gold", style: "font-size:96px", win: [186.6, 191.4], slam: 1.5 });

    // ---------- S9 ----------
    const f = D.scene(L, 190.8, 195.3, 0.8, 0.01); // v11：从对比画面叠化进来
    // v21：结尾回到开头那个工人——同一张图、同一个位置（首尾呼应，工人贯穿全片）
    D.plate(f, "factory-warm.jpg", { filter: "url(#dim)", keys: [[191.4, 1.06, 50, 8], [195.3, 1.12, 110, 14]] });
    D.text("还记得开头<em>这个工人</em>吗？", 1250, 110, { anchor: "center", cls: "serif", style: "font-size:64px;line-height:1.45;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [191.5, 193.3] });
    D.text("169 年前，马克思<br>为他写下了<em>一扇门</em>", 960, 70, { anchor: "center", cls: "serif", style: "font-size:64px;line-height:1.45;font-weight:800;color:#fff;letter-spacing:6px;text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)", win: [193.6, 195.6] });
    // v22：同一扇门——关着（193.2）→ 被工人、马克思、AI 一起推开（195.8）
    const g9 = D.scene(L, 193.0, 196.0, 0.7, 0.01);
    D.plate(g9, "door-closed.jpg", { keys: [[193.0, 1.02, 0, 0], [196.0, 1.05, 0, 12]] });
    // v23：他身边多了两个人——马克思的设想，和 AI
    const h9 = D.scene(L, 195.3, 199.0, 0.7, 0.01);
    D.plate(h9, "door-three-closed.jpg", { keys: [[195.3, 1.03, 0, 6], [199.0, 1.07, 0, 16]] });
    const SHE = "text-shadow:0 4px 30px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.6)";
    D.text("这一次，他<em>不是一个人</em>", 960, 70, { anchor: "center", cls: "serif", style: `font-size:72px;font-weight:800;color:#fff;letter-spacing:6px;${SHE}`, win: [195.9, 198.5] });
    D.text("身边，是马克思的设想，和 AI", 960, 175, { anchor: "center", cls: "serif", style: `font-size:46px;font-weight:700;color:#fff4dc;letter-spacing:5px;${SHE}`, win: [196.5, 198.5] });
    // 198.4 门开（对着《国际歌》最后的和弦），光越来越强，把三个人淹没
    const e = D.scene(L, 198.3, 210.24, 0.6, 0.35); // v25：结尾比原来多 3.6 秒（v24 的 6 秒太长）
    const ep = D.plate(e, "door-three-open.jpg", { keys: [[198.3, 1.0, 0, 0], [204.0, 1.1, 0, 12], [210.24, 1.26, 0, 26]] });
    // 光把他们淹没：从门口往外铺开的暖白光
    D.defsEl.insertAdjacentHTML("beforeend", `<radialGradient id="engulf" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#fffaf0"/><stop offset=".45" stop-color="#fff1d0" stop-opacity=".92"/><stop offset="1" stop-color="#ffe2a8" stop-opacity=".55"/></radialGradient>`);
    const engulf = D.el(e, "rect", { x: 0, y: 0, width: 1920, height: 1080, fill: "url(#engulf)", opacity: 0 });
    D.onFrame((t) => { if (t > 198 && t < 210.4) D.op(engulf, 0.9 * D.prog(t, 200.0, 6.0, D.ease.inOut)); });
    const sunG = D.el(e, "ellipse", { cx: 960, cy: 560, rx: 300, ry: 260, fill: "url(#warm)", opacity: 0 });
    const toBlack = D.black(e, 0);
    D.onFrame((t) => {
      if (t < 194.9) return;
      D.op(sunG, 0.9 * D.prog(t, 198.6, 2.0));
      D.attr(sunG, "rx", D.lerp(300, 1500, D.prog(t, 198.6, 6, D.ease.inOut))); D.attr(sunG, "ry", D.lerp(260, 1100, D.prog(t, 198.6, 6, D.ease.inOut)));
      D.op(toBlack, D.prog(t, 208.9, 1.2, D.ease.inOut));
    });
    D.defsEl.insertAdjacentHTML("beforeend", `<linearGradient id="endB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0c02" stop-opacity="0"/><stop offset="1" stop-color="#1a0c02" stop-opacity=".75"/></linearGradient>`);
    const band = D.el(e, "rect", { x: 0, y: 560, width: 1920, height: 520, fill: "url(#endB)", opacity: 0 });
    D.op(band, 0); // v23：结语移到上方，不再压暗底部
    // v23：去掉"这一次，他们一起推开了它"（改为前面的"这一次，他不是一个人"）
    D.text("愿共产主义，带着所有人走向明天", 960, 80, { anchor: "center", cls: "gold", style: "font-size:96px;filter:drop-shadow(0 4px 24px rgba(80,30,0,.95)) drop-shadow(0 0 8px rgba(60,20,0,.8))", win: [200.4, 209.3], d: 1.2 });
  };
})();
