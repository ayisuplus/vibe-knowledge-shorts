// 检查底部字幕区（y > 890）里有没有可见的画面文字：逐 0.5 秒扫一遍，列出越界的文字
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, dirname, extname } from "node:path";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, s) => { const p = join(here, decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe") });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
await p.goto(`http://127.0.0.1:${srv.address().port}/index.html`, { waitUntil: "networkidle0" });
const hits = {};
for (let t = 0; t < 234; t += 0.5) {
  const r = await p.evaluate((t) => {
    window.__timelines.main.seek(t, false);
    const out = [];
    document.querySelectorAll("#hud .t").forEach((e) => {
      if (e.style.visibility === "hidden" || +e.style.opacity < 0.05) return;
      const bb = e.getBoundingClientRect();
      if (bb.bottom > 890 && bb.top < 1080) out.push(e.textContent.trim().slice(0, 24) + " @" + Math.round(bb.bottom));
    });
    return out;
  }, t);
  r.forEach((x) => { (hits[x] = hits[x] || []).push(t); });
}
for (const [k, ts] of Object.entries(hits)) console.log(k, ts[0] + "–" + ts[ts.length - 1]);
await b.close(); srv.close();
