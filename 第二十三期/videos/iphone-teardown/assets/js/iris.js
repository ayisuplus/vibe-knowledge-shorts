// 主摄模组与六叶片可变光圈（F-5～F-8）。单位：厘米，开孔尺寸按真实比例。
// 叶片绕外侧圆孔转动，沿中间弧形槽里的销滑动；磁力驱动的具体结构未公开，磁铁位置是示意。
import * as THREE from "three";
import { M, PBR, add, grp, box, cyl, ring, ex, rr, root } from "./world.js";

const RP = .44, EDGE = .2;         // 转轴到中心、转轴到叶片直边的距离
export const phiOf = (a) => Math.acos((EDGE + a) / RP);   // 开孔半径 a 对应的叶片转角

export const stage = grp(root);    // 跟着世界放大的枢轴
export const sFlip = grp(stage);   // 模组翻转：+z 是进光面
export const housing = grp(sFlip);
add(housing, box(2.2, 2.2, .1, .06), M.dark, 0, 0, -.5);
for (const [x, y, w, h] of [[0, 1.08, 2.2, .06], [0, -1.08, 2.2, .06], [-1.08, 0, .06, 2.2], [1.08, 0, .06, 2.2]]) add(housing, new THREE.BoxGeometry(w, h, .95), M.dark, x, y, 0);
export const hsTop = grp(sFlip, 0, 0, .5);
{ const s = rr(2.2, 2.2, .1); const h = new THREE.Path(); h.absarc(0, 0, .58, 0, Math.PI * 2, true); s.holes.push(h); add(hsTop, ex(s, .08, .01), M.plate); add(hsTop, ring(.62, .54, .16), M.steel, 0, 0, .05); }

// 传感器与下方镜片
const sensor = add(sFlip, box(.92, .7, .03, .005), PBR({ color: 0x1a2a2c, metalness: .6, roughness: .22, clearcoat: 1 }), 0, 0, -.44);
const lensMat = PBR({ color: 0xb8d0d8, metalness: 0, roughness: .05, transparent: true, opacity: .2, clearcoat: 1, clearcoatRoughness: .04, depthWrite: false });
const lensDisc = (r) => { const R = r * 1.6, th = Math.asin(1 / 1.6), g = new THREE.SphereGeometry(R, 48, 12, 0, Math.PI * 2, 0, th); g.rotateX(Math.PI / 2); g.translate(0, 0, -R * Math.cos(th)); return g; };
export const sensorGlow = new THREE.MeshBasicMaterial({ color: 0xfff1d8, transparent: true, opacity: 0, depthWrite: false, fog: false });
{ const m = new THREE.Mesh(new THREE.CircleGeometry(.36, 64), sensorGlow); m.position.z = -.42; sFlip.add(m); }
for (const [z, r] of [[-.12, .32], [-.26, .36]]) { const e = add(sFlip, lensDisc(r), lensMat, 0, 0, z); e.castShadow = false; add(sFlip, ring(r + .03, r, .05), M.black, 0, 0, z); }
// 上方镜片：会被拆走
export const uppers = [[.14, .34], [.26, .36], [.38, .4]].map(([z, r], i) => { const g = grp(sFlip, 0, 0, z); const e = add(g, lensDisc(r), lensMat, 0, 0, 0); e.castShadow = false; add(g, ring(r + .04, r, .05), M.black); g.userData = { z, i }; return g; });

// 光圈基座：黑色底环、定销
export const iris = grp(sFlip);
add(iris, ring(.72, .3, .018), M.dark, 0, 0, -.022);
// 驱动环：带磁铁，转动时拨动叶片
export const drive = grp(iris);
add(drive, ring(.7, .58, .02), M.plate, 0, 0, .002);
for (const a of [Math.PI * .25, Math.PI * 1.25]) add(drive, box(.2, .1, .04, .01), PBR({ color: 0xa8acb2, metalness: 1, roughness: .28 }), .64 * Math.cos(a), .64 * Math.sin(a), .018).rotation.z = a + Math.PI / 2;
export const MAG_A = [.64 * Math.cos(Math.PI * .25), .64 * Math.sin(Math.PI * .25), .03];

// 叶片。局部坐标：x 轴指向开孔，直边在 x = EDGE
const PIN_R = .14;
function bladeGeo() {
  const s = new THREE.Shape(); s.moveTo(EDGE, .3); s.lineTo(EDGE, -.74); s.quadraticCurveTo(-.02, -.68, -.15, -.32); s.quadraticCurveTo(-.2, .02, -.13, .14); s.quadraticCurveTo(-.02, .3, EDGE, .3);
  const h = new THREE.Path(); h.absarc(0, 0, .022, 0, Math.PI * 2, true); s.holes.push(h);
  // 弧形槽：以转轴为圆心，转动时销在槽里滑
  const a0 = -80 * Math.PI / 180, a1 = -24 * Math.PI / 180, w = .012, sl = new THREE.Path(); sl.absarc(0, 0, PIN_R + w, a0, a1, false); sl.absarc(0, 0, PIN_R - w, a1, a0, true); sl.closePath(); s.holes.push(sl);
  return new THREE.ExtrudeGeometry(s, { depth: .007, bevelEnabled: false, curveSegments: 24 });
}
const geoB = bladeGeo();
export const BLADES = [];
for (let i = 0; i < 6; i++) {
  const a = i * Math.PI / 3, g = new THREE.Group(); iris.add(g);
  const m = add(g, geoB, M.blade); m.position.z = -.0035;
  add(g, cyl(.02, .02, .018, 16), M.steel);
  const px = RP * Math.cos(a), py = RP * Math.sin(a);
  add(iris, cyl(.024, .024, .04, 20), M.steel, px, py, -.006);       // 转轴
  const pinA = a + Math.PI - 20 * Math.PI / 180;
  add(iris, cyl(.009, .009, .03, 12), M.gold, px + PIN_R * Math.cos(pinA), py + PIN_R * Math.sin(pinA), .004);  // 槽里的销
  BLADES.push({ g, a, px, py });
}
export const irisCover = grp(iris, 0, 0, .05);
add(irisCover, ring(.72, .5, .02), M.plate);

// 光束：进光量的直观演示
export const beamMat = new THREE.ShaderMaterial({ uniforms: { uO: { value: 0 } }, transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: "varying float vZ; varying vec3 vN,vV; void main(){ vZ=position.z+.5; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }", fragmentShader: "uniform float uO; varying float vZ; varying vec3 vN,vV; void main(){ float f=pow(abs(dot(normalize(vN),normalize(vV))),1.6); float a=smoothstep(1.,.25,vZ)*f*uO; gl_FragColor=vec4(vec3(1.,.94,.82)*a,a); }" });
export const beam = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 48, 1, true).rotateX(Math.PI / 2), beamMat); beam.castShadow = false; iris.add(beam);

// 头发丝：比例参照，直径约 0.07 毫米
export const hair = add(sFlip, new THREE.CylinderGeometry(.0035, .0035, 1.6, 12).rotateZ(Math.PI / 2), PBR({ color: 0x1a120c, roughness: .55 }));
hair.visible = false;
