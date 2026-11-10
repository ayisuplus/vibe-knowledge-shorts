// 六段。全片一条时间轴（120 秒），每段只在自己的窗口里驱动自己的画面；出了窗口必须把自己关掉。
// 时间点一律写「拍」，用 B(n) 换成秒（分镜脚本里的 nK 就是这里的 B(K)）。
import { B, BEAT, SEC, L, DUR } from "./beats.js";
import { el, vis, ease, easeIn, easeOut, easeInOut, easeOutBack, ramp, lerp, clamp, pulse, mod, mixHex, rng, win, integ } from "./lib.js";
import { wipe, dash, odo, typed, handwrite, glyphs, seal } from "./rig.js";
import { PAL, rg, glow, arrow, arrowTo, beam, ring, limb, burst, mixPal, makeProj, lighter, normal, groundArrow, drawRunner, drawReflection, perimPoint } from "./vec.js";

const SVGNS = "http://www.w3.org/2000/svg";
const TAU = Math.PI * 2;

export function sections(world) {
  const { ctx } = world;
  /** 以「拍」为单位的 ramp：从第 n0 拍起，dn 拍内 0→1 */
  const rn = (t, n0, dn = 1) => ramp(t, B(n0), B(dn));
  /** 在 stage 里放一个标注 */
  const lab = (html, x, y, w = 0, cls = "") =>
    el(html, "lab " + cls, "stage", `left:${x}px;top:${y}px;opacity:0${w ? `;width:${w}px` : ""}`);

  /* =========================================================
     S1 · 冷开场  n0 – n22
     暗场（前 1 s 只有星尘）→ n2 一群金箭头自左飞入、同向 → n7–8 首尾相接，叠成一支更亮更长的金箭头（相加）
     → n13.4 从中间断开，右半翻身变红、拉开 → n16–20 对顶冲刺 → n20 相撞，迸散，抵消归零 → 红色波纹送进 S2
     背景里 24 支小箭头是「每个人」：先一起向右，n14 起右半边翻身朝左，一起奔向中线，各自在抵达时炸成小火花。
     ========================================================= */
  // 主箭头：入场行 y、全长、轴宽、入场延迟(拍)、编队里的尾 x
  const FL = [
    { y: 300, len: 190, w: 6,   d: 1.25, x: 640 },
    { y: 372, len: 210, w: 6.5, d: 0.5,  x: 800 },
    { y: 452, len: 250, w: 8,   d: 0.0,  x: 360 },
    { y: 508, len: 300, w: 10,  d: 1.0,  x: 180 },
    { y: 566, len: 290, w: 9,   d: 0.25, x: 700 },
    { y: 640, len: 230, w: 7,   d: 0.75, x: 480 },
  ];
  const CHAIN_LEN = FL.reduce((s, a) => s + a.len, 0), HALF = CHAIN_LEN / 2;
  const CHAIN_X0 = 960 - CHAIN_LEN / 2;
  { let x = CHAIN_X0; for (const a of FL) { a.cx = x; x += a.len; } }
  const GH = (() => {
    const r = rng(17), out = [];
    for (let i = 0; i < 24; i++) {
      const left = i % 2 === 0;
      out.push({
        x14: left ? 140 + r() * 640 : 1140 + r() * 700,         // n14 时的尾 x：左右各一半
        y: 250 + r() * 450, len: 70 + r() * 70, w: 2.6 + r() * 1.6, v: 38 + r() * 70,
        born: r() * 4.5, off: r() * 0.9, seed: 100 + i,
      });
    }
    return out;
  })();
  const T_IN = B(2), T_MERGE = B(7), T_JOIN = B(8), T_SPLIT = B(13.4), T_WIND = B(14), T_CHARGE = B(16), T_HIT = B(20);
  const DRIFT = 30;                                             // 合体后的缓缓右移（px/s）
  const mergedTail = (t) => CHAIN_X0 + DRIFT * Math.max(0, t - T_JOIN);

  /** 一支朝左的箭：tip 在 tipX，全长 len，sx 是翻身进度（1 朝右 → −1 朝左），以箭杆中点为轴 */
  function arrowFlipped(tipX, y, len, sx, o) {
    ctx.save();
    ctx.translate(tipX + len / 2, y);
    ctx.scale(sx, 1);
    arrow(ctx, -len / 2, 0, 0, len, o);
    ctx.restore();
  }

  const s1 = {
    state(t) {
      if (t > B(23)) return;
      const toHit = t - T_HIT;
      world.cam({ s: 1 + 0.035 * ease(rn(t, 14, 6)), cx: 960, cy: 500, sx: 960, sy: 500 });

      /* ---- 背景小箭头 ---- */
      for (const g of GH) {
        const born = ease(clamp((t - B(2.2) - g.born * 0.3) / 0.7));
        if (born <= 0.002) continue;
        const side = g.x14 > 960 ? 1 : 0;                                     // 右半边的要翻身
        const tArr = T_HIT - BEAT * (0.1 + 0.9 * g.off);
        const mid14 = g.x14 + g.len / 2;
        let mid, ang = 0;
        if (t < B(14)) mid = mid14 - g.v * (B(14) - t);
        else {
          const u = clamp((t - B(14)) / (tArr - B(14)));
          mid = lerp(mid14, 960, easeIn(u) ** 0.85);
          if (side) ang = Math.PI * ease(rn(t, 14 + g.off, 1.2));
        }
        const col = side && ang > Math.PI / 2 ? "red" : "gold";
        if (t < tArr) {
          const len = g.len * (1 + 0.06 * Math.sin(t * 3 + g.seed));
          const tx = mid - Math.cos(ang) * len / 2, ty = g.y - Math.sin(ang) * len / 2;
          if (tx > -len - 40 && tx < 2000) arrow(ctx, tx, ty, ang, len, { w: g.w, col, a: 0.6 * born, glow: 0.7, head: 0.9 });
        } else if (t < tArr + 0.55) {
          burst(ctx, 960 + (side ? 8 : -8), g.y, t - tArr, { n: 9, seed: g.seed, speed: 230, life: 0.55, col, size: 2.2 });
        }
      }

      /* ---- 主箭头：入场 → 编队 → 首尾相接（相加） ---- */
      if (t < T_SPLIT) {
        const mk = ease(clamp((t - T_MERGE) / (T_JOIN - T_MERGE)));
        const chainFade = 1 - ease(clamp((t - T_JOIN) / 0.35));
        const bigA = ease(clamp((t - T_JOIN + 0.05) / 0.3));
        if (chainFade > 0.004) {
          for (const a of FL) {
            const tIn = T_IN + B(a.d), u = clamp((t - tIn) / 1.25);
            if (u <= 0) continue;
            const xForm = a.x - 1500 * (1 - easeOut(u)) + 26 * Math.max(0, t - tIn);
            const x = lerp(xForm, a.cx, mk), y = lerp(a.y, 500, mk);
            arrow(ctx, x, y, 0, a.len, { w: lerp(a.w, 13, mk), col: "gold", a: chainFade, glow: 1 + 0.5 * mk });
          }
        }
        if (t >= T_JOIN) {
          const tau = t - T_JOIN;
          let x = CHAIN_X0;
          for (let i = 0; i < FL.length - 1; i++) {
            x += FL[i].len;
            burst(ctx, x, 500, tau, { n: 14, seed: 40 + i, speed: 280, life: 0.8, col: "gold", size: 2.6 });
            glow(ctx, x, 500, 150, "white", 0.55 * Math.exp(-tau * 7));
          }
        }
        if (bigA > 0.004) {
          const tx = mergedTail(t), tau = t - T_JOIN;
          // 临近断开：越来越亮、微颤
          const charge = ease(clamp((t - (T_SPLIT - 0.9)) / 0.9));
          const breathe = 1 + 0.05 * Math.sin(t * 5) + 0.12 * charge;
          const jy = 2.2 * charge * Math.sin(t * 80);
          arrow(ctx, tx, 500 + jy, 0, CHAIN_LEN, { w: 15 * breathe, col: "gold", a: bigA, glow: 1.5 + charge, head: 1.1 });
          // 合体的一道高光：自尾扫到头
          const sw = clamp(tau / 0.7);
          if (sw > 0 && sw < 1) {
            const p = tx + CHAIN_LEN * easeInOut(sw);
            beam(ctx, p - 260, 500, p, 500, { col: "white", w: 9, a: 0.9, a0: 0, a1: 1, glow: 1 });
            glow(ctx, p, 500, 120, "white", 0.7);
          }
          if (charge > 0.02) glow(ctx, tx + HALF, 500, 90 + 240 * charge, "white", 0.75 * charge);
        }
      } else {
        /* ---- n13.4 断开：左半留着，右半翻身变红；n14–16 蓄势后撤；n16–20 对顶冲刺 ---- */
        const x0 = mergedTail(T_SPLIT);
        const flip = ease(clamp((t - T_SPLIT) / 0.42));                          // 0 → 1：右半翻身
        const wind = easeOut(clamp((t - T_WIND) / B(2)));                        // 后撤
        const chg = clamp((t - T_CHARGE) / (T_HIT - T_CHARGE));
        const charge = chg ** 3;                                                 // 越逼越快
        const tailL = lerp(lerp(x0, -70, wind), 960 - HALF, charge);             // 左半：尾 x，向右
        const cR = lerp(lerp(x0 + 1.5 * HALF, 1990 - HALF / 2, wind), 960 + HALF / 2, charge);   // 右半的中点
        const col = mixPal("gold", "red", flip);
        const jy = 3 * charge * Math.sin(t * 90);
        const collapse = t < T_HIT ? 0 : easeIn(clamp((t - T_HIT) / 0.2));
        const lenH = HALF * (1 - collapse), wv = 14 + 4 * charge;
        if (lenH > 3) {
          arrow(ctx, collapse ? 960 - lenH : tailL, 500 + jy, 0, lenH, { w: wv, col: "gold", a: 1, glow: 1.5 + charge });
          const sx = Math.cos(Math.PI * flip);                                    // 1 → −1
          if (collapse) arrowFlipped(960, 500 - jy, lenH, -1, { w: wv, col, a: 1, glow: 1.5 + charge });
          else {
            ctx.save();
            ctx.translate(cR, 500 - jy);
            ctx.scale(Math.abs(sx) < 0.04 ? 0.04 * Math.sign(sx || 1) : sx, 1);
            arrow(ctx, -HALF / 2, 0, 0, HALF, { w: wv, col, a: 1, glow: 1.5 + charge });
            ctx.restore();
          }
        }
        // 断开瞬间的闪光
        const tc = t - T_SPLIT;
        if (tc > 0 && tc < 0.7) { glow(ctx, x0 + HALF, 500, 420 * (0.4 + tc), "white", 0.9 * Math.exp(-tc * 6)); burst(ctx, x0 + HALF, 500, tc, { n: 40, seed: 77, speed: 420, life: 0.7, col: "gold", size: 3 }); }
        // 冲刺时的速度线
        if (charge > 0.02 && t < T_HIT) {
          const sp = 0.28 * charge, rr = 760 * (1 - charge * 0.55);
          beam(ctx, 960 - rr, 500, 960, 500, { col: "gold", w: 3, a: sp, a0: 0, a1: 1, glow: 1 });
          beam(ctx, 960 + rr, 500, 960, 500, { col: "red", w: 3, a: sp, a0: 0, a1: 1, glow: 1 });
        }
        // 相撞：闪光、冲击波、火花、归零
        if (toHit > 0) {
          glow(ctx, 960, 500, 700 * (0.5 + toHit * 0.4), "white", 0.95 * Math.exp(-toHit * 9));
          glow(ctx, 960, 500, 360, "gold", 0.9 * Math.exp(-toHit * 4));
          for (let i = 0; i < 3; i++) {                       // 同心的地面波纹：红、金、红，依次扩散
            const tt = toHit - i * 0.16;
            if (tt > 0) ring(ctx, 960, 500, 30 + 1150 * easeOut(tt / 2.0), { col: i === 1 ? "gold" : "red", w: 5 - i, a: 0.9 * (1 - clamp(tt / 2.0)) ** 1.3, squash: 0.38 });
          }
          burst(ctx, 960, 500, toHit, { n: 90, seed: 7, speed: 760, life: 1.3, col: "gold", size: 3.4 });
          burst(ctx, 960, 500, toHit, { n: 60, seed: 9, speed: 560, life: 1.1, col: "red", size: 3.2 });
          glow(ctx, 960, 500, 34, "white", 0.7 * (0.5 + 0.5 * Math.sin(toHit * 6)) * ease(clamp(toHit / 0.6)));   // 归零：只剩一点微光
        }
      }
    },
  };

  /* =========================================================
     S2 · 历史锚点  n22 – n56
     n21.2–24.2 红色波纹扩成「镜面」，露出镜中世界：地面（红箭头）一直向左退，奔跑者全力向右跑、原地不动
     n36 引文卡（红皇后原话，逐字打出）→ n48 1973 论文页（图为示意）→ n56 纸页化为坐标场（S3 接手）
     ========================================================= */
  const FOC = 1000, HOR = 470, CAMY = 200;
  const proj = makeProj({ f: FOC, cx: 960, cy: HOR, camX: 0, camY: CAMY, camZ: 0, pitch: 0 });
  const RUN = { x: 700, y: 690, u: 300 };                       // 脚下接触点（px）与身高
  const Z_R = FOC * CAMY / (RUN.y - HOR), S_R = FOC / Z_R;       // 奔跑者所在深度、该深度的 px/世界单位
  const T_STEP = 0.62;                                           // 一个全步（左右各一步）的秒数
  const FLOOR_PX = ((0.22 + 0.27) / (0.36 * T_STEP)) * RUN.u;    // 落地的脚相对身体向后的速度（px/s）= 地面后退的速度（与 vec.js 的步态一致）
  const FLOOR_V = FLOOR_PX / S_R;                                // 同一个速度，换成世界单位/秒
  const ROWS = [560, 680, 830, 1020, 1280, 1650, 2200, 3000];    // 地面箭头各排的深度
  const ROW_PH = ROWS.map((_, i) => rng(300 + i)());
  const ARW_LEN = 200, ARW_W = 9;                                // 世界单位

  // 一对等长相反的箭的标注（随镜头缩放对位：镜头 cx=sx=960, cy=sy=600）。先于卡片建立，卡片盖得住它
  const camPt = (x, y, s) => [960 + s * (x - 960), 600 + s * (y - 600)];
  const pairA = lab("奔跑", 900, 472, 0, "gold"), pairB = lab("地面后退", 900, 626, 0, "red");

  // 引文卡
  const QUOTE = "Now, here, you see, it takes all the running you can do, to keep in the same place.";
  const QHL = [QUOTE.indexOf("keep in the same place"), QUOTE.length - 1];
  const qcard = el(
    '<div class="qsrc">红皇后 · 《爱丽丝镜中奇遇》 · 1871</div><div class="qbar"></div><div class="qtext"></div>',
    "card qcard", "stage");
  const qtext = qcard.querySelector(".qtext"), qbar = qcard.querySelector(".qbar");
  function typeHL(node, full, h0, h1, f) {
    const n = Math.round(clamp(f) * full.length);
    const a = full.slice(0, Math.min(n, h0)), b = full.slice(h0, Math.min(n, h1)), c = full.slice(h1, n);
    node.innerHTML = a + (b ? `<b>${b}</b>` : "") + c + (n < full.length ? '<span class="qcur"></span>' : "");
  }

  // 1973 论文页（复原示意）
  const paper = el(
    '<div class="pj"><span>EVOLUTIONARY THEORY</span><span>1 : 1–30 · 1973</span></div><div class="prule"></div>' +
    '<div class="pt">A NEW EVOLUTIONARY LAW</div><div class="pa">L. VAN VALEN</div>' +
    '<div class="bars">' + [0, 1, 2, 3, "g", 4, 5, 6, 7, 8, "g", 9, 10, 11].map((k, i) => k === "g" ? '<i class="gap"></i>' : `<i style="width:${[100, 96, 99, 62, 98, 94, 100, 97, 54, 99, 91, 76][i % 12]}%"></i>`).join("") + '</div>' +
    '<svg class="fig" viewBox="0 0 500 320">' +
    '<path class="ax" d="M56 14 V262 H476" fill="none" stroke="#2a2419" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path class="ln l1" d="M56 38 L470 104" fill="none" stroke="#2a2419" stroke-width="4" stroke-linecap="round"/>' +
    '<path class="ln l2" d="M56 38 L470 170" fill="none" stroke="#a63a2b" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path class="ln l3" d="M56 38 L470 238" fill="none" stroke="#2a2419" stroke-width="4" stroke-linecap="round"/>' +
    '<text x="276" y="296" text-anchor="middle">存续的时间 →</text><text x="22" y="150" text-anchor="middle" transform="rotate(-90 22 150)">仍存续的比例（对数）</text>' +
    '</svg><div class="sheen"></div>', "paper", "stage");
  const pbars = Array.from(paper.querySelectorAll(".bars i:not(.gap)")), prule = paper.querySelector(".prule"), psheen = paper.querySelector(".sheen");
  const ptexts = Array.from(paper.querySelectorAll("svg text")), pax = paper.querySelector(".ax"), pl = [".l1", ".l2", ".l3"].map((s) => paper.querySelector(s));

  const s2 = {
    state(t) {
      const live = t > B(21.1) && t < B(57);
      if (!live) { vis(qcard, 0); vis(paper, 0); vis(pairA, 0); vis(pairB, 0); return; }
      const phase = (TAU * t) / T_STEP;                                 // 奔跑相位只看 t：任意跳帧都对
      // 场景亮度：引文卡时压暗，论文页时更暗，n55 起退场；奔跑者在论文页来之前先退场
      const sceneA = (1 - 0.5 * win(t, B(35.6), B(46.6), 0.5, 0.5)) * (1 - 0.45 * win(t, B(47.6), B(55.6), 0.7, 0.9)) * (1 - ease(rn(t, 54.6, 1.2)));
      const runnerOut = 1 - ease(rn(t, 46.2, 1.0));

      /* ---- 镜面扩开：红波纹的圆心就是 S1 归零的那一点 ---- */
      const rv = easeInOut(rn(t, 21.2, 3.0));
      const R = 80 + 1700 * rv;
      ctx.save();
      if (rv < 0.999) { ctx.beginPath(); ctx.arc(960, 500, R, 0, TAU); ctx.clip(); }

      const camS = 1 + 0.045 * ease(rn(t, 24, 22));
      world.cam({ s: camS, cx: 960, cy: 600, sx: 960, sy: 600 });
      { const [ax, ay] = camPt(900, 472, camS), [bx, by] = camPt(900, 626, camS); pairA.style.left = ax + "px"; pairA.style.top = ay + "px"; pairB.style.left = bx + "px"; pairB.style.top = by + "px"; }
      /* 地平线与地面透视线 */
      const hz = 0.9 * sceneA;
      beam(ctx, 0, HOR, 960, HOR, { col: "cyan", w: 2, a: 0.55 * hz, a0: 0.05, a1: 1, glow: 1 });
      beam(ctx, 960, HOR, 1920, HOR, { col: "cyan", w: 2, a: 0.55 * hz, a0: 1, a1: 0.05, glow: 1 });
      for (let i = -9; i <= 9; i++) {                                     // 沿深度方向的线
        const a = proj(i * 520, 0, 420), b = proj(i * 520, 0, 6000);
        if (a && b) beam(ctx, b[0], b[1], a[0], a[1], { col: "cyan", w: 1.3, a: 0.16 * sceneA, a0: 0.1, a1: 1 });
      }
      /* 地面箭头：全部朝左，各排同一世界速度 → 近大远小、近快远慢 */
      ROWS.forEach((Z, k) => {
        const sp = 0.62 * Z, N = Math.ceil((2 * 1.1 * Z) / sp + 3), span = sp * N;
        const fog = clamp(1.15 - Z / 3600);
        for (let i = 0; i < N; i++) {
          const xw = mod(i * sp + ROW_PH[k] * sp - FLOOR_V * t + span / 2, span) - span / 2;
          const p0 = proj(xw + ARW_LEN / 2, 0, Z), p1 = proj(xw - ARW_LEN / 2, 0, Z);
          if (!p0 || p0[0] < -300 || p0[0] > 2220) continue;
          const sq = CAMY / Z * 0.9;
          groundArrow(ctx, p0[0], p0[1], Math.hypot(p1[0] - p0[0], 1), sq, { dirLeft: true, w: ARW_W * p0[2], col: "red", a: 0.82 * fog * sceneA, glow: 0.9 });
        }
      });

      /* 奔跑者 + 倒影 + 一对等长相反的箭 */
      const tr = Math.max(0, t - B(21.2));
      const runA = ease(clamp(tr / 0.8)) * sceneA * runnerOut;
      for (const [dt, al] of [[0.09, 0.12], [0.05, 0.2]]) drawRunner(ctx, RUN.x, RUN.y, RUN.u, (TAU * (t - dt)) / T_STEP, { a: al * runA });
      drawRunner(ctx, RUN.x, RUN.y, RUN.u, phase, { a: runA });
      drawReflection(ctx, world.dpr, RUN.x, RUN.y + 2, RUN.u * 0.96, phase, { a: 0.3 * runA });
      glow(ctx, RUN.x, RUN.y + 4, 150, "cyan", 0.16 * runA);              // 脚下的一点接触光
      { const tt = t - B(28); if (tt > 0 && tt < 1.1) { ring(ctx, RUN.x, RUN.y + 4, 80 + 900 * easeOut(tt / 1.1), { col: "cyan", w: 3.5, a: 0.7 * (1 - tt / 1.1) * sceneA, squash: 0.2 }); glow(ctx, RUN.x, RUN.y - 60, 360, "gold", 0.22 * Math.exp(-tt * 4) * sceneA); } }   // n28：音乐跃起
      const va = ease(rn(t, 27.5, 1.2)) * sceneA * runnerOut;
      const pulse2 = 1 + 0.035 * Math.sin(TAU * t / T_STEP * 2), PL = 260 * pulse2;
      if (va > 0.01) {
        arrow(ctx, 900, 528, 0, PL, { w: 11, col: "gold", a: va, glow: 1.4 });
        arrow(ctx, 900 + PL, 600, Math.PI, PL, { w: 11, col: "red", a: va, glow: 1.4 });
        glow(ctx, 900 + PL / 2, 564, 120, "white", 0.1 * va);
      }
      const plA = va * (1 - win(t, B(35.4), B(46.8), 0.3, 0.3)) ** 2;
      vis(pairA, plA * 0.95); vis(pairB, plA * 0.95);
      ctx.restore();

      /* 镜面的波纹边 */
      if (rv < 0.999) for (let i = 0; i < 3; i++) {
        const rr = R - i * 70;
        if (rr > 20) ring(ctx, 960, 500, rr, { col: i === 1 ? "white" : "cyan", w: 4 - i, a: (0.85 - 0.25 * i) * (1 - rv ** 3), squash: 1, glow: 1.2 });
      }

      if (t > B(24) && t < B(35.8)) world.setNote("镜中世界：你跑多快，地面就退多快", win(t, B(24.6), B(35.4), 0.4, 0.4));

      /* ---- 引文卡 n36–n46.5 ---- */
      const qa = win(t, B(36), B(46.4), 0.45, 0.45);
      if (qa > 0.004) {
        vis(qcard, qa, `translateY(${((1 - ease(rn(t, 36, 1))) * 26).toFixed(1)}px)`);
        typeHL(qtext, QUOTE, QHL[0], QHL[1], (t - B(37)) / (B(8.2)));
        qbar.style.transform = `scaleY(${ease(rn(t, 36.2, 1.4)).toFixed(3)})`;
      } else vis(qcard, 0);

      /* ---- 1973 论文页 n48–n56（图为示意） ---- */
      const pa = ease(rn(t, 47.8, 1.1)) * (1 - ease(rn(t, 55.0, 1.0)));
      if (pa > 0.004) {
        const k = ease(rn(t, 47.8, 1.1)), out = ease(rn(t, 55.0, 1.0));
        vis(paper, pa, `translateY(${((1 - k) * 60 - out * 20).toFixed(1)}px) rotate(${(-2.2 + 2.2 * k).toFixed(2)}deg) scale(${(0.94 + 0.06 * k + 0.3 * out).toFixed(3)})`);
        prule.style.transform = `scaleX(${ease(rn(t, 48.4, 1)).toFixed(3)})`;
        pbars.forEach((b, i) => { b.style.transform = `scaleX(${ease(rn(t, 49 + i * 0.12, 0.9)).toFixed(3)})`; });
        dash(pax, rn(t, 50.2, 1.4));
        for (const tx of ptexts) tx.style.opacity = ease(rn(t, 50.6, 1.2)).toFixed(3);
        pl.forEach((p, i) => dash(p, rn(t, 51.2 + i * 0.55, 1.6)));
        { const sp = (t - B(48.6)) / B(3.6), k = sp - Math.floor(sp); psheen.style.opacity = (0.7 * Math.sin(Math.PI * clamp(k * 1.5))).toFixed(3); psheen.style.transform = `translateX(${(-300 + 1700 * ease(clamp(k * 1.5))).toFixed(0)}px)`; }
        world.setNote("化石记录里，灭绝的概率与已存续的时间（近似）无关", ease(rn(t, 50.4, 1)) * (1 - ease(rn(t, 54.8, 1))));
      } else vis(paper, 0);
    },
  };

  /* =========================================================
     S3 · 机制  n56 – n108
     坐标场（x 轴 = 一条路）。n58 把「努力」画成箭头 → n64 两种：同向 / 对顶
     → n70 同向相加：3 + 2 = 5，合力推着「位置」一路走远，身后留下金色的积累（蛋糕做大）
     → n84 对顶相消：一样大、方向相反，合力 0；双方各自加码（3 → 5 → 8），位置纹丝不动
     → n98 人人都在用力的一圈箭头压着中心，整体原地踏步（协调失败）→ n104 角落小图：公地牧场（类比）
     ========================================================= */
  const OX = 960, OY = 560, UN = 100;                       // 坐标场原点（= 数轴 / 路）与「一格」的像素
  function fieldGrid(a, R) {
    if (a <= 0.004) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath(); ctx.arc(OX, OY, R, 0, TAU); ctx.clip();
    ctx.lineWidth = 1; ctx.strokeStyle = rg(PAL.cyan.c, 0.07 * a);
    ctx.beginPath();
    for (let k = -10; k <= 10; k++) { if (!k) continue; const x = OX + k * UN; ctx.moveTo(x, 160); ctx.lineTo(x, 760); }
    for (let j = -4; j <= 2; j++) { if (!j) continue; const y = OY + j * UN; ctx.moveTo(0, y); ctx.lineTo(1920, y); }
    ctx.stroke();
    ctx.strokeStyle = rg(PAL.cyan.c, 0.34 * a); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(120, OY); ctx.lineTo(1800, OY); ctx.moveTo(OX, 170); ctx.lineTo(OX, 760); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.strokeStyle = rg(PAL.cyan.c, 0.3 * a);
    ctx.beginPath();
    for (let k = -8; k <= 8; k++) { const x = OX + k * UN; ctx.moveTo(x, OY - 7); ctx.lineTo(x, OY + 7); }
    ctx.stroke();
    ctx.restore();
    glow(ctx, OX, OY, 26, "cyan", 0.5 * a);
  }
  /** 沿线段 (x0,y0)→(x1,y1) 朝终点流动的光点：力在推。 */
  function flowDots(x0, y0, x1, y1, t, { n = 6, speed = 0.9, col = "gold", a = 1, r = 9 } = {}) {
    for (let i = 0; i < n; i++) {
      const f = ((t * speed + i / n) % 1 + 1) % 1, x = lerp(x0, x1, f), y = lerp(y0, y1, f);
      glow(ctx, x, y, r * (0.6 + 0.8 * f), col, 0.85 * a * Math.sin(Math.PI * f) ** 0.7);
    }
  }
  const readout = (key, val, x, y, cls = "") => {
    const e = el(`<span class="rk">${key}</span><span class="rv">${val}</span>`, "readout " + cls, "stage", `left:${x}px;top:${y}px`);
    return { e, v: e.querySelector(".rv") };
  };
  const rdNet = readout("合力", "0", 1470, 196), rdIn = readout("投入", "0", 1470, 340, "cyan");
  const lbBig = (html, x, y, cls) => lab(html, x, y, 0, cls + " big");
  const lbEffort = lbBig("努力", 700, 396, "gold"), lbSame = lbBig("同向", 592, 560, "gold"), lbOpp = lbBig("对顶", 1236, 560, "red");
  const lbPos = lab("位置", 0, 0, 0, "cyan c"), lbPos2 = lab("位置", 0, 0, 0, "cyan c");
  const tagA = lab("3", 296, 352, 0, "gold"), tagB = lab("2", 296, 432, 0, "gold");
  const lbPasture = lab("类比 · 公地牧场", 1184, 616, 0, "gold");
  const sealCommons = seal("stage", { x: 1720, y: 330, size: 112, text: "类比", rot: -10 });
  // 公地牧场里的牛：确定性散布
  const COWS = (() => { const r = rng(61), o = []; for (let i = 0; i < 12; i++) o.push({ x: 30 + r() * 520, y: 40 + r() * 190, ph: r() * 6.28 }); return o; })();
  const PAST = { x: 1180, y: 330, w: 580, h: 260 };

  const s3 = {
    state(t) {
      const live = t > B(54.5) && t < B(109);
      if (!live) {
        for (const e of [rdNet.e, rdIn.e, lbEffort, lbSame, lbOpp, lbPos, lbPos2, tagA, tagB, lbPasture]) vis(e, 0);
        sealCommons.hide();
        return;
      }
      const fadeAll = 1 - ease(rn(t, 107.2, 0.8));                 // 交给 S4 之前淡出
      const gA = ease(rn(t, 55.2, 2.4)) * fadeAll;
      fieldGrid(gA, 120 + 1500 * ease(rn(t, 55.2, 2.8)));
      { const gp = (t - B(58)) / B(4); if (gp > 0 && t < B(98)) { const k = gp - Math.floor(gp); ring(ctx, OX, OY, 50 + 1000 * easeOut(k), { col: "cyan", w: 2, a: 0.16 * (1 - k) * gA, glow: 0 }); } }

      /* ---------- 0 · 把努力画成箭头（n58–n64）→ 两种（n64–n70） ---------- */
      const eA = ease(rn(t, 58.1, 1.2)) * (1 - ease(rn(t, 63.4, 0.8)));
      if (eA > 0.003) {
        const p1 = ease(rn(t, 58.1, 1.4));
        arrow(ctx, 700, 460, 0, 400 * p1, { w: 11, col: "gold", a: eA, glow: 1.3 });
        const p2 = ease(rn(t, 60.6, 1.4));
        arrow(ctx, 1180, 540, -0.5, 300 * p2, { w: 9, col: "gold", a: eA, glow: 1.2 });
        vis(lbEffort, eA * p1);
        world.setNote("箭头：方向 = 往哪使劲，长度 = 使多大劲", eA * ease(rn(t, 58.6, 0.8)));
      } else vis(lbEffort, 0);
      const kA = ease(rn(t, 64.2, 1.0)) * (1 - ease(rn(t, 69.2, 0.8)));
      if (kA > 0.003) {
        const d = ease(rn(t, 64.2, 1.2));
        arrow(ctx, 520, 460, 0, 240 * d, { w: 10, col: "gold", a: kA, glow: 1.2 });
        arrow(ctx, 520, 520, 0, 240 * d, { w: 10, col: "gold", a: kA, glow: 1.2 });
        arrow(ctx, 1140, 490, 0, 200 * d, { w: 10, col: "gold", a: kA, glow: 1.2 });
        arrow(ctx, 1540, 490, Math.PI, 200 * d, { w: 10, col: "red", a: kA, glow: 1.2 });
        glow(ctx, 1340, 490, 50, "white", 0.25 * kA * d);
        vis(lbSame, kA * d); vis(lbOpp, kA * d);
      } else { vis(lbSame, 0); vis(lbOpp, 0); }

      /* ---------- 1 · 相加（n70–n84） ---------- */
      const addA = ease(rn(t, 69.8, 0.8)) * (1 - ease(rn(t, 82.6, 0.6)));
      if (addA > 0.003) {
        const dA = ease(rn(t, 70, 1.2)), dB = ease(rn(t, 70.5, 1.2));
        const mv = ease(rn(t, 72.0, 1.0));                          // B 滑到 A 的头上（n73 正好接上）
        const fuse = t >= B(73);
        const dsc = easeInOut(rn(t, 73.4, 1.0));                    // 合力箭头落到路上
        const go = Math.max(0, t - B(74.4));
        const mx = 700 + 200 * go;                                  // 位置的 x
        if (!fuse) {
          arrow(ctx, 340, 380, 0, 300 * dA, { w: 11, col: "gold", a: addA, glow: 1.2 });
          arrow(ctx, lerp(340, 640, mv), lerp(460, 380, mv), 0, 200 * dB, { w: 11, col: "gold", a: addA, glow: 1.2 });
          vis(tagA, addA * dA); vis(tagB, addA * dB * (1 - ease(rn(t, 72.3, 0.5))));
        } else {
          vis(tagA, 0); vis(tagB, 0);
          const tx = lerp(340, 180, dsc) + (go > 0 ? mx - 700 : 0), ty = lerp(380, OY, dsc);
          const tau = t - B(73);
          arrow(ctx, tx, ty, 0, 500, { w: 15 + 2 * Math.sin(t * 6), col: "gold", a: addA, glow: 1.7, head: 1.1 });
          glow(ctx, 640, 380, 200, "white", 0.8 * Math.exp(-tau * 7) * addA);
          burst(ctx, 640, 380, tau, { n: 30, seed: 311, speed: 420, life: 0.8, col: "gold", size: 3 });
          flowDots(tx + 20, ty, tx + 480, ty, t, { n: 7, speed: 1.1, col: "white", a: 0.8 * addA, r: 12 });
          // 位置与金色的积累
          const mA = ease(rn(t, 73.0, 0.8)) * addA;
          const trailW = Math.max(0, mx - 700);
          if (trailW > 2) {
            // 身后积累起来的一块金色（蛋糕做大）：贴在路的下方，越走越长、越亮；纵向用 14 条渐淡的细带近似渐变
            ctx.save(); ctx.globalCompositeOperation = "lighter";
            for (let k = 0; k < 14; k++) {
              const g = ctx.createLinearGradient(700, 0, mx, 0), al = 0.62 * mA * (1 - k / 14) ** 1.6;
              g.addColorStop(0, rg(PAL.gold.c, 0)); g.addColorStop(1, rg(PAL.gold.c, al));
              ctx.fillStyle = g; ctx.fillRect(700, OY + 12 + k * 6, trailW, 6.4);
            }
            ctx.fillStyle = rg(PAL.gold.core, 0.5 * mA); ctx.fillRect(700, OY + 12, trailW, 2.5);
            ctx.restore();
          }
          glow(ctx, mx, OY, 70, "cyan", 0.7 * mA);
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = rg(PAL.white.core, 0.95 * mA); ctx.beginPath(); ctx.arc(mx, OY, 15, 0, TAU); ctx.fill(); ctx.restore();
          lbPos.style.left = (mx - 36) + "px"; lbPos.style.top = (OY + 36) + "px"; vis(lbPos, mA);
          const arrive = clamp((t - B(82.6)) / 0.6);
          if (arrive > 0 && arrive < 1) glow(ctx, mx, OY, 260 * arrive, "gold", 0.6 * (1 - arrive));
          world.setNote("同向的力相加：合力 = 3 + 2 = 5，位置越走越远", ease(rn(t, 73.0, 0.8)) * addA);
          rdNet.v.textContent = "+" + odo(0, 5, rn(t, 73.1, 0.8));
          vis(rdNet.e, ease(rn(t, 73.0, 0.5)) * addA);
        }
      } else { vis(tagA, 0); vis(tagB, 0); vis(lbPos, 0); }

      /* ---------- 2 · 相消（n84–n98） ---------- */
      const canA = ease(rn(t, 83.0, 0.5)) * (1 - ease(rn(t, 97.2, 0.8)));
      if (canA > 0.003) {
        // 一格 = UN；3 → 5 → 8
        const e0 = easeIn(rn(t, 83.0, 1.0)), off = (1 - e0) * 620;          // 两支箭从两侧冲来，n84 整拍相撞
        const u = 3 + 2 * ease(rn(t, 88, 1.2)) + 3 * ease(rn(t, 91.5, 1.2));
        const L = UN * u, wv = 9 + 0.9 * u;
        const kick = 2.4 * Math.sin(t * 74) * (0.35 + 0.65 * pulse(t, B(88), 2.5) + 0.65 * pulse(t, B(91.5), 2.5));
        const mx = 960 + kick;
        glow(ctx, mx, OY, 90, "white", 0.55 * canA);
        { const ph = ((t - B(84)) / BEAT) % 1; if (t > B(84)) glow(ctx, 960, OY, 380 + 220 * ph, "white", 0.16 * Math.exp(-ph * 3.2) * canA); }
        arrow(ctx, 930 - L + kick - off, OY, 0, L, { w: wv, col: "gold", a: canA, glow: 1.5 });
        arrow(ctx, 990 + L + kick + off, OY, Math.PI, L, { w: wv, col: "red", a: canA, glow: 1.5 });
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = rg(PAL.white.core, 0.95 * canA); ctx.beginPath(); ctx.arc(mx, OY, 16, 0, TAU); ctx.fill(); ctx.restore();
        flowDots(930 - L + kick - off + 20, OY, 925 + kick - off, OY, t, { n: 4 + Math.round(u), speed: 1.2, col: "white", a: 0.8 * canA, r: 10 });
        flowDots(990 + L + kick + off - 20, OY, 995 + kick + off, OY, t, { n: 4 + Math.round(u), speed: 1.2, col: "white", a: 0.8 * canA, r: 10 });
        // 接触点的火花
        const hb = Math.floor((t - B(84)) / (BEAT / 2));
        if (t > B(84)) for (let q = hb - 1; q <= hb; q++) {
          const tt = t - (B(84) + (q * BEAT) / 2);
          if (tt > 0 && tt < 0.5) burst(ctx, 960, OY, tt, { n: 9, seed: 500 + q, speed: 250 + 20 * u, life: 0.5, col: q % 2 ? "gold" : "red", size: 2.4, a: canA });
        }
        // 加码的瞬间：一圈冲击
        for (const n0 of [88, 91.5]) { const tt = t - B(n0); if (tt > 0 && tt < 0.9) ring(ctx, 960, OY, 40 + 260 * easeOut(tt / 0.9), { col: "white", w: 3, a: 0.5 * (1 - tt / 0.9) * canA, squash: 0.5 }); }
        lbPos2.style.left = (960 - 36) + "px"; lbPos2.style.top = (OY + 34) + "px"; vis(lbPos2, ease(rn(t, 84.2, 0.6)) * canA);
        { const hit = t - B(84); if (hit > 0 && hit < 1.0) { glow(ctx, 960, OY, 420 * (0.4 + hit), "white", 0.8 * Math.exp(-hit * 7) * canA); ring(ctx, 960, OY, 40 + 340 * easeOut(hit / 1.0), { col: "red", w: 4, a: 0.8 * (1 - hit) * canA, squash: 0.4 }); burst(ctx, 960, OY, hit, { n: 50, seed: 560, speed: 520, life: 0.9, col: "gold", size: 3, a: canA }); } }
        rdNet.v.textContent = "0";
        vis(rdNet.e, ease(rn(t, 84.0, 0.5)) * canA);
        rdIn.v.textContent = String(Math.round(2 * u));
        vis(rdIn.e, ease(rn(t, 84.6, 0.6)) * canA);
        world.setNote(t < B(88) ? "方向相反、一样大：合力 = 0" : "双方都加码，合力仍然是 0", canA * ease(rn(t, 83.9, 0.5)));
      } else vis(lbPos2, 0);

      /* ---------- 3 · 人人用力，整体原地踏步（n98–n108）+ 公地牧场（类比） ---------- */
      const rA = ease(rn(t, 97.6, 0.8)) * fadeAll;
      if (rA > 0.003) {
        const shift = ease(rn(t, 103.4, 1.4));
        const cx = lerp(960, 600, shift), cy = lerp(520, 540, shift), sc = lerp(1, 0.8, shift);
        const N = 20, grow = ease(rn(t, 99, 7));
        const Lbase = (150 + 120 * grow) * sc;
        ctx.save();
        for (let i = 0; i < N; i++) {
          const ang = (i / N) * TAU + 0.12, fly = easeOut(rn(t, 97.8 + (i % 6) * 0.08, 1.4));
          const tipR = (118 + 20 * Math.sin(t * 3 + i)) * sc, Li = Lbase * (0.88 + 0.24 * Math.sin(i * 1.9 + t * 1.5)) * (0.5 + 0.5 * fly);
          const rr = lerp(900, tipR + Li, fly);
          const tx = cx + Math.cos(ang) * rr, ty = cy + Math.sin(ang) * rr;
          arrow(ctx, tx, ty, ang + Math.PI, Li, { w: 8.5 * sc + 1, col: "gold", a: 0.92 * rA * fly, glow: 0.55, head: 1.0 });
        }
        // 中心：被压住的「整体」
        const jit = 1.6 * Math.sin(t * 61) * rA;
        glow(ctx, cx + jit, cy, 130 * sc, "cyan", 0.42 * rA);
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = rg(PAL.cyan.core, 0.9 * rA);
        ctx.beginPath(); ctx.arc(cx + jit, cy, 44 * sc, 0, TAU); ctx.fill();
        ctx.restore();
        const rdK = fadeAll * (1 - ease(rn(t, 103.2, 0.6)));            // 牧场小图出来前，读数框先收
        rdNet.v.textContent = "0"; vis(rdNet.e, ease(rn(t, 98.2, 0.6)) * rdK);
        rdIn.v.textContent = String(Math.round(36 + 32 * grow)); vis(rdIn.e, ease(rn(t, 98.6, 0.6)) * rdK);
        if (t < B(104)) world.setNote("每个箭头都在用力，合力仍是 0，整体原地不动", ease(rn(t, 98.4, 0.8)));
        // 公地牧场（角落小图）
        const pa = ease(rn(t, 103.8, 1.0)) * fadeAll;
        if (pa > 0.003) {
          const nC = Math.floor(1 + 11 * ease(rn(t, 104.4, 3.0))), gk = ease(rn(t, 104.4, 3.2));
          ctx.save();
          ctx.globalAlpha = pa;
          ctx.beginPath(); ctx.roundRect(PAST.x, PAST.y, PAST.w, PAST.h, 22); ctx.clip();
          const gcol = [lerp(44, 132, gk), lerp(122, 96, gk), lerp(88, 52, gk)];
          const gr = ctx.createLinearGradient(PAST.x, PAST.y, PAST.x, PAST.y + PAST.h);
          gr.addColorStop(0, rg(gcol.map((v) => v * 0.55), 1)); gr.addColorStop(1, rg(gcol, 1));
          ctx.fillStyle = gr; ctx.fillRect(PAST.x, PAST.y, PAST.w, PAST.h);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          for (let i = 0; i < nC; i++) {
            const c = COWS[i], bx = PAST.x + c.x + 10 * Math.sin(t * 0.8 + c.ph), by = PAST.y + c.y + 5 * Math.sin(t * 1.1 + c.ph);
            ctx.beginPath(); ctx.ellipse(bx, by, 17, 11, 0, 0, TAU); ctx.fill();
            ctx.beginPath(); ctx.arc(bx + 15, by - 5, 7, 0, TAU); ctx.fill();
          }
          ctx.restore();
          ctx.save(); ctx.globalAlpha = pa; ctx.strokeStyle = rg(PAL.gold.c, 0.7); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(PAST.x, PAST.y, PAST.w, PAST.h, 22); ctx.stroke(); ctx.restore();
          vis(lbPasture, pa); sealCommons.slap(rn(t, 104.2, 0.8) * (fadeAll > 0.5 ? 1 : 0));
          world.setNote("类比：每多养一头牛，收益归自己，草场的损耗大家分摊", ease(rn(t, 104.4, 0.8)) * fadeAll);
        } else { vis(lbPasture, 0); sealCommons.hide(); }
      } else { vis(lbPasture, 0); sealCommons.hide(); }
    },
  };

  /* =========================================================
     S4 · 反直觉转折  n108 – n160
     n108 坐标场收成一架固定格数的梯子 → n110 想上去的人一批批涌来（箭头 = 人），格数不变、彼此卡位
     → n124 名校名额、热门地段：同样是固定数量的位置 → n136 梯子碎裂 → 碎片重组成 DNA 双螺旋
     → n141 基因片段重组（换锁）→ n148 寄生虫的光弹射向宿主，宿主换锁、成为移动靶
     → n154 对顶的箭头转向，画出一条新的轴 → n158 新轴横过来，成了下一段的地平线
     ========================================================= */
  // —— 梯子与人 ——
  const LAD = { x: 960, half: 170, top: 168, bot: 650, rungs: [215, 295, 375, 455, 535, 615] };
  const NSEAT = LAD.rungs.length, NPEOPLE = 24;
  const SLOTS = Array.from({ length: NPEOPLE - NSEAT }, (_, k) => {
    const row = k % 2, col = Math.floor(k / 2);
    return { x: 500 + col * 115 + (row ? 58 : 0), tip: 668 + row * 30 };
  });
  const T_APP = (i) => B(109.0 + (i - NSEAT) * 0.62);                      // 第 i 个人出现的时刻（i ≥ 6）
  const EV = (() => {                                                       // 卡位事件：一个人上去，一个人下来
    const list = [[113.0, 9, 2], [115.0, 13, 4], [117.0, 8, 1], [119.0, 17, 5], [121.0, 11, 0], [122.4, 15, 3]];
    const occ = Array.from({ length: NSEAT }, (_, s) => s), slotOf = {};
    for (let i = NSEAT; i < NPEOPLE; i++) slotOf[i] = i - NSEAT;
    return list.map(([n, climber, seat]) => {
      const loser = occ[seat], climberSlot = slotOf[climber];
      occ[seat] = climber; slotOf[loser] = climberSlot; delete slotOf[climber];
      return { T: B(n), climber, seat, loser, climberSlot };
    });
  })();
  const locXY = (loc, sc) => loc.seat !== undefined ? [LAD.x, LAD.rungs[loc.seat]] : [SLOTS[loc.slot].x, SLOTS[loc.slot].tip + 40];
  function personPos(i, t) {
    let loc = i < NSEAT ? { seat: i } : { slot: i - NSEAT };
    for (const e of EV) {
      if (t < e.T) break;
      let to = null;
      if (i === e.climber) to = { seat: e.seat }; else if (i === e.loser) to = { slot: e.climberSlot };
      if (!to) continue;
      const u = (t - e.T) / 0.62;
      if (u < 1) {
        const a = locXY(loc), b = locXY(to), k = easeInOut(u), lift = i === e.climber ? -26 * Math.sin(Math.PI * k) : 18 * Math.sin(Math.PI * k);
        return [lerp(a[0], b[0], k) + (i === e.climber ? 0 : 0), lerp(a[1], b[1], k) + lift, true];
      }
      loc = to;
    }
    const p = locXY(loc);
    return [p[0], p[1], false];
  }
  const rdSeats = readout("名额", "6", 250, 214, "cyan"), rdWant = readout("想上去的人", "6", 1370, 214);
  rdWant.e.style.width = "340px"; rdSeats.e.style.width = "260px";

  // —— 名校名额 / 热门地段 两张小卡 ——
  const CARD_L = { x: 150, y: 232, w: 590, h: 420 }, CARD_R = { x: 1180, y: 232, w: 590, h: 420 };
  const cardTitleL = lab("名校名额", CARD_L.x + 40, CARD_L.y + 26, 0, "gold big"), cardTitleR = lab("热门地段", CARD_R.x + 40, CARD_R.y + 26, 0, "gold big");
  const cardSubL = lab("数量是固定的", CARD_L.x + 40, CARD_L.y + 88, 0, "dim"), cardSubR = lab("数量是固定的", CARD_R.x + 40, CARD_R.y + 88, 0, "dim");
  function roundBox(x, y, w, h, a, r = 22) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(6,10,26,0.82)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.strokeStyle = rg(PAL.gold.c, 0.6); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
  function lineArt(pts, a, col = "white", w = 3.2, close = false) {           // 线稿：多段线 + 光
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
    const p = PAL[col];
    for (const [k, al] of [[3.2, 0.1], [1, 0.9]]) {
      ctx.strokeStyle = rg(k > 1 ? p.c : p.core, al * a); ctx.lineWidth = w * k;
      ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); ctx.stroke();
    }
    ctx.restore();
  }
  function drawSchool(cx, cy, a) {                                            // 山墙 + 四根柱 + 台阶
    lineArt([[cx - 100, cy - 38], [cx, cy - 92], [cx + 100, cy - 38], [cx - 100, cy - 38]], a);
    for (let i = -3; i <= 3; i += 2) lineArt([[cx + i * 28, cy - 28], [cx + i * 28, cy + 36]], a);
    lineArt([[cx - 112, cy + 44], [cx + 112, cy + 44]], a); lineArt([[cx - 126, cy + 62], [cx + 126, cy + 62]], a);
  }
  function drawCity(cx, cy, a) {                                              // 三栋楼 + 一颗星
    lineArt([[cx - 110, cy + 62], [cx - 110, cy - 10], [cx - 62, cy - 10], [cx - 62, cy + 62]], a);
    lineArt([[cx - 40, cy + 62], [cx - 40, cy - 84], [cx + 18, cy - 84], [cx + 18, cy + 62]], a);
    lineArt([[cx + 40, cy + 62], [cx + 40, cy - 30], [cx + 100, cy - 30], [cx + 100, cy + 62]], a);
    lineArt([[cx - 126, cy + 62], [cx + 116, cy + 62]], a);
    glow(ctx, cx - 11, cy - 118, 26, "gold", 0.9 * a);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = rg(PAL.gold.core, 0.95 * a); ctx.beginPath(); ctx.arc(cx - 11, cy - 118, 7, 0, TAU); ctx.fill(); ctx.restore();
  }
  function drawSeatsAndCrowd(x0, y0, w, a, t, seed, nSeat = 4, nCrowd = 8) {   // 固定的几个位置 + 往上顶的一排箭头
    const pad = 54, gap = 26, totalW = nSeat * pad + (nSeat - 1) * gap, sx = x0 + (w - totalW) / 2;
    for (let i = 0; i < nSeat; i++) {
      const px = sx + i * (pad + gap), py = y0;
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = rg(PAL.gold.c, 0.28 * a); ctx.strokeStyle = rg(PAL.gold.c, 0.85 * a); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(px, py, pad, pad, 10); ctx.fill(); ctx.stroke(); ctx.restore();
      glow(ctx, px + pad / 2, py + pad / 2, 50, "gold", 0.35 * a);
    }
    const r = rng(seed);
    for (let i = 0; i < nCrowd; i++) {
      const ax = x0 + 46 + (w - 92) * (i + 0.5) / nCrowd + 6 * Math.sin(t * 1.3 + i), L0 = 56 + 26 * r(), L = L0 * (1 + 0.12 * Math.sin(t * 3 + i * 1.7));
      arrow(ctx, ax, y0 + pad + 96, -Math.PI / 2, L, { w: 5, col: "gold", a: 0.78 * a, glow: 0.6, head: 0.9 });
    }
  }

  // —— 梯子碎片（n136 碎裂）——
  const SHARDS = (() => {
    const r = rng(77), out = [];
    const add = (x0, y0, x1, y1, col) => {
      const n = 3;
      for (let k = 0; k < n; k++) {
        const a0 = k / n, a1 = (k + 1) / n, cx = lerp(x0, x1, (a0 + a1) / 2), cy = lerp(y0, y1, (a0 + a1) / 2);
        const dx = (x1 - x0) / n, dy = (y1 - y0) / n, ang = Math.atan2(y1 - y0, x1 - x0), ox = cx - 960, oy = cy - 450, d = Math.hypot(ox, oy) || 1;
        out.push({ cx, cy, h: Math.hypot(dx, dy) / 2, ang, vx: (ox / d) * (260 + r() * 520) + (r() - 0.5) * 200, vy: (oy / d) * (200 + r() * 360) - 140 - r() * 260, w: (r() - 0.5) * 9, col });
      }
    };
    for (const sx of [-LAD.half, LAD.half]) add(LAD.x + sx, LAD.top, LAD.x + sx, LAD.bot, "white");
    for (const ry of LAD.rungs) add(LAD.x - LAD.half, ry, LAD.x + LAD.half, ry, "gold");
    for (const c of [CARD_L, CARD_R]) { add(c.x, c.y, c.x + c.w, c.y, "gold"); add(c.x + c.w, c.y, c.x + c.w, c.y + c.h, "gold"); add(c.x + c.w, c.y + c.h, c.x, c.y + c.h, "gold"); add(c.x, c.y + c.h, c.x, c.y, "gold"); }
    return out;
  })();
  const T_SHATTER = B(136);

  const s4 = {
    state(t) {
      const live = t > B(107.2) && t < B(161);
      if (!live) {
        for (const e of [rdSeats.e, rdWant.e, cardTitleL, cardTitleR, cardSubL, cardSubR]) vis(e, 0);
        return;
      }
      /* ---------- 梯子 + 人（n108–n136） ---------- */
      const ladA = ease(rn(t, 107.6, 1.2)) * (t < T_SHATTER ? 1 : 0);
      const toCards = easeInOut(rn(t, 123.4, 1.6));                      // 举例时梯子缩到中间、变暗
      const sc = lerp(1, 0.66, toCards), dA = lerp(1, 0.55, toCards);
      const MX = (x) => 960 + (x - 960) * sc, MY = (y) => 430 + (y - 430) * sc;
      if (ladA > 0.003) {
        // 两根竖杆自下而上长出来，格子一级级亮起
        const grow = ease(rn(t, 108.0, 1.6));
        const yTop = lerp(LAD.bot, LAD.top, grow);
        for (const sx of [-LAD.half, LAD.half]) beam(ctx, MX(LAD.x + sx), MY(LAD.bot), MX(LAD.x + sx), MY(yTop), { col: "white", w: 7 * sc, a: 0.85 * ladA * dA, a0: 0.4, a1: 1, glow: 1 });
        LAD.rungs.forEach((ry, i) => {
          const k = ease(rn(t, 108.6 + 0.28 * (NSEAT - 1 - i), 0.8)) * ladA;
          if (k < 0.01) return;
          beam(ctx, MX(LAD.x - LAD.half), MY(ry), MX(LAD.x - LAD.half + 2 * LAD.half * k), MY(ry), { col: "gold", w: 6 * sc, a: 0.95 * dA * ladA, a0: 1, a1: 1, glow: 1 });
          ring(ctx, MX(LAD.x), MY(ry), 24 * sc, { col: "cyan", w: 2.5, a: 0.7 * k * dA, glow: 0.6 });   // 位子
        });
        // 人 = 向上的箭头
        const wob = (i) => 1 + 0.13 * Math.sin(t * 3.1 + i * 1.9);
        for (let i = 0; i < NPEOPLE; i++) {
          const born = i < NSEAT ? ease(rn(t, 109.2 + i * 0.12, 0.8)) : ease(clamp((t - T_APP(i)) / 0.6));
          if (born < 0.01) continue;
          const [px, py, moving] = personPos(i, t);
          const seated = !moving && (i < NSEAT ? true : false);
          let isSeat = false;
          for (const s of [0, 1, 2, 3, 4, 5]) if (Math.abs(px - LAD.x) < 1 && Math.abs(py - LAD.rungs[s]) < 1) isSeat = true;
          const L = (isSeat ? 74 : 80 * wob(i)) * sc, col = "gold";
          const al = (isSeat ? 1 : 0.74 + 0.1 * Math.sin(i)) * born * dA * ladA;
          const cx = MX(px), cy = MY(py) + (1 - born) * 40;
          arrow(ctx, cx, cy + L / 2, -Math.PI / 2, L, { w: (isSeat ? 9 : 6) * sc, col, a: al, glow: isSeat ? 1.3 : 0.7, head: 1.0 });
          if (isSeat) glow(ctx, cx, cy, 44 * sc, "white", 0.28 * born * dA * ladA);
        }
        // 每次卡位：位子上一闪
        for (const e of EV) { const tt = t - (e.T + 0.62); if (tt > 0 && tt < 0.7) { ring(ctx, MX(LAD.x), MY(LAD.rungs[e.seat]), (30 + 90 * easeOut(tt / 0.7)) * sc, { col: "white", w: 3, a: 0.8 * (1 - tt / 0.7) * dA, glow: 1 }); burst(ctx, MX(LAD.x), MY(LAD.rungs[e.seat]), tt, { n: 14, seed: 600 + e.seat, speed: 260, life: 0.7, col: "gold", size: 2.4, a: dA }); } }
        { const tt = t - B(116); if (tt > 0 && tt < 0.9) { ring(ctx, MX(LAD.x), MY(690), (60 + 760 * easeOut(tt / 0.9)) * sc, { col: "gold", w: 3, a: 0.55 * (1 - tt / 0.9) * dA, squash: 0.28 }); glow(ctx, MX(LAD.x), MY(680), 440 * sc, "gold", 0.3 * Math.exp(-tt * 5) * dA); } }   // n116：音乐回升，人群涌来
        // 读数：名额不变，人数一路涨
        const cnt = NSEAT + EV.length * 0 + Array.from({ length: NPEOPLE - NSEAT }, (_, k) => (t > T_APP(NSEAT + k) ? 1 : 0)).reduce((a, b) => a + b, 0);
        const rdK = ease(rn(t, 109.4, 0.6)) * (1 - ease(rn(t, 123.2, 0.6)));
        rdSeats.v.textContent = String(NSEAT); rdWant.v.textContent = String(cnt);
        vis(rdSeats.e, rdK); vis(rdWant.e, rdK);
        if (t < B(124)) world.setNote("梯子的格数是固定的：谁上去了，就有人下来", ease(rn(t, 110.0, 0.8)) * (1 - ease(rn(t, 122.8, 0.6))));
      } else { vis(rdSeats.e, 0); vis(rdWant.e, 0); }

      /* ---------- 名校名额 · 热门地段（n124–n136） ---------- */
      const cardA = ease(rn(t, 124, 1.0)) * (t < T_SHATTER ? 1 : 0);
      if (cardA > 0.003) {
        const slide = (1 - ease(rn(t, 124, 1.4))) * 120;
        roundBox(CARD_L.x - slide, CARD_L.y, CARD_L.w, CARD_L.h, cardA);
        roundBox(CARD_R.x + slide, CARD_R.y, CARD_R.w, CARD_R.h, cardA);
        drawSchool(CARD_L.x + CARD_L.w / 2 - slide, CARD_L.y + 200, cardA * 0.95);
        drawCity(CARD_R.x + CARD_R.w / 2 + slide, CARD_R.y + 200, cardA * 0.95);
        drawSeatsAndCrowd(CARD_L.x - slide, CARD_L.y + 290, CARD_L.w, cardA, t, 5, 4, 8);
        drawSeatsAndCrowd(CARD_R.x + slide, CARD_R.y + 290, CARD_R.w, cardA, t, 8, 4, 8);
        cardTitleL.style.left = (CARD_L.x + 40 - slide) + "px"; cardSubL.style.left = (CARD_L.x + 40 - slide) + "px";
        cardTitleR.style.left = (CARD_R.x + 40 + slide) + "px"; cardSubR.style.left = (CARD_R.x + 40 + slide) + "px";
        for (const e of [cardTitleL, cardTitleR, cardSubL, cardSubR]) vis(e, cardA);
        world.setNote("名额、地段：数量固定，说到底是排名", ease(rn(t, 124.6, 0.8)) * (t < T_SHATTER ? 1 - ease(rn(t, 135.0, 0.6)) : 0));
      } else for (const e of [cardTitleL, cardTitleR, cardSubL, cardSubR]) vis(e, 0);

      /* ---------- 碎裂（n136） ---------- */
      const tau = t - T_SHATTER;
      if (tau > 0 && tau < 1.5) {
        const flash = Math.exp(-tau * 10);
        glow(ctx, 960, 450, 620, "white", 0.55 * flash);
        for (const s of SHARDS) {
          const x = s.cx + s.vx * tau, y = s.cy + s.vy * tau + 520 * tau * tau, an = s.ang + s.w * tau, al = (1 - tau / 1.5) ** 1.3;
          const dx = Math.cos(an) * s.h, dy = Math.sin(an) * s.h;
          beam(ctx, x - dx, y - dy, x + dx, y + dy, { col: s.col, w: 5, a: al, a0: 1, a1: 1, glow: 1 });
        }
        // 一道裂纹：从中心闪过
        const k = ease(clamp(tau / 0.16));
        if (tau < 0.3) {
          ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = rg(PAL.white.core, 0.9 * (1 - tau / 0.3)); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(960, 40); ctx.lineTo(930, 190 * k); ctx.lineTo(985, 330 * k); ctx.lineTo(940, 470 * k); ctx.lineTo(990, 620 * k); ctx.lineTo(950, 780 * k); ctx.stroke(); ctx.restore();
        }
      }
    },
  };

  /* ---------- S4 下半：DNA 重组 → 宿主换锁 / 寄生虫 → 换轴 ---------- */
  // —— DNA 双螺旋（梯子的碎片重组而成）——
  const HX0 = 200, HLEN = 1520, HCY = 470, HR = 112, HPITCH = 380, NB = Math.floor(HLEN / 15), NR = 29, HTILT = -0.1;
  const BASEPAIR = [["gold", "cyan"], ["cyan", "gold"], ["red", "white"], ["white", "red"]];
  const RUNG_X = Array.from({ length: NR }, (_, i) => HX0 + 30 + (i * (HLEN - 60)) / (NR - 1));
  const FLY = (() => { const r = rng(91); const mk = (n) => Array.from({ length: n }, () => [r() * TAU, 480 + r() * 620, r() * 0.9]); return { beads: mk(2 * NB), rungs: mk(NR) }; })();
  const HEV = [[141.0, 560, 980], [143.2, 1000, 1520], [145.2, 780, 1280]];           // 重组：[开始拍, x 起, x 止]
  const helixXY = (x, k, t) => { const th = (TAU * (x - HX0)) / HPITCH + t * 1.05 + k * Math.PI; return [x, HCY + HR * Math.sin(th), Math.cos(th)]; };
  const flipAt = (x, t) => { let c = 0; for (const [n, xa, xb] of HEV) { const tt = t - B(n); if (tt <= 0) continue; if (x >= xa && x <= xa + (xb - xa) * ease(tt / 0.9)) c++; } return c & 1; };
  function drawHelix(t, A) {
    const T0 = B(137.6);
    ctx.save();
    ctx.translate(960, HCY); ctx.rotate(HTILT); ctx.translate(-960, -HCY);
    const beads = [];
    for (let k = 0; k < 2; k++) for (let m = 0; m < NB; m++) {
      const x = HX0 + ((m + 0.5) * HLEN) / NB, [px, py, z] = helixXY(x, k, t), f = FLY.beads[k * NB + m];
      const u = ease(clamp((t - T0 - f[2] * BEAT) / (BEAT * 2.4)));
      beads.push({ x: px + Math.cos(f[0]) * f[1] * (1 - u), y: py + Math.sin(f[0]) * f[1] * (1 - u), z, u, col: (k ^ flipAt(x, t)) ? "gold" : "cyan" });
    }
    const bead = (b) => {
      const zz = 0.5 + 0.5 * b.z, al = (0.4 + 0.6 * zz) * b.u * A;
      glow(ctx, b.x, b.y, 6 + 7 * zz, b.col, 0.95 * al);
    };
    ctx.globalCompositeOperation = "lighter";
    for (const b of beads) if (b.z < 0) bead(b);
    // 梯级：每一级两半，按碱基配对着色；重组时两半互换
    for (let i = 0; i < NR; i++) {
      const x = RUNG_X[i], [x0, y0, z0] = helixXY(x, 0, t), [x1, y1, z1] = helixXY(x, 1, t), f = FLY.rungs[i];
      const u = ease(clamp((t - T0 - 0.2 * BEAT - f[2] * BEAT) / (BEAT * 2.4))), off = 1 - u;
      const ax = x0 + Math.cos(f[0]) * f[1] * off, ay = y0 + Math.sin(f[0]) * f[1] * off, bx = x1 + Math.cos(f[0] + 1.7) * f[1] * off, by = y1 + Math.sin(f[0] + 1.7) * f[1] * off;
      const [c0, c1] = BASEPAIR[(i * 7 + 1) % 4], sw = flipAt(x, t), mx = (ax + bx) / 2, my = (ay + by) / 2, zz = 0.5 + 0.25 * (z0 + z1) + 0.25;
      const al = (0.35 + 0.55 * zz) * u * A;
      beam(ctx, ax, ay, mx, my, { col: sw ? c1 : c0, w: 3.4, a: al, a0: 1, a1: 0.7, glow: 0.8 });
      beam(ctx, bx, by, mx, my, { col: sw ? c0 : c1, w: 3.4, a: al, a0: 1, a1: 0.7, glow: 0.8 });
    }
    for (const b of beads) if (b.z >= 0) bead(b);
    // 重组：交叉扫过的亮点和 X
    for (const [n, xa, xb] of HEV) {
      const tt = t - B(n);
      if (tt <= 0 || tt > 1.3) continue;
      const xf = xa + (xb - xa) * ease(clamp(tt / 0.9)), k = 1 - clamp(tt / 1.3);
      beam(ctx, xf, HCY - HR - 34, xf, HCY + HR + 34, { col: "white", w: 4, a: 0.9 * k * A, a0: 0.1, a1: 0.1, glow: 1.4 });
      beam(ctx, xf - 18, HCY - HR - 34, xf - 18, HCY + HR + 34, { col: "white", w: 2, a: 0.4 * k * A, a0: 0.05, a1: 0.05 });
      glow(ctx, xf, HCY, 120, "white", 0.4 * k * A);
    }
    ctx.restore();
  }

  // —— 宿主 / 寄生虫 ——
  const HOSTP = [[1250, 480], [1500, 350], [1130, 570], [1510, 560], [1310, 410]];
  const HOP = [149.6, 150.6, 152.0, 153.2];
  const CODES = [[1, 3, 0, 2, 1], [3, 0, 2, 1, 3], [2, 1, 3, 0, 2], [0, 2, 1, 3, 0], [1, 0, 3, 2, 1]];
  const PARA = [470, 480];
  const SHOTS = [{ n: 148.6, aim: 0 }, { n: 150.2, aim: 1 }, { n: 151.6, aim: 2 }, { n: 152.8, aim: 3 }];
  function hostState(t) {
    let k = 0;
    for (let i = 0; i < HOP.length; i++) if (t >= B(HOP[i])) k = i + 1;
    const T = k ? B(HOP[k - 1]) : 0, u = k ? easeInOut(clamp((t - T) / (0.4 * BEAT * 1.0))) : 1;
    const a = HOSTP[k ? k - 1 : 0], b = HOSTP[k];
    const arc = k ? -60 * Math.sin(Math.PI * clamp((t - T) / (0.4 * BEAT))) : 0;
    return { k, x: k ? lerp(a[0], b[0], u) : a[0], y: (k ? lerp(a[1], b[1], u) : a[1]) + arc, T, moving: k > 0 && t - T < 0.4 * BEAT };
  }
  function drawCode(cx, cy, code, a, col, scale = 1) {
    const hs = [26, 44, 62, 80];
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let j = 0; j < 5; j++) {
      const h = hs[code[j]] * scale, w = 14 * scale, x = cx + (j - 2) * 26 * scale - w / 2, y = cy + 40 * scale - h;
      ctx.fillStyle = rg(PAL[col].c, 0.85 * a); ctx.beginPath(); ctx.roundRect(x, y, w, h, 4 * scale); ctx.fill();
      ctx.fillStyle = rg(PAL[col].core, 0.5 * a); ctx.fillRect(x + w * 0.3, y + 3, w * 0.25, h - 6);
    }
    ctx.restore();
  }
  /** 挂锁：弓 + 锁身 + 锁孔，锁身下方挂五根「销」（高低 = 这把锁的密码） */
  function drawLock(cx, cy, code, a) {
    const hs = [14, 24, 34, 44];
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    ctx.strokeStyle = rg(PAL.cyan.c, 0.95 * a); ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy - 26, 21, Math.PI, 0); ctx.lineTo(cx + 21, cy - 12); ctx.moveTo(cx - 21, cy - 26); ctx.lineTo(cx - 21, cy - 12); ctx.stroke();
    ctx.fillStyle = rg(PAL.cyan.c, 0.5 * a); ctx.beginPath(); ctx.roundRect(cx - 36, cy - 12, 72, 50, 9); ctx.fill();
    ctx.strokeStyle = rg(PAL.cyan.core, 0.9 * a); ctx.lineWidth = 3.5; ctx.stroke();
    ctx.restore();
    // 锁身上的密码：五根深色的槽，高低就是这把锁的样子（每次换锁都会变）
    ctx.save(); ctx.fillStyle = "rgba(6,16,36," + (0.85 * a).toFixed(3) + ")";
    for (let j = 0; j < 5; j++) { const x = cx + (j - 2) * 13, h = hs[code[j]] * 0.7; ctx.beginPath(); ctx.roundRect(x - 3.5, cy + 34 - h, 7, h, 2); ctx.fill(); }
    ctx.restore();
  }
  /** 钥匙：圆环头 + 杆 + 五个齿（齿长 = 密码），齿的高低与对应的锁一样才「合得上」 */
  function drawKey(cx, cy, code, a, sc = 1) {
    const hs = [11, 20, 29, 38];
    ctx.save(); ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    ctx.strokeStyle = rg(PAL.gold.c, 0.95 * a); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(-46, 0, 14, 0, TAU); ctx.moveTo(-32, 0); ctx.lineTo(48, 0); ctx.stroke();
    for (let j = 0; j < 5; j++) { const x = -10 + j * 14; ctx.beginPath(); ctx.moveTo(x, 2); ctx.lineTo(x, 2 + hs[code[j]]); ctx.stroke(); }
    ctx.strokeStyle = rg(PAL.gold.core, 0.8 * a); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(46, 0); ctx.stroke();
    ctx.restore();
  }
  const lbHost = lab("宿主", 0, 0, 0, "cyan c"), lbPara = lab("寄生虫", 0, 0, 0, "red c"), lbRecomb = lab("基因重组", 0, 0, 0, "gold big");

  const s4b = {
    state(t) {
      const live = t > B(136.4) && t < B(160.6);
      if (!live) { vis(lbHost, 0); vis(lbPara, 0); vis(lbRecomb, 0); return; }

      /* ---------- DNA 双螺旋 + 重组（n137.6–n148） ---------- */
      const hA = ease(rn(t, 137.6, 0.6)) * (1 - ease(rn(t, 146.4, 1.6)));
      if (hA > 0.003) {
        drawHelix(t, hA);
        vis(lbRecomb, ease(rn(t, 140.6, 0.8)) * (1 - ease(rn(t, 145.8, 0.6))) * hA);
        lbRecomb.style.left = "236px"; lbRecomb.style.top = "232px";
        world.setNote("红皇后：解释「性」为何存在的主流假说之一", ease(rn(t, 138.4, 0.8)) * (1 - ease(rn(t, 146.2, 0.6))));
      } else vis(lbRecomb, 0);

      /* ---------- 宿主换锁，寄生虫总在追（n147.6–n154） ---------- */
      const eA = ease(rn(t, 147.4, 0.9)) * (1 - ease(rn(t, 153.4, 0.8)));
      if (eA > 0.003) {
        const h = hostState(t), pcode = CODES[Math.max(0, hostState(t - 1.25 * BEAT).k)], hcode = CODES[h.k];
        // 宿主：外环 + 内环 + 锁（五根高低不一的条）
        const wob = 1 + 0.025 * Math.sin(t * 5);
        ring(ctx, h.x, h.y, 118 * wob, { col: "cyan", w: 5, a: 0.95 * eA, glow: 1.3 });
        ring(ctx, h.x, h.y, 96, { col: "cyan", w: 2, a: 0.35 * eA, glow: 0 });
        glow(ctx, h.x, h.y, 170, "cyan", 0.22 * eA);
        drawLock(h.x, h.y - 22, hcode, eA);
        // 每次换锁：一圈白光 + 火花
        for (const hn of HOP) { const tt = t - B(hn); if (tt > 0 && tt < 0.7) { ring(ctx, h.x, h.y, 118 + 120 * easeOut(tt / 0.7), { col: "white", w: 3, a: 0.7 * (1 - tt / 0.7) * eA, glow: 1 }); burst(ctx, h.x, h.y, tt, { n: 16, seed: 700 + Math.floor(hn * 10), speed: 300, life: 0.7, col: "cyan", size: 2.6, a: eA }); } }
        // 寄生虫：红金的尖刺团 + 钥匙（跟上一把锁）
        const pr = 62 + 4 * Math.sin(t * 6);
        glow(ctx, PARA[0], PARA[1], 150, "red", 0.28 * eA);
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < 10; i++) {
          const an = (i / 10) * TAU + t * 0.6, r0 = pr, r1 = pr + 26 + 10 * Math.sin(t * 7 + i);
          ctx.strokeStyle = rg(PAL.red.c, 0.9 * eA); ctx.lineWidth = 4; ctx.lineCap = "round";
          ctx.beginPath(); ctx.moveTo(PARA[0] + Math.cos(an) * r0, PARA[1] + Math.sin(an) * r0); ctx.lineTo(PARA[0] + Math.cos(an) * r1, PARA[1] + Math.sin(an) * r1); ctx.stroke();
        }
        ctx.strokeStyle = rg(PAL.red.core, 0.95 * eA); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(PARA[0], PARA[1], pr, 0, TAU); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = "rgba(28,8,14," + (0.9 * eA).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(PARA[0], PARA[1], pr - 3, 0, TAU); ctx.fill();
        drawKey(PARA[0] + 4, PARA[1] - 8, pcode, eA, 0.72);
        // 光弹：红色的小箭头，朝它发射那一刻宿主所在的位置飞去
        for (const s of SHOTS) {
          const T = B(s.n), u = (t - T) / (0.7 * BEAT);
          if (u < 0 || u > 1.5) continue;
          const aim = HOSTP[s.aim], dx = aim[0] - PARA[0], dy = aim[1] - PARA[1], dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
          const k = easeIn(clamp(u)), px = PARA[0] + Math.cos(ang) * (pr + 40 + (dist - pr - 40 - 118) * k), py = PARA[1] + Math.sin(ang) * (pr + 40 + (dist - pr - 40 - 118) * k);
          if (u <= 1) arrow(ctx, px - Math.cos(ang) * 110, py - Math.sin(ang) * 110, ang, 110, { w: 8, col: "red", a: eA, glow: 1.3 });
          if (u > 1) {                                    // 抵达：宿主还在不在这
            const tt = (u - 1) * 0.7 * BEAT, hAt = hostState(T + 0.7 * BEAT), hit = Math.hypot(hAt.x - aim[0], hAt.y - aim[1]) < 24;
            const ex = aim[0] - Math.cos(ang) * 118, ey = aim[1] - Math.sin(ang) * 118;
            if (hit) { glow(ctx, ex, ey, 230 * (1 - tt * 1.2), "red", 0.8 * eA * (1 - tt * 1.6 > 0 ? 1 - tt * 1.6 : 0)); burst(ctx, ex, ey, tt, { n: 26, seed: 800, speed: 360, life: 0.6, col: "red", size: 3, a: eA }); }
            else {                                        // 扑空：准星留在原地
              const kk = 1 - clamp(tt / 0.9);
              ring(ctx, aim[0], aim[1], 118, { col: "red", w: 3, a: 0.75 * kk * eA, glow: 0.8, dash: [14, 10] });
              beam(ctx, aim[0] - 140, aim[1], aim[0] + 140, aim[1], { col: "red", w: 2, a: 0.5 * kk * eA });
              beam(ctx, aim[0], aim[1] - 140, aim[0], aim[1] + 140, { col: "red", w: 2, a: 0.5 * kk * eA });
              burst(ctx, ex, ey, tt, { n: 10, seed: 810 + s.aim, speed: 200, life: 0.45, col: "red", size: 2.2, a: eA });
            }
          }
        }
        lbHost.style.left = (h.x - 36) + "px"; lbHost.style.top = (h.y + 134) + "px"; vis(lbHost, eA);
        lbPara.style.left = (PARA[0] - 52) + "px"; lbPara.style.top = (PARA[1] + 98) + "px"; vis(lbPara, eA);
        world.setNote("重组让宿主不断「换锁」，成为寄生虫难以锁定的移动靶", ease(rn(t, 148.2, 0.8)) * (1 - ease(rn(t, 153.2, 0.6))));
      } else { vis(lbHost, 0); vis(lbPara, 0); }

      /* ---------- 换轴（n153.6–n160）：对顶的两支箭转向，叠成一支，沿着一条新的轴往上走；轴再横过来，成了下一段的地平线 ---------- */
      const aA = ease(rn(t, 153.6, 0.5)) * (1 - ease(rn(t, 159.6, 0.8))), arA = 1 - ease(rn(t, 157.6, 0.9));   // 箭比轴先退
      if (aA > 0.003) {
        const L = 250, turn = easeInOut(rn(t, 154.0, 1.2)), join = easeInOut(rn(t, 155.3, 0.9));
        const slide = easeOut(rn(t, 153.5, 0.5));
        const psi = easeInOut(rn(t, 158.0, 1.6)) * (Math.PI / 2);                 // 轴从竖到横
        const axLen = 290, cx = 960, cy = 470;
        // 新轴：从中心向两端长出来
        const axk = ease(rn(t, 154.2, 1.3));
        const sx = Math.sin(psi), sy = -Math.cos(psi);
        const ax0 = cx - sx * axLen * axk, ay0 = cy - sy * axLen * axk, ax1 = cx + sx * axLen * axk, ay1 = cy + sy * axLen * axk;
        beam(ctx, ax0, ay0, ax1, ay1, { col: "cyan", w: 3, a: 0.9 * aA, a0: 0.3, a1: 0.3, glow: 1.4 });
        for (let i = -5; i <= 5; i++) { const px = cx + sx * i * 52, py = cy + sy * i * 52; if (Math.abs(i * 52) < axLen * axk) beam(ctx, px - sy * 9, py + sx * 9, px + sy * 9, py - sx * 9, { col: "cyan", w: 2, a: 0.6 * aA }); }
        // 两支箭
        const tipG = [930 - (1 - slide) * 300, 500], tipR = [990 + (1 - slide) * 300, 500];
        const thG = -Math.PI / 2 * turn, thR = Math.PI + (Math.PI / 2) * turn, col = mixPal("gold", "cyan", join);
        const shift = join * 0;                                                    // 对齐后两支重叠
        const gx = lerp(tipG[0], 960, join), rx = lerp(tipR[0], 960, join);
        const gy = lerp(tipG[1], 500, join), ry = lerp(tipR[1], 500, join);
        const gTail = [gx - Math.cos(thG) * L, gy - Math.sin(thG) * L], rTail = [rx - Math.cos(thR) * L, ry - Math.sin(thR) * L];
        const climb = join >= 1 ? 160 * (t - B(156.2)) : 0;                         // 合体后沿轴上行
        const lenM = L + (join >= 1 ? 190 * clamp((t - B(156.2)) / 1.5) : 0);
        const mergedA = join > 0.98 ? 1 : 0;
        if (!mergedA) {
          arrow(ctx, gTail[0], gTail[1], thG, L, { w: 12, col: turn > 0.6 ? col : "gold", a: aA, glow: 1.5 });
          arrow(ctx, rTail[0], rTail[1], thR, L, { w: 12, col: mixPal("red", "cyan", join), a: aA, glow: 1.5 });
        } else {
          arrow(ctx, 960, 500 + L - climb, -Math.PI / 2, lenM, { w: 16 + 2 * Math.sin(t * 6), col: "cyan", a: aA * arA, glow: 1.9 });
          const tt = t - B(156.0);
          glow(ctx, 960, 500, 220, "white", 0.7 * Math.exp(-tt * 5) * aA);
          // 沿轴飘上去的金色光点
          for (let i = 0; i < 12; i++) { const ph = (t * 0.5 + i / 12) % 1; glow(ctx, 960 + 12 * Math.sin(i * 2.3 + t * 2), 760 - 600 * ph, 8 + 6 * Math.sin(i), "gold", 0.8 * Math.sin(Math.PI * ph) * aA); }
        }
        if (turn > 0 && turn < 1) { glow(ctx, 960, 500, 90 + 150 * Math.sin(Math.PI * turn), "white", 0.5 * aA); }
        world.setNote("类比：把「换轴」用在努力上——不再对顶，而是朝同一个新方向相加", ease(rn(t, 154.6, 0.8)) * (1 - ease(rn(t, 159.0, 0.6))));
      }
    },
  };

  /* =========================================================
     S5 · 现实落点  n160 – n198
     新轴横成地平线 → 一块有限的田（梯形、金边），n162 起一个个工人（朝下的箭头）走进来，越来越多，田还是那块田
     → n172 田挪到左边，右边冒出示意图：投入一路涨，人均产出走平 → n184 数据卡：周平均 49.0 小时（标口径）
     → n194 一切缓下来，箭头慢慢朝同一个方向摆正，交给 S6
     ========================================================= */
  const FLD = { cx: 960, yTop: 296, yBot: 690, wTop: 280, wBot: 600 }, NROW = 9;
  const STALKS = (() => {
    const r = rng(131), out = [];
    for (let row = 0; row < NROW; row++) { const n = 12 + (row > 4 ? 2 : 0); for (let c = 0; c < n; c++) out.push({ row, u: -0.94 + (1.88 * (c + 0.5 + (r() - 0.5) * 0.3)) / n, ph: r() * 6.28, h: 0.8 + r() * 0.45 }); }
    return out;
  })();
  const rowV = (row) => ((row + 0.5) / NROW) ** 1.3;                                  // 越近越稀（透视）
  const WORKERS = (() => {                                                           // 20 个工人的落点：确定性、彼此留出间距
    const r = rng(141), out = [];
    for (let tries = 0; out.length < 20 && tries < 2000; tries++) {
      const u = -0.84 + 1.68 * r(), v = 0.16 + 0.8 * r(), x = u * (FLD.wTop + (FLD.wBot - FLD.wTop) * v), y = v * 400;
      if (out.every((p) => Math.hypot(p.x - x, (p.y - y) * 1.6) > 118 + 30 * v)) out.push({ u, v, x, y, side: r() < 0.5 ? -1 : 1, ph: r() * 6.28 });
    }
    return out;
  })();
  const T_WK = (i) => (i < 4 ? B(161.4 + i * 0.3) : B(162.2 + (i - 4) * 0.52));
  const lbSame2 = lab("同一块田", 0, 0, 0, "cyan c"), lbIn = lab("投入", 0, 0, 0, "gold"), lbPer = lab("人均产出", 0, 0, 0, "cyan");
  const pillSketch = lab("示意", 1258, 242, 0, "dim");
  const dcard = el('<div class="dk">周平均工作时间</div><div class="dv">49.0</div><div class="du">小时 / 周</div><div class="ds">全国企业就业人员 · 2024 年 12 月 · 国家统计局</div>', "card dcard", "stage");
  const dv = dcard.querySelector(".dv");
  const CH = { x: 1236, y: 262, w: 500, h: 290 };                                     // 示意图的框

  const s5 = {
    state(t) {
      const live = t > B(158) && t < B(199);
      if (!live) { for (const e of [lbSame2, lbIn, lbPer, pillSketch, dcard]) vis(e, 0); return; }
      const outK = 1 - ease(rn(t, 196.6, 1.4));                                       // n196.6 起交给 S6
      /* ---- 地平线：S4 的新轴横过来之后，这条线成了天边（n159.2 起铺满）---- */
      const hz = ease(rn(t, 158.8, 1.4)) * outK * (1 - ease(rn(t, 163.2, 1.6)) * 0.85), hzY = lerp(470, FLD.yTop, easeInOut(rn(t, 159.4, 1.6)));
      beam(ctx, 960 - 960 * hz, hzY, 960, hzY, { col: "cyan", w: 2.4, a: 0.7 * hz, a0: 0.05, a1: 1, glow: 1 });
      beam(ctx, 960, hzY, 960 + 960 * hz, hzY, { col: "cyan", w: 2.4, a: 0.7 * hz, a0: 1, a1: 0.05, glow: 1 });

      /* ---- 田 ---- */
      const open = ease(rn(t, 159.8, 1.8));                                              // 从地平线向近处展开（几何）
      const shiftK = easeInOut(rn(t, 171.4, 1.6)) * (1 - easeInOut(rn(t, 183.6, 1.4)) * 0);
      const dimK = lerp(1, 0.55, ease(rn(t, 183.6, 1.0)));
      const SC = lerp(1, 0.78, shiftK), SH = lerp(0, -330, shiftK);
      const MX = (x) => 960 + (x - 960) * SC + SH, MY = (y) => 520 + (y - 520) * SC;
      const fy = (v) => MY(FLD.yTop + (FLD.yBot - FLD.yTop) * v * open), fhw = (v) => (FLD.wTop + (FLD.wBot - FLD.wTop) * v * open) * SC;
      const fpt = (u, v) => [MX(FLD.cx) + u * fhw(v), fy(v), 0.5 + 0.5 * v];
      if (open > 0.01) {
        const A = open * dimK * outK;
        // 地面：很淡的金色
        const tl = fpt(-1, 0), tr = fpt(1, 0), br = fpt(1, 1), bl = fpt(-1, 1);
        ctx.save();
        const gr = ctx.createLinearGradient(0, tl[1], 0, bl[1]);
        gr.addColorStop(0, rg(PAL.amber.c, 0.03 * A)); gr.addColorStop(1, rg(PAL.amber.c, 0.17 * A));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(tl[0], tl[1]); ctx.lineTo(tr[0], tr[1]); ctx.lineTo(br[0], br[1]); ctx.lineTo(bl[0], bl[1]); ctx.closePath(); ctx.fill();
        ctx.restore();
        // 垄
        for (let row = 0; row < NROW; row++) { const v = rowV(row), a = fpt(-1, v), b = fpt(1, v); beam(ctx, a[0], a[1], b[0], b[1], { col: "amber", w: 1.2, a: 0.28 * A, a0: 0.6, a1: 0.6 }); }
        // 稻：一根根金线，顶上一点谷粒；轻轻摇
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
        for (const s of STALKS) {
          const v = rowV(s.row), p = fpt(s.u, v), sc = p[2] * SC, h = 34 * sc * s.h, sway = 3 * sc * Math.sin(t * 1.6 + s.ph);
          ctx.strokeStyle = rg(PAL.amber.c, 0.55 * A); ctx.lineWidth = 2 * sc + 0.4;
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] + sway * 0.4, p[1] - h * 0.6, p[0] + sway, p[1] - h); ctx.stroke();
          ctx.fillStyle = rg(PAL.gold.core, 0.7 * A); ctx.beginPath(); ctx.arc(p[0] + sway, p[1] - h, 2.4 * sc + 0.6, 0, TAU); ctx.fill();
        }
        ctx.restore();
        // 田埂：金边（这块田的大小，始终不变）
        const edge = [tl, tr, br, bl, tl];
        ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round";
        for (const [k, al] of [[7, 0.1], [2.6, 0.9]]) { ctx.strokeStyle = rg(PAL.gold.c, al * A); ctx.lineWidth = k; ctx.beginPath(); edge.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); }
        ctx.restore();
        // 「同一块田」：下沿一条标尺
        const rk = ease(rn(t, 163, 1.0)) * A;
        beam(ctx, bl[0], bl[1] + 22, br[0], br[1] + 22, { col: "cyan", w: 2, a: 0.8 * rk, a0: 1, a1: 1 });
        beam(ctx, bl[0], bl[1] + 12, bl[0], bl[1] + 32, { col: "cyan", w: 2, a: 0.8 * rk }); beam(ctx, br[0], br[1] + 12, br[0], br[1] + 32, { col: "cyan", w: 2, a: 0.8 * rk });
        lbSame2.style.left = ((bl[0] + br[0]) / 2 - 52) + "px"; lbSame2.style.top = (bl[1] + 32) + "px"; vis(lbSame2, rk);

        // 工人：朝下的箭头，越来越多
        const calm = ease(rn(t, 194, 3.4));
        for (let i = 0; i < WORKERS.length; i++) {
          const w = WORKERS[i], k = clamp((t - T_WK(i)) / 0.7);
          if (k <= 0) continue;
          const p = fpt(w.u, w.v), sc = p[2] * SC, e = easeOut(k);
          const sx = p[0] + w.side * 560 * (1 - e) * SC, sy = p[1] - 70 * (1 - e) + 6 * sc * Math.sin(t * 3.2 + w.ph);
          const L = 80 * sc * (1 - 0.18 * Math.min(1, i / 19)) * (1 + 0.06 * Math.sin(t * 3 + w.ph));          // 人越多，每人的劲越被摊薄
          const ang = lerp(Math.PI / 2, 0, calm * (0.7 + 0.3 * ((i * 7) % 5) / 4));
          arrow(ctx, sx - Math.cos(ang) * L * (1 - 0.0), sy - Math.sin(ang) * L - (ang === 0 ? 0 : 0), ang, L, { w: 7 * sc + 1, col: "gold", a: 0.95 * e * A, glow: 0.8, head: 1.0 });
        }
        const cnt = WORKERS.reduce((n, _, i) => n + (t > T_WK(i) ? 1 : 0), 0);
        world.setNote(t < B(172) ? "更多的人进了田，田还是那块田" : "", ease(rn(t, 162.6, 0.8)) * (1 - ease(rn(t, 171.4, 0.5))));
        s5.cnt = cnt;
      } else vis(lbSame2, 0);

      /* ---- 示意图：投入一路涨，人均产出走平（n172–n184）---- */
      const chA = ease(rn(t, 172, 1.0)) * (1 - ease(rn(t, 183.2, 0.8))) * outK;
      if (chA > 0.003) {
        const { x, y, w, h } = CH;
        ctx.save(); ctx.globalAlpha = chA;
        ctx.fillStyle = "rgba(6,10,26,0.8)"; ctx.beginPath(); ctx.roundRect(x - 26, y - 26, w + 52, h + 100, 20); ctx.fill();
        ctx.strokeStyle = rg(PAL.gold.c, 0.5); ctx.lineWidth = 2.2; ctx.stroke();
        ctx.restore();
        beam(ctx, x, y, x, y + h, { col: "cyan", w: 2.4, a: 0.7 * chA }); beam(ctx, x, y + h, x + w, y + h, { col: "cyan", w: 2.4, a: 0.7 * chA });
        const p = ease(rn(t, 172.6, 9.4));                                              // 线画到哪儿
        const n = 60, up = [], flat = [];
        for (let i = 0; i <= n * p; i++) { const u = i / n; up.push([x + u * w, y + h - (0.1 + 0.8 * (u ** 0.9)) * h * 0.92]); flat.push([x + u * w, y + h - (0.4 + 0.012 * Math.sin(u * 22)) * h * 0.92]); }
        const stroke = (pts, col) => { if (pts.length < 2) return; ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round"; ctx.lineJoin = "round"; for (const [k, al] of [[8, 0.12], [3.6, 0.95]]) { ctx.strokeStyle = rg(PAL[col].c, al * chA); ctx.lineWidth = k; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke(); } const e = pts[pts.length - 1]; glow(ctx, e[0], e[1], 22, col, 0.8 * chA); ctx.restore(); };
        stroke(up, "gold"); stroke(flat, "cyan");
        lbIn.style.left = (x + w - 100) + "px"; lbIn.style.top = (y - 8) + "px"; vis(lbIn, chA * ease(rn(t, 177.4, 1)));          // 标注钉在右端，等两条线都画到头再出，避免互相压住
        lbPer.style.left = (x + w - 214) + "px"; lbPer.style.top = (y + h * 0.632 + 14) + "px"; vis(lbPer, chA * ease(rn(t, 178, 1)));
        vis(pillSketch, chA);
        world.setNote("示意：投入越来越多，人均产出却走平", chA * ease(rn(t, 172.4, 0.8)));
      } else { vis(lbIn, 0); vis(lbPer, 0); vis(pillSketch, 0); }

      /* ---- 数据卡 n184–n194 ---- */
      const dA = ease(rn(t, 184, 0.9)) * (1 - ease(rn(t, 194.2, 0.9)));
      if (dA > 0.003) {
        vis(dcard, dA, `translateY(${((1 - ease(rn(t, 184, 1.1))) * 30).toFixed(1)}px) scale(${(0.97 + 0.03 * ease(rn(t, 184, 1.1))).toFixed(3)})`);
        const k = ease(rn(t, 184.6, 2.2));
        dv.textContent = (49.0 * k).toFixed(1);
        glow(ctx, 960, 460, 520, "gold", (0.1 + 0.03 * Math.sin(t * 2.4)) * dA);
        for (let c = 0; c < 2; c++) {                                                   // 两颗光点沿卡片边缘巡游，拖着尾巴
          const p0 = t * 560 + c * 1540;
          for (let k = 0; k < 14; k++) { const q = perimPoint(410, 232, 1100, 440, p0 - k * 20); glow(ctx, q[0], q[1], 18 - k, "gold", 0.6 * dA * (1 - k / 14)); }
        }
      } else vis(dcard, 0);
    },
  };

  /* =========================================================
     S6 · 声明 + 引用 + 问句  n198 – 结束（120 s）
     n195.5 起：田里的箭头朝同一个方向摆正，汇成一条金色的河（越流越快，一路到结束）
     n200 主句：把努力，放到能相加的轴上 → n208 引用卡（只列片里用到的出处）→ n214 免责声明
     → n216 片尾问句（自画：一支金箭头带着笔迹划过）→ 河全速、最后半拍一闪，硬切
     ========================================================= */
  const RIVER_LANES = 8;
  const RIV = (() => {
    const r = rng(171), out = [];
    for (let k = 0; k < RIVER_LANES; k++) {
      const y0 = 300 + (k / (RIVER_LANES - 1)) * 560, n = 7 + (k % 3);
      for (let i = 0; i < n; i++) out.push({ k, y0, off: r() * 2400, len: 96 + r() * 96, w: 4 + r() * 4.5, a: 0.5 + r() * 0.45, ph: r() * 6.28, sp: 0.85 + r() * 0.3 });
    }
    return out;
  })();
  const riverSpeed = (t) => 34 + 620 * ease(rn(t, 200, 25)) ** 1.5;                 // px/s：缓缓起步，一路加速
  const riverY = (rv, x, t) => {
    const u = clamp((x + 220) / 2300), yEnd = 236 + (rv.k - (RIVER_LANES - 1) / 2) * 14;
    return lerp(rv.y0, yEnd, u ** 1.55) + 20 * Math.sin(x * 0.0058 + rv.ph + t * 0.7) * (1 - 0.55 * u);
  };
  let riverCacheT = -1, riverCacheD = 0;
  const riverD = (t) => { if (t !== riverCacheT) { riverCacheT = t; riverCacheD = integ(riverSpeed, t, 1 / 30); } return riverCacheD; };

  const REFS = [
    ["路易斯·卡罗尔", "《爱丽丝镜中奇遇》 · 1871"],
    ["L. Van Valen", "A New Evolutionary Law · 1973"],
    ["J. Nash", "非合作博弈 · 1950 / 1951"],
    ["G. Hardin", "The Tragedy of the Commons · 1968"],
    ["F. Hirsch", "Social Limits to Growth · 1976"],
    ["Royal Society B", "Running with the Red Queen"],
    ["C. Geertz", "Agricultural Involution · 1963"],
    ["国家统计局", "2024 年 12 月数据 · 2025 年 1 月发布"],
  ];
  const scrimT = el("", "scrimT", "stage");                                          // 先建：压在文字下面
  const thesis = el("", "thesis", "stage");
  const THESIS = "把努力，放到能相加的轴上。", T_HI = [THESIS.indexOf("相加"), THESIS.indexOf("相加") + 2];
  const thesisSpans = Array.from(THESIS).map((c, i) => {
    const sp = document.createElement("span"); sp.className = "tg" + (i >= T_HI[0] && i < T_HI[1] ? " hi" : ""); sp.textContent = c; thesis.appendChild(sp); return sp;
  });
  const thesisLine = el('<svg viewBox="0 0 220 24"><path d="M4 16 C 50 4, 120 22, 216 8" fill="none" stroke="#ffc247" stroke-width="5" stroke-linecap="round"/></svg>', "thesisline", "stage");
  const thesisPath = thesisLine.querySelector("path");
  const refsBox = el('<div class="rt">参考与出处</div>' + REFS.map(([a, b]) => `<div class="ref"><b>${a}</b><span>${b}</span></div>`).join(""), "card refs", "stage");
  const refEls = Array.from(refsBox.querySelectorAll(".ref"));
  refEls.forEach((e, i) => { e.style.left = (40 + (i % 2) * 640) + "px"; e.style.top = (84 + Math.floor(i / 2) * 88) + "px"; });
  const disc = el("模型为简化的机制演示，不构成现实建议；「类比」「示意」之处均已标注。", "disc", "stage");
  const qend = el('<span class="qt">你现在的努力，是在<b class="a">相加</b>，还是在<b class="b">相消</b>？</span>', "qend", "stage");
  const qspan = qend.querySelector(".qt");

  const s6 = {
    state(t) {
      const live = t > B(184.6);
      if (!live) { for (const e of [thesis, thesisLine, refsBox, disc, qend, scrimT]) vis(e, 0); return; }
      const inK = Math.max(0.3 * ease(rn(t, 185, 4)), ease(rn(t, 195.4, 2.4)));                                                 // 河从田里长出来
      const surge = ease(rn(t, 208, 14));                                                  // 越到后面越猛
      /* ---- 压暗一层：背景转深蓝黑 ---- */
      const dk = ease(rn(t, 197.6, 1.2)) * 0.5;
      ctx.save(); ctx.fillStyle = `rgba(2,5,16,${dk.toFixed(3)})`; ctx.fillRect(0, 0, 1920, 1080); ctx.restore();

      /* ---- 金色的河 ---- */
      const D = riverD(t);
      glow(ctx, 1640, 250, 640 + 260 * surge, "gold", (0.1 + 0.2 * surge) * inK);
      for (const rv of RIV) {
        const x = mod(rv.off + D * rv.sp, 2400) - 240, y = riverY(rv, x, t);
        if (x < -rv.len - 40 || x > 2080) continue;
        const ang = Math.atan2(riverY(rv, x + 6, t) - y, 6), u = clamp((x + 220) / 2300);
        const al = rv.a * inK * (0.4 + 0.6 * Math.sin(Math.PI * clamp(u * 1.02))) * (1 + 0.25 * surge);
        const len = rv.len * (1 + 0.35 * surge), hx = x, hy = y;
        arrow(ctx, hx - Math.cos(ang) * len, hy - Math.sin(ang) * len, ang, len, { w: rv.w * (1 + 0.3 * surge), col: rv.k % 4 === 1 ? "cyan" : "gold", a: clamp(al), glow: 0.9 + 0.5 * surge, head: 1.0 });
      }

      /* ---- 主句 n200–n208 ---- */
      const tA = ease(rn(t, 199.8, 0.6)) * (1 - ease(rn(t, 207.2, 0.8)));
      if (tA > 0.003) {
        vis(scrimT, tA * 0.9); scrimT.style.top = "300px"; scrimT.style.height = "380px";
        thesis.style.visibility = "visible"; thesis.style.opacity = "1";
        thesisSpans.forEach((sp, i) => {
          const k = ease(clamp((t - B(200) - i * 0.085) / 0.5));
          sp.style.opacity = (k * tA).toFixed(3);
          sp.style.transform = `translateY(${((1 - k) * 34).toFixed(1)}px) scale(${(1 + 0.18 * (1 - k)).toFixed(3)})`;
        });
        const lk = ease(rn(t, 202.2, 1.2));
        vis(thesisLine, tA); dash(thesisPath, lk);
        glow(ctx, 960, 470, 760, "gold", 0.1 * tA);
      } else { vis(thesis, 0); vis(thesisLine, 0); vis(scrimT, 0); }

      /* ---- 引用卡 n208–n216 + 免责声明 n214 ---- */
      const rA = ease(rn(t, 207.8, 0.8)) * (1 - ease(rn(t, 215.4, 0.8)));
      if (rA > 0.003) {
        vis(refsBox, rA, `translateY(${((1 - ease(rn(t, 207.8, 1.0))) * 40).toFixed(1)}px)`);
        refEls.forEach((e, i) => { const k = ease(clamp((t - B(208.6 + i * 0.4)) / 0.4)); e.style.opacity = (0.15 + 0.85 * k).toFixed(3); e.style.transform = `translateX(${((1 - k) * -14).toFixed(1)}px)`; e.classList.toggle("on", k > 0.5); });
        const dA = ease(rn(t, 213.6, 0.8)) * (1 - ease(rn(t, 215.4, 0.8)));
        vis(disc, dA);
      } else { vis(refsBox, 0); vis(disc, 0); }

      /* ---- 片尾问句 n216–结束：自画 ---- */
      const qA = ease(rn(t, 215.8, 0.6));
      if (qA > 0.003) {
        const k = ease(rn(t, 216.2, 3.4));
        vis(qend, qA); wipe(qspan, k, "left");
        const x0 = qspan.offsetLeft, w = qspan.offsetWidth, cx = x0 + w * k, cy = 470;
        if (k < 0.995) { arrow(ctx, cx - 150, cy, 0, 150, { w: 9, col: "gold", a: 1, glow: 1.6 }); glow(ctx, cx, cy, 110, "gold", 0.6); }
        vis(scrimT, 0.92 * qA); scrimT.style.top = "380px"; scrimT.style.height = "210px";
      } else vis(qend, 0);

      /* ---- 最后半拍：一闪，硬切 ---- */
      world.flash(ease(ramp(t, DUR - 0.42, 0.4)) ** 1.5);
    },
  };
  return [s1, s2, s3, s4, s4b, s5, s6];
}
