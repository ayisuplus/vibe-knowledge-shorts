---
workflow: general-video
flow: companion
aspect: 1920x1080
language: zh-CN
episode: 26
---

# 《RB19 为什么能赢？》 · 第 26 期正片工程（v2.0 技术解析）

- **规格**：1920×1080，30fps，180.4 秒，无旁白，字幕烧进母版。v1《从零造一台 RB19》（整车 3D）已被用户否决，工程留在 `../rb19-build/` 作素材库。
- **文字源**：字幕、注释带唯一来源是 `../../03-分镜脚本/_gen/script.py`；在 03-分镜脚本 下跑 `python _gen/make_docs.py`，同时生成字幕文案、分镜脚本和本工程的 `assets/js/captions.js`。**不要手改 captions.js。**
- **画面自解释**（`AGENTS.md` 1.3.1）：标注用 `hud.js` 的 `defineLabels`（full＝名字＋作用，tag＝名字，proc＝过程），示意线用 `defineMarks`（箭头、标尺）。`?nocap=1` 隐藏字幕做静音验收。

## 结构（层从下到上：环境 → 线稿与分析图 → 机械特写 → 叠层 → HUD）

| 文件 | 内容 |
|---|---|
| `beats.js` | 段落窗口；拍网格（112.96 BPM）；`Q()` 吸整拍、`H()` 吸半拍；`OUT`＝五盏灯熄灭＝第 12 拍（6.374 s） |
| `timeline.js` | **事件时刻表（纯数据）**：每段的动作时刻、场景硬切 `CUTS`；画面和拟音都读它 |
| `env.js` | 真实场所底图（赛道发车格、P 房、赛道沥青近景）：关键帧表驱动缓推、虚化、压暗、硬切；发车灯点在照片灯架上 |
| `art/svg.js` | 线稿层基元：建元素、逐笔描出、毫米坐标机位 |
| `art/side.js` | 侧视线稿车（RB19 毫米坐标，来自样张 A2；对比车同轮廓灰色） |
| `art/linecar.js` | 整车线稿全片的出场：S2 画出、S4 末推向前轮、S5 对比与并排刹车（离地间隙标尺）、S6 车尾梁翼与阻力、S8 收成图标 |
| `art/s2.js` | 莲花 79 轮廓、平底板、年份牌、毕业设计纸页（示意） |
| `art/section.js` | S3/S4 车底剖面：粒子按飞行时间表反查（纯 t），低压区、下压力、失速与弹跳、波浪轨迹 |
| `art/top.js` | S3 俯视线稿（侧箱下切斜线、气流）、进气口截面前后对比、车底亮起与闪烁 |
| `art/chain.js` | 链条四环（S5、S6 末扣上，S7 居中）与 S7 数字牌 |
| `overlay.js` | 方格旗、奖杯、赛季条、片名、数字牌引擎、问句 |
| `hud.js` | 标注引擎（锚点由各层投影成屏幕坐标，安全区 y 135–840）、示意线（箭头、标尺、流线）、字幕、注释带 |
| `mech/host.js` | Machine Skill 宿主：用 kit 的 driven 模式（`new Lab({ driven: true })`），不用它的时钟，每帧设好零件姿态再 `lab.drive(t, 镜头)` |
| `mech/suspension.js` | S5 前悬架特写：刹车两次，车身轻沉即停；拍点硬切换机位 |
| `mech/drs.js` | S6 尾翼特写：DRS 开合两次；第二次硬切到超长焦侧面（拿掉端板看翼型），流线与阻力箭头 |
| `s1.js` | S1 的画面标注 |
| `film.js` | 一条驱动 tween |

## 第三方与生成素材

- **Machine Skill kit**（MIT，含本机改动：driven 模式，2026-11-10）＋ **three@0.170.0**（MIT）：`node tools/vendor-kit.mjs` 打包成 `assets/vendor/labkit.js`，不走 CDN。
- **底图**（Codex 生图，不入库，`AGENTS.md` 4.3）：`assets/bg/track.jpg`、`garage.jpg`（原图 1672×941，转 JPG）、`garage-blur.jpg`（机械特写的背景，已虚化）。提示词、生成日志和做法见 `../../02-风格样张/README.md` 与 `../../02-风格样张/bg/`；换机器从那里复制。`asphalt.jpg`（赛道沥青近景，侧视，白色边线当剖面地面线；提示词 `../../02-风格样张/bg/prompt-asphalt.txt`）。
- 字体 `NotoSansSC-VF.ttf`（OFL，不入库）。

## 声音

- **BGM**：Aurelia 系 `bgm-270.wav`（112.96 BPM），从 2.303 s（重拍）起切；0–6.374 s 静音，五盏灯熄灭那一下音乐进；刹车时让位；结尾硬切。用户 2026-11-09：这条已被抖音官方收录为 BGM，继续沿用。原始出处：存自抖音笔记 7691973908303686757（见 `STATUS.md`）。`node tools/bgm.mjs`。
- **拟音**：`tools/sfx.mjs`，184 个事件，时刻全部读 `timeline.js`；样本引用第二十三期的 OpenGameArt CC0 与 Woosh 生成样本（CC BY-NC 4.0，仅限非商用）；风声、电流声等代码合成。
- 顺序：`node tools/bgm.mjs` → `node tools/sfx.mjs` → `node tools/duck.mjs`。

## 进度

- 2026-11-10：P5 起步。工程骨架、环境层、S1 开场、S5 机械特写打通（Machine Skill 接到时间轴）。
- 2026-11-10：八段全部实现（线稿系统、剖面、俯视、链条、DRS 特写）＋拟音；1080p 草稿 `renders/draft2.mp4`：180.4 s，−13.8 LUFS，峰值 −2.6 dBFS，静止秒 2/180；lint 0 error、check passed。**未经人耳试听**。
