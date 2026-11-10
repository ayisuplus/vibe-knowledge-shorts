// S2 打开 · 17.05–28.49
// 17.05 纸展开成一份真实的 SKILL.md（superpowers 的 brainstorming，MIT 许可，第 6–26 行原文重排），镜头沿着文字往下扫
// 19.20 原文里的 #、-、** 依次亮成暖橙，右边出图例
// 21.33 几句「该怎么做」的大白话被粉色记号笔划出来
// 23.46 文档缩到左边；右边升起三座半透明纸塔（630 万 / 112 万 / 84 万），塔顶几张纸像落叶一样飘
// 25.58 纸塔退成虚影；一个半透明文件夹里，暖橙色的光像水一样涨到 64%
// 27.70 出处
import { clamp, lerp, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, el, show } from "./lib.js";

// 原文第 6–26 行。⟦…⟧ 包住的是要被记号笔划出来的句子
const SRC = [
  "# Brainstorming",
  "",
  "You are very good at building. You build what you believe your human",
  "partner wants, and that belief is usually thinner than it feels. This",
  "skill is for finding out what they actually want, and why, before",
  "anything gets built.",
  "",
  "People often haven't finished working out what they want. Good questions",
  "help them think it through. When you understand the why, you make the",
  "hundred decisions they never mention the way they would have made them.",
  "",
  "## First: What Do You Actually Know?",
  "",
  "⟦Before you reply, ask yourself: what do I know about what they want, and⟧",
  "⟦why?⟧",
  "",
  "- **Everything that matters is in the request** (\"make the icon cornflower",
  "  blue\"). ⟦This is a quick, clear task. Do it, and say what you did.⟧",
  "- **Something non-trivial is missing.** ⟦Start the conversation.⟧",
  "",
  "## Your First Message",
];
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function lineHTML(s) {
  let h = esc(s);
  h = h.replace(/^(#+)( )/, '<b class="sym s-h">$1</b>$2');
  h = h.replace(/^- /, '<b class="sym s-l">-</b> ');
  h = h.replace(/\*\*/g, '<b class="sym s-b">**</b>');
  h = h.replace(/⟦/g, '<span class="mark">').replace(/⟧/g, "</span>");
  return h || "&nbsp;";
}

// 纸塔：[数量（万）, 文件名, 底面中心 x, 塔宽, 数字字号]
const TOWERS = [[630, "SKILL", 1030, 210, 120], [112, "AGENTS", 1400, 170, 86], [84, "CLAUDE", 1690, 150, 78]];
const MAXH = 470, BASE = 790;

export function build() {
  // ---- 文档面板 ----
  const doc = el(`
    <div class="bar"><span class="fi"></span>superpowers / skills / brainstorming / <b>SKILL.md</b></div>
    <div class="body"><div class="code">${SRC.map((s, i) => `<div class="ln"><span class="no">${i + 6}</span><span class="tx">${lineHTML(s)}</span></div>`).join("")}</div></div>`, "doc");
  const code = doc.querySelector(".code"), lines = [...code.querySelectorAll(".ln")];
  const syms = { h: [...doc.querySelectorAll(".s-h")], l: [...doc.querySelectorAll(".s-l")], b: [...doc.querySelectorAll(".s-b")] };
  const marks = [...doc.querySelectorAll(".mark")];
  const legend = [["#", "标题"], ["-", "清单"], ["**", "加粗"]].map(([s, w]) => el(`<b>${s}</b>${w}`, "legend", "hud"));

  // ---- 纸塔 ----
  const towers = TOWERS.map(([n, file, cx, w, fs]) => {
    const t = el(`<div class="face front"></div><div class="face side"></div><div class="face top"></div>`, "tower");
    const num = el(`<b style="font-size:${fs}px"><span class="v">0</span><small>万</small></b><span>${file}<span class="md">.md</span></span>`, "towernum", "hud");
    return { n, cx, w, t, num, v: num.querySelector(".v"), faces: [...t.querySelectorAll(".face")] };
  });
  const leaves = [[1170, 0.7, -18], [1250, 0.55, 14], [1110, 0.42, -6]].map(([x, s, r]) => ({ x, s, r, e: el("", "leaf", "hud") }));
  const src = el("GitHub 代码搜索 · 2026 年 10 月", "src", "hud");

  // ---- 文件夹 ----
  const folder = el(`
    <svg width="520" height="420" viewBox="0 0 520 420">
      <defs>
        <clipPath id="fbody"><rect x="14" y="74" width="492" height="332" rx="22"/></clipPath>
        <linearGradient id="liq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8873A"/><stop offset="1" stop-color="#B85400"/></linearGradient>
      </defs>
      <path class="back" d="M14 70 Q14 40 44 40 H190 Q206 40 216 54 L230 74 H476 Q506 74 506 104 V380 Q506 406 480 406 H40 Q14 406 14 380 Z"/>
      <g clip-path="url(#fbody)"><path class="liquid" d=""/></g>
      <rect class="glass" x="14" y="74" width="492" height="332" rx="22"/>
      <line class="tick" x1="0" x2="520" y1="0" y2="0"/>
    </svg>`, "folder", "hud");
  const liquid = folder.querySelector(".liquid"), tick = folder.querySelector(".tick");
  const fname = el(`<span class="md">.</span>claude`, "fname", "hud");
  const pct = el(`<b><span class="v">0</span>%</b><span>是 <span class="md">.md</span></span>`, "pct", "hud");
  const pctV = pct.querySelector(".v");

  function state(t) {
    const on = t >= 16.9 && t < 28.8;
    // 28.3 起退场：整体往镜头冲过来、变淡（S3 的截图从右边甩进来接上）
    const ex = easeIn(ramp(t, 28.05, 0.4)), exO = 1 - ex, exS = 1 + 0.7 * ex;
    // ---- 文档：17.05 从纸的位置展开 → 23.46 缩到左边、侧过去 ----
    const open = easeOutBack(ramp(t, 17.05, 0.65), 1.1);
    const side = easeInOut(ramp(t, 23.46, 1.0));
    const dx = lerp(760, 400, side), dy = lerp(470, 470, side);
    const sc = lerp(lerp(0.34, 1, open), 0.5, side) * exS;
    show(doc, on ? ease(ramp(t, 17.0, 0.3)) * (1 - 0.35 * ease(ramp(t, 25.58, 0.8))) * exO : 0,
      `translate(${dx}px, ${dy}px) translate(-50%, -50%) rotateY(${lerp(0, 18, side).toFixed(2)}deg) scale(${sc.toFixed(4)})`);
    const scroll = easeInOut(ramp(t, 20.9, 0.9)) * 76;
    code.style.transform = `translateY(${(-scroll).toFixed(1)}px)`;
    // 滚出顶栏的行直接隐藏（被裁掉的字会被布局检查当成「被遮住的文字」）
    lines.forEach((ln, i) => { ln.style.visibility = scroll > 38 * i + 19 ? "hidden" : ""; });
    // 符号依次亮
    [["h", 19.2], ["l", 19.65], ["b", 20.1]].forEach(([k, t0], gi) => {
      const p = easeOutBack(ramp(t, t0, 0.4), 3);
      syms[k].forEach((s, i) => {
        const pi = clamp(p - i * 0.0);
        s.style.color = t >= t0 ? "var(--md)" : "";
        s.style.textShadow = t >= t0 ? `0 0 ${(14 * pi).toFixed(1)}px rgba(var(--md-a), .55)` : "";
        s.style.transform = `scale(${(1 + 0.45 * Math.sin(Math.PI * clamp(ramp(t, t0, 0.4)))).toFixed(3)})`;
      });
      const lg = legend[gi];
      show(lg, t < t0 ? 0 : ease(ramp(t, t0, 0.3)) * (1 - ease(ramp(t, 23.2, 0.4))),
        `translate(1660px, ${360 + gi * 140}px) translate(-50%, -50%) scale(${(0.7 + 0.3 * easeOutBack(ramp(t, t0, 0.45))).toFixed(3)})`);
    });
    // 记号笔
    marks.forEach((m, i) => m.style.setProperty("--k", easeOut(ramp(t, 21.33 + i * 0.28, 0.55)).toFixed(3)));

    // ---- 纸塔 ----
    const dim = 1 - ease(ramp(t, 25.4, 0.6));
    towers.forEach((tw, i) => {
      const g = easeOut(ramp(t, 24.0 + i * 0.18, 1.1));
      const h = Math.max(2, MAXH * tw.n / 630 * g), w = tw.w, d = w;
      const vis = t >= 23.98 && t < 28.6;
      Object.assign(tw.t.style, { left: tw.cx - w / 2 + "px", top: BASE - h + "px", width: w + "px", height: h + "px" });
      tw.t.style.visibility = vis ? "visible" : "hidden";
      const [front, sidef, top] = tw.faces;
      Object.assign(front.style, { width: w + "px", height: h + "px", transform: `translateZ(${d / 2}px)`, opacity: dim });
      Object.assign(sidef.style, { width: d + "px", height: h + "px", transform: `rotateY(90deg) translateZ(${w - d / 2}px)`, opacity: dim });
      Object.assign(top.style, { width: w + "px", height: d + "px", transform: `rotateX(90deg) translateZ(${d / 2}px)`, opacity: dim });
      tw.v.textContent = Math.round(tw.n * g);
      show(tw.num, vis ? ease(ramp(t, 24.15 + i * 0.18, 0.4)) * dim : 0,
        `translate(${tw.cx + 20}px, ${BASE - MAXH * tw.n / 630 * g - 46}px) translate(-50%, -100%)`);
    });
    leaves.forEach((lf, i) => {
      const k = t - 24.4 - i * 0.35;
      const y = 300 - k * 34 - i * 40, x = lf.x + Math.sin(k * 1.1 + i) * 26;
      show(lf.e, k < 0 ? 0 : ease(ramp(k, 0, 0.5)) * dim * (0.55 + lf.s * 0.45),
        `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(lf.r + Math.sin(k * 0.9 + i) * 10).toFixed(2)}deg) scale(${lf.s})`);
    });
    show(src, t >= 23.7 && t < 28.8 ? ease(ramp(t, 23.7, 0.5)) * exO : 0);

    // ---- 文件夹：25.58 出现，光涨到 64% ----
    const fo = t >= 25.5 && t < 28.8 ? easeOutBack(ramp(t, 25.58, 0.6), 1.4) : 0;
    show(folder, clamp(fo) * exO, `translate(1180px, 500px) translate(-50%, -50%) scale(${((0.8 + 0.2 * fo) * exS).toFixed(3)})`);
    show(fname, clamp(fo) * exO, `translate(1180px, ${(236 - 160 * ex).toFixed(1)}px) translate(-50%, -50%) scale(${exS.toFixed(3)})`);
    const lvl = 0.64 * easeInOut(ramp(t, 25.9, 1.4));
    const top = 74, bot = 406, yL = bot - (bot - top) * lvl;
    let d = `M0 ${yL.toFixed(1)}`;
    for (let x = 0; x <= 520; x += 20) d += ` L${x} ${(yL + Math.sin(x / 46 + t * 3.2) * 6 * clamp(lvl * 4)).toFixed(1)}`;
    liquid.setAttribute("d", d + " L520 420 L0 420 Z");
    const tk = bot - (bot - top) * 0.64;
    tick.setAttribute("y1", tk); tick.setAttribute("y2", tk);
    tick.style.opacity = ease(ramp(t, 26.9, 0.4)).toFixed(3);
    pctV.textContent = Math.round(lvl * 100);
    show(pct, t >= 25.9 && t < 28.8 ? ease(ramp(t, 25.9, 0.4)) * exO : 0, `translate(${(1500 + 260 * ex).toFixed(1)}px, 500px) translate(0, -50%) scale(${exS.toFixed(3)})`);
  }
  return { state };
}
