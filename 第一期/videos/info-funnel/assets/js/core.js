// 渲染器、后期、通用工具。所有动画都只由时间 t 决定，保证逐帧可复现。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const W = 1920, H = 1080;
export const FOV = 35;

// ---------- 数学 ----------
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, k) => a + (b - a) * k;
export const pulse = (t, at, decay) => (t >= at ? Math.exp(-(t - at) * decay) : 0);
export const easeOutBack = (x) => { x = clamp01(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const easeOutCubic = (x) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOutCubic = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// 时间窗包络：a 前淡入，b 后淡出
export function win(t, a, b, fin = 0.5, fout = 0.5) {
  return smooth((t - a) / fin + 1) * (1 - smooth((t - b) / fout));
}
export function winIn(t, a, b, fin = 0.5, fout = 0.5) {
  return smooth((t - a) / fin) * (1 - smooth((t - b) / fout));
}

// ---------- 配色 ----------
// 赛博朋克：霓虹青、热粉、电光黄为主，酸性绿和橙点缀，不用紫
export const C = {
  pink: new THREE.Color(0xff2a6d),
  cyan: new THREE.Color(0x00f0ff),
  yellow: new THREE.Color(0xfcee0a),
  green: new THREE.Color(0x39ff88),
  orange: new THREE.Color(0xff8a1f),
  red: new THREE.Color(0xff003c),
  white: new THREE.Color(0xffffff),
  ice: new THREE.Color(0xbff8ff),
  grey: new THREE.Color(0x3a4a55),
};
// 5 类题材：0 粉（“你”后来常看的）/ 1 青 / 2 黄 / 3 绿 / 4 橙
export const TOPICS = [C.pink, C.cyan, C.yellow, C.green, C.orange];

// ---------- 渲染器 ----------
export const canvas = document.getElementById("three-layer");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.setClearColor(0x000000, 1);

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.006);
export const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.05, 1000);

export const composer = new EffectComposer(renderer);
composer.setPixelRatio(1);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.55, 0.12);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- 点精灵 ----------
export const POINT_SCALE = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export const pointMat = new THREE.ShaderMaterial({
  uniforms: { uScale: { value: POINT_SCALE } },
  vertexShader: `
    attribute vec4 aColor; attribute float aSize; uniform float uScale; varying vec4 vColor;
    void main(){
      vColor = aColor;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = min(aSize * uScale / -mv.z, 160.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec4 vColor;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor.rgb, vColor.a * a);
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

// 一组 CPU 驱动的粒子：pos / col(rgba) / size
export function makePoints(n) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 4));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const points = new THREE.Points(geo, pointMat);
  points.frustumCulled = false; // 位置每帧都变，不能按初始包围球裁剪
  scene.add(points);
  return {
    n, pos, col, size, points,
    set(i, x, y, z, c, a, s) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b; col[i * 4 + 3] = a;
      size[i] = s;
    },
    setRGB(i, x, y, z, r, g, b, a, s) {
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 4] = r; col[i * 4 + 1] = g; col[i * 4 + 2] = b; col[i * 4 + 3] = a;
      size[i] = s;
    },
    hide(i) { col[i * 4 + 3] = 0; },
    hideAll() { col.fill(0); this.flush(); },
    flush() {
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
    },
  };
}

// 发光线框环
export function glowLine(points, color, closed = true) {
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const line = closed ? new THREE.LineLoop(geo, mat) : new THREE.Line(geo, mat);
  return line;
}
export function additiveBasic(color) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
}

// ---------- 镜头：球坐标关键帧 ----------
// 每个关键帧：{ t, p: [pivot x,y,z], az(度), el(度), d(距离), sh(横移，可选) }
export function cameraRig(keys) {
  const piv = new THREE.Vector3(), right = new THREE.Vector3();
  return function apply(t, shake = [0, 0]) {
    let a = keys[0], b = keys[keys.length - 1];
    if (t <= keys[0].t) b = a;
    else if (t >= b.t) a = b;
    else for (let i = 0; i < keys.length - 1; i++) {
      if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
    }
    const k = b.t > a.t ? easeInOutCubic((t - a.t) / (b.t - a.t)) : 0;
    piv.set(lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k), lerp(a.p[2], b.p[2], k));
    const az = THREE.MathUtils.degToRad(lerp(a.az, b.az, k));
    const el = THREE.MathUtils.degToRad(lerp(a.el, b.el, k));
    const d = lerp(a.d, b.d, k);
    const sh = lerp(a.sh || 0, b.sh || 0, k);
    camera.position.set(
      piv.x + d * Math.cos(el) * Math.sin(az),
      piv.y + d * Math.sin(el),
      piv.z + d * Math.cos(el) * Math.cos(az)
    );
    camera.lookAt(piv);
    camera.updateMatrixWorld();
    // 横移：镜头和目标一起沿画面右方向平移，把主体推到画面一侧
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    camera.position.addScaledVector(right, sh);
    camera.position.x += shake[0]; camera.position.y += shake[1];
    camera.lookAt(piv.clone().addScaledVector(right, sh));
    camera.updateMatrixWorld();
  };
}

// ---------- 3D → 屏幕坐标 ----------
const _v = new THREE.Vector3();
export function toScreen(v) {
  _v.copy(v).project(camera);
  return { x: ((_v.x + 1) / 2) * W, y: ((1 - _v.y) / 2) * H, behind: _v.z > 1 };
}
