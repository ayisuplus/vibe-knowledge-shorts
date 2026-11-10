#!/bin/sh
# 从 hf-mirror 断点续传 Woosh 权重到 ComfyUI/models/woosh/（huggingface.co 本机太慢）
cd "G:/comfyui/ComfyUI/ComfyUI/models/woosh" || exit 1
for f in Woosh-AE TextConditionerA TextConditionerV Woosh-Flow Woosh-DFlow; do
  mkdir -p "$f"
  for i in 1 2 3 4 5; do
    curl -sL -C - --retry 5 --retry-delay 3 -o "$f/weights.safetensors.dl" "https://hf-mirror.com/drbaph/Woosh/resolve/main/$f/weights.safetensors" && break
    sleep 3
  done
  mv "$f/weights.safetensors.dl" "$f/weights.safetensors" && echo "done $f $(wc -c < "$f/weights.safetensors")"
done
