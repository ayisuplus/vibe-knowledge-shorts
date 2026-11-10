// 主树生成器：空间殖民算法（Runions et al. 2007），固定随机种子。
// 输出一棵"骨架"：节点位置、父节点、沿路径到起点的距离 path、最终半径 r。
// 生长不在这里算：渲染时用 front(t)（沿路径的生长前沿）决定哪些节点已经长出来。

export function rng(seed) {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 在椭球里撒点。shape(x,y,z) 返回 true 才保留，用来挖掉中心或压扁形状。
export function scatter(rand, n, c, rx, ry, rz, shape) {
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < n * 50) {
    const x = rand() * 2 - 1, y = rand() * 2 - 1, z = rand() * 2 - 1;
    if (x * x + y * y + z * z > 1) continue;
    const p = [c[0] + x * rx, c[1] + y * ry, c[2] + z * rz];
    if (shape && !shape(p, x, y, z)) continue;
    pts.push(p);
  }
  return pts;
}

/**
 * opts:
 *   start [x,y,z], dir [x,y,z]（主干方向）, trunk 主干先直长的长度
 *   attractors [[x,y,z]], seg 每步长度, influence 影响半径, kill 吸收半径
 *   tropism [x,y,z] 每步叠加的偏向（向上 / 向下）, maxIter
 *   rTip 枝梢半径, pipe 管道模型指数（父 r^e = Σ 子 r^e）
 */
export function colonize(opts) {
  const { start, dir, trunk, seg, influence, kill, tropism = [0, 0, 0], maxIter = 400, rTip = 0.012, pipe = 2.5 } = opts;
  const attr = opts.attractors.map((p) => ({ p, alive: true }));
  const P = [start.slice()], par = [-1];

  // 先直着长出主干
  const nTrunk = Math.max(1, Math.round(trunk / seg));
  for (let i = 1; i <= nTrunk; i++) {
    const q = P[P.length - 1];
    P.push([q[0] + dir[0] * seg, q[1] + dir[1] * seg, q[2] + dir[2] * seg]);
    par.push(P.length - 2);
  }

  // 节点空间网格（格子边长 = influence）
  const cell = influence, grid = new Map();
  const key = (x, y, z) => `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
  const addGrid = (i) => { const k = key(...P[i]); let a = grid.get(k); if (!a) grid.set(k, (a = [])); a.push(i); };
  for (let i = 0; i < P.length; i++) addGrid(i);
  const near = (p, cb) => {
    const cx = Math.floor(p[0] / cell), cy = Math.floor(p[1] / cell), cz = Math.floor(p[2] / cell);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const a = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
      if (a) for (const i of a) cb(i);
    }
  };
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
  const inf2 = influence * influence, kill2 = kill * kill;

  for (let it = 0; it < maxIter; it++) {
    const pull = new Map(); // node -> [sx,sy,sz,count]
    let live = 0;
    for (const a of attr) {
      if (!a.alive) continue;
      live++;
      let best = -1, bd = inf2;
      near(a.p, (i) => { const d = d2(a.p, P[i]); if (d < bd) { bd = d; best = i; } });
      if (best < 0) continue;
      const v = P[best], dx = a.p[0] - v[0], dy = a.p[1] - v[1], dz = a.p[2] - v[2], l = Math.hypot(dx, dy, dz) || 1;
      let s = pull.get(best);
      if (!s) pull.set(best, (s = [0, 0, 0, 0]));
      s[0] += dx / l; s[1] += dy / l; s[2] += dz / l; s[3]++;
    }
    if (!live || !pull.size) break;
    const fresh = [];
    for (const [i, s] of pull) {
      let x = s[0] / s[3] + tropism[0], y = s[1] / s[3] + tropism[1], z = s[2] / s[3] + tropism[2];
      const l = Math.hypot(x, y, z);
      if (l < 1e-4) continue;
      const q = P[i], np = [q[0] + (x / l) * seg, q[1] + (y / l) * seg, q[2] + (z / l) * seg];
      // 避免同一位置重复长（两个吸引点对称时会原地打转）
      let dup = false;
      near(np, (j) => { if (d2(np, P[j]) < seg * seg * 0.04) dup = true; });
      if (dup) continue;
      P.push(np); par.push(i); addGrid(P.length - 1); fresh.push(P.length - 1);
    }
    if (!fresh.length) break;
    for (const a of attr) {
      if (!a.alive) continue;
      for (const j of fresh) if (d2(a.p, P[j]) < kill2) { a.alive = false; break; }
    }
  }

  const n = P.length;
  const kids = Array.from({ length: n }, () => []);
  for (let i = 1; i < n; i++) kids[par[i]].push(i);
  const path = new Float32Array(n);
  for (let i = 1; i < n; i++) path[i] = path[par[i]] + Math.sqrt(d2(P[i], P[par[i]]));
  // 节点按 index 递增时父节点总在前面，所以倒序就是自底向上
  const r = new Float32Array(n);
  for (let i = n - 1; i >= 0; i--) {
    if (!kids[i].length) { r[i] = rTip; continue; }
    let s = 0;
    for (const k of kids[i]) s += r[k] ** pipe;
    r[i] = s ** (1 / pipe);
  }
  // 子树最远路径（用来判断枝梢、给叶子定时）
  const reach = Float32Array.from(path);
  for (let i = n - 1; i > 0; i--) reach[par[i]] = Math.max(reach[par[i]], reach[i]);
  let maxPath = 0;
  for (let i = 0; i < n; i++) maxPath = Math.max(maxPath, path[i]);
  return { P, par, kids, path, r, reach, n, maxPath, rTip };
}
