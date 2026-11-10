// 渲染两张封面：cover.html?a=43（1440×1080）和 ?a=34（1080×1440），2 倍截图后用 ffmpeg lanczos 缩回原尺寸。
// 用法（在 05-封面 下）：node render.mjs
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join, resolve } from "node:path";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--allow-file-access-from-files"] });
for (const [a, w, h] of [["43", 1440, 1080], ["34", 1080, 1440]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(pathToFileURL(resolve("cover.html")).href + `?a=${a}`, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 500));
  const tmp = `cover-${a}@2x.png`;
  await p.screenshot({ path: tmp });
  const out = a === "43" ? "封面-4x3.jpg" : "封面-3x4.jpg";
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", `scale=${w}:${h}:flags=lanczos`, "-q:v", "2", out]);
  console.log("saved", out);
  await p.close();
}
await b.close();
