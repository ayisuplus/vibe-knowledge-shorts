# 检查 ACE 重绘后的《国际歌》还保不保留原旋律：
# ① 每个旋律音的时间窗里，期望音级在色度图里排第几（前 2 名算命中）
# ② 与草稿的逐帧色度相关系数
# 用法：python -I melody_check.py raw/C_intl_*.flac
import json, os, sys
import numpy as np, librosa

HERE = os.path.dirname(os.path.abspath(__file__))
meta = json.load(open(os.path.join(HERE, "mockup_notes.json")))
SR, HOP = 22050, 512


def chroma(path):
    y, _ = librosa.load(path, sr=SR, mono=True)
    return librosa.feature.chroma_cqt(y=y, sr=SR, hop_length=HOP)


ref = chroma(os.path.join(HERE, "mockup.wav"))
for f in sys.argv[1:]:
    c = chroma(f)
    n = min(c.shape[1], ref.shape[1])
    a, b = c[:, :n], ref[:, :n]
    corr = np.mean([np.corrcoef(a[:, i], b[:, i])[0, 1] for i in range(n) if a[:, i].std() > 1e-6 and b[:, i].std() > 1e-6])
    hits = 0
    for note in meta["notes"]:
        i0 = int(note["t"] * SR / HOP); i1 = max(i0 + 1, int((note["t"] + min(note["dur"], 0.6)) * SR / HOP))
        prof = c[:, i0:i1].mean(axis=1)
        rank = list(np.argsort(-prof)).index(note["midi"] % 12)
        hits += rank < 2
    print(f"{os.path.basename(f):28s} melody hit {hits}/{len(meta['notes'])}  chroma corr {corr:.2f}")
