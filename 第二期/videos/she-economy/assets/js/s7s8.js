// S7 觉醒（141.6–166.36）与 S8 结尾（166.36–180）。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  (SE.SCENES = SE.SCENES || []).push(function (S) {
    const DX = S.DX, DY = S.DY;
    const a45 = SE.anchors("a45plain");
    const kraftTag = (x, y, text, rot = 0) =>
      `<g filter="url(#soft)">${SE.priceTag(x, y, text, { fill: C.kraft, ink: C.beigeInk, serif: true, hole: C.card, rot })}</g>`;

    // ---------- 素颜的她 + 觉醒商品 ----------
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-plain" opacity="0">` +
      `<g filter="url(#cutBeige)">${SE.doll("a45plain", { id: "dp" })}</g>` +
      `<g transform="translate(0 ${f(a45.shoulderY + 70)}) scale(0.7)"><g id="s7-tee" opacity="0"><g filter="url(#cutBeige)">${SE.SHAPE.tee()}</g>` +
      `${SE.tab(-58, -104, -8, 1.1)}${SE.tab(58, -104, 8, 1.1)}${SE.tab(-74, 92, 0, 1.1)}${SE.tab(74, 92, 0, 1.1)}</g></g>` +
      `<g id="s7-teetag" opacity="0">${SE.string(a45.sw + 10, a45.shoulderY + 40, a45.sw + 120, a45.shoulderY + 96, "#8A7354", 22)}${kraftTag(a45.sw + 120, a45.shoulderY + 96, "¥ 799", -4)}</g>` +
      `</g></g>`);
    // 褪成灰色、堆在脚边的旧东西
    const drained = [["tiara", -270, -40, -20], ["binder", -150, -20, 10], ["giftBox", 230, -40, 14], ["creamA", 320, -10, -8], ["loanCard", -330, 10, 18], ["ring", 150, -5, 0], ["tutu", -60, 6, -6]];
    S.add("dolls", `<g id="s7-heap" opacity="0" filter="url(#drain)">` + drained.map(([k, dx, dy, r]) =>
      `<g transform="translate(${f(S.px(dx))} ${f(S.py(dy))}) rotate(${r}) scale(0.82)"><g filter="url(#cut)">${SE.SHAPE[k]().replace(/<text[^>]*>[^<]*<\/text>/g, "")}</g></g>`).join("") + `</g>`);
    // 两张被撕掉的广告（不出现任何品牌）
    const torn = (x, r) =>
      `<g transform="translate(${x} 430) rotate(${r})"><g filter="url(#soft)"><path d="M-150 -200 L150 -200 L150 40 L110 70 L60 30 L10 80 L-40 36 L-90 76 L-150 40 Z" fill="#D9D5D0"/></g>` +
      `<rect x="-110" y="-160" width="220" height="140" rx="10" fill="#C4BFB9"/><path d="M-60 -120 L60 -40 M60 -120 L-60 -40" stroke="#8E8984" stroke-width="12" stroke-linecap="round"/></g>`;
    S.add("front", `<g id="s7-torn" opacity="0">${torn(330, -6)}${torn(1590, 5)}</g>`);
    // 商品卡外框（米色，顶上挂孔，右下条形码）——结尾拉远时就是这张卡
    let bars = "";
    for (let i = 0, x = 0; i < 18; i++) { const w = [4, 2, 6, 2, 4, 8][i % 6]; bars += `<rect x="${x}" y="0" width="${w}" height="64" fill="${C.beigeInk}"/>`; x += w + 4 + (i % 3); }
    S.add("bg",
      `<g id="s7-frame" opacity="0"><rect x="70" y="44" width="1780" height="992" rx="30" fill="${C.card}"/>` +
      `<rect x="915" y="70" width="90" height="26" rx="13" fill="${C.beige}"/><g transform="translate(1660 940)" opacity="0.8">${bars}</g></g>`);
    // 三件觉醒商品
    const awake = [
      ["s7-book", 1430, 300, 4, `<rect x="-95" y="-130" width="190" height="260" rx="6" fill="#D9C7A7"/><rect x="-95" y="-130" width="22" height="260" fill="#BFA77F"/>` +
        `<text x="12" y="-30" text-anchor="middle" font-family="SESerif" font-weight="600" font-size="34" fill="${C.beigeInk}">成为</text><text x="12" y="20" text-anchor="middle" font-family="SESerif" font-weight="600" font-size="34" fill="${C.beigeInk}">你自己</text>`, "¥ 59", [100, 40]],
      ["s7-camp", 1560, 600, -3, `<rect x="-180" y="-95" width="360" height="190" rx="14" fill="#EFE5D4"/><text x="0" y="-18" text-anchor="middle" font-family="SESerif" font-weight="600" font-size="38" fill="${C.beigeInk}">女性成长营</text>` +
        `<line x1="-60" y1="10" x2="60" y2="10" stroke="#8A7354" stroke-width="2"/><text x="0" y="56" text-anchor="middle" font-family="SESerif" font-weight="500" font-size="26" fill="#8A7354">21 天 · 找回自我</text>`, "¥ 8,800", [120, 100]],
      ["s7-tote", 1260, 760, 6, `<path d="M-50 -90 Q-50 -150 0 -150 Q50 -150 50 -90" fill="none" stroke="#BFA77F" stroke-width="12"/><rect x="-95" y="-90" width="190" height="170" rx="6" fill="#E3D4B9"/>` +
        `<text x="0" y="12" text-anchor="middle" font-family="SESerif" font-weight="600" font-size="38" fill="${C.beigeInk}">独立</text>`, "¥ 199", [150, 70]],
    ];
    S.add("front", awake.map(([id, x, y, r, body, price, tp]) =>
      `<g transform="translate(${x} ${y}) rotate(${r})"><g id="${id}" opacity="0"><g filter="url(#cutBeige)">${body}</g>` +
      `${SE.tab(-40, -100, -8, 1)}${SE.tab(40, -100, 8, 1)}` +
      `${SE.string(tp[0] > 0 ? 80 : -80, 40, tp[0], tp[1], "#8A7354", 18)}${kraftTag(tp[0], tp[1], price, 0)}</g></g>`).join(""));
    // 1929 老海报
    S.add("top",
      `<g transform="translate(360 470)"><g id="s7-1929" opacity="0"><g filter="url(#soft)"><rect x="-200" y="-280" width="400" height="560" rx="6" fill="#CDB892"/></g>` +
      `<rect x="-176" y="-256" width="352" height="512" fill="none" stroke="#8C7550" stroke-width="4"/>` +
      `<circle cx="0" cy="-90" r="56" fill="#5C4A2E"/><path d="M-90 200 L-50 -20 Q0 -40 50 -20 L90 200 Z" fill="#5C4A2E"/>` +
      `<path d="M40 -60 L130 -110" stroke="#F2EBDF" stroke-width="10" stroke-linecap="round"/><path d="M135 -115 Q150 -160 125 -190 Q105 -220 130 -250" fill="none" stroke="#F2EBDF" stroke-width="5" opacity="0.8"/>` +
      `<text x="0" y="240" text-anchor="middle" font-family="SESerif" font-weight="700" font-size="44" fill="#5C4A2E" letter-spacing="8">1929</text></g></g>`);

    // ---------- S8：货架上的一排“她” ----------
    const shelfDolls = ["a16", "a24", "a30", "a3", "a28", "a45", "a24", "a16"];
    const cardFills = ["#FFE0E5", "#E8DCC8", "#FFC9D2", "#ECEAE6", "#FFF1F3", "#F2EBDF", "#FFAAB8", "#E8DCC8"];
    const cols = [-1810, 70, 1950], rows = [-1100, 44, 1188];
    let wall = `<g id="s8-wall" opacity="0">`;
    let n = 0;
    rows.forEach((y0) => cols.forEach((x0) => {
      if (x0 === 70 && y0 === 44) return;
      const k = shelfDolls[n], fill = cardFills[n]; n++;
      wall += `<rect x="${x0}" y="${y0}" width="1780" height="992" rx="30" fill="${fill}"/><rect x="${x0 + 845}" y="${y0 + 26}" width="90" height="26" rx="13" fill="${C.beige}"/>` +
        `<g transform="translate(${x0 + DX - 70} ${y0 + DY - 44}) scale(${S.SC})"><g filter="url(#cutBeige)">${SE.doll(k, { id: `wall${n}` }).replace(/id="wall\d+[^"]*"/g, "")}</g></g>` +
        `<g transform="translate(${x0 + 1180} ${y0 + 250}) scale(2.4)">${SE.priceTag(0, 0, "¥", { w: 110, fill: C.kraft, ink: C.beigeInk, serif: true, hole: fill })}</g>`;
    }));
    // 挂钩横杆
    rows.forEach((y0) => { wall += `<rect x="-2400" y="${y0 - 40}" width="6700" height="26" rx="13" fill="#BFA77F"/>`; });
    wall += `</g>`;
    S.add("bg", wall);
    // 我们这张卡的大价签：背面空白，翻过来是“你的 3 分钟”
    S.add("top",
      `<g transform="translate(1640 150)"><g id="s8-tag" opacity="0">${SE.string(-120, -80, 0, 0, "#8A7354", 30)}` +
      `<g id="s8-tag-back"><path d="M0 0 L60 -150 L1000 -150 L1000 150 L60 150 Z" fill="${C.kraft}"/></g>` +
      `<g id="s8-tag-front"><path d="M0 0 L60 -150 L1000 -150 L1000 150 L60 150 Z" fill="${C.kraft}"/><circle cx="44" cy="0" r="16" fill="${C.card}"/>` +
      `<text x="530" y="-30" text-anchor="middle" font-family="SESerif" font-weight="700" font-size="84" fill="${C.beigeInk}">这条视频</text>` +
      `<text x="530" y="90" text-anchor="middle" font-family="SESerif" font-weight="700" font-size="84" fill="${C.beigeInk}">售价：你的 3 分钟</text></g></g></g>`);
    // 片名 + 黑场
    S.addHTML("hud",
      `<div id="s8-end" style="position:absolute;inset:0;opacity:0;background:${C.beige};display:flex;align-items:center;justify-content:center">` +
      `<span style="display:block;font-size:200px;font-weight:900;color:${C.beigeInk};letter-spacing:12px">她经济</span></div>` +
      `<div id="s8-black" style="position:absolute;inset:0;opacity:0;background:#120607"></div>`);

    S.label("你要做自己", 157.09, 166.2, S.px(-380), S.py(a45.chest[1]) - 30, -5, "beige");
    S.cap("2021 年，两则冒犯女性的广告，几天之内就被骂到下架", 147.77, 151.1);
    S.cap("她开始不买账了", 151.18, 153.8, { serif: true });
    S.ghost("做自己", 157.09, 166.2, { fill: C.beigeInk, op: 0.07, serif: true });
    S.cap("这一次，被打包出售的是“觉醒”", 160.18, 163.1, { serif: true });
    S.cap("1929 年，香烟就被包装成过女性的“自由火炬”", 163.26, 165.5, { serif: true });
    S.cap("这一招，用了将近一百年", 165.6, 169.3, { serif: true });
    S.cap("包括这一条，也在卖关于“觉醒”的东西", 171.0, 173.1, { serif: true });
    S.cap("下一次掏钱之前，也许可以问一句：这个问题，是谁替我起的名字？", 173.2, 176.8, { serif: true });

    S.step((tl) => {
      // ===== 141.87 起：每个钢琴音摘下一件，粉色褪一层 =====
      const notes = [141.87, 143.27, 144.89, 146.04, 146.58, 147.77, 148.86, 149.73, 150.67, 151.18];
      const fall = (sel, t, dir = 1) =>
        tl.to(sel, { y: 520, x: 60 * dir, rotation: 50 * dir, opacity: 0, duration: 0.7, ease: "power2.in", stagger: 0.02 }, t);
      const others = Object.keys(SE.ITEMS).filter((k) => !["tiara", "creamA", "creamB", "binder", "necklace", "ring"].includes(k)).map((k) => `#w45-${k}`);
      fall("#w45-tiara", notes[0], -1);
      const pis = gsap.utils.toArray("#s6-pile .pi");
      fall(pis.slice(0, 9), notes[1], 1);
      fall(pis.slice(9, 18), notes[2], -1);
      fall(pis.slice(18), notes[3], 1);
      tl.to("#s6-cart", { x: 700, opacity: 0, duration: 0.6, ease: "power2.in" }, notes[4]);
      fall(["#w45-creamA", "#w45-creamB"], notes[5], -1);
      fall(["#w45-binder", "#w45-necklace", "#w45-ring"], notes[6], 1);
      fall(others, notes[7], -1);
      tl.to(["#s6-swing", "#d45-stare"], { opacity: 0, duration: 0.3 }, notes[8]);
      notes.forEach((t, i) => S.bgTo(gsap.utils.interpolate(C.bg[5], C.grayBg, (i + 1) / notes.length), t, 0.3));
      tl.to(["#s1-dots", "#s4-dense", "#s5-stripes"], { opacity: 0, duration: 8.5, ease: "none" }, 142.0);
      S.fx("#s7-heap", 143.27, { opacity: 0 }, { opacity: 1 }, 7.5, "none");
      // 两张被撕掉的广告
      S.fx("#s7-torn", 147.77, { opacity: 0, scale: 1.1, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 }, 0.2, "power2.out");
      S.hide("#s7-torn", 150.9, 0.3);
      // 151.18 只剩最初的样子
      S.ageSwap("#age-a45", "#age-plain", 151.18);

      // ===== 153.92 律动进入：米色、“做自己” =====
      S.bgTo(C.beige, 153.92, 0.5);
      S.fx("#s7-frame", 153.92, { opacity: 0 }, { opacity: 1 }, 0.6);
      tl.to("#s7-heap", { opacity: 0.55, duration: 0.6 }, 153.92);
      S.clickIn("#s7-tee", 153.92, { x: 160, y: -420, rotation: 18 });
      S.fx("#s7-teetag", 154.3, { opacity: 0, y: -30 }, { opacity: 1, y: 0 }, 0.35, "back.out(2)");
      S.clickIn("#s7-book", 157.88, { x: 300, y: -300, rotation: 20 });
      S.clickIn("#s7-camp", 158.63, { x: 360, y: 60, rotation: -20 });
      S.clickIn("#s7-tote", 159.4, { x: 320, y: 260, rotation: 24 });
      // 1929
      tl.fromTo("#s7-1929", { opacity: 0 }, { opacity: 1, duration: 0.12, ease: "none", immediateRender: true }, 163.26);
      tl.fromTo("#s7-1929", { x: 0 }, { x: 3, duration: 0.05, ease: "none", yoyo: true, repeat: 7, immediateRender: false }, 163.3);
      S.hide("#s7-1929", 165.4, 0.25);

      // ===== S8：镜头拉远，货架上一排“她” =====
      tl.set("#s8-wall", { opacity: 1 }, 166.3);
      tl.to(["#s7-book", "#s7-camp", "#s7-tote"], { opacity: 0.85, duration: 0.3 }, 166.36);
      tl.fromTo("#cam", { scale: 1, x: 0, y: 0 }, { scale: 0.44, duration: 2.3, ease: "power2.inOut", immediateRender: false }, 166.36);
      tl.to("#cam", { scale: 0.4, duration: 4.4, ease: "none" }, 168.66);
      // 价签翻过来
      tl.set("#s8-tag", { opacity: 1 }, 168.64);
      tl.fromTo("#s8-tag-back", { scaleX: 1, transformOrigin: "50% 50%" }, { scaleX: 0, duration: 0.2, ease: "power2.in", immediateRender: true }, 169.23);
      tl.fromTo("#s8-tag-front", { scaleX: 0, transformOrigin: "50% 50%" }, { scaleX: 1, duration: 0.25, ease: "back.out(2)", immediateRender: true }, 169.43);
      // 173.2 推回她的脸，她攥着自己的价签
      const s = 1.45, fx = DX, fy = S.py(a45.headCY) + 40;
      tl.to("#cam", { scale: s, x: -s * (fx - 960), y: 500 - (540 + s * (fy - 540)), duration: 1.4, ease: "power3.inOut" }, 173.2);
      tl.to("#s7-teetag", { x: 30 - (a45.sw + 120), y: a45.chin + 40 - (a45.shoulderY + 96), duration: 0.8, ease: "power2.inOut" }, 173.4);
      // 176.9 片名，179.2 黑场
      tl.fromTo("#s8-end", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out", immediateRender: true }, 176.9);
      tl.to("#cam", { opacity: 0, duration: 0.5, ease: "power2.out" }, 176.9);
      tl.fromTo("#s8-end span", { scale: 1.08, transformOrigin: "50% 50%" }, { scale: 1, duration: 2.2, ease: "power2.out", immediateRender: true }, 176.9);
      tl.fromTo("#s8-black", { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power1.in", immediateRender: true }, 179.2);
    });
  });
})();
