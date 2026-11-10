# vibe 知识大赏

用**代码逐帧渲染**做知识短片，投抖音 `#vibe知识大赏` 赛道。

一期一条，1920×1080 横屏，无旁白，字幕烧进母版。每条片子的画面都是 HTML + SVG + CSS + GSAP：一条驱动 tween，所有状态由 `t` 纯函数算出，任意跳帧画面一致。

> **契约在 [`AGENTS.md`](AGENTS.md)**，现状在 [`STATUS.md`](STATUS.md)，空白表单在 [`_模板/`](_模板/)。本文件只做导览。

## 硬规格

1920×1080 / 30fps / **90–180 秒（主推 90 秒档）** / 无旁白 ＋ 纯器乐 BGM ＋ 拟音 / 字幕烧进母版，SRT 顺手出一份。

完整规格（配色、画面分区、六段叙事弧、音乐标准）见 `AGENTS.md` 第 1 节。

## 目录约定

```
第N期/
  00-提案/        一句话提案 + 受众 + 平台策略 + 结构 + 视觉方向，等用户拍板
  01-调研/        调研档案.md（F-1…F-n，每条带可点链接）+ 原始素材
  02-风格样张/    A/B/C 三个方向的定帧，用户拍板后才往下走
  03-分镜脚本/    逐拍表 + 字幕稿 + 拟音/BGM 点位
  05-封面/        cover.html → 封面 3:4 / 4:3
  06-交付/        4K 母版 + SRT + 封面 + 发布文案
  videos/<slug>/  HyperFrames 工程（真正出片的地方）
```

`videos/<slug>/` 内部（第十四期起的第五代范式）：

```
BRIEF.md               这一期的合同：规格、六段结构、表述边界、素材出处
index.html             1920×1080 容器，data-duration 定总长
assets/style.css       画风与配色
assets/js/beats.js     段落窗口表（单位：秒），唯一的时间真相
assets/js/film.js      入口：一条 tween 0 → duration，每帧按顺序调各段 state(t)
assets/js/world.js     场景根、画布/分组容器
assets/js/rig.js       绘图基元（画框、字块、印章等复用件）
assets/js/sections.js  各段 build/state
assets/js/lib.js       缓动、积分、取色等工具
assets/js/captions.js  字幕表（window.CAPTIONS，烧进母版）
tools/shot.mjs         跳帧截图自检
```

> 1–13 期是旧范式（`s0.js…s7.js` 一段一文件等），接手旧期看那一期自己的结构，别按这里猜。

## 常用命令

在 `第N期/videos/<slug>/` 下：

```bash
# 跳到任意时间截图（改一帧看一眼，最快）
node tools/shot.mjs --page="index.html" 12.5 30.0 61.2

# 出字幕
node tools/srt.mjs

# 校验（必须 0 error 才渲染）
npx hyperframes lint
npx hyperframes check

# 1080p 草稿（用来验运动）
npx hyperframes render -q draft --resolution=landscape -o renders/preview-1080p.mp4

# 4K 母版
npx hyperframes render -q delivery --resolution=landscape-4k -o renders/x-4k.mp4
```

在 `第N期/05-封面/` 下：`node render.mjs`

## 各期

| 期 | 题目 | 时长 | 状态 |
| --- | --- | --- | --- |
| 一 | 信息茧房 | 160.2s | 未归档 |
| 二 | 她经济 | 180.0s | 未归档 |
| 三 | 蒸馏 | 160.2s | 未归档 |
| 四 | 柏拉图式恋爱 | 160.2s | 未归档 |
| 五 | 从第一性原理理解调色 | 160.2s | 未归档 |
| 六 | AI 会把我们带进共产主义吗 | 264.9s | 已交付 |
| 七 | 一棵树长出整个计算机世界 | 182.0s | 已交付 |
| 八 | 为什么一年比一年过得快 | 93.6s | 已交付 |
| 九 | Markdown：AI 的最爱 | 93.6s | 已交付 |
| 十 | Claude 的自白书 | 146.7s | 已交付 |
| 十一 | 魔方——上帝的玩具 | 218.8s | 已交付 |
| 十二 | 被曲解的词语 01 · 原生家庭 | 93.6s | 被平台拒发，未上线 |
| 十三 | 社会进步了，为什么我反而更累 | 85.0s | 已交付 |
| 十四 | "打工人"去哪了 | 90.0s | 进行中，差母版与归档 |
| 十五 | 织布的人，为什么不知道自己织的是什么 | 90.0s | 已交付，待发布 |

## 技能

HyperFrames 技能以 `~/.dsh/skills/` 为准，同步命令见 `tools/sync-skills.ps1`。

---

> **公开快照说明**：本仓库是公开镜像，只收录源码、文档与脚本。成片、素材、模型权重与工程文件
> 留在本地源目录，因此部分链接指向的文件不在此仓库内。导出来源与剔除明细见
> [PUBLISH-NOTE.md](PUBLISH-NOTE.md)。
