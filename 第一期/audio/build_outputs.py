# -*- coding: utf-8 -*-
"""
卡点表全套产物生成：
1) 节拍/重拍/段落/重音分析
2) Excel 卡点表（使用说明 / 关键卡点 / 段落结构 / 逐拍明细）
3) 节拍可视化 PNG
4) 剪映可导入的卡点标记 SRT
5) 节拍参考音 click MP3（强拍高音/次强中音/弱拍低音/重音脆音）
"""
import json
import numpy as np
import librosa
from scipy.signal import butter, filtfilt
from scipy.ndimage import median_filter

# ============ 路径 ============
SRC_WAV = r"E:\projects\临时目录\_beat_src.wav"
BASE = r"E:\projects\临时目录\Aurelia - We Never Choose（改编版）"
XLSX = BASE + "-卡点表.xlsx"
PNG = BASE + "-节拍可视化.png"
SRT = BASE + "-卡点标记(剪映导入).srt"
CLICK_WAV = r"E:\projects\临时目录\_click.wav"
CLICK_MP3 = BASE + "-节拍参考音.mp3"
HOP, SR = 512, 44100
FPS = 30  # 剪映时间轴帧速率

# ============ 1. 分析 ============
print(">> load + HPSS")
y, sr = librosa.load(SRC_WAV, sr=SR, mono=True)
dur = float(librosa.get_duration(y=y, sr=sr))
y_harm, y_perc = librosa.effects.hpss(y)
onset_env = librosa.onset.onset_strength(y=y_perc, sr=sr, hop_length=HOP)
b, a = butter(4, 150.0 / (sr / 2), btype="low")
y_low = filtfilt(b, a, y)
onset_low = librosa.onset.onset_strength(y=y_low, sr=sr, hop_length=HOP)
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=HOP)[0]

tempo, beats = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr, hop_length=HOP, trim=False)
tempo = float(np.atleast_1d(tempo)[0])
beat_t = librosa.frames_to_time(beats, sr=sr, hop_length=HOP)
n = len(beat_t)
bs = onset_env[beats].astype(float)
bl = onset_low[beats].astype(float)

def norm(x):
    x = np.asarray(x, float); r = x.max() - x.min()
    return (x - x.min()) / r if r > 1e-12 else np.zeros_like(x)

beat_score = 0.55 * norm(bs) + 0.45 * norm(bl)
METER = 4  # 诊断已确认 4/4
phase = int(np.argmax([beat_score[np.arange(n) % METER == p].mean() for p in range(METER)]))
beat_in_bar = np.array([(i - phase) % METER + 1 for i in range(n)])
bar_no = np.cumsum(beat_in_bar == 1)
# 首拍若不是第1拍，小节号从1开始
if beat_in_bar[0] != 1:
    bar_no = bar_no + 1

# ---- 小节级特征 ----
# 注意：本曲母带响度恒定（RMS 全程接近满格），段落差异只体现在打击活动度
# （onset 均值 = 鼓组疏密；低频 onset = 底鼓），因此能量口径不含 RMS。
db_idx = np.where(beat_in_bar == 1)[0]
db_t = beat_t[db_idx]
nbars = len(db_t)
bar_on, bar_low = [], []
for bi, t0 in enumerate(db_t):
    t1 = db_t[bi + 1] if bi + 1 < nbars else dur
    f0, f1 = int(t0 * sr / HOP), int(t1 * sr / HOP)
    bar_on.append(float(onset_env[f0:f1].mean()))
    bar_low.append(float(onset_low[f0:f1].mean()))
bar_on, bar_low = map(lambda z: norm(np.array(z)), (bar_on, bar_low))
bar_energy = 0.55 * bar_on + 0.45 * bar_low
# 3 小节三角平滑（保留短促 break 的边界）
_w = np.array([0.22, 0.56, 0.22])
bar_sm = np.convolve(np.pad(bar_energy, 1, mode="edge"), _w, mode="valid")

# ---- 段落切分：break 与主体在数据上完全分离（≤0.4 vs ≥0.6），阈值取 0.5 ----
BREAK_TH = 0.50
is_break = bar_sm < BREAK_TH
runs, s0 = [], 0
for i in range(1, nbars):
    if is_break[i] != is_break[s0]:
        runs.append((s0, i - 1, 0 if is_break[s0] else 1)); s0 = i
runs.append((s0, nbars - 1, 0 if is_break[s0] else 1))

# 主体段内按相对能量标小节级高/中（用于拍级能量列与数据条）
main_mask = ~is_break
q66_main = np.quantile(bar_sm[main_mask], 0.66)
bar_level = np.where(is_break, 0, np.where(bar_sm >= q66_main, 2, 1))

# ---- 乐句高潮点：8 小节滚动能量的局部峰（只在主体段内）----
from scipy.signal import find_peaks
roll8 = np.convolve(np.pad(bar_sm, (4, 3), mode="edge"), np.ones(8) / 8, mode="valid")
peaks, _ = find_peaks(roll8, distance=10, prominence=0.02)
peaks = [p for p in peaks if not is_break[p] and 2 <= p < nbars - 2]
peak_set = set()
for p in peaks:
    for q in range(p - 1, p + 2):
        peak_set.add(q)

# ---- 段落命名 ----
sections = []
for k, (rs0, rs1, lv_code) in enumerate(runs):
    isbr = (lv_code == 0)
    t0 = float(db_t[rs0]); t1 = float(db_t[rs1 + 1]) if rs1 + 1 < nbars else dur
    nb = rs1 - rs0 + 1
    mean_e = float(bar_sm[rs0:rs1 + 1].mean())
    if isbr:
        if k == len(runs) - 1:
            label, tip, lv = "尾奏 Outro", "全曲收束：淡出、定格、结尾字幕卡", 0
        elif k == 0:
            label, tip, lv = "前奏留白 Intro", "氛围建立：淡入、标题卡、慢镜头", 0
        else:
            label, tip, lv = "留白 Break（鼓组撤出）", "鼓点抽空=情绪段：慢镜头/特写/淡入淡出，段尾强拍准备重新进入", 0
    else:
        if k == 0:
            label, tip, lv = "开场段（高能进入）", "开场即高能：强拍硬切、动效拉满，先声夺人", 2
        else:
            label, tip, lv = "主体行进段", "保持稳定剪辑密度（强拍换镜）；乐句高潮点安排高光镜头/特效", 1
    sections.append(dict(k=k + 1, start=round(t0, 3), end=round(t1, 3),
                         bars=nb, level=lv, label=label, tip=tip,
                         energy=round(mean_e, 3)))

bar_to_sec = {}
for s in sections:
    for bb in range(s["k"] - 1, s["k"] - 1 + s["bars"]):
        bar_to_sec[bb + 1] = s

# 乐句高潮事件（峰中心小节的强拍时间）
phrase_peaks = []
for p in peaks:
    phrase_peaks.append(dict(t=round(float(db_t[p]), 3),
                             bar=int(p + 1), energy=round(float(roll8[p]), 3)))


# ---- 非拍位重音：贪心取间隔≥0.6s 的最强点，最多24个 ----
on_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=HOP)
on_t = librosa.frames_to_time(on_frames, sr=sr, hop_length=HOP)
on_s = norm(onset_env[on_frames].astype(float))
cand = sorted([(float(tt), float(ss)) for tt, ss in zip(on_t, on_s)
               if ss > 0.55 and np.min(np.abs(beat_t - tt)) >= 0.11],
              key=lambda x: -x[1])
accents = []
for tt, ss in cand:
    if all(abs(tt - x[0]) >= 0.6 for x in accents):
        accents.append((tt, ss))
    if len(accents) >= 24:
        break
accents.sort()

# ---- 逐拍记录 ----
level_name = {0: "留白", 1: "行进", 2: "高能"}
beats_out = []
for i in range(n):
    bn = int(bar_no[i]); bib = int(beat_in_bar[i]); sc = float(beat_score[i])
    sec = bar_to_sec.get(bn, sections[-1])
    bar_lv = int(bar_level[min(bn - 1, nbars - 1)])
    if bib == 1:
        btype = "强拍"
    elif METER == 4 and bib == 3:
        btype = "次强拍"
    else:
        btype = "弱拍"
    if btype == "强拍":
        if sec["level"] == 0:
            tip = "主切镜点（留白段：建议淡入淡出/慢切）"
        else:
            tip = "主切镜点（场景/镜头切换）"
    elif btype == "次强拍":
        tip = "副切镜点（小转场/景别变化）"
    elif sc > 0.62:
        tip = "重音弱拍（卡缩放/特效，可不切镜）"
    else:
        tip = "弱拍（动作衔接，保持镜头）"
    beats_out.append(dict(idx=i + 1, t=round(float(beat_t[i]), 3), bar=bn, beat=bib,
                          type=btype, strength=round(sc, 3),
                          level=level_name[bar_lv], section=sec["label"], tip=tip))

data = dict(duration=round(dur, 3), tempo=round(tempo, 2), meter=METER,
            nbeats=n, nbars=nbars, sections=sections, beats=beats_out,
            phrase_peaks=phrase_peaks,
            accents=[dict(t=round(t, 3), strength=round(s, 3)) for t, s in accents])
json.dump(data, open(r"E:\projects\临时目录\beat_data.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f">> analysis: {tempo:.2f} BPM, {n} beats, {nbars} bars, {len(sections)} sections, {len(accents)} accents")
for s in sections:
    print(f"   {fmt_t(s['start']) if False else s['start']:7.2f}-{s['end']:7.2f} L{s['level']} {s['label']} ({s['bars']}小节)")

# ============ 工具函数 ============
def tc(t):
    m = int(t // 60); s = t - m * 60
    return f"{m:02d}:{s:06.3f}"

def frame30(t):
    return int(round(t * FPS))

# ============ 2. Excel ============
print(">> build xlsx")
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.table import Table, TableStyleInfo
from openpyxl.formatting.rule import DataBarRule

C_HDR = "17365D"; C_HDR_FILL = PatternFill("solid", fgColor=C_HDR)
C_DOWN = PatternFill("solid", fgColor="FDE8E8")   # 强拍行底（浅红，语义强调）
C_MID = PatternFill("solid", fgColor="FFF6E5")    # 次强拍（浅橙）
C_L0 = PatternFill("solid", fgColor="EFEFEF")     # 留白段
C_L1 = PatternFill("solid", fgColor="FFFFFF")
C_L2 = PatternFill("solid", fgColor="EAF2FB")     # 高能段
C_SEC = PatternFill("solid", fgColor="D9E7F6")
THIN = Side(style="thin", color="B8C7D9")
BORDER_BOTTOM = Border(bottom=THIN)
F_HDR = Font(name="微软雅黑", bold=True, color="FFFFFF", size=11)
F_BODY = Font(name="微软雅黑", size=10)
F_TITLE = Font(name="微软雅黑", bold=True, size=14, color="17365D")
AL_C = Alignment(horizontal="center", vertical="center")
AL_L = Alignment(horizontal="left", vertical="center", wrap_text=True)

wb = Workbook()

def style_header(ws, row, ncol):
    for c in range(1, ncol + 1):
        cell = ws.cell(row=row, column=c)
        cell.fill = C_HDR_FILL; cell.font = F_HDR; cell.alignment = AL_C
        cell.border = BORDER_BOTTOM

# ---- Sheet 使用说明 ----
ws0 = wb.active; ws0.title = "使用说明"
ws0.sheet_view.showGridLines = False
rows = [
    ("《We Never Choose（改编版）》卡点表 · 使用说明", "title"),
    ("", None),
    ("基础信息", "h"),
    (f"时长 {tc(dur)}（{dur:.1f} 秒） · 速度 {tempo:.2f} BPM · 拍号 {METER}/4 · 共 {n} 拍 / {nbars} 小节", "t"),
    ("节拍稳定（拍间隔波动 ≈1.3%），全曲无变速，可直接按固定拍点剪辑", "t"),
    ("", None),
    ("Sheet 导航", "h"),
    ("① 关键卡点：段落边界 + 全部小节强拍 + 加花重音，剪辑时主要看这一页", "t"),
    ("② 段落结构：开场 / 主体行进 / 留白 Break（鼓组撤出）/ 尾奏，附剪辑建议", "t"),
    ("③ 逐拍明细：302 个拍点完整列表，支持按拍型/段落/强度筛选", "t"),
    ("", None),
    ("配套文件", "h"),
    ("卡点标记(剪映导入).srt：剪映「文本 → 本地字幕 → 导入SRT」，强拍/段落/重音直接显示在时间轴上", "t"),
    ("节拍参考音.mp3：原曲叠加节拍器音（强拍=高音“叮”、次强=中音、弱拍=低音“哒”、重音=脆音），用于耳听核对与对齐", "t"),
    ("节拍可视化.png：波形 + 能量曲线 + 小节线 + 段落色块总览", "t"),
    ("", None),
    ("剪辑用法", "h"),
    ("强拍（每小节第1拍，约 2.14 秒一个）：主切镜点；主体段建议每个强拍换镜或 2 小节一换", "t"),
    ("次强拍（第3拍）：小转场/景别变化；弱拍：做镜头运动与动作衔接，不要硬切", "t"),
    ("段落边界（◆）：本曲响度恒定、整体高能，最大转场点是两处留白 Break 的进入与退出（鼓组撤出/重回）", "t"),
    ("乐句高潮（★）：8 小节能量峰，安排高光镜头或特效；加花重音（✦，不在正拍上）：卡缩放、闪白、音效", "t"),
    ("", None),
    ("说明：节拍点由 librosa 节拍追踪生成（误差通常 <20ms）；段落为按能量/打击密度自动聚类，属参考性质，建议结合听感微调。", "note"),
]
r = 1
for text, kind in rows:
    cell = ws0.cell(row=r, column=1, value=text)
    if kind == "title":
        cell.font = F_TITLE
    elif kind == "h":
        cell.font = Font(name="微软雅黑", bold=True, size=12, color="FFFFFF")
        cell.fill = C_HDR_FILL
        ws0.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
        cell.alignment = Alignment(horizontal="left", vertical="center")
    elif kind == "note":
        cell.font = Font(name="微软雅黑", size=9, italic=True, color="808080")
        cell.alignment = AL_L; ws0.row_dimensions[r].height = 30
        ws0.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
    elif kind == "t":
        cell.font = F_BODY; cell.alignment = AL_L
        ws0.row_dimensions[r].height = 22
        ws0.merge_cells(start_row=r, start_column=1, end_row=r, end_column=8)
    r += 1
ws0.column_dimensions["A"].width = 110

# ---- Sheet 段落结构 ----
ws1 = wb.create_sheet("段落结构")
h1 = ["段号", "开始", "结束", "时长(s)", "时间码(起)", "时间码(止)", "小节数",
      "能量等级", "能量值", "段落", "剪辑建议"]
ws1.append(h1); style_header(ws1, 1, len(h1))
lv_text = {0: "留白 ▽", 1: "行进 ◇", 2: "高能 ◆"}
for s in sections:
    ws1.append([s["k"], s["start"], s["end"], round(s["end"] - s["start"], 2),
                tc(s["start"]), tc(s["end"]), s["bars"], lv_text[s["level"]],
                s["energy"], s["label"], s["tip"]])
for rr in range(2, ws1.max_row + 1):
    lv = sections[rr - 2]["level"]
    fill = C_L0 if lv == 0 else (C_L2 if lv == 2 else C_L1)
    for cc in range(1, len(h1) + 1):
        cell = ws1.cell(row=rr, column=cc); cell.font = F_BODY; cell.fill = fill
        cell.alignment = AL_L if cc in (10, 11) else AL_C
    ws1.row_dimensions[rr].height = 26
widths1 = [6, 8, 8, 8, 12, 12, 7, 9, 8, 16, 46]
for i, w in enumerate(widths1, 1):
    ws1.column_dimensions[get_column_letter(i)].width = w
ws1.freeze_panes = "A2"

# ---- Sheet 逐拍明细 ----
ws2 = wb.create_sheet("逐拍明细")
h2 = ["拍号", "时间码", "秒", "帧@30fps", "小节", "拍", "拍型", "强度", "能量", "段落", "剪辑建议"]
ws2.append(h2); style_header(ws2, 1, len(h2))
for bt in beats_out:
    ws2.append([bt["idx"], tc(bt["t"]), bt["t"], frame30(bt["t"]),
                bt["bar"], bt["beat"], bt["type"], bt["strength"],
                bt["level"], bt["section"], bt["tip"]])
for rr in range(2, ws2.max_row + 1):
    bt = beats_out[rr - 2]
    fill = C_DOWN if bt["type"] == "强拍" else (C_MID if bt["type"] == "次强拍" else None)
    for cc in range(1, len(h2) + 1):
        cell = ws2.cell(row=rr, column=cc); cell.font = F_BODY
        cell.alignment = AL_L if cc == 11 else AL_C
        if fill: cell.fill = fill
widths2 = [6, 11, 8, 9, 6, 5, 8, 8, 7, 15, 40]
for i, w in enumerate(widths2, 1):
    ws2.column_dimensions[get_column_letter(i)].width = w
ws2.freeze_panes = "A2"
tab = Table(displayName="逐拍明细", ref=f"A1:K{ws2.max_row}")
tab.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=False, showColumnStripes=False)
ws2.add_table(tab)
ws2.conditional_formatting.add(f"H2:H{ws2.max_row}",
    DataBarRule(start_type="num", start_value=0, end_type="num", end_value=1,
                color="5B9BD5", showValue=True))

# ---- Sheet 关键卡点 ----
ws3 = wb.create_sheet("关键卡点")
h3 = ["序号", "时间码", "秒", "帧@30fps", "类型", "标记", "剪辑建议"]
ws3.append(h3); style_header(ws3, 1, len(h3))
events = []
for s in sections:
    events.append((s["start"], "段落边界 ◆", f"进入「{s['label']}」（{s['bars']}小节）", s["tip"]))
for pp in phrase_peaks:
    events.append((pp["t"], "乐句高潮 ★", f"第 {pp['bar']} 小节附近（8小节能量峰）", "安排高光镜头/特效/画面最亮点"))
for bt in beats_out:
    if bt["type"] == "强拍":
        events.append((bt["t"], "小节强拍", f"第 {bt['bar']} 小节 第1拍",
                       "主切镜点" + ("（留白段轻切）" if bt["level"] == "留白" else "")))
for ac in data["accents"]:
    events.append((ac["t"], "加花重音 ✦", f"非拍位重音（强度 {ac['strength']:.2f}）", "卡缩放/闪白/音效"))
events.sort(key=lambda x: x[0])
for i, (t, typ, mark, tip) in enumerate(events, 1):
    ws3.append([i, tc(t), round(t, 3), frame30(t), typ, mark, tip])
for rr in range(2, ws3.max_row + 1):
    typ = ws3.cell(row=rr, column=5).value
    fill = C_SEC if "段落" in typ else (PatternFill("solid", fgColor="E7DBF2") if "高潮" in typ
                                        else (C_DOWN if "强拍" in typ else C_MID))
    for cc in range(1, len(h3) + 1):
        cell = ws3.cell(row=rr, column=cc); cell.font = F_BODY
        cell.alignment = AL_L if cc in (6, 7) else AL_C; cell.fill = fill
    ws3.row_dimensions[rr].height = 20
widths3 = [6, 11, 8, 9, 12, 34, 34]
for i, w in enumerate(widths3, 1):
    ws3.column_dimensions[get_column_letter(i)].width = w
ws3.freeze_panes = "A2"
tab3 = Table(displayName="关键卡点", ref=f"A1:G{ws3.max_row}")
tab3.tableStyleInfo = TableStyleInfo(name="TableStyleLight9", showRowStripes=False, showColumnStripes=False)
ws3.add_table(tab3)

# sheet 顺序：使用说明 / 关键卡点 / 段落结构 / 逐拍明细
wb.move_sheet("关键卡点", offset=-2)  # 使用说明 → 关键卡点 → 段落结构 → 逐拍明细
wb.save(XLSX)
print(f">> saved {XLSX}")

# ============ 3. SRT ============
print(">> build srt")
srt_events = []
for s in sections:
    srt_events.append((s["start"], f"◆ {s['label']}"))
for pp in phrase_peaks:
    srt_events.append((pp["t"], f"★ 乐句高潮(第{pp['bar']}小节)"))
for bt in beats_out:
    if bt["type"] == "强拍":
        srt_events.append((bt["t"], f"▸ 小节{bt['bar']}"))
for ac in data["accents"]:
    srt_events.append((ac["t"], "✦ 重音"))
srt_events.sort(key=lambda x: x[0])
# 合并同点事件（如段落边界与小节1强拍重合），避免剪映中字幕重叠
merged = []
for t, txt in srt_events:
    if merged and abs(t - merged[-1][0]) < 0.05:
        merged[-1] = (merged[-1][0], merged[-1][1] + "\n" + txt)
    else:
        merged.append((t, txt))
srt_events = merged

def srt_t(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); sec, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{sec:02d},{ms:03d}"

lines = []
for i, (t, txt) in enumerate(srt_events):
    end = t + 0.8
    if i + 1 < len(srt_events):
        end = min(end, srt_events[i + 1][0] - 0.05)
    if end < t + 0.25:
        end = t + 0.25
    lines += [str(i + 1), f"{srt_t(t)} --> {srt_t(end)}", txt, ""]
open(SRT, "w", encoding="utf-8-sig").write("\n".join(lines))
print(f">> saved {SRT} ({len(srt_events)} markers)")

# ============ 4. Click 参考音 ============
print(">> build click track")
import soundfile as sf
sig = y.astype(np.float32) * 0.72

def add_click(sig, t, freq, dur_s, amp, decay=9.0):
    nn = int(sr * dur_s); i0 = int(t * sr)
    idx = np.arange(nn)
    wave = (amp * np.exp(-decay * idx / nn) * np.sin(2 * np.pi * freq * idx / sr)).astype(np.float32)
    end = min(i0 + nn, len(sig))
    if i0 < len(sig):
        sig[i0:end] += wave[:end - i0]

for bt in beats_out:
    if bt["type"] == "强拍":
        add_click(sig, bt["t"], 1000, 0.07, 0.26)
    elif bt["type"] == "次强拍":
        add_click(sig, bt["t"], 760, 0.055, 0.18)
    else:
        add_click(sig, bt["t"], 520, 0.04, 0.10)
for ac in data["accents"]:
    add_click(sig, ac["t"], 1500, 0.06, 0.22, decay=12)
sig = np.clip(sig, -0.98, 0.98)
stereo = np.stack([sig, sig], axis=1)
sf.write(CLICK_WAV, stereo, sr, subtype="PCM_16")
print(f">> saved {CLICK_WAV}")

# ============ 5. PNG 可视化 ============
print(">> build png")
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
plt.rcParams["font.sans-serif"] = ["Microsoft YaHei"]
plt.rcParams["axes.unicode_minus"] = False

fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(17, 7.4), dpi=150, sharex=True,
                               gridspec_kw={"height_ratios": [2.1, 1.3]})
# 波形
wt = np.linspace(0, dur, len(y))
step = max(1, len(y) // 12000)
ax1.fill_between(wt[::step], y[::step], 0, color="#9FB8D6", alpha=0.5, linewidth=0)
ax1.plot(wt[::step], y[::step], color="#6E8BB5", linewidth=0.4, alpha=0.7)
sec_colors = {0: ("D9D9D9", 0.5), 1: ("F4E4C1", 0.16), 2: ("BFD7F2", 0.42)}
short_name = {"开场段（高能进入）": "开场段", "主体行进段": "主体行进段",
              "留白 Break（鼓组撤出）": "留白 Break", "尾奏 Outro": "尾奏",
              "前奏留白 Intro": "前奏"}
for s in sections:
    col, al = sec_colors[s["level"]]
    ax1.axvspan(s["start"], s["end"], color="#" + col, alpha=al, zorder=0)
    if s["end"] - s["start"] >= 6:
        ax1.text((s["start"] + s["end"]) / 2, 0.93, short_name.get(s["label"], s["label"]),
                 ha="center", va="top", fontsize=9, color="#333333",
                 transform=ax1.get_xaxis_transform(), clip_on=True)
for pp in phrase_peaks:
    ax1.plot(pp["t"], 0.99, marker="*", color="#E8A33D", markersize=13,
             transform=ax1.get_xaxis_transform(), clip_on=True, zorder=5)
for bt in beats_out:
    if bt["type"] == "强拍":
        ax1.axvline(bt["t"], color="#D9534F", linewidth=0.7, alpha=0.75)
    elif bt["type"] == "次强拍":
        ax1.axvline(bt["t"], color="#E8A33D", linewidth=0.45, alpha=0.45, linestyle="--")
for ac in data["accents"]:
    ax1.axvline(ac["t"], color="#7B4FB5", linewidth=0.7, alpha=0.7, linestyle=":")
ax1.set_ylim(-1, 1); ax1.set_ylabel("波形 / 小节线", fontsize=10)
ax1.set_title(f"Aurelia - We Never Choose（改编版） · {tempo:.1f} BPM · 4/4 · {tc(dur)}",
              fontsize=13, fontweight="bold", color="#17365D")
legend_h = [Patch(facecolor="#D9534F", label="强拍(小节线)"),
            Patch(facecolor="#E8A33D", label="次强拍/乐句高潮★"),
            Patch(facecolor="#7B4FB5", label="加花重音", hatch="///"),
            Patch(facecolor="#D9D9D9", label="留白 Break"),
            Patch(facecolor="#F4E4C1", label="主体行进段"),
            Patch(facecolor="#BFD7F2", label="高能开场")]
fig.legend(handles=legend_h, loc="lower center", bbox_to_anchor=(0.5, 0.0),
           ncol=6, frameon=False, fontsize=9)

# 能量曲线（灰=留白 Break，金=主体行进，蓝=主体内高能小节）
bar_colors = [["#B5B5B5", "#E8C886", "#5B9BD5"][lv] for lv in bar_level]
bar_w = np.diff(np.append(db_t, dur))
ax2.bar(db_t + bar_w / 2, bar_sm, width=bar_w * 0.92, color=bar_colors, edgecolor="white", linewidth=0.3)
ax2.plot(db_t + bar_w / 2, bar_sm, color="#333333", linewidth=0.9, marker="o", markersize=2.2)
for pp in phrase_peaks:
    ax2.plot(db_t[pp["bar"] - 1] + bar_w[pp["bar"] - 1] / 2, roll8[pp["bar"] - 1] + 0.05,
             marker="*", color="#D9822B", markersize=14, zorder=5)
for s in sections:
    ax2.axvline(s["start"], color="#D9534F", linewidth=1.0, alpha=0.8)
    ax2.text(s["start"], 1.04, f"◆{short_name.get(s['label'], s['label'])}", fontsize=7.5, color="#C0392B",
             ha="left", va="bottom", transform=ax2.get_xaxis_transform(), clip_on=True)
ax2.set_ylabel("段落能量", fontsize=10); ax2.set_ylim(0, 1.0)
ax2.set_xlabel("时间", fontsize=10)
ticks = np.arange(0, int(dur) + 1, 10)
ax2.set_xticks(ticks); ax2.set_xticklabels([tc(t) for t in ticks], fontsize=8)
ax2.set_xlim(0, dur); ax2.grid(axis="y", color="#E0E0E0", linewidth=0.5)
plt.tight_layout(rect=[0, 0.035, 1, 1])
plt.savefig(PNG, bbox_inches="tight", facecolor="white")
print(f">> saved {PNG}")
print(">> DONE")
