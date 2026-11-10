// 动态样片（约 26 秒）：验证「快节奏、炫技向」的方向，只做正片前 6 句。
// 一条驱动 tween；每帧状态都是拍 n 的纯函数，可任意跳帧。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { BEAT, DUR, END_N, CAPS, HITS, B } from "./beats.js";

await Promise.all(["900 200px NotoSerifSC", "900 200px NotoSC", "800 60px NotoSC", "600 36px NotoSC"].map((f) => document.fonts.load(f, "害怕产品再不学淘汰")));

// ── 纯函数工具 ──
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a, b, p) => a + (b - a) * p;
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => { x = clamp(x); return 1 - (1 - x) ** 4; };
const easeIn = (x) => { x = clamp(x); return x * x * x; };
const ramp = (n, a, d) => ease((n - a) / d);
const win = (n, a, b) => n >= a && n < b;
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
/** 过了重击点之后的衰减，叠加最近一次 */
function kick(n, rate = 4.5) { let k = 0; for (const h of HITS) if (n >= h) k = Math.max(k, Math.exp(-(n - h) * rate)); return k; }
/** 落下：从 big 倍猛地缩到 1 */
const slamS = (n, at, big = 2.6, d = .32) => mix(big, 1, easeOut((n - at) / d));

// ── 渲染器 ──
const W = 1920, H = 1080, canvas = document.getElementById("gl");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NeutralToneMapping;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x020102);
const camera = new THREE.PerspectiveCamera(36, W / H, .05, 400);
scene.add(new THREE.HemisphereLight(0xffe7d0, 0x200806, 1.4));
const key = new THREE.DirectionalLight(0xfff0dd, 3); key.position.set(-5, 7, 9); scene.add(key);
const redL = new THREE.PointLight(0xff3020, 20, 40); redL.position.set(0, 0, 2.5); scene.add(redL);

const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), .5, .45, .92); composer.addPass(bloom);
// 径向模糊 ＋ 色散 ＋ 闪白：冲击感都在这一层，由 kick 驱动
const fx = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uZoom: { value: 0 }, uAb: { value: 0 }, uFlash: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uZoom,uAb,uFlash; varying vec2 vUv;
    void main(){ vec2 d=vUv-.5; vec3 c=vec3(0.); float w=0.;
      for(int i=0;i<12;i++){ float s=1.-uZoom*float(i)/11.; float g=1.-float(i)/14.;
        c.r+=texture2D(tDiffuse,.5+d*s*(1.+uAb)).r*g; c.g+=texture2D(tDiffuse,.5+d*s).g*g; c.b+=texture2D(tDiffuse,.5+d*s*(1.-uAb)).b*g; w+=g; }
      c/=w; float v=smoothstep(.95,.3,length(d)); gl_FragColor=vec4(c*mix(.55,1.,v)+vec3(uFlash),1.); }`,
});
composer.addPass(fx); composer.addPass(new OutputPass());

// ── 文字贴图 ──
function textTex(str, { size = 300, color = "#fff", font = "NotoSerifSC", weight = 900, pad = 40, stroke = null } = {}) {
  const c = document.createElement("canvas"), g = c.getContext("2d");
  g.font = `${weight} ${size}px ${font}`;
  c.width = Math.ceil(g.measureText(str).width + pad * 2); c.height = Math.ceil(size * 1.3 + pad);
  g.font = `${weight} ${size}px ${font}`; g.textAlign = "center"; g.textBaseline = "middle";
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = size * .06; g.strokeText(str, c.width / 2, c.height / 2); }
  g.fillStyle = color; g.fillText(str, c.width / 2, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return { t, aspect: c.width / c.height };
}
function textPlane(str, height, o = {}) {
  const { t, aspect } = textTex(str, o);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(height * aspect, height), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
  m.visible = false; scene.add(m); return m;
}
/** 假挤出：一叠逐层变暗的文字，转起来有厚度 */
function extruded(str, height, layers, front, back) {
  const g = new THREE.Group();
  for (let i = layers - 1; i >= 0; i--) {
    const u = i / (layers - 1), col = i === 0 ? front : back;
    const m = textPlane(str, height, { color: col, size: 420 }); scene.remove(m); m.visible = true;
    m.position.z = -i * height * .012; if (i) m.material.color.setScalar(mix(.9, .25, u));
    g.add(m);
  }
  g.visible = false; scene.add(g); return g;
}
/** 把文字采样成点（确定性），粒子变形用 */
function sampleText(str, count, worldH) {
  const size = 360, c = document.createElement("canvas"), g = c.getContext("2d", { willReadFrequently: true });
  g.font = `900 ${size}px NotoSerifSC`; c.width = Math.ceil(g.measureText(str).width + 40); c.height = Math.ceil(size * 1.3);
  g.font = `900 ${size}px NotoSerifSC`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#fff"; g.fillText(str, c.width / 2, c.height / 2);
  const d = g.getImageData(0, 0, c.width, c.height).data, pts = [];
  for (let y = 0; y < c.height; y += 3) for (let x = 0; x < c.width; x += 3) if (d[(y * c.width + x) * 4 + 3] > 128) pts.push([x, y]);
  const k = worldH / c.height, out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { const p = pts[Math.floor(hash(i + 1.7) * pts.length)]; out[i * 3] = (p[0] - c.width / 2) * k; out[i * 3 + 1] = (c.height / 2 - p[1]) * k; out[i * 3 + 2] = (hash(i * 3.1) - .5) * .25; }
  return out;
}

// ── 粒子：害怕 → 产品 → 收成一点 ──
const NP = 14000, PA = sampleText("害怕", NP, 8.4), PB = sampleText("产品", NP, 8.4);
const pGeo = new THREE.BufferGeometry(), pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3);
pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
const dotC = document.createElement("canvas"); dotC.width = dotC.height = 32;
{ const g = dotC.getContext("2d"), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "#fff"); r.addColorStop(.5, "rgba(255,255,255,.75)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); }
const pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: .13, map: new THREE.CanvasTexture(dotC), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
pts.frustumCulled = false; scene.add(pts);
function particles(n) {
  pts.visible = win(n, 3.3, 8.5); if (!pts.visible) return;
  for (let i = 0; i < NP; i++) {
    const h = hash(i * .37), h2 = hash(i * 1.13), a = h2 * Math.PI * 2;
    const inU = easeOut((n - 3.4 - h * .35) / .75), mU = ease((n - 5.5 - h * .55) / 1.05), outU = easeIn((n - 7.35 - h * .3) / .75);
    let x = mix(PA[i * 3], PB[i * 3], mU), y = mix(PA[i * 3 + 1], PB[i * 3 + 1], mU), z = mix(PA[i * 3 + 2], PB[i * 3 + 2], mU);
    // 变形途中炸开打旋
    const sw = Math.sin(mU * Math.PI), R = sw * (2.5 + 5 * h), ang = a + mU * 5;
    x += R * Math.cos(ang); y += R * Math.sin(ang) * .7; z += sw * 7 * (h2 - .35);
    // 入场：从四周飞来
    const far = 1 - inU; x += far * 22 * Math.cos(a); y += far * 14 * Math.sin(a); z -= far * 14;
    // 收成一点
    x *= 1 - outU; y *= 1 - outU; z *= 1 - outU;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    const hot = clamp(mU * 1.2), white = clamp(sw * 1.4);
    pCol[i * 3] = mix(1, 1, hot) * 1.25; pCol[i * 3 + 1] = mix(.14, .86, hot) + white * .35; pCol[i * 3 + 2] = mix(.09, .66, hot) + white * .2;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}

// ── 3D 报警器：零件飞来组装 ──
const alarm = new THREE.Group(); scene.add(alarm);
const cream = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: .42, metalness: .1 });
const steel = new THREE.MeshStandardMaterial({ color: 0x9a938a, roughness: .28, metalness: .92 });
const dark = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .6, metalness: .4 });
const ledM = new THREE.MeshStandardMaterial({ color: 0xff2a1c, emissive: 0xff2010, emissiveIntensity: 7, roughness: .3 });
const part = (geo, mat, rotX = Math.PI / 2) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = rotX; const g = new THREE.Group(); g.add(m); alarm.add(g); return g; };
const PARTS = [
  part(new THREE.CylinderGeometry(2.4, 2.55, .45, 96), cream),
  part(new THREE.TorusGeometry(2.42, .1, 24, 128), steel, 0),
  part(new THREE.CylinderGeometry(1.72, 1.72, .12, 96), dark),
  part(new THREE.TorusGeometry(1.72, .07, 20, 128), steel, 0),
  part(new THREE.CylinderGeometry(.82, .92, .3, 64), steel),
  part(new THREE.SphereGeometry(.56, 48, 32), ledM, 0),
];
PARTS[0].position.z = 0; PARTS[1].userData.z = .24; PARTS[2].userData.z = .28; PARTS[3].userData.z = .36; PARTS[4].userData.z = .42; PARTS[5].userData.z = .55;
const VENTS = [];
for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(2.06, .1, 12, 32, 1.28), dark); m.rotation.z = i / 6 * Math.PI * 2 + .2; const g = new THREE.Group(); g.add(m); alarm.add(g); VENTS.push(g); g.userData.z = .28; }
const ALL = [...PARTS, ...VENTS];
function alarmState(n, t) {
  const on = win(n, 7.6, 21.2) || win(n, 41, END_N);
  alarm.visible = on; if (!on) return;
  ALL.forEach((g, i) => {
    const s = 8.1 + i * .34, u = easeOut((n - s) / 1.5), a = hash(i + 3) * 6.28, far = (1 - u);
    g.position.set(far * 11 * Math.cos(a), far * 8 * Math.sin(a), (g.userData.z || 0) + far * (hash(i + 9) * 18 - 9));
    g.rotation.set(far * 5 * hash(i), far * 7 * hash(i + 1), far * 4);
    g.visible = n > s - .05 || n >= 41;
  });
  const beat = Math.exp(-((n % 1) * 3.4));
  ledM.emissiveIntensity = n < 14 ? 1.6 : 1.8 + 3.2 * beat + 7 * ramp(n, 19.6, 1.3);
  redL.intensity = n < 14 ? 0 : 12 + 34 * beat;
  // 组装时狂转，到 n14 砸定
  const spin = (1 - ease((n - 8) / 6)) * 9;
  alarm.rotation.set(.18 * Math.sin(t * .9) * ramp(n, 14, 2), spin + .3 * Math.sin(t * .7) * ramp(n, 14, 2), spin * .35);
  const sc = n < 41 ? slamS(n, 14, 1.28, .3) : .34;
  alarm.scale.setScalar(sc);
  alarm.position.set(n < 41 ? 0 : 0, n < 41 ? 0 : -3.5, n < 41 ? 0 : 2);
}
// 冲击波环
const RINGS = Array.from({ length: 5 }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .035, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .3, .2), transparent: true, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); return m; });
const RING_AT = [14, 16, 18, 20, 24];
function rings(n) { RINGS.forEach((m, i) => { const d = n - RING_AT[i]; m.visible = d >= 0 && d < 1.6; if (!m.visible) return; const u = easeOut(d / 1.6); m.scale.setScalar(2.6 + 13 * u); m.material.opacity = (1 - u) ** 1.5; m.position.z = i === 4 ? 0 : -1; }); }

// 开场的红灯：报警器组装前，黑场里只有它
const blink = new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, .35, .22), toneMapped: false })); scene.add(blink);
const RING0 = RINGS.slice(0, 2);
function opening(n) {
  blink.visible = n < 2.1; if (!blink.visible) return;
  const b = Math.exp(-((n % 1) * 2.6)); blink.scale.setScalar(.8 + .9 * b); blink.material.color.setRGB(.5 + 2.4 * b, .08 + .3 * b, .05 + .2 * b);
  RING0.forEach((m, i) => { const d = n - i; m.visible = d >= 0 && d < 1.4; if (!m.visible) return; const u = easeOut(d / 1.4); m.scale.setScalar(.6 + 8 * u); m.material.opacity = (1 - u) ** 1.5; m.position.z = 0; });
}

// ── 大字 ──
const wYimen = textPlane("一门生意", 3.4, { color: "#ffe8c4", size: 300 });
const wBaojing = textPlane("报警器", 6.2, { color: "#ff3b2a", size: 420 });
const wAI = extruded("AI", 13, 14, "#fff6e6", "#ff3322");
const wZai = textPlane("再不学，", 4.2, { color: "#fff4dc", size: 380 });
const wTao = textPlane("就要被淘汰了", 3.5, { color: "#ff3b2a", size: 380, stroke: "#200" });
const wL1 = textPlane("担心被 AI 抢走工作", 1.1, { color: "#ffe9c9", font: "NotoSC", size: 160 });
const wL2 = textPlane("担心被更懂 AI 的人替代", 1.25, { color: "#ffffff", font: "NotoSC", size: 170 });

// ── 数字：54.3 被切成碎块，62.0 撞碎它 ──
function numberTex(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, g: c.getContext("2d"), t, last: null }; }
function drawNum(o, str, color, glowC) {
  if (o.last === str) return; o.last = str;
  const { c, g } = o; g.clearRect(0, 0, c.width, c.height); g.font = "900 470px NotoSerifSC"; g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = glowC; g.shadowBlur = 40; g.fillStyle = color; g.fillText(str, c.width / 2, c.height / 2 + 10); g.shadowBlur = 0; o.t.needsUpdate = true;
}
const N54 = numberTex(1500, 640), TX = 10, TY = 5, TILES = [], NW = 16, NH = NW * 640 / 1500;
const g54 = new THREE.Group(); scene.add(g54);
const tileMat = new THREE.MeshBasicMaterial({ map: N54.t, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
for (let y = 0; y < TY; y++) for (let x = 0; x < TX; x++) {
  const geo = new THREE.PlaneGeometry(NW / TX, NH / TY), uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i)) / TX, (TY - 1 - y + uv.getY(i)) / TY);
  const m = new THREE.Mesh(geo, tileMat), hx = (x + .5) * NW / TX - NW / 2, hy = NH / 2 - (y + .5) * NH / TY;
  m.userData = { hx, hy, k: TILES.length }; g54.add(m); TILES.push(m);
}
const N62 = numberTex(1500, 640);
const p62 = new THREE.Mesh(new THREE.PlaneGeometry(NW, NH), new THREE.MeshBasicMaterial({ map: N62.t, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); scene.add(p62);

// ── 隧道：一圈圈红环 ＋ 速度线 ──
const TUN = Array.from({ length: 26 }, (_, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(9, i % 4 === 0 ? .1 : .035, 8, 72), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 4 === 0 ? 1.5 : .75, i % 4 === 0 ? .16 : .06, i % 4 === 0 ? .1 : .04), transparent: true, depthWrite: false, toneMapped: false })); scene.add(m); return m; });
const STREAK = new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .03, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.05, .85), transparent: true, opacity: .8, toneMapped: false }), 70);
STREAK.frustumCulled = false; scene.add(STREAK);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
/** 隧道走了多远：速度分段，积分结果只取决于 n */
const tunV = (n) => 9 * ramp(n, 20.5, 1) - 7.6 * ramp(n, 24, .6) + 1.5 * 0 + 12 * ramp(n, 31, .5) * (1 - ramp(n, 36, .3)) + 5 * ramp(n, 38, 2);
function tunZ(n) { let s = 0; for (let x = 20; x < n; x += .1) s += tunV(x) * Math.min(.1, n - x); return s; }
function tunnel(n) {
  const on = win(n, 20.4, 42.5), fade = ramp(n, 20.4, .7) * (1 - ramp(n, 41, 1.4)), z = tunZ(n), L = 130, gap = L / TUN.length;
  TUN.forEach((m, i) => { m.visible = on; if (!on) return; const d = ((i * gap + z) % L); m.position.set(0, 0, -120 + d); m.material.opacity = fade * clamp((d) / 30) * clamp((L - d) / 8 + .2); });
  STREAK.visible = on; if (!on) return;
  const v = tunV(n), len = 1 + v * 2.4;
  for (let i = 0; i < 70; i++) {
    const a = hash(i) * 6.283, r = 3.5 + 5 * hash(i + 70), d = (hash(i + 140) * L + z * 1.6) % L;
    _p.set(r * Math.cos(a), r * Math.sin(a), -120 + d); _s.set(1, 1, len * fade + .001); _m.compose(_p, _q.identity(), _s); STREAK.setMatrixAt(i, _m);
  }
  STREAK.instanceMatrix.needsUpdate = true; STREAK.material.opacity = fade * clamp(v / 6);
}

// ── 价签风暴 ──
const tagC = document.createElement("canvas"); tagC.width = 620; tagC.height = 330;
{ const g = tagC.getContext("2d"); g.fillStyle = "#b8180f"; g.beginPath(); g.moveTo(90, 0); g.lineTo(620, 0); g.lineTo(620, 330); g.lineTo(90, 330); g.lineTo(0, 165); g.closePath(); g.fill(); g.fillStyle = "#f2e6cc"; g.beginPath(); g.arc(62, 165, 22, 0, 7); g.fill(); g.fillStyle = "#fff4dc"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 68px NotoSerifSC"; g.fillText("限时课程", 350, 108); g.font = "900 104px NotoSerifSC"; g.fillText("¥ ???", 350, 226); }
const tagT = new THREE.CanvasTexture(tagC); tagT.colorSpace = THREE.SRGBColorSpace; tagT.anisotropy = 8;
const TAGS = Array.from({ length: 30 }, () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.24), new THREE.MeshBasicMaterial({ map: tagT, transparent: true, side: THREE.DoubleSide, toneMapped: false, alphaTest: .05 })); m.visible = false; scene.add(m); return m; });
function tags(n) {
  TAGS.forEach((m, i) => {
    const s = 41 + hash(i + 5) * 6, d = n - s; m.visible = d > 0 && n < END_N; if (!m.visible) return;
    const u = d / 3.4, a = hash(i) * 6.283 + u * 2.2, r = 6 + 7 * hash(i + 2) * (1 - u * .1);
    m.position.set(r * 1.4 * Math.cos(a), r * .85 * Math.sin(a), mix(-34, 19, easeIn(clamp(u)) * .5 + clamp(u) * .5));
    m.rotation.set(u * 5 * (hash(i + 3) - .5), u * 6 * (hash(i + 4) - .5), a);
  });
}

// ── 机位 ──
function shot(n, t, k) {
  let pos, tgt = [0, 0, 0], fov = 36, roll = 0;
  if (n < 3.5) pos = [0, 0, 14];
  else if (n < 8) pos = [.6 * Math.sin(n * 1.2), .3 * Math.cos(n), mix(19, 15, ease((n - 3.5) / 4.5))];
  else if (n < 14) { const a = (n - 8) / 6 * Math.PI * 2.5 * (1 - .22 * ease((n - 8) / 6)); const r = mix(9, 14, ramp(n, 8, 5)); pos = [r * Math.sin(a), 3.4 * Math.cos(a * .8), r * Math.cos(a)]; roll = .4 * (1 - ease((n - 8) / 6)); }
  else if (n < 19.6) { const a = .32 * Math.sin((n - 14) * .55); pos = [13 * Math.sin(a), 1.2 * Math.cos(n * .5), mix(13.5, 11, (n - 14) / 5.6)]; }
  else if (n < 21) { const u = easeIn((n - 19.6) / 1.4); pos = [0, 0, mix(11, .9, u)]; }
  else if (n < 31) { pos = [.8 * Math.sin(n * .5), .4 * Math.cos(n * .7), 15]; roll = .05 * Math.sin(n * .6); }
  else if (n < 33) { const u = ease((n - 31) / 1.5); pos = [mix(0, 6, u), mix(0, -1.5, u), mix(15, 21, u)]; roll = -.5 * u; tgt = [mix(0, -2, u), 0, 0]; }
  else if (n < 38) { const u = ease((n - 36) / .6); pos = [mix(6, 0, u), mix(-1.5, 0, u), mix(21, 15, u)]; roll = mix(-.5, .03, u); tgt = [mix(-2, 0, u), 0, 0]; }
  else if (n < 41) { pos = [.5 * Math.sin(n), .3 * Math.cos(n * 1.3), mix(15, 13.5, (n - 38) / 3)]; roll = .03; }
  else { pos = [1.2 * Math.sin(n * .8), .6 * Math.cos(n * .6), 17]; roll = .05 * Math.sin(n * .9); }
  // 手持抖动：只在重击后，随 kick 衰减
  const sh = k * .32; pos[0] += sh * Math.sin(t * 61); pos[1] += sh * Math.sin(t * 47 + 1);
  camera.position.set(...pos); camera.up.set(Math.sin(roll), Math.cos(roll), 0); camera.lookAt(...tgt);
  camera.fov = fov * (1 - .1 * k); camera.updateProjectionMatrix();
}

// ── HUD ──
const hud = document.getElementById("hud");
hud.innerHTML = '<div class="note"></div>'; const note = hud.querySelector(".note");
const caps = CAPS.map(([a, b, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>"); hud.appendChild(el); return { el, a, b }; });

function place(m, on, x, y, z, s, rz = 0, op = 1) { m.visible = on; if (!on) return; m.position.set(x, y, z); m.scale.setScalar(s); m.rotation.set(0, 0, rz); if (m.material) m.material.opacity = op; }

function frame(t) {
  const n = t / BEAT, k = kick(n);
  shot(n, t, k); particles(n); alarmState(n, t); rings(n); opening(n); tunnel(n); tags(n);
  // 一门生意：迎面飞来穿过镜头
  { const u = (n - 2) / 1.5; place(wYimen, win(n, 2, 3.5), 0, 0, mix(-40, 14.4, easeIn(u) * .55 + clamp(u) * .45), 1); }
  // 报警器：n12 砸在后面
  place(wBaojing, win(n, 12, 16.2), 0, 0, -5, slamS(n, 12, 2.2, .3), 0, 1 - ramp(n, 15.6, .6));
  // AI：n16 砸下，每拍晃一下，冲进红灯时甩到后面
  wAI.visible = win(n, 16, 21); if (wAI.visible) { wAI.position.set(0, 0, -7); wAI.scale.setScalar(slamS(n, 16, 2.4, .3) * (1 + .03 * Math.exp(-((n % 1) * 4)))); wAI.rotation.set(.1 * Math.sin(t * 1.1), .36 * Math.sin((n - 16) * .7), 0); }
  // 54.3：飞来 → 停住 → n31 退到一边 → n36 被撞碎
  const roll54 = 54.3 * easeOut((n - 21.4) / 3.2), g54On = win(n, 21, 39.5);
  g54.visible = g54On;
  if (g54On) {
    drawNum(N54, roll54.toFixed(1) + "%", "#fff4dc", "#ff5a30");
    const inU = easeOut((n - 21) / 3), back = ease((n - 31) / 1.5);
    g54.position.set(mix(0, -1, back), mix(.4, .8, back), mix(-90, 0, inU) + mix(0, -5, back));
    g54.scale.setScalar(.92 * slamS(n, 24, 1.1, .25)); g54.rotation.set(0, 0, 0);
    const br = n - 36;
    TILES.forEach((m) => { const { hx, hy, k: i } = m.userData, sp = br > 0 ? br : 0, ax = hash(i) - .5, ay = hash(i + 50) - .5;
      m.position.set(hx + sp * (hx * 1.4 + ax * 9), hy + sp * (hy * 1.4 + ay * 9) - sp * sp * .5, sp * (10 + 12 * hash(i + 90)));
      m.rotation.set(sp * ax * 7, sp * ay * 7, sp * (ax - ay) * 5); });
    tileMat.opacity = 1 - ramp(n, 38.2, 1.2);
  }
  // 62.0：n33 从远处滚数字冲来，n36 撞穿，砸在正中
  const p62On = win(n, 33, 42);
  p62.visible = p62On;
  if (p62On) {
    const u = easeIn((n - 33) / 3);
    drawNum(N62, (n < 36 ? 62 * clamp((n - 33) / 3) : 62).toFixed(1) + "%", "#ff4a33", "#ff2010");
    p62.position.set(0, .5, n < 36 ? mix(-110, 0, u) : 0);
    p62.scale.setScalar((n < 36 ? .92 : .92 * slamS(n, 36, 1.3, .3)) * mix(1, 1.04, ramp(n, 36.3, 4)));
    p62.material.opacity = 1 - ramp(n, 41, .9);
  }
  place(wL1, win(n, 24, 31.4), 0, -3.6, 1, slamS(n, 24, 1.8, .3), 0, 1 - ramp(n, 31, .4));
  place(wL2, win(n, 37, 41.8), 0, -3.6, 1, slamS(n, 37, 1.8, .3), 0, 1 - ramp(n, 41, .7));
  // 再不学，就要被淘汰了
  place(wZai, win(n, 45, END_N), 0, 2.2, 2, slamS(n, 45, 3, .3), -.02);
  place(wTao, win(n, 47, END_N), 0, -1.7, 2.4, slamS(n, 47, 3, .3), .012);

  // 后期
  const flashHit = Math.max(n >= 36 ? Math.exp(-(n - 36) * 6) * .6 : 0, n >= 24 ? Math.exp(-(n - 24) * 7) * .35 : 0, n >= 14 ? Math.exp(-(n - 14) * 7) * .4 : 0, ramp(n, 20.5, .5) * (1 - ramp(n, 21, .4)) * .55, ramp(n, END_N - .6, .5) * 2);
  fx.uniforms.uZoom.value = .13 * k + (win(n, 20.5, 23.5) ? .1 : 0) + (win(n, 33, 36) ? .1 * easeIn((n - 33) / 3) : 0) + .04 * clamp(tunV(n) / 12);
  fx.uniforms.uAb.value = .003 + .02 * k;
  fx.uniforms.uFlash.value = flashHit;
  bloom.strength = .42 + .38 * k;
  composer.render();

  for (const c of caps) { const a = ramp(t, B(c.a), .1) * (1 - ramp(t, B(c.b) - .1, .1)); c.el.style.opacity = a.toFixed(3); c.el.style.visibility = a > .002 ? "visible" : "hidden"; }
  note.textContent = win(n, 21, 41) ? "腾讯调研 × 复旦大学 · 两轮共 27,115 份 · 据媒体报道" : win(n, 41, END_N) ? "广告语与价签均为虚构示意" : "";
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
