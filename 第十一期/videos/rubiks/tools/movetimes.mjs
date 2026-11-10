// 导出每一步转动的开始时刻（给音效用）：和 film.js 里拼 SCH 的方式一模一样。
// 用法：node tools/movetimes.mjs > sfx/moves.json
import { schedule, invert } from "../assets/js/cube.js";
import { moveGroups } from "../assets/js/late.js";
const b0 = 4.248, ib = 0.743, at = (k) => b0 + k * ib;
const PAT = { spots: "U D' R L' F B' U D'", cic: "F L F U' R U F2 L2 U' L' B D' B' L2 U", fiddle: "R U R' U' F' L' U2 B D' R2 L U F2 D B' U' R" };
const groups = {
  spots: schedule(PAT.spots, at(14.5), ib / 2 - 0.04, 0.04),
  unspots: schedule(invert(PAT.spots), at(18.5), 0.085, 0.01),
  cic: schedule(PAT.cic, at(22), ib / 2 - 0.04, 0.04),
  fiddle: schedule(PAT.fiddle, at(32), ib / 4 - 0.02, 0.02),
};
Object.assign(groups, moveGroups(PAT));
const out = {};
for (const [k, v] of Object.entries(groups)) out[k] = v.map((m) => [+m.t0.toFixed(3), m.tok]);
console.log(JSON.stringify(out));
