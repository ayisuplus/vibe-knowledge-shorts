# 英雄原画抠图：本地 onnxruntime 跑 isnet-anime（skytnt/anime-seg 的 isnetis.onnx，md5 6f184e75…，与 rembg 的 isnet-anime 相同）。
# 用法：python -I 第二十四期/videos/hok-split/tools/cutout.py <模型路径> 112 144 167 131 109
# 输入：../../02-风格样张/素材/skin-<id>.jpg（腾讯官方 CDN 原画，用户授权使用，不入库）
# 输出：../assets/img/hero-<id>.png 与遮罩 mask-<id>.png（都不入库）
import os, sys
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(HERE, "..", "..", "..", "02-风格样张", "素材"))
OUT = os.path.normpath(os.path.join(HERE, "..", "assets", "img"))
os.makedirs(OUT, exist_ok=True)
S = 1024

model, ids = sys.argv[1], sys.argv[2:]
sess = ort.InferenceSession(model, providers=["CPUExecutionProvider"])
inp = sess.get_inputs()[0].name
for hid in ids:
    im = Image.open(os.path.join(SRC, f"skin-{hid}.jpg")).convert("RGB")
    w0, h0 = im.size
    k = S / max(w0, h0); w, h = int(w0 * k), int(h0 * k)
    x = np.zeros((S, S, 3), np.float32); ph, pw = (S - h) // 2, (S - w) // 2
    x[ph:ph + h, pw:pw + w] = np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255
    m = sess.run(None, {inp: x.transpose(2, 0, 1)[None]})[0][0, 0][ph:ph + h, pw:pw + w]
    m = np.clip((m - 0.35) / 0.4, 0, 1)                 # 去掉半透明的背景碎块，边缘收紧
    m = Image.fromarray((m * 255).astype(np.uint8)).resize((w0, h0), Image.LANCZOS)
    m.save(os.path.join(OUT, f"mask-{hid}.png"))
    rgba = im.convert("RGBA"); rgba.putalpha(m.filter(ImageFilter.GaussianBlur(0.6)))
    bb = Image.fromarray(((np.asarray(m) > 128) * 255).astype(np.uint8)).getbbox()
    rgba.crop(bb).save(os.path.join(OUT, f"hero-{hid}.png"))
    print("ok", hid, bb, flush=True)
