// 宇宙布局：中心＝Transformer（2017），离中心越远＝发布越晚；同一家族排在同一个方位角附近。
// 只画调研档案里有据可查的东西：83 颗星（universe-data.js）、C 表的光丝、D 表的星尘浓度。
import { PLANETS, THREADS, DUST } from "./universe-data.js";
import { rng, glowMat } from "./world.js";
import * as B from "./bodies.js";

const D2R = Math.PI / 180;
// 家族方位角（度）与颜色暗示（品牌色或名字联想；不贴 logo）
export const FAM = {
  origin: [0, 0xffffff], sesame: [35, 0xffd27a], google: [20, 0x8fb4ff], anthropic: [55, 0xd97757], kimi: [88, 0xdfe6ff],
  mistral: [115, 0xff9a30], xai: [140, 0xe2704a], zhipu: [158, 0x5d8cff], baidu: [168, 0x4a74e8], tencent: [178, 0x58a6ff],
  bytedance: [188, 0x4fd1c5], minimax: [198, 0xff6f6f], qwen: [214, 0x4a6bff], deepseek: [238, 0x4d8cff], meta: [260, 0x2f95ff],
  openai: [292, 0xe8ecf4], phi: [318, 0x6fd6ff], others: [336, 0xb8b8c8],
};
export const radius = (y) => 10 + (y - 2017.4) * 9.5;
const at = (deg, r, h) => [Math.cos(deg * D2R) * r, h, Math.sin(deg * D2R) * r];
const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return Math.abs(h); };

// 主角的位置（手放，配合机位路线；角度沿用家族方位）
export const HERO = {
  gemini: at(20, 90, 3), trio: at(43, 92, -2), mythos: at(56, 95, 2), fable: at(61, 96.5, -0.5), kimi: at(75, 96, 4),
  mistral: at(115, 92, -3), grok: at(140, 95, 4), qwen: at(212, 94, -2), deepseek: at(236, 90, 3), llama: at(258, 82, -3),
  muse: at(263, 96, 1), gpt: at(292, 95, 0),
};
// 这些 id 由主角星球代表，不再画小星
const HERO_ID = { fable51: "fable", "mythos-prev": "mythos", opus55: "trio", gemini3: "gemini", k3: "kimi", mlarge3: "mistral", grok46: "grok",
  qwen38: "qwen", dsv4: "deepseek", llama4: "llama", muse: "muse", gpt6: "gpt", gpt56: "gpt", gpt61: "gpt" };

export async function buildUniverse(W) {
  const { THREE, scene } = W;
  const pos = {};                                     // id → [x,y,z]
  for (const p of PLANETS) {
    if (HERO_ID[p.id]) { pos[p.id] = HERO[HERO_ID[p.id]]; continue; }
    if (p.fam === "origin") { pos[p.id] = [0, 0, 0]; continue; }
    const r = rng(hash(p.id));
    pos[p.id] = at(FAM[p.fam][0] + (r() - 0.5) * 14, radius(p.y) + (r() - 0.5) * 4, (r() - 0.5) * 10);
  }

  // 小星：非主角的模型，面向镜头的发光点；大小按档（A 大、B 中、C 小）
  const stars = [];
  for (const p of PLANETS) {
    if (HERO_ID[p.id]) continue;
    const s = p.fam === "origin" ? 5 : { A: 2.4, B: 1.7, C: 1.1 }[p.tier];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), glowMat(W, FAM[p.fam][1], { kind: p.tier === "A" ? 1 : 0, k: 0.9 }));
    m.position.set(...pos[p.id]); scene.add(m);
    stars.push({ m, p, base: 0.9 });
  }

  // 星云：每个家族几团很淡的大光雾，围着成员的重心
  const gas = [];
  const fams = Object.keys(FAM).filter((f) => f !== "origin");
  for (const f of fams) {
    const mem = PLANETS.filter((p) => p.fam === f).map((p) => pos[p.id]);
    if (!mem.length) continue;
    const c = mem.reduce((a, b) => [a[0] + b[0] / mem.length, a[1] + b[1] / mem.length, a[2] + b[2] / mem.length], [0, 0, 0]);
    const r = rng(hash("gas" + f));
    // 光雾亮度随星尘（HF 衍生数）走：开放的家族「热闹」、闭源主线暗；只做相对浓淡，不对应具体数字
    const kd = 0.035 + 0.11 * Math.sqrt((DUST[f] || 0) / DUST.qwen);
    for (let i = 0; i < 3; i++) {
      const s = 26 + r() * 18;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { c: { value: new THREE.Color(FAM[f][1]) }, k: { value: 0.07 } },
        vertexShader: "varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: "uniform vec3 c;uniform float k;varying vec2 u;void main(){float r=length(u);float i=exp(-r*r*3.)*k*smoothstep(1.,.6,r);gl_FragColor=vec4(c*i,1.);}",
      }));
      m.position.set(c[0] + (r() - 0.5) * 12, c[1] + (r() - 0.5) * 6, c[2] + (r() - 0.5) * 12);
      scene.add(m); gas.push({ m, f, s, kd });
    }
  }

  // 星尘：只围着「开放权重」的成员（闭源主线周围保持干净），数量随 HF 衍生数的平方根增长
  const dust = {};
  const pv = new THREE.Vector3();
  for (const [f, n] of Object.entries(DUST)) {
    const owners = PLANETS.filter((p) => p.fam === f && p.open);
    if (!owners.length) continue;
    const N = Math.round(Math.sqrt(n) * (f === "qwen" || f === "meta" ? 48 : 30));
    const r = rng(hash("dust" + f));
    const base = new Float32Array(N * 3), dir = new Float32Array(N * 3), cur = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const o = pos[owners[Math.floor(r() * owners.length)].id];
      // 近似高斯散布：中心密、外圈稀
      const g = () => (r() + r() + r() - 1.5) * 2;
      const sp = f === "qwen" || f === "meta" ? 6.5 : 4.5;
      const d = [g() * sp, g() * sp * 0.5, g() * sp];
      base.set([o[0] + d[0], o[1] + d[1], o[2] + d[2]], i * 3);
      pv.set(d[0], d[1], d[2]).normalize();
      dir.set([pv.x, pv.y, pv.z], i * 3);
    }
    cur.set(base);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(cur, 3));
    const col = new THREE.Color(FAM[f][1]).lerp(new THREE.Color(0xffffff), 0.45);
    // 圆形柔光点（PointsMaterial 是方块，离镜头近了会变成大方块）；像素尺寸有上限
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { c: { value: col }, opacity: { value: 0.85 }, edge: { value: 1e4 } },   // edge：倒带/重新点亮的半径（film.js）
      vertexShader: "uniform float edge;varying float vv;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vv=clamp((edge-length(position.xz))/6.+.5,0.,1.);gl_PointSize=clamp(240./-mv.z,1.8,8.);gl_Position=projectionMatrix*mv;}",
      fragmentShader: "uniform vec3 c;uniform float opacity;varying float vv;void main(){float r=length(gl_PointCoord-.5)*2.;float a=smoothstep(1.,.0,r);gl_FragColor=vec4(c*a*opacity*vv,1.);}",
    });
    Object.defineProperty(mat, "opacity", { set(v) { mat.uniforms.opacity.value = v; }, get() { return mat.uniforms.opacity.value; } });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    dust[f] = { pts, base, dir, cur, geo, mat, N };
  }

  // 光丝：C 表里有据可查的关系（到「其他公司」的那根不画）
  const threads = THREADS.filter(([a, b]) => pos[a] && pos[b]).map(([a, b, type]) => {
    const A = new THREE.Vector3(...pos[a]), Bv = new THREE.Vector3(...pos[b]);
    const mid = A.clone().add(Bv).multiplyScalar(0.5); mid.y += A.distanceTo(Bv) * 0.12;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, Bv);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(80));
    const mat = new THREE.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
    const line = new THREE.Line(geo, mat); scene.add(line);
    return { a, b, type, line, mat, r: Math.max(Math.hypot(A.x, A.z), Math.hypot(Bv.x, Bv.z)) };   // r：两端都亮了才画
  });

  // 主角星球
  const hero = {};
  const put = (k, obj) => { obj.g.position.set(...HERO[k]); scene.add(obj.g); hero[k] = obj; };
  put("fable", await B.basic(W, "fable", { R: 1.2, atm: 0xf2a679, spin: 0.1 }));
  put("mythos", await B.mythos(W, { R: 1.15 }));
  put("trio", await B.trio(W));
  { const a = 43 * D2R; hero.trio.g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); }   // 局部 x＝沿环逆时针的切向：从内侧往外看，小→大从左到右排开
  put("gemini", await B.gemini(W));
  const kimiSun = new THREE.Vector3(...HERO.kimi).normalize().multiplyScalar(-1).add(new THREE.Vector3(0, 0.15, 0)).normalize(); // 太阳在宇宙中心那一侧
  put("kimi", await B.kimi(W, { R: 1.05, sun: kimiSun }));
  put("mistral", await B.basic(W, "mistral", { R: 1.3, atm: 0xffb040, spin: 0.09 }));
  put("grok", await B.basic(W, "grok", { R: 1.0, atm: 0xffb08a, spin: 0.1 }));
  put("qwen", await B.basic(W, "qwen", { R: 1.25, atm: 0x7f95ff, spin: 0.1 }));
  put("deepseek", await B.deepseek(W, { R: 1.1 }));
  put("llama", await B.basic(W, "llama", { R: 1.15, atm: 0x7fbfff, spin: 0.11 }));
  put("muse", B.muse(W, { R: 0.75 }));
  const gpt = await B.gptSystem(W);
  { const a = 292 * D2R; gpt.g.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a)); }   // 局部 -z（Sol、Astra 方向）朝宇宙外侧
  put("gpt", gpt);

  // 大爆炸：中心闪光＋向外扫过整片宇宙的光环＋八道光流（射向空旷处，不指向任何一家）
  const bangU = { k: { value: 0 }, r: { value: 0 } };
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: bangU,
    vertexShader: "varying vec2 u;void main(){u=uv*2.-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform float k;varying vec2 u;void main(){float r=length(u);float i=exp(-pow((r-.92)/.035,2.))*k+exp(-r*4.)*k*.25;gl_FragColor=vec4(vec3(1.,.95,.85)*i,1.);}",
  }));
  ring.rotation.x = -Math.PI / 2; scene.add(ring);
  const flash = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), glowMat(W, 0xfff6e8, { kind: 1, k: 0 })); scene.add(flash);
  const streams = [];
  { const r = rng(2017);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 360 + 22 + (r() - 0.5) * 20, el = (r() - 0.5) * 0.35;
      const end = new THREE.Vector3(Math.cos(a * D2R) * Math.cos(el), Math.sin(el), Math.sin(a * D2R) * Math.cos(el)).multiplyScalar(48 + r() * 10);
      const bend = (r() - 0.5) * 6;                     // 每道光流一个弯度（逐点取随机会变成锯齿）
      const pts = []; for (let k = 0; k <= 60; k++) { const s = k / 60; pts.push(end.clone().multiplyScalar(s).add(new THREE.Vector3(0, Math.sin(s * Math.PI) * bend, 0))); }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xfff0d8, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      const head = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), glowMat(W, 0xfff0d8, { kind: 1, k: 0 }));
      // 光流本身：沿线一串圆形光点（细线在远处几乎看不见）
      const dots = new THREE.Points(geo, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { k: { value: 1 } },
        vertexShader: "void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(300./-mv.z,2.,9.);gl_Position=projectionMatrix*mv;}",
        fragmentShader: "uniform float k;void main(){float r=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(vec3(1.,.93,.8)*smoothstep(1.,0.,r)*k,1.);}",
      }));
      dots.frustumCulled = false;
      scene.add(line, head, dots); streams.push({ line, geo, head, pts, a, dots });
    } }

  // 结尾的新星：宇宙边缘，越来越密地亮起
  const nova = [];
  { const r = rng(2026), N = 46;
    for (let i = 0; i < N; i++) {
      const a = r() * 360, R = 104 + r() * 22;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), glowMat(W, [0xffffff, 0xcfe0ff, 0xffe2c4][i % 3], { kind: 1, k: 0 }));
      m.position.set(...at(a, R, (r() - 0.5) * 30)); scene.add(m);
      nova.push({ m, ti: Math.sqrt(i / N) });          // 0..1，平方根：越到后面越密
    } }

  const bills = [...stars.map((s) => s.m), ...gas.map((g) => g.m), flash, ...streams.map((s) => s.head), ...nova.map((n) => n.m)];
  return { pos, stars, gas, dust, threads, hero, ring, bangU, flash, streams, nova, bills, HERO };
}
