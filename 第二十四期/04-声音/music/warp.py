# 把 AI 生成的 BGM 拉到画面的拍网格上：MiniMax 不守拍（实测同一条在 118.4–120.4 BPM 之间漂），
# 画面却按严格 120 BPM（一拍 0.5 秒）排。做法：librosa 找每一拍 → 每 4 拍一小节 → 每小节用 ffmpeg rubberband
# 拉到正好 2.0 秒（变速不变调，单小节的伸缩一般在 ±2% 以内）→ 拼起来，第一拍落在 0 秒。
# 用法：python -I warp.py raw/main_2401.flac out.wav [秒数=126] [起始拍=0]
import subprocess, sys
import numpy as np
import librosa

src, dst = sys.argv[1], sys.argv[2]
want = float(sys.argv[3]) if len(sys.argv) > 3 else 126.0
skip = int(sys.argv[4]) if len(sys.argv) > 4 else 0
BEAT, BAR = 0.5, 4

y, sr = librosa.load(src, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, start_bpm=120, tightness=400, units="time")
beats = np.asarray(beats)[skip:]
ibi = np.diff(beats)
print(f"librosa tempo {float(np.atleast_1d(tempo)[0]):.2f}, {len(beats)} beats, first {beats[0]:.3f}s, IBI {ibi.mean():.4f}±{ibi.std():.4f}s (min {ibi.min():.3f}, max {ibi.max():.3f})")
bars = int(min((len(beats) - 1) // BAR, np.ceil(want / (BEAT * BAR))))
parts, ratios = [], []
for i in range(bars):
    a, b = beats[i * BAR], beats[(i + 1) * BAR]
    r = (b - a) / (BEAT * BAR); ratios.append(r)
    parts.append(f"[0:a]atrim=start={a:.5f}:end={b:.5f},asetpts=PTS-STARTPTS,rubberband=tempo={r:.6f}:transients=crisp,atrim=end={BEAT * BAR:.5f},asetpts=PTS-STARTPTS[p{i}]")
graph = ";".join(parts) + ";" + "".join(f"[p{i}]" for i in range(bars)) + f"concat=n={bars}:v=0:a=1[o]"
open(dst + ".graph.txt", "w").write(graph)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex_script", dst + ".graph.txt", "-map", "[o]", "-ar", "48000", "-ac", "2", dst], check=True)
r = np.array(ratios)
print(f"{bars} 小节 → {bars * BAR * BEAT:.1f}s；每小节伸缩 {100 * (r.min() - 1):+.2f}% … {100 * (r.max() - 1):+.2f}%（中位 {100 * (np.median(r) - 1):+.2f}%）")
