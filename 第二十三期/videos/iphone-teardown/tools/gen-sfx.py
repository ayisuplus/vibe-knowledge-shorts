# 用本地 ComfyUI 的 Woosh 生成现有音效库缺的小尺度拆机声，每种 3 个种子，存到 assets/audio/sfx-src/gen/。
# 短促的声音也要给够 2 秒：时长太短时 Woosh 常把落点压到结尾，声音被截断。
# 用法（ComfyUI 运行在 127.0.0.1:8188）：python -I tools/gen-sfx.py [名字…]
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = "http://127.0.0.1:8188"
COMFY_OUT = r"G:\comfyui\ComfyUI\ComfyUI\output"
RAW = os.path.join(HERE, "..", "assets", "audio", "sfx-src", "gen")
os.makedirs(RAW, exist_ok=True)

SOUNDS = {
    "unscrew": ("a tiny phillips screw being unscrewed with a precision screwdriver, close up, fine metallic ticks", 1.0),
    "screwdrop": ("a tiny metal screw dropped onto a steel tray, small bright metallic tink and bounce", 2.0),
    "pry": ("a plastic pry tool snapping open a smartphone clip, sharp crisp crack, close up", 2.0),
    "peel": ("strong adhesive tape peeling off glass, sticky tearing sound, close up", 1.4),
    "connector": ("a tiny ribbon cable connector popping off a circuit board, small crisp click", 2.0),
    "hatch": ("a precision metal hatch unlatching and lifting open, smooth solid mechanical clunk", 1.0),
    "slide": ("a small metal tray sliding along a rail, smooth metal on metal glide ending in a click", 1.2),
    "iris": ("a camera lens aperture diaphragm closing, tiny metal blades sliding, precise mechanical click", 0.6),
    "blades": ("thin metal leaves fanning apart, delicate metallic sliding, close up", 1.2),
    "lens": ("a small glass lens element set down on a metal surface, tiny clear glass tick", 2.0),
    "motor": ("a small linear vibration motor buzzing inside a phone, tight electric rumble", 2.5),
    "latch": ("a precision metal part snapping into its socket, solid crisp mechanical click", 2.0),
    "lockdown": ("a heavy machined steel part locking into place, deep solid mechanical clunk", 0.9),
    "servo": ("a small precision servo motor moving, short clean electric whirr", 1.2),
    "shield": ("a thin metal shield can popped off a circuit board, tinny flexing click", 0.7),
    "foil": ("crinkling thin aluminum foil, crisp high metallic crackle, close up", 1.5),
}
SEEDS = (23101, 23102, 23103)


def workflow(tag, prompt, dur, seed):
    return {
        "1": {"class_type": "WooshLoadFlow", "inputs": {"model_name": "Woosh-Flow", "model_type": "Flow"}},
        "2": {"class_type": "WooshSample", "inputs": {"gen_model": ["1", 0], "prompt": prompt, "steps": 50, "cfg": 4.5, "seed": seed, "latent_frames": int(dur * 100) + 1, "subprocess": True, "force_offload": False}},
        "3": {"class_type": "SaveAudio", "inputs": {"audio": ["2", 1], "filename_prefix": f"audio/vibe23_{tag}"}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


only = set(sys.argv[1:])
for name, (prompt, dur) in SOUNDS.items():
    if only and name not in only:
        continue
    for i, seed in enumerate(SEEDS):
        tag = f"{name}_{i + 1}"
        dst = os.path.join(RAW, f"{tag}.flac")
        if os.path.exists(dst):
            continue
        pid = post("/prompt", {"prompt": workflow(tag, prompt, dur, seed)})["prompt_id"]
        t0 = time.time()
        while True:
            h = get(f"/history/{pid}")
            if pid in h and h[pid].get("status", {}).get("completed"):
                break
            if pid in h and h[pid].get("status", {}).get("status_str") == "error":
                raise SystemExit(f"failed: {tag}: {json.dumps(h[pid].get('status'), ensure_ascii=False)[:800]}")
            time.sleep(0.5)
        out = h[pid]["outputs"]["3"]["audio"][0]
        shutil.copy(os.path.join(COMFY_OUT, out.get("subfolder", ""), out["filename"]), dst)
        print("ok", tag, f"{time.time() - t0:.1f}s", flush=True)
