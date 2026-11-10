# 宇宙名单唯一数据源 → universe.json + 名单表格（markdown 片段）
import json, sys
sys.stdout.reconfigure(encoding='utf-8')

# 来源键 → 链接
SRC = {
 'W-claude': 'https://en.wikipedia.org/wiki/Claude_(AI)',
 'W-mythos': 'https://en.wikipedia.org/wiki/Claude_Mythos',
 'W-openai': 'https://en.wikipedia.org/wiki/Products_and_applications_of_OpenAI',
 'W-gpt51': 'https://en.wikipedia.org/wiki/GPT-5.1',
 'W-gpt55': 'https://en.wikipedia.org/wiki/GPT-5.5',
 'W-gpt61': 'https://en.wikipedia.org/wiki/GPT-6.1',
 'W-gemini': 'https://en.wikipedia.org/wiki/Gemini_(language_model)',
 'W-gemma': 'https://en.wikipedia.org/wiki/Gemma_(language_model)',
 'W-llama': 'https://en.wikipedia.org/wiki/Llama_(language_model)',
 'W-qwen': 'https://en.wikipedia.org/wiki/Qwen',
 'W-deepseek': 'https://en.wikipedia.org/wiki/DeepSeek',
 'W-grok': 'https://en.wikipedia.org/wiki/Grok_(chatbot)',
 'W-mistral': 'https://en.wikipedia.org/wiki/Mistral_AI',
 'W-kimi': 'https://en.wikipedia.org/wiki/Kimi_(AI)',
 'W-moonshot': 'https://en.wikipedia.org/wiki/Moonshot_AI',
 'W-zai': 'https://en.wikipedia.org/wiki/Z.ai',
 'W-phi': 'https://en.wikipedia.org/wiki/Phi_(language_model)',
 'W-ernie': 'https://en.wikipedia.org/wiki/Ernie_Bot',
 'W-doubao': 'https://en.wikipedia.org/wiki/Doubao',
 'W-minimax': 'https://en.wikipedia.org/wiki/MiniMax_Group',
 'W-01ai': 'https://en.wikipedia.org/wiki/01.AI',
 'W-bloom': 'https://en.wikipedia.org/wiki/BLOOM_(language_model)',
 'W-bert': 'https://en.wikipedia.org/wiki/BERT_(language_model)',
 'W-elmo': 'https://en.wikipedia.org/wiki/ELMo',
 'W-attn': 'https://en.wikipedia.org/wiki/Attention_Is_All_You_Need',
 'W-gpt1': 'https://en.wikipedia.org/wiki/GPT-1',
 'W-gpt2': 'https://en.wikipedia.org/wiki/GPT-2',
 'W-gpt3': 'https://en.wikipedia.org/wiki/GPT-3',
 'W-gpt4': 'https://en.wikipedia.org/wiki/GPT-4',
 'W-chatgpt': 'https://en.wikipedia.org/wiki/ChatGPT',
 'W-o1': 'https://en.wikipedia.org/wiki/OpenAI_o1',
 'X-attn': 'https://arxiv.org/abs/1706.03762',
 'X-elmo': 'https://arxiv.org/abs/1802.05365',
 'X-bert': 'https://arxiv.org/abs/1810.04805',
 'X-ernie': 'https://arxiv.org/abs/1904.09223',
 'X-gpt3': 'https://arxiv.org/abs/2005.14165',
 'X-bigbird': 'https://arxiv.org/abs/2007.14062',
 'X-glm': 'https://arxiv.org/abs/2103.10360',
 'X-llama': 'https://arxiv.org/abs/2302.13971',
 'X-phi1': 'https://arxiv.org/abs/2306.11644',
 'X-r1': 'https://arxiv.org/abs/2501.12948',
 'P-gpt1': 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf',
 'P-chatgpt': 'https://openai.com/index/chatgpt/',
 'P-alpaca': 'https://crfm.stanford.edu/2023/03/13/alpaca.html',
 'P-gemini-name': 'https://blog.google/technology/ai/google-gemini-ai-name-meaning/',
 'N-muse': 'https://www.eweek.com/news/meta-muse-spark-ai-launch-multimodal-reasoning/',
 'N-gpt56': 'https://macrumors.com/2026/06/26/openai-gpt-5-6-sol/',
 'N-gpt6': 'https://www.datacamp.com/blog/gpt-6-sol-and-luna',
 'P-gpt6-astra': 'https://openai.com/index/gpt-6-astra/',
 'P-gpt6-solluna': 'https://openai.com/index/introducing-gpt-6-sol-and-luna/',
 'N-kimik3': 'https://epoch.ai/models/kimi-k3',
 'N-qwen-deriv': 'https://www.constellationr.com/node/120320',
 'H-tencent': 'https://huggingface.co/tencent',
 'H-tree': 'https://huggingface.co/docs/hub/model-cards#specifying-a-base-model',
}

# 家族 = 星云。hue 只是色调暗示（由 logo 主色/名字联想），不贴 logo
FAMILIES = [
 # id, 名称, 机构, 开放程度, 名字含义（事实）, 星云意象（创作）, 来源
 ('origin', '起源星团', 'Google 等', '论文', '2017《Attention Is All You Need》提出 Transformer', '宇宙中心的大爆炸亮点，所有星云从这里喷出', 'W-attn'),
 ('sesame', '芝麻街星团', 'AllenAI / Google / 百度', '开放', 'ELMo、BERT、ERNIE、Big Bird 都是《芝麻街》角色名', '一簇彩色、卡通感的小行星，2018–2020 年', 'W-bert'),
 ('openai', 'GPT 星云', 'OpenAI', '大多闭源（gpt-oss 开放权重）', 'GPT = Generative Pre-trained Transformer；GPT-5.6 起分 Sol/Terra/Luna（太阳/地球/月亮）档', '自带「日-地-月」小星系；ChatGPT 是一次超新星爆发', 'W-openai'),
 ('anthropic', 'Claude 星云', 'Anthropic', '闭源', '据报道名字致敬香农；档位 Haiku（俳句）/Sonnet（十四行诗）/Opus（大型作品）/Mythos（神话）；Fable（寓言）是 Mythos 加安全护栏后的公开版', '诗歌长短 = 星球大小；Mythos 是蒙着面纱的内核，Fable 是刻满寓言浮雕的外壳', 'W-claude'),
 ('google', 'Gemini 星云', 'Google DeepMind', '闭源（Gemma 开放权重）', 'Gemini = 双子座：Brain 和 DeepMind 两个团队合流；也致敬 NASA 双子星计划；占位名曾叫 Titan', '双星系统，两颗互相绕转；旁边是一串宝石晶体卫星（Gemma，拉丁语「宝石」）', 'P-gemini-name'),
 ('meta', 'Llama 星云', 'Meta', '开放权重（Muse Spark 闭源）', 'LLaMA = Large Language Model Meta AI；2026-04 起由闭源的 Muse Spark 接班', '安第斯高原地貌；星云本体不再诞生新星，但子孙尘埃仍在扩散', 'W-llama'),
 ('qwen', '千问星云', '阿里巴巴（通义）', '大多开放权重', '通义千问：通晓意义、回答千种问题', '漂满问号的星球；衍生尘埃最浓的星云（待核实，见 D 表）', 'W-qwen'),
 ('deepseek', 'DeepSeek 星云', '深度求索', '开放权重', '深度求索；logo 是蓝鲸', '深海星球，发光海沟里有鲸影（呼应第十七期）', 'W-deepseek'),
 ('kimi', 'Kimi 星云', '月之暗面', '开放权重（K2 起）', '公司名取自 Pink Floyd 专辑《月之暗面》，在专辑发行 50 周年那个月创立；Kimi 是创始人杨植麟的英文昵称', '永远只亮半面的星球', 'W-moonshot'),
 ('mistral', 'Mistral 星云', 'Mistral AI', '部分开放', '密史脱拉风：法国南部强劲寒冷的西北风', '被狂风刮出条纹的星球', 'W-mistral'),
 ('xai', 'Grok 星云', 'xAI（维基现记为 SpaceXSI）', '大多闭源（Grok-1/2 开放）', 'grok 是海因莱因 1961 年小说《异乡异客》里的火星语词，意为深刻地理解', '红色火星质感', 'W-grok'),
 ('zhipu', 'GLM 星云', '智谱（Z.ai）', '开放权重（2025-07 起 MIT）', 'GLM = General Language Model；训练法叫「自回归填空」', '表面缺块、正被一块块补齐的星球', 'W-zai'),
 ('phi', 'Phi 星群', 'Microsoft', '开放权重', 'Phi-1 论文题为《Textbooks Are All You Need》', '书页叠成的小行星（φ 黄金螺旋只是联想，未见官方出处）', 'X-phi1'),
 ('baidu', '文心星云', '百度', '闭源为主（4.5 起开放权重）', 'ERNIE = Enhanced Representation through kNowledge IntEgration，和 BERT 同属芝麻街', '一端连着芝麻街星团的长尾', 'W-ernie'),
 ('tencent', '混元星云', '腾讯', '部分开放', '混元：字面是天地未分的混沌元气（字义，非官方解释）', '还没成形的气态原星', 'H-tencent'),
 ('bytedance', '豆包星云', '字节跳动（Seed）', '闭源为主（Seed-OSS 开放）', '豆包；模型系列名 Seed（种子）', '正在发芽的种子星', 'W-doubao'),
 ('minimax', 'MiniMax 星云', 'MiniMax', '开放权重（M 系列）', 'minimax 是博弈论里的「极小化极大」算法', '棋盘纹理星球', 'W-minimax'),
 ('others', '散星', '01.AI / BigScience / TII 等', '开放', 'Yi、BLOOM、Falcon 等', '不单独成云，作远景小星', 'W-01ai'),
]

# 星球。tier: A=主角（独立贴图） B=具名（家族贴图变体） C=只作远景
# date: 发布日（月精度写 YYYY-MM）；open: 是否开放权重
P = []
def p(id, name, fam, date, open_, tier, src, note=''):
    P.append(dict(id=id, name=name, family=fam, date=date, open=open_, tier=tier, src=src, note=note))

p('transformer','Transformer（论文）','origin','2017-06-12',True,'A','X-attn','8 位作者后来全部离开 Google')
p('elmo','ELMo','sesame','2018-02',True,'B','X-elmo','不是 Transformer（双向 LSTM），但开启芝麻街命名')
p('gpt1','GPT-1','openai','2018-06-11',True,'B','P-gpt1','1.17 亿参数')
p('bert','BERT','sesame','2018-10',True,'A','X-bert','只用编码器那一半')
p('gpt2','GPT-2','openai','2019-02-14',True,'B','W-gpt2','')
p('ernie1','ERNIE 1.0','baidu','2019-04',True,'B','X-ernie','')
p('gpt3','GPT-3','openai','2020-05-28',False,'B','X-gpt3','1750 亿参数')
p('bigbird','Big Bird','sesame','2020-07',True,'C','X-bigbird','')
p('glm','GLM（论文）','zhipu','2021-03',True,'C','X-glm','arXiv 2021-03；ACL 2022-05')
p('bloom','BLOOM','others','2022-07-12',True,'C','W-bloom','上千名志愿研究者合作')
p('chatgpt','ChatGPT','openai','2022-11-30',False,'A','P-chatgpt','超新星时刻')
p('llama1','LLaMA','meta','2023-02-24',True,'A','X-llama','')
p('alpaca','Alpaca（斯坦福）','meta','2023-03-13',True,'B','P-alpaca','最早出圈的社区微调之一：在 LLaMA 7B 上微调')
p('gpt4','GPT-4','openai','2023-03-14',False,'B','W-gpt4','')
p('claude1','Claude','anthropic','2023-03-14',False,'B','W-claude','')
p('chatglm','ChatGLM-6B','zhipu','2023-03',True,'B','W-zai','')
p('erniebot','文心一言','baidu','2023-03-16',False,'B','W-ernie','')
p('phi1','phi-1','phi','2023-06-21',True,'B','W-phi','13 亿参数')
p('llama2','Llama 2','meta','2023-07-18',True,'B','W-llama','')
p('claude2','Claude 2','anthropic','2023-07-11',False,'C','W-claude','')
p('doubao','豆包','bytedance','2023-08',False,'B','W-doubao','')
p('qwen1','Qwen（通义千问）','qwen','2023-08',True,'A','W-qwen','2023-04 内测，2023-09 公开；开放权重以 HF 仓库为准')
p('mistral7b','Mistral 7B','mistral','2023-09',True,'A','W-mistral','')
p('kimi','Kimi','kimi','2023-10',False,'A','W-moonshot','一次读 20 万汉字')
p('grok1','Grok-1','xai','2023-11',True,'A','W-grok','2024-03 开放权重')
p('yi34b','Yi-34B','others','2023-11',True,'C','W-01ai','')
p('deepseek-llm','DeepSeek LLM','deepseek','2023-11-29',True,'A','W-deepseek','DeepSeek-Coder 2023-11-02 更早')
p('gemini1','Gemini 1.0','google','2023-12-06',False,'A','W-gemini','')
p('mixtral','Mixtral 8x7B','mistral','2023-12',True,'B','W-mistral','混合专家')
p('gemma1','Gemma','google','2024-02-21',True,'A','W-gemma','')
p('claude3','Claude 3 Haiku / Sonnet / Opus','anthropic','2024-03-04',False,'A','W-claude','三档诗体命名从这里开始（Haiku 03-13）')
p('llama3','Llama 3','meta','2024-04-18',True,'B','W-llama','')
p('gpt4o','GPT-4o','openai','2024-05-13',False,'B','W-openai','')
p('dsv2','DeepSeek-V2','deepseek','2024-05',True,'B','W-deepseek','')
p('claude35','Claude 3.5 Sonnet','anthropic','2024-06-20',False,'B','W-claude','')
p('qwen2','Qwen2','qwen','2024-06',True,'B','W-qwen','')
p('llama31','Llama 3.1 405B','meta','2024-07-23',True,'B','W-llama','')
p('o1','o1','openai','2024-09-12',False,'B','W-o1','')
p('qwen25','Qwen2.5','qwen','2024-09',True,'B','W-qwen','')
p('dsv3','DeepSeek-V3','deepseek','2024-12',True,'B','W-deepseek','')
p('r1','DeepSeek-R1','deepseek','2025-01-20',True,'A','X-r1','同时发布用 Qwen、Llama 做底的蒸馏版')
p('k15','Kimi k1.5','kimi','2025-01',False,'C','W-kimi','')
p('grok3','Grok 3','xai','2025-02',False,'B','W-grok','')
p('claude37','Claude 3.7 Sonnet','anthropic','2025-02-24',False,'C','W-claude','')
p('gemma3','Gemma 3','google','2025-03-12',True,'B','W-gemma','')
p('gemini25','Gemini 2.5 Pro','google','2025-03-25',False,'B','W-gemini','')
p('llama4','Llama 4 Scout / Maverick','meta','2025-04-05',True,'A','W-llama','Llama 星云最后一颗新星')
p('qwen3','Qwen3','qwen','2025-04',True,'B','W-qwen','')
p('claude4','Claude 4（Sonnet / Opus）','anthropic','2025-05-22',False,'B','W-claude','')
p('ernie45','ERNIE 4.5（开放权重）','baidu','2025-06',True,'B','W-ernie','')
p('m1','MiniMax-M1','minimax','2025-06',True,'B','W-minimax','')
p('grok4','Grok 4','xai','2025-07',False,'B','W-grok','')
p('k2','Kimi K2','kimi','2025-07',True,'B','W-moonshot','')
p('glm45','GLM-4.5','zhipu','2025-07',True,'B','W-zai','')
p('gptoss','gpt-oss-120b / 20b','openai','2025-08-05',True,'A','W-openai','OpenAI 自 GPT-2 后首次开放权重（「首次」措辞待核）')
p('gpt5','GPT-5','openai','2025-08-07',False,'B','W-openai','')
p('gemini3','Gemini 3 Pro','google','2025-11-18',False,'B','W-gemini','')
p('opus45','Claude Opus 4.5','anthropic','2025-11-24',False,'C','W-claude','')
p('dsv32','DeepSeek-V3.2','deepseek','2025-12-01',True,'B','W-deepseek','')
p('mlarge3','Mistral Large 3','mistral','2025-12',True,'B','W-mistral','')
p('k25','Kimi K2.5','kimi','2026-01',True,'C','W-moonshot','')
p('glm5','GLM-5','zhipu','2026-02-12',True,'B','W-zai','')
p('seed2','Doubao Seed 2.0','bytedance','2026-02-14',False,'B','W-doubao','')
p('qwen35','Qwen3.5','qwen','2026-02',True,'B','W-qwen','')
p('gemma4','Gemma 4','google','2026-04-02',True,'B','W-gemma','Apache 2.0')
p('mythos-prev','Claude Mythos Preview','anthropic','2026-04-07',False,'A','W-mythos','只给少数机构（Project Glasswing）')
p('muse','Muse Spark','meta','2026-04-08',False,'A','N-muse','Meta 超级智能实验室首个模型，闭源，接替 Llama')
p('gpt55','GPT-5.5','openai','2026-04-23',False,'C','W-gpt55','')
p('dsv4','DeepSeek-V4（Pro / Flash）','deepseek','2026-04-24',True,'B','W-deepseek','')
p('ernie51','ERNIE 5.1','baidu','2026-04-29',False,'C','W-ernie','')
p('fable5','Claude Fable 5 / Mythos 5','anthropic','2026-06-09',False,'B','W-mythos','Fable = 同一模型加安全护栏的公开版')
p('m3','MiniMax-M3','minimax','2026-06',True,'C','W-minimax','')
p('gpt56','GPT-5.6 Sol / Terra / Luna','openai','2026-07-09',False,'A','N-gpt56','2026-06-26 起有限预览')
p('k3','Kimi K3','kimi','2026-07',True,'A','W-moonshot','2.8 万亿参数；维基称史上最大开放权重模型')
p('opus5','Claude Opus 5','anthropic','2026-07-24',False,'C','W-claude','')
p('grok46','Grok 4.6','xai','2026-08',False,'C','W-grok','')
p('qwen38','Qwen3.8','qwen','2026-08',True,'B','W-qwen','Max/Flash 闭源，大尺寸开放')
p('fable51','Claude Fable 5.1 / Mythos 5.1','anthropic','2026-09-01',False,'A','W-claude','')
p('gpt6','GPT-6 Astra','openai','2026-09-03',False,'A','P-gpt6-astra','GPT-6 旗舰档；同代 Sol / Luna 于 2026-09-22 推出（OpenAI 原公告：Astra「迄今综合表现最佳」，Sol、Luna 更快更便宜）；GPT-6 没有 Terra 档')
p('dsv41','DeepSeek-V4.1','deepseek','2026-09-10',True,'C','W-deepseek','')
p('opus55','Claude Opus 5.5','anthropic','2026-09-22',False,'B','W-claude','Sonnet 5.5：09-28；Haiku 5.5：10-07')
p('gpt61','GPT-6.1 Sol','openai','2026-09-29',False,'B','W-gpt61','有来源称同期的 GPT-6.1 Astra 被取消（单一来源，不上片）')
p('mlarge4','Mistral Large 4（预览）','mistral','2026-10',None,'C','W-mistral','许可未定')

# 光丝 = 有据可查的关系
THREADS = [
 # from, to, 类型, 说明, 来源
 ('transformer','gpt1','架构','只用解码器那一半','P-gpt1'),
 ('transformer','bert','架构','只用编码器那一半','X-bert'),
 ('bert','ernie1','借鉴','在 BERT 掩码思路上改成「知识掩码」','X-ernie'),
 ('gpt3','chatgpt','继承','ChatGPT 基于 GPT-3.5 系列微调','P-chatgpt'),
 ('llama1','alpaca','微调','LLaMA 7B → Alpaca','P-alpaca'),
 ('r1','qwen25','蒸馏','R1 的推理能力蒸馏进 Qwen2.5 底座（R1-Distill-Qwen）','X-r1'),
 ('r1','llama31','蒸馏','R1 的推理能力蒸馏进 Llama 底座（R1-Distill-Llama）','X-r1'),
 ('dsv3','r1','继承','R1 从 DeepSeek-V3-Base 初始化','W-deepseek'),
 ('mythos-prev','fable5','同源','Fable 是 Mythos 加安全护栏的公开版','W-mythos'),
 ('llama4','muse','接班','Muse 系列接替 Llama 系列','N-muse'),
 ('gemini1','gemma1','同源技术','Gemma 由做 Gemini 的同一套研究和技术打造（Google 官方表述，待抓原文）','W-gemma'),
 ('mistral7b','mixtral','演进','从稠密模型走向混合专家','W-mistral'),
 ('k3','others','被用作底座','维基称 Kimi 模型被多家美国公司拿来做底座/后训练（待核一手）','W-moonshot'),
]

out = dict(snapshot='2026-10-26', families=[dict(zip(['id','name','org','openness','name_fact','nebula_idea','src'],f)) for f in FAMILIES],
           planets=P, threads=[dict(zip(['from','to','type','note','src'],t)) for t in THREADS], sources=SRC)
if __name__ == '__main__':
    path = sys.argv[1]
    json.dump(out, open(path,'w',encoding='utf-8'), ensure_ascii=False, indent=1)
    fam = {f[0]:f[1] for f in FAMILIES}
    md = []
    md.append('| 星云 | 机构 | 开放程度 | 名字的事实 | 星云/星球意象（创作） | 来源 |')
    md.append('|---|---|---|---|---|---|')
    for f in FAMILIES:
        md.append(f'| {f[1]} | {f[2]} | {f[3]} | {f[4]} | {f[5]} | [链接]({SRC[f[6]]}) |')
    md.append('\n@@PLANETS@@\n')
    md.append('| 日期 | 星球 | 星云 | 开放权重 | 档 | 备注 | 来源 |')
    md.append('|---|---|---|---|---|---|---|')
    for x in sorted(P, key=lambda x:x['date']):
        o = {True:'是',False:'否',None:'未定'}[x['open']]
        md.append(f"| {x['date']} | {x['name']} | {fam[x['family']]} | {o} | {x['tier']} | {x['note']} | [链接]({SRC[x['src']]}) |")
    md.append('\n@@THREADS@@\n')
    md.append('| 从 | 到 | 关系 | 说明 | 来源 |')
    md.append('|---|---|---|---|---|')
    name = {x['id']:x['name'] for x in P}; name['others']='其他公司的模型'
    for t in THREADS:
        md.append(f'| {name[t[0]]} | {name[t[1]]} | {t[2]} | {t[3]} | [链接]({SRC[t[4]]}) |')
    open(sys.argv[2],'w',encoding='utf-8').write('\n'.join(md))
    print(len(P),'planets',sum(x['tier']=='A' for x in P),'tier A',len(THREADS),'threads')
