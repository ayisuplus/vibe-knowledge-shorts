# 把 sfx/raw/ 里的素材修整包络、统一响度，按 cues.py 的时刻混成一条音效轨 assets/sfx.mp3。
# 用法：python -I sfx/mix.py
import os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cues import SOUNDS, CUES

SR = 44100
TOTAL = 180.0
RAW = os.path.join(HERE, "raw")
OUT = os.path.join(HERE, "..", "assets", "sfx.mp3")
TARGET_RMS_DB = -14.0  # 每段素材先统一到这个响度，再叠加各自的增益


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def trim_lead(x, thresh_db=-30):
    # 去掉开头接近无声的部分（以整段峰值为参照）
    mono = np.abs(x).max(axis=1)
    peak = mono.max() + 1e-9
    idx = np.argmax(mono > peak * 10 ** (thresh_db / 20))
    return x[max(0, idx - int(0.005 * SR)):]


def shape(x, kind, length):
    x = trim_lead(x)
    n = min(len(x), int(length * SR))
    x = x[:n]
    t = np.arange(n) / SR
    if kind == "impact":
        env = np.minimum(1, t / 0.005) * np.exp(-t / (length / 4.0))
    elif kind == "tick":
        env = np.minimum(1, t / 0.003) * np.exp(-t / (length / 3.0))
    elif kind == "whoosh":
        u = t / max(t[-1], 1e-6)
        env = np.where(u < 0.4, np.sin(np.pi / 2 * u / 0.4) ** 2, np.cos(np.pi / 2 * (u - 0.4) / 0.6) ** 2)
    else:  # raw
        fin = np.minimum(1, t / 0.03)
        fout = np.clip((t[-1] - t) / (0.3 * t[-1] + 1e-6), 0, 1)
        env = fin * fout
    # 结尾 30 毫秒强制归零，避免爆音
    env *= np.clip((t[-1] - t) / 0.03, 0, 1)
    y = x * env[:, None]
    rms = np.sqrt(np.mean(y[np.abs(y).max(axis=1) > 1e-4] ** 2)) + 1e-9
    return y * (10 ** (TARGET_RMS_DB / 20) / rms)


clips = {}
for name, s in SOUNDS.items():
    clips[name] = shape(load(os.path.join(RAW, f"{name}.flac")), s["shape"], s.get("length", s["dur"]))

bus = np.zeros((int(TOTAL * SR) + SR, 2), np.float32)
for at, name, gain in CUES:
    y = clips[name] * (10 ** (gain / 20))
    i = int(at * SR)
    bus[i:i + len(y)] += y[: len(bus) - i]
bus = bus[: int(TOTAL * SR)]

# 软限幅：峰值控制在 -3 dBFS 左右
ceiling = 10 ** (-3 / 20)
bus = np.tanh(bus / ceiling) * ceiling
print("bus peak dBFS", round(20 * np.log10(np.abs(bus).max() + 1e-9), 1), " rms dBFS", round(20 * np.log10(np.sqrt(np.mean(bus ** 2)) + 1e-9), 1))

subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "libmp3lame", "-b:a", "320k", OUT], input=bus.tobytes(), check=True)
print("wrote", os.path.normpath(OUT))
