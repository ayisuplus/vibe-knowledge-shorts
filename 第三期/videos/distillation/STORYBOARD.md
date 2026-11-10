---
message: "模型蒸馏蒸出来的，是老师的「犹豫」（错答案之间的细微差别），而不只是答案"
mode: autonomous
source: ../../03-分镜脚本/分镜脚本.md
---

# 分镜（调度清单）

逐镜内容、时间、屏幕文字以 `../../03-分镜脚本/分镜脚本.md` 为准；本文件只记录每段的实现方式。全片是一个整体合成（index.html + assets/js/），不拆子合成：一座蒸馏塔贯穿全片，段与段之间是同一批元素变形，不是硬切。

## Frame 1
status: building
src: assets/js/s1s2.js
time: 0–10.69
rules: svg-path-draw, chromatic-glitch（青/琥珀两色，不用红蓝）, scale-swap-transition
beat: 你以为的蒸馏（全息化学装置）→ 6.43 变形 → 实际上的蒸馏（大模型滴出小模型）

## Frame 2
status: building
src: assets/js/s1s2.js
time: 10.69–17.05
rules: kinetic-beat-slam, ambient-glow-bloom
beat: 片名 模型蒸馏

## Frame 3
status: building
src: assets/js/s3s4.js
time: 17.05–29.83
rules: spring-pop-entrance, svg-path-draw
beat: 大模型聪明但贵；小模型便宜但笨；能不能学到本事

## Frame 4
status: building
src: assets/js/s3s4.js
time: 29.83–68.09
rules: stat-bars-and-fills, control-target-sync（旋钮与光柱同拍）, counting-dynamic-scale
beat: 打分 → 标准答案 → 调高温度 → 暗知识 → 公式 → 学生学打分 → 调回 1 上岗

## Frame 5
status: outline
time: 68.09–87.21
rules: depth-scatter-assemble（光点拼出 3）, kinetic-beat-slam
beat: 没见过的 3，98.6%

## Frame 6
status: outline
time: 87.21–93.59
rules: spring-pop-entrance, multi-phase-camera
beat: 被拒稿的论文 → 大模型时代

## Frame 7
status: outline
time: 93.59–121.23
rules: stat-bars-and-fills, svg-path-draw
beat: 三种蒸法 → 28.9% 对 9.3% → 本地 DeepSeek 7B 是 Qwen

## Frame 8
status: outline
time: 121.23–148.86
rules: theme-crossfade-morph（转红/退红）, counting-dynamic-scale
beat: 争议段

## Frame 9
status: outline
time: 148.86–160.17
rules: scale-swap-transition, particle-burst
beat: 变回化学装置，三滴，火灭，片名
