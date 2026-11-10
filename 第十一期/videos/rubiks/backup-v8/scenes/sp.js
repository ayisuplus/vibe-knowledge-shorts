// S8（v7）哲理 · 霓虹展台。配乐最后一段副歌放三遍（第 161–209 拍，约 34 秒），一句比一句往上，直接冲进收尾：
// A1 「R U」狂转 105 次回到原样 → 重复，可能只是在原地绕圈
// A2 拔角块拧歪、变红，再拆开重组 → 有些错，只能拆开重来
// B  打成超级翻转，再 20 步拼回去 → 不管人生被打得多乱 / 只要找对那条路，就能把它拼回去
// C  对着观众说：魔方炸散、慢慢漂着（如果你觉得，现在的人生很乱）→ 停住（别怕）
//    → 地上亮起一条金色的路通到魔方脚下，小块一块一块飞回来（路，一直都在那里）
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit, whip, slam, hash } from "./util.js";
import { schedule, invert, parse } from "../cube.js";
import { warped } from "./s4.js";
import { SUPERFLIP } from "./s7.js";

function timed(seq, t0, total) {
  const ms = parse(seq), w = ms.map((m) => (Math.abs(m.q) === 2 ? 1.35 : 1)), sum = w.reduce((a, b) => a + b, 0);
  let t = t0; return ms.map((m, i) => { const slot = (total * w[i]) / sum, r = { ...m, t0: t, d: slot * 0.9 }; t += slot; return r; });
}

export default function SP({ THREE, Wd, cube, Wd: { scene } }) {
  const L0 = [K(193.5), K(201.5), K(209), K(225)], t1 = K(242);
  const C2 = K(231), C3 = K(235); // C 段里的「别怕」「路，一直都在那里」
  const sfStart = K(212.5), sf = timed(invert(SUPERFLIP), sfStart, K(221) - sfStart);
  const moves = [...warped("R U", 105, L0[0] + 0.4, 4.0, 0.9), ...schedule(SUPERFLIP, L0[2] + 0.5, 0.05, 0.01), ...sf];
  const corner = cube.cubies.findIndex((c) => c.userData.home.equals(new THREE.Vector3(1, 1, 1)));
  const DIAG = new THREE.Vector3(1, 1, 1).normalize();
  const C = [0, 2.3, 0], TG = [-2.9, 2.5, 0];
  const fin = sf[sf.length - 1].t0 + sf[sf.length - 1].d;

  const LINES = [
    `重复，可能只是在原地绕圈`,
    `有些错，只能拆开重来`,
    `不管人生被打得多乱<br><em>只要找对那条路，就能把它拼回去</em>`,
    `如果你觉得<br>现在的人生很乱`,
  ];
  const txt = LINES.map((s, i) => el(s, i >= 2 ? "phil phil3" : "phil", "hud"));
  const fear = el("别怕", "phil fear", "hud");
  const road = el("路，一直都在那里", "phil roadT", "hud");
  const ctr = el("", "ctr", "hud", "left:120px;top:330px;font-size:150px");
  const red = el("", "flash", "hud", "background:radial-gradient(closest-side, rgba(232,40,58,0) 40%, rgba(232,40,58,.5) 100%)");

  // C 段：炸散的方向、翻滚轴、飞回来的先后
  const DIR = cube.cubies.map((c, i) => c.userData.home.clone().add(new THREE.Vector3(hash(i) - 0.5, hash(i + 31) - 0.5, hash(i + 62) - 0.5).multiplyScalar(1.6)).normalize());
  const AXR = cube.cubies.map((_, i) => new THREE.Vector3(hash(i + 7) - 0.5, hash(i + 77) - 0.5, hash(i + 177) - 0.5).normalize());
  const ORD = cube.cubies.map((_, i) => hash(i + 300));
  const back = (t, i) => easeInOut(ramp(t, C3 + 0.3 + ORD[i] * 3.2, 0.9)); // 一块一块飞回来
  const scat = (t) => easeOut(ramp(t, L0[3] + 0.2, 2.2)); // 散开
  // 金色的路：从镜头前一直铺到魔方脚下
  const pathMat = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); // 不吃雾，远处也亮
  pathMat.color.setRGB(2.6, 1.8, 0.45);
  const edgeMat = pathMat.clone(); edgeMat.color.setRGB(3.4, 2.5, 0.8);
  const path = new THREE.Group();
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), pathMat); strip.rotation.x = -Math.PI / 2; path.add(strip);
  const eL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 1), edgeMat), eR = eL.clone(); eL.position.x = -0.82; eR.position.x = 0.82; path.add(eL, eR);
  path.visible = false; path.renderOrder = 5; scene.add(path);
  const PATH0 = 16, PATH1 = 0.6; // 路从 z=16 铺到 z=0.6

  const W = { d: 0.5, angle: 1.9 };
  const line = (t) => { let i = 0; L0.forEach((s, j) => { if (t >= s) i = j; }); return i; };
  const done = (sch, t) => { let n = 0; for (const m of sch) { if (t >= m.t0 + m.d) n++; else break; } return n; };
  const RU = moves.slice(0, 210);
  return {
    t0: L0[0], t1, moves, env: "stage",
    cam(t) {
      let off = 0, blur = 0;
      for (const c of [...L0, t1]) { const w = whip(t, c - W.d / 2, W.d, W.angle); off += w.off - (t >= c ? W.angle : 0); blur += w.blur; }
      const i = line(t);
      if (i === 3) { // 正对着路，慢慢往前推
        const r = lerp(18, 15, easeInOut(ramp(t, L0[3], t1 - L0[3]))), tg = [0, 2.6, 0]; // 从高处往下看：地上的路从画面底边一直通到魔方脚下，字在上面
        return { pos: orbit(tg, 0.08 - 0.008 * (t - L0[3]) + off, r, lerp(6.0, 5.0, easeInOut(ramp(t, C3, 4)))), tgt: tg, fov: 32, blur, bloom: 0.6 + 0.3 * ease(ramp(t, C3, 3)) };
      }
      const base = [0.35, 1.3, -0.6][i];
      return { pos: orbit(TG, base + [0.06, 0.06, 0.03][i] * (t - L0[i]) + off, [13.4, 13, 13.4][i], [2.6, 3.6, 2.4][i]), tgt: TG, fov: 32, blur, bloom: 0.6 + 0.35 * pulse(t, fin - 0.05, 0.7) };
    },
    cube(t) {
      const i = line(t), k0 = L0[i];
      let explode = 0, post = null, glow = 0.55 + 0.5 * pulse(t, fin, 1.0);
      if (i === 1) {
        explode = 0.95 * Math.sin(Math.PI * clamp((t - k0 - 2.2) / 2.2));
        post = (c, j) => {
          if (j !== corner || t > k0 + 2.1) return;
          const out = easeOut(ramp(t, k0 + 0.2, 0.35)) * (1 - easeIn(ramp(t, k0 + 1.05, 0.25)));
          c.position.addScaledVector(DIAG, 1.1 * out);
          c.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(DIAG, ((Math.PI * 2) / 3) * ease(ramp(t, k0 + 0.55, 0.35))));
        };
      }
      if (i === 3) {
        const s = scat(t), drift = t - L0[3];
        const still = 1 - 0.85 * ease(ramp(t, C2, 1.2)); // 「别怕」：翻滚慢下来
        post = (c, j) => {
          const k = 1 - back(t, j), d = s * k;
          if (d <= 0) return;
          c.position.addScaledVector(DIR[j], 2.4 * d).add(new THREE.Vector3(0, 0.25 * Math.sin(drift * 0.9 + j) * d, 0));
          c.rotateOnAxis(AXR[j], (1.6 + 0.5 * still) * d * (1 + 0.15 * drift * still));
        };
        glow = lerp(0.35, 0.55, ease(ramp(t, C2, 2))) + 0.5 * ease(ramp(t, C3 + 3.6, 1.2));
      }
      return { pos: C, rot: [0.1, i === 3 ? 0.4 + 0.08 * (t - L0[3]) : 0.4 * (t - L0[0]), 0], explode, spread: 1.0, post, core: i === 1 ? 6 * explode : 0, glow };
    },
    world(t, active) {
      path.visible = active && t >= C3;
      if (!path.visible) return;
      const k = easeInOut(ramp(t, C3 + 0.1, 2.6)), len = Math.max(0.01, (PATH0 - PATH1) * k);
      path.position.set(0, 0.012, PATH0 - len / 2); path.scale.set(1, 1, len);
      pathMat.opacity = 0.32 + 0.08 * Math.sin(t * 3); edgeMat.opacity = 1;
      Wd.lights.key.color.lerp(new THREE.Color(0xffe0a0), 0.35 * ease(ramp(t, C3 + 2.4, 1.5)));
    },
    hud(t, active) {
      const i = active ? line(t) : -1;
      txt.forEach((e, j) => {
        if (j !== i) { show(e, 0); return; }
        slam(e, t, L0[j] + 0.1, (j < 3 ? L0[j + 1] : C2) + 0.15, 1.5);
      });
      const em = txt[2].querySelector("em");
      if (i === 2) { const k = ramp(t, sfStart - 0.1, 0.5); em.style.opacity = ease(k).toFixed(3); em.style.transform = `translateY(${(20 * (1 - easeOut(k))).toFixed(1)}px)`; }
      if (i === 3) { slam(fear, t, C2, C3, 2.0); slam(road, t, C3 + 0.2, t1 + 0.15, 1.4); } else { show(fear, 0); show(road, 0); }
      let s = "";
      if (i === 0) s = "×" + Math.floor(done(RU, t) / 2);
      if (i === 2 && t >= sfStart - 0.2) s = String(done(sf, t));
      ctr.style.top = i === 2 ? "430px" : "330px";
      show(ctr, s ? 1 : 0, i === 2 ? `scale(${lerp(1, 1.35, easeOutBack(ramp(t, fin, 0.35), 1.6)).toFixed(3)})` : "");
      if (s) { ctr.textContent = s; ctr.style.color = (i === 0 && done(RU, t) >= 210) || (i === 2 && t >= fin) ? "#FFD21A" : "#F4FBFF"; }
      show(red, i === 1 ? 0.9 * pulse(t, L0[1] + 1.4, 0.7) : 0);
    },
  };
}
