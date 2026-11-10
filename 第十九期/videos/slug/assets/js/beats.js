// 时间轴：第 N 期《片名》。无旁白，一律以秒为单位。
// 分镜按「拍」写，这里统一换算：B(n) = n 拍 = n × BEAT 秒。
// 改片长：改 DUR 与下面的拍数（分镜脚本同步），没有第三处。

export const BEAT = 0.0;   // 填本期 BGM 拍长（秒），例 112.96 BPM → 0.53116
export const DUR = 90;     // 填本期总时长
export const B = (n) => n * BEAT;

/** 段落窗口（秒），按分镜填拍数 */
export const SEC = {
  s1: [0, B(0)],
  s2: [B(0), B(0)],
  s3: [B(0), B(0)],
  s4: [B(0), B(0)],
  s5: [B(0), B(0)],
  s6: [B(0), DUR],
};

/** 版面常量（按本期主视觉填） */
export const L = {};

/** 顶中时代标签：[换字时刻, 文字]；空串 = 收起 */
export const ERA = [
  [0, ""],
];
