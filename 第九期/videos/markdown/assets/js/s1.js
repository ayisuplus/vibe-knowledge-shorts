// S1 片名 · 10.69–17.05（留白），外加那张 .md 纸的整个前半生（9.0–17.45）
// 9.0   纸在中心「啪」地出现（标签刚收进去），一圈粉光
// 10.69 纸上移、变小；片名像在编辑器里一个字一个字打出来：「# Markdown：AI 的最爱」
// 13.05 「# 」淡出收起，正文从常规体「渲染」成粗体大字（预告「两双眼睛」）
// 14.94 片名收小移到顶部；纸转正、回到中央、变大，准备打开
// 17.05 纸交给 S2 的文档面板（这里淡出）
import { clamp, lerp, ramp, ease, easeOut, easeInOut, easeOutBack, pulse, el, show } from "./lib.js";

const TITLE = "Markdown：AI 的最爱";

export function build() {
  const paper = el(`<i class="h">#</i><i class="l l1"></i><i class="l l2"></i><i class="l l3"></i><i class="l l4"></i><b>.md</b>`, "paper");
  const ring = el("", "ring", "hud");
  const title = el(`<span class="pre">#&nbsp;</span>${[...TITLE].map((c) => `<i>${c}</i>`).join("")}<span class="caret"></span>`, "title", "hud");
  const pre = title.querySelector(".pre"), chars = [...title.querySelectorAll("i")], caret = title.querySelector(".caret");
  const N = chars.length + 2; // 「#」「空格」也算打字的两下

  function state(t) {
    // ---- 纸 ----
    const pop = easeOutBack(ramp(t, 9.0, 0.6), 2.2);
    const up = easeInOut(ramp(t, 10.69, 0.9)), back = easeInOut(ramp(t, 14.94, 1.0)), grow = easeInOut(ramp(t, 16.2, 0.85));
    const y = lerp(lerp(470, 330, up), 470, back);
    const sc = (0.25 + 0.75 * pop) * lerp(lerp(1, 0.62, up), 1.15, back) * lerp(1, 1.7, grow);
    const sway = Math.sin((t - 9) * 1.1) * 14 * (1 - back);
    const o = t < 9.0 ? 0 : ease(ramp(t, 9.0, 0.12)) * (1 - ease(ramp(t, 17.05, 0.4)));
    show(paper, o, `translate(960px, ${y.toFixed(1)}px) translate(-50%, -50%) rotateY(${sway.toFixed(2)}deg) rotateX(${(sway * 0.25).toFixed(2)}deg) scale(${sc.toFixed(4)})`);
    const rk = pulse(t, 9.0, 0.9);
    show(ring, rk * 0.9, `translate(960px, 470px) translate(-50%, -50%) scale(${(0.6 + ramp(t, 9.0, 0.9) * 1.4).toFixed(3)})`);

    // ---- 片名 ----
    const typed = Math.floor(lerp(0, N + 0.999, ramp(t, 11.0, 1.7)));
    pre.style.opacity = typed >= 1 ? (1 - ease(ramp(t, 13.05, 0.45))).toFixed(3) : "0";
    pre.style.fontSize = lerp(1, 0, easeInOut(ramp(t, 13.2, 0.55))).toFixed(3) + "em";      // 收起「# 」，正文自然居中
    chars.forEach((c, i) => { c.style.visibility = typed >= i + 3 ? "visible" : "hidden"; });
    // 光标跟在最后一个打出来的字后面（没打出来的字只是隐藏，仍占位置，所以整行不会跳）
    const last = typed >= 3 ? chars[Math.min(chars.length, typed - 2) - 1] : pre;
    if (caret.previousSibling !== last) last.after(caret);
    const blinkOn = Math.floor((t - 11.0) * 2.4) % 2 === 0;
    caret.style.opacity = t > 10.9 && t < 13.0 && (t < 12.75 || blinkOn) ? "1" : "0";
    const render = easeInOut(ramp(t, 13.05, 0.75));
    title.style.fontWeight = Math.round(lerp(380, 900, render));
    title.style.letterSpacing = lerp(0, 6, render).toFixed(2) + "px";
    const top = easeInOut(ramp(t, 14.94, 0.95));
    const ty = lerp(660, 92, top), ts = lerp(1, 0.42, top) * lerp(1, 1.12, render);
    show(title, t < 10.95 ? 0 : 1 - ease(ramp(t, 16.45, 0.55)), `translate(960px, ${ty.toFixed(1)}px) translate(-50%, -50%) scale(${ts.toFixed(4)})`);
  }
  return { state };
}
