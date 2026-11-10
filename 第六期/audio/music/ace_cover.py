# 把 internationale.py 合成的乐器草稿（mockup.wav）交给 ACE-Step 1.5 XL SFT 重绘成真实的管弦乐。
# 做法：草稿经 ACE VAE 编码成 latent，KSampler 用 denoise<1 在它上面重画，旋律和结构跟着草稿走。
# 用法：python -I ace_cover.py <denoise> <seed> [<seed> ...]   -> raw/C_intl_d<denoise>_<seed>.flac
import json, os, shutil, sys, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = "http://127.0.0.1:8188"
COMFY = r"G:\comfyui\ComfyUI\ComfyUI"
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)

TAGS = ("Epic solemn orchestral anthem, full symphony orchestra in a concert hall. Noble French horns and trumpets carry the "
        "melody in unison, warm string section with rich harmony, deep cellos and double basses, rolling timpani, crash cymbals "
        "at the climax. Starts with a solo horn, grows into a grand, triumphant, ceremonial tutti, ends on a long sustained "
        "major chord. Instrumental, no vocals, no choir, no electronic sounds, no drum kit.")


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


def workflow(denoise, seed, src_name, duration, bpm, codes):
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "acestep_v1.5_xl_sft_bf16.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "DualCLIPLoader", "inputs": {"clip_name1": "qwen_0.6b_ace15.safetensors", "clip_name2": "qwen_4b_ace15.safetensors", "type": "ace", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "ace_1.5_vae.safetensors"}},
        "4": {"class_type": "ModelSamplingAuraFlow", "inputs": {"model": ["1", 0], "shift": 3}},
        "5": {"class_type": "LoadAudio", "inputs": {"audio": src_name}},
        "6": {"class_type": "VAEEncodeAudio", "inputs": {"audio": ["5", 0], "vae": ["3", 0]}},
        "7": {"class_type": "TextEncodeAceStepAudio1.5", "inputs": {
            "clip": ["2", 0], "tags": TAGS, "lyrics": "[Instrumental]", "seed": seed, "bpm": int(round(bpm)),
            "duration": duration, "timesignature": "4", "language": "en", "keyscale": "Bb major",
            "generate_audio_codes": codes, "cfg_scale": 2.0, "temperature": 0.85, "top_p": 0.9, "top_k": 0, "min_p": 0.0}},
        "8": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["7", 0]}},
        **({"12": {"class_type": "LoadAudio", "inputs": {"audio": "vibe6_timbre.wav"}},
            "13": {"class_type": "VAEEncodeAudio", "inputs": {"audio": ["12", 0], "vae": ["3", 0]}},
            "14": {"class_type": "ReferenceTimbreAudio", "inputs": {"conditioning": ["7", 0], "latent": ["13", 0]}}} if REF else {}),
        "9": {"class_type": "KSampler", "inputs": {
            "model": ["4", 0], "positive": ["14", 0] if REF else ["7", 0], "negative": ["8", 0], "latent_image": ["6", 0],
            "seed": seed, "steps": 50, "cfg": 7.0, "sampler_name": "euler", "scheduler": "simple", "denoise": denoise}},
        "10": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["9", 0], "vae": ["3", 0]}},
        "11": {"class_type": "SaveAudio", "inputs": {"audio": ["10", 0], "filename_prefix": f"audio/vibe6_C_{denoise}_{seed}"}},
    }


denoise = float(sys.argv[1])
seeds = [int(s) for s in sys.argv[2:]]
codes = os.environ.get("ACE_CODES", "0") == "1"
# ACE_REF=raw/A_rise_601.flac@60:80 —— 用一段真实管弦乐当音色参考
REF = os.environ.get("ACE_REF", "")
if REF:
    import soundfile as sf
    rp, rng = REF.split("@")
    a, b = (float(x) for x in rng.split(":"))
    y, sr = sf.read(os.path.join(HERE, rp))
    sf.write(os.path.join(COMFY, "input", "vibe6_timbre.wav"), y[int(a * sr):int(b * sr)], sr)
meta = json.load(open(os.path.join(HERE, "mockup_notes.json")))
src_name = "vibe6_mockup.wav"
# ACE_SRC=raw/xxx.flac —— 拿上一轮的结果再重绘一遍（二次精修）
SRC = os.environ.get("ACE_SRC", "")
if SRC:
    import soundfile as sf
    y, sr = sf.read(os.path.join(HERE, SRC))
    sf.write(os.path.join(COMFY, "input", src_name), y, sr)
else:
    shutil.copy(os.path.join(HERE, "mockup.wav"), os.path.join(COMFY, "input", src_name))
for seed in seeds:
    tag = f"C_intl_d{denoise:.2f}{'_codes' if codes else ''}{'_ref' if REF else ''}{'_x2' if SRC else ''}_{seed}"
    dst = os.path.join(RAW, tag + ".flac")
    if os.path.exists(dst):
        print("skip", dst)
        continue
    t0 = time.time()
    pid = post("/prompt", {"prompt": workflow(denoise, seed, src_name, round(meta["duration"], 1), meta["bpm"], codes)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"):
            break
        if st.get("status_str") == "error":
            raise SystemExit(f"failed {tag}: {json.dumps(st, ensure_ascii=False)[:2500]}")
        time.sleep(2)
    out = h[pid]["outputs"]["11"]["audio"][0]
    shutil.copy(os.path.join(COMFY, "output", out.get("subfolder", ""), out["filename"]), dst)
    print(f"ok {tag} {time.time() - t0:.0f}s -> {dst}", flush=True)
