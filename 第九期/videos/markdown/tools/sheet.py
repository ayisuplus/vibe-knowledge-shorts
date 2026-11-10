# 把若干张截图拼成一张对照表：python tools/sheet.py out.jpg a.png b.png ...（两列，每张缩到 960 宽，左上角标文件名里的时间）
import sys, re
from PIL import Image, ImageDraw, ImageFont
out, fs = sys.argv[1], sys.argv[2:]
W, H = 960, 540
rows = (len(fs) + 1) // 2
s = Image.new("RGB", (W * 2 + 10, rows * (H + 10)), "white")
d = ImageDraw.Draw(s)
for k, f in enumerate(fs):
    im = Image.open(f).convert("RGB").resize((W, H))
    x, y = (k % 2) * (W + 10), (k // 2) * (H + 10)
    s.paste(im, (x, y))
    m = re.search(r"t(\d+\.\d+)", f)
    d.rectangle([x, y, x + 110, y + 34], fill="black")
    d.text((x + 8, y + 6), m.group(1) if m else str(k), fill="yellow", font=ImageFont.load_default(24))
s.save(out, quality=88)
