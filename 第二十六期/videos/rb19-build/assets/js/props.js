// 道具：发车灯架、1978 年老车剪影（含车底流线）、平底板、碰撞块、尺寸框、动力单元里的能量流。
// 全部是状态函数驱动：xxxState(t, …) 只改参数，不重建。
import * as THREE from "three";
import { scene, add, grp, box } from "./world.js";
import { loft, PBR } from "./rb19.js";
import { clamp, mix, hash } from "./lib.js";

// ── 发车灯架：五列，每列两盏红灯（F1 发车灯，F-17） ──
export const gantry = grp(scene, 0, 15, -6);
const lampOn = new THREE.MeshBasicMaterial({ color: 0x2a0606 });
const lamps = [];
add(gantry, box(31, 1.6, 1.4, .3), PBR({ color: 0x0c0d10, metalness: .5, roughness: .5 }), 0, 4.4, 0);
for (let i = 0; i < 5; i++) {
  const x = (i - 2) * 6;
  add(gantry, box(4.2, 8, 1.6, .4), PBR({ color: 0x111317, metalness: .4, roughness: .55 }), x, 0, 0);
  const m = lampOn.clone(); lamps.push(m);
  // 每列四盏：下面两盏是红灯，上面两盏不亮
  for (const y of [-2.7, -.9]) add(gantry, new THREE.CircleGeometry(.8, 40), m, x, y, .82).castShadow = false;
  for (const y of [.9, 2.7]) add(gantry, new THREE.CircleGeometry(.8, 40), PBR({ color: 0x050506, roughness: .4 }), x, y, .82).castShadow = false;
}
const halo = new THREE.PointLight(0xff2a1a, 0, 60, 1.6); halo.position.set(0, 13, 6); scene.add(halo);
/** n：已亮几盏（0–5）；out：是否已熄灭 */
export function gantryState(on, n, out) {
  gantry.visible = on; halo.visible = on; if (!on) return;
  lamps.forEach((m, i) => { const on = !out && n > i; m.color.setRGB(on ? 6 : .16, on ? .35 : .02, on ? .25 : .02); });
  halo.intensity = out ? 0 : 6 * Math.min(5, n);
}

// ── 1978 年老车剪影（不复刻涂装）：楔形鼻锥、贯穿全长的翼型侧箱、高进气口、大尾翼 ──
export const old = grp(scene);
const shade = PBR({ color: 0x30343b, metalness: .3, roughness: .4, clearcoat: .8, clearcoatRoughness: .2, side: THREE.DoubleSide });
add(old, loft([{ x: 22, w: 1.2, t: .4, b: .3, y: 1.6, p: 3 }, { x: 16, w: 3.0, t: 1.2, b: .9, y: 2.6, p: 3 }, { x: 6, w: 4.6, t: 2.0, b: 1.6, y: 3.8, p: 3 }, { x: -2, w: 4.8, t: 2.6, b: 1.8, y: 4.2, p: 3 }, { x: -12, w: 3.6, t: 1.4, b: 1.8, y: 3.6, p: 3 }, { x: -18, w: 2.4, t: .8, b: 1.4, y: 3.2, p: 3 }]), shade);
for (const s of [-1, 1]) add(old, loft([{ x: 8, w: 4.0, t: .7, b: .3, y: 2.2, z: s * 5.4, p: 4 }, { x: 2, w: 4.6, t: 1.4, b: .6, y: 2.6, z: s * 5.6, p: 4 }, { x: -8, w: 4.6, t: 1.5, b: .7, y: 2.7, z: s * 5.6, p: 4 }, { x: -13, w: 4.2, t: .8, b: .8, y: 2.6, z: s * 5.5, p: 4 }]), shade);
add(old, box(3.2, 3.2, 1.6, .5), shade, -3, 7.2, 0);                     // 进气口
add(old, box(4.8, .2, 11, .1), shade, -20, 7.6, 0); for (const s of [-1, 1]) add(old, box(5, 3.2, .12, .05), shade, -20, 6.4, s * 5.6);
add(old, box(4.5, .15, 12, .08), shade, 19, 1.2, 0);                     // 前翼
add(old, new THREE.SphereGeometry(1.05, 24, 16), shade, 0, 6.4, 0);
const oldWheels = [[13.5, 7.2, 3.0, 1.2], [-15, 7.4, 3.5, 2.3]].flatMap(([x, z, r, hw]) => [-1, 1].map((s) => { const w = add(old, new THREE.CylinderGeometry(r, r, hw * 2, 40).rotateX(Math.PI / 2), shade, x, r, s * z); return w; }));
// 车底流线：每侧三条，顺着翼型侧箱的下沿走，用滚动的虚线贴图表示气流
const dash = (() => { const c = document.createElement("canvas"); c.width = 256; c.height = 8; const g = c.getContext("2d"); for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(i * 32, 0, i * 32 + 22, 0); gr.addColorStop(0, "rgba(255,180,84,0)"); gr.addColorStop(1, "rgba(255,180,84,1)"); g.fillStyle = gr; g.fillRect(i * 32, 0, 22, 8); } const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; return t; })();
const oldFlowMat = new THREE.MeshBasicMaterial({ map: dash, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
  const z = s * (4.2 + k * 1.2), pts = [];
  for (let i = 0; i <= 40; i++) { const x = mix(14, -18, i / 40), u = (x + 18) / 32; pts.push(new THREE.Vector3(x, .35 + k * .28 + 1.4 * Math.sin(Math.PI * clamp((14 - x) / 28)) * (u < .5 ? .5 : 1) * .6, z)); }
  const m = add(old, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, .08, 6), oldFlowMat); m.castShadow = false; m.renderOrder = 9;
}
// 平底板：从侧面滑进老车底下
export const plate = add(scene, box(36, .3, 15, .1), PBR({ color: 0x3a3f46, metalness: .7, roughness: .4 }), 0, .45, 0);
/** x：老车位置；flow：车底流线亮度；plateK：平底板滑入进度（0–1）；fade：整车淡出 */
export function oldState(on, { x = 0, z = 0, dist = 0, flow = 0, t = 0, plateK = -1 }) {
  old.visible = on; old.position.set(x, 0, z);
  for (const w of oldWheels) w.rotation.z = -dist / 3.2;
  oldFlowMat.opacity = flow; dash.offset.x = -t * 2.2;
  plate.visible = on && plateK >= 0; plate.position.set(x + mix(48, 0, plateK), .45, z);
}

// ── 碰撞块（示意）：从正面推向鼻锥 ──
export const ram = add(scene, box(5, 4.5, 6, .3), PBR({ color: 0xb7bcc2, metalness: .6, roughness: .45 }), 40, 2.6, 0);
const ramFace = add(ram, box(.3, 3.5, 4.8, .1), PBR({ color: 0xffb454, roughness: .6 }), -2.6, 0, 0);
export function ramState(on, k) { ram.visible = on; ram.position.x = mix(52, 30.1, k); }

// ── 尺寸框：单体壳外的一圈琥珀色框线（示意） ──
export const sizeBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(28.5, 6, 7)), new THREE.LineBasicMaterial({ color: 0xffb454, transparent: true, opacity: 0 }));
sizeBox.position.set(13.5, 3.8, 0); scene.add(sizeBox);
export function sizeState(o) { sizeBox.visible = o > .01; sizeBox.material.opacity = o; sizeBox.scale.setScalar(1 + .06 * (1 - o)); }

// ── 能量流（动力单元剖视，示意）：一串发光小球沿路径走。路径在车身坐标里，挂在车身上 ──
const EN = 34;
export function makeEnergy(body) {
  const g = new THREE.SphereGeometry(.16, 10, 8);
  const mk = (color, pts) => {
    const m = new THREE.InstancedMesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }), EN);
    m.renderOrder = 12; m.frustumCulled = false; body.add(m);
    return { m, curve: new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))) };
  };
  const B = new THREE.Color(0x58a6ff), O = new THREE.Color(0xff9a2e);
  const P = {
    fuel: mk(O, [[1, 4.2, 0], [-2, 4.6, 0], [-6, 4.8, 0], [-9.6, 5.0, 0]]),
    exh: mk(O, [[-6, 5.6, 0], [-9, 5.6, 0], [-11.6, 5.0, 0], [-13.5, 4.2, 0]]),
    kinL: mk(B, [[-19.6, 3.6, -8], [-15, 3.0, -5], [-8, 2.4, -2.6], [-4.5, 2.2, -2.3], [-1, 1.8, -1], [.6, 1.7, 0]]),
    kinR: mk(B, [[-19.6, 3.6, 8], [-15, 3.0, 5], [-9, 2.4, 1], [-4.5, 2.2, -2.3], [-1, 1.8, -1], [.6, 1.7, 0]]),
    heat: mk(B, [[-10.2, 5.0, 0], [-8, 4.0, 0], [-4, 2.6, 0], [-1, 1.9, 0], [.6, 1.7, 0]]),
    outL: mk(B, [[.6, 1.7, 0], [-1, 1.8, -1], [-4.5, 2.2, -2.3], [-8, 2.4, -2.6], [-15, 3.0, -5], [-19.6, 3.6, -8]]),
    outR: mk(B, [[.6, 1.7, 0], [-1, 1.8, -1], [-4.5, 2.2, -2.3], [-9, 2.4, 1], [-15, 3.0, 5], [-19.6, 3.6, 8]]),
  };
  const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  /** k：{ 路径名: 强度 0–1 }；tf：能量流时钟 */
  return function energyState(k, tf) {
    for (const [name, { m, curve }] of Object.entries(P)) {
      const o = k[name] || 0; m.visible = o > .01; if (!m.visible) continue;
      m.material.opacity = o;
      for (let i = 0; i < EN; i++) { const u = ((tf * .55 + i / EN + hash(i) * .01) % 1); curve.getPointAt(u, _p); _s.setScalar(.7 + .6 * Math.sin(u * Math.PI)); _m.compose(_p, _q, _s); m.setMatrixAt(i, _m); }
      m.instanceMatrix.needsUpdate = true;
    }
  };
}
