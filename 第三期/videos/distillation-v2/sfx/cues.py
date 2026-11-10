# 第三期 v2 音效清单（古典博物馆风）：玻璃、液体、火、纸、印章、骨牌、黄铜。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里的动画时间。

SOUNDS = {
    "boil":     dict(prompt="liquid gently boiling and bubbling inside a glass flask in a quiet laboratory", dur=4.0, shape="raw", length=3.6, seed=11),
    "flame_up": dict(prompt="a small alcohol burner flame flaring up with a soft whoosh", dur=2.0, shape="whoosh", length=1.2, seed=21),
    "ignite":   dict(prompt="a matchstick striking and catching fire", dur=2.0, shape="impact", length=1.2, seed=31),
    "drip":     dict(prompt="a single water droplet falling into a glass flask, clear plip", dur=1.0, shape="tick", length=0.6, seed=41),
    "tag":      dict(prompt="a paper tag on a string swinging and tapping against glass, light paper rustle", dur=1.5, shape="tick", length=0.7, seed=51),
    "clink":    dict(prompt="a glass test tube clinking softly in a wooden rack", dur=1.0, shape="tick", length=0.6, seed=61),
    "pour":     dict(prompt="liquid pouring steadily into a glass bottle", dur=3.0, shape="raw", length=2.4, seed=71),
    "chime":    dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "stamp":    dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    "tile":     dict(prompt="an ivory mahjong tile placed on a wooden table, crisp clack", dur=1.0, shape="tick", length=0.45, seed=101),
    "crumble":  dict(prompt="a small porcelain tile cracking and crumbling into dust", dur=1.5, shape="impact", length=1.0, seed=111),
    "whoosh":   dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "flutter":  dict(prompt="sheets of paper fluttering through the air and landing on a pile", dur=3.0, shape="raw", length=2.2, seed=131),
    "odometer": dict(prompt="a mechanical counter dial rolling, small clicking gears", dur=1.5, shape="raw", length=1.0, seed=141),
    "wax":      dict(prompt="hot sealing wax dripping and pressing, soft sizzle", dur=1.5, shape="impact", length=1.0, seed=151),
    "siphon":   dict(prompt="liquid being sucked through thin glass tubes, quiet slurping", dur=3.0, shape="raw", length=2.4, seed=161),
    "scale":    dict(prompt="an old brass balance scale creaking and swinging, metal chains jingling softly", dur=3.5, shape="raw", length=3.0, seed=171),
    "boom":     dict(prompt="a deep warm cinematic low boom with a long soft tail", dur=3.0, shape="impact", length=2.0, seed=181),
    "shimmer":  dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "fizz":     dict(prompt="a candle flame being snuffed out, short soft hiss", dur=1.5, shape="impact", length=1.0, seed=201),
    "page":     dict(prompt="an old book page turning, dry paper", dur=1.5, shape="tick", length=0.7, seed=211),
    "quill":    dict(prompt="a quill pen writing a quick stroke on paper, scratching", dur=1.0, shape="tick", length=0.5, seed=221),
}

BEAT = 0.534

CUES = [
    # S0 开场
    (0.0, "boil", -18), (3.4, "boil", -19), (6.8, "boil", -19), (0.06, "boom", -13),
    (2.18, "tag", -10), (2.45, "drip", -7), (4.32, "tag", -10), (4.32, "drip", -7), (8.57, "drip", -5), (8.57, "chime", -12),
    # S1 片名
    (10.69, "boom", -8), (10.69, "shimmer", -12), (12.82, "chime", -18),
    # S2 2006
    (17.05, "page", -10), (17.95, "stamp", -14), *[(17.25 + r * BEAT, "clink", -14) for r in range(3)],
    (19.2, "pour", -10), (21.33, "chime", -12), (22.4, "tile", -7),
    # S3 2015
    (25.58, "odometer", -6), (26.48, "stamp", -14), (29.83, "page", -10), *[(30.03 + i * BEAT, "clink", -16) for i in range(5)],
    (33.5, "page", -11), (33.68, "stamp", -16), (38.34, "flame_up", -8), (38.34, "odometer", -11),
    (43.38, "quill", -14), (43.91, "quill", -14), (44.45, "quill", -14), (46.84, "page", -12),
    (51.08, "flame_up", -10), (51.08, "odometer", -11), (53.6, "odometer", -13),
    (55.2, "whoosh", -14), (55.45, "clink", -14), (59.59, "pour", -12), (63.58, "stamp", -8), (63.84, "whoosh", -15), (64.0, "whoosh", -17),
    # S4 没见过的 3
    *[(68.2 + k * 0.18, "tile", -7) for k in range(5)],
    *[(72.34 + k * 0.4, "stamp", -10) for k in range(4)], *[(72.64 + k * 0.4, "crumble", -12) for k in range(4)],
    (76.59, "shimmer", -12), (77.4, "chime", -15), (78.45, "boom", -10), (78.45, "chime", -10), (80.84, "whoosh", -16), (82.7, "chime", -14),
    # S5 拒稿
    (87.21, "page", -8), (87.56, "stamp", -4), (89.35, "whoosh", -14), *[(89.6 + k * 0.4, "clink", -18) for k in range(4)],
    # S6 2019
    (93.59, "odometer", -6), (94.49, "stamp", -14), (94.2, "drip", -16), (95.72, "tile", -5), (96.79, "tile", -5), (97.85, "tile", -5),
    # S7 2025
    (102.1, "odometer", -6), (103.0, "stamp", -14), *[(t, "flutter", -9) for t in (102.4, 104.5, 106.6, 108.7)],
    (106.61, "odometer", -10), (110.61, "whoosh", -14), (110.61, "clink", -12), (110.8, "pour", -14),
    (116.98, "page", -10), (120.28, "tag", -8),
    # S8 2026 争议
    (121.23, "odometer", -6), (121.23, "boom", -11), (121.53, "wax", -8), (122.13, "stamp", -14),
    (125.5, "siphon", -2), (128.0, "siphon", -4), (129.73, "page", -8), (129.9, "stamp", -8), (132.66, "odometer", -8),
    (136.12, "page", -8), (136.35, "stamp", -8), (138.24, "page", -8), (138.45, "stamp", -8), (140.1, "stamp", -6),
    (140.4, "scale", -4), (143.5, "scale", -6), (146.74, "whoosh", -16),
    # S9 此刻 · 你
    (148.86, "whoosh", -14), (148.9, "ignite", -10), (148.9, "tag", -14), (149.4, "tag", -14),
    (149.6, "boil", -19), (153.0, "boil", -19), (154.97, "drip", -6), (156.04, "drip", -6), (157.11, "drip", -4), (157.11, "chime", -10),
    # S10 片尾
    (157.37, "fizz", -8), (157.37, "boom", -10), (157.6, "shimmer", -14),
]
