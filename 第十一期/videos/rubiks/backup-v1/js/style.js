// 风格样张：?f=A 开场亮起 / B 爆炸图 / C 上帝之数 / D 宇宙时间线
import * as THREE from "three";
import { buildWorld, buildSet, buildDust } from "./world.js";
import { buildCube, schedule, endOf } from "./cube.js";

const F = (location.search.match(/f=([A-H])/) || [, "A"])[1];
const V = (location.search.match(/v=([a-z]+)/) || [, "base"])[1];
await document.fonts.load("900 40px NotoSC"); await document.fonts.load("700 40px CMono");
const hud = document.getElementById("hud"), under = document.getElementById("under");
const add = (html, cls, css = "") => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; e.style.cssText = css; hud.appendChild(e); return e; };

const Wd = buildWorld(document.getElementById("gl"), { transparent: F === "A" });
const cube = buildCube({ look: V });
Wd.scene.add(cube.root);
const PAT = {
  checker: "M2 E2 S2",
  superflip: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
  spots: "U D' R L' F B' U D'",
};
const done = (seq) => { const s = schedule(seq, 0); return [s, endOf(s) + 1]; };

if (F === "A") {
  // 手（H3 视频 5.2 秒那一帧）+ 掌心上方的魔方 + 标题
  under.innerHTML = `<img src="../assets/img/hand-5.2.jpg" style="width:1920px;height:1080px;filter:brightness(1.08) contrast(1.05)">
    <div style="position:absolute;left:948px;top:400px;width:900px;height:900px;margin:-450px 0 0 -450px;border-radius:50%;
      background:radial-gradient(closest-side, rgba(255,255,255,.0) 52%, rgba(122,92,255,.28) 60%, rgba(56,232,255,.18) 68%, rgba(0,0,0,0) 78%)"></div>`;
  Wd.setCam([0, 0, 10], [0, 0, 0], 32);
  cube.root.scale.setScalar(0.4); cube.root.position.set(-0.07, 0.68, 0);
  cube.root.rotation.set(0.52, -0.72, 0.06);
  cube.setGlow(0.9);
  cube.pose([], 0);
  add(`<b>魔方</b><i>—— 上帝的玩具</i>`, "ttl");
} else if (F === "B") {
  buildSet(Wd.scene); buildDust(Wd.scene).update(2);
  Wd.setCam([9.6, 6.6, 13.6], [0.4, 2.0, 0], 32);
  cube.root.position.set(0, 2.3, 0); cube.root.rotation.set(0, -0.35, 0);
  cube.pose([], 0, { explode: 1, spread: 0.95 });
  Wd.coreLight.intensity = 6; Wd.coreLight.position.set(0, 2.3, 0);
  Wd.render();
  // 标签：从某个小块引线出来
  const pick = (kind, pref) => cube.cubies.filter((c) => c.userData.kind === kind).sort((a, b) => pref(b.userData.home) - pref(a.userData.home))[0];
  const L = [
    [pick(1, (h) => h.y), "中心块", "×6", 1240, 150],
    [pick(2, (h) => h.x * 2 + h.y - h.z), "棱块", "×12", 1380, 470],
    [pick(3, (h) => -h.x + h.y + h.z), "角块", "×8", 140, 300],
  ];
  for (const [c, name, n, tx, ty] of L) {
    const wp = new THREE.Vector3(); c.getWorldPosition(wp);
    const s = Wd.project(wp);
    const tag = add(`${name}<em>${n}</em>`, "tag", `left:${tx}px;top:${ty}px`);
    const r = tag.getBoundingClientRect();
    const ax = tx < s.x ? r.right : r.left, ay = r.top + r.height / 2;
    const dx = s.x - ax, dy = s.y - ay;
    add("", "lead", `left:${ax}px;top:${ay}px;width:${Math.hypot(dx, dy)}px;transform:rotate(${Math.atan2(dy, dx)}rad)`);
    add("", "dot", `left:${s.x}px;top:${s.y}px`);
  }
  const cp = Wd.project(new THREE.Vector3(0, 2.3, 0));
  const ct = add(`十字轴`, "tag", `left:${cp.x + 120}px;top:${cp.y + 230}px`);
  add("", "lead", `left:${cp.x + 120}px;top:${cp.y + 255}px;width:${Math.hypot(120, 255)}px;transform:rotate(${Math.atan2(-255, -120)}rad)`);
  add(`一颗魔方，由 26 个小块组成`, "cap prev");
} else if (F === "C") {
  buildSet(Wd.scene); buildDust(Wd.scene).update(5);
  Wd.setCam([2.4, 3.6, 11.5], [1.9, 1.9, 0], 32);
  cube.root.position.set(3.3, 2.0, 0); cube.root.rotation.set(0, -0.62, 0);
  const [s, t] = done(PAT.superflip); cube.pose(s, t);
  add(`20`, "big20");
  add(`上帝之数`, "lbl", "left:150px;top:760px");
  add(`超级翻转 · 12 个棱块全翻面，最少要 20 步`, "sub", "left:154px;top:870px");
} else if (F === "H") {
  // 主镜头：低机位，魔方悬在半空、正在转顶层，背后是霓虹门框，浮尘
  buildSet(Wd.scene); buildDust(Wd.scene).update(3);
  Wd.setCam([6.0, 5.6, 11.6], [0.2, 2.3, 0], 30);
  cube.root.position.set(0, 2.6, 0); cube.root.rotation.set(0.05, -0.62, 0);
  const sch = schedule("R U2 F' L D2 B R' F U' L2 U", 0);
  const last = sch[sch.length - 1];
  cube.pose(sch, last.t0 + 0.1 * last.d);
} else if (F === "D") {
  buildSet(Wd.scene); buildDust(Wd.scene).update(7);
  Wd.setCam([0.6, 4.2, 15], [0.6, 1.4, 0], 30);
  cube.root.position.set(-4.4, 1.6, 0); cube.root.scale.setScalar(0.72); cube.root.rotation.set(0, -0.6, 0);
  const [s, t] = done(PAT.checker); cube.pose(s, t);
  add(`43,252,003,274,489,856,000`, "num", "left:0;right:0;text-align:center;top:96px");
  add(`种样子`, "sub", "left:0;right:0;text-align:center;top:212px;font-size:48px;color:#EAF6FF");
  const x0 = 640, x1 = 1860, y = 640;
  add("", "beam", `left:${x0}px;top:${y}px;width:${x1 - x0}px`);
  const segW = Math.max(12, (x1 - x0) / 99);
  add("", "seg", `left:${x0}px;top:${y - 12}px;width:${segW}px`);
  add(`宇宙年龄<br><span class="mono" style="color:#FFD21A">138 亿年</span>`, "sub", `left:${x0 - 10}px;top:${y + 50}px;line-height:1.3;color:#EAF6FF`);
  add(`× 99`, "num", `left:${x1 - 300}px;top:${y + 40}px;font-size:96px`);
  add(`一秒看一种，要看宇宙年龄的 100 倍`, "cap prev");
}
Wd.render();
const tl = window.__timelines.main;
tl.to({}, { duration: 1 });
