// 六段合一。每帧 state(n, t, fx) 只走当前这一段：摆物件、定机位、写注释带。段与段之间是硬切或穿越，不做叠化。
import * as THREE from "three";
import { clamp, mix, ease, easeOut, easeIn, ramp, win, hash, slam, beat, after, integ } from "./lib.js";
import { mkAlarm, mkEngine, mkBottle, mkToaster, mkPuzzle, mkTag, tagTextures, paperTexture, projectPageCanvas, M } from "./rig.js";
import * as P from "./score.js";

const { A, Z, END_N, CARD_N, Q_N } = P;

export function buildSections(w) {
  const alarm = mkAlarm(w), al2 = mkAlarm(w), T = tagTextures(w);
  // ── 通用 ──
  const RINGS = Array.from({ length: 6 }, () => w.reg(new THREE.Mesh(new THREE.TorusGeometry(1, .035, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, .3, .2), transparent: true, depthWrite: false, toneMapped: false }))));
  /** 在 z 处按若干拍位放冲击波环 */
  function rings(n, list, z = -1, scale = 13) { list.slice(0, 6).forEach((at, i) => { const d = n - at, m = RINGS[i]; if (d < 0 || d >= 1.6) return; const u = easeOut(d / 1.6); w.put(m, 0, 0, z, 2.6 + scale * u, 0, (1 - u) ** 1.5); }); }
  const label = (s, h, c = "#ffe9c9") => w.text(s, h, { color: c, font: "NotoSC", size: 160 });

  // ── S1 粒子字 ──
  const NP = 14000, cl1 = w.cloud(NP, .13);
  const PA = w.sample(w.textCanvas("害怕", { size: 360, pad: 20 }), NP, 8.4), PB = w.sample(w.textCanvas("产品", { size: 360, pad: 20 }), NP, 8.4);
  function particles1(n) {
    const { P: p, Col: c } = cl1;
    for (let i = 0; i < NP; i++) {
      const h = hash(i * .37), h2 = hash(i * 1.13), a = h2 * Math.PI * 2;
      const inU = easeOut((n - 3.4 - h * .35) / .75), mU = ease((n - 5.5 - h * .55) / 1.05), outU = easeIn((n - 7.35 - h * .3) / .75);
      let x = mix(PA[i * 3], PB[i * 3], mU), y = mix(PA[i * 3 + 1], PB[i * 3 + 1], mU), z = mix(PA[i * 3 + 2], PB[i * 3 + 2], mU);
      const sw = Math.sin(mU * Math.PI), R = sw * (2.5 + 5 * h), ang = a + mU * 5;
      x += R * Math.cos(ang); y += R * Math.sin(ang) * .7; z += sw * 7 * (h2 - .35);
      const far = 1 - inU; x += far * 22 * Math.cos(a); y += far * 14 * Math.sin(a); z -= far * 14;
      x *= 1 - outU; y *= 1 - outU; z *= 1 - outU;
      p[i * 3] = x; p[i * 3 + 1] = y + .5 * (1 - outU); p[i * 3 + 2] = z;
      const hot = clamp(mU * 1.2), white = clamp(sw * 1.4);
      c[i * 3] = 1.25; c[i * 3 + 1] = mix(.14, .86, hot) + white * .35; c[i * 3 + 2] = mix(.09, .66, hot) + white * .2;
    }
    cl1.show();
  }
  const blink = w.reg(new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, .35, .22), toneMapped: false })));
  const wYimen = w.text("一门生意", 3.4, { color: "#ffe8c4", size: 300 }), wBaojing = w.text("报警器", 6.2, { color: "#ff3b2a", size: 420 }), wAI = w.extruded("AI", 13, 14, "#fff6e6", "#ff3322");

  function s1(n, t, fx) {
    if (n < 2.1) {
      const b = beat(n, 2.6); w.put(blink, 0, 0, 0, .8 + .9 * b); blink.material.color.setRGB(.5 + 2.4 * b, .08 + .3 * b, .05 + .2 * b);
      [0, 1].forEach((at, i) => { const d = n - at; if (d < 0 || d >= 1.4) return; const u = easeOut(d / 1.4); w.put(RINGS[i], 0, 0, 0, .6 + 8 * u, 0, (1 - u) ** 1.5); });
    }
    if (win(n, 2, 3.5)) { const u = (n - 2) / 1.5; w.put(wYimen, 0, .5, mix(-40, 14.4, easeIn(u) * .55 + clamp(u) * .45)); }
    if (win(n, 3.3, 8.5)) particles1(n);
    // 零件组装、环绕；砸定后 AI 冲上来；最后冲进红灯
    const AS = A(2), SL = P.ALARM_SLAM;
    if (n >= AS - .4) {
      const spin = (1 - ease((n - AS) / (SL - AS))) * 9, set = ramp(n, SL, 2), b = beat(n);
      alarm.set(n, { asmAt: AS + .1, s: slam(n, SL, 1.28, .3), rx: .18 * Math.sin(t * .9) * set, ry: spin + .3 * Math.sin(t * .7) * set, rz: spin * .35, lit: n < SL ? .3 : .45 + .55 * b + 1.1 * ramp(n, P.DIVE - 1.2, 1.2) });
      w.redL.position.set(0, 0, 2.5); w.redL.intensity = n < SL ? 0 : 12 + 34 * b;
    }
    if (win(n, P.BAOJING, P.AI_SLAM + .2)) w.put(wBaojing, 0, 0, -5, slam(n, P.BAOJING, 2.2, .3), 0, 1 - ramp(n, P.AI_SLAM - .4, .6));
    if (n >= P.AI_SLAM) { wAI.visible = true; wAI.position.set(0, 0, -7); wAI.scale.setScalar(slam(n, P.AI_SLAM, 2.4, .3) * (1 + .03 * beat(n, 4))); wAI.rotation.set(.1 * Math.sin(t * 1.1), .36 * Math.sin((n - P.AI_SLAM) * .7), 0); }
    rings(n, [SL, P.AI_SLAM, P.AI_SLAM + 2, P.AI_SLAM + 4]);
    // 机位
    if (n < 3.5) w.cam(0, 0, 14);
    else if (n < AS) w.cam(.6 * Math.sin(n * 1.2), .3 * Math.cos(n), mix(19, 15, ease((n - 3.5) / 4.5)));
    else if (n < SL) { const u = (n - AS) / (SL - AS), a = u * Math.PI * 2.5 * (1 - .22 * ease(u)), r = mix(9, 14, ease(u * 1.1)); w.cam(r * Math.sin(a), 3.4 * Math.cos(a * .8), r * Math.cos(a), 0, 0, 0, .4 * (1 - ease(u))); }
    else if (n < P.DIVE - 1.4) { const a = .32 * Math.sin((n - SL) * .55); w.cam(13 * Math.sin(a), 1.2 * Math.cos(n * .5), mix(13.5, 11, (n - SL) / 5.6)); }
    else w.cam(0, 0, mix(11, .9, easeIn((n - (P.DIVE - 1.4)) / 1.4)));
    fx.flash = after(n, SL, 7) * .4 + ramp(n, P.DIVE - .5, .5) * .55;
    if (n >= AS && n < P.AI_SLAM) fx.mark = "类比";
  }

  // ── S2 隧道与数字 ──
  const TUN = Array.from({ length: 26 }, (_, i) => w.reg(new THREE.Mesh(new THREE.TorusGeometry(9, i % 4 === 0 ? .1 : .035, 8, 72), new THREE.MeshBasicMaterial({ color: new THREE.Color(i % 4 === 0 ? 1.5 : .75, i % 4 === 0 ? .16 : .06, i % 4 === 0 ? .1 : .04), transparent: true, depthWrite: false, toneMapped: false }))));
  const STREAK = w.reg(new THREE.InstancedMesh(new THREE.BoxGeometry(.03, .03, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 1.05, .85), transparent: true, opacity: .8, toneMapped: false }), 70)); STREAK.frustumCulled = false;
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  /** 隧道走了多远：v 是分段速度，积分结果只取决于 n */
  function tunnel(n, zv, v, fade, tintZ = 0) {
    const L = 130, gap = L / TUN.length;
    TUN.forEach((m, i) => { const d = (i * gap + zv) % L; w.put(m, 0, 0, tintZ - 120 + d, 1, 0, fade * clamp(d / 30) * clamp((L - d) / 8 + .2)); });
    STREAK.visible = true; const len = 1 + v * 2.4;
    for (let i = 0; i < 70; i++) { const a = hash(i) * 6.283, r = 3.5 + 5 * hash(i + 70), d = (hash(i + 140) * L + zv * 1.6) % L; _p.set(r * Math.cos(a), r * Math.sin(a), tintZ - 120 + d); _s.set(1, 1, len * fade + .001); _m.compose(_p, _q.identity(), _s); STREAK.setMatrixAt(i, _m); }
    STREAK.instanceMatrix.needsUpdate = true; STREAK.material.opacity = fade * clamp(v / 6);
  }
  const NW = 16, NH = NW * 640 / 1500;
  const N54 = w.number(1500, 640, 470, "#fff4dc", "#ff5a30"), g54 = w.tiles(N54.t, NW, NH, 10, 5);
  const N62 = w.number(1500, 640, 470, "#ff4a33", "#ff2010"), p62 = w.reg(new THREE.Mesh(new THREE.PlaneGeometry(NW, NH), w.basic(N62.t)));
  const lab54 = label("担心被 AI 抢走工作", 1.1), lab62 = label("担心被更懂 AI 的人替代", 1.25, "#ffffff");
  const wZai = w.text("再不学，", 4.2, { color: "#fff4dc", size: 380 }), wTao = w.text("就要被淘汰了", 3.5, { color: "#ff3b2a", size: 380, stroke: "#200" });
  const TAGS = Array.from({ length: 30 }, () => mkTag(w, T, 4.2));
  function tagStorm(n, n0, spread = 6) { TAGS.forEach((m, i) => { const s = n0 + hash(i + 5) * spread, d = n - s; if (d <= 0) return; const u = d / 3.4, a = hash(i) * 6.283 + u * 2.2, r = 6 + 7 * hash(i + 2); m.visible = true; m.position.set(r * 1.4 * Math.cos(a), r * .85 * Math.sin(a), mix(-34, 19, easeIn(clamp(u)) * .5 + clamp(u) * .5)); m.rotation.set(u * 5 * (hash(i + 3) - .5), u * 6 * (hash(i + 4) - .5), a); m.scale.setScalar(1); }); }
  const NY = w.number(1400, 640, 500, "#fff4dc", "#ff5a30"), pY = w.reg(new THREE.Mesh(new THREE.PlaneGeometry(NW * .9, NW * .9 * 640 / 1400), w.basic(NY.t))), wNian = w.text("年代", 2, { color: "#ffe0ad", size: 220 });
  const tunV2 = (n) => 9 * ramp(n, P.DIVE - .5, 1) - 7.6 * ramp(n, P.N54_SLAM, .6) + 12 * ramp(n, A(5), .5) * (1 - ramp(n, P.N62_SMASH, .3)) + 5 * ramp(n, P.L62 + 1, 2);

  function s2(n, t, fx) {
    const fade = ramp(n, A(4) - .2, .7) * (1 - ramp(n, A(6) + 1, 1.4));
    if (n < A(6) + 2.5) tunnel(n, integ(tunV2, n, A(4) - 1), tunV2(n), fade);
    // 54.3
    const S = P.N54_SLAM, X = P.N62_SMASH;
    if (n < X + 3.5) {
      N54.set((54.3 * easeOut((n - A(4) - .4) / 3.2)).toFixed(1) + "%");
      const inU = easeOut((n - A(4)) / 3), back = ease((n - A(5)) / 1.5);
      g54.visible = true; g54.position.set(mix(0, -1, back), mix(.8, 1.1, back), mix(-90, 0, inU) + mix(0, -5, back)); g54.scale.setScalar(.92 * slam(n, S, 1.04, .25));
      g54.userData.burst(Math.max(0, n - X)); g54.userData.mat.opacity = 1 - ramp(n, X + 2.2, 1.2);
    }
    // 62.0 撞穿
    if (n >= X - 3 && n < A(6) + 1.8) {
      const u = easeIn((n - (X - 3)) / 3);
      N62.set((n < X ? 62 * clamp((n - (X - 3)) / 3) : 62).toFixed(1) + "%");
      w.put(p62, 0, .8, n < X ? mix(-110, 0, u) : 0, (n < X ? .92 : .92 * slam(n, X, 1.3, .3)) * mix(1, 1.04, ramp(n, X + .3, 4)), 0, 1 - ramp(n, A(6), .9));
    }
    if (win(n, S, A(5) + .4)) w.put(lab54, 0, -3.1, 1, slam(n, S, 1.8, .3), 0, 1 - ramp(n, A(5), .4));
    if (win(n, P.L62, A(6) + .8)) w.put(lab62, 0, -3.1, 1, slam(n, P.L62, 1.8, .3), 0, 1 - ramp(n, A(6), .7));
    // 价签风暴与大字
    if (n >= P.STORM && n < A(7) + 1.5) tagStorm(n, P.STORM);
    const away = easeIn((n - A(7)) / 1.2);
    if (win(n, P.ZAI, A(7) + 1.2)) w.put(wZai, 0, 2.6, mix(2, 19, away), slam(n, P.ZAI, 3, .3), -.02);
    if (win(n, P.TAO, A(7) + 1.2)) w.put(wTao, 0, -1.3, mix(2.4, 19, away), slam(n, P.TAO, 3, .3), .012);
    // 年份倒滚：黑红转入旧报纸的黄
    const Y0 = P.YEAR + .7;
    if (n >= Y0) {
      const u = ease((n - Y0) / (Z(7) - Y0 - 1)); NY.set(String(Math.round(mix(2026, 1920, u))));
      w.put(pY, -.9, .8, 0, 1 + .05 * (n - Y0)); if (u > .9) w.put(wNian, 5.9, .4, .5, slam(n, Z(7) - 1.6, 1.8, .3));
      w.bg(0x2a1d0e, ramp(n, Y0, Z(7) - Y0));
    }
    rings(n, [S, X], 0);
    // 机位
    if (n < A(5)) w.cam(.8 * Math.sin(n * .5), .4 * Math.cos(n * .7), 15, 0, 0, 0, .05 * Math.sin(n * .6));
    else if (n < X - 2) { const u = ease((n - A(5)) / 1.5); w.cam(mix(0, 6, u), mix(0, -1.5, u), mix(15, 21, u), mix(0, -2, u), 0, 0, -.5 * u); }
    else if (n < P.L62 + 1) { const u = ease((n - X) / .6); w.cam(mix(6, 0, u), mix(-1.5, 0, u), mix(21, 15, u), mix(-2, 0, u), 0, 0, mix(-.5, .03, u)); }
    else if (n < A(6)) w.cam(.5 * Math.sin(n), .3 * Math.cos(n * 1.3), mix(15, 13.5, (n - P.L62 - 1) / 3), 0, 0, 0, .03);
    else w.cam(1.2 * Math.sin(n * .8), .6 * Math.cos(n * .6), 17, 0, 0, 0, .05 * Math.sin(n * .9));
    fx.zoom = (win(n, A(4), A(4) + 2.5) ? .1 : 0) + (win(n, X - 3, X) ? .1 * easeIn((n - (X - 3)) / 3) : 0) + .04 * clamp(tunV2(n) / 12);
    fx.flash = after(n, X, 6) * .6 + after(n, S, 7) * .35 + (1 - ramp(n, A(4), .4)) * .55;
    if (n < A(6)) fx.note = "腾讯调研 × 复旦大学 · 两轮共 27,115 份 · 据媒体报道";
    else if (n < A(7)) fx.note = "广告语与价签均为虚构示意";
  }

  // ── S3 旧报纸穿越 ──
  const paperTs = [0, 1, 2, 3].map((i) => paperTexture(w, i * 11 + 3));
  const FLOCK = Array.from({ length: 34 }, (_, i) => w.reg(new THREE.Mesh(new THREE.PlaneGeometry(3.6, 4.8), new THREE.MeshBasicMaterial({ map: paperTs[i % 4], side: THREE.DoubleSide, toneMapped: false, transparent: true, depthWrite: true }))));
  function flock(n, v0, count = 34, op = 1) { const zf = v0; FLOCK.slice(0, count).forEach((m, i) => { const d = (hash(i + 2) + zf) % 1, ax = (hash(i + 7) - .5), ay = hash(i + 13) - .5; m.visible = true; m.position.set(Math.sign(ax) * (5 + Math.abs(ax) * 26), ay * 17, mix(-70, 18, d)); m.rotation.set(n * .3 * (ay + .3), n * .4 * (ax + .2), hash(i) * 3 + n * .1); m.material.opacity = op * clamp(d * 6); }); }
  const bottle = mkBottle(w);
  const book = w.reg(new THREE.Group());
  const pageM = new THREE.MeshBasicMaterial({ map: paperTs[0], side: THREE.DoubleSide, toneMapped: false });
  const pL = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.8), new THREE.MeshBasicMaterial({ color: 0xe6d7b4, side: THREE.DoubleSide, toneMapped: false })); pL.position.x = -4.2; book.add(pL);
  const pR = pL.clone(); pR.position.x = 4.2; book.add(pR);
  const flipPivot = new THREE.Group(); const flipPg = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 8.8), pageM); flipPg.position.x = 4.2; flipPivot.add(flipPg); flipPivot.position.z = .04; book.add(flipPivot);
  const HAL = "halitosis".split("").map((ch) => w.text(ch, 3.7, { color: "#b0231a", size: 300, weight: 900, pad: 8 }));
  // 字母按真实字宽排，圆孔字母 o 是第 6 个
  const hx = (() => { const c = document.createElement("canvas").getContext("2d"); c.font = "900 300px NotoSerifSC"; const ws = "halitosis".split("").map((ch) => c.measureText(ch).width * 3.7 / (300 * 1.3 + 8)), tot = ws.reduce((a, b) => a + b, 0); let x = -tot / 2; return ws.map((v) => { const m = x + v / 2; x += v; return m; }); })();
  const wKouchou = w.text("口臭", 3, { color: "#20180b", size: 300, stroke: "#efe2c3" });
  const stXue = w.text("学名", 5, { color: "#ff4a36", size: 300, box: "#ff4a36" });
  const N10 = w.text("10 万美元", 2.6, { color: "#fff4dc", size: 300 }), N500 = w.number(1700, 520, 330, "#ff4a33", "#ff2010"), p500 = w.reg(new THREE.Mesh(new THREE.PlaneGeometry(16, 16 * 520 / 1700), w.basic(N500.t)));
  const CONF = Array.from({ length: 26 }, (_, i) => w.reg(new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: paperTs[i % 4], side: THREE.DoubleSide, toneMapped: false, transparent: true }))));
  const stMing = w.text("命名", 4.2, { color: "#ff4a36", size: 300, box: "#ff4a36" }), stXia = w.text("吓人", 4.2, { color: "#ff4a36", size: 300, box: "#ff4a36" }), stYao = w.text("递解药", 3.6, { color: "#ff4a36", size: 300, box: "#ff4a36" });
  const wipe = w.reg(new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(.55, .04, .03), toneMapped: false })));

  function s3(n, t, fx) {
    w.bg(0x2a1d0e, 1 - ramp(n, Z(11) - 1.4, 1.4));
    flock(n, n * .035, n < A(10) ? 34 : 18);
    // 瓶子转，词典翻，字母砸
    const W0 = P.WORD0;
    if (n < W0 + 1) { const go = easeIn((n - (W0 - 3.4)) / 1); bottle.visible = n < W0 - 2.4; bottle.position.set(mix(0, -14, go), .3, mix(0, 4, go)); bottle.rotation.set(.12, n * 1.5, .1 * Math.sin(n)); bottle.scale.setScalar(slam(n, A(8), 1.6, .4) * 1.15); }
    if (win(n, W0 - 3.2, A(9) + 3)) {
      book.visible = true; const inU = easeOut((n - (W0 - 3.2)) / .8); book.position.set(mix(16, 0, inU), .5, -1); book.rotation.y = mix(.6, 0, inU);
      const phase = clamp((n - (W0 - 2.2)) / 2.2) * 5; flipPivot.rotation.y = -(phase % 1) * Math.PI; flipPivot.visible = phase < 5;
      const pushed = n > A(9) + 1.5 ? ease((n - A(9) - 1.5) / 1.2) : 0; book.position.y = .5 - pushed * 12;
    }
    if (n >= W0 && n < P.THRU + 1.2) HAL.forEach((m, i) => { const at = W0 + i * .48; if (n < at) return; w.put(m, hx[i], .6, 1, slam(n, at, 2.4, .25)); });
    if (win(n, A(9), A(9) + 4)) { const p = ease((n - A(9) - 2.4) / .7); w.put(wKouchou, mix(-3.6, -22, p), -3.1, 1.5, slam(n, A(9), 1.8, .3)); }
    // 穿过字母 o
    if (win(n, P.XUEMING, Z(9))) w.put(stXue, 0, .4, -6, slam(n, P.XUEMING, 2.6, .3), -.06);
    // 500 万
    if (win(n, A(10), A(10) + 3)) w.put(N10, 0, .6, 0, slam(n, A(10), 2.2, .3));
    if (win(n, A(10) + 3, Z(10))) {
      const u = easeOut((n - A(10) - 3) / (P.M500 - A(10) - 3)); N500.set(`${Math.round(mix(10, 500, u))} 万美元`);
      w.put(p500, 0, .6, 0, mix(.45, 1, ease((n - A(10) - 3) / 4)) * slam(n, P.M500, 1.3, .3));
    }
    CONF.forEach((m, i) => { const d = n - P.M500; if (d < 0 || d > 3.2) return; const a = hash(i) * 6.283, v = 5 + 8 * hash(i + 3); m.visible = true; m.position.set(v * d * Math.cos(a), v * d * Math.sin(a) * .7 - d * d * .7, 2 + d * 3 * hash(i + 5)); m.rotation.set(d * 5 * hash(i + 1), d * 6 * hash(i + 2), d * 2); m.material.opacity = 1 - clamp(d / 3.2) ** 2; });
    // 三枚印章
    if (n >= A(11)) P.STAMPS.forEach((at, i) => { if (n < at) return; w.put([stMing, stXia, stYao][i], [-6.6, 6.2, 0][i], [3.4, 3, -.2][i], [-4, -3, -1][i], slam(n, at, 3.2, .28), [-.08, .05, -.03][i]); });
    if (n > Z(11) - 1.4) { const u = easeIn((n - (Z(11) - 1.4)) / 1.4); w.put(wipe, .2, -1.2, 3, .1 + 18 * u); }
    // 机位：穿过 o 的圆孔
    const oX = hx[5], TH = P.THRU;
    if (n < W0 - 3.2) w.cam(5 * Math.sin((n - A(8)) * 1.1), 1.6 * Math.cos(n * .7), 12);
    else if (n < A(9) + 3) w.cam(.6 * Math.sin(n * .9), .3, 15);
    else if (n < P.XUEMING) { const u = easeIn((n - (A(9) + 3)) / (P.XUEMING - A(9) - 3)); w.cam(mix(.6, oX, ease(u * 3)), mix(.3, .55, ease(u * 3)), mix(15, -2.5, u), oX, .55, -20); }
    else if (n < A(10)) w.cam(.4 * Math.sin(n), .2, 8, 0, .3, -6);
    else if (n < A(11)) w.cam(1.4 * Math.sin((n - A(10)) * .6), .8 * Math.cos(n * .5), 15 - .3 * (n - A(10)));
    else w.cam(1.6 * Math.sin(n * .6), .6 * Math.cos(n * .8), 16 - .25 * (n - A(11)), 0, 0, 0, .03 * Math.sin(n));
    fx.zoom = win(n, A(9) + 4, P.XUEMING) ? .12 * easeIn((n - A(9) - 4) / 3) : 0;
    fx.flash = after(n, P.XUEMING, 7) * .4 + after(n, P.M500, 7) * .3;
    void TH;
    if (n < A(10)) fx.note = "Marchand 1985 · 图为示意"; else if (n < A(11)) fx.note = "1922–1928 · Marchand 1985 · 图为示意"; else fx.mark = "类比";
  }

  // ── S4 机制 ──
  const toaster = mkToaster(w), smoke = w.cloud(500, .34), fire = w.cloud(6000, .42), NH4 = 14000, cl4 = w.cloud(NH4, .1);
  const headC = (() => { const c = document.createElement("canvas"); c.width = 700; c.height = 860; const g = c.getContext("2d"); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(170, 840); g.bezierCurveTo(150, 720, 80, 660, 80, 460); g.bezierCurveTo(80, 190, 260, 60, 400, 60); g.bezierCurveTo(580, 60, 660, 240, 660, 390); g.bezierCurveTo(660, 450, 700, 520, 680, 540); g.lineTo(630, 560); g.lineTo(620, 690); g.bezierCurveTo(610, 730, 540, 725, 470, 720); g.lineTo(470, 840); g.closePath(); g.fill(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.moveTo(190, 810); g.bezierCurveTo(170, 700, 112, 650, 112, 460); g.bezierCurveTo(112, 210, 280, 92, 400, 92); g.bezierCurveTo(560, 92, 628, 260, 628, 390); g.bezierCurveTo(628, 440, 650, 505, 640, 516); g.lineTo(600, 536); g.lineTo(590, 670); g.bezierCurveTo(584, 700, 520, 696, 440, 690); g.lineTo(440, 810); g.closePath(); g.fill(); return c; })();
  const PH = w.sample(headC, NH4, 9.4);
  const wLoubao = w.text("漏报", 4.4, { color: "#fff4dc", size: 340, stroke: "#400" }), wJiaolv = w.text("焦虑", 4, { color: "#ff3b2a", size: 340 });
  const pzL = mkPuzzle(w, "吓人", -1, 0xd8c79f, "#20180b"), pzR = mkPuzzle(w, "你能做到", 1, 0xe6a63e, "#20180b");
  const wGen1 = w.text("跟着我学，", 4, { color: "#fff4dc", size: 380 }), wGen2 = w.text("你也可以", 4.4, { color: "#ff3b2a", size: 380, stroke: "#200" });

  function s4(n, t, fx) {
    const b = beat(n);
    // 12 爆炸图
    if (n < Z(12)) {
      const e = ease((n - P.EXPLODE) / 1.6);
      alarm.set(n, { explode: e, button: ramp(n, P.EXPLODE + .4, 1.4), lit: .5 * (1 - e) + .2, rx: .1 });
      const a = mix(.15, 1.15, ease((n - A(12)) / (Z(12) - A(12)))); w.cam(15 * Math.sin(a), 2.4, 15 * Math.cos(a) + 2, 0, 0, e * 1.6);
    }
    // 13 面包、烟、大火
    else if (n < Z(13)) {
      toaster.visible = true; toaster.position.set(-3.4, -1.1, 0); toaster.rotation.set(.18, .5, 0); toaster.scale.setScalar(.9);
      const up = ease((n - SMK) / 1); toaster.userData.s1.position.y = .9 + .7 * up; toaster.userData.s2.position.y = .9 + .7 * up;
      alarm.set(n, { x: 4.4, y: 1.7, s: .62, ry: -.4 + .1 * Math.sin(t), lit: n < SMK + 2 ? .12 : .45 + .55 * b });
      if (n < P.EXTINGUISH + 1 && n > SMK) {
        for (let i = 0; i < smoke.N; i++) { const l = (hash(i) + (n - SMK) * .3) % 1, a = Math.sin(l * 9 + i) * (.2 + l * 1.3); smoke.P[i * 3] = -3.4 + a; smoke.P[i * 3 + 1] = .6 + l * 6; smoke.P[i * 3 + 2] = .2; const v = .22 * (1 - l) * ramp(n, SMK, 1) * (1 - ramp(n, P.FIRE, .4)); smoke.Col[i * 3] = v; smoke.Col[i * 3 + 1] = v * .95; smoke.Col[i * 3 + 2] = v * .9; }
        smoke.show();
      }
      const fe = ramp(n, P.FIRE, .3) * (1 - ramp(n, P.EXTINGUISH, .7));
      if (fe > .01) {
        for (let i = 0; i < fire.N; i++) { const h = hash(i), l = (h + (n - P.FIRE) * 1.1) % 1, a = hash(i + .5) * 6.283, r = l * (1.2 + 15 * hash(i * 2.1)); fire.P[i * 3] = -3.4 + r * Math.cos(a) * 1.3; fire.P[i * 3 + 1] = -1.2 + r * Math.sin(a) * .55 + l * 6; fire.P[i * 3 + 2] = l * 20 * fe; const q = (1 - l) * fe; fire.Col[i * 3] = 1.5 * q; fire.Col[i * 3 + 1] = mix(.9, .12, l) * q; fire.Col[i * 3 + 2] = mix(.35, .02, l) * q; }
        fire.show();
      }
      if (win(n, P.FIRE + .4, P.EXTINGUISH + .3)) w.put(wLoubao, 0, 1.1, 4, slam(n, P.FIRE + .4, 2.4, .3), 0, 1 - ramp(n, P.EXTINGUISH, .3));
      w.redL.position.set(-2, 0, 6); w.redL.intensity = 80 * fe;
      w.cam(.8 * Math.sin(n * .6), .6, mix(15, 13, (n - A(13)) / 4));
      fx.mark = "类比"; fx.flash = after(n, P.FIRE, 6) * .3;
    }
    // 14 人头粒子
    else if (n < Z(14)) {
      const { P: p, Col: c } = cl4, a0 = A(14);
      for (let i = 0; i < NH4; i++) { const h = hash(i * .61), ang = hash(i * 2.3) * 6.283, u = easeOut((n - a0 - h * .8) / 1.6), far = 1 - u; p[i * 3] = PH[i * 3] - 3 + far * 18 * Math.cos(ang); p[i * 3 + 1] = PH[i * 3 + 1] + .6 + far * 12 * Math.sin(ang); p[i * 3 + 2] = PH[i * 3 + 2] + far * 10 * (hash(i) - .5); c[i * 3] = 1.2; c[i * 3 + 1] = .72; c[i * 3 + 2] = .52; }
      cl4.show();
      const fly = easeOut((n - a0 - 1) / 1.8);
      alarm.set(n, { x: mix(9, -3.2, fly), y: mix(5, 1.3, fly), z: mix(6, .2, fly), s: .72, ry: (1 - fly) * 5 + .12 * Math.sin(t), lit: .45 + .55 * b });
      if (n >= P.JIAOLV) w.put(wJiaolv, 4.1, .9, 0, slam(n, P.JIAOLV, 2.4, .3));
      w.cam(1.2 * Math.sin((n - a0) * .4), .4, 15 - .25 * (n - a0));
      fx.note = "Nesse · The Smoke Detector Principle · 2001 / 2019";
    }
    // 15 拼图
    else if (n < Z(15)) {
      const c = P.CLICK, u = easeIn((n - (c - 2)) / 2), inL = easeOut((n - A(15)) / 1.2), inR = easeOut((n - A(15) - 1.6) / 1.2), lit = ramp(n, c, .6);
      pzL.visible = true; pzL.position.set(mix(-24, mix(-4.6, -2.6, u), inL), .6, mix(-8, 0, inL)); pzL.rotation.set((1 - inL) * 3, (1 - inL) * 2 + .25 * (1 - u), 0);
      if (n > A(15) + 1.6) { pzR.visible = true; pzR.position.set(mix(24, mix(4.6, 2.6, u), inR), .6, mix(-8, 0, inR)); pzR.rotation.set((1 - inR) * -3, (1 - inR) * -2 - .25 * (1 - u), 0); }
      pzL.userData.mat.emissiveIntensity = .05 + lit * .12 + .45 * after(n, c, 3); pzR.userData.mat.emissiveIntensity = pzL.userData.mat.emissiveIntensity;
      rings(n, [c], -1, 16);
      w.cam(1.5 * Math.sin((n - A(15)) * .5), .6 * Math.cos(n * .4) + .6, 14.5, 0, .6, 0);
      fx.note = "Tannenbaum 等 2015 · d = 0.43 对 0.21 · 研究多为健康与安全信息"; fx.flash = after(n, c, 7) * .35;
    }
    // 16 甩过镜头，大字
    else {
      const wh = ease((n - P.WHIP) / 1.2);
      if (wh < 1) { const g = 1 - wh; pzL.visible = pzR.visible = true; pzL.position.set(-2.6, .6, wh * 16); pzR.position.set(2.6, .6, wh * 16); pzL.rotation.set(0, wh * 7, 0); pzR.rotation.set(0, wh * 7, 0); void g; }
      if (n >= P.GEN1) w.put(wGen1, 0, 2.6, 2, slam(n, P.GEN1, 3, .3), -.015);
      if (n >= P.GEN2) w.put(wGen2, 0, -1.5, 2.4, slam(n, P.GEN2, 3, .3), .012);
      w.cam(.8 * Math.sin(n * .9), .4 * Math.cos(n * .7), 17, 0, .5, 0, .03 * Math.sin(n));
      fx.zoom = wh < 1 ? .1 : 0; fx.note = "虚构示意";
    }
  }
  const SMK = P.SMOKE;

  // ── S5 发动机 ──
  const lab = ["警报", "解药", "安静", "新名词"].map((s) => w.textCanvas(s, { size: 150, color: "#fff4dc", weight: 900 }));
  const eng = mkEngine(w, lab), bot2 = mkBottle(w);
  const wNew = w.text("下一个新名词", 2.8, { color: "#fff4dc", size: 340, stroke: "#400" });
  const EX_TAGS = Array.from({ length: 7 }, () => mkTag(w, T, 2.6));
  const bigTag = mkTag(w, T, 8.6), tearTag = w.tiles(T.front, 8.6, 8.6 * 330 / 620, 8, 4);
  const pageC = projectPageCanvas(w), page = w.reg(new THREE.Mesh(new THREE.PlaneGeometry(14.4, 9.16), new THREE.MeshBasicMaterial({ map: w.tex(pageC), side: THREE.DoubleSide, toneMapped: false })));
  const stJiao = w.text("把人教会", 1.9, { color: "#6ff0a6", size: 240, box: "#6ff0a6" });
  const slash = w.reg(new THREE.Mesh(new THREE.PlaneGeometry(1, .34), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, .2, .12), toneMapped: false, transparent: true })));
  const wKao = w.text("靠吓人来收钱", 2.4, { color: "#ff3b2a", size: 340, stroke: "#200" });
  const lbRu = label("入门", 1.5), lbShu = label("熟练", 1.5, "#fff"), lbJ = label("焦虑", 1.3, "#ff8a6e"), lbX = label("信心", 1.3, "#ffd27a");
  const goldM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.6, .45), toneMapped: false }), gold = w.reg(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), goldM)), gold0 = w.reg(new THREE.Mesh(new THREE.SphereGeometry(.42, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(.9, .55, .16), toneMapped: false })));
  const goldL = new THREE.PointLight(0xffb040, 0, 60); w.scene.add(goldL);
  const speed = (n) => .06 * ramp(n, A(20), 2) + .1 * ramp(n, A(20) + 4, 3) + .2 * ramp(n, P.IGNITE, 1) + .35 * ramp(n, P.TEAR, 1) * (1 - .6 * ramp(n, A(25), 3)) + .25 * ramp(n, Z(30), 3) + .6 * ramp(n, CARD_N[0], 10);
  const engAng = (n) => integ(speed, n, A(20) - 1);
  function exhaust(n, a, k = 1) { EX_TAGS.forEach((m, i) => { const u = (i / 7 + a * .05) % 1; m.visible = true; m.position.set(2.6 + 5 * u + 2 * Math.sin(u * 6 + i), 7 + 7 * u, 2 * Math.sin(i * 2) * u); m.rotation.set(u * 4 + i, u * 5, u * 3 - .3); m.scale.setScalar(k * (.7 + .5 * u)); }); }

  function s5(n, t, fx) {
    goldL.intensity = 0;
    const b = beat(n);
    if (n < Z(17)) {
      // 红灯狂闪，瓶子飞来贴上，红灯骤灭
      const H = P.BOTTLE_HIT, fly = easeIn((n - A(17) - 1) / (H - A(17) - 1)), off = ramp(n, H, .6);
      alarm.set(n, { s: 1, ry: .3 * Math.sin(t * 1.4) * (1 - off), lit: (1 - off) * (.5 + .5 * beat(n * 2)) + .06 });
      if (n > A(17) + 1) { bot2.visible = true; bot2.position.set(mix(16, 3.4, fly), mix(-9, -.5, fly), mix(7, 2, fly)); bot2.rotation.set((1 - fly) * 5, n * .6, (1 - fly) * 4 - .3); bot2.scale.setScalar(.72); }
      w.redL.position.set(0, 0, 3); w.redL.intensity = (1 - off) * (12 + 40 * b);
      w.cam(3 * Math.sin((n - A(17)) * .7) * (1 - off), 1 * Math.cos(n * .9) * (1 - off), mix(11, 9, ease((n - A(17)) / 4)));
    } else if (n < Z(18)) {
      // 一会儿安静：全片唯一的慢镜
      const u = (n - A(18)) / (Z(18) - A(18));
      alarm.set(n, { s: 1, lit: .02, rx: .02 * Math.sin(t * .5) });
      bot2.visible = true; bot2.position.set(3.4, -.5, 2); bot2.rotation.set(0, n * .05, -.3); bot2.scale.setScalar(.72);
      w.cam(.1 * Math.sin(t * .4), 0, mix(8.2, 6.2, u));
    } else if (n < Z(19)) {
      const N = P.NEWWORD, on = n >= N, lit = on ? .55 + .45 * beat(n) + after(n, N, 3) : .06;
      alarm.set(n, { s: on ? slam(n, N, 1.2, .3) : 1, lit, ry: on ? .4 * Math.sin((n - N) * .9) : 0 });
      w.redL.position.set(0, 0, 3); w.redL.intensity = on ? 14 + 44 * beat(n) : 0;
      if (on) w.put(wNew, 0, -2.6, 1.5, slam(n, N, 3, .28), -.015);
      rings(n, [N, N + 2, N + 4]);
      w.cam(on ? 2.2 * Math.sin((n - N) * .6) : 0, .4, on ? 13 : mix(6.2, 5.6, (n - A(19))));
      fx.flash = after(n, N, 6) * .6;
    } else if (n < P.IGNITE + 6 + 1) {
      // 四个齿轮逐个砸进来；点火时猛地拉开
      const I = P.IGNITE, ang = engAng(n), body = n >= I ? 1 : 0;
      eng.set(ang, body); eng.g.position.set(body ? 0 : 0, body ? -1.2 : 0, 0); eng.g.rotation.set(0, n < I ? 0 : .22 * Math.sin((n - I) * .45), 0);
      eng.G4.forEach((p, i) => { const at = P.GEARS[i], u = easeOut((n - at) / .55), [hx0, hy0] = [[-1.5, 1.45], [1.5, 1.45], [1.5, -1.45], [-1.5, -1.45]][i]; p.visible = n >= at; p.position.set(hx0 * (1 + (1 - u) * 6), hy0 * (1 + (1 - u) * 6), (1 - u) * 14); p.rotation.set(0, (1 - u) * 3, 0); });
      if (body) { const lit = .5 + .5 * b; alarm.set(n, { x: Math.sin((n - I) * .45) * 0, y: 5.2 - 1.2, z: 0, s: .55, lit }); alarm.g.position.set(-1.4, 4.9, 0); exhaust(n, ang); w.redL.position.set(0, 2, 6); w.redL.intensity = 18 + 40 * b; }
      if (n < I) { const u = (n - A(20)) / (I - A(20)); w.cam(mix(3, -2.4, u), mix(-1.4, 1, u), mix(13, 6.4, ease(u)), 0, 0, 0, .25 * Math.sin(u * 3)); }
      else { const u = easeOut((n - I) / 1.6), a = .3 * Math.sin((n - I) * .5); w.cam(mix(-2, 22 * Math.sin(a), u), mix(1, 2.4 + 1 * Math.cos(n * .4), u), mix(5, 22 * Math.cos(a), u), mix(0, -.6, u), mix(0, 1.2, u), 0); fx.mark = "类比"; }
      fx.zoom = after(n, I, 2.2) * .2; fx.flash = after(n, I, 6) * .5;
    } else {
      const ang = engAng(n), inTag = n < Z(24);
      if (inTag) {
        eng.set(ang, 1); eng.g.position.set(0, -1.2, -30); eng.g.rotation.set(0, .3 * Math.sin(n * .3), 0);
        alarm.set(n, { lit: .5 + .5 * b, s: .55 }); alarm.g.position.set(-1.4, 3.7, -30);
        exhaust(n, ang, 1);
        EX_TAGS.forEach((m) => { m.position.z -= 30; m.position.y -= 1.2; });
        // 22–24：价签翻面，页面展开；盖回去；朱笔撕碎
        const F = P.FLIP, C = P.COVER, inU = easeOut((n - A(22)) / 1.1), flip = (n < C ? ease((n - F) / .8) : 1 - ease((n - C) / .6)) * Math.PI;
        const px = ease((n - A(22) - 1) / 2);
        w.put(page, 3.9, .7, -1, mix(.2, 1, px) * .9, .01); if (n < A(22) + 1) page.visible = false;
        const shift = ease((n - C) / .6);
        const tx = mix(-5.2, 1, shift), ty = mix(1.5, 1.4, shift), ts = mix(.92, .62, shift);
        if (n < P.TEAR) { bigTag.visible = true; bigTag.position.set(mix(-5.2, tx, inU), mix(-9, ty, inU), mix(8, 2, inU)); bigTag.rotation.set((1 - inU) * 2, (1 - inU) * 3 + flip, -.08); bigTag.scale.setScalar(ts); }
        if (n >= A(23) && n < A(24)) w.put(stJiao, -5.4, -1.3, 3, slam(n, P.GREEN, 2.6, .3) * (n >= P.GREEN ? 1 : 0.001), -.05);
        if (n >= P.SLASH && n < P.SLASH + 1.4) { const u = easeOut((n - P.SLASH) / .3); slash.visible = true; slash.position.set(mix(-16, 0, u), mix(5, 0, u), 3); slash.rotation.set(0, 0, -.3); slash.scale.set(36 * u, 1 - .9 * ramp(n, P.SLASH + .5, .9), 1); slash.material.opacity = 1 - ramp(n, P.SLASH + .7, .7); }
        if (n >= P.TEAR) { tearTag.visible = true; tearTag.position.set(1, 1.4, 2); tearTag.rotation.set(0, 0, -.08); tearTag.scale.setScalar(.62); tearTag.userData.burst(n - P.TEAR, .35); tearTag.userData.mat.opacity = 1 - ramp(n, P.TEAR + 2, 1.2); }
        if (n >= P.TEAR + .5) w.put(wKao, 0, -1.9, 3, slam(n, P.TEAR + .5, 2.6, .3), -.01);
        if (n >= P.TEAR) { page.visible = n < P.TEAR + .6; }
        w.cam(.9 * Math.sin(n * .5), .4 * Math.cos(n * .6), 16);
        fx.flash = after(n, P.SLASH, 6) * .5 + after(n, F, 7) * .25;
        if (n >= A(23) && n < A(24)) fx.note = "开源许可通常不禁止商用 · 具体要看各项目的许可证";
        if (n < A(23)) fx.note = "项目页面为虚构示意";
      } else {
        // 25–26：两行两列
        const X0 = -2.6, X1 = 4.4, Y0 = 3.4, Y1 = -.1;
        w.put(lbRu, X0, 6, 0, slam(n, A(25), 1.6, .3)); w.put(lbShu, X1, 6, 0, slam(n, A(25) + 2, 1.6, .3));
        w.put(lbJ, -8.4, Y0, 0, 1);
        al2.set(n, { x: X0, y: Y0, s: .46, lit: .28, ry: .15 * Math.sin(t * .6) });
        const shu = easeOut((n - A(25) - 2) / .6), lit = (.5 + .5 * b) * clamp(shu);
        alarm.set(n, { x: X1, y: Y0, s: mix(.3, .7, shu), lit, ry: .15 * Math.sin(t * .7) });
        w.redL.position.set(X1, Y0, 4); w.redL.intensity = 16 + 30 * b;
        if (n >= A(26)) {
          w.put(lbX, -8.4, Y1, 0, slam(n, A(26), 1.6, .3)); w.put(gold0, X0, Y1, 0, 1);
          const g = ease((n - P.GOLD) / 3.4), r = mix(.4, 1, ease((n - P.GOLD) / 1)) + .7 * g + after(n, P.GOLD_PEAK, 2) * 1.2;
          w.put(gold, X1, Y1, 0, r); goldM.color.setRGB(2.6, 1.6, .45);
          goldL.position.set(X1, Y1, 4); goldL.intensity = 60 * g + 40;
        }
        w.cam(1.6 * Math.sin(n * .5), .6 + .5 * Math.cos(n * .6), 18, -.6, 1, 0);
        fx.note = "同一项调查 · 相关关系，不代表学了才焦虑 · 据媒体报道"; fx.flash = after(n, P.GOLD_PEAK, 6) * .25;
      }
    }
  }

  // ── S6 三问与冲顶 ──
  const plate = () => w.reg(new THREE.Mesh(new THREE.BoxGeometry(5.6, 6, .35), new THREE.MeshBasicMaterial({ color: 0xcdbd96, toneMapped: false })));
  const PL = [plate(), plate(), plate()];
  const NUM = ["一", "二", "三"].map((s) => w.text(s, 1.6, { color: "#20180b", size: 160 }));
  const MK = [["来源", 2.8], ["教会，还是吓人", 1.12], ["承诺收益", 1.75]].map(([s, h]) => w.text(s, h, { color: "#b0231a", size: 200, box: "#b0231a" }));
  const LINES = ["再不学就晚了", "最后 3 天", "下一个被淘汰的", "别再犹豫了", "你还在等什么", "错过这一次"];
  const pgT = LINES.map((s, i) => { const c = document.createElement("canvas"); c.width = 900; c.height = 480; const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 40, 480); gr.addColorStop(0, "#efe2c3"); gr.addColorStop(1, "#cdb88c"); g.fillStyle = gr; g.fillRect(0, 0, 900, 480); g.strokeStyle = "#5c4522"; g.lineWidth = 6; g.strokeRect(18, 18, 864, 444); g.fillStyle = i % 2 ? "#a81f14" : "#20180b"; g.textAlign = "center"; g.textBaseline = "middle"; g.font = `900 ${s.length > 6 ? 104 : 128}px NotoSerifSC`; g.fillText(s, 450, 240); return w.tex(c); });
  const PAGES = Array.from({ length: 16 }, (_, i) => w.reg(new THREE.Mesh(new THREE.PlaneGeometry(9, 4.8), new THREE.MeshBasicMaterial({ map: pgT[i % 6], side: THREE.DoubleSide, toneMapped: false, transparent: true }))));
  const flyV = (n) => .05 + .012 * Math.max(0, n - A(31));
  const redBall = w.reg(new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, .07, .05), toneMapped: false })));
  const RED_R = Array.from({ length: 6 }, () => w.reg(new THREE.Mesh(new THREE.TorusGeometry(1, .03, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, .55, .42), transparent: true, depthWrite: false, toneMapped: false }))));
  const btn3 = w.reg(new THREE.Group()), bc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, .9, 64), M.red), bb = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.3, .4, 64), M.dark); bc.rotation.x = bb.rotation.x = Math.PI / 2; bb.position.z = -.5; btn3.add(bc, bb);

  function s6(n, t, fx) {
    goldL.intensity = 0;
    const ang = engAng(n), b = beat(n);
    if (n < Q_N[0]) {
      eng.set(ang, 1); eng.g.position.set(0, -1.2, -30); eng.g.rotation.set(0, .3 * Math.sin(n * .3), 0);
      alarm.set(n, { s: .55, lit: .5 + .5 * b }); alarm.g.position.set(-1.4, 3.7, -30); exhaust(n, ang);
      EX_TAGS.forEach((m) => { m.position.z -= 30; m.position.y -= 1.2; });
    }
    if (n < A(31)) {
      // 三块铁牌、三枚印章
      const xs = [-6.4, 0, 6.4];
      PL.forEach((m, i) => { const at = P.PLATES[i]; if (n < at) return; const u = easeOut((n - at) / .35), mk = P.MARKS[i]; m.visible = true; m.position.set(xs[i], .9, mix(12, 0, u)); m.rotation.set((1 - u) * 1.2, 0, (1 - u) * .4 * (i - 1)); m.scale.setScalar(1);
        w.put(NUM[i], xs[i], 3, .24 + mix(12, 0, u)); if (n >= mk) { const s = slam(n, mk, 2.6, .28); w.put(MK[i], xs[i], .1, .26, s, -.04 + i * .02); } });
      const act = n < A(28) ? 0 : n < A(29) ? 0 : n < A(30) ? 1 : 2;
      const focus = n < A(28) ? 0 : xs[act] * .35;
      w.cam(focus + .7 * Math.sin(n * .6), .9 + .4 * Math.cos(n * .7), 19.5, focus * .9, -.4, 0, .025 * Math.sin(n));
      if (n >= A(30)) fx.note = "中消协 2026 · 培训领域常见问题包括夸大收益承诺";
    } else if (n < Q_N[0] + .2) {
      // 广告页迎面飞来
      const z = integ(flyV, n, A(31) - 1);
      PAGES.forEach((m, i) => { const d = (i / PAGES.length + z) % 1, ang2 = i * 2.399, R = 3 + 11 * d * d; m.visible = true; m.position.set(R * 1.5 * Math.cos(ang2), R * .85 * Math.sin(ang2) + .8, mix(-60, 17, d * d)); m.rotation.set(.3 * Math.sin(i + n * .3), .3 * Math.cos(i + n * .25), (hash(i) - .5) * .5); m.material.opacity = clamp(d * 8) * (1 - ramp(d, .93, .07)); });
      // 中央大按钮
      if (n < CARD_N[0]) { const p = ramp(n, P.PRESS, .25), g = easeOut((n - A(31) - .5) / .8); btn3.visible = n > A(31) + .5; btn3.position.set(0, .9, 4); btn3.rotation.set(.12 * Math.sin(n * .7) + .12, .22 * Math.sin(n * .9), 0); btn3.scale.setScalar(g * (1 - .08 * p)); bc.position.z = -.4 * p; M.red.emissiveIntensity = 1 + 3 * p; }
      w.redL.position.set(0, 1, 12); w.redL.intensity = n < CARD_N[0] ? 30 + 60 * ramp(n, P.PRESS, .3) : 0;
      w.cam(1.2 * Math.sin(n * .8), .7 + .5 * Math.cos(n * .6), 17, 0, .6, 0, .05 * Math.sin(n * .9));
      fx.zoom = .06 * clamp((n - A(31)) / 6); fx.flash = after(n, P.PRESS, 5) * .5;
      if (n < CARD_N[0]) fx.note = "飞过的广告语均为虚构示意";
      // 冲进红灯
      if (n > P.RED) { const u = easeIn((n - P.RED) / 2); w.put(redBall, 0, .6, mix(-20, 12, u), mix(.4, 8, u)); }
    }
    if (n >= Q_N[0]) {
      w.bg(0xa8150e, 1);
      const m = n - Q_N[0], zz = .35 * m + .05 * m * m;
      RED_R.forEach((r, i) => { const v = (i / 6 + zz) % 1; w.put(r, 0, 0, mix(-30, 12, v * v), 2 + 9 * v, 0, (1 - v) * .8); });
      w.cam(0, 0, 16, 0, 0, 0, .04 * Math.sin(n * .8));
      fx.zoom = .05 + .02 * m;
    }
    fx.flash = Math.max(fx.flash, ramp(n, END_N - .7, .5) * 2);
  }
  void M;

  return {
    state(n, t, fx) {
      if (n < P.DIVE) s1(n, t, fx);
      else if (n < A(8)) s2(n, t, fx);
      else if (n < A(12)) s3(n, t, fx);
      else if (n < A(17)) s4(n, t, fx);
      else if (n < A(27)) s5(n, t, fx);
      else s6(n, t, fx);
    },
  };
}
