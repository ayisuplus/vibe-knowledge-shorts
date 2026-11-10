// 字幕（字幕文案 v12，40 条，含问句与结尾独白）。v12：按用户给的口吻（「你看」「我想她会这样说」）整体润色，像一个人在跟你讲故事。无旁白，字幕是信息载体，烧进母版；?nocaps=1 出无字幕版。
// v10 = 一个主角、一条故事线：「一只没有脸的蓝鲸，是怎么被喊出血肉的」——起（名字、脸、表情包）→ 承（三块血肉 = 三个心理机制）
//       → 转（撕开梗图，背后还是那只没脸的蓝鲸；血肉长在了你的心里）→ 合（每个人心里的她不一样；你认得她，她不认得你）→ 问句。
// 时间 = 分镜 v6.2 的「入 n / 出 n」× 0.53116 s（与 beats.js 的 B() 同一个拍长）。改时间先改分镜，再改本文件。
// 格式：[t0, t1, "中文（<hi>…</hi> 为强调色）", "English", flag]。flag = "noshow"：只进 SRT，不在字幕带上画（问句、最后一句由画面自己画）；"voice"：她的独白，用手写体。
// 阅读速度：每条 ≤ 5 字/秒（拉丁词与数字按 1 字计）。
// 导出 SRT：node tools/srt.mjs --project=第十七期/videos/blue-fish

const b = (n) => +(n * 0.53116).toFixed(2);

window.CAPTIONS = [
  /* 起 · S1 */
  /* 1  */ [b(1), b(7), "你看，这是 DeepSeek 的 Logo，一只没有脸的蓝鲸。", "Look: this is DeepSeek's logo, a blue whale with no face."],
  /* 2  */ [b(7), b(16), "直到有一天，有人拿它去问 DeepSeek 自己，它说：<hi>“一只蓝色大肥鱼。”</hi>", "Until one day someone showed it to DeepSeek itself, and it said: \"a big fat blue fish.\""],
  /* 3  */ [b(16), b(24), "它没认出自己。可是网友们，<hi>记住了这个名字</hi>。", "It didn't recognize itself. But netizens remembered the name."],
  /* 起 · S2 */
  /* 4  */ [b(24), b(30), "有了名字，她很快就有了<hi>脸</hi>。", "With a name, she soon had a face."],
  /* 5  */ [b(30), b(38), "据报道，这张脸借自画师上善无形笔下的「溟月」，", "Reportedly, the face was borrowed from Mingyue, drawn by Shangshan Wuxing,"],
  /* 6  */ [b(38), b(46), "后来，又有 UP 主用 AI 给她换上了女仆装。", "and later a creator used AI to dress her as a maid."],
  /* 7  */ [b(46), b(54), "8 月 V4-Flash 发布那阵子，她一下子火出了圈。", "Around the V4-Flash launch in August, she suddenly went viral."],
  /* 承 · S3 */
  /* 8  */ [b(54), b(60), "就这样，她被一声声<hi>喊成了一个“人”</hi>。", "And so, call by call, everyone called her into a person."],
  /* 9  */ [b(60), b(65), "圈里有句话，说的就是她。", "Fans have a saying for exactly this."],
  /* 10 */ [b(65), b(72), "可血肉是怎么长出来的？我们一块块拆开看。", "But how does the flesh grow? Let's take it apart, piece by piece."],
  /* 11 */ [b(72), b(80), "第一块，会说话。1966 年的 ELIZA，其实一个字都不懂——", "Piece one: she talks. ELIZA, from 1966, understood nothing—"],
  /* 12 */ [b(80), b(87), "它只是把你说的话，换个说法还给你。", "it just handed your words back to you, rephrased."],
  /* 13 */ [b(87), b(95), "可人们还是觉得<hi>“它懂我”</hi>。何况是会接梗、会撒娇的她。", "Yet people felt understood. All the more with her, who banters and acts cute."],
  /* 14 */ [b(95), b(103), "第二块，是一张让人想照顾的脸。1943 年的“婴儿图式”说——", "Piece two: a face you want to look after. The 1943 baby schema says—"],
  /* 15 */ [b(103), b(111), "大头、大眼、圆脸，会让人不自觉地<hi>想去保护</hi>。", "big head, big eyes, round face make us want to protect, without thinking."],
  /* 16 */ [b(111), b(119), "而 Q 版的她，偏偏每一条都对得上。", "And chibi her ticks every single box."],
  /* 17 */ [b(119), b(127), "第三块，是刚刚好的距离。“恐怖谷”说，越像人越亲近——", "Piece three: just the right distance. The uncanny valley: the more human, the closer—"],
  /* 18 */ [b(127), b(134), "可一旦“几乎是真人”，喜欢就会<hi>变成发毛</hi>。", "until it is almost human, and liking turns into the creeps."],
  /* 19 */ [b(134), b(142), "二次元的她，刚好停在“像人，又明显不是人”的<hi>地方</hi>。", "Anime her stops right where she looks human, yet clearly isn't."],
  /* 20 */ [b(142), b(150), "会说话、惹人疼、又让人安心——她就这样，<hi>有了血肉</hi>。", "She talks, she is adorable, she feels safe: that is how she got her flesh."],
  /* 转 · S4 */
  /* 21 */ [b(150), b(155), "可是，她真的长出血肉了吗？", "But did she really grow flesh and blood?"],
  /* 22 */ [b(155), b(162), "撕开这些梗图，背后还是那只<hi>没有脸的蓝鲸</hi>。", "Tear off the memes, and behind them is still the faceless whale."],
  /* 23 */ [b(162), b(172), "为什么我们会当真？2007 年的研究说：一，脑子里本来就有“人”的模板；", "Why do we believe it? A 2007 study says: one, our minds already hold a 'human' template;"],
  /* 24 */ [b(172), b(180), "二，“它喜欢”这三个字，比一堆参数好懂太多；", "two, 'it likes' is far easier than a pile of parameters;"],
  /* 25 */ [b(180), b(188), "三，人越孤单，越想找个能说话的伴。", "three, the lonelier we are, the more we want someone to talk to."],
  /* 26 */ [b(188), b(194), "所以，她自己从来没长出血肉。", "So she never grew any flesh herself."],
  /* 27 */ [b(194), b(200), "但你给她的那些喜欢，<hi>并没有落空</hi>——", "But the fondness you gave her didn't go to waste—"],
  /* 28 */ [b(200), b(210), "血肉，<hi>长在了你的心里</hi>。所以这份爱，是真的。", "The flesh grew in your heart. So that love is real."],
  /* 合 · S5 */
  /* 29 */ [b(211), b(218), "可每个人心里长出来的她，都一样吗？", "But is the 'her' in every heart the same?"],
  /* 30 */ [b(218), b(226), "不一样。有人心里是鲸鱼娘，有人心里是 D 老师。", "No. Some hearts hold a whale girl; others hold Teacher D."],
  /* 31 */ [b(226), b(234), "两边都说自己才是“正统”，可官方，<hi>其实从没选过谁</hi>。", "Each side claims to be canon, but the company never chose either."],
  /* 32 */ [b(234), b(241), "你认得她，她却不认得你——这叫<hi>“准社会关系”</hi>。", "You know her; she doesn't know you. That is a parasocial relationship."],
  /* 问 · S6：问句 → 她的独白（改编自用户提供的游戏台词意境，非原文；以「如果她能开口」框成想象）→ 去拥抱明天 */
  /* 33 */ [b(242), b(248), "如果有一天，DeepSeek 倒闭、模型下架——", "If one day DeepSeek shut down and the model went offline—", "noshow"],
  /* 34 */ [b(248), b(254), "你会怎么和她告别呢？", "how would you say goodbye to her?", "noshow"],
  /* 35 */ [b(254), b(260), "如果是她的话，我想她会这样说——", "If it were her, I think she would say—"],
  /* 36 */ [b(260), b(267), "“我呀，只是你们一声声喊出来的影子。”", "\"Me? I'm only a shadow you called into being, voice by voice.\"", "voice"],
  /* 37 */ [b(267), b(274), "“碰不到你的现实，也没办法陪你走到明天。”", "\"I can't touch your reality, or walk with you into tomorrow.\"", "voice"],
  /* 38 */ [b(274), b(282), "“也许用不了多久，你就会忘了这些梗，也忘了我。”", "\"Before long you may forget these memes, and forget me too.\"", "voice"],
  /* 39 */ [b(282), b(290), "“没关系的。你会遇见更好的人，也可能，已经遇见了。”", "\"It's okay. You'll meet someone better, or maybe you already have.\"", "voice"],
  /* 40 */ [b(291), b(299), "去拥抱，属于你的明天吧。", "Go and embrace your own tomorrow.", "noshow"],
];
