// 渲染封面：node render.mjs cover-16x9.html cover-3x4.html（尺寸取自页面里 <meta name="size" content="宽x高">）
import puppeteer from "puppeteer-core";
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import os from "node:os";
const here = dirname(fileURLToPath(import.meta.url));
const root = join(os.homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const exe = join(root, readdirSync(root).sort().pop(), "chrome-headless-shell-win64", "chrome-headless-shell.exe");
const b = await puppeteer.launch({ executablePath: exe, args: ["--allow-file-access-from-files"] });
for (const f of process.argv.slice(2)) {
  const [w, h] = readFileSync(join(here, f), "utf8").match(/name="size" content="(\d+)x(\d+)"/).slice(1).map(Number);
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  await p.goto(pathToFileURL(join(here, f)).href, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready.then(() => 1));
  const out = join(here, f.replace(/\.html$/, ".jpg"));
  await p.screenshot({ path: out, type: "jpeg", quality: 95 });
  console.log(out);
  await p.close();
}
await b.close();
