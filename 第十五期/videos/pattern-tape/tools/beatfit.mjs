// 卡点：把本片的整拍网格 B(n) = n·0.53116 s 对到 bgm-270.wav 的拍上，算出 BGM 切入点，并（--build）做成 assets/audio/bgm.m4a。
//
// 结论（在 bgm-270.wav 上实测，未人耳核对）：
//   1) 织体是连续的八分音符，整拍（相位 A）与半拍（相位 B = A + 半拍）都有起音，单靠「哪个相位起音多」分不出正拍。
//      第十三、十四期的 RMS 法落在 B；本期用结构证据重新定：疏密切换的第一个起音（music 10.80 / 17.17 / 46.93 / 78.79 s）
//      全部落在 A，且都是 4 拍的整数倍 → A 是正拍，小节线在 A + 4m 拍。
//   2) 本片所有重击点都在 B(n) 上，所以切入点 = A + 4 拍（跳过 bgm-270 开头约 2.3 s 的安静前奏，从第一个满小节起）。
//      这样 film 的 n16 / n28 / n84 / n144 正好对上音乐的疏密切换点（S1→S2、S2 里线稿起势前、S3 织完收速、「今天」）。
//   3) bgm-270 调性：F 小调（chroma 相关 0.81），tools/sfx.mjs 的拨弦 / 铃 / 嘀声按 F 小调五声音阶。
//
// 用法（在 videos/pattern-tape 下）：node tools/beatfit.mjs [--build]
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BEAT, DUR } from "../assets/js/beats.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const BGM = resolve(HERE, "../assets/audio/bgm-270.wav");
const OUT = resolve(HERE, "../assets/audio/bgm.m4a");
const SR = 22050, N = 1024, HOP = 128, CENTRE = N / 2 / SR;
const EDGES = [10.80, 17.17, 46.93, 78.79];     // 疏密切换处的粗略位置（music 秒），下面在 ±60 ms 内取谱通量峰

const tmp = mkdtempSync(join(tmpdir(), "beatfit-"));
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", BGM, "-ac", "1", "-ar", String(SR), "-f", "s16le", join(tmp, "x.raw")]);
const buf = readFileSync(join(tmp, "x.raw"));
const x = new Float32Array(buf.length / 2);
for (let i = 0; i < x.length; i++) x[i] = buf.readInt16LE(i * 2) / 32768;

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
const win = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N));
const frames = Math.floor((x.length - N) / HOP), fps = SR / HOP;
const flux = new Float32Array(frames);
{ let prev = new Float32Array(N / 2);
  for (let f = 0; f < frames; f++) {
    const re = new Float32Array(N), im = new Float32Array(N);
    for (let i = 0; i < N; i++) re[i] = x[f * HOP + i] * win[i];
    fft(re, im);
    const mag = new Float32Array(N / 2);
    for (let k = 1; k < N / 2; k++) { mag[k] = Math.log(1 + 40 * Math.hypot(re[k], im[k]) / N * 2); if (k * SR / N < 6000) flux[f] += Math.max(0, mag[k] - prev[k]); }
    prev = mag;
  } }

// 每个切换点的真实起音时刻，再对 BEAT 取圆周平均 → 相位 A
let cs = 0, sn = 0;
const found = EDGES.map((e) => {
  let best = -1, bt = e;
  for (let f = Math.round((e - 0.06 - CENTRE) * fps); f <= Math.round((e + 0.06 - CENTRE) * fps); f++) if (flux[f] > best) { best = flux[f]; bt = f / fps + CENTRE; }
  const a = (bt % BEAT) / BEAT * 2 * Math.PI; cs += Math.cos(a); sn += Math.sin(a);
  return bt;
});
const phase = ((Math.atan2(sn, cs) / (2 * Math.PI)) * BEAT + BEAT) % BEAT;
const cut = phase + 4 * BEAT;
console.log(`疏密切换点（music 秒）：${found.map((t) => t.toFixed(3)).join("  ")}`);
console.log(`拍相位 A = ${phase.toFixed(3)} s（beat = ${BEAT} s，bar = ${(4 * BEAT).toFixed(3)} s）`);
console.log(`BGM 切入点 = A + 4 拍 = ${cut.toFixed(3)} s（film n 对应 music 第 n+4 拍）`);
console.log("film 拍 ↔ 音乐切换点：" + found.map((t) => `n${Math.round((t - cut) / BEAT)}`).join("  ") + "   （应为 n16 n28 n84 n144）");
rmSync(tmp, { recursive: true, force: true });

if (process.argv.includes("--build")) {
  // 头 1 s 淡入（film 从音乐的小节线起，短淡入只为去掉切口），尾 6 s 淡出；不加增益——与 sfx.m4a 混合实测 −14.1 LUFS / 峰值 −1.1 dBFS
  execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", cut.toFixed(3), "-t", String(DUR), "-i", BGM,
    "-af", `afade=t=in:st=0:d=1.0:curve=qsin,afade=t=out:st=${DUR - 6}:d=6:curve=qsin`, "-c:a", "aac", "-b:a", "192k", OUT], { stdio: "inherit" });
  console.log(`bgm.m4a 完成 -> ${OUT}`);
}
