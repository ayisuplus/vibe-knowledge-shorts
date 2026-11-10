// S8 那一夜（133.99–142.49）· S9 当下（142.49–148.86）· S10 结尾提问（148.86–157.37）· S11 片尾（157.37–160.17）
(function () {
  const D = window.D, C = D.C;

  D.scene811 = () => {
    const mid = D.L.mid;
    // ================= S8 拿铜换金 =================
    const s8 = D.g(mid, { id: "s8" });
    s8.insertAdjacentHTML("beforeend", `<path d="M520,170 L1000,140 L1400,190 L1430,520 L1380,820 L900,850 L540,800 L490,480 Z" fill="${C.glaze}" stroke="#3a2a20" stroke-width="5" filter="url(#shadow)"/>
      <g opacity=".9">${D.meander(560, 1380, 196, 22, C.clay, 4)}</g>
      <line x1="540" x2="1400" y1="760" y2="760" stroke="${C.clay}" stroke-width="3" opacity=".7"/>`);
    const soc = D.svg(s8, D.figure({ head: "socrates", arm: "forward" }), {});
    const youth = D.svg(s8, D.figure({ head: "youth", arm: "offer" }), {});
    // 天平：苏格拉底一侧放金子，青年一侧放铜币
    const scale = D.g(s8);
    scale.insertAdjacentHTML("beforeend", `<path d="M0,0 V230 M-60,236 H60" stroke="${C.cream}" stroke-width="6" stroke-linecap="round"/><path d="M-14,0 L0,-22 L14,0 Z" fill="${C.cream}"/>`);
    const beam = D.g(scale);
    const pan = (x, inner) => `<path d="M${x},0 L${x - 60},110 M${x},0 L${x + 60},110" stroke="${C.cream}" stroke-width="2.5"/><path d="M${x - 70},110 Q${x},150 ${x + 70},110 Z" fill="${C.clay}" stroke="${C.cream}" stroke-width="3"/>${inner}`;
    beam.insertAdjacentHTML("beforeend", `<line x1="-170" x2="170" y1="0" y2="0" stroke="${C.cream}" stroke-width="7" stroke-linecap="round"/>`);
    const panL = D.svg(beam, pan(-170, `<path d="M-200,108 L-190,84 L-150,84 L-140,108 Z" fill="#e6b85c" stroke="#a8762c" stroke-width="2"/>`));
    const panR = D.svg(beam, pan(170, `<g fill="#b87333" stroke="#6b3a14" stroke-width="2"><ellipse cx="150" cy="104" rx="14" ry="5"/><ellipse cx="172" cy="104" rx="14" ry="5"/><ellipse cx="190" cy="104" rx="14" ry="5"/><ellipse cx="162" cy="96" rx="14" ry="5"/><ellipse cx="182" cy="96" rx="14" ry="5"/></g>`));
    D.onFrame((t) => {
      const on = t > 133.7 && t < 142.6;
      D.op(s8, on ? D.clamp((t - 133.8) / .5) * (1 - D.clamp((t - 141.9) / .5)) : 0);
      if (!on) return;
      const ky = D.prog(t, 134.2, .7);
      D.tf(youth, 1260 - ky * 60, 760, 1); youth.setAttribute("transform", `translate(${D.f(1260 - ky * 60)} 760) scale(-.82 .82)`);
      const shake = t > 138.24 && t < 139.4 ? Math.sin((t - 138.24) * 18) * 3 : 0;
      soc.setAttribute("transform", `translate(700 760) scale(.82) rotate(${D.f(shake)} 9 -448)`);
      const ks = D.prog(t, 138.24, .5);
      D.tf(scale, 960, 290 + (1 - ks) * 20);
      D.op(scale, t < 138.24 ? 0 : ks);
      const tip = t > 140.1 ? -14 * D.ease.back(D.clamp((t - 140.1) / .5)) : 0;
      beam.setAttribute("transform", `rotate(${D.f(tip)})`);
      // 秤盘保持竖直
      panL.setAttribute("transform", `rotate(${D.f(-tip)} -170 0)`);
      panR.setAttribute("transform", `rotate(${D.f(-tip)} 170 0)`);
    });
    D.cap("酒会最后，一位俊美青年想用美貌，换苏格拉底的<em>智慧</em>", 133.99, 138.24);
    D.cap("苏格拉底拒绝了：这是<em>拿铜换金</em>", 138.24, 140.37);
    D.cap("书里那段「什么也没发生」的故事，其实是一次<em>拒绝</em>", 140.37, 142.49);

    // ================= S9 当下 =================
    const s9 = D.g(mid, { id: "s9" });
    const card = (inner, label) => `<g filter="url(#shadow)"><rect x="-150" y="-160" width="300" height="320" rx="26" fill="#fffaf2"/></g>
      <rect x="-150" y="-160" width="300" height="320" rx="26" fill="none" stroke="${C.gold}" stroke-width="2"/>${inner}
      <text x="0" y="220" text-anchor="middle" font-size="36" font-weight="800" letter-spacing="4" fill="${C.ink}">${label}</text>`;
    const chat = `<rect x="-110" y="-120" width="220" height="210" rx="16" fill="#f3ebdd"/><rect x="-96" y="-96" width="130" height="40" rx="20" fill="#fff"/><rect x="-30" y="-40" width="126" height="40" rx="20" fill="#f7cfc8"/><rect x="-96" y="16" width="100" height="40" rx="20" fill="#fff"/>
      <path d="M58,40 q12,-14 24,0 q12,-14 24,0 q0,16 -24,32 q-24,-16 -24,-32 Z" fill="${C.rose}" transform="translate(-30 0) scale(.8)"/>`;
    const clock = (x, h, m) => `<g transform="translate(${x} -30)"><circle r="54" fill="#fff" stroke="${C.ink}" stroke-width="5"/><line x1="0" y1="0" x2="${D.f(Math.sin(h / 12 * 6.283) * 28)}" y2="${D.f(-Math.cos(h / 12 * 6.283) * 28)}" stroke="${C.ink}" stroke-width="6" stroke-linecap="round"/><line x1="0" y1="0" x2="${D.f(Math.sin(m / 60 * 6.283) * 40)}" y2="${D.f(-Math.cos(m / 60 * 6.283) * 40)}" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/></g>`;
    const dist = clock(-62, 9, 0) + clock(62, 2, 30) + `<path d="M-60,60 Q0,110 60,60" fill="none" stroke="${C.gold}" stroke-width="3" stroke-dasharray="6 8"/>`;
    const buddy = `<g fill="none" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" transform="translate(0 20) scale(2.2)">${D.figIcon(-24, 0, 1)}${D.figIcon(24, 0, 1)}<path d="M-48,-20 h12 M-44,-26 v12 M-40,-26 v12 M36,-20 h12 M40,-26 v12 M44,-26 v12"/></g>`;
    const ai = `<rect x="-110" y="-120" width="220" height="210" rx="16" fill="#f3ebdd"/><circle cx="-70" cy="-70" r="24" fill="${C.ink}"/><text x="-70" y="-61" text-anchor="middle" font-family="GaraB" font-size="24" fill="#fff">AI</text>
      <rect x="-36" y="-92" width="132" height="40" rx="20" fill="#fff"/><rect x="-96" y="-10" width="150" height="40" rx="20" fill="#f7cfc8"/><rect x="-36" y="46" width="110" height="34" rx="17" fill="#fff"/>`;
    const cards = [[chat, "网恋"], [dist, "异地"], [buddy, "搭子"], [ai, "和 AI 聊天"]].map(([inner, lab]) => D.svg(s9, card(inner, lab)));
    const CT = [142.49, 143.03, 143.56, 144.09];
    D.onFrame((t) => {
      const on = t > 142.3 && t < 148.9;
      D.op(s9, on ? 1 - D.clamp((t - 146.74) / .6) : 0);
      if (!on) return;
      const shrink = D.ease.inOut(D.clamp((t - 144.61) / .5));
      cards.forEach((c, i) => {
        const k = D.clamp((t - CT[i]) / .3);
        D.tf(c, D.lerp(390 + i * 380, 450 + i * 340, shrink), D.lerp(430, 420, shrink), 1.22 * D.lerp(.6, 1, D.ease.back(k)) * D.lerp(1, .9, shrink), (i - 1.5) * 2 * (1 - shrink));
        D.op(c, t < CT[i] ? 0 : k);
      });
    });
    D.head(142.49, 148.86, { year: "今天", place: "" });
    D.cap("如今，网恋、异地、搭子、和 AI 聊天……", 142.49, 144.61);
    D.cap("都有人叫它「柏拉图式」", 144.61, 146.74);
    D.cap("可《会饮篇》问的，不是「碰没碰」", 146.74, 148.86);

    // ================= S10 / S11 结尾 =================
    const s10 = D.g(mid, { id: "s10" });
    const left = D.g(s10), right = D.g(s10);
    left.insertAdjacentHTML("beforeend", `<circle r="250" fill="${C.glaze}" filter="url(#shadow)"/><circle r="250" fill="none" stroke="#3a2a20" stroke-width="6"/>${D.meanderRing(234, C.clay, 4)}`);
    const lRing = D.el(left, "circle", { r: 165, fill: "url(#roseRing)" });
    D.svg(left, D.roundHuman("endW", { r: 78 }), { transform: "translate(0 0)" });
    D.el(s10, "line", { x1: 960, x2: 960, y1: 190, y2: 760, stroke: C.gold, "stroke-width": 2, opacity: .7 });
    const g = D.ladderGeo;
    const rIn = D.g(right, { transform: "translate(790 210) scale(.64)" });
    const rGlow = D.g(rIn);
    D.el(rGlow, "circle", { cx: g.BX, cy: g.BY, r: 300, fill: "url(#sky)" });
    D.el(rGlow, "circle", { cx: g.BX, cy: g.BY, r: 70, fill: "#fffdf6", filter: "url(#blur20)" });
    const lad2 = D.buildLadder(rIn, "lad2");
    const endClimber = D.svg(rIn, D.climber(), { transform: `translate(${g.tx(g.N - 1)} ${g.ty(g.N - 1) + 4})` });
    const qa = D.text("你要找的，是<em>另一半</em>，", 960, 806, { anchor: "center", cls: "q", win: [153.12, 160.4], d: .4 });
    const qb = D.text("还是一个让你<em>变好</em>的人？", 960, 906, { anchor: "center", cls: "q", win: [155.25, 160.4], d: .4 });
    D.html.push(`<style>.q{font-size:72px;font-weight:900;letter-spacing:2px;color:#2a1e16;text-shadow:0 0 22px rgba(248,241,229,.95),0 0 6px rgba(248,241,229,.9)}.q em{font-style:normal;color:#d4505e}</style>`);
    const endTitle = D.text("柏拉图式恋爱", 960, 60, { anchor: "center", cls: "endt", win: [157.37, 160.4], d: .5 });
    D.text("参考：柏拉图《会饮篇》 · 费奇诺致阿拉曼诺·多纳蒂的信（1476） · 达文南特《柏拉图式恋人》（1636）", 960, 150, { anchor: "center", cls: "credits", win: [157.6, 160.4], d: .5 });
    D.html.push(`<style>.endt{font-size:60px;font-weight:900;letter-spacing:14px;color:#c99a4a}</style>`);
    D.onFrame((t) => {
      const on = t > 148.6;
      D.op(s10, on ? D.clamp((t - 148.86) / .6) : 0);
      if (!on) return;
      const dim = 1 - .55 * D.clamp((t - 157.37) / .6);
      D.tf(left, 560, 470, 1 + (t > 154.97 ? .04 * Math.sin(D.clamp((t - 154.97) / .5) * Math.PI) : 0));
      D.op(left, dim);
      D.op(right, dim);
      D.op(lRing, .35 + (t > 154.97 ? .65 * D.clamp((t - 154.97) / .3) : 0) * (1 - .5 * D.clamp((t - 156) / 1)));
      lad2.steps.forEach((s, i) => {
        const t0 = 156.04 + i * .09;
        const k = t > t0 ? Math.exp(-(t - t0) * 2.5) : 0;
        D.op(s.rim, .4 + .6 * Math.min(1, (t > t0 ? 1 : 0) * .6 + k));
        s.rim.setAttribute("stroke-width", D.f(3 + k * 5));
      });
      D.op(rGlow, .55 + (t > 157.11 ? .45 * Math.exp(-(t - 157.11) * 2) + .2 : 0));
      D.op(endClimber, 1);
    });
    D.cap("而是这份爱，让你<em>往哪走</em>", 148.86, 153.12);
  };
})();
