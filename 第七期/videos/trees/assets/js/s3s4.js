// S3 钻进地下（34.62–51.64）· S4 找东西：二叉搜索树 → 竹竿 → 红黑树（51.64–85.68）
import { clamp, ramp, ease, easeIn, easeOut, easeOutBack, win, el, show, lerp, labelPool, pulse } from "./lib.js";
import { makeGraph, bstLayout } from "./graph.js";

export const START = 34.62, END = 85.68;
const T3 = { light: 36.76, fix: 38.88, r1: 41.01, r2: 43.14, r3: 43.93, folder: 45.27, family: 47.39, org: 48.45, friends: 49.52, slide: 50.84 };
const T4 = {
  guess: 51.64, g50: 53.78, half: 54.03, all: 60.55, full: 61.49, lr: 62.95, seq: 64.41, pole: 66.54, poleHit: 67.33,
  rb: 68.26, rot: 70.45, ripple: 72.6, settle: 74.25, name: 75.05, split: 77.17, forty: 79.56, phone: 81.43, dive: 83.56,
};
const INK = 0x2b2a2e, RED = 0xd9483b, CREAM = 0xf3e7d3;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const mixHex = (a, b, k) => {
  const ca = [(a >> 16) & 255, (a >> 8) & 255, a & 255], cb = [(b >> 16) & 255, (b >> 8) & 255, b & 255];
  return (Math.round(lerp(ca[0], cb[0], k)) << 16) | (Math.round(lerp(ca[1], cb[1], k)) << 8) | Math.round(lerp(ca[2], cb[2], k));
};

export const CAM = [
  [35.6, [0.3, -1.05, 9.6], [0, -1.55, 1.0]],
  [38.9, [0.0, -1.2, 9.2], [0, -1.55, 1.7]],
  [45.2, [-0.4, -1.3, 9.0], [-0.3, -1.6, 1.7]],
  [49.4, [2.0, -1.2, 9.8], [2.7, -1.55, 1.7]],
  [51.0, [0.2, -1.1, 9.2], [0.0, -1.5, 1.4]],
  [53.6, [-0.3, -1.25, 7.8], [-0.5, -1.55, 1.35]],
  [60.3, [-0.6, -1.55, 7.6], [-0.7, -1.75, 1.35]],
  [62.2, [0.2, -0.75, 13.2], [0, -1.55, 0]],
  [64.2, [0.3, -0.9, 12.6], [0.2, -1.6, 0.4]],
  [65.4, [1.4, -1.3, 7.6], [0.9, -1.75, 1.6]],
  [66.5, [2.0, -3.2, 7.0], [1.2, -3.8, 1.6]],
  [68.3, [3.2, -11.3, 6.4], [2.1, -12.0, 1.6]],
  [71.3, [3.0, -11.6, 6.0], [2.0, -12.1, 1.6]],
  [72.6, [2.8, -10.8, 6.6], [1.9, -11.2, 1.6]],
  [74.5, [0.2, -0.75, 13.2], [0, -1.55, 0]],
  [77.0, [0.0, -0.8, 12.6], [0, -1.6, 0]],
  [83.5, [0.1, -0.9, 12.2], [0, -1.65, 0]],
  [85.68, [-1.4, -2.0, 9.0], [-1.0, -2.6, 0.6]],
];

export function build(W) {
  const G = makeGraph(W.scene, 140, 160);

  // ======================= S3：示意树 =======================
  const A = [
    [0, 0, 0, -1],
    [1, 1, -2.3, 0], [2, 1, 0, 0], [3, 1, 2.3, 0],
    [4, 2, -3.0, 1], [5, 2, -1.6, 1], [6, 2, -0.7, 2], [7, 2, 0.7, 2], [8, 2, 1.6, 3], [9, 2, 3.0, 3],
    [10, 3, -3.45, 4], [11, 3, -2.55, 4],
  ].map(([id, lv, x, par]) => ({ id, lv, par, at: [x, -0.5 - lv * 0.68, 1.7] }));
  // 每个节点从真实根系的一个分叉点"浮"出来
  {
    const R = W.roots, gr = 0.33, scr = 0.3 + 0.7 * gr ** 0.8, lim = R.maxPath * gr;
    const cand = [];
    for (let i = 1; i < R.n; i++) if (R.kids[i].length >= 2 && R.path[i] < lim) cand.push([R.P[i][0] * scr, R.P[i][1] * scr, R.P[i][2] * scr]);
    const used = new Set();
    for (const a of A) {
      let best = 0, bd = 1e9;
      cand.forEach((c, j) => { if (used.has(j)) return; const d = (c[0] - a.at[0] * 0.45) ** 2 + (c[1] - (a.at[1] + 0.2) * 0.5) ** 2 * 4; if (d < bd) { bd = d; best = j; } });
      used.add(best);
      a.from = cand[best] || [0, -0.3, 0];
    }
  }
  const LABELS = {
    folder: ["C 盘", "用户", "程序", "系统", "文档", "下载", "微信", "游戏", "字体", "驱动", "照片", "作业"],
    family: ["爷爷奶奶", "大伯", "爸爸", "姑姑", "堂哥", "堂姐", "我", "妹妹", "表弟", "表妹", "侄子", "侄女"],
    org: ["总经理", "技术部", "市场部", "财务部", "前端组", "后端组", "线上组", "线下组", "会计", "出纳", "小王", "小李"],
  };
  const HIGH = { folder: [0, 1, 4, 10], family: [0, 2, 6], org: [] };
  const FOLDER = `<svg class="ico" viewBox="0 0 24 20" width="30" height="25"><path d="M1 3a2 2 0 0 1 2-2h6l2 2.5h10a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z" fill="#e9b949" stroke="#a8741f" stroke-width="1.4"/></svg>`;
  const aLab = labelPool(A.length, "lab", W.project);
  const rules = el(`<div class="rt">三条规矩</div><div class="rr" data-i="0">① 只有一个根</div><div class="rr" data-i="1">② 每个节点，只有一个上级</div><div class="rr" data-i="2">③ 不会绕回来</div>`, "rules");
  const rr = [...rules.querySelectorAll(".rr")];
  const loop = el(`<svg width="1920" height="1080"><path d="" fill="none" stroke="#e8705a" stroke-width="7" stroke-dasharray="14 10" stroke-linecap="round" pathLength="100"/><path class="mask" d="" fill="none" stroke="#000" stroke-width="0"/><g class="x"><circle r="30" fill="#fff3ee" stroke="#e8705a" stroke-width="4"/><path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#e8705a" stroke-width="6" stroke-linecap="round"/></g></svg>`, "loop");
  const loopPath = loop.querySelector("path"), loopX = loop.querySelector(".x");
  const friends = el(friendsSVG(), "friends");
  const fArc = friends.querySelector(".arc");

  // ======================= S4：二叉搜索树 =======================
  const bst = bstLayout(1, 100, (k, d) => [(k - 50.5) * 0.112, -0.62 - d * 0.38, 1.35]);
  const PATH = [50, 25, 37, 43, 40, 41], PT = [T4.g50, 55.9, 56.97, 58.03, 59.09, 60.15];
  const RES = ["大了", "小了", "小了", "大了", "小了", "对了"];
  const RANGE = [[1, 100], [1, 49], [26, 49], [38, 49], [38, 42], [41, 42], [41, 41]];
  const appear = new Map();
  for (const [k, n] of bst) {
    const pi = PATH.indexOf(k);
    appear.set(k, pi >= 0 ? PT[pi] : T4.all + n.depth * 0.13 + ((k * 37) % 11) * 0.012);
  }
  const bLab = labelPool(12, "lab num", W.project);
  const lvl = Array.from({ length: 7 }, (_, d) => el(`${d + 1}`, "lvl"));
  const lvlT = el("7 层", "lvl-title");
  const lrL = el("← 比 50 小", "chip"), lrR = el("比 50 大 →", "chip");
  const card = el(`<div class="q">?</div><div class="res"></div>`, "guess");
  const cardQ = card.querySelector(".q"), cardR = card.querySelector(".res");
  const bar = el(Array.from({ length: 100 }, () => "<i></i>").join("") + `<b class="lo">1</b><b class="hi">100</b>`, "range");
  const cells = [...bar.querySelectorAll("i")], barLo = bar.querySelector(".lo"), barHi = bar.querySelector(".hi");

  // ======================= S4：竹竿 → 红黑树 =======================
  const chainPos = (k) => [0.4 + 0.05 * (k - 1), -0.62 - 0.3 * (k - 1), 1.6];
  const chainT = (k) => (k <= 10 ? T4.seq + 0.2 + (k - 1) * 0.19 : T4.pole + (k - 10) * 0.0115);
  const rbCol = (k) => ([1, 4, 6].includes(bst.get(k).depth) ? RED : INK);
  // 局部旋转：38 → 39 → 40 一段，39 提上去当上级
  const P38 = chainPos(38), LOCAL = { 39: P38, 38: [P38[0] - 0.45, P38[1] - 0.38, P38[2]], 40: [P38[0] + 0.45, P38[1] - 0.38, P38[2]] };
  const shift40 = [LOCAL[40][0] - chainPos(40)[0], LOCAL[40][1] - chainPos(40)[1], 0];
  const cLab = labelPool(12, "lab num", W.project);
  const layers = el(`<b>1</b> 层`, "layers");
  const layersN = layers.querySelector("b");
  const split = el(splitHTML(), "split");
  const forty = split.querySelector(".forty");
  const phone = el(phoneSVG(), "phone");

  function state(t) {
    const nodes = [], edges = [];
    let glow = 1;

    // ---------- S3 示意树 ----------
    const aOn = t > T3.light - 0.1 && t < T3.slide + 0.8;
    const aOut = ease(ramp(t, T3.slide - 0.2, 0.8)); // 收回根里
    const phase = t < T3.folder ? null : t < T3.family ? "folder" : t < T3.org ? "family" : "org";
    const pos = (a) => lerp3(a.from, a.at, ease(ramp(t, T3.light + a.id * 0.07, 1.7)));
    if (aOn) {
      glow = 1 + 1.4 * pulse(t, T3.r2, 0.55);
      for (const a of A) {
        const born = easeOutBack(ramp(t, T3.light + a.id * 0.11, 0.35));
        const hi = phase && HIGH[phase].includes(a.id);
        const p = lerp3(pos(a), a.from, aOut);
        nodes.push({ p, r: (0.1 + (a.lv === 0) * 0.04 + hi * 0.03) * born * (1 - aOut), lit: true });
        if (a.par >= 0) {
          const b = A[a.par];
          edges.push({ a: lerp3(pos(b), b.from, aOut), b: p, r0: 0.032, r1: 0.026, f: ease(ramp(t, T3.light + a.id * 0.11, 0.4)) * (1 - aOut), lit: true });
        }
      }
      // 标签：文件夹 → 家谱 → 公司
      const swap = (t0) => 1 - pulse(t, t0 - 0.08, 0.22);
      const lo = win(t, T3.folder, T3.friends - 0.05, 0.3, 0.35) * swap(T3.family) * swap(T3.org);
      A.forEach((a, i) => {
        if (!phase) return aLab.set(i, "", null, 0);
        const txt = LABELS[phase][a.id], hi = HIGH[phase].includes(a.id);
        aLab.set(i, phase === "folder" ? FOLDER + txt : txt, pos(a), lo * (1 - aOut), hi ? "hi" : "", -125);
      });
      // 规则①：根上的"根"字
      if (!phase) aLab.set(0, "根", pos(A[0]), win(t, T3.r1, T3.folder - 0.3, 0.3, 0.3), "hi", -125);
    } else A.forEach((_, i) => aLab.set(i, "", null, 0));
    show(rules, win(t, T3.r1, T3.folder - 0.2, 0.35, 0.35));
    rr.forEach((r, i) => { const k = ease(ramp(t, [T3.r1, T3.r2, T3.r3][i], 0.35)); r.style.opacity = k; r.style.transform = `translateX(${(1 - k) * -20}px)`; });
    // 规则③：试着连一条"绕回来"的线，打叉
    const lO = win(t, T3.r3, T3.folder - 0.25, 0.2, 0.3);
    show(loop, lO);
    if (lO > 0) {
      // 从右边的叶子拉一条线，绕回最顶上的根：形成一个环
      const p1 = W.project(pos(A[9])), p2 = W.project(pos(A[0])), k = ease(ramp(t, T3.r3, 0.5));
      const cx = Math.max(p1.x, p2.x) + 260, cy = (p1.y + p2.y) / 2 - 40;
      loopPath.setAttribute("d", `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x + 20} ${p2.y}`);
      loopPath.style.strokeDasharray = `${k * 100} 200`;
      const mx = 0.25 * p1.x + 0.5 * cx + 0.25 * (p2.x + 20), my = 0.25 * p1.y + 0.5 * cy + 0.25 * p2.y;
      const xs = easeOutBack(ramp(t, T3.r3 + 0.5, 0.3));
      loopX.setAttribute("transform", `translate(${mx} ${my}) scale(${xs})`);
    }
    // 朋友圈：三角形，绕一圈
    const fO = win(t, T3.friends, T3.slide + 0.2, 0.3, 0.45);
    show(friends, fO, `translateY(${(1 - easeOut(ramp(t, T3.friends, 0.5))) * 20}px)`);
    fArc.style.strokeDashoffset = 300 * (1 - ease(ramp(t, T3.friends + 0.5, 0.9)));

    // ---------- S4 二叉搜索树 ----------
    const bOut = ease(ramp(t, T4.seq - 0.4, 0.8));
    const bOn = t > T4.g50 - 0.1 && t < T4.seq + 0.5;
    let bi = 0;
    if (bOn) {
      for (const [k, n] of bst) {
        const t0 = appear.get(k);
        const born = easeOutBack(ramp(t, t0, 0.35));
        if (born <= 0) continue;
        const onPath = PATH.includes(k) && t >= t0;
        nodes.push({ p: n.p, r: (0.115 * 0.8 ** n.depth + 0.03) * born * (1 - bOut), lit: onPath, color: CREAM });
        if (n.parent != null) {
          const pp = bst.get(n.parent).p, onE = onPath && PATH.includes(n.parent);
          edges.push({ a: pp, b: n.p, r0: 0.03 * 0.82 ** (n.depth - 1), r1: 0.03 * 0.82 ** n.depth, f: ease(ramp(t, t0 - 0.15, 0.4)) * (1 - bOut), lit: onE, color: CREAM });
        }
      }
      // 标签：路径上的数 + 前三层
      const lo = 1 - bOut;
      for (const [k, n] of bst) {
        if (bi >= 12) break;
        const onPath = PATH.includes(k);
        if (!onPath && !(n.depth <= 2 && t > T4.full)) continue;
        const o = ease(ramp(t, appear.get(k) + 0.1, 0.3)) * lo;
        bLab.set(bi++, `${k}`, n.p, o, onPath ? "hi" : "", n.depth <= 1 ? -135 : -125);
      }
      // 根 50 的入口：主根到 50 的一段
      edges.push({ a: [0, -0.1, 0.4], b: bst.get(50).p, r0: 0.05, r1: 0.035, f: ease(ramp(t, T4.g50 - 0.4, 0.4)) * (1 - bOut), lit: true });
    }
    bLab.hideFrom(bi);
    // 层号 1–7
    const lvO = win(t, T4.full, T4.seq - 0.3, 0.35, 0.3);
    lvl.forEach((e, d) => { const q = W.project([5.42, -0.62 - d * 0.38, 1.35]); show(e, lvO * ease(ramp(t, T4.full + d * 0.06, 0.3)), `translate(${q.x}px, ${q.y}px) translate(-50%, -50%)`); });
    { const q = W.project([4.85, -3.22, 1.35]); show(lvlT, lvO * ease(ramp(t, T4.full + 0.5, 0.3)), `translate(${q.x}px, ${q.y}px) translate(-50%, -50%) scale(${1 + 0.3 * (1 - easeOut(ramp(t, T4.full + 0.5, 0.4)))})`); }
    // 左小右大
    const lrO = win(t, T4.lr, T4.seq - 0.3, 0.3, 0.3);
    if (lrO > 0) {
      const p25 = W.project(bst.get(25).p), p75 = W.project(bst.get(75).p);
      show(lrL, lrO, `translate(${p25.x - 40}px, ${p25.y + 26}px) translate(-50%, 0)`);
      show(lrR, lrO, `translate(${p75.x + 40}px, ${p75.y + 26}px) translate(-50%, 0)`);
    } else { show(lrL, 0); show(lrR, 0); }
    // 猜数卡 + 区间条
    let gi = -1;
    for (let i = 0; i < PT.length; i++) if (t >= PT[i]) gi = i;
    const gO = win(t, T4.guess, T4.full - 0.3, 0.35, 0.4);
    show(card, gO);
    show(bar, win(t, T4.guess + 0.3, T4.full - 0.3, 0.35, 0.4));
    if (gO > 0) {
      cardQ.textContent = gi < 0 ? "?" : PATH[gi];
      cardR.textContent = gi < 0 ? "" : RES[gi];
      cardR.className = `res ${gi === 5 ? "ok" : ""}`;
      const pop = gi < 0 ? 0 : 1 - easeOut(ramp(t, PT[gi], 0.3));
      cardQ.style.transform = `scale(${1 + 0.18 * pop})`;
      // 区间：猜完 50 之后，在重音 54.03 才排除一半
      let ri = gi < 0 ? 0 : gi + 1;
      if (gi === 0 && t < T4.half) ri = 0;
      const [lo, hi] = RANGE[ri];
      cells.forEach((c, j) => { const k = j + 1; c.className = k >= lo && k <= hi ? (k === 41 && ri === 6 ? "on ok" : "on") : ""; });
      // 区间很窄时两个数会叠在一起：合成一个
      const narrow = hi - lo < 8;
      barLo.textContent = narrow ? (lo === hi ? `${lo}` : `${lo}–${hi}`) : lo; barHi.textContent = narrow ? "" : hi;
      barLo.style.left = `${((lo - 1) / 100) * 100}%`; barHi.style.left = `${(hi / 100) * 100}%`;
    }

    // ---------- S4 竹竿 → 红黑树 ----------
    let ci = 0;
    const cOn = t > T4.seq && t < END + 1;
    if (cOn) {
      const rec = ease(ramp(t, T4.rb, 0.5)); // 染色
      const gone = 1 - ease(ramp(t, 84.3, 1.0)); // S5 前收回
      for (let k = 1; k <= 100; k++) {
        const t0 = chainT(k);
        if (t < t0) continue;
        // 位置：竹竿 → （局部旋转）→ 平衡
        let p = chainPos(k);
        const drop = 1 - easeOut(ramp(t, t0, k <= 10 ? 0.25 : 0.12));
        p = [p[0], p[1] + drop * 0.7, p[2]];
        const rot = ease(ramp(t, T4.rot, 0.6));
        if (LOCAL[k]) p = lerp3(p, LOCAL[k], rot), p[2] += Math.sin(Math.PI * rot) * 0.5;
        else if (k > 40) p = [p[0] + shift40[0] * rot, p[1] + shift40[1] * rot, p[2]];
        const s0 = T4.ripple + 1.1 * (1 - k / 100), rp = ease(ramp(t, s0, 0.5));
        const fin = bst.get(k).p;
        const pk = lerp3(p, fin, rp);
        pk[2] += Math.sin(Math.PI * rp) * 0.8;
        const breathe = t > T4.name ? 1 + 0.06 * Math.sin((t - T4.name) * 3 + k) : 1;
        const col = mixHex(CREAM, rbCol(k), clamp(rec * 1.4 - (k % 7) * 0.05));
        const rr0 = lerp(0.1, 0.115 * 0.8 ** bst.get(k).depth + 0.03, rp);
        nodes.push({ p: pk, r: rr0 * breathe * (1 - drop * 0.3) * gone, color: col, _k: k });
        if (k <= 12 && t < T4.pole + 0.4) cLab.set(ci++, `${k}`, pk, ease(ramp(t, t0, 0.2)) * (1 - ease(ramp(t, T4.pole, 0.4))), "", -130);
      }
      // 边：当前的上级 → 自己
      const posOf = new Map(nodes.filter((n) => n._k).map((n) => [n._k, n.p]));
      for (let k = 1; k <= 100; k++) {
        if (!posOf.has(k)) continue;
        const s0 = T4.ripple + 1.1 * (1 - k / 100), rp = ease(ramp(t, s0, 0.5)), rot = t >= T4.rot + 0.3;
        let par = rp < 0.5 ? (rot && k === 39 ? 37 : rot && k === 38 ? 39 : rot && k === 40 ? 39 : k - 1) : bst.get(k).parent;
        const thin = Math.abs(1 - 2 * rp);
        const a = par && posOf.has(par) ? posOf.get(par) : par === 0 || par == null ? (k === 1 || bst.get(k).parent == null ? [0, -0.1, 0.6] : null) : null;
        if (!a) continue;
        // 换上级的途中，两点可能隔得很远，长线收细直到消失，免得画面里横七竖八
        const b = posOf.get(k), len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), vis = clamp((2.2 - len) / 1.0);
        edges.push({ a, b, r0: 0.03 * (0.4 + 0.6 * thin) * vis * gone, r1: 0.024 * (0.4 + 0.6 * thin) * vis * gone, color: mixHex(CREAM, 0x6b5a4a, rec) });
      }
    }
    cLab.hideFrom(ci);
    // 层数计数
    let nC = 0;
    for (let k = 1; k <= 100; k++) if (t >= chainT(k)) nC = k;
    show(layers, win(t, T4.seq + 0.4, T4.rb + 0.2, 0.3, 0.4), `scale(${1 + 0.25 * pulse(t, T4.poleHit, 0.4)})`);
    layersN.textContent = nC;
    // 100 万 vs 40
    show(split, win(t, T4.split, T4.phone - 0.15, 0.45, 0.4));
    forty.style.transform = `scale(${t < T4.forty ? 0 : 1 + 0.6 * (1 - easeOut(ramp(t, T4.forty, 0.35)))})`;
    forty.style.opacity = ease(ramp(t, T4.forty, 0.12));
    show(phone, win(t, T4.phone, T4.dive - 0.1, 0.4, 0.4), `translateY(${(1 - easeOut(ramp(t, T4.phone, 0.6))) * 30}px)`);

    G.draw(nodes, edges, glow);

    // 主根继续长，暗色，不点亮
    const abyss = ease(ramp(t, 65.55, 0.6)) * (1 - ease(ramp(t, 73.75, 0.55))); // 镜头回到土块里之后才退出深渊
    return { grow: 0, leaf: 0, rootGrow: lerp(0.3, 0.62, ease(ramp(t, START, END - START))), lit: 0, abyss };
  }
  return { state };
}

function friendsSVG() {
  const P = [[150, 40], [40, 230], [260, 230]], N = ["A", "B", "C"];
  let s = `<svg width="300" height="300" viewBox="0 0 300 300">`;
  s += `<path d="M150 40 L40 230 L260 230 Z" fill="none" stroke="#c9b48e" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<path class="arc" d="M150 40 L40 230 L260 230 Z" fill="none" stroke="#e8705a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" pathLength="300" stroke-dasharray="300" stroke-dashoffset="300"/>`;
  P.forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="34" fill="#fffaf0" stroke="#8a5a3b" stroke-width="4"/><text x="${x}" y="${y + 13}" text-anchor="middle" font-family="VibeSans" font-weight="800" font-size="36" fill="#23262b">${N[i]}</text>`; });
  return s + `</svg><div class="ftag">朋友圈</div>`;
}
function splitHTML() {
  let dots = "";
  for (let i = 0; i < 14; i++) dots += `<i style="top:${i * 52}px;left:${i * 6}px"></i>`;
  return `<div class="half l"><div class="pole">${dots}</div><div class="cap1">竹竿</div><div class="big">100 万<small>层</small></div></div>
<div class="half r"><svg class="tri" viewBox="0 0 300 200" width="300" height="200">${triDots()}</svg><div class="cap1">红黑树</div><div class="big">约 <span class="forty">40</span><small>层</small></div></div>`;
}
function triDots() {
  let s = "";
  for (let d = 0; d < 5; d++) { const n = 2 ** d; for (let i = 0; i < n; i++) { const x = 150 + ((i + 0.5) / n - 0.5) * (40 + d * 60); const y = 20 + d * 42; s += `<circle cx="${x}" cy="${y}" r="${10 - d}" fill="${[1, 4].includes(d) ? "#d9483b" : "#2b2a2e"}"/>`; } }
  return s;
}
function phoneSVG() {
  const tree = (cx, cy, s) => { let g = ""; for (let d = 0; d < 4; d++) { const n = 2 ** d; for (let i = 0; i < n; i++) { const x = cx + ((i + 0.5) / n - 0.5) * (30 + d * 34) * s, y = cy + d * 30 * s; if (d) { const px = cx + (((i >> 1) + 0.5) / (n / 2) - 0.5) * (30 + (d - 1) * 34) * s; g += `<line x1="${px}" y1="${y - 30 * s}" x2="${x}" y2="${y}" stroke="#f2c14e" stroke-width="${3 * s}"/>`; } g += `<circle cx="${x}" cy="${y}" r="${(8 - d) * s}" fill="${d % 2 ? "#d9483b" : "#2b2a2e"}" stroke="#f2c14e" stroke-width="${1.5 * s}"/>`; } } return g; };
  return `<svg width="360" height="640" viewBox="0 0 360 640"><rect x="10" y="10" width="340" height="620" rx="48" fill="rgba(255,250,240,0.9)" stroke="#23262b" stroke-width="10"/><rect x="140" y="28" width="80" height="14" rx="7" fill="#23262b"/>${tree(180, 120, 1)}${tree(110, 340, 0.75)}${tree(250, 380, 0.75)}<text x="180" y="580" text-anchor="middle" font-family="VibeSans" font-weight="800" font-size="30" fill="#23262b">安卓 · 系统内核</text></svg>`;
}
