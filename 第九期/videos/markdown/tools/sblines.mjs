// 把真实的分镜脚本（03-分镜脚本/分镜脚本.md）导出成 assets/img/storyboard.js，S7 的编辑器里显示的就是它。
// 最后一行「- [ ] 第十期：」不导出：片子里由光标现场敲出来。
// 用法：node tools/sblines.mjs   （改过分镜脚本后重新跑一次）
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(here, "../../03-分镜脚本/分镜脚本.md");
let lines = readFileSync(src, "utf8").replace(/\r/g, "").split("\n");
while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
if (lines[lines.length - 1].startsWith("- [ ] 第十期")) lines.pop();
while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
writeFileSync(join(here, "assets/img/storyboard.js"), `window.SB = ${JSON.stringify(lines)};\n`, "utf8");
console.log("storyboard lines:", lines.length);
