// 场景根：渲染器、布光、后期、材质和几何工具。画风沿用第二十三、二十五期：中性柔光箱 ＋ 黑旗，光只服务于看清结构。
// 单位：分米（1 = 10 cm）。车长约 56，x 指向车头，y 向上，z 指向车的右侧（镜头一侧）。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const LABEL_TXT = "车底两条隧道把车吸向地面入口出口扩散器加速低压下压力贴得更近吸更牢气流断了车弹起又被吸下前悬架拉杆式刹车时撑住车头下沉稳住对比车示意防滑木条刹车→（）·！";
const TXT = [...(window.CAPTIONS || []).map((c) => c[2]), ...(window.NOTES || []).map((c) => c[2]), LABEL_TXT, "0123456789F"].join("");
await Promise.all(["800 60px NotoSC", "700 36px NotoSC", "800 44px NotoSC", "500 36px NotoSC"].map((f) => document.fonts.load(f, TXT)));

export const AMBER = new THREE.Color(1.0, .62, .2);
const W = 1920, H = 1080, canvas = document.getElementById("gl");
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.localClippingEnabled = true; renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
export const BG = new THREE.Color(.016, .017, .02);
export const scene = new THREE.Scene(); scene.background = BG;
export const camera = new THREE.PerspectiveCamera(36, W / H, .5, 2000);

// 环境反射：几块柔光箱 ＋ 黑旗。碳纤维靠清漆反射出轮廓，所以柔光箱比上期多一块长条顶灯。
{
  const room = new THREE.Scene(); room.background = new THREE.Color(.014, .015, .017);
  const panel = (w, h, x, y, z, k, tint = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  panel(14, 10, 0, 2, 14, 3.2); panel(4, 14, -12, 4, 8, 6, [1, .96, .9]); panel(2.2, 14, 13, 5, -6, 9, [.88, .94, 1]); panel(2.2, 14, -11, 5, -9, 5); panel(8, 3, 6, -8, 12, 1.6);
  panel(22, 2.2, 0, 13, 0, 7); // 长条顶灯：在车身上拉出一条亮线
  panel(5, 16, 12, 4, 7, .02); panel(4, 16, -13, 4, -2, .02);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(room, .02).texture; pm.dispose();
}
export const key = new THREE.DirectionalLight(0xfff3e6, 2.6); key.position.set(-35, 60, 70);
export const rim = new THREE.DirectionalLight(0xdbe8ff, 1.4); rim.position.set(45, 20, -50); scene.add(rim); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 250 }); key.shadow.bias = -.0004; key.shadow.normalBias = .02; scene.add(key); scene.add(key.target);
key.target.position.set(0, 0, -6);

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

// ── 几何工具 ──
export const box = (w, h, d, r = .05) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.01));
export const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
export const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
export const root = grp(scene);
