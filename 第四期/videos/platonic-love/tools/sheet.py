# 把若干张截图拼成两列的总览图：python tools/sheet.py out.jpg a.png b.png ...
import sys
from PIL import Image, ImageDraw
out, fs = sys.argv[1], sys.argv[2:]
W, H = 960, 540
rows = (len(fs) + 1) // 2
sheet = Image.new("RGB", (W * 2 + 10, rows * (H + 10)), (30, 22, 16))
for i, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((W, H))
    ImageDraw.Draw(im).text((10, 8), f.split("/")[-1].split("\\")[-1], fill=(255, 60, 60))
    sheet.paste(im, ((i % 2) * (W + 10), (i // 2) * (H + 10)))
sheet.save(out, quality=85)
