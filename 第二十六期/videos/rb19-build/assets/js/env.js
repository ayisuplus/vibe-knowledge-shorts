// 环境：沿用第二十五期确认过的工作室（网格地面、背墙、两束顶光、浮尘）。地面在 y = 0，车跑起来时网格往后流。
import * as THREE from "three";
import { scene } from "./world.js";
import { hash } from "./lib.js";

function gridTex(bg, minor, major, cells = 10, majorEvery = 5, px = 1024, lw = [2, 5]) {
  const c = document.createElement("canvas"); c.width = c.height = px; const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, px, px);
  for (let i = 0; i <= cells; i++) { const p = i * px / cells, mj = i % majorEvery === 0; g.strokeStyle = mj ? major : minor; g.lineWidth = mj ? lw[1] : lw[0]; g.beginPath(); g.moveTo(p, 0); g.lineTo(p, px); g.moveTo(0, p); g.lineTo(px, p); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 16; return t;
}
function fadeTex(inner = .25) {
  const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), r = g.createRadialGradient(128, 128, 128 * inner, 128, 128, 128);
  r.addColorStop(0, "#fff"); r.addColorStop(1, "#000"); g.fillStyle = r; g.fillRect(0, 0, 256, 256); return new THREE.CanvasTexture(c);
}
export const studio = new THREE.Group(); scene.add(studio);
const FLOOR = 360, REP = 7, TILE = FLOOR / REP;
const gridMap = gridTex("#0d0f12", "#181c22", "#262c35"); gridMap.repeat.set(REP, REP);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(FLOOR, FLOOR), new THREE.MeshStandardMaterial({ map: gridMap, alphaMap: fadeTex(.2), transparent: true, roughness: .9, metalness: 0, depthWrite: false, envMapIntensity: .35, color: 0x5a5a5a }));
floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -6); floor.receiveShadow = true; floor.renderOrder = -2; studio.add(floor);
// 接触阴影用的不透明底：只接收阴影
const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), new THREE.ShadowMaterial({ opacity: .55 }));
shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.set(0, .01, -6); shadowCatcher.receiveShadow = true; studio.add(shadowCatcher);
const wallMap = gridTex("#0d0f12", "#181c22", "#262c35"); wallMap.repeat.set(9, 4);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(460, 200), new THREE.MeshStandardMaterial({ map: wallMap, alphaMap: fadeTex(.15), transparent: true, roughness: .95, metalness: 0, depthWrite: false, envMapIntensity: .3, color: 0x6a6a6a }));
wall.position.set(0, 50, -70); wall.renderOrder = -2; studio.add(wall);
const beamTex = (() => { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const g = c.getContext("2d"), r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, "#000"); r.addColorStop(.25, "#666"); r.addColorStop(1, "#fff"); g.fillStyle = r; g.fillRect(0, 0, 4, 256); return new THREE.CanvasTexture(c); })();
const beams = [[-30, -30, 34, .05], [26, -38, 30, .045]].map(([x, z, r, o]) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(4, r, 170, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff1de, map: beamTex, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.set(x, 85, z); m.userData.o = o; m.renderOrder = -1; studio.add(m); return m;
});
const DN = 600, dustPos = new Float32Array(DN * 3), dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dot = (() => { const c = document.createElement("canvas"); c.width = c.height = 32; const g = c.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new THREE.CanvasTexture(c); })();
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .4, map: dot, color: new THREE.Color(.85, .75, .6), transparent: true, opacity: .4, depthWrite: false, blending: THREE.AdditiveBlending }));
dust.frustumCulled = false; studio.add(dust);

/** dist：车行驶的路程（地面网格向后流）；wind：浮尘被风带走的程度 */
export function envState(t, dist, wind = 0) {
  gridMap.offset.x = dist / TILE;
  for (let i = 0; i < DN; i++) {
    const span = 160, x0 = -80 + span * hash(i);
    dustPos[i * 3] = ((x0 - dist * .35 * wind - t * 1.2 * hash(i + 3)) % span + span) % span - 80;
    dustPos[i * 3 + 1] = 1 + 45 * hash(i + 900) + Math.sin(t * .4 + i) * .8;
    dustPos[i * 3 + 2] = -60 + 80 * hash(i + 1900);
  }
  dustGeo.attributes.position.needsUpdate = true;
  beams.forEach((b, i) => { b.material.opacity = b.userData.o * (.85 + .15 * Math.sin(t * .7 + i * 2)); b.rotation.z = .05 * Math.sin(t * .2 + i); });
}
