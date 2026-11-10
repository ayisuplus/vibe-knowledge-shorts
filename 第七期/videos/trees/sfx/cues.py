# 第七期音效清单（一棵树，长出整个计算机世界）。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；前 11 个复用第六期 sfx/raw。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里各场景的卡点（见 03-分镜脚本 和 audio/beat_data.json）。

SOUNDS = {
    # 复用第六期
    "whoosh":  dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "shimmer": dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "chime":   dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "page":    dict(prompt="an old book page turning, dry paper", dur=1.5, shape="tick", length=0.7, seed=211),
    "tap":     dict(prompt="a single finger tap on a glass phone screen, soft crisp tick", dur=1.0, shape="tick", length=0.3, seed=531),
    "ticker":  dict(prompt="a fast mechanical number counter rolling, rapid soft plastic clicks", dur=1.5, shape="raw", length=1.0, seed=511),
    "thud":    dict(prompt="a heavy marble statue bust dropped onto a stone floor, deep solid thud", dur=1.5, shape="impact", length=1.1, seed=311),
    "clack":   dict(prompt="a ceramic plate placed down on a stone table, clear hard clack", dur=1.0, shape="tick", length=0.5, seed=321),
    "pen":     dict(prompt="a fountain pen writing quickly on rough paper, scratchy nib", dur=3.0, shape="raw", length=2.4, seed=631),
    "slap":    dict(prompt="a sheet of paper slapped flat against a glass window, crisp paper smack", dur=1.0, shape="tick", length=0.4, seed=621),
    "stamp":   dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    # 第七期新增
    "rewind":  dict(prompt="a reverse cymbal swell, a quick backwards whoosh rising and sucking in", dur=2.0, shape="whoosh", length=1.8, seed=7101),
    "dirt":    dict(prompt="a small seed dropping into soft garden soil, soft muffled thump with a little dirt scatter", dur=1.0, shape="impact", length=0.6, seed=7002),
    "sprout":  dict(prompt="a plant shoot bursting up through soil, soft organic pop with a gentle rustle", dur=1.2, shape="tick", length=0.8, seed=7003),
    "twig":    dict(prompt="a small green twig growing and snapping into place, light woody crackle", dur=0.8, shape="tick", length=0.45, seed=7004),
    "rustle":  dict(prompt="leaves rustling softly in a light breeze", dur=2.5, shape="raw", length=2.2, seed=7005),
    "spark":   dict(prompt="a soft magical sparkle ping, tiny bright bell", dur=0.8, shape="tick", length=0.5, seed=7006),
    "roll":    dict(prompt="a heavy watermelon rolling along a wooden plank, low rumbling roll", dur=1.6, shape="raw", length=1.2, seed=7007),
    "melon":   dict(prompt="a ripe watermelon dropped onto soft grass, deep hollow thump", dur=1.0, shape="impact", length=0.6, seed=7008),
    "snip":    dict(prompt="garden pruning shears cutting a thin branch, crisp metallic snip", dur=0.8, shape="tick", length=0.5, seed=7009),
    "twigfall": dict(prompt="a few small twigs falling and tumbling onto leaves", dur=1.5, shape="raw", length=1.2, seed=7010),
    "ratchet": dict(prompt="a wooden clockwork gear ratchet clicking around smoothly", dur=1.5, shape="raw", length=1.2, seed=7011),
    "clunk":   dict(prompt="a big wooden gear turning and locking into place with a solid clunk", dur=1.0, shape="impact", length=0.6, seed=7012),
    "stone":   dict(prompt="a stone tablet sliding into place on stone, gritty slide", dur=1.2, shape="whoosh", length=1.0, seed=7013),
    "buzz":    dict(prompt="a soft wrong answer buzzer, short low dull buzz", dur=0.8, shape="tick", length=0.5, seed=7014),
    "swell":   dict(prompt="a warm magical rising swell, soft airy shimmer building up", dur=3.0, shape="whoosh", length=2.6, seed=7015),
    "forest":  dict(prompt="many leaves rustling loudly as young trees sway in a gust of wind, soft wooden branch creaks", dur=3.0, shape="raw", length=2.6, seed=7116),
}

FORKS = [20.53, 21.86, 23.19, 23.99, 25.05, 26.11]
GUESS = [55.9, 56.97, 58.03, 59.09]
CUES = [
    # S0 钩子：完全体大树 → 根系点亮 → 示意图 → 推向土里
    (0.0, "swell", -14), (2.44, "shimmer", -8), (2.6, "swell", -12), (6.97, "pen", -13), (7.2, "whoosh", -16), (9.09, "whoosh", -14),
    # S1 倒放回种子 → 片名 → 落土
    (11.21, "rewind", -8), (13.35, "chime", -10), (13.4, "shimmer", -14), (15.6, "whoosh", -16), (16.22, "dirt", -4),
    # S2 发芽 → 分叉 6 次 → 河流 / 闪电 / 支气管 → 长叶 → 沉到地下
    (17.6, "sprout", -4), (17.7, "rustle", -16), (19.73, "slap", -12), *[(t, "twig", -6 - (i > 2)) for i, t in enumerate(FORKS)],
    (26.11, "slap", -10), (26.64, "slap", -10), (27.17, "slap", -10), (28.25, "whoosh", -12), (28.65, "chime", -14),
    (30.37, "rustle", -9), (32.5, "whoosh", -12), (34.35, "whoosh", -10),
    # S3 根变节点 → 三条规矩 → 文件夹 / 家谱 / 公司 → 朋友圈
    *[(36.76 + i * 0.11, "spark", -15) for i in range(12)], (38.88, "shimmer", -14),
    (41.01, "tap", -8), (43.14, "tap", -8), (43.14, "shimmer", -12), (43.93, "tap", -8), (44.4, "buzz", -10),
    (45.27, "page", -10), (47.39, "page", -10), (48.45, "page", -10), (49.52, "spark", -10), (50.0, "whoosh", -16), (50.84, "whoosh", -10),
    # S4 猜数 → 7 层 → 竹竿 → 红黑树 → 100 万 vs 40 → 手机
    (51.64, "slap", -10), (53.78, "tap", -6), (54.03, "whoosh", -14), *[(t, "tap", -7) for t in GUESS], (60.15, "chime", -6),
    (60.6, "ticker", -12), (61.49, "shimmer", -10), (62.95, "tap", -10), (64.0, "whoosh", -14),
    *[(64.6 + k * 0.19, "tap", -12) for k in range(10)], (66.54, "ticker", -8), (66.54, "whoosh", -8), (67.33, "thud", -8),
    (68.26, "shimmer", -12), (70.45, "ratchet", -8), (71.05, "clunk", -4), (72.6, "ratchet", -8), (73.4, "ratchet", -10), (74.25, "clunk", -6), (75.05, "chime", -14),
    (77.17, "page", -10), (79.56, "stamp", -6), (79.56, "thud", -10), (81.43, "slap", -10), (83.56, "whoosh", -10),
    # S5 咬死了猎人的狗 → 1 + 2 × 3 → 根全部点亮
    (85.68, "stone", -8), (87.81, "whoosh", -14), (89.93, "shimmer", -12), (90.5, "twig", -12), (92.07, "shimmer", -12), (92.6, "twig", -12), (94.19, "chime", -16),
    (96.32, "stone", -12), *[(t, "spark", -14) for t in (96.62, 96.97, 97.32)], (98.45, "chime", -8), (99.0, "chime", -6), (99.35, "buzz", -12), (100.58, "swell", -6),
    # S6 破土 → 20 个问题 → 挑西瓜 → 过拟合 → 剪枝
    (102.55, "whoosh", -6), (102.7, "sprout", -6), (102.75, "rustle", -8), (103.0, "twig", -8),
    (104.84, "ticker", -10), (105.9, "ticker", -10), (106.96, "chime", -6),
    (109.09, "whoosh", -16), (109.5, "melon", -4), (111.21, "tap", -10), (111.6, "roll", -8), (113.35, "tap", -10), (113.75, "roll", -8), (115.0, "melon", -8), (115.47, "chime", -8), (117.6, "shimmer", -12),
    *[(119.33 + i * 0.18, "twig", -8) for i in range(4)], (121.86, "whoosh", -16), (122.2, "melon", -10), (122.3, "roll", -10), (123.6, "buzz", -6),
    (126.11, "whoosh", -10), (128.95, "snip", -2), (129.05, "twigfall", -6), (129.7, "whoosh", -14),
    (132.49, "whoosh", -14), (134.35, "sprout", -12), (134.63, "sprout", -12), (135.95, "sprout", -12),
    # S7 一片森林 → 投票
    (136.75, "forest", -6), (137.28, "sprout", -12), (137.82, "sprout", -12), (138.35, "sprout", -12), *[(138.88 + i * 0.2, "spark", -15) for i in range(3)],
    *[(141.01 + i * 0.12, "spark", -14) for i in range(5)], (141.8, "whoosh", -10), (143.14, "chime", -6), (145.26, "whoosh", -8),
    # S8 生命之树 → 达尔文 → 书页 → 回到开场那一帧
    (145.7, "swell", -8), (147.4, "shimmer", -10), (149.53, "chime", -10), (149.6, "shimmer", -12), (151.65, "whoosh", -14),
    (153.6, "page", -8), (155.91, "pen", -8), (158.03, "page", -6), (160.16, "swell", -10), (160.2, "shimmer", -12), (162.3, "rustle", -16),
    # S9 金句 → 剪掉一根小枝 → 淡出
    (166.54, "swell", -14), (168.68, "chime", -10), (171.7, "whoosh", -14), (173.17, "snip", -2), (173.25, "twigfall", -8), (173.9, "whoosh", -16), (176.0, "rustle", -18),
]
