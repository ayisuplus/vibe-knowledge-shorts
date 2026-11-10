// S6 机械特写：RB19 尾翼（示意）——主翼面、DRS 活动片、端板、作动器、天鹅颈支架。DRS 开合两次，第二次换到侧面看翼型。
// 机器坐标（米）：x 指向车头（气流从 +x 吹向 −x），y 向上，z 横向。不报任何数字。
import { THREE, MAT, GEO, lab, defineMech, mechPoint } from "./host.js";
import { defineLabels, defineMarks } from "../hud.js";
import { clamp, mix, ease, curve } from "../lib.js";
import { MECH6, DRS, STAMP } from "../timeline.js";

const [A, B] = MECH6, CUT6 = DRS[1][0] - 1.4;   // 第二次张开之前硬切到侧面
/** DRS 开度 0..1：张开 0.22 秒到位，合上 0.18 秒 */
export const open = (t) => Math.max(...DRS.map(([a, b]) => ease((t - a) / .22) * (1 - ease((t - b) / .18))));
const SPAN = .9, PIV = [-.2, .8];                    // 活动片绕后缘转
const CLOSED = -.79, OPENED = -.25;                   // 活动片角度（弧度）
let flap, rod; const mount = [];

const airfoil = (pts) => { const s = new THREE.Shape(); s.moveTo(...pts[0]); for (let i = 1; i < pts.length; i++) s.lineTo(...pts[i]); s.closePath(); return s; };
// 主翼面：前缘在右（+x），弯向下（倒置翼型，产生下压力）
const MAIN = [[.25, .64], [.2, .615], [.1, .6], [0, .605], [-.09, .63], [-.1, .655], [-.02, .655], [.08, .645], [.18, .655], [.24, .665]];
// 活动片（局部坐标，后缘在原点＝转轴，前缘在 +x；整体转 CLOSED／OPENED）
const FLAP = [[0, 0], [.04, -.012], [.11, -.016], [.16, -.008], [.17, .006], [.12, .012], [.05, .01]];

defineMech({
  name: "drs", a: A, b: B,
  opacity: (t) => clamp((t - A) / .45) * (1 - clamp((t - B + .4) / .4)),
  build(g) {
    const P = { parent: g }, CF = MAT.carbon({ rep: [3, 3], clearcoat: .25, roughness: .55 });
    lab.mesh(GEO.extrude(airfoil(MAIN), SPAN, .004), CF, { ...P, name: "Main plane" });
    flap = new THREE.Group(); flap.position.set(PIV[0], PIV[1], 0); g.add(flap);
    lab.mesh(GEO.extrude(airfoil(FLAP), SPAN, .004), CF, { parent: flap, name: "DRS flap" });
    for (const z of [-SPAN / 2 - .012, SPAN / 2 + .012]) {
      const ep = airfoil([[.3, .48], [.3, .9], [-.24, .96], [-.26, .52]]);
      const m = lab.mesh(GEO.extrude(ep, .012, .002), MAT.carbon({ rep: [4, 4], clearcoat: .25, roughness: .55 }), { ...P, name: "Endplate", pos: [0, 0, z] }); mount.push(m);
    }
    // 天鹅颈支架：从下面的变速箱伸上来，挂住主翼面
    mount.push(lab.mesh(GEO.pipe([[.08, .18, 0], [.12, .42, 0], [.06, .6, 0]], .022), MAT.carbon({ rep: [2, 6] }), { ...P, name: "Swan neck" }));
    mount.push(lab.mesh(GEO.rbox(.42, .16, .26, .03), MAT.carbon({ rep: [5, 5] }), { ...P, name: "Gearbox", pos: [.14, .1, 0] }));
    // 作动器：缸体立在主翼面上方中间，推杆连到活动片
    lab.mesh(GEO.tube(.016, 0, .09), MAT.aluminiumMachined(), { ...P, name: "Actuator body", pos: [-.03, .7, 0], rot: [0, 0, .35] });
    rod = lab.mesh(GEO.tube(.006, 0, .06), MAT.chrome(), { ...P, name: "Actuator rod", pos: [-.05, .75, 0], rot: [0, 0, .35] });
  },
  state(t) {
    const k = open(t);
    flap.rotation.z = mix(CLOSED, OPENED, k);
    lab.place(rod, -.05 - .012 * k, .75 + .03 * k, 0);
    for (const m of mount) m.visible = t < CUT6;   // 侧面那一段拿掉端板和支架，只看翼型剪影
    return cam(t);
  },
});
// 镜头：侧后方 3/4，张开时推近；第二次之前硬切到侧面（看翼型和缝）
const K1 = [[A, [-62, 20, 1.15, -.02, .7, 0]], [DRS[0][0], [-55, 17, .98, -.04, .72, .05]], [CUT6, [-48, 15, .9, -.05, .73, .08]]];
const K2 = [[CUT6, [0, 1, 4.0, -.04, .675, 0]], [B, [0, 2, 3.7, -.05, .675, 0]]];   // 超长焦（fov 4.2°），近乎正投影看翼型
const mk = (K) => [0, 1, 2, 3, 4, 5].map((i) => curve(K.map(([s, v]) => [s, v[i]])));
const C1 = mk(K1), C2 = mk(K2);
const cam = (t) => { const C = t < CUT6 ? C1 : C2; return { az: C[0](t), el: C[1](t), dist: C[2](t), target: [C[3](t), C[4](t), C[5](t)], fov: t < CUT6 ? 30 : 4.2 }; };

const flapLE = (t) => { const a = mix(CLOSED, OPENED, open(t)), c = Math.cos(a), s = Math.sin(a); return [PIV[0] + .17 * c, PIV[1] + .17 * s]; };
const at = (p) => () => mechPoint(typeof p === "function" ? p() : p);
defineLabels([
  { k: "full", t: "DRS 活动片", f: "直道上张开减阻", a: A + .7, b: CUT6, at: (t) => { const [x, y] = flapLE(t); return mechPoint([x - .05, y + .01, .25]); }, dx: -340, dy: -170 },
  { k: "tag", t: "作动器", a: DRS[0][0] - .3, b: CUT6, at: at([-.04, .73, 0]), dx: 260, dy: -200 },
  { k: "tag", t: "主翼面", a: A + 1.2, b: CUT6, at: at([.12, .62, .3]), dx: 240, dy: 140 },
  { k: "tag", t: "活动片", a: CUT6 + .3, b: B - .4, at: (t) => { const [x, y] = flapLE(t); return mechPoint([(x + PIV[0]) / 2, (y + PIV[1]) / 2, 0]); }, dx: -260, dy: -60 },
  { k: "tag", t: "主翼面", a: CUT6 + .3, b: B - .4, at: at([.1, .62, 0]), dx: 260, dy: 60 },
  { k: "proc", t: "张开 → 阻力变小", a: DRS[1][0] + .2, b: DRS[1][1], at: () => [960, 250] },
  { k: "proc", t: "2011–2025", c: "stamp", a: STAMP, b: B - .3, at: () => [1300, 330] },
  { k: "proc", t: "2026 起退役", a: STAMP + .3, b: B - .3, at: () => [1300, 470] },
]);
// 流线（侧面那一段才画）：合上时翻过活动片后卷起，张开时从缝里穿过、变顺；阻力箭头张开时缩短
const ZS = .2;
const stream = (y0, j) => (t) => {
  if (t < CUT6) return null;
  const k = open(t), pts = [];
  for (let i = 0; i <= 36; i++) {
    const x = mix(.6, -.75, i / 36);
    const over = Math.exp(-(((x - .05) / .18) ** 2)) * mix(.07, .05, k) * (1 - j * .3);
    const wake = x < -.18 ? (1 - k) * (.1 * (1 - Math.exp(-(-.18 - x) * 6)) + .014 * Math.sin(x * 30 + t * 7 + j)) : 0;
    const p = mechPoint([x, y0 + over + wake * (1 + j * .4), ZS]); if (!p) return null; pts.push(p);
  }
  return pts;
};
defineMarks([
  ...[.69, .74, .80].map((y0, j) => ({ kind: "line", a: CUT6 + .2, b: B - .2, pts: stream(y0 + .02, j), color: "#58c4ff", w: 5, dash: "26 18", off: (t) => t * 220, col: (t) => (open(t) > .5 ? "#7fd8ff" : "#58c4ff") })),
  { kind: "arrow", a: CUT6 + .3, b: B - .4, pts: (t) => { const p = mechPoint([-.05, .86, 0]); return p ? [p, [p[0] + mix(-360, -120, open(t)), p[1]]] : null; }, color: "#ff8a7a", w: 11 },
]);
