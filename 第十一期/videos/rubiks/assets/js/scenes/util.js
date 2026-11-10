// 各段共用的小工具：镜头（环绕、甩镜、推拉变焦）、HUD 元素、字的进场。全部是 t 的纯函数。
import * as THREE from "three";
import { ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, clamp, lerp, pulse, el, show, track } from "../lib.js";
export { ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, clamp, lerp, pulse, el, show, track };
export const K = (k) => window.K(k);
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

/** 绕 tgt 的环绕机位：方位角 az（弧度，0 = 正前方 +z）、距离 r、高度 h */
export const orbit = (tgt, az, r, h) => [tgt[0] + Math.sin(az) * r, tgt[1] + h, tgt[2] + Math.cos(az) * r];
export const azOf = (pos, tgt) => Math.atan2(pos[0] - tgt[0], pos[2] - tgt[2]);

/**
 * 甩镜：t0 起 d 秒内，镜头绕目标点猛地转 angle（弧度），中段最快。
 * 返回 { off: 当前已转的角度, blur: 横向动态模糊像素 }。
 */
export function whip(t, t0, d, angle) {
  const k = ramp(t, t0, d), e = easeInOut(k);
  const v = k > 0 && k < 1 ? Math.abs(angle) * (k < 0.5 ? 12 * k * k : 12 * (1 - k) * (1 - k)) / d : 0; // easeInOut 的导数
  return { off: angle * e, blur: Math.min(60, v * 9) };
}
/** 推拉变焦（希区柯克）：主体大小不变，背景透视猛地变化。返回 { dist, fov } */
export function dolly(k, d0, d1, fov0) {
  const h = 2 * d0 * Math.tan((fov0 * Math.PI) / 360);
  const d = lerp(d0, d1, k);
  return { dist: d, fov: (2 * Math.atan(h / (2 * d)) * 180) / Math.PI };
}

/** 一段字逐字进场（带一点色差），出场淡出 */
export function textIn(e, t, t0, t1, dur = 0.3) {
  const k = ramp(t, t0, dur), o = ease(k) * (1 - ease(ramp(t, t1 - 0.25, 0.25)));
  show(e, o, `translateY(${(18 * (1 - easeOut(k))).toFixed(1)}px)`);
  const sp = (1 - easeOut(k)) * 10;
  e.style.textShadow = sp > 0.3 ? `${sp.toFixed(1)}px 0 rgba(56,232,255,.8), ${(-sp).toFixed(1)}px 0 rgba(122,92,255,.6)` : "";
  return o;
}
/** 大数字 / 大字「砸下来」：从 1.6 倍缩到 1 */
export function slam(e, t, t0, t1, from = 1.6) {
  const k = ramp(t, t0, 0.28), o = clamp(k * 3) * (1 - ease(ramp(t, t1 - 0.25, 0.25)));
  show(e, o, `scale(${lerp(from, 1, easeOut(k)).toFixed(4)})`);
  return o;
}
export const hash = (i) => { let x = (i + 7) * 2654435761; x ^= x >>> 13; x = Math.imul(x, 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
