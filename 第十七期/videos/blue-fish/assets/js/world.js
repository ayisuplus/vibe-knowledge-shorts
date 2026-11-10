// 世界：两层画布（后层：点阵 + 浮动气泡；前层：花瓣 / 星光 / 冲击环）、HUD（时代标签 / 注释带 / 示意小标 / 白闪）。
// 段文件只改 world 的参数或往画布上画，不重建 DOM。所有画布内容都是 t 的纯函数。
import { ramp, ease, clamp, rng, mod } from "./lib.js";
import { BEAT, ERA } from "./beats.js";

/** 画布按 DPR 重设像素并清屏，返回 dpr（4K 渲染时为 2） */
function beginCanvas(cv, ctx) {
  const dpr = window.devicePixelRatio || 1;
  const W = Math.round(1920 * dpr), H = Math.round(1080 * dpr);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return dpr;
}

/* ---------- 背景气泡：固定种子，位置 = t 的函数（向上慢漂，越出顶端从底部回来） ---------- */
const BUBBLES = (() => {
  const r = rng(1717), out = [];
  for (let i = 0; i < 26; i++) out.push({ x: r() * 1920, y0: r() * 1240, r: 10 + r() ** 2 * 46, v: 8 + r() * 16, sw: 18 + r() * 40, ph: r() * 6.28, ring: r() < 0.45 });
  return out;
})();

/* ---------- 花瓣（S6）：固定种子 ---------- */
export const PETALS = (() => {
  const r = rng(4242), out = [];
  for (let i = 0; i < 90; i++) out.push({ x: r() * 2100 - 90, y0: r() * 1300 - 200, s: 9 + r() * 14, v: 40 + r() * 70, sw: 30 + r() * 60, ph: r() * 6.28, rot: r() * 6.28, vr: (r() - 0.5) * 2.4, hue: r() });
  return out;
})();

export function build() {
  const bg = document.getElementById("bg");
  bg.innerHTML = '<div class="vig"></div>';
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
  const cf = document.getElementById("cf"), fx = cf.getContext("2d");

  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="scrim"></div>' +
    '<div class="era"><span class="ea"></span><span class="eb"></span></div>' +
    '<div class="mark"></div><div class="note"></div>';
  const eraEl = hud.querySelector(".era"), ea = hud.querySelector(".ea"), eb = hud.querySelector(".eb");
  const markEl = hud.querySelector(".mark"), noteEl = hud.querySelector(".note");
  const flashEl = document.createElement("div"); flashEl.className = "flash"; hud.appendChild(flashEl);
  let lastNote = null, lastEa = null, lastEb = null, lastMark = null;

  const world = {
    cv, ctx, fx, dpr: 1, ox: 0, oy: 0, z: 1, np: ["", 0], mp: ["", 0],
    bubA: 1, dotA: 1, beatK: 0,
    begin(t) {
      world.np = ["", 0]; world.mp = ["", 0];
      world.dpr = beginCanvas(cv, ctx);
      beginCanvas(cf, fx);
      // 舞台的「呼吸镜头」：整体缓慢推拉 ±3%（8.5 s 一个来回）+ 浮动。DOM 舞台用 CSS，前层画布把同一个变换烘进 ctx，两者对齐。
      world.ox = 6 * Math.sin(t * 0.37 + 0.8);
      world.oy = 4 * Math.sin(t * 0.55);
      world.z = 1 + 0.03 * Math.sin((6.2832 * t) / 8.5);
      const d = world.dpr, z = world.z;
      fx.setTransform(d * z, 0, 0, d * z, d * (960 - 960 * z + world.ox), d * (540 - 540 * z + world.oy));
      world.bubA = 1; world.dotA = 1;
      world.beatK = 0.5 - 0.5 * Math.cos((6.2832 * t) / (2 * BEAT));   // 两拍一呼吸
    },
    /** 后层：两团缓慢漂移的光 + 点阵（随拍呼吸）+ 浮动气泡 */
    backdrop(t) {
      const pool = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); };
      pool(960 + 640 * Math.sin(t * 0.43), 470 + 260 * Math.sin(t * 0.31 + 1.1), 760, "255,255,255", 0.7);
      pool(960 - 700 * Math.sin(t * 0.39 + 0.6), 560 + 280 * Math.cos(t * 0.29), 640, "70,160,220", 0.30 + 0.06 * world.beatK);
      if (world.dotA > 0.01) {
        const a = (0.13 + 0.07 * world.beatK) * world.dotA, sh = mod(t * 6, 36);
        ctx.fillStyle = `rgba(18,121,179,${a.toFixed(3)})`;
        for (let y = 18 - sh * 0.3; y < 1080; y += 36) for (let x = 18 + sh; x < 1940; x += 36) { ctx.beginPath(); ctx.arc(x - 18, y, 1.9, 0, 6.2832); ctx.fill(); }
      }
      if (world.bubA > 0.01) for (const b of BUBBLES) {
        const y = mod(b.y0 - t * b.v, 1240) - 80, x = b.x + b.sw * Math.sin(t * 0.4 + b.ph);
        const g = ctx.createRadialGradient(x - b.r * 0.3, y - b.r * 0.35, b.r * 0.1, x, y, b.r);
        g.addColorStop(0, `rgba(255,255,255,${0.75 * world.bubA})`); g.addColorStop(1, `rgba(31,155,214,${(b.ring ? 0.05 : 0.14) * world.bubA})`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.2832); ctx.fill();
        if (b.ring) { ctx.strokeStyle = `rgba(18,121,179,${0.22 * world.bubA})`; ctx.lineWidth = 2; ctx.stroke(); }
      }
    },
    /** 花瓣（S6）：画在后层画布（白卡与文字之后）。k = 数量比例 0..1，a = 透明度 */
    petals(t, k, a = 1, t0 = 0) {
      if (k <= 0 || a <= 0.01) return;
      const fx = ctx;
      const n = Math.round(PETALS.length * clamp(k));
      for (let i = 0; i < n; i++) {
        const p = PETALS[i], tt = t - t0;
        const y = mod(p.y0 + tt * p.v, 1400) - 160, x = p.x + p.sw * Math.sin(tt * 0.9 + p.ph);
        const col = p.hue < 0.5 ? [255, 214, 222] : p.hue < 0.8 ? [255, 255, 255] : [255, 228, 196];
        fx.save(); fx.translate(x, y); fx.rotate(p.rot + tt * p.vr); fx.globalAlpha = a;
        fx.fillStyle = `rgb(${col})`; fx.strokeStyle = "rgba(230,130,110,0.55)"; fx.lineWidth = 1.2;
        fx.beginPath(); fx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.2832); fx.fill(); fx.stroke(); fx.restore();
      }
    },
    /** 前层：一圈冲击环（重击点）。k 0→1 */
    ring(x, y, k, r0 = 40, r1 = 700, col = "31,155,214", w = 10) {
      if (k <= 0 || k >= 1) return;
      const e = 1 - (1 - k) ** 3;
      fx.strokeStyle = `rgba(${col},${(0.6 * (1 - k)).toFixed(3)})`; fx.lineWidth = w * (1 - k) + 1;
      fx.beginPath(); fx.arc(x, y, r0 + (r1 - r0) * e, 0, 6.2832); fx.stroke();
    },
    /** 前层：四角星光点（闪烁） */
    sparkle(x, y, s, a = 1, col = "255,255,255") {
      if (a <= 0.01) return;
      fx.save(); fx.translate(x, y); fx.globalAlpha = clamp(a); fx.fillStyle = `rgb(${col})`;
      fx.beginPath();
      for (let i = 0; i < 4; i++) { const an = i * Math.PI / 2; fx.lineTo(Math.cos(an) * s, Math.sin(an) * s); fx.lineTo(Math.cos(an + Math.PI / 4) * s * 0.22, Math.sin(an + Math.PI / 4) * s * 0.22); }
      fx.closePath(); fx.fill(); fx.restore();
    },

    /* ----- HUD ----- */
    era(t) {
      let i = 0;
      for (let j = 0; j < ERA.length; j++) if (t >= ERA[j][0]) i = j;
      const tc = ERA[i][0], cur = ERA[i][1], prev = i > 0 ? ERA[i - 1][1] : "";
      const k = ease(ramp(t, tc, i === 0 ? 0.6 : 0.3));
      if (lastEb !== cur) { eb.textContent = cur; lastEb = cur; }
      if (lastEa !== prev) { ea.textContent = prev; lastEa = prev; }
      eb.style.opacity = (cur ? k : 0).toFixed(3);
      eb.style.transform = `translateY(${((1 - k) * 18).toFixed(1)}px)`;
      ea.style.opacity = (prev ? 1 - k : 0).toFixed(3);
      ea.style.transform = `translateY(${(-k * 18).toFixed(1)}px)`;
      const a = (cur ? k : 0) + (prev ? 1 - k : 0);
      eraEl.style.opacity = clamp(a).toFixed(3);
      eraEl.style.visibility = a > 0.004 ? "visible" : "hidden";
    },
    flash(a) { flashEl.style.opacity = clamp(a).toFixed(3); flashEl.style.visibility = a > 0.004 ? "visible" : "hidden"; },
    /** 右上小标（示意 / 图为示意）：每帧只有一个来源，透明度高者胜 */
    setMark(text, a = 1) { if (a > world.mp[1]) world.mp = [text, a]; },
    /** 注释带：每帧只有一个来源（透明度高者胜） */
    setNote(html, a = 1) { if (a > world.np[1]) world.np = [html, a]; },
    hudFlush() {
      const [html, a] = world.np;
      if (lastNote !== html) { noteEl.innerHTML = html; lastNote = html; }
      noteEl.style.opacity = clamp(a).toFixed(3);
      noteEl.style.visibility = a > 0.004 && html ? "visible" : "hidden";
      const [mt, ma] = world.mp;
      if (lastMark !== mt) { markEl.textContent = mt; lastMark = mt; }
      markEl.style.opacity = clamp(ma).toFixed(3);
      markEl.style.visibility = ma > 0.004 && mt ? "visible" : "hidden";
    },
  };
  return world;
}
