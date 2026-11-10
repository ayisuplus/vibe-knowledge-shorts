// 纸娃娃“她”：参数化 Q 版人物。同一张脸，年龄靠身高、发型、衣服区分。
// 局部坐标：原点在两脚中间的地面，y 向上为负。SE.doll() 只返回 SVG 字符串；SE.anchors() 给出挂配件的锚点。
(function () {
  const SE = window.SE;
  const C = SE.C;
  const f = SE.f;

  // H 总高，R 头半径，legs 腿长占比，sw/hw 肩宽、胯宽（相对 R）
  SE.AGES = {
    a3: { H: 430, R: 100, legs: 0.25, sw: 0.66, hw: 0.6, outfit: "kid", hair: "pigtails" },
    a16: { H: 600, R: 106, legs: 0.34, sw: 0.74, hw: 0.66, outfit: "school", hair: "ponytail" },
    a24: { H: 630, R: 108, legs: 0.35, sw: 0.76, hw: 0.68, outfit: "casual", hair: "bob" },
    a28: { H: 630, R: 108, legs: 0.35, sw: 0.76, hw: 0.68, outfit: "bride", hair: "updo" },
    a30: { H: 630, R: 108, legs: 0.35, sw: 0.78, hw: 0.72, outfit: "mom", hair: "lowbun" },
    a45: { H: 620, R: 106, legs: 0.35, sw: 0.8, hw: 0.74, outfit: "cardigan", hair: "short" },
    a45plain: { H: 620, R: 106, legs: 0.35, sw: 0.8, hw: 0.74, outfit: "plain", hair: "short" },
    boy: { H: 660, R: 104, legs: 0.37, sw: 0.84, hw: 0.7, outfit: "plain", hair: "boy" },
  };

  const rot = (x, y, deg) => {
    const a = (deg * Math.PI) / 180;
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };

  SE.anchors = function (key) {
    const p = SE.AGES[key];
    const { H, R } = p;
    const headCY = -H + R;
    const chin = headCY + R * 0.95;
    const shoulderY = chin + 16;
    const hipY = -H * p.legs;
    const waistY = shoulderY + (hipY - shoulderY) * 0.62;
    const sw = p.sw * R, hw = p.hw * R;
    const aw = R * 0.22;
    const armLen = hipY - shoulderY + R * 0.18;
    const ang = 11;
    const topL = [-sw + aw * 0.35, shoulderY + aw * 0.4];
    const topR = [sw - aw * 0.35, shoulderY + aw * 0.4];
    const dl = rot(0, armLen, ang), dr = rot(0, armLen, -ang);
    return {
      H, R, headCY, chin, shoulderY, hipY, waistY, sw, hw, aw, armLen, ang, topL, topR,
      handL: [topL[0] + dl[0], topL[1] + dl[1]],
      handR: [topR[0] + dr[0], topR[1] + dr[1]],
      headTop: [0, headCY - R],
      mouth: [0, headCY + R * 0.47],
      cheekL: [-R * 0.6, headCY + R * 0.36],
      cheekR: [R * 0.6, headCY + R * 0.36],
      chest: [0, shoulderY + (waistY - shoulderY) * 0.45],
      waist: [0, waistY],
      hip: [0, hipY],
    };
  };

  // ---------- 头发 ----------
  function hairBack(p, a) {
    const { R, headCY } = a;
    const H = C.hair;
    switch (p.hair) {
      case "pigtails":
        return (
          `<path d="M${f(-R * 0.9)} ${f(headCY - R * 0.35)} Q${f(-R * 1.55)} ${f(headCY - R * 0.1)} ${f(-R * 1.38)} ${f(headCY + R * 0.75)} Q${f(-R * 1.2)} ${f(headCY + R * 0.3)} ${f(-R * 0.82)} ${f(headCY + R * 0.05)} Z" fill="${H}"/>` +
          `<path d="M${f(R * 0.9)} ${f(headCY - R * 0.35)} Q${f(R * 1.55)} ${f(headCY - R * 0.1)} ${f(R * 1.38)} ${f(headCY + R * 0.75)} Q${f(R * 1.2)} ${f(headCY + R * 0.3)} ${f(R * 0.82)} ${f(headCY + R * 0.05)} Z" fill="${H}"/>` +
          `<ellipse cx="0" cy="${f(headCY - R * 0.05)}" rx="${f(R * 1.04)}" ry="${f(R * 1.02)}" fill="${H}"/>`
        );
      case "ponytail":
        return (
          `<path d="M${f(R * 0.55)} ${f(headCY - R * 0.85)} Q${f(R * 1.75)} ${f(headCY - R * 0.9)} ${f(R * 1.5)} ${f(headCY + R * 0.9)} Q${f(R * 1.35)} ${f(headCY + R * 0.2)} ${f(R * 0.8)} ${f(headCY - R * 0.25)} Z" fill="${H}"/>` +
          `<ellipse cx="0" cy="${f(headCY - R * 0.05)}" rx="${f(R * 1.04)}" ry="${f(R * 1.02)}" fill="${H}"/>`
        );
      case "bob":
        return `<path d="M${f(-R * 1.1)} ${f(headCY)} Q${f(-R * 1.15)} ${f(headCY - R * 1.15)} 0 ${f(headCY - R * 1.12)} Q${f(R * 1.15)} ${f(headCY - R * 1.15)} ${f(R * 1.1)} ${f(headCY)} L${f(R * 1.12)} ${f(headCY + R * 1.02)} Q${f(R * 0.9)} ${f(headCY + R * 1.12)} ${f(R * 0.7)} ${f(headCY + R * 1.0)} L${f(-R * 0.7)} ${f(headCY + R * 1.0)} Q${f(-R * 0.9)} ${f(headCY + R * 1.12)} ${f(-R * 1.12)} ${f(headCY + R * 1.02)} Z" fill="${H}"/>`;
      case "updo":
        return (
          `<path d="M${f(-R * 0.55)} ${f(headCY - R * 0.95)} Q${f(-R * 1.6)} ${f(headCY + R * 0.6)} ${f(-R * 1.25)} ${f(a.waistY)} L${f(R * 1.25)} ${f(a.waistY)} Q${f(R * 1.6)} ${f(headCY + R * 0.6)} ${f(R * 0.55)} ${f(headCY - R * 0.95)} Z" fill="#ffffff" fill-opacity="0.78"/>` +
          `<circle cx="0" cy="${f(headCY - R * 1.02)}" r="${f(R * 0.38)}" fill="${H}"/>` +
          `<ellipse cx="0" cy="${f(headCY - R * 0.08)}" rx="${f(R * 1.03)}" ry="${f(R * 1.0)}" fill="${H}"/>`
        );
      case "lowbun":
        return (
          `<circle cx="${f(R * 0.92)}" cy="${f(headCY + R * 0.42)}" r="${f(R * 0.3)}" fill="${H}"/>` +
          `<ellipse cx="0" cy="${f(headCY - R * 0.06)}" rx="${f(R * 1.03)}" ry="${f(R * 1.0)}" fill="${H}"/>`
        );
      case "short":
      default:
        return `<path d="M${f(-R * 1.07)} ${f(headCY + R * 0.1)} Q${f(-R * 1.15)} ${f(headCY - R * 1.12)} 0 ${f(headCY - R * 1.1)} Q${f(R * 1.15)} ${f(headCY - R * 1.12)} ${f(R * 1.07)} ${f(headCY + R * 0.1)} L${f(R * 1.06)} ${f(headCY + R * 0.62)} Q${f(R * 0.92)} ${f(headCY + R * 0.7)} ${f(R * 0.82)} ${f(headCY + R * 0.5)} L${f(-R * 0.82)} ${f(headCY + R * 0.5)} Q${f(-R * 0.92)} ${f(headCY + R * 0.7)} ${f(-R * 1.06)} ${f(headCY + R * 0.62)} Z" fill="${H}"/>`;
    }
  }

  function hairFront(p, a) {
    const { R, headCY } = a;
    const y = headCY;
    // 齐刘海：圆顶 + 波浪下沿
    let s =
      `<path d="M${f(-R * 1.0)} ${f(y + R * 0.08)} C${f(-R * 1.06)} ${f(y - R * 1.3)} ${f(R * 1.06)} ${f(y - R * 1.3)} ${f(R * 1.0)} ${f(y + R * 0.08)} ` +
      `L${f(R * 0.86)} ${f(y - R * 0.12)} Q${f(R * 0.66)} ${f(y - R * 0.38)} ${f(R * 0.42)} ${f(y - R * 0.26)} Q${f(R * 0.2)} ${f(y - R * 0.42)} ${f(-R * 0.02)} ${f(y - R * 0.27)} ` +
      `Q${f(-R * 0.26)} ${f(y - R * 0.44)} ${f(-R * 0.48)} ${f(y - R * 0.24)} Q${f(-R * 0.72)} ${f(y - R * 0.38)} ${f(-R * 0.88)} ${f(y - R * 0.08)} Z" fill="${C.hair}"/>` +
      // 头发高光
      `<path d="M${f(-R * 0.55)} ${f(y - R * 0.78)} Q${f(-R * 0.1)} ${f(y - R * 0.98)} ${f(R * 0.35)} ${f(y - R * 0.84)}" fill="none" stroke="#7A5244" stroke-width="${f(R * 0.06)}" stroke-linecap="round"/>`;
    if (p.hair === "pigtails") {
      s += `<circle cx="${f(-R * 0.98)}" cy="${f(y - R * 0.38)}" r="${f(R * 0.13)}" fill="${C.yellow}"/><circle cx="${f(R * 0.98)}" cy="${f(y - R * 0.38)}" r="${f(R * 0.13)}" fill="${C.yellow}"/>`;
    }
    if (p.hair === "ponytail") {
      s += `<circle cx="${f(R * 0.78)}" cy="${f(y - R * 0.72)}" r="${f(R * 0.12)}" fill="${C.main[1]}"/>`;
    }
    if (p.hair === "bob" || p.hair === "short") {
      s += `<path d="M${f(-R * 1.0)} ${f(y + R * 0.05)} Q${f(-R * 1.02)} ${f(y + R * 0.5)} ${f(-R * 0.86)} ${f(y + R * (p.hair === "bob" ? 0.95 : 0.55))} L${f(-R * 0.78)} ${f(y + R * 0.1)} Z" fill="${C.hair}"/>` +
        `<path d="M${f(R * 1.0)} ${f(y + R * 0.05)} Q${f(R * 1.02)} ${f(y + R * 0.5)} ${f(R * 0.86)} ${f(y + R * (p.hair === "bob" ? 0.95 : 0.55))} L${f(R * 0.78)} ${f(y + R * 0.1)} Z" fill="${C.hair}"/>`;
    }
    if (p.hair === "short") {
      // 鬓角一缕白发
      s += `<path d="M${f(-R * 0.3)} ${f(y - R * 0.95)} Q${f(-R * 0.75)} ${f(y - R * 0.7)} ${f(-R * 0.86)} ${f(y - R * 0.12)}" fill="none" stroke="#E4DDD8" stroke-width="${f(R * 0.09)}" stroke-linecap="round"/>`;
    }
    if (p.hair === "updo") {
      s += `<path d="M${f(-R * 0.32)} ${f(y - R * 1.28)} L${f(-R * 0.18)} ${f(y - R * 1.5)} L0 ${f(y - R * 1.32)} L${f(R * 0.18)} ${f(y - R * 1.5)} L${f(R * 0.32)} ${f(y - R * 1.28)} Z" fill="#ffffff"/>`;
    }
    return s;
  }

  // ---------- 脸 ----------
  function face(a, id, expr) {
    const { R, headCY } = a;
    const ex = R * 0.37, ey = headCY + R * 0.14;
    const eye = (x) =>
      `<ellipse cx="${f(x)}" cy="${f(ey)}" rx="${f(R * 0.125)}" ry="${f(R * 0.16)}" fill="${C.hair}"/>` +
      `<circle cx="${f(x + R * 0.04)}" cy="${f(ey - R * 0.06)}" r="${f(R * 0.05)}" fill="#fff"/>` +
      `<circle cx="${f(x - R * 0.04)}" cy="${f(ey + R * 0.06)}" r="${f(R * 0.024)}" fill="#fff"/>`;
    let mouth;
    const my = headCY + R * 0.47;
    if (expr === "flat") mouth = `<path d="M${f(-R * 0.09)} ${f(my)} L${f(R * 0.09)} ${f(my)}" stroke="#8A3A42" stroke-width="${f(R * 0.04)}" stroke-linecap="round"/>`;
    else if (expr === "o") mouth = `<ellipse cx="0" cy="${f(my)}" rx="${f(R * 0.06)}" ry="${f(R * 0.08)}" fill="#8A3A42"/>`;
    else if (expr === "stare") mouth = `<path d="M${f(-R * 0.07)} ${f(my + R * 0.02)} L${f(R * 0.07)} ${f(my + R * 0.02)}" stroke="#8A3A42" stroke-width="${f(R * 0.035)}" stroke-linecap="round"/>`;
    else mouth = `<path d="M${f(-R * 0.1)} ${f(my - R * 0.03)} Q0 ${f(my + R * 0.08)} ${f(R * 0.1)} ${f(my - R * 0.03)}" fill="none" stroke="#8A3A42" stroke-width="${f(R * 0.04)}" stroke-linecap="round"/>`;
    const brows = expr === "stare"
      ? `<path d="M${f(-ex - R * 0.12)} ${f(ey - R * 0.27)} L${f(-ex + R * 0.12)} ${f(ey - R * 0.24)}" stroke="${C.hair}" stroke-width="${f(R * 0.035)}" stroke-linecap="round"/><path d="M${f(ex + R * 0.12)} ${f(ey - R * 0.27)} L${f(ex - R * 0.12)} ${f(ey - R * 0.24)}" stroke="${C.hair}" stroke-width="${f(R * 0.035)}" stroke-linecap="round"/>`
      : "";
    return (
      `<g id="${id}-eyes">${eye(-ex)}${eye(ex)}</g>` + brows +
      `<ellipse cx="${f(-R * 0.6)}" cy="${f(headCY + R * 0.38)}" rx="${f(R * 0.16)}" ry="${f(R * 0.095)}" fill="${C.blush}" opacity="0.6"/>` +
      `<ellipse cx="${f(R * 0.6)}" cy="${f(headCY + R * 0.38)}" rx="${f(R * 0.16)}" ry="${f(R * 0.095)}" fill="${C.blush}" opacity="0.6"/>` +
      `<g id="${id}-mouth">${mouth}</g>`
    );
  }

  // ---------- 衣服 ----------
  function outfit(p, a) {
    const { R, shoulderY, hipY, waistY, sw, hw, chin } = a;
    const sh = shoulderY + 2;
    const bodice = (fill, hemY, hemW, extra = "") =>
      `<path d="M${f(-sw + 2)} ${f(sh + 10)} Q${f(-sw + 4)} ${f(sh - 4)} ${f(-sw * 0.45)} ${f(sh - 6)} L${f(sw * 0.45)} ${f(sh - 6)} Q${f(sw - 4)} ${f(sh - 4)} ${f(sw - 2)} ${f(sh + 10)} L${f(hemW)} ${f(hemY)} Q0 ${f(hemY + R * 0.08)} ${f(-hemW)} ${f(hemY)} Z" fill="${fill}"/>` + extra;
    switch (p.outfit) {
      case "kid":
        return bodice("#ffffff", hipY + R * 0.28, hw * 1.55,
          `<path d="M${f(-R * 0.22)} ${f(sh - 6)} Q0 ${f(sh + R * 0.18)} ${f(R * 0.22)} ${f(sh - 6)}" fill="${C.main[0]}"/>`);
      case "school":
        return (
          `<path d="M${f(-hw * 1.02)} ${f(hipY - R * 0.12)} L${f(hw * 1.02)} ${f(hipY - R * 0.12)} L${f(hw * 1.38)} ${f(hipY + R * 0.42)} L${f(-hw * 1.38)} ${f(hipY + R * 0.42)} Z" fill="#E8375A"/>` +
          [-0.9, -0.45, 0, 0.45, 0.9].map((k) => `<line x1="${f(hw * k * 0.9)}" y1="${f(hipY - R * 0.05)}" x2="${f(hw * k * 1.25)}" y2="${f(hipY + R * 0.4)}" stroke="#C42848" stroke-width="3"/>`).join("") +
          bodice("#ffffff", hipY - R * 0.08, hw * 1.04,
            `<path d="M${f(-R * 0.26)} ${f(sh - 6)} L0 ${f(sh + R * 0.24)} L${f(R * 0.26)} ${f(sh - 6)} Z" fill="${C.main[1]}"/>` +
            `<path d="M0 ${f(sh + R * 0.18)} L${f(-R * 0.08)} ${f(sh + R * 0.62)} L0 ${f(sh + R * 0.72)} L${f(R * 0.08)} ${f(sh + R * 0.62)} Z" fill="#C42848"/>`)
        );
      case "casual":
        return (
          `<path d="M${f(-hw * 1.0)} ${f(hipY - R * 0.15)} L${f(hw * 1.0)} ${f(hipY - R * 0.15)} L${f(hw * 1.25)} ${f(hipY + R * 0.62)} L${f(-hw * 1.25)} ${f(hipY + R * 0.62)} Z" fill="${C.main[2]}"/>` +
          bodice("#FFF4EA", hipY - R * 0.08, hw * 1.08,
            [0.25, 0.5, 0.75].map((k) => `<path d="M${f(-sw * 0.85)} ${f(sh + (hipY - sh) * k)} Q0 ${f(sh + (hipY - sh) * k + 8)} ${f(sw * 0.85)} ${f(sh + (hipY - sh) * k)}" fill="none" stroke="#F3D9C8" stroke-width="3"/>`).join(""))
        );
      case "bride":
        return bodice("#ffffff", -R * 0.18, hw * 2.1,
          `<path d="M${f(-sw * 0.9)} ${f(waistY)} Q0 ${f(waistY + 14)} ${f(sw * 0.9)} ${f(waistY)}" fill="none" stroke="${C.main[0]}" stroke-width="5"/>` +
          [-1.4, -0.7, 0, 0.7, 1.4].map((k) => `<path d="M${f(hw * k * 0.5)} ${f(waistY + 10)} Q${f(hw * k * 0.9)} ${f(hipY)} ${f(hw * k * 1.25)} ${f(-R * 0.25)}" fill="none" stroke="#F6E6EA" stroke-width="3"/>`).join(""));
      case "mom":
        return bodice("#FFB8C4", hipY + R * 0.42, hw * 1.5,
          `<path d="M${f(-R * 0.24)} ${f(sh - 6)} Q0 ${f(sh + R * 0.16)} ${f(R * 0.24)} ${f(sh - 6)}" fill="#ffffff"/>`);
      case "cardigan":
        return (
          `<path d="M${f(-hw * 0.98)} ${f(hipY - R * 0.1)} L${f(hw * 0.98)} ${f(hipY - R * 0.1)} L${f(hw * 0.9)} -10 L${f(R * 0.05)} -10 L0 ${f(hipY + 10)} L${f(-R * 0.05)} -10 L${f(-hw * 0.9)} -10 Z" fill="#B98B82"/>` +
          bodice("#ffffff", hipY - R * 0.02, hw * 1.04) +
          `<path d="M${f(-sw - 2)} ${f(sh + 12)} Q${f(-sw)} ${f(sh - 6)} ${f(-sw * 0.4)} ${f(sh - 6)} L${f(-R * 0.12)} ${f(hipY)} L${f(-hw * 1.12)} ${f(hipY + R * 0.08)} Z" fill="#F29BA6"/>` +
          `<path d="M${f(sw + 2)} ${f(sh + 12)} Q${f(sw)} ${f(sh - 6)} ${f(sw * 0.4)} ${f(sh - 6)} L${f(R * 0.12)} ${f(hipY)} L${f(hw * 1.12)} ${f(hipY + R * 0.08)} Z" fill="#F29BA6"/>`
        );
      case "plain":
      default:
        return bodice("#ffffff", hipY + R * 0.05, hw * 1.12);
    }
  }

  function shoes(p) {
    return { kid: C.main[0], school: "#5A1A24", casual: "#FFFFFF", bride: "#FFFFFF", mom: "#B98B82", cardigan: "#5A1A24", plain: "#D9D2CC" }[p.outfit];
  }

  // ---------- 主函数 ----------
  SE.doll = function (key, o = {}) {
    const p = SE.AGES[key];
    const a = SE.anchors(key);
    const id = o.id || `doll-${key}`;
    const { R, headCY, chin, shoulderY, hipY, sw, hw, aw, armLen, ang, topL, topR } = a;
    const skin = C.skin;
    const legW = R * 0.24, legX = R * 0.26;
    const sock = p.outfit === "school" ? "#ffffff" : null;
    const legs = [-legX, legX].map((x) =>
      `<rect x="${f(x - legW / 2)}" y="${f(hipY - 10)}" width="${f(legW)}" height="${f(-hipY + 2)}" rx="${f(legW / 2)}" fill="${skin}"/>` +
      (sock ? `<rect x="${f(x - legW / 2)}" y="${f(-R * 0.55)}" width="${f(legW)}" height="${f(R * 0.5)}" rx="4" fill="${sock}"/>` : "") +
      `<ellipse cx="${f(x + (x < 0 ? -4 : 4))}" cy="-6" rx="${f(legW * 0.78)}" ry="${f(legW * 0.42)}" fill="${shoes(p)}"/>`).join("");
    const arm = (top, sign) => {
      const [hx, hy] = sign < 0 ? a.handL : a.handR;
      return `<g transform="rotate(${sign * ang} ${f(top[0])} ${f(top[1])})"><rect x="${f(top[0] - aw / 2)}" y="${f(top[1] - aw / 2)}" width="${f(aw)}" height="${f(armLen)}" rx="${f(aw / 2)}" fill="${skin}"/></g>` +
        `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(aw * 0.62)}" fill="${skin}"/>`;
    };
    const sleeve = (top, sign, color) =>
      `<g transform="rotate(${sign * ang} ${f(top[0])} ${f(top[1])})"><rect x="${f(top[0] - aw / 2 - 3)}" y="${f(top[1] - aw / 2 - 2)}" width="${f(aw + 6)}" height="${f(armLen * (p.outfit === "cardigan" ? 0.86 : 0.34))}" rx="${f(aw / 2)}" fill="${color}"/></g>`;
    const sleeveColor = { kid: "#ffffff", school: "#ffffff", casual: "#FFF4EA", bride: null, mom: "#FFB8C4", cardigan: "#F29BA6", plain: "#ffffff" }[p.outfit];
    const torso = `<path d="M${f(-sw)} ${f(shoulderY + 12)} Q${f(-sw)} ${f(shoulderY - 4)} ${f(-sw * 0.5)} ${f(shoulderY - 4)} L${f(sw * 0.5)} ${f(shoulderY - 4)} Q${f(sw)} ${f(shoulderY - 4)} ${f(sw)} ${f(shoulderY + 12)} L${f(hw)} ${f(hipY)} L${f(-hw)} ${f(hipY)} Z" fill="${skin}"/>`;
    const neck = `<rect x="${f(-R * 0.14)}" y="${f(chin - 14)}" width="${f(R * 0.28)}" height="${f(shoulderY - chin + 22)}" rx="${f(R * 0.1)}" fill="${skin}"/>`;
    const head = `<circle cx="0" cy="${f(headCY)}" r="${f(R)}" fill="${skin}"/>` +
      `<ellipse cx="${f(-R * 0.98)}" cy="${f(headCY + R * 0.18)}" rx="${f(R * 0.13)}" ry="${f(R * 0.17)}" fill="${skin}"/><ellipse cx="${f(R * 0.98)}" cy="${f(headCY + R * 0.18)}" rx="${f(R * 0.13)}" ry="${f(R * 0.17)}" fill="${skin}"/>`;
    const body =
      hairBack(p, a) + legs +
      arm(topL, 1) + arm(topR, -1) +
      torso + outfit(p, a) +
      (sleeveColor ? sleeve(topL, 1, sleeveColor) + sleeve(topR, -1, sleeveColor) : "") +
      neck + head + face(a, id, o.expr) + hairFront(p, a);
    return `<g id="${id}">${body}</g>`;
  };

  // 换表情：用肤色盖住原来的嘴，画上新的嘴（id 用来做显隐动画）
  SE.mouthSwap = function (key, expr, id) {
    const a = SE.anchors(key);
    const { R, headCY } = a;
    const my = headCY + R * 0.47;
    const m = expr === "flat"
      ? `<path d="M${f(-R * 0.09)} ${f(my)} L${f(R * 0.09)} ${f(my)}" stroke="#8A3A42" stroke-width="${f(R * 0.04)}" stroke-linecap="round"/>`
      : expr === "o"
        ? `<ellipse cx="0" cy="${f(my)}" rx="${f(R * 0.06)}" ry="${f(R * 0.08)}" fill="#8A3A42"/>`
        : `<path d="M${f(-R * 0.07)} ${f(my + R * 0.02)} L${f(R * 0.07)} ${f(my + R * 0.02)}" stroke="#8A3A42" stroke-width="${f(R * 0.035)}" stroke-linecap="round"/>`;
    return `<g id="${id}" opacity="0"><ellipse cx="0" cy="${f(my)}" rx="${f(R * 0.16)}" ry="${f(R * 0.11)}" fill="${C.skin}"/>${m}</g>`;
  };

  // 婴儿：裹在襁褓里，闭眼（S0）
  SE.baby = function (o = {}) {
    const id = o.id || "baby";
    const R = 74, cy = -205;
    return (
      `<g id="${id}">` +
      `<path d="M-78 -120 Q-92 -10 -40 -4 L40 -4 Q92 -10 78 -120 Q60 -160 0 -162 Q-60 -160 -78 -120 Z" fill="#ffffff"/>` +
      `<path d="M-78 -120 Q0 -70 78 -120 L70 -96 Q0 -46 -70 -96 Z" fill="${C.main[0]}"/>` +
      `<circle cx="0" cy="${cy}" r="${R}" fill="${C.skin}"/>` +
      `<path d="M-6 ${cy - R + 4} Q8 ${cy - R - 26} 22 ${cy - R - 8}" fill="none" stroke="${C.hair}" stroke-width="7" stroke-linecap="round"/>` +
      `<g id="${id}-closed"><path d="M-36 ${cy + 8} Q-26 ${cy + 16} -16 ${cy + 8}" fill="none" stroke="${C.hair}" stroke-width="5" stroke-linecap="round"/><path d="M16 ${cy + 8} Q26 ${cy + 16} 36 ${cy + 8}" fill="none" stroke="${C.hair}" stroke-width="5" stroke-linecap="round"/></g>` +
      `<g id="${id}-open" opacity="0"><ellipse cx="-26" cy="${cy + 8}" rx="9" ry="11" fill="${C.hair}"/><circle cx="-23" cy="${cy + 4}" r="3.6" fill="#fff"/><ellipse cx="26" cy="${cy + 8}" rx="9" ry="11" fill="${C.hair}"/><circle cx="29" cy="${cy + 4}" r="3.6" fill="#fff"/></g>` +
      `<ellipse cx="-44" cy="${cy + 30}" rx="12" ry="7" fill="${C.blush}" opacity="0.6"/><ellipse cx="44" cy="${cy + 30}" rx="12" ry="7" fill="${C.blush}" opacity="0.6"/>` +
      `<path d="M-7 ${cy + 36} Q0 ${cy + 42} 7 ${cy + 36}" fill="none" stroke="#8A3A42" stroke-width="3.5" stroke-linecap="round"/>` +
      `</g>`
    );
  };
})();
