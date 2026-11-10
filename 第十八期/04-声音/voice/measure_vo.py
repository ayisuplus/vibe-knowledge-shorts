# ../vo/NN.flac → 裁首尾静音 → ../vo-trim/NN.wav，量时长写进 03-分镜脚本/_gen/durations.json
# 然后在 _gen 里重跑 lines.py / make_docs.py，再按新时间码拼 120 秒预览 ../旁白预览.mp3
import json, os, sys, subprocess
import numpy as np
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, '../../03-分镜脚本/_gen')
# SRC=vo-dir 可改量 Voice Direction 版
SRC, TRIM = os.path.join(HERE, '..', os.environ.get('SRC', 'vo')), os.path.join(HERE, '../vo-trim')
os.makedirs(TRIM, exist_ok=True)
SR = 24000
def load(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)
def save(path, a):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', path], input=a.astype(np.float32).tobytes(), check=True)
T = json.load(open(os.path.join(GEN, 'timeline.json'), encoding='utf-8'))
dur = {}
for i, x in enumerate(T, 1):
    a = load(os.path.join(SRC, f'{i:02d}.flac'))
    # 20ms 窗口的 RMS，高于峰值 −40 dB 视为有声；首尾各留 60ms
    w = int(SR * 0.02); n = len(a) // w
    rms = np.sqrt((a[:n * w].reshape(n, w) ** 2).mean(1) + 1e-12)
    on = np.where(20 * np.log10(rms / rms.max()) > -40)[0]
    s, e = max(0, on[0] * w - int(0.06 * SR)), min(len(a), (on[-1] + 1) * w + int(0.06 * SR))
    b = a[s:e].copy()
    # 句内停顿超过 MAXGAP 的压到 KEEP（Voice Direction 爱在逗号处停 1 秒以上），拼接处 10ms 交叉淡化
    MAXGAP, KEEP = 0.55, 0.5
    m = len(b) // w; r2 = np.sqrt((b[:m * w].reshape(m, w) ** 2).mean(1) + 1e-12)
    quiet = 20 * np.log10(r2 / r2.max()) < -35
    runs, k = [], 0
    while k < m:
        if quiet[k]:
            j = k
            while j < m and quiet[j]: j += 1
            if (j - k) * 0.02 > MAXGAP and k > 0 and j < m: runs.append((k * w, j * w))
            k = j
        else: k += 1
    for rs, re_ in reversed(runs):
        cut = (re_ - rs) - int(KEEP * SR); mid = rs + int(KEEP * SR / 2)
        f = int(0.01 * SR)
        tail = b[mid + cut:].copy(); tail[:f] = tail[:f] * np.linspace(0, 1, f) + b[mid:mid + f] * np.linspace(1, 0, f)
        b = np.concatenate([b[:mid], tail])
    f = int(0.01 * SR); b[:f] *= np.linspace(0, 1, f); b[-f:] *= np.linspace(1, 0, f)   # 10ms 淡入淡出防爆音
    save(os.path.join(TRIM, f'{i:02d}.wav'), b)
    dur[x['text']] = round(len(b) / SR, 3)
    print(f'{i:02d} {len(a)/SR:5.2f}s → {len(b)/SR:5.2f}s  {x["text"]}')
json.dump(dur, open(os.path.join(GEN, 'durations.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('total speech', round(sum(dur.values()), 2), 's')
