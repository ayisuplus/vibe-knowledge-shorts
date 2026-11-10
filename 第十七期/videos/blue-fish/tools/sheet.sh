#!/bin/sh
# 把 snapshots/<tag>-*.png 拼成 3 列的联系表（每格 640×360），输出 snapshots/<tag>-sheet.png
tag=$1; cd "$(dirname "$0")/../snapshots"
ls ${tag}-t*.png | head -9 > /tmp/sheet-$tag.txt
n=$(wc -l < /tmp/sheet-$tag.txt)
args=""; i=0; for f in $(cat /tmp/sheet-$tag.txt); do args="$args -i $f"; i=$((i+1)); done
rows=$(( (n+2)/3 ))
layout=""; for j in $(seq 0 $((n-1))); do x=$(( (j%3)*640 )); y=$(( (j/3)*360 )); layout="$layout${layout:+|}${x}_${y}"; done
filt=""; for j in $(seq 0 $((n-1))); do filt="$filt[$j:v]scale=640:360[v$j];"; done
ins=""; for j in $(seq 0 $((n-1))); do ins="$ins[v$j]"; done
ffmpeg -v error -y $args -filter_complex "${filt}${ins}xstack=inputs=$n:layout=$layout:fill=black" ${tag}-sheet.png
