# 第十一期 v14 开场「全息手打响指」（从 hand-video/generate.py 改来）：本地 ComfyUI 的 MiniMax H3（首尾帧模型 fl2va + 8 步 Turbo LoRA）生成候选。
# 用法：python -I generate.py <模式 i2v|fl2v> <种子...>
#   i2v ：只给首帧（握着的手），动作全靠提示词
#   fl2v：首帧 + 尾帧（张开的手 + 掌心光点），中间的张开动作由模型补
# 首尾帧来自 ../hand1（Codex 生成）。输出到 ./raw/<模式>_<种子>.mp4
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
IN_DIR = os.path.join(COMFY, "input", "vibe11")
RAW = os.path.join(HERE, "raw")
os.makedirs(IN_DIR, exist_ok=True); os.makedirs(RAW, exist_ok=True)
W, H, LEN = 1376, 768, 141  # 16:9 约 1MP；141 帧 ≈ 5.9 秒（17k+5）

PROMPT = """subject_definitions:
<Subject 1> is the glowing cyan holographic hand made of wireframe lines and data points in the first frame.

summary:
[image to video] A 6-second single locked-off shot in a pure black void. The holographic hand holds the finger-snap pose, then snaps its fingers once, sharply and quickly: the middle finger slips off the thumb and strikes the palm. At the moment of the snap, a bright burst of cyan-white light particles and a thin shockwave ring explode from the point where the fingers met. Afterwards the hand relaxes slightly while glowing particles drift and swirl. Futuristic, magical, powerful.

retention_analysis:
Keep the exact same holographic hand, wireframe mesh, data points, cyan glow, framing and pure black background from the first frame. The camera does not move. The hand stays in place; only the fingers move.

detailed_description:
[Shot 1] 0-2s: the hand holds still in the snap-ready pose, thumb pressed against the middle fingertip; its data points flicker and tiny scanlines shimmer. 2-2.6s: one fast crisp finger snap, natural anatomy with exactly five fingers, no extra fingers, no morphing; the middle finger snaps down onto the palm and the thumb springs up. 2.4-3.5s: a bright burst of light particles and an expanding glowing ring at the snap point, the whole hologram flares brighter. 3.5-6s: the hand relaxes, particles drift upward and fade, the background stays pure black. No text, no other objects."""


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def workflow(mode, seed):
    wf = {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_h3_fl2va_pruned_fp8_scaled.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "LoraLoaderModelOnly", "inputs": {"model": ["1", 0], "lora_name": "minimax_h3_fl2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors", "strength_model": 1.0}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_32b_minimax_h3_int8_convrot.safetensors", "type": "minimax", "device": "default"}},
        "4": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_h3_video_vae_fp16.safetensors"}},
        "5": {"class_type": "LoadImage", "inputs": {"image": "vibe11/holo-pre.png"}},
        "6": {"class_type": "ImageScale", "inputs": {"image": ["5", 0], "upscale_method": "lanczos", "width": W, "height": H, "crop": "center"}},
        "9": {"class_type": "MiniMaxH3ImageToVideo", "inputs": {"clip": ["3", 0], "vae": ["4", 0], "prompt": PROMPT, "width": W, "height": H, "length": LEN, "first_frame": ["6", 0]}},
        "10": {"class_type": "RandomNoise", "inputs": {"noise_seed": seed}},
        "11": {"class_type": "KSamplerSelect", "inputs": {"sampler_name": "res_multistep"}},
        "12": {"class_type": "BasicScheduler", "inputs": {"model": ["1", 0], "scheduler": "simple", "steps": 8, "denoise": 1.0}},
        "13": {"class_type": "BasicGuider", "inputs": {"model": ["2", 0], "conditioning": ["9", 0]}},
        "14": {"class_type": "SamplerCustomAdvanced", "inputs": {"noise": ["10", 0], "guider": ["13", 0], "sampler": ["11", 0], "sigmas": ["12", 0], "latent_image": ["9", 1]}},
        "15": {"class_type": "VAEDecode", "inputs": {"samples": ["14", 0], "vae": ["4", 0]}},
        "16": {"class_type": "CreateVideo", "inputs": {"images": ["15", 0], "fps": 24.0}},
        "17": {"class_type": "SaveVideo", "inputs": {"video": ["16", 0], "filename_prefix": f"vibe11/holo_{mode}_{seed}", "format": "mp4", "codec": "h264"}},
    }
    if mode == "fl2v":
        wf["7"] = {"class_type": "LoadImage", "inputs": {"image": "vibe11/holo-post.png"}}
        wf["8"] = {"class_type": "ImageScale", "inputs": {"image": ["7", 0], "upscale_method": "lanczos", "width": W, "height": H, "crop": "center"}}
        wf["9"]["inputs"]["last_frame"] = ["8", 0]
    return wf


mode, seeds = sys.argv[1], [int(s) for s in sys.argv[2:]]
for f in ("holo-pre.png", "holo-post.png"):
    shutil.copy(os.path.join(HERE, f), os.path.join(IN_DIR, f))
for seed in seeds:
    dst = os.path.join(RAW, f"{mode}_{seed}.mp4")
    if os.path.exists(dst):
        print("skip", dst); continue
    t0 = time.time()
    pid = post("/prompt", {"prompt": workflow(mode, seed)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"): break
        if st.get("status_str") == "error":
            raise SystemExit(f"failed {mode} {seed}: {json.dumps(st, ensure_ascii=False)[:3000]}")
        time.sleep(3)
    outs = h[pid]["outputs"]["17"]
    item = (outs.get("images") or outs.get("videos") or outs.get("gifs") or [None])[0]
    src = os.path.join(COMFY, "output", item.get("subfolder", ""), item["filename"])
    shutil.copy(src, dst)
    print(f"ok {mode} {seed} {time.time() - t0:.0f}s", flush=True)
