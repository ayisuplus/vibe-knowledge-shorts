// 魔方：26 个小块（黑色塑料圆角块 + 发光贴纸）+ 十字轴。
// 转动和 01-调研/tools/cube.py 同一套记号（x 右、y 上、z 朝前；U/D/R/L/F/B，M 随 L、E 随 D、S 随 F）。
// 状态由「从复原开始依次做完哪些步、当前这步转了多少」每帧重新算出，可任意跳帧。
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// 标准六色（白顶绿前红右），调得略亮、略饱和，当霓虹用；红偏暖，不往洋红走
export const COLORS = { W: 0xe4e8ee, Y: 0xffd21a, R: 0xe8283a, O: 0xff6a10, B: 0x1f6bff, G: 0x18c25f };
// 自发光按颜色打折：白、黄本来就亮，辉光一大就糊成一片
const GLOWK = { W: 0.22, Y: 0.42, R: 0.95, O: 0.8, B: 1.0, G: 0.8 };
const FACE = [ // 法向 → 颜色
  [[0, 1, 0], "W"], [[0, -1, 0], "Y"], [[0, 0, 1], "G"], [[0, 0, -1], "B"], [[1, 0, 0], "R"], [[-1, 0, 0], "O"],
];
// 记号 → [轴, 层, 顺时针对应的右手转动次数]；层 null = 整体转（x/y/z）
const MOVES = { U: [1, 1, -1], D: [1, -1, 1], R: [0, 1, -1], L: [0, -1, 1], F: [2, 1, -1], B: [2, -1, 1], M: [0, 0, 1], E: [1, 0, 1], S: [2, 0, -1],
  x: [0, null, -1], y: [1, null, -1], z: [2, null, -1] };
const AX = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];

export function parse(seq) {
  return seq.trim().split(/\s+/).filter(Boolean).map((tok) => {
    const [axis, layer, k] = MOVES[tok[0]];
    const n = tok.endsWith("2") ? 2 : tok.endsWith("'") ? -1 : 1;
    return { tok, axis, layer, q: k * n }; // q：右手四分之一圈数
  });
}
export const invert = (seq) => seq.trim().split(/\s+/).reverse().map((t) => (t.endsWith("2") ? t : t.endsWith("'") ? t[0] : t + "'")).join(" ");

/** 把一串公式排到时间轴上：t0 起，每步 d 秒（半圈 ×1.35），步间隔 gap */
export function schedule(seq, t0, d = 0.32, gap = 0.04) {
  let t = t0;
  return parse(seq).map((m) => { const dd = Math.abs(m.q) === 2 ? d * 1.35 : d; const r = { ...m, t0: t, d: dd }; t += dd + gap; return r; });
}
export const endOf = (sch) => (sch.length ? sch[sch.length - 1].t0 + sch[sch.length - 1].d : 0);

// 缓动：转动的手感（快起、轻微回弹）
const turnEase = (x) => { x = Math.min(1, Math.max(0, x)); const s = 1.25; const y = x - 1; return 1 + y * y * ((s + 1) * y + s); };

function stickerGeo(size, r) {
  const s = size / 2, sh = new THREE.Shape();
  sh.moveTo(-s + r, -s); sh.lineTo(s - r, -s); sh.quadraticCurveTo(s, -s, s, -s + r); sh.lineTo(s, s - r); sh.quadraticCurveTo(s, s, s - r, s);
  sh.lineTo(-s + r, s); sh.quadraticCurveTo(-s, s, -s, s - r); sh.lineTo(-s, -s + r); sh.quadraticCurveTo(-s, -s, -s + r, -s);
  const g = new THREE.ShapeGeometry(sh, 6);
  // ShapeGeometry 的 uv 是形状坐标，改成 0..1，贴图才能铺满
  const uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + s) / size, (pos.getY(i) + s) / size);
  return g;
}

// 「霓虹灯板」贴纸：亮边框 + 暗一些的中心 + 细扫描线，像一块块 LED 面板
function ledTexture(hex) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const g = cv.getContext("2d"), c = new THREE.Color(hex);
  const rgb = (k, a = 1) => `rgba(${Math.round(c.r * 255 * k)},${Math.round(c.g * 255 * k)},${Math.round(c.b * 255 * k)},${a})`;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = rgb(1); rr(0, 0, 256, 256, 40); g.fill();
  const gr = g.createLinearGradient(0, 18, 0, 238); gr.addColorStop(0, rgb(0.62)); gr.addColorStop(1, rgb(0.3));
  g.fillStyle = gr; rr(18, 18, 220, 220, 26); g.fill();
  g.fillStyle = "rgba(0,0,0,0.16)"; for (let y = 22; y < 236; y += 7) g.fillRect(20, y, 216, 2);
  g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 3; rr(20, 20, 216, 216, 24); g.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/**
 * look：base 原样 / core 缝里透出内核的光 / led 霓虹灯板贴纸 / glass 黑玻璃机身 + 高光贴纸
 */
export function buildCube({ glow = 0.55, look = "base" } = {}) {
  const root = new THREE.Group();
  const body = look.includes("glass")
    ? new THREE.MeshPhysicalMaterial({ color: 0x05070b, roughness: 0.05, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.4 })
    : look.includes("led") ? new THREE.MeshPhysicalMaterial({ color: 0x07090c, roughness: 0.55, metalness: 0.1, clearcoat: 0.3 })
    : new THREE.MeshPhysicalMaterial({ color: 0x0b0d11, roughness: 0.32, metalness: 0.0, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const boxGeo = new RoundedBoxGeometry(0.97, 0.97, 0.97, 4, 0.11);
  const stGeo = stickerGeo(0.82, 0.13);
  const mats = {};
  for (const [, c] of FACE) {
    if (look.includes("led")) {
      const tex = ledTexture(COLORS[c]);
      mats[c] = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.1 * (0.55 + 0.45 * GLOWK[c]), roughness: 0.35 });
    } else if (look.includes("glass")) {
      mats[c] = new THREE.MeshPhysicalMaterial({ color: COLORS[c], emissive: COLORS[c], emissiveIntensity: glow * GLOWK[c] * 0.8, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8 });
    } else {
      mats[c] = new THREE.MeshStandardMaterial({ color: COLORS[c], emissive: COLORS[c], emissiveIntensity: glow * GLOWK[c], roughness: 0.28, metalness: 0.05 });
    }
  }
  const cubies = [], allSticker = [];
  let glowNow = glow;
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    if (!x && !y && !z) continue;
    const g = new THREE.Group();
    // 每块用自己的材质副本，才能单独变暗 / 高亮（交换子那一段）
    const myBody = body.clone(); g.add(new THREE.Mesh(boxGeo, myBody));
    const myMats = [{ m: myBody, base: myBody.color.clone(), emi: 0, c: null }];
    const stickers = [];
    for (const [n, c] of FACE) {
      const nv = new THREE.Vector3(...n);
      if (nv.x * x + nv.y * y + nv.z * z !== 1) continue; // 只有朝外的面贴纸
      const sm = mats[c].clone(); allSticker.push([c, sm]); myMats.push({ m: sm, base: sm.color.clone(), c });
      const m = new THREE.Mesh(stGeo, sm);
      m.position.copy(nv).multiplyScalar(0.487);
      m.lookAt(nv.clone().multiplyScalar(2));
      g.add(m); stickers.push(m);
    }
    const kind = [x, y, z].filter((v) => v !== 0).length; // 1 中心 2 棱 3 角
    g.userData = { home: new THREE.Vector3(x, y, z), kind, stickers, mats: myMats };
    root.add(g); cubies.push(g);
  }
  // 十字轴：三根发光的圆柱 + 中心球（爆炸时才看得见）
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x0d1820, emissive: 0x38e8ff, emissiveIntensity: 1.6, roughness: 0.4 });
  const core = new THREE.Group();
  for (let a = 0; a < 3; a++) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.1, 20), coreMat);
    if (a === 0) c.rotation.z = Math.PI / 2; if (a === 2) c.rotation.x = Math.PI / 2;
    core.add(c);
  }
  core.add(new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), coreMat));
  root.add(core);
  // 内核光：一块藏在里面的亮盒子，只能从小块之间的缝里透出来；一转层，缝张开，光就漏出来
  const glowBox = new THREE.Mesh(new THREE.BoxGeometry(2.72, 2.72, 2.72), new THREE.MeshBasicMaterial({ toneMapped: false }));
  glowBox.material.color.setRGB(0.2, 0.62, 0.8);
  glowBox.visible = look.includes("core");
  root.add(glowBox);

  const q = new THREE.Quaternion(), qa = new THREE.Quaternion(), p = new THREE.Vector3();
  /**
   * 设置这一帧的样子。
   * sch：schedule() 排好的步骤（可以把多段拼起来，按 t0 排序）；t：当前时刻
   * explode：0 = 合拢，1 = 完全炸开；spread：每块额外外移的倍数
   */
  function pose(sch, t, { explode = 0, spread = 1.1, kinds = null, post = null } = {}) {
    // 先回到复原
    const st = cubies.map((c) => ({ pos: c.userData.home.clone(), quat: new THREE.Quaternion() }));
    for (const m of sch) {
      if (t < m.t0) break;
      const k = Math.min(1, (t - m.t0) / m.d);
      const full = k >= 1;
      const ang = (Math.PI / 2) * m.q * (full ? 1 : turnEase(k));
      qa.setFromAxisAngle(AX[m.axis], ang);
      for (const s of st) {
        const c = Math.round(s.pos.getComponent(m.axis));
        if (m.layer !== null && c !== m.layer) continue;
        s.pos.applyQuaternion(qa); s.quat.premultiply(qa);
        if (full) s.pos.set(Math.round(s.pos.x), Math.round(s.pos.y), Math.round(s.pos.z));
      }
      if (!full) break; // 当前这步还没转完，后面的都没开始
    }
    cubies.forEach((c, i) => {
      const s = st[i];
      p.copy(s.pos).multiplyScalar(1 + explode * spread * (c.userData.kind === 1 ? 0.55 : 1));
      c.position.copy(p); c.quaternion.copy(s.quat);
      c.visible = !kinds || kinds.includes(c.userData.kind);
      if (post) post(c, i); // 单块的额外效果：飞入、拔出一个角块……
    });
    core.visible = explode > 0.02;
    if (look.includes("core")) glowBox.visible = explode < 0.02;
    core.scale.setScalar(0.7 + 0.3 * explode);
  }
  function setGlow(v) { glowNow = v; for (const [c, m] of allSticker) m.emissiveIntensity = v * GLOWK[c] * (m.userData.dimK ?? 1); }
  /** 单块变暗：k=0 原样，k=1 几乎全黑 */
  function dim(c, k) {
    for (const o of c.userData.mats) {
      o.m.color.copy(o.base).multiplyScalar(1 - 0.85 * k);
      if (o.c) { o.m.userData.dimK = 1 - 0.9 * k; o.m.emissiveIntensity = glowNow * GLOWK[o.c] * o.m.userData.dimK; }
    }
  }
  pose([], 0);
  return { root, cubies, core, glowBox, pose, setGlow, dim, mats };
}
