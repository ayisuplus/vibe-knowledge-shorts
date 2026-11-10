# 把一段视频按时间抽 8 帧拼成一条（检查手指数、变形、动作节奏）。用法：python -I strip.py raw/x.mp4 ...
import sys, subprocess, os
from PIL import Image
for f in sys.argv[1:]:
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)
    ts = [dur * k / 7 * 0.98 for k in range(8)]
    tiles = []
    for t in ts:
        png = f + f".{t:.2f}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", f, "-frames:v", "1", png], check=True)
        tiles.append(Image.open(png).convert("RGB").resize((480, 268))); os.remove(png)
    s = Image.new("RGB", (480 * 4 + 30, 268 * 2 + 10), "white")
    for i, im in enumerate(tiles): s.paste(im, ((i % 4) * 490, (i // 4) * 278))
    s.save(f.rsplit(".", 1)[0] + "_strip.jpg", quality=86)
    print(f, f"{dur:.2f}s", [f"{t:.1f}" for t in ts])
