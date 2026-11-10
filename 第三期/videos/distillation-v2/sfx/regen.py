# 对质量不合格的音效换种子重生成，按"对比度高 + 峰值靠前"挑最好的一条，覆盖 sfx/raw/<name>.flac。
# 用法：python -I sfx/regen.py clink quill chime ...（每个最多试 TRIES 个种子）
import json, os, shutil, subprocess, sys, time, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from cues import SOUNDS

HOST = "http://127.0.0.1:8188"
COMFY_OUT = r"G:\comfyui\ComfyUI\ComfyUI\output"
RAW = os.path.join(HERE, "raw")
TRIES = 5
SR = 48000


def run(name, s, seed, dur):
    wf = {
        "1": {"class_type": "WooshLoadFlow", "inputs": {"model_name": "Woosh-Flow", "model_type": "Flow"}},
        "2": {"class_type": "WooshSample", "inputs": {"gen_model": ["1", 0], "prompt": s["prompt"], "steps": 50, "cfg": 4.5, "seed": seed,
                                                       "latent_frames": int(dur * 100) + 1, "subprocess": True, "force_offload": False}},
        "3": {"class_type": "SaveAudio", "inputs": {"audio": ["2", 1], "filename_prefix": f"audio/vibe3v2_{name}_try"}},
    }
    req = urllib.request.Request(HOST + "/prompt", data=json.dumps({"prompt": wf}).encode(), headers={"Content-Type": "application/json"})
    pid = json.loads(urllib.request.urlopen(req).read())["prompt_id"]
    while True:
        h = json.loads(urllib.request.urlopen(f"{HOST}/history/{pid}").read())
        if pid in h and h[pid].get("status", {}).get("completed"):
            break
        time.sleep(0.5)
    out = h[pid]["outputs"]["3"]["audio"][0]
    return os.path.join(COMFY_OUT, out.get("subfolder", ""), out["filename"])


def score(path):
    x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
    w = int(0.05 * SR)
    p = np.sqrt(np.convolve(x ** 2, np.ones(w) / w, "valid")) + 1e-9
    db = 20 * np.log10(p)
    contrast = db.max() - np.percentile(db, 10)
    pos = np.argmax(p) / len(p)
    return contrast - max(0, pos - 0.55) * 60, contrast, pos  # 峰值太靠后要扣分（尾巴会被截掉）


for name in sys.argv[1:]:
    s = SOUNDS[name]
    dur = s["dur"] + 1.0  # 多留一秒，给尾音
    best = None
    for k in range(TRIES):
        seed = s["seed"] + 1000 * (k + 1)
        path = run(name, s, seed, dur)
        sc, c, pos = score(path)
        print(f"{name} seed {seed}: contrast {c:.1f} peakPos {pos:.2f} score {sc:.1f}")
        if best is None or sc > best[0]:
            best = (sc, path, seed)
        if c > 30 and pos < 0.55:
            break
    shutil.copy(best[1], os.path.join(RAW, f"{name}.flac"))
    print(f"-> {name}: kept seed {best[2]} (score {best[0]:.1f})")
