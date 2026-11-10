// S0 开场：暗场 → 手张开 → 光炸开 → 26 块飞进掌心合拢 → 标题 → 魔方转正、冲向镜头，绿色中心块铺满全屏（钻进贴纸）
import { K, V, ramp, ease, easeIn, easeOut, easeInOut, lerp, pulse, el, show, hash } from "./util.js";

export default function S0({ THREE, cube, hand }) {
  const T = { open: 1.6, burst: K(0), assemble: K(1), title: K(1.5), turn: K(3.4), dive: K(4.1), cut: K(5) };
  const flash = el("", "flash", "hud"), ring = el("", "ring", "hud");
  const ttl = el(`<b>${[..."魔方"].map((c) => `<span>${c}</span>`).join("")}</b><i>${[..."—— 上帝的玩具"].map((c) => `<span>${c}</span>`).join("")}</i>`, "ttl", "hud");
  const chars = [...ttl.querySelectorAll("span")];
  const plate = el("", "flash", "hud", "background:#1ec466");
  const FLY = cube.cubies.map((c, i) => ({
    d: c.userData.home.clone().add(V(hash(i) - 0.5, hash(i + 40) - 0.5, hash(i + 80) - 0.5).multiplyScalar(1.4)).normalize(),
    delay: hash(i + 120) * 0.22, spin: (hash(i + 160) - 0.5) * 8,
  }));
  const ry = (t) => -0.72 + 1.1 * Math.max(0, t - T.burst);
  const ryFace = Math.round(ry(T.turn) / (Math.PI * 2)) * Math.PI * 2 + Math.PI * 2; // 转正：绿面朝镜头

  return {
    t0: 0, t1: T.cut, T,
    cam: () => ({ transparent: true, pos: [0, 0, 10], tgt: [0, 0, 0], fov: 32 }),
    cube(t) {
      const kt = easeInOut(ramp(t, T.turn, T.dive - T.turn + 0.3)), kd = easeIn(ramp(t, T.dive, T.cut - T.dive));
      return {
        pos: [lerp(-0.064, 0, kt), lerp(0.637, 0, kt), lerp(0, 7.45, kd)],
        rot: [lerp(0.52, 0, kt), lerp(ry(t), ryFace, kt), lerp(0.06, 0, kt)],
        scale: lerp(0.4, 1, kd),
        glow: lerp(0.9, 0.55, ease(ramp(t, T.assemble, 1))),
        post: (c, i) => {
          if (t < T.burst) { c.visible = false; return; }
          const f = FLY[i], k = easeOut(ramp(t, T.burst + f.delay, T.assemble - T.burst - 0.05));
          c.position.addScaledVector(f.d, 11 * (1 - k));
          if (k < 1) c.rotateOnAxis(f.d, f.spin * (1 - k));
        },
      };
    },
    hud(t) {
      const bri = t < T.open ? 0.42 : t < T.burst ? lerp(0.42, 0.75, ease(ramp(t, T.open, T.burst - T.open))) : lerp(0.75, 1.08, easeOut(ramp(t, T.burst, 0.8)));
      hand.style.filter = `brightness(${bri.toFixed(3)}) contrast(1.06) saturate(${(0.85 + 0.2 * ease(ramp(t, T.burst, 0.8))).toFixed(3)})`;
      hand.style.opacity = t < T.cut ? "1" : "0";
      const pf = pulse(t, T.burst - 0.05, 0.9);
      show(flash, pf);
      flash.style.background = `radial-gradient(circle at 948px 380px, rgba(255,255,255,${(0.95 * pf).toFixed(3)}) 0, rgba(200,245,255,.35) 160px, rgba(0,0,0,0) 620px)`;
      const kr = ramp(t, T.burst, 0.9);
      show(ring, (1 - kr) * (kr > 0 ? 1 : 0), `translate(948px, 400px) scale(${lerp(0.3, 5.5, easeOut(kr)).toFixed(3)})`);
      chars.forEach((s, i) => {
        const k = ramp(t, T.title + i * 0.07, 0.35), o = ease(k) * (1 - ease(ramp(t, T.turn, 0.35)));
        s.style.opacity = o.toFixed(3);
        const sp = (1 - easeOut(k)) * 10;
        s.style.transform = `translateX(${(18 * (1 - easeOut(k))).toFixed(1)}px)`;
        s.style.textShadow = sp > 0.3 ? `${sp.toFixed(1)}px 0 rgba(56,232,255,.8), ${(-sp).toFixed(1)}px 0 rgba(122,92,255,.7)` : "";
      });
      show(ttl, t >= T.title && t < T.turn + 0.4 ? 1 : 0);
      // 绿色铺满全屏 → 下一段从同一块绿里拉出来
      show(plate, ease(ramp(t, T.cut - 0.12, 0.12)) * (1 - ease(ramp(t, T.cut + 0.08, 0.3))));
    },
  };
}
