# 第九期音效清单（Markdown：AI 的最爱）。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；前 20 个复用第七、八期 sfx/raw，后 8 个本期新生成。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里各段的 state(t)（见 03-分镜脚本）。

SOUNDS = {
    # 复用第七、八期
    "whoosh":  dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "shimmer": dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "chime":   dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "tap":     dict(prompt="a single finger tap on a glass phone screen, soft crisp tick", dur=1.0, shape="tick", length=0.3, seed=531),
    "ticker":  dict(prompt="a fast mechanical number counter rolling, rapid soft plastic clicks", dur=1.5, shape="raw", length=1.0, seed=511),
    "thud":    dict(prompt="a heavy marble statue bust dropped onto a stone floor, deep solid thud", dur=1.5, shape="impact", length=1.1, seed=311),
    "clack":   dict(prompt="a ceramic plate placed down on a stone table, clear hard clack", dur=1.0, shape="tick", length=0.5, seed=321),
    "slap":    dict(prompt="a sheet of paper slapped flat against a glass window, crisp paper smack", dur=1.0, shape="tick", length=0.4, seed=621),
    "stamp":   dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    "swell":   dict(prompt="a warm magical rising swell, soft airy shimmer building up", dur=3.0, shape="whoosh", length=2.6, seed=7015),
    "spark":   dict(prompt="a soft magical sparkle ping, tiny bright bell", dur=0.8, shape="tick", length=0.5, seed=7006),
    "clunk":   dict(prompt="a big wooden gear turning and locking into place with a solid clunk", dur=1.0, shape="impact", length=0.6, seed=7012),
    "buzz":    dict(prompt="a soft wrong answer buzzer, short low dull buzz", dur=0.8, shape="tick", length=0.5, seed=7014),
    "flutter":   dict(prompt="a flurry of many paper sheets and sticky notes fluttering and blowing away in the wind", dur=3.0, shape="raw", length=2.6, seed=8001),
    "shutter":   dict(prompt="a single vintage film camera shutter click, crisp mechanical", dur=0.8, shape="tick", length=0.4, seed=8002),
    "projector": dict(prompt="an old film projector starting up, film reel rattling and whirring", dur=3.0, shape="raw", length=2.5, seed=8003),
    "fallwind":  dict(prompt="rushing wind of a person in free fall, strong whoosh of air past the ears", dur=3.0, shape="whoosh", length=3.0, seed=8004),
    "shuffle":   dict(prompt="a deck of photographs being dealt rapidly onto a table, quick paper flicks", dur=3.5, shape="raw", length=3.3, seed=8005),
    "sand":      dict(prompt="fine sand trickling through an hourglass, soft continuous hiss", dur=4.0, shape="raw", length=3.6, seed=8006),
    "beads":     dict(prompt="a handful of tiny beads raining onto a sheet of paper, soft light patter", dur=3.0, shape="raw", length=3.0, seed=8007),
    # 第九期新增
    "typing":   dict(prompt="fast light typing on a laptop keyboard, soft clicky keys in a quiet room", dur=2.2, shape="raw", length=1.9, seed=9001),
    "unfold":   dict(prompt="a sheet of paper being unfolded and snapped open, crisp paper crinkle", dur=1.2, shape="raw", length=0.9, seed=9002),
    "marker":   dict(prompt="a felt tip marker drawing one quick line across paper, short soft squeak", dur=1.0, shape="raw", length=0.6, seed=9003),
    "pour":     dict(prompt="water pouring into a glass and filling up, gentle rising tone", dur=2.2, shape="raw", length=1.8, seed=9004),
    "pageflip": dict(prompt="pages of a thick book flipped quickly with a thumb, soft paper riffle", dur=2.5, shape="raw", length=2.2, seed=9005),
    "rip":      dict(prompt="a sheet of thick paper torn cleanly in half, quick crisp rip", dur=1.0, shape="impact", length=0.6, seed=9006),
    "blocks":   dict(prompt="small wooden toy blocks being placed one by one on a table, quick light clacks", dur=2.0, shape="raw", length=1.6, seed=9007),
    "bubble":   dict(prompt="(合成，见 sfx/synth.py；Woosh 生成的几乎是空的)", dur=0.22, shape="tick", length=0.22, seed=0),
}

CUES = [
    # S0 钩子：文件列表亮行 → 三个 .md 标签弹出 → 卡片墙甩进来 → 其余标签剥下 → .md 一起闪 → 收成一张纸
    (0.0, "swell", -18), (0.06, "tap", -10),
    (0.2, "bubble", -8), (0.75, "bubble", -8), (1.3, "bubble", -7),
    (2.4, "whoosh", -8), (2.45, "clack", -9), (2.55, "shuffle", -11),
    *[(3.35 + k * 0.28, "spark", -17) for k in range(4)],
    *[(4.32 + k * 0.12, "whoosh", -15) for k in range(4)],
    (6.43, "shimmer", -9), (6.5, "chime", -14),
    (8.57, "whoosh", -13), (9.0, "stamp", -8), (9.02, "chime", -12),
    # S1 片名：打字 → 渲染成粗体 → 收到顶部
    (10.69, "shimmer", -16), (11.0, "typing", -6), (13.05, "shimmer", -11), (13.1, "spark", -10), (14.94, "whoosh", -16),
    # S2 打开：纸展开 → 符号依次亮 → 记号笔 → 纸塔 → 文件夹灌满 → 冲出镜头
    (17.05, "unfold", -4), (19.2, "tap", -8), (19.65, "tap", -8), (20.1, "tap", -8),
    (21.33, "marker", -10), (21.61, "marker", -11), (21.89, "marker", -11),
    (23.46, "whoosh", -12), (23.95, "swell", -14), (24.05, "ticker", -13), (24.5, "flutter", -15),
    (25.58, "clack", -11), (25.9, "pour", -5), (28.05, "whoosh", -9),
    # S3 出身：2004 砸下 → 圈出名字和日期 → 记号笔 → 原文/渲染 → 重叠 → 大字 → 翻页
    (28.49, "thud", -6), (28.5, "stamp", -9), (28.55, "whoosh", -12),
    (31.95, "spark", -11), (32.35, "spark", -11), (32.9, "marker", -11), (33.12, "marker", -12), (33.34, "marker", -12),
    (33.68, "whoosh", -10), (33.75, "slap", -10), (36.21, "whoosh", -14), (36.3, "shimmer", -12), (37.2, "spark", -12),
    (38.34, "thud", -10), (38.36, "swell", -15), (40.46, "pageflip", -2),
    # S4 两双眼睛：砸下 → 劈开 → 碎成积木 → 粉线 → 聊天框 → 粘进气泡、炸开（顿挫）→ 符号跳 → 拼回 → 上飘
    (43.38, "slap", -6), (43.4, "thud", -11), (43.75, "rip", -6), (44.0, "whoosh", -12),
    (46.84, "blocks", -8), (48.96, "marker", -13), (51.09, "tap", -10),
    (52.41, "bubble", -4), (52.41, "stamp", -7), (52.43, "thud", -9), (52.45, "whoosh", -11),
    *[(52.5 + k * 0.12, "spark", -14) for k in range(5)],
    (55.35, "tap", -15), (55.8, "tap", -15),
    (56.13, "whoosh", -10), (56.6, "clack", -9), (56.65, "chime", -13), (58.4, "swell", -16),
    # S5 为什么是「最爱」：规范截图 → 划线 → 标签 → 投票 → 长棒长出来 → 数字 → 亮绿 / HTML → 三张卡 → 收成纸
    (61.44, "whoosh", -10), (61.5, "slap", -10), (62.0, "marker", -11), (62.3, "clack", -11),
    (63.58, "slap", -10), (63.9, "ticker", -14),
    (65.17, "swell", -14), *[(65.2 + i * 0.22, "clack", -15) for i in range(5)],
    *[(67.3 + i * 0.2, "tap", -9) for i in range(5)],
    (69.42, "chime", -8), (69.45, "spark", -10), (69.6, "buzz", -15),
    (72.34, "spark", -9), (72.89, "spark", -9), (73.44, "spark", -9),
    (74.6, "whoosh", -12), (75.15, "stamp", -10),
    # S6 普通话 → 反渲染（v2）：纸压成桥 → Markdown 小段来回滑 → 画面褪成原文
    (76.4, "whoosh", -11), (76.59, "swell", -14), (76.8, "shimmer", -14),
    *[(78.45 + i * 0.36, "whoosh", -17) for i in range(6)],
    (80.84, "unfold", -5), (80.9, "shimmer", -12), *[(80.95 + i * 0.12, "tap", -12) for i in range(4)],
    # S7 揭底：拉出编辑器 → 飞快滚到底、文件依次亮 → 光标敲出「- [ ] 第十期：」
    (82.7, "whoosh", -8), (82.75, "clack", -12),
    (85.34, "pageflip", -4), *[(85.6 + i * 0.3, "spark", -12) for i in range(4)],
    (87.6, "typing", -6), (88.65, "tap", -11),
]
