# 第六期音效清单（马克思写下的那扇门，AI 打开了一半）。
# 素材由 Sony Woosh（ComfyUI-Woosh，Woosh-Flow 50 步）文字生成；前 15 个复用第五期 sfx/raw。
# shape: impact（瞬起、指数衰减）/ whoosh（渐入渐出）/ tick（短促）/ raw（保留原样，只做首尾淡化）
# gain：相对增益（dB）。时刻取自 assets/js 里的动画时间（多数吸附在 audio/beat_data.json 的拍点上）。

SOUNDS = {
    # v19/v20 星星之火（纸被点燃）
    "paperburn": dict(prompt="a sheet of paper catching fire, crackling and curling as it burns, soft and close", dur=3.0, shape="raw", length=3.0, seed=2001),
    "ignite":  dict(prompt="a single match strike igniting into a small soft crackling flame", dur=2.5, shape="raw", length=2.5, seed=1901),
    "crackle": dict(prompt="a small campfire flame crackling and flickering softly", dur=3.0, shape="raw", length=3.0, seed=1902),
    "blaze":   dict(prompt="a big wildfire whoosh, flames sweeping and roaring across a field, rising then fading", dur=3.5, shape="raw", length=3.5, seed=1903),
    # 复用第五期
    "boom":    dict(prompt="a deep warm cinematic low boom with a long soft tail", dur=3.0, shape="impact", length=2.0, seed=181),
    "chime":   dict(prompt="a single soft glass chime, gentle bright ding", dur=2.0, shape="tick", length=1.4, seed=81),
    "whoosh":  dict(prompt="a soft gentle air whoosh, cloth swish", dur=1.5, shape="whoosh", length=0.8, seed=121),
    "shimmer": dict(prompt="a magical golden shimmer sweep, soft sparkling", dur=2.0, shape="whoosh", length=1.4, seed=191),
    "page":    dict(prompt="an old book page turning, dry paper", dur=1.5, shape="tick", length=0.7, seed=211),
    "stamp":   dict(prompt="a rubber stamp pressed firmly onto paper on a wooden desk, solid thump", dur=1.0, shape="impact", length=0.5, seed=91),
    "thud":    dict(prompt="a heavy marble statue bust dropped onto a stone floor, deep solid thud", dur=1.5, shape="impact", length=1.1, seed=311),
    "clack":   dict(prompt="a ceramic plate placed down on a stone table, clear hard clack", dur=1.0, shape="tick", length=0.5, seed=321),
    "tap":     dict(prompt="a single finger tap on a glass phone screen, soft crisp tick", dur=1.0, shape="tick", length=0.3, seed=531),
    "rain":    dict(prompt="steady light rain falling, many small raindrops pattering on a roof", dur=4.5, shape="raw", length=4.0, seed=547),
    "ticker":  dict(prompt="a fast mechanical number counter rolling, rapid soft plastic clicks", dur=1.5, shape="raw", length=1.0, seed=511),
    # 第六期新增
    "light":   dict(prompt="a huge industrial ceiling light bank switching on, loud heavy electrical clunk with a short hum", dur=1.5, shape="impact", length=0.9, seed=601),
    "servo":   dict(prompt="an industrial robot arm moving, smooth electric servo motor whirr", dur=2.0, shape="whoosh", length=1.4, seed=611),
    "slap":    dict(prompt="a sheet of paper slapped flat against a glass window, crisp paper smack", dur=1.0, shape="tick", length=0.4, seed=621),
    "pen":     dict(prompt="a fountain pen writing quickly on rough paper, scratchy nib", dur=3.0, shape="raw", length=2.4, seed=631),
    "lock":    dict(prompt="a heavy cast iron padlock dropped onto a stone floor, loud metallic clank", dur=1.5, shape="impact", length=1.0, seed=641),
    "unlock":  dict(prompt="a padlock shackle springing open, crisp metallic click", dur=1.0, shape="tick", length=0.5, seed=651),
    "rattle":  dict(prompt="someone violently yanking a locked iron padlock, heavy metal rattle and chain clank", dur=1.5, shape="impact", length=0.9, seed=661),
    "chain":   dict(prompt="a heavy iron chain suddenly pulled taut, sharp metallic snap", dur=1.0, shape="impact", length=0.6, seed=671),
    "clock":   dict(prompt="an old mechanical wall clock ticking very fast, rapid loud ticks", dur=4.0, shape="raw", length=3.6, seed=681),
    "steam":   dict(prompt="a 19th century steam engine chugging and hissing in a textile mill", dur=3.5, shape="raw", length=3.2, seed=691),
    "keys":    dict(prompt="fast typing on a computer keyboard, crisp key clicks", dur=3.0, shape="raw", length=2.6, seed=701),
    "scan":    dict(prompt="a futuristic laser scanner sweep, rising electronic beep", dur=1.5, shape="whoosh", length=1.0, seed=711),
    "deny":    dict(prompt="a harsh electronic access denied buzzer, two short low buzzes", dur=1.0, shape="tick", length=0.7, seed=721),
    "vtol":    dict(prompt="a heavy aircraft hovering overhead in the rain, deep turbine engine roar", dur=4.0, shape="raw", length=3.6, seed=731),
    "door":    dict(prompt="a heavy metal factory door pushed open, long low creak", dur=2.5, shape="whoosh", length=2.0, seed=741),
    "ram":     dict(prompt="a heavy battering ram slamming into a thick old wooden door, loud deep boom with splintering wood creak", dur=2.0, shape="impact", length=1.4, seed=761),
    "cheer":   dict(prompt="a small happy crowd cheering hooray and clapping, short celebratory cheer", dur=3.0, shape="raw", length=2.6, seed=771),
    "confetti": dict(prompt="a party popper confetti burst, bright pop and paper flutter", dur=1.5, shape="tick", length=0.9, seed=781),
    "slam":    dict(prompt="a heavy body slamming hard into a locked steel door, loud metallic bang with a rattling heavy padlock and chain", dur=1.5, shape="impact", length=1.1, seed=791),
    "crowd":   dict(prompt="a crowded noisy restaurant banquet hall, murmur of many voices and cutlery", dur=4.0, shape="raw", length=3.6, seed=751),
}

# v4（2026-10-14）：前半段重排（配乐加长到 228.76 秒），后半段（S6 起）沿用 v3 的时刻整体 +22.118 秒
PUSH = [73.31, 76.08, 78.84]
FRONT = [
    # S0 钩子：暖光工人
    (0.2, "servo", -18), (0.5, "whoosh", -12), (0.5, "boom", -16), (7.01, "slap", -4), (7.15, "pen", -10), (9.8, "stamp", -3), (9.8, "boom", -14), (12.56, "whoosh", -16),
    # S1 片名
    (15.3, "boom", -6), (15.3, "thud", -8), (16.0, "thud", -12), (16.2, "shimmer", -15),
    # S2 1958
    (20.14, "whoosh", -10), (20.3, "crowd", -15), (22.5, "crowd", -16), (21.4, "clack", -12), (22.6, "clack", -13), (24.9, "slap", -8), (25.1, "pen", -13),
    (31.9, "thud", -5), (32.05, "clack", -9), (35.4, "page", -9), (41.0, "boom", -10),
    # S3 马克思的前提 → 门 → 门后的生活
    (45.6, "slap", -8), (45.85, "pen", -13), (47.6, "stamp", -6), (48.3, "shimmer", -11), (53.4, "shimmer", -16), (51.2, "whoosh", -9), (51.4, "thud", -9), (55.6, "shimmer", -15), (56.6, "chime", -16), (53.45, "whoosh", -14), (53.5, "shimmer", -9),
    (60.17, "slap", -9), *[(t, "tap", -10) for t in (60.6, 61.99, 63.38, 64.77)], *[(t, "page", -9) for t in (66.41, 67.1, 67.8, 68.49)],
    # S4 三代机器撞门
    (70.55, "thud", -8), *[(t - 1.3, "whoosh", -10) for t in PUSH], *[(t, "ram", -1) for t in PUSH], *[(t + 0.1, "door", -10) for t in PUSH],
    (85.0, "page", -8), (86.0, "servo", -18), (89.6, "clack", -8), (90.1, "servo", -16), (91.0, "whoosh", -14), (94.6, "tap", -8), (94.9, "tap", -8), (96.4, "chime", -14),
    # S5 直到 AI：门推开
    (104.4, "shimmer", -12), (105.0, "boom", -9),
    (107.3, "tap", -6), (107.9, "tap", -6), (108.5, "tap", -6), (107.6, "keys", -14),
    # 小螃蟹：走来 → 114.80 推开第一道门 → 欢呼庆祝 → 走进走廊 → 镜头推近 → 第二道门上出现锁 → 三次猛撞，被弹飞
    *[(112.5 + i * 0.25, "tap", -15) for i in range(7)], (114.75, "thud", -5), (114.8, "door", -4), (114.8, "boom", -8), (114.9, "shimmer", -10),
    (114.95, "cheer", -4), (115.0, "confetti", -6), (115.43, "tap", -12), (115.91, "tap", -12),
    *[(120.35 + i * 0.25, "tap", -16) for i in range(6)], *[(124.55 + i * 0.25, "tap", -16) for i in range(7)],
    (126.2, "whoosh", -12), (127.25, "lock", -4),
    *[(h - 0.9, "whoosh", -18) for h in (131.39, 134.16, 136.92)], *[(h - 0.35, "whoosh", -9) for h in (131.39, 134.16, 136.92)],
    *[(h, "slam", -1) for h in (131.39, 134.16, 136.92)], *[(h, "ram", -5) for h in (131.39, 134.16, 136.92)], *[(h + 0.05, "rattle", -6) for h in (131.39, 134.16, 136.92)],
    (137.7, "thud", -6), (138.0, "chime", -12),
    # S6 钱是怎么流的 → 钥匙 → 钻进锁孔（代码时间，+6）
    (139.71, "page", -10), (141.0, "servo", -16), (141.4, "keys", -15), (145.4, "servo", -10), (145.6, "boom", -14), (146.0, "thud", -12), (149.5, "keys", -10), (152.1, "chime", -16),
    (155.0, "whoosh", -10), (155.6, "boom", -10), (156.3, "shimmer", -10), (156.4, "chime", -12), (160.6, "whoosh", -10), (162.3, "clack", -6), (162.6, "whoosh", -6),
]
LATE = [
    # v6：Altman 前的衔接、静默里的一句、星星之火（原时间）
    (152.0, "whoosh", -14), (162.6, "chime", -14), (163.2, "shimmer", -13), (164.4, "shimmer", -14),
    # S7 夜之城
    (136.0, "rain", -10), (140.0, "rain", -10), (144.0, "rain", -11), (136.0, "boom", -8), (140.16, "whoosh", -12),
    (146.0, "vtol", -11), (148.5, "rain", -12), (146.6, "scan", -6), (147.4, "deny", -3), (149.6, "scan", -10),
    (152.0, "rain", -14), (156.0, "rain", -16), (152.0, "page", -12),
    # S8 星际迷航
    (162.6, "shimmer", -12), (167.4, "shimmer", -11), (172.6, "page", -12),
    (181.8, "whoosh", -10), (183.4, "whoosh", -10), (185.0, "whoosh", -10), (186.6, "boom", -8),
    # S9 走向明天
    (191.4, "servo", -18), (195.0, "door", -6), (198.6, "shimmer", -12), (198.6, "boom", -12),
]
# v9：凯恩斯挪到锁后面（与 lib.js 的 D.reorder 对应，这里是旧时间 → 新时间）
def _reorder(t):
    if 104.3 <= t < 139.65: return round(t - 19.0, 3)
    if 85.0 <= t < 104.45: return round(max(120.65, t + 35.35), 3)
    return t
FRONT = [(_reorder(t), n, g) for (t, n, g) in FRONT]
# v10：片名前加 6 秒；15.3 之后全部后移，再补上新段落的音效
FRONT = [(t + 9.459 if t >= 20.14 else t + 6.0 if t >= 15.3 else t, n, g) for (t, n, g) in FRONT]
FRONT += [(25.7, "whoosh", -16), (26.2, "page", -12), (26.8, "chime", -18)]  # v15 过渡句
FRONT += [(12.6, "page", -14), (16.85, "whoosh", -12), (16.95, "shimmer", -8), (17.3, "boom", -14), (20.5, "whoosh", -8), (20.9, "shimmer", -10)]
CUES = FRONT + [(t + 37.115, n, g) for (t, n, g) in LATE]
# v14：用户觉得中间的重音像重锤敲在心上——沉的音效整体调轻
HEAVY = {"boom": -7, "slam": -7, "ram": -7, "thud": -4}
CUES = [(t, n, g + HEAVY.get(n, 0)) for (t, n, g) in CUES]
# v19：星星之火（火焰）：点火 → 噼啪 → 火势蔓延烧穿夜色
CUES += [(160.95 + 37.115, "ignite", -12), (161.5 + 37.115, "paperburn", -10), (163.4 + 37.115, "paperburn", -8), (164.6 + 37.115, "blaze", -11)]
# v18：最前面加 8.823 秒开场钩子，全片后移；开场的音效
CUES = [(t + 17.531, n, g) for (t, n, g) in CUES]
# v20 开场：逐字浮现、三个主义、一个人 / 所有人、共产主义、接工厂
CUES += [(0.1, "shimmer", -14), (1.881, "page", -14), (3.158, "whoosh", -16), (3.158, "tap", -12), (5.271, "whoosh", -16), (5.271, "tap", -12),
         (7.639, "whoosh", -16), (7.639, "tap", -12), (9.938, "page", -12), (11.656, "page", -12), (12.934, "shimmer", -9), (13.375, "stamp", -12),
         (15.093, "page", -14), (16.730999999999998, "whoosh", -14)]
