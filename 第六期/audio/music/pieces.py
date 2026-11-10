# 第六期配乐的两段描述（MiniMax Music 3）。时间对应 03-分镜脚本/分镜脚本.md 的段落。
# C 段（162–200 秒）是《国际歌》副歌的管弦乐版，另用 internationale.py + ACE-Step 做，不在这里。

INSTRUMENTAL_TAGS_A = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 8 + ["[Instrumental]", "[Outro]"])
INSTRUMENTAL_TAGS_B = "[Intro]\n\n[Instrumental]\n\n[Outro]"

PIECES = {
    # S0–S6：0–136 秒。低沉 → 庄重 → 昂扬 → 推到顶后突然切断
    "A_rise": {
        "seconds": 150,
        "lyrics": INSTRUMENTAL_TAGS_A,
        "caption": """Global Metadata: Instrumental cinematic orchestral score, like the opening of a serious historical documentary that slowly becomes an epic, rising anthem. Steady 84 BPM in 4/4 the whole way through, B-flat minor. Emotional progression: dark, tense and industrial at first, then solemn and dignified, then thoughtful and warm, then heavy and stalled, then a powerful awakening that keeps climbing in grandeur, and finally it stops dead at its peak with a hard cut. Production: large concert-hall orchestra, wide stereo, deep low end, natural reverb, no electronic sounds at all, no synthesizers, no electronic drums.

Vocal Details: Instrumental, no vocals at all, no humming, no choir. The lead melody is a noble four-bar theme carried first by solo French horn, later by unison strings and finally by the full brass section.

Arrangement:
Intro (0-14s): a low sustained cello and double-bass note, sparse timpani strokes like a slow heartbeat, a few metallic percussion hits like distant machinery.
Section one (14-33s): one huge orchestral chord, then solemn low strings and slow timpani, an old industrial-age gravity.
Section two (33-62s): the solo French horn states the noble main theme over warm sustained strings and soft piano arpeggios; dignified and hopeful.
Section three (62-84s): the music sinks and stalls, low brass and heavy repeated string chords that go nowhere, a sense of waiting.
Section four (84-118s): a sudden bright orchestral entrance, snare drum march rhythm, the trumpets and trombones take the theme, strings play driving ostinatos; every phrase climbs higher and grows larger.
Section five (118-136s): the full orchestra builds an enormous suspended crescendo with timpani rolls, then every instrument cuts out at once with no fade, leaving silence.""",
    },
    # S7：136–160 秒。夜之城：冷、压抑，纯管弦，不用合成器
    "B_cold": {
        "seconds": 30,
        "lyrics": INSTRUMENTAL_TAGS_B,
        "caption": """Global Metadata: Instrumental dark orchestral underscore for a dystopian rainy night city. Slow and free, about 60 BPM, B-flat minor. Emotional progression: cold, oppressive and uneasy, a feeling of a huge indifferent power above, then slowly dissolving into near silence. Production: acoustic orchestra only, deep and wide, lots of reverb; no synthesizers, no electronic sounds, no beat.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-8s): low tuba and contrabassoon drone, a single deep tolling bell.
Main section (8-22s): dissonant sustained string clusters, slow ominous low brass chords, soft rain-like tremolo in the violins, a distant bell tolls again.
Outro (22-30s): the strings fade out one by one until only a faint low drone remains, then silence.""",
    },
}

# ---------- v14（2026-10-15）：用户反馈——开头没有钩子、中间重音太沉像重锤。重新写四段 ----------
# 共同点：同一个短动机、同一个调（D 小调 / F 大调）、同一个速度 104 BPM，全程有向前推的律动；
# 重音一律用轻的：拨弦、短促弦乐顿音、军鼓擦奏、镲片上扬；明确不要定音鼓重击、低频轰击、沉重和弦。
NO_HEAVY = "Absolutely no timpani hits, no booming low-end impacts, no heavy slow chords, no braams, no trailer hits, no deep bass drum; nothing that feels like a hammer on the chest. Accents are light and quick: pizzicato, short string stabs, snare brush, cymbal swells."
INSTR_LONG = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 6 + ["[Instrumental]", "[Outro]"])
PIECES.update({
    "M1_hook": {
        "seconds": 96,
        "lyrics": INSTR_LONG,
        "caption": f"""Global Metadata: Instrumental modern cinematic score for a smart, curious documentary explainer, the kind that grabs you in the first second. Steady 104 BPM in 4/4, D minor moving toward F major. Emotional progression: intriguing and catchy from the very first beat, then thoughtful and a little somber, then curious and gradually building with forward momentum. Production: chamber orchestra with felt piano, clean and airy, wide stereo, light and propulsive. {NO_HEAVY} No vocals, no synth leads.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-4s): starts immediately on beat one with a catchy, memorable four-note piano motif over a ticking pizzicato ostinato, no fade-in, no silence.
Section one (4-21s): the motif repeats and develops, light strings join, a clockwork-like pulse, curious and engaging.
Lift (21-26s): a bright cymbal swell and the full strings rise and open up, warm and expansive, not heavy.
Section two (26-51s): more restrained and reflective in D minor, a solo cello sings a melancholy line over the continuing pizzicato pulse.
Section three (51-80s): curious and hopeful, the piano motif returns in F major, light percussion (shaker, rim clicks, brushed snare) adds momentum, layers keep building.
Section four (80-92s): three short bright string stabs, then the music keeps rising and suddenly thins out to a single held high note.""",
    },
    "M2_ai": {
        "seconds": 40,
        "lyrics": "[Intro]\n\n[Instrumental]\n\n[Instrumental]\n\n[Outro]",
        "caption": f"""Global Metadata: Instrumental bright, playful and triumphant modern orchestral cue about a new technology arriving. 104 BPM in 4/4, F major. Emotional progression: a sparkling awakening, a bouncy, joyful march that bursts into a celebratory peak, then it gets stuck and turns puzzled. Production: strings, felt piano, glockenspiel, light percussion, airy and clean. {NO_HEAVY} No vocals.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-2s): a shimmering rising glockenspiel and string sweep, like lights switching on.
Section one (2-9s): a bouncy, playful pizzicato and piano march with the four-note motif, cheerful and curious.
Peak (9-16s): a joyful celebratory burst, bright strings and glockenspiel, light cymbal, a feeling of a door swinging open.
Section two (16-22s): calmer, walking forward, a light suspense.
Section three (22-36s): the music gets stuck, a repeating question-like phrase, three short, light, comic string stabs a few seconds apart, then a puzzled pause.
Outro (36-40s): fades to a single soft piano note.""",
    },
    "M3_tension": {
        "seconds": 46,
        "lyrics": "[Intro]\n\n[Instrumental]\n\n[Instrumental]\n\n[Outro]",
        "caption": f"""Global Metadata: Instrumental thoughtful, slowly tightening documentary underscore. 104 BPM in 4/4, D minor. Emotional progression: quiet and reflective, then a subtle growing unease, steadily building tension that pushes forward to an abrupt stop. Production: felt piano, pulsing low strings, ticking clock-like percussion, intimate and clean. {NO_HEAVY} No vocals.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-6s): a solo felt piano plays the four-note motif slowly, sparse and reflective.
Section one (6-20s): soft pulsing eighth-note strings enter, a ticking percussion like coins dropping, calm but uneasy.
Section two (20-36s): the strings rise in register, the piano motif repeats insistently, tension grows steadily.
Section three (36-43s): a tight rising string crescendo, faster and higher.
Ending (43-46s): an abrupt cut to silence at the top of the crescendo.""",
    },
    "M4_nightcity": {
        "seconds": 30,
        "lyrics": "[Intro]\n\n[Instrumental]\n\n[Outro]",
        "caption": """Global Metadata: Instrumental dark cyberpunk score for a rainy neon megacity ruled by one giant corporate tower, in the style of a gritty futuristic video game soundtrack. 96 BPM, D minor. Emotional progression: immediately ominous and cold, a heavy pulsing electronic groove, oppressive grandeur, then fading into rain. Production: analog synthesizers, distorted pulsing synth bass, industrial percussion, metallic textures, wide and dark.

Vocal Details: Instrumental, no vocals at all, no humming, no choir.

Arrangement:
Intro (0-3s): starts immediately with a distorted pulsing synth bass and a metallic hit.
Main section (3-22s): driving industrial beat, dark analog synth arpeggios, a cold menacing lead motif, neon and rain.
Outro (22-30s): the beat drops out, only a low synth drone and rain-like noise remain, fading to silence.""",
    },
})
