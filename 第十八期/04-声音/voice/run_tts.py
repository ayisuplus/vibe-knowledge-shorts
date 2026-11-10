# 提交 Breeze 试音工作流到本地 ComfyUI，等全部完成后把音频拷到项目目录
import json, sys, time, shutil, os, urllib.request
OUT = 'G:/comfyui/ComfyUI/ComfyUI/output/'
DEST = sys.argv[1]
names = sys.argv[2:]
os.makedirs(DEST, exist_ok=True)
def post(wf):
    req = urllib.request.Request('http://127.0.0.1:8188/prompt', data=json.dumps({'prompt': wf}).encode(), headers={'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read())['prompt_id']
ids = {n: post(json.load(open(n + '.json', encoding='utf-8'))) for n in names}
pending = dict(ids)
while pending:
    time.sleep(3)
    for n, pid in list(pending.items()):
        h = json.loads(urllib.request.urlopen(f'http://127.0.0.1:8188/history/{pid}').read())
        if pid not in h: continue
        st = h[pid].get('status', {})
        if st.get('status_str') == 'error':
            print('ERROR', n, json.dumps(st)[:800], flush=True); pending.pop(n); continue
        for node in h[pid].get('outputs', {}).values():
            for a in node.get('audio', []):
                src = os.path.join(OUT, a.get('subfolder', ''), a['filename'])
                shutil.copy(src, os.path.join(DEST, n + os.path.splitext(a['filename'])[1]))
                print('ok', n, a['filename'], flush=True)
        if st.get('completed'): pending.pop(n)
print('done')
