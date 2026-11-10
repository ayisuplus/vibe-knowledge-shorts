# 用 VoxCPM2 克隆参考音色，生成开场旁白（ComfyUI 本地）。每句多个种子，存到 voice/raw/<句子>_<种子>.flac。
# 用法：python -I voice/tts.py [句子id ...]
import json, os, shutil, sys, time, urllib.request

HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, os.environ.get("VO_RAW", "raw"))
os.makedirs(RAW, exist_ok=True)

STYLES = {
    "raw": "年轻女声，语气平静自然、略带笑意，像在讲一个有趣的冷知识，语速适中",
    # v2：用户觉得原声太甜糯，科普要更沉稳
    "raw2": "声音偏低、沉稳知性，语气平实干净、不撒娇不甜腻，像纪录片解说，语速适中",
}
STYLE = STYLES[os.environ.get("VO_RAW", "raw")]
LINES = {
    "L1": "人人都在说柏拉图式恋爱。",
    "L2": "但这个词，柏拉图一次都没说过。",
    "L3": "就连另一半的说法，",
    "L4": "在他的书里，也被当场推翻了。",
}
SEEDS = [11, 22, 33]


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def wf(text, seed, tag):
    return {
        "1": {"class_type": "LoadAudio", "inputs": {"audio": "vibe4_ref_12s.wav"}},
        "2": {"class_type": "VoxCPM_VoiceCloning", "inputs": {"trim_silence": True, "reference_audio": ["1", 0]}},
        "3": {"class_type": "VoxCPM_TTS", "inputs": {"model_name": "VoxCPM2", "lora_name": "None", "text": text, "voice_design": STYLE,
              "cfg": 2.0, "steps": 20, "normalize_text": False, "seed": seed, "force_offload": False, "device": "cuda", "dtype": "auto", "voice_config": ["2", 0]}},
        "4": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 0], "filename_prefix": f"audio/vibe4_{tag}"}},
    }


only = set(sys.argv[1:])
for lid, text in LINES.items():
    if only and lid not in only:
        continue
    for seed in SEEDS:
        tag = f"{lid}_{seed}"
        pid = post("/prompt", {"prompt": wf(text, seed, tag)})["prompt_id"]
        t0 = time.time()
        while True:
            h = get(f"/history/{pid}")
            st = h.get(pid, {}).get("status", {})
            if st.get("completed"):
                break
            if st.get("status_str") == "error":
                raise SystemExit(f"failed {tag}: {json.dumps(st, ensure_ascii=False)[:1500]}")
            time.sleep(0.5)
        out = h[pid]["outputs"]["4"]["audio"][0]
        shutil.copy(os.path.join(COMFY, "output", out.get("subfolder", ""), out["filename"]), os.path.join(RAW, f"{tag}.flac"))
        print("ok", tag, f"{time.time() - t0:.1f}s", flush=True)
