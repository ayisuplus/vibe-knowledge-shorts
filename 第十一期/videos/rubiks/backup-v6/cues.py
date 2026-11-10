# 第十一期 v2 音效清单（魔方——上帝的玩具，约 139 秒）。时刻用 K(拍)，和 assets/js/scenes 一致（beats.json）。
# 看得清的每一步转动配一下塑料「咔」（moves.json 里 d > 0.07 的步，来自 tools/dumpmoves.mjs）；快速连拧用 ticker。
# 段与段之间的甩镜各一声 whoosh。
import json, os
_H = os.path.dirname(os.path.abspath(__file__))
_B = json.load(open(os.path.join(_H, "..", "assets", "beats.json"), encoding="utf8"))
_BT, _K0 = _B["beats"], _B["k0"]
def K(k):
    i = int(k // 1) + _K0; f = k - (k // 1)
    if i + 1 >= len(_BT): return _BT[-1] + (i + f - len(_BT) + 1) * 0.712
    return _BT[i] + f * (_BT[i + 1] - _BT[i])
_M = json.load(open(os.path.join(_H, "moves.json"), encoding="utf8"))
_tw = [(t, f"twist{1 + i % 3}", -7) for i, (t, tok, d) in enumerate(m for m in _M if m[2] > 0.07)]
WHIPS = [K(20), K(58), K(82), K(106), K(118), K(161.5), K(165.6), K(169.7), K(178)]  # v3

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
    *_tw,
    *[(w - 0.32, "whoosh", -6) for w in WHIPS],
    # S0
    (0.2, "breath", -12), (K(0), "burst", -4), (K(0) + 0.05, "whoosh", -12), (K(1) - 0.05, "snapin", -6), (K(1), "clack", -11),
    (K(1.5), "glitch", -15), (K(4.1), "whoosh", -6), (K(5), "thud", -12),
    # S1 结构 · 蓝图
    (K(5.1), "whoosh", -11), (K(6.7), "clack", -12), (K(8.0), "whoosh", -9), (K(9.05), "separate", -4), (K(9.05), "burst", -9),
    *[(K(11) + i * 1.15, "tap", -13) for i in range(3)], (K(11) + 3.6, "tap", -13), (K(16.3), "shimmer", -11), (K(18.4), "snapin", -7),
    # S2 出身 · 1974
    (K(20.3), "projector", -16), (K(21), "holo", -9), (K(28.4), "ticker", -14), (K(29.2), "clack", -9), (K(29.55), "whoosh", -6), (K(30), "slap", -9),
    # S3 公式 · 深空
    (K(30.6), "separate", -6), (K(32.4), "shuffle", -10), (K(39.2), "shuffle", -10),
    *[(K(35.6) + i * 0.3, "tap", -14) for i in range(7)], (K(35.6) + 7 * 0.3, "spark", -10),
    *[(K(42.6) + i * 0.2, "tap", -15) for i in range(11)], (K(42.6) + 11 * 0.2, "spark", -10),
    (K(47), "stamp", -10), (K(48.4), "snapin", -8), (K(48.4), "shimmer", -12), *[(K(48.8) + i * 0.2, "tap", -14) for i in range(7)],
    (K(52.5), "spark", -11), (K(53.2), "swell", -8), (K(55.3), "shimmer", -7),
    # S4 守恒量 · 金库：每次演示 拔出 → 塞回 → 变红 → 撤回
    (K(59), "separate", -8), (K(59) + 1.3, "snapin", -8),
    *[x for d in (K(61), K(66.5), K(72)) for x in ((d + 0.15, "popout", -6), (d + 1.3, "clack", -10), (d + 1.7, "buzz", -9), (d + 1.75, "clunk", -11), (d + 3.15, "popout", -12), (d + 3.65, "clack", -13))],
    (K(77.5), "stamp", -9), (K(77.5) + 0.5, "thud", -9), (K(77.5) + 0.5, "shimmer", -11),
    # S5 重复 · 隧道
    (K(87.6), "swell", -9), (K(87.6) + 1.2, "ticker", -9), (K(99), "chime", -7), (K(99), "shimmer", -10),
    # S6 群论应用
    (K(107.2), "separate", -8), (K(107.6), "shimmer", -10), (K(108), "holo", -9), (K(111.6), "swell", -11), (K(112), "spark", -10), (K(114.2), "spark", -10),
    # S7 上帝之数 · 天光
    (K(119.4), "ticker", -12), (K(122.9), "glitch", -12), (K(133.8), "swell", -9), (101.62, "burst", -3), (101.62, "thud", -8), (101.75, "blocks", -10),
    (K(136.8), "spark", -10), (K(144), "stamp", -8), (K(144), "shimmer", -11), (K(150), "spark", -12),
    # S8 哲理：每句砸下来一声；① 狂转 ② 拔角块、红、拆开重组 ③ 打乱 → 20 步拼回去
    *[(k + 0.1, "slap", -6) for k in (K(161.5), K(165.6), K(169.7))],
    (K(161.5) + 0.3, "ticker", -8), (K(161.5) + 2.6, "chime", -9),
    (K(165.6) + 0.15, "popout", -6), (K(165.6) + 0.9, "buzz", -10), (K(165.6) + 1.55, "separate", -7), (K(165.6) + 2.9, "snapin", -6),
    (K(169.7) + 0.25, "ticker", -9), (K(169.7) + 1.5, "swell", -10), (K(169.7) + 4.5, "burst", -6), (K(169.7) + 4.5, "chime", -8),
    # S9 高潮收尾
    (K(178), "swell", -9), (K(179), "burst", -5), (K(179), "separate", -6), (K(180), "whoosh", -10), (K(181), "whoosh", -9),
    (K(182), "snapin", -4), (K(182), "burst", -7), (K(183), "thud", -9), (K(183), "glitch", -10), (K(183), "shimmer", -12),
    (K(184.5), "spark", -10), (K(186), "spark", -9), (138.78, "burst", -4),
]
