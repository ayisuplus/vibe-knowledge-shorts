# 第五期音效清单（从第一性原理理解调色）：手机、像素、滑块、数字、换色。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；前 10 个复用第四期 sfx/raw。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里的动画时间。

SOUNDS = {
    # 复用第四期
    "boom":    dict(prompt="a deep warm cinematic low boom with a long soft tail", dur=3.0, shape="impact", length=2.0, seed=181),
    "chime":   dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "whoosh":  dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "shimmer": dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "page":    dict(prompt="an old book page turning, dry paper", dur=1.5, shape="tick", length=0.7, seed=211),
    "crack":   dict(prompt="a marble statue cracking, one loud sharp stone crack", dur=1.5, shape="impact", length=0.7, seed=397),
    "stamp":   dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    "popv":    dict(prompt="a small glass bottle set down on a wooden shelf, light glass clink and knock", dur=1.0, shape="tick", length=0.45, seed=241),
    "thud":    dict(prompt="a heavy marble statue bust dropped onto a stone floor, deep solid thud", dur=1.5, shape="impact", length=1.1, seed=311),
    "clack":   dict(prompt="a ceramic plate placed down on a stone table, clear hard clack", dur=1.0, shape="tick", length=0.5, seed=321),
    # 第五期新增
    "shutter": dict(prompt="a smartphone camera shutter click, crisp digital shutter sound", dur=1.0, shape="tick", length=0.5, seed=501),
    "ticker":  dict(prompt="a fast mechanical number counter rolling, rapid soft plastic clicks", dur=1.5, shape="raw", length=1.0, seed=511),
    "slide":   dict(prompt="a smooth plastic slider knob dragged along a track, soft friction swish", dur=1.5, shape="whoosh", length=0.8, seed=521),
    "tap":     dict(prompt="a single finger tap on a glass phone screen, soft crisp tick", dur=1.0, shape="tick", length=0.3, seed=531),
    "rain":    dict(prompt="steady light rain falling, many small raindrops pattering on a roof", dur=4.5, shape="raw", length=4.0, seed=547),
}

CUES = [
    # S0 钩子
    (0.06, "shutter", -5), (0.06, "boom", -12), (2.18, "whoosh", -12), (2.45, "thud", -4), (2.75, "ticker", -12), (3.35, "popv", -6),
    (4.2, "whoosh", -13), (4.45, "whoosh", -10), (5.55, "clack", -12), (6.43, "clack", -8), (8.57, "shimmer", -13), (9.55, "whoosh", -12),
    # S1 片名
    (10.69, "boom", -9), (11.1, "chime", -16), (12.82, "chime", -18), (14.94, "whoosh", -14),
    # S2 往下问
    (17.05, "popv", -10), (17.4, "rain", -17), (21.33, "whoosh", -14), (23.45, "popv", -10), (24.0, "whoosh", -16), (25.0, "tap", -10),
    *[(27.0 + i * 0.09, "popv", -17) for i in range(6)], (28.49, "chime", -10),
    # S3 问到人眼
    (31.95, "popv", -10), (33.68, "whoosh", -8), (34.3, "shimmer", -19), (35.2, "shimmer", -19), (36.1, "shimmer", -19),
    (38.34, "boom", -7), (38.34, "chime", -12), (40.46, "shimmer", -14), (42.59, "shimmer", -14), (43.38, "stamp", -6),
    (44.75, "whoosh", -10), (46.0, "shimmer", -12), (48.96, "whoosh", -14), (49.0, "popv", -8), (51.08, "ticker", -12),
    (52.41, "thud", -8), (53.21, "ticker", -10), (56.13, "thud", -6),
    # S4 亮度与过曝
    (57.46, "thud", -3), (57.46, "boom", -10), (59.59, "whoosh", -14), (60.0, "popv", -10), (61.44, "slide", -10),
    (63.58, "crack", -4), (63.58, "thud", -6), (63.58, "boom", -12), (65.17, "slide", -10), (65.97, "stamp", -6),
    # S5 对比度与逆光
    (68.09, "popv", -12), (69.42, "slide", -10), (72.34, "whoosh", -12), (74.47, "slide", -10),
    # S6 曲线
    (76.59, "shimmer", -14), (78.45, "clack", -10), (80.84, "clack", -10), (82.7, "clack", -10), (85.34, "whoosh", -10), (85.34, "chime", -12),
    # S7 留白
    (87.3, "popv", -10), (87.4, "popv", -11), (87.5, "popv", -12),
    # S8 饱和度
    (93.59, "popv", -12), (97.85, "slide", -10), (99.97, "popv", -12), (102.1, "page", -9), (102.55, "popv", -12),
    (104.22, "popv", -8), (104.22, "chime", -14), (106.61, "slide", -8), (106.9, "thud", -10),
    # S9 白平衡
    (110.61, "thud", -3), (110.61, "boom", -10), (112.99, "whoosh", -10), (115.65, "chime", -12), (116.98, "whoosh", -12),
    (119.11, "tap", -6), (120.43, "ticker", -12), (121.23, "shimmer", -8), (125.0, "whoosh", -12),
    # S10 滤镜与合成
    (127.61, "popv", -12), *[(127.9 + i * 0.12, "popv", -16) for i in range(6)], *[(129.85 + i * 0.16, "tap", -14) for i in range(6)],
    (132.66, "whoosh", -8), (132.66, "shimmer", -12), (136.12, "whoosh", -14),
    (137.2, "clack", -12), (138.24, "clack", -12), (139.3, "clack", -12), (140.1, "boom", -8), (140.1, "shimmer", -12), (144.9, "whoosh", -14),
    # S11 拍照建议
    (148.86, "popv", -8), (149.5, "slide", -12), (151.0, "popv", -8), (151.3, "slide", -12), (153.12, "popv", -8), (154.0, "tap", -6),
    (154.97, "chime", -14), (156.04, "whoosh", -14),
    # S12 金句
    (157.11, "boom", -5), (157.11, "thud", -8), (158.2, "chime", -12),
]
