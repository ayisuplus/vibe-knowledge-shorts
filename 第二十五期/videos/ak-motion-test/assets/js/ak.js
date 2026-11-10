// AK 剖面模型与一次射击循环的运动学。外形参考 AKM（游戏里最常见的样子），内部为示意，只做到「看得懂原理」。
// 坐标：单位厘米；x 指向枪口，y 向上，z 指向枪的右侧（镜头所在一侧）。原点在闭锁位的枪机面、枪管轴线上。
// 静止件切成左右两半：左半留下当背景，右半在开场剥离，露出内部。运动件完整保留。
// 依据：调研档案 F-3（活塞与枪机框一体）、F-4（转约 35°）、F-5（先自由行程再开锁）、F-6（抽壳＋抛壳）、F-8（分解顺序）。
import * as THREE from "three";
import { M, add, grp, box, ex, cylX, poly, root, AMBER } from "./world.js";
import { clamp, mix, ease, hash } from "./lib.js";

export const gun = grp(root);
const left = grp(gun), right = grp(gun);
export const peelGroup = right;
const peelMats = new Map(), peelMat = (m) => { if (!peelMats.has(m)) { const c = m.clone(); c.transparent = true; peelMats.set(m, c); } return peelMats.get(m); };

/** 侧面轮廓沿 z 挤出、厚 d；split 时左右各半，右半进剥离组 */
function slab(sh, d, mat, { split = true, bevel = .06, z = 0 } = {}) {
  if (!split) return add(gun, ex(sh, d, bevel), mat, 0, 0, z);
  const gL = ex(sh, d / 2, bevel); gL.translate(0, 0, z - d / 4); add(left, gL, mat);
  const gR = ex(sh, d / 2, bevel); gR.translate(0, 0, z + d / 4); add(right, gR, peelMat(mat));
}
/** 绕平行于 x 的轴旋转的回转体，profile 为 [半径, x]；a0/a1 为右半的角度范围（0 = 正上方，π/2 = 右侧），左半对称 */
function lathe(profile, mat, { y = 0, a0 = 0, a1 = Math.PI } = {}) {
  const pts = profile.map(([r, x]) => new THREE.Vector2(r, x));
  // LatheGeometry 绕 y 轴：顶点 (r sinφ, h, r cosφ)。转到 x 轴后 y' = -r sinφ，z = r cosφ；φ = -π/2 为正上方。
  const mk = (p0, len) => { const g = new THREE.LatheGeometry(pts, 48, p0, len); g.rotateZ(-Math.PI / 2); g.translate(0, y, 0); return g; };
  add(right, mk(-Math.PI / 2 + a0, a1 - a0), peelMat(mat));
  add(left, mk(Math.PI / 2 + (Math.PI - a1), a1 - a0), mat);
}

// ── 静止件 ──
// 枪管：内膛、弹膛、外形（示意）
lathe([[.4, 41.5], [.4, 5.6], [.57, 3.9], [.6, 0], [1.3, 0], [1.3, 6], [1.0, 10], [.9, 41.5], [.4, 41.5]], M.barrel);
lathe([[.42, 44.8], [.42, 41.5], [.98, 41.5], [.98, 44.8], [.42, 44.8]], M.black); // 枪口补偿器
// 导气管（轴线 y = 2.6）
export const TUBE_Y = 2.6;
lathe([[.75, 30.2], [.75, 7], [.95, 7], [.95, 30.2], [.75, 30.2]], M.recv, { y: TUBE_Y });
// 导气箍：前壁、气孔两侧的筋、下块（侧面轮廓把气孔通道留空）
slab(poly([[30.2, .9], [31, .9], [31, 3.75], [30.2, 3.75]]), 2.3, M.recv);
slab(poly([[28.4, .9], [29.15, .9], [29.75, 1.65], [28.4, 1.65]]), 2.3, M.recv);
slab(poly([[29.55, .9], [30.2, .9], [30.2, 1.65], [30.15, 1.65]]), 2.3, M.recv);
slab(poly([[28.4, 3.55], [30.2, 3.55], [30.2, 3.75], [28.4, 3.75]]), 2.3, M.recv);
slab(poly([[28.4, -.9], [31, -.9], [31, -1.6], [28.4, -1.6]]), 2.3, M.recv);
// 准星座
slab(poly([[36.6, .88], [39, .88], [39, 1.7], [38.2, 1.7], [38.0, 4.3], [37.6, 4.3], [37.4, 1.7], [36.6, 1.7]]), 2.2, M.recv);
slab(poly([[36.6, -.88], [39, -.88], [39, -1.5], [36.6, -1.5]]), 2.2, M.recv);
// 表尺座：给活塞杆留一个孔
{ const s = poly([[2, 1.25], [6.6, 1.25], [6.6, 3.5], [4.5, 3.9], [2, 3.9]]); const h = new THREE.Path(); h.absarc(4.3, TUBE_Y, .52, 0, Math.PI * 2, true); s.holes.push(h); slab(s, 2.6, M.recv); }
// 节套：枪机头部的套筒和下块
lathe([[1.22, 0], [1.22, -1.2], [1.48, -1.2], [1.48, 0], [1.22, 0]], M.recv);
slab(poly([[-1.2, -1.15], [2.6, -1.15], [2.6, -2.2], [-1.2, -2.2]]), 2.9, M.recv);
// 机匣：左右两块侧板、底板（留弹匣口）、后壁、带加强筋的机匣盖
add(left, box(25.6, 5.5, .12, .03), M.recv, -11.2, .45, -1.55);
add(right, box(25.6, 5.5, .12, .03), peelMat(M.recv), -11.2, .45, 1.55);
slab(poly([[-24, -2.2], [-11, -2.2], [-11, -2.45], [-24, -2.45]]), 3.2, M.recv);
slab(poly([[-2.6, -2.2], [2.6, -2.2], [2.6, -2.45], [-2.6, -2.45]]), 3.2, M.recv);
slab(poly([[-24.2, -2.45], [-23.5, -2.45], [-23.5, 3.2], [-24.2, 3.2]]), 3.2, M.recv);
slab(poly([[-23.8, 3.2], [1.2, 3.2], [1.6, 3.55], [-23.4, 3.9], [-23.8, 3.7]]), 3.3, M.recv, { bevel: .12 });
for (const x of [-20, -14, -8]) slab(poly([[x, 3.75], [x + 3.2, 3.68], [x + 3.2, 3.9], [x, 3.98]]), 1.2, M.recv, { bevel: .04 });
// 护木（木）：下护木包住枪管，上护木包住导气管
lathe([[1.35, 8], [1.35, 27], [1.85, 26.6], [2.05, 17], [1.9, 8.4], [1.35, 8]], M.wood, { a0: .75, a1: Math.PI });
lathe([[1.0, 9.2], [1.0, 24.6], [1.32, 24.2], [1.48, 16.5], [1.36, 9.6], [1.0, 9.2]], M.wood, { y: TUBE_Y, a0: 0, a1: Math.PI - .55 });
// 弹匣：弯的，前沿和后沿用二次曲线
const MAG_F = new THREE.QuadraticBezierCurve(new THREE.Vector2(-2.6, -2.2), new THREE.Vector2(-1.6, -12), new THREE.Vector2(4.2, -21.8));
const MAG_R = new THREE.QuadraticBezierCurve(new THREE.Vector2(-10.8, -2.2), new THREE.Vector2(-9.4, -12.5), new THREE.Vector2(-3.8, -22.6));
const MAG_C = new THREE.QuadraticBezierCurve(new THREE.Vector2(-6.7, -2.2), new THREE.Vector2(-5.5, -12.25), new THREE.Vector2(.2, -22.2));
{ const s = new THREE.Shape(MAG_F.getPoints(24).concat(MAG_R.getPoints(24).reverse())); s.closePath(); slab(s, 2.9, M.mag, { bevel: .2 }); }
// 不剖开的：枪托、握把、扳机护圈、扳机
slab(poly([[-24.2, 2.6], [-61, -.2], [-61, -12.5], [-27, -3.2], [-24.2, -2.4]]), 3.4, M.wood, { split: false, bevel: .55 });
slab(poly([[-61, -.2], [-62, -.2], [-62, -12.5], [-61, -12.5]]), 3.6, M.black, { split: false, bevel: .15 });
slab(poly([[-16.9, -2.3], [-20.3, -2.3], [-23.1, -11.4], [-21.7, -12.2], [-19.7, -12], [-17.1, -3.6]]), 2.8, M.grip, { split: false, bevel: .45 });
add(gun, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-11.1, -2.4], [-11.5, -4.4], [-13.8, -5], [-16.3, -4.4], [-17, -2.7]].map(([x, y]) => new THREE.Vector3(x, y, 0))), 40, .17, 8), M.black);
slab(poly([[-13.4, -2.4], [-12.9, -2.4], [-13.3, -3.7], [-14, -4.1], [-13.8, -3.6]]), .5, M.black, { split: false, bevel: .04 });

// ── 运动件 ──
export const SMAX = 11.8, FREE = 1.2, ROTL = 1.0, ROT = 35 * Math.PI / 180, PIN_X = -2.5, PIN_R = 1.75;
// 枪机框（与活塞杆一体）
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
// 拉机柄：在枪机框前端右侧，避开凸轮槽
add(carrier, new THREE.CylinderGeometry(.28, .28, 2.3, 24), M.move, 4.2, 2.45, 2.25).rotation.x = Math.PI / 2;
add(carrier, new THREE.CylinderGeometry(.55, .55, .7, 32), M.move, 4.2, 2.45, 3.5).rotation.x = Math.PI / 2;
// 枪机：本体、两个闭锁凸笋、导柱、抽壳钩
export const bolt = grp(gun);
add(bolt, cylX(.9, -6, 0), M.bolt);
add(bolt, cylX(.45, -8.2, -6), M.bolt);
export const lugs = [add(bolt, box(.7, .46, .42, .06), M.bolt, -.6, 0, 1.0), add(bolt, box(.7, .46, .42, .06), M.bolt, -.6, 0, -1.0)];
add(bolt, new THREE.CylinderGeometry(.2, .2, PIN_R - .7, 20), M.bolt, PIN_X, .7 + (PIN_R - .7) / 2 + .15, 0);
add(bolt, box(1.4, .24, .2, .04), M.black, -.6, .45, .78);
// 朝向镜头的一道刻线：枪机一转，它就往上走，转动一眼看得出
add(bolt, box(4.6, .16, .08, .03), M.black, -3.4, 0, .9);
// 复进簧与导杆（簧按长度缩放）
const SEAT = -23.5, springG = (() => { const N = 22, pts = []; for (let i = 0; i <= N * 18; i++) { const x = i / (N * 18), a = Math.PI * 2 * N * x; pts.push(new THREE.Vector3(x, .5 * Math.cos(a), .5 * Math.sin(a))); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * 30, .07, 6); })();
export const spring = add(gun, springG, M.spring, SEAT, 1.62, 0);
add(gun, cylX(.14, SEAT, SEAT + 13.5), M.spring, 0, 1.62, 0);

// ── 子弹：每一发是弹壳＋弹头两个独立的件（击发后分开） ──
const caseG = new THREE.LatheGeometry([[0, 0], [.565, 0], [.565, .14], [.48, .2], [.555, .3], [.5, 2.9], [.43, 3.2], [.43, 3.9], [0, 3.9]].map(([r, x]) => new THREE.Vector2(r, x)), 40).rotateZ(-Math.PI / 2);
const bulletG = new THREE.LatheGeometry([[0, 3.1], [.39, 3.1], [.39, 4.6], [.3, 5.2], [.1, 5.6], [0, 5.65]].map(([r, x]) => new THREE.Vector2(r, x)), 40).rotateZ(-Math.PI / 2);
const NR = 13;
export const rounds = Array.from({ length: NR }, () => ({ c: add(gun, caseG, M.brass), b: add(gun, bulletG, M.jacket) }));
for (const r of rounds) r.c.rotation.order = r.b.rotation.order = "YZX";

// ── 燃气（示意，加色发光，总在最上层） ──
const glowMat = (k) => new THREE.MeshBasicMaterial({ color: AMBER.clone().multiplyScalar(k), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, fog: false });
export const glowBore = add(gun, cylX(.37, 0, 1), glowMat(2.4), 0, 0, .05); glowBore.renderOrder = 5; glowBore.castShadow = false;
export const glowTube = add(gun, cylX(.7, 0, 1), glowMat(2.0), 0, TUBE_Y, .05); glowTube.renderOrder = 5; glowTube.castShadow = false;
export const PORT_A = new THREE.Vector3(29.35, .35, .05), PORT_B = new THREE.Vector3(29.95, 1.9, .05);
export const glowPort = add(gun, new THREE.CylinderGeometry(.19, .19, PORT_A.distanceTo(PORT_B), 20), glowMat(3), (PORT_A.x + PORT_B.x) / 2, (PORT_A.y + PORT_B.y) / 2, .05);
glowPort.rotation.z = -Math.atan2(PORT_B.x - PORT_A.x, PORT_B.y - PORT_A.y); glowPort.renderOrder = 5; glowPort.castShadow = false;

// ── 一次循环的运动学：u ∈ [0, 1] 对应真实的 0–100 ms（理论射速约 600 发/分，F-7） ──
const U0 = .010, U1 = .40, U2 = .42, U3 = .80, EXIT = .012;
export const sOf = (u) => u < U0 ? 0 : u < U1 ? SMAX * (1 - (1 - (u - U0) / (U1 - U0)) ** 2.2) : u < U2 ? SMAX : u < U3 ? SMAX * (1 - ((u - U2) / (U3 - U2)) ** 1.8) : 0;
export const thetaOf = (s) => ROT * ease((s - FREE) / ROTL);
export const boltXOf = (s) => -Math.max(0, s - FREE - ROTL);
const bulletBase = (u) => u < EXIT ? 3.1 + 38.4 * (u / EXIT) ** 1.6 : 41.5 + (u - EXIT) * 7150;
export const pressure = (u) => u < EXIT ? 1 : Math.exp(-(u - EXIT) / .005);
const tubeGas = (u) => u < .0095 ? 0 : clamp((u - .0095) / .0015) * (u < EXIT ? 1 : Math.exp(-(u - EXIT) / .01));
const EJECT_X = -7.2, UE = U0 + (1 - (1 - (FREE + ROTL - EJECT_X) / SMAX) ** (1 / 2.2)) * (U1 - U0);
export const U = { U0, U1, U2, U3, EXIT, UE };

// 弹匣里第 k 发（k ≥ 2）的姿态：沿弹匣中线排列，垂直于中线；第 1 发在弹匣口，等着被推进去
const P1 = { x: -9, y: -1.3, a: 0, z: 0 };
const magPose = (k) => {
  if (k <= 1) return P1;
  const t = .035 + (k - 2) * .052, c = MAG_C.getPoint(t), tg = MAG_C.getTangent(t), dx = -tg.y, dy = tg.x, a = Math.atan2(dy, dx);
  return { x: c.x - dx * 2.8, y: c.y - dy * 2.8, a, z: (k % 2 ? .3 : -.3) };
};
const lerpPose = (A, B, p) => ({ x: mix(A.x, B.x, p), y: mix(A.y, B.y, p), a: mix(A.a, B.a, p), z: mix(A.z, B.z, p) });
const put = (m, x, y, z, a, show = true) => { m.visible = show; m.position.set(x, y, z); m.rotation.set(0, 0, a); };

/**
 * 机械状态。c：第几次循环（第 c 发在膛里被击发）；u：该循环的进度；flightDt(j)：第 j 发弹壳被抛出后经过的真实秒数（无则 null）。
 * 返回给 HUD 用的几个量。
 */
export function machine(c, u, flightDt) {
  const s = sOf(u), th = thetaOf(s), bx = boltXOf(s);
  carrier.position.x = -s; bolt.position.x = bx; bolt.rotation.x = -th;
  spring.scale.x = (-6 - s) - SEAT;
  // 第 c+1 发：先被压在枪机下面，枪机退过它就抬起，回来时被枪机面推着爬进弹膛
  const feedRear = u >= U2 && bx >= P1.x ? bx : P1.x;
  const lift = ease((feedRear + 5) / 2.5);
  const pressed = (bx > P1.x + .2 && feedRear === P1.x) ? 1 : 0;
  for (let j = 0; j < NR; j++) {
    const r = rounds[j];
    if (j < c || (j === c && flightDt(j) !== null)) { // 已经抛出的弹壳
      const dt = flightDt(j); r.b.visible = false;
      if (dt === null || dt > .6) { r.c.visible = false; continue; }
      const x0 = EJECT_X + 1.95, vx = 40 + 30 * hash(j), vy = 220 + 40 * hash(j + 3), vz = 330;
      r.c.visible = true; r.c.position.set(x0 + vx * dt - 1.95, vy * dt - 490 * dt * dt, vz * dt);
      r.c.rotation.set(0, -dt * 30 * 6.283 * .35, dt * 22 * 6.283);
      continue;
    }
    if (j === c) { // 膛里这一发：弹头沿枪管飞走，弹壳跟着枪机面退出来
      put(r.c, bx, 0, 0, 0); const bb = bulletBase(u); put(r.b, bb - 3.1, 0, 0, 0, bb < 60); continue;
    }
    if (j === c + 1) {
      const p = ease((feedRear + 8) / 5.2), y = mix(P1.y - .2 * pressed, 0, p), a = .16 * Math.sin(Math.PI * p);
      put(r.c, feedRear, y, 0, a); put(r.b, feedRear, y, 0, a); continue;
    }
    const k = j - c; if (k > 10) { r.c.visible = r.b.visible = false; continue; }
    const P = lerpPose(magPose(k), magPose(k - 1), lift), y = P.y - (k === 2 ? .2 * lift * pressedOver(bx) : 0);
    put(r.c, P.x, y, P.z, P.a); put(r.b, P.x, y, P.z, P.a);
  }
  // 燃气
  const bb = Math.min(bulletBase(u), 41.5), pb = pressure(u) * (u > 0 ? 1 : 0), pt = tubeGas(u);
  glowBore.visible = pb > .01; glowBore.position.x = .6; glowBore.scale.x = Math.max(.01, bb - .6); glowBore.material.opacity = .85 * pb;
  const pp = bulletBase(u) > PORT_A.x ? pt : 0; glowPort.visible = pp > .01; glowPort.material.opacity = .9 * pp;
  const hx = 28.9 - s; glowTube.visible = pt > .01; glowTube.position.x = hx; glowTube.scale.x = Math.max(.01, 30.2 - hx); glowTube.material.opacity = .75 * pt;
  return { s, th, bx, pressure: pb };
}
const pressedOver = (bx) => bx > P1.x + .2 ? 1 : 0;

export function peel(p) {
  right.visible = p < 1; right.position.set(0, 9 * p, 34 * p);
  for (const m of peelMats.values()) { m.opacity = 1 - ease(p * 1.15); m.depthWrite = p < .3; }
}
