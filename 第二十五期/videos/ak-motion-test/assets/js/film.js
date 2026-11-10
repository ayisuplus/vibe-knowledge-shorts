// AK 动效测试（正片 ④ 段）：一条驱动 tween，每帧状态都由 t 算出。
import * as THREE from "three";
import { camera, composer, setAO, bloom, fx } from "./world.js";
import { BEAT, B, DUR, WARP, REAL, HITS, SHAKES } from "./beats.js";
import { clamp, mix, mixV, ease, hash } from "./lib.js";
import { machine, peel, carrier, bolt, spring, rounds, gun, U, TUBE_Y, PIN_X } from "./ak.js";
const CAPS = window.CAPTIONS, NOTES = window.NOTES;

// ── 时间：屏幕拍 n → 第几次循环、循环进度 u ──
const warp = (n) => { if (n <= WARP[0][0]) return 0; for (let i = 1; i < WARP.length; i++) { const [a, ua] = WARP[i - 1], [b, ub] = WARP[i]; if (n < b) return mix(ua, ub, (n - a) / (b - a)); } return 1; };
const cycle = (n, t) => n < REAL ? { c: 0, u: warp(n) } : { c: 1, u: clamp((t - B(REAL)) / .1) };
const END_SLOW = WARP[WARP.length - 1][0];
/** 第 j 发弹壳被抛出后经过的真实秒数；慢放结束后按真实时间继续（早已飞出画面） */
function flightOf(n, t, c, u) {
  return (j) => {
    if (j === 0) { if (n < REAL && u < U.UE) return null; return n < END_SLOW ? .1 * (u - U.UE) : .1 * (1 - U.UE) + (t - B(END_SLOW)); }
    if (j === 1 && c === 1) return u < U.UE ? null : .1 * (u - U.UE) + Math.max(0, t - B(REAL) - .1);
    return null;
  };
}

// ── 镜头：[拍, 机位, 看点]，段间缓动但不完全停住 ──
const CAM = [
  [0, [38, 18, 118], [-8, -3, 0]],
  [2.8, [5, 2.5, 60], [4, -.5, 0]],
  [4.4, [20, 4, 36], [18, 1.2, 0]],
  [6.0, [21, 4.5, 33], [19.5, 1.6, 0]],
  [7.4, [9, 6, 26], [0, .8, 0]],
  [9.8, [8, 6.5, 22], [-1.5, .6, 0]],
  [11.2, [-2, 3.5, 44], [-5, -.5, 0]],
  [14.5, [-1, 2.5, 42], [-3, -1, 0]],
  [16.3, [5, 2, 60], [4, -.5, 0]],
  [20, [5, 2, 56], [4, -.5, 0]],
];
const _t = new THREE.Vector3();
function shot(n, sk) {
  let i = 0; while (i < CAM.length - 2 && n >= CAM[i + 1][0]) i++;
  const [a, pa, ta] = CAM[i], [b, pb, tb] = CAM[i + 1], q = clamp((n - a) / (b - a)), p = mix(q, ease(q), .65);
  camera.position.set(...mixV(pa, pb, p)); _t.set(...mixV(ta, tb, p));
  if (sk > 0) { const f = Math.floor(n * 60); camera.position.x += (hash(f) - .5) * 1.2 * sk; camera.position.y += (hash(f + 7) - .5) * 1.2 * sk; }
  camera.lookAt(_t);
}
const kick = (n) => { let k = 0; for (const h of HITS) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 4.5)); return k; };
const shake = (n) => { let k = 0; for (const h of SHAKES) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 7)); return k; };

// ── HUD ──
const hud = document.getElementById("hud");
hud.innerHTML = '<div class="note"></div><div class="timer">00:27<span class="tag">暂停</span></div><div class="slow"><div class="slowTag"></div><div class="slowNum"></div></div><div class="meter"><div class="meterBar"><div class="meterFill"></div></div><div class="meterTag">膛压（示意）</div></div>';
const noteEl = hud.querySelector(".note"), slowEl = hud.querySelector(".slow"), slowTag = hud.querySelector(".slowTag"), slowNum = hud.querySelector(".slowNum"), meterEl = hud.querySelector(".meter"), fill = hud.querySelector(".meterFill");
const LABELS = [
  { t: "导气孔", ref: gun, at: [29.7, 1.3, .3], a: 4.4, b: 7, dx: 170, dy: -190 },
  { t: "活塞", ref: carrier, at: [28.1, TUBE_Y + .72, .3], a: 5.2, b: 7.2, dx: -230, dy: -150 },
  { t: "枪机框", ref: carrier, at: [-1.5, 2.3, 1.1], a: 7.2, b: 9.8, dx: -230, dy: -170 },
  { t: "凸轮槽", ref: carrier, at: [PIN_X + 1.6, 1.62, 1.1], a: 7.8, b: 10.4, dx: 190, dy: -200 },
  { t: "枪机 · 转约 35°", ref: bolt, at: [-3, -.9, .9], a: 8.2, b: 10.4, dx: -180, dy: 150 },
  { t: "弹壳", ref: rounds[0].c, at: [2, .55, 0], a: 11.15, b: 12.3, dx: 170, dy: -130 },
  { t: "复进簧", ref: spring, at: [.55, .5, .5], a: 11.8, b: 13.6, dx: 60, dy: 210 },
  { t: "下一发", ref: rounds[1].c, at: [2.8, -.56, .5], a: 13.2, b: 15, dx: 180, dy: 150 },
  { t: "锁死", ref: bolt, at: [-.6, 0, 1.2], a: 15.9, b: 16.9, dx: 190, dy: -160 },
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
const show = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o > .002 ? "visible" : "hidden"; };

function frame(t) {
  const n = t / BEAT, sk = shake(n), k = kick(n), { c, u } = cycle(n, t);
  peel(ease((n - .5) / 2.2));
  const st = machine(c, u, flightOf(n, t, c, u));
  shot(n, sk);
  const fire = (h) => n >= h ? Math.exp(-(n - h) * 9) : 0;
  fx.uniforms.uZoom.value = .006 * k + .03 * sk; fx.uniforms.uAb.value = .0006 + .001 * k + .002 * sk;
  fx.uniforms.uFlash.value = .03 * fire(3) + .06 * fire(REAL); fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  setAO(1.4); bloom.strength = .08; composer.render();
  for (const cp of caps) show(cp.el, clamp((t - cp.a) / .1) * (1 - clamp((t - cp.b + .1) / .1)));
  labels(n);
  let nt = ""; for (const [a, b, s] of NOTES) if (n >= a && n < b) nt = s; if (noteEl.textContent !== nt) noteEl.textContent = nt;
  // 慢放计时：显示这一刻对应的真实时间
  const so = clamp((n - 2.7) / .3); show(slowEl, so);
  if (so > 0) { const ms = n < REAL ? u * 100 : Math.min(100, (t - B(REAL)) * 1000), tag = n < REAL ? "慢放" : "真实速度"; slowNum.textContent = `${(ms / 1000).toFixed(4)} s`; if (slowTag.textContent !== tag) slowTag.textContent = tag; slowEl.classList.toggle("real", n >= REAL); }
  const mo = clamp((n - 2.8) / .3) * (1 - clamp((n - 10.4) / .3)); show(meterEl, mo); fill.style.transform = `scaleY(${st.pressure.toFixed(3)})`;
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
