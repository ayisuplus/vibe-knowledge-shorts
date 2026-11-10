# 第八期音效清单（为什么一年比一年过得快）。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；前 13 个复用第七期 sfx/raw。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里各场景的卡点（见 03-分镜脚本）。

SOUNDS = {
    # 复用第七期
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
    # 第八期新增
    "flutter":   dict(prompt="a flurry of many paper sheets and sticky notes fluttering and blowing away in the wind", dur=3.0, shape="raw", length=2.6, seed=8001),
    "shutter":   dict(prompt="a single vintage film camera shutter click, crisp mechanical", dur=0.8, shape="tick", length=0.4, seed=8002),
    "projector": dict(prompt="an old film projector starting up, film reel rattling and whirring", dur=3.0, shape="raw", length=2.5, seed=8003),
    "fallwind":  dict(prompt="rushing wind of a person in free fall, strong whoosh of air past the ears", dur=3.0, shape="whoosh", length=3.0, seed=8004),
    "shuffle":   dict(prompt="a deck of photographs being dealt rapidly onto a table, quick paper flicks", dur=3.5, shape="raw", length=3.3, seed=8005),
    "sand":      dict(prompt="fine sand trickling through an hourglass, soft continuous hiss", dur=4.0, shape="raw", length=3.6, seed=8006),
    "beads":     dict(prompt="a handful of tiny beads raining onto a sheet of paper, soft light patter", dur=3.0, shape="raw", length=3.0, seed=8007),
}

CUES = [
    # S0 钩子：推近日历墙 → 去年的今天（空）→ 纸格剥落 → 记忆照片收进胶片
    (0.0, "swell", -16), (0.25, "whoosh", -12), (2.25, "whoosh", -10), (2.45, "tap", -6),
    (4.4, "flutter", -14), (6.4, "flutter", -9), (7.6, "flutter", -12),
    *[(9.35 + k * 0.07, "shutter", -13) for k in range(9)],
    # S1 片名 → 胶片退远
    (10.69, "chime", -10), (10.75, "shimmer", -15), (14.94, "whoosh", -16),
    # S2 年龄尺 → 人像 → 499 个点落下 → 亮成粉色
    (17.05, "whoosh", -14), *[(17.45 + k * 0.16, "slap", -15) for k in range(6)],
    (21.4, "beads", -11), (25.58, "shimmer", -10),
    # S3 坠落实验
    (28.49, "fallwind", -6), (31.95, "whoosh", -14), (32.4, "ticker", -15), (33.68, "stamp", -7), (33.7, "chime", -14),
    (36.21, "ticker", -17), (38.34, "thud", -12), (40.46, "flutter", -13), (40.5, "shimmer", -15),
    # S4 童年胶片甩开 → 高光扫过 → 照片一张张落下 → 压实成一格
    (43.38, "projector", -9), (43.4, "whoosh", -10), (46.84, "shimmer", -10),
    (49.2, "shuffle", -11), (50.6, "shuffle", -9), (52.41, "stamp", -3), (52.42, "thud", -6),
    (56.13, "slap", -10), (59.59, "shimmer", -10),
    # S5 沙漏：出现 → 漏沙（右边快）→ 翻转 → 回头看
    (61.44, "clack", -12), (61.56, "clack", -13), (62.0, "sand", -15), (63.2, "sand", -10),
    (65.17, "whoosh", -10), (65.8, "clunk", -11), (72.34, "shimmer", -11), (74.47, "flutter", -10), (74.6, "whoosh", -14),
    # S6 一格格亮起「第一次」→ 成片亮起，墙长大
    (78.45, "spark", -6), (78.5, "chime", -14), (80.84, "spark", -6), (82.7, "spark", -6),
    *[(85.4 + i * 0.1, "spark", -15 - (i % 3)) for i in range(16)], (85.34, "swell", -9),
    # S7 结尾
    (87.3, "chime", -13),
]
