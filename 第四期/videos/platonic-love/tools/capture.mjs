// 用缓存的 chrome-headless-shell 截取网页（不用用户的 Chrome）。不点任何同意按钮，只把遮挡的弹层隐藏掉。
// 用法：node tools/capture.mjs <名字> <网址> [宽] [高] [向下滚动像素]
import puppeteer from "puppeteer-core";
import os from "node:os";
import { join } from "node:path";
import { readdirSync } from "node:fs";
const [name, url, W = "1200", H = "1500", scroll = "0"] = process.argv.slice(2);
const root = join(os.homedir(), ".cache/puppeteer/chrome-headless-shell");
const v = readdirSync(root).sort().pop();
const b = await puppeteer.launch({ executablePath: join(root, v, "chrome-headless-shell-win64/chrome-headless-shell.exe"), args: ["--lang=zh-CN"] });
const p = await b.newPage();
await p.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36");
await p.setViewport({ width: +W, height: +H, deviceScaleFactor: 2 });
try { await p.goto(url, { waitUntil: "networkidle2", timeout: 45000 }); } catch (e) { console.log("goto:", e.message); }
await new Promise((r) => setTimeout(r, 2500));
// 隐藏常见的 cookie / 登录 / 订阅弹层（不点同意）
await p.evaluate(() => {
  const kill = /cookie|consent|gdpr|onetrust|banner|modal|overlay|popup|subscribe|login-guide|toast/i;
  document.querySelectorAll("body *").forEach((e) => {
    const s = getComputedStyle(e);
    if ((s.position === "fixed" || s.position === "sticky") && (kill.test(e.className + " " + e.id) || +s.zIndex > 999)) e.style.display = "none";
  });
  document.documentElement.style.overflow = "auto"; document.body.style.overflow = "auto";
});
if (+scroll) await p.evaluate((y) => window.scrollTo(0, y), +scroll);
await new Promise((r) => setTimeout(r, 800));
await p.screenshot({ path: `web-src/${name}.png` });
console.log("saved", name, await p.title());
await b.close();
