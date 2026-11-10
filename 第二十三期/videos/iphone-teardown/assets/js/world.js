// 场景根：渲染器、布光、后期、材质和几何工具。布光是中性柔光箱 ＋ 黑旗，光只服务于看清结构。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

await Promise.all(["900 200px NotoSC", "800 60px NotoSC"].map((f) => document.fonts.load(f, "性能核心能效图形神经网络引擎缓存0123456789:")));

export const AMBER = new THREE.Color(1.0, .52, .12), CYAN = new THREE.Color(.16, .82, 1.0);
const W = 1920, H = 1080, canvas = document.getElementById("gl");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const BG = new THREE.Color(.016, .017, .02);
export const scene = new THREE.Scene(); scene.background = BG; scene.fog = new THREE.FogExp2(BG, 0);
export const camera = new THREE.PerspectiveCamera(36, W / H, .05, 400);

{
  const room = new THREE.Scene(); room.background = new THREE.Color(.014, .015, .017);
  const panel = (w, h, x, y, z, k, tint = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  panel(14, 10, 0, 2, 14, 3.2); panel(4, 14, -12, 4, 8, 6, [1, .96, .9]); panel(2.2, 14, 13, 5, -6, 9, [.88, .94, 1]); panel(2.2, 14, -11, 5, -9, 5); panel(8, 3, 6, -8, 12, 1.6);
  panel(5, 16, 12, 4, 7, .02); panel(4, 16, -13, 4, -2, .02);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(room, .02).texture; pm.dispose();
}
export const key = new THREE.DirectionalLight(0xfff3e6, 2.6); key.position.set(-7, 9, 16);
export const rim = new THREE.DirectionalLight(0xdbe8ff, 1.2); rim.position.set(9, -6, 8); scene.add(rim); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 60 }); key.shadow.bias = -.0004; scene.add(key); scene.add(key.target);

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
export const composer = new EffectComposer(renderer, rt); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
export const ao = new GTAOPass(scene, camera, W, H); ao.blendIntensity = 1; ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 }); composer.addPass(ao);
let aoR = 0; export const setAO = (r) => { r = Math.round(r * 50) / 50; if (r !== aoR) { aoR = r; ao.updateGtaoMaterial({ radius: r, distanceExponent: 1.4, thickness: r * 2, scale: 1.3, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }); } };
export const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .08, .4, 1.5); composer.addPass(bloom);
export const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uZoom: { value: 0 }, uAb: { value: 0 }, uFlash: { value: 0 }, uSeed: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uZoom,uAb,uFlash,uSeed; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233))+uSeed)*43758.5453); }
    void main(){ vec2 d=vUv-.5; vec3 c=vec3(0.); float w=0.;
      for(int i=0;i<14;i++){ float s=1.-uZoom*float(i)/13.; float g=1.-float(i)/16.;
        c.r+=texture2D(tDiffuse,.5+d*s*(1.+uAb)).r*g; c.g+=texture2D(tDiffuse,.5+d*s).g*g; c.b+=texture2D(tDiffuse,.5+d*s*(1.-uAb)).b*g; w+=g; }
      c/=w; float v=smoothstep(1.,.35,length(d));
      c=c*mix(.72,1.,v)+vec3(uFlash); c+=(h(vUv*vec2(1920.,1080.))-.5)*.006;
      gl_FragColor=vec4(max(c,vec3(0.)),1.); }`,
});
composer.addPass(fx); composer.addPass(new OutputPass());

// ── 材质 ──
export const PBR = (o) => new THREE.MeshPhysicalMaterial(o);
export const M = {
  body: PBR({ color: 0x63676c, metalness: 1, roughness: .42 }),
  glass: PBR({ color: 0x23282f, metalness: .2, roughness: .62, clearcoat: .22, clearcoatRoughness: .55 }),
  steel: PBR({ color: 0x9aa0a6, metalness: 1, roughness: .36 }),
  dark: PBR({ color: 0x5a5f66, metalness: 1, roughness: .5 }),
  black: PBR({ color: 0x07080a, metalness: .3, roughness: .36, clearcoat: .4 }),
  foil: PBR({ color: 0x747880, metalness: .9, roughness: .62 }),
  plate: PBR({ color: 0x62666d, metalness: 1, roughness: .55 }),
  copper: PBR({ color: 0xc8703c, metalness: 1, roughness: .3 }),
  gold: PBR({ color: 0xd9a441, metalness: 1, roughness: .32 }),
  ribbon: PBR({ color: 0x4a3112, metalness: .2, roughness: .62 }),
  blade: PBR({ color: 0x3e4146, metalness: .55, roughness: .4, clearcoat: .3, clearcoatRoughness: .4 }),
  white: PBR({ color: 0xc9cbcd, metalness: 0, roughness: .6 }),
};

// ── 几何工具 ──
export const rr = (w, h, r, cx = 0, cy = 0) => { const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s; };
export const ex = (shape, depth, bevel = .025) => { const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(depth - bevel * 2, .001), bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 32 }); g.translate(0, 0, -(depth - bevel * 2) / 2); return g; };
export const box = (w, h, d, r = .025) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.01));
export const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
export const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
export const cyl = (rt, rb, h, seg = 48) => new THREE.CylinderGeometry(rt, rb, h, seg).rotateX(Math.PI / 2);
export const ring = (ro, ri, depth, bevel = .004) => { const s = new THREE.Shape(); s.absarc(0, 0, ro, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, ri, 0, Math.PI * 2, true); s.holes.push(h); return ex(s, depth, bevel); };
export function textPlane(str, h, { color = "#fff", size = 220, gain = 1.3 } = {}) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), font = `900 ${size}px NotoSC`;
  g.font = font; c.width = Math.ceil(g.measureText(str).width + 60); c.height = Math.ceil(size * 1.35);
  g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color; g.fillText(str, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }); mat.color.setScalar(gain);
  return new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), mat);
}
export const backing = (w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x020305, transparent: true, depthWrite: false, fog: false }));
export const root = grp(scene);
