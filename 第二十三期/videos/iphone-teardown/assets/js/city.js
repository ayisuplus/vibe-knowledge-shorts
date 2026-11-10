// 芯片城：类比，不是芯片的真实结构。坐标是「芯片单位」，整片 1×1，对应约 1 厘米见方（裸片约 98 mm²，TechInsights 估算）。
import * as THREE from "three";
import { root, grp, add, textPlane, backing, BG, AMBER, CYAN, M, PBR, box } from "./world.js";
import { hash } from "./lib.js";

export const die = grp(root);
const ZONES = [
  { x: [-.46, -.06], y: [.06, .46], name: "性能核心", c: AMBER, h: .07, cell: .05 },
  { x: [-.46, -.06], y: [-.18, .02], name: "能效核心", c: new THREE.Color(1, .72, .3), h: .032, cell: .036 },
  { x: [.02, .46], y: [.06, .46], name: "图形核心", c: CYAN, h: .052, cell: .044 },
  { x: [.02, .46], y: [-.2, .02], name: "神经网络引擎", c: new THREE.Color(.5, .95, .95), h: .038, cell: .036 },
  { x: [-.46, .46], y: [-.46, -.24], name: "缓存", c: new THREE.Color(.4, .62, .8), h: .016, cell: .042 },
];
export const CITY_S = 220;
const floorC = document.createElement("canvas"); floorC.width = floorC.height = 2048;
{ const g = floorC.getContext("2d"), P = (v) => (v + .5) * 2048; g.fillStyle = "#04060a"; g.fillRect(0, 0, 2048, 2048); for (const z of ZONES) { g.fillStyle = `rgba(${z.c.r * 255 | 0},${z.c.g * 255 | 0},${z.c.b * 255 | 0},.22)`; g.fillRect(P(z.x[0]), 2048 - P(z.y[1]), (z.x[1] - z.x[0]) * 2048, (z.y[1] - z.y[0]) * 2048); } }
const floorT = new THREE.CanvasTexture(floorC); floorT.colorSpace = THREE.SRGBColorSpace; floorT.anisotropy = 16;
export const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: floorT })); die.add(floor);
const BLD = [];
for (const z of ZONES) for (let x = z.x[0] + z.cell / 2; x < z.x[1]; x += z.cell) for (let y = z.y[0] + z.cell / 2; y < z.y[1]; y += z.cell) {
  const i = BLD.length, r = hash(i * .77), tall = hash(i * 1.91) > .92; BLD.push({ x, y, w: z.cell * (.72 + .12 * hash(i + 5)), d: z.cell * (.72 + .12 * hash(i + 9)), h: z.h * (tall ? 1 + .9 * r : .3 + .55 * r * r), c: z.c, s: hash(i * 3.3) });
}
const bGeo = new THREE.BoxGeometry(1, 1, 1), aCol = new Float32Array(BLD.length * 3), aSeed = new Float32Array(BLD.length);
BLD.forEach((b, i) => { aCol[i * 3] = b.c.r; aCol[i * 3 + 1] = b.c.g; aCol[i * 3 + 2] = b.c.b; aSeed[i] = b.s; });
bGeo.setAttribute("aCol", new THREE.InstancedBufferAttribute(aCol, 3)); bGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(aSeed, 1));
export const cityU = { uGrow: { value: 0 }, uFog: { value: 0 }, uFogC: { value: BG }, uGlow: { value: 1 } };
export const city = new THREE.InstancedMesh(bGeo, new THREE.ShaderMaterial({
  uniforms: cityU,
  vertexShader: `attribute vec3 aCol; attribute float aSeed; uniform float uGrow; varying vec3 vP,vN,vC,vL; varying float vS,vD;
    void main(){ vec2 ctr=instanceMatrix[3].xy; float g=clamp((uGrow-length(ctr)*1.2)/.3,0.,1.); g=1.-pow(1.-g,3.);
      vec3 p=position; p.z=(p.z+.5)*g-.5; vec4 w=instanceMatrix*vec4(p,1.); vP=w.xyz; vN=normal; vC=aCol; vS=aSeed; vL=position;
      vec4 mv=modelViewMatrix*w; vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uFog,uGlow; uniform vec3 uFogC; varying vec3 vP,vN,vC,vL; varying float vS,vD;
    float h(vec2 p){ return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5453); }
    void main(){ vec3 alb=mix(vec3(.17,.18,.2),vC,.09)*(.7+.6*vS); float dif=.34+.8*max(dot(vN,normalize(vec3(-.45,-.55,.7))),0.)+.14*max(dot(vN,normalize(vec3(.7,.4,.2))),0.);
      vec3 c=alb*dif*.95; float ao=mix(.28,1.,smoothstep(0.,.016,vP.z));
      if(vN.z>.5){ vec2 e=abs(vL.xy)*2.; float far=smoothstep(.002,.012,fwidth(vP.x)), rim=smoothstep(.9,.98,max(e.x,e.y))*(1.-far); c=c*.8+vec3(.07)*rim;
      } else {
        float along=abs(vN.x)>.5?vP.y:vP.x, fl=floor(vP.z/.0042), col=floor(along/.0056+vS*7.);
        float gz=smoothstep(.08,.0,abs(fract(vP.z/.0042)-.5)-.04), w=max(fwidth(vP.z/.0042),fwidth(along/.0056)*2.);
        float seam=mix(gz,.1,smoothstep(.25,.8,w)); float rib=smoothstep(.0,.12,abs(fract(along/.0028+vS*3.)-.5)-.1); c*=mix(1.,.55+.45*rib,1.-smoothstep(.25,.8,fwidth(along/.0028)*2.)); c+=vec3(.05,.052,.058)*pow(max(vN.x*-.45+vN.y*-.55,0.),3.)*smoothstep(.0,.05,vP.z); c*=(1.-.45*seam); float lit=step(.93,h(vec2(fl,col)+vS*91.)); c+=vC*lit*gz*.32*(1.-smoothstep(.25,.8,w))*uGlow; c*=ao;
      }
      c=mix(uFogC,c,exp(-vD*uFog)); gl_FragColor=vec4(c,1.); }`,
}), BLD.length);
const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
BLD.forEach((b, i) => { _m.compose(_p.set(b.x, b.y, b.h / 2), _q.identity(), _s.set(b.w, b.d, b.h)); city.setMatrixAt(i, _m); });
city.frustumCulled = false; die.add(city);
// 车流：沿街道跑的光条。位置只取决于 t
const LANES = [], TR = 300;
for (let i = 0; i < TR; i++) {
  const r = hash(i * 1.37), vert = i % 2 === 0, main = i < 220; let fix, span;
  if (main) { fix = vert ? -.02 + (i % 4 === 0 ? -.008 : .008) : (i % 4 === 1 ? .04 + .008 : .04 - .008); span = [-.48, .48]; }
  else { const z = ZONES[i % ZONES.length], a = vert ? z.x : z.y, kk = Math.floor(hash(i * 2.9) * (a[1] - a[0]) / z.cell / 4) * 4; fix = a[0] + kk * z.cell; span = vert ? z.y : z.x; }
  LANES.push({ vert, fix, a: span[0], L: span[1] - span[0], o: r, v: (.09 + .1 * hash(i + 4)) * (i % 3 === 0 ? -1 : 1), c: hash(i * 5.1) > .45 ? AMBER : CYAN });
}
export const traffic = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), TR); traffic.frustumCulled = false; die.add(traffic);
LANES.forEach((l, i) => traffic.setColorAt(i, l.c.clone().multiplyScalar(1.05)));
export function trafficState(t) { for (let i = 0; i < TR; i++) { const l = LANES[i]; const q = l.a + (((l.o * l.L + t * l.v) % l.L) + l.L) % l.L; _p.set(l.vert ? l.fix : q, l.vert ? q : l.fix, .0011); _s.set(l.vert ? .0007 : .009, l.vert ? .009 : .0007, .0004); _m.compose(_p, _q.identity(), _s); traffic.setMatrixAt(i, _m); } traffic.instanceMatrix.needsUpdate = true; }
// 招牌和俯瞰分区名
export const SIGN = [["性能核心", -.09, .16], ["图形核心", .05, .22], ["能效核心", -.085, -.09], ["神经网络引擎", .14, -.12]].map(([s, x, y]) => { const m = textPlane(s, .016, { color: "#e8ebef", size: 200, gain: .95 }); m.rotation.set(Math.PI / 2, 0, 0); m.position.set(x, y, .055); m.material.fog = true; die.add(m); return m; });
export const AERIAL = ZONES.map((z) => { const m = textPlane(z.name, .075, { color: "#ffffff", size: 220, gain: .95 }); m.position.set((z.x[0] + z.x[1]) / 2, (z.y[0] + z.y[1]) / 2, .1); m.renderOrder = 5; const b = backing(m.geometry.parameters.width * 1.04, .09); b.position.set(m.position.x, m.position.y, .099); b.renderOrder = 4; die.add(b); m.userData.b = b; die.add(m); return m; });
// 1971 年的 4004：路中间一小块，只有几栋楼（比例是示意）
export const C4004 = [-.02, -.11];
export const old = grp(die, C4004[0], C4004[1], 0);
{
  const warm = PBR({ color: 0xb79a6c, metalness: .5, roughness: .5 });
  add(old, box(.03, .03, .002, .0005), M.dark, 0, 0, .001);
  for (const [x, y, w, h] of [[-.008, .007, .006, .006], [.007, .008, .007, .004], [-.007, -.007, .007, .004], [.008, -.006, .005, .007], [0, 0, .004, .009]]) add(old, box(w, w, h, .0004), warm, x, y, .002 + h / 2);
}
