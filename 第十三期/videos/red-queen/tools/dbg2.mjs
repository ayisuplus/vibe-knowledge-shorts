import puppeteer from "puppeteer-core";
import http from "node:http";
import { join, extname } from "node:path";
import { readFileSync, existsSync } from "node:fs";
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".json": "application/json", ".css": "text/css" };
const srv = http.createServer((q, s) => { const p = join(process.cwd(), decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: "C:/Users/36322/.cache/puppeteer/chrome-headless-shell/win64-150.0.7871.24/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(`http://127.0.0.1:${port}/index.html?caps=1`, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready.then(() => 1));
const r = await p.evaluate(() => {
  window.__timelines.main.seek(22, false);
  const root = document.querySelector("#bg > .crowd");
  const tms = [...document.querySelectorAll("#bg > .crowd .tm")];
  return {
    has: !!root, op: root && getComputedStyle(root).opacity, vis: root && getComputedStyle(root).visibility,
    n: tms.length,
    first: tms[0] && { op: getComputedStyle(tms[0]).opacity, tr: tms[0].getAttribute("transform"), r: JSON.parse(JSON.stringify(tms[0].getBoundingClientRect())) },
  };
});
console.log(JSON.stringify(r));
await b.close(); srv.close();
