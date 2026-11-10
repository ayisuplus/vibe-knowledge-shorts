// 封面：片子 S3/样张 A-main 的同一拍——被划掉的 t += dt、地面与卫星两只读数不同的钟，网格大地上散落实例。
// 复用片子里的 rig.js（钟、代码面板），保证与成片一致。?a=43 横 4:3（1440×1080）；?a=34 竖 3:4（1080×1440）。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { clock, codePanel, miniClock } from "../videos/where-is-t/assets/js/rig.js";
import { COL, GROUND } from "../videos/where-is-t/assets/js/world.js";
import { rng } from "../videos/where-is-t/assets/js/lib.js";

const tall = new URLSearchParams(location.search).get("a") === "34";
const w = tall ? 1080 : 1440, h = tall ? 1440 : 1080;
await Promise.all(["900 80px NotoSC", "700 40px NotoSC", "58px CascadiaMono"].map((f) => document.fonts.load(f)));

const canvas = document.getElementById("c");
canvas.style.width = w + "px"; canvas.style.height = h + "px";
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(window.devicePixelRatio); renderer.setSize(w, h, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(COL.bg); scene.fog = new THREE.FogExp2(COL.bg, 0.028);
const camera = new THREE.PerspectiveCamera(tall ? 44 : 36, w / h, 0.05, 600);
scene.add(new THREE.HemisphereLight(0x8fb3bf, 0x050810, 0.5));
const key = new THREE.DirectionalLight(0xfff4e6, 1.1); key.position.set(-4, 6, 10); scene.add(key);
const world = { scene, renderer, camera };
const grid = new THREE.GridHelper(240, 180, COL.gridA, COL.gridB); grid.position.y = GROUND; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
// 稀疏的实例光点
const r = rng(11), teal = new THREE.MeshStandardMaterial({ color: COL.teal, emissive: COL.teal, emissiveIntensity: 1.0 });
for (let i = 0; i < 46; i++) {
  const x = (r() - 0.5) * 50, z = 4 - r() * 60; if (Math.abs(x) < 5 && z > -8) continue;
  const m = miniClock(world, { r: 0.3 }); m.g.position.set(x, GROUND + 0.9, z); m.set({ sec: r() * 360, face: false });
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), teal); d.position.set(x, GROUND + 0.15, z); scene.add(d);
}
// 代码面板：let t 与 t += dt 都被划掉
const K = "#ffb454", Wt = "#d7e4ea", N = "#ff9b73";
const panel = codePanel(world);
panel.mesh.position.set(tall ? -0.9 : -2.5, tall ? -1.55 : -0.55, 0.4); panel.mesh.rotation.y = tall ? 0.1 : 0.26; panel.mesh.scale.setScalar(tall ? 0.74 : 0.7);
panel.draw({ title: "universe.js", lines: [
  { segs: [["let", K], [" t = ", Wt], ["0", N], [";", Wt]], strike: 1 },
  { segs: [["while", K], [" (", Wt], ["true", K], [") {", Wt]] },
  { segs: [["  t += dt;", Wt]], strike: 1 },
  { segs: [["  world.", "#5f7584"], ["update", "#4d8f80"], ["(t);", "#5f7584"]] },
  { segs: [["}", Wt]] },
] });
// 两只钟：地面（青绿）与卫星（琥珀），秒针错开
const g1 = clock(world, { r: 1.35 }); g1.set({ sec: 0 });
const g2 = clock(world, { r: 1.05, rim: COL.amber, body: 0x1a1408, face: "#1a1408", tick: "#b88a4a", major: "#ffcf8a" }); g2.set({ sec: 24 });
if (tall) { g1.g.position.set(-1.7, -3.75, 2.0); g1.g.scale.setScalar(0.8); g2.g.position.set(2.3, -3.0, 1.2); g2.g.scale.setScalar(0.85); }
else { g1.g.position.set(2.4, -0.7, 0.8); g2.g.position.set(5.0, 0.7, -1.0); }
g1.g.rotation.y = -0.25; g2.g.rotation.y = -0.3;
if (tall) camera.position.set(0.2, 0.9, 13.5), camera.lookAt(0.1, -1.0, 0);
else camera.position.set(0.6, 1.3, 13.4), camera.lookAt(0.8, 0.9, 0);
camera.updateMatrixWorld();
const rt = new THREE.WebGLRenderTarget(w * renderer.getPixelRatio(), h * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: 4 });
const comp = new EffectComposer(renderer, rt); comp.setPixelRatio(renderer.getPixelRatio()); comp.setSize(w, h);
comp.addPass(new RenderPass(scene, camera)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(w, h), 0.55, 0.45, 0.72)); comp.addPass(new OutputPass());
comp.render();

// 标题（DOM，最清晰）：两行；「哪一行」高亮
const add = (cls, html, css) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; e.style.cssText = css; document.body.appendChild(e); };
if (tall) {
  add("t", "如果宇宙<br>是一段代码，", "top:120px;font-size:112px;line-height:1.18");
  add("t", "时间藏在<span class=hl>哪一行</span>？", "top:410px;font-size:112px");
  add("s", "物理学家说：这行代码写错了", "top:1336px;font-size:46px");
} else {
  add("t", "如果宇宙是一段代码，", "top:70px;font-size:104px");
  add("t", "时间藏在<span class=hl>哪一行</span>？", "top:205px;font-size:104px");
  add("s", "物理学家说：这行代码写错了", "top:960px;font-size:44px");
}
document.title = "ready";
