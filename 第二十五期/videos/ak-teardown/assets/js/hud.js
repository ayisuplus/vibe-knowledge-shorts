// HUD：开场的游戏准星（碎开）、计时器、慢放计时与膛压表、引线标注、字幕、注释带、图纸图签。全是 n / t 的纯函数。
import * as THREE from "three";
import { camera } from "./world.js";
import { BEAT, B, TIMER, REAL } from "./beats.js";
import { clamp, ease, hash } from "./lib.js";
import { gun, body, mag, cover, springG, carrier, bolt, spring, rounds, wallL, handleKnob, TUBE_Y, PIN_X } from "./ak.js";
import { cycle } from "./sections.js";
const CAPS = window.CAPTIONS, NOTES = window.NOTES;

const hud = document.getElementById("hud");
hud.innerHTML = '<canvas class="game" width="1920" height="1080"></canvas><div class="note"></div><div class="timer">00:00</div>'
  + '<div class="slow"><div class="slowTag"></div><div class="slowNum"></div></div><div class="meter"><div class="meterBar"><div class="meterFill"></div></div><div class="meterTag">膛压（示意）</div></div>'
  + '<div class="titleblock"><div class="tbK">设计年份</div><div class="tbV">1947</div><div class="tbK">外形参考 AKM</div></div>';
const $ = (s) => hud.querySelector(s);
const game = $(".game"), g2 = game.getContext("2d"), noteEl = $(".note"), timerEl = $(".timer"), slowEl = $(".slow"), slowTag = $(".slowTag"), slowNum = $(".slowNum"), meterEl = $(".meter"), fill = $(".meterFill"), tb = $(".titleblock");
const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > .002 ? "visible" : "hidden"; };

// ── 开场：抽象的游戏准星和弹药数，n6 碎开（画面里没有任何目标） ──
const SHARDS = Array.from({ length: 26 }, (_, i) => { const a = hash(i) * 6.283, r = 30 + 260 * hash(i + 9), s = 18 + 60 * hash(i + 4); return { a, r, s, v: 500 + 1100 * hash(i + 2), w: (hash(i + 6) - .5) * 9, p: [0, 1, 2].map((k) => [Math.cos(a + k * 2.1 + hash(i + k) * .8) * s, Math.sin(a + k * 2.1 + hash(i + k + 3) * .8) * s]) }; });
function drawGame(n) {
  const on = n < 9.5; game.style.visibility = on ? "visible" : "hidden"; if (!on) return;
  const g = g2, k = Math.max(0, (n - 6) * BEAT), al = n < 6 ? 1 : Math.max(0, 1 - k / 1.3), cx = 960, cy = 540;
  g.clearRect(0, 0, 1920, 1080); if (al <= 0) return;
  g.save(); g.shadowColor = "rgba(0,0,0,.95)"; g.shadowBlur = 6;
  const gap = 16 + 5 * Math.sin(n * Math.PI);
  const piece = (dx, dy, draw) => { g.save(); const d = k * 900, rot = k * 4 * (dx + dy || 1); g.translate(cx + dx * d, cy + dy * d); g.rotate(n < 6 ? 0 : rot); g.globalAlpha = al; draw(); g.restore(); };
  g.fillStyle = "#e8f6ff";
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) piece(dx, dy, () => { if (dx) g.fillRect(dx > 0 ? gap : -gap - 30, -2, 30, 4); else g.fillRect(-2, dy > 0 ? gap : -gap - 30, 4, 30); });
  piece(0, 0, () => { g.beginPath(); g.arc(0, 0, 3, 0, 6.283); g.fill(); });
  // 弹药数
  g.save(); g.globalAlpha = al; const ax = 1840 + k * 700, ay = 1000 + k * 300; g.translate(ax, ay); g.rotate(k * 1.5); g.textAlign = "right"; g.font = "800 84px NotoSC"; g.fillText("30", -118, 0); g.font = "700 46px NotoSC"; g.fillStyle = "#9fb4c2"; g.fillText("/ 90", 0, 0); g.restore();
  // 检视提示：n0.8 出现，n2.3 「按下」后消失
  const pr = clamp((n - .8) / .3) * (1 - clamp((n - 2.4) / .3)), press = n >= 2.2 && n < 2.5 ? 1 : 0;
  if (pr > 0) { g.save(); g.globalAlpha = pr; g.fillStyle = "rgba(8,10,13,.72)"; g.fillRect(cx - 132, cy + 96, 150, 70); g.textAlign = "center"; g.font = "700 34px NotoSC"; g.fillStyle = press ? "#ffb454" : "#e8f6ff"; g.strokeStyle = press ? "#ffb454" : "#e8f6ff"; g.lineWidth = 2.5;
    g.strokeRect(cx - 118, cy + 108, 46, 46); g.fillText("F", cx - 95, cy + 143); g.textAlign = "left"; g.fillText("检视", cx - 56, cy + 143); g.restore(); }
  // 碎玻璃
  if (n >= 6) for (const s of SHARDS) {
    const d = s.r + s.v * k, x = cx + Math.cos(s.a) * d, y = cy + Math.sin(s.a) * d; g.save(); g.translate(x, y); g.rotate(s.w * k); g.globalAlpha = al * .9;
    g.beginPath(); g.moveTo(...s.p[0]); g.lineTo(...s.p[1]); g.lineTo(...s.p[2]); g.closePath(); g.fillStyle = "rgba(220,240,255,.06)"; g.fill(); g.strokeStyle = "rgba(230,245,255,.55)"; g.lineWidth = 1.5; g.stroke(); g.restore();
  }
  g.restore();
}

// ── 引线标注 ──
const LABELS = [
  { t: "弹匣", ref: mag, at: [-6, -12, 1.5], a: 12.2, b: 14.4, dx: 200, dy: 60 },
  { t: "拉机柄", ref: handleKnob, at: [0, 0, 0], a: 14.1, b: 16.6, dx: 170, dy: -170 },
  { t: "机匣盖", ref: cover, at: [-10, 3.9, 0], a: 17.4, b: 20.4, dx: 160, dy: -170 },
  { t: "复进簧", ref: springG, at: [-15, 1.62, .6], a: 21.4, b: 23.8, dx: 150, dy: -170 },
  { t: "枪机框", ref: carrier, at: [-1, 2.3, 1.1], a: 24.4, b: 27, dx: 180, dy: -160 },
  { t: "枪机", ref: bolt, at: [-3, .9, .9], a: 27.4, b: 29.8, dx: 170, dy: -160 },
  { t: "枪身", ref: body, at: [-42, -4, 1.8], a: 31.6, b: 37, dx: -40, dy: 170 },
  { t: "弹匣", ref: mag, at: [-6, -12, 1.5], a: 32, b: 37, dx: 150, dy: 90 },
  { t: "机匣盖", ref: cover, at: [-14, 3.9, 0], a: 32.4, b: 37, dx: -150, dy: 90 },
  { t: "复进簧", ref: springG, at: [-15, 1.62, .6], a: 32.8, b: 37, dx: 150, dy: 90 },
  { t: "枪机框（连活塞）", ref: carrier, at: [14, TUBE_Y, .5], a: 33.2, b: 37, dx: 120, dy: 90 },
  { t: "枪机", ref: bolt, at: [-4, .9, .9], a: 33.6, b: 37, dx: -120, dy: 90 },
  { t: "活塞", ref: carrier, at: [24, TUBE_Y + .5, .5], a: 39.2, b: 45.6, dx: 150, dy: -150 },
  { t: "枪机框", ref: carrier, at: [-2, 2.3, 1.1], a: 39.6, b: 45.6, dx: -170, dy: -150 },
  { t: "导气孔", ref: gun, at: [29.7, 1.3, .3], a: 52.6, b: 56.6, dx: 170, dy: -190 },
  { t: "活塞", ref: carrier, at: [28.1, TUBE_Y + .72, .3], a: 53.6, b: 57.2, dx: -230, dy: -150 },
  { t: "枪机框", ref: carrier, at: [-1.5, 2.3, 1.1], a: 57.6, b: 63.6, dx: -230, dy: -170 },
  { t: "凸轮槽", ref: carrier, at: [PIN_X + 1.6, 1.62, 1.1], a: 58.6, b: 64, dx: 190, dy: -200 },
  { t: "枪机 · 转约 35°", ref: bolt, at: [-3, -.9, .9], a: 59.6, b: 64, dx: -180, dy: 150 },
  { t: "弹壳", ref: rounds[0].c, at: [2, .55, 0], a: 65.9, b: 67.6, dx: 170, dy: -130 },
  { t: "复进簧", ref: spring, at: [.55, .5, .5], a: 67.6, b: 70, dx: 60, dy: 210 },
  { t: "下一发", ref: rounds[1].c, at: [2.8, -.56, .5], a: 70.2, b: 73.6, dx: 180, dy: 150 },
  { t: "锁死", ref: bolt, at: [-.6, 0, 1.2], a: 74.7, b: 76.2, dx: 190, dy: -160 },
  { t: "枪机框", ref: carrier, at: [-4, 2.3, -1.1], a: 89, b: 96.4, dx: 160, dy: -150 },
  { t: "机匣导轨", ref: wallL, at: [-9, .95, -1.2], a: 89.6, b: 96.4, dx: -150, dy: 160 },
  { t: "晃动（示意）", ref: carrier, at: [-2, 2.3, -1.1], a: 98.4, b: 102.8, dx: 170, dy: -150 },
].map((l) => { const line = document.createElement("div"), el = document.createElement("div"); line.className = "lead"; el.className = "lbl"; el.textContent = l.t; hud.append(line, el); return { ...l, line, el }; });
const _lb = new THREE.Vector3();
function labels(n) {
  for (const l of LABELS) {
    const o = clamp((n - l.a) / .3) * (1 - clamp((n - l.b + .25) / .25)); l.el.style.visibility = l.line.style.visibility = o > .002 ? "visible" : "hidden"; if (o <= .002) continue;
    l.ref.updateWorldMatrix(true, false); _lb.set(...l.at); l.ref.localToWorld(_lb); _lb.project(camera);
    const x = (_lb.x + 1) * 960, y = (1 - _lb.y) * 540, X = x + l.dx, Y = y + l.dy, len = Math.hypot(l.dx, l.dy), ang = Math.atan2(l.dy, l.dx);
    l.el.style.opacity = l.line.style.opacity = o.toFixed(3); l.el.style.transform = `translate(${(X - (l.dx < 0 ? l.el.offsetWidth : 0)).toFixed(1)}px,${(Y - 28).toFixed(1)}px)`;
    l.line.style.width = len.toFixed(1) + "px"; l.line.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
  }
}
const caps = CAPS.map(([a, b, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>"); hud.appendChild(el); return { el, a, b }; });

export function hudState(n, t, st) {
  drawGame(n);
  for (const c of caps) show(c.el, clamp((t - c.a) / .1) * (1 - clamp((t - c.b + .1) / .1)));
  labels(n);
  let nt = ""; for (const [a, b, s] of NOTES) if (n >= a && n < b) nt = s; if (noteEl.textContent !== nt) noteEl.textContent = nt;
  // 计时器：n6 起，n113 到 01:00
  show(timerEl, clamp((n - 6) / .3)); const sec = Math.min(60, Math.max(0, Math.floor((t - B(TIMER[0])) * 60 / (B(TIMER[1]) - B(TIMER[0]))))), ts = sec === 60 ? "01:00" : `00:${String(sec).padStart(2, "0")}`;
  if (timerEl.textContent !== ts) timerEl.textContent = ts; timerEl.classList.toggle("done", sec === 60);
  // 慢放计时：这一刻对应的真实时间
  const so = clamp((n - 48.6) / .3) * (1 - clamp((n - 83.7) / .3)); show(slowEl, so);
  if (so > 0) { const { u } = cycle(n, t), ms = n < 50 ? 0 : n < REAL ? u * 100 : Math.min(100, (t - B(REAL)) * 1000), tag = n < REAL ? "慢放" : "真实速度"; slowNum.textContent = `${(ms / 1000).toFixed(4)} s`; if (slowTag.textContent !== tag) slowTag.textContent = tag; slowEl.classList.toggle("real", n >= REAL); }
  show(meterEl, clamp((n - 48.6) / .3) * (1 - clamp((n - 65.5) / .3))); fill.style.transform = `scaleY(${(n < 50 ? 1 : st.pressure).toFixed(3)})`;
  show(tb, clamp((n - 106) / .5) * (1 - clamp((n - 112.7) / .3)));
}
