# Contact sheet of web-src/*.png for quick review.
import glob, os
from PIL import Image, ImageDraw, ImageFont
files = sorted(glob.glob("web-src/*.png"))
tw, th, cols = 480, 560, 6
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 30)), "white")
d = ImageDraw.Draw(sheet)
font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB")
    im = im.resize((tw, int(im.height * tw / im.width)))
    im = im.crop((0, 0, tw, min(th, im.height)))
    x, y = (i % cols) * tw, (i // cols) * (th + 30)
    sheet.paste(im, (x, y + 30))
    d.text((x + 6, y + 5), os.path.basename(f)[:-4], fill="black", font=font)
sheet.save("web-src-sheet.jpg", quality=85)
print(len(files), sheet.size)
