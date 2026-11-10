// S0 开场（v14）：暗场 → 全息数据手闪烁着亮起来 → 配乐落拍那一下打响指（holo-snap.mp4，源 1.875 秒的响指对在 K(0)）
// → 响指处光炸开 → 26 块飞到响指的位置合拢 → 标题 → 魔方转正、冲向镜头，绿色中心块铺满全屏（钻进贴纸）
import { K, V, ramp, ease, easeIn, easeOut, easeInOut, lerp, pulse, el, show, hash } from "./util.js";

export default function S0({ THREE, cube, hand }) {
  const T = { open: 1.6, burst: K(0), assemble: K(1), title: K(1.5), turn: K(3.4), dive: K(4.1), cut: K(5) };
  const flash = el("", "flash", "hud"), ring = el("", "ring", "hud");
  const ttl = el(`<b>${[..."魔方"].map((c) => `<span>${c}</span>`).join("")}</b><i>${[..."—— 上帝的玩具"].map((c) => `<span>${c}</span>`).join("")}</i>`, "ttl", "hud", "left:130px;top:380px"); // v14：手在右边，标题放左边空处
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
        pos: [lerp(-0.11, 0, kt), lerp(1.15, 0, kt), lerp(0, 7.45, kd)],
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
      // 全息手开机：先全黑，然后像信号接通一样闪几下亮起来（按 t 取值，可跳帧）；响指以后再亮一点
      const boot = t < 0.5 ? 0 : t < 1.7 ? (hash(Math.floor(t * 18)) < ramp(t, 0.5, 1.2) ? 0.35 + 0.65 * ramp(t, 0.5, 1.2) : 0.08) : 1;
      const bri = lerp(0.85, 1.12, easeOut(ramp(t, T.burst, 0.6)));
      hand.style.filter = `brightness(${bri.toFixed(3)}) saturate(1.1)`;
      hand.style.opacity = t < T.cut ? boot.toFixed(3) : "0";
      const pf = pulse(t, T.burst - 0.05, 0.9);
      show(flash, pf);
      flash.style.background = `radial-gradient(circle at 940px 300px, rgba(255,255,255,${(0.95 * pf).toFixed(3)}) 0, rgba(200,245,255,.35) 160px, rgba(0,0,0,0) 620px)`;
      const kr = ramp(t, T.burst, 0.9);
      show(ring, (1 - kr) * (kr > 0 ? 1 : 0), `translate(940px, 300px) scale(${lerp(0.3, 5.5, easeOut(kr)).toFixed(3)})`);
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
