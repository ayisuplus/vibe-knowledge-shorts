# 静止秒自检（AGENTS.md 第 8 节：静止秒 < 25%）：每秒抽 4 帧（缩到 240×135），一秒内相邻帧平均差都低于阈值即记为静止秒。
# 用法：python -I tools/still.py renders/draft2.mp4
import subprocess, sys
import numpy as np
f = sys.argv[1]; W, H, FPS = 240, 135, 4
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
secs = len(fr) // FPS
still = [s for s in range(secs) if d[s * FPS:(s + 1) * FPS].max(initial=0) < 0.6]
print(f"{secs} 秒，静止秒 {len(still)}（{100 * len(still) / secs:.1f}%）：{still}")
