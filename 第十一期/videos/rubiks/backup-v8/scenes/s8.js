// S6（v3）群论应用 · 粒子实验室：甩镜进 → 魔方化成一块晶格，「群论」两个大字 → 晶格外绕起三道轨道环，
// 两条应用一条一条出来：晶体 230 种空间群、基本粒子 SU(3)×SU(2)×U(1) → 甩镜出（进上帝之数）
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit } from "./util.js";
import { whipIn, whipOut } from "./s1.js";

export default function S8({ THREE, Wd, cube, Wd: { scene } }) {
  const T = { t0: K(130), morph: K(131.2), word: K(132), rings: K(135.6), a1: K(136), a2: K(138.2), t1: K(142) };
  const C = [1.6, 2.3, 0], TG = [-0.8, 2.3, 0];

  // 晶格：4×4×4 个发光小球，两种颜色交替（像食盐的晶体）；稀一点，不要密集点阵
  const N = 4, geo = new THREE.SphereGeometry(0.2, 18, 12);
  const mA = new THREE.MeshBasicMaterial({ toneMapped: false }); mA.color.setRGB(0.25, 1.05, 1.35);
  const mB = new THREE.MeshBasicMaterial({ toneMapped: false }); mB.color.setRGB(0.95, 0.95, 1.05);
  const lat = new THREE.Group(); const iA = new THREE.InstancedMesh(geo, mA, N * N * N), iB = new THREE.InstancedMesh(geo, mB, N * N * N);
  const mm = new THREE.Matrix4(); let na = 0, nb = 0;
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) for (let z = 0; z < N; z++) {
    mm.makeTranslation((x - 1.5) * 0.95, (y - 1.5) * 0.95, (z - 1.5) * 0.95);
    if ((x + y + z) % 2) iA.setMatrixAt(na++, mm); else iB.setMatrixAt(nb++, mm);
  }
  iA.count = na; iB.count = nb; lat.add(iA, iB);
  lat.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.85, 2.85, 2.85, 3, 3, 3)), new THREE.LineBasicMaterial({ color: 0x2a7f99, transparent: true, opacity: 0.55 })));
  lat.position.set(...C); lat.visible = false; scene.add(lat);
  // 三道轨道环（像原子 / 粒子的轨道）
  const rings = new THREE.Group();
  [0, 1, 2].forEach((i) => {
    const m = new THREE.MeshBasicMaterial({ toneMapped: false }); m.color.setRGB(...(i === 2 ? [2.8, 1.9, 0.6] : [0.5, 2.6, 3.2]));
    const r = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.35, 0.025, 8, 160), m); r.userData.i = i; rings.add(r);
  });
  rings.position.set(...C); rings.visible = false; scene.add(rings);

  const word = el(`群论`, "holo bigword", "hud", "left:110px;top:250px");
  const wsub = el(`研究「转法」的数学`, "holo2", "hud", "left:122px;top:560px");
  const a1 = el(`<b>230</b> 种晶体结构<small>空间群</small>`, "pn", "hud", "left:110px;top:250px");
  const a2 = el(`<b>SU(3)×SU(2)×U(1)</b><small>基本粒子的标准模型</small>`, "pn app2", "hud", "left:110px;top:560px");
  return {
    t0: T.t0, t1: T.t1, T, env: "collider",
    cam(t) {
      const wi = whipIn(t, T.t0), wo = whipOut(t, T.t1);
      return { pos: orbit(TG, 0.35 + 0.03 * (t - T.t0) + wi.off + wo.off, lerp(12.5, 11.2, ease(ramp(t, T.t0, 8))), 1.8), tgt: TG, fov: 32, blur: wi.blur + wo.blur };
    },
    cube(t) {
      const k = easeInOut(ramp(t, T.morph, 0.8)); // 魔方散开、缩小，化成晶格
      return { pos: C, rot: [0.2 * Math.sin(t), 0.5 * (t - T.t0), 0], hide: k >= 1, scale: 1 - 0.9 * k, explode: 1.2 * k };
    },
    world(t, active) {
      lat.visible = active && t > T.morph + 0.2;
      if (lat.visible) { lat.scale.setScalar(Math.max(0.01, easeOutBack(ramp(t, T.morph + 0.2, 0.8), 1.2))); lat.rotation.set(0.5, 0.35 * (t - T.morph), 0.2); }
      rings.visible = active && t > T.rings;
      if (rings.visible) rings.children.forEach((r) => { const i = r.userData.i; r.rotation.set(t * (0.6 + i * 0.3) + i, t * (0.4 + i * 0.25), i * 1.1); r.scale.setScalar(easeOutBack(ramp(t, T.rings + i * 0.15, 0.6), 1.3) || 0.001); });
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      const ow = on * ease(ramp(t, T.word, 0.5)) * (1 - ease(ramp(t, T.a1 - 0.4, 0.35)));
      show(word, ow, `translateY(${(20 * (1 - easeOut(ramp(t, T.word, 0.6)))).toFixed(1)}px)`);
      show(wsub, on * ease(ramp(t, T.word + 0.6, 0.4)) * (1 - ease(ramp(t, T.a1 - 0.4, 0.35))));
      const f = (t0) => on * ease(ramp(t, t0, 0.4)) * (1 - ease(ramp(t, T.t1 - 0.3, 0.25)));
      show(a1, f(T.a1), `translateX(${(-30 * (1 - easeOut(ramp(t, T.a1, 0.4)))).toFixed(1)}px)`);
      show(a2, f(T.a2), `translateX(${(-30 * (1 - easeOut(ramp(t, T.a2, 0.4)))).toFixed(1)}px)`);
    },
  };
}
