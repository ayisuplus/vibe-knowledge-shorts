// S6 普通话 → 反渲染 · 76.59–82.70，S7 揭底 · 82.70–93.59（v2：用户嫌原来的收尾公式化，改成「这期视频本身就写在一份 .md 里」）
// 75.15 三张卡片收成一张 .md 纸（S5 交过来）
// 76.59 （乐句高点）纸压扁成一座桥：左边是人，右边是 AI 的光点。「人和 AI 之间的普通话」
// 78.45 （重音）几小段 Markdown 沿着桥来回滑：人写给 AI，AI 也写回来
// 80.84 「反渲染」：画面变白，每样东西褪成自己的原文——# 人和 AI 之间的**普通话** / - 人 / - AI / ---
// 82.70 （重音）镜头往后拉：那行原文就在这期视频真实的「分镜脚本.md」里（编辑器里，左边是文件列表）
// 85.34 （重音）文件飞快滚到底，左边的 .md 文件依次亮起
// 87.21 （留白）光标在文件末尾敲出「- [ ] 第十期：」，一直闪；91.46 出处；91.8 渐隐
import { lerp, ramp, ease, easeOut, easeInOut, easeOutBack, el, show } from "./lib.js";

const CHIPS = [["#", " 标题", 1], ["-", " 清单", -1], ["**", "重点**", 1], ["#", " 回答", -1], ["-", " 第一步", 1], ["**", "注意**", -1]];
const ANCHOR = "# 人和 AI 之间的**普通话**";
const FILES = [["01-调研", "调研档案.md"], ["03-分镜脚本", "分镜脚本.md"], ["videos/markdown", "BRIEF.md"], [".claude/skills/…", "SKILL.md"]];
const TYPE = "- [ ] 第十期：";
const LH = 38;           // 编辑器行高
const VIEW_H = 756;      // 代码区可见高度（编辑器 820 - 顶栏 64）

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// 简单的 Markdown 语法着色：符号暖橙、表格竖线和反引号灰
function hl(s) {
  let h = esc(s);
  const hasA = h.includes(esc(ANCHOR));
  if (hasA) h = h.replace(esc(ANCHOR), "\u0001");
  h = h.replace(/^(#{1,6})( )/, '<b class="sym">$1</b>$2')
    .replace(/^(\s*)(-|\d+\.)( )/, '$1<b class="sym">$2</b>$3')
    .replace(/\*\*/g, '<b class="sym">**</b>')
    .replace(/\|/g, '<i class="pipe">|</i>')
    .replace(/`/g, '<i class="tick">`</i>');
  if (hasA) h = h.replace("\u0001", `<span class="anc"><b class="sym">#</b> 人和 AI 之间的<b class="sym">**</b>普通话<b class="sym">**</b></span>`);
  return h || "&nbsp;";
}

export function build() {
  // ---- S6：纸 → 桥 ----
  const paper = el(`<div class="ph"><i class="h">#</i><i class="l l1"></i><i class="l l2"></i><i class="l l3"></i><b>.md</b></div>`, "mdpaper");
  const ph = paper.querySelector(".ph");
  const title = el(`人和 AI 之间的<em>普通话</em>`, "s6big", "hud");
  const person = el(`<svg width="150" height="190" viewBox="0 0 150 190"><circle cx="75" cy="48" r="38"/><path d="M8 186 C8 120 40 100 75 100 C110 100 142 120 142 186 Z"/></svg>`, "person", "hud");
  const orb = el("", "orb", "hud");
  const wires = el(`<svg width="1920" height="1080"><line class="w" x1="412" y1="560" x2="505" y2="560"/><line class="w" x1="1415" y1="560" x2="1528" y2="560"/></svg>`, "wires", "hud");
  const chips = CHIPS.map(([s, w, dir]) => ({ dir, e: el(`<b class="sym">${s}</b>${w}`, "flowchip", "hud") }));

  // ---- 反渲染：画面变白，各自露出原文 ----
  const wash = el("", "wash", "hud");
  // ---- S7：编辑器（真实的分镜脚本）----
  const editor = el(`
    <div class="ebar"><span class="fi"></span>第九期 / 03-分镜脚本 / <b>分镜脚本.md</b></div>
    <div class="side">${FILES.map(([d, f]) => `<div class="fl"><small>${d}</small><span><b class="mdi">M↓</b>${f}</span></div>`).join("")}</div>
    <div class="code"><div class="scroll">${SB.map((l, i) => `<div class="ln"><span class="no">${i + 1}</span><span class="tx">${hl(l)}</span></div>`).join("")}
      <div class="ln"><span class="no">${SB.length + 1}</span><span class="tx">&nbsp;</span></div>
      <div class="ln typed"><span class="no">${SB.length + 2}</span><span class="tx">${[...TYPE].map((c) => `<i>${c === " " ? "&nbsp;" : c}</i>`).join("")}<span class="caret"></span></span></div></div></div>`, "editor", "hud");
  editor.setAttribute("data-layout-allow-overlap", "");
  const scroll = editor.querySelector(".scroll"), files = [...editor.querySelectorAll(".fl")];
  const ebar = editor.querySelector(".ebar"), side = editor.querySelector(".side");
  const typedLn = editor.querySelector(".typed"), typedChars = [...typedLn.querySelectorAll(".tx > i")], caret = typedLn.querySelector(".caret");
  const raws = [
    [`<b class="sym">#</b> 人和 AI 之间的<b class="sym">**</b>普通话<b class="sym">**</b>`, 960, 200],
    [`<b class="sym">-</b> 人`, 330, 560],
    [`<b class="sym">---</b>`, 960, 560],
    [`<b class="sym">-</b> AI`, 1590, 560],
  ].map(([h, x, y]) => ({ x, y, e: el(h, "rawline", "hud") }));

  // 拉镜头的锚点：编辑器在最终位置、滚到锚点那一行附近时，那行原文在屏幕上的中心
  const ancLine = SB.findIndex((l) => l.includes(ANCHOR));
  const anc = editor.querySelector(".anc");
  const S0 = Math.max(0, ancLine * LH - VIEW_H / 2 + LH / 2);
  const SEND = Math.max(0, (SB.length + 1) * LH + 64 - VIEW_H + LH);   // 最后一行（敲字那行）高 64
  scroll.style.transform = `translateY(${-S0}px)`;
  const root = document.getElementById("root").getBoundingClientRect(), er = editor.getBoundingClientRect(), ar = anc.getBoundingClientRect();
  const A = { x: ar.left - root.left + ar.width / 2, y: ar.top - root.top + ar.height / 2 };   // 锚点在屏幕上的最终位置
  editor.style.transformOrigin = `${(A.x - (er.left - root.left)).toFixed(1)}px ${(A.y - (er.top - root.top)).toFixed(1)}px`;
  const S_START = raws[0].e.getBoundingClientRect().width / ar.width;                      // 让锚点文字和原文大字一样大

  const refs = el("参考：Gruber 2004 · OpenAI Model Spec · LMSYS 2024 · GitHub 代码搜索 2026-10 · He et al. 2024 · 示例 SKILL.md 来自 obra/superpowers（MIT）", "refs", "hud");
  const fadeout = el("", "fadeout", "hud");

  function state(t) {
    const live = t > 75.0 && t < 83.2;
    // ---- 纸 → 桥 ----
    const pop = easeOutBack(ramp(t, 75.15, 0.5), 1.8);
    const b = easeInOut(ramp(t, 76.4, 0.65));
    const unr = easeInOut(ramp(t, 80.84, 0.6));     // 反渲染
    const sx = lerp(1, 1.25, b), sy = lerp(1, 0.18, b), ps = lerp(0.55, 1, pop);
    show(paper, live ? ease(ramp(t, 75.15, 0.15)) * (1 - unr) : 0,
      `translate(960px, ${lerp(520, 560, b).toFixed(1)}px) translate(-50%, -50%) scale(${(sx * ps).toFixed(4)}, ${(sy * ps).toFixed(4)})`);
    ph.style.opacity = (1 - ease(ramp(t, 76.4, 0.3))).toFixed(3);
    const ti = easeOutBack(ramp(t, 76.59, 0.5), 1.6);
    show(title, live ? ease(ramp(t, 76.59, 0.2)) * (1 - unr) : 0, `translate(960px, 200px) translate(-50%, -50%) scale(${lerp(0.8, 1, ti).toFixed(3)})`);
    const ends = live ? ease(ramp(t, 76.8, 0.35)) * (1 - unr) : 0;
    show(person, ends, `translate(330px, 560px) translate(-50%, -50%) translateY(${lerp(20, 0, easeOut(ramp(t, 76.8, 0.5))).toFixed(1)}px)`);
    show(orb, ends, `translate(1590px, 560px) translate(-50%, -50%) scale(${(1 + 0.08 * Math.sin(t * 5)).toFixed(3)})`);
    show(wires, ends);
    // 桥上来回滑的 Markdown 小段
    chips.forEach((c, i) => {
      const t0 = 78.45 + i * 0.36, k = easeInOut(ramp(t, t0, 1.25));
      const x = c.dir > 0 ? lerp(560, 1360, k) : lerp(1360, 560, k);
      const o = t < t0 || k >= 1 ? 0 : Math.min(ramp(t, t0, 0.2), 1 - ramp(t, t0 + 1.05, 0.2));
      show(c.e, live ? o * (1 - unr) : 0, `translate(${x.toFixed(1)}px, ${c.dir > 0 ? 492 : 628}px) translate(-50%, -50%)`);
    });

    // ---- 反渲染 ----
    show(wash, t > 80.7 ? unr * (1 - ease(ramp(t, 91.8, 1.6))) : 0);
    const pull = easeInOut(ramp(t, 82.7, 1.1));
    raws.forEach((r, i) => {
      const o = t > 80.8 ? ease(ramp(t, 80.95 + i * 0.12, 0.35)) * (1 - ease(ramp(t, 82.7, i === 0 ? 0.1 : 0.3))) : 0;
      show(r.e, o, `translate(${r.x}px, ${r.y}px) translate(-50%, -50%) scale(${(i === 0 ? 1 : lerp(1, 0.4, pull)).toFixed(3)})`);
    });

    // ---- S7 编辑器：82.7 从锚点拉出来；85.34 滚到底；87.21 敲字 ----
    const s = Math.exp(lerp(Math.log(S_START), 0, pull));
    const dx = lerp(960 - A.x, 0, pull), dy = lerp(200 - A.y, 0, pull);
    show(editor, t >= 82.7 ? 1 - ease(ramp(t, 91.8, 1.6)) : 0, `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${s.toFixed(4)})`);
    ebar.style.opacity = side.style.opacity = ease(ramp(t, 83.4, 0.6)).toFixed(3);
    scroll.style.transform = `translateY(${(-lerp(S0, SEND, easeInOut(ramp(t, 85.34, 1.6)))).toFixed(1)}px)`;
    files.forEach((f, i) => f.classList.toggle("on", i === 1 || t >= 85.6 + i * 0.3));
    const typed = Math.floor(lerp(0, typedChars.length + 0.999, ramp(t, 87.6, 1.0)));
    typedChars.forEach((c, i) => { c.style.visibility = i < typed ? "visible" : "hidden"; });
    const last = typed > 0 ? typedChars[Math.min(typed, typedChars.length) - 1] : null;
    if (last && caret.previousSibling !== last) last.after(caret);
    caret.style.opacity = t > 87.3 && (t < 88.6 || Math.floor((t - 87.3) * 2.2) % 2 === 0) ? "1" : "0";
    typedLn.style.background = t > 87.5 ? `rgba(var(--md-a), ${(0.1 * ease(ramp(t, 87.5, 0.4))).toFixed(3)})` : "";
    show(refs, t > 91.4 ? ease(ramp(t, 91.46, 0.4)) : 0);
    show(fadeout, t > 91.7 ? easeInOut(ramp(t, 91.8, 1.6)) : 0);
  }
  return { state };
}
