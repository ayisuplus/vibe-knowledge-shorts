// 场景根：渲染器＋辉光后期、深蓝黑底色与雾、网格大地、散落在大地上的实例（含主角 me）。
// 风格 A「编辑器夜色」3D（样张 02-风格样张/3d/lab.js 的 sceneA）：青绿 #7ff0d2＝代码与地面的钟，琥珀 #ffb454＝删除线与卫星。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { rng } from "./lib.js";

export const W = 1920, H = 1080;
export const COL = { bg: 0x060a12, teal: 0x7ff0d2, amber: 0xffb454, white: 0xe8f0f2, gridA: 0x1d6b62, gridB: 0x153f47 };
export const GROUND = -2.2;
// S3 的三个站点（x, z, 留空半径）：线框地球、光钟台、手机导航。机位按环线依次飞过
export const ST = { globe: [22, 3, -18], optic: [13, GROUND, -40], phone: [-4, 0.6, -50] };
const STATIONS = [[22, -18, 7], [13, -40, 6], [-4, -50, 7]];

export function buildWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COL.bg);
  scene.fog = new THREE.FogExp2(COL.bg, 0.03);
  const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 600);
  scene.add(new THREE.HemisphereLight(0x8fb3bf, 0x050810, 0.5));
  const key = new THREE.DirectionalLight(0xfff4e6, 1.1); key.position.set(-4, 6, 10); scene.add(key);

  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.55, 0.45, 0.72);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // 网格大地
  const grid = new THREE.GridHelper(240, 180, COL.gridA, COL.gridB);
  grid.position.y = GROUND; grid.material.transparent = true; grid.material.opacity = 0.55;
  scene.add(grid);

  const v = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  return {
    THREE, renderer, scene, camera, composer, bloom, grid,
    setCam(pos, tgt, fov = 34) {
      camera.position.set(pos[0], pos[1], pos[2]);
      if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
      camera.lookAt(tmp.set(tgt[0], tgt[1], tgt[2]));
      camera.updateMatrixWorld();
    },
    // 世界坐标 → 画面像素
    project(p) { v.copy(p).project(camera); return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, behind: v.z > 1 }; },
    render() { composer.render(); },
  };
}

// canvas 贴图（文字、表盘都画在这上面）；anisotropy 取最大，斜着看也清楚
export function canvasTex(world, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = world.renderer.capabilities.getMaxAnisotropy();
  return { c, g: c.getContext("2d"), t };
}

// 散落在大地上的实例：一颗光点＋一圈小表圈。稀疏、靠雾淡出，不做密集图标（避免密集小图形引起不适）。
// 主角 me 放在镜头前方偏右，是唯一一个带名字的实例。
export function buildInstances(world) {
  const r = rng(11), list = [];
  const teal = new THREE.MeshStandardMaterial({ color: COL.teal, emissive: COL.teal, emissiveIntensity: 0.9 });
  const dotG = new THREE.SphereGeometry(0.07, 16, 12), ringG = new THREE.TorusGeometry(0.22, 0.012, 8, 48);
  const mk = (x, z, k) => {
    const g = new THREE.Group(); g.position.set(x, GROUND + 0.15, z);
    const dotM = teal.clone(); const dot = new THREE.Mesh(dotG, dotM); g.add(dot);
    const ringM = new THREE.MeshBasicMaterial({ color: COL.teal, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringG, ringM); ring.rotation.x = Math.PI / 2; g.add(ring);
    world.scene.add(g);
    const o = { g, dot, dotM, ring, ringM, phase: r(), k };
    list.push(o); return o;
  };
  for (let i = 0; i < 70; i++) {
    const x = (r() - 0.5) * 56, z = 6 - r() * 70;
    if (Math.abs(x) < 6 && z > -10) continue;          // 镜头前方和面板底下留空
    if (STATIONS.some(([sx, sz, sr]) => Math.hypot(x - sx, z - sz) < sr)) continue;   // S3 各站点留空
    mk(x, z, i);
  }
  const me = mk(3.6, -0.5, -1);
  me.dot.scale.setScalar(1.5); me.ring.scale.setScalar(1.25);
  return { list, me };
}
