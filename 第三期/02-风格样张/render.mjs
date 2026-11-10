// 用 puppeteer-core + 缓存的 chrome-headless-shell 渲染样张（不用用户的 Chrome）
// 用法：node render.mjs [文件名.html ...]，不给参数就渲染全部 frame-*.html
import puppeteer from "puppeteer-core";
import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";

const here = dirname(fileURLToPath(import.meta.url));
const shellRoot = join(os.homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const ver = readdirSync(shellRoot).sort().pop();
const exe = join(shellRoot, ver, "chrome-headless-shell-win64", "chrome-headless-shell.exe");

const files = process.argv.slice(2).length ? process.argv.slice(2) : readdirSync(here).filter(f => /^frame-.*\.html$/.test(f));
const browser = await puppeteer.launch({ executablePath: exe, args: ["--allow-file-access-from-files"] });
for (const f of files) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.goto(pathToFileURL(join(here, f)).href, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const out = join(here, f.replace(/\.html$/, ".png"));
  await page.screenshot({ path: out });
  console.log("rendered", out);
  await page.close();
}
await browser.close();
