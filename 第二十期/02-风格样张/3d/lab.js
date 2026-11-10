// 第二十期 P3 · 3D 风格样张：同一拍（被划掉的 t += dt ＋ 地面/卫星两只读数不同的钟）与牛顿引文，三个方向各做一个 Three.js 场景。
// lab.html?d=a|b|c&k=main|quote。静帧：渲染一次后置 window.__done = true，由 ../tools/gen-3d.mjs 截图。
// 文字（章节条、注释带、字幕、标签）用 HTML 叠在画布上；场景里的文字是画在 canvas 贴图上的。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const W = 1920, H = 1080;
const q = new URLSearchParams(location.search);
const D = q.get("d") || "a", K = q.get("k") || "main";
const NEWTON = ["绝对的、真实的、数学的时间，", "自身均匀地流逝，", "与任何外物无关。"];
const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const rad = (d) => (d * Math.PI) / 180;

await Promise.all(["700 40px NotoSC", "800 40px NotoSerifSC", "40px CascadiaMono", "40px WenKai"].map((f) => document.fonts.load(f)));

// ── 渲染器与后期 ──
const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, W / H, 0.05, 400);
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.35;

function setCam(pos, tgt) { camera.position.set(...pos); camera.lookAt(...tgt); camera.updateMatrixWorld(); }
const v3 = new THREE.Vector3();
function project(obj, off = [0, 0, 0]) {
  obj.updateMatrixWorld(true);
  v3.set(...off).applyMatrix4(obj.matrixWorld).project(camera);
  return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H];
}

// ── canvas 贴图 ──
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d"); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
// 粉笔化：在透明画布上画内容，再用噪点打孔，模拟粉笔颗粒
function chalkify(g, w, h, seed, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); draw(x);
  const r = rng(seed); x.globalCompositeOperation = "destination-out";
  for (let i = 0; i < (w * h) / 26; i++) { x.globalAlpha = 0.35 + r() * 0.65; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.5); }
  g.drawImage(c, 0, 0);
}

// ── 钟：机身＋表圈＋表盘贴图＋三根针；sec 为秒针角度（度） ──
function faceTex({ bg, tick, major, size = 1024, chalk = false, seed = 1 }) {
  return canvasTex(size, size, (g, w) => {
    const c = w / 2;
    if (bg) { g.fillStyle = bg; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill(); }
    const drawTicks = (x) => {
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2, m = i % 5 === 0;
        const r1 = c * (m ? 0.78 : 0.86), r2 = c * 0.93;
        x.strokeStyle = m ? major : tick; x.lineWidth = m ? 14 : 5; x.lineCap = "round";
        x.beginPath(); x.moveTo(c + r1 * Math.sin(a), c - r1 * Math.cos(a)); x.lineTo(c + r2 * Math.sin(a), c - r2 * Math.cos(a)); x.stroke();
      }
    };
    if (chalk) chalkify(g, w, w, seed, drawTicks); else drawTicks(g);
  });
}
function clock({ r = 1, depth = 0.16, body, rim, face, hand, sec = 0, secMat, pocket = false, shadow = false }) {
  const grp = new THREE.Group();
  const d = r * depth;
  const bodyM = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, d, 128), body);
  bodyM.rotation.x = Math.PI / 2; grp.add(bodyM);
  const rimM = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * (pocket ? 0.085 : 0.045), 32, 160), rim);
  rimM.position.z = d / 2; grp.add(rimM);
  const faceM = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 128), new THREE.MeshStandardMaterial({ map: face, transparent: true, roughness: 0.6, metalness: 0 }));
  faceM.position.z = d / 2 + 0.003; grp.add(faceM);
  const mk = (deg, len, wid, mat, z) => {
    const p = new THREE.Group(); p.rotation.z = -rad(deg); p.position.z = d / 2 + z;
    const geo = new THREE.BoxGeometry(wid, len * 1.18, r * 0.02); geo.translate(0, len * 0.41, 0);
    p.add(new THREE.Mesh(geo, mat)); grp.add(p); return p;
  };
  mk(305, r * 0.48, r * 0.075, hand, 0.02);
  mk(60, r * 0.72, r * 0.05, hand, 0.04);
  mk(sec, r * 0.86, r * 0.018, secMat, 0.06);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.055, r * 0.055, r * 0.03, 32), secMat);
  cap.rotation.x = Math.PI / 2; cap.position.z = d / 2 + 0.075; grp.add(cap);
  if (pocket) {
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.09, r * 0.09, r * 0.16, 32), rim); crown.position.y = r * 1.16; grp.add(crown);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(r * 0.2, r * 0.035, 16, 64), rim); bow.position.y = r * 1.42; grp.add(bow);
  }
  if (shadow) grp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return grp;
}
// 两针之间的读数差弧（秒针 0° → sec°）
function diffArc(r, sec, mat, d) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r * 0.8, r * 0.03, 12, 64, rad(sec)), mat);
  m.rotation.z = Math.PI / 2 - rad(sec); m.position.z = d + 0.05; return m;
}

// ── HTML 叠层 ──
const ui = document.getElementById("ui");
function html(s) { ui.insertAdjacentHTML("beforeend", s); }
function label(obj, off, cls, text, style = "") { const [x, y] = project(obj, off); html(`<div class="lbl ${cls}" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;${style}">${text}</div>`); }
const TEXT = {
  main: { tag: "③ 机制 · 私有的钟", note: "GPS 卫星钟比地面钟每天约快 38 微秒，不修正，一天的导航误差就超过 11 公里 · Ashby 2002", caption: "这行代码写错了：宇宙里，没有一只共用的钟。" },
  quote: { tag: "② 历史锚点 · 1687", note: "牛顿《自然哲学的数学原理》附注 · 据英译自译", caption: "牛顿心里的宇宙，只有一个全局变量 t。" },
};
function chrome({ name, mode, tag, mark, note, cap, fade }) {
  const t = TEXT[K];
  html(`<div class="fade" style="background:linear-gradient(180deg,transparent,${fade} 46%,${fade})"></div>` +
    `<div class="mode" style="color:${mode}">${D.toUpperCase()} · ${name} · 3D</div>` +
    `<div class="tag" style="${tag}">${t.tag}</div><div class="mark" style="color:${mark}">风格样张</div>` +
    `<div class="note" style="color:${note}">${t.note}</div><div class="caption" style="color:${cap}">${t.caption}</div>`);
}

// ══════════ A · 编辑器夜色：点阵大地上的实例、悬浮的代码面板、发光的钟 ══════════
function sceneA() {
  const bg = new THREE.Color(0x060a12);
  scene.background = bg; scene.fog = new THREE.FogExp2(0x060a12, 0.034);
  scene.add(new THREE.HemisphereLight(0x8fb3bf, 0x050810, 0.5));
  const grid = new THREE.GridHelper(160, 120, 0x1d6b62, 0x153f47); grid.position.y = -2.2;
  grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);
  const teal = new THREE.MeshStandardMaterial({ color: 0x7ff0d2, emissive: 0x7ff0d2, emissiveIntensity: 0.9 });
  const amber = new THREE.MeshStandardMaterial({ color: 0xffb454, emissive: 0xffb454, emissiveIntensity: 0.9 });
  // 散落在大地上的实例：每个一颗光点＋一圈小表圈（稀疏，不做密集图标）
  const r = rng(11), inst = [];
  const dotG = new THREE.SphereGeometry(0.07, 16, 12), ringG = new THREE.TorusGeometry(0.22, 0.012, 8, 48);
  const ringM = new THREE.MeshBasicMaterial({ color: 0x7ff0d2, transparent: true, opacity: 0.5 });
  for (let i = 0; i < 34; i++) {
    const x = (r() - 0.5) * 30, z = -r() * 34 + 4;
    if (Math.abs(x) < 7 && z > -4) continue;
    const g = new THREE.Group(); g.position.set(x, -2.05, z);
    g.add(new THREE.Mesh(dotG, teal)); const ring = new THREE.Mesh(ringG, ringM); ring.rotation.x = Math.PI / 2; g.add(ring);
    scene.add(g); inst.push(g);
  }
  const darkBody = new THREE.MeshStandardMaterial({ color: 0x0d1a26, metalness: 0.7, roughness: 0.32 });
  const handW = new THREE.MeshStandardMaterial({ color: 0xe8f0f2, emissive: 0xe8f0f2, emissiveIntensity: 0.5 });

  if (K === "main") {
    // 代码面板
    const tex = canvasTex(1600, 1080, (g, w, h) => {
      roundRect(g, 4, 4, w - 8, h - 8, 34); g.fillStyle = "rgba(11,17,29,.93)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#2f4a63"; g.stroke();
      g.fillStyle = "#2d4257"; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(56 + i * 40, 62, 12, 0, 7); g.fill(); }
      g.font = "40px CascadiaMono"; g.fillStyle = "#6f8ea0"; g.fillText("universe.js", 200, 76);
      g.fillStyle = "#22344a"; g.fillRect(4, 122, w - 8, 3);
      const L = [
        [["// 如果宇宙是一段代码", "#5d7d8e"]],
        [["let", "#ffb454"], [" t = ", "#d7e4ea"], ["0", "#ff9b73"], [";", "#d7e4ea"], "S"],
        [["while", "#ffb454"], [" (", "#d7e4ea"], ["true", "#ffb454"], [") {", "#d7e4ea"]],
        [["  t += dt;", "#d7e4ea"], "S"],
        [["  world.", "#5f7584"], ["update", "#4d8f80"], ["(t);", "#5f7584"]],
        [["}", "#d7e4ea"]],
        [["// 每个实例，自带一只钟", "#5d7d8e"]],
        [["me.", "#d7e4ea"], ["clock", "#7ff0d2"], ["   // this.clock", "#5d7d8e"]],
      ];
      g.font = "58px CascadiaMono";
      L.forEach((line, i) => {
        const y = 230 + i * 106; g.fillStyle = "#3e566b"; g.textAlign = "right"; g.fillText(String(i + 1), 130, y); g.textAlign = "left";
        let x = 180, x0 = null;
        for (const seg of line) {
          if (seg === "S") continue;
          const [s, col] = seg; g.font = /[一-鿿]/.test(s) ? "52px NotoSC" : "58px CascadiaMono";
          if (x0 === null && s.trim()) x0 = x + (s.length - s.trimStart().length) * 34.8;
          g.fillStyle = col; g.fillText(s, x, y); x += g.measureText(s).width;
        }
        if (line.includes("S")) { g.save(); g.strokeStyle = "#ffb454"; g.shadowColor = "#ffb454"; g.shadowBlur = 24; g.lineWidth = 8; g.beginPath(); g.moveTo(x0 - 12, y - 18); g.lineTo(x + 12, y - 18); g.stroke(); g.restore(); }
      });
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 4.455), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: 0xd8d8d8 }));
    panel.position.set(-3.7, 0.7, 0.2); panel.rotation.y = rad(18); panel.scale.setScalar(0.86); scene.add(panel);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(6.6, 4.455)), new THREE.LineBasicMaterial({ color: 0x3f8f80 })); panel.add(edge);
    // 「没有全局 t」标签贴在面板上
    // 两只钟
    const g1 = clock({ r: 1.45, body: darkBody, rim: teal, face: faceTex({ bg: "#0d1a26", tick: "#5fb8a6", major: "#9fe9d8" }), hand: handW, sec: 0, secMat: teal });
    g1.position.set(1.9, 0.55, 0.6); g1.rotation.y = rad(-16); g1.scale.setScalar(0.86); scene.add(g1);
    const g2 = clock({ r: 1.12, body: new THREE.MeshStandardMaterial({ color: 0x1a1408, metalness: 0.7, roughness: 0.32 }), rim: amber, face: faceTex({ bg: "#1a1408", tick: "#b88a4a", major: "#ffcf8a" }), hand: handW, sec: 22, secMat: amber });
    g2.position.set(5.5, 1.85, -1.6); g2.rotation.y = rad(-24); g2.scale.setScalar(0.9); scene.add(g2);
    g2.add(diffArc(1.12, 22, amber, 1.12 * 0.08));
    scene.add(new THREE.PointLight(0x7ff0d2, 2, 8, 1.6).translateX(1.7).translateZ(2.6));
    // 两钟之间的关系线
    const pts = [new THREE.Vector3(3.0, 0.95, 0.4), new THREE.Vector3(4.2, 1.6, -0.9), new THREE.Vector3(4.5, 1.8, -1.25)];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(40)), new THREE.LineDashedMaterial({ color: 0x7ff0d2, dashSize: 0.12, gapSize: 0.14, transparent: true, opacity: 0.7 }));
    line.computeLineDistances(); scene.add(line);
    setCam([0.6, 1.2, 15.2], [0.7, 0.05, 0]);
    label(g1, [0, -1.72, 0], "mono", `<span style="font-size:27px;color:#bfe9df">ground.clock<br>地面</span>`);
    label(g2, [0, -1.42, 0], "mono", `<span style="font-size:27px;color:#bfe9df">sat.clock<br>卫星 <b style="color:#ffcf8a">+38 μs/天</b></span>`);
    label(panel, [1.55, -0.3, 0], "", `<span style="display:inline-block;padding:9px 22px;border:1px solid #ffb454;border-radius:30px;background:#1a1408e6;color:#ffcf8a;font-size:26px;box-shadow:0 0 28px #ffb45455">没有全局 t</span>`);
  } else {
    // 全局大钟悬在大地上空，几个实例向它连一根细光
    const big = clock({ r: 2.5, body: darkBody, rim: teal, face: faceTex({ bg: "#0d1a26", tick: "#5fb8a6", major: "#9fe9d8" }), hand: handW, sec: 0, secMat: teal });
    big.position.set(5.2, 1.6, -5); big.rotation.y = rad(-22); big.scale.setScalar(0.82); scene.add(big);
    const beamM = new THREE.LineBasicMaterial({ color: 0x7ff0d2, transparent: true, opacity: 0.22 });
    inst.slice(0, 16).forEach((g) => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([g.position, new THREE.Vector3(5.2, 1.6 - 2.05, -5)]), beamM)));
    const tex = canvasTex(2000, 1200, (g, w, h) => {
      roundRect(g, 4, 4, w - 8, h - 8, 40); g.fillStyle = "rgba(11,17,29,.94)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#2f4a63"; g.stroke();
      g.font = "44px CascadiaMono"; g.fillStyle = "#5d7d8e"; g.fillText("/* 1687 · 牛顿《自然哲学的数学原理》· 附注 */", 110, 150);
      g.fillStyle = "#ffb454"; g.shadowColor = "#ffb454"; g.shadowBlur = 20; g.fillRect(110, 230, 8, 480); g.shadowBlur = 0;
      g.font = "800 100px NotoSerifSC"; g.fillStyle = "#ffffff"; NEWTON.forEach((s, i) => g.fillText(s, 170, 330 + i * 160));
      g.font = "52px CascadiaMono"; let x = 110; const y = 900;
      for (const [s, col] of [["const", "#ffb454"], [" t = ", "#d7e4ea"], ["GLOBAL", "#7ff0d2"], [";  ", "#d7e4ea"]]) { g.fillStyle = col; g.fillText(s, x, y); x += g.measureText(s).width; }
      g.font = "48px NotoSC"; g.fillStyle = "#5d7d8e"; g.fillText("// 全宇宙共用一只钟", x, y);
    });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 5.04), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: 0xdedede }));
    panel.position.set(-2.2, 0.75, 0.6); panel.rotation.y = rad(16); panel.scale.setScalar(0.88); scene.add(panel);
    panel.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(8.4, 5.04)), new THREE.LineBasicMaterial({ color: 0x3f8f80 })));
    setCam([0.6, 1.3, 15.6], [0.6, 0.55, 0]);
  }
  chrome({ name: "编辑器夜色", mode: "#8fb3bf", tag: "color:#7ff0d2;border-color:#3f8f80;background:#0a1a22d9", mark: "#8fb3bf", note: "#9fc2c9", cap: "#ffffff", fade: "#060a12f0" });
  return { bloom: [0.55, 0.45, 0.72] };
}

// ══════════ B · 天文台黄铜：刻线地球、GPS 轨道、黄铜怀表、远处的全宇宙大钟 ══════════
function sceneB() {
  scene.background = new THREE.Color(0x070d1a);
  scene.environmentIntensity = 0.9;
  scene.add(new THREE.HemisphereLight(0x9fb4d8, 0x0a1020, 0.7));
  const sun = new THREE.DirectionalLight(0xfff0d6, 2.6); sun.position.set(-7, 6, 9); scene.add(sun);
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a45c, metalness: 1, roughness: 0.28 });
  const brassGlow = new THREE.MeshStandardMaterial({ color: 0xc9a45c, emissive: 0x8a6a2a, emissiveIntensity: 0.6, metalness: 0.8, roughness: 0.35 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9b2a18, emissive: 0x9b2a18, emissiveIntensity: 0.6 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x2e2414, roughness: 0.5 });
  // 星
  const r = rng(7), sp = new Float32Array(2400 * 3);
  for (let i = 0; i < 2400; i++) sp.set([(r() - 0.5) * 220, (r() - 0.5) * 120, -60 - r() * 40], i * 3);
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xe9eef5, size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0.75 })));
  // 远处：全宇宙的大钟（牛顿），只有表圈与刻度，淡
  const bigDial = new THREE.Group(); bigDial.position.set(0, 0.6, -16);
  const faint = new THREE.MeshBasicMaterial({ color: 0xc9a45c, transparent: true, opacity: K === "main" ? 0.2 : 0.28 });
  bigDial.add(new THREE.Mesh(new THREE.TorusGeometry(11, 0.035, 8, 256), faint));
  for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, m = i % 5 === 0; const t = new THREE.Mesh(new THREE.BoxGeometry(m ? 0.14 : 0.06, m ? 1.1 : 0.5, 0.02), faint); t.position.set(10.1 * Math.sin(a), 10.1 * Math.cos(a), 0); t.rotation.z = -a; bigDial.add(t); }
  scene.add(bigDial);
  const watchFace = () => faceTex({ bg: "#c9bc9c", tick: "#6e5c3e", major: "#2e2414" });

  if (K === "main") {
    // 地球：深蓝球体 + 黄铜经纬线 + 边缘大气
    const earth = new THREE.Group(); earth.position.set(-0.6, -0.35, 0); earth.scale.setScalar(0.9); earth.rotation.set(rad(18), rad(-25), rad(-12)); scene.add(earth);
    earth.add(new THREE.Mesh(new THREE.SphereGeometry(1.65, 96, 64), new THREE.MeshStandardMaterial({ color: 0x173a66, roughness: 0.55, metalness: 0.1 })));
    const lineM = new THREE.LineBasicMaterial({ color: 0xc9a45c, transparent: true, opacity: 0.7 });
    for (let lat = -60; lat <= 60; lat += 30) { const rr = 1.66 * Math.cos(rad(lat)), y = 1.66 * Math.sin(rad(lat)); const p = []; for (let i = 0; i <= 96; i++) p.push(new THREE.Vector3(rr * Math.cos((i / 96) * 6.2832), y, rr * Math.sin((i / 96) * 6.2832))); earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lineM)); }
    for (let lon = 0; lon < 180; lon += 30) { const p = []; for (let i = 0; i <= 96; i++) { const a = (i / 96) * 6.2832; p.push(new THREE.Vector3(1.66 * Math.cos(a) * Math.cos(rad(lon)), 1.66 * Math.sin(a), 1.66 * Math.cos(a) * Math.sin(rad(lon)))); } earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), lineM)); }
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.78, 64, 48), new THREE.ShaderMaterial({
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      vertexShader: "varying vec3 n;varying vec3 vp;void main(){n=normalize(normalMatrix*normal);vec4 m=modelViewMatrix*vec4(position,1.);vp=normalize(-m.xyz);gl_Position=projectionMatrix*m;}",
      fragmentShader: "varying vec3 n;varying vec3 vp;void main(){float f=pow(1.-max(dot(n,vp),0.),3.);gl_FragColor=vec4(vec3(.42,.66,1.)*f*1.3,f);}",
    }));
    earth.add(atm);
    // GPS 轨道（俯视略高）与卫星
    const orbit = new THREE.Group(); orbit.position.copy(earth.position); orbit.rotation.set(Math.PI / 2 + 0.3, 0, rad(-9)); scene.add(orbit);
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.018, 8, 320), brassGlow));
    const sat = new THREE.Group(); const a = -0.62; sat.position.set(4.2 * Math.cos(a), 4.2 * Math.sin(a), 0); orbit.add(sat);
    const satInner = new THREE.Group(); sat.add(satInner); satInner.rotation.set(-Math.PI / 2 - 0.3, 0, 0);
    satInner.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), new THREE.MeshStandardMaterial({ color: 0xe2c588, metalness: 1, roughness: 0.35 })));
    const panelM = new THREE.MeshStandardMaterial({ color: 0x24446e, metalness: 0.4, roughness: 0.3, emissive: 0x0d1f3a, emissiveIntensity: 0.6 });
    for (const s of [-1, 1]) { const pn = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.32, 0.03), panelM); pn.position.x = s * 0.68; satInner.add(pn); }
    // 怀表
    const w1 = clock({ r: 1.2, depth: 0.22, body: brass, rim: brass, face: watchFace(), hand: ink, sec: 0, secMat: red, pocket: true });
    w1.position.set(-5.4, 1.9, 0.6); w1.rotation.y = rad(22); w1.scale.setScalar(0.85); scene.add(w1);
    const w2 = clock({ r: 1.2, depth: 0.22, body: brass, rim: brass, face: watchFace(), hand: ink, sec: 22, secMat: red, pocket: true });
    w2.position.set(5.4, 1.9, 0.4); w2.rotation.y = rad(-22); w2.scale.setScalar(0.85); scene.add(w2);
    w2.add(diffArc(1.2, 22, red, 1.2 * 0.11));
    // 细铜链：地面表 → 地球表面，卫星表 → 卫星
    scene.updateMatrixWorld(true);
    const satW = new THREE.Vector3(); sat.getWorldPosition(satW);
    const surf = new THREE.Vector3(-1.75, 0.45, 0.9);
    const chain = new THREE.LineDashedMaterial({ color: 0xc9a45c, dashSize: 0.08, gapSize: 0.07 });
    for (const [p0, p1] of [[new THREE.Vector3(-5.25, 0.75, 0.6), surf], [new THREE.Vector3(5.25, 0.75, 0.4), satW]]) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([p0, p1]), chain); l.computeLineDistances(); scene.add(l); }
    // 铭牌：被划掉的 t += dt
    const plateTex = canvasTex(1200, 220, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#ecd39a"); gr.addColorStop(1, "#a88345"); g.fillStyle = gr; roundRect(g, 0, 0, w, h, 26); g.fill();
      g.font = "110px CascadiaMono"; g.fillStyle = "#3a2a10"; g.textAlign = "center"; g.fillText("t += dt", w / 2, 148);
      const tw = g.measureText("t += dt").width; g.fillStyle = "#b3261a"; g.fillRect(w / 2 - tw / 2 - 30, 106, tw + 60, 16);
    });
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.62, 0.08), [brass, brass, brass, brass, new THREE.MeshStandardMaterial({ map: plateTex, metalness: 0.6, roughness: 0.4 }), brass]);
    plate.position.set(0, 3.25, 0.5); plate.rotation.x = rad(8); scene.add(plate);
    setCam([0, 0.8, 15.5], [0, 0.35, 0]);
    label(w1, [0, -1.6, 0], "", `<span style="font-size:28px;color:#e9dcc0">地面的钟</span>`);
    label(w2, [0, -1.6, 0], "", `<span style="font-size:28px;color:#e9dcc0">卫星上的钟<br><b style="color:#f6d78f">每天快约 38 微秒</b></span>`);
  } else {
    // 浑天仪（全宇宙一只钟的意象）＋《原理》书
    const arm = new THREE.Group(); arm.position.set(2.6, 0.7, -5.5); arm.rotation.set(rad(14), rad(-30), 0); scene.add(arm);
    for (const [rx, ry] of [[Math.PI / 2, 0], [0, 0], [Math.PI / 2 + 0.41, 0.3], [0, Math.PI / 2]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.07, 16, 256), brass); t.rotation.set(rx, ry, 0); arm.add(t); }
    arm.add(new THREE.Mesh(new THREE.SphereGeometry(0.75, 48, 32), brass));
    const pageTex = canvasTex(900, 1200, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#efe4c9"); gr.addColorStop(1, "#d6c294"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(90,67,32,.06)"; for (let y = 0; y < h; y += 11) g.fillRect(0, y, w, 1);
      g.fillStyle = "#3a2d1a"; g.textAlign = "center"; g.font = "700 54px NotoSerifSC";
      ["PHILOSOPHIÆ", "NATURALIS", "PRINCIPIA", "MATHEMATICA"].forEach((s, i) => g.fillText(s, w / 2, 210 + i * 92));
      g.fillStyle = "#8a6a3a"; g.fillRect(170, 610, w - 340, 4);
      g.fillStyle = "#3a2d1a"; g.font = "44px NotoSerifSC"; g.fillText("IS. NEWTON", w / 2, 720);
      g.font = "700 110px NotoSerifSC"; g.fillText("1687", w / 2, 950);
      g.font = "38px NotoSC"; g.fillStyle = "#7a6440"; g.textAlign = "right"; g.fillText("图为示意", w - 50, h - 50);
    });
    const edgeM = new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 0.9 }), coverM = new THREE.MeshStandardMaterial({ color: 0x4a2a1c, roughness: 0.6 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.8, 0.42), [edgeM, coverM, edgeM, edgeM, new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.9, color: 0x8f8778 }), coverM]);
    book.position.set(-4.7, 0.55, 0.8); book.rotation.set(rad(-4), rad(28), rad(3)); scene.add(book);
    setCam([0, 0.8, 14.5], [0, 0.6, 0]);
    html(`<div class="qf"><div class="k">牛顿 · 《自然哲学的数学原理》· 附注</div><div class="qt serif">${NEWTON.join("<br>")}</div></div>`);
  }
  chrome({ name: "天文台黄铜", mode: "#c8b48a", tag: "color:#f0d9a6;border-color:#a8874c;background:#141c2ce0", mark: "#c8b48a", note: "#c9d2df", cap: "#fffaf0", fade: "#070d1af0" });
  return { bloom: [0.32, 0.45, 0.95] };
}

// ══════════ C · 手稿与光：斜放的黑板、射灯、粉笔灰；钟从黑板上浮出来 ══════════
function sceneC() {
  scene.background = new THREE.Color(0x0c0c0b);
  scene.environmentIntensity = 0.12;
  scene.add(new THREE.HemisphereLight(0xfff1df, 0x0c0c0b, 0.2));
  const spot = new THREE.SpotLight(0xffd8ad, 2.6, 0, rad(26), 0.9, 0); spot.position.set(-6, 8, 11); spot.castShadow = true;
  spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0004; spot.shadow.radius = 6; scene.add(spot);
  const BW = 18, BH = 10.125, PX = 2048, PY = 1152;
  const at = (px, py, z = 0) => new THREE.Vector3((px / PX - 0.5) * BW, (0.5 - py / PY) * BH, z);
  const board = new THREE.Group(); board.position.set(0.4, 0.55, 0); board.rotation.y = rad(-14); scene.add(board);
  spot.target = board;
  const tex = canvasTex(PX, PY, (g, w, h) => {
    g.fillStyle = "#1f1e1b"; g.fillRect(0, 0, w, h);
    const r = rng(5); // 擦痕
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(240,236,226,${0.012 + r() * 0.03})`; g.lineWidth = 40 + r() * 110; g.lineCap = "round"; g.beginPath(); const y = r() * h, x = r() * w * 0.6; g.moveTo(x, y); g.bezierCurveTo(x + 300, y - 40 + r() * 80, x + 700, y - 40 + r() * 80, x + 900 + r() * 500, y + r() * 60 - 30); g.stroke(); }
    const chalk = "#d6d0c3", orange = "#e98a3c";
    chalkify(g, w, h, 9, (x) => {
      x.fillStyle = chalk; x.strokeStyle = chalk; x.lineCap = "round"; x.lineJoin = "round";
      if (K === "main") {
        x.font = "150px CascadiaMono"; x.fillText("t += dt", 170, 330);
        x.strokeStyle = orange; x.lineWidth = 18; x.beginPath(); x.moveTo(150, 288); x.bezierCurveTo(380, 276, 600, 300, 830, 282); x.stroke();
        x.lineWidth = 8; x.beginPath(); x.moveTo(160, 310); x.bezierCurveTo(390, 298, 610, 322, 820, 304); x.stroke();
        x.fillStyle = chalk; x.font = "64px WenKai"; x.fillText("牛顿：全宇宙一只钟", 200, 460);
        x.strokeStyle = chalk; x.lineWidth = 7; x.beginPath(); x.moveTo(720, 560); x.bezierCurveTo(880, 700, 1000, 700, 1090, 620); x.stroke();
        x.beginPath(); x.moveTo(1052, 606); x.lineTo(1094, 618); x.lineTo(1072, 658); x.stroke();
        x.save(); x.translate(1180, 210); x.rotate(-0.04); x.font = "62px WenKai"; x.fillText("每个实例，自带一只钟", 0, 0); x.restore();
        x.font = "60px WenKai"; x.fillText("地面", 1290, 850);
        x.fillText("卫星：每天快约", 1520, 660); x.fillStyle = orange; x.fillText("38 微秒", 1640, 740);
      } else {
        x.font = "118px WenKai"; NEWTON.forEach((s, i) => x.fillText(s, 230, 330 + i * 190));
        x.strokeStyle = orange; x.lineWidth = 12; x.beginPath(); x.moveTo(470, 548); x.bezierCurveTo(640, 540, 860, 556, 1065, 544); x.stroke();
        x.fillStyle = chalk; x.font = "68px WenKai"; x.fillText("—— 牛顿《原理》，1687", 1150, 880);
      }
    });
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }));
  face.receiveShadow = true; board.add(face);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.7 });
  for (const [x, y, w, h] of [[0, BH / 2 + 0.18, BW + 0.72, 0.36], [0, -BH / 2 - 0.18, BW + 0.72, 0.36], [-BW / 2 - 0.18, 0, 0.36, BH], [BW / 2 + 0.18, 0, 0.36, BH]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), wood); b.position.set(x, y, 0.05); b.castShadow = b.receiveShadow = true; board.add(b); }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(BW * 0.8, 0.14, 0.55), wood); tray.position.set(0, -BH / 2 - 0.3, 0.38); tray.castShadow = tray.receiveShadow = true; board.add(tray);
  const sticks = [[-5.2, 0xf3efe6, 0.2], [-4.4, 0xffa552, -0.3], [3.8, 0xf3efe6, 0.5]];
  for (const [x, col, rz] of sticks) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.75, 16), new THREE.MeshStandardMaterial({ color: col, roughness: 1 })); s.rotation.set(0, 0, Math.PI / 2 + rz * 0.2); s.position.set(x, -BH / 2 - 0.16, 0.42); s.castShadow = true; board.add(s); }
  const slate = new THREE.MeshStandardMaterial({ color: 0x2a2926, roughness: 0.9 });
  const chalkM = new THREE.MeshStandardMaterial({ color: 0xefe9dd, roughness: 1, emissive: 0xefe9dd, emissiveIntensity: 0.02 });
  const orangeM = new THREE.MeshStandardMaterial({ color: 0xffa552, roughness: 0.8, emissive: 0xffa552, emissiveIntensity: 0.25 });
  const cface = (seed) => faceTex({ tick: "#d9d3c6", major: "#f3efe6", chalk: true, seed });
  if (K === "main") {
    const c1 = clock({ r: 1.3, body: slate, rim: chalkM, face: cface(3), hand: chalkM, sec: 0, secMat: chalkM, shadow: true });
    c1.position.copy(at(1350, 600, 1.1)); board.add(c1);
    const c2 = clock({ r: 1.0, body: slate, rim: chalkM, face: cface(4), hand: chalkM, sec: 22, secMat: orangeM, shadow: true });
    c2.position.copy(at(1790, 470, 1.7)); board.add(c2); c2.add(diffArc(1.0, 22, orangeM, 0.08));
  } else {
    const c = clock({ r: 0.95, body: slate, rim: chalkM, face: cface(6), hand: chalkM, sec: 90, secMat: orangeM, shadow: true });
    c.position.copy(at(1760, 560, 1.3)); board.add(c);
  }
  // 射灯里的粉笔灰
  const r = rng(21), dp = new Float32Array(320 * 3);
  for (let i = 0; i < 320; i++) { const t = r(); dp.set([-6 + t * 6 + (r() - 0.5) * 3, 8 - t * 7.5 + (r() - 0.5) * 2, 11 - t * 9 + (r() - 0.5) * 2], i * 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dp, 3));
  scene.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffe3c2, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })));
  setCam([3.4, 0.5, 19.5], [0.7, 0.25, 0]);
  chrome({ name: "手稿与光", mode: "#bdb5a6", tag: "color:#ffc68a;border-color:#a86a32;background:#1d1712e0", mark: "#bdb5a6", note: "#cfc8ba", cap: "#fffaf0", fade: "#0c0c0bf2" });
  return { bloom: [0.22, 0.4, 0.95] };
}

const { bloom } = { a: sceneA, b: sceneB, c: sceneC }[D]();
const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
const composer = new EffectComposer(renderer, rt);
composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), ...bloom));
composer.addPass(new OutputPass());
composer.render();
window.__done = true;
