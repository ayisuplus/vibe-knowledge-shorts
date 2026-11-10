// 七段。全片一条时间轴，每段只在自己的窗口里改世界；出了窗口必须把自己关掉。
// 所有节点都取在拍上（beats.js），连续运动（皮带、步态）保持平滑，不做抖动。
import { BEAT, BAR, B, BB, SEC, settle, beatNo } from "./beats.js";
import { el, vis, win, ramp, ease, lerp, clamp } from "./lib.js";

const C = {
  ink: "#05070b", cyan: "#6fd3e8", warn: "#ff8f5e", text: "#eef4fa",
  dim: "#7f93a6", body0: "#e3edf8",
};

/* ---------- 共用的文字件 ---------- */
function bigNumber(parent, css) {
  const e = el("", "block", parent, "position:absolute;font-family:CMono;font-size:150px;line-height:1;color:" + C.cyan + ";text-shadow:0 0 40px rgba(111,211,232,.45);" + css);
  return e;
}

/** 把 y 从 a 到 b 之间按台阶走：每级台阶落在给定的拍上，走完停住 */
function stepY(t, steps) {
  let y = steps[0][1];
  for (const [at, v, dur] of steps) {
    if (t >= at) y = lerp(y, v, ease(ramp(t, at, dur ?? 0.16)));
  }
  return y;
}

export function sections(world) {
  const worldRef = world;

  /* =========================================================
     S0 · 钩子  0 – 8.50
     先给他一个看不懂的动作：越跑越快，可脚下那根线也在升。
     ========================================================= */
  const s0 = {
    state(t) {
      const [a, b] = SEC.hook;
      if (t < a || t > b) return;
      const k = ease(ramp(t, a, 4.2));           // 速度爬升
      const push = clamp(k);
      worldRef.tick(t, {
        effort: lerp(0.35, 0.95, push),
        lean: lerp(5, 15, push),
        mDim: 1, rDim: 1, dim: 1,
      });
      // 线：脚踝起步，第 2/3/4 小节各抬一格（都在小节头一拍上）
      worldRef.bl.sweep(ease(ramp(t, BB(1) + BEAT, 0.55)));
      worldRef.bl.reveal(ease(ramp(t, BB(1) + BEAT, 0.35)));
      worldRef.bl.label.style.opacity = "0";
      worldRef.bl.set(stepY(t, [
        [BB(1) + BEAT, 640, 0.2],
        [BB(2), 566, 0.22],
        [BB(3), 470, 0.22],
        [BB(3) + 2 * BEAT, 396, 0.22],
      ]));
    },
  };

  /* =========================================================
     S1 · 片名  8.50 – 12.75
     ========================================================= */
  const title = el("", "block", "hud",
    "position:absolute;left:0;right:0;top:300px;text-align:center;font-family:SerifSC;font-weight:900;opacity:0");
  title.innerHTML =
    `<div style="font-size:132px;line-height:1.14;letter-spacing:.05em;color:${C.text}">社会进步了</div>` +
    `<div style="font-size:118px;line-height:1.16;letter-spacing:.05em;color:${C.text};margin-top:8px">为什么我<span style="color:${C.warn}">反而更累</span></div>`;
  const titleGlow = el("", "block", "hud",
    "position:absolute;left:0;right:0;top:250px;height:520px;opacity:0;pointer-events:none;" +
    "background:radial-gradient(52% 46% at 50% 46%,rgba(5,7,11,.94),rgba(5,7,11,.72) 52%,transparent 78%)");

  const s1 = {
    state(t) {
      if (t < SEC.title[0] || t > SEC.title[1]) { vis(title, 0); vis(titleGlow, 0); return; }
      const a = win(t, SEC.title[0] + 0.35, SEC.title[1] - 0.30, 0.30, 0.45);
      vis(titleGlow, a * 0.95);
      vis(title, a);
      worldRef.tick(t, { effort: 0.8, lean: 12, mDim: 0.16, rDim: 0.22, dim: 1 });
    },
  };

  /* =========================================================
     S2 · 红皇后即位  12.75 – 29.75（全片最重）
     地面换成棋盘：不是你跑得不够，是这条律本身。
     ========================================================= */
  const qbox = el("", "block", "hud", "position:absolute;left:150px;top:290px;width:1120px;opacity:0");
  qbox.innerHTML =
    `<div style="border-left:2px solid ${C.warn};padding-left:34px">` +
    `<div style="font-family:SerifSC;font-weight:700;font-size:62px;line-height:1.34;color:${C.text}">“It takes all the running you can do,<br>to keep in the same place.”</div>` +
    `<div style="font-family:NotoSC;font-size:34px;margin-top:26px;letter-spacing:.04em;color:#cfe0ee">你必须拼命奔跑，才能留在原地。</div>` +
    `<div style="font-family:NotoSC;font-size:20px;margin-top:22px;letter-spacing:.12em;color:${C.dim}">刘易斯·卡罗尔《爱丽丝镜中奇遇》1871 · 第二章 · 红皇后</div>` +
    `</div>`;

  const nameBox = el("", "block", "hud", "position:absolute;left:150px;top:300px;opacity:0");
  nameBox.innerHTML =
    `<div style="font-family:NotoSC;font-size:24px;letter-spacing:.5em;color:#7fb9d0">1973 · 进化生物学</div>` +
    `<div style="font-family:SerifSC;font-weight:900;font-size:118px;line-height:1.1;letter-spacing:.03em;color:${C.text};margin-top:14px">红皇后效应</div>` +
    `<div style="font-family:NotoSC;font-size:30px;letter-spacing:.06em;color:#b7d2e2;margin-top:6px">The Red Queen Effect</div>` +
    `<div style="width:120px;height:3px;background:${C.warn};margin:30px 0 24px"></div>` +
    `<div style="font-family:NotoSC;font-size:22px;letter-spacing:.06em;color:${C.dim}">范瓦伦（Leigh Van Valen）·《进化理论》第 1 卷 1–30 页</div>`;

  const s2 = {
    state(t) {
      const [a, b] = SEC.queen;
      if (t < a - 0.4 || t > b + 0.4) { vis(qbox, 0); vis(nameBox, 0); return; }
      const on = settle(t, a, 0.5) * (1 - settle(t, b - 0.45, 0.45));
      const qa = win(t, a + 0.55, B(31), 0.45, 0.5);      // 13.3 → 16.46
      const na = win(t, B(36) + 0.2, b - 0.5, 0.4, 0.45); // 19.3 → 29.25
      vis(qbox, qa * on);
      vis(nameBox, na * on);
      worldRef.tick(t, {
        effort: 0.55, lean: 8,
        mDim: 0.38, rDim: 1 * on, dim: on,
        x: 960 + 460 * ease(ramp(t, a + 0.15, 0.55)) * (1 - ease(ramp(t, b - 0.75, 0.55))),
      });
    },
  };

  /* =========================================================
     S3 · 举证一 · 及格线  29.75 – 46.74
     ========================================================= */
  const s3 = {
    state(t) {
      const [a, b] = SEC.line;
      if (t < a - 0.3 || t > b + 0.3) { worldRef.bl.reveal(0); return; }
      worldRef.bl.sweep(ease(ramp(t, a + 0.35, 0.6)));
      worldRef.bl.reveal(ease(ramp(t, a + 0.35, 0.3)));
      worldRef.bl.label.style.opacity = ease(ramp(t, B(59), 0.4)).toFixed(3);
      // 一格一拍地往上走
      worldRef.bl.set(stepY(t, [
        [a + 0.35, 640, 0.2],
        [B(60), 566, 0.20],
        [B(64), 470, 0.20],
        [B(69), 396, 0.20],
        [B(73), 352, 0.22],
        [B(80), 320, 0.22],
      ]));
      const push = ease(ramp(t, B(70), 4.4));
      worldRef.tick(t, {
        effort: lerp(0.5, 0.98, push),
        lean: lerp(9, 16, push),
        mDim: 1, rDim: 1, dim: 1,
      });
    },
  };

  /* =========================================================
     S4 · 举证二 · 工时的账  46.74 – 63.74
     先给一个对我不利的数字（确实进步了），再给三根条。
     ========================================================= */
  const numBox = el("", "block", "hud", "position:absolute;right:150px;top:250px;text-align:right;opacity:0");
  numBox.innerHTML =
    `<div class="nv" style="font-family:CMono;font-size:172px;line-height:1;color:${C.cyan};text-shadow:0 0 44px rgba(111,211,232,.45)">3000</div>` +
    `<div style="font-family:NotoSC;font-size:24px;letter-spacing:.16em;color:${C.dim};margin-top:14px">1870 年代 · 德国 · 每年工作小时</div>`;
  const numVal = numBox.querySelector(".nv");

  const rows = [
    { nm: "凯恩斯设想 · 1930", v: 15.0, at: 56.0 },
    { nm: "美国私营部门 · 2026 年 9 月", v: 34.4, at: 59.4 },
    { nm: "中国企业就业人员 · 2024", v: 49.0, at: 60.5 },
  ];
  const barBox = el("", "block", "hud", "position:absolute;left:130px;top:300px;width:760px;opacity:0");
  barBox.innerHTML = `<div style="font-family:NotoSC;font-size:24px;letter-spacing:.34em;color:#5b8fa8;margin-bottom:30px">每周工作小时</div>` +
    rows.map((r) => `<div class="br" style="display:block;margin-bottom:26px;opacity:0">
      <div class="nm" style="font-family:NotoSC;font-size:24px;letter-spacing:.04em;color:#a9c0d4;margin-bottom:9px">${r.nm}</div>
      <div style="display:flex;align-items:center;gap:18px">
        <div class="bar" style="width:0"></div>
        <div class="vl">${r.v.toFixed(1)}<span style="font-size:18px;color:#5b8fa8;margin-left:5px">h</span></div>
      </div></div>`).join("");
  const barRows = [...barBox.querySelectorAll(".br")].map((e) => ({ e, bar: e.querySelector(".bar"), vl: e.querySelector(".vl") }));
  const MAXW = 520, SCALE = 50;

  const s4 = {
    state(t) {
      const [a, b] = SEC.hours;
      if (t < a - 0.4 || t > b + 0.4) { vis(numBox, 0); vis(barBox, 0); return; }
      const na = win(t, a + 0.75, B(97), 0.35, 0.4);   // 47.5 → 51.5
      const ba = win(t, B(100) - 0.2, b - 0.35, 0.5, 0.45); // 53.1 → 63.4
      vis(numBox, na);
      vis(barBox, ba);
      // 3000 → 1500：一拍跳一格，落点整齐
      const k = clamp((t - (a + 1.1)) / (B(97) - (a + 1.1)));
      const steps = Math.round(k * 8);
      numVal.textContent = Math.round(3000 - (3000 - 1500) * (steps / 8)).toString();
      worldRef.tick(t, { effort: 0.6, lean: 10, mDim: 0.55, rDim: 0.8, dim: 0.9 });
      rows.forEach((r, i) => {
        const kk = ease(ramp(t, r.at, 1.0));
        barRows[i].e.style.opacity = kk.toFixed(3);
        barRows[i].bar.style.width = (kk * (r.v / SCALE) * MAXW).toFixed(1) + "px";
        barRows[i].vl.style.opacity = kk.toFixed(3);
      });
    },
  };

  /* =========================================================
     S5 · 举证三 · 范围  63.74 – 76.49
     ========================================================= */
  const s5 = {
    state(t) {
      const [a, b] = SEC.rings;
      if (t < a - 0.4 || t > b + 0.4) return;
      const on = settle(t, a, 0.4) * (1 - settle(t, b - 0.5, 0.5));
      worldRef.tick(t, { effort: 0.85, lean: 13, mDim: 0, rDim: 1, dim: on });
    },
  };

  /* =========================================================
     S6 · 收  76.49 – 84.99
     减速、机器消失、暖光把人包住。
     ========================================================= */
  const glow = el("", "block", "hud",
    "position:absolute;inset:0;opacity:0;pointer-events:none;" +
    "background:radial-gradient(46% 52% at 50% 44%,rgba(255,216,172,.66),rgba(255,186,132,.18) 46%,transparent 74%)");

  const s6 = {
    state(t) {
      const [a, b] = SEC.out;
      if (t < a || t > b) { vis(glow, 0); return; }
      const mOut = 1 - ease(ramp(t, 78.6, 3.0));
      const g = ease(ramp(t, 78.6, 3.4));
      vis(glow, g);
      worldRef.tick(t, { effort: lerp(0.7, 0.28, ease(ramp(t, a, 3.4))), lean: lerp(11, 5, ease(ramp(t, a, 3.4))), mDim: mOut, rDim: 1, dim: 1 });
    },
  };

  return [s0, s1, s2, s3, s4, s5, s6];
}
