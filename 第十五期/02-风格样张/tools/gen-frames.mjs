// 由同一份花样 + 三套色板生成样张 HTML（每套两张：织 = S3 主装置，引 = S2 引文卡）。
// 用法（在 02-风格样张 下）：node tools/gen-frames.mjs && node tools/shot.mjs
// 布面 = 16×16 的 0/1 花样：1 = 提经（经线浮在面上，竖纹），0 = 不提（纬线浮在面上，横纹）。
// 花本 = 同一张表，1 的地方打一个结。样张里只是定格：已织 10 行 + 第 11 行织了一半。
import { writeFileSync } from "node:fs";

const N = 16, S = 36;            // 16 列 × 16 行，格 36px（≥20px，手机上也认得出）
const K = 10, J = 9;             // 当前行 = 第 11 行（0 起算为 10），梭子停在第 9 列后
const bit = (r, c) => { const x = c - 7.5, y = r - 7.5; return ((Math.abs(x) + Math.abs(y)) % 4) < 2; };

const W = N * S, GAP = 150;
const TX = Math.round((1920 - (2 * W + GAP)) / 2);   // 花本左缘
const CX = TX + W + GAP;                              // 布面左缘
const Y0 = 160, Y1 = Y0 + N * S;
const cy = (r) => Y0 + r * S + S / 2;
const liftCount = Array.from({ length: N }, (_, c) => bit(K, c)).filter(Boolean).length;

// ---------------------------------------------------------------- 三套色板
const STYLES = {
  a: {
    id: "a", slug: "silk", name: "绢本", label: "绢 本 · 样 张 A",
    capFont: "NSerif", quoteFont: "NSerif",
    bg: "radial-gradient(70% 62% at 50% 42%,#f3eddd 0%,#ece4d0 55%,#e2d9c4 100%)", bgSolid: "#e9e2d2",
    ink: "#2a2419", muted: "#6f5f45", faint: "#a0927a", accent: "#a63a2b",
    warp: ["#7d2218", "#b23a2b", "#d8604b"], gapWarp: "#4f130d",
    weft: ["#8f6f22", "#c9a24a", "#ead08a"], gapWeft: "#5b4313",
    bare: "#8a7a5e", cord: "#8a7a5e", knot: "#a63a2b", glow: "rgba(166,58,43,.20)", beam: "#6b5a3c",
    shuttle: ["#a67c4a", "#6b4a28"], shuttleEdge: "#3d2a14", shuttleSlot: "#2a1d0c",
    tag: { border: "#8a7a5e", text: "#5b4d36", fill: "rgba(255,250,235,.6)" },
    panel: "linear-gradient(180deg,#fbf6ea,#f4ecda)", panelBorder: "#cdbf9f", panelShadow: "0 30px 80px rgba(60,45,20,.30)",
    clothShadow: "drop-shadow(0 22px 34px rgba(60,45,20,.38))",
    overlay: `<div class="grain"></div>`,
    css: `.grain{position:absolute;inset:-40px;pointer-events:none;opacity:.07;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='4'/></filter><rect width='260' height='260' filter='url(%23n)'/></svg>")}`,
  },
  b: {
    id: "b", slug: "gold", name: "暗靛金丝", label: "暗 靛 金 丝 · 样 张 B",
    capFont: "NSSC", quoteFont: "NSerif",
    bg: "radial-gradient(70% 62% at 50% 42%,#1b2552 0%,#101838 55%,#070b1d 100%)", bgSolid: "#070b1d",
    ink: "#f6efdc", muted: "#aab3d6", faint: "#7c87b3", accent: "#f0c15a",
    warp: ["#a9791d", "#e0b043", "#f8dc8a"], gapWarp: "#5e410c",
    weft: ["#1d2b66", "#2f4491", "#4a62b8"], gapWeft: "#0d1538",
    bare: "#6b78a8", cord: "#8791c0", knot: "#f0c15a", glow: "rgba(240,193,90,.20)", beam: "#c79a3b",
    shuttle: ["#e2bb5d", "#8a6420"], shuttleEdge: "#3b2a0a", shuttleSlot: "#2a1d08",
    tag: { border: "rgba(240,193,90,.6)", text: "#f0c15a", fill: "rgba(15,22,52,.6)" },
    panel: "linear-gradient(180deg,rgba(18,26,60,.86),rgba(10,16,40,.86))", panelBorder: "rgba(240,193,90,.55)", panelShadow: "0 30px 90px rgba(0,0,0,.55)",
    clothShadow: "drop-shadow(0 0 36px rgba(240,193,90,.22))",
    overlay: `<div class="warpfx"></div><div class="vig"></div>`,
    css: `.warpfx{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0 1px,transparent 1px 7px)}.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(75% 70% at 50% 45%,transparent 55%,rgba(0,0,0,.45) 100%)}`,
  },
  c: {
    id: "c", slug: "blue", name: "蓝白二值", label: "蓝 白 二 值 · 样 张 C",
    capFont: "NSSC", quoteFont: "NSSC",
    bg: "radial-gradient(70% 62% at 50% 42%,#f1f5fa 0%,#e6edf5 55%,#d8e1ee 100%)", bgSolid: "#e6edf5",
    ink: "#12203a", muted: "#52638a", faint: "#8b9bb8", accent: "#1f56c7",
    warp: ["#14316e", "#1f4a9e", "#3a6fd0"], gapWarp: "#0b1d44",
    weft: ["#c7d2e6", "#f4f7fc", "#ffffff"], gapWeft: "#9fb0cf",
    bare: "#8fa0c0", cord: "#8fa0c0", knot: "#1f56c7", glow: "rgba(31,86,199,.16)", beam: "#3a4f78",
    shuttle: ["#5b6f99", "#2c3d63"], shuttleEdge: "#1b2740", shuttleSlot: "#0f1830",
    tag: { border: "#8b9bb8", text: "#3a4f78", fill: "rgba(255,255,255,.7)" },
    panel: "linear-gradient(180deg,rgba(255,255,255,.94),rgba(246,249,253,.94))", panelBorder: "#c3cfe3", panelShadow: "0 30px 80px rgba(30,50,90,.25)",
    clothShadow: "drop-shadow(0 22px 34px rgba(30,50,90,.32))",
    overlay: `<div class="grid"></div>`,
    css: `.grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(31,86,199,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(31,86,199,.06) 1px,transparent 1px);background-size:48px 48px}`,
  },
};

// ---------------------------------------------------------------- 公共外壳
const head = (t, title, extraCss = "") => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
@font-face{font-family:NSSC;src:url("assets/fonts/NotoSansSC-VF.ttf") format("truetype");font-weight:100 900;font-display:block}
@font-face{font-family:NSerif;src:url("assets/fonts/NotoSerifSC-VF.ttf") format("truetype");font-weight:200 900;font-display:block}
@font-face{font-family:WenKai;src:url("assets/fonts/LXGWWenKai-Regular.ttf") format("truetype");font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:${t.bgSolid}}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:${t.bg}}
.mode{position:absolute;left:104px;top:56px;font-family:NSSC;font-size:15px;letter-spacing:.4em;color:${t.faint}}
.tag{position:absolute;left:50%;top:36px;transform:translateX(-50%);padding:10px 32px;border:2px solid ${t.tag.border};border-radius:999px;font-family:NSSC;font-weight:600;font-size:24px;letter-spacing:.12em;color:${t.tag.text};background:${t.tag.fill};white-space:nowrap}
.note{position:absolute;left:0;right:0;top:788px;text-align:center;font-family:NSSC;font-weight:500;font-size:28px;letter-spacing:.04em;color:${t.muted}}
.note b{color:${t.accent};font-weight:700}
.caption{position:absolute;left:0;right:0;top:918px;height:64px;line-height:64px;text-align:center;font-family:${t.capFont};font-weight:800;font-size:46px;letter-spacing:.04em;color:${t.ink}}
.caption em{font-style:normal;color:${t.accent}}
svg.stage{position:absolute;left:0;top:0}
${t.css}
${extraCss}
</style>
</head>
<body>
<div id="root">
`;
const tail = (t) => `${t.overlay}
</div>
</body>
</html>
`;
const chrome = (t, caption) => `<div class="mode">${t.label}</div>
<div class="tag">明 · 1637 · 《天工开物》</div>
<div class="caption">${caption}</div>`;

// ---------------------------------------------------------------- 织：S3 主装置
function defs(t) {
  return `<defs>
<linearGradient id="gw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${t.warp[0]}"/><stop offset=".5" stop-color="${t.warp[2]}"/><stop offset="1" stop-color="${t.warp[0]}"/></linearGradient>
<linearGradient id="gf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.weft[0]}"/><stop offset=".5" stop-color="${t.weft[2]}"/><stop offset="1" stop-color="${t.weft[0]}"/></linearGradient>
<linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.shuttle[0]}"/><stop offset="1" stop-color="${t.shuttle[1]}"/></linearGradient>
<marker id="ah" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="${t.accent}"/></marker>
</defs>`;
}

function cloth(t) {
  let s = "";
  for (let r = 0; r <= K; r++) for (let c = 0; c < N; c++) {
    if (r === K && c >= J) continue;
    const x = CX + c * S, y = Y0 + r * S, b = bit(r, c);
    s += `<rect x="${x}" y="${y}" width="${S}" height="${S}" fill="${b ? t.gapWarp : t.gapWeft}"/>`;
    for (const o of [2, 13, 24]) s += b
      ? `<rect x="${x + o}" y="${y}" width="10" height="${S}" fill="url(#gw)"/>`
      : `<rect x="${x}" y="${y + o}" width="${S}" height="10" fill="url(#gf)"/>`;
  }
  for (let c = 0; c < N; c++) {   // 还没织的部分：裸经线
    const x = CX + c * S, y = Y0 + (c < J ? K + 1 : K) * S;
    for (const o of [6, 18, 30]) s += `<rect x="${x + o - 1.5}" y="${y}" width="3" height="${Y1 - y}" rx="1.5" fill="${t.bare}" opacity=".85"/>`;
  }
  return `<g style="filter:${t.clothShadow}">${s}</g>`;
}

function tape(t) {
  let s = `<rect x="${TX - 26}" y="${Y0 - 28}" width="${W + 52}" height="14" rx="7" fill="${t.beam}"/>`;
  s += `<rect x="${TX - 12}" y="${Y0 - 16}" width="4" height="${N * S + 30}" rx="2" fill="${t.cord}" opacity=".8"/>`;
  s += `<rect x="${TX + W + 8}" y="${Y0 - 16}" width="4" height="${N * S + 30}" rx="2" fill="${t.cord}" opacity=".8"/>`;
  for (let c = 0; c < N; c++) {   // 竖线：和横线织成一张结网，避免被看成算盘
    const x = TX + c * S + S / 2;
    s += `<line x1="${x}" y1="${Y0 - 14}" x2="${x}" y2="${Y1 + 6}" stroke="${t.cord}" stroke-width="2.5" opacity=".5"/>`;
  }
  for (let r = 0; r < N; r++) {
    const y = cy(r), op = r < K ? 0.55 : r === K ? 1 : 0.34;
    s += `<line x1="${TX}" y1="${y}" x2="${TX + W}" y2="${y}" stroke="${t.cord}" stroke-width="4" opacity="${op}"/>`;
    for (let c = 0; c < N; c++) if (bit(r, c)) {
      const x = TX + c * S + S / 2;
      if (r === K) s += `<circle cx="${x}" cy="${y}" r="17" fill="${t.glow}"/>`;
      s += `<circle cx="${x}" cy="${y}" r="11" fill="${t.knot}" opacity="${op}"/><circle cx="${x - 3}" cy="${y - 3.5}" r="3.6" fill="#fff" opacity="${(op * 0.35).toFixed(2)}"/>`;
    }
  }
  return s;
}

function shuttle(t) {
  const x = CX + J * S + 4, y = cy(K);
  return `<g transform="translate(${x} ${y})"><path d="M-44 0 Q-24 -14 -2 -14 L34 -5 L50 0 L34 5 L-2 14 Q-24 14 -44 0 Z" fill="url(#gs)" stroke="${t.shuttleEdge}" stroke-width="2.5" style="filter:drop-shadow(0 6px 8px rgba(0,0,0,.35))"/><rect x="-20" y="-4.5" width="32" height="9" rx="4.5" fill="${t.shuttleSlot}"/></g>`;
}

function weaveFrame(t) {
  const beamY = cy(K);
  const svg = `<svg class="stage" width="1920" height="1080" viewBox="0 0 1920 1080">
${defs(t)}
<rect x="${TX - 44}" y="${beamY - S / 2}" width="${CX + W - TX + 88}" height="${S}" fill="${t.glow}"/>
${tape(t)}
<line x1="${TX + W + 36}" y1="${beamY}" x2="${CX - 40}" y2="${beamY}" stroke="${t.accent}" stroke-width="5" stroke-linecap="round" marker-end="url(#ah)"/>
<text x="${(TX + W + CX) / 2}" y="${beamY - 24}" text-anchor="middle" font-family="NSSC" font-weight="700" font-size="26" fill="${t.accent}">第 ${K + 1} 行</text>
${cloth(t)}
${shuttle(t)}
<text x="${TX + W / 2}" y="${Y0 - 46}" text-anchor="middle" font-family="NSSC" font-weight="700" font-size="28" letter-spacing="8" fill="${t.muted}">花 本</text>
<text x="${CX + W / 2}" y="${Y0 - 46}" text-anchor="middle" font-family="NSSC" font-weight="700" font-size="28" letter-spacing="8" fill="${t.muted}">布 面</text>
</svg>`;
  return head(t, `样张 ${t.id.toUpperCase()} · ${t.name} · 织`) + svg + "\n"
    + chrome(t, "一梭一提：<em>提，或不提。</em>")
    + `\n<div class="note">花本这一行有 <b>${liftCount}</b> 个结 → 提起这 <b>${liftCount}</b> 根经线，过一梭</div>\n`
    + tail(t);
}

// ---------------------------------------------------------------- 引：S2 引文卡
function quoteFrame(page, panelStyle = page) {
  const t = panelStyle;   // 纸页（panel）、朱批、圈、箭头用 panelStyle 的色板；页面底色与字幕用 page 的
  const css = `
.page{position:absolute;left:300px;top:128px;width:1320px;height:610px;border-radius:10px;background:${t.panel};border:2px solid ${t.panelBorder};box-shadow:${t.panelShadow}}
.src{position:absolute;left:130px;top:46px;font-family:NSSC;font-weight:600;font-size:24px;letter-spacing:.14em;color:${t.muted}}
.rule{position:absolute;left:130px;right:130px;top:98px;height:2px;background:${t.panelBorder}}
.q{position:absolute;left:130px;top:128px;font-family:${t.quoteFont};font-weight:600;font-size:40px;line-height:1.8;color:${t.ink};letter-spacing:.03em}
.q p{white-space:nowrap}
.hl{position:relative;display:inline-block;color:${t.accent};font-weight:800}
.hl svg{position:absolute;left:-34px;top:-12px;width:calc(100% + 68px);height:calc(100% + 24px);overflow:visible}
.gloss{position:absolute;left:1020px;top:340px;width:260px;font-family:WenKai;font-size:34px;line-height:1.5;color:${t.accent};transform:rotate(-3deg)}
.gloss svg{position:absolute;left:-74px;top:14px;width:64px;height:36px;overflow:visible}`;
  const loop = `<svg viewBox="0 0 300 70" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M14 40 C6 12 120 2 244 8 S298 34 280 54 S160 72 58 64 S2 58 14 30" fill="none" stroke="${t.accent}" stroke-width="3.5" stroke-linecap="round"/></svg>`;
  const arrow = `<svg viewBox="0 0 64 36"><path vector-effect="non-scaling-stroke" d="M62 22 C46 8 22 8 6 20 M6 20 L18 12 M6 20 L16 30" fill="none" stroke="${t.accent}" stroke-width="3" stroke-linecap="round"/></svg>`;
  const body = `<div class="page">
  <div class="src">《天工开物·乃服》· 结花本</div>
  <div class="rule"></div>
  <div class="q">
    <p>画师先画何等花色于纸上，</p>
    <p>结本者以丝线随画量度，</p>
    <p>算计分寸杪忽而结成之。</p>
    <p>张悬花楼之上，<span class="hl">即织者不知成何花色，</span></p>
    <p>穿综带经，随其尺寸度数提起衢脚，</p>
    <p>梭过之后居然花现。</p>
  </div>
  <div class="gloss">${arrow}织的人，不知道织出来是什么花</div>
</div>`;
  const hlSvg = body.replace(`<span class="hl">即织者不知成何花色，</span>`, `<span class="hl">${loop}即织者不知成何花色，</span>`);
  return head(page, `样张 ${page.id.toUpperCase()} · ${page.name} · 引`, css) + hlSvg + "\n"
    + chrome(page, "1637 年，<em>宋应星</em>这样写花楼织机")
    + `\n<div class="note">原文 · 简体转写</div>\n`
    + tail(page);
}

for (const t of Object.values(STYLES)) {
  writeFileSync(`frame-${t.id}-${t.slug}-weave.html`, weaveFrame(t));
  writeFileSync(`frame-${t.id}-${t.slug}-quote.html`, quoteFrame(t));
  console.log("wrote", t.id, t.slug);
}
// 混搭 D：B 的暗底 + A 的纸页（引文卡像一页古籍浮在暗底上；织的主装置仍用 B）
const d = { ...STYLES.b, id: "d", slug: "hybrid", name: "暗底纸页", label: "暗 底 纸 页 · 样 张 D（B 的底 + A 的纸页）" };
writeFileSync(`frame-d-hybrid-quote.html`, quoteFrame(d, { ...STYLES.a, panelShadow: "0 30px 90px rgba(0,0,0,.62)" }));
console.log("wrote d hybrid");
