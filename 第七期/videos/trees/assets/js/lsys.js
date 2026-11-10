// S2 的"一条规则"：一根枝 → 分出两根，重复 6 次。规整的二分叉小树（L-system 风格）。
// 每一代在指定时间长出来；粗细随"后面又长了几代"变粗。
import * as THREE from "three";
import { makeTubes, C } from "./world.js";
import { rng } from "./tree.js";
import { clamp, ease, easeOutBack } from "./lib.js";

export function buildSapling({ seed = 3, gens = 6, times, grow = 0.55 } = {}) {
  const rand = rng(seed);
  const segs = [];
  const up = new THREE.Vector3(0, 1, 0);
  // 主干
  const L0 = 0.95;
  segs.push({ gen: 0, a: [0, 0, 0], b: [0, L0, 0], dir: up.clone(), side: new THREE.Vector3(0, 0, 1), r0: 0, r1: 0 }); // 第一次分叉朝左右，正对镜头
  let tips = [segs[0]];
  for (let g = 1; g <= gens; g++) {
    const next = [];
    const len = L0 * 0.74 ** g;
    for (const p of tips) {
      // 分叉平面每一代转 90° 左右，让小树是立体的
      const plane = p.side.clone().applyAxisAngle(p.dir, Math.PI / 2 + (rand() - 0.5) * 0.5);
      for (const s of [1, -1]) {
        const ang = (0.6 + (rand() - 0.5) * 0.16) * s;
        const dir = p.dir.clone().applyAxisAngle(plane.clone().cross(p.dir).normalize(), ang).normalize();
        dir.y += 0.05; dir.normalize(); // 微微向上
        const l = len * (0.9 + rand() * 0.2);
        const b = [p.b[0] + dir.x * l, p.b[1] + dir.y * l, p.b[2] + dir.z * l];
        const seg = { gen: g, a: p.b, b, dir, side: plane, r0: 0, r1: 0 };
        segs.push(seg); next.push(seg);
      }
    }
    tips = next;
  }

  const wood = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.85 });
  const tubes = makeTubes(segs, wood);
  const joints = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), wood, segs.length);
  joints.castShadow = true; joints.frustumCulled = false;

  // 叶子：最后一代枝梢上各 3 片
  const leafSpots = [];
  for (const s of tips) for (let j = 0; j < 3; j++) leafSpots.push({ p: [s.b[0] + (rand() - 0.5) * 0.14, s.b[1] + (rand() - 0.3) * 0.1, s.b[2] + (rand() - 0.5) * 0.14], rot: [rand() * 6.3, rand() * 6.3, rand() * 6.3], s: 0.05 + rand() * 0.04, c: C.leaf[Math.floor(rand() * C.leaf.length)], d: rand() * 0.6 });
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true }), leafSpots.length);
  leaves.castShadow = true; leaves.frustumCulled = false;
  const col = new THREE.Color();
  leafSpots.forEach((l, i) => leaves.setColorAt(i, col.set(l.c)));
  // 子叶：嫩芽顶上的两片小叶，第一次分叉时收起
  const coty = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 8), new THREE.MeshStandardMaterial({ color: 0x8cc084, roughness: 0.7 }), 2);
  coty.castShadow = true; coty.frustumCulled = false;

  const group = new THREE.Group();
  group.add(tubes.mesh, joints, leaves, coty);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  // 当前长到第几代（带小数）
  const genAt = (t) => { let G = -1; times.forEach((t0, g) => { if (t >= t0) G = Math.max(G, g - 1 + clamp((t - t0) / grow)); }); return G; };

  /** t：时间；leaf：叶子 0..1；scale：整体缩放 */
  function update(t, { leaf = 0, scale = 1, burst = 1 } = {}) {
    group.scale.setScalar(scale);
    const G = genAt(t);
    const rOf = (g) => Math.max(g === 0 ? 0.024 : 0, 0.011 * 1.47 ** Math.max(0, G - g));
    let nj = 0;
    tubes.update((s) => {
      const f = s.gen === 0 ? easeOutBack(clamp((t - times[0]) / (grow * 1.6)), 1.2) * burst : ease(clamp((t - times[s.gen]) / grow));
      s.r0 = rOf(s.gen); s.r1 = rOf(s.gen + 1) * 0.92;
      if (f >= 1 && s.gen < G) { pos.set(...s.b); const r = rOf(s.gen + 1); sc.set(r, r, r); joints.setMatrixAt(nj++, m4.compose(pos, q.identity(), sc)); }
      return f;
    });
    joints.count = nj; joints.instanceMatrix.needsUpdate = true;

    let nl = 0;
    for (const l of leafSpots) {
      const k = ease(clamp((leaf - l.d * 0.5) / 0.5));
      if (k <= 0.001) continue;
      pos.set(...l.p); e.set(...l.rot); q.setFromEuler(e); const z = l.s * k; sc.set(z * 1.3, z * 0.35, z);
      leaves.setMatrixAt(nl++, m4.compose(pos, q, sc));
    }
    leaves.count = nl; leaves.instanceMatrix.needsUpdate = true;

    // 子叶：主干长出后张开，第一次分叉时收起
    const ck = ease(clamp((t - times[0] - 0.5) / 0.6)) * (1 - ease(clamp((t - times[1]) / 0.4)));
    let nc = 0;
    if (ck > 0.001) {
      const topY = L0 * clamp((t - times[0]) / (grow * 1.6));
      for (const s of [1, -1]) {
        pos.set(0.07 * s * ck, topY + 0.01, 0); e.set(0, 0, -0.5 * s); q.setFromEuler(e);
        sc.set(0.075 * ck, 0.02 * ck, 0.045 * ck);
        coty.setMatrixAt(nc++, m4.compose(pos, q, sc));
      }
    }
    coty.count = nc; coty.instanceMatrix.needsUpdate = true;
    return G;
  }
  return { group, update, tips, segs };
}

// 种子：一颗带条纹的瓜子形种子
export function buildSeed() {
  const cv = document.createElement("canvas");
  cv.width = 256; cv.height = 128;
  const g = cv.getContext("2d");
  g.fillStyle = "#3e2c20"; g.fillRect(0, 0, 256, 128);
  g.fillStyle = "#cdb48e";
  for (let i = 0; i < 9; i++) g.fillRect(i * 29 + 6, 0, 7, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(1, 40, 24);
  // 一头尖一头圆
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 - 0.45 * Math.max(0, y); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k * 0.62); }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 }));
  m.scale.set(0.085, 0.16, 0.085);
  m.castShadow = true;
  return m;
}

// 落土时溅起的土粒
export function buildDust(n = 28, seed = 9) {
  const rand = rng(seed);
  const parts = Array.from({ length: n }, () => ({ a: rand() * Math.PI * 2, v: 0.6 + rand() * 0.9, up: 0.9 + rand() * 1.1, s: 0.018 + rand() * 0.02 }));
  const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x8b6a4f, roughness: 1, flatShading: true }), n);
  mesh.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  function update(k) { // k：溅起后的秒数
    let c = 0;
    if (k > 0 && k < 0.9) for (const p of parts) {
      const tt = k * 1.4;
      const y = p.up * tt - 4.9 * tt * tt;
      if (y < -0.02) continue;
      pos.set(Math.cos(p.a) * p.v * tt, y, Math.sin(p.a) * p.v * tt);
      const z = p.s * (1 - k / 0.9);
      sc.set(z, z, z);
      mesh.setMatrixAt(c++, m4.compose(pos, q, sc));
    }
    mesh.count = c; mesh.instanceMatrix.needsUpdate = true;
  }
  update(0);
  return { mesh, update };
}
