# 第十一期音效清单（魔方——上帝的玩具）。开场静默只有气声；每一次转层都有一下塑料「咔」（时刻来自 moves.json）。
# 素材：前几期 sfx/raw 复用 + 本期 Woosh 新生成（twist1-3 / burst / snapin / popout / holo / breath / glitch / separate）。
import json, os
_M = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "moves.json"), encoding="utf8"))
_tw = lambda grp, g: [(t, f"twist{1 + i % 3}", g) for i, (t, tok) in enumerate(_M[grp])]

SOUNDS = {
    # 第十一期新增（Woosh）
    "twist1":   dict(prompt="a single fast twist of a speed cube layer, crisp smooth plastic click-clack", dur=0.6, shape="raw", length=0.35, seed=11001),
    "twist2":   dict(prompt="a single fast twist of a speed cube layer, crisp smooth plastic click-clack", dur=0.6, shape="raw", length=0.35, seed=11002),
    "twist3":   dict(prompt="a single fast twist of a speed cube layer, crisp smooth plastic click-clack", dur=0.6, shape="raw", length=0.35, seed=11003),
    "burst":    dict(prompt="a bright cinematic light burst, airy whoosh with glittering sparkle, magical reveal", dur=1.8, shape="raw", length=1.6, seed=11004),
    "snapin":   dict(prompt="many small plastic cube pieces flying in and snapping together into place, fast satisfying clicks", dur=1.2, shape="raw", length=1.0, seed=11005),
    "popout":   dict(prompt="a small plastic piece being pried out of a puzzle toy, quick crisp snap click", dur=0.8, shape="raw", length=0.6, seed=11016),
    "holo":     dict(prompt="futuristic hologram powering on, soft electronic shimmer hum", dur=2.0, shape="raw", length=1.8, seed=11007),
    "breath":   dict(prompt="a slow airy cinematic breath riser in a dark empty room, building tension", dur=4.0, shape="whoosh", length=4.0, seed=11008),
    "glitch":   dict(prompt="a short digital glitch stutter, futuristic interface", dur=0.6, shape="tick", length=0.4, seed=11009),
    "separate": dict(prompt="mechanical pieces separating outward with a soft airy whoosh and tiny clicks", dur=1.4, shape="raw", length=1.2, seed=11010),

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
    # S0 开场：暗场里的气声 → 光炸开 → 26 块飞进来合拢 → 标题 → 升起、白闪进展台
    (0.2, "breath", -12), (4.24, "burst", -4), (4.3, "whoosh", -12), (4.95, "snapin", -6), (4.99, "clack", -11),
    (5.73, "glitch", -15), (7.22, "whoosh", -8), (7.8, "shimmer", -12), (8.3, "thud", -16),
    # S1 结构：炸开 → 标签 → 只剩中心块转一圈 → 合拢 → 六面点 → 快速还原 → 拔角块、转、塞回 → 红闪
    (9.45, "separate", -6), (10.564, "tap", -14), (10.99, "tap", -14), (11.44, "tap", -14), (12.06, "tap", -14),
    (12.79, "whoosh", -14), (13.09, "shimmer", -16), (14.28, "snapin", -8),
    *_tw("spots", -6), *_tw("unspots", -13),
    (19.11, "popout", -6), (19.39, "clack", -12), (19.71, "clack", -9), (19.93, "buzz", -12),
    # S2 出身：魔中魔 15 步 → 全息 1974 → 「拨弄」一个多月
    *_tw("cic", -7), (20.97, "holo", -8), *_tw("fiddle", -12), (28.2, "ticker", -15),
    # S3 数量：倒带 → 3 步棋盘格 → 数字逐组跳出 → 宇宙年龄一小段 → 光一路拉长
    (32.11, "ticker", -11), (32.11, "whoosh", -12), *_tw("checker", -5), (36.1, "chime", -14),
    *[(36.94 + i * 0.25, "tap", -16) for i in range(7)], (39.17, "spark", -11), (39.91, "swell", -9), (42.88, "shimmer", -6),
    # S4 上帝之数：飞回中央、还原 → 20 步超级翻转（每步一下）→ 大「20」→ 棱块一圈弹出 → 2010
    (45.5, "whoosh", -13), *_tw("reset4", -12), *_tw("superflip", -7), (53.29, "burst", -7), (57.0, "blocks", -9), (59.6, "holo", -9),
    # S5 人和机器：还原 → 十字 → 打乱 → 2.51 秒复原 → 再打乱 → 0.305 秒 → 慢放
    (62.2, "ticker", -13), *_tw("cross", -7), (65.92, "ticker", -13), *_tw("hSolve", -7), (69.45, "chime", -10),
    (69.63, "ticker", -14), (70.19, "ticker", -7), (70.5, "chime", -10), (70.75, "whoosh", -11), *_tw("replay", -11),
    # S6 高潮收尾：越转越快 → 炸开（小块翻滚、镜头绕一圈多）→ 合拢 → 标题砸下来 → 两拍各亮一下 → 白闪切黑
    (72.233, "swell", -10), (72.604, "burst", -5), (72.604, "separate", -6), (73.347, "whoosh", -10), (74.09, "whoosh", -9),
    (74.833, "snapin", -4), (74.833, "burst", -7), (75.576, "thud", -9), (75.576, "glitch", -10), (75.576, "shimmer", -12),
    (76.319, "spark", -10), (77.062, "spark", -9), (77.70500000000001, "burst", -4),
]
