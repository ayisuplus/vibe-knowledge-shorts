// S5 假期悖论（61.44–76.59，两只沙漏，HUD）· S6 方法（76.59–87.21，日历墙一格格亮起）· S7 结尾（87.21–93.59）
import * as THREE from "three";
import { loadPhotos, photoCanvas, photoCard, dayIndex, CELL } from "./wall.js";
import { clamp, ramp, ease, easeOut, easeIn, easeOutBack, win, el, show, lerp } from "./lib.js";

export const START = 61.44, END = 93.59;
const T = {
  glass: 61.44, flow: 63.58, flip: 65.17, short: 69.42, long: 72.34, wall: 74.47,
  ask: 76.59, h1: 78.45, h2: 80.84, h3: 82.7, all: 85.34, end: 87.21, src: 91.46, fade: 91.8,
};
const WARM = ["mem-seaside", "mem-trip", "mem-concert", "kid-kite", "mem-snowtrip", "new-street", "mem-puppy", "kid-sea", "mem-wedding", "new-pottery", "mem-birthday", "kid-bike"];
const POOL = ["new-street", "new-pottery", "new-station", "mem-trip", "mem-seaside", "mem-concert", "mem-snowtrip", "mem-puppy", "mem-birthday", "mem-wedding", "mem-newyear", "mem-graduation", "kid-kite", "kid-sea", "kid-bike", "kid-snow"];
const HERO = [[10, 21, "new-street", "换一条路回家"], [11, 8, "new-pottery", "学一样新东西"], [11, 29, "new-station", "去一个没去过的地方"]];
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

// 一只沙漏（DOM）：玻璃外形 + 上下两个泡（clip-path 三角），沙子是照片
function hourglass(cls, sandImg) {
  const e = el(`
    <svg class="glass" viewBox="0 0 300 480"><rect x="0" y="0" width="300" height="20" rx="6"/><rect x="0" y="460" width="300" height="20" rx="6"/>
      <path d="M14 20 C14 120 132 176 142 240 C132 304 14 360 14 460 M286 20 C286 120 168 176 158 240 C168 304 286 360 286 460"/></svg>
    <div class="bulb top"><i class="sand" style="background-image:url(assets/img/${sandImg}.jpg)"></i></div>
    <div class="bulb bot"><i class="sand" style="background-image:url(assets/img/${sandImg}.jpg)"></i></div>
    <div class="bulb top pileb"><div class="pile"></div></div>
    <i class="stream"></i>`, `hg ${cls}`);
  return { e, top: e.querySelector(".top .sand"), bot: e.querySelector(".bot .sand"), pile: e.querySelector(".pile"), stream: e.querySelector(".stream") };
}

export async function build(W, { cal }) {
  const S = W.scene;
  const img = await loadPhotos(POOL, "assets/img/");
  const days = cal.days;

  // ---------- S5：两只沙漏 ----------
  const L = hourglass("l", "adult-desk"), R = hourglass("r", "mem-seaside");
  L.pile.innerHTML = `<img src="assets/img/adult-desk.jpg"><img src="assets/img/adult-subway.jpg">`;
  R.pile.innerHTML = WARM.map((n) => `<img src="assets/img/${n}.jpg">`).join("");
  const tagL = el(`难熬的一下午`, "tag cool"), tagR = el(`开心的一天`, "tag warm");
  const now = el(`过的时候`, "phase"), back = el(`回头看`, "phase back");
  const lineL = el(`难熬的日子，回头看<em>最短</em>`, "verdict"), lineR = el(`开心的日子，回头看<em>最长</em>`, "verdict");

  // ---------- S6：墙重新拼起来，一格格亮起 ----------
  const r1 = rng(31);
  const float = days.map(() => [lerp(-34, 34, r1()), lerp(-14, 16, r1()), lerp(-30, -8, r1()), r1() * 6, r1() * 6, r1(), r1()]);
  const heroIdx = HERO.map(([m, d]) => dayIndex(m, d));
  const pc = {};
  const sq = (n) => (pc[n] ||= photoCanvas(img[n], { aspect: 1, px: 384, border: 0.07 }));
  const heroCards = HERO.map(([, , n], k) => { const c = photoCard(sq(n), { w: CELL * 1.04, h: CELL * 1.04 }); c.position.copy(days[heroIdx[k]].pos).setZ(0.3); cal.group.add(c); return c; });
  // 85.34 成片亮起：从陶艺那格向外扩散
  const center = days[heroIdx[1]].pos;
  const lit = new Set(heroIdx);
  const r2 = rng(57);
  const extra = [];
  while (extra.length < 96) { const i = Math.floor(r2() * days.length); if (!lit.has(i)) { lit.add(i); extra.push(i); } }
  const maxD = Math.max(...extra.map((i) => days[i].pos.distanceTo(center)));
  const mass = extra.map((i, k) => {
    const c = photoCard(sq(POOL[k % POOL.length]), { w: CELL * 1.04, h: CELL * 1.04 });
    c.position.copy(days[i].pos).setZ(0.16); cal.group.add(c);
    return { c, i, t0: T.all + 0.05 + 1.5 * (days[i].pos.distanceTo(center) / maxD) + r2() * 0.15 };
  });
  const heroT = [T.h1, T.h2, T.h3];
  const heroTags = HERO.map(([, , , txt]) => el(txt, "tag hero"));
  const askPanel = el(``, "endpanel");
  const ask = el(`你上一个「第一次」，<br>是什么时候？`, "ending");
  const srcs = el(`参考：Stetson et al. 2007 · Avni-Babad &amp; Ritov 2003 · Wittmann &amp; Lehnhoff 2005 · Hammond《Time Warped》`, "refs");
  const fade = el(``, "fadeout");

  // ---------- 机位 ----------
  const sc = 1.12; // 85.34 后墙长大到的比例
  const P = (i, s = 1) => days[i].pos.clone().multiplyScalar(s);
  const [hs, hp, ht] = heroIdx.map((i) => P(i));
  const hpS = P(heroIdx[1], sc);
  const cam = [
    [73.6, [0, 1.2, 50], [0, 0.2, 0]],
    [T.ask, [0, 0.6, 39], [0, 0, 0]],
    [T.h1, [hs.x + 2.4, hs.y + 1.0, 13.5], [hs.x + 0.4, hs.y, 0]],
    [T.h2, [hp.x + 2.4, hp.y + 1.0, 13.5], [hp.x + 0.4, hp.y, 0]],
    [T.h3, [ht.x + 2.4, ht.y + 1.0, 13.5], [ht.x + 0.4, ht.y, 0]],
    [T.all + 0.3, [hpS.x - 8, hpS.y - 2, 21], [hpS.x - 3, hpS.y + 1.2, 0]],
    [T.end, [-2, 0.4, 40], [0, 0, 0]],
    [END, [0, 0.4, 48], [0, 0, 0]],
  ];

  function state(t) {
    // ================= S5 =================
    const on5 = t >= START && t < T.wall + 1.2;
    const out5 = 1 - ease(ramp(t, T.wall, 0.9));
    const pop = (k) => easeOutBack(ramp(t, START + k * 0.12, 0.5), 1.3);
    // 过的时候：左边慢慢漏，右边哗一下漏完
    const fl = ramp(t, T.flow - 0.6, 1.0);
    const lTop = lerp(0.82, 0.72, ramp(t, T.flow - 0.6, 4.2)), lBot = 0.82 - lTop;
    const rTop = lerp(0.82, 0, easeIn(ramp(t, T.flow - 0.4, 1.4))), rBot = 0.82 - rTop;
    const flip = ease(ramp(t, T.flip, 0.65));
    const after = ease(ramp(t, T.flip + 0.55, 0.5));
    [[L, lTop, lBot, 1], [R, rTop, rBot, 0]].forEach(([H, top, bot, slow], k) => {
      H.top.style.height = `${(top * 100).toFixed(2)}%`;
      H.bot.style.height = `${(bot * 100).toFixed(2)}%`;
      const flowing = fl > 0 && top > 0.01 && flip <= 0;
      H.stream.style.opacity = flowing ? (slow ? 0.6 : 1) : 0;
      H.stream.style.width = slow ? "3px" : "9px";
      H.top.parentNode.style.opacity = H.bot.parentNode.style.opacity = (1 - after).toFixed(3);
      H.pile.style.opacity = after.toFixed(3);
    });
    // 69.42 左边缩小变淡；72.34 右边放大发光
    const sL = ease(ramp(t, T.short, 0.6)), sR = ease(ramp(t, T.long, 0.6));
    const place = (H, x, k, extra) => show(H.e, on5 ? clamp(pop(k) * 1.4) * out5 * extra.o : 0,
      `translate(${x}px, 240px) rotate(${(180 * flip).toFixed(2)}deg) scale(${(1.32 * clamp(pop(k), 0, 1.2) * extra.s).toFixed(3)})`);
    place(L, 410, 0, { o: 1 - 0.5 * sL, s: 1 - 0.18 * sL });
    place(R, 1210, 1, { o: 1, s: 1 + 0.08 * sR });
    R.e.classList.toggle("glow", sR > 0.5);
    show(tagL, on5 ? ease(ramp(t, START + 0.3, 0.3)) * out5 * (1 - 0.5 * sL) : 0, `translate(560px, 70px) translateX(-50%)`);
    show(tagR, on5 ? ease(ramp(t, START + 0.42, 0.3)) * out5 : 0, `translate(1360px, 70px) translateX(-50%)`);
    show(now, on5 ? win(t, T.flow, T.flip, 0.25, 0.25) : 0, `translate(960px, 400px) translateX(-50%)`);
    show(back, on5 ? win(t, T.flip + 0.2, T.wall, 0.3, 0.4) : 0, `translate(960px, 400px) translateX(-50%)`);
    show(lineL, on5 ? win(t, T.short, T.wall, 0.3, 0.4) : 0, `translate(560px, 820px) translateX(-50%)`);
    show(lineR, on5 ? win(t, T.long, T.wall, 0.3, 0.4) : 0, `translate(1360px, 820px) translateX(-50%)`);

    // ================= S6 / S7：墙 =================
    if (t >= START) {
      const back = ease(ramp(t, T.wall, 1.6)); // 纸格从远处飞回墙上
      for (let i = 0; i < days.length; i++) {
        if (lit.has(i) && (heroIdx.includes(i) ? t >= heroT[heroIdx.indexOf(i)] : t >= (mass.find((m) => m.i === i)?.t0 ?? 1e9))) { cal.setTile(i, { a: 0 }); continue; }
        const f = float[i], p = days[i].pos, k = clamp(back * 1.15 - f[6] * 0.15);
        const e = ease(k);
        cal.setTile(i, {
          off: [(f[0] - p.x) * (1 - e), (f[1] - p.y) * (1 - e), f[2] * (1 - e)],
          rot: [f[3] * (1 - e), f[4] * (1 - e), f[5] * (1 - e)],
          s: lerp(1.1, 1, e), a: lerp(0.0, 1, ease(ramp(t, T.wall - 0.2, 0.5))),
        });
      }
      cal.commit();
      cal.setBoard(ease(ramp(t, T.wall + 0.6, 1.2)));
      const grow = ease(ramp(t, T.all + 0.4, 2.2));
      cal.group.scale.setScalar(lerp(1, sc, grow));
      cal.group.updateMatrixWorld();
    }
    heroCards.forEach((c, k) => {
      const a = easeOutBack(ramp(t, heroT[k], 0.45), 1.6);
      c.visible = t >= heroT[k];
      c.scale.setScalar(lerp(0.2, 1, clamp(a, 0, 1.3)) * (1 + 0.25 * ease(ramp(t, heroT[k], 0.6))));
      c.userData.setGlow(lerp(1.2, 0.8, ease(ramp(t, heroT[k] + 0.5, 1.5))));
      const q = W.project(new THREE.Vector3().copy(days[heroIdx[k]].pos).setZ(0.4).applyMatrix4(cal.group.matrixWorld).add(new THREE.Vector3(0, 0.9 * cal.group.scale.x, 0)));
      show(heroTags[k], win(t, heroT[k] + 0.1, T.end, 0.3, 0.4), `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) translate(-50%, -100%)`);
    });
    mass.forEach(({ c, t0 }) => {
      const a = easeOutBack(ramp(t, t0, 0.4), 1.6);
      c.visible = t >= t0;
      c.scale.setScalar(lerp(0.2, 1, clamp(a, 0, 1.3)));
      c.userData.setGlow(lerp(1.0, 0.5, ease(ramp(t, t0 + 0.3, 1.2))));
    });

    // ================= S7 =================
    show(askPanel, ease(ramp(t, T.end + 0.2, 0.8)) * 0.92);
    show(ask, ease(ramp(t, T.end + 0.3, 0.8)), `translateY(${lerp(24, 0, easeOut(ramp(t, T.end + 0.3, 0.8))).toFixed(1)}px)`);
    show(srcs, ease(ramp(t, T.src, 0.5)));
    show(fade, ease(ramp(t, T.fade, END - T.fade - 0.05)));
  }

  return { end: END, cam, state };
}
