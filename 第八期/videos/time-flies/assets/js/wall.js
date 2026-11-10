// 3D 舞台：暖白纸面摄影棚 + 去年的日历墙（365 张纸格）+ 照片卡片 + 胶片条 + 一叠照片。
// 所有状态都由每帧的参数一次性算出，可任意跳帧。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export const C = {
  paper: 0xf4eee4, board: 0xebe2d4, tile: 0xf7f1e6, line: 0xddd3c4, ink: "#2a2420", inkSoft: "#8a7c6c",
  amber: "#c26f30", pink: 0xe8707a, pinkSoft: 0xf4b3b3,
};
export const W = 1920, H = 1080;
export const YEAR = 2025; // 「去年」

export function buildWorld(canvas, { width = W, height = H } = {}) {
  const dpr = window.devicePixelRatio || 1;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const paper = new THREE.Color(C.paper);
  scene.background = paper.clone();
  scene.fog = new THREE.Fog(paper.clone(), 40, 120);
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.05, 600);

  scene.add(new THREE.HemisphereLight(0xfffcf6, 0xe6dccb, 2.6));
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.25);
  sun.position.set(-14, 18, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 30, bottom: -30, near: 1, far: 90 });
  sun.shadow.radius = 9;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const rt = new THREE.WebGLRenderTarget(width * dpr, height * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(dpr);
  composer.setSize(width, height);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), 0.5, 0.6, 1.0));
  composer.addPass(new OutputPass());

  const v = new THREE.Vector3();
  function project(p) {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * width, y: (-v.y * 0.5 + 0.5) * height, behind: v.z > 1 };
  }
  function setCam(cam) {
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.tgt);
    if (cam.fov && camera.fov !== cam.fov) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }
  return { renderer, scene, camera, composer, sun, project, setCam, render: () => composer.render() };
}

// ---------- 纹理工具 ----------
const grainCache = {};
function paperGrain(ctx, w, h, a = 0.05, seed = 1) {
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const n = Math.floor((w * h) / 90);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r() < 0.5 ? `rgba(120,95,60,${a * r()})` : `rgba(255,255,255,${a * 1.4 * r()})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}
function canvasTex(cv, srgb = true) {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// 照片：读图，读不到就画一张占位（暖色 / 冷色渐变 + 名字），先让场景跑起来
export async function loadPhotos(names, base = "../assets/img/") {
  const out = {};
  await Promise.all(names.map((n) => new Promise((res) => {
    const img = new Image();
    img.onload = () => { out[n] = img; res(); };
    img.onerror = () => { out[n] = placeholder(n); res(); };
    img.src = `${base}${n}.jpg`;
  })));
  return out;
}
function placeholder(name) {
  const cv = document.createElement("canvas"); cv.width = 768; cv.height = 512;
  const g = cv.getContext("2d");
  const cool = name.startsWith("adult-");
  const gr = g.createLinearGradient(0, 0, 768, 512);
  gr.addColorStop(0, cool ? "#9aa6ad" : "#f2c48d"); gr.addColorStop(1, cool ? "#5d6b74" : "#d9785a");
  g.fillStyle = gr; g.fillRect(0, 0, 768, 512);
  g.fillStyle = "rgba(255,255,255,.85)"; g.font = "bold 48px sans-serif"; g.fillText(name, 40, 270);
  return cv;
}

// 把照片裁成指定比例画进卡片（带纸白边），可选整体偏冷偏平（成年日常）
export function photoCanvas(img, { aspect = 1, px = 512, border = 0.06, cool = false } = {}) {
  const w = px, h = Math.round(px / aspect);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d");
  g.fillStyle = "#fbf8f2"; g.fillRect(0, 0, w, h);
  const b = Math.round(w * border);
  const iw = w - 2 * b, ih = h - 2 * b, ia = iw / ih;
  const sw = img.width, sh = img.height, sa = sw / sh;
  let cx = 0, cy = 0, cw = sw, ch = sh;
  if (sa > ia) { cw = sh * ia; cx = (sw - cw) / 2; } else { ch = sw / ia; cy = (sh - ch) / 2; }
  if (cool) g.filter = "saturate(0.55) contrast(0.9) brightness(1.02)";
  g.drawImage(img, cx, cy, cw, ch, b, b, iw, ih);
  g.filter = "none";
  if (cool) { g.fillStyle = "rgba(150,170,185,0.16)"; g.fillRect(b, b, iw, ih); }
  else { g.fillStyle = "rgba(255,200,140,0.06)"; g.fillRect(b, b, iw, ih); }
  paperGrain(g, w, h, 0.05, px);
  return cv;
}

// ---------- 日历墙 ----------
// 6×2 个月块，每块 7 列 × 6 行；一格 1×1，格距 0.12。墙在 z=0 平面上，中心在原点。
export const CELL = 1, GAP = 0.12, PITCH = CELL + GAP;
const MCOLS = 6, MROWS = 2, MW = 7 * PITCH, MH = 6 * PITCH, MGX = 1.5, MHEAD = 1.6, MGY = 1.0;
export const WALL_W = MCOLS * MW + (MCOLS - 1) * MGX, WALL_H = MROWS * (MH + MHEAD) + (MROWS - 1) * MGY;

export function calendarDays(year = YEAR) {
  const days = [];
  const d0 = new Date(Date.UTC(year, 0, 1));
  for (let i = 0; ; i++) {
    const d = new Date(d0.getTime() + i * 86400000);
    if (d.getUTCFullYear() !== year) break;
    const m = d.getUTCMonth(), dom = d.getUTCDate();
    const first = new Date(Date.UTC(year, m, 1)).getUTCDay(); // 0=周日
    const wd = d.getUTCDay();
    const col = (wd + 6) % 7; // 周一开头
    const row = Math.floor(((first + 6) % 7 + dom - 1) / 7);
    const mx = m % MCOLS, my = Math.floor(m / MCOLS);
    const x = -WALL_W / 2 + mx * (MW + MGX) + col * PITCH + PITCH / 2;
    const y = WALL_H / 2 - my * (MH + MHEAD + MGY) - MHEAD - row * PITCH - PITCH / 2;
    days.push({ i, m, dom, wd, pos: new THREE.Vector3(x, y, 0) });
  }
  return days;
}
export function dayIndex(m, dom, year = YEAR) {
  return Math.round((Date.UTC(year, m - 1, dom) - Date.UTC(year, 0, 1)) / 86400000);
}

export function buildCalendar(scene, year = YEAR) {
  const days = calendarDays(year);
  const group = new THREE.Group();
  scene.add(group);

  // 墙板：纸面 + 月份标题（画在板子的纹理上）
  const S = 40; // 每单位多少像素
  const cv = document.createElement("canvas"); cv.width = Math.round((WALL_W + 4) * S); cv.height = Math.round((WALL_H + 4) * S);
  const g = cv.getContext("2d");
  g.fillStyle = "#f6f0e6"; g.fillRect(0, 0, cv.width, cv.height);
  paperGrain(g, cv.width, cv.height, 0.06, 3);
  g.fillStyle = C.ink; g.textBaseline = "alphabetic";
  const toPx = (x, y) => [(x + WALL_W / 2 + 2) * S, (WALL_H / 2 + 2 - y) * S];
  const wk = ["一", "二", "三", "四", "五", "六", "日"];
  for (let m = 0; m < 12; m++) {
    const mx = m % MCOLS, my = Math.floor(m / MCOLS);
    const x0 = -WALL_W / 2 + mx * (MW + MGX), y0 = WALL_H / 2 - my * (MH + MHEAD + MGY);
    const [px, py] = toPx(x0, y0);
    g.font = `700 ${Math.round(0.95 * S)}px VibeSerif`; g.fillStyle = C.ink;
    g.fillText(`${m + 1}月`, px + 0.06 * S, py + 0.95 * S);
    g.font = `500 ${Math.round(0.34 * S)}px VibeSans`; g.fillStyle = C.inkSoft;
    for (let c = 0; c < 7; c++) g.fillText(wk[c], px + (c * PITCH + 0.38) * S, py + 1.45 * S);
  }
  const boardTex = canvasTex(cv);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W + 4, WALL_H + 4), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 1, transparent: true }));
  board.position.z = -0.02; board.receiveShadow = true;
  group.add(board);
  const margin = new THREE.Mesh(new THREE.PlaneGeometry(WALL_W + 160, WALL_H + 120), new THREE.MeshStandardMaterial({ color: 0xf6f0e6, roughness: 1, transparent: true }));
  margin.position.z = -0.04; margin.receiveShadow = true;
  group.add(margin);

  // 纸格：实例化平面，数字图集 8×4（1..31）
  const A = document.createElement("canvas"); A.width = 8 * 128; A.height = 4 * 128;
  const ag = A.getContext("2d");
  for (let k = 0; k < 32; k++) {
    const ax = (k % 8) * 128, ay = Math.floor(k / 8) * 128;
    ag.fillStyle = "#fffbf4"; ag.fillRect(ax, ay, 128, 128);
    ag.strokeStyle = "rgba(150,130,100,0.35)"; ag.lineWidth = 2; ag.strokeRect(ax + 1, ay + 1, 126, 126);
    if (k > 0) { ag.fillStyle = "#9a8b78"; ag.font = "600 30px VibeSans"; ag.fillText(String(k), ax + 12, ay + 36); }
  }
  paperGrain(ag, A.width, A.height, 0.05, 5);
  const atlas = canvasTex(A);
  const tileMat = new THREE.MeshStandardMaterial({ map: atlas, roughness: 0.95, side: THREE.DoubleSide, transparent: true });
  tileMat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nattribute vec2 aOff;\nattribute float aAlpha;\nvarying float vAlpha;")
      .replace("#include <uv_vertex>", "#include <uv_vertex>\nvMapUv = vMapUv * vec2(0.125, 0.25) + aOff;\nvAlpha = aAlpha;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vAlpha;")
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\ngl_FragColor.a *= vAlpha;");
  };
  const n = days.length;
  const geo = new THREE.PlaneGeometry(CELL, CELL);
  const aOff = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2);
  const aAlpha = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1);
  geo.setAttribute("aOff", aOff); geo.setAttribute("aAlpha", aAlpha);
  days.forEach((d, i) => { aOff.setXY(i, (d.dom % 8) * 0.125, 0.75 - Math.floor(d.dom / 8) * 0.25); });
  const tiles = new THREE.InstancedMesh(geo, tileMat, n);
  tiles.castShadow = true; tiles.receiveShadow = true; tiles.frustumCulled = false;
  group.add(tiles);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  // 每格的状态：offset（位移）、rot（欧拉角）、scale、alpha
  function setTile(i, { off = [0, 0, 0], rot = [0, 0, 0], s = 1, a = 1 } = {}) {
    p.copy(days[i].pos).add(new THREE.Vector3(off[0], off[1], off[2] + 0.01));
    q.setFromEuler(e.set(rot[0], rot[1], rot[2]));
    sc.setScalar(a < 0.01 ? 1e-4 : Math.max(s, 1e-4)); // 全透明的格子缩没，免得还挡影子
    tiles.setMatrixAt(i, m4.compose(p, q, sc));
    aAlpha.setX(i, a);
  }
  function commit() { tiles.instanceMatrix.needsUpdate = true; aAlpha.needsUpdate = true; }
  days.forEach((_, i) => setTile(i)); commit();
  // 墙板淡出（只剩悬空的照片）
  function setBoard(o) {
    for (const m of [board, margin]) { m.material.opacity = o; m.visible = o > 0.002; m.material.depthWrite = o > 0.99; }
  }
  return { group, days, tiles, setTile, commit, board, setBoard };
}

// ---------- 照片卡片（格子里亮起的记忆） ----------
// 带一层暖粉发光底（超过 bloom 阈值才发光），glow=0 时只是一张普通照片
const texCache = new Map();
export function photoCard(canvasImg, { w = 1, h = 1 } = {}) {
  const group = new THREE.Group();
  if (!texCache.has(canvasImg)) texCache.set(canvasImg, canvasTex(canvasImg));
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texCache.get(canvasImg), roughness: 0.6, side: THREE.DoubleSide }));
  photo.castShadow = true; photo.receiveShadow = true;
  const glowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.pink).multiplyScalar(2.2), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.12, h * 1.12), glowMat);
  glow.position.z = -0.01;
  group.add(glow, photo);
  photo.material.transparent = true;
  group.userData = {
    photo, glow, alpha: 1, glowK: 0,
    setGlow: (k) => { group.userData.glowK = k; glowMat.opacity = k * group.userData.alpha; glow.visible = glowMat.opacity > 0.001; },
    setAlpha: (a) => { group.userData.alpha = a; photo.material.opacity = a; photo.material.depthWrite = a > 0.99; group.visible = a > 0.002; group.userData.setGlow(group.userData.glowK); },
  };
  group.userData.setGlow(0);
  return group;
}

// 「今天」的空格：一圈暖粉描边
export function outline(w = 1.08, h = 1.08, th = 0.06) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2); s.lineTo(-w / 2, -h / 2);
  const hole = new THREE.Path();
  hole.moveTo(-w / 2 + th, -h / 2 + th); hole.lineTo(-w / 2 + th, h / 2 - th); hole.lineTo(w / 2 - th, h / 2 - th); hole.lineTo(w / 2 - th, -h / 2 + th); hole.lineTo(-w / 2 + th, -h / 2 + th);
  s.holes.push(hole);
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), new THREE.MeshBasicMaterial({ color: new THREE.Color(C.pink).multiplyScalar(1.6), transparent: true, toneMapped: false }));
  return m;
}

// ---------- 胶片条：一条弯曲的带子，每一格一张照片 ----------
// path(u) 给出 u∈[0,1] 处的中心点；带子宽 h（世界单位），frames 张照片沿长度排开
export function filmStrip(imgs, { frames = 12, h = 2.2, path, len, seed = 1 }) {
  const fpx = 420, hpx = Math.round(fpx * 0.86), sp = 56; // 每格宽 / 带高 / 齿孔边
  const cv = document.createElement("canvas"); cv.width = frames * fpx; cv.height = hpx + 2 * sp;
  const g = cv.getContext("2d");
  g.fillStyle = "#3b2a1f"; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < frames; i++) {
    const img = imgs[i % imgs.length];
    const pc = photoCanvas(img, { aspect: (fpx - 36) / (hpx - 24), px: fpx - 36, border: 0 });
    g.drawImage(pc, i * fpx + 18, sp + 12);
    for (let k = 0; k < 6; k++) { // 齿孔
      g.fillStyle = "#f4eee4";
      const x = i * fpx + 22 + k * (fpx / 6);
      g.fillRect(x, 16, 34, 24); g.fillRect(x, cv.height - 40, 34, 24);
    }
  }
  g.fillStyle = "rgba(255,190,120,0.10)"; g.fillRect(0, 0, cv.width, cv.height);
  const tex = canvasTex(cv);
  const segs = frames * 8;
  const geo = new THREE.PlaneGeometry(1, h, segs, 1);
  const pos = geo.attributes.position;
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5, yv = pos.getY(i);
    const c = path(u), c2 = path(Math.min(1, u + 0.002)), c1 = path(Math.max(0, u - 0.002));
    const t = c2.clone().sub(c1).normalize();
    const nrm = new THREE.Vector3().crossVectors(t, up).normalize();
    const b = new THREE.Vector3().crossVectors(nrm, t).normalize(); // 带子的「上」方向
    pos.setXYZ(i, c.x + b.x * yv, c.y + b.y * yv, c.z + b.z * yv);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.0, side: THREE.DoubleSide });
  // 高光扫过：uHi 是沿带长的位置（0..1），uHiA 是强度；每一格的照片泛暖粉光
  const uHi = { value: -1 }, uHiA = { value: 0 }, uHiW = { value: 0.06 };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uHi, uHiA, uHiW });
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uHi, uHiA, uHiW;")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(1.0, 0.42, 0.48) * 1.6 * uHiA * smoothstep(uHiW, 0.0, abs(vMapUv.x - uHi));");
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const nIdx = geo.index.count;
  // reveal(k)：只画前 k 比例（PlaneGeometry 只有一行，索引按列排，drawRange 就是从头展开）
  mesh.userData = { uHi, uHiA, uHiW, reveal: (k) => { geo.setDrawRange(0, Math.floor(nIdx * Math.min(1, Math.max(0, k)) / 6) * 6); mesh.visible = k > 0; } };
  return mesh;
}

// ---------- 一叠照片（成年的 365 天） ----------
// 4 张图循环，每张一个 InstancedMesh；place(k) 给出第 k 张的 {pos, rot}
export function deck(canvases, count, { w = 3, h = 2 } = {}) {
  const group = new THREE.Group();
  const meshes = canvases.map((cv) => {
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(w, h, 0.012), [
      ...Array(4).fill(new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: 0.9 })),
      new THREE.MeshStandardMaterial({ map: canvasTex(cv), roughness: 0.55 }),
      new THREE.MeshStandardMaterial({ color: 0xefe9de, roughness: 0.9 }),
    ], Math.ceil(count / canvases.length));
    m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    group.add(m);
    return m;
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  function layout(place) {
    for (let k = 0; k < count; k++) {
      const { pos, rot, s = 1 } = place(k);
      const mi = k % meshes.length, j = Math.floor(k / meshes.length);
      meshes[mi].setMatrixAt(j, m4.compose(p.set(...pos), q.setFromEuler(e.set(...rot)), one.setScalar(Math.max(s, 1e-4))));
    }
    meshes.forEach((m) => (m.instanceMatrix.needsUpdate = true));
  }
  return { group, layout };
}

// 地板：接住阴影的纸面
export function floor(scene, y = -12) {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.12 }));
  f.rotation.x = -Math.PI / 2; f.position.y = y; f.receiveShadow = true;
  scene.add(f);
  return f;
}

// ---------- 空胶片：n 个片窗，照片卡片另外飞进来贴在窗口前 ----------
export function emptyStrip(n, { slot = 1.6, gap = 0.3, h = 2.3 } = {}) {
  const S = 160, len = n * (slot + gap) + gap;
  const cv = document.createElement("canvas"); cv.width = Math.round(len * S); cv.height = Math.round(h * S);
  const g = cv.getContext("2d");
  g.fillStyle = "#3b2a1f"; g.fillRect(0, 0, cv.width, cv.height);
  const y0 = (h - slot) / 2 * S;
  for (let i = 0; i < n; i++) {
    const x0 = (gap + i * (slot + gap)) * S;
    g.fillStyle = "#4a372a"; g.fillRect(x0, y0, slot * S, slot * S);
  }
  const holes = Math.floor(len / 0.32);
  for (let k = 0; k < holes; k++) {
    g.fillStyle = "#f4eee4";
    const x = (0.12 + k * 0.32) * S;
    g.fillRect(x, 0.06 * S, 0.16 * S, 0.12 * S); g.fillRect(x, (h - 0.18) * S, 0.16 * S, 0.12 * S);
  }
  const tex = canvasTex(cv);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, side: THREE.DoubleSide, transparent: true });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, h), mat);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const slotX = (i) => -len / 2 + gap + slot / 2 + i * (slot + gap);
  return { mesh, slotX, len, slot };
}
