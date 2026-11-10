// 环境层：真实场所的底图（赛道发车格、P 房；沥青近景待生成），由时间轴做缓推、虚化、压暗（AGENTS.md 4.3：底图只作静帧）。
// 发车灯画在赛道照片自带的灯架上，跟着照片一起推。全是 t 的纯函数。
import { clamp, mix, ease } from "./lib.js";
import { LIGHTS, OUT, CUTS, STALL_HITS } from "./timeline.js";
import { DUR } from "./beats.js";

const box = document.getElementById("env");
const plate = (id) => { const w = document.createElement("div"); w.className = "plate"; w.append(document.getElementById(id)); box.append(w); return w; };
const P = { track: plate("bg-track"), garage: plate("bg-garage"), asphalt: plate("bg-asphalt") };
// P 房底图自带深蓝压暗层（随 P 房一起淡入淡出）
P.garage.append(Object.assign(document.createElement("div"), { className: "tint" }));

// ── 发车灯：照片里灯架的五列，取中、下两排（坐标按 1920×1080 量出，样张 C） ──
const LX = [931, 975, 1020, 1064, 1108], LY = [239, 268];
export const GANTRY = [1020, 254];
const lamps = LX.map((x) => LY.map((y) => { const d = document.createElement("div"); d.className = "lamp"; d.style.left = x + "px"; d.style.top = y + "px"; P.track.append(d); return d; }));
const halo = Object.assign(document.createElement("div"), { className: "halo" }); P.track.append(halo);
/** 第 i 盏灯此刻的亮度：亮起时一冲，熄灭一刀切 */
export const lampOn = (i, t) => (t >= LIGHTS[i] && t < OUT ? 1 : 0);

// ── 关键帧：[秒, { o 不透明, s 缩放, ox/oy 缩放原点（%）, ty 下移 px, blur 虚化 px, br 亮度 }]；同一秒给两帧＝硬切 ──
// 场景表见 03-分镜脚本 SCENES：S1 赛道 → S2 P 房 → S3 剖面沥青／俯视 P 房 → S4 沥青 → 车头 P 房 → S5、S6 P 房 → S7、S8 赛道
const K = {
  track: [[0, { o: 1, s: 1.0, ox: 53, oy: 23, ty: 0, blur: 0, br: 1 }], [OUT, { s: 1.15 }], [OUT + .5, { blur: 0, br: 1 }], [OUT + 1.3, { blur: 7, br: .42 }],
    [17.4, { o: 1, s: 1.17 }], [18.4, { o: 0, s: 1.18 }],
    [155, { o: 0, s: 1.04, ox: 53, oy: 30, blur: 12, br: .36 }], [155, { o: 1 }], [175, { s: 1.08, blur: 12, br: .36 }], [178.6, { s: 1.12, blur: 0, br: .8 }], [DUR, { s: 1.13 }]],
  garage: [[0, { o: 0, s: 1.08, ox: 50, oy: 45, ty: 0, blur: 16, br: .55 }], [17.4, { o: 0 }], [18.4, { o: 1 }], [CUTS.s3a, { o: 1, s: 1.12 }], [CUTS.s3a, { o: 0 }],
    [CUTS.s3b, { o: 0, s: 1.1 }], [CUTS.s3b, { o: 1 }], [CUTS.s4a, { o: 1, s: 1.14 }], [CUTS.s4a, { o: 0 }], [CUTS.s4b, { o: 0, s: 1.1 }], [CUTS.s4b, { o: 1 }],
    [125, { s: 1.15 }], [155, { o: 1, s: 1.1 }], [155, { o: 0 }]],
  asphalt: [[0, { o: 0, s: 1.06, ox: 50, oy: 50, ty: -150, blur: 1.5, br: .8 }], [CUTS.s3a, { o: 0 }], [CUTS.s3a, { o: 1 }], [CUTS.s3b, { o: 1 }], [CUTS.s3b, { o: 0 }],
    [CUTS.s4a, { o: 0 }], [CUTS.s4a, { o: 1 }], [CUTS.s4b, { o: 1 }], [CUTS.s4b, { o: 0 }]],
};
function at(keys, t) {
  const v = { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) {
    const [b, vb] = keys[i], [a] = keys[i - 1];
    for (const k in vb) { const prev = valAt(keys, i - 1, k); v[k] = t <= a ? prev : t >= b ? vb[k] : mix(prev, vb[k], ease((t - a) / (b - a))); }
    if (t < b) break;
  }
  return v;
}
/** 第 i 帧之前（含）最近一次给出的 k 值 */
function valAt(keys, i, k) { for (let j = i; j >= 0; j--) if (k in keys[j][1]) return keys[j][1][k]; return 0; }

const show = (e, o) => { e.style.opacity = o.toFixed(3); e.style.visibility = o > .002 ? "visible" : "hidden"; };
/** 海豚跳失速时沥青底图跟着一震（S4） */
const jolt = (t) => { let y = 0; for (const h of STALL_HITS) { const u = t - h; if (u > 0 && u < .6) y += Math.sin(u * 60) * 10 * Math.exp(-u * 8); } return [0, y]; };
/** 熄灭那一下的震动（像素），供其它层共用 */
export const shake = (t) => { const u = t - OUT; return u < 0 || u > .5 ? [0, 0] : [Math.sin(u * 90) * 9 * Math.exp(-u * 9), Math.cos(u * 70) * 6 * Math.exp(-u * 9)]; };

export function envState(t) {
  const [sx, sy] = shake(t);
  for (const name of ["track", "garage", "asphalt"]) {
    const v = at(K[name], t), e = P[name]; show(e, v.o); if (v.o <= .002) continue;
    e.style.transformOrigin = `${v.ox}% ${v.oy}%`;
    const [jx, jy] = name === "asphalt" ? jolt(t) : [0, 0];
    e.style.transform = `translate(${(sx + jx).toFixed(1)}px,${(sy + v.ty + jy).toFixed(1)}px) scale(${v.s.toFixed(4)})`;
    e.style.filter = `blur(${v.blur.toFixed(2)}px) brightness(${v.br.toFixed(3)})`;
  }
  // 灯：亮起时 0.12 秒冲到最亮
  let n = 0;
  lamps.forEach((col, i) => { const on = lampOn(i, t), k = on ? clamp((t - LIGHTS[i]) / .12) : 0; n += k; for (const d of col) show(d, k); });
  show(halo, n / 5 * .9);
}
/** 赛道照片上一个点（1920 坐标）此刻在屏幕上的位置：给标注用 */
export function trackPoint([x, y], t) {
  const v = at(K.track, t), [sx, sy] = shake(t), ox = 1920 * v.ox / 100, oy = 1080 * v.oy / 100;
  return [ox + (x - ox) * v.s + sx, oy + (y - oy) * v.s + sy];
}
