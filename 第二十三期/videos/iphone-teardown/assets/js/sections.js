// 六段的状态函数：machine(n, t) 摆零件，shot(n, t, k) 摆机位。全部是拍 n 的纯函数，可任意跳帧。
import * as THREE from "three";
import { root, camera, scene, key, rim } from "./world.js";
import { clamp, mix, mixV, ease, easeOut, easeIn, clunk, win, back, expMix } from "./lib.js";
import { STOPS } from "./beats.js";
import { flipper, phone, panel, seam, door, screen, display, flex, tray, battery, lid, SCREWS, taptic, tMass, springs, tLid, rotor, rotorW, rotorMats, stack, D_LOCAL, pkgL, pkgR, vc, nail, LENS_POINT } from "./phone.js";
import { stage, sFlip, hsTop, uppers, iris, drive, BLADES, irisCover, beam, beamMat, sensorGlow, hair, phiOf } from "./iris.js";
import { die, floor, city, cityU, traffic, SIGN, AERIAL, old, CITY_S, C4004 } from "./city.js";

const RISE = 4.8;
export const D = [D_LOCAL[0], D_LOCAL[1], RISE + .22];       // 翻转后的芯片面
export const PM = [1.65, 5.6, 2.2];                          // 主摄模组升起后的位置
export const PT = [-1.85, -6.8, .2];                         // 马达
const S_CAM = 14, S_TAP = 7;

/** 世界围绕枢轴的放大倍数 */
export function zoom(n) {
  if (n >= 47 && n < 72) return [expMix(1, S_CAM, ease((n - 47) / 2.8)), PM];
  if (n >= 72 && n < 80) return [S_TAP, PT];
  if (n >= 86 && n < 113) return [expMix(1, CITY_S, ease((n - 86) / 3.6)), D];
  if (n >= 113 && n < 115) return [expMix(CITY_S, 1, ease((n - 113) / 2)), D];
  return [1, D];
}

/** 当前光圈的半径与档位 */
export function aperture(n) {
  if (n < 59) return [STOPS[0][2], STOPS[0][1]];
  if (n < 67) { let a = STOPS[0][2], s = STOPS[0][1]; for (let i = 1; i < STOPS.length; i++) { const u = clunk(n, STOPS[i][0], .35); if (n >= STOPS[i][0]) { a = mix(STOPS[i - 1][2], STOPS[i][2], u); s = STOPS[i][1]; } } return [a, s]; }
  if (n < 72) { const u = ease((n - 68) / 2.8); return [mix(STOPS[3][2], STOPS[0][2], u), u > .98 ? "1.48" : u < .02 ? "4.0" : mix(4, 1.48, u).toFixed(2)]; }
  return [STOPS[0][2], STOPS[0][1]];
}

export function machine(n, t) {
  const [s, pv] = zoom(n);
  root.scale.setScalar(s); root.position.set(pv[0] * (1 - s), pv[1] * (1 - s), pv[2] * (1 - s));
  // 整机翻转：开场转一圈，n22 翻到正面，结尾再转两圈亮屏
  const spinA = n < 9 ? (1 - easeOut((n - 6) / 3)) * Math.PI * 2 * (n >= 6 ? 1 : 0) : 0;
  const flip = n < 22 ? Math.PI + spinA : n < 24 ? Math.PI * (1 + clunk(n, 22, 2)) : 0;
  const spinB = n >= 122.5 ? (1 - easeOut((n - 122.5) / 3.6)) * Math.PI * 4 : 0;
  flipper.rotation.y = flip + spinB;
  const flying = (n >= 49.2 && n < 72) || (n >= 89.4 && n < 113.5);
  phone.visible = !flying;

  // ── 后背面板 ──
  seam.visible = win(n, 11, 12.6); seam.geometry.setDrawRange(0, Math.floor(seam.userData.full * easeOut((n - 11) / 1) / 6) * 6);
  const pIn = back(n, 121, 1.4), pu = clunk(n, 12, .8) * pIn, pf = ease((n - 14) / 3) * pIn, pgo = easeIn((n - 22) / 1) * pIn;
  panel.position.set(0, -1.85 - pgo * 20, -.39 - pu * 5.2 + (1 - pIn) * 0 - (n >= 121 ? (1 - pIn) * 0 : 0));
  panel.rotation.set(pf * Math.PI, 0, 0);
  panel.visible = (n < 23.2 || n >= 121) && !flying;

  // ── 屏幕 ──
  const dIn = back(n, 120.5, 1.5), dOpen = ease((n - 24) / 2.4) * dIn, dGo = easeIn((n - 26.4) / 1.4) * dIn;
  door.rotation.y = -dOpen * 1.85; door.position.x = -3.495 - dGo * 18; door.position.z = .39 + dGo * 3;
  door.visible = (n < 28 || n >= 120.5) && !flying;
  flex.visible = false;
  display.material.opacity = ease((n - 125) / .6);

  // ── 托盘、螺丝 ──
  const trIn = back(n, 117.5, 1.3), tu = clunk(n, 36, .7) * trIn, tgo = easeIn((n - 41) / 1.6) * trIn;
  tray.position.set(-tgo * 2, -1.7 - tgo * 22, -.1 + tu * 2.6 + tgo * 3);
  tray.rotation.set(tgo * .9, tgo * .4, 0); tray.visible = (n < 42.8 || n >= 117.5) && !flying;
  battery.position.z = .23; lid.position.set(0, -ease((n - 38) / 1.4) * back(n, 116, .5) * 16, .215 + ease((n - 38) / 1.4) * back(n, 116, .5) * .5);
  for (const g of SCREWS) {
    const k = g.userData.k, a = 28 + k * .5, iS = back(n, 119 + k * .1, .4), d = n - a, z = easeOut(d / .35), f = easeIn((d - .3) / .9);
    g.position.set(g.userData.x + f * (k % 2 ? 7 : -7) * iS, g.userData.y + f * (k % 3 - 1) * 4 * iS, .28 + (z * .6 + f * 9) * iS); g.rotation.z = z * 12 * iS;
    g.visible = (d < 1.3 || n >= 119 + k * .1) && !flying;
  }

  // ── 主摄模组 ──
  const sIn = back(n, 116, 1.3), sUp = clunk(n, 46, 1) * sIn, sFl = ease((n - 46.2) / 1.6) * sIn;
  stage.position.set(1.65, 5.6, -.02 + sUp * 2.22 + (n >= 116 ? (1 - sIn) * 0 : 0));
  sFlip.rotation.y = Math.PI * (1 - sFl); sFlip.scale.z = mix(.36, 1, Math.max(sFl, sUp));
  const stageOn = (n >= 24 && n < 72) || n >= 115.8; stage.visible = stageOn;
  hsTop.position.z = .5 + easeIn((n - 48) / 1.4) * sIn * 16; hsTop.visible = n < 49.4 || n >= 116;
  uppers.forEach((g) => { const { i, z } = g.userData, u = ease((n - 48.8 - i * .25) / 1.6) * sIn, ang = i * 2.1 + .6; g.position.set(Math.cos(ang) * u * 3.2, Math.sin(ang) * u * 3.2, z + u * (1.5 + i * .45)); g.visible = u < .99; });
  irisCover.position.z = .05 + easeIn((n - 50) / 1.3) * sIn * 10; irisCover.visible = n < 51.3 || n >= 116;
  const [a] = aperture(n), phi = phiOf(a);
  // 叶片：n52 炸开悬浮，n58.4 归位
  const blow = ease((n - 52) / 1.6) * (1 - ease((n - 57.8) / 1.3));
  const solo = ease((n - 54.6) / .8) * (1 - ease((n - 57.8) / 1.3));
  BLADES.forEach((b, i) => {
    const out = 1 + blow * .38, lift = blow * (.08 + i * .05);
    b.g.position.set(b.px * out, b.py * out, .004 + i * .0012 + lift);
    b.g.rotation.set(0, .022, b.a + Math.PI + phi, "ZYX");
    if (i === 0) { b.g.position.lerp(_b0.set(0, -1.1, .62), solo); b.g.rotation.set(0, .022 * (1 - solo), mix(b.a + Math.PI + phi, Math.PI * .55, solo), "ZYX"); }
  });
  drive.rotation.z = (phi - phiOf(.23)) * .45;
  hair.visible = solo > .5; hair.position.set(.06, -.98, .645);
  // 光束
  const bo = n >= 67 && n < 72 ? ease((n - 67) / .6) * (1 - ease((n - 71.4) / .5)) : 0, ar = a / .23;
  beam.visible = bo > .002; beam.scale.set(a * .98, a * .98, 1.8); beam.position.z = .9; beamMat.uniforms.uO.value = bo * .3 * ar * ar;
  sensorGlow.opacity = bo * .85 * ar * ar;

  // ── 线性马达 ──
  const tLidGo = easeIn((n - 72.2) / .8) * back(n, 115.5, 1);
  tLid.position.set(0, -tLidGo * 10, .17 + tLidGo * .5); tLid.visible = n < 73.2 || n >= 115.5;
  const ro = ease((n - 72.6) / .4) * (1 - ease((n - 75) / .5)), roS = n * 8;
  rotor.visible = ro > .002; rotorMats.forEach((m) => { m.opacity = ro; }); rotorW.rotation.x = roS * .4;
  const mo = ease((n - 75.2) / .6) * (win(n, 75, 81) ? 1 : 0), amp = .17 * mo, wv = Math.sin(t * Math.PI * 2 * 3.6);
  tMass.position.x = amp * wv; taptic.position.x = -1.85 - amp * .08 * wv;
  const sL = (1.19 - .475 - amp * wv), sR = (1.19 - .475 + amp * wv);
  springs[0].scale.x = sL / .715; springs[1].scale.x = sR / .715;

  // ── 主板叠层 ──
  const stIn = back(n, 115.2, 1.4), up = clunk(n, 80, 1) * stIn, fl = ease((n - 80.4) / 1.6) * stIn;
  stack.position.set(D_LOCAL[0], D_LOCAL[1], up * RISE); stack.rotation.y = fl * Math.PI;
  const vIn = back(n, 114.6, 1.2), vU = ease((n - 82) / 1.4) * vIn;
  vc.position.set(1.35 + vU * -13, -2.4, -.3 - vU * .9); vc.rotation.y = vU * -.35; vc.visible = n >= 80 && n < 115.9 && vU < .98;
  stack.visible = !(n >= 89.4 && n < 113.5);
  const pk = clunk(n, 84.2, 1.2) * back(n, 114, 1) * .95; pkgL.position.x = -.425 - pk; pkgR.position.x = .425 + pk;
  // 指甲盖轮廓
  const no = ease((n - 83.4) / .5) * (1 - ease((n - 85.6) / .4)); nail.visible = no > .002; nail.position.set(D[0] + 1.95, D[1] - .1, D[2] + .02); nail.userData.fill.opacity = no * .22; nail.userData.line.opacity = no;

  // ── 芯片城 ──
  die.position.set(D[0], D[1], D[2] - .02); die.visible = n >= 84.6 && n < 114.4;
  floor.visible = true; cityU.uGrow.value = mix(0, 1.25, ease((n - 87) / 3)); city.visible = n > 86; traffic.visible = n > 87.5;
  SIGN.forEach((m) => { m.visible = win(n, 90, 93.4); });
  AERIAL.forEach((m) => { const v = ease((n - 107.5) / .9) * (1 - ease((n - 112.5) / .4)); m.visible = m.userData.b.visible = v > .002; m.material.opacity = v; m.userData.b.material.opacity = v * .62; });
  const ol = ease((n - 92.4) / 1.4) * (1 - ease((n - 104) / 1)); old.visible = ol > .002; old.scale.set(1, 1, Math.max(ol, .001));

  // ── 灯 ──
  const big = n >= 86 && n < 114.5;
  key.intensity = big ? mix(2.6, 1.2, ease((n - 86) / 2)) : 2.6; key.castShadow = !big;
  key.target.position.set(pv[0], pv[1], pv[2]); key.position.set(pv[0] - 7, pv[1] + 9, pv[2] + 16); rim.position.set(pv[0] + 9, pv[1] - 6, pv[2] + 8);
  scene.environmentRotation.set(.12 * Math.sin(t * .4), .35 * Math.sin(t * .22), 0); scene.environmentIntensity = n >= 103 && n < 113 ? .5 : .9;
  const fog = n >= 89.4 && n < 104 ? .007 * ease((n - 89.4) / .6) * (1 - ease((n - 103) / 3)) : 0; scene.fog.density = fog; cityU.uFog.value = fog;
}
const _b0 = new THREE.Vector3();

// ── 机位 ──
const Y = [0, 1, 0], Z = [0, 0, 1], LS = [-1, 0, 0];
const rel = (o, v) => [o[0] + v[0], o[1] + v[1], o[2] + v[2]];
// [起拍, 止拍, 机位0, 机位1, 看点0, 看点1, fov, up, 缓动]
const lin = (x) => clamp(x);
const SHOTS = [
  [0, 2, rel(LENS_POINT, [-1.1, -.75, 1.1]), rel(LENS_POINT, [.8, -.75, .9]), LENS_POINT, LENS_POINT, 30, Y, lin],
  [2, 4, [5.1, -8.5, 1], [5.1, 3.5, 1], [3.5, -5.3, 0], [3.5, 6.7, 0], 30, Z, ease],
  [4, 6, [-3, -10.6, 2.8], [3, -10.6, 1.5], [0, -7.4, 0], [0, -7.4, 0], 30, Z, lin],
  [6, 9, [7, -4, 38], [2.5, -1, 27], [0, -.9, 0], [0, -.9, 0], 36, Y, easeOut],
  [9, 12, [-6, 0, 19], [-4.2, 1.6, 15], [-.8, 2.2, 0], [-.6, 2.6, 0], 36, Y, lin],
  [12, 14, [6, -4, 24], [4, -3, 22], [0, -1, 1.6], [0, -1, 2.5], 36, Y, lin],
  [14, 17, [3, -6, 22], [0, -5, 20], [0, -1.8, 4], [0, -1.8, 4.6], 36, Y, ease],
  [17, 22, [.6, -4.6, 15.5], [-1.2, -3.8, 13.8], [0, -1.85, 5.2], [0, -1.85, 5.2], 36, Y, lin],
  [22, 24, [0, -2, 30], [0, -1, 28], [0, 0, 0], [0, 0, 0], 36, Y, lin],
  [24, 28, [10, -9, 27], [6, -10, 22], [-1, 0, 1], [0, -.5, 0], 36, Y, lin],
  [28, 36, [3.4, -9.4, 11.6], [-2.2, -8.2, 10.6], [0, -1.7, 0], [0, -1.4, 0], 36, Y, lin],
  [36, 37, [1, -6, 17], [.6, -4, 15], [0, -.8, 1.5], [.4, -.4, 1.5], 36, Y, ease],
  [37, 45.2, [.7, 0, 14.4], [.7, 0, 13.4], [.7, 0, 0], [.7, 0, 0], 36, LS, lin],
  [45.2, 47, [5.2, -2.2, 10], [3.4, 1.4, 7], PM, PM, 36, Y, ease],
  [47, 49.8, rel(PM, [3, -5, 10]), rel(PM, [9, -14, 26]), PM, PM, 36, Y, ease],
  [49.8, 52, rel(PM, [9, -14, 26]), rel(PM, [3, -7.5, 23]), PM, PM, 36, Y, lin],
  [52, 54.6, rel(PM, [3, -7.5, 23]), rel(PM, [-3, -8, 21]), PM, PM, 36, Y, lin],
  [54.6, 55.4, rel(PM, [-3, -8, 21]), rel(PM, [-5, -24, 17]), PM, rel(PM, [0, -15.4, 8.7]), 36, Y, ease],
  [55.4, 58, rel(PM, [-5, -24, 17]), rel(PM, [-2.6, -22.6, 14.6]), rel(PM, [0, -15.4, 8.7]), rel(PM, [.8, -15, 8.9]), 36, Y, lin],
  [58, 59, rel(PM, [-2.6, -22.6, 14.6]), rel(PM, [0, -4, 28]), rel(PM, [.8, -15, 8.9]), PM, 36, Y, ease],
  [59, 67, rel(PM, [0, -4, 28]), rel(PM, [1, -4.5, 25]), PM, PM, 36, Y, lin],
  [67, 72, rel(PM, [17, -18, 16]), rel(PM, [12, -20, 13]), rel(PM, [0, 0, -1]), rel(PM, [0, 0, -1]), 36, Y, lin],
  [72, 80, rel(PT, [1.6, -6.2, 11]), rel(PT, [-.9, -5.2, 9.2]), PT, PT, 36, Y, lin],
  [80, 82, [9, -6, 22], [6, -3.4, 20], rel(D, [1, -2, -3]), rel(D, [.6, -1.4, -2.4]), 36, Y, lin],
  [82, 84, rel(D, [1.6, -5, 14]), rel(D, [1, -2.5, 5.6]), rel(D, [0, -1, 0]), D, 36, Y, ease],
  [84, 86, rel(D, [.8, -2.6, 3.8]), rel(D, [-.1, -1.2, 3.3]), D, D, 34, Y, lin],
];
export function shot(n, t, k) {
  let p, l, up = Y, fov = 36;
  const S = SHOTS.find((x) => n >= x[0] && n < x[1]);
  if (S) { const u = S[8]((n - S[0]) / (S[1] - S[0])); p = mixV(S[2], S[3], u); l = mixV(S[4], S[5], u); fov = S[6]; up = S[7]; }
  else if (n < 113) {
    // 相对芯片中心；世界绕芯片放大
    let r, tg, u;
    if (n < 89) { u = (n - 86) / 3; const e = easeIn(u); r = [mix(-.1, 0, u), mix(-1.2, -24, e), expMix(3.3, 170, e)]; tg = [0, 0, 0]; }
    else if (n < 90) { u = ease(n - 89); r = [mix(0, -4.4, u), mix(-24, -92, u), mix(170, 3.6, u)]; tg = [mix(0, -4.4, u), mix(0, -40, u), mix(0, 3, u)]; up = [0, 1 - u, u]; }
    else if (n < 93.4) { u = (n - 90) / 3.4; const sw = Math.sin(u * 3) * .8; r = [-4.4 + sw, mix(-92, -44, easeOut(u)), mix(3.6, 2.8, u)]; tg = [-4.4 + sw * .4, mix(-82, -34, easeOut(u)), mix(3.2, 2.4, u)]; up = [Math.sin(sw * .05), 0, Math.cos(sw * .05)]; }
    else if (n < 103) {
      u = (n - 93.4) / 9.6; const cx = C4004[0] * CITY_S, cy = C4004[1] * CITY_S, a = mix(-Math.PI * .5, Math.PI * .55, ease(u)), rad = mix(cy + 44 < 0 ? -(cy + 44) : cy + 44, 5.4, easeOut(u * 1.6)), h = mix(2.8, 5, u);
      r = [cx + rad * Math.cos(a), cy + rad * Math.sin(a), h]; tg = [cx, cy, mix(1.1, -.9, ease(u * 2))]; up = Z;
    } else {
      u = ease((n - 103) / 9); const cx = C4004[0] * CITY_S, cy = C4004[1] * CITY_S, a = Math.PI * .55, x0 = cx + 5.4 * Math.cos(a), y0 = cy + 5.4 * Math.sin(a), hi = easeIn(u) * .45 + u * .55;
      r = [mix(x0, 0, hi), mix(y0, -50, hi), mix(5, 560, hi)]; tg = [mix(cx, 0, u), mix(cy, -26, u), mix(-.9, 0, u)]; up = [0, u, 1 - u];
    }
    p = rel(D, r); l = rel(D, tg); fov = n < 90 ? 34 : n < 103 ? 58 : mix(58, 40, ease((n - 103) / 9));
  } else if (n < 115) {
    const u = ease((n - 113) / 2);
    p = mixV(rel(D, [0, -50, 560]), [8, -8, 30], u); l = mixV(rel(D, [0, -26, 0]), [0, 0, 0], u); fov = mix(40, 36, u);
    if (u < .9) p = rel(D, [0, -50 * Math.exp(-u * 1.2), expMix(560, 30, u)]).map((v, i) => mix(v, [8, -8, 30][i], u * u));
  } else if (n < 122) { const u = (n - 115) / 7; p = [mix(8, -3.5, u), mix(-8, -5, u), mix(30, 26, u)]; l = [0, -.3, 0]; }
  else { const u = ease((n - 122) / 6); p = [mix(-3.5, 0, u), mix(-5, -1.2, u), mix(26, 16, u)]; l = [0, mix(-.3, -.4, u), 0]; }
  const dist = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]), sh = k * Math.min(.03 * dist, .3);
  p = [p[0] + sh * Math.sin(t * 31), p[1] + sh * Math.sin(t * 23 + 1), p[2] + sh * .6 * Math.sin(t * 27 + 2)];
  camera.position.set(...p); camera.up.set(...up).normalize(); camera.lookAt(...l); camera.fov = fov;
  const s = root.scale.x; camera.near = Math.max(.02, s * .0008); camera.far = Math.max(140, s * 16); camera.updateProjectionMatrix();
}
