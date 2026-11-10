// 六段画面全部由当前拍数 n 推导；画布每帧从空白重画，段窗口外什么都不画，跳帧不会有残留。
// 坐标是房间的场景坐标（1920×1080 基准），镜头在 world.js 里统一处理。
import { CUE } from "./beats.js";
import { roadZ } from "./world.js";
import { clamp, ease, easeOut, mix, mixP, ramp, windowed, bounce, bump, hash, bez, ellipsePts, along } from "./lib.js";
import { C, group, rr, text, hand, orb, trail, glow, chalk, chalkArrow, phone, box, item, drawer, bulbPts } from "./rig.js";

const E = (n, a, d = 1) => ramp(n, a, d);          // 以拍为单位的 0→1
const fade = (n, a, b, d = 1) => windowed(n, a, b, d);
const on = (n, a, b) => n >= a && n < b;
const cue = (i) => CUE[i][0];

// ══════════ S1 冷开场：签收那一刻（n0–30）══════════
const PHONE = [430, 430, -.09];
const REFRESH = [2.6, 3.6, 4.6, 5.6, 6.6, 7.6, 8.6, 9.5];   // 每拍刷新一次，共 8 次
const BOXP = [1090, 600];
const ORB_LEAVE = bez([1130, 470], [1180, 300], [1420, 250], [1590, 292], 40);
const NEXT = [1678, 273];
function refreshState(n) {
  let count = 0, last = -9;
  for (const r of REFRESH) if (n >= r) { count++; last = r; }
  return { count, pull: bump((n - last) / .7), spin: bump((n - last) / .8), spinA: (n - last) * 9 };
}
/** 物流行。signed∈[0,1]：「已签收」从上方挤进来，「派送中」随之变灰 */
function shipRows(n, signed, count) {
  const sub = count ? `已刷新 ${count} 次` : "刚刚更新";
  return [
    { label: "已签收", sub: "刚刚", tone: "grey", a: signed, dy: 0 },
    { label: "派送中", sub, tone: signed > .5 ? "grey" : "hot", glow: (1 - signed) * (.4 + .6 * clamp(count / 8)) },
    { label: "已发货", sub: "昨天", tone: "done" },
    { label: "已下单", sub: "三天前", tone: "done" },
  ];
}
function s1(w) {
  const { ctx, n, t } = w;
  if (!on(n, 0, 31)) return;
  const out = 1 - E(n, 29.6, 1.2);
  group(ctx, out, () => {
    // 「下一件」：窗边一个还没买的东西的轮廓
    const nx = E(n, 23.5, 2);
    group(ctx, nx * .85, () => {
      ctx.save(); ctx.strokeStyle = C.amber; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(1640, 248); ctx.lineTo(1716, 248); ctx.lineTo(1730, 232); ctx.lineTo(1654, 232); ctx.closePath(); ctx.stroke();
      ctx.strokeRect(1640, 248, 76, 58); ctx.beginPath(); ctx.moveTo(1716, 306); ctx.lineTo(1730, 290); ctx.lineTo(1730, 232); ctx.stroke(); ctx.restore();
      glow(ctx, NEXT[0], NEXT[1], 120, 120, "rgba(255,179,71,A)", .18 * E(n, 26, 1.5));
      text(ctx, "下一件", 1686, 352, 38, "#f0d3a2", { align: "center", weight: 700, shadow: "#000" });
    });
    // 手机：物流页，刷新 8 次
    const r = refreshState(n), signed = E(n, 20, .6);
    const pa = 1 - .45 * E(n, 24, 2);
    group(ctx, pa, () => {
      const rows = shipRows(n, signed, r.count);
      const st = { rows: rows.map((x, i) => ({ ...x, dy: -104 * (1 - signed) })), pull: r.pull, spin: r.spin, spinA: r.spinA };
      st.rows[0].a = signed;
      phone(ctx, PHONE[0], PHONE[1] + 6 * Math.sin(t * .8), PHONE[2], st);
    });
    // 纸箱：敲门后落桌、撕胶带、翻盖；东西拿出来后箱子退场
    if (n >= 16) {
      const drop = bounce((n - 16.1) / 1), y = mix(-260, BOXP[1], drop);
      box(ctx, BOXP[0], y, 1, ease((n - 18.8) / 1.2), ease((n - 18) / .8), 1 - E(n, 23.6, 1.2));
    }
    // 东西：从箱口升起，光已不在它身上；随后被推进抽屉
    if (n >= 20.2) {
      const up = easeOut((n - 20.2) / .8), go = ease((n - 22.2) / 1.1);
      const p = mixP([mix(1130, 1110, up), mix(520, 410, up)], [1640, 560], go);
      item(ctx, p[0], p[1], mix(1, .7, go), .9 * (1 - E(n, 20.6, 1.4)), up * (1 - E(n, 23.2, .4)));
    }
    drawer(ctx, ease((n - 21.6) / .8) * (1 - ease((n - 23.5) / .8)));
    // 「想要」的光：刷新一次亮一点 → 升到画面中间 → 落到纸箱上 → 签收那一下离开，飘向窗边
    let pos, r0, k;
    const c = clamp(r.count / 8);
    if (n < 10) { pos = [640 + 10 * Math.sin(t * 1.3), 250 + 8 * Math.sin(t * .9)]; r0 = 14 + 10 * c; k = .7 + .3 * c; }
    else if (n < 16.8) { const m = ease((n - 10) / 2.5); pos = mixP([640, 250], [930, 300], m); pos[1] += 8 * Math.sin(t * 1.1); r0 = mix(24, 34, m); k = 1; }
    else if (n < 20) { const m = ease((n - 16.8) / 1.4); pos = mixP([930, 300], [1130, 470], m); r0 = mix(34, 28, m); k = 1; }
    else { const u = ease((n - 20) / 7); pos = along(ORB_LEAVE, u); pos[1] += 6 * Math.sin(t * 1.2) * E(n, 26, 1); r0 = mix(28, 22, u); k = 1;
      trail(ctx, (v) => along(ORB_LEAVE, v), Math.max(0, u - .35), u, 12, 8, 1 - E(n, 27, 2)); }
    if (n >= 10 && n < 20) glow(ctx, pos[0], 720, 420, 90, "rgba(255,190,110,A)", .22 * E(n, 10, 3));
    orb(ctx, pos[0], pos[1], r0, k);
  });
}

// ══════════ S2 历史锚点：灯和果汁（n30–106）══════════
const MONKEY = [400, 370], BULB = [830, 220], NOZ = [505, 372], MOUTH = [432, 404];
const TUBE = bez([660, 100], [660, 270], [600, 340], NOZ, 30);
const TL = { y: 520, x0: 620, x1: 1650, light: 830, juice: 1190 };
const TRIALS = [[40, 42], [44, 46], [49, 51], [53, 55], [62, 64]];   // [灯亮, 果汁] 的拍
function monkeyChalk(ctx, p, a) {
  group(ctx, a, () => {
    const [x, y] = MONKEY;
    chalk(ctx, ellipsePts(x, y, 82, 88), clamp(p * 1.6), C.chalk, 5, 11);
    chalk(ctx, ellipsePts(x - 82, y - 26, 28, 30), clamp(p * 1.6 - .3), C.chalk, 5, 12);
    chalk(ctx, ellipsePts(x + 82, y - 26, 28, 30), clamp(p * 1.6 - .35), C.chalk, 5, 13);
    chalk(ctx, ellipsePts(x, y + 18, 50, 46), clamp(p * 1.6 - .5), C.chalkDim, 4, 14);
    if (p > .6) { ctx.fillStyle = C.chalk; for (const dx of [-20, 20]) { ctx.beginPath(); ctx.arc(x + dx, y - 6, 6, 0, Math.PI * 2); ctx.fill(); } }
    chalk(ctx, ellipsePts(x, y + 30, 18, 10, .2, Math.PI - .2, 12), clamp(p * 1.6 - .7), C.chalk, 4, 15);
    chalk(ctx, bez([x - 70, y + 70], [x - 115, y + 140], [x - 108, y + 190], [x - 92, y + 222]), clamp(p * 1.6 - .8), C.chalk, 5, 16);
    chalk(ctx, bez([x + 70, y + 70], [x + 115, y + 140], [x + 108, y + 190], [x + 92, y + 222]), clamp(p * 1.6 - .85), C.chalk, 5, 17);
  });
}
function pulses(ctx, x, amp, seed) {
  if (amp <= .01) return;
  for (let i = 0; i < 5; i++) {
    const xx = x - 28 + i * 14, h = (52 + 46 * hash(seed + i)) * amp;
    chalk(ctx, [[xx, TL.y - 8], [xx, TL.y - 8 - h]], 1, C.amber, 6, seed + i);
  }
  glow(ctx, x, TL.y - 40, 70, 60, "rgba(255,179,71,A)", .25 * amp);
}
function s2(w) {
  const { ctx, n, t } = w;
  if (!on(n, 29, 107)) return;
  const sec = fade(n, 30, 98, 1.6);
  // 注释带与角标
  if (on(n, 30, 106)) {
    w.setMark(n < cue(12) ? "图为示意" : "类比");
    w.setNote(n < cue(6) ? "实验示意：一盏灯、一口果汁、一只猴子"
      : n < cue(8) ? "Schultz 等 1997 · Science · 清醒猴子实验"
      : n < cue(9) ? "学会之后，放电挪到预示果汁的灯上 · Schultz 等 1997 图 1"
      : n < cue(10) ? "奖赏预测误差 reward prediction error"
      : n < cue(11) ? "「想要」Wanting ／「喜欢」Liking · Berridge & Robinson 1998"
      : n < cue(12) ? "「喜欢」来自几处享乐热点 · Berridge & Kringelbach 2015"
      : "类比：快递不是实验，只是结构相同");
  }
  const split = E(n, 77, 1.6), diag = 1 - E(n, 76.5, 1.2);
  let lit = 0; for (const [L] of TRIALS) lit = Math.max(lit, bump((n - L) / 1.6));
  group(ctx, sec, () => {
    // 实验图：猴子、灯泡、果汁管
    const draw = E(n, 31, 4);
    monkeyChalk(ctx, draw, diag);
    group(ctx, diag, () => {
      chalk(ctx, TUBE, clamp(draw * 1.4 - .3), C.chalkDim, 6, 21);
      chalk(ctx, bulbPts(BULB[0], BULB[1], 46), clamp(draw * 1.4 - .2), C.chalk, 5, 22);
      chalk(ctx, [[BULB[0] - 18, BULB[1] + 72], [BULB[0] + 18, BULB[1] + 72]], clamp(draw * 1.4 - .5), C.chalk, 5, 23);
      // 每次试次：灯亮 → 两拍后一滴果汁落进嘴里
      for (const [, J] of TRIALS) {
        const d = (n - J) / .9;
        if (d > 0 && d < 1) { const p = mixP(NOZ, MOUTH, easeOut(d)); ctx.fillStyle = "#ffd9a0"; ctx.globalAlpha = 1 - d * .6; ctx.beginPath(); ctx.ellipse(p[0], p[1], 9, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      }
      if (lit > .02) for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .42; chalk(ctx, [[BULB[0] + 62 * Math.cos(a), BULB[1] + 62 * Math.sin(a)], [BULB[0] + (62 + 26 * lit) * Math.cos(a), BULB[1] + (62 + 26 * lit) * Math.sin(a)]], 1, C.amber, 4, 30 + i); }
    });
    // 时间线：灯亮与果汁两个刻度
    const tl = E(n, 47, 1.5) * (1 - E(n, 77, 1));
    group(ctx, tl, () => {
      chalk(ctx, [[TL.x0, TL.y], [TL.x1, TL.y]], E(n, 47, 1.5), C.chalk, 5, 40);
      for (const [x, s] of [[TL.light, "灯亮"], [TL.juice, "果汁"]]) {
        chalk(ctx, [[x, TL.y - 12], [x, TL.y + 12]], 1, C.chalk, 5, x);
        hand(ctx, s, x, TL.y + 46, 40, C.chalkDim, E(n, 48, 1), { align: "center" });
      }
      // 学会之前：放电在果汁处；几天后：滑到灯亮处
      const shift = ease((n - 58.5) / 2.5);
      for (const [L, J] of TRIALS) {
        if (J < 58) pulses(ctx, TL.juice, bump((n - J) / 2), J * 3);
        else pulses(ctx, TL.light, bump((n - L) / 2), L * 3);
      }
      if (n >= 58 && n < 62.5) pulses(ctx, mix(TL.juice, TL.light, shift), .85 * fade(n, 58, 62.5, .6), 77);
      hand(ctx, "果汁来了 → 放电", 1290, 370, 44, C.hand, E(n, 51.5, 1.5) * (1 - E(n, 57, .8)));
      group(ctx, E(n, 61, 1) * (1 - E(n, 66, .8)), () => {
        chalkArrow(ctx, bez([1180, 400], [1080, 350], [960, 350], [880, 396], 20), E(n, 61, 1.2), C.hand, 4);
        hand(ctx, "挪到了灯上", 920, 318, 44, C.hand, E(n, 61.5, 1.2));
      });
    });
    // 日历角：几天后
    group(ctx, fade(n, 56, 64, .8), () => {
      for (let i = 0; i < 3; i++) {
        const f = ease((n - 56.4 - i * .7) / .6), x = 1560, y = 150;
        ctx.save(); ctx.translate(x, y); ctx.rotate(-.04 + .02 * i); ctx.scale(1, i < 2 ? 1 - f : 1);
        rr(ctx, -70, 0, 140, 130, 6, i === 2 ? "#efe5cf" : "#e3d6bb", "#bca97f", 2);
        rr(ctx, -70, 0, 140, 30, 6, "#b9663f"); text(ctx, ["1", "2", "5"][i], 0, 74, 60, "#2c2417", { align: "center", weight: 800 }); ctx.restore();
      }
      hand(ctx, "几天后", 1560, 300, 42, C.hand, E(n, 57.5, 1), { align: "center" });
    });
    // 「爽不爽」 → 「比预想的好，还是差」
    group(ctx, fade(n, 66, 77, .8), () => {
      hand(ctx, "爽不爽", 1180, 230, 60, C.chalk, E(n, 66.5, 1.2));
      chalk(ctx, [[1166, 236], [1370, 222]], E(n, 69, .6), C.hand, 6, 51);
      hand(ctx, "比预想的好，还是差", 1180, 350, 56, C.hand, E(n, 70, 1.6));
      chalk(ctx, ellipsePts(1418, 352, 270, 62, -2.6, 3.9, 60), E(n, 72, 1.2), C.hand, 4, 52);
    });
    // 一条线分成两条：想要（琥珀）与喜欢（暖白）
    group(ctx, E(n, 76.5, 1), () => {
      const yA = mix(TL.y, 420, split), yL = mix(TL.y, 560, split), grow = E(n, 85.5, 4);
      const xA1 = mix(1380, 1660, grow), wA = mix(5, 12, grow);
      if (grow > .02) glow(ctx, (480 + xA1) / 2, yA, (xA1 - 480) / 2 + 80, 60, "rgba(255,179,71,A)", .22 * grow);
      chalk(ctx, [[480, yA], [xA1, yA]], E(n, 76.5, 1.2), C.amber, wA, 61);
      chalk(ctx, [[480, yL], [mix(1380, 960, grow), yL]], E(n, 76.5, 1.2), C.chalk, 6, 62);
      if (grow > .02) { glow(ctx, mix(1380, 960, grow), yL, 40, 40, "rgba(255,240,215,A)", .5 * grow); ctx.fillStyle = C.chalk; ctx.beginPath(); ctx.arc(mix(1380, 960, grow), yL, 9 * grow, 0, Math.PI * 2); ctx.fill(); }
      hand(ctx, "想要", 360, yA, 56, C.amberHi, split, { align: "center" });
      hand(ctx, "喜欢", 360, yL, 56, C.chalk, split, { align: "center" });
      hand(ctx, "多巴胺 ≠ 快乐", 1120, 300, 60, C.hand, E(n, 87, 1.6));
      if (grow > .95) chalkArrow(ctx, [[xA1 - 40, yA], [xA1 + 20, yA]], 1, C.amber, 8, 63);
    });
  });
  // 类比：「已发货」就是那盏灯，拆开只是喝到早就料到的果汁
  const an = fade(n, 96, 107, 1.2);
  group(ctx, an, () => {
    phone(ctx, PHONE[0], PHONE[1], PHONE[2], { rows: [
      { label: "已发货", sub: "这就是那盏灯", tone: "hot", glow: 1 },
      { label: "已下单", sub: "三天前", tone: "done" },
    ] });
    chalk(ctx, bulbPts(700, 300, 54), E(n, 97, 1.2), C.amber, 5, 71);
    hand(ctx, "＝ 灯", 790, 300, 56, C.amberHi, E(n, 98, 1));
    box(ctx, 1230, 620, .8, 0, 0, 1);
    chalk(ctx, [[1230, 296], ...bez([1230, 296], [1214, 322], [1206, 340], [1214, 352], 8), ...bez([1214, 352], [1222, 366], [1238, 366], [1246, 352], 8), ...bez([1246, 352], [1254, 340], [1246, 322], [1230, 296], 8)], E(n, 100, 1), "#ffd9a0", 5, 72);
    hand(ctx, "拆开 ＝ 喝到果汁", 1230, 250, 52, C.hand, E(n, 100.5, 1.4), { align: "center" });
  });
  // 光：从窗边飞到灯泡里，成为那盏灯；线分叉后沿「想要」线往前跑；类比段落在手机上
  let pos, r0 = 22, k = 1;
  if (n < 37) { pos = mixP([1590, 292], BULB, ease((n - 30) / 7)); r0 = mix(22, 18, ease((n - 30) / 7)); }
  else if (n < 77) { pos = [BULB[0], BULB[1] - 4]; r0 = 14 + 12 * lit; k = .35 + .65 * lit; }
  else if (n < 96) { const yA = mix(TL.y, 420, split), g = E(n, 85.5, 4); pos = mixP(mixP(BULB, [480, yA], ease((n - 77) / 2)), [mix(1380, 1660, g), yA], g); r0 = 20 + 6 * g; }
  else { pos = mixP([1660, 420], [PHONE[0] - 120, PHONE[1] - 120], ease((n - 96) / 2.5)); r0 = mix(26, 30, ease((n - 96) / 2.5)); k = 1 - E(n, 104.5, 1.5); }
  if (n >= 30) orb(ctx, pos[0], pos[1], r0, k);
}

// ══════════ 桌上的那件东西：S3–S5 一直在桌上（S4 调查段与 S5 长路段让开）══════════
const ITEM = [1000, 560], ITEM_S = 1.25;
function itemState(n, E) {
  const a = E(n, 105, 1.6) * (1 - E(n, 159, 1.4) + E(n, 213, 1.4)) * (1 - E(n, 296, 1));
  const bob = 40 * bump((n - 114.5) / 1.4) + 40 * bump((n - 118) / 1.4);
  let shine = 1 + .35 * bump((n - 114.5) / 1.4) + .35 * bump((n - 118) / 1.4);
  shine *= 1 - .85 * E(n, 146.5, 3);                 // 光离开它
  shine = Math.max(shine, .55 * E(n, 279, 2.5));      // S5：台灯重新打亮它
  return { a, y: ITEM[1] - bob, shine };
}
function deskItem(w) {
  const { ctx, n, E: env } = w;
  if (!on(n, 104, 297)) return;
  const st = itemState(n, E);
  // 房间变亮时，它自己的光被周围吃掉
  const seen = clamp(1 - 1.25 * env.ambient);
  group(ctx, st.a * (1 - env.road) * (1 - env.lr), () => item(ctx, ITEM[0], st.y, ITEM_S, st.shine * seen, 1));
}

// ══════════ S3 机制：三周以后（n106–151）══════════
const NEXT2 = [1612, 300];
function calendarPage(ctx, x, y, num, sy = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
  rr(ctx, -100, 0, 200, 230, 8, "#efe5cf", "#bca97f", 2); rr(ctx, -100, 0, 200, 52, 8, "#b9663f");
  text(ctx, "第", -58, 27, 30, "#fff3e0", { align: "center", weight: 800 }); text(ctx, "天", 58, 27, 30, "#fff3e0", { align: "center", weight: 800 });
  text(ctx, num, 0, 142, 104, "#2c2417", { align: "center", weight: 900 });
  ctx.restore();
}
function headphones(ctx, x, y, p, a) {
  group(ctx, a, () => {
    chalk(ctx, ellipsePts(x, y + 10, 62, 66, Math.PI * 1.05, Math.PI * 1.95, 30), p, C.amber, 5, 91);
    rr(ctx, x - 78, y + 2, 30, 62, 12, null, C.amber, 5); rr(ctx, x + 48, y + 2, 30, 62, 12, null, C.amber, 5);
  });
}
function s3(w) {
  const { ctx, n, t } = w;
  if (!on(n, 105, 158)) return;
  if (on(n, 106, 151)) {
    w.setMark(n >= cue(16) ? "类比" : "");
    if (n >= cue(17)) w.setNote("享乐适应 hedonic adaptation · Brickman & Campbell 1971 · 类比示意");
  }
  // 墙上的日历：第 1 天 → 第 7 天 → 第 21 天
  group(ctx, fade(n, 120.5, 151, 1), () => {
    const flips = [[122, "1"], [124.5, "7"], [127, "21"]];
    let cur = "1", prev = null, k = 1;
    for (let i = 0; i < flips.length; i++) if (n >= flips[i][0]) { cur = flips[i][1]; prev = i ? flips[i - 1][1] : null; k = ease((n - flips[i][0]) / .6); }
    calendarPage(ctx, 330, 190, cur);
    if (prev && k < 1) calendarPage(ctx, 330, 190, prev, 1 - k);
  });
  // 手写批注：它没变暗 → 周围变亮了；「享乐适应」与被推高的基线
  group(ctx, fade(n, 129.5, 151, 1), () => {
    hand(ctx, "它没变暗 → 周围变亮了", 620, 200, 56, "#fff6e6", E(n, 130, 2));
  });
  group(ctx, fade(n, 136, 151, 1), () => {
    hand(ctx, "享乐适应", 700, 330, 80, "#fff6e6", E(n, 136.5, 1.4));
    const by = mix(470, 410, ease((n - 140) / 1.6));
    chalk(ctx, [[560, by], [1300, by]], E(n, 138.5, 1.2), "#fff6e6", 6, 81);
    if (n > 140) chalkArrow(ctx, [[1340, 480], [1340, by - 6]], E(n, 140, 1), C.amberHi, 5, 82);
    hand(ctx, "新的「正常」", 1370, by - 46, 44, "#fff6e6", E(n, 141.5, 1.2));
  });
  // 窗外的下一件亮起来；桌上那团已经淡掉的光朝它飘过去
  headphones(ctx, NEXT2[0], NEXT2[1] - 40, E(n, 146.5, 1.4), fade(n, 146, 158, 1) * (.6 + .4 * Math.sin(t * 2) ** 2));
  glow(ctx, NEXT2[0], NEXT2[1], 140, 140, "rgba(255,179,71,A)", .2 * fade(n, 147, 158, 1.5));
  if (on(n, 146.5, 152)) {
    const path = bez([ITEM[0], ITEM[1] - 80], [1150, 320], [1420, 250], NEXT2, 30), u = ease((n - 146.5) / 4);
    trail(ctx, (v) => along(path, v), Math.max(0, u - .3), u, 10, 6, .7);
    orb(ctx, ...along(path, u), 18, .6 * (1 - E(n, 151, 1)));
  }
}

// ══════════ S4 反直觉转折：会变的尺子（n151–228）══════════
const RULER = { x: 1240, base: 650 };
const ITEM_TOP = ITEM[1] - 76 * ITEM_S - 4;            // 东西顶端，尺子从这里读数
/** 尺子此刻的单位长度（px/格）：开始量出 8 格（挺好），重画后 5 → 4 → 3 */
function unitAt(n, E) {
  const h = RULER.base - ITEM_TOP;
  let v = 8;
  v = mix(v, 5, E(n, 215, 1.5)); v = mix(v, 4, E(n, 223, .8)); v = mix(v, 3, E(n, 225.6, .8));
  return h / v;
}
function ruler(ctx, u, p, a) {
  group(ctx, a, () => {
    const { x, base } = RULER, top = Math.max(150, base - 10 * u);
    chalk(ctx, [[x, base], [x, top]], p, C.chalk, 6, 101);
    for (let i = 0; i <= 10; i++) {
      const y = base - i * u; if (y < 150) break;
      if (p < i / 10) break;
      chalk(ctx, [[x - (i % 2 ? 14 : 24), y], [x, y]], 1, C.chalk, 4, 110 + i);
      if (i % 2 === 0 && i) text(ctx, String(i), x - 40, y, 36, C.chalk, { align: "right", font: "hand" });
    }
  });
}
const DOC = [610, 410];
function surveyDoc(ctx, y0, a) {
  group(ctx, a, () => {
    ctx.save(); ctx.translate(DOC[0], DOC[1] + y0); ctx.rotate(-.035);
    ctx.shadowColor = "#000c"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    const g = ctx.createLinearGradient(-380, -235, 380, 235); g.addColorStop(0, "#efe5cf"); g.addColorStop(1, "#d8c7a2");
    rr(ctx, -380, -235, 760, 470, 6, g); ctx.shadowColor = "transparent";
    ctx.strokeStyle = "rgba(90,67,32,.07)"; ctx.lineWidth = 1;
    for (let y = -223; y < 235; y += 13) { ctx.beginPath(); ctx.moveTo(-380, y); ctx.lineTo(380, y); ctx.stroke(); }
    text(ctx, "美国陆军士兵调查 · 1944", -320, -175, 28, "#6b5634", { font: "serif", weight: 700 });
    text(ctx, "有能力的兵，", -320, -85, 56, "#2c2417", { font: "serif", weight: 900 });
    text(ctx, "在军队里升得上去吗？", -320, -5, 56, "#2c2417", { font: "serif", weight: 900 });
    text(ctx, "“Do you think a soldier with ability has a good", -320, 75, 25, "#5b4a30", { font: "serif", weight: 500 });
    text(ctx, "chance for promotion in the Army?”", -320, 108, 25, "#5b4a30", { font: "serif", weight: 500 });
    text(ctx, "入伍 1–2 年 · 美国本土白人士兵", -320, 185, 26, "#6b5634", { font: "serif", weight: 600 });
    ctx.restore();
  });
}
const BLK = { y0: 300, h: 320, w: 210, mp: 1120, air: 1450 };
function block(ctx, x, label, pct, color, grow, a, hi = 0) {
  group(ctx, a, () => {
    const { y0, h, w } = BLK, fillH = h * pct * grow;
    rr(ctx, x, y0, w, h, 10, "rgba(18,22,34,.86)", "rgba(200,190,170,.55)", 3);
    if (fillH > 1) { rr(ctx, x + 4, y0 + h - fillH, w - 8, fillH - 4, 7, color); if (hi) glow(ctx, x + w / 2, y0 + h - fillH / 2, w, fillH, "rgba(255,190,110,A)", .35 * hi); }
    text(ctx, label, x + w / 2, y0 - 42, 44, C.text, { align: "center", weight: 800, shadow: "#000" });
    if (grow > .05) text(ctx, `${Math.round(pct * 100 * clamp(grow))}%`, x + w / 2, y0 + 80, 84, "#fffaf2", { align: "center", weight: 900, shadow: "#000" });
  });
}
function you(ctx, x, y, a, color = C.chalk) {
  group(ctx, a, () => { chalk(ctx, ellipsePts(x, y, 34, 34), 1, color, 4, Math.round(x)); text(ctx, "你", x, y, 34, color, { align: "center", font: "hand" }); });
}
function feedPhone(ctx, n, a) {
  group(ctx, a, () => {
    ctx.save(); ctx.translate(430, 430); ctx.rotate(-.09);
    ctx.shadowColor = "#000d"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
    rr(ctx, -180, -305, 360, 610, 46, C.phone, "#2e3a4c", 3); ctx.shadowColor = "transparent";
    rr(ctx, -162, -285, 324, 570, 32, C.screen);
    ctx.save(); ctx.beginPath(); ctx.roundRect(-162, -285, 324, 570, 32); ctx.clip();
    const off = Math.max(0, n - 219.5) * 70, cols = [C.amber, "#6fd3c8", "#f2e6d0", "#ff9a6b", "#9ad0ff"];
    for (let i = 0; i < 9; i++) {
      const y = -230 + i * 150 - off;
      if (y < -420 || y > 420) continue;
      rr(ctx, -140, y, 280, 130, 16, "#16233a");
      const c = cols[i % cols.length]; glow(ctx, -60, y + 65, 70, 50, `rgba(${c === C.amber ? "255,179,71" : "200,220,255"},A)`, .35);
      rr(ctx, -118, y + 18, 110, 94, 12, c);
      rr(ctx, 10, y + 34, 108, 16, 8, "#3a4a66"); rr(ctx, 10, y + 70, 76, 16, 8, "#2c3a52");
    }
    ctx.restore(); ctx.restore();
  });
}
function s4(w) {
  const { ctx, n, t } = w;
  if (!on(n, 150, 229)) return;
  if (on(n, 151, 228)) {
    w.setMark(n < cue(20) || n >= cue(27) ? "类比" : "图为示意");
    w.setNote(n < cue(20) ? "类比：尺子＝你拿来衡量的参照"
      : n < cue(24) ? "Stouffer 等《美国士兵》1949 · 图 IX · 入伍 1–2 年白人士兵"
      : n < cue(26) ? "只说对升职的看法：航空兵对军中工作反而更满意（36% 对 21%）"
      : n < cue(27) ? "相对剥夺 relative deprivation · Stouffer 等 1949"
      : n < cue(28) ? "类比：同一件东西，换一把尺子就被量短"
      : "类比：刷到的别人的东西，都在悄悄换掉你的参照");
  }
  // 尺子：开场量出「挺好」；调查段让开；回来后被重画
  const ra = fade(n, 151.5, 229, 1) * (1 - E(n, 159, 1.4) + E(n, 213, 1.4));
  const u = unitAt(n, E);
  ruler(ctx, u, E(n, 152, 2), ra);
  group(ctx, ra * E(n, 154.5, 1), () => {
    chalk(ctx, [[ITEM[0] + 100, ITEM_TOP], [RULER.x - 6, ITEM_TOP]], 1, C.amberHi, 3, 120);
    const words = [[0, "挺好"], [215.8, "一般"], [223.2, "还差点"], [225.8, "差远了"]];
    let i = 0; for (let k = 0; k < words.length; k++) if (n >= words[k][0]) i = k;
    const wk = i ? E(n, words[i][0], .8) : E(n, 155, 1.2);
    if (i) hand(ctx, words[i - 1][1], RULER.x + 30, ITEM_TOP - 4, 46, C.chalkDim, 1 - wk);
    hand(ctx, words[i][1], RULER.x + 30, ITEM_TOP - 4, 46, C.hand, wk);
  });
  // 1944 年调查：纸落进台灯光圈，右边两队人各是一整块
  const sv = fade(n, 159.5, 213.5, 1.2);
  surveyDoc(ctx, mix(-760, 0, bounce((n - 159.6) / 1.1)), sv);
  const airHi = .6 + .4 * Math.sin(t * 3) * E(n, 198, 1) * (1 - E(n, 207, 1));
  block(ctx, BLK.mp, "宪兵", .24, "#9aa7b8", E(n, 171, 1.6), sv * E(n, 169.5, 1));
  block(ctx, BLK.air, "航空兵", .47, "rgba(255,179,71,.92)", E(n, 178, 1.6), sv * E(n, 177, 1), airHi * E(n, 198, 1));
  group(ctx, sv, () => {
    chalk(ctx, ellipsePts(BLK.air + BLK.w / 2, BLK.y0 + 80, 150, 52, -2.4, 4.2, 50), E(n, 185, 1.2), C.hand, 5, 130);
    hand(ctx, "可他们更不看好升职？", 1395, 668, 46, C.hand, E(n, 186, 1.6) * (1 - E(n, 191, .8)), { align: "center" });
    group(ctx, E(n, 191.5, 1) * (1 - E(n, 207, 1)), () => {
      ctx.save(); ctx.setLineDash([14, 14]); chalk(ctx, ellipsePts(BLK.air + BLK.w / 2, BLK.y0 + BLK.h / 2 + 4, 158, 214), E(n, 191.5, 1.6), C.chalk, 4, 131); ctx.restore();
      hand(ctx, "身边的人", 1700, 470, 42, C.chalk, E(n, 193, 1.2));
      you(ctx, BLK.mp + BLK.w / 2, 490, E(n, 194, 1)); you(ctx, BLK.air + BLK.w / 2, 440, E(n, 194, 1), C.amberHi);
      hand(ctx, "大多数都没升", BLK.mp + BLK.w / 2, 668, 42, C.chalk, E(n, 199, 1.4), { align: "center" });
      hand(ctx, "将近一半升了", BLK.air + BLK.w / 2, 668, 42, C.hand, E(n, 200.5, 1.4), { align: "center" });
    });
    hand(ctx, "相对剥夺", 1395, 175, 70, C.hand, E(n, 207.5, 1.4), { align: "center" });
  });
  // 手机信息流：每划过一条，尺子的刻度就跟着跳一次
  feedPhone(ctx, n, fade(n, 219, 229, 1));
}

// ══════════ S5 现实落点：熄灭的理由（n228–295）══════════
function icons(ctx, n, a) {
  group(ctx, a, () => {
    const p1 = E(n, 229, 1.2), p2 = E(n, 231, 1.2), p3 = E(n, 233, 1.2);
    chalk(ctx, bulbPts(540, 280, 42), p1, C.chalk, 5, 141); orb(ctx, 540, 276, 12, .7 * p1 * (1 - E(n, 231, 2)));
    chalk(ctx, [[610, 300], ...bez([610, 300], [596, 322], [592, 338], [604, 348], 6), ...bez([604, 348], [618, 356], [628, 340], [610, 300], 6)], p1, "#ffd9a0", 4, 142);
    chalk(ctx, [[890, 240], [1030, 240], [1030, 350], [890, 350], [890, 240]], p2, C.chalk, 5, 143);
    chalkArrow(ctx, [[960, 330], [960, 262]], p2, C.amberHi, 5, 144);
    chalk(ctx, [[1360, 230], [1360, 370]], p3, C.chalk, 5, 145);
    for (let i = 0; i < 6; i++) chalk(ctx, [[1340, 236 + i * 26], [1360, 236 + i * 26]], p3, C.chalk, 4, 146 + i);
    chalkArrow(ctx, ellipsePts(1410, 300, 34, 34, -2.5, 1.8, 24), p3, C.hand, 4, 152);
    hand(ctx, "想要烧完", 560, 440, 44, C.chalk, E(n, 229.6, 1), { align: "center" });
    hand(ctx, "习惯调暗", 960, 440, 44, C.chalk, E(n, 231.6, 1), { align: "center" });
    hand(ctx, "比较换尺", 1370, 440, 44, C.chalk, E(n, 233.6, 1), { align: "center" });
    hand(ctx, "？", 960, 140, 150, C.hand, E(n, 236.5, 1), { align: "center" });
  });
}
const FIRE = [800, 740];
/** 剪影：stand∈[0,1] 坐 → 站；walk 为步态相位；scale 随远去缩小 */
function figure(ctx, x, y, s, stand, walk) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const sw = Math.sin(walk) * 22 * stand, hip = [0, mix(-60, -120, stand)], head = [mix(10, 0, stand), mix(-170, -250, stand)];
  const col = "#05070b"; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = "round"; ctx.lineWidth = 26;
  const leg = (dir) => { const knee = [mix(46 * dir + 30, sw * dir * .6, stand), mix(-58, -60, stand)], foot = [mix(54 + 20 * dir, sw * dir, stand), 0];
    ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(...knee); ctx.lineTo(...foot); ctx.stroke(); };
  leg(1); leg(-1);
  ctx.beginPath(); ctx.moveTo(...hip); ctx.lineTo(head[0], head[1] + 52); ctx.stroke();
  ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(head[0], head[1] + 66); ctx.lineTo(head[0] - sw * .5 + 30 * (1 - stand), hip[1] + 10); ctx.stroke();
  ctx.beginPath(); ctx.arc(head[0], head[1] + 18, 26, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function fire(ctx, t, a) {
  group(ctx, a, () => {
    glow(ctx, FIRE[0], FIRE[1] - 30, 260, 140, "rgba(255,140,60,A)", .45);
    for (let i = 0; i < 5; i++) {
      const h = 60 + 30 * Math.sin(t * 7 + i * 1.7), x = FIRE[0] - 30 + i * 15;
      ctx.fillStyle = i % 2 ? "#ffb347" : "#ff7a3a"; ctx.beginPath(); ctx.moveTo(x - 14, FIRE[1]); ctx.quadraticCurveTo(x, FIRE[1] - h, x + 14, FIRE[1]); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = "#3a2618"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(FIRE[0] - 50, FIRE[1] + 4); ctx.lineTo(FIRE[0] + 50, FIRE[1] - 2); ctx.stroke();
  });
}
function roadAt(u) { const k = Math.pow(clamp(u), .8); return [mix(700, 958, k), mix(745, 486, k), mix(1, .16, k)]; }
function s5(w) {
  const { ctx, n, t, E: env } = w;
  if (!on(n, 227, 296)) return;
  if (on(n, 228, 295)) {
    w.setMark(on(n, cue(31), cue(33)) ? "思想实验" : on(n, cue(33), cue(35)) ? "一种解释" : "");
    w.setNote(on(n, cue(31), cue(32)) ? "思想实验：如果拿到手，光就永远不熄"
      : on(n, cue(32), cue(33)) ? "思想实验：吃饱一顿就永远满足的祖先"
      : on(n, cue(33), cue(35)) ? "Rayo & Becker 2007 · 快乐的参照点随处境更新 · 进化模型，非定论"
      : on(n, cue(35), cue(36)) ? "Sheldon & Lyubomirsky 2012 · 欣赏与新鲜感能减缓享乐适应" : "");
  }
  icons(ctx, n, fade(n, 228.5, 243.5, 1));
  // 光永远不散：落在桌上那件东西上，一动不动
  if (on(n, 242, 254)) orb(ctx, ...mixP([960, -60], [ITEM[0], ITEM_TOP - 30], ease((n - 242.5) / 2.5)), 30, 1 - env.road);
  // 荒野长路：坐在火边不动的祖先 → 站起来往前走，光总在前面一点
  if (env.road > .002) {
    w.screen();
    group(ctx, env.road, () => {
      fire(ctx, t, 1);
      const stand = E(n, 259.5, 1.6), u = Math.pow(clamp((n - 261) / 14), 1.35);
      const [fx, fy, fs] = roadAt(u), walk = n * Math.PI * (1.4 + 1.6 * clamp((n - 270) / 5));
      if (u < .02) figure(ctx, 700, 745, 1, stand, walk); else figure(ctx, fx, fy, fs, 1, walk);
      // 参照点：路面上一道光，总在人前面一点
      const ua = n < 259.5 ? 0 : Math.min(1, u + .1 + .05 * E(n, 259.5, 2)), [ox, oy, os] = roadAt(ua);
      if (n >= 259.5) { const half = mix(240, 30, Math.pow(ua, .8)); ctx.strokeStyle = `rgba(255,179,71,${.75})`; ctx.lineWidth = 6 * os + 2; ctx.beginPath(); ctx.moveTo(960 - half, oy + 6); ctx.lineTo(960 + half, oy + 6); ctx.stroke(); }
      const op = n < 259.5 ? [FIRE[0], FIRE[1] - 150] : [ox + (960 - ox) * .4, oy - 120 * os - 20];
      orb(ctx, op[0], op[1] + (n < 259.5 ? 0 : 6 * Math.sin(t * 2)), n < 259.5 ? 26 : 10 + 18 * os, 1);
      // 路的尽头亮起一串光点
      for (let i = 0; i < 9; i++) { const k = E(n, 270 + i * .3, .6), [px, py, ps] = roadAt(.55 + i * .05); if (k > 0) orb(ctx, 960, py - 4, 5 + 8 * ps, .8 * k); }
    });
    w.useCam();
  }
  // 回到书桌：台灯重新打亮那件东西；光停在它和窗外「下一件」之间
  const back = fade(n, 276.5, 296, 1.5) * (1 - env.lr);
  group(ctx, back, () => {
    headphones(ctx, NEXT2[0], NEXT2[1] - 40, 1, .5 + .3 * E(n, 285, 2));
    glow(ctx, NEXT2[0], NEXT2[1], 140, 140, "rgba(255,179,71,A)", .18 * E(n, 285, 2));
    const hp = [1310 + 20 * Math.sin(t * .8), 390 + 14 * Math.sin(t * 1.1)];
    orb(ctx, ...mixP(hp, NEXT2, ease((n - 293) / 2)), 22, .85);
  });
}

// ══════════ S6 结尾：往前（n295–319）══════════
function flyer(ctx, kind, x, y, s, a) {
  group(ctx, a, () => {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (kind === 0) box(ctx, 0, 0, .55, .9, 1, 1);
    if (kind === 1) { chalk(ctx, bulbPts(0, 0, 50), 1, C.chalk, 6, 161); orb(ctx, 0, -4, 14, .8); }
    if (kind === 2) { chalk(ctx, [[0, -90], [0, 90]], 1, C.chalk, 7, 162); for (let i = 0; i < 7; i++) chalk(ctx, [[-22, -84 + i * 28], [0, -84 + i * 28]], 1, C.chalk, 5, 163 + i); }
    if (kind === 3) { rr(ctx, -70, -80, 140, 160, 8, "#efe5cf"); rr(ctx, -70, -80, 140, 34, 8, "#b9663f"); text(ctx, "21", 0, 22, 64, "#2c2417", { align: "center", weight: 900 }); }
    ctx.restore();
  });
}
function card(ctx, a) {
  group(ctx, a, () => {
    rr(ctx, 250, 150, 1420, 500, 22, "rgba(8,9,14,.82)", "rgba(255,207,138,.55)", 2);
    text(ctx, "声明", 310, 214, 40, C.amberHi, { weight: 800 });
    const L = ["「快递＝信号灯」「变亮的房间」「会变的尺子」都是类比；", "实验与调查画面为示意；进化部分是一种解释，不是定论；", "本片不构成心理或消费建议。"];
    L.forEach((s, i) => text(ctx, s, 310, 286 + i * 58, 38, "#f4eee4", { weight: 600 }));
    text(ctx, "引用", 310, 488, 34, C.amberHi, { weight: 800 });
    text(ctx, "Schultz 等 1997 · Berridge & Robinson 1998 · Berridge & Kringelbach 2015", 310, 542, 30, "#d8ccb6", { weight: 500 });
    text(ctx, "Brickman & Campbell 1971 · Stouffer 等 1949 · Rayo & Becker 2007 · Sheldon & Lyubomirsky 2012", 310, 590, 30, "#d8ccb6", { weight: 500 });
  });
}
function s6(w) {
  const { ctx, n, t, E: env } = w;
  if (n < 294 || env.lr <= .002) return;
  w.screen();
  const z = roadZ(n);
  // 路两边掠过全片的物件：纸箱、灯、尺子、日历
  for (let i = 0; i < 8; i++) {
    const d = ((i / 8 + z * .45) % 1), p = d * d * d, side = i % 2 ? 1 : -1;
    flyer(ctx, i % 4, 960 + side * (180 + 1150 * p), 452 + 520 * p - 160 * p, .2 + 1.6 * p, env.lr * clamp(d * 3) * clamp((1 - d) * 8));
  }
  // 光拉成一条路：光团在路中央，身后一道光一直连到消失点
  const heat = clamp((n - 295) / 24), oy = mix(640, 600, heat);
  ctx.save(); const g = ctx.createLinearGradient(960, 452, 960, oy); g.addColorStop(0, "rgba(255,179,71,0)"); g.addColorStop(1, "rgba(255,214,150,.95)");
  ctx.strokeStyle = g; ctx.lineWidth = 10 + 16 * heat; ctx.lineCap = "round"; ctx.globalAlpha = env.lr; ctx.beginPath(); ctx.moveTo(960, 452); ctx.lineTo(960, oy); ctx.stroke(); ctx.restore();
  orb(ctx, 960, oy + 4 * Math.sin(t * 3), 34 + 26 * heat, env.lr);
  card(ctx, fade(n, 301, 311, .8));
  // 问句：画面自画（noshow），最后半拍白闪硬切
  const qa = E(n, 311.3, 1.2);
  group(ctx, qa, () => {
    ctx.save(); ctx.translate(960, 300); const sc = mix(.9, 1, easeOut((n - 311.3) / 2)); ctx.scale(sc, sc);
    text(ctx, "你上一次真正觉得「够了」，", 0, -50, 76, "#fffaf2", { align: "center", weight: 900, shadow: "#ffb347" });
    text(ctx, "是什么时候？", 0, 50, 76, "#fffaf2", { align: "center", weight: 900, shadow: "#ffb347" });
    ctx.restore();
  });
  const fl = E(n, 318.3, .7);
  if (fl > 0) { ctx.fillStyle = `rgba(255,250,240,${fl})`; ctx.fillRect(0, 0, 1920, 1080); }
  w.useCam();
}

export function sections(world) {
  return [s1, s2, deskItem, s3, s4, s5, s6].map((f) => ({ state: () => f(world) }));
}
