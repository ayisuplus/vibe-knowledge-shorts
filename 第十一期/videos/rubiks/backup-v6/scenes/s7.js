// S7（v3）上帝之数 · 天光大厅：甩镜进 → 魔方被飞快打乱成「超级翻转」（12 个棱块全翻面，最难拼的状态之一）
// → 一步一步拼回去，计数器 1…19 → 配乐抽空：停在 19，希区柯克变焦 → 配乐回来那一下第 20 步拧完、魔方复原，「20」砸下来
// → 「最多 20 步」→「上帝之数」→「2010 · 约 35 个 CPU 年」→ 甩镜出（进哲理）
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit, dolly, slam } from "./util.js";
import { schedule, invert, parse } from "../cube.js";
import { whipIn, whipOut } from "./s1.js";

export const SUPERFLIP = "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2";
export default function S7({ THREE, Wd, cube }) {
  const T = { t0: K(118), scr: K(119.4), label: K(122.9), solve: K(125.4), vert: K(133.8), big: 101.62, l1: K(136.8), l2: K(144), l3: K(150), t1: K(161.5) };
  // 拼回去：前 19 步均匀排到配乐抽空之前；第 20 步正好在配乐回来那一下拧完
  const SOLVE = parse(invert(SUPERFLIP)), n19 = 19, slot = (T.vert - 0.15 - T.solve) / n19;
  const solve = SOLVE.map((m, i) => (i < n19 ? { ...m, t0: T.solve + i * slot, d: slot * 0.82 * (Math.abs(m.q) === 2 ? 1 : 0.85) } : { ...m, t0: T.big - 0.3, d: 0.3 }));
  const moves = [...schedule(SUPERFLIP, T.scr, 0.11, 0.04), ...solve];
  const C = [2.6, 2.2, 0], TG = [-0.9, 2.2, 0];
  const ctr = el("", "big20", "hud", "transform-origin:0 100%;left:0;top:0");
  const sfL = el(`超级翻转<small>12 个棱块全部翻面 · 最难拼的状态之一</small>`, "pn", "hud", "left:120px;top:160px");
  const stepL = el("步", "lbl", "hud", "left:560px;top:460px");
  const most = el(`只要找对路，最多 20 步就能拼回去`, "concl c20", "hud", "left:124px;top:700px");
  const godL = el("上帝之数", "lbl god", "hud", "left:124px;top:690px");
  const proof = el(`2010 年 · 电脑算了约 35 个 CPU 年才证明`, "holo2", "hud", "left:130px;top:830px;letter-spacing:.06em");
  const flash = el("", "flash", "hud", "background:rgba(240,250,255,1)");
  const doneN = (t) => { let n = 0; for (const m of solve) if (t >= m.t0 + m.d) n++; return n; };
  return {
    t0: T.t0, t1: T.t1, T, moves, env: "skylight",
    cam(t) {
      const w = t < T.t0 + 1 ? whipIn(t, T.t0) : whipOut(t, T.t1);
      // 变焦：抽空的那几秒里镜头往前推、焦距同时拉宽（主体大小不变，背景猛地拉开）；回来那一下弹回
      const kv = easeInOut(ramp(t, T.vert, T.big - T.vert)) * (1 - easeOutBack(ramp(t, T.big, 0.5), 1.2));
      const dz = dolly(kv, 13.2, 5.6, 32);
      const a = -0.05 + 0.01 * (t - T.t0) + w.off;
      const tg = TG.map((v, i) => lerp(v, C[i], kv));
      return { pos: orbit(tg, a, dz.dist, lerp(1.4, 0.5, kv)), tgt: tg, fov: dz.fov, blur: w.blur, bloom: 0.6 + 0.5 * pulse(t, T.big - 0.05, 0.8), bgPan: 0.36, bgTilt: 0.03 };
    },
    cube(t) {
      return {
        pos: C, rot: [0.12, -0.55 + 0.025 * (t - T.t0), 0], glow: 0.55 + 0.5 * pulse(t, T.big, 1.2),
        post: t >= T.big + 0.1 && t < T.big + 2.8 ? (c) => { // 复原那一下：12 个棱块一圈弹出再收回
          if (c.userData.kind !== 2) return;
          const h = c.userData.home, k = pulse(t, T.big + 0.1 + ((h.x + 1) * 3 + (h.y + 1) + (h.z + 1) * 0.5) * 0.08, 0.55);
          c.position.addScaledVector(h.clone().normalize(), 0.45 * k);
        } : null,
      };
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      show(sfL, on * ease(ramp(t, T.label, 0.35)) * (1 - ease(ramp(t, T.solve + 0.2, 0.35))));
      const n = doneN(t), fin = n >= 20;
      const oc = on * ease(ramp(t, T.solve - 0.2, 0.3));
      show(ctr, oc, `translate(120px, 110px) scale(${lerp(0.62, 1, easeOutBack(ramp(t, T.big, 0.45), 1.4)).toFixed(4)})`);
      if (oc > 0) { ctr.textContent = String(n); ctr.style.color = fin ? "#FFD21A" : "#F4FBFF"; }
      show(stepL, oc * (1 - ease(ramp(t, T.big - 0.2, 0.2))));
      show(most, on * ease(ramp(t, T.l1, 0.45)) * (1 - ease(ramp(t, T.l2 - 0.35, 0.3))), `translateY(${(18 * (1 - easeOut(ramp(t, T.l1, 0.45)))).toFixed(1)}px)`);
      show(godL, on * ease(ramp(t, T.l2, 0.3)) * (1 - ease(ramp(t, T.t1 - 0.3, 0.25))), `scale(${lerp(1.4, 1, easeOut(ramp(t, T.l2, 0.3))).toFixed(3)})`);
      show(proof, on * ease(ramp(t, T.l3, 0.5)) * (1 - ease(ramp(t, T.t1 - 0.3, 0.25))));
      show(flash, on * 0.6 * pulse(t, T.big - 0.04, 0.4));
    },
  };
}
