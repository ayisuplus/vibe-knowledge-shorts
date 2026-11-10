// S3 数量：从公式里算出来。小块飞出排成两行：8 个角块洗牌（8!）、逐个拧（3⁷，第 8 个被决定）；
// 12 个棱块洗牌（12!）、逐个翻（2¹¹）；÷2 → 拼出 43,252,003,274,489,856,000 → 宇宙年龄那条光 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, el, show, track } from "./util.js";
import { whipIn, whipOut } from "./s1.js";

export default function S3({ THREE, Wd, cube }) {
  const T = { t0: K(42), fly: K(42.6), sh8: K(45), tw3: K(49.5), sh12: K(54.5), fl2: K(59), div: K(64.5), back: K(66.5), num: K(67), pull: K(71.5), seg: K(72.5), beam: K(73.5), beamEnd: K(76.5), t1: K(82) };
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
  const keys = [[T.t0, [0, 2.9, 14.6], [0, 2.7, 0]], [T.back, [0.4, 2.9, 14.0], [0, 2.7, 0]], [T.pull, [0.4, 3.4, 14.4], [0.3, 2.4, 0]], [T.pull + 1.2, [0.6, 4.2, 15], [0.6, 1.4, 0]], [T.t1, [0.9, 4.4, 15.4], [0.6, 1.4, 0]]];
  const P = track(keys.map((k) => [k[0], k[1]])), Q = track(keys.map((k) => [k[0], k[2]]));
  const POS = track([[T.t0, [0, 2.3, 0]], [T.pull, [0, 2.3, 0]], [T.pull + 1.0, [-4.4, 1.6, 0]]]), SCL = track([[T.pull, 1], [T.pull + 1.0, 0.72]]);

  // HUD
  const lab = (html) => el(html, "fx", "hud");
  const L8 = lab(`<b>8!</b><small>= 40,320</small>`), L83 = lab(`<b>8! × 3⁷</b><small>3⁷ = 2,187</small>`);
  const L12 = lab(`<b>12!</b><small>= 479,001,600</small>`), L122 = lab(`<b>12! × 2¹¹</b><small>2¹¹ = 2,048</small>`);
  const LD = el(`<b>÷ 2</b>`, "fx fxd", "hud", "left:0;right:0;text-align:center;top:560px");
  const NOTE = el("", "fxn", "hud");
  const formula = el(`8! × 3⁷ × 12! × 2¹¹ ÷ 2`, "fxf", "hud", "left:0;right:0;text-align:center;top:70px");
  const GROUPS = "43,252,003,274,489,856,000".split(",");
  const num = el(GROUPS.map((g, i) => `<span>${g}${i < GROUPS.length - 1 ? "," : ""}</span>`).join(""), "num", "hud", "left:0;right:0;text-align:center;top:150px");
  const gs = [...num.querySelectorAll("span")];
  const kinds = el("种样子", "sub", "hud", "left:0;right:0;text-align:center;top:266px;font-size:48px;color:#EAF6FF");
  const x0 = 640, x1 = 1860, y = 640;
  const beam = el("", "beam", "hud", `left:${x0}px;top:${y}px;width:${x1 - x0}px;transform-origin:0 50%`);
  const seg = el("", "seg", "hud", `left:${x0}px;top:${y - 12}px;width:${Math.max(12, (x1 - x0) / 99)}px`);
  const uni = el(`宇宙年龄<br><span class="mono" style="color:#FFD21A">138 亿年</span>`, "sub", "hud", `left:${x0 - 10}px;top:${y + 50}px;line-height:1.3;color:#EAF6FF`);
  const times = el(`≈ 宇宙年龄的 100 倍`, "lbl", "hud", `right:70px;top:${y + 46}px;font-size:58px;letter-spacing:.06em`);
  const w3 = new THREE.Vector3();
  const place = (e, local, dx = 0, dy = 0) => { w3.copy(local); cube.root.localToWorld(w3); const s = Wd.project(w3); e.style.left = s.x + dx + "px"; e.style.top = s.y + dy + "px"; };

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
      place(L8, new THREE.Vector3(4.2, 2.05, 0), 0, -40); place(L83, new THREE.Vector3(4.2, 2.05, 0), 0, -40);
      place(L12, new THREE.Vector3(4.6, -1.15, 0), -60, -40); place(L122, new THREE.Vector3(4.6, -1.15, 0), -60, -40);
      const out = 1 - ease(ramp(t, T.back, 0.4));
      show(L8, on * ease(ramp(t, T.sh8, 0.3)) * (1 - ease(ramp(t, T.tw3 + 0.1, 0.2))) * out);
      show(L83, on * ease(ramp(t, T.tw3 + 0.2, 0.3)) * out);
      show(L12, on * ease(ramp(t, T.sh12, 0.3)) * (1 - ease(ramp(t, T.fl2 + 0.1, 0.2))) * out);
      show(L122, on * ease(ramp(t, T.fl2 + 0.2, 0.3)) * out);
      const kd = ramp(t, T.div, 0.28);
      show(LD, on * clamp(kd * 3) * out, `scale(${lerp(1.6, 1, easeOut(kd)).toFixed(3)})`);
      // 「最后一个被决定」的小注
      const n3 = T.tw3 + 7 * ST3, n2 = T.fl2 + 11 * ST2;
      const o3 = ease(ramp(t, n3, 0.25)) * (1 - ease(ramp(t, n3 + 1.4, 0.3))), o2 = ease(ramp(t, n2, 0.25)) * (1 - ease(ramp(t, n2 + 1.4, 0.3)));
      show(NOTE, on * Math.max(o3, o2));
      if (o3 > 0) { NOTE.textContent = "第 8 个角块：由前 7 个决定"; place(NOTE, slotC(PB.indexOf(7) >= 0 ? PB[7] : 7), 0, 70); }
      else if (o2 > 0) { NOTE.textContent = "第 12 个棱块：也被决定了"; place(NOTE, slotE(QB[11]), 0, 70); }
      // 算式 + 大数字
      const of = on * ease(ramp(t, T.back, 0.4));
      show(formula, of, `translateY(${(16 * (1 - easeOut(ramp(t, T.back, 0.4)))).toFixed(1)}px)`);
      show(num, on * ease(ramp(t, T.num - 0.1, 0.3)));
      gs.forEach((g, i) => (g.style.opacity = ease(ramp(t, T.num + i * 0.2, 0.18)).toFixed(3)));
      show(kinds, on * ease(ramp(t, T.num + 1.5, 0.3)));
      show(seg, on * ease(ramp(t, T.seg, 0.3))); show(uni, on * ease(ramp(t, T.seg + 0.2, 0.3)));
      const kb = easeInOut(ramp(t, T.beam, T.beamEnd - T.beam));
      show(beam, on * (kb > 0 ? 1 : 0), `scaleX(${Math.max(0.01, kb).toFixed(4)})`);
      show(times, on * ease(ramp(t, T.beamEnd, 0.4)), `translateY(${(14 * (1 - easeOut(ramp(t, T.beamEnd, 0.4)))).toFixed(1)}px)`);
    },
  };
}
