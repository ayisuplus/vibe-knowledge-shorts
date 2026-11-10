// S3 出身 · 28.49–43.38：回答「为什么」的第一层——它生来就是给人直接读的
// 28.49 （重音）2004 年 Daring Fireball 的 Markdown 页面截图飞进来，「2004」大字砸下
// 31.95 截图上「By JOHN GRUBER」和「Markdown 1.0.1 — 17 Dec 2004」被圈出来
// 33.0  设计目标那句（publishable as-is, as plain text）被记号笔划出来
// 33.68 （重音）截图退开；同一篇小文章左右并排：左边 Markdown 原文，右边渲染后
// 36.21 两半靠拢、重叠：原文的字淡掉，只剩暖橙色的符号浮在渲染结果的左边——几乎严丝合缝
// 38.34 （乐句高点）整屏大字「人能直接读，机器也能直接读」
// 40.46 背后一页页 Markdown 文档翻过，几个暖橙的 # - ** 慢慢往上飘
// 42.59 出处
import { clamp, lerp, ramp, ease, easeOut, easeInOut, easeOutBack, pulse, el, show } from "./lib.js";

// Daring Fireball 截图里的几处（CSS px，截图 1200 宽）
const GR = { by: [255, 186, 152, 30], ver: [455, 368, 258, 30], goal: [[455, 707, 440, 26], [455, 728, 400, 26], [455, 750, 470, 26]], ad: [225, 545, 200, 165] };
const WIN = { x: 200, y: 150, w: 760, h: 700 }; // 卡片里露出的那一块

// 小文章：[原文前缀, 原文正文, 渲染类型]。正文里的 ⟪…⟫ 是加粗（原文显示 **…**）
const NOTE = [
  ["#", "我的周末", "h1"],
  ["", "今天去了 ⟪西湖⟫，人超多。", "p"],
  ["-", "断桥", "li"],
  ["-", "雷峰塔", "li"],
  [">", "下次一定早点去。", "q"],
];
const raw = (s) => s.replace(/⟪(.*?)⟫/g, '<b class="sym">**</b>$1<b class="sym">**</b>');
const ren = (s) => s.replace(/⟪(.*?)⟫/g, '<i class="gap">**</i><b>$1</b><i class="gap">**</i>');

// 翻过的文档页（都是真实的 Markdown 文档截图）
const PAGES = ["gh-superpowers-skill-rendered", "gh-react-claude-raw", "gh-vscode-agents-raw", "gh-anthropic-skills", "gh-superpowers-skill-raw"];
const GLYPHS = [["#", 260, 110], ["-", 520, 70], ["**", 1460, 96], ["#", 1680, 80], [">", 840, 64], ["-", 1250, 120], ["**", 380, 60], ["#", 1080, 90]];

export function build() {
  // ---- 2004 截图 ----
  const s = 800 / WIN.w;
  const gr = el(`<img src="assets/img/gruber-markdown.jpg"><div class="patch"></div><div class="gbox by"></div><div class="gbox ver"></div>${GR.goal.map(() => '<div class="gmark"></div>').join("")}`, "gruber");
  const grImg = gr.querySelector("img");
  Object.assign(gr.style, { width: WIN.w * s + "px", height: WIN.h * s + "px" });
  Object.assign(grImg.style, { width: 1200 * s + "px", transform: `translate(${-WIN.x * s}px, ${-WIN.y * s}px)` });
  const place = (e, [x, y, w, h]) => Object.assign(e.style, { left: (x - WIN.x) * s + "px", top: (y - WIN.y) * s + "px", width: w * s + "px", height: h * s + "px" });
  place(gr.querySelector(".patch"), GR.ad);   // 盖住左栏的广告位（紫色，也和本片无关）
  const byBox = gr.querySelector(".by"), verBox = gr.querySelector(".ver");
  place(byBox, GR.by); place(verBox, GR.ver);
  const gmarks = [...gr.querySelectorAll(".gmark")];
  gmarks.forEach((m, i) => place(m, GR.goal[i]));
  const year = el("2004", "year", "hud");
  const who = el(`John Gruber`, "who", "hud");

  // ---- 原文 / 渲染 ----
  const rawCard = el(`<div class="lbl">Markdown 原文</div>${NOTE.map(([p, tx, k]) => `<div class="row r-${k}">${p ? `<b class="sym pre">${p}</b><span class="tx">&nbsp;${raw(tx)}</span>` : `<span class="tx">${raw(tx)}</span>`}</div>`).join("")}`, "note raw");
  const renCard = el(`<div class="lbl">渲染后</div>${NOTE.map(([, tx, k]) => `<div class="row r-${k}"><span class="tx">${ren(tx)}</span></div>`).join("")}`, "note ren");
  rawCard.style.zIndex = 3; renCard.style.zIndex = 2;
  // 两张卡重叠、大字压在虚化的卡上，都是有意的
  for (const e of [rawCard, renCard]) e.setAttribute("data-layout-allow-overlap", "");
  const big1 = el("不渲染，也能直接读", "s3big top", "hud");
  const rawTx = [...rawCard.querySelectorAll(".tx")], rawSyms = [...rawCard.querySelectorAll(".sym")];
  const renRows = [...renCard.querySelectorAll(".row:not(.r-p)")], gaps = [...renCard.querySelectorAll(".gap")];
  const lbls = [rawCard.querySelector(".lbl"), renCard.querySelector(".lbl")];
  // 原文前缀（「# 」）的宽度：重叠时渲染那一侧每行往右让出这么多，符号正好落在左边
  // 等宽字体：「# 」正好是两个「#」宽
  const prefixW = rawCard.querySelector(".pre").getBoundingClientRect().width * 2;
  const bullets = [...renCard.querySelectorAll(".r-li, .r-q")];

  // ---- 大字 + 翻页 + 飘起的符号 ----
  const big2 = el("人能直接读，机器也能直接读", "s3big mid", "hud");
  const pages = PAGES.map((n, i) => el(`<img src="assets/img/${n}.jpg">`, "page"));
  const glyphs = GLYPHS.map(([g, x, sz]) => ({ x, e: el(g, "glyph", "hud", `font-size:${sz}px`) }));
  const src = el("daringfireball.net · 2004", "src", "hud");

  function state(t) {
    const live = t > 28.3 && t < 43.6;
    // ---- 截图：28.49 从右边甩进来，33.68 退成背景 ----
    const gin = easeOutBack(ramp(t, 28.49, 0.7), 1.2), gout = easeInOut(ramp(t, 33.68, 0.7));
    const gx = lerp(lerp(2300, 1380, gin), 1580, gout), gy = 500, gsc = lerp(1, 0.6, gout);
    show(gr, live ? clamp(ramp(t, 28.49, 0.2)) * (1 - ease(ramp(t, 33.9, 0.6))) : 0,
      `translate(${gx.toFixed(1)}px, ${gy}px) translate(-50%, -50%) rotate(${lerp(6, -2, gin).toFixed(2)}deg) scale(${gsc.toFixed(3)})`);
    show(byBox, ease(ramp(t, 31.95, 0.3)));
    show(verBox, ease(ramp(t, 32.35, 0.3)));
    gmarks.forEach((m, i) => m.style.setProperty("--k", easeOut(ramp(t, 32.9 + i * 0.22, 0.4)).toFixed(3)));
    // 「2004」：重音上砸下来（从大到正常 + 轻微回弹）
    const yk = easeOutBack(ramp(t, 28.49, 0.45), 2.4);
    show(year, live ? ease(ramp(t, 28.49, 0.12)) * (1 - ease(ramp(t, 33.68, 0.4))) : 0,
      `translate(560px, 430px) translate(-50%, -50%) scale(${lerp(1.8, 1, yk).toFixed(3)})`);
    show(who, live ? ease(ramp(t, 31.95, 0.35)) * (1 - ease(ramp(t, 33.68, 0.4))) : 0,
      `translate(560px, 640px) translate(-50%, -50%) translateY(${lerp(20, 0, easeOut(ramp(t, 31.95, 0.5))).toFixed(1)}px)`);

    // ---- 原文 / 渲染：33.68 进场并排，36.21 靠拢重叠，38.34 退后变虚 ----
    const cin = easeOutBack(ramp(t, 33.68, 0.6), 1.3), merge = easeInOut(ramp(t, 36.21, 1.1)), back = easeInOut(ramp(t, 38.34, 0.8));
    const co = live ? ease(ramp(t, 33.68, 0.25)) * (1 - 0.75 * back) * (1 - ease(ramp(t, 40.3, 0.6))) : 0;
    const cy = lerp(lerp(560, 540, cin), 600, back), csc = lerp(lerp(0.85, 1, cin), 0.8, back);
    const blur = back * 4;
    const rx = lerp(lerp(-200, 560, cin), 960, merge), nx = lerp(lerp(2100, 1360, cin), 960, merge);
    for (const [card, x] of [[renCard, nx], [rawCard, rx]]) {
      card.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
      show(card, co, `translate(${x.toFixed(1)}px, ${cy.toFixed(1)}px) translate(-50%, -50%) scale(${csc.toFixed(3)})`);
    }
    // 重叠：原文那张的底和字淡掉，只剩符号；渲染那张每行让出前缀宽度、加粗词两边让出 ** 的位置
    rawCard.style.background = `rgba(255, 255, 255, ${(1 - merge).toFixed(3)})`;
    rawCard.style.borderColor = `rgba(154, 164, 175, ${(1 - merge).toFixed(3)})`;
    rawCard.style.boxShadow = merge > 0.5 ? "none" : "";
    rawTx.forEach((e) => { e.style.color = `rgba(31, 35, 40, ${(1 - merge).toFixed(3)})`; e.style.visibility = merge > 0.98 ? "hidden" : ""; });
    // 符号在 .tx 里面的（段落的 **）要单独保持可见
    rawSyms.forEach((e) => { e.style.visibility = "visible"; });
    rawSyms.forEach((e) => { e.style.textShadow = `0 0 ${(16 * merge).toFixed(1)}px rgba(var(--md-a), .6)`; });
    renRows.forEach((r) => { r.style.paddingLeft = (prefixW * merge).toFixed(1) + "px"; });
    gaps.forEach((g) => { g.style.fontSize = merge.toFixed(3) + "em"; });
    bullets.forEach((b) => b.style.setProperty("--m", (1 - merge).toFixed(3)));   // 圆点和引用竖线让位给 - 和 >

    lbls.forEach((l) => { l.style.opacity = (1 - ease(merge * 3)).toFixed(3); });
    show(big1, live ? ease(ramp(t, 33.75, 0.4)) * (1 - ease(ramp(t, 38.2, 0.3))) : 0);

    // ---- 38.34 大字；40.46 翻页 + 飘符号 ----
    const bk = easeOutBack(ramp(t, 38.34, 0.6), 1.4);
    show(big2, live ? ease(ramp(t, 38.34, 0.25)) * (1 - ease(ramp(t, 42.9, 0.45))) : 0,
      `translate(960px, ${lerp(470, 300, easeInOut(ramp(t, 40.46, 0.8))).toFixed(1)}px) translate(-50%, -50%) scale(${lerp(0.85, 1, bk).toFixed(3)})`);
    pages.forEach((p, i) => {
      const t0 = 40.46 + i * 0.42, flip = easeInOut(ramp(t, t0 + 0.35, 0.7));
      const o = live ? ease(ramp(t, 40.3 + i * 0.05, 0.4)) * (1 - ease(ramp(t, 42.9, 0.45))) : 0;
      p.style.zIndex = 10 - i;
      show(p, o * (flip > 0.98 ? 0 : 1),
        `translate(960px, 620px) translate(-50%, -50%) translateX(${i * 10}px) translateY(${i * 8}px) rotateY(${(-170 * flip).toFixed(2)}deg) rotateZ(${(i % 2 ? 1.5 : -1.5)}deg)`);
    });
    glyphs.forEach((g, i) => {
      const k = t - 40.6 - i * 0.18;
      show(g.e, live && k > 0 ? ease(ramp(k, 0, 0.4)) * 0.75 * (1 - ease(ramp(t, 42.9, 0.45))) : 0,
        `translate(${(g.x + Math.sin(k * 1.4 + i) * 20).toFixed(1)}px, ${(900 - k * 150).toFixed(1)}px) translate(-50%, -50%) rotate(${(Math.sin(k + i) * 12).toFixed(2)}deg)`);
    });
    show(src, live ? ease(ramp(t, 42.59, 0.3)) * (1 - ease(ramp(t, 43.15, 0.25))) : 0);
  }
  return { state };
}
