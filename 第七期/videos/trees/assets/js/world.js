// 3D 舞台：米白摄影棚 + 土层切片 + 主树（地上树冠 + 地下根系）。
// 所有状态都由 render(state) 一次性算出，不依赖上一帧，可任意跳帧。
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { rng, scatter, colonize } from "./tree.js";

export const C = {
  paper: 0xf4efe6, soil: 0x8b6a4f, soilDeep: 0x6b4e3a, wood: 0x8a5a3b, root: 0x7a5236,
  leaf: [0x5e9e5a, 0x6fae63, 0x8cc084, 0x4f8f4c], gold: 0xf2c14e, amber: 0xc8955c,
};
export const W = 1920, H = 1080;
const SLAB = { w: 13, h: 3.4, d: 6.5 }; // 土层切片尺寸，顶面在 y=0

export function buildWorld(canvas, { seed = 7, width = W, height = H } = {}) {
  const VW = width, VH = height; // 封面用别的画幅
  const dpr = window.devicePixelRatio || 1;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(dpr);
  renderer.setSize(VW, VH, false);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const paper = new THREE.Color(C.paper);
  scene.background = paper.clone();
  scene.fog = new THREE.Fog(paper.clone(), 30, 80);

  const camera = new THREE.PerspectiveCamera(32, VW / VH, 0.05, 900);
  const brightCol = new THREE.Color(0xfbf6ec);
  const abyssCol = new THREE.Color(0xd9b07c);

  // ---- 光 ----
  const hemi = new THREE.HemisphereLight(0xfff8ee, 0xb89b7a, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1dc, 2.4);
  sun.position.set(-7, 14, 9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -6, near: 1, far: 40 });
  sun.shadow.radius = 6;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  const under = new THREE.PointLight(0xffe2b0, 0, 16, 1.4); // 地下段落的暖光
  under.position.set(0, -1.2, 2.5);
  scene.add(under);

  // ---- 地板（摄影棚） ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: C.paper, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -SLAB.h - 0.001;
  floor.receiveShadow = false; // 树冠投到地板上的影子像一堆碎线，不要
  scene.add(floor);

  // ---- 土层切片：博物馆地层模型，正面切开 ----
  // 后墙、左右墙、底面是不透明的地层；正面敞开，只留一圈细框；顶面是土表。
  const strata = strataTexture(seed);
  const wallMat = new THREE.MeshStandardMaterial({ map: strata, roughness: 1, side: THREE.DoubleSide });
  const wallMatSide = wallMat.clone();
  wallMatSide.map = strata.clone(); wallMatSide.map.repeat.set(SLAB.d / SLAB.w, 1); wallMatSide.map.needsUpdate = true;
  const walls = new THREE.Group();
  const plane = (w, h, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = false; walls.add(m); return m; }; // 土墙不接阳光阴影（真实里土会挡住）
  const back = plane(SLAB.w, SLAB.h, wallMat); back.position.set(0, -SLAB.h / 2, -SLAB.d / 2);
  const left = plane(SLAB.d, SLAB.h, wallMatSide); left.rotation.y = Math.PI / 2; left.position.set(-SLAB.w / 2, -SLAB.h / 2, 0);
  const right = plane(SLAB.d, SLAB.h, wallMatSide); right.rotation.y = -Math.PI / 2; right.position.set(SLAB.w / 2, -SLAB.h / 2, 0);
  const bottom = plane(SLAB.w, SLAB.d, new THREE.MeshStandardMaterial({ color: 0x9c7a58, roughness: 1, side: THREE.DoubleSide })); bottom.rotation.x = -Math.PI / 2; bottom.position.y = -SLAB.h + 0.002;
  scene.add(walls);
  const topTex = soilTopTexture(seed);
  const topMat = new THREE.MeshStandardMaterial({ map: topTex, roughness: 1, side: THREE.DoubleSide });
  const top = new THREE.Mesh(new THREE.BoxGeometry(SLAB.w, 0.1, SLAB.d), topMat); // 土表有一点厚度，正面看是一道边
  top.position.y = -0.05;
  top.receiveShadow = true;
  scene.add(top);
  // 正面的玻璃框
  const frame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d)), new THREE.LineBasicMaterial({ color: 0x5a4330, transparent: true, opacity: 0.45 }));
  frame.position.y = -SLAB.h / 2;
  scene.add(frame);

  // ---- 树的骨架 ----
  const rand = rng(seed);
  const crownPts = scatter(rand, 1100, [0, 4.1, 0], 3.7, 2.3, 2.8, (p, x, y) => y > -0.8);
  const crown = colonize({ start: [0, 0, 0], dir: [0, 1, 0], trunk: 1.3, attractors: crownPts, seg: 0.11, influence: 1.4, kill: 0.22, tropism: [0, 0.1, 0], rTip: 0.011, pipe: 2.25 });
  const rootPts = scatter(rand, 800, [0, -1.35, 0], 5.6, 1.25, 2.6, (p) => p[1] < -0.25);
  const roots = colonize({ start: [0, -0.1, 0], dir: [0, -1, 0], trunk: 0.3, attractors: rootPts, seg: 0.11, influence: 1.6, kill: 0.2, tropism: [0, -0.06, 0], rTip: 0.007 });

  const crownMesh = branchMeshes(crown, new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.85 }), true);
  const rootDark = branchMeshes(roots, new THREE.MeshStandardMaterial({ color: C.root, roughness: 0.9 }), false);
  const rootLit = branchMeshes(roots, new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 1.05, roughness: 0.5 }), false);
  scene.add(crownMesh.group, rootDark.group, rootLit.group);

  const leaves = leafMesh(crown, rng(seed + 11));
  scene.add(leaves.mesh);

  // ---- 后期：只让发光的根泛光 ----
  const rt = new THREE.WebGLRenderTarget(VW * dpr, VH * dpr, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(dpr);
  composer.setSize(VW, VH);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(VW, VH), 0.45, 0.45, 1.0);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const v = new THREE.Vector3();
  function project(p) {
    v.set(p[0], p[1], p[2]).project(camera);
    return { x: (v.x * 0.5 + 0.5) * VW, y: (-v.y * 0.5 + 0.5) * VH, behind: v.z > 1 };
  }

  /**
   * state:
   *   front     树冠生长前沿（沿路径的长度，0..crown.maxPath）
   *   rootFront 根系生长前沿
   *   litFront  根系点亮前沿（< rootFront）
   *   leaf      叶子整体比例 0..1
   *   cam {pos, tgt, fov?}
   */
  // 先定机位（标签投影要用这一帧的机位），再算场景状态，最后 render
  function setCam(cam) {
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.tgt);
    if (cam.fov && camera.fov !== cam.fov) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
  }
  function render(s) {
    if (s.cam) setCam(s.cam);

    // 镜头低于土表：雾和环境光转成暖色，开地下暖光
    const ug = THREE.MathUtils.clamp(-camera.position.y / 1.0, 0, 1);
    scene.fog.color.copy(paper).lerp(new THREE.Color(C.amber), ug * 0.6);
    scene.fog.near = THREE.MathUtils.lerp(30, 6, ug);
    scene.fog.far = THREE.MathUtils.lerp(80, 22, ug);
    under.intensity = 10 * ug;
    // 深渊：镜头追着"竹竿"钻到土块以下时，背景和雾都换成琥珀色，地板藏起来（像无底的土）
    const ab = s.abyss ?? 0;
    scene.background.copy(paper).lerp(abyssCol, ab);
    if (ab > 0) {
      scene.fog.color.lerp(abyssCol, ab);
      scene.fog.near = THREE.MathUtils.lerp(scene.fog.near, 3, ab);
      scene.fog.far = THREE.MathUtils.lerp(scene.fog.far, 15, ab);
    }
    floor.visible = ab < 0.5 && !s.noFloor;
    // 生命之树那一段镜头拉得很远：雾推远，不然远处全被雾吃掉
    if (s.fogFar) { scene.fog.near = Math.max(scene.fog.near, s.fogFar * 0.45); scene.fog.far = Math.max(scene.fog.far, s.fogFar); }
    // 结尾：背景更亮更暖
    if (s.bright) { scene.background.lerp(brightCol, s.bright); scene.fog.color.copy(scene.background); }

    // 生长：tree 是整棵树的"年龄"0..1。年龄同时决定生长前沿和整体缩放（小树苗是大树的缩小版）
    const g = s.grow ?? 1, gr = s.rootGrow ?? g;
    const sc = 0.3 + 0.7 * g ** 0.8, scr = 0.3 + 0.7 * gr ** 0.8;
    crownMesh.group.scale.setScalar(sc); leaves.mesh.scale.setScalar(sc);
    rootDark.group.scale.setScalar(scr); rootLit.group.scale.setScalar(scr);
    const front = crown.maxPath * g, rootFront = roots.maxPath * gr, litFront = roots.maxPath * (s.lit ?? 0);
    crownMesh.update(front, Infinity);
    rootDark.update(rootFront, litFront, true);
    rootLit.update(Math.min(rootFront, litFront), Infinity);
    leaves.update(front, s.leaf ?? 1);

    composer.render();
  }
  return { renderer, scene, camera, render, setCam, project, crown, roots, SLAB, leaves };
}

// ---------- 枝干：实例化圆柱 + 关节球 ----------
function branchMeshes(T, mat, cast) {
  const { P, par, path, r, n, rTip, maxPath } = T;
  // 圆柱高 0..1，半径由实例属性 aR = (底半径, 顶半径) 在顶点着色器里插值，枝干就是平滑收细的
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 10, 1, true);
  cyl.translate(0, 0.5, 0);
  const aR = new THREE.InstancedBufferAttribute(new Float32Array(n * 2), 2);
  cyl.setAttribute("aR", aR);
  const taper = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aR;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.xz *= mix(aR.x, aR.y, position.y);");
    };
    return m;
  };
  const segMat = taper(mat.clone());
  const ball = new THREE.IcosahedronGeometry(1, 2);
  const segs = new THREE.InstancedMesh(cyl, segMat, n);
  segs.customDepthMaterial = taper(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
  const joints = new THREE.InstancedMesh(ball, mat, n);
  for (const m of [segs, joints]) { m.castShadow = cast; m.receiveShadow = true; m.frustumCulled = false; m.count = 0; }
  const group = new THREE.Group();
  group.add(segs, joints);

  const k = (r[0] - rTip) / maxPath; // 粗细随"年龄"增长：前沿走过越久越粗
  const age = (i, front) => Math.min(r[i], rTip + k * 1.25 * Math.max(0, front - path[i]));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), sc = new THREE.Vector3(), pos = new THREE.Vector3();

  // exclude + skipLit: path <= exclude 的段不画（让给"点亮"层）
  function update(front, exclude = -1, skipLit = false) {
    let ns = 0, nj = 0;
    for (let i = 1; i < n; i++) {
      const p0 = path[par[i]], p1 = path[i];
      if (front <= p0) continue;
      if (skipLit && p1 <= exclude) continue;
      const f = Math.min(1, (front - p0) / (p1 - p0));
      const a = P[par[i]], b = P[i];
      d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const len = d.length() * f;
      d.normalize();
      q.setFromUnitVectors(up, d);
      const r0 = age(par[i], front), r1 = f >= 1 ? age(i, front) : rTip;
      sc.set(1, len, 1);
      pos.set(a[0], a[1], a[2]);
      aR.setXY(ns, r0, r1);
      segs.setMatrixAt(ns++, m4.compose(pos, q, sc));
      // 关节球只放在拐弯和分叉处，盖住接缝
      if (f >= 1 && T.kids[i].length) {
        const rj = age(i, front);
        pos.set(b[0], b[1], b[2]);
        sc.set(rj, rj, rj);
        joints.setMatrixAt(nj++, m4.compose(pos, q.identity(), sc));
      }
    }
    segs.count = ns; joints.count = nj;
    segs.instanceMatrix.needsUpdate = true; joints.instanceMatrix.needsUpdate = true;
    aR.needsUpdate = true;
  }
  return { group, update };
}

// ---------- 叶子：枝梢附近的低多边形叶团 ----------
function leafMesh(T, rand) {
  const { P, path, reach, kids, n } = T;
  const spots = [];
  for (let i = 1; i < n; i++) {
    if (reach[i] - path[i] > 0.6) continue; // 只在靠近枝梢的地方长
    if (P[i][1] < 1.7) continue;
    const reps = kids[i].length ? 2 : 4;
    for (let j = 0; j < reps; j++) {
      spots.push({
        i, at: path[i] + 0.1 + rand() * 0.2,
        p: [P[i][0] + (rand() - 0.5) * 0.42, P[i][1] + (rand() - 0.35) * 0.32, P[i][2] + (rand() - 0.5) * 0.42],
        s: 0.07 + rand() * 0.07, rot: [rand() * 6.28, rand() * 6.28, rand() * 6.28], c: C.leaf[Math.floor(rand() * C.leaf.length)],
      });
    }
  }
  const geo = new THREE.IcosahedronGeometry(1, 0);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.75, flatShading: true });
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const col = new THREE.Color();
  spots.forEach((s, j) => mesh.setColorAt(j, col.set(s.c)));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  function update(front, k) {
    let c = 0;
    for (const s of spots) {
      const g = Math.min(1, Math.max(0, (front - s.at) / 0.5)) * k;
      if (g <= 0.001) continue;
      const z = s.s * (g * g * (3 - 2 * g));
      pos.set(...s.p); e.set(...s.rot); q.setFromEuler(e); sc.set(z * 1.3, z * 0.35, z);
      mesh.setMatrixAt(c++, m4.compose(pos, q, sc));
    }
    mesh.count = c;
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, update, count: spots.length };
}

// ---------- 程序化贴图 ----------
function strataTexture(seed) {
  const cv = document.createElement("canvas");
  cv.width = 1024; cv.height = 512;
  const g = cv.getContext("2d"), rand = rng(seed + 3);
  const bands = ["#c9a77c", "#b8936a", "#d6bb94", "#a98260", "#c19a70", "#d9c29f", "#b08a63"];
  let y = 0;
  while (y < 512) {
    const h = 30 + rand() * 90;
    g.fillStyle = bands[Math.floor(rand() * bands.length)];
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 1024; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + rand()) * 4);
    g.lineTo(1024, y + h); g.lineTo(0, y + h); g.closePath(); g.fill();
    y += h;
  }
  for (let i = 0; i < 2400; i++) { // 小石子和颗粒
    g.fillStyle = `rgba(${rand() < 0.5 ? "40,28,18" : "225,205,175"},${0.08 + rand() * 0.18})`;
    g.beginPath(); g.arc(rand() * 1024, rand() * 512, 0.6 + rand() * 2.4, 0, 6.29); g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function soilTopTexture(seed) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 512;
  const g = cv.getContext("2d"), rand = rng(seed + 5);
  g.fillStyle = "#b89672"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const c = rand();
    g.fillStyle = c < 0.4 ? `rgba(90,64,40,${0.12 + rand() * 0.2})` : c < 0.8 ? `rgba(160,128,96,${0.15 + rand() * 0.25})` : `rgba(110,140,80,${0.25 + rand() * 0.3})`;
    g.beginPath(); g.arc(rand() * 512, rand() * 512, 0.8 + rand() * 3, 0, 6.29); g.fill();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 1.5);
  return t;
}

// ---------- 任意一组收细的管子（决策树枝、二叉树的边……） ----------
// segs: [{ a:[x,y,z], b:[x,y,z], r0, r1 }]
export function makeTubes(segs, mat, { cast = true, radial = 10 } = {}) {
  const cyl = new THREE.CylinderGeometry(1, 1, 1, radial, 1, true);
  cyl.translate(0, 0.5, 0);
  const aR = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, segs.length) * 2), 2);
  cyl.setAttribute("aR", aR);
  const taper = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aR;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\ntransformed.xz *= mix(aR.x, aR.y, position.y);");
    };
    return m;
  };
  const mesh = new THREE.InstancedMesh(cyl, taper(mat.clone()), Math.max(1, segs.length));
  mesh.customDepthMaterial = taper(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
  mesh.castShadow = cast; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), d = new THREE.Vector3(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
  // grow: 每段 0..1 的长出比例（默认全长）
  function update(grow) {
    let c = 0;
    segs.forEach((g, i) => {
      const f = grow ? grow(g, i) : 1;
      if (f <= 0) return;
      d.set(g.b[0] - g.a[0], g.b[1] - g.a[1], g.b[2] - g.a[2]);
      const len = d.length() * Math.min(1, f);
      d.normalize(); q.setFromUnitVectors(up, d);
      pos.set(...g.a); sc.set(1, len, 1);
      aR.setXY(c, g.r0, f >= 1 ? g.r1 : g.r1 + (g.r0 - g.r1) * (1 - f));
      mesh.setMatrixAt(c++, m4.compose(pos, q, sc));
    });
    mesh.count = c; mesh.instanceMatrix.needsUpdate = true; aR.needsUpdate = true;
  }
  update();
  return { mesh, update };
}
