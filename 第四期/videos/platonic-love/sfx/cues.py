# 第四期音效清单（柏拉图式恋爱）：聊天气泡、大理石、陶罐、闪电、阶梯。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；部分直接复用第三期 sfx/raw。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里的动画时间。

SOUNDS = {
    # 复用第三期
    "boom":     dict(prompt="a deep warm cinematic low boom with a long soft tail", dur=3.0, shape="impact", length=2.0, seed=181),
    "chime":    dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "whoosh":   dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "shimmer":  dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "page":     dict(prompt="an old book page turning, dry paper", dur=1.5, shape="tick", length=0.7, seed=211),
    "quill":    dict(prompt="a quill pen writing a quick stroke on paper, scratching", dur=1.0, shape="tick", length=0.5, seed=221),
    "wax":      dict(prompt="hot sealing wax dripping and pressing, soft sizzle", dur=1.5, shape="impact", length=1.0, seed=151),
    "coins":    dict(prompt="a few gold coins clinking together in a palm, bright metallic jingle", dur=1.0, shape="tick", length=0.6, seed=261),
    "scale":    dict(prompt="an old brass balance scale creaking and swinging, metal chains jingling softly", dur=3.5, shape="raw", length=3.0, seed=171),
    "crumble":  dict(prompt="a small porcelain tile cracking and crumbling into dust", dur=1.5, shape="impact", length=1.0, seed=111),
    "stamp":    dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    "popv":     dict(prompt="a small glass bottle set down on a wooden shelf, light glass clink and knock", dur=1.0, shape="tick", length=0.45, seed=241),
    "cork":     dict(prompt="a cork popping out of a small glass bottle, crisp hollow pop", dur=1.0, shape="impact", length=0.5, seed=231),
    "flame_up": dict(prompt="a small alcohol burner flame flaring up with a soft whoosh", dur=2.0, shape="whoosh", length=1.2, seed=21),
    # 第四期新增
    "msg":      dict(prompt="a smartphone chat message notification, soft bubbly pop", dur=1.0, shape="tick", length=0.4, seed=301),
    "thud":     dict(prompt="a heavy marble statue bust dropped onto a stone floor, deep solid thud", dur=1.5, shape="impact", length=1.1, seed=311),
    "clack":    dict(prompt="a ceramic plate placed down on a stone table, clear hard clack", dur=1.0, shape="tick", length=0.5, seed=321),
    "toast":    dict(prompt="several ceramic wine cups clinking together in a toast", dur=1.5, shape="tick", length=0.9, seed=331),
    "hic":      dict(prompt="a short comic cartoon hiccup sound effect, bouncy boing", dur=1.0, shape="tick", length=0.45, seed=341),
    "puff":     dict(prompt="a sudden short burst of air, cartoon puff", dur=1.0, shape="impact", length=0.6, seed=351),
    "roll":     dict(prompt="wooden balls rolling and tumbling across a wooden floor", dur=3.5, shape="raw", length=3.0, seed=361),
    "thunder":  dict(prompt="a sharp close lightning strike crack with short thunder", dur=2.5, shape="impact", length=1.8, seed=371),
    "shatter":  dict(prompt="a large ceramic vase shattering into many pieces on a stone floor", dur=2.5, shape="impact", length=2.0, seed=381),
    "crack":    dict(prompt="a marble statue cracking, one loud sharp stone crack", dur=1.5, shape="impact", length=0.7, seed=397),
    "stone":    dict(prompt="a heavy stone block sliding and settling into place, low grinding thump", dur=1.5, shape="impact", length=1.0, seed=401),
    "step":     dict(prompt="one clear footstep of a sandal on a stone floor", dur=1.0, shape="tick", length=0.35, seed=419),
}

BEAT = 0.534
CLIMB = [112.73, 114.86, 116.98, 119.11, 121.23, 123.36]

CUES = [
    # S0 钩子
    *[(t, "msg", -10 - (i % 3) * 2) for i, t in enumerate((0.06, 0.32, 0.58, 0.84, 1.12, 1.4, 1.68))],
    (2.0, "whoosh", -12), (2.45, "thud", -3), (2.45, "boom", -10), (3.25, "msg", -5),
    (6.43, "clack", -9), (6.43, "whoosh", -16), (8.5, "crack", -4), (8.57, "boom", -14),
    # S1 片名
    (10.69, "boom", -8), (10.69, "shimmer", -11), (11.4, "shimmer", -16), (12.82, "chime", -16),
    # S2 词的旅程
    (17.05, "whoosh", -14), (17.3, "msg", -9), (18.4, "msg", -9),
    (20.9, "whoosh", -11), (21.33, "page", -8), (25.58, "popv", -14), (25.85, "popv", -14),
    (27.6, "whoosh", -11), (28.49, "page", -8), *[(28.6 + i * 0.42, "quill", -11) for i in range(3)],
    (33.5, "wax", -6), (33.68, "stamp", -10), (34.09, "shimmer", -16),
    (36.21, "whoosh", -8), (36.9, "whoosh", -9), (37.5, "whoosh", -10),
    # S3 酒会
    (38.0, "whoosh", -12), (38.34, "boom", -8), (43.38, "toast", -5),
    (47.37, "hic", -6), (47.91, "hic", -6), (48.96, "puff", -4),
    # S4 另一半的神话
    *[(51.08 + i * 0.18, "popv", -10) for i in range(4)],
    (52.41, "roll", -6), (55.2, "roll", -8), (56.13, "thud", -10),
    (59.59, "boom", -10), (59.59, "whoosh", -14), (61.44, "thunder", -12), (63.4, "thunder", -1), (63.58, "crack", -6), (63.58, "boom", -8),
    (63.84, "whoosh", -14), (64.5, "step", -12), (64.6, "step", -12), (65.17, "cork", -5),
    (68.09, "shimmer", -14), (69.42, "chime", -13),
    *[(70.4 + i * 0.5, "step", -16) for i in range(12)],
    (76.59, "shimmer", -8), (76.59, "chime", -10), (76.59, "boom", -14), (78.45, "chime", -14),
    *[(82.7 + i * 0.12, "popv", -12) for i in range(4)], (85.34, "shimmer", -12),
    # S5 被当场推翻
    (89.35, "crack", -3), (91.46, "shatter", -2), (91.46, "boom", -9),
    # S6 第俄提玛
    (93.59, "whoosh", -16), (97.85, "coins", -12), (98.4, "shimmer", -15), (99.1, "flame_up", -11),
    (102.1, "clack", -9), (104.0, "whoosh", -16), (104.4, "crack", -7), (104.95, "crumble", -5),
    (106.35, "shimmer", -12), (108.47, "shimmer", -12), (109.27, "stone", -5),
    # S7 阶梯
    (110.61, "stone", -3), (110.61, "boom", -10), *[(110.75 + i * 0.1, "stone", -12) for i in range(4)],
    *[(t - 0.05, "step", -9) for t in CLIMB], *[(t, "chime", -19) for t in CLIMB[:5]],
    (123.36, "boom", -6), (123.36, "shimmer", -5), (127.61, "whoosh", -16), (127.61, "chime", -16), (131.85, "step", -11), (132.66, "chime", -14),
    # S8 拿铜换金
    (133.99, "whoosh", -16), (134.2, "coins", -10), (138.24, "scale", 4), (140.1, "coins", -8), (140.1, "thud", -16),
    # S9 当下
    *[(t, "msg", -8) for t in (142.49, 143.03, 143.56, 144.09)], (144.61, "whoosh", -18),
    # S10 / S11 结尾
    (148.86, "whoosh", -14), (148.86, "boom", -13), (153.12, "shimmer", -16),
    (154.97, "chime", -10), (156.04, "shimmer", -10), (157.11, "chime", -8), (157.37, "boom", -14),
]
