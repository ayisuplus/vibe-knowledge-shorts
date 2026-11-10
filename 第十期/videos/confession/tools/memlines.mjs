// 把真实的 MEMORY.md（记忆索引）和第九期分镜的最后几行冻结成 assets/img/memory.js，结尾编辑器里原样显示。
// 用法：node tools/memlines.mjs   （改了源文件后重跑；片子里用的是冻结那一刻的样子）
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const memDir = join(os.homedir(), ".claude/projects/E--projects------vibe----/memory");
const mem = readFileSync(join(memDir, "MEMORY.md"), "utf8").replace(/\r/g, "").split("\n").filter((l) => l.trim());
const sbPath = join(here, "../../../第九期/03-分镜脚本/分镜脚本.md");
const sb = readFileSync(sbPath, "utf8").replace(/\r/g, "").split("\n");
while (sb.length && !sb[sb.length - 1].trim()) sb.pop();
const tail = sb.slice(-14);
const files = ["MEMORY.md", ...mem.map((l) => (l.match(/\(([^)]+\.md)\)/) || [])[1]).filter(Boolean)];
writeFileSync(join(here, "assets/img/memory.js"),
  `// 自动生成（tools/memlines.mjs）：真实文件的原文，冻结于 ${new Date().toISOString().slice(0, 10)}\nwindow.MEM = ${JSON.stringify({ index: mem, sbTail: tail, sbLineNo: sb.length, files }, null, 1)};\n`);
mkdirSync(join(here, "../../02-素材/memory-snapshot"), { recursive: true });
copyFileSync(join(memDir, "MEMORY.md"), join(here, "../../02-素材/memory-snapshot/MEMORY.md"));
console.log("index", mem.length, "lines; storyboard", sb.length, "lines; last:", tail[tail.length - 1]);
