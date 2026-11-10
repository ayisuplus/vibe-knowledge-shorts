// 把样张 HTML 截成 1920×1080 PNG（缓存的 chrome-headless-shell，不用用户的 Chrome）。
// 用法（在 02-风格样张 下）：node tools/shot.mjs frame-a-wall [frame-b-towers …]，不带参数截全部 frame-*.html
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join, resolve } from "node:path";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";

const names = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(".").filter((f) => /^frame-.*\.html$/.test(f)).map((f) => f.slice(0, -5));
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--allow-file-access-from-files"] });
for (const n of names) {
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  p.on("pageerror", (e) => console.log(n, "pageerror:", e.message));
  await p.goto(pathToFileURL(resolve(`${n}.html`)).href, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: `${n}.png` });
  console.log("saved", n);
  await p.close();
}
await b.close();
