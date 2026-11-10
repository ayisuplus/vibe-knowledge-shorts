// 用共享工具同一个 headless-shell 截试球：node shoot.mjs <name> <query> [<name> <query> ...]
import puppeteer from "puppeteer-core";
import os from "node:os";
import http from "node:http";
import { join, extname, dirname } from "node:path";
import { readdirSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const types = { ".html": "text/html", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg" };
const srv = http.createServer((q, s) => {
  const f = join(here, decodeURIComponent(q.url.split("?")[0]));
  if (!existsSync(f)) { s.writeHead(404); return s.end(); }
  s.writeHead(200, { "Content-Type": types[extname(f)] || "application/octet-stream" }); s.end(readFileSync(f));
}).listen(0);
const port = srv.address().port;
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({
  executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"),
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
mkdirSync(join(here, "shots"), { recursive: true });
const a = process.argv.slice(2);
for (let i = 0; i < a.length; i += 2) {
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  p.on("pageerror", (e) => console.error("pageerror", e.message));
  await p.goto(`http://localhost:${port}/${process.env.PAGE || "planet.html"}?${a[i + 1]}`);
  await p.waitForFunction("window.__ready === true", { timeout: 60000 });
  await p.screenshot({ path: join(here, "shots", a[i] + ".png"), omitBackground: a[i + 1].includes("clean=1") });
  console.log("shot", a[i]);
  await p.close();
}
await b.close(); srv.close();
