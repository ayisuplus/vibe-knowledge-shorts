// S6 交换子：「做 A，做 B，撤 A，撤 B」→ 拧一遍 A 置换（R' F R' B2 R F' R' B2 R2），其他小块全部变暗，
// 只有 3 个角块亮着换了位置 → 还原 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, clamp, pulse, el, show, orbit, whip } from "./util.js";
import { schedule, invert } from "../cube.js";
import { whipOut } from "./s1.js";

export const APERM = "R' F R' B2 R F' R' B2 R2";
export default function S6({ THREE, Wd, cube }) {
  const T = { t0: K(141), chips: K(141.6), perm: K(144.5), dim: K(144), undo: K(185.5), t1: K(188) };
  const ib = K(1) - K(0);
  const perm = schedule(APERM, T.perm, ib / 2 - 0.05, 0.05);
  const moves = [...perm, ...schedule(invert(APERM), T.undo, 0.05, 0.008)];
  // 算一下哪几块会动（用同一个引擎）
  const tmp = schedule(APERM, 0, 0.01, 0); cube.pose(tmp, 1e6);
  const movers = new Set(cube.cubies.filter((c) => c.userData.kind !== 1 && (c.position.distanceTo(c.userData.home) > 0.01 || Math.abs(Math.abs(c.quaternion.w) - 1) > 1e-4)));
  cube.pose([], 0);
  const C = [0, 2.3, 0];
  const chips = el(["A", "B", "A⁻¹", "B⁻¹"].map((c, i) => `<span class="chip2${i > 1 ? " inv" : ""}">${c}</span>`).join(""), "chips", "hud", "top:150px");
  const cs = [...chips.querySelectorAll("span")];
  const cnt = el(`只动了 <b>${movers.size}</b> 块`, "lbl", "hud", "left:0;right:0;text-align:center;top:860px;font-size:64px");
  return {
    t0: T.t0, t1: T.t1, T, moves, movers,
    cam(t) {
      const wi = whip(t, T.t0 - 0.55, 1.1, 2.4); // 接 S5 的环绕甩后半
      const wo = whipOut(t, T.t1);
      const a = 0.9 + 0.08 * (t - T.t0) + (wi.off - 2.4) + wo.off;
      return { pos: orbit(C, a, 10.4, 3.4), tgt: C, fov: 32, blur: wi.blur + wo.blur };
    },
    cube(t) {
      const kd = ease(ramp(t, T.dim, 0.5)) * (1 - ease(ramp(t, T.undo + 0.2, 0.6)));
      return {
        pos: C, rot: [0, 0.4 + 0.05 * (t - T.t0), 0],
        post: kd > 0 ? (c) => { if (c.userData.kind === 1 || !movers.has(c)) cube.dim(c, 0.96 * kd); else c.scale.setScalar(1 + 0.06 * kd); } : null,
      };
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      show(chips, on * ease(ramp(t, T.chips, 0.3)) * (1 - ease(ramp(t, T.perm - 0.3, 0.3))));
      cs.forEach((c, i) => c.classList.toggle("on", t >= T.chips + 0.4 + i * 0.55 && t < T.chips + 0.95 + i * 0.55));
      show(cnt, on * ease(ramp(t, perm[perm.length - 1].t0 + 0.4, 0.3)) * (1 - ease(ramp(t, T.undo, 0.3))));
    },
  };
}
