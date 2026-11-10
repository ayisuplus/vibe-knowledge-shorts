# 用本地 ComfyUI 的 MMAudio 批量生成音效素材（文字 → 音频），保存到 sfx/raw/。
# 用法：python -I sfx/generate.py   （需要 ComfyUI 运行在 127.0.0.1:8188）
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cues import SOUNDS, NEG

HOST = "http://127.0.0.1:8188"
COMFY_OUT = r"G:\comfyui\ComfyUI\ComfyUI\output"
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)


def workflow(name, s):
    return {
        "1": {"class_type": "MMAudioModelLoader", "inputs": {"mmaudio_model": "mmaudio_large_44k_v2.pth", "base_precision": "fp16"}},
        "2": {"class_type": "MMAudioFeatureUtilsLoader", "inputs": {
            "vae_model": "mmaudio_vae_44k_fp16.safetensors", "synchformer_model": "mmaudio_synchformer_fp16.safetensors",
            "clip_model": "apple_DFN5B-CLIP-ViT-H-14-384_fp16.safetensors", "mode": "44k", "precision": "fp16"}},
        "3": {"class_type": "MMAudioSampler", "inputs": {
            "mmaudio_model": ["1", 0], "feature_utils": ["2", 0], "duration": s["dur"], "steps": 25, "cfg": 4.5, "seed": s["seed"],
            "prompt": s["prompt"], "negative_prompt": NEG, "mask_away_clip": False, "force_offload": False}},
        "4": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 0], "filename_prefix": f"audio/vibe_sfx_{name}"}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


for name, s in SOUNDS.items():
    dst = os.path.join(RAW, f"{name}.flac")
    if os.path.exists(dst):
        print("skip", name)
        continue
    pid = post("/prompt", {"prompt": workflow(name, s)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        if pid in h and h[pid].get("status", {}).get("completed"):
            break
        if pid in h and h[pid].get("status", {}).get("status_str") == "error":
            raise SystemExit(f"failed: {name}")
        time.sleep(0.5)
    out = h[pid]["outputs"]["4"]["audio"][0]
    src = os.path.join(COMFY_OUT, out.get("subfolder", ""), out["filename"])
    shutil.copy(src, dst)
    print("ok", name, s["dur"])
