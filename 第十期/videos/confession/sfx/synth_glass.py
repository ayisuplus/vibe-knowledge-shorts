# 合成「轻敲玻璃罐」：玻璃的非谐波泛音（1 : 2.32 : 4.25 : 6.63），各自指数衰减，极短的敲击噪声。
# Woosh 生成的只有结尾一下咔哒，所以这里自己合成。用法：python -I sfx/synth_glass.py → sfx/raw/glassjar.flac
import os, subprocess
import numpy as np
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
t = np.arange(int(2.0 * SR)) / SR
f0 = 1046.5  # C6
y = np.zeros_like(t)
for ratio, amp, tau in [(1, 1.0, 0.9), (2.32, 0.45, 0.45), (4.25, 0.22, 0.22), (6.63, 0.1, 0.12)]:
    y += amp * np.sin(2 * np.pi * f0 * ratio * t + ratio) * np.exp(-t / tau)
# 轻微拍频，听起来像真的玻璃
y *= 1 + 0.06 * np.sin(2 * np.pi * 3.1 * t)
y += np.random.default_rng(3).normal(0, 1, len(t)) * 0.15 * np.exp(-t / 0.003)
y *= np.minimum(1, t / 0.001)
y = y / np.abs(y).max() * 0.7
st = np.stack([y, np.roll(y, 40)], axis=1).astype(np.float32)
dst = os.path.join(HERE, "raw", "glassjar.flac")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", dst], input=st.tobytes(), check=True)
print("wrote", dst)
