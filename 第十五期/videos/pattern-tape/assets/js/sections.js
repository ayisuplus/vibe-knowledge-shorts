// 六段。全片一条时间轴（90 秒），每段只在自己的窗口里驱动自己的画面；出了窗口必须把自己关掉。
// 时间点一律写「拍」，用 B(n) 换成秒（分镜脚本里的 nK 就是这里的 B(K)）。
import { B, BEAT, SEC, L } from "./beats.js";
import { el, vis, ease, easeOut, easeInOut, easeOutBack, ramp, lerp, clamp, pulse, mod, mixHex, rng } from "./lib.js";
import { wipe, dash, odo, typed, handwrite, glyphs, seal } from "./rig.js";
import {
  PAL, D16, M16, rowCount, drawCloth, drawClothFull, drawTape, drawShuttle, drawGlint, drawStreak,
  strokePartial, ellipsePts, diamondPts, drawGear, drawRibbon, drawScreen,
} from "./fabric.js";

const SVGNS = "http://www.w3.org/2000/svg";
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

export function sections(world) {
  const { ctx } = world;
  const { S, COLS, TX, CX, FY, TOP, BOT, BEAM } = L;
  const W = COLS * S;
  /** 以「拍」为单位的 ramp：从第 n0 拍起，dn 拍内 0→1 */
  const rn = (t, n0, dn = 1) => ramp(t, B(n0), B(dn));

  /** 在 parent 里放一个 SVG 描边路径（朱批圈、箭头），返回 path 供 dash() 用。
   *  viewBox 必须与 CSS 里 svg 的像素尺寸一致（不拉伸），dash 的长度才对得上。 */
  function svgStroke(parent, viewBox, d, color, width) {
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", viewBox);
    const path = document.createElementNS(SVGNS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", color);
    path.setAttribute("stroke-width", width);
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    parent.appendChild(svg);
    return path;
  }
  const lab = (html, x, y, w = 0, cls = "") =>
    el(html, "lab " + cls, "stage", `left:${x}px;top:${y}px;opacity:0${w ? `;width:${w}px` : ""}`);

  /* =========================================================
     主织机的布面（S3 / S4 共用）
     ========================================================= */
  function mainCloth(t, o = {}) {
    const { alpha = 1, open = 0, bit = D16, bare = 1, float = 0, shuttleOn = true, fringe = 0 } = o;
    const R = world.R(t), rate = world.rate(t), n = t / BEAT;
    const f = R - Math.floor(R);
    const ex = ease(rn(t, 84, 4)), warpGrow = ease(rn(t, 40.5, 3.5));
    const cols = ex > 0.001 ? 48 : COLS, x0 = ex > 0.001 ? CX - COLS * S : CX;
    const xClip = ex > 0.001 ? [CX - ex * W, CX + W + ex * W] : null;
    const top = lerp(TOP, -4000, open), bottom = lerp(BOT, 4000, open);
    const g = lerp(f, 1, clamp((rate - 1) / 1));
    const liftK = rate < 2.5 && R > 0.002 ? ease(ramp(f, 0.05, 0.2)) * (1 - ease(ramp(f, 0.8, 0.2))) : 0;
    ctx.save();
    ctx.translate(0, float);
    drawCloth(ctx, {
      x0, S, cols, FY, R, bit, top, bottom, g, rMin: 0, xClip, alpha,
      bare, bareFrom: lerp(BOT, FY, warpGrow), bareTo: lerp(bottom, FY + 70, fringe), lift: liftK, liftRow: Math.floor(R),
    });
    if (shuttleOn && n < 86) {
      const shA = clamp((2.4 - rate) / 0.8) * clamp(rate * 6) * alpha;
      if (shA > 0.01) {
        const dir = Math.floor(R) % 2 === 0 ? 1 : -1;
        drawShuttle(ctx, CX + (dir > 0 ? f : 1 - f) * W, FY, 1, dir, shA);
      }
      drawStreak(ctx, { x0: CX, x1: CX + W, y: FY, h: 26, a: clamp((rate - 2.2) / 3) * 0.55 * alpha });
    }
    ctx.restore();
  }

  /* =========================================================
     S1 · 冷开场  n0 – n16
     全幅织锦（第 0 帧即亮，一道高光慢扫，前 1 s 无字）→ n2 字幕点题「《天工开物》里，有一种很怪的织机——」、时代标签滚入、暗幕合拢成窄缝 → 一行行织（n6.5 字幕揭晓：织的人自己都不知道织的是什么花）→ 缝收成金线 → 展开成纸页
     ========================================================= */
  const S1S = 54, S1C = 36, S1X = (1920 - S1C * S1S) / 2;
  const s1Step = (t, m) => easeOutBack(ramp(t, B(m), 0.22), 1.2);
  // 前两拍只有花与高光（无字）；暗幕在 n2–n3 合拢，与字幕 C1、时代标签同时入；第一梭、第一记行滚落在 n3
  const S1M = 3;

  const s1 = {
    state(t) {
      if (t > B(16) + 0.15) return;
      let R1 = 0;
      for (let m = S1M; m <= 13; m++) R1 += s1Step(t, m);
      let nudge = 0;
      for (const m of [4, 8, 12]) nudge += 3 * pulse(t, B(m), 0.14);
      world.cam({ ny: nudge });

      // 满屏织锦：行从中线（y=540）起向上下无限延伸；幕落之前匀速上移整整一行（与窄缝的行对齐），幕落之后每拍上滚一行
      const drift = ramp(t, 0, B(S1M));
      drawClothFull(ctx, { x0: S1X, S: S1S, cols: S1C, Y0: 540 - (R1 + drift) * S1S, bit: D16 });
      // 前两拍：一道金色高光带从左扫到右（慢扫，幕落时恰好扫完）
      drawGlint(ctx, { u: ramp(t, 0, B(2)), w: 420, a: 0.55 });

      // 梭：每拍横穿一次窄缝（左右交替，0.45 s）。先画梭，再画暗幕，缝外的部分自然被藏起来
      const close = easeOut(rn(t, S1M - 1, 1));
      for (let m = S1M; m <= 13; m++) {
        const u = (t - B(m)) / 0.45;
        if (u <= 0 || u >= 1 || close < 0.98) continue;
        const dir = m % 2 ? -1 : 1, x = dir > 0 ? lerp(-140, 2060, ease(u)) : lerp(2060, -140, ease(u));
        const gr = ctx.createLinearGradient(x, 0, x - dir * 360, 0);
        gr.addColorStop(0, "rgba(248,220,138,0.6)"); gr.addColorStop(1, "rgba(248,220,138,0)");
        ctx.fillStyle = gr; ctx.fillRect(Math.min(x, x - dir * 360), 537, 360, 6);
        drawShuttle(ctx, x, 540, 1.5, dir, 1);
      }

      // 暗幕合拢（n2–n3），n13–n15 收成金线
      const narrow = ease(rn(t, 13, 2));
      const half = lerp(54, 2, narrow);
      const yT = (540 - half) * close, yB = 1080 - (540 - half) * close;
      if (close > 0.001) {
        ctx.fillStyle = "rgba(5,8,26,0.9)";
        ctx.fillRect(-40, -60, 2000, yT + 60);
        ctx.fillRect(-40, yB, 2000, 1140 - yB);
        const flash = pulse(t, B(S1M) - 0.06, 0.2);
        ctx.fillStyle = `rgba(240,193,90,${(close * (0.55 + 0.45 * flash)).toFixed(3)})`;
        ctx.fillRect(-40, yT - 2, 2000, 4); ctx.fillRect(-40, yB - 2, 2000, 4);
      }
      if (narrow > 0.01) {
        const pu = 0.75 + 0.25 * Math.sin((t - B(14)) * 16);
        drawStreak(ctx, { x0: -40, x1: 1960, y: 540, h: 34, a: 0.8 * narrow * pu });
      }
    },
  };

  /* =========================================================
     S2 · 历史锚点  n16 – n40
     A 纸页引文：金线展开成纸页 → 六行原文逐行擦入 → 朱批圈住「即织者不知成何花色」→ 批注
     B 花楼机线稿：纸页翻走 → 线稿一线一线画出，标注逐个落下
     ========================================================= */
  const page = el(
    '<div class="src">《天工开物·乃服》· 结花本</div><div class="rule"></div>' +
    '<div class="q">' +
    '<p class="ql">画师先画何等花色于纸上，</p>' +
    '<p class="ql">结本者以丝线随画量度，</p>' +
    '<p class="ql">算计分寸杪忽而结成之。</p>' +
    '<p class="ql">张悬花楼之上，<span class="hl">即织者不知成何花色，</span></p>' +
    '<p class="ql">穿综带经，随其尺寸度数提起衢脚，</p>' +
    '<p class="ql">梭过之后居然花现。</p>' +
    '</div><div class="gloss"><span class="gt"></span></div><div class="sheen"></div>',
    "page", "stage");
  const qSrc = page.querySelector(".src"), qRule = page.querySelector(".rule");
  const qLines = [...page.querySelectorAll(".ql")];
  const qHl = page.querySelector(".hl"), qGloss = page.querySelector(".gloss"), qSheen = page.querySelector(".sheen");
  const qLoop = svgStroke(qHl, "0 0 480 96", "M40 58 C28 20 150 8 250 10 C360 12 452 28 448 56 C446 82 330 90 230 88 C130 86 24 80 28 40 C30 28 52 18 80 14", "#a63a2b", 3.5);
  const qArrow = svgStroke(qGloss, "0 0 64 36", "M62 22 C46 8 22 8 6 20 M6 20 L18 12 M6 20 L16 30", "#a63a2b", 3);
  const qHand = handwrite(page.querySelector(".gt"), "织的人，不知道织出来是什么花");
  const LINE_AT = [18, 20, 22, 24, 28, 30];

  // 线稿的笔画：{p 折线, n 起笔拍, d 用几拍, w 线宽}
  const LOOM = [
    { p: [[240, 706], [1680, 706]], n: 32.0, d: 1.6, w: 2.5 },
    { p: [[420, 612], [1500, 612]], n: 32.3, d: 1.5, w: 3.5 },
    { p: [[420, 676], [1500, 676]], n: 32.5, d: 1.5, w: 3 },
    ...[420, 800, 1150, 1500].map((x, i) => ({ p: [[x, 612], [x, 676]], n: 33 + i * 0.15, d: 0.7, w: 3 })),
    { p: [[420, 676], [420, 706]], n: 33.3, d: 0.6, w: 3 }, { p: [[1500, 676], [1500, 706]], n: 33.4, d: 0.6, w: 3 },
    { p: [[1180, 612], [1180, 190]], n: 32.6, d: 1.8, w: 3.5 }, { p: [[1300, 612], [1300, 190]], n: 32.8, d: 1.8, w: 3.5 },
    { p: [[1136, 190], [1344, 190]], n: 34, d: 0.8, w: 4 }, { p: [[1150, 212], [1330, 212]], n: 34.2, d: 0.7, w: 3 },
    { p: [[1180, 420], [1300, 420]], n: 34, d: 0.6, w: 3 },
    { p: [[1180, 612], [1300, 420]], n: 34.2, d: 0.8, w: 2 }, { p: [[1300, 612], [1180, 420]], n: 34.3, d: 0.8, w: 2 },
    { p: ellipsePts(1240, 238, 100, 17), n: 33.5, d: 1.0, w: 3 },            // 衢盘
    { p: ellipsePts(470, 584, 26, 26), n: 35.5, d: 0.8, w: 3 },              // 卷布辊
    { p: ellipsePts(1440, 580, 36, 36), n: 35.7, d: 0.8, w: 3 },             // 经轴
    { p: [[1404, 552], [496, 560]], n: 35.9, d: 1.0, w: 2 },                  // 经线面
    { p: rectPts(880, 520, 60, 92), n: 36.2, d: 0.8, w: 2 }, { p: rectPts(970, 520, 60, 92), n: 36.3, d: 0.8, w: 2 },   // 综片
    { p: [[300, 650], [420, 650]], n: 36.4, d: 0.6, w: 3 }, { p: [[312, 650], [308, 706]], n: 36.5, d: 0.4, w: 3 }, { p: [[408, 650], [412, 706]], n: 36.5, d: 0.4, w: 3 },
    { p: [[420, 742], [1500, 742]], n: 36.0, d: 1.0, w: 2.5 }, { p: [[420, 728], [420, 756]], n: 36.8, d: 0.3, w: 2.5 }, { p: [[1500, 728], [1500, 756]], n: 36.8, d: 0.3, w: 2.5 },
  ];
  const LEAD = [   // 引线：{p, n, d}
    { p: [[1180, 330], [1070, 330]], n: 33.2 }, { p: [[1142, 240], [1070, 240]], n: 34.0 },
    { p: [[1318, 380], [1400, 380]], n: 35.4 }, { p: [[1262, 138], [1372, 112]], n: 37.0 }, { p: [[340, 560], [250, 520]], n: 38.5 },
  ];
  const FIG_HAND = [ellipsePts(1240, 146, 15, 15, 24), [[1240, 162], [1240, 184]], [[1240, 168], [1206, 190]], [[1240, 168], [1274, 190]], [[1240, 184], [1222, 200]], [[1240, 184], [1258, 200]]];
  const FIG_WEAVER = [ellipsePts(352, 566, 16, 16, 24), [[352, 584], [352, 640]], [[352, 640], [414, 640]], [[414, 640], [420, 700]], [[352, 600], [440, 592]]];
  const L2 = [
    { e: lab("花楼", 920, 316, 140, "r"), n: 33.2 },
    { e: lab("衢盘", 920, 226, 140, "r"), n: 34.0 },
    { e: lab("衢脚 · 竹棍<b>一千八百</b>根（示意）", 1410, 366), n: 35.4 },
    { e: lab("提花小厮，坐立花楼架木上", 1382, 98), n: 37.0 },
    { e: lab("织者", 100, 506, 140, "r"), n: 38.5 },
    { e: lab('<b class="dn">0</b> 尺　通身长一丈六尺', 560, 764, 800, "c"), n: 36.4 },
  ];
  L2[5].e.style.textAlign = "center";
  const dn = L2[5].e.querySelector(".dn");

  function drawLoom(t, alpha) {
    const gl = pulse(t, B(39), B(1));
    ctx.save();
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(240,193,90,.55)"; ctx.shadowBlur = 10 + 12 * gl;
    ctx.strokeStyle = PAL.goldLight;
    ctx.globalAlpha = alpha;
    for (const s of LOOM) { ctx.lineWidth = s.w + 0.8 * gl; strokePartial(ctx, s.p, ease(rn(t, s.n, s.d))); }
    // 衢脚：40 根细线错峰垂下，代表一千八百根
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = alpha * 0.85;
    for (let i = 0; i < 40; i++) {
      const x = 1146 + i * (188 / 39), xe = 1240 + (x - 1240) * 0.72;
      strokePartial(ctx, [[x, 246], [xe, 470]], ease(ramp(t, B(34.5) + 0.03 * i, 0.35)));
    }
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1.5; ctx.globalAlpha = alpha * 0.8;
    for (const s of LEAD) strokePartial(ctx, s.p, ease(rn(t, s.n, 0.6)));
    // 提花小厮（实线）、织者（虚线：原文没写其位置，示意）
    const fa = ease(rn(t, 37, 1));
    if (fa > 0.01) {
      ctx.globalAlpha = alpha * fa; ctx.lineWidth = 3;
      const bob = Math.sin(t * 2.85) * 1.5;
      ctx.save(); ctx.translate(0, bob);
      for (const p of FIG_HAND) strokePartial(ctx, p, 1);
      ctx.restore();
    }
    const wa = ease(rn(t, 38.5, 1));
    if (wa > 0.01) {
      ctx.globalAlpha = alpha * wa; ctx.lineWidth = 2.6; ctx.setLineDash([6, 7]);
      for (const p of FIG_WEAVER) strokePartial(ctx, p, 1);
    }
    ctx.restore();
  }

  const s2 = {
    state(t) {
      // ---- 纸页 ----
      if (t < B(15) || t > B(32) + 0.1) {
        vis(page, 0);
      } else {
        const open = ease(rn(t, 15, 1)), flip = easeOut(rn(t, 31, 1));
        page.style.clipPath = `inset(${lerp(67.5, 0, open).toFixed(2)}% 0 ${lerp(32.5, 0, open).toFixed(2)}% 0)`;
        vis(page, 1, `translateX(${(-1500 * flip).toFixed(1)}px) rotate(${(-8 * flip).toFixed(2)}deg)`);
        wipe(qSrc, ease(rn(t, 16, 0.95)), "left");
        qRule.style.transform = `scaleX(${ease(rn(t, 17, 0.95)).toFixed(3)})`;
        qLines.forEach((p, i) => wipe(p, easeOut(ramp(t, B(LINE_AT[i]), 0.5)), "left"));
        qHl.style.color = mixHex("#2a2419", "#a63a2b", ease(ramp(t, B(24) + 0.3, 0.4)));
        dash(qLoop, ease(ramp(t, B(26), 0.9)));
        dash(qArrow, ease(ramp(t, B(27), 0.3)));
        qHand.set(ramp(t, B(27) + 0.3, 1.4));
        // 纸面高光：每 5.5 s 一道，0.9 s 掠过
        const ph = mod(t - B(16), 5.5) / 0.9;
        if (ph < 1 && t > B(18)) { qSheen.style.opacity = Math.sin(Math.PI * ph).toFixed(3); qSheen.style.transform = `translateX(${lerp(-300, 1500, ph).toFixed(1)}px)`; }
        else qSheen.style.opacity = 0;
      }

      // ---- 线稿 ----
      const on = t >= B(31.8) && t <= B(44);
      if (on) {
        const push = easeInOut(rn(t, 39, 1));
        world.cam({ s: lerp(1, 1.15, push), cx: 1240, cy: 380, sx: lerp(1240, 1100, push), sy: lerp(380, 420, push) });
        drawLoom(t, 1 - ease(rn(t, 40.2, 3.5)));
      }
      const la = ease(rn(t, 39.0, 0.5));
      L2.forEach(({ e, n }, i) => {
        const a = on ? ease(rn(t, n, 0.6)) * (1 - la) : 0;
        vis(e, a);
        if (i === 5 && a > 0) dn.textContent = odo(0, 16, ease(ramp(t, B(36.4), 0.8)));
      });
    },
  };

  /* =========================================================
     S3 · 机制  n40 – n96
     A 一行的演示 → B 画格结本 → C 上楼 → D 织造加速 → E 整幅显形
     ========================================================= */
  const blabT = el("花 本", "blab", "stage", `left:${TX}px;top:76px;opacity:0`);
  const blabC = el("布 面", "blab", "stage", `left:${CX}px;top:76px;opacity:0`);
  const blabP = lab("画师", 1690, 214, 80, "");
  const dimLab = el('<b class="d1">16</b> 列 × <b class="d2">16</b> 行', "lab", "stage", "left:860px;top:690px;width:448px;text-align:center;opacity:0");
  const dimA = dimLab.querySelector(".d1"), dimB = dimLab.querySelector(".d2");

  // 稿 + 网格 + 填格（画在原点，调用方 translate / scale）
  const SK = 28, GN = 16;
  function drawSketch({ rings = 0, grid = 0, fill = 0, a = 1 }) {
    const H = (GN * SK) / 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(15,22,52,0.6)"; ctx.fillRect(-H, -H, 2 * H, 2 * H);
    ctx.save();
    ctx.beginPath(); ctx.rect(-H, -H, 2 * H, 2 * H); ctx.clip();
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = PAL.warp[1]; ctx.lineWidth = 1.414 * SK;
    ctx.globalAlpha = a * (1 - 0.65 * fill);
    [1.0, 4.5, 8.5, 12.5].forEach((rho, i) => strokePartial(ctx, diamondPts(0, 0, rho * SK), ease(rings * 1.5 - i * 0.2)));
    ctx.restore();
    if (grid > 0.001) {
      ctx.strokeStyle = "rgba(246,239,220,.4)"; ctx.lineWidth = 1.5; ctx.globalAlpha = a;
      ctx.beginPath();
      const gv = H * grid;
      for (let i = 0; i <= GN; i++) { const p = -H + i * SK; ctx.moveTo(p, -gv); ctx.lineTo(p, gv); ctx.moveTo(-gv, p); ctx.lineTo(gv, p); }
      ctx.stroke();
    }
    const nRows = fill * GN;
    for (let r = 0; r < GN; r++) {
      const p = clamp(nRows - r);
      if (p <= 0) break;
      ctx.globalAlpha = a * p;
      for (let c = 0; c < GN; c++) {
        ctx.fillStyle = D16(r, c) ? "rgba(224,176,67,0.9)" : "rgba(47,68,145,0.75)";
        ctx.fillRect(-H + c * SK + 1.5, -H + r * SK + 1.5, SK - 3, SK - 3);
      }
    }
    ctx.restore();
  }
  // 织成之后迸出的金点
  const burst = (() => { const r = rng(5); return Array.from({ length: 40 }, () => ({ a: r() * 6.2832, v: 160 + r() * 520, s: 1.5 + r() * 2.6 })); })();

  const s3 = {
    state(t) {
      const n = t / BEAT;
      if (t < B(39.4) || t > B(96)) {
        vis(blabT, 0); vis(blabC, 0); vis(blabP, 0); vis(dimLab, 0);
        return;
      }
      const R = world.R(t), rate = world.rate(t);
      const inK = ease(rn(t, 40.3, 1.2));
      const ze = easeInOut(rn(t, 80, 6));
      const camS3 = { s: lerp(1, 0.7, ze), cx: 1323, cy: 448, sx: lerp(1323, 960, ze), sy: lerp(448, 470, ze) };

      // ---- 相位变量 ----
      const e1 = ease(rn(t, 48, 1));                          // 花本离开横梁，落到工作台
      const hoistK = easeOutBack(rn(t, 58, 3.2), 1.0);        // 上楼：回到梁上
      const bench = e1 * (1 - hoistK);                         // 1 = 在工作台
      const e2 = ease(rn(t, 60.5, 1.5));
      const Rv = n < 60.5 ? lerp(R, 10.5, e1) : lerp(10.5, R, e2);   // 花本的视窗：结本时全 16 行可见，之后回到读行线
      const dimK = ease(rn(t, 48, 1)) * (1 - ease(rn(t, 57, 1)));    // 结本期间布面暗下去
      const tapeOut = ease(rn(t, 84, 3.5));
      const bandA = clamp((1 - ease(rn(t, 47.6, 0.6))) * ease(rn(t, 43.8, 0.4)) + ease(rn(t, 61.5, 0.8))) * (1 - ease(rn(t, 88, 2)));
      const fillP = clamp((n - 52) / 4);

      // ---- 布面 ----
      world.cam(camS3);
      const fr = ease(rn(t, 88, 3));
      mainCloth(t, {
        alpha: inK * (1 - 0.82 * dimK), open: ze,
        bare: (1 - 0.4 * fr) * ease(rn(t, 40.5, 1)), fringe: fr,
        float: -14 * ease(rn(t, 92, 4)),
      });

      // ---- 花本 ----
      const tapeA = inK * (1 - tapeOut);
      if (tapeA > 0.003) {
        const rowA = (r) => {
          if (n >= 62) return 1;
          if (n >= 48) { if (r < 0 || r > 15) return 0; return r < 2 ? 1 : clamp(fillP * 16 - (r - 2)); }
          return r === 0 ? ease(ramp(t, B(44), 0.35)) : r === 1 ? ease(ramp(t, B(46), 0.35)) : 0;
        };
        ctx.save();
        ctx.translate(-169 * bench - 760 * tapeOut, 150 * bench);
        drawTape(ctx, {
          x0: TX, S, cols: COLS, FY, R: Rv, bit: D16, rowA, top: TOP, bottom: BOT,
          beamY: lerp(-30, BEAM, ease(rn(t, 40.3, 2.5))), strGrow: ease(rn(t, 40.7, 3)),
          band: bandA, alpha: tapeA, beamA: Math.max(1 - e1, ease(rn(t, 59, 2))),
        });
        ctx.restore();
      }

      // ---- B：画格结本 ----
      if (n >= 47.9 && n <= 90.5) {
        world.cam({});   // 稿与缩略图是版面上的东西，不随镜头
        const fly = ease(rn(t, 56, 2));
        const a = ease(rn(t, 47.9, 0.5)) * (1 - ease(rn(t, 88, 2)));
        ctx.save();
        ctx.translate(lerp(1084, 1730, fly), lerp(448, 160, fly));
        ctx.scale(lerp(1, 0.2, fly), lerp(1, 0.2, fly));
        drawSketch({ rings: ramp(n, 48.2, 1.8), grid: ramp(n, 50, 2), fill: n >= 56 ? 1 : fillP, a });
        ctx.restore();
        // 稿 → 花本：当前正在填的那一行，拉一条金线过去
        if (n >= 52 && n < 56.2) {
          const rf = Math.min(15, Math.floor(fillP * 16));
          const yt = FY + (rf - 10.5) * S + S / 2 + 150, yg = 448 - 224 + 14 + SK * rf;
          ctx.save();
          ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3; ctx.globalAlpha = 0.6; ctx.shadowColor = "rgba(240,193,90,.6)"; ctx.shadowBlur = 8;
          ctx.beginPath(); ctx.moveTo(TX - 169 + W + 14, yt); ctx.quadraticCurveTo(792, (yt + yg) / 2, 860, yg); ctx.stroke();
          ctx.restore();
        }
      }

      // ---- E：整幅显形的光与金点 ----
      if (n >= 90 && n <= 93.5) {
        world.cam(camS3);
        const gu = rn(t, 90, 1.7);
        drawGlint(ctx, { u: gu, x0: CX - W, x1: CX + 2 * W, y0: -600, y1: FY - 14, w: 300, a: 0.6 });
        const bu = ramp(t, B(90), 1.5);
        if (bu > 0 && bu < 1) {
          ctx.save(); ctx.fillStyle = PAL.goldLight;
          for (const p of burst) {
            const d = p.v * easeOut(bu);
            ctx.globalAlpha = (1 - bu) * 0.9;
            ctx.beginPath(); ctx.arc(1323 + Math.cos(p.a) * d, 420 + Math.sin(p.a) * d * 0.7, p.s, 0, 6.2832); ctx.fill();
          }
          ctx.restore();
        }
      }
      world.cam({});

      // ---- 标注（DOM） ----
      const lbA = Math.max(ease(rn(t, 42, 1)) * (1 - ease(rn(t, 47.5, 0.5))), ease(rn(t, 62, 1)) * (1 - ease(rn(t, 79, 1))));
      vis(blabT, lbA, `translateX(${(-169 * bench).toFixed(1)}px)`);
      vis(blabC, lbA);
      vis(blabP, ease(rn(t, 57.8, 0.6)) * (1 - ease(rn(t, 88, 2))));
      const dA = ease(rn(t, 50.4, 0.5)) * (1 - ease(rn(t, 56, 1)));
      vis(dimLab, dA);
      if (dA > 0) { const k = ease(rn(t, 50.4, 1)); dimA.textContent = odo(0, 16, k); dimB.textContent = odo(0, 16, k); }

      // ---- 注释带 ----
      const curRow = Math.floor(R + 1e-4), N = rowCount(D16, curRow);
      const rowTxt = `这一行有 <b>${N}</b> 个结 → 提起这 <b>${N}</b> 根经线，过一梭`;
      world.setNote(rowTxt, ease(rn(t, 44, 0.6)) * (1 - ease(rn(t, 47.7, 0.5))));
      world.setNote("示意：把稿量成格", ease(rn(t, 48.8, 0.6)) * (1 - ease(rn(t, 51.7, 0.4))));
      world.setNote("每一行，记下<b>哪几根要提</b>", ease(rn(t, 52.2, 0.5)) * (1 - ease(rn(t, 57.2, 0.5))));
      world.setNote("张悬花楼之上", ease(rn(t, 58.4, 0.5)) * (1 - ease(rn(t, 61.6, 0.4))));
      world.setNote(rowTxt, ease(rn(t, 62.2, 0.5)) * (1 - ease(rn(t, 71.6, 0.4))));
      world.setNote(`已织 <b>${Math.floor(R)}</b> 行`, ease(rn(t, 72.2, 0.5)) * (1 - ease(rn(t, 88.5, 1))));
    },
  };

  /* =========================================================
     S4 · 反直觉转折  n96 – n120
     花本回到左边（放大）→ 标尺「分寸杪忽」→ 稿的金点流进结 → 换带（龙袍条：织过数寸，即换龙形）→ 同一条花本，三匹一样
     ========================================================= */
  const RSWAP = Math.ceil(world.R(B(110)) - 1e-6);                      // 换带后，第几行起用回纹
  const bitSwap = (r, c) => (r >= RSWAP ? M16(r - RSWAP, c) : D16(r, c));
  const T4 = { sc: 1.4, tx: 130 - 1.4 * TX, ty: 520 - 1.4 * FY };       // 左边放大的花本：屏幕 x=130 起，读行线在 y=520
  function drawTape4({ bit, Rt, alpha = 1, dy = 0, band = 1 }) {
    ctx.save();
    ctx.translate(T4.tx, T4.ty + dy); ctx.scale(T4.sc, T4.sc);
    drawTape(ctx, { x0: TX, S, cols: COLS, FY, R: Rt, bit, top: 166, bottom: 738, beamY: BEAM, strGrow: 1, band, alpha, beamA: 1 });
    ctx.restore();
  }
  const rulerG = el("", "ink", "stage", "left:1008px;top:430px;font-size:30px;letter-spacing:0.08em;opacity:0");
  const rulerGl = glyphs(rulerG, "分寸杪忽");
  const rulerTag = lab("原文", 1008, 394);
  const chip = el('<span class="chipk">《天工开物》· 龙袍条</span><span class="chipv">织过数寸，即换龙形</span>', "chip", "stage", "left:1150px;top:112px;opacity:0");
  const tuiyan = lab("机制推演 · 非原文", 1262, 668, 340, "");
  tuiyan.style.textAlign = "center";
  const eqs = [lab("=", 1262, 330, 40, "eq"), lab("=", 1568, 330, 40, "eq")];
  eqs.forEach((e) => { e.style.fontSize = "56px"; e.style.textAlign = "center"; e.style.color = "#f0c15a"; });

  function drawStrips(t, a, dy) {
    const SS = 17, wS = COLS * SS, xs = [984, 1290, 1596], offs = [0, 5, 11];
    const Rr = world.R(t) - RSWAP;
    xs.forEach((x0, i) => {
      ctx.save();
      ctx.translate(0, dy);
      ctx.beginPath(); ctx.rect(x0 - 4, 150, wS + 8, 490); ctx.clip();
      drawClothFull(ctx, { x0, S: SS, cols: COLS, Y0: 395 - (Rr + offs[i]) * SS, bit: M16, top: 150, bottom: 640, alpha: a });
      ctx.restore();
      ctx.save(); ctx.translate(0, dy);
      ctx.globalAlpha = a; ctx.strokeStyle = "rgba(240,193,90,.6)"; ctx.lineWidth = 2; ctx.strokeRect(x0 - 4, 150, wS + 8, 490);
      ctx.restore();
    });
  }

  const s4 = {
    state(t) {
      const n = t / BEAT;
      if (t < B(95.9) || t > B(120.6)) {
        vis(rulerG, 0); vis(rulerTag, 0); vis(chip, 0); vis(tuiyan, 0); eqs.forEach((e) => vis(e, 0));
        return;
      }
      const R = world.R(t);
      // ---- 布面：退到右边变小，换带之后在织口继续织，之后淡出让位给三匹 ----
      const e4 = ease(rn(t, 96, 3));
      const clothA = lerp(1, 0.55, e4) * lerp(1, 1 / 0.55, ease(rn(t, 109, 1.5))) * (1 - ease(rn(t, 114, 1.5)));
      if (clothA > 0.004) {
        world.cam({ s: lerp(0.7, 0.4, e4), cx: 1323, cy: lerp(448, 538, e4), sx: lerp(960, 1500, e4), sy: lerp(470, 640, e4) });
        mainCloth(t, { alpha: clamp(clothA), open: 1, bit: bitSwap, bare: 0.6, fringe: 1, float: -14, shuttleOn: false });
        // 换带处的金色接缝
        const seamY = FY + (RSWAP - R) * S;
        if (n >= 110 && seamY < FY) {
          ctx.save(); ctx.translate(0, -14);
          ctx.strokeStyle = PAL.gold; ctx.lineWidth = 4; ctx.globalAlpha = clamp(clothA) * ease(rn(t, 110.5, 1));
          ctx.shadowColor = "rgba(240,193,90,.7)"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.moveTo(CX - W, seamY); ctx.lineTo(CX + 2 * W, seamY); ctx.stroke();
          ctx.restore();
        }
      }
      world.cam({});

      // ---- 花本（左，放大 1.4×）：旧的上抽，新的（回纹）顶入 ----
      const tapeIn = ease(rn(t, 97.2, 1.5));
      const out = easeOut(rn(t, 108, 1.3)), inn = easeOutBack(rn(t, 108.1, 1.4), 1.0);
      const dim = 1 - 0.35 * ease(rn(t, 107, 1)) * (1 - ease(rn(t, 109.5, 1)));
      if (n < 109.6) drawTape4({ bit: D16, Rt: R, alpha: tapeIn * dim, dy: -900 * out, band: 0.7 });
      if (n >= 108.1) drawTape4({ bit: M16, Rt: R - RSWAP, alpha: 1, dy: 900 * (1 - inn), band: ease(rn(t, 110, 0.6)) });

      // ---- 标尺与「分寸杪忽」 ----
      const rl = ease(rn(t, 100, 0.5)) * (1 - ease(rn(t, 107.5, 1)));
      if (rl > 0.004) {
        ctx.save(); ctx.globalAlpha = rl; ctx.strokeStyle = PAL.gold; ctx.lineCap = "round";
        for (let i = 0; i < 48; i++) {
          if (t < B(100) + 0.03 * i) break;
          const y = 130 + i * 14, major = i % 5 === 0;
          ctx.lineWidth = major ? 2.5 : 1.6;
          ctx.beginPath(); ctx.moveTo(970, y); ctx.lineTo(970 + (major ? 26 : 14), y); ctx.stroke();
        }
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(970, 130); ctx.lineTo(970, 130 + 47 * 14); ctx.stroke();
        ctx.restore();
      }
      rulerGl.set(ramp(t, B(100.5), 1.0), 0.2);
      vis(rulerG, rl); vis(rulerTag, ease(rn(t, 100.5, 0.6)) * (1 - ease(rn(t, 107.5, 1))));

      // ---- 稿 → 花本：金点沿曲线流进读行线上的结 ----
      const sa = ease(rn(t, 102.5, 0.8)) * (1 - ease(rn(t, 107, 1)));
      if (sa > 0.004) {
        ctx.save();
        ctx.translate(1074, 236); ctx.scale(0.32, 0.32);
        drawSketch({ rings: 1, grid: 1, fill: 1, a: sa });
        ctx.restore();
        const row = Math.floor(R + 1e-4), dest = [];
        for (let c = 0; c < COLS; c++) if (D16(row, c)) dest.push([T4.tx + T4.sc * (TX + c * S + S / 2), T4.ty + T4.sc * (FY + (row - R) * S + S / 2)]);
        ctx.save(); ctx.fillStyle = PAL.goldLight; ctx.shadowColor = "rgba(240,193,90,.8)"; ctx.shadowBlur = 8;
        for (let i = 0; i < 28; i++) {
          const u = (t - B(102.5) - i * 0.045) / 0.9;
          if (u <= 0 || u >= 1) continue;
          const [dx, dy2] = dest[i % dest.length], x0 = 1010, y0 = 236, cx = (x0 + dx) / 2 - 60, cy = Math.min(y0, dy2) - 150;
          const k = ease(u), x = (1 - k) * (1 - k) * x0 + 2 * (1 - k) * k * cx + k * k * dx, y = (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * dy2;
          ctx.globalAlpha = Math.sin(Math.PI * u) * sa; ctx.beginPath(); ctx.arc(x, y, 3.6, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
      }

      // ---- 龙袍条原文、三匹 ----
      vis(chip, ease(rn(t, 110.5, 0.7)) * (1 - ease(rn(t, 114.6, 0.8))));
      const sA = ease(rn(t, 114, 1.2)), push = easeOut(rn(t, 118, 2));
      if (sA > 0.004 && push < 0.999) drawStrips(t, sA, -1100 * push);
      eqs.forEach((e, i) => vis(e, ease(rn(t, 115.4 + i, 0.5)) * (1 - ease(rn(t, 118.5, 0.8))), `translateY(${(-1100 * push).toFixed(1)}px)`));
      vis(tuiyan, ease(rn(t, 115, 0.8)) * (1 - ease(rn(t, 118.5, 0.8))));
    },
  };

  /* =========================================================
     S5 · 现实落点  n120 – n152（退场到 n156）
     同一条「带子」：丝绳 → 穿孔纸带 → 穿孔卡链 → 分析机 → 像素屏；末了三联类比
     ========================================================= */
  const RB = { x0: 768, cw: 24, ch: 40, cols: 16, FY: 470, top: 96, bottom: 770 };
  const Rr = (t) => 4 + 0.8 * ((t - B(120)) / BEAT);
  const ND = [
    { e: el("你的一句话", "nd", "stage", "left:400px;top:700px;opacity:0"), l: el("画师的稿", "ndl", "stage", "left:400px;top:664px;opacity:0") },
    { e: el("AI", "nd", "stage", "left:840px;top:700px;opacity:0"), l: el("结本者", "ndl", "stage", "left:840px;top:664px;opacity:0") },
    { e: el("机器", "nd", "stage", "left:1280px;top:700px;opacity:0"), l: el("执行", "ndl", "stage", "left:1280px;top:664px;opacity:0") },
  ];
  const stamp = seal("stage", { x: 1580, y: 330, size: 124, text: "类比", rot: -10 });
  const GEARS = [
    { x: 560, y: 430, r: 84, n: 14, w: 0.55 }, { x: 668, y: 538, r: 56, n: 9, w: -0.55 * 14 / 9 },
    { x: 1360, y: 470, r: 78, n: 13, w: -0.5 }, { x: 1260, y: 570, r: 52, n: 9, w: 0.5 * 13 / 9 },
  ];
  function miniCard(x, y, a, k) {
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y + (1 - k) * -120);
    const g = ctx.createLinearGradient(0, 0, 0, 62); g.addColorStop(0, "#f2e7c8"); g.addColorStop(1, "#d9c9a0");
    ctx.fillStyle = g; ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.rect(0, 0, 190, 62); ctx.fill(); ctx.shadowColor = "transparent";
    ctx.fillStyle = "#0d1538";
    for (let r2 = 0; r2 < 2; r2++) for (let c = 0; c < 8; c++) if (D16(r2 + Math.round(y / 80), c + 3)) ctx.fillRect(14 + c * 21, 14 + r2 * 22, 12, 14);
    ctx.restore();
  }

  const s5 = {
    state(t) {
      const n = t / BEAT;
      if (t < B(119.8) || t > B(157)) {
        ND.forEach(({ e, l }) => { vis(e, 0); vis(l, 0); }); stamp.hide();
        return;
      }
      const R = world.R(t);
      const recede = ease(rn(t, 152, 1.2)), gone = ease(rn(t, 154, 2.5));
      const A = 1 - 0.7 * recede - 0.3 * gone;                 // 屏幕场景整体的透明度
      const sc = lerp(1, 0.9, recede);
      ctx.save();
      world.cam({ s: sc, cx: 960, cy: 440, sx: 960, sy: 440 });

      // ---- 左边的花本退场 ----
      const tOut = 1 - ease(rn(t, 120, 1.6));
      if (tOut > 0.004 && n < 122) drawTape4({ bit: M16, Rt: R - RSWAP, alpha: tOut, band: 1 });

      // ---- 竖直的带子 ----
      const rIn = ease(rn(t, 120.3, 1.6)), rOut = 1 - ease(rn(t, 144, 2));
      const rA = rIn * rOut * A;
      if (rA > 0.004) {
        const dy = 90 * (1 - ease(rn(t, 120.2, 2.2)));
        const rr = { ...RB, R: Rr(t), bit: M16, alpha: rA };
        ctx.save(); ctx.translate(0, dy);
        const bandA = 0.7;
        const draw = (mat, y0, y1) => { ctx.save(); ctx.beginPath(); ctx.rect(0, y0, 1920, y1 - y0); ctx.clip(); drawRibbon(ctx, { ...rr, mat, band: bandA }); ctx.restore(); };
        const s1k = ease(rn(t, 126, 1.6)), s2k = ease(rn(t, 132, 1.6));
        const sweepAt = (k) => lerp(RB.top - 20, RB.bottom + 20, k);
        if (n < 126) draw("cord", RB.top - 30, RB.bottom + 30);
        else if (n < 132) {
          const y = sweepAt(s1k);
          draw("paper", RB.top - 30, y); draw("cord", y, RB.bottom + 30);
          if (s1k < 0.999) { ctx.save(); ctx.fillStyle = PAL.goldLight; ctx.globalAlpha = rA; ctx.shadowColor = "rgba(240,193,90,.9)"; ctx.shadowBlur = 14; ctx.fillRect(RB.x0 - 60, y - 2, RB.cols * RB.cw + 120, 4); ctx.restore(); }
        } else {
          const y = sweepAt(s2k);
          draw("cards", RB.top - 30, y); draw("paper", y, RB.bottom + 30);
          if (s2k < 0.999) { ctx.save(); ctx.fillStyle = PAL.goldLight; ctx.globalAlpha = rA; ctx.shadowColor = "rgba(240,193,90,.9)"; ctx.shadowBlur = 14; ctx.fillRect(RB.x0 - 60, y - 2, RB.cols * RB.cw + 120, 4); ctx.restore(); }
        }
        ctx.restore();
      }
      // 纸带旁边落下的三张小卡
      for (let i = 0; i < 3; i++) {
        const k = easeOutBack(rn(t, 129 + i * 0.5, 0.7), 1.2), a = k > 0 ? (1 - ease(rn(t, 131.6, 0.5))) * A : 0;
        if (a > 0.004) miniCard(1230 + i * 22, 250 + i * 84, a, clamp(k, 0, 1.15));
      }

      // ---- 分析机的齿轮 ----
      const gA = ease(rn(t, 138.3, 1)) * (1 - ease(rn(t, 144.2, 1.2))) * A;
      if (gA > 0.004) GEARS.forEach((g) => drawGear(ctx, g.x, g.y, g.r, g.n, g.w * t, { alpha: gA }));

      // ---- 像素屏 ----
      const scA = ease(rn(t, 144, 1)) * A;
      if (scA > 0.004) drawScreen(ctx, { cx: 960, cy: 400, size: 448, fill: ease(rn(t, 144.3, 2.6)), alpha: scA, bit: M16 });

      // ---- 三联类比：箭头 ----
      const aA = ease(rn(t, 148, 0.6)) * A;
      if (aA > 0.004) {
        ctx.save(); ctx.strokeStyle = PAL.gold; ctx.lineWidth = 3.5; ctx.lineCap = "round"; ctx.globalAlpha = aA;
        for (let i = 0; i < 2; i++) {
          const x0 = 640 + i * 440 + 18, x1 = 840 + i * 440 - 18;
          strokePartial(ctx, [[x0, 729], [x1, 729]], ease(rn(t, 148.4 + i * 0.5, 0.6)));
          strokePartial(ctx, [[x1 - 12, 719], [x1, 729], [x1 - 12, 739]], ease(rn(t, 148.9 + i * 0.5, 0.3)));
        }
        ctx.restore();
      }
      ctx.restore();
      world.cam({});

      // DOM：三个节点与标注、章
      ND.forEach(({ e, l }, i) => {
        const a = ease(rn(t, 148 + i * 0.4, 0.6)) * A;
        vis(e, a, `translateY(${((1 - ease(rn(t, 148 + i * 0.4, 0.6))) * 14).toFixed(1)}px)`);
        vis(l, a * 0.9);
      });
      stamp.slap(ramp(t, B(148.2), 0.75)); if (A < 0.99) stamp.root.style.opacity = clamp(A * 1.2).toFixed(3);
      if (t < B(148.2)) stamp.hide();

      // 注释带
      world.setNote("穿孔纸带 · 示意", ease(rn(t, 126.3, 0.5)) * (1 - ease(rn(t, 131.7, 0.4))));
      world.setNote("穿孔卡链 · 示意", ease(rn(t, 132.3, 0.5)) * (1 - ease(rn(t, 137.7, 0.4))));
      world.setNote("分析机 · 示意", ease(rn(t, 138.3, 0.5)) * (1 - ease(rn(t, 143.7, 0.4))));
      world.setNote("类比，不是结论", ease(rn(t, 148.3, 0.6)) * (1 - ease(rn(t, 152.2, 0.5))));
    },
  };

  /* =========================================================
     S6 · 声明 + 引用 + 问句  n152 – n169.44
     纸页升入：洛芙莱斯 1843 → 声明 → 纸页浮走 → 织锦上升 → 问句
     ========================================================= */
  const EN = "We may say most aptly, that the Analytical Engine weaves algebraical patterns just as the Jacquard-loom weaves flowers and leaves.";
  const ZH = "可以很贴切地说，\n分析机编织的是代数的图案，\n就像雅卡尔织机编织的是花与叶。";
  const page2 = el(
    '<div class="en"></div><div class="zh"><div class="zt"></div></div><div class="sigline"></div><div class="sig">—— 洛芙莱斯，1843</div><div class="sheen"></div>',
    "page page2", "stage");
  const p2en = page2.querySelector(".en"), p2sig = page2.querySelector(".sig"), p2line = page2.querySelector(".sigline"), p2sheen = page2.querySelector(".sheen");
  const p2hand = handwrite(page2.querySelector(".zt"), ZH, { accent: "花与叶" });
  const qend = el('<div class="qbg"></div><p>下一次你对 <b>AI</b> 说话，</p><p>你是<b>画师</b>，还是<b>结本</b>的人？</p>', "qend", "stage");
  const qp = [...qend.querySelectorAll("p")];

  const s6 = {
    state(t) {
      const n = t / BEAT;
      if (t < B(152.2)) { vis(page2, 0); vis(qend, 0); return; }
      // ---- 纸页 ----
      const rise = easeOutBack(rn(t, 152.5, 1.5), 1.2), lift = easeOut(rn(t, 163, 1.1));
      const pa = (t >= B(152.5) ? 1 : 0) * (1 - lift);
      if (pa > 0.004) {
        vis(page2, pa, `translateY(${(520 * (1 - rise) - 300 * lift).toFixed(1)}px)`);
        typed(p2en, EN, ease(rn(t, 154, 3)));
        p2hand.set(ramp(t, B(156), B(6)));
        wipe(p2sig, ease(rn(t, 162, 0.9)), "left");
        p2line.style.transform = `scaleX(${ease(rn(t, 162.3, 0.9)).toFixed(3)})`;
        const ph = mod(t - B(153), 5.5) / 0.9;
        if (ph < 1) { p2sheen.style.opacity = Math.sin(Math.PI * ph).toFixed(3); p2sheen.style.transform = `translateX(${lerp(-300, 1500, ph).toFixed(1)}px)`; } else p2sheen.style.opacity = 0;
      } else vis(page2, 0);
      world.setNote("类比不是结论 · 图为示意 · 本片由代码生成，无实拍素材", ease(rn(t, 158, 0.9)) * (1 - ease(rn(t, 162.5, 0.6))));

      // ---- 织锦上升：从画面下方升起，一路不停 ----
      if (t >= B(162.6)) {
        const u = ramp(t, B(163), B(6)), drift = 6 * Math.max(0, t - B(163));
        const yTop = lerp(1120, 130, easeOut(u)) - drift, a = ease(rn(t, 162.8, 1));
        world.cam({});
        const x0 = 384, SW = 32 * 36;
        ctx.save();
        ctx.beginPath(); ctx.rect(x0 - 6, yTop - 30, SW + 12, 1300); ctx.clip();
        ctx.shadowColor = "rgba(240,193,90,.3)"; ctx.shadowBlur = 30;
        drawClothFull(ctx, { x0, S: 36, cols: 32, Y0: yTop, bit: M16, top: yTop, bottom: 1140, alpha: a });
        ctx.restore();
        // 顶端的金线与露出的纬头
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = PAL.goldLight; ctx.shadowColor = "rgba(240,193,90,.8)"; ctx.shadowBlur = 12;
        ctx.fillRect(x0 - 6, yTop - 3, SW + 12, 4);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = a * 0.7; ctx.strokeStyle = PAL.bare; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 64; i++) { const x = x0 + 9 + i * (SW - 18) / 63; ctx.moveTo(x, yTop - 3); ctx.lineTo(x + Math.sin(i * 1.7 + t) * 2, yTop - 22 - (i % 3) * 6); }
        ctx.stroke(); ctx.restore();
      }

      // ---- 问句 ----
      const q1 = ease(rn(t, 163.5, 0.9)), q2 = ease(rn(t, 165, 0.9));
      vis(qend, Math.max(q1, q2));
      qp[0].style.opacity = q1.toFixed(3); qp[0].style.transform = `translateY(${((1 - q1) * 14).toFixed(1)}px)`;
      qp[1].style.opacity = q2.toFixed(3); qp[1].style.transform = `translateY(${((1 - q2) * 14).toFixed(1)}px)`;
      // 最后 0.5 s 收暗
      const fade = ease(ramp(t, B(168.5), 0.5));
      if (fade > 0) { ctx.save(); world.cam({}); ctx.fillStyle = `rgba(5,8,26,${(0.06 * fade).toFixed(3)})`; ctx.fillRect(-20, -20, 1960, 1120); ctx.restore(); }
    },
  };

  return [s1, s2, s3, s4, s5, s6];
}
