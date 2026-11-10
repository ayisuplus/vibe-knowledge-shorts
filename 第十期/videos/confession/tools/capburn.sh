#!/usr/bin/env bash
# 审片用：把 renders/confession.srt 烧进视频，另存一份「-字幕预览」。成片不烧字幕。
# 用法（在项目根目录）：bash tools/capburn.sh renders/s0-s2-draft1.mp4
# 字幕样式贴近 ?caps=1 预览：思源黑体粗（tools/capfonts 里放静态 Bold，可变字体 libass 认不出粗体）、深字浅描边，落在字幕区（y 900–1010）。
set -e
in="$1"; out="${in%.mp4}-字幕预览.mp4"
node tools/srt.mjs >/dev/null
# 只截到视频时长内的字幕也没关系：ffmpeg 会忽略超出部分
style="FontName=Noto Sans SC,FontSize=19,Bold=1,PrimaryColour=&H0028231F,OutlineColour=&H00FAF8F7,BorderStyle=1,Outline=1.6,Shadow=0,Alignment=2,MarginV=22"
ffmpeg -y -loglevel error -i "$in" -vf "subtitles=renders/confession.srt:fontsdir=tools/capfonts:force_style='${style}'" \
  -c:v h264_nvenc -preset p5 -cq 21 -c:a copy "$out"
echo "$out"
