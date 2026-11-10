# 用本地 ComfyUI 的 Woosh（ComfyUI-Woosh 节点，Woosh-Flow 50 步）批量生成音效素材，保存到 sfx/raw/。
# 用法：python -I sfx/generate.py   （需要 ComfyUI 运行在 127.0.0.1:8188，且 models/woosh/ 已就位）
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cues import SOUNDS

HOST = "http://127.0.0.1:8188"
COMFY_OUT = r"G:\comfyui\ComfyUI\ComfyUI\output"
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)
MODEL = os.environ.get("WOOSH_MODEL", "Flow")  # Flow（50 步，质量最好）或 DFlow（4 步，快）


def workflow(name, s):
    flow = MODEL == "Flow"
    return {
        "1": {"class_type": "WooshLoadFlow", "inputs": {"model_name": "Woosh-Flow" if flow else "Woosh-DFlow", "model_type": MODEL}},
        "2": {"class_type": "WooshSample", "inputs": {
            "gen_model": ["1", 0], "prompt": s["prompt"], "steps": 50 if flow else 4, "cfg": 4.5 if flow else 3.5,
            "seed": s["seed"], "latent_frames": int(s["dur"] * 100) + 1, "subprocess": True, "force_offload": False}},
        "3": {"class_type": "SaveAudio", "inputs": {"audio": ["2", 1], "filename_prefix": f"audio/vibe11_{name}"}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


only = set(sys.argv[1:])
for name, s in SOUNDS.items():
    if only and name not in only:
        continue
    dst = os.path.join(RAW, f"{name}.flac")
    if os.path.exists(dst) and not only:
        print("skip", name)
        continue
    pid = post("/prompt", {"prompt": workflow(name, s)})["prompt_id"]
    t0 = time.time()
    while True:
        h = get(f"/history/{pid}")
        if pid in h and h[pid].get("status", {}).get("completed"):
            break
        if pid in h and h[pid].get("status", {}).get("status_str") == "error":
            raise SystemExit(f"failed: {name}: {json.dumps(h[pid].get('status'), ensure_ascii=False)[:800]}")
        time.sleep(0.5)
    out = h[pid]["outputs"]["3"]["audio"][0]
    shutil.copy(os.path.join(COMFY_OUT, out.get("subfolder", ""), out["filename"]), dst)
    print("ok", name, s["dur"], f"{time.time() - t0:.1f}s")
