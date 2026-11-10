# 把若干张截帧拼成一张 2 列总览（只给自检用）。用法：python -I tools/sheet.py out.jpg a.png b.png ...
import sys
from PIL import Image
out, fs = sys.argv[1], sys.argv[2:]
rows = (len(fs) + 1) // 2
W = Image.new("RGB", (1920, 540 * rows))
for i, f in enumerate(fs): W.paste(Image.open(f).convert("RGB").resize((960, 540)), ((i % 2) * 960, (i // 2) * 540))
W.save(out, quality=80)
