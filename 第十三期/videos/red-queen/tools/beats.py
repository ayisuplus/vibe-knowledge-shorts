"""BGM 节拍与段落分析。输出：BPM、拍点时刻、每 1 秒能量，供卡点用。"""
import wave, json
import numpy as np

WAV = "tmp_music.wav"
SR = 22050

with wave.open(WAV, "rb") as w:
    n = w.getnframes()
    raw = w.readframes(n)
    x = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

# ---- 谱通量（onset 强度）----
hop, win = 512, 2048
frames = 1 + (len(x) - win) // hop
win_fn = np.hanning(win).astype(np.float32)
S = np.empty((frames, win // 2 + 1), dtype=np.float32)
for i in range(frames):
    seg = x[i * hop: i * hop + win] * win_fn
    S[i] = np.abs(np.fft.rfft(seg))
S = np.log1p(S * 100.0)
flux = np.maximum(0.0, np.diff(S, axis=0)).sum(axis=1)
flux = np.concatenate([[0.0], flux])
flux -= np.convolve(flux, np.ones(32) / 32, mode="same")   # 去慢趋势
flux = np.maximum(flux, 0.0)
framerate = SR / hop

# ---- 自相关估 BPM ----
env = flux - flux.mean()
ac = np.correlate(env, env, mode="full")[len(env) - 1:]
lo, hi = int(framerate * 60 / 180), int(framerate * 60 / 60)   # 60–180 BPM
lag = lo + int(np.argmax(ac[lo:hi]))
bpm_raw = 60.0 * framerate / lag

# ---- 用候选 BPM 做梳状打分，选最稳的 ----
def comb_score(bpm, offset_frames):
    period = 60.0 / bpm * framerate
    idx = (offset_frames + period * np.arange(int((frames - offset_frames) / period))).astype(int)
    idx = idx[idx < frames]
    return flux[idx].sum() / len(idx) if len(idx) else 0

best = (0, 0, 0)
for bpm in np.arange(bpm_raw * 0.75, bpm_raw * 1.5, 0.1):
    if not (55 <= bpm <= 200):
        continue
    for off in range(0, int(60.0 / bpm * framerate)):
        s = comb_score(bpm, off)
        if s > best[0]:
            best = (s, bpm, off)
_, BPM, OFF = best
period = 60.0 / BPM * framerate

# ---- 拍点：在网格附近找最近的峰值 ----
beat_times = []
t = OFF
while t < frames:
    a, b = int(max(0, t - period * 0.18)), int(min(frames - 1, t + period * 0.18))
    peak = a + int(np.argmax(flux[a:b + 1]))
    beat_times.append(round(peak / framerate, 3))
    t += period

# ---- 每秒能量（分段结构）----
per_sec = int(round(framerate))
rms = np.array([float(np.sqrt(np.mean(x[i * SR:(i + 1) * SR] ** 2)) + 1e-9)
                for i in range(int(len(x) / SR))])

out = {
    "duration": round(len(x) / SR, 2),
    "bpm_raw": round(bpm_raw, 2),
    "bpm": round(float(BPM), 2),
    "beat_count": len(beat_times),
    "first_beats": beat_times[:40],
    "rms_per_sec": [round(v, 4) for v in rms],
}
with open("beat.json", "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("duration", out["duration"], "bpm", out["bpm"], "beats", out["beat_count"])
print("beats(前32):", beat_times[:32])
print("rms/秒:", [round(v, 3) for v in rms[:30]])
