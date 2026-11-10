// 总装：一条驱动 tween（0 → DUR），每帧调 frame(t)：各段摆物件和机位 → 后期 → 渲染 → HUD。
// 所有状态都是拍 n 的纯函数，可任意跳帧。
import { buildWorld } from "./world.js";
import { buildSections } from "./sections.js";
import { BEAT, DUR } from "./beats.js";
import { kick, Q_N, CARD_N } from "./score.js";
import { ramp } from "./lib.js";

await Promise.all(["900 200px NotoSerifSC", "900 200px NotoSC", "800 60px NotoSC", "600 36px NotoSC", "italic 900 200px NotoSerifSC"].map((f) => document.fonts.load(f, "害怕产品再不学淘汰")));

const world = buildWorld(document.getElementById("gl")), S = buildSections(world);
const hud = document.getElementById("hud");
hud.innerHTML = `<div class="band"></div><div class="mark"></div><div class="note"></div>
  <div class="card"><p>报警器、发动机是类比；广告页、项目页、价签均为示意。</p><p>调查据媒体报道，为相关关系；恐惧诉求研究多为健康与安全信息。</p><p class="warm">本片不构成心理或消费建议。持续的焦虑困扰，请寻求专业帮助。</p>
  <p class="src">Marchand 1985 · Nesse 2019 · Tannenbaum 等 2015</p><p class="src">腾讯调研 × 复旦大学 2026 · 中国消费者协会 2026</p><p class="src">Open Source Definition · 本片由代码生成，无实拍素材</p></div>
  <div class="question">上一次吓到你的那句话，<br><b>是谁写的？</b></div>`;
const band = hud.querySelector(".band"), note = hud.querySelector(".note"), mark = hud.querySelector(".mark"), card = hud.querySelector(".card"), question = hud.querySelector(".question");
const caps = window.CAPTIONS.filter((c) => c[4] !== "noshow").map(([t0, t1, s]) => { const el = document.createElement("div"); el.className = "caption"; el.innerHTML = s.replace(/<hi>/g, '<span class="hi">').replace(/<\/hi>/g, "</span>"); hud.appendChild(el); return { el, t0, t1 }; });
const show = (el, a, extra = "") => { el.style.opacity = a.toFixed(3); el.style.visibility = a > .002 ? "visible" : "hidden"; if (extra) el.style.transform = extra; };

function frame(t) {
  const n = t / BEAT, k = kick(n), fxv = { note: "", mark: "", zoom: 0, flash: 0 };
  world.begin();
  S.state(n, t, fxv);
  world.shake(k, t);
  world.fx.uniforms.uZoom.value = .13 * k + fxv.zoom;
  world.fx.uniforms.uAb.value = .003 + .02 * k;
  world.fx.uniforms.uFlash.value = fxv.flash;
  world.bloom.strength = .42 + .38 * k;
  world.render();
  for (const c of caps) show(c.el, ramp(t, c.t0, .1) * (1 - ramp(t, c.t1 - .1, .1)));
  band.style.opacity = (1 - ramp(n, CARD_N[1] - 1, 1)).toFixed(3);
  note.textContent = fxv.note; mark.textContent = fxv.mark;
  show(card, ramp(n, CARD_N[0] - .1, .5) * (1 - ramp(n, CARD_N[1] - .5, .4)), `translate(-50%, -50%) scale(${(1 + .004 * (n - CARD_N[0])).toFixed(4)})`);
  show(question, ramp(n, Q_N[0] - .1, .5), `translate(-50%, -50%) scale(${(1.14 - .14 * Math.min(1, (n - Q_N[0]) / .5) + .006 * Math.max(0, n - Q_N[0])).toFixed(4)})`);
}

const tl = gsap.timeline({ paused: true }), driver = { t: 0 };
tl.to(driver, { t: DUR, duration: DUR, ease: "none", onUpdate: () => frame(driver.t) });
window.__registerMainTimeline(tl);
window.__DUR = DUR; window.__renderFrame = frame; frame(0);
