# timeline.json（lines.py 产出）→ ../分镜脚本.md + ../字幕文案.md
# 改台词或画面：改 lines.py；改镜头/声音/名牌：改本文件。然后在本目录：python -I lines.py && python -I make_docs.py
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
T = json.load(open('timeline.json', encoding='utf-8'))
W = json.load(open('segwin.json', encoding='utf-8'))
NAME = {'S1': '冷开场', 'S2': '历史锚点', 'S3': '名字是线索', 'S4': '反直觉转折', 'S5': '现实落点', 'S6': '结尾'}
ONE = {
 'S1': '从 Fable 的浮雕拉远到整片宇宙，交代规则，抛出「你的 AI 住在哪」',
 'S2': '2017 年 Transformer 大爆炸，八位作者散到各家',
 'S3': '星星的样子藏在名字里：Gemini、Claude 三档、Mythos 与 Fable、Kimi',
 'S4': '可是：最有名的星云周围是空的；千问和 Llama 被星尘包围',
 'S5': 'OpenAI 的档位：从月亮爬到群星；回到「你的那颗星」',
 'S6': '新星接连亮起；问句；硬切',
}
# 每句的镜头与名牌（键＝字幕原文）。cam＝机位运动；tag＝屏上名牌（只写画面里真实存在的东西）；sfx＝拟音
SHOT = {
 '我把大模型家族，做成了星星。': dict(cam='极近特写，缓慢横移；一道光从左扫过浮雕', tag='', sfx=''),
 '每一颗星，是一个模型；': dict(cam='急速后拉（约 1.5 秒拉开 40 倍距离），缓入缓出', tag='', sfx='后拉时一声长 whoosh（轻）'),
 '每一片星云，是一个家族。': dict(cam='继续后拉到全景，然后停住、缓慢自转', tag='', sfx=''),
 '你每天聊天的那个 AI，也住在这里面。': dict(cam='全景缓慢旋转', tag='', sfx=''),
 '我们去找找它。': dict(cam='开始向中心前进，速度渐快', tag='', sfx=''),
 '一切，从 2017 年的一篇论文开始。': dict(cam='推进到中心亮点前减速', tag='Transformer · 2017', sfx=''),
 '它提出了 Transformer。': dict(cam='停住；亮点向内收缩', tag='', sfx='低频吸气声（收缩）'),
 '宇宙，从这里炸开。': dict(cam='爆炸瞬间镜头被推后、轻微震动一次（全片唯一一次震动）', tag='', sfx='大爆炸：低频轰鸣（全片最重的一下）'),
 '论文的八位作者，后来全都离开了谷歌。': dict(cam='跟随其中一道光流向外飞', tag='', sfx='八道光流各一声短促的「嗖」，错开'),
 '星星，散到了各家。': dict(cam='光流落点凝成星云；掠过芝麻街星团', tag='BERT · ERNIE · ELMo（芝麻街）', sfx=''),
 '每颗星的样子，都藏在名字里。': dict(cam='转向，飞向 Gemini 星云', tag='', sfx=''),
 'Gemini 是双子座：': dict(cam='环绕双星中景', tag='Gemini · 双子座', sfx=''),
 '两个团队，合成了一个。': dict(cam='推近，双星占满画面；外圈 Gemma 宝石闪光', tag='Gemma · 宝石', sfx='宝石闪光：高音叮（两声，轻）'),
 'Claude 的三档，按诗的长短排：': dict(cam='侧向平移，三星从小到大入画', tag='', sfx=''),
 '俳句，十四行诗，长篇。': dict(cam='每说一个词，对应那颗星被镜头掠过、名牌亮起', tag='Haiku · 俳句 / Sonnet · 十四行诗 / Opus · 长篇', sfx=''),
 '它最强的叫 Mythos，神话；': dict(cam='推近面纱星；孔洞张开的时刻对在「神话」两个字上', tag='Mythos · 神话', sfx='面纱张开：低沉的布料摩擦＋金属回响（轻）'),
 '公开的那个，叫 Fable，寓言。': dict(cam='拉开，Fable 入画，与 Mythos 并排', tag='Fable · 寓言', sfx=''),
 '而月之暗面的 Kimi，永远只亮着半边。': dict(cam='环绕白月：亮面 → 明暗交界 → 暗面，暗面细光开始流动', tag='Kimi · 月之暗面', sfx=''),
 '可是，你发现了吗？': dict(cam='急退到远景（转折的「拉远」）', tag='', sfx='后退 whoosh（反向）'),
 '最有名的那几片星云，周围是空的。': dict(cam='远景横移，依次掠过 GPT、Claude、Gemini 星云', tag='', sfx=''),
 '真正热闹的，是千问和 Llama。': dict(cam='转向千问与 Llama，两片星云同框', tag='Qwen · 千问 / Llama · 羊驼', sfx=''),
 '它们把模型公开，': dict(cam='推近', tag='', sfx=''),
 '全世界的人改出了上万个新模型，像星尘。': dict(cam='穿进星尘里（粒子从镜头两侧掠过）；一侧 DeepSeek 的光丝连过来，鲸影游过', tag='DeepSeek · 深度求索', sfx='星尘：细碎的沙沙声，持续到本句末'),
 '后来，Meta 换上了不公开的新模型。': dict(cam='Llama 星旁亮起一颗不透明的新星', tag='Muse Spark', sfx=''),
 '此后 Llama 没有再诞生新星，': dict(cam='Llama 核心变暗', tag='', sfx=''),
 '可它的星尘，还在扩散。': dict(cam='镜头随星尘向外飘', tag='', sfx=''),
 'OpenAI 把型号叫成了月亮、太阳和群星。': dict(cam='Luna 特写 → 拉开见 Terra（沿用 gpt.html 的 climb 路径前半）', tag='Luna · 月 / Terra · 地', sfx=''),
 '越强的，离我们越远。': dict(cam='绕到 Terra 背后，日出，飞向 Sol，抬头', tag='Sol · 日 / Astra · 群星', sfx='日出：一声明亮的长音（轻）'),
 '你每天聊天的那颗星，就在这些光里。': dict(cam='Astra 居中，镜头继续上升，整片宇宙回到画面', tag='', sfx=''),
 '截至 2026 年 10 月，': dict(cam='全景，开始向外加速', tag='', sfx='新星亮起：一声高音（轻）'),
 '这片宇宙还在不断点亮新的星星。': dict(cam='边缘新星接连亮起，越来越快', tag='', sfx='新星亮起：逐个叠加，越来越密'),
 '下一颗被点亮的星，会是谁做的？': dict(cam='问句大字浮现；119.5 秒硬切黑', tag='', sfx='硬切时一切声音同时停'),
}
NOTE = {  # 字幕文案的批注区预填（我的疑问 / 待你决定）
 '论文的八位作者，后来全都离开了谷歌。': '出处：维基百科「Attention Is All You Need」条目。',
 'Gemini 是双子座：': '出处：Google 官方博客「How Google\'s AI model Gemini got its name」。',
 'Claude 的三档，按诗的长短排：': '「按诗的长短排」是我们的观察（档位顺序与诗体长短一致），不是 Anthropic 的原话。要不要改成「名字都是诗的体裁」？',
 '它最强的叫 Mythos，神话；': 'Claude 是我们自己家的模型，全片只在这里提一句，篇幅不多于别家。',
 '而月之暗面的 Kimi，永远只亮着半边。': '「只亮半边」是画面描述，不是事实陈述。',
 '最有名的那几片星云，周围是空的。': '口径：闭源模型在 Hugging Face 上没有可下载的底座，所以没有社区衍生。不是说没人用。',
 '全世界的人改出了上万个新模型，像星尘。': '依据：千问前 10 个官方仓库的直接衍生约 2.9 万（Hugging Face，2026-10-26 实测）。只说「上万」，不出具体数字。',
 '此后 Llama 没有再诞生新星，': '已按调研档案改写（原句「Llama 不再诞生新星」可能被理解成停更；Meta 没有正式宣布终止 Llama）。只陈述截至 2026-10 的事实：Llama 4（2025-04）之后没有新的 Llama 发布。',
 'OpenAI 把型号叫成了月亮、太阳和群星。': '已核实一手来源：OpenAI 官方「GPT-6 Astra：新一代智能」与「隆重推出 GPT-6 Sol 和 Luna」——Astra 是「迄今综合表现最佳的模型」，Sol、Luna 是同代更快更便宜的两档。只说名字和档位顺序，不引用任何跑分。',
 '截至 2026 年 10 月，': '快照日期与调研档案一致（2026-10-26）。',
}

def ts(x): return f'{x:6.2f}'
sb = []
sb.append('# 第十八期 · 分镜脚本（v1）\n')
sb.append('> P4 产出，**等用户确认再做工程**。字幕逐句稿另见 [`字幕文案.md`](字幕文案.md)。')
sb.append('> 本文件由 `_gen/make_docs.py` 生成（数据在 `_gen/lines.py`）；直接改这里的话，下次生成会被覆盖，请改脚本或在字幕文案的批注区留言。\n')
sb.append('## 0. 时间基准与段落窗口\n')
sb.append('- **时间单位：秒**。本期没有 BGM 拍网格（《Cornfield Chase》发布时在抖音里加，不进母版），**时间由旁白驱动**。')
meas = sum(1 for x in T if x['measured'])
if meas == len(T):
    sb.append(f'- 旁白时长：**{len(T)} 句全部为 TTS 实测**（Breeze TTS 2 Voice Direction，参考音色 v2；句内超过 0.55 秒的停顿已压到 0.5 秒，见 `04-声音/voice/measure_vo.py`），句间停顿 0.15–1.0 秒。')
else:
    sb.append(f'- 旁白时长：**{meas}/{len(T)} 句为实测**，其余按 v2 试音的语速估算（单句每秒约 4 字，英文单词约 2 字，四位年份约 4 字），句间停顿 0.15–1.0 秒。TTS 实测后重新生成本文，时间码会整体更新。')
sb.append(f"- 总长 **120.0 秒**（30fps，3600 帧）；旁白最后一句在 {T[-1]['end']:.1f} 秒结束，119.5 秒硬切黑。旁白预览音轨：`04-声音/旁白预览.mp3`（按本表时间码拼好的 120 秒）。")
sb.append('- 段落窗口和提案略有出入（跟着旁白实测时长走），以本表为准。\n')
sb.append('| 段 | 时间 | 一句话 |')
sb.append('|---|---|---|')
for k, (a, b) in W.items():
    b2 = 120.0 if k == 'S6' else W[list(W)[list(W).index(k) + 1]][0]
    sb.append(f'| {k} {NAME[k]} | {a:.1f}–{b2:.1f} s | {ONE[k]} |')
sb.append('\n## 1. 宇宙布局（P5 据此建场景）\n')
sb.append('- **一个连续的 3D 场景，一条相机路径**：全片不切场景，所有镜头都是同一个宇宙里的飞行。相机位置和朝向是时间 t 的纯函数（Catmull-Rom 关键帧，同 `gpt.html` 的 climb 写法）。')
sb.append('- **坐标**：宇宙中心＝Transformer（2017）；**离中心越远＝发布越晚**；同一家族聚成一片星云。')
sb.append('- **主角星球**：沿用 `02-风格样张/planet-lab/` 里的 12 组定稿贴图（`*-final.png`）和各自的特殊结构（Gemini 双星＋Gemma、GPT 日地月＋Astra、Kimi 半亮、Mythos 面纱、DeepSeek 鲸鱼）。')
sb.append('- **星尘浓度**：按 `01-调研/universe.json` 的 `nebula_density` 决定粒子数量；闭源星云（GPT 主线、Claude、Gemini 主线）星尘为 0。')
sb.append('- **非主角**（Mistral、Grok、文心、混元、豆包、MiniMax、Phi 等）：在 S1 全景、S2 散开、S4 远景里出现，不点名。')
sb.append('- **光丝**：只画 `宇宙名单.md` C 表里有据可查的 13 根。\n')
sb.append('## 2. 逐句镜头表\n')
sb.append('| 时间 | 旁白／字幕 | 画面 | 机位 | 屏上名牌 | 拟音 |')
sb.append('|---|---|---|---|---|---|')
cur = None
for x in T:
    if x['seg'] != cur:
        cur = x['seg']; a = W[cur][0]
        sb.append(f'| **{cur}** {a:.1f} s | **{NAME[cur]}** | | | | |')
        if cur == 'S1':
            sb.append('| 0.00– 1.40 | （无旁白） | 全黑，一道细光从画面左侧亮起，扫出浮雕的轮廓 | 静止 | | |')
    s = SHOT[x['text']]
    sb.append(f"| {ts(x['start'])}–{ts(x['end'])} | {x['text']}{'（noshow：画面大字，不进滚动字幕）' if x['tag'] == 'noshow' else ''} | {x['pic']} | {s['cam']} | {s['tag']} | {s['sfx']} |")
sb.append('| 119.50–120.00 | （无） | 硬切黑 | | | 全部静音 |')
sb.append('\n## 3. 字幕与屏上文字\n')
sb.append('- **字幕**：烧进母版，中文 46px 粗体，位于画面 85–91% 高度；一句一条，不加英文。全文和逐句时间码见 [`字幕文案.md`](字幕文案.md)。')
sb.append('- **名牌**：飞到某颗星时，在星的旁边浮现「英文名 · 中文义」，细字、半透明，跟着星移动，离开时淡出。只写画面里真实存在的东西。')
sb.append('- **问句**：最后一句由画面中央大字呈现，不进滚动字幕（noshow），但进 SRT。')
sb.append('- **引用与免责**：114–120 秒，画面底部一行小字：「资料：Wikipedia · arXiv · Hugging Face（截至 2026-10-26）｜星球外观是创作，不代表模型能力或参数量」。\n')
sb.append('## 4. 声音点位\n')
sb.append('- **旁白**：Breeze TTS 2 Voice Direction，参考音色 `04-声音/voice/ref-v2.flac`＋指令「语速放慢，平静、温柔、知性……」（`make_vo.py`，每句 seed＝1027＋句号；第 4、5 句改用 seed 3000/2000 重做）。逐句文件在 `04-声音/vo-trim/`，句间停顿以本文时间码为准。')
sb.append('- **BGM**：不进母版。发布时在抖音曲库加《Cornfield Chase》，配乐音量建议 30–40%。')
sb.append('- **拟音**：很少，只在表里标出的地方；音量比旁白低 6 dB 以上，给配乐和旁白让路。')
sb.append('- **响度**：母版 −16 LUFS、真峰值不超过 −1.5 dB（给抖音叠加配乐留余量）。\n')
sb.append('## 5. 静止风险\n')
sb.append('- 全片是连续飞行，相机任何时刻都在动；所有星球都在自转，星点轻微闪烁。')
sb.append('- 风险最高的是 S3 的双星和三星（镜头若只环绕会显得慢）：环绕的同时要有推近或横移。')
sb.append('- 问句大字停留约 5 秒：期间背景新星持续亮起，镜头持续向外。\n')
sb.append('## 6. 验收标准\n')
sb.append('- [ ] 1920×1080、30fps、120.0 秒；母版只有旁白＋拟音')
sb.append('- [ ] 旁白全片同一个声音；每句字幕与旁白对齐（误差 < 0.2 秒）')
sb.append('- [ ] 字幕上屏的读速不超过每秒 4.5 字（偏快的句子字幕多停一会儿）；不出现标点落在行首')
sb.append('- [ ] 静止秒 < 25%')
sb.append('- [ ] 「禁说」一条不出现；名牌只写画面里真实存在的东西')
sb.append('- [ ] 390px 手机预览：字幕和名牌可读')
sb.append('- [ ] 交付响度 −16 LUFS，真峰值 ≤ −1.5 dB\n')
sb.append('## 7. 上片前必须解决\n')
todo = [f'- 「{k}」{v[1:].strip()}' for k, v in NOTE.items() if v.startswith('⚠')]
sb += todo or ['- 无。两处措辞已于 2026-10-27 解决：Llama 句改为「此后 Llama 没有再诞生新星」并重录；「群星」经 OpenAI 原公告核实。']
open('../分镜脚本.md', 'w', encoding='utf-8').write('\n'.join(sb) + '\n')

cp = []
cp.append('# 第十八期 · 字幕文案（v1）\n')
cp.append('> P4 字幕产出，给你直接读、直接改。每句：编号＋时间码＋字幕正文；下面一行是对应画面；「// 批注：」是留给你的地方，我先填了出处和我的疑问。')
cp.append('> 旁白和字幕**一字不差**（旁白定稿 2026-10-27）。时间码＝这句旁白的起止（TTS 实测）；语速偏快的句子，字幕会多停一会儿，括号里写了停到几秒。')
cp.append('> 最后一句是画面大字（noshow），不进滚动字幕，只进 SRT。\n')
n = 0; cur = None
for x in T:
    if x['seg'] != cur:
        cur = x['seg']; a = W[cur][0]
        b2 = 120.0 if cur == 'S6' else W[list(W)[list(W).index(cur) + 1]][0]
        cp.append(f'---\n\n## {cur} {NAME[cur]}（{a:.1f}–{b2:.1f} s）\n')
    n += 1
    flag = '' if x['measured'] else '（估）'
    hold = f"（字幕停到 {x['cap_end']:.2f}）" if x['cap_end'] > x['end'] + 0.05 else ''
    cp.append(f"{n}. {x['start']:.2f}–{x['end']:.2f}{flag}　{x['text']}{hold}")
    cp.append(f"   （画面：{x['pic']}{'；noshow：不进滚动字幕，只进 SRT' if x['tag'] == 'noshow' else ''}）")
    cp.append(f"   // 批注：{NOTE.get(x['text'], '')}\n")
cp.append('---\n\n## 声音注记\n')
cp.append('- 字幕＝旁白原文，标点按念的停顿保留；字幕上屏时间＝这句旁白的起止时间。')
cp.append('- 句间的长停顿（0.6 秒以上）是故意留给《Cornfield Chase》的空隙，不要填满。')
open('../字幕文案.md', 'w', encoding='utf-8').write('\n'.join(cp) + '\n')
print('ok', len(T), 'lines')
