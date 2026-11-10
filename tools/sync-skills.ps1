# 把 HyperFrames 技能从 .claude 同步到 ~/.dsh/skills
# 背景：DeepSeek Harness 只读得到一部分 .claude/skills（21 个里只认 12 个），
#       但读 ~/.dsh/skills 是可靠的。所以以 DSH 那份为准。
#
# 用法（仓库根目录）： pwsh -File tools/sync-skills.ps1
#                    pwsh -File tools/sync-skills.ps1 -DryRun

param([switch]$DryRun)

$ErrorActionPreference = "Stop"
$src = Join-Path $HOME ".claude\skills"
$dst = Join-Path $HOME ".dsh\skills"

if (-not (Test-Path $src)) { Write-Host "找不到源目录：$src" -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Force -Path $dst | Out-Null

$dirs = Get-ChildItem $src -Directory
Write-Host "源：$src（$($dirs.Count) 个）"
Write-Host "目标：$dst`n"

foreach ($d in $dirs) {
  $target = Join-Path $dst $d.Name
  if (Test-Path $target) {
    # 已存在：只补 SKILL.md（技能正文变了才需要更新）
    $a = (Get-FileHash (Join-Path $d.FullName "SKILL.md") -ErrorAction SilentlyContinue).Hash
    $b = (Get-FileHash (Join-Path $target "SKILL.md") -ErrorAction SilentlyContinue).Hash
    if ($a -eq $b) { Write-Host "  = $($d.Name)" -ForegroundColor DarkGray; continue }
    Write-Host "  ~ $($d.Name)（SKILL.md 有变化）" -ForegroundColor Yellow
    if (-not $DryRun) { Copy-Item $d.FullName $target -Recurse -Force }
  } else {
    Write-Host "  + $($d.Name)" -ForegroundColor Green
    if (-not $DryRun) { Copy-Item $d.FullName $target -Recurse -Force }
  }
}

Write-Host "`n完成。DSH 会热更新技能目录，不用重启。" -ForegroundColor Cyan
