// 把整片的转动表（film.js 里拼好的 SCH）导出到 sfx/moves.json，给音效排「咔」用
import puppeteer from "puppeteer-core";
import os from "node:os"; import http from "node:http";
import { join, dirname, extname } from "node:path"; import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs"; import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".ttf": "font/ttf", ".png": "image/png", ".jpg": "image/jpeg" };
const srv = http.createServer((q, s) => { const p = join(here, decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell"); const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--use-angle=d3d11", "--enable-gpu"] });
const p = await b.newPage(); await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: "domcontentloaded" });
for (let i = 0; i < 240; i++) { if (await p.evaluate(() => !!window.__SCH)) break; await new Promise((r) => setTimeout(r, 250)); }
const sch = await p.evaluate(() => window.__SCH);
writeFileSync(join(here, "sfx/moves.json"), JSON.stringify(sch));
console.log("moves", sch.length, "clickable", sch.filter((m) => m[2] > 0.07).length);
await b.close(); srv.close();
