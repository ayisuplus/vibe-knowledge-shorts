// 三种「换一种看法」的画面层：棋盘跑道、仪表特写、同心圈。
// 和跑道共用一套光与色，但各自是独立的层；由 film.js 统一按时间调度。
import { BEAT, BAR, settle, hit, barPhase, SEC, B } from "./beats.js";
import { clamp, ease, ramp } from "./lib.js";

const CSS = `
.ovl{position:absolute;inset:0;overflow:hidden;opacity:0;visibility:hidden}
/* 棋盘地面 */
.ovl .haze{position:absolute;left:0;right:0;top:330px;height:260px;
  background:radial-gradient(60% 100% at 50% 100%,rgba(111,211,232,.15),transparent 70%)}
.ovl .scene{position:absolute;inset:0;perspective:720px;perspective-origin:50% 44%}
.ovl .plane{position:absolute;left:-60%;width:220%;height:2400px;top:470px;transform-origin:50% 50%;
  transform:rotateX(-74deg);
  background-image:
    repeating-linear-gradient(90deg,rgba(126,220,240,.55) 0 2px,transparent 2px 130px),
    repeating-linear-gradient(0deg,rgba(126,220,240,.55) 0 2px,transparent 2px 130px),
    repeating-conic-gradient(from 0deg at 50% 50%,#12313f 0% 25%,#08161d 0% 50%);
  background-size:130px 130px,130px 130px,130px 130px;
}
.ovl .fade{position:absolute;left:0;right:0;top:352px;height:130px;background:linear-gradient(180deg,#05070b 0%,rgba(5,7,11,.86) 38%,rgba(5,7,11,0) 100%)}
.ovl .hz{position:absolute;left:0;right:0;top:466px;height:2px;background:linear-gradient(90deg,transparent,rgba(126,220,240,.55) 18%,rgba(190,240,255,.85) 50%,rgba(126,220,240,.55) 82%,transparent);box-shadow:0 0 40px 12px rgba(111,211,232,.16)}
.ovl .sp{position:absolute;width:9px;height:9px;margin:-4px 0 0 -4px;border-radius:50%;
  background:#9fe8f7;box-shadow:0 0 14px rgba(159,232,247,.8)}
/* 仪表特写 */
.ovl .gp{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
  width:1240px;height:560px;border:1.5px solid rgba(111,211,232,.55);border-radius:26px;
  background:linear-gradient(180deg,rgba(16,32,42,.62),rgba(8,15,21,.62));
  box-shadow:0 0 0 1px rgba(111,211,232,.12),0 0 60px rgba(111,211,232,.06)}
.ovl .gk{position:absolute;left:62px;top:52px;font-family:NotoSC;font-size:33px;letter-spacing:.5em;color:#7fb9d0}
.ovl .gv{position:absolute;left:54px;bottom:112px;font-family:CMono;font-size:318px;line-height:.82;
  color:#d8f4ff;letter-spacing:-.02em;text-shadow:0 0 44px rgba(111,211,232,.6),0 0 120px rgba(111,211,232,.3)}
.ovl .gx{position:absolute;left:724px;bottom:154px;font-family:CMono;font-size:128px;color:#6fd3e8;
  text-shadow:0 0 26px rgba(111,211,232,.55)}
.ovl .gs{position:absolute;left:66px;bottom:56px;font-family:NotoSC;font-size:30px;letter-spacing:.1em;color:#5d8ba2}
.ovl .vig{position:absolute;inset:0;background:radial-gradient(58% 58% at 50% 48%,transparent 42%,rgba(3,5,8,.8) 100%)}
`;

let styled = false;
function injectCSS() {
  if (styled) return;
  const s = document.createElement("style");
  s.textContent = CSS;
  document.head.appendChild(s);
  styled = true;
}

function layer(parent, cls = "", html = "") {
  injectCSS();
  const d = document.createElement("div");
  d.className = "ovl " + cls;
  d.innerHTML = html;
  document.getElementById(parent).appendChild(d);
  return d;
}

const show = (e, a) => {
  e.style.opacity = clamp(a).toFixed(3);
  e.style.visibility = a > 0.002 ? "visible" : "hidden";
};

/* ---------------- 1. 棋盘跑道 ---------------- */
/** 一格一拍：每过一拍，地面上正好走过去一排格子。 */
export function floorLayer(world) {
  const root = layer("bg", "floor", `
    <div class="haze"></div>
    <div class="scene"><div class="plane"></div></div>
    <div class="fade"></div>
    <div class="spores"></div>`);
  const plane = root.querySelector(".plane");
  const spores = [...Array(7)].map((_, i) => {
    const d = document.createElement("div");
    d.className = "sp";
    // 在地面上撒开，越远越小
    const depth = i / 6;
    d.style.left = 960 + (i % 2 ? 1 : -1) * (120 + depth * 620) + "px";
    d.style.top = 880 - depth * 300 + "px";
    d.style.transform = `scale(${1.5 - depth})`;
    root.appendChild(d);
    return d;
  });

  return {
    root,
    state(t) {
      const a = settle(t, 12.75, 0.5) * (1 - settle(t, 29.30, 0.5));
      show(root, a);
      if (a < 0.002) return;
      // 一格一拍：位移与拍号严格挂钩
      const off = ((t / BEAT) * 130) % 130;
      plane.style.backgroundPosition = `0px ${off.toFixed(1)}px, 0px ${off.toFixed(1)}px, ${(-off / 2).toFixed(1)}px ${(-off / 2).toFixed(1)}px`;
      // 物种的光点：一拍亮一个，然后一个个灭掉（范瓦伦那一段）
      const on = settle(t, 22.4, 0.6);
      spores.forEach((d, i) => {
        const born = 18.0 + i * BEAT * 2;
        const died = 24.6 + i * BEAT * 1.6;
        const v = on * (settle(t, born, 0.12) * (1 - settle(t, died, 0.5)));
        d.style.opacity = v.toFixed(3);
        d.style.visibility = v > 0.01 ? "visible" : "hidden";
      });
    },
  };
}

/* ---------------- 2. 仪表特写 ---------------- */
/** 段间插点：镜头怼到读数上，数字一拍跳一位。 */
export function gaugeLayer() {
  const root = layer("hud", "gauge", `
    <div class="gp"><div class="gk">跑道速度</div>
      <div class="gv">1.0</div><div class="gx">×</div>
      <div class="gs">十年前是 1.0×</div></div>
    <div class="vig"></div>`);
  const v = root.querySelector(".gv");

  return {
    root,
    /** t0 起 t1 止；from→to 在这段里一拍一跳 */
    state(t, { t0, t1, from, to }) {
      const a = settle(t, t0, 0.1) * (1 - settle(t, t1 - 0.1, 0.1));
      show(root, a);
      if (a < 0.002) return;
      const n = Math.floor((t - t0) / BEAT);
      const total = Math.max(1, Math.round((t1 - t0) / BEAT));
      const k = clamp(n / total);
      v.textContent = (from + (to - from) * Math.round(k * total) / total).toFixed(1);
    },
  };
}

/* ---------------- 3. 同心圈 ---------------- */
export function ringsLayer() {
  const root = layer("hud", "rings", `
    <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">
      <g fill="none">
        <circle class="r0" cx="960" cy="720" r="0" stroke="rgba(111,211,232,.62)" stroke-width="1.8" stroke-dasharray="7 9"/>
        <circle class="r1" cx="960" cy="720" r="0" stroke="rgba(111,211,232,.42)" stroke-width="1.6" stroke-dasharray="7 9"/>
        <circle class="r2" cx="960" cy="720" r="0" stroke="rgba(190,224,240,.26)" stroke-width="1.4"/>
      </g>
      <g class="lbl" font-family="NotoSC" font-size="27" letter-spacing="7" fill="#8fbdd2" text-anchor="end">
        <text class="l0" x="960" y="600" opacity="0">隔壁工位</text>
        <text class="l1" x="960" y="360" opacity="0">同一座城市</text>
        <text class="l2" x="960" y="40" fill="#cfe6f3" opacity="0">全网</text>
      </g>
    </svg>`);
  const r = ["r0", "r1", "r2"].map((c) => root.querySelector("." + c));
  const l = ["l0", "l1", "l2"].map((c) => root.querySelector("." + c));
  const R = [180, 400, 620];

  return {
    root,
    state(t) {
      const a = settle(t, 63.74, 0.4) * (1 - settle(t, 76.0, 0.5));
      show(root, a);
      if (a < 0.002) return;
      // 一圈一拍地长出来；先有画，再挂标签
      const born = [65.9, 68.0, 70.2];
      r.forEach((c, i) => {
        const k = ease(settle(t, born[i], 0.55));
        c.setAttribute("r", (R[i] * k).toFixed(1));
        c.style.opacity = (0.25 + 0.75 * k).toFixed(3);
        l[i].style.opacity = (ease(settle(t, born[i] + 0.28, 0.3)) * 0.95).toFixed(3);
        l[i].setAttribute("y", 730)
        l[i].setAttribute("x", (960 - R[i] * k - 20).toFixed(1));
      });
      root.style.opacity = a.toFixed(3);
    },
  };
}

const SEC_Q = SEC.queen; const B_Q1 = B(43);
/** 身后是一排排一模一样的跑道，每一台上都有一个人，全都卡在同一拍上。 */
export function crowdLayer() {
  const G = [
    // [x, y, scale] —— 越远越高越小
    [404, 700, 0.58], [1516, 694, 0.57],
    [636, 726, 0.76], [1284, 720, 0.74],
    [700, 792, 1.55], [1220, 786, 1.52],
    [300, 812, 2.55], [1620, 806, 2.50],
  ];
  const glyph = (x, y, s, i) => `
    <g class="tm" transform="translate(${x} ${y}) scale(${s})" opacity="0">
      <rect x="-90" y="-13" width="180" height="26" rx="13" fill="none" stroke="#6fd3e8" stroke-width="2.4"/>
      <circle cx="-78" cy="0" r="12.5" fill="none" stroke="#6fd3e8" stroke-width="2.2"/>
      <circle cx="78" cy="0" r="12.5" fill="none" stroke="#6fd3e8" stroke-width="2.2"/>
      <path d="M0 -13 v-16" stroke="#dfeef8" stroke-width="5"/>
      <circle cx="0" cy="-40" r="8" fill="#dfeef8"/>
      <path d="M-4 -18 l10 0" stroke="#dfeef8" stroke-width="4"/>
      <path d="M-52 0 h104" stroke="#6fd3e8" stroke-width="1.4" stroke-dasharray="8 10" opacity=".55"/>
    </g>`;
  const root = layer("bg", "crowd", `<svg viewBox="0 0 1920 1080" style="position:absolute;inset:0;width:1920px;height:1080px">
    ${G.map(([x, y, s], i) => glyph(x, y, s, i)).join("")}
  </svg>`);
  const tms = [...root.querySelectorAll(".tm")];

  return {
    root,
    state(t) {
      const [a, b] = SEC_Q;
      const on = settle(t, a + 0.2, 0.6) * (1 - settle(t, b - 0.6, 0.6));
      show(root, on);
      if (on < 0.002) return;
      // 每一拍多亮一台；念到「新对手笑着取代它」时，远处的先灭
      const die = settle(t, B_Q1, 3.2);
      tms.forEach((e, i) => {
        const born = a + 0.4 + i * BEAT * 1.15;
        const v = settle(t, born, 0.1) * (1 - die * (0.35 + i * 0.08));
        e.style.opacity = clamp(on * v * (0.62 - i * 0.035)).toFixed(3);
      });
    },
  };
}
