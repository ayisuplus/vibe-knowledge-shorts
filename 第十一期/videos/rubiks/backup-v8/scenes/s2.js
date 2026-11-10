// S2 出身：甩镜进 → 魔中魔（15 步，四分之一拍一步）+ 全息「1974」→ 快速倒回复原 → 镜头贴上去、顶层一转，黑色机身扫过全屏（层转擦除）
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, el, show, track, hash } from "./util.js";
import { schedule, invert } from "../cube.js";
import { whipIn } from "./s1.js";

export const CIC = "F L F U' R U F2 L2 U' L' B D' B' L2 U";
export default function S2({ THREE, Wd }) {
  const T = { t0: K(28), cic: K(29), holo: K(29.4), rewind: K(40.2), close: K(40.7), turn: K(41), wipe: K(41.55), t1: K(42) };
  const ib = K(1) - K(0);
  const moves = [...schedule(CIC, T.cic, ib / 2 - 0.06, 0.03), ...schedule(invert(CIC), T.rewind, 0.03, 0.006)];
  const ROT = Math.atan2(3.6, 10.4) - Math.PI / 4;
  const keys = [[T.t0, [3.4, 3.4, 10.0], [-1.9, 2.4, 0]], [T.close - 0.2, [2.4, 3.2, 9.4], [-1.6, 2.4, 0]], [T.wipe, [0.9, 3.75, 2.5], [0.3, 3.3, 0]], [T.t1, [0.7, 3.7, 2.2], [0.3, 3.3, 0]]];
  const P = track(keys.map((k) => [k[0], k[1]])), Q = track(keys.map((k) => [k[0], k[2]]));
  const holo = el("1974", "holo", "hud", "left:90px;top:300px");
  const holo2 = el("匈牙利 · 布达佩斯", "holo2", "hud", "left:110px;top:640px");
  const wipe = el(`<i></i>`, "wipe", "hud");
  // 70 年代胶片：颗粒（每帧换位置，按 t 取，可跳帧）+ 暖色暗角
  const cv = document.createElement("canvas"); cv.width = cv.height = 256; const g = cv.getContext("2d"), id = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) { const v = 128 + (hash(i) - 0.5) * 150; id.data.set([v, v, v, 255], i * 4); }
  g.putImageData(id, 0, 0);
  const grain = el("", "grain", "hud", `background-image:url(${cv.toDataURL()})`), vig = el("", "vig70", "hud");
  return {
    t0: T.t0, t1: T.t1, T, moves, env: "y1974",
    cam(t) {
      let pos = P(t), tgt = Q(t);
      const w = whipIn(t, T.t0);
      const az = Math.atan2(pos[0] - tgt[0], pos[2] - tgt[2]) + w.off, r = Math.hypot(pos[0] - tgt[0], pos[2] - tgt[2]);
      pos = [tgt[0] + Math.sin(az) * r, pos[1], tgt[2] + Math.cos(az) * r];
      return { pos, tgt, fov: 32, blur: w.blur };
    },
    cube(t) {
      const tw = (Math.PI / 2) * easeInOut(ramp(t, T.turn, 0.6));
      return {
        pos: [0, 2.3, 0], rot: [0, ROT + 0.02 * (t - T.t0), 0],
        post: tw > 0 ? (cb) => { if (Math.round(cb.position.y) >= 1) { cb.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), tw); cb.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), tw); } } : null,
      };
    },
    hud(t, active) {
      const og = active ? 1 - ease(ramp(t, T.wipe, 0.3)) : 0, f = Math.floor(t * 24);
      show(grain, 0.16 * og); grain.style.backgroundPosition = `${Math.floor(hash(f) * 256)}px ${Math.floor(hash(f + 999) * 256)}px`;
      show(vig, og);
      const oh = ease(ramp(t, T.holo, 0.8)) * (1 - ease(ramp(t, T.close - 0.3, 0.4)));
      show(holo, oh, `translateY(${(20 * (1 - easeOut(ramp(t, T.holo, 0.8)))).toFixed(1)}px)`);
      show(holo2, ease(ramp(t, T.holo + 0.5, 0.6)) * (1 - ease(ramp(t, T.close - 0.3, 0.4))));
      // 擦除：黑色机身从左扫到右（前半盖住，后半揭开下一段）
      const a = easeIn(ramp(t, T.wipe, T.t1 - T.wipe)), b = easeOut(ramp(t, T.t1, 0.42));
      const x = t < T.t1 ? lerp(-2300, 0, a) : lerp(0, 2300, b);
      show(wipe, t >= T.wipe && t < T.t1 + 0.42 ? 1 : 0, `translateX(${x.toFixed(1)}px) skewX(-14deg)`);
    },
  };
}
