// 合成全片音效轨 assets/audio/sfx.m4a（90 秒，一条 audio 接进 index.html）。
// 素材是历期留下的 sfx/flac，复用不进 git（AGENTS 第 3 节）；本脚本把清单固化在这里。
// 时间戳 = 90 秒版吸附到 BGM 拍网格后的冲击点（见 tools/beatfit.mjs）。
// 用法（在 videos/words-retired 下）：node tools/sfx.mjs
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../../../..");
const OUT = resolve(HERE, "../assets/audio/sfx.m4a");
const DUR = 90;

const S = (p) => resolve(REPO, p);
const RAW9 = "第九期/videos/markdown/sfx/raw/";
const RAW2 = "第二期/videos/she-economy/sfx/raw/";
const RAW1 = "第一期/videos/info-funnel/sfx/raw/";
const RAW6 = "第六期/videos/ai-communism/sfx/raw/";

// [开始秒, 文件, 音量, 说明]
const EV = [
  [0.42, RAW2 + "thud.flac", 0.55, "S1 纸落定"],
  [0.85, RAW2 + "typewriter.flac", 0.28, "S1 标题打字"],
  [3.85, RAW9 + "marker.flac", 0.40, "S1 红笔划掉停止使用"],
  [4.14, RAW1 + "slam.flac", 0.55, "S1 拟同意章"],
  [6.53, RAW2 + "whoosh.flac", 0.32, "S1→S2 换纸"],
  [13.17, RAW2 + "stamp.flac", 0.55, "S2 停用章"],
  [15.29, RAW9 + "pageflip.flac", 0.45, "S2 翻页"],
  [22.99, RAW2 + "whoosh.flac", 0.32, "S2→S3 换纸"],
  [29.63, RAW2 + "stamp.flac", 0.45, "S3 在用章"],
  [33.60, RAW2 + "typewriter.flac", 0.26, "S3 搜索框打字"],
  [35.48, RAW6 + "scan.flac", 0.34, "S3 扫描带"],
  [37.60, RAW2 + "stamp.flac", 0.55, "S3 查无此词章"],
  [41.32, RAW2 + "whoosh.flac", 0.30, "S4 两卡滑入"],
  [48.22, RAW1 + "slam.flac", 0.55, "S4 同根章"],
  [56.99, RAW2 + "whoosh.flac", 0.30, "S5 传真滚入"],
  [58.50, RAW2 + "typewriter.flac", 0.26, "S5 标题打字"],
  [63.10, RAW2 + "stamp.flac", 0.55, "S5 批准章"],
  [65.49, RAW2 + "whoosh.flac", 0.30, "S5 表顶入"],
  [66.52, RAW9 + "marker.flac", 0.42, "S5 划叉 打工人"],
  [68.42, RAW9 + "marker.flac", 0.42, "S5 划叉 形式主义"],
  [69.74, RAW2 + "thud.flac", 0.55, "S5 柱合拢"],
  [70.80, RAW1 + "shatter.flac", 0.60, "S5 断裂"],
  [78.24, RAW9 + "swell.flac", 0.38, "S6 金句"],
  [79.56, RAW2 + "stamp.flac", 0.50, "S6 已归档章"],
  [83.02, RAW9 + "tap.flac", 0.30, "S6 问句一"],
  [84.34, RAW9 + "tap.flac", 0.30, "S6 问句二"],
];

const args = ["-v", "error", "-y"];
for (const [, f] of EV) args.push("-i", S(f));
const fc = [];
EV.forEach(([, f, v], i) => {
  const ms = Math.round(EV[i][0] * 1000);
  fc.push(`[${i}:a]aformat=channel_layouts=stereo,volume=${v},adelay=${ms}|${ms}[a${i}]`);
});
fc.push(EV.map((_, i) => `[a${i}]`).join("") +
  `amix=inputs=${EV.length}:normalize=0,alimiter=limit=0.89,apad,atrim=0:${DUR},afade=t=out:st=88.5:d=1.5[mix]`);
args.push("-filter_complex", fc.join(";"), "-map", "[mix]",
  "-t", String(DUR), "-c:a", "aac", "-b:a", "192k", OUT);
execFileSync("ffmpeg", args, { stdio: "inherit" });
console.log(`\nsfx.m4a 完成：${EV.length} 个事件 / ${DUR}s -> ${OUT}`);
