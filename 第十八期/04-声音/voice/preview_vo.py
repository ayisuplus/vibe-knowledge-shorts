# 按 timeline.json 的起始时间把 ../vo-trim/NN.wav 放到 120 秒轨上 → ../旁白预览.wav / .mp3（−16 LUFS）
import json, os, sys, subprocess
import numpy as np
sys.stdout.reconfigure(encoding='utf-8')
HERE = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(HERE, '../../03-分镜脚本/_gen')
TRIM = os.path.join(HERE, '../vo-trim')
SR, DUR = 24000, 120.0
T = json.load(open(os.path.join(GEN, 'timeline.json'), encoding='utf-8'))
track = np.zeros(int(SR * DUR), dtype=np.float32)
for i, x in enumerate(T, 1):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(TRIM, f'{i:02d}.wav'), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32)
    s = int(round(x['start'] * SR)); track[s:s + len(a)] += a[:len(track) - s]
wav = os.path.join(HERE, '../旁白预览.wav')
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '48000', wav], input=track.tobytes(), check=True)
subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, '-c:a', 'libmp3lame', '-q:a', '2', wav[:-4] + '.mp3'], check=True)
print('ok', wav)
