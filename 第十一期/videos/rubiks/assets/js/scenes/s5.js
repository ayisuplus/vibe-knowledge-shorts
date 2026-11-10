// S4（v3）守恒量 · 金库：拆开随手装回去，还拼得好吗？三次演示，每次都是「拔出来 → 动一下 → 塞回去 → 金库灯变红：拼不回去」，
// 然后撤回复原。① 拧歪一个角块（1/3）② 翻转一个棱块（1/2）③ 对调两个棱块（1/2）→ 1/3 × 1/2 × 1/2 = 1/12，停住
import { K, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, lerp, clamp, pulse, el, show, orbit, slam } from "./util.js";
import { whipIn, whipOut } from "./s1.js";
import { svg } from "./mg.js";

export default function S5({ THREE, Wd, cube }) {
  const T = { t0: K(98), shake: K(99), d1: K(101), d2: K(106.5), d3: K(112), frac: K(117.5), t1: K(122) };
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
  // v13 MG：面积切分图。一个发光正方形 =「所有随手装法」；每演示一次拼不回去，就把还亮着的那块切开、灭掉一部分：
  // 角块拧歪 → 竖着切成 3 份，只剩 1 份亮；棱块翻面 → 再横着对半切；两块对调 → 再对半切 → 最后只剩 1/12 那一小格亮（3×4 的格子）
  const X0 = 1170, Y0 = 210, S = 520, X1 = X0 + S / 3, YM = Y0 + S / 2, YQ = Y0 + S / 4;
  const rc = (id, x, y, w, h, extra = "") => `<rect id="${id}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;
  const ln = (id, x1, y1, x2, y2) => `<line id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#38E8FF" stroke-width="5" stroke-linecap="round"/>`;
  let grid = "";
  for (let i = 1; i < 3; i++) grid += `<line x1="${X0 + (S * i) / 3}" y1="${Y0}" x2="${X0 + (S * i) / 3}" y2="${Y0 + S}"/>`;
  for (let j = 1; j < 4; j++) grid += `<line x1="${X0}" y1="${Y0 + (S * j) / 4}" x2="${X0 + S}" y2="${Y0 + (S * j) / 4}"/>`;
  const area = svg(`
    <defs><filter id="ag" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    ${rc("aBg", X0, Y0, S, S, 'fill="rgba(56,232,255,.10)"')}
    ${rc("aR1", X1, Y0, S - S / 3, S, 'fill="#E8283A"')}
    ${rc("aR2", X0, YM, S / 3, S / 2, 'fill="#E8283A"')}
    ${rc("aR3", X0, YQ, S / 3, S / 4, 'fill="#E8283A"')}
    ${rc("aLit", X0, Y0, S / 3, S / 4, 'fill="#FFD21A"')}
    <g id="aGrid" stroke="rgba(160,230,255,.45)" stroke-width="2" stroke-dasharray="8 8">${grid}</g>
    ${ln("aV1", X1, Y0, X1, Y0 + S)}${ln("aV2", X0 + (2 * S) / 3, Y0, X0 + (2 * S) / 3, Y0 + S)}
    ${ln("aH1", X0, YM, X1, YM)}${ln("aH2", X0, YQ, X1, YQ)}
    ${rc("aBox", X0, Y0, S, S, 'fill="none" stroke="#38E8FF" stroke-width="6" filter="url(#ag)"')}
    <g font-family="CMono" font-weight="900" font-size="90" fill="#FF6B6B" text-anchor="middle" dominant-baseline="central">
      <text id="aX1" x="${X1 + S / 3}" y="${Y0 + S / 2}">✕</text><text id="aX2" x="${X0 + S / 6}" y="${YM + S / 4}">✕</text><text id="aX3" x="${X0 + S / 6}" y="${YQ + S / 8}">✕</text>
    </g>`);
  const q = (id) => area.querySelector("#" + id);
  const A = { bg: q("aBg"), box: q("aBox"), r1: q("aR1"), r2: q("aR2"), r3: q("aR3"), lit: q("aLit"), grid: q("aGrid"), v1: q("aV1"), v2: q("aV2"), h1: q("aH1"), h2: q("aH2"), x1: q("aX1"), x2: q("aX2"), x3: q("aX3") };
  const PER = 4 * S;
  A.box.setAttribute("stroke-dasharray", `${PER} ${PER}`);
  const head = el("所有随手装回去的装法", "mhead", "hud", `right:auto;left:${X0}px;width:${S}px;text-align:center;top:${Y0 - 66}px`);
  const fr = el(`<span class="f1">1/3</span><span class="f2"> × 1/2</span><span class="f3"> × 1/2</span><b class="f4"> = 1/12</b>`, "frac afrac", "hud", `left:${X0 - 330}px;right:auto;width:${S + 420}px;top:${Y0 + S + 30}px;font-size:60px`);
  const F = [".f1", ".f2", ".f3", ".f4"].map((c) => fr.querySelector(c));
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
      // 面积图：出现 → 三次切分 → 1/12 那格变金、整张 3×4 虚线格子浮出来
      const oa = on * ease(ramp(t, T.shake + 0.4, 0.5)) * (1 - ease(ramp(t, T.t1 - 0.45, 0.3)));
      show(area, oa); show(head, oa * (1 - ease(ramp(t, T.frac, 0.3))));
      A.box.setAttribute("stroke-dashoffset", (PER * (1 - easeInOut(ramp(t, T.shake + 0.4, 0.9)))).toFixed(1));
      const cut = (e, i, x1, y1, x2, y2) => { const k = easeInOut(ramp(t, RED[i] - 0.15, 0.4)); e.setAttribute("x2", lerp(x1, x2, k)); e.setAttribute("y2", lerp(y1, y2, k)); e.style.opacity = k > 0 ? 1 : 0; };
      cut(A.v1, 0, X1, Y0, X1, Y0 + S); cut(A.v2, 0, X0 + (2 * S) / 3, Y0, X0 + (2 * S) / 3, Y0 + S);
      cut(A.h1, 1, X0, YM, X1, YM); cut(A.h2, 2, X0, YQ, X1, YQ);
      // 被排除的部分：先闪红，再暗下去（留一层暗红）
      [A.r1, A.r2, A.r3].forEach((e, i) => { const k = ramp(t, RED[i] + 0.15, 0.25); e.style.opacity = (k > 0 ? 0.9 * Math.exp(-3 * Math.max(0, t - RED[i] - 0.4)) + 0.22 : 0).toFixed(3); });
      [A.x1, A.x2, A.x3].forEach((e, i) => { const k = ramp(t, RED[i] + 0.2, 0.25); e.style.opacity = (ease(k) * 0.9).toFixed(3); e.setAttribute("transform", `translate(${e.getAttribute("x")} ${e.getAttribute("y")}) scale(${lerp(1.8, 1, easeOutBack(k, 2)).toFixed(3)}) translate(${-e.getAttribute("x")} ${-e.getAttribute("y")})`); });
      const kl = ramp(t, T.frac, 0.4);
      A.lit.style.opacity = (ease(kl) * (0.75 + 0.25 * Math.sin((t - T.frac) * 6))).toFixed(3);
      A.lit.setAttribute("filter", kl > 0 ? "url(#ag)" : "");
      A.grid.style.opacity = (0.9 * ease(ramp(t, T.frac + 0.2, 0.6))).toFixed(3);
      A.bg.style.opacity = (1 - 0.6 * ease(kl)).toFixed(3);
      // 下面的算式一项一项长出来
      show(fr, oa);
      F.forEach((e, i) => { const k = ramp(t, i < 3 ? RED[i] + 0.3 : T.frac + 0.3, 0.3); e.style.opacity = ease(k).toFixed(3); });
      F[3].style.color = "#FFD21A";
      show(red, on * 0.9 * redK(t));
    },
  };
}
