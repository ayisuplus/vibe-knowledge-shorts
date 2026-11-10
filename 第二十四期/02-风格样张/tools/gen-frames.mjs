// 第二十四期 P3：三个视觉方向，每个方向画同样两拍（1920×1080 PNG）。
// 从项目仓库根目录运行：node 第二十四期/02-风格样张/tools/gen-frames.mjs [a b c]
// 样张是静态视觉提案，不是 P5 成片工程。字体放在 ../fonts/，英雄与 logo 素材放在 ../素材/（均不入库）。
// 拍一 pipes：③ 同样一块钱走两条路，苹果国区标准 25%、安卓联运五五为行业惯例（档案 F-9、F-10，示意）。
// 拍二 remap：④ 一合区，分钱的地图就得重画；点券跨不过去（档案 F-5、F-10–F-13，行业分析）。
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const versions = readdirSync(cache).sort();
const executablePath = join(cache, versions.at(-1), "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!existsSync(executablePath)) throw new Error(`本地 headless Chrome 不存在：${executablePath}`);
for (const f of ["fonts/NotoSansSC-VF.ttf", "fonts/LXGWWenKai-Regular.ttf", "素材/apple.svg", "素材/android.svg", "素材/face-112.png"])
  if (!existsSync(join(here, f))) throw new Error(`缺文件 ${f}`);

const APPLE = readFileSync(join(here, "素材/apple.svg"), "utf8").match(/ d="([^"]+)"/)[1]; // 814×1000

// ---------- 三个方向的色板与笔触 ----------
const STYLES = {
  a: {
    key: "meme", name: "A · 表情包拼贴",
    bg: `<radialGradient id="bgg" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#1b2a5c"/><stop offset="1" stop-color="#070b1c"/></radialGradient>`,
    ink: "#0a0a0a", paper: "#ffffff", text: "#ffffff", coin: "#ffd21f", coinDark: "#c98a00",
    red: "#ff3b30", yel: "#ffd21f", grn: "#3ddc84", pipe: "#2a3b78", pipeEdge: "#0a0a0a",
    font: "NotoSC", weight: 900, stroke: 10, rough: false,
  },
  b: {
    key: "chalk", name: "B · 黑板涂鸦",
    bg: `<radialGradient id="bgg" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#2c3d35"/><stop offset="1" stop-color="#121a16"/></radialGradient>`,
    ink: "#f3efe4", paper: "#f3efe4", text: "#f3efe4", coin: "#f7d65a", coinDark: "#f7d65a",
    red: "#ff7a68", yel: "#f7d65a", grn: "#9fe7ae", pipe: "none", pipeEdge: "#f3efe4",
    font: "WenKai", weight: 700, stroke: 0, rough: true,
  },
  c: {
    key: "flat", name: "C · 扁平几何",
    bg: `<linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#111a33"/><stop offset="1" stop-color="#080c18"/></linearGradient>`,
    ink: "#080c18", paper: "#eef2f8", text: "#eef2f8", coin: "#ffc53d", coinDark: "#e09a12",
    red: "#ff5a4e", yel: "#ffc53d", grn: "#3ddc84", pipe: "#1d2a4d", pipeEdge: "none",
    font: "NotoSC", weight: 800, stroke: 0, rough: false,
  },
};

const css = (S) => `
@font-face{font-family:NotoSC;src:url(fonts/NotoSansSC-VF.ttf)}
@font-face{font-family:WenKai;src:url(fonts/LXGWWenKai-Regular.ttf)}
*{box-sizing:border-box} html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#000}
body{font-family:${S.font},NotoSC,sans-serif}
.frame{position:relative;width:1920px;height:1080px;overflow:hidden}
.art{position:absolute;inset:0;width:1920px;height:1080px}
.mode{position:absolute;left:76px;top:44px;font-size:32px;font-weight:700;letter-spacing:.08em;color:${S.text};opacity:.9}
.note{position:absolute;top:792px;left:60px;width:1800px;text-align:center;font-size:38px;font-weight:500;line-height:1.3;white-space:nowrap;color:${S.text};opacity:.88}
.caption{position:absolute;top:900px;left:60px;width:1800px;text-align:center;font-size:60px;line-height:1.3;font-weight:800;letter-spacing:.03em;white-space:nowrap;color:#fff;
  ${S.key === "meme" ? "-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:0 5px 0 #000" : "text-shadow:0 2px 12px #000c"}}
`;

// ---------- 绘图基元 ----------
const T = (S, x, y, s, size, { fill, anchor = "middle", rot = 0, weight, stroke } = {}) => {
  const st = stroke ?? S.stroke;
  const sw = st ? `stroke="${S.ink}" stroke-width="${st}" stroke-linejoin="round" paint-order="stroke"` : "";
  return `<text x="${x}" y="${y}" font-family="${S.font},NotoSC" font-size="${size}" font-weight="${weight ?? S.weight}" fill="${fill ?? S.text}" text-anchor="${anchor}" ${sw} transform="rotate(${rot} ${x} ${y})">${s}</text>`;
};

function pie(cx, cy, r, missing) {
  if (missing <= 0) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  // 从 12 点顺时针缺掉 missing 比例：保留的是从缺口终点继续顺时针回到 12 点
  const a0 = -Math.PI / 2 + missing * 2 * Math.PI;
  const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
  const large = 1 - missing > 0.5 ? 1 : 0;
  return `M${cx} ${cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${large} 1 ${cx} ${cy - r}Z`;
}

// 主角：一枚一块钱硬币，有表情
function coin(S, cx, cy, r, { missing = 0, face = "happy", label = "¥1", rot = 0 } = {}) {
  let s = `<g transform="rotate(${rot} ${cx} ${cy})">`;
  if (S.key === "meme") {
    s += `<path d="${pie(cx, cy + 8, r, missing)}" fill="#000"/>`;
    s += `<path d="${pie(cx, cy, r, missing)}" fill="${S.coin}" stroke="#000" stroke-width="8" stroke-linejoin="round"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.78}" fill="none" stroke="${S.coinDark}" stroke-width="6" ${missing ? `clip-path="url(#none)" opacity=".0"` : ""}/>`;
  } else if (S.key === "chalk") {
    s += `<path d="${pie(cx, cy, r, missing)}" fill="${S.coin}" fill-opacity=".16" stroke="${S.coin}" stroke-width="6" stroke-linejoin="round" filter="url(#chalk)"/>`;
  } else {
    s += `<path d="${pie(cx, cy, r, missing)}" fill="${S.coin}"/>`;
    s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.8}" fill="${S.coinDark}" opacity=".35" clip-path="url(#none)"/>`;
  }
  if (false) {
    // 缺口边上的咬痕：几个大半圆，不做细碎小孔
    const a0 = -Math.PI / 2 + missing * 2 * Math.PI;
    for (let i = 1; i <= 2; i++) {
      const t = i / 3, bx = cx + r * t * Math.cos(a0), by = cy + r * t * Math.sin(a0);
      s += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r * 0.13}" fill="${S.key === "meme" ? "#0d1530" : "#0d142a"}"/>`;
    }
  }
  // 表情（放在硬币左下半，缺口在右上，不会被切掉）
  const ex = cx - r * (missing ? 0.55 : 0.3), ey = cy - r * 0.02, d = r * 0.34, er = r * 0.1;
  const col = S.key === "chalk" ? S.coin : "#1a1200";
  if (face === "shock") {
    s += `<circle cx="${ex}" cy="${ey}" r="${er * 1.5}" fill="#fff" stroke="${col}" stroke-width="5"/><circle cx="${ex + d}" cy="${ey}" r="${er * 1.5}" fill="#fff" stroke="${col}" stroke-width="5"/>`;
    s += `<circle cx="${ex}" cy="${ey}" r="${er * 0.6}" fill="${col}"/><circle cx="${ex + d}" cy="${ey}" r="${er * 0.6}" fill="${col}"/>`;
    s += `<ellipse cx="${ex + d / 2}" cy="${ey + r * 0.38}" rx="${r * 0.12}" ry="${r * 0.17}" fill="${col}"/>`;
  } else if (face === "cry") {
    s += `<path d="M${ex - er} ${ey}q${er} ${-er} ${2 * er} 0M${ex + d - er} ${ey}q${er} ${-er} ${2 * er} 0" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${ex + d * 0.1} ${ey + r * 0.42}q${d * 0.4} ${-r * 0.18} ${d * 0.8} 0" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${ex} ${ey + er * 1.4}q-${er * 0.8} ${er * 2} 0 ${er * 2.6}q${er * 0.8} -${er * 0.6} 0 -${er * 2.6}Z" fill="#6fd0ff"/>`;
  } else {
    s += `<circle cx="${ex}" cy="${ey}" r="${er}" fill="${col}"/><circle cx="${ex + d}" cy="${ey}" r="${er}" fill="${col}"/>`;
    s += `<path d="M${ex - d * 0.05} ${ey + r * 0.25}q${d * 0.55} ${r * 0.3} ${d * 1.1} 0" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  }
  if (label) s += T(S, cx - r * 0.12, cy - r * 0.42, label, r * 0.34, { fill: col, stroke: 0, weight: 900 });
  return s + `</g>`;
}

// 收费站：岗亭 ＋ 招牌 ＋ 栏杆
function gate(S, x, y, k, { sign = "", logo = null, boom = 1, mouth = false, signColor } = {}) {
  const w = 150 * k, h = 170 * k;
  const fill = S.key === "chalk" ? "none" : S.key === "meme" ? "#f4f4f4" : "#2b3a63";
  const line = S.key === "chalk" ? S.ink : S.key === "meme" ? "#000" : "none";
  const lw = S.key === "meme" ? 7 : 5;
  const f = S.key === "chalk" ? `filter="url(#chalk)"` : "";
  let s = `<g ${f}>`;
  s += `<rect x="${x - w / 2}" y="${y - h}" width="${w}" height="${h}" rx="${10 * k}" fill="${fill}" stroke="${line}" stroke-width="${lw}"/>`;
  s += `<path d="M${x - w * 0.66} ${y - h}L${x} ${y - h - 62 * k}L${x + w * 0.66} ${y - h}Z" fill="${S.key === "chalk" ? "none" : S.red}" stroke="${line}" stroke-width="${lw}" stroke-linejoin="round"/>`;
  s += `<rect x="${x - w * 0.32}" y="${y - h * 0.78}" width="${w * 0.64}" height="${h * 0.36}" rx="${6 * k}" fill="${S.key === "chalk" ? "none" : S.key === "meme" ? "#bfe3ff" : "#3d8bff"}" stroke="${line}" stroke-width="${lw * 0.7}"/>`;
  if (mouth) { // 岗亭窗口变成一张嘴
    s += `<path d="M${x - w * 0.3} ${y - h * 0.6}q${w * 0.3} ${h * 0.3} ${w * 0.6} 0" fill="#000" stroke="${line}" stroke-width="${lw * 0.6}"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${x - w * 0.24 + i * w * 0.16} ${y - h * 0.6}l${w * 0.05} ${h * 0.07}l${w * 0.05} ${-h * 0.07}Z" fill="#fff"/>`;
  }
  // 栏杆：红白相间
  const bl = 230 * k * boom;
  for (let i = 0; i < 5; i++) s += `<rect x="${x - w / 2 - bl + (i * bl) / 5}" y="${y - h * 0.32}" width="${bl / 5}" height="${18 * k}" fill="${i % 2 ? (S.key === "chalk" ? "none" : "#fff") : S.red}" stroke="${line}" stroke-width="${lw * 0.5}"/>`;
  // 招牌
  if (logo || sign) {
    const sw = Math.max(160, sign.length * 44 + (logo ? 90 : 40)) * k, sh = 78 * k, sy = y - h - 62 * k - sh - 14 * k;
    s += `<rect x="${x - sw / 2}" y="${sy}" width="${sw}" height="${sh}" rx="${12 * k}" fill="${S.key === "chalk" ? "none" : signColor ?? (S.key === "meme" ? "#fff" : "#eef2f8")}" stroke="${line}" stroke-width="${lw}"/>`;
    let tx = x;
    if (logo === "apple") {
      const lk = (sh * 0.7) / 1000, lx = x - (sign ? sw / 2 - 26 * k : 814 * lk / 2), ly = sy + sh * 0.14;
      s += `<path d="${APPLE}" transform="translate(${lx} ${ly}) scale(${lk})" fill="${S.key === "chalk" ? S.ink : "#111"}"/>`;
      tx = x + 30 * k;
    }
    if (logo === "android") {
      s += `<image href="素材/android.svg" x="${x - sw / 2 + 16 * k}" y="${sy + 8 * k}" width="${56 * k}" height="${62 * k}"/>`;
      tx = x + 30 * k;
    }
    if (sign) s += T(S, tx, sy + sh * 0.72, sign, 44 * k, { fill: S.key === "chalk" ? S.ink : "#111", stroke: 0 });
  }
  return s + `</g>`;
}

function pipe(S, x1, y, x2, h, color) {
  if (S.key === "chalk")
    return `<g filter="url(#chalk)"><path d="M${x1} ${y - h / 2}H${x2}M${x1} ${y + h / 2}H${x2}" stroke="${S.ink}" stroke-width="6" stroke-dasharray="${S.rough ? "40 10" : ""}"/></g>`;
  const e = S.key === "meme" ? `stroke="#000" stroke-width="8"` : "";
  return `<rect x="${x1}" y="${y - h / 2}" width="${x2 - x1}" height="${h}" rx="${h / 2}" fill="${color ?? S.pipe}" ${e}/>`;
}

// 英雄头像：A 白边贴纸，B 胶带照片，C 圆环
function hero(S, id, cx, cy, r, { rot = 0, ring } = {}) {
  let s = `<g transform="rotate(${rot} ${cx} ${cy})">`;
  if (S.key === "meme") {
    s += `<circle cx="${cx + 6}" cy="${cy + 10}" r="${r + 14}" fill="#000" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="#fff"/>`;
    s += `<image href="素材/face-${id}.png" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/>`;
  } else if (S.key === "chalk") {
    s += `<rect x="${cx - r - 16}" y="${cy - r - 16}" width="${2 * r + 32}" height="${2 * r + 62}" fill="#f3efe4"/>`;
    s += `<clipPath id="sq${id}${cx}"><rect x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/></clipPath>`;
    s += `<image href="素材/skin-${id}.jpg" clip-path="url(#sq${id}${cx})" x="${cx - r * 4.6}" y="${cy - r * 2.2}" width="${r * 9.2}" height="${r * 4.23}" preserveAspectRatio="none" style="display:none"/>`;
    s += `<image href="素材/face-${id}.png" x="${cx - r * 1.2}" y="${cy - r * 1.2}" width="${2.4 * r}" height="${2.4 * r}" clip-path="url(#sq${id}${cx})"/>`;
    s += `<rect x="${cx - 46}" y="${cy - r - 34}" width="92" height="34" fill="#e8dca0" opacity=".85" transform="rotate(-8 ${cx} ${cy - r - 17})"/>`;
  } else {
    s += `<circle cx="${cx}" cy="${cy}" r="${r + 9}" fill="${ring ?? S.yel}"/>`;
    s += `<image href="素材/face-${id}.png" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/>`;
  }
  return s + `</g>`;
}

function bubble(S, x, y, w, h, text, { tail = "bl", size = 44, rot = 0 } = {}) {
  const fill = S.key === "chalk" ? "none" : "#fff", line = S.key === "chalk" ? S.ink : S.key === "meme" ? "#000" : "none";
  const tx = tail === "bl" ? x + w * 0.22 : x + w * 0.78, td = tail === "bl" ? -40 : 40;
  const f = S.key === "chalk" ? `filter="url(#chalk)"` : "";
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" ${f}><path d="M${x + 24} ${y}H${x + w - 24}Q${x + w} ${y} ${x + w} ${y + 24}V${y + h - 24}Q${x + w} ${y + h} ${x + w - 24} ${y + h}H${tx + 26}L${tx + td} ${y + h + 46}L${tx - 14} ${y + h}H${x + 24}Q${x} ${y + h} ${x} ${y + h - 24}V${y + 24}Q${x} ${y} ${x + 24} ${y}Z" fill="${fill}" stroke="${line}" stroke-width="${S.key === "meme" ? 7 : 5}" stroke-linejoin="round"/>`
    + T(S, x + w / 2, y + h / 2 + size * 0.36, text, size, { fill: S.key === "chalk" ? S.ink : "#111", stroke: 0 }) + `</g>`;
}

function ledger(S, x, y, rows, title) {
  const w = 470, h = 92 + rows.length * 66;
  const fill = S.key === "chalk" ? "none" : S.key === "meme" ? "#fff8d6" : "#eef2f8";
  const line = S.key === "chalk" ? S.ink : S.key === "meme" ? "#000" : "none";
  const ink = S.key === "chalk" ? S.ink : "#111";
  const f = S.key === "chalk" ? `filter="url(#chalk)"` : "";
  let s = `<g ${f}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${fill}" stroke="${line}" stroke-width="${S.key === "meme" ? 7 : 4}" transform="rotate(${S.key === "meme" ? 2 : 0} ${x + w / 2} ${y + h / 2})"/>`;
  s += T(S, x + 30, y + 58, title, 38, { fill: ink, anchor: "start", stroke: 0 });
  rows.forEach(([k, v, c], i) => {
    s += T(S, x + 30, y + 124 + i * 66, k, 38, { fill: ink, anchor: "start", stroke: 0, weight: 600 });
    s += T(S, x + w - 30, y + 124 + i * 66, v, 46, { fill: c ?? ink, anchor: "end", stroke: 0, weight: 900 });
  });
  return s + `</g>`;
}

function backdrop(S) {
  let s = `<rect width="1920" height="1080" fill="url(#bgg)"/>`;
  if (S.key === "meme") { // 放射线：漫画式背景，粗条，不做密集网点
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2, b = a + Math.PI / 48;
      s += `<path d="M960 470L${960 + 2400 * Math.cos(a)} ${470 + 2400 * Math.sin(a)}L${960 + 2400 * Math.cos(b)} ${470 + 2400 * Math.sin(b)}Z" fill="#ffffff" opacity=".045"/>`;
    }
  }
  if (S.key === "chalk") { // 黑板上没擦干净的痕迹
    s += `<g opacity=".07" filter="url(#chalk)"><path d="M120 210q300 -60 620 10M1180 160q280 40 560 -20M240 700q500 40 1400 -10" stroke="#fff" stroke-width="60" fill="none" stroke-linecap="round"/></g>`;
    s += `<rect x="18" y="18" width="1884" height="1044" rx="10" fill="none" stroke="#6b4a2e" stroke-width="22"/>`;
  }
  if (S.key === "flat") {
    s += `<circle cx="1700" cy="160" r="300" fill="#16224a" opacity=".7"/><circle cx="180" cy="900" r="260" fill="#16224a" opacity=".55"/>`;
  }
  return s;
}

const defs = `<filter id="chalk" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="3" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.4 1.15" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>`;

// ---------- 拍一：两条收费管道 ----------
function framePipes(S) {
  const yI = 300, yA = 590;
  let a = backdrop(S);
  // 起点：一块钱
  a += coin(S, 210, 450, 118, { face: "happy", rot: S.key === "meme" ? -8 : 0 });
  a += T(S, 210, 640, "你的一块钱", 40, { weight: 700 });
  // 两条路
  a += pipe(S, 340, yI, 1480, 96);
  a += pipe(S, 340, yA, 1480, 96);
  a += T(S, 380, yI - 72, "苹果这条路", 40, { anchor: "start", fill: S.text });
  a += T(S, 380, yA + 108, "安卓这条路", 40, { anchor: "start", fill: S.text });
  // iOS：一座大收费站，嘴咬一口
  a += gate(S, 840, yI + 50, 1.0, { logo: "apple", sign: "25%", mouth: S.key === "meme" });
  // 安卓：一排商店的收费站（并排的几条岔路）
  const names = ["华为", "小米", "OPPO", "vivo"];
  names.forEach((n, i) => (a += gate(S, 620 + i * 160, yA + 46, 0.58, { sign: n, boom: 0.6 })));
  a += S.key === "chalk"
    ? T(S, 950, yA + 108, "联运：五五分（行业惯例）", 40, { fill: S.yel })
    : T(S, 950, yA + 108, "联运：五五分（行业惯例）", 40, { fill: S.yel });
  // 过站以后剩下的钱
  a += coin(S, 1250, yI - 4, 84, { missing: 0.25, face: "shock", label: "" });
  a += coin(S, 1340, yA - 4, 84, { missing: 0.5, face: "cry", label: "" });
  // 终点：腾讯
  const vf = S.key === "chalk" ? "none" : S.key === "meme" ? "#ffffff" : "#3d8bff";
  const vl = S.key === "chalk" ? S.ink : S.key === "meme" ? "#000" : "none";
  a += `<g ${S.key === "chalk" ? `filter="url(#chalk)"` : ""}><rect x="1510" y="330" width="240" height="330" rx="26" fill="${vf}" stroke="${vl}" stroke-width="7"/>`
    + `</g>`;
  a += T(S, 1630, 550, "¥", 170, { fill: S.key === "flat" ? "#eef2f8" : S.key === "chalk" ? S.yel : "#111", stroke: 0, weight: 900 });
  a += T(S, 1630, 720, "腾讯", 48);
  // 账单（贯穿装置）
  a += ledger(S, 1395, 80, [["苹果路", "¥0.75", S.key === "chalk" ? S.yel : "#d4380d"], ["商店联运", "¥0.5 不到", S.key === "chalk" ? S.red : "#d4380d"]], "这一块钱 · 到手");
  // 英雄反应
  if (S.key === "meme") {
    a += hero(S, 112, 1040, 170, 74, { rot: -10 });
    a += bubble(S, 1104, 92, 230, 96, "就这？", { tail: "bl", size: 50, rot: 4 });
    a += T(S, 980, 390, "咔嚓！", 96, { fill: S.yel, rot: -14, stroke: 12 });
  } else if (S.key === "chalk") {
    a += hero(S, 112, 1050, 160, 62, { rot: -6 });
    a += `<g filter="url(#chalk)"><path d="M1110 210q60 40 100 50" stroke="${S.ink}" stroke-width="5" fill="none"/></g>`;
    a += T(S, 1240, 238, "就这？", 44, { anchor: "start" });
    a += `<g filter="url(#chalk)"><path d="M1170 ${yI + 70}q40 30 120 10" stroke="${S.red}" stroke-width="6" fill="none"/></g>`;
    a += T(S, 1170, yI + 140, "-25%", 46, { anchor: "start", fill: S.red });
    a += T(S, 1262, yA + 140, "-50%", 46, { anchor: "start", fill: S.red });
  } else {
    a += hero(S, 112, 1050, 165, 60, { ring: S.yel });
    a += bubble(S, 1124, 92, 210, 90, "就这？", { tail: "bl", size: 46 });
    a += T(S, 1250, yI + 140, "−25%", 46, { fill: S.red });
    a += T(S, 1340, yA + 140, "−50%", 46, { fill: S.red });
  }
  return {
    svg: a,
    mode: "③ 钱走哪条路",
    note: "示意｜苹果国区标准抽成 25%（2026 年 3 月起）· 联运五五是行业惯例，不是王者的合同",
    caption: "同一件皮肤，腾讯从两边收到的钱不一样多。",
  };
}

// ---------- 拍二：一合区，分钱的地图就得重画 ----------
function frameRemap(S) {
  let a = backdrop(S);
  const bl = S.key === "chalk" ? S.ink : S.key === "meme" ? "#000" : "none";
  const bf = S.key === "chalk" ? "none" : S.key === "meme" ? "#c9563c" : "#2b3a63";
  const ch = S.key === "chalk" ? `filter="url(#chalk)"` : "";
  // 中间一堵整墙，正中被砸开一个洞
  let wall = `<g ${ch}>`;
  for (let r = 0; r < 15; r++) for (let c = -1; c < 3; c++) {
    const x0 = 880 + c * 64 + (r % 2 ? 32 : 0), y = 150 + r * 40;
    const x = Math.max(880, x0), w = Math.min(x0 + 64, 1040) - x;
    if (w <= 4) continue;
    const dx = (x + w / 2 - 960) / 120, dy = (y + 20 - 450) / 150;
    if (dx * dx + dy * dy < 1) continue;
    wall += `<rect x="${x}" y="${y}" width="${w}" height="40" fill="${bf}" stroke="${bl}" stroke-width="${S.key === "flat" ? 0 : 4}"/>`;
  }
  wall += `</g>`;
  a += wall;
  [[1090, 360, 20], [800, 560, -25], [1110, 600, 35]].forEach(([x, y, r]) => (a += `<rect x="${x}" y="${y}" width="64" height="40" fill="${bf}" stroke="${bl}" stroke-width="4" transform="rotate(${r} ${x + 32} ${y + 20})" ${ch}/>`));
  a += T(S, 300, 150, "安卓区", 56);
  a += T(S, 1640, 150, "苹果区", 56);
  // 钱改道：两条虚线穿过洞，各自奔向对面的收费站
  const route = S.key === "chalk" ? S.yel : S.yel;
  a += `<g ${ch} fill="none" stroke="${route}" stroke-width="8" stroke-dasharray="26 18" stroke-linecap="round">`
    + `<path d="M700 470Q960 360 1560 500"/><path d="M1240 470Q960 560 380 500"/></g>`;
  a += `<g ${ch} fill="${route}"><path d="M1560 500l-40 -30l6 44Z"/><path d="M380 500l40 -26l-2 44Z"/></g>`;
  // 两边的收费站同时围上来
  a += gate(S, 300, 720, 0.8, { logo: "android", sign: "商店", boom: 0.5 });
  a += gate(S, 1640, 720, 0.85, { logo: "apple", sign: "", boom: 0.5, mouth: S.key === "meme" });
  a += bubble(S, 90, 200, 400, 96, "那我的五成呢？", { tail: "bl", size: 42, rot: S.key === "meme" ? -4 : 0 });
  a += bubble(S, 1430, 200, 400, 96, "这笔钱算谁的？", { tail: "br", size: 42, rot: S.key === "meme" ? 4 : 0 });
  // 硬币从洞两边乱窜
  a += coin(S, 660, 470, 70, { face: "shock", label: "", rot: -14 });
  a += coin(S, 1300, 480, 70, { face: "shock", label: "", rot: 14 });
  // 点券卡在洞里，带不过去
  const tf = S.key === "chalk" ? "none" : S.yel;
  a += `<g ${ch}><rect x="866" y="400" width="188" height="96" rx="14" fill="${tf}" stroke="${bl === "none" ? "#000" : bl}" stroke-width="6" transform="rotate(-6 960 448)"/></g>`;
  a += T(S, 960, 466, "点券", 52, { fill: S.key === "chalk" ? S.yel : "#111", stroke: 0, rot: -6 });
  a += T(S, 960, 566, "过不去！", 46, { fill: S.red, rot: -6 });
  // 动手拆墙的英雄
  if (S.key === "meme") {
    a += hero(S, 144, 1150, 250, 80, { rot: 12 });
    a += T(S, 1230, 400, "哐！", 104, { fill: S.yel, rot: 14, stroke: 12 });
    a += hero(S, 167, 620, 660, 62, { rot: -10 });
    a += hero(S, 131, 1300, 660, 62, { rot: 8 });
  } else if (S.key === "chalk") {
    a += hero(S, 144, 1160, 250, 62, { rot: 6 });
    a += `<g filter="url(#chalk)"><path d="M1080 330l-36 30M1090 360l-46 8" stroke="${S.yel}" stroke-width="6"/></g>`;
  } else {
    a += hero(S, 144, 1160, 250, 62, { ring: S.red });
  }
  return {
    svg: a,
    mode: "④ 为什么合不了",
    note: "行业分析｜钱一改道，苹果、各家商店和腾讯谁多谁少都会变 · 2020 年转区规则：点券无法跨系统转移",
    caption: "技术上，一扇门就够了；要重画的，是一张分钱的地图。",
  };
}

const html = (S, f) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>样张 ${S.name}</title><style>${css(S)}</style></head><body><div class="frame">
<svg class="art" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>${S.bg}${defs}<clipPath id="none"><rect width="0" height="0"/></clipPath></defs>${f.svg}</svg>
<div class="mode">${f.mode}</div><div class="note">${f.note}</div><div class="caption">${f.caption}</div></div></body></html>`;

const which = process.argv.slice(2).length ? process.argv.slice(2) : ["a", "b", "c"];
const browser = await puppeteer.launch({ executablePath, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
for (const k of which) {
  const S = STYLES[k];
  for (const [tag, fn] of [["pipes", framePipes], ["remap", frameRemap]]) {
    const name = `样张-${k}-${S.key}-${tag}`;
    writeFileSync(join(here, `${name}.html`), html(S, fn(S)));
    await page.goto(pathToFileURL(join(here, `${name}.html`)).href, { waitUntil: "networkidle0" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(here, `${name}.png`) });
    console.log("ok", name);
  }
}
await browser.close();
