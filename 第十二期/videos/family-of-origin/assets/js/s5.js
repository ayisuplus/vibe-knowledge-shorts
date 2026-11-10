// S5 不是判决书（56.13–69.42）：考艾岛 → 三盏灯笼亮一盏 → 牵手 → 分岔的路
import { el, show, clamp, lerp, ease, easeOut, ramp, win, pulse } from "./lib.js";

const LANT = [{ x: 480, on: false }, { x: 845, on: true }, { x: 1210, on: false }];

export function build() {
  const deck = el("", "deck", "stage");

  // 考艾岛
  const sea = el(`<img src="assets/img/p2-kauai-coast.jpg">`, "", deck,
    "left:0;top:0;width:1920px;height:1080px;overflow:hidden");
  sea.firstChild.style.cssText = "display:block;width:1920px;height:1080px;object-fit:cover";
  const seaTint = el("", "", deck, `left:0;top:0;width:1920px;height:1080px;
    background:linear-gradient(180deg, rgba(251,227,176,.28), rgba(247,242,234,.5))`);
  const place = el("1955 · 夏威夷 · 考艾岛", "lbl", deck,
    `left:0;right:0;top:150px;text-align:center;font-size:44px;font-weight:700;color:#2B2622;
     text-shadow:0 2px 16px rgba(255,246,226,.95)`);

  // 沙滩上的光点 → 698 个孩子
  const dots = Array.from({ length: 24 }, (_, i) => {
    const a = i * 0.9173;
    const x = 300 + ((i * 137) % 1320), y = 660 + Math.sin(a * 2.1) * 120 + ((i * 53) % 140);
    const e = el("", "", deck, `left:${x}px;top:${y}px;width:16px;height:16px;border-radius:50%;
      background:#FBE3B0;box-shadow:0 0 22px 8px rgba(242,180,90,.6)`);
    return { e, x, y };
  });
  const count = el("698 个孩子", "big", deck,
    `left:0;right:0;top:600px;text-align:center;font-family:"NotoSerifSC";font-size:112px;color:#2B2622;
     text-shadow:0 2px 20px rgba(255,246,226,.95)`);

  // 三盏灯笼
  const lants = LANT.map((L) => {
    const g = el("", "", deck, `left:${L.x}px;top:300px;width:230px;height:460px`);
    g.style.position = "absolute";
    g.innerHTML = `<div class="halo"></div><div class="wire"></div><div class="cap"></div>
      <div class="body"><i></i><i></i><i></i></div><div class="foot"></div>`;
    const q = (s2) => g.querySelector(s2);
    const body = q(".body"), halo = q(".halo");
    q(".wire").style.cssText = `position:absolute;left:113px;top:-300px;width:4px;height:330px;background:#A8977F`;
    q(".cap").style.cssText = `position:absolute;left:62px;top:28px;width:106px;height:22px;border-radius:6px;
      background:#C9B48E;border:2px solid #A8977F`;
    q(".foot").style.cssText = `position:absolute;left:62px;top:392px;width:106px;height:22px;border-radius:6px;
      background:#C9B48E;border:2px solid #A8977F`;
    body.style.cssText = `position:absolute;left:14px;top:46px;width:202px;height:348px;border-radius:101px/120px;
      border:3px solid #A8977F;background:linear-gradient(180deg,#FFFDF8,#F2EADC);overflow:hidden`;
    [...body.querySelectorAll("i")].forEach((b, k) => {
      b.style.cssText = `position:absolute;left:${34 + k * 56}px;top:0;width:2px;height:100%;background:rgba(168,151,127,.45)`;
    });
    halo.style.cssText = `position:absolute;left:-175px;top:-110px;width:580px;height:620px;border-radius:50%;
      background:radial-gradient(circle, rgba(251,227,176,.95), transparent 62%);opacity:0`;
    return { g, body, halo, L };
  });
  const lantLbl = el("最难的那群孩子 · 三个里有一个", "lbl", deck,
    "left:0;right:0;top:830px;text-align:center;font-size:42px;font-weight:700");

  // 光里的大人剪影
  const grown = el(`<svg width="300" height="450" viewBox="0 0 280 420">
      <circle cx="140" cy="86" r="56" fill="#2B2622" opacity=".82"/>
      <path d="M140 150 C 70 150 44 210 40 420 L 240 420 C 236 210 210 150 140 150 Z" fill="#2B2622" opacity=".82"/>
    </svg>`, "", deck, "left:810px;top:330px");

  // 牵手照片
  const hands = el(`<img src="assets/img/p3-holding-hands.jpg">`, "print", deck,
    "left:410px;top:120px;width:1100px");
  hands.firstChild.style.cssText = "display:block;width:100%";

  // 分岔的路
  const roads = el(`<svg width="1500" height="520" viewBox="0 0 1500 520">
      <g fill="none" stroke="#C9B48E" stroke-width="10" stroke-linecap="round">
        <path class="r" d="M60 470 C 300 470, 420 300, 700 270"/>
        <path class="r" d="M700 270 C 950 244, 1060 120, 1420 92"/>
        <path class="r" d="M700 270 C 940 290, 1040 250, 1420 236"/>
        <path class="r" d="M700 270 C 930 318, 1020 390, 1420 404"/>
      </g>
      <rect x="6" y="392" width="116" height="116" rx="12" fill="#FBE3B0" stroke="#A8977F" stroke-width="4"/>
      <path d="M64 392 V508 M6 450 H122" stroke="#A8977F" stroke-width="4"/>
    </svg>`, "", deck, "left:220px;top:400px");
  const rpaths = [...roads.querySelectorAll(".r")];
  rpaths.forEach((p) => { const L = p.getTotalLength?.() || 900; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.len = L; });

  function state(t) {
    const live = t >= 55.7 && t < 69.9;
    deck.style.display = live ? "block" : "none";
    if (!live) return;
    deck.style.opacity = win(t, 55.9, 69.1, 0.5, 0.7).toFixed(3);

    // 考艾岛：镜头从海上往岸边推
    const seaO = win(t, 56.13, 61.44, 0.6, 0.8);
    const fly = ease(ramp(t, 56.13, 5.2));
    show(sea, seaO, `scale(${lerp(1.26, 1.02, fly)}) translate(${lerp(90, 0, fly)}px, ${lerp(40, 0, fly)}px)`);
    show(seaTint, seaO * 0.9, "");
    show(place, win(t, 56.6, 60.6, 0.5, 0.6), "");

    // 光点 → 698
    dots.forEach((d, i) => {
      const t0 = 59.0 + (i % 8) * 0.06;
      const o = win(t, t0, 61.0, 0.4, 0.5);
      const g = ease(clamp((t - 59.59) / 1.5));                 // 聚到中间那行字
      const tx = lerp(d.x, 860 + ((i * 97) % 220), g), ty = lerp(d.y, 660, g);
      show(d.e, o * lerp(1, 0.25, g), `translate(${tx - d.x}px, ${ty - d.y}px) scale(${lerp(1, 0.5, g)})`);
    });
    show(count, win(t, 59.9, 61.2, 0.5, 0.5),
      `translateY(${lerp(26, 0, ease(ramp(t, 59.9, 0.8)))}px) scale(${lerp(0.94, 1, ease(ramp(t, 59.9, 0.8)))})`);

    // 三盏灯笼
    const lO = win(t, 61.44, 65.2, 0.5, 0.7);
    lants.forEach((u, i) => {
      const rise = easeOut(clamp((t - 61.44 - i * 0.12) / 0.6));
      const lit = u.L.on ? ease(clamp((t - 61.85) / 0.7)) : 0;
      const up = u.L.on ? ease(clamp((t - 63.58) / 1.2)) : 0;    // 亮的那盏升起来
      u.body.style.background = u.L.on
        ? `linear-gradient(180deg, rgba(255,246,226,${(0.55 + lit * 0.45).toFixed(2)}), rgba(242,180,90,${(0.3 + lit * 0.7).toFixed(2)}))`
        : "linear-gradient(180deg,#FFFDF8,#F0E7D7)";
      u.body.style.boxShadow = lit ? `0 0 ${(70 * lit).toFixed(0)}px ${(22 * lit).toFixed(0)}px rgba(242,180,90,${(0.6 * lit).toFixed(2)}), inset 0 0 50px rgba(255,246,226,${(0.8 * lit).toFixed(2)})` : "none";
      u.halo.style.opacity = (lit * 0.85).toFixed(3);
      show(u.g, lO * (u.L.on ? 1 : lerp(1, 0.4, up)),
        `translateY(${lerp(60, 0, rise) - up * 120}px) scale(${lerp(0.9, 1, rise) * lerp(1, 1.1, up)})`);
    });
    show(lantLbl, win(t, 61.8, 64.4, 0.45, 0.6), "");
    const gO = win(t, 63.9, 65.3, 0.6, 0.5);
    show(grown, gO * 0.9, `translateY(${lerp(50, -20, ease(ramp(t, 63.9, 1.2)))}px) scale(${lerp(0.9, 1, ease(ramp(t, 63.9, 1.2)))})`);

    // 牵手
    const hO = win(t, 65.17, 68.09, 0.6, 0.7);
    const hk = ease(ramp(t, 65.17, 3.0));
    show(hands, hO, `translateY(${lerp(28, 0, hk)}px) scale(${lerp(1.04, 1.1, hk)}) rotate(-1.2deg)`);

    // 分岔的路
    const rO = win(t, 68.09, 69.2, 0.45, 0.6);
    show(roads, rO, "");
    rpaths.forEach((p, i) => {
      const k = ease(clamp((t - 68.15 - (i === 0 ? 0 : 0.35 + i * 0.1)) / 0.62));
      p.style.strokeDashoffset = (+p.dataset.len * (1 - k)).toFixed(0);
      p.style.stroke = i === 0 ? "#C9B48E" : "#F2B45A";
      p.style.filter = i === 0 ? "" : `drop-shadow(0 0 ${(10 * k).toFixed(0)}px rgba(242,180,90,.75))`;
    });
  }

  return { state };
}
