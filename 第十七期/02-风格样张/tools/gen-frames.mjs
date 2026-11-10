// 第十七期风格样张生成器：同一套"变形装置"结构 + 三套色板（A 深海数据 / B 暖萌手帐 / C 极简科普）。
// 每套两张：主视觉（官方 Logo 被贴纸贴满、长出脸——变形起点瞬间）＋ 引文卡（金句题眼）。
// 用法（在 02-风格样张 下）：node tools/gen-frames.mjs && node tools/shot.mjs
import { writeFileSync } from "node:fs";

// ---------------------------------------------------------------- 三套色板
const STYLES = {
  a: {
    id: "a", slug: "deepsea", name: "深海数据", label: "样张 A · 深海数据",
    capFont: "NotoSC", quoteFont: "NotoSerifSC",
    bg: "radial-gradient(80% 66% at 50% 38%,#0c2147 0%,#071632 52%,#04080f 100%)", bgSolid: "#050a14",
    ink: "#eaf2ff", muted: "#8ea8cf", faint: "#4c6a97", accent: "#3b82f6", accent2: "#f0a04b",
    chip: { border: "rgba(139,172,224,.55)", text: "#dbe7fb", fill: "rgba(20,44,84,.72)" },
    panel: "linear-gradient(180deg,rgba(16,34,66,.94),rgba(8,20,44,.94))", panelBorder: "rgba(102,140,204,.55)",
    panelShadow: "0 34px 90px rgba(0,0,0,.6)",
    logo: "drop-shadow(0 24px 40px rgba(0,0,0,.55))",
    overlay: `<div class="grid"></div><div class="vig"></div>`,
    css: `.grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(90,140,220,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(90,140,220,.07) 1px,transparent 1px);background-size:64px 64px}.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(78% 72% at 50% 44%,transparent 52%,rgba(0,0,0,.5) 100%)}`,
  },
  b: {
    id: "b", slug: "warm", name: "暖萌手帐", label: "样张 B · 暖萌手帐",
    capFont: "NotoSC", quoteFont: "NotoSerifSC",
    bg: "radial-gradient(80% 66% at 50% 38%,#2a1c3a 0%,#181226 52%,#0a0712 100%)", bgSolid: "#0d0916",
    ink: "#fff3e0", muted: "#d9b98e", faint: "#8d7355", accent: "#ffb86c", accent2: "#7ec8ff",
    chip: { border: "rgba(255,184,108,.6)", text: "#ffd9a8", fill: "rgba(52,32,58,.78)" },
    panel: "linear-gradient(180deg,rgba(56,36,66,.92),rgba(30,18,40,.92))", panelBorder: "rgba(255,184,108,.5)",
    panelShadow: "0 34px 90px rgba(0,0,0,.6)",
    logo: "drop-shadow(0 24px 44px rgba(0,0,0,.55))",
    overlay: `<div class="dots"></div><div class="vig"></div>`,
    css: `.dots{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,184,108,.14) 2px,transparent 2.5px);background-size:34px 34px}.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(78% 72% at 50% 44%,transparent 52%,rgba(0,0,0,.5) 100%)}`,
  },
  c: {
    id: "c", slug: "minimal", name: "极简科普", label: "样张 C · 极简科普",
    capFont: "NotoSC", quoteFont: "NotoSC",
    bg: "radial-gradient(80% 66% at 50% 38%,#10151f 0%,#090c13 55%,#04050a 100%)", bgSolid: "#04050a",
    ink: "#f6f8fc", muted: "#b6c2d6", faint: "#5d6b85", accent: "#60a5fa", accent2: "#f5d78a",
    chip: { border: "rgba(150,170,205,.45)", text: "#cdd8ea", fill: "rgba(26,32,46,.8)" },
    panel: "linear-gradient(180deg,rgba(18,23,34,.96),rgba(10,13,20,.96))", panelBorder: "rgba(140,160,195,.5)",
    panelShadow: "0 30px 80px rgba(0,0,0,.65)",
    logo: "drop-shadow(0 22px 36px rgba(0,0,0,.6))",
    overlay: `<div class="vig"></div>`,
    css: `.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(78% 72% at 50% 44%,transparent 55%,rgba(0,0,0,.5) 100%)}`,
  },
  d: {
    id: "d", slug: "elysia", name: "粉白妖精", label: "样张 D · 粉白妖精",
    capFont: "NotoSC", quoteFont: "NotoSerifSC",
    bg: "radial-gradient(80% 66% at 50% 38%,#ffe7f1 0%,#fff6f9 52%,#ffdfec 100%)", bgSolid: "#ffe9f2",
    ink: "#554066", muted: "#96739a", faint: "#c2a2c2", accent: "#ff4d88", accent2: "#c9a05a",
    chip: { border: "rgba(255,77,136,.5)", text: "#5b3f66", fill: "rgba(255,255,255,.9)" },
    panel: "linear-gradient(180deg,rgba(255,244,248,.97),rgba(255,235,243,.97))", panelBorder: "rgba(255,77,136,.45)",
    panelShadow: "0 34px 90px rgba(190,105,145,.4)",
    logo: "drop-shadow(0 22px 40px rgba(180,95,140,.4))",
    logoCardBorder: "border:2px solid rgba(255,77,136,.4)",
    overlay: `<div class="petals"></div><div class="vig"></div>`,
    css: `.petals{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(255,77,136,.14) 2.5px,transparent 3px);background-size:44px 44px}.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(80% 72% at 50% 44%,transparent 56%,rgba(196,120,160,.24) 100%)}`,
  },
  e: {
    id: "e", slug: "sky", name: "天蓝浅白", label: "样张 E · 天蓝浅白",
    capFont: "NotoSC", quoteFont: "NotoSerifSC",
    bg: "radial-gradient(80% 66% at 50% 38%,#dff1fc 0%,#f0f9fe 52%,#cde8f7 100%)", bgSolid: "#e9f5fd",
    ink: "#143a5c", muted: "#477a99", faint: "#8ab3cc", accent: "#1f9bd6", accent2: "#f0a04b",
    chip: { border: "rgba(31,155,214,.5)", text: "#143a5c", fill: "rgba(255,255,255,.92)" },
    panel: "linear-gradient(180deg,rgba(255,255,255,.98),rgba(238,248,254,.98))", panelBorder: "rgba(31,155,214,.5)",
    panelShadow: "0 34px 90px rgba(80,150,190,.35)",
    logo: "drop-shadow(0 22px 40px rgba(70,140,180,.35))",
    logoCardBorder: "border:2px solid rgba(31,155,214,.4)",
    overlay: `<div class="bubbles"></div><div class="vig"></div>`,
    css: `.bubbles{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(31,155,214,.16) 2.5px,transparent 3px);background-size:44px 44px}.vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(80% 72% at 50% 44%,transparent 56%,rgba(110,175,210,.28) 100%)}`,
  },
};

// ---------------------------------------------------------------- 公共外壳
const head = (t, title, extraCss = "") => `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
@font-face{font-family:NotoSC;src:url("assets/fonts/NotoSansSC-VF.ttf") format("truetype");font-weight:100 900;font-display:block}
@font-face{font-family:NotoSerifSC;src:url("assets/fonts/NotoSerifSC-VF.ttf") format("truetype");font-weight:200 900;font-display:block}
@font-face{font-family:WenKai;src:url("assets/fonts/LXGWWenKai-Regular.ttf") format("truetype");font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;height:1080px;overflow:hidden;background:${t.bgSolid}}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:${t.bg}}
.mode{position:absolute;left:72px;top:52px;font-family:NotoSC;font-weight:700;font-size:15px;letter-spacing:.42em;color:${t.faint}}
.tag{position:absolute;left:50%;top:36px;transform:translateX(-50%);padding:10px 32px;border:2px solid ${t.chip.border};border-radius:999px;font-family:NotoSC;font-weight:600;font-size:24px;letter-spacing:.14em;color:${t.chip.text};background:${t.chip.fill};white-space:nowrap}
.note{position:absolute;left:0;right:0;top:788px;text-align:center;font-family:NotoSC;font-weight:500;font-size:27px;letter-spacing:.05em;color:${t.muted}}
.note b{color:${t.accent};font-weight:700}
.caption{position:absolute;left:0;right:0;top:918px;height:64px;line-height:64px;text-align:center;font-family:${t.capFont};font-weight:800;font-size:46px;letter-spacing:.04em;color:${t.ink}}
.caption em{font-style:normal;color:${t.accent}}
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
const chrome = (t, caption, tag) => `<div class="mode">${t.label}</div>
<div class="tag">${tag}</div>
<div class="caption">${caption}</div>`;

// ---------------------------------------------------------------- 主视觉：变形起点（官方 Logo 被贴满、长出脸）
function mainFrame(t) {
  const css = `
.logo-card{position:absolute;left:610px;top:250px;width:700px;height:470px;border-radius:26px;background:#fff;box-shadow:${t.logo};transform:rotate(-1.2deg);overflow:hidden;${t.logoCardBorder || ""}}
.logo-card img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;padding:46px}
.face{position:absolute;inset:0;pointer-events:none}
.chip{position:absolute;font-family:WenKai;font-weight:700;font-size:30px;padding:8px 20px;border-radius:999px;background:${t.chip.fill};border:2px solid ${t.chip.border};color:${t.chip.text};letter-spacing:.06em;white-space:nowrap;box-shadow:0 10px 22px rgba(0,0,0,.35)}
.chip2{position:absolute;font-family:NotoSC;font-weight:800;font-size:22px;padding:6px 16px;border-radius:8px;background:${t.chip.fill};border:2px solid ${t.chip.border};color:${t.chip.text};letter-spacing:.08em;white-space:nowrap}
.arrow{position:absolute;left:1330px;top:436px;font-family:NotoSC;font-weight:800;font-size:30px;color:${t.accent};letter-spacing:.1em;white-space:nowrap}
.arrow b{color:${t.accent2}}`;
  const eye = `<circle cx="0" cy="0" r="13" fill="#10141f"/><circle cx="4" cy="-4" r="4.4" fill="#fff"/>`;
  const body = `
<div class="logo-card">
  <img src="assets/official-logo.jpg" alt="DeepSeek 官方鲸鱼 Logo"/>
  <svg class="face" viewBox="0 0 700 470" preserveAspectRatio="xMidYMid meet">
    <g transform="translate(350 250)">
      <g transform="translate(-46 -2)">${eye}</g>
      <g transform="translate(46 -2)">${eye}</g>
      <circle cx="0" cy="26" r="24" fill="#ff9db1" opacity=".55"/>
      <circle cx="-62" cy="30" r="24" fill="#ff9db1" opacity=".55"/>
      <circle cx="62" cy="30" r="24" fill="#ff9db1" opacity=".55"/>
      <path d="M-30 58 Q0 78 30 58" fill="none" stroke="#10141f" stroke-width="5" stroke-linecap="round"/>
      <g transform="translate(0 118)">
        <path d="M-56 -18 Q0 -46 56 -18 Q56 34 0 34 Q-56 34 -56 -18 Z" fill="#233252" stroke="#3b5aa8" stroke-width="4"/>
        <circle cx="-14" cy="4" r="6" fill="#ffb86c"/><circle cx="14" cy="4" r="6" fill="#ffb86c"/>
        <path d="M-6 10 L0 20 L6 10 Z" fill="#fff"/>
      </g>
    </g>
  </svg>
</div>
<div class="chip" style="left:382px;top:206px;transform:rotate(-7deg)">闺女</div>
<div class="chip" style="left:976px;top:216px;transform:rotate(5deg)">大肥鱼</div>
<div class="chip" style="left:420px;top:478px;transform:rotate(4deg)">吃白饭</div>
<div class="chip" style="left:972px;top:492px;transform:rotate(-5deg)">催起床</div>
<div class="chip2" style="left:1120px;top:310px;transform:rotate(8deg)">摸鱼</div>
<div class="chip2" style="left:386px;top:330px;transform:rotate(-6deg)">本鲸</div>
<div class="arrow" style="top:402px">长出<b>脸</b>了 →</div>`;
  return head(t, `样张 ${t.id.toUpperCase()} · ${t.name} · 主视觉`, css) + body + "\n"
    + chrome(t, "贴上称呼，它开始<em>长出脸</em>。", "机制 · 长出血肉")
    + `\n<div class="note">变形装置 · 起点：官方 Logo → 贴满称呼 → 长出眼睛/腮红/女仆装 → <b>长成大肥鱼</b></div>\n`
    + tail(t);
}

// ---------------------------------------------------------------- 引文卡：金句题眼
function quoteFrame(t) {
  const css = `
.page{position:absolute;left:300px;top:150px;width:1320px;height:560px;border-radius:22px;background:${t.panel};border:2px solid ${t.panelBorder};box-shadow:${t.panelShadow}}
.q{position:absolute;left:120px;right:120px;top:96px;font-family:${t.quoteFont};font-weight:700;font-size:76px;line-height:1.5;color:${t.ink};letter-spacing:.05em;text-align:center}
.hl{position:relative;display:inline-block;color:${t.accent};font-weight:900}
.hl svg{position:absolute;left:-46px;top:-20px;width:calc(100% + 92px);height:calc(100% + 40px);overflow:visible}
.src{position:absolute;left:0;right:0;bottom:44px;text-align:center;font-family:NotoSC;font-weight:600;font-size:25px;letter-spacing:.3em;color:${t.faint}}
.deco{position:absolute;left:96px;bottom:52px;font-family:WenKai;font-size:34px;color:${t.accent};transform:rotate(-4deg)}
.deco svg{position:absolute;left:-66px;top:10px;width:56px;height:34px;overflow:visible}`;
  const loop = `<svg viewBox="0 0 300 70" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" d="M14 40 C6 12 120 2 244 8 S298 34 280 54 S160 72 58 64 S2 58 14 30" fill="none" stroke="${t.accent}" stroke-width="4" stroke-linecap="round"/></svg>`;
  const petal = `<svg viewBox="0 0 56 34"><path vector-effect="non-scaling-stroke" d="M28 4 C46 8 52 20 48 30 C34 34 8 32 4 22 C8 8 18 4 28 4 Z" fill="none" stroke="${t.accent}" stroke-width="3"/></svg>`;
  const q = `<div class="page">
  <div class="q">
    <p>被爱的东西，</p>
    <p>会<span class="hl">${loop}疯狂长出血肉</span>。</p>
  </div>
  <div class="src">二次元圈流传 · 类比</div>
  <div class="deco">${petal}被爱，才有血肉</div>
</div>`;
  return head(t, `样张 ${t.id.toUpperCase()} · ${t.name} · 引文`, css) + q + "\n"
    + chrome(t, "被爱的东西，会<em>疯狂长出血肉</em>。", "题眼 · 金句")
    + `\n<div class="note">全片题眼 · 圈内流传语（无唯一出处）· 片中标注<b>类比</b></div>\n`
    + tail(t);
}

for (const t of Object.values(STYLES)) {
  writeFileSync(`frame-${t.id}-${t.slug}-main.html`, mainFrame(t));
  writeFileSync(`frame-${t.id}-${t.slug}-quote.html`, quoteFrame(t));
  console.log("wrote", t.id, t.slug);
}
