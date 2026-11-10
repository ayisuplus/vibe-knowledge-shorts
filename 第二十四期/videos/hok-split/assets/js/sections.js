// 六段 build/state，合一个文件（第五代范式）。时间一律用秒，由 beats.js 的拍号换算；所有状态由 t 纯函数算出。
// 分镜：../../03-分镜脚本/分镜脚本.md；字幕句号 #i 对应 CUE[i]。
import { B, CUE, SEC_N, CARD_N, DUR } from "./beats.js";
import { clamp, ease, easeOut, easeIn, mix, ramp, hash, bump } from "./lib.js";
import { C, IMG, APPLE, rr, mtext, ctext, pop, squash, coin, gate, pipe, sticker, hero, skinCard, bubble, ledger, wall, brick, phone, paperCard, stamp, speedLines, burst, vault, book, cross } from "./rig.js";

const Q = (i) => [B(CUE[i][0]), B(CUE[i][1])];
const S = (k) => B(SEC_N[k][0]);
const k01 = (t, a, d = 0.3) => clamp((t - a) / d);
const W = { s1: [0, S("s2")], s2: [S("s2"), S("s3")], s3: [S("s3"), S("s4")], s4: [S("s4"), S("s5")], s5: [S("s5"), S("s6")], s6: [S("s6"), B(CARD_N[0])], card: [B(CARD_N[0]), DUR + 1] };
const inW = (t, k) => t >= W[k][0] && t < W[k][1];
/** 滚动的硬币：沿 x 从 a 到 b，转角按滚过的距离算 */
const rollRot = (x, r) => x / r;

export function sections(w) {
  const ctx = w.ctx;
  // 4 下抖动：墙落地、苹果咬一口、砸墙、结尾全图亮灯（分镜「抖动只给 4 下」）
  const HIT = { wall: B(20), bite: B(105), smash: B(128), lights: Q(29)[0] };
  w.hits = [[HIT.wall, 16], [HIT.bite, 12], [HIT.smash, 18], [HIT.lights, 12]];

  // ================= 底色 =================
  const bg = { state(t) {
    if (inW(t, "s5")) w.bg({ top: "#1a2c52", bot: "#0a1228", rayA: 0 });
    else if (inW(t, "card")) w.bg({ top: "#0d1530", bot: "#05070f", rayA: 0 });
    else if (inW(t, "s4") && t > Q(21)[0]) w.bg({ top: "#141d3d", bot: "#05070f", rayA: 0.02 });
    else w.bg({});
    w.paintBg(t);
  } };

  // ================= S1 冷开场：皮肤蒸发 =================
  const L_SKINS = [112, 109, 131, 167, 144], R_SKINS = [166, 169, 152, 106, 113];
  function fan(px, py, ids, t, t0, o) {
    o = o || {};
    ids.forEach((id, i) => {
      const a = (i - 2) * 0.22, x = px + (i - 2) * 92, y = py - 300 + Math.abs(i - 2) * 26;
      const p = pop(k01(t, t0 + i * 0.25, 0.35));
      if (o.fly) {   // 撞线、碎掉、往下掉
        const f = o.fly(i); if (f.gone) return;
        skinCard(ctx, id, f.x, f.y, 118, { rot: f.rot, alpha: f.a, scale: f.s });
      } else skinCard(ctx, id, x, y + 6 * Math.sin(t * 2 + i), 118, { rot: a, scale: p });
    });
  }
  const s1 = { state(t) {
    if (!inW(t, "s1")) return;
    const [a1] = Q(1), [a2] = Q(2), [a3] = Q(3);
    // 结尾冲向墙（转场进 S2）
    const rush = easeIn(k01(t, B(25) - 0.1, 0.6));
    w.cam(960, 540, 1 + 3.5 * rush);
    // 王者荣耀 logo：砸进来、弹两下，再缩到顶上
    if (IMG.logo) {
      const p = k01(t, 0.4, 0.3), up = ease(k01(t, a1 + 0.7, 0.5));
      const s = (p < 1 ? mix(3.2, 1, easeOut(p)) : 1 + squash(k01(t, 0.7, 0.5))) * mix(1, 0.5, up) * clamp(p * 4);
      const lw = 760 * s, lh = lw * (IMG.logo.height / IMG.logo.width);
      ctx.save(); ctx.globalAlpha = clamp(p * 3) * (1 - k01(t, a3 - 0.2, 0.3)); ctx.drawImage(IMG.logo, 960 - lw / 2, mix(400, 200, up) - lh / 2, lw, lh); ctx.restore();
    }
    // 两部手机
    const inL = easeOut(k01(t, a1 + 0.2, 0.45)), inR = easeOut(k01(t, a1 + 0.35, 0.45));
    const outR = easeIn(k01(t, a2, 0.45));
    const cross = ease(k01(t, a2 + 0.3, 1.0));               // 左手机穿过中线
    const lx = mix(-300, 560, inL) + 800 * cross, flip = Math.abs(Math.cos(clamp((lx - 900) / 120) * Math.PI));
    const lkind = lx > 960 ? "apple" : "android";
    const lineH = ease(k01(t, a1 + 2.3, 0.4)) * (1 - k01(t, a3, 0.2));
    // 中线（之后长成墙）
    if (lineH > 0) { ctx.fillStyle = "#fff"; ctx.fillRect(956, 270, 8, 750 * lineH); }
    const rise = ease(k01(t, a3, B(20) - a3));
    if (t >= a3) wall(ctx, 900, 1020, 120, 1080, { rise });
    // 右手机及它的皮肤：换机时滑出画外
    const rx = mix(2300, 1360, inR) + 900 * outR;
    if (outR < 1) { phone(ctx, rx, 560, 420, "apple", { rot: 0.04 * Math.sin(t * 1.7) }); fan(rx, 560, R_SKINS, t, a1 + 0.9); }
    // 左手机的皮肤：跟着手机走到中线，撞线碎掉
    const hitT = a2 + 0.3 + 0.55;
    fan(Math.min(lx, 860), 560, L_SKINS, t, a1 + 0.7, t < hitT ? null : { fly: (i) => {
      const d = t - hitT - i * 0.06, x0 = Math.min(lx, 930) + (i - 2) * 70, y0 = 280 + Math.abs(i - 2) * 26;
      if (d < 0) return { x: 860 + (i - 2) * 40, y: y0, rot: 0, a: 1, s: 1 };
      return { x: 860 - d * 260 * (0.6 + hash(i)), y: y0 + d * 120 + 900 * d * d, rot: d * (3 + i), a: 1 - clamp(d / 1.6), s: 1 - 0.3 * clamp(d), gone: d > 1.6 };
    } });
    for (let i = 0; i < 5 && t >= hitT; i++) burst(ctx, 940, 260 + i * 30, 90, k01(t, hitT + i * 0.05, 0.4));
    phone(ctx, lx, 560, 420, lkind, { rot: -0.04 * Math.sin(t * 1.5), scale: 1 }); // 翻面：scaleX 近 0 时换身份
    if (flip < 0.999 && cross > 0 && cross < 1) { /* 翻面过程中画一道白光 */ ctx.save(); ctx.globalAlpha = (1 - flip) * 0.6; ctx.fillStyle = "#fff"; ctx.fillRect(lx - 110, 350, 220, 420); ctx.restore(); }
    // 鲁班七号大哭
    const lb = pop(k01(t, a2 + 1.5, 0.4)) * (1 - k01(t, a3 - 0.1, 0.25));
    if (lb > 0) { sticker(ctx, 112, 250, 300, 96, { rot: -0.15 + 0.05 * Math.sin(t * 9), scale: lb }); mtext(ctx, "呜呜呜", 250, 470, 54, { rot: -0.08, scale: lb }); }
    // 墙落地：标签与问号
    const hit = k01(t, HIT.wall, 0.3);
    if (t >= HIT.wall) {
      burst(ctx, 960, 1040, 260, k01(t, HIT.wall, 0.45));
      mtext(ctx, "安卓区", 470, 300, 96, { scale: pop(k01(t, HIT.wall, 0.3)), rot: -0.05 });
      mtext(ctx, "苹果区", 1450, 300, 96, { scale: pop(k01(t, HIT.wall + 0.25, 0.3)), rot: 0.05 });
      mtext(ctx, "？", 960, 260 + 10 * Math.sin(t * 8), 150, { fill: C.yel, scale: pop(k01(t, HIT.wall + 0.5, 0.3)) });
    }
    void hit;
  } };

  // ================= S2 历史锚点：墙上的门 =================
  const FAQ_A1 = "A：根据苹果公司的规定，iOS 和 Android 版本之间", FAQ_A2 = "是独立计算不互通的。";
  const CLAUSE = ["3.1.3(b) Multiplatform Services:", "Apps that operate across multiple platforms", "may allow users to access content,", "subscriptions, or features they have acquired", "in your app on other platforms or your web site,", "including consumable items in multi-platform", "games, provided those items are also available", "as in-app purchases within the app."];
  function typed(s, t, t0, t1) { const n = Math.floor(s.length * clamp((t - t0) / (t1 - t0))); return s.slice(0, n); }
  /** S2 侧视墙：上窗、中门、下门三个洞，各自开合 */
  function sideWall(t, open) {
    const holes = [];
    wall(ctx, 900, 1020, 130, 760, {});
    ctx.save(); ctx.fillStyle = "#0b1230";
    if (open.win > 0) { const h = 130 * ease(open.win); ctx.fillRect(898, 245 - h / 2, 124, h); holes.push(1); }
    if (open.mid > 0) { const h = 150 * ease(open.mid); ctx.fillRect(898, 430 - h / 2, 124, h); }
    if (open.door > 0) { const h = 190 * ease(open.door); ctx.fillRect(898, 760 - h, 124, h); }
    ctx.restore();
    // 门框
    ctx.strokeStyle = C.yel; ctx.lineWidth = 8;
    if (open.win > 0) ctx.strokeRect(898, 245 - 65 * ease(open.win), 124, 130 * ease(open.win));
    if (open.mid > 0) ctx.strokeRect(898, 430 - 75 * ease(open.mid), 124, 150 * ease(open.mid));
    if (open.door > 0) ctx.strokeRect(898, 760 - 190 * ease(open.door), 124, 190 * ease(open.door));
  }
  function truck(x, y, s, o = {}) {
    const { box = 1, label = "账号", side = "" } = o;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rr(ctx, -190, -150, 260, 150, 14, "#fff", C.ink, 7);                  // 车厢
    rr(ctx, 70, -110, 110, 110, 14, C.blue, C.ink, 7);                    // 车头
    rr(ctx, 96, -92, 60, 44, 8, "#bfe3ff", C.ink, 4);
    for (const wx of [-120, 120]) { ctx.beginPath(); ctx.arc(wx, 6, 30, 0, 7); ctx.fillStyle = "#222"; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.beginPath(); ctx.arc(wx, 6, 10, 0, 7); ctx.fillStyle = "#aaa"; ctx.fill(); }
    if (side) ctext(ctx, side, -60, -64, 34, { align: "center", weight: 900 });
    if (box > 0) { const by = -150 - 70 * box; rr(ctx, -150, by, 170, 80, 10, "#e8b86a", C.ink, 6); ctext(ctx, label, -65, by + 54, 38, { align: "center", weight: 900 }); }
    ctx.restore();
  }
  function pill(x, y, s, fill, o = {}) {
    const { rot = 0, scale = 1, alpha = 1, size = 40 } = o; if (scale <= 0.001 || alpha <= 0.002) return;
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
    ctx.font = `900 ${size}px NotoSC`; const tw = ctx.measureText(s).width + size * 1.1;
    rr(ctx, -tw / 2 + 5, -size * 0.8 + 7, tw, size * 1.6, size * 0.4, "rgba(0,0,0,.5)");
    rr(ctx, -tw / 2, -size * 0.8, tw, size * 1.6, size * 0.4, fill, C.ink, 6);
    ctext(ctx, s, 0, size * 0.36, size, { align: "center", weight: 900 }); ctx.restore();
  }
  const s2 = { state(t) {
    if (!inW(t, "s2")) return;
    const [a4] = Q(4), [a5] = Q(5), [a6] = Q(6), [a7] = Q(7), [a8] = Q(8), [a9] = Q(9), [a10, b10] = Q(10);
    if (t < a7) {
      // ---- 官方问答卡 → 规则书 ----
      w.cam(960, 520, 1 + 0.02 * Math.sin(t * 0.8));
      const flip = ease(k01(t, a4, 0.35)), out = easeIn(k01(t, a5, 0.3));
      if (out < 1) {
        w.tag("图为示意");
        ctx.save(); ctx.translate(960, 450 + 700 * out); ctx.scale(Math.max(0.01, flip), 1); ctx.translate(-960, -450);
        paperCard(ctx, 960, 450, 1560, 560, { head: "王者荣耀 FAQ · 2015", rot: -0.01 });
        stamp(ctx, "官方问答", 1560, 250, 50, { scale: pop(k01(t, a4 + 0.5, 0.3)) });
        ctext(ctx, typed("Q：iOS 和 Android 的数据互通吗？", t, a4 + 0.6, a4 + 1.4), 230, 340, 50, { weight: 900, fill: "#1d2a4d" });
        const l1 = typed(FAQ_A1, t, a4 + 1.6, a4 + 4.0), l2 = typed(FAQ_A2, t, a4 + 4.0, a4 + 4.8);
        ctext(ctx, l1, 230, 450, 50, { weight: 700 }); ctext(ctx, l2, 230, 530, 50, { weight: 700 });
        // 红笔圈住「苹果公司的规定」
        const pc = k01(t, a4 + 5.0, 0.6);
        if (pc > 0) {
          ctx.font = "700 50px NotoSC"; const x0 = 230 + ctx.measureText("A：根据").width, x1 = x0 + ctx.measureText("苹果公司的规定").width;
          ctx.save(); ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath();
          ctx.ellipse((x0 + x1) / 2, 433, (x1 - x0) / 2 + 30, 48, -0.03, -Math.PI * 0.9, -Math.PI * 0.9 + Math.PI * 2.1 * pc); ctx.stroke(); ctx.restore();
        }
        ctx.restore();
        sticker(ctx, 109, 1640, 690, 74, { rot: 0.12, scale: pop(k01(t, a4 + 2, 0.4)) * (1 - out) });
        mtext(ctx, "？", 1730, 610, 80, { fill: C.yel, scale: pop(k01(t, a4 + 2.3, 0.3)) * (1 - out) });
      }
      // 规则书：从天而降，翻页，停在 3.1.3(b)
      if (t >= a5) {
        const drop = easeIn(k01(t, a5, 0.28)), land = squash(k01(t, a5 + 0.28, 0.5));
        const opn = ease(k01(t, a5 + 0.8, 0.4));
        ctx.save(); ctx.translate(960, mix(-600, 450, drop)); ctx.scale(1 + land, 1 - land);
        const bw = 1500, bh = 640;
        if (opn < 1) {   // 封面
          ctx.save(); ctx.scale(1 - opn * 0.5, 1); ctx.translate(-bw / 4 * opn, 0);
          rr(ctx, -bw / 4 + 10, -bh / 2 + 14, bw / 2, bh, 18, "rgba(0,0,0,.5)");
          rr(ctx, -bw / 4, -bh / 2, bw / 2, bh, 18, "#1d2a4d", C.ink, 8);
          ctx.save(); const lk = 0.16; ctx.translate(-814 * lk / 2, -230); ctx.scale(lk, lk); ctx.fillStyle = "#fff"; ctx.fill(APPLE); ctx.restore();
          ctext(ctx, "App Store", 0, 60, 64, { align: "center", fill: "#fff", weight: 900 });
          ctext(ctx, "审核指南", 0, 150, 64, { align: "center", fill: "#fff", weight: 900 });
          ctx.restore();
        } else {
          rr(ctx, -bw / 2 + 12, -bh / 2 + 16, bw, bh, 18, "rgba(0,0,0,.5)");
          rr(ctx, -bw / 2, -bh / 2, bw, bh, 18, "#fbf7ea", C.ink, 8);
          ctx.fillStyle = C.ink; ctx.fillRect(-4, -bh / 2, 8, bh);
          // 翻页：几张纸从右往左翻过去
          for (let i = 0; i < 6; i++) {
            const p = k01(t, a5 + 1.25 + i * 0.22, 0.24); if (p <= 0 || p >= 1) continue;
            const sx = Math.cos(p * Math.PI);
            ctx.save(); ctx.scale(sx, 1); rr(ctx, 0, -bh / 2 + 6, bw / 2 - 10, bh - 12, 10, "#fff", C.ink, 4); ctx.restore();
          }
          const settle = k01(t, a5 + 2.6, 0.3);
          ctext(ctx, "3.1.3(b)", -bw / 4, -40, 120, { align: "center", weight: 900, alpha: settle, fill: "#1d2a4d" });
          ctext(ctx, "多平台服务", -bw / 4, 70, 64, { align: "center", weight: 900, alpha: settle });
          // 原文节选（右页）＋荧光笔
          CLAUSE.forEach((s, i) => {
            const y = -bh / 2 + 80 + i * 66, a = k01(t, a6 + i * 0.08, 0.2);
            if (i >= 5) { const hp = k01(t, a6 + 0.6 + (i - 5) * 0.35, 0.35); if (hp > 0) { ctx.fillStyle = "rgba(255,210,31,.75)"; ctx.fillRect(40, y - 36, 690 * hp, 46); } }
            ctext(ctx, s, 50, y, i ? 30 : 32, { weight: i ? 600 : 900, alpha: a, fill: "#1a1a1a" });
          });
          // 中文意译
          const g = pop(k01(t, a6 + 1.6, 0.35));
          if (g > 0) { ctx.save(); ctx.translate(-bw / 4, 220); ctx.scale(g, g); rr(ctx, -330, -60, 660, 120, 18, C.yel, C.ink, 6); ctext(ctx, "跨平台游戏：道具可以通用", 0, -8, 40, { align: "center", weight: 900 }); ctext(ctx, "前提：iOS 里也能买到", 0, 42, 34, { align: "center", weight: 700 }); ctx.restore(); }
          // 书页里伸出一扇小门，打开
          const dp = pop(k01(t, a6 + 2.4, 0.3)), dopen = ease(k01(t, a6 + 2.7, 0.3));
          if (dp > 0) { ctx.save(); ctx.translate(560, 200); ctx.scale(dp, dp); rr(ctx, -60, -130, 120, 200, 8, "#0b1230", C.ink, 6); ctx.save(); ctx.translate(-60, 0); ctx.scale(1 - 0.85 * dopen, 1); rr(ctx, 0, -130, 120, 200, 8, C.brick, C.ink, 6); ctx.restore(); ctx.fillStyle = C.yel; ctx.globalAlpha = dopen * 0.8; ctx.fillRect(-44, -112, 88 * dopen, 164); ctx.restore(); }
        }
        ctx.restore();
        if (t >= a6) { w.note("App Store 审核指南 3.1.3(b) · 2018 年 6 月加入"); w.tag("原文节选"); }
      }
      return;
    }
    // ---- 侧视墙：窗、门、搬家卡车 ----
    w.cam(960, 540, 1);
    const open = { win: k01(t, a7 + 0.2, 0.3), mid: k01(t, a8, 0.3), door: k01(t, a7 + 1.6, 0.3) };
    mtext(ctx, "安卓区", 300, 160, 64, { rot: -0.04 }); mtext(ctx, "苹果区", 1640, 160, 64, { rot: 0.04 });
    sideWall(t, open);
    // 窗：两个英雄探头互看
    const peek = ease(k01(t, a7 + 0.4, 0.4));
    sticker(ctx, 109, mix(700, 810, peek), 245, 60, { rot: 0.2 * Math.sin(t * 3), scale: peek });
    sticker(ctx, 131, mix(1220, 1110, peek), 245, 60, { rot: -0.2 * Math.sin(t * 3), scale: peek });
    if (peek > 0) pill(1500, 260, "2020 · 互看资料", "#fff", { scale: pop(k01(t, a7 + 0.6, 0.3)), size: 36 });
    // 搬家卡车：开过最下面的门
    const tx = mix(-300, 2300, ease(k01(t, a7 + 1.8, 3.0)));
    if (t < a9) {
      truck(tx, 730, 0.9, { side: "990 荣耀币 ≈ 99 元" });
      if (t > a7 + 1.8 && t < a7 + 4.8) speedLines(ctx, tx - 190, 660, 1, 160, 6, t, 0.8);
      pill(420, 470, "2020 · 转区 99 元", C.yel, { scale: pop(k01(t, a7 + 2.0, 0.3)) * (1 - k01(t, a9 - 0.3, 0.2)), size: 36 });
    }
    // 中门：鸿蒙 × iPhone 同一局
    if (t >= a8) {
      const pin = easeOut(k01(t, a8 + 0.2, 0.4)), out = easeIn(k01(t, a9, 0.3));
      const scr = (c) => (cx, cw, ch) => { cx.save(); cx.fillStyle = "#2b7a3a"; cx.fillRect(-cw / 2 + 20, -ch / 2 + 60, cw - 40, ch - 160); cx.strokeStyle = "#e8d27a"; cx.lineWidth = 12; cx.beginPath(); cx.moveTo(-cw / 2 + 30, ch / 2 - 110); cx.lineTo(cw / 2 - 30, -ch / 2 + 70); cx.stroke(); ctext(cx, "同一局", 0, 10, 40, { align: "center", fill: "#fff", weight: 900 }); cx.restore(); void c; };
      phone(ctx, mix(500, 740, pin), 430, 240, "harmony", { rot: 0.1, alpha: 1 - out, screen: scr(0) });
      phone(ctx, mix(1420, 1180, pin), 430, 240, "apple", { rot: -0.1, alpha: 1 - out, screen: scr(1) });
      const hf = k01(t, a8 + 1.2, 0.25);
      sticker(ctx, 169, mix(560, 900, ease(hf)), 430, 52, { rot: 0.3 * hf, scale: pop(k01(t, a8 + 0.5, 0.3)) * (1 - out) });
      sticker(ctx, 166, mix(1360, 1020, ease(hf)), 430, 52, { rot: -0.3 * hf, scale: pop(k01(t, a8 + 0.6, 0.3)) * (1 - out) });
      burst(ctx, 960, 430, 150, k01(t, a8 + 1.45, 0.45));
      pill(1500, 560, "2025 · 鸿蒙 × iOS 跨平台匹配", "#fff", { scale: pop(k01(t, a8 + 0.4, 0.3)) * (1 - out), size: 36 });
    }
    // 搬家：东西排队过门，点券过不去
    if (t >= a9) {
      truck(380, 730, 0.9, { box: 1 - ease(k01(t, a9 + 0.2, 0.3)), side: "" });
      const items = [["英雄", "#fff"], ["皮肤", C.blue], ["铭文", "#b9f2c8"], ["金币", "#ffe28a"], ["钻石", "#bfe3ff"]];
      items.forEach(([s, f], i) => {
        const p = k01(t, a9 + 0.5 + i * 0.4, 0.6), x = mix(380, 1300 + i * 110, ease(p)), y = mix(560, 700 - (i % 2) * 80, p) - 200 * bump(p);
        pill(x, y, s, f, { rot: 0.2 * Math.sin(p * 6), scale: pop(k01(t, a9 + 0.45 + i * 0.4, 0.2)), size: 40 });
      });
      // 点券：撞门框弹回
      if (t >= a10) {
        const fly = k01(t, a10, 0.5), back = k01(t, a10 + 0.5, 0.7);
        let x = mix(380, 880, ease(fly)), y = mix(560, 640, fly) - 160 * bump(fly) * (1 - back), rot = 0;
        if (back > 0) { x = mix(880, 640, easeOut(back)); y = 700 - 140 * bump(back); rot = back * 10; }
        pill(x, y, "点券", C.coin, { rot, size: 48 });
        burst(ctx, 900, 640, 140, k01(t, a10 + 0.5, 0.4));
        mtext(ctx, "过不去！", 640, 520, 88, { fill: C.red, rot: -0.08, scale: pop(k01(t, a10 + 0.65, 0.3)) });
        w.note("2020 年官方转区规则：点券无法跨系统转移，申请前点券需 ≤20");
      }
    }
    void b10;
  } };

  // ================= S3 机制：两条收费管道 =================
  const yI = 380, yA = 620;
  const s3 = { state(t) {
    if (!inW(t, "s3")) return;
    const [a11] = Q(11), [a12] = Q(12), [a13] = Q(13), [a14] = Q(14), [a15] = Q(15);
    w.cam(960, 540, 1);
    if (t >= a13) w.note("示意｜苹果国区标准抽成 25%（2026 年 3 月起）" + (t >= a14 ? " · 联运五五是行业惯例，不是王者荣耀的合同" : ""));
    // 管道与收费站
    const pI = ease(k01(t, a12 + 0.1, 0.35)), pA = ease(k01(t, a12 + 0.6, 0.35));
    if (pI > 0) { pipe(ctx, 340, yI, mix(340, 1480, pI), 96); mtext(ctx, "苹果这条路", 380, yI - 72, 44, { align: "left", alpha: pI }); }
    if (pA > 0) { pipe(ctx, 340, yA, mix(340, 1480, pA), 96); mtext(ctx, "安卓这条路", 380, yA + 100, 44, { align: "left", alpha: pA }); }
    const bite = HIT.bite, mouth = t < a13 ? -1 : clamp((t - (bite - 0.45)) / 0.3) * (1 - k01(t, bite, 0.08)) + (t > bite + 0.25 ? 0 : 0);
    if (pI >= 1) gate(ctx, 840, yI + 50, 0.82, { logo: "apple", sign: "25%", mouth: t < a13 ? -1 : mouth, boom: 1, alpha: 1 });
    const booms = [0, 1, 2, 3].map((i) => 1 - ease(k01(t, a14 + 0.4 + i * 0.25, 0.15)) * (1 - ease(k01(t, a14 + 1.6 + i * 0.1, 0.2))));
    if (pA >= 1) ["华为", "小米", "OPPO", "vivo"].forEach((s, i) => gate(ctx, 620 + i * 160, yA + 46, 0.58, { sign: s, boom: t < a14 ? 1 : 1 - booms[i] * 0 + 0 }));
    if (t >= a14) mtext(ctx, "联运：五五分（行业惯例）", 900, yA + 100, 44, { fill: C.yel, scale: pop(k01(t, a14 + 0.5, 0.3)) });
    // 金库
    const vin = pop(k01(t, a12 + 1.0, 0.35));
    if (vin > 0) {
      ctx.save(); ctx.translate(1630, 520); ctx.scale(vin, vin); ctx.translate(-1630, -520);
      vault(ctx, 1630, 370, 240, 300, { bars: [0.75 * ease(k01(t, a15 + 0.8, 0.5)), 0.48 * ease(k01(t, a15 + 1.0, 0.5))], shake: 6 * squash(k01(t, a15 + 0.7, 0.5)) * 10 });
      ctx.restore(); mtext(ctx, "腾讯", 1630, 730, 52, { scale: vin });
    }
    // 账单
    const lin = easeOut(k01(t, a11 + 1.0, 0.4));
    if (lin > 0 && !window.__COVER_NO_LEDGER) ledger(ctx, mix(-600, 40, lin), 30, [["苹果路", "¥0.75", k01(t, bite + 0.5, 0.5)], ["商店联运", "¥0.5 不到", k01(t, a14 + 2.1, 0.5)]]);
    // 主角：点券翻成硬币，弹到左边
    const flip = k01(t, a11, 0.3), hop = ease(k01(t, a11 + 0.35, 0.5));
    const hx = mix(960, 190, hop), hy = mix(700, 520, hop) - 200 * bump(hop);
    const blink = bump(k01(t, a11 + 1.3, 0.18)) + bump(k01(t, a11 + 2.1, 0.18)) + bump(k01(t, a15 + 0.2, 0.18));
    ctx.save(); ctx.translate(hx, hy); ctx.scale(Math.max(0.02, Math.abs(Math.cos(flip * Math.PI))), 1);
    coin(ctx, 0, 0, 118 * mix(0.6, 1, hop), { face: t > a13 + 1 ? "shock" : "happy", blink, look: t > a13 ? 1 : 0, sq: squash(k01(t, a11 + 0.85, 0.5)) });
    ctx.restore();
    // 上管道：一枚硬币被咬掉 25%
    if (t >= a13) {
      const roll1 = ease(k01(t, a13, bite - a13)), x1 = t < bite ? mix(340, 760, roll1) : mix(760, 1250, ease(k01(t, bite + 0.1, 0.5)));
      coin(ctx, x1, yI - 4, 84, { missing: t >= bite ? 0.25 : 0, face: t >= bite ? "shock" : "happy", label: "", rot: t < bite ? rollRot(x1, 84) % (Math.PI * 2) : 0.1 * Math.sin(t * 9) });
      if (t >= bite) { burst(ctx, 900, yI - 40, 150, k01(t, bite, 0.4)); mtext(ctx, "咔嚓！", 1010, 500, 104, { fill: C.yel, rot: -0.24, scale: pop(k01(t, bite, 0.25)) * (1 - k01(t, bite + 1.4, 0.3)) }); }
    }
    // 下管道：过一排收费站，被切掉一半
    if (t >= a14) {
      const half = a14 + 1.55, x2 = t < half ? mix(340, 1110, ease(k01(t, a14, 1.5))) : mix(1110, 1340, ease(k01(t, half + 0.05, 0.4)));
      coin(ctx, x2, yA - 4, 84, { missing: t >= half ? 0.5 : 0, face: t >= half ? "cry" : "happy", label: "", tears: t * 1.6, rot: t < half ? rollRot(x2, 84) % (Math.PI * 2) : 0 });
      if (t >= half) { burst(ctx, 1200, yA - 20, 130, k01(t, half, 0.4)); mtext(ctx, "嚓！", 1240, yA - 120, 80, { fill: C.yel, rot: 0.2, scale: pop(k01(t, half, 0.25)) * (1 - k01(t, half + 1.2, 0.3)) }); }
    }
    // 两枚残币滚进金库
    if (t >= a15) {
      const r1 = ease(k01(t, a15, 0.7));
      if (r1 < 1) { coin(ctx, mix(1250, 1600, r1), mix(yI - 4, 560, r1), 84 * (1 - 0.6 * r1), { missing: 0.25, face: "shock", label: "" }); coin(ctx, mix(1340, 1660, r1), mix(yA - 4, 600, r1), 84 * (1 - 0.6 * r1), { missing: 0.5, face: "cry", label: "", tears: t }); }
      sticker(ctx, 112, 1420, 210, 68, { rot: -0.1, scale: pop(k01(t, a15 + 1.4, 0.35)) });
      bubble(ctx, 1500, 120, 230, 96, "就这？", { size: 50, rot: 0.06, scale: pop(k01(t, a15 + 1.7, 0.3)) });
    }
  } };

  // ================= S4 转折：拆墙与改道 =================
  function routes(t, p, swap) {
    // 两条虚线：左→右上苹果收费站，右→左安卓商店；swap 控制路线不断重画
    ctx.save(); ctx.strokeStyle = C.yel; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.setLineDash([28, 18]); ctx.lineDashOffset = -t * 120;
    const bend = 140 * Math.sin(swap * Math.PI);
    ctx.globalAlpha = clamp(p * 2);
    ctx.beginPath(); ctx.moveTo(640, 480); ctx.quadraticCurveTo(960, 330 + bend, mix(960, 1560, p), mix(470, 560, p)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1290, 500); ctx.quadraticCurveTo(960, 640 - bend, mix(960, 380, p), mix(560, 580, p)); ctx.stroke();
    ctx.restore();
  }
  const s4 = { state(t) {
    if (!inW(t, "s4")) return;
    const [a16] = Q(16), [a17] = Q(17), [a18] = Q(18), [a19] = Q(19), [a20] = Q(20), [a21] = Q(21);
    const freeze = k01(t, a21, 0.2);
    const zoomOut = ease(k01(t, a19 + 1.5, 0.8));
    w.cam(960, mix(540, 520, zoomOut), mix(1, 0.86, zoomOut));
    // 俯视地图网格（a19 之后铺开）
    if (zoomOut > 0) { ctx.save(); ctx.globalAlpha = 0.35 * zoomOut; ctx.strokeStyle = "#3a4b8c"; ctx.lineWidth = 3; for (let x = -200; x < 2200; x += 120) { ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, 1300); ctx.stroke(); } for (let y = -200; y < 1300; y += 120) { ctx.beginPath(); ctx.moveTo(-200, y); ctx.lineTo(2200, y); ctx.stroke(); } ctx.restore(); }
    mtext(ctx, "安卓区", 300, 150, 64, { rot: -0.04 }); mtext(ctx, "苹果区", 1640, 150, 64, { rot: 0.04 });
    const hk = easeOut(k01(t, HIT.smash, 0.15));
    wall(ctx, 880, 1040, 150, 950, { hole: { cx: 960, cy: 450, rx: 120, ry: 150, k: hk } });
    // 程咬金冲进来砸墙
    const run = easeIn(k01(t, a16, HIT.smash - a16)), recoil = ease(k01(t, HIT.smash + 0.1, 0.5));
    const hx = mix(2300, 1400, run) + 120 * recoil;
    if (t < a17 + 0.5) hero(ctx, 144, hx, 900, 640, { rot: -0.25 * run + 0.35 * bump(k01(t, HIT.smash - 0.12, 0.3)), flip: true, alpha: 1 - k01(t, a17, 0.4) });
    if (t >= HIT.smash) {
      burst(ctx, 1000, 450, 300, k01(t, HIT.smash, 0.45));
      for (let i = 0; i < 7; i++) { const d = t - HIT.smash, ang = -1.2 + i * 0.45; if (d < 1.4) brick(ctx, 960 + Math.cos(ang) * 900 * d * (0.6 + hash(i)), 450 + Math.sin(ang) * 500 * d + 900 * d * d, d * (4 + i), 1); }
      mtext(ctx, "哐！", 1260, 380, 120, { fill: C.yel, rot: 0.24, scale: pop(k01(t, HIT.smash, 0.25)) * (1 - k01(t, a17 + 0.2, 0.3)) });
    }
    // 两边的收费站
    const gIn = pop(k01(t, a17, 0.35));
    if (gIn > 0) {
      gate(ctx, 300, 720, 0.8 * gIn, { logo: "android", sign: "商店", boom: 1, flag: zoomOut > 0 ? { color: C.grn, wave: Math.sin(t * 6) } : null, lit: 0 });
      gate(ctx, 1640, 720, 0.85 * gIn, { logo: "apple", sign: "", boom: 1, mouth: 0.4 + 0.3 * Math.sin(t * 7), flag: zoomOut > 0 ? { color: "#e8ecf2", wave: Math.sin(t * 6 + 1) } : null });
    }
    // 钱改道：路线与蜂拥的硬币
    if (t >= a17) {
      const rp = ease(k01(t, a17 + 0.3, 1.0)), swap = t >= a18 ? Math.floor((t - a18) / 1.0) + ease(((t - a18) % 1.0) / 0.4) : 0;
      routes(freeze > 0 ? a21 : t, rp, swap);
      for (let i = 0; i < 8; i++) {
        const dir = i % 2 ? -1 : 1, ph = (((freeze > 0 ? a21 : t) - a17) * 0.45 + hash(i * 7)) % 1;
        const x = dir > 0 ? mix(560, 1360, ph) : mix(1360, 560, ph), jam = Math.exp(-((x - 960) ** 2) / 9000);
        const y = 480 + (hash(i) - 0.5) * 120 + 20 * Math.sin(t * 9 + i) * jam;
        coin(ctx, x, y, 46, { face: jam > 0.3 ? "shock" : "happy", label: "", rot: Math.sin(t * 8 + i) * 0.3, alpha: clamp(k01(t, a17 + i * 0.12, 0.2)) * (1 - 0.6 * freeze) });
      }
      if (t >= a18) w.note("行业分析 · 示意");
    }
    // 点券卡在洞里
    if (t >= HIT.smash + 0.3) {
      ctx.save(); ctx.translate(960, 450); ctx.rotate(-0.1 + 0.03 * Math.sin(t * 5)); rr(ctx, -94, -48, 188, 96, 14, C.coin, C.ink, 6); ctext(ctx, "点券", 0, 18, 52, { align: "center", weight: 900 }); ctx.restore();
    }
    // 收费站吵架
    if (t >= a19) {
      bubble(ctx, 90, 330, 420, 96, "那我的五成呢？", { size: 42, rot: -0.04, scale: pop(k01(t, a19 + 0.1, 0.3)) * (1 - 0.5 * freeze) });
      bubble(ctx, 1410, 330, 420, 96, "这笔钱算谁的？", { tail: "br", size: 42, rot: 0.04, scale: pop(k01(t, a19 + 0.5, 0.3)) * (1 - 0.5 * freeze) });
    }
    // 两本旧账对不上
    if (t >= a20) {
      const d1 = easeIn(k01(t, a20, 0.25)), d2 = easeIn(k01(t, a20 + 0.5, 0.25));
      book(ctx, 640, mix(-300, 640, d1), 300, 200, { label: "安卓旧账", color: "#2f7a4f", rot: -0.06, scale: 1 + squash(k01(t, a20 + 0.25, 0.4)), alpha: 1 - 0.6 * freeze });
      book(ctx, 1280, mix(-300, 640, d2), 300, 200, { label: "苹果旧账", color: "#3a4a8c", rot: 0.06, scale: 1 + squash(k01(t, a20 + 0.75, 0.4)), alpha: 1 - 0.6 * freeze });
      for (let i = 0; i < 4; i++) cross(ctx, 820 + (i % 2) * 280, 600 + Math.floor(i / 2) * 90, 26, k01(t, a20 + 1.4 + i * 0.4, 0.25) * (1 - freeze));
      sticker(ctx, 167, 560, 500, 58, { rot: -0.15 + 0.1 * Math.sin(t * 10), scale: pop(k01(t, a20 + 1.0, 0.3)) * (1 - freeze) });
      sticker(ctx, 131, 1360, 500, 58, { rot: 0.15 - 0.1 * Math.sin(t * 10), scale: pop(k01(t, a20 + 1.2, 0.3)) * (1 - freeze) });
      mtext(ctx, "我的！", 470, 440, 52, { scale: pop(k01(t, a20 + 1.6, 0.25)) * (1 - freeze) });
      mtext(ctx, "我的！", 1450, 440, 52, { scale: pop(k01(t, a20 + 1.9, 0.25)) * (1 - freeze) });
    }
    // 论点句：停半拍，地图在点券身后重画
    if (t >= a21) {
      w.note("行业分析");
      ctx.save(); ctx.fillStyle = "rgba(5,7,15,.55)"; ctx.globalAlpha = freeze; ctx.fillRect(-400, -300, 2800, 1700); ctx.restore();
      const rp = ease(k01(t, a21 + 0.5, 2.4));
      ctx.save(); ctx.strokeStyle = C.yel; ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round";
      const net = [[[200, 300], [700, 250], [960, 450], [1300, 260], [1750, 320]], [[250, 800], [620, 640], [960, 450], [1330, 690], [1700, 820]]];
      for (const pts of net) { ctx.beginPath(); const n = (pts.length - 1) * rp; for (let i = 0; i <= Math.floor(n); i++) { const [x, y] = pts[i]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } const f = n - Math.floor(n), i0 = Math.floor(n); if (i0 < pts.length - 1) ctx.lineTo(mix(pts[i0][0], pts[i0 + 1][0], f), mix(pts[i0][1], pts[i0 + 1][1], f)); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.translate(960, 450); ctx.rotate(-0.1); ctx.scale(1.3, 1.3); rr(ctx, -94, -48, 188, 96, 14, C.coin, C.ink, 6); ctext(ctx, "点券", 0, 18, 52, { align: "center", weight: 900 }); ctx.restore();
    }
  } };

  // ================= S5 现实落点：收费站地图 =================
  const GATES = [
    { id: "huawei", x: 520, y: 270, sign: "华为" }, { id: "apple", x: 1460, y: 270, logo: "apple", sign: "" },
    { id: "xiaomi", x: 360, y: 580, sign: "小米" }, { id: "oppo", x: 820, y: 540, sign: "OPPO" }, { id: "vivo", x: 1180, y: 580, sign: "vivo" },
  ];
  const ROADS = [[[120, 340], [520, 340], [960, 380], [1460, 340], [1800, 340]], [[120, 640], [360, 640], [820, 600], [1180, 640], [1800, 630]], [[960, 380], [820, 600]], [[520, 340], [360, 640]], [[1460, 340], [1180, 640]]];
  function road(pts, wdt = 60) {
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = C.ink; ctx.lineWidth = wdt + 14; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
    ctx.strokeStyle = C.pipe; ctx.lineWidth = wdt; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 5; ctx.setLineDash([22, 20]); ctx.stroke(); ctx.restore();
  }
  function mapScene(t, o = {}) {
    const { wob = 1, huaweiBoom = 1, appleSign = "25%", alpha = 1 } = o;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.globalAlpha *= 0.25; ctx.strokeStyle = "#3a5a9c"; ctx.lineWidth = 3; for (let x = -400; x < 2400; x += 120) { ctx.beginPath(); ctx.moveTo(x, -400); ctx.lineTo(x, 1500); ctx.stroke(); } for (let y = -400; y < 1500; y += 120) { ctx.beginPath(); ctx.moveTo(-400, y); ctx.lineTo(2400, y); ctx.stroke(); }
    ctx.globalAlpha /= 0.25;
    ROADS.forEach((r) => road(r));
    // 路上走着的硬币（循环位置由 t 直接算）
    for (let i = 0; i < 10; i++) { const r = ROADS[i % 2], u = (t * 0.06 + hash(i * 5)) % 1, seg = (r.length - 1) * u, k = Math.floor(seg), f = seg - k; coin(ctx, mix(r[k][0], r[k + 1][0], f), mix(r[k][1], r[k + 1][1], f) - 10, 26, { label: "", rot: Math.sin(t * 6 + i) * 0.3 }); }
    GATES.forEach((g, i) => gate(ctx, g.x + wob * 6 * Math.sin(t * 7 + i * 2), g.y + 30, 0.7, { sign: g.id === "apple" ? appleSign : g.sign, logo: g.logo, boom: g.id === "huawei" ? huaweiBoom : 1, flag: { color: [C.red, "#e8ecf2", C.yel, C.grn, C.blue][i], wave: Math.sin(t * 6 + i) }, mouth: g.id === "apple" ? 0.3 + 0.2 * Math.sin(t * 6) : -1 }));
    vault(ctx, 1700, 430, 150, 200, { bars: [0.75, 0.48] });
    ctx.restore();
  }
  function odometer(x, y, from, to, p, size) {
    // 数字滚动：「30%」→「25%」，每一位竖着滚
    ctx.save(); ctx.beginPath(); ctx.rect(x - size * 1.4, y - size * 1.05, size * 2.8, size * 1.35); ctx.clip();
    const k = easeOut(p);
    mtext(ctx, from, x, y - size * 1.3 * k, size, { fill: "#111", stroke: null });
    mtext(ctx, to, x, y + size * 1.3 * (1 - k), size, { fill: C.red, stroke: null });
    ctx.restore();
  }
  const s5 = { state(t) {
    if (!inW(t, "s5")) return;
    const [a22] = Q(22), [a23] = Q(23), [a24] = Q(24), [a25] = Q(25), [a26] = Q(26), [a27] = Q(27);
    // 镜头：全图 → 华为 → 苹果 → 下方新路 → 旧地图上的两座账本山
    const KEYS = [[a22, 960, 540, 1.25], [a22 + 0.8, 960, 560, 1], [a23, 960, 560, 1], [a23 + 0.6, 560, 330, 1.5], [a24, 560, 330, 1.5], [a24 + 0.5, 1460, 280, 1.6], [a25, 1460, 280, 1.6], [a25 + 0.6, 960, 700, 1.0], [a27 + 0.6, 960, 700, 1.0], [a27 + 1.4, 960, 420, 0.9]];
    let cx = 960, cy = 540, z = 1;
    for (let i = 0; i < KEYS.length; i++) { const A = KEYS[i], Bk = KEYS[i + 1]; if (!Bk || t < Bk[0]) { const p = Bk ? ease((t - A[0]) / (Bk[0] - A[0])) : 0; cx = mix(A[1], Bk ? Bk[1] : A[1], t < A[0] ? 0 : p); cy = mix(A[2], Bk ? Bk[2] : A[2], t < A[0] ? 0 : p); z = mix(A[3], Bk ? Bk[3] : A[3], t < A[0] ? 0 : p); break; } }
    w.cam(cx, cy, z);
    const slam = HIT.wall; void slam;
    const hb = t < a23 + 1.0 ? 1 : 1 - (ease(k01(t, a23 + 1.0, 0.12)) * (1 - ease(k01(t, a23 + 4.0, 0.3))));
    const huaweiBoom = 1 - hb;   // 0 = 抬起；下架期间落下
    const appleP = k01(t, a24 + 0.8, 0.8);
    mapScene(t, { huaweiBoom: t < a23 + 1.0 ? 0 : 1 - (1 - hb), appleSign: appleP < 0.5 ? "30%" : "25%", wob: t < a23 ? 1 : 0.3 });
    void huaweiBoom;
    // 华为闸门：游戏卡被挡、时钟飞转
    if (t >= a23 && t < a24) {
      w.note("2021-01-01 · 据第一财经等报道");
      const down = t >= a23 + 1.0 && t < a23 + 4.0;
      ["腾讯游戏", "腾讯游戏", "腾讯游戏"].forEach((s, i) => { const pass = ease(k01(t, a23 + 4.2 + i * 0.2, 0.6)); pill(mix(300 - i * 180, 760 + i * 180, down ? 0 : pass), 300 + (i % 2) * 12, s, "#fff", { scale: 0.7, size: 40, rot: down ? 0.05 * Math.sin(t * 12 + i) : 0 }); });
      if (t >= a23 + 1.0) burst(ctx, 460, 290, 110, k01(t, a23 + 1.0, 0.4));
      // 时钟
      const cp = k01(t, a23 + 1.4, 2.4), ang = -Math.PI / 2 + cp * Math.PI * 2 * 4;
      ctx.save(); ctx.translate(720, 150); ctx.beginPath(); ctx.arc(0, 0, 60, 0, 7); ctx.fillStyle = "#fff"; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.lineCap = "round"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * 50, Math.sin(ang) * 50); ctx.stroke(); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang / 12) * 30, Math.sin(ang / 12) * 30); ctx.stroke(); ctx.restore();
      mtext(ctx, cp < 1 ? "凌晨 1 点" : "当晚", 800, 168, 44, { align: "left", scale: pop(k01(t, a23 + 1.4, 0.3)) });
    }
    if (t >= a24 && t < a25) {
      w.note("2026-03-15 起 · 中国大陆店面标准抽成 · Apple 开发者新闻");
      // 苹果招牌翻牌：盖在招牌上的大号滚数
      ctx.save(); ctx.translate(1460, 80); rr(ctx, -150, -64, 300, 110, 16, "#fff", C.ink, 7); odometer(0, 26, "30%", "25%", appleP, 84); ctx.restore();
      burst(ctx, 1460, 70, 160, k01(t, a24 + 1.6, 0.4));
    }
    // 新修的一条直路：《王者荣耀世界》
    if (t >= a25) {
      const segs = 8;
      for (let i = 0; i < segs; i++) { const p = easeOut(k01(t, a25 + 0.2 + i * 0.16, 0.2)); if (p <= 0) continue; const x = 160 + i * 205; ctx.save(); ctx.translate(x + 100, 900 - 400 * (1 - p)); rr(ctx, -104, -40, 208, 80, 10, "#3d8bff", C.ink, 7); ctx.fillStyle = "#fff"; ctx.fillRect(-40, -4, 80, 8); ctx.restore(); }
      const sg = pop(k01(t, a25 + 1.6, 0.35));
      if (sg > 0) { ctx.save(); ctx.translate(1700, 760); ctx.scale(sg, sg); ctx.fillStyle = C.ink; ctx.fillRect(-8, 0, 16, 120); rr(ctx, -250, -90, 500, 100, 14, C.yel, C.ink, 7); ctext(ctx, "《王者荣耀世界》", 0, -22, 46, { align: "center", weight: 900 }); ctx.restore(); }
    }
    if (t >= a26) {
      w.note("2026 年 4 月上线 · 据媒体报道：同一账号，数据互通");
      const devs = [["android", 300], ["apple", 520]];
      devs.forEach(([k, x], i) => phone(ctx, x, 770, 150, k, { scale: pop(k01(t, a26 + i * 0.2, 0.3)) }));
      const pc = pop(k01(t, a26 + 0.4, 0.3));
      if (pc > 0) { ctx.save(); ctx.translate(760, 780); ctx.scale(pc, pc); rr(ctx, -110, -80, 220, 140, 12, "#1d1f27", C.ink, 7); rr(ctx, -96, -66, 192, 112, 8, "#3a4a8c"); ctx.fillStyle = C.ink; ctx.fillRect(-14, 60, 28, 30); ctx.fillRect(-60, 86, 120, 12); ctx.restore(); }
      for (let i = 0; i < 3; i++) {
        const p = ease(k01(t, a26 + 0.7 + i * 0.3, 1.2)), x0 = [300, 520, 760][i];
        coin(ctx, mix(x0, 900 + i * 110, p), mix(700, 860, p) - 80 * bump(p), 40, { label: "", face: "happy", blink: bump(k01(t, a26 + 2.2 + i * 0.1, 0.2)) });
      }
    }
    if (t >= a27) {
      book(ctx, 1300, 830, 200, 110, { label: "一本账", color: C.blue, scale: pop(k01(t, a27, 0.3)) });
      const up = k01(t, a27 + 1.4, 1.4);
      for (let i = 0; i < 6; i++) { const s = pop(k01(t, a27 + 1.6 + i * 0.18, 0.25)); book(ctx, 560, 300 - i * 52, 260, 70, { label: i === 5 ? "安卓账" : "", color: "#2f7a4f", scale: s, rot: (hash(i) - 0.5) * 0.12 }); book(ctx, 1360, 300 - i * 52, 260, 70, { label: i === 5 ? "苹果账" : "", color: "#3a4a8c", scale: s, rot: (hash(i + 3) - 0.5) * 0.12 }); }
      void up;
    }
  } };

  // ================= S6 结尾：硬币登顶 =================
  const STEPS = [[260, 740], [560, 630], [860, 520], [1160, 410], [1460, 300]];
  const s6 = { state(t) {
    if (!inW(t, "s6")) return;
    const [a28] = Q(28), [a29] = Q(29);
    const pull = ease(k01(t, a29, 1.2));
    w.cam(mix(900, 960, pull), mix(620, 520, pull), mix(1, 0.62, pull));
    // 远处的大地图：拉高后才看得见，一齐亮灯
    if (pull > 0) {
      for (let i = 0; i < 26; i++) {
        const gx = -500 + (i % 9) * 360 + (Math.floor(i / 9) % 2) * 180, gy = -260 + Math.floor(i / 9) * 600;
        const lit = k01(t, HIT.lights + hash(i) * 0.8, 0.2);
        gate(ctx, gx, gy + 200, 0.55, { sign: "", boom: 1, lit, alpha: clamp(pull * 2) });
      }
    }
    STEPS.forEach(([x, y], i) => gate(ctx, x, y + 130, 0.8, { sign: ["华为", "小米", "OPPO", "vivo", ""][i], logo: i === 4 ? "apple" : null, lit: k01(t, a28 + i * 0.5 + 0.25, 0.15) * (1 - 0.4 * k01(t, a28 + i * 0.5 + 0.6, 0.4)) + (t >= HIT.lights ? 1 : 0) }));
    // 硬币每拍跳一个屋顶
    const hopI = clamp(Math.floor((t - a28) / 0.5), -1, 4), f = clamp(((t - a28) % 0.5) / 0.5);
    let x = 120, y = 820, sq = 0;
    if (t >= a28) {
      const from = hopI <= 0 ? [120, 820] : STEPS[hopI - 1], to = STEPS[Math.max(0, hopI)];
      const done = t >= a28 + 2.5;
      const p = done ? 1 : ease(f);
      x = mix(from[0], to[0], p); y = mix(from[1] - 60, to[1] - 60, p) - (done ? 0 : 220 * bump(f)); sq = done ? squash(k01(t, a28 + 2.5, 0.5)) : 0;
    }
    const look = t >= a28 + 2.8 ? -1 : 1;
    coin(ctx, x, y, 70, { face: "happy", look, sq, blink: bump(k01(t, a28 + 3.0, 0.2)) });
    // 问句：画面自画（noshow）
    if (t >= a29) {
      const p1 = pop(k01(t, a29 + 0.3, 0.3)), p2 = pop(k01(t, a29 + 0.7, 0.3));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "rgba(5,8,20,.6)"; ctx.globalAlpha = clamp(p1); ctx.fillRect(0, 0, 1920, 1080); ctx.globalAlpha = 1;
      mtext(ctx, "你手机里的每一笔钱，", 960, 450, 92, { scale: p1 });
      mtext(ctx, "路上过了几道收费站？", 960, 590, 92, { fill: C.yel, scale: p2 });
      ctx.restore();
    }
  } };

  // ================= 引用卡 =================
  const card = { state(t) {
    if (!inW(t, "card")) return;
    w.cam(960, 540, 1);
    ctext(ctx, "资料来源", 160, 200, 52, { fill: C.yel, weight: 900 });
    const src = ["王者荣耀官网 FAQ（2015）· 2020 年跨系统角色转移规则", "Apple App Store 审核指南 3.1.3(b) · Apple 开发者新闻（2026-03-12）", "第一财经、钛媒体、虎嗅（2021-01 华为与腾讯游戏）· 新浪科技（2025-01 鸿蒙版）", "网易 / IT之家（2026-04《王者荣耀世界》）"];
    src.forEach((s, i) => ctext(ctx, s, 160, 300 + i * 70, 36, { fill: "#eef2f8", weight: 600 }));
    rr(ctx, 160, 620, 1600, 4, 2, "#3a4b8c");
    ctext(ctx, "本片为商业分析示意，分成比例来自公开报道与行业惯例，不构成对任何公司的评价。", 160, 700, 36, { fill: "#eef2f8", weight: 700 });
    ctext(ctx, "游戏 logo 与英雄形象版权归腾讯所有 · 本片由代码生成", 160, 770, 34, { fill: "#9fb0d8", weight: 600 });
    coin(ctx, 1700, 900, 60, { blink: bump(k01(t, W.card[0] + 0.8, 0.2)), look: -1 });
  } };

  return [bg, s1, s2, s3, s4, s5, s6, card];
}
