// 静态页截图（没有 timeline 的样张用）。用法：node tools/still.mjs forms/floor.html 1x
import puppeteer from "puppeteer-core";
import http from "node:http";
import { join, extname } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".json": "application/json", ".css": "text/css" };
const srv = http.createServer((q, s) => {
  const p = join(process.cwd(), decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(p)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" });
  s.end(readFileSync(p));
}).listen(0);
const port = srv.address().port;

const page = process.argv[2] || "forms/floor.html";
const dpr = Number(process.argv[3] || 1);
const out = process.argv[4] || ("snapshots/" + page.replace(/[\\/]/g, "-").replace(".html", "") + ".png");

const b = await puppeteer.launch({
  executablePath: "C:/Users/36322/.cache/puppeteer/chrome-headless-shell/win64-150.0.7871.24/chrome-headless-shell-win64/chrome-headless-shell.exe",
  args: ["--allow-file-access-from-files", "--use-angle=d3d11"],
});
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: dpr });
await p.goto(`http://127.0.0.1:${port}/${page}`, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 400));
await p.screenshot({ path: out });
console.log("saved", out);
await b.close(); srv.close();
