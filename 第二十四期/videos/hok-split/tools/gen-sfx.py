# 本期拟音：用本机 ComfyUI 的 Woosh 新生成卡通向音效（用户 2026-11-03：音乐音效全部 AI 新做，不沿用往期）。
# 每种 3 个种子，存到 assets/audio/sfx-src/gen/（不入库）。写法沿用第二十三期 tools/gen-sfx.py。
# 短促的声音也给够 2 秒：时长太短时 Woosh 常把落点压到结尾。
# 用法（ComfyUI 运行在 127.0.0.1:8188）：python -I tools/gen-sfx.py [名字…]
import json, os, shutil, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
HOST = "http://127.0.0.1:8188"
RAW = os.path.join(HERE, "..", "assets", "audio", "sfx-src", "gen")
os.makedirs(RAW, exist_ok=True)

SOUNDS = {
    "chomp": ("a cartoon monster mouth chomping down hard on a coin, quick crunchy bite, comedic", 2.0),
    "slice": ("a cartoon cleaver chopping a coin in half, quick swish then a sharp chop, comedic", 2.0),
    "coin": ("a single bright coin clink, metallic ding, close up", 2.0),
    "boing": ("a cartoon spring boing, bouncy comedic sound effect", 2.0),
    "pop": ("a short cartoon pop, like a bubble or cork popping, bright and clean", 2.0),
    "whoosh": ("a quick clean whoosh swish passing by, cartoon style, short", 2.0),
    "wallslam": ("a heavy brick wall slamming down onto the ground, deep thud with a little dust", 2.0),
    "smash": ("an axe smashing through a brick wall, bricks crumbling and scattering", 2.0),
    "stamp": ("a rubber stamp thumped hard onto paper on a desk, solid thump", 2.0),
    "typing": ("fast typing on an old mechanical typewriter, crisp key clicks", 2.0),
    "pages": ("a thick book's pages flipping quickly, paper flutter", 2.0),
    "bookslam": ("a heavy hardcover book dropped flat on a wooden table, loud thud", 2.0),
    "barrier": ("a toll gate barrier arm dropping down and clacking shut, mechanical clack", 2.0),
    "honk": ("a small cartoon delivery truck horn, two short beeps, comedic", 2.0),
    "highfive": ("two hands doing a loud high five slap clap", 2.0),
    "kaching": ("a cash register ka-ching with a bell ring", 2.0),
    "jingle": ("many coins jingling and clattering while running, busy and comedic", 2.5),
    "clock": ("a clock ticking very fast, spinning clock hands, ticks speeding up", 2.5),
    "buzzer": ("a short cartoon wrong-answer buzzer, quick and comedic", 2.0),
    "marker": ("a felt marker pen squeaking as it draws a circle on paper", 2.0),
    "highlight": ("a highlighter pen swiping across paper, quick smooth stroke", 2.0),
    "door": ("a small wooden door clicking open with a short creak", 2.0),
    "whistle": ("a slide whistle going up, comedic cartoon", 2.0),
    "ding": ("a bright little bell ding, clean and short", 2.0),
    "block": ("a big plastic construction block snapping into place, chunky thunk", 2.0),
    "poweron": ("a big array of stadium lights switching on one after another, heavy electrical clunks and a rising hum", 2.5),
    "flip": ("a mechanical split-flap counter flipping digits, rapid clicking", 2.0),
    "sadhorn": ("a short comedic sad trombone wah wah wah", 2.5),
    "squeak": ("a cartoon rubber squeak toy squeeze, short", 2.0),
    "crumble": ("small bricks and rubble tumbling and falling to the ground", 2.0),
}
SEEDS = (24101, 24102, 24103)


def workflow(tag, prompt, dur, seed):
    return {
        "1": {"class_type": "WooshLoadFlow", "inputs": {"model_name": "Woosh-Flow", "model_type": "Flow"}},
        "2": {"class_type": "WooshSample", "inputs": {"gen_model": ["1", 0], "prompt": prompt, "steps": 50, "cfg": 4.5, "seed": seed, "latent_frames": int(dur * 100) + 1, "subprocess": True, "force_offload": False}},
        "3": {"class_type": "SaveAudio", "inputs": {"audio": ["2", 1], "filename_prefix": f"audio/vibe24_{tag}"}},
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
        fetch(out, dst)
        print("ok", tag, f"{time.time() - t0:.1f}s", flush=True)
