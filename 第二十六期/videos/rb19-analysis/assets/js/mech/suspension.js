// S5 机械特写：RB19 右前悬架（车轮拆下），刹车两次。结构与幅度为示意，不报任何数字。
// 机器坐标（米）：x 指向车头，y 向上，z 指向车外侧。车轮中心 (0, 0.36, 0.78)。尺寸按 2023 年 F1 常见量级估计。
// 运动：车身（簧上）随刹车下沉 d(t)，立柱与刹车盘（簧下）不动；每根杆绕外侧球头转，让内侧端点跟着车身走。
import { THREE, MAT, GEO, heatGlow, lab, defineMech, mechPoint } from "./host.js";
import { defineLabels, defineMarks } from "../hud.js";
import { clamp, mix, ease, curve } from "../lib.js";
import { MECH5, BRAKES5, CUT5 } from "../timeline.js";

const [A, B] = MECH5, WC = [0, .36, .78];
const UP_OUT = [0, .585, .66], LO_OUT = [0, .155, .68], PR_A = [.015, .555, .63];
const UF = [.34, .66, .18], UR = [-.31, .47, .18], LF = [.3, .13, .18], LR = [-.32, .17, .18], PR_B = [-.05, .16, .13], TR_O = [.11, .3, .69], TR_I = [.16, .3, .18];

/** 刹车量 0..1：踩下 0.18 秒到底，松开 0.3 秒回零 */
export const brake = (t) => Math.max(...BRAKES5.map(([on, off]) => ease((t - on) / .18) * (1 - ease((t - off) / .3))));
/** 车身下沉（米）：RB19 一沉就停住——先到 14 毫米，回弹到 10 毫米停住（示意） */
const drop = (t) => Math.max(...BRAKES5.map(([on, off]) => {
  const u = t - on; if (u < 0) return 0;
  const k = u < .16 ? ease(u / .16) * .014 : mix(.014, .010, ease((u - .16) / .25));
  return k * (1 - ease((t - off) / .3));
}));
/** 刹车盘温度（K）：踩着时升温，松开后慢慢退 */
const heat = (t) => {
  let h = 0;
  for (const [on, off] of BRAKES5) { if (t < on) continue; const up = 1 - Math.exp(-(Math.min(t, off) - on) * 2.2); h = Math.max(h, t < off ? up : up * Math.exp(-(t - off) * .9)); }
  return 640 + 320 * h;
};

const V = (p) => new THREE.Vector3(...p);
const rods = [];
let body, rocker, spring, discMat;

defineMech({
  name: "front-suspension", a: A, b: B,
  opacity: (t) => clamp((t - A) / .45) * (1 - clamp((t - B + .4) / .4)),
  build(g) {
    const P = { parent: g };
    // 簧下：刹车盘（碳–碳，会发红）、卡钳、轮毂、立柱
    discMat = heatGlow(MAT.satin({ color: [.05, .05, .055], roughness: .85 }), 640);
    lab.mesh(GEO.disc(.164, .032, .004, 96, .06), discMat, { ...P, name: "Brake disc", pos: [WC[0], WC[1], .725], rot: [Math.PI / 2, 0, 0] });
    lab.mesh(GEO.rbox(.07, .22, .075, .012), MAT.anodised({ color: [.12, .12, .14] }), { ...P, name: "Caliper", pos: [.13, .47, .72], rot: [0, 0, -.75] });
    lab.mesh(GEO.tube(.055, .03, .12), MAT.titanium(), { ...P, name: "Hub", pos: [WC[0], WC[1], .75], rot: [Math.PI / 2, 0, 0] });
    lab.mesh(GEO.bolts(6, .045, .008, .02, { y: 0 }), MAT.steel(), { ...P, name: "Hub bolts", pos: [WC[0], WC[1], .815], rot: [Math.PI / 2, 0, 0] });
    const up = new THREE.Shape(); up.moveTo(-.05, .13); up.lineTo(.05, .13); up.lineTo(.075, .30); up.lineTo(.07, .44); up.lineTo(.04, .6); up.lineTo(-.025, .6); up.lineTo(-.065, .44); up.lineTo(-.07, .3); up.closePath();
    const hole = new THREE.Path(); hole.absarc(0, .36, .05, 0, Math.PI * 2, true); up.holes.push(hole);
    lab.mesh(GEO.extrude(up, .05), MAT.anodised({ color: [.34, .35, .37] }), { ...P, name: "Upright", pos: [0, 0, .665] });
    for (const p of [UP_OUT, LO_OUT, PR_A, TR_O]) lab.mesh(new THREE.SphereGeometry(.022, 24, 16), MAT.steel(), { ...P, name: "Joint", pos: p });
    // 车架支撑
    for (const x of [-.45, .45]) lab.mesh(GEO.rbox(.12, .085, .12, .01), MAT.steelDark(), { ...P, name: "Stand", pos: [x, .0425, 0] });

    // 簧上：单体壳前段（碳纤维，侧面开一个贯穿的窗，看里面的摇臂和减振器）
    body = new THREE.Group(); g.add(body);
    const S = { parent: body };
    const cs = new THREE.Shape(); cs.moveTo(-.55, .12); cs.lineTo(.40, .14); cs.quadraticCurveTo(.5, .16, .5, .3); cs.lineTo(.5, .56); cs.lineTo(-.55, .72); cs.closePath();
    const win = new THREE.Path(); win.moveTo(-.34, .17); win.lineTo(.18, .17); win.lineTo(.18, .34); win.lineTo(-.34, .34); win.closePath(); cs.holes.push(win);
    lab.mesh(GEO.extrude(cs, .3, .02), MAT.carbon({ rep: [5, 5] }), { ...S, name: "Chassis", pos: [0, 0, 0] });
    const CF = MAT.carbon({ rep: [2, 8] }), TI = MAT.titanium(), ST = MAT.steel();
    // 杆：外侧球头不动，内侧端点跟车身走
    const rod = (pts, r, m, name) => { const mesh = lab.mesh(GEO.pipe(pts, r), m, { ...P, name }); rods.push({ mesh, O: V(pts[0]), I: V(pts[pts.length - 1]) }); return mesh; };
    rod([UP_OUT, [.17, .63, .42], UF], .017, CF, "Upper wishbone front");
    rod([UP_OUT, [-.15, .53, .42], UR], .017, CF, "Upper wishbone rear");
    rod([LO_OUT, [.15, .14, .43], LF], .017, CF, "Lower wishbone front");
    rod([LO_OUT, [-.16, .16, .43], LR], .017, CF, "Lower wishbone rear");
    rod([PR_A, PR_B], .011, TI, "Pull-rod");
    rod([TR_O, [.14, .3, .42], TR_I], .009, MAT.steelDark(), "Track rod");
    for (const p of [UF, UR, LF, LR, TR_I, PR_B]) lab.mesh(new THREE.SphereGeometry(.022, 24, 16), ST, { ...S, name: "Joint", pos: p });
    // 摇臂（绕支点转）、弹簧（被压短）、减振器、扭杆
    const rk = new THREE.Shape(); rk.moveTo(0, 0); rk.lineTo(.09, -.02); rk.lineTo(.07, .07); rk.closePath();
    rocker = lab.mesh(GEO.extrude(rk, .03), MAT.aluminiumMachined(), { ...S, name: "Rocker", pos: [-.08, .13, .07] });
    lab.mesh(GEO.tube(.012, 0, .12), ST, { ...S, name: "Rocker pivot", pos: [-.08, .13, .04], rot: [Math.PI / 2, 0, 0] });
    spring = lab.mesh(GEO.spring(.028, .006, 9, .2), MAT.paint({ color: [.85, .6, .12] }), { ...S, name: "Spring", pos: [-.2, .2, .07], rot: [0, 0, Math.PI / 2] });
    lab.mesh(GEO.tube(.02, 0, .24), MAT.chrome(), { ...S, name: "Damper", pos: [-.2, .2, .07], rot: [0, 0, Math.PI / 2] });
    lab.mesh(GEO.tube(.009, 0, .42), ST, { ...S, name: "Torsion bar", pos: [.05, .14, .05], rot: [0, 0, Math.PI / 2] });
  },
  state(t) {
    const d = drop(t), c = d / .014;
    body.position.set(0, -d, 0);
    for (const r of rods) {  // 让杆从 O 指向下沉后的 I
      const a = r.I.clone().sub(r.O), b = a.clone().add(new THREE.Vector3(0, -d, 0));
      const q = new THREE.Quaternion().setFromUnitVectors(a.normalize(), b.normalize());
      r.mesh.quaternion.copy(q); lab.place(r.mesh, ...r.O.clone().sub(r.O.clone().applyQuaternion(q)).toArray());
    }
    rocker.rotation.z = -.22 * c;
    spring.scale.set(1, 1 - .14 * c, 1);
    discMat.userData.heat.value = heat(t);
    return cam(t);
  },
});

// ── 镜头：从车外侧前方慢慢绕向外侧，段内一直在动（前半看上横臂，后半压低看车身窗口里的摇臂） ──
// 拍点硬切（CUT5）：前半从车前外侧看上横臂；后半换到车后外侧高处，往下看车身窗口里的摇臂和减振器，刹车盘退到右下
const K1 = [[A, [62, 8, 1.4, .02, .50, .46]], [CUT5, [72, 15, 1.16, 0, .48, .44]]];
const K2 = [[CUT5, [-22, 40, 1.08, -.08, .28, .3]], [B, [-36, 46, .98, -.12, .26, .28]]];
const mk = (K) => [0, 1, 2, 3, 4, 5].map((i) => curve(K.map(([s, v]) => [s, v[i]])));
const C1 = mk(K1), C2 = mk(K2);
const cam = (t) => { const C = t < CUT5 ? C1 : C2; return { az: C[0](t), el: C[1](t), dist: C[2](t), target: [C[3](t), C[4](t), C[5](t)] }; };

// ── 标注（AGENTS.md 1.3.1）：前半上横臂＋刹车盘，后半拉杆＋摇臂与减振器 ──
const on = (sprung) => (sprung ? body : body.parent);
const at = (p, sprung) => () => mechPoint(p, on(sprung));
defineLabels([
  { k: "full", t: "上横臂", f: "前高后低：刹车不点头", a: 100.6, b: 105.6, at: at([.17, .63, .42]), dx: -300, dy: -150 },
  { k: "tag", t: "刹车盘（刹车中发红）", a: 101.6, b: 105.6, at: at([.06, .25, .74]), dx: -230, dy: 180 },
  { k: "tag", t: "前（高）", a: 102.3, b: 105.6, at: at(UF, true), dx: 90, dy: 50 },
  { k: "tag", t: "后（低）", a: 102.3, b: 105.6, at: at(UR, true), dx: -90, dy: 60 },
  { k: "proc", t: "往上撑（示意）", a: 101.5, b: 105.0, at: at(UF, true), dx: 170, dy: -90 },
  { k: "full", t: "拉杆", f: "把轮子的力拉进车身", a: 106.1, b: 110.8, at: at([-.017, .36, .38]), dx: -320, dy: -160 },
  { k: "tag", t: "摇臂与减振器（车身里）", a: 106.6, b: 110.8, at: at([-.2, .2, .08], true), dx: 360, dy: -260 },
]);
// 前高后低的高度差：从后安装点水平引一条虚线到前安装点下方，再竖一道标尺；刹车时一支向上的力箭头（示意）
const flat = [UF[0], UR[1], UR[2]];
const two = (p, q, sprung) => () => { const a = mechPoint(p, on(sprung)), b = mechPoint(q, on(sprung)); return a && b ? [a, b] : null; };
defineMarks([
  { kind: "line", a: 102.0, b: 105.6, pts: two(UR, flat, true), color: "#9fd0ff", w: 4, dash: "10 9" },
  { kind: "dim", a: 102.3, b: 105.6, pts: two(flat, UF, true), color: "#9fd0ff", w: 5 },
  { kind: "arrow", a: 101.3, b: 105.0, pts: () => { const p = mechPoint(UF, body); return p ? [[p[0], p[1] - 20], [p[0], p[1] - 125]] : null; }, grow: (t) => brake(t), color: "#ffb454", w: 9 },
]);
