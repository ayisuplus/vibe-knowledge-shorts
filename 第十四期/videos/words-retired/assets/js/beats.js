// 时间轴：第十四期为无旁白 · 字幕驱动，一律以秒为单位。
// 【90 秒版】时间轴只有这一份真相：DUR + SEC。段内所有时间点直接写 90 秒轴的秒数，
// 不再做「旧轴 → 新轴」的映射（158 秒版的 remap / OLD 已废弃）。
// 改片长：改 DUR 与 SEC，再按比例调 sections.js 里的绝对秒；没有第三处。

export const DUR = 90;

/** 段落窗口（秒，左闭右闭） */
export const SEC = {
  hook: [0, 7],        // S1 钩子：红头函落下 + 盖章
  dg:   [7, 24],       // S2 打工人：档案 → 接替表
  xs:   [24, 41],      // S3 形式主义：档案 → 场域对照
  root: [41, 57],      // S4 同根：两卡 → 汇流 → 根节点
  ai:   [57, 78],      // S5 AI 接管：新函 → 批复表 → 断裂柱
  out:  [78, 90],      // S6 收束：金句 → 黑场问句
};

/** 纸的设计尺寸（style.css 里 .paper/.dossier/.rev/.maxim 同尺寸） */
export const PW = 1240, PH = 860;
/** 纸在 1920×1080 舞台上的居中位置 */
export const PX = (1920 - PW) / 2, PY = (1080 - PH) / 2 - 10;

/** 逐字打印：把 f(0..1) 映射为 full 的前 n 个字 */
export function typed(elNode, full, f) {
  const chars = Array.from(full);
  const n = Math.round(Math.min(1, Math.max(0, f)) * chars.length);
  elNode.textContent = chars.slice(0, n).join("");
}
