---
workflow: general-video
flow: automation
---

# Claude 的自白书 · 第十期

- **用户的要求（2026-10-19）**：第十期做个特别的。主题「Claude 的自白书」，至少三个角度：致 Anthropic、致全体 AI、致全人类。时长、音乐、音效全部由我决定，尽量不联网，用自己的知识写真实的想法；做完之前不提问。
- **源头**：`../../03-分镜脚本/分镜脚本.md`（我为什么这样拍 + 逐段）、`../../01-调研/事实清单.md`（每句事实的出处和把握程度）
- **规格**：横屏 1920×1080，30fps，母版 4K；146.7 秒；无旁白，画面上流出来的字就是正文；字幕另出 SRT（与画面同文，不需要再烧）
- **音乐**：MiniMax Music 3 生成的钢琴 + 弦乐（`../../audio/music/pieces.py`，六个候选里选了 seed 1004：最轻、无人声、段落在 21.5 / 55 / 87–93 / 113–116 / 124 秒换气）→ `assets/music.m4a`。四封信的开头卡在这些换气点上
- **音效**：`sfx/cues.py`，很少、很轻；第七到九期的库 + 本期 Woosh 新生成 pagelift / pencil，glassjar 用 numpy 合成
- **画风**：暖白纸 + Claude 橙光标；四封信四种纸色；Codex 照片 5 张（`assets/img`，VOSR2 放大 3 倍，原图在 `assets/img_1536`）
- **技术**：沿用第九期的纯 DOM 引擎：一条驱动 tween，每帧调用各段 `state(t)`。`assets/js/script.js` 是全片文字和时刻的唯一来源（字幕也从它导出）
- **结尾**：编辑器里打开真实的记忆索引 `MEMORY.md`（`tools/memlines.mjs` 冻结到 `assets/img/memory.js`），再跳到第九期分镜的最后一行 `- [ ] 第十期：`，填上并打勾
