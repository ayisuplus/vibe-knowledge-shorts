// S1 结构：从绿色里拉出来 → 顶层抬起、转开，镜头从缝里钻进去看见十字轴 → 小块擦着镜头炸开 → 爆炸图标签
// → 只剩中心块 + x/y/z 三根轴（中心块就是坐标系）→ 合拢 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, clamp, el, show, track, orbit, whip } from "./util.js";

export const WHIP = { d: 0.62, angle: 1.7 }; // 段与段之间的甩镜：前一段放前半、后一段放后半
export const whipOut = (t, tEnd, w = WHIP) => whip(t, tEnd - w.d / 2, w.d, w.angle);
export const whipIn = (t, tStart, w = WHIP) => { const r = whip(t, tStart - w.d / 2, w.d, w.angle); return { off: r.off - w.angle, blur: r.blur }; };

export default function S1({ THREE, Wd, cube, Wd: { scene } }) {
  const T = { t0: K(5), back: K(7), gap: K(8.3), inside: K(9), boom: K(9.05), wide: K(10.6), labels: K(12), centers: K(20), collapse: K(25), t1: K(28) };
  const C = [0, 2.3, 0];
  const keys = [
    [T.t0, [0, 2.3, 2.35], C], [T.back, orbit(C, 0.55, 11, 2.6), C], [T.gap, [2.05, 3.3, 2.05], [0, 3.15, 0]], [T.inside, [0.42, 3.05, 0.42], [0, 2.3, 0]],
    [T.wide, [9.0, 6.2, 12.6], [0.3, 2.1, 0]], [T.centers, [9.6, 6.6, 13.4], [0.3, 2.1, 0]], [T.collapse, [-7.6, 5.4, 12.2], [0, 2.2, 0]], [T.t1, [-6.0, 4.4, 10.8], [0, 2.3, 0]],
  ];
  const P = track(keys.map((k) => [k[0], k[1]])), Q = track(keys.map((k) => [k[0], k[2]]));

  // 三根坐标轴（中心块就是坐标系）
  const axes = new THREE.Group();
  const mk = (rgb, dir) => {
    const m = new THREE.MeshBasicMaterial({ toneMapped: false }); m.color.setRGB(...rgb);
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 7.2, 12), m);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 16), m); cone.position.y = 3.8;
    const g = new THREE.Group(); g.add(cyl, cone);
    if (dir === "x") g.rotation.z = -Math.PI / 2; if (dir === "z") g.rotation.x = Math.PI / 2;
    axes.add(g);
  };
  mk([2.2, 0.5, 0.5], "x"); mk([2.4, 2.4, 2.4], "y"); mk([0.5, 2.2, 0.9], "z");
  axes.position.set(...C); axes.visible = false; scene.add(axes);
  const axL = ["x", "y", "z"].map((n) => el(n, "axl", "hud"));
  const AXTIP = [[4.2, 0, 0], [0, 4.2, 0], [0, 0, 4.2]];

  const tags = [["角块", "×8", 3, 150, 300], ["棱块", "×12", 2, 1480, 520], ["中心块", "×6", 1, 1320, 150]].map(([n, k, kind, x, y]) => ({
    tag: el(`${n}<em>${k}</em>`, "tag", "hud", `left:${x}px;top:${y}px`), lead: el("", "lead", "hud"), dot: el("", "dot", "hud"), kind, x, y,
  }));
  const axisTag = { tag: el("十字轴", "tag", "hud"), lead: el("", "lead", "hud") };
  const wp = new THREE.Vector3();
  function placeTag(o, target, anchorRight) {
    const s = Wd.project(target), r = o.tag.getBoundingClientRect();
    const ax = anchorRight ? r.right : r.left, ay = r.top + r.height / 2, dx = s.x - ax, dy = s.y - ay;
    o.lead.style.left = ax + "px"; o.lead.style.top = ay + "px"; o.lead.style.width = Math.hypot(dx, dy) + "px";
    o.lead.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    if (o.dot) { o.dot.style.left = s.x + "px"; o.dot.style.top = s.y + "px"; }
  }

  const ex = (t) => lerp(0, 1.15, easeOut(ramp(t, T.boom, 1.1))) * (1 - easeInOut(ramp(t, T.collapse, 0.85)));
  const kc = (t) => ease(ramp(t, T.centers, 0.5)) * (1 - ease(ramp(t, T.collapse - 0.25, 0.45)));
  return {
    t0: T.t0, t1: T.t1, T, env: "blueprint",
    cam(t) {
      let pos = P(t), tgt = Q(t), blur = 0;
      const w = whipOut(t, T.t1);
      if (w.off) { const az = Math.atan2(pos[0] - tgt[0], pos[2] - tgt[2]) + w.off, r = Math.hypot(pos[0] - tgt[0], pos[2] - tgt[2]); pos = [tgt[0] + Math.sin(az) * r, pos[1], tgt[2] + Math.cos(az) * r]; blur = w.blur; }
      return { pos, tgt, fov: 32, blur };
    },
    cube(t) {
      const lift = 0.95 * easeInOut(ramp(t, T.back - 0.3, 1.0)) * (1 - ease(ramp(t, T.boom, 0.3)));
      const tw = (Math.PI / 4) * easeInOut(ramp(t, T.back - 0.3, 1.2)) * (1 - ease(ramp(t, T.boom, 0.3)));
      const e = ex(t), c = kc(t);
      return {
        pos: C, rot: [0, 0.22 * (t - T.t0) * (t > T.wide ? 1 : 0.4), 0], explode: e, spread: 0.95,
        post: (cb) => {
          const h = cb.userData.home;
          if (lift > 0 && Math.round(cb.position.y) >= 1 && e < 0.01) { cb.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), tw); cb.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), tw); cb.position.y += lift; }
          if (c > 0 && cb.userData.kind !== 1) cb.scale.setScalar(Math.max(0.001, 1 - c)); else cb.scale.setScalar(1);
          if (c > 0 && cb.userData.kind === 1) cb.rotateOnAxis(h.clone().normalize(), Math.PI * 2 * ease(ramp(t, T.centers + 0.5, 1.4)));
        },
      };
    },
    world(t, active) {
      const o = active ? ease(ramp(t, T.centers + 0.3, 0.5)) * (1 - ease(ramp(t, T.collapse - 0.3, 0.4))) : 0;
      axes.visible = o > 0.01; axes.scale.setScalar(Math.max(0.01, o));
    },
    hud(t, active) {
      cube.root.updateMatrixWorld(true);
      tags.forEach((o, j) => {
        const a = T.labels + j * 1.6, ov = active ? ease(ramp(t, a, 0.35)) * (1 - ease(ramp(t, T.centers - 0.3, 0.3))) : 0;
        for (const e of [o.tag, o.lead, o.dot]) show(e, ov);
        if (ov > 0) {
          let best = null, bd = 1e9;
          for (const cb of cube.cubies) if (cb.userData.kind === o.kind) { cb.getWorldPosition(wp); const s = Wd.project(wp); const d = Math.hypot(s.x - o.x, s.y - o.y); if (d < bd) { bd = d; best = wp.clone(); } }
          placeTag(o, best, o.x < 960);
        }
      });
      const oa = active ? ease(ramp(t, T.labels + 5.0, 0.35)) * (1 - ease(ramp(t, T.centers - 0.3, 0.3))) : 0;
      show(axisTag.tag, oa); show(axisTag.lead, oa);
      if (oa > 0) { const c = Wd.project(new THREE.Vector3(...C)); axisTag.tag.style.left = c.x + 150 + "px"; axisTag.tag.style.top = c.y + 250 + "px"; placeTag(axisTag, new THREE.Vector3(...C), false); }
      const ox = active ? ease(ramp(t, T.centers + 0.6, 0.4)) * (1 - ease(ramp(t, T.collapse - 0.3, 0.3))) : 0;
      axL.forEach((e, i) => { show(e, ox); if (ox > 0) { const s = Wd.project(new THREE.Vector3(C[0] + AXTIP[i][0], C[1] + AXTIP[i][1], C[2] + AXTIP[i][2])); e.style.left = s.x + "px"; e.style.top = s.y + "px"; } });
    },
  };
}
