// 全片的整车侧视线稿：一台 RB19、一台对比车（灰，示意）。这里只决定「每一刻它们在哪、在做什么」，画法在 side.js。
// 出场：S2 逐笔画出、隧道亮起 → S4 末推向前轮 → S5 对比车刹车点头、两车并排对比 → S6 车尾特写（梁翼、阻力）→ S8 收成图标。
import { svg, show, cam, toScreen } from "./svg.js";
import { makeSide, AX } from "./side.js";
import { defineLabels, defineMarks } from "../hud.js";
import { clamp, mix, ease, easeOut } from "../lib.js";
import { DRAW2, TUN2, Y78, Y22, PAPER, CUTS, COMP_BRAKE, MECH5, DUAL_BRAKE, FLOW5, BEAM_SHRINK, DRAG, MECH6, QUESTION } from "../timeline.js";

const layer = svg("g", {});
const rb = makeSide(layer), cmp = makeSide(layer, { grey: true });
const fade = (t, a, b, f = .3) => clamp((t - a) / f) * (1 - clamp((t - b + f) / f));
const lerpCam = (A, B, k) => cam(mix(A.x, B.x, k), mix(A.y, B.y, k), mix(A.s, B.s, k));
/** 以毫米点 (mx,my) 为中心放到屏幕 (X,Y) 的机位 */
const aim = (mx, my, X, Y, s) => cam(X - mx * s, Y + my * s, s);
const HOME = cam(150, 800, .285);
/** 刹车点头角（度，负＝车头向下）：深＝对比车 2.6°，浅＝RB19 0.3°（示意，放大了幅度） */
const nod = (t, at, deep, hold = 3.6) => -deep * ease((t - at) / .25) * (1 - ease((t - at - hold) / .4));
/** 两台车并排：RB19 在上，对比车在下 */
const UP = cam(400, 520, .2), DOWN = cam(400, 800, .2);
/** 静读段的慢漂移：机位每秒横移 vx 像素、放大 vs（防止画面静止） */
const drift = (c, t, t0, vx = -5, vs = .004) => cam(c.x + (t - t0) * vx, c.y, c.s * (1 + (t - t0) * vs));

function rbState(t) {
  // S2
  if (t >= 18.4 && t < 42) {
    const c = cam(mix(190, 150, ease((t - 18.6) / 6)) - Math.max(0, t - 24.6) * 3, 800, .285 * (1 + Math.max(0, t - 24.6) * .002));
    const dim = t < Y78 ? 1 : t < Y22 ? mix(1, .07, ease((t - Y78) / .4)) : t < PAPER ? mix(.07, 1, ease((t - Y22) / .4)) : mix(1, .3, ease((t - PAPER) / .5));
    const tun = t < Y78 ? clamp((t - TUN2) / .4) : t < Y22 ? 0 : clamp((t - Y22 - .3) / .4);
    return { cam: c, o: 1 - clamp((t - 41.6) / .4), draw: (t - DRAW2[0]) / (DRAW2[1] - DRAW2[0]), dim, tunnel: tun, flow: t };
  }
  // S4 末：推向前轮，前悬架亮起
  if (t >= CUTS.s4b && t < 95) {
    const k = ease((t - CUTS.s4b) / 3.6);
    return { cam: lerpCam(HOME, aim(AX.front[0], AX.front[1] + 120, 900, 520, .78), k), o: clamp((t - CUTS.s4b) / .3), draw: 1, sus: clamp((t - CUTS.s4b - 1.2) / .6) };
  }
  // S5：对比车之后，RB19 接过来推进前轮，交给机械特写
  if (t >= 98.6 && t < MECH5[0] + .6) {
    const k = ease((t - 98.8) / 1.6);
    return { cam: lerpCam(HOME, aim(AX.front[0], AX.front[1] + 120, 960, 500, 1.1), k), o: clamp((t - 98.6) / .3) * (1 - clamp((t - MECH5[0]) / .5)), draw: 1, sus: 1 };
  }
  if (t >= MECH5[1] - .4 && t < 125) {
    const o = clamp((t - MECH5[1] + .4) / .4) * (t > 121.4 ? mix(1, .3, ease((t - 121.4) / .4)) : 1);
    return { cam: drift(UP, t, 111, -4, .003), o, draw: 1, pitch: nod(t, DUAL_BRAKE, .3), tunnel: clamp((t - FLOW5) / .4), flow: t };
  }
  // S6：车尾特写；进 DRS 特写前推近尾翼
  if (t >= 125 && t < 155) {
    const REAR = aim(330, 560, 760, 520, .78), WING = aim(350, 880, 960, 520, 1.6);
    const R0 = drift(REAR, Math.min(t, MECH6[0] - .8), 125), c = t < MECH6[0] - .8 ? R0 : lerpCam(R0, WING, ease((t - MECH6[0] + .8) / 1.0));
    const back = t >= MECH6[1] - .2;   // DRS 特写结束后回到车尾，压暗给链条让位
    const o = back ? clamp((t - MECH6[1] + .2) / .4) * .3 : clamp((t - 125) / .3) * (1 - clamp((t - MECH6[0]) / .5));
    return { cam: back ? drift(REAR, t, MECH6[1]) : c, o, draw: 1, beam2: 1 - ease((t - BEAM_SHRINK) / .5), wheels: .18 };
  }
  // S8：快速画出、收成右上角的小图标
  if (t >= 175) {
    const k = ease((t - 176.2) / .8);
    return { cam: lerpCam(cam(560, 760, .14), cam(1560, 380, .05), k), o: clamp((t - 175) / .3), draw: (t - 175.1) / 1.0, tunnel: 0 };
  }
  return { o: 0 };
}
function cmpState(t) {
  if (t >= 95 && t < 99.2) return { cam: drift(HOME, t, 95, -6, .003), o: clamp((t - 95.0) / .3) * (1 - clamp((t - 98.8) / .4)), draw: 1, pitch: nod(t, COMP_BRAKE, 2.6, 2.4) };
  if (t >= MECH5[1] - .4 && t < 125) {
    const o = clamp((t - MECH5[1] + .4) / .4) * (t > 121.4 ? mix(1, .3, ease((t - 121.4) / .4)) : 1);
    return { cam: drift(DOWN, t, 111, -4, .003), o, draw: 1, pitch: nod(t, DUAL_BRAKE, 2.6), tunnel: clamp((t - FLOW5) / .4) * (.55 + .45 * Math.sin(t * 23)), flow: t + .25 * Math.sin(t * 9) };
  }
  return { o: 0 };
}

// ── 离地间隙标尺：车头下方（点头后的位置）到地面 ──
const NOSE = [5000, 250];
const rotP = ([x, y], deg) => { const a = deg * Math.PI / 180, [cx, cy] = AX.rear, dx = x - cx, dy = y - cy; return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)]; };
let RS = { rb: null, cmp: null };
const ruler = (who) => () => { const s = RS[who]; if (!s || !(s.o > .05)) return null; const p = rotP(NOSE, s.pitch || 0); return [toScreen(s.cam, p), toScreen(s.cam, [p[0], 0])]; };
defineMarks([
  { kind: "dim", a: 95.2, b: 99.0, pts: ruler("cmp"), color: "#ff8a7a", w: 5 },
  { kind: "dim", a: 111.4, b: 121.4, pts: ruler("rb"), color: "#ffb454", w: 5 },
  { kind: "dim", a: 111.4, b: 121.4, pts: ruler("cmp"), color: "#ff8a7a", w: 5 },
  // S6 阻力箭头（只画相对大小）：梁翼上的短，尾翼上的长，都指向车后
  { kind: "arrow", a: DRAG, b: MECH6[0], pts: () => RS.rb && [toScreen(RS.rb.cam, [380, 345]), toScreen(RS.rb.cam, [-260, 345])], grow: (t) => ease((t - DRAG) / .5) * .55, color: "#ff8a7a", w: 10 },
  { kind: "arrow", a: DRAG + .3, b: MECH6[0], pts: () => RS.rb && [toScreen(RS.rb.cam, [380, 860]), toScreen(RS.rb.cam, [-560, 860])], grow: (t) => ease((t - DRAG - .3) / .6), color: "#ff8a7a", w: 10 },
]);
const P = (who, mm) => () => { const s = RS[who]; return s && s.o > .05 ? toScreen(s.cam, rotP(mm, s.pitch || 0)) : null; };
defineLabels([
  { k: "full", t: "车底 · 两条隧道", f: "把车吸向地面", a: TUN2, b: 23.7, at: P("rb", [2400, 80]), dx: -260, dy: -330 },
  { k: "tag", t: "对比车（示意）", a: 95.3, b: 98.8, at: P("cmp", [3340, 900]), dx: -120, dy: -150 },
  { k: "proc", t: "车头下沉", a: COMP_BRAKE + .2, b: 98.8, at: P("cmp", NOSE), dx: 0, dy: 130 },
  { k: "tag", t: "RB19", a: 111.4, b: 121.4, at: P("rb", [3340, 900]), dx: -200, dy: -40 },
  { k: "tag", t: "对比车（示意）", a: 111.4, b: 121.4, at: P("cmp", [3340, 900]), dx: -200, dy: -40 },
  { k: "proc", t: "车头稳住", a: DUAL_BRAKE + .3, b: 116.6, at: P("rb", NOSE), dx: 190, dy: -40 },
  { k: "proc", t: "车头下沉", a: DUAL_BRAKE + .3, b: 116.6, at: P("cmp", NOSE), dx: 190, dy: -40 },
  { k: "proc", t: "高度稳 → 吸力稳", a: FLOW5 + .3, b: 121.4, at: () => [1500, 660] },
  { k: "full", t: "梁翼", f: "尾翼下面的小翼片", a: 125.5, b: 130.3, at: P("rb", [370, 340]), dx: 380, dy: 60 },
  { k: "tag", t: "尾翼", a: 125.9, b: MECH6[0], at: P("rb", [360, 830]), dx: 420, dy: -60 },
  { k: "proc", t: "阻力分布（示意）", a: DRAG + .2, b: MECH6[0], at: P("rb", [200, 600]), dx: 640, dy: 0 },
]);

export function linecarState(t) {
  const a = rbState(t), b = cmpState(t);
  RS = { rb: a.cam ? a : null, cmp: b.cam ? b : null };
  rb.state(a); cmp.state(b);
  show(layer, (a.o || 0) + (b.o || 0) > .002 ? 1 : 0);
}
