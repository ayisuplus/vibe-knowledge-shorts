// 一封信：整屏一张纸。左上角是抬头，左边一栏是正文（一块块流出来，旧的往上推、变淡），
// 右边 / 背景交给每封信自己的画面（vis）。big 块：正文栏淡出，这句单独放大居中。
import { win, ramp, ease, easeInOut, clamp, lerp, el, show } from "./lib.js";
import { stream, makeCaret, caretBlink } from "./text.js";

const Y0 = 270; // 当前块的顶边（正文栏内坐标）

export function letter(cfg, paper, vis) {
  const { t0, t1, head, blocks } = cfg;
  const root = el(`<div class="tex"></div>`, `scene paper ${paper}`);
  const bg = document.createElement("div"); bg.className = "bgl"; root.prepend(bg);
  const fade = document.createElement("div"); fade.className = "leftfade"; root.appendChild(fade);
  const right = document.createElement("div"); right.className = "right"; root.appendChild(right);
  const hd = stream(root, head, t0 + 0.05, { cls: "head serif", rate: 11 });
  hd.el.dataset.layoutAllowOverlap = ""; // 抬头下缘和正文栏顶部的渐隐区重叠几像素
  const wrap = document.createElement("div"); wrap.className = "colwrap"; root.appendChild(wrap);
  const col = document.createElement("div"); col.className = "col"; wrap.appendChild(col);
  const B = blocks.map(([t, txt, o = {}]) => ({ t, big: !!o.big, s: stream(o.big ? root : col, txt, t, { cls: o.big ? "big serif" : "blk serif" }) }));
  const caret = makeCaret();
  const tops = B.map((b) => (b.big ? 0 : b.s.el.offsetTop));
  const api = { root, bg, right, fade, B, t0, t1 };
  const V = vis ? vis(api) : null;

  function state(t) {
    // 后一封信盖在前一封上淡入；前一封等后一封完全不透明了才消失
    const o = win(t, t0 - 0.6, t1 + 0.62, 0.6, 0.01);
    show(root, o);
    if (o <= 0) return;
    hd.state(t);
    // 第几块在流
    let k = -1;
    for (let i = 0; i < B.length; i++) if (t >= B[i].t) k = i;
    // 滚动：每块开始时，把它推到 Y0
    let y = Y0 - tops[0], bigK = 0;
    const p = B.map((b, i) => (i === 0 ? 1 : easeInOut(ramp(t, b.t - 0.15, 0.75))));
    for (let i = 1; i < B.length; i++) if (!B[i].big) {
      // 找上一个非 big 块
      let j = i - 1; while (j >= 0 && B[j].big) j--;
      if (j >= 0) y -= p[i] * (tops[i] - tops[j]);
    }
    col.style.transform = `translateY(${y.toFixed(1)}px)`;
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      if (b.big) {
        bigK = Math.max(bigK, p[i]);
        b.s.el.style.opacity = (ease(ramp(t, b.t - 0.3, 0.5))).toFixed(3);
        b.s.state(t);
        continue;
      }
      // 后面第 1 块来了变淡到 .3，第 2 块来了消失
      let n1 = 0, n2 = 0, c = 0;
      for (let j = i + 1; j < B.length; j++) if (!B[j].big) { c++; if (c === 1) n1 = p[j]; if (c === 2) n2 = p[j]; }
      b.s.el.style.opacity = clamp(1 - 0.7 * n1 - 0.3 * n2).toFixed(3);
      b.s.state(t);
    }
    wrap.style.opacity = (1 - bigK).toFixed(3);
    // 光标：跟着正在流的那块；还没开始就停在抬头后面
    const host = k >= 0 ? B[k].s : hd;
    host.state(t, caret);
    caret.style.opacity = caretBlink(t, host.t1 + 0.15).toFixed(3);
    if (V) V(t, k);
  }
  return { state, api };
}

/** 背景照片：全屏铺满，慢推（Ken Burns），带一点暖调 */
export function plate(parent, src, cls = "") {
  const e = document.createElement("div");
  e.className = "plate " + cls;
  e.innerHTML = `<img src="${src}">`;
  e.style.visibility = "hidden";
  parent.appendChild(e);
  return e;
}
export function setPlate(e, o, s, x = 0, y = 0) {
  show(e, o);
  if (o > 0) e.firstChild.style.transform = `translate(${x}px, ${y}px) scale(${s.toFixed(4)})`;
}
