// 动态的"节点 + 边"：每帧传入节点和边的列表，整套重画。用于 S3 的示意树、S4 的二叉搜索树 / 竹竿 / 红黑树。
// 节点：普通（按实例上色）和发光（金色自发光）两套；边同理。
import * as THREE from "three";
import { C } from "./world.js";

export function makeGraph(scene, maxN = 160, maxE = 200) {
  const ballG = new THREE.IcosahedronGeometry(1, 3);
  const plainN = new THREE.InstancedMesh(ballG, new THREE.MeshStandardMaterial({ roughness: 0.55 }), maxN);
  const litN = new THREE.InstancedMesh(ballG, new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 1.05, roughness: 0.45 }), maxN);

  const cyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  cyl.translate(0, 0.5, 0);
  const mkTubes = (mat) => {
    const g = cyl.clone();
    const aR = new THREE.InstancedBufferAttribute(new Float32Array(maxE * 2), 2);
    g.setAttribute("aR", aR);
    mat.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aR;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.xz *= mix(aR.x, aR.y, position.y);");
    };
    const m = new THREE.InstancedMesh(g, mat, maxE);
    m.userData.aR = aR;
    return m;
  };
  const plainE = mkTubes(new THREE.MeshStandardMaterial({ roughness: 0.6 }));
  const litMat = new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 1.05, roughness: 0.45 });
  const litE = mkTubes(litMat);
  const all = [plainN, litN, plainE, litE];
  for (const m of all) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; m.count = 0; scene.add(m); }
  // 先各上一次色，确保 instanceColor 存在
  const col = new THREE.Color(1, 1, 1);
  for (let i = 0; i < maxN; i++) plainN.setColorAt(i, col);
  for (let i = 0; i < maxE; i++) plainE.setColorAt(i, col);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), sc = new THREE.Vector3(), pos = new THREE.Vector3();

  /**
   * nodes: [{ p:[x,y,z], r, color?, lit? }]（r<=0 不画）
   * edges: [{ a:[..], b:[..], r0, r1, color?, lit?, f? }]（f：从 a 往 b 长出的比例）
   * glow：发光部分的亮度倍数（用来做"一闪"）
   */
  function draw(nodes, edges, glow = 1) {
    let np = 0, nl = 0, ep = 0, el = 0;
    for (const n of nodes) {
      if (!(n.r > 0.0005)) continue;
      pos.set(...n.p); sc.set(n.r, n.r, n.r);
      m4.compose(pos, q.identity(), sc);
      if (n.lit) litN.setMatrixAt(nl++, m4);
      else { plainN.setMatrixAt(np, m4); plainN.setColorAt(np, col.set(n.color ?? 0xf3e7d3)); np++; }
    }
    for (const e of edges) {
      const f = e.f ?? 1;
      if (f <= 0.001 || !(e.r0 > 0.0005)) continue;
      d.set(e.b[0] - e.a[0], e.b[1] - e.a[1], e.b[2] - e.a[2]);
      const len = d.length() * Math.min(1, f);
      if (len < 1e-4) continue;
      d.normalize(); q.setFromUnitVectors(up, d);
      pos.set(...e.a); sc.set(1, len, 1);
      m4.compose(pos, q, sc);
      const tgt = e.lit ? litE : plainE, i = e.lit ? el++ : ep++;
      tgt.setMatrixAt(i, m4);
      tgt.userData.aR.setXY(i, e.r0, e.r1 ?? e.r0);
      if (!e.lit) plainE.setColorAt(i, col.set(e.color ?? 0xf3e7d3));
    }
    plainN.count = np; litN.count = nl; plainE.count = ep; litE.count = el;
    for (const m of all) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; if (m.userData.aR) m.userData.aR.needsUpdate = true; }
    litMat.emissiveIntensity = 1.05 * glow;
    litN.material.emissiveIntensity = 1.05 * glow;
  }
  return { draw };
}

// 平衡二叉搜索树的布局：lo..hi 取中间数当根（和"每次猜中间"一致）
export function bstLayout(lo, hi, place) {
  const out = new Map();
  (function rec(a, b, depth, parent) {
    if (a > b) return;
    const k = Math.floor((a + b) / 2);
    out.set(k, { k, depth, parent, p: place(k, depth) });
    rec(a, k - 1, depth + 1, k);
    rec(k + 1, b, depth + 1, k);
  })(lo, hi, 0, null);
  return out;
}
