// S3 怎么变味的（29.83–43.38）+ 43.38 的裂痕（S4 的第一拍，但画面长在这张卡上）
// 版式：左边是词条卡和贴上来的便利贴（一个 pile 组，38.34 整体推到画面中间），
// 右边是「这一年发生了什么」，底下是贯穿全宽的时间线。
import { el, show, clamp, lerp, ease, easeOut, easeIn, ramp, win, pulse, track } from "./lib.js";
import { card, note } from "./deck.js";

const YEARS = [
  { y: "2007", x: 330, t: 29.83, lbl: "《为何家会伤人》" },
  { y: "2008", x: 700, t: 31.95, lbl: "「父母皆祸害」" },
  { y: "2018", x: 1180, t: 33.68, lbl: "中文版" },
  { y: "2019", x: 1600, t: 38.34, lbl: "《都挺好》" },
];
// 贴到卡上的便利贴（坐标在 pile 组的局部空间里）
// 坐标在 pcard 组的局部空间里（词条卡本身占 0,0–1240,640），所以和风格样张同一个比例
const NOTES = [
  { t: 30.1, x: -70, y: -58, rot: -6, c: "n1", w: 330, fs: 50, text: "家会伤人" },
  { t: 32.2, x: 980, y: 430, rot: 5, c: "n3", w: 270, fs: 50, text: "祸害" },
  { t: 34.75, x: 430, y: 30, rot: -11, c: "n2", w: 340, fs: 88, scale: 1.02, text: "有毒" },
  { t: 38.34, x: -40, y: 400, rot: 7, c: "n4", w: 290, fs: 50, text: "不幸" },
  { t: 38.52, x: 250, y: 300, rot: -4, c: "n3", w: 330, fs: 50, text: "都怪他们" },
  { t: 38.7, x: 830, y: 40, rot: 9, c: "n1", w: 330, fs: 50, text: "断了就好" },
  { t: 38.88, x: 540, y: 430, rot: -8, c: "n2", w: 290, fs: 50, text: "注定" },
];
const EN = "Toxic Parents";

export function build() {
  const deck = el("", "deck", "stage");

  // ── 左：卡 + 便利贴（一个组，整体推拉）
  const pile = el("", "", deck, "position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0");
  pile.style.visibility = "visible";
  // pcard：卡和便利贴一起缩放，比例和风格样张一致
  const pcard = el("", "", pile, "position:absolute;left:230px;top:198px;width:1240px;height:640px;transform-origin:0 0");
  pcard.style.visibility = "visible";
  pcard.style.transform = "scale(0.63)";
  const C = card({ parent: pcard });
  const notes = NOTES.map((p) => note(p, pcard));

  // ── 右：这一年发生了什么
  const RX = 1180, RY = 250;
  const mk = (html) => el(html, "", deck,
    `left:${RX}px;top:${RY}px;width:620px;border-radius:14px;background:#FFFDF8;border:2px solid #A8977F;
     padding:36px 40px;box-shadow:0 30px 60px -30px rgba(74,58,40,.5)`);
  const bk07 = mk(`<div style="font:700 56px 'NotoSerifSC';color:#2B2622">《为何家会伤人》</div>
     <div style="font:500 30px 'NotoSC';color:#6B6157;margin-top:14px">2007 · 一本畅销书</div>`);
  const bk08 = mk(`<div style="font:700 52px 'NotoSerifSC';color:#2B2622">「父母皆祸害」</div>
     <div style="font:500 30px 'NotoSC';color:#6B6157;margin-top:14px">2008 · 一个网上小组</div>`);
  const bk19 = mk(`<div style="font:700 56px 'NotoSerifSC';color:#2B2622">《都挺好》</div>
     <div style="font:500 30px 'NotoSC';color:#6B6157;margin-top:14px">2019 · 一部电视剧</div>`);

  // 2018：英文书名（字母会散开）→ 中文书名
  const enCard = el(`<div class="t"></div><small>1989</small>`, "", deck,
    `left:${RX}px;top:170px;width:620px;height:150px;border-radius:14px;background:#FFFDF8;border:2px solid #A8977F;
     box-shadow:0 30px 60px -30px rgba(74,58,40,.5)`);
  const enT = enCard.querySelector(".t");
  enT.style.cssText = `position:absolute;left:44px;top:24px;font:italic 700 68px "NotoSerifSC";white-space:nowrap`;
  enT.innerHTML = [...EN].map((c) => `<span style="display:inline-block">${c === " " ? "&nbsp;" : c}</span>`).join("");
  const enSpans = [...enT.querySelectorAll("span")];
  enSpans.forEach((sp) => { sp.setAttribute("data-layout-allow-overlap", ""); sp.setAttribute("data-layout-allow-overflow", ""); });
  enCard.querySelector("small").style.cssText =
    `position:absolute;left:46px;bottom:10px;font:500 26px "NotoSC";color:#6B6157`;

  const eq = el("=", "", deck, `left:${RX + 280}px;top:336px;font:800 96px/1 "NotoSC";color:#A84C00`);
  const zhCard = el(`<div class="t">《原生家庭》</div>`, "", deck,
    `left:${RX}px;top:460px;width:620px;height:180px;border-radius:14px;background:#FFFDF8;border:2px solid #A84C00`);
  zhCard.querySelector(".t").style.cssText =
    `position:absolute;left:0;right:0;top:32px;text-align:center;font:800 92px "NotoSerifSC";letter-spacing:.04em`;

  // ── 底：时间线
  const line = el("", "", deck, "left:110px;top:800px;width:1700px;height:4px;border-radius:2px;background:#A8977F");
  const done = el("", "", deck, "left:110px;top:800px;height:4px;width:0;background:#A84C00;border-radius:2px");
  const ticks = YEARS.map((Y) => el("", "", deck,
    `left:${Y.x - 12}px;top:790px;width:24px;height:24px;border-radius:50%;background:#FFFDF8;border:4px solid #A8977F`));
  const years = YEARS.map((Y) => el(Y.y, "year", deck, `left:${Y.x}px;top:700px`));
  const lbls = YEARS.map((Y) => el(Y.lbl, "lbl", deck, `left:${Y.x}px;top:838px;font-size:32px`));
  years.forEach((e) => (e.style.transform = "translateX(-50%)"));
  lbls.forEach((e) => (e.style.transform = "translateX(-50%)"));

  const hot = el("热", "", deck,
    `left:1600px;top:618px;width:74px;height:74px;margin-left:-37px;border-radius:50%;background:#A84C00;color:#FFF7EA;
     display:flex;align-items:center;justify-content:center;font:800 40px "NotoSerifSC";
     box-shadow:0 0 0 10px rgba(242,180,90,.3)`);

  // ── 43.38 的裂痕（画在卡上，跟着 pile 走）
  const crack = el(`<svg width="1240" height="640" viewBox="0 0 1240 640">
      <path class="m" d="M560 0 L524 114 L598 210 L506 314 L586 422 L512 530 L568 640" fill="none"
        stroke="#4A3F38" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
      <path class="s" d="M524 114 L398 164 M598 210 L734 248 M506 314 L376 374 M586 422 L718 470" fill="none"
        stroke="#4A3F38" stroke-width="6" stroke-linecap="round" opacity=".75"/>
    </svg>`, "", pcard, "position:absolute;left:0;top:0");
  const ck1 = crack.querySelector(".m"), ck2 = crack.querySelector(".s");
  for (const p of [ck1, ck2]) { const L = p.getTotalLength?.() || 1500; p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.dataset.len = L; }

  function state(t) {
    const live = t >= 28.3 && t < 46.2;
    deck.style.display = live ? "block" : "none";
    if (!live) return;

    const o = win(t, 28.6, 45.2, 0.6, 0.9);
    deck.style.opacity = o.toFixed(3);
    const shake = pulse(t, 43.38, 0.34);
    const away = ease(ramp(t, 45.0, 1.1));
    deck.style.filter = away > 0.02 ? `blur(${(away * 9).toFixed(1)}px)` : "";
    deck.style.transform = `translate(${(shake * 9).toFixed(2)}px, ${(shake * -5).toFixed(2)}px) scale(${lerp(1, 0.9, away)})`;

    // pile：38.34 起推到画面中间、放大
    const pk = ease(clamp((t - 40.3) / 1.2));
    const ps = lerp(1, 1.1, pk), px = lerp(0, 316, pk), py = lerp(0, 24, pk);
    pile.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) scale(${ps.toFixed(4)})`;
    C.set(620, 320, 1, 0, 1);

    // 时间线
    const dk = ease(clamp((t - 28.49) / 1.0));
    show(line, 1, "");
    line.style.width = `${(1700 * dk).toFixed(0)}px`;
    const prog = track([[0, 0], [29.83, 0], [31.95, (700 - 110) / 1700], [33.68, (1180 - 110) / 1700], [38.34, (1600 - 110) / 1700]])(t);
    show(done, 1, "");
    done.style.width = `${(1700 * prog).toFixed(0)}px`;

    YEARS.forEach((Y, i) => {
      const on = t >= Y.t, cur = t >= Y.t && t < (YEARS[i + 1]?.t ?? 99);
      const k = ease(clamp((t - Y.t) / 0.5));
      show(years[i], on ? 1 : win(t, Y.t - 1.6, Y.t, 0.5, 0.01) * 0.45,
        `translateX(-50%) translateY(${lerp(16, cur ? -24 : 0, k)}px) scale(${lerp(0.8, cur ? 1.42 : 1, k)})`);
      years[i].style.color = cur ? "#A84C00" : "#6B6157";
      ticks[i].style.background = on ? "#A84C00" : "#FFFDF8";
      ticks[i].style.borderColor = on ? "#A84C00" : "#A8977F";
      ticks[i].style.boxShadow = cur ? "0 0 0 10px rgba(242,180,90,.35)" : "none";
      show(ticks[i], 1, "");
      show(lbls[i], win(t, Y.t, Y.t + 3.0, 0.4, 0.6), "translateX(-50%)");
    });

    // 右侧：这一年发生了什么
    const rise = (e, t0, t1) => {
      const oo = win(t, t0, t1, 0.45, 0.55);
      show(e, oo, `translateY(${lerp(44, 0, ease(ramp(t, t0, 0.6)))}px) scale(${lerp(0.94, 1, ease(ramp(t, t0, 0.6)))})`);
    };
    rise(bk07, 29.95, 31.8);
    rise(bk08, 32.05, 33.5);
    rise(bk19, 38.5, 40.2);

    // 2018：英文 → 散开 → 中文
    show(enCard, win(t, 33.68, 37.9, 0.45, 0.7), `translateY(${lerp(40, 0, ease(ramp(t, 33.68, 0.6)))}px)`);
    const sc = ease(clamp((t - 34.6) / 1.1));
    enSpans.forEach((sp, i) => {
      const w = i / (enSpans.length - 1);
      const d = sc * w;
      sp.style.transform = `translate(${(d * 150).toFixed(1)}px, ${(Math.sin(i * 1.7) * 52 * d).toFixed(1)}px) rotate(${(Math.sin(i * 2.3) * 50 * d).toFixed(1)}deg)`;
      sp.style.opacity = (1 - d * 0.92).toFixed(3);
    });
    show(eq, win(t, 34.9, 37.9, 0.4, 0.7), `scale(${lerp(0.6, 1, ease(ramp(t, 34.9, 0.5)))})`);
    const zo = win(t, 35.1, 37.9, 0.5, 0.7);
    const glow = pulse(t, 36.21, 1.4);
    show(zhCard, zo, `translateY(${lerp(50, 0, ease(ramp(t, 35.1, 0.7)))}px) scale(${lerp(0.9, 1, ease(ramp(t, 35.1, 0.7))) * lerp(1, 1.04, glow)})`);
    zhCard.style.boxShadow =
      `0 0 0 ${(10 + glow * 10).toFixed(0)}px rgba(242,180,90,${(0.25 + glow * 0.2).toFixed(2)}), 0 0 ${(80 + glow * 70).toFixed(0)}px 20px rgba(242,180,90,${(0.45 + glow * 0.3).toFixed(2)}), 0 30px 60px -30px rgba(74,58,40,.5)`;

    show(hot, win(t, 38.5, 43.0, 0.4, 0.8),
      `translateY(${lerp(30, 0, easeOut(clamp((t - 38.5) / 0.6)))}px) scale(${lerp(0.5, 1, easeOut(clamp((t - 38.5) / 0.6)))})`);

    // 便利贴
    notes.forEach((n, i) => n.slap(t, NOTES[i].t));

    // 裂痕
    const cr = ease(clamp((t - 43.38) / 0.45));
    show(crack, cr > 0 ? 1 : 0, "");
    ck1.style.strokeDashoffset = (+ck1.dataset.len * (1 - cr)).toFixed(0);
    ck2.style.strokeDashoffset = (+ck2.dataset.len * (1 - ease(clamp((t - 43.6) / 0.6)))).toFixed(0);
  }

  return { state };
}
