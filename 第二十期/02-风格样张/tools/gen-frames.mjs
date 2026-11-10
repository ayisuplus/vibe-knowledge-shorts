// 第二十期 P3：三个视觉方向，每个方向输出主视觉和引文卡（1920×1080 PNG）。
// 从项目仓库根目录运行：node 第二十期/02-风格样张/tools/gen-frames.mjs
// 样张是静态视觉提案，不是 P5 成片工程。字体放在 ../fonts/（不入库）。
// 主视觉三方向画同一拍：被划掉的 `t += dt` ＋ 地面/卫星两只读数不同的钟（档案 F-6）。
// 引文卡三方向画同一句：牛顿《原理》附注（档案 F-1，据英译自译）。
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

const NEWTON = "绝对的、真实的、数学的时间，<br>自身均匀地流逝，<br>与任何外物无关。";

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
.mode{position:absolute;left:76px;top:47px;font-size:24px;font-weight:600;letter-spacing:.14em;opacity:.8}
.tag{position:absolute;left:50%;top:37px;transform:translateX(-50%);height:48px;line-height:44px;padding:0 28px;border-radius:25px;font-size:23px;letter-spacing:.12em;border:1px solid;white-space:nowrap}
.mark{position:absolute;right:80px;top:48px;font-size:25px;letter-spacing:.10em;opacity:.8}
.note{position:absolute;top:788px;left:110px;width:1700px;text-align:center;font-size:30px;font-weight:500;line-height:1.3}
.caption{position:absolute;top:918px;left:110px;width:1700px;text-align:center;font-size:46px;line-height:1.35;font-weight:800;letter-spacing:.035em}
`;

// ── 钟面：ticks＋时针＋秒针；sec 为秒针角度（度，12 点为 0）──
function dial({ cx, cy, r, face, rim, tick, hand, sec, secColor, rimW = 4, glow, hands = true }) {
  let s = `<g>`;
  if (glow) s += `<circle cx="${cx}" cy="${cy}" r="${r + 26}" fill="${glow}" opacity=".16" filter="url(#soft)"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${face}" stroke="${rim}" stroke-width="${rimW}"/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * Math.PI, major = i % 5 === 0;
    const r1 = r * (major ? 0.8 : 0.88), r2 = r * 0.94;
    s += `<line x1="${(cx + r1 * Math.sin(a)).toFixed(1)}" y1="${(cy - r1 * Math.cos(a)).toFixed(1)}" x2="${(cx + r2 * Math.sin(a)).toFixed(1)}" y2="${(cy - r2 * Math.cos(a)).toFixed(1)}" stroke="${tick}" stroke-width="${major ? 4 : 1.6}" stroke-linecap="round" opacity="${major ? 1 : 0.6}"/>`;
  }
  if (!hands) return s + `</g>`;
  const P = (deg, len) => { const a = (deg * Math.PI) / 180; return [(cx + len * Math.sin(a)).toFixed(1), (cy - len * Math.cos(a)).toFixed(1)]; };
  const [hx, hy] = P(305, r * 0.45), [mx, my] = P(60, r * 0.68), [sx, sy] = P(sec, r * 0.84);
  s += `<line x1="${cx}" y1="${cy}" x2="${hx}" y2="${hy}" stroke="${hand}" stroke-width="${r * 0.06}" stroke-linecap="round"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${mx}" y2="${my}" stroke="${hand}" stroke-width="${r * 0.04}" stroke-linecap="round"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${sx}" y2="${sy}" stroke="${secColor}" stroke-width="3" stroke-linecap="round"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${r * 0.05}" fill="${secColor}"/></g>`;
  return s;
}
const soft = `<filter id="soft" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feGaussianBlur stdDeviation="18"/></filter>`;

// ══════════ A · 编辑器夜色 ══════════
const A = {
  id: "a", slug: "editor", name: "编辑器夜色",
  css: `
.frame{color:#e8f0f2;background:radial-gradient(ellipse at 58% 42%,#13233a 0%,#0b1424 48%,#060a12 100%)}
.mode,.mark{color:#8fb3bf}.tag{color:#7ff0d2;border-color:#3f8f80;background:#0a1a22d9}
.note{color:#9fc2c9}.caption{color:#ffffff}
.ed{position:absolute;left:120px;top:190px;width:800px;height:540px;border-radius:16px;background:#0b111dee;border:1px solid #2a3f55;box-shadow:0 40px 100px #000c}
.ed .bar{height:54px;border-bottom:1px solid #22344a;display:flex;align-items:center;padding:0 24px;gap:12px;color:#6f8ea0;font-size:22px}
.ed .bar i{width:13px;height:13px;border-radius:50%;background:#2d4257;display:block}
.ed .bar span{margin-left:18px;letter-spacing:.04em}
.ed pre{margin:0;padding:26px 0 0 0;font-size:31px;line-height:56px;color:#d7e4ea}
.ed .ln{display:inline-block;width:78px;text-align:right;padding-right:26px;color:#3e566b}
.k{color:#ffb454}.c{color:#5d7d8e}.f{color:#7ff0d2}.n{color:#ff9b73}.s{position:relative}
.s:after{content:"";position:absolute;left:-6px;right:-6px;top:50%;height:4px;background:#ffb454;box-shadow:0 0 14px #ffb454aa}
.dim{opacity:.38}
.tip{position:absolute;left:600px;top:432px;padding:10px 22px;border:1px solid #ffb454;border-radius:30px;background:#1a1408e6;color:#ffcf8a;font-size:26px;box-shadow:0 0 28px #ffb45444}
.ro{position:absolute;font-size:27px;color:#bfe9df;text-align:center;width:360px;line-height:1.5}
.ro b{color:#ffcf8a;font-weight:700}
.qy{position:absolute;left:130px;top:178px;font-size:210px;color:#ffb454;letter-spacing:-.04em;line-height:1;text-shadow:0 0 50px #ffb45455}
.qy-sub{position:absolute;left:142px;top:410px;font-size:28px;color:#6f8ea0;line-height:1.6}
.qp{position:absolute;left:700px;top:178px;width:1090px;height:540px;border-radius:16px;background:#0b111dee;border:1px solid #2a3f55;box-shadow:0 40px 100px #000c;padding:52px 70px}
.qp .cm{font-size:27px;color:#5d7d8e;line-height:1.5}
.qp .qt{margin:26px 0 28px;font-size:58px;line-height:1.5;font-weight:800;color:#ffffff;padding-left:34px;border-left:4px solid #ffb454}
.qp .code{font-size:30px;color:#d7e4ea}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${soft}<pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#7ff0d2" fill-opacity=".13"/></pattern></defs><rect width="1920" height="1080" fill="url(#g)"/>`;
    if (kind === "main") {
      // 两个实例之间的关系线
      s += `<path d="M1205 470 C1330 390 1440 360 1588 352" fill="none" stroke="#7ff0d2" stroke-width="2" stroke-dasharray="6 10" opacity=".6"/>`;
      s += dial({ cx: 1205, cy: 470, r: 150, face: "#0d1a26", rim: "#7ff0d2", tick: "#9fe9d8", hand: "#e8f0f2", sec: 0, secColor: "#7ff0d2", glow: "#7ff0d2" });
      s += dial({ cx: 1600, cy: 350, r: 118, face: "#1a1408", rim: "#ffb454", tick: "#ffcf8a", hand: "#fff3df", sec: 22, secColor: "#ffb454", glow: "#ffb454" });
      // 读数差的弧
      s += `<path d="M1600 252 A98 98 0 0 1 1636.7 259.1" fill="none" stroke="#ffb454" stroke-width="8" stroke-linecap="round"/>`;
    } else {
      s += dial({ cx: 470, cy: 610, r: 120, face: "#0d1a26", rim: "#7ff0d2", tick: "#9fe9d8", hand: "#e8f0f2", sec: 0, secColor: "#7ff0d2", glow: "#7ff0d2" });
    }
    return s + `</svg>`;
  },
  main: `<div class="ed mono"><div class="bar"><i></i><i></i><i></i><span>universe.js</span></div><pre>` +
    `<span class="ln">1</span><span class="c">// 如果宇宙是一段代码</span>\n` +
    `<span class="ln">2</span><span class="s"><span class="k">let</span> t = <span class="n">0</span>;</span>\n` +
    `<span class="ln">3</span><span class="k">while</span> (<span class="k">true</span>) {\n` +
    `<span class="ln">4</span>  <span class="s">t += dt;</span>\n` +
    `<span class="ln">5</span>  <span class="dim">world.<span class="f">update</span>(t);</span>\n` +
    `<span class="ln">6</span>}\n` +
    `<span class="ln">7</span><span class="c">// 每个实例，自带一只钟</span>\n` +
    `<span class="ln">8</span>me.<span class="f">clock</span>  <span class="c">// this.clock</span></pre></div>` +
    `<div class="tip">没有全局 t</div>` +
    `<div class="ro mono" style="left:1025px;top:640px">ground.clock<br>地面</div>` +
    `<div class="ro mono" style="left:1420px;top:490px">sat.clock<br>卫星 <b>+38 μs/天</b></div>`,
  quote: `<div class="qy mono">1687</div><div class="qy-sub mono">// Isaac Newton<br>// Principia</div>` +
    `<div class="qp"><div class="cm mono">/* 牛顿《自然哲学的数学原理》· 附注 */</div>` +
    `<div class="qt serif">${NEWTON}</div>` +
    `<div class="code mono"><span class="k">const</span> t = <span class="f">GLOBAL</span>;  <span class="c">// 全宇宙共用一只钟</span></div></div>`,
};

// ══════════ B · 天文台黄铜 ══════════
const B = {
  id: "b", slug: "brass", name: "天文台黄铜",
  css: `
.frame{color:#eef1f6;background:radial-gradient(ellipse at 50% 44%,#1a2d4d 0%,#0e1a30 50%,#070d1a 100%)}
.mode,.mark{color:#c8b48a}.tag{color:#f0d9a6;border-color:#a8874c;background:#141c2ce0}
.note{color:#c9d2df}.caption{color:#fffaf0}
.plate{position:absolute;left:760px;top:170px;width:400px;height:76px;border-radius:8px;background:linear-gradient(180deg,#e2c588,#a88345);box-shadow:0 10px 30px #0009,inset 0 1px 0 #fff3;color:#3a2a10;font-size:34px;text-align:center;line-height:76px;letter-spacing:.06em}
.plate span{position:relative}.plate span:after{content:"";position:absolute;left:-14px;right:-14px;top:50%;height:6px;margin-top:-3px;background:#b3261a;box-shadow:0 0 0 1px #f3d9a088}
.lb{position:absolute;text-align:center;width:300px;font-size:28px;line-height:1.5;color:#e9dcc0}
.lb b{color:#f6d78f}
.page{position:absolute;left:190px;top:188px;width:560px;height:560px;background:linear-gradient(160deg,#efe4c9,#d9c69c);color:#3a2d1a;transform:rotate(-3deg);box-shadow:0 40px 100px #000b;padding:56px 50px;text-align:center}
.page:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 9px,#5a43200f 10px 11px);pointer-events:none}
.page .t1{font-size:26px;letter-spacing:.14em;line-height:1.7;font-weight:700}
.page .rule{height:2px;background:#8a6a3a;margin:26px 40px}
.page .t2{font-size:22px;letter-spacing:.2em}
.page .yr{font-size:54px;margin-top:70px;letter-spacing:.1em;font-weight:700}
.page .sm{position:absolute;right:26px;bottom:18px;font-size:20px;color:#7a6440;letter-spacing:.1em}
.qf{position:absolute;left:830px;top:206px;width:930px;height:500px;border:3px solid #c9a45c;outline:1px solid #c9a45c66;outline-offset:10px;background:#0e1a30e8;padding:60px 70px;box-shadow:0 40px 100px #000a}
.qf .k{font-size:26px;letter-spacing:.18em;color:#d8bd85}
.qf .qt{margin-top:34px;font-size:56px;line-height:1.5;font-weight:800;color:#fffaf0}
.qf .src{margin-top:30px;font-size:26px;color:#aeb9c8;letter-spacing:.06em}
`,
  art: (kind) => {
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${soft}<radialGradient id="earth" cx=".38" cy=".35"><stop stop-color="#2f5d8c"/><stop offset="1" stop-color="#0d2140"/></radialGradient></defs>`;
    // 星点（固定种子）
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 140; i++) s += `<circle cx="${(rnd() * 1920).toFixed(0)}" cy="${(rnd() * 760).toFixed(0)}" r="${(rnd() * 1.6 + 0.4).toFixed(1)}" fill="#e9eef5" opacity="${(rnd() * 0.5 + 0.15).toFixed(2)}"/>`;
    // 背景：一只全宇宙的大钟（牛顿的绝对时间），淡
    s += `<g opacity="${kind === "main" ? 0.22 : 0.3}">` + dial({ cx: 960, cy: 470, r: 430, face: "none", rim: "#c9a45c", tick: "#c9a45c", hand: "#c9a45c", sec: 180, secColor: "#c9a45c", rimW: 2, hands: false }) + `<circle cx="960" cy="470" r="455" fill="none" stroke="#c9a45c" stroke-width="1"/></g>`;
    if (kind === "main") {
      // 地球与 GPS 轨道
      s += `<ellipse cx="760" cy="560" rx="460" ry="150" transform="rotate(-10 760 560)" fill="none" stroke="#c9a45c" stroke-width="2" stroke-dasharray="3 9" opacity=".8"/>`;
      s += `<circle cx="760" cy="560" r="110" fill="url(#earth)" stroke="#c9a45c" stroke-width="2"/>`;
      s += `<ellipse cx="760" cy="560" rx="110" ry="36" fill="none" stroke="#c9a45c" stroke-width="1" opacity=".5"/><ellipse cx="760" cy="560" rx="44" ry="110" fill="none" stroke="#c9a45c" stroke-width="1" opacity=".5"/>`;
      // 卫星（轨道右上）
      s += `<g transform="translate(1196 455) rotate(-10)"><rect x="-14" y="-14" width="28" height="28" fill="#e2c588" stroke="#7a5a28"/><rect x="-74" y="-9" width="52" height="18" fill="#2b4a73" stroke="#c9a45c"/><rect x="22" y="-9" width="52" height="18" fill="#2b4a73" stroke="#c9a45c"/></g>`;
      // 两只怀表 + 连线
      s += `<path d="M700 452 L520 360" stroke="#c9a45c" stroke-width="2" opacity=".7"/><path d="M1210 440 L1420 360" stroke="#c9a45c" stroke-width="2" opacity=".7"/>`;
      s += dial({ cx: 440, cy: 330, r: 108, face: "#f1e6cc", rim: "#c9a45c", tick: "#5a4524", hand: "#2e2414", sec: 0, secColor: "#9b2a18", rimW: 9, glow: "#e2c588" });
      s += dial({ cx: 1500, cy: 330, r: 108, face: "#f1e6cc", rim: "#c9a45c", tick: "#5a4524", hand: "#2e2414", sec: 22, secColor: "#9b2a18", rimW: 9, glow: "#e2c588" });
      s += `<path d="M1500 240 A90 90 0 0 1 1533.7 246.6" fill="none" stroke="#9b2a18" stroke-width="7" stroke-linecap="round"/>`;
    }
    return s + `</svg>`;
  },
  main: `<div class="plate mono"><span>t += dt</span></div>` +
    `<div class="lb" style="left:290px;top:452px">地面的钟</div>` +
    `<div class="lb" style="left:1350px;top:452px">卫星上的钟<br><b>每天快约 38 微秒</b></div>`,
  quote: `<div class="page serif"><div class="t1">PHILOSOPHIÆ<br>NATURALIS<br>PRINCIPIA<br>MATHEMATICA</div><div class="rule"></div><div class="t2">IS. NEWTON</div><div class="yr">1687</div><div class="sm">图为示意</div></div>` +
    `<div class="qf"><div class="k">牛顿 · 《自然哲学的数学原理》· 附注</div><div class="qt serif">${NEWTON}</div></div>`,
};

// ══════════ C · 手稿与光 ══════════
const C = {
  id: "c", slug: "chalk", name: "手稿与光",
  css: `
.frame{color:#f1ede4;background:radial-gradient(ellipse at 50% 45%,#262522 0%,#1a1917 55%,#0f0f0e 100%)}
.mode,.mark{color:#bdb5a6}.tag{color:#ffc68a;border-color:#a86a32;background:#1d1712e0}
.note{color:#cfc8ba}.caption{color:#fffaf0}
.ck{position:absolute;color:#f3efe6;filter:url(#chalkHtml)}
.ck.code{font-size:84px;left:180px;top:250px;letter-spacing:.02em}
.ck.ann{font-size:36px}
.ck .o{color:#ffa552}
.qh{position:absolute;left:250px;top:200px;width:1420px;font-size:72px;line-height:1.55;color:#f3efe6;filter:url(#chalkHtml)}
.qh .u{position:relative;color:#ffd2a3}
.sig{position:absolute;right:250px;top:640px;font-size:38px;color:#d9d2c4;filter:url(#chalkHtml)}
`,
  art: (kind) => {
    const chalk = `<filter id="chalk" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" result="d"/><feComposite in="d" in2="n" operator="arithmetic" k1="0" k2="1" k3="-.35" k4="0"/></filter>`;
    let s = `<svg class="art" viewBox="0 0 1920 1080"><defs>${soft}${chalk}<filter id="dust" filterUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080"><feTurbulence type="fractalNoise" baseFrequency=".012" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 .95  0 0 0 0 .93  0 0 0 0 .88  0 0 0 .09 0"/></filter></defs>`;
    s += `<rect width="1920" height="1080" filter="url(#dust)"/>`;
    // 擦过的痕迹
    s += `<path d="M150 160 C600 120 1300 190 1780 150" stroke="#f1ede4" stroke-width="90" opacity=".018" fill="none" stroke-linecap="round"/><path d="M200 720 C700 760 1300 700 1760 740" stroke="#f1ede4" stroke-width="56" opacity=".014" fill="none" stroke-linecap="round"/>`;
    if (kind === "main") {
      s += `<g filter="url(#chalk)">`;
      // 划掉 t += dt 的橙色粉笔线（略抖）
      s += `<path d="M168 306 C320 298 470 314 640 300" stroke="#ffa552" stroke-width="10" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M176 318 C330 310 480 326 632 314" stroke="#ffa552" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
      // 箭头
      s += `<path d="M560 460 C700 560 840 560 950 500" stroke="#f1ede4" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M925 482 L952 499 L922 514" stroke="#f1ede4" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      s += dial({ cx: 1150, cy: 470, r: 140, face: "none", rim: "#f1ede4", tick: "#f1ede4", hand: "#f1ede4", sec: 0, secColor: "#f1ede4", rimW: 5 });
      s += dial({ cx: 1560, cy: 400, r: 112, face: "none", rim: "#f1ede4", tick: "#f1ede4", hand: "#f1ede4", sec: 22, secColor: "#ffa552", rimW: 5 });
      s += `<path d="M1560 306 A94 94 0 0 1 1595.2 312.8" fill="none" stroke="#ffa552" stroke-width="9" stroke-linecap="round"/>`;
      s += `</g>`;
    } else {
      s += `<g filter="url(#chalk)" opacity=".85">` + dial({ cx: 1640, cy: 250, r: 110, face: "none", rim: "#f1ede4", tick: "#f1ede4", hand: "#f1ede4", sec: 90, secColor: "#ffa552", rimW: 4 }) + `</g>`;
      // 「均匀地流逝」下划线
      s += `<path d="M396 408 C500 402 640 414 756 404" stroke="#ffa552" stroke-width="7" fill="none" stroke-linecap="round" filter="url(#chalk)"/>`;
    }
    return s + `</svg>`;
  },
  // HTML 文字也加粉笔质感：页面里另放一个 svg 定义 chalkHtml
  pre: `<svg width="0" height="0" style="position:absolute"><filter id="chalkHtml"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter></svg>`,
  main: `<div class="ck code mono">t += dt</div>` +
    `<div class="ck ann hand" style="left:210px;top:410px">牛顿：全宇宙一只钟</div>` +
    `<div class="ck ann hand" style="left:1110px;top:630px">地面</div>` +
    `<div class="ck ann hand" style="left:1420px;top:540px">卫星：每天快约 <span class="o">38 微秒</span></div>` +
    `<div class="ck ann hand" style="left:1010px;top:230px;transform:rotate(-3deg)">每个实例，自带一只钟</div>`,
  quote: `<div class="qh hand">${NEWTON.replace("自身均匀地流逝", '自身<span class="u">均匀地流逝</span>')}</div><div class="sig hand">—— 牛顿《原理》，1687</div>`,
};

const text = {
  main: { tag: "③ 机制 · 私有的钟", note: "GPS 卫星钟比地面钟每天约快 38 微秒，不修正，一天的导航误差就超过 11 公里 · Ashby 2002", caption: "这行代码写错了：宇宙里，没有一只共用的钟。" },
  quote: { tag: "② 历史锚点 · 1687", note: "牛顿《自然哲学的数学原理》附注 · 据英译自译", caption: "牛顿心里的宇宙，只有一个全局变量 t。" },
};

function html(th, kind) {
  const t = text[kind];
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>样张 ${th.id.toUpperCase()} · ${th.name}</title><style>${common}${th.css}</style></head><body><div class="frame">${th.pre || ""}${th.art(kind)}${th[kind]}` +
    `<div class="mode">${th.id.toUpperCase()} · ${th.name}</div><div class="tag">${t.tag}</div><div class="mark">风格样张</div>` +
    `<div class="note" data-check="note">${t.note}</div><div class="caption" data-check="caption">${t.caption}</div></div></body></html>`;
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--disable-gpu", "--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => { throw e; });
  for (const th of [A, B, C]) for (const kind of ["main", "quote"]) {
    const stem = `样张-${th.id}-${th.slug}-${kind}`;
    const htmlPath = join(here, `${stem}.html`), pngPath = join(here, `${stem}.png`);
    writeFileSync(htmlPath, html(th, kind), "utf8");
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
    const problems = await page.evaluate(() => [...document.querySelectorAll("[data-check]")].flatMap((el) => {
      const r = el.getBoundingClientRect();
      return r.left < 0 || r.right > 1920 || r.bottom > 1080 || el.scrollWidth > el.clientWidth + 2 ? [el.dataset.check] : [];
    }));
    if (problems.length) throw new Error(`${stem} 排版越界：${problems.join(", ")}`);
    await page.screenshot({ path: pngPath });
    console.log(`${stem}.png  fonts=${fonts.join("/")}`);
  }
} finally { await browser.close(); }
