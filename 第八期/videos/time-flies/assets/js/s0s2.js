// S0 钩子（0.06–10.69）· S1 片名（10.69–17.05）· S2 不只是你（17.05–28.49）
import * as THREE from "three";
import { buildCalendar, loadPhotos, photoCanvas, photoCard, outline, emptyStrip, dayIndex, CELL } from "./wall.js";
import { clamp, ramp, ease, easeOut, easeIn, easeOutBack, win, el, show, lerp } from "./lib.js";

export const END = 28.49;
// 卡点（见分镜）
const T = { dive: 2.45, peel: 4.32, fast: 6.43, strip: 8.57, title: 10.69, recede: 14.94, s2: 17.05, dots: 21.33, light: 25.58, note: 27.7 };
// 去年能想起来的 9 天（示意）
const MEM = [[1, 29, "mem-newyear"], [2, 14, "mem-snowtrip"], [4, 5, "mem-puppy"], [5, 2, "mem-trip"], [6, 21, "mem-graduation"], [7, 26, "mem-concert"], [8, 9, "mem-seaside"], [9, 13, "mem-wedding"], [12, 31, "mem-birthday"]];
const AGES = [14, 25, 40, 60, 80, 94];
const STRIP_AT = new THREE.Vector3(0, 0, 6);

// 确定性伪随机
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function build(W) {
  const S = W.scene;
  const img = await loadPhotos(MEM.map((m) => m[2]), "assets/img/");

  // ---------- 日历墙 ----------
  const cal = buildCalendar(S);
  const days = cal.days;
  const TODAY = dayIndex(10, 17);
  const tp = days[TODAY].pos;
  const memIdx = MEM.map(([m, d]) => dayIndex(m, d));
  const isMem = new Set(memIdx);
  const ring = outline(1.16, 1.16, 0.07);
  ring.position.copy(tp).setZ(0.05);
  S.add(ring);

  // 剥落顺序：离「今天」越远越早；时间按 sqrt 排，越剥越快
  const r1 = rng(3);
  const order = days.map((d, i) => ({ i, d: d.pos.distanceTo(tp) + r1() * 6 })).sort((a, b) => b.d - a.d);
  const tPeel = new Float32Array(days.length), dir = [];
  order.forEach((o, k) => { tPeel[o.i] = T.peel + 0.08 + 3.85 * Math.sqrt(k / (days.length - 1)); });
  const r2 = rng(9);
  days.forEach(() => { const a = r2() * Math.PI * 2; dir.push([Math.cos(a), Math.sin(a), r2(), r2(), r2()]); });
  // S2 里飘在远处的纸格（纹理）
  const r3 = rng(21);
  const float = days.map(() => [lerp(-34, 34, r3()), lerp(-14, 16, r3()), lerp(-30, -8, r3()), r3() * 6, r3() * 6, r3()]);

  // ---------- 记忆照片 + 空胶片 ----------
  const strip = emptyStrip(MEM.length, { slot: 1.6, gap: 0.3, h: 2.3 });
  const stripG = new THREE.Group();
  stripG.add(strip.mesh);
  S.add(stripG);
  const cards = MEM.map(([, , name], k) => {
    const c = photoCard(photoCanvas(img[name], { aspect: 1, px: 512, border: 0.07 }), { w: CELL * 1.04, h: CELL * 1.04 });
    S.add(c);
    return { c, home: days[memIdx[k]].pos.clone().setZ(0.16) };
  });
  const SLOT_SCALE = 1.6 / (CELL * 1.04) * 0.98;
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), q0 = new THREE.Quaternion();

  // ---------- HUD ----------
  const panel = el(``, "panel");
  const big = el(`去年`, "big");
  const todayTag = el(`去年的今天`, "tag today");
  const stat365 = el(`365 天`, "stat");
  const stat9 = el(`365 天 <span>→</span> 能想起来的：9 天`, "stat");
  const note9 = el(`示意`, "note");
  const TITLE = "为什么一年比一年过得快？";
  const title = el([...TITLE].map((c) => `<i>${c}</i>`).join(""), "title");
  const tChars = [...title.querySelectorAll("i")];
  // S2
  const X = (age) => 150 + ((age - 14) / 80) * 1620;
  const ruler = el(``, "ruler");
  const ticks = AGES.map((a) => el(`${a} 岁`, "tick", `left:${X(a)}px`));
  const who = AGES.map((a) => el(`<img src="assets/img/portrait-${a}.jpg">`, "who"));
  const count = el(`<b>0</b><span>人</span>`, "count");
  const countB = count.querySelector("b");
  const fast = el(`「时间过得快」`, "fast");
  const src = el(`示意 · Wittmann &amp; Lehnhoff, 2005`, "src");
  // 499 个点：按年龄落进各自那一列（年龄分布、亮起比例都是示意）
  const r4 = rng(77);
  const colH = {};
  const dots = Array.from({ length: 499 }, () => {
    let age;
    do { age = 14 + Math.floor(r4() * 81); } while (age > 80 && r4() < 0.6);
    const h = (colH[age] = (colH[age] || 0) + 1) - 1;
    return { age, h, delay: T.dots + 0.05 + r4() * 3.1, on: r4() < 0.93, e: el(``, "dot") };
  });
  dots.forEach((d) => { d.x = X(d.age) - 6.5; d.y = 690 - 290 - d.h * 17; }); // 点阵底边在人像上方

  // ---------- 机位 ----------
  const cam = [
    [0, [6, 2.2, 38], [0.5, 0.3, 0]],
    [2.25, [tp.x + 3.2, tp.y + 1.6, 14], [tp.x + 0.2, tp.y, 0]],
    [3.2, [tp.x + 1.2, tp.y + 0.5, 5.6], [tp.x, tp.y, 0]],
    [4.3, [tp.x + 1.0, tp.y + 0.42, 5.0], [tp.x, tp.y, 0]],
    [6.2, [tp.x + 4, tp.y + 6, 30], [tp.x - 9, tp.y + 4, 0]],
    [8.4, [1.5, 2.2, 42], [0, 0.4, 2]],
    [10.0, [0, 0.4, 27], [0, -0.3, 6]],
    [14.9, [0.6, 0.3, 25], [0, -0.35, 6]],
    [17.05, [0, 0.9, 24], [0, 0.6, 0]],
    [END, [0, 1.1, 22.5], [0, 0.7, 0]],
  ];

  function state(t) {
    // ---------- 墙：剥落 / S2 的远处飘格 ----------
    const inS2 = t >= T.s2 - 0.4;
    for (let i = 0; i < days.length; i++) {
      if (isMem.has(i)) { cal.setTile(i, { a: 0 }); continue; }
      if (inS2) {
        const f = float[i], k = ease(ramp(t, T.s2 - 0.4, 1.2));
        const dt = t - T.s2;
        const p = days[i].pos;
        cal.setTile(i, { off: [f[0] - p.x, f[1] - p.y + dt * 0.18, f[2]], rot: [f[3] + dt * 0.1, f[4] + dt * 0.08, f[5]], s: 1.1, a: 0.32 * k * (1 - ramp(t, 43.0, 0.4)) });
        continue;
      }
      const p = ease(ramp(t, tPeel[i], 1.7)), d = dir[i];
      if (p <= 0) { cal.setTile(i); continue; }
      cal.setTile(i, {
        off: [d[0] * 1.6 * p, -7.5 * p * p + d[1] * 1.0 * p + 0.6 * p, 4.5 * p + d[2] * 2.2 * p],
        rot: [d[3] * 3 * p, d[4] * 3 * p, (d[2] - 0.5) * 2.4 * p],
        s: 1 - 0.3 * p, a: 1 - p * p,
      });
    }
    cal.commit();
    cal.setBoard(1 - ease(ramp(t, 6.6, 1.8)));
    // 「今天」的描边：2.45 闪一下，跟着今天那格一起没了
    const todayP = ramp(t, tPeel[TODAY], 0.6);
    ring.visible = t < tPeel[TODAY] + 0.6;
    ring.material.opacity = (0.75 + 0.25 * Math.sin(Math.max(0, t - T.dive) * 9) * win(t, T.dive, T.dive + 1.2, 0.05, 0.4)) * (1 - todayP);

    // ---------- 记忆照片：墙上 → 胶片 ----------
    // 胶片组：8.57 出现；S1 缓慢转；14.94 退远
    const sIn = ease(ramp(t, T.strip, 0.8));
    const rec = ease(ramp(t, T.recede, 2.0));
    stripG.position.set(STRIP_AT.x, STRIP_AT.y + 3.5 * rec, STRIP_AT.z - 16 * rec);
    stripG.rotation.set(0.05 * Math.sin(t * 0.5), 0.08 * Math.sin((t - T.strip) * 0.45) * ease(ramp(t, T.title, 1.5)), -0.03 * Math.sin(t * 0.3));
    stripG.scale.set(lerp(0.2, 1, sIn), 1, 1);
    const gone = 1 - ease(ramp(t, 16.3, 0.9));
    strip.mesh.material.opacity = sIn * (1 - 0.5 * rec) * gone;
    stripG.visible = sIn > 0 && gone > 0;
    stripG.updateMatrixWorld();
    cards.forEach(({ c, home }, k) => {
      const m = easeOut(ramp(t, T.strip + 0.12 + k * 0.07, 1.05));
      tmp.set(strip.slotX(k), 0, 0.04).applyMatrix4(stripG.matrixWorld);
      const grow = ease(ramp(t, 5.6, 2.2)); // 墙塌了，只剩这几张：放大、往前浮
      tmp2.copy(home).setZ(home.z + 1.2 * grow);
      c.position.lerpVectors(tmp2, tmp, m);
      c.position.z += Math.sin(Math.PI * m) * 2.2;
      c.quaternion.slerpQuaternions(q0, stripG.quaternion, m);
      c.scale.setScalar(lerp(1.15 + 1.1 * grow, SLOT_SCALE, m));
      c.userData.setGlow(lerp(0.85, 0.35, m) * (1 - 0.6 * rec));
      c.userData.setAlpha(gone);
    });

    // ---------- HUD：S0 ----------
    const a0 = win(t, -1, 8.35, 0.01, 0.4);
    show(panel, a0, `translate(0px, 0px)`);
    show(big, a0, `translate(110px, 60px)`);
    const q = W.project(tp.clone().add(new THREE.Vector3(0, 0.62, 0.2)));
    show(todayTag, win(t, T.dive, T.peel, 0.12, 0.3), `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) translate(-50%, -100%) scale(${(1 + 0.12 * easeOutBack(ramp(t, T.dive, 0.4)) - 0.12).toFixed(3)})`);
    stat365.style.transformOrigin = stat9.style.transformOrigin = "0 0";
    show(stat365, win(t, T.peel, T.fast, 0.2, 0.15), `translate(114px, 200px) scale(0.55)`);
    show(stat9, win(t, T.fast, 8.35, 0.2, 0.4), `translate(114px, 200px) scale(0.55)`);
    show(note9, win(t, T.fast, 8.35, 0.2, 0.4), `translate(118px, 290px)`);

    // ---------- HUD：S1 片名 ----------
    const tOut = 1 - ease(ramp(t, 16.55, 0.5));
    tChars.forEach((c, k) => {
      const a = ease(ramp(t, T.title + 0.15 + k * 0.09, 0.45));
      c.style.opacity = a.toFixed(3);
      c.style.transform = `translateY(${(1 - a) * 28}px)`;
    });
    const sh = ease(ramp(t, T.recede, 1.2));
    show(title, t >= T.title && t < T.s2 ? tOut : 0, `translate(0px, ${lerp(150, 70, sh)}px) scale(${lerp(1, 0.62, sh)})`);

    // ---------- HUD：S2 ----------
    const s2 = t >= T.s2 - 0.05 && t < END; // S3 一开场硬切
    show(ruler, s2 ? 1 : 0, `scaleX(${ease(ramp(t, T.s2, 0.7)).toFixed(4)})`);
    ticks.forEach((e, k) => show(e, s2 ? ease(ramp(t, T.s2 + 0.25 + k * 0.12, 0.3)) : 0));
    who.forEach((e, k) => {
      const a = easeOutBack(ramp(t, T.s2 + 0.35 + k * 0.16, 0.55), 1.3);
      show(e, s2 ? clamp(a * 1.5) : 0, `translate(${(X(AGES[k]) - 104).toFixed(1)}px, ${(512 + (1 - a) * 60).toFixed(1)}px) scale(${lerp(0.85, 1, clamp(a)).toFixed(3)})`);
    });
    let landed = 0;
    const lit = ramp(t, T.light, 1.3);
    for (const d of dots) {
      const k = ramp(t, d.delay, 0.55);
      if (k <= 0 || !s2) { show(d.e, 0); continue; }
      if (k >= 1) landed++;
      const y = lerp(-40, d.y, easeOut(k));
      const on = d.on && lit > (d.age - 14) / 80;
      if (d.e.classList.contains("on") !== on) d.e.classList.toggle("on", on);
      show(d.e, clamp(k * 3), `translate(${d.x.toFixed(1)}px, ${y.toFixed(1)}px)`);
    }
    countB.textContent = String(landed);
    show(count, s2 ? ease(ramp(t, T.dots, 0.3)) : 0);
    show(fast, s2 ? ease(ramp(t, T.light + 0.2, 0.35)) : 0, `scale(${(0.9 + 0.1 * easeOutBack(ramp(t, T.light + 0.2, 0.45))).toFixed(3)})`);
    show(src, s2 ? ease(ramp(t, T.note, 0.4)) : 0);
  }

  return { end: END, cam, state, cal };
}
