# Llama 织锦贴图预处理：补撕裂纹 → 整张纵向压进中间纬度带 → 两极用织物条纹延伸补满
# 输出 2:1 的 llama-B-prep.png，再交给 ../fix_texture.py 修左右接缝
import numpy as np
from PIL import Image

a = np.asarray(Image.open('llama-B.png').convert('RGB')).copy()
# 1) 撕裂纹（第 386–401 行）：用紧挨在上面的橙色条纹行（380–385）循环覆盖
src = a[380:386]
for i, y in enumerate(range(386, 402)):
    a[y] = src[i % len(src)]

# 2) 纵向压缩：内容占全高的 BAND，羊驼带从约 ±70° 移到约 ±50°；
#    高纬度球面横向收缩 cosφ，正好抵消压扁，比例更接近原样
W, H, BAND = 2048, 1024, 0.78
ch = int(H * BAND)
body = np.asarray(Image.fromarray(a).resize((W, ch), Image.LANCZOS))
pad = (H - ch) // 2
# 3) 两极：把最上/最下 24 行条纹重复铺满（像编织帽顶的一圈圈条纹）
top = np.concatenate([body[:24]] * (pad // 24 + 2))[:pad][::-1]
bot = np.concatenate([body[-24:]] * ((H - ch - pad) // 24 + 2))[:H - ch - pad]
out = np.concatenate([top, body, bot])
Image.fromarray(out).save('llama-B-prep.png')
print('ok', out.shape)
