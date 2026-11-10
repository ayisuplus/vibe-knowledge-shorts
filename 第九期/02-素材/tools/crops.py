# Crop screenshots: drop GitHub's black top nav (CSS y<72), keep CSS y 72..BOT. Usage: crops.py <out> [scale=1] [BOT=1400]
# Row boxes from web-src/*.json are shifted by the same crop so the frames can draw highlights.
import glob, json, os, sys
from PIL import Image
out = sys.argv[1]
TOP = 72
BOT = int(sys.argv[3]) if len(sys.argv) > 3 else 1400  # 超出截图高度时按截图实际高度裁
meta = {}
for f in sorted(glob.glob("web-src/*.png")):
    n = os.path.basename(f)[:-4]
    im = Image.open(f).convert("RGB")
    S = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    w, h = im.size[0] // 2, im.size[1] // 2
    top = TOP if n.startswith("gh-") else 0
    im = im.crop((0, top * 2, im.size[0], min(im.size[1], BOT * 2))).resize((w * S, (min(h, BOT) - top) * S), Image.LANCZOS)
    im.save(f"{out}/{n}.jpg", quality=88)
    j = f"web-src/{n}.json"
    rows = []
    if os.path.exists(j):
        rows = [{"name": r["name"], "x": r["row"]["x"], "y": r["row"]["y"] - top, "w": r["row"]["w"], "h": r["row"]["h"]} for r in json.load(open(j))["rows"]]
    meta[n] = {"w": im.size[0] // S, "h": im.size[1] // S, "rows": rows}
open(f"{out}/shots.js", "w", encoding="utf-8").write("window.SHOTS = " + json.dumps(meta, ensure_ascii=False) + ";\n")
print(len(meta), "images")
