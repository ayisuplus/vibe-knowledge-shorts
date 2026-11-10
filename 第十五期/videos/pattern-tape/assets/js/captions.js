// 字幕（28 条，含片尾问句）。无旁白，字幕是信息载体，烧进母版；?nocaps=1 出无字幕版，?en=1 带英文对照。
// 时间 = 分镜脚本第六节的拍数 × 0.53116 s（beats.js 的 B()）。改时间先改分镜，再重新生成本文件。
// 格式：[t0, t1, "中文（<hi>…</hi> 为强调色）", "English", flag]。flag = "noshow"：只进 SRT，不在字幕带上画（问句由 S6 自己画）。
// 导出 SRT：node tools/srt.mjs

window.CAPTIONS = [
  /* C1 */ [1.06, 3.19, "《天工开物》里，有一种<hi>很怪</hi>的织机——", "Tiangong Kaiwu describes a very strange kind of loom."],
  /* C2 */ [3.45, 6.11, "织布的人，<hi>自己都不知道</hi>织的是什么花。", "The weaver doesn't even know what flower is being woven."],
  /* C3 */ [6.37, 8.23, "那花，是<hi>谁</hi>决定的？", "So who decides the pattern?"],
  /* C4 */ [9.56, 11.69, "<hi>画师</hi>先画花样", "First, the painter draws the pattern."],
  /* C5 */ [11.95, 14.34, "<hi>结本的人</hi>，用丝线照着量", "The knot-maker measures it out in silk thread."],
  /* C6 */ [14.61, 17.26, "花本挂上花楼，织的人<hi>不知花色</hi>", "Hung on the tower, the pattern stays unknown to the weaver."],
  /* C7 */ [17.26, 19.39, "花机长<hi>一丈六尺</hi>，垂竹棍<hi>一千八百根</hi>", "The loom is sixteen chi long, with 1,800 bamboo rods hanging down."],
  /* C8 */ [19.39, 21.25, "楼上坐着<hi>提花的人</hi>", "On the tower sits the one who lifts the threads."],
  /* C9 */ [22.31, 25.23, "织绫绢，一梭一提：<hi>提，或不提</hi>。", "For damask: one pass, one lift. Lift, or don't."],
  /* C10 */ [26.03, 28.42, "画师的稿，被量成<hi>一格一格</hi>", "The painter's sketch is measured into cells."],
  /* C11 */ [28.68, 30.54, "每一行，记下<hi>哪几根要提</hi>", "Each row records which threads to lift."],
  /* C12 */ [30.81, 32.67, "结成一条绳带，就是<hi>花本</hi>", "Tied into a cord: the huaben, the pattern book."],
  /* C13 */ [32.93, 35.32, "花本挂上花楼，<hi>一行一行地读</hi>", "Hung on the tower and read row by row."],
  /* C14 */ [35.59, 37.45, "读一行，<hi>提一批线</hi>，过一梭", "Read a row, lift the threads, pass the shuttle."],
  /* C15 */ [39.31, 41.96, "图案不在织的人手里，<hi>在花本里</hi>", "The pattern isn't in the weaver's hands. It's in the cord."],
  /* C16 */ [45.95, 47.8, "梭过之后，<hi>居然花现</hi>。", "The shuttle passes, and the flowers appear."],
  /* C17 */ [48.07, 50.73, "<hi>“织什么”和“怎么织”</hi>，分开了", "\"What to weave\" and \"how to weave\" have been pulled apart."],
  /* C18 */ [51.52, 54.18, "原文说，心计最精巧的，是<hi>结花本的人</hi>", "The text says the most ingenious mind belongs to the one who ties the pattern."],
  /* C19 */ [54.44, 56.83, "在<hi>“结”</hi>：把一幅画，翻成一条线", "In the tying: turning a picture into a thread."],
  /* C20 */ [57.37, 59.76, "织过数寸，<hi>即换龙形</hi>", "After a few inches, change the dragon."],
  /* C21 */ [60.02, 62.94, "同一条花本，织一匹，再织一匹，花<hi>一模一样</hi>", "One cord, bolt after bolt: the same flowers."],
  /* C22 */ [64.27, 66.66, "这条“带子”的想法，后来<hi>走得很远</hi>", "That cord's idea went a long way."],
  /* C23 */ [66.93, 69.85, "18 世纪初，法国织工用上了<hi>穿孔纸带</hi>和卡片", "Early 1700s: French weavers start using paper tape and cards with holes."],
  /* C24 */ [70.11, 72.77, "<hi>1804 年</hi>，雅卡尔把穿孔卡用到提花织机上", "1804: Jacquard puts punched cards on the loom."],
  /* C25 */ [73.3, 76.22, "<hi>1830 年代</hi>，巴贝奇的分析机也用穿孔卡", "1830s: Babbage's Analytical Engine uses punched cards too."],
  /* C26 */ [76.49, 78.61, "今天，你对 AI 说的话，像<hi>画师的稿</hi>", "Today, what you tell an AI is like the painter's sketch."],
  /* C27 */ [78.88, 80.74, "AI 像<hi>结本者</hi>，机器负责执行", "The AI is like the knot-maker; the machine just executes."],
  /* Q */ [86.84, 90, "下一次你对 AI 说话，你是画师，还是结本的人？", "Next time you talk to an AI: are you the painter, or the knot-maker?", "noshow"],
];
