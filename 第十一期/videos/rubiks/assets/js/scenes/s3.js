// S3 数量：从公式里算出来。小块飞出排成两行：8 个角块洗牌（8!）、逐个拧（3⁷，第 8 个被决定）；
// 12 个棱块洗牌（12!）、逐个翻（2¹¹）；÷2 → 拼出 43,252,003,274,489,856,000 → 宇宙年龄那条光 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, el, show, track } from "./util.js";
import { whipIn, whipOut } from "./s1.js";
import { odometer, fmt, flyTo, center } from "./mg.js";

export default function S3({ THREE, Wd, cube }) {
  const T = { t0: K(42), fly: K(42.6), sh8: K(45), tw3: K(55), sh12: K(64), fl2: K(69), div: K(75), back: K(81), num: K(81.5), pull: K(87), seg: K(88), beam: K(89), beamEnd: K(92.5), t1: K(98) };
  const ST3 = 0.3, ST2 = 0.2; // 拧 / 翻：一个接一个的间隔（v3 放慢）
  const corners = cube.cubies.filter((c) => c.userData.kind === 3), edges = cube.cubies.filter((c) => c.userData.kind === 2);
  const idx = new Map(); corners.forEach((c, i) => idx.set(c, i)); edges.forEach((c, i) => idx.set(c, i));
  const PA = [3, 0, 6, 1, 7, 2, 5, 4], PB = [5, 7, 1, 4, 0, 6, 2, 3];
  const QA = [4, 9, 0, 7, 2, 11, 5, 1, 10, 3, 8, 6], QB = [7, 2, 10, 5, 11, 0, 3, 8, 1, 6, 4, 9];
  const slotC = (s) => new THREE.Vector3((s - 3.5) * 1.18 - 0.6, 2.05, 0), slotE = (s) => new THREE.Vector3((s - 5.5) * 0.9 - 0.6, -1.15, 0);
  // 排成一行时，每块把贴纸转向镜头（不然看到的多是黑色侧面）
  const FACE = new Map(cube.cubies.map((c) => [c, new THREE.Quaternion().setFromUnitVectors(c.userData.home.clone().normalize(), new THREE.Vector3(0.42, 0.5, 1).normalize())]));
  // 洗牌：两次换位，中间抬起一点（弧线）
  function shuffled(t, t0, i, A, B, slot) {
    const k1 = easeInOut(ramp(t, t0, 0.62)), k2 = easeInOut(ramp(t, t0 + 0.75, 0.62));
    const a = slot(i), b = slot(A[i]), c = slot(B[i]);
    const p = k2 > 0 ? a.clone().copy(b).lerp(c, k2) : a.clone().lerp(b, k1);
    p.y += 0.7 * (Math.sin(Math.PI * k1) + Math.sin(Math.PI * k2)) * (i % 2 ? 1 : -1);
    return p;
  }
  const keys = [[T.t0, [0, 3.6, 16.4], [0, 3.35, 0]], [T.back, [0.3, 3.4, 15.6], [0, 3.1, 0]], [T.back + 0.9, [0.4, 2.9, 14.0], [0, 2.7, 0]], [T.pull, [0.4, 3.4, 14.4], [0.3, 2.4, 0]], [T.pull + 1.2, [0.6, 4.2, 15], [0.6, 1.4, 0]], [T.t1, [0.9, 4.4, 15.4], [0.6, 1.4, 0]]];
  const P = track(keys.map((k) => [k[0], k[1]])), Q = track(keys.map((k) => [k[0], k[2]]));
  const POS = track([[T.t0, [0, 2.3, 0]], [T.pull, [0, 2.3, 0]], [T.pull + 1.0, [-4.4, 1.6, 0]]]), SCL = track([[T.pull, 1], [T.pull + 1.0, 0.72]]);

  // HUD（v13 MG：公式动起来）
  // ① 8 个位置头顶依次弹出 8、7、…、1，中间连上 ×，右边乘积从 8 滚到 40,320 → 收进顶上算式里的「8!」
  // ② 每拧一个角块，飞出一个「3」进算式，「3」的右上角从 1 数到 7
  // ③ 12 个棱块同样：12…1 → 479,001,600 → 「12!」；每翻一个飞出一个「2」→「2¹¹」
  // ④ ÷2：一道光刀劈过整条算式；⑤ 算式下面，大数字像里程表一样逐位滚出来
  const NOTE = el("", "fxn", "hud");
  const eq = el(`<span class="tk k8">8!</span><span class="tk op o1">×</span><span class="tk k3">3<sup>7</sup></span><span class="tk op o2">×</span><span class="tk k12">12!</span><span class="tk op o3">×</span><span class="tk k2">2<sup>11</sup></span><span class="tk dv o4">÷</span><span class="tk dv k22">2</span>`, "eqrow", "hud");
  const tk = (c) => eq.querySelector("." + c);
  const TK = { k8: tk("k8"), o1: tk("o1"), k3: tk("k3"), o2: tk("o2"), k12: tk("k12"), o3: tk("o3"), k2: tk("k2"), o4: tk("o4"), k22: tk("k22") };
  const sup3 = TK.k3.querySelector("sup"), sup2 = TK.k2.querySelector("sup");
  const LD = el(`只对调两块的魔方，永远拧不出来——得去掉一半`, "fxn", "hud", "left:0;right:0;width:auto;margin:0;top:170px;font-size:36px");
  const blade = el("", "blade", "hud");
  // 排座：数字、乘号、乘积
  const chain = (n, sm) => ({ nums: Array.from({ length: n }, (_, i) => el(String(n - i), "chn" + (sm ? " sm" : ""), "hud")), xs: Array.from({ length: n - 1 }, () => el("×", "chn x", "hud")), prod: el("", "prod", "hud") });
  const C8 = chain(8, false), C12 = chain(12, true);
  const PR8 = [8, 56, 336, 1680, 6720, 20160, 40320, 40320], PR12 = []; { let p = 1; for (let i = 0; i < 12; i++) { p *= 12 - i; PR12.push(p); } }
  const N8 = { t: T.sh8 + 0.5, dt: 0.4, col: T.tw3 - 1.1 }, N12 = { t: T.sh12 + 0.3, dt: 0.16, col: T.fl2 - 0.6 };
  const fl3 = Array.from({ length: 7 }, () => el("3", "flyd", "hud")), fl2 = Array.from({ length: 11 }, () => el("2", "flyd", "hud"));
  const odo = odometer("43,252,003,274,489,856,000", "num", "left:0;right:0;text-align:center;top:160px");
  const kinds = el("种样子", "sub", "hud", "left:0;right:0;text-align:center;top:268px;font-size:48px;color:#EAF6FF");
  const x0 = 640, x1 = 1860, y = 640;
  const beam = el("", "beam", "hud", `left:${x0}px;top:${y}px;width:${x1 - x0}px;transform-origin:0 50%`);
  const seg = el("", "seg", "hud", `left:${x0}px;top:${y - 12}px;width:${Math.max(12, (x1 - x0) / 99)}px`);
  const uni = el(`宇宙年龄<br><span class="mono" style="color:#FFD21A">138 亿年</span>`, "sub", "hud", `left:${x0 - 10}px;top:${y + 50}px;line-height:1.3;color:#EAF6FF`);
  const times = el(`≈ 宇宙年龄的 100 倍`, "lbl", "hud", `right:70px;top:${y + 46}px;font-size:58px;letter-spacing:.06em`);
  const w3 = new THREE.Vector3();
  const proj = (local) => { w3.copy(local); cube.root.localToWorld(w3); return Wd.project(w3); };
  const place = (e, local, dx = 0, dy = 0) => { const s = proj(local); e.style.left = s.x + dx + "px"; e.style.top = s.y + dy + "px"; };
  const at = (e, p, o, sc = 1) => { e.style.left = p.x + "px"; e.style.top = p.y + "px"; show(e, o, `scale(${sc.toFixed(3)})`); };
  // 一排的排座动画：数字依次弹出 → 乘积滚动 → 收进算式
  function runChain(C, PR, N, slot, dy, target, t, on) {
    const goal = center(target);
    const col = ramp(t, N.col, 0.55);
    C.nums.forEach((e, i) => {
      const s = proj(slot(i)), a = { x: s.x, y: s.y + dy }, k = ramp(t, N.t + i * N.dt, 0.25);
      const p = col > 0 ? flyTo(a, goal, col, 60) : a;
      at(e, p, on * ease(k) * (1 - ease(ramp(t, N.col + 0.4, 0.15))), lerp(1.6, 1, easeOutBack(k, 2)) * lerp(1, 0.5, col));
    });
    C.xs.forEach((e, i) => {
      const s1 = proj(slot(i)), s2 = proj(slot(i + 1)), a = { x: (s1.x + s2.x) / 2, y: (s1.y + s2.y) / 2 + dy };
      const p = col > 0 ? flyTo(a, goal, col, 60) : a;
      at(e, p, on * ease(ramp(t, N.t + (i + 1) * N.dt, 0.2)) * (1 - ease(ramp(t, N.col + 0.3, 0.15))));
    });
    // 乘积：跟着每个数字弹出一步步滚上去
    let v = 1; PR.forEach((pv, i) => { const k = ease(ramp(t, N.t + i * N.dt, Math.min(0.3, N.dt))); if (k > 0) v = lerp(i ? PR[i - 1] : 1, pv, k); });
    const s0 = proj(slot(0)), s1 = proj(slot(PR.length - 1)), a = { x: (s0.x + s1.x) / 2 - 40, y: (s0.y + s1.y) / 2 + dy - 62 }; // 乘积放在这一排数字的正上方
    const p = col > 0 ? flyTo(a, goal, col, 60) : a;
    C.prod.textContent = "= " + fmt(v);
    at(C.prod, p, on * ease(ramp(t, N.t, 0.3)) * (1 - ease(ramp(t, N.col + 0.4, 0.15))), lerp(1, 0.4, col));
    return ramp(t, N.col + 0.45, 0.2); // 算式里的这一项出现的进度
  }
  const fly = (arr, t0, step, from, target, t, on) => {
    const goal = center(target); let n = 0;
    arr.forEach((e, i) => {
      const te = t0 + i * step + 0.12, k = ramp(t, te, 0.5), a = proj(from(i));
      if (k >= 1) n++;
      at(e, flyTo(a, goal, k, 120), on * (k > 0 && k < 1 ? 1 : 0), lerp(1.2, 0.7, k));
    });
    return n;
  };
  return {
    t0: T.t0, t1: T.t1, T, env: "space",
    cam(t) {
      let pos = P(t), tgt = Q(t), blur = 0;
      const wi = whipIn(t, T.t0, { d: 0.0001, angle: 0 }); // 进场是擦除，不是甩镜
      const w = whipOut(t, T.t1);
      if (w.off) { const az = Math.atan2(pos[0] - tgt[0], pos[2] - tgt[2]) + w.off, r = Math.hypot(pos[0] - tgt[0], pos[2] - tgt[2]); pos = [tgt[0] + Math.sin(az) * r, pos[1], tgt[2] + Math.cos(az) * r]; blur = w.blur; }
      return { pos, tgt, fov: 32, blur: blur + wi.blur };
    },
    cube(t) {
      const kf = easeInOut(ramp(t, T.fly, 1.0)) * (1 - easeInOut(ramp(t, T.back, 1.1)));
      return {
        pos: POS(t), scale: SCL(t), rot: [0, t > T.pull ? -0.6 + 0.1 * (t - T.pull) : 0, 0],
        post: kf > 0 ? (c) => {
          const kd = c.userData.kind;
          if (kd === 1) { c.scale.setScalar(Math.max(0.001, 1 - kf)); return; }
          const i = idx.get(c), home = c.userData.home;
          const st = kd === 3 ? shuffled(t, T.sh8, i, PA, PB, slotC) : shuffled(t, T.sh12, i, QA, QB, slotE);
          const stag = clamp(kf * 1.15 - (i / 12) * 0.15);
          c.position.lerp(st, easeInOut(stag));
          c.quaternion.slerp(FACE.get(c), easeInOut(stag));
          // 拧 / 翻：一个接一个；最后一个不动，只亮一下（它被前面的决定了）
          const n = kd === 3 ? 8 : 12, t0 = kd === 3 ? T.tw3 : T.fl2, step = kd === 3 ? ST3 : ST2;
          const undo = 1 - easeInOut(ramp(t, T.back, 0.8)); // 飞回去的路上拧回来
          const k = i < n - 1 ? easeOutBack(ramp(t, t0 + i * step, 0.26), 1.4) * undo : 0;
          if (k) c.rotateOnAxis(home.clone().normalize(), (kd === 3 ? (Math.PI * 2) / 3 : Math.PI) * k);
          if (i === n - 1) { const g = ease(ramp(t, t0 + (n - 1) * step, 0.3)) * (1 - ease(ramp(t, t0 + (n - 1) * step + 1.4, 0.4))); c.scale.setScalar(1 + 0.25 * g); }
        } : null,
      };
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      const out = 1 - ease(ramp(t, T.back - 0.2, 0.4)); // 小块飞回去时，排座的数字都收掉
      // 数字跟「位置」走（第 1 个位置、第 2 个位置……），不跟小块走
      const k8 = runChain(C8, PR8, N8, (i) => slotC(i), -96, TK.k8, t, on * out);
      const k12 = runChain(C12, PR12, N12, (i) => slotE(i), -84, TK.k12, t, on * out);
      const n3 = fly(fl3, T.tw3, ST3, (i) => slotC(PB[i]), TK.k3, t, on);
      const n2 = fly(fl2, T.fl2, ST2, (i) => slotE(QB[i]), TK.k2, t, on);
      const pop = (e, k, o = 1) => show(e, on * o * clamp(k * 3), `scale(${lerp(1.5, 1, easeOutBack(k, 2)).toFixed(3)})`);
      pop(TK.k8, k8); pop(TK.o1, ramp(t, T.tw3 + 0.05, 0.25)); pop(TK.k3, n3 > 0 ? ramp(t, T.tw3 + 0.62, 0.25) : 0);
      sup3.textContent = String(Math.max(1, n3)); sup3.style.opacity = n3 > 1 ? 1 : 0;
      pop(TK.o2, ramp(t, T.sh12 + 0.1, 0.25)); pop(TK.k12, k12); pop(TK.o3, ramp(t, T.fl2 + 0.05, 0.25));
      pop(TK.k2, n2 > 0 ? ramp(t, T.fl2 + 0.62, 0.25) : 0); sup2.textContent = String(Math.max(1, n2)); sup2.style.opacity = n2 > 1 ? 1 : 0;
      pop(TK.o4, ramp(t, T.div + 0.25, 0.25)); pop(TK.k22, ramp(t, T.div + 0.35, 0.25));
      // ÷2：光刀从左到右劈过整条算式
      const kb = ramp(t, T.div, 0.45);
      show(blade, on * (kb > 0 && kb < 1 ? 1 : 0), `translateX(${lerp(0, 2500, easeInOut(kb)).toFixed(1)}px) rotate(18deg)`);
      eq.style.filter = `brightness(${(1 + 1.2 * Math.sin(Math.PI * kb)).toFixed(3)})`;
      show(LD, on * ease(ramp(t, T.div + 0.5, 0.3)) * (1 - ease(ramp(t, T.back - 0.3, 0.3))));
      // 「最后一个被决定」的小注
      const m3 = T.tw3 + 7 * ST3, m2 = T.fl2 + 11 * ST2;
      const o3 = ease(ramp(t, m3, 0.25)) * (1 - ease(ramp(t, m3 + 3.2, 0.3))), o2 = ease(ramp(t, m2, 0.25)) * (1 - ease(ramp(t, m2 + 1.9, 0.3)));
      show(NOTE, on * Math.max(o3, o2));
      if (o3 > 0) { NOTE.textContent = "第 8 个：前 7 个拧好，它就被定死了"; place(NOTE, slotC(PB[7]), 0, 70); }
      else if (o2 > 0) { NOTE.textContent = "第 12 个：同样被定死"; place(NOTE, slotE(QB[11]), 0, 70); }
      // 算式一直留在顶上；大数字从算式下面滚出来
      eq.style.visibility = on ? "visible" : "hidden";
      show(odo.e, on * ease(ramp(t, T.num - 0.1, 0.3))); odo.set(t, T.num, 0.06, 1.2, 2);
      show(kinds, on * ease(ramp(t, T.num + 2.2, 0.3)));
      show(seg, on * ease(ramp(t, T.seg, 0.3))); show(uni, on * ease(ramp(t, T.seg + 0.2, 0.3)));
      const kbm = easeInOut(ramp(t, T.beam, T.beamEnd - T.beam));
      show(beam, on * (kbm > 0 ? 1 : 0), `scaleX(${Math.max(0.01, kbm).toFixed(4)})`);
      show(times, on * ease(ramp(t, T.beamEnd, 0.4)), `translateY(${(14 * (1 - easeOut(ramp(t, T.beamEnd, 0.4)))).toFixed(1)}px)`);
    },
  };
}
