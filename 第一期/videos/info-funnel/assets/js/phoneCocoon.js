// 手机，以及 S7–S8 包住手机的茧：循环轨道收紧缠成茧 → 探索光束和你的操作打进来 → 茧壳碎开。
import * as THREE from "three";
import { scene, camera, mulberry32, clamp01, smooth, lerp, pulse, win, winIn, easeOutCubic, C, TOPICS, makePoints } from "./core.js";
import { T, PHONE, pinkShare } from "./world.js";

const rand = mulberry32(110610);
const tmpC = new THREE.Color();

// ---------- 手机 ----------
export const phone = new THREE.Group();
phone.position.copy(PHONE);
scene.add(phone);
const PW = 2.1, PH = 4.3, PRAD = 0.32;
const outline = [];
for (let c = 0; c < 4; c++) {
  const cx = (c === 0 || c === 3 ? 1 : -1) * (PW / 2 - PRAD), cy = (c < 2 ? 1 : -1) * (PH / 2 - PRAD);
  const a0 = [0, Math.PI / 2, Math.PI, Math.PI * 1.5][c];
  for (let i = 0; i <= 12; i++) {
    const a = a0 + (i / 12) * Math.PI / 2;
    outline.push(new THREE.Vector3(cx + Math.cos(a) * PRAD, cy + Math.sin(a) * PRAD, 0));
  }
}
const lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
phone.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outline), lineMat));
const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 不透明，挡住身后的粒子
phone.add(new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.16, PH - 0.16), screenMat));
export const SCREEN_HALF = [(PW - 0.16) / 2, (PH - 0.16) / 2];
export function phoneCorner(sx, sy, out) {
  return out.set(sx * SCREEN_HALF[0], sy * SCREEN_HALF[1], 0.01).applyMatrix4(phone.matrixWorld);
}

// ---------- 茧 ----------
const LAYERS = 16, PER = 420;
const LAYER_T0 = T.collapse + 0.6, LAYER_DT = 0.55;
const cocoonP = [];
for (let k = 0; k < LAYERS; k++) {
  const appearK = LAYER_T0 + k * LAYER_DT;
  const dom = Math.min(0.97, pinkShare(appearK + 2) + 0.05);
  for (let i = 0; i < PER; i++) {
    const y = 1 - (2 * (i + 0.5)) / PER, r = Math.sqrt(1 - y * y), th = i * 2.399963 + k * 0.7;
    const dir = new THREE.Vector3(Math.cos(th) * r + (rand() - 0.5) * 0.04, y + (rand() - 0.5) * 0.04, Math.sin(th) * r + (rand() - 0.5) * 0.04).normalize();
    cocoonP.push({
      k, dir, rx: 2.0 + 0.16 * k, ry: 3.0 + 0.2 * k,
      col: rand() < dom ? C.pink : TOPICS[1 + Math.floor(rand() * 4)],
      alt: TOPICS[Math.floor(rand() * 5)],
      appear: appearK + rand() * 0.8, size: 0.07 + rand() * 0.05, burst: 6 + rand() * 5,
    });
  }
}
const cocoon = makePoints(cocoonP.length);

// 探索光束（127.87）：随机推荐 / 小众兴趣 / 关注的人
export const EXPLORE = [
  { d: new THREE.Vector3(-0.75, 0.45, 0.5).normalize(), col: C.cyan },
  { d: new THREE.Vector3(-0.55, -0.2, -0.8).normalize(), col: C.green },
  { d: new THREE.Vector3(-0.3, -0.7, -0.6).normalize(), col: C.yellow },
];
export const explorePos = EXPLORE.map(() => new THREE.Vector3());
// 你的操作（132.66 起）：搜索 / 关注 / 不感兴趣
const ACTIONS = [
  { at: T.actions, d: new THREE.Vector3(0.85, 0.45, 0.3).normalize(), col: C.orange },
  { at: T.actions + 0.85, d: new THREE.Vector3(-0.85, 0.15, 0.5).normalize(), col: C.cyan },
  { at: T.actions + 1.7, d: new THREE.Vector3(0.25, 0.9, 0.35).normalize(), col: C.green },
];
const BEAM_N = 150;
const beams = makePoints((EXPLORE.length + ACTIONS.length) * BEAM_N);
const SHELL_R = 4.7; // 外壳大致半径

export function updatePhoneCocoon(t) {
  // ---- 手机 ----
  const pv = winIn(t, T.funnel + 0.6, 200, 0.8, 1);
  phone.visible = pv > 0.001;
  if (phone.visible) {
    phone.rotation.y = Math.atan2(camera.position.x - PHONE.x, camera.position.z - PHONE.z);
    phone.updateMatrixWorld();
    const flash = pulse(t, T.prep[0], 6) + pulse(t, T.prep[1], 6) + 1.2 * pulse(t, T.land, 3) + 0.8 * pulse(t, T.deliver + 1.1, 3);
    lineMat.opacity = (0.45 + 0.8 * flash) * pv;
    const lit = smooth((t - T.funnel - 1) / 0.5);
    // 线性色值，输出时会被提亮：这里要给得很小
    screenMat.color.setRGB(0.0, (0.0015 + 0.003 * lit) * pv, (0.003 + 0.006 * lit) * pv);
  }

  // ---- 茧 ----
  const cv = winIn(t, LAYER_T0 - 0.2, T.burst + 4.5, 0.3, 1.5);
  if (cv <= 0.001) { cocoon.points.visible = false; beams.points.visible = false; return; }
  cocoon.points.visible = true;
  const rot = 0.06 * (t - LAYER_T0), cr = Math.cos(rot), sr = Math.sin(rot);
  const burstK = t > T.burst ? easeOutCubic((t - T.burst) / 1.8) : 0;
  const recolor = smooth((t - T.burst) / 0.6);
  cocoonP.forEach((p, i) => {
    if (t < p.appear) { cocoon.hide(i); return; }
    const dx = p.dir.x * cr - p.dir.z * sr, dz = p.dir.x * sr + p.dir.z * cr, dy = p.dir.y;
    let crack = 0;
    if (t > T.crack) EXPLORE.forEach((e) => {
      const dot = dx * e.d.x + dy * e.d.y + dz * e.d.z;
      if (dot > 0.9) crack = Math.max(crack, (dot - 0.9) / 0.1);
    });
    const crackK = crack * smooth((t - T.crack) / 0.25);
    const extraR = 2.2 * crackK + p.burst * burstK;
    const tx = PHONE.x + dx * (p.rx + extraR), ty = PHONE.y + dy * (p.ry + extraR), tz = PHONE.z + dz * (p.rx + extraR);
    const fk = smooth((t - p.appear) / 0.9);
    const sAng = Math.atan2(dz, dx) + 2.2 * (1 - fk);
    const sRad = Math.hypot(dx, dz) * (p.rx + 3.5);
    const x = lerp(PHONE.x + Math.cos(sAng) * sRad, tx, fk), y = lerp(PHONE.y + dy * (p.ry + 2), ty, fk), z = lerp(PHONE.z + Math.sin(sAng) * sRad, tz, fk);
    const age = t - p.appear;
    let a = (0.16 + 0.6 * Math.exp(-age * 0.35)) * fk * (0.5 + 0.5 * p.k / (LAYERS - 1));
    a *= 1 - smooth((t - T.burst - 1.2) / 2.5);
    tmpC.copy(p.col).lerp(p.alt, recolor).lerp(C.white, crackK * 0.6 * (0.7 + 0.3 * Math.sin(t * 40 + i)));
    cocoon.set(i, x, y, z, tmpC, a * cv * (1 + crackK), p.size * (1 + crackK * 0.8));
  });
  cocoon.flush();

  // ---- 探索光束 + 你的操作 ----
  beams.points.visible = true;
  let bi = 0;
  EXPLORE.forEach((e, j) => {
    const st = T.explore + j * 0.35;
    const v = smooth((t - st) / 0.3) * (1 - smooth((t - T.burst - 1) / 1));
    // 光束头：先停在茧壳外，140.1 撞进去
    const headD = t < T.crack ? lerp(22, SHELL_R + 0.4, smooth((t - st) / 1.6)) : lerp(SHELL_R + 0.4, 1.6, smooth((t - T.crack) / 0.8));
    explorePos[j].copy(PHONE).addScaledVector(e.d, headD);
    for (let k = 0; k < BEAM_N; k++) {
      if (v <= 0.001) { beams.hide(bi++); continue; }
      const f = k / BEAM_N;
      const d = headD + f * 16;
      const jx = Math.sin(k * 12.9898 + j) * 0.12, jy = Math.sin(k * 78.233 + j) * 0.12;
      const a = (k === 0 ? 1 : 0.7 * (1 - f)) * v;
      beams.set(bi++, PHONE.x + e.d.x * d + jx, PHONE.y + e.d.y * d + jy, PHONE.z + e.d.z * d, e.col, a, k === 0 ? 0.35 * (1 + pulse(t, T.crack, 4)) : 0.09);
    }
  });
  ACTIONS.forEach((ac) => {
    const v = smooth((t - ac.at) / 0.3) * (1 - smooth((t - T.burst - 1) / 1));
    for (let k = 0; k < BEAM_N; k++) {
      if (v <= 0.001) { beams.hide(bi++); continue; }
      const ph = ((t - ac.at) * 0.6 + k / BEAM_N) % 1;
      if (ph > clamp01((t - ac.at) / 0.8)) { beams.hide(bi++); continue; }
      const d = lerp(15, 1.2, ph);
      const jx = Math.sin(k * 12.9898) * 0.15, jy = Math.sin(k * 78.233) * 0.15;
      beams.set(bi++, PHONE.x + ac.d.x * d + jx, PHONE.y + ac.d.y * d + jy, PHONE.z + ac.d.z * d, ac.col, 0.8 * v, 0.09);
    }
  });
  beams.flush();
}
