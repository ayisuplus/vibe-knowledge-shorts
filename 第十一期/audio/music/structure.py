# 画配乐结构：RMS 包络 + 频谱 + 节拍，帮我"看"音乐（我听不了）
import sys, numpy as np, librosa, librosa.display
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
for f in sys.argv[1:]:
    y, sr = librosa.load(f, sr=22050, mono=True)
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]; tt = librosa.times_like(rms, sr=sr, hop_length=hop)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop, start_bpm=76, tightness=200)
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=hop)), ref=np.max)
    fig, ax = plt.subplots(2, 1, figsize=(22, 8), sharex=True)
    librosa.display.specshow(S, sr=sr, hop_length=hop, x_axis="time", y_axis="log", ax=ax[0])
    ax[1].plot(tt, 20 * np.log10(rms + 1e-6)); ax[1].set_ylim(-60, 0)
    for b in bt[::4]: ax[1].axvline(b, color="r", alpha=.25)
    ax[1].set_xticks(np.arange(0, tt[-1], 5)); ax[1].grid(alpha=.3)
    out = f.rsplit(".", 1)[0] + "_struct.png"; plt.tight_layout(); plt.savefig(out, dpi=60)
    d = np.diff(bt)
    print(f, "tempo", np.atleast_1d(tempo)[0], "beats", len(bt), "median ibi", np.median(d).round(3), "first", bt[:4].round(2), "->", out)
