import puppeteer from "puppeteer-core";
import path from "node:path";
const CHROME = process.env.CHROME || "C:/Users/36322/.cache/puppeteer/chrome-headless-shell/win64-150.0.7871.24/chrome-headless-shell-win64/chrome-headless-shell.exe";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files","--hide-scrollbars","--force-device-scale-factor=1"] });
const p = await b.newPage();
await p.setViewport({ width: 1920, height: 1080 });
await p.goto("file://" + path.resolve("index.html").replace(/\\/g,"/") + "?caps=1", { waitUntil: "networkidle0" });
await p.evaluate(() => document.fonts.ready);
const T = +process.argv[2] || 41;
const out = await p.evaluate((T) => {
  const tl = window.__timelines.main;
  tl.progress(0); tl.progress(T / +document.getElementById("root").dataset.duration);
  const rows = [];
  document.querySelectorAll("#hud > *, #stage > *").forEach((e) => {
    const cs = getComputedStyle(e);
    if (cs.visibility !== "visible" || +cs.opacity < 0.01) return;
    const r = e.getBoundingClientRect();
    const txt = (e.innerText || "").replace(/\s+/g, " ").slice(0, 40);
    rows.push({ cls: e.className, top: Math.round(r.top), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), op: +(+cs.opacity).toFixed(2), txt });
  });
  return rows;
}, T);
console.log(JSON.stringify(out, null, 1));
await b.close();
