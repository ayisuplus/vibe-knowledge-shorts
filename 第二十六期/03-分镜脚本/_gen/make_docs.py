# 由 script.py 生成「字幕文案.md」与「分镜脚本.md」，并检查阅读速度、时间重叠。
# 用法：python _gen/make_docs.py（在 03-分镜脚本/ 下）
import re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from script import SEGMENTS, LINES, NOTES, SCENES

HERE = Path(__file__).parent.parent
MAX_RATE = 4.7  # 字/秒（与第二十五期一致）

def plain(s): return re.sub(r"\*\*|\n", "", s)
def count(s): return len(re.findall(r"[一-鿿A-Za-z0-9]", re.sub(r"\d+(\.\d+)?%?", "数", plain(s))))
def fmt(x): return f"{x:.1f}"

# ── 检查 ──
problems, prev = [], None
for i, (seg, a, b, cap, *_rest) in enumerate(LINES, 1):
    r = count(cap) / (b - a)
    if r > MAX_RATE: problems.append(f"第 {i} 句 {r:.2f} 字/秒 > {MAX_RATE}")
    if prev is not None and a < prev: problems.append(f"第 {i} 句与上一句重叠")
    s = next(x for x in SEGMENTS if x[0] == seg)
    if not (s[2] <= a and b <= s[3] + .01): problems.append(f"第 {i} 句超出 {seg} 窗口")
    prev = b
rates = [count(c) / (b - a) for _, a, b, c, *_ in LINES]

# ── 字幕文案.md ──
out = ["# 第二十六期 · 字幕文案（单独成稿）", "",
       f"> 片名《RB19 为什么能赢？》（v2.0 技术解析），全片约 {SEGMENTS[-1][3]:.0f} 秒，八段，{len(LINES)} 句（含结尾问句）。本文件供审改，确认后回填工程 `captions.js`。",
       "> 格式：编号＋时间码（入–出，秒）＋字幕；「（画面）」是对应画面；「〔标注〕」是画面里的文字（全＝名字＋作用，签＝只有名字，程＝过程）；「// 批注：」留给你写评语；**粗体**上屏时高亮。",
       "> 规则：`AGENTS.md` 1.3.1「画面自解释」——部件在画面里解释，字幕只讲为什么、不重复标注里的部件名。",
       f"> 措辞依据：[`调研档案.md`](../01-调研/调研档案.md)，括号里的 F-n 是出处编号。阅读速度全片最高 {max(rates):.2f} 字/秒（上限 {MAX_RATE}）。",
       "> 时间是按「先写完整」排出来的，P5 对上 BGM 拍网格时整体可能前后挪半拍。", ""]
n = 0
for seg, name, a, b, dev in SEGMENTS:
    sc = SCENES.get(seg)
    out += ["---", "", f"## {seg} {name}（{fmt(a)}–{fmt(b)} s）", "", f"装置：{dev}", ""] + ([f"场景：{sc[0]}（底图 {sc[1]}；{sc[2]}）", ""] if sc else [])
    for (sg, la, lb, cap, pic, lab, src, note) in LINES:
        if sg != seg: continue
        n += 1
        lines = cap.split("\n")
        head = f"{n}. {fmt(la)}–{fmt(lb)}　{lines[0]}" + ("" if len(lines) > 1 else (f"（{src}）" if src else ""))
        out.append(head)
        for k, l in enumerate(lines[1:]):
            out.append(f"　　　　　　　{l}" + (f"（{src}）" if src and k == len(lines) - 2 else ""))
        out.append(f"   （画面：{pic}）")
        if lab and lab != "—": out.append(f"   〔标注〕{lab}")
        out.append(f"   // 批注：{note}" if note else "   // 批注：")
        out.append("")
out += ["---", "", "## 注释带（顶部，每段一条）", ""]
out += [f"- {fmt(a)}–{fmt(b)}　{s}" for a, b, s in NOTES]
out += ["", "## 声音注记", "",
        "- 全片无人声。BGM 沿用 Aurelia 系（见分镜脚本第 4 节），拟音给每一次落位一个声音。",
        "- 五盏灯熄灭那一下音乐进；链条扣上、活动片张开是重击；问句出现后 BGM 不收，结尾一闪硬切。",
        "- 评论区置顶：资料出处＋「本片由代码生成，无实拍素材」。", ""]
(HERE / "字幕文案.md").write_text("\n".join(out), encoding="utf-8")

# ── 分镜脚本.md 的字幕表 ──
cap_rows = ["| # | 段 | 入 s | 出 s | 字幕 | 字/秒 |", "|---|---|---|---|---|---|"]
for i, (seg, a, b, cap, *_r) in enumerate(LINES, 1):
    cap_rows.append(f"| {i} | {seg} | {fmt(a)} | {fmt(b)} | {plain(cap).replace('|', '｜')} | {count(cap) / (b - a):.2f} |")
tpl = (HERE / "_gen" / "分镜骨架.md").read_text(encoding="utf-8")
seg_rows = ["| 段 | 时间 | 时长 | 装置 |", "|---|---|---|---|"] + [f"| {s} {nm} | {fmt(a)}–{fmt(b)} s | {b - a:.1f} s | {d} |" for s, nm, a, b, d in SEGMENTS]
scene_rows = ["| 段 | 场景 | 底图 | 处理 |", "|---|---|---|---|"] + [f"| {k} | {v[0]} | {v[1]} | {v[2]} |" for k, v in SCENES.items()]
(HERE / "分镜脚本.md").write_text(tpl.replace("{{SCENES}}", "\n".join(scene_rows)).replace("{{SEGMENTS}}", "\n".join(seg_rows)).replace("{{CAPTIONS}}", "\n".join(cap_rows)), encoding="utf-8")

print(f"{len(LINES)} 句，最高 {max(rates):.2f} 字/秒，平均 {sum(rates) / len(rates):.2f}")
print("问题：" + ("；".join(problems) if problems else "无"))

# ── 回填工程：captions.js（字幕＋注释带），唯一来源仍是 script.py ──
PROJ = HERE.parent / "videos" / "rb19-analysis" / "assets" / "js" / "captions.js"
if PROJ.parent.exists():
    js = ["// 由 03-分镜脚本/_gen/make_docs.py 从 script.py 生成，不要手改。字幕：[入秒, 出秒, 文本]；注释带：[入秒, 出秒, 文本]。", "window.CAPTIONS = ["]
    for k, (seg, a, b, cap, *_r) in enumerate(LINES):
        noshow = k == len(LINES) - 1  # 结尾问句画在画面中央，不进滚动字幕，只进 SRT
        txt = re.sub(r"\*\*(.+?)\*\*", r"<hi>\1</hi>", cap).replace('"', '\\"').replace("\n", "\\n")
        js.append(f'  [{a}, {b}, "{txt}"' + (', "noshow"' if noshow else '') + '],')
    js += ["];", "window.NOTES = ["] + [f'  [{a}, {b}, "{s}"],' for a, b, s in NOTES] + ["];", ""]
    PROJ.write_text("\n".join(js), encoding="utf-8")
    print("写入", PROJ)
