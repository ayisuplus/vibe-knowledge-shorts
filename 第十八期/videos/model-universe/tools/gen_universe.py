# 01-调研/universe.json（调研档案的机器可读版）→ assets/js/universe-data.js
# 名单一改：先在 01-调研/_gen 重新生成 universe.json，再跑本脚本
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..')
U = json.load(open(os.path.join(P, '../../01-调研/universe.json'), encoding='utf-8'))
def year(d):
    y, m = int(d[:4]), int(d[5:7]); dd = int(d[8:10]) if len(d) >= 10 else 15
    return round(y + (m - 1) / 12 + (dd - 1) / 365, 3)
planets = [dict(id=p['id'], name=p['name'], fam=p['family'], y=year(p['date']), open=p['open'], tier=p['tier']) for p in U['planets']]
threads = [[t['from'], t['to'], t['type']] for t in U['threads'] if t['to'] != 'others']
# 星尘：HF 前 10 仓库第一层衍生数（口径见调研档案 D 表）→ 归到星云
NEB = {'Qwen': 'qwen', 'Llama': 'meta', 'Gemma': 'google', 'Mistral': 'mistral', 'DeepSeek': 'deepseek', 'Phi': 'phi', 'GLM': 'zhipu',
       'Kimi': 'kimi', 'gpt-oss': 'openai', 'GPT-2': 'openai', 'BERT': 'sesame', 'Hunyuan': 'tencent', 'ERNIE': 'baidu', 'MiniMax': 'minimax',
       'Seed': 'bytedance', 'Yi': 'others', 'Falcon': 'others', 'BLOOM': 'others', 'Grok': 'xai', 'OLMo': 'others'}
dust = {}
for k, v in U['nebula_density'].items():
    f = NEB[k]; dust[f] = dust.get(f, 0) + v['total']
with open(os.path.join(P, 'assets/js/universe-data.js'), 'w', encoding='utf-8') as f:
    f.write('// 由 tools/gen_universe.py 从 01-调研/universe.json 生成，勿手改。快照 ' + U['snapshot'] + '\n')
    f.write('export const PLANETS = ' + json.dumps(planets, ensure_ascii=False) + ';\n')
    f.write('export const THREADS = ' + json.dumps(threads, ensure_ascii=False) + ';\n')
    f.write('// 星尘：Hugging Face 前 10 个官方仓库的第一层衍生数之和（闭源主线为 0）\n')
    f.write('export const DUST = ' + json.dumps(dust) + ';\n')
print(len(planets), 'planets', len(threads), 'threads', dust)
