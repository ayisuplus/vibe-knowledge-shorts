// 世界：整片只有这一台跑道、这一个人。各段只改它的参数，不重建。
// 步频（步/秒）是全局唯一的时间函数：皮带位移和人的步态都由它积分得来，
// 所以「皮带多快」和「人跑多快」永远同步，段与段之间也不会跳。
// 速度只取两个值——SLOW（一拍一步）和 FAST（一拍两步）——脚落地就踩在拍上。
import { stage, machine, runner, baseline } from "./rig.js";
import { clamp, track, integ } from "./lib.js";
import { BB, SLOW, FAST } from "./beats.js";

export const cadence = track([
  [0, SLOW], [BB(2), (SLOW + FAST) / 2], [BB(4), FAST],   // 钩子：一拍一步 → 一拍两步
  [BB(6), FAST],                                          // 片名
  [BB(14), FAST],                                         // 女王
  [BB(22), FAST],                                         // 及格线
  [BB(30), FAST],                                         // 工时
  [BB(36), FAST],                                         // 同心圈
  [BB(37.2), FAST * 0.7], [BB(38.2), SLOW * 0.7], [BB(38.8), 0], [BB(40), 0],
]);

/** 累计步数。皮带位移 = P×120，人的步态相位 = P mod 1。 */
export const P = (t) => integ(cadence, t);
/** 仪表上的数：SLOW 显示 1.0×，FAST 显示 2.4× */
export const readout = (t) => Math.max(0, 1 + (cadence(t) - SLOW) * (1.4 / (FAST - SLOW))).toFixed(1);

export function build() {
  const s = stage();
  const m = machine(s);
  const r = runner(s, 960, 700);
  const bl = baseline(s, { x1: 240, x2: 1600 });
  bl.reveal(0);

  const svg = s.svg;

  return {
    s, m, r, bl,
    set(o = {}) {
      const {
        p = 0, effort = 0.5, lean = 6, rd = "1.0",
        mDim = 1, rDim = 1, dim = 1, x = 960,
      } = o;
      r.pose(p % 1, lean, effort);
      r.move(x - 960);
      m.speed(p * 120, clamp((parseFloat(rd) - 1) / 1.4));
      m.readout(rd);
      m.reveal(mDim);
      r.reveal(rDim);
      svg.style.opacity = clamp(dim).toFixed(3);
      svg.style.visibility = dim > 0.002 ? "visible" : "hidden";
    },
    tick(t, o = {}) {
      this.set({ p: P(t), rd: readout(t), ...o });
    },
  };
}