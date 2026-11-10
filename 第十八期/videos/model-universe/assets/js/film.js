// 总装：一个宇宙、一条连续的机位轨道（时间 t 的纯函数），各段按旁白的时间点给出状态和 HUD。
// 所有秒数都从 cues.js 取（C[n] = 第 n 句旁白），代码里不手写时间点。
import * as THREE from "three";
import { buildWorld } from "./world.js";
import { buildUniverse, HERO, FAM } from "./universe.js";
import { C } from "./cues.js";
import { track, el, show, win, ramp, ease, clamp, lerp } from "./lib.js";

await document.fonts.load("700 46px NotoSC");
await document.fonts.load("600 40px NotoSerifSC");

const W = buildWorld(document.getElementById("gl"));
const U = await buildUniverse(W);
const H = U.hero;
const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const A = (v) => [v.x, v.y, v.z];
const D2R = Math.PI / 180;

// ---------- 机位辅助 ----------
const out = (k) => v3(HERO[k]).setY(0).normalize();                 // 从宇宙中心指向这颗星的水平方向
const tan = (k) => { const o = out(k); return new THREE.Vector3(-o.z, 0, o.x); };   // 沿环逆时针的切向
// 在星 k 周围取一个机位：in＝往宇宙中心方向退多少，side＝沿切向，up＝高度
const around = (k, inward, side, up) => A(v3(HERO[k]).addScaledVector(out(k), -inward).addScaledVector(tan(k), side).add(new THREE.Vector3(0, up, 0)));
const P = (k, dx = 0, dy = 0, dz = 0) => [HERO[k][0] + dx, HERO[k][1] + dy, HERO[k][2] + dz];
const ringPt = (deg, r, h = 0) => [Math.cos(deg * D2R) * r, h, Math.sin(deg * D2R) * r];
// GPT 小系统的局部坐标 → 世界坐标（样张 gpt.html 的 climb 路径原样搬过来）
H.gpt.g.updateMatrixWorld();
const G = (x, y, z) => A(new THREE.Vector3(x, y, z).applyMatrix4(H.gpt.g.matrixWorld));

// ---------- S1：从 Fable 浮雕的极近特写，一口气拉到整片宇宙（对数距离，缓入缓出）----------
const F = v3(HERO.fable), fo = out("fable");
const closeDir = fo.clone().multiplyScalar(-0.35).add(tan("fable").multiplyScalar(0.55)).add(new THREE.Vector3(0, 0.25, 0)).normalize();
const WIDE = ringPt(61, 205, 125);                                    // Fable 外侧的高处往回看：整片宇宙在镜头前方展开
function camS1(t) {
  const k = ease(ramp(t, C[2].t0 - 0.2, C[3].t1 - C[2].t0 + 0.6));    // 「每一颗星…」开口前后开始后拉，「每一片星云…」说完时到全景
  const wd = v3(WIDE).sub(F);
  const d = Math.exp(lerp(Math.log(2.4), Math.log(wd.length()), k));
  const dir = closeDir.clone().lerp(wd.normalize(), ease(ramp(k, 0.1, 0.8))).normalize();
  const slide = tan("fable").multiplyScalar(0.25 * ramp(t, 0, C[2].t0));           // 特写期间缓慢横移
  const pos = F.clone().addScaledVector(dir, d).add(slide);
  const tgt = F.clone().add(slide.clone().multiplyScalar(0.6)).lerp(new THREE.Vector3(0, -14, 0), ease(ramp(k, 0.25, 0.9)));
  return [A(pos), A(tgt)];
}
const S1_END = C[3].t1 + 0.4;

// ---------- 之后：关键帧轨道 [t, 位置, 看向] ----------
const LM = v3(HERO.llama).lerp(v3(HERO.muse), 0.5), LMo = LM.clone().setY(0).normalize();   // Llama 与 Muse Spark 的中点
const sh = (t, i) => { const s = Math.max(t - C[i].t0, 0); return Math.exp(-s * 6) * Math.sin(s * 70) * 0.35 * (t > C[i].t0 ? 1 : 0); };  // 大爆炸震一下
const wideAt = (t) => { const a = 61 + 22 * ramp(t, S1_END, C[5].t0 - S1_END); return [ringPt(a, 205, 125), [0, -14, 0]]; };
const KEYS = [
  [S1_END, ...wideAt(S1_END)],
  [C[5].t0, ...wideAt(C[5].t0)],                                           // S1 全景缓慢转
  [C[6].t0 + 1.2, ringPt(61, 46, 14), [0, 0, 0]],                            // S2 从 Fable 这一侧冲向中心
  [C[7].t0, ringPt(61, 15, 4), [0, 0, 0]],                                    // 停在亮点前
  [C[8].t0, ringPt(61, 12, 3.2), [0, 0, 0]],
  [C[8].t0 + 1.6, ringPt(61, 40, 14), [0, 0, 0]],                            // 爆炸把镜头推后
  [C[9].t1, ringPt(52, 46, 16), ringPt(20, 8, 0)],                            // 看着八道光流向外射开
  [C[10].t0 + 0.6, ringPt(44, 22, 7), ringPt(34, 30, 1)],                    // 掠过芝麻街星团
  [C[10].t1 + 0.6, ringPt(30, 40, 7), ringPt(22, 75, 3)],                    // 转向 Gemini
  [C[11].t1, around("gemini", 16, -3, 5), P("gemini")],                       // 飞向 Gemini
  [C[12].t1, around("gemini", 8.5, 1.5, 2.2), P("gemini")],                   // 环绕双星
  [C[13].t1, around("gemini", 5.6, 3.2, 1.2), P("gemini")],                   // 推近
  [C[14].t0 + 1.0, around("trio", 11, -7.5, 1.5), around("trio", 0, -4, 0)], // 侧移到三星（小→大从左到右）
  [C[15].t0, around("trio", 10, -4.5, 1.2), around("trio", 0, -2.8, 0)],
  [C[15].t1, around("trio", 10, 3.5, 1.0), around("trio", 0, 2.6, 0)],
  [C[16].t0, around("mythos", 7, -1.5, 1.2), P("mythos")],                    // 推近面纱星
  [C[16].t1, around("mythos", 3.6, -0.6, 0.6), P("mythos")],
  [C[17].t0 + 1.4, around("mythos", 12, 3.4, 1.4), A(v3(HERO.mythos).lerp(v3(HERO.fable), 0.5))],   // 拉开：Mythos 与 Fable 并排
  [C[17].t1, around("mythos", 12.5, 4.2, 1.6), A(v3(HERO.mythos).lerp(v3(HERO.fable), 0.55))],
  [C[18].t0, around("kimi", 5.2, -1.0, 0.8), P("kimi")],                     // Kimi 亮面（太阳在宇宙中心那一侧）
  [C[18].t0 + 2.0, around("kimi", 0.4, -4.4, 0.9), P("kimi")],               // 绕到明暗交界
  [C[18].t1 + 0.4, around("kimi", -4.0, -2.4, 1.0), P("kimi")],              // 绕到暗面
  [C[19].t1, [-36, 335, -6], [4, 0, 0]],                                       // S4 急退到宇宙正上方：整个环一眼看全（闭源那段弧在画面上方，名牌不压字幕）
  [C[20].t1, [-30, 325, 8], [4, 0, 2]],                                         // 闭源的几片（有名牌）周围干净，对面星尘最浓
  [C[21].t1, ringPt(236, 30, 48), ringPt(236, 92, 0)],                         // 推向千问与 Llama 的星尘
  [C[22].t1, around("qwen", 12, -3, 2.5), P("qwen")],
  [C[23].t0 + 2.2, around("qwen", 3.2, 4.5, 0.8), ringPt(226, 92, 1)],        // 穿过千问的星尘
  [C[23].t1, around("deepseek", 4.2, -2.2, 1.0), P("deepseek")],             // 掠过 DeepSeek（鲸影，光丝连进千问与 Llama）
  [C[24].t1, A(LM.clone().addScaledVector(tan("llama"), -17).add(new THREE.Vector3(0, 3, 0))), A(LM)],   // 从侧面看：Llama 与新出现的 Muse Spark 左右同框
  [C[25].t1, A(LM.clone().addScaledVector(tan("llama"), -13).addScaledVector(LMo, -4).add(new THREE.Vector3(0, 2.2, 0))), A(v3(HERO.llama).lerp(LM, 0.4))],  // 推向变暗的 Llama
  [C[26].t1, A(LM.clone().addScaledVector(tan("llama"), -24).addScaledVector(LMo, -8).add(new THREE.Vector3(0, 4, 0))), P("llama")],  // 一边后退一边看 Llama 的星尘散开
  [C[27].t0 - 0.2, G(3.2, 2.0, -6.5), G(2.2, 0.4, -1.6)],                      // 转身飞向 GPT 小系统
  [C[27].t0, G(1.85, 0.52, -2.45), G(2.2, 0.4, -1.6)],                         // ↓ 以下是样张 climb 路径
  [C[27].t0 + 2.5, G(3.4, 0.9, -4.2), G(0.6, 0.1, 0)],
  [C[27].t0 + 4.5, G(3.0, 0.6, 0.5), G(0, 0, 0)],
  [C[27].t0 + 6.5, G(0.4, 0.15, 2.7), G(-12, 4, -40)],
  [C[28].t0 + 1.2, G(0.3, 2.1, 2.6), G(-12, 4, -40)],                          // 日出：太阳刚越过 Terra 的边缘
  [C[28].t1 + 0.4, G(-2.0, 3.0, -6.0), G(-12, 5, -40)],
  [C[29].t0 + 1.2, G(-6.0, 4.0, -18.0), G(-24, 34, -50)],                     // 抬头看 Astra
  [C[29].t1 + 0.6, G(-10, 20, -30), G(-24, 34, -50)],                         // 继续上升
  [C[30].t0 + 1.5, ringPt(292, 190, 110), [0, -8, 0]],                        // S6 拉到宇宙外侧，回望全景
  [119.5, ringPt(300, 245, 135), [0, -8, 0]],
];
const camPos = track(KEYS.map((k) => [k[0], k[1]]));
const camTgt = track(KEYS.map((k) => [k[0], k[2]]));
function camera(t) {
  if (t < S1_END) return camS1(t);
  const p = camPos(t), q = camTgt(t), s = sh(t, 8);
  return [[p[0] + s, p[1] + s * 0.6, p[2]], q];
}

// ---------- HUD ----------
const caps = (window.CAPTIONS || []).filter((c) => c[3] !== "noshow").map(([t0, t1, txt]) => ({ t0, t1, e: el(`<b>${txt}</b>`, "cap") }));
const qq = window.CAPTIONS.find((c) => c[3] === "noshow");
const question = el(`<span>${qq[2]}</span>`, "question");
const credit = el("资料：Wikipedia · arXiv · Hugging Face（截至 2026-10-26）｜星球外观是创作，不代表模型能力或参数量", "credit");
// 名牌：［锚点（世界坐标函数）, 文字, 出现, 消失］；只写画面里真实存在的东西
const tagAt = (k, dy) => () => { const p = v3(HERO[k]); p.y += dy; return p; };
const TAGS = [
  [() => new THREE.Vector3(0, 1.6, 0), "Transformer · 2017", C[6].t0 + 0.6, C[8].t0 - 0.2],
  [() => v3(U.pos.bert).add(new THREE.Vector3(0, 2.2, 0)), "BERT · ERNIE · ELMo（芝麻街）", C[10].t0, C[10].t1 + 1.2],
  [tagAt("gemini", 2.6), "Gemini · 双子座", C[12].t0, C[13].t1 + 0.4],
  [() => { const g = H.gemini.glints[0]; const p = new THREE.Vector3(); g.getWorldPosition(p); p.y += 0.8; return p; }, "Gemma · 宝石", C[13].t0, C[13].t1 + 0.4],
  [() => H.trio.ps[0].p.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.0, 0)), "Haiku · 俳句", C[15].t0 - 0.1, C[16].t0],
  [() => H.trio.ps[1].p.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 1.4, 0)), "Sonnet · 十四行诗", C[15].t0 + 0.9, C[16].t0],
  [() => H.trio.ps[2].p.g.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 2.0, 0)), "Opus · 长篇", C[15].t0 + 2.0, C[16].t0],
  [tagAt("mythos", 1.9), "Mythos · 神话", C[16].t0 + 0.6, C[17].t1],
  [tagAt("fable", 1.9), "Fable · 寓言", C[17].t0 + 0.6, C[17].t1 + 0.3],
  [tagAt("kimi", 1.7), "Kimi · 月之暗面", C[18].t0, C[18].t1],
  [() => v3(HERO.gpt).add(new THREE.Vector3(0, 6, 0)), "GPT", C[20].t0 + 0.2, C[20].t1 + 0.4],
  [() => v3(HERO.mythos).add(new THREE.Vector3(0, 6, 0)), "Claude", C[20].t0 + 0.5, C[20].t1 + 0.4],
  [() => v3(HERO.gemini).add(new THREE.Vector3(0, 6, 0)), "Gemini", C[20].t0 + 0.8, C[20].t1 + 0.4],
  [tagAt("qwen", 2.0), "Qwen · 千问", C[21].t0 + 0.3, C[22].t1],
  [tagAt("llama", 1.9), "Llama · 羊驼", C[21].t0 + 0.6, C[22].t1],
  [tagAt("deepseek", 1.8), "DeepSeek · 深度求索", C[23].t0, C[23].t1 + 0.3],
  [tagAt("muse", 1.4), "Muse Spark", C[24].t0 + 0.8, C[25].t1],
  [() => v3(G(2.2, 0.75, -1.6)), "Luna · 月", C[27].t0 + 0.2, C[27].t0 + 2.6],
  [() => v3(G(0, 1.6, 0)), "Terra · 地", C[27].t0 + 2.4, C[27].t0 + 5.2],
  [() => v3(G(-12, 6.5, -40)), "Sol · 日", C[28].t0, C[28].t1 + 0.8],
  [() => v3(G(-24, 41, -50)), "Astra · 群星", C[28].t1 + 0.6, C[29].t1 + 0.3],
].map(([anchor, txt, t0, t1]) => ({ anchor, t0, t1, e: el(txt, "tag") }));

const cut = el("", "cut");                                             // 最后创建＝盖在所有 HUD 之上
const key = new THREE.Vector3(), camQ = new THREE.Quaternion(), proj = new THREE.Vector3();
function frame(t) {
  const [p, q] = camera(t);
  W.setCam(p, q);
  W.cam.updateMatrixWorld();
  W.keyLight(key); camQ.copy(W.cam.quaternion);
  for (const b of U.bills) b.quaternion.copy(camQ);

  // ---------- 倒带与重新点亮：一个半径 edge 管所有东西的显隐 ----------
  // 开场：edge 无穷大（今天的宇宙全亮）；「一切，从 2017 年…」起从外往里熄灭到 0（倒带）；
  // 大爆炸后 edge＝光环半径，从 0 往外扫——布局是「离中心越远＝发布越晚」，所以光环扫过就是时间从 2017 走到 2026
  const tb = C[8].t0, rw0 = C[6].t0, rw1 = C[7].t0 - 0.3, RING_T = 10.5, RING_R = 150;
  const ringR = RING_R * ramp(t, tb, RING_T) ** 0.95;
  const edge = t < rw0 ? 1e4 : t < tb ? 130 * (1 - ease(ramp(t, rw0, rw1 - rw0))) : t < tb + RING_T ? ringR : 1e4;
  const vis = (d) => clamp((edge - d) / 6 + 0.5);                     // 半径 d 处的东西亮不亮（6 个单位的软边）
  const vHero = (k) => vis(Math.hypot(HERO[k][0], HERO[k][2]));
  const sky = 1 - 0.7 * win(t, rw0, tb + RING_T * 0.6, 1.5, 3);             // 背景星空在「全黑」那段也压暗
  W.sky.children.forEach((c) => (c.material.opacity = 0.8 * sky));

  // 主角
  H.fable.state(t, key); H.trio.state(t, key); H.mistral.state(t, key); H.grok.state(t, key); H.qwen.state(t, key); H.deepseek.state(t, key);
  H.gemini.state(t, key, camQ, 0);
  H.mythos.state(t, key, ease(ramp(t, C[16].t0 + 1.4, 0.8)) * (1 - ease(ramp(t, C[17].t1, 1))));   // 「神话」两个字上孔洞张开
  H.kimi.state(t);
  H.gpt.state(t, key, camQ);
  H.llama.state(t, key);
  const llamaDim = 1 - 0.88 * ease(ramp(t, C[25].t0 - 0.2, 2.2));                // 「此后 Llama 没有再诞生新星」：核心慢慢暗下去
  H.llama.U.dim.value = llamaDim; H.llama.AU.k.value = llamaDim;
  H.muse.state(t, ease(ramp(t, C[24].t0 + 0.6, 1.4)));
  const heroDim = (k, list) => { const v = vHero(k); H[k].g.visible = v > 0.001; for (const p of list) { p.U.dim.value *= v; p.AU.k.value *= v; } };
  for (const k of ["fable", "mistral", "grok", "qwen", "deepseek", "kimi", "mythos"]) { H[k].U.dim.value = 1; H[k].AU.k.value = k === "kimi" ? 0.35 : 1; heroDim(k, [H[k]]); }
  for (const p of H.trio.ps) { p.p.U.dim.value = 1; p.p.AU.k.value = 1; } heroDim("trio", H.trio.ps.map((x) => x.p));
  for (const p of [H.gemini.castor, H.gemini.pollux]) { p.U.dim.value = 1; p.AU.k.value = 1; } heroDim("gemini", [H.gemini.castor, H.gemini.pollux]);
  heroDim("llama", [H.llama]);
  { // GPT 小系统：Sol、Astra 离中心更远，各自按自己的距离点亮
    const g = H.gpt; g.terra.U.dim.value = 1; g.terra.AU.k.value = 1; g.luna.U.dim.value = 1;
    const v = vHero("gpt"); g.terra.U.dim.value *= v; g.terra.AU.k.value *= v; g.luna.U.dim.value *= v;
    const wp = new THREE.Vector3();
    g.sol.getWorldPosition(wp); const vs = vis(Math.hypot(wp.x, wp.z)); g.sol.visible = vs > 0.001; g.sol.parent.children[1].visible = vs > 0.001;
    g.astra.getWorldPosition(wp); g.astra.visible = vis(Math.hypot(wp.x, wp.z)) > 0.001;
    g.g.visible = v > 0.001 || vs > 0.001;
  }

  // 大爆炸：中心亮点收缩→闪光→光环扫过整片宇宙（光环＝edge，扫到哪亮到哪）
  const shrink = 1 - 0.6 * ease(ramp(t, C[7].t0, tb - C[7].t0));
  U.ring.scale.setScalar(Math.max(ringR / 0.92, 0.01)); U.bangU.k.value = t > tb ? 1.3 * (1 - ramp(t, tb + RING_T - 2, 2)) : 0;
  U.flash.material.uniforms.k.value = t > tb ? 3.0 * Math.exp(-(t - tb) * 1.6) : 0;
  for (const s of U.stars) {
    let k = s.base;
    if (s.p.fam === "origin") { k = 1.2 * shrink + (t > tb ? 0 : 0.6 * win(t, C[6].t0, tb, 0.6, 0.1)); s.m.scale.setScalar(shrink); }
    const d = s.m.position.length();
    if (s.p.fam !== "origin") k *= vis(Math.hypot(s.m.position.x, s.m.position.z));
    if (t > tb && t < tb + RING_T + 1) k += 1.6 * Math.exp(-(((d - ringR) / 5) ** 2));   // 光环扫过时闪一下
    if (s.p.fam === "meta") k *= 0.5 + 0.5 * llamaDim;
    s.m.material.uniforms.k.value = k;
  }
  // 八道光流：从中心长出去，射向空旷处
  for (const s of U.streams) {
    const k = ease(ramp(t, C[9].t0 - 0.2, C[10].t1 - C[9].t0 + 0.2));
    const n = Math.floor(k * 60);
    s.geo.setDrawRange(0, Math.max(n + 1, 0));
    s.line.visible = k > 0.001; s.line.material.opacity = 0.9 * (1 - ramp(t, C[11].t1, 2));
    s.dots.visible = s.line.visible; s.dots.material.uniforms.k.value = s.line.material.opacity;
    s.head.position.copy(s.pts[Math.min(n, 60)]); s.head.material.uniforms.k.value = k > 0.001 && k < 0.999 ? 1.2 : 0;
  }
  // 星云光雾：镜头钻进去时自动变淡（否则整屏被染色）
  for (const g of U.gas) g.m.material.uniforms.k.value = g.kd * vis(Math.hypot(g.m.position.x, g.m.position.z)) * clamp((g.m.position.distanceTo(W.cam.position) - g.s * 0.25) / (g.s * 0.6));
  // 星尘：缓慢起伏；Llama 熄灯后它的星尘继续向外扩散；转折段千问、Llama 的星尘提亮
  for (const [f, d] of Object.entries(U.dust)) {
    const spread = f === "meta" ? 9 * ease(ramp(t, C[25].t0, C[26].t1 - C[25].t0 + 3)) : 0;
    for (let i = 0; i < d.N; i++) {
      const w = 0.25 * Math.sin(t * 0.3 + i * 0.37);
      d.cur[i * 3] = d.base[i * 3] + d.dir[i * 3] * (w + spread);
      d.cur[i * 3 + 1] = d.base[i * 3 + 1] + d.dir[i * 3 + 1] * (w + spread);
      d.cur[i * 3 + 2] = d.base[i * 3 + 2] + d.dir[i * 3 + 2] * (w + spread);
    }
    d.geo.attributes.position.needsUpdate = true;
    const boost = f === "qwen" || f === "meta" ? 0.6 * win(t, C[21].t0, C[26].t1, 1, 1.5) : 0;
    d.mat.opacity = 0.7 + boost; d.mat.uniforms.edge.value = edge;
  }
  // 光丝：平时淡淡的；DeepSeek 那几根在「像星尘」时亮起
  for (const th of U.threads) {
    const hot = th.a === "r1" || th.b === "r1" ? 0.6 * win(t, C[23].t0, C[24].t0, 0.6, 1) : 0;
    th.mat.opacity = (0.28 + hot) * vis(th.r);
  }
  // 结尾新星：一颗颗亮起，越来越密
  const n0 = C[30].t0, n1 = C[32].t0 + 1.5;
  for (const n of U.nova) {
    const ti = n0 + (n1 - n0) * n.ti;
    n.m.material.uniforms.k.value = t > ti ? 1.6 * Math.exp(-(t - ti) * 2.2) + 0.8 : 0;
  }

  W.render();

  // HUD
  show(cut, t >= 119.5 ? 1 : 0);
  for (const c of caps) show(c.e, win(t, c.t0, c.t1, 0.12, 0.15));
  show(question, win(t, qq[0], 119.5, 0.6, 0.01), `translate(-50%,-50%) scale(${1 + 0.02 * ramp(t, qq[0], 6)})`);
  show(credit, win(t, qq[0] + 0.3, 119.5, 0.8, 0.01));
  for (const g of TAGS) {
    const o = win(t, g.t0, g.t1, 0.35, 0.35);
    if (o <= 0.001) { show(g.e, 0); continue; }
    proj.copy(g.anchor()).project(W.cam);
    const onScreen = proj.z < 1 && Math.abs(proj.x) < 0.95 && Math.abs(proj.y) < 0.9;
    show(g.e, onScreen ? o : 0, `translate(${((proj.x + 1) / 2) * 1920}px, ${((1 - proj.y) / 2) * 1080}px) translate(-50%, -100%)`);
  }
}

const tl = window.__timelines.main;
const DUR = +document.getElementById("root").dataset.duration;
const drv = { k: 0 };
tl.fromTo(drv, { k: 0 }, { k: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => frame(drv.k * DUR) }, 0);
frame(0);
