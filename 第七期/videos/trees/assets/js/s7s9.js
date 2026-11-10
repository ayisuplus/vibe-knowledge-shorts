// S7 一片森林：随机森林（136.75–147.40）· S8 生命之树（147.40–166.54）· S9 金句（166.54–182）
import * as THREE from "three";
import { clamp, ramp, ease, easeIn, easeOut, easeOutBack, win, el, show, lerp, labelPool, pulse } from "./lib.js";
import { buildSapling } from "./lsys.js";
import { rng, scatter, colonize } from "./tree.js";
import { makeTubes, C } from "./world.js";
import { melon as melonMesh, scissors } from "./props.js";

export const START = 136.75, END = 182;
const T7 = { grow: 136.75, data: 138.88, vote: 141.01, fly: 141.8, tally: 143.14, back: 145.26 };
const T8 = { big: 147.4, all: 149.53, slide: 151.65, note: 153.77, think: 155.91, book: 158.03, home: 160.16, orbit: 162.3 };
const T9 = { warm: 166.54, line: 168.68, snip: 173.2, hold: 175.06, fade: 178.6 };
const HOOK = [[7.0, 1.7, 20.8], [0, 1.0, 0]];
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

export function build(W) {
  const S = W.scene;

  // ======================= S7 森林 =======================
  // 小芽的位置和 s5s6 里一样（它们在这里长成小树）
  const spots = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.3 * Math.sin(i * 7.1), r = 3.2 + ((i * 53) % 9) * 0.32;
    const x = Math.cos(a) * r * 1.55, z = Math.sin(a) * r * 0.62;
    if (Math.abs(x) > 6.1 || Math.abs(z) > 2.9) continue;
    spots.push([x, 0, z]);
  }
  // 再补一圈，凑成一片林子（避开主树和决策枝那一侧）
  { const r2 = rng(31);
    for (let gx = -5.5; gx <= 5.6; gx += 1.25) for (let gz = -2.5; gz <= 2.2; gz += 1.35) {
      const x = gx + (r2() - 0.5) * 0.5, z = gz + (r2() - 0.5) * 0.4;
      if (Math.hypot(x, z * 1.6) < 2.0) continue;
      if (x > 0.2 && x < 5.4 && z > 0.3) continue;
      if (spots.some((s) => Math.hypot(s[0] - x, s[2] - z) < 0.9)) continue;
      spots.push([x, 0, z]);
    } }
  const BEATS = [136.75, 137.28, 137.82, 138.35];
  const forest = spots.map((p, i) => {
    const t0 = BEATS[i % 4] + Math.floor(i / 4) * 0.09;
    const sap = buildSapling({ seed: 20 + i * 3, gens: 5, times: [t0, t0 + 0.22, t0 + 0.44, t0 + 0.66, t0 + 0.88, t0 + 1.1], grow: 0.3 });
    sap.group.position.set(...p);
    sap.group.rotation.y = i * 1.7;
    S.add(sap.group);
    return { sap, p, t0, s: 0.55 + ((i * 37) % 5) * 0.05, vote: i % 5 === 2 ? 0 : 1 };
  });
  // 每棵树面前一小堆瓜：数量和位置都不一样（每棵树看到的数据不同）
  const rand = rng(77);
  const piles = [];
  forest.forEach((f, i) => { const n = 1 + (i % 3); for (let j = 0; j < n; j++) piles.push({ i, p: [f.p[0] + (rand() - 0.5) * 0.5, 0.07, f.p[2] + 0.45 + rand() * 0.2], d: j * 0.08 + i * 0.03 }); });
  const melonMat = melonMesh(0).material;
  const pileMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 24, 16), melonMat, piles.length);
  pileMesh.castShadow = true; pileMesh.frustumCulled = false; pileMesh.count = 0;
  S.add(pileMesh);
  const votes = labelPool(forest.length, "vote", W.project);
  const nGood = forest.filter((f) => f.vote).length;
  const tally = el(`<div class="tl">好瓜 <b>${nGood}</b> : 坏瓜 <b>${forest.length - nGood}</b></div><div class="sy">示意</div>`, "tally");

  // ======================= S8 生命之树 =======================
  const lr = rng(5);
  const lifePts = scatter(lr, 650, [0, -38, 0], 72, 36, 16, (p) => p[1] > -60);
  for (let i = 0; i <= 10; i++) lifePts.push([lr() * 2 - 1, -6 - i * 3, lr() * 2 - 1]); // 一根枝一定要长到土块下面
  const life = colonize({ start: [0, -115, 0], dir: [0, 1, 0], trunk: 52, attractors: lifePts, seg: 1.6, influence: 18, kill: 3.2, tropism: [0, 0.12, 0], rTip: 0.22, pipe: 2.3 });
  // 离土块底部最近的节点 = 我们这棵树所在的枝梢
  let tip = 0, bd = 1e9;
  for (let i = 0; i < life.n; i++) { const p = life.P[i], d = p[0] ** 2 + (p[1] + 4) ** 2 + p[2] ** 2; if (d < bd) { bd = d; tip = i; } }
  // 从这个枝梢出发的图距离，决定"揭开"的顺序
  const adj = Array.from({ length: life.n }, () => []);
  for (let i = 1; i < life.n; i++) { adj[i].push(life.par[i]); adj[life.par[i]].push(i); }
  const dist = new Float32Array(life.n).fill(-1);
  dist[tip] = 0;
  const qq = [tip];
  while (qq.length) { const u = qq.shift(); for (const v of adj[u]) if (dist[v] < 0) { const p = life.P[u], q = life.P[v]; dist[v] = dist[u] + Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); qq.push(v); } }
  let maxD = 0;
  for (let i = 0; i < life.n; i++) maxD = Math.max(maxD, dist[i]);
  const lifeSegs = [];
  for (let i = 1; i < life.n; i++) {
    const a = i, b = life.par[i];
    const [n0, n1] = dist[a] <= dist[b] ? [a, b] : [b, a];
    lifeSegs.push({ a: life.P[n0], b: life.P[n1], r0: life.r[n0], r1: life.r[n1], d0: dist[n0], d1: dist[n1] });
  }
  lifeSegs.push({ a: life.P[tip], b: [0, -3.4, 0], r0: life.r[tip], r1: life.r[tip], d0: -3, d1: 0 });
  const lifeMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, emissive: 0x8a5a10, emissiveIntensity: 0.5, roughness: 0.6 });
  const lifeT = makeTubes(lifeSegs, lifeMat, { cast: false, radial: 8 });
  lifeT.mesh.receiveShadow = false;
  S.add(lifeT.mesh);
  // 枝梢上的小亮点
  const tips = [];
  for (let i = 0; i < life.n; i++) if (!life.kids[i].length && i !== tip) tips.push(i);
  const tipMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ color: C.gold, emissive: C.gold, emissiveIntensity: 1.6 }), tips.length);
  tipMesh.frustumCulled = false; tipMesh.count = 0;
  S.add(tipMesh);
  // 五种生物：挑分布开的五个枝梢
  const pick = (score) => tips.reduce((b, i) => (score(life.P[i]) > score(life.P[b]) ? i : b), tips[0]);
  const SPEC = [
    { k: "bird", i: pick((p) => -p[0] + p[1] * 0.3) }, { k: "fish", i: pick((p) => -p[0] * 0.3 - p[1]) }, { k: "flower", i: pick((p) => p[1] - Math.abs(p[0] - 30) * 0.8) },
    { k: "mush", i: pick((p) => p[0] - p[1] * 0.4) }, { k: "human", i: pick((p) => p[1] - Math.abs(p[0] + 22) * 0.8) },
  ];
  const specEls = SPEC.map((s) => el(ICONS[s.k], "spec"));
  const human = life.P[SPEC[4].i];

  // 达尔文的笔记页 → 书里的插图（自己画的示意，不仿手迹）
  const page = el(`<div class="pg note"><svg viewBox="0 0 520 420" width="520" height="420">${sketch()}</svg><div class="yr">1837</div><div class="think"><span>I think</span></div></div><div class="pg book"><svg viewBox="0 0 640 460" width="640" height="460">${bookFig()}</svg><div class="cap">《物种起源》1859 · 书中唯一的插图（示意）</div></div>`, "pages");
  const pNote = page.querySelector(".note"), pBook = page.querySelector(".book"), think = page.querySelector(".think span");

  // ======================= S9 =======================
  const line = el(`<div class="l1">画一棵树</div><div class="l2">一层，只问一个问题</div>`, "closing");
  // 一根多余的小枝：长在主树冠右侧朝镜头的枝梢上
  const Cr = W.crown;
  let ct = 1, cb = -1e9;
  // 选树冠左上边缘的枝梢，小枝朝左上伸出树冠，衬在纸色背景上看得清
  for (let i = 1; i < Cr.n; i++) if (!Cr.kids[i].length) { const p = Cr.P[i], sc = -p[0] * 0.9 + p[1] * 0.25 + p[2] * 0.5 - Math.abs(p[1] - 4.6) * 0.6; if (sc > cb) { cb = sc; ct = i; } }
  const T0 = Cr.P[ct], T1 = [T0[0] - 0.55, T0[1] + 0.45, T0[2] + 0.3], T2 = [T0[0] - 1.2, T0[1] + 0.7, T0[2] + 0.55];
  const stray = [{ a: T0, b: T1, r0: 0.045, r1: 0.032 }, { a: T1, b: T2, r0: 0.032, r1: 0.014 }, { a: T1, b: [T1[0] - 0.25, T1[1] + 0.5, T1[2] + 0.1], r0: 0.02, r1: 0.01 }];
  for (const g of stray) { g.a0 = g.a.slice(); g.b0 = g.b.slice(); }
  const strayT = makeTubes(stray, new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.8 }));
  S.add(strayT.mesh);
  const SC = scissors(W.renderer);
  S.add(SC.group);
  const fade = el("", "fadeout");

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc3 = new THREE.Vector3(), pv = new THREE.Vector3();

  function state(t) {
    // ---------- S7 ----------
    const forestOn = t > T7.grow - 0.05 && t < T8.note + 0.2;
    forest.forEach((f) => {
      f.sap.group.visible = forestOn;
      if (forestOn) f.sap.update(t, { leaf: ease(ramp(t, f.t0 + 1.0, 0.8)), scale: f.s });
    });
    let np = 0;
    if (forestOn) for (const p of piles) {
      const k = easeOutBack(ramp(t, T7.data + p.d, 0.35)) * (1 - ease(ramp(t, T7.back, 0.6)));
      if (k <= 0) continue;
      pv.set(...p.p); sc3.set(0.075 * k, 0.065 * k, 0.065 * k);
      pileMesh.setMatrixAt(np++, m4.compose(pv, q.identity(), sc3));
    }
    pileMesh.count = np; pileMesh.instanceMatrix.needsUpdate = true;
    // 投票：票从每棵树头顶飞到中间的计票牌。挨得近的票往上错开，不叠在一起
    const placed = [];
    forest.forEach((f, i) => {
      const t0 = T7.vote + i * 0.035;
      const fly = easeIn(ramp(t, T7.fly + i * 0.03, 0.85));
      const o = ease(ramp(t, t0, 0.2)) * (1 - ease(clamp(fly / 0.55)));
      if (o <= 0.001) return votes.set(i, "", null, 0);
      const top = [f.p[0], 2.35 * f.s, f.p[2]];
      const sp = W.project(top);
      let oy = 0;
      while (placed.some((q) => Math.abs(q.x - sp.x) < 84 && Math.abs(q.y - (sp.y - oy)) < 38)) oy += 38;
      placed.push({ x: sp.x, y: sp.y - oy });
      votes.set(i, f.vote ? "好瓜" : "坏瓜", top, o, f.vote ? "good" : "bad", -110);
      const x = lerp(sp.x, 960, fly), y = lerp(sp.y - oy, 150, fly);
      votes.els[i].style.transform = `translate(${x}px, ${y}px) translate(-50%, -110%) scale(${1 - 0.4 * fly})`;
    });
    show(tally, win(t, T7.fly + 0.85, T7.back + 0.6, 0.3, 0.5), `scale(${1 + 0.15 * pulse(t, T7.tally, 0.45)})`);

    // ---------- S8 ----------
    const lifeOn = t > T7.back && t < T8.note + 0.2;
    lifeT.mesh.visible = lifeOn; tipMesh.visible = lifeOn;
    if (lifeOn) {
      const front = maxD * easeIn(ramp(t, T7.back + 0.4, 3.6)) - 3;
      lifeT.update((g) => clamp((front - g.d0) / Math.max(0.5, g.d1 - g.d0)));
      let nt = 0;
      for (const i of tips) {
        const k = easeOutBack(ramp(front, dist[i], 6));
        if (k <= 0) continue;
        pv.set(...life.P[i]); const r = 0.9 * k; sc3.set(r, r, r);
        tipMesh.setMatrixAt(nt++, m4.compose(pv, q.identity(), sc3));
      }
      tipMesh.count = nt; tipMesh.instanceMatrix.needsUpdate = true;
    }
    SPEC.forEach((s, i) => {
      const o = win(t, T8.all + 0.1 + i * 0.15, T8.note - 0.2, 0.35, 0.3);
      const pp = W.project(life.P[s.i]);
      show(specEls[i], o, `translate(${pp.x}px, ${pp.y}px) translate(-50%, -105%) scale(${0.7 + 0.3 * easeOutBack(ramp(t, T8.all + 0.1 + i * 0.15, 0.4))})`);
    });
    // 笔记页 → 书页：盖满画面，后面趁机把镜头和主树换回开场那一帧
    show(page, win(t, T8.note - 0.25, T8.home, 0.45, 0.9));
    const flip = ease(ramp(t, T8.book - 0.2, 0.6));
    pNote.style.transform = `perspective(1600px) rotateY(${-90 * Math.min(1, flip * 2)}deg)`;
    pNote.style.opacity = flip < 0.5 ? 1 : 0;
    pBook.style.transform = `perspective(1600px) rotateY(${90 - 90 * Math.max(0, flip * 2 - 1)}deg)`;
    pBook.style.opacity = flip >= 0.5 ? 1 : 0;
    think.style.clipPath = `inset(0 ${100 - 100 * ease(ramp(t, T8.think, 1.0))}% 0 0)`;

    // ---------- S9 ----------
    show(line, win(t, T9.line, T9.fade, 0.6, 0.8));
    line.querySelector(".l2").style.opacity = ease(ramp(t, T9.line + 0.6, 0.5));
    const strayOn = t > T9.warm && t < T9.snip + 1.3;
    strayT.mesh.visible = strayOn;
    if (strayOn) {
      const fall = Math.max(0, t - T9.snip);
      for (const g of stray) { g.a = [g.a0[0] + fall * 0.2, g.a0[1] - 4.9 * fall * fall, g.a0[2]]; g.b = [g.b0[0] - fall * 0.5, g.b0[1] - 4.9 * fall * fall - fall * 0.3, g.b0[2]]; }
      const shrink = 1 - ease(ramp(t, T9.snip + 0.5, 0.7));
      strayT.update((g) => { g.r0 = (g.r0b ??= g.r0) * shrink; g.r1 = (g.r1b ??= g.r1) * shrink; return easeOut(ramp(t, T9.warm + 0.3, 0.6)); });
    }
    SC.group.visible = t > 171.7 && t < 175.2;
    if (SC.group.visible) {
      const home = [T1[0] - 0.95, T1[1] - 0.1, T1[2] + 0.3], away = [T1[0] - 5, T1[1] + 1.6, T1[2] + 2.5];
      const p = lerp3(lerp3(away, home, easeOut(ramp(t, 171.7, 1.0))), away, easeIn(ramp(t, 173.9, 1.0)));
      SC.group.position.set(...p); SC.group.rotation.set(0.15, 0.4, -0.25); SC.group.scale.setScalar(1.25);
      SC.set(1 - ease(ramp(t, T9.snip - 0.42, 0.4)) + 0.6 * ease(ramp(t, T9.snip + 0.25, 0.4)));
    }
    show(fade, ease(ramp(t, T9.fade, 2.8)));

    // ---------- 主树 / 世界 ----------
    const home = t > T8.note + 0.2; // 书页盖着的时候，主树直接换成完全体
    return {
      grow: home ? 1 : 0.78, leaf: home ? 1 : 0.9, rootGrow: home ? 1 : 0.7, lit: home ? 1 : 0.7,
      noFloor: t > T7.back + 0.3 && t < T8.note + 0.2, fogFar: t > T7.back - 1 && t < T8.note + 0.2 ? 460 : 0,
      bright: ease(ramp(t, T9.warm, 2.0)),
    };
  }
  return { state, human };
}

// 机位：S7 拉远 → S8 看全生命之树 → 沿"人"那根枝滑 → （书页盖住）→ 开场那一帧 → 慢慢环绕 → 让出左边写金句
export function cams(b) {
  const h = b.human;
  return [
    [139.4, [6.6, 3.7, 15.6], [0, 1.4, 0]],
    [143.6, [5.6, 3.5, 14.8], [0, 1.4, 0]],
    [145.26, [7.5, 5.5, 22], [0, 0.6, 0]],
    [147.4, [16, 4, 70], [0, -14, 0]],
    [149.6, [26, -24, 205], [0, -40, 0]],
    [151.5, [24, -26, 200], [0, -40, 0]],
    [153.6, [h[0] + 10, h[1] + 2, h[2] + 46], [h[0], h[1] - 6, h[2]]],
    [155.0, HOOK[0], HOOK[1]],
    [160.2, HOOK[0], HOOK[1]],
    [166.4, [4.2, 1.5, 21.6], [0.4, 0.95, 0]],
    [168.6, [1.4, 1.6, 21.2], [-3.4, 1.2, 0]],
    [182, [1.0, 1.7, 20.6], [-3.5, 1.25, 0]],
  ];
}

const ICONS = {
  bird: `<svg viewBox="0 0 80 60" width="92" height="69"><path d="M6 34 Q24 14 40 30 Q56 10 76 22 Q58 26 50 40 Q40 52 24 46 Q14 42 6 34Z" fill="#3a3530"/><circle cx="62" cy="22" r="2.6" fill="#fffaf0"/></svg>`,
  fish: `<svg viewBox="0 0 90 50" width="98" height="54"><path d="M8 25 Q30 4 58 14 L80 4 L74 25 L80 46 L58 36 Q30 46 8 25Z" fill="#3a3530"/><circle cx="22" cy="22" r="3" fill="#fffaf0"/></svg>`,
  flower: `<svg viewBox="0 0 70 80" width="72" height="82"><path d="M35 40 L35 78" stroke="#3a3530" stroke-width="5"/><path d="M35 62 Q20 54 14 62 Q24 70 35 66Z" fill="#3a3530"/><g fill="#3a3530"><circle cx="35" cy="18" r="11"/><circle cx="52" cy="30" r="11"/><circle cx="45" cy="49" r="11"/><circle cx="25" cy="49" r="11"/><circle cx="18" cy="30" r="11"/></g><circle cx="35" cy="34" r="8" fill="#f2c14e"/></svg>`,
  mush: `<svg viewBox="0 0 80 70" width="84" height="74"><path d="M6 38 Q10 6 40 6 Q70 6 74 38 Z" fill="#3a3530"/><path d="M30 38 L28 66 L52 66 L50 38Z" fill="#3a3530"/><circle cx="28" cy="22" r="5" fill="#fffaf0"/><circle cx="52" cy="26" r="4" fill="#fffaf0"/></svg>`,
  human: `<svg viewBox="0 0 60 90" width="60" height="90"><circle cx="30" cy="12" r="10" fill="#3a3530"/><path d="M14 28 Q30 22 46 28 L44 58 L38 58 L37 88 L31 88 L30 62 L29 88 L23 88 L22 58 L16 58Z" fill="#3a3530"/></svg>`,
};
// 笔记本上随手画的小分叉树（自己画的示意）
function sketch() {
  return `<g fill="none" stroke="#3a3026" stroke-width="3" stroke-linecap="round">
<path d="M150 380 C150 320 152 290 160 250 C168 210 190 190 230 170"/>
<path d="M160 250 C140 220 110 210 80 200"/>
<path d="M230 170 C250 150 290 140 320 140 M230 170 C232 140 240 110 250 80 M290 142 C300 120 320 100 350 92"/>
<path d="M190 205 C210 230 250 240 300 236 M300 236 C330 230 360 240 380 260 M300 236 C320 215 350 205 380 205"/>
<path d="M80 200 C70 180 64 160 60 140"/>
</g><g fill="#3a3026" font-family="Segoe Script, VibeHand" font-size="22"><text x="60" y="130">A</text><text x="356" y="88">B</text><text x="386" y="200">C</text><text x="386" y="272">D</text></g>`;
}
// 书里那种：底下一排字母，往上一代代分叉，有的断掉（灭绝），横向虚线表示一代代（自己画的示意）
function bookFig() {
  let s = `<g stroke="#9a8a70" stroke-width="1.2" stroke-dasharray="3 6">`;
  for (let i = 0; i < 8; i++) s += `<line x1="30" y1="${396 - i * 50}" x2="610" y2="${396 - i * 50}"/>`;
  s += `</g><g fill="none" stroke="#2f2820" stroke-width="2" stroke-linecap="round">`;
  const r = (() => { let a = 11; return () => ((a = (a * 16807) % 2147483647) / 2147483647); })();
  const grow = (x, y, depth, spread) => {
    if (depth === 0 || y < 60) return;
    const n = r() < 0.5 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const nx = x + (n === 1 ? (r() - 0.5) * 10 : (i / (n - 1) - 0.5) * spread);
      s += `<path d="M${x} ${y} L${nx.toFixed(1)} ${y - 50}"/>`;
      if (r() < 0.78) grow(nx, y - 50, depth - 1, spread * 0.82);
    }
  };
  [[100, 396], [330, 396], [520, 396]].forEach(([x, y]) => grow(x, y, 7, 70));
  s += `</g><g font-family="VibeSerif" font-weight="700" font-size="22" fill="#2f2820">`;
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L"].forEach((c, i) => { s += `<text x="${40 + i * 53}" y="440">${c}</text>`; });
  return s + "</g>";
}
