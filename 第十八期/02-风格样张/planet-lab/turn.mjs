// 自转试片：node turn.mjs <贴图> <输出名> [秒数=6] [额外参数如 atm=5fd0ff] [转过角度=360] [起始角=20]
// → shots/<输出名>.mp4（默认转满一圈，接缝必定经过镜头）
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, extname, dirname } from "node:path";
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const [tex, name, sec = "6", extra = "", span = "360", start = "20"] = process.argv.slice(2);
const here = dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png" };
const srv = http.createServer((q, s) => {
  const f = join(here, decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream" }); s.end(readFileSync(f));
}).listen(0);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({
  executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"),
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const dir = join(here, "shots", "frames-" + name);
rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
// PAGE=gpt.html 可换成别的试片页（同样提供 setState(deg, t)）
await p.goto(`http://localhost:${srv.address().port}/${process.env.PAGE || "planet.html"}?tex=${tex}&tilt=12&${extra}`);
await p.waitForFunction("window.__ready === true", { timeout: 60000 });
const n = Math.round(+sec * 30);
for (let i = 0; i < n; i++) {
  await p.evaluate((d, t) => window.setState(d, t), +start + (+span * i) / n, i / 30);
  await p.screenshot({ path: join(dir, String(i).padStart(4, "0") + ".png") });
}
await b.close(); srv.close();
execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "30", "-i", join(dir, "%04d.png"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", join(here, "shots", name + ".mp4")]);
rmSync(dir, { recursive: true, force: true });
console.log("ok", name + ".mp4", n, "frames");
