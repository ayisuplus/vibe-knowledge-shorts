# 生成纸纹（乘法叠加用，接近白色）：低频斑驳 + 细颗粒 + 少量纤维。确定性种子。
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(10)
W, H = 1920, 1080
def blur_noise(scale):
    n = rng.random((H // scale + 2, W // scale + 2)).astype(np.float32)
    im = Image.fromarray((n * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(scale / 3))
    return np.asarray(im).astype(np.float32) / 255
low = blur_noise(160) * 0.6 + blur_noise(48) * 0.4
grain = rng.normal(0, 1, (H, W)).astype(np.float32)
v = 1 - 0.035 * (low - 0.5) * 2 - 0.018 * grain
fib = Image.new("L", (W, H), 0)
from PIL import ImageDraw
d = ImageDraw.Draw(fib)
for _ in range(420):
    x, y = rng.random() * W, rng.random() * H
    a = rng.random() * np.pi; L = 8 + rng.random() * 30
    d.line([x, y, x + np.cos(a) * L, y + np.sin(a) * L], fill=int(40 + rng.random() * 60), width=1)
fib = np.asarray(fib.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255
v = v - 0.05 * fib
v = np.clip(v * 255, 0, 255).astype(np.uint8)
rgb = np.stack([v, (v * 0.995).astype(np.uint8), (v * 0.985).astype(np.uint8)], -1)
Image.fromarray(rgb).save("assets/img/paper.jpg", quality=90)
print("ok")
