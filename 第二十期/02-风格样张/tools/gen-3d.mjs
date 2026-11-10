// 第二十期 P3 · 3D 样张截图：起一个本地静态服务（ES module 不能走 file://），逐张打开 3d/lab.html 截图。
// 从仓库根目录运行：node 第二十期/02-风格样张/tools/gen-3d.mjs [a-main b-quote …]
import { createServer } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".ttf": "font/ttf", ".png": "image/png" };
const server = createServer(async (req, res) => {
  const p = normalize(join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)));
  if (!p.startsWith(root) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": MIME[extname(p)] || "application/octet-stream" });
  res.end(await readFile(p));
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const port = server.address().port;

const cache = join(homedir(), ".cache", "puppeteer", "chrome-headless-shell");
const ver = (await readdir(cache)).sort().at(-1);
const executablePath = join(cache, ver, "chrome-headless-shell-win64", "chrome-headless-shell.exe");
const SLUG = { a: "editor", b: "brass", c: "chalk" };
const jobs = process.argv.slice(2).length ? process.argv.slice(2) : ["a-main", "a-quote", "b-main", "b-quote", "c-main", "c-quote"];

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  for (const job of jobs) {
    const [d, k] = job.split("-");
    errors.length = 0;
    await page.goto(`http://127.0.0.1:${port}/3d/lab.html?d=${d}&k=${k}`, { waitUntil: "load" });
    await page.waitForFunction("window.__done === true", { timeout: 120000 }).catch(() => {});
    if (errors.length) throw new Error(`${job}: ${errors.join(" | ")}`);
    const gl = await page.evaluate(() => { const g = document.getElementById("c").getContext("webgl2"); const e = g && g.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; });
    const out = join(root, `样张-3d-${d}-${SLUG[d]}-${k}.png`);
    await page.screenshot({ path: out });
    console.log(`样张-3d-${d}-${SLUG[d]}-${k}.png  (${gl})`);
  }
} finally { await browser.close(); server.close(); }
