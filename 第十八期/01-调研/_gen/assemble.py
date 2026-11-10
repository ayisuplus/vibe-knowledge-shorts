# head + 表格 + D 表 + tail + 来源 → ../宇宙名单.md；同时把 D 表写进 ../universe.json
# 改名单：编辑 roster.py / head.md / tail.md，然后在本目录运行
#   python -I roster.py ../universe.json tables.md && python -I assemble.py
# 重抓 HF 衍生数：python -I hfcount2.py 10（单线程慢速，会写 hf_counts.json）
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
import os
S = os.path.dirname(os.path.abspath(__file__)) + '/'
OUT = S + '../'
sys.path.insert(0, S)
from roster import SRC

hf = json.load(open(S + 'hf_counts.json', encoding='utf-8'))
NEB = {'Qwen':'千问星云','Llama':'Llama 星云','Gemma':'Gemini 星云（Gemma 支）','Mistral':'Mistral 星云','DeepSeek':'DeepSeek 星云',
       'Phi':'Phi 星群','GLM':'GLM 星云','Kimi':'Kimi 星云','gpt-oss':'GPT 星云（gpt-oss 支）','GPT-2':'GPT 星云（GPT-2 支）',
       'BERT':'芝麻街星团（BERT）','Hunyuan':'混元星云','ERNIE':'文心星云','MiniMax':'MiniMax 星云','Seed':'豆包星云（Seed）',
       'Yi':'散星（Yi）','Falcon':'散星（Falcon）','BLOOM':'散星（BLOOM）','Grok':'Grok 星云','OLMo':'散星（OLMo）'}
ORG = {'Qwen':'Qwen','Llama':'meta-llama','Gemma':'google（名含 gemma）','Mistral':'mistralai','DeepSeek':'deepseek-ai','Phi':'microsoft（名含 phi）',
       'GLM':'zai-org + THUDM','Kimi':'moonshotai','gpt-oss':'openai（gpt-oss）','GPT-2':'openai-community（gpt2）','BERT':'google-bert',
       'Hunyuan':'tencent（名含 hunyuan）','ERNIE':'baidu（名含 ernie）','MiniMax':'MiniMaxAI','Seed':'ByteDance-Seed','Yi':'01-ai',
       'Falcon':'tiiuae','BLOOM':'bigscience（名含 bloom）','Grok':'xai-org','OLMo':'allenai（名含 olmo）'}
rows = sorted(hf.items(), key=lambda kv: -kv[1]['sum']['total'])
d = ['| # | 星云 | HF 机构 | 统计仓库数 | 微调 | 适配器 | 量化 | 合并 | **合计** | 衍生最多的仓库 |', '|---|---|---|---|---|---|---|---|---|---|']
for i, (k, v) in enumerate(rows, 1):
    s = v['sum']; top = v['top'][0] if v['top'] else None
    t = f"`{top['id']}`（{top['total']:,}）" if top else '—'
    n = f"{v['repos_checked']}"
    d.append(f"| {i} | {NEB[k]} | {ORG[k]} | {n} | {s['finetune']:,} | {s['adapter']:,} | {s['quantized']:,} | {s['merge']:,} | **{s['total']:,}** | {t} |")
dmd = '\n'.join(d)

tables = open(S + 'tables.md', encoding='utf-8').read()
tables = tables.replace('@@PLANETS@@', '## 3. B 表 · 星球（按日期）\n\n> 「档」见第 1 节。B、C 档的名字可以在片中不点名，但位置要按日期摆。')
tables = tables.replace('@@THREADS@@', '## 4. C 表 · 光丝（只画有据可查的关系）\n\n> 光丝两端都必须在名单里，并且有官方或论文记录。指控、传闻类的关系不画（见第 7 节）。')

dsec = f'''
## 5. D 表 · 星云浓度（Hugging Face 衍生模型数，实测）

> **口径**：取每个机构在 Hugging Face 上**按下载量排前 10 的官方仓库**，读取每个仓库页面「Model tree」里**直接**标注以它为底座的模型数（微调、适配器、量化、合并四类相加），然后十个仓库求和。
> 抓取时间：2026-10-26 14:34（本机时间）。原始数据在 `universe.json` 的 `nebula_density` 字段。
> **注意**：① 只统计第一层衍生，孙辈不算；② 只统计前 10 个仓库，所以每家都**偏低**，而且仓库越多的家族被低估得越多；③ 闭源家族（Claude、GPT 主线、Gemini 主线）在 HF 上没有底座仓库，**数值为 0 不代表没人用**，只是这片星云没有公开的「子孙尘埃」。片中只用这张表的**相对浓度**来决定雾的浓淡，不在画面上打出具体数字；要打数字，必须连口径一起写。

{dmd}

> 有的仓库页面能正常打开，但没有「Model tree」区块，说明没有任何模型把它标成底座，这类仓库按 0 计。腾讯、MiniMax 的前 10 个仓库里有不少 3D、视觉模型，所以这两家的数值不完全是语言模型的口径。

**读法（可上片的结论，口径同上）**：

1. **Qwen 和 Llama 是最浓的两片星云，而且几乎一样浓**：28,906 对 27,017，差不到 7%。这个口径下**不能说「Qwen 已经超过 Llama」**。二手报道称 Qwen 衍生总数已经是 Llama 仓库的 4.7 倍（[Constellation Research](https://www.constellationr.com/node/120320)），但那是另一种口径，我们没能核实原报告。
2. **两片星云的年龄完全不同**：Llama 的尘埃全部挂在 2023–2024 年的老星上（衍生最多的是 2024-07 的 Llama-3.1-8B-Instruct，7,302 个）；Qwen 的尘埃大多挂在 2025–2026 年的新星上（Qwen3 系列、2026 年的 Qwen3.5 和 Qwen3.8）。**画面上的意思是：Llama 星云已经不再诞生新星，但老星还在不停地往外抛尘埃；Qwen 星云还在一边造星一边抛尘埃。**这条和第 6 节第 10 条互相印证。
3. **2018 年的 BERT 至今排第三**（13,872 个），而且几乎全是微调。最老的星还很亮。
4. **DeepSeek 星云里最「多产」的星，底座是 Qwen**：DeepSeek 前 10 仓库中衍生最多的是 `DeepSeek-R1-Distill-Qwen-1.5B`（1,485 个）。也就是说，跨星云的那根光丝自己又长出了一团尘埃。
5. **闭源星云没有尘埃**：Claude、GPT 主线、Gemini 主线在 HF 上没有底座仓库，所以画面上这几片星云是「只有恒星、没有尘埃」的样子。这是事实描述，不是褒贬。
'''
tail = open(S + 'tail.md', encoding='utf-8').read()
src = '\n## 10. 来源汇总\n\n' + '\n'.join(f'- `{k}` {v}' for k, v in SRC.items())
src += '\n- Hugging Face 各仓库页面（D 表），例：https://huggingface.co/Qwen/Qwen3-0.6B\n'
head = open(S + 'head.md', encoding='utf-8').read()
open(OUT + '宇宙名单.md', 'w', encoding='utf-8').write(head + tables + '\n' + dsec + tail + src)

u = json.load(open(OUT + 'universe.json', encoding='utf-8'))
u['nebula_density'] = {k: {'nebula': NEB[k], 'hf_org': ORG[k], **v['sum'], 'repos_checked': v['repos_checked'], 'repos_failed': v['repos_failed'], 'top_repo': v['top'][0]['id'] if v['top'] else None} for k, v in rows}
json.dump(u, open(OUT + 'universe.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for k, v in rows: print(k, v['sum']['total'], v['repos_checked'], v['repos_failed'])
