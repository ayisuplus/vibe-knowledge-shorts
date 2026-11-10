// 预览截图：起本地静态服务器，用开了 GPU 的 headless Chrome 跳到给定时间截图到 snapshots/。
// 用法：node tools/shot.mjs [--page=style.html] [--dpr=2] [--tag=x] 1.2 3.5 ...
// 每一帧会打印渲染耗时（seek 到截图完成），用来估算整片渲染时间。
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, dirname, extname } from "node:path";
import { readdirSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".ttf": "font/ttf", ".m4a": "audio/mp4", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".json": "application/json", ".css": "text/css" };
// 静态服务器，支持 Range（视频要能 seek）
const srv = http.createServer((q, res) => {
  const p = join(here, decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  const buf = readFileSync(p), type = types[extname(p)] || "application/octet-stream";
  const m = /bytes=(d*)-(d*)/.exec(q.headers.range || "");
  if (m) {
    const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : buf.length - 1;
    res.writeHead(206, { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${a}-${b}/${buf.length}`, "content-length": b - a + 1 });
    return res.end(buf.subarray(a, b + 1));
  }
  res.writeHead(200, { "content-type": type, "accept-ranges": "bytes", "content-length": buf.length }); res.end(buf);
}).listen(0);
const port = srv.address().port;
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(a.indexOf("=") + 1) : d; };
// --page 可以是子目录页面，例如 lab/style.html
const page = opt("page", "index.html"), dpr = +opt("dpr", 1), tag = opt("tag", "");
const VW = +opt("w", 1920), VH = +opt("h", 1080);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({
  executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"),
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader=false"],
});
const p = await b.newPage();
await p.setViewport({ width: VW, height: VH, deviceScaleFactor: dpr });
p.on("requestfailed", (r) => console.log("reqfail:", r.url())); p.on("response", (r) => { if (r.status() >= 400) console.log("http", r.status(), r.url()); });
p.on("pageerror", (e) => console.log("pageerror:", e.message, String(e.stack || "").split(String.fromCharCode(10)).slice(1, 4).join(" | ")));
p.on("console", (m) => { if (["error", "warning", "log"].includes(m.type())) console.log("console:", m.text()); });
const t0 = Date.now();
await p.goto(`http://127.0.0.1:${port}/${page}`, { waitUntil: "networkidle0" });
for (let i = 0; i < 60; i++) { const ok = await p.evaluate(() => !!(window.__timelines && window.__timelines.main && window.__timelines.main.duration() > 0)); if (ok) break; if (i === 59) throw new Error("timeline never registered"); await new Promise((r) => setTimeout(r, 250)); }
await p.evaluate(() => document.fonts.ready.then(() => 1));
console.log(`load ${Date.now() - t0} ms`);
console.log("gl:", await p.evaluate(() => { const c = document.createElement("canvas").getContext("webgl2"); const e = c.getExtension("WEBGL_debug_renderer_info"); return e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : "?"; }));
mkdirSync(join(here, "snapshots"), { recursive: true });
for (const a of args.filter((x) => !x.startsWith("--"))) {
  const t = +a, s = Date.now();
  await p.evaluate(async (t) => {
    // 框架只在 render 时替我们 seek 视频；截图时自己 seek，并等它解码到那一帧
    for (const v of document.querySelectorAll("video.clip")) {
      const lt = Math.max(0, Math.min(t - +(v.dataset.start || 0), (v.duration || 1e9) - 0.04));
      if (Math.abs(v.currentTime - lt) > 0.001) await new Promise((r) => { v.addEventListener("seeked", r, { once: true }); v.currentTime = lt; });
    }
    window.__timelines.main.seek(t, false); return 1;
  }, t);
  if (opt("hidehud", "")) await p.evaluate(() => { document.getElementById("hud").style.opacity = "0"; }); // 封面用：只要画面，不要字
  const out = join(here, "snapshots", `${tag}${tag ? "-" : ""}t${t.toFixed(2).padStart(6, "0")}${dpr > 1 ? "@" + dpr + "x" : ""}.png`);
  await p.screenshot({ path: out });
  console.log(`${out}  ${Date.now() - s} ms`);
}
await b.close(); srv.close();
