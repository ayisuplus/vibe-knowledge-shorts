// 卡点：把 sections.js 的关键冲击点吸附到 BGM 拍网格上。
// 拍网格：beat = 0.53116s（112.96 BPM），bar = 2.12466s —— 第十三期在同源 Aurelia 系 BGM 上实测，
// 本仓库 `第一期/audio/Aurelia…-节拍参考音.mp3` 与 bgm-270.wav 的八分网格拟合复核过（半拍 0.2656s 命中率 48%/40%）。
//
// 输出两样东西：
//   1) BGM 应从 bgm-270.wav 的第几秒切入（即 bgm.m4a 重做时的 -ss 值）；
//   2) 每个冲击点吸附到拍点后的秒数与 Δ（|Δ|>0.12s 的标 *，说明这段节奏本身要改）。
//
// 用法（在 videos/words-retired 下）：node tools/beatfit.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const BGM = resolve(HERE, "../assets/audio/bgm-270.wav");
const CLICK = join(REPO, "第一期/audio/Aurelia - We Never Choose（改编版）-节拍参考音.mp3");

const BEAT = 0.53116, BAR = BEAT * 4;
const tmp = mkdtempSync(join(tmpdir(), "beatfit-"));

function onsets(file) {
  const out = join(tmp, "x.raw");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", "4000", "-f", "s16le", out]);
  const buf = readFileSync(out);
  const HOP = 40, n = buf.length / 2, f = Math.floor(n / HOP);
  const env = new Float64Array(f);
  for (let i = 0; i < f; i++) {
    let s = 0;
    for (let j = 0; j < HOP; j++) { const v = buf.readInt16LE((i * HOP + j) * 2) / 32768; s += v * v; }
    env[i] = Math.sqrt(s / HOP);
  }
  const o = [];
  for (let i = 1; i < f; i++) o.push(Math.max(0, env[i] - env[i - 1]));
  const th = 0.25 * Math.max(...o), pk = [];
  for (let i = 1; i < f - 1; i++) {
    if (o[i] > th && o[i] >= o[i - 1] && o[i] > o[i + 1] && (!pk.length || i - pk[pk.length - 1] >= 20)) pk.push(i * 0.01);
  }
  return pk;
}
function fitPhase(pk, P, tol = 0.05) {
  let bestPhase = 0, bestScore = -1;
  for (let ph = 0; ph < P; ph += 0.002) {
    let sc = 0;
    for (const t of pk) { const x = ((t - ph) % P + P) % P; if (Math.min(x, P - x) <= tol) sc++; }
    if (sc > bestScore) { bestScore = sc; bestPhase = ph; }
  }
  return { phase: bestPhase, hit: bestScore / pk.length };
}

// 1) 网格复核（八分 0.2656s 与整拍 0.53116s 都要对上）
const clk = onsets(CLICK), bgm = onsets(BGM);
const half = fitPhase(clk, BEAT / 2), halfB = fitPhase(bgm, BEAT / 2);
console.log(`拍点网格复核：参考音 半拍命中率 ${(half.hit * 100).toFixed(0)}%，bgm-270 半拍命中率 ${(halfB.hit * 100).toFixed(0)}%（>35% 即认定同源）`);
const { phase } = fitPhase(bgm, BEAT); // bgm-270 的拍相位
console.log(`bgm-270 拍相位：${phase.toFixed(3)}s（beat=${BEAT}s, bar=${BAR}s）`);

// 2) 关键冲击点（sections.js 当前绝对秒）。[名字, 秒, 轻重]
//    heavy = 章/断裂/金句等重音 → 吸到整拍；light = 换纸/扫描/入场等 → 吸到八分。
const HITS = [
  ["S1 纸落定", 0.35, "heavy"], ["S1 拟同意章", 4.20, "heavy"], ["S1→S2 换纸", 6.55, "light"],
  ["S2 停用章", 13.20, "heavy"], ["S2 翻页", 15.20, "light"], ["S2→S3 换纸", 23.10, "light"],
  ["S3 在用章", 29.75, "heavy"], ["S3 扫描带", 35.35, "light"], ["S3 查无此词章", 37.60, "heavy"],
  ["S4 两卡滑入", 41.30, "light"], ["S4 同根章", 48.10, "heavy"],
  ["S5 传真滚入", 57.00, "light"], ["S5 批准章", 63.10, "heavy"], ["S5 表顶入", 65.50, "light"], ["S5 红叉", 66.85, "light"],
  ["S5 柱合拢", 69.70, "heavy"], ["S5 断裂", 70.90, "heavy"],
  ["S6 金句", 78.35, "heavy"], ["S6 已归档章", 79.55, "heavy"], ["S6 黑场", 81.45, "heavy"], ["S6 问句一", 83.05, "light"], ["S6 问句二", 84.25, "light"],
];
const grid = (h) => (h[2] === "heavy" ? BEAT : BEAT / 2);
// 音轨从 bgm-270 第 cut 秒切入：拍点落在电影时间 phase + k*BEAT - cut
const totalErr = (cut) => HITS.reduce((acc, h) => {
  const P = grid(h), x = ((h[1] + cut - phase) % P + P) % P;
  return acc + Math.min(x, P - x);
}, 0);
let cut = 0, cutErr = Infinity;
for (let c = 0; c < BAR; c += 0.001) { const e = totalErr(c); if (e < cutErr) { cutErr = e; cut = c; } }
console.log(`\nBGM 切入点：bgm-270.wav 第 ${cut.toFixed(3)}s（均值偏差 ${(cutErr / HITS.length).toFixed(3)}s）`);
console.log("点位吸附建议（Δ>0.12s 标 *，这种点建议改动画节奏而不是挪点）：");
const snapped = [];
for (const [name, h, w] of HITS) {
  const P = grid(h);
  const g = phase + Math.round((h + cut - phase) / P) * P - cut;
  const d = g - h;
  snapped.push({ name, from: h, to: +g.toFixed(3), delta: +d.toFixed(3), weight: w });
  console.log(`  ${name.padEnd(13)} ${w.padEnd(5)} ${h.toFixed(2)} -> ${g.toFixed(2)}  Δ=${d >= 0 ? "+" : ""}${d.toFixed(2)}${Math.abs(d) > 0.12 ? " *" : ""}`);
}
rmSync(tmp, { recursive: true, force: true });
export { cut, snapped };
