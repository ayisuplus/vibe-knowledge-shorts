// S5–S9：推荐的循环。一条发光轨道：手机 → 右侧上行（你的反应变成记录）→ 星云里的你（数字串更新）→ 从漏斗中间落回手机。
// 轨道所在平面始终朝向镜头，读起来像一张示意图。
import * as THREE from "three";
import { scene, camera, mulberry32, clamp01, smooth, lerp, pulse, win, winIn, easeInOutCubic, C, TOPICS, makePoints, additiveBasic } from "./core.js";
import { T, PHONE, pinkShare, hash01 } from "./world.js";

const rand = mulberry32(72340);

// 局部二维坐标：x 指向画面右方，y 向上
const LOCAL = [
  [0, -8.6], [3.2, -10.2], [9, -9.6], [13.5, -5], [15, 1], [14.8, 8], [12, 14.5], [7, 19.6], [2.2, 21.2],
  [0, 20.4], [0, 16], [0, 11], [0, 6.5], [0, 2.5], [0, -1.5], [0, -5.0], [0, -7.4],
];
const curve = new THREE.CatmullRomCurve3(LOCAL.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "centripetal");
const NS = 1200;
const SAMP = [];
for (let i = 0; i < NS; i++) SAMP.push(curve.getPointAt(i / NS));
function nearestU(x, y) {
  let best = 0, bd = 1e9;
  SAMP.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
  return best / NS;
}
// 四个站在轨道上的位置
export const STATION_U = [0, nearestU(14.9, 2), nearestU(0, 20.4), nearestU(0, 0.6)];

function localAt(u, out) {
  const f = (((u % 1) + 1) % 1) * NS;
  const i = Math.floor(f), k = f - i;
  const a = SAMP[i], b = SAMP[(i + 1) % NS];
  return out.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 0);
}

// ---------- 光点沿轨道的位置 u（圈数） ----------
const LAP1 = [[T.st1, 0], [T.st2, STATION_U[1]], [T.st3, STATION_U[2]], [T.st4, STATION_U[3]], [T.lap1, 1]];
// 快进段：按转速积分（预先算好，保证逐帧确定）
const FF_DT = 0.01, FF_T0 = T.ff;
const FF_TABLE = [];
{
  let u = 4;
  for (let t = FF_T0; t <= 165; t += FF_DT) {
    FF_TABLE.push(u);
    let rate = lerp(0.55, 3.0, smooth((t - T.ff) / 13));
    if (t > T.cocoon + 1.5) rate = lerp(rate, 0.6, smooth((t - T.cocoon - 1.5) / 3));
    if (t > T.burst) rate = t < T.burst + 6 ? 1.4 : 0.4;
    u += rate * FF_DT;
  }
}
export function cometU(t) {
  if (t < T.st1) return 0;
  if (t < T.lap1) {
    for (let i = 0; i < LAP1.length - 1; i++) {
      const [ta, ua] = LAP1[i], [tb, ub] = LAP1[i + 1];
      if (t <= tb) return lerp(ua, ub, easeInOutCubic((t - ta) / (tb - ta)));
    }
  }
  if (t < T.lap2) return lerp(1, 2, (t - T.lap1) / (T.lap2 - T.lap1));
  if (t < T.lap3) return lerp(2, 3, (t - T.lap2) / (T.lap3 - T.lap2));
  if (t < T.brk2) return lerp(3, 4, 1 - Math.pow(1 - (t - T.lap3) / (T.brk2 - T.lap3), 2));
  if (t < T.ff) return 4;
  const i = Math.min(FF_TABLE.length - 1, Math.floor((t - FF_T0) / FF_DT));
  return FF_TABLE[i];
}
export function cometRate(t) {
  if (t < T.ff) return t > T.lap1 && t < T.brk2 ? 0.45 : 0.15;
  return lerp(0.55, 3.0, smooth((t - T.ff) / 13));
}

// ---------- 轨道收紧 / 重新张开 ----------
function collapseK(t) {
  return smooth((t - T.collapse) / (T.cocoon - T.collapse)) * (1 - smooth((t - T.burst) / 3.0));
}
const _l = new THREE.Vector3();
// 局部点 → 世界坐标（平面朝向镜头，A 为镜头方位角）
function toWorld(lx, ly, A, out) {
  return out.set(lx * Math.cos(A), ly, -lx * Math.sin(A));
}
function trackPoint(u, t, A, out) {
  localAt(u, _l);
  const k = collapseK(t);
  if (k > 0) {
    const ang = 2 * Math.PI * u + t * 2.2;
    _l.x = lerp(_l.x, Math.cos(ang) * 3.6, k);
    _l.y = lerp(_l.y, PHONE.y + Math.sin(ang) * 5.0, k);
  }
  return toWorld(_l.x, _l.y, A, out);
}

// ---------- 点集 ----------
const N_RAIL = 520, N_FLOW = 560, N_TRAIL = 90;
const rail = makePoints(N_RAIL);
const flowP = [];
for (let i = 0; i < N_FLOW; i++) flowP.push({ ph: i / N_FLOW, j: (rand() - 0.5) * 0.25, topic: Math.floor(rand() * 5) });
const flow = makePoints(N_FLOW);
const comet = makePoints(N_TRAIL + 2);
// 站点光环
const rings = [0, 1, 2, 3].map(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.75, 48), additiveBasic(0xffffff));
  scene.add(m);
  return m;
});
export const stationPos = [0, 1, 2, 3].map(() => new THREE.Vector3());
export const cometPos = new THREE.Vector3();

export function loopAlpha(t) {
  return winIn(t, T.loopStart, T.cocoon + 1.2, 0.4, 1.0) + winIn(t, T.burst + 0.3, 170, 0.8, 1);
}

const tmpV = new THREE.Vector3(), tmpC = new THREE.Color(), railC = new THREE.Color();

export function updateLoop(t) {
  const la = Math.min(1, loopAlpha(t));
  const vis = la > 0.001;
  rail.points.visible = flow.points.visible = comet.points.visible = vis;
  rings.forEach((r) => (r.visible = vis));
  const A = Math.atan2(camera.position.x, camera.position.z);
  for (let s = 0; s < 4; s++) trackPoint(STATION_U[s], t, A, stationPos[s]);
  if (!vis) return;

  const reveal = smooth((t - T.loopStart) / 1.2);
  const pinkK = smooth((t - T.ff) / 14) * (1 - smooth((t - T.burst) / 2));
  const multi = smooth((t - T.burst) / 2);
  railC.copy(C.cyan).lerp(C.pink, pinkK);

  // 轨道本身
  for (let i = 0; i < N_RAIL; i++) {
    const u = i / N_RAIL;
    if (u > reveal && t < T.burst) { rail.hide(i); continue; }
    trackPoint(u, t, A, tmpV);
    rail.set(i, tmpV.x, tmpV.y, tmpV.z, railC, 0.5 * la, 0.22);
  }
  rail.flush();

  // 沿轨道流动的小光点：标出方向
  const flowSpeed = 0.06 + 0.25 * pinkK;
  flowP.forEach((f, i) => {
    const u = (f.ph + t * flowSpeed) % 1;
    if (u > reveal && t < T.burst) { flow.hide(i); return; }
    trackPoint(u, t, A, tmpV);
    tmpC.copy(railC).lerp(TOPICS[f.topic], multi);
    flow.set(i, tmpV.x + f.j, tmpV.y + f.j, tmpV.z, tmpC, 0.7 * la, 0.26);
  });
  flow.flush();

  // 光点 + 拖尾：越快拖尾越长
  const u0 = cometU(t);
  const rate = cometRate(t);
  const cv = smooth((t - T.st1 + 0.3) / 0.3) * la;
  trackPoint(u0, t, A, cometPos);
  const headC = t > T.burst ? C.cyan : C.white;
  comet.set(0, cometPos.x, cometPos.y, cometPos.z, headC, cv, 0.9);
  comet.set(1, cometPos.x, cometPos.y, cometPos.z, t > T.ff ? C.pink : C.cyan, cv * 0.45, 3.6);
  const trailLen = clamp01(0.04 + 0.11 * rate);
  for (let j = 0; j < N_TRAIL; j++) {
    const f = (j + 1) / N_TRAIL;
    trackPoint(u0 - f * trailLen, t, A, tmpV);
    tmpC.copy(C.white).lerp(t > T.ff && t < T.burst ? C.pink : C.cyan, f);
    comet.set(2 + j, tmpV.x, tmpV.y, tmpV.z, tmpC, cv * (1 - f) * 0.9, 0.5 * (1 - f * 0.6));
  }
  comet.flush();

  // 站点光环：光点经过时亮一下
  rings.forEach((r, s) => {
    r.position.copy(stationPos[s]);
    r.lookAt(camera.position);
    const d = Math.abs(((u0 - STATION_U[s]) % 1 + 1.5) % 1 - 0.5);
    const hit = Math.exp(-Math.pow(d / 0.03, 2));
    r.scale.setScalar(1 + 0.6 * hit);
    r.material.color.copy(railC);
    r.material.opacity = (0.35 + 1.2 * hit) * la * (1 - collapseK(t)) * (1 - smooth((t - T.wide) / 1.0));
  });
}

// 第 n 圈转完的时刻（推荐页第 n 张卡出现的时刻）
const LAP_T = [T.deliver + 1.1, T.lap1, T.lap2, T.lap3, T.brk2];
{
  let n = 5;
  for (let i = 0; i < FF_TABLE.length && n < 400; i++) {
    if (FF_TABLE[i] >= n) { LAP_T[n] = FF_T0 + i * FF_DT; n++; }
  }
}
export function lapTime(n) { return LAP_T[Math.min(n, LAP_T.length - 1)]; }
// 推荐页卡片：第 n 张的颜色，按它出现那一刻的“粉色占比”决定，之后不再变
export function cardColorIndex(n) {
  if (n === 0) return 0; // 第一张就是那条粉色的
  const p = pinkShare(lapTime(n));
  if (hash01(n * 7.13) < p) return 0;
  return 1 + Math.floor(hash01(n * 3.71 + 1) * 4);
}
export function cardCount(t) {
  if (t < T.deliver + 1.1) return 0;
  return 1 + Math.floor(cometU(t));
}
