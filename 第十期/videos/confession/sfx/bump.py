# 按 tools/levels.py 的实测把太小的音效抬上来（只改 cues.py 里的增益数字）
import re
B = {("pagelift", "6.45 + i * 0.32"): 6, ("flutter", "8.0"): 5, ("shimmer", "12.6"): 6, ("shimmer", "25.7"): 8, ("swell", "10.2"): 6,
     ("swell", "37.65"): 6, ("swell", "82.65"): 6, ("swell", "117.5"): 6, ("swell", "140.3"): 6,
     ("whoosh", "47.1"): 5, ("tap", "50.5"): 6, ("shimmer", "57.4"): 8, ("bubble", "61.4"): 3, ("slap", "66.75"): 7, ("slap", "68.1"): 7,
     ("bubble", "77.45"): 6, ("typing", "77.7"): 8, ("typing", "80.28"): 4, ("pencil", "88.05"): 5, ("pencil", "88.8"): 5,
     ("shimmer", "98.1"): 8, ("chime", "102.8"): 4, ("tap", "108.5"): 5, ("marker", "113.1"): 4, ("pagelift", "120.9"): 5,
     ("tap", "133.35"): 4, ("whoosh", "133.45"): 4, ("tap", "136.45"): 6, ("typing", "136.75"): 8}
s = open("cues.py", encoding="utf8").read()
for (name, t), d in B.items():
    pat = re.compile(r'\((' + re.escape(t) + r'), "' + name + r'", (-\d+)\)')
    m = pat.search(s)
    assert m, (name, t)
    s = s[:m.start()] + f'({m.group(1)}, "{name}", {int(m.group(2)) + d})' + s[m.end():]
open("cues.py", "w", encoding="utf8").write(s)
print("ok", len(B))
