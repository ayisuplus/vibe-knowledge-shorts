# 第六期配乐 v4（2026-10-15；v15 起片名后加 3.459 秒过渡）：用户嫌旧配乐"开头没钩子、中间重音像重锤"，四段重新生成（MiniMax Music 3，见 music/pieces.py 的 M1–M4），
# 按画面（成片 240.30 秒）拼接；结尾《国际歌》沿用 配乐-终版.wav（v3）里的那段。
# 用法：python -I 第六期/audio/build_master_v4.py
import os, subprocess
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "music", "raw")
SR = 44100
TOTAL = 264.89
IN = 17.531  # v20：开场 40 拍； v18：最前面的开场钩子 = M1 开头 20 拍（之后 M1 从头再起）
EXT = 3.459  # v15：片名后加的过渡 = M1 里从 26.239 开始的 8 拍，重复一遍

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def active_rms_db(x):
    # 只算有声音的部分（短时响度高于该段 40 分位），避免静音拉低
    hop = SR // 10
    r = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
    r = r[r > np.percentile(r, 40)]
    return 20 * np.log10(np.mean(r) + 1e-9)

def fade(x, fin=0.0, fout=0.0):
    x = x.copy()
    if fin > 0:
        n = int(fin * SR); x[:n] *= np.linspace(0, 1, n)[:, None]
    if fout > 0:
        n = int(fout * SR); x[-n:] *= np.linspace(1, 0, n)[:, None] ** 1.5
    return x

out = np.zeros((int(TOTAL * SR), 2), np.float32)
def place(x, at, gain_db=0.0):
    i = int(at * SR); x = x[: len(out) - i] * (10 ** (gain_db / 20))
    out[i:i + len(x)] += x

intl_all = load(os.path.join(HERE, "配乐-终版.wav"))
intl = intl_all[int(190.256 * SR):]            # v3 里 C 段（星星之火 → 《国际歌》）从 190.256 开始
ref = active_rms_db(intl) - 1.5                 # 前面几段比结尾低 1.5 dB，留给《国际歌》做最高点

segs = [
    # (文件, 源起点, 源终点, 放映起点, 淡入, 淡出, 相对 ref 的增益)
    ("M1_hook_1403.flac", 0.0, 17.531, 0.0, 0.0, 0.6, 0.0),   # v18 开场钩子：满屏的"主义" → 共产主义
    ("M1_hook_1403.flac", 0.0, 29.698, IN, 0.0, 0.0, 0.0),     # 0:00 钩子 → 片名 → 过渡（M1 26.239–29.698 这 8 拍会再放一遍）
    ("M1_hook_1403.flac", 26.239, 91.5, 29.698 + IN, 0.0, 1.0, 0.0),  # 接着往下，1:35 前淡出，留半秒空白给「直到 AI」
    ("M2_ai_1415.flac", 12.7, 39.1, 92.0 + EXT + IN, 0.15, 3.0, 0.0),      # 「直到 AI」起；高潮落在推开门
    ("M3_tension_1424.flac", 0.0, 46.0, 123.66 + EXT + IN, 1.5, 0.0, -1.0), # 结尾骤停对准切夜之城
    ("M4_nightcity_1432.flac", 0.9, 25.0, 169.66 + EXT + IN, 0.0, 2.0, 0.5),# 夜之城
]
gain_cache = {}
for f, s0, s1, at, fin, fout, g in segs:
    full = load(os.path.join(RAW, f))
    if f not in gain_cache:
        gain_cache[f] = ref - active_rms_db(full[int(s0 * SR): int(s1 * SR)] if f != "M1_hook_1403.flac" else full[: int(91.5 * SR)])
    x = full[int(s0 * SR): int(s1 * SR)]
    if f == "M1_hook_1403.flac" and at > 0 and s0 == 0:
        n = int(0.03 * SR); x[:n] *= np.linspace(0, 1, n)[:, None]; x[-n:] *= np.linspace(1, 0, n)[:, None]
    elif f == "M1_hook_1403.flac" and s0 > 0:
        n = int(0.03 * SR); x[:n] *= np.linspace(0, 1, n)[:, None]  # 接缝 30ms 交叉
    elif f == "M1_hook_1403.flac":
        n = int(0.03 * SR); x[-n:] *= np.linspace(1, 0, n)[:, None]
    x = fade(x, fin, fout)
    place(x, at, gain_cache[f] + g)
# v24：结尾放缓——《国际歌》最后那个和弦（相对 36.0 秒起）持续的部分按小节（1.2 秒）再补 6 秒，旋律不动
def _seg(x, a, b): return x[int(a * SR): int(b * SR)].copy()
_F = int(0.06 * SR); _r = np.linspace(0, 1, _F)[:, None] ** 0.5
def _xf(x, y):
    return np.concatenate([x[:-_F], x[-_F:] * _r[::-1] + y[:_F] * _r, y[_F:]])
_pad = lambda x: np.concatenate([np.zeros((_F, 2), np.float32), x])
intl = _xf(_xf(_seg(intl, 0, 40.8), _seg(intl, 37.2 - 0.06, 40.8)), _seg(intl, 40.8 - 0.06, len(intl) / SR))  # v25：只补 3 小节（3.6 秒）
place(intl, 196.256 + EXT + IN)

peak = np.abs(out).max()
# 个别瞬态被增益推得太高：只用限幅器压尖峰，不整体压低
tmp = os.path.join(HERE, "_v4_float.wav")
sf.write(tmp, out, SR, subtype="FLOAT")
for dst, codec in (("配乐-v4.wav", ["-c:a", "pcm_s24le"]), ("配乐-v4.m4a", ["-c:a", "aac", "-b:a", "256k"])):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", "alimiter=limit=0.89:attack=3:release=80:level=disabled", *codec, os.path.join(HERE, dst)], check=True)
os.remove(tmp)
print("ok", len(out) / SR, "raw peak", round(float(peak), 3))
