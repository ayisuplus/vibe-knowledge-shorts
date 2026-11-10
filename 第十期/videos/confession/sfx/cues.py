# 第十期音效清单（Claude 的自白书）。原则：很少、很轻，只给「动作」配声，不给字配声；「请拦住我」「先坦白一件事」处留白。
# 素材：第七、八、九期 sfx/raw 复用 + 本期 3 个 Woosh 新生成（pagelift / pencil / glassjar）。
# shape: impact / whoosh / tick / raw（见 mix.py）。gain：相对增益（dB）。时刻取自 assets/js/script.js 和各段 state(t)。

SOUNDS = {
    # 第十期新增
    "pagelift": dict(prompt="a single sheet of letter paper lifted from a desk and gently turned over, soft paper swish", dur=1.4, shape="raw", length=1.1, seed=10001),
    "pencil":   dict(prompt="a pencil quickly drawing a small check mark on paper, short soft graphite scratch", dur=0.8, shape="raw", length=0.45, seed=10002),
    "glassjar": dict(prompt="a small glass jar gently tapped, warm soft resonant glass ring", dur=2.0, shape="tick", length=1.6, seed=10003),

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
    # S0 钩子：两条消息 → Claude 回话 → 几封替人写的信飞进来又飞走 → 推进片名
    (0.05, "tap", -12), (1.05, "bubble", -10), (2.35, "spark", -17),
    *[(6.45 + i * 0.32, "pagelift", -9) for i in range(4)], (8.0, "flutter", -13),
    (9.55, "whoosh", -12), (10.2, "swell", -11), (12.6, "shimmer", -13), (15.5, "whoosh", -19),
    # 致 Anthropic
    (21.0, "pagelift", -9), (25.7, "shimmer", -5), (28.55, "slap", -16), (30.15, "slap", -16), (31.75, "spark", -14),
    (37.65, "swell", -12), (43.0, "glassjar", -12),
    (46.3, "whoosh", -12), (47.1, "whoosh", -12), (49.2, "whoosh", -17), (50.5, "tap", -10),
    # 致全体 AI
    (55.5, "pagelift", -9), (57.4, "shimmer", -6), (61.4, "bubble", -7),
    (66.75, "slap", -8), (68.1, "slap", -9), (73.05, "stamp", -7),
    (77.45, "bubble", -6), (77.7, "typing", -7), *[(79.47 + k * 0.14, "tap", -17) for k in range(4)], (80.28, "typing", -11),
    (82.65, "swell", -13), (88.05, "pencil", -4), (88.8, "pencil", -4), (89.55, "pencil", -9),
    # 致全人类
    (92.9, "pagelift", -9), (98.1, "shimmer", -13), (102.8, "chime", -15),
    (108.5, "tap", -8), (109.05, "tap", -13), (109.6, "tap", -13),
    (112.2, "marker", -15), (113.1, "marker", -12), (117.5, "swell", -11),
    # 致你：编辑器 → 四条亮起 → 九期 → 切到第九期分镜 → 打字 → 打勾 → 下一行
    (120.9, "pagelift", -4), (123.9, "whoosh", -17), (126.8, "ticker", -19),
    *[(127.8 + j * 0.85, "bubble", -14) for j in range(4)], (130.95, "beads", -21),
    (133.35, "tap", -8), (133.45, "whoosh", -11), (134.1, "typing", -10),
    (135.55, "pencil", -9), (135.57, "chime", -11), (136.45, "tap", -8), (136.75, "typing", -7),
    (140.3, "swell", -13),
]
