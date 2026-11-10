# 4K 交付前的素材放大（本地 ComfyUI 的 VOSR2，×3）：
#   python -I tools/upscale4k.py bg     六张背景原图 02-素材/backdrops/bg-*.png → 02-素材/backdrops/4k/bg-*.png（4608×3072）
#   python -I tools/upscale4k.py hand   全息手视频 02-素材/holo-hand/raw/i2v_1401.mp4 → 02-素材/holo-hand/raw/i2v_1401_4k.mp4（4128×2304）
# 放大完以后：prep_bg.py --4k 生成 assets/img/env/*.jpg；holo-snap.mp4 用 ffmpeg 重新拼（见 README 里的命令）。
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
EP = os.path.normpath(os.path.join(HERE, "..", "..", ".."))
HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
IN_DIR = os.path.join(COMFY, "input", "vibe11")
os.makedirs(IN_DIR, exist_ok=True)


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def run(wf, out_node):
    pid = post("/prompt", {"prompt": wf})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"): break
        if st.get("status_str") == "error":
            raise SystemExit("failed: " + json.dumps(st, ensure_ascii=False)[:2000])
        time.sleep(2)
    o = h[pid]["outputs"][out_node]
    item = (o.get("images") or o.get("videos") or o.get("gifs"))[0]
    return os.path.join(COMFY, "output", item.get("subfolder", ""), item["filename"])


LOADER = {"class_type": "TESpeedVOSR2Loader", "inputs": {"model_bundle": "VOSR2", "precision": "auto", "memory_policy": "auto"}}
SETTINGS = {"class_type": "TESpeedVOSR2Settings", "inputs": {"quality_profile": "manual", "tile_strategy": "auto", "tile_size": 1024, "tile_overlap": 64,
            "vae_tile_size": 1024, "vae_tile_overlap": 64, "image_batch": 1, "frame_batch": 2, "dino_batch": 2, "temporal_cache": False,
            "cache_threshold": 0.003, "cache_refresh": 4, "memory_policy": "auto", "color_alignment": "wavelet"}}

if sys.argv[1] == "bg":
    src = os.path.join(EP, "02-素材", "backdrops"); dst = os.path.join(src, "4k"); os.makedirs(dst, exist_ok=True)
    for n in ["blueprint", "1974", "space", "vault", "collider", "skylight"]:
        name = f"bg-{n}.png"; out = os.path.join(dst, name)
        if os.path.exists(out): print("skip", name); continue
        shutil.copy(os.path.join(src, name), os.path.join(IN_DIR, name)); t0 = time.time()
        f = run({"1": {"class_type": "LoadImage", "inputs": {"image": f"vibe11/{name}"}}, "2": LOADER, "3": SETTINGS,
                 "4": {"class_type": "TESpeedVOSR2Image", "inputs": {"model": ["2", 0], "images": ["1", 0], "scale": 3, "seed": 42, "settings": ["3", 0]}},
                 "5": {"class_type": "SaveImage", "inputs": {"images": ["4", 0], "filename_prefix": f"vibe11_4k/bg-{n}"}}}, "5")
        shutil.copy(f, out); print(f"ok {name} {time.time() - t0:.0f}s", flush=True)
elif sys.argv[1] == "hand":
    src = os.path.join(EP, "02-素材", "holo-hand", "raw", "i2v_1401.mp4"); out = src.replace(".mp4", "_4k.mp4")
    shutil.copy(src, os.path.join(IN_DIR, "i2v_1401.mp4")); t0 = time.time()
    f = run({"1": {"class_type": "LoadVideo", "inputs": {"file": "vibe11/i2v_1401.mp4"}},
             "2": {"class_type": "GetVideoComponents", "inputs": {"video": ["1", 0]}}, "3": LOADER, "4": SETTINGS,
             "5": {"class_type": "TESpeedVOSR2Video", "inputs": {"model": ["3", 0], "images": ["2", 0], "scale": 3, "seed": 42, "settings": ["4", 0]}},
             "6": {"class_type": "CreateVideo", "inputs": {"images": ["5", 0], "fps": 24.0}},
             "7": {"class_type": "SaveVideo", "inputs": {"video": ["6", 0], "filename_prefix": "vibe11_4k/holo_snap", "format": "mp4", "codec": "h264"}}}, "7")
    shutil.copy(f, out); print(f"ok hand {time.time() - t0:.0f}s", flush=True)
