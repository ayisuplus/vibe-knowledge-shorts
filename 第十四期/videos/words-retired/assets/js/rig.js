// 视觉装置：办公桌、公文纸、红章，以及 90 秒版新增的六个运动原语。
// 全部 DOM 件，状态由外部 t 纯函数驱动，无内部时钟、无累积量。
import { el, vis, clamp, easeOutBack } from "./lib.js";
import { PW, PH, PX, PY } from "./beats.js";

/** 桌面背景（只建一次，挂 #bg） */
export function buildDesk() {
  const bg = document.getElementById("bg");
  bg.innerHTML = '<div class="desk-grain"></div><div class="desk-vig"></div>';
}

/**
 * 一张标准公文纸，挂到 stage。
 * 返回 { root, set, hide, q }；默认隐藏。
 * 位置用设计坐标（默认居中），set 用 transform 做落纸/翻页/变灰。
 */
export function sheet(parent, opt = {}) {
  const {
    x = PX, y = PY, w = PW, h = PH, cls = "paper",
    html = "",
  } = opt;
  const root = el(html, cls, parent,
    `left:${x}px;top:${y}px;width:${w}px;height:${h}px;opacity:0`);
  return {
    root,
    q: (s) => root.querySelector(s),
    qa: (s) => [...root.querySelectorAll(s)],
    set(opt = {}) {
      const {
        o = 1, tx = 0, ty = 0, rot = 0, sx = 1, sy = 1, dead = false,
      } = opt;
      root.classList.toggle("dead", !!dead);
      vis(root, o, `translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${sx},${sy})`);
    },
    hide() { vis(root, 0); },
  };
}

/**
 * 红章。parent 可传纸的 DOM（坐标相对纸）或 stage。
 * opt: {x,y,size,text,sub,cls,rot}。slap(f)：0..1 盖印，从 1.7 倍弹回。
 */
export function seal(parent, opt = {}) {
  const {
    x = 0, y = 0, size = 200, text = "拟同意", sub = "",
    cls = "", rot = -12,
  } = opt;
  const root = el("", "seal " + cls, parent,
    `left:${x - size / 2}px;top:${y - size / 2}px;width:${size}px;height:${size}px;opacity:0`);
  root.innerHTML = (sub ? `<span class="sub">${sub}</span>` : "") + text;
  return {
    root,
    slap(f) {
      const k = easeOutBack(clamp(f));
      const sc = 1.7 - 0.7 * k;
      vis(root, f > 0 ? 1 : 0, `rotate(${(rot * (1 - k)).toFixed(2)}deg) scale(${sc.toFixed(3)})`);
    },
    set(o = {}) {
      const { o: op = 1, rot: r = 0, sx = 1 } = o;
      vis(root, op, `rotate(${r}deg) scale(${sx})`);
    },
    hide() { vis(root, 0); },
  };
}

/** 简单的透明度+位移驱动（给 HUD 文字块用） */
export function fade(e, o, ty = 0, tx = 0) {
  vis(e, o, `translate(${tx}px,${ty}px)`);
}

/* =========================================================
   90 秒版新增的运动原语
   ========================================================= */

/**
 * wipe —— clip-path 擦入/擦出。k: 0(完全遮住) → 1(完全露出)
 * dir: 'right' 从右往左露出（默认）｜'left' 从左往右｜'up' 从下往上
 */
export function wipe(node, k, dir = "right") {
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

/** odo —— 数字滚动。k: 0 → 1，返回字符串（补零到 pad 位） */
export function odo(from, to, k, pad = 4) {
  const v = Math.round(from + (to - from) * clamp(k));
  return String(v).padStart(pad, "0");
}

/** cam —— 镜头：把推近量折进纸的 sx/sy 与 ty，避免另建一层 transform */
export function cam(k, amount = 0.16, dy = -38) {
  return { sx: 1 + amount * k, sy: 1 + amount * k, dy: dy * k };
}

/**
 * particles —— 固定种子的散点，给断裂柱掉渣用。
 * 建一次，之后 update(k) 推进；k: 0 → 1 全落尽。
 */
export function particles(parent, opt = {}) {
  const { n = 6, seed = 7, spread = 26, fall = 120 } = opt;
  const root = el("", "pwrap", parent,
    "position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none");
  const dots = [];
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < n; i++) {
    const dx = (rnd() - 0.5) * spread * 2;
    const delay = rnd() * 0.5;
    const sc = 1 + rnd() * 1.4;
    const d = el("", "pdot", root,
      `position:absolute;left:50%;top:0;width:${(2 * sc).toFixed(1)}px;height:${(2 * sc).toFixed(1)}px;` +
      "border-radius:50%;background:#8a7a5c;opacity:0");
    dots.push({ d, dx, delay });
  }
  return {
    root,
    update(k, originX = 0, originY = 0) {
      root.style.visibility = k > 0.001 && k < 1 ? "visible" : "hidden";
      dots.forEach(({ d, dx, delay }) => {
        const p = clamp((k - delay) / (1 - delay || 1));
        const y = originY + fall * p * p;
        const o = p <= 0 || p >= 1 ? 0 : Math.min(1, p * 4) * (1 - p) * 3;
        d.style.opacity = clamp(o).toFixed(3);
        d.style.transform = `translate(${(originX + dx).toFixed(1)}px,${y.toFixed(1)}px)`;
      });
    },
    hide() { vis(root, 0); },
  };
}

const SVGNS = "http://www.w3.org/2000/svg";

/**
 * strike —— 一道手写笔划掉线（红笔），笔画沿路径写出、笔尖跟随。
 * 返回 { root, set(k) }；k 控制写出进度（0→1）
 */
export function strike(parent, opt = {}) {
  const { w = 260, rot = -14, color = "#b0231a", x = 0, y = 0 } = opt;
  const H = 44;
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("width", w + 28);
  svg.setAttribute("height", H);
  svg.style.cssText = `position:absolute;left:${x}px;top:${y - H / 2}px;overflow:visible;` +
    `transform-origin:0 50%;transform:rotate(${rot}deg);opacity:0`;
  const path = document.createElementNS(SVGNS, "path");
  path.setAttribute("d", `M6 ${H / 2 + 5} Q ${w * 0.28} ${H / 2 - 8}, ${w * 0.52} ${H / 2 + 1} T ${w + 4} ${H / 2 - 5}`);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "7");
  path.setAttribute("stroke-linecap", "round");
  const nib = document.createElementNS(SVGNS, "circle");
  nib.setAttribute("r", "5.5");
  nib.setAttribute("fill", color);
  svg.appendChild(path);
  svg.appendChild(nib);
  parent.appendChild(svg);
  const L = path.getTotalLength();
  path.style.strokeDasharray = L;
  return {
    root: svg,
    set(k) {
      const p = clamp(k);
      svg.style.visibility = p > 0.001 ? "visible" : "hidden";
      svg.style.opacity = p > 0.001 ? "1" : "0";
      path.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
      const pt = path.getPointAtLength(L * p);
      nib.setAttribute("cx", pt.x.toFixed(1));
      nib.setAttribute("cy", pt.y.toFixed(1));
      nib.style.opacity = p > 0.02 && p < 0.98 ? "1" : "0";
    },
    hide() { svg.style.opacity = "0"; },
  };
}

/**
 * penstrike —— 在一个行内文字块上划一道手写红线（「停止使用」那种）。
 * host 需要是 inline-block；SVG 铺满 host，笔画随手写。
 * 返回 { root, set(k) }
 */
export function penstrike(host, opt = {}) {
  const { color = "#b0231a" } = opt;
  host.style.position = "relative";
  const svg = document.createElementNS(SVGNS, "svg");
  svg.style.cssText = `position:absolute;left:-8px;top:-4px;width:calc(100% + 16px);height:calc(100% + 8px);` +
    `overflow:visible;opacity:0;pointer-events:none`;
  const path = document.createElementNS(SVGNS, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", color);
  path.setAttribute("stroke-width", "5");
  path.setAttribute("stroke-linecap", "round");
  svg.appendChild(path);
  host.appendChild(svg);
  let L = 0;
  return {
    root: svg,
    set(k) {
      const p = clamp(k);
      if (!L) {
        const w = host.offsetWidth, h = host.offsetHeight;
        path.setAttribute("d", `M4 ${h * 0.62} Q ${w * 0.3} ${h * 0.36}, ${w * 0.55} ${h * 0.6} T ${w - 2} ${h * 0.44}`);
        L = path.getTotalLength();
        path.style.strokeDasharray = L;
      }
      svg.style.visibility = p > 0.001 ? "visible" : "hidden";
      svg.style.opacity = p > 0.001 ? "1" : "0";
      path.style.strokeDashoffset = (L * (1 - p)).toFixed(2);
    },
    hide() { svg.style.opacity = "0"; },
  };
}

/**
 * handwrite —— 手写体逐字写出（霞鹜文楷金句用），笔尖光标跟着写。
 * text 里 accent 出现的字符标红（.ac）。
 * 返回 { nodes, set(k) }；k 0→1 整行写完
 */
export function handwrite(parent, text, opt = {}) {
  const { accent = "" } = opt;
  parent.innerHTML = "";
  parent.style.position = "relative";
  const nodes = Array.from(text).map((c) => {
    const s = document.createElement("span");
    s.className = accent.includes(c) && c !== "。" ? "hw ac" : "hw";
    s.textContent = c;
    s.style.cssText = "display:inline-block;white-space:pre;clip-path:inset(0 100% 0 0)";
    parent.appendChild(s);
    return s;
  });
  const nib = document.createElement("span");
  nib.style.cssText = "position:absolute;width:13px;height:13px;border-radius:50%;" +
    "background:#2a2419;top:56%;margin-top:-7px;opacity:0;pointer-events:none";
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
    },
  };
}

/**
 * scanner —— 一条扫描高亮带，从左/右扫过父容器。
 * 返回 { root, set(k, dir) }；k 0→1 全程扫完
 */
export function scanner(parent, opt = {}) {
  const { w = 220, color = "rgba(176,35,26,.10)", edge = "rgba(176,35,26,.35)" } = opt;
  const root = el("", "", parent,
    `position:absolute;top:-6%;height:112%;width:${w}px;left:0;opacity:0;pointer-events:none;` +
    `background:linear-gradient(90deg,${color},${edge},${color})`);
  return {
    root,
    set(k, dir = "right") {
      if (k <= 0 || k >= 1) { vis(root, 0); return; }
      const W = parent.clientWidth || 1920;
      const x = dir === "right" ? (W + w) * (1 - k) - w : -(W + w) * (1 - k);
      vis(root, Math.min(1, k * 6) * Math.min(1, (1 - k) * 6), `translateX(${x.toFixed(1)}px)`);
    },
    hide() { vis(root, 0); },
  };
}

/**
 * glyphs —— 把一个短词拆成逐字 span，供"逐字落 + 涟漪"用。
 * 返回 { nodes, set(k, per=0.22) }
 */
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
