// 视觉装置：跑道、跑步的人、及格线、仪表。
// 全部是「给一个时刻 / 一个参数，算出画面状态」的函数，没有任何内部时钟 —— 可以任意跳帧。
import { clamp, lerp } from "./lib.js";

export const C = {
  ink: "#05070b",
  belt: "#0b1017",
  steel: "#3c5a74",
  cyan: "#6fd3e8",
  cyanHi: "#b9f2ff",
  warn: "#ff6b35",
  warnHi: "#ff8f5e",
  text: "#eef4fa",
  dim: "#7f93a6",
  body0: "#e3edf8",
  body1: "#9db2c8",
  body2: "#36475a",
};

// 设计坐标系 → 屏幕：整台机器放大一点，略高于画面中心
const CX = 960, CY = 500, S = 1.14;

let _id = 0;
const uid = (p) => `${p}${_id++}`;

const NS = "http://www.w3.org/2000/svg";
export function mk(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/** 建一块画布：底层（机器）和顶层（人、标注）都挂在同一个 svg 里，顺序即层叠。 */
export function stage(parent = "stage") {
  const svg = mk("svg", { viewBox: "0 0 1920 1080", fill: "none" }, document.getElementById(parent));
  const defs = mk("defs", {}, svg);
  const g = mk("g", { transform: `translate(${CX} ${CY}) scale(${S}) translate(${-CX} ${-CY})` }, svg);
  return { svg, defs, g };
}

export function defsGlow(defs, std = 9) {
  const id = uid("glow");
  const f = mk("filter", {
    id, filterUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080,
  }, defs);
  mk("feGaussianBlur", { stdDeviation: std, result: "b" }, f);
  const m = mk("feMerge", {}, f);
  mk("feMergeNode", { in: "b" }, m);
  mk("feMergeNode", { in: "SourceGraphic" }, m);
  return `url(#${id})`;
}

export function defsSoft(defs, std = 5) {
  const id = uid("soft");
  const f = mk("filter", { id, filterUnits: "userSpaceOnUse", x: 0, y: 0, width: 1920, height: 1080 }, defs);
  mk("feGaussianBlur", { stdDeviation: std }, f);
  return `url(#${id})`;
}

export function defsBody(defs) {
  const id = uid("body");
  // userSpaceOnUse：整套身体共用一条自上而下的渐变，关节接缝才不会一个亮一个暗
  const lg = mk("linearGradient", {
    id, gradientUnits: "userSpaceOnUse", x1: 0, y1: -215, x2: 0, y2: 195,
  }, defs);
  mk("stop", { offset: 0, "stop-color": C.body0 }, lg);
  mk("stop", { offset: 0.5, "stop-color": C.body1 }, lg);
  mk("stop", { offset: 1, "stop-color": C.body2 }, lg);
  return `url(#${id})`;
}

/* ============================ 跑道 ============================ */
const BELT = { x0: 606, x1: 1314, top: 700, bot: 792, r: 46, cy: 746 };

export function machine(s, opt = {}) {
  const { defs, g } = s;
  const glow = defsGlow(defs);
  const soft = defsSoft(defs);
  const beltPath = `M${BELT.x0} ${BELT.top} L${BELT.x1} ${BELT.top} A${BELT.r} ${BELT.r} 0 0 1 ${BELT.x1} ${BELT.bot} L${BELT.x0} ${BELT.bot} A${BELT.r} ${BELT.r} 0 0 1 ${BELT.x0} ${BELT.top} Z`;
  const clipId = uid("beltclip");
  const cp = mk("clipPath", { id: clipId }, defs);
  mk("path", { d: beltPath }, cp);

  const root = mk("g", {}, g);

  // 地面光池
  mk("ellipse", { cx: 960, cy: 800, rx: 560, ry: 150, fill: C.cyan, opacity: 0.07, filter: soft }, root);

  // 机身 + 皮带
  mk("path", { d: beltPath, fill: C.belt, stroke: "#2b4258", "stroke-width": 2 }, root);
  const beltG = mk("g", { "clip-path": `url(#${clipId})` }, root);
  const slatWrap = mk("g", {}, beltG);
  const slats = [];
  for (let x = 514; x <= 1450; x += 46) {
    slats.push(mk("line", {
      x1: x, y1: BELT.top - 4, x2: x, y2: BELT.bot + 4,
      stroke: "#8fe3f5", "stroke-opacity": 0.55, "stroke-width": 2,
    }, slatWrap));
  }
  // 速度越高，节线越糊、光带越亮
  const smear = mk("rect", { x: BELT.x0 - 60, y: BELT.top, width: BELT.x1 - BELT.x0 + 120, height: 92, fill: "#8fe3f5", opacity: 0 }, beltG);

  // 上下沿的光
  mk("path", { d: `M${BELT.x0} ${BELT.top} L${BELT.x1} ${BELT.top}`, stroke: C.cyan, "stroke-width": 3, opacity: 0.9, filter: glow }, root);
  mk("path", { d: `M${BELT.x0} ${BELT.bot} L${BELT.x1} ${BELT.bot}`, stroke: C.cyan, "stroke-width": 2, opacity: 0.5 }, root);

  // 滚筒
  for (const cx of [BELT.x0, BELT.x1]) {
    mk("circle", { cx, cy: BELT.cy, r: BELT.r, fill: C.belt, stroke: C.steel, "stroke-width": 2.6 }, root);
    mk("circle", { cx, cy: BELT.cy, r: 8, fill: C.cyan, opacity: 0.8 }, root);
  }

  // 支腿
  mk("path", { d: "M640 792 L640 862 M1280 792 L1280 862", stroke: C.steel, "stroke-width": 3 }, root);
  mk("path", { d: "M606 862 L674 862 M1246 862 L1314 862", stroke: C.cyan, "stroke-width": 4, opacity: 0.75, filter: glow }, root);

  // 立柱 + 仪表
  mk("path", { d: "M470 862 L470 286", stroke: C.steel, "stroke-width": 4 }, root);
  mk("path", { d: "M436 862 L504 862", stroke: C.cyan, "stroke-width": 4, opacity: 0.55 }, root);
  mk("path", { d: "M470 792 L606 792", stroke: C.steel, "stroke-width": 3 }, root);
  const panel = mk("g", {}, root);
  mk("rect", { x: 452, y: 190, width: 216, height: 96, rx: 7, fill: "#0a1620", stroke: C.cyan, "stroke-width": 2.2 }, panel);
  mk("text", {
    x: 560, y: 226, "text-anchor": "middle", "font-family": "NotoSC",
    "font-size": 15, "letter-spacing": 7, fill: "#5b8fa8",
  }, panel).textContent = "跑道速度";
  const numT = mk("text", {
    x: 534, y: 272, "text-anchor": "middle", "font-family": "Consolas, monospace",
    "font-size": 62, "font-weight": 700, fill: "#9ff0ff", filter: glow,
  }, panel);
  const xT = mk("text", { x: 600, y: 272, "font-family": "Consolas, monospace", "font-size": 34, fill: "#5b8fa8" }, panel);
  xT.textContent = "×";
  mk("text", { x: 452, y: 310, "font-family": "NotoSC", "font-size": 17, fill: "#4e6b82" }, panel).textContent = opt.sub || "";

  return {
    g: root,
    panel,
    /** v: 0..1 的「速度」 —— 决定节线位移、糊化和数字 */
    speed(d, v) {
      slatWrap.setAttribute("transform", `translate(${-((d % 46 + 46) % 46)} 0)`);
      smear.setAttribute("opacity", (0.03 + 0.13 * clamp(v)).toFixed(4));
      slats.forEach((l) => l.setAttribute("stroke-opacity", (0.62 - 0.3 * clamp(v)).toFixed(3)));
    },
    readout(v, showX = true) {
      numT.textContent = v;
      xT.setAttribute("opacity", showX ? 1 : 0);
    },
    reveal(f) {
      root.style.opacity = clamp(f).toFixed(3);
      root.style.visibility = f > 0.002 ? "visible" : "hidden";
    },
  };
}

/* ============================ 人 ============================ */
// 关节式纸偶：每段是带圆头的粗线，靠给角度算坐标。侧视，面朝右。
// (x, y) 是**脚底接触点**（皮带表面），不是胯。胯的高度由当前这一步的最低脚自动反推，
// 所以脚永远踩在皮带上，不会浮空也不会插进带子里。
const G = {
  thigh: 92, shin: 90, foot: 46,
  upperArm: 66, foreArm: 60,
  shoulderY: -118, torsoW: 44,
  headX: 7, headY: -176, headR: 26,
};
const K = 1.12; // 骨骼长度 → 画面尺度

const pt = (o, len, deg) => [o[0] + Math.sin((deg * Math.PI) / 180) * len, o[1] + Math.cos((deg * Math.PI) / 180) * len];
const D2R = Math.PI / 180;

export function runner(s, x = 960, y = 700) {
  const { defs, g } = s;
  const body = defsBody(defs);
  const soft = defsSoft(defs);

  const root = mk("g", {}, g);
  const shadow = mk("ellipse", { cx: x, cy: y + 4, rx: 150, ry: 15, fill: "#000", opacity: 0.55, filter: soft }, root);
  const rig = mk("g", {}, root);
  const legs = mk("g", {}, rig);
  const upper = mk("g", {}, rig);

  const limb = (parent, w, o = 1) => mk("line", {
    stroke: body, "stroke-width": w, "stroke-linecap": "round", opacity: o,
  }, parent);
  const backThigh = limb(legs, 26, 0.86), backShin = limb(legs, 20, 0.86), backFoot = limb(legs, 13, 0.86);
  const frontThigh = limb(legs, 26), frontShin = limb(legs, 20), frontFoot = limb(legs, 13);
  const torso = limb(upper, G.torsoW);
  const backUpArm = limb(upper, 17, 0.86), backForeArm = limb(upper, 15, 0.86);
  const frontUpArm = limb(upper, 17), frontForeArm = limb(upper, 15);
  const neck = limb(upper, 20);
  const head = mk("circle", { cx: G.headX, cy: G.headY, r: G.headR, fill: body }, upper);

  const seg = (e, a, b) => {
    e.setAttribute("x1", a[0].toFixed(2)); e.setAttribute("y1", a[1].toFixed(2));
    e.setAttribute("x2", b[0].toFixed(2)); e.setAttribute("y2", b[1].toFixed(2));
  };
  const M = Math.PI;

  return {
    g: root,
    shadow,
    /**
     * phase：步态相位（0..1 为一整步）
     * lean：上身倾角（度），正数前倾
     * effort：0..1，越大摆幅越夸张
     */
    pose(phase, lean = 6, effort = 0.5) {
      const w = 2 * M * phase;
      const sw = lerp(26, 44, effort);
      const hip = [0, 0];
      const shoulder = [0, G.shoulderY];
      let lowest = -1e9;

      for (const [i, set] of [[0, [backThigh, backShin, backFoot]], [1, [frontThigh, frontShin, frontFoot]]]) {
        const ph = w + (i ? M : 0);
        const th = Math.sin(ph) * sw;
        const knee = pt(hip, G.thigh, th);
        const flex = 26 + 106 * Math.max(0, Math.sin(ph + 1.0));
        const sh = th - flex;
        const ankle = pt(knee, G.shin, sh);
        const footA = 90 + 0.35 * sh;
        const toe = pt(ankle, G.foot, footA);
        seg(set[0], hip, knee); seg(set[1], knee, ankle); seg(set[2], ankle, toe);
        lowest = Math.max(lowest, ankle[1], toe[1]);
      }

      // 胯的高度 = 脚底目标 - 最低那只脚（乘上整体缩放），保证永远踩实
      rig.setAttribute("transform", `translate(${x} ${(y - lowest * K).toFixed(2)}) scale(${K})`);
      upper.setAttribute("transform", `rotate(${lean})`);

      seg(torso, shoulder, hip);
      seg(neck, [G.headX - 2, G.headY + G.headR - 8], [0, G.shoulderY - 20]);

      for (const [i, set] of [[0, [backUpArm, backForeArm]], [1, [frontUpArm, frontForeArm]]]) {
        const ph = w + (i ? 0 : M);
        const up = -Math.sin(ph) * lerp(24, 42, effort) - 10;
        const elbow = pt(shoulder, G.upperArm, up);
        const fore = up + 116 + 12 * Math.sin(ph + 0.4);
        seg(set[0], shoulder, elbow);
        seg(set[1], elbow, pt(elbow, G.foreArm, fore));
      }

      shadow.setAttribute("rx", (150 - 14 * effort).toFixed(1));
      shadow.setAttribute("opacity", (0.55 - 0.12 * effort).toFixed(3));
    },
    reveal(f, dy = 0) {
      root.style.opacity = clamp(f).toFixed(3);
      root.style.visibility = f > 0.002 ? "visible" : "hidden";
      root.setAttribute("transform", dy ? `translate(0 ${dy})` : "");
    },
    /** 平移整人（走下跑道时用） */
    move(dx, dy = 0) {
      root.setAttribute("transform", `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`);
    },
  };
}

/* ============================ 及格线 ============================ */
export function baseline(s, opt = {}) {
  const { defs, g } = s;
  const glow = defsGlow(defs, 7);
  const x1 = opt.x1 ?? 300, x2 = opt.x2 ?? 1620;
  const root = mk("g", {}, g);
  const line = mk("line", {
    x1, y1: 0, x2, y2: 0,
    stroke: C.warn, "stroke-width": 2.4, "stroke-dasharray": "28 14", filter: glow,
  }, root);
  const label = mk("text", {
    x: x1, y: -24, "font-family": "NotoSC", "font-size": 20,
    "letter-spacing": 7, fill: C.warnHi,
  }, root);
  label.textContent = opt.text || "留在原地所需的努力";
  return {
    g: root,
    label,
    set(y) {
      line.setAttribute("y1", y);
      line.setAttribute("y2", y);
      label.setAttribute("y", y - 24);
    },
    /** f: 0..1 —— 从起点扫到终点，做「这条线是画出来的」 */
    sweep(f) {
      line.setAttribute("x2", lerp(x1, x2, clamp(f)).toFixed(1));
    },
    reveal(f) {
      root.style.opacity = clamp(f).toFixed(3);
      root.style.visibility = f > 0.002 ? "visible" : "hidden";
    },
  };
}

/* ============================ 小字条 / 标注 ============================ */
export function note(s, x, y, text, opt = {}) {
  const t = mk("text", {
    x, y, "text-anchor": opt.anchor || "start",
    "font-family": opt.font || "NotoSC",
    "font-size": opt.size || 34,
    "font-weight": opt.weight || 500,
    fill: opt.color || C.text,
    "letter-spacing": opt.ls || 0,
  }, s.g);
  t.textContent = text;
  return t;
}

/** 逐字浮现：返回 setter(f)，f 0..1 控制已显示的字数 */
export function typed(node, full, mode = "chars") {
  if (mode === "chars") {
    const chars = Array.from(full);
    return (f) => {
      const n = Math.round(clamp(f) * chars.length);
      node.textContent = chars.slice(0, n).join("");
    };
  }
  return (f) => { node.textContent = f > 0.5 ? full : ""; };
}
