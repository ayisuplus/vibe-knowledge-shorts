// 本期拟音脚本（唯一需要每期写的工具）：只负责「在第几拍放什么」。
// 合成/混响/压限/写文件全部来自共享引擎，不要在本文件里重复实现。
// 用法（在 videos/slug 下）：node tools/sfx.mjs
import { resolve } from "node:path";
import { createSfxEngine } from "../../../../tools/lib/sfx-engine.mjs";
import { BEAT, B, DUR, ERA } from "../assets/js/beats.js";

const fx = await createSfxEngine({
  dur: DUR,
  repo: resolve("../../../../"),
  out: resolve("../assets/audio/sfx.m4a"),
});

/* 在这里按分镜放置声音，例：
  fx.place(fx.knock, B(4), 0.2, { tag: "knock" });
  fx.place(fx.bell(698.46), B(8), 0.12, { tag: "bell" });
  // 复用历期 raw：fx.place(fx.cut(fx.raw("第九期/videos/markdown/sfx/raw/pageflip.flac"), 0, 1), B(30), 0.2, { tag: "page" });
*/

const r = await fx.finalize();
console.log(`sfx.m4a 完成：${r.events} 个事件 / ${DUR}s`);
