#!/usr/bin/env python3
"""Check a lesson's .visuals.json against its narration script — no TTS, no rendering.

Usage:  python3 tools/check_visual_plan.py transcripts/<lesson>.md

Reports, per lesson:
  - phrase anchors that are missing or not unique in their section
  - items whose phrase does not appear in the section's narration
  - cards that would appear together (estimated < 0.45 s apart)
  - list kinds whose item count does not suit the design
  - a summary of design variety (most-used kinds)
Exit code 1 if anything must be fixed.
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_script_video as b  # noqa: E402

LIMITS = {
    "venn": (2, 3), "quadrant": (4, 4), "comparison": (2, 6), "before-after": (2, 6),
    "pyramid": (3, 5), "layer-stack": (3, 5), "target": (3, 5), "process": (3, 5),
    "staircase": (3, 5), "roadmap-path": (3, 6), "timeline": (3, 6), "cycle": (3, 6),
    "card-grid": (2, 6), "mind-map": (3, 6), "donut": (2, 6), "bar-chart": (2, 6), "checklist": (2, 6),
    "funnel": (3, 5), "spectrum": (2, 5), "balance": (2, 6), "decision-tree": (2, 4),
    "iceberg": (3, 6), "stat-tiles": (2, 4), "gears": (2, 4), "definition": (2, 5),
    "agenda": (3, 6), "learning-objectives": (2, 4), "key-takeaways": (3, 5), "next-steps": (1, 3),
    "quiz-choice": (2, 4), "true-false": (1, 3), "tip-callout": (1, 2), "scenario-card": (2, 4),
    "worked-example": (3, 6), "analogy": (1, 3), "myth-vs-fact": (2, 6), "pros-cons": (2, 8),
    "pillars": (3, 5), "hierarchy-tree": (2, 10), "comparison-table": (2, 5), "percent-ring": (1, 3),
    "line-chart": (3, 8), "quote": (1, 1), "keyword-highlight": (1, 3), "big-number": (1, 1),
    "flip-card": (1, 3), "fill-blank": (1, 3), "match-pairs": (2, 4), "sequence-order": (3, 5),
    "predict-reveal": (1, 1), "agenda-progress": (2, 6), "did-you-know": (1, 1), "q-and-a": (2, 6),
    "dialogue": (2, 5), "next-lesson": (0, 3), "glossary": (2, 4), "icon-array": (1, 1),
    "number-change": (2, 2), "rating-scale": (1, 3), "column-chart": (2, 6), "cause-effect": (2, 6),
    "formula": (2, 4), "bridge": (2, 5), "puzzle": (2, 4), "growth-tree": (2, 6),
    "swot": (4, 8), "priority-matrix": (2, 8), "five-whys": (2, 5), "traffic-light": (3, 3), "gauge": (3, 5),
    "radar": (3, 6), "concept-map": (2, 5), "chain": (3, 6), "domino": (3, 6), "ripple": (2, 4),
    "circles-of-control": (2, 8), "hourglass": (2, 6), "zoom-in": (2, 3), "spiral": (3, 5), "swimlanes": (2, 6),
    "kanban": (2, 9), "gantt": (2, 6), "week-plan": (2, 5), "time-wheel": (2, 5), "then-now-next": (3, 3),
    "head-heart-hands": (3, 3), "compass": (4, 4),
}
# Readability guard: longest card text (characters) before small type or clipping risk.
# Beyond SOFT it warns; beyond HARD it is an error. Tight designs have small cards.
TIGHT = {"mind-map", "cycle", "roadmap-path", "timeline", "gears", "venn", "pyramid", "funnel", "spectrum",
         "iceberg", "quadrant", "stat-tiles", "staircase", "process", "target", "donut", "bar-chart",
         "key-takeaways", "pillars", "hierarchy-tree", "percent-ring", "keyword-highlight",
         "fill-blank", "agenda-progress", "column-chart", "cause-effect", "formula", "bridge", "puzzle", "growth-tree",
         "gauge", "radar", "concept-map", "chain", "domino", "ripple", "circles-of-control", "hourglass", "swimlanes",
         "gantt", "week-plan", "time-wheel", "priority-matrix", "zoom-in"}
SOFT_TIGHT, HARD_TIGHT, SOFT_WIDE, HARD_WIDE = 32, 48, 55, 80
# Designs with their own text limits (soft, hard): narrow chart labels, table cells, a whole quotation.
SPECIAL = {"line-chart": (12, 20), "comparison-table": (24, 40), "quote": (160, 220), "did-you-know": (120, 160), "predict-reveal": (70, 100)}
# Designs that may only show numbers the narrator actually says.
SPOKEN_NUMBERS = {"stat-tiles", "big-number", "percent-ring", "line-chart", "icon-array", "number-change", "rating-scale", "column-chart",
                  "radar", "gantt", "time-wheel"}
LABELLED_NUMBERS = {"stat-tiles", "big-number", "number-change", "icon-array"}
NUM_WORDS = {"one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
             "eleven": "11", "twelve": "12", "thirteen": "13", "fourteen": "14", "fifteen": "15", "twenty": "20", "twenty-five": "25",
             "thirty": "30", "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70", "eighty": "80", "ninety": "90", "hundred": "100"}


def spoken_numbers(tokens: list[str]) -> set[str]:
    """Every number in the narration, as plain digits ("72%" → "72", "1,200" → "1200", "five" → "5")."""
    found: set[str] = set()
    for token in tokens:
        t = token.lower().strip(".,;:!?\"'()")
        if t in NUM_WORDS:
            found.add(NUM_WORDS[t])
        digits = re.sub(r"[^\d.]", "", t).strip(".")
        if digits:
            found.add(digits)
            if "." in digits:
                found.add(digits.rstrip("0").rstrip("."))
    return found


def plain_number(value: float | str) -> str:
    if isinstance(value, str):
        value = re.sub(r"[^\d.]", "", value).strip(".")
        return NUM_WORDS.get(value, value)
    return str(int(value)) if float(value).is_integer() else str(value)


def main(script: Path) -> int:
    _, blocks = b.parse_markdown(script)
    plan = b.load_visual_plan(script)
    errors: list[str] = []
    warnings: list[str] = []
    kinds: Counter[str] = Counter()
    missing_why: list[str] = []
    for block in blocks:
        beats = plan.get(block.key)
        if not beats:
            warnings.append(f"{block.key}: no visual plan (auto layout will be used)")
            continue
        # One "word" per spoken token (TTS splits on dashes too); time = token index.
        tokens = re.findall(r"[^\s—–]+", block.narration)
        words = [{"text": t, "start": float(i), "end": float(i + 1)} for i, t in enumerate(tokens)]
        duration = float(len(tokens))
        try:
            starts = [0.0] + [b.resolve_phrase(words, str(x["atPhrase"]), block.key) for x in beats[1:]]
        except ValueError as exc:
            errors.append(str(exc).split(";")[0])
            continue
        ends = starts[1:] + [duration]
        for k, (beat, s0, e0) in enumerate(zip(beats, starts, ends)):
            v = beat["visual"]
            kinds[v["kind"]] += 1
            items = v.get("items") or []
            lo_hi = LIMITS.get(v["kind"])
            if lo_hi and not lo_hi[0] <= len(items) <= lo_hi[1]:
                errors.append(f"{block.key} beat {k}: {v['kind']} needs {lo_hi[0]}–{lo_hi[1]} items, has {len(items)}")
            if v["kind"] not in {"title", "statement", "question", "outro", "checklist"}:
                soft, hard = SPECIAL.get(v["kind"]) or ((SOFT_TIGHT, HARD_TIGHT) if v["kind"] in TIGHT else (SOFT_WIDE, HARD_WIDE))
                for item in items:
                    # Number cards: only the label is text. Everything else: the longest part.
                    text = item.split("|")[-1] if v["kind"] in LABELLED_NUMBERS else max(item.split("|"), key=len)
                    if v["kind"] == "true-false":
                        text = item.split("|")[0]
                    elif v["kind"] in {"gantt", "time-wheel"}:
                        text = item.split("|")[0]
                    if len(text.strip()) > hard:
                        errors.append(f"{block.key} beat {k}: card text too long to read ({len(text.strip())} chars, max {hard}) in {v['kind']}: {text.strip()!r} — shorten it")
                    elif len(text.strip()) > soft:
                        warnings.append(f"{block.key} beat {k}: long card text ({len(text.strip())} chars, aim ≤ {soft}) in {v['kind']}: {text.strip()!r}")
            if v["kind"] == "title" and (block is not blocks[0] or k > 0):
                warnings.append(f"{block.key} beat {k}: mid-video title renders as a section divider (no logo) — intended?")
            if v["kind"] in SPOKEN_NUMBERS:
                said = spoken_numbers(tokens)
                if v["kind"] == "icon-array":
                    shown = [n for item in items for n in re.findall(r"\d+", item.split("|")[0])]
                elif v["kind"] in {"gantt", "time-wheel"}:
                    shown = [p.strip() for item in items for p in item.split("|")[1:]]
                elif v["kind"] in LABELLED_NUMBERS:
                    shown = [item.split("|")[0].strip() for item in items]
                else:
                    shown = list(v.get("values") or [])
                for num in shown:
                    if plain_number(num) not in said:
                        errors.append(f"{block.key} beat {k}: number {num!r} is not spoken in the narration — never invent numbers")
            if v.get("revealPhrase"):
                try:
                    reveal = b.resolve_phrase(words, str(v["revealPhrase"]), f"{block.key} beat {k} revealPhrase")
                    if not s0 <= reveal < e0:
                        errors.append(f"{block.key} beat {k}: the answer (revealPhrase) is spoken outside its slide")
                except ValueError as exc:
                    errors.append(str(exc).split(";")[0])
            if items and v["kind"] not in {"title", "statement", "question", "outro"} and not str(beat.get("why", "")).strip():
                missing_why.append(f"{block.key} beat {k}")
            phrases = v.get("itemPhrases") or []
            if items and not phrases:
                warnings.append(f"{block.key} beat {k}: items have no itemPhrases — cards will not sync to the voice")
            times = []
            for item, phrase in zip(items, phrases):
                try:
                    t = b.resolve_item_start(words, phrase, item, f"{block.key} beat {k} item {item!r}")
                except ValueError as exc:
                    errors.append(str(exc).split(";")[0])
                    continue
                if not s0 <= t < e0:
                    errors.append(f"{block.key} beat {k}: item {item!r} is spoken outside its slide")
                times.append((t, item))
            times.sort()
            for (t1, a), (t2, c) in zip(times, times[1:]):
                # Together = same word, or the very next word with no pause (comma, "and", "or") between.
                gap = int(t2 - t1)
                pause = gap == 1 and (re.search(r"[,;:.!?]$", tokens[int(t1)]) is not None)
                if gap == 0 or (gap == 1 and not pause):
                    errors.append(f"{block.key} beat {k}: {a!r} and {c!r} would appear together — give each its own phrase")
    print(f"Design use: {', '.join(f'{k}×{n}' for k, n in kinds.most_common())}")
    top = kinds.most_common(1)
    if top and sum(kinds.values()) and top[0][1] / sum(kinds.values()) > 0.3 and top[0][0] not in {"statement"}:
        warnings.append(f"'{top[0][0]}' is used for over 30% of slides — vary the designs")
    if missing_why:
        warnings.append(f"{len(missing_why)} diagram beat(s) have no \"why\" (state why this design fits the narration): {', '.join(missing_why[:6])}{' …' if len(missing_why) > 6 else ''}")
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print("OK — ready to render" if not errors else f"{len(errors)} error(s) to fix")
    return 1 if errors else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(2)
    sys.exit(main(Path(sys.argv[1])))
