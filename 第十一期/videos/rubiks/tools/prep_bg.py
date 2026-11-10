# v3 背景：02-素材/backdrops/bg-*.png（Codex 生成）→ assets/img/env/*.jpg
# 轻微柔焦（像浅景深，魔方更「跳」出来）+ 按需压暗；还没生成的先放一张深色渐变占位。
import os, sys
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw
H = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(H, "..", "..", "..", "02-素材", "backdrops")
DST = os.path.join(H, "..", "assets", "img", "env"); os.makedirs(DST, exist_ok=True)
# 名字：(柔焦半径, 亮度)
CFG = {"blueprint": (2.2, 0.95), "1974": (2.6, 0.9), "space": (0.8, 1.0), "vault": (2.4, 0.9), "collider": (2.4, 0.85), "skylight": (1.8, 0.95)}
# --4k：用 VOSR2 放大过的原图（backdrops/4k，4608 宽），柔焦半径跟着翻倍
K4 = "--4k" in sys.argv
if K4: SRC = os.path.join(SRC, "4k")
SZ, BK = ((4608, 3072), 3.0) if K4 else ((2304, 1536), 1.5)
for name, (blur, bri) in CFG.items():
    src = os.path.join(SRC, f"bg-{name}.png"); dst = os.path.join(DST, f"{name}.jpg")
    if os.path.exists(src):
        im = Image.open(src).convert("RGB").resize(SZ, Image.LANCZOS)
        im = im.filter(ImageFilter.GaussianBlur(blur * BK))
        im = ImageEnhance.Brightness(im).enhance(bri)
        im.save(dst, quality=92); print("ok", name, im.size)
    elif not os.path.exists(dst) or "--placeholder" in sys.argv:
        im = Image.new("RGB", (1536, 1024), (6, 10, 16)); d = ImageDraw.Draw(im)
        for r in range(500, 0, -10): c = int(40 * (1 - r / 500)); d.ellipse([768 - r * 1.5, 512 - r, 768 + r * 1.5, 512 + r], fill=(6 + c // 2, 10 + c, 16 + c))
        im.save(dst, quality=90); print("placeholder", name)
