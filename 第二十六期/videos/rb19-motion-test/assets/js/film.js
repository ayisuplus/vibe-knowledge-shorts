// RB19 动效测试（正片 ⑤ 段「钻进车底」）：一条驱动 tween，每帧状态都由 t 算出。
// 翻转看车底 → 侧面剖面：气流穿过隧道 → 海豚跳 → 刹车对比（前悬架抗点头）。
import * as THREE from "three";
import { camera, composer, setAO, ao, bloom, fx } from "./world.js";
import { DUR, S, BRAKE, STALLS, HITS } from "./beats.js";
import { clamp, mix, mixV, ease, easeOut, hash, integ } from "./lib.js";
import { makeCar, carState, FLOOR_Y, TZ } from "./rb19.js";
import { envState } from "./env.js";
import { flowState, flowAnchors } from "./flow.js";
import { defineLabels, hudState } from "./hud.js";
import { root } from "./world.js";

const rb = makeCar(root), cmp = makeCar(root, { grey: true });
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const NOCAP = /[?&]nocap/.test(location.search) || window.__NOCAP;

// ── 运动：速度、路程 ──
const VMAX = 30;
const speed = (t) => t < 5 ? 0 : VMAX * ease((t - 5) / .6) * (t < BRAKE ? 1 : mix(1, .3, ease((t - BRAKE) / 2.4)));
// 海豚跳：车身上下（负＝更贴地）与失速程度
const seg = (keys, t, f = ease) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, f((t - a) / (b - a))); } return keys[keys.length - 1][1]; };
const RIDE = [[8.4, 0], [8.95, -.5], [9.05, -.52], [9.4, 1.0], [9.7, .35], [9.98, -.5], [10.05, -.52], [10.4, 1.0], [10.72, .35], [11.1, 0]];
const STALL = [[8.98, 0], [9.08, 1], [9.45, 1], [9.66, 0], [9.98, 0], [10.08, 1], [10.45, 1], [10.66, 0]];
const lin = (x) => clamp(x);

// ── 镜头：每段一个机位，段内持续运动，段与段之间硬切 ──
const CAM = [
  [0, 1.5, [50, 9, 56], [44, 8, 50], [1, 3.5, 0], [1, 3.8, 0]],
  [1.5, 4.6, [34, 52, 34], [20, 48, 30], [0, 9, 0], [-2, 9, 0]],
  [4.6, 8.4, [-3, 4.4, 40], [-4, 4.0, 36], [-3, 4.2, 0], [-4, 3.8, 0]],
  [8.4, 11.2, [-3, 4.3, 35], [-4, 4.1, 32], [-3, 4.3, 0], [-4, 4.1, 0]],
  [11.2, 15.1, [14, 34, 62], [9, 30, 56], [5, 1, -14], [6, .8, -14]],
];
const _tg = new THREE.Vector3();
function shot(t, sk) {
  const c = CAM.find((s) => t < s[1]) || CAM[CAM.length - 1], q = clamp((t - c[0]) / (c[1] - c[0])), p = mix(q, ease(q), .6);
  camera.position.set(...mixV(c[2], c[3], p)); _tg.set(...mixV(c[4], c[5], p));
  if (sk > 0) { const f = Math.floor(t * 60); camera.position.x += (hash(f) - .5) * 1.0 * sk; camera.position.y += (hash(f + 7) - .5) * 1.0 * sk; }
  camera.lookAt(_tg);
}
const kick = (t) => { let k = 0; for (const h of HITS) if (t >= h) k = Math.max(k, Math.exp(-(t - h) * 9)); return k; };
const shake = (t) => { let k = 0; for (const h of STALLS) if (t >= h) k = Math.max(k, Math.exp(-(t - h) * 10)); return k; };

// ── 标注（AGENTS.md 1.3.1：部件名＋作用；过程也标在画面里） ──
const W = (c, p, node = "body") => () => c[node].localToWorld(new THREE.Vector3(...p));
const rideNow = (t) => seg(RIDE, t);
defineLabels([
  { k: "full", t: "车底 · 两条隧道", f: "把车吸向地面", a: 2.9, b: 4.6, at: W(rb, [-4, FLOOR_Y, TZ]), dx: -260, dy: -170 },
  { k: "tag", t: "入口", a: 3.3, b: 4.6, at: W(rb, [13.4, FLOOR_Y + 1.6, TZ]), dx: 150, dy: -110 },
  { k: "tag", t: "出口 · 扩散器", a: 3.6, b: 4.6, at: W(rb, [-20.4, FLOOR_Y + 2.8, TZ]), dx: -150, dy: 120 },
  { k: "proc", t: "通道变窄 → 气流加速", a: 6.0, b: 8.35, at: () => new THREE.Vector3(6, 0, 0), dx: 0, dy: 120 },
  { k: "proc", c: "blue", t: "低压", a: 6.5, b: 8.35, at: () => new THREE.Vector3(-6, 0, 0), dx: 0, dy: 55 },
  { k: "proc", t: "下压力", a: 7.0, b: 8.35, at: () => flowAnchors.force(0), dx: 150, dy: -10 },
  { k: "proc", t: "越贴地 → 吸得越牢", a: 8.45, b: 9.0, at: (t) => flowAnchors.force(rideNow(t)), dx: 0, dy: -60 },
  { k: "proc", t: "太近了 → 气流断了", a: 9.05, b: 9.75, at: () => new THREE.Vector3(-3, 0, 0), dx: 0, dy: 110 },
  { k: "proc", t: "↑ 车弹起", a: 9.12, b: 9.75, at: (t) => new THREE.Vector3(8, 10 + rideNow(t), 0), dx: 0, dy: -50 },
  { k: "proc", t: "又被吸下 → 再弹起", a: 9.8, b: 11.0, at: (t) => flowAnchors.force(rideNow(t)), dx: 0, dy: -60 },
  { k: "tag", t: "对比车（示意）", a: 11.3, b: 15.1, at: W(cmp, [-6, 9.4, 0]), dx: -120, dy: -90 },
  { k: "proc", t: "刹车！", a: BRAKE, b: BRAKE + .7, at: () => new THREE.Vector3(14, 12, -6), dx: 0, dy: 0 },
  { k: "proc", t: "车头下沉", a: 12.0, b: 15.1, at: W(cmp, [26, 2.4, 0]), dx: 40, dy: -110 },
  { k: "proc", t: "车头稳住", a: 12.2, b: 15.1, at: W(rb, [26, 2.4, 0]), dx: 60, dy: -90 },
  { k: "full", t: "前悬架 · 拉杆式", f: "刹车时撑住车头", a: 12.5, b: 15.1, at: W(rb, [17.4, 4.6, 6.2], "inner"), dx: 170, dy: 150 },
]);

function frame(t) {
  const dist = integ(speed, t), sk = shake(t), k = kick(t);
  const inFlip = t >= S.flip[0] && t < S.side[0] + 1.2;
  const lift = t < S.side[0] ? 9 * ease((t - 1.5) / .9) : 9 * (1 - ease((t - 4.75) / .75));
  const roll = t < S.side[0] ? Math.PI * ease((t - 1.8) / 1.2) : Math.PI * (1 - ease((t - 4.6) / .7));
  const xray = t >= 5.45 && t < S.brake[0];
  ghostMat.opacity = .032 + .2 * Math.exp(-Math.max(0, t - 5.45) * 7);
  const ride = rideNow(t), st = seg(STALL, t, lin), brk = t >= S.brake[0];
  const bk = brk ? ease((t - BRAKE) / .35) * (1 - ease((t - 14.4) / .6)) : 0;
  carState(rb, { lift: inFlip ? lift : 0, roll: inFlip ? roll : 0, ride, dist, ghost: xray ? ghostMat : null, pitchDeg: -.3 * bk, hl: brk ? ease((t - 12.3) / .4) : 0, tl: clamp((t - 2.7) / .4) * (1 - clamp((t - 4.5) / .1)) });
  cmp.car.visible = brk;
  if (brk) carState(cmp, { z: -24, dist, pitchDeg: -2.4 * bk });
  envState(t, dist, t > 5 ? 1 : 0);
  const fon = clamp((t - 5.45) / .4) * (t < S.brake[0] ? 1 : 0);
  flowState(t, { on: fon, ride, st, tf: t - 5 });
  shot(t, sk);
  ao.enabled = !xray; setAO(1.2); bloom.strength = xray ? .22 : .08;
  fx.uniforms.uZoom.value = .005 * k + .02 * sk; fx.uniforms.uAb.value = .0005 + .001 * k + .0015 * sk;
  fx.uniforms.uFlash.value = .05 * Math.exp(-Math.max(0, t - 5.45) * 9) * (t >= 5.45 ? 1 : 0); fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  composer.render();
  hudState(t, { hideCaptions: NOCAP });
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
