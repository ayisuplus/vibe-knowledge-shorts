// S4 两双眼睛 · 43.38–61.44（主视觉）
// 43.38 （重音）一张排好版的「周末计划」砸进来；44.0 中缝一闪，劈成两半：左「你看到的」，右「AI 看到的」（原文）
// 46.84 右边的原文碎成一块块 token 积木（真实分词，o200k）；符号块是暖橙
// 48.96 左边的加粗那行和右边两块 ** 之间，两根粉线画出来
// 51.09 左半边外面亮出一个聊天界面的框：加粗是界面画出来的
// 52.41 （重音，全片唯一一次顿挫）左边内容被「复制」，粘进一个聊天软件的消息气泡（示意）——排版没了，满屏 # - ** 炸出来
// 55.33 符号在气泡里一跳一跳
// 56.13 （重音）气泡掉下去；两半纸合回中间，中缝发光
// 58.40 合上的纸往上飘、变小，交给 S5
import { clamp, lerp, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, pulse, el, show } from "./lib.js";

const MD = ["# 周末计划", "", "- 买菜", "- 看电影", "- 给妈妈打电话", "", "**最重要：别熬夜**"];
const symHTML = (s) => s.replace(/^(#|-)( )/, '<b class="sym">$1</b>$2').replace(/\*\*/g, '<b class="sym">**</b>') || "&nbsp;";

export function build() {
  const L = el(`<h1>周末计划</h1><ul><li>买菜</li><li>看电影</li><li>给妈妈打电话</li></ul><p><span class="bold">最重要：别熬夜</span></p>`, "half l");
  const R = el(`<div class="rawtxt">${MD.map((s) => `<div>${symHTML(s)}</div>`).join("")}</div><div class="toks"></div>`, "half r");
  const rawtxt = R.querySelector(".rawtxt"), toks = R.querySelector(".toks"), bold = L.querySelector(".bold");
  // 劈开前两半叠在一起、气泡压在变暗的两半上，都是有意的
  for (const e of [L, R]) e.setAttribute("data-layout-allow-overlap", "");
  // token 积木：按原文换行排成行；换行 token 画成淡灰 ↵；跨两个 token 的字一块积木带中缝
  const colors = ["--t1", "--t2", "--t3", "--t4", "--t5"];
  let line = null, ci = 0;
  const newLine = () => { line = document.createElement("div"); line.className = "line"; toks.appendChild(line); };
  const blocks = [];
  const add = (cls, html, bg) => { const b = document.createElement("span"); b.className = "tok " + cls; b.innerHTML = html; if (bg) b.style.backgroundColor = bg; line.appendChild(b); blocks.push(b); return b; };
  newLine();
  for (const { t, n } of TOKENS) {
    const sym = t.replace(/\n/g, "");
    if (/^(#|-|\*\*)$/.test(sym)) add("sym", sym);
    else if (!sym) add("nl", "↵".repeat(t.length));
    else add(n > 1 ? "two" : "", t.startsWith(" ") ? `<span class="sp">·</span>${t.slice(1)}` : t, `var(${colors[ci++ % colors.length]})`);
    if (t.endsWith("\n") && sym) add("nl", "↵");
    if (t.endsWith("\n")) newLine();
  }
  const stars = blocks.filter((b) => b.textContent === "**");
  const lblL = el("你看到的", "eye", "hud"), lblR = el(`AI 看到的<small>28 个 token</small>`, "eye", "hud");
  const seam = el("", "seam", "hud");
  const svg = el(`<svg width="1920" height="1080"><path class="lk"/><path class="lk"/></svg>`, "links", "hud");
  const paths = [...svg.querySelectorAll("path")];
  const chat = el(`<div class="cbar"><i></i><i></i><i></i></div>`, "chatframe");
  const msgr = el(`<div class="mbar"><span class="back"></span><span class="dot"></span></div>
    <div class="mrow"><div class="bubble">${MD.filter((s) => s).map((s) => `<div>${symHTML(s)}</div>`).join("")}</div><div class="avatar"></div></div>`, "msgr");
  const msyms = [...msgr.querySelectorAll(".sym")];
  msgr.setAttribute("data-layout-allow-overlap", "");
  // 52.41 气泡里炸出来的一圈符号（稀疏，8 个）
  const BURST = [["**", -520, -250], ["#", 470, -280], ["-", -600, 60], ["**", 560, 40], ["#", -420, 210], ["**", 380, 220], ["-", 120, -360], ["#", -40, -380]]; // 往下的不超过 y≈860，不进字幕区
  const burst = BURST.map(([g, dx, dy], i) => ({ dx, dy, e: el(g, "glyph burst", "hud", `font-size:${i % 2 ? 84 : 110}px`) }));

  // 两根粉线的端点（build 结尾在 t=50 的姿态下量）
  let linkD = null;
  function measureLinks() {
    const root = document.getElementById("root").getBoundingClientRect();
    const b = bold.getBoundingClientRect();
    linkD = stars.map((s, i) => {
      const r = s.getBoundingClientRect();
      const x1 = b.right - root.left + 10, y1 = b.top - root.top + b.height / 2, x2 = r.left - root.left + r.width / 2, y2 = r.bottom - root.top + 6;
      return `M${x1.toFixed(1)},${y1.toFixed(1)} C${(x1 + 180).toFixed(1)},${(y1 + 90 + i * 30).toFixed(1)} ${(x2 - 80).toFixed(1)},${(y2 + 110).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
    });
    paths.forEach((p, i) => { p.setAttribute("d", linkD[i]); const len = p.getTotalLength(); p.style.strokeDasharray = len; p.dataset.len = len; });
  }

  function place(t) {
    // 两半的位置：叠在中间 → 劈开（各自侧一点）→ （52.41 变暗）→ 56.13 边对边拼回一张宽纸 → 58.40 整体上飘变小
    const split = easeInOut(ramp(t, 44.0, 0.9)), close = easeInOut(ramp(t, 56.13, 0.9)), up = easeInOut(ramp(t, 58.4, 1.6));
    const k = split * (1 - close);
    const shake = Math.sin((t - 52.41) * 70) * 9 * Math.exp(-(t - 52.41) * 9) * (t > 52.41 ? 1 : 0);
    const slam = easeOutBack(ramp(t, 43.38, 0.5), 1.8);
    const y = lerp(510, 230, up), sc = lerp(0.82, 1, slam) * lerp(1, 0.35, up);
    // 拼回时：左半右边缘、右半左边缘都在 x=960（左宽 700、右宽 880）。
    // 两半各自绕内侧边缘缩放（左半 origin 在右边、右半在左边），所以缩放不会挪动交界
    const lx = lerp(lerp(960, 460, split), 610, close) + shake, rx = lerp(lerp(960, 1380, split), 1400, close) + shake;
    return { k, close, up, y, sc, lx, rx, shake };
  }

  function state(t) {
    const live = t > 43.2 && t < 61.5;
    const P = place(t);
    const dim = ease(ramp(t, 52.41, 0.3)) * (1 - ease(ramp(t, 56.13, 0.5)));
    const fadeAll = 1 - ease(ramp(t, 60.9, 0.5));
    const o = live ? ease(ramp(t, 43.38, 0.15)) * fadeAll : 0;
    for (const [card, x, ry, origin] of [[R, P.rx, -9, "0 50%"], [L, P.lx, 9, "100% 50%"]]) {
      card.style.transformOrigin = origin;
      card.style.filter = dim > 0.02 ? `blur(${(3 * dim).toFixed(2)}px)` : "";
      show(card, o * (1 - 0.65 * dim),
        `translate(${x.toFixed(1)}px, ${P.y.toFixed(1)}px) translate(-50%, -50%) rotateY(${(ry * P.k).toFixed(2)}deg) scale(${P.sc.toFixed(4)})`);
    }
    // 中缝：劈开前一闪，合上时再亮
    const sk = pulse(t, 43.75, 0.5) + ease(ramp(t, 56.6, 0.4)) * (1 - ease(ramp(t, 60.6, 0.6)));
    const seamX = t < 50 ? (P.lx + P.rx) / 2 : P.lx + 350;   // 拼回后就是左半的右边缘
    show(seam, live ? clamp(sk) : 0, `translate(${seamX.toFixed(1)}px, ${P.y.toFixed(1)}px) translate(-50%, -50%) scaleY(${((0.4 + 0.6 * clamp(sk)) * P.sc).toFixed(3)})`);
    const lo = live ? ease(ramp(t, 44.6, 0.4)) * (1 - ease(ramp(t, 56.13, 0.3))) * (1 - 0.65 * dim) : 0;
    show(lblL, lo * (1 - ease(ramp(t, 50.95, 0.25))), `translate(${(P.lx - 350).toFixed(1)}px, 112px)`);
    show(lblR, lo, `translate(${(P.rx - 440).toFixed(1)}px, 112px)`);

    // 原文 → 积木
    const shatter = ramp(t, 46.84, 0.35);
    rawtxt.style.opacity = (1 - ease(shatter)).toFixed(3);
    rawtxt.style.visibility = shatter >= 1 ? "hidden" : "";
    blocks.forEach((b, i) => {
      const bk = easeOutBack(ramp(t, 46.9 + i * 0.05, 0.35), 2.2);
      b.style.opacity = clamp(ramp(t, 46.9 + i * 0.05, 0.12)).toFixed(3);
      b.style.transform = `scale(${(0.4 + 0.6 * bk).toFixed(3)})`;
    });
    lblR.querySelector("small").style.opacity = ease(ramp(t, 48.2, 0.4)).toFixed(3);

    // 粉线：48.96 画出来
    paths.forEach((p, i) => {
      const len = +p.dataset.len || 0, k = easeInOut(ramp(t, 48.96 + i * 0.2, 0.7));
      p.style.strokeDashoffset = (len * (1 - k)).toFixed(1);
    });
    show(svg, linkD && live ? ease(ramp(t, 48.96, 0.1)) * (1 - ease(ramp(t, 52.3, 0.25))) : 0);

    // 聊天界面的框
    const cf = easeOutBack(ramp(t, 51.09, 0.5), 1.4);
    show(chat, live ? ease(ramp(t, 51.09, 0.3)) * (1 - 0.65 * dim) * (1 - ease(ramp(t, 56.13, 0.3))) : 0,
      `translate(${P.lx.toFixed(1)}px, ${P.y.toFixed(1)}px) translate(-50%, -50%) rotateY(${(9 * P.k).toFixed(2)}deg) scale(${(P.sc * lerp(1.08, 1, cf)).toFixed(4)})`);

    // 消息气泡：52.41 从左半边飞到前面，满屏符号炸出来；56.13 掉下去
    const mi = easeOutBack(ramp(t, 52.41, 0.45), 1.5), mo = easeIn(ramp(t, 56.13, 0.55));
    const mx = lerp(P.lx, 960, mi) + P.shake, my = lerp(P.y, 520, mi) + mo * 420;
    show(msgr, live && t >= 52.41 ? ease(ramp(t, 52.41, 0.12)) * (1 - ease(ramp(t, 56.3, 0.35))) : 0,
      `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) translate(-50%, -50%) rotate(${(mo * 8).toFixed(2)}deg) scale(${lerp(0.6, 1, mi).toFixed(3)})`);
    burst.forEach((b, i) => {
      const k = easeOut(ramp(t, 52.45 + i * 0.03, 0.9));
      show(b.e, live && t >= 52.45 ? ease(ramp(t, 52.45, 0.1)) * (1 - ease(ramp(t, 54.6 + i * 0.08, 0.6))) : 0,
        `translate(${(960 + b.dx * k).toFixed(1)}px, ${(520 + b.dy * k + 60 * k * k).toFixed(1)}px) translate(-50%, -50%) rotate(${(k * (i % 2 ? 40 : -40)).toFixed(1)}deg) scale(${lerp(0.3, 1, k).toFixed(3)})`);
    });
    msyms.forEach((s, i) => {
      const pop = easeOutBack(ramp(t, 52.5 + i * 0.05, 0.45), 4.5);
      const hop = t > 55.33 ? Math.abs(Math.sin((t - 55.33) * 7 + i * 0.9)) * 14 * (1 - ramp(t, 56.0, 0.3)) : 0;
      s.style.transform = `translateY(${(-hop).toFixed(1)}px) scale(${lerp(0.3, 1, pop).toFixed(3)})`;
      s.style.textShadow = `0 0 ${(18 * pulse(t, 52.5 + i * 0.05, 0.8)).toFixed(1)}px rgba(var(--md-a), .7)`;
    });
  }
  // 两半停稳后（44.9–52.41 之间）量一次粉线端点，跳帧也不会量错
  state(50);
  measureLinks();
  return { state };
}
