// 第四期样张 · 共用绘图工具（SVG 字符串）
window.K = (() => {
  const NS = "http://www.w3.org/2000/svg";
  // 可复现的随机数
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

  // 空中漂浮的金色微尘
  function motes(n, seed, { x0 = 0, x1 = 1920, y0 = 0, y1 = 1080, color = "#ebc57a", max = 4, op = .7 } = {}) {
    const r = rng(seed); let s = "";
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), rr = .8 + r() * max, o = (.25 + r() * .75) * op;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="${color}" opacity="${o.toFixed(2)}" filter="url(#soft)"/>`;
    }
    return s;
  }

  // 古希腊回纹带：x0..x1，顶边 y，高 h
  function meander(x0, x1, y, h, color, sw = 6) {
    const u = h; let d = "";
    for (let x = x0; x < x1; x += u * 1.25) {
      const a = u * .9;
      d += `M${x},${y + h} V${y} H${x + a} V${y + h * .72} H${x + a * .3} V${y + h * .35} H${x + a * .62}`;
    }
    return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="square" stroke-linejoin="miter"/>`
      + `<line x1="${x0}" x2="${x1}" y1="${y - h * .32}" y2="${y - h * .32}" stroke="${color}" stroke-width="${sw * .6}"/>`
      + `<line x1="${x0}" x2="${x1}" y1="${y + h * 1.32}" y2="${y + h * 1.32}" stroke="${color}" stroke-width="${sw * .6}"/>`;
  }

  // 红绘陶罐风格的"圆形人"：两人背靠背连成一个球
  // half: 0 整个 / -1 只要左半 / 1 只要右半
  function roundHuman(id, { r = 80, half = 0, clay = "#c8643b", line = "#2a140b", cut = "#fff1cf" } = {}) {
    const hr = r * .5, hy = -r - hr * .55;
    const L = line, w = Math.max(2.2, r * .035);
    // 四肢集中在上下：手从肩膀伸出，腿从底部伸出，侧面留空（避免像虫子）
    const arm = (x0, y0, x1, y1, bend) => `<path d="M${x0},${y0} Q${(x0 + x1) / 2},${(y0 + y1) / 2 + bend} ${x1},${y1}" stroke="${clay}" stroke-width="${r * .15}" stroke-linecap="round" fill="none"/><circle cx="${x1}" cy="${y1}" r="${r * .1}" fill="${clay}"/>`;
    const leg = (x0, y0, x1, y1, sx) => `<path d="M${x0},${y0} L${x1},${y1}" stroke="${clay}" stroke-width="${r * .17}" stroke-linecap="round"/><path d="M${x1},${y1} h${sx * r * .2}" stroke="${clay}" stroke-width="${r * .12}" stroke-linecap="round"/>`;
    const limb = (sx) =>
      arm(sx * r * .5, -r * .74, sx * r * 1.12, -r * 1.22, -r * .05)
      + arm(sx * r * .72, -r * .58, sx * r * 1.34, -r * .62, r * .12)
      + leg(sx * r * .5, r * .82, sx * r * .7, r * 1.48, sx)
      + leg(sx * r * .26, r * .94, sx * r * .3, r * 1.6, sx);
    // 头：两个头背靠背、后脑勺重叠，各朝外一张侧脸（鼻子、眼睛、胡须、头发）
    const hR = hr * .8;
    const head = (sx) => { const c = sx * hr * .4, o = (k) => c + sx * k;
      return `
      <circle cx="${c}" cy="${hy}" r="${hR}" fill="${clay}" stroke="${L}" stroke-width="${w}"/>
      <path d="M${o(-hR * .95)},${hy - hR * .1} Q${o(-hR * .6)},${hy - hR * 1.25} ${o(hR * .55)},${hy - hR * .78} Q${o(hR * .1)},${hy - hR * .6} ${o(-hR * .2)},${hy - hR * .35} Q${o(-hR * .55)},${hy - hR * .2} ${o(-hR * .7)},${hy + hR * .3} Z" fill="${L}"/>
      <path d="M${o(hR * .9)},${hy - hR * .22} l${sx * hR * .24},${hR * .3} l${-sx * hR * .22},${hR * .07}" fill="${clay}" stroke="${L}" stroke-width="${w * .8}" stroke-linejoin="round"/>
      <path d="M${o(hR * .36)},${hy - hR * .34} q${sx * hR * .16},${-hR * .1} ${sx * hR * .3},${hR * .02}" stroke="${L}" stroke-width="${w}" fill="none" stroke-linecap="round"/>
      <circle cx="${o(hR * .5)}" cy="${hy - hR * .14}" r="${w}" fill="${L}"/>
      <path d="M${o(hR * .2)},${hy + hR * .35} Q${o(hR * .45)},${hy + hR * 1.05} ${o(hR * .86)},${hy + hR * .45}" fill="${L}" opacity=".85"/>`; };
    const body = `
      <g>
        ${limb(-1)}${limb(1)}
        <circle r="${r}" fill="${clay}"/>
        <!-- 长袍褶皱 -->
        <path d="M${-r * .7},${-r * .55} Q0,${-r * .15} ${r * .7},${-r * .55}" stroke="${L}" stroke-width="${w}" fill="none"/>
        <path d="M${-r * .5},${-r * .2} Q${-r * .35},${r * .4} ${-r * .55},${r * .78}" stroke="${L}" stroke-width="${w * .7}" fill="none" opacity=".75"/>
        <path d="M${-r * .2},${-r * .1} Q${-r * .1},${r * .5} ${-r * .22},${r * .97}" stroke="${L}" stroke-width="${w * .7}" fill="none" opacity=".75"/>
        <path d="M${r * .2},${-r * .1} Q${r * .1},${r * .5} ${r * .22},${r * .97}" stroke="${L}" stroke-width="${w * .7}" fill="none" opacity=".75"/>
        <path d="M${r * .5},${-r * .2} Q${r * .35},${r * .4} ${r * .55},${r * .78}" stroke="${L}" stroke-width="${w * .7}" fill="none" opacity=".75"/>
        <line x1="0" x2="0" y1="${-r * .76}" y2="${r}" stroke="${L}" stroke-width="${w * .8}" stroke-dasharray="${w * 2} ${w * 2.2}" opacity=".8"/>
        <circle r="${r}" fill="none" stroke="${L}" stroke-width="${w}"/>
        <!-- 脖子和头 -->
        <rect x="${-hr * .4}" y="${hy + hr * .6}" width="${hr * .8}" height="${hr * .6}" fill="${clay}"/>
        <path d="M${-r * .42},${-r * .9} Q0,${-r * .62} ${r * .42},${-r * .9}" stroke="${L}" stroke-width="${w}" fill="none"/>
        ${head(-1)}${head(1)}
      </g>`;
    if (!half) return `<g id="${id}">${body}</g>`;
    // 半个人：裁掉另一侧，切口描一条亮线
    const cx = half < 0 ? -r * 2.2 : 0, cw = r * 2.2;
    return `<g id="${id}">
      <clipPath id="${id}-c"><rect x="${cx}" y="${-r * 2.4}" width="${cw}" height="${r * 4.6}"/></clipPath>
      <g clip-path="url(#${id}-c)">${body}</g>
      <line x1="0" x2="0" y1="${hy - hr * 1.1}" y2="${r * 1.05}" stroke="${cut}" stroke-width="${w * 1.5}" stroke-linecap="round" filter="url(#glow)"/>
    </g>`;
  }

  return { NS, rng, motes, meander, roundHuman };
})();
