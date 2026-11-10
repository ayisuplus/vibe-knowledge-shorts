# Codex 出的 3:2 贴图 → 2:1 等距柱状贴图，修左右接缝 + 极区
# python -I fix_texture.py fable-A.png   → fable-A-raw.png（只改比例）+ fable-A-fixed.png
import sys
import numpy as np
from PIL import Image

src = sys.argv[1]
fit = '--fit' in sys.argv[2:]          # --fit：整张纵向压成 2:1、不裁切（上下色带也要保留时用，如气态巨行星）
nopole = '--nopole' in sys.argv[2:]    # --nopole：不做极区淡化（纬度带要能数清时用，如 Haiku/Sonnet/Opus）
stem = src.rsplit('.', 1)[0]
im = Image.open(src).convert('RGB')
w, h = im.size
# 1) 比例：默认裁成 2:1（上下各切掉一点，切的正好是本来就该「空」的极区），再放大到 2048×1024
if not fit:
    ch = w // 2
    top = (h - ch) // 2
    im = im.crop((0, top, w, top + ch))
im = im.resize((2048, 1024), Image.LANCZOS)
im.save(stem + '-raw.png')
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape

# 2) 左右接缝：窄带重叠。把最右 k 列淡入到最左 k 列上，再裁掉最右 k 列：
#    新图右边缘 = 原图第 W-k-1 列，新图左边缘 = 原图第 W-k 列，两者本来就相邻，所以接上了。
#    重影只出现在 k 列宽的边缘带里（不是半宽平移那种整片重影）。
k = int(W * 0.04)
m = np.linspace(0, 1, k)
m = (m * m * (3 - 2 * m))[None, :, None]
a[:, :k] = a[:, W - k:] * (1 - m) + a[:, :k] * m
a = np.ascontiguousarray(a[:, :W - k])
a = np.asarray(Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)).astype(np.float32)

# 3) 极区：高纬度逐行向该行均色过渡，消除向极点收缩的拉扯纹
lat = np.abs((np.arange(H) + 0.5) / H - 0.5) * 180  # 0 赤道 → 90 极点
p = np.clip((lat - 62) / (86 - 62), 0, 1) * (0 if nopole else 1)
p = p * p * (3 - 2 * p)
rowmean = a.mean(axis=1, keepdims=True)
a = a * (1 - p[:, None, None]) + rowmean * p[:, None, None]

Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(stem + '-fixed.png')
print('ok', stem + '-raw.png', stem + '-fixed.png')
