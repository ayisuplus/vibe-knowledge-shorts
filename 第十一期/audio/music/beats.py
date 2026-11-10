# 找 2104 的「落拍」（低频突然进来）和节拍网格，写 beat_data.json
import json, numpy as np, librosa
y, sr = librosa.load("raw/cyber_2104.flac", sr=22050, mono=True)
hop = 256
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=2048)
low = (S[f < 150] ** 2).sum(0); t = librosa.times_like(low, sr=sr, hop_length=hop)
ld = 10 * np.log10(low + 1e-9)
# 10–14 秒之间低频跳得最猛的地方
w = (t > 10) & (t < 14.5)
d = np.diff(np.convolve(ld, np.ones(8) / 8, mode="same"))
i = np.argmax(np.where(w[1:], d, -1e9)) + 1
drop = float(t[i])
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, start_bpm=80, tightness=300)
bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
ibi = float(np.median(np.diff(bt[bt > drop])))
# 把网格对齐到落拍：落拍之后最近的一拍
k = np.argmin(np.abs(bt - drop))
print("drop", round(drop, 3), "nearest beat", round(float(bt[k]), 3), "tempo", np.atleast_1d(tempo)[0], "ibi", round(ibi, 4))
rms = librosa.feature.rms(y=y, hop_length=hop)[0]; db = 20 * np.log10(rms + 1e-9)
for a in range(0, 86, 4):
    m = (t >= a) & (t < a + 4); print(f"{a:3d}-{a+4:3d}s  {db[m].mean():6.1f} dB")
json.dump({"drop": drop, "beat0": float(bt[k]), "ibi": ibi, "beats": [round(float(x), 3) for x in bt]}, open("beat_2104.json", "w"))
