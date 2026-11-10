// DOM 小件：擦入、描线、数字滚动、手写、逐字落、章。沿用第十四/十五期的写法（状态全由外部 t 驱动，无内部时钟）。
// 画布上的东西（箭头、火花、DNA、奔跑者…）在 vec.js，这里只放要用到字体与排版的 DOM 件。
import { el, vis, clamp, easeOutBack } from "./lib.js";

/** wipe —— clip-path 擦入。k: 0(全遮) → 1(全露)。dir: 'left' 从左往右露｜'right' 从右往左露｜'up' 从下往上露 */
export function wipe(node, k, dir = "left") {
  const p = (1 - clamp(k)) * 100;
  const inset = dir === "right" ? `inset(0 0 0 ${p}%)`
    : dir === "left" ? `inset(0 ${p}% 0 0)`
      : dir === "up" ? `inset(${p}% 0 0 0)`
        : `inset(0 0 ${p}% 0)`;
  node.style.clipPath = inset;
  node.style.webkitClipPath = inset;
}

/** dash —— SVG 路径生长。k: 0 → 1 */
export function dash(node, k) {
  if (!node._len) {
    node._len = node.getTotalLength();
    node.style.strokeDasharray = node._len;
  }
  node.style.strokeDashoffset = (node._len * (1 - clamp(k))).toFixed(1);
  node.style.opacity = clamp(k * 12).toFixed(3);
}

/** odo —— 数字滚动。k: 0 → 1，返回字符串 */
export function odo(from, to, k, pad = 0) {
  const v = Math.round(from + (to - from) * clamp(k));
  return String(v).padStart(pad, "0");
}

/** typed —— 逐字打印：把 f(0..1) 映射为 full 的前 n 个字 */
export function typed(node, full, f) {
  const chars = Array.from(full);
  const n = Math.round(clamp(f) * chars.length);
  node.textContent = chars.slice(0, n).join("");
}

/**
 * handwrite —— 手写体逐字写出（霞鹜文楷），笔尖光标跟着写。accent 里的字标朱砂（.ac）。
 * 返回 { nodes, set(k) }；k 0→1 整段写完
 */
export function handwrite(parent, text, opt = {}) {
  const { accent = "" } = opt;
  parent.innerHTML = "";
  parent.style.position = "relative";
  const nodes = [];
  for (const c of Array.from(text)) {
    if (c === "\n") { parent.appendChild(document.createElement("br")); continue; }   // 手动断行，避免标点落行首
    const s = document.createElement("span");
    s.className = accent.includes(c) && !"。，、".includes(c) ? "hw ac" : "hw";
    s.textContent = c;
    s.style.cssText = "display:inline-block;white-space:pre;clip-path:inset(0 100% 0 0)";
    parent.appendChild(s);
    nodes.push(s);
  }
  const nib = document.createElement("span");
  nib.className = "nib";
  nib.style.cssText = "position:absolute;width:13px;height:13px;border-radius:50%;top:56%;margin-top:-7px;opacity:0;pointer-events:none";
  parent.appendChild(nib);
  return {
    nodes,
    set(k) {
      const n = nodes.length, cur = clamp(k) * n;
      nodes.forEach((node, i) => {
        const p = clamp(cur - i);
        node.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(1)}% 0 0)`;
      });
      const i = Math.min(n - 1, Math.floor(cur)), p = cur - i;
      const node = nodes[i];
      nib.style.opacity = k > 0.01 && k < 0.99 ? "1" : "0";
      nib.style.left = `${(node.offsetLeft + node.offsetWidth * p - 6).toFixed(1)}px`;
      nib.style.top = `${(node.offsetTop + node.offsetHeight * 0.56).toFixed(1)}px`;
    },
  };
}

/** glyphs —— 把一个短词拆成逐字 span，供「逐字落」用。返回 { nodes, set(k, per) } */
export function glyphs(parent, text, cls = "") {
  parent.innerHTML = "";
  const nodes = Array.from(text).map((c) => {
    const s = document.createElement("span");
    s.className = "gl " + cls;
    s.textContent = c;
    s.style.display = "inline-block";
    s.style.opacity = "0";
    parent.appendChild(s);
    return s;
  });
  return {
    nodes,
    set(k, per = 0.22) {
      nodes.forEach((n, i) => {
        const p = clamp(k - i * per);
        n.style.opacity = (p > 0 ? 1 : 0).toFixed(2);
        n.style.transform = `translateY(${((1 - easeOutBack(p)) * 12).toFixed(1)}px) scale(${(1 + 0.26 * (1 - p)).toFixed(3)})`;
      });
    },
  };
}

/** seal —— 小章（「类比」）。slap(f)：0..1 盖印，从 1.7 倍弹回 */
export function seal(parent, opt = {}) {
  const { x = 0, y = 0, size = 120, text = "类比", cls = "", rot = -10 } = opt;
  const root = el(text, "seal " + cls, parent,
    `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;line-height:${size}px;opacity:0`);
  return {
    root,
    slap(f) {
      const k = easeOutBack(clamp(f));
      vis(root, f > 0 ? 1 : 0, `rotate(${(rot * (1 - k)).toFixed(2)}deg) scale(${(1.7 - 0.7 * k).toFixed(3)})`);
    },
    hide() { vis(root, 0); },
  };
}
