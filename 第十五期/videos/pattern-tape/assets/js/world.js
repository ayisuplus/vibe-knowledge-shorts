// 世界：画布、HUD（时代标签 / 注释带 / 示意小标）、金尘、以及全片共用的「已织行数 R(t)」。
// 段文件只改 world 的参数，不重建 DOM。
import { integ, ramp, ease, clamp, mod } from "./lib.js";
import { BEAT, B, ERA } from "./beats.js";
import { beginCanvas, setCam, drawDust } from "./fabric.js";

/* ---------- 主织机的已织行数 R(t)：速度表（行/拍）积分，不累加 ---------- */
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
/** 行/拍 */
export function rateOf(n) {
  let r = 0;
  // 演示：两行各用一拍织完（n45→46、n47→48），钟形速度，积分恰为 1
  for (const a of [45, 47]) { const u = n - a; if (u > 0 && u < 1) r += 6 * u * (1 - u); }
  // 织造加速：1 → 2 → 4 → 6 行/拍，每级用 1 拍平滑过渡
  let prev = 0;
  for (const [n0, v] of [[62, 1], [66, 2], [72, 4], [80, 6]]) { r += (v - prev) * sm(n - n0); prev = v; }
  if (n >= 86) { const u = clamp((n - 86) / 4); r = 6 * (1 - u) * (1 - u); }
  // S4：换了花本之后织 2 行/拍，三匹推出前收住
  if (n >= 110 && n < 121) r += 2 * sm(n - 110) * (1 - sm(n - 118));
  return r;
}
const Rraw = (t) => integ((tt) => rateOf(tt / BEAT) / BEAT, t, 1 / 60);

export function build() {
  /* ---------- 底 ---------- */
  const bg = document.getElementById("bg");
  bg.innerHTML = '<div class="warpfx"></div><div class="vig"></div>';
  const warpfx = bg.querySelector(".warpfx"), vig = bg.querySelector(".vig");

  /* ---------- 画布 ---------- */
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d");

  /* ---------- HUD ---------- */
  const hud = document.getElementById("hud");
  hud.innerHTML = '<div class="scrim"></div>' +
    '<div class="era"><span class="ea"></span><span class="eb"></span></div>' +
    '<div class="mark">图为示意</div><div class="note"></div>';
  const eraEl = hud.querySelector(".era"), ea = hud.querySelector(".ea"), eb = hud.querySelector(".eb");
  const markEl = hud.querySelector(".mark"), noteEl = hud.querySelector(".note");
  let lastNote = null, lastEa = null, lastEb = null;

  /* ---------- 每帧缓存 ---------- */
  let cacheT = -1, cacheR = 0, cacheD = 0;
  const dustSpeed = (t) => 1
    + 0.8 * ease(ramp(t, B(120), 1.0)) * (1 - ease(ramp(t, B(124), 2.0)))
    + 1.0 * ease(ramp(t, B(162), 1.0))
    + 1.4 * Math.max(0, Math.sin(Math.PI * clamp((t - B(90)) / B(4))));

  const world = {
    cv, ctx, dpr: 1, ox: 0, oy: 0, np: ["", 0],
    /** 每帧开头：同步画布像素、清屏、算全片极轻的浮动，并画金尘（在最底层） */
    begin(t) {
      world.np = ["", 0];
      world.dpr = beginCanvas(cv, ctx);
      world.ox = 2.4 * Math.sin(t * 0.37 + 0.8);
      world.oy = 1.8 * Math.sin(t * 0.55);
      if (cacheT !== t) {
        cacheT = t;
        cacheR = Rraw(t);
        cacheD = integ(dustSpeed, t, 1 / 30);
      }
      warpfx.style.transform = `translateX(${(6 * Math.sin(t * 0.31)).toFixed(2)}px)`;
      vig.style.opacity = (0.45 + 0.04 * Math.sin(t * 0.9)).toFixed(3);
      world.cam({});
      drawDust(ctx, t, cacheD);
    },
    /** 相机：世界点 (cx,cy) 落在屏幕点 (sx,sy)，缩放 s；默认恒等 */
    cam(c = {}) { setCam(ctx, world.dpr, { ...c, ox: world.ox, oy: world.oy + (c.ny || 0) }); },
    /** 主织机已织行数（每帧只算一次） */
    R(t) { return t === cacheT ? cacheR : Rraw(t); },
    rate(t) { return rateOf(t / BEAT); },
    dust(t) { return t === cacheT ? cacheD : integ(dustSpeed, t, 1 / 30); },

    /* ----- HUD ----- */
    era(t) {
      let i = 0;
      for (let j = 0; j < ERA.length; j++) if (t >= ERA[j][0]) i = j;
      const tc = ERA[i][0], cur = ERA[i][1], prev = i > 0 ? ERA[i - 1][1] : "";
      const k = ease(ramp(t, tc, 0.3));
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
