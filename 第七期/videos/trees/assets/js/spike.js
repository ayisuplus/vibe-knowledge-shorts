// 技术样片（5 秒）：种子破土长成小树 → 镜头穿过地表 → 根系生长并点亮 → 一个节点标签。
// 目的是测渲染耗时，不是成片镜头。
import { buildWorld } from "./world.js";

const DUR = 5;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x) => 1 - (1 - clamp(x)) ** 3;
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

// 分段缓动的机位
function camAt(keys, t) {
  if (t <= keys[0].t) return keys[0];
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b.t) { const k = ease((t - a.t) / (b.t - a.t)); return { pos: lerp3(a.pos, b.pos, k), tgt: lerp3(a.tgt, b.tgt, k) }; }
  }
  return keys[keys.length - 1];
}

const W = buildWorld(document.getElementById("gl"), { seed: 7 });
const { crown, roots } = W;
const CAM = [
  { t: 0, pos: [1.2, 1.1, 9.0], tgt: [0, 0.6, 0] },
  { t: 2.3, pos: [3.2, 2.2, 12.5], tgt: [0, 1.4, 0] },
  { t: 3.4, pos: [2.0, -0.6, 7.6], tgt: [0, -1.0, 0] },
  { t: 5, pos: [0.9, -1.2, 4.6], tgt: [-0.2, -1.5, 0] },
];

const hud = document.getElementById("hud");
hud.innerHTML = `<div class="t" id="rule">同一条规则，重复 <em>6</em> 次</div><div class="node" id="n50">50</div>`;
const rule = document.getElementById("rule"), n50 = document.getElementById("n50");
// 标签挂在根系里一个靠前、靠下的节点上
let pick = 0, best = -1e9;
for (let i = 0; i < roots.n; i++) { const p = roots.P[i]; const sc = p[2] * 1.0 - Math.abs(p[0]) * 0.4 - Math.abs(p[1] + 1.2) * 2; if (roots.path[i] < roots.maxPath * 0.7 && sc > best) { best = sc; pick = i; } }

function frame(t) {
  const grow = 0.75 * easeOut(t / 3.0);
  const rootGrow = 0.85 * ease((t - 0.4) / 3.6);
  const lit = 0.85 * ease((t - 3.2) / 1.6);
  W.render({ grow, rootGrow, lit, leaf: 1, cam: camAt(CAM, t) });

  const ro = ease((t - 0.5) / 0.4) * (1 - ease((t - 2.2) / 0.4));
  rule.style.visibility = ro > 0.001 ? "visible" : "hidden";
  rule.style.opacity = ro;

  const no = ease((t - 4.0) / 0.35);
  const p = W.project(roots.P[pick]);
  n50.style.visibility = no > 0.001 && !p.behind ? "visible" : "hidden";
  n50.style.opacity = no;
  n50.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -130%) scale(${0.8 + 0.2 * no})`;
}

const tl = window.__timelines.main;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
window.__spikeReady = true;
