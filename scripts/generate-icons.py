"""Generate Irreecha GateGuard PWA icons (192, 512, maskable 512)."""
import math
import os
from PIL import Image, ImageDraw

OUT_DIR = "/home/z/my-project/public"
os.makedirs(OUT_DIR, exist_ok=True)

CREAM = (250, 246, 238)
GREEN = (27, 122, 61)
GREEN_DARK = (11, 61, 46)
YELLOW = (242, 183, 5)
RED = (216, 35, 42)


def draw_icon(size: int, maskable: bool = False) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        draw.rectangle([0, 0, size, size], fill=GREEN_DARK)
        inset = int(size * 0.05)
        draw.rectangle([inset, inset, size - inset, size - inset], fill=CREAM)
    else:
        draw.rounded_rectangle([0, 0, size, size], radius=int(size * 0.18), fill=GREEN_DARK)

    cx, cy = size // 2, size // 2
    r_outer = int(size * 0.38)
    draw.ellipse(
        [cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer],
        fill=GREEN, outline=YELLOW, width=max(2, size // 64),
    )
    r_inner = int(size * 0.28)
    r_outer_ray = int(size * 0.40)
    for i in range(12):
        angle = (2 * math.pi / 12) * i - math.pi / 2
        x1 = cx + int(r_inner * math.cos(angle))
        y1 = cy + int(r_inner * math.sin(angle))
        x2 = cx + int(r_outer_ray * math.cos(angle))
        y2 = cy + int(r_outer_ray * math.sin(angle))
        draw.line([(x1, y1), (x2, y2)], fill=YELLOW, width=max(2, size // 80))

    r_inner_disc = int(size * 0.20)
    draw.ellipse(
        [cx - r_inner_disc, cy - r_inner_disc, cx + r_inner_disc, cy + r_inner_disc],
        fill=YELLOW, outline=GREEN_DARK, width=max(2, size // 96),
    )

    cell = max(2, size // 30)
    grid_size = cell * 3
    gx = cx - grid_size // 2
    gy = cy - grid_size // 2
    pattern = [[1, 0, 1], [0, 1, 0], [1, 0, 1]]
    for r in range(3):
        for c in range(3):
            if pattern[r][c]:
                draw.rectangle(
                    [gx + c * cell, gy + r * cell, gx + (c + 1) * cell, gy + (r + 1) * cell],
                    fill=GREEN_DARK,
                )

    strip_h = max(3, size // 40)
    y_strip = (size - strip_h - int(size * 0.08)) if maskable else (size - strip_h - int(size * 0.06))
    draw.rectangle(
        [int(size * 0.18), y_strip, int(size * 0.82), y_strip + strip_h],
        fill=RED,
    )

    return img


def main():
    for size in [192, 512]:
        img = draw_icon(size, maskable=False)
        out = os.path.join(OUT_DIR, f"icon-{size}.png")
        img.save(out, "PNG")
        print(f"Saved {out} ({img.size})")
    img = draw_icon(512, maskable=True)
    out = os.path.join(OUT_DIR, "icon-maskable.png")
    img.save(out, "PNG")
    print(f"Saved {out} ({img.size})")


if __name__ == "__main__":
    main()
