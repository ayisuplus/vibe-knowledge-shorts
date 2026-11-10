# 合成 Woosh 做不好的 UI 音（短促、干净的「啵」）。用法：python -I sfx/synth.py   → 覆盖 sfx/raw/bubble.flac
import os, subprocess
import numpy as np
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))

def bubble():
    # 一个圆润的「啵」：频率从 950 Hz 快速滑到 260 Hz，指数衰减，加一点二次谐波和极短的起音噪声
    t = np.arange(int(0.22 * SR)) / SR
    f = 260 + 690 * np.exp(-t / 0.018)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = (np.sin(ph) + 0.25 * np.sin(2 * ph)) * np.exp(-t / 0.045)
    y += np.random.default_rng(9).normal(0, 1, len(t)) * 0.08 * np.exp(-t / 0.004)
    y *= np.minimum(1, t / 0.002)
    return y / np.abs(y).max() * 0.8

y = bubble()
st = np.stack([y, y], axis=1).astype(np.float32)
dst = os.path.join(HERE, "raw", "bubble.flac")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", dst], input=st.tobytes(), check=True)
print("wrote", dst)
