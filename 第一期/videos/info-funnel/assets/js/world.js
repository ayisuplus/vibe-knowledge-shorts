// 世界布局（自下而上）：人群 → 你的手机 → 推荐漏斗 → 内容空间（大表 / 星云）。
import * as THREE from "three";
import { smooth, lerp, easeOutCubic } from "./core.js";
import { R, buildFunnel } from "./funnel.js";

// ---------- 时间点（来自配乐卡点） ----------
export const T = {
  hook: 0.058, title: 2.183, accent: 2.45, b3: 4.319, b4: 6.432, b5: 8.568, brk1: 10.693,
  catch: 12.82, keep: 14.94,
  group: 17.05, echo: 21.33, unlink: 25.58, before: 28.49, cite: 29.8,
  funnel: 31.95, funnelIn: 33.6, log: 34.09, table: 38.34, compress: 40.46, toSpace: 43.38, you: 44.6,
  recall: 46.84, route2: 47.6, route3: 48.4, filter: 52.41, coarse: 54.27, fine: 56.13, weights: 61.44, sort: 63.58,
  rerank: 65.97, deliver: 69.42, loopStart: 72.34, st1: 72.6, st2: 74.5, st3: 76.59, st4: 78.45, lap1: 80.5, lap2: 82.7, lap3: 85.35,
  brk2: 87.21, ask: 89.35, ff: 93.59, bars: 102.1, entropy: 106.35, collapse: 108.0, cocoon: 110.61, narrow: 115.65, narrow2: 120.43,
  surprise: 123.36, explore: 127.87, actions: 132.66, crack: 140.1, burst: 142.49,
  wide: 150.99, prep: [154.97, 156.04], land: 157.11, end: 160.17,
};

// ---------- 人群 ----------
export const CROWD_Y = -12;

// ---------- 你的手机 ----------
export const PHONE = new THREE.Vector3(0, -8.6, 0);

// ---------- 推荐漏斗 ----------
export const FS = 1.6;
export const TIERS = [
  { y: 2.3, color: 0xff003c }, // 过滤：红
  { y: 1.0, color: 0x00f0ff }, // 粗排：青
  { y: -0.2, color: 0xfcee0a }, // 精排：黄
  { y: -1.25, color: 0x39ff88 }, // 重排：绿
];
export const funnel = buildFunnel({ yOff: 0, s: FS, tiers: TIERS });
export const wy = (yl) => FS * yl;
export const wr = (yl) => FS * R(yl);
export const MOUTH_Y = wy(3.2);
// 漏斗从高处降下来
export function funnelDrop(t) {
  return 42 * (1 - easeOutCubic((t - T.funnel) / (T.funnelIn - T.funnel)));
}

// ---------- 内容空间 ----------
export const SPACE_C = new THREE.Vector3(0, 19, 0);
export const CLUSTERS = [
  new THREE.Vector3(7, 1.5, 3), // 粉
  new THREE.Vector3(-7, 2, -2), // 青
  new THREE.Vector3(1, -2.5, -8), // 黄
  new THREE.Vector3(-3, -1, 8), // 绿
  new THREE.Vector3(6, 3.5, -6), // 橙
];

// ---------- “你”在内容空间里的位置 ----------
const YOU_START = new THREE.Vector3(0, 0.5, 0);
const YOU_DEEP = CLUSTERS[0].clone().multiplyScalar(1.05);
const YOU_OPEN = new THREE.Vector3(1.5, 1.2, -0.8);
export function youProgress(t) {
  let g = 0;
  const steps = [[T.st3, 0.08], [81.6, 0.14], [84.3, 0.2]];
  for (const [at, v] of steps) if (t >= at) g = lerp(g, v, smooth((t - at) / 0.6));
  g = lerp(g, 1, smooth((t - T.ff) / (T.cocoon - T.ff)));
  return g;
}
const _you = new THREE.Vector3();
export function youAt(t, out = _you) {
  out.copy(YOU_START).lerp(YOU_DEEP, youProgress(t));
  out.lerp(YOU_OPEN, smooth((t - T.actions) / (T.burst + 2 - T.actions)));
  out.y += 0.15 * Math.sin(t * 1.3);
  return out.add(SPACE_C);
}
export function recallRadius(t) {
  return lerp(3.6, 2.0, smooth((t - T.ff) / (T.cocoon - T.ff))) + 1.6 * smooth((t - T.actions) / 6);
}

// 你刷到的内容里粉色（第 0 类）的占比
export function pinkShare(t) {
  let p = 0.24;
  p = lerp(p, 0.4, smooth((t - T.st3) / (T.brk2 - T.st3)));
  p = lerp(p, 0.9, smooth((t - T.ff) / (T.cocoon - T.ff)));
  p = lerp(p, 0.94, smooth((t - T.cocoon) / (T.narrow2 - T.cocoon)));
  p = lerp(p, 0.4, smooth((t - T.crack) / 2.4));
  p = lerp(p, 0.26, smooth((t - T.burst) / 7));
  return p;
}
const BASE_OTHERS = [0.22, 0.18, 0.2, 0.16];
export function shares(t) {
  const p0 = pinkShare(t);
  const sum = BASE_OTHERS.reduce((a, b) => a + b, 0);
  return [p0, ...BASE_OTHERS.map((v) => (v / sum) * (1 - p0))];
}
export function entropy(ps) {
  return -ps.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
}
// 确定性的伪随机（给卡片挑颜色等）
export function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
