// 总装：一条驱动 tween（0 → data-duration），每帧调 frame(t)：机位 → 各段 state(t) → 渲染 → HUD。
// 所有状态都是 t 的纯函数，可任意跳帧（S5 的「倒带」就是现场演示这一点）。
import * as THREE from "three";
import { ERA, C, CARD, SEC, DUR as FILM } from "./beats.js";
import { buildWorld, buildInstances } from "./world.js";
import { buildSections } from "./sections.js";
import { track, el, show, win, ramp, ease, labelPool } from "./lib.js";

await Promise.all(["700 46px NotoSC", "800 100px NotoSerifSC", "58px CascadiaMono", "60px WenKai"].map((f) => document.fonts.load(f)));

const world = buildWorld(document.getElementById("gl"));
const inst = buildInstances(world);
const S = buildSections(world, inst);
const parts = [S.s12, S.s3, S.s4, S.s5, S.s6].filter(Boolean);

// ---------- 机位：各段关键帧拼成一条单调三次轨道 ----------
const KEYS = parts.flatMap((p) => p.cam).sort((a, b) => a[0] - b[0]);
const camPos = track(KEYS.map((k) => [k[0], k[1]]));
const camTgt = track(KEYS.map((k) => [k[0], k[2]]));

// ---------- HUD ----------
const caps = window.CAPTIONS.filter((c) => c[3] !== "noshow").map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt}</b>`, "cap") }));
const eras = ERA.map(([t0, txt], i) => ({ t0, t1: i + 1 < ERA.length ? ERA[i + 1][0] : 1e9, e: el(txt, "era") }));
const notes = parts.flatMap((p) => p.notes || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(txt, "note") }));
const badges = parts.flatMap((p) => p.badge || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(txt, "badge") }));
const labels = parts.flatMap((p) => p.labels || []);
const pool = labelPool(labels.length, "lbl", world.project);
const secGlyph = el("秒", "secglyph");
// S5：本片自己的时间轴（倒带时播放头跟着场景时间走）
const MARKS = Object.values(SEC).map((s, i) => `<i style="left:${(s[0] / FILM) * 100}%"><em>${"①②③④⑤⑥"[i]}</em></i>`).join("");
const tlBar = el(`<div class="track">${MARKS}<b class="head"></b></div><span class="clock mono"></span>`, "timeline");
const tlHead = tlBar.querySelector(".head"), tlClock = tlBar.querySelector(".clock");
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
// S6：声明卡与问句
const card = el(`<div class="k">本片说明</div>
  <p>「宇宙是一段代码」是本片的<b>类比</b>，不是科学结论。</p>
  <p>Wheeler–DeWitt 方程是<b>候选框架</b>；Page–Wootters 是<b>假说</b>；2014 年光子实验是<b>示意</b>。</p>
  <p class="src">Newton 1687 · BIPM 1967 · Hafele &amp; Keating 1972 · Chou et al. 2010 · Ashby 2002 · DeWitt 1967 · Page &amp; Wootters 1983 · Moreva et al. 2014</p>`, "card");
const qq = window.CAPTIONS.find((c) => c[3] === "noshow");
const question = el(`<span>${qq[2]}</span>`, "question");

function frame(t) {
  const te = S.s5 ? S.s5.remap(t) : t;          // 场景时间：只有 S5 倒带时与 t 不同
  world.setCam(camPos(te), camTgt(te));
  for (const p of parts) p.state(te);
  world.render();

  for (const c of caps) show(c.e, win(t, c.t0 + 0.03, c.t1 - 0.13, 0.12, 0.12));   // 前一句淡完再出下一句，不叠字
  for (const e of eras) show(e.e, win(t, e.t0, e.t1, 0.5, 0.4));
  for (const n of notes) show(n.e, win(t, n.t0, n.t1, 0.4, 0.4));
  for (const b of badges) show(b.e, win(t, b.t0, b.t1, 0.3, 0.3));
  labels.forEach(([anchor, html, t0, t1], i) => { const o = win(t, t0, t1, 0.35, 0.35); pool.set(i, typeof html === "function" ? (o > 0.001 ? html(t) : "") : html, o > 0.001 ? anchor() : null, o, "", -100); });
  // 时间轴：C38 出现；C39 倒带时播放头跟着场景时间倒回；C40 再被拖一下，墨水不跟着回去
  const tlA = win(t, C[38].t0 + 0.3, C[40].t1, 0.4, 0.5);
  const drag = 0.05 * Math.sin(Math.PI * ramp(t, C[40].t0 + 1.2, 2.2));
  const f = (te < t - 0.01 ? te : t) / FILM - (t > C[40].t0 ? drag : 0);
  show(tlBar, tlA);
  if (tlA > 0.001) { tlHead.style.left = `${(f * 100).toFixed(3)}%`; tlClock.textContent = `${mmss(f * FILM)} / ${mmss(FILM)}`; }
  show(card, win(t, CARD.t0, qq[0] + 0.2, 0.6, 0.5), `translate(-50%, -50%) perspective(1600px) rotateY(${(-6 + 4 * ramp(t, CARD.t0, CARD.t1 - CARD.t0)).toFixed(2)}deg)`);
  show(question, win(t, qq[0], 1e9, 0.8, 0.1), `translate(-50%, -50%) scale(${(1 + 0.025 * ramp(t, qq[0], qq[1] - qq[0])).toFixed(4)})`);
  // 「秒」：从大钟中心放大推向镜头
  const sg = S.s12.sec, sk = ramp(t, sg.t0, sg.t1 - sg.t0);
  const sp = world.project(sg.anchor);
  show(secGlyph, win(t, sg.t0, sg.t1, 0.6, 0.6), `translate(${sp.x.toFixed(1)}px, ${sp.y.toFixed(1)}px) translate(-50%, -50%) scale(${(0.6 + 2.2 * ease(sk)).toFixed(3)})`);
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
