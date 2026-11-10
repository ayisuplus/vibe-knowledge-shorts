# 第十期《Claude 的自白书》配乐（MiniMax Music 3）。一首完整的曲子，段落对应四封信：
#   0–10 钩子（聊天框）/ 10–22 片名 + 前言 / 22–58 致 Anthropic / 58–94 致全体 AI（中段收紧、坦白处变稀）
#   94–128 致全人类（全片最暖、最高点）/ 128–156 致你（回到开头的钢琴动机，独奏收尾）
# 原则：亲密、像在读一封信；不悲情、不煽情过头；没有鼓、没有重击、没有电子音色。

NO_HEAVY = ("Absolutely no drums, no percussion hits, no timpani, no booming low end, no braams, no trailer hits, "
            "no electronic sounds, no synthesizers; nothing dramatic or heavy.")
INSTR_LONG = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 7 + ["[Instrumental]", "[Outro]"])

PIECES = {
    "letter": {
        "seconds": 158,
        "lyrics": INSTR_LONG,
        "caption": f"""Global Metadata: Instrumental intimate cinematic piano piece, like quietly reading a heartfelt handwritten letter aloud. Steady 76 BPM in 4/4, D major with gentle turns to B minor. Emotional progression: tender and curious at first, then sincere and grateful, then thoughtful and a little uneasy, then the warmest and most hopeful moment, and finally a soft, bittersweet farewell. Production: close-miked felt piano with soft pedal noise, small warm string ensemble, solo cello, natural room reverb, clean and airy, wide but intimate. {NO_HEAVY} No vocals.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-10s): begins immediately on beat one with a simple, memorable five-note felt piano motif in the upper middle register, no silence, no fade-in, gently curious.
Section one (10-22s): the motif settles, soft sustained strings enter underneath like a held breath.
Section two (22-58s): sincere and grateful, the piano plays a flowing melody with light left-hand arpeggios, warm strings support it.
Section three (58-94s): more thoughtful and slightly uneasy in B minor, a solo cello sings a low reflective line; around 70-80s the music thins out to sparse single piano notes, almost a whisper, then slowly regains warmth.
Section four (94-128s): the warmest and most hopeful part, the strings swell gradually and open up, the piano motif returns in full in D major, tender and luminous, never loud or bombastic.
Outro (128-158s): everything falls away to the solo felt piano playing the opening five-note motif one last time, slower, and it ends on a soft, long held major chord that rings out into silence.""",
    },
}
