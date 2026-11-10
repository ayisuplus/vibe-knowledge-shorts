// 世界：画布、HUD（时代标签 / 注释带 / 示意小标）、星尘、全片共用的「漂移距离 D(t)」。
// 段文件只改 world 的参数，不重建 DOM。
import { integ, ramp, ease, clamp } from "./lib.js";
import { B, BEAT, ERA } from "./beats.js";
import { beginCanvas, setCam, drawStars, drawNebula, drawBokeh, bloom, glow } from "./vec.js";

/** 星尘的漂移速度（px/s，向左为正）：镜中世界里整个世界都在向后退 */
function driftSpeed(t) {
  const mirror = ease(ramp(t, B(23), 1.0)) * (1 - ease(ramp(t, B(55), 1.2)));   // S2：地面向后流，天上也跟着退
  const surge = ease(ramp(t, B(205), 6)) * 1.0;                                 // S6：箭头汇成河，星尘加速
  return 16 + 210 * mirror + 120 * surge;
}

export function build() {
  /* ---------- 底 ---------- */
  const bg = document.getElementById("bg");
  bg.innerHTML = '<div class="vig"></div>';

  /* ---------- 画布 ---------- */
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");

  /* ---------- HUD ---------- */
  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="scrim"></div>' +
    '<div class="era"><span class="ea"></span><span class="eb"></span></div>' +
    '<div class="mark">图为示意</div><div class="note"></div>';
  const eraEl = hud.querySelector(".era"), ea = hud.querySelector(".ea"), eb = hud.querySelector(".eb");
  const markEl = hud.querySelector(".mark"), noteEl = hud.querySelector(".note");
  const flashEl = document.createElement("div"); flashEl.className = "flash"; hud.appendChild(flashEl);
  let lastNote = null, lastEa = null, lastEb = null;

  /* ---------- 每帧缓存 ---------- */
  let cacheT = -1, cacheD = 0;

  const world = {
    cv, ctx, dpr: 1, ox: 0, oy: 0, np: ["", 0], bloomK: 0.5, starA: 1, nebA: 1, warm: 0,
    /** 每帧开头：同步画布像素、清屏、算全片极轻的浮动，并画星云与星尘（最底层） */
    begin(t) {
      world.np = ["", 0];
      world.dpr = beginCanvas(cv, ctx);
      world.ox = 2.2 * Math.sin(t * 0.37 + 0.8);
      world.oy = 1.6 * Math.sin(t * 0.55);
      if (cacheT !== t) { cacheT = t; cacheD = integ(driftSpeed, t, 1 / 30); }
      world.bloomK = 0.5; world.starA = 1; world.nebA = 1; world.warm = 0;
      world.cam({});
    },
    /** 背景（星云 + 星尘）。各段在自己需要的时候调；默认由 film.js 在段之前画一次 */
    backdrop(t) {
      world.cam({});
      // 环境光：每两拍呼吸一次的大片蓝光（与 BGM 的拍同步），暗底里永远有东西在动
      { const amb = 0.5 - 0.5 * Math.cos((6.2832 * t) / (2 * BEAT)); ctx.save(); ctx.globalCompositeOperation = "lighter"; glow(ctx, 960 + 40 * Math.sin(t * 0.4), 500, 1250, "blue", (0.045 + 0.075 * amb) * world.nebA); ctx.restore(); }
      if (world.nebA > 0.01) drawNebula(ctx, t, { a: world.nebA, warm: world.warm });
      if (world.starA > 0.01) { drawStars(ctx, t, cacheD, { a: world.starA }); drawBokeh(ctx, t, cacheD, { a: world.starA }); }
    },
    /** 相机：世界点 (cx,cy) 落在屏幕点 (sx,sy)，缩放 s；默认恒等 */
    cam(c = {}) { setCam(ctx, world.dpr, { ...c, ox: world.ox, oy: world.oy + (c.ny || 0) }); },
    D(t) { return t === cacheT ? cacheD : integ(driftSpeed, t, 1 / 30); },
    /** 全部画完之后：泛光 */
    finish() { ctx.setTransform(1, 0, 0, 1, 0, 0); bloom(cv, ctx, world.bloomK); },

    /* ----- HUD ----- */
    era(t) {
      let i = 0;
      for (let j = 0; j < ERA.length; j++) if (t >= ERA[j][0]) i = j;
      const tc = ERA[i][0], cur = ERA[i][1], prev = i > 0 ? ERA[i - 1][1] : "";
      const k = ease(ramp(t, tc, i === 0 ? 0.9 : 0.3));
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
    /** 最后一闪：全屏白，盖住画面与注释（字幕在它之上，但结尾没有字幕） */
    flash(a) { flashEl.style.opacity = clamp(a).toFixed(3); flashEl.style.visibility = a > 0.004 ? "visible" : "hidden"; },
    mark(a) { markEl.style.opacity = clamp(a).toFixed(3); markEl.style.visibility = a > 0.004 ? "visible" : "hidden"; },
    /** 注释带：每帧只有一个来源。各段调 setNote，film.js 在最后 noteFlush 一次（透明度最高者胜）。 */
    setNote(html, a = 1) { if (a > world.np[1]) world.np = [html, a]; },
    noteFlush() {
      const [html, a] = world.np;
      if (lastNote !== html) { noteEl.innerHTML = html; lastNote = html; }
      noteEl.style.opacity = clamp(a).toFixed(3);
      noteEl.style.visibility = a > 0.004 && html ? "visible" : "hidden";
    },
  };
  return world;
}
