#!/usr/bin/env python3
"""Make review sheets (contact sheets) from the pictures written by the slide check.

    python3 review_sheet.py <review-folder>

Reads <folder>/frames.json (list of {file, label, problem}) and writes sheet-1.png, sheet-2.png, ...
with 12 labelled pictures each (3 across, 4 down). Pictures of slides with problems get a red
frame so they are easy to spot.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

COLS, ROWS, TILE_W, TILE_H, LABEL_H, GAP = 3, 4, 640, 360, 40, 16


def font(size: int):
    for name in ("Arial.ttf", "Helvetica.ttc", "DejaVuSans.ttf", "/System/Library/Fonts/Helvetica.ttc",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)
    except TypeError:
        return ImageFont.load_default()


def main() -> int:
    folder = Path(sys.argv[1])
    frames = json.loads((folder / "frames.json").read_text(encoding="utf-8"))
    for old in folder.glob("sheet-*.png"):
        old.unlink()
    per = COLS * ROWS
    label_font = font(22)
    sheets = 0
    for start in range(0, len(frames), per):
        chunk = frames[start:start + per]
        rows = (len(chunk) + COLS - 1) // COLS
        sheet = Image.new("RGB", (COLS * TILE_W + (COLS + 1) * GAP, rows * (TILE_H + LABEL_H) + (rows + 1) * GAP), "white")
        draw = ImageDraw.Draw(sheet)
        for i, f in enumerate(chunk):
            x = GAP + (i % COLS) * (TILE_W + GAP)
            y = GAP + (i // COLS) * (TILE_H + LABEL_H + GAP)
            path = folder / f["file"]
            if path.is_file():
                tile = Image.open(path).convert("RGB").resize((TILE_W, TILE_H))
                sheet.paste(tile, (x, y))
            if f.get("problem"):
                draw.rectangle([x - 4, y - 4, x + TILE_W + 3, y + TILE_H + 3], outline="#D32F2F", width=6)
            label = f["label"] + ("   ← needs fixing" if f.get("problem") else "")
            draw.text((x, y + TILE_H + 8), label, fill="#D32F2F" if f.get("problem") else "#222222", font=label_font)
        sheets += 1
        sheet.save(folder / f"sheet-{sheets}.png")
    print(f"Review sheets: {sheets} picture(s) with {len(frames)} moments of the video (sheet-1.png ...).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
