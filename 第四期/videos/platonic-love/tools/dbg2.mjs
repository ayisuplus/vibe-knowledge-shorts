// 调试：不经 HyperFrames 运行时，直接加载页面、跳到指定时间，打印某个元素的变换与告警来源。
// 用法：node tools/dbg.mjs <file-url> "[t1,t2,...]" [elementId]
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";

const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--allow-file-access-from-files"] });
const p = await b.newPage();
await p.setViewport({ width: 1080, height: 1920 });
p.on("console", (m) => console.log("console:", m.text()));
p.on("pageerror", (e) => console.log("pageerror:", e.message));
await p.evaluateOnNewDocument(() => {
  window.__timelines = {};
  const w = console.warn;
  console.warn = (...a) => w(...a, new Error().stack.split("\n").slice(2, 6).join(" | "));
});
await p.goto(process.argv[2], { waitUntil: "load" });
const id = process.argv[4] || "teacher";
const out = await p.evaluate((ts, id) => ts.map((t) => {
  const tl = window.__timelines.main; tl.seek(t, false);
  const e = document.getElementById(id);
  return { t, y: gsap.getProperty(e, "y"), ops: [...e.children].map(c=>c.style.opacity).join(",") };
}), JSON.parse(process.argv[3]), id);
console.log(JSON.stringify(out));
await b.close();
