// 六段的画面状态：每个件的位姿、剖面、图纸、沙粒、镜头。全是拍 n（和秒 t）的纯函数，不留累积量。
import * as THREE from "three";
import { scene, camera, BG, M, root } from "./world.js";
import { B, WARP, RACK, REAL, SWEEP } from "./beats.js";
import { clamp, mix, mixV, ease, easeIn, easeOut, clunk, hash } from "./lib.js";
import { machine, peel, blueprint, gun, mag, cover, springG, carrier, bolt, spring, pistonGlow, wallL, rounds, handleKnob, MAG_PIVOT, U, sOf, thetaOf, boltXOf, SMAX, SEAT, ROT } from "./ak.js";

/** 分段线性插值：keys = [[n, v], ...] */
export const pw = (keys, n) => { if (n <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) { const [a, ua] = keys[i - 1], [b, ub] = keys[i]; if (n < b) return mix(ua, ub, (n - a) / (b - a)); } return keys[keys.length - 1][1]; };
const seg = (n, a, b) => ease((n - a) / (b - a));
const lerp3 = (A, B, p) => mixV(A, B, p);
/** 第 n 拍反查：分段线性的 keys 到达 v 时的拍 */
const inv = (keys, v) => { for (let i = 1; i < keys.length; i++) { const [a, ua] = keys[i - 1], [b, ub] = keys[i]; if (v <= ub) return mix(a, b, (v - ua) / (ub - ua)); } return keys[keys.length - 1][0]; };
const N_EJECT_RACK = inv(RACK, U.UE);

/** 绕枢轴 (px, py) 转 rz，再平移 d */
function pose(g, d, rz = 0, [px, py] = [0, 0]) {
  const c = Math.cos(rz), s = Math.sin(rz);
  g.rotation.set(0, 0, rz); g.position.set(px - (px * c - py * s) + d[0], py - (px * s + py * c) + d[1], d[2]);
}

// ── 平铺（第三段）时各件的位置；第六段合体前的炸开位置 ──
const LAY = { mag: [22, -3, 0], cover: [0, 9, 0], spring: [28, 9.5, 0], car: [-4, 16.5, 0], bolt: [-22, 17, 0] };
const EXP = { mag: [16, -12, 8], cover: [0, 10, 6], spring: [-10, 9, 5], car: [4, 12, 10], bolt: [-14, 15, 12] };
const COVER_PIV = [-23.8, 3.5];

function magState(n) {
  if (n < 12) return pose(mag, [0, 0, 0]);
  if (n < 46) {
    const rz0 = .32 * clamp(clunk(n, 12, .6), 0, 1.2), dr = easeIn((n - 12.6) / 1.2), d0 = [3 * dr, -8 * dr, 0], p = seg(n, 30, 34);
    return pose(mag, lerp3(d0, LAY.mag, p), mix(rz0, 0, p), MAG_PIVOT);
  }
  if (n < 113) { const p = seg(n, 46, 49); return pose(mag, lerp3(LAY.mag, [0, 0, 0], p), 0, MAG_PIVOT); }
  const h = seg(n, 123.6, 124.4), r = n < 124.4 ? .32 : .32 * (1 - clamp(clunk(n, 124.4, .6), 0, 1.15));
  pose(mag, lerp3(EXP.mag, [0, 0, 0], h), r, MAG_PIVOT);
}
function coverState(n) {
  cover.visible = !(n >= 84 && n < 103.6);
  if (n < 17) return pose(cover, [0, 0, 0]);
  if (n < 46) { const l = ease((n - 17.2) / 1.2), p = seg(n, 30, 34); return pose(cover, lerp3([-.5 * l, 5 * l, 0], LAY.cover, p), mix(-.1 * l, 0, p), COVER_PIV); }
  if (n < 113) return pose(cover, lerp3(LAY.cover, [0, 0, 0], seg(n, 46, 49)), 0, COVER_PIV);
  const p = clamp(clunk(n, 118.6, 1.4), 0, 1.1); pose(cover, lerp3(EXP.cover, [0, 0, 0], p), mix(-.12, 0, p), COVER_PIV);
}
/** 返回复进簧是否装在枪里 */
function springState(n) {
  if (n < 21) { pose(springG, [0, 0, 0]); return true; }
  if (n < 46) { const a = ease((n - 21) / .4), b = ease((n - 21.4) / 1.2), p = seg(n, 30, 34); pose(springG, lerp3([.5 * a - 5.5 * b, 3.5 * b, 0], LAY.spring, p)); return false; }
  if (n < 113) { const p = seg(n, 46, 49); pose(springG, lerp3(LAY.spring, [0, 0, 0], p)); return p >= 1; }
  const p = clamp(clunk(n, 117, 1.6), 0, 1.1); pose(springG, lerp3(EXP.spring, [0, 0, 0], p)); return n >= 118.6;
}
const setBolt = (x, y, z, rx) => { bolt.position.set(x, y, z); bolt.rotation.set(rx, 0, 0); };
const setCar = (x, y, z, rx = 0) => { carrier.position.set(x, y, z); carrier.rotation.set(rx, 0, 0); };
/** 枪机框在枪里、拉到 s 时枪机跟着它 */
const inGun = (s, dz = 0, ry = 0) => { setCar(-s, 0, dz); carrier.rotation.y = ry; setBolt(boltXOf(s), 0, 0, -thetaOf(s)); };

// ── 第三段：主角亮相时压暗其余零件的幕 ──
const dim = new THREE.Mesh(new THREE.PlaneGeometry(600, 300), new THREE.MeshBasicMaterial({ color: 0x020305, transparent: true, opacity: 0, depthWrite: false }));
dim.position.set(-8, 0, 6); dim.renderOrder = 2; gun.add(dim);

// ── 第五段：缝里的沙粒（示意） ──
const NG = 110, grains = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshPhysicalMaterial({ color: 0xb59a6a, roughness: .85, metalness: 0 }), NG);
grains.castShadow = grains.receiveShadow = true; grains.frustumCulled = false; gun.add(grains);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
function sand(n, t) {
  grains.visible = n >= 86 && n < 103.6; if (!grains.visible) return;
  for (let i = 0; i < NG; i++) {
    const r = .09 + .12 * hash(i * 3.7), n0 = 87.5 + 7 * hash(i + 3), dt = Math.max(0, (n - n0) * 60 / 112.96);
    const x = -13 + 11 * hash(i + 11), z = -1.25 - .38 * hash(i + 7), y0 = 6 + 3 * hash(i + 5);
    // 落在弹匣口上方的直接穿过去掉出枪外，其余落在机匣底板上
    const floor = x > -10.6 && x < -2.8 ? -60 : -2.2 + r;
    let y = y0 - .5 * 70 * dt * dt; if (y < floor) { const tl = Math.sqrt(2 * (y0 - floor) / 70), u = dt - tl; y = floor + Math.max(0, 1.6 * u - 35 * u * u) * .5; }
    _e.set(dt * 3 * hash(i), dt * 4 * hash(i + 1), 0); _q.setFromEuler(_e);
    _m.compose(_p.set(x, n < n0 ? 99 : y, z), _q, _s.set(r, r * (.7 + .4 * hash(i + 2)), r)); grains.setMatrixAt(i, _m);
  }
  grains.instanceMatrix.needsUpdate = true;
}

// ── 弹壳飞行时间（真实秒） ──
const END_SLOW = WARP[WARP.length - 1][0], N_EJECT_S4 = inv(WARP, U.UE);
const flightRack = (n, t) => (j) => j === 0 && n >= N_EJECT_RACK ? t - B(N_EJECT_RACK) : null;
const flightS4 = (n, t, c, u) => (j) => {
  if (j === 0) { if (n < N_EJECT_S4) return null; return n < END_SLOW ? .1 * (u - U.UE) : .1 * (1 - U.UE) + (t - B(END_SLOW)); }
  if (j === 1 && c === 1) return u < U.UE ? null : .1 * (u - U.UE) + Math.max(0, t - B(REAL) - .1);
  return null;
};
const none = () => null;

/** 第四段的循环：第几发、进度 */
export const cycle = (n, t) => n < REAL ? { c: 0, u: pw(WARP, n) } : { c: 1, u: clamp((t - B(REAL)) / .1) };

/** 全部机械与剖面状态；返回 HUD 要用的量 */
export function machineState(n, t) {
  gun.visible = true; viewmodel(n);
  magState(n); coverState(n); const springIn = springState(n);
  let st = { pressure: 0 };
  // 剖面：第四段剥开，第五段保持，图纸和合体时完整
  peel(n < 46 || n >= 103.6 ? 0 : ease((n - 46.3) / 2.4));
  wallL.position.z = n >= 84 && n < 103.6 ? -.5 * seg(n, 86, 89) : 0;
  pistonGlow.material.opacity = 0;
  if (n < 24) { st = machine(0, n < 14 ? 0 : pw(RACK, n), flightRack(n, t), { fired: false, feed: false }); }
  else if (n < 46) {
    machine(0, 0, flightRack(n, t), { fired: false, feed: false, rounds: false });
    if (n < 30) {
      const s = SMAX * ease(n - 24), l = ease(n - 25), tw = .5 * ease((n - 27) / .8), out = ease(n - 28);
      setCar(-s, 5 * l, 0); setBolt(boltXOf(s) + 8 * out, 5 * l + 1.5 * out, 0, -thetaOf(s) - tw);
    } else {
      const p = seg(n, 30, 34), h = seg(n, 37, 38.5), spin = 2 * Math.PI * seg(n, 38.5, 44.5);
      // 绕枪机框自身的长轴（y ≈ 2）转一圈，而不是绕枪管轴线
      const c0 = lerp3([-SMAX, 5, 0], LAY.car, p), c1 = lerp3(c0, [-8, 14, 12], h); setCar(c1[0], c1[1] + 2 - 2 * Math.cos(spin), c1[2] - 2 * Math.sin(spin), spin);
      setBolt(...lerp3([boltXOf(SMAX) + 8, 6.5, 0], LAY.bolt, p), mix(-ROT - .5, 0, p));
      const g = clamp((n - 39) / 5); pistonGlow.position.x = 5 + 19 * g; pistonGlow.scale.x = 3.4; pistonGlow.material.opacity = Math.sin(Math.PI * g) * .9 * (n < 44 ? 1 : 0);
    }
  } else if (n < 84) {
    const { c, u } = n < 50 ? { c: 0, u: 0 } : cycle(n, t);
    st = machine(c, u, flightS4(n, t, c, u), { rounds: n >= 48.6 });
    if (n < 49) { const p = seg(n, 46, 49); setCar(...lerp3([-8, 14, 12], [0, 0, 0], p)); setBolt(...lerp3(LAY.bolt, [0, 0, 0], p), 0); }
  } else if (n < 113) {
    const sw = n >= 88 && n < 97 ? pw(SWEEP, n) : 0;
    machine(0, sw, none, { fired: false, rounds: false });
    if (n >= 97 && n < 103.6) { const e = Math.sin(Math.PI * clamp((n - 97) / 6)), w = Math.sin((n - 97) * Math.PI * 2.4) * e; inGun(0, .22 * w, .012 * w); }
  } else {
    machine(0, 0, none, { fired: false, rounds: false });
    const bIn = seg(n, 113.3, 114.8), cIn = seg(n, 115, 116.4);
    if (n < 116.4) {
      const cp = lerp3(EXP.car, [-SMAX, 0, 0], cIn); setCar(...cp);
      const rel = [cp[0] + SMAX + boltXOf(SMAX), cp[1], cp[2]]; setBolt(...lerp3(EXP.bolt, rel, bIn), mix(0, -ROT, bIn));
    } else {
      const home = 1 - easeIn((n - 116.4) / .6), rack = ease((n - 121.6) / 1), rel = easeIn((n - 122.75) / .25);
      inGun(SMAX * (n < 117 ? home : n < 122.75 ? rack : 1 - rel));
    }
  }
  if (!springIn) spring.scale.x = 17.5;
  blueprintState(n);
  return st;
}

/** 开场：第一人称，枪在画面右下（游戏里的持枪视角），n2.4 起做一次「检视」：枪翻过来给你看侧面 */
const D2 = Math.PI / 180;
function viewmodel(n) {
  root.rotation.order = "YZX";
  if (n >= 6) { root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); return; }
  const insp = ease((n - 2.4) / 1.3) * (1 - ease((n - 4.6) / 1.1)), sway = Math.sin(n * Math.PI * .5), bob = Math.sin(n * Math.PI);
  root.position.set(mix(13, 4, insp) + .3 * sway, mix(-11, -5.5, insp) + .25 * bob, mix(38, 30, insp));
  root.rotation.set(mix(0, -38, insp) * D2 + .01 * sway, mix(96, 158, insp) * D2, mix(3, 10, insp) * D2 + .008 * bob);
}
export function fpsCamera(n) {
  camera.position.set(0, 0, 70); camera.lookAt(0, -3, -100);
  if (camera.near !== .5) { camera.near = .5; camera.updateProjectionMatrix(); }
}

function blueprintState(n) {
  const on = n >= 103.6 && n < 113 ? 1 : 0;
  blueprint(on, mix(-66, 50, ease((n - 103.8) / 5)));
  scene.background = BG.clone().lerp(new THREE.Color(.02, .05, .1), on);
}

export function propsState(n, t) {
  dim.material.opacity = .72 * seg(n, 37, 38.5) * (1 - seg(n, 45, 46.5)); dim.visible = dim.material.opacity > .002;
  sand(n, t);
}

// ── 镜头：每个动作一个机位，镜头内一直在动（环绕、推拉、跟拍），镜头之间在拍点硬切 ──
// 机位用球坐标描述：看点 tgt、距离 d、方位 az（0° = 枪的右侧正面，正值偏向枪口，负值偏向枪托）、仰角 el。
// 第四、五段是剖面（只剩左半），机位限制在右侧半球（|az| ≤ 60°）。
const D2R = Math.PI / 180, V = (x, y, z) => new THREE.Vector3(x, y, z);
const wp = (o, ox = 0, oy = 0, oz = 0) => () => o.getWorldPosition(new THREE.Vector3()).add(V(ox, oy, oz));
const SHOTS = [
  // [起拍, 止拍, 看点（[x,y,z]、[[起],[止]] 或函数）, [d0, d1], [az0, az1], [el0, el1], 运动曲线]
  [0, 6, [0, 0, 0], [60, 60], [20, 20], [10, 10]],
  [6, 12, [[-2, 0, 0], [-8, -3, 0]], [30, 112], [72, 24], [-10, 14], "out"],        // 从枪口下方甩出全貌
  [12, 14, [-6, -8, 0], [46, 40], [40, 24], [-24, -14]],                              // 卸弹匣：前下方仰拍
  [14, 16.8, [-4, 1.5, 0], [32, 28], [-38, -18], [22, 14]],                           // 拉机柄：后四分之三
  [16.8, 20.6, [-10, 4, 0], [46, 40], [14, -8], [58, 44]],                             // 掀盖：俯拍
  [20.6, 23.8, [-15, 4, 0], [42, 36], [-58, -38], [16, 26]],                          // 抽簧：从枪托一侧
  [23.8, 27, [-9, 4, 0], [48, 42], [42, 26], [28, 16]],                               // 拉框：前上方
  [27, 30, () => wp(bolt, -3)(), [19, 15], [8, 40], [38, 26]],                        // 拧枪机：绕着枪机转
  [30, 37, [-8.5, 0, 0], [100, 92], [9, -6], [3, -2]],                                 // 平铺：缓慢横移
  [37, 46, () => wp(carrier, 10, 2)(), [46, 34], [-42, 42], [16, 6]],                  // 主角：绕枪机框一圈
  [46, 50, [[-4, 8, 6], [4, -.5, 0]], [50, 60], [32, 4], [18, 6]],                     // 装回剖面
  [50, 53.2, () => V(Math.min(rounds[0].b.position.x + 3, 29), .6, 0), [24, 22], [22, 30], [8, 12]], // 跟着弹头走
  [53.2, 56.6, [28.5, 1.8, 0], [21, 19], [48, 18], [26, 14]],                         // 导气孔：前上方环绕
  [56.6, 63.6, [-1, .8, 0], [25, 20], [42, 14], [20, 28]],                            // 空跑、开锁
  [63.6, 69, [-4, 1.5, 0], [42, 38], [30, 8], [14, 26]],                              // 抛壳：弹壳迎着镜头飞
  [69, 75, [-5, -1, 0], [36, 30], [20, -14], [-8, 4]],                                // 推弹：低机位
  [75, 77, [-1, 0, 0], [19, 17], [16, 26], [10, 14]],                                 // 锁死：特写
  [77, 84, [4, -.5, 0], [55, 70], [-12, 22], [4, 16]],                                // 真实速度后拉开
  [84, 87.5, [[4, -.5, 0], [-7.5, .6, -1.5]], [70, 14], [22, 9], [16, 47], "dive"],   // 冲进缝里
  [87.5, 97, [[-7.5, .6, -1.5], [-6, .6, -1.5]], [14, 12.5], [-8, 18], [50, 40]],     // 缝：俯拍横移
  [97, 103.6, [-3, 1.6, -1], [17, 15], [-28, 4], [14, 24]],                           // 晃动
  [103.6, 113, [[-14, 1, 0], [-6, 1, 0]], [118, 104], [0, 0], [0, 0]],                // 图纸：正侧面平推
  [113, 117, [-4, 4, 3], [74, 66], [62, 32], [22, 10]],                               // 炸开的零件：大环绕
  [117, 121, [-6, 2, 0], [66, 58], [30, -22], [10, 16]],                              // 合体：转过正侧面
  [121, 123.4, () => wp(handleKnob)(), [22, 18], [52, 34], [16, 12]],                  // 拉机柄特写
  [123.4, 125.2, [-5, -10, 0], [42, 38], [26, 14], [-22, -10]],                       // 弹匣卡入：仰拍
  [125.2, 128, [-8, -2, 0], [78, 100], [36, 24], [10, 14]],                           // 收尾全貌
];
const _t = new THREE.Vector3();
export function shot(n, sk) {
  let i = SHOTS.length - 1; while (i > 0 && n < SHOTS[i][0]) i--;
  const [a, b, tg, [d0, d1], [z0, z1], [e0, e1], k] = SHOTS[i], q = clamp((n - a) / (b - a));
  const p = k === "out" ? 1 - (1 - q) ** 3 : k === "dive" ? q ** 2.4 : mix(q, ease(q), .5);
  if (typeof tg === "function") _t.copy(tg()); else if (Array.isArray(tg[0])) _t.set(...mixV(tg[0], tg[1], p)); else _t.set(...tg);
  const d = k === "dive" ? Math.exp(mix(Math.log(d0), Math.log(d1), p)) : mix(d0, d1, p), az = mix(z0, z1, p) * D2R, el = mix(e0, e1, p) * D2R;
  // 轻微手持感：幅度随距离
  const hh = .004 * d, w = n * .9;
  camera.position.set(_t.x + d * Math.cos(el) * Math.sin(az) + hh * Math.sin(w * 1.3), _t.y + d * Math.sin(el) + hh * Math.sin(w * 1.7 + 1), _t.z + d * Math.cos(el) * Math.cos(az));
  if (sk > 0) { const f = Math.floor(n * 60); camera.position.x += (hash(f) - .5) * .02 * d * sk; camera.position.y += (hash(f + 7) - .5) * .02 * d * sk; }
  camera.lookAt(_t);
  const near = d < 15 ? .02 : d < 40 ? .1 : .5; if (camera.near !== near) { camera.near = near; camera.updateProjectionMatrix(); }
  return d;
}
