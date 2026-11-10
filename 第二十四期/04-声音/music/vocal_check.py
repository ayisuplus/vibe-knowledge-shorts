# 检查候选配乐里有没有混进人声：MelBandRoFormer 拆出人声轨，比较人声轨与原曲的能量。
# 用法：python -I 第二十四期/04-声音/music/vocal_check.py raw/main_2401.flac ...
import json, os, shutil, sys, time, urllib.parse, urllib.request
import numpy as np, soundfile as sf

HOST = "http://127.0.0.1:8188"
COMFY_IN = r"D:\Comfy-Desktop\ComfyUI-Shared\input"   # 桌面版 ComfyUI 的输入目录（2026-11-03 起）
HERE = os.path.dirname(os.path.abspath(__file__))
STEMS = os.path.join(HERE, "stems")
os.makedirs(STEMS, exist_ok=True)


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def db(x):
    return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)


for rel in sys.argv[1:]:
    src = os.path.join(HERE, rel)
    base = os.path.splitext(os.path.basename(src))[0]
    vox = os.path.join(STEMS, f"{base}_vocals.flac")
    if not os.path.exists(vox):
        shutil.copy(src, os.path.join(COMFY_IN, f"vibe24_{base}.flac"))
        wf = {
            "1": {"class_type": "LoadAudio", "inputs": {"audio": f"vibe24_{base}.flac"}},
            "2": {"class_type": "MelBandRoFormerModelLoader", "inputs": {"model_name": "MelBandRoformer_fp32.safetensors"}},
            "3": {"class_type": "MelBandRoFormerSampler", "inputs": {"model": ["2", 0], "audio": ["1", 0]}},
            "4": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 0], "filename_prefix": f"audio/vibe24_vox_{base}"}},
        }
        pid = post("/prompt", {"prompt": wf})["prompt_id"]
        while True:
            h = get(f"/history/{pid}")
            st = h.get(pid, {}).get("status", {})
            if st.get("completed"):
                break
            if st.get("status_str") == "error":
                raise SystemExit(f"failed {base}: {json.dumps(st)[:1500]}")
            time.sleep(1)
        out = h[pid]["outputs"]["4"]["audio"][0]
        q = urllib.parse.urlencode({"filename": out["filename"], "subfolder": out.get("subfolder", ""), "type": "output"})
        with urllib.request.urlopen(f"{HOST}/view?{q}") as r, open(vox, "wb") as f: shutil.copyfileobj(r, f)
    y, sr = sf.read(src)
    v, _ = sf.read(vox)
    y = y.mean(axis=1) if y.ndim > 1 else y
    v = v.mean(axis=1) if v.ndim > 1 else v
    n = min(len(y), len(v))
    win = int(5 * sr)
    rel_db = [db(v[i:i + win]) - db(y[i:i + win]) for i in range(0, n - win, win)]
    worst = max(rel_db)
    print(f"{base}: vocal stem vs mix {db(v[:n]) - db(y[:n]):.1f} dB overall, worst 5s window {worst:.1f} dB at {rel_db.index(worst) * 5}s", flush=True)
