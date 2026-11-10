// S6 中年（122.61–141.6）：全家的采购员，被商品淹没，直视镜头，138.95 硬切静音。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  (SE.SCENES = SE.SCENES || []).push(function (S) {
    const DX = S.DX, DY = S.DY;
    const a45 = SE.anchors("a45");
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a45" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a45", { id: "d45" })}</g>${SE.mouthSwap("a45", "stare", "d45-stare")}${SE.wear("a45", "w45")}</g></g>`);

    // 购物车：全家的东西
    const cartX = S.px(330), cartY = DY;
    const goods = [["校服", "#ffffff", C.main[5]], ["补习班", C.yellow, C.inkDeep], ["钙片", "#ffffff", C.main[5]], ["零食", C.main[1], C.inkDeep], ["纸尿裤", "#ffffff", C.main[5]], ["保健品", C.main[0], C.inkDeep]];
    let cart = `<g transform="translate(${cartX} ${cartY}) scale(1.22)"><g id="s6-cart" opacity="0">`;
    goods.forEach(([t, bgc, ink], i) => {
      const x = -150 + (i % 3) * 110, y = -250 - Math.floor(i / 3) * 96;
      cart += `<g transform="translate(${x} ${y}) rotate(${((i * 23) % 17) - 8})"><g class="good" filter="url(#cut)"><rect x="-52" y="-42" width="104" height="84" rx="10" fill="${bgc}"/>` +
        `<text x="0" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="24" fill="${ink}">${t}</text></g></g>`;
    });
    cart += `<g filter="url(#soft)"><path d="M-230 -200 L230 -200 L190 -40 L-190 -40 Z" fill="none" stroke="${C.ink}" stroke-width="14" stroke-linejoin="round"/>` +
      [-150, -75, 0, 75, 150].map((x) => `<line x1="${x}" y1="-200" x2="${x * 0.85}" y2="-40" stroke="${C.ink}" stroke-width="6"/>`).join("") +
      `<path d="M-290 -250 L-230 -200" stroke="${C.ink}" stroke-width="14" stroke-linecap="round"/>` +
      `<circle cx="-140" cy="-10" r="26" fill="${C.ink}"/><circle cx="140" cy="-10" r="26" fill="${C.ink}"/></g></g></g>`;
    S.add("front", cart);

    // 计数器：养到 17 岁
    S.addHTML("cam",
      `<div id="s6-count" style="position:absolute;left:110px;top:250px;width:520px;opacity:0;display:block">` +
      `<div style="display:block;font-size:36px;font-weight:800;color:#3F0C15">养到 17 岁</div>` +
      `<div style="display:block;font-size:110px;font-weight:900;color:#3F0C15;line-height:1.1">¥<span id="s6-num">0</span></div></div>`);

    // 淹没：一大堆商品盖住她，只露出眼睛
    const pileKeys = ["giftBox", "whitening", "slimTea", "loanCard", "bouquet", "weddingPhoto", "goldSet", "monthCard", "pelvicCard", "eduCard", "milk", "bag", "book", "creamA", "creamB", "makeupBox", "selfLipstick", "tutu", "binder", "milk", "giftBox", "creamA"];
    const eyeY = S.py(a45.headCY + a45.R * 0.14);
    let pile = `<g id="s6-pile" data-layout-allow-overlap data-layout-allow-occlusion>`;
    pileKeys.forEach((k, i) => {
      const col = i % 6, row = Math.floor(i / 6);
      let x = S.px(-280 + col * 112 + (row % 2) * 50), y = S.py(-60 - row * 128);
      if (Math.abs(y - eyeY) < 120) y = eyeY + 125;
      const r = ((i * 37) % 41) - 20;
      pile += `<g transform="translate(${f(x)} ${f(y)}) rotate(${r}) scale(1.25)"><g class="pi" filter="url(#cut)">${SE.SHAPE[k]()}${SE.tab(-30, -44, -8, 0.8)}${SE.tab(30, -44, 8, 0.8)}</g></g>`;
    });
    // 头两侧和头顶也压上几件，留出眼睛那一条
    [["creamB", -150, -150, -18], ["giftBox", 150, -160, 16], ["tiara", 0, -235, 8], ["selfLipstick", -175, -55, -24], ["whitening", 175, -55, 22]].forEach(([k, dx, dy, r]) => {
      pile += `<g transform="translate(${f(S.px(dx))} ${f(eyeY + dy * S.SC)}) rotate(${r}) scale(1.25)"><g class="pi" filter="url(#cut)">${SE.SHAPE[k]()}</g></g>`;
    });
    S.add("top", pile + `</g>`);
    // 定格后还在晃的那个价签
    S.add("top", `<g transform="translate(${S.px(190)} ${S.py(-300)})"><g id="s6-swing" opacity="0">${SE.string(0, 0, 20, 110, "#ffffff", 10)}<g transform="translate(20 110) rotate(90)">${SE.priceTag(0, 0, "¥", { w: 100, hole: C.bg[5] })}</g></g></g>`);

    S.ageSticker("a45", "45 岁", 122.61, 141.4);
    S.label("全家的东西，都要你来买", 124.62, 136.4, S.px(-360), S.py(a45.hipY) + 40, -4);
    S.ghost("全家　变老", 124.62, 138.9, { fill: "#ffffff", op: 0.22 });
    S.cap("0–17 岁孩子的日常生活照料，76.1% 主要由母亲承担", 126.62, 130.61);
    S.stat("76.1%", "孩子的日常照料主要由母亲承担", 126.62, 130.3, 40, 90, { w: 500, size: 150, color: "#E0243F" });
    S.cap("把一个孩子养到 17 岁，平均约 53.8 万元", 130.61, 134.62);
    S.label("你在变老", 134.62, 136.4, S.px(-120), S.py(a45.headCY - a45.R) - 100, 6);

    S.step((tl) => {
      S.ageSwap("#age-a30", "#age-a45", 122.61);
      S.bgTo(C.bg[5], 122.61, 0.6);
      S.fx("#s6-cart", 122.61, { opacity: 0, x: 500 }, { opacity: 1, x: 0 }, 0.5, "power3.out");
      // 车里的东西往外溢
      tl.fromTo("#s6-cart .good", { y: 0, rotation: 0 }, { y: -70, rotation: 14, duration: 0.3, ease: "back.out(3)", stagger: 0.12, immediateRender: false }, 126.62);
      // 计数器：0 → 538,000（动态放大）
      S.fx("#s6-count", 130.4, { opacity: 0, x: -60 }, { opacity: 1, x: 0 }, 0.3);
      const num = { v: 0 };
      const numEl = document.getElementById("s6-num");
      tl.fromTo(num, { v: 0 }, {
        v: 538000, duration: 2.6, ease: "power2.out", immediateRender: true,
        onUpdate: () => { numEl.textContent = Math.round(num.v).toLocaleString("en-US"); },
      }, 130.61);
      tl.fromTo("#s6-num", { scale: 0.8, transformOrigin: "0% 50%" }, { scale: 1.15, duration: 2.6, ease: "power2.out", immediateRender: true }, 130.61);
      S.hide("#s6-count", 134.3, 0.3);
      // 抗衰面霜
      S.clickIn("#w45-creamA", 135.29, { x: -400, y: -100, rotation: -30 });
      S.clickIn("#w45-creamB", 135.95, { x: 400, y: -100, rotation: 30 });
      // 淹没
      tl.fromTo("#s6-pile .pi", { opacity: 0, y: -500, rotation: -30, scale: 1.1 }, { opacity: 1, y: 0, rotation: 0, scale: 1, duration: 0.35, ease: "power3.in", stagger: 0.06, immediateRender: true }, 136.4);
      // 直视镜头
      S.fx("#d45-stare", 138.62, { opacity: 0 }, { opacity: 1 }, 0.08, "none");
      tl.fromTo("#d45-eyes", { scale: 1, svgOrigin: `0 ${f(a45.headCY + a45.R * 0.14)}` }, { scale: 1.12, duration: 0.25, ease: "power2.out", immediateRender: false }, 138.62);
      // 138.95 定格：只剩一个价签在晃
      tl.set("#s6-swing", { opacity: 1 }, 138.95);
      tl.fromTo("#s6-swing", { rotation: -10, transformOrigin: "50% 0%" }, { rotation: 10, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 3, immediateRender: false }, 138.95);
    });
  });
})();
