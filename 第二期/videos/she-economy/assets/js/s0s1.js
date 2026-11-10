// S0 开场（0–16.61）与 S1 幼儿园（16.61–32.62）。
// 0–8.62 是钩子：一张“一生的购物小票”按拍打印，左边的她每拍长大一段；8.62 乐队进入，片名砸下来。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  (SE.SCENES = SE.SCENES || []).push(function (S) {
    const DX = S.DX, DY = S.DY;

    // ================= S0 钩子：一生的账单 =================
    S.add("back", `<rect id="s0-hookdots" width="2400" height="1080" fill="url(#dotsDense)" opacity="0"/>`);
    // 左：她飞快地长大（独立的一组娃娃，不和后面各段共用）
    const montage = ["a3", "a16", "a24", "a28", "a30", "a45"];
    const MX = 520, MY = 1010, MS = 1.12;
    let mont = `<g transform="translate(${MX} ${MY}) scale(${MS})"><g id="s0-mbaby" opacity="0" filter="url(#cut)">${SE.baby({ id: "mbaby" }).replace('id="mbaby-open" opacity="0"', 'id="mbaby-open"').replace('id="mbaby-closed"', 'id="mbaby-closed" opacity="0"')}</g>`;
    montage.forEach((k) => { mont += `<g id="s0-m${k}" opacity="0" filter="url(#cut)">${SE.doll(k, { id: `m${k}` }).replace(/id="m[a-z0-9]+(-[a-z]+)?"/g, "")}</g>`; });
    S.add("dolls", mont + `</g>`);
    // 右：小票打印机 + 一条越吐越长的小票
    const lines = [
      ["—— 她的一生 ——", "", "head"],
      ["公主裙 × 1", "¥ ···"],
      ["美白 · 瘦身 × N", "¥ ···"],
      ["美丽贷", "年化 27%"],
      ["520 礼盒 × 每年", "¥ ···"],
      ["钻戒 × 1", "¥ ···"],
      ["月子会所 28 天", "¥ 50,000+"],
      ["盆底修复 5 疗程", "近 ¥ 60,000"],
      ["双语早教", "¥ 20,000"],
      ["养到 17 岁", "¥ 538,000"],
      ["抗初老 × N", "¥ ···"],
      ["合计", "？", "total"],
    ];
    const RX = 1060, RW = 780, LH = 76, slotY = 64, N = lines.length;
    let rec = "";
    lines.forEach(([l, r, kind], i) => {
      const y = 70 + i * LH; // 从上往下一行行打印
      if (kind === "head") rec += `<text x="${RW / 2}" y="${y}" text-anchor="middle" font-family="SESans" font-weight="900" font-size="42" fill="${C.inkDeep}">${l}</text>`;
      else if (kind === "total") rec += `<line x1="30" y1="${y - 54}" x2="${RW - 30}" y2="${y - 54}" stroke="${C.inkDeep}" stroke-width="3" stroke-dasharray="10 8"/>` +
        `<text x="36" y="${y + 6}" font-family="SESans" font-weight="900" font-size="52" fill="${C.inkDeep}">${l}</text><text id="s0-total" x="${RW - 36}" y="${y + 10}" text-anchor="end" font-family="SESans" font-weight="900" font-size="66" fill="#E0243F">${r}</text>`;
      else rec += `<g class="rl"><text x="36" y="${y}" font-family="SESans" font-weight="700" font-size="38" fill="${C.inkDeep}">${l}</text><text x="${RW - 36}" y="${y}" text-anchor="end" font-family="SESans" font-weight="800" font-size="38" fill="${r.includes("···") ? "#8A5A63" : "#E0243F"}">${r}</text></g>`;
    });
    const paperH = 70 + (N - 1) * LH + 60;
    S.add("front",
      `<g id="s0-receipt" opacity="0"><clipPath id="s0-slot"><rect id="s0-clip" x="${RX - 40}" y="${slotY}" width="${RW + 80}" height="${paperH + 30}"/></clipPath>` +
      `<g clip-path="url(#s0-slot)"><g id="s0-tearwrap"><g transform="translate(${RX} ${slotY})"><g filter="url(#soft)"><path d="M0 0 L${RW} 0 L${RW} ${paperH} ` +
      [...Array(20)].map((_, k) => `L${f(RW - (k + 0.5) * RW / 20)} ${paperH + (k % 2 ? 0 : 16)}`).join(" ") + ` L0 ${paperH} Z" fill="#FFFDF9"/></g>${rec}</g></g></g>` +
      `<rect x="${RX - 50}" y="${slotY - 46}" width="${RW + 100}" height="60" rx="22" fill="${C.ink}"/><rect x="${RX - 10}" y="${slotY - 8}" width="${RW + 20}" height="10" rx="5" fill="#2A070D"/></g>`);
    S.addHTML("cam", `<div id="s0-disc" class="title" style="left:${RX}px;top:1040px;width:${RW}px;text-align:center"><span style="display:block;font-size:22px;font-weight:600;color:#ffffff">金额来自公开报道与调查，部分为个案</span></div>`);
    S.addHTML("cam",
      `<div id="s0-headline" class="title" style="left:60px;top:40px"><span style="display:block;font-size:84px;font-weight:900;color:#fff;line-height:1.12;letter-spacing:4px;text-shadow:0 6px 0 #B81D3A">一个女孩，</span>` +
      `<span style="display:block;font-size:84px;font-weight:900;color:#fff;line-height:1.12;letter-spacing:4px;text-shadow:0 6px 0 #B81D3A">一生的账单</span></div>`);

    // ================= S0 片名 + 出生 =================
    S.add("back",
      `<g id="s0-card" opacity="0"><g filter="url(#soft)"><rect x="${DX - 280}" y="250" width="560" height="760" rx="40" fill="#ffffff"/></g>` +
      `<rect x="${DX - 50}" y="278" width="100" height="28" rx="14" fill="#FFF1F3"/></g>`);
    S.add("dolls", `<g transform="translate(${DX} ${DY - 30}) scale(1.75)"><g id="s0-baby" filter="url(#cut)" opacity="0">${SE.baby({ id: "baby" })}</g></g>`);
    S.add("dolls",
      `<g id="s0-tag" opacity="0">${SE.string(DX + 120, DY - 260, DX + 240, DY - 180, C.main[1], 30)}<g filter="url(#soft)">${SE.priceTag(DX + 240, DY - 180, "", { w: 140, h: 66, hole: "#FFF1F3" })}</g></g>`);
    S.addHTML("cam",
      `<div id="s0-title" class="title" style="left:560px;top:330px"><span style="display:block;font-size:280px;font-weight:900;color:#5A1A24;letter-spacing:10px;line-height:1">她经济</span></div>` +
      `<div id="s0-sub" class="title" style="left:1118px;top:580px"><span style="display:block;font-size:54px;font-weight:700;color:#5A1A24;letter-spacing:4px">女性被消费主义裹挟的一生</span></div>`);

    S.step((tl) => {
      // 钩子：热粉背景开场
      tl.set("#bg", { backgroundColor: C.bg[5] }, 0);
      S.fx("#s0-hookdots", 0, { opacity: 0 }, { opacity: 0.7 }, 0.3, "none");
      tl.fromTo("#s0-hookdots", { x: 0 }, { x: -240, duration: 8.6, ease: "none", immediateRender: true }, 0);
      S.fx("#s0-headline", 0, { opacity: 0, scale: 1.5, x: -40 }, { opacity: 1, scale: 1, x: 0 }, 0.35, "back.out(1.8)");
      S.fx("#s0-receipt", 0, { opacity: 0 }, { opacity: 1 }, 0.2, "none");
      // 小票按四分音符一行行吐出来（纸往下推）
      const q = 0.6667;
      for (let i = 0; i < N; i++) {
        const h0 = i === 0 ? 0 : (70 + (i - 1) * LH + 20) / (paperH + 30), h1 = (i === N - 1 ? paperH + 30 : 70 + i * LH + 20) / (paperH + 30);
        tl.fromTo("#s0-clip", { scaleY: h0, transformOrigin: "50% 0%" }, { scaleY: h1, duration: 0.14, ease: "power2.out", immediateRender: i === 0 }, 0.6 + i * q);
      }
      S.fx("#s0-disc", 7.94, { opacity: 0 }, { opacity: 1 }, 0.2, "none");
      tl.to("#s0-disc", { opacity: 0, duration: 0.2 }, 8.3);
      // 合计“？”放大闪一下
      tl.fromTo("#s0-total", { scale: 1, transformOrigin: "100% 50%" }, { scale: 1.5, duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1, immediateRender: false }, 0.6 + (N - 1) * q + 0.15);
      // 她每拍长大一段
      const order = ["#s0-mbaby", "#s0-ma3", "#s0-ma16", "#s0-ma24", "#s0-ma28", "#s0-ma30", "#s0-ma45"];
      const ts = [0.6, 1.93, 3.27, 3.93, 4.61, 5.27, 6.61];
      order.forEach((sel, i) => {
        tl.fromTo(sel, { opacity: 0, scaleX: 0.2, transformOrigin: "50% 100%" }, { opacity: 1, scaleX: 1, duration: 0.2, ease: "back.out(2.5)", immediateRender: true }, ts[i]);
        if (i < order.length - 1) tl.to(sel, { opacity: 0, duration: 0.08 }, ts[i + 1] - 0.04);
      });
      // 8.15 小票撕下来掉出画面，她和标题让位
      tl.to("#s0-tearwrap", { y: 1300, rotation: 9, duration: 0.5, ease: "power3.in", transformOrigin: "50% 0%" }, 8.15);
      tl.to(["#s0-headline", "#s0-ma45"], { opacity: 0, duration: 0.25 }, 8.3);
      tl.to("#s0-hookdots", { opacity: 0, duration: 0.4 }, 10.2);
      tl.to("#s0-receipt", { opacity: 0, duration: 0.15 }, 8.6);
      // 8.62 片名
      S.fx("#s0-title", 8.62, { opacity: 0, scale: 1.8, y: -40, x: 0 }, { opacity: 1, scale: 1, y: 0 }, 0.4, "back.out(1.8)");
      tl.to("#s0-title", { x: 550, y: -30, scale: 0.82, transformOrigin: "0% 50%", duration: 0.6, ease: "power3.inOut" }, 10.2);
      // 10.61 回到起点：纸面变干净，一张空白商品卡里弹出婴儿
      S.bgTo("#FFF6F4", 10.3, 0.5);
      S.show("#s0-sub", 10.61, { opacity: 0, x: -30 }, 0.5);
      S.fx("#s0-card", 10.61, { opacity: 0, y: 60 }, { opacity: 1, y: 0 }, 0.45, "power3.out");
      S.fx("#s0-baby", 11.3, { opacity: 0, scale: 0.3, y: 60, transformOrigin: "50% 100%" }, { opacity: 1, scale: 1, y: 0 }, 0.5, "back.out(2.4)");
      S.fx("#baby-closed", 12.61, { opacity: 1 }, { opacity: 0 }, 0.12, "none");
      S.fx("#baby-open", 12.61, { opacity: 0 }, { opacity: 1 }, 0.12, "none");
      S.bgTo(C.bg[0], 12.61, 2.0);
      // 14.62 第一个空白价签
      S.fx("#s0-tag", 14.62, { opacity: 0, y: -50, rotation: -20, transformOrigin: "0% 0%" }, { opacity: 1, y: 0, rotation: 0 }, 0.35, "back.out(2.5)");
      S.hide(["#s0-title", "#s0-sub"], 15.9, 0.4);
      tl.to(["#s0-card", "#s0-tag"], { opacity: 0, duration: 0.3 }, 16.3);
      tl.to("#s0-baby", { opacity: 0, scaleX: 0.15, duration: 0.18, ease: "power2.in" }, 16.43);
    });

    // ================= S1 幼儿园 =================
    const a3 = SE.anchors("a3");
    const shelf = (x0, w, colors, id) => {
      let s = `<g id="${id}">`;
      [300, 560, 820].forEach((y, row) => {
        let x = x0 + 20, k = 0;
        while (x < x0 + w - 80) {
          const bw = 80 + ((row * 3 + k) % 3) * 26, bh = 110 + ((row + k) % 3) * 34;
          s += `<g filter="url(#soft)"><rect x="${x}" y="${y - bh}" width="${bw}" height="${bh}" rx="12" fill="${colors[(row + k) % colors.length]}"/>` +
            `<rect x="${x + 14}" y="${y - bh + 16}" width="${bw - 28}" height="${f(bh * 0.42)}" rx="6" fill="#ffffff" fill-opacity="0.55"/></g>`;
          x += bw + 16; k++;
        }
        s += `<rect x="${x0}" y="${y}" width="${w}" height="22" rx="6" fill="#ffffff"/>`;
      });
      return s + `</g>`;
    };
    S.add("back", `<rect id="s1-dots" width="2400" height="1080" fill="url(#dots)" opacity="0"/>`);
    S.ghost("公主", 18.61, 32.4, { fill: C.main[1], op: 0.16 });
    S.add("mid", shelf(-20, 520, ["#8EC5EC", "#6FAEDD", "#B8DBF3"], "s1-blue") + shelf(1170, 750, [C.main[0], C.main[1], "#FFC2CC"], "s1-pink"));
    const faces = [1, -1, 1, -1, 1];
    let prin = `<g id="s1-princess"><g class="prin" filter="url(#soft)"><rect x="1150" y="50" width="740" height="400" rx="28" fill="#ffffff"/></g>`;
    faces.forEach((dir, i) => {
      const x = 1250 + i * 135, y = 120 + (i % 2) * 40;
      prin += `<g transform="translate(${x} ${y}) scale(1.25)"><g class="prin"><g filter="url(#soft)">` +
        `<path d="M-40 150 L-14 54 L14 54 L40 150 Z" fill="${C.ink}"/>` +
        `<circle cx="0" cy="30" r="27" fill="${C.ink}"/><path d="M${dir * 24} 26 L${dir * 36} 34 L${dir * 24} 40 Z" fill="${C.ink}"/>` +
        `<path d="M-18 6 L-14 -12 L-6 -2 L0 -16 L6 -2 L14 -12 L18 6 Z" fill="${C.yellow}"/></g>` +
        `<g class="sight" transform="translate(${dir * 30} 30)"><line x1="0" y1="0" x2="${dir * 100}" y2="${-40 + (i % 3) * 40}" stroke="${C.main[3]}" stroke-width="4" stroke-dasharray="10 8"/></g></g></g>`;
    });
    S.add("front", prin + `</g>`);
    S.add("dolls",
      `<g transform="${SE.dollT}"><g id="age-a3" opacity="0">` +
      `<g filter="url(#cut)">${SE.doll("a3", { id: "d3" })}</g>${SE.wear("a3", "w3")}` +
      `<path id="s1-smear" d="M-14 ${f(a3.mouth[1] - 4)} Q2 ${f(a3.mouth[1] + 10)} 22 ${f(a3.mouth[1] + 2)}" fill="none" stroke="#FF4D6D" stroke-width="7" stroke-linecap="round" opacity="0"/>` +
      `</g></g>`);
    const hx = S.px(a3.handL[0]), hy = S.py(a3.handL[1]);
    S.add("top",
      `<g id="s1-dino" opacity="0" transform="translate(250 470)"><g id="s1-dino-in">` +
      `<g filter="url(#cut)"><g>${SE.SHAPE.dino("#7DB7E8")}</g><g id="s1-dino-pink" opacity="0">${SE.SHAPE.dino(C.main[1])}</g></g>` +
      `${SE.string(30, 30, 70, 76, "#fff", 18)}<g filter="url(#soft)" transform="translate(70 76)">` +
      `<path d="M0 0 L18 -27 L126 -27 L126 27 L18 27 Z" fill="#fff"/><circle cx="12" cy="0" r="5" fill="${C.bg[0]}"/>` +
      `<g id="s1-price-a"><text x="72" y="9" text-anchor="middle" font-family="SESans" font-weight="800" font-size="24" fill="${C.inkDeep}">价格</text></g>` +
      `<g id="s1-price-b" opacity="0"><text x="72" y="10" text-anchor="middle" font-family="SESans" font-weight="900" font-size="30" fill="#E0243F">+7%</text></g></g>` +
      `</g></g>`);

    S.ageSticker("a3", "3 岁", 16.61, 32.4);
    S.label("女孩要像公主", 18.61, 32.4, S.px(-30), S.py(a3.chest[1]) - 10, -6);
    S.cap("2000 年，一家公司第一次把不同故事里的公主放在一起卖", 20.61, 24.61);
    S.cap("规定之一：公主们在画面上互不对视", 24.61, 26.61);
    S.cap("纽约 2015 年调查约 800 件分男女款的商品：女款平均贵 7%", 26.61, 30.62);
    S.cap("也有研究发现，成分相同的个护产品，女款并不总是更贵", 28.62, 32.4, { note: true });
    S.stat("+7%", "同款商品，女款平均更贵（纽约，2015）", 26.61, 32.4, 1170, 70, { align: "right", w: 700, size: 230, color: "#E0243F" });

    S.step((tl) => {
      S.ageSwap(null, "#age-a3", 16.61);
      S.fx("#s1-dots", 16.61, { opacity: 0 }, { opacity: 0.55 }, 0.8);
      S.fx("#s1-blue", 16.61, { opacity: 0, x: -200 }, { opacity: 1, x: 0 }, 0.5, "power3.out");
      S.fx("#s1-pink", 16.61, { opacity: 0, x: 200 }, { opacity: 1, x: 0 }, 0.5, "power3.out");
      S.fx("#s1-princess .prin", 20.61, { opacity: 0, y: -40 }, { opacity: 1, y: 0, stagger: 0.08 }, 0.35, "back.out(2)");
      S.clickIn("#w3-tiara", 21.28, { x: 380, y: -320, rotation: 40 });
      S.clickIn("#w3-tutu", 21.95, { x: 420, y: 60, rotation: -20 });
      S.fx("#s1-princess .sight", 24.61, { scaleX: 0, opacity: 0, transformOrigin: "0% 50%" }, { scaleX: 1, opacity: 1, stagger: 0.07 }, 0.4, "power2.out");
      S.hide("#s1-princess", 26.3, 0.3);
      S.fx("#s1-dino", 16.61, { opacity: 0 }, { opacity: 1 }, 0.5);
      S.fx("#s1-dino", 26.61, { x: 250, y: 470, scale: 1 }, { x: hx - 360, y: hy - 200, scale: 1.7 }, 0.55, "power3.inOut");
      S.fx("#s1-dino-pink", 27.28, { opacity: 0 }, { opacity: 1 }, 0.18, "none");
      S.fx("#s1-price-a", 27.28, { scaleY: 1, transformOrigin: "50% 50%" }, { scaleY: 0 }, 0.12, "power2.in");
      S.fx("#s1-price-b", 27.4, { opacity: 0, scaleY: 0, transformOrigin: "50% 50%" }, { opacity: 1, scaleY: 1 }, 0.2, "back.out(3)");
      S.clickIn("#w3-makeupBox", 30.62, { x: 360, y: -60, rotation: 30 });
      S.fx("#s1-smear", 31.0, { opacity: 0 }, { opacity: 1 }, 0.2, "none");
      tl.to("#s1-blue", { opacity: 0, x: -200, duration: 0.3, ease: "power2.in" }, 32.3);
      tl.to("#s1-pink", { opacity: 0, x: 200, duration: 0.3, ease: "power2.in" }, 32.3);
      S.hide("#s1-dino", 32.3, 0.3);
    });
  });
})();
