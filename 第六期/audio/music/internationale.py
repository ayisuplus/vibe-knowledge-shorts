# 《国际歌》副歌（旋律：Pierre De Geyter，1888，公有领域）的管弦乐草稿。
# 旋律取自法语维基百科 L'Internationale 条目里的 LilyPond 谱（C 大调、2/4），移到降 B 大调。
# 只合成乐器草稿（铜管旋律 + 弦乐和声 + 低音 + 定音鼓），交给 ace_cover.py 用 ACE-Step 重绘成真实的管弦乐。
# 用法：python -I internationale.py [bpm]   -> mockup.wav, mockup_notes.json
import json, os, re, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
BPM = float(sys.argv[1]) if len(sys.argv) > 1 else 100.0
TRANSPOSE = -2  # C -> Bb

# 完整旋律（\relative c''），原样抄自维基百科；副歌从 "r8 e'8 d8 | c2" 开始
LY = r"""
r8 r4 g8 | c4. b8 | d8 c8 g8 e8| a2 | f4. a8 |
d4. c8 | b8 a8 g8 f8 | e2( | e4) r8 g8 |c4. b8 | d8 c8 g8 e8|
a2 | f4 d'8 c8 |  b4. d8| f4. b,8 | c2( | c8) r8  e8 d8 | b2 |
a8 b8  c8 a8 | b2 | g4 fis8 g8 | a4 a8 a8 | d4. c8 |
b2( | b4) r8 d8 | d4. b8 | g8 g8 fis8 g8 |e'2 | c8 a8 b8 c8 |
b4 d4 | c4 a4 | g2( | g8) r8 e'8 d8 | c2 | g4. e8 | a2 |
f4 d'8 c8 | b2 | a4. g8 | g2( | g8)  r8 g4 | e'2 | d4 g,4|
c2 | b4. b8 | a4. gis8 | a4 d4 | d2( | d8) r8 e8 d8 | c2 |
g4. e8 | a2 | f4 d'8 c8 | b2 | a4. g8 | e'2( | e8) r8 e4 | g2 |
f4 e4 | d8 cis8 d8 e8| f4. f8 | e4. e8 | d4. d8 | c2( | c4) r4
"""

STEP = {"c": 0, "d": 1, "e": 2, "f": 3, "g": 4, "a": 5, "b": 6}
SEMI = {"c": 0, "d": 2, "e": 4, "f": 5, "g": 7, "a": 9, "b": 11}


def parse(ly):
    """返回 [(midi 或 None, 以四分音符为单位的时值), ...]，连音线合并。"""
    toks = re.findall(r"([a-gr])(is|es)?([',]*)(\d+)?(\.)?(\(|\))?", ly)
    prev_step, prev_oct = STEP["c"], 5  # c''
    dur = 1.0
    out, tie_open = [], False
    for name, acc, octs, d, dot, slur in toks:
        if d:
            dur = 4.0 / int(d)
            if dot:
                dur *= 1.5
        if name == "r":
            out.append([None, dur])
            continue
        st = STEP[name]
        # 相对模式：取与上一个音最近（不超过四度）的八度
        best = None
        for o in (prev_oct - 1, prev_oct, prev_oct + 1):
            dist = (o * 7 + st) - (prev_oct * 7 + prev_step)
            if abs(dist) <= 3 and best is None:
                best = o
        o = best + octs.count("'") - octs.count(",")
        prev_step, prev_oct = st, o
        midi = 12 * (o + 1) + SEMI[name] + (1 if acc == "is" else -1 if acc == "es" else 0)
        if tie_open and out and out[-1][0] == midi:
            out[-1][1] += dur
        else:
            out.append([midi, dur])
        tie_open = slur == "("
    return out


notes = parse(LY)
# 副歌 = 最后 32 小节（2/4）+ 1 拍弱起 "e d"
total = sum(d for _, d in notes)
bars_total = total / 2.0
start_beat = total - 32 * 2 - 1.0
acc, refrain = 0.0, []
for m, d in notes:
    if acc >= start_beat - 1e-6:
        refrain.append([m, d])
    acc += d
assert refrain[0][0] == 76 and refrain[1][0] == 74 and refrain[2] == [72, 2.0], refrain[:3]
last_pitched = max(i for i, (m, _) in enumerate(refrain) if m is not None)

# 和声（以拍为单位，从第 1 小节 c2 开始），C 大调级数 -> 和弦根音与组成音
CH = {
    "C": [0, 4, 7], "C7": [0, 4, 7, 10], "F": [5, 9, 0], "Dm": [2, 5, 9], "G": [7, 11, 2], "G7": [7, 11, 2, 5],
    "D7": [2, 6, 9, 0], "E7": [4, 8, 11, 2], "Am": [9, 0, 4], "A7": [9, 1, 4, 7], "CG": [7, 0, 4],
}
BARS = ["C", "C", "F", "Dm", "G", "D7", "G", "G7",
        "C", "G7", "C", "E7", "Am", "D7", "G", "G7",
        "C", "C", "F", "Dm", "G", "G7", "C", "C7",
        "C7", ("F", "A7"), ("Dm", "A7"), "Dm", "CG", "G7", "C", "C"]
beats_chords = []
for b in BARS:
    if isinstance(b, tuple):
        beats_chords += list(b)
    else:
        beats_chords += [b, b]

# ---- 节拍 -> 秒，末尾两小节渐慢，最后一个和弦延长 ----
SPB = 60.0 / BPM
PICK = 1.0  # 弱起一拍（e、d 两个八分音符）


def beat_time(b):
    """b 为从第 1 小节强拍起的拍数（弱起为负）。最后 4 拍渐慢到 0.6 倍速。"""
    rit_start = 30 * 2
    if b <= rit_start:
        return (b + PICK) * SPB
    x = b - rit_start
    # 速度从 1 线性降到 0.6：时间 = 积分 1/v
    k = 0.4 / 4.0
    return (rit_start + PICK) * SPB + SPB * (np.log(1 + 0) - np.log(1 - k * x)) / k if x < 4 else (rit_start + PICK) * SPB + SPB * (-np.log(1 - k * 4)) / k + (x - 4) * SPB / 0.6


HOLD = 3.0  # 最后的和弦延长秒数
end_beat = 32 * 2
T = beat_time(end_beat) + HOLD + 2.0
N = int(T * SR)
mix = {k: np.zeros(N) for k in ("mel", "pad", "bass", "timp")}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a, r, sustain=1.0):
    e = np.ones(n) * sustain
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, sustain, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def tone(f, dur, harm, a, r, vib=0.0, detune=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * f * (1 + detune) * t + (vib * np.sin(2 * np.pi * 5.2 * t) * np.clip(t / 0.4, 0, 1))
    y = sum(amp * np.sin(k * ph) for k, amp in harm)
    return y * env(n, a, r)


def add(track, t0, y, gain):
    i = int(t0 * SR)
    j = min(N, i + len(y))
    mix[track][i:j] += gain * y[: j - i]


# 力度：1–8 小节独奏圆号，9–16 加弦乐低音，17–32 全奏
def dyn(bar):
    return 0.55 if bar < 8 else 0.75 if bar < 16 else 1.0


BRASS = [(1, 1.0), (2, 0.55), (3, 0.42), (4, 0.3), (5, 0.2), (6, 0.12), (7, 0.07), (8, 0.04)]
HORN = [(1, 1.0), (2, 0.35), (3, 0.15), (4, 0.06)]
STR = [(k, 0.6 / k) for k in range(1, 12)]

# 旋律
b = -PICK
notes_json = []
for idx, (m, d) in enumerate(refrain):
    t0, t1 = beat_time(b), beat_time(b + d)
    if idx == last_pitched:
        t1 = beat_time(end_beat) + HOLD
    if m is not None:
        mm = m + TRANSPOSE
        bar = int(max(b, 0) // 2)
        g = dyn(bar)
        dur = (t1 - t0) * 0.97
        add("mel", t0, tone(hz(mm), dur, HORN if bar < 8 else BRASS, 0.04, 0.12, vib=0.004), 0.22 * g)
        add("mel", t0, tone(hz(mm - 12), dur, HORN, 0.05, 0.15), 0.16 * g)  # 低八度圆号
        notes_json.append({"t": round(t0, 3), "dur": round(t1 - t0, 3), "midi": mm})
    b += d

# 和声与低音（每拍一个和弦；同和弦连拍合并）
i = 0
while i < len(beats_chords):
    j = i
    while j + 1 < len(beats_chords) and beats_chords[j + 1] == beats_chords[i] and (j + 1) % 2 != 0:
        j += 1
    name = beats_chords[i]
    t0, t1 = beat_time(i), beat_time(j + 1)
    if j + 1 >= len(beats_chords):
        t1 += HOLD
    bar = i // 2
    g = dyn(bar)
    pcs = CH[name]
    root = pcs[0] if name != "CG" else 7
    for k, pc in enumerate(pcs):
        m = 55 + ((pc + TRANSPOSE - 55) % 12)  # 放在 G3–F#4 之间
        for det in (-0.003, 0.003):
            add("pad", t0, tone(hz(m), t1 - t0 + 0.08, STR, 0.12, 0.2, detune=det), (0.05 if bar >= 8 else 0.03) * g)
    bm = 36 + ((root + TRANSPOSE - 36) % 12)
    if bar >= 8:
        add("bass", t0, tone(hz(bm), t1 - t0, [(1, 1.0), (2, 0.5), (3, 0.2)], 0.02, 0.1), 0.2 * g)
    i = j + 1

# 定音鼓：9 小节起每小节强拍，最后两小节滚奏 + 结尾一击
def timp(t0, m, gain):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * hz(m) * t) * np.exp(-t * 3.0) + 0.5 * np.sin(2 * np.pi * hz(m) * 1.5 * t) * np.exp(-t * 6)
    y[: int(0.01 * SR)] += np.random.default_rng(int(t0 * 100)).normal(0, 0.6, int(0.01 * SR))
    add("timp", t0, y, gain)


for bar in range(8, 32):
    name = BARS[bar] if not isinstance(BARS[bar], tuple) else BARS[bar][0]
    m = 38 if name in ("C", "C7", "F", "Am", "Dm", "CG") else 43  # Bb2 / F3（移调后）
    timp(beat_time(bar * 2), m + TRANSPOSE + 2 - 2, 0.35 * dyn(bar))
for k in range(int((beat_time(64) - beat_time(60)) / 0.07)):
    t0 = beat_time(60) + k * 0.07
    timp(t0, 36, 0.08 + 0.12 * k / 60)
timp(beat_time(64), 36, 0.6)

y = mix["mel"] + mix["pad"] + mix["bass"] + mix["timp"]
# 简单混响：几条衰减延迟
rev = np.zeros_like(y)
for dly, g in ((0.031, 0.35), (0.047, 0.3), (0.071, 0.25), (0.113, 0.2), (0.167, 0.15), (0.241, 0.1)):
    k = int(dly * SR)
    rev[k:] += g * y[:-k]
y = y + 0.6 * rev
y /= np.max(np.abs(y)) / 0.89
stereo = np.stack([y, np.roll(y, int(0.012 * SR))], axis=1)
sf.write(os.path.join(HERE, "mockup.wav"), stereo, SR)
json.dump({"bpm": BPM, "pickup_beats": PICK, "hold": HOLD, "duration": T,
           "bar_starts": [round(beat_time(2 * k), 3) for k in range(33)], "notes": notes_json},
          open(os.path.join(HERE, "mockup_notes.json"), "w"), indent=1)
print(f"mockup.wav {T:.1f}s, {len(notes_json)} notes, bars={bars_total:.1f}, refrain first notes:",
      [n["midi"] for n in notes_json[:8]])
