// 环境：开场的游戏训练图（灰橙网格的原型地图，没有任何靶子），之后的工作室（网格地面、背墙、两束顶光、浮尘），
// 第三段平铺时的工作垫，以及图纸段的蓝色方格纸。全是拍 n（和秒 t）的纯函数。
import * as THREE from "three";
import { scene, BG } from "./world.js";
import { clamp, ease, hash } from "./lib.js";

/** 网格贴图：底色、细线、粗线（每 major 格一条） */
function gridTex(bg, minor, major, cells = 8, majorEvery = 4, px = 1024, lw = [2, 5]) {
  const c = document.createElement("canvas"); c.width = c.height = px; const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, px, px);
  for (let i = 0; i <= cells; i++) { const p = i * px / cells, mj = i % majorEvery === 0; g.strokeStyle = mj ? major : minor; g.lineWidth = mj ? lw[1] : lw[0]; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, px); g.moveTo(0, p); g.lineTo(px, p); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t;
}
/** 径向渐隐（中心不透明、边缘透明），给地面和背墙用 */
function fadeTex(inner = .25) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128);
  r.addColorStop(0, "#fff"); r.addColorStop(1, "#000"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}
const rep = (t, x, y) => { t = t.clone(); t.needsUpdate = true; t.repeat.set(x, y); return t; };

// ── 开场：原型训练图 ──
export const room = new THREE.Group(); scene.add(room);
{
  const gray = gridTex("#5d636b", "#6f767f", "#8b929b"), orange = gridTex("#a35a26", "#b46a33", "#c98448");
  const mat = (t, x, y) => new THREE.MeshStandardMaterial({ map: rep(t, x, y), roughness: .88, metalness: 0 });
  const plane = (w, h, m, x, y, z, rx, ry) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); p.receiveShadow = true; room.add(p); };
  plane(1400, 2000, mat(gray, 3.5, 5), 0, -160, -500, -Math.PI / 2, 0);
  plane(2000, 600, mat(orange, 5, 1.5), -340, 140, -500, 0, Math.PI / 2);
  plane(2000, 600, mat(gray, 5, 1.5), 340, 140, -500, 0, -Math.PI / 2);
  plane(800, 600, mat(orange, 2, 1.5), 0, 140, -1400, 0, 0);
  const boxM = mat(gray, 1, 1), boxO = mat(orange, 1, 1);
  for (const [x, z, s, o] of [[-210, -380, 100, 1], [-210, -380, 100, 0], [190, -560, 120, 0], [70, -900, 160, 1], [-120, -1100, 140, 0], [250, -260, 80, 1]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), o ? boxO : boxM); b.position.set(x, -160 + s / 2 + (room.children.filter((c) => c.position.x === x && c.position.z === z).length * s), z); b.castShadow = b.receiveShadow = true; room.add(b);
  }
}
const hemi = new THREE.HemisphereLight(0xe8eef5, 0x3d342b, 1.1); scene.add(hemi);

// ── 工作室：网格地面、背墙、顶光、浮尘 ──
export const studio = new THREE.Group(); scene.add(studio);
const darkGrid = gridTex("#0d0f12", "#171b20", "#222830", 10, 5);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ map: rep(darkGrid, 6, 6), alphaMap: fadeTex(.2), transparent: true, roughness: .92, metalness: 0, depthWrite: false, envMapIntensity: .35, color: 0x5a5a5a }));
floor.rotation.x = -Math.PI / 2; floor.position.set(-8, -30, 0); floor.receiveShadow = true; floor.renderOrder = -2; studio.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(420, 200), new THREE.MeshStandardMaterial({ map: rep(darkGrid, 8, 4), alphaMap: fadeTex(.15), transparent: true, roughness: .95, metalness: 0, depthWrite: false, envMapIntensity: .3, color: 0x6a6a6a }));
wall.position.set(-8, 20, -48); wall.receiveShadow = true; wall.renderOrder = -2; studio.add(wall);
// 顶光：从上往下渐隐的加色锥体
const beamTex = (() => { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, "#000"); r.addColorStop(.25, "#666"); r.addColorStop(1, "#fff"); g.fillStyle = r; g.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); })();
const beams = [[-32, -14, 30, .05], [22, -20, 26, .045]].map(([x, z, r, o]) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(4, r, 150, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1de, map: beamTex, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.set(x, 45, z); m.userData.o = o; m.renderOrder = -1; studio.add(m); return m;
});
const pools = beams.map((b) => { const p = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshBasicMaterial({ color: 0xfff1de, alphaMap: fadeTex(0), transparent: true, opacity: .05, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); p.rotation.x = -Math.PI / 2; p.position.set(b.position.x, -29.9, b.position.z); studio.add(p); return p; });
// 浮尘
const DN = 520, dustPos = new Float32Array(DN * 3), dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .35, map: dot, color: new THREE.Color(.85, .75, .6), transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
dust.frustumCulled = false; studio.add(dust);
function dustState(t) { for (let i = 0; i < DN; i++) { dustPos[i * 3] = -70 + 130 * hash(i) + Math.sin(t * .25 + i) * 1.5; dustPos[i * 3 + 1] = -28 + 70 * hash(i + 900) + ((t * (.6 + hash(i + 50)) + 70 * hash(i + 70)) % 70) * .25 - 8 + Math.cos(t * .3 + i * 1.3); dustPos[i * 3 + 2] = -40 + 75 * hash(i + 1900); } dustGeo.attributes.position.needsUpdate = true; }

// ── 第三段：平铺用的工作垫 ──
const mat = new THREE.Mesh(new THREE.PlaneGeometry(150, 72), new THREE.MeshStandardMaterial({ map: rep(gridTex("#14261f", "#1f3a30", "#2d5446", 10, 5), 7.5, 3.6), roughness: .9, metalness: 0, transparent: true, alphaMap: fadeTex(.55) }));
mat.position.set(-8.5, -.5, -4); mat.receiveShadow = true; studio.add(mat);

// ── 图纸段：蓝色方格纸 ──
const paper = new THREE.Mesh(new THREE.PlaneGeometry(260, 150), new THREE.MeshBasicMaterial({ map: rep(gridTex("#0b2340", "#123259", "#1c4a80", 10, 5, 1024, [2, 4]), 13, 7.5), transparent: true, opacity: 0, fog: false }));
paper.position.set(-8, 0, -12); scene.add(paper);

scene.fog = new THREE.FogExp2(BG.clone(), 0);

/** 环境状态：n < 6 是训练图，之后是工作室；blue 为图纸程度 */
export function envState(n, t, blue) {
  const fps = n < 6;
  room.visible = hemi.visible = fps; studio.visible = !fps && !blue;
  scene.fog.density = fps ? .00045 : 0; scene.fog.color.copy(fps ? new THREE.Color(.36, .4, .46) : BG);
  if (fps) scene.background = new THREE.Color(.34, .38, .44);
  if (studio.visible) {
    dustState(t);
    beams.forEach((b, i) => { b.material.opacity = b.userData.o * (.85 + .15 * Math.sin(t * .7 + i * 2)); b.rotation.z = .05 * Math.sin(t * .2 + i); pools[i].material.opacity = .045 * (.85 + .15 * Math.sin(t * .7 + i * 2)); });
    const m = clamp((n - 30.2) / 1.2) * (1 - clamp((n - 37) / 1)); mat.visible = m > .01; mat.material.opacity = m;
  }
  paper.visible = !!blue; paper.material.opacity = blue ? 1 : 0;
}
