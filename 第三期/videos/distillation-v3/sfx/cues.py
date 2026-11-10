# 第三期 v3 音效清单（蒸馏 · 万物皆可复刻）：玻璃、液体、火、纸、印章、骨牌、黄铜。
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
    # v3 新增
    "cork":     dict(prompt="a cork popping out of a small glass bottle, crisp hollow pop", dur=1.0, shape="impact", length=0.5, seed=231),
    "popv":     dict(prompt="a small glass bottle set down on a wooden shelf, light glass clink and knock", dur=1.0, shape="tick", length=0.45, seed=241),
    "coins":    dict(prompt="a few gold coins clinking together in a palm, bright metallic jingle", dur=1.0, shape="tick", length=0.6, seed=261),
    "unroll":   dict(prompt="a paper scroll unrolling quickly, dry paper rustle", dur=1.5, shape="whoosh", length=0.9, seed=251),
}

BEAT = 0.534

CUES = [
    # S0 钩子：同事被蒸馏
    (0.0, "boil", -18), (3.4, "boil", -19), (6.8, "boil", -19), (0.06, "boom", -13),
    (2.18, "tag", -10), (2.45, "drip", -7), (4.32, "tag", -10), (4.32, "drip", -7),
    *[(t, "popv", -8) for t in (6.41, 7.48, 8.01)], (8.57, "drip", -6), (8.57, "chime", -12),
    # S1 片名
    (10.69, "boom", -8), (10.69, "shimmer", -12), *[(11.0 + i * 0.26, "clink", -21) for i in range(5)], (11.8, "shimmer", -15), (12.82, "chime", -18),
    # S2 化学蒸馏
    (17.05, "flame_up", -10), (17.3, "boil", -19), (20.7, "boil", -19), (19.2, "quill", -14),
    *[(t, "drip", -9) for t in (19.75, 20.82, 21.89, 22.96, 24.03)], (23.47, "page", -10),
    # S3 2015
    (25.58, "odometer", -6), (26.48, "stamp", -14), (29.83, "page", -10), *[(30.03 + i * BEAT, "clink", -16) for i in range(5)],
    (33.5, "page", -11), (33.68, "stamp", -16), (38.34, "flame_up", -8), (38.34, "odometer", -11),
    (43.38, "quill", -14), (43.91, "quill", -14), (44.45, "quill", -14), (46.84, "page", -12),
    (51.08, "flame_up", -10), (51.08, "odometer", -11), (53.6, "odometer", -13),
    (55.2, "whoosh", -14), (55.45, "clink", -14), (59.59, "pour", -12), (64.95, "stamp", -8), (63.84, "whoosh", -15), (64.0, "whoosh", -17),
    # S4 没见过的 3 + 标本卡②
    *[(68.2 + k * 0.18, "tile", -7) for k in range(5)],
    *[(72.34 + k * 0.4, "stamp", -10) for k in range(4)], *[(72.64 + k * 0.4, "crumble", -12) for k in range(4)],
    (76.59, "shimmer", -12), (77.4, "chime", -15), (78.45, "boom", -10), (78.45, "chime", -10), (80.84, "whoosh", -16), (82.7, "chime", -14),
    (83.6, "whoosh", -16), (84.3, "page", -10),
    # S5 2025 DeepSeek → Qwen
    (87.21, "odometer", -6), (88.11, "stamp", -14), (87.4, "tag", -10), (87.7, "page", -12), (87.9, "pour", -14),
    (90.4, "shimmer", -14), *[(90.5 + i * 0.2, "popv", -16) for i in range(6)], (91.0, "page", -12),
    # S6 2026 争议
    (93.59, "odometer", -6), (93.8, "tag", -10), (94.49, "stamp", -14),
    (95.57, "page", -9), (95.72, "tag", -10), (95.72, "boom", -11), (96.25, "wax", -8),
    (97.81, "siphon", -2), (99.0, "siphon", -5), (99.9, "page", -8), (100.13, "stamp", -8), (100.97, "page", -8), (101.2, "stamp", -8), (102.04, "stamp", -6),
    (102.7, "scale", -4), (102.9, "page", -10), (103.5, "page", -10), (106.3, "whoosh", -16),
    # S7 网上的蒸馏
    # 2023 孙燕姿 → 2025 吉卜力 → 2026 同事.skill（年份逐个滚）
    (106.61, "odometer", -6), (106.61, "whoosh", -15), (106.61, "shimmer", -12), (107.51, "stamp", -14),
    (110.61, "odometer", -8), (110.61, "boom", -10), (110.61, "whoosh", -14), (111.51, "stamp", -14), (111.68, "popv", -10),
    (114.85, "odometer", -8), (114.85, "whoosh", -15), (114.85, "boil", -19), (115.75, "stamp", -14), (116.98, "drip", -6),
    *[(118.5 + i * BEAT, "popv", -8) for i in range(6)],
    (124.4, "whoosh", -16), *[(124.7 + i * 0.09, "clink", -18) for i in range(8)], *[(127.6 + i * 0.15, "clink", -14) for i in range(3)],
    # S8 开瓶鉴定
    *[x for t, mid in ((129.73, "unroll"), (132.66, "shimmer"), (136.12, "page")) for x in ((t, "whoosh", -16), (t + 0.35, "cork", -6), (t + 0.45, mid, -10), (t + 0.9, "page", -12))],
    (140.1, "whoosh", -14), *[(140.25 + i * 0.16, "tile", -12) for i in range(5)], *[(144.42 + i * 0.27, "stamp", -9) for i in range(4)], (146.74, "chime", -12), (146.74, "stamp", -6),
    # S9 此刻 · 你
    (148.86, "whoosh", -14), (148.86, "boom", -12), (149.2, "shimmer", -14), (151.5, "whoosh", -16),
    (154.97, "coins", -7), (156.04, "coins", -7), (157.11, "coins", -5), (157.11, "chime", -10),
    # S10 片尾
    (157.37, "fizz", -8), (157.37, "boom", -10), (157.6, "shimmer", -14),
]
