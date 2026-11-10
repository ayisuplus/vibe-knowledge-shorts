// S0 钩子（0.06–10.69）+ S1 片名（10.69–17.05）+ S2 倒带·原意（17.05–29.83）
// 这三段共用同一张词条卡和同一批便利贴，所以放在一个模块里。
import { el, show, clamp, lerp, ease, easeOut, easeIn, ramp, win, track } from "./lib.js";
import { card, note, CARD } from "./deck.js";

// 便利贴：位置照风格样张 A。按拍上去的先后排好
const NOTES = [
  { t: 0.06, x: 330, y: 110, rot: -5, c: "n1", text: "都怪我<br>原生家庭" },
  { t: 1.13, x: 1290, y: 120, rot: 5, c: "n3", text: "我这样，<br>是因为<br>原生家庭" },
  { t: 2.45, x: 150, y: 360, rot: -9, c: "n4", text: "他原生家庭<br>不好，别嫁" },
  { t: 2.45, x: 430, y: 560, rot: 4, c: "n3", w: 400, text: "我拖延，都是<br>原生家庭害的" },
  { t: 2.45, x: 870, y: 610, rot: -3, c: "n2", w: 300, fs: 46, text: "原生家庭<br>有毒" },
  { t: 4.32, x: 1240, y: 600, rot: 6, c: "n1", w: 300, fs: 46, text: "断了就好" },
  { t: 6.43, x: 1500, y: 330, rot: 12, c: "n2", text: "我不自信，<br>也是<br>原生家庭" },
];

export function build() {
  const deck = el("", "deck", "stage");

  const C = card({ parent: deck });
  C.set();
  const notes = NOTES.map((p) => note(p, deck));

  // 第二张卡：新生家庭（S2 21.33 起）
  const C2 = card({ parent: deck, word: "新生家庭", py: "xīnshēng jiātíng",
    en: "family of formation", def: "你自己建的那个家" });
  C2.set(0, 0, 1, 0, 0);

  // 两张卡之间的虚线小路 + 光点 + 标签
  const path = el(`<svg width="520" height="120" viewBox="0 0 520 120">
      <path id="pp" d="M10 86 C 150 18, 370 18, 510 86" fill="none" stroke="#A8977F" stroke-width="5"
        stroke-linecap="round" stroke-dasharray="3 22"/></svg>`, "", deck, "left:700px;top:742px");
  const dot = el("", "", deck, "width:26px;height:26px;border-radius:50%;background:#F2B45A;box-shadow:0 0 26px 10px rgba(242,180,90,.55)");
  const lblA = el("来的地方", "lbl", deck, "left:360px;top:742px;font-size:38px");
  const lblB = el("建的地方", "lbl", deck, "left:1420px;top:742px;font-size:38px");

  // 释义行的金色扫光（19.20）
  const sweep = el("", "", deck, "left:556px;top:686px;width:0;height:62px;border-radius:8px;background:linear-gradient(90deg, rgba(242,180,90,.55), rgba(251,227,176,.15));mix-blend-mode:multiply");

  // 片名卡（S1）
  const TITLE = "原生家庭，本来不是一个坏词";
  const tcard = el(`<div class="series">被曲解的词语 · 01</div><div class="tt"></div>`, "tcard", "stage",
    "width:1300px;height:470px;left:310px;top:300px");
  const tt = tcard.querySelector(".tt");

  // S2 25.58 居民楼照片 + 四张小卡
  const photo = el(`<img src="assets/img/p1-residential-dusk.jpg" style="width:100%;display:block">`, "", "stage",
    "left:0;top:0;width:1920px;height:1080px;overflow:hidden");
  photo.firstChild.style.cssText += "height:1080px;object-fit:cover;filter:saturate(.95)";
  const winCards = [[770, 215], [1010, 330], [815, 480], [1125, 565]].map(([x, y]) =>
    el(`<b>原生家庭</b>`, "", "stage",
      `left:${x}px;top:${y}px;width:312px;height:138px;border-radius:12px;background:#FFFDF8;border:2px solid #A8977F;
       box-shadow:0 24px 48px -20px rgba(74,58,40,.65);display:flex;align-items:center;justify-content:center;
       font:700 52px "NotoSerifSC";color:#2B2622`));

  // 摄影机：8.57 冲进缝隙 → 10.69 穿过去
  const camS = track([[0, 1], [8.57, 1], [10.69, 2.9], [12.2, 2.9], [14.94, 1], [29.9, 1]]);
  const camY = track([[0, 0], [8.57, 0], [10.69, -120], [12.2, -120], [14.94, 0], [29.9, 0]]);

  function state(t) {
    const live = t < 29.9;
    deck.style.display = live ? "block" : "none";
    tcard.style.display = live ? "block" : "none";
    photo.style.display = live ? "block" : "none";
    winCards.forEach((e) => (e.style.display = live ? "flex" : "none"));
    if (!live) return;

    // ── 摄影机 + 整体淡出（穿过缝隙那一下）
    const s = camS(t), dy = camY(t);
    let deckO, blur = 0;
    if (t < 10.0) {                      // 钩子：正常
      deckO = 1;
      blur = t > 9.6 ? ease(ramp(t, 9.6, 1.0)) * 8 : 0;
    } else if (t < 14.3) {               // 穿过缝隙，暂时退场给片名
      deckO = 1 - ease(ramp(t, 10.0, 0.7));
      blur = 8;
    } else {                             // 片名收小，墙虚化着回来，17.05 清晰
      deckO = ease(ramp(t, 14.4, 0.9));
      blur = lerp(7, 0, ease(ramp(t, 16.2, 1.0)));
    }
    deck.style.opacity = deckO.toFixed(3);
    deck.style.filter = blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : "";
    const sway = Math.sin(t * 0.9) * 0.5;
    deck.style.transform = `translate(0px, ${dy}px) scale(${s.toFixed(4)}) rotate(${sway.toFixed(3)}deg)`;
    deck.style.transformOrigin = "50% 34%"; // 冲向「原生家庭」四个字所在的缝

    // ── 词条卡：S2 21.33 起滑到左边
    const cx = track([[0, 960], [21.33, 960], [22.7, 520], [27.7, 520]])(t);
    const cs = track([[0, 1], [21.33, 1], [22.7, 0.72], [27.7, 0.72]])(t);
    const cardO = 1 - ease(ramp(t, 25.62, 1.0)); // 照片升起来，两张卡退场
    C.set(cx, 500, cs, 0, cardO);

    // 第二张卡
    const o2 = win(t, 22.3, 25.62, 0.6, 1.0);
    C2.set(1400, 500, lerp(0.58, 0.72, ease(ramp(t, 22.3, 0.9))), 0, o2);

    // 小路、光点、标签
    const pathO = win(t, 23.0, 25.5, 0.5, 0.8);
    show(path, pathO, `translate(0px,0px) scale(1)`);
    const dk = ease(clamp((t - 23.8) / 1.9));
    show(dot, pathO * (t > 23.7 ? 1 : 0), `translate(${lerp(712, 1206, dk)}px, ${lerp(820, 820, dk) - 38 * Math.sin(Math.PI * dk)}px)`);
    show(lblA, win(t, 23.6, 25.5, 0.45, 0.8));
    show(lblB, win(t, 24.1, 25.5, 0.45, 0.8));

    // 释义扫光
    const sw = ease(clamp((t - 19.2) / 1.1));
    const swO = win(t, 19.2, 21.2, 0.2, 0.5);
    show(sweep, swO * 0.9, "");
    sweep.style.width = `${(720 * sw).toFixed(0)}px`;

    // ── 便利贴
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (t < 17.05) { n.slap(t, NOTES[i].t); continue; }
      // 17.05 倒带：按贴上去的反顺序飞走，很快
      const t0 = 17.05 + (notes.length - 1 - i) * 0.22;
      const dir = [(NOTES[i].x - 860) * 2.2, (NOTES[i].y - 420) * 2.4 - 240];
      const k = clamp((t - t0) / 0.75);
      if (k <= 0) { n.set(); continue; }
      const f = easeIn(k);
      show(n.e, 1 - ease(clamp((k - 0.35) / 0.65)),
        `translate(${NOTES[i].x + dir[0] * f}px, ${NOTES[i].y + dir[1] * f}px) scale(${1 - 0.25 * f}) rotate(${NOTES[i].rot + 34 * f}deg)`);
      n.e.style.filter = f > 0.15 ? `blur(${(f * 7).toFixed(1)}px)` : "";
    }

    // ── S1 片名
    const tO = win(t, 10.75, 17.05, 0.55, 0.45);
    const shrink = ease(clamp((t - 14.94) / 1.2));
    const ts = lerp(1, 0.56, shrink), ty = lerp(0, -232, shrink);
    show(tcard, tO, `translate(0px, ${ty}px) scale(${ts})`);
    tcard.style.transformOrigin = "50% 24%";
    const typed = Math.floor(clamp((t - 11.3) / 2.4) * TITLE.length + 0.001);
    const caret = t > 11.2 && t < 14.0 && Math.sin(t * 9) > 0 ? '<i style="opacity:.5">|</i>' : "";
    tt.innerHTML = TITLE.slice(0, typed) + caret;

    // ── S2 25.58 居民楼 + 四张小卡
    const pO = win(t, 25.58, 29.0, 0.7, 0.8);
    const pk = ease(ramp(t, 25.58, 4.0));
    show(photo, pO, `scale(${lerp(1.1, 1.02, pk)})`);
    photo.style.transformOrigin = "50% 60%";
    winCards.forEach((e, i) => {
      const o = win(t, 26.0 + i * 0.16, 29.2, 0.5, 0.55);
      const k = ease(clamp((t - (26.0 + i * 0.16)) / 1.5));
      const mg = ease(clamp((t - 27.70) / 1.3)); // 27.70 四张合到中间
      const sx = [770, 1010, 815, 1125][i], sy = [215, 330, 480, 565][i];
      const fx = lerp(sx, 804, mg), fy = lerp(sy - 56 * k, 430, mg);
      // 合并时只留中间那张，其余淡掉，免得四张同样的卡叠在一起
      const keep = i === 1 ? 1 : 1 - ease(clamp((t - 27.9) / 0.7));
      show(e, o * keep, `translate(${fx - sx}px, ${fy - sy}px) scale(${lerp(0.8, 1, k) * lerp(1, 1.25, mg)})`);
    });
  }

  return { state };
}
