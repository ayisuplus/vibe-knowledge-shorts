// iPhone 动效测试（25.5 秒）：解锁 → 电池反差 → 顺着电流冲进芯片 → 芯片是一座城。
// 一条驱动 tween；每帧状态都是拍 n 的纯函数，可任意跳帧。结构均为示意，不对应具体机型。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { BEAT, DUR, CAPS, HITS, SHAKES, SPARKS, B } from "./beats.js";

await Promise.all(["900 200px NotoSC", "800 60px NotoSC"].map((f) => document.fonts.load(f, "电池芯片性能核心能效图形神经网络引擎缓存")));

// ── 纯函数工具 ──
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, p) => a + (b - a) * p;
const mixV = (a, b, p) => a.map((v, i) => mix(v, b[i], p));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 4; };
const easeIn = (x) => { x = clamp(x); return x * x * x; };
/** 机械动作：先猛冲，过头一点再顶回去 */
const clunk = (n, a, d) => { const u = clamp((n - a) / d), c = 2.2; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
const win = (n, a, b) => n >= a && n < b;
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function kick(n, rate = 4.5) { let k = 0; for (const h of HITS) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * rate)); return k; }
function shake(n) { let k = 0; for (const h of SHAKES) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * 7)); return k; }
function lastHit(n, from) { let l = from; for (const h of HITS) if (h <= n && h >= from) l = h; return l; }

const AMBER = new THREE.Color(1.0, .52, .12), CYAN = new THREE.Color(.16, .82, 1.0);

// ── 渲染器 ──
const W = 1920, H = 1080, canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const BG = new THREE.Color(.016, .017, .02);
const scene = new THREE.Scene(); scene.background = BG; scene.fog = new THREE.FogExp2(BG, 0);
const camera = new THREE.PerspectiveCamera(36, W / H, .05, 400);

// 环境：中性柔光箱 ＋ 黑旗（数值取自 Machine Skill 的 night 棚）。环境转得很慢，高光只是缓缓走过金属。
{
  const room = new THREE.Scene(); room.background = new THREE.Color(.014, .015, .017);
  const panel = (w, h, x, y, z, k, tint = [1, 1, 1]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); room.add(m); };
  panel(14, 10, 0, 2, 14, 3.2); panel(4, 14, -12, 4, 8, 6, [1, .96, .9]); panel(2.2, 14, 13, 5, -6, 9, [.88, .94, 1]); panel(2.2, 14, -11, 5, -9, 5); panel(8, 3, 6, -8, 12, 1.6);
  panel(5, 16, 12, 4, 7, .02); panel(4, 16, -13, 4, -2, .02);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(room, .02).texture; pm.dispose();
}
const key = new THREE.DirectionalLight(0xfff3e6, 2.6); key.position.set(-7, 9, 16);
const rim = new THREE.DirectionalLight(0xdbe8ff, 1.2); rim.position.set(9, -6, 8); scene.add(rim); key.castShadow = true;
key.shadow.mapSize.set(4096, 4096); Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 }); key.shadow.bias = -.0004; scene.add(key);
const glowA = new THREE.PointLight(AMBER, 0, 22, 1.6); scene.add(glowA);
const glowC = new THREE.PointLight(CYAN, 0, 18, 1.6); scene.add(glowC);

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const ao = new GTAOPass(scene, camera, W, H); ao.blendIntensity = 1; ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 4, radiusExponent: 1, rings: 2, samples: 16 }); composer.addPass(ao);
let aoR = 0; const setAO = (r) => { if (r !== aoR) { aoR = r; ao.updateGtaoMaterial({ radius: r, distanceExponent: 1.4, thickness: r * 2, scale: 1.3, samples: 16, distanceFallOff: 1, screenSpaceRadius: false }); } };
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .08, .4, 1.5); composer.addPass(bloom);
const fx = new ShaderPass({
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

// ── 材质与几何工具 ──
const PBR = (o) => new THREE.MeshPhysicalMaterial(o);
const titanium = PBR({ color: 0x8b8f93, metalness: 1, roughness: .34 });
const backGlass = PBR({ color: 0x23282f, metalness: .2, roughness: .62, clearcoat: .22, clearcoatRoughness: .55 });
const steel = PBR({ color: 0x9aa0a6, metalness: 1, roughness: .36 });
const darkSteel = PBR({ color: 0x5a5f66, metalness: 1, roughness: .5 });
const black = PBR({ color: 0x07080a, metalness: .3, roughness: .36, clearcoat: .4 });
const foil = PBR({ color: 0x747880, metalness: .9, roughness: .62 });
const plateSteel = PBR({ color: 0x62666d, metalness: 1, roughness: .55 });
const copper = PBR({ color: 0xc8703c, metalness: 1, roughness: .3 });
const gold = PBR({ color: 0xd9a441, metalness: 1, roughness: .32 });
const rr = (w, h, r, cx = 0, cy = 0) => { const s = new THREE.Shape(), x = cx - w / 2, y = cy - h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI); s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s; };
const ex = (shape, depth, bevel = .025) => { const g = new THREE.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 32 }); g.translate(0, 0, -(depth - bevel * 2) / 2); return g; };
const box = (w, h, d, r = .025) => new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2.01));
const add = (parent, geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function textPlane(str, h, { color = "#fff", size = 220, gain = 1.3 } = {}) {
  const c = document.createElement("canvas"), g = c.getContext("2d"), font = `900 ${size}px NotoSC`;
  g.font = font; c.width = Math.ceil(g.measureText(str).width + 60); c.height = Math.ceil(size * 1.35);
  g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color; g.fillText(str, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }); mat.color.setScalar(gain);
  return new THREE.Mesh(new THREE.PlaneGeometry(h * c.width / c.height, h), mat);
}

// ── 手机。背面朝 +z；单位约等于厘米 ──
const PW = 7.15, PH = 14.96, PR = 1.15;
const world = grp(scene), phone = grp(world);
{
  const f = rr(PW, PH, PR); f.holes.push(rr(PW - .34, PH - .34, PR - .17)); add(phone, ex(f, .8, .05), titanium);
  add(phone, ex(rr(PW - .3, PH - .3, PR - .15), .08, .01), black, 0, 0, -.36);
  add(phone, ex(rr(PW - .34, PH - .34, PR - .17), .06, .01), darkSteel, 0, 0, -.28);
  for (const [x, y, l] of [[-PW / 2 - .02, 3.1, 1.3], [-PW / 2 - .02, 4.7, .9], [PW / 2 + .02, 3.9, 2.0]]) add(phone, box(.1, l, .34, .05), steel, x, y, 0);
  add(phone, box(1.0, .12, .3, .05), black, 0, -PH / 2 - .005, 0);
  for (let i = 0; i < 5; i++) { add(phone, box(.32, .09, .16, .04), black, 1.2 + i * .42, -PH / 2 - .005, 0); add(phone, box(.32, .09, .16, .04), black, -1.2 - i * .42, -PH / 2 - .005, 0); }
}
// 内部：相机模组、电池、主板、马达
const inner = grp(phone);
const lensCanvas = document.createElement("canvas"); lensCanvas.width = lensCanvas.height = 512;
{ const g = lensCanvas.getContext("2d"), r = g.createRadialGradient(256, 256, 8, 256, 256, 256); r.addColorStop(0, "#020304"); r.addColorStop(.42, "#07121c"); r.addColorStop(.56, "#0f3c55"); r.addColorStop(.64, "#06090d"); r.addColorStop(.84, "#14161a"); r.addColorStop(1, "#050506"); g.fillStyle = r; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(255,190,120,.3)"; g.lineWidth = 2; for (const q of [96, 150, 212]) { g.beginPath(); g.arc(256, 256, q, 0, 7); g.stroke(); } }
const lensTex = new THREE.CanvasTexture(lensCanvas); lensTex.colorSpace = THREE.SRGBColorSpace; lensTex.anisotropy = 16;
const lensGlass = PBR({ map: lensTex, metalness: .2, roughness: .06, clearcoat: 1, clearcoatRoughness: .03 });
function lens(parent, x, y, z, r) {
  const a = add(parent, new THREE.CylinderGeometry(r, r * 1.03, .22, 72), steel, x, y, z); a.rotation.x = Math.PI / 2;
  const t = add(parent, new THREE.TorusGeometry(r * .94, r * .06, 16, 96), titanium, x, y, z + .11);
  const g = add(parent, new THREE.CircleGeometry(r * .88, 72), lensGlass, x, y, z + .12); return [a, t, g];
}
const camBlock = grp(inner, -1.7, 5.2, 0);
add(camBlock, box(2.7, 3.3, .42, .12), darkSteel, 0, 0, 0);
for (const [x, y, r] of [[-.65, .82, .56], [-.65, -.82, .56], [.68, 0, .56]]) lens(camBlock, x, y, .24, r);
const battery = grp(inner, 0, -2.2, 0);
add(battery, box(6.1, 7.4, .4, .14), darkSteel, 0, 0, 0);
const cellMat = new THREE.ShaderMaterial({
  uniforms: { uFill: { value: 0 }, uT: { value: 0 } }, transparent: false,
  vertexShader: "varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `uniform float uFill,uT; varying vec2 vU;
    void main(){ float l=fract(vU.x*22.), band=smoothstep(.0,.1,abs(l-.5)-.08), sheen=.75+.25*sin(vU.x*22.*6.283*.5);
      float edge=exp(-pow((vU.y-uFill)*90.,2.));
      vec3 c=vec3(.2,.205,.215)*band*sheen+vec3(.03)+vec3(.95,.55,.2)*edge*.8*band;
      gl_FragColor=vec4(c,1.); }`,
});
const cell = new THREE.Mesh(new THREE.PlaneGeometry(5.75, 7.05), cellMat); cell.position.z = .205; battery.add(cell);
const lid = add(battery, box(6.0, 7.3, .05, .02), foil, 0, 0, .225);
for (const [x, y, w, h, m] of [[0, 3.42, 5.9, .12, darkSteel], [0, -3.42, 5.9, .12, darkSteel], [-2.86, 0, .1, 6.7, darkSteel], [2.86, 0, .1, 6.7, darkSteel], [-1.7, 2.4, 1.5, .5, black], [1.6, -2.7, 1.1, .4, black]]) add(lid, new THREE.BoxGeometry(w, h, .012), m, x, y, .03);
const backing = (w, h) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x020305, transparent: true, depthWrite: false, fog: false }));
const word = textPlane("电池", 3.0, { color: "#fff0d8", size: 300, gain: 1.15 }); word.rotation.z = Math.PI / 2; word.position.set(0, 0, .3); battery.add(word);
const wordBack = backing(3.3, 6.2); wordBack.position.set(0, 0, .29); battery.add(wordBack);
// 线性马达：钢框里的线圈和质量块；扬声器：格栅
const taptic = grp(inner, -1.8, -6.5, 0);
add(taptic, box(2.3, 1.05, .1, .04), darkSteel, 0, 0, -.1);
for (const [x, y, w, h] of [[0, .49, 2.3, .07], [0, -.49, 2.3, .07], [-1.12, 0, .07, 1.05], [1.12, 0, .07, 1.05]]) add(taptic, new THREE.BoxGeometry(w, h, .3), steel, x, y, 0);
add(taptic, box(1.0, .74, .22, .03), steel, -.35, 0, .02);
for (let i = 0; i < 5; i++) { const c = add(taptic, new THREE.TorusGeometry(.26, .022, 8, 32), copper, .55, 0, -.06 + i * .045); c.castShadow = false; }
for (const sy of [1, -1]) add(taptic, new THREE.BoxGeometry(.28, .025, .12), gold, .12, sy * .24, .02);
const speaker = grp(inner, 1.9, -6.5, 0);
add(speaker, box(1.8, .95, .22, .06), darkSteel, 0, 0, -.04);
for (let i = 0; i < 7; i++) add(speaker, new THREE.BoxGeometry(1.5, .05, .06), steel, 0, -.33 + i * .11, .1);
// 电池极耳、保护板、排线
add(battery, box(1.9, .34, .1, .02), black, .9, 3.82, .08);
for (const x of [.4, 1.4]) add(battery, new THREE.BoxGeometry(.36, .3, .03), steel, x, 3.72, .2);
const ribbon = PBR({ color: 0x4a3112, metalness: .2, roughness: .62 });
add(inner, new THREE.BoxGeometry(.7, .75, .02), ribbon, .9, 2.25, .15);
add(inner, box(.9, .26, .1, .02), darkSteel, .9, 2.6, .16);
add(inner, new THREE.BoxGeometry(.6, 1.0, .02), ribbon, -.15, 3.65, .2);
add(inner, box(.8, .24, .1, .02), darkSteel, .1, 3.2, .17);
// 中框固定点
for (const [x, y] of [[-3, 7], [3, 7.05], [-3.05, 1.2], [3.05, 1.2], [-3.05, -5.8], [3.05, -5.8], [0, -5.75], [.2, 7.0]]) { add(inner, new THREE.CylinderGeometry(.13, .13, .08, 20).rotateX(Math.PI / 2), steel, x, y, .1); add(inner, new THREE.BoxGeometry(.17, .03, .02), black, x, y, .145); }

// 主板纹理：只画走线和焊盘，不画成密集圆点
const pcb = document.createElement("canvas"); pcb.width = pcb.height = 2048;
{
  const g = pcb.getContext("2d"); g.fillStyle = "#101a1c"; g.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 420; i++) {
    let x = hash(i) * 2048, y = hash(i + 700) * 2048; g.strokeStyle = i % 9 === 0 ? "rgba(255,180,84,.8)" : "rgba(190,145,70,.34)"; g.lineWidth = i % 9 === 0 ? 5 : 2.4; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { const l = 40 + hash(i * 3 + k) * 240, d = Math.floor(hash(i * 5 + k * 7) * 4); if (d === 0) x += l; else if (d === 1) y += l; else if (d === 2) { x += l * .7; y -= l * .7; } else y -= l; g.lineTo(x, y); }
    g.stroke();
  }
}
const pcbT = new THREE.CanvasTexture(pcb); pcbT.colorSpace = THREE.SRGBColorSpace; pcbT.wrapS = pcbT.wrapT = THREE.RepeatWrapping; pcbT.repeat.set(1 / 8, 1 / 8); pcbT.anisotropy = 16;
const pcbMat = PBR({ map: pcbT, emissiveMap: pcbT, emissive: 0xffffff, emissiveIntensity: .06, metalness: .35, roughness: .5 });
const board = grp(inner);
{ const s = new THREE.Shape(); s.moveTo(-3.1, 1.75); s.lineTo(3.15, 1.75); s.lineTo(3.15, 6.9); s.lineTo(2.4, 7.1); s.lineTo(-.15, 7.1); s.lineTo(-.15, 3.15); s.lineTo(-3.1, 3.15); s.closePath(); add(board, ex(s, .09, .01), pcbMat, 0, 0, 0); }
const D = new THREE.Vector3(1.5, 5, .2);       // 芯片中心
{
  const inRect = (x, y) => x > .1 && x < 2.9 && y > 3.7 && y < 6.3;
  for (let i = 0; i < 14; i++) { const x = mix(.3, 2.8, hash(i * 2.1)), y = hash(i * 4.3) < .6 ? mix(2, 3.3, hash(i * 3.9)) : 6.6, w = .35 + .5 * hash(i), h = .3 + .3 * hash(i + 3); if (!inRect(x, y)) add(board, box(w, h, .1, .02), black, x, y, .1); }
  for (let i = 0; i < 12; i++) { const x = mix(-3, -.4, hash(i + 40)), y = mix(1.95, 2.95, hash(i + 80)); add(board, box(.34, .3, .08, .02), i % 3 ? black : darkSteel, x, y, .09); }
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, .07, .07), gold, 60); const m = new THREE.Matrix4();
  for (let i = 0; i < 60; i++) { let x = mix(-3, 3, hash(i * 1.3 + 90)), y = mix(1.9, 3.05, hash(i * 2.7 + 11)); if (i % 2) { x = mix(.2, 3, hash(i + 200)); y = mix(3.2, 7, hash(i + 300)); } if (inRect(x, y)) x = 2.98; m.makeRotationZ(i % 3 ? 0 : Math.PI / 2); m.setPosition(x, y, .085); caps.setMatrixAt(i, m); }
  caps.castShadow = true; board.add(caps);
  // 屏蔽罩围栏
  for (const [x, y, w, h] of [[1.5, 3.9, 2.4, .03], [1.5, 6.1, 2.4, .03], [.3, 5, .03, 2.2], [2.7, 5, .03, 2.2]]) add(board, new THREE.BoxGeometry(w, h, .22), steel, x, y, .15);
  add(board, box(1.7, 1.7, .08, .02), black, D.x, D.y, .1);
}
const can = grp(board, 1.5, 6.1, .26);            // 屏蔽罩顶盖，铰链在上沿
add(can, box(2.4, 2.2, .03, .01), plateSteel, 0, -1.1, 0);
for (const [x, y, w, h] of [[0, -.16, 2.16, .05], [0, -2.04, 2.16, .05], [-1.08, -1.1, .05, 1.93], [1.08, -1.1, .05, 1.93], [-.45, -1.1, .05, 1.2], [.45, -1.1, .05, 1.2]]) add(can, box(w, h, .03, .01), steel, x, y, .02);
const pkgL = add(board, box(.85, 1.66, .05, .01), darkSteel, D.x - .425, D.y, .19), pkgR = add(board, box(.85, 1.66, .05, .01), darkSteel, D.x + .425, D.y, .19);
// 主板盖板 ＋ 螺丝、无线充电线圈板
const cover = grp(inner); add(cover, box(6.2, 5.2, .04, .02), plateSteel, 0, 4.5, .31);
const SCREWS = [[-2.8, 2.2], [2.8, 2.2], [2.8, 6.7], [-.4, 6.7], [-2.8, 3.0], [-.4, 3.4]].map(([x, y], i) => { const g = grp(inner, x, y, .36); add(g, new THREE.CylinderGeometry(.12, .12, .1, 24).rotateX(Math.PI / 2), darkSteel); add(g, new THREE.BoxGeometry(.16, .03, .02), black, 0, 0, .055); g.userData = { x, y, k: i }; return g; });
const coilPlate = grp(inner, 0, -2.2, .34);
add(coilPlate, ex(rr(6.0, 7.2, .3), .03, .005), PBR({ color: 0x14171b, metalness: .4, roughness: .52 }));
{ const pts = []; for (let i = 0; i <= 900; i++) { const a = i / 900 * Math.PI * 2 * 12, r = 1.1 + i / 900 * 1.45; pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), .03)); } add(coilPlate, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 2400, .035, 6), copper); }
// 外壳：后盖两半、相机台
const backL = grp(phone), backR = grp(phone);
{
  const half = (sgn) => { const s = new THREE.Shape(), w = PW - .3, h = PH - .3, r = PR - .15; s.moveTo(0, -h / 2); s.lineTo(sgn * (w / 2 - r), -h / 2); s.absarc(sgn * (w / 2 - r), -h / 2 + r, r, sgn > 0 ? -Math.PI / 2 : -Math.PI / 2, sgn > 0 ? 0 : -Math.PI, sgn < 0); s.lineTo(sgn * w / 2, h / 2 - r); s.absarc(sgn * (w / 2 - r), h / 2 - r, r, sgn > 0 ? 0 : Math.PI, Math.PI / 2, sgn < 0); s.lineTo(0, h / 2); s.closePath(); return s; };
  add(backL, ex(half(-1), .09, .012), backGlass, 0, 0, .39); add(backR, ex(half(1), .09, .012), backGlass, 0, 0, .39);
}
const plate = grp(phone, -1.62, 5.35, .46);
add(plate, ex(rr(3.5, 3.75, .85), .14, .04), backGlass);
for (const [x, y, r] of [[-.72, .92, .68], [-.72, -.92, .68], [.82, 0, .68]]) lens(plate, x, y, .1, r);
add(plate, new THREE.CircleGeometry(.2, 32), PBR({ color: 0xf0e0c0, roughness: .22, clearcoat: 1 }), .95, 1.25, .08);
// 霓虹接缝：解锁时沿后盖跑一圈
const neon = (color, i) => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(i), transparent: true, fog: false });
function neonTube(points, r, mat, closed = false, seg = 400) { const c = new THREE.CatmullRomCurve3(points, closed, "catmullrom", .15), m = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, 8, closed), mat); m.userData = { c, full: m.geometry.index.count }; phone.add(m); return m; }
const seamPts = rr(PW - .3, PH - .3, PR - .15).getSpacedPoints(120).map((p) => new THREE.Vector3(p.x, p.y, .445));
const seam = neonTube(seamPts, .01, neon(CYAN, 1.3), true, 500);
const mid = neonTube([new THREE.Vector3(0, -7.35, .445), new THREE.Vector3(0, 0, .445), new THREE.Vector3(0, 7.35, .445)], .01, neon(CYAN, 1.3), false, 60);
// 电流路径：电池 → 主板 → 芯片
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PATH = [
  neonTube([V(.5, -.6, .3), V(.5, 1.5, .3), V(.6, 1.95, .17), V(1.0, 2.5, .15), V(2.6, 2.75, .15), V(2.95, 3.5, .15), V(2.5, 3.72, .15), V(1.6, 3.8, .16)], .016, neon(CYAN, 1.25)),
  neonTube([V(-.5, -.6, .3), V(-.5, 1.5, .3), V(-.3, 2.0, .17), V(.3, 2.35, .15), V(.15, 3.3, .15), V(.5, 3.75, .15), V(1.3, 3.8, .16)], .013, neon(AMBER, 1.15)),
  neonTube([V(2, -.6, .3), V(2, 1.5, .3), V(2.2, 1.95, .17), V(2.75, 2.2, .15), V(3.02, 3, .15), V(3.02, 4.4, .15), V(2.72, 5, .15)], .013, neon(CYAN, 1.1)),
];
const chipBox = grp(phone, 1.5, 5, .5);
for (const [x, y, w, h] of [[0, -1.2, 2.56, .05], [0, 1.2, 2.56, .05], [-1.26, 0, .05, 2.45], [1.26, 0, .05, 2.45]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, .02), neon(CYAN, 1.1)); m.position.set(x, y, 0); chipBox.add(m); }
const chipWord = textPlane("芯片", 1.15, { color: "#bff3ff", size: 220, gain: 1.15 }); chipWord.rotation.z = Math.PI / 2; chipWord.position.set(-1.75, 5, .55); phone.add(chipWord);
const chipBack = backing(1.35, 2.7); chipBack.position.set(-1.75, 5, .54); phone.add(chipBack);
const chipLead = new THREE.Mesh(new THREE.BoxGeometry(1, .03, .02), neon(CYAN, 2.4)); chipLead.position.set(-.67, 5, .5); phone.add(chipLead);
phone.traverse((o) => { if (o.material?.isMeshBasicMaterial || o === cell) { o.castShadow = o.receiveShadow = false; } });

// ── 火花、尘埃、背景 ──
const SP = 12, sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(.018, .018, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, .8, .3), fog: false }), SP * SPARKS.length); sparks.frustumCulled = false; world.add(sparks);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _f = new THREE.Vector3(0, 0, 1);
function sparkState(n) {
  let i = 0;
  for (const [h, x, y, z] of SPARKS) for (let k = 0; k < SP; k++, i++) {
    const d = (n - h) * BEAT, life = .45 + .5 * hash(k * 3.1 + h);
    if (d < 0 || d > life || n > 29.5) { _s.setScalar(0); _m.compose(_p.set(0, 0, 0), _q.identity(), _s); sparks.setMatrixAt(i, _m); continue; }
    const a = hash(k + h * 7) * 6.283, sp = 3 + 11 * hash(k * 1.7 + h), vx = sp * Math.cos(a), vy = sp * Math.sin(a), vz = 2 + 9 * hash(k * 2.3 + h), g = 14;
    _p.set(x + vx * d, y + vy * d, z + vz * d - g * d * d); _v.set(vx, vy, vz - 2 * g * d).normalize(); _q.setFromUnitVectors(_f, _v);
    _s.set(1, 1, (.1 + .5 * hash(k)) * (1 - d / life)); _m.compose(_p, _q, _s); sparks.setMatrixAt(i, _m);
  }
  sparks.instanceMatrix.needsUpdate = true;
}
const DN = 900, dustPos = new Float32Array(DN * 3), dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
const dotC = document.createElement("canvas"); dotC.width = dotC.height = 32; { const g = dotC.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: .09, map: new THREE.CanvasTexture(dotC), color: new THREE.Color(.75, .55, .35), transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); dust.frustumCulled = false; scene.add(dust);
function dustState(t) { for (let i = 0; i < DN; i++) { dustPos[i * 3] = (hash(i) - .5) * 44 + Math.sin(t * .4 + i) * .7; dustPos[i * 3 + 1] = (hash(i + 900) - .5) * 30 + Math.cos(t * .33 + i * 1.3) * .7; dustPos[i * 3 + 2] = (hash(i + 1900) - .5) * 30 - 2; } dustGeo.attributes.position.needsUpdate = true; }
const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uO: { value: 1 }, uH: { value: 0 } },
  vertexShader: "varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `uniform float uO,uH; varying vec3 vD;
    void main(){ float a=pow(max(0.,dot(vD,normalize(vec3(-.3,.45,-.84)))),2.5), hz=exp(-abs(vD.z)*5.);
      gl_FragColor=vec4(vec3(.014,.015,.018)+uO*vec3(.05,.052,.058)*a+uH*hz*vec3(.05,.054,.062),1.); }`,
})); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

// ── 芯片城：坐标是「芯片单位」，整片 1×1。分区布局为示意 ──
const die = grp(world, D.x, D.y, D.z);
const ZONES = [
  { x: [-.46, -.06], y: [.06, .46], name: "性能核心", c: AMBER, h: .06, cell: .03 },
  { x: [-.46, -.06], y: [-.18, .02], name: "能效核心", c: new THREE.Color(1, .72, .3), h: .026, cell: .021 },
  { x: [.02, .46], y: [.06, .46], name: "图形核心", c: CYAN, h: .044, cell: .026 },
  { x: [.02, .46], y: [-.2, .02], name: "神经网络引擎", c: new THREE.Color(.5, .95, .95), h: .032, cell: .022 },
  { x: [-.46, .46], y: [-.46, -.24], name: "缓存", c: new THREE.Color(.4, .62, .8), h: .014, cell: .025 },
];
const CITY_S = 220, floorC = document.createElement("canvas"); floorC.width = floorC.height = 2048;
{
  const g = floorC.getContext("2d"), P = (v) => (v + .5) * 2048; g.fillStyle = "#04060a"; g.fillRect(0, 0, 2048, 2048);
  for (const z of ZONES) { g.fillStyle = `rgba(${z.c.r * 255 | 0},${z.c.g * 255 | 0},${z.c.b * 255 | 0},.22)`; g.fillRect(P(z.x[0]), 2048 - P(z.y[1]), (z.x[1] - z.x[0]) * 2048, (z.y[1] - z.y[0]) * 2048); }
}
const floorT = new THREE.CanvasTexture(floorC); floorT.colorSpace = THREE.SRGBColorSpace; floorT.anisotropy = 16;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: floorT })); die.add(floor);
const BLD = [];
for (const z of ZONES) for (let x = z.x[0] + z.cell / 2; x < z.x[1]; x += z.cell) for (let y = z.y[0] + z.cell / 2; y < z.y[1]; y += z.cell) {
  const i = BLD.length, r = hash(i * .77), tall = hash(i * 1.91) > .94; BLD.push({ x, y, w: z.cell * (.72 + .12 * hash(i + 5)), d: z.cell * (.72 + .12 * hash(i + 9)), h: z.h * (tall ? 1 + .9 * r : .3 + .55 * r * r), c: z.c, s: hash(i * 3.3) });
}
const bGeo = new THREE.BoxGeometry(1, 1, 1), aCol = new Float32Array(BLD.length * 3), aSeed = new Float32Array(BLD.length);
BLD.forEach((b, i) => { aCol[i * 3] = b.c.r; aCol[i * 3 + 1] = b.c.g; aCol[i * 3 + 2] = b.c.b; aSeed[i] = b.s; });
bGeo.setAttribute("aCol", new THREE.InstancedBufferAttribute(aCol, 3)); bGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
const cityU = { uGrow: { value: 0 }, uW: { value: 0 }, uWa: { value: 0 }, uFog: { value: 0 }, uFogC: { value: BG }, uGlow: { value: 1 } };
const city = new THREE.InstancedMesh(bGeo, new THREE.ShaderMaterial({
  uniforms: cityU,
  vertexShader: `attribute vec3 aCol; attribute float aSeed; uniform float uGrow; varying vec3 vP,vN,vC,vL; varying float vS,vD,vH;
    void main(){ vec2 ctr=instanceMatrix[3].xy; float g=clamp((uGrow-length(ctr)*1.2)/.3,0.,1.); g=1.-pow(1.-g,3.);
      vec3 p=position; p.z=(p.z+.5)*g-.5; vec4 w=instanceMatrix*vec4(p,1.); vP=w.xyz; vN=normal; vC=aCol; vS=aSeed; vL=position; vH=g;
      vec4 mv=modelViewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uW,uWa,uFog,uGlow; uniform vec3 uFogC; varying vec3 vP,vN,vC,vL; varying float vS,vD,vH;
    float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
    void main(){ vec3 alb=mix(vec3(.17,.18,.2),vC,.09)*(.7+.6*vS); float dif=.34+.8*max(dot(vN,normalize(vec3(-.45,-.55,.7))),0.)+.14*max(dot(vN,normalize(vec3(.7,.4,.2))),0.);
      vec3 c=alb*dif*.95; float ao=mix(.28,1.,smoothstep(0.,.016,vP.z));
      if(vN.z>.5){ vec2 e=abs(vL.xy)*2.; float far=smoothstep(.002,.012,fwidth(vP.x)), rim=smoothstep(.9,.98,max(e.x,e.y))*(1.-far); c=c*1.25+vec3(.09)*rim;
      } else {
        float along=abs(vN.x)>.5?vP.y:vP.x, fl=floor(vP.z/.0042), col=floor(along/.0056+vS*7.);
        float gz=smoothstep(.08,.0,abs(fract(vP.z/.0042)-.5)-.04), w=max(fwidth(vP.z/.0042),fwidth(along/.0056)*2.);
        float seam=mix(gz,.1,smoothstep(.25,.8,w)); float rib=smoothstep(.0,.12,abs(fract(along/.0028+vS*3.)-.5)-.1); c*=mix(1.,.55+.45*rib,1.-smoothstep(.25,.8,fwidth(along/.0028)*2.)); c+=vec3(.05,.052,.058)*pow(max(vN.x*-.45+vN.y*-.55,0.),3.)*smoothstep(.0,.05,vP.z); c*=(1.-.45*seam); float lit=step(.93,h(vec2(fl,col)+vS*91.)); c+=vC*lit*gz*.32*(1.-smoothstep(.25,.8,w))*uGlow; c*=ao;
      }
      float d=length(vP.xy), ring=exp(-pow((d-uW)*42.,2.))*uWa; c+=vC*ring*.12;
      c=mix(uFogC,c,exp(-vD*uFog)); gl_FragColor=vec4(c,1.); }`,
}), BLD.length);
BLD.forEach((b, i) => { _m.compose(_p.set(b.x, b.y, b.h / 2), _q.identity(), _s.set(b.w, b.d, b.h)); city.setMatrixAt(i, _m); });
city.frustumCulled = false; die.add(city);
// 车流：沿街道跑的光条。位置只取决于 t
const LANES = [], TR = 360;
for (let i = 0; i < TR; i++) {
  const r = hash(i * 1.37), vert = i % 2 === 0, main = i < 240; let fix, span;
  if (main) { fix = vert ? -.02 + (i % 4 === 0 ? -.008 : .008) : (i % 4 === 1 ? .04 + .008 : .04 - .008); span = [-.48, .48]; }
  else { const z = ZONES[i % ZONES.length], a = vert ? z.x : z.y, kk = Math.floor(hash(i * 2.9) * (a[1] - a[0]) / z.cell / 4) * 4; fix = a[0] + kk * z.cell; span = vert ? z.y : z.x; }
  LANES.push({ vert, fix, a: span[0], L: span[1] - span[0], o: r, v: (.09 + .1 * hash(i + 4)) * (i % 3 === 0 ? -1 : 1), c: hash(i * 5.1) > .45 ? AMBER : CYAN });
}
const traffic = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), TR); traffic.frustumCulled = false; die.add(traffic);
LANES.forEach((l, i) => traffic.setColorAt(i, l.c.clone().multiplyScalar(1.05)));
function trafficState(t) { for (let i = 0; i < TR; i++) { const l = LANES[i]; const q = l.a + (((l.o * l.L + t * l.v) % l.L) + l.L) % l.L; _p.set(l.vert ? l.fix : q, l.vert ? q : l.fix, .0011); _s.set(l.vert ? .0007 : .009, l.vert ? .009 : .0007, .0004); _m.compose(_p, _q.identity(), _s); traffic.setMatrixAt(i, _m); } traffic.instanceMatrix.needsUpdate = true; }
// 悬空招牌（低空飞行时迎面而来）和俯瞰分区名
const SIGN = [["性能核心", -.09, .16, "#ffc070"], ["图形核心", .05, .22, "#9befff"], ["能效核心", -.085, -.09, "#ffd898"], ["神经网络引擎", .06, -.12, "#c8fbfb"]].map(([s, x, y, col]) => { const m = textPlane(s, .02, { color: "#e8ebef", size: 200, gain: .95 }); m.rotation.order = "ZXY"; m.userData.a = [x, y]; m.material.fog = true; die.add(m); return m; });
const SIGN2 = [[-.2, .085], [.16, .085], [-.07, -.005], [.27, -.005]];
const AERIAL = ZONES.map((z) => { const m = textPlane(z.name, .075, { color: "#ffffff", size: 220, gain: .95 }); m.position.set((z.x[0] + z.x[1]) / 2, (z.y[0] + z.y[1]) / 2, .1); m.renderOrder = 5; const b = backing(m.geometry.parameters.width * 1.04, .09); b.position.set(m.position.x, m.position.y, .099); b.renderOrder = 4; die.add(b); m.userData.b = b; die.add(m); return m; });

// ── 机位 ──
const L1 = [-2.34, 6.27, .68];
const Y = [0, 1, 0], Z = [0, 0, 1];
function shot(n, t, k) {
  let p, l, up = Y, fov = 36, u;
  if (n < 2) { u = n / 2; p = [L1[0] + mix(-1.1, .8, u), L1[1] - .75, L1[2] + mix(1.1, .9, u)]; l = L1; fov = 30; }
  else if (n < 4) { u = ease((n - 2) / 2); const y = mix(-8.5, 3.5, u); p = [5.1, y, 1.0]; l = [3.5, y + 3.2, 0]; up = Z; fov = 30; }
  else if (n < 6) { u = (n - 4) / 2; p = [mix(-3, 3, u), -10.6, mix(2.8, 1.5, u)]; l = [0, -7.4, 0]; up = Z; fov = 30; }
  else if (n < 8) { u = easeOut((n - 6) / 2); p = [mix(7, 2.5, u), mix(-4, -1, u), mix(38, 27, u)]; l = [0, -.9, 0]; up = [Math.sin(.28 * (1 - u)), Math.cos(.28 * (1 - u)), 0]; }
  else if (n < 10) { u = (n - 8) / 2; p = [mix(7, 10, u), mix(-5, -3, u), mix(26, 23, u)]; l = [0, -.3, .4]; const r = mix(.08, -.06, u); up = [Math.sin(r), Math.cos(r), 0]; }
  else if (n < 12) { u = (n - 10) / 2; p = [mix(-1.2, 1.2, u), -11.2, mix(2.6, 4.2, u)]; l = [0, 1, .4]; up = Z; fov = 44; }
  else if (n < 14) { u = (n - 12) / 2; p = [mix(-5, 2, u), mix(-3, -1, u), mix(13, 10.5, u)]; l = [.3, 1.8, 0]; }
  else if (n < 16) { u = ease((n - 14) / 2); p = [mix(2, 1, u), mix(-1, 0, u), mix(15, 13, u)]; l = [mix(0, 1, u), 0, 0]; up = [-u, 1 - u, 0]; }
  else if (n < 22) { u = (n - 16) / 6; p = [1, 0, mix(13.4, 12.4, u)]; l = [1, 0, 0]; up = [-1, 0, 0]; }
  else if (n < 26) { u = ease((n - 22) / 4) * .93 + .02; const c = PATH[0].userData.c, a = c.getPointAt(u), tan = c.getTangentAt(u); p = [a.x - tan.x * 1.0 - .18, a.y - tan.y * 1.0, a.z + .42]; l = [a.x + tan.x * .9, a.y + tan.y * .9, a.z + .02]; up = Z; fov = 58; }
  else if (n < 28) { u = (n - 26) / 2; p = [mix(4, 3.4, u), mix(2.6, 3.2, u), mix(4.6, 4, u)]; l = [1.5, 5, .2]; fov = 34; }
  else if (n < 30) { u = (n - 28) / 2; p = [mix(.1, .9, u), mix(2.4, 3.6, u), mix(4, 3.6, u)]; l = [1.5, 5, .2]; fov = 34; }
  else {
    // 之后都用「相对芯片中心」的坐标；世界绕芯片放大
    let r, tg;
    if (n < 33) { u = (n - 30) / 3; const e = easeIn(u); r = [mix(-.3, 0, u), mix(-1, -24, e), Math.exp(mix(Math.log(3.2), Math.log(170), e))]; tg = [0, 0, 0]; }
    else if (n < 34) { u = ease(n - 33); r = [mix(0, -4.4, u), mix(-24, -92, u), mix(170, 3.6, u)]; tg = [mix(0, -4.4, u), mix(0, -40, u), mix(0, 3, u)]; up = [0, 1 - u, u]; }
    else if (n < 38) { u = (n - 34) / 4; const sway = Math.sin(u * 5) * .9; r = [-4.4 + sway * .9, mix(-92, -2, u), mix(3.6, 2.2, u) + .15 * Math.sin(u * 7)]; tg = [-4.4 + sway * .4, mix(-82, 8, u), mix(3.2, 2.6, u)]; up = [Math.sin(sway * .06), 0, Math.cos(sway * .06)]; }
    else if (n < 42) { u = (n - 38) / 4; const sway = Math.sin(u * 4.4) * .8; r = [mix(-96, 66, u), 8.8 + sway, mix(3.4, 4.8, u)]; tg = [mix(-86, 76, u), 8.8 + sway * .5, mix(3.2, 5.5, u)]; up = [0, -Math.sin(sway * .06), Math.cos(sway * .06)]; }
    else { u = ease((n - 42) / 4.4); const hi = easeIn(u) * .45 + u * .55; r = [mix(66, 0, hi), mix(8.8, -30, hi), mix(4.8, 460, hi)]; tg = [mix(76, 0, u), mix(8.8, -16, u), mix(5.5, 0, u)]; up = [0, u, 1 - u]; }
    p = [D.x + r[0], D.y + r[1], D.z + r[2]]; l = [D.x + tg[0], D.y + tg[1], D.z + tg[2]]; fov = n < 34 ? 34 : n < 42 ? 60 : mix(60, 40, u);
  }
  const dist = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]), sh = k * Math.min(.03 * dist, .3);
  p = [p[0] + sh * Math.sin(t * 31), p[1] + sh * Math.sin(t * 23 + 1), p[2] + sh * .6 * Math.sin(t * 27 + 2)];
  camera.position.set(...p); camera.up.set(...up).normalize(); camera.lookAt(...l); camera.fov = fov * (1 - .035 * k);
  const s = world.scale.x; camera.near = Math.max(.02, s * .0008); camera.far = Math.max(120, s * 16); camera.updateProjectionMatrix();
  sky.position.copy(camera.position); sky.scale.setScalar(camera.far * .6);
}

// ── 机械动作 ──
function mech(n, t) {
  // 开场甩一圈，n8 定格；之后手机必须是单位变换（缩放以芯片为中心）
  const spin = n < 8 ? (1 - easeOut((n - 6) / 2)) * Math.PI * 2 : 0; phone.rotation.set(0, n >= 6 ? spin : 0, 0);
  const s = n < 30 ? 1 : Math.exp(mix(0, Math.log(CITY_S), ease((n - 30) / 3.6))); world.scale.setScalar(s); world.position.copy(D).multiplyScalar(1 - s);
  const out = n > 34 && n < 42.2; phone.visible = !out; floor.visible = n > 28;
  const hideParts = n >= 26;
  // 接缝灯 n8 跑一圈，n10.8 灭
  const sp = easeOut((n - 8) / 1); seam.visible = win(n, 8, 11); mid.visible = win(n, 9.4, 11);
  seam.geometry.setDrawRange(0, Math.floor(seam.userData.full * sp / 6) * 6); mid.geometry.setDrawRange(0, Math.floor(mid.userData.full * easeOut((n - 9.4) / .5) / 6) * 6);
  // n9 相机台弹起，n10 甩出画外
  const pl = clunk(n, 9, .55), pf = easeIn((n - 10) / .8); plate.position.set(-1.62 - pf * 3, 5.35 + pf * 22, .46 + pl * 2.2 + pf * 8); plate.rotation.set(pf * 1.6, pf * 2.2, pf * .8); plate.visible = n < 11;
  // n10.2 后盖抬起一点，n11 像闸门一样滑开
  const bl = clunk(n, 10.2, .4) * .22, bs = clunk(n, 11, .7) * 9.6; backL.position.set(-bs, 0, bl + easeIn((n - 11.5) / .5) * 2); backR.position.set(bs, 0, bl + easeIn((n - 11.5) / .5) * 2); backL.visible = backR.visible = n < 12.2;
  // n12 线圈板翻走
  const cu = clunk(n, 12, .6), cf = easeIn((n - 12.4) / .9); coilPlate.position.set(cf * -5, -2.2 - cf * 14, .34 + cu * 2.4 + cf * 6); coilPlate.rotation.set(cu * .55 + cf * 1.8, cf * -1.2, cf * .6); coilPlate.visible = n < 13.4;
  // n12.5 螺丝旋出，n13 盖板滑走
  for (const g of SCREWS) { const d = n - 12.45 - g.userData.k * .05, z = easeOut(d / .35), f = easeIn((d - .25) / .5); g.position.z = .36 + z * .5 + f * 8; g.rotation.z = z * 12; g.position.x = g.userData.x + f * (g.userData.k % 2 ? 6 : -6); g.visible = n < 13.7; }
  const cv = clunk(n, 13, .7) * 13; cover.position.y = cv; cover.visible = n < 14.5;
  // n18 电池外皮揭掉，n20 起充能
  const lf = easeOut((n - 18) / .9); lid.position.set(0, -lf * 14, .225 + lf * .4); lid.visible = n < 19;
  cellMat.uniforms.uFill.value = mix(.0, 1.02, ease((n - 18.2) / 3.6)); cellMat.uniforms.uT.value = t;
  word.visible = wordBack.visible = false;
  const cw = ease((n - 20) / .3) * (1 - ease((n - 21.6) / .35)); chipBox.visible = cw > .001; chipWord.visible = chipLead.visible = false;
  chipBack.visible = false; chipBox.children.forEach((m) => { m.material.opacity = cw; }); chipBox.scale.setScalar(mix(1.5, 1, easeOut((n - 20) / .4)));
  // n21.6 起电流沿路径走，乘着它进主板
  PATH.forEach((m, i) => { const u = ease((n - 21.8 - i * .2) / 4); m.visible = n > 21.6 && n < 33; m.geometry.setDrawRange(0, Math.floor(m.userData.full * u / 6) * 6); });
  // n28 屏蔽罩掀开，n30 封装盖像闸门一样分开
  can.rotation.x = -clunk(n, 28, .8) * 2.25;
  const pk = clunk(n, 30, .7) * .95; pkgL.position.x = D.x - .425 - pk; pkgR.position.x = D.x + .425 + pk;
  // n31.5 起整座城从硅面上长出来
  cityU.uGrow.value = mix(0, 1.25, ease((n - 31.6) / 3)); city.visible = n > 30; traffic.visible = n > 32;
  const lastW = lastHit(n, 34); cityU.uW.value = (n - lastW) * .34; cityU.uWa.value = n >= 34 ? Math.exp(-(n - lastW) * 1.2) : 0;
  SIGN.forEach((m, i) => { m.visible = win(n, 34, 42); const turn = n >= 38, [x, y] = turn ? SIGN2[i] : m.userData.a; m.position.set(x, y, .055); m.rotation.set(Math.PI / 2, 0, turn ? -Math.PI / 2 : 0); });
  AERIAL.forEach((m) => { const a = ease((n - 44) / .9); m.visible = m.userData.b.visible = a > .002; m.material.opacity = a; m.userData.b.material.opacity = a * .62; });
  glowA.intensity = 0;
  glowC.intensity = 0;
  key.intensity = n < 30 ? 2.6 : mix(2.6, 1.2, ease((n - 30) / 2)); key.castShadow = n < 30;
  scene.environmentRotation.set(.12 * Math.sin(t * .4), .35 * Math.sin(t * .22), 0); scene.environmentIntensity = n < 42 ? .9 : .5;
  const fog = n < 33.4 ? 0 : n < 42.2 ? .007 * ease((n - 33.4) / .6) : .007 * (1 - ease((n - 42.2) / 2.2)); scene.fog.density = fog; cityU.uFog.value = fog;
  sky.material.uniforms.uO.value = 1 - ease((n - 32) / 2); sky.material.uniforms.uH.value = ease((n - 33.6) / .6) * (1 - ease((n - 42) / 2)); dust.visible = n < 31;
}

// ── HUD ──
const hud = document.getElementById("hud");
hud.innerHTML = '<div class="note"></div>'; const note = hud.querySelector(".note");
const LABELS = [
  { t: "无线充电线圈", at: [0, -2.2, .4], a: 12.1, b: 12.95, dx: 340, dy: -190 },
  { t: "电池", at: [-.6, -2.2, .25], a: 16.1, b: 21.8, dx: -120, dy: -190 },
  { t: "相机模组", at: [-1.7, 5.2, .4], a: 16.6, b: 21.8, dx: -300, dy: 40 },
  { t: "主板", at: [2.6, 2.6, .12], a: 17, b: 21.8, dx: 170, dy: 90 },
  { t: "线性马达", at: [-1.6, -6.5, .2], a: 17.4, b: 21.8, dx: 170, dy: 30 },
  { t: "扬声器", at: [1.9, -6.5, .2], a: 17.8, b: 21.8, dx: 170, dy: -30 },
  { t: "芯片", at: [1.5, 5, .3], a: 20, b: 21.8, dx: 130, dy: 150 },
  { t: "屏蔽罩", at: [1.5, 5, .3], a: 26.3, b: 28.6, dx: 300, dy: -220 },
  { t: "封装盖", at: [1.1, 5, .22], a: 28.6, b: 30.6, dx: -380, dy: -240 },
].map((l) => { const line = document.createElement("div"), el = document.createElement("div"); line.className = "lead"; el.className = "lbl"; el.textContent = l.t; hud.append(line, el); return { ...l, line, el }; });
const _lb = new THREE.Vector3();
function labels(n) {
  for (const l of LABELS) {
    const o = clamp((n - l.a) / .3) * (1 - clamp((n - l.b + .25) / .25)); l.el.style.visibility = l.line.style.visibility = o > .002 ? "visible" : "hidden"; if (o <= .002) continue;
    _lb.set(...l.at).project(camera); const x = (_lb.x + 1) * 960, y = (1 - _lb.y) * 540, X = x + l.dx, Y = y + l.dy, len = Math.hypot(l.dx, l.dy), ang = Math.atan2(l.dy, l.dx);
    l.el.style.opacity = l.line.style.opacity = o.toFixed(3); l.el.style.transform = `translate(${(X - (l.dx < 0 ? l.el.offsetWidth : 0)).toFixed(1)}px,${(Y - 28).toFixed(1)}px)`;
    l.line.style.width = len.toFixed(1) + "px"; l.line.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${ang.toFixed(4)}rad)`;
  }
}
const caps = CAPS.map(([a, b, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>").replace(/<hc>/g, '<span class="hc">').replace(/<\/hc>/g, "</span>"); hud.appendChild(el); return { el, a, b }; });

function frame(t) {
  const n = t / BEAT, k = kick(n), sk = shake(n);
  mech(n, t); shot(n, t, sk); sparkState(n); dustState(t); if (n > 32) trafficState(t);
  const flash = Math.max(...[8, 16].map((h) => (n >= h ? Math.exp(-(n - h) * 7) * .025 : 0)), n >= 30 ? Math.exp(-(n - 30) * 7) * .03 : 0, ease((n - 33.6) / .35) * (1 - ease((n - 34) / .45)) * .025);
  const rush = win(n, 22, 26) ? .012 : win(n, 31, 34) ? .012 + .07 * easeIn((n - 31) / 3) : win(n, 34, 42) ? .004 : 0;
  fx.uniforms.uZoom.value = .008 * k + .03 * sk + rush; fx.uniforms.uAb.value = .0006 + .001 * k + .002 * sk; fx.uniforms.uFlash.value = flash; fx.uniforms.uSeed.value = Math.floor(t * 30) % 97;
  bloom.strength = .08; ao.enabled = n < 30 || n >= 35; setAO(n < 30 ? .32 : 1.6); composer.render();
  for (const c of caps) { const a = clamp((t - B(c.a)) / .1) * (1 - clamp((t - B(c.b) + .1) / .1)); c.el.style.opacity = a.toFixed(3); c.el.style.visibility = a > .002 ? "visible" : "hidden"; }
  labels(n);
  note.textContent = n >= 30 ? "结构为示意 · 城市是类比" : n >= 8 ? "结构为示意" : "";
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
