# 第二十四期 BGM：用本机 ComfyUI 的 MiniMax Music 3（本地 DiT 权重）生成候选，存到 raw/。
# 用法：python -I 第二十四期/04-声音/music/gen.py main 2401 2402 2403
#      （需要 ComfyUI 运行在 127.0.0.1:8188；参数：段名 + 若干 seed）
# 用户 2026-11-03：本期音乐音效全部 AI 新生成，不沿用往期（风格不一样）。
# 写法沿用第六期 audio/music/generate.py 的工作流（那一期已验证可用）。
import json, os, shutil, sys, time, urllib.parse, urllib.request

HOST = "http://127.0.0.1:8188"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)

TAGS = "\n\n".join(["[Intro]"] + ["[Instrumental]", "[Instrumental]", "[Solo]"] * 7 + ["[Instrumental]", "[Outro]"])
NO = ("No vocals at all, no humming, no choir, no lyrics. No heavy cinematic drums, no timpani booms, no braams, "
      "no EDM drops, no electronic dance beat, no dark or sad mood.")

PIECES = {
    # 0–122 秒全片一条。时间点对应 03-分镜脚本/分镜脚本.md 的段落窗口。
    "main": {
        "seconds": 128,
        "caption": f"""Global Metadata: Instrumental, playful and mischievous comedy underscore for a fast, funny business-explainer cartoon about money passing through toll booths. Strict steady 120 BPM in 4/4 the whole way, F major, straight eighth notes with a very clear beat on every quarter note. Emotional progression: cheeky and bouncy from the first beat, then curious and sneaky, then busy and bustling, then chaotic slapstick, one sudden stop, then confident and bright, finally climbing higher and higher and ending abruptly on the top note. Production: tight, dry and punchy small ensemble, wide stereo, clean mix, modern cartoon-commercial sound. {NO}

Vocal Details: Instrumental only. The lead is a catchy staccato four-note motif played by pizzicato strings and marimba, answered by a muted trumpet.

Arrangement:
Intro (0-12s): starts immediately on beat one, no fade-in: a catchy bouncing pizzicato and marimba four-note motif, plucked upright bass on every beat, woodblock ticks.
Section one (12-45s): sneaky, tip-toeing groove, clarinet staccato and bassoon answer the motif, light finger snaps, glockenspiel sparkles at phrase ends.
Section two (45-63s): busier and brighter, muted trumpet joins, the motif climbs, small cartoon accents (slide whistle up, xylophone run) at bar ends.
Section three (63-86s): comic chaos, everything gets faster-feeling and crowded (still 120 BPM), oom-pah tuba, honky brass stabs, playful drum fills on toms.
Break (86-88s): everything stops for exactly one bar, only a single pizzicato pluck.
Section four (88-112s): the groove comes back confident and bright, full ensemble, handclaps on 2 and 4, the motif in a higher octave.
Finale (112-122s): an ascending staircase of the motif, each bar one step higher, building excitement, then a hard stop on a single bright stab with no tail, then silence.""",
    },
}


def workflow(name, p, seed):
    return {
        "6": {"class_type": "UNETLoader", "inputs": {"unet_name": "minimax_music3_dit_fp32.safetensors", "weight_dtype": "default"}},
        "3": {"class_type": "CLIPLoader", "inputs": {"clip_name": "minimax_music3_text_encoder_bf16.safetensors", "type": "minimax", "device": "default"}},
        "7": {"class_type": "VAELoader", "inputs": {"vae_name": "minimax_music3_dav.safetensors"}},
        "13": {"class_type": "MiniMaxMusic3TextEncode", "inputs": {
            "clip": ["3", 0], "caption": p["caption"], "lyrics": TAGS, "seed": seed,
            "max_duration": float(p["seconds"]), "cfg_scale": 1.7, "top_k": 50}},
        "10": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["13", 0]}},
        "15": {"class_type": "EmptyMiniMaxMusic3LatentAudio", "inputs": {"seconds": ["13", 1], "batch_size": 1}},
        "9": {"class_type": "KSampler", "inputs": {
            "model": ["6", 0], "positive": ["13", 0], "negative": ["10", 0], "latent_image": ["15", 0],
            "seed": seed, "steps": 30, "cfg": 1.7, "sampler_name": "euler", "scheduler": "simple", "denoise": 1.0}},
        "12": {"class_type": "VAEDecodeAudio", "inputs": {"samples": ["9", 0], "vae": ["7", 0]}},
        "35": {"class_type": "SaveAudio", "inputs": {"audio": ["12", 0], "filename_prefix": f"audio/vibe24_{name}_{seed}"}},
    }


def post(path, data):
    req = urllib.request.Request(HOST + path, data=json.dumps(data).encode(), headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req).read())


def fetch(out, dst):
    """通过 ComfyUI 的 /view 接口取输出文件（桌面版与便携版的输出目录不同，不依赖具体路径）"""
    q = urllib.parse.urlencode({"filename": out["filename"], "subfolder": out.get("subfolder", ""), "type": out.get("type", "output")})
    with urllib.request.urlopen(f"{HOST}/view?{q}") as r, open(dst, "wb") as f:
        shutil.copyfileobj(r, f)


def get(path):
    return json.loads(urllib.request.urlopen(HOST + path).read())


name, seeds = sys.argv[1], [int(s) for s in sys.argv[2:]]
p = PIECES[name]
for seed in seeds:
    dst = os.path.join(RAW, f"{name}_{seed}.flac")
    if os.path.exists(dst):
        print("skip", dst); continue
    t0 = time.time()
    pid = post("/prompt", {"prompt": workflow(name, p, seed)})["prompt_id"]
    while True:
        h = get(f"/history/{pid}")
        st = h.get(pid, {}).get("status", {})
        if st.get("completed"): break
        if st.get("status_str") == "error":
            raise SystemExit(f"failed: {name} {seed}: {json.dumps(st, ensure_ascii=False)[:2000]}")
        time.sleep(2)
    out = h[pid]["outputs"]["35"]["audio"][0]
    fetch(out, dst)
    print(f"ok {name} seed={seed} {time.time() - t0:.0f}s -> {dst}", flush=True)
