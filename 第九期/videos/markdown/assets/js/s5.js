// S5 为什么是「最爱」 · 61.44–76.59：被要求、被奖励、还最省
// 61.44 （重音）OpenAI Model Spec「Use Markdown with LaTeX extensions」那一节飞进来，默认用 Markdown 那句被划出来
// 63.58 （重音）两个回答 PK：一大段纯文字 vs 有标题、列表、加粗的；下面两根投票条，结构清楚的那根涨得更快（示意）
// 65.17 （重音）同一份清单的五种写法，各自长成一根 token 长棒（长度 = 实测 token 数）
// 67.30 数字依次跳出；69.42 Markdown 那根亮绿，HTML 那根闪一下，粉色括号「≈ 2 倍」
// 72.34 三张卡片依次点亮：人爱读 · 模型读得懂 · 还最省
// 74.47 出处；三张卡片收回中间，变成那张 .md 纸（S6 接手）
import { clamp, lerp, ramp, ease, easeOut, easeIn, easeInOut, easeOutBack, pulse, el, show } from "./lib.js";

// Model Spec 截图里露出的那一块（CSS px，截图 1200 宽）和那句话的位置
const SPEC = { win: [0, 0, 830, 292], line: [20, 60, 790, 30] };
const RODS = [
  ["纯文本", 23, "#DDB650", "#E9CD80"],
  ["Markdown", 28, "#7CCB9B", "#A6DDBA"],
  ["YAML", 35, "#7EB6E6", "#A7CDEE"],
  ["JSON", 48, "#F2A16B", "#F6BD95"],
  ["HTML", 54, "#EE8E88", "#F3ADA8"],
];
const U = 20, ROD_X = 430, ROD_Y = 210, ROW_H = 126;

export function build() {
  // ---- Model Spec ----
  const sw = 1320, s = sw / SPEC.win[2];
  const spec = el(`<img src="assets/img/model-spec-formatting.jpg"><div class="smark"></div>`, "spec");
  Object.assign(spec.style, { width: sw + "px", height: SPEC.win[3] * s + "px" });
  Object.assign(spec.querySelector("img").style, { width: 1200 * s + "px" });
  const smark = spec.querySelector(".smark");
  Object.assign(smark.style, { left: SPEC.line[0] * s + "px", top: SPEC.line[1] * s + "px", width: SPEC.line[2] * s + "px", height: SPEC.line[3] * s + "px" });
  const specTag = el(`默认：<b>Markdown</b>`, "spectag", "hud");
  const specSrc = el("OpenAI Model Spec", "minisrc", "hud");

  // ---- 投票 PK（示意）----
  const plain = el(`<div class="lines">${Array.from({ length: 9 }, (_, i) => `<i style="width:${[96, 100, 92, 98, 88, 100, 94, 97, 60][i]}%"></i>`).join("")}</div>`, "ans plain");
  const rich = el(`<div class="hd"></div><div class="li"><b></b><i></i></div><div class="li"><b></b><i style="width:58%"></i></div><div class="li"><b></b><i style="width:66%"></i></div><div class="bd"></div>`, "ans rich");
  const richTag = el("列表 · 标题 · 加粗", "richtag", "hud");
  const bars = [el(`<i></i>`, "vbar", "hud"), el(`<i></i>`, "vbar win", "hud")];
  const fills = bars.map((b) => b.querySelector("i"));
  const demo = el("示意", "demo", "hud");

  // ---- token 长棒 ----
  const rods = RODS.map(([name, n, c1, c2], i) => {
    const row = el(`<div class="name">${name}</div><div class="rod" style="background:linear-gradient(90deg, ${c1}, ${c2});--u:${U}px"></div><div class="n">${n}</div>`,
      "rodrow" + (name === "Markdown" ? " md" : name === "HTML" ? " html" : ""), "hud", `top:${ROD_Y + i * ROW_H}px`);
    return { n, row, rod: row.querySelector(".rod"), num: row.querySelector(".n"), name: row.querySelector(".name") };
  });
  const brace = el(`<span>≈ 2 倍</span>`, "brace", "hud");
  const rodSrc = el("实测：GPT-4o 分词器（o200k）", "src", "hud");

  // ---- 三张卡片 ----
  const three = ["人爱读", "模型读得懂", "还最省"].map((w) => el(w, "trio", "hud"));
  const refs = el("OpenAI Model Spec · LMSYS 2024 · 实测：GPT-4o 分词器", "src", "hud");

  function state(t) {
    const live = t > 61.3 && t < 76.6;
    // Model Spec：61.44 从下方弹上来，63.58 缩到左上退场
    const si = easeOutBack(ramp(t, 61.44, 0.6), 1.3), so = easeInOut(ramp(t, 63.4, 0.6));
    show(spec, live ? ease(ramp(t, 61.44, 0.15)) * (1 - so) : 0,
      `translate(960px, ${lerp(700, 380, si).toFixed(1)}px) translate(-50%, -50%) scale(${lerp(0.85, 1, si) * lerp(1, 0.6, so)})`);
    smark.style.setProperty("--k", easeOut(ramp(t, 62.0, 0.6)).toFixed(3));
    const tg = easeOutBack(ramp(t, 62.3, 0.45), 2);
    show(specTag, live ? ease(ramp(t, 62.3, 0.2)) * (1 - so) : 0, `translate(960px, 700px) translate(-50%, -50%) scale(${lerp(0.6, 1, tg).toFixed(3)})`);
    show(specSrc, live ? ease(ramp(t, 62.3, 0.3)) * (1 - so) : 0);

    // 投票 PK：63.58 两张卡进场；63.9 起两根条往上涨，结构清楚那根更快；65.17 退场
    const ai = easeOutBack(ramp(t, 63.58, 0.55), 1.4), ao = easeIn(ramp(t, 65.0, 0.4));
    const ao2 = live ? ease(ramp(t, 63.58, 0.2)) * (1 - ao) : 0;
    show(plain, ao2, `translate(${lerp(300, 620, ai).toFixed(1)}px, 440px) translate(-50%, -50%) scale(${lerp(0.8, 1, ai).toFixed(3)})`);
    show(rich, ao2, `translate(${lerp(1620, 1300, ai).toFixed(1)}px, 440px) translate(-50%, -50%) scale(${lerp(0.8, 1, ai).toFixed(3)})`);
    show(richTag, ao2 * ease(ramp(t, 63.9, 0.3)), `translate(1300px, 160px) translate(-50%, -50%)`);
    const vk = easeOut(ramp(t, 63.9, 1.1));
    [[0, 620, 0.42], [1, 1300, 0.78]].forEach(([i, x, full]) => {
      show(bars[i], ao2, `translate(${x}px, 760px) translate(-50%, -50%)`);
      fills[i].style.width = (full * vk * 100).toFixed(1) + "%";
    });
    show(demo, ao2);

    // token 长棒
    const rodsOut = 1 - 0.8 * ease(ramp(t, 72.2, 0.5));
    const rodFade = live ? ease(ramp(t, 65.17, 0.2)) * (1 - ease(ramp(t, 74.47, 0.6))) : 0;
    rods.forEach((r, i) => {
      const g = easeOut(ramp(t, 65.17 + i * 0.22, 0.9));
      r.rod.style.width = (r.n * U * g).toFixed(1) + "px";
      const np = easeOutBack(ramp(t, 67.3 + i * 0.2, 0.4), 2.2);
      r.num.style.opacity = clamp(ramp(t, 67.3 + i * 0.2, 0.12)).toFixed(3);
      r.num.style.transform = `scale(${lerp(0.4, 1, np).toFixed(3)})`;
      show(r.row, rodFade * rodsOut);
      if (i === 1) r.row.classList.toggle("lit", t >= 69.42);
      if (i === 4) r.rod.style.filter = `brightness(${(1 + 0.25 * pulse(t, 69.6, 0.5)).toFixed(3)})`;
    });
    const md = rods[1], html = rods[4];
    show(brace, rodFade * rodsOut * ease(ramp(t, 69.6, 0.4)), "");
    Object.assign(brace.style, { left: ROD_X + 54 * U + 150 + "px", top: ROD_Y + ROW_H + 42 + "px", height: 3 * ROW_H + "px" });
    show(rodSrc, rodFade * (1 - ease(ramp(t, 74.3, 0.3))));

    // 三张卡片
    three.forEach((c, i) => {
      const t0 = 72.34 + i * 0.55, on = easeOutBack(ramp(t, t0, 0.45), 1.8);
      const merge = easeInOut(ramp(t, 74.6, 0.8));
      const x = lerp(470 + i * 490, 960, merge), sc = lerp(0.7, 1, on) * lerp(1, 0.55, merge);
      c.classList.toggle("on", t >= t0);
      show(c, live ? ease(ramp(t, t0 - 0.05, 0.2)) * (1 - ease(ramp(t, 75.15, 0.25))) : 0,
        `translate(${x.toFixed(1)}px, 520px) translate(-50%, -50%) scale(${sc.toFixed(3)})`);
    });
    show(refs, live ? ease(ramp(t, 74.47, 0.3)) * (1 - ease(ramp(t, 76.2, 0.3))) : 0);
  }
  return { state };
}
