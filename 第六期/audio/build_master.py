# -*- coding: utf-8 -*-
"""
第六期配乐：终版 + 卡点数据。
1) 终版 = music/preview.wav（A_rise_601 0–136 硬切 + B_cold_611 24 秒 + 静默 2 秒 + 《国际歌》C_intl_d0.40_x2_7）
2) 节拍：A 段用 librosa 跟拍；B 段是自由节奏，只取起音（钟声等）；C 段的小节线直接来自草稿（ACE 重绘不改时间）
3) 输出：配乐-终版.wav / .m4a、beat_data.json、节拍可视化.png
用法：python -I 第六期/audio/build_master.py
"""
import json, os, shutil, subprocess
import numpy as np, soundfile as sf, librosa

HERE = os.path.dirname(os.path.abspath(__file__))
MUS = os.path.join(HERE, "music")
SR, HOP = 44100, 512
A_END, B_END, C_START = 136.0, 160.0, 162.0

wav = os.path.join(HERE, "配乐-终版.wav")
shutil.copy(os.path.join(MUS, "preview.wav"), wav)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k",
                os.path.join(HERE, "配乐-终版.m4a")], check=True)
y, sr = sf.read(wav)
assert sr == SR
y = y.mean(axis=1)
TOTAL = len(y) / SR


def norm(x):
    x = np.asarray(x, float); r = x.max() - x.min()
    return (x - x.min()) / r if r > 1e-12 else np.zeros_like(x)


onset = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP)
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]


def fr(t):
    return min(int(round(t * SR / HOP)), len(onset) - 1)


# ---- A 段 ----
yA = y[: int(A_END * SR)]
envA = librosa.onset.onset_strength(y=yA, sr=SR, hop_length=HOP)
tempoA, bA = librosa.beat.beat_track(onset_envelope=envA, sr=SR, hop_length=HOP, start_bpm=84, trim=False)
tA = librosa.frames_to_time(bA, sr=SR, hop_length=HOP)
lowA = librosa.onset.onset_strength(y=librosa.effects.hpss(yA)[1], sr=SR, hop_length=HOP)
ph = int(np.argmax([np.mean([lowA[min(f, len(lowA) - 1)] for f in bA[p::4]]) for p in range(4)]))
beatsA = [(float(t), (i - ph) % 4 + 1) for i, t in enumerate(tA)]

# ---- B 段：起音 ----
yB = y[int(A_END * SR): int(B_END * SR)]
onB = librosa.onset.onset_detect(y=yB, sr=SR, hop_length=HOP, units="time", backtrack=False)
envB = librosa.onset.onset_strength(y=yB, sr=SR, hop_length=HOP)
onB_s = sorted(onB, key=lambda t: -envB[min(int(t * SR / HOP), len(envB) - 1)])[:8]
hitsB = sorted(round(A_END + float(t), 3) for t in onB_s)

# ---- C 段：草稿的小节线和旋律音 ----
meta = json.load(open(os.path.join(MUS, "mockup_notes.json")))
barsC = [round(C_START + t, 3) for t in meta["bar_starts"]]
notesC = [dict(t=round(C_START + n["t"], 3), dur=n["dur"], midi=n["midi"]) for n in meta["notes"]]
# 副歌各句的起点（弱起 e d 之后的强拍）：第 1、9、17、25 小节；最后长和弦 = 第 31 小节
phrasesC = dict(line1=barsC[0], line2=barsC[8], line3=barsC[16], line4=barsC[24], final_chord=barsC[30], end=round(TOTAL, 3))

# ---- 重音：A 段拍点里最强的一批，彼此至少隔 1.5 秒 ----
score = 0.6 * norm(onset) + 0.4 * norm(rms)
cand = sorted(((float(score[fr(t)]), t) for t, _ in beatsA), reverse=True)
accents = []
for s, t in cand:
    if s > 0.45 and all(abs(t - a) >= 1.5 for a in accents):
        accents.append(round(t, 3))
accents.sort()

# ---- 能量曲线（每 2 秒，dB），方便对段落 ----
energy = [round(float(20 * np.log10(rms[fr(t):fr(t + 2)].mean() + 1e-9)), 1) for t in np.arange(0, TOTAL - 2, 2)]

data = dict(
    duration=round(TOTAL, 3),
    files=dict(master="配乐-终版.m4a", A="music/raw/A_rise_601.flac", B="music/raw/B_cold_611.flac", C="music/raw/C_intl_d0.40_x2_7.flac"),
    edits=dict(A_end=A_END, B=[A_END, B_END], silence=[B_END, C_START], C_start=C_START),
    tempo=dict(A=round(float(np.atleast_1d(tempoA)[0]), 2), C=meta["bpm"]),
    beatsA=[dict(t=round(t, 3), beat=b) for t, b in beatsA],
    downbeatsA=[round(t, 3) for t, b in beatsA if b == 1],
    accentsA=accents, hitsB=hitsB, barsC=barsC, phrasesC=phrasesC, notesC=notesC, energy2s=energy,
)
json.dump(data, open(os.path.join(HERE, "beat_data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
t = np.arange(len(rms)) * HOP / SR
fig, ax = plt.subplots(figsize=(22, 4))
ax.plot(t, 20 * np.log10(rms + 1e-9), lw=.6, color="#444")
for b in data["downbeatsA"]:
    ax.axvline(b, color="#c8281e", lw=.4, alpha=.5)
for a in accents:
    ax.axvline(a, color="#d9a441", lw=1.2)
for b in barsC:
    ax.axvline(b, color="#2a7fbf", lw=.5)
ax.set_xlim(0, TOTAL); ax.set_xticks(np.arange(0, TOTAL, 5)); ax.grid(axis="x", alpha=.2)
fig.tight_layout(); fig.savefig(os.path.join(HERE, "节拍可视化.png"), dpi=90)
print(f"total {TOTAL:.2f}s  tempoA {data['tempo']['A']}  beatsA {len(beatsA)}  accents {accents}")
print("hitsB", hitsB)
print("C phrases", phrasesC)
print("energy2s", energy)
