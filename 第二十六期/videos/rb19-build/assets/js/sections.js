// 八段的状态：全片只有这一个 state(t)，每帧算出所有物体的参数。时间窗口与 03-分镜脚本 同源（script.py）。
import * as THREE from "three";
import { camera, root, setAO, ao, bloom, fx, key } from "./world.js";
import { S, Q, H, OUT, DUR } from "./beats.js";
import { INSTALL, T_TUB, T_DONE, T_FIRE, COUNT, BRAKE, P0, RIDE, STALL, STALL_HITS, LIGHT0, litAt, tickAt } from "./timeline.js";
import { clamp, mix, mixV, ease, easeOut, hash } from "./lib.js";
import { makeCar, carState, installState, FLOOR_Y, TZ } from "./rb19.js";
import { makeLivery } from "./livery.js";
import { envState } from "./env.js";
import { flowState, flowAnchors, wingState } from "./flow.js";
import { gantryState, oldState, ramState, sizeState, makeEnergy } from "./props.js";
import { defineLabels, hudState } from "./hud.js";
import { overlayState, definePlates } from "./overlay.js";

export const rb = makeCar(root), cmp = makeCar(root, { grey: true });
const livery = makeLivery(rb), energy = makeEnergy(rb.body);
const ghostMat = new THREE.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const exhaust = new THREE.PointLight(0xff7a2a, 0, 40, 1.5); exhaust.position.set(-25, 3, 0); root.add(exhaust);
const win = (t, a, b, f = .25) => clamp((t - a) / f) * (1 - clamp((t - b + f) / f));
const seg = (keys, t, f = ease) => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return mix(va, vb, f((t - a) / (b - a))); } return keys[keys.length - 1][1]; };
const lin = (x) => clamp(x);
/** 从速度积分路程（步长 0.05 秒的梯形，纯函数） */
const integ = (f, t) => { if (t <= 0) return 0; const n = Math.ceil(t / .05), h = t / n; let s = (f(0) + f(t)) / 2; for (let i = 1; i < n; i++) s += f(i * h); return s * h; };

// ── 运动：车轮转速（S3 的虚影车轮也转）与地面路程 ──
const VMAX = 30;
const ground = (t) => {
  if (t >= 115 && t < S.S5[1]) return VMAX * ease((t - 115) / .6) * (t < BRAKE ? 1 : mix(1, .3, ease((t - BRAKE) / 2.4)));
  if (t >= 152.2 && t < S.S6[1]) return VMAX * ease((t - 152.2) / .5);
  return 0;
};
const spinOnly = (t) => t >= 52.6 && t < 70.6 ? (t < 54.4 ? 30 : t < 64.4 ? mix(30, 8, ease((t - 54.4) / 3.6)) : mix(8, 34, ease((t - 64.4) / 3))) : 0;
const rideNow = (t) => seg(RIDE, t);

// ── 镜头：[起, 止, 起点机位, 终点机位, 起点看点, 终点看点]；段内持续运动，段间硬切 ──
const ORBIT = (a0, a1, r, y, c = [0, 4, 0]) => ({ orbit: [a0, a1, r, y, c] });
const CAM = [
  [0, 9.7, [0, 6, 46], [0, 8.5, 34], [0, 14, -6], [0, 14.5, -6]],
  [9.7, 14.6, [6, 12, 48], [36, 12, 42], [0, 13, -6], [13, 3.5, 0]],
  [14.6, 18.4, [44, 12, 38], [38, 10, 44], [13, 3.5, 0], [12, 3.6, 0]],
  [18.4, 20.6, [30, 8, 24], [24, 7, 28], [10, 4, 0], [10, 4.2, 0]],
  [20.6, 22.8, [15, 6.6, 6.4], [10.5, 6.5, 6.2], [11, 5.4, 2.9], [8, 5.4, 2.9]],
  [22.8, 28.0, [16, 44, 44], [10, 40, 40], [4, 3, 0], [3, 3, 0]],
  [28.0, 32.6, [48, 7, 26], [44, 6, 22], [26, 3, 0], [27, 3, 0]],
  [32.6, 38.4, [11, 14, 11], [8, 13, 8.5], [2, 5.8, 0], [2.5, 5.8, 0]],
  [38.4, 45.0, [7, 23, 15], [4, 20, 12], [3, 6.5, 0], [2.5, 6.5, 0]],
  [45.0, 48.6, [-36, 11, 24], [-30, 10, 20], [-6, 4, 0], [-5, 4, 0]],
  [48.6, 52.6, [-5, 6.5, 30], [-8, 6, 27], [-6, 4.2, 0], [-7, 4.2, 0]],
  [52.6, 64.2, [-5, 8, 50], [-9, 7.5, 44], [-8, 3.4, 0], [-9, 3.4, 0]],
  [64.2, 70.8, [-38, 5, 28], [-32, 4.5, 23], [-8, 3, 0], [-9, 3, 0]],
  [70.8, 77.2, [-14, 10, 14], [-12.5, 9.4, 12.5], [-9, 4.8, 0], [-8.8, 4.8, 0]],
  [77.2, 81.4, [-40, 15, 26], [-34, 13, 22], [-12, 3.5, 0], [-11, 3.5, 0]],
  [81.4, 86.4, [38, 3.2, 36], [30, 3, 30], [0, 2.6, 0], [1, 2.6, 0]],
  [86.4, 92.8, [34, 52, 34], [20, 48, 30], [0, 9, 0], [-2, 9, 0]],
  [92.8, 97.8, [24, 38, 18], [-10, 36, 16], [12, 15, 2], [-18, 15, 2]],
  [97.8, 114.4, [0, 9, 62], [-3, 8, 56], [0, 3.5, 0], [-1, 3.5, 0]],
  [114.4, 127.4, [-3, 4.4, 40], [-4, 4.0, 36], [-3, 4.2, 0], [-4, 3.8, 0]],
  [127.4, 137.8, [-3, 4.3, 35], [-4, 4.1, 32], [-3, 4.3, 0], [-4, 4.1, 0]],
  [137.8, 147.8, [14, 38, 72], [9, 34, 64], [5, 1, -17], [6, .8, -17]],
  [147.8, 152.4, [22, 26, 52], [15, 24, 47], [0, 4, 0], [-1, 4, 0]],
  [152.4, 172.8, [-22, 9.4, 40], [-24, 9, 37], [-26, 7.6, 0], [-27, 7.6, 0]],
  [172.8, 177.8, ORBIT(.35, 2.6, 50, 14)],
  [177.8, 183.4, [62, 6, 2], [53, 6, 6], [0, 4, 0], [0, 4, 0]],
  [183.4, 189.4, [42, 11, 46], [37, 10, 41], [0, 4, 0], [0, 4, 0]],
  [189.4, 196.4, [46, 3, 22], [41, 3, 17], [0, 4.2, 0], [0, 4.2, 0]],
  [196.4, 201.0, [32, 3.4, 23], [-22, 3.4, 23], [26, 4, 0], [-24, 4, 0]],
  [201.0, DUR + .1, [58, 7, 31], [48, 6.5, 26], [0, 4, 0], [0, 7.5, 0]],
];
const _tg = new THREE.Vector3();
function shot(t, sk) {
  const c = CAM.find((s) => t < s[1]) || CAM[CAM.length - 1], q = clamp((t - c[0]) / (c[1] - c[0])), p = mix(q, ease(q), .6);
  if (c[2].orbit) { const [a0, a1, r, y, ctr] = c[2].orbit, a = mix(a0, a1, p); camera.position.set(ctr[0] + r * Math.cos(a), y, ctr[2] + r * Math.sin(a)); _tg.set(...ctr); }
  else { camera.position.set(...mixV(c[2], c[3], p)); _tg.set(...mixV(c[4], c[5], p)); }
  if (sk > 0) { const f = Math.floor(t * 60); camera.position.x += (hash(f) - .5) * 1.0 * sk; camera.position.y += (hash(f + 7) - .5) * 1.0 * sk; }
  camera.lookAt(_tg);
}
const SHAKES = [OUT, Q(30.0), Q(39.8), Q(46.8), Q(82.0), Q(108.2), ...STALL_HITS, BRAKE, Q(163.8), T_FIRE];
const HITS = [...COUNT, OUT, Q(108.2), BRAKE, Q(163.8), T_FIRE];
const decay = (t, list, k) => { let v = 0; for (const h of list) if (t >= h) v = Math.max(v, Math.exp(-(t - h) * k)); return v; };

// ── 标注（AGENTS.md 1.3.1） ──
const W = (c, p, node = "body") => () => c[node].localToWorld(new THREE.Vector3(...p));
const V = (...p) => () => new THREE.Vector3(...p);
const oldX = (t) => t < 97.8 ? 80 : mix(80, 0, easeOut((t - 98.2) / 4.8));
defineLabels([
  { k: "proc", t: "发车灯", a: .6, b: 4.4, at: V(0, 21, -6), dx: 0, dy: -30 },
  { k: "full", t: "碳纤维单体壳", f: "车手坐在里面", a: T_TUB, b: 22.6, at: W(rb, [14, 6.0, 2.6]), dx: 220, dy: -170 },
  { k: "proc", t: "尺寸由规则规定（示意）", a: 23.4, b: 27.8, at: V(13.5, 8, 0), dx: 0, dy: -60 },
  { k: "proc", t: "碰撞测试（示意）", a: 28.4, b: 32.4, at: V(34, 6, 0), dx: 0, dy: -70 },
  { k: "tag", t: "座椅", a: H(33.6), b: 38.2, at: W(rb, [1.4, 6.3, 1.7]), dx: -160, dy: -120 },
  { k: "tag", t: "方向盘", a: H(34.8), b: 38.2, at: W(rb, [4, 6.6, 1.1]), dx: 160, dy: -120 },
  { k: "full", t: "Halo 防护架", f: "钛合金，护住头部", a: Q(39.8), b: 44.8, at: W(rb, [2.6, 7.4, 2.6]), dx: 220, dy: -160 },
  { k: "full", t: "动力单元", f: "直接栓在座舱后面", a: Q(46.8), b: 49.3, at: W(rb, [-6, 5.8, 1.9]), dx: 200, dy: -170 },
  { k: "tag", t: "涡轮", a: 49.6, b: 52.4, at: W(rb, [-11.6, 5.0, .9]), dx: -160, dy: -100 },
  { k: "full", t: "MGU-K", f: "刹车时回收能量", a: H(52.8), b: 58.4, at: W(rb, [-4.5, 2.2, -2.3]), dx: 160, dy: 150 },
  { k: "tag", t: "电池", a: H(53.6), b: 64.2, at: W(rb, [.6, 2.3, 1.8]), dx: 160, dy: -140 },
  { k: "full", t: "MGU-H", f: "从废气里回收能量", a: H(58.6), b: 64.2, at: W(rb, [-10.2, 5.0, .7]), dx: -200, dy: -170 },
  { k: "proc", t: "回收 → 电池 → 放出", a: 64.6, b: 70.6, at: W(rb, [-6, 10, 0]), dx: 0, dy: -30 },
  { k: "proc", c: "stamp", t: "2026 起取消", a: Q(71.2), b: 77.0, at: W(rb, [-10.2, 6.6, 0]), dx: 0, dy: -90 },
  { k: "tag", t: "变速箱", a: H(77.6), b: 81.2, at: W(rb, [-16, 4.3, 1.2]), dx: 150, dy: -120 },
  { k: "tag", t: "后悬架", a: H(78.4), b: 81.2, at: W(rb, [-19.6, 4.8, 6]), dx: -170, dy: -110 },
  { k: "tag", t: "车底", a: Q(82.0), b: 86.2, at: W(rb, [-4, FLOOR_Y + .1, 9]), dx: -150, dy: 110 },
  { k: "tag", t: "前悬架", a: H(83.2), b: 86.2, at: W(rb, [16.6, 5.0, 6.8], "inner"), dx: 140, dy: -130 },
  { k: "proc", t: "？", a: 85.4, b: 86.3, at: W(rb, [27, 2.4, 0]), dx: 0, dy: -60 },
  { k: "proc", t: "？", a: 85.6, b: 86.3, at: W(rb, [-25.9, 8.6, 0]), dx: 0, dy: -60 },
  { k: "full", t: "车底 · 两条隧道", f: "把车吸向地面", a: 88.2, b: 92.6, at: W(rb, [-4, FLOOR_Y, TZ]), dx: -260, dy: -170 },
  { k: "tag", t: "入口", a: 88.6, b: 97.6, at: W(rb, [13.4, FLOOR_Y + 1.6, TZ]), dx: 150, dy: -110 },
  { k: "tag", t: "出口 · 扩散器", a: 89.0, b: 97.6, at: W(rb, [-20.4, FLOOR_Y + 2.8, TZ]), dx: -150, dy: 120 },
  { k: "tag", t: "防滑木条", a: 89.4, b: 92.6, at: W(rb, [-1, FLOOR_Y - .1, 0]), dx: 140, dy: 130 },
  { k: "tag", t: "1978 · 莲花 79", a: 99.0, b: 107.4, at: (t) => new THREE.Vector3(oldX(t) - 4, 8, 0), dx: -200, dy: -100 },
  { k: "proc", t: "首台夺冠的地面效应赛车", a: Q(103.4), b: 107.4, at: V(0, 12, 0), dx: 260, dy: -40 },
  { k: "proc", t: "1983 · 平底规则", a: Q(108.2), b: 112.6, at: V(0, .4, 0), dx: 0, dy: 110 },
  { k: "proc", t: "2022 · 新规则", a: 114.4, b: 117.2, at: V(0, 11, 0), dx: 0, dy: -60 },
  { k: "proc", t: "通道变窄 → 气流加速", a: 118.2, b: 122.6, at: V(6, 0, 0), dx: 0, dy: 120 },
  { k: "proc", c: "blue", t: "低压", a: 118.8, b: 122.6, at: V(-6, 0, 0), dx: 0, dy: 55 },
  { k: "proc", t: "下压力", a: 123.2, b: 127.2, at: () => flowAnchors.force(0), dx: 150, dy: -10 },
  { k: "proc", t: "越贴地 → 吸得越牢", a: 8.45 + P0, b: 9.0 + P0, at: (t) => flowAnchors.force(rideNow(t)), dx: 0, dy: -60 },
  { k: "proc", t: "太近了 → 气流断了", a: 9.05 + P0, b: 9.75 + P0, at: V(-3, 0, 0), dx: 0, dy: 110 },
  { k: "proc", t: "↑ 车弹起", a: 9.12 + P0, b: 9.75 + P0, at: (t) => new THREE.Vector3(8, 10 + rideNow(t), 0), dx: 0, dy: -50 },
  { k: "proc", t: "又被吸下 → 再弹起", a: 9.8 + P0, b: 11.0 + P0, at: (t) => flowAnchors.force(rideNow(t)), dx: 0, dy: -60 },
  { k: "proc", t: "海豚跳（porpoising）", a: 132.8, b: 137.6, at: V(-4, 13, 0), dx: 0, dy: -150 },
  { k: "tag", t: "对比车（示意）", a: 137.9, b: 147.7, at: W(cmp, [-6, 9.4, 0]), dx: -120, dy: -90 },
  { k: "proc", t: "刹车！", a: BRAKE, b: BRAKE + .8, at: V(14, 12, -16), dx: 0, dy: 0 },
  { k: "proc", t: "车头下沉", a: 139.2, b: 147.7, at: W(cmp, [26, 2.4, 0]), dx: 80, dy: -90 },
  { k: "proc", t: "车头稳住", a: 139.4, b: 147.7, at: W(rb, [26, 2.4, 0]), dx: 80, dy: -80 },
  { k: "full", t: "前悬架 · 拉杆式", f: "刹车时撑住车头", a: 140.6, b: 147.7, at: W(rb, [17.4, 4.6, 6.2], "inner"), dx: 170, dy: 150 },
  { k: "proc", t: "高度稳 → 吸力稳", a: 143.2, b: 147.7, at: V(4, 14, -12), dx: 0, dy: -40 },
  { k: "tag", t: "前翼", a: H(148.6), b: 152.2, at: W(rb, [27, 1.6, 9]), dx: 150, dy: -110 },
  { k: "full", t: "尾翼", f: "把车尾往下按", a: H(149.6), b: 152.2, at: W(rb, [-25.9, 7.6, 4]), dx: -220, dy: -150 },
  { k: "proc", t: "下压力 ↓", a: 152.8, b: 157.4, at: V(-25.6, 13.6, 0), dx: 150, dy: 0 },
  { k: "proc", t: "阻力 ←", a: 158.2, b: 163.2, at: V(-32, 9, 0), dx: 0, dy: -70 },
  { k: "full", t: "DRS 活动片", f: "直道上张开减阻", a: Q(163.8), b: 168.2, at: W(rb, [-25.4, 8.4, 2]), dx: 200, dy: -150 },
  { k: "proc", t: "开：阻力小 → 更快", a: 164.2, b: 168.2, at: V(-32, 11, 0), dx: 0, dy: -40 },
  { k: "proc", c: "stamp", t: "2026 起退役", a: Q(169.0), b: 172.6, at: V(-25.5, 10, 0), dx: 0, dy: -70 },
  { k: "tag", t: "侧箱", a: H(173.4), b: 177.4, at: W(rb, [0, 6.2, 6]), dx: 150, dy: -120 },
  { k: "tag", t: "发动机盖", a: H(174.8), b: 177.6, at: W(rb, [-4, 9.2, 0]), dx: -150, dy: -110 },
]);

// ── 数字牌 ──
definePlates([
  { id: "pu", a: 49.2, b: 52.4, x: 1420, y: 300, html: '<div class="big">1.6 L</div><div class="sub">V6 · 涡轮增压</div>' },
  { id: "year", a: 99.0, b: 117.0, x: 1580, y: 230, html: '<div class="big yr"></div>', update: (e, t) => { const y = t < Q(108.2) ? 1978 : t < 112.8 ? 1983 : t < 114.4 ? Math.round(mix(1983, 2022, ease((t - 112.8) / 1.6))) : 2022; const n = e.querySelector(".yr"); if (n.textContent !== String(y)) n.textContent = y; } },
  { id: "penalty", a: Q(178.2), b: 183.4, x: 960, y: 420, html: '<div class="sub">2023 年空气动力测试额度</div><div class="big red">风洞＋CFD −10%</div>' },
  { id: "rate", a: Q(189.8), b: 196.2, x: 960, y: 420, cls: "pair", html: '<div class="col hi"><div class="sub">RB19 · 2023</div><div class="big">95.45%</div><div class="sub">22 场赢 21 场</div></div><div class="col"><div class="sub">MP4/4 · 1988</div><div class="big">93.75%</div><div class="sub">16 场赢 15 场</div></div>' },
]);

export function state(t) {
  const sk = decay(t, SHAKES, 9), kick = decay(t, HITS, 9);
  // 装配
  for (const [id, T, from, d] of INSTALL) installState(rb, id, t, T, from, d);
  for (let id = 1; id <= 25; id++) installState(cmp, id, t, null);
  rb.P[1].visible = t >= 9.7;
  // 透视预览：S2 尺寸框时全车虚影；S3 后轮虚影；S4 前后翼虚影
  const preview = t >= 22.8 && t < 28.0 ? Array.from({ length: 24 }, (_, i) => i + 2) : t >= 52.6 && t < 70.8 ? [16, 17] : t >= 85.4 && t < 86.4 ? [18, 19] : [];
  for (const id of preview) if (!(t >= (INSTALL.find((r) => r[0] === id)?.[1] ?? 1e9))) { rb.P[id].visible = true; rb.P[id].position.set(0, 0, 0); }
  // 姿态
  const inFlip = t >= 86.4 && t < S.S5[0];
  const lift = inFlip ? 9 * ease((t - 86.4) / .9) : 0, roll = inFlip ? Math.PI * ease((t - 86.7) / 1.2) : 0;
  const xray = t >= 115.4 && t < S.S5[1] - 10;
  ghostMat.opacity = .032 + .2 * Math.exp(-Math.max(0, t - 115.4) * 7);
  const g = ground(t), dist = integ(ground, t), spin = dist + integ(spinOnly, t);
  const ride = t >= P0 + 8.4 && t < P0 + 11.2 ? rideNow(t) : 0, st = seg(STALL, t, lin);
  const brk = t >= S.S5[1] - 10 && t < S.S5[1], bk = brk ? ease((t - BRAKE) / .35) * (1 - ease((t - 145.6) / .8)) : 0;
  const ghostIds = xray ? null : preview.length ? preview : null, ghost = xray || preview.length ? ghostMat : null;
  const drs = t < Q(163.8) ? 0 : t < Q(168.6) ? easeOut((t - Q(163.8)) / .3) : 1 - ease((t - Q(168.6)) / .4);
  carState(rb, { lift, roll, ride, dist: spin, ghost, ghostIds, pitchDeg: -.3 * bk, hl: brk ? ease((t - 140.4) / .4) : 0, tl: win(t, 87.8, 97.6, .4), flap: drs, puOpacity: t >= 48.8 && t < 77.0 ? mix(1, .22, ease((t - 48.8) / .6)) : 1 });
  rb.car.visible = !(t >= S.S5[0] && t < 114.4);
  cmp.car.visible = brk; if (brk) carState(cmp, { z: -34, dist, pitchDeg: -2.4 * bk });
  // 涂装
  livery.state(t < 196.8 ? 1e6 : t < 199.8 ? mix(31, -31, ease((t - 196.8) / 3.0)) : -1e6);
  // 道具
  const nLit = Math.min(5, Math.max(0, Math.floor(t - LIGHT0) + 1));
  gantryState(t < 14.6, t < LIGHT0 ? 0 : nLit, t >= OUT);
  const ox = oldX(t);
  oldState(t >= S.S5[0] && t < 114.4, { x: ox, dist: 80 - ox, flow: win(t, 98.6, Q(108.2), .3), t, plateK: t < 107.6 ? -1 : easeOut((t - 107.6) / (Q(108.2) - 107.6)) });
  ramState(t >= 28.0 && t < 32.6, t < Q(30.0) ? ease((t - 28.6) / (Q(30.0) - 28.6)) : 1 - ease((t - 31.0) / 1.2));
  sizeState(win(t, 23.0, 27.8, .4));
  const ch = clamp((t - 54.4) / 9.6) * (1 - clamp((t - 64.6) / 5.8));
  rb.P.battery.material.emissiveIntensity = .25 + 2.2 * ch;
  energy({ fuel: .55 * win(t, 49.2, 70.6, .4), kinL: win(t, 54.4, 58.8, .4), kinR: win(t, 54.4, 58.8, .4), exh: win(t, 59.2, 64.2, .4), heat: win(t, 59.6, 64.2, .4), outL: win(t, 64.6, 70.6, .4), outR: win(t, 64.6, 70.6, .4) }, t);
  const fire = t >= T_FIRE ? Math.exp(-(t - T_FIRE) * 2.2) : 0; exhaust.intensity = 900 * fire;
  // 环境与示意层
  envState(t, dist, g > 0 ? 1 : 0);
  flowState(t, { on: clamp((t - 116.4) / .5) * (t < S.S5[1] - 10 ? 1 : 0), ride, st, tf: t - 115 });
  wingState(t, { on: clamp((t - 152.8) / .4) * (t < S.S6[1] ? 1 : 0), drs, wake: clamp((t - 157.8) / .6), down: win(t, 152.8, 157.6, .4), back: win(t, 158.2, 163.4, .4) * (1 - drs) });
  // 镜头与后期
  shot(t, sk);
  ao.enabled = !xray; setAO(1.2); bloom.strength = xray ? .22 : t < OUT + .2 ? .9 : .08 + .5 * fire;
  fx.uniforms.uZoom.value = .005 * kick + .02 * sk; fx.uniforms.uAb.value = .0005 + .001 * kick + .0015 * sk;
  fx.uniforms.uFlash.value = .05 * Math.exp(-Math.max(0, t - 115.4) * 9) * (t >= 115.4 ? 1 : 0) + .12 * Math.exp(-Math.max(0, t - OUT) * 6) * (t >= OUT ? 1 : 0) + .25 * fire * (t < T_FIRE + .2 ? 1 : .3);
  fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  key.castShadow = !xray;
}

/** 叠层状态（在渲染之后调用，标注投影要用最新的矩阵） */
export function hud(t, nocap) {
  hudState(t, { hideCaptions: nocap });
  const brk = t >= S.S5[1] - 10 && t < S.S5[1];
  const n = COUNT.filter((T) => t >= T).length, last = COUNT.filter((T) => t >= T).pop() ?? -9;
  const big = t < 14.6 ? clamp((t - 9.7) / .3) * (1 - ease((t - 14.0) / .6)) : t >= 183.4 && t < 189.4 ? clamp((t - 183.4) / .4) * (1 - clamp((t - 189.0) / .4)) : 0;
  const nose = (c) => [c.body.localToWorld(new THREE.Vector3(26.5, .84, 0)), c.body.localToWorld(new THREE.Vector3(26.5, .84, 0)).setY(0)];
  const [ra, rb0] = nose(rb), [ca, cb] = nose(cmp);
  const wo = clamp((t - 132.8) / .3) * (1 - clamp((t - 137.6) / .3)), wn = Math.floor(80 * clamp((t - 132.8) / 1.0));
  const pts = []; for (let i = 0; i <= wn; i++) { const tt = mix(P0 + 8.3, P0 + 11.2, i / 80); pts.push([mix(360, 1560, i / 80), 250 - seg(RIDE, tt) * 110]); }
  overlayState(t, {
    season: { o: t >= 9.7 ? clamp((t - 9.7) / .3) : 0, big, lit: (i) => t >= litAt(i) ? 1 : 0, tick: (i) => t >= tickAt(i) && t < 196.4 ? 1 : 0, note: win(t, 10.2, 14.0, .3) + win(t, 184.0, 189.0, .3) },
    counter: { o: clamp((t - 14.6) / .4), n, done: t >= T_DONE, bump: Math.exp(-(t - last) * 6) },
    title: win(t, 14.8, 18.4, .35),
    trophy: { o: win(t, 6.9, 10.4, .3), s: t < 9.7 ? .9 + .1 * easeOut((t - 6.9) / .5) : mix(1, .15, ease((t - 9.7) / .7)), dx: t < 9.7 ? 0 : mix(0, -820, ease((t - 9.7) / .7)), dy: t < 9.7 ? mix(40, 0, easeOut((t - 6.9) / .6)) : mix(0, -480, ease((t - 9.7) / .7)) },
    flag: clamp((t - OUT - 1.4) / 1.0),
    question: win(t, 205.4, DUR + 1, .4),
    dim: .55 * win(t, 6.7, 9.9, .3),
    legend: win(t, 54.0, 70.6, .3),
    rulers: brk ? [{ o: win(t, 138.0, 147.7, .3), top: ra, bot: rb0, color: "#ffb454" }, { o: win(t, 138.0, 147.7, .3), top: ca, bot: cb, color: "#ff6464" }] : [],
    wave: { o: wo, pts },
  });
}
