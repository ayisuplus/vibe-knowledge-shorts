// S5（v3）重复 · 无限光环隧道：只拧两下 R、U（慢，动作条一个个亮）→ 这两下一直重复（变速：慢 → 快到模糊 → 急停），
// 隧道的光环跟着越流越快，计数器 1 → 105 → 第 105 次自己回到原样：光环一起变金，大字停 3 秒 → 甩镜出
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit } from "./util.js";
import { schedule, parse } from "../cube.js";
import { whipIn, whipOut } from "./s1.js";
import { svg, gearPath } from "./mg.js";

/** 变速：n 步排在 D 秒里，两头慢、中间快（g(x)=x+a·sin2πx/2π） */
export function warped(seq, reps, t0, D, a = 0.95) {
  const ms = parse(Array(reps).fill(seq).join(" ")), N = ms.length;
  const g = (x) => x + (a * Math.sin(2 * Math.PI * x)) / (2 * Math.PI);
  return ms.map((m, i) => { const s = t0 + D * g(i / N), e = t0 + D * g((i + 1) / N); return { ...m, t0: s, d: (e - s) * 0.92 }; });
}

export default function S4({ THREE, Wd, cube, Wd: { scene } }) {
  const T = { t0: K(122), r: K(124), u: K(125.6), rep: K(127.6), repEnd: K(139), t1: K(146) };
  // 第 1 次的 R、U 慢慢拧（动作条亮），后面 104 次变速重复；一共 105 次，正好回到原样
  const RU = warped("R U", 104, T.rep, T.repEnd - T.rep, 0.96);
  const moves = [...schedule("R", T.r, 0.6, 0), ...schedule("U", T.u, 0.6, 0), ...RU];
  const C = [0, 2.3, 0], TG = [-2.4, 2.3, 0];
  const done = (t) => { let n = 0; for (const m of moves) { if (t >= m.t0 + m.d) n++; else break; } return n; };

  // 隧道：一串光环沿着「镜头 → 魔方」的方向往远处排，按转动的进度往镜头这边流
  const N = 30, SP = 2.4, tunnel = new THREE.Group();
  const rings = Array.from({ length: N }, (_, i) => {
    const m = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false });
    const r = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.035, 8, 160), m); r.userData.warm = i % 5 === 2; tunnel.add(r); return r;
  });
  tunnel.visible = false; scene.add(tunnel);
  const cyan = new THREE.Color().setRGB(0.4, 2.2, 2.9), warm = new THREE.Color().setRGB(2.8, 1.7, 0.5), gold = new THREE.Color().setRGB(3.2, 2.4, 0.6);

  const chips = el(["R", "U"].map((c) => `<span class="chip2">${c}</span>`).join(""), "chips", "hud", "top:96px;left:auto;right:120px;justify-content:flex-end");
  const cs = [...chips.querySelectorAll("span")];
  // v13 MG：为什么偏偏是 105？两个咬合的齿轮。拧「R U」时 7 个棱块转成一圈（每 7 次回原位），5 个角块也转成一圈，
  // 但会被拧歪，要 15 次才完全复原。每重复一次，两个齿轮各转一个齿；标记点要到第 105 次（7 × 15）才同时回到顶上。
  const ctr = el("", "ctr", "hud", "left:120px;top:150px;font-size:150px"), ctrl = el("「R U」重复的次数", "ctrl", "hud", "left:132px;top:310px;font-size:40px");
  const back = el("回到原样", "concl", "hud", "left:500px;top:268px;color:#FFD21A;font-size:56px");
  const rule = el(`上帝的规矩 <b>2</b><small>重复，会回到原点</small>`, "rule", "hud", "left:120px;top:78px");
  const KG = 14.5, H = 26, BX = 330, BY = 660, TB = 15, TA = 7, RB = TB * KG, RA = TA * KG, AX = BX + RB + RA, AY = BY;
  const gear = (id, teeth, r, col, label, num) => `
    <g id="${id}"><path d="${gearPath(teeth, r, H)}" fill="rgba(8,16,26,.82)" stroke="${col}" stroke-width="4"/>
      <circle r="${r * 0.32}" fill="none" stroke="${col}" stroke-width="3" opacity=".6"/>
      <circle id="${id}m" cx="0" cy="${-r + 4}" r="11" fill="#FFFFFF"/></g>
    <text x="0" y="0" text-anchor="middle" font-family="NotoSC" font-weight="800" font-size="${Math.round(r * 0.3)}" fill="${col}" id="${id}t">${label}</text>
    <text x="0" y="0" text-anchor="middle" font-family="CMono" font-weight="900" font-size="${Math.round(r * 0.36)}" fill="#F4FBFF" id="${id}n">${num}</text>`;
  const gsv = svg(`
    <defs><filter id="gg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g filter="url(#gg)">
      <g transform="translate(${BX} ${BY})">${gear("gB", TB, RB, "#FFD21A", "角块", "15")}</g>
      <g transform="translate(${AX} ${AY})">${gear("gA", TA, RA, "#38E8FF", "棱块", "7")}</g>
      <path id="hB" d="M${BX - 14} ${BY - RB - H - 30} L${BX + 14} ${BY - RB - H - 30} L${BX} ${BY - RB - H - 10} Z" fill="#FFD21A"/>
      <path id="hA" d="M${AX - 14} ${AY - RA - H - 30} L${AX + 14} ${AY - RA - H - 30} L${AX} ${AY - RA - H - 10} Z" fill="#38E8FF"/>
    </g>`);
  const gq = (id) => gsv.querySelector("#" + id);
  const G = { A: gq("gA"), B: gq("gB"), hA: gq("hA"), hB: gq("hB"), mA: gq("gAm"), mB: gq("gBm") };
  // 齿轮里的字：名字在上、次数在下
  gq("gAt").setAttribute("y", -RA * 0.08); gq("gAn").setAttribute("y", RA * 0.42); gq("gBt").setAttribute("y", -RB * 0.08); gq("gBn").setAttribute("y", RB * 0.36);
  const eqm = el(`<span>7</span> × <span>15</span> = <b>105</b>`, "frac", "hud", `left:500px;right:auto;width:auto;text-align:left;top:168px;font-size:72px;transform-origin:0 50%`);
  // 连续的重复次数（当前这一下拧到一半，就算半次）
  const nCont = (t) => { let n = 0; for (const m of moves) { if (t >= m.t0 + m.d) n++; else { if (t > m.t0) n += (t - m.t0) / m.d; break; } } return n / 2; };
  return {
    t0: T.t0, t1: T.t1, T, moves, env: "tunnel",
    cam(t) {
      const wi = whipIn(t, T.t0), wo = whipOut(t, T.t1);
      const r = lerp(12.6, 11.4, ease(ramp(t, T.t0, 5))) - 1.0 * easeInOut(ramp(t, T.rep, T.repEnd - T.rep)) + 1.0 * easeOut(ramp(t, T.repEnd, 1.2));
      return { pos: orbit(TG, 0.5 + 0.02 * (t - T.t0) + wi.off + wo.off, r, 2.0), tgt: TG, fov: 32, blur: wi.blur + wo.blur };
    },
    cube(t) {
      return { pos: C, rot: [0, 0.2, 0], post: null, glow: 0.55 + 0.4 * pulse(t, T.repEnd, 1.0) };
    },
    world(t, active) {
      tunnel.visible = active; if (!active) return;
      tunnel.position.set(...C); tunnel.lookAt(Wd.camera.position);
      const n = done(t), flow = n * 0.32 + 0.5 * (t - T.t0), g = pulse(t, T.repEnd - 0.05, 1.6);
      rings.forEach((r, i) => {
        const z = 7 - (((i * SP - flow) % (N * SP)) + N * SP) % (N * SP); // 7 → 7 - 72：近处的在镜头和魔方之间
        r.position.set(0, 0, z);
        const fade = clamp((z + 70) / 30) * (1 - clamp((z - 2) / 5));
        r.material.color.copy(r.userData.warm ? warm : cyan).lerp(gold, g).multiplyScalar(fade * (0.6 + 0.4 * ease(ramp(t, T.t0, 1.0))));
        r.material.opacity = 1;
        r.rotation.z = 0.15 * i;
      });
    },
    hud(t, active) {
      const on = active ? 1 : 0;
      show(rule, on * ease(ramp(t, T.t0 + 0.5, 0.5)) * (1 - ease(ramp(t, T.u + 0.1, 0.3)))); // 计数器出来前收掉，免得两个数字打架
      show(chips, on * ease(ramp(t, T.r - 0.4, 0.3)));
      cs.forEach((c, i) => c.classList.toggle("on", t >= [T.r, T.u][i] && t < [T.r, T.u][i] + 0.9 || (t >= T.rep && t < T.repEnd && (done(t) % 2 === i))));
      const n = done(t), fin = t >= T.repEnd;
      const oc = on * ease(ramp(t, T.u + 0.5, 0.3));
      show(ctr, oc, `scale(${lerp(1, 1.25, easeOutBack(ramp(t, T.repEnd, 0.4), 1.8) * (fin ? 1 : 0)).toFixed(3)})`); show(ctrl, oc);
      if (oc > 0) { ctr.textContent = String(Math.floor(n / 2)); ctr.style.color = fin ? "#FFD21A" : "#F4FBFF"; ctr.style.transformOrigin = "0 100%"; }
      show(back, on * ease(ramp(t, T.repEnd + 0.3, 0.4)), `translateY(${(16 * (1 - easeOut(ramp(t, T.repEnd + 0.3, 0.4)))).toFixed(1)}px)`);
      // 齿轮：每重复一次各转一个齿（棱块齿轮顺时针，角块齿轮逆时针）；标记点回到顶上的那一下，顶上的小三角闪一下
      const og = on * ease(ramp(t, T.r - 0.2, 0.5));
      show(gsv, og);
      const nc = nCont(t);
      G.A.setAttribute("transform", `rotate(${((nc * 360) / TA).toFixed(3)})`);
      G.B.setAttribute("transform", `rotate(${((-nc * 360) / TB + 180 / TB).toFixed(3)})`);
      const near = (m) => { const f = nc / m - Math.round(nc / m); return nc >= m - 0.01 ? Math.exp(-Math.pow(f * m * 2.2, 2)) : 0; };
      const fA = near(TA), fB = near(TB), both = fin ? 1 : 0;
      G.hA.style.opacity = (0.35 + 0.65 * Math.max(fA, both)).toFixed(3); G.hB.style.opacity = (0.35 + 0.65 * Math.max(fB, both)).toFixed(3);
      G.mA.setAttribute("r", (11 + 9 * Math.max(fA, both)).toFixed(2)); G.mB.setAttribute("r", (11 + 9 * Math.max(fB, both)).toFixed(2));
      gsv.style.filter = `brightness(${(1 + 0.8 * pulse(t, T.repEnd - 0.05, 0.9)).toFixed(3)})`;
      show(eqm, on * ease(ramp(t, T.repEnd + 0.6, 0.4)), `scale(${lerp(1.5, 1, easeOutBack(ramp(t, T.repEnd + 0.6, 0.4), 1.8)).toFixed(3)})`);
    },
  };
}
