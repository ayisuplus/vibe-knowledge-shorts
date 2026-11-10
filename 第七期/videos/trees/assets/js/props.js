// 道具：西瓜、园艺剪刀（风格样张 C 里定的样子）
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

let envTex = null;
const env = (renderer) => envTex || (envTex = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture); // 金属要有东西可反射

export function melon(variant = 0) {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d");
  g.fillStyle = variant ? "#8ab565" : "#7fae5a"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = variant ? "#3b6a33" : "#2f5e2c";
  for (let i = 0; i < 16; i++) {
    const x0 = i * 64 + variant * 20;
    g.beginPath(); g.moveTo(x0, 0);
    for (let y = 0; y <= 512; y += 16) g.lineTo(x0 + 18 + Math.sin(y * 0.05 + i) * 10, y);
    for (let y = 512; y >= 0; y -= 16) g.lineTo(x0 + Math.sin(y * 0.05 + i) * 10, y);
    g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ map: t, roughness: 0.45 }));
  m.castShadow = true;
  return m;
}

// 返回 { group, set(open) }：open 1 = 张开，0 = 合上
export function scissors(renderer) {
  const grp = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, metalness: 0.85, roughness: 0.3, envMap: env(renderer), envMapIntensity: 1.0 });
  const handleM = new THREE.MeshStandardMaterial({ color: 0xe0703f, roughness: 0.55 });
  const blade = new THREE.Shape();
  blade.moveTo(0, -0.05); blade.lineTo(1.05, -0.012); blade.quadraticCurveTo(1.12, 0, 1.05, 0.02); blade.lineTo(0, 0.07); blade.lineTo(-0.12, 0.0); blade.closePath();
  const bg = new THREE.ExtrudeGeometry(blade, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 });
  const arms = [];
  for (const s of [1, -1]) {
    const arm = new THREE.Group();
    const b = new THREE.Mesh(bg, steel); b.position.z = s > 0 ? 0 : -0.035; b.castShadow = true;
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 16, 40), handleM); h.position.set(-0.36, -0.06 * s, b.position.z); h.scale.set(1.25, 0.85, 1); h.castShadow = true;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.03), steel); neck.position.set(-0.13, -0.025 * s, b.position.z);
    arm.add(b, h, neck);
    arm.userData.s = s;
    arms.push(arm);
    grp.add(arm);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 16), steel); pin.rotation.x = Math.PI / 2; grp.add(pin);
  const set = (open) => { for (const a of arms) a.rotation.z = (0.03 + 0.24 * open) * a.userData.s; };
  set(1);
  return { group: grp, set };
}
