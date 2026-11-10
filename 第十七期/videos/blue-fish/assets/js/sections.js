// 六段：每段 build 一次（建 DOM），state(t) 每帧按 t 摆放。窗口外主动 vis(el, 0)，跳帧不留残影。
// 时间一律写成 B(n)（拍）；重击放整拍，轻击放半拍。与分镜 v6 的 nK 一一对应。
import { B, SEC } from "./beats.js";
import { clamp, lerp, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, win, pulse, el, vis, rng } from "./lib.js";
import { typed, dash, seal } from "./rig.js";
import { whaleSVG, headSVG, iconSVG, personSVG, HEART_D, loadLogo } from "./art.js";

/* ================= 小工具 ================= */
/** 关键帧插值：keys = [[t, v], …]，v 为数或数组；段间用 f 缓动 */
function kf(t, keys, f = easeInOut) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], k = f((t - t0) / (t1 - t0));
    return Array.isArray(v0) ? v0.map((x, j) => x + (v1[j] - x) * k) : v0 + (v1 - v0) * k;
  }
  return keys[keys.length - 1][1];
}
/** 演员：按「中心点」摆放的绝对定位块。at(a, x, y, s, r) */
function actor(html, w, h, cls = "", parent = "stage", style = "") {
  const e = el(html, "abs " + cls, parent, `left:0;top:0;width:${w}px;height:${h}px;transform-origin:50% 50%;${style}`);
  return {
    e, w, h,
    at(a, x = 960, y = 540, s = 1, r = 0, sx = 1) {
      vis(e, a, `translate(${(x - w / 2).toFixed(1)}px,${(y - h / 2).toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${(s * sx).toFixed(4)},${s.toFixed(4)})`);
    },
    hide() { vis(e, 0); },
  };
}
/** 弹入：t0 起 d 秒从 0 → 1（带回弹） */
const popK = (t, t0, d = 0.32) => easeOutBack(ramp(t, t0, d), 1.9);
/** 部件透明度 */
function part(root, sel, a, tf) { const g = root.querySelector(sel); if (!g) return; g.style.opacity = clamp(a).toFixed(3); if (tf !== undefined) g.setAttribute("transform", tf); }
/** 官方 Logo 的部件：b 实心、o 虚线轮廓 */
function face(root, k) { part(root, ".wo", k.o ?? 0); part(root, ".wb", k.b ?? 1); }
const FULL = { b: 1 };
/**
 * 图片演员：用户提供的原图（assets/img/*.png，tools/prep-assets.py 裁切 / 抠图）。
 * opt.card：白边圆角卡（梗图 / 照片）；opt.fit / opt.pos：object-fit / object-position；opt.fade：底部渐隐比例
 */
function pic(name, w, h, opt = {}) {
  const { card = false, fit = "contain", pos = "50% 50%", pad = 0, radius = 18, fade = 0, extra = "" } = opt;
  const mask = fade ? `-webkit-mask-image:linear-gradient(180deg,#000 ${(100 - fade * 100).toFixed(0)}%,transparent 100%);mask-image:linear-gradient(180deg,#000 ${(100 - fade * 100).toFixed(0)}%,transparent 100%);` : "";
  const img = `<img src="assets/img/${name}.png" style="position:absolute;left:${pad}px;top:${pad}px;width:calc(100% - ${2 * pad}px);height:calc(100% - ${2 * pad}px);object-fit:${fit};object-position:${pos};border-radius:${card ? Math.max(0, radius - pad / 2) : 0}px;${mask}">`;
  const a = actor((card ? `<div class="card" style="position:absolute;inset:0;border-radius:${radius}px"></div>` : "") + img + extra, w, h);
  return { ...a, img: a.e.querySelector("img") };
}
/** 心形路径缩放到 w×h 的盒子（CSS clip-path: path() 用） */
function heartPath(w, h) {
  return HEART_D.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => `${((+x + 100) / 200 * w).toFixed(1)} ${((+y + 92) / 168 * h).toFixed(1)}`);
}
/** 一张带点阵的白卡（开场 / 长脸 / 结尾共用同一版式） */
let cardN = 0;
function logoCard(w = 760, h = 480, ws = 1) {
  const c = actor(`<div class="card dots" style="position:absolute;inset:0"></div>${whaleSVG("lc" + (cardN++))}`, w, h);
  const sv = c.e.querySelector("svg");
  sv.style.cssText = `position:absolute;left:${(w - 498) / 2}px;top:${(h - 400) / 2 - 6}px;transform:scale(${ws});transform-origin:50% 52%`;
  return { ...c, sv };
}

/* ================= S1 冷开场 n0–n24 ================= */
function s1(world) {
  const [T0, T1] = SEC.s1;
  const card = logoCard();
  const chat = el(`<div class="bar"><i></i>DeepSeek</div>
    <div class="bub me" style="right:30px;top:96px"><svg class="thumb" viewBox="0 0 418 309"><use href="#none"/></svg>这是什么？</div>
    <div class="bub ai" style="left:30px;top:250px"><span class="ty"></span></div>
    <div class="bub ai small" style="left:30px;top:350px"><span class="ty2"></span></div>`, "card chat", "stage");
  // 缩略图：直接再画一只小 Logo
  chat.querySelector(".thumb").outerHTML = `<span class="thumb" style="position:relative;overflow:hidden">${whaleSVG("th").replace('width="498" height="400"', 'width="116" height="94" style="position:absolute;left:0;top:-2px"')}</span>`;
  const ty = chat.querySelector(".ty"), ty2 = chat.querySelector(".ty2");
  const aiB = chat.querySelectorAll(".bub.ai"), meB = chat.querySelector(".bub.me");
  const words = ["闺女", "喂白饭", "大肥鱼", "催起床", "摸鱼", "本鲸"];
  const spots = [[-330, -200, -8], [300, -215, 6], [-360, 40, 7], [350, -10, -6], [-250, 230, -5], [290, 215, 8]];
  const stk = words.map((w, i) => actor(`<div class="sticker${i % 3 === 1 ? " or" : ""}" style="position:static;display:inline-block">${w}</div>`, 220, 90, "", "stage", "display:flex;align-items:center;justify-content:center"));
  // n19.5 起：几张真的表情包从四角飞进来（越玩越大）
  const FLY = [["m-rice", 330, 290, -8], ["m-wake", 1600, 300, 7], ["m-anime", 360, 760, 6], ["m-god", 1580, 770, -7]];
  const fly = FLY.map(([n]) => pic(n, 300, 300, { card: true, fit: "cover", pad: 10 }));

  return {
    state(t) {
      const on = t < T1 + B(1.6);
      if (!on) { card.hide(); vis(chat, 0); stk.forEach((s) => s.hide()); fly.forEach((f) => f.hide()); return; }
      // 白卡：n0 从上落入 → n7 退到左侧 → n16 回中 → n22 推近 → n24 缩成时间轴左端的小 Logo
      const drop = easeOutBack(ramp(t, 0.05, 0.62), 1.4);
      let [x, y, s] = kf(t, [[B(7), [960, 470, 1.18]], [B(8), [500, 470, 0.86]], [B(16), [500, 470, 0.86]], [B(17), [960, 480, 1.1]], [B(22), [960, 480, 1.1]], [B(23.5), [960, 470, 1.2]], [B(25), [200, 610, 0.17]]]);
      y += (1 - drop) * -760;
      const r = (1 - drop) * -6 + (t > B(22) && t < B(23.5) ? 1.2 * Math.sin(t * 40) * (1 - ramp(t, B(22), B(1.5))) : 0);
      const aCard = 1 - ramp(t, B(24.6), B(0.5));
      card.at(aCard, x, y, s, r);
      face(card.sv, { b: 1 });
      // 对话窗（示意）
      const aChat = win(t, B(7), B(16), 0.35, 0.35);
      vis(chat, aChat, `translateX(${((1 - ease(ramp(t, B(7), 0.4))) * 120 + ease(ramp(t, B(16), 0.4)) * 160).toFixed(1)}px)`);
      if (aChat > 0) {
        vis(meB, ease(ramp(t, B(7.5), 0.25)), `translateY(${((1 - ease(ramp(t, B(7.5), 0.25))) * 20).toFixed(1)}px)`);
        vis(aiB[0], ease(ramp(t, B(9.5), 0.2)));
        ty.innerHTML = t < B(10) ? "……" : typed_html("这是一只<b>蓝色大肥鱼</b>。", ramp(t, B(10), B(2.2)));
        vis(aiB[1], ease(ramp(t, B(13), 0.2)));
        typed(ty2, "……等等，这好像是我自己？", ramp(t, B(13), B(2.4)));
        world.setMark("示意", aChat);
        world.setNote("示意 · 据网友分享的对话", win(t, B(8), B(16), 0.3, 0.3));
      }
      fly.forEach((f, i) => {
        const [, fx2, fy2, rr] = FLY[i], t0 = B(19.5 + i * 0.5), k = easeOutBack(ramp(t, t0, 0.4), 1.5);
        const go = ease(ramp(t, B(23.2), B(1.4)));
        const sx0 = fx2 < 960 ? -260 : 2180, sy0 = fy2 < 540 ? -200 : 1280;
        f.at(t < t0 ? 0 : (1 - go), lerp(lerp(sx0, fx2, k), 200, go), lerp(lerp(sy0, fy2, k), 610, go), (0.95 + 0.05 * Math.sin(t * 2 + i)) * (1 - 0.85 * go), rr * (1 - go));
      });
      // 称呼贴纸：n16 起半拍一张，贴在白卡四周；n24 跟着白卡一起缩走
      stk.forEach((st, i) => {
        const t0 = B(16 + i * 0.5), k = popK(t, t0, 0.3);
        const [dx, dy, rr] = spots[i];
        const go = ease(ramp(t, B(23.5), B(1.3)));
        const sx = lerp(x + dx * s, 200, go), sy = lerp(y + dy * s, 610, go);
        st.at(t < t0 ? 0 : (1 - go) * clamp(k * 3), sx, sy, (1.7 - 0.7 * k) * s * (1 - 0.8 * go), rr + 3 * Math.sin(t * 2 + i));
      });
    },
  };
}
/** 逐字打出（保留 <b> 标签） */
function typed_html(html, f) {
  const plain = html.replace(/<[^>]+>/g, ""), n = Math.round(clamp(f) * Array.from(plain).length);
  let out = "", c = 0;
  for (const m of html.matchAll(/<[^>]+>|[\s\S]/gu)) { const s = m[0]; if (s.startsWith("<")) out += s; else { if (c >= n) continue; out += s; c++; } }
  return out;
}

/* ================= S2 溯源 n24–n54 ================= */
function s2(world) {
  const [T0, T1] = SEC.s2;
  const Y = 610, X0 = 200, X1 = 1720;
  const line = el(`<svg class="art" width="1920" height="1080" viewBox="0 0 1920 1080"><path class="ln" d="M${X0} ${Y} L${X1} ${Y}" stroke="#1279b3" stroke-width="6" stroke-linecap="round" fill="none"/></svg>`, "abs", "stage", "left:0;top:0");
  const ln = line.querySelector(".ln");
  const mini = actor(whaleSVG("mini"), 498, 400);
  const q = actor(`<div style="width:90px;height:90px;border-radius:50%;background:#fff;border:5px solid #1279b3;font:900 56px/80px NotoSC;color:#0a6499;text-align:center">?</div>`, 90, 90);
  const NX = [480, 1000, 1480];
  const nodes = NX.map((x) => el("", "node", "stage", `left:${x}px;top:${Y}px`));
  const dates = [["2026 · 04", NX[0]], ["", NX[1]], ["2026 · 08", NX[2]]].map(([d, x]) => el(d, "date", "stage", `left:${x}px;top:${Y + 26}px`));
  // 卡 1：溟月剪影
  const c1 = actor(`<div class="card" style="position:absolute;inset:0"></div>
    <img src="assets/img/mingyue.jpg" style="position:absolute;left:12px;top:12px;width:356px;height:350px;object-fit:contain;object-position:50% 0">
    <div class="lab c" style="left:0;right:0;top:370px;font-size:32px">「溟月」</div>
    <div class="lab s c" style="left:0;right:0;top:412px;font-size:22px">画师 上善无形 · 原创角色</div>`, 380, 456);
  // 卡 2：AI 二创（剪影 → 上色）
  const c2 = actor(`<div class="card" style="position:absolute;inset:0"></div>
    <img src="assets/img/mingyue.jpg" style="position:absolute;left:12px;top:12px;width:356px;height:350px;object-fit:contain;object-position:50% 0">
    <img class="gs" src="assets/img/maid.jpg" style="position:absolute;left:12px;top:12px;width:356px;height:350px;object-fit:cover;object-position:50% 8%;border-radius:14px">
    <div class="lab c" style="left:0;right:0;top:368px;font-size:30px">AI 二创 · 女仆装</div>
    <div class="prog" style="left:40px;right:40px;top:418px"><i></i></div>`, 380, 456);
  const gs = c2.e.querySelector(".gs"), bar = c2.e.querySelector(".prog i");   // gs：二创图，随进度条从左往右擦出
  // 卡 3：V4-Flash
  const c3 = actor(`<div class="card" style="position:absolute;inset:0;display:grid;place-items:center"><div style="text-align:center"><div class="lab" style="position:static;font-size:44px;color:#0a6499">V4-Flash</div><div class="lab s" style="position:static">发布</div></div></div>`, 300, 170);
  const fishTag = actor(`<div class="sticker or" style="position:static;display:inline-block">大肥鱼</div>`, 200, 90, "", "stage", "display:flex;align-items:center;justify-content:center");
  const viral = actor(`<div class="lab" style="position:static;font-size:56px;color:#9a4700;font-weight:900;letter-spacing:.2em">出圈</div>`, 240, 80, "", "stage", "display:flex;align-items:center;justify-content:center");
  // 表情卡扇
  const MEM = ["m-rice", "m-anime", "m-wake", "m-users", "m-cry", "m-hole", "m-god", "m-qwen"];   // 用户收集的真梗图
  const memes = MEM.map((n) => pic(n, 250, 250, { card: true, fit: "cover", pad: 9 }));

  return {
    state(t) {
      const on = t > T0 - 0.1 && t < T1 + B(1.5);
      if (!on) { vis(line, 0); mini.hide(); q.hide(); nodes.forEach((n) => vis(n, 0)); dates.forEach((d) => vis(d, 0)); [c1, c2, c3, fishTag, viral, ...memes].forEach((a) => a.hide()); return; }
      const out = ease(ramp(t, B(52.5), B(1.6)));          // 收束：整条时间轴缩向中心淡出
      const gA = 1 - out, gS = 1 - 0.25 * out;
      const dim = 1 - 0.8 * ease(ramp(t, B(49.4), 0.5));  // 表情卡扇开时，时间轴退到背景
      const tf = (x, y) => [960 + (x - 960) * gS, 540 + (y - 540) * gS];
      vis(line, gA * dim, `scale(${gS})`); line.style.transformOrigin = "960px 540px";
      dash(ln, ease(ramp(t, B(24), B(2.2))));
      const [mx, my] = tf(X0, Y);
      mini.at(ease(ramp(t, B(24.4), 0.3)) * gA * dim, mx, my, 0.24 * gS);
      face(mini.e, { b: 1 });
      const qx = tf(X1, Y);
      q.at(popK(t, B(26), 0.3) * gA * (1 - ease(ramp(t, B(47), 0.4))), qx[0], qx[1], gS);
      NX.forEach((x, i) => {
        const t0 = B([30, 38, 46][i]), k = popK(t, t0, 0.3), [nx, ny] = tf(x, Y);
        vis(nodes[i], clamp(k * 3) * gA * dim, `translate(${(nx - x).toFixed(1)}px,${(ny - Y).toFixed(1)}px) scale(${(k * gS).toFixed(3)})`);
        vis(dates[i], ease(ramp(t, t0 + 0.1, 0.3)) * gA * (1 - ease(ramp(t, B(49.4), 0.4))), `translate(-50%,0) translate(${(nx - x).toFixed(1)}px,${(ny - Y).toFixed(1)}px)`);
      });
      // 卡 1（n30）
      const CS = 1.12, CY = 364;
      const away = ease(ramp(t, B(49.4), 0.4));
      const k1 = popK(t, B(30), 0.36), p1 = tf(NX[0], CY);
      c1.at(clamp(k1 * 3) * gA, p1[0], p1[1] + (1 - k1) * 40, (0.7 + 0.3 * k1) * CS * gS);
      // 卡 2（n38）：进度条 n38.5 → n43，剪影淡出；n47 起移到节点 3，盖住「V4-Flash」卡
      const k2 = popK(t, B(38), 0.36), p2 = tf(NX[1], CY);
      const prog = ease(ramp(t, B(38.5), B(4.5)));
      const up = ease(ramp(t, B(47), B(1.2)));
      const p2b = tf(NX[2], CY);
      c2.at(clamp(k2 * 3) * gA, lerp(p2[0], p2b[0], up), lerp(p2[1], p2b[1], up) + (1 - k2) * 40, (0.7 + 0.3 * k2) * CS * gS);
      bar.style.width = (prog * 100).toFixed(1) + "%";
      gs.style.clipPath = `inset(0 ${((1 - prog) * 100).toFixed(1)}% 0 0 round 12px)`;
      // 「大肥鱼」贴纸：n44.5 从左端小 Logo 沿轴滑到卡 2 右上角，之后跟着卡 2 走
      const sl = easeInOut(ramp(t, B(44.5), B(2)));
      const fx0 = tf(lerp(X0, NX[1] + 190, sl), lerp(Y - 60, CY - 210, sl));
      const fxu = tf(lerp(NX[1], NX[2], up) + 190, CY - 210);
      fishTag.at(ease(ramp(t, B(44.5), 0.3)) * gA, up > 0 ? fxu[0] : fx0[0], up > 0 ? fxu[1] : fx0[1], 1.15 * gS, -6);
      // 卡 3（n46）V4-Flash 在节点 3 上方，n47 起被卡 2 盖住
      const k3 = popK(t, B(46), 0.36), p3 = tf(NX[2], CY);
      // n47 起缩成卡 2 左上角的小标，跟着卡 2 走（不叠在一起）
      const badge = easeInOut(ramp(t, B(47), B(1.2)));
      const pb = tf(lerp(NX[1], NX[2], up) - 190, CY - 240);
      c3.at(clamp(k3 * 3) * gA * (1 - away), lerp(p3[0], pb[0], badge), lerp(p3[1], pb[1], badge), (0.7 + 0.3 * k3) * lerp(1.3, 0.62, badge) * gS, -8 * badge);
      // n48 出圈：光环 + 字
      const kv = ramp(t, B(48), 1.2);
      if (kv > 0 && kv < 1) { const [vx, vy] = tf(NX[2], CY); world.ring(vx, vy, kv, 160, 760, "240,160,75", 12); world.ring(vx, vy, clamp(kv * 1.3 - 0.15), 160, 640, "31,155,214", 8); }
      const pv = tf(NX[2] - 330, CY - 120);
      viral.at(popK(t, B(48), 0.3) * gA * (1 - ease(ramp(t, B(50), 0.3))), pv[0], pv[1], 1.2 * gS, -8);
      // n50 表情卡扇开（少而大）；注释带写规模口径
      memes.forEach((m, i) => {
        const t0 = B(49.6 + i * 0.18), k = easeOutBack(ramp(t, t0, 0.35), 1.6);
        const ang = -45 + i * (90 / 7), rad = 760;
        const cx = 960 + Math.sin(ang * Math.PI / 180) * rad, cy = 1130 - Math.cos(ang * Math.PI / 180) * rad;
        const c = tf(lerp(NX[2], cx, k), lerp(CY, cy, k));
        m.at(clamp(ramp(t, t0, 0.15)) * gA, c[0], c[1], (0.4 + 0.6 * k) * 1.15 * gS, ang * 0.55 + 2 * Math.sin(t * 1.4 + i));
      });
      // 50–54：卡 1 / 卡 2 / 贴纸给表情卡让位
      if (away > 0) { c1.e.style.opacity = (Number(c1.e.style.opacity) * (1 - away)).toFixed(3); c2.e.style.opacity = (Number(c2.e.style.opacity) * (1 - away)).toFixed(3); fishTag.e.style.opacity = (Number(fishTag.e.style.opacity) * (1 - away)).toFixed(3); }
      world.setMark("图为示意", win(t, B(30), B(46.5), 0.3, 0.3));
      world.setNote("据报道 · 图片为网友创作", win(t, B(30.4), B(46), 0.3, 0.3));
      world.setNote("8 月 · DeepSeek-V4-Flash 发布", win(t, B(46.2), B(49.6), 0.3, 0.3));
      world.setNote("AcFun 话题收录 <b>192</b> 张动图（截至 2026-10）", win(t, B(49.8), B(54), 0.3, 0.3));
    },
  };
}

/* ================= S3 机制 n54–n150 ================= */
function s3(world) {
  const [T0, T1] = SEC.s3;
  /* --- A 长脸 --- */
  const card = logoCard(900, 560, 1.2);
  // 卡里藏着用户设定卡上的鲸鱼娘半身像：称呼贴纸落下的地方，一圈一圈「长」出来（CSS mask = 若干个圆的并集）
  const grown = el(`<img src="assets/img/girl-portrait.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 9%">`, "abs", card.e, "left:0;top:0;width:900px;height:560px;border-radius:26px;overflow:hidden;visibility:visible");
  card.e.insertBefore(grown, card.sv.nextSibling); grown.style.visibility = "visible";
  const words = ["闺女", "喂白饭", "大肥鱼", "催起床", "摸鱼", "本鲸"];
  const keys = ["e", "k", "m", "c", "t", "s"];
  const spots = [[-400, -220], [380, -240], [-470, 20], [470, -40], [-380, 250], [400, 240]];
  const stk = words.map((w, i) => actor(`<div class="sticker${i % 3 === 1 ? " or" : ""}" style="position:static;display:inline-block">${w}</div>`, 220, 90, "", "stage", "display:flex;align-items:center;justify-content:center"));
  /* --- B 金句 --- */
  const quote = actor(`<div class="card dots" style="position:absolute;inset:0"></div>
    <div class="qt">被爱的东西，<br>会<em>疯狂长出血肉</em>。</div>
    <svg class="art" width="1320" height="540" viewBox="0 0 1320 540" style="left:0;top:0"><path class="qc" d="M352 336 C 420 246, 900 236, 996 286 C 1070 336, 900 384, 660 382 C 450 380, 322 352, 344 312 C 360 284, 420 270, 472 266" fill="none" stroke="#1279b3" stroke-width="6" stroke-linecap="round"/></svg>
    <div class="qs">二次元圈流传语 · 无唯一出处</div>`, 1320, 540, "quote");
  const qc = quote.e.querySelector(".qc");
  const qSeal = seal("stage", { x: 1530, y: 640, size: 130, text: "类比", rot: -14 });
  /* --- C 三张空卡 --- */
  const slotIcons = [
    `<svg viewBox="0 0 160 110" width="160" height="110"><rect x="8" y="10" width="96" height="56" rx="16" fill="#e2f2fc" stroke="#1279b3" stroke-width="5"/><path d="M30 66 L24 86 L50 66" fill="#e2f2fc" stroke="#1279b3" stroke-width="5" stroke-linejoin="round"/><rect x="66" y="42" width="86" height="50" rx="16" fill="#fff" stroke="#143a5c" stroke-width="5"/></svg>`,
    `<svg viewBox="0 0 160 110" width="160" height="110"><circle cx="80" cy="56" r="46" fill="#fff5ec" stroke="#143a5c" stroke-width="5"/><ellipse cx="62" cy="64" rx="9" ry="11" fill="#143a5c"/><ellipse cx="98" cy="64" rx="9" ry="11" fill="#143a5c"/><ellipse cx="56" cy="84" rx="9" ry="5" fill="#ffc0b4"/><ellipse cx="104" cy="84" rx="9" ry="5" fill="#ffc0b4"/></svg>`,
    `<svg viewBox="0 0 160 110" width="160" height="110"><path d="M10 96 H150 M10 96 V8" stroke="#2f5f7d" stroke-width="4"/><path d="M14 90 C 60 70, 90 40, 108 34 C 118 62, 122 84, 128 88 C 134 40, 140 22, 150 16" fill="none" stroke="#1279b3" stroke-width="6" stroke-linecap="round"/></svg>`,
  ];
  const slotTitles = ["对话的错觉", "婴儿般的脸", "画风的位置"];
  const slots = slotTitles.map((s, i) => actor(`<div class="card" style="position:absolute;inset:0"></div><div class="sn">${i + 1}</div><div style="position:absolute;left:0;right:0;top:70px;display:flex;justify-content:center">${slotIcons[i]}</div><div class="st">${s}</div>`, 420, 300, "slot"));
  /* --- D ELIZA --- */
  const term = el(`<div class="bar">ELIZA · 1966</div>
    <div class="tl" style="top:96px"><span class="who">我</span><span class="l1"></span></div>
    <div class="tl e" style="top:186px"><span class="who">ELIZA</span><span class="l2"></span></div>
    <div class="tl" style="top:276px"><span class="who">我</span><span class="l3"></span></div>
    <div class="tl e" style="top:366px"><span class="who">ELIZA</span><span class="l4"></span></div>
    <svg class="art lk" width="900" height="520" viewBox="0 0 900 520" style="left:0;top:0">
      <path class="k1" d="M340 146 C 352 186, 462 182, 474 222" fill="none" stroke="#e08a2e" stroke-width="5" stroke-linecap="round"/>
      <path class="k2" d="M290 326 C 292 362, 352 360, 356 400" fill="none" stroke="#1279b3" stroke-width="5" stroke-linecap="round"/>
    </svg>`, "card term", "stage");
  const L = [1, 2, 3, 4].map((i) => term.querySelector(".l" + i));
  const K1 = term.querySelector(".k1"), K2 = term.querySelector(".k2");
  const LINES = [
    "我今天好累。",
    "你为什么觉得今天好累？",
    "没人理解我。",
    "你说没人理解你，能多说一点吗？",
  ];
  const HL = [ // 拆解时高亮的词：[行, 词, 颜色]
    [0, "好累", "#ffe2bf"], [1, "好累", "#ffe2bf"], [2, "理解我", "#cfeafb"], [3, "理解你", "#cfeafb"],
  ];
  const tagE = el("Weizenbaum · 1966", "tag", "stage", "left:1000px;top:208px");
  const rule = el(`<span class="rk">规则（示意）</span>把「我」换成「你」，<br>再<b>反问</b>一句。`, "card rule", "stage");
  const person = actor(personSVG("#7fa9c4"), 160, 180);
  const think = actor(`<svg class="art" viewBox="0 0 420 260" width="420" height="260" style="left:0;top:0">
      <defs><clipPath id="thk"><path d="M60 150 C 10 150, 10 80, 70 74 C 70 20, 160 10, 190 44 C 220 4, 330 14, 330 70 C 400 70, 410 150, 350 160 C 360 210, 270 222, 240 196 C 210 230, 110 226, 110 186 C 70 196, 40 176, 60 150 Z"/></clipPath></defs>
      <rect class="fill" x="0" y="0" width="420" height="260" fill="#ffd9b8" clip-path="url(#thk)"/>
      <path d="M60 150 C 10 150, 10 80, 70 74 C 70 20, 160 10, 190 44 C 220 4, 330 14, 330 70 C 400 70, 410 150, 350 160 C 360 210, 270 222, 240 196 C 210 230, 110 226, 110 186 C 70 196, 40 176, 60 150 Z" fill="none" stroke="#9a4700" stroke-width="5" stroke-dasharray="14 10"/>
      <circle cx="120" cy="226" r="14" fill="#fff" stroke="#9a4700" stroke-width="4"/><circle cx="96" cy="250" r="8" fill="#fff" stroke="#9a4700" stroke-width="4"/>
    </svg><div class="think" style="left:0;right:0;top:86px">它懂我</div>`, 420, 260);
  const thFill = think.e.querySelector(".fill");
  /* --- E 婴儿图式 --- */
  const baby = actor(headSVG("baby"), 300, 300), adult = actor(headSVG("adult"), 300, 300);
  const guides = el(`<svg class="art" width="1920" height="1080" viewBox="0 0 1920 1080" style="left:0;top:0">
      <circle class="g1" cx="560" cy="400" r="150" fill="none" stroke="#1279b3" stroke-width="4" stroke-dasharray="12 10"/>
      <path class="g2" d="M380 476 H 760" stroke="#e08a2e" stroke-width="4" stroke-dasharray="12 10"/>
      <circle class="g3" cx="476" cy="476" r="34" fill="none" stroke="#e08a2e" stroke-width="5"/>
    </svg>`, "abs", "stage", "left:0;top:0");
  const gd = [".g1", ".g2", ".g3"].map((s) => guides.querySelector(s));
  const bLabs = [["大头", 560, 222], ["大眼", 400, 520], ["眼位低", 800, 476], ["圆脸", 700, 620]].map(([s, x, y]) => el(s, "lab ac", "stage", `left:${x}px;top:${y}px;transform:translate(-50%,-50%);font-size:34px`));
  const tagB = el("婴儿图式 · Lorenz 1943", "tag", "stage", "left:250px;top:150px");
  const babyLab = el("婴儿", "lab s", "stage", "left:530px;top:600px"), adultLab = el("成人", "lab s", "stage", "left:930px;top:600px");
  const CHIBI_EYE = { hx: -12, hy: -78, hr: 160, ex: -83, ey: -24, er: 34 };   // Q 版图上头 / 左眼相对图心的位置（按 440×455 的显示尺寸、从抠图预览量）
  const meter = el(`<svg class="art" viewBox="0 0 420 260" width="420" height="260" style="left:0;top:0">
      <path d="M40 220 A 170 170 0 0 1 380 220" fill="none" stroke="#e2f2fc" stroke-width="34"/>
      <path class="mf" d="M40 220 A 170 170 0 0 1 380 220" fill="none" stroke="#f0a04b" stroke-width="34"/>
      <g class="nd" transform="translate(210 220) rotate(-80)"><path d="M0 0 L0 -150" stroke="#143a5c" stroke-width="8" stroke-linecap="round"/><circle r="16" fill="#143a5c"/></g>
    </svg><div class="lab c" style="left:0;right:0;top:236px;font-size:30px">照顾反应</div>`, "abs", "stage", "left:1290px;top:300px;width:420px;height:300px");
  const mNd = meter.querySelector(".nd"), mF = meter.querySelector(".mf");
  const wB = pic("chibi-q", 440, 455);   // 用户指定的 Q 版鲸鱼娘（抠图）：大头、大眼、圆脸、短四肢
  document.getElementById("stage").appendChild(guides);   // 辅助线要画在 Q 版图之上
  const lamp = el(`<i></i>想照顾`, "lamp", "stage", "left:1330px;top:640px");
  const lampDot = lamp.querySelector("i");
  /* --- F 恐怖谷 --- */
  const CX0 = 330, CY0 = 560, CW = 1260, CH = 330;   // 坐标区：x 0..1 → CX0..CX0+CW；y：亲近感 -0.6..1 → 下..上
  const fy = (u) => { // 森政弘曲线的示意形状
    const base = 0.72 * Math.pow(u, 1.3);
    const dip = -0.92 * Math.exp(-Math.pow((u - 0.86) / 0.055, 2));
    return base + 0.22 * Math.pow(u, 6) + dip;
  };
  const px = (u) => CX0 + u * CW, py = (v) => CY0 - (v + 0.1) * CH * 0.78;
  const curveD = (() => { let d = ""; for (let i = 0; i <= 200; i++) { const u = i / 200; d += (i ? " L" : "M") + px(u).toFixed(1) + " " + py(fy(u)).toFixed(1); } return d; })();
  const chart = el(`<svg class="art" width="1920" height="1080" viewBox="0 0 1920 1080" style="left:0;top:0">
      <path class="vz" d="M${px(0.78)} ${py(0)} ${(() => { let d = ""; for (let i = 0; i <= 40; i++) { const u = 0.78 + i * 0.16 / 40; d += "L" + px(u).toFixed(1) + " " + Math.max(py(fy(u)), py(0)).toFixed(1) + " "; } return d; })()} L${px(0.94)} ${py(0)} Z" fill="rgba(47,95,125,0.22)"/>
      <path d="M${CX0} ${CY0 + 40} H ${CX0 + CW + 40}" stroke="#2f5f7d" stroke-width="4"/>
      <path d="M${CX0} ${CY0 + 40} V ${CY0 - CH - 20}" stroke="#2f5f7d" stroke-width="4"/>
      <path d="M${CX0 + CW + 40} ${CY0 + 40} l-16 -10 v20 Z M${CX0} ${CY0 - CH - 20} l-10 16 h20 Z" fill="#2f5f7d"/>
      <path d="M${CX0} ${py(0)} H ${CX0 + CW}" stroke="#9fb8c9" stroke-width="2" stroke-dasharray="8 8"/>
      <path class="cv" d="${curveD}" fill="none" stroke="#1279b3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`, "abs", "stage", "left:0;top:0");
  const cvP = chart.querySelector(".cv"), vz = chart.querySelector(".vz");
  const axX = el("像人的程度 →", "ax", "stage", `left:${CX0 + CW / 2 - 90}px;top:${CY0 + 40 + 128}px`);
  const axY = el("好感 ↑", "ax", "stage", `left:${CX0 - 40}px;top:${CY0 - CH - 70}px`);
  const tagU = el("恐怖谷 · 森政弘 1970", "tag", "stage", "left:1330px;top:150px");
  const valleyLab = el("恐怖谷", "lab", "stage", `left:${px(0.86) - 170}px;top:${py(-0.35)}px;color:#2f5f7d;font-size:32px;font-weight:800`);
  const U = [0.08, 0.36, 0.64, 0.86, 0.99];
  // 横轴：方块机器人（图标）→ 官方 Logo → 二次元（设定卡头像）→ 几乎是真人（用户的真人 COS 设定卡头像）→ 真人（剪影）
  const icons = [actor(iconSVG("robot"), 140, 140), actor(whaleSVG("wu"), 498, 400),
    pic("head-anime", 124, 172, { card: true, fit: "cover", pad: 6, radius: 14 }), pic("head-cos", 124, 172, { card: true, fit: "cover", pad: 6, radius: 14 }),
    actor(personSVG("#5f8eaa"), 160, 180)];
  const iconScale = [0.8, 0.26, 1, 1, 0.62];
  const cursor = actor(`<div style="width:34px;height:34px;border-radius:50%;background:#f0a04b;border:6px solid #fff;box-shadow:0 0 0 4px #9a4700"></div>`, 34, 34);
  const zone = el(`<span>安全区</span>`, "zone", "stage", `left:${px(0.64) - 100}px;top:${py(fy(0.64)) - 100}px;width:200px;height:${CY0 + 40 - py(fy(0.64)) + 150}px`);
  const uSeal = seal("stage", { x: px(0.64) + 170, y: py(fy(0.64)) - 140, size: 110, text: "推论", rot: -12 });
  /* --- G 三者合一 --- */
  const wG = pic("girl-front", 330, 588);   // 用户的鲸鱼娘全身立绘（抠图）
  const mini3 = slotIcons.map((ic) => actor(`<div class="card" style="position:absolute;inset:0;display:grid;place-items:center">${ic}</div>`, 200, 150));

  const all = [card, ...stk, quote, ...slots, person, think, baby, adult, wB, ...icons, cursor, wG, ...mini3];
  const els = [term, tagE, rule, guides, ...bLabs, tagB, babyLab, adultLab, meter, lamp, chart, axX, axY, tagU, valleyLab, zone];

  return {
    state(t) {
      const on = t > T0 - 0.2 && t < T1 + 0.4;
      if (!on) { all.forEach((a) => a.hide()); els.forEach((e) => vis(e, 0)); qSeal.hide(); uSeal.hide(); return; }

      /* A 长脸 n54–n60（白卡在 n60 金句砸下时退后变淡，n65 起淡出） */
      const aCard = ease(ramp(t, B(53.6), B(1))) * (1 - ease(ramp(t, B(64.5), B(1))));
      const back = ease(ramp(t, B(60), 0.3));
      const cs = (0.85 + 0.15 * ease(ramp(t, B(53.6), B(1.2)))) * (1 - 0.1 * back);
      card.at(aCard * (1 - 0.6 * back), 960, 470 + 4 * Math.sin(t * 1.3), cs);
      // 官方 Logo 淡出，鲸鱼娘从六个落点长出来
      card.sv.style.opacity = (1 - ease(ramp(t, B(56.4), B(3.2)))).toFixed(3);
      const holes = spots.map(([dx, dy], i) => {
        const r = 760 * easeOut(ramp(t, B(56 + i * 0.5), B(2.6)));
        return `radial-gradient(circle ${r.toFixed(1)}px at ${(450 + dx * 0.95).toFixed(0)}px ${(280 + dy * 0.95).toFixed(0)}px, #000 97%, transparent 100%)`;
      }).join(",");
      grown.style.webkitMaskImage = holes; grown.style.maskImage = holes;
      stk.forEach((st, i) => {
        const tLand = B(54 + i * 0.35), tGo = B(56 + i * 0.5) - 0.18;
        const land = easeOutBack(ramp(t, tLand, 0.32), 1.6), go = easeIn(ramp(t, tGo, 0.3));
        const [dx, dy] = spots[i];
        const sx = 960 + dx * cs, sy = 470 + dy * cs;
        // 贴纸缩成一粒「种子」，从那里长出血肉
        const tx = 960 + dx * 0.95 * cs, ty = 470 + dy * 0.95 * cs;
        const ox = lerp(960 + dx * 1.6, sx, land), oy = lerp(470 + dy * 1.6, sy, land);
        st.at(t < tLand ? 0 : clamp(ramp(t, tLand, 0.12)) * (1 - go) * aCard, lerp(ox, tx, go), lerp(oy, ty, go), (1 - 0.8 * go) * cs, (i % 2 ? 6 : -6) * (1 - go));
      });
      world.setNote("示意：叫得越多，样子越具体 · 图为网友二创", win(t, B(55), B(60), 0.3, 0.2));

      /* B 金句 n60–n65 */
      const kq = ramp(t, B(60), 0.28), aq = clamp(kq * 4) * (1 - ease(ramp(t, B(64.6), B(0.8))));
      quote.at(aq, 960, 440, 1.22 - 0.22 * easeOut(kq), 0);
      dash(qc, ease(ramp(t, B(61), B(1.6))));
      if (kq > 0 && kq < 1) world.ring(960, 440, ramp(t, B(60), 0.9), 200, 900, "31,155,214", 10);
      if (aq > 0.01) { qSeal.slap(ramp(t, B(61.5), 0.3)); qSeal.root.style.opacity = (ramp(t, B(61.5), 0.05) * aq).toFixed(3); } else qSeal.hide();
      world.setNote("<b>类比</b> · 圈内流传语，无唯一出处", win(t, B(60.2), B(65), 0.3, 0.3));

      /* C 三张空卡 n65–n72 */
      slots.forEach((sl, i) => {
        const t0 = B(65.5 + i * 0.5), k = popK(t, t0, 0.32);
        const zoom = i === 0 ? ease(ramp(t, B(70.5), B(1.6))) : 0;
        const fade = i === 0 ? ease(ramp(t, B(71.6), 0.3)) : ease(ramp(t, B(70.5), 0.4));
        const x = lerp(500 + i * 460, 700, zoom), y = lerp(470, 456, zoom);
        sl.at(clamp(k * 3) * (1 - fade), x, y + 3 * Math.sin(t * 1.6 + i), (0.6 + 0.4 * k) * (1 + 1.1 * zoom));
      });

      /* D ELIZA n72–n95 */
      const aT = win(t, B(71.6), B(94.5), 0.35, 0.5);
      vis(term, aT, `scale(${(1.05 + 0.07 * ease(ramp(t, B(71.6), 0.4))).toFixed(3)})`);
      vis(tagE, aT * ease(ramp(t, B(72.5), 0.3)));
      if (aT > 0) {
        const tt = [72.5, 74, 76, 78];
        LINES.forEach((s, i) => {
          const f = ramp(t, B(tt[i]), B(i % 2 ? 1.6 : 1.0));
          // 拆解阶段（n80 起）给关键词加底色
          const hl = ease(ramp(t, B(80.5 + (i >> 1) * 1.2), 0.3));
          const chars = Array.from(s), n = Math.round(f * chars.length);
          let shown = chars.slice(0, n).join("");
          const h = HL[i];
          if (hl > 0 && n === chars.length) shown = shown.replace(h[1], `<em style="background:${h[2]};opacity:1">${h[1]}</em>`);
          L[i].innerHTML = shown;
        });
        dash(K1, ease(ramp(t, B(81), B(1.2))));
        dash(K2, ease(ramp(t, B(82.2), B(1.2))));
      }
      vis(rule, win(t, B(81.5), B(85.2), 0.3, 0.35), `translateY(${((1 - ease(ramp(t, B(81.5), 0.3))) * 30).toFixed(1)}px)`);
      world.setNote("示意：ELIZA 按关键词改写句子，<b>不理解内容</b>", win(t, B(80), B(95), 0.3, 0.3));
      // n84 起：右边一个人，思想泡「它懂我」被暖色填满
      const aP = win(t, B(86), B(94.5), 0.5, 0.5);
      person.at(aP * 0.9, 1530, 600, 1.5);
      think.at(aP, 1530, 340, 1);
      thFill.setAttribute("y", (260 * (1 - ease(ramp(t, B(87.5), B(5))))).toFixed(1));

      /* E 婴儿图式 n95–n119 */
      const aH = win(t, B(95), B(118.6), 0.4, 0.5);
      const aAd = aH * (1 - ease(ramp(t, B(110.6), 0.5)));
      baby.at(aH * (1 - ease(ramp(t, B(110.6), 0.5))), 560, 400 + 4 * Math.sin(t * 1.5), 1.25);
      adult.at(aAd, 960, 400 + 4 * Math.sin(t * 1.5 + 1), 1.0);
      vis(babyLab, aAd); vis(adultLab, aAd);
      vis(tagB, aH * ease(ramp(t, B(95.5), 0.3)));
      // 辅助线 + 标签（n96 起半拍一个）
      const aG = aH * (1 - ease(ramp(t, B(110.6), 0.4)));
      vis(guides, aG);
      gd.forEach((g, i) => dash(g, ease(ramp(t, B(96 + i), 0.5))));
      bLabs.forEach((b, i) => { const k = popK(t, B(96 + i * 0.75), 0.3); vis(b, clamp(k * 3) * aG, `translate(-50%,-50%) scale(${(0.6 + 0.4 * k).toFixed(3)})`); });
      // 刻度表：n103 指成人（低）→ n107 指婴儿（高）→ n116 大肥鱼（高）
      const aM = win(t, B(102.6), B(118.6), 0.4, 0.5);
      vis(meter, aM);
      const needle = kf(t, [[B(103.5), -80], [B(104.5), -50], [B(106.5), -50], [B(107.6), 55], [B(110.6), 55], [B(111.5), -40], [B(115.5), -40], [B(116.2), 62]], easeOutBack);
      const wob = 3 * Math.sin(t * 9) * (needle > 40 ? 1 : 0.3);
      mNd.setAttribute("transform", `translate(210 220) rotate(${(needle + wob).toFixed(2)})`);
      mF.style.strokeDasharray = "534"; mF.style.strokeDashoffset = (534 * (1 - (needle + 90) / 180)).toFixed(1);
      // 指向：成人头 / 婴儿头轮流高亮
      if (aAd > 0) { const hiA = win(t, B(103.5), B(107.2), 0.2, 0.2), hiB = win(t, B(107.4), B(110.6), 0.2, 0.2); adult.e.style.filter = hiA > 0 ? `drop-shadow(0 0 ${(18 * hiA).toFixed(1)}px rgba(240,160,75,.9))` : ""; baby.e.style.filter = hiB > 0 ? `drop-shadow(0 0 ${(18 * hiB).toFixed(1)}px rgba(240,160,75,.9))` : ""; }
      // n111 大肥鱼换上来，同一组辅助线套在它身上
      const aW = win(t, B(111), B(118.8), 0.45, 0.4);
      wB.at(aW, 760, 430 + 5 * Math.sin(t * 1.4), 1.0);
      if (aW > 0) {
        vis(guides, Math.max(aG, aW));
        // 辅助线挪到大肥鱼身上（眼 / 圆身）
        const k = ease(ramp(t, B(111.2), 0.6));
        const E = CHIBI_EYE;
        gd[0].setAttribute("cx", lerp(560, 760 + E.hx, k).toFixed(1)); gd[0].setAttribute("cy", lerp(400, 430 + E.hy, k).toFixed(1)); gd[0].setAttribute("r", lerp(150, E.hr, k).toFixed(1));
        gd[2].setAttribute("cx", lerp(476, 760 + E.ex, k).toFixed(1)); gd[2].setAttribute("cy", lerp(476, 430 + E.ey, k).toFixed(1)); gd[2].setAttribute("r", lerp(34, E.er, k).toFixed(1));
        gd[1].style.opacity = (1 - k).toFixed(3);
        gd[0].style.strokeDasharray = "12 10"; gd[2].style.strokeDasharray = "none";   // 半径变了，描边长度不再按原圆算
      } else {
        gd[0].setAttribute("cx", 560); gd[0].setAttribute("cy", 400); gd[0].setAttribute("r", 150);
        gd[2].setAttribute("cx", 476); gd[2].setAttribute("cy", 476); gd[2].setAttribute("r", 34); gd[1].style.opacity = 1;
      }
      const lampOn = ramp(t, B(116), 0.15);
      vis(lamp, win(t, B(111.5), B(118.6), 0.3, 0.4));
      lampDot.style.background = lampOn > 0 ? "#f0a04b" : "#cfdbe3";
      lampDot.style.boxShadow = lampOn > 0 ? `0 0 ${(10 + 14 * world.beatK).toFixed(1)}px 6px rgba(240,160,75,${(0.8 * lampOn).toFixed(2)})` : "none";
      lamp.style.borderColor = lampOn > 0 ? "#e08a2e" : "#9fb8c9";
      if (lampOn > 0 && lampOn < 1) world.ring(1460, 670, ramp(t, B(116), 0.8), 30, 360, "240,160,75", 10);
      world.setNote("<b>机制相通</b>：不是说它是婴儿", win(t, B(111.4), B(119), 0.3, 0.3));

      /* F 恐怖谷 n119–n142 */
      const aC = win(t, B(118.8), B(141.6), 0.4, 0.5);
      vis(chart, aC); vis(axX, aC); vis(axY, aC); vis(tagU, aC * ease(ramp(t, B(119.5), 0.3)));
      // 曲线随拍画出到「二次元」处（n119→n125），n127 继续画进谷，n130 画完
      const draw = kf(t, [[B(119.3), 0], [B(125), 0.66], [B(127), 0.66], [B(129.5), 1]], easeInOut);
      dash(cvP, draw);
      vz.style.opacity = (ease(ramp(t, B(128.6), 0.4))).toFixed(3);
      vis(valleyLab, aC * ease(ramp(t, B(128.8), 0.3)));
      icons.forEach((ic, i) => {
        const k = popK(t, B(119.6 + i * (i < 3 ? 1.6 : 2.6)), 0.3);
        const x = px(U[i]), y = CY0 + 40 + 74;
        ic.at(clamp(k * 3) * aC, x, y + (i === 2 || i === 3 ? 10 : 0), iconScale[i] * (0.6 + 0.4 * k));
      });
      // 光标：沿曲线走
      const cu = kf(t, [[B(119.5), 0.04], [B(125), 0.64], [B(127.2), 0.64], [B(129.2), 0.86], [B(133.8), 0.86], [B(134.8), 0.64]], (x) => easeInOut(x));
      const shake = t > B(129.2) && t < B(133.8) ? 4 * Math.sin(t * 50) * (1 - ramp(t, B(129.2), 1.2)) : 0;
      cursor.at(aC * ease(ramp(t, B(119.5), 0.3)), px(cu) + shake, py(fy(cu)), 1 + 0.15 * world.beatK);
      vis(zone, aC * ease(ramp(t, B(134.6), 0.35)), `scale(${(0.8 + 0.2 * easeOutBack(ramp(t, B(134.6), 0.35))).toFixed(3)})`);
      if (aC > 0.01) { uSeal.slap(ramp(t, B(135.6), 0.3)); uSeal.root.style.opacity = (ramp(t, B(135.6), 0.05) * aC).toFixed(3); } else uSeal.hide();
      world.setNote("示意曲线 · 越像人越亲近，直到「几乎是真人」", win(t, B(119.4), B(128.6), 0.3, 0.3));
      world.setNote("像真人却又不是真人：好感<b>骤跌</b>", win(t, B(128.8), B(134.4), 0.3, 0.3));
      world.setNote("<b>推论</b>：二次元画风的位置，学界仍有讨论", win(t, B(134.6), B(142), 0.3, 0.3));

      /* G 三者合一 n142–n150 */
      const aGw = ease(ramp(t, B(141.8), 0.5));
      const bob = 6 * Math.sin(t * 1.5);
      wG.at(aGw * (1 - ease(ramp(t, T1, 0.3))), 960, 452 + bob, 1.0 + 0.03 * ease(ramp(t, B(145), 0.6)));
      mini3.forEach((m, i) => {
        const t0 = B(142.4 + i * 0.25), tIn = B(143.6 + i * 0.5);
        const k = popK(t, t0, 0.3), go = easeIn(ramp(t, tIn, 0.4));
        const x0 = 520 + i * 440, y0 = 260 + (i === 1 ? -20 : 40);
        m.at(clamp(k * 3) * (1 - go), lerp(x0, 960, go), lerp(y0, 470, go), (0.6 + 0.4 * k) * (1 - 0.8 * go), (i - 1) * 8);
        const kr = ramp(t, tIn + 0.4, 0.9);
        if (kr > 0 && kr < 1) world.ring(960, 470, kr, 120, 560, i === 1 ? "240,160,75" : "31,155,214", 9);
      });
      if (aGw > 0.01) for (let i = 0; i < 8; i++) { const a = i * 0.785 + t * 0.6, r = 300 + 20 * Math.sin(t * 2 + i); world.sparkle(960 + Math.cos(a) * r, 470 + Math.sin(a) * r * 0.62, 10 + 6 * Math.sin(t * 3 + i), aGw * ease(ramp(t, B(145), 0.5)) * (0.5 + 0.5 * Math.sin(t * 4 + i)), i % 2 ? "240,160,75" : "255,255,255"); }
    },
  };
}

/* ================= S4 反转 n150–n210 ================= */
function s4(world) {
  const [T0, T1] = SEC.s4;
  // 鲸鱼娘：设定卡的正面 / 背面（同一画风、同一比例），转身时在两张之间切换
  const wf = pic("girl-sheet-front", 300, 552), wb = pic("girl-sheet-back", 310, 545);
  const w = { at(a, x, y, s, r, sx) { const back = sx < 0; wf.at(back ? 0 : a, x, y, s, r, Math.abs(sx)); wb.at(back ? a : 0, x, y + 3, s, r, Math.abs(sx)); }, hide() { wf.hide(); wb.hide(); }, set(f) { wf.e.style.filter = wb.e.style.filter = f; } };
  const SAY = ["本鲸饿了，回家吃白饭", "摸鱼中，勿扰", "我只是一只大肥鱼"];
  const SP = [[560, 250], [1380, 300], [1330, 680]];
  const says = SAY.map((s) => {
    const a = el(s, "say", "stage", "left:0;top:0;clip-path:inset(0 50% 0 0)");
    const b = el(s, "say", "stage", "left:0;top:0;clip-path:inset(0 0 0 50%)");
    return [a, b];
  });
  // 撕开之后：还是开场那张没有脸的官方 Logo 白卡（首尾呼应）
  const lc = logoCard();
  // 三因素
  const title = el("为什么我们会当真？", "big", "stage", "top:182px;font-size:56px");
  const tagP = el("拟人化三因素 · Epley 等 2007", "tag", "stage", "left:1360px;top:260px");
  const EPT = ["人的模板", "更好解释", "渴望陪伴"];
  const epArt = [
    `<svg viewBox="0 0 300 240" width="300" height="240" style="position:absolute;left:70px;top:76px">
      <path class="blob" d="M150 40 C 220 30, 250 110, 220 170 C 190 230, 90 220, 70 160 C 50 100, 90 50, 150 40 Z" fill="#e2f2fc" stroke="#1279b3" stroke-width="5"/>
      <text class="qm" x="150" y="150" text-anchor="middle" font-family="NotoSC" font-weight="900" font-size="90" fill="#1279b3">?</text>
      <g class="stencil"><circle cx="150" cy="86" r="40" fill="none" stroke="#9a4700" stroke-width="7" stroke-dasharray="14 8"/><path d="M70 220 Q70 140 150 140 Q230 140 230 220" fill="none" stroke="#9a4700" stroke-width="7" stroke-dasharray="14 8"/></g>
    </svg>`,
    `<div class="tangle" style="position:absolute;left:40px;top:90px;width:360px;height:200px;font:700 30px/1.25 NotoSC;color:#2f5f7d;white-space:pre">θ=0.73  p=0.12\n  W·x+b  softmax(\n Σ logits  τ=0.7\n  ∇L  top-k=40</div>
     <div class="likes" style="position:absolute;left:0;right:0;top:150px;text-align:center;font:900 54px NotoSC;color:#9a4700">它喜欢</div>`,
    `<svg viewBox="0 0 340 240" width="340" height="240" style="position:absolute;left:50px;top:80px">
      <circle cx="80" cy="70" r="30" fill="#2f5f7d"/><path d="M30 200 Q30 112 80 112 Q130 112 130 200 Z" fill="#2f5f7d"/>
      <path d="M200 120 H290 V200 M200 120 V200 M200 160 H290 M290 60 V120" fill="none" stroke="#143a5c" stroke-width="7" stroke-linecap="round"/>
      <g class="ghost" transform="translate(245 120) scale(0.24)"><path d="" class="gp" fill="none" stroke="#1279b3" stroke-width="16" stroke-dasharray="40 26"/></g>
    </svg>`,
  ];
  const eps = EPT.map((s, i) => actor(`<div class="card" style="position:absolute;inset:0"></div><div class="en">${i + 1}</div><div class="ec" style="position:absolute;inset:0">${epArt[i]}<div class="et">${s}</div></div>`, 440, 420, "ep"));
  const blob = eps[0].e.querySelector(".blob"), qm = eps[0].e.querySelector(".qm"), sten = eps[0].e.querySelector(".stencil");
  const tangle = eps[1].e.querySelector(".tangle"), likes = eps[1].e.querySelector(".likes");
  const ghost = eps[2].e.querySelector(".ghost");
  ghost.querySelector(".gp").setAttribute("d", loadLogo());
  ghost.setAttribute("transform", "translate(196 70) scale(0.24)");
  // 「你」：一个半透明的人形剪影；n200 胸口亮起一团暖光，Q 版的她在光里（不用红色爱心）
  const YOU = { x: 960, y: 540 }, CHEST = [960, 722];
  const you = actor(`<svg class="art" viewBox="0 0 160 180" width="672" height="756" style="left:0;top:0">
      <defs><linearGradient id="yg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="1" stop-color="#d4ebf8" stop-opacity="0.75"/></linearGradient></defs>
      <circle cx="80" cy="56" r="38" fill="url(#yg)" stroke="#7cc0e6" stroke-width="1.4"/>
      <path d="M8 180 Q8 104 80 104 Q152 104 152 180" fill="url(#yg)" stroke="#7cc0e6" stroke-width="1.4"/>
    </svg>`, 672, 756);
  // 胸口的暖光：DOM 层，夹在剪影与 Q 版小人之间（画在前层画布上会把小人洗白）
  const glow = actor(`<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,250,236,.98) 0%,rgba(255,220,178,.85) 32%,rgba(255,196,156,.38) 62%,rgba(255,196,156,0) 100%)"></div>`, 640, 640);
  const wIn = pic("chibi-q", 250, 258);   // 光里的 Q 版鲸鱼娘（用户指定的 Q 版形象）
  const flow = (() => { const r = rng(77), o = []; for (let i = 0; i < 46; i++) o.push({ x: (r() - 0.5) * 260, y: (r() - 0.5) * 420, d: r() * 0.5, s: 4 + r() * 8 }); return o; })();
  return {
    state(t) {
      const on = t > T0 - 0.05 && t < T1 + 0.5;
      if (!on) { [w, lc, ...eps, you, glow, wIn].forEach((a) => a.hide()); says.flat().forEach((e) => vis(e, 0)); [title, tagP].forEach((e) => vis(e, 0)); return; }
      /* 鲸鱼娘：n150 居中说话 → n155 撕开时化开，原地露出那张没脸的 Logo 卡 → Logo 卡退到左上
         → n187.5 回到中央、重新「长」成她 → 背过身、褪色 → 往右退成影子 → n200 化成蓝点流进「你」的胸口 */
      const [x, y, s] = kf(t, [[B(188.5), [960, 462, 1.0]], [B(193), [960, 462, 1.0]], [B(196), [1500, 450, 0.8]]]);
      const dissolve = ease(ramp(t, B(155), 0.5)), reform = ease(ramp(t, B(188.5), 0.6));
      const early = t < B(187);
      const aGirl = early ? 1 - dissolve : reform;
      const turn = easeInOut(ramp(t, B(189.5), B(1.6)));     // 1 → -1：背过身
      const sx = Math.cos(turn * Math.PI);
      const fadeBody = ease(ramp(t, B(191.5), B(5)));
      const gone = ease(ramp(t, B(200), 0.6));
      w.at(aGirl * (1 - gone), x, y + 5 * Math.sin(t * 1.4), s * (1 + (early ? 0.04 * dissolve : 0)), 0, Math.abs(sx) < 0.04 ? 0.04 : sx);
      w.set(early && dissolve > 0 ? `blur(${(6 * dissolve).toFixed(2)}px) brightness(${(1 + 0.8 * dissolve).toFixed(3)})`
        : fadeBody > 0 ? `grayscale(${fadeBody.toFixed(3)}) opacity(${(1 - 0.72 * fadeBody).toFixed(3)}) blur(${(1.5 * fadeBody).toFixed(2)}px)` : "");
      /* 台词泡：n150 起冒出，n155 撕开 */
      const tear = ramp(t, B(155), 0.7);
      says.forEach(([a, b], i) => {
        const k = popK(t, B(150 + i * 0.5), 0.3), [px, py] = SP[i];
        const op = clamp(k * 3) * (1 - ease(ramp(t, B(155) + 0.5, 0.3)));
        const d = easeOut(tear) * 70, fall = easeIn(tear) * 120, rot = easeOut(tear) * 14;
        const base = `translate(${px - 220}px,${py - 40}px) scale(${(0.6 + 0.4 * k).toFixed(3)})`;
        vis(a, op, `${base} translate(${-d}px,${fall}px) rotate(${-rot}deg)`);
        vis(b, op, `${base} translate(${d}px,${fall}px) rotate(${rot}deg)`);
      });
      if (tear > 0 && tear < 1) world.ring(960, 470, tear, 120, 760, "31,155,214", 10);
      // 没脸的 Logo 卡：n155.2 出现在她原来的位置 → n161.5 退到左上 → n187 回中央，n188.5 起化回她
      const kl = easeOutBack(ramp(t, B(155.2), 0.45), 1.4);
      const [lx, ly, ls] = kf(t, [[B(161.5), [960, 470, 1.0]], [B(162.5), [190, 236, 0.3]], [B(187), [190, 236, 0.3]], [B(188.5), [960, 470, 0.95]]]);
      lc.at(clamp(kl * 2) * (1 - ease(ramp(t, B(188.5), 0.5))), lx, ly, ls * (0.85 + 0.15 * kl));
      world.setNote("梗图台词为<b>网友创作</b>", win(t, B(155.3), B(161.5), 0.3, 0.3));
      /* 三因素 n162–n188 */
      const aE = win(t, B(162), B(188), 0.4, 0.6);
      vis(title, aE, `translateY(${((1 - ease(ramp(t, B(162), 0.4))) * -20).toFixed(1)}px)`);
      vis(tagP, aE * ease(ramp(t, B(162.6), 0.3)));
      eps.forEach((ep, i) => {
        const k = popK(t, B(162.4 + i * 0.4), 0.34);
        const flip = ease(ramp(t, B([164, 172, 180][i]) - 0.25, 0.5));     // 未翻：只露数字
        const hot = win(t, B([164, 172, 180][i]), B([172, 180, 188][i]), 0.3, 0.3);
        ep.at(clamp(k * 3) * aE * (0.5 + 0.5 * flip), 520 + i * 440, 530 - 16 * hot, (0.7 + 0.3 * k) * (1 + 0.06 * hot), 0);
        ep.e.style.filter = hot > 0 ? `drop-shadow(0 0 ${(16 * hot).toFixed(1)}px rgba(31,155,214,.55))` : "";
        ep.e.querySelector(".ec").style.opacity = flip.toFixed(3);
      });
      const st = ease(ramp(t, B(165), B(2)));
      sten.setAttribute("transform", `translate(0 ${(-120 * (1 - st)).toFixed(1)})`); sten.style.opacity = st.toFixed(3);
      blob.setAttribute("fill", st > 0.95 ? "#ffe2bf" : "#e2f2fc"); qm.style.opacity = (1 - ease(ramp(t, B(166.6), 0.3))).toFixed(3);
      const tg = ease(ramp(t, B(173), B(2)));
      tangle.style.transform = `scale(${(1 - 0.8 * tg).toFixed(3)})`; tangle.style.opacity = (1 - tg).toFixed(3); tangle.style.transformOrigin = "50% 50%";
      likes.style.opacity = ease(ramp(t, B(174.4), 0.4)).toFixed(3); likes.style.transform = `scale(${(0.7 + 0.3 * easeOutBack(ramp(t, B(174.4), 0.4))).toFixed(3)})`;
      ghost.style.opacity = (ease(ramp(t, B(181), B(2))) * (0.7 + 0.3 * world.beatK)).toFixed(3);
      /* n194 「你」浮现（但那些喜欢，并没有落空——）；n200 全片重击：胸口亮起暖光，Q 版的她在光里 */
      world.bubA = 1 - 0.6 * win(t, B(190), B(200.5), B(4), 0.4);
      const outK = 1 - ease(ramp(t, T1 - 0.1, 0.5));
      const aYou = ease(ramp(t, B(194), B(2.4))) * outK;
      const kh = ramp(t, B(200), 0.6);
      const beatP = t > B(200.5) ? pulse(((t - B(200)) % 0.53116 + 0.53116) % 0.53116, 0, 0.24) : 0;
      you.at(aYou * 0.95, YOU.x, YOU.y + 4 * Math.sin(t * 0.9), 1 + 0.01 * beatP);
      // 蓝点：从退到右边的背影，流进「你」的胸口
      const fl = ramp(t, B(199.2), B(2.2));
      if (fl > 0 && fl < 1) flow.forEach((p) => { const k = easeIn(clamp((fl - p.d) / 0.5)); if (k <= 0 || k >= 1) return; world.fx.fillStyle = `rgba(50,90,190,${(0.9 * (1 - k * 0.5)).toFixed(2)})`; world.fx.beginPath(); world.fx.arc(lerp(1500 + p.x, CHEST[0], k), lerp(450 + p.y, CHEST[1], k), p.s * (1 - 0.6 * k), 0, 6.2832); world.fx.fill(); });
      glow.at(easeOut(kh) * outK * (0.85 + 0.15 * beatP), CHEST[0], CHEST[1], (0.35 + 0.65 * easeOutBack(kh, 1.6)) * (1 + 0.04 * beatP));
      if (kh > 0 && kh < 1) { world.ring(CHEST[0], CHEST[1], ramp(t, B(200), 1.0), 100, 1100, "255,190,140", 16); world.ring(CHEST[0], CHEST[1], ramp(t, B(200) + 0.12, 1.0), 80, 900, "31,155,214", 10); }
      wIn.at(ease(ramp(t, B(200.4), 0.5)) * outK, CHEST[0], CHEST[1] - 4 + 3 * Math.sin(t * 2), (0.85 + 0.15 * easeOutBack(ramp(t, B(200.4), 0.5))) * (1 + 0.03 * beatP));
    },
  };
}

/* ================= S5 现实 n210–n241 ================= */
function s5(world) {
  const [T0, T1] = SEC.s5;
  const PX = [330, 645, 960, 1275, 1590];
  const people = PX.map(() => actor(personSVG("#5f8eaa"), 160, 180));
  // 每个人胸口的一团暖光（接 S4 的「你」），光里是问号
  const hearts = PX.map(() => actor(`<div style="position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,250,236,.98) 0%,rgba(255,220,178,.9) 38%,rgba(255,196,156,.35) 70%,rgba(255,196,156,0) 100%)"></div><div class="hq" style="position:absolute;inset:0;display:grid;place-items:center;font:900 64px NotoSC;color:#9a4700">?</div>`, 200, 200));
  // 两团光放大成圆形光框：左边是设定卡上的鲸鱼娘，右边是网友画的 D 老师（原图按圆形裁切，外圈一圈暖光）
  const big = [["girl-portrait", "50% 6%"], ["dteacher", "50% 4%"]].map(([n, pos]) => actor(
    `<div style="position:absolute;inset:-40px;border-radius:50%;background:radial-gradient(circle,rgba(255,220,178,.75) 55%,rgba(255,196,156,0) 72%)"></div>
     <div style="position:absolute;inset:0;border-radius:50%;overflow:hidden;background:#fff4ea;border:6px solid #fff;box-shadow:0 0 0 3px #f0b48a,0 18px 50px rgba(240,160,100,.35)"><img src="assets/img/${n}.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${pos}"></div>`, 440, 440));
  const names = ["鲸鱼娘", "D 老师"].map((s) => el(s, "lab c", "stage", "left:0;top:0;width:300px;font-size:36px"));
  const banner = el("请选择你的 DeepSeek 形象", "banner", "stage", "left:960px;top:176px");
  const canon = [0, 1].map(() => el("正统！", "canon", "stage", "left:0;top:0"));
  const offc = actor(`<div class="card dots" style="position:absolute;inset:0"></div><div style="position:absolute;left:50%;top:50%;width:498px;height:400px;transform:translate(-50%,-50%) scale(0.36)">${whaleSVG("o5")}</div>`, 250, 170);
  const stamp = el("从没指定过形象", "stamp", "stage", "left:0;top:0");
  const arrows = el(`<svg class="art" width="1920" height="1080" viewBox="0 0 1920 1080" style="left:0;top:0">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="#1279b3"/></marker></defs>
      ${[[250, 630, 470, 500], [450, 630, 540, 570], [1470, 630, 1380, 570], [1670, 630, 1450, 500]].map(([a, b, c, d], i) => `<path class="ar" d="M${a} ${b} Q ${(a + c) / 2 + (i < 2 ? -40 : 40)} ${(b + d) / 2 - 60} ${c} ${d}" fill="none" stroke="#1279b3" stroke-width="6" stroke-linecap="round" marker-end="url(#ah)"/>`).join("")}
    </svg>`, "abs", "stage", "left:0;top:0");
  const ars = [...arrows.querySelectorAll(".ar")];
  const tagH = el("准社会关系 · Horton & Wohl 1956", "tag", "stage", "left:50%;top:150px;transform:translateX(-50%)");

  return {
    state(t) {
      const on = t > T0 - 0.05 && t < T1 + 0.6;
      if (!on) { [...people, ...hearts, ...big, offc].forEach((a) => a.hide()); [...names, banner, ...canon, stamp, arrows, tagH].forEach((e) => vis(e, 0)); return; }
      const outAll = ease(ramp(t, T1, 0.5));
      /* n210 心分成五颗，飘到观众头顶 */
      const sp = easeInOut(ramp(t, B(210), B(2)));
      const aPeo = (win(t, B(210.4), B(218.5), 0.4, 0.4) + win(t, B(233.6), T1 + 0.4, 0.4, 0.4)) * (1 - outAll);
      const PX2 = [250, 450, 960, 1470, 1670];   // 第二次出现（准社会关系）：站到两颗心的外侧，不压名字
      people.forEach((p, i) => {
        const late = t > B(226);
        p.at(aPeo * (late && i === 2 ? 0 : 1), late ? PX2[i] : PX[i], 700 + 3 * Math.sin(t * 1.3 + i), 0.9);
      });
      hearts.forEach((h, i) => {
        const x = lerp(960, PX[i], sp), y = lerp(722, 742, sp);   // 从「你」的胸口分出去，落到每个人的胸口
        const a = clamp(ramp(t, B(210), 0.1)) * (1 - ease(ramp(t, B(218), 0.4)));
        h.at(a, x, y + 5 * Math.sin(t * 2 + i), lerp(2.2, 0.62, sp) * (1 + 0.05 * world.beatK));
        h.e.querySelector(".hq").style.opacity = ease(ramp(t, B(211), 0.3)).toFixed(3);
      });
      if (ramp(t, B(210), 0.6) < 1) world.ring(960, 722, ramp(t, B(210), 0.6), 60, 500, "255,190,140", 8);
      /* n218 两颗大心：鲸鱼娘 / D 老师 */
      const kb = easeOutBack(ramp(t, B(218), 0.5), 1.4);
      const aB = clamp(ramp(t, B(218), 0.15) * 3) * (1 - outAll);
      const sep = 1 - 0.06 * ease(ramp(t, B(226), 0.4));
      const HX = [600, 1320], HY = 470;
      big.forEach((b, i) => b.at(aB, lerp(960, HX[i], kb), HY, 0.5 + 0.5 * kb));
      names.forEach((n, i) => vis(n, aB * ease(ramp(t, B(219), 0.3)), `translate(${HX[i] - 150}px,${HY + 205}px)`));
      vis(banner, win(t, B(219), B(228.5), 0.3, 0.4), `translateX(-50%) scale(${(0.8 + 0.2 * easeOutBack(ramp(t, B(219), 0.35))).toFixed(3)})`);
      world.setNote("两个形象均为网友创作，非官方形象", win(t, B(218.4), B(226), 0.3, 0.3));
      /* n226 「正统！」对冲；n229 官方白卡落下，n230 盖章 */
      canon.forEach((c, i) => {
        const k = popK(t, B(226 + i * 0.5), 0.3);
        vis(c, clamp(k * 3) * win(t, B(226), B(233.6), 0.05, 0.4), `translate(${[440, 1270][i]}px,${[230, 230][i]}px) rotate(${i ? 8 : -8}deg) scale(${(0.6 + 0.4 * k).toFixed(3)})`);
      });
      for (let i = 0; i < 6; i++) { const k = ramp(t, B(227) + i * 0.08, 0.5); if (k > 0 && k < 1) world.sparkle(960 + (i - 2.5) * 22, 330 + Math.sin(i * 2) * 40, 22 * (1 - k), 1 - k, "240,160,75"); }
      const kd = easeOutBack(ramp(t, B(229), 0.4), 1.3);
      offc.at(clamp(ramp(t, B(229), 0.1) * 3) * win(t, B(229), B(233.8), 0.05, 0.4), 960, lerp(140, 520, kd), 1 + 0.02 * world.beatK);
      const ks = ramp(t, B(230), 0.25);
      vis(stamp, clamp(ks * 4) * win(t, B(230), B(233.8), 0.05, 0.4), `translate(${960 - 150}px,${640}px) rotate(-6deg) scale(${(1.6 - 0.6 * easeOut(ks)).toFixed(3)})`);
      world.setNote("「正统之争」：官方<b>从未指定</b>过拟人形象", win(t, B(229.5), B(234), 0.3, 0.3));
      /* n234 单向箭头 */
      vis(arrows, win(t, B(234), T1 + 0.4, 0.2, 0.4) * (1 - outAll));
      ars.forEach((a, i) => dash(a, ease(ramp(t, B(234.3 + i * 0.5), 0.6))));
      vis(tagH, win(t, B(234.6), T1 + 0.3, 0.3, 0.4));
      world.setNote("隔着距离的亲密：<b>只有一方在投入</b>", win(t, B(235), T1 + 0.3, 0.3, 0.3));
    },
  };
}

/* ================= S6 回响 n241–n263.6 ================= */
function s6(world) {
  const [T0, T1] = SEC.s6;
  // 开场那张白卡（同一版式），现在里面是长出来的鲸鱼娘（设定卡半身像）
  const card = pic("girl-portrait", 760, 480, { card: true, fit: "cover", pos: "50% 9%", radius: 26 });
  card.e.querySelector(".card").classList.add("dots");
  card.img.style.borderRadius = "26px";
  // 问句放在 HUD 层（在花的前层画布之上），读得清
  const q1 = el("如果有一天，DeepSeek 倒闭、模型下架——", "big", "hud", "top:770px;font-size:56px");
  const q2 = el("你会怎么和她告别呢？", "big", "hud", "top:572px;font-size:124px;letter-spacing:.04em;text-shadow:0 0 30px #fff,0 0 12px #fff,0 0 4px #fff");
  // 最后一句：她的祝福，手写体大字，在暖光里
  const last = el("去拥抱，属于你的明天吧。", "big", "hud", "top:520px;font-family:WenKai,serif;font-weight:400;font-size:104px;letter-spacing:.08em;color:#0a6499;-webkit-text-stroke:1.2px #0a6499;text-shadow:0 0 34px #fff,0 0 14px #fff,0 0 4px #fff");
  // 「忘了这些梗」：开场那几张称呼贴纸回来，一张张散掉
  const WORDS = ["闺女", "喂白饭", "大肥鱼", "催起床", "摸鱼", "本鲸"];
  const WS = [[-450, -170, -8], [430, -190, 7], [-500, 60, 6], [490, 30, -6], [-380, 230, -5], [400, 230, 8]];
  const stk = WORDS.map((w, i) => actor(`<div class="sticker${i % 3 === 1 ? " or" : ""}" style="position:static;display:inline-block">${w}</div>`, 220, 90, "", "stage", "display:flex;align-items:center;justify-content:center"));
  // 结尾的暖光：从画面下方升起的晨光（DOM 层，在卡片后面）
  const dawn = el("", "abs", "stage", "left:-200px;top:0;width:2320px;height:1080px;background:radial-gradient(70% 90% at 50% 120%,rgba(255,244,222,1) 0%,rgba(255,226,186,.9) 35%,rgba(255,214,190,.45) 62%,rgba(255,214,190,0) 85%)");
  document.getElementById("stage").insertBefore(dawn, card.e);
  // 花：A 组沿白卡下沿（独白时一拍一朵，慢慢开），B 组铺满全屏（最后一句起越开越快）
  const FA = (() => { const r = rng(606), o = []; for (let i = 0; i < 22; i++) o.push({ x: 600 + r() * 720, y: 700 + r() * 40 - (i % 3) * 8, s: 26 + r() * 22, t: 256 + i * 1.5, rot: r() * 6.28, c: Math.floor(r() * 4) }); return o; })();
  const FB = (() => { const r = rng(909), o = []; for (let i = 0; i < 80; i++) { const k = i / 80; o.push({ x: r() * 1920, y: 120 + r() * 960, s: 40 + r() * 52, t: 290.5 + 8.5 * Math.pow(k, 0.7), rot: r() * 6.28, c: Math.floor(r() * 4) }); } return o; })();
  const COL = [["#ffd1d6", "#f59aa3"], ["#ffffff", "#c6e3f5"], ["#ffe0bf", "#f0a04b"], ["#d7efff", "#7cc0e6"]];
  function flower(fx, f, k, t) {
    if (k <= 0) return;
    const s = f.s * easeOutBack(clamp(k), 1.8), [c0, c1] = COL[f.c];
    fx.save(); fx.translate(f.x, f.y); fx.rotate(f.rot + 0.15 * Math.sin(t * 1.2 + f.x));
    for (let i = 0; i < 5; i++) { fx.rotate(1.2566); fx.fillStyle = c0; fx.strokeStyle = c1; fx.lineWidth = Math.max(1.5, s * 0.06); fx.beginPath(); fx.ellipse(0, -s * 0.55, s * 0.36, s * 0.55, 0, 0, 6.2832); fx.fill(); fx.stroke(); }
    fx.fillStyle = "#f0a04b"; fx.beginPath(); fx.arc(0, 0, s * 0.22, 0, 6.2832); fx.fill();
    fx.fillStyle = "#fff6e0"; fx.beginPath(); fx.arc(-s * 0.06, -s * 0.06, s * 0.08, 0, 6.2832); fx.fill();
    fx.restore();
  }
  return {
    state(t) {
      const on = t > T0 - 0.1;
      if (!on) { card.hide(); stk.forEach((s) => s.hide()); [q1, q2, last, dawn].forEach((e) => vis(e, 0)); return; }
      /* 白卡：n241 回来 → n247.5 上移给问句让位 → n254 回到中央（独白开始）
         → n260「影子」：画面变淡 → n267「碰不到你的现实」：往上飘远 → n291「去拥抱明天」：化进晨光 */
      const kin = easeOutBack(ramp(t, B(241), 0.6), 1.3);
      const [cy, cs] = kf(t, [[B(247.5), [450, 1.0]], [B(248.8), [310, 0.88]], [B(253.6), [310, 0.88]], [B(255), [430, 1.0]], [B(267), [430, 1.0]], [B(274), [372, 0.84]], [B(290), [330, 0.72]], [B(293), [300, 0.64]]]);
      const shadow = ease(ramp(t, B(260), B(5)));
      const intoLight = ease(ramp(t, B(291), B(3)));
      const s = (0.85 + 0.15 * kin) * cs;
      card.at(clamp(kin * 2) * (1 - intoLight), 960, cy + 5 * Math.sin(t * 1.3), s);
      card.e.style.filter = shadow > 0 ? `grayscale(${(0.45 * shadow).toFixed(3)}) opacity(${(1 - 0.35 * shadow).toFixed(3)}) blur(${(1.2 * ease(ramp(t, B(267), B(6)))).toFixed(2)}px) brightness(${(1 + 0.6 * intoLight).toFixed(3)})` : "";
      // 问句
      const k1 = ease(ramp(t, B(242.2), 0.45));
      vis(q1, k1 * (1 - ease(ramp(t, B(247.6), 0.35))), `translateY(${((1 - k1) * 24).toFixed(1)}px)`);
      const k2 = ramp(t, B(248), 0.3);
      vis(q2, clamp(k2 * 4) * (1 - ease(ramp(t, B(253.4), 0.5))), `scale(${(1.35 - 0.35 * easeOut(k2) + 0.02 * world.beatK).toFixed(3)})`);
      if (k2 > 0 && k2 < 1) world.ring(960, 650, ramp(t, B(248), 0.9), 200, 1300, "240,160,120", 18);
      // 「忘了这些梗，忘了我」：n274 称呼贴纸围回来，n276 起一张张散掉
      stk.forEach((st, i) => {
        const tIn = B(274 + i * 0.25), tOut = B(276.5 + i * 0.75);
        const kIn = easeOutBack(ramp(t, tIn, 0.35), 1.5), kOut = ease(ramp(t, tOut, 1.1));
        const [dx, dy, rr] = WS[i];
        st.at(t < tIn ? 0 : clamp(kIn * 3) * (1 - kOut), 960 + dx * cs + dx * 0.25 * kOut, cy + dy * cs - 60 * kOut, (0.7 + 0.3 * kIn) * cs, rr + 20 * kOut * (i % 2 ? 1 : -1));
        st.e.style.filter = kOut > 0 ? `blur(${(4 * kOut).toFixed(2)}px)` : "";
      });
      // 花
      for (const f of FA) flower(world.fx, { ...f, x: 960 + (f.x - 960) * s, y: cy + (f.y - 450) * s }, ramp(t, B(f.t), 0.6) * (1 - intoLight * 0.6), t);
      for (const f of FB) flower(world.ctx, f, ramp(t, B(f.t), 0.45), t);     // 满屏的花在卡片后面
      world.petals(t, ramp(t, B(250), B(40)), 0.95, B(241));
      for (let i = 0; i < 10; i++) { const a = i * 0.628 + t * 0.5; world.sparkle(960 + Math.cos(a) * 470 * s, cy + Math.sin(a) * 280 * s, 9 + 5 * Math.sin(t * 3 + i), 0.7 * ease(ramp(t, B(243), 1)) * (1 - shadow * 0.6) * (0.5 + 0.5 * Math.sin(t * 4 + i)), i % 2 ? "240,160,75" : "255,255,255"); }
      // 最后一句：晨光从下面升起，手写大字「去拥抱，属于你的明天吧。」，一路亮到最后一闪
      const kd = ease(ramp(t, B(290.5), B(4)));
      vis(dawn, kd, `translateY(${((1 - kd) * 220).toFixed(1)}px) scale(${(1 + 0.06 * world.beatK * kd).toFixed(3)})`);
      const kl = ramp(t, B(291), 0.6);
      vis(last, ease(kl), `translateY(${((1 - easeOut(kl)) * 30).toFixed(1)}px) scale(${(1 + 0.04 * ease(ramp(t, B(294), B(6)))).toFixed(3)})`);
      if (kl > 0 && kl < 1) world.ring(960, 600, ramp(t, B(291), 1.2), 160, 1300, "255,200,150", 16);
      world.bubA = 1 + 0.5 * ease(ramp(t, B(291), B(4)));
      // 最后 0.4 s 白闪，硬切
      world.flash(ease(ramp(t, T1 - 0.4, 0.3)));
    },
  };
}

export function sections(world) {
  return [s1(world), s2(world), s3(world), s4(world), s5(world), s6(world)];
}
