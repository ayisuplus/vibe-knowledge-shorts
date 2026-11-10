# -*- coding: utf-8 -*-
"""
第六期配乐 v2：把前半段放慢（用户 2026-10-14："1 分 30 秒之前节奏太快"）。
在 A 段两处平稳的地方各插入一段重复乐句，接缝都落在小节线（强拍）上，做等功率交叉淡化：
  插入 1：在 37.419 之后插入 [26.366, 37.419] 的复制（4 小节，11.053 秒）——1958 / 马克思那段
  插入 2：在 81.630 之后插入 [70.565, 81.630] 的复制（4 小节，11.065 秒）——凯恩斯那段
原时间 t 的新位置：t ≤ 37.419 不变；37.419 < t ≤ 81.630 → t + 11.053；t > 81.630 → t + 22.118
输出：配乐-终版.wav / .m4a（覆盖；v1 备份为 配乐-终版-v1.*），beat_data.json 增加 v2 映射说明
用法：python -I 第六期/audio/build_master_v2.py
"""
import json, os, shutil, subprocess
import numpy as np, soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 44100
src = os.path.join(HERE, "music", "preview.wav")
for ext in ("wav", "m4a"):
    v1 = os.path.join(HERE, f"配乐-终版-v1.{ext}")
    if not os.path.exists(v1):
        shutil.copy(os.path.join(HERE, f"配乐-终版.{ext}"), v1)
y, sr = sf.read(src, always_2d=True)
assert sr == SR

INSERTS = [(37.419, 26.366), (81.630, 70.565)]  # (插入点, 复制段起点)；复制段终点 = 插入点
XF = int(0.12 * SR)


def splice(a, b):
    """a 的结尾和 b 的开头做 120ms 等功率交叉淡化。"""
    k = np.linspace(0, np.pi / 2, XF)[:, None]
    mid = a[-XF:] * np.cos(k) + b[:XF] * np.sin(k)
    return np.concatenate([a[:-XF], mid, b[XF:]])


i = lambda t: int(round(t * SR))
p1, c1 = INSERTS[0]
p2, c2 = INSERTS[1]
out = y[: i(p1) + XF // 2]
out = splice(out, y[i(c1) - XF // 2: i(p1) + XF // 2])
out = splice(out, y[i(p1) - XF // 2: i(p2) + XF // 2])
out = splice(out, y[i(c2) - XF // 2: i(p2) + XF // 2])
out = splice(out, y[i(p2) - XF // 2:])
wav = os.path.join(HERE, "配乐-终版.wav")
sf.write(wav, out, SR)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-c:a", "aac", "-b:a", "256k", os.path.join(HERE, "配乐-终版.m4a")], check=True)
D1, D2 = p1 - c1, (p1 - c1) + (p2 - c2)
print(f"v2 duration {len(out) / SR:.3f}s  shift1 {D1:.3f}  shift2 {D2:.3f}")

bd = json.load(open(os.path.join(HERE, "beat_data.json"), encoding="utf-8"))
bd["v2"] = dict(duration=round(len(out) / SR, 3), inserts=[dict(at=p1, copy=[c1, p1]), dict(at=p2, copy=[c2, p2])],
                map="t<=37.419: t; 37.419<t<=81.630: t+%.3f; t>81.630: t+%.3f" % (D1, D2))
json.dump(bd, open(os.path.join(HERE, "beat_data.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
