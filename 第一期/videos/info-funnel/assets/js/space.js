// S3–S9 上方的内容空间：9 万个点先排成“人 × 视频”大表，再压成一串串数字，最后散成按题材聚团的星云。
import * as THREE from "three";
import { scene, camera, mulberry32, clamp01, smooth, lerp, win, winIn, pulse, POINT_SCALE, C, TOPICS, makePoints, additiveBasic } from "./core.js";
import { SPACE_C, CLUSTERS, T, youAt, recallRadius, MOUTH_Y, wr } from "./world.js";

const rand = mulberry32(17050);
const GW = 300, GH = 300, N = GW * GH, SP = 0.2;
export const YOU_ROW = 150;
const aGrid = new Float32Array(N * 3), aComp = new Float32Array(N * 3), aNeb = new Float32Array(N * 3);
const aTopic = new Float32Array(N), aLit = new Float32Array(N), aSize = new Float32Array(N), aDelay = new Float32Array(N), aVal = new Float32Array(N);
function gauss() { return (rand() + rand() + rand() + rand() - 2) * 1.2; }
for (let r = 0, i = 0; r < GH; r++) {
  for (let c = 0; c < GW; c++, i++) {
    aGrid[i * 3] = (c - (GW - 1) / 2) * SP;
    aGrid[i * 3 + 1] = (r - (GH - 1) / 2) * SP;
    const cc = Math.floor((c * 16) / GW);
    aComp[i * 3] = (cc - 7.5) * 0.45;
    aComp[i * 3 + 1] = (r - (GH - 1) / 2) * SP;
    const topic = Math.floor(rand() * 5);
    aTopic[i] = topic;
    if (rand() < 0.2) {
      // 散在各处的“背景”内容
      const u = Math.cbrt(rand()) * 11, th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
      aNeb[i * 3] = u * Math.sin(ph) * Math.cos(th); aNeb[i * 3 + 1] = u * Math.cos(ph) * 0.6; aNeb[i * 3 + 2] = u * Math.sin(ph) * Math.sin(th);
    } else {
      const cl = CLUSTERS[topic];
      aNeb[i * 3] = cl.x + gauss() * 1.9; aNeb[i * 3 + 1] = cl.y + gauss() * 1.4; aNeb[i * 3 + 2] = cl.z + gauss() * 1.9;
    }
    aLit[i] = r === YOU_ROW ? (rand() < 0.3 ? 2 : 1.5) : rand() < 0.09 ? 1 : 0;
    aSize[i] = 0.1 + rand() * 0.12;
    aDelay[i] = rand();
    aVal[i] = rand();
  }
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
geo.setAttribute("aGrid", new THREE.BufferAttribute(aGrid, 3));
geo.setAttribute("aComp", new THREE.BufferAttribute(aComp, 3));
geo.setAttribute("aNeb", new THREE.BufferAttribute(aNeb, 3));
geo.setAttribute("aTopic", new THREE.BufferAttribute(aTopic, 1));
geo.setAttribute("aLit", new THREE.BufferAttribute(aLit, 1));
geo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
geo.setAttribute("aDelay", new THREE.BufferAttribute(aDelay, 1));
geo.setAttribute("aVal", new THREE.BufferAttribute(aVal, 1));

const mat = new THREE.ShaderMaterial({
  uniforms: {
    uC: { value: SPACE_C }, uM1: { value: 0 }, uM2: { value: 0 }, uRot: { value: 0 }, uAlpha: { value: 0 },
    uYou: { value: new THREE.Vector3() }, uR: { value: 3 }, uRecall: { value: 0 }, uScale: { value: POINT_SCALE },
    uColors: { value: TOPICS.map((c) => new THREE.Vector3(c.r, c.g, c.b)) },
  },
  vertexShader: `
    attribute vec3 aGrid; attribute vec3 aComp; attribute vec3 aNeb; attribute float aTopic; attribute float aLit;
    attribute float aSize; attribute float aDelay; attribute float aVal;
    uniform vec3 uC; uniform float uM1; uniform float uM2; uniform float uRot; uniform float uAlpha;
    uniform vec3 uYou; uniform float uR; uniform float uRecall; uniform float uScale; uniform vec3 uColors[5];
    varying vec4 vColor;
    void main(){
      float m2 = smoothstep(0.0, 1.0, clamp(uM2 * 1.5 - aDelay * 0.5, 0.0, 1.0));
      float ca = cos(uRot), sa = sin(uRot);
      vec3 nb = vec3(aNeb.x * ca - aNeb.z * sa, aNeb.y, aNeb.x * sa + aNeb.z * ca);
      vec3 flat2 = mix(aGrid, aComp, uM1);
      vec3 p = uC + mix(flat2, nb, m2);
      // 大表阶段：有互动的格子亮青色，你的那一行是白色
      vec3 cyan = vec3(0.0, 0.94, 1.0);
      vec3 matCol = aLit > 1.4 ? vec3(1.0) : mix(vec3(0.16, 0.3, 0.36), cyan, step(0.5, aLit));
      float matA = aLit > 1.4 ? (aLit > 1.9 ? 1.0 : 0.55) : (aLit > 0.5 ? 0.85 : 0.13);
      // 压缩阶段：亮度表示数值大小
      matCol = mix(matCol, aLit > 1.4 ? vec3(1.0) : cyan * (0.35 + 0.65 * aVal), uM1);
      matA = mix(matA, aLit > 1.4 ? 0.95 : 0.25 + 0.55 * aVal, uM1);
      int ti = int(aTopic + 0.5);
      vec3 col = mix(matCol, uColors[ti], m2);
      float a = mix(matA, 0.15, m2);
      // 召回球：球内的点变亮，球外的变暗
      float d = distance(p, uYou);
      float inR = 1.0 - smoothstep(uR * 0.92, uR, d);
      a *= mix(1.0, mix(0.35, 1.6, inR), uRecall);
      vColor = vec4(col, a * uAlpha);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(aSize * uScale / -mv.z, 1.3, 12.0);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec4 vColor;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      gl_FragColor = vec4(vColor.rgb, vColor.a * smoothstep(0.5, 0.0, d));
    }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const cloud = new THREE.Points(geo, mat);
cloud.frustumCulled = false;
scene.add(cloud);

// “你”所在行左端（HUD 标签锚点）
export const youRowAnchor = new THREE.Vector3(SPACE_C.x - (GW / 2) * SP - 0.6, SPACE_C.y + (YOU_ROW - (GH - 1) / 2) * SP, SPACE_C.z);
export const compAnchor = new THREE.Vector3(SPACE_C.x - 8 * 0.45 - 0.6, youRowAnchor.y, SPACE_C.z);

// ---------- 你：光点 + 光环 + 轨迹 ----------
const you = makePoints(2);
const ring = new THREE.Mesh(new THREE.RingGeometry(0.75, 0.82, 64), additiveBasic(0xffffff));
scene.add(ring);
const TRAIL = 48;
const trail = makePoints(TRAIL);
// 召回球
const sphere = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1, 2)), new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(sphere);

// ---------- 召回光束 ----------
const MOUTH = new THREE.Vector3(0, MOUTH_Y, 0);
const beamDefs = [];
// 第一路：你周围的内容
for (let k = 0; k < 520; k++) {
  const u = Math.cbrt(rand()) * 3.2, th = rand() * Math.PI * 2, ph = Math.acos(2 * rand() - 1);
  beamDefs.push({ route: 0, off: new THREE.Vector3(u * Math.sin(ph) * Math.cos(th), u * Math.cos(ph), u * Math.sin(ph) * Math.sin(th)), col: TOPICS[Math.floor(rand() * 5)] });
}
// 第二路：和你相似的人喜欢过的（在别的星团里）
export const NEIGHBORS = [new THREE.Vector3(1.6, 1.4, 0.8), new THREE.Vector3(-1.4, 0.2, 1.5), new THREE.Vector3(0.5, -1.3, -1.6), new THREE.Vector3(-1.2, 1.6, -1.0)];
const LIKED = [1, 2, 3, 4, 1, 3].map((cl, j) => CLUSTERS[cl].clone().add(new THREE.Vector3(Math.sin(j * 3.1) * 1.2, Math.cos(j * 2.3) * 0.8, Math.sin(j * 1.7) * 1.2)));
for (let k = 0; k < 360; k++) {
  const j = k % LIKED.length;
  beamDefs.push({ route: 1, src: LIKED[j], neighbor: NEIGHBORS[j % 4], off: new THREE.Vector3((rand() - 0.5) * 0.8, (rand() - 0.5) * 0.5, (rand() - 0.5) * 0.8), col: TOPICS[[1, 2, 3, 4, 1, 3][j]] });
}
// 第三路：关注 / 热门 / 随机
const FAR = [new THREE.Vector3(-10, 4, 5), CLUSTERS[2].clone(), new THREE.Vector3(9, -3, 8), new THREE.Vector3(-6, -4, -9), new THREE.Vector3(10, 5, -1)];
for (let k = 0; k < 200; k++) {
  beamDefs.push({ route: 2, src: FAR[k % FAR.length], off: new THREE.Vector3((rand() - 0.5) * 0.4, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.4), col: k % 5 === 1 ? C.yellow : C.white });
}
beamDefs.forEach((b) => { b.k = rand(); b.mr = Math.sqrt(rand()) * wr(3.2) * 0.65; b.ma = rand() * Math.PI * 2; b.size = 0.09 + rand() * 0.06; });
const beams = makePoints(beamDefs.length);
// 相似的人 → 他们喜欢的视频：连线
const LINK_N = 30;
const links = makePoints(NEIGHBORS.length + LIKED.length * LINK_N);

const bez = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());
const tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3(), youV = new THREE.Vector3();
const tmpC = new THREE.Color();

export function spaceAlpha(t) {
  return winIn(t, T.table, 152.5, 0.05, 1.5) + 0.8 * winIn(t, T.wide, 170, 0.8, 1);
}

export function updateSpace(t) {
  const sa = Math.min(1, spaceAlpha(t));
  cloud.visible = sa > 0.001;
  const u = mat.uniforms;
  if (cloud.visible) {
    u.uAlpha.value = sa;
    u.uM1.value = smooth((t - T.compress) / 2.0) * (1 - smooth((t - T.toSpace) / 0.4));
    u.uM2.value = smooth((t - T.toSpace) / 2.4);
    u.uRot.value = 0.012 * Math.max(0, t - T.toSpace);
    youAt(t, youV);
    u.uYou.value.copy(youV);
    u.uR.value = recallRadius(t);
    u.uRecall.value = 0.85 * (win(t, T.recall, T.filter, 0.4, 0.8) + winIn(t, T.ff, T.surprise, 1, 1.5));
  }

  // 你
  const yv = smooth((t - T.you) / 0.3) * (t < 152 ? 1 : 1 - smooth((t - 152) / 1)) * Math.min(1, sa + 0.001);
  you.set(0, youV.x, youV.y, youV.z, C.white, yv, 0.28);
  you.set(1, youV.x, youV.y, youV.z, C.white, yv * 0.35, 1.2 * (1 + 0.8 * pulse(t, T.you, 3) + 0.6 * pulse(t, T.st3, 3)));
  you.flush();
  ring.visible = t > T.you - 0.1 && t < T.recall + 1;
  if (ring.visible) {
    ring.position.copy(youV);
    ring.lookAt(camera.position);
    const k = clamp01((t - T.you) / 0.8);
    ring.scale.setScalar(1 + k * 1.4 + 0.08 * Math.sin(t * 4));
    ring.material.opacity = (1 - 0.5 * k) * win(t, T.you, T.recall + 0.5, 0.1, 0.5);
  }

  // 轨迹
  const tv = winIn(t, T.st3, 123, 0.5, 1.5);
  if (tv > 0.001) {
    trail.points.visible = true;
    for (let k = 0; k < TRAIL; k++) {
      youAt(t - (k + 1) * 0.35, tmpV);
      trail.set(k, tmpV.x, tmpV.y, tmpV.z, C.white, 0.55 * (1 - k / TRAIL) * tv, 0.16);
    }
    trail.flush();
  } else trail.points.visible = false;

  // 召回球
  const sv = win(t, T.recall, T.filter, 0.4, 0.8) + winIn(t, T.ff, T.surprise, 1, 1.5);
  sphere.visible = sv > 0.001;
  if (sphere.visible) {
    sphere.position.copy(youV);
    sphere.scale.setScalar(recallRadius(t));
    sphere.rotation.y = t * 0.2;
    sphere.material.opacity = 0.22 * Math.min(1, sv) + 0.3 * pulse(t, T.recall, 3);
  }

  // 召回光束
  const bvAll = winIn(t, T.recall, T.filter + 0.6, 0.3, 0.7);
  if (bvAll > 0.001) {
    beams.points.visible = true;
    beamDefs.forEach((b, i) => {
      const start = b.route === 0 ? T.recall : b.route === 1 ? T.route2 + 0.6 : T.route3;
      const reach = clamp01((t - start) / 1.4);
      const ph = (((t - start) * 0.42 + b.k) % 1 + 1) % 1;
      if (t < start || ph > reach) { beams.hide(i); return; }
      if (b.route === 0) tmpV.copy(SPACE_C).add(new THREE.Vector3(0, 0.5, 0)).add(b.off);
      else tmpV.copy(b.src).add(SPACE_C).add(b.off);
      tmpV2.set(Math.cos(b.ma) * b.mr, MOUTH.y + 0.2, Math.sin(b.ma) * b.mr);
      bez.v0.copy(tmpV); bez.v2.copy(tmpV2);
      bez.v1.set((tmpV.x + tmpV2.x) * 0.5, (tmpV.y + tmpV2.y) * 0.5 + 3, (tmpV.z + tmpV2.z) * 0.5);
      const q = bez.getPoint(ph);
      const a = (b.route === 2 ? 0.6 : 0.8) * Math.pow(Math.sin(Math.PI * ph), 0.3) * bvAll;
      beams.set(i, q.x, q.y, q.z, b.col, a, b.size * (b.route === 2 ? 0.8 : 1));
    });
    beams.flush();
  } else beams.points.visible = false;

  // 相似的人 + 连线
  const lv = win(t, T.route2, T.filter, 0.3, 0.8);
  if (lv > 0.001) {
    links.points.visible = true;
    let idx = 0;
    NEIGHBORS.forEach((n) => {
      tmpV.copy(n).add(SPACE_C).add(new THREE.Vector3(0, 0.5, 0));
      links.set(idx++, tmpV.x, tmpV.y, tmpV.z, C.white, 0.9 * lv, 0.2 * (1 + pulse(t, T.route2, 4)));
    });
    LIKED.forEach((L, j) => {
      const n = NEIGHBORS[j % 4];
      const grow = clamp01((t - T.route2 - 0.1 * j) / 0.6);
      for (let k = 0; k < LINK_N; k++) {
        const f = k / (LINK_N - 1);
        if (f > grow) { links.hide(idx++); continue; }
        tmpV.copy(n).add(new THREE.Vector3(0, 0.5, 0)).lerp(L, f).add(SPACE_C);
        links.set(idx++, tmpV.x, tmpV.y, tmpV.z, f > 0.95 ? TOPICS[[1, 2, 3, 4, 1, 3][j]] : C.white, (f > 0.95 ? 1 : 0.45) * lv, f > 0.95 ? 0.3 : 0.06);
      }
    });
    links.flush();
  } else links.points.visible = false;

}
