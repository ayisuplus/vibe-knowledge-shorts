# 旁白/字幕的唯一数据源：段、句、画面、批注。时间码先按语速估算，TTS 实测后用 durations.json 覆盖
import json, re, sys, os
sys.stdout.reconfigure(encoding='utf-8')
SEG = [  # 段, 名称, 开始, 结束, 首句前留白(秒)
 ('S1', '冷开场', 0, 15, 1.4),
 ('S2', '历史锚点', 15, 32, 0.8),
 ('S3', '名字是线索', 32, 62, 0.8),
 ('S4', '反直觉转折', 62, 89, 1.0),
 ('S5', '现实落点', 89, 106, 1.0),
 ('S6', '结尾', 106, 120, 0.8),
]
# (段, 字幕, 画面, 句后停顿秒, 标记)  标记：pause=句后大停顿 / noshow=不进滚动字幕
L = [
 ('S1','我把大模型家族，做成了星星。','Fable 浮雕极近特写：龟兔赛跑的浮雕从暗处被光扫亮',0.6,''),
 ('S1','每一颗星，是一个模型；','急速拉远：Fable 缩成一颗星，周围一颗颗星亮起',0.25,''),
 ('S1','每一片星云，是一个家族。','继续拉远：星点聚成十几片不同颜色的星云，全景',0.6,''),
 ('S1','你每天聊天的那个 AI，也住在这里面。','全景缓慢旋转，星云间有细光丝相连',0.6,''),
 ('S1','我们去找找它。','镜头开始向宇宙中心前进',0.9,''),
 ('S2','一切，从 2017 年的一篇论文开始。','飞向中心：一个孤零零的白色亮点',0.4,''),
 ('S2','它提出了 Transformer。','亮点压缩、发白',0.2,''),
 ('S2','宇宙，从这里炸开。','大爆炸：光环向外扩散',0.9,''),
 ('S2','论文的八位作者，后来全都离开了谷歌。','八道光流从爆炸点射向四面八方',0.3,''),
 ('S2','星星，散到了各家。','光流落点各自凝成星云；一侧掠过一小簇彩色的「芝麻街星团」',0.9,''),
 ('S3','每颗星的样子，都藏在名字里。','镜头转向第一片星云',0.6,''),
 ('S3','Gemini 是双子座：','蓝、暖两颗气态星互相绕转；名字浮现「Gemini · 双子座」',0.2,''),
 ('S3','两个团队，合成了一个。','双星靠近、并排；Gemma 宝石卫星闪光',0.8,''),
 ('S3','Claude 的三档，按诗的长短排：','掠过三颗由小到大的星',0.2,''),
 ('S3','俳句，十四行诗，长篇。','依次掠过 Haiku（3 条带）/ Sonnet（14 条带）/ Opus（华丽纹带）',0.7,''),
 ('S3','它最强的叫 Mythos，神话；','镜头靠近一颗被深色面纱裹住的星，面纱孔洞里透出金色神话浮雕',0.25,''),
 ('S3','公开的那个，叫 Fable，寓言。','镜头拉开：Fable 在 Mythos 旁边，同样的浮雕、没有面纱（回到开场那颗星）',0.8,''),
 ('S3','而月之暗面的 Kimi，永远只亮着半边。','白色月亮，镜头从亮面绕向暗面，暗面亮起流动的细光',1.0,''),
 ('S4','可是，你发现了吗？','镜头急退，拉到能同时看见几片星云的远景',0.3,''),
 ('S4','最有名的那几片星云，周围是空的。','闭源星云（GPT / Claude / Gemini 主线）四周干净，只有恒星',0.6,''),
 ('S4','真正热闹的，是千问和 Llama。','镜头转向两片被浓密星尘包裹的星云：青花瓷千问、织锦 Llama',0.25,''),
 ('S4','它们把模型公开，','星尘从两颗星上涌出',0.15,''),
 ('S4','全世界的人改出了上万个新模型，像星尘。','星尘铺满画面（粒子，不是小图标）；DeepSeek 的光丝穿进千问和 Llama 的星尘',0.6,''),
 ('S4','后来，Meta 换上了不公开的新模型。','Llama 星旁亮起一颗不透明的新星（Muse Spark）',0.25,''),
 ('S4','此后 Llama 没有再诞生新星，','Llama 星云的核心慢慢暗下去',0.15,''),
 ('S4','可它的星尘，还在扩散。','暗下去的核心周围，星尘继续向外飘',0.9,''),
 ('S5','OpenAI 把型号叫成了月亮、太阳和群星。','日地月系统：从 Luna 特写拉开，掠过 Terra',0.3,''),
 ('S5','越强的，离我们越远。','绕到 Terra 背后，「日出」；飞向 Sol，再抬头看见 Astra 星簇',0.8,''),
 ('S5','你每天聊天的那颗星，就在这些光里。','Astra 星簇居中，镜头继续上升，整片宇宙重新进入画面',1.0,''),
 ('S6','截至 2026 年 10 月，','全景；宇宙边缘一颗新星亮起',0.15,''),
 ('S6','这片宇宙还在不断点亮新的星星。','边缘接连亮起更多新星，镜头加速向外',0.8,''),
 ('S6','下一颗被点亮的星，会是谁做的？','问句由画面中央大字呈现；最后半拍硬切黑',0.0,'noshow'),
]
RATE = 4.0  # 字/秒，单句内（v2 试音实测：45 字当量含句间停顿 12.16 s ≈ 3.7，去掉停顿约 4.0）
def chars(s): return len(re.sub(r'[\s，。；：？！、,.;:?!]', '', s))
def spoken(s):  # 估算说话的「字当量」：中文 1 字 1，英文单词约 2，四位年份约 4（二零一七）
    t = re.sub(r'\d{4}', '四字四', s)
    n = len(re.findall(r'[A-Za-z]+', t)) * 2
    return n + len(re.sub(r'[\sA-Za-z，。；：？！、,.;:?!]', '', t))
def est(s): return spoken(s) / RATE + 0.25
meas = json.load(open('durations.json', encoding='utf-8')) if os.path.exists('durations.json') else {}
out = []; warn = []
t = 0
segwin = {}
for sid, name, a, b, lead in SEG:
    t = max(a, t) + lead
    s0 = t - lead
    for i, (s, txt, pic, gap, tag) in enumerate([x for x in L if x[0] == sid]):
        d = meas.get(txt, est(txt))
        out.append(dict(seg=sid, text=txt, pic=pic, start=round(t, 2), end=round(t + d, 2), dur=round(d, 2), measured=txt in meas, tag=tag))
        t += d + gap
    segwin[sid] = (round(s0, 2), round(t, 2))
    if t > b + 0.01: warn.append(f'{sid} 结束于 {t:.2f}（名义 {b}）')
# 字幕结束时间：至少按每秒 4 字留够读的时间，但不晚于下一句开始前 0.08 秒（字幕可以比声音多停一会儿）
for k, x in enumerate(out):
    nxt = out[k + 1]['start'] - 0.08 if k + 1 < len(out) else 119.5
    x['cap_end'] = round(min(nxt, max(x['end'], x['start'] + spoken(x['text']) / 4.0)), 2)
json.dump(segwin, open('segwin.json', 'w'), indent=1)
json.dump(out, open('timeline.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for x in out: print(x['seg'], f"{x['start']:6.2f}–{x['end']:6.2f}", chars(x['text']), x['text'])
print('WARN', warn or 'none', '| total chars', sum(chars(x['text']) for x in out), '| segs', segwin)
