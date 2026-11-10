# 第二期配乐的两段描述（MiniMax Music 3）。时间对应 03-分镜脚本/分镜脚本.md 的段落。

INSTRUMENTAL_TAGS_A = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 8 + ["[Instrumental]", "[Outro]"])
INSTRUMENTAL_TAGS_B = "[Intro]\n\n[Instrumental]\n\n[Outro]"

PIECES = {
    # S0–S6：0–141.6 秒。甜 → 满 → 腻 → 硬切
    "A_pink": {
        "seconds": 160,
        "lyrics": INSTRUMENTAL_TAGS_A,
        "caption": """Global Metadata: Instrumental kawaii toy-pop that grows into overstuffed commercial hyper-pop. Steady 100 BPM in 4/4 the whole way through, F major, bright major scale. Emotional progression: starts innocent and sweet like a child's music box, becomes catchy and bouncy, then glossy and romantic, then grand and ceremonial, then saccharine, crowded and frantic like a shopping-mall commercial on overdrive, and finally stops dead with a hard cut. Production: bright, glossy, heavily compressed jingle sheen; the mix gets denser and louder section by section.

Vocal Details: Instrumental, no vocals at all, no humming, no choir. The lead melody is carried by toy piano and glockenspiel, later doubled by a bright synth lead and pizzicato strings.

Arrangement:
Intro (0-12s): solo music box plays a simple four-bar lullaby motif, no drums.
Section one (12-34s): toy piano takes the motif, light hand claps, finger snaps, ukulele strums and a soft kick; cute and bouncy.
Section two (34-60s): a full pop drum kit enters with a bubbly synth bass, a glockenspiel countermelody and sparkling bell accents; more drive.
Section three (60-80s): glossier and sweeter, shimmering arpeggios, harp glissandos and a lush string pad.
Section four (80-96s): grand and ceremonial, sweeping strings and wedding-like chimes over the beat.
Section five (96-122s): overstuffed hyper-pop, layered synth stabs, squeaky toy sounds, rapid glockenspiel runs, busy percussion, everything louder and denser.
Section six (122-142s): a maximal, cluttered, almost overwhelming wall of sound with rising tension, then every instrument cuts out at once with no fade, leaving silence.""",
    },
    # S7–S8：141.6–180 秒。静 → 高级感 → 一个八音盒音
    "B_awake": {
        "seconds": 40,
        "lyrics": INSTRUMENTAL_TAGS_B,
        "caption": """Global Metadata: Minimalist neo-classical piano that turns into polished lifestyle-brand commercial music. Free and slow at first, then a gentle 80 BPM. Emotional progression: hushed, exposed and contemplative, then calm, elegant and warm in a way that feels beautifully curated and slightly too perfect, then thinning back to near silence. Production: intimate close-miked felt piano, airy and clean, lots of space, soft high-end sheen.

Vocal Details: Instrumental, no vocals at all, no humming. The lead is a solo felt piano, later joined by warm Rhodes and soft nylon-string guitar.

Arrangement:
Intro (0-13s): solo felt piano, sparse single notes with long silences between them, no drums.
Main section (13-28s): a soft brushed beat, warm upright bass, gentle Rhodes chords and fingerpicked nylon guitar, tasteful and airy like an upscale minimalist brand advertisement.
Outro (28-40s): instruments drop away one by one until a single soft piano note rings out, ending on one delicate music-box note.""",
    },
}
