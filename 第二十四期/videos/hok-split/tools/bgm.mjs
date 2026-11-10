// 切 BGM：从实测第一拍切入（画面的 B(n) 跟着这条音乐的拍点走，见 assets/audio/beatmap.json），
// 在重击点让位，S4 论点句「停半拍」，问句结束（引用卡开始）时硬切。限幅压住音乐峰值，给拟音留余量。
// 用法（在 videos/hok-split 下）：node tools/bgm.mjs
// 音乐来源：AI 生成（本机 ComfyUI 的 MiniMax Music 3），提示词与种子见 ../../04-声音/music/gen.py。
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { TMP, publish } from "./publish.mjs";
import { B, CUE, CARD_N, DUR } from "../assets/js/beats.js";

const here = dirname(fileURLToPath(import.meta.url)), ep = resolve(here, "../../..");
const bm = JSON.parse(readFileSync(resolve(here, "../assets/audio/beatmap.json"), "utf8"));
const src = resolve(ep, "04-声音/music", bm.src), SR = 44100;
const b = execFileSync("ffmpeg", ["-v", "error", "-ss", String(bm.cut), "-t", String(DUR), "-i", src, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 29 });
const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
// 人声检测（../../04-声音/music/vocal_check.py）：2401 整首人声成分 −17.6 dB，但开头 0–6 秒分离出的「人声」几乎等于整段混音，
// 可能是 MiniMax 在开头放了哼唱（未经人耳确认）。稳妥起见，原曲 0–6.0 秒用「混音 − 人声轨」，6.0–6.5 秒交叉淡回原曲。
const VOX = resolve(ep, "04-声音/music/stems", bm.src.replace(/^raw\//, "").replace(/\.flac$/, "_vocals.flac"));
if (process.argv.includes("--no-vox-fix")) console.log("跳过开头人声处理");
else {
  const vb = execFileSync("ffmpeg", ["-v", "error", "-ss", String(bm.cut), "-t", "7", "-i", VOX, "-ac", "2", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 28 });
  const v = new Float32Array(vb.buffer.slice(vb.byteOffset, vb.byteOffset + vb.byteLength));
  const t0 = 6.0 - bm.cut, t1 = 6.5 - bm.cut;
  for (let i = 0; i < Math.min(v.length, x.length); i += 2) {
    const t = i / 2 / SR, k = t < t0 ? 1 : t < t1 ? 1 - (t - t0) / (t1 - t0) : 0;
    if (k <= 0) break;
    x[i] -= k * v[i]; x[i + 1] -= k * v[i + 1];
  }
}
const Q = (i) => B(CUE[i][0]);
// [秒, 让位深度]：墙落地、苹果咬一口、砸墙、全图亮灯（4 下抖动），以及华为闸门落下、两本账本落地
const DUCK = [[B(20), .55], [B(105), .5], [B(128), .6], [Q(29), .5], [Q(23) + 1.0, .4], [Q(20), .35], [Q(20) + 0.5, .35], [Q(4) + 0.5, .3], [Q(5) + 0.28, .4]];
const HOLD = [[Q(21), 0.5, .75]];                 // 论点句：停半拍（[起点, 时长, 深度]）
const END = B(CARD_N[0]);                          // 问句结束，硬切
for (let i = 0; i < x.length; i += 2) {
  const t = i / 2 / SR; let d = 0;
  for (const [h, a] of DUCK) { const u = t - h; if (u > -.015) d = Math.max(d, u < 0 ? a * (1 + u / .015) : a * Math.exp(-u * 3.2)); }
  for (const [h, len, a] of HOLD) { const u = t - h; if (u > -.03 && u < len + .25) d = Math.max(d, u < 0 ? a * (1 + u / .03) : u < len ? a : a * (1 - (u - len) / .25)); }
  if (t >= END) d = 1; else if (t > END - .012) d = Math.max(d, (t - (END - .012)) / .012);
  x[i] *= 1 - d; x[i + 1] *= 1 - d;
}
const raw = join(TMP, "bgm.f32"), m4a = join(TMP, "bgm.m4a");
writeFileSync(raw, Buffer.from(x.buffer));
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "f32le", "-ar", String(SR), "-ac", "2", "-i", raw, "-af", "alimiter=limit=0.5:attack=5:release=80:level=false", "-c:a", "aac", "-b:a", "192k", m4a]);
publish(m4a, resolve(here, "../assets/audio/bgm.m4a"));
console.log(`bgm.m4a 完成：${bm.src} 从 ${bm.cut}s 切入，${DUR.toFixed(2)}s，${END.toFixed(2)}s 硬切`);
