// 车底剖面的示意层：隧道顶线、地面线、低压区、气流粒子、下压力箭头。总在最上层（depthTest: false）。
// 气流按「连续性」示意：通道越窄流速越快（v ∝ 1/间隙）。粒子位置由「飞行时间表」反查，纯 t 函数，可任意跳帧。
import * as THREE from "three";
import { scene } from "./world.js";
import { FLOOR_Y, X_IN, X_OUT, tunnelD } from "./rb19.js";
import { easeOut } from "./lib.js";
import { clamp, mix, hash } from "./lib.js";

export const flow = new THREE.Group(); scene.add(flow); flow.renderOrder = 10;
const top = (m) => { m.depthTest = false; m.depthWrite = false; m.transparent = true; return m; };
const ceil = (x) => FLOOR_Y + tunnelD(x);
const FREE = 3.4, X0 = 36, X1 = -36;
/** 车底下的间隙（静止车高） */
const gap0 = (x) => x >= X_IN ? mix(ceil(X_IN), FREE, clamp((x - X_IN) / 9)) : x <= X_OUT ? mix(ceil(X_OUT), FREE, clamp((X_OUT - x) / 9)) : ceil(x);

/** 沿 x 的条带：yA(x)、yB(x) 之间，colorFn(x) → [r,g,b,a] */
function strip(xa, xb, yA, yB, colorFn, n = 160) {
  const pos = [], col = [], idx = [];
  for (let i = 0; i <= n; i++) { const x = mix(xa, xb, i / n), c = colorFn(x); pos.push(x, yA(x), 0, x, yB(x), 0); col.push(...c, ...c); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 4)); g.setIndex(idx);
  const m = new THREE.Mesh(g, top(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))); m.renderOrder = 10; m.frustumCulled = false; return m;
}
const edgeA = (x, a, b, f = 1.5) => clamp((x - a) / f) * clamp((b - x) / f);
const secFill = strip(X_OUT, X_IN, ceil, (x) => ceil(x) + .5, () => [.12, .17, .24, .92]);
const secLine = strip(X_OUT, X_IN, (x) => ceil(x) - .07, (x) => ceil(x) + .07, () => [.82, .92, 1, 1]);
const ground = strip(-34, 34, () => -.06, () => .06, (x) => [.55, .6, .66, .8 * edgeA(x, -34, 34, 8)]);
const lowP = strip(-12, 4, () => .08, (x) => ceil(x) - .1, (x) => [.22, .52, 1, .5 * edgeA(x, -12, 4, 3.5)]);
const sec = new THREE.Group(); sec.add(lowP, secFill, secLine); flow.add(sec, ground);

// ── 粒子 ──
const LAYERS = [.14, .28, .42, .56, .70, .84], M = 34, OVER = [10.8, 12.3, 13.8], MO = 16, U = 21;
const N = LAYERS.length * M + OVER.length * MO;
const streak = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .13, .13), top(new THREE.MeshBasicMaterial({ color: 0xffffff })), N);
streak.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3); streak.renderOrder = 11; streak.frustumCulled = false; flow.add(streak);
// 飞行时间表 τ(x)：从 X0 出发到 x 需要的时间（流速 U·v，v = FREE/间隙）
const TN = 900, tauX = [], tauT = []; { let acc = 0; for (let i = 0; i <= TN; i++) { const x = mix(X0, X1, i / TN); if (i) { const xm = x + (X0 - X1) / TN / 2; acc += (X0 - X1) / TN / (U * FREE / gap0(xm)); } tauX.push(x); tauT.push(acc); } }
const T_ALL = tauT[TN], T_OVER = (X0 - X1) / (U * .8);
const xAt = (tau) => { let lo = 0, hi = TN; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tauT[m] < tau) lo = m; else hi = m; } return mix(tauX[lo], tauX[hi], (tau - tauT[lo]) / (tauT[hi] - tauT[lo] || 1)); };
const COOL = new THREE.Color(0x7fb2ff), WARM = new THREE.Color(0xffb454), DEAD = new THREE.Color(0x667080), _c = new THREE.Color();
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _e = new THREE.Euler();

// ── 下压力箭头 ──
const ARROW_X = [8, -3, -13];
const arrowMat = top(new THREE.MeshBasicMaterial({ color: 0xffb454 }));
const arrows = ARROW_X.map((x) => { const g = new THREE.Group(), shaft = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1, 12).translate(0, .5, 0), arrowMat), head = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.1, 16).rotateX(Math.PI).translate(0, -.55, 0), arrowMat); shaft.renderOrder = head.renderOrder = 12; g.add(shaft, head); g.position.x = x; flow.add(g); return { g, shaft, head }; });

/** 吸力（相对静止车高）：越贴地越大；失速时归零 */
export const suction = (ride, st) => (1 - st) * clamp(1.05 / Math.max(.5, 1.05 + ride), 0, 2);

/** on：示意层不透明度；ride：车身上下（负＝更贴地）；st：失速程度（0–1）；tf：示意层自己的时钟（秒） */
export function flowState(t, { on = 0, ride = 0, st = 0, tf = 0 }) {
  flow.visible = on > .002; if (!flow.visible) return;
  sec.position.y = ride;
  const sc = suction(ride, st);
  for (const m of [secFill, secLine, ground, lowP, streak]) m.material.opacity = on;
  lowP.material.opacity = on * clamp(sc / 1.3);
  arrowMat.opacity = on * clamp(sc * 1.4);
  arrows.forEach((a, i) => { const L = .6 + 3.2 * sc * (1 - .15 * i); a.shaft.scale.y = L; a.g.position.y = 10.3 + ride; a.g.visible = sc > .02; });
  let k = 0;
  const jit = Math.floor(t * 24);
  LAYERS.forEach((f, li) => {
    for (let p = 0; p < M; p++) {
      const ph = (p + hash(li * 7.1)) / M, age = ((tf / T_ALL + ph) % 1) * T_ALL, x = xAt(age);
      const inCar = x < X_IN && x > X_OUT, g = gap0(x) + (inCar ? ride : 0), v = FREE / gap0(x), d = .02;
      let y = f * g; const dy = f * ((gap0(x + d) - gap0(x - d)) / (2 * d));
      const dead = st * clamp((x - (-16)) / 3) * clamp((8 - x) / 3); // 失速区：隧道中后段
      y += dead * (hash(p * 13 + li * 31 + jit) - .5) * g * .9;
      const len = mix(.35 + .55 * v, .35, dead);
      _c.copy(COOL).lerp(WARM, clamp((v - 1.1) / 1.9)).lerp(DEAD, dead);
      _e.set(0, 0, Math.atan(dy) + dead * (hash(p + jit * 3) - .5) * 1.4); _q.setFromEuler(_e); _p.set(x, y, 0); _s.set(len, 1, 1);
      _m.compose(_p, _q, _s); streak.setMatrixAt(k, _m); streak.setColorAt(k, _c); k++;
    }
  });
  OVER.forEach((y0, li) => {
    for (let p = 0; p < MO; p++) {
      const ph = (p + hash(li * 3.3 + 50)) / MO, x = mix(X0, X1, ((tf / T_OVER + ph) % 1));
      _e.set(0, 0, 0); _q.setFromEuler(_e); _p.set(x, y0 + ride * .3, 0); _s.set(.6, 1, 1);
      _m.compose(_p, _q, _s); streak.setMatrixAt(k, _m); streak.setColorAt(k, COOL); k++;
    }
  });
  streak.instanceMatrix.needsUpdate = true; streak.instanceColor.needsUpdate = true;
}
/** 标注锚点（世界坐标） */
export const flowAnchors = {
  fast: (ride) => new THREE.Vector3(-4, ceil(-4) * .55 + ride, 0),
  low: (ride) => new THREE.Vector3(-8.5, .3, 0),
  force: (ride) => new THREE.Vector3(-3, 12.6 + ride, 0),
  inlet: (ride) => new THREE.Vector3(13, ceil(13) * .6 + ride, 0),
};

// ── 尾翼气流（S6）：经过尾翼的几层流线。drs＝活动片张开程度；wake＝尾翼后乱流程度 ──
export const wingFlow = new THREE.Group(); scene.add(wingFlow);
const WL = [5.6, 6.4, 7.2, 8.0, 8.8, 9.6, 10.4], WM = 26, WX0 = -12, WX1 = -44;
const wStreak = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .12, .12), top(new THREE.MeshBasicMaterial({ color: 0xffffff })), WL.length * WM);
wStreak.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(WL.length * WM * 3), 3); wStreak.renderOrder = 11; wStreak.frustumCulled = false; wingFlow.add(wStreak);
const mkArrow = (rot) => { const g = new THREE.Group(), m = top(new THREE.MeshBasicMaterial({ color: 0xffb454 })); const sh = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 1, 12).translate(0, .5, 0), m), hd = new THREE.Mesh(new THREE.ConeGeometry(.5, 1.1, 16).rotateX(Math.PI).translate(0, -.55, 0), m); sh.renderOrder = hd.renderOrder = 12; g.add(sh, hd); g.rotation.z = rot; wingFlow.add(g); return { g, sh, m }; };
const downA = mkArrow(0), backA = mkArrow(-Math.PI / 2);
const W_COOL = new THREE.Color(0x7fb2ff), W_DEAD = new THREE.Color(0x8a93a3);
/** 第 i 层在 x 处的高度：经过尾翼后被向上带（张开时少带） */
const wingY = (y0, x, drs) => { const near = Math.exp(-((y0 - 7.6) ** 2) / 4.5), past = clamp((-23.6 - x) / 4.5); return y0 + 2.4 * near * (1 - .75 * drs) * easeOut(past); };
export function wingState(t, { on = 0, drs = 0, wake = 0, down = 0, back = 0 }) {
  wingFlow.visible = on > .002; if (!wingFlow.visible) return;
  wStreak.material.opacity = on;
  const jit = Math.floor(t * 24); let k = 0;
  WL.forEach((y0, li) => {
    for (let p = 0; p < WM; p++) {
      const u = ((t * .62 + (p + hash(li * 5.3)) / WM) % 1), x = mix(WX0, WX1, u), d = .05;
      let y = wingY(y0, x, drs); const dy = (wingY(y0, x - d, drs) - wingY(y0, x + d, drs)) / (2 * d);
      const w = wake * (1 - drs) * clamp((-27.5 - x) / 2) * Math.exp(-((y0 - 7.8) ** 2) / 6);
      y += w * (hash(p * 7 + li * 13 + jit) - .5) * 2.2;
      _c.copy(W_COOL).lerp(W_DEAD, w);
      _e.set(0, 0, -Math.atan(dy) + w * (hash(p + jit) - .5) * 1.6); _q.setFromEuler(_e); _p.set(x, y, 0); _s.set(mix(.9, .4, w), 1, 1);
      _m.compose(_p, _q, _s); wStreak.setMatrixAt(k, _m); wStreak.setColorAt(k, _c); k++;
    }
  });
  wStreak.instanceMatrix.needsUpdate = true; wStreak.instanceColor.needsUpdate = true;
  downA.g.visible = down > .02; downA.m.opacity = on * down; downA.sh.scale.y = .6 + 2.6 * down; downA.g.position.set(-25.6, 12.6, 0);
  backA.g.visible = back > .02; backA.m.opacity = on * back; backA.sh.scale.y = .6 + 3.4 * back; backA.g.position.set(-31, 7.6, 0);
}
