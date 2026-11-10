// 六段合一。每段按拍数 n 画当前这一帧；所有落点都从 CUE（每句字幕的拍窗口）算出，改文案不用改这里。
import { CUE, CARD_N, Q_N, END_N, SEC_N } from "./beats.js";
import { clamp, ease, easeOut, easeIn, mix, ramp, windowed, hash, bump } from "./lib.js";
import { C, group, at, rr, text, glow, paper, bars, alarm, priceTag, stamp, penRing, penLine, gear, bottle, figure, flame, puzzle, balance } from "./rig.js";

const A = (i) => CUE[i][0], Z = (i) => CUE[i][1];
/** 落下的一击：n 过了 at 之后的短促抖动（只看当前时间） */
const slam = (n, at, k = 1) => (n < at || n > at + 1.6) ? 0 : k * Math.exp(-(n - at) * 3.4) * Math.sin((n - at) * 22);
/** 报警器每拍闪一下 */
const beatFlash = (n, floor = .55) => mix(floor, 1, Math.exp(-((n % 1) * 3.2)));
/** 纸面的微微起伏 */
const sway = (t, i = 0) => .004 * Math.sin(t * .6 + i);
/** 从 0 到 n 对速度积分（步长固定，结果只取决于 n） */
function integ(f, n, dn = .25) { let s = 0; for (let x = 0; x < n; x += dn) s += f(x) * Math.min(dn, n - x); return s; }
/** 发动机转速（弧度/拍）：循环接上后才转，点火后提速，批评那一下猛增，结尾冲顶 */
const speed = (n) => .10 * ramp(n, A(26), 4) + .16 * ramp(n, A(27), 1.5) + .28 * ramp(n, A(30), 1.5) * (1 - .55 * ramp(n, A(32), 3)) + .3 * ramp(n, A(38) - 2, 3) + .8 * ramp(n, CARD_N[0], 16);
/** 飞掠版面走了多远：匀加速，由拍数直接算 */
const flyZ = (n) => { const m = Math.max(0, n - (A(38) - 1)); return .02 * m + .0028 * m * m; };

const GEARS = [[-138, -128, "警报", 1], [138, -128, "解药", -1], [138, 128, "安静", 1], [-138, 128, "新名词", -1]];

export function sections(w) {
  const { ctx } = w;
  // ── 开源项目页（S1 与 S5 共用） ──
  function projectPage(x, y, rot, s, t) {
    at(ctx, x, y, rot + sway(t), s, () => {
      paper(ctx, 880, 590);
      text(ctx, "某个开源项目", -400 + 10, -205, 66, C.ink, { align: "left", weight: 900 });
      rr(ctx, -390, -142, 340, 66, 6, null, C.green, 4);
      text(ctx, "开源 · 免费使用", -220, -108, 38, C.green);
      bars(ctx, -390, -30, [670, 500, 620, 420, 540]);
    });
  }

  // ── S1 开门见山 ──
  function s1(n, t) {
    const [s0, s1e] = SEC_N.s1, f = windowed(n, -1, s1e + 1.4, 1.2);
    if (f <= .002) return;
    group(ctx, f, () => {
      const slide = easeIn((n - (s1e - .6)) / 2);
      const tagAt = Z(1) - 2.2, tagP = easeIn((n - tagAt) / .7), hit = slam(n, tagAt + .7, 12);
      projectPage(660 - 900 * slide, 440 + hit, -.024, 1, t);
      if (n > tagAt) priceTag(ctx, mix(1040, 900, tagP) - 900 * slide, mix(120, 560, tagP) + hit, mix(1.5, 1, tagP), -.16, 0);
      // 报警器一开始不亮，价签拍下才亮；S2 前缩走
      const lit = ramp(n, tagAt + .7, .5) * beatFlash(n, .62), r = mix(122, 158, ramp(n, A(2), 3));
      const wave = ramp(n, A(2), 1.5);
      const ax = mix(1560, 1500, ramp(n, A(2), 3));
      // 价签到报警器的那根线
      if (n > A(2)) {
        const p = ramp(n, A(2), 2.2);
        ctx.save(); ctx.strokeStyle = "rgba(239,226,195,.75)"; ctx.lineWidth = 4; ctx.setLineDash([16, 12]);
        ctx.beginPath(); ctx.moveTo(1100, 560); ctx.quadraticCurveTo(mix(1100, 1300, p), 640, mix(1100, ax - r * .8, p), mix(560, 400, p)); ctx.stroke(); ctx.restore();
      }
      alarm(ctx, ax, 330, r, { lit, wave, pulse: n * .5 });
      // AI 铅字
      const ai = ramp(n, A(3), .7), big = mix(1.5, 1, ai);
      if (ai > 0) at(ctx, 1500, 640, -.03, big, () => group(ctx, ai, () => text(ctx, "AI", 0, 0, 170, C.cream, { weight: 900, shadow: "rgba(255,59,48,.8)", blur: 34 })));
    });
    if (n < A(2)) w.setNote("项目页面与价签均为虚构示意");
    else if (n < s1e) w.setMark("类比");
  }

  // ── S2 现状：两盏灯 ──
  function s2(n, t) {
    const [s0, s1e] = SEC_N.s2;
    if (n < s0 - 1 || n > s1e + 2) return;
    const yearOn = ramp(n, A(8), 1);
    const pageIn = easeOut((n - s0) / 1.4), pageOut = ramp(n, A(8), 1.2);
    if (pageOut < .999) group(ctx, clamp(pageIn * 1.4) * (1 - pageOut), () => {
      at(ctx, 960 + 1000 * (1 - pageIn), 440 - 40 * pageOut, sway(t, 1) - .006, 1, () => {
        paper(ctx, 1560, 620);
        const roll = (v, p) => (v * clamp(p)).toFixed(1) + "%";
        const lp = ramp(n, A(4) + 1, 5), rp = ramp(n, A(5) + 2, 4.5);
        const dimL = 1 - .35 * ramp(n, A(6) - 3, 2);
        alarm(ctx, -390, -130, 112, { lit: .75 * lp * beatFlash(n, .7) * dimL, wave: .5 * lp * dimL, pulse: n * .4 });
        alarm(ctx, 390, -130, 112, { lit: rp * beatFlash(n), wave: .9 * rp, pulse: n * .5 });
        text(ctx, "被 AI 抢走工作", -390, 44, 48, C.ink);
        text(ctx, roll(54.3, lp), -390, 170, 118, C.ink, { weight: 900 });
        group(ctx, ramp(n, A(5), .8), () => {
          text(ctx, "被更懂 AI 的人替代", 390, 44, 48, C.cinnabar);
          text(ctx, roll(62.0, rp), 390, 170, 118, C.cinnabar, { weight: 900 });
        });
        penRing(ctx, 390, 170, 215, 76, ramp(n, Z(5) - 3, 1.6));
      });
    });
    // 这句话，你可能也在课程广告里见过
    const adIn = easeIn((n - (A(6) + .4)) / .6), adOut = ramp(n, A(8), 1.2), hit = slam(n, A(6) + 1, 14);
    if (n > A(6) && adOut < .999) group(ctx, adIn * (1 - adOut), () => {
      at(ctx, 960 + hit, 430 + hit * .5, -.012 + sway(t, 2), mix(1.35, 1, adIn), () => {
        paper(ctx, 1240, 590);
        text(ctx, "再不学，", 0, -120, 132, C.ink, { weight: 900 });
        text(ctx, "就要被淘汰了", 0, 40, 132, C.cinnabar, { weight: 900 });
        bars(ctx, -380, 160, [760, 560], 36, 13);
      });
    });
    // 价签第二次贴上
    const tag2 = easeIn((n - (A(7) + .2)) / .6), hit2 = slam(n, A(7) + .8, 12);
    if (n > A(7)) group(ctx, 1 - adOut, () => {
      priceTag(ctx, mix(1760, 1440, tag2), mix(100, 590, tag2) + hit2, mix(1.6, 1.08, tag2), -.13, 0);
      alarm(ctx, 1640, 230, 84, { lit: beatFlash(n), wave: .9, pulse: n * .5 });
    });
    // 年份倒滚
    if (yearOn > 0 && n < s1e + 2) group(ctx, yearOn * (1 - ramp(n, s1e - .4, 1.4)), () => {
      const u = ease((n - A(8) - 1) / (Z(8) - A(8) - 2)), y = Math.round(mix(2026, 1920, u));
      text(ctx, String(y), 880, 420, 280, C.cream, { weight: 900, shadow: "rgba(255,59,48,.4)" });
      group(ctx, ramp(n, Z(8) - 3, 1), () => text(ctx, "年代", 1400, 470, 92, C.creamDim));
      alarm(ctx, 1700, 190, 64, { lit: beatFlash(n, .4), wave: .4, pulse: n * .4 });
    });
    if (n >= A(4) && n < A(6)) w.setNote("腾讯调研 × 复旦大学 · 两轮共 27,115 份 · 据媒体报道");
    else if (n >= A(6) && n < A(8)) { w.setNote("虚构示意"); }
  }

  // ── S3 历史对照：一个旧词 ──
  function s3(n, t) {
    const [s0, s1e] = SEC_N.s3;
    if (n < s0 - 1 || n > s1e + 1.6) return;
    const out = ramp(n, s1e - .4, 1.6);
    group(ctx, ramp(n, s0 - .2, .8) * (1 - out), () => {
      // 左边的旧版面：先是瓶子，后是广告
      const inP = easeOut((n - s0 + .2) / 1.2);
      at(ctx, mix(560, 960, ramp(n, A(11) - .4, 1.2) * (1 - ramp(n, A(13) - .6, 1.2))), 430 + 60 * (1 - inP), -.02 + sway(t, 3), mix(1.1, 1, inP), () => {
        paper(ctx, 800, 610);
        const adOn = ramp(n, A(11), 1);
        group(ctx, 1 - adOn, () => {
          bottle(ctx, 0, 30, 1.15);
          text(ctx, "一款美国漱口水", 0, -255, 44, C.ink);
        });
        group(ctx, adOn, () => {
          text(ctx, "He Never", -330, -205, 88, C.ink, { align: "left", weight: 900 });
          text(ctx, "Knew Why", -330, -115, 88, C.ink, { align: "left", weight: 900 });
          text(ctx, "他始终不知道为什么", -330, -30, 46, C.ink, { align: "left" });
          const mirror = ramp(n, A(12) + 1, 2);
          group(ctx, 1 - mirror, () => figure(ctx, 150, 140, 1.0));
          group(ctx, mirror, () => {
            ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.fillStyle = "#f6edd7";
            ctx.beginPath(); ctx.ellipse(120, 130, 104, 132, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            text(ctx, "你？", 120, 136, 92, C.cinnabar, { font: "hand", weight: 400 });
          });
          group(ctx, ramp(n, A(12) + 3.4, .6), () => alarm(ctx, 280, -10, 66, { lit: beatFlash(n), wave: .7, pulse: n * .5 }));
          bars(ctx, -330, 150, [300, 240], 44, 14);
        });
      });
      // 右边：旧词典 → 数字 → 三枚印章
      const bookOut = ramp(n, A(11) - .4, 1);
      group(ctx, ramp(n, A(9) + 1.4, 1) * (1 - bookOut), () => {
        at(ctx, 1400, 420, .012, 1, () => {
          paper(ctx, 720, 560);
          ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, -270); ctx.lineTo(0, 270); ctx.stroke();
          // 翻书：一页纸从右扫到左，反复几次后停在这一页
          const fl = (n - A(9) - 1.4) / 4;
          if (fl > 0 && fl < 1) { const u = (fl * 4) % 1, x = mix(340, -340, u); ctx.fillStyle = "#e6d7b4"; ctx.fillRect(Math.min(0, x), -262, Math.abs(x), 524); ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 2; ctx.strokeRect(Math.min(0, x), -262, Math.abs(x), 524); }
          const word = ramp(n, A(9) + 5.5, 1);
          group(ctx, word, () => {
            text(ctx, "halitosis", 0, -40, 118, C.cinnabar, { weight: 900, italic: true });
            penRing(ctx, 0, -40, 300, 92, ramp(n, A(9) + 8, 2));
          });
          const zh = ramp(n, A(10), 1);
          group(ctx, zh, () => {
            text(ctx, "口臭", -170, 130, 80, C.ink);
            text(ctx, "→", -40, 130, 72, C.inkSoft);
            stamp(ctx, 150, 136, "学名", ramp(n, A(10) + 3.5, .7), { size: 66 });
          });
        });
      });
      // 广告预算
      const moneyIn = ramp(n, A(13), .8), moneyOut = ramp(n, A(14), 1);
      group(ctx, moneyIn * (1 - moneyOut), () => {
        text(ctx, "广告预算 · 1922", 1120, 240, 44, C.creamDim, { align: "left" });
        text(ctx, "10 万美元", 1120, 340, 118, C.cream, { align: "left", weight: 900 });
        text(ctx, "广告预算 · 1928", 1120, 470, 44, C.creamDim, { align: "left" });
        const v = Math.round(mix(10, 500, easeOut((n - A(13) - 2) / 7)));
        text(ctx, `${v} 万美元`, 1120, 590, 136, "#ff7a68", { align: "left", weight: 900, shadow: "rgba(224,48,30,.55)" });
      });
      // 三枚印章
      if (n > A(14)) {
        stamp(ctx, 1190, 280, "命名", ramp(n, A(14) + 1.5, .6), { size: 80, color: C.redHi });
        stamp(ctx, 1500, 400, "吓人", ramp(n, A(14) + 4, .6), { size: 80, rot: .03, color: C.redHi });
        stamp(ctx, 1290, 570, "递解药", ramp(n, A(14) + 6.5, .6), { size: 80, rot: -.02, color: C.redHi });
      }
    });
    if (n >= s0 && n < A(13)) { w.setNote("Marchand 1985 · 图为示意"); if (n >= A(11)) w.setMark("图为示意"); }
    else if (n >= A(13) && n < A(14)) w.setNote("Marchand 1985 · 公司当年的广告预算 · 图为示意");
    else if (n >= A(14) && n < s1e) w.setMark("类比");
  }

  // ── S4 机制：报警器的账 ──
  function s4(n, t) {
    const [s0, s1e] = SEC_N.s4;
    if (n < s0 - 1 || n > s1e + 1.6) return;
    // 15 外壳被剖开，露出中央的大按钮
    const c15 = windowed(n, s0 - .4, Z(15) + .5, .9);
    group(ctx, c15, () => {
      const open = ease((n - A(15) - 2) / 3), cx = 960, cy = 420, r = 250;
      // 按钮
      const g = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, 130); g.addColorStop(0, "#ff8a7c"); g.addColorStop(1, C.cinnabar);
      ctx.fillStyle = "#191510"; ctx.beginPath(); ctx.arc(cx, cy, 170, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.metalLine; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2); ctx.fill();
      group(ctx, open, () => {
        text(ctx, "按钮", cx, cy, 72, "#fff3dc");
        ctx.strokeStyle = "rgba(239,226,195,.7)"; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; ctx.beginPath(); ctx.moveTo(cx + 180 * Math.cos(a), cy + 180 * Math.sin(a)); ctx.lineTo(cx + 250 * Math.cos(a), cy + 250 * Math.sin(a)); ctx.stroke(); }
      });
      // 外壳两半分开
      for (const side of [-1, 1]) at(ctx, cx + side * 340 * open, cy, 0, 1, () => {
        ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r + 8, side < 0 ? Math.PI / 2 : -Math.PI / 2, side < 0 ? Math.PI * 1.5 : Math.PI / 2); ctx.closePath(); ctx.clip();
        alarm(ctx, 0, 0, r, { lit: 1 - open * .7, wave: 0 });
        ctx.restore();
      });
    });
    // 16 厨房
    const c16 = windowed(n, A(16) - .3, Z(16) + .4, .8);
    group(ctx, c16, () => at(ctx, 960, 430, -.01 + sway(t, 5), 1, () => {
      paper(ctx, 1320, 600);
      // 面包机
      rr(ctx, -300, 34 - 40 * ramp(n, A(16) + 1.5, .8), 110, 70, 12, "#6b4116", C.ink, 5);
      rr(ctx, -130, 34 - 40 * ramp(n, A(16) + 1.5, .8), 110, 70, 12, "#6b4116", C.ink, 5);
      rr(ctx, -360, 50, 420, 180, 22, "#c4af82", C.ink, 7);
      rr(ctx, 60, 90, 34, 76, 8, "#8a7a52", C.ink, 5);
      // 一缕烟
      const sm = ramp(n, A(16) + 2, 1.2);
      ctx.save(); ctx.strokeStyle = `rgba(32,24,11,${.55 * sm})`; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const u = i / 12, x = -190 + 40 * Math.sin(u * 7 + t * 2.1) * u, y = -40 - 230 * u * sm; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      alarm(ctx, 380, -120, 118, { lit: ramp(n, A(16) + 3, .4) * beatFlash(n), wave: ramp(n, A(16) + 3, .4), pulse: n * .7 });
      text(ctx, "就这点烟？", 390, 170, 60, C.cinnabar, { font: "hand", weight: 400 });
    }));
    // 17 分栏
    const c17 = windowed(n, A(17) - .3, Z(17) + .4, .8);
    group(ctx, c17, () => at(ctx, 960, 430, sway(t, 6), 1, () => {
      paper(ctx, 1560, 610);
      ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-160, -270); ctx.lineTo(-160, 270); ctx.stroke();
      alarm(ctx, -470, -60, 78, { lit: beatFlash(n, .5), wave: .35, pulse: n * .4 });
      text(ctx, "误报", -470, 110, 66, C.ink);
      text(ctx, "烦一下", -470, 200, 44, C.inkSoft);
      const f = ramp(n, A(17) + 3.4, 1.4);
      group(ctx, f, () => {
        flame(ctx, 310, 150, 860 * mix(.5, 1, f), 340 * f, t);
        text(ctx, "漏报", 310, -170, 96, C.cinnabar, { weight: 900 });
        text(ctx, "一场大火", 310, 216, 66, "#fff3dc", { weight: 900 });
      });
    }));
    // 18 同一个道理
    const c18 = windowed(n, A(18) - .3, Z(18) + .4, .8);
    group(ctx, c18, () => at(ctx, 960, 430, sway(t, 7) - .008, 1, () => {
      paper(ctx, 1320, 600);
      text(ctx, "烟雾报警器原理", 0, -210, 80, C.ink, { weight: 900 });
      // 头部轮廓里放报警器
      ctx.fillStyle = "#c9b587"; ctx.strokeStyle = C.ink; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(-96, 262); ctx.bezierCurveTo(-120, 190, -170, 150, -170, 40); ctx.bezierCurveTo(-170, -80, -70, -135, 20, -135); ctx.bezierCurveTo(130, -135, 180, -50, 180, 26); ctx.bezierCurveTo(180, 56, 214, 86, 202, 104); ctx.lineTo(172, 112); ctx.lineTo(166, 180); ctx.bezierCurveTo(160, 210, 120, 208, 80, 206); ctx.lineTo(80, 262); ctx.closePath(); ctx.fill(); ctx.stroke();
      alarm(ctx, 16, 30, 96, { lit: beatFlash(n, .55), wave: .5 * ramp(n, A(18) + 1, 1), pulse: n * .4 });
      text(ctx, "焦虑", -440, 40, 96, C.cinnabar, { weight: 900 });
      text(ctx, "也一样", 450, 40, 72, C.ink);
    }));
    // 19 九十九次虚惊
    const c19 = windowed(n, A(19) - .3, Z(19) + .4, .8);
    group(ctx, c19, () => at(ctx, 960, 430, sway(t, 8), 1, () => {
      paper(ctx, 1560, 610);
      // 虚惊条：一整条连续光带
      const p = ease((n - A(19) - 1) / 7), x0 = -680, L = 1360, y = -60;
      rr(ctx, x0, y - 42, L, 84, 8, "#c4af82", C.ink, 5);
      ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y - 42, L * p, 84, 8); ctx.clip();
      const gr = ctx.createLinearGradient(x0, 0, x0 + L, 0); gr.addColorStop(0, "#ffb9a9"); gr.addColorStop(.98, "#f2a08f"); gr.addColorStop(.985, C.cinnabar); gr.addColorStop(1, C.cinnabar);
      ctx.fillStyle = gr; ctx.fillRect(x0, y - 42, L, 84); ctx.restore();
      text(ctx, "100 次警报", x0, -180, 62, C.ink, { align: "left" });
      group(ctx, ramp(n, A(19) + 4, 1), () => text(ctx, "99% 是虚惊", -60, 90, 112, C.cinnabar, { weight: 900 }));
      group(ctx, ramp(n, A(19) + 6, 1), () => text(ctx, "这个报警器，没坏", 0, 204, 66, C.ink));
      group(ctx, ramp(n, A(19) + 5, 1), () => text(ctx, "1 次是真的", 560, -180, 50, C.cinnabar));
    }));
    // 20 天平
    const c20 = windowed(n, A(20) - .3, Z(20) + .4, .8);
    group(ctx, c20, () => at(ctx, 960, 430, sway(t, 9), 1, () => {
      paper(ctx, 1320, 610);
      const tilt = .26 * ease((n - A(20) - 2) / 3) + .012 * Math.sin(t * 1.6);
      balance(ctx, 0, -170, 780, tilt, "得到", "失去");
      group(ctx, ramp(n, Z(20) - 3.4, .8), () => text(ctx, "约 2 倍", -390, 170, 92, C.cinnabar, { weight: 900 }));
    }));
    // 21 拼图
    const c21 = windowed(n, A(21) - .3, Z(22) + .4, .8);
    group(ctx, c21, () => {
      const flip = ease((n - A(22) - .2) / 1.2), sx = Math.abs(Math.cos(flip * Math.PI));
      at(ctx, 960, 430, sway(t, 10), 1, () => {
        ctx.save(); ctx.scale(Math.max(.02, sx), 1);
        if (flip < .5) {
          const join = ease((n - A(21) - 4) / 3), glowOn = ramp(n, A(21) + 7, 1.4);
          paper(ctx, 1320, 560);
          glow(ctx, 0, 0, 660, 300, "rgba(255,180,60,A)", .55 * glowOn);
          puzzle(ctx, -240 - 120 * (1 - join), 0, 480, 280, -1, "#c4af82", "吓人");
          group(ctx, ramp(n, A(21) + 3, .8), () => puzzle(ctx, 240 + 120 * (1 - join), 0, 480, 280, 1, "#e0a53e", "你能做到"));
        } else {
          paper(ctx, 1320, 560);
          text(ctx, "跟着我学，", 0, -70, 120, C.ink, { weight: 900 });
          text(ctx, "你也可以", 0, 70, 120, C.cinnabar, { weight: 900 });
        }
        ctx.restore();
      });
    });
    if (n >= A(16) && n < Z(16)) w.setMark("类比");
    if (n >= A(18) && n < Z(18)) w.setNote("Nesse · The Smoke Detector Principle · 2001 / 2019");
    if (n >= A(19) && n < Z(19)) w.setNote("Nesse 的算例：逃跑 100 卡、遇狮 1 万卡，1% 的可能就值得跑 · 不是观测数据");
    if (n >= A(20) && n < Z(20)) w.setNote("Brown 等 2024 · 系数均值 1.955 · 是平均值，不是每个人");
    if (n >= A(21) && n < Z(21)) w.setNote("Tannenbaum 等 2015 · d = 0.43 对 0.21 · 研究多为健康与安全信息");
    if (n >= A(22) && n < Z(22)) w.setNote("虚构示意");
  }

  // ── 发动机：S5 点火，一直转到结尾。k 整体缩放，dim 背景暗度，body 机身显现程度 ──
  function engine(n, t, cx, cy, k, a, body, gearA = () => 1) {
    const ang = integ(speed, n);
    group(ctx, a, () => at(ctx, cx, cy, 0, k, () => {
      group(ctx, body, () => {
        // 飞轮与皮带
        ctx.strokeStyle = C.metalLine; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-590, -160); ctx.lineTo(-138, -258); ctx.moveTo(-590, 240); ctx.lineTo(-138, 258); ctx.stroke();
        gear(ctx, -590, 40, 200, 16, ang * .55, { fill: "#241e15" });
        // 机身
        rr(ctx, -340, -310, 680, 620, 18, "#1f1a12", C.metalLine, 6);
        // 活塞组：两根连杆随转角上下
        for (const [i, x] of [[0, 480], [1, 640]]) {
          const y = 40 * Math.sin(ang * 2 + i * Math.PI);
          rr(ctx, x - 60, -300, 120, 600, 8, "#1f1a12", C.metalLine, 5);
          rr(ctx, x - 46, -130 + y, 92, 120, 6, "#3a3122", C.metalLine, 4);
          ctx.strokeStyle = C.metalLine; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x, -10 + y); ctx.lineTo(x + 20 * Math.cos(ang * 2 + i * Math.PI), 190); ctx.stroke();
        }
        ctx.strokeStyle = C.metalLine; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(340, 0); ctx.lineTo(420, 0); ctx.stroke();
        // 排气管与飘出来的价签（大、少）
        rr(ctx, 230, -430, 80, 124, 4, "#1f1a12", C.metalLine, 5);
        for (let i = 0; i < 3; i++) {
          const u = (i / 3 + ang * .05) % 1;
          group(ctx, bump(u) * .9, () => priceTag(ctx, 270 + 200 * u, -440 - 60 * u, .34 + .1 * u, -.2 + u * .5, 0));
        }
        // 点火灯：报警器
        alarm(ctx, -40, -392, 76, { lit: beatFlash(n), wave: .8, pulse: n * .6 });
      });
      GEARS.forEach(([x, y, label, d], i) => group(ctx, gearA(i), () => gear(ctx, x, y, 142, 14, d * ang + (d < 0 ? Math.PI / 14 : 0), { label, size: 46 })));
      // 中央的红色传动轴
      glow(ctx, 0, 0, 240, 240, "rgba(255,59,48,A)", .25 + .18 * Math.exp(-((n % 1) * 3)));
    }));
  }

  // ── S5 转折：发动机 ──
  function s5(n, t) {
    const [s0, s1e] = SEC_N.s5;
    if (n < s0 - 1 || n > s1e + 1.6) return;
    // 23–25 工程图版面：报警器、解药、新名词
    const c = windowed(n, s0 - .4, Z(25) + .5, .9), hit = slam(n, A(25) + .8, 14);
    group(ctx, c, () => at(ctx, 960, 430 + hit, sway(t, 11), 1, () => {
      paper(ctx, 1500, 600);
      // 瓶子递上来
      const up = easeOut((n - A(23) - 1.5) / 3);
      group(ctx, ramp(n, A(23) + 1, 1), () => bottle(ctx, -420, mix(360, 44, up), .9));
      // 红灯：解药到位后熄灭，新名词砸下又亮
      const off = ramp(n, A(23) + 4.5, 2), relit = ramp(n, A(25) + .8, .3);
      const lit = Math.max(1 - off, relit) * beatFlash(n, .7);
      alarm(ctx, 100, -40, 170, { lit, wave: Math.max(1 - off, relit), pulse: n * .6 });
      const word = easeIn((n - A(25)) / .8);
      if (word > 0) at(ctx, 100, mix(-420, 220, word) , -.02, mix(1.3, 1, word), () => { rr(ctx, -310, -56, 620, 112, 8, C.ink); text(ctx, "下一个新名词", 0, 2, 76, "#fff3dc"); });
    }));
    // 26–33 发动机
    const eng = ramp(n, A(26) - .4, 1), low = ramp(n, A(28), 1.2) * (1 - ramp(n, A(31), 1)) + ramp(n, A(32), 1);
    const k = mix(1.15, .72, ease((n - A(27)) / 2.2));
    const body = ramp(n, A(27) + .4, 1.6);
    if (eng > 0) {
      const bgDim = mix(1, .24, clamp(low));
      // 四个词按顺序出现：用一层遮罩盖住还没念到的齿轮
      const d = (Z(26) - A(26) - 3) / 4;
      engine(n, t, mix(960, 1010, body), mix(430, 470, body), k, eng * bgDim, body, (i) => ramp(n, A(26) + .3 + i * d, .6));
    }
    // 28–30 解药翻面
    const c2 = windowed(n, A(28) - .3, Z(30) + .4, .8);
    group(ctx, c2, () => {
      projectPage(1230, 430, .012, .92, t);
      const flip = ease((n - A(28) - 4.5) / 1.1) * (1 - ease((n - A(30) - .4) / .9));
      const toPage = ease((n - A(30) - .4) / 1.1);
      priceTag(ctx, mix(500, 1030, toPage), mix(430, 345, toPage), mix(1.45, .7, toPage), -.1, flip);
      // 把人教会：绿章，和价签并排
      const go = 1 - ramp(n, A(30), .6);
      group(ctx, go, () => stamp(ctx, 500, 640, "把人教会", ramp(n, A(29) + 3, .6), { size: 62, color: "#7fe0ac" }));
      // 朱笔狠狠划一道
      penLine(ctx, 820, 250, 1250, 450, ramp(n, A(30) + 2.6, .8), C.red, 18);
      stamp(ctx, 410, 430, "靠吓人收钱", ramp(n, A(30) + 3.2, .6), { size: 66, color: C.redHi });
    });
    // 31 转速表
    const c31 = windowed(n, A(31) - .2, Z(31) + .4, .7);
    group(ctx, c31, () => {
      const cx = 1690, cy = 400, R = 160;
      ctx.fillStyle = "#efe2c3"; ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineCap = "round"; ctx.strokeStyle = C.cinnabar; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, R - 34, Math.PI * 1.62, Math.PI * 1.98); ctx.stroke();
      const needle = Math.PI * (1.74 + .02 * Math.sin(t * 6));
      ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + (R - 40) * Math.cos(needle), cy + (R - 40) * Math.sin(needle)); ctx.stroke();
      text(ctx, "警报还在响", cx, cy + 60, 46, C.cream);
    });
    // 32–33 调查：两行两列
    const c32 = windowed(n, A(32) - .3, Z(33) + .5, .8);
    group(ctx, c32, () => at(ctx, 960, 430, sway(t, 12), 1, () => {
      paper(ctx, 1320, 600);
      text(ctx, "入门", -180, -228, 60, C.ink); text(ctx, "熟练", 280, -228, 60, C.ink);
      text(ctx, "焦虑", -480, -74, 66, C.cinnabar);
      alarm(ctx, -180, -74, 68, { lit: .45, wave: 0 });
      alarm(ctx, 280, -74, 88, { lit: ramp(n, A(32) + 1, 1) * beatFlash(n), wave: ramp(n, A(32) + 1, 1) * .8, pulse: n * .5 });
      const on = ramp(n, A(33), .8), burst = ramp(n, A(33) + 1, 2);
      group(ctx, on, () => {
        text(ctx, "信心", -480, 148, 66, "#8a5d10");
        glow(ctx, -180, 148, 110, 110, "rgba(255,190,70,A)", .4);
        ctx.fillStyle = "#b98a2a"; ctx.beginPath(); ctx.arc(-180, 148, 30, 0, Math.PI * 2); ctx.fill();
        glow(ctx, 280, 148, 90 + 170 * burst, 90 + 170 * burst, "rgba(255,190,70,A)", .85);
        ctx.fillStyle = "#ffb52e"; ctx.strokeStyle = "#8a5d10"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(280, 148, mix(30, 72, burst), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
    }));
    if (n >= A(27) && n < A(28)) w.setMark("类比");
    if (n >= A(29) && n < Z(29)) w.setNote("Open Source Definition · 具体要看各项目的许可证");
    if (n >= A(32) && n < Z(33)) w.setNote("同一项调查 · 相关关系，不代表学了才焦虑 · 据媒体报道");
  }

  // ── S6 落点与结尾 ──
  const LINES = ["再不学就晚了", "最后 3 天", "下一个被淘汰的", "别再犹豫了", "你还在等什么", "错过这一次"];
  function s6(n, t) {
    const [s0] = SEC_N.s6;
    if (n < s0 - 1) return;
    // 发动机在背后全速转
    const engA = ramp(n, s0 - .6, 1) * (1 - ramp(n, Q_N[0] - 2, 1.8));
    if (engA > 0 && n < Q_N[0]) engine(n, t, 1010, 470, .72, engA * mix(.24, .4, ramp(n, A(38), 1)), 1);
    // 三个问题
    const c = windowed(n, s0 - .4, Z(37) + .6, .9);
    group(ctx, c, () => at(ctx, 960, 430, sway(t, 13), 1, () => {
      paper(ctx, 1600, 560);
      const items = [["来源", A(35)], ["教会，还是吓人", A(36)], ["承诺收益", A(37)]], xs = [-510, 0, 510];
      items.forEach(([s, at0], i) => {
        ctx.strokeStyle = C.inkSoft; ctx.lineWidth = 5; ctx.strokeRect(xs[i] - 230, -160, 460, 320);
        text(ctx, ["一", "二", "三"][i], xs[i], -100, 66, C.inkSoft);
        stamp(ctx, xs[i], 40, s, ramp(n, at0 + .3, .6), { size: s.length > 4 ? 48 : 66 });
      });
    }));
    // 广告版面迎面飞来
    const flyOn = ramp(n, A(38) - .6, .8) * (1 - ramp(n, Q_N[0] - .4, 1.2));
    if (flyOn > 0) {
      const z = flyZ(n), N = LINES.length, pages = [];
      for (let i = 0; i < N * 2; i++) { const d = (i / (N * 2) + z) % 1; pages.push([d, i]); }
      pages.sort((p, q) => p[0] - q[0]);
      group(ctx, flyOn, () => {
        for (const [d, i] of pages) {
          const s = .12 + 3.1 * d * d * d, ang = i * 2.399, R = 760 * d * d;
          const x = 960 + R * Math.cos(ang), y = 430 + R * .62 * Math.sin(ang);
          group(ctx, ramp(d, 0, .08) * (1 - ramp(d, .9, .1)), () => at(ctx, x, y, (hash(i) - .5) * .3, s, () => {
            paper(ctx, 760, 400);
            text(ctx, LINES[i % N], 0, 0, 84, i % 2 ? C.cinnabar : C.ink, { weight: 900 });
          }));
        }
      });
    }
    // 字幕带压暗
    if (flyOn > 0) { w.screen(); const bandG = ctx.createLinearGradient(0, 720, 0, 860); bandG.addColorStop(0, "rgba(10,8,4,0)"); bandG.addColorStop(1, `rgba(10,8,4,${.94 * flyOn})`); ctx.fillStyle = bandG; ctx.fillRect(0, 720, 1920, 360); w.useCam(); }
    // 中央大按钮被按下
    const btnOn = ramp(n, A(38) + .5, 1) * (1 - ramp(n, CARD_N[0], 1));
    group(ctx, btnOn, () => {
      const press = ease((n - (Z(38) - 3)) / .5), cx = 960, cy = 420;
      glow(ctx, cx, cy, 460, 460, "rgba(255,59,48,A)", .7 * Math.max(.5, press));
      ctx.fillStyle = "#191510"; ctx.strokeStyle = C.metalLine; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, 180, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const g = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy, 130); g.addColorStop(0, "#ff8a7c"); g.addColorStop(1, C.cinnabar);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy + 14 * press, mix(136, 118, press), 0, Math.PI * 2); ctx.fill();
    });
    // 声明 ＋ 引用（叠在飞掠的版面上）
    const card = windowed(n, CARD_N[0] - .2, CARD_N[1] - .1, .7);
    group(ctx, card, () => {
      rr(ctx, 170, 150, 1580, 610, 10, "rgba(14,11,7,.93)", "#8a6f3e", 3);
      const L = [["报警器、发动机是类比；广告版面、项目页、价签均为示意。", 38, C.cream], ["调查据媒体报道，为相关关系；恐惧诉求研究多为健康与安全信息。", 38, C.cream], ["本片不构成心理或消费建议。持续的焦虑困扰，请寻求专业帮助。", 38, "#ffb9a0"]];
      L.forEach(([s, size, col], i) => text(ctx, s, 960, 220 + i * 66, size, col, { font: "sans", weight: 600 }));
      const R = ["Marchand 1985 · Nesse 2019 · Brown 等 2024 · Tannenbaum 等 2015", "腾讯调研 × 复旦大学 2026 · 中国消费者协会 2026", "Open Source Definition · 本片由代码生成，无实拍素材"];
      R.forEach((s, i) => text(ctx, s, 960, 500 + i * 62, 34, C.creamDim, { font: "sans", weight: 500 }));
    });
    // 冲进红灯
    if (n > Q_N[0] - 2.4) {
      const u = easeIn((n - (Q_N[0] - 2.4)) / 2.4), r = mix(30, 1500, u);
      ctx.fillStyle = C.cinnabar; ctx.beginPath(); ctx.arc(960, 430, r, 0, Math.PI * 2); ctx.fill();
      glow(ctx, 960, 430, r * 1.25, r * 1.25, "rgba(255,59,48,A)", .8);
      if (n > Q_N[0] - .4) {
        // 红底上一圈圈往外走的声波，越来越快
        const m = n - Q_N[0], z = .35 * m + .05 * m * m;
        for (let i = 0; i < 5; i++) {
          const v = (i / 5 + z) % 1, R = 80 + v * v * 1300;
          ctx.strokeStyle = `rgba(255,190,170,${.55 * (1 - v)})`; ctx.lineWidth = 8 + 34 * v; ctx.beginPath(); ctx.arc(960, 430, R, 0, Math.PI * 2); ctx.stroke();
        }
        const qIn = ramp(n, Q_N[0] - .1, .9), big = mix(1.2, 1, qIn) + .012 * (n - Q_N[0]);
        at(ctx, 960, 470, 0, big, () => group(ctx, qIn, () => {
          text(ctx, "上一次吓到你的那句话，", 0, -62, 92, "#fff8e8", { weight: 900, shadow: "rgba(60,0,0,.8)" });
          text(ctx, "是谁写的？", 0, 72, 112, "#fff8e8", { weight: 900, shadow: "rgba(60,0,0,.8)" });
        }));
      }
    }
    // 末 0.7 拍白闪硬切
    const fl = ramp(n, END_N - .7, .5);
    if (fl > 0) { w.screen(); ctx.fillStyle = `rgba(255,250,240,${fl})`; ctx.fillRect(0, 0, 1920, 1080); w.useCam(); }
    if (n >= A(37) && n < Z(37)) w.setNote("中消协 2026 · 培训领域常见问题包括夸大收益承诺");
    if (n >= A(38) && n < CARD_N[0]) w.setNote("飞过的广告语均为虚构示意");
  }

  const wrap = (fn) => ({ state: (t) => fn(w.n, w.t) });
  return [wrap(s1), wrap(s2), wrap(s3), wrap(s4), wrap(s5), wrap(s6)];
}
