// S9（v11）收尾：不扣题、不回落。魔方已经铺成了一条路，镜头接着哲理段最后那个机位，
// 贴着路面越飞越快冲向远方（路的后半段是同样的小方块，一直铺到地平线，金光一路亮到尽头）
// → 升华句砸下来：「没有拼不回去的人生 / 只有还没走到的路」→ 冲进尽头的光里，白闪，直接切黑
import { makeRoad, fly as roadFly, litAt } from "./road.js";
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, clamp, pulse, el, show, hash, slam } from "./util.js";
import { COLORS } from "../cube.js";

export default function S9({ THREE, Wd, cube, Wd: { scene } }) {
  const T = { t0: K(290), line: K(291.6), line2: K(293.4), flashEnd: 218.5, end: 218.8 };
  const rd = makeRoad(THREE, cube);
  const C = [0, 2.3, 0];
  const moves = [];

  // 路的后半段：同样大小的小方块，两块一排，接着魔方铺的那 13 排一直铺到地平线
  const ROWS = 150, R0 = rd.rows, N = (ROWS - R0) * 2;
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(0.94, 0.94, 0.94), new THREE.MeshPhysicalMaterial({ color: 0x0b0d11, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 }), N);
  const top = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.8, 0.8).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  const PAL = Object.values(COLORS).map((h) => new THREE.Color(h).multiplyScalar(1.15));
  const m4 = new THREE.Matrix4(), TC = [], TZ = [], tc = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const row = R0 + Math.floor(i / 2), x = i % 2 ? 0.56 : -0.56, z = rd.Z0 - row * rd.GAP;
    body.setMatrixAt(i, m4.makeTranslation(x, 0.52, z));
    top.setMatrixAt(i, m4.makeTranslation(x, 0.995, z));
    TC.push(PAL[Math.floor(hash(i + 1234) * 6)]); TZ.push(z); top.setColorAt(i, TC[i]);
  }
  const far = new THREE.Group(); far.add(body, top); far.visible = false; scene.add(far);
  // 金光：从路的起点一直亮到尽头（不吃雾，远处也亮），尽头一团光
  const gold = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  gold.color.setRGB(2.4, 1.7, 0.45);
  const edgeM = gold.clone(); edgeM.color.setRGB(3.4, 2.5, 0.8);
  const LEN = 320, path = new THREE.Group();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.7, LEN).rotateX(-Math.PI / 2), gold); path.add(strip);
  for (const x of [-1.36, 1.36]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, LEN), edgeM); e.position.x = x; path.add(e); }
  path.position.set(0, 0.012, 12.2 - LEN / 2); path.visible = false; scene.add(path);
  const sunM = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), sunM); sun.position.set(0, 1.2, -300); sun.visible = false; scene.add(sun);

  const line = el(`没有拼不回去的人生<br><em>只有还没走到的路</em>`, "phil phil3 flyL", "hud");
  const em = line.querySelector("em");
  const white = el("", "flash", "hud", "background:#FFF6E0"), black = el("", "flash", "hud", "background:#000");

  // 飞行：先慢慢起步、降到贴着路面，再越来越快（三次方加速），最后冲进尽头的光
  const u = (t) => clamp((t - T.t0) / (T.flashEnd - T.t0));
  const fly = (t) => roadFly(t, K);
  return {
    t0: T.t0, t1: T.end, T, moves, env: "stage",
    cam(t) {
      const z = 17 - fly(t), k = easeInOut(ramp(t, T.t0, 2.4));
      const pos = [lerp(0.855, 0, k), lerp(4.4, 1.5, k), z];
      const tgt = [0, lerp(0.8, 1.3, k), z - lerp(23, 40, k)];
      return { pos, tgt, fov: lerp(32, 40, easeIn(u(t))), bloom: 0.6 + 0.5 * easeIn(u(t)) };
    },
    cube(t) {
      return { pos: C, rot: [0, 0, 0], glow: 0.6, post: (c, i) => { if (i === 0) rd.sync(); rd.apply(c, i, 1); cube.light(c, litAt(rd.slotPos(rd.slotOf[i]).z, t, K)); } };
    },
    world(t, active) {
      far.visible = path.visible = sun.visible = active;
      if (!active) return;
      gold.opacity = 0.32 + 0.08 * Math.sin(t * 3); edgeM.opacity = 1;
      // v12：远处的方块跟着亮光的前沿依次亮起（没亮的略暗）
      for (let i = 0; i < N; i++) { const l = litAt(TZ[i], t, K); top.setColorAt(i, tc.copy(TC[i]).multiplyScalar(0.85 * Math.max(0.35, 1 + l)).addScalar(0.22 * Math.max(0, l))); } // 亮起时再加一点白，红、蓝也能发光
      top.instanceColor.needsUpdate = true;
      sun.scale.setScalar(6 + 40 * easeIn(u(t))); sunM.color.setRGB(3.0, 2.5, 1.4); sunM.opacity = 0.35 + 0.65 * u(t);
    },
    hud(t, active) {
      if (!active) { show(line, 0); show(white, 0); show(black, 0); return; }
      slam(line, t, T.line, T.flashEnd + 0.4, 1.5);
      const k = ramp(t, T.line2, 0.45); em.style.opacity = ease(k).toFixed(3); em.style.transform = `translateY(${(20 * (1 - easeOut(k))).toFixed(1)}px)`;
      show(white, ease(ramp(t, T.flashEnd - 0.35, 0.35)));
      show(black, t >= T.flashEnd + 0.06 ? 1 : 0);
    },
  };
}
