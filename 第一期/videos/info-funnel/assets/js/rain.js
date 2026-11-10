// S3：漏斗降下来之后，原本直接落向人群的信息雨，改为先落进漏斗、层层筛过再落进你的手机。
import * as THREE from "three";
import { mulberry32, clamp01, smooth, lerp, C, TOPICS, makePoints } from "./core.js";
import { R, Y_TOP, Y_NECK, Y_BOT } from "./funnel.js";
import { FS, TIERS, T } from "./world.js";

const rand = mulberry32(20261011);
const N = 13000;
const V_AIR = 6.0, SWIRL = 0.55;
const PALETTE = [C.cyan, C.pink, C.yellow, C.white, C.ice, C.green];
const REJECT = TIERS.map((t) => new THREE.Color(t.color));
const P = [];
for (let i = 0; i < N; i++) {
  const q = rand();
  const fate = q < 0.36 ? 0 : q < 0.62 ? 1 : q < 0.8 ? 2 : q < 0.93 ? 3 : 4;
  P.push({
    s: 33.3 + rand() * 13.5, th: rand() * Math.PI * 2, u: 0.18 + 0.8 * Math.sqrt(rand()), v: 1.3 + rand() * 0.5,
    fate, col: PALETTE[Math.floor(rand() * PALETTE.length)],
    ej: 1.4 + rand() * 1.6, up: 0.6 + rand() * 0.9, size: 0.03 + rand() * 0.03,
  });
}
const pts = makePoints(N);
const tmpC = new THREE.Color();

export function updateRain(t) {
  const ga = smooth((t - 33.0) / 0.8) * (1 - smooth((t - 47.5) / 1.5));
  if (ga <= 0.001) { pts.points.visible = false; return; }
  pts.points.visible = true;
  for (let i = 0; i < N; i++) {
    const p = P[i], c = p.col;
    let x, y, z, a, s = p.size;
    if (t < p.s) {
      y = Y_TOP + V_AIR * (p.s - t);
      if (y > 13) { pts.hide(i); continue; }
      const rad = R(Y_TOP) * p.u * (1 + 0.04 * (y - Y_TOP));
      x = Math.cos(p.th) * rad; z = Math.sin(p.th) * rad; a = 0.3;
      tmpC.copy(c);
    } else {
      const yIn = Y_TOP - p.v * (t - p.s);
      const yf = p.fate < 4 ? TIERS[p.fate].y : -99;
      if (p.fate < 4 && yIn <= yf) {
        const tau = (yf - yIn) / p.v;
        const ang = p.th + SWIRL * (Y_TOP - yf);
        const rad = R(yf) * p.u + p.ej * tau;
        y = yf + p.up * tau - 2.4 * tau * tau;
        x = Math.cos(ang) * rad; z = Math.sin(ang) * rad;
        a = 0.8 * Math.max(0, 1 - tau / 1.1);
        tmpC.copy(c).lerp(REJECT[p.fate], clamp01(tau * 8));
        s = p.size * (1 + 1.6 * Math.exp(-tau * 10));
      } else {
        y = yIn;
        let rad = R(y) * p.u;
        if (y < Y_NECK) rad = R(Y_NECK) * p.u * 0.6;
        if (y < Y_BOT) y = Y_BOT - (Y_BOT - y) * 2.2;
        const ang = p.th + SWIRL * (Y_TOP - Math.max(y, Y_NECK));
        x = Math.cos(ang) * rad; z = Math.sin(ang) * rad;
        a = 0.36 * clamp01((y + 4.2) / 0.8);
        tmpC.copy(c);
      }
    }
    pts.set(i, x * FS, y * FS, z * FS, tmpC, a * ga, s * FS);
  }
  pts.flush();
}
