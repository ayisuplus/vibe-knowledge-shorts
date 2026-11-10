# 拼第六期配乐预览：A（0–136 硬切）+ B（136–160 渐弱）+ 静默 2 秒 + C《国际歌》。
# 用法：python -I build_preview.py A_rise_601 B_cold_611 C_intl_d0.40_x2_7  -> ../配乐预览-v1.mp3
import os, subprocess, sys
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
A_END, B_LEN, GAP = 136.0, 24.0, 2.0


def load(name):
    y, sr = sf.read(os.path.join(HERE, "raw", name + ".flac"), always_2d=True)
    if sr != SR:
        import librosa
        y = np.stack([librosa.resample(y[:, c], orig_sr=sr, target_sr=SR) for c in range(y.shape[1])], 1)
    if y.shape[1] == 1:
        y = np.repeat(y, 2, 1)
    return y[:, :2]


def fade(y, a, b):
    y = y.copy()
    na, nb = int(a * SR), int(b * SR)
    if na:
        y[:na] *= np.linspace(0, 1, na)[:, None]
    if nb:
        y[-nb:] *= np.linspace(1, 0, nb)[:, None]
    return y


def lufs_norm(y, target=-16.0):
    rms = np.sqrt(np.mean(y ** 2)) + 1e-9
    return y * (10 ** (target / 20) / rms)


a_name, b_name, c_name = sys.argv[1:4]
A = fade(load(a_name)[: int(A_END * SR)], 0, 0.03)
B = fade(load(b_name)[: int(B_LEN * SR)], 0.4, 6.0)
C = fade(load(c_name), 0, 1.5)
A, B, C = lufs_norm(A, -17), lufs_norm(B, -22), lufs_norm(C, -15)
out = np.concatenate([A, B, np.zeros((int(GAP * SR), 2)), C])
out /= max(1.0, np.max(np.abs(out)) / 0.95)
wav = os.path.join(HERE, "preview.wav")
sf.write(wav, out, SR)
mp3 = os.path.join(HERE, "..", "配乐预览-v1.mp3")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-b:a", "192k", mp3], check=True)
print(f"{mp3}: {len(out) / SR:.1f}s  (A 0–{A_END}, B {A_END}–{A_END + B_LEN}, gap, C {A_END + B_LEN + GAP:.0f}–{len(out) / SR:.1f})")
