# 预处理：从 gen-photos 生成片子要用的图和像素数据。所有调色都是真算的，算法和片子里讲的一致。
# 用法：python tools/prep.py
import json, colorsys
from pathlib import Path
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent.parent
SRC = HERE.parent.parent / "gen-photos"
IMG = HERE / "assets" / "img"
IMG.mkdir(parents=True, exist_ok=True)

def load(name): return np.asarray(Image.open(SRC / name).convert("RGB")).astype(np.float64)
def save(a, name, q=None):
    im = Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8))
    if name.endswith(".jpg"): im.save(IMG / name, quality=q or 93)
    else: im.save(IMG / name)

W601 = np.array([0.299, 0.587, 0.114])

def saturate(a, s):                      # 片子里讲的：灰 + (原值 − 灰) × s
    g = (a * W601).sum(2, keepdims=True)
    return g + (a - g) * s

def contrast(a, k):                      # 片子里讲的：(原值 − 128) × k + 128
    return (a - 128) * k + 128

# ---------- 主图：右下角那本书的封面偏紫，改成暖棕 ----------
hero = load("hero.png")
reg = hero[540:780, 1230:1536] / 255.0
hsv = np.array([colorsys.rgb_to_hsv(*p) for p in reg.reshape(-1, 3)])
h, s, v = hsv[:, 0] * 360, hsv[:, 1], hsv[:, 2]
m = (h > 225) & (h < 345) & (s > 0.12)
hsv[m, 0] = (22 + (h[m] - 285) * 0.15) / 360 % 1.0
hsv[m, 1] = s[m] * 0.75
fixed = np.array([colorsys.hsv_to_rgb(*p) for p in hsv]).reshape(reg.shape) * 255
hero[540:780, 1230:1536] = fixed
print("book pixels recolored:", int(m.sum()))
save(hero, "hero.png")

# ---------- 平淡版（S10 的起点）：降对比、降饱和，像没调过的直出 ----------
flat = saturate(contrast(hero, 0.8), 0.72)
save(flat, "hero-flat.png")

# ---------- S10 四步，从平淡版一步步调 ----------
g1 = flat * np.array([1.035, 1.0, 0.965])                       # ① 白平衡：略暖
x = np.clip(g1, 0, 255) / 255
sc = x + 0.55 * (x * x * (3 - 2 * x) - x)                        # ② S 形曲线
g2 = sc * 255
y = np.clip(g2, 0, 255)                                          # ③ 自然饱和度：越不鲜艳的颜色加得越多，护肤色
mx, mn = y.max(2, keepdims=True), y.min(2, keepdims=True)
sat = (mx - mn) / np.maximum(mx, 1)
r, gg, b = y[..., :1], y[..., 1:2], y[..., 2:]
skin = np.clip(1 - np.abs(((r - gg) / np.maximum(r - b, 1)) - 0.45) * 2.2, 0, 1) * (r > gg) * (gg > b)
amt = 0.9 * (1 - sat) * (1 - 0.7 * skin)
L = (y * W601).sum(2, keepdims=True)
g3 = L + (y - L) * (1 + amt)
z = np.clip(g3, 0, 255) / 255                                    # ④ 滤镜（胶片风 LUT）：抬黑、压高光、暗部偏青、亮部偏暖、略降饱和
lum = (z * W601).sum(2, keepdims=True)
film = 0.06 + z * 0.9
film = film + (1 - lum) * np.array([-0.025, 0.01, 0.035]) * 0.9 + lum * np.array([0.03, 0.008, -0.03])
film = saturate(film * 255, 0.9)
for i, a in enumerate([g1, g2, g3, film], 1): save(a, f"grade{i}.png")

# 132.66 那一下"穿过换色表"：直接对主图套同一个胶片风
z = hero / 255
lum = (z * W601).sum(2, keepdims=True)
f2 = 0.06 + z * 0.9 + (1 - lum) * np.array([-0.025, 0.01, 0.035]) * 0.9 + lum * np.array([0.03, 0.008, -0.03])
save(saturate(f2 * 255, 0.9), "hero-film.png")

# ---------- S2：暗光下单点 vs 四合一（真实的光子计数模拟） ----------
rng = np.random.default_rng(7)
crop = hero[380:780, 0:400]                                      # 左侧椅子和墙角
dark = crop / 255 * 6                                            # 暗光：每个感光点平均只接到几个光子
single = rng.poisson(dark) / 6 * 255
quad = rng.poisson(np.repeat(np.repeat(dark, 1, 0), 1, 1) * 4)   # 4 个点的光子加在一起（面积大 4 倍）
quad = quad.reshape(200, 2, 200, 2, 3).mean((1, 3))              # 合成 1 个像素
quad = np.repeat(np.repeat(quad, 2, 0), 2, 1) / 24 * 255
save(single, "noise-single.png"); save(quad, "noise-quad.png")

# ---------- 坏照片原样拷贝 ----------
for n in ["bad-yellow", "bad-overexposed", "bad-backlit"]:
    save(load(n + ".png"), n + ".png")

# ---------- 像素数据 ----------
H = hero.astype(int)
def block(cx, cy, w, h): return H[cy - h // 2: cy - h // 2 + h, cx - w // 2: cx - w // 2 + w].tolist()
Y = load("bad-yellow.png")
rice = Y[850:885, 600:680].reshape(-1, 3).mean(0)
gains = (rice.max() / rice).round(2)
data = {
    "orange": {"x": 131, "y": 596, "rgb": H[596, 131].tolist(), "block": block(131, 596, 16, 10)},
    "cloud": {"y": 166, "x": 905, "a": H[166, 905].tolist(), "b": H[166, 906].tolist()},
    "rice": {"x": 640, "y": 867, "rgb": rice.round().astype(int).tolist(), "gains": gains.tolist()},
    "strawberry": {"x": 250, "y": 690, "rgb": H[690, 250].tolist()},
}
# 数字墙：主图缩成 40×27 格，每格的真实平均色
wall = np.asarray(Image.fromarray(hero.astype(np.uint8)).resize((40, 27), Image.BOX)).astype(int)
data["wall"] = wall.tolist()
# 对比度：主图第 560 行（杯子、桌面、窗框）取 9 个点的亮度（Rec.601 灰）
xs = [60, 230, 420, 610, 760, 900, 1060, 1250, 1450]
data["row"] = [int(round((H[560, x] * W601).sum())) for x in xs]
# 逆光：bad-backlit 第 520 行，从人到窗外取 9 个点
B = load("bad-backlit.png")
xs = [80, 300, 520, 700, 900, 1000, 1150, 1300, 1480]
data["backlit"] = [int(round((B[520, x] * W601).sum())) for x in xs]
(HERE / "assets" / "js" / "data.js").write_text("window.PX = " + json.dumps(data) + ";\n", encoding="utf-8")
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "block"} for k, v in data.items() if isinstance(v, dict)}))
