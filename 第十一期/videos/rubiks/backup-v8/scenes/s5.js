// S4（v3）守恒量 · 金库：拆开随手装回去，还拼得好吗？三次演示，每次都是「拔出来 → 动一下 → 塞回去 → 金库灯变红：拼不回去」，
// 然后撤回复原。① 拧歪一个角块（1/3）② 翻转一个棱块（1/2）③ 对调两个棱块（1/2）→ 1/3 × 1/2 × 1/2 = 1/12，停住
import { K, ramp, ease, easeIn, easeOut, easeInOut, lerp, clamp, pulse, el, show, orbit, slam } from "./util.js";
import { whipIn, whipOut } from "./s1.js";

export default function S5({ THREE, Wd, cube }) {
  const T = { t0: K(82), shake: K(83), d1: K(85), d2: K(90.5), d3: K(96), frac: K(101.5), t1: K(106) };
  const D = [T.d1, T.d2, T.d3];
  const C = [0, 2.3, 0], TG = [2.4, 2.4, 0];
  const V = (x, y, z) => new THREE.Vector3(x, y, z), Y = V(0, 1, 0);
  const at = (x, y, z) => cube.cubies.findIndex((c) => c.userData.home.equals(V(x, y, z)));
  const corner = at(1, 1, 1), edge = at(0, 1, 1), swA = at(1, 1, 0), swB = at(0, 1, 1);
  const DIAG = V(1, 1, 1).normalize(), NE = V(0, 1, 1).normalize(), NA = V(1, 1, 0).normalize();
  // 每次演示的节奏（相对 d）：0.15 拔出 → 0.55 动 → 1.25 塞回 → 1.7 变红 → 3.4 再拔出来撤回 → 4.0 复原
  const RED = D.map((d) => d + 1.7);
  const out1 = (t, d) => Math.max(easeOut(ramp(t, d + 0.15, 0.35)) * (1 - easeIn(ramp(t, d + 1.25, 0.3))), Math.sin(Math.PI * ramp(t, d + 3.1, 0.6)));
  const act = (t, d) => ease(ramp(t, d + 0.55, 0.55)) * (1 - ease(ramp(t, d + 3.25, 0.35)));
  const qa = new THREE.Quaternion();

  const rule = el(`上帝的规矩 <b>1</b><small>不能乱装</small>`, "rule", "hud", "left:120px;top:78px");
  const head = el("随手装回去，装对的机会", "mhead", "hud");
  const rows = [["拧歪 1 个角块", "1/3"], ["翻转 1 个棱块", "1/2"], ["对调 2 个棱块", "1/2"]];
  const panel = el(rows.map(([a, c]) => `<div class="mt"><span class="mtA">${a}</span><span class="mtB">拼不回去</span><span class="mtC">${c}</span></div>`).join(""), "meters m3", "hud");
  const mts = [...panel.querySelectorAll(".mt")];
  const frac = el(`<span>1/3</span> × <span>1/2</span> × <span>1/2</span>`, "frac", "hud", "left:auto;right:100px;top:200px;font-size:84px;transform-origin:100% 50%");
  const fracB = el(`= <b>1/12</b>`, "frac", "hud", "left:auto;right:100px;top:330px;font-size:230px;transform-origin:100% 50%");
  const frac2 = el(`随手装回去<br>12 次里只有 1 次能拼好`, "concl", "hud", "right:100px;top:640px;text-align:right;line-height:1.35");
  const red = el("", "flash", "hud", "background:radial-gradient(closest-side, rgba(232,40,58,0) 45%, rgba(232,40,58,.55) 100%)");
  const redK = (t) => Math.max(...RED.map((r) => pulse(t, r - 0.05, 0.9)));
  return {
    t0: T.t0, t1: T.t1, T, env: "vault",
    cam(t) {
      const w = whipIn(t, T.t0), wo = whipOut(t, T.t1);
      const a = 0.42 - 0.012 * (t - T.t0) + w.off + wo.off;
      return { pos: orbit(TG, a, 12.2, 3.1), tgt: TG, fov: 32, blur: w.blur + wo.blur };
    },
    cube(t) {
      // 先「拆开」一下：小块往外散开再收回（表示拆了装回去）
      const e = 0.9 * Math.sin(Math.PI * ramp(t, T.shake, 1.6));
      return {
        pos: C, rot: [0, -0.32 + 0.01 * (t - T.t0), 0], explode: e, spread: 1.0, core: 0,
        post: (c, i) => {
          if (t >= T.d1 && t < T.d2 && i === corner) {
            c.position.addScaledVector(DIAG, 1.1 * out1(t, T.d1));
            c.quaternion.premultiply(qa.setFromAxisAngle(DIAG, ((Math.PI * 2) / 3) * act(t, T.d1)));
          }
          if (t >= T.d2 && t < T.d3 && i === edge) {
            c.position.addScaledVector(NE, 1.1 * out1(t, T.d2));
            c.quaternion.premultiply(qa.setFromAxisAngle(NE, Math.PI * act(t, T.d2)));
          }
          if (t >= T.d3 && t < T.frac && (i === swA || i === swB)) {
            const s = i === swA ? -1 : 1, n = i === swA ? NA : NE, k = act(t, T.d3), o = out1(t, T.d3);
            c.position.addScaledVector(n, 1.0 * o).addScaledVector(Y, 0.5 * o);
            c.position.applyAxisAngle(Y, s * (Math.PI / 2) * k);
            c.quaternion.premultiply(qa.setFromAxisAngle(Y, s * (Math.PI / 2) * k));
          }
        },
      };
    },
    world(t, active) {
      if (!active) return;
      const r = redK(t);
      Wd.lights.rimV.intensity += 5 * r; Wd.lights.key.color.lerp(new THREE.Color(0xff6060), 0.5 * r);
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      show(rule, on * ease(ramp(t, T.t0 + 0.5, 0.5)) * (1 - ease(ramp(t, T.frac - 0.4, 0.3))));
      const op = on * ease(ramp(t, T.d1 + 1.6, 0.4)) * (1 - ease(ramp(t, T.frac - 0.3, 0.3)));
      show(head, op); show(panel, op);
      mts.forEach((m, i) => {
        const k = ramp(t, RED[i] - 0.1, 0.35);
        m.style.opacity = ease(k).toFixed(3);
        m.style.transform = `translateX(${(40 * (1 - easeOut(k))).toFixed(1)}px)`;
        m.classList.toggle("bad", t >= RED[i] - 0.1 && t < RED[i] + 1.4);
      });
      slam(frac, t, T.frac, T.t1 - 0.15); slam(fracB, t, T.frac + 0.5, T.t1 - 0.15, 1.8);
      show(frac2, on * ease(ramp(t, T.frac + 0.9, 0.4)) * (1 - ease(ramp(t, T.t1 - 0.4, 0.25))));
      if (!active) { show(frac, 0); show(fracB, 0); }
      show(red, on * 0.9 * redK(t));
    },
  };
}
