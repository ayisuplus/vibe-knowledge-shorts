import puppeteer from "puppeteer-core";
import http from "node:http";
import { join, extname } from "node:path";
import { readFileSync, existsSync } from "node:fs";
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".json": "application/json", ".css": "text/css" };
const srv = http.createServer((q, s) => { const p = join(process.cwd(), decodeURIComponent(q.url.split("?")[0])); if (!existsSync(p)) { s.writeHead(404); return s.end(); } s.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); s.end(readFileSync(p)); }).listen(0);
const port = srv.address().port;
const b = await puppeteer.launch({ executablePath: "C:/Users/36322/.cache/puppeteer/chrome-headless-shell/win64-150.0.7871.24/chrome-headless-shell-win64/chrome-headless-shell.exe" });
const p = await b.newPage(); await p.setViewport({ width: 1920, height: 1080 });
const logs = []; p.on("console", (m) => logs.push(m.text().slice(0, 200))); p.on("pageerror", (e) => logs.push("ERR " + e.message.slice(0, 200)));
await p.goto(`http://127.0.0.1:${port}/index.html?caps=1`, { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready.then(() => 1));
const r = await p.evaluate(() => {
  window.__timelines.main.seek(21, false);
  const q = (s) => document.querySelector(s);
  const root = q("#bg > .floor");
  const plane = q("#bg .plane");
  const scene = q("#bg .scene");
  const cs = (e) => e ? getComputedStyle(e) : null;
  return {
    hasFloor: !!root, hasPlane: !!plane,
    rootOp: cs(root)?.opacity, rootVis: cs(root)?.visibility,
    scenePersp: cs(scene)?.perspective,
    planeRect: plane ? JSON.parse(JSON.stringify(plane.getBoundingClientRect())) : null,
    planeTransform: cs(plane)?.transform,
    planeBg: (cs(plane)?.backgroundImage || "").slice(0, 60),
    bgChildren: document.getElementById("bg").children.length,
    bgZ: cs(document.getElementById("bg")).zIndex,
    stageZ: cs(document.getElementById("stage")).zIndex,
  };
});
console.log(JSON.stringify(r, null, 1));
console.log(logs.slice(-4).join(" | "));
await b.close(); srv.close();
