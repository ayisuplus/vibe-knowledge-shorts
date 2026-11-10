# 测 BGM 的真实拍点（画面跟着音乐走，不硬拉音乐）。MiniMax 不守拍，所以每一拍都实测。
# 用法：python -I beats.py raw/main_2402.flac [--json out.json]
# 打印：第一拍、拍间隔统计、开头是否有空白；--json 时把拍点表写出来，供 make_docs.py 生成 beats.js。
import json, sys
import numpy as np, librosa

src = sys.argv[1]; out = sys.argv[sys.argv.index("--json") + 1] if "--json" in sys.argv else None
y, sr = librosa.load(src, sr=22050, mono=True)
hop = 256
o = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
_, bt = librosa.beat.beat_track(onset_envelope=o, sr=sr, hop_length=hop, start_bpm=119, tightness=120, units="time")
bt = np.asarray(bt, float)
ibi = np.diff(bt); med = float(np.median(ibi))
# 开头若漏拍（librosa 常从第二小节才开始跟），按中位拍长往前补到第一个明显起音
rms = librosa.feature.rms(y=y, hop_length=hop)[0]; t = librosa.times_like(rms, sr=sr, hop_length=hop)
first_sound = float(t[np.argmax(rms > rms.max() * 0.1)])
while bt[0] - med > first_sound - 0.12: bt = np.insert(bt, 0, bt[0] - med)
ibi = np.diff(bt)
print(f"{src}: 起音 {first_sound:.2f}s，第一拍 {bt[0]:.3f}s，共 {len(bt)} 拍，拍长中位 {med:.4f}s（{60 / med:.2f} BPM），范围 {ibi.min():.3f}–{ibi.max():.3f}，标准差 {ibi.std() * 1000:.1f} ms")
bad = np.where(np.abs(ibi - med) > 0.06)[0]
print(f"  偏离中位 >60 ms 的拍间隔：{len(bad)} 处", [round(float(bt[i]), 2) for i in bad[:12]])
# 写出：cut = 第一拍在原曲里的时刻（bgm.mjs 从这里切入）；beats = 相对第一拍的秒数，第 0 拍 = 0 秒
if out:
    c = float(bt[0])
    json.dump({"src": src.replace("\\", "/"), "cut": round(c, 4), "beats": [round(float(b) - c, 4) for b in bt]}, open(out, "w"))
    print("  写入", out)
