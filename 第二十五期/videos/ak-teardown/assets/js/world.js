// 场景根：渲染器、布光、后期、材质和几何工具。沿用第二十三期确认过的画风：中性柔光箱 ＋ 黑旗，光只服务于看清结构。
// 单位：厘米。本片场景比手机大约五倍，阴影相机和 AO 半径按此放大。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TXT = [...(window.CAPTIONS || []).map((c) => c[2]), ...(window.NOTES || []).map((c) => c[2]), "弹匣拉机柄机匣盖复进簧枪机框连活塞枪身导气孔凸轮槽转约35°弹壳下一发锁死导轨晃动示意慢放真实速度膛压设计年份1947外形参考AKM0123456789:./s"].join("");
await Promise.all(["800 60px NotoSC", "700 36px NotoSC", "800 84px NotoSC"].map((f) => document.fonts.load(f, TXT)));

export const AMBER = new THREE.Color(1.0, .52, .12);
const W = 1920, H = 1080, canvas = document.getElementById("gl");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.localClippingEnabled = true; renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const BG = new THREE.Color(.016, .017, .02);
export const scene = new THREE.Scene(); scene.background = BG;
export const camera = new THREE.PerspectiveCamera(36, W / H, .5, 2000);

{
  const room = new THREE.Scene(); room.background = new THREE.Color(.014, .015, .017);
  const panel = (w, h, x, y, z, k, tint = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  panel(14, 10, 0, 2, 14, 3.2); panel(4, 14, -12, 4, 8, 6, [1, .96, .9]); panel(2.2, 14, 13, 5, -6, 9, [.88, .94, 1]); panel(2.2, 14, -11, 5, -9, 5); panel(8, 3, 6, -8, 12, 1.6);
  panel(5, 16, 12, 4, 7, .02); panel(4, 16, -13, 4, -2, .02);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(room, .02).texture; pm.dispose();
}
export const key = new THREE.DirectionalLight(0xfff3e6, 2.6); key.position.set(-35, 45, 80);
export const rim = new THREE.DirectionalLight(0xdbe8ff, 1.2); rim.position.set(45, -30, 40); scene.add(rim); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -70, right: 70, top: 45, bottom: -45, near: 10, far: 250 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02; scene.add(key); scene.add(key.target);

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
export const composer = new EffectComposer(renderer, rt); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
export const ao = new GTAOPass(scene, camera, W, H); ao.blendIntensity = 1; ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 }); composer.addPass(ao);
let aoR = 0; export const setAO = (r) => { r = Math.round(r * 20) / 20; if (r !== aoR) { aoR = r; ao.updateGtaoMaterial({ radius: r, distanceExponent: 1.4, thickness: r * 2, scale: 1.3, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }); } };
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

// ── 材质：发黑的静止件、亮一些的运动件、木头和黄铜。运动件比静止件亮，一眼分得出「谁在动」。 ──
export const PBR = (o) => new THREE.MeshPhysicalMaterial(o);
export const M = {
  recv: PBR({ color: 0x34383d, metalness: 1, roughness: .5, side: THREE.DoubleSide }),
  barrel: PBR({ color: 0x3c4046, metalness: 1, roughness: .42, side: THREE.DoubleSide }),
  move: PBR({ color: 0x9aa0a7, metalness: 1, roughness: .32 }),
  bolt: PBR({ color: 0xb4bac0, metalness: 1, roughness: .26 }),
  spring: PBR({ color: 0xb8bcc2, metalness: 1, roughness: .3 }),
  wood: PBR({ color: 0x7a3b1c, metalness: 0, roughness: .52, clearcoat: .35, clearcoatRoughness: .45, side: THREE.DoubleSide }),
  grip: PBR({ color: 0x40261a, metalness: 0, roughness: .55, clearcoat: .2 }),
  mag: PBR({ color: 0x6a3424, metalness: 0, roughness: .5, clearcoat: .25, side: THREE.DoubleSide }),
  brass: PBR({ color: 0xc9a046, metalness: 1, roughness: .28 }),
  jacket: PBR({ color: 0xb86b3c, metalness: 1, roughness: .3 }),
  black: PBR({ color: 0x0c0d0f, metalness: .6, roughness: .45 }),
};

// ── 几何工具 ──
export const ex = (shape, depth, bevel = .025) => { const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(depth - bevel * 2, .001), bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 }); g.translate(0, 0, -(depth - bevel * 2) / 2); return g; };
export const box = (w, h, d, r = .05) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.01));
export const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
export const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
/** 沿 x 轴的圆柱，从 x0 到 x1 */
export const cylX = (r, x0, x1, seg = 40) => new THREE.CylinderGeometry(r, r, x1 - x0, seg).rotateZ(-Math.PI / 2).translate((x0 + x1) / 2, 0, 0);
export const poly = (pts) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (const p of pts.slice(1)) s.lineTo(...p); s.closePath(); return s; };
export const root = grp(scene);
