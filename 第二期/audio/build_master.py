# -*- coding: utf-8 -*-
"""
第二期配乐：拼接终版 + 卡点数据。
1) 拼接：A_pink_143 在最后一个响亮小节后硬切 → 静音 → B_awake_201 → 结尾补一个八音盒单音，共 180 秒
2) 节拍分析：A 段是 3/4 拍华尔兹，90 BPM，一小节 2.0 秒；B 段前 12 秒按钢琴单音，之后 77 BPM、4/4
3) 输出：配乐-终版.wav / .m4a、beat_data.json、节拍可视化.png、节拍参考音.mp3
用法：python -I 第二期/audio/build_master.py
"""
import json, os, subprocess
import numpy as np, soundfile as sf, librosa
from scipy.signal import butter, filtfilt

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "music", "raw")
SR, HOP = 44100, 512

A_CUT = 138.95      # A 段硬切点（最后一个响亮小节结束，之后是模型自带的淡出）
B_START = 141.6     # B 段起点（S7 觉醒）
NOTE_AT = 176.9     # 结尾八音盒单音
TOTAL = 180.0


def load(name):
    y, sr = sf.read(os.path.join(RAW, name), always_2d=True)
    assert sr == SR, sr
    return y


def norm(x):
    x = np.asarray(x, float); r = x.max() - x.min()
    return (x - x.min()) / r if r > 1e-12 else np.zeros_like(x)


# ============ 1. 拼接 ============
A, B = load("A_pink_143.flac"), load("B_awake_201.flac")
out = np.zeros((int(TOTAL * SR), 2))
a = A[: int(A_CUT * SR)].copy()
fade = int(0.012 * SR)
a[-fade:] *= np.linspace(1, 0, fade)[:, None]          # 12ms 防爆音，听感上是硬切
out[: len(a)] = a
b0 = int(B_START * SR)
out[b0: b0 + len(B)] = B
# 八音盒单音：取 A 段开头第一个音（0.30s 起约 1.3s），尾部淡出
note = A[int(0.28 * SR): int(1.6 * SR)].copy()
note *= np.linspace(1, 0, len(note))[:, None] ** 1.5
n0 = int(NOTE_AT * SR)
out[n0: n0 + len(note)] += note
wav = os.path.join(HERE, "配乐-终版.wav")
sf.write(wav, out, SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k",
                os.path.join(HERE, "配乐-终版.m4a")], check=True)
print(f">> master {TOTAL}s written")

# ============ 2. 节拍分析 ============
y = out.mean(axis=1)
b_, a_ = butter(4, 150.0 / (SR / 2), btype="low")
y_low = filtfilt(b_, a_, y)
oenv = librosa.onset.onset_strength(y=librosa.effects.hpss(y)[1], sr=SR, hop_length=HOP)
olow = librosa.onset.onset_strength(y=y_low, sr=SR, hop_length=HOP)
score_frame = 0.55 * norm(oenv) + 0.45 * norm(olow)


def frame(t):
    return min(int(round(t * SR / HOP)), len(oenv) - 1)


# --- A 段：0.333s 脉冲 → 每两个脉冲一拍（90 BPM），四拍一小节 ---
yA = y[: int(A_CUT * SR)]
envA = librosa.onset.onset_strength(y=librosa.effects.hpss(yA)[1], sr=SR, hop_length=HOP)
_, pulses = librosa.beat.beat_track(onset_envelope=envA, sr=SR, hop_length=HOP, trim=False)
pt = librosa.frames_to_time(pulses, sr=SR, hop_length=HOP)
pl = np.array([olow[frame(t)] for t in pt])
qphase = int(np.argmax([pl[p::2].mean() for p in range(2)]))
qt = pt[qphase::2]                                         # 四分音符拍
ql = np.array([olow[frame(t)] for t in qt])
METER_A = 3                                               # 底鼓只落在每 3 拍的第 1 拍（实测对比度 2.35 vs 4/4 的 1.36）
dphase = int(np.argmax([ql[p::METER_A].mean() for p in range(METER_A)]))
beatsA = []
for i, t in enumerate(qt):
    bib = (i - dphase) % METER_A + 1
    beatsA.append((float(t), bib))
tempoA = 60.0 / np.median(np.diff(qt))

# --- B 段：前 12.31s 是自由钢琴（取单音起点），之后 77 BPM ---
yB = y[b0: b0 + len(B)]
envB = librosa.onset.onset_strength(y=yB, sr=SR, hop_length=HOP)
pianoB = librosa.onset.onset_detect(onset_envelope=envB, sr=SR, hop_length=HOP, units="time")
piano_notes = [B_START + float(t) for t in pianoB if t < 12.0]
_, bb = librosa.beat.beat_track(onset_envelope=envB, sr=SR, hop_length=HOP, start_bpm=77, trim=False)
btB = librosa.frames_to_time(bb, sr=SR, hop_length=HOP)
btB = btB[(btB >= 12.2) & (btB <= 29.0)]
tempoB = 60.0 / np.median(np.diff(btB))
beatsB = [(B_START + float(t), i % 4 + 1) for i, t in enumerate(btB)]   # 律动进入的那一拍就是第 1 拍

# --- 故事段落（与 03-分镜脚本 v2 对应；边界都吸附到实际音乐段落） ---
# A 段边界放在 4 小节（8 秒）乐句的强拍上；S8 从 B 段律动的第 4 小节开始
_down = [t for t, b in beatsA + beatsB if b == 1]
def _db(t):
    return min(_down, key=lambda x: abs(x - t))
SECTIONS = [
    ("S0", "开场", 0.0, _db(16.61)),
    ("S1", "幼儿园", _db(16.61), _db(32.61)),
    ("S2", "读书", _db(32.61), _db(60.61)),
    ("S3", "恋爱", _db(60.61), _db(84.61)),
    ("S4", "结婚", _db(84.61), _db(100.61)),
    ("S5", "生孩子", _db(100.61), _db(122.61)),
    ("S6", "中年", _db(122.61), B_START),
    ("S7", "觉醒", B_START, _db(166.36)),
    ("S8", "结尾", _db(166.36), TOTAL),
]


def snap(t):
    """吸附到最近的拍点（A 段 / B 段律动区）。"""
    allb = [x for x, _ in beatsA + beatsB]
    return min(allb, key=lambda x: abs(x - t))


# --- 重音：拍点里强度最高的一批（底鼓 + 打击），用来卡"咔哒扣上"等动作 ---
beats_out = []
for t, bib in beatsA + beatsB:
    s = float(score_frame[frame(t)])
    sec = next(k for k, _, s0, s1 in SECTIONS if s0 <= t < s1)
    beats_out.append(dict(t=round(t, 3), beat=bib, type="强拍" if bib == 1 else ("次强拍" if bib == 3 else "弱拍"),
                          strength=round(s, 3), section=sec))
strong = sorted(beats_out, key=lambda d: -d["strength"])
accent_t = []
for d in strong:
    if d["strength"] > 0.5 and all(abs(d["t"] - x) >= 1.2 for x in accent_t):
        accent_t.append(d["t"])
accent_t.sort()

# --- 乐句呼吸点（A 段每 ~8 秒的能量凹陷，适合放"咔哒"单音或字幕切换） ---
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
dips = []
for t, bib in beatsA:
    if bib == 1 and t > 4:
        f0, f1 = frame(t), frame(t + 2.0)
        dips.append((t, 20 * np.log10(rms[f0:f1].mean() + 1e-9)))
med = np.median([d for _, d in dips])
breaths = [round(t, 3) for t, d in dips if d < med - 5]

data = dict(
    duration=TOTAL, files=dict(master="配乐-终版.m4a", A="music/raw/A_pink_143.flac", B="music/raw/B_awake_201.flac"),
    edits=dict(A_cut=A_CUT, silence=[A_CUT, B_START], B_start=B_START, music_box_note=NOTE_AT),
    tempo=dict(A=round(tempoA, 2), B=round(tempoB, 2)), meter=dict(A="3/4", B="4/4"),
    sections=[dict(id=k, name=n, start=round(s0, 3), end=round(s1, 3)) for k, n, s0, s1 in SECTIONS],
    beats=beats_out,
    downbeats=[d["t"] for d in beats_out if d["beat"] == 1],
    accents=accent_t,
    breaths=breaths,
    piano_notes=[round(t, 3) for t in piano_notes],
)
json.dump(data, open(os.path.join(HERE, "beat_data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f">> A {tempoA:.1f} BPM ({len(beatsA)} beats), B {tempoB:.1f} BPM ({len(beatsB)} beats), "
      f"{len(accent_t)} accents, {len(breaths)} breaths, {len(piano_notes)} piano notes")
for k, n, s0, s1 in SECTIONS:
    print(f"   {k} {n:4s} {s0:7.2f}-{s1:7.2f}  ({s1 - s0:5.2f}s)")

# ============ 3. 可视化 ============
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei"]
fig, ax = plt.subplots(figsize=(28, 6), dpi=110)
tt = np.arange(len(y))[::200] / SR
ax.plot(tt, y[::200], color="#c9a3a9", lw=0.4)
er = norm(librosa.feature.rms(y=y, hop_length=HOP)[0])
ax.plot(librosa.frames_to_time(np.arange(len(er)), sr=SR, hop_length=HOP), er * 0.9, color="#e0243f", lw=1)
cols = ["#fff1f3", "#ffe0e5", "#ffd3da", "#ffc9d2", "#ffaab8", "#ff7f95", "#ff5c76", "#e8dcc8", "#f2ebdf"]
for (k, n, s0, s1), c in zip(SECTIONS, cols):
    ax.axvspan(s0, s1, color=c, alpha=0.6, zorder=0)
    ax.text((s0 + s1) / 2, 1.05, f"{k} {n}", ha="center", fontsize=12)
for t in data["downbeats"]:
    ax.axvline(t, color="#5a1a24", lw=0.5, alpha=0.5)
for t in accent_t:
    ax.plot(t, -0.95, marker="^", color="#e0243f", ms=6)
for t in piano_notes:
    ax.plot(t, -0.95, marker="o", color="#3b3128", ms=5)
ax.set_xlim(0, TOTAL); ax.set_ylim(-1.05, 1.15); ax.set_xticks(np.arange(0, TOTAL + 1, 5))
ax.set_xlabel("秒（竖线 = 强拍，红三角 = 重音，黑点 = 觉醒段钢琴单音）")
plt.tight_layout(); plt.savefig(os.path.join(HERE, "节拍可视化.png")); plt.close()

# ============ 4. 节拍参考音（终版 + 节拍器） ============
click = np.zeros(len(y))
def tick(t, f, amp, dur=0.05):
    i = int(t * SR); n = int(dur * SR)
    if i + n < len(click):
        click[i:i + n] += amp * np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.012 * SR))
for d in beats_out:
    tick(d["t"], 1760 if d["beat"] == 1 else 880, 0.5 if d["beat"] == 1 else 0.25)
for t in piano_notes:
    tick(t, 2637, 0.4)
ref = np.clip(out + click[:, None], -1, 1)
tmp = os.path.join(HERE, "_click.wav")
sf.write(tmp, ref, SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-q:a", "2",
                os.path.join(HERE, "节拍参考音.mp3")], check=True)
os.remove(tmp)
print(">> png / click reference written")
