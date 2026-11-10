// S6 撕掉便利贴（69.42–87.21）：撕 → 分化 → 卡片翻过来是父母年轻时的照片 → 一条往回排的路
import { el, show, clamp, lerp, ease, easeOut, easeIn, ramp, win, track } from "./lib.js";
import { card, note, CARD } from "./deck.js";

// 按撕下来的先后排好
const NOTES = [
  { t: 69.42, x: 1340, y: 150, rot: 7, c: "n2", w: 300, fs: 46, text: "注定", dir: [420, -620], spin: 30 },
  { t: 70.22, x: 250, y: 120, rot: -6, c: "n1", w: 320, fs: 46, text: "家会伤人", dir: [-480, -560], spin: -28 },
  { t: 70.9, x: 1420, y: 560, rot: 5, c: "n3", w: 260, fs: 46, text: "祸害", dir: [520, -420], spin: 24 },
  { t: 72.34, x: 230, y: 560, rot: 4, c: "n4", w: 330, fs: 46, text: "都怪他们", dir: [-520, -400], spin: -30 },
  { t: 74.47, x: 1360, y: 330, rot: -4, c: "n1", w: 320, fs: 46, text: "断了就好", dir: [560, -300], spin: 26 },
  { t: 76.59, x: 520, y: 150, rot: -11, c: "n2", w: 300, fs: 60, text: "有毒", dir: [-300, -700], spin: -34 },
  { t: 76.75, x: 860, y: 620, rot: 6, c: "n3", w: 320, fs: 46, text: "不幸", dir: [120, -760], spin: 20 },
];

export function build() {
  const deck = el("", "deck", "stage");

  // 翻转组：正面词条卡，背面老照片
  const flip = el("", "", deck,
    `position:absolute;left:${960 - CARD.w / 2}px;top:${500 - CARD.h / 2}px;width:${CARD.w}px;height:${CARD.h}px;transform-style:preserve-3d`);
  const C = card({ parent: flip });
  C.e.style.cssText += "left:0;top:0;position:absolute";
  C.set(CARD.w / 2, CARD.h / 2, 1, 0, 1);
  const back = el(`<img src="assets/img/p4-young-parents-1990s.jpg">`, "print", flip,
    `position:absolute;left:70px;top:-91px;width:1100px;transform:rotateY(180deg);backface-visibility:hidden`);
  back.firstChild.style.cssText = "display:block;width:100%;filter:sepia(.12) contrast(1.02)";
  back.style.visibility = "visible";

  const notes = NOTES.map((p) => note(p, deck));

  // 分化：两个圆 + 一根拉不断的金线
  const dif = el(`<svg width="900" height="260" viewBox="0 0 900 260">
      <path class="ln" d="M190 130 C 380 130, 520 130, 710 130" fill="none" stroke="#F2B45A" stroke-width="7" stroke-linecap="round"/>
      <circle class="c1" cx="190" cy="130" r="66" fill="#FFFDF8" stroke="#A8977F" stroke-width="5"/>
      <circle class="c2" cx="710" cy="130" r="66" fill="#FFFDF8" stroke="#A8977F" stroke-width="5"/>
    </svg>`, "", deck, "left:510px;top:704px");
  const dLn = dif.querySelector(".ln"), dC1 = dif.querySelector(".c1"), dC2 = dif.querySelector(".c2");
  const difLbl = el("还连着，但你是你", "lbl", deck,
    "left:0;right:0;top:962px;text-align:center;font-size:42px;font-weight:700;color:#A84C00");
  const era = el("1950s · 家庭治疗", "lbl", deck, "left:150px;top:150px;font-size:36px");

  // 82.70 黑白照片
  const bw = el(`<img src="assets/img/p5-grandparents-1960s.jpg">`, "print", deck,
    "left:1150px;top:230px;width:700px");
  bw.firstChild.style.cssText = "display:block;width:100%";

  // 85.34 往远处排开的照片轮廓（一条亮着的路）
  const ghosts = Array.from({ length: 5 }, (_, i) =>
    el("", "", deck, `left:${960 - 300 + i * 10}px;top:${440 - i * 6}px;width:600px;height:400px;border-radius:8px;
      border:3px solid rgba(168,151,127,${(0.5 - i * 0.08).toFixed(2)});background:rgba(255,253,248,${(0.5 - i * 0.09).toFixed(2)})`));

  function state(t) {
    const live = t >= 69.0 && t < 87.6;
    deck.style.display = live ? "block" : "none";
    if (!live) return;
    deck.style.opacity = win(t, 69.42, 87.0, 0.6, 0.55).toFixed(3);

    // 镜头：78.45 翻面后慢慢推近，85.34 往后拉
    const camS = track([[69, 1], [72.3, 1], [73.4, 0.92], [76.5, 0.92], [77.6, 1], [78.45, 1], [80.84, 1.1], [82.7, 1.06], [85.34, 0.92], [87.5, 0.74]])(t);
    const camY = track([[69, 0], [72.3, 0], [73.4, -92], [76.5, -92], [77.6, 0], [80.84, 0], [82.7, 10], [85.34, 40], [87.5, 90]])(t);
    deck.style.transform = `translateY(${camY.toFixed(1)}px) scale(${camS.toFixed(4)})`;

    // 便利贴：一张张撕下来
    notes.forEach((n, i) => {
      const p = NOTES[i];
      if (t < p.t) { n.set(); return; }
      n.peel(t, p.t, 0.95, p.dir, p.spin);
    });

    // 翻面
    const fo = ease(clamp((t - 78.45) / 1.25));
    flip.style.transform = `rotateY(${(fo * 180).toFixed(2)}deg)`;
    show(flip, 1, undefined);
    flip.style.transform = `rotateY(${(fo * 180).toFixed(2)}deg)`;

    // 分化示意
    const dO = win(t, 72.34, 76.4, 0.5, 0.6);
    const sep = ease(clamp((t - 74.47) / 1.5));                 // 两个圆分开，线拉长但不断
    show(dif, dO, "");
    dC1.setAttribute("cx", (190 - 80 * sep).toFixed(1));
    dC2.setAttribute("cx", (710 + 80 * sep).toFixed(1));
    dLn.setAttribute("d", `M${(190 - 80 * sep).toFixed(1)} 130 C ${(380 - 40 * sep).toFixed(1)} ${(130 + 26 * sep).toFixed(1)}, ${(520 + 40 * sep).toFixed(1)} ${(130 + 26 * sep).toFixed(1)}, ${(710 + 80 * sep).toFixed(1)} 130`);
    dLn.style.strokeWidth = (7 - 2.2 * sep).toFixed(2);
    show(difLbl, win(t, 74.9, 76.4, 0.45, 0.5), "");
    show(era, win(t, 70.22, 73.4, 0.45, 0.6), "");

    // 黑白照片从后面滑出来
    const bO = win(t, 82.7, 87.5, 0.6, 0.9);
    const bk = easeOut(clamp((t - 82.7) / 1.5));
    show(bw, bO, `translate(${lerp(-220, 0, bk)}px, ${lerp(60, 0, bk)}px) rotate(${lerp(0, 5, bk)}deg) scale(${lerp(0.9, 1, bk)})`);

    // 更远处的照片轮廓
    ghosts.forEach((g, i) => {
      const t0 = 85.34 + i * 0.16;
      const o = win(t, t0, 87.6, 0.5, 0.6) * (0.75 - i * 0.1);
      const k = ease(clamp((t - t0) / 1.0));
      show(g, o, `translate(${lerp(0, 150 + i * 120, k)}px, ${lerp(0, -40 - i * 26, k)}px) scale(${lerp(1, 0.78 - i * 0.07, k)}) rotate(${(3 + i * 2.2).toFixed(1)}deg)`);
    });
  }

  return { state };
}
