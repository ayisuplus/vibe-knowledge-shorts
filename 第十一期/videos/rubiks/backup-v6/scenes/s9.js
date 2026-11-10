// S9 高潮收尾（不回落）：越转越快 → 炸开、小块翻滚、镜头绕一圈多 → 合拢 + 白闪 → 标题砸下来 → 两拍各亮一下 → 最后一拍白闪，直接切黑
import { schedule, invert } from "../cube.js";
import { SUPERFLIP } from "./s7.js";
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, clamp, pulse, el, show, hash, whip } from "./util.js";

export default function S9({ THREE, Wd, cube }) {
  const T = { t0: K(210), burst: K(211), slam: K(214), title: K(215), p1: K(216.5), p2: K(218), flashEnd: 161.7, end: 162.0 }; // v7：配乐插了 32 拍
  const AX = Array.from({ length: 26 }, (_, i) => new THREE.Vector3(hash(i) - 0.5, hash(i + 30) - 0.5, hash(i + 60) - 0.5).normalize());
  const ex = (t) => 1.35 * easeOut(ramp(t, T.burst, 0.45)) * (1 - easeIn(ramp(t, T.slam - 0.25, 0.25)));
  const finBg = el("", "finbg", "hud"), fin = el(`<b>魔方</b><i>—— 上帝的玩具</i>`, "ttl fin", "hud");
  const white = el("", "flash", "hud", "background:#EAFBFF"), black = el("", "flash", "hud", "background:#000");
  const slamFlash = el("", "flash", "hud", "background:rgba(220,250,255,1)");
  const moves = []; // v3：哲理段已经把超级翻转拼回去了，收尾时魔方本来就是复原的
  return {
    t0: T.t0, t1: T.end, T, moves, env: "stage",
    cam(t) {
      const wi = whip(t, T.t0 - 0.25, 0.5, 1.9);
      const az = Math.atan2(-3.0, 8.0) + (wi.off - 1.9) + Math.PI * 2 * 1.2 * easeInOut(ramp(t, T.t0 + 0.1, T.title - T.t0 - 0.1)) + 0.12 * Math.max(0, t - T.title);
      const r = lerp(8.5, 10.2, ease(ramp(t, T.burst, 0.8))) - 0.6 * easeInOut(ramp(t, T.slam - 0.3, 1.4)) + 0.9 * ease(ramp(t, T.title - 0.4, 0.8)) - 0.7 * ease(ramp(t, T.title + 0.4, 1.8));
      const h = lerp(3.2, 4.6, ease(ramp(t, T.burst, 0.8))) - 0.9 * easeInOut(ramp(t, T.slam - 0.3, 1.4));
      const bloom = 0.55 + 0.28 * ease(ramp(t, T.burst, 0.4)) * (1 - ease(ramp(t, T.slam + 0.3, 0.8))) + 0.35 * Math.max(pulse(t, T.slam - 0.05, 0.6), pulse(t, T.title - 0.05, 0.6), pulse(t, T.p1, 0.5), pulse(t, T.p2, 0.5));
      return { pos: [Math.sin(az) * r, 2.7 + h, Math.cos(az) * r], tgt: [0, 2.7, 0], fov: 32, blur: wi.blur, bloom };
    },
    cube(t) {
      const d = t - T.t0, e = ex(t);
      const ry = 0.3 + Math.min(0.9 * d * d, 4.5 + 3.2 * Math.max(0, d - 2.2));
      return {
        pos: [0, 2.7, 0], rot: [0.25 * ease(ramp(t, T.t0, 1)), ry, 0.12 * Math.sin(d * 2)], explode: e, spread: 0.95,
        post: e > 0 ? (c, i) => c.rotateOnAxis(AX[i], 7 * (e / 1.35) * (0.6 + hash(i + 90))) : null,
      };
    },
    hud(t) {
      const ks = ramp(t, T.title - 0.06, 0.3);
      const glow = 1 + 1.2 * Math.max(pulse(t, T.title, 0.5), pulse(t, T.p1, 0.45), pulse(t, T.p2, 0.45));
      show(finBg, ease(ks));
      show(fin, t >= T.title - 0.06 ? 1 : 0, `scale(${lerp(1.9, 1, easeOut(ks)).toFixed(4)})`);
      const sp = (1 - easeOut(ks)) * 18;
      fin.style.filter = `drop-shadow(${sp.toFixed(1)}px 0 rgba(56,232,255,.85)) drop-shadow(${(-sp).toFixed(1)}px 0 rgba(122,92,255,.7)) brightness(${glow.toFixed(3)})`;
      show(slamFlash, 0.85 * 0.9 * pulse(t, T.slam - 0.08, 0.5));
      show(white, ease(ramp(t, T.flashEnd - 0.12, 0.12)));
      show(black, t >= T.flashEnd + 0.06 ? 1 : 0);
    },
  };
}
