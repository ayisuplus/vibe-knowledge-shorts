// 绘图基元：3D 钟、代码编辑器面板（canvas 贴图：打字、删除线、红波浪线、提示框、光标）、《原理》书、引文面板、光柱。
// 所有基元都是「给状态 → 画出来」，状态由各段按 t 算好再传进来；贴图只在内容变化时重画。
import * as THREE from "three";
import { COL, canvasTex } from "./world.js";

const rad = (d) => (d * Math.PI) / 180;
const MONO = "CascadiaMono", SANS = "NotoSC", SERIF = "NotoSerifSC";
const hasCJK = (s) => /[　-鿿＀-￯]/.test(s);

// ── 3D 钟：机身＋表圈＋表盘贴图＋时分秒针。sec / min 为角度（度，12 点为 0，顺时针）──
export function clock(world, { r = 1, depth = 0.16, rim = COL.teal, body = 0x0d1a26, face = "#0d1a26", tick = "#5fb8a6", major = "#9fe9d8", hand = COL.white, glow = 0.9 } = {}) {
  const grp = new THREE.Group();
  const d = r * depth;
  const rimM = new THREE.MeshStandardMaterial({ color: rim, emissive: rim, emissiveIntensity: glow, transparent: true });
  const bodyM = new THREE.MeshStandardMaterial({ color: body, metalness: 0.7, roughness: 0.32, transparent: true });
  const handM = new THREE.MeshStandardMaterial({ color: hand, emissive: hand, emissiveIntensity: 0.5, transparent: true });
  const secM = rimM;
  const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, d, 128), bodyM);
  bodyMesh.rotation.x = Math.PI / 2; grp.add(bodyMesh);
  const rimMesh = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.045, 32, 160), rimM);
  rimMesh.position.z = d / 2; grp.add(rimMesh);
  const F = canvasTex(world, 1024, 1024);
  const faceM = new THREE.MeshStandardMaterial({ map: F.t, transparent: true, roughness: 0.6 });
  const faceMesh = new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 128), faceM);
  faceMesh.position.z = d / 2 + 0.003; grp.add(faceMesh);
  let faceSig = "";
  function drawFace(ticks = 60, label = "") {
    const sig = ticks + "|" + label; if (sig === faceSig) return; faceSig = sig;
    const g = F.g, c = 512;
    g.clearRect(0, 0, 1024, 1024);
    g.fillStyle = face; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2, m = i % (ticks / 12) === 0;
      const r1 = c * (m ? 0.78 : 0.86 + 0.04 * (ticks > 60 ? (i % (ticks / 60) === 0 ? 0 : 1) : 0)), r2 = c * 0.93;
      g.strokeStyle = m ? major : tick; g.lineWidth = m ? 14 : Math.max(2.6, 6 * Math.sqrt(60 / ticks)); g.lineCap = "round";
      g.beginPath(); g.moveTo(c + r1 * Math.sin(a), c - r1 * Math.cos(a)); g.lineTo(c + r2 * Math.sin(a), c - r2 * Math.cos(a)); g.stroke();
    }
    if (label) { g.fillStyle = major; g.font = `600 64px ${SANS}`; g.textAlign = "center"; g.fillText(label, c, c + 250); }
    F.t.needsUpdate = true;
  }
  drawFace();
  const pivots = {};
  const mk = (name, len, wid, mat, z) => {
    const p = new THREE.Group(); p.position.z = d / 2 + z;
    const geo = new THREE.BoxGeometry(wid, len * 1.18, r * 0.02); geo.translate(0, len * 0.41, 0);
    p.add(new THREE.Mesh(geo, mat)); grp.add(p); pivots[name] = p;
  };
  mk("hour", r * 0.48, r * 0.075, handM, 0.02);
  mk("min", r * 0.72, r * 0.05, handM, 0.04);
  mk("sec", r * 0.86, r * 0.018, secM, 0.06);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.055, r * 0.055, r * 0.03, 32), secM);
  cap.rotation.x = Math.PI / 2; cap.position.z = d / 2 + 0.075; grp.add(cap);
  const mats = [rimM, bodyM, handM, faceM];
  for (const m of mats) m.fog = false;     // 远处的大钟要穿过雾发光
  world.scene.add(grp);
  return {
    g: grp, r, rimM, drawFace,
    set({ sec = 0, min = 60, hour = 305, alpha = 1, glow: gl } = {}) {
      pivots.sec.rotation.z = -rad(sec); pivots.min.rotation.z = -rad(min); pivots.hour.rotation.z = -rad(hour);
      for (const m of mats) m.opacity = alpha;
      if (gl !== undefined) rimM.emissiveIntensity = gl;
      grp.visible = alpha > 0.002;
    },
  };
}

// ── 代码编辑器面板 ──
// 状态：{ title, lines:[{ segs:[[文字,颜色],…], typed(可见字数), strike(0–1), squig(0–1), hl(0–1), dim(0–1) }], caret:[行, 亮?], tip:{text,k}, search:{q,res,k} }
export function codePanel(world, { w = 6.6, px = 1600, py = 1080 } = {}) {
  const T = canvasTex(world, px, py);
  const h = (w * py) / px;
  const mat = new THREE.MeshBasicMaterial({ map: T.t, transparent: true, toneMapped: false, color: 0xd8d8d8 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), new THREE.LineBasicMaterial({ color: 0x3f8f80, transparent: true }));
  mesh.add(edge);
  world.scene.add(mesh);
  const LH = 100, X0 = 180, Y0 = 228;
  let sig = "";
  function segFont(s) { return hasCJK(s) ? `52px ${SANS}` : `58px ${MONO}`; }
  function draw(st) {
    const s = JSON.stringify(st); if (s === sig) return; sig = s;
    const g = T.g;
    g.clearRect(0, 0, px, py);
    g.beginPath(); g.roundRect(4, 4, px - 8, py - 8, 34); g.fillStyle = "rgba(11,17,29,.93)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#2f4a63"; g.stroke();
    g.fillStyle = "#2d4257"; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(56 + i * 40, 62, 12, 0, 7); g.fill(); }
    g.font = `40px ${MONO}`; g.fillStyle = "#6f8ea0"; g.textAlign = "left"; g.fillText(st.title || "universe.js", 200, 76);
    g.fillStyle = "#22344a"; g.fillRect(4, 122, px - 8, 3);
    (st.lines || []).forEach((ln, i) => {
      const y = Y0 + i * LH;
      if (ln.hl > 0) { g.fillStyle = `rgba(127,240,210,${0.12 * ln.hl})`; g.fillRect(8, y - 66, px - 16, 90); }
      g.globalAlpha = 1 - 0.62 * (ln.dim || 0);
      g.fillStyle = "#3e566b"; g.font = `52px ${MONO}`; g.textAlign = "right"; g.fillText(String(i + 1), 130, y); g.textAlign = "left";
      let x = X0, left = 0, x0 = null, budget = ln.typed ?? 1e9;
      for (const [txt, col] of ln.segs) {
        if (budget <= 0) break;
        const part = txt.slice(0, budget); budget -= txt.length;
        g.font = segFont(txt); g.fillStyle = col;
        if (x0 === null && part.trim()) { const lead = part.length - part.trimStart().length; x0 = x + g.measureText(part.slice(0, lead)).width; }
        g.fillText(part, x, y); x += g.measureText(part).width;
      }
      left = x;
      if (st.caret && st.caret[0] === i && st.caret[1]) { g.fillStyle = "#7ff0d2"; g.fillRect(left + 6, y - 50, 26, 62); }
      if (x0 !== null && ln.strike > 0) {
        g.save(); g.strokeStyle = "#ffb454"; g.shadowColor = "#ffb454"; g.shadowBlur = 24; g.lineWidth = 8; g.lineCap = "round";
        g.beginPath(); g.moveTo(x0 - 12, y - 18); g.lineTo(x0 - 12 + (left - x0 + 24) * ln.strike, y - 18); g.stroke(); g.restore();
      }
      if (x0 !== null && ln.squig > 0) {
        g.save(); g.strokeStyle = "#ff6b6b"; g.lineWidth = 4; g.beginPath();
        const end = x0 + (left - x0) * ln.squig;
        for (let xx = x0; xx <= end; xx += 3) { const yy = y + 18 + 6 * Math.sin((xx - x0) / 9); xx === x0 ? g.moveTo(xx, yy) : g.lineTo(xx, yy); }
        g.stroke(); g.restore();
      }
      g.globalAlpha = 1;
    });
    if (st.tip && st.tip.k > 0) {
      g.globalAlpha = st.tip.k;
      g.font = `600 44px ${SANS}`; const tw = g.measureText(st.tip.text).width + 70;
      const bx = px - tw - 60, by = py - 150;
      g.beginPath(); g.roundRect(bx, by, tw, 86, 18); g.fillStyle = "rgba(42,16,18,.95)"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#ff6b6b"; g.stroke();
      g.fillStyle = "#ffb3a8"; g.fillText(st.tip.text, bx + 35, by + 58); g.globalAlpha = 1;
    }
    if (st.search && st.search.k > 0) {
      g.globalAlpha = st.search.k;
      const bx = px - 700, by = 150;
      g.beginPath(); g.roundRect(bx, by, 640, 96, 16); g.fillStyle = "rgba(20,32,46,.97)"; g.fill(); g.lineWidth = 3; g.strokeStyle = "#3f8f80"; g.stroke();
      g.font = `52px ${MONO}`; g.fillStyle = "#e8f0f2"; g.fillText(st.search.q, bx + 34, by + 66);
      g.font = `600 40px ${SANS}`; g.fillStyle = st.search.res.startsWith("0") ? "#ff9b8f" : "#9fc2c9"; g.textAlign = "right"; g.fillText(st.search.res, bx + 610, by + 62); g.textAlign = "left";
      g.globalAlpha = 1;
    }
    T.t.needsUpdate = true;
  }
  // 面板局部坐标（像素）→ 面板上的 3D 点，用来给 HUD 标签定位
  const anchor = (x, y) => new THREE.Vector3((x / px - 0.5) * w, (0.5 - y / py) * h, 0).applyMatrix4(mesh.matrixWorld);
  return {
    mesh, draw, anchor, LH, X0, Y0,
    alpha(a) { mat.opacity = a; edge.material.opacity = a; mesh.visible = a > 0.002; },
  };
}

// ── 《原理》书：有厚度的一本书，正面是扉页（图为示意）──
export function book(world) {
  const T = canvasTex(world, 900, 1200);
  const g = T.g, w = 900, h = 1200;
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#efe4c9"); gr.addColorStop(1, "#d6c294"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(90,67,32,.06)"; for (let y = 0; y < h; y += 11) g.fillRect(0, y, w, 1);
  g.fillStyle = "#3a2d1a"; g.textAlign = "center"; g.font = `700 54px ${SERIF}`;
  ["PHILOSOPHIÆ", "NATURALIS", "PRINCIPIA", "MATHEMATICA"].forEach((s, i) => g.fillText(s, w / 2, 210 + i * 92));
  g.fillStyle = "#8a6a3a"; g.fillRect(170, 610, w - 340, 4);
  g.fillStyle = "#3a2d1a"; g.font = `44px ${SERIF}`; g.fillText("IS. NEWTON", w / 2, 720);
  g.font = `700 110px ${SERIF}`; g.fillText("1687", w / 2, 950);
  g.font = `38px ${SANS}`; g.fillStyle = "#7a6440"; g.textAlign = "right"; g.fillText("图为示意", w - 50, h - 50);
  T.t.needsUpdate = true;
  const page = new THREE.MeshStandardMaterial({ map: T.t, roughness: 0.9, color: 0xd8d0c0, transparent: true, emissiveMap: T.t, emissive: 0xffffff, emissiveIntensity: 0.22 });
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xcfc4a8, roughness: 0.9, transparent: true });
  const cover = new THREE.MeshStandardMaterial({ color: 0x1d2a36, roughness: 0.6, metalness: 0.2, transparent: true });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(3.0, 4.0, 0.36), [edgeM, cover, edgeM, edgeM, page, cover]);
  world.scene.add(mesh);
  const mats = [page, edgeM, cover];
  return { mesh, alpha(a) { for (const m of mats) m.opacity = a; mesh.visible = a > 0.002; } };
}

// ── 引文面板：牛顿附注逐行亮起；k2 时底部长出 `const t = GLOBAL;` ──
export function quotePanel(world, lines) {
  const px = 2000, py = 1200, w = 8.4;
  const T = canvasTex(world, px, py);
  const mat = new THREE.MeshBasicMaterial({ map: T.t, transparent: true, toneMapped: false, color: 0xdedede });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * py) / px), mat);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, (w * py) / px)), new THREE.LineBasicMaterial({ color: 0x3f8f80, transparent: true }));
  mesh.add(edge); world.scene.add(mesh);
  let sig = "";
  function draw(k, k2) {
    const s = `${k.toFixed(3)}|${k2.toFixed(3)}`; if (s === sig) return; sig = s;
    const g = T.g;
    g.clearRect(0, 0, px, py);
    g.beginPath(); g.roundRect(4, 4, px - 8, py - 8, 40); g.fillStyle = "rgba(11,17,29,.94)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#2f4a63"; g.stroke();
    g.font = `44px ${MONO}`; g.fillStyle = "#5d7d8e"; g.textAlign = "left"; g.fillText("/* 1687 · 牛顿《自然哲学的数学原理》· 附注 */", 110, 150);
    g.save(); g.fillStyle = "#ffb454"; g.shadowColor = "#ffb454"; g.shadowBlur = 20; g.fillRect(110, 230, 8, 480 * Math.min(1, k * 1.15)); g.restore();
    g.font = `800 100px ${SERIF}`;
    lines.forEach((ln, i) => {
      const a = Math.max(0, Math.min(1, k * lines.length - i));
      if (a <= 0) return;
      g.globalAlpha = a; g.fillStyle = "#ffffff"; g.fillText(ln, 170, 330 + i * 160);
    });
    g.globalAlpha = k2;
    g.font = `52px ${MONO}`; let x = 110; const y = 900;
    for (const [t, col] of [["const", "#ffb454"], [" t = ", "#d7e4ea"], ["GLOBAL", "#7ff0d2"], [";  ", "#d7e4ea"]]) { g.fillStyle = col; g.fillText(t, x, y); x += g.measureText(t).width; }
    g.font = `48px ${SANS}`; g.fillStyle = "#5d7d8e"; g.fillText("// 全宇宙共用一只钟", x, y);
    g.globalAlpha = 1;
    T.t.needsUpdate = true;
  }
  return { mesh, draw, alpha(a) { mat.opacity = a; edge.material.opacity = a; mesh.visible = a > 0.002; } };
}

// ── 光柱：从网格深处升起的一束光（加色）──
export function beam(world, { r = 0.5, h = 30, color = COL.teal } = {}) {
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { k: { value: 0 }, col: { value: new THREE.Color(color) } },
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: "uniform float k;uniform vec3 col;varying vec2 vUv;void main(){float e=1.-abs(vUv.x-.5)*2.;float a=pow(e,3.)*(1.-vUv.y)*k;gl_FragColor=vec4(col*a,a);}",
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, h), m);   // 竖直平面，每帧转向镜头
  mesh.geometry.translate(0, h / 2, 0);
  world.scene.add(mesh);
  return {
    mesh,
    set(k) {
      m.uniforms.k.value = k; mesh.visible = k > 0.002;
      const c = world.camera.position; mesh.rotation.y = Math.atan2(c.x - mesh.position.x, c.z - mesh.position.z);
    },
  };
}

// ── 小钟：大量使用（每个实例一只），共用一张表盘贴图，几何简化；始终面向镜头 ──
let miniFace = null;
export function miniClock(world, { r = 0.32, color = COL.teal, glow = 0.9 } = {}) {
  if (!miniFace) {
    const F = canvasTex(world, 256, 256), g = F.g, c = 128;
    g.fillStyle = "#0d1a26"; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.strokeStyle = "#9fe9d8"; g.lineWidth = 7; g.beginPath(); g.moveTo(c + c * 0.72 * Math.sin(a), c - c * 0.72 * Math.cos(a)); g.lineTo(c + c * 0.9 * Math.sin(a), c - c * 0.9 * Math.cos(a)); g.stroke(); }
    F.t.needsUpdate = true; miniFace = F.t;
  }
  const grp = new THREE.Group();
  const rimM = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow, transparent: true });
  const faceM = new THREE.MeshBasicMaterial({ map: miniFace, transparent: true, toneMapped: false, color: 0xbfbfbf });
  const handM = new THREE.MeshBasicMaterial({ color: 0xe8f0f2, transparent: true });
  grp.add(new THREE.Mesh(new THREE.CircleGeometry(r * 0.97, 40), faceM));
  grp.add(new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.07, 8, 48), rimM));
  const sec = new THREE.Group(); sec.position.z = 0.01;
  const sg = new THREE.PlaneGeometry(r * 0.06, r * 0.86); sg.translate(0, r * 0.36, 0);
  sec.add(new THREE.Mesh(sg, rimM)); grp.add(sec);
  const min = new THREE.Group(); min.position.z = 0.008;
  const mg = new THREE.PlaneGeometry(r * 0.1, r * 0.66); mg.translate(0, r * 0.27, 0);
  min.add(new THREE.Mesh(mg, handM)); min.rotation.z = -rad(60); grp.add(min);
  world.scene.add(grp);
  const mats = [rimM, faceM, handM];
  return {
    g: grp, rimM,
    set({ sec: s = 0, alpha = 1, glow: gl, face = true } = {}) {
      sec.rotation.z = -rad(s);
      for (const m of mats) m.opacity = alpha;
      if (gl !== undefined) rimM.emissiveIntensity = gl;
      grp.visible = alpha > 0.002;
      if (face) grp.quaternion.copy(world.camera.quaternion);
    },
  };
}

// ── 辉光精灵（闪光、光点）──
let glowTex = null;
export function glowSprite(world, { size = 4, color = COL.teal } = {}) {
  if (!glowTex) {
    const F = canvasTex(world, 256, 256), g = F.g;
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,.45)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); F.t.needsUpdate = true; glowTex = F.t;
  }
  const m = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); world.scene.add(s);
  return { s, set(k, sz) { m.opacity = k; s.visible = k > 0.002; if (sz) s.scale.setScalar(sz); } };
}

// ── 通用 canvas 面板：paint(g, w, h) 只在 sig 变化时重画 ──
export function canvasPlane(world, { px = 1024, py = 512, w = 4, basic = true, edge = false } = {}) {
  const T = canvasTex(world, px, py);
  const h = (w * py) / px;
  const mat = basic ? new THREE.MeshBasicMaterial({ map: T.t, transparent: true, toneMapped: false, side: THREE.DoubleSide })
                    : new THREE.MeshStandardMaterial({ map: T.t, transparent: true, roughness: 0.8 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  let edgeL = null;
  if (edge) { edgeL = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), new THREE.LineBasicMaterial({ color: 0x3f8f80, transparent: true })); mesh.add(edgeL); }
  world.scene.add(mesh);
  let sig = null;
  return {
    mesh, w, h,
    paint(s, fn) { if (s === sig) return; sig = s; T.g.clearRect(0, 0, px, py); fn(T.g, px, py); T.t.needsUpdate = true; },
    alpha(a) { mat.opacity = a; if (edgeL) edgeL.material.opacity = a; mesh.visible = a > 0.002; },
    anchor: (x, y) => new THREE.Vector3((x / px - 0.5) * w, (0.5 - y / py) * h, 0).applyMatrix4(mesh.matrixWorld),
  };
}
