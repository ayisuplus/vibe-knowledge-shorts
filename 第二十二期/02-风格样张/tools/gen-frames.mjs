// 第二十二期 P3：三个视觉方向，每个方向输出主视觉和引文卡（1920×1080 PNG）。
// 从项目仓库根目录运行：node 第二十二期/02-风格样张/tools/gen-frames.mjs [a b c]
// 样张是静态视觉提案，不是 P5 成片工程。字体放在 ../fonts/（不入库）。
// 主视觉三方向画同一拍：① 开门见山，课程价签贴上开源项目页，报警器亮起（项目页虚构）。
// 引文卡三方向画同一段：③ 1920 年代的旧广告与广告预算（档案 F-4、F-5，图为示意）。
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const versions = readdirSync(cache).sort();
const executablePath = join(cache, versions.at(-1), "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!existsSync(executablePath)) throw new Error(`本地 headless Chrome 不存在：${executablePath}`);
for (const f of ["NotoSansSC-VF.ttf", "NotoSerifSC-VF.ttf", "CascadiaMono.ttf", "LXGWWenKai-Regular.ttf"])
  if (!existsSync(join(here, "fonts", f))) throw new Error(`缺字体 fonts/${f}`);

const RED = "#ff3b30";

const common = `
@font-face{font-family:NotoSC;src:url(fonts/NotoSansSC-VF.ttf)}
@font-face{font-family:NotoSerifSC;src:url(fonts/NotoSerifSC-VF.ttf)}
@font-face{font-family:CascadiaMono;src:url(fonts/CascadiaMono.ttf)}
@font-face{font-family:WenKai;src:url(fonts/LXGWWenKai-Regular.ttf)}
*{box-sizing:border-box} html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{font-family:NotoSC,sans-serif}
.frame{position:relative;width:1920px;height:1080px;overflow:hidden;isolation:isolate}
.art{position:absolute;inset:0;width:1920px;height:1080px}
.mono{font-family:CascadiaMono,NotoSC,monospace}
.serif{font-family:NotoSerifSC,serif}
.hand{font-family:WenKai,NotoSC,sans-serif}
.abs{position:absolute;white-space:nowrap}
.mode{position:absolute;left:76px;top:44px;font-size:30px;font-weight:600;letter-spacing:.1em;opacity:.85}
.mark{position:absolute;right:80px;top:44px;font-size:30px;letter-spacing:.08em;opacity:.85}
.note{position:absolute;top:800px;left:110px;width:1700px;text-align:center;font-size:38px;font-weight:500;line-height:1.3;white-space:nowrap}
.caption{position:absolute;top:900px;left:110px;width:1700px;text-align:center;font-size:60px;line-height:1.3;font-weight:800;letter-spacing:.03em;white-space:nowrap;text-shadow:0 2px 12px #000c}
/* 项目页：正文用色条，不放小字 */
.page{position:absolute;overflow:hidden}
.page .tt{font-size:58px;font-weight:800;letter-spacing:.02em}
.page .bd{display:inline-block;margin-top:22px;padding:6px 24px;border-radius:30px;font-size:38px;font-weight:700}
.page .ln{height:18px;border-radius:9px;margin-top:26px}
.tagp{position:absolute;width:430px;height:232px;padding:34px 0 0 92px;font-weight:900;clip-path:polygon(16% 0,100% 0,100% 100%,16% 100%,0 50%)}
.tagp .a{font-size:44px;line-height:1.2}
.tagp .b{font-size:66px;line-height:1.25}
.hole{position:absolute;width:30px;height:30px;border-radius:50%;left:30px;top:101px}
/* 旧广告 */
.ad{position:absolute;overflow:hidden}
.ad .h{font-size:92px;line-height:1.05;font-weight:900;letter-spacing:-.01em}
.ad .zh{font-size:44px;font-weight:700;margin-top:18px}
.ad .word{display:inline-block;font-size:82px;font-weight:900;font-style:italic;margin-top:30px;padding:0 10px}
.ad .ln{height:13px;margin-top:17px;opacity:.42}
.nm{position:absolute;white-space:nowrap}
.nm .who{font-size:40px;font-weight:700;letter-spacing:.06em}
.nm .v{font-size:136px;font-weight:900;line-height:1.08;letter-spacing:-.01em}
.nm .v small{font-size:68px;font-weight:800;margin-left:6px}
`;

const defsCommon = `
<filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="soft2" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="46"/></filter>
<filter id="rough" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
<radialGradient id="ledCore"><stop offset="0" stop-color="#fff4ef"/><stop offset=".3" stop-color="#ff8a7c"/><stop offset="1" stop-color="${RED}"/></radialGradient>
<radialGradient id="ledHalo"><stop offset="0" stop-color="${RED}" stop-opacity=".62"/><stop offset=".45" stop-color="${RED}" stop-opacity=".16"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>`;

// 主角报警器：一个圆形烟雾报警器，三个方向用同一个造型
function alarm(cx, cy, r, { glow = 1, c1 = "#e9e7e2", c2 = "#8f8f8f", line = "#5a5a5a", engraved = false } = {}) {
  const gid = `case${cx}${cy}`;
  let s = `<g><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 3.3}" fill="url(#ledHalo)" opacity="${glow}"/>`;
  s += `<ellipse cx="${cx}" cy="${cy + r * 0.14}" rx="${r * 1.04}" ry="${r * 1.02}" fill="#000" opacity=".55"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gid})" stroke="${line}" stroke-width="${engraved ? 6 : 3}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.74}" fill="none" stroke="${line}" stroke-width="${engraved ? 4 : 3}" opacity=".85"/>`;
  // 进烟口：几道粗弧，不做密集小孔
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26, b = a + 0.62, R = r * 0.87;
    s += `<path d="M${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)} A${R} ${R} 0 0 1 ${(cx + R * Math.cos(b)).toFixed(1)} ${(cy + R * Math.sin(b)).toFixed(1)}" fill="none" stroke="${line}" stroke-width="${r * 0.09}" stroke-linecap="round" opacity=".8"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="${RED}"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.24}" fill="url(#ledCore)"/>`;
  // 声波：三道大弧
  for (const k of [1.28, 1.56, 1.84]) {
    const R = r * k;
    for (const [a, b] of [[-0.62, 0.62], [Math.PI - 0.62, Math.PI + 0.62]])
      s += `<path d="M${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)} A${R} ${R} 0 0 1 ${(cx + R * Math.cos(b)).toFixed(1)} ${(cy + R * Math.sin(b)).toFixed(1)}" fill="none" stroke="${RED}" stroke-width="7" stroke-linecap="round" opacity="${(1.25 - k * 0.5).toFixed(2)}"/>`;
  }
  return s + `</g>`;
}

function gear(cx, cy, r, teeth, fill, stroke) {
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2, R = i % 2 ? r * 0.84 : r;
    const a2 = a + Math.PI / teeth;
    d += `${i ? "L" : "M"}${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)} L${(cx + R * Math.cos(a2)).toFixed(1)} ${(cy + R * Math.sin(a2)).toFixed(1)} `;
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/><circle cx="${cx}" cy="${cy}" r="${r * 0.3}" fill="#0c0d0f" stroke="${stroke}" stroke-width="3"/>`;
}

const pageInner = (lc, widths = [88, 74, 92, 60, 80]) =>
  `<div class="tt">某个开源项目</div><div class="bd">开源 · 免费使用</div>` +
  widths.map((w) => `<div class="ln" style="width:${w}%;background:${lc}"></div>`).join("");

// ══════════ A · 深夜的屏幕 ══════════
const A = {
  id: "a", slug: "screen", name: "深夜的屏幕",
  css: `
.frame{color:#eef3fa;background:radial-gradient(ellipse at 42% 40%,#16233c 0%,#0b1220 48%,#05070d 100%)}
.mode,.mark{color:#9fb4d0}.note{color:#c5d3e6}.caption{color:#fff}
.page{left:300px;top:150px;width:900px;height:560px;padding:50px 60px;border-radius:18px;background:linear-gradient(180deg,#eef3fa,#cfdbea);color:#10192a;box-shadow:0 0 0 12px #1a2230,0 0 0 14px #33405a,0 0 160px #6ea3e044}
.page .bd{background:#d8eadf;color:#0f5c37}
.tagp{left:880px;top:430px;background:linear-gradient(170deg,#ff5247,#c9231a);color:#fff;transform:rotate(-8deg);box-shadow:0 24px 60px #000b}
.hole{background:#0b1220}
.ad{left:190px;top:170px;width:800px;height:570px;padding:44px 52px;background:linear-gradient(170deg,#ecdfc2,#cdb98f);color:#241b0e;transform:rotate(-2deg);box-shadow:0 40px 100px #000c}
.ad .word{color:#b0231a;border:6px solid #b0231a;border-radius:50px}.ad .ln{background:#3a2c15}
.nm .who{color:#c5d3e6}.nm .v{color:#eef3fa}.nm.hot .v{color:#ff6a5e;text-shadow:0 0 44px #ff3b3066}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}</defs>`;
    s += `<ellipse cx="760" cy="430" rx="720" ry="400" fill="#4f86c8" opacity=".14" filter="url(#soft2)"/>`;
    s += `<path d="M0 760 L1920 742 L1920 1080 L0 1080 Z" fill="#070a11"/><line x1="0" y1="760" x2="1920" y2="742" stroke="#2a3448" stroke-width="2"/>`;
    if (kind === "main") {
      s += `<rect x="690" y="722" width="120" height="30" fill="#1a2230"/><ellipse cx="750" cy="756" rx="240" ry="16" fill="#27324a"/>`;
      s += alarm(1570, 300, 118);
    } else {
      s += `<ellipse cx="590" cy="770" rx="600" ry="60" fill="#000" opacity=".5" filter="url(#soft)"/>`;
      s += alarm(1660, 210, 64, { glow: 0.7 });
    }
    return s + `</svg>`;
  },
};

// ══════════ B · 机房与发动机 ══════════
const B = {
  id: "b", slug: "engine", name: "机房与发动机",
  css: `
.frame{color:#f2efe9;background:radial-gradient(ellipse at 60% 42%,#2a2c30 0%,#17181b 52%,#0b0b0d 100%)}
.mode,.mark{color:#b4b0a6}.note{color:#d2cec4}.caption{color:#fff}
.page{left:200px;top:170px;width:820px;height:540px;padding:46px 54px;border-radius:10px;background:linear-gradient(180deg,#3a3d42,#26282c);color:#f4f2ec;border:3px solid #6a6d73;box-shadow:0 34px 90px #000c}
.page .bd{background:#1e4b37;color:#a8efc9}
.tagp{left:700px;top:440px;background:linear-gradient(170deg,#ff8a2b,#d24d12);color:#14100a;transform:rotate(-7deg);box-shadow:0 24px 60px #000b}
.hole{background:#17181b}
.ad{left:180px;top:170px;width:800px;height:570px;padding:44px 52px;background:linear-gradient(170deg,#ded2b6,#b7a988);color:#1f1a10;box-shadow:0 0 0 10px #3a3d42,0 34px 90px #000c}
.ad .word{color:#b92a10;border:6px solid #b92a10;border-radius:50px}.ad .ln{background:#2b2415}
.nm .who{color:#d2cec4}.nm .v{color:#f2efe9}.nm.hot .v{color:#ff9a3d;text-shadow:0 0 44px #ff7a1a66}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}</defs>`;
    if (kind === "main") {
      s += gear(1510, 330, 300, 14, "#26282c", "#55585e");
      s += gear(1160, 610, 140, 10, "#2e3035", "#63666c");
      s += gear(1790, 610, 140, 10, "#2e3035", "#63666c");
      s += alarm(1510, 330, 128, { c1: "#d7d5cf", c2: "#77797d" });
    } else {
      s += gear(1680, 300, 150, 11, "#26282c", "#55585e");
      s += alarm(1680, 300, 64, { glow: 0.65, c1: "#d7d5cf", c2: "#77797d" });
    }
    s += `<rect x="0" y="770" width="1920" height="310" fill="#000" opacity=".5"/>`;
    return s + `</svg>`;
  },
};

// ══════════ C · 旧广告版面 ══════════
const C = {
  id: "c", slug: "oldad", name: "旧广告版面",
  css: `
.frame{color:#f4ead2;background:radial-gradient(ellipse at 50% 40%,#2a2319 0%,#191510 58%,#0c0a07 100%)}
.mode,.mark{color:#c8b78f}.note{color:#dcceac}.caption{color:#fff8e8}
.page{left:230px;top:140px;width:880px;height:600px;padding:50px 60px;background:linear-gradient(172deg,#efe2c3,#d3bf93);color:#20180b;transform:rotate(-1.4deg);box-shadow:0 34px 90px #000c;border:3px double #5c4522;outline:3px solid #5c4522;outline-offset:-16px}
.page .tt{font-family:NotoSerifSC,serif;font-weight:900;font-size:62px}
.page .bd{background:none;border:4px solid #1d5a3b;color:#1d5a3b;border-radius:6px}
.tagp{left:830px;top:470px;background:#a81f14;color:#fff3dc;transform:rotate(-9deg);box-shadow:0 18px 40px #0009;font-family:NotoSerifSC,serif}
.hole{background:#d3bf93}
.ad{left:210px;top:130px;width:860px;height:630px;padding:50px 58px;background:linear-gradient(172deg,#efe2c3,#d3bf93);color:#20180b;transform:rotate(-1.2deg);box-shadow:0 34px 90px #000c;outline:3px solid #5c4522;outline-offset:-16px}
.ad .word{color:#a81f14;border:6px solid #a81f14;border-radius:50px}.ad .ln{background:#3a2c15}
.nm .who{color:#dcceac}.nm .v{color:#f4ead2;font-family:NotoSerifSC,serif}.nm.hot .v{color:#ff7a68;text-shadow:0 0 40px #e0301e55}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}</defs>`;
    if (kind === "main") {
      s += `<g filter="url(#rough)">` + alarm(1560, 320, 122, { engraved: true, c1: "#efe2c3", c2: "#c4af82", line: "#4a3618" }) + `</g>`;
    } else {
      s += `<g filter="url(#rough)">` + alarm(1690, 200, 62, { glow: 0.65, engraved: true, c1: "#efe2c3", c2: "#c4af82", line: "#4a3618" }) + `</g>`;
    }
    return s + `</svg>`;
  },
};

const mainHtml = (th) => {
  const lc = { a: "#9fb0c6", b: "#6b6e74", c: "#6a5530" }[th.id];
  return `<div class="page">${pageInner(lc)}</div>` +
    `<div class="tagp"><span class="hole"></span><div class="a">限时课程</div><div class="b">¥ ???</div></div>`;
};
const quoteHtml = () =>
  `<div class="ad serif"><div class="h">He Never<br>Knew Why</div><div class="zh">他始终不知道为什么</div>` +
  `<div class="word">halitosis</div><div class="ln" style="width:92%"></div><div class="ln" style="width:78%"></div></div>` +
  `<div class="nm" style="left:1120px;top:300px"><div class="who">广告预算 · 1922</div><div class="v">10<small>万美元</small></div></div>` +
  `<div class="nm hot" style="left:1120px;top:530px"><div class="who">广告预算 · 1928</div><div class="v">500<small>万美元</small></div></div>`;

const text = {
  main: { note: "项目页面与价签均为虚构示意", caption: "今天讲一门生意：怎么把害怕，做成产品。" },
  quote: { note: "Marchand 1985 · 一款美国漱口水 · 图为示意", caption: "一个旧词典里翻出来的词，让口臭有了学名。" },
};

function html(th, kind) {
  const t = text[kind];
  const body = kind === "main" ? mainHtml(th) : quoteHtml();
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>样张 ${th.id.toUpperCase()} · ${th.name}</title><style>${common}${th.css}</style></head><body><div class="frame">${th.art(kind)}${body}` +
    `<div class="mode">${th.id.toUpperCase()} · ${th.name}</div><div class="mark">风格样张</div>` +
    `<div class="note" data-check="note">${t.note}</div><div class="caption" data-check="caption">${t.caption}</div></div></body></html>`;
}

const pick = process.argv.slice(2);
const themes = [A, B, C].filter((th) => !pick.length || pick.includes(th.id));
const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--disable-gpu", "--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { throw e; });
  for (const th of themes) for (const kind of ["main", "quote"]) {
    const stem = `样张-${th.id}-${th.slug}-${kind}`;
    const htmlPath = join(here, `${stem}.html`), pngPath = join(here, `${stem}.png`);
    writeFileSync(htmlPath, html(th, kind), "utf8");
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
    // 注释带与字幕带不许溢出画面左右（1920 宽，留 60px 边）
    const problems = await page.evaluate(() => [...document.querySelectorAll("[data-check]")].flatMap((el) => {
      const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect();
      return b.left < 60 || b.right > 1860 ? [`${el.dataset.check} 溢出 ${Math.round(b.left)}–${Math.round(b.right)}`] : [];
    }));
    await page.screenshot({ path: pngPath });
    console.log(`${stem}.png  字体 ${[...new Set(fonts)].join("/")}${problems.length ? "  ⚠ " + problems.join("; ") : ""}`);
  }
} finally { await browser.close(); }
