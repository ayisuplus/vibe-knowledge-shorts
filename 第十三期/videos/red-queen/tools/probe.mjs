// 调试：跳到某一时刻，打印选择器匹配元素的屏幕矩形和计算后的 transform。
// 用法：node tools/probe.mjs <t> <selector> [...]
import puppeteer from "puppeteer-core";
import os from "node:os"; import http from "node:http";
import { join, dirname, extname } from "node:path"; import { readdirSync, readFileSync, existsSync } from "node:fs"; import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".css": "text/css" };
const srv = http.createServer((q, s) => { const p = join(here, decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell"); const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe") });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: "networkidle0" });
await p.waitForFunction(() => window.__timelines?.main?.duration() > 0);
const [t, ...sels] = process.argv.slice(2);
console.log(await p.evaluate((t, sels) => { window.__timelines.main.seek(+t, false);
  return sels.map((s) => [...document.querySelectorAll(s)].slice(0, 3).map((e) => { const r = e.getBoundingClientRect(); return `${s}: ${r.left|0},${r.top|0} ${r.width|0}x${r.height|0} | ${e.style.transform.slice(0, 120)}`; }).join("\n")).join("\n"); }, t, sels));
await b.close(); srv.close();
