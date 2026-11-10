// v10：魔方铺成的路。26 个小块两块一排、彩色面朝上，从镜头脚下（z≈11）一直铺向远方。
// 路的位置是世界坐标（不跟着魔方转）；apply(c, j, k) 把第 j 块从它现在的样子往路上的位置拉，k=0 不动，k=1 正好落在路上。
// 用之前这一帧要先 cube.root.updateMatrixWorld()（post 里第 0 块时调用 sync()）。
import { hash } from "./util.js";

export function makeRoad(THREE, cube) {
  const n = cube.cubies.length;
  // 颜色打散：按 hash 给每块排一个铺路的顺序
  const order = cube.cubies.map((_, i) => i).sort((a, b) => hash(a + 500) - hash(b + 500));
  const slotOf = new Array(n); order.forEach((j, s) => (slotOf[j] = s));
  const GAP = 1.9, Z0 = 11;
  const slotPos = (s) => new THREE.Vector3(s % 2 ? 0.56 : -0.56, 0.52, Z0 - Math.floor(s / 2) * GAP);
  const UP = new THREE.Vector3(0, 1, 0);
  // 每块挑一面有贴纸的朝上（优先它本来的上 / 前 / 右面），再随机转 0/90/180/270°
  const faceUp = cube.cubies.map((c, i) => {
    const h = c.userData.home, v = h.y ? new THREE.Vector3(0, Math.sign(h.y), 0) : h.z ? new THREE.Vector3(0, 0, Math.sign(h.z)) : new THREE.Vector3(Math.sign(h.x), 0, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(v, UP);
    return new THREE.Quaternion().setFromAxisAngle(UP, (Math.PI / 2) * Math.floor(hash(i + 900) * 4)).multiply(q);
  });
  const v = new THREE.Vector3(), qi = new THREE.Quaternion(), qw = new THREE.Quaternion();
  const sync = () => cube.root.updateMatrixWorld(true);
  function apply(c, j, k, lift = 1.6) {
    if (k <= 0) return;
    v.copy(slotPos(slotOf[j])); cube.root.worldToLocal(v);
    c.position.lerp(v, k);
    c.position.y += lift * Math.sin(Math.PI * Math.min(1, k)) * (k < 1 ? 1 : 0) / cube.root.scale.y; // 飞过去的时候走一道弧
    qi.copy(cube.root.quaternion).invert(); qw.copy(qi).multiply(faceUp[j]);
    c.quaternion.slerp(qw, k);
  }
  return { n, slotOf, slotPos, GAP, Z0, rows: Math.ceil(n / 2), apply, sync };
}

// v12：路上的方块依次亮起。亮光的前沿从路的起点（z=11）出发往远处推进；镜头开始飞以后，前沿跟着加速，始终跑在镜头前面。
// fly(t)：收尾时镜头已经飞出去的距离（S9 也用它）
export const ROAD_T = { tEnd: 218.5 };
export function fly(t, K) { const u = Math.min(1, Math.max(0, (t - K(290)) / (ROAD_T.tEnd - K(290)))); return 4 * u + 250 * u * u * u; }
export function waveZ(t, K) { const tw0 = K(283) + 3.6; return 11 - 9 * Math.max(0, t - tw0) - 1.15 * fly(t, K); }
/** 一块方块（世界坐标 z）在 t 时的亮度增量：没亮时略暗，前沿经过时闪一下，之后一直亮着 */
export function litAt(z, t, K) {
  const tw0 = K(283) + 3.6, d = z - waveZ(t, K); // d > 0：前沿已经过去了
  const pre = -0.55 * Math.min(1, Math.max(0, (t - (tw0 - 0.8)) / 0.8));
  if (d <= 0) return pre;
  const on = Math.min(1, d / 2.5);
  return pre + on * (0.55 + 1.1) + 1.5 * Math.exp(-d / 2.2) * on;
}
