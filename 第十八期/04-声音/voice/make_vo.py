# 逐句克隆旁白：参考音色 ref-v2.flac（v2 纪录片知性），文本来自 03-分镜脚本/_gen/timeline.json
# 输出 ../vo/NN.flac；每句固定 seed，便于重做单句
import json, sys, os, time, shutil, urllib.request
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(HERE, '../../03-分镜脚本/_gen/timeline.json'), encoding='utf-8'))
REF_TEXT = open(os.path.join(HERE, 'ref-v2.txt'), encoding='utf-8').read().strip()
OUT = 'G:/comfyui/ComfyUI/ComfyUI/output/'
# MODE=direction：用 Voice Direction（同一参考音色＋语气指令），输出到 ../vo-dir
MODE = os.environ.get('MODE', 'clone')
INSTR = '语速放慢，平静、温柔、知性，像纪录片旁白；每个词都说清楚，句中自然停顿，不要赶。'
DEST = os.path.join(HERE, '../vo' if MODE == 'clone' else '../vo-dir'); os.makedirs(DEST, exist_ok=True)
only = set(int(x) for x in sys.argv[1:])            # 可只重做指定句号，如 python make_vo.py 7 12
SEED0 = int(os.environ.get('SEED0', '1027'))
def post(wf):
    r = urllib.request.Request('http://127.0.0.1:8188/prompt', data=json.dumps({'prompt': wf}).encode(), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(r).read())['prompt_id']
ids = {}
for i, x in enumerate(T, 1):
    if only and i not in only: continue
    wf = {
     "1": {"class_type": "BreezeTTS2LoadModel", "inputs": {"model": "bf16 (best quality)", "dtype": "auto", "device": "auto", "attention": "auto", "decode_mode": "eager", "download_if_missing": False}},
     "2": {"class_type": "LoadAudio", "inputs": {"audio": "ep18/ref-v2.flac"}},
     "3": ({"class_type": "BreezeTTS2VoiceClone", "inputs": {"breeze_model": ["1", 0], "text": x['text'], "reference_audio": ["2", 0], "reference_text": REF_TEXT,
           "cfg_scale": 1.0, "max_new_tokens": 1200, "temperature": 0.7, "top_k": 50, "top_p": 1.0, "repetition_penalty": 1.1,
           "depth_temperature": 0.7, "depth_top_k": 50, "depth_top_p": 1.0, "seed": SEED0 + i}} if MODE == 'clone' else
          {"class_type": "BreezeTTS2VoiceDirection", "inputs": {"breeze_model": ["1", 0], "text": x['text'], "reference_audio": ["2", 0], "reference_text": REF_TEXT,
           "instruction": INSTR, "cfg_scale": 4.0, "stitch_reference": "none", "max_new_tokens": 1200, "temperature": 0.7, "top_k": 50, "top_p": 1.0,
           "repetition_penalty": 1.1, "depth_temperature": 0.7, "depth_top_k": 50, "depth_top_p": 1.0, "seed": SEED0 + i}}),
     "4": {"class_type": "SaveAudio", "inputs": {"audio": ["3", 0], "filename_prefix": f"ep18-vo-{MODE}/{i:02d}"}}}
    ids[i] = post(wf)
print('submitted', len(ids), flush=True)
pending = dict(ids)
while pending:
    time.sleep(3)
    for i, pid in list(pending.items()):
        h = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8188/history/{pid}').read()).get(pid)
        if not h: continue
        st = h.get('status', {})
        if st.get('status_str') == 'error':
            print('ERROR', i, json.dumps(st.get('messages', [])[-1:], ensure_ascii=False)[:500], flush=True); pending.pop(i); continue
        if st.get('completed'):
            for node in h['outputs'].values():
                for a in node.get('audio', []):
                    shutil.copy(os.path.join(OUT, a.get('subfolder', ''), a['filename']), os.path.join(DEST, f'{i:02d}.flac'))
            print('ok', i, flush=True); pending.pop(i)
print('done')
