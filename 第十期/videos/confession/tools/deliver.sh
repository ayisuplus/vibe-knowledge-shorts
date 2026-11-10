#!/usr/bin/env bash
# 交付：4K 渲染的音轨做两遍线性 loudnorm（-14 LUFS / -1 dBTP），视频流原样拷贝；再出一份烧了字幕的预览。
# 用法（在项目根目录）：bash tools/deliver.sh renders/confession-4k-raw.mp4
set -e
in="$1"; out="renders/confession-4k.mp4"
m=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-14:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$m" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -v error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1.0:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 48000 -c:a aac -b:a 256k "$out"
echo "measured I $(g input_i)  ->"; ffmpeg -hide_banner -i "$out" -af ebur128=peak=true -f null - 2>&1 | grep -A12 Summary | grep -E "I:|Peak:"
node tools/srt.mjs >/dev/null
style="FontName=Noto Sans SC,FontSize=19,Bold=1,PrimaryColour=&H0028231F,OutlineColour=&H00F6F8FA,BorderStyle=1,Outline=1.6,Shadow=0,Alignment=2,MarginV=22"
ffmpeg -v error -y -i "$out" -vf "subtitles=renders/confession.srt:fontsdir=tools/capfonts:force_style='${style}'" -c:v h264_nvenc -preset p5 -cq 21 -c:a copy "renders/confession-4k-字幕预览.mp4"
echo done
