// 风格样张：三张静帧放在同一条 3 秒时间线上，t=0.5 / 1.5 / 2.5 各取一张。
// A 完全体巨树（开场 = 结尾同框）  B 地下根系变成二叉搜索树  C 决策树枝上的剪枝
import * as THREE from "three";
import { buildWorld, makeTubes, C } from "./world.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const W = buildWorld(document.getElementById("gl"), { seed: 7 });
const S = W.scene;
const envTex = new THREE.PMREMGenerator(W.renderer).fromScene(new RoomEnvironment(), 0.04).texture; // 金属要有东西可反射
const hud = document.getElementById("hud");
const labels = [];
function label(html, cls, p, dy = -130) {
  const el = document.createElement("div");
  el.className = cls; el.innerHTML = html;
  hud.appendChild(el);
  const L = { el, p, dy, on: false };
  labels.push(L);
  return L;
}
function placeLabels() {
  for (const L of labels) {
    const q = W.project(L.p);
    L.el.style.visibility = L.on && !q.behind ? "visible" : "hidden";
    L.el.style.transform = `translate(${q.x}px, ${q.y}px) translate(-50%, ${L.dy}%)`;
  }
}

// ---------- B：1 到 100 的二叉搜索树，挂在主根下面 ----------
const bst = new THREE.Group();
S.add(bst);
const nodes = [];
(function build(lo, hi, depth, parent) {
  if (lo > hi) return;
  const k = Math.floor((lo + hi) / 2);
  const p = [(k - 50.5) * 0.112, -0.62 - depth * 0.38, 1.35 - depth * 0.02];
  const n = { k, depth, p, parent };
  nodes.push(n);
  build(lo, k - 1, depth + 1, n);
  build(k + 1, hi, depth + 1, n);
})(1, 100, 0, null);
const PATH = new Set([50, 25, 37, 43, 40, 41]);
const gold = new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 1.05, roughness: 0.45 });
const clay = new THREE.MeshStandardMaterial({ color: 0xf3e7d3, roughness: 0.8 });
const edgeSegs = { gold: [], clay: [] };
edgeSegs.gold.push({ a: [0, -0.1, 0], b: nodes[0].p, r0: 0.05, r1: 0.035 }); // 主根 → 50
for (const n of nodes) {
  if (!n.parent) continue;
  const on = PATH.has(n.k) && PATH.has(n.parent.k);
  const r0 = 0.03 * 0.82 ** n.parent.depth, r1 = 0.03 * 0.82 ** n.depth;
  (on ? edgeSegs.gold : edgeSegs.clay).push({ a: n.parent.p, b: n.p, r0, r1 });
}
bst.add(makeTubes(edgeSegs.gold, gold).mesh, makeTubes(edgeSegs.clay, clay).mesh);
const ballG = new THREE.IcosahedronGeometry(1, 3);
for (const n of nodes) {
  const m = new THREE.Mesh(ballG, PATH.has(n.k) ? gold : clay);
  const r = 0.115 * 0.8 ** n.depth + 0.03;
  m.position.set(...n.p); m.scale.setScalar(r); m.castShadow = true;
  bst.add(m);
  if (n.depth <= 2 || PATH.has(n.k)) {
    n.label = label(`${n.k}`, PATH.has(n.k) ? "node on" : "node", n.p, n.depth <= 1 ? -135 : -125);
  }
}
const levelTags = [];
for (let d = 0; d < 7; d++) levelTags.push(label(`${d + 1}`, "lvl", [5.75, -0.62 - d * 0.38, 1.35], -50));
const lvlTitle = label("7 层", "lvl-title", [5.2, -3.22, 1.35], -50);

// ---------- C：决策树枝 + 过拟合的细枝 + 剪刀 + 西瓜 ----------
const dec = new THREE.Group();
S.add(dec);
const wood = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.85 });
const coral = new THREE.MeshStandardMaterial({ color: 0xe8705a, roughness: 0.6 });
const Q = {
  trunk: [0.05, 1.55, 0.25], q1: [1.5, 2.25, 1.35], q2: [2.75, 2.0, 1.9], good: [3.6, 1.62, 2.35],
  bad: [2.35, 3.05, 1.05], q3: [3.85, 2.55, 1.8],
};
const limb = [
  { a: Q.trunk, b: Q.q1, r0: 0.11, r1: 0.075 }, { a: Q.q1, b: Q.q2, r0: 0.07, r1: 0.055 },
  { a: Q.q1, b: Q.bad, r0: 0.05, r1: 0.03 }, { a: Q.q2, b: Q.good, r0: 0.045, r1: 0.028 }, { a: Q.q2, b: Q.q3, r0: 0.045, r1: 0.03 },
];
dec.add(makeTubes(limb, wood).mesh);
// 过拟合：q3 末端疯长出的细枝
const twigEnds = [[4.75, 3.05, 2.05], [4.9, 2.55, 2.3], [4.6, 2.1, 2.45], [4.35, 3.25, 1.6]];
const twigs = [];
for (const e of twigEnds) {
  const mid = [(Q.q3[0] + e[0]) / 2 + 0.1, (Q.q3[1] + e[1]) / 2 + 0.08, (Q.q3[2] + e[2]) / 2];
  twigs.push({ a: Q.q3, b: mid, r0: 0.026, r1: 0.018 }, { a: mid, b: e, r0: 0.018, r1: 0.01 });
  twigs.push({ a: mid, b: [mid[0] + 0.25, mid[1] - 0.15, mid[2] + 0.2], r0: 0.012, r1: 0.007 });
}
dec.add(makeTubes(twigs, coral).mesh);
const disc = new THREE.CylinderGeometry(1, 1, 0.3, 32);
for (const k of ["q1", "q2", "q3"]) { const m = new THREE.Mesh(disc, clay); m.position.set(...Q[k]); m.scale.set(0.12, 0.12, 0.12); m.rotation.x = Math.PI / 2; m.castShadow = true; dec.add(m); }
// 好瓜 / 坏瓜两片叶子
const leafG = new THREE.IcosahedronGeometry(1, 1);
const lg = new THREE.Mesh(leafG, new THREE.MeshStandardMaterial({ color: C.leaf[0], roughness: 0.7, flatShading: true })); lg.position.set(...Q.good); lg.scale.set(0.24, 0.1, 0.18); lg.rotation.z = -0.4; dec.add(lg);
const lb = new THREE.Mesh(leafG, new THREE.MeshStandardMaterial({ color: 0xb59a5a, roughness: 0.7, flatShading: true })); lb.position.set(...Q.bad); lb.scale.set(0.2, 0.08, 0.15); lb.rotation.z = 0.5; dec.add(lb);
// 西瓜，正滑到 q2
const melon = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshStandardMaterial({ map: melonTexture(), roughness: 0.45 }));
melon.position.set(2.45, 2.3, 1.85); melon.scale.set(0.24, 0.21, 0.21); melon.rotation.set(0.3, 0.8, 1.2); melon.castShadow = true; dec.add(melon);
// 剪刀
const sc = scissors();
sc.position.set(4.25, 2.62, 2.75); sc.rotation.set(0.25, -0.9, 0.35); sc.scale.setScalar(0.9);
dec.add(sc);

const qLabels = [
  label("纹理清晰吗？", "tag", Q.q1, -150), label("根蒂蜷缩吗？", "tag", Q.q2, -150),
  label("好瓜", "tag good", Q.good, 40), label("坏瓜", "tag bad", Q.bad, -150),
  label("周二买的吗？", "tag over", twigEnds[0], -130), label("摊主戴帽子吗？", "tag over", twigEnds[1], -60),
  label("瓜上有个小斑点吗？", "tag over", twigEnds[2], 20),
];

// ---------- 三帧 ----------
function frame(t) {
  const f = t < 1 ? "A" : t < 2 ? "B" : "C";
  bst.visible = f === "B"; dec.visible = f === "C";
  for (const L of labels) L.on = false;
  if (f === "A") {
    W.render({ grow: 1, rootGrow: 1, lit: 1, leaf: 1, cam: { pos: [6.2, 1.9, 19.5], tgt: [0, 1.05, 0] } });
  } else if (f === "B") {
    for (const n of nodes) if (n.label) n.label.on = true;
    for (const L of levelTags) L.on = true;
    lvlTitle.on = true;
    W.render({ grow: 1, rootGrow: 0.42, lit: 0.42, leaf: 1, cam: { pos: [0.2, -0.7, 13.2], tgt: [0, -1.55, 0] } });
  } else {
    for (const L of qLabels) L.on = true;
    W.render({ grow: 0.92, rootGrow: 1, lit: 0, leaf: 0.55, cam: { pos: [4.3, 2.9, 7.6], tgt: [2.9, 2.35, 1.5] } });
  }
  placeLabels();
}

const tl = window.__timelines.main;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: 3, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * 3) }, 0);
frame(0.5);

function melonTexture() {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d");
  g.fillStyle = "#7fae5a"; g.fillRect(0, 0, 1024, 512);
  g.fillStyle = "#2f5e2c";
  for (let i = 0; i < 16; i++) {
    const x0 = i * 64;
    g.beginPath(); g.moveTo(x0, 0);
    for (let y = 0; y <= 512; y += 16) g.lineTo(x0 + 18 + Math.sin(y * 0.05 + i) * 10, y);
    for (let y = 512; y >= 0; y -= 16) g.lineTo(x0 + Math.sin(y * 0.05 + i) * 10, y);
    g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function scissors() {
  const grp = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({ color: 0xd9dcdf, metalness: 0.85, roughness: 0.3, envMap: envTex, envMapIntensity: 1.0 });
  const handleM = new THREE.MeshStandardMaterial({ color: 0xe0703f, roughness: 0.55 });
  const blade = new THREE.Shape();
  blade.moveTo(0, -0.05); blade.lineTo(1.05, -0.012); blade.quadraticCurveTo(1.12, 0, 1.05, 0.02); blade.lineTo(0, 0.07); blade.lineTo(-0.12, 0.0); blade.closePath();
  const bg = new THREE.ExtrudeGeometry(blade, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.006, bevelSegments: 2 });
  for (const s of [1, -1]) {
    const arm = new THREE.Group();
    const b = new THREE.Mesh(bg, steel); b.position.z = s > 0 ? 0 : -0.035; b.castShadow = true;
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 16, 40), handleM); h.position.set(-0.36, -0.06 * s, b.position.z); h.scale.set(1.25, 0.85, 1); h.castShadow = true;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.03), steel); neck.position.set(-0.13, -0.025 * s, b.position.z);
    arm.add(b, h, neck);
    arm.rotation.z = 0.22 * s;
    grp.add(arm);
  }
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 16), steel); pin.rotation.x = Math.PI / 2; grp.add(pin);
  return grp;
}
