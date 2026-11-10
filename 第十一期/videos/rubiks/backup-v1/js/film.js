// 总装：一个 3D 世界、一颗魔方、一条连续机位。各段只根据 t 算状态，可任意跳帧。
// S0 开场（手 + 透明 3D 叠层）→ S1 结构 → S2 出身（本文件）→ S3–S6（late.js）。时刻都卡在配乐的节拍上。
import * as THREE from "three";
import { buildWorld, buildSet, buildDust } from "./world.js";
import { buildCube, schedule, invert, endOf } from "./cube.js";
import { L, moves as lateMoves, CAM as CAM_LATE, root as lateRoot, post as latePost, buildHud as lateHud, hud as lateHudState, camFinale, bloomAt, explodeAt } from "./late.js";
import { track, win, ramp, ease, easeIn, easeOut, easeInOut, easeOutBack, clamp, lerp, pulse, el, show } from "./lib.js";

await document.fonts.load("900 40px NotoSC"); await document.fonts.load("700 40px CMono");

// 配乐 cyber_2104 从源文件 8.0 秒处开始放：源 12.25 秒的满拍落在成片 4.248 秒（手里的光炸开）。
// 一拍 0.743 秒。下面的时刻都按「第几拍」写，snap 到网格上（半拍精度）。
export const BEAT = { b0: 4.248, ib: 0.743 };
const at = (k) => BEAT.b0 + k * BEAT.ib;
export const T = {
  open: 1.6, burst: at(0), assemble: at(1), title: at(1.5), rise: at(4), cut: at(5),
  s1: at(5), explode: at(7), labels: at(8.5), centers: at(11.5), collapse: at(13.5), spots: at(14.5), unspots: at(18.5), corner: at(20),
  s2: at(21.5), holo: at(22.5), fiddle: at(32), end: 32,
};
const PAT = {
  spots: "U D' R L' F B' U D'",
  cic: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
  fiddle: "R U R' U' F' L' U2 B D' R2 L U F2 D B' U' R",
};

const Wd = buildWorld(document.getElementById("gl"));
const set = buildSet(Wd.scene);
const dust = buildDust(Wd.scene);
const cube = buildCube({ look: "base" });
Wd.scene.add(cube.root);
const hand = document.getElementById("hand");

// 整片的转动表：先拧出六面点，快速还原，再拧魔中魔，然后「拨弄」
const SCH = [
  ...schedule(PAT.spots, T.spots, BEAT.ib / 2 - 0.04, 0.04),
  ...schedule(invert(PAT.spots), T.unspots, 0.085, 0.01),
  ...schedule(PAT.cic, at(22), BEAT.ib / 2 - 0.04, 0.04),
];
SCH.push(...schedule(PAT.fiddle, T.fiddle, BEAT.ib / 4 - 0.02, 0.02));
SCH.push(...lateMoves(PAT));

// ---------- 机位（S1 起，展台模式）----------
const CAM = [
  [T.cut, [0.0, 2.7, 6.2], [0, 2.4, 0]],
  [9.0, [6.8, 4.8, 10.6], [0.2, 2.2, 0]],
  [12.6, [9.4, 6.4, 13.4], [0.3, 2.1, 0]],
  [14.2, [-7.8, 5.6, 12.4], [0, 2.2, 0]],
  [17.6, [-5.8, 4.4, 10.6], [0, 2.3, 0]],
  [20.0, [6.4, 4.4, 10.8], [0.4, 2.3, 0]],
  [22.6, [3.6, 3.6, 10.4], [-2.0, 2.4, 0]],
  [27.6, [2.6, 3.2, 9.6], [-1.7, 2.4, 0]],
  [32.0, [-1.2, 4.0, 11.2], [-1.8, 2.3, 0]],
  ...CAM_LATE,
];
const camPos = track(CAM.map((k) => [k[0], k[1]])), camTgt = track(CAM.map((k) => [k[0], k[2]]));

// ---------- HUD ----------
const flash = el("", "flash", "hud"), ring = el("", "ring", "hud"), white = el("", "flash", "hud");
const TITLE = "魔方", SUB = "—— 上帝的玩具";
const ttl = el(`<b>${[...TITLE].map((c) => `<span>${c}</span>`).join("")}</b><i>${[...SUB].map((c) => `<span>${c}</span>`).join("")}</i>`, "ttl", "hud");
const tchars = [...ttl.querySelectorAll("span")];
const tags = [["角块", "×8", 3, 150, 300], ["棱块", "×12", 2, 1480, 520], ["中心块", "×6", 1, 1320, 150]].map(([n, k, kind, x, y]) => ({
  tag: el(`${n}<em>${k}</em>`, "tag", "hud", `left:${x}px;top:${y}px`), lead: el("", "lead", "hud"), dot: el("", "dot", "hud"), kind, x, y,
}));
const axisTag = { tag: el("十字轴", "tag", "hud"), lead: el("", "lead", "hud") };
const holo = el("1974", "holo", "hud", "left:90px;top:300px");
const holo2 = el("匈牙利 · 布达佩斯", "holo2", "hud", "left:110px;top:640px");
const day = el("", "day", "hud", "left:130px;top:150px");
const red = el("", "flash", "hud", "background:radial-gradient(closest-side, rgba(232,40,58,0) 40%, rgba(232,40,58,.45) 100%)");
const LH = lateHud();

// 字幕预览（?caps=1）。成片不烧字幕，交付 SRT
const SHOW_CAPS = /[?&]caps=1/.test(location.search);
const caps = SHOW_CAPS ? (window.CAPTIONS || []).map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt}</b>`, "cap2", "hud") })) : [];

// 飞入：每块从一个确定的方向飞进掌心
const hash = (i) => { let x = (i + 3) * 2654435761; x ^= x >>> 13; x = Math.imul(x, 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
const FLY = cube.cubies.map((c, i) => {
  const d = c.userData.home.clone().add(new THREE.Vector3(hash(i) - 0.5, hash(i + 40) - 0.5, hash(i + 80) - 0.5).multiplyScalar(1.4)).normalize();
  return { d, delay: hash(i + 120) * 0.22, spin: (hash(i + 160) - 0.5) * 8 };
});
// 魔方在展台上的朝向：S1 匀速自转；S2 转到「魔中魔」那个角（+x+y+z）正对镜头，再慢慢漂
const rotS1 = (t) => -0.35 + 0.22 * (t - T.cut);
const ROT_S2 = Math.atan2(3.6, 10.4) - Math.PI / 4 + Math.PI * 2;
const rotY = (t) => (t < T.s2 ? rotS1(t) : lerp(rotS1(T.s2), ROT_S2, easeInOut(ramp(t, T.s2, 2.2))) + 0.025 * Math.max(0, t - T.s2 - 2.2));
// 「拔角块」那一下：选当时离镜头最近的那个角块
const cornerIdx = (() => {
  const tc = T.corner + 0.4, cp = new THREE.Vector3(...camPos(tc)), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotY(tc));
  let best = -1, bd = 1e9;
  cube.cubies.forEach((c, i) => { if (c.userData.kind !== 3) return; const w = c.userData.home.clone().applyQuaternion(q).add(new THREE.Vector3(0, 2.3, 0)); const d = w.distanceTo(cp); if (d < bd) { bd = d; best = i; } });
  return best;
})();
const DIAG = cube.cubies[cornerIdx].userData.home.clone().normalize();
const qTmp = new THREE.Quaternion(), wp = new THREE.Vector3();

function placeTag(o, target, anchorRight) {
  const s = Wd.project(target);
  const r = o.tag.getBoundingClientRect();
  const ax = anchorRight ? r.right : r.left, ay = r.top + r.height / 2;
  const dx = s.x - ax, dy = s.y - ay;
  o.lead.style.left = ax + "px"; o.lead.style.top = ay + "px"; o.lead.style.width = Math.hypot(dx, dy) + "px";
  o.lead.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  if (o.dot) { o.dot.style.left = s.x + "px"; o.dot.style.top = s.y + "px"; }
}

function frame(t) {
  const stageMode = t >= T.cut;
  Wd.setTransparent(!stageMode);
  set.visible = stageMode; // 开场叠在视频上时不要布景
  dust.update(t);
  dust.pts.visible = true;

  // ---------- 手 ----------
  const bri = t < T.open ? 0.42 : t < T.burst ? lerp(0.42, 0.75, ease(ramp(t, T.open, T.burst - T.open))) : lerp(0.75, 1.08, easeOut(ramp(t, T.burst, 0.8)));
  hand.style.filter = `brightness(${bri.toFixed(3)}) contrast(1.06) saturate(${(0.85 + 0.2 * ease(ramp(t, T.burst, 0.8))).toFixed(3)})`;
  hand.style.opacity = t < T.cut ? "1" : "0";

  // ---------- 魔方 ----------
  let explode = 0, post = null;
  if (!stageMode) {
    Wd.setCam([0, 0, 10], [0, 0, 0], 32);
    const kr = easeIn(ramp(t, T.rise, T.cut - T.rise));
    cube.root.scale.setScalar(0.4 * (1 + 1.6 * kr));
    cube.root.position.set(-0.064, 0.637 + 0.9 * kr, 6.4 * kr);
    cube.root.rotation.set(0.52 - 0.3 * kr, -0.72 + 1.1 * t - 1.1 * T.burst, 0.06);
    cube.setGlow(lerp(0.9, 0.55, ease(ramp(t, T.assemble, 1))));
    post = (c, i) => {
      if (t < T.burst) { c.visible = false; return; }
      const f = FLY[i], k = easeOut(ramp(t, T.burst + f.delay, T.assemble - T.burst - 0.05));
      c.position.addScaledVector(f.d, 11 * (1 - k));
      if (k < 1) c.rotateOnAxis(f.d, f.spin * (1 - k));
    };
  } else {
    const [cp, ct] = camFinale(t, camPos(t), camTgt(t));
    Wd.setCam(cp, ct, 32);
    Wd.bloom.strength = bloomAt(t);
    cube.setGlow(0.55);
    const kd = easeOutBack(ramp(t, T.cut, 0.9), 1.2);
    cube.root.scale.setScalar(1);
    cube.root.position.set(0, lerp(3.6, 2.3, kd), 0);
    cube.root.rotation.set(0, rotY(t), 0);
    if (t >= L.s3) lateRoot(t, rotY(L.s3), cube.root);
    explode = easeInOut(ramp(t, T.explode, 0.9)) * (1 - easeInOut(ramp(t, T.collapse, 0.8)));
    if (t >= L.s3) explode = explodeAt(t);
    const kc = ease(ramp(t, T.centers, 0.5)) * (1 - ease(ramp(t, T.collapse - 0.3, 0.4)));
    const tw = t >= T.corner && t < T.s2;
    const lp = t >= L.s3 ? latePost(t) : null;
    post = lp || ((c, i) => {
      // 中心块：其他块缩没，中心块原地转一圈
      if (kc > 0 && c.userData.kind !== 1) c.scale.setScalar(Math.max(0.001, 1 - kc));
      else c.scale.setScalar(1);
      if (kc > 0 && c.userData.kind === 1) c.rotateOnAxis(c.userData.home.clone().normalize(), Math.PI * 2 * ease(ramp(t, T.centers + 0.4, 1.2)));
      // 拔出一个角块，转 120° 塞回去
      if (tw && i === cornerIdx) {
        const out = easeOut(ramp(t, T.corner, 0.3)) * (1 - easeIn(ramp(t, T.corner + 0.6, 0.22)));
        c.position.addScaledVector(DIAG, 1.1 * out);
        qTmp.setFromAxisAngle(DIAG, (Math.PI * 2 / 3) * ease(ramp(t, T.corner + 0.28, 0.3)));
        c.quaternion.premultiply(qTmp);
      }
    });
    Wd.coreLight.intensity = 6 * explode; Wd.coreLight.position.set(0, 2.3, 0);
  }
  cube.pose(SCH, t, { explode, spread: 0.95, post });
  Wd.render();

  // ---------- HUD：开场的光 ----------
  show(flash, pulse(t, T.burst - 0.05, 0.9), "");
  flash.style.background = `radial-gradient(circle at 948px 380px, rgba(255,255,255,${(0.95 * pulse(t, T.burst - 0.05, 0.9)).toFixed(3)}) 0, rgba(200,245,255,.35) 160px, rgba(0,0,0,0) 620px)`;
  const kr = ramp(t, T.burst, 0.9);
  show(ring, (1 - kr) * (kr > 0 ? 1 : 0), `translate(948px, 400px) scale(${lerp(0.3, 5.5, easeOut(kr)).toFixed(3)})`);
  show(white, Math.max(pulse(t, T.cut - 0.3, 0.7), 0.85 * pulse(t, L.slam - 0.08, 0.5)) * 0.9);
  white.style.background = "rgba(220,250,255,1)";
  // 标题：逐字带一点色差进场
  tchars.forEach((s, i) => {
    const k = ramp(t, T.title + i * 0.07, 0.35), o = ease(k) * (1 - ease(ramp(t, T.rise + 0.2, 0.4)));
    s.style.opacity = o.toFixed(3);
    const sp = (1 - easeOut(k)) * 10;
    s.style.transform = `translateX(${(18 * (1 - easeOut(k))).toFixed(1)}px)`;
    s.style.textShadow = sp > 0.3 ? `${sp.toFixed(1)}px 0 rgba(56,232,255,.8), ${(-sp).toFixed(1)}px 0 rgba(122,92,255,.7)` : "";
  });
  show(ttl, t >= T.title && t < T.cut ? 1 : 0);

  // ---------- HUD：爆炸图标签 ----------
  cube.root.updateMatrixWorld(true);
  tags.forEach((o, j) => {
    const a = T.labels + j * 0.45, ov = ease(ramp(t, a, 0.35)) * (1 - ease(ramp(t, T.centers - 0.3, 0.3)));
    for (const e of [o.tag, o.lead, o.dot]) show(e, ov);
    if (ov > 0) {
      // 取这一类里离标签最近的那块
      let best = null, bd = 1e9;
      for (const c of cube.cubies) if (c.userData.kind === o.kind) { c.getWorldPosition(wp); const s = Wd.project(wp); const d = Math.hypot(s.x - o.x, s.y - o.y); if (d < bd) { bd = d; best = wp.clone(); } }
      placeTag(o, best, o.x < 960);
    }
  });
  const oa = ease(ramp(t, T.labels + 1.5, 0.35)) * (1 - ease(ramp(t, T.collapse - 0.2, 0.3)));
  show(axisTag.tag, oa); show(axisTag.lead, oa);
  if (oa > 0) { const c = Wd.project(new THREE.Vector3(0, 2.3, 0)); axisTag.tag.style.left = c.x + 150 + "px"; axisTag.tag.style.top = c.y + 250 + "px"; placeTag(axisTag, new THREE.Vector3(0, 2.3, 0), false); }
  show(red, pulse(t, T.corner + 0.82, 0.7) * 0.9);

  // ---------- HUD：1974 ----------
  const oh = ease(ramp(t, T.holo, 0.8)) * (1 - ease(ramp(t, T.fiddle - 0.4, 0.5)));
  show(holo, oh, `translateY(${(20 * (1 - easeOut(ramp(t, T.holo, 0.8)))).toFixed(1)}px)`);
  show(holo2, ease(ramp(t, T.holo + 0.5, 0.6)) * (1 - ease(ramp(t, T.fiddle - 0.4, 0.5))));
  const od = ease(ramp(t, T.fiddle + 0.1, 0.3)) * (1 - ease(ramp(t, T.end - 0.4, 0.4)));
  show(day, od);
  if (od > 0) {
    const n = Math.min(32, 1 + Math.floor(31 * easeIn(ramp(t, T.fiddle + 0.2, 3.0))));
    day.innerHTML = `DAY ${String(n).padStart(2, "0")}${n >= 32 ? "<small>一个多月</small>" : ""}`;
  }
  lateHudState(t, LH, SCH);
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.12));
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
