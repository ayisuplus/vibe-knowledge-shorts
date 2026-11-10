import { buildCube, schedule } from "../assets/js/cube.js";
const cube = buildCube();
const solved = () => cube.cubies.every((c) => c.position.distanceTo(c.userData.home) < 1e-6 && Math.abs(Math.abs(c.quaternion.w) - 1) < 1e-6);
for (const seq of ["R", "U", "R U", "R U'", "F R", "R U R' U'"]) {
  let n = 0;
  for (let k = 1; k <= 2000; k++) { const s = schedule(Array(k).fill(seq).join(" "), 0, 0.01, 0); cube.pose(s, 1e6); if (solved()) { n = k; break; } }
  console.log(seq, n);
}
