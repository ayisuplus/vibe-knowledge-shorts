// 第二十期封面渲染：照共享 tools/cover.mjs 的流程，但打开 GPU（封面是 Three.js 3D 场景）。
// 用法（仓库根目录）：node 第二十期/05-封面/render.mjs --episode=第二十期
// 页面常引片子里的 ES 模块，需起静态服务器（根 = 第 N 期/），不能 file:// 直开。
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, resolve, extname } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(a.indexOf("=") + 1) : d; };
const base = resolve(opt("episode", "."));
const coverDir = join(base, "05-封面");
const types = { ".html": "text/html", ".js": "text/javascript", ".ttf": "font/ttf", ".css": "text/css", ".png": "image/png" };
// 封面页要读工程里的 js / 字体，所以服务根 = 第二十期/
const srv = http.createServer((q, s) => {
  const p = join(base, decodeURIComponent(q.url.split("?")[0]));
  if (!p.startsWith(base) || !existsSync(p)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p));
}).listen(0);
const port = srv.address().port;

const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"] });
for (const [a, w, h] of [["43", 1440, 1080], ["34", 1080, 1440]]) {
  const p = await b.newPage();
  p.on("pageerror", (e) => console.log("pageerror:", e.message));
  p.on("requestfailed", (r) => console.log("reqfail:", r.url()));
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(`http://127.0.0.1:${port}/05-封面/cover.html?a=${a}`, { waitUntil: "load" });
  await p.waitForFunction(() => document.title === "ready", { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 400));
  const tmp = join(coverDir, `cover-${a}@2x.png`);
  await p.screenshot({ path: tmp });
  const out = join(coverDir, a === "43" ? "封面-4x3.jpg" : "封面-3x4.jpg");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", tmp, "-vf", `scale=${w}:${h}:flags=lanczos`, "-q:v", "2", out]);
  console.log("saved", out);
  await p.close();
}
await b.close(); srv.close();
