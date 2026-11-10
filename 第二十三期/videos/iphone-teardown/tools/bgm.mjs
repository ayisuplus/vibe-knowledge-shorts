// 切 BGM，并在重击点让位，让撞击的低频有地方落。结尾不收，硬切。限幅压住音乐的峰值，给拆机声留出余量。用法（在 videos/iphone-teardown 下）：node tools/bgm.mjs
// 来源：第十四期 bgm-270.wav（Aurelia 系，112.96 BPM），2.303 s 起切，出处见 BRIEF.md 的未决项。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { TMP, publish } from "./publish.mjs";
import { B, DUR } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), ep14 = resolve(here, "../../../../第十四期/videos");
const src = resolve(ep14, readdirSync(ep14)[0], "assets/audio/bgm-270.wav"), SR = 44100;
const b = execFileSync("ffmpeg", ["-v", "error", "-ss", "2.303", "-t", String(DUR), "-i", src, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const DUCK = [[12, .5], [36, .5], [80, .4], [86, .55], [90, .4], [113, .62], [125, .45], [48.8, .3], [52, .3], [59, .42], [61, .42], [63, .42], [65, .42], [84.2, .35], ...Array.from({ length: 13 }, (_, i) => [28 + i * .5, .3])];
for (let i = 0; i < x.length; i += 2) {
  const t = i / 2 / SR; let d = 0;
  for (const [n, a] of DUCK) { const u = t - B(n); if (u > -.015) d = Math.max(d, u < 0 ? a * (1 + u / .015) : a * Math.exp(-u * 3.2)); }
  x[i] *= 1 - d; x[i + 1] *= 1 - d;
}
const raw = join(TMP, "bgm.f32"), m4a = join(TMP, "bgm.m4a");
writeFileSync(raw, Buffer.from(x.buffer));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "volume=0.1dB,alimiter=limit=0.46:attack=5:release=80:level=false", "-c:a", "aac", "-b:a", "192k", m4a]);
publish(m4a, resolve(here, "../assets/audio/bgm.m4a"));
console.log("bgm.m4a 完成");
