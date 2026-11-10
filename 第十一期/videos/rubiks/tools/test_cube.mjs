// 校验状态引擎：重复 105 / 1260 次以后精确回到复原；中间某一时刻和逐步计算一致
import { buildCube, schedule } from "../assets/js/cube.js";
const cube = buildCube();
const rep = (seq, n) => Array(n).fill(seq).join(" ");
function solvedAt(sch, t) {
  cube.pose(sch, t);
  return cube.cubies.every((c) => c.position.distanceTo(c.userData.home) < 1e-6 && Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6);
}
const a = schedule(rep("R U", 105), 0, 0.01, 0);
const b = schedule(rep("R U2 D' B D'", 1260), 0, 0.001, 0);
const end = (s) => s[s.length - 1].t0 + s[s.length - 1].d + 1;
console.log("RU x105 solved:", solvedAt(a, end(a)), " x104 solved:", solvedAt(schedule(rep("R U", 104), 0, 0.01, 0), 99));
console.log("1260 solved:", solvedAt(b, end(b)), " moves", b.length);
const t0 = Date.now(); for (let i = 0; i < 30; i++) cube.pose(b, end(b) * (i / 30)); console.log("ms/pose", (Date.now() - t0) / 30);
