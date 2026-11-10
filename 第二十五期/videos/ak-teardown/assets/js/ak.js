// AK 模型与一次射击循环的运动学。外形参考 AKM（游戏里最常见的样子），内部为示意，只做到「看得懂原理」。
// 坐标：单位厘米；x 指向枪口，y 向上，z 指向枪的右侧（镜头所在一侧）。原点在闭锁位的枪机面、枪管轴线上。
// 静止件切成左右两半：右半可以剥离（剖面），左半留下当背景。可分解的件各自成组：弹匣、机匣盖、复进簧、枪机框（连活塞）、枪机。
// 依据：调研档案 F-3（活塞与枪机框一体）、F-4（转约 35°）、F-5（先自由行程再开锁）、F-6（抽壳＋抛壳）、F-8（分解顺序）。
import * as THREE from "three";
import { M, add, grp, box, ex, cylX, poly, root, AMBER } from "./world.js";
import { clamp, mix, ease, hash } from "./lib.js";

export const gun = grp(root);
export const body = grp(gun), wallL = grp(body), mag = grp(gun), cover = grp(gun), springG = grp(gun);
const RIGHT = [], peelMats = new Map();
const peelMat = (m) => { if (!peelMats.has(m)) { const c = m.clone(); c.transparent = true; peelMats.set(m, c); } return peelMats.get(m); };
const reg = (m) => { RIGHT.push({ m, base: m.position.clone() }); return m; };

/** 侧面轮廓沿 z 挤出、厚 d；split 时左右各半，右半可剥离 */
function slab(parent, sh, d, mat, { split = true, bevel = .06 } = {}) {
  if (!split) return add(parent, ex(sh, d, bevel), mat);
  const gL = ex(sh, d / 2, bevel); gL.translate(0, 0, -d / 4); add(parent, gL, mat);
  const gR = ex(sh, d / 2, bevel); gR.translate(0, 0, d / 4); reg(add(parent, gR, peelMat(mat)));
}
/** 绕平行于 x 的轴旋转的回转体，profile 为 [半径, x]；a0/a1 为右半的角度范围（0 = 正上方，π/2 = 右侧），左半对称 */
function lathe(parent, profile, mat, { y = 0, a0 = 0, a1 = Math.PI } = {}) {
  const pts = profile.map(([r, x]) => new THREE.Vector2(r, x));
  // LatheGeometry 绕 y 轴：顶点 (r sinφ, h, r cosφ)。转到 x 轴后 y' = -r sinφ，z = r cosφ；φ = -π/2 为正上方。
  const mk = (p0, len) => { const g = new THREE.LatheGeometry(pts, 48, p0, len); g.rotateZ(-Math.PI / 2); g.translate(0, y, 0); return g; };
  reg(add(parent, mk(-Math.PI / 2 + a0, a1 - a0), peelMat(mat)));
  add(parent, mk(Math.PI / 2 + (Math.PI - a1), a1 - a0), mat);
}

// ── 枪身（静止件） ──
lathe(body, [[.4, 41.5], [.4, 5.6], [.57, 3.9], [.6, 0], [1.3, 0], [1.3, 6], [1.0, 10], [.9, 41.5], [.4, 41.5]], M.barrel);
lathe(body, [[.42, 44.8], [.42, 41.5], [.98, 41.5], [.98, 44.8], [.42, 44.8]], M.black); // 枪口补偿器
export const TUBE_Y = 2.6;
lathe(body, [[.75, 30.2], [.75, 7], [.95, 7], [.95, 30.2], [.75, 30.2]], M.recv, { y: TUBE_Y });
slab(body, poly([[30.2, .9], [31, .9], [31, 3.75], [30.2, 3.75]]), 2.3, M.recv);
slab(body, poly([[28.4, .9], [29.15, .9], [29.75, 1.65], [28.4, 1.65]]), 2.3, M.recv);
slab(body, poly([[29.55, .9], [30.2, .9], [30.2, 1.65], [30.15, 1.65]]), 2.3, M.recv);
slab(body, poly([[28.4, 3.55], [30.2, 3.55], [30.2, 3.75], [28.4, 3.75]]), 2.3, M.recv);
slab(body, poly([[28.4, -.9], [31, -.9], [31, -1.6], [28.4, -1.6]]), 2.3, M.recv);
slab(body, poly([[36.6, .88], [39, .88], [39, 1.7], [38.2, 1.7], [38.0, 4.3], [37.6, 4.3], [37.4, 1.7], [36.6, 1.7]]), 2.2, M.recv);
slab(body, poly([[36.6, -.88], [39, -.88], [39, -1.5], [36.6, -1.5]]), 2.2, M.recv);
{ const s = poly([[2, 1.25], [6.6, 1.25], [6.6, 3.5], [4.5, 3.9], [2, 3.9]]); const h = new THREE.Path(); h.absarc(4.3, TUBE_Y, .52, 0, Math.PI * 2, true); s.holes.push(h); slab(body, s, 2.6, M.recv); }
lathe(body, [[1.22, 0], [1.22, -1.2], [1.48, -1.2], [1.48, 0], [1.22, 0]], M.recv);
slab(body, poly([[-1.2, -1.15], [2.6, -1.15], [2.6, -2.2], [-1.2, -2.2]]), 2.9, M.recv);
// 机匣：左侧板（连导轨，可在第五段「夸大间隙」时外移）、右侧板、底板（留弹匣口）、后壁
add(wallL, box(25.6, 5.5, .12, .03), M.recv, -11.2, .45, -1.55);
add(wallL, box(23, .22, .36, .05), M.recv, -11.5, .82, -1.37);
reg(add(body, box(25.6, 5.5, .12, .03), peelMat(M.recv), -11.2, .45, 1.55));
reg(add(body, box(23, .22, .36, .05), peelMat(M.recv), -11.5, .82, 1.37));
slab(body, poly([[-24, -2.2], [-11, -2.2], [-11, -2.45], [-24, -2.45]]), 3.2, M.recv);
slab(body, poly([[-2.6, -2.2], [2.6, -2.2], [2.6, -2.45], [-2.6, -2.45]]), 3.2, M.recv);
slab(body, poly([[-24.2, -2.45], [-23.5, -2.45], [-23.5, 3.2], [-24.2, 3.2]]), 3.2, M.recv);
// 护木（木）
lathe(body, [[1.35, 8], [1.35, 27], [1.85, 26.6], [2.05, 17], [1.9, 8.4], [1.35, 8]], M.wood, { a0: .75, a1: Math.PI });
lathe(body, [[1.0, 9.2], [1.0, 24.6], [1.32, 24.2], [1.48, 16.5], [1.36, 9.6], [1.0, 9.2]], M.wood, { y: TUBE_Y, a0: 0, a1: Math.PI - .55 });
// 不剖开的：枪托、握把、扳机护圈、扳机
slab(body, poly([[-24.2, 2.6], [-61, -.2], [-61, -12.5], [-27, -3.2], [-24.2, -2.4]]), 3.4, M.wood, { split: false, bevel: .55 });
slab(body, poly([[-61, -.2], [-62, -.2], [-62, -12.5], [-61, -12.5]]), 3.6, M.black, { split: false, bevel: .15 });
slab(body, poly([[-16.9, -2.3], [-20.3, -2.3], [-23.1, -11.4], [-21.7, -12.2], [-19.7, -12], [-17.1, -3.6]]), 2.8, M.grip, { split: false, bevel: .45 });
add(body, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-11.1, -2.4], [-11.5, -4.4], [-13.8, -5], [-16.3, -4.4], [-17, -2.7]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 40, .17, 8), M.black);
slab(body, poly([[-13.4, -2.4], [-12.9, -2.4], [-13.3, -3.7], [-14, -4.1], [-13.8, -3.6]]), .5, M.black, { split: false, bevel: .04 });

// ── 机匣盖（带加强筋） ──
slab(cover, poly([[-23.8, 3.2], [1.2, 3.2], [1.6, 3.55], [-23.4, 3.9], [-23.8, 3.7]]), 3.3, M.recv, { bevel: .12 });
for (const x of [-20, -14, -8]) slab(cover, poly([[x, 3.75], [x + 3.2, 3.68], [x + 3.2, 3.9], [x, 3.98]]), 1.2, M.recv, { bevel: .04 });

// ── 弹匣：弯的，前沿和后沿用二次曲线 ──
export const MAG_PIVOT = [-2.6, -2.2];
const MAG_F = new THREE.QuadraticBezierCurve(new THREE.Vector2(-2.6, -2.2), new THREE.Vector2(-1.6, -12), new THREE.Vector2(4.2, -21.8));
const MAG_R = new THREE.QuadraticBezierCurve(new THREE.Vector2(-10.8, -2.2), new THREE.Vector2(-9.4, -12.5), new THREE.Vector2(-3.8, -22.6));
const MAG_C = new THREE.QuadraticBezierCurve(new THREE.Vector2(-6.7, -2.2), new THREE.Vector2(-5.5, -12.25), new THREE.Vector2(.2, -22.2));
{ const s = new THREE.Shape(MAG_F.getPoints(24).concat(MAG_R.getPoints(24).reverse())); s.closePath(); slab(mag, s, 2.9, M.mag, { bevel: .2 }); }

// ── 运动件 ──
export const SMAX = 11.8, FREE = 1.2, ROTL = 1.0, ROT = 35 * Math.PI / 180, PIN_X = -2.5, PIN_R = 1.75;
export const carrier = grp(gun);
{
  const s = poly([[-6, .98], [2.6, .98], [3.4, 1.5], [5.2, 1.95], [5.2, 3.05], [3.0, 3.05], [2.4, 2.3], [-6, 2.3]]);
  // 凸轮槽：枪机上的导柱在框里走的路径——先平走（自由行程），再沿弧线下压（枪机转动）
  const up = [], dn = [], w = .26;
  for (let i = 0; i <= 24; i++) { const sv = -.25 + (FREE + ROTL + .5) * i / 24, y = PIN_R * Math.cos(ROT * ease((sv - FREE) / ROTL)); up.push([PIN_X + sv, y + w]); dn.push([PIN_X + sv, y - w]); }
  const h = new THREE.Path(); h.moveTo(...up[0]); for (const p of up.slice(1)) h.lineTo(...p); for (const p of dn.reverse()) h.lineTo(...p); h.closePath(); s.holes.push(h);
  add(carrier, ex(s, 2.2, .07), M.move);
}
export const piston = add(carrier, cylX(.45, 5, 27.4), M.move, 0, TUBE_Y, 0);
add(carrier, cylX(.72, 27.4, 28.9), M.move, 0, TUBE_Y, 0);
for (const x of [27.8, 28.3]) add(carrier, cylX(.735, x, x + .12), M.black, 0, TUBE_Y, 0);
add(carrier, new THREE.CylinderGeometry(.28, .28, 2.3, 24), M.move, 4.2, 2.45, 2.25).rotation.x = Math.PI / 2;
export const handleKnob = add(carrier, new THREE.CylinderGeometry(.55, .55, .7, 32), M.move, 4.2, 2.45, 3.5); handleKnob.rotation.x = Math.PI / 2;
// 活塞杆上的一道亮光（第三段主角亮相时从尾走到头）
export const pistonGlow = add(carrier, cylX(.47, 0, 1), new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(2.2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }), 5, TUBE_Y, 0);
pistonGlow.castShadow = false;
export const bolt = grp(gun);
add(bolt, cylX(.9, -6, 0), M.bolt);
add(bolt, cylX(.45, -8.2, -6), M.bolt);
export const lugs = [add(bolt, box(.7, .46, .42, .06), M.bolt, -.6, 0, 1.0), add(bolt, box(.7, .46, .42, .06), M.bolt, -.6, 0, -1.0)];
add(bolt, new THREE.CylinderGeometry(.2, .2, PIN_R - .7, 20), M.bolt, PIN_X, .7 + (PIN_R - .7) / 2 + .15, 0);
add(bolt, box(1.4, .24, .2, .04), M.black, -.6, .45, .78);
add(bolt, box(4.6, .16, .08, .03), M.black, -3.4, 0, .9); // 朝镜头的刻线：一转就往上走
export const SEAT = -23.5;
const springGeo = (() => { const N = 22, pts = []; for (let i = 0; i <= N * 18; i++) { const x = i / (N * 18), a = Math.PI * 2 * N * x; pts.push(new THREE.Vector3(x, .5 * Math.cos(a), .5 * Math.sin(a))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 30, .07, 6); })();
export const spring = add(springG, springGeo, M.spring, SEAT, 1.62, 0);
add(springG, cylX(.14, SEAT, SEAT + 13.5), M.spring, 0, 1.62, 0);
add(springG, cylX(.3, SEAT - .2, SEAT + .3), M.recv, 0, 1.62, 0); // 导杆尾端（按钮）

// ── 子弹：每一发是弹壳＋弹头两个独立的件 ──
const caseG = new THREE.LatheGeometry([[0, 0], [.565, 0], [.565, .14], [.48, .2], [.555, .3], [.5, 2.9], [.43, 3.2], [.43, 3.9], [0, 3.9]].map(([r, x]) => new THREE.Vector2(r, x)), 40).rotateZ(-Math.PI / 2);
const bulletG = new THREE.LatheGeometry([[0, 3.1], [.39, 3.1], [.39, 4.6], [.3, 5.2], [.1, 5.6], [0, 5.65]].map(([r, x]) => new THREE.Vector2(r, x)), 40).rotateZ(-Math.PI / 2);
const NR = 13;
export const rounds = Array.from({ length: NR }, () => ({ c: add(gun, caseG, M.brass), b: add(gun, bulletG, M.jacket) }));
for (const r of rounds) r.c.rotation.order = r.b.rotation.order = "YZX";

// ── 燃气（示意，加色发光，总在最上层） ──
const glowMat = (k) => new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, fog: false });
export const glowBore = add(gun, cylX(.37, 0, 1), glowMat(2.4), 0, 0, .05);
export const glowTube = add(gun, cylX(.7, 0, 1), glowMat(2.0), 0, TUBE_Y, .05);
export const PORT_A = new THREE.Vector3(29.35, .35, .05), PORT_B = new THREE.Vector3(29.95, 1.9, .05);
export const glowPort = add(gun, new THREE.CylinderGeometry(.19, .19, PORT_A.distanceTo(PORT_B), 20), glowMat(3), (PORT_A.x + PORT_B.x) / 2, (PORT_A.y + PORT_B.y) / 2, .05);
glowPort.rotation.z = -Math.atan2(PORT_B.x - PORT_A.x, PORT_B.y - PORT_A.y);
const GLOWS = [glowBore, glowTube, glowPort, pistonGlow];
for (const g of [glowBore, glowTube, glowPort]) { g.renderOrder = 5; g.castShadow = g.receiveShadow = false; }

// ── 一次循环的运动学：u ∈ [0, 1] 对应真实的 0–100 ms（理论射速约 600 发/分，F-7） ──
const U0 = .010, U1 = .40, U2 = .42, U3 = .80, EXIT = .012;
export const sOf = (u) => u < U0 ? 0 : u < U1 ? SMAX * (1 - (1 - (u - U0) / (U1 - U0)) ** 2.2) : u < U2 ? SMAX : u < U3 ? SMAX * (1 - ((u - U2) / (U3 - U2)) ** 1.8) : 0;
export const thetaOf = (s) => ROT * ease((s - FREE) / ROTL);
export const boltXOf = (s) => -Math.max(0, s - FREE - ROTL);
const bulletBase = (u) => u < EXIT ? 3.1 + 38.4 * (u / EXIT) ** 1.6 : 41.5 + (u - EXIT) * 7150;
export const pressure = (u) => u < EXIT ? 1 : Math.exp(-(u - EXIT) / .005);
const tubeGas = (u) => u < .0095 ? 0 : clamp((u - .0095) / .0015) * (u < EXIT ? 1 : Math.exp(-(u - EXIT) / .01));
const EJECT_X = -7.2;
export const U = { U0, U1, U2, U3, EXIT, UE: U0 + (1 - (1 - (FREE + ROTL - EJECT_X) / SMAX) ** (1 / 2.2)) * (U1 - U0) };

// 弹匣里第 k 发（k ≥ 2）沿弹匣中线排列；第 1 发在弹匣口，等着被推进去
const P1 = { x: -9, y: -1.3, a: 0, z: 0 };
const magPose = (k) => {
  if (k <= 1) return P1;
  const t = .035 + (k - 2) * .052, c = MAG_C.getPoint(t), tg = MAG_C.getTangent(t), dx = -tg.y, dy = tg.x;
  return { x: c.x - dx * 2.8, y: c.y - dy * 2.8, a: Math.atan2(dy, dx), z: (k % 2 ? .3 : -.3) };
};
const lerpPose = (A, B, p) => ({ x: mix(A.x, B.x, p), y: mix(A.y, B.y, p), a: mix(A.a, B.a, p), z: mix(A.z, B.z, p) });
const put = (m, x, y, z, a, show = true) => { m.visible = show; m.position.set(x, y, z); m.rotation.set(0, 0, a); };
const pressedOver = (bx) => bx > P1.x + .2 ? 1 : 0;

/**
 * 机械状态。c：第几次循环（第 c 发在膛里）；u：循环进度；flightDt(j)：第 j 发被抛出后经过的真实秒数（无则 null）。
 * opt.fired=false：不击发（拉机柄清空），整发子弹被抽出抛出；opt.rounds=false：不显示子弹；opt.feed=false：不供弹。
 */
export function machine(c, u, flightDt, { fired = true, rounds: showR = true, feed = true } = {}) {
  const s = fired || u > 0 ? sOf(u) : 0, th = thetaOf(s), bx = boltXOf(s);
  carrier.position.set(-s, 0, 0); carrier.rotation.set(0, 0, 0);
  bolt.position.set(bx, 0, 0); bolt.rotation.set(-th, 0, 0);
  spring.scale.x = (-6 - s) - SEAT;
  const feedRear = u >= U2 && bx >= P1.x ? bx : P1.x, lift = ease((feedRear + 5) / 2.5), pressed = (bx > P1.x + .2 && feedRear === P1.x) ? 1 : 0;
  for (let j = 0; j < NR; j++) {
    const r = rounds[j];
    if (!showR || (!feed && j > c)) { r.c.visible = r.b.visible = false; continue; }
    const dt = flightDt(j);
    if (j < c || (j === c && dt !== null)) { // 已经抛出的
      if (dt === null || dt > .6) { r.c.visible = r.b.visible = false; continue; }
      const vx = 40 + 30 * hash(j), vy = 220 + 40 * hash(j + 3), vz = 330;
      put(r.c, EJECT_X + vx * dt, vy * dt - 490 * dt * dt, vz * dt, 0); r.c.rotation.set(0, -dt * 30 * 6.283 * .35, dt * 22 * 6.283);
      if (fired) r.b.visible = false; else { r.b.visible = true; r.b.position.copy(r.c.position); r.b.rotation.copy(r.c.rotation); }
      continue;
    }
    if (j === c) { put(r.c, bx, 0, 0, 0); if (fired) { const bb = bulletBase(u); put(r.b, bb - 3.1, 0, 0, 0, bb < 60); } else put(r.b, bx, 0, 0, 0); continue; }
    if (j === c + 1) { const p = ease((feedRear + 8) / 5.2), y = mix(P1.y - .2 * pressed, 0, p), a = .16 * Math.sin(Math.PI * p); put(r.c, feedRear, y, 0, a); put(r.b, feedRear, y, 0, a); continue; }
    const k = j - c; if (k > 10) { r.c.visible = r.b.visible = false; continue; }
    const P = lerpPose(magPose(k), magPose(k - 1), lift), y = P.y - (k === 2 ? .2 * lift * pressedOver(bx) : 0);
    put(r.c, P.x, y, P.z, P.a); put(r.b, P.x, y, P.z, P.a);
  }
  const live = fired && u > 0, bb = Math.min(bulletBase(u), 41.5), pb = live ? pressure(u) : 0, pt = live ? tubeGas(u) : 0;
  glowBore.visible = pb > .01; glowBore.position.x = .6; glowBore.scale.x = Math.max(.01, bb - .6); glowBore.material.opacity = .85 * pb;
  const pp = live && bulletBase(u) > PORT_A.x ? pt : 0; glowPort.visible = pp > .01; glowPort.material.opacity = .9 * pp;
  const hx = 28.9 - s; glowTube.visible = pt > .01; glowTube.position.x = hx; glowTube.scale.x = Math.max(.01, 30.2 - hx); glowTube.material.opacity = .75 * pt;
  return { s, th, bx, pressure: pb };
}

/** 剖面：0 = 完整，1 = 右半全部剥离 */
export function peel(p) {
  for (const { m, base } of RIGHT) { m.visible = p < 1; m.position.set(base.x, base.y + 9 * p, base.z + 34 * p); }
  for (const m of peelMats.values()) { m.opacity = 1 - ease(p * 1.15); m.depthWrite = p < .3; }
}

// ── 图纸（第五段末）：每个件的轮廓线，向右擦出 ──
export const wipe = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -100);
const LINE = new THREE.LineBasicMaterial({ color: new THREE.Color(.55, .82, 1), transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [wipe] });
const MATS = new Set();
gun.traverse((o) => {
  if (!o.isMesh || GLOWS.includes(o)) return;
  MATS.add(o.material);
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 28), LINE); l.visible = false; o.add(l);
});
const LINES = []; gun.traverse((o) => { if (o.isLineSegments) LINES.push(o); });
/** b：图纸程度（≥ .5 时实体隐藏、只剩线）；x：擦出到哪 */
export function blueprint(b, x) {
  for (const m of MATS) m.visible = b < .5;
  LINE.opacity = b < .5 ? 0 : .9; for (const l of LINES) l.visible = b >= .5; wipe.constant = x;
}
