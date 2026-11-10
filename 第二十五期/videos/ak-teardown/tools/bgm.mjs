// 切 BGM，并在重击点让位。结尾不收，硬切。用法（在 videos/ak-teardown 下）：node tools/bgm.mjs
// 来源：第十四期 bgm-270.wav（Aurelia 系，112.96 BPM），2.303 s 起切；原始出处未记录，不声称已获授权。
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readdirSync, writeFileSync } from "node:fs";
import { TMP, publish } from "./publish.mjs";
import { B, DUR, HITS } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), ep14 = resolve(here, "../../../../第十四期/videos");
const src = resolve(ep14, readdirSync(ep14)[0], "assets/audio/bgm-270.wav"), SR = 44100;
const b = execFileSync("ffmpeg", ["-v", "error", "-ss", "2.303", "-t", String(DUR), "-i", src, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
// 慢放段整体压低一点，让机械声站到前面；击发、撞底、锁死、真实速度四下再让位
const DUCK = HITS.map((n) => [n, .55]);
for (let i = 0; i < x.length; i += 2) {
  const t = i / 2 / SR; let d = 0;
  for (const [n, a] of DUCK) { const u = t - B(n); if (u > -.015) d = Math.max(d, u < 0 ? a * (1 + u / .015) : a * Math.exp(-u * 3.2)); }
  const slow = t > B(50) && t < B(76.6) ? .25 : 0;
  const g = (1 - d) * (1 - slow); x[i] *= g; x[i + 1] *= g;
}
const raw = join(TMP, "bgm.f32"), m4a = join(TMP, "bgm.m4a");
writeFileSync(raw, Buffer.from(x.buffer));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "volume=0.1dB,alimiter=limit=0.46:attack=5:release=80:level=false", "-c:a", "aac", "-b:a", "192k", m4a]);
publish(m4a, resolve(here, "../assets/audio/bgm.m4a"));
console.log("bgm.m4a 完成");
