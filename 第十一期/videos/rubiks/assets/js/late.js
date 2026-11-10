// S3 数量 → S4 上帝之数 → S5 人和机器 → S6 高潮收尾（炸开 → 合拢 → 标题砸下来 → 白闪切黑，不回落）。由 film.js 调用；时刻都卡在配乐的节拍上（at(k)）。
import * as THREE from "three";
import { schedule, invert, parse } from "./cube.js";
import { track, win, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, clamp, lerp, pulse, el, show } from "./lib.js";

const b0 = 4.248, ib = 0.743, at = (k) => b0 + k * ib;
export const L = {
  s3: at(37.5), checker: [at(40), at(41), at(42)], pull: at(43.5), digits: at(44), seg: at(47), beam: at(48), beamEnd: at(52), s3out: at(55),
  s4: at(55.5), reset4: at(56), sf: at(59), big: at(66), wave: at(71), y2010: at(74.5),
  s5: at(78), cross: at(80), hScr: at(83), hSolve: at(84.5), rScr: at(88), rSolve: at(88.75), replay: at(89.5),
  fin: at(91.5), burst6: at(92), slam: at(95), title6: at(96), pulse6: [at(97), at(98)], flashEnd: at(99), end: 78.0,
};
const P = {
  checker: ["M2", "E2", "S2"],
  superflip: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
  cross: "U F B' L2 U2 L2 F' B U2 L2 U",
  scr: "D2 F' R2 U L' B2 D R F2 U' L2 B' R' D' F U2 L B R2 U'",
};
export const HUMAN = 2.51, ROBOT = 0.305;

// 一串公式正好用 total 秒走完（半圈按 1.35 倍分配时间，步间留 10%）
function timed(seq, t0, total) {
  const ms = parse(seq), w = ms.map((m) => (Math.abs(m.q) === 2 ? 1.35 : 1)), sum = w.reduce((a, b) => a + b, 0);
  let t = t0;
  return ms.map((m, i) => { const slot = (total * w[i]) / sum, r = { ...m, t0: t, d: slot * 0.9 }; t += slot; return r; });
}

/** S3 以后的转动表（接在 S2 的「魔中魔 + 拨弄」后面，所以先整段倒回去） */
export function moveGroups(PAT) {
  const G = {};
  const add = (k, arr) => { G[k] = (G[k] || []).concat(arr); };
  add("rewind", schedule(invert(PAT.cic + " " + PAT.fiddle), L.s3, 0.04, 0.005));
  P.checker.forEach((m, i) => add("checker", schedule(m, L.checker[i], 0.45, 0)));
  add("reset4", schedule(invert(P.checker.join(" ")), L.reset4, 0.1, 0.02));
  add("superflip", schedule(P.superflip, L.sf, ib / 4 - 0.02, 0.02));
  add("reset5", schedule(invert(P.superflip), L.s5, 0.04, 0.005));
  add("cross", schedule(P.cross, L.cross, 0.15, 0.02));
  add("hScr", schedule(invert(P.cross) + " " + P.scr, L.hScr, 0.022, 0.003));
  add("hSolve", timed(invert(P.scr), L.hSolve, HUMAN));
  add("rScr", schedule(P.scr, L.rScr, 0.022, 0.003));
  add("rSolve", timed(invert(P.scr), L.rSolve, ROBOT));
  add("replayScr", schedule(P.scr, L.replay, 0.0004, 0));
  add("replay", timed(invert(P.scr), L.replay + 0.07, ROBOT * 5));
  return G;
}
export function movesOld(PAT) {
  const out = [];
  out.push(...schedule(invert(PAT.cic + " " + PAT.fiddle), L.s3, 0.04, 0.005));            // 倒带回复原
  P.checker.forEach((m, i) => out.push(...schedule(m, L.checker[i], 0.45, 0)));            // 3 步棋盘格，一拍一步
  out.push(...schedule(invert(P.checker.join(" ")), L.reset4, 0.1, 0.02));                 // 还原
  out.push(...schedule(P.superflip, L.sf, ib / 4 - 0.02, 0.02));                           // 20 步超级翻转
  out.push(...schedule(invert(P.superflip), L.s5, 0.04, 0.005));                           // 还原
  out.push(...schedule(P.cross, L.cross, 0.15, 0.02));                                     // 十字
  out.push(...schedule(invert(P.cross) + " " + P.scr, L.hScr, 0.022, 0.003));               // 打乱
  out.push(...timed(invert(P.scr), L.hSolve, HUMAN));                                      // 人类：2.51 秒复原
  out.push(...schedule(P.scr, L.rScr, 0.022, 0.003));                                      // 再打乱
  out.push(...timed(invert(P.scr), L.rSolve, ROBOT));                                      // 机器：0.305 秒
  out.push(...schedule(P.scr, L.replay, 0.0004, 0));                                       // 瞬间回到打乱（准备回放）
  out.push(...timed(invert(P.scr), L.replay + 0.07, ROBOT * 5));                          // 慢放 5 倍
  return out;
}
export function moves(PAT) { return Object.values(moveGroups(PAT)).flat(); }
export const sfCount = (t, sch) => sch.filter((m) => m.t0 >= L.sf - 0.001 && m.t0 < L.s5 - 0.5 && t >= m.t0 + m.d).length;

export const CAM = [
  [33.6, [5.6, 5.2, 10.4], [0, 2.3, 0]],
  [36.6, [5.0, 4.8, 10.6], [0, 2.2, 0]],
  [37.7, [0.6, 4.2, 15.0], [0.6, 1.4, 0]],
  [45.1, [0.8, 4.4, 15.4], [0.6, 1.4, 0]],
  [46.4, [5.2, 4.2, 11.0], [0, 2.3, 0]],
  [48.0, [2.4, 3.6, 11.5], [1.9, 1.9, 0]],
  [53.0, [2.0, 3.4, 11.0], [1.9, 1.9, 0]],
  [59.0, [1.6, 3.8, 11.8], [1.9, 2.0, 0]],
  [62.2, [1.8, 3.8, 11.6], [1.9, 2.0, 0]],
  [63.3, [5.4, 4.8, 10.4], [0, 2.3, 0]],
  [66.6, [4.2, 3.8, 9.0], [0, 2.3, 0]],
  [70.0, [-4.4, 3.9, 9.2], [0, 2.3, 0]],
  [72.3, [-3.0, 3.2, 8.0], [0, 2.4, 0]],
];
// 收尾机位：绕着魔方越转越快（一圈多），炸开时拉远，标题砸下来时推近
export function camFinale(t, pos, tgt) {
  if (t < L.fin) return [pos, tgt];
  const az0 = Math.atan2(-3.0, 8.0);
  const az = az0 + Math.PI * 2 * 1.2 * easeInOut(ramp(t, L.fin + 0.1, L.title6 - L.fin - 0.1)) + 0.12 * Math.max(0, t - L.title6);
  const r = lerp(8.5, 10.2, ease(ramp(t, L.burst6, 0.8))) - 0.6 * easeInOut(ramp(t, L.slam - 0.3, 1.4)) + 0.9 * ease(ramp(t, L.title6 - 0.4, 0.8)) - 0.7 * ease(ramp(t, L.title6 + 0.4, 1.8));
  const h = lerp(3.2, 4.6, ease(ramp(t, L.burst6, 0.8))) - 0.9 * easeInOut(ramp(t, L.slam - 0.3, 1.4));
  const k = ease(ramp(t, L.fin, 0.5));
  const o = [Math.sin(az) * r, h, Math.cos(az) * r], q = [0, 2.7, 0];
  return [pos.map((v, i) => lerp(v, o[i], k)), tgt.map((v, i) => lerp(v, q[i], k))];
}
export const bloomAt = (t) => 0.55 + 0.45 * ease(ramp(t, L.burst6, 0.4)) * (1 - ease(ramp(t, L.slam + 0.3, 0.8))) + 0.35 * Math.max(pulse(t, L.slam - 0.05, 0.6), pulse(t, L.title6 - 0.05, 0.6), pulse(t, L.pulse6[0], 0.5), pulse(t, L.pulse6[1], 0.5));
export const explodeAt = (t) => 1.35 * easeOut(ramp(t, L.burst6, 0.45)) * (1 - easeIn(ramp(t, L.slam - 0.25, 0.25)));

// 魔方在展台上的位置 / 大小 / 朝向（S3 起）
const POS = track([
  [L.s3, [0, 2.3, 0]], [L.pull, [0, 2.3, 0]], [L.pull + 1.0, [-4.4, 1.6, 0]], [L.s4, [-4.4, 1.6, 0]], [L.s4 + 0.9, [0, 2.3, 0]],
  [L.sf - 0.7, [0, 2.3, 0]], [L.sf - 0.1, [3.3, 2.0, 0]], [L.s5, [3.3, 2.0, 0]], [L.s5 + 0.7, [0, 2.3, 0]], [72.3, [0, 2.3, 0]], [72.9, [0, 2.7, 0]],
]);
const SCL = track([[L.pull, 1], [L.pull + 1.0, 0.72], [L.s4, 0.72], [L.s4 + 0.9, 1]]);
export function root(t, r0, obj) {
  obj.position.set(...POS(t)); obj.scale.setScalar(SCL(t));
  // 朝向：S3 慢转；S4 转到样张 C 的角度（-0.62）；S5 继续慢转
  const near = (a, b) => b + Math.round((a - b) / (Math.PI * 2)) * Math.PI * 2;
  const rS3 = r0 + 0.12 * (t - L.s3);
  const r4 = near(r0 + 0.12 * (L.sf - 0.7 - L.s3), -0.62);
  let r = rS3;
  if (t >= L.sf - 0.7) r = lerp(r0 + 0.12 * (L.sf - 0.7 - L.s3), r4, easeInOut(ramp(t, L.sf - 0.7, 0.7))) + 0.02 * Math.max(0, t - L.sf);
  if (t >= L.s5) r = r4 + 0.02 * (L.s5 - L.sf) + 0.18 * (t - L.s5);
  // 收尾：越转越快
  if (t >= L.fin) { const d = t - L.fin; r += Math.min(0.9 * d * d, 4.5 + 3.2 * Math.max(0, d - 2.2)); obj.rotation.set(0.25 * ease(ramp(t, L.fin, 1)), r, 0.12 * Math.sin(d * 2)); return; }
  obj.rotation.set(0, r, 0);
}
// 棱块一个接一个往外弹一下（「12 个棱块全翻过来」）
const hh = (i) => { let x = (i + 11) * 2654435761; x ^= x >>> 13; x = Math.imul(x, 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const AXES = Array.from({ length: 26 }, (_, i) => new THREE.Vector3(hh(i) - 0.5, hh(i + 30) - 0.5, hh(i + 60) - 0.5).normalize());
export function post(t) {
  if (t >= L.burst6 && t < L.slam + 0.05) {
    // 炸开的小块各自翻滚
    const e = explodeAt(t) / 1.35;
    return (c, i) => c.rotateOnAxis(AXES[i], 7 * e * (0.6 + hh(i + 90)));
  }
  if (t < L.wave || t > L.wave + 2.4) return null;
  return (c) => {
    if (c.userData.kind !== 2) return;
    const k = pulse(t, L.wave + ((c.userData.home.x + 1) * 3 + (c.userData.home.y + 1) + (c.userData.home.z + 1) * 0.5) * 0.09, 0.55);
    c.position.addScaledVector(c.userData.home.clone().normalize(), 0.45 * k);
  };
}

// ---------- HUD ----------
const NUM = "43,252,003,274,489,856,000".split(",");
export function buildHud() {
  const H = {};
  H.num = el(NUM.map((g, i) => `<span>${g}${i < NUM.length - 1 ? "," : ""}</span>`).join(""), "num", "hud", "left:0;right:0;text-align:center;top:96px");
  H.groups = [...H.num.querySelectorAll("span")];
  H.kinds = el("种样子", "sub", "hud", "left:0;right:0;text-align:center;top:212px;font-size:48px;color:#EAF6FF");
  H.x0 = 640; H.x1 = 1860; H.y = 640;
  H.beam = el("", "beam", "hud", `left:${H.x0}px;top:${H.y}px;width:${H.x1 - H.x0}px;transform-origin:0 50%`);
  H.seg = el("", "seg", "hud", `left:${H.x0}px;top:${H.y - 12}px;width:${Math.max(12, (H.x1 - H.x0) / 99)}px`);
  H.uni = el(`宇宙年龄<br><span class="mono" style="color:#FFD21A">138 亿年</span>`, "sub", "hud", `left:${H.x0 - 10}px;top:${H.y + 50}px;line-height:1.3;color:#EAF6FF`);
  H.times = el(`≈ 宇宙年龄的 100 倍`, "lbl", "hud", `right:70px;top:${H.y + 46}px;font-size:58px;letter-spacing:.06em`);
  H.n20 = el("", "big20", "hud", "transform-origin:0 100%");
  H.godL = el("上帝之数", "lbl", "hud", "left:150px;top:760px");
  H.godS = el("超级翻转 · 12 个棱块全翻面，最少要 20 步", "sub", "hud", "left:154px;top:870px");
  H.y10 = el("2010", "holo", "hud", "left:90px;top:300px");
  H.y10s = el("约 35 个 CPU 年<br>算遍所有情况", "holo2", "hud", "left:110px;top:620px;line-height:1.6");
  H.timer = el("", "day", "hud", "left:130px;top:150px;font-size:110px");
  H.tlab = el("", "holo2", "hud", "left:136px;top:290px;letter-spacing:.2em");
  H.finBg = el("", "finbg", "hud");
  H.fin = el(`<b>魔方</b><i>—— 上帝的玩具</i>`, "ttl fin", "hud");
  H.whiteEnd = el("", "flash", "hud", "background:#EAFBFF");
  H.black = el("", "flash", "hud", "background:#000");
  return H;
}

export function hud(t, H, sch) {
  // S3：数字逐组跳出 → 宇宙年龄的一小段 → 光一路拉长
  const o3 = ease(ramp(t, L.digits - 0.1, 0.3)) * (1 - ease(ramp(t, L.s3out, 0.4)));
  show(H.num, o3);
  H.groups.forEach((g, i) => { const k = ramp(t, L.digits + i * 0.25, 0.2); g.style.opacity = ease(k).toFixed(3); });
  show(H.kinds, ease(ramp(t, L.digits + 1.9, 0.3)) * (1 - ease(ramp(t, L.s3out, 0.4))));
  const ob = (1 - ease(ramp(t, L.s3out, 0.4)));
  show(H.seg, ease(ramp(t, L.seg, 0.3)) * ob);
  show(H.uni, ease(ramp(t, L.seg + 0.2, 0.3)) * ob);
  const kb = easeInOut(ramp(t, L.beam, L.beamEnd - L.beam));
  show(H.beam, (kb > 0 ? 1 : 0) * ob, `scaleX(${Math.max(0.01, kb).toFixed(4)})`);
  show(H.times, ease(ramp(t, L.beamEnd, 0.4)) * ob, `translateY(${(14 * (1 - easeOut(ramp(t, L.beamEnd, 0.4)))).toFixed(1)}px)`);
  // S4：计数器 1→20，然后变成全片最大的「20」
  const n = sfCount(t, sch);
  const on = ease(ramp(t, L.sf - 0.2, 0.3)) * (1 - ease(ramp(t, L.y2010 - 0.4, 0.4)));
  show(H.n20, on, `translate(120px, 170px) scale(${lerp(0.55, 1, easeOutBack(ramp(t, L.big, 0.6), 1.3)).toFixed(4)})`);
  if (on > 0) H.n20.textContent = String(Math.max(1, n));
  H.n20.style.left = "0"; H.n20.style.top = "0";
  show(H.godL, ease(ramp(t, L.big + 0.3, 0.4)) * (1 - ease(ramp(t, L.y2010 - 0.4, 0.4))));
  show(H.godS, ease(ramp(t, L.wave - 0.2, 0.4)) * (1 - ease(ramp(t, L.y2010 - 0.4, 0.4))));
  const oy = ease(ramp(t, L.y2010, 0.6)) * (1 - ease(ramp(t, L.s5 - 0.3, 0.4)));
  show(H.y10, oy); show(H.y10s, ease(ramp(t, L.y2010 + 0.4, 0.5)) * (1 - ease(ramp(t, L.s5 - 0.3, 0.4))));
  // S5：计时器
  let tm = "", tl = "", ot = 0;
  if (t >= L.hSolve - 0.3 && t < L.rScr - 0.1) { ot = 1; tm = Math.min(HUMAN, Math.max(0, t - L.hSolve)).toFixed(2); tl = "人类纪录"; }
  else if (t >= L.rSolve - 0.3 && t < L.replay) { ot = 1; tm = Math.min(ROBOT, Math.max(0, t - L.rSolve)).toFixed(3); tl = "机器纪录"; }
  else if (t >= L.replay && t < 72.4) { ot = 1; tm = Math.min(ROBOT, Math.max(0, (t - L.replay - 0.07) / 5)).toFixed(3); tl = "慢放 5 倍"; }
  show(H.timer, ot); show(H.tlab, ot);
  if (ot) { H.timer.textContent = tm + " s"; H.tlab.textContent = tl; }
  // S6：标题砸下来（放大 → 落定，带一点色差），后两拍各亮一下；最后一拍白闪，直接切黑
  const ks = ramp(t, L.title6 - 0.06, 0.3);
  const glow = 1 + 1.2 * Math.max(pulse(t, L.title6, 0.5), pulse(t, L.pulse6[0], 0.45), pulse(t, L.pulse6[1], 0.45));
  show(H.finBg, ease(ks));
  show(H.fin, t >= L.title6 - 0.06 ? 1 : 0, `scale(${lerp(1.9, 1, easeOut(ks)).toFixed(4)})`);
  const sp = (1 - easeOut(ks)) * 18;
  H.fin.style.filter = `drop-shadow(${sp.toFixed(1)}px 0 rgba(56,232,255,.85)) drop-shadow(${(-sp).toFixed(1)}px 0 rgba(122,92,255,.7)) brightness(${glow.toFixed(3)})`;
  show(H.whiteEnd, ease(ramp(t, L.flashEnd - 0.12, 0.12)));
  show(H.black, t >= L.flashEnd + 0.06 ? 1 : 0);
}
