# BGM 候选打分与拍网格拟合：精确测速（118–122.5 BPM，步长 0.01）＋相位（第一拍落在哪），
# 再给出「开头 4 秒的抓耳度」和「整拍清晰度」，方便挑选。我听不到声音，只能靠这些数。
# 用法：python -I fit.py raw/*.flac
# 输出每条：时长、BPM、第一拍时刻 phase、拍点清晰度 clarity（拍上 vs 拍间 onset 比）、开头能量 hook、每 10 秒响度。
import subprocess, sys
import numpy as np

SR, HOP = 22050, 22                       # onset 包络约 1000 帧/秒
def load(f):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(b, np.float32)

def onset_env(x):
    n = len(x) // HOP
    e = np.sqrt(np.mean(x[: n * HOP].reshape(n, HOP) ** 2, axis=1))
    le = np.log(e + 1e-4)
    k = np.ones(15) / 15; le = np.convolve(le, k, "same")
    return np.maximum(0, np.diff(le, prepend=le[0])), SR / HOP

def fit(on, fps, lo=118, hi=122.5):
    best = None
    t = np.arange(len(on)) / fps
    for bpm in np.arange(lo, hi, 0.01):
        p = 60 / bpm
        ph = (t % p) / p                    # 每帧在拍内的位置
        # 对每个相位取加权圆均值：onset 集中的位置就是拍点
        z = np.sum(on * np.exp(2j * np.pi * ph))
        s = abs(z) / (on.sum() + 1e-9)
        if best is None or s > best[0]: best = (s, bpm, (np.angle(z) / (2 * np.pi)) % 1 * p)
    return best

for f in sys.argv[1:]:
    x = load(f); secs = len(x) / SR
    on, fps = onset_env(x)
    s, bpm, phase = fit(on, fps)
    p = 60 / bpm
    # 拍上 vs 拍间：±40 ms 窗内的 onset 平均 / 其余位置平均
    t = np.arange(len(on)) / fps; d = np.abs(((t - phase + p / 2) % p) - p / 2)
    clarity = on[d < .04].mean() / (on[d >= .08].mean() + 1e-9)
    hook = 20 * np.log10(np.sqrt(np.mean(x[: 4 * SR] ** 2)) + 1e-9)
    rms = [20 * np.log10(np.sqrt(np.mean(x[int(a * SR):int((a + 10) * SR)] ** 2)) + 1e-9) for a in range(0, int(secs) - 9, 10)]
    print(f"{f}: {secs:.1f}s  bpm={bpm:.2f}  phase={phase:.3f}s  sync={s:.3f}  clarity={clarity:.2f}  hook={hook:.1f}dB  10s: " + " ".join(f"{v:.0f}" for v in rms), flush=True)
