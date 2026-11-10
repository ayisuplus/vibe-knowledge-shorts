// 六段。全片一条时间轴（90 秒），每段只在自己的窗口里驱动自己的公文纸；出了窗口必须把自己关掉。
// 时间点一律写 90 秒轴的绝对秒，不再做新旧轴映射。
import { SEC, typed } from "./beats.js";
import { sheet, seal, wipe, dash, odo, cam, particles, strike, scanner, glyphs, penstrike, handwrite } from "./rig.js";
import { el, vis, ease, easeOutBack, ramp, lerp, clamp, pulse } from "./lib.js";

export function sections(world) {
  /* ---------- 小工具 ---------- */

  /** [data-at] 依次淡入上浮；times 与节点顺序一一对应 */
  function cue(nodes, times, t, dur = 0.38, dy = 12) {
    nodes.forEach((n, i) => {
      if (times[i] == null) return;
      const k = ease(ramp(t, times[i], dur));
      n.style.opacity = k.toFixed(3);
      n.style.transform = `translateY(${((1 - k) * dy).toFixed(1)}px)`;
    });
  }

  /** 底色扫过：给 <b class="hl"> 一层从 0 长到 100% 的高亮 */
  function sweep(node, k, color = "rgba(246,214,203,.9)") {
    const p = clamp(k) * 100;
    node.style.backgroundImage = `linear-gradient(${color},${color})`;
    node.style.backgroundRepeat = "no-repeat";
    node.style.backgroundSize = `${p.toFixed(1)}% 42%`;
    node.style.backgroundPosition = "0 74%";
  }

  /* =========================================================
     S1 · 钩子  0 – 7
     红头函斜插进画 → 标题打字 → 两行正文 → 「拟同意」章 → 推镜 → 横推走
     ========================================================= */
  const P1 = sheet("stage", {
    html:
      '<div class="fold"></div><div class="pin"></div>' +
      '<div class="docno">词语管理委员会 · 词语规〔2026〕14 号</div>' +
      '<div class="corner">档 2026-014</div>' +
      '<div class="redhead">关 于 规 范 使 用 词 语 的 函</div>' +
      '<div class="hrline"></div>' +
      '<div class="ptitle" style="top:202px"></div>' +
      '<div class="pbody" style="top:300px;font-size:24px;line-height:2.05;text-align:justify">' +
      '<div class="pb" style="margin-bottom:10px">各车间、各工位、各算法集群：</div>' +
      '<div class="pb" style="margin-bottom:14px">经查，<b class="hl">“打工人”</b>（2020 年起流行）、<b class="hl">“形式主义”</b>（沿用近百年）二词，现已不再适应当前生产语境，日常话语中亦几近无引用。</div>' +
      '<div class="pb">经研究决定：上述词语自本函印发之日起<b class="hl stop">停止使用</b>。其职能，另行通知接替。</div>' +
      '</div>' +
      '<div class="psign">词语管理委员会办公室<br>2026 年 10 月 22 日</div>',
  });
  const TITLE1 = "关于“打工人”“形式主义”等词的处理意见";
  const S1seal = seal(P1.root, { x: 1036, y: 610, size: 200, text: "拟同意", rot: -13 });
  const stopPen = penstrike(P1.q("b.stop"));

  const s1 = {
    state(t) {
      const [a, b] = SEC.hook;
      if (t < a || t > b + 0.35) { P1.hide(); S1seal.hide(); return; }

      const enter = ease(ramp(t, 0, 0.42));
      const dropK = easeOutBack(ramp(t, 0, 0.5));
      const leaveK = ease(ramp(t, 6.53, 0.35));
      const camK = ease(ramp(t, 4.95, 0.95));
      const C = cam(camK, 0.16, -38);
      const o = enter * (1 - leaveK);

      P1.set({
        o,
        tx: -1240 * leaveK,
        ty: -150 * (1 - dropK) + 44 * leaveK + C.dy,
        rot: lerp(-24, -1.5, enter) + 6 * leaveK,
        sx: lerp(1.06, 1, enter) * C.sx,
        sy: lerp(1.06, 1, enter) * C.sy,
      });

      // 落定冲击：只在前 0.5 秒里压一下桌面
      const thud = pulse(t, 0.42, 0.15);
      P1.root.style.boxShadow = `0 ${(22 + 10 * thud).toFixed(1)}px ${(46 + 26 * thud).toFixed(1)}px rgba(60,44,20,${(0.2 + 0.08 * thud).toFixed(3)})`;

      const rh = P1.q(".redhead");
      rh.style.transform = `scaleX(${ease(ramp(t, 0.5, 0.18)).toFixed(3)})`;
      rh.style.transformOrigin = "center";
      const hl = P1.q(".hrline");
      hl.style.transform = `scaleX(${ease(ramp(t, 0.68, 0.17)).toFixed(3)})`;
      hl.style.transformOrigin = "left";

      typed(P1.q(".ptitle"), TITLE1, ramp(t, 0.85, 0.85));

      const pbs = P1.qa(".pb");
      cue(pbs, [1.7, 2.6, 3.3], t, 0.4, 10);

      // 两个词的红底扫过（滞后正文 0.15s）
      P1.qa("b.hl").forEach((n, i) => {
        if (n.classList.contains("stop")) return;
        sweep(n, ramp(t, (i === 0 ? 2.6 : 2.85) + 0.15, 0.28));
      });

      // 「停止使用」变红 + 抖三下 + 红笔划掉
      const stop = P1.q("b.stop");
      const sk = ease(ramp(t, 3.75, 0.12));
      stop.style.color = sk > 0.5 ? "#b0231a" : "";
      const jt = pulse(t, 3.75, 0.36);
      stop.style.display = "inline-block";
      stop.style.transform = `translateX(${(Math.sin(t * 92) * 2 * jt).toFixed(2)}px)`;
      stopPen.set(ramp(t, 3.85, 0.32));

      S1seal.slap(ramp(t, 4.14, 0.75));
    },
  };

  /* =========================================================
     S2 · 打工人  7 – 24
     A 档案：升入 → 逐字落 → 五行（四种不同入法）→ 「停用」章
     B 接替表：翻页 → 三卡（弹/挤/砸）→ 箭头画出
     ========================================================= */
  const D2 = sheet("stage", {
    cls: "dossier",
    html:
      '<div class="dhead"><span class="dname">词 语 档 案</span><span class="dno">档 2020 · 009</span></div>' +
      '<div class="dword"></div>' +
      '<div class="dline"></div>' +
      '<div class="rows">' +
      '<div class="drow dg"><span class="k">登记日期</span><span class="v num1">2020 年 9 月 22 日</span></div>' +
      '<div class="drow dg"><span class="k">最初出处</span><span class="v">一条“早安，打工人”短视频，一夜爆红</span></div>' +
      '<div class="drow dg"><span class="k">当年评定</span><span class="v"><span class="em hl2">2020 年度十大流行语</span></span></div>' +
      '<div class="drow dg"><span class="k">词义</span><span class="v tw">劳动者的自嘲：我虽然累，但我是个“人”，我在打工</span></div>' +
      '<div class="drow dg"><span class="k">状态</span><span class="v">2023 年起，在网络热词中<del>停用</del></span></div>' +
      '</div>',
  });
  const D2seal = seal(D2.root, { x: 1052, y: 618, size: 124, text: "停用", rot: -12, cls: "sm" });
  const D2word = glyphs(D2.q(".dword"), "打工人");

  const R2 = sheet("stage", {
    cls: "rev",
    html:
      '<div class="revno">档 2020 — 2026</div>' +
      '<div class="revhead">词 语 接 替 表</div>' +
      '<div class="trio">' +
      '<div class="tcard dead tc"><div class="tspan">2020 — 2023</div><div class="tword">打工人</div><div class="tnote">自嘲 · 人在打工</div><div class="tbadge">已停用</div></div>' +
      '<div class="ar">→</div>' +
      '<div class="tcard half tc"><div class="tspan">2023</div><div class="tword">吗喽</div><div class="tnote">两广话 · 猴子</div><div class="tbadge">过渡</div></div>' +
      '<div class="ar">→</div>' +
      '<div class="tcard neu tc"><div class="tspan">2024 — 2026</div><div class="tword">牛马</div><div class="tnote">接棒 · 人格属性下降</div><div class="tbadge">在架</div></div>' +
      '</div>' +
      '<div class="qline">' +
      '<div class="ql">“打工人”里，还有个“人”字；</div>' +
      '<div class="ql">“牛马”里，<span class="ac">只剩牲畜</span>。</div>' +
      '</div>',
  });

  const s2 = {
    state(t) {
      const [a, b] = SEC.dg;
      if (t < a || t > b + 0.35) {
        D2.hide(); D2seal.hide(); R2.hide(); return;
      }

      /* ---- A 档案 7.00 – 15.20 ---- */
      const dIn = easeOutBack(ramp(t, 7.0, 0.42));
      const dOut = ease(ramp(t, 15.29, 0.35));
      const dO = (t < 15.29 ? 1 : 1 - dOut) * (t < 7.0 ? 0 : 1);
      D2.set({
        o: dO * (t > 6.9 ? 1 : 0),
        tx: -140 * dOut,
        ty: 170 * (1 - dIn),
        rot: -5 * dOut,
      });

      const dh = D2.q(".dhead");
      wipe(dh, ease(ramp(t, 7.32, 0.26)), "right");
      D2.q(".dline").style.transform =
        `scaleX(${ease(ramp(t, 8.55, 0.35)).toFixed(3)})`;
      D2.q(".dline").style.transformOrigin = "left";

      D2word.set(ramp(t, 7.58, 0.22), 0.22);
      D2word.nodes.forEach((n) => {
        const k = clamp((t - 7.58) / 0.55);
        n.style.filter = `blur(${((1 - k) * 3).toFixed(2)}px)`;
      });

      const rows = D2.qa(".drow");
      // 五行用四种不同入法，防止节奏一律
      const k1 = ease(ramp(t, 9.0, 0.45));
      const numEl = D2.q(".num1");
      numEl.innerHTML = `${odo(2019, 2020, k1)} 年 ${odo(8, 9, k1, 2)} 月 ${odo(21, 22, k1, 2)} 日`;
      rows[0].style.opacity = k1.toFixed(3);

      const k2 = ease(ramp(t, 9.55, 0.45));
      rows[1].style.opacity = k2.toFixed(3);
      rows[1].style.transform = `translateX(${((1 - k2) * 34).toFixed(1)}px)`;

      const k3 = ease(ramp(t, 10.1, 0.4));
      rows[2].style.opacity = k3.toFixed(3);
      rows[2].style.transform = `translateY(${((1 - k3) * 10).toFixed(1)}px)`;
      const hl2 = D2.q(".hl2");
      hl2.style.backgroundImage = "linear-gradient(rgba(246,214,203,.95),rgba(246,214,203,.95))";
      hl2.style.backgroundRepeat = "no-repeat";
      hl2.style.backgroundSize = `${(clamp((t - 10.5) / 0.3) * 100).toFixed(1)}% 46%`;
      hl2.style.backgroundPosition = "0 76%";

      typed(D2.q(".tw"), "劳动者的自嘲：我虽然累，但我是个“人”，我在打工", ramp(t, 10.75, 0.9));
      rows[3].style.opacity = (t > 10.7 ? 1 : 0).toFixed(2);

      const k5 = ease(ramp(t, 12.3, 0.5));
      rows[4].style.opacity = k5.toFixed(3);
      rows[4].style.transform = `translateY(${((1 - k5) * 10).toFixed(1)}px)`;

      D2seal.slap(ramp(t, 13.17, 0.7));

      /* ---- B 接替表 15.20 – 24.00 ---- */
      const rIn = ease(ramp(t, 15.29, 0.35));
      const rOut = ease(ramp(t, 22.99, 0.5));
      R2.set({
        o: rIn * (1 - rOut),
        tx: 140 * (1 - rIn) + 1200 * rOut,
        ty: 0,
        rot: 0,
      });
      R2.q(".revhead").style.transform = `scaleX(${ease(ramp(t, 15.55, 0.4)).toFixed(3)})`;
      R2.q(".revhead").style.transformOrigin = "left";
      R2.q(".revno").style.opacity = (t > 15.55 ? 1 : 0).toFixed(2);

      const cards = R2.qa(".tcard");
      const ars = R2.qa(".ar");

      // 卡①从下弹上
      const c1 = easeOutBack(ramp(t, 15.95, 0.55));
      cards[0].style.opacity = (t > 15.9 ? 1 : 0).toFixed(2);
      cards[0].style.transform = `translateY(${((1 - c1) * 90).toFixed(1)}px)`;
      // 卡②挤入（过冲）
      const c2p = clamp((t - 17.1) / 0.5);
      const c2 = easeOutBack(c2p);
      cards[1].style.opacity = (t > 17.05 ? 1 : 0).toFixed(2);
      cards[1].style.transform = `translateY(${((1 - c2) * 26).toFixed(1)}px) scale(${(0.88 + 0.15 * c2 - 0.03 * clamp((c2p - 0.8) / 0.2)).toFixed(3)}) rotate(${(-3 * (1 - c2)).toFixed(2)}deg)`;
      // 卡③从上砸下
      const c3 = easeOutBack(ramp(t, 18.2, 0.5));
      cards[2].style.opacity = (t > 18.15 ? 1 : 0).toFixed(2);
      cards[2].style.transform = `translateY(${((1 - c3) * -70).toFixed(1)}px)`;

      // 箭头由线画出：用 scaleX 模拟
      [16.75, 17.85].forEach((tt, i) => {
        const k = ease(ramp(t, tt, 0.35));
        ars[i].style.opacity = (k > 0 ? 1 : 0).toFixed(2);
        ars[i].style.transform = `scaleX(${(0.05 + 0.95 * k).toFixed(3)})`;
      });

      // 三卡一起沉一下
      const sink = 1 - 0.02 * pulse(t, 19.15, 0.3);
      R2.q(".trio").style.transform = `translateY(${(-18 * ease(ramp(t, 19.15, 0.4))).toFixed(1)}px) scale(${sink.toFixed(4)})`;

      const qls = R2.qa(".ql");
      const q1 = ease(ramp(t, 20.6, 0.4));
      const q2 = ease(ramp(t, 21.9, 0.4));
      qls[0].style.opacity = q1.toFixed(3);
      qls[0].style.transform = `translateY(${((1 - q1) * 12).toFixed(1)}px)`;
      qls[1].style.opacity = q2.toFixed(3);
      qls[1].style.transform = `translateY(${((1 - q2) * 12).toFixed(1)}px)`;
    },
  };

  /* =========================================================
     S3 · 形式主义  24 – 41
     A 档案：逐字落（带涟漪）→ 四行 → 「在用」绿章 → 镜头拉远
     B 场域对照：左半文件 / 右半搜索 → 扫描带擦除 → 三个新标签 → 「查无此词」
     ========================================================= */
  const D3 = sheet("stage", {
    cls: "dossier",
    html:
      '<div class="dhead"><span class="dname">词 语 档 案</span><span class="dno">档 1930 · 014</span></div>' +
      '<div class="dword"></div>' +
      '<div class="dline"></div>' +
      '<div class="rows">' +
      '<div class="drow dg"><span class="k">批评史起点</span><span class="v">1930 年《反对本本主义》已专门批评</span></div>' +
      '<div class="drow dg"><span class="k">官方高频</span><span class="v"><span class="num2">2012</span> 年八项规定后，成为治理高频词</span></div>' +
      '<div class="drow dg"><span class="k">现状</span><span class="v">2025 — 2026 年，仍在持续整治、持续印发</span></div>' +
      '<div class="drow dg"><span class="k">状态</span><span class="v">官方场域：<span class="em green">仍在使用</span></span></div>' +
      '</div>',
  });
  const D3seal = seal(D3.root, { x: 1052, y: 552, size: 124, text: "在用", rot: -12, cls: "sm ok" });
  const D3word = glyphs(D3.q(".dword"), "形式主义");
  // 三页小纸，代表"持续印发"
  const stack3 = el(
    '<div class="sheet"></div><div class="sheet"></div><div class="sheet"></div>',
    "stack", D3.root,
    "position:absolute;right:40px;bottom:56px;width:280px;height:200px;pointer-events:none",
  );
  const stackSheets = [...stack3.querySelectorAll(".sheet")];

  const F3 = sheet("stage", {
    cls: "rev",
    html:
      '<div class="revno">档 2026 · 场域核查</div>' +
      '<div class="revhead">场 域 对 照 表</div>' +
      '<div class="field">' +
      '<div class="fcol">' +
      '<div class="fctitle">官 方 场 域</div>' +
      '<div class="pile"><div class="pg"><div class="pgt"></div><div class="pln"></div><div class="pln s"></div><div class="pln"></div></div>' +
      '<div class="pg"><div class="pgt"></div><div class="pln"></div><div class="pln s"></div><div class="pln"></div></div>' +
      '<div class="pg"><div class="pgt"></div><div class="pln"></div><div class="pln s"></div><div class="pln"></div></div></div>' +
      '<div class="fcap">红头文件 · 持续印发</div>' +
      '<div class="fmark on">在 用</div>' +
      '</div>' +
      '<div class="fmid">vs</div>' +
      '<div class="fcol">' +
      '<div class="fctitle">民 间 场 域</div>' +
      '<div class="searchbox"><div class="sbar"><span class="smag">⌕</span><span class="sword"></span></div>' +
      '<div class="sres">未找到相关词条 · 无结果</div></div>' +
      '<div class="ntlab">日常吐槽改说 →</div>' +
      '<div class="newtags"><span class="nt">AI味</span><span class="nt">废话文学</span><span class="nt">正确的废话</span></div>' +
      '<div class="fmark off">查无此词</div>' +
      '</div></div>',
  });
  const scan3 = scanner(F3.root, { w: 240 });

  const s3 = {
    state(t) {
      const [a, b] = SEC.xs;
      if (t < a || t > b + 0.35) {
        D3.hide(); D3seal.hide(); F3.hide(); scan3.hide();
        vis(stack3, 0);
        return;
      }

      /* ---- A 档案 24.00 – 32.40 ---- */
      const dIn = ease(ramp(t, 24.0, 0.3));
      const dOut = ease(ramp(t, 32.05, 0.35));
      const camOut = ease(ramp(t, 30.2, 2.2)); // 1.12 → 1.00
      const z = lerp(1.12, 1.0, camOut);
      D3.set({
        o: dIn * (1 - dOut),
        tx: -140 * dOut,
        ty: 150 * (1 - dIn),
        rot: -5 * dOut,
        sx: z, sy: z,
      });

      wipe(D3.q(".dhead"), ease(ramp(t, 24.3, 0.24)), "right");
      D3.q(".dline").style.transform = `scaleX(${ease(ramp(t, 25.35, 0.3)).toFixed(3)})`;
      D3.q(".dline").style.transformOrigin = "left";

      D3word.set(ramp(t, 24.5, 0.2), 0.24);

      const rows3 = D3.qa(".drow");
      const k1 = ease(ramp(t, 25.8, 0.45));
      rows3[0].style.opacity = k1.toFixed(3);
      rows3[0].style.transform = `translateY(${((1 - k1) * 10).toFixed(1)}px)`;

      const k2 = ease(ramp(t, 26.6, 0.45));
      rows3[1].style.opacity = k2.toFixed(3);
      D3.q(".num2").textContent = odo(2011, 2012, k2);

      const k3 = ease(ramp(t, 27.6, 0.5));
      rows3[2].style.opacity = k3.toFixed(3);
      rows3[2].style.transform = `translateY(${((1 - k3) * 10).toFixed(1)}px)`;
      // 三页小纸叠上（错峰）
      vis(stack3, k3 > 0 ? 1 : 0);
      stackSheets.forEach((sh, i) => {
        const p = easeOutBack(ramp(t, 27.6 + i * 0.14, 0.4));
        sh.style.opacity = (p > 0 ? 1 : 0).toFixed(2);
        sh.style.transform = `rotate(${(-7 + i * 6).toFixed(1)}deg) translateY(${((1 - p) * -26).toFixed(1)}px)`;
      });

      const k4 = ease(ramp(t, 29.0, 0.45));
      rows3[3].style.opacity = k4.toFixed(3);
      D3seal.slap(ramp(t, 29.63, 0.7));

      /* ---- B 场域对照 32.40 – 41.00 ---- */
      const fIn = ease(ramp(t, 32.4, 0.35));
      const veil = ease(ramp(t, 39.3, 1.7));
      F3.set({
        o: fIn * (1 - 0.25 * veil),
        tx: -160 * (1 - fIn),
        rot: 0,
      });
      wipe(F3.q(".revhead"), ease(ramp(t, 32.5, 0.3)), "right");
      F3.q(".revno").style.opacity = (t > 32.5 ? 1 : 0).toFixed(2);

      // 左半：三页文件扇形落定
      const pgs = F3.qa(".pile .pg");
      pgs.forEach((p, i) => {
        const k = easeOutBack(ramp(t, 32.75 + i * 0.12, 0.4));
        p.style.opacity = (k > 0 ? 1 : 0).toFixed(2);
      });
      // 扫描擦除：左半文件被收掉一部分
      const scanK = ease(ramp(t, 35.48, 0.8));
      F3.q(".pile").style.clipPath = `inset(0 ${(scanK * 45).toFixed(1)}% 0 0)`;
      F3.q(".pile").style.filter = `saturate(${(1 - scanK * 0.55).toFixed(3)})`;

      // 右半：搜索框竖向裂开
      const sb = F3.q(".searchbox");
      const sbk = ease(ramp(t, 33.2, 0.4));
      sb.style.transform = `scaleY(${sbk.toFixed(3)})`;
      sb.style.transformOrigin = "center";
      typed(F3.q(".sword"), "形式主义", ramp(t, 33.6, 0.95));

      // 回车震三下
      const shake = pulse(t, 34.55, 0.5);
      sb.style.marginLeft = `${(Math.sin(t * 74) * 3 * shake).toFixed(2)}px`;
      const sres = F3.q(".sres");
      sres.style.opacity = (t > 34.9 ? 1 : 0).toFixed(2);

      scan3.set(ease(ramp(t, 35.48, 0.8)), "right");

      // 三个新标签依次弹入
      F3.qa(".nt").forEach((n, i) => {
        const k = easeOutBack(ramp(t, 36.15 + i * 0.42, 0.32));
        n.style.opacity = (k > 0 ? 1 : 0).toFixed(2);
        n.style.transform = `rotate(${((i - 1) * 4).toFixed(0)}deg) scale(${(0.6 + 0.45 * k).toFixed(3)})`;
      });
      const ntlab = F3.q(".ntlab");
      ntlab.style.opacity = (t > 35.95 ? 1 : 0).toFixed(2);

      const off = F3.q(".fmark.off");
      const ok = easeOutBack(ramp(t, 37.6, 0.55));
      off.style.opacity = (ok > 0 ? 1 : 0).toFixed(2);
      off.style.transform = `rotate(-8deg) scale(${(1.5 - 0.5 * ok).toFixed(3)})`;
    },
  };

  /* =========================================================
     S4 · 同根  41 – 57
     两卡错峰滑入 → 公式 → 汇流线生长 → 根节点弹入 → 「同根」章 → 推镜
     ========================================================= */
  const R4 = sheet("stage", {
    cls: "rev",
    html:
      '<div class="revno">归 因 核 查</div>' +
      '<div class="revhead">异 化 对 照 表</div>' +
      '<svg class="rootsvg" viewBox="0 0 1240 860">' +
      '<path class="rp" d="M 304 560 Q 300 620 540 642"/>' +
      '<path class="rp" d="M 936 560 Q 940 620 700 642"/>' +
      '</svg>' +
      '<div class="ccard l"><div class="ctag">事 的 异 化</div><div class="cword">形式主义</div>' +
      '<div class="cformula">行动 <span class="neq">≠</span> 目的</div><div class="cnote">劳动过程的空转</div></div>' +
      '<div class="ccard r"><div class="ctag">人 的 异 化</div><div class="cword">打工人</div>' +
      '<div class="cformula">劳动者 <span class="neq">≠</span> 成果</div><div class="cnote">劳动主体的退场</div></div>' +
      '<div class="rdot"></div>' +
      '<div class="rootbox"><div class="rlabel">共 同 根 源</div><div class="rword">人的劳动</div></div>',
  });
  const R4seal = seal(R4.root, { x: 820, y: 700, size: 130, text: "同根", rot: -10, cls: "sm" });

  const s4 = {
    state(t) {
      const [a, b] = SEC.root;
      if (t < a || t > b + 0.35) { R4.hide(); R4seal.hide(); return; }

      const inK = ease(ramp(t, 41.0, 0.3));
      const outK = ease(ramp(t, 56.2, 0.6));
      const camK = ease(ramp(t, 48.9, 1.7));
      const C = cam(camK, 0.15, 0);
      R4.set({
        o: inK * (1 - outK),
        tx: -140 * outK,
        rot: -5 * outK,
        sx: C.sx, sy: C.sy,
        ty: 150 * (1 - inK) + 44 * outK,
      });
      wipe(R4.q(".revhead"), ease(ramp(t, 41.05, 0.26)), "right");
      R4.q(".revno").style.opacity = (t > 41.05 ? 1 : 0).toFixed(2);

      const L = R4.q(".ccard.l");
      const R = R4.q(".ccard.r");
      const lk = easeOutBack(ramp(t, 41.32, 0.7));
      const rk = easeOutBack(ramp(t, 41.95, 0.65));
      L.style.opacity = (t > 41.25 ? 1 - 0.55 * camK : 0).toFixed(3);
      L.style.transform = `translateX(${((1 - lk) * -150).toFixed(1)}px) rotate(-4deg)`;
      R.style.opacity = (t > 41.9 ? 1 - 0.55 * camK : 0).toFixed(3);
      R.style.transform = `translateX(${((1 - rk) * 150).toFixed(1)}px) rotate(4deg)`;

      // 大词与公式
      const w1 = ease(ramp(t, 42.6, 0.4));
      R4.qa(".cword").forEach((n) => {
        n.style.transform = `scale(${(1.15 - 0.15 * w1).toFixed(3)})`;
        n.style.opacity = (t > 42.55 ? 1 : 0).toFixed(2);
      });
      const f1 = ease(ramp(t, 43.2, 0.4));
      R4.qa(".cformula").forEach((n) => {
        n.style.opacity = f1.toFixed(3);
        n.style.transform = `translateY(${((1 - f1) * 10).toFixed(1)}px)`;
      });
      const nk = pulse(t, 43.25, 0.45);
      R4.qa(".neq").forEach((n) => {
        n.style.transform = `scale(${(1 + 0.16 * nk).toFixed(3)})`;
      });
      cue(R4.qa(".cnote"), [44.0, 44.15], t, 0.38, 8);

      // 汇流线
      const w1k = ease(ramp(t, 44.8, 1.6));
      const w2k = ease(ramp(t, 45.05, 1.6));
      const rps = R4.qa(".rp");
      dash(rps[0], w1k);
      dash(rps[1], w2k);

      // 汇合光点
      const pk = pulse(t, 46.4, 0.7);
      const dot = R4.q(".rdot");
      if (dot) {
        dot.style.opacity = (pk > 0 ? 1 : 0).toFixed(2);
        dot.style.transform = `translate(-50%,-50%) scale(${(0.4 + 1.6 * pk).toFixed(3)})`;
      }

      // 根节点
      const rb = R4.q(".rootbox");
      const rbk = easeOutBack(ramp(t, 47.1, 0.9));
      rb.style.opacity = (t > 47.05 ? 1 : 0).toFixed(2);
      rb.style.transform = `translateX(-50%) translateY(${((1 - rbk) * 44).toFixed(1)}px) scale(${(0.94 + 0.06 * rbk).toFixed(3)})`;

      // 呼吸
      const br = pulse(t, 56.4, 0.6);
      R4.root.style.filter = `brightness(${(1 + 0.02 * br).toFixed(3)})`;

      R4seal.slap(ramp(t, 48.22, 0.7));
    },
  };

  /* =========================================================
     S5 · AI 接管  57 – 78
     传真滚入的新函 → 三行 → 「批准」章 → 推近特写
     → 批复表：旧词出现 → 划叉 → 新词砸入 → 柱子合拢 → 断裂掉渣 → 金句
     ========================================================= */
  const P5 = sheet("stage", {
    html:
      '<div class="fold"></div><div class="pin"></div>' +
      '<div class="docno">语 档〔2022〕第 1130 号</div>' +
      '<div class="corner">档 2022-1130</div>' +
      '<div class="redhead">语 言 档 案 室</div>' +
      '<div class="hrline"></div>' +
      '<div class="ptitle" style="top:202px"></div>' +
      '<div class="pbody" style="top:300px;font-size:24px;line-height:2.05;text-align:justify">' +
      '<div class="pb" style="margin-bottom:14px">经研究，AI 参与文本劳动，准予参与。</div>' +
      '<div class="pb" style="margin-bottom:14px">凡重复、空转、可批量生成的文字，准予由 AI 承担。</div>' +
      '<div class="pb">劳动者称呼与相关用语，相应调整。</div>' +
      '</div>' +
      '<div class="psign">语言档案室<br>2022 年 11 月 30 日</div>',
  });
  const P5seal = seal(P5.root, { x: 1036, y: 610, size: 200, text: "批准", rot: -13 });

  const T5 = sheet("stage", {
    cls: "rev",
    html:
      '<div class="revno">语 档 2022</div>' +
      '<div class="revhead">批 复 表</div>' +
      '<div class="rtbl">' +
      '<div class="rrow"><div class="rcell old"><div class="rtag">原 称</div><div class="rtext">打工人</div></div>' +
      '<div class="rar">→</div>' +
      '<div class="rcell nw"><div class="rtag">改 称</div><div class="rtext">牛马</div></div></div>' +
      '<div class="rrow"><div class="rcell old"><div class="rtag">原 称</div><div class="rtext">形式主义</div></div>' +
      '<div class="rar">→</div>' +
      '<div class="rcell nw"><div class="rtag">改 称</div><div class="rtext">AI味</div></div></div>' +
      '<div class="pillarwrap"><div class="pillar"><div class="pl"></div><div class="pr"></div></div>' +
      '<div class="plab">共同根源 · 人的劳动（已抽离）</div></div>' +
      '</div>' +
      '<div class="qmaxim">语言，比社会现实更早承认了退场</div>',
  });
  const oldCells = T5.qa(".rcell.old");
  const newCells = T5.qa(".rcell.nw");
  const rars = T5.qa(".rar");
  // 划叉挂整张纸（避开拓印的 grayscale 滤镜），坐标按 .rcell 268×112 的固定布局算
  const strike1 = strike(T5.root, { w: 236, rot: -8, x: 312, y: 256 });
  const strike2 = strike(T5.root, { w: 236, rot: -8, x: 312, y: 390 });
  // 断裂缝
  T5.q(".pillar").style.position = "relative";
  T5.q(".pillar").style.height = "232px";
  const plEl = T5.q(".pl");
  const prEl = T5.q(".pr");
  const halfCss =
    "position:absolute;top:0;width:152px;height:232px;border-radius:3px;" +
    "background:linear-gradient(180deg,#e9e0ca 0%,#d8cbae 55%,#c8ba9b 100%);" +
    "box-shadow:inset 0 0 0 1px rgba(120,96,60,.35),0 10px 24px rgba(60,45,20,.18)";
  plEl.style.cssText = halfCss + ";left:28px";
  prEl.style.cssText = halfCss + ";right:28px";
  plEl.style.clipPath = "polygon(0 0,100% 0,100% 45%,86% 50%,100% 56%,100% 100%,0 100%)";
  prEl.style.clipPath = "polygon(0 0,100% 0,100% 100%,0 100%,0 56%,14% 50%,0 45%)";
  const seam = el("", "", T5.q(".pillar"),
    "position:absolute;left:50%;top:0;bottom:0;width:3px;margin-left:-1.5px;z-index:4;" +
    "background:#b0231a;border-radius:2px;opacity:0;transform-origin:top center");
  const dust = particles(T5.q(".pillar"), { n: 7, seed: 11, spread: 22, fall: 130 });

  const s5 = {
    state(t) {
      const [a, b] = SEC.ai;
      if (t < a || t > b + 0.35) {
        P5.hide(); P5seal.hide(); T5.hide();
        strike1.hide(); strike2.hide(); dust.hide();
        return;
      }

      /* ---- A 新函 57.00 – 65.50 ---- */
      const pIn = ease(ramp(t, 56.99, 0.4));
      const pOut = ease(ramp(t, 65.5, 0.35));
      const camK = ease(ramp(t, 63.7, 0.7));
      const C = cam(camK, 0.3, 0);
      P5.set({
        o: pIn * (1 - pOut),
        tx: -140 * pOut,
        ty: -150 * (1 - pIn) + 44 * pOut,
        rot: lerp(1.5, 0, pIn) - 5 * pOut,
        sx: C.sx, sy: C.sy,
      });
      // 传真滚入：纸从顶部展开
      P5.root.style.transformOrigin = "top center";
      P5.root.style.transform = `translate(0px,${(-150 * (1 - pIn) + 44 * pOut).toFixed(1)}px) rotate(${(lerp(1.5, 0, pIn) - 5 * pOut).toFixed(2)}deg) scale(${C.sx.toFixed(3)},${(0.08 + 0.92 * pIn).toFixed(3)})`;

      P5.q(".docno").style.opacity = (t > 57.4 ? 1 : 0).toFixed(2);
      P5.q(".redhead").style.transform = `scaleX(${ease(ramp(t, 57.4, 0.24)).toFixed(3)})`;
      P5.q(".redhead").style.transformOrigin = "center";
      P5.q(".hrline").style.transform = `scaleX(${ease(ramp(t, 58.2, 0.18)).toFixed(3)})`;
      P5.q(".hrline").style.transformOrigin = "left";
      typed(P5.q(".ptitle"), "关于 AI 参与文本劳动的通知", ramp(t, 58.5, 1.1));
      cue(P5.qa(".pb"), [59.6, 60.3, 61.0], t, 0.42, 10);
      P5.q(".psign").style.opacity = ease(ramp(t, 62.1, 0.4)).toFixed(3);
      P5seal.slap(ramp(t, 63.1, 0.7));

      /* ---- B 批复表 65.50 – 78.00 ---- */
      const tIn = easeOutBack(ramp(t, 65.49, 0.35));
      const tOut = ease(ramp(t, 77.9, 0.35));
      T5.set({
        o: (t > 65.45 ? 1 : 0) * (1 - tOut),
        tx: -140 * tOut,
        ty: 420 * (1 - clamp(tIn)),
        rot: -5 * tOut,
      });
      wipe(T5.q(".revhead"), ease(ramp(t, 65.85, 0.28)), "right");
      T5.q(".revno").style.opacity = (t > 65.85 ? 1 : 0).toFixed(2);

      const oldCells = T5.qa(".rcell.old");
      const newCells = T5.qa(".rcell.nw");
      const rars = T5.qa(".rar");

      // 第 1 行：旧词 → 划叉 → 新词砸入
      const o1 = ease(ramp(t, 66.25, 0.3));
      oldCells[0].style.opacity = (t > 66.2 ? 1 : 0).toFixed(2);
      oldCells[0].style.transform = `translateY(${((1 - o1) * 10).toFixed(1)}px)`;
      strike1.set(ramp(t, 66.52, 0.28));
      const n1 = easeOutBack(ramp(t, 66.82, 0.3));
      newCells[0].style.opacity = (t > 66.8 ? 1 : 0).toFixed(2);
      newCells[0].style.transform = `translateY(${((1 - n1) * -40).toFixed(1)}px)`;

      rars[0].style.transform = `scaleX(${(0.05 + 0.95 * ease(ramp(t, 67.9, 0.25))).toFixed(3)})`;

      // 第 2 行
      const o2 = ease(ramp(t, 68.15, 0.3));
      oldCells[1].style.opacity = (t > 68.1 ? 1 : 0).toFixed(2);
      oldCells[1].style.transform = `translateY(${((1 - o2) * 10).toFixed(1)}px)`;
      strike2.set(ramp(t, 68.42, 0.28));
      const n2 = easeOutBack(ramp(t, 68.72, 0.3));
      newCells[1].style.opacity = (t > 68.7 ? 1 : 0).toFixed(2);
      newCells[1].style.transform = `translateY(${((1 - n2) * -40).toFixed(1)}px)`;
      rars[1].style.transform = `scaleX(${(0.05 + 0.95 * ease(ramp(t, 69.4, 0.25))).toFixed(3)})`;

      // 两行一起下沉
      const sink = ease(ramp(t, 69.74, 0.2));
      T5.qa(".rrow").forEach((r) => {
        r.style.marginTop = `${(8 * sink).toFixed(1)}px`;
      });

      // 柱子：合拢 → 裂开 → 掉渣
      const closeK = ease(ramp(t, 69.74, 1.2));
      const brk = ease(ramp(t, 70.80, 1.1));
      const pl = T5.q(".pl");
      const pr = T5.q(".pr");
      const pv = clamp(closeK);
      pl.style.opacity = pv.toFixed(2);
      pr.style.opacity = pv.toFixed(2);
      pl.style.transformOrigin = "bottom right";
      pr.style.transformOrigin = "bottom left";
      pl.style.transform =
        `translate(${(-15 * brk).toFixed(1)}px,${(7 * brk).toFixed(1)}px) rotate(${(-2.6 * brk).toFixed(2)}deg) scaleY(${(0.2 + 0.8 * pv).toFixed(3)})`;
      pr.style.transform =
        `translate(${(15 * brk).toFixed(1)}px,${(7 * brk).toFixed(1)}px) rotate(${(2.6 * brk).toFixed(2)}deg) scaleY(${(0.2 + 0.8 * pv).toFixed(3)})`;
      // 裂缝：随断裂一起出现
      seam.style.opacity = (brk * 0.85).toFixed(3);
      seam.style.transform = `scaleY(${brk.toFixed(3)})`;

      dust.update(clamp((t - 70.9) / 1.2), 0, 0);

      // 柱下标签：字色由墨变灰
      const plab = T5.q(".plab");
      const labK = ease(ramp(t, 72.9, 1.0));
      plab.style.opacity = labK.toFixed(3);
      const g = Math.round(lerp(0x2a, 0x8a, labK));
      const g2 = Math.round(lerp(0x24, 0x82, labK));
      const g3 = Math.round(lerp(0x19, 0x72, labK));
      plab.style.color = `rgb(${g},${g2},${g3})`;

      // 金句
      const qk = ease(ramp(t, 73.9, 0.7));
      const qm = T5.q(".qmaxim");
      qm.style.opacity = qk.toFixed(3);
      qm.style.transform = `translateY(${((1 - qk) * 18).toFixed(1)}px)`;
      T5.root.style.filter = `brightness(${(1 - 0.08 * ease(ramp(t, 73.9, 1.2))).toFixed(3)})`;
    },
  };

  /* =========================================================
     S6 · 收束  78 – 90
     金句纸 → 「已归档」章 → 静置 → 淡出 + 径向黑场 → 问句两行
     ========================================================= */
  const M6 = sheet("stage", {
    cls: "maxim",
    html:
      '<div class="mline">「打工人里还有个“人”字，</div>' +
      '<div class="mline">牛马里<span class="ac">只剩牲畜</span>。」</div>' +
      '<div class="msub">—— 语言比社会现实更早承认了退场</div>',
  });
  const M6seal = seal(M6.root, { x: 1030, y: 722, size: 150, text: "已归档", rot: -12, cls: "sm" });
  const hw1 = handwrite(M6.qa(".mline")[0], "「打工人里还有个“人”字，");
  const hw2 = handwrite(M6.qa(".mline")[1], "牛马里只剩牲畜。」", { accent: "只剩牲畜" });

  const E6 = sheet("stage", {
    x: 0, y: 0, w: 1920, h: 1080, cls: "endcard",
    html:
      '<div class="eq">' +
      '<div class="eq1">当<span class="ac">“工作”</span>也开始消失，</div>' +
      '<div class="eq2">你还会用什么词，称呼自己？</div>' +
      '</div>',
  });

  const s6 = {
    state(t) {
      const [a, b] = SEC.out;
      if (t < a || t > b + 0.35) { M6.hide(); M6seal.hide(); E6.hide(); return; }

      /* 金句页 78.00 – 82.15 */
      const mIn = easeOutBack(ramp(t, 78.0, 0.35));
      const mOut = ease(ramp(t, 81.42, 0.7));
      M6.set({
        o: (t > 77.95 ? 1 : 0) * (1 - mOut),
        ty: 150 * (1 - mIn),
        rot: 0,
      });
      /* 金句：手写逐字写出（笔尖跟随），写完盖「已归档」 */
      hw1.set(ramp(t, 78.24, 0.88));
      hw2.set(ramp(t, 79.18, 0.72));
      M6.q(".msub").style.opacity = ease(ramp(t, 79.4, 0.5)).toFixed(3);
      M6seal.slap(ramp(t, 79.56, 0.6));

      /* 黑场 + 问句 81.42 – 90 */
      const blackK = ease(ramp(t, 81.42, 0.9));
      E6.set({ o: blackK });
      E6.root.style.clipPath = `circle(${(blackK * 120).toFixed(1)}% at 50% 50%)`;

      const k1 = ease(ramp(t, 83.02, 0.5));
      const k2 = ease(ramp(t, 84.34, 0.5));
      const q1 = E6.q(".eq1");
      const q2 = E6.q(".eq2");
      q1.style.opacity = k1.toFixed(3);
      q1.style.transform = `translateY(${(14 * (1 - k1)).toFixed(1)}px)`;
      q2.style.opacity = k2.toFixed(3);
      q2.style.transform = `translateY(${(14 * (1 - k2)).toFixed(1)}px)`;

      // 89.6 起轻微收暗
      E6.root.style.filter = `brightness(${(1 - 0.04 * ease(ramp(t, 89.6, 0.4))).toFixed(3)})`;

      // 结尾极缓推近：问句停住时画面仍在走，避免最后几秒完全静止
      E6.root.style.transformOrigin = "50% 50%";
      E6.root.style.transform = `scale(${(1 + 0.05 * ease(ramp(t, 82.4, 7.6))).toFixed(4)})`;
    },
  };

  return [s1, s2, s3, s4, s5, s6];
}
