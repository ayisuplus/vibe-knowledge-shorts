// 绘图件：红绘陶罐人物（圆形人、宙斯、阿波罗、宴饮者、苏格拉底、青年）、陶罐表面、回纹、阶梯符号。都返回 SVG 字符串。
(function () {
  const D = window.D, C = D.C;
  const clay = C.clay, L = C.line;

  // 古希腊回纹带：x0..x1，顶边 y，高 h
  D.meander = (x0, x1, y, h, color = clay, sw = 6) => {
    const u = h; let d = "";
    for (let x = x0; x < x1; x += u * 1.25) {
      const a = u * .9;
      d += `M${D.f(x)},${y + h} V${y} H${D.f(x + a)} V${D.f(y + h * .72)} H${D.f(x + a * .3)} V${D.f(y + h * .35)} H${D.f(x + a * .62)}`;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="square"/>`
      + `<line x1="${x0}" x2="${x1}" y1="${D.f(y - h * .32)}" y2="${D.f(y - h * .32)}" stroke="${color}" stroke-width="${sw * .6}"/>`
      + `<line x1="${x0}" x2="${x1}" y1="${D.f(y + h * 1.32)}" y2="${D.f(y + h * 1.32)}" stroke="${color}" stroke-width="${sw * .6}"/>`;
  };
  // 圆形回纹圈（陶杯内底的圆框）
  D.meanderRing = (r, color = clay, sw = 4) => {
    let s = `<circle r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/><circle r="${r - 30}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
    const n = Math.round(2 * Math.PI * (r - 15) / 30);
    for (let i = 0; i < n; i++) {
      const a = i / n * 360;
      s += `<g transform="rotate(${D.f(a)})"><path d="M-8,${-(r - 6)} V${-(r - 24)} H8 V${-(r - 12)} H-2 V${-(r - 18)} H3" fill="none" stroke="${color}" stroke-width="${sw * .8}"/></g>`;
    }
    return s;
  };

  // ---------- 圆形人：两个人背靠背连成一个球 ----------
  // half: 0 整个 / -1 左半 / 1 右半；cut: 切口亮线透明度
  D.roundHuman = (id, { r = 80, half = 0, cutOp = 1, cut = "#fff1cf", knot = 0 } = {}) => {
    const hr = r * .5, hy = -r - hr * .55, w = Math.max(2.2, r * .035);
    const arm = (x0, y0, x1, y1, bend) => `<path d="M${D.f(x0)},${D.f(y0)} Q${D.f((x0 + x1) / 2)},${D.f((y0 + y1) / 2 + bend)} ${D.f(x1)},${D.f(y1)}" stroke="${clay}" stroke-width="${D.f(r * .15)}" stroke-linecap="round" fill="none"/><circle cx="${D.f(x1)}" cy="${D.f(y1)}" r="${D.f(r * .1)}" fill="${clay}"/>`;
    const leg = (x0, y0, x1, y1, sx) => `<path d="M${D.f(x0)},${D.f(y0)} L${D.f(x1)},${D.f(y1)}" stroke="${clay}" stroke-width="${D.f(r * .17)}" stroke-linecap="round"/><path d="M${D.f(x1)},${D.f(y1)} h${D.f(sx * r * .2)}" stroke="${clay}" stroke-width="${D.f(r * .12)}" stroke-linecap="round"/>`;
    const limb = (sx) =>
      arm(sx * r * .5, -r * .74, sx * r * 1.12, -r * 1.22, -r * .05)
      + arm(sx * r * .72, -r * .58, sx * r * 1.34, -r * .62, r * .12)
      + leg(sx * r * .5, r * .82, sx * r * .7, r * 1.48, sx)
      + leg(sx * r * .26, r * .94, sx * r * .3, r * 1.6, sx);
    const hR = hr * .8;
    const head = (sx) => { const c = sx * hr * .4, o = (k) => D.f(c + sx * k);
      return `
      <circle cx="${D.f(c)}" cy="${D.f(hy)}" r="${D.f(hR)}" fill="${clay}" stroke="${L}" stroke-width="${D.f(w)}"/>
      <path d="M${o(-hR * .95)},${D.f(hy - hR * .1)} Q${o(-hR * .6)},${D.f(hy - hR * 1.25)} ${o(hR * .55)},${D.f(hy - hR * .78)} Q${o(hR * .1)},${D.f(hy - hR * .6)} ${o(-hR * .2)},${D.f(hy - hR * .35)} Q${o(-hR * .55)},${D.f(hy - hR * .2)} ${o(-hR * .7)},${D.f(hy + hR * .3)} Z" fill="${L}"/>
      <path d="M${o(hR * .9)},${D.f(hy - hR * .22)} l${D.f(sx * hR * .24)},${D.f(hR * .3)} l${D.f(-sx * hR * .22)},${D.f(hR * .07)}" fill="${clay}" stroke="${L}" stroke-width="${D.f(w * .8)}" stroke-linejoin="round"/>
      <path d="M${o(hR * .36)},${D.f(hy - hR * .34)} q${D.f(sx * hR * .16)},${D.f(-hR * .1)} ${D.f(sx * hR * .3)},${D.f(hR * .02)}" stroke="${L}" stroke-width="${D.f(w)}" fill="none" stroke-linecap="round"/>
      <circle cx="${o(hR * .5)}" cy="${D.f(hy - hR * .14)}" r="${D.f(w)}" fill="${L}"/>
      <path d="M${o(hR * .2)},${D.f(hy + hR * .35)} Q${o(hR * .45)},${D.f(hy + hR * 1.05)} ${o(hR * .86)},${D.f(hy + hR * .45)}" fill="${L}" opacity=".85"/>`; };
    const fold = (x0, x1, x2, k) => `<path d="M${D.f(x0)},${D.f(-r * .2)} Q${D.f(x1)},${D.f(r * .4)} ${D.f(x2)},${D.f(r * k)}" stroke="${L}" stroke-width="${D.f(w * .7)}" fill="none" opacity=".75"/>`;
    const body = `
        ${limb(-1)}${limb(1)}
        <circle r="${r}" fill="${clay}"/>
        <path d="M${D.f(-r * .7)},${D.f(-r * .55)} Q0,${D.f(-r * .15)} ${D.f(r * .7)},${D.f(-r * .55)}" stroke="${L}" stroke-width="${D.f(w)}" fill="none"/>
        ${fold(-r * .5, -r * .35, -r * .55, .78)}${fold(-r * .2, -r * .1, -r * .22, .97)}${fold(r * .2, r * .1, r * .22, .97)}${fold(r * .5, r * .35, r * .55, .78)}
        <line x1="0" x2="0" y1="${D.f(-r * .76)}" y2="${r}" stroke="${L}" stroke-width="${D.f(w * .8)}" stroke-dasharray="${D.f(w * 2)} ${D.f(w * 2.2)}" opacity=".8"/>
        <circle r="${r}" fill="none" stroke="${L}" stroke-width="${D.f(w)}"/>
        <rect x="${D.f(-hr * .4)}" y="${D.f(hy + hr * .6)}" width="${D.f(hr * .8)}" height="${D.f(hr * .6)}" fill="${clay}"/>
        <path d="M${D.f(-r * .42)},${D.f(-r * .9)} Q0,${D.f(-r * .62)} ${D.f(r * .42)},${D.f(-r * .9)}" stroke="${L}" stroke-width="${D.f(w)}" fill="none"/>
        ${head(-1)}${head(1)}`;
    if (!half) return `<g id="${id}">${body}</g>`;
    const cx = half < 0 ? -r * 2.2 : 0, cw = r * 2.2;
    // 肚脐的结：被收拢的皮在切口一侧的肚子上打结
    const kx = -half * r * .05, ky = r * .1;
    const knotS = knot > 0 ? `<g opacity="${D.f(knot)}">
        <path d="M${D.f(kx - half * r * .55)},${D.f(ky - r * .45)} Q${D.f(kx - half * r * .2)},${D.f(ky - r * .1)} ${D.f(kx)},${D.f(ky)} M${D.f(kx - half * r * .6)},${D.f(ky)} L${D.f(kx)},${D.f(ky)} M${D.f(kx - half * r * .55)},${D.f(ky + r * .45)} Q${D.f(kx - half * r * .2)},${D.f(ky + r * .1)} ${D.f(kx)},${D.f(ky)}" stroke="${L}" stroke-width="${D.f(w * .9)}" fill="none"/>
        <circle cx="${D.f(kx)}" cy="${D.f(ky)}" r="${D.f(r * .07)}" fill="${clay}" stroke="${L}" stroke-width="${D.f(w)}"/></g>` : "";
    return `<g id="${id}">
      <clipPath id="${id}-c"><rect x="${D.f(cx)}" y="${D.f(-r * 2.4)}" width="${D.f(cw)}" height="${D.f(r * 4.6)}"/></clipPath>
      <g clip-path="url(#${id}-c)">${body}${knotS}</g>
      <line id="${id}-cut" x1="0" x2="0" y1="${D.f(hy - hr * 1.1)}" y2="${D.f(r * 1.05)}" stroke="${cut}" stroke-width="${D.f(w * 1.5)}" stroke-linecap="round" filter="url(#glowL)" opacity="${cutOp}"/>
    </g>`;
  };

  // ---------- 站立的长袍人物（侧身朝右，脚底中心在 0,0，身高约 480） ----------
  // o.head: "zeus" | "apollo" | "socrates" | "youth"；o.arm: "throw" | "forward" | "pull" | "offer" | "down"；o.staff
  D.figure = (o = {}) => {
    const head = o.head || "zeus", arm = o.arm || "down";
    let s = "";
    if (o.staff) s += `<line x1="-67" y1="-420" x2="-93" y2="4" stroke="${clay}" stroke-width="9" stroke-linecap="round"/><path d="M-77,-430 l10,-18 l10,18 z" fill="${clay}"/>`;
    // 身体（长袍）
    const robe = "M-33,-394 C-59,-272 -79,-142 -93,-6 L93,-6 C77,-152 65,-272 51,-394 Q9,-408 -33,-394 Z";
    s += `<path d="${robe}" fill="${clay}"/><path d="${robe}" fill="none" stroke="${L}" stroke-width="3.5"/>
      <path d="M-29,-322 Q15,-272 61,-322" stroke="${L}" stroke-width="3" fill="none"/>
      <path d="M-23,-272 Q-33,-152 -55,-12 M5,-262 Q-1,-142 -7,-10 M35,-272 Q43,-142 53,-10 M61,-292 Q71,-152 81,-10" stroke="${L}" stroke-width="2.4" fill="none" opacity=".8"/>
      <path d="M-85,-44 Q-1,-62 89,-42" stroke="${L}" stroke-width="3" fill="none"/>
      <ellipse cx="-67" cy="0" rx="22" ry="7" fill="${clay}" stroke="${L}" stroke-width="2.5"/><ellipse cx="57" cy="0" rx="24" ry="7" fill="${clay}" stroke="${L}" stroke-width="2.5"/>`;
    // 后臂
    s += `<path d="M-33,-372 Q-55,-322 -63,-362" stroke="${clay}" stroke-width="22" stroke-linecap="round" fill="none"/>`;
    // 前臂
    const armPath = { throw: ["M43,-378 Q85,-412 131,-456", 137, -462], forward: ["M43,-378 Q90,-372 140,-372", 146, -372], pull: ["M43,-378 Q86,-352 128,-338", 134, -336], offer: ["M43,-378 Q74,-320 120,-300", 126, -298], down: ["M43,-378 Q64,-300 58,-240", 58, -232] }[arm];
    s += `<path d="${armPath[0]}" stroke="${clay}" stroke-width="24" stroke-linecap="round" fill="none"/><path d="${armPath[0]}" stroke="${L}" stroke-width="2.6" fill="none" opacity=".5"/>
      <circle cx="${armPath[1]}" cy="${armPath[2]}" r="15" fill="${clay}" stroke="${L}" stroke-width="2.5"/>`;
    if (arm === "pull") s += `<path d="M-33,-372 Q30,-330 110,-326" stroke="${clay}" stroke-width="20" stroke-linecap="round" fill="none"/><circle cx="114" cy="-326" r="13" fill="${clay}" stroke="${L}" stroke-width="2.5"/>`;
    if (arm === "offer") s += `<g fill="#f6ead2" stroke="${L}" stroke-width="2"><ellipse cx="132" cy="-312" rx="13" ry="5"/><ellipse cx="130" cy="-320" rx="13" ry="5"/><ellipse cx="134" cy="-328" rx="13" ry="5"/></g>`;
    // 脖子和头
    s += `<rect x="-5" y="-420" width="28" height="30" fill="${clay}"/><circle cx="9" cy="-448" r="36" fill="${clay}" stroke="${L}" stroke-width="3.5"/>`;
    const nose = head === "socrates" ? `<path d="M43,-458 q12,10 6,18 l-8,-2" fill="${clay}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>` : `<path d="M43,-458 l14,14 l-13,4" fill="${clay}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>`;
    s += nose + `<circle cx="29" cy="-458" r="3.4" fill="${L}"/><path d="M19,-466 q8,-5 16,0" stroke="${L}" stroke-width="2.6" fill="none"/>`;
    if (head === "zeus") s += `<path d="M-23,-466 Q-5,-500 35,-486 Q19,-476 13,-462 Q-7,-470 -23,-446 Z" fill="${L}"/><path d="M-25,-464 Q7,-492 41,-474" stroke="${clay}" stroke-width="4" fill="none"/>
      <path d="M-15,-436 Q-5,-388 31,-390 Q49,-400 45,-430 Q27,-420 7,-430 Z" fill="${L}"/>`;
    if (head === "socrates") s += `<path d="M-23,-456 Q-29,-430 -17,-414 Q-9,-430 -9,-446 Z" fill="${L}"/>
      <path d="M-19,-440 Q-13,-378 29,-376 Q55,-386 49,-426 Q29,-412 5,-424 Z" fill="${L}"/>`;
    if (head === "apollo") s += `<path d="M-25,-462 Q-3,-498 37,-480 Q21,-472 15,-458 Q-9,-462 -21,-430 Q-35,-400 -27,-376 Q-41,-410 -25,-462 Z" fill="${L}"/>
      <g fill="#7f8a3a" stroke="${L}" stroke-width="1.5">${[-20, -6, 8, 22].map((x, i) => `<ellipse cx="${x}" cy="${-482 + Math.abs(i - 1.5) * 3}" rx="8" ry="4" transform="rotate(${-30 + i * 20} ${x} ${-482})"/>`).join("")}</g>`;
    if (head === "youth") s += `<g fill="${L}">${[[-21, -470], [-9, -482], [5, -486], [19, -480], [-25, -454], [-27, -438]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join("")}</g>`;
    return s;
  };

  // 雷霆（宙斯手里的双头权器）
  D.bolt = `<path d="M-34,0 Q-10,-11 0,0 Q-10,11 -34,0 Z M34,0 Q10,-11 0,0 Q10,11 34,0 Z" fill="#f6ead2" stroke="${L}" stroke-width="2"/>
    <path d="M-34,0 l-14,-9 M-34,0 l-16,0 M-34,0 l-14,9 M34,0 l14,-9 M34,0 l16,0 M34,0 l14,9" stroke="#f6ead2" stroke-width="3" stroke-linecap="round"/>`;

  // ---------- 宴饮者：斜躺在长榻上，脸朝右（原点在榻面中心） ----------
  D.recliner = ({ beard = true, cup = "raise" } = {}) => {
    let s = "";
    // 榻
    s += `<rect x="-180" y="0" width="360" height="18" rx="4" fill="${clay}" stroke="${L}" stroke-width="3"/>
      <path d="M-166,18 v62 M166,18 v62 M-150,18 v62 M150,18 v62" stroke="${clay}" stroke-width="10"/>
      <path d="M-180,9 h360" stroke="${L}" stroke-width="1.6" opacity=".6"/>
      <ellipse cx="-138" cy="-26" rx="46" ry="26" fill="${clay}" stroke="${L}" stroke-width="3"/>
      <path d="M-176,-22 Q-138,-40 -100,-24" stroke="${L}" stroke-width="2" fill="none"/>`;
    // 下半身盖着长袍，腿伸向右
    s += `<path d="M-108,-40 Q-60,-70 20,-46 Q100,-30 156,-20 Q170,-8 154,0 L-112,0 Q-128,-18 -108,-40 Z" fill="${clay}" stroke="${L}" stroke-width="3"/>
      <path d="M-60,-46 Q20,-30 140,-14 M-80,-24 Q20,-14 120,-6" stroke="${L}" stroke-width="2.2" fill="none" opacity=".75"/>
      <ellipse cx="166" cy="-10" rx="16" ry="7" fill="${clay}" stroke="${L}" stroke-width="2.5"/>`;
    // 上身靠在垫子上（披袍斜搭）
    s += `<path d="M-120,-44 Q-128,-110 -96,-150 Q-62,-160 -46,-130 Q-40,-90 -52,-48 Z" fill="${clay}" stroke="${L}" stroke-width="3"/>
      <path d="M-112,-60 Q-80,-100 -56,-140" stroke="${L}" stroke-width="2.4" fill="none"/>
      <path d="M-116,-70 Q-140,-56 -150,-40" stroke="${clay}" stroke-width="20" stroke-linecap="round"/>`;
    // 头
    s += `<rect x="-84" y="-176" width="24" height="26" fill="${clay}"/><circle cx="-70" cy="-190" r="30" fill="${clay}" stroke="${L}" stroke-width="3"/>
      <path d="M-98,-200 Q-84,-230 -48,-216 Q-62,-208 -66,-198 Q-84,-204 -96,-180 Z" fill="${L}"/>
      <path d="M-100,-200 Q-72,-226 -44,-208" stroke="#7f8a3a" stroke-width="4" fill="none" stroke-dasharray="6 3"/>
      <path d="M-42,-198 l12,12 l-11,3" fill="${clay}" stroke="${L}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="-52" cy="-198" r="3" fill="${L}"/>`;
    if (beard) s += `<path d="M-90,-180 Q-82,-142 -52,-146 Q-38,-154 -42,-178 Q-56,-170 -72,-178 Z" fill="${L}"/>`;
    // 前臂和酒杯（浅口高脚杯 kylix）
    const cupAt = cup === "raise" ? [-4, -176] : [10, -120];
    s += `<path d="M-60,-130 Q-30,-${cup === "raise" ? 150 : 110} ${cupAt[0] - 6},${cupAt[1] + 8}" stroke="${clay}" stroke-width="20" stroke-linecap="round" fill="none"/>
      <g transform="translate(${cupAt[0]},${cupAt[1]})"><path d="M-30,0 Q0,16 30,0 Z" fill="${L}"/><path d="M0,10 v12 M-10,22 h20" stroke="${L}" stroke-width="4"/><path d="M-30,0 q-10,-8 -4,-14 M30,0 q10,-8 4,-14" stroke="${L}" stroke-width="3" fill="none"/></g>`;
    return s;
  };
  // 宴饮用的小桌（上面有葡萄和酒壶）
  D.table = () => `<rect x="-70" y="0" width="140" height="12" fill="${clay}" stroke="${L}" stroke-width="2.5"/><path d="M-58,12 v54 M58,12 v54" stroke="${clay}" stroke-width="8"/>
    <g fill="${clay}" stroke="${L}" stroke-width="2">${[[-36, -10], [-24, -10], [-30, -20], [-18, -20], [-24, -30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join("")}</g>
    <path d="M18,0 Q8,-30 22,-46 L18,-56 L36,-56 L32,-46 Q46,-30 36,0 Z" fill="${clay}" stroke="${L}" stroke-width="2.5"/>`;

  // 奥林匹斯山：陶罐上的阶梯状山形（描线）
  D.olympus = () => `<path d="M-260,0 L-200,-80 L-150,-60 L-90,-170 L-30,-140 L20,-250 L80,-200 L140,-300 L210,-230 L260,-260 L300,0 Z" fill="${clay}" opacity=".18"/>
    <path d="M-260,0 L-200,-80 L-150,-60 L-90,-170 L-30,-140 L20,-250 L80,-200 L140,-300 L210,-230 L260,-260 L300,0" fill="none" stroke="${clay}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M100,-300 h80 M108,-300 v-60 M172,-300 v-60 M96,-360 h88 L140,-392 Z" fill="none" stroke="${clay}" stroke-width="4" stroke-linejoin="round"/>`;

  // ---------- 金色线描小图标（阶梯上方的符号） ----------
  const fig = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})"><circle cy="-34" r="9"/><path d="M-12,-20 Q0,-26 12,-20 L16,18 L-16,18 Z"/><path d="M-6,-16 L-4,16 M5,-16 L6,16" opacity=".6"/></g>`;
  D.stepIcons = [
    fig(0, 0, 1.25),
    fig(-34, 6, .95) + fig(-11, -4, 1.05) + fig(14, 2, 1) + fig(36, 8, .9),
    `<path d="M-40,14 Q-30,30 0,30 Q40,30 46,12 Q20,4 -40,14 Z"/><path d="M46,12 Q58,8 62,0"/><path d="M-40,14 Q-52,10 -50,0 Q-44,-4 -38,4"/><path d="M-34,6 Q-30,-24 -24,-46 Q-14,-22 -18,4" fill="#ebc57a" fill-opacity=".35"/>`,
    `<rect x="-44" y="-26" width="88" height="56" rx="4"/><path d="M-44,-26 q-14,4 -14,28 q0,24 14,28 M44,-26 q14,4 14,28 q0,24 -14,28"/><path d="M-30,-12 h60 M-30,0 h52 M-30,12 h58" opacity=".7"/>`,
    `<path d="M-46,28 h92 v-14 h-92 Z M-40,14 h82 v-14 h-82 Z M-44,0 h86 v-14 h-86 Z"/><path d="M-20,-36 l4,-8 l4,8 l-8,-4 h8 Z M14,-46 l3,-6 l3,6 l-6,-3 h6 Z M30,-28 l2,-5 l2,5 l-4,-2 h4 Z"/>`,
  ];
  D.figIcon = fig;

  // 披袍小人（实心深色，脚底在 0,0；face=1 朝右）
  D.climber = (color = C.ink) => `<ellipse cx="0" cy="2" rx="26" ry="6" fill="#8a7458" opacity=".25"/>
    <path d="M-14,0 Q-18,-50 -10,-78 Q0,-86 12,-78 Q20,-50 16,0 Z" fill="${color}"/>
    <path d="M10,-74 Q30,-60 26,-36" stroke="${color}" stroke-width="9" stroke-linecap="round" fill="none"/>
    <circle cx="4" cy="-98" r="14" fill="${color}"/>
    <path d="M-12,-70 Q2,-40 -6,0" stroke="#5a4636" stroke-width="2" fill="none"/>`;
})();
