// 第二十一期 P3：三个视觉方向，每个方向输出主视觉和引文卡（1920×1080 PNG）。
// 从项目仓库根目录运行：node 第二十一期/02-风格样张/tools/gen-frames.mjs [a b c]
// 样张是静态视觉提案，不是 P5 成片工程。字体放在 ../fonts/（不入库）。
// 主视觉三方向画同一拍：① 签收那一刻——「想要」的光在派送中最亮，拆开后飘向下一件（档案 F-2，类比）。
// 引文卡三方向画同一段：《美国士兵》图 IX，宪兵 24% vs 航空兵 47% 当上军士，航空兵却更不看好升职（档案 F-12–F-14）。
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

const AMBER = "#ffb347";
const Q_ZH = "有能力的兵，<br>在军队里升得上去吗？";
const Q_EN = "“Do you think a soldier with ability has a good chance for promotion in the Army?”";

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
.abs{position:absolute}
.mode{position:absolute;left:76px;top:47px;font-size:24px;font-weight:600;letter-spacing:.14em;opacity:.85}
.tag{position:absolute;left:50%;top:37px;transform:translateX(-50%);height:48px;line-height:44px;padding:0 28px;border-radius:25px;font-size:23px;letter-spacing:.12em;border:1px solid;white-space:nowrap}
.mark{position:absolute;right:80px;top:48px;font-size:25px;letter-spacing:.10em;opacity:.85}
.note{position:absolute;top:782px;left:110px;width:1700px;text-align:center;font-size:30px;font-weight:500;line-height:1.3;white-space:nowrap}
.caption{position:absolute;top:918px;left:110px;width:1700px;text-align:center;font-size:46px;line-height:1.35;font-weight:800;letter-spacing:.035em;white-space:nowrap;text-shadow:0 2px 12px #000c}
.cap-en{display:block;font-size:26px;font-weight:400;font-style:italic;letter-spacing:.02em;opacity:.72;margin-top:4px}
`;

// 软光滤镜：区域写死在画布坐标，避免零高度包围盒塌陷（AGENTS 4.2）
const defsCommon = `
<filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="18"/></filter>
<filter id="soft2" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="42"/></filter>
<filter id="rough" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
<radialGradient id="orbCore"><stop offset="0" stop-color="#fffbe9"/><stop offset=".35" stop-color="#ffd890"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>
<radialGradient id="orbHalo"><stop offset="0" stop-color="${AMBER}" stop-opacity=".55"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>`;

// 「想要」的光：同一团琥珀色光，三个方向通用
function orb(cx, cy, r) {
  return `<circle cx="${cx}" cy="${cy}" r="${r * 4.2}" fill="url(#orbHalo)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 1.6}" fill="url(#orbCore)"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="#fffdf4"/>`;
}
// 从 (x0,y0) 到 (x1,y1) 的一串渐隐光点（光飘走留下的轨迹）
function trail(x0, y0, cx, cy, x1, y1, n, color, rMax) {
  let s = "";
  for (let i = 1; i < n; i++) {
    const t = i / n, u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rMax * (0.35 + 0.65 * t)).toFixed(1)}" fill="${color}" opacity="${(0.12 + 0.6 * t).toFixed(2)}"/>`;
  }
  return s;
}
// 物流四节点上的「想要」曲线：从下单慢慢升，派送中冲顶并一直撑到签收前，签收那一下落回贴地（只是示意强度，不是数据）
function wantPath(xs, base, peak) {
  const [a, b, c, d] = xs, h = base - peak;
  return `M${a - 40} ${base} C${a + 120} ${base - h * 0.05} ${b - 120} ${base - h * 0.28} ${b} ${base - h * 0.36}` +
    ` C${b + 170} ${base - h * 0.46} ${c - 150} ${peak} ${c} ${peak}` +
    ` C${c + 140} ${peak} ${d - 170} ${base - h * 0.98} ${d - 60} ${base - h * 0.9}` +
    ` C${d - 25} ${base - h * 0.82} ${d - 15} ${base - h * 0.15} ${d + 40} ${base - h * 0.07}` +
    ` C${d + 80} ${base - h * 0.05} ${d + 120} ${base - h * 0.05} ${d + 170} ${base - h * 0.05}`;
}

// ══════════ A · 夜里的房间 ══════════
const A = {
  id: "a", slug: "room", name: "夜里的房间",
  css: `
.frame{color:#f4eee4;background:radial-gradient(ellipse at 70% 18%,#1d2236 0%,#10141f 42%,#07090f 100%)}
.mode,.mark{color:#c9b291}.tag{color:#ffd9a0;border-color:#8c6a3c;background:#140f0ad9}
.note{color:#d8c8ae}.caption{color:#fffaf2}
.ph{position:absolute;left:300px;top:196px;width:300px;height:510px;border-radius:40px;background:#0b0f16;border:2px solid #2e3a4c;box-shadow:0 40px 90px #000d, 0 0 0 8px #151b26;transform:rotate(-6deg);padding:22px 18px}
.ph .scr{width:100%;height:100%;border-radius:28px;background:linear-gradient(180deg,#121a28,#0d131e);padding:34px 26px;position:relative;overflow:hidden}
.ph .hd{font-size:25px;font-weight:700;color:#e7edf5;letter-spacing:.06em}
.ph .row{position:absolute;left:66px;font-size:25px;line-height:1.3}
.ph .row small{display:block;font-size:17px;opacity:.7;font-weight:400;margin-top:4px}
.ph .dot{position:absolute;left:-36px;top:9px;width:14px;height:14px;border-radius:50%}
.ph .vline{position:absolute;left:36px;top:112px;width:2px;height:290px;background:#2c3a4e}
.paper{position:absolute;left:210px;top:196px;width:780px;height:530px;background:linear-gradient(170deg,#efe5cf,#d8c7a2);color:#2c2417;transform:rotate(-2.2deg);box-shadow:0 40px 90px #000c;padding:52px 60px}
.paper:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 11px,#5a43200d 12px 13px);pointer-events:none}
.paper .k{font-size:23px;letter-spacing:.2em;color:#6b5634;font-weight:700}
.paper .q{margin-top:28px;font-size:56px;line-height:1.38;font-weight:900}
.paper .en{margin-top:22px;font-size:22px;line-height:1.5;font-style:italic;color:#5b4a30}
.paper .ft{position:absolute;left:60px;bottom:40px;font-size:21px;color:#6b5634;letter-spacing:.08em}
.paper .sm{position:absolute;right:30px;bottom:38px;font-size:19px;color:#8a7350;letter-spacing:.1em}
.num{position:absolute;left:1130px;width:640px}
.num .who{font-size:34px;font-weight:700;color:#e6d8c1;letter-spacing:.1em}
.num .v{font-size:150px;font-weight:900;line-height:1;letter-spacing:-.02em}
.num .v small{font-size:60px;font-weight:800;margin-left:6px}
.num .who span{font-size:28px;font-weight:500;color:#cdbb9c;margin-left:14px;letter-spacing:.04em}
.chip{position:absolute;padding:10px 24px;border-radius:30px;font-size:30px;font-weight:700;white-space:nowrap}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}
<linearGradient id="desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1d26"/><stop offset="1" stop-color="#0a0b10"/></linearGradient>
<radialGradient id="pool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".30"/><stop offset=".6" stop-color="#ffb347" stop-opacity=".08"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
<linearGradient id="kraftF" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c69255"/><stop offset="1" stop-color="#8e6232"/></linearGradient>
<linearGradient id="kraftS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7e552a"/><stop offset="1" stop-color="#5c3c1c"/></linearGradient>
</defs>`;
    // 墙上的台灯光、窗框的冷光、桌面
    s += `<ellipse cx="1520" cy="90" rx="760" ry="520" fill="#ffb347" opacity=".07" filter="url(#soft2)"/>`;
    if (kind === "main") {
      s += `<rect x="1460" y="120" width="300" height="380" rx="4" fill="none" stroke="#2a3550" stroke-width="3" opacity=".7"/><line x1="1610" y1="120" x2="1610" y2="500" stroke="#2a3550" stroke-width="3" opacity=".7"/><line x1="1460" y1="310" x2="1760" y2="310" stroke="#2a3550" stroke-width="3" opacity=".7"/>`;
      s += `<rect x="1462" y="122" width="296" height="376" fill="#3a5a8a" opacity=".07"/>`;
    }
    s += `<path d="M0 690 L1920 660 L1920 1080 L0 1080 Z" fill="url(#desk)"/>`;
    s += `<line x1="0" y1="690" x2="1920" y2="660" stroke="#3b3a3a" stroke-width="2" opacity=".8"/>`;
    s += `<ellipse cx="${kind === "main" ? 1080 : 640}" cy="720" rx="760" ry="170" fill="url(#pool)"/>`;
    if (kind === "main") {
      // 拆开的纸箱：前面、侧面、黑洞洞的箱口、四片翻开的盖
      s += `<ellipse cx="1090" cy="730" rx="250" ry="26" fill="#000" opacity=".55" filter="url(#soft)"/>`;
      s += `<polygon points="1000,500 1300,500 1240,540 940,540" fill="#120b05"/>`;
      s += `<polygon points="940,540 1240,540 1250,722 930,722" fill="url(#kraftF)"/>`;
      s += `<polygon points="1240,540 1300,500 1306,676 1250,722" fill="url(#kraftS)"/>`;
      s += `<polygon points="940,540 1000,500 905,452 842,494" fill="#b07d44"/>`;
      s += `<polygon points="1000,500 1300,500 1318,418 1018,418" fill="#9b6c38"/>`;
      s += `<polygon points="1240,540 1300,500 1388,548 1330,592" fill="#a87640"/>`;
      s += `<polygon points="940,540 1240,540 1220,600 924,600" fill="#c99a60" opacity=".55"/>`;
      s += `<rect x="1078" y="540" width="26" height="182" fill="#d9c08f" opacity=".42"/>`;
      s += `<polygon points="1018,418 1318,418 1312,444 1024,444" fill="#d9c08f" opacity=".28"/>`;
      // 光离开箱子，飘向窗边那件「下一件」
      s += trail(1150, 500, 1250, 300, 1452, 300, 14, AMBER, 9);
      s += orb(1452, 300, 30);
      s += `<g opacity=".5"><polygon points="1640,236 1716,236 1700,252 1624,252" fill="none" stroke="${AMBER}" stroke-width="2.5"/><rect x="1624" y="252" width="76" height="58" fill="none" stroke="${AMBER}" stroke-width="2.5"/><polygon points="1700,252 1716,236 1716,292 1700,310" fill="none" stroke="${AMBER}" stroke-width="2.5"/></g>`;
      s += `<circle cx="1670" cy="272" r="80" fill="${AMBER}" opacity=".10" filter="url(#soft)"/>`;
    }
    return s + `</svg>`;
  },
  main: `<div class="ph"><div class="scr"><div class="hd">物流详情</div><div class="vline"></div>` +
    `<div class="row" style="top:108px;color:#8e98a6"><span class="dot" style="background:#4a5566"></span>已签收<small>刚刚</small></div>` +
    `<div class="row" style="top:192px;color:#ffcf8a;font-weight:700"><span class="dot" style="background:${AMBER};box-shadow:0 0 18px ${AMBER}"></span>派送中<small>已刷新 8 次</small></div>` +
    `<div class="row" style="top:276px;color:#c4ccd6"><span class="dot" style="background:#8995a5"></span>已发货<small>昨天</small></div>` +
    `<div class="row" style="top:360px;color:#c4ccd6"><span class="dot" style="background:#8995a5"></span>已下单<small>三天前</small></div>` +
    `</div></div>` +
    `<div class="abs" style="left:1600px;top:330px;font-size:24px;color:#d9bf94;letter-spacing:.08em">下一件</div>`,
  quote: `<div class="paper serif"><div class="k">美国陆军士兵调查 · 1944</div><div class="q">${Q_ZH}</div><div class="en">${Q_EN}</div>` +
    `<div class="ft">入伍 1–2 年 · 美国本土白人士兵</div><div class="sm">图为示意</div></div>` +
    `<div class="num" style="top:206px"><div class="who">宪兵<span>当上了军士</span></div><div class="v" style="color:#e8dcc8">24<small>%</small></div></div>` +
    `<div class="num" style="top:436px"><div class="who">航空兵<span>当上了军士</span></div><div class="v" style="color:#ffcf8a;text-shadow:0 0 40px #ffb34766">47<small>%</small></div></div>` +
    `<div class="chip" style="left:1420px;top:540px;color:#1b1206;background:#ffb347">却更不看好升职</div>`,
};

// ══════════ B · 物流界面 ══════════
const XS = [300, 720, 1140, 1560];
const B = {
  id: "b", slug: "track", name: "物流界面",
  css: `
.frame{color:#e9f4f6;background:radial-gradient(ellipse at 55% 45%,#0f1d26 0%,#081117 50%,#04070a 100%)}
.mode,.mark{color:#7fb8c2}.tag{color:#9eeaf2;border-color:#2f7380;background:#061218e0}
.note{color:#a9cdd3}.caption{color:#ffffff}
.lb{position:absolute;width:240px;margin-left:-120px;text-align:center;font-size:32px;font-weight:700;letter-spacing:.06em}
.lb small{display:block;font-family:CascadiaMono,monospace;font-size:20px;font-weight:400;opacity:.65;margin-top:8px;letter-spacing:.02em}
.chipB{position:absolute;padding:8px 20px;border-radius:8px;font-size:24px;border:1px solid;white-space:nowrap}
.panel{position:absolute;left:150px;top:190px;width:820px;height:540px;border:1px solid #2f7380;border-radius:14px;background:#06121ae6;box-shadow:0 0 0 1px #0b2630,0 40px 90px #000c;padding:46px 56px}
.panel .k{font-size:22px;letter-spacing:.16em;color:#62c4d2}
.panel .q{margin-top:30px;font-size:56px;line-height:1.38;font-weight:900;color:#ffffff}
.panel .en{margin-top:22px;font-size:22px;line-height:1.5;font-style:italic;color:#8fb6bd}
.panel .ft{position:absolute;left:56px;bottom:36px;font-size:21px;color:#7fb8c2}
.bar{position:absolute;left:1080px;width:700px}
.bar .who{font-size:32px;font-weight:700;color:#cfe6ea;letter-spacing:.08em}
.bar .tr{margin-top:16px;height:30px;border-radius:15px;background:#10242c;border:1px solid #1f4550;overflow:hidden}
.bar .fl{height:100%;border-radius:15px}
.bar .v{position:absolute;right:0;top:-18px;font-size:84px;font-weight:900;font-family:CascadiaMono,NotoSC,monospace;letter-spacing:-.03em}
.bar .d{margin-top:12px;font-size:24px;color:#8fb6bd}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}
<pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#5fd4e6" fill-opacity=".10"/></pattern>
<linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AMBER}" stop-opacity=".42"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></linearGradient>
</defs><rect width="1920" height="1080" fill="url(#dots)"/>`;
    // HUD 四角
    for (const [x, y, dx, dy] of [[120, 150, 1, 1], [1800, 150, -1, 1], [120, 740, 1, -1], [1800, 740, -1, -1]])
      s += `<path d="M${x} ${y + dy * 40} L${x} ${y} L${x + dx * 40} ${y}" fill="none" stroke="#2f7380" stroke-width="2"/>`;
    if (kind === "main") {
      const base = 600, peak = 268;
      const d = wantPath(XS, base, peak);
      s += `<path d="${d} L${XS[3] + 170} ${base} L${XS[0] - 40} ${base} Z" fill="url(#area)"/>`;
      s += `<path d="${d}" fill="none" stroke="${AMBER}" stroke-width="5" stroke-linecap="round"/>`;
      s += `<path d="${d}" fill="none" stroke="${AMBER}" stroke-width="16" opacity=".25" filter="url(#soft)"/>`;
      // 轨道：走过的青色、没走的灰
      s += `<line x1="${XS[0] - 60}" y1="${base}" x2="${XS[3] + 170}" y2="${base}" stroke="#1f4550" stroke-width="4"/>`;
      s += `<line x1="${XS[0] - 60}" y1="${base}" x2="${XS[3]}" y2="${base}" stroke="#5fd4e6" stroke-width="4"/>`;
      XS.forEach((x, i) => {
        if (i < 2) s += `<circle cx="${x}" cy="${base}" r="14" fill="#5fd4e6"/>`;
        if (i === 2) s += `<circle cx="${x}" cy="${base}" r="30" fill="${AMBER}" opacity=".25" filter="url(#soft)"/><circle cx="${x}" cy="${base}" r="16" fill="#06121a" stroke="${AMBER}" stroke-width="5"/>`;
        if (i === 3) s += `<circle cx="${x}" cy="${base}" r="18" fill="#06121a" stroke="#6d8a90" stroke-width="4"/><path d="M${x - 8} ${base} l6 6 l11 -12" fill="none" stroke="#9fb8bd" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
      });
      // 峰值竖线与脉冲环
      s += `<line x1="${XS[2]}" y1="${peak + 18}" x2="${XS[2]}" y2="${base - 18}" stroke="${AMBER}" stroke-width="2" stroke-dasharray="4 8" opacity=".6"/>`;
      s += `<circle cx="${XS[2]}" cy="${peak}" r="22" fill="none" stroke="#fff3dc" stroke-width="2.5" opacity=".8"/>`;
      // 签收后，光离开曲线飘向画外
      s += trail(XS[3] - 50, peak + 30, 1600, 150, 1716, 214, 12, AMBER, 8);
      s += orb(1716, 214, 26);
    } else {
      s += `<line x1="1080" y1="740" x2="1780" y2="740" stroke="#1f4550" stroke-width="2"/>`;
    }
    return s + `</svg>`;
  },
  main:
    `<div class="lb" style="left:${XS[0]}px;top:636px;color:#bfe3e8">已下单<small>10-21 09:12</small></div>` +
    `<div class="lb" style="left:${XS[1]}px;top:636px;color:#bfe3e8">已发货<small>10-22 18:40</small></div>` +
    `<div class="lb" style="left:${XS[2]}px;top:636px;color:#ffcf8a">派送中<small>10-24 08:05</small></div>` +
    `<div class="lb" style="left:${XS[3]}px;top:636px;color:#8fa6ab">已签收<small>10-24 11:30</small></div>` +
    `<div class="chipB mono" style="left:1070px;top:176px;color:#ffcf8a;border-color:#8c6a3c;background:#1a1206cc">已刷新 ×8</div>` +
    `<div class="abs mono" style="left:180px;top:250px;font-size:22px;color:#62c4d2;letter-spacing:.12em">WANTING ▲</div>`,
  quote: `<div class="panel"><div class="k mono">SURVEY · 1944 · 美国陆军</div><div class="q">${Q_ZH}</div><div class="en">${Q_EN}</div>` +
    `<div class="ft">入伍 1–2 年 · 美国本土白人士兵 · 图为示意</div></div>` +
    `<div class="bar" style="top:250px"><div class="who">宪兵 · 当上军士</div><div class="v" style="color:#cfe6ea">24%</div><div class="tr"><div class="fl" style="width:24%;background:#6d8a90"></div></div></div>` +
    `<div class="bar" style="top:440px"><div class="who">航空兵 · 当上军士</div><div class="v" style="color:#5fd4e6">47%</div><div class="tr"><div class="fl" style="width:47%;background:#5fd4e6;box-shadow:0 0 20px #5fd4e6"></div></div></div>` +
    `<div class="chipB" style="left:1080px;top:600px;font-size:30px;font-weight:700;color:#1b1206;background:${AMBER};border-color:${AMBER}">可航空兵，更不看好升职</div>`,
};

// ══════════ C · 实验记录本 ══════════
const CX = [420, 780, 1140, 1500], CB = 640, CP = 300;
const C = {
  id: "c", slug: "notebook", name: "实验记录本",
  css: `
.frame{color:#f1ede4;background:radial-gradient(ellipse at 50% 45%,#262523 0%,#1a1918 55%,#0f0f0e 100%)}
.mode,.mark{color:#b9b2a3}.tag{color:#ffc58a;border-color:#7a5a36;background:#171512e0}
.note{color:#cfc8ba}.caption{color:#fffaf0}
.hl{position:absolute;font-family:WenKai,NotoSC,sans-serif;white-space:nowrap}
.tk{position:absolute;width:200px;margin-left:-100px;text-align:center;font-family:WenKai,NotoSC,sans-serif;font-size:34px;color:#e9e3d6}
.card{position:absolute;left:190px;top:206px;width:800px;height:520px;background:#f1ead9;color:#26221b;transform:rotate(-1.6deg);box-shadow:0 30px 80px #000b;padding:48px 58px}
.card:before{content:"";position:absolute;left:300px;top:-18px;width:180px;height:40px;background:#e8d9b0cc;transform:rotate(2deg)}
.card .k{font-family:WenKai,NotoSC,sans-serif;font-size:28px;color:#8a5a26}
.card .q{margin-top:22px;font-size:54px;line-height:1.38;font-weight:900}
.card .en{margin-top:20px;font-size:22px;line-height:1.5;font-style:italic;color:#5e5546}
.card .ft{position:absolute;left:58px;bottom:34px;font-size:21px;color:#6e6455}
.big{position:absolute;font-family:WenKai,NotoSC,sans-serif;line-height:1}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${defsCommon}
<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity=".045" stroke-width="1"/></pattern>
<pattern id="grid5" width="200" height="200" patternUnits="userSpaceOnUse"><path d="M200 0 L0 0 0 200" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="1.2"/></pattern>
</defs><rect width="1920" height="1080" fill="url(#grid)"/><rect width="1920" height="1080" fill="url(#grid5)"/>`;
    s += `<line x1="150" y1="0" x2="150" y2="1080" stroke="${AMBER}" stroke-opacity=".22" stroke-width="2"/>`;
    if (kind === "main") {
      const chalk = "#f2eee4";
      s += `<g filter="url(#rough)">`;
      // 坐标轴
      s += `<path d="M300 ${CB} L1700 ${CB} M1680 ${CB - 12} L1702 ${CB} L1680 ${CB + 12}" fill="none" stroke="${chalk}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`;
      s += `<path d="M300 ${CB} L300 230 M288 252 L300 228 L312 252" fill="none" stroke="${chalk}" stroke-width="4" stroke-linecap="round" opacity=".85"/>`;
      CX.forEach((x) => (s += `<line x1="${x}" y1="${CB - 12}" x2="${x}" y2="${CB + 12}" stroke="${chalk}" stroke-width="4" stroke-linecap="round" opacity=".8"/>`));
      // 曲线（粉笔）
      s += `<path d="${wantPath(CX, CB, CP)}" fill="none" stroke="${chalk}" stroke-width="5.5" stroke-linecap="round"/>`;
      // 签收处一个拆开的纸箱速写
      s += `<path d="M1580 566 L1650 566 L1654 600 L1576 600 Z M1580 566 L1562 544 M1650 566 L1670 542 M1580 566 L1598 552 L1666 552 L1650 566" fill="none" stroke="${chalk}" stroke-width="3" stroke-linejoin="round" opacity=".75"/>`;
      // 手写箭头
      s += `<path d="M1280 236 C1240 232 1200 250 1172 282" fill="none" stroke="${AMBER}" stroke-width="3.5" stroke-linecap="round"/><path d="M1168 262 L1170 286 L1192 278" fill="none" stroke="${AMBER}" stroke-width="3.5" stroke-linecap="round"/>`;
      s += `<path d="M1700 500 C1680 512 1660 526 1640 540" fill="none" stroke="${chalk}" stroke-width="3" stroke-linecap="round" opacity=".8"/>`;
      s += `</g>`;
      s += `<circle cx="${CX[2]}" cy="${CP}" r="10" fill="none" stroke="${AMBER}" stroke-width="3"/>`;
      s += trail(CX[3] - 40, CP + 40, 1560, 150, 1690, 210, 11, AMBER, 7);
      s += orb(1690, 210, 24);
    } else {
      s += `<g filter="url(#rough)"><ellipse cx="1250" cy="600" rx="200" ry="104" fill="none" stroke="${AMBER}" stroke-width="5" transform="rotate(-5 1250 600)"/>` +
        `<path d="M1440 560 C1480 530 1500 510 1520 488" fill="none" stroke="${AMBER}" stroke-width="3.5" stroke-linecap="round"/><path d="M1500 488 L1522 486 L1518 508" fill="none" stroke="${AMBER}" stroke-width="3.5" stroke-linecap="round"/></g>`;
    }
    return s + `</svg>`;
  },
  main:
    CX.map((x, i) => `<div class="tk" style="left:${x}px;top:664px">${["下单", "发货", "派送中", "签收"][i]}</div>`).join("") +
    `<div class="hl" style="left:208px;top:236px;font-size:32px;color:#e9e3d6">想要</div>` +
    `<div class="hl" style="left:1712px;top:618px;font-size:32px;color:#e9e3d6">时间</div>` +
    `<div class="hl" style="left:1290px;top:200px;font-size:36px;color:#ffc58a">最惦记的时候</div>` +
    `<div class="hl" style="left:1650px;top:450px;font-size:34px;color:#e9e3d6">拆开：光走了</div>`,
  quote: `<div class="card serif"><div class="k">1944 · 美国陆军士兵调查</div><div class="q">${Q_ZH}</div><div class="en">${Q_EN}</div>` +
    `<div class="ft">入伍 1–2 年 · 美国本土白人士兵 · 图为示意</div></div>` +
    `<div class="big" style="left:1110px;top:220px;font-size:40px;color:#e9e3d6">宪兵当上军士</div>` +
    `<div class="big" style="left:1110px;top:280px;font-size:110px;color:#f2eee4">24%</div>` +
    `<div class="big" style="left:1110px;top:448px;font-size:40px;color:#e9e3d6">航空兵当上军士</div>` +
    `<div class="big" style="left:1110px;top:520px;font-size:150px;color:#ffc58a">47%</div>` +
    `<div class="big" style="left:1500px;top:380px;font-size:42px;line-height:1.35;color:#ffc58a;transform:rotate(-4deg)">可他们<br>更不看好升职？</div>`,
};

const text = {
  main: { tag: "① 冷开场 · 签收那一刻", note: "「想要」Wanting 在拿到之前最强 · 类比示意，不是测量数据",
    caption: `刷了八遍物流，拆开那一刻，它就不亮了。<span class="cap-en">Eight refreshes of tracking — and the moment it's opened, the glow is gone.</span>` },
  quote: { tag: "④ 会变的尺子 · 1944", note: "Stouffer 等《美国士兵》1949 · 图 IX · 入伍 1–2 年白人士兵",
    caption: `升得更快的航空兵，反而更不看好升职。<span class="cap-en">The Air Corps promoted faster — and doubted promotion more.</span>` },
};

function html(th, kind) {
  const t = text[kind];
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>样张 ${th.id.toUpperCase()} · ${th.name}</title><style>${common}${th.css}</style></head><body><div class="frame">${th.art(kind)}${th[kind]}` +
    `<div class="mode">${th.id.toUpperCase()} · ${th.name}</div><div class="tag">${t.tag}</div><div class="mark">风格样张</div>` +
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
