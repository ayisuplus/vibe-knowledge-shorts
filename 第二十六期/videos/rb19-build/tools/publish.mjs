// 百度网盘同步会短暂占住刚写好的文件，所以音频先在系统临时目录里生成，再带重试地复制回工程。
import { copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const TMP = join(tmpdir(), "vibe26-audio");
mkdirSync(TMP, { recursive: true });
export function publish(src, dst, tries = 40) {
  for (let i = 0; ; i++) {
    try { copyFileSync(src, dst); return; }
    catch (e) { if (i >= tries || !["EBUSY", "EPERM", "EACCES"].includes(e.code)) throw e; Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3000); }
  }
}
