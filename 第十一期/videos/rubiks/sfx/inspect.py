# 检查新素材：峰值、起音时刻、频谱平坦度（越接近 1 越像白噪声），并画频谱图拼成一张对照表。
# 用法：python -I sfx/inspect.py name1 name2 ...
import os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
tiles = []
for name in sys.argv[1:]:
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(HERE, "raw", f"{name}.flac"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32)
    env = np.convolve(np.abs(x), np.ones(441) / 441, mode="same")
    onset = np.argmax(env > env.max() * 0.3) / SR
    n, hop = 2048, 512
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1)) + 1e-9
    flat = np.exp(np.log(S).mean(axis=1)) / S.mean(axis=1)
    loud = env[::hop][: len(flat)] > env.max() * 0.2
    print(f"{name:9s} dur {len(x)/SR:4.2f}s  peak {20*np.log10(np.abs(x).max()+1e-9):6.1f} dBFS  onset {onset:4.2f}s  flatness(loud) {flat[loud].mean():.2f}")
    db = 20 * np.log10(S.T[:400][::-1])
    db = np.clip((db - db.max() + 70) / 70, 0, 1)
    im = Image.fromarray((db * 255).astype(np.uint8)).resize((480, 200))
    tile = Image.new("RGB", (480, 224), "white"); tile.paste(im.convert("RGB"), (0, 24))
    ImageDraw.Draw(tile).text((6, 4), name, fill="black"); tiles.append(tile)
sheet = Image.new("RGB", (960, 224 * ((len(tiles) + 1) // 2)), "white")
for i, t in enumerate(tiles): sheet.paste(t, ((i % 2) * 480, (i // 2) * 224))
sheet.save(os.path.join(HERE, "inspect.png"))
