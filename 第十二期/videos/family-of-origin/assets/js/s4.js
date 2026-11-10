// S4 伤是真的（46.84–56.13）：两根玻璃管 → 门缝的光 → 「不等于判决书」
import { el, show, clamp, lerp, ease, easeOut, ramp, win, pulse } from "./lib.js";

const TUBE = { w: 168, h: 520, y: 300 };
const TUBES = [
  { x: 700, to: 0.14, num: "14%", cap: "0 项", bold: false },
  { x: 1120, to: 0.51, num: "51%", cap: "4 项以上", bold: true },
];

export function build() {
  const deck = el("", "deck", "stage");

  const head = el("童年不良经历 · 成年后的抑郁情绪", "lbl", deck,
    "left:0;right:0;top:108px;text-align:center;font-size:40px;font-weight:700");

  const tubes = TUBES.map((T) => {
    const g = el("", "", deck, `left:${T.x}px;top:${TUBE.y}px;width:${TUBE.w}px;height:${TUBE.h}px`);
    g.style.position = "absolute";
    const glass = document.createElement("div");
    glass.style.cssText = `position:absolute;inset:0;border-radius:${TUBE.w / 2}px;border:3px solid #A8977F;
      background:linear-gradient(100deg, rgba(255,253,248,.9), rgba(247,242,234,.6));overflow:hidden`;
    const fill = document.createElement("div");
    fill.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:0;
      background:linear-gradient(180deg, #FBE3B0, #F2B45A);box-shadow:0 0 50px 12px rgba(242,180,90,.5)`;
    glass.appendChild(fill);
    g.appendChild(glass);
    const num = el(T.num, "big", deck, `left:${T.x}px;top:${TUBE.y - 118}px;width:${TUBE.w}px;text-align:center;
      font-family:"NotoSC";font-size:${T.bold ? 96 : 76}px;color:${T.bold ? "#A84C00" : "#6B6157"}`);
    const cap = el(T.cap, "lbl", deck, `left:${T.x}px;top:${TUBE.y + TUBE.h + 26}px;width:${TUBE.w}px;text-align:center`);
    return { g, fill, num, cap, T };
  });

  // 门：墙上一道门，光从门里出来，地上拉出一片光
  const wall = el("", "", deck, `left:0;top:0;width:1920px;height:1080px;
    background:linear-gradient(180deg,#F2EADC,#E8DCC8)`);
  const door = el("", "", deck, `left:760px;top:150px;width:400px;height:720px;border-radius:12px 12px 0 0;
    background:#CBB795;border:4px solid #8E7A5C;box-shadow:inset 0 0 60px rgba(107,97,87,.25)`);
  const knob = el("", "", deck, `left:1096px;top:520px;width:22px;height:22px;border-radius:50%;background:#A8977F`);
  const slit = el("", "", deck, `left:1040px;top:150px;width:0;height:720px;border-radius:0 12px 12px 0;
    background:linear-gradient(90deg,#FFF6E2,#FBE3B0);box-shadow:0 0 70px 24px rgba(251,227,176,.9)`);
  const beam = el(`<svg width="1920" height="620" viewBox="0 0 1920 620" preserveAspectRatio="none">
      <path class="b" d="M1040 0 L1040 0 L1040 620 L1040 620 Z" fill="url(#bg1)"/>
      <defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#FBE3B0" stop-opacity=".95"/>
        <stop offset="1" stop-color="#FBE3B0" stop-opacity="0"/></linearGradient></defs>
    </svg>`, "", deck, "left:0;top:560px");
  const beamP = beam.querySelector(".b");
  const flood = el("", "", deck, `left:0;top:0;width:1920px;height:1080px;
    background:radial-gradient(900px 700px at 50% 52%, rgba(255,246,226,.98), rgba(251,227,176,.72) 52%, rgba(251,227,176,.25) 78%, transparent)`);

  // 「不等于判决书」卡片（在光里翻过来）
  const verdict = el(`<b>不等于判决书</b>`, "", deck,
    `left:550px;top:410px;width:820px;height:250px;border-radius:16px;background:#FFFDF8;border:3px solid #A8977F;
     display:flex;align-items:center;justify-content:center;font:800 104px "NotoSerifSC";color:#2B2622;
     box-shadow:0 40px 80px -36px rgba(74,58,40,.55);transform-style:preserve-3d`);

  function state(t) {
    const live = t >= 46.3 && t < 56.9;
    deck.style.display = live ? "block" : "none";
    if (!live) return;
    deck.style.opacity = win(t, 46.5, 56.4, 0.5, 0.5).toFixed(3);

    // 玻璃管
    const tubeO = win(t, 46.84, 51.08, 0.5, 0.7);
    show(head, tubeO, "");
    tubes.forEach((u, i) => {
      const t0 = 46.84 + i * 0.25;
      const rise = easeOut(clamp((t - t0) / 0.6));
      const k = ease(clamp((t - 47.5 - i * 0.3) / 1.7));          // 光往上涨
      u.fill.style.height = `${(TUBE.h * u.T.to * k).toFixed(1)}px`;
      show(u.g, tubeO, `translateY(${lerp(70, 0, rise)}px)`);
      const nO = win(t, 48.96 + i * 0.22, 51.08, 0.4, 0.7);
      show(u.num, nO, `translateY(${lerp(18, 0, ease(clamp((t - 48.96 - i * 0.22) / 0.5)))}px)`);
      show(u.cap, tubeO, "");
    });

    // 门 + 光
    const dO = win(t, 51.08, 56.0, 0.5, 0.9);
    const open = ease(clamp((t - 51.3) / 1.4));                   // 门缝变宽
    const fade = 1 - ease(clamp((t - 52.6) / 1.1));   // 光满了，门退掉
    show(wall, dO * 0.92 * lerp(0.25, 1, fade), "");
    show(door, dO * fade, "");
    door.style.zIndex = "1";
    show(knob, dO * fade, "");
    show(slit, dO * fade, "");
    slit.style.width = `${(6 + open * 250).toFixed(0)}px`;
    // 地上的光：门缝越宽，光越张开
    const w0 = 1040, w1 = 1040 + 6 + open * 250;
    const sp = 420 * open;
    beamP.setAttribute("d", `M${w0} 0 L${w1.toFixed(0)} 0 L${(w1 + sp).toFixed(0)} 620 L${(w0 - sp).toFixed(0)} 620 Z`);
    show(beam, dO * lerp(0.2, 1, open), "");
    beam.style.zIndex = "2";
    // 52.41 光铺满地面，然后整屏变亮
    const fl = ease(clamp((t - 52.41) / 1.3));
    show(flood, dO * fl * 0.82, `scale(${lerp(0.7, 1.12, fl)})`);

    // 判决书卡片
    const vO = win(t, 53.21, 55.9, 0.45, 0.6);
    const flip = ease(clamp((t - 53.5) / 1.0));
    const lift = easeOut(clamp((t - 53.21) / 1.2));
    const fly = ease(clamp((t - 55.33) / 1.1));
    verdict.style.zIndex = "5";
    show(verdict, vO,
      `translate(${(fly * 60).toFixed(0)}px, ${lerp(90, 0, lift) - fly * 150}px) scale(${lerp(0.86, 1, lift) * lerp(1, 1.5, fly)}) rotateY(${lerp(96, 0, flip)}deg)`);
  }

  return { state };
}
