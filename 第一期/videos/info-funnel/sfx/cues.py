# 全片音效清单：每个音效 = 一段 MMAudio 文字生成的素材 + 一种包络 + 若干出现时刻。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB），最终整条音效轨再统一压在配乐下面。

NEG = "music, melody, singing, speech, voice, talking"

SOUNDS = {
    "rain":       dict(prompt="heavy shimmering downpour of glittering particles, sparkling digital rain pouring", dur=6.0, shape="raw", seed=11),
    "boom":       dict(prompt="deep cinematic boom impact with heavy sub bass, trailer hit", dur=3.0, shape="impact", length=2.6, seed=7),
    "slam":       dict(prompt="punchy cinematic hit, metallic slam", dur=2.5, shape="impact", length=1.8, seed=21),
    "shimmer":    dict(prompt="glassy crystalline shimmer swell, magical sparkle", dur=2.0, shape="whoosh", length=1.4, seed=31),
    "twinkle":    dict(prompt="soft magical sparkle chime, tiny bell twinkle", dur=1.5, shape="tick", length=0.9, seed=41),
    "swarm":      dict(prompt="airy whoosh of a swarm of particles moving, soft wind swoosh", dur=3.5, shape="whoosh", length=3.2, seed=51),
    "pingpong":   dict(prompt="soft digital pings bouncing back and forth, ping pong delay blips", dur=4.0, shape="raw", length=3.5, seed=61),
    "fizzle":     dict(prompt="electric sparks fizzling out, wires snapping, small zaps", dur=3.0, shape="raw", length=2.6, seed=71),
    "swell":      dict(prompt="deep bass swell, low airy drone closing in", dur=3.0, shape="whoosh", length=2.5, seed=81),
    "descend":    dict(prompt="huge sci-fi machine descending from above, rising mechanical whoosh", dur=2.5, shape="whoosh", length=1.7, seed=91),
    "thud":       dict(prompt="heavy metallic impact thud, sci-fi machine landing", dur=2.5, shape="impact", length=2.0, seed=101),
    "typing":     dict(prompt="fast computer keyboard typing with digital data blips", dur=3.0, shape="raw", length=2.4, seed=111),
    "glitchzoom": dict(prompt="glitchy digital swoosh, data transition whoosh", dur=2.0, shape="whoosh", length=1.6, seed=121),
    "crunch":     dict(prompt="digital data compression crunch, glitchy squeeze", dur=2.0, shape="whoosh", length=1.4, seed=131),
    "scatter":    dict(prompt="sparkling particles scattering outward, airy shimmer", dur=2.5, shape="whoosh", length=2.2, seed=141),
    "laser":      dict(prompt="sci-fi laser energy beams streaming, futuristic zap whoosh", dur=3.0, shape="raw", length=2.8, seed=151),
    "zap":        dict(prompt="quick electric zaps, short error buzz", dur=2.0, shape="raw", length=1.4, seed=161),
    "powerdown":  dict(prompt="many small lights switching off, power down clicks", dur=2.0, shape="raw", length=1.5, seed=171),
    "beeps":      dict(prompt="digital user interface bars rising, ascending beeps", dur=2.0, shape="raw", length=1.4, seed=181),
    "swipe":      dict(prompt="soft user interface swipe sound", dur=1.5, shape="tick", length=0.8, seed=191),
    "shuffle":    dict(prompt="fast card shuffle whoosh with a mechanical click", dur=1.5, shape="impact", length=1.0, seed=201),
    "swap":       dict(prompt="quick short digital swap whoosh", dur=1.5, shape="whoosh", length=0.9, seed=211),
    "fall":       dict(prompt="falling whoosh with descending pitch", dur=2.0, shape="whoosh", length=1.2, seed=221),
    "notify":     dict(prompt="smartphone notification pop, soft bright user interface chime", dur=1.5, shape="tick", length=1.0, seed=231),
    "ping":       dict(prompt="clean digital user interface ping beep", dur=1.0, shape="tick", length=0.6, seed=241),
    "passby":     dict(prompt="fast whoosh passing by", dur=1.5, shape="whoosh", length=0.9, seed=251),
    "spinup":     dict(prompt="spinning turbine accelerating, rising whoosh spinning faster and faster", dur=8.5, shape="raw", length=8.0, seed=261),
    "spinfast":   dict(prompt="very fast spinning whoosh, high speed rotation, rising tension", dur=7.0, shape="raw", length=6.6, seed=271),
    "vortex":     dict(prompt="swirling vortex tightening, rising suction whoosh", dur=3.0, shape="whoosh", length=2.6, seed=281),
    "enclose":    dict(prompt="deep muffled bass impact, heavy enclosing hum", dur=3.5, shape="impact", length=3.0, seed=291),
    "tap":        dict(prompt="phone screen tap click", dur=1.0, shape="tick", length=0.4, seed=301),
    "crack":      dict(prompt="glass cracking, hard shell fracturing", dur=2.5, shape="impact", length=2.0, seed=311),
    "shatter":    dict(prompt="glass shattering explosion with sparkling debris falling", dur=3.5, shape="raw", length=3.0, seed=321),
    "rise":       dict(prompt="rising whoosh building up", dur=2.0, shape="whoosh", length=1.6, seed=331),
}

# (时刻, 音效, 增益 dB)
CUES = [
    (0.0, "rain", -13), (0.058, "boom", -5), (2.183, "slam", -7),
    (4.319, "shimmer", -13), (6.432, "shimmer", -13), (8.568, "shimmer", -13),
    (12.95, "twinkle", -14), (13.8, "twinkle", -15), (14.94, "twinkle", -14), (15.9, "twinkle", -15),
    (17.05, "swarm", -11), (21.33, "pingpong", -15), (25.58, "fizzle", -13), (28.49, "swell", -11),
    (31.95, "descend", -8), (33.6, "thud", -6), (35.1, "typing", -16),
    (38.34, "glitchzoom", -9), (40.46, "crunch", -11), (43.38, "scatter", -11),
    (46.84, "laser", -12), (52.41, "zap", -12), (54.27, "powerdown", -13), (56.13, "beeps", -15), (61.44, "swipe", -14),
    (63.58, "shuffle", -8), (65.97, "swap", -11), (67.3, "swap", -12), (69.42, "fall", -11), (70.5, "notify", -9),
    (72.6, "ping", -11), (74.5, "ping", -11), (76.59, "ping", -10), (78.45, "ping", -11),
    (80.5, "passby", -12), (82.7, "passby", -11), (85.35, "passby", -11),
    (93.59, "spinup", -12), (101.4, "spinfast", -13), (108.0, "vortex", -9), (110.61, "enclose", -6),
    (123.6, "ping", -13), (124.8, "ping", -13), (127.87, "laser", -12),
    (132.66, "tap", -11), (133.51, "tap", -11), (134.36, "tap", -11),
    (140.1, "crack", -6), (142.49, "shatter", -7),
    (155.5, "rise", -11), (157.11, "notify", -7), (157.11, "boom", -12),
]
