// 字幕（20 条，含片尾问句）。无旁白，字幕是信息载体，烧进母版；?nocaps=1 出无字幕版，?en=1 带英文对照。
// 时间 = 分镜脚本第二节的「入 n / 出 n」× 0.53116 s（与 beats.js 的 B() 同一个拍长）。改时间先改分镜，再改本文件。
// 格式：[t0, t1, "中文（<hi>…</hi> 为强调色）", "English", flag]。flag = "noshow"：只进 SRT，不在字幕带上画（问句由 S6 自己画）。
// 与分镜的两处差别（见 BRIEF）：#13 出入点放宽（148–153 → 146.5–153.7，读得过来）；#17 补「12 月」（调研档案 F-12 的口径）。
// 导出 SRT：node tools/srt.mjs --project=第十六期/videos/red-queen

const b = (n) => +(n * 0.53116).toFixed(2);

window.CAPTIONS = [
  /* 1  */ [b(2), b(12), "每个人都在努力生活。", "Everyone is trying hard to live."],
  /* 2  */ [b(14), b(22), "可社会，就<hi>一定</hi>会越来越好吗？", "But does society necessarily get better?"],
  /* 3  */ [b(24), b(34), "1871 年，《爱丽丝镜中奇遇》里，红皇后说：", "In 1871, in Through the Looking-Glass, the Red Queen says:"],
  /* 4  */ [b(36), b(46), "「你必须拼命奔跑，才能留在原地。」", "\"It takes all the running you can do, to keep in the same place.\""],
  /* 5  */ [b(48), b(56), "1973 年，范·瓦伦据此提出「红皇后假说」。", "In 1973, Van Valen proposed the Red Queen hypothesis."],
  /* 6  */ [b(58), b(68), "把努力画成箭头，你会发现它有<hi>两种</hi>。", "Draw effort as arrows — there are two kinds."],
  /* 7  */ [b(70), b(82), "同向的努力，彼此<hi>相加</hi>——把蛋糕做大。", "Aligned efforts add up — enlarging the pie."],
  /* 8  */ [b(84), b(96), "对顶的努力，彼此<hi>抵消</hi>——只是争夺位置。", "Opposing efforts cancel — merely fighting for position."],
  /* 9  */ [b(98), b(108), "人人都理性，加在一起却原地踏步；这是协调失败，也是公地的悲剧。", "All rational, yet collectively stuck — a coordination failure, a tragedy of the commons."],
  /* 10 */ [b(110), b(122), "越富裕，越多努力被挤入对「固定位置」的争夺。", "The richer we get, the more effort is spent on fixed positions."],
  /* 11 */ [b(124), b(136), "顶级名额、热门地段，本质是<hi>排名</hi>，无法被共同拥有。", "Top schools, prime land — they are rankings, not shareable."],
  /* 12 */ [b(138), b(146), "但在自然界，红皇后不是缺陷，而是<hi>引擎</hi>。", "Yet in nature, the Red Queen is not a bug — it is an engine."],
  /* 13 */ [b(146.5), b(153.7), "性通过基因重组不断「换锁」，让生命成为移动靶。", "Sex reshuffles genes, making life a moving target."],
  /* 14 */ [b(154), b(160), "真正的出口，不是跑得更快，而是<hi>换一条轴</hi>。", "The way out is not faster running — it is a new axis."],
  /* 15 */ [b(162), b(170), "我们说的「内卷」，正是如此。", "This is what we call involution."],
  /* 16 */ [b(172), b(182), "更多投入被吸收，结构却没有改变。", "More input is absorbed, yet the structure is unchanged."],
  /* 17 */ [b(184), b(193), "2024 年 12 月，中国企业就业人员，周平均工作 <hi>49.0 小时</hi>。", "In December 2024, China's enterprise employees averaged 49.0 hours per week."],
  /* 18 */ [b(194), b(198), "疲惫是真的，但方向，值得看清。", "The fatigue is real; the direction is worth seeing clearly."],
  /* 19 */ [b(200), b(208), "把努力，放到能相加的轴上。", "Put your effort on an axis where it adds up.", "noshow"],
  /* Q  */ [b(216), 120, "你现在的努力，是在相加，还是在相消？", "Is your effort adding up right now, or cancelling out?", "noshow"],
];
