// 3D 道具：报警器、齿轮、发动机、解药瓶、面包机、拼图、价签、旧报纸。只建一次，状态由 sections.js 每帧设置。
import * as THREE from "three";
import { clamp, easeOut, hash, mix } from "./lib.js";

export const M = {
  cream: new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: .42, metalness: .1 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: .32, metalness: .95 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: .55, metalness: .5 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x57524b, roughness: .38, metalness: .9 }),
  amber: new THREE.MeshStandardMaterial({ color: 0x8a5a1a, roughness: .18, metalness: .25 }),
  red: new THREE.MeshStandardMaterial({ color: 0xb8180f, roughness: .3, metalness: .2, emissive: 0x500805 }),
};

// ── 报警器：零件飞来组装（asm），沿轴炸开（explode），中央藏着大红按钮 ──
export function mkAlarm(w) {
  const g = new THREE.Group(), led = new THREE.MeshStandardMaterial({ color: 0xff2a1c, emissive: 0xff2010, emissiveIntensity: 2, roughness: .3 });
  const part = (geo, mat, rotX = Math.PI / 2, z = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = rotX; m.rotation.z = rz; const p = new THREE.Group(); p.add(m); p.userData.z = z; g.add(p); return p; };
  const P = [
    part(new THREE.CylinderGeometry(2.4, 2.55, .45, 96), M.cream, Math.PI / 2, 0),
    part(new THREE.TorusGeometry(2.42, .1, 24, 128), M.steel, 0, .24),
    part(new THREE.CylinderGeometry(1.72, 1.72, .12, 96), M.dark, Math.PI / 2, .28),
    part(new THREE.TorusGeometry(1.72, .07, 20, 128), M.steel, 0, .36),
    part(new THREE.CylinderGeometry(.82, .92, .3, 64), M.steel, Math.PI / 2, .42),
    part(new THREE.SphereGeometry(.56, 48, 32), led, 0, .55),
  ];
  for (let i = 0; i < 6; i++) P.push(part(new THREE.TorusGeometry(2.06, .1, 12, 32, 1.28), M.dark, 0, .28, i / 6 * Math.PI * 2 + .2));
  // 爆炸图里露出来的按钮
  const btn = new THREE.Group();
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, .5, 64), M.red); cap.rotation.x = Math.PI / 2; btn.add(cap);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, .22, 64), M.dark); base.rotation.x = Math.PI / 2; base.position.z = -.3; btn.add(base);
  g.add(btn); w.reg(g);
  return {
    g, led, btn, cap,
    /** asmAt：组装开始的拍；explode：0 合拢，1 炸开；press：按钮按下程度 */
    set(n, { x = 0, y = 0, z = 0, s = 1, rx = 0, ry = 0, rz = 0, lit = 1, asmAt = null, explode = 0, button = 0, press = 0 }) {
      g.visible = true; g.position.set(x, y, z); g.scale.setScalar(s); g.rotation.set(rx, ry, rz);
      P.forEach((p, i) => {
        p.visible = true;
        let px = 0, py = 0, pz = p.userData.z, pr = [0, 0, 0];
        if (asmAt !== null) {
          const st = asmAt + i * .34, u = easeOut((n - st) / 1.5), a = hash(i + 3) * 6.28, far = 1 - u;
          px = far * 11 * Math.cos(a); py = far * 8 * Math.sin(a); pz += far * (hash(i + 9) * 18 - 9); pr = [far * 5 * hash(i), far * 7 * hash(i + 1), far * 4];
          p.visible = n > st - .05;
        }
        pz += explode * (i > 5 ? 1.4 : (i - 1.6) * 1.05);
        p.position.set(px, py, pz); p.rotation.set(...pr);
      });
      btn.visible = button > .01; btn.scale.setScalar(button); btn.position.z = 1.4 + explode * 3.4; cap.position.z = -.22 * press;
      led.emissiveIntensity = lit * lit * 7; led.color.setRGB(mix(.08, 1, clamp(lit)), mix(.015, .16, clamp(lit)), mix(.012, .11, clamp(lit)));
    },
  };
}

// ── 齿轮：挤出的真 3D，中央挖孔 ──
export function gearGeo(R, teeth, depth = .46) {
  const s = new THREE.Shape(), q = R * .84, d = Math.PI / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i / teeth * Math.PI * 2;
    for (const [r, th] of [[q, a - d * .95], [q, a - d * .5], [R, a - d * .34], [R, a + d * .34], [q, a + d * .5]]) { const x = r * Math.cos(th), y = r * Math.sin(th); if (i === 0 && th === a - d * .95) s.moveTo(x, y); else s.lineTo(x, y); }
  }
  s.closePath();
  const h = new THREE.Path(); h.absarc(0, 0, R * .3, 0, Math.PI * 2, true); s.holes.push(h);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .05, bevelSize: .04, bevelSegments: 2, curveSegments: 24 }); g.translate(0, 0, -depth / 2); return g;
}
export function mkEngine(w, labels) {
  const g = new THREE.Group(), geo = gearGeo(1.62, 14);
  const G4 = [[-1.5, 1.45, 0, 1], [1.5, 1.45, 1, -1], [1.5, -1.45, 2, 1], [-1.5, -1.45, 3, -1]].map(([x, y, i, d]) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const m = new THREE.Mesh(geo, i % 2 ? M.steel : M.iron); p.add(m);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .6, 48), M.dark); hub.rotation.x = Math.PI / 2; p.add(hub);
    const l = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3 * labels[i].height / labels[i].width), w.basic(w.tex(labels[i]))); l.position.z = .34; p.add(l);
    p.userData = { d, m }; g.add(p); return p;
  });
  const body = new THREE.Group(); g.add(body);
  const box = (sx, sy, sz, x, y, z, mat = M.iron) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); body.add(m); return m; };
  box(7.8, .4, 1.1, 0, 3.6, 0); box(7.8, .4, 1.1, 0, -3.6, 0); box(.4, 7.6, 1.1, -3.7, 0, 0); box(.4, 7.6, 1.1, 3.7, 0, 0); box(7.4, 7.2, .2, 0, 0, -.75, M.dark);
  const fly = new THREE.Mesh(gearGeo(3, 22, .7), M.steel); fly.position.set(-7.8, -.2, 0); body.add(fly);
  const flyHub = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, .9, 48), M.dark); flyHub.rotation.x = Math.PI / 2; flyHub.position.copy(fly.position); body.add(flyHub);
  box(4.6, .14, .2, -4.9, 2.2, .2, M.dark).rotation.z = -.24; box(4.6, .14, .2, -4.9, -2.3, .2, M.dark).rotation.z = .3;
  const PIST = [5.6, 7.6].map((x) => {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, 6.4, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a3630, roughness: .4, metalness: .9, side: THREE.DoubleSide, transparent: true, opacity: .42 })); tube.position.set(x, .4, 0); body.add(tube);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(.76, .76, 1.1, 40), M.steel); head.position.x = x; body.add(head);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 3.2, 16), M.iron); rod.position.x = x; body.add(rod);
    return { head, rod };
  });
  box(1.8, .3, .4, 4.6, -2.6, 0); box(1.2, .24, .3, 4, 2, 0, M.dark);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.6, .72, 3, 32), M.iron); pipe.position.set(2.6, 5.3, 0); body.add(pipe);
  w.reg(g);
  return {
    g, body, G4, pipeTop: new THREE.Vector3(2.6, 6.9, 0),
    set(ang, body01 = 1) {
      g.visible = true; body.visible = body01 > .01;
      G4.forEach((p) => { p.userData.m.rotation.z = p.userData.d * ang + (p.userData.d < 0 ? Math.PI / 14 : 0); });
      fly.rotation.z = ang * .55;
      PIST.forEach(({ head, rod }, i) => { const y = .6 + 1.4 * Math.sin(ang * 2 + i * Math.PI); head.position.y = y; rod.position.y = y - 2.1; });
    },
  };
}

export function mkBottle(w) {
  const pts = [[0, 0], [1.05, 0], [1.2, .15], [1.2, 2.6], [1.05, 3.1], [.48, 3.75], [.42, 4.5], [0, 4.5]].map(([x, y]) => new THREE.Vector2(x, y));
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), M.amber); body.position.y = -2.2; g.add(body);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(1.215, 1.215, 1.7, 64, 1, true), M.cream); label.position.y = -.9; g.add(label);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .55, 32), M.dark); cap.position.y = 2.5; g.add(cap);
  return w.reg(g);
}

export function mkToaster(w) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 2.4), M.steel); g.add(b);
  const bread = new THREE.MeshStandardMaterial({ color: 0x5a3213, roughness: .9 });
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, .3), bread), s2 = s1.clone(); s1.position.set(0, .9, .45); s2.position.set(0, .9, -.45); g.add(s1, s2);
  const lever = new THREE.Mesh(new THREE.BoxGeometry(.5, .3, .3), M.dark); lever.position.set(2.65, .4, 0); g.add(lever);
  g.userData = { s1, s2 };
  return w.reg(g);
}

// ── 拼图：挤出，能在 3D 里扣上 ──
export function mkPuzzle(w, str, side, color, textColor) {
  const s = new THREE.Shape(), hw = 2.6, hh = 1.6, r = .55;
  if (side < 0) { s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, -r); s.absarc(hw, 0, r, -Math.PI / 2, Math.PI / 2, false); s.lineTo(hw, hh); s.lineTo(-hw, hh); }
  else { s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.lineTo(-hw, r); s.absarc(-hw, 0, r, Math.PI / 2, -Math.PI / 2, true); }
  s.closePath();
  const g = new THREE.Group(), geo = new THREE.ExtrudeGeometry(s, { depth: .6, bevelEnabled: true, bevelThickness: .06, bevelSize: .05, bevelSegments: 2, curveSegments: 24 }); geo.translate(0, 0, -.3);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: .4, metalness: .15, emissive: color, emissiveIntensity: .05 });
  g.add(new THREE.Mesh(geo, mat));
  const c = w.textCanvas(str, { size: 150, color: textColor }), l = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * c.width / c.height, 1.5), w.basic(w.tex(c))); l.position.set(side < 0 ? -.3 : .25, 0, .4); g.add(l);
  g.userData.mat = mat;
  return w.reg(g);
}

// ── 贴图：价签正反面、旧报纸、开源项目页 ──
function tagShape(g, fill, hole) {
  g.fillStyle = fill; g.beginPath(); g.moveTo(90, 0); g.lineTo(620, 0); g.lineTo(620, 330); g.lineTo(90, 330); g.lineTo(0, 165); g.closePath(); g.fill();
  g.fillStyle = hole; g.beginPath(); g.arc(62, 165, 22, 0, 7); g.fill();
}
export function tagTextures(w) {
  const mk = (draw) => { const c = document.createElement("canvas"); c.width = 620; c.height = 330; draw(c.getContext("2d")); return w.tex(c); };
  const front = mk((g) => { tagShape(g, "#b8180f", "#f2e6cc"); g.fillStyle = "#fff4dc"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 68px NotoSerifSC"; g.fillText("限时课程", 350, 108); g.font = "900 104px NotoSerifSC"; g.fillText("¥ ???", 350, 226); });
  const back = mk((g) => { tagShape(g, "#f2e8cf", "#b9a678"); g.fillStyle = "#14703f"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "900 170px NotoSerifSC"; g.fillText("免费", 350, 170); });
  return { front, back };
}
/** 一张两面的价签，flip 是绕 y 轴的角度 */
export function mkTag(w, T, width) {
  const g = new THREE.Group(), h = width * 330 / 620;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: T.front, transparent: true, toneMapped: false, alphaTest: .05 })); g.add(f);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(width, h), new THREE.MeshBasicMaterial({ map: T.back, transparent: true, toneMapped: false, alphaTest: .05 })); b.rotation.y = Math.PI; b.position.z = -.01; g.add(b);
  return w.reg(g);
}
export function paperTexture(w, seed) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 680; const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 60, 680); gr.addColorStop(0, "#efe2c3"); gr.addColorStop(1, "#cdb88c"); g.fillStyle = gr; g.fillRect(0, 0, 512, 680);
  g.strokeStyle = "#5c4522"; g.lineWidth = 6; g.strokeRect(20, 20, 472, 640);
  g.fillStyle = "#2b2110"; g.fillRect(50, 50, 412, 66);
  for (let i = 0; i < 4; i++) { g.fillStyle = "#6a5530"; const w0 = 180 + hash(seed + i) * 220; g.fillRect(50, 150 + i * 36, w0, 16); }
  g.fillStyle = "rgba(168,31,20,.85)"; g.fillRect(50, 330, 200 + 120 * hash(seed + 9), 70);
  for (let i = 0; i < 5; i++) { g.fillStyle = "#6a5530"; g.fillRect(50, 430 + i * 40, 150 + hash(seed + i + 20) * 262, 16); }
  return w.tex(c);
}
export function projectPageCanvas(w) {
  const c = document.createElement("canvas"); c.width = 1320; c.height = 840; const g = c.getContext("2d");
  g.fillStyle = "#101418"; g.fillRect(0, 0, 1320, 840); g.strokeStyle = "#5f7380"; g.lineWidth = 8; g.strokeRect(6, 6, 1308, 828);
  g.fillStyle = "#1c242b"; g.fillRect(6, 6, 1308, 76); for (const [x, col] of [[50, "#ff5f56"], [100, "#ffbd2e"], [150, "#27c93f"]]) { g.fillStyle = col; g.beginPath(); g.arc(x, 44, 16, 0, 7); g.fill(); }
  g.fillStyle = "#f4f7f9"; g.font = "900 96px NotoSC"; g.textBaseline = "middle"; g.fillText("某个开源项目", 70, 180);
  g.strokeStyle = "#43c97f"; g.lineWidth = 6; g.strokeRect(70, 262, 500, 92); g.fillStyle = "#6ff0a6"; g.font = "800 56px NotoSC"; g.fillText("开源 · 免费使用", 100, 312);
  for (let i = 0; i < 6; i++) { g.fillStyle = "#3f4c56"; g.beginPath(); g.roundRect(70, 410 + i * 62, 500 + hash(i + 1) * 620, 26, 13); g.fill(); }
  return c;
}
