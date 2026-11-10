# 把选定的旁白片段按时刻拼成 assets/vo.wav，并生成旁白期间压低的配乐 assets/music-vo.m4a。
# 用法：python -I voice/mix_vo.py
import os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
SR = 48000
TOTAL = 160.17
# (开口时刻, 片段)：时刻对齐字幕（L4 提前 0.4 秒，好在片名出现时说完）
# v2（用户：原声太甜糯）：沉稳风格重新生成（raw2），再整体降调、保留共振峰；L4 略加速，好在片名出现时说完
SRC = os.environ.get("VO_SRC", "raw2")
PICKS = [(0.0, "L1_22", 1.0), (3.2, "L2_22", 1.0), (6.4, "L3_11", 1.0), (8.0, "L4_22", 1.08)]
PITCH = float(os.environ.get("VO_PITCH", "-1.5"))  # 半音
OUT = os.environ.get("VO_OUT", "vo.wav")
DUCK = (0.0, 10.95, 0.32)  # 旁白段音乐压到 0.32（约 -10 dB），前后各 0.35 秒过渡
VO_PEAK_RMS_DB = -8.0


def load(path, ch=1, af=None):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, *(["-af", af] if af else []), "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()


def trim(x, db=-40):
    m = np.abs(x[:, 0]); thr = m.max() * 10 ** (db / 20)
    on = np.nonzero(m > thr)[0]
    return x[max(0, on[0] - int(.02 * SR)): on[-1] + int(.12 * SR)]


vo = np.zeros((int(TOTAL * SR), 1), np.float32)
for at, name, tempo in PICKS:
    af = f"rubberband=pitch={2 ** (PITCH / 12):.5f}:tempo={tempo}:formant=preserved:pitchq=quality"
    y = trim(load(os.path.join(HERE, SRC, f"{name}.flac"), af=af))
    win = int(.05 * SR)
    p = np.sqrt(np.convolve(y[:, 0] ** 2, np.ones(win) / win, "valid").max())
    y = y * (10 ** (VO_PEAK_RMS_DB / 20) / p)
    n = len(y); t = np.arange(n) / SR
    y[:, 0] *= np.minimum(1, t / .01) * np.clip((t[-1] - t) / .04, 0, 1)
    i = int(at * SR); vo[i:i + n] += y
    print(name, f"{at:.2f}-{at + n / SR:.2f}s")
vo = np.tanh(vo / .89) * .89  # 软限幅，避免削波
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(ROOT, "assets", OUT)], input=vo.tobytes(), check=True)

m = load(os.path.join(ROOT, "assets", "music.m4a"), 2)
t = np.arange(len(m)) / SR
t0, t1, g = DUCK
env = np.ones_like(t)
env = np.where(t < t1, g, env)
fade = np.clip((t - t1) / .35, 0, 1)
env = np.where(t >= t1, g + (1 - g) * fade, env)
m *= env[:, None].astype(np.float32)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "aac", "-b:a", "256k", os.path.join(ROOT, "assets", "music-vo.m4a")], input=m.tobytes(), check=True)
print(f"wrote assets/{OUT}, assets/music-vo.m4a  pitch {PITCH} st")
