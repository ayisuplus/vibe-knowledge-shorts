// S0 钩子（0.57–11.21）· S1 片名（11.21–17.60）· S2 一条规则（17.60–34.62）
import * as THREE from "three";
import { clamp, ramp, ease, easeIn, easeOut, win, el, show, lerp } from "./lib.js";
import { buildSapling, buildSeed, buildDust } from "./lsys.js";

export const END = 34.62;
// 卡点（见分镜）
const T = { lit: 2.44, sink: 4.83, diag: 6.97, push: 9.09, rewind: 11.21, title: 13.35, drop: 15.48, sprout: 17.6, rule: 19.73, cards: 26.11, lung: 28.25, lind: 30.37, dive: 32.5 };
const GEN = [17.6, 20.53, 21.86, 23.19, 23.99, 25.05, 26.11];

// 机位关键帧（放映时间）。film.js 会把各段的关键帧拼成一条连续轨道
export const CAM = [
  [0, [7.0, 1.7, 20.8], [0, 1.0, 0]],
  [4.6, [4.4, 1.2, 21.6], [0.5, 0.55, 0]],
  [6.97, [2.4, 0.55, 21.2], [3.7, -0.25, 0]],
  [9.0, [1.9, 0.3, 19.2], [3.2, -0.6, 0]],
  [11.1, [0.9, 0.5, 14.0], [0.5, -0.4, 0]],
  [12.9, [0, 2.0, 9.0], [0, 1.45, 0]],
  [15.4, [0, 1.95, 8.4], [0, 1.4, 0]],
  [16.6, [0, 0.85, 6.6], [0, 0.32, 0]],
  [17.6, [0.35, 0.72, 5.6], [0, 0.5, 0]],
  [19.7, [0.5, 0.95, 5.4], [-0.35, 0.85, 0]],
  [23.2, [1.1, 1.45, 6.4], [-0.5, 1.2, 0]],
  [26.1, [1.8, 1.75, 7.3], [-0.2, 1.45, 0]],
  [30.4, [-0.4, 1.8, 7.6], [0, 1.5, 0]],
  [32.6, [-0.7, 1.3, 8.1], [0, 0.7, 0]],
  [34.62, [0.2, -0.45, 8.4], [0, -1.15, 0]],
];

export function build(W) {
  const S = W.scene;
  const sap = buildSapling({ times: GEN });
  S.add(sap.group);
  const seed = buildSeed();
  S.add(seed);
  const dust = buildDust();
  S.add(dust.mesh);

  // ---------- HUD ----------
  const diag = el(cstreeSVG(), "diag");
  const title = el(`一棵树，<br>长出整个计算机世界`, "title");
  const rule = el(`<div class="rule-row"><span>一根枝</span>${forkSVG()}<span>分出两根</span></div><div class="rule-n">×<b>0</b></div>`, "rulecard");
  const ruleN = rule.querySelector("b");
  const cards = [
    el(`<img src="assets/img/river.jpg"><span>河流</span>`, "photo", "left:120px;top:150px;"),
    el(`<img src="assets/img/lightning.jpg"><span>闪电</span>`, "photo", "left:1320px;top:150px;"),
    el(`<img src="assets/img/bronchi.jpg"><span>支气管</span><i class="n23">23</i>`, "photo", "left:120px;top:540px;"),
  ];
  const n23 = cards[2].querySelector(".n23");
  const lines = [...diag.querySelectorAll("line")], dots = [...diag.querySelectorAll("circle")];

  function state(t) {
    // ---------- 主树 ----------
    let grow = 1, rootGrow = 1, lit = 0, leaf = 1;
    lit = ease(ramp(t, T.lit, 1.5));
    if (t >= T.rewind) {
      const r = ease(ramp(t, T.rewind + 0.15, 1.75));
      grow = 1 - r; rootGrow = 1 - ease(ramp(t, T.rewind + 0.05, 1.6)); lit = 1 - ease(ramp(t, T.rewind, 1.0));
    }
    if (t >= T.sprout) { grow = 0; leaf = 0; lit = 0; rootGrow = lerp(0.04, 0.3, ease(ramp(t, T.sprout, END - T.sprout))); }

    // ---------- 种子 ----------
    const up = easeOut(ramp(t, 12.75, 0.75)), fall = easeIn(ramp(t, T.drop + 0.12, 0.62));
    const seedOn = t > 12.7 && t < T.drop + 0.8;
    seed.visible = seedOn;
    if (seedOn) {
      const y = lerp(0.05, 1.75, up) + Math.sin(t * 2.1) * 0.035 * up * (1 - fall) - fall * 1.88;
      seed.position.set(0, y, 0);
      seed.rotation.set(0.25, t * 0.9, 0.18 + fall * 1.2);
      const s = ease(ramp(t, 12.7, 0.3));
      seed.scale.set(0.085 * s, 0.16 * s, 0.085 * s);
    }
    dust.update(t - (T.drop + 0.74));

    // ---------- 小树（S2） ----------
    sap.group.visible = t > T.sprout - 0.05 && t < 101.4; // 101.4 镜头在土层下沿往上看，看不到地面，这时换成主树
    if (sap.group.visible) sap.update(t, { leaf: ease(ramp(t, T.lind, 1.3)), scale: lerp(1, 1.18, ease(ramp(t, T.lind, 2.6))) });

    // ---------- HUD ----------
    // S0：计算机树的示意图，在根系右边画出来
    const dO = win(t, T.diag, T.push + 0.3, 0.3, 0.5);
    show(diag, dO);
    if (dO > 0) {
      const k = ramp(t, T.diag, 1.4);
      lines.forEach((l) => { const lv = +l.dataset.lv; const f = ease(clamp(k * 4 - lv)); l.style.strokeDashoffset = (1 - f) * 200; });
      dots.forEach((c) => { const lv = +c.dataset.lv; const f = easeOut(clamp(k * 4 - lv + 0.6)); c.setAttribute("r", (c.dataset.r * f).toFixed(2)); });
    }
    // S1 片名
    show(title, win(t, T.title, T.drop, 0.5, 0.45), `translateY(${(1 - easeOut(ramp(t, T.title, 0.8))) * 24}px)`);
    // S2 规则卡
    const rO = win(t, T.rule, T.cards - 0.15, 0.35, 0.35);
    show(rule, rO);
    let G = 0;
    for (let g = 1; g < GEN.length; g++) if (t >= GEN[g]) G = g;
    ruleN.textContent = G;
    rule.querySelector(".rule-n").style.transform = `scale(${1 + 0.25 * (1 - ease(ramp(t, GEN[G], 0.3))) * (G > 0)})`;
    // 三张自然界的分叉
    cards.forEach((c, i) => {
      const tin = T.cards + i * 0.53;
      const o = win(t, tin, T.lind - 0.1 + i * 0.08, 0.4, 0.45);
      let tr = `translateY(${(1 - easeOut(ramp(t, tin, 0.6))) * 30}px)`;
      if (i === 2) { const z = ease(ramp(t, T.lung, 0.7)) * (1 - ease(ramp(t, T.lind - 0.1, 0.45))); tr += ` translate(${z * 330}px, ${-z * 170}px) scale(${1 + z * 0.45})`; }
      else { const dim = ease(ramp(t, T.lung, 0.5)); c.style.filter = `saturate(${1 - dim * 0.5})`; tr += ` scale(${1 - dim * 0.12})`; }
      show(c, o * (i < 2 ? 1 - 0.55 * ease(ramp(t, T.lung, 0.5)) : 1), tr);
    });
    show(n23, ease(ramp(t, T.lung + 0.4, 0.4)), `scale(${0.6 + 0.4 * easeOut(ramp(t, T.lung + 0.4, 0.5))})`);

    return { grow, rootGrow, lit, leaf };
  }
  return { state };
}

// 平面的"计算机树"：根在最上面，4 层
function cstreeSVG() {
  const W = 560, H = 380, pts = [];
  for (let lv = 0; lv < 4; lv++) {
    const n = 2 ** lv;
    for (let i = 0; i < n; i++) pts.push({ lv, i, x: ((i + 0.5) / n) * W, y: 30 + lv * 105 });
  }
  const at = (lv, i) => pts.find((p) => p.lv === lv && p.i === i);
  let s = `<svg width="${W}" height="${H + 20}" viewBox="0 0 ${W} ${H + 20}">`;
  for (const p of pts) if (p.lv > 0) { const q = at(p.lv - 1, p.i >> 1); s += `<line data-lv="${p.lv - 1}" x1="${q.x}" y1="${q.y}" x2="${p.x}" y2="${p.y}" pathLength="200" stroke-dasharray="200" stroke-dashoffset="200"/>`; }
  for (const p of pts) s += `<circle data-lv="${p.lv}" data-r="${p.lv === 0 ? 17 : 13 - p.lv}" cx="${p.x}" cy="${p.y}" r="0" class="${p.lv === 0 ? "root" : ""}"/>`;
  return s + "</svg>";
}
function forkSVG() {
  return `<svg width="70" height="56" viewBox="0 0 70 56"><path d="M35 54 L35 30 M35 30 L14 6 M35 30 L56 6" fill="none" stroke="#8a5a3b" stroke-width="6" stroke-linecap="round"/></svg>`;
}
