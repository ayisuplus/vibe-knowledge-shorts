// 节拍表：全片唯一的节奏来源。
// BGM 实测 112.96 BPM；一小节四拍，成片正好 40 小节 = 84.99 秒。
// 所有切段、数字跳变、线上抬、圈扩张，都从这里取时间。

export const BPM = 112.96;
export const BEAT = 60 / BPM;        // 0.53116 秒
/** 一拍一步 / 一拍两步：速度锁在这两个值上，脚落地就正好踩在拍上 */
export const SLOW = 1 / BEAT;   // 1.883 步/秒
export const FAST = 2 / BEAT;   // 3.766 步/秒
export const BAR = 4 * BEAT;         // 2.12466 秒

/** 第 n 拍 */
export const B = (n) => n * BEAT;
/** 第 n 小节 */
export const BB = (n) => n * BAR;

export const DUR = BB(40);           // 84.986

/** 段落：小节数写成 [起, 止]，代码里一律用 BB() */
export const SEC = {
  hook:  [BB(0),  BB(4)],    // 0.000 –  8.499  钩子
  title: [BB(4),  BB(6)],    // 8.499 – 12.748  片名
  queen: [BB(6),  BB(14)],   // 12.748 – 29.745 红皇后即位
  line:  [BB(14), BB(22)],   // 29.745 – 46.742 举证一 · 及格线
  hours: [BB(22), BB(30)],   // 46.742 – 63.740 举证二 · 工时的账
  rings: [BB(30), BB(36)],   // 63.740 – 76.486 举证三 · 范围
  out:   [BB(36), BB(40)],   // 76.486 – 84.986 收
};

/** 这一拍走了多少（0→1，dur 秒内走完，之后停住）。用来做「一击」 */
export function hit(t, dur = 0.13) {
  const p = t - Math.floor(t / BEAT) * BEAT;
  return p >= dur ? 1 : p / dur;
}

/** 自 at 起，在 dur 秒内完成的进度（带一点加速感，落点在拍上） */
export function settle(t, at, dur = 0.18) {
  const p = (t - at) / dur;
  return p <= 0 ? 0 : p >= 1 ? 1 : p * p * (3 - 2 * p);
}

/** 小节内的相位 0→1，用来做「呼吸」 */
export const barPhase = (t) => (t % BAR) / BAR;

/** t 落在第几拍（整数） */
export const beatNo = (t) => Math.floor(t / BEAT);
