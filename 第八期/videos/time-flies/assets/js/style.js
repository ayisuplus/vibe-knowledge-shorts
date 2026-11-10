// 风格样张：三张静帧放在同一条 3 秒时间线上，t=0.5 / 1.5 / 2.5 各取一张。
// A 钩子：去年的日历墙，「去年的今天」是空的，空格开始剥落
// B 叠成一天：童年暑假的胶片 vs 成年一年的 365 张照片压成一叠
// C 墙亮起来：一格一格的「第一次」，墙变大
import * as THREE from "three";
import { buildWorld, buildCalendar, loadPhotos, photoCanvas, photoCard, outline, filmStrip, deck, floor, dayIndex, CELL } from "./wall.js";
import { el, show } from "./lib.js";

await document.fonts.load("800 40px VibeSerif");
await document.fonts.load("700 40px VibeSans");

const KID = ["kid-bike", "kid-sea", "kid-icepop", "kid-fan-melon", "kid-kite", "kid-firstday", "kid-snow", "kid-goldfish"];
const ADULT = ["adult-subway", "adult-desk", "adult-takeout", "adult-phone-night"];
const NEW = ["new-street", "new-pottery", "new-station"];
const img = await loadPhotos([...KID, ...ADULT, ...NEW]);

const Wd = buildWorld(document.getElementById("gl"));
const S = Wd.scene;
floor(S, -14);

// ---------- 日历墙 ----------
const cal = buildCalendar(S);
const sq = (n) => photoCanvas(img[n], { aspect: 1, px: 384, border: 0.07 });
const sqWarm = Object.fromEntries([...KID, ...NEW].map((n) => [n, sq(n)]));
const cards = [];
function litCard(day, name, z = 0.14) {
  const c = photoCard(sqWarm[name], { w: CELL * 1.04, h: CELL * 1.04 });
  c.position.copy(cal.days[day].pos).setZ(z);
  cal.group.add(c);
  cards.push({ c, day });
  return c;
}
// A：去年能想起来的 9 天（示意）
const MEM_A = [[1, 29], [2, 14], [4, 5], [5, 2], [6, 21], [7, 26], [8, 9], [9, 13], [12, 31]];
const memA = MEM_A.map(([m, d], k) => litCard(dayIndex(m, d), [...NEW, ...KID][k % 11]));
const TODAY = dayIndex(10, 17);
const ring = outline(1.16, 1.16, 0.07);
ring.position.copy(cal.days[TODAY].pos).setZ(0.05);
cal.group.add(ring);

// C：成片亮起的「第一次」（确定性的伪随机挑格子）
let s0 = 11;
const rnd = () => ((s0 = (s0 * 16807) % 2147483647) / 2147483647);
const litC = new Set(MEM_A.map(([m, d]) => dayIndex(m, d)));
while (litC.size < 86) litC.add(Math.floor(rnd() * 365));
const pool = [...NEW, ...KID];
const memC = [...litC].filter((d) => !MEM_A.some(([m, dd]) => dayIndex(m, dd) === d)).map((d, k) => litCard(d, pool[k % pool.length]));
const HERO = { street: dayIndex(10, 21), pottery: dayIndex(11, 8), station: dayIndex(11, 29) };
const heroCards = [litCard(HERO.street, "new-street", 0.3), litCard(HERO.pottery, "new-pottery", 0.3), litCard(HERO.station, "new-station", 0.3)];

// ---------- 胶片条 + 一叠照片（B） ----------
const B = new THREE.Group();
S.add(B);
const strip = filmStrip(KID.map((n) => img[n]), {
  frames: 16, h: 2.9,
  path: (u) => new THREE.Vector3(-22 + 22.5 * u, 4.4 + 1.9 * Math.sin(u * Math.PI * 2.1) - 4.4 * u, -17 * (1 - u) ** 1.5 + 3),
});
B.add(strip);
const cool = ADULT.map((n) => photoCanvas(img[n], { aspect: 1.5, px: 512, border: 0.05, cool: true }));
const DK = deck(cool, 365, { w: 3.6, h: 2.4 });
B.add(DK.group);
const DECK_AT = new THREE.Vector3(2.5, 0.2, 0.5);
DK.group.position.copy(DECK_AT);
DK.group.rotation.set(0.18, 0.5, 0);
// 叠到第 k 张：后面的已经压实，前面最后几十张还在飞进来
let s1 = 5;
const r1 = () => ((s1 = (s1 * 16807) % 2147483647) / 2147483647);
const jit = Array.from({ length: 365 }, () => [r1() - 0.5, r1() - 0.5, r1() - 0.5]);
function deckLayout(k0) {
  DK.layout((k) => {
    if (k < k0) return { pos: [jit[k][0] * 0.06, jit[k][1] * 0.06, k * 0.0045], rot: [0, 0, jit[k][2] * 0.05] };
    const f = k - k0; // 还在空中的：从右上方排队落进来
    return {
      pos: [-0.2 - f * 0.08 + jit[k][0] * 0.5, 1.2 + f * 0.5, k0 * 0.0045 + 0.4 + f * 0.12],
      rot: [-0.3 - f * 0.05 + jit[k][1] * 0.2, -0.2 + jit[k][0] * 0.3, (jit[k][2] - 0.5) * 0.6],
    };
  });
}

// ---------- HUD ----------
const H = {
  aPanel: el(``, "panel"),
  aBig: el(`去年`, "big"),
  aToday: el(`去年的今天`, "tag today"),
  aCount: el(`365 天 <span>→</span> 能想起来的：9 天`, "stat"),
  aNote: el(`示意`, "note"),
  bStat: el(`365 天 <span>→</span> 1 格`, "stat"),
  bKid: el(`小时候的一个暑假`, "tag warm"),
  bAdult: el(`长大后的一年`, "tag cool"),
  cTags: [el(`换一条路回家`, "tag"), el(`学一样新东西`, "tag"), el(`去一个没去过的地方`, "tag")],
  cap: el(``, "cap"),
};
const at = (e, p, o = 1, dx = -50, dy = -50) => {
  const q = Wd.project(p);
  show(e, q.behind ? 0 : o, `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) translate(${dx}%, ${dy}%)`);
};
const fix = (e, x, y, o = 1) => show(e, o, `translate(${x}px, ${y}px)`);
const hideAll = () => Object.values(H).flat().forEach((e) => show(e, 0));
const cap = (html) => { H.cap.innerHTML = html; show(H.cap, 1); };

function draw(t) {
  hideAll();
  const frame = t < 1 ? "A" : t < 2 ? "B" : "C";
  cal.group.visible = frame !== "B";
  B.visible = frame === "B";
  const wp = (d) => cal.days[d].pos.clone().applyMatrix4(cal.group.matrixWorld);

  if (frame === "A") {
    cal.group.scale.setScalar(1);
    cal.group.updateMatrixWorld();
    memC.forEach((c) => (c.visible = false)); heroCards.forEach((c) => (c.visible = false));
    memA.forEach((c) => { c.visible = true; c.userData.setGlow(0.9); c.scale.setScalar(1.7); c.position.z = 0.5; });
    ring.visible = true;
    // 空格剥落：离「今天」越远越早剥。此刻约剥了 4 成
    const today = cal.days[TODAY].pos;
    let sp = 3;
    const rr = () => ((sp = (sp * 16807) % 2147483647) / 2147483647);
    cal.days.forEach((d, i) => {
      const lit = MEM_A.some(([m, dd]) => dayIndex(m, dd) === i);
      const dist = d.pos.distanceTo(today);
      const k = THREE.MathUtils.clamp((dist - 12 + rr() * 8) / 16, 0, 1) ** 1.4; // 剥离进度
      if (lit || i === TODAY || k <= 0) { cal.setTile(i, { a: lit ? 0 : 1 }); return; }
      const a = rr() * Math.PI * 2;
      cal.setTile(i, {
        off: [Math.cos(a) * 1.6 * k, -7 * k * k + Math.sin(a) * 1.2 * k, 5 * k + rr() * 2 * k],
        rot: [rr() * 2.6 * k, rr() * 2.6 * k, (rr() - 0.5) * 2 * k],
        s: 1 - 0.3 * k, a: 1 - k * k,
      });
    });
    cal.commit();
    const tgt = wp(TODAY);
    Wd.setCam({ pos: [tgt.x + 4, tgt.y + 7, 34], tgt: [tgt.x - 9, tgt.y + 4.2, 0], fov: 40 });
    at(H.aToday, tgt.clone().add(new THREE.Vector3(0, 0.95, 0.2)), 1, -50, -100);
    fix(H.aPanel, 0, 0);
    fix(H.aBig, 110, 60);
    show(H.aCount, 1, `translate(114px, 200px) scale(0.55)`); H.aCount.style.transformOrigin = "0 0";
    fix(H.aNote, 118, 290);
    cap(`想不起来`);
  }

  if (frame === "B") {
    deckLayout(355);
    Wd.setCam({ pos: [-1.0, 2.2, 15.5], tgt: [-1.6, 1.2, 0], fov: 42 });
    at(H.bKid, new THREE.Vector3(-9.5, 5.4, -4), 1);
    fix(H.bAdult, 1390, 830);
    show(H.bStat, 1, `translate(640px, 150px) scale(0.75)`); H.bStat.style.transformOrigin = "0 0";
    cap(`一样的日子，在记忆里会被<em>叠成一天</em>`);
  }

  if (frame === "C") {
    for (let i = 0; i < cal.days.length; i++) cal.setTile(i, { a: litC.has(i) || Object.values(HERO).includes(i) ? 0 : 1 });
    cal.commit();
    ring.visible = false;
    memA.forEach((c) => { c.visible = true; c.userData.setGlow(0.5); c.scale.setScalar(1); c.position.z = 0.14; });
    memC.forEach((c) => { c.visible = true; c.userData.setGlow(0.5); });
    heroCards.forEach((c) => { c.visible = true; c.userData.setGlow(1); c.scale.setScalar(1.25); });
    cal.group.scale.setScalar(1.12);
    cal.group.updateMatrixWorld();
    const tgt = wp(HERO.pottery);
    Wd.setCam({ pos: [tgt.x - 12, tgt.y - 3, 22], tgt: [tgt.x - 3.5, tgt.y + 1.6, 0], fov: 42 });
    const off = new THREE.Vector3(0, 0.9, 0.4);
    [HERO.street, HERO.pottery, HERO.station].forEach((d, k) => at(H.cTags[k], wp(d).add(off), 1, -50, -100));
    cap(`每一个第一次，都会让这一年<em>变长一点</em>`);
  }
  Wd.render();
}

const proxy = { t: 0 };
window.__timelines.main.to(proxy, { t: 3, duration: 3, ease: "none", onUpdate: () => draw(proxy.t) });
draw(0);
