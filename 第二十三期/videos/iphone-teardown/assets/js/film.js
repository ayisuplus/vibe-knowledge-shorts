// 《一分钟，拆解 iPhone》：一条驱动 tween，每帧状态都由 t 算出。
import * as THREE from "three";
import { scene, camera, composer, ao, setAO, bloom, fx, BG, root } from "./world.js";
import { BEAT, DUR, HITS, SHAKES, SPARKS, B } from "./beats.js";
const CAPS = window.CAPTIONS, NOTES = window.NOTES;
import { clamp, mix, ease, easeIn, win, hash } from "./lib.js";
import { machine, shot, zoom, aperture, D, PM, PT } from "./sections.js";
import { panel, tray, stack, taptic, phone, nail } from "./phone.js";
import { stage, sFlip, BLADES, MAG_A } from "./iris.js";
import { die, trafficState, C4004 } from "./city.js";

const kick = (n, rate = 4.5) => { let k = 0; for (const h of HITS) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * rate)); return k; };
const shake = (n) => { let k = 0; for (const h of SHAKES) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 7)); return k; };

// 火花与尘埃
const SP = 12, sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, .018, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, .8, .3), fog: false }), SP * SPARKS.length); sparks.frustumCulled = false; scene.add(sparks);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _f = new THREE.Vector3(0, 0, 1);
function sparkState(n) {
  let i = 0;
  for (const [h, x, y, z] of SPARKS) for (let k = 0; k < SP; k++, i++) {
    const d = (n - h) * BEAT, life = .45 + .5 * hash(k * 3.1 + h);
    if (d < 0 || d > life) { _m.compose(_p.set(0, 0, 0), _q.identity(), _s.setScalar(0)); sparks.setMatrixAt(i, _m); continue; }
    const a = hash(k + h * 7) * 6.283, sp = 3 + 11 * hash(k * 1.7 + h), vx = sp * Math.cos(a), vy = sp * Math.sin(a), vz = 2 + 9 * hash(k * 2.3 + h), g = 14;
    _p.set(x + vx * d, y + vy * d, z + vz * d - g * d * d); _v.set(vx, vy, vz - 2 * g * d).normalize(); _q.setFromUnitVectors(_f, _v);
    _s.set(1, 1, (.1 + .5 * hash(k)) * (1 - d / life)); _m.compose(_p, _q, _s); sparks.setMatrixAt(i, _m);
  }
  sparks.instanceMatrix.needsUpdate = true;
}
const DN = 700, dustPos = new Float32Array(DN * 3), dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dotC = document.createElement("canvas"); dotC.width = dotC.height = 32; { const g = dotC.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .08, map: new THREE.CanvasTexture(dotC), color: new THREE.Color(.75, .55, .35), transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); dust.frustumCulled = false; scene.add(dust);
function dustState(t) { for (let i = 0; i < DN; i++) { dustPos[i * 3] = (hash(i) - .5) * 44 + Math.sin(t * .4 + i) * .7; dustPos[i * 3 + 1] = (hash(i + 900) - .5) * 30 + Math.cos(t * .33 + i * 1.3) * .7; dustPos[i * 3 + 2] = (hash(i + 1900) - .5) * 30 - 2; } dustGeo.attributes.position.needsUpdate = true; }
// 天光：只在低空穿城时托出地平线
const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uH: { value: 0 } },
  vertexShader: "varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "uniform float uH; varying vec3 vD; void main(){ float hz=exp(-abs(vD.z)*5.); gl_FragColor=vec4(vec3(.016,.017,.02)+uH*hz*vec3(.05,.054,.062),1.); }",
})); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

// ── HUD ──
const hud = document.getElementById("hud");
hud.innerHTML = '<div class="note"></div><div class="timer">00:00</div><div class="fstop"></div>';
const noteEl = hud.querySelector(".note"), timerEl = hud.querySelector(".timer"), fEl = hud.querySelector(".fstop");
const LABELS = [
  { t: "无线充电线圈", ref: panel, at: [1.6, 1.6, .08], a: 17.4, b: 22, dx: 300, dy: -150 },
  { t: "电池", ref: tray, at: [-1, 0, .5], a: 37.4, b: 41, dx: -80, dy: -180 },
  { t: "主摄", ref: stage, at: [0, 0, .2], a: 38, b: 45, dx: -180, dy: -170 },
  { t: "主板", ref: stack, at: [-.6, 1, .1], a: 38.5, b: 45, dx: 210, dy: -170 },
  { t: "USB-C", ref: phone, at: [.05, -6.85, .2], a: 41.8, b: 45.2, dx: 140, dy: 150 },
  { t: "线性马达", ref: phone, at: [-1.85, -6.8, .2], a: 42, b: 45.2, dx: 160, dy: -110 },
  { t: "扬声器", ref: phone, at: [2.1, -6.8, .2], a: 42.2, b: 45.2, dx: 170, dy: 90 },
  { t: "镜片组", ref: sFlip, at: [.3, .1, .3], a: 47.6, b: 50.2, dx: 300, dy: -200 },
  { t: "光圈叶片", ref: BLADES[1].g, at: [.05, -.4, .01], a: 52.6, b: 54.6, dx: 300, dy: -180 },
  { t: "叶片", ref: BLADES[0].g, at: [.1, -.3, .01], a: 55.6, b: 58, dx: -200, dy: -160 },
  { t: "头发丝", ref: sFlip, at: [.5, -.98, .645], a: 55.9, b: 58, dx: 170, dy: -120 },
  { t: "转轴", ref: BLADES[0].g, at: [0, 0, .02], a: 59.6, b: 66.6, dx: 220, dy: -90 },
  { t: "磁铁（示意）", ref: sFlip, at: MAG_A, a: 60.6, b: 66.6, dx: 170, dy: 60 },
  { t: "配重", ref: taptic, at: [0, .1, .13], a: 75.4, b: 80, dx: 150, dy: -210 },
  { t: "弹簧", ref: taptic, at: [.9, .25, .1], a: 76, b: 80, dx: 180, dy: -60 },
  { t: "旧式偏心转子", ref: taptic, at: [.45, 0, .4], a: 72.8, b: 75.2, dx: 200, dy: -170 },
  { t: "均热板", ref: stack, at: [1.2, -1.8, -.34], a: 81.2, b: 82.6, dx: 220, dy: -170 },
  { t: "内存", ref: stack, at: [-1.35, 0, -.15], a: 82.8, b: 85.6, dx: -170, dy: -170 },
  { t: "A20 Pro", ref: stack, at: [0, 0, -.18], a: 82.8, b: 85.6, dx: -190, dy: 170 },
  { t: "指甲盖", ref: nail, at: [.2, .4, 0], a: 83.6, b: 85.8, dx: 90, dy: -170 },
  { t: "1971 · Intel 4004", ref: die, at: [C4004[0], C4004[1], .012], a: 94, b: 102.6, dx: 180, dy: -220 },
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
const caps = CAPS.map(([a, b, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>").replace(/<hc>/g, '<span class="hc">').replace(/<\/hc>/g, "</span>"); hud.appendChild(el); return { el, a, b }; });
const END_TIMER = B(113);

function frame(t) {
  const n = t / BEAT, k = kick(n), sk = shake(n);
  machine(n, t); shot(n, t, sk); sparkState(n);
  dust.visible = n < 46; if (dust.visible) dustState(t); if (n > 87) trafficState(t);
  sky.position.copy(camera.position); sky.scale.setScalar(camera.far * .6); sky.material.uniforms.uH.value = ease((n - 89.6) / .6) * (1 - ease((n - 103) / 2));
  const rush = win(n, 47.5, 49.6) ? .03 : win(n, 87, 90) ? .012 + .07 * easeIn((n - 87) / 3) : win(n, 113, 115) ? .09 * (1 - ease((n - 113.6) / 1.4)) : win(n, 90, 93.4) ? .004 : 0;
  const flash = Math.max(n >= 113 ? Math.exp(-(n - 113) * 6) * .05 : 0, ease((n - 89.6) / .3) * (1 - ease((n - 90) / .45)) * .025, n >= 127.55 ? .9 * ease((n - 127.55) / .35) : 0);
  fx.uniforms.uZoom.value = .006 * k + .03 * sk + rush; fx.uniforms.uAb.value = .0006 + .001 * k + .002 * sk; fx.uniforms.uFlash.value = flash; fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  const z = root.scale.x; ao.enabled = !(win(n, 86, 91) || win(n, 113, 115.4)); setAO(n >= 91 && n < 113 ? 1.6 : Math.min(.32 * z, 3)); bloom.strength = .08; composer.render();
  for (const c of caps) { const a = clamp((t - c.a) / .1) * (1 - clamp((t - c.b + .1) / .1)); c.el.style.opacity = a.toFixed(3); c.el.style.visibility = a > .002 ? "visible" : "hidden"; }
  labels(n);
  let nt = ""; for (const [a, b, s] of NOTES) if (n >= a && n < b) nt = s; if (noteEl.textContent !== nt) noteEl.textContent = nt;
  const sec = Math.min(60, Math.floor(t * 60 / END_TIMER)), ts = sec === 60 ? "01:00" : `00:${String(sec).padStart(2, "0")}`; if (timerEl.textContent !== ts) timerEl.textContent = ts; timerEl.classList.toggle("done", sec === 60);
  const fo = win(n, 59, 72) ? clamp((n - 59) / .2) * (1 - clamp((n - 71.8) / .2)) : 0; fEl.style.visibility = fo > 0 ? "visible" : "hidden"; fEl.style.opacity = fo; if (fo > 0) { const s = `ƒ/${aperture(n)[1]}`; if (fEl.textContent !== s) fEl.textContent = s; }
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
