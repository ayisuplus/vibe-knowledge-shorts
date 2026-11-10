# 从 assets/js/captions.js 生成 renders/ai-communism.ass：字幕样式跟着画面走（v24，用户 2026-10-15）。
#   开场纸面：墨色；「所有人该怎么活……共产主义」和结尾：鲜红；工人 / 门：暖白；1958 历史：厚重衬线、旧纸色；
#   纸面段（马克思的设想、双层门、图表、钱怎么流）：墨色；AI 段（冷白）：深蓝；夜之城：赛博青色霓虹；光明城：金色。
# 字体：assets/fonts/static/ 里从可变字体导出的固定字重（libass 只认可变字体的常规字重）
# 用法：python -I tools/ass.py
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
src = open(os.path.join(ROOT, "assets", "js", "captions.js"), encoding="utf-8").read()
caps = [(float(a), float(b), json.loads(c)) for a, b, c in re.findall(r'\[([\d.]+), ([\d.]+), ("(?:[^"\\]|\\.)*")\]', src)]

# 名字, 字体, 字号, 文字色, 描边色, 描边, 阴影, 粗体  （颜色写 #RRGGBB）
STYLES = {
    "INK":   ("VibeSansBold", 58, "#2a2018", "#f6eedc", 3.2, 0, 1),
    "RED":   ("VibeSerifBlack", 62, "#e3261c", "#fff4e2", 3.4, 0, 1),
    "WARM":  ("VibeSansBold", 58, "#fff1d6", "#170c04", 3.0, 1, 1),
    "HIST":  ("VibeSerifBlack", 64, "#f1dfbc", "#26170a", 3.6, 1, 1),
    "AI":    ("VibeSansBold", 58, "#0f2a36", "#ffffff", 3.2, 0, 1),
    "CYBER": ("VibeSansBold", 58, "#3ff0f2", "#05202c", 3.0, 0, 1),
    "WHITE": ("VibeSansBold", 58, "#ffffff", "#000000", 3.0, 1, 1),
    "GOLD":  ("VibeSerifBold", 62, "#ffd27a", "#2e1a06", 3.2, 1, 1),
}
# 字幕正文以这些字开头时切换样式，之后的字幕沿用，直到下一个切换点
SWITCH = [
    ("AI 时代", "INK"), ("今天，我们聊一个回答", "RED"), ("听起来很遥远", "INK"), ("这座工厂", "WARM"), ("1958 年", "HIST"),
    ("回到马克思那个设想", "INK"), ("直到 AI", "AI"), ("这把锁，其实", "INK"), ("所以，这把锁的钥匙", "WARM"),
    ("如果，AI 和机器只归", "CYBER"), ("问题不在 AI", "WHITE"), ("如果，AI 和机器归所有人", "GOLD"), ("还记得开头", "WARM"),
    ("愿共产主义", "RED"),
]

def ass_color(hexrgb, alpha=0):
    r, g, b = hexrgb[1:3], hexrgb[3:5], hexrgb[5:7]
    return f"&H{alpha:02X}{b}{g}{r}".upper().replace("&H", "&H")

def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"

out = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1920", "PlayResY: 1080", "WrapStyle: 0", "ScaledBorderAndShadow: yes", "",
       "[V4+ Styles]",
       "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding"]
for name, (font, size, fg, ol, olw, sh, bold) in STYLES.items():
    out.append(f"Style: {name},{font},{size},{ass_color(fg)},&H000000FF,{ass_color(ol)},&H80000000,0,0,0,0,100,100,2,0,1,{olw},{sh},2,80,80,46,1")
out += ["", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
style = "INK"
for a, b, text in caps:
    plain = re.sub(r"<[^>]+>", "", text)
    for key, st in SWITCH:
        if plain.startswith(key):
            style = st
    body = plain.replace("\n", "\\N")
    if style == "CYBER":
        body = "{\\blur2\\4c&H00F0E040&\\4a&H60&\\shad2}" + body  # 霓虹：描边微微发光
    out.append(f"Dialogue: 0,{ts(a)},{ts(b)},{style},,0,0,0,,{body}")
dst = os.path.join(ROOT, "renders", "ai-communism.ass")
open(dst, "w", encoding="utf-8-sig").write("\n".join(out) + "\n")
print(dst, len(caps), "条")
