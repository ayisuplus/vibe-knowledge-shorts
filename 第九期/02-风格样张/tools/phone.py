# Phone check: a landscape video watched on a phone held upright is only ~390 px wide.
# Show v1 (left) and current (right) at that size, then enlarge 2x with nearest-neighbour so the softness stays visible.
from PIL import Image
names = ["frame-a-wall", "frame-b-towers", "frame-c-two-eyes", "frame-d-scale"]
W, H = 390, 219
sheet = Image.new("RGB", (W * 2 * 2 + 20, H * 2 * len(names) + 10 * len(names)), "white")
for i, n in enumerate(names):
    for j, path in enumerate([f"v1/{n}.png", f"{n}.png"]):
        im = Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS).resize((W * 2, H * 2), Image.NEAREST)
        sheet.paste(im, (j * (W * 2 + 20), i * (H * 2 + 10)))
sheet.save("phone-check.jpg", quality=92)
