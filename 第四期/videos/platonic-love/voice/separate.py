# 把参考录音里的人声和背景音乐分开（MelBandRoFormer，ComfyUI 本地）。
# 用法：python -I voice/separate.py <源音频>   → voice/ref_vocals.flac、voice/ref_mix.wav
import json, os, shutil, subprocess, sys, time, urllib.request

HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
HERE = os.path.dirname(os.path.abspath(__file__))


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


src = sys.argv[1]
mix = os.path.join(HERE, "ref_mix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ar", "44100", "-ac", "2", mix], check=True)
shutil.copy(mix, os.path.join(COMFY, "input", "vibe4_ref_mix.wav"))
wf = {
    "1": {"class_type": "LoadAudio", "inputs": {"audio": "vibe4_ref_mix.wav"}},
    "2": {"class_type": "MelBandRoFormerModelLoader", "inputs": {"model_name": "MelBandRoformer_fp32.safetensors"}},
    "3": {"class_type": "MelBandRoFormerSampler", "inputs": {"model": ["2", 0], "audio": ["1", 0]}},
    "4": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 0], "filename_prefix": "audio/vibe4_ref_vocals"}},
    "5": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 1], "filename_prefix": "audio/vibe4_ref_inst"}},
}
pid = post("/prompt", {"prompt": wf})["prompt_id"]
while True:
    h = get(f"/history/{pid}")
    st = h.get(pid, {}).get("status", {})
    if st.get("completed"):
        break
    if st.get("status_str") == "error":
        raise SystemExit(f"failed: {json.dumps(st, ensure_ascii=False)[:1500]}")
    time.sleep(1)
for node, name in (("4", "ref_vocals.flac"), ("5", "ref_inst.flac")):
    out = h[pid]["outputs"][node]["audio"][0]
    shutil.copy(os.path.join(COMFY, "output", out.get("subfolder", ""), out["filename"]), os.path.join(HERE, name))
print("ok")
