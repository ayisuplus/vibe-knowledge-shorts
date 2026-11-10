# 第三期音效清单：科幻全息 + 化学实验。每个音效 = 一段 MMAudio 文字生成的素材 + 一种包络 + 若干出现时刻。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻都取自 分镜脚本.md 和 assets/js 里的动画时间。

NEG = "music, melody, singing, speech, voice, talking"

SOUNDS = {
    "ignite":  dict(prompt="fire torch ignition burst, loud whoosh of flame catching", dur=1.5, shape="impact", length=1.0, seed=29),
    "boil":    dict(prompt="liquid boiling and bubbling inside a glass flask, gentle bubbling", dur=4.0, shape="raw", length=3.6, seed=21),
    "drip":    dict(prompt="single water drop falling into a glass of water, clear plop", dur=1.0, shape="tick", length=0.6, seed=31),
    "glitch":  dict(prompt="short digital glitch burst, electronic stutter, data corruption", dur=1.0, shape="impact", length=0.5, seed=41),
    "holo":    dict(prompt="futuristic hologram powering on, rising electronic shimmer", dur=1.5, shape="whoosh", length=1.2, seed=51),
    "beep":    dict(prompt="short soft sci-fi interface beep", dur=1.0, shape="tick", length=0.25, seed=61),
    "chime":   dict(prompt="bright crystal glass chime ping", dur=1.5, shape="tick", length=1.2, seed=71),
    "boom":    dict(prompt="deep cinematic low boom impact with a short tail", dur=2.0, shape="impact", length=1.6, seed=81),
    "whoosh":  dict(prompt="fast sci-fi whoosh swipe", dur=1.0, shape="whoosh", length=0.6, seed=91),
    "rise":    dict(prompt="quick short ascending electronic swoosh", dur=1.0, shape="whoosh", length=0.45, seed=101),
    "knob":    dict(prompt="mechanical dial knob turning with ratchet clicks", dur=1.5, shape="raw", length=1.1, seed=111),
    "flame":   dict(prompt="flame roaring up, fire whoosh", dur=1.5, shape="whoosh", length=0.9, seed=121),
    "lock":    dict(prompt="digital lock-on confirmation, interface confirm click", dur=1.0, shape="tick", length=0.4, seed=131),
    "shatter": dict(prompt="small glass shattering into tiny pieces", dur=1.5, shape="impact", length=0.8, seed=141),
    "scan":    dict(prompt="laser scanner sweep, electronic scanning hum", dur=1.5, shape="whoosh", length=1.0, seed=151),
    "stamp":   dict(prompt="loud rubber stamp slammed onto a wooden desk, sharp thud", dur=1.0, shape="impact", length=0.45, seed=167),
    "type":    dict(prompt="quick keyboard typing clicks", dur=1.5, shape="raw", length=1.2, seed=171),
    "alarm":   dict(prompt="low pulsing warning alarm drone, sci-fi alert", dur=4.0, shape="raw", length=3.2, seed=181),
    "data":    dict(prompt="streaming digital data chatter, soft computer processing noises", dur=3.0, shape="raw", length=2.5, seed=191),
    "counter": dict(prompt="fast digital counter ticking up, rapid electronic ticks", dur=1.5, shape="raw", length=0.9, seed=201),
    "popup":   dict(prompt="computer warning popup alert sound", dur=1.0, shape="tick", length=0.6, seed=211),
    "thump":   dict(prompt="soft punchy low thump", dur=1.0, shape="impact", length=0.5, seed=221),
    "flip":    dict(prompt="quick digital card flip swish", dur=1.0, shape="tick", length=0.4, seed=231),
    "fizz":    dict(prompt="small flame being snuffed out, short fizzle", dur=1.5, shape="impact", length=1.0, seed=241),
    "sparkle": dict(prompt="magical light particles shimmering, soft glittering", dur=2.0, shape="whoosh", length=1.4, seed=251),
}

# 这些用 sfx/synth.py 合成（MMAudio 版本基本是底噪），generate.py 跳过它们
SYNTH = {"beep", "chime", "lock", "drip", "glitch", "rise", "holo", "knob", "scan", "boom", "stamp", "sparkle"}

BEAT = 0.534

# (时刻, 音效, 增益 dB)
CUES = [
    # S1 开场
    (0.0, "boil", -20), (3.3, "boil", -21), (0.06, "boom", -8), (0.06, "glitch", -11), (0.1, "ignite", -12),
    *[(t, "beep", -16) for t in (2.18, 2.71, 3.25, 3.78, 4.32)],
    (2.45, "drip", -9), (4.32, "drip", -9),
    (6.43, "glitch", -7), (6.43, "holo", -10), (6.93, "whoosh", -14), (7.38, "chime", -15),
    (8.07, "whoosh", -17), (8.57, "chime", -8), (8.57, "sparkle", -14), (9.10, "beep", -17),
    # S2 片名
    (10.69, "boom", -6), (10.69, "glitch", -12), (12.82, "beep", -18),
    # S3
    (16.9, "whoosh", -14), (17.05, "holo", -13), (17.32, "thump", -16), (17.59, "thump", -16), (17.86, "thump", -16),
    (21.33, "chime", -14), (25.58, "scan", -16), (25.58, "beep", -16), (26.11, "beep", -16),
    # S4 温度
    (29.83, "whoosh", -12), *[(30.13 + i * BEAT, "rise", -15) for i in range(5)], (30.43, "beep", -16),
    (33.68, "thump", -9), (33.68, "rise", -12),
    (37.9, "flame", -10), (38.34, "knob", -9), (39.1, "knob", -12),
    (43.38, "beep", -13), (43.91, "beep", -13), (44.45, "beep", -13), (46.84, "beep", -14),
    (51.08, "knob", -11), (51.08, "beep", -17), (53.6, "knob", -12),
    (55.33, "chime", -14), (56.13, "data", -17), (59.59, "data", -14), (61.9, "data", -16),
    (63.58, "lock", -8), (63.84, "knob", -13), (64.0, "chime", -16), (64.9, "beep", -12),
    # S5 没见过的 3
    (68.2, "data", -15), (70.5, "data", -18), (72.34, "scan", -9),
    *[(72.54 + k * 0.12, "shatter", -12) for k in range(5)],
    (76.59, "holo", -12), (77.6, "sparkle", -10), (78.45, "boom", -8), (78.45, "chime", -10),
    (80.84, "beep", -16), (82.70, "chime", -12),
    # S6 转场
    (87.21, "whoosh", -14), (87.56, "stamp", -5), (89.35, "whoosh", -14),
    *[(89.5 + k * 0.4, "beep", -18) for k in range(4)], (91.46, "whoosh", -8), (91.46, "holo", -10),
    # S7 大模型怎么蒸
    (93.59, "boom", -10), *[(93.59 + i * BEAT, "rise", -13) for i in range(3)], (95.19, "chime", -15),
    (97.85, "beep", -12), (102.10, "flip", -12), (106.61, "lock", -12), (109.27, "lock", -12),
    (110.61, "whoosh", -14), (110.61, "thump", -11), (111.5, "thump", -12), (111.8, "whoosh", -16), (112.1, "chime", -14),
    (112.99, "rise", -10), (113.14, "rise", -12), (112.99, "counter", -14),
    (116.98, "holo", -14), (117.1, "type", -12), (120.28, "flip", -10), (120.43, "chime", -10),
    # S8 争议
    (121.23, "glitch", -8), (121.23, "scan", -10), (121.4, "alarm", -12), (124.4, "alarm", -14),
    (125.48, "popup", -8), (129.73, "data", -12), (132.0, "data", -13), (134.3, "data", -15),
    (132.66, "boom", -8), (132.66, "counter", -12),
    (136.12, "whoosh", -12), (136.2, "thump", -10), (138.24, "whoosh", -12), (138.3, "thump", -10),
    (140.10, "glitch", -10), (140.10, "thump", -8), (140.37, "whoosh", -14), (142.49, "whoosh", -14),
    (146.74, "holo", -16),
    # S9 收尾
    (148.86, "whoosh", -14), (149.76, "ignite", -10), (150.0, "boil", -20), (153.3, "boil", -21),
    (154.97, "drip", -8), (156.04, "drip", -8), (157.11, "drip", -6), (157.11, "chime", -10),
    (157.37, "fizz", -9), (157.37, "boom", -9), (157.37, "glitch", -12),
]
