# 第二期音效清单：纸质感为主。每个音效 = 一段 MMAudio 文字生成的素材 + 一种包络 + 若干出现时刻。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。觉醒段钢琴（141.6–153.9）不放音效。

NEG = "music, melody, singing, speech, voice, talking"

SOUNDS = {
    "click":     dict(prompt="small cardboard paper tab snapping into a slot, crisp paper click", dur=1.0, shape="tick", length=0.35, seed=11),
    "slap":      dict(prompt="sticker slapped onto paper, quick flat paper slap", dur=1.0, shape="impact", length=0.45, seed=21),
    "scissors":  dict(prompt="scissors cutting through paper, snip snip", dur=1.5, shape="raw", length=1.0, seed=31),
    "pop":       dict(prompt="cute soft pop, small bubble pop", dur=1.0, shape="tick", length=0.45, seed=41),
    "whoosh":    dict(prompt="light paper whoosh swish through the air", dur=1.2, shape="whoosh", length=0.7, seed=51),
    "flip":      dict(prompt="paper card flipping over quickly, cardboard flap", dur=1.0, shape="tick", length=0.45, seed=61),
    "hit":       dict(prompt="soft punchy thump with a bright sparkle on top, cute title impact", dur=2.0, shape="impact", length=1.3, seed=71),
    "ding":      dict(prompt="small shop cash register bell ding", dur=1.5, shape="tick", length=1.0, seed=81),
    "scroll":    dict(prompt="fast smartphone scrolling swipes with tiny interface ticks", dur=3.0, shape="raw", length=2.4, seed=91),
    "coin":      dict(prompt="single coin clink", dur=1.0, shape="tick", length=0.6, seed=101),
    "heartbeat": dict(prompt="slow deep heartbeat thumps", dur=4.0, shape="raw", length=3.6, seed=111),
    "pages":     dict(prompt="calendar pages flipping quickly, paper riffle", dur=1.5, shape="raw", length=1.2, seed=121),
    "sparkle":   dict(prompt="bright magical sparkle shine, diamond glint shimmer", dur=2.0, shape="whoosh", length=1.4, seed=131),
    "typewriter": dict(prompt="old mechanical typewriter typing keys, clacking", dur=3.0, shape="raw", length=2.4, seed=141),
    "thud":      dict(prompt="heavy weight dropping with a dull thud", dur=1.5, shape="impact", length=0.9, seed=151),
    "blister":   dict(prompt="hard plastic blister package snapping shut, plastic clack", dur=1.5, shape="impact", length=0.9, seed=161),
    "stamp":     dict(prompt="rubber stamp thumped onto paper", dur=1.0, shape="impact", length=0.4, seed=171),
    "crinkle":   dict(prompt="plastic packaging being squeezed, crinkling", dur=2.0, shape="raw", length=1.6, seed=181),
    "counter":   dict(prompt="fast mechanical number counter ticking up, rapid clicks", dur=3.0, shape="raw", length=2.6, seed=191),
    "pileup":    dict(prompt="many paper boxes and packages tumbling onto a pile, rustling cardboard", dur=2.0, shape="raw", length=1.6, seed=201),
    "vinyl":     dict(prompt="old vinyl record crackle and pop", dur=2.5, shape="raw", length=2.0, seed=211),
    "printer":   dict(prompt="thermal receipt printer printing one short line, quick mechanical buzz", dur=1.0, shape="tick", length=0.32, seed=221),
    "tear":      dict(prompt="paper receipt being torn off quickly, sharp paper rip", dur=1.5, shape="impact", length=0.8, seed=231),
}

AGES = [16.61, 32.62, 60.62, 84.61, 100.62, 122.61]

# (时刻, 音效, 增益 dB)
CUES = [
    # S0
    (0.0, "slap", -8), (8.15, "tear", -6), (8.62, "hit", -6), (11.3, "pop", -11), (12.61, "pop", -17), (14.62, "click", -9),
    # S1
    (18.61, "slap", -9), (20.61, "pop", -15), (21.28, "click", -9), (21.95, "click", -9), (24.61, "whoosh", -17),
    (26.61, "whoosh", -13), (27.28, "flip", -11), (27.4, "ding", -12), (30.62, "click", -9),
    # S2
    (34.61, "scroll", -14), (36.61, "slap", -9), (36.95, "slap", -10), (38.62, "whoosh", -12),
    (42.62, "coin", -10), (43.29, "pop", -12), (44.61, "click", -9), (45.28, "click", -9), (48.61, "whoosh", -12),
    (50.62, "heartbeat", -9), (54.63, "click", -7), (58.8, "whoosh", -11),
    # S3
    (62.61, "pages", -12), (62.61, "pop", -14), (63.28, "pop", -14), (63.95, "pop", -14), (64.62, "pop", -14),
    (64.62, "slap", -9), (66.62, "whoosh", -14), (68.62, "click", -9), (69.28, "click", -9), (69.95, "click", -9),
    (72.61, "slap", -12), (72.94, "slap", -12), (76.61, "click", -9), (76.75, "ding", -10), (80.62, "sparkle", -15),
    # S4
    (86.61, "sparkle", -8), (88.62, "slap", -9), (90.62, "typewriter", -10),
    (96.62, "click", -9), (97.29, "click", -9), (98.62, "click", -8), (98.95, "thud", -7),
    # S5
    (100.62, "blister", -6), (102.62, "slap", -9), (103.29, "click", -9), (103.95, "click", -9), (104.62, "click", -9),
    (106.63, "stamp", -8), (107.3, "stamp", -8), (107.96, "stamp", -8), (108.62, "stamp", -8), (109.29, "stamp", -8),
    (112.62, "slap", -9), (114.61, "click", -9), (115.0, "slap", -12),
    (118.62, "crinkle", -11), (118.62, "click", -10), (119.29, "click", -10), (119.95, "click", -10),
    (120.62, "pop", -12), (121.29, "click", -11),
    # S6
    (122.61, "whoosh", -12), (124.62, "slap", -9), (126.62, "pop", -13), (130.61, "counter", -11),
    (134.62, "slap", -9), (135.29, "click", -9), (135.95, "click", -9), (136.4, "pileup", -8),
    # S7（钢琴段之后）
    (153.92, "click", -10), (157.09, "slap", -13), (157.88, "click", -13), (158.63, "click", -13), (159.4, "click", -13),
    (163.26, "vinyl", -11),
    # S8
    (166.36, "whoosh", -15), (169.23, "flip", -8), (173.2, "whoosh", -16),
] + [(round(0.6 + i * 0.6667, 3), "printer", -10) for i in range(12)] + [(t, "flip", -13) for t in [0.6, 1.93, 3.27, 3.93, 4.61, 5.27, 6.61]] + [(t, "flip", -12) for t in AGES] + [(t + 0.02, "slap", -10) for t in AGES]
