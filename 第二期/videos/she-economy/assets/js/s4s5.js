// S4 结婚（84.61–100.62）与 S5 生孩子（100.62–122.61）。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  (SE.SCENES = SE.SCENES || []).push(function (S) {
    const DX = S.DX, DY = S.DY;

    // ================= S4 结婚 =================
    const a28 = SE.anchors("a28");
    S.add("back", `<rect id="s4-dense" width="2400" height="1080" fill="url(#dotsDense)" opacity="0"/>`);
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a28" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a28", { id: "d28" })}</g>${SE.wear("a28", "w28")}</g></g>`);
    // 戒指盒
    S.add("front",
      `<g transform="translate(${S.px(300)} ${S.py(-300)})"><g id="s4-box" opacity="0">` +
      `<g filter="url(#soft)"><rect x="-90" y="-10" width="180" height="110" rx="18" fill="${C.main[4]}"/></g>` +
      `<rect x="-60" y="10" width="120" height="40" rx="12" fill="#B81D3A"/>` +
      `<g id="s4-lid"><rect x="-90" y="-80" width="180" height="70" rx="18" fill="${C.main[3]}"/></g>` +
      `<g id="s4-gem" opacity="0" transform="translate(0 -10)">${SE.SHAPE.ring()}</g></g></g>`);
    S.add("top", `<rect id="s4-flash" width="1920" height="1080" fill="#ffffff" opacity="0"/>`);
    // 打字机
    S.add("front",
      `<g transform="translate(1520 560)"><g id="s4-type" opacity="0">` +
      `<g filter="url(#soft)"><rect x="-250" y="-260" width="500" height="260" rx="10" fill="#FFFDF8"/></g>` +
      `<clipPath id="s4-clipA"><rect id="s4-clipA-r" x="-230" y="-200" width="460" height="90"/></clipPath>` +
      `<g clip-path="url(#s4-clipA)"><text id="s4-en" x="0" y="-140" text-anchor="middle" font-family="Courier New, monospace" font-weight="700" font-size="40" fill="${C.inkDeep}">A Diamond Is Forever</text></g>` +
      `<text id="s4-zh" x="0" y="-140" text-anchor="middle" font-family="SESans" font-weight="800" font-size="38" fill="${C.inkDeep}" opacity="0">钻石恒久远，一颗永流传</text>` +
      `<text x="0" y="-60" text-anchor="middle" font-family="SESans" font-weight="700" font-size="26" fill="${C.main[5]}">1947</text>` +
      `<g filter="url(#soft)"><rect x="-300" y="0" width="600" height="200" rx="40" fill="${C.ink}"/></g>` +
      [...Array(3)].map((_, r) => [...Array(9)].map((_, k) => `<circle cx="${-220 + k * 55 + (r % 2) * 22}" cy="${55 + r * 45}" r="16" fill="#FFE0E5"/>`).join("")).join("") +
      `</g></g>`);

    S.ageSticker("a28", "28 岁", 84.61, 100.4);
    S.label("爱要被证明", 88.62, 100.4, S.px(-260), S.py(a28.chest[1]) - 10, -6);
    S.ghost("永恒", 88.62, 100.4, { fill: "#ffffff", op: 0.22 });
    S.cap("1947 年，一位广告文案为一家钻石公司写下：A Diamond Is Forever", 90.62, 94.62);
    S.stat("1947", "一句钻石广告语诞生", 90.62, 98.4, 40, 110, { w: 500, size: 170 });
    S.cap("后来它跟着广告来到中国：钻石恒久远，一颗永流传", 94.62, 98.5);

    S.step((tl) => {
      S.ageSwap("#age-a24", "#age-a28", 84.61);
      S.bgTo(C.bg[3], 84.61, 0.6);
      S.fx("#s4-dense", 84.61, { opacity: 0 }, { opacity: 0.6 }, 0.8);
      // 戒指盒打开，钻石照白画面
      S.fx("#s4-box", 86.2, { opacity: 0, y: 80 }, { opacity: 1, y: 0 }, 0.35, "back.out(2)");
      S.fx("#s4-lid", 86.61, { rotation: 0, transformOrigin: "50% 100%" }, { rotation: -110 }, 0.25, "power3.out");
      S.fx("#s4-gem", 86.61, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1.6 }, 0.3, "back.out(3)");
      tl.fromTo("#s4-flash", { opacity: 0 }, { opacity: 0.92, duration: 0.12, ease: "power2.out", immediateRender: true }, 86.75);
      tl.to("#s4-flash", { opacity: 0, duration: 0.9, ease: "power2.in" }, 86.9);
      // 打字机：英文逐字出现，再换成中文
      S.fx("#s4-type", 90.4, { opacity: 0, x: 200 }, { opacity: 1, x: 0 }, 0.35, "power3.out");
      S.fx("#s4-clipA-r", 90.62, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1 }, 2.2, "steps(20)");
      tl.to("#s4-en", { opacity: 0, duration: 0.2 }, 94.5);
      S.fx("#s4-zh", 94.62, { opacity: 0, y: 14 }, { opacity: 1, y: 0 }, 0.35);
      S.hide("#s4-type", 98.3, 0.3);
      // 婚纱照、金饰，然后戒指：手被压得一沉
      S.clickIn("#w28-weddingPhoto", 96.62, { x: 420, y: -200, rotation: 24 });
      S.clickIn("#w28-goldSet", 97.29, { x: -420, y: -160, rotation: -24 });
      tl.to("#s4-gem", { opacity: 0, duration: 0.15 }, 98.3);
      S.hide("#s4-box", 98.4, 0.2);
      S.clickIn("#w28-ring", 98.62, { x: 600, y: -260, rotation: 30 });
      tl.to("#w28-ring", { y: 46, duration: 0.3, ease: "power4.in" }, 98.95);
      tl.fromTo("#age-a28", { rotation: 0, transformOrigin: "50% 100%" }, { rotation: -2.5, duration: 0.3, ease: "power4.in", immediateRender: false }, 98.95);
    });

    // ================= S5 生孩子 =================
    const a30 = SE.anchors("a30");
    const px0 = DX - 440, pw = 880, py0 = 12, ph = 1060;
    S.add("back", `<rect id="s5-stripes" width="2400" height="1080" fill="url(#stripes)" opacity="0"/>`);
    // 吸塑包装：背卡在她后面，透明罩在她前面
    S.add("back",
      `<g id="s5-pack" opacity="0"><g filter="url(#soft)"><rect x="${px0}" y="${py0}" width="${pw}" height="${ph}" rx="40" fill="#FFD3DC"/></g>` +
      `<rect x="${px0}" y="${py0}" width="${pw}" height="128" rx="40" fill="${C.main[4]}"/><rect x="${px0}" y="${py0 + 88}" width="${pw}" height="40" fill="${C.main[4]}"/>` +
      `<rect x="${DX - 50}" y="${py0 + 22}" width="100" height="28" rx="14" fill="#FF8FA3"/>` +
      `<text x="${DX}" y="${py0 + 104}" text-anchor="middle" font-family="SESans" font-weight="900" font-size="52" fill="#ffffff" letter-spacing="6">新手妈妈 · 全套</text></g>`);
    S.add("top",
      `<g id="s5-bubble" opacity="0"><rect x="${px0 + 30}" y="${py0 + 150}" width="${pw - 60}" height="${ph - 170}" rx="70" fill="#ffffff" fill-opacity="0.14" stroke="#ffffff" stroke-opacity="0.8" stroke-width="6"/>` +
      `<path d="M${px0 + 70} ${py0 + 300} Q${px0 + 80} ${py0 + 220} ${px0 + 150} ${py0 + 210} L${px0 + 190} ${py0 + 210} Q${px0 + 100} ${py0 + 236} ${px0 + 96} ${py0 + 330} L${px0 + 96} ${py0 + 700} L${px0 + 70} ${py0 + 700} Z" fill="#ffffff" fill-opacity="0.4"/></g>`);
    // 爆炸贴：30 岁 限定版（包装上的）
    // 她 + 怀里的女婴（女婴后面会扣上小皇冠和空白价签）
    const babyX = -10, babyY = a30.waistY + 40;
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a30" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a30", { id: "d30" })}</g>${SE.wear("a30", "w30")}` +
      `<g transform="translate(${babyX} ${babyY}) scale(0.62)"><g filter="url(#cut)">${SE.baby({ id: "baby2" }).replace('id="baby2-open" opacity="0"', 'id="baby2-open"').replace('id="baby2-closed"', 'id="baby2-closed" opacity="0"')}</g>` +
      `<g transform="translate(0 -290) scale(0.7)"><g id="s5-babycrown" opacity="0" filter="url(#cut)">${SE.SHAPE.tiara()}</g></g>` +
      `<g id="s5-babytag" opacity="0">${SE.string(60, -150, 150, -90, "#ffffff", 26)}<g filter="url(#soft)">${SE.priceTag(150, -90, "", { w: 120, hole: C.bg[4] })}</g></g></g>` +
      `</g></g>`);
    // 疗程卡放大 + 五个盖章
    let stamp = `<g transform="translate(1530 470)"><g id="s5-stampcard" opacity="0"><g filter="url(#soft)"><rect x="-260" y="-150" width="520" height="300" rx="24" fill="#FFF0F3"/></g>` +
      `<rect x="-260" y="-150" width="520" height="80" rx="24" fill="${C.main[4]}"/><rect x="-260" y="-100" width="520" height="30" fill="${C.main[4]}"/>` +
      `<text x="0" y="-96" text-anchor="middle" font-family="SESans" font-weight="900" font-size="36" fill="#fff">盆底修复 · 5 疗程</text>`;
    for (let i = 0; i < 5; i++) {
      const x = -200 + i * 100;
      stamp += `<circle cx="${x}" cy="40" r="38" fill="none" stroke="${C.main[1]}" stroke-width="4" stroke-dasharray="8 6"/>` +
        `<g transform="translate(${x} 40)"><g class="stamp" opacity="0"><circle r="40" fill="${C.main[5]}"/><text x="0" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="28" fill="#fff">已用</text></g></g>`;
    }
    S.add("front", stamp + `<text x="0" y="128" text-anchor="middle" font-family="SESans" font-weight="800" font-size="30" fill="${C.inkDeep}">近 ¥ 60,000</text></g></g>`);
    // 早教卡上的黄色贴纸（放在扣好的位置附近）
    const ec = SE.ITEMS.eduCard.place.a30;
    S.add("top",
      `<g transform="translate(${f(S.px(a30.hip[0] + ec[1] + 20))} ${f(S.py(a30.hip[1] + ec[2] - 70))}) rotate(-8)"><g id="s5-key" opacity="0"><g filter="url(#soft)"><rect x="-110" y="-26" width="220" height="52" rx="26" fill="${C.yellow}"/></g>` +
      `<text x="0" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="28" fill="${C.main[5]}">别错过关键期</text></g></g>`);
    // 塞进包装的东西
    const stuff = [["milk", -320, 820, -10], ["bag", 310, 880, 8], ["book", -310, 560, -14]];
    S.add("top", stuff.map(([k, x, y, r]) => `<g transform="translate(${DX + x} ${y}) rotate(${r}) scale(1.15)"><g id="s5-${k}" opacity="0" filter="url(#cut)">${SE.SHAPE[k]()}${SE.tab(-30, -44, -8, 0.8)}${SE.tab(30, -44, 8, 0.8)}</g></g>`).join(""));

    S.ageSticker("a30", "30 岁", 100.62, 122.4);
    S.label("你的身体需要修复", 102.62, 112.3, S.px(-200), S.py(a30.chest[1]) + 40, -5);
    S.cap("记者调查：产后常见、多数能自然恢复的变化，被说成需要处理的“病症”", 104.62, 108.62);
    S.cap("一位产妇产后第 42 天，花了近 6 万元，买了 5 个疗程", 108.62, 112.62);
    S.label("别让孩子输在起跑线上", 112.62, 122.4, S.px(-330), S.py(a30.hipY) + 110, 4);
    S.ghost("修复", 102.62, 122.4, { fill: "#ffffff", op: 0.22 });
    S.cap("早教顾问对一个 6 个月大婴儿的家长说：别错过关键期", 114.61, 118.62);
    S.stat("6 个月", "就被提醒“别错过关键期”", 114.61, 120.4, 1230, 160, { align: "right", w: 640, size: 190, color: "#E0243F" });

    S.step((tl) => {
      S.ageSwap("#age-a28", "#age-a30", 100.62);
      S.bgTo(C.bg[4], 100.62, 0.6);
      S.fx("#s5-stripes", 100.62, { opacity: 0 }, { opacity: 1 }, 0.8);
      // 包装从天而降，“砰”合上
      S.fx("#s5-pack", 100.62, { opacity: 0, y: -1100 }, { opacity: 1, y: 0 }, 0.45, "bounce.out");
      S.fx("#s5-bubble", 100.95, { opacity: 0, scale: 1.15, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 }, 0.25, "power4.in");
      // 月子会所、束腹带、盆底修复
      S.clickIn("#w30-monthCard", 103.29, { x: -460, y: -200, rotation: -30 });
      S.clickIn("#w30-binder", 103.95, { x: 500, y: 40, rotation: 20 });
      S.clickIn("#w30-pelvicCard", 104.62, { x: 460, y: -220, rotation: 30 });
      // 疗程卡盖章 ×5
      S.fx("#s5-stampcard", 106.3, { opacity: 0, x: 120 }, { opacity: 1, x: 0 }, 0.3, "power3.out");
      tl.fromTo("#s5-stampcard .stamp", { opacity: 0, scale: 2.2, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.14, ease: "power4.in", stagger: 0.666, immediateRender: true }, 106.5);
      S.hide("#s5-stampcard", 112.3, 0.3);
      // 早教
      S.clickIn("#w30-eduCard", 114.61, { x: 520, y: 120, rotation: 24 });
      S.fx("#s5-key", 115.0, { opacity: 0, scale: 2 , transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 }, 0.25, "back.out(3)");
      // 奶粉、待产包、绘本塞进去，包装被撑变形
      S.clickIn("#s5-milk", 118.62, { x: -300, y: -300, rotation: -40 });
      S.clickIn("#s5-bag", 119.29, { x: 300, y: -300, rotation: 40 });
      S.clickIn("#s5-book", 119.95, { x: -300, y: -100, rotation: -30 });
      tl.fromTo("#s5-bubble", { scaleX: 1, scaleY: 1 }, { scaleX: 1.05, scaleY: 0.97, duration: 0.2, ease: "power2.out", yoyo: true, repeat: 3, immediateRender: false }, 118.62);
      // 120.62 循环：怀里的女婴扣上小皇冠和空白价签
      S.fx("#s5-babycrown", 120.62, { opacity: 0, y: -200, rotation: 30, transformOrigin: "50% 50%" }, { opacity: 1, y: 0, rotation: 0 }, 0.3, "back.out(2.5)");
      S.fx("#s5-babytag", 121.29, { opacity: 0, y: -40 }, { opacity: 1, y: 0 }, 0.3, "back.out(2.5)");
      // 离场：包装飞走
      tl.to(["#s5-pack", "#s5-bubble", "#s5-key", "#s5-milk", "#s5-bag", "#s5-book"], { opacity: 0, y: -60, duration: 0.3, ease: "power2.in" }, 122.3);
    });
  });
})();
