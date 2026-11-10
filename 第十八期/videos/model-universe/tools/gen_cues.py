# 03-分镜脚本/_gen/timeline.json（旁白实测时间轴）→ assets/js/cues.js（机位/事件用）＋ assets/js/captions.js（字幕唯一来源）
# 旁白或时间轴一变：先在 _gen 里重跑 lines.py，再跑本脚本（python -I tools/gen_cues.py），代码里不手写任何秒数
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..')
G = os.path.join(P, '../../03-分镜脚本/_gen')
T = json.load(open(os.path.join(G, 'timeline.json'), encoding='utf-8'))
W = json.load(open(os.path.join(G, 'segwin.json'), encoding='utf-8'))
cues = [dict(i=i, seg=x['seg'], t0=x['start'], t1=x['end'], cap=x['cap_end'], text=x['text']) for i, x in enumerate(T, 1)]
seg = {k: [v[0], v[1]] for k, v in W.items()}
with open(os.path.join(P, 'assets/js/cues.js'), 'w', encoding='utf-8') as f:
    f.write('// 由 tools/gen_cues.py 从分镜时间轴生成，勿手改。C[n] = 第 n 句旁白（从 1 数）：t0 开口、t1 说完、cap 字幕收起\n')
    f.write('export const C = [null,\n' + ''.join('  ' + json.dumps({k: c[k] for k in ('seg', 't0', 't1', 'cap')}) + ',  // ' + str(c['i']) + ' ' + c['text'] + '\n' for c in cues) + '];\n')
    f.write('export const SEG = ' + json.dumps(seg) + ';\n')
with open(os.path.join(P, 'assets/js/captions.js'), 'w', encoding='utf-8') as f:
    f.write('// 字幕唯一来源（由 tools/gen_cues.py 生成，勿手改）：[开始, 结束, 正文, 标记]。noshow = 画面大字呈现，不进滚动字幕，只进 SRT\n')
    f.write('window.CAPTIONS = [\n')
    for x in T:
        tag = ', "noshow"' if x['tag'] == 'noshow' else ''
        f.write(f'  [{x["start"]}, {x["cap_end"]}, {json.dumps(x["text"], ensure_ascii=False)}{tag}],\n')
    f.write('];\n')
print('cues', len(cues), 'segments', list(seg))
