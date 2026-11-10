// S0–S2：社会里的信息茧房。人群（光点）、信息雨、合口味的留下、相近的人聚成圈子、圈子裹上壳。
import * as THREE from "three";
import { mulberry32, clamp01, smooth, lerp, win, winIn, pulse, C, TOPICS, makePoints } from "./core.js";
import { T, CROWD_Y } from "./world.js";

const rand = mulberry32(2183);
const NP = 1400;
const GOLDEN = 2.399963;

// 圈子中心：粉色圈子在正中（你在里面），其余四个在周围
const GROUP_C = [[0, 0], [15, 2], [-3, 15], [-15, -2], [3, -15]];
const people = [];
const groupMembers = [[], [], [], [], []];
for (let i = 0; i < NP; i++) {
  const r = 28 * Math.sqrt((i + 0.5) / NP), th = i * GOLDEN;
  const pref = i === 0 ? 0 : Math.floor(rand() * 5);
  people.push({
    x0: i === 0 ? 0 : Math.cos(th) * r + (rand() - 0.5) * 0.6,
    z0: i === 0 ? 0 : Math.sin(th) * r + (rand() - 0.5) * 0.6,
    pref, delay: rand(), x1: 0, z1: 0, size: 0.22 + rand() * 0.08,
  });
  groupMembers[pref].push(i);
}
// 每个人在自己圈子里的目标位置
groupMembers.forEach((list, g) => {
  list.forEach((idx, k) => {
    const p = people[idx];
    if (idx === 0) { p.x1 = 0; p.z1 = 0; return; }
    const rr = 0.9 + 5.2 * Math.sqrt((k + 0.5) / list.length), th = k * GOLDEN + g;
    p.x1 = GROUP_C[g][0] + Math.cos(th) * rr;
    p.z1 = GROUP_C[g][1] + Math.sin(th) * rr;
  });
});
export const GROUP_R = 6.4;

function personPos(i, t, out) {
  const p = people[i];
  const k = smooth((t - T.group - p.delay * 1.4) / 2.8);
  return out.set(lerp(p.x0, p.x1, k), CROWD_Y, lerp(p.z0, p.z1, k));
}
export function youPersonPos(t, out = new THREE.Vector3()) { return personPos(0, t, out); }

// ---------- 点集 ----------
const crowd = makePoints(NP);
// 信息雨
const NR = 7000;
const rainP = [];
for (let i = 0; i < NR; i++) {
  rainP.push({ land: 0.06 + rand() * 10.2, target: Math.floor(rand() * NP), col: TOPICS[Math.floor(rand() * 5)], jx: (rand() - 0.5) * 1.4, jz: (rand() - 0.5) * 1.4, h: 20 + rand() * 10, size: 0.12 + rand() * 0.08 });
}
const rain = makePoints(NR);
// 围着人转的同色光点
const K = 3;
const orbP = [];
for (let i = 0; i < NP; i++) {
  const has = i === 0 || rand() < 0.72;
  for (let k = 0; k < K; k++) orbP.push({ i, appear: has ? 1.4 + rand() * 9 : 1e9, r: 0.55 + rand() * 0.35, w: 1.4 + rand() * 1.4, ph: rand() * 6.28, tilt: rand() - 0.5 });
}
const orbs = makePoints(orbP.length);
// 单个人的壳（开场三拍）
const SHELL_PEOPLE = [];
for (let b = 0; b < 3; b++) for (let k = 0; k < 12; k++) SHELL_PEOPLE.push({ i: 1 + Math.floor(rand() * (NP - 1)), at: [T.b3, T.b4, T.b5][b] });
const SHELL_N = 44;
const shells = makePoints(SHELL_PEOPLE.length * SHELL_N);
// 你：靠近的信息
const NA = 36;
const appr = [];
for (let k = 0; k < NA; k++) {
  const pink = k % 3 === 0;
  const th = rand() * Math.PI * 2, ph = 0.3 + rand() * 1.1;
  appr.push({
    start: 10.8 + (k / NA) * 4.6 + rand() * 0.3, pink, col: pink ? C.pink : TOPICS[1 + (k % 4)],
    dir: new THREE.Vector3(Math.cos(th) * Math.sin(ph), Math.cos(ph) * 0.6, Math.sin(th) * Math.sin(ph)),
    side: rand() < 0.5 ? -1 : 1, orbR: 0.8 + rand() * 0.6, orbW: 1.2 + rand(), orbPh: rand() * 6.28,
  });
}
const approach = makePoints(NA);
// 圈子里来回传
const NB = 1400;
const bounceP = [];
for (let k = 0; k < NB; k++) {
  const g = Math.floor(rand() * 5), list = groupMembers[g];
  bounceP.push({ g, a: list[Math.floor(rand() * list.length)], b: list[Math.floor(rand() * list.length)], sp: 0.5 + rand() * 0.6, ph: rand(), start: T.echo + rand() * 1.2 });
}
const bounce = makePoints(NB);
// 圈子之间的连线
const NL = 64, LP = 26;
const linksDef = [];
for (let k = 0; k < NL; k++) {
  const ga = k % 5, gb = (ga + 1 + Math.floor(rand() * 4)) % 5;
  const la = groupMembers[ga], lb = groupMembers[gb];
  linksDef.push({ a: la[Math.floor(rand() * la.length)], b: lb[Math.floor(rand() * lb.length)], off: T.unlink + (k / NL) * 2.6 + rand() * 0.2 });
}
const links = makePoints(NL * LP);
// 圈子的壳（半球罩）
const GS_N = 560;
const gshellP = [];
for (let g = 0; g < 5; g++) {
  for (let k = 0; k < GS_N; k++) {
    const y = (k + 0.5) / GS_N, r = Math.sqrt(1 - y * y), th = k * GOLDEN;
    gshellP.push({ g, dx: Math.cos(th) * r, dy: y, dz: Math.sin(th) * r, delay: rand() * 1.6, sx: (rand() - 0.5) * 20, sz: (rand() - 0.5) * 20 });
  }
}
const gshell = makePoints(gshellP.length);

const pv = new THREE.Vector3(), pv2 = new THREE.Vector3(), tmpC = new THREE.Color();

// 人群整体亮度：开头三段是主角，之后退为背景
export function crowdAlpha(t) {
  return lerp(1, 0.22, smooth((t - T.funnel) / 2.5));
}

export function updatePeople(t) {
  const ca = crowdAlpha(t);
  // ---- 人 ----
  const tint = smooth((t - T.b3) / 12);
  const focus = win(t, 11.2, T.group + 0.6, 0.8, 1.2);
  for (let i = 0; i < NP; i++) {
    const p = people[i];
    personPos(i, t, pv);
    tmpC.copy(C.white).lerp(TOPICS[p.pref], i === 0 ? 0 : tint * 0.85);
    const isYou = i === 0 && t > T.brk1 - 0.3 && t < T.funnel + 1;
    crowd.set(i, pv.x, pv.y, pv.z, isYou ? C.white : tmpC, (isYou ? 1 : 0.85 * (1 - 0.8 * focus)) * ca, p.size * (isYou ? 1.6 : 1));
  }
  crowd.flush();

  // ---- 信息雨（开场） ----
  const rv = 1 - smooth((t - T.brk1) / 0.5);
  if (rv > 0.001) {
    rain.points.visible = true;
    rainP.forEach((r, k) => {
      personPos(r.target, t, pv);
      const dt = r.land - t;
      if (dt > 2.2 || t > r.land + 0.6) { rain.hide(k); return; }
      if (dt > 0) {
        rain.set(k, pv.x + r.jx, CROWD_Y + 0.2 + dt * r.h * 0.5, pv.z + r.jz, r.col, 0.7 * rv, r.size);
      } else {
        const tau = -dt;
        rain.set(k, pv.x + r.jx * (1 + tau * 2), CROWD_Y + 0.15, pv.z + r.jz * (1 + tau * 2), r.col, 0.9 * (1 - tau / 0.6) * rv, r.size * (1 + tau * 3));
      }
    });
    rain.flush();
  } else rain.points.visible = false;

  // ---- 同色光点围着人转 ----
  const ov = winIn(t, 1.2, T.funnel + 2, 0.4, 2) * (1 - 0.5 * smooth((t - T.echo) / 2)) * (1 - 0.85 * focus);
  if (ov > 0.001) {
    orbs.points.visible = true;
    orbP.forEach((o, k) => {
      if (t < o.appear) { orbs.hide(k); return; }
      personPos(o.i, t, pv);
      const a = o.ph + o.w * t;
      const fin = smooth((t - o.appear) / 0.5);
      orbs.set(k, pv.x + Math.cos(a) * o.r, pv.y + 0.35 + Math.sin(a) * o.r * o.tilt, pv.z + Math.sin(a) * o.r, TOPICS[people[o.i].pref], 0.8 * fin * ov, 0.1);
    });
    orbs.flush();
  } else orbs.points.visible = false;

  // ---- 单人的壳 ----
  const sv = winIn(t, T.b3 - 0.1, T.group + 0.8, 0.1, 1) * (1 - 0.85 * focus);
  if (sv > 0.001) {
    shells.points.visible = true;
    let idx = 0;
    SHELL_PEOPLE.forEach((s) => {
      personPos(s.i, t, pv);
      const k = easeOut((t - s.at) / 0.6);
      for (let j = 0; j < SHELL_N; j++) {
        if (t < s.at) { shells.hide(idx++); continue; }
        const y = 1 - (2 * (j + 0.5)) / SHELL_N, r = Math.sqrt(1 - y * y), th = j * GOLDEN + t * 0.6;
        const R = 2.1 * (1.6 - 0.6 * k);
        shells.set(idx++, pv.x + Math.cos(th) * r * R, pv.y + 0.35 + y * R * 0.9, pv.z + Math.sin(th) * r * R, TOPICS[people[s.i].pref], 0.8 * k * sv, 0.14);
      }
    });
    shells.flush();
  } else shells.points.visible = false;

  // ---- 你：合口味的留下 ----
  const av = winIn(t, 10.7, T.group + 1, 0.2, 1);
  if (av > 0.001) {
    approach.points.visible = true;
    personPos(0, t, pv);
    appr.forEach((a, k) => {
      const tau = t - a.start;
      if (tau < 0) { approach.hide(k); return; }
      if (a.pink) {
        // 被接住：飞近后绕着你转
        const k1 = smooth(tau / 1.4);
        const ang = a.orbPh + a.orbW * tau;
        const ox = Math.cos(ang) * a.orbR, oz = Math.sin(ang) * a.orbR;
        const fx = pv.x + a.dir.x * 6, fy = pv.y + 0.35 + a.dir.y * 6, fz = pv.z + a.dir.z * 6;
        approach.set(k, lerp(fx, pv.x + ox, k1), lerp(fy, pv.y + 0.35, k1), lerp(fz, pv.z + oz, k1), C.pink, 0.95 * av, 0.22 * (1 + 0.8 * pulse(t, a.start + 1.4, 6)));
      } else {
        // 不合口味：擦身而过，漂走变暗
        const k1 = tau / 2.6;
        const d = 6 * (1 - 2 * k1);
        const sideOff = 1.4 * Math.sin(Math.PI * clamp01(k1)) * a.side;
        approach.set(k, pv.x + a.dir.x * d + -a.dir.z * sideOff, pv.y + 0.35 + a.dir.y * d, pv.z + a.dir.z * d + a.dir.x * sideOff, a.col, 0.85 * (1 - smooth((k1 - 0.5) / 0.4)) * av, 0.2);
      }
    });
    approach.flush();
  } else approach.points.visible = false;

  // ---- 圈子里来回传 ----
  const bv = winIn(t, T.echo, T.funnel + 2, 0.5, 2);
  if (bv > 0.001) {
    bounce.points.visible = true;
    bounceP.forEach((b, k) => {
      if (t < b.start) { bounce.hide(k); return; }
      personPos(b.a, t, pv); personPos(b.b, t, pv2);
      const f = ((t - b.start) * b.sp + b.ph) % 2;
      const u = f < 1 ? f : 2 - f;
      const x = lerp(pv.x, pv2.x, u), z = lerp(pv.z, pv2.z, u);
      const y = CROWD_Y + 0.35 + Math.sin(Math.PI * u) * 1.2;
      bounce.set(k, x, y, z, TOPICS[b.g], 0.8 * bv * smooth((t - b.start) / 0.4), 0.09);
    });
    bounce.flush();
  } else bounce.points.visible = false;

  // ---- 圈子之间的连线：一根根熄灭 ----
  const lv = winIn(t, T.group, T.before + 0.5, 0.6, 0.3);
  if (lv > 0.001) {
    links.points.visible = true;
    let idx = 0;
    linksDef.forEach((L) => {
      personPos(L.a, t, pv); personPos(L.b, t, pv2);
      const flash = pulse(t, L.off, 8) * (t >= L.off ? 1 : 0);
      const alive = 1 - smooth((t - L.off) / 0.25);
      for (let j = 0; j < LP; j++) {
        const f = j / (LP - 1);
        const a = (0.35 * alive + 1.2 * flash * alive) * lv;
        if (a <= 0.001) { links.hide(idx++); continue; }
        links.set(idx++, lerp(pv.x, pv2.x, f), CROWD_Y + 0.35 + Math.sin(Math.PI * f) * 2.5, lerp(pv.z, pv2.z, f), C.ice, a, 0.06);
      }
    });
    links.flush();
  } else links.points.visible = false;

  // ---- 圈子裹上壳 ----
  const gv = winIn(t, T.unlink + 0.3, T.funnel + 3, 0.2, 2.5);
  if (gv > 0.001) {
    gshell.points.visible = true;
    gshellP.forEach((s, k) => {
      const k1 = smooth((t - T.unlink - 0.4 - s.delay) / 1.2);
      if (k1 <= 0) { gshell.hide(k); return; }
      const gc = GROUP_C[s.g];
      const R = GROUP_R + (s.g === 0 ? 0.6 : 0);
      const tx = gc[0] + s.dx * R, ty = CROWD_Y + s.dy * 3.2, tz = gc[1] + s.dz * R;
      gshell.set(k, lerp(gc[0] + s.sx, tx, k1), lerp(CROWD_Y + 12, ty, k1), lerp(gc[1] + s.sz, tz, k1), TOPICS[s.g], 0.45 * k1 * gv, 0.1);
    });
    gshell.flush();
  } else gshell.points.visible = false;
}

function easeOut(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
