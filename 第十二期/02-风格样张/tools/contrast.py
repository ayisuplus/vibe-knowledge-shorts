# WCAG contrast ratios for the palette. Text needs >= 4.5 (small) or >= 3 (large/bold); shapes vs background >= 3 to read on a phone.
import sys

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

pairs = [line.split() for line in sys.stdin if line.strip() and not line.startswith("--")]
for fg, bg, need, *label in pairs:
    r = ratio(fg, bg)
    print(f"{'OK ' if r >= float(need) else 'LOW'} {r:5.2f} (need {need}) {fg} on {bg}  {' '.join(label)}")
