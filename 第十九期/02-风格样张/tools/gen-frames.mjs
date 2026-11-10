// 第十九期 P3：三个独立的视觉方向，每个方向输出主视觉和资料卡。
// 从项目仓库根目录运行：node 第十九期/02-风格样张/tools/gen-frames.mjs
// 样张是静态视觉提案；画面、人物和对话均为示意，不是 P5 成片工程。
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const here = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const versions = readdirSync(cache).sort();
const executablePath = join(cache, versions.at(-1), "chrome-headless-shell-win64", "chrome-headless-shell.exe");
if (!existsSync(executablePath)) throw new Error(`项目使用的本地 headless Chrome 不存在：${executablePath}`);
mkdirSync(here, { recursive: true });

const common = `
*{box-sizing:border-box} html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{font-family:"Noto Sans SC","Microsoft YaHei",sans-serif}
.frame{position:relative;width:1920px;height:1080px;overflow:hidden;isolation:isolate}
.art{position:absolute;inset:0;width:1920px;height:1080px;pointer-events:none}
.mode{position:absolute;left:76px;top:47px;font-size:24px;font-weight:600;letter-spacing:.14em;opacity:.78}
.tag{position:absolute;left:50%;top:37px;transform:translateX(-50%);height:48px;line-height:44px;padding:0 28px;border-radius:25px;font-size:23px;letter-spacing:.12em;border:1px solid;white-space:nowrap}
.mark{position:absolute;right:80px;top:48px;font-size:25px;letter-spacing:.10em;opacity:.8}
.note{position:absolute;top:788px;left:110px;width:1700px;text-align:center;font-size:32px;font-weight:500;line-height:1.25}
.caption{position:absolute;top:918px;left:110px;width:1700px;text-align:center;font-size:46px;line-height:1.35;font-weight:800;letter-spacing:.035em}
.line{display:block}.small{font-weight:500}
.source{font-size:29px;line-height:1.4;letter-spacing:.05em}
`;

const aCss = `
.frame{color:#f3f6f5;background:radial-gradient(ellipse at 52% 42%,#173752 0%,#0b1c30 44%,#06111e 100%)}
.mode,.mark{color:#b7c8c9}.tag{color:#e9d7a5;border-color:#beaa75;background:#102233cc}
.note{color:#a8c2c8}.caption{color:#fffaf0}
.a-paper{position:absolute;left:190px;top:202px;width:718px;height:469px;transform:rotate(-5deg);background:#ede9dc;color:#273943;border-radius:15px;box-shadow:0 45px 100px #0009,0 0 0 2px #ffffff55;overflow:hidden}
.a-paper:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 9px,#554c3210 10px 11px);pointer-events:none}
.a-paper .stripe{height:15px;background:#d6b76d}.a-paper .paper-head{position:absolute;top:54px;left:58px;font-size:38px;letter-spacing:.14em;font-weight:800;color:#334956}
.a-paper .paper-badge{position:absolute;top:61px;right:60px;font-size:22px;letter-spacing:.17em;color:#6e7b78}
.a-paper .paper-main{position:absolute;left:62px;top:150px;font-size:65px;font-weight:850;color:#283d49;letter-spacing:.05em}
.a-paper .paper-sub{position:absolute;left:64px;top:254px;font-size:32px;color:#556a70}.a-paper .paper-line{position:absolute;left:64px;right:64px;top:325px;border-top:2px solid #a4aca5}
.a-paper .paper-foot{position:absolute;left:64px;top:356px;font-size:27px;color:#718381;letter-spacing:.12em}
.a-phone{position:absolute;left:1165px;top:190px;width:450px;height:542px;border:3px solid #789ba7;border-radius:38px;background:linear-gradient(155deg,#20384b,#0c1725);box-shadow:0 35px 100px #000b,0 0 48px #71d1db24;padding:53px 34px;color:#eaf8fa}
.a-phone:before{content:"";position:absolute;width:100px;height:6px;border-radius:9px;background:#5c7e89;top:21px;left:173px}
.a-phone .chat-label{font-size:27px;color:#a4c5cb;letter-spacing:.12em}.a-phone .chat-title{font-size:44px;font-weight:800;margin-top:20px}
.a-phone .chat-bubble{margin-top:33px;border-radius:18px 18px 18px 3px;background:#dceced;color:#213a43;font-size:30px;line-height:1.7;padding:24px 25px}
.a-phone .chat-foot{margin-top:32px;font-size:26px;color:#dfc483;letter-spacing:.06em}
.a-float{position:absolute;left:722px;top:488px;padding:14px 25px;border:1px solid #e2c977;background:#132b36e8;color:#f1d991;border-radius:40px;font-size:28px;box-shadow:0 0 26px #d7ba6f44}
.a-quote-number{position:absolute;left:150px;top:170px;font-size:216px;font-weight:900;color:#d8bd7d;letter-spacing:-.08em;opacity:.95}
.a-quote-panel{position:absolute;left:710px;top:194px;width:1035px;height:490px;border:2px solid #b5a16d77;background:linear-gradient(130deg,#1b3344ee,#0b1d2bee);box-shadow:0 38px 90px #0008;padding:73px 75px}
.a-quote-kicker{font-size:28px;letter-spacing:.18em;color:#d9c58f}.a-quote-title{margin-top:45px;font-family:"Noto Serif SC",serif;font-weight:800;font-size:66px;line-height:1.38;color:#fffaf0}
.a-quote-source{margin-top:40px;color:#a9c2c7}
`;

const bCss = `
.frame{color:#f8eddb;background:radial-gradient(ellipse at 49% 42%,#50332a 0%,#241d1b 53%,#141313 100%)}
.mode,.mark{color:#e2c6a8}.tag{color:#f5e1c0;border-color:#cc916d;background:#3b241edf}
.note{color:#dbc0a9}.caption{color:#fff5e5}
.b-mask{position:absolute;left:350px;top:213px;width:642px;height:525px;filter:drop-shadow(0 35px 37px #0008)}
.b-card{position:absolute;left:1140px;top:240px;width:536px;height:480px;background:#e9d9bd;color:#372923;border-radius:8px;box-shadow:0 36px 90px #0009;transform:rotate(3deg);padding:54px 53px;overflow:hidden}
.b-card:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 7px,#6d4a3212 8px 9px);pointer-events:none}
.b-card .ticket-top{font-size:27px;letter-spacing:.16em;color:#856b55}.b-card .ticket-main{font-size:62px;line-height:1.4;font-weight:850;margin-top:35px}.b-card .ticket-small{font-size:29px;line-height:1.6;margin-top:25px;color:#785844}
.b-stamp{position:absolute;left:765px;top:617px;width:295px;height:82px;line-height:78px;text-align:center;border:3px solid #df987b;color:#f0b49a;transform:rotate(-8deg);font-size:31px;font-weight:800;letter-spacing:.18em;background:#442520cc}
.b-quote-paper{position:absolute;left:435px;top:175px;width:1060px;height:550px;padding:65px 95px;background:#eadcc5;color:#3a2923;box-shadow:0 45px 100px #000a;transform:rotate(-1deg);border:1px solid #ffebd4}
.b-quote-paper:after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent 0 8px,#674c3610 9px 10px);pointer-events:none}
.b-quote-kicker{font-size:27px;letter-spacing:.15em;color:#9c5f44}.b-quote-title{font-family:"Noto Serif SC",serif;font-weight:800;font-size:72px;line-height:1.4;margin-top:36px}
.b-quote-rule{height:3px;width:150px;background:#b85f45;margin-top:39px}.b-quote-source{margin-top:30px;color:#856b59}
`;

const cCss = `
.frame{color:#f0f8ed;background:radial-gradient(ellipse at 53% 41%,#173d35 0%,#0a231e 52%,#05130f 100%)}
.mode,.mark{color:#a9d2c5}.tag{color:#d9f5e7;border-color:#77b9a3;background:#0c2c25df}
.note{color:#a9cabe}.caption{color:#f5fff5}
.c-item{position:absolute;left:182px;top:237px;width:480px;height:440px;border:2px solid #a8d5c4;border-radius:20px;background:linear-gradient(140deg,#e7f1e6,#cddfd4);box-shadow:0 35px 80px #0009;color:#183f34;padding:48px 48px;transform:rotate(-3deg)}
.c-item .item-top{font-size:27px;letter-spacing:.15em;color:#5f8c7d}.c-item .item-title{font-size:55px;line-height:1.4;font-weight:850;margin-top:44px}.c-item .item-sub{font-size:29px;line-height:1.55;color:#507869;margin-top:28px}
.c-node{position:absolute;border-radius:22px;border:2px solid;background:#102f28ee;box-shadow:0 20px 60px #0009;padding:34px 36px;color:#effbf1}
.c-node.one{left:1200px;top:210px;width:475px;height:176px;border-color:#d9ad75}.c-node.two{left:1200px;top:518px;width:475px;height:176px;border-color:#80d4b6}
.c-node .node-kicker{font-size:24px;letter-spacing:.15em;color:#b8d4c8}.c-node .node-main{font-size:43px;font-weight:800;margin-top:22px}
.c-quote-back{position:absolute;left:320px;top:213px;width:1170px;height:470px;border:2px solid #78bd9f;background:#163d33a8;border-radius:12px;transform:rotate(-5deg);box-shadow:0 28px 100px #0008}
.c-quote-front{position:absolute;left:470px;top:203px;width:1080px;height:500px;border:2px solid #a9d9c8;background:linear-gradient(135deg,#e5f1e9f2,#c7e1d6f2);border-radius:12px;box-shadow:0 36px 100px #000a;padding:67px 75px;color:#173e33}
.c-quote-kicker{font-size:28px;color:#50816f;letter-spacing:.16em}.c-quote-title{font-family:"Noto Serif SC",serif;font-size:73px;font-weight:800;line-height:1.4;margin-top:40px}.c-quote-source{margin-top:39px;color:#557c6f}
`;

const aArt = `
<svg class="art" viewBox="0 0 1920 1080" aria-hidden="true"><defs>
 <pattern id="grid" width="58" height="58" patternUnits="userSpaceOnUse"><path d="M58 0H0V58" fill="none" stroke="#7db8c7" stroke-opacity=".09"/></pattern>
 <radialGradient id="glow"><stop stop-color="#e8d698" stop-opacity=".75"/><stop offset="1" stop-color="#e8d698" stop-opacity="0"/></radialGradient>
 <filter id="light"><feGaussianBlur stdDeviation="5"/></filter></defs>
 <rect width="1920" height="1080" fill="url(#grid)"/><circle cx="986" cy="441" r="275" fill="url(#glow)" opacity=".12"/>
 <path d="M780 450 C940 342 1061 398 1253 448" stroke="#f4d995" stroke-width="16" fill="none" opacity=".24" filter="url(#light)"/>
 <path d="M780 450 C940 342 1061 398 1253 448" stroke="#f4d995" stroke-width="4" fill="none"/><circle cx="986" cy="404" r="9" fill="#f7df98"/>
 <path d="M90 866H1830" stroke="#9bc5c6" stroke-opacity=".2"/><path d="M96 136h170M1654 136h170" stroke="#cbb47b" stroke-opacity=".4"/>
</svg>`;
const bArt = `
<svg class="art" viewBox="0 0 1920 1080" aria-hidden="true"><defs><linearGradient id="curtain"><stop stop-color="#693729"/><stop offset=".45" stop-color="#a9543a"/><stop offset="1" stop-color="#3d241e"/></linearGradient><radialGradient id="spot"><stop stop-color="#e3a36c" stop-opacity=".28"/><stop offset="1" stop-color="#e3a36c" stop-opacity="0"/></radialGradient></defs>
 <ellipse cx="887" cy="436" rx="770" ry="390" fill="url(#spot)"/><path d="M0 0H430C370 180 243 261 0 335Z" fill="url(#curtain)" opacity=".8"/>
 <path d="M1920 0H1490c60 180 187 261 430 335Z" fill="url(#curtain)" opacity=".8"/><path d="M0 761C490 696 1430 696 1920 761V1080H0Z" fill="#1c1514" opacity=".65"/>
 <path d="M390 188V42M683 188V42M860 188V42" stroke="#d1a06c" stroke-width="3" opacity=".5"/><path d="M90 866H1830" stroke="#d2a582" stroke-opacity=".22"/>
</svg>`;
const cArt = `
<svg class="art" viewBox="0 0 1920 1080" aria-hidden="true"><defs>
 <linearGradient id="path" x1="0" x2="1"><stop stop-color="#c1e9d9"/><stop offset="1" stop-color="#74cfaa"/></linearGradient><filter id="halo"><feGaussianBlur stdDeviation="12"/></filter>
 <pattern id="dots" width="52" height="52" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.5" fill="#b4e7d2" fill-opacity=".14"/></pattern></defs>
 <rect width="1920" height="1080" fill="url(#dots)"/><path d="M548 466C790 466 858 468 930 462C1040 452 1100 336 1252 305" fill="none" stroke="#e9c18a" stroke-width="22" opacity=".15" filter="url(#halo)"/>
 <path d="M548 466C790 466 858 468 930 462C1040 452 1100 336 1252 305" fill="none" stroke="#e9c18a" stroke-width="5"/>
 <path d="M930 462C1050 486 1100 591 1252 605" fill="none" stroke="#91e0bd" stroke-width="22" opacity=".18" filter="url(#halo)"/>
 <path d="M930 462C1050 486 1100 591 1252 605" fill="none" stroke="#91e0bd" stroke-width="5"/>
 <circle cx="930" cy="462" r="31" fill="#b9ead3" opacity=".14"/><circle cx="930" cy="462" r="9" fill="#d9f8e8"/>
 <path d="M90 866H1830" stroke="#9ad4bb" stroke-opacity=".22"/>
</svg>`;

const mask = `<svg class="b-mask" viewBox="0 0 642 525" aria-hidden="true"><defs><linearGradient id="mask"><stop stop-color="#fff2d9"/><stop offset="1" stop-color="#bd9d7d"/></linearGradient></defs>
<path d="M320 16C173 13 69 109 68 242c0 150 101 242 252 263 151-21 252-113 252-263C572 109 467 13 320 16Z" fill="url(#mask)" stroke="#f5d8b2" stroke-width="4"/>
<path d="M132 194c58-42 114-37 163 3-46 33-108 38-163-3ZM345 197c49-40 105-45 163-3-55 41-117 36-163 3Z" fill="#382c29"/>
<path d="M236 337c59 34 114 34 173 0" fill="none" stroke="#936d58" stroke-width="12" stroke-linecap="round"/>
<path d="M320 211c-16 55-24 83-19 93 11 11 26 11 39 0" fill="none" stroke="#be9a7d" stroke-width="8" stroke-linecap="round"/>
</svg>`;

const themes = [
 {id:"a",slug:"archive",name:"档案追踪",css:aCss,art:aArt,
  main:`<div class="a-paper"><div class="stripe"></div><div class="paper-head">包裹信息</div><div class="paper-badge">示意单据</div><div class="paper-main">你的订单</div><div class="paper-sub">商品、地址、收件进度</div><div class="paper-line"></div><div class="paper-foot">熟悉的信息，不等于身份凭证</div></div><div class="a-phone"><div class="chat-label">来电 · 情节示意</div><div class="chat-title">自称快递客服</div><div class="chat-bubble">你的包裹出了问题，<br>我来帮你处理。</div><div class="chat-foot">对方知道订单细节</div></div><div class="a-float">身份仍待核验</div>`,
  quote:`<div class="a-quote-number">2008</div><div class="a-quote-panel"><div class="a-quote-kicker">NIST · 信息安全测试指南</div><div class="a-quote-title">一次电话，<br>也可能成为社会工程的入口。</div><div class="a-quote-source source">NIST SP 800-115 §5.3 · 内容转述</div></div>`},
 {id:"b",slug:"stage",name:"幕后换脸",css:bCss,art:bArt,
  main:`${mask}<div class="b-card" data-check="故事卡"><div class="ticket-top">来电中的角色 · 情节示意</div><div class="ticket-main">“我是<br>快递客服。”</div><div class="ticket-small">熟悉的称呼，<br>让陌生人站进了你的故事。</div></div><div class="b-stamp">身份待核</div>`,
  quote:`<div class="b-quote-paper"><div class="b-quote-kicker">一份旧档案 · 2008</div><div class="b-quote-title">人声背后，<br>也可能藏着另一张脸。</div><div class="b-quote-rule"></div><div class="b-quote-source source">本片视觉类比 · 依据 NIST SP 800-115 §5.3</div></div>`},
 {id:"c",slug:"fork",name:"信任岔路",css:cCss,art:cArt,
  main:`<div class="c-item" data-check="故事卡"><div class="item-top">熟悉的线索 · 情节示意</div><div class="item-title">你的包裹<br>出了问题。</div><div class="item-sub">来电者知道你的订单，<br>于是，一条路出现了。</div></div><div class="c-node one"><div class="node-kicker">一条路</div><div class="node-main">跟随对方的说法</div></div><div class="c-node two"><div class="node-kicker">另一条路</div><div class="node-main">独立核验身份</div></div>`,
  quote:`<div class="c-quote-back"></div><div class="c-quote-front"><div class="c-quote-kicker">2008 · 安全评估指南</div><div class="c-quote-title">社会工程，<br>也可能发生在电话中。</div><div class="c-quote-source source">NIST SP 800-115 §5.3 · 内容转述</div></div>`}
];

function html(theme, kind) {
  const quote = kind === "quote";
  const caption = quote ? "社会工程，不只发生在网络里。" : "对方知道你的订单，并不等于身份已核实。";
  const note = quote ? "资料来源：NIST 信息安全测试与评估指南 · 2008" : "情节示意：一通自称快递客服的来电";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>样张 ${theme.id.toUpperCase()} · ${theme.name}</title><style>${common}${theme.css}</style></head><body><div class="frame">${theme.art}${quote ? theme.quote : theme.main}<div class="mode">VIBE 知识大赏 · ${theme.id.toUpperCase()} ${theme.name}</div><div class="tag">${quote ? "资料锚点 · 2008" : "故事开场 · 退款来电"}</div><div class="mark">${quote ? "资料转述" : "情节示意"}</div><div class="note" data-check="note">${note}</div><div class="caption" data-check="caption">${caption}</div></div></body></html>`;
}

const browser = await puppeteer.launch({ executablePath, headless: true, args:["--disable-gpu", "--allow-file-access-from-files"] });
try {
  const page = await browser.newPage();
  await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
  page.on("pageerror", error => { throw error; });
  for (const theme of themes) for (const kind of ["main", "quote"]) {
    const stem = `样张-${theme.id}-${theme.slug}-${kind}`;
    const htmlPath = join(here, `${stem}.html`), pngPath = join(here, `${stem}.png`);
    writeFileSync(htmlPath, html(theme, kind), "utf8");
    await page.goto(pathToFileURL(htmlPath).href, {waitUntil:"load"});
    await page.evaluate(() => document.fonts.ready);
    const problems = await page.evaluate(() => [...document.querySelectorAll("[data-check]")].flatMap(el => {
      const r = el.getBoundingClientRect();
      const overflow = el.scrollWidth > el.clientWidth + 2 || (el.dataset.check === "故事卡" && el.scrollHeight > el.clientHeight + 2);
      return r.left < 0 || r.right > 1920 || r.top < 0 || r.bottom > 1080 || overflow ? [`${el.dataset.check}(${el.scrollWidth}x${el.scrollHeight}/${el.clientWidth}x${el.clientHeight})`] : [];
    }));
    if (problems.length) throw new Error(`${stem} 排版越界：${problems.join(", ")}`);
    await page.screenshot({path:pngPath});
    console.log(`${stem}.png 1920x1080`);
  }
} finally { await browser.close(); }
