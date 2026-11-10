// iPhone 18 Pro 的结构模型。单位：厘米。屏幕朝 +z，后背朝 -z。
// 尺寸与已核实的部分按调研档案（F-1～F-3、F-10、F-14）；其余位置是示意，片中标注。
import * as THREE from "three";
import { M, PBR, add, grp, box, rr, ex, cyl, root, textPlane } from "./world.js";
import { hash, mix } from "./lib.js";

export const PW = 7.19, PH = 15, PR = 1.15;
export const flipper = grp(root);          // 整机翻转：拆解中的零件都挂在这里
export const phone = grp(flipper);         // 机身与不离开机身的零件

// 中框与内壁
{
  const f = rr(PW, PH, PR); f.holes.push(rr(PW - .34, PH - .34, PR - .17)); add(phone, ex(f, .86, .05), M.body);
  add(phone, ex(rr(PW - .3, PH - .3, PR - .15), .06, .01), M.dark, 0, 0, -.34);
  for (const [x, y, l] of [[-PW / 2 - .02, 3.1, 1.3], [-PW / 2 - .02, 4.7, .9], [PW / 2 + .02, 3.9, 2.0]]) add(phone, box(.1, l, .34, .05), M.steel, x, y, 0);
  add(phone, box(1.0, .12, .3, .05), M.black, 0, -PH / 2 - .005, 0);
  for (let i = 0; i < 5; i++) { add(phone, box(.32, .09, .16, .04), M.black, 1.2 + i * .42, -PH / 2 - .005, 0); add(phone, box(.32, .09, .16, .04), M.black, -1.2 - i * .42, -PH / 2 - .005, 0); }
}

// 镜头表面
const lensCanvas = document.createElement("canvas"); lensCanvas.width = lensCanvas.height = 512;
{ const g = lensCanvas.getContext("2d"), r = g.createRadialGradient(256, 256, 8, 256, 256, 256); r.addColorStop(0, "#020304"); r.addColorStop(.42, "#07121c"); r.addColorStop(.56, "#0f3c55"); r.addColorStop(.64, "#06090d"); r.addColorStop(.84, "#14161a"); r.addColorStop(1, "#050506"); g.fillStyle = r; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(255,190,120,.3)"; g.lineWidth = 2; for (const q of [96, 150, 212]) { g.beginPath(); g.arc(256, 256, q, 0, 7); g.stroke(); } }
const lensTex = new THREE.CanvasTexture(lensCanvas); lensTex.colorSpace = THREE.SRGBColorSpace; lensTex.anisotropy = 16;
const lensGlass = PBR({ map: lensTex, metalness: 0, roughness: .14, clearcoat: .25, clearcoatRoughness: .08, envMapIntensity: .22, specularIntensity: .25 });
function lens(parent, x, y, z, r) { add(parent, cyl(r, r * 1.03, .22, 72), M.steel, x, y, z); add(parent, new THREE.TorusGeometry(r * .94, r * .06, 16, 96), M.body, x, y, z + .11); add(parent, new THREE.CircleGeometry(r * .88, 72), lensGlass, x, y, z + .12); }

// 后背：横贯的相机台 ＋ 下方的玻璃面板（面板可以掀开，内侧嵌着线圈）
export const plateau = grp(phone, 0, 5.5, -.5); plateau.rotation.y = Math.PI;
add(plateau, ex(rr(PW - .06, 4.0, .9), .16, .04), M.body);
for (const [x, y, r] of [[-2.34, .92, .68], [-2.34, -.92, .68], [-.85, 0, .68]]) lens(plateau, x, y, .1, r);
add(plateau, new THREE.CircleGeometry(.2, 32), PBR({ color: 0xf0e0c0, roughness: .22, clearcoat: 1 }), 1.9, 1.0, .09);
add(plateau, new THREE.CircleGeometry(.17, 32), PBR({ color: 0x08090b, roughness: .1, clearcoat: 1 }), 1.9, -.9, .09);
export const LENS_POINT = [-2.34, 6.42, .72];
export const panel = grp(flipper, 0, -1.85, -.39);
add(panel, ex(rr(PW - .4, 10.7, .85), .06, .012), M.glass);
add(panel, ex(rr(PW - .6, 10.5, .75), .012, .002), PBR({ color: 0x14171b, metalness: .4, roughness: .52 }), 0, 0, .035);
{ const pts = []; for (let i = 0; i <= 900; i++) { const a = i / 900 * Math.PI * 2 * 12, r = 1.1 + i / 900 * 1.45; pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), .06)); } add(panel, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 2400, .035, 6), M.copper); }
// 面板接缝：解锁前跑一圈的细线
export const seamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.16, .82, 1).multiplyScalar(1.3), transparent: true, fog: false });
const seamCurve = new THREE.CatmullRomCurve3(rr(PW - .4, 10.7, .85).getSpacedPoints(120).map((p) => new THREE.Vector3(p.x, p.y, -.035)), true, "catmullrom", .15);
export const seam = add(panel, new THREE.TubeGeometry(seamCurve, 500, .01, 8, true), seamMat); seam.castShadow = seam.receiveShadow = false; seam.userData.full = seam.geometry.index.count;

// 屏幕：铰链在靠音量键一侧（iFixit：屏幕排线靠近音量键）
export const door = grp(flipper, -PW / 2 + .1, 0, .39);
export const screen = grp(door, (PW - .2) / 2);
add(screen, ex(rr(PW - .2, PH - .2, PR - .1), .08, .012), PBR({ color: 0x050608, metalness: .1, roughness: .12, clearcoat: 1, clearcoatRoughness: .05 }));
add(screen, ex(rr(PW - .5, PH - .5, PR - .25), .02, .002), M.white, 0, 0, -.05);
add(screen, ex(rr(PW - .9, PH - .9, PR - .4), .02, .002), M.dark, 0, 0, -.06);
const dispC = document.createElement("canvas"); dispC.width = 1024; dispC.height = 2136;
{
  const g = dispC.getContext("2d"), v = g.createLinearGradient(0, 0, 0, 2136); v.addColorStop(0, "#14181d"); v.addColorStop(.55, "#3a2a1a"); v.addColorStop(1, "#7a4a1c"); g.fillStyle = v; g.fillRect(0, 0, 1024, 2136);
  g.fillStyle = "#f4f1ea"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = "800 300px NotoSC"; g.fillText("01:00", 512, 560);
}
const dispT = new THREE.CanvasTexture(dispC); dispT.colorSpace = THREE.SRGBColorSpace; dispT.anisotropy = 16;
export const display = new THREE.Mesh(new THREE.ShapeGeometry(rr(PW - .34, PH - .34, PR - .17)), new THREE.MeshBasicMaterial({ map: dispT, transparent: true, opacity: 0, fog: false }));
{ const uv = display.geometry.attributes.uv, pos = display.geometry.attributes.position; for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (PW - .34) + .5, pos.getY(i) / (PH - .34) + .5); }
display.position.z = .043; screen.add(display);
add(screen, ex(rr(1.5, .4, .2), .004, 0), M.black, 0, 6.7, .046);

// 屏幕排线：从主板拉到屏幕
export const flex = add(phone, new THREE.BoxGeometry(.7, .01, 1), M.ribbon, -3, 3.4, .1);

// 电池托盘（13 颗螺丝）
export const tray = grp(flipper, 0, -1.7, -.1);
add(tray, box(6.2, 8.7, .05, .02), M.steel);
for (const [x, y, w, h] of [[0, 4.33, 6.2, .06], [0, -4.33, 6.2, .06], [-3.08, 0, .06, 8.7], [3.08, 0, .06, 8.7]]) add(tray, new THREE.BoxGeometry(w, h, .12), M.steel, x, y, .05);
export const battery = grp(tray, 0, 0, .23);
add(battery, box(5.95, 8.4, .38, .12), M.dark);
const cellMat = new THREE.ShaderMaterial({
  vertexShader: "varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }",
  fragmentShader: "varying vec2 vU; void main(){ float l=fract(vU.x*22.), band=smoothstep(.0,.1,abs(l-.5)-.08), sheen=.75+.25*sin(vU.x*22.*3.14159); gl_FragColor=vec4(vec3(.2,.205,.215)*band*sheen+vec3(.03),1.); }",
});
const cell = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 8.05), cellMat); cell.position.z = .195; battery.add(cell);
export const lid = add(battery, box(5.85, 8.3, .05, .02), M.foil, 0, 0, .215);
for (const [x, y, w, h, m] of [[0, 4.08, 5.75, .12, M.dark], [0, -4.08, 5.75, .12, M.dark], [-2.84, 0, .1, 7.9, M.dark], [2.84, 0, .1, 7.9, M.dark], [-1.7, 3, 1.5, .5, M.black], [1.6, -3.1, 1.1, .4, M.black]]) add(lid, new THREE.BoxGeometry(w, h, .012), m, x, y, .03);
add(battery, box(1.9, .3, .1, .02), M.black, 1, 4.34, .05);
for (const x of [.5, 1.5]) add(battery, new THREE.BoxGeometry(.36, .26, .03), M.steel, x, 4.27, .13);
const SP = [[-2.7, 2.9], [0, 2.9], [2.7, 2.9], [-2.7, -6.2], [0, -6.2], [2.7, -6.2], [-3.2, -.2], [-3.2, -3.2], [-3.2, 1.6], [3.2, -.2], [3.2, -3.2], [3.2, 1.6], [1.75, 2.9]];
export const SCREWS = SP.map(([x, y], i) => { const g = grp(flipper, x, y, .28); add(g, cyl(.13, .13, .1, 24), M.dark); add(g, new THREE.BoxGeometry(.17, .03, .02), M.black, 0, 0, .055); g.userData = { x, y, k: i }; return g; });

// 底部一排：马达、接口、扬声器；接口的排线沿侧边一路上到主板（F：iFixit）
export const taptic = grp(phone, -1.85, -6.8, .02);
add(taptic, box(2.5, 1.05, .1, .04), M.dark, 0, 0, -.14);
for (const [x, y, w, h] of [[0, .49, 2.5, .07], [0, -.49, 2.5, .07], [-1.22, 0, .07, 1.05], [1.22, 0, .07, 1.05]]) add(taptic, new THREE.BoxGeometry(w, h, .3), M.steel, x, y, 0);
export const tMass = grp(taptic);
add(tMass, box(.95, .72, .24, .03), PBR({ color: 0x7e8388, metalness: 1, roughness: .42 }));
add(tMass, new THREE.BoxGeometry(.6, .03, .02), M.black, 0, 0, .125);
const zig = (sgn) => { const g = grp(taptic, sgn * 1.19, 0, 0); for (const y of [-.2, .2]) { const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(-sgn * i / 8, y + (i === 0 || i === 8 ? 0 : (i % 2 ? .11 : -.11)), 0)); add(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "catmullrom", .08), 80, .02, 8), M.steel); } return g; };
export const springs = [zig(1), zig(-1)];
export const tLid = add(taptic, box(2.5, 1.05, .05, .02), M.plate, 0, 0, .17);
// 旧式偏心转子，只作对比
export const rotor = grp(taptic, 0, 0, .28);
export const rotorMats = [new THREE.MeshPhysicalMaterial({ color: 0x9aa0a6, metalness: 1, roughness: .4, transparent: true, opacity: 0 }), new THREE.MeshPhysicalMaterial({ color: 0x8e8878, metalness: 1, roughness: .46, transparent: true, opacity: 0 })];
add(rotor, new THREE.CylinderGeometry(.05, .05, 1, 24).rotateZ(Math.PI / 2), rotorMats[0]);
export const rotorW = grp(rotor, .45);
{ const s = new THREE.Shape(); s.absarc(0, 0, .2, 0, Math.PI, false); s.closePath(); const m = add(rotorW, new THREE.ExtrudeGeometry(s, { depth: .26, bevelEnabled: false, curveSegments: 24 }), rotorMats[1], -.13, 0, 0); m.rotation.y = Math.PI / 2; }

add(phone, box(1.1, .55, .4, .08), M.steel, .05, -6.85, 0);
add(phone, box(.75, .22, .2, .05), M.black, .05, -7.0, .01);
const speaker = grp(phone, 2.1, -6.8, .02);
add(speaker, box(2.1, .95, .22, .06), M.dark, 0, 0, -.04);
for (let i = 0; i < 7; i++) add(speaker, new THREE.BoxGeometry(1.75, .05, .06), M.steel, 0, -.33 + i * .11, .1);
add(phone, box(.26, 9.6, .02, .01), M.ribbon, 3.28, -1.7, -.2);
// 前置相机模块：不用螺丝和胶（iFixit）
add(phone, box(2.1, .7, .3, .08), M.dark, -.1, 6.65, -.05);
for (const x of [-.6, .35]) { add(phone, cyl(.17, .17, .08, 32), M.black, x, 6.65, .13); }
// 另外两颗后摄的模组（从正面看到的是它们的背）
add(phone, box(1.5, 1.55, .5, .08), M.dark, 2.2, 3.85, -.05);
add(phone, box(1.45, 1.5, .5, .08), M.dark, .9, 4.6, -.05);

// 中框固定点
for (const [x, y] of [[-3.15, 7.05], [3.15, 7.05], [-3.2, -7], [3.2, -7]]) { add(phone, cyl(.13, .13, .08, 20), M.steel, x, y, -.1); add(phone, new THREE.BoxGeometry(.17, .03, .02), M.black, x, y, -.055); }

// ── 主板叠层：可绕芯片的竖轴翻转。A20 Pro 在板的外侧（局部 -z），贴着均热板；内存在它旁边（F-10）──
export const D_LOCAL = [-1.35, 5.1];
export const stack = grp(flipper, D_LOCAL[0], D_LOCAL[1], 0);
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
{
  // 板形：左上一大块，沿相机下方伸到右侧。坐标先写成机身坐标，再减去芯片位置
  const s = new THREE.Shape(), o = D_LOCAL, m = (x, y) => [x - o[0], y - o[1]];
  s.moveTo(...m(-3.3, 3)); s.lineTo(...m(3.2, 3)); s.lineTo(...m(3.2, 3.05)); s.lineTo(...m(1, 3.05)); s.lineTo(...m(.1, 3.3)); s.lineTo(...m(.1, 7.3)); s.lineTo(...m(-3.0, 7.3)); s.lineTo(...m(-3.3, 6.9)); s.closePath();
  add(stack, ex(s, .1, .01), pcbMat);
  const bx = (x, y) => [x - o[0], y - o[1]];
  // 朝屏幕一面的元件
  for (let i = 0; i < 12; i++) { const [x, y] = bx(mix(-3, -.1, hash(i + 40)), mix(3.3, 7, hash(i + 80))); add(stack, box(.34 + .3 * hash(i), .3 + .25 * hash(i + 3), .08, .02), i % 3 ? M.black : M.dark, x, y, .09); }
  const caps = new THREE.InstancedMesh(new THREE.BoxGeometry(.13, .07, .07), M.gold, 40), mt = new THREE.Matrix4();
  for (let i = 0; i < 40; i++) { const [x, y] = bx(mix(-3.1, -.05, hash(i * 1.3 + 90)), mix(3.2, 7.1, hash(i * 2.7 + 11))); mt.makeRotationZ(i % 3 ? 0 : Math.PI / 2); mt.setPosition(x, y, .085); caps.setMatrixAt(i, mt); }
  caps.castShadow = true; stack.add(caps);
  // 朝后背一面：芯片、内存和一圈小元件
  for (let i = 0; i < 26; i++) { const a = hash(i * 1.9) * 6.283, r = 1.45 + 1.1 * hash(i * 3.3), x = r * Math.cos(a), y = r * Math.sin(a); if (x > 1.35 || x < -1.9 || y > 2.1 || y < -1.9) continue; add(stack, box(.12 + .3 * hash(i), .1 + .24 * hash(i + 9), .07, .015), i % 4 ? M.black : M.gold, x, y, -.085); }
}
export const pkgBase = add(stack, box(1.7, 1.7, .08, .02), M.black, 0, 0, -.09);
export const pkgL = add(stack, box(.85, 1.66, .05, .01), M.dark, -.425, 0, -.155), pkgR = add(stack, box(.85, 1.66, .05, .01), M.dark, .425, 0, -.155);
export const memory = add(stack, box(.9, 1.5, .1, .02), M.black, -1.35, 0, -.1);
add(stack, new THREE.BoxGeometry(.7, .01, .01), M.gold, -1.35, .55, -.152);
// 均热板 ＋ 贴片。面积覆盖大半个机身（F：iFixit、Apple），铜色只用来和主板区分
export const vc = grp(stack, 1.35, -2.4, -.3);
{
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d"); g.fillStyle = "#54463a"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(24,14,8,.6)"; g.lineWidth = 3; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, i * 32); g.lineTo(512, i * 32); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 5);
  add(vc, ex(rr(6.2, 9.6, .6), .06, .012), PBR({ map: t, color: 0x8f8880, metalness: .75, roughness: .64 }));
}
export const pad = add(vc, box(1.5, 1.5, .04, .01), PBR({ color: 0x8c8473, metalness: 0, roughness: .9 }), -1.35, 2.4, .05);
// 指甲盖比例：只画轮廓，不画一只手
export const nail = grp(root);
{
  const s = rr(1.25, 1.35, .55), mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.95, .78, .65), transparent: true, opacity: .22, depthWrite: false, fog: false });
  const m = new THREE.Mesh(new THREE.ShapeGeometry(s), mat); nail.add(m); nail.userData.fill = mat;
  const lmat = new THREE.LineBasicMaterial({ color: new THREE.Color(1, .9, .78), transparent: true, opacity: 1, fog: false }); const pts = s.getSpacedPoints(80).map((p) => new THREE.Vector3(p.x, p.y, .002)); nail.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), lmat)); nail.userData.line = lmat;
}
phone.traverse((o) => { if (o.material?.isMeshBasicMaterial) o.castShadow = o.receiveShadow = false; });
