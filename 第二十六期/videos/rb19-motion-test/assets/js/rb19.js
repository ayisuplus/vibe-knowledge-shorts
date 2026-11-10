// RB19 的代码模型（裸碳纤维，未上涂装）。单位分米；x 指向车头，y 向上，z 指向车右侧。
// 外形按公开照片的比例重建到「一眼认得出」，车底隧道形状、悬架安装点均为示意（调研档案 F-5、F-9、第 4 节）。
// 结构：car（世界位置＋翻转）→ inner（把翻转轴放到车身中部）→ { wheels, pitch（绕前后轴心点头）→ body }
import * as THREE from "three";
import { add, grp, box } from "./world.js";
import { curve, mix } from "./lib.js";

// ── 材质 ──
function weaveTex() {
  const s = 512, c = document.createElement("canvas"); c.width = c.height = s; const g = c.getContext("2d"), n = 32, w = s / n;
  g.fillStyle = "#15171a"; g.fillRect(0, 0, s, s);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const along = ((i + j) >> 1) % 2 === 0, gr = along ? g.createLinearGradient(i * w, 0, (i + 1) * w, 0) : g.createLinearGradient(0, j * w, 0, (j + 1) * w);
    gr.addColorStop(0, "#121417"); gr.addColorStop(.5, along ? "#3b4046" : "#2b2f34"); gr.addColorStop(1, "#121417"); g.fillStyle = gr; g.fillRect(i * w + .5, j * w + .5, w - 1, w - 1);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t;
}
const WEAVE = weaveTex();
export const PBR = (o) => new THREE.MeshPhysicalMaterial(o);
const carbonMat = () => PBR({ map: WEAVE, color: 0xb9bec6, metalness: .25, roughness: .42, clearcoat: 1, clearcoatRoughness: .1, side: THREE.DoubleSide });
const greyMat = () => PBR({ color: 0x4f545a, metalness: 0, roughness: .7, side: THREE.DoubleSide });
const flatMat = () => PBR({ map: WEAVE, color: 0xb9bec6, metalness: .2, roughness: .55, clearcoat: .35, clearcoatRoughness: .45, side: THREE.DoubleSide });
const SHARED = {
  rubber: PBR({ color: 0x18191b, metalness: 0, roughness: .86 }),
  rubberSide: PBR({ color: 0x1d1e21, metalness: 0, roughness: .7, clearcoat: .2 }),
  stripe: PBR({ color: 0xf2c230, metalness: 0, roughness: .55 }),
  rim: PBR({ color: 0x23262a, metalness: .9, roughness: .38 }),
  dark: PBR({ color: 0x07080a, metalness: .2, roughness: .6, side: THREE.DoubleSide }),
  plank: PBR({ color: 0x9c8660, metalness: 0, roughness: .72 }),
  visor: PBR({ color: 0x0a0c10, metalness: .9, roughness: .12, clearcoat: 1 }),
  helmet: PBR({ color: 0xd9dde2, metalness: 0, roughness: .35, clearcoat: .8 }),
};

// ── 放样：沿 x 的一串截面（超椭圆），中间用 Catmull-Rom 加密 ──
// 截面 { x, w, t, b, y, z=0, p=2.6 }：w 宽，t 中线以上高度，b 中线以下深度，p 越大越方。
function smoothStations(st, k = 6) {
  const keys = ["x", "w", "t", "b", "y", "z", "p"], out = [];
  for (let i = 0; i < st.length - 1; i++) for (let j = 0; j < k; j++) {
    const u = j / k, o = {};
    for (const key of keys) { const P = (m) => st[Math.max(0, Math.min(st.length - 1, m))][key] ?? (key === "p" ? 2.6 : 0); const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); o[key] = .5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u); }
    out.push(o);
  }
  const L = st[st.length - 1]; out.push({ p: 2.6, z: 0, ...L }); return out;
}
export function loft(stations, N = 56) {
  const st = smoothStations(stations), pos = [], uv = [], idx = [];
  for (let j = 0; j < st.length; j++) {
    const s = st[j], e = 2 / s.p;
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      pos.push(s.x, s.y + (sn >= 0 ? s.t : s.b) * Math.sign(sn) * Math.abs(sn) ** e, s.z + Math.sign(c) * Math.abs(c) ** e * s.w / 2);
      uv.push(s.x * .9, i / N * 14);
    }
  }
  for (let j = 0; j < st.length - 1; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N, c = a + N, d = b + N; idx.push(a, c, b, b, c, d); }
  for (const [j, flip] of [[0, true], [st.length - 1, false]]) { // 封口
    const s = st[j], ci = pos.length / 3; pos.push(s.x, s.y + (s.t - s.b) / 2, s.z); uv.push(0, 0);
    for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; flip ? idx.push(ci, a, b) : idx.push(ci, b, a); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
/** 两点之间的圆杆 */
function rodGeo(a, b, r) { const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), g = new THREE.CylinderGeometry(r, r, d.length(), 14); g.translate(0, d.length() / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(...a); return g; }

// ── 车底：隧道顶高 d(x)（相对车底基准面，示意）、平面轮廓半宽 w(x) ──
export const FLOOR_Y = .7;                 // 车底基准面离地（静止）
export const X_IN = 14, X_OUT = -20.6;     // 隧道入口、扩散器出口
export const tunnelD = curve([[14, 1.9], [10, 1.35], [5, .75], [0, .42], [-4, .32], [-8, .38], [-12, .8], [-15.5, 1.55], [-18.5, 2.35], [-20.6, 3.0]]);
const halfW = curve([[14, 3.4], [13, 6.0], [11.5, 7.9], [8, 8.9], [-6, 9.1], [-13.5, 8.9], [-15.2, 6.3], [-20.6, 5.7]]);
const ZI = .16, ZO = .86;                  // 每条隧道在半宽里的内外边（比例）
/** 车底下表面高度（车身坐标） */
export function floorBottom(x, z) {
  const hw = halfW(x), a = (Math.abs(z) / hw - ZI) / (ZO - ZI);
  if (a <= 0 || a >= 1) return FLOOR_Y;
  return FLOOR_Y + tunnelD(x) * Math.sin(Math.PI * a) ** .55;
}
/** 隧道中心线（z = TZ）处的顶高 */
export const TZ = (ZI + ZO) / 2 * 8.9;
function floorGeo() {
  const NX = 90, NZ = 72, pos = [], uv = [], idx = [], P = (i, j, top) => {
    const x = mix(X_IN, X_OUT, i / NX), hw = halfW(x), z = mix(-hw, hw, j / NZ), yb = floorBottom(x, z);
    return [x, top ? Math.max(FLOOR_Y + .25, yb + .18) : yb, z];
  };
  for (const top of [0, 1]) for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) { pos.push(...P(i, j, top)); uv.push(i / NX * 30, j / NZ * 16); }
  const V = (top, i, j) => top * (NX + 1) * (NZ + 1) + i * (NZ + 1) + j;
  for (const top of [0, 1]) for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = V(top, i, j), b = V(top, i + 1, j), c = V(top, i, j + 1), d = V(top, i + 1, j + 1); top ? idx.push(a, c, b, b, c, d) : idx.push(a, b, c, b, d, c); }
  for (let i = 0; i < NX; i++) for (const j of [0, NZ]) { const a = V(0, i, j), b = V(0, i + 1, j), c = V(1, i, j), d = V(1, i + 1, j); idx.push(a, b, c, b, d, c); } // 侧边
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ── 车轮 ──
const WHEEL_R = 3.6;
function tireGeo(hw) {
  const pts = [[2.3, -hw], [3.05, -hw - .06], [3.42, -hw + .2], [3.58, -hw + .55], [3.6, -hw + .9], [3.6, hw - .9], [3.58, hw - .55], [3.42, hw - .2], [3.05, hw + .06], [2.3, hw]].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 72).rotateX(Math.PI / 2);
}
function wheel(parent, x, z, hw) {
  const g = grp(parent, x, WHEEL_R, z), spin = grp(g);
  add(spin, tireGeo(hw), SHARED.rubber);
  const side = Math.sign(z);
  add(spin, new THREE.CircleGeometry(2.32, 48), SHARED.rim, 0, 0, side * (hw - .02)).rotation.y = side > 0 ? 0 : Math.PI; // 轮罩
  const ring = add(spin, new THREE.TorusGeometry(3.24, .07, 8, 72), SHARED.stripe, 0, 0, side * (hw + .03));                 // 胎侧色环（软胎示意，无品牌）
  for (let k = 0; k < 5; k++) { const sp = add(spin, new THREE.BoxGeometry(.18, 1.7, .05), SHARED.dark, 0, 0, side * (hw + .01)); sp.rotation.z = k / 5 * Math.PI * 2; sp.geometry.translate(0, 1.2, 0); }
  add(spin, new THREE.CylinderGeometry(2.3, 2.3, hw * 2 - .1, 40, 1, true).rotateX(Math.PI / 2), SHARED.dark);
  ring.castShadow = false;
  return { g, spin };
}

/** 造一台车。opt.grey：对比车（灰色哑光、不分件高亮） */
export function makeCar(parent, opt = {}) {
  const C = opt.grey ? greyMat() : carbonMat(), sus = opt.grey ? C : PBR({ map: WEAVE, color: 0xb9bec6, metalness: .25, roughness: .42, clearcoat: 1, clearcoatRoughness: .1, emissive: new THREE.Color(0) });
  const car = grp(parent), inner = grp(car, 0, -4.5, 0); car.position.y = 4.5;
  const PIV = [1, 0];                                   // 点头的轴心（车身坐标 x, y）
  const pitch = grp(inner, PIV[0], PIV[1], 0), body = grp(pitch, -PIV[0], -PIV[1], 0);
  const parts = {};

  // 鼻锥＋座舱（单体壳）
  parts.tub = add(body, loft([
    { x: 27.6, w: .9, t: .3, b: .3, y: 2.0 }, { x: 26, w: 1.6, t: .55, b: .5, y: 2.2 }, { x: 22, w: 2.4, t: .95, b: .8, y: 2.9 },
    { x: 17, w: 3.4, t: 1.4, b: 1.3, y: 3.6 }, { x: 12, w: 4.6, t: 2.0, b: 2.2, y: 3.9 }, { x: 7, w: 5.8, t: 2.5, b: 2.8, y: 3.8 },
    { x: 3, w: 6.4, t: 2.6, b: 2.7, y: 3.7 }, { x: -.5, w: 6.4, t: 2.6, b: 2.7, y: 3.7 },
  ]), C);
  // 座舱开口、车手头盔
  const hole = add(body, new THREE.CircleGeometry(1, 48), SHARED.dark, 2.6, 6.31, 0); hole.rotation.x = -Math.PI / 2; hole.scale.set(3.0, 2.1, 1);
  add(body, new THREE.SphereGeometry(1.15, 40, 24), SHARED.helmet, 1.6, 6.75, 0).scale.set(1.05, .95, .95);
  add(body, new THREE.SphereGeometry(1.16, 40, 24, -.9, 1.8, 1.05, .55), SHARED.visor, 1.6, 6.75, 0).scale.set(1.05, .95, .95);
  // 发动机盖＋进气口＋鲨鱼鳍
  parts.cover = add(body, loft([
    { x: .6, w: 6.2, t: 2.6, b: 2.8, y: 3.8 }, { x: -1.5, w: 5.4, t: 4.8, b: 3.6, y: 4.6 }, { x: -3.6, w: 4.8, t: 4.5, b: 3.6, y: 4.6 },
    { x: -7, w: 4.2, t: 3.2, b: 3.2, y: 4.2 }, { x: -12, w: 3.2, t: 2.0, b: 2.6, y: 3.6 }, { x: -17, w: 2.2, t: 1.1, b: 2.2, y: 3.2 }, { x: -21.4, w: 1.3, t: .55, b: 1.4, y: 3.0 },
  ]), C);
  const intake = add(body, new THREE.CircleGeometry(1, 40), SHARED.dark, -1.05, 8.5, 0); intake.rotation.y = Math.PI / 2; intake.scale.set(.75, .62, 1);
  const fin = new THREE.Shape(); fin.moveTo(-3.5, 8.8); fin.lineTo(-15, 5.3); fin.lineTo(-15, 4.6); fin.lineTo(-6, 6.9); fin.closePath();
  add(body, new THREE.ExtrudeGeometry(fin, { depth: .08, bevelEnabled: false }).translate(0, 0, -.04), C);
  // 侧箱（下切很深，RB19 的特征之一）
  for (const s of [-1, 1]) {
    add(body, loft([
      { x: 6.4, w: 2.8, t: 1.0, b: .9, y: 4.9, z: s * 4.6 }, { x: 4.4, w: 4.4, t: 1.4, b: 1.3, y: 4.8, z: s * 5.6 }, { x: 0, w: 5.2, t: 1.6, b: 1.6, y: 4.5, z: s * 5.9 },
      { x: -4, w: 4.6, t: 1.5, b: 1.6, y: 3.9, z: s * 5.6 }, { x: -9, w: 3.2, t: 1.0, b: 1.3, y: 3.0, z: s * 4.8 }, { x: -14, w: 1.8, t: .5, b: .9, y: 2.2, z: s * 3.8 }, { x: -17, w: .8, t: .3, b: .6, y: 1.8, z: s * 3.0 },
    ]), C);
    const inlet = add(body, new THREE.CircleGeometry(1, 40), SHARED.dark, 6.45, 4.9, s * 4.7); inlet.rotation.y = Math.PI / 2; inlet.scale.set(1.2, .7, 1);
    add(body, box(.3, 2.8, .1, .04), C, 5.8, 7.1, s * 3.6).rotation.z = .5;      // 后视镜支杆
    add(body, box(1.4, .55, .5, .2), C, 5.4, 8.2, s * 3.8);                          // 后视镜
  }
  // 车底（两条隧道）＋防滑木条＋隧道入口导流片
  parts.floor = add(body, floorGeo(), C);
  parts.plank = add(body, box(24, .16, 1.2, .05), SHARED.plank, -1, FLOOR_Y - .08, 0);
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const z = s * (1.9 + k * 1.35), f = add(body, box(9 - k * 1.2, 1.3, .07, .03), C, 9.5 - k * .5, FLOOR_Y + .65, z); f.rotation.y = s * (.05 + k * .03); }
  // 前翼：四片主翼面（越往后越高、越陡）＋端板
  parts.fwing = grp(body);
  for (let k = 0; k < 4; k++) { const e = add(parts.fwing, box(1.35 - k * .12, .11, 19.2, .05), C, 27.9 - k * .95, 1.0 + k * .48 + k * k * .06, 0); e.rotation.z = .12 + k * .16; }
  for (const s of [-1, 1]) add(parts.fwing, box(4.6, 1.9, .1, .04), C, 26.5, 1.75, s * 9.6);
  for (const s of [-1, 1]) add(parts.fwing, box(.5, 1.5, .12, .04), C, 25.4, 2.0, s * .9);       // 鼻锥挂架
  // 尾翼：主翼面＋DRS 活动片＋端板＋梁翼＋鹅颈支柱
  parts.rwing = grp(body);
  add(parts.rwing, box(2.6, .14, 9.6, .06), C, -25.9, 7.1, 0).rotation.z = .16;
  parts.flap = grp(parts.rwing, -25.0, 7.65, 0); add(parts.flap, box(1.7, .12, 9.6, .05), C, -.85, .05, 0).rotation.z = .55;
  for (const s of [-1, 1]) { const ep = new THREE.Shape(); ep.moveTo(-23.4, 4.0); ep.quadraticCurveTo(-23.2, 7.0, -24.2, 8.9); ep.lineTo(-27.6, 8.9); ep.lineTo(-27.9, 4.8); ep.quadraticCurveTo(-25.5, 3.7, -23.4, 4.0); add(parts.rwing, new THREE.ExtrudeGeometry(ep, { depth: .1, bevelEnabled: false }).translate(0, 0, s * 4.85 - .05), C); }
  add(parts.rwing, box(1.5, .12, 7.4, .05), C, -23.6, 4.1, 0).rotation.z = .2;
  for (const s of [-1, 1]) add(parts.rwing, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-21.2, 3.4, s * .4), new THREE.Vector3(-23.6, 6.4, s * .4), new THREE.Vector3(-25.4, 7.45, s * .4)]), 20, .13, 8), C);
  add(body, box(3.4, 1.0, 1.6, .2), C, -22.4, 2.9, 0); // 后防撞结构
  add(body, new THREE.BoxGeometry(.5, .35, .2), PBR({ color: 0xff2a2a, emissive: 0xff1a1a, emissiveIntensity: .8 }), -24.2, 2.7, 0); // 尾灯
  // Halo：前立柱＋环
  parts.halo = grp(body);
  add(parts.halo, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(6.4, 6.1, 0), new THREE.Vector3(6.1, 6.9, 0), new THREE.Vector3(5.5, 7.35, 0)]), 16, .22, 12), C);
  for (const s of [-1, 1]) add(parts.halo, new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(5.5, 7.35, 0), new THREE.Vector3(4.6, 7.42, s * 1.7), new THREE.Vector3(2.6, 7.4, s * 2.65), new THREE.Vector3(.4, 7.2, s * 2.75), new THREE.Vector3(-.4, 6.3, s * 2.9)]), 40, .22, 12), C);

  // 车轮（不随点头转动）
  const wheels = [[16.6, 8.3, 1.5], [-19.6, 8.0, 2.0]].flatMap(([x, z, hw]) => [-1, 1].map((s) => wheel(inner, x, s * z, hw)));
  // 前悬架（拉杆式）：上横臂内侧前后安装点高低差很大＝抗点头（示意）
  parts.fsus = grp(inner); const R = .14;
  for (const s of [-1, 1]) {
    const up = [16.6, 5.2, s * 6.75], lo = [16.6, 2.0, s * 6.9];
    for (const [a, b] of [[[19.6, 5.9, s * 1.6], up], [[13.4, 4.1, s * 1.6], up], [[19.2, 2.0, s * 1.4], lo], [[13.8, 2.3, s * 1.7], lo], [[16.5, 4.9, s * 6.4], [14.2, 1.7, s * 1.5]]]) add(parts.fsus, rodGeo(a, b, R), sus);
    add(parts.fsus, box(.6, 3.6, .5, .1), sus, 16.6, 3.6, s * 6.75);
  }
  // 后悬架（推杆式，示意）
  for (const s of [-1, 1]) for (const [a, b] of [[[-17.5, 4.2, s * 1.2], [-19.6, 4.8, s * 6.0]], [[-21.5, 4.4, s * 1.0], [-19.6, 4.8, s * 6.0]], [[-17.8, 2.0, s * 1.4], [-19.6, 2.1, s * 6.1]], [[-21.6, 2.2, s * 1.2], [-19.6, 2.1, s * 6.1]], [[-19.6, 2.3, s * 5.8], [-19.4, 5.2, s * 1.2]]]) add(inner, rodGeo(a, b, R), C);

  // 车底隧道的描边（翻转看车底时亮起）：每条隧道的内外边＋中线
  parts.tlines = grp(body); const TL = new THREE.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0, depthWrite: false });
  for (const s of [-1, 1]) for (const [fr, lift] of [[ZI, .04], [ZO, .04], [(ZI + ZO) / 2, .05]]) {
    const pts = []; for (let i = 0; i <= 80; i++) { const x = mix(X_IN - .3, X_OUT + .3, i / 80), z = s * fr * halfW(x); pts.push(new THREE.Vector3(x, floorBottom(x, z) - lift, z)); }
    const m = add(parts.tlines, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, fr === ZI || fr === ZO ? .07 : .1, 8), TL); m.castShadow = false; m.userData.keep = true;
  }
  parts.tlMat = TL;
  // 平的件（翼片、端板、导流片）换半哑光，免得整块反白
  if (!opt.grey) { const F = flatMat(); car.traverse((o) => { if (o.isMesh && o.material === C && (o.geometry.type !== "BufferGeometry" || o.geometry === undefined)) o.material = F; }); }
  // 记下每个网格的原材质，透视模式时换掉
  const meshes = []; car.traverse((o) => { if (o.isMesh) { o.userData.m = o.material; meshes.push(o); } });
  return { car, inner, pitch, body, wheels, parts, sus, meshes, PIV, grey: !!opt.grey };
}

/** 车的状态（全是传入参数的纯函数）：lift 抬升、roll 翻转、ride 车身上下、pitchDeg 点头（负＝车头下沉）、dist 行驶路程、hl 前悬架高亮、ghost 透视材质 */
export function carState(c, { x = 0, z = 0, lift = 0, roll = 0, ride = 0, pitchDeg = 0, dist = 0, hl = 0, ghost = null, tl = 0 }) {
  c.car.position.set(x, 4.5 + lift, z); c.car.rotation.x = roll;
  c.body.parent.rotation.z = THREE.MathUtils.degToRad(pitchDeg); c.pitch.position.y = c.PIV[1] + ride; c.parts.fsus.position.y = ride * .5;
  for (const w of c.wheels) w.spin.rotation.z = -dist / WHEEL_R;
  if (!c.grey) { c.sus.emissive.setRGB(1, .55, .15).multiplyScalar(.9 * hl); c.sus.color.setRGB(mix(.73, 1, hl), mix(.75, .7, hl), mix(.78, .5, hl)); }
  for (const m of c.meshes) { if (m.userData.keep) continue; const want = ghost || m.userData.m; if (m.material !== want) m.material = want; m.castShadow = !ghost; }
  if (c.parts.tlMat) c.parts.tlMat.opacity = tl;
}
