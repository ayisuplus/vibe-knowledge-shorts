# 每个音效 cue 处：音效（×0.85）和音乐在 0.4 秒窗口里的响度差（dB）。正数 = 音效比音乐响。
import sys, subprocess, numpy as np
sys.path.insert(0, "sfx")
from cues import CUES
SR = 22050
def load(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)
m, s = load("assets/music.m4a"), load("assets/sfx.mp3") * 0.85
def db(x): return 10 * np.log10((x ** 2).mean() + 1e-12)
seen = set()
for t, name, g in sorted(CUES):
    a, b = int(t * SR), int((t + 0.4) * SR)
    d = db(s[a:b]) - db(m[a:b])
    print(f"{t:7.2f} {name:9s} sfx-music {d:+5.1f} dB   music {db(m[a:b]):6.1f}")
