// 从 assets/js/captions.js 导出 SRT：只出中文（去掉 <hi> 等标签），含 noshow 的片尾问句。英文对照不进 SRT（抖音只用中文）。
// 用法：node tools/srt.mjs [输出路径]   默认 renders/pattern-tape.srt
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = {};
new Function("window", readFileSync(join(here, "assets/js/captions.js"), "utf8"))(win);
const ts = (s) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
const strip = (s) => s.replace(/<[^>]+>/g, "");
const out = win.CAPTIONS.map(([t0, t1, main], i) => `${i + 1}\n${ts(t0)} --> ${ts(t1)}\n${strip(main)}\n`).join("\n");
const dst = process.argv[2] || join(here, "renders/pattern-tape.srt");
mkdirSync(dirname(dst), { recursive: true });
writeFileSync(dst, "﻿" + out, "utf8");
console.log(dst, win.CAPTIONS.length, "条");
