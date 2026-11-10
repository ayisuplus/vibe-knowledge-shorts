# 用 numpy 直接合成干净的界面类音效（MMAudio 生成的这几类基本是底噪），写到 sfx/raw/ 覆盖同名素材。
# 用法：python -I sfx/synth.py   （之后再跑 mix.py）
import os, subprocess
import numpy as np
from scipy.signal import butter, lfilter

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(t, a=0.003, d=0.1):
    return np.minimum(1, t / a) * np.exp(-t / d)


def sweep(f0, f1, t, mode="exp"):
    k = t / t[-1]
    f = f0 * (f1 / f0) ** k if mode == "exp" else f0 + (f1 - f0) * k
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def bp(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band")
    return lfilter(b, a, x)


def lp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), btype="low")
    return lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = butter(order, f / (SR / 2), btype="high")
    return lfilter(b, a, x)


def save(name, x, stereo_width=0.0):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    l = x
    r = np.roll(x, int(stereo_width * SR)) if stereo_width else x
    data = np.stack([l, r], 1).astype(np.float32)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", os.path.join(RAW, f"{name}.flac")], input=data.tobytes(), check=True)
    print("synth", name, round(len(x) / SR, 2))


# 界面提示音
t = t_(0.2)
save("beep", (np.sin(2 * np.pi * 1320 * t) + 0.3 * np.sin(2 * np.pi * 2640 * t)) * env(t, 0.002, 0.05))

# 水晶叮
t = t_(1.3)
x = sum(a * np.sin(2 * np.pi * f * t + p) * np.exp(-t / dcy) for f, a, p, dcy in [(1568, 1, 0, 0.7), (2353, 0.55, 1, 0.5), (3140, 0.35, 2, 0.35), (4190, 0.22, 3, 0.25), (6280, 0.1, 4, 0.12)])
save("chime", x * np.minimum(1, t / 0.002), 0.004)

# 锁定确认：两声上行短音 + 一下咔哒
t = t_(0.32)
x = np.zeros_like(t)
for st, f in [(0.0, 880), (0.07, 1760)]:
    m = t >= st
    tt = t[m] - st
    x[m] += np.sin(2 * np.pi * f * tt) * env(tt, 0.002, 0.045)
x[: int(0.004 * SR)] += hp(rng.standard_normal(int(0.004 * SR)), 3000) * 0.6
save("lock", x)

# 水滴：音高快速上滑的"啵"，加一点细碎水花
t = t_(0.45)
x = sweep(500, 1700, t[: int(0.05 * SR)], "exp")
x = np.concatenate([x, np.zeros(len(t) - len(x))])
x = x * env(t, 0.001, 0.07)
splash = bp(rng.standard_normal(len(t)), 2500, 7000) * env(t, 0.002, 0.03) * 0.25
save("drip", x + np.roll(splash, int(0.01 * SR)))

# 故障：每 30 毫秒换一次频率的方波 + 量化噪声，忽有忽无
t = t_(0.45)
x = np.zeros_like(t)
seg = int(0.03 * SR)
for i in range(0, len(t), seg):
    f = rng.choice([180, 320, 640, 1280, 2400, 90])
    on = rng.random() > 0.2
    tt = t[i:i + seg]
    sq = np.sign(np.sin(2 * np.pi * f * tt)) * (0.5 if on else 0.0)
    nz = np.round(rng.standard_normal(len(tt)) * 3) / 3 * (0.6 if on else 0.05)
    x[i:i + seg] = sq + nz
x = lp(x, 9000) * np.minimum(1, t / 0.002) * np.clip((t[-1] - t) / 0.08, 0, 1)
save("glitch", x, 0.006)

# 上行嗖：正弦扫频 + 带通噪声扫频
t = t_(0.5)
x = sweep(280, 1600, t) * 0.6
nz = rng.standard_normal(len(t))
nz = np.concatenate([bp(nz[i:i + 2205], 400 + 3000 * i / len(t), 1200 + 6000 * i / len(t)) for i in range(0, len(t), 2205)])[: len(t)]
x = (x + nz * 0.5) * np.sin(np.pi * t / t[-1]) ** 1.5
save("rise", x, 0.003)

# 全息开机：失谐和弦缓慢上扬 + 高频闪烁
t = t_(1.3)
pitch = 1 + 0.06 * (t / t[-1])
x = sum(np.sin(2 * np.pi * np.cumsum(f * pitch) / SR) for f in [440, 443, 660, 664, 880, 1320]) / 6
spark = bp(rng.standard_normal(len(t)), 5000, 11000) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t)) * 0.25
e = np.minimum(1, t / 0.5) * np.clip((t[-1] - t) / 0.6, 0, 1)
save("holo", (x + spark) * e, 0.008)

# 旋钮棘轮：一串咔哒
t = t_(0.8)
x = np.zeros_like(t)
for k, st in enumerate(np.arange(0.0, 0.62, 0.032)):
    i = int(st * SR)
    n = int(0.006 * SR)
    click = bp(rng.standard_normal(n), 1800, 6000) * np.exp(-np.arange(n) / (0.0012 * SR))
    click += np.sin(2 * np.pi * 2900 * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.002 * SR)) * 0.5
    x[i:i + n] += click * (0.8 + 0.2 * np.sin(k))
save("knob", x)

# 扫描：调幅正弦 + 噪声扫过
t = t_(1.0)
x = np.sin(2 * np.pi * 2200 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 32 * t)) * 0.35
nz = rng.standard_normal(len(t))
nz = np.concatenate([bp(nz[i:i + 2205], 800 + 2500 * i / len(t), 1600 + 5000 * i / len(t)) for i in range(0, len(t), 2205)])[: len(t)]
save("scan", (x + nz * 0.6) * np.sin(np.pi * t / t[-1]), 0.004)

# 低频轰：下滑的低正弦 + 开头一下噪声
t = t_(1.8)
x = sweep(75, 32, t) * np.exp(-t / 0.55)
x += lp(rng.standard_normal(len(t)), 900) * env(t, 0.002, 0.05) * 0.7
x += np.sin(2 * np.pi * 150 * t) * env(t, 0.002, 0.08) * 0.4
save("boom", x * np.minimum(1, t / 0.002))

# 盖章：低频闷击 + 纸面噪声
t = t_(0.45)
x = sweep(140, 55, t) * env(t, 0.001, 0.08)
x += lp(rng.standard_normal(len(t)), 2500) * env(t, 0.001, 0.025) * 0.8
save("stamp", x)

# 闪光粒子：一串随机的高音小点
t = t_(1.4)
x = np.zeros_like(t)
for k in range(38):
    st = rng.random() * 1.1
    f = rng.uniform(2500, 6500)
    i = int(st * SR)
    n = int(0.08 * SR)
    tt = np.arange(n) / SR
    x[i:i + n] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.02) * rng.uniform(0.3, 1)
save("sparkle", x * np.clip(np.sin(np.pi * t / t[-1]), 0, None) ** 0.5, 0.006)
