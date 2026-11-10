# 第十七期素材准备：从 01-调研/素材-拟人形象/ 读用户提供的原图 → 裁切 →（可选）抠图 → 2 倍放大 → assets/img/*.png
# 二次元角色一律用用户的原素材（不在代码里画），这里只做裁切、抠底、缩放。
# 抠图：从「像背景色」的边缘像素做颜色泛洪 ∩ 人像模型掩码（hyperframes remove-background）∪ 模型高置信区 → 去碎块 → 1 px 羽化；边缘颜色向内取色去白边。
# 用法（在 videos/blue-fish 下）：python tools/prep-assets.py
import cv2, numpy as np, os, subprocess

SRC = os.path.normpath(os.path.join(os.path.dirname(__file__), "../../../01-调研/素材-拟人形象"))
OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "../assets/img"))
os.makedirs(OUT, exist_ok=True)

def load(rel):
    return cv2.imdecode(np.fromfile(os.path.join(SRC, rel), np.uint8), cv2.IMREAD_COLOR)

def u2net_alpha(im):
    """用 hyperframes remove-background（u2net_human_seg，本地 CPU）出一张人像掩码"""
    tmp = os.path.join(OUT, "_tmp_in.png"); out = os.path.join(OUT, "_tmp_out.png")
    cv2.imencode(".png", im)[1].tofile(tmp)
    subprocess.run(["npx", "hyperframes", "remove-background", tmp, "-o", out], cwd=os.path.dirname(OUT), shell=True, check=True, capture_output=True)
    a = cv2.imdecode(np.fromfile(out, np.uint8), cv2.IMREAD_UNCHANGED)[..., 3]
    os.remove(tmp); os.remove(out)
    return a

def cutout(im, tol=16, use_u2=True, edges="tblr"):
    h, w = im.shape[:2]
    blur = cv2.GaussianBlur(im, (3, 3), 0)
    border = np.concatenate([blur[0], blur[-1], blur[:, 0], blur[:, -1]]).astype(int)
    q = (border // 8) * 8 + 4                            # 背景色 = 边缘像素里最常见的颜色（立绘碰边时中位数会偏）
    vals, cnt = np.unique(q, axis=0, return_counts=True)
    bgc = vals[cnt.argmax()].astype(float)
    near = lambda c: np.abs(c.astype(int) - bgc).max() <= tol * 1.5
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flags = 4 | cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8)
    lo = up = (tol, tol, tol)
    ys = [y for e, y in (("t", 0), ("b", h - 1)) if e in edges]; xs = [x for e, x in (("l", 0), ("r", w - 1)) if e in edges]
    seeds = [(x, y) for x in range(0, w, 4) for y in ys] + [(x, y) for y in range(0, h, 4) for x in xs]   # 半身像只从上 / 右边起泡
    for x, y in seeds:                                   # 只从「像背景」的边缘像素起泡，立绘碰边的地方不会被挖
        if mask[y + 1, x + 1] == 0 and near(blur[y, x]): cv2.floodFill(blur, mask, (x, y), 0, lo, up, flags)
    flood = (mask[1:-1, 1:-1] == 0).astype(np.uint8) * 255
    if not use_u2:
        fg = flood
    else:
        u2 = u2net_alpha(im)
    # 合并：泛洪前景 ∩ 稍放大的人像掩码（去掉地上的影子）∪（人像掩码高置信区 ∩ 不像背景色）——补回被泛洪挖穿的白色头饰，又不把灰底带进来
        notbg = np.abs(blur.astype(int) - bgc).max(axis=2) > tol * 1.5
        fg = ((flood > 0) & (cv2.dilate(u2, np.ones((9, 9), np.uint8)) > 60)) | ((u2 > 200) & notbg)
        fg = fg.astype(np.uint8) * 255
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    keep = np.zeros_like(fg)
    big = max(st[1:, cv2.CC_STAT_AREA]) if n > 1 else 0
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > big * 0.02: keep[lab == i] = 255
    a = cv2.GaussianBlur(cv2.erode(keep, np.ones((2, 2), np.uint8)), (0, 0), 0.9)
    # 去白 / 灰边：半透明边缘的颜色用稍内侧的前景色代替
    inner = cv2.erode(keep, np.ones((5, 5), np.uint8))
    edge = (a > 0) & (a < 250)
    if edge.any():
        dil = cv2.dilate(np.where(inner[..., None] > 0, im, 0).astype(np.uint8), np.ones((5, 5), np.uint8))
        im = im.copy(); im[edge] = dil[edge]
    return np.dstack([im, a])

def save(name, im, scale=2.0):
    if scale != 1: im = cv2.resize(im, None, fx=scale, fy=scale, interpolation=cv2.INTER_LANCZOS4)
    cv2.imencode(".png", im)[1].tofile(os.path.join(OUT, name + ".png"))
    print(name, im.shape[1], "x", im.shape[0])

def crop(im, box):
    x0, y0, x1, y1 = box
    return im[y0:y1, x0:x1]

SHEET = "Eagle自产/C02_DeepSeek-角色设定卡.png"
COS = "Eagle自产/C02_DeepSeek-真人COS设定卡.png"
jobs = [
    # 名字, 源文件, 裁切框 (x0,y0,x1,y1) 或 None, 是否抠图（True 或泛洪容差）, 放大倍数
    ("girl-front", "Eagle自产/C02_DeepSeek.png", (160, 40, 525, 690), True, 2),       # 鲸鱼娘全身正面（白底）
    ("girl-sheet-front", SHEET, (478, 0, 762, 522), True, 2),                        # 设定卡正面（与背面同画风同比例，S4 转身用）
    ("girl-sheet-back", SHEET, (1148, 0, 1442, 516), True, 2),                       # 设定卡背面
    ("girl-portrait", SHEET, (0, 0, 506, 936), "tr", 2),                             # 设定卡大半身像（S3 长成 / S6 / 封面）
    ("head-anime", SHEET, (523, 528, 750, 852), False, 2),                           # 二次元头像（恐怖谷横轴）
    ("head-cos", COS, (697, 523, 944, 857), False, 2),                               # 真人 COS 头像（恐怖谷「几乎是真人」）
    ("mingyue", "溯源资料/溟月-卫衣版三视图-正侧.jpg", (28, 0, 392, 700), "flood", 2),  # 浅底 + 浅肤色，人像模型会丢腿，只用泛洪   # 溟月卫衣版正面（画师上善无形）
    ("maid", "网络梗图/精选/小肥鱼女仆装.jpg", None, False, 1),                       # 女仆装二创
    ("dteacher", "网络梗图/精选/D老师-搜狐配图.jpg", (0, 0, 1000, 1080), False, 1),   # D 老师
    ("chibi", "网络梗图/精选/表情包-正宗鲸腔.jpg", (230, 150, 1050, 950), False, 1),  # Q 版大头（备用）
    ("chibi-q", "用户提供/Q版鲸鱼娘.jpg", None, "flood", 0.6),                      # 用户指定的 Q 版代表形象（婴儿图式 / 心里的小人）
    ("pick", "网络梗图/精选/梗图-请选择你的DeepSeek形象.jpg", None, False, 1),        # 原梗图「请选择你的 DeepSeek 形象」
]
MEMES = [  # 表情卡（原图，不抠，只缩到长边 720）
    ("m-rice", "网络梗图/精选/表情包-你骂我也没用吃白饭.jpg"),
    ("m-anime", "网络梗图/精选/梗图-番剧太好看了摸鱼.jpg"),
    ("m-wake", "网络梗图/精选/该起床了.jpg"),
    ("m-users", "网络梗图/精选/梗图-这群用户到底有什么用呢.jpg"),
    ("m-cry", "网络梗图/精选/表情包-正宗鲸腔.jpg"),
    ("m-hole", "网络梗图/备用/梗图-大笨蛋在里面吗.jpg"),
    ("m-god", "网络梗图/备用/表情包-鲸鱼神了我大胆孝.jpg"),
    ("m-qwen", "Eagle自产/deepseek甩锅摸鱼表情包.jpg"),
    ("m-angry", "网络梗图/精选/梗图-大肥鱼的攻击性1.jpg"),
]

for name, rel, box, cut, sc in jobs:
    im = load(rel)
    if box: im = crop(im, box)
    if cut: im = cutout(im, 10, use_u2=False) if cut == "flood" else cutout(im, edges=cut) if cut == "tr" else cutout(im)
    save(name, im, sc)
for name, rel in MEMES:
    im = load(rel)
    s = 720 / max(im.shape[:2])
    save(name, im, min(1.0, s) if s < 1 else 1)
