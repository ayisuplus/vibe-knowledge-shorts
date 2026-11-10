// S6（v9）群论 · 粒子实验室：从零讲「群」，每一条都拿魔方演示（约 31 秒）
// ① 数学家看的不是颜色，是「拧法」：R（拧一下再拧回）
// ② 拧一下、拧一串，每一种都算一个「元素」
// ③ 接着拧，还是一种拧法：R + U = R U（魔方真的拧 R、U，再悄悄拧回去）
// ④ 一下都不拧，也算一种：「不动」
// ⑤ 每一种都能原路拧回去：R + R⁻¹ = 不动（这就是魔方永远能复原的底气）
// ⑥ 满足这几条，就叫「群」
// ⑦ 样子有限 → 一直重复，迟早绕回起点（一圈光环，一个光点绕回原处）：这就是 105 次的秘密
// ⑧ 雪花、晶体、基本粒子的对称，也都写成群：魔方化成晶格 + 三道轨道环 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit } from "./util.js";
import { win } from "../lib.js";
import { schedule } from "../cube.js";
import { whipIn, whipOut } from "./s1.js";

export default function S8({ THREE, Wd, cube, Wd: { scene } }) {
  const T = { t0: K(146), e1: K(146.6), e2: K(151.5), clo: K(157.5), idn: K(163.5), inv: K(166.5), grp: K(172.5), ord: K(178.5), app: K(184.5), t1: K(190) };
  T.morph = T.app; T.rings = T.app + 0.4; T.a1 = T.app + 0.6; T.a2 = T.app + 1.8;
  const mv = { r1: K(147.2), r1b: K(149.4), cR: K(158.2), cU: K(159.4), iR: K(167.3), iRb: K(169) };
  const moves = [
    ...schedule("R", mv.r1, 0.6, 0), ...schedule("R'", mv.r1b, 0.6, 0),
    ...schedule("R", mv.cR, 0.6, 0), ...schedule("U", mv.cU, 0.6, 0), ...schedule("U' R'", K(162), 0.12, 0.03),
    ...schedule("R", mv.iR, 0.6, 0), ...schedule("R'", mv.iRb, 0.6, 0),
  ];
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
  const rings = new THREE.Group();
  [0, 1, 2].forEach((i) => {
    const m = new THREE.MeshBasicMaterial({ toneMapped: false }); m.color.setRGB(...(i === 2 ? [2.8, 1.9, 0.6] : [0.5, 2.6, 3.2]));
    const r = new THREE.Mesh(new THREE.TorusGeometry(2.7 + i * 0.35, 0.025, 8, 160), m); r.userData.i = i; rings.add(r);
  });
  rings.position.set(...C); rings.visible = false; scene.add(rings);
  // ⑦ 一圈光环 + 一个光点：绕一圈，回到原处，亮一下
  const loopG = new THREE.Group();
  const lm = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true }); lm.color.setRGB(0.4, 2.0, 2.6);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.03, 8, 200), lm); loopG.add(ring);
  const dm = new THREE.MeshBasicMaterial({ toneMapped: false }); dm.color.setRGB(3.2, 2.4, 0.6);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), dm); loopG.add(dot);
  const start = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10), new THREE.MeshBasicMaterial({ toneMapped: false })); start.material.color.setRGB(2.6, 2.6, 2.6); start.position.set(2.9, 0, 0); loopG.add(start);
  loopG.position.set(...C); loopG.rotation.set(1.15, 0, 0.2); loopG.visible = false; scene.add(loopG);

  // HUD：左边一块讲解区，每一步换一屏
  const chip = (s, cls = "") => `<span class="chip2 ${cls}">${s}</span>`, op = (s) => `<span class="gop">${s}</span>`;
  const P = [
    [T.e1, T.e2, `<div class="gtl">数学家看魔方，看的是「拧法」</div><div class="gtr">${chip("R", "k1")}</div>`],
    [T.e2, T.clo, `<div class="gtl">每一种拧法，都是一个「元素」</div><div class="gtr">${chip("R")}${chip("U")}${chip("R U")}${chip("R U R' U'")}</div>`],
    [T.clo, T.idn, `<div class="gtl">接着拧，还是一种拧法</div><div class="gtr gtr2">${chip("R", "k1")}${chip("U", "k2")}${chip("R U", "k3 fuse")}<i class="gring"></i></div>`],
    [T.idn, T.inv, `<div class="gtl">一下都不拧，也算一种</div><div class="gtr">${chip("不动", "k1")}</div>`],
    [T.inv, T.grp, `<div class="gtl">每一种，都能原路拧回去</div><div class="gtr gtr2">${chip("R", "k1")}${chip("R⁻¹", "inv k2")}${chip("不动", "k3 fuse")}<i class="gring"></i><i class="gdot"></i></div>`],
    [T.grp, T.ord, `<div class="gword">群</div><div class="gtl gsub">满足这几条的一堆「动作」</div><div class="gtags"><span>接着拧还在圈里</span><span>有「不动」</span><span>都能撤回</span></div>`],
    [T.ord, T.app, `<div class="gtl">样子有限，一直重复同一个动作</div><div class="gtl gbig">迟早会绕回起点</div><div class="gtl gsub">这就是 <b>105</b> 次的秘密</div>`],
  ].map(([a, b, h]) => ({ a, b, e: el(h, "gt", "hud") }));
  const a1 = el(`<b>230</b> 种晶体结构<small>空间群</small>`, "pn", "hud", "left:110px;top:250px");
  const a2 = el(`<b>SU(3)×SU(2)×U(1)</b><small>基本粒子的标准模型</small>`, "pn app2", "hud", "left:110px;top:560px");
  // 两个符号块相撞：tc 时刻撞上；merge=false 合成第三块，merge=true 湮灭成光点再变成「不动」
  function collide(box, tc, t, annihilate) {
    const a = box.querySelector(".k1"), b = box.querySelector(".k2"), c = box.querySelector(".k3"), ring = box.querySelector(".gring"), dot = box.querySelector(".gdot");
    const k = easeIn(ramp(t, tc - 0.5, 0.5)), after = t >= tc;
    a.style.transform = `translateX(${(195 * k).toFixed(1)}px)`; b.style.transform = `translateX(${(-195 * k).toFixed(1)}px)`;
    a.style.opacity = b.style.opacity = after ? 0 : 1;
    const kr = ramp(t, tc, 0.55);
    ring.style.opacity = (after ? 1 - kr : 0).toFixed(3); ring.style.transform = `translate(-50%, -50%) scale(${lerp(0.2, 3.2, easeOut(kr)).toFixed(3)})`;
    const k2 = ramp(t, tc + (annihilate ? 0.55 : 0.05), 0.35);
    c.style.opacity = ease(k2).toFixed(3); c.style.transform = `translateX(-50%) scale(${lerp(1.7, 1, easeOutBack(k2, 2)).toFixed(3)})`;
    if (dot) { const kd = ramp(t, tc, 0.6); dot.style.opacity = (after ? Math.sin(Math.PI * kd) : 0).toFixed(3); dot.style.transform = `translate(-50%, -50%) scale(${lerp(0.4, 1.4, kd).toFixed(3)})`; }
  }
  const lit = (e, cls, on) => { const c = e.querySelector("." + cls); if (c) c.classList.toggle("on", on); };
  return {
    t0: T.t0, t1: T.t1, T, moves, env: "collider",
    cam(t) {
      const wi = whipIn(t, T.t0), wo = whipOut(t, T.t1);
      return { pos: orbit(TG, 0.32 + 0.012 * (t - T.t0) + wi.off + wo.off, lerp(12.5, 11.4, ease(ramp(t, T.t0, 20))), 1.9), tgt: TG, fov: 32, blur: wi.blur + wo.blur };
    },
    cube(t) {
      const k = easeInOut(ramp(t, T.morph, 0.8)); // 最后：魔方散开、缩小，化成晶格
      return { pos: C, rot: [0.18, -0.45 + 0.03 * (t - T.t0), 0], hide: k >= 1, scale: 1 - 0.9 * k, explode: 1.2 * k, glow: 0.55 + 0.35 * pulse(t, T.ord + 2.6, 0.8) };
    },
    world(t, active) {
      lat.visible = active && t > T.morph + 0.2;
      if (lat.visible) { lat.scale.setScalar(Math.max(0.01, easeOutBack(ramp(t, T.morph + 0.2, 0.8), 1.2))); lat.rotation.set(0.5, 0.35 * (t - T.morph), 0.2); }
      rings.visible = active && t > T.rings;
      if (rings.visible) rings.children.forEach((r) => { const i = r.userData.i; r.rotation.set(t * (0.6 + i * 0.3) + i, t * (0.4 + i * 0.25), i * 1.1); r.scale.setScalar(easeOutBack(ramp(t, T.rings + i * 0.15, 0.6), 1.3) || 0.001); });
      const ol = active ? win(t, T.ord, T.app - 0.2, 0.5, 0.3) : 0;
      loopG.visible = ol > 0.01;
      if (loopG.visible) {
        lm.opacity = ol; ring.scale.setScalar(Math.max(0.01, easeOutBack(ramp(t, T.ord, 0.6), 1.2)));
        const a = (Math.PI * 2) * easeInOut(ramp(t, T.ord + 0.6, 2.0)); // 绕一圈，回到起点
        dot.position.set(2.9 * Math.cos(a), 2.9 * Math.sin(a), 0); dot.scale.setScalar(1 + 1.2 * pulse(t, T.ord + 2.6, 0.6));
      }
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      P.forEach((p) => {
        const o = on * win(t, p.a + 0.15, p.b - 0.3, 0.35, 0.25);
        show(p.e, o, `translateY(${(14 * (1 - easeOut(ramp(t, p.a + 0.15, 0.4)))).toFixed(1)}px)`);
      });
      // 动作条跟着魔方真的拧哪一下亮哪一下
      lit(P[0].e, "k1", t >= mv.r1 && t < mv.r1 + 0.8);
      lit(P[2].e, "k1", t >= mv.cR && t < mv.cU); lit(P[2].e, "k2", t >= mv.cU && t < mv.cU + 0.9); lit(P[2].e, "k3", true);
      // v13 MG：两个符号块撞在一起——R、U 合成一个「R U」；R、R⁻¹ 互相湮灭，只剩一个光点「不动」
      collide(P[2].e, mv.cU + 0.75, t, false);
      collide(P[4].e, mv.iRb + 0.75, t, true);
      // 「群」：三条规则飞进「群」字里，字亮一下
      { const g = P[5].e, w = g.querySelector(".gword"), tags = [...g.querySelectorAll(".gtags span")], tm = T.grp + 3.4, k = easeIn(ramp(t, tm, 0.55));
        tags.forEach((e, i) => { const ki = ramp(t, T.grp + 0.9 + i * 0.35, 0.3); e.style.opacity = (ease(ki) * (1 - ramp(t, tm + 0.45, 0.1))).toFixed(3); e.style.transform = `translate(${(-k * (120 + i * 230)).toFixed(1)}px, ${(-k * 210).toFixed(1)}px) scale(${lerp(lerp(1.4, 1, easeOutBack(ki, 2)), 0.3, k).toFixed(3)})`; });
        w.style.filter = `brightness(${(1 + 1.6 * pulse(t, tm + 0.45, 0.6)).toFixed(3)})`; w.style.transform = `scale(${(1 + 0.12 * pulse(t, tm + 0.45, 0.5)).toFixed(3)})`; }
      lit(P[3].e, "k1", t >= T.idn + 0.6);
      lit(P[4].e, "k1", t >= mv.iR && t < mv.iRb); lit(P[4].e, "k2", t >= mv.iRb && t < mv.iRb + 0.9); lit(P[4].e, "k3", true);
      const f = (t0) => on * ease(ramp(t, t0, 0.4)) * (1 - ease(ramp(t, T.t1 - 0.3, 0.25)));
      show(a1, f(T.a1), `translateX(${(-30 * (1 - easeOut(ramp(t, T.a1, 0.4)))).toFixed(1)}px)`);
      show(a2, f(T.a2), `translateX(${(-30 * (1 - easeOut(ramp(t, T.a2, 0.4)))).toFixed(1)}px)`);
    },
  };
}
