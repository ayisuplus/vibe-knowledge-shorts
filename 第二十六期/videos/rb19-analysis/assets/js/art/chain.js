// 链条图：悬架稳 → 车底稳 → 梁翼小 → DRS 强（四环都是技术记者的分析，注释带标明）。
// S5 末扣上前两环、S6 末扣上后两环（画面右侧竖排）；S7 横排到中央、依次亮，被罚那一下有一环被压得一沉；之后胜率数字牌。
import { show } from "./svg.js";
import { definePlates } from "../overlay.js";
import { clamp, mix, ease, easeOut, clunk } from "../lib.js";
import { RINGS, CHAIN_LIT, PENALTY, RECORD, MECH6 } from "../timeline.js";

const NAMES = ["悬架稳", "车底稳", "梁翼小", "DRS 强"];
const box = document.createElement("div"); box.className = "chain"; document.getElementById("art").append(box);
// 连接件先建，画在环的下面
const links = [0, 1, 2].map(() => { const e = document.createElement("div"); e.className = "link"; box.append(e); return e; });
const rings = NAMES.map((n) => { const e = document.createElement("div"); e.className = "ring"; e.textContent = n; box.append(e); return e; });

// 两种排布：竖排在右侧（S5、S6），横排在中央（S7）
const COL = (i) => [1660, 250 + i * 118, .8];
const ROW = (i, y) => [960 + (i - 1.5) * 380, y, 1.12];
const vis = (t) => (t >= RINGS[0] - .3 && t < 125.2) || (t >= MECH6[1] - .1 && t < 175.2);

export function chainState(t) {
  show(box, vis(t) ? 1 : 0); if (!vis(t)) return;
  const toRow = ease((t - 155.0) / .8), y = mix(470, 330, ease((t - RECORD) / .6));
  const pos = rings.map((_, i) => { const a = COL(i), b = ROW(i, y); return [mix(a[0], b[0], toRow), mix(a[1], b[1], toRow), mix(a[2], b[2], toRow)]; });
  rings.forEach((e, i) => {
    const on = t >= RINGS[i] - .25;
    const pop = on ? clunk(t, RINGS[i] - .25, .25) : 0;
    const lit = Math.max(0, ...CHAIN_LIT.filter((_, j) => j === i).map((h) => Math.exp(-Math.max(0, t - h) * 3) * (t >= h ? 1 : 0)));
    const sink = i === 1 ? (t >= PENALTY ? Math.sin(Math.min(1, (t - PENALTY) / .9) * Math.PI) * Math.exp(-(t - PENALTY) * 1.5) * 40 : 0) : 0;
    const [x, yy, s] = pos[i];
    show(e, clamp(pop));
    e.style.transform = `translate(-50%,-50%) translate(${x.toFixed(1)}px,${(yy + sink + Math.sin(t * 1.3 + i) * mix(5, 3, toRow)).toFixed(1)}px) scale(${(s * (.6 + .4 * clamp(pop, 0, 1.2)) * (1 + .12 * lit)).toFixed(3)})`;
    e.classList.toggle("lit", lit > .3 || (t > CHAIN_LIT[3] + .6 && t < PENALTY));
  });
  links.forEach((e, i) => {
    const on = Math.min(clamp((t - RINGS[i] - .1) / .2), clamp((t - RINGS[i + 1] + .1) / .2));
    const [x1, y1] = pos[i], [x2, y2] = pos[i + 1];
    show(e, on); e.style.transform = `translate(${((x1 + x2) / 2).toFixed(1)}px,${((y1 + y2) / 2).toFixed(1)}px) translate(-50%,-50%) rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI).toFixed(1)}deg)`;
  });
}

// ── S7 数字牌 ──
const roll = (t, a, v, d = 2) => (v * easeOut((t - a) / .9)).toFixed(d);
definePlates([
  { id: "pen", a: PENALTY, b: 166.4, x: 960, y: 690, cls: "warn", html: '<div class="big">风洞＋CFD <span class="red">−10%</span></div><div class="sub">2023 年因超支被罚 · 空气动力测试时间</div>' },
  { id: "rec", a: RECORD, b: 174.9, x: 960, y: 640, cls: "pair", html: '<div class="col hi"><div class="big">95.45%</div><div class="sub">RB19 · 2023 · 22 赢 21</div></div><div class="col"><div class="big">93.75%</div><div class="sub">MP4/4 · 1988 · 16 赢 15</div></div>',
    update(e, t) { const b = e.querySelectorAll(".big"); b[0].textContent = roll(t, RECORD, 95.45) + "%"; b[1].textContent = roll(t, RECORD + .3, 93.75) + "%"; } },
]);
