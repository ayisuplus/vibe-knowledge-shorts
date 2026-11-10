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
WHIPS = [K(28), K(98), K(122), K(146), K(190), K(241.5), K(249.5), K(257), K(273)]  # v11：结尾是穿越镜头，不甩
T_END = 218.8

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
    "snap":     dict(prompt="a single crisp loud finger snap, close up, clean and dry, sharp click", dur=0.8, shape="tick", length=0.5, seed=11020),
    "snap2":    dict(prompt="a single crisp loud finger snap, close up, clean and dry, sharp click", dur=0.8, shape="tick", length=0.5, seed=11021),
    "bootup":   dict(prompt="a futuristic hologram flickering on, digital glitch shimmer and soft electric hum rising", dur=2.0, shape="raw", length=1.8, seed=11022),
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
    (0.2, "breath", -14), (0.5, "bootup", -11), (K(0) - 0.03, "snap", 5), (K(0) - 0.03, "snap2", 1), (K(0) + 0.06, "burst", -11),  # 响指要压过落拍：两条响指叠在一起，光爆声往后让一点、压低 (K(0) + 0.05, "whoosh", -12), (K(1) - 0.05, "snapin", -6), (K(1), "clack", -11),
    (K(1.5), "glitch", -15), (K(4.1), "whoosh", -6), (K(5), "thud", -12),
    # S1 结构 · 蓝图
    (K(5.1), "whoosh", -11), (K(6.7), "clack", -12), (K(8), "whoosh", -9), (K(9.05), "separate", -4), (K(9.05), "burst", -9),
    *[(K(12) + i * 1.6, "tap", -13) for i in range(3)], (K(12) + 5.0, "tap", -13), (K(20.3), "shimmer", -11), (K(25), "snapin", -7),
    # S2 出身 · 1974
    (K(28.3), "projector", -16), (K(29.4), "holo", -9), (K(40.2), "ticker", -14), (K(41), "clack", -9), (K(41.55), "whoosh", -6), (K(42), "slap", -9),
    # S3 公式 · 深空（v9 放慢）
    (K(42.6), "separate", -6), (K(45), "shuffle", -10), (K(64), "shuffle", -10),
    *[(K(55) + i * 0.3, "tap", -14) for i in range(7)], (K(55) + 7 * 0.3, "spark", -10),
    *[(K(69) + i * 0.2, "tap", -15) for i in range(11)], (K(69) + 11 * 0.2, "spark", -10),
    (K(75), "stamp", -10), (K(81), "snapin", -8), (K(81), "shimmer", -12), *[(K(81.5) + i * 0.2, "tap", -14) for i in range(7)],
    (K(88), "spark", -11), (K(89), "swell", -8), (K(92.5), "shimmer", -7),
    # v13 MG：排座数字一个个弹出、收进算式；÷2 光刀；里程表滚动；面积图切三刀；符号相撞；规则飞进「群」
    *[(K(45) + 0.5 + i * 0.4, "tap", -15) for i in range(8)], (K(55) - 1.1, "whoosh", -11),
    *[(K(64) + 0.3 + i * 0.16, "tap", -17) for i in range(12)], (K(69) - 0.6, "whoosh", -11),
    (K(75), "whoosh", -7), (K(81.5), "ticker", -10),
    *[(K(k) + 1.55, "rip", -12) for k in (101, 106.5, 112)], (K(117.5), "chime", -9),
    (K(159.4) + 0.75, "burst", -10), (K(159.4) + 0.75, "clack", -9), (K(169) + 0.75, "burst", -9), (K(169) + 1.3, "spark", -10),
    (K(172.5) + 3.85, "stamp", -9),
    (K(139) + 0.6, "slap", -8),
    # S4 守恒量 · 金库：每次演示 拔出 → 塞回 → 变红 → 撤回
    (K(99), "separate", -8), (K(99) + 1.3, "snapin", -8),
    *[x for d in (K(101), K(106.5), K(112)) for x in ((d + 0.15, "popout", -6), (d + 1.3, "clack", -10), (d + 1.7, "buzz", -9), (d + 1.75, "clunk", -11), (d + 3.15, "popout", -12), (d + 3.65, "clack", -13))],
    (K(117.5), "stamp", -9), (K(117.5) + 0.5, "thud", -9), (K(117.5) + 0.5, "shimmer", -11),
    # S5 重复 · 隧道
    (K(127.6), "swell", -9), (K(127.6) + 1.2, "ticker", -9), (K(139), "chime", -7), (K(139), "shimmer", -10),
    # S6 群论（v9 从零讲）：每一屏换的时候轻轻一声，等式成立时一声 spark，「群」砸下来，光点绕回起点
    *[(K(k) + 0.15, "tap", -13) for k in (146.6, 151.5, 157.5, 163.5, 166.5)],
    (K(159.4) + 1.0, "spark", -10), (K(163.5) + 0.6, "glassjar", -12), (K(169) + 1.0, "spark", -10),
    (K(172.5), "stamp", -8), (K(172.5), "shimmer", -11), (K(178.5) + 0.6, "swell", -12), (K(178.5) + 2.6, "chime", -8),
    (K(184.5), "separate", -8), (K(184.9), "shimmer", -10), (K(185.1), "holo", -10), (K(186.3), "spark", -11),
    # S7 上帝之数 · 天光
    (K(194), "ticker", -12), (K(198.4), "glitch", -12), (K(213.8), "swell", -9), (K(216.6), "burst", -3), (K(216.6), "thud", -8), (K(216.6) + 0.13, "blocks", -10),
    (K(216.8), "spark", -10), (K(224), "stamp", -8), (K(224), "shimmer", -11), (K(233.5), "spark", -12),
    # S8 哲理：A1 狂转 105 次 / A2 拔角块、红、拆开重组 / B 打乱 → 20 步拼回去 / C 炸散 → 别怕 → 金色的路、小块飞回来
    *[(K(k) + 0.1, "slap", -6) for k in (241.5, 249.5, 257, 273)],
    (K(241.5) + 0.45, "ticker", -8), (K(241.5) + 4.4, "chime", -9),
    (K(249.5) + 0.2, "popout", -6), (K(249.5) + 1.4, "buzz", -10), (K(249.5) + 2.2, "separate", -7), (K(249.5) + 4.4, "snapin", -6),
    (K(257) + 0.5, "ticker", -9), (K(260.5), "swell", -11), (K(269), "burst", -6), (K(269), "chime", -8),
    (K(273.2), "separate", -6), (K(273.2), "fallwind", -14), (K(279), "thud", -10), (K(279), "shimmer", -12),
    # v10：小块一块接一块落地铺成路（第 s 块在 C3 + 0.2 + 0.11s + 0.85 落地），近处先落；铺完一声 chime
    (K(283.1), "swell", -8), (K(283.3), "shimmer", -9), *[(K(283) + 1.05 + s * 0.11, "clack" if s % 3 == 0 else "tap", -13 - 0.25 * s) for s in range(0, 26, 2)],
    (K(283) + 0.3, "blocks", -11), (K(283) + 3.9, "chime", -8),
    # S9（v11）穿越镜头：沿着路越飞越快，升华句砸下来，冲进尽头的光
    (K(290), "swell", -8), (K(290) + 0.4, "fallwind", -9), (K(292.5), "fallwind", -7), *[(K(290) + x, "whoosh", -10 + 1.2 * i) for i, x in enumerate((2.2, 3.6, 4.7, 5.6, 6.3, 6.9))],
    (K(291.6) + 0.05, "slap", -6), (K(293.4), "spark", -9), (T_END - 0.75, "swell", -7), (T_END - 0.42, "burst", -3),
]
