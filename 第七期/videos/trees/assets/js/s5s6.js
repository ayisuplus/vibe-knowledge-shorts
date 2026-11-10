// S5 读懂一句话：语法树（85.68–102.70）· S6 做决定：决策树、过拟合、剪枝（102.70–136.75）
import * as THREE from "three";
import { clamp, ramp, ease, easeIn, easeOut, easeOutBack, win, el, show, lerp, labelPool, pulse } from "./lib.js";
import { makeGraph } from "./graph.js";
import { makeTubes, C } from "./world.js";
import { melon, scissors } from "./props.js";

export const START = 85.68, END = 136.75;
const T5 = { line: 85.68, two: 87.81, left: 89.93, right: 92.07, both: 94.19, calc: 96.32, eval: 98.45, up: 100.58 };
const T6 = {
  out: 102.7, q20: 104.84, q20end: 106.96, melon: 109.09, q1: 111.21, q2: 113.35, good: 115.47, name: 117.6,
  over: 119.33, m2: 121.86, coral: 123.98, sc: 126.11, snip: 129.03, clean: 130.37, back: 132.49, sprout: 134.35,
};
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const CAM = [
  [86.6, [-1.0, -1.75, 8.8], [-1.0, -2.05, 1.4]],
  [95.8, [-1.0, -1.7, 8.6], [-1.0, -2.05, 1.4]],
  [100.4, [-0.6, -2.1, 6.4], [0, -1.7, 0]],
  [101.5, [-0.4, -2.0, 6.2], [0, -1.4, 0]],
  [102.55, [0.6, -0.15, 6.0], [0.3, 1.4, 0.4]],
  [103.3, [1.6, 1.0, 7.4], [0.6, 2.0, 0.4]],
  [104.8, [3.4, 2.6, 10.2], [1.6, 2.2, 0.8]],
  [108.8, [3.6, 2.7, 9.6], [1.9, 2.2, 1.0]],
  [110.4, [4.3, 2.9, 7.6], [2.9, 2.35, 1.5]],
  [117.5, [4.1, 2.9, 7.8], [2.8, 2.3, 1.5]],
  [119.6, [4.9, 3.0, 7.6], [3.5, 2.45, 1.7]],
  [129.5, [4.8, 2.9, 7.5], [3.4, 2.4, 1.7]],
  [132.4, [4.6, 2.9, 8.2], [3.0, 2.3, 1.4]],
  [136.75, [7.5, 4.2, 17.0], [0.8, 1.6, 0]],
];

export function build(W) {
  const S = W.scene;
  const G = makeGraph(S, 24, 24);

  // ======================= S5 =======================
  const SENT = { c: [-1.0, -0.95, 1.4], l: [-3.2, -0.95, 1.4], r: [1.2, -0.95, 1.4] };
  const mkSent = (a, b) => el(`<span>${a}</span><i class="cut"></i><span>${b}</span>`, "sent");
  const sentL = mkSent("咬死了", "猎人的狗"), sentR = mkSent("咬死了猎人的", "狗");
  const TREES = [
    { root: [-3.2, -1.5, 1.4], kids: [[-4.15, -2.3, 1.4], [-2.25, -2.3, 1.4]], words: ["咬死了", "猎人的狗"], mean: "死的是：<b>狗</b>", t0: T5.left, sent: sentL },
    { root: [1.2, -1.5, 1.4], kids: [[0.25, -2.3, 1.4], [2.15, -2.3, 1.4]], words: ["咬死了猎人的", "狗"], mean: "死的是：<b>猎人</b>", t0: T5.right, sent: sentR },
  ];
  const pLab = labelPool(4, "lab", W.project);
  const means = TREES.map((tr) => el(tr.mean, "mean"));
  // 1 + 2 × 3
  const EX = [
    { s: "+", p: [-1.0, -1.25, 1.4], par: -1, d: 0 }, { s: "1", p: [-2.1, -2.05, 1.4], par: 0, d: 1 }, { s: "×", p: [0.1, -2.05, 1.4], par: 0, d: 1 },
    { s: "2", p: [-0.55, -2.85, 1.4], par: 2, d: 2 }, { s: "3", p: [0.75, -2.85, 1.4], par: 2, d: 2 },
  ];
  const eLab = labelPool(5, "lab num", W.project);
  const exLine = el(`1 + 2 × 3`, "sent expr");
  const wrong = el(`<s>(1 + 2) × 3 = 9</s><b>✕</b>`, "wrong");

  // ======================= S6 =======================
  const wood = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.85 });
  const Q = { trunk: [0.05, 1.45, 0.2], q1: [1.5, 2.25, 1.35], q2: [2.75, 2.0, 1.9], good: [3.6, 1.62, 2.35], bad: [2.35, 3.05, 1.05], q3: [3.85, 2.55, 1.8] };
  const limbSegs = [
    { a: Q.trunk, b: Q.q1, r0: 0.11, r1: 0.075, t: 102.95 }, { a: Q.q1, b: Q.q2, r0: 0.07, r1: 0.055, t: 103.45 },
    { a: Q.q1, b: Q.bad, r0: 0.05, r1: 0.03, t: 103.5 }, { a: Q.q2, b: Q.good, r0: 0.045, r1: 0.028, t: 103.85 }, { a: Q.q2, b: Q.q3, r0: 0.045, r1: 0.03, t: 103.9 },
  ];
  const limb = makeTubes(limbSegs, wood);
  S.add(limb.mesh);
  const discs = ["q1", "q2", "q3"].map((k) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0xf3e7d3, roughness: 0.8 })); m.position.set(...Q[k]); m.rotation.x = Math.PI / 2; m.castShadow = true; S.add(m); return m; });
  const leafG = new THREE.IcosahedronGeometry(1, 1);
  const lg = new THREE.Mesh(leafG, new THREE.MeshStandardMaterial({ color: C.leaf[0], roughness: 0.7, flatShading: true, emissive: 0x2f6a2c, emissiveIntensity: 0 }));
  lg.position.set(...Q.good); lg.rotation.z = -0.4; lg.castShadow = true; S.add(lg);
  const lb = new THREE.Mesh(leafG, new THREE.MeshStandardMaterial({ color: 0xb59a5a, roughness: 0.7, flatShading: true }));
  lb.position.set(...Q.bad); lb.rotation.z = 0.5; lb.castShadow = true; S.add(lb);
  // 过拟合：q3 末端疯长的细枝
  const twigEnds = [[4.75, 3.05, 2.05], [4.9, 2.55, 2.3], [4.6, 2.1, 2.45], [4.35, 3.25, 1.6]];
  const twigSegs = [];
  twigEnds.forEach((e, i) => {
    const mid = [(Q.q3[0] + e[0]) / 2 + 0.1, (Q.q3[1] + e[1]) / 2 + 0.08, (Q.q3[2] + e[2]) / 2];
    const t0 = T6.over + i * 0.18;
    twigSegs.push({ a: Q.q3, b: mid, r0: 0.026, r1: 0.018, t: t0, i }, { a: mid, b: e, r0: 0.018, r1: 0.01, t: t0 + 0.3, i });
    twigSegs.push({ a: mid, b: [mid[0] + 0.25, mid[1] - 0.15, mid[2] + 0.2], r0: 0.012, r1: 0.007, t: t0 + 0.4, i });
  });
  for (const g of twigSegs) { g.a0 = g.a.slice(); g.b0 = g.b.slice(); }
  const twigMat = new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.7 });
  const twigs = makeTubes(twigSegs, twigMat);
  const coralC = new THREE.Color(0xe8705a);
  S.add(twigs.mesh);
  const M1 = melon(0), M2 = melon(1);
  S.add(M1, M2);
  const SC = scissors(W.renderer);
  S.add(SC.group);
  // 地面上冒出的小芽（S7 会长成森林）
  const sprouts = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.3 * Math.sin(i * 7.1), r = 3.2 + ((i * 53) % 9) * 0.32;
    const x = Math.cos(a) * r * 1.55, z = Math.sin(a) * r * 0.62;
    if (Math.abs(x) > 6.1 || Math.abs(z) > 2.9) continue;
    sprouts.push({ p: [x, 0, z], t: [T6.sprout, 134.63, 135.95][i % 3] + (i % 5) * 0.05 });
  }
  const spStem = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.018, 1, 6).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: 0x6fa25a, roughness: 0.7 }), sprouts.length);
  const spLeaf = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshStandardMaterial({ color: 0x8cc084, roughness: 0.7 }), sprouts.length * 2);
  for (const m of [spStem, spLeaf]) { m.castShadow = true; m.frustumCulled = false; m.count = 0; S.add(m); }

  const tags = labelPool(4, "tag", W.project);
  const yn = labelPool(4, "yn", W.project);
  const over = labelPool(3, "tag over", W.project);
  const verdict = labelPool(1, "tag bad", W.project);
  const q20 = el(`<div class="r1">问 <b class="n">1</b> 个是非题</div><div class="r2">能分清 <b class="N">2</b> 样东西</div>`, "q20");
  const q20n = q20.querySelector(".n"), q20N = q20.querySelector(".N");
  const note = el("例子来自周志华《机器学习》", "note");

  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sc3 = new THREE.Vector3(), pv = new THREE.Vector3(), eul = new THREE.Euler();

  // 西瓜沿枝滑：给出一串 [时间, 位置]，算当前位置和滚过的距离
  const ride = (keys, t) => {
    let p = keys[0][1], dist = 0;
    for (let i = 1; i < keys.length; i++) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i];
      const k = ease(ramp(t, t0, t1 - t0));
      const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      if (t >= t0) { p = lerp3(a, b, k); dist += seg * k; }
    }
    return { p, dist };
  };
  const UP = [0, 0.2, 0];
  const M1K = [[T6.melon, add3(Q.q1, [0, 2.2, 0])], [T6.melon + 0.45, add3(Q.q1, UP)], [111.6, add3(Q.q1, UP)], [112.7, add3(Q.q2, UP)], [113.75, add3(Q.q2, UP)], [114.9, add3(Q.good, [0, 0.25, 0])]];
  const M2K = [[T6.m2, add3(Q.q1, [0, 2.2, 0])], [T6.m2 + 0.35, add3(Q.q1, UP)], [122.6, add3(Q.q2, UP)], [123.1, add3(Q.q3, UP)], [123.6, add3(twigEnds[1], [0, 0.18, 0])]];

  function state(t) {
    const nodes = [], edges = [];
    // ---------- S5 两棵语法树 ----------
    const s5Out = ease(ramp(t, T5.calc - 0.25, 0.5));
    const sO = win(t, T5.line, T5.calc - 0.2, 0.4, 0.45);
    TREES.forEach((tr, i) => {
      const split = easeOut(ramp(t, T5.two, 0.8));
      const p = lerp3(SENT.c, i ? SENT.r : SENT.l, split);
      const q = W.project(p);
      // 分开前两份叠在一起，只显示一份
      show(tr.sent, sO * (i === 0 || split > 0.02 ? 1 : 0), `translate(${q.x}px, ${q.y}px) translate(-50%, -50%)`);
      const cw = ease(ramp(t, tr.t0, 0.4));
      const cut = tr.sent.querySelector(".cut");
      cut.style.width = `${cw * 26}px`; cut.style.opacity = cw > 0.01 ? 1 : 0;
      const g = ease(ramp(t, tr.t0, 0.6)) * (1 - s5Out);
      if (g > 0) {
        nodes.push({ p: tr.root, r: 0.09 * easeOutBack(ramp(t, tr.t0, 0.35)) * (1 - s5Out), lit: true });
        edges.push({ a: [tr.root[0], -0.98, 1.4], b: tr.root, r0: 0.025, r1: 0.025, f: g, lit: true });
        tr.kids.forEach((k, j) => {
          edges.push({ a: tr.root, b: k, r0: 0.03, r1: 0.024, f: ease(ramp(t, tr.t0 + 0.2, 0.5)) * (1 - s5Out), lit: true });
          nodes.push({ p: k, r: 0.08 * easeOutBack(ramp(t, tr.t0 + 0.55, 0.35)) * (1 - s5Out), lit: true });
          pLab.set(i * 2 + j, tr.words[j], k, ease(ramp(t, tr.t0 + 0.6, 0.3)) * (1 - s5Out), "", 30);
        });
      } else tr.kids.forEach((_, j) => pLab.set(i * 2 + j, "", null, 0));
      const mq = W.project([tr.root[0], -3.0, 1.4]);
      show(means[i], ease(ramp(t, tr.t0 + 0.9, 0.35)) * (1 - s5Out), `translate(${mq.x}px, ${mq.y}px) translate(-50%, -50%) scale(${1 + 0.08 * pulse(t, T5.both, 0.5)})`);
    });
    // 1 + 2 × 3
    const eOut = ease(ramp(t, T5.up - 0.1, 0.5));
    const eO = win(t, T5.calc, T5.up, 0.4, 0.45);
    { const q = W.project([-1.0, -0.75, 1.4]); show(exLine, eO, `translate(${q.x}px, ${q.y}px) translate(-50%, -50%)`); }
    EX.forEach((n, i) => {
      const t0 = T5.calc + 0.3 + n.d * 0.35;
      const b = easeOutBack(ramp(t, t0, 0.35)) * (1 - eOut);
      if (b <= 0) return eLab.set(i, "", null, 0);
      const done6 = t >= T5.eval, done7 = t >= T5.eval + 0.55;
      const dim = (n.d === 2 && done6) || (n.d === 1 && done7);
      nodes.push({ p: n.p, r: 0.07 * b, lit: !dim, color: 0xb9ab95 });
      if (n.par >= 0) edges.push({ a: EX[n.par].p, b: n.p, r0: 0.026, r1: 0.022, f: ease(ramp(t, t0 - 0.15, 0.4)) * (1 - eOut), lit: !dim, color: 0xb9ab95 });
      let txt = n.s, cls = "";
      if (i === 2 && done6) { txt = "6"; cls = "hi"; }
      if (i === 0 && done7) { txt = "= 7"; cls = "hi"; }
      eLab.set(i, txt, n.p, ease(ramp(t, t0 + 0.1, 0.3)) * (1 - eOut) * (dim ? 0.45 : 1), cls, -125);
    });
    show(wrong, win(t, T5.eval + 0.9, T5.up, 0.3, 0.4) * (1 - eOut));
    G.draw(nodes, edges, 1 + 0.8 * pulse(t, T5.eval, 0.5) + 0.8 * pulse(t, T5.eval + 0.55, 0.5));

    // ---------- S6 决策树枝 ----------
    const s6 = t > T6.out - 0.3 && t < 153.85; // 153.85 之后书页盖住画面，回到开场那一帧（没有决策枝）
    limb.mesh.visible = s6;
    if (s6) limb.update((g) => easeOut(ramp(t, g.t, 0.55)));
    discs.forEach((d, i) => { const k = easeOutBack(ramp(t, [103.5, 103.95, 104.0][i], 0.35)); d.visible = s6 && k > 0; d.scale.set(0.12 * k, 0.12 * k, 0.12 * k); });
    const lgk = easeOutBack(ramp(t, 104.1, 0.4)), lbk = easeOutBack(ramp(t, 103.8, 0.4));
    lg.visible = s6 && lgk > 0; lg.scale.set(0.24 * lgk, 0.1 * lgk, 0.18 * lgk);
    lg.material.emissiveIntensity = 0.9 * ease(ramp(t, T6.good, 0.3)) * (1 - ease(ramp(t, T6.name + 1.2, 0.6)));
    lb.visible = s6 && lbk > 0; lb.scale.set(0.2 * lbk, 0.08 * lbk, 0.15 * lbk);

    // 西瓜 1：落到第一个问题，一路滑到"好瓜"
    M1.visible = t > T6.melon && t < T6.over + 0.6;
    if (M1.visible) {
      const { p, dist } = ride(M1K, t);
      const k = 1 - ease(ramp(t, T6.over, 0.5));
      M1.position.set(...p); M1.scale.set(0.24 * k, 0.21 * k, 0.21 * k); M1.rotation.set(0.3, 0.8, 1.2 - dist / 0.21);
    }
    // 西瓜 2：同一套问题，掉进细枝里，被判成"坏瓜"
    M2.visible = t > T6.m2 && t < 125.9;
    if (M2.visible) {
      const { p, dist } = ride(M2K, t);
      const k = 1 - ease(ramp(t, 125.2, 0.6));
      M2.position.set(...p); M2.scale.set(0.22 * k, 0.2 * k, 0.2 * k); M2.rotation.set(0.2, 1.4, 0.4 - dist / 0.2);
    }
    // 问题牌、是 / 否
    const tagO = (t0) => ease(ramp(t, t0, 0.3)) * (1 - ease(ramp(t, T6.back + 0.6, 0.6)));
    const glow = t > T6.name && t < T6.name + 1.4 ? "hi" : "";
    tags.set(0, "纹理清晰吗？", Q.q1, tagO(T6.q1), glow, 45); // 牌子挂在节点下方，西瓜从上面滑过
    tags.set(1, "根蒂蜷缩吗？", Q.q2, tagO(T6.q2), glow, 45);
    tags.set(2, "好瓜", Q.good, tagO(T6.good), "good", 40);
    tags.set(3, "坏瓜", Q.bad, tagO(T6.good), "bad", -150);
    const mid = (a, b) => lerp3(a, b, 0.5);
    yn.set(0, "是", mid(Q.q1, Q.q2), tagO(111.6), "", -170);
    yn.set(1, "否", mid(Q.q1, Q.bad), tagO(111.6), "no", -40);
    yn.set(2, "是", mid(Q.q2, Q.good), tagO(113.75), "", 60);
    yn.set(3, "否", mid(Q.q2, Q.q3), tagO(113.75), "no", -140);
    show(note, win(t, T6.name, T6.over, 0.3, 0.3));

    // 细枝：长出来 → 变珊瑚色 → 被剪掉、落下
    const cut = t >= T6.snip;
    twigs.mesh.visible = t > T6.over - 0.1 && t < T6.snip + 1.4;
    if (twigs.mesh.visible) {
      twigs.mesh.material.color.set(C.wood).lerp(coralC, ease(ramp(t, T6.coral, 0.4))); // makeTubes 用的是克隆的材质
      const fall = cut ? t - T6.snip : 0;
      for (const g of twigSegs) {
        const dy = -4.9 * fall * fall, dx = fall * 0.4 * (g.i % 2 ? 1 : -1) * 0;
        g.a = [g.a0[0] + dx, g.a0[1] + dy, g.a0[2]]; g.b = [g.b0[0] + dx + fall * 0.3, g.b0[1] + dy - fall * 0.2, g.b0[2]];
      }
      const shrink = 1 - ease(ramp(t, T6.snip + 0.5, 0.8));
      twigs.update((g) => { g.r0 = (g.r0b ??= g.r0) * shrink; g.r1 = (g.r1b ??= g.r1) * shrink; return easeOut(ramp(t, g.t, 0.45)); });
    }
    const ovO = (i) => ease(ramp(t, T6.over + 0.4 + i * 0.25, 0.3)) * (1 - ease(ramp(t, T6.snip, 0.3)));
    over.set(0, "周二买的吗？", twigEnds[0], ovO(0), "", -130);
    over.set(1, "摊主戴帽子吗？", twigEnds[1], ovO(1), "", -60);
    over.set(2, "瓜上有个小斑点吗？", twigEnds[2], ovO(2), "", 20);
    verdict.set(0, `坏瓜 <b class="x">✕</b>`, twigEnds[1], ease(ramp(t, 123.6, 0.25)) * (1 - ease(ramp(t, 125.4, 0.4))), "", 60);

    // 剪刀：飞进来 → 张开 → 咔嚓 → 退出去
    const scIn = easeOut(ramp(t, T6.sc, 1.1)), scOut = easeIn(ramp(t, 129.7, 0.9));
    SC.group.visible = t > T6.sc && t < 130.7;
    if (SC.group.visible) {
      const home = [4.05, 2.62, 2.45], away = [7.5, 3.6, 3.5];
      const p = lerp3(lerp3(away, home, scIn), away, scOut);
      SC.group.position.set(...p); SC.group.rotation.set(0.25, -0.9, 0.35); SC.group.scale.setScalar(0.9);
      SC.set(1 - ease(ramp(t, 128.55, 0.45)) + ease(ramp(t, 129.4, 0.4)) * 0.6);
    }

    // 20 个问题
    const qO = win(t, T6.q20, T6.melon - 0.1, 0.35, 0.4);
    show(q20, qO);
    if (qO > 0) {
      const n = Math.max(1, Math.min(20, 1 + Math.floor(19 * easeIn(ramp(t, T6.q20 + 0.2, T6.q20end - T6.q20 - 0.2)))));
      q20n.textContent = n; q20N.textContent = (2 ** n).toLocaleString("en-US");
      q20.style.transform = `scale(${1 + 0.1 * pulse(t, T6.q20end, 0.4)})`;
    }

    // 小芽
    let ns = 0, nl = 0;
    for (const s of sprouts) {
      if (t > 136.9) break; // S7 里长成小树
      const k = easeOutBack(ramp(t, s.t, 0.5));
      if (k <= 0) continue;
      pv.set(...s.p); sc3.set(1, 0.32 * k, 1); spStem.setMatrixAt(ns++, m4.compose(pv, qq.identity(), sc3));
      for (const side of [1, -1]) { pv.set(s.p[0] + side * 0.05 * k, 0.32 * k, s.p[2]); eul.set(0, 0, -0.5 * side); qq.setFromEuler(eul); sc3.set(0.07 * k, 0.018 * k, 0.04 * k); spLeaf.setMatrixAt(nl++, m4.compose(pv, qq, sc3)); }
    }
    spStem.count = ns; spLeaf.count = nl; spStem.instanceMatrix.needsUpdate = true; spLeaf.instanceMatrix.needsUpdate = true;

    // ---------- 主树 ----------
    const rootGrow = lerp(0.62, 0.7, ease(ramp(t, START, END - START)));
    const lit = rootGrow * ease(ramp(t, T5.up, 1.0)); // 回地面前，所有根一起点亮
    const g = t < 101.4 ? 0 : lerp(0.45, 0.78, easeOutBack(ramp(t, T6.out - 0.15, 1.6), 1.1));
    return { grow: g, leaf: 0.9 * ease(ramp(t, 102.5, 1.3)), rootGrow, lit };
  }
  return { state };
}
