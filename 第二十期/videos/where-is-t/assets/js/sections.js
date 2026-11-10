// 六段的 build / state 合在一个文件里（AGENTS 4.1）。每段：
//   cam   —— 本段的机位关键帧 [t, 位置, 看向]，film.js 把六段拼成一条轨道
//   notes —— 注释带 [入, 出, 文字]（每帧只一条）
//   badge —— 角标 [入, 出, 文字]（类比 / 图为示意 / 假说…）
//   state(t) —— 只改场景参数，不重建 DOM；窗口外主动隐藏
// 所有时刻都从 beats.js 的 C[k]（第 k 句字幕）和 B(n) 取，不手写秒数。
import * as THREE from "three";
import { B, BEAT, C, SEC } from "./beats.js";
import { clamp, lerp, ramp, ease, easeIn, easeOut, easeOutBack, win, pulse, rng } from "./lib.js";
import { COL, GROUND, ST } from "./world.js";
import { clock, codePanel, book, quotePanel, beam, miniClock, glowSprite, canvasPlane } from "./rig.js";

const rad = (d) => (d * Math.PI) / 180;
const NEWTON = ["绝对的、真实的、数学的时间，", "自身均匀地流逝，", "与任何外物无关。"];

// 代码配色（样张 A）
const K = "#ffb454", Wt = "#d7e4ea", N = "#ff9b73", Cm = "#5d7d8e", F = "#7ff0d2", Dm = "#5f7584";
const L = (...segs) => segs;
const CODE = [
  L(["let", K], [" t = ", Wt], ["0", N], [";", Wt]),
  L(["while", K], [" (", Wt], ["true", K], [") {", Wt]),
  L(["  t += dt;", Wt]),
  L(["  world.", Dm], ["update", "#4d8f80"], ["(t);", Dm]),
  L(["}", Wt]),
  L(),
  L(["const", K], [" me = ", Wt], ["new", K], [" Instance", F], ["();", Wt]),
];
const len = (segs) => segs.reduce((s, x) => s + x[0].length, 0);
// 打字：从 t0 起以 cps 字/秒敲出第 i 行
const typed = (t, t0, cps, segs) => clamp(Math.floor((t - t0) * cps), 0, len(segs));

export function buildSections(world, inst) {
  const S = {};

  // ══════════ S1 冷开场 + S2 历史锚点 ══════════
  {
    const panel = codePanel(world);
    panel.mesh.position.set(0, 0.6, 0);
    const bk = book(world);
    const qp = quotePanel(world, NEWTON);
    const big = clock(world, { r: 5, glow: 0.55, tick: "#7fd8c4" });
    const bm = beam(world, { r: 0.9, h: 26 });
    bm.mesh.position.set(0, GROUND, -14);
    // 实例 → 大钟的细光
    const beamM = new THREE.LineBasicMaterial({ color: COL.teal, transparent: true, opacity: 0 });
    const clockPos = new THREE.Vector3(0, 6.2, -22);
    const links = inst.list.concat([inst.me]).map((o) => {
      const geo = new THREE.BufferGeometry().setFromPoints([o.g.position.clone(), clockPos.clone().add(new THREE.Vector3(0, -5, 0))]);
      const l = new THREE.Line(geo, beamM); world.scene.add(l); return l;
    });

    // 时刻（全部取自字幕窗口）
    const T1 = C[1].t0 + 0.3, T2 = C[2].t0 + 0.15, T3 = C[3].t0 + 0.4, ME = C[3].t0 + 0.7, SQ = C[4].t0 + 0.3;
    const RISE = C[8].t0 + 1.2;

    S.s12 = {
      cam: [
        [0, [-1.55, 1.85, 2.3], [-1.55, 1.72, 0]],                 // 贴着光标：第一帧就是代码本身
        [C[1].t0 + 2.0, [-1.15, 1.7, 3.3], [-1.1, 1.5, 0]],
        [C[1].t1, [0.2, 1.25, 8.6], [0, 0.45, 0]],                // 后拉：编辑器悬在网格大地上空
        [C[2].t1, [0.8, 1.45, 10.8], [0, 0.25, -1]],
        [C[3].t1, [1.9, 2.9, 16.5], [0.4, -0.3, -4]],             // 整片大地
        [C[4].t1, [0.3, 1.25, 6.6], [0, 0.75, 0]],                // 推回面板：红波浪线
        [C[5].t1, [0, 1.6, 6.5], [0, 1.6, -14]],                  // 面板退开，看向深处的光
        [C[6].t1, [0.2, 1.2, -0.6], [-0.4, 0.9, -10.5]],
        [C[7].t1, [0.2, 1.2, 3.2], [0.2, 0.9, -9.6]],             // 引文卡
        [C[8].t1, [0, 0.4, 8.5], [0, 4.0, -18]],                  // 拉开抬头：大钟升起
        [C[9].t1, [0, 2.0, 4.5], [0, 4.6, -22]],
        [C[10].t1, [0, 3.4, -1.5], [0, 5.0, -22]],
        [C[11].t1, [0, 4.2, -5.5], [0, 5.4, -22]],
      ],
      notes: [
        [C[8].t0 + 1.6, C[8].t1, "牛顿的「绝对时间」：均匀流逝、与外物无关——相当于一个全局变量（类比）"],
        [C[10].t0 + 0.3, C[10].t1, "1967 年起，1 秒＝铯-133 原子特定辐射的 9 192 631 770 个周期 · BIPM"],
      ],
      badge: [
        [ME, C[4].t1, "类比"],
        [C[6].t0 + 0.4, C[7].t1, "图为示意"],
      ],
      labels: [
        // [锚点函数, html, 入, 出]
        [() => inst.me.g.position.clone().add(new THREE.Vector3(0, 0.55, 0)), `<span class="mono">me</span> · 你`, ME + 0.2, C[4].t1],
        [() => clockPos.clone().add(new THREE.Vector3(0, -2.2, 0.6)), "1/86 400 天", C[10].t0 + 0.3, C[10].t0 + 2.6],
        [() => clockPos.clone().add(new THREE.Vector3(0, -2.2, 0.6)), "铯-133", C[10].t0 + 2.8, C[11].t0 + 0.4],
      ],
      state(t) {
        const on = t < SEC.s3[0] + 0.6;
        // ── 编辑器 ──
        const pAway = ease(ramp(t, C[5].t0, 1.7));
        panel.mesh.position.set(lerp(0, -8, pAway), lerp(0.6, 1.4, pAway), lerp(0, -7, pAway));
        panel.mesh.rotation.y = lerp(0, rad(32), pAway);
        panel.alpha(on ? lerp(1, 0.0, ease(ramp(t, C[6].t0, 1.4))) : 0);
        const lines = CODE.map((segs, i) => ({ segs, typed: 0, strike: 0, squig: 0, hl: 0, dim: 0 }));
        lines[0].typed = typed(t, T1, 9, CODE[0]);
        let acc = T2;
        for (let i = 1; i <= 4; i++) { lines[i].typed = typed(t, acc, 16, CODE[i]); acc += len(CODE[i]) / 16 + 0.08; }
        lines[6].typed = typed(t, T3, 15, CODE[6]);
        lines[2].squig = ease(ramp(t, SQ, 0.45));
        lines[2].hl = win(t, SQ, C[5].t0 + 0.6, 0.4, 0.6);
        // 光标跟着正在打的那一行：最后一行已开始打的
        let cur = 0;
        lines.forEach((ln, i) => { if (ln.typed > 0) cur = i; });
        const blink = Math.floor(t / (BEAT / 2)) % 2 === 0;
        panel.draw({ title: "universe.js", lines, caret: [cur, t < T1 || (t < C[4].t0 && blink)], tip: { text: "⚠ 1 个问题", k: ease(ramp(t, SQ + 0.5, 0.3)) } });

        // ── 实例：t 每跳一拍，所有光点同步一闪（全局变量）──
        const beatK = t >= T2 ? Math.exp(-((t - T2) % BEAT) * 7) : 0;
        const meK = easeOutBack(ramp(t, ME, 0.6));
        for (const o of inst.list) {
          o.dotM.emissiveIntensity = 0.7 + 1.2 * beatK; o.ringM.opacity = 0.35 + 0.4 * beatK;
        }
        inst.me.g.scale.setScalar(Math.max(meK, 0.0001)); inst.me.g.visible = meK > 0.001;
        inst.me.dotM.emissiveIntensity = 1.2 + 1.2 * beatK;

        // ── 光柱 → 书 → 引文 ──
        bm.set(on ? 0.9 * win(t, C[5].t0 + 0.25, C[7].t0, 0.9, 1.0) : 0);
        const bUp = easeOut(ramp(t, C[6].t0, 1.9)), bSide = ease(ramp(t, C[7].t0, 1.2));
        bk.mesh.position.set(lerp(0, -4.4, bSide), lerp(-5, 1.0, bUp) - 0.1 * bSide, lerp(-10, -11, bSide));
        bk.mesh.rotation.set(rad(-4), lerp(rad(88), 0, ease(ramp(t, C[6].t0 + 0.4, 1.8))) + rad(26) * bSide, rad(2));
        bk.alpha(on ? win(t, C[6].t0, C[8].t0 + 0.8, 0.6, 1.0) : 0);
        const qk = ease(ramp(t, C[7].t0 + 0.15, 2.9)), q2 = ease(ramp(t, C[8].t0 + 0.15, 0.6));
        qp.draw(qk, q2);
        qp.mesh.position.set(0.9, lerp(1.0, -0.4, ease(ramp(t, C[8].t0 + 1.0, 2))), -9.6);
        qp.mesh.rotation.y = rad(-6);
        qp.alpha(on ? win(t, C[7].t0, C[8].t0 + 0.9, 0.7, 0.8) : 0);

        // ── 全局大钟：从地平线下升起，秒针每拍走一格（和 t 同步）──
        const rise = easeOut(ramp(t, RISE, 2.4));
        const shake = t > C[12].t0 && t < C[12].t0 + 0.6 ? 0.18 * Math.sin(t * 90) * (1 - ramp(t, C[12].t0, 0.6)) : 0;   // 碎裂前抖一下
        big.g.position.set(clockPos.x + shake, lerp(-8, clockPos.y, rise), clockPos.z);
        const tick = Math.floor(t / BEAT) + ease(clamp(((t % BEAT) / BEAT) * 5));
        big.set({ sec: tick * 6, min: 60 + tick * 0.1, hour: 305, alpha: t < C[12].t0 + 1.0 ? ease(ramp(t, RISE, 0.9)) * (1 - ease(ramp(t, C[12].t0 + 0.55, 0.25))) : 0 });
        // 刻度加密 60 → 120 → 240 → 480（「越来越准」），之后标注
        const dens = t < C[9].t0 + 0.6 ? 60 : t < C[9].t0 + 1.4 ? 120 : t < C[9].t0 + 2.2 ? 240 : 480;
        big.drawFace(dens);
        beamM.opacity = on ? 0.2 * ease(ramp(t, RISE + 1.2, 1.2)) * (0.8 + 0.2 * beatK) * (1 - ramp(t, C[12].t0 + 0.5, 0.3)) : 0;
        for (const l of links) l.visible = beamM.opacity > 0.002;
      },
      // 「秒」字：从大钟中心推向镜头（DOM）
      sec: { anchor: clockPos, t0: C[11].t0 + 0.3, t1: SEC.s3[0] + 0.2 },
    };
  }

  // ══════════ S3 机制：大钟碎成小钟 → 类与实例 → 飞机 → 光钟 → 手机导航 ══════════
  {
    const CP = new THREE.Vector3(0, 6.2, -22);              // 大钟位置（与 S2 一致）
    const flash = glowSprite(world, { size: 14, color: COL.teal });
    flash.s.position.copy(CP);
    const r = rng(23);
    const all = inst.list.concat([inst.me]);
    const LAND = C[12].t0 + 0.75;
    const minis = all.map((o) => {
      const isMe = o === inst.me;
      const m = miniClock(world, { r: isMe ? 0.42 : 0.3 });
      const target = o.g.position.clone().add(new THREE.Vector3(0, 0.75, 0));
      const d = target.distanceTo(CP);
      return { m, o, isMe, target, from: CP.clone().add(new THREE.Vector3((r() - 0.5) * 3, (r() - 0.5) * 3, (r() - 0.5) * 1)), delay: d * 0.018, rate: 0.75 + 0.5 * r(), ph: r() * 360 };
    });
    S.minis = minis;                                         // S6 结尾还要用

    // 类与实例
    const p2 = codePanel(world);
    p2.mesh.position.set(7.5, 0.7, -7); p2.mesh.rotation.y = rad(-20);
    const CLS = [
      L(["class", K], [" Thing", F], [" {", Wt]),
      L(["  clock = ", Wt], ["new", K], [" Clock", F], ["();", Wt]),
      L(["}", Wt]),
      L(),
      L(["const", K], [" a  = ", Wt], ["new", K], [" Thing", F], ["();", Wt]),
      L(["const", K], [" b  = ", Wt], ["new", K], [" Thing", F], ["();", Wt]),
      L(["const", K], [" me = ", Wt], ["new", K], [" Thing", F], ["();", Wt]),
    ];

    // 线框地球与两条航线（向东琥珀、向西冷白）
    const GB = new THREE.Vector3(...ST.globe);
    const globe = new THREE.Group(); globe.position.copy(GB); world.scene.add(globe);
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(4, 24, 14)), new THREE.LineBasicMaterial({ color: COL.teal, transparent: true, opacity: 0.3 }));
    const core = new THREE.Mesh(new THREE.SphereGeometry(3.95, 48, 32), new THREE.MeshBasicMaterial({ color: 0x08121c, transparent: true, opacity: 0.92 }));
    globe.add(core, wire);
    const lat = rad(32), RR = 4.25;
    const arcPts = (dir) => Array.from({ length: 161 }, (_, i) => { const a = dir * (i / 160) * Math.PI * 2 + rad(80); return new THREE.Vector3(RR * Math.cos(lat) * Math.cos(a), RR * Math.sin(lat), RR * Math.cos(lat) * Math.sin(a)); });
    const mkArc = (dir, col) => { const pts = arcPts(dir); const geo = new THREE.BufferGeometry().setFromPoints(pts); const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: col, transparent: true })); globe.add(ln); return { ln, geo, pts }; };
    const east = mkArc(1, COL.amber), west = mkArc(-1, 0xd7f6ee);
    const planeE = glowSprite(world, { size: 0.9, color: COL.amber }), planeW = glowSprite(world, { size: 0.9, color: 0xd7f6ee });
    const home = glowSprite(world, { size: 1.0, color: COL.teal });
    const trio = [0, 1, 2].map((i) => miniClock(world, { r: 0.85, color: i === 1 ? COL.amber : i === 2 ? 0xd7f6ee : COL.teal }));
    const trioPos = [-2.4, 0, 2.4].map((dx) => GB.clone().add(new THREE.Vector3(dx, 1.6, 5.6)));

    // 光钟台：一块发光边的台面＋两台光钟；高处那台抬起，旁边一把刻度尺
    const OC = new THREE.Vector3(...ST.optic);
    const table = new THREE.Mesh(new THREE.BoxGeometry(5, 0.16, 2.2), new THREE.MeshStandardMaterial({ color: 0x0f1c28, metalness: 0.6, roughness: 0.4, transparent: true }));
    table.position.set(OC.x, OC.y + 1.2, OC.z); world.scene.add(table);
    const tEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(5, 0.16, 2.2)), new THREE.LineBasicMaterial({ color: COL.teal, transparent: true })); table.add(tEdge);
    const baseM = new THREE.MeshStandardMaterial({ color: 0x15303a, emissive: COL.teal, emissiveIntensity: 0.25, transparent: true });
    const unit = (x) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.5, 32), baseM); b.position.y = 0.25; g.add(b); g.position.set(x, OC.y + 1.28, OC.z); world.scene.add(g); return g; };
    const lowU = unit(OC.x - 1.2), highU = unit(OC.x + 1.2);
    const lowC = miniClock(world, { r: 0.55 }), highC = miniClock(world, { r: 0.55 });
    const ruler = canvasPlane(world, { px: 128, py: 512, w: 0.36 });
    ruler.paint("r", (g, w, h) => { g.fillStyle = "rgba(127,240,210,.18)"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7ff0d2"; g.lineWidth = 4; for (let i = 0; i <= 33; i++) { const y = h - 8 - (i / 33) * (h - 16); g.beginPath(); g.moveTo(w, y); g.lineTo(w - (i % 10 === 0 ? 70 : i % 5 === 0 ? 48 : 28), y); g.stroke(); } });

    // 手机导航（示意）＋地面钟与卫星钟
    const PD = new THREE.Vector3(...ST.phone);
    const phone = new THREE.Mesh(new THREE.BoxGeometry(2.3, 4.6, 0.2), new THREE.MeshStandardMaterial({ color: 0x0b1018, metalness: 0.5, roughness: 0.35, transparent: true }));
    phone.position.copy(PD); world.scene.add(phone);
    const screen = canvasPlane(world, { px: 512, py: 1024, w: 2.08 });
    screen.mesh.position.copy(PD).add(new THREE.Vector3(0, 0, 0.11));
    const gC = miniClock(world, { r: 0.7 }), sC = miniClock(world, { r: 0.95, color: COL.amber });
    const gPos = PD.clone().add(new THREE.Vector3(-3.0, 2.4, 1.0)), sPos = PD.clone().add(new THREE.Vector3(4.6, 4.2, -2.0));
    const satM = new THREE.LineDashedMaterial({ color: COL.teal, dashSize: 0.18, gapSize: 0.16, transparent: true });
    const satLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([gPos, sPos]), satM); satLine.computeLineDistances(); world.scene.add(satLine);
    function paintMap(drift) {
      screen.paint(drift.toFixed(3), (g, w, h) => {
        g.fillStyle = "#0a131d"; g.beginPath(); g.roundRect(0, 0, w, h, 40); g.fill();
        g.strokeStyle = "rgba(127,240,210,.16)"; g.lineWidth = 10;
        for (const [x0, y0, x1, y1] of [[0, 300, 512, 260], [0, 620, 512, 700], [140, 0, 180, 1024], [380, 0, 330, 1024], [0, 900, 512, 860]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
        g.strokeStyle = "rgba(95,184,166,.25)"; g.lineWidth = 26; g.beginPath(); g.moveTo(-20, 470); g.bezierCurveTo(160, 420, 300, 560, 540, 500); g.stroke();
        const px = 256, py = 560, dx = drift * 190, dy = -drift * 230;
        if (drift > 0.01) { g.setLineDash([14, 12]); g.strokeStyle = "#ffb454"; g.lineWidth = 6; g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx, py + dy); g.stroke(); g.setLineDash([]); }
        g.fillStyle = "rgba(127,240,210,.25)"; g.beginPath(); g.arc(px, py, 46, 0, 7); g.fill();
        g.fillStyle = "#7ff0d2"; g.beginPath(); g.arc(px, py, 18, 0, 7); g.fill();
        if (drift > 0.01) { g.fillStyle = "#ffb454"; g.beginPath(); g.arc(px + dx, py + dy, 20, 0, 7); g.fill();
          g.font = "600 46px NotoSC"; g.textAlign = "center"; g.fillText(`偏出 ${(drift * 11).toFixed(1)} 公里`, 256, 130); }
      });
    }

    const S3 = SEC.s3, inS3 = (t) => t > S3[0] - 0.2 && t < S3[1] + 1.2;
    S.s3 = {
      cam: [
        [C[12].t0 + 0.6, [0, 4.0, -4.5], [0, 5.4, -22]],             // 大钟抖一下
        [C[13].t0 + 0.5, [0, 4.6, 8.5], [0, 0, -20]],               // 拉高：碎片像雨一样落向大地
        [C[13].t1, [-2, 2.2, 6], [1, -1, -16]],
        [C[14].t1, [-7, -0.6, -4], [4, -1.6, -22]],                  // 贴地滑行：每只小钟快慢不同
        [C[15].t0 + 0.9, [4.4, 1.3, 3.0], [7.5, 0.4, -7]],          // 类与实例的代码
        [C[15].t1, [4.9, 1.2, 2.3], [7.4, 0.3, -7]],
        [C[16].t1, [5.2, -0.9, 3.4], [3.6, -1.4, -0.5]],            // 飞到 me
        [C[17].t1, [16, 7.5, -1.5], [22, 3, -18]],                       // 转向线框地球
        [C[18].t1, [17.5, 11, -5.5], [22, 3.2, -18]],
        [C[19].t1, [22, 6.2, 1.5], [22, 3.8, -14]],                 // 三只钟并排
        [C[20].t0 + 1.4, [17.2, 1.6, -30.5], [13, -0.1, -40]],      // 光钟台
        [C[21].t1, [16.4, 1.3, -31.5], [13, 0.1, -40]],
        [C[22].t0 + 1.2, [-1, 1.8, -39], [-4, 1.6, -50]],           // 手机导航
        [C[23].t1, [0.6, 2.8, -36], [-1.5, 2.9, -50]],
        [C[24].t1, [-1.4, 2.0, -38.5], [-3, 2.0, -50]],
      ],
      notes: [
        [C[14].t0 + 0.4, C[14].t1, "速度和引力都会改变钟的快慢（狭义与广义相对论）· 小钟快慢为示意"],
        [C[15].t0 + 0.6, C[16].t1, "类＝蓝图；实例＝照着蓝图造出来的那一个 · 类比"],
        [C[18].t0 + 0.5, C[18].t1, "Hafele & Keating · 4 台铯钟，向东、向西各绕地球一周（1971）"],
        [C[19].t0 + 0.3, C[19].t1, "东行慢约 59 纳秒，西行快约 273 纳秒 · Science 1972 · 指针差为放大示意"],
        [C[20].t0 + 0.6, C[20].t1, "NIST 铝离子光钟 · Science 2010"],
        [C[21].t0 + 0.3, C[21].t1, "按此推算，一生 79 年约差 90 纳秒（NIST）· 指针差为放大示意"],
        [C[23].t0 + 0.4, C[23].t1, "GPS 卫星钟比地面钟每天约快 38 微秒 · Ashby 2002"],
        [C[24].t0 + 0.4, C[24].t1, "不修正，一天的导航误差就超过 11 公里 · Ashby 2002 · 偏移为示意"],
      ],
      badge: [
        [C[15].t0 + 0.4, C[16].t1, "类比"],
        [C[22].t0 + 0.4, C[24].t1, "示意"],
      ],
      labels: [
        [() => inst.me.g.position.clone().add(new THREE.Vector3(0, 1.35, 0)), `<span class="mono">me.clock</span> · 你的钟`, C[16].t0 + 0.4, C[17].t0 + 0.6],
        [() => trioPos[0].clone().add(new THREE.Vector3(0, 1.55, 0)), "地面", C[19].t0 + 0.2, C[19].t1],
        [() => trioPos[1].clone().add(new THREE.Vector3(0, 1.55, 0)), "向东飞 · 慢", C[19].t0 + 0.4, C[19].t1],
        [() => trioPos[2].clone().add(new THREE.Vector3(0, 1.55, 0)), "向西飞 · 快", C[19].t0 + 0.6, C[19].t1],
        [() => lowU.position.clone().add(new THREE.Vector3(0, 1.75, 0)), "低处", C[20].t0 + 0.8, C[21].t1],
        [() => highU.position.clone().add(new THREE.Vector3(0, 1.75, 0)), "高处 · 约 33 厘米", C[20].t0 + 2.4, C[21].t1],
        [() => gPos.clone().add(new THREE.Vector3(0, 1.0, 0)), "地面", C[23].t0 + 0.3, C[24].t1],
        [() => sPos.clone().add(new THREE.Vector3(0, 1.25, 0)), (t) => `卫星 · 第 ${Math.min(30, 1 + Math.floor(Math.max(0, t - C[23].t0 - 0.8) * 3))} 天，快 ${38 * Math.min(30, 1 + Math.floor(Math.max(0, t - C[23].t0 - 0.8) * 3))} 微秒`, C[23].t0 + 0.6, C[24].t1],
      ],
      state(t) {
        const on = inS3(t);
        // 闪光：大钟消失的一瞬
        flash.set(t > C[12].t0 + 0.5 ? 1.6 * Math.exp(-(t - C[12].t0 - 0.55) * 3.5) * (t < C[12].t0 + 3 ? 1 : 0) : 0);
        // 小钟：从大钟的位置飞向每个实例，落地后各走各的
        for (const q of minis) {
          const k = ease(ramp(t, LAND + q.delay, 1.5));
          if (t < LAND + q.delay) { q.m.set({ alpha: 0 }); continue; }
          const p = q.from.clone().lerp(q.target, k); p.y += 2.5 * Math.sin(Math.PI * k) * (1 - k * 0.3);
          q.m.g.position.copy(p);
          const landed = LAND + q.delay + 1.5;
          const sec = q.ph + (t > landed ? (t - landed) * 48 * q.rate : 0);
          const glowMe = q.isMe ? 0.9 + 1.4 * win(t, C[16].t0, C[17].t0 + 0.6, 0.4, 0.6) : 0.9;
          q.m.set({ sec, alpha: Math.min(1, k * 3), glow: glowMe });
          q.m.g.scale.setScalar(lerp(0.5, 1, k));
        }
        // 类与实例
        const cls = CLS.map((segs) => ({ segs, typed: 0, hl: 0 }));
        let acc = C[15].t0 + 0.25;
        cls.forEach((ln, i) => { ln.typed = typed(t, acc, 34, CLS[i]); acc += len(CLS[i]) / 34 + 0.05; });
        cls[6].hl = win(t, C[16].t0, C[17].t0 + 0.4, 0.3, 0.4);
        p2.draw({ title: "thing.js", lines: cls, caret: [6, false] });
        p2.alpha(on ? win(t, C[15].t0, C[17].t0 + 0.8, 0.4, 0.8) : 0);
        // 地球与航线
        const gA = on ? win(t, C[17].t0, C[20].t0 + 0.8, 0.8, 0.8) : 0;
        globe.visible = gA > 0.002; wire.material.opacity = 0.3 * gA; core.material.opacity = 0.92 * gA;
        globe.rotation.y = 0.12 * t;
        const kE = ease(ramp(t, C[18].t0 + 0.3, 2.2)), kW = ease(ramp(t, C[18].t0 + 2.5, 2.2));
        east.geo.setDrawRange(0, Math.floor(kE * 160) + 1); west.geo.setDrawRange(0, Math.floor(kW * 160) + 1);
        east.ln.material.opacity = gA * (kE > 0 ? 1 : 0); west.ln.material.opacity = gA * (kW > 0 ? 1 : 0);
        globe.updateMatrixWorld();
        const head = (arc, k) => arc.pts[Math.min(160, Math.floor(k * 160))].clone().applyMatrix4(globe.matrixWorld);
        planeE.s.position.copy(head(east, kE)); planeE.set(gA * (kE > 0 && kE < 1 ? 1 : 0));
        planeW.s.position.copy(head(west, kW)); planeW.set(gA * (kW > 0 && kW < 1 ? 1 : 0));
        home.s.position.copy(new THREE.Vector3(RR * Math.cos(rad(80)), 0, RR * Math.sin(rad(80))).applyAxisAngle(new THREE.Vector3(0, 1, 0), -globe.rotation.y).add(GB)); home.set(gA * win(t, C[18].t0, C[19].t1, 0.4, 0.4));
        // 三只钟：地面 / 向东（慢）/ 向西（快）——指针差放大示意
        const tA = on ? win(t, C[19].t0, C[20].t0 + 0.6, 0.4, 0.6) : 0;
        const base = (t - C[19].t0) * 30;
        trio.forEach((m, i) => { m.g.position.copy(trioPos[i]); m.g.position.y += 0.3 * easeOutBack(ramp(t, C[19].t0 + i * 0.15, 0.5)) - 0.3; m.set({ sec: base + [0, -10, 26][i] * ease(ramp(t, C[19].t0 + 0.5, 1.2)), alpha: tA }); });
        // 光钟台
        const oA = on ? win(t, C[20].t0 - 0.6, C[22].t0 + 0.4, 0.6, 0.6) : 0;
        table.visible = lowU.visible = highU.visible = oA > 0.002;
        table.material.opacity = oA; tEdge.material.opacity = oA; baseM.opacity = oA;
        const lift = 1.1 * ease(ramp(t, C[20].t0 + 1.4, 1.2));
        highU.position.y = OC.y + 1.28 + lift;
        lowC.g.position.copy(lowU.position).add(new THREE.Vector3(0, 1.05, 0));
        highC.g.position.copy(highU.position).add(new THREE.Vector3(0, 1.05, 0));
        const ob = Math.max(0, t - C[20].t0) * 36;
        lowC.set({ sec: ob, alpha: oA }); highC.set({ sec: ob * (1 + 0.16 * ease(ramp(t, C[21].t0, 0.8))), alpha: oA });
        ruler.mesh.position.set(OC.x + 1.85, OC.y + 1.28 + lift / 2 + 0.1, OC.z); ruler.mesh.scale.y = Math.max(lift, 0.01) / 1.44;
        ruler.mesh.quaternion.copy(world.camera.quaternion);
        ruler.alpha(oA * ease(ramp(t, C[20].t0 + 1.4, 0.6)));
        // 手机与卫星
        const dA = on ? win(t, C[22].t0 - 0.4, S3[1] + 0.8, 0.6, 0.8) : 0;
        phone.visible = dA > 0.002; phone.material.opacity = dA;
        paintMap(ease(ramp(t, C[24].t0 + 0.4, 3.6))); screen.alpha(dA);
        gC.g.position.copy(gPos); sC.g.position.copy(sPos);
        const sb = Math.max(0, t - C[23].t0) * 40;
        gC.set({ sec: sb, alpha: dA * ease(ramp(t, C[23].t0, 0.5)) });
        sC.set({ sec: sb * 1.18 + 20 * ease(ramp(t, C[23].t0 + 0.8, 1)), alpha: dA * ease(ramp(t, C[23].t0 + 0.2, 0.5)) });
        satM.opacity = 0.7 * dA * ease(ramp(t, C[23].t0 + 0.3, 0.6)); satLine.visible = satM.opacity > 0.002;
      },
    };
  }

  // ══════════ S4 反直觉转折：编辑器 → 潜入网格之下 → 方程里找不到 t → 静止的世界 → 时间块 → 光子 → return ══════════
  {
    const P3 = new THREE.Vector3(-2.2, 1.3, -44.5);          // 编辑器回到画面（就在手机站前面）
    const DC = new THREE.Vector3(-3, -12.5, -58);             // 深层的中心
    const DY = -16;                                           // 深层网格高度
    const p3 = codePanel(world); p3.mesh.position.copy(P3); p3.mesh.rotation.y = rad(-8);
    const P3L = [
      L(["let", K], [" t = ", Wt], ["0", N], [";", Wt]),
      L(["ground.", Wt], ["clock", F]),
      L(["sat.", Wt], ["clock", F]),
      L(["me.", Wt], ["clock", F]),
    ];
    const deep = new THREE.GridHelper(160, 260, 0x1f7a70, 0x165058);
    deep.position.set(DC.x, DY, DC.z); deep.material.transparent = true; world.scene.add(deep);
    // 方程（衬线）＋搜索框
    const eq = canvasPlane(world, { px: 2048, py: 760, w: 10 });
    eq.mesh.position.set(DC.x, -11.0, DC.z - 2); eq.mesh.material.depthWrite = false;   // 透明面板不挡后面的实例
    const GLY = ["Ĥ", "Ψ", "=", "0"];
    function paintEq(kw, ks, scan) {
      eq.paint(`${kw.toFixed(3)}|${ks.toFixed(2)}|${scan.toFixed(2)}`, (g, w, h) => {
        g.font = "700 300px NotoSerifSC"; g.textBaseline = "alphabetic";
        const xs = [430, 800, 1180, 1520];
        GLY.forEach((c, i) => {
          const a = clamp(kw * 4 - i); if (a <= 0) return;
          const scanned = scan > i + 0.5;
          if (Math.abs(scan - i - 0.5) < 0.5 && ks > 0) { g.fillStyle = "rgba(255,180,84,.22)"; g.fillRect(xs[i] - 40, 220, 330, 340); }
          g.globalAlpha = a; g.fillStyle = scanned ? "#5fb8a6" : "#ffffff"; g.fillText(c, xs[i], 520); g.globalAlpha = 1;
        });
        if (ks > 0) {
          g.globalAlpha = ks;
          g.beginPath(); g.roundRect(w - 720, 30, 660, 110, 18); g.fillStyle = "rgba(20,32,46,.97)"; g.fill(); g.lineWidth = 4; g.strokeStyle = "#3f8f80"; g.stroke();
          g.font = "600 46px NotoSC"; g.fillStyle = "#9fc2c9"; g.fillText("查找", w - 690, 104); g.font = "64px CascadiaMono"; g.fillStyle = "#e8f0f2"; g.fillText("t", w - 570, 108);
          if (scan >= 4) { g.font = "600 52px NotoSC"; g.fillStyle = "#ff9b8f"; g.textAlign = "right"; g.fillText("0 个匹配", w - 90, 104); g.textAlign = "left"; }
          g.globalAlpha = 1;
        }
      });
    }
    // 深层的实例：先走，后停（「宇宙是静止的」），切片扫过时各跳一格（「变化」出现）
    const r = rng(41), dpts = [];
    for (let i = 0; i < 40 && dpts.length < 24; i++) {
      const p = new THREE.Vector3(DC.x + (r() - 0.5) * 22, DY + 0.15, DC.z + (r() - 0.5) * 16 + 2);
      if (Math.abs(p.x - DC.x) < 2.6 && p.z > DC.z - 3) continue;
      dpts.push(p);
    }
    const dMe = new THREE.Vector3(DC.x + 2.6, DY + 0.15, DC.z + 8);
    dpts.push(dMe);
    const CLK = 3;                                              // 被圈出当「时钟」的那一个
    const tealM = new THREE.MeshStandardMaterial({ color: COL.teal, emissive: COL.teal, emissiveIntensity: 0.9, transparent: true });
    const dGeo = new THREE.SphereGeometry(0.08, 14, 10);
    const dItems = dpts.map((p, i) => {
      const dot = new THREE.Mesh(dGeo, tealM); dot.position.copy(p); world.scene.add(dot);
      const m = miniClock(world, { r: i === dpts.length - 1 ? 0.42 : 0.32 });
      return { p, dot, m, ph: r() * 360, rate: 0.8 + 0.4 * r() };
    });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.04, 12, 64), new THREE.MeshStandardMaterial({ color: COL.amber, emissive: COL.amber, emissiveIntensity: 1.2, transparent: true }));
    world.scene.add(ring);
    const entM = new THREE.LineBasicMaterial({ color: COL.teal, transparent: true });
    const ent = dItems.filter((_, i) => i !== CLK).slice(0, 12).map((d) => {
      const a = dItems[CLK].p.clone().add(new THREE.Vector3(0, 0.8, 0)), b = d.p.clone().add(new THREE.Vector3(0, 0.8, 0));
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 1.6, 0));
      const geo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(30));
      const l = new THREE.Line(geo, entM); world.scene.add(l); return { l, geo };
    });
    const slice = new THREE.Mesh(new THREE.PlaneGeometry(26, 0.22), new THREE.MeshBasicMaterial({ color: COL.amber, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
    slice.rotation.x = -Math.PI / 2; world.scene.add(slice);   // 一道贴地扫过的光：沿时钟读数「切」开静止的世界
    // 时间块：36 张「帧」摞在一起，按 t 一张张点亮
    const BC = DC.clone().add(new THREE.Vector3(0, -0.1, 0));
    const NC = 18;
    const cards = Array.from({ length: NC }, (_, i) => {
      const c = canvasPlane(world, { px: 320, py: 200, w: 2.4 });
      c.paint("c", (g, w, h) => {
        g.fillStyle = "rgba(11,17,29,.92)"; g.fillRect(0, 0, w, h); g.strokeStyle = "#3f8f80"; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
        g.strokeStyle = "#7ff0d2"; g.lineWidth = 6; g.beginPath(); g.arc(110, 104, 62, 0, 7); g.stroke();
        const a = rad(i * 20); g.beginPath(); g.moveTo(110, 104); g.lineTo(110 + 54 * Math.sin(a), 104 - 54 * Math.cos(a)); g.stroke();
        g.fillStyle = "#9fc2c9"; g.font = "30px CascadiaMono"; g.fillText(`t=${(i / 10).toFixed(1)}`, 192, 112);
      });
      c.mesh.position.set(BC.x - 4.6 + i * 0.54, BC.y, BC.z - 0.4 * Math.abs(i - (NC - 1) / 2) / 4); c.mesh.rotation.y = rad(38);
      return c;
    });
    // 一对光子
    const phA = glowSprite(world, { size: 1.4, color: COL.teal }), phB = glowSprite(world, { size: 1.4, color: COL.amber });
    const PC = DC.clone().add(new THREE.Vector3(0, 0.2, 0));
    phA.s.position.copy(PC).add(new THREE.Vector3(-2.6, 0, 0)); phB.s.position.copy(PC).add(new THREE.Vector3(2.6, 0, 0));
    const waveM = new THREE.LineBasicMaterial({ color: 0xd7f6ee, transparent: true });
    const waveGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 80 }, () => new THREE.Vector3()));
    const wave = new THREE.Line(waveGeo, waveM); world.scene.add(wave);
    const arrowM = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true });
    const arrows = [phA, phB].map((ph) => { const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]); const l = new THREE.Line(geo, arrowM); world.scene.add(l); return { ph, geo, l }; });
    // return：let t 被删掉，换成 function now()
    const p4 = codePanel(world); p4.mesh.position.copy(DC).add(new THREE.Vector3(0, 0.9, 2.6)); p4.mesh.rotation.y = rad(-4);
    const NOW = [
      L(["let", K], [" t = ", Wt], ["0", N], [";", Wt]),
      L(["function", K], [" now", F], ["() {", Wt]),
      L(["  return", K], [" clock.", Wt], ["read", F], ["();", Wt]),
      L(["}", Wt]),
    ];

    const S4 = SEC.s4, inS4 = (t) => t > S4[0] - 0.3 && t < S4[1] + 1.5;
    S.s4 = {
      cam: [
        [C[25].t0 + 1.0, [-0.9, 2.1, -34.4], [-2.2, 1.3, -44.5]],   // 编辑器回来
        [C[25].t1, [-1.2, 1.9, -35.2], [-2.2, 1.3, -44.5]],
        [C[26].t0 + 0.9, [-1.5, -0.8, -39], [-3, -10, -58]],       // 沿网格往下潜
        [C[26].t1, [-2.2, -10.4, -45.5], [-3, -12.2, -60]],
        [C[27].t1, [-2.6, -10.9, -48.2], [-3, -11.1, -60]],          // 方程
        [C[29].t1, [-2.9, -11.0, -50.0], [-3, -11.1, -60]],
        [C[30].t1, [1.8, -10.2, -42.5], [-3, -15.8, -53]],            // 静止的世界
        [C[31].t1, [0.9, -14.4, -45.6], [-0.4, -15.2, -50]],         // 回到 me
        [C[32].t1, [dpts[CLK].x + 4.5, -12.0, dpts[CLK].z + 10.5], [dpts[CLK].x, -15.0, dpts[CLK].z]],        // 圈出「时钟」
        [C[33].t1, [0.5, -10.6, -44.6], [-3, -15.0, -57]],
        [C[34].t1, [-1.0, -11.0, -45.4], [-3, -15.1, -57]],           // 切片扫过
        [C[35].t0 + 1.0, [-1.4, -10.6, -46.4], [-3, -12.6, -58]],     // 时间块
        [C[35].t1, [-2.2, -10.9, -47.2], [-3, -12.6, -58]],
        [C[36].t1, [-3, -11.8, -50.6], [-3, -12.3, -58]],            // 光子
        [C[37].t0 + 1.0, [-2.6, -11.4, -47.4], [-3, -11.7, -55.4]],  // function now()
        [C[37].t1, [-2.8, -11.4, -48.0], [-3, -11.7, -55.4]],
      ],
      notes: [
        [C[27].t0 + 0.5, C[28].t1, "DeWitt 1967 · 后称 Wheeler–DeWitt 方程 · 量子引力的候选框架，未成定论"],
        [C[30].t0 + 0.4, C[30].t1, "常见解读：方程没有对时间的导数，整体像被「冻结」（frozen formalism）"],
        [C[32].t0 + 0.4, C[34].t1, "Page & Wootters 1983 · 时间可能从「时钟」与「其余」的关联中涌现 · 假说"],
        [C[36].t0 + 0.4, C[36].t1, "Moreva 等 2014 · 一对偏振纠缠光子，一个当钟 · 实验示意，不是证明"],
      ],
      badge: [
        [C[28].t0, C[29].t1, "候选框架"],
        [C[32].t0, C[34].t1, "假说"],
        [C[35].t0 + 0.3, C[35].t1, "类比"],
        [C[37].t0 + 0.3, C[37].t1, "假说"],
      ],
      labels: [
        [() => dItems[CLK].p.clone().add(new THREE.Vector3(0, 1.75, 0)), "时钟", C[32].t0 + 0.6, C[34].t1],
        [() => DC.clone().add(new THREE.Vector3(4, -1.6, -3)), "其余的一切", C[33].t0 + 0.2, C[34].t1],
        [() => dMe.clone().add(new THREE.Vector3(0, 1.4, 0)), `<span class="mono">me</span> · 停着`, C[31].t0 + 0.3, C[31].t1],
        [() => phA.s.position.clone().add(new THREE.Vector3(0, 1.1, 0)), "当作钟的光子", C[36].t0 + 0.6, C[36].t1],
        [() => phB.s.position.clone().add(new THREE.Vector3(0, 1.1, 0)), "另一个光子", C[36].t0 + 0.9, C[36].t1],
      ],
      state(t) {
        const on = inS4(t);
        // 编辑器：划掉 let t，长出每个实例自己的钟
        const l3 = P3L.map((segs) => ({ segs, typed: 0, strike: 0 }));
        l3[0].typed = 99; l3[0].strike = ease(ramp(t, C[25].t0 + 0.2, 0.5));
        [1, 2, 3].forEach((i) => { l3[i].typed = typed(t, C[25].t0 + 0.6 + (i - 1) * 0.55, 26, P3L[i]); });
        p3.draw({ title: "universe.js", lines: l3 });
        p3.alpha(on ? win(t, C[25].t0 - 0.2, C[26].t0 + 1.3, 0.4, 0.6) : 0);
        deep.visible = on && t > C[26].t0; deep.material.opacity = 0.7 * ease(ramp(t, C[26].t0, 0.8));
        // 方程与搜索
        const eA = on ? win(t, C[27].t0, C[30].t0 + 0.4, 0.4, 0.8) : 0;
        paintEq(ease(ramp(t, C[27].t0 + 0.3, 2.6)), ease(ramp(t, C[29].t0 - 0.05, 0.25)), 4.4 * ramp(t, C[29].t0 + 0.25, 1.4));
        eq.mesh.position.y = -11.0 + 2.5 * ease(ramp(t, C[30].t0, 1.6));
        eq.alpha(eA);
        // 深层实例：C26–C29 在走；C30 起停住；C34 切片扫过时各跳一格
        const sweep = ramp(t, C[34].t0 + 0.3, 3.8), sz = lerp(DC.z + 11, DC.z - 9, sweep);
        slice.position.set(DC.x, DY + 0.03, sz); slice.material.opacity = on ? 0.9 * win(t, C[34].t0 + 0.2, C[34].t1, 0.3, 0.5) : 0; slice.visible = slice.material.opacity > 0.002;
        const dimBlock = 1 - 0.75 * win(t, C[35].t0, C[37].t1, 0.6, 0.6);
        const freezeAt = C[30].t0;
        const dA = on ? ease(ramp(t, C[26].t0 + 1.0, 1.2)) * dimBlock : 0;
        tealM.opacity = dA;
        dItems.forEach((d, i) => {
          d.dot.visible = dA > 0.002;
          const run = Math.min(t, freezeAt) - C[26].t0;
          const passed = t > C[34].t0 && sz < d.p.z;
          const sec = d.ph + Math.max(0, run) * 40 * d.rate + (passed ? 30 : 0);
          d.m.g.position.copy(d.p).add(new THREE.Vector3(0, 0.75, 0));
          const lit = passed ? 1.8 * Math.exp(-(t - (C[34].t0 + 0.3 + 3.8 * ((DC.z + 11 - d.p.z) / 20))) * 2) : 0;
          d.m.set({ sec, alpha: dA, glow: 0.9 + Math.max(0, lit) + (i === CLK ? 0.8 * win(t, C[32].t0, C[34].t1, 0.4, 0.4) : 0) });
        });
        ring.position.copy(dItems[CLK].p).add(new THREE.Vector3(0, 0.75, 0)); ring.quaternion.copy(world.camera.quaternion);
        ring.material.opacity = on ? win(t, C[32].t0 + 0.3, C[34].t1, 0.4, 0.5) * dimBlock : 0; ring.visible = ring.material.opacity > 0.002;
        ring.scale.setScalar(1 + 0.3 * (1 - ease(ramp(t, C[32].t0 + 0.3, 0.5))));
        const kE = ease(ramp(t, C[33].t0 + 0.2, 1.4));
        entM.opacity = on ? 0.55 * win(t, C[33].t0 + 0.2, C[34].t1, 0.3, 0.5) * dimBlock : 0;
        ent.forEach((e) => { e.l.visible = entM.opacity > 0.002; e.geo.setDrawRange(0, Math.floor(kE * 30) + 1); });
        // 时间块
        const bA = on ? win(t, C[35].t0, C[36].t0 + 0.4, 0.5, 0.6) : 0;
        const hi = ramp(t, C[35].t0 + 0.6, 3.6) * (NC - 1);
        cards.forEach((c, i) => {
          const lift = Math.exp(-((i - hi) ** 2) / 0.8);
          c.mesh.position.y = BC.y + 0.7 * lift;
          c.alpha(bA * (0.35 + 0.65 * lift));
        });
        // 光子：一个当钟（箭头转），另一个跟它对应
        const pA = on ? win(t, C[36].t0, C[37].t0 + 0.3, 0.5, 0.6) : 0;
        phA.set(pA); phB.set(pA);
        const ang = (t - C[36].t0) * 2.2;
        arrows.forEach((a, i) => {
          const c = a.ph.s.position, aa = i === 0 ? ang : ang + Math.PI / 2;
          const pos = a.geo.attributes.position;
          pos.setXYZ(0, c.x - 0.75 * Math.sin(aa), c.y - 0.75 * Math.cos(aa), c.z + 0.05); pos.setXYZ(1, c.x + 0.75 * Math.sin(aa), c.y + 0.75 * Math.cos(aa), c.z + 0.05); pos.needsUpdate = true;
          a.l.visible = pA > 0.002;
        });
        arrowM.opacity = pA;
        const wp = waveGeo.attributes.position, A = phA.s.position, Bp = phB.s.position;
        for (let i = 0; i < 80; i++) { const u = i / 79; wp.setXYZ(i, lerp(A.x, Bp.x, u), A.y + 0.22 * Math.sin(u * 18 - t * 6) * Math.sin(Math.PI * u), A.z); }
        wp.needsUpdate = true; waveM.opacity = 0.7 * pA; wave.visible = pA > 0.002;
        // function now()
        const n4 = NOW.map((segs) => ({ segs, typed: 0 }));
        n4[0].typed = Math.max(0, len(NOW[0]) - Math.floor(Math.max(0, t - C[37].t0) * 30));
        [1, 2, 3].forEach((i) => { n4[i].typed = typed(t, C[37].t0 + 0.45 + (i - 1) * 0.6, 34, NOW[i]); });
        if (n4[0].typed === 0) n4[0].segs = [];
        p4.draw({ title: "universe.js", lines: n4, caret: [n4[3].typed > 0 ? 3 : n4[1].typed > 0 ? 2 : 0, Math.floor(t / (BEAT / 2)) % 2 === 0] });
        p4.alpha(on ? win(t, C[37].t0 - 0.2, S4[1] + 0.6, 0.4, 0.6) : 0);
      },
    };
  }

  // ══════════ S5 现实落点：本片时间轴倒拖（真的倒放）→ 墨水不回来 → 只追加的记忆 ══════════
  {
    const GL = new THREE.Vector3(-10, -1.0, -36);              // 一杯水
    const glass = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.CylinderGeometry(0.85, 0.78, 2.4, 14, 1, true)), new THREE.LineBasicMaterial({ color: COL.teal, transparent: true }));
    glass.position.copy(GL); world.scene.add(glass);
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.83, 48), new THREE.MeshBasicMaterial({ color: COL.teal, transparent: true, opacity: 0, side: THREE.DoubleSide }));
    water.rotation.x = -Math.PI / 2; water.position.copy(GL).add(new THREE.Vector3(0, 0.75, 0)); world.scene.add(water);
    const N = 900, r = rng(77), seeds = Array.from({ length: N }, () => [r(), r(), r(), r()]);
    const inkGeo = new THREE.BufferGeometry(); inkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const inkM = new THREE.PointsMaterial({ color: COL.amber, size: 3.2, sizeAttenuation: false, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const ink = new THREE.Points(inkGeo, inkM); ink.frustumCulled = false; world.scene.add(ink);
    const drop = glowSprite(world, { size: 0.5, color: COL.amber });
    // 记忆日志：只往下追加
    const p5 = codePanel(world); p5.mesh.position.set(-14.6, 0.9, -37.6); p5.mesh.rotation.y = rad(22); p5.mesh.scale.setScalar(0.78);
    const Sx = "#ffcf8a";
    const LOG = [
      L(["log", F], ["(", Wt], ["\"三年前 · 毕业\"", Sx], [");", Wt]),
      L(["log", F], ["(", Wt], ["\"上个月 · 搬家\"", Sx], [");", Wt]),
      L(["log", F], ["(", Wt], ["\"前天 · 下了一场雨\"", Sx], [");", Wt]),
      L(["log", F], ["(", Wt], ["\"昨天 · 加班到很晚\"", Sx], [");", Wt]),
      L(["// 明天：", Cm]),
    ];
    const DROP = C[40].t0 + 0.5;
    // 倒带：C39 期间，场景时间从「现在」一路倒回片头；C40 起回到现在
    const R0 = C[39].t0 + 0.35, R1 = C[39].t1 - 0.1;
    const remap = (t) => (t < R0 || t >= C[40].t0 ? t : t < R1 ? lerp(R0, 0.6, ease(ramp(t, R0, R1 - R0))) : 0.6);

    S.s5 = {
      remap, R0, R1,
      cam: [
        [C[38].t0 + 1.6, [-6.4, 1.7, -29.5], [-10, -0.5, -36]],      // 从深层回到地面
        [C[40].t0 + 0.6, [-7.3, 0.5, -31.4], [-10, -0.7, -36]],      // 墨水
        [C[41].t1, [-8.0, 0.3, -31.9], [-10.4, -0.6, -36]],
        [C[42].t0 + 1.0, [-10.4, 1.2, -31.0], [-13.8, 0.9, -37.6]],  // 日志
        [C[43].t1, [-10.9, 1.1, -31.6], [-14.2, 0.8, -37.6]],
      ],
      notes: [
        [C[41].t0 + 0.4, C[41].t1, "热力学第二定律（宏观、统计意义上）· 宇宙早期熵极低（过去假说）"],
      ],
      badge: [
        [C[39].t0 + 0.3, C[39].t1, "倒放中"],
        [C[42].t0 + 0.3, C[43].t1, "一种解释"],
      ],
      labels: [
        [() => GL.clone().add(new THREE.Vector3(1.25, 1.05, 0)), `熵 <span style="color:#ffcf8a">↑</span>`, C[41].t0 + 0.3, C[41].t1 + 0.4],
      ],
      state(t) {
        const on = t > C[38].t0 - 0.5 && t < SEC.s5[1] + 1.2;
        const gA = on && t >= C[40].t0 ? win(t, C[40].t0, SEC.s5[1] + 0.6, 0.4, 0.6) : 0;
        glass.material.opacity = 0.75 * gA; glass.visible = gA > 0.002;
        water.material.opacity = 0.12 * gA; water.visible = gA > 0.002;
        // 墨滴：落下 → 在水里散开（扩散半径随时间增长，纯函数），不会聚回
        const fall = ramp(t, DROP - 0.5, 0.5);
        drop.s.position.copy(GL).add(new THREE.Vector3(0, lerp(2.2, 0.75, fall * fall), 0)); drop.set(gA * (t < DROP ? 1 : 0));
        const age = Math.max(0, t - DROP), spread = 1 - Math.exp(-age * 0.55);
        const pos = inkGeo.attributes.position;
        for (let i = 0; i < N; i++) {
          const [a, b, c, d] = seeds[i];
          const ang = a * Math.PI * 2 + age * (0.3 + b * 0.6), rr = Math.min(0.78, spread * (0.15 + 0.85 * Math.sqrt(b)) * 0.8);
          const y = 0.72 - spread * (0.2 + 2.0 * c) + 0.08 * Math.sin(age * 1.5 + d * 9);
          pos.setXYZ(i, GL.x + rr * Math.cos(ang), GL.y + Math.max(-1.15, y), GL.z + rr * Math.sin(ang));
        }
        pos.needsUpdate = true; inkM.opacity = 0.55 * gA * (t > DROP ? 1 : 0); ink.visible = inkM.opacity > 0.002;
        // 日志
        const lg = LOG.map((segs) => ({ segs, typed: 0, hl: 0 }));
        lg.forEach((ln, i) => { ln.typed = t > C[42].t0 + 0.3 + i * 0.6 ? 99 : 0; });
        lg[3].hl = win(t, C[43].t0, SEC.s5[1] + 0.4, 0.3, 0.4);
        p5.draw({ title: "memory.log", lines: lg, caret: [4, t > C[43].t0 && Math.floor(t / (BEAT / 2)) % 2 === 0] });
        p5.alpha(on && t >= C[40].t0 ? win(t, C[42].t0 - 0.3, SEC.s5[1] + 0.8, 0.4, 0.8) : 0);
      },
    };
  }

  // ══════════ S6 结尾：镜头上升，每个实例的钟都亮起来；声明卡；问句 ══════════
  {
    S.s6 = {
      cam: [
        [C[44].t0 + 0.6, [-9.0, 3.5, -27], [-6, -1.0, -36]],
        [C[44].t1, [-2, 18, -8], [0, -2, -28]],
        [C[45].t0, [0, 30, 8], [0, -2, -26]],
        [SEC.s6[1], [0, 40, 20], [0, -2, -25]],
      ],
      notes: [],
      badge: [],
      labels: [],
      state(t) {
        // 雾：上升时变淡，远处的钟也看得见
        // 深层（S4）雾也淡一些，潜下去时远处的网格看得见
        world.scene.fog.density = 0.03 - 0.012 * win(t, SEC.s4[0] + 4, SEC.s4[1], 1.5, 1.5) - 0.02 * ease(ramp(t, C[44].t0, 4));
        const lit = ease(ramp(t, C[44].t0 + 0.4, 3));
        if (lit > 0 && S.minis) for (const q of S.minis) {
          const k = clamp(lit * 1.6 - q.delay * 6);
          q.m.rimM.emissiveIntensity = 0.9 + 1.4 * k;
          q.m.g.scale.setScalar(1 + 1.2 * k);
        }
      },
    };
  }

  return S;
}
