// S4–S5、S9：候选在漏斗里一层层往下走：过滤 → 粗排 → 精排 → 重排 → 落进手机。
import * as THREE from "three";
import { mulberry32, clamp01, smooth, lerp, win, winIn, pulse, C, TOPICS, makePoints } from "./core.js";
import { R } from "./funnel.js";
import { FS, T, PHONE, pinkShare, wy } from "./world.js";

const rand = mulberry32(31950);
const N = 360;
// 每层之间的停留高度（局部 y）
const H_TOP = [2.6, 3.0], H_F = [1.4, 1.95], H_C = [0.2, 0.75], H_R = [-1.0, -0.6], H_Q = [-2.0, -1.55];
const cand = [];
for (let i = 0; i < N; i++) {
  const q = rand();
  const route = q < 0.6 ? 0 : q < 0.88 ? 1 : 2;
  const arrive = route === 0 ? 48.1 + rand() * 4.0 : route === 1 ? 48.9 + rand() * 3.3 : 49.6 + rand() * 2.6;
  const r1 = rand(), r2 = rand();
  // 命运：0 过滤掉 / 1 粗排砍掉 / 2 精排后留下
  const fate = i < 3 ? 0 : r1 < 0.22 ? 0 : r1 < 0.22 + 0.78 * 0.62 ? 1 : 2;
  cand.push({
    arrive, fate, th: rand() * Math.PI * 2, u: 0.25 + 0.7 * Math.sqrt(rand()), spin: 0.25 + rand() * 0.3,
    col: TOPICS[Math.floor(rand() * 5)],
    cutF: i < 3 ? T.filter + 0.1 + i * 0.3 : T.filter + rand() * 0.8,
    cutC: T.coarse + rand() * 0.7,
    yTop: lerp(H_TOP[0], H_TOP[1], r2), yF: lerp(H_F[0], H_F[1], r2), yC: lerp(H_C[0], H_C[1], r2),
    yR: lerp(H_R[0], H_R[1], r2), yQ: lerp(H_Q[0], H_Q[1], r2), size: 0.1 + rand() * 0.06,
  });
}
// 被选中、落进手机的几条：重排后排第一的那条是粉色
const SURV = cand.map((c, i) => i).filter((i) => cand[i].fate === 2);
const FALLS = [T.deliver];
const fallers = FALLS.map((at, k) => ({ at, i: SURV[k] }));
cand[SURV[0]].col = C.pink;
const fallOf = new Map(fallers.map((f) => [f.i, f.at]));

const pts = makePoints(N);
export const tagPos = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const tmpC = new THREE.Color();

function localPos(c, t) {
  // 返回 [局部 y, 半径系数]
  let y = Math.max(c.yTop, 3.1 - 0.8 * (t - c.arrive));
  if (t > c.cutF) y = lerp(y, c.yF, smooth((t - c.cutF - 0.3) / 1.2));
  if (t > c.cutC) y = lerp(y, c.yC, smooth((t - c.cutC - 0.2) / 1.2));
  if (t > T.sort) y = lerp(y, c.yR, smooth((t - T.sort) / 1.0));
  if (t > T.rerank + 0.6) y = lerp(y, c.yQ, smooth((t - T.rerank - 0.6) / 1.2));
  return y;
}

export function updatePipeline(t) {
  const v = winIn(t, 47.9, T.loopStart + 1, 0.3, 1.5);
  if (v <= 0.001) { pts.points.visible = false; return; }
  pts.points.visible = true;
  for (let i = 0; i < N; i++) {
    const c = cand[i];
    if (t < c.arrive) { pts.hide(i); continue; }
    const fin = smooth((t - c.arrive) / 0.4);
    const ang = c.th + c.spin * (t - c.arrive);
    // 过滤：甩出去
    if (c.fate === 0 && t > c.cutF) {
      const tau = t - c.cutF;
      const y0 = localPos(c, c.cutF);
      const r0 = R(y0) * c.u;
      const rad = (r0 + tau * 2.2) * FS, y = (y0 + tau * 0.8 - 1.2 * tau * tau) * FS;
      const x = Math.cos(ang) * rad, z = Math.sin(ang) * rad;
      tmpC.copy(c.col).lerp(C.red, smooth(tau / 0.15));
      pts.set(i, x, y, z, tmpC, 0.95 * Math.max(0, 1 - tau / 1.5) * v, c.size * (1 + 1.2 * Math.exp(-tau * 8)));
      if (i < 3) tagPos[i].set(x, y, z);
      continue;
    }
    // 粗排：闪一下分数，然后熄灭
    if (c.fate === 1 && t > c.cutC) {
      const tau = t - c.cutC;
      const y = localPos(c, c.cutC) * FS, rad = R(localPos(c, c.cutC)) * c.u * FS;
      tmpC.copy(c.col).lerp(C.grey, smooth((tau - 0.25) / 0.4));
      const a = (1 + 1.5 * pulse(t, c.cutC, 10)) * 0.85 * (1 - smooth((tau - 0.3) / 0.6));
      pts.set(i, Math.cos(ang) * rad, y, Math.sin(ang) * rad, tmpC, a * v, c.size);
      continue;
    }
    let yl = localPos(c, t);
    let rad = R(yl) * c.u * FS;
    let x = Math.cos(ang) * rad, y = yl * FS, z = Math.sin(ang) * rad;
    // 落进手机
    const fall = fallOf.get(i);
    if (fall !== undefined && t > fall) {
      const k = smooth((t - fall) / 1.1);
      x = lerp(x, PHONE.x, k); z = lerp(z, PHONE.z, k); y = lerp(y, PHONE.y, k);
      const gone = smooth((t - fall - 1.05) / 0.15);
      pts.set(i, x, y, z, c.col, 0.95 * (1 - gone) * v, c.size * 1.8);
      continue;
    }
    // 精排时被选中的那条更亮
    const hl = i === SURV[0] ? 1 + 1.2 * winIn(t, T.fine, T.deliver, 0.4, 0.2) : 1;
    pts.set(i, x, y, z, c.col, 0.85 * fin * v, c.size * hl);
  }
  pts.flush();
}

// 快进段 / 结尾：一股候选流从漏斗口落进手机，颜色随“粉色占比”变化
const SN = 420;
const sP = [];
for (let i = 0; i < SN; i++) sP.push({ ph: rand(), th: rand() * Math.PI * 2, u: Math.sqrt(rand()), q: rand(), alt: TOPICS[1 + Math.floor(rand() * 4)], size: 0.08 + rand() * 0.05 });
const stream = makePoints(SN);
// 结尾落进手机的那一颗（青色，一个新方向）
const lander = makePoints(2);

export function updateStream(t) {
  const v = winIn(t, T.wide, T.land + 0.3, 0.6, 0.3);
  if (v > 0.001) {
    stream.points.visible = true;
    const pink = pinkShare(t);
    sP.forEach((p, i) => {
      const ph = (t * 0.32 + p.ph) % 1;
      const yl = lerp(3.1, -3.1, ph);
      const y = yl * FS;
      let rad = R(Math.max(yl, -2.2)) * p.u * FS * 0.85;
      let yy = y;
      if (yl < -3.0) { rad *= 0.5; }
      const ang = p.th + 1.4 * ph;
      // 出漏斗后继续落到手机
      if (ph > 0.97) yy = lerp(y, PHONE.y, (ph - 0.97) / 0.03);
      stream.set(i, Math.cos(ang) * rad, yy, Math.sin(ang) * rad, p.q < pink ? C.pink : p.alt, 0.7 * v * Math.min(1, ph * 6), p.size);
    });
    stream.flush();
  } else stream.points.visible = false;

  const lv = win(t, 153.12, T.land, 0.3, 0.12);
  if (lv > 0.001) {
    const k = smooth((t - 153.12) / (T.land - 153.12));
    const y = lerp(wy(3.4), PHONE.y, k);
    const x = lerp(0.8, 0, k) * (1 - k), z = lerp(0.6, 0, k) * (1 - k);
    lander.set(0, x, y, z, C.cyan, lv, 0.22);
    lander.set(1, x, y, z, C.cyan, 0.4 * lv, 0.9);
  } else { lander.hide(0); lander.hide(1); }
  lander.flush();
}
