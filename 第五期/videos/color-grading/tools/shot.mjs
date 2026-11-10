// 预览：起一个本地静态服务器（照片滤镜需要 http），跳到给定时间截图到 snapshots/。
// 用法：node tools/shot.mjs [--caps] 1.2 3.5 8.9 ...
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, dirname, extname } from "node:path";
import { readdirSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".otf": "font/otf", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".json": "application/json" };
const srv = http.createServer((q, s) => { const p = join(here, decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const port = srv.address().port;
const args = process.argv.slice(2), caps = args.includes("--caps");
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe") });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
p.on("pageerror", (e) => console.log("pageerror:", e.message));
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text()); });
await p.goto(`http://127.0.0.1:${port}/index.html${caps ? "?caps=1" : ""}`, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready.then(() => 1));
mkdirSync(join(here, "snapshots"), { recursive: true });
for (const a of args.filter((x) => !x.startsWith("--"))) {
  const t = +a;
  await p.evaluate((t) => { window.__timelines.main.seek(t, false); return 1; }, t);
  await new Promise((r) => setTimeout(r, 120));
  const out = join(here, "snapshots", `t${t.toFixed(2).padStart(6, "0")}.png`);
  await p.screenshot({ path: out });
  console.log(out);
}
await b.close(); srv.close();
