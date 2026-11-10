// 总调度：镜头轨迹 + 各系统 + 把 3D 位置和实时数值交给 HUD。
import * as THREE from "three";
import { composer, bloom, camera, cameraRig, toScreen, pulse, smooth, win, TOPICS } from "./core.js";
import { funnel, funnelDrop, T, PHONE, MOUTH_Y, wr, shares, entropy, youAt } from "./world.js";
import { updatePeople } from "./people.js";
import { updateRain } from "./rain.js";
import { updateSpace, youRowAnchor, compAnchor } from "./space.js";
import { updatePipeline, updateStream, tagPos } from "./pipeline.js";
import { updateLoop, stationPos, cardCount, cardColorIndex } from "./loop.js";
import { updatePhoneCocoon, phoneCorner, explorePos } from "./phoneCocoon.js";

// 镜头关键帧：p = 环绕中心，az/el 角度，d 距离，sh 横移（正值把主体推到画面左侧）
const C0 = [0, -12, 0], PH = [0, -8.6, 0], LOOP = [0, 5.5, 0];
const rig = cameraRig([
  // S0 开场：俯视人群，片名在左
  { t: 0.0, p: C0, az: 20, el: 38, d: 62, sh: -14 },
  { t: 3.9, p: C0, az: 28, el: 36, d: 58, sh: -12 },
  { t: 4.6, p: C0, az: 30, el: 34, d: 52, sh: -4 },
  { t: 8.57, p: C0, az: 40, el: 30, d: 44 },
  { t: 10.69, p: C0, az: 44, el: 28, d: 36 },
  // S1 推近到你
  { t: 12.82, p: [0, -11.7, 0], az: 50, el: 18, d: 8 },
  { t: 16.9, p: [0, -11.7, 0], az: 58, el: 18, d: 7 },
  // S2 圈子
  { t: 19.2, p: C0, az: 66, el: 38, d: 42 },
  { t: 21.33, p: C0, az: 72, el: 42, d: 46 },
  { t: 25.58, p: C0, az: 80, el: 46, d: 50 },
  { t: 28.49, p: C0, az: 88, el: 55, d: 64 },
  { t: 31.6, p: [0, -10, 0], az: 92, el: 40, d: 66 },
  // S3 漏斗降下 → 你的记录 → 大表（38.34 硬切）→ 压成数字 → 星云
  { t: 31.95, p: [0, -6, 0], az: 94, el: 14, d: 62 },
  { t: 33.6, p: [0, -3, 0], az: 96, el: 10, d: 42 },
  { t: 35.0, p: PH, az: 98, el: 4, d: 9, sh: 2.2 },
  { t: 38.29, p: PH, az: 100, el: 4, d: 8.6, sh: 2.2 },
  { t: 38.34, p: [-24, 19.1, 0], az: 0, el: 0, d: 7 },
  { t: 39.6, p: [-6, 19, 0], az: 0, el: 0, d: 46 },
  { t: 40.46, p: [0, 19, 0], az: 0, el: 0, d: 44 },
  { t: 43.2, p: [0, 19, 0], az: 0, el: 2, d: 40 },
  { t: 45.5, p: [0, 19.5, 0], az: 30, el: 14, d: 26 },
  // S4 漏斗每层
  { t: 46.84, p: [0, 15, 0], az: 40, el: 10, d: 34 },
  { t: 51.0, p: [0, 11, 0], az: 52, el: 8, d: 44 },
  { t: 52.41, p: [0, 4.0, 0], az: 62, el: 12, d: 17 },
  { t: 54.27, p: [0, 2.2, 0], az: 66, el: 9, d: 15 },
  { t: 56.13, p: [0, 0.5, 0], az: 68, el: 7, d: 19, sh: 7 },
  { t: 63.58, p: [0, 0, 0], az: 72, el: 7, d: 19, sh: 7 },
  // S5 重排 → 落进手机 → 循环全景
  { t: 65.97, p: [0, -1.5, 0], az: 74, el: 6, d: 19, sh: 7 },
  { t: 69.42, p: [0, -5.5, 0], az: 76, el: 5, d: 15 },
  { t: 71.2, p: PH, az: 78, el: 3, d: 9 },
  { t: 73.6, p: LOOP, az: 84, el: 6, d: 72, sh: 6.5 },
  { t: 80.5, p: LOOP, az: 88, el: 6, d: 71, sh: 6.5 },
  { t: 87.21, p: LOOP, az: 94, el: 6, d: 70, sh: 6.5 },
  // S6–S7
  { t: 93.4, p: LOOP, az: 98, el: 6, d: 68, sh: 6.5 },
  { t: 99.0, p: LOOP, az: 104, el: 7, d: 70, sh: 6.5 },
  { t: 102.1, p: LOOP, az: 106, el: 7, d: 70, sh: -2.5 },
  { t: 106.35, p: LOOP, az: 108, el: 7, d: 68, sh: -2.5 },
  { t: 108.0, p: [0, -2, 0], az: 112, el: 6, d: 40, sh: 2 },
  { t: 110.61, p: PH, az: 142, el: 5, d: 21, sh: -4 },
  { t: 120.43, p: PH, az: 150, el: 5, d: 19, sh: -4 },
  // S8 破茧
  { t: 123.36, p: PH, az: 152, el: 5, d: 20, sh: -4 },
  { t: 127.87, p: PH, az: 156, el: 6, d: 24, sh: -4 },
  { t: 132.66, p: PH, az: 160, el: 5, d: 18, sh: -4 },
  { t: 140.1, p: PH, az: 163, el: 5, d: 19, sh: -4 },
  { t: 142.49, p: PH, az: 165, el: 6, d: 26, sh: -4 },
  { t: 146.5, p: LOOP, az: 168, el: 6, d: 70, sh: -2.5 },
  // S9 结尾
  { t: 150.99, p: [0, 4, 0], az: 172, el: 7, d: 70, sh: 5 },
  { t: 153.2, p: [0, 0, 0], az: 175, el: 5, d: 30 },
  { t: 157.11, p: PH, az: 180, el: 3, d: 7 },
  { t: 160.17, p: PH, az: 182, el: 4, d: 10.5 },
]);
const HITS = [[T.hook, 0.2], [T.title, 0.08], [T.b3, 0.06], [T.b4, 0.05], [T.funnelIn, 0.2], [T.table, 0.1], [T.sort, 0.12], [T.crack, 0.12], [T.land, 0.06]];
function shake(t) {
  let sx = 0, sy = 0;
  for (const [h, amp] of HITS) {
    const e = pulse(t, h, 9) * amp;
    sx += e * Math.sin((t - h) * 70); sy += e * Math.cos((t - h) * 55);
  }
  return [sx, sy];
}

// ---------- HUD ----------
const $ = (id) => document.getElementById(id);
function place(id, v, clamp = false) {
  const el = $(id);
  if (!el) return;
  const s = toScreen(v);
  // 需要时把标签收进画面安全区
  const x = clamp ? Math.min(Math.max(s.x, 80), 1920 - 380) : s.x;
  const y = clamp ? Math.min(Math.max(s.y, 120), 900) : s.y;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _you = new THREE.Vector3(), _r = new THREE.Vector3();
function placeScreen() {
  const el = $("screen-anchor");
  const tl = toScreen(phoneCorner(-1, 1, _a));
  const br = toScreen(phoneCorner(1, -1, _b));
  el.style.transform = `translate(${tl.x}px, ${tl.y}px) scale(${(br.x - tl.x) / 276}, ${(br.y - tl.y) / 585})`;
}
const barEls = [0, 1, 2, 3, 4].map((i) => $(`bar-${i}`));
const pEls = [0, 1, 2, 3, 4].map((i) => $(`p-${i}`));
const vecEls = [0, 1, 2, 3, 4].map((i) => $(`vbar-${i}`));
const feedEls = Array.from({ length: 12 }, (_, i) => $(`feed-${i}`));
const HEX = TOPICS.map((c) => `#${c.getHexString()}`);

function updateNumbers(t) {
  const ps = shares(t);
  if (t > T.bars - 0.5 && t < 152) {
    ps.forEach((p, i) => {
      barEls[i].style.transform = `scaleY(${p.toFixed(4)})`;
      pEls[i].textContent = p.toFixed(2);
    });
    $("h-value").textContent = entropy(ps).toFixed(2);
  }
  // 站③：你的数字串（5 类权重示意）
  if (t > T.loopStart && t < T.cocoon) ps.forEach((p, i) => (vecEls[i].style.transform = `scaleY(${(0.15 + 0.85 * p).toFixed(4)})`));
  if (t > T.ff - 0.5 && t < T.cocoon) {
    $("swipe-count").textContent = String(Math.floor(480 * smooth((t - T.ff) / (108 - T.ff))));
  }
  // 你的推荐页：最近 12 张，最新的在最上面
  if (t > T.deliver && t < 160) {
    const n = cardCount(t);
    feedEls.forEach((el, k) => {
      const idx = n - 1 - k;
      if (idx < 0) { el.style.opacity = "0"; return; }
      const c = HEX[cardColorIndex(idx)];
      el.style.opacity = "1";
      el.style.background = c;
      el.style.boxShadow = k === 0 ? `0 0 18px ${c}` : "none";
    });
  }
}

const TIER_PULSE = [[T.filter], [T.coarse], [T.fine, T.sort], [T.rerank]];

function renderAt(t) {
  rig(t, shake(t));
  funnel.group.position.y = funnelDrop(t);
  funnel.update({
    t, vis: t < T.funnel ? 0 : 1, revealAt: T.funnel, dim: 1, shockAt: T.funnelIn, tierPulse: TIER_PULSE, heroOn: false, heroY: 0,
    tierHold: [win(t, T.filter, T.coarse, 0.3, 0.3), win(t, T.coarse, T.fine, 0.3, 0.3), win(t, T.fine, T.rerank, 0.3, 0.3), win(t, T.rerank, T.deliver + 1, 0.3, 0.3)],
  });
  updatePeople(t);
  updateRain(t);
  updateSpace(t);
  updatePipeline(t);
  updateStream(t);
  updateLoop(t);
  updatePhoneCocoon(t);

  bloom.strength = 0.8 - 0.3 * win(t, T.table, T.filter, 0.5, 1) - 0.3 * win(t, T.loopStart + 1, T.collapse, 0.8, 0.8) - 0.3 * win(t, 145, 154, 0.5, 0.8)
    + 0.6 * pulse(t, T.hook, 4) + 0.25 * pulse(t, T.title, 5) + 0.4 * pulse(t, T.funnelIn, 4) + 0.3 * pulse(t, T.sort, 3) + 0.35 * pulse(t, T.crack, 3) + 0.4 * pulse(t, T.land, 3);

  // HUD 锚点
  place("rowlabel-anchor", youRowAnchor);
  place("vec-anchor", compAnchor);
  place("you-anchor", youAt(t, _you));
  for (let i = 0; i < 3; i++) place(`tag-anchor-${i}`, tagPos[i]);
  for (let i = 0; i < 3; i++) place(`src-anchor-${i}`, explorePos[i], true);
  for (let i = 0; i < 4; i++) place(`st-anchor-${i}`, stationPos[i]);
  _r.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
  place("funnel-anchor", _a.set(0, MOUTH_Y + funnelDrop(t), 0).addScaledVector(_r, wr(3.2) + 0.4));
  placeScreen();
  updateNumbers(t);

  composer.render();
}

window.addEventListener("hf-seek", (e) => renderAt(e.detail.time));
renderAt(window.__hfThreeTime || 0);
