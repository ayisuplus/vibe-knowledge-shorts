// 预览：不经 HyperFrames 运行时，加载 index.html，跳到给定时间截图到 snapshots/。
// 用法：node tools/shot.mjs 1.2 3.5 8.9 ...
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join, dirname } from "node:path";
import { readdirSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
p.on("pageerror", (e) => console.log("pageerror:", e.message));
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text()); });
await p.goto(pathToFileURL(join(here, "index.html")).href, { waitUntil: "load" });
await p.evaluate(() => document.fonts.ready.then(() => 1));
console.log("loaded"); mkdirSync(join(here, "snapshots"), { recursive: true });
for (const a of process.argv.slice(2)) {
  const t = +a;
await p.evaluate((t) => { window.__timelines.main.seek(t, false); return 1; }, t);
  await new Promise((r) => setTimeout(r, 60));
  const out = join(here, "snapshots", `t${t.toFixed(2).padStart(6, "0")}.png`);
  await p.screenshot({ path: out });
  console.log(out);
}
await b.close();
