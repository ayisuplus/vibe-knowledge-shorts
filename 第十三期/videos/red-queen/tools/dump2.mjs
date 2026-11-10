import puppeteer from "puppeteer-core";
import http from "node:http";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";
import { extname } from "node:path";
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".json": "application/json", ".css": "text/css" };
const srv = http.createServer((q, s) => { const p = join(process.cwd(), decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: "C:/Users/36322/.cache/puppeteer/chrome-headless-shell/win64-150.0.7871.24/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(`http://127.0.0.1:${port}/index.html?caps=1`, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready.then(() => 1));
for (const T of [41, 44, 47]) {
  const r = await p.evaluate((T) => { const tl = window.__timelines.main; tl.seek(T, false);
    return [...document.querySelectorAll(".cap")].filter(e => getComputedStyle(e).visibility === "visible" && +getComputedStyle(e).opacity > 0.01)
      .map(e => ({ txt: e.innerText.slice(0, 24), op: +(+getComputedStyle(e).opacity).toFixed(2), top: Math.round(e.getBoundingClientRect().top) })); }, T);
  console.log(T, JSON.stringify(r));
}
await b.close(); srv.close();
