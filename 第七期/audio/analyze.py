# -*- coding: utf-8 -*-
"""
卡点表全套产物生成：
1) 节拍/重拍/段落/重音分析
2) Excel 卡点表（使用说明 / 关键卡点 / 段落结构 / 逐拍明细）
3) 节拍可视化 PNG
4) 剪映可导入的卡点标记 SRT
5) 节拍参考音 click MP3（强拍高音/次强中音/弱拍低音/重音脆音）
"""
import json
import numpy as np
import librosa
from scipy.signal import butter, filtfilt
from scipy.ndimage import median_filter

# ============ 路径 ============
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
SRC_WAV = sys.argv[1]  # mono 44.1k wav decoded from bgm-we-never-remix-190s.m4a
OUT_JSON = os.path.join(HERE, "beat_data.json")
HOP, SR = 512, 44100

# ============ 1. 分析 ============
print(">> load + HPSS")
y, sr = librosa.load(SRC_WAV, sr=SR, mono=True)
dur = float(librosa.get_duration(y=y, sr=sr))
y_harm, y_perc = librosa.effects.hpss(y)
onset_env = librosa.onset.onset_strength(y=y_perc, sr=sr, hop_length=HOP)
b, a = butter(4, 150.0 / (sr / 2), btype="low")
y_low = filtfilt(b, a, y)
onset_low = librosa.onset.onset_strength(y=y_low, sr=sr, hop_length=HOP)
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP)[0]

tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=HOP, trim=False)
tempo = float(np.atleast_1d(tempo)[0])
beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=HOP)
n = len(beat_t)
bs = onset_env[beats].astype(float)
bl = onset_low[beats].astype(float)

def norm(x):
    x = np.asarray(x, float); r = x.max() - x.min()
    return (x - x.min()) / r if r > 1e-12 else np.zeros_like(x)

beat_score = 0.55 * norm(bs) + 0.45 * norm(bl)
METER = 4  # 诊断已确认 4/4
phase = int(np.argmax([beat_score[np.arange(n) % METER == p].mean() for p in range(METER)]))
beat_in_bar = np.array([(i - phase) % METER + 1 for i in range(n)])
bar_no = np.cumsum(beat_in_bar == 1)
# 首拍若不是第1拍，小节号从1开始
if beat_in_bar[0] != 1:
    bar_no = bar_no + 1

# ---- 小节级特征 ----
# 注意：本曲母带响度恒定（RMS 全程接近满格），段落差异只体现在打击活动度
# （onset 均值 = 鼓组疏密；低频 onset = 底鼓），因此能量口径不含 RMS。
db_idx = np.where(beat_in_bar == 1)[0]
db_t = beat_t[db_idx]
nbars = len(db_t)
bar_on, bar_low = [], []
for bi, t0 in enumerate(db_t):
    t1 = db_t[bi + 1] if bi + 1 < nbars else dur
    f0, f1 = int(t0 * sr / HOP), int(t1 * sr / HOP)
    bar_on.append(float(onset_env[f0:f1].mean()))
    bar_low.append(float(onset_low[f0:f1].mean()))
bar_on, bar_low = map(lambda z: norm(np.array(z)), (bar_on, bar_low))
bar_energy = 0.55 * bar_on + 0.45 * bar_low
# 3 小节三角平滑（保留短促 break 的边界）
_w = np.array([0.22, 0.56, 0.22])
bar_sm = np.convolve(np.pad(bar_energy, 1, mode="edge"), _w, mode="valid")

# ---- 段落切分：break 与主体在数据上完全分离（≤0.4 vs ≥0.6），阈值取 0.5 ----
BREAK_TH = 0.50
is_break = bar_sm < BREAK_TH
runs, s0 = [], 0
for i in range(1, nbars):
    if is_break[i] != is_break[s0]:
        runs.append((s0, i - 1, 0 if is_break[s0] else 1)); s0 = i
runs.append((s0, nbars - 1, 0 if is_break[s0] else 1))

# 主体段内按相对能量标小节级高/中（用于拍级能量列与数据条）
main_mask = ~is_break
q66_main = np.quantile(bar_sm[main_mask], 0.66)
bar_level = np.where(is_break, 0, np.where(bar_sm >= q66_main, 2, 1))

# ---- 乐句高潮点：8 小节滚动能量的局部峰（只在主体段内）----
from scipy.signal import find_peaks
roll8 = np.convolve(np.pad(bar_sm, (4, 3), mode="edge"), np.ones(8) / 8, mode="valid")
peaks, _ = find_peaks(roll8, distance=10, prominence=0.02)
peaks = [p for p in peaks if not is_break[p] and 2 <= p < nbars - 2]
peak_set = set()
for p in peaks:
    for q in range(p - 1, p + 2):
        peak_set.add(q)

# ---- 段落命名 ----
sections = []
for k, (rs0, rs1, lv_code) in enumerate(runs):
    isbr = (lv_code == 0)
    t0 = float(db_t[rs0]); t1 = float(db_t[rs1 + 1]) if rs1 + 1 < nbars else dur
    nb = rs1 - rs0 + 1
    mean_e = float(bar_sm[rs0:rs1 + 1].mean())
    if isbr:
        if k == len(runs) - 1:
            label, tip, lv = "尾奏 Outro", "全曲收束：淡出、定格、结尾字幕卡", 0
        elif k == 0:
            label, tip, lv = "前奏留白 Intro", "氛围建立：淡入、标题卡、慢镜头", 0
        else:
            label, tip, lv = "留白 Break（鼓组撤出）", "鼓点抽空=情绪段：慢镜头/特写/淡入淡出，段尾强拍准备重新进入", 0
    else:
        if k == 0:
            label, tip, lv = "开场段（高能进入）", "开场即高能：强拍硬切、动效拉满，先声夺人", 2
        else:
            label, tip, lv = "主体行进段", "保持稳定剪辑密度（强拍换镜）；乐句高潮点安排高光镜头/特效", 1
    sections.append(dict(k=k + 1, start=round(t0, 3), end=round(t1, 3),
                         bars=nb, level=lv, label=label, tip=tip,
                         energy=round(mean_e, 3)))

bar_to_sec = {}
for (rs0, rs1, _), sec in zip(runs, sections):
    for bb in range(rs0, rs1 + 1):
        bar_to_sec[bb + 1] = sec

# 乐句高潮事件（峰中心小节的强拍时间）
phrase_peaks = []
for p in peaks:
    phrase_peaks.append(dict(t=round(float(db_t[p]), 3),
                             bar=int(p + 1), energy=round(float(roll8[p]), 3)))


# ---- 非拍位重音：贪心取间隔≥0.6s 的最强点，最多24个 ----
on_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=HOP)
on_t = librosa.frames_to_time(on_frames, sr=sr, hop_length=HOP)
on_s = norm(onset_env[on_frames].astype(float))
cand = sorted([(float(tt), float(ss)) for tt, ss in zip(on_t, on_s)
               if ss > 0.55 and np.min(np.abs(beat_t - tt)) >= 0.11],
              key=lambda x: -x[1])
accents = []
for tt, ss in cand:
    if all(abs(tt - x[0]) >= 0.6 for x in accents):
        accents.append((tt, ss))
    if len(accents) >= 24:
        break
accents.sort()

# ---- 逐拍记录 ----
level_name = {0: "留白", 1: "行进", 2: "高能"}
beats_out = []
for i in range(n):
    bn = int(bar_no[i]); bib = int(beat_in_bar[i]); sc = float(beat_score[i])
    sec = bar_to_sec.get(bn, sections[-1])
    bar_lv = int(bar_level[min(bn - 1, nbars - 1)])
    if bib == 1:
        btype = "强拍"
    elif METER == 4 and bib == 3:
        btype = "次强拍"
    else:
        btype = "弱拍"
    if btype == "强拍":
        if sec["level"] == 0:
            tip = "主切镜点（留白段：建议淡入淡出/慢切）"
        else:
            tip = "主切镜点（场景/镜头切换）"
    elif btype == "次强拍":
        tip = "副切镜点（小转场/景别变化）"
    elif sc > 0.62:
        tip = "重音弱拍（卡缩放/特效，可不切镜）"
    else:
        tip = "弱拍（动作衔接，保持镜头）"
    beats_out.append(dict(idx=i + 1, t=round(float(beat_t[i]), 3), bar=bn, beat=bib,
                          type=btype, strength=round(sc, 3),
                          level=level_name[bar_lv], section=sec["label"], tip=tip))

data = dict(duration=round(dur, 3), tempo=round(tempo, 2), meter=METER,
            nbeats=n, nbars=nbars, sections=sections, beats=beats_out,
            phrase_peaks=phrase_peaks,
            accents=[dict(t=round(t, 3), strength=round(s, 3)) for t, s in accents])
json.dump(data, open(OUT_JSON, "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f">> analysis: {tempo:.2f} BPM, {n} beats, {nbars} bars, {len(sections)} sections, {len(accents)} accents")
for s in sections:
    print(f"   {s['start']:7.2f}-{s['end']:7.2f} L{s['level']} {s['label']} ({s['bars']} bars, e={s['energy']})")


print("peaks", [p["t"] for p in phrase_peaks])
print("accents", [round(t, 2) for t, _ in accents])
print("bar energy (smoothed):")
for i in range(0, nbars, 8):
    print(f"  bar {i+1:3d} t={db_t[i]:6.2f}  " + " ".join(f"{v:.2f}" for v in bar_sm[i:i+8]))
