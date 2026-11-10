// 入口：一段驱动 tween，每帧把 t 交给各段。所有画面状态都由 t 算出，可任意跳帧。
import { build } from "./world.js";
import { sections } from "./sections.js";
import { DUR } from "./beats.js";
import { ramp } from "./lib.js";

const hud = document.getElementById("hud");
const stage = document.getElementById("stage");

// 底纹层：靠 background-position 随 t 漂移，保证任何一帧都不是静止帧（纸纹呼吸）
const grain = document.createElement("div");
grain.className = "film-grain";
hud.appendChild(grain);

// 无旁白，字幕就是信息载体 → 默认烧进母版。要出无字幕版加 ?nocaps=1。
const SHOW_CAPS = !!window.__FORCE_CAPS || !/[?&]nocaps=1/.test(location.search);

/* ---------------- 字幕层（烧进母版） ---------------- */
const caps = [];
function buildCaps() {
  const list = window.CAPTIONS || [];
  for (const [t0, t1, text] of list) {
    const e = document.createElement("div");
    e.className = "cap";
    e.style.opacity = 0;
    e.style.visibility = "hidden";
    e.innerHTML =
      '<span class="capbox">' +
      text.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>") +
      "</span>";
    hud.appendChild(e);
    caps.push({ e, t0, t1 });
  }
}
function drawCaps(t) {
  if (!SHOW_CAPS) return;
  for (const c of caps) {
    const a = ramp(t, c.t0, 0.14) * (1 - ramp(t, c.t1 - 0.14, 0.14));
    c.e.style.opacity = a.toFixed(3);
    c.e.style.visibility = a > 0.004 ? "visible" : "hidden";
  }
}

/* ---------------- 场景 ---------------- */
const world = build();
const segs = sections(world);
buildCaps();

function frame(t) {
  world.setTurn(t);
  for (const s of segs) s.state(t);
  drawCaps(t);

  // 全片极缓的手持浮动：整个画面永远在极慢地呼吸，杜绝绝对静止帧
  const sway = Math.sin(t * 0.55);
  const bob = Math.sin(t * 0.37 + 0.8);
  stage.style.transformOrigin = "50% 50%";
  stage.style.transform =
    `translate3d(${(3.2 * bob).toFixed(2)}px,${(2.4 * sway).toFixed(2)}px,0) ` +
    `scale(${(1 + 0.012 * sway).toFixed(5)})`;

  grain.style.backgroundPosition = `${((t * 11) % 220).toFixed(1)}px ${((t * 23) % 220).toFixed(1)}px`;
  // 深色结尾页上把底纹压掉，否则软光叠出斑块
  grain.style.opacity = (0.15 - 0.15 * ramp(t, 81.0, 1.6)).toFixed(3);
}

/* ---------------- 驱动 ---------------- */
window.__timelines = window.__timelines || {};
const tl = (window.__timelines["main"] = gsap.timeline({ paused: true }));
const drv = { k: 0 };
tl.to(drv, { k: 1, duration: DUR, ease: "none", onUpdate: () => frame(drv.k * DUR) });
frame(0);

window.__DUR = DUR;
