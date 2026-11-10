// 涂装：给要上漆的网格各配一个「漆面孪生体」，两者用同一个世界平面裁切：x > X 显示漆面，x < X 显示碳纤维。
// X 从车头扫到车尾，就是「一次刷满整车」。漆面在着色器里按车身坐标程序化上色，标志从两张贴花贴图投影上去。
// 用户 2026-11-09 决定直接使用 F1 与赞助商商标（风险自担）。标志用文字字标近似绘制，未下载官方矢量文件；
// 排布按印象，未逐一对照比赛照片（见 BRIEF.md）。
import * as THREE from "three";

const NAVY = "#18224a", RED = "#d8102c", YEL = "#ffc906";
const X0 = -28, X1 = 28, Y1 = 11, Z1 = 10;   // 贴花覆盖范围（车身坐标）
const PX = 2048, PY = Math.round(PX * Y1 / (X1 - X0)), PZ = Math.round(PX * 2 * Z1 / (X1 - X0));
const toU = (x) => (x - X0) / (X1 - X0) * PX;

function sun(g, cx, cy, r) { g.fillStyle = YEL; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill(); }
function bull(g, cx, cy, s, dir) { // 简化的冲撞公牛剪影（示意）
  g.save(); g.translate(cx, cy); g.scale(dir * s, s); g.fillStyle = RED; g.beginPath();
  g.moveTo(-1, .2); g.quadraticCurveTo(-.6, -.55, .25, -.45); g.lineTo(.75, -.75); g.lineTo(.62, -.38); g.quadraticCurveTo(1.05, -.2, .95, .12);
  g.lineTo(.6, .1); g.lineTo(.45, .5); g.lineTo(.3, .5); g.lineTo(.32, .15); g.lineTo(-.45, .2); g.lineTo(-.65, .55); g.lineTo(-.8, .5); g.lineTo(-.75, .2); g.closePath(); g.fill(); g.restore();
}
/** 在 [x0,x1]×[y0,y1]（车身坐标）里画一个元素；mirror：左侧贴图要把每个元素在自己的框里左右翻转 */
function place(g, x0, x1, ya, yb, mirror, draw, toV) {
  const u0 = toU(x0), u1 = toU(x1), v0 = toV(yb), v1 = toV(ya), w = u1 - u0, h = v1 - v0;
  g.save(); g.translate(u0, v0); if (mirror) { g.translate(w, 0); g.scale(-1, 1); } draw(g, w, h); g.restore();
}
const word = (txt, color, weight = 900, family = "NotoSC") => (g, w, h) => { g.fillStyle = color; g.font = `${weight} ${h * .8}px ${family}`; g.textBaseline = "middle"; g.textAlign = "center"; g.fillText(txt, w / 2, h / 2, w); };
const logo = (g, w, h) => { sun(g, w / 2, h * .5, h * .32); bull(g, w * .22, h * .55, h * .38, 1); bull(g, w * .78, h * .55, h * .38, -1); };

function sideTex(mirror) {
  const c = document.createElement("canvas"); c.width = PX; c.height = PY; const g = c.getContext("2d"), toV = (y) => (1 - y / Y1) * PY;
  g.clearRect(0, 0, PX, PY);
  place(g, -11, -2.5, 5.2, 8.0, mirror, logo, toV);                         // 发动机盖侧面：红牛标
  place(g, -1, 6.2, 3.6, 5.6, mirror, word("ORACLE", "#ffffff"), toV);      // 侧箱
  place(g, -14.5, -10, 3.0, 4.2, mirror, word("HONDA", "#ffffff", 800), toV);
  place(g, 14, 21, 2.5, 3.9, mirror, word("Bybit", "#ffffff", 800), toV);    // 鼻锥侧面
  place(g, -27.4, -23.8, 5.6, 7.6, mirror, word("ORACLE", RED), toV);        // 尾翼端板
  place(g, 25, 28.6, .9, 2.5, mirror, word("Mobil 1", RED, 800), toV);       // 前翼端板
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}
function topTex() {
  const c = document.createElement("canvas"); c.width = PX; c.height = PZ; const g = c.getContext("2d"), toV = (z) => (z + Z1) / (2 * Z1) * PZ;
  g.clearRect(0, 0, PX, PZ);
  place(g, 15, 23, -1.2, 1.2, false, (g, w, h) => { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); logo(g, h, w * .5); g.restore(); }, toV); // 鼻锥顶：红牛标
  place(g, -27.2, -24.6, -4.4, 4.4, false, (g, w, h) => { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); word("ORACLE", "#ffffff")(g, h * .9, w * .9); g.restore(); }, toV); // 尾翼主翼面
  place(g, 25.4, 28.6, -9, 9, false, (g, w, h) => { g.save(); g.translate(w / 2, h / 2); g.rotate(Math.PI / 2); word("ORACLE", "#ffffff")(g, h * .5, w * .7); g.restore(); }, toV); // 前翼
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
}

export function makeLivery(c) {
  const R = sideTex(false), L = sideTex(true), T = topTex();
  const uInv = { value: new THREE.Matrix4() };
  const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: .1, roughness: .55, clearcoat: .35, clearcoatRoughness: .5, side: THREE.DoubleSide });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, { uInv, uR: { value: R }, uL: { value: L }, uT: { value: T } });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 uInv; varying vec3 vB; varying vec3 vBN;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvB = (uInv * modelMatrix * vec4(transformed, 1.0)).xyz; vBN = normalize(mat3(uInv * modelMatrix) * objectNormal);");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D uR, uL, uT; varying vec3 vB; varying vec3 vBN;")
      .replace("#include <map_fragment>", `
        vec3 col = vec3(${hex(NAVY)});
        // 鼻锥尖：红；鼻锥后段一条黄色细带（示意）
        float nose = 1.0 - smoothstep(1.0, 1.3, abs(vB.z));
        col = mix(col, vec3(${hex(RED)}), smoothstep(25.2, 25.4, vB.x) * nose);
        col = mix(col, vec3(${hex(YEL)}), smoothstep(23.9, 24.0, vB.x) * (1.0 - smoothstep(24.6, 24.7, vB.x)) * nose);
        vec2 us = vec2((vB.x - ${X0.toFixed(1)}) / ${(X1 - X0).toFixed(1)}, vB.y / ${Y1.toFixed(1)});
        vec4 ds = vB.z >= 0.0 ? texture2D(uR, us) : texture2D(uL, us);
        float side = smoothstep(.35, .7, abs(vBN.z)) * step(0.0, us.x) * step(us.x, 1.0) * step(0.0, us.y) * step(us.y, 1.0);
        col = mix(col, ds.rgb, ds.a * side);
        vec2 ut = vec2((vB.x - ${X0.toFixed(1)}) / ${(X1 - X0).toFixed(1)}, (vB.z + ${Z1.toFixed(1)}) / ${(2 * Z1).toFixed(1)});
        vec4 dt = texture2D(uT, ut);
        col = mix(col, dt.rgb, dt.a * smoothstep(.45, .8, vBN.y));
        diffuseColor.rgb *= col;`);
  };
  const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e6);      // 漆面：x > X
  const keep = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -1e6);     // 碳纤维：x < X
  const twins = [];
  for (const m of c.paint) {
    const tw = new THREE.Mesh(m.geometry, mat); tw.position.copy(m.position); tw.rotation.copy(m.rotation); tw.scale.copy(m.scale);
    tw.castShadow = tw.receiveShadow = true; tw.userData.m = mat; m.parent.add(tw); twins.push(tw);
    m.userData.m.clippingPlanes = [keep]; // 碳纤维材质共享：一次设好
  }
  mat.clippingPlanes = [plane];
  for (const tw of twins) c.meshes.push(tw);
  /** X：漆面的分界（世界坐标 x）；+∞ 时没有漆，−∞ 时全是漆 */
  return {
    state(X) {
      c.body.updateWorldMatrix(true, false); uInv.value.copy(c.body.matrixWorld).invert();
      plane.constant = -X; keep.constant = X;
      for (const tw of twins) tw.visible = X < 1e5;
    },
  };
}
function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ((v / 255) ** 2.2).toFixed(4)).join(", "); }
