# 用本地 ComfyUI 的 VOSR2（TE-Speed-VOSR2）把成片用到的插图放大 3 倍（1536×1024 → 4608×3072），给 4K 渲染用（第十期：原图取 02-素材/gen1 的 PNG）。
# 原图备份在 assets/img_1080/，放大后的图在 assets/img_4k/；全部完成后由调用方替换 assets/img/。
# 用法：python -I tools/upscale_vosr2.py a.png b.png ...
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
IN_DIR = os.path.join(COMFY, "input", "vibe10")
os.makedirs(IN_DIR, exist_ok=True)
SRC = os.path.join(ROOT, "..", "..", "02-素材", "gen1")
BAK = os.path.join(ROOT, "assets", "img_1080")
DST = os.path.join(ROOT, "assets", "img_4k")
os.makedirs(BAK, exist_ok=True); os.makedirs(DST, exist_ok=True)

def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())

def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())

def workflow(name):
    stem = os.path.splitext(name)[0]
    return {
        "1": {"class_type": "LoadImage", "inputs": {"image": f"vibe10/{name}"}},
        "2": {"class_type": "TESpeedVOSR2Loader", "inputs": {"model_bundle": "VOSR2", "precision": "auto", "memory_policy": "auto"}},
        "3": {"class_type": "TESpeedVOSR2Settings", "inputs": {"quality_profile": "manual", "tile_strategy": "auto", "tile_size": 1024, "tile_overlap": 64,
              "vae_tile_size": 1024, "vae_tile_overlap": 64, "image_batch": 1, "frame_batch": 2, "dino_batch": 2, "temporal_cache": False,
              "cache_threshold": 0.003, "cache_refresh": 4, "memory_policy": "auto", "color_alignment": "wavelet"}},
        "4": {"class_type": "TESpeedVOSR2Image", "inputs": {"model": ["2", 0], "images": ["1", 0], "scale": 3, "seed": 42, "settings": ["3", 0]}},
        "5": {"class_type": "SaveImage", "inputs": {"images": ["4", 0], "filename_prefix": f"vibe10_4k/{stem}"}},
    }

for name in sys.argv[1:]:
    dst = os.path.join(DST, name)
    if os.path.exists(dst):
        print("skip", name); continue
    if not os.path.exists(os.path.join(BAK, name)):
        shutil.copy(os.path.join(SRC, name), os.path.join(BAK, name))
    shutil.copy(os.path.join(BAK, name), os.path.join(IN_DIR, name))
    t0 = time.time()
    pid = post("/prompt", {"prompt": workflow(name)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"):
            break
        if st.get("status_str") == "error":
            raise SystemExit(f"failed {name}: {json.dumps(st, ensure_ascii=False)[:1500]}")
        time.sleep(2)
    out = h[pid]["outputs"]["5"]["images"][0]
    shutil.copy(os.path.join(COMFY, "output", out.get("subfolder", ""), out["filename"]), dst)
    print(f"ok {name} {time.time() - t0:.0f}s", flush=True)
