# 第十一期《魔方——上帝的玩具》配乐（MiniMax Music 3）。
# 曲子从「亮起」那一下开始：成片 0–4.2 秒是静默 + 手张开（只有音效），配乐的第 0 秒放在成片约 4.2 秒。
# 段落（配乐时间）：0–4 开场重拍 + 标题 / 4–16 结构 / 16–28 出身 / 28–42 数量 / 42–60 上帝之数（推到全曲最高）
#                   60–72 人和机器（最快、最紧）/ 72–82 结尾（抽空，只剩合成器长音，淡出）
# 赛博朋克电子，但不要沉重的「重锤」：重拍只用开场那一下。

INSTR = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 5 + ["[Instrumental]", "[Outro]"])

PIECES = {
    "cyber": {
        "seconds": 86,
        "lyrics": INSTR,
        "caption": """Global Metadata: Instrumental futuristic cyberpunk electronic track for a stylish tech documentary about the Rubik's Cube, like a sleek sci-fi product reveal. Steady 120 BPM in 4/4, A minor. Emotional progression: an instant dramatic reveal, then cool and precise, then curious and mysterious, then a steady build to an epic, awe-inspiring peak, then the fastest and most intense part, and finally it empties out into a calm, glowing fade. Production: analog synthesizers, punchy tight electronic drums, deep pulsing synth bass, glassy arpeggios, clicky mechanical percussion like a cube turning, wide stereo, clean modern mix. No vocals.

Vocal Details: Instrumental, no vocals at all, no humming, no choir, no vocal chops.

Arrangement:
Intro (0-4s): starts immediately on beat one with one huge bright cinematic synth hit and a deep sub drop, then a shimmering riser, no silence, no fade-in.
Section one (4-16s): a tight driving groove, pulsing bass, crisp hi-hats and clicky percussion, a cool glassy arpeggio.
Section two (16-28s): slightly retro and mysterious, a warm analog lead melody over the groove.
Section three (28-42s): spacious and vast, the drums thin out, wide pads and a slowly rising arpeggio, a feeling of enormous numbers and outer space.
Section four (42-60s): a steady build with snare rolls that climbs to the biggest, most euphoric and awe-inspiring moment of the track around 52s, full synths and drums.
Section five (60-72s): the fastest and most intense part, double-time hi-hats, rapid arpeggios, high energy like a speed race.
Outro (72-86s): everything drops away except a soft glowing synth pad and a gentle arpeggio, slowly fading to silence.""",
    },
}

# ---------- v2（2026-10-20）：用户要加数学原理和应用，片长约 2 分钟。还是先铺垫、再落拍（落拍对到成片 4.2 秒的「光炸开」）----------
INSTR2 = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 8 + ["[Instrumental]", "[Outro]"])
PIECES["cyber2"] = {
    "seconds": 158,
    "lyrics": INSTR2,
    "caption": """Global Metadata: Instrumental futuristic cyberpunk electronic track for a flashy, fast-cut math and science video about the Rubik's Cube, like a high-energy sci-fi trailer that never lets up. Steady 120 BPM in 4/4, A minor. Emotional progression: a short dark tense build, then a massive drop, then relentless forward drive with several escalating waves, and the biggest climax at the very end, ending on a final hit with no fade-out. Production: analog synthesizers, punchy tight electronic drums, deep pulsing synth bass, glassy arpeggios, clicky mechanical percussion like a cube turning, risers and impacts on section changes, wide stereo, clean modern mix. No vocals.

Vocal Details: Instrumental, no vocals at all, no humming, no choir, no vocal chops.

Arrangement:
Intro (0-12s): dark atmospheric pulse and a rising synth riser building tension.
Drop (12-30s): a huge bright drop with full drums and pulsing bass, energetic and cool.
Section two (30-55s): driving groove with a glassy arpeggio lead, precise and mathematical.
Section three (55-80s): a tense, mysterious breakdown with clicky percussion, then a riser.
Section four (80-110s): a second, bigger drop, faster arpeggios, epic and awe-inspiring.
Section five (110-140s): the most intense part, double-time hats, soaring synth lead, climbing higher.
Ending (140-158s): the biggest climax of the whole track, ending on one final massive hit, then silence, no fade-out.""",
}
