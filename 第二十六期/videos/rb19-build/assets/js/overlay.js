// HUD 叠层：赛季条、零件计数器、片名、奖杯与方格旗、数字牌、图例、离地间隙标尺、海豚跳轨迹、结尾问句。
// 全是 t 的纯函数；元素一次建好，之后只改样式。
import * as THREE from "three";
import { camera } from "./world.js";
import { clamp, mix, ease, easeOut } from "./lib.js";

const hud = document.getElementById("hud");
const el = (cls, html = "", parent = hud) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; parent.appendChild(e); return e; };
const show = (e, o) => { e.style.opacity = o.toFixed(3); e.style.visibility = o > .002 ? "visible" : "hidden"; };
const win = (t, a, b, f = .25) => clamp((t - a) / f) * (1 - clamp((t - b + f) / f));

// ── 赛季条（2023 年 22 站；佩雷斯赢第 2、4 站；第 15 站新加坡由塞恩斯获胜，F-3） ──
const PEREZ = new Set([2, 4]), SGP = 15;
const bar = el("season"), cells = [];
for (let i = 1; i <= 22; i++) cells.push(el("cell", "", bar));
const barNote = el("seasonNote", '<span class="v" style="left:0">维斯塔潘 19</span><span class="p" style="left:26px;top:20px">↑ 佩雷斯 2</span><span class="g" style="left:364px">↑ 新加坡</span>', bar);
/** big：0＝左上常驻，1＝画面中央放大；lit(i)→ 0/1；tick(i)→ 0/1 */
function seasonState(t, o, big, lit, tick, noteO) {
  show(bar, o); if (o <= .002) return;
  const s = mix(1, 3.1, big), x = mix(50, 960 - 22 * 26 * 3.1 / 2 / 1, big), y = mix(36, 470, big);
  bar.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
  cells.forEach((c, k) => { const i = k + 1, l = lit(i), tk = tick(i); c.className = `cell${l > .5 ? (i === SGP ? " sgp" : PEREZ.has(i) ? " per" : " ver") : ""}${tk > .5 && i !== SGP ? " tick" : ""}`; c.style.transform = `scale(${(1 + .35 * Math.max(0, 1 - Math.abs(l - .5) * 2)).toFixed(3)})`; });
  show(barNote, noteO);
}

// ── 零件计数器 ──
const counter = el("counter", '<span class="lab">零件</span><span class="num"></span>'), cNum = counter.querySelector(".num");
function counterState(t, o, n, done, bump) {
  show(counter, o); if (o <= .002) return;
  const txt = done ? "完工" : `${String(n).padStart(2, "0")} / 26`; if (cNum.textContent !== txt) cNum.textContent = txt;
  counter.classList.toggle("done", done); counter.style.transform = `scale(${(1 + .18 * bump).toFixed(3)})`;
}

// ── 片名、奖杯、方格旗、问句 ──
const title = el("title", '从零造一台 <b>RB19</b>');
const trophy = el("trophy", `<svg viewBox="0 0 200 240" width="300" height="360"><g fill="none" stroke="#ffb454" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
  <path d="M55 30 H145 V80 C145 125 120 150 100 152 C80 150 55 125 55 80 Z"/><path d="M55 45 C20 45 20 95 60 105"/><path d="M145 45 C180 45 180 95 140 105"/>
  <path d="M100 152 V185"/><path d="M70 185 H130 L138 210 H62 Z"/></g><text x="100" y="105" text-anchor="middle" font-family="NotoSC" font-weight="900" font-size="64" fill="#ffffff">1</text></svg>`);
const flag = el("flag"), dim = el("dim"); hud.insertBefore(dim, hud.firstChild); // 压暗层在最底下，不压字幕
const question = el("question", "下一台，你想看我们<br>造哪一辆？");

// ── 数字牌（画面里的大号数字） ──
const plates = {};
export function definePlates(list) { for (const p of list) plates[p.id] = { ...p, e: el(`plate ${p.cls || ""}`, p.html) }; }
function platesState(t) { for (const p of Object.values(plates)) { const o = win(t, p.a, p.b, .3); show(p.e, o); if (o > .002 && p.update) p.update(p.e, t); p.e.style.left = p.x + "px"; p.e.style.top = p.y + "px"; p.e.style.transform = `translate(-50%,-50%) scale(${(.92 + .08 * easeOut((t - p.a) / .4)).toFixed(3)})`; } }

// ── 图例 ──
const legend = el("legend", '<span class="o">● 燃油</span><span class="b">● 回收的电</span>');

// ── 离地间隙标尺：车头下方到地面，竖线＋两端短横 ──
const rulers = [0, 1].map(() => el("ruler", '<div class="tick top"></div><div class="tick bot"></div><div class="gap"></div>'));
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
const scr = (v) => { v.project(camera); return [(v.x + 1) * 960, (1 - v.y) * 540]; };
function rulerState(i, o, top, bot, color) {
  const r = rulers[i]; show(r, o); if (o <= .002) return;
  const [x1, y1] = scr(_a.copy(top)), [, y2] = scr(_b.copy(bot)), h = Math.max(2, y2 - y1);
  r.style.transform = `translate(${x1.toFixed(1)}px,${y1.toFixed(1)}px)`; r.style.height = h.toFixed(1) + "px"; r.style.setProperty("--c", color);
}

// ── 海豚跳轨迹：车身上下随时间的曲线（SVG） ──
const wave = el("wave", '<svg width="1920" height="1080"><polyline fill="none" stroke="#ffb454" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'), poly = wave.querySelector("polyline");
function waveState(o, pts) { show(wave, o); if (o <= .002) return; poly.setAttribute("points", pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")); }

export function overlayState(t, s) {
  seasonState(t, s.season.o, s.season.big, s.season.lit, s.season.tick, s.season.note);
  counterState(t, s.counter.o, s.counter.n, s.counter.done, s.counter.bump);
  show(title, s.title); title.style.transform = `translate(-50%,-50%) scale(${(.94 + .06 * s.title).toFixed(3)})`;
  show(trophy, s.trophy.o); trophy.style.transform = `translate(-50%,-50%) translate(${s.trophy.dx}px,${s.trophy.dy}px) scale(${s.trophy.s.toFixed(3)})`;
  show(flag, s.flag > 0 && s.flag < 1 ? 1 : 0); flag.style.transform = `translateX(${mix(-130, 130, s.flag).toFixed(1)}%) skewX(-14deg)`;
  show(dim, s.dim || 0);
  show(question, s.question); question.style.transform = `translate(-50%,-50%) scale(${(.96 + .04 * s.question).toFixed(3)})`;
  show(legend, s.legend);
  platesState(t);
  for (let i = 0; i < 2; i++) { const r = s.rulers[i]; if (r) rulerState(i, r.o, r.top, r.bot, r.color); else show(rulers[i], 0); }
  waveState(s.wave.o, s.wave.pts || []);
}
