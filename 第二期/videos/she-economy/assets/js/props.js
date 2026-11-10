// 道具：扣在她身上的商品（局部坐标，原点在道具中心，大小约 100px），以及它们在每个年龄的位置。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;
  const T = (x, y, txt, fs = 22, fill = C.inkDeep, w = 800) =>
    `<text data-layout-allow-overlap data-layout-allow-occlusion x="${f(x)}" y="${f(y)}" text-anchor="middle" font-family="SESans" font-weight="${w}" font-size="${fs}" fill="${fill}">${txt}</text>`;

  // ---------- 道具外形 ----------
  SE.SHAPE = {
    tiara: () =>
      `<path d="M-52 22 L-44 -22 L-24 4 L0 -36 L24 4 L44 -22 L52 22 Z" fill="${C.yellow}"/>` +
      `<circle cx="0" cy="-2" r="9" fill="${C.main[3]}"/><circle cx="-30" cy="12" r="5" fill="#fff"/><circle cx="30" cy="12" r="5" fill="#fff"/>`,
    tutu: () =>
      `<path d="M-70 -18 Q0 -34 70 -18 L104 38 Q52 58 0 50 Q-52 58 -104 38 Z" fill="${C.main[0]}"/>` +
      `<path d="M-98 30 Q-74 46 -50 32 Q-26 48 0 34 Q26 48 50 32 Q74 46 98 30" fill="none" stroke="#fff" stroke-width="5"/>` +
      `<path d="M-70 -18 Q0 -34 70 -18 L70 -4 Q0 -20 -70 -4 Z" fill="${C.main[2]}"/>`,
    toyLipstick: () =>
      `<rect x="-14" y="-6" width="28" height="44" rx="5" fill="${C.main[1]}"/><rect x="-11" y="-30" width="22" height="26" rx="4" fill="#fff"/>` +
      `<path d="M-9 -30 L-9 -48 Q0 -60 9 -48 L9 -30 Z" fill="#FF4D6D"/><circle cx="0" cy="18" r="6" fill="${C.yellow}"/>`,
    makeupBox: () =>
      `<rect x="-58" y="-36" width="116" height="72" rx="12" fill="${C.main[1]}"/><rect x="-58" y="-36" width="116" height="22" rx="10" fill="${C.main[3]}"/>` +
      `<circle cx="-30" cy="12" r="13" fill="#FF4D6D"/><circle cx="0" cy="12" r="13" fill="${C.yellow}"/><circle cx="30" cy="12" r="13" fill="#fff"/>` +
      T(0, -19, "化妆玩具", 15, C.inkDeep),
    whitening: () =>
      `<rect x="-26" y="-34" width="52" height="82" rx="14" fill="#fff"/><rect x="-14" y="-52" width="28" height="22" rx="5" fill="${C.main[2]}"/>` + T(0, 14, "美白", 20, C.main[5]),
    slimTea: () =>
      `<rect x="-40" y="-40" width="80" height="84" rx="8" fill="${C.main[0]}"/><path d="M-40 -40 L40 -40 L30 -54 L-30 -54 Z" fill="${C.main[2]}"/>` + T(0, 12, "瘦身", 22, C.inkDeep),
    loanCard: () =>
      `<rect x="-66" y="-42" width="132" height="84" rx="12" fill="${C.main[5]}"/><rect x="-46" y="-20" width="28" height="20" rx="4" fill="${C.yellow}"/>` +
      T(14, -2, "先美后付", 20, "#fff") + T(0, 28, "0 首付", 22, "#fff"),
    bouquet: () =>
      `<path d="M-14 50 L0 6 L14 50 Z" fill="#fff"/>` +
      [[-24, -10, C.main[3]], [0, -26, "#FF4D6D"], [24, -10, C.main[2]], [-12, 4, C.main[1]], [12, 4, "#FF4D6D"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="17" fill="${c}"/><circle cx="${x}" cy="${y}" r="6" fill="${C.yellow}"/>`).join(""),
    giftBox: () =>
      `<rect x="-42" y="-30" width="84" height="66" rx="6" fill="#fff"/><rect x="-8" y="-30" width="16" height="66" fill="${C.main[3]}"/>` +
      `<path d="M0 -30 Q-30 -60 -26 -36 Z M0 -30 Q30 -60 26 -36 Z" fill="${C.main[3]}"/>` +
      `<rect x="-34" y="6" width="68" height="24" rx="4" fill="${C.yellow}"/>` + T(0, 25, "送她", 18, C.inkDeep),
    necklace: () =>
      [...Array(11)].map((_, i) => { const a = Math.PI * (0.15 + 0.7 * i / 10); return `<circle cx="${f(Math.cos(a) * 56)}" cy="${f(Math.sin(a) * 40 - 20)}" r="7" fill="#FFF6EE" stroke="#F0D9C8" stroke-width="2"/>`; }).join(""),
    selfLipstick: () =>
      `<rect x="-15" y="-4" width="30" height="48" rx="5" fill="${C.inkDeep}"/><rect x="-12" y="-28" width="24" height="26" rx="4" fill="${C.yellow}"/>` +
      `<path d="M-10 -28 L-10 -48 Q0 -62 10 -48 L10 -28 Z" fill="#E0243F"/>` +
      `<rect x="-30" y="12" width="60" height="26" rx="13" fill="#fff"/>` + T(0, 31, "悦己", 18, C.main[5]),
    ring: () =>
      `<circle cx="0" cy="8" r="17" fill="none" stroke="${C.yellow}" stroke-width="8"/>` +
      `<path d="M0 -40 L18 -22 L0 -6 L-18 -22 Z" fill="#E6F7FF" stroke="#fff" stroke-width="3"/><path d="M0 -40 L6 -22 L0 -6 L-6 -22 Z" fill="#C9EEFF"/>`,
    weddingPhoto: () =>
      `<rect x="-46" y="-56" width="92" height="112" rx="6" fill="${C.yellow}"/><rect x="-36" y="-46" width="72" height="92" fill="#fff"/>` +
      `<path d="M0 22 C-26 2 -20 -22 0 -8 C20 -22 26 2 0 22 Z" fill="${C.main[3]}"/>`,
    goldSet: () =>
      `<circle cx="-20" cy="0" r="24" fill="none" stroke="${C.yellow}" stroke-width="9"/><circle cx="20" cy="0" r="24" fill="none" stroke="#F5C842" stroke-width="9"/>` + T(0, 52, "金饰", 20, C.inkDeep),
    binder: () =>
      `<rect x="-96" y="-34" width="192" height="68" rx="12" fill="${C.main[4]}"/>` +
      `<line x1="-56" y1="-26" x2="-56" y2="26" stroke="#FFD0DA" stroke-width="6"/><line x1="56" y1="-26" x2="56" y2="26" stroke="#FFD0DA" stroke-width="6"/>` + T(0, 9, "束腹带", 22, "#fff"),
    card: (title, sub, color = C.main[3]) => () =>
      `<rect x="-90" y="-54" width="180" height="108" rx="12" fill="#FFF0F3"/><rect x="-90" y="-54" width="180" height="36" rx="12" fill="${color}"/><rect x="-90" y="-30" width="180" height="12" fill="${color}"/>` +
      T(0, -28, title, 20, "#fff") + (sub ? T(0, 26, sub, 22, C.inkDeep) : ""),
    cream: (label) => () =>
      `<rect x="-38" y="-30" width="76" height="22" rx="6" fill="${C.yellow}"/><rect x="-44" y="-10" width="88" height="54" rx="16" fill="#FFE0E5"/>` + T(0, 26, label, 20, C.main[5]),
    milk: () =>
      `<rect x="-34" y="-46" width="68" height="94" rx="14" fill="#fff"/><rect x="-34" y="-46" width="68" height="22" rx="10" fill="${C.main[2]}"/>` + T(0, 18, "奶粉", 20, C.main[5]),
    bag: () =>
      `<path d="M-30 -30 Q-30 -62 0 -62 Q30 -62 30 -30" fill="none" stroke="${C.main[4]}" stroke-width="8"/><rect x="-54" y="-34" width="108" height="80" rx="10" fill="${C.main[1]}"/>` + T(0, 18, "待产包", 20, C.inkDeep),
    book: () =>
      `<rect x="-38" y="-50" width="76" height="100" rx="5" fill="#fff"/><rect x="-38" y="-50" width="14" height="100" fill="${C.main[2]}"/>` + T(8, 4, "绘本", 18, C.main[5]),
    dino: (fill = "#7DB7E8") =>
      `<path d="M-62 26 Q-70 -6 -40 -14 Q-28 -46 4 -40 Q20 -70 46 -54 Q60 -44 50 -30 L36 -26 Q40 -6 30 14 L34 34 L18 34 L14 20 L-20 22 L-22 36 L-38 36 L-38 22 Q-56 30 -62 26 Z" fill="${fill}"/>` +
      `<circle cx="38" cy="-48" r="4.5" fill="${C.inkDeep}"/>` +
      `<path d="M-30 -18 L-24 -30 L-16 -18 M-12 -26 L-4 -40 L4 -26" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`,
    tee: (ink = C.beigeInk) =>
      `<path d="M-74 -96 Q0 -112 74 -96 L128 -36 L94 -6 L74 -30 L74 104 L-74 104 L-74 -30 L-94 -6 L-128 -36 Z" fill="#FBF8F2"/>` +
      `<text x="0" y="8" text-anchor="middle" font-family="SESerif" font-weight="600" font-size="40" fill="${ink}" letter-spacing="6">做自己</text>`,
  };
  SE.SHAPE.monthCard = SE.SHAPE.card("月子会所 · 28 天", "¥ 50,000+");
  SE.SHAPE.pelvicCard = SE.SHAPE.card("盆底修复 · 5 疗程", "近 ¥ 60,000", C.main[4]);
  SE.SHAPE.eduCard = SE.SHAPE.card("双语早教", "¥ 20,000", C.main[5]);
  SE.SHAPE.creamA = SE.SHAPE.cream("抗初老");
  SE.SHAPE.creamB = SE.SHAPE.cream("冻龄");

  // ---------- 每件商品：在哪个年龄出现、扣在哪里 ----------
  // place[age] = [anchor, dx, dy, rot, scale]；没写的年龄放进“随身槽位”（越往后越挤）
  SE.ITEMS = {
    tiara: { from: "a3", place: { a3: ["headTop", 0, -4, 0, 1], a16: ["headTop", 30, 2, 16, 0.8], a24: ["headTop", 36, 6, 22, 0.72], a28: ["headTop", 52, 16, 28, 0.62], a30: ["headTop", 44, 8, 22, 0.66], a45: ["headTop", 40, 6, 20, 0.66] } },
    tutu: { from: "a3", place: { a3: ["hip", 0, 26, 0, 1] } },
    makeupBox: { from: "a3", place: { a3: ["headTop", 130, 90, 8, 0.72] } },
    whitening: { from: "a16", place: { a16: ["handL", -34, -40, -10, 0.85] } },
    slimTea: { from: "a16", place: { a16: ["handR", 44, -40, 8, 0.85] } },
    loanCard: { from: "a16", place: { a16: ["chest", -58, 16, -8, 0.78] } },
    bouquet: { from: "a24", place: { a24: ["handL", -22, -40, -10, 1] } },
    giftBox: { from: "a24", place: { a24: ["handR", 52, -26, 6, 0.9] } },
    necklace: { from: "a24", place: { a24: ["chest", 0, -40, 0, 0.9], a28: ["chest", 0, -40, 0, 0.9], a30: ["chest", 0, -40, 0, 0.9], a45: ["chest", 0, -40, 0, 0.9] } },
    selfLipstick: { from: "a24", place: { a24: ["chest", 64, 40, 10, 0.8] } },
    ring: { from: "a28", place: { a28: ["handL", 0, -14, 0, 0.9], a30: ["handL", 0, -12, 0, 0.7], a45: ["handL", 0, -12, 0, 0.7] } },
    weddingPhoto: { from: "a28", place: { a28: ["handR", 54, -60, 8, 0.8] } },
    goldSet: { from: "a28", place: { a28: ["chest", -62, 70, -6, 0.75] } },
    binder: { from: "a30", place: { a30: ["waist", 0, 4, 0, 0.92], a45: ["waist", 0, 4, 0, 0.92] } },
    monthCard: { from: "a30", place: { a30: ["chest", -150, -60, -8, 0.78] } },
    pelvicCard: { from: "a30", place: { a30: ["chest", 150, -60, 8, 0.78] } },
    eduCard: { from: "a30", place: { a30: ["hip", 150, 70, 6, 0.78] } },
    creamA: { from: "a45", place: { a45: ["cheekL", -104, -10, -10, 0.85] } },
    creamB: { from: "a45", place: { a45: ["cheekR", 104, -10, 10, 0.85] } },
  };
  SE.AGE_ORDER = ["a3", "a16", "a24", "a28", "a30", "a45"];

  // 随身槽位：围着身体排一圈（局部坐标）
  SE.carrySlots = function (key) {
    const a = SE.anchors(key);
    const s = [];
    const L = -a.sw - 64, Rr = a.sw + 64;
    const ys = [a.shoulderY + 30, a.waistY - 10, a.hipY + 10, a.hipY + 90, a.hipY + 170];
    ys.forEach((y, i) => { s.push([L - (i % 2) * 34, y]); s.push([Rr + (i % 2) * 34, y]); });
    s.push([-a.R * 0.42, a.hipY + 40], [a.R * 0.42, a.hipY + 40], [-a.sw - 150, a.shoulderY + 90], [a.sw + 150, a.shoulderY + 90], [-a.sw - 150, a.hipY + 60], [a.sw + 150, a.hipY + 60]);
    return s;
  };

  // 生成某个年龄身上扣着的全部商品。fresh = 本阶段新扣上的（需要动画，给 id，初始隐藏）
  SE.wear = function (key, prefix) {
    const order = SE.AGE_ORDER;
    const ai = order.indexOf(key);
    const a = SE.anchors(key);
    const slots = SE.carrySlots(key);
    let slot = 0;
    let out = "";
    Object.entries(SE.ITEMS).forEach(([name, it]) => {
      const fi = order.indexOf(it.from);
      if (fi > ai) return;
      let pl = it.place[key];
      let x, y, r, s;
      if (pl) {
        const [an, dx, dy, rr, ss] = pl;
        const base = a[an];
        x = base[0] + dx; y = base[1] + dy; r = rr; s = ss;
      } else {
        const p = slots[slot++ % slots.length];
        x = p[0]; y = p[1]; r = ((slot * 37) % 21) - 10; s = 0.5;
      }
      const fresh = fi === ai;
      const tabs = SE.tab(-30, -38, -8, 0.8) + SE.tab(30, -38, 8, 0.8);
      out += `<g transform="translate(${f(x)} ${f(y)}) rotate(${r}) scale(${s})"><g id="${prefix}-${name}" class="item${fresh ? " fresh" : ""}" filter="url(#cut)" data-layout-allow-overlap data-layout-allow-occlusion>${SE.SHAPE[name]()}${tabs}</g></g>`;
    });
    return out;
  };
})();
