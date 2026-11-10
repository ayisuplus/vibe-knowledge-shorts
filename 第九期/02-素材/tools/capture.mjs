// 批量截网页：用缓存的 chrome-headless-shell（不用用户的 Chrome）。不点任何同意按钮，只隐藏遮挡的弹层。
// 用法（在 第九期/02-素材 下运行）：node tools/capture.mjs [只截这些名字…]
// 清单在 tools/shots.json：[{ name, url, w, h, scroll?, full? }]
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join } from "node:path";
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";

const only = process.argv.slice(2);
const shots = JSON.parse(readFileSync("tools/shots.json", "utf8")).filter((s) => !only.length || only.includes(s.name));
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--lang=zh-CN"] });
mkdirSync("web-src", { recursive: true });

for (const s of shots) {
  const p = await b.newPage();
  await p.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36");
  await p.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await p.setViewport({ width: s.w || 1440, height: s.h || 1200, deviceScaleFactor: 2 });
  try { await p.goto(s.url, { waitUntil: "networkidle2", timeout: 45000 }); } catch (e) { console.log(s.name, "goto:", e.message); }
  await new Promise((r) => setTimeout(r, 2000));
  // GitHub 的文件列表里「最近提交」一列是懒加载的，等骨架屏消失再截
  await p.waitForFunction(() => !document.querySelector('[class*="Skeleton"], [class*="skeleton"]'), { timeout: 15000 }).catch(() => console.log(s.name, "skeleton still visible"));
  await p.evaluate(() => {
    const kill = /cookie|consent|gdpr|onetrust|banner|modal|overlay|popup|subscribe|signup|sign-up|toast|flash/i;
    document.querySelectorAll("body *").forEach((e) => {
      const st = getComputedStyle(e);
      if ((st.position === "fixed" || st.position === "sticky") && (kill.test(e.className + " " + e.id) || +st.zIndex > 999)) e.style.display = "none";
    });
    document.documentElement.style.overflow = "auto"; document.body.style.overflow = "auto";
  });
  if (s.scroll) await p.evaluate((y) => window.scrollTo(0, y), s.scroll);
  await new Promise((r) => setTimeout(r, 600));
  await p.screenshot({ path: `web-src/${s.name}.png`, fullPage: !!s.full });
  // 记下 AI 相关文件行在截图里的位置（CSS 像素，截图是 2 倍），样张和成片用来打高亮。
  // star 按钮在每个仓库页都在同一位置（右上，约 x 1226–1327, y 192–220），不另测
  const boxes = await p.evaluate(() => {
    const ai = /^(CLAUDE|AGENTS|GEMINI|SKILL)\.md$|^\.(claude|codex|pi|cursor|agents)\b|^skills$|-plugin$|^\.opencode$/;
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; };
    const rows = [];
    document.querySelectorAll("table tr").forEach((tr) => {
      const a = tr.querySelector("a.Link--primary, td a");
      const name = a && a.textContent.trim();
      if (name && ai.test(name)) rows.push({ name, row: box(tr), link: box(a) });
    });
    return { rows };
  });
  writeFileSync(`web-src/${s.name}.json`, JSON.stringify(boxes, null, 1));
  console.log("saved", s.name, "|", (await p.title()).slice(0, 80));
  await p.close();
}
await b.close();
