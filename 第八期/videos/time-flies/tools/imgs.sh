# 把 gen/*/ 下 Codex 出的 png 转成 assets/img/*.jpg（已有的跳过）
cd "$(dirname "$0")/.."
for f in gen/*/*.png; do n=$(basename "$f" .png); o=assets/img/$n.jpg; [ -f "$o" ] && continue; ffmpeg -v error -y -i "$f" -q:v 3 "$o" && echo "+ $n"; done
