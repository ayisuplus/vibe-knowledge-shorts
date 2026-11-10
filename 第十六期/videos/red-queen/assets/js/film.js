// 入口：一段驱动 tween，每帧把 t 交给各段。所有画面状态都由 t 算出，可任意跳帧。
import { build } from "./world.js";
import { sections } from "./sections.js";
import { DUR, B } from "./beats.js";
import { ramp, win } from "./lib.js";

const stage = document.getElementById("stage");
const hud = document.getElementById("hud");

// 无旁白，字幕就是信息载体 → 默认烧进母版。?nocaps=1 出无字幕版；?en=1 带英文对照。
const SHOW_CAPS = !!window.__FORCE_CAPS || !/[?&]nocaps=1/.test(location.search);
const SHOW_EN = /[?&]en=1/.test(location.search);

/* ---------------- 字幕层（烧进母版） ---------------- */
const caps = [];
function buildCaps() {
  for (const [t0, t1, text, en, flag] of window.CAPTIONS || []) {
    if (flag === "noshow") continue;            // 问句由 S6 自己画，只进 SRT
    const e = document.createElement("div");
    e.className = "cap";
    e.innerHTML = text.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>") +
      (SHOW_EN && en ? `<span class="en">${en}</span>` : "");
    hud.appendChild(e);
    caps.push({ e, t0, t1 });
  }
}
function drawCaps(t) {
  if (!SHOW_CAPS) return;
  for (const c of caps) {
    const a = ramp(t, c.t0, 0.16) * (1 - ramp(t, c.t1 - 0.16, 0.16));
    c.e.style.opacity = a.toFixed(3);
    c.e.style.visibility = a > 0.004 ? "visible" : "hidden";
  }
}

/* ---------------- 场景 ---------------- */
const world = build();
const segs = sections(world);
buildCaps();

function frame(t) {
  world.begin(t);                                       // 画布清屏
  world.backdrop(t);                                    // 星云 + 星尘（各段可在 state 里改 starA / nebA / warm）
  for (const s of segs) s.state(t);                     // 六段各画各的，窗口外自己关掉
  world.finish();                                       // 泛光
  world.mark(win(t, B(48), B(56), 0.5, 0.5));           // 「图为示意」：1973 论文页
  world.era(t);                                         // 顶中时代标签
  world.noteFlush();                                    // 注释带
  drawCaps(t);
  // 舞台上的 DOM 与画布同步极轻浮动，杜绝绝对静止帧
  stage.style.transform = `translate3d(${world.ox.toFixed(2)}px,${world.oy.toFixed(2)}px,0)`;
}

/* ---------------- 驱动 ---------------- */
window.__timelines = window.__timelines || {};
const tl = (window.__timelines["main"] = gsap.timeline({ paused: true }));
const drv = { k: 0 };
tl.to(drv, { k: 1, duration: DUR, ease: "none", onUpdate: () => frame(drv.k * DUR) });
frame(0);

window.__DUR = DUR;
