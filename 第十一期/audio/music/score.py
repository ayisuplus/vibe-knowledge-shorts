# 给 v14 配乐候选打客观分（我听不了音乐，只能量化用户在意的几点）：
#   hook   开头 1 秒的响度相对全曲中位数（dB，越接近 0 越好：一开始就有东西）
#   onset4 前 4 秒的起音数（越多越"有节奏、抓耳"）
#   heavy  响的时候 90Hz 以下能量占比的 95 分位（越低越轻）；crest 短时响度峰值比中位数高多少 dB（重击会拉高）
#   bpm    速度估计（目标 104）
# 用法：python -I 第六期/audio/music/score.py raw/M1_hook_*.flac
import sys, glob
import numpy as np, librosa

def score(path):
    y, sr = librosa.load(path, sr=22050, mono=True)
    dur = len(y) / sr
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    db = 20 * np.log10(rms + 1e-9)
    med = np.median(db)
    first = db[: int(1.0 * sr / hop)].mean()
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop, units="time")
    onset4 = int((onsets < 4.0).sum())
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    sub = (S[freqs < 90] ** 2).sum(axis=0)
    tot = (S ** 2).sum(axis=0) + 1e-12
    share = sub / tot
    # 400ms 短时响度
    win = int(0.4 * sr / hop)
    st = 10 * np.log10(np.convolve(rms ** 2, np.ones(win) / win, mode="same") + 1e-12)
    loud = st > np.percentile(st, 60)
    heavy = round(float(np.percentile(share[loud], 95)), 2)  # 响的时候低频占比（越低越轻）
    crest = round(float(np.percentile(st, 99.5) - np.median(st)), 1)  # 峰值比平时高多少 dB（重击会拉高）
    tempo = float(np.atleast_1d(librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=hop)[0])[0])
    tail = db[-int(1.0 * sr / hop):].mean() - med
    return dict(dur=round(dur, 1), hook=round(first - med, 1), onset4=onset4, heavy=heavy, crest=crest, bpm=round(tempo, 1), tail=round(tail, 1))

files = []
for a in sys.argv[1:]:
    files += sorted(glob.glob(a))
for f in files:
    print(f.split("\\")[-1].split("/")[-1], score(f))
