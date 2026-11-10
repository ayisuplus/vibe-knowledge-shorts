// 切 BGM：0 到「五盏红灯熄灭」（OUT）是静音，音乐从 OUT 那一刻在重拍上砸进来，结尾不收、硬切。
// 用法（在 videos/rb19-analysis 下）：node tools/bgm.mjs
// 来源：Aurelia 系 bgm-270.wav（112.96 BPM），从 2.303 s（重拍，../../../tools/beatfit.mjs 求得）起切。
// 用户 2026-11-09：这条已被抖音官方收录为 BGM，继续沿用。
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { TMP, publish } from "./publish.mjs";
import { DUR, OUT } from "../assets/js/beats.js";
import { BRAKES5, STALL_HITS, SLAM, PENALTY } from "../assets/js/timeline.js";

const here = dirname(fileURLToPath(import.meta.url)), src = resolve(here, "../assets/audio/bgm-270.wav"), SR = 44100, CUT = 2.303;
const b = execFileSync("ffmpeg", ["-v", "error", "-ss", String(CUT), "-t", String(DUR - OUT), "-i", src, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
const m = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
const n = Math.round(DUR * SR) * 2, x = new Float32Array(n), off = Math.round(OUT * SR) * 2;
x.set(m.subarray(0, Math.min(m.length, n - off)), off);
// 让位：重击的拟音（刹车等）响时音乐短暂压低
const DUCK = [...BRAKES5.map(([on]) => [on, .4]), ...STALL_HITS.map((h) => [h, .45]), [SLAM, .4], [PENALTY, .35]];
for (let i = 0; i < n; i += 2) {
  const t = i / 2 / SR; let d = 0;
  for (const [h, a] of DUCK) { const u = t - h; if (u > -.02) d = Math.max(d, u < 0 ? a * (1 + u / .02) : a * Math.exp(-u * 2.4)); }
  const g = (1 - d) * Math.min(1, Math.max(0, (t - OUT) / .012)); x[i] *= g; x[i + 1] *= g;
}
const raw = join(TMP, "bgm.f32"), m4a = join(TMP, "bgm.m4a");
writeFileSync(raw, Buffer.from(x.buffer));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "afade=t=out:st=" + (DUR - .12).toFixed(3) + ":d=0.12,alimiter=limit=0.46:attack=5:release=80:level=false", "-c:a", "aac", "-b:a", "192k", m4a]);
publish(m4a, resolve(here, "../assets/audio/bgm.m4a"));
console.log(`bgm.m4a 完成：${DUR}s，音乐从 ${OUT.toFixed(3)}s 进`);
