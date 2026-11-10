// 3D 世界：暗场科技展台（深石墨蓝、反光地面、细光栅格）+ 灯光 + 辉光。
// transparent: true 时背景透明，用来叠在开场那段「手张开」的视频上：辉光的亮度会写进 alpha，光晕也能盖到视频上。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { SavePass } from "three/addons/postprocessing/SavePass.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export const W = 1920, H = 1080;
export const PAL = { bg: 0x070b12, floor: 0x0a0f18, cyan: 0x38e8ff, violet: 0x7a5cff, grid: "rgba(80,200,255,", };

// 辉光写进 alpha：rgb 已经是「预乘」的光，alpha 取 max(原 alpha, 最亮通道)
const GlowAlpha = {
  uniforms: { tDiffuse: { value: null }, tBase: { value: null } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform sampler2D tDiffuse; uniform sampler2D tBase; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a; float a = max(a0, max(c.r, max(c.g, c.b))); gl_FragColor = vec4(c.rgb, clamp(a, 0.0, 1.0)); }",
};

function gridTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1024;
  const g = cv.getContext("2d");
  g.clearRect(0, 0, 1024, 1024);
  for (let i = 0; i <= 32; i++) {
    const v = (i / 32) * 1024, major = i % 4 === 0;
    g.strokeStyle = PAL.grid + (major ? 0.55 : 0.22) + ")"; g.lineWidth = major ? 2.2 : 1.1;
    g.beginPath(); g.moveTo(v, 0); g.lineTo(v, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, v); g.lineTo(1024, v); g.stroke();
  }
  // 中心亮、四周暗，地面在远处融进黑里
  const rg = g.createRadialGradient(512, 512, 40, 512, 512, 512);
  rg.addColorStop(0, "rgba(0,0,0,0)"); rg.addColorStop(1, "rgba(0,0,0,1)");
  g.globalCompositeOperation = "destination-out"; g.fillStyle = rg; g.fillRect(0, 0, 1024, 1024);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildWorld(canvas, { transparent = false, width = W, height = H } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, transparent ? 0 : 1);

  const scene = new THREE.Scene();
  if (!transparent) { scene.background = new THREE.Color(PAL.bg); scene.fog = new THREE.Fog(PAL.bg, 14, 46); }
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, width / height, 0.05, 300);

  // 灯：青白主光、冷补光、背后一青一紫两道轮廓光（紫色只做轮廓）
  const key = new THREE.DirectionalLight(0xe8f6ff, 2.2); key.position.set(-5, 9, 7); scene.add(key);
  const fill = new THREE.DirectionalLight(0x8fb8ff, 0.5); fill.position.set(6, 2, 6); scene.add(fill);
  const rimC = new THREE.DirectionalLight(PAL.cyan, 2.4); rimC.position.set(7, 4, -7); scene.add(rimC);
  const rimV = new THREE.DirectionalLight(PAL.violet, 0.35); rimV.position.set(-7, 3, -6); scene.add(rimV);
  const coreLight = new THREE.PointLight(PAL.cyan, 0, 6, 2); scene.add(coreLight);

  // 展台：镜面 + 半透明深色面（反射变暗变柔）+ 光栅格
  const stage = new THREE.Group();
  const mirror = new Reflector(new THREE.PlaneGeometry(80, 80), { textureWidth: width * dpr * 0.5, textureHeight: height * dpr * 0.5, color: 0x8a96aa });
  mirror.rotation.x = -Math.PI / 2; stage.add(mirror);
  const dim = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: PAL.floor, roughness: 0.55, metalness: 0.2, transparent: true, opacity: 0.86 }));
  dim.rotation.x = -Math.PI / 2; dim.position.y = 0.002; stage.add(dim);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), new THREE.MeshBasicMaterial({ map: gridTexture(), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  grid.rotation.x = -Math.PI / 2; grid.position.y = 0.004; stage.add(grid);
  scene.add(stage);
  stage.visible = !transparent;

  const rt = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(dpr); composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  // 辉光会把 alpha 抹成 1，先把原始 alpha 存一份，最后再合回去
  const save = new SavePass(new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType }));
  composer.addPass(save);
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.55, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const alphaPass = new ShaderPass(GlowAlpha); alphaPass.uniforms.tBase.value = save.renderTarget.texture; alphaPass.enabled = transparent; composer.addPass(alphaPass);

  const v = new THREE.Vector3();
  function project(p) { v.copy(p).project(camera); return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height }; }
  function setCam(pos, tgt, fov) {
    camera.position.set(...pos); camera.lookAt(...tgt);
    if (fov && camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }
  function setTransparent(on) {
    renderer.setClearColor(0x000000, on ? 0 : 1);
    scene.background = on ? null : new THREE.Color(PAL.bg);
    scene.fog = on ? null : new THREE.Fog(PAL.bg, 14, 46);
    stage.visible = !on; alphaPass.enabled = on;
  }
  return { renderer, scene, camera, composer, bloom, stage, grid, coreLight, lights: { key, fill, rimC, rimV }, project, setCam, setTransparent, render: () => composer.render() };
}

// ---------- 布景：霓虹灯条（会在地面和魔方上反光）----------
// 几道发光的门框和地面灯带，青白为主，紫色只有一道细框
export function buildSet(scene) {
  const g = new THREE.Group();
  const bar = (w, h, d, rgb) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ toneMapped: false })); m.material.color.setRGB(...rgb); return m; };
  const CY = [0.5, 2.6, 3.2], WH = [2.4, 2.8, 3.0], VI = [1.3, 0.8, 3.0];
  const frame = (w, h, z, t, rgb) => {
    const f = new THREE.Group();
    const l = bar(t, h, t, rgb); l.position.set(-w / 2, h / 2, 0);
    const r = bar(t, h, t, rgb); r.position.set(w / 2, h / 2, 0);
    const top = bar(w + t, t, t, rgb); top.position.set(0, h, 0);
    f.add(l, r, top); f.position.z = z; return f;
  };
  g.add(frame(30, 9.5, -13, 0.09, CY));
  g.add(frame(40, 12.5, -19, 0.06, VI));
  g.add(frame(22, 7, -9, 0.05, WH));
  for (const x of [-7.5, 7.5]) { const s = bar(0.06, 0.02, 30, CY); s.position.set(x, 0.01, 1); g.add(s); }
  scene.add(g);
  return g;
}

// ---------- 浮尘：几百个发光小点，按 t 缓慢漂移（确定性）----------
export function buildDust(scene, n = 420) {
  const pos = new Float32Array(n * 3), seed = new Float32Array(n * 3);
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) { seed[i * 3] = (r() - 0.5) * 26; seed[i * 3 + 1] = r() * 11; seed[i * 3 + 2] = (r() - 0.5) * 22 - 3; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement("canvas"); cv.width = cv.height = 64;
  const c = cv.getContext("2d"), gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.3, "rgba(160,240,255,.6)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
  const mat = new THREE.PointsMaterial({ size: 0.09, map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
  function update(t) {
    for (let i = 0; i < n; i++) {
      const k = i * 3;
      pos[k] = seed[k] + Math.sin(t * 0.13 + i) * 0.4;
      pos[k + 1] = ((seed[k + 1] + t * (0.08 + (i % 7) * 0.01)) % 11);
      pos[k + 2] = seed[k + 2] + Math.cos(t * 0.11 + i * 1.7) * 0.4;
    }
    geo.attributes.position.needsUpdate = true;
  }
  update(0);
  return { pts, update };
}
