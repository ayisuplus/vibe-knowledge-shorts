// S3 坠落实验（28.49–43.38，HUD 为主）· S4 童年 vs 成年（43.38–61.44，3D 胶片 + 一叠照片）
import * as THREE from "three";
import { loadPhotos, photoCanvas, filmStrip, deck } from "./wall.js";
import { clamp, ramp, ease, easeOut, easeIn, easeOutBack, win, el, show, lerp, pulse } from "./lib.js";

export const START = 28.49, END = 61.44;
const T = {
  fall: 28.49, bars: 31.95, plus: 33.68, eye: 36.21, big1: 38.34, big2: 40.46, src3: 42.59,
  kid: 43.38, first: 46.84, adult: 48.96, slam: 52.41, cmp: 55.33, study: 56.13, src4: 58.4, vivid: 59.59,
};
const KID = ["kid-bike", "kid-sea", "kid-icepop", "kid-fan-melon", "kid-kite", "kid-firstday", "kid-snow", "kid-goldfish"];
const ADULT = ["adult-subway", "adult-desk", "adult-takeout", "adult-phone-night"];
const N = 365;
const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function build(W) {
  const S = W.scene;
  const img = await loadPhotos([...KID, ...ADULT], "assets/img/");

  // ---------- S4：童年胶片（从左后方甩到前面） ----------
  const strip = filmStrip(KID.map((n) => img[n]), {
    frames: 16, h: 2.9,
    path: (u) => new THREE.Vector3(-22 + 22.5 * u, 4.4 + 1.9 * Math.sin(u * Math.PI * 2.1) - 4.4 * u, -17 * (1 - u) ** 1.5 + 3),
  });
  S.add(strip);
  strip.userData.reveal(0);

  // ---------- S4：成年的一叠照片 ----------
  const cool = ADULT.map((n) => photoCanvas(img[n], { aspect: 1.5, px: 512, border: 0.05, cool: true }));
  const DK = deck(cool, N, { w: 3.6, h: 2.4 });
  DK.group.position.set(2.5, 0.2, 0.5);
  DK.group.rotation.set(0.18, 0.5, 0);
  S.add(DK.group);
  const r1 = rng(5);
  const jit = Array.from({ length: N }, () => [r1() - 0.5, r1() - 0.5, r1() - 0.5]);
  // 第 k 张落下的时刻：一开始一张一张，越来越快
  const arrive = Array.from({ length: N }, (_, k) => T.adult + 0.25 + 3.0 * Math.sqrt(k / (N - 1)));

  // ---------- HUD：S3 ----------
  const photo = el(`<img src="assets/img/fall-tower.jpg">`, "fallimg");
  const meter = el(`<i></i><b>31 米</b>`, "meter");
  const bars = el(`<div class="row"><span>实际</span><i class="b0"></i></div><div class="row"><span>事后回想</span><i class="b1"></i></div>`, "bars");
  const b0 = bars.querySelector(".b0"), b1 = bars.querySelector(".b1");
  const plus = el(`+36%`, "plus");
  const lcd = el(`<b>0</b>`, "lcd");
  const lcdB = lcd.querySelector("b");
  const lcdNote = el(`示意`, "note");
  const GX = 8, GY = 5;
  const grid = el(Array.from({ length: GX * GY }, (_, k) => `<i style="background-position:${((k % GX) / (GX - 1)) * 100}% ${(Math.floor(k / GX) / (GY - 1)) * 100}%"></i>`).join(""), "shards");
  const shards = [...grid.querySelectorAll("i")];
  const r2 = rng(13);
  const sj = shards.map(() => [r2() - 0.5, r2() - 0.5, r2() - 0.5]);
  const big1 = el(`时间没有变慢`, "bigline");
  const big2 = el(`是记下的东西<em>变多了</em>`, "bigline l2");
  const src3 = el(`Stetson, Fiesta &amp; Eagleman, 2007`, "src");
  // ---------- HUD：S4 ----------
  const tKid = el(`小时候的一个暑假`, "tag warm");
  const tFirst = el(`每一格都是第一次`, "tag");
  const tAdult = el(`长大后的一年`, "tag cool");
  const stat = el(`365 天 <span>→</span> 1 格`, "stat");
  stat.style.transformOrigin = "0 0";
  const study = el(`越重复，记得越短`, "study");
  const src4 = el(`Avni-Babad &amp; Ritov, 2003`, "src");
  const vivid = el(`最鲜明的记忆，大多是「第一次」`, "tag vivid");

  // ---------- 机位（S3 全屏 HUD 盖住 3D，这段时间镜头悄悄挪到 S4 开场位置） ----------
  const cam = [
    [42.9, [-6, 3.2, 12.5], [-15, 3.6, -9]],
    [T.kid, [-6, 3.2, 12.5], [-15, 3.6, -9]],
    [46.84, [-3.4, 2.6, 15.2], [-7, 2.2, -2]],
    [48.96, [-1.6, 2.3, 15.5], [-2.2, 1.4, 0]],
    [51.2, [2.2, 1.9, 11.5], [2.4, 1.1, 0.5]],
    [T.slam, [2.8, 1.7, 10.0], [2.5, 0.8, 0.5]],
    [T.cmp, [2.6, 1.8, 10.6], [2.3, 0.9, 0.5]],
    [57.0, [-1.0, 2.3, 16.5], [-1.6, 1.2, 0]],
    [END, [-0.4, 2.1, 15.8], [-1.4, 1.1, 0]],
  ];
  // 52.41 叠成一格：全片唯一一次轻微顿挫
  const camOff = (t) => {
    const k = ramp(t, T.slam, 0.32);
    if (k <= 0 || k >= 1) return [0, 0, 0];
    const a = Math.sin(k * Math.PI * 5) * (1 - k) * 0.09;
    return [a * 0.4, -a, 0];
  };

  function state(t) {
    // ================= S3 =================
    const on3 = t >= START && t < T.kid;
    // 照片：先全屏（镜头跟着往下落），31.95 缩成左边的卡片；38.34 全屏变淡做底；40.46 碎成很多格
    const shrink = ease(ramp(t, T.bars, 0.7)) * (1 - ease(ramp(t, T.big1, 0.6)));
    const kb = ramp(t, T.fall, 3.4);
    const fx = lerp(0, 90, shrink), fy = lerp(0, 150, shrink), fw = lerp(1920, 780, shrink), fh = lerp(1080, 520, shrink);
    const dim = ease(ramp(t, T.big1, 0.6));
    photo.style.cssText = `left:${fx}px;top:${fy}px;width:${fw}px;height:${fh}px;border-width:${(shrink * 8).toFixed(1)}px`;
    photo.firstChild.style.transform = `scale(${lerp(1.12, 1.0, ease(kb))}) translateY(${lerp(-3, 2, ease(kb))}%)`;
    show(photo, on3 ? (1 - 0.82 * dim) * (1 - ramp(t, T.big2, 0.25)) : 0);
    show(meter, on3 ? win(t, T.fall + 0.4, T.bars, 0.4, 0.3) : 0);
    meter.firstChild.style.transform = `scaleY(${ease(ramp(t, T.fall + 0.4, 0.8)).toFixed(3)})`;
    // 时间条：两条同时走，33.68 回想那条冲出去 36%
    const bIn = on3 ? win(t, T.bars + 0.3, T.big1, 0.3, 0.4) : 0;
    show(bars, bIn);
    const g = ease(ramp(t, T.bars + 0.45, 1.15));
    b0.style.width = `${(470 * g).toFixed(1)}px`;
    b1.style.width = `${(470 * g * (1 + 0.36 * easeOutBack(ramp(t, T.plus, 0.5), 1.2))).toFixed(1)}px`;
    show(plus, on3 ? win(t, T.plus, T.big1, 0.08, 0.4) : 0, `scale(${(1.4 - 0.4 * easeOut(ramp(t, T.plus, 0.3))).toFixed(3)})`);
    // 手腕上测视觉速度的小屏：数字闪得太快，看不清
    show(lcd, on3 ? win(t, T.eye, T.big1, 0.25, 0.3) : 0);
    show(lcdNote, on3 ? win(t, T.eye, T.big1, 0.25, 0.3) : 0, `translate(1490px, 840px)`);
    lcdB.textContent = String(Math.floor(((Math.sin(Math.floor(t * 30) * 12.9898) * 43758.5453) % 1 + 1) % 1 * 90 + 10));
    // 碎成一张张底片
    const sh = ease(ramp(t, T.big2, 0.9));
    show(grid, on3 && t >= T.big2 ? 0.22 + 0.2 * (1 - sh) : 0);
    shards.forEach((e, k) => {
      const j = sj[k];
      e.style.transform = `translate(${(j[0] * 40 * sh).toFixed(1)}px, ${(j[1] * 30 * sh).toFixed(1)}px) rotate(${(j[2] * 6 * sh).toFixed(2)}deg) scale(${(1 - 0.14 * sh).toFixed(3)})`;
    });
    show(big1, on3 ? win(t, T.big1, T.kid - 0.05, 0.3, 0.05) : 0, `translateY(${lerp(0, -70, ease(ramp(t, T.big2, 0.5))).toFixed(1)}px)`);
    show(big2, on3 ? win(t, T.big2, T.kid - 0.05, 0.3, 0.05) : 0, `translateY(${lerp(30, 0, easeOut(ramp(t, T.big2, 0.5))).toFixed(1)}px)`);
    show(src3, on3 ? ease(ramp(t, T.src3, 0.4)) : 0);

    // ================= S4 =================
    const on4 = t >= T.kid - 0.01 && t < END; // S5 一开场硬切
    strip.userData.reveal(on4 ? easeOut(ramp(t, T.kid, 2.2)) : 0);
    // 高光：46.84 扫一遍（每一格都是第一次），59.59 再扫一遍
    const sw1 = ramp(t, T.first, 1.8), sw2 = ramp(t, T.vivid, 1.5);
    const swing = sw2 > 0 ? sw2 : sw1;
    strip.userData.uHi.value = lerp(-0.05, 1.05, swing);
    strip.userData.uHiA.value = (sw2 > 0 ? pulse(t, T.vivid, 1.5) : pulse(t, T.first, 1.8)) * 1.2 + (t > T.first + 1.0 ? 0.0 : 0);
    // 一叠照片：一张张落下，52.41 压实
    const slam = easeOutBack(ramp(t, T.slam, 0.22), 1.4);
    const gap = lerp(0.011, 0.0013, clamp(slam, 0, 1.2));
    DK.group.visible = on4 && t >= T.adult;
    if (DK.group.visible) {
      DK.layout((k) => {
        const a = arrive[k], f = ramp(t, a - 0.45, 0.45);
        const home = [jit[k][0] * 0.07, jit[k][1] * 0.07, k * gap];
        if (f >= 1) return { pos: home, rot: [0, 0, jit[k][2] * 0.06] };
        if (f <= 0) return { pos: home, rot: [0, 0, 0], s: 0 };
        const e = easeIn(f);
        return {
          pos: [lerp(5.5 + jit[k][0] * 2, home[0], e), lerp(3.5 + jit[k][1] * 1.5, home[1], e) + Math.sin(Math.PI * e) * 0.8, lerp(3 + k * gap, home[2], e)],
          rot: [lerp(-0.5, 0, e), lerp(-0.7, 0, e), lerp(jit[k][2] * 1.4, jit[k][2] * 0.06, e)],
        };
      });
    }
    show(tKid, on4 ? win(t, T.kid + 0.3, END, 0.3, 0.3) : 0, `translate(250px, 150px)`);
    show(tFirst, on4 ? win(t, T.first, T.adult + 0.3, 0.3, 0.4) : 0, `translate(250px, 232px)`);
    show(tAdult, on4 ? win(t, T.adult, T.study, 0.3, 0.3) : 0, `translate(1390px, 830px)`);
    show(stat, on4 ? win(t, T.slam, T.vivid, 0.06, 0.3) : 0, `translate(640px, 150px) scale(${(0.75 * (1.25 - 0.25 * easeOut(ramp(t, T.slam, 0.3)))).toFixed(3)})`);
    show(study, on4 ? win(t, T.study, END, 0.3, 0.3) : 0, `translate(1290px, 300px) scale(${(0.92 + 0.08 * easeOutBack(ramp(t, T.study, 0.4))).toFixed(3)})`);
    show(src4, on4 ? ease(ramp(t, T.src4, 0.4)) * (t < END ? 1 : 0) : 0);
    show(vivid, on4 ? win(t, T.vivid + 0.2, END, 0.3, 0.3) : 0, `translate(640px, 150px)`);
  }

  return { end: END, cam, camOff, state };
}
