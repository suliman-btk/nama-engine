#!/usr/bin/env python3
"""
Course setup: brand the video engine for YOUR course in one command.

Any AI agent (or a person) can run this. It never touches engine code - it only writes
`course-config.json` and copies logo files into `engine/public/brand/`.

Show the current settings in plain words:
    python3 tools/course_setup.py --show

Suggest colours from a logo (needs Pillow: pip3 install pillow):
    python3 tools/course_setup.py --colors-from-logo ~/Desktop/logo.png

Apply settings (every flag is optional; anything you leave out keeps its current value):
    python3 tools/course_setup.py \
        --course-id GTA --course-name "Green Teachers Academy" \
        --label "GTA · Lesson {lesson}" \
        --logo ~/Desktop/logo-colour.png --logo-white ~/Desktop/logo-white.png \
        --course-logo ~/Desktop/course-logo.png \
        --badge-logo ~/Desktop/partner.png --badge-text "In partnership with\\nCity Schools" \
        --primary "#0B5D3B" --accent "#E07A1F" \
        --voice en-GB-SoniaNeural --speed -6% --pause 1.3 \
        --animation logo --subtitles on

    --no-badge removes the partner badge; --no-course-logo shows the course name as text.

A backup of the previous config is saved as course-config.backup.json.
"""
from __future__ import annotations

import argparse
import colorsys
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "course-config.json"
BRAND_DIR = ROOT / "engine" / "public" / "brand"
MARKER = ROOT / ".course-setup-done"
HEX = re.compile(r"^#?[0-9a-fA-F]{6}$")


# ---------------------------------------------------------------- colours
def rgb(hex_: str) -> tuple[float, float, float]:
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def hexc(c: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{max(0, min(255, round(v * 255))):02X}" for v in c)


def mix(a: str, b: str, t: float) -> str:
    ca, cb = rgb(a), rgb(b)
    return hexc(tuple(x + (y - x) * t for x, y in zip(ca, cb)))  # type: ignore[arg-type]


def luminance(hex_: str) -> float:
    def ch(v: float) -> float:
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(v) for v in rgb(hex_))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def rgba(hex_: str, alpha: float) -> str:
    r, g, b = (round(v * 255) for v in rgb(hex_))
    return f"rgba({r},{g},{b},{alpha})"


def palette(primary: str, accent: str) -> dict[str, str]:
    """All the colour tokens the engine needs, built from two colours."""
    primary, accent = "#" + primary.lstrip("#").upper(), "#" + accent.lstrip("#").upper()
    deep = mix(primary, "#000000", 0.28)
    return {
        "navy": primary,
        "deep": deep,
        "mid": mix(primary, "#FFFFFF", 0.14),
        "surface": mix(primary, "#FFFFFF", 0.97),
        "accent": accent,
        "accentLight": mix(accent, "#FFFFFF", 0.3),
        "cream": "#FFFFFF",
        "sand": mix(accent, "#FFFFFF", 0.85),
        "panel": "rgba(255,255,255,0.92)",
        "panelEdge": rgba(primary, 0.18),
        "inkDim": rgba(deep, 0.68),
        "plumSafe": mix(primary, "#FFFFFF", 0.93),
        "tealSafe": mix(accent, "#FFFFFF", 0.88),
    }


def colour_warnings(primary: str, accent: str) -> list[str]:
    notes = []
    if contrast(primary, "#FFFFFF") < 4.5:
        notes.append(f"The main colour {primary} is light, so titles on white slides may be hard to read. "
                     "A darker version of the same colour works better.")
    if contrast(accent, primary) < 1.6:
        notes.append(f"The accent colour {accent} looks very close to the main colour, so highlights will not stand out.")
    return notes


def colours_from_logo(path: Path, count: int = 5) -> list[str]:
    try:
        from PIL import Image  # type: ignore
    except ImportError:
        sys.exit("To read colours from a logo, first run:  pip3 install pillow")
    img = Image.open(path).convert("RGBA")
    img.thumbnail((200, 200))
    data = img.get_flattened_data() if hasattr(img, "get_flattened_data") else img.getdata()
    pixels = [(r, g, b) for r, g, b, a in data if a > 200]
    if not pixels:
        return []
    small = Image.new("RGB", (len(pixels), 1))
    small.putdata(pixels)
    quant = small.quantize(colors=12, method=Image.Quantize.MEDIANCUT)
    pal = quant.getpalette() or []
    counts = sorted(quant.getcolors() or [], reverse=True)
    found = []
    for n, idx in counts:
        r, g, b = pal[idx * 3: idx * 3 + 3]
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        if l > 0.92 or l < 0.06 or s < 0.15:  # skip white, black and greys
            continue
        c = f"#{r:02X}{g:02X}{b:02X}"
        if all(sum(abs(x - y) for x, y in zip(rgb(c), rgb(o))) > 0.25 for o in found):
            found.append(c)
    return found[:count]


# ---------------------------------------------------------------- config
def load() -> dict:
    return json.loads(CONFIG.read_text(encoding="utf-8"))


def copy_logo(src: str) -> str:
    path = Path(src).expanduser()
    if not path.is_file():
        sys.exit(f"Cannot find the logo file: {path}")
    if path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".svg", ".webp"}:
        sys.exit(f"Logo must be a PNG, JPG, SVG or WEBP image: {path.name}")
    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    name = re.sub(r"[^a-z0-9.]+", "-", path.name.lower())
    shutil.copy2(path, BRAND_DIR / name)
    return name


def show(cfg: dict) -> None:
    b, c, v = cfg.get("brand", {}), cfg["theme"]["colors"], cfg.get("voice", {})
    badge = b.get("titleBadge")
    print("Current course settings")
    print(f"  Course short name ..... {cfg.get('courseId')}")
    print(f"  Course full name ...... {cfg.get('courseName', '(not set)')}")
    print(f"  Lesson label .......... {cfg.get('lessonLabelTemplate')}")
    print(f"  Organisation logo ..... {b.get('watermarkLogoColored', b.get('watermarkLogo'))} (colour), {b.get('watermarkLogo')} (white)")
    print(f"  Course logo on title .. {b.get('titleLogo', '(none - the course name is shown as text)')}")
    print(f"  Partner badge ......... {badge['logo'] + ' / ' + badge.get('text', '').replace(chr(10), ' ') if badge else '(none)'}")
    print(f"  Main colour ........... {c['navy']}")
    print(f"  Accent colour ......... {c['accent']}")
    print(f"  Opening animation ..... {b.get('bumper', {}).get('style', 'logo')}")
    print(f"  Subtitles ............. {'on' if cfg.get('subtitles', True) else 'off'}")
    print(f"  Voice ................. {v.get('name', 'en-US-AndrewMultilingualNeural')}  speed {v.get('rate', '-6%')}  pause {v.get('paragraphPauseSeconds', 1.3)}s")
    print(f"  Setup finished ........ {'yes' if MARKER.exists() else 'no'}")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--show", action="store_true", help="Print the current settings and stop.")
    p.add_argument("--colors-from-logo", metavar="IMAGE", help="Print the main colours found in a logo and stop.")
    p.add_argument("--course-id", help="Short course name, e.g. GTA (used in labels and file names).")
    p.add_argument("--course-name", help="Full course name, shown in the opening animation and on the title slide if there is no course logo.")
    p.add_argument("--label", help='Label in the corner of every slide. Must contain {lesson}, e.g. "GTA · Lesson {lesson}".')
    p.add_argument("--logo", help="Organisation logo in colour (shown on light slides and in the opening animation).")
    p.add_argument("--logo-white", help="Organisation logo in white (shown on dark slides). Defaults to the colour logo.")
    p.add_argument("--course-logo", help="Course logo shown big on the opening title slide.")
    p.add_argument("--no-course-logo", action="store_true", help="Show the course name as text instead of a course logo.")
    p.add_argument("--badge-logo", help="Small partner logo on the title slide.")
    p.add_argument("--badge-text", help='Text next to the partner logo. Use \\n for a new line.')
    p.add_argument("--no-badge", action="store_true", help="Remove the partner badge.")
    p.add_argument("--primary", help="Main colour as #RRGGBB (titles, dark slides).")
    p.add_argument("--accent", help="Accent colour as #RRGGBB (highlights, lines).")
    p.add_argument("--font", help='Font family name installed on the computer, e.g. "Cairo".')
    p.add_argument("--voice", help="Narration voice, e.g. en-US-AndrewMultilingualNeural. List: python3 -m edge_tts --list-voices")
    p.add_argument("--speed", help='Voice speed, e.g. -6%% (slower) or +5%% (faster).')
    p.add_argument("--pause", type=float, help="Silence between paragraphs, in seconds (e.g. 1.3).")
    p.add_argument("--animation", choices=["logo", "nama-animated"], help='Opening/closing animation. "logo" works with any logo.')
    p.add_argument("--subtitles", choices=["on", "off"], help="Show subtitles at the bottom of the video.")
    p.add_argument("--done", action="store_true", help="Mark the setup as finished (agents then skip the setup interview).")
    a = p.parse_args()

    cfg = load()
    if a.colors_from_logo:
        found = colours_from_logo(Path(a.colors_from_logo).expanduser())
        if not found:
            print("No clear colours found in this logo (it may be black, white or grey).")
            return 0
        print("Colours found in the logo (most used first):")
        for c in found:
            print(f"  {c}   {'dark enough for titles (good main colour)' if contrast(c, '#FFFFFF') >= 4.5 else 'light (better as the accent colour)'}")
        return 0
    if a.show:
        show(cfg)
        return 0

    changed = [k for k, v in vars(a).items() if v not in (None, False)]
    if not changed:
        p.print_help()
        return 0
    shutil.copy2(CONFIG, ROOT / "course-config.backup.json")
    brand = cfg.setdefault("brand", {})
    if a.course_id:
        cfg["courseId"] = a.course_id
        if not a.label and "{lesson}" in cfg.get("lessonLabelTemplate", ""):
            cfg["lessonLabelTemplate"] = f"{a.course_id} · Lesson {{lesson}}"
    if a.course_name:
        cfg["courseName"] = a.course_name
    if a.label:
        if "{lesson}" not in a.label:
            sys.exit('The label must contain {lesson}, for example "GTA · Lesson {lesson}".')
        cfg["lessonLabelTemplate"] = a.label
    if a.logo:
        name = copy_logo(a.logo)
        brand["watermarkLogoColored"] = name
        brand.setdefault("bumper", {})["logo"] = name
        if not a.logo_white:
            brand["watermarkLogo"] = name
    if a.logo_white:
        brand["watermarkLogo"] = copy_logo(a.logo_white)
    elif a.logo:
        print("Note: no white version of the logo was given, so the colour logo is also used on dark "
              "slides, where it may be hard to see. A white version is recommended.")
    if a.course_logo:
        brand["titleLogo"] = copy_logo(a.course_logo)
    if a.no_course_logo:
        brand.pop("titleLogo", None)
    if a.no_badge:
        brand.pop("titleBadge", None)
    if a.badge_logo:
        brand["titleBadge"] = {"logo": copy_logo(a.badge_logo), "text": (brand.get("titleBadge") or {}).get("text", "")}
    if a.badge_text is not None:
        if "titleBadge" not in brand:
            sys.exit("Add a partner logo with --badge-logo before setting its text.")
        brand["titleBadge"]["text"] = a.badge_text.replace("\\n", "\n")
    if a.animation:
        brand.setdefault("bumper", {})["style"] = a.animation
    elif a.logo:
        # The assembling animation is drawn from the NAMA logo itself; any other logo uses "logo".
        brand.setdefault("bumper", {})["style"] = "logo"
    if a.primary or a.accent:
        colours = cfg["theme"]["colors"]
        primary = a.primary or colours["navy"]
        accent = a.accent or colours["accent"]
        for c in (primary, accent):
            if not HEX.match(c):
                sys.exit(f"Colours must look like #1A2B3C, got: {c}")
        colours.update(palette(primary, accent))
        for note in colour_warnings(colours["navy"], colours["accent"]):
            print("Note:", note)
    if a.font:
        family = f'"{a.font}", "Inter", "Segoe UI", Helvetica, Arial, sans-serif'
        cfg["theme"]["headingFamily"] = family
        cfg["theme"]["bodyFamily"] = family
    voice = cfg.setdefault("voice", {})
    if a.voice:
        voice["name"] = a.voice
    if a.speed:
        if not re.match(r"^[+-]\d{1,2}%$", a.speed):
            sys.exit("Speed looks like -6% or +5%.")
        voice["rate"] = a.speed
    if a.pause is not None:
        voice["paragraphPauseSeconds"] = a.pause
    if a.subtitles:
        cfg["subtitles"] = a.subtitles == "on"

    CONFIG.write_text(json.dumps(cfg, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if a.done:
        MARKER.write_text("Course setup finished. Delete this file to run the setup interview again.\n", encoding="utf-8")
    show(cfg)
    print("\nSaved. Previous settings were kept in course-config.backup.json.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
