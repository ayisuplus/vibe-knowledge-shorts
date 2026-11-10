// S2 读书（32.62–60.62）与 S3 恋爱（60.62–84.61）。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  (SE.SCENES = SE.SCENES || []).push(function (S) {
    const DX = S.DX, DY = S.DY;

    // ================= S2 读书 =================
    const a16 = SE.anchors("a16");
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a16" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a16", { id: "d16" })}</g>${SE.mouthSwap("a16", "flat", "d16-flat")}${SE.wear("a16", "w16")}` +
      // A4 纸挡在腰前
      `<g id="s2-a4" opacity="0"><g filter="url(#cut)"><rect x="-80" y="${f(a16.waistY - 110)}" width="160" height="226" fill="#ffffff" stroke="${C.main[1]}" stroke-width="5"/>` +
      `<text x="0" y="${f(a16.waistY + 14)}" text-anchor="middle" font-family="SESans" font-weight="900" font-size="46" fill="${C.main[5]}">A4</text></g></g>` +
      // 锁骨上的硬币
      `<g id="s2-coin" opacity="0"><circle cx="-34" cy="${f(a16.shoulderY + 4)}" r="15" fill="${C.yellow}" stroke="#E8B830" stroke-width="3"/><circle cx="34" cy="${f(a16.shoulderY + 4)}" r="15" fill="${C.yellow}" stroke="#E8B830" stroke-width="3"/></g>` +
      `</g></g>`);
    // 手机信息流：全是变美、变瘦
    const feed = ["7 天白一度", "瘦成一道闪电", "小脸针", "A4 腰挑战", "直角肩", "一白遮百丑", "-5kg 食谱", "冷白皮", "漫画腿"];
    let cards = "";
    feed.concat(feed).forEach((w, i) => {
      const y = 40 + i * 150;
      cards += `<g transform="translate(0 ${y})"><rect x="24" y="0" width="292" height="132" rx="16" fill="#ffffff"/>` +
        `<rect x="40" y="16" width="100" height="100" rx="12" fill="${C.main[i % 3]}"/>` +
        `<text x="228" y="76" text-anchor="middle" font-family="SESans" font-weight="800" font-size="26" fill="${C.inkDeep}">${w}</text></g>`;
    });
    S.add("front",
      `<g transform="translate(1330 170)"><g id="s2-phone" opacity="0"><g filter="url(#soft)"><rect x="0" y="0" width="340" height="680" rx="44" fill="${C.ink}"/></g>` +
      `<rect x="14" y="14" width="312" height="652" rx="34" fill="${C.bg[1]}"/>` +
      `<clipPath id="s2-clip"><rect x="14" y="14" width="312" height="652" rx="34"/></clipPath>` +
      `<g clip-path="url(#s2-clip)"><g id="s2-feed">${cards}</g></g><rect x="130" y="24" width="80" height="16" rx="8" fill="${C.ink}"/></g></g>`);
    // 两个挑战小卡
    const chal = (id, x, y, txt, icon) =>
      `<g transform="translate(${x} ${y})"><g id="${id}" opacity="0"><g filter="url(#soft)"><rect x="-160" y="-60" width="320" height="120" rx="18" fill="#ffffff"/></g>` +
      icon + `<text x="40" y="12" text-anchor="middle" font-family="SESans" font-weight="800" font-size="34" fill="${C.inkDeep}">${txt}</text></g></g>`;
    S.add("front",
      chal("s2-ch1", 330, 330, "锁骨放硬币", `<circle cx="-110" cy="0" r="26" fill="${C.yellow}" stroke="#E8B830" stroke-width="4"/>`) +
      chal("s2-ch2", 330, 500, "反手摸肚脐", `<path d="M-136 20 Q-110 -40 -84 0" fill="none" stroke="${C.main[3]}" stroke-width="10" stroke-linecap="round"/>`));
    // 纸飞机
    S.add("top", `<g transform="translate(${S.px(0)} ${S.py(a16.waistY)})"><g id="s2-plane" opacity="0"><g filter="url(#cut)"><path d="M-70 10 L80 -30 L-20 40 Z" fill="#ffffff"/><path d="M-20 40 L80 -30 L0 10 Z" fill="#F1E4E7"/></g></g></g>`);

    S.ageSticker("a16", "16 岁", 32.62, 60.4);
    S.label("不够白", 36.61, 60.4, S.px(-250), S.py(a16.chest[1]) - 70, -8);
    S.label("不够瘦", 36.95, 60.4, S.px(+30), S.py(a16.hipY) + 70, 7);
    S.ghost("不够白　不够瘦", 36.61, 60.4, { fill: C.main[1], op: 0.16 });
    S.cap("2016 年流行“A4 腰”：腰要比一张 A4 纸还细", 38.62, 42.62);
    S.stat("21 厘米", "一张 A4 纸的宽度", 38.62, 42.62, 1170, 150, { align: "right", w: 700, size: 190 });
    S.cap("2021 年一项调查：2063 名大学生里，59.03% 有不同程度的容貌焦虑", 44.61, 48.61);
    S.stat("59.03%", "的大学生有不同程度的容貌焦虑（2021，2063 人）", 44.61, 48.61, 1120, 150, { align: "right", w: 760, size: 200, color: "#E0243F" });
    S.cap("一个“美丽贷”案例：实际年化利率约 27%", 50.62, 54.62);
    S.stat("27%", "一个“美丽贷”案例的实际年化利率", 50.62, 54.62, 40, 110, { w: 500, size: 160, color: "#E0243F" });
    S.cap("2021 年，广电总局要求停播“美容贷”广告", 54.63, 58.62);

    S.step((tl) => {
      S.ageSwap("#age-a3", "#age-a16", 32.62);
      S.bgTo(C.bg[1], 32.62, 0.6);
      // 手机刷屏
      S.fx("#s2-phone", 34.61, { opacity: 0, y: 300 }, { opacity: 1, y: 0 }, 0.45, "power3.out");
      S.fx("#s2-feed", 34.61, { y: 0 }, { y: -1350 }, 4.0, "none");
      S.hide("#s2-phone", 38.3, 0.3);
      // A4 腰
      S.fx("#s2-a4", 38.62, { opacity: 0, x: -360, rotation: -20, transformOrigin: "50% 50%" }, { opacity: 1, x: 0, rotation: 0 }, 0.4, "power3.out");
      // 硬币、摸肚脐
      S.fx("#s2-coin", 42.62, { opacity: 0, y: -60 }, { opacity: 1, y: 0 }, 0.25, "back.out(3)");
      S.fx("#s2-ch1", 42.62, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 }, 0.25, "back.out(2.5)");
      S.fx("#s2-ch2", 43.29, { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1 }, 0.25, "back.out(2.5)");
      S.hide(["#s2-ch1", "#s2-ch2", "#s2-coin"], 44.3, 0.25);
      // 美白、瘦身扣上来
      S.clickIn("#w16-whitening", 44.61, { x: -400, y: -200, rotation: -30 });
      S.clickIn("#w16-slimTea", 45.28, { x: 420, y: -220, rotation: 30 });
      // 美丽贷：飞来悬停 → 犹豫（心跳） → 自己扣上
      S.fx("#w16-loanCard", 48.61, { opacity: 0, x: 520, y: -260, rotation: 25, scale: 1, transformOrigin: "50% 50%" }, { opacity: 1, x: 430, y: -60, rotation: 8, scale: 1.5 }, 0.5, "power3.out");
      tl.fromTo("#w16-loanCard", { scale: 1.5 }, { scale: 1.62, duration: 0.33, ease: "sine.inOut", yoyo: true, repeat: 5, immediateRender: false }, 50.62);
      S.fx("#d16-flat", 50.62, { opacity: 0 }, { opacity: 1 }, 0.1, "none");
      tl.to("#w16-loanCard", { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.36, ease: "power3.in" }, 54.27);
      tl.fromTo("#w16-loanCard", { scale: 1.22 }, { scale: 1, duration: 0.28, ease: "back.out(3)", immediateRender: false }, 54.63);
      S.hide("#d16-flat", 56.5, 0.15);
      // 58.62 A4 折成纸飞机扔出去
      tl.to("#s2-a4", { opacity: 0, scale: 0.4, duration: 0.25, ease: "power2.in" }, 58.62);
      S.fx("#s2-plane", 58.8, { opacity: 0, x: 0, y: 0, rotation: 0 }, { opacity: 1, x: 1250, y: -760, rotation: -12 }, 1.5, "power2.in");
      tl.to("#s2-plane", { opacity: 0, duration: 0.1 }, 60.3);
    });

    // ================= S3 恋爱 =================
    const a24 = SE.anchors("a24");
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a24" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a24", { id: "d24" })}</g>${SE.wear("a24", "w24")}` +
      // 额外的“送她”贴纸
      `<g id="s3-to1" opacity="0" data-layout-allow-overlap data-layout-allow-occlusion transform="translate(${f(a24.handL[0] - 70)} ${f(a24.handL[1] - 120)}) rotate(-12)"><rect x="-44" y="-20" width="88" height="40" rx="20" fill="${C.yellow}"/><text x="0" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="24" fill="${C.main[5]}">送她</text></g>` +
      `<g id="s3-to2" opacity="0" data-layout-allow-overlap data-layout-allow-occlusion transform="translate(${f(-70)} ${f(a24.shoulderY - 20)}) rotate(9)"><rect x="-44" y="-20" width="88" height="40" rx="20" fill="${C.yellow}"/><text x="0" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="24" fill="${C.main[5]}">送她</text></g>` +
      `</g></g>`);
    // 日历：四个情人节
    const dates = [["2.14", "情人节"], ["3.14", "白色情人节"], ["5.20", "520"], ["七夕", "农历七月初七"]];
    let cal = `<g transform="translate(1260 140)"><g id="s3-cal" opacity="0"><g filter="url(#soft)"><rect x="0" y="0" width="560" height="520" rx="28" fill="#ffffff"/></g>` +
      `<rect x="0" y="0" width="560" height="84" rx="28" fill="${C.main[2]}"/><rect x="0" y="56" width="560" height="28" fill="${C.main[2]}"/>` +
      `<circle cx="120" cy="20" r="10" fill="#fff"/><circle cx="440" cy="20" r="10" fill="#fff"/>`;
    dates.forEach(([d, n], i) => {
      const x = 40 + (i % 2) * 250, y = 120 + Math.floor(i / 2) * 190;
      cal += `<g transform="translate(${x + 115} ${y + 80})"><g class="date"><rect x="-115" y="-80" width="230" height="160" rx="20" fill="${C.bg[2]}"/>` +
        `<circle cx="0" cy="-12" r="52" fill="${C.main[3]}"/><text x="0" y="2" text-anchor="middle" font-family="SESans" font-weight="900" font-size="${d.length > 3 ? 36 : 40}" fill="#fff">${d}</text>` +
        `<text x="0" y="62" text-anchor="middle" font-family="SESans" font-weight="700" font-size="22" fill="${C.inkDeep}">${n}</text></g></g>`;
    });
    S.add("front", cal + `</g></g>`);
    // 灰色纸男孩：价签都朝着他
    const boy = SE.doll("boy", { id: "boy" }).replace(/id="boy[^"]*"/g, "");
    S.add("mid",
      `<g transform="translate(1540 ${DY}) scale(1.28)"><g id="s3-boy" opacity="0"><g filter="url(#drain)"><g filter="url(#cut)">${boy}</g></g>` +
      `<g transform="translate(-170 -360)">${SE.priceTag(0, 0, "¥", { w: 90, rot: -10, hole: C.bg[2] })}</g>` +
      `<g transform="translate(-190 -270)">${SE.priceTag(0, 0, "¥", { w: 90, rot: 6, hole: C.bg[2] })}</g>` +
      `<g transform="translate(-160 -180)">${SE.priceTag(0, 0, "¥", { w: 90, rot: -4, hole: C.bg[2] })}</g></g></g>`);
    // 镜子 + 很小的口号
    S.add("mid",
      `<g transform="translate(360 520)"><g id="s3-mirror" opacity="0"><g filter="url(#soft)"><ellipse cx="0" cy="0" rx="170" ry="230" fill="${C.yellow}"/></g>` +
      `<ellipse cx="0" cy="0" rx="146" ry="206" fill="#FFF6F8"/><path d="M-90 -120 L-40 -170 M-100 -60 L0 -160" stroke="#ffffff" stroke-width="16" stroke-linecap="round"/>` +
      `<text x="0" y="176" text-anchor="middle" font-family="SESans" font-weight="600" font-size="22" fill="${C.ink}">你值得拥有</text></g></g>`);

    S.ageSticker("a24", "24 岁", 60.62, 84.4);
    S.cap("一年，四个情人节", 62.61, 64.62);
    S.label("爱要有仪式感", 64.62, 84.4, S.px(-60), S.py(a24.chest[1]) - 40, -5);
    S.ghost("仪式感", 64.62, 84.4, { fill: C.main[1], op: 0.16 });
    S.cap("2024 年 520 期间，一家电商平台的黄金、珍珠首饰成交额同比增长 132%", 68.62, 72.61);
    S.stat("+132%", "2024 年 520 期间，某电商平台黄金、珍珠首饰成交额同比", 68.62, 72.61, 40, 100, { w: 500, size: 140, color: "#E0243F" });
    S.cap("买单的常常不是她，但被瞄准的一直是她", 72.61, 76.61);
    S.cap("给自己买，叫“悦己”", 76.61, 80.62);
    S.stat("你值得拥有", "镜子边上的一句广告口号", 80.62, 84.4, 1130, 380, { align: "right", w: 740, size: 120 });

    S.step((tl) => {
      S.ageSwap("#age-a16", "#age-a24", 60.62);
      S.bgTo(C.bg[2], 60.62, 0.6);
      // 日历四个日子按拍亮起
      S.fx("#s3-cal", 62.4, { opacity: 0, y: -40 }, { opacity: 1, y: 0 }, 0.3, "power3.out");
      const dEls = "#s3-cal .date";
      S.fx(dEls, 62.61, { opacity: 0, scale: 0.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, stagger: 0.67 }, 0.3, "back.out(2.5)");
      S.hide("#s3-cal", 66.3, 0.3);
      // 纸男孩递礼物
      S.fx("#s3-boy", 66.62, { opacity: 0, x: 300 }, { opacity: 1, x: 0 }, 0.5, "power3.out");
      S.clickIn("#w24-bouquet", 68.62, { x: 640, y: -40, rotation: 20 });
      S.clickIn("#w24-giftBox", 69.28, { x: 560, y: -20, rotation: 18 });
      S.clickIn("#w24-necklace", 69.95, { x: 620, y: 40, rotation: 10 });
      // “送她”贴纸
      S.fx(["#s3-to1", "#s3-to2"], 72.61, { opacity: 0, scale: 2 }, { opacity: 1, scale: 1, stagger: 0.33 }, 0.3, "back.out(2.5)");
      // 男孩退场，她自己买口红
      tl.to("#s3-boy", { opacity: 0, x: 300, duration: 0.4, ease: "power2.in" }, 76.2);
      S.clickIn("#w24-selfLipstick", 76.61, { x: -420, y: -120, rotation: -30 });
      S.fx("#s3-mirror", 80.62, { opacity: 0, x: -80 }, { opacity: 1, x: 0 }, 0.45, "power3.out");
      S.hide("#s3-mirror", 84.3, 0.3);
    });
  });
})();
