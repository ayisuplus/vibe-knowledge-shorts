// 切 BGM，并在重击点让位，让撞击的低频有地方落。用法（在 videos/iphone-motion-test 下）：node tools/bgm.mjs
// 来源：第十四期 bgm-270.wav（Aurelia 系，112.96 BPM），2.303 s 起切，出处见 BRIEF.md 的未决项。
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, writeFileSync } from "node:fs";
import { B, DUR } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), ep14 = resolve(here, "../../../../第十四期/videos");
const src = resolve(ep14, readdirSync(ep14)[0], "assets/audio/bgm-270.wav"), SR = 44100;
const b = execFileSync("ffmpeg", ["-v", "error", "-ss", "2.303", "-t", String(DUR), "-i", src, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const DUCK = [[8, .5], [11, .45], [16, .5], [30, .5], [34, .62], [46, .4]];
for (let i = 0; i < x.length; i += 2) {
  const t = i / 2 / SR; let d = 0;
  for (const [n, a] of DUCK) { const u = t - B(n); if (u > -.015) d = Math.max(d, u < 0 ? a * (1 + u / .015) : a * Math.exp(-u * 3.2)); }
  const g = (1 - d) * Math.min(1, (DUR - t) / 1.2);
  x[i] *= g; x[i + 1] *= g;
}
const raw = resolve(here, "../renders/_bgm.f32");
writeFileSync(raw, Buffer.from(x.buffer));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "volume=-2.2dB", "-c:a", "aac", "-b:a", "192k", resolve(here, "../assets/audio/bgm.m4a")]);
console.log("bgm.m4a 完成");
