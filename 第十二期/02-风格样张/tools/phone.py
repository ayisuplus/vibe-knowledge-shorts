# Phone check: a landscape video watched on a phone held upright is only ~390 px wide.
# Downscale each frame to that size, then enlarge 2x with nearest-neighbour so the softness stays visible.
from PIL import Image
names = ["frame-a-hook", "frame-b-timeline", "frame-c-photo"]
W, H = 390, 219
sheet = Image.new("RGB", (W * 2, H * 2 * len(names) + 10 * (len(names) - 1)), "white")
for i, n in enumerate(names):
    im = Image.open(f"{n}.png").convert("RGB").resize((W, H), Image.LANCZOS).resize((W * 2, H * 2), Image.NEAREST)
    sheet.paste(im, (0, i * (H * 2 + 10)))
sheet.save("phone-check.jpg", quality=92)
