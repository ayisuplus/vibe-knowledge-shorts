# 用本地 ComfyUI 的 MiniMax Music 3 生成第十一期配乐的候选版本，保存到 music/raw/。
# 用法：python -I 第十一期/audio/music/generate.py A_rise 101 102 103
#      （需要 ComfyUI 运行在 127.0.0.1:8188；参数：段名 + 若干 seed）
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pieces import PIECES

HOST = "http://127.0.0.1:8188"
COMFY_OUT = r"G:\comfyui\ComfyUI\ComfyUI\output"
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)


def workflow(name, p, seed):
    return {
        "6": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_music3_dit_fp32.safetensors", "weight_dtype": "default"}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "minimax_music3_text_encoder_bf16.safetensors", "type": "minimax", "device": "default"}},
        "7": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_music3_dav.safetensors"}},
        "13": {"class_type": "MiniMaxMusic3TextEncode", "inputs": {
            "clip": ["3", 0], "caption": p["caption"], "lyrics": p["lyrics"], "seed": seed,
            "max_duration": float(p["seconds"]), "cfg_scale": 1.7, "top_k": 50}},
        "10": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["13", 0]}},
        "15": {"class_type": "EmptyMiniMaxMusic3LatentAudio", "inputs": {"seconds": ["13", 1], "batch_size": 1}},
        "9": {"class_type": "KSampler", "inputs": {
            "model": ["6", 0], "positive": ["13", 0], "negative": ["10", 0], "latent_image": ["15", 0],
            "seed": seed, "steps": 30, "cfg": 1.7, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "12": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["9", 0], "vae": ["7", 0]}},
        "35": {"class_type": "SaveAudio", "inputs": {"audio": ["12", 0], "filename_prefix": f"audio/vibe11_{name}_{seed}"}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


name, seeds = sys.argv[1], [int(s) for s in sys.argv[2:]]
p = PIECES[name]
for seed in seeds:
    dst = os.path.join(RAW, f"{name}_{seed}.flac")
    if os.path.exists(dst):
        print("skip", dst)
        continue
    t0 = time.time()
    pid = post("/prompt", {"prompt": workflow(name, p, seed)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"):
            break
        if st.get("status_str") == "error":
            raise SystemExit(f"failed: {name} {seed}: {json.dumps(st, ensure_ascii=False)[:2000]}")
        time.sleep(2)
    out = h[pid]["outputs"]["35"]["audio"][0]
    shutil.copy(os.path.join(COMFY_OUT, out.get("subfolder", ""), out["filename"]), dst)
    print(f"ok {name} seed={seed} {time.time() - t0:.0f}s -> {dst}", flush=True)
