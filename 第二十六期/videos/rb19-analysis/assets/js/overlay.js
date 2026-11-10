// 叠层：方格旗、奖杯、赛季条、片名、压暗、数字牌、结尾问句。DOM 元素一次建好，之后只改样式；全是 t 的纯函数。
import { clamp, mix, ease, easeOut } from "./lib.js";
import { FLAG, TROPHY, SHRINK, TO_CORNER, TITLE, PEREZ, SGP, litAt, tickAt, QUESTION } from "./timeline.js";
import { S } from "./beats.js";

const hud = document.getElementById("hud");
const el = (cls, html = "", parent = hud) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; parent.appendChild(e); return e; };
const show = (e, o) => { e.style.opacity = o.toFixed(3); e.style.visibility = o > .002 ? "visible" : "hidden"; };
const win = (t, a, b, f = .25) => clamp((t - a) / f) * (1 - clamp((t - b + f) / f));

// ── 方格旗、奖杯 ──
const flag = el("flag");
const trophy = el("trophy", `<svg viewBox="0 0 200 240" width="300" height="360"><g fill="none" stroke="#ffb454" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
  <path d="M55 30 H145 V80 C145 125 120 150 100 152 C80 150 55 125 55 80 Z"/><path d="M55 45 C20 45 20 95 60 105"/><path d="M145 45 C180 45 180 95 140 105"/>
  <path d="M100 152 V185"/><path d="M70 185 H130 L138 210 H62 Z"/></g><text x="100" y="105" text-anchor="middle" font-family="NotoSC" font-weight="900" font-size="64" fill="#ffffff">1</text></svg>`);

// ── 赛季条（2023 年 22 站，F-3） ──
const PER = new Set(PEREZ);
const bar = el("season"), cells = [];
for (let i = 1; i <= 22; i++) cells.push(el("cell", "", bar));
const barNote = el("seasonNote", '<span class="v" style="left:0">维斯塔潘 19</span><span class="p" style="left:26px;top:20px">↑ 佩雷斯 2</span><span class="g" style="left:364px">↑ 新加坡</span>', bar);
const BAR_W = 22 * 26;
function seasonState(t) {
  const o = clamp((t - SHRINK - .15) / .25); show(bar, o); if (o <= .002) return;
  const big = 1 - ease((t - TO_CORNER) / .6), s = mix(1, 3.1, big);
  const x = mix(50, 960 - BAR_W * 3.1 / 2, big), y = mix(92, 470, big);
  bar.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
  cells.forEach((c, k) => {
    const i = k + 1, l = clamp((t - litAt(i)) / .12), tk = clamp((t - tickAt(i)) / .1);
    c.className = `cell${l > .5 ? (i === SGP ? " sgp" : PER.has(i) ? " per" : " ver") : ""}${tk > .5 && i !== SGP ? " tick" : ""}`;
    c.style.transform = `scale(${(1 + .35 * Math.max(0, 1 - Math.abs(l - .5) * 2)).toFixed(3)})`;
  });
  show(barNote, clamp((t - 12.9) / .3) * big);
}

// ── 片名、结尾问句 ──
const title = el("title", '<b>RB19</b> 为什么能赢？');
const question = el("question", "下一台，你想看我们<br>拆解哪一辆？");

// ── 压暗层（最底下，不压字幕） ──
const dim = el("dim"); hud.insertBefore(dim, hud.firstChild);

// ── 数字牌 ──
const plates = {};
export function definePlates(list) { for (const p of list) plates[p.id] = { ...p, e: el(`plate ${p.cls || ""}`, p.html) }; }
function platesState(t) {
  for (const p of Object.values(plates)) {
    const o = win(t, p.a, p.b, .3); show(p.e, o); if (o <= .002) continue; if (p.update) p.update(p.e, t);
    p.e.style.left = p.x + "px"; p.e.style.top = p.y + "px"; p.e.style.transform = `translate(-50%,-50%) scale(${(.92 + .08 * easeOut((t - p.a) / .4)).toFixed(3)})`;
  }
}

export function overlayState(t) {
  // 方格旗：熄灭后一扫而过
  const f = clamp((t - FLAG) / .8); show(flag, f > 0 && f < 1 ? 1 : 0); flag.style.transform = `translateX(${mix(-130, 130, ease(f)).toFixed(1)}%) skewX(-14deg)`;
  // 奖杯：升起 → 停住微浮 → 缩成赛季条
  const up = easeOut((t - TROPHY) / .7), down = ease((t - SHRINK) / .45);
  const to = up * (1 - down); show(trophy, to);
  trophy.style.transform = `translate(-50%,-50%) translate(0px,${(mix(120, 0, up) + Math.sin(t * 2.2) * 6 - down * 40).toFixed(1)}px) scale(${mix(.85, 1, up) * mix(1, .25, down)})`;
  seasonState(t);
  const ti = win(t, TITLE, S.S1[1] - .1, .35); show(title, ti); title.style.transform = `translate(-50%,-50%) scale(${(.94 + .06 * easeOut((t - TITLE) / .5) + .02 * clamp((t - TITLE) / 3)).toFixed(4)})`;
  show(dim, 0);
  const q = clamp((t - QUESTION) / .5); show(question, q); question.style.transform = `translate(-50%,-50%) scale(${(.96 + .04 * q).toFixed(3)})`;
  platesState(t);
}
