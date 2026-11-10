// 拆机声一响，音乐就让一点，放开时自然回来，这样细小的咔哒不会被连续八分音符盖住。最后两轨一起补回响度。
// 用法（在 videos/ak-teardown 下，顺序 bgm → sfx → duck）：node tools/duck.mjs
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { TMP, publish } from "./publish.mjs";

const here = dirname(fileURLToPath(import.meta.url)), a = (f) => resolve(here, "../assets/audio", f);
const GAIN = process.argv[2] || "2.2dB";
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", a("bgm.m4a"), "-i", a("sfx.m4a"), "-filter_complex", `[1:a]asplit[k][f];[0:a][k]sidechaincompress=threshold=0.03:ratio=3:attack=2:release=140:makeup=1,volume=${GAIN}[o];[f]volume=${GAIN}[s]`, "-map", "[o]", "-c:a", "aac", "-b:a", "192k", join(TMP, "bgm-ducked.m4a"), "-map", "[s]", "-c:a", "aac", "-b:a", "192k", join(TMP, "sfx-gain.m4a")]);
publish(join(TMP, "bgm-ducked.m4a"), a("bgm.m4a")); publish(join(TMP, "sfx-gain.m4a"), a("sfx.m4a"));
console.log("bgm.m4a 已按拟音让位");
