#!/usr/bin/env python3
"""Build a branded, avatar-free lesson video from one Markdown script.

The script is the narration authority. Markdown headings organize the visuals but are
not spoken; paragraphs and list items are spoken verbatim. The generated Remotion
composition reuses the course theme and never mounts PresenterLayer.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


REPO_ROOT = Path(__file__).resolve().parents[1]
ENGINE_DIR = REPO_ROOT / "engine"
PUBLIC_DIR = ENGINE_DIR / "public" / "script-videos"
MANIFEST_PATH = ENGINE_DIR / "src" / "data" / "script-video.json"
OUT_DIR = REPO_ROOT / "output"
COURSE_CONFIG_PATH = REPO_ROOT / "course-config.json"
TICKS_PER_SECOND = 10_000_000
DEFAULT_VOICE = "en-US-AndrewMultilingualNeural"
VISUAL_KINDS = {
    "title", "statement", "question", "checklist", "process", "timeline",
    "cycle", "comparison", "card-grid", "staircase", "outro",
    "bar-chart", "donut", "pyramid", "venn", "mind-map",
    "target", "quadrant", "roadmap-path", "layer-stack", "before-after",
    "funnel", "spectrum", "balance", "decision-tree",
    "iceberg", "stat-tiles", "gears", "definition",
    "agenda", "learning-objectives", "key-takeaways", "next-steps",
    "quiz-choice", "true-false", "tip-callout", "scenario-card", "worked-example", "analogy",
    "myth-vs-fact", "pros-cons", "pillars", "hierarchy-tree", "comparison-table",
    "percent-ring", "line-chart", "quote", "keyword-highlight", "big-number",
    "flip-card", "fill-blank", "match-pairs", "sequence-order", "predict-reveal",
    "agenda-progress", "did-you-know", "q-and-a", "dialogue", "next-lesson", "glossary",
    "icon-array", "number-change", "rating-scale", "column-chart",
    "cause-effect", "formula", "bridge", "puzzle", "growth-tree",
    "swot", "priority-matrix", "five-whys", "traffic-light", "gauge", "radar",
    "concept-map", "chain", "domino", "ripple", "circles-of-control", "hourglass", "zoom-in", "spiral",
    "swimlanes", "kanban", "gantt", "week-plan", "time-wheel", "then-now-next", "head-heart-hands", "compass",
}
# Slide background styles (see engine/src/script-video/NamaBackdrops.tsx). A light slide uses the
# light ones, a dark slide the dark ones; a name that does not suit the slide is ignored.
BACKDROPS = {"halo", "dots", "edge", "wash", "grid", "arcs", "glow", "stripes", "constellation", "waves", "mesh"}
# Designs whose cards sit in columns, so they may be spoken in a different order than listed.
COLUMN_KINDS = {"before-after", "comparison", "balance", "iceberg", "myth-vs-fact", "pros-cons", "q-and-a",
                "swot", "priority-matrix", "circles-of-control", "hourglass", "kanban"}
NUMBER_RE = re.compile(r"^\s*[^\d\s|-]{0,2}-?\d[\d,]*(\.\d+)?\s*[^|]{0,4}\|\s*\S")


@dataclass
class SourceBlock:
    section: str
    narration: str
    items: list[str]
    # Key used to look up this block's beats in the .visuals.json. Equals the section
    # heading ("Scene 003"); when one heading holds several paragraphs (for example a
    # "## Pure narration" script) each paragraph gets "<section> · <n>".
    key: str = ""


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "script-video"


def lesson_label(course_config: dict[str, Any], title: str) -> str:
    course_id = str(course_config.get("courseId", "NAMA"))
    template = str(course_config.get("lessonLabelTemplate", f"{course_id} · Lesson {{lesson}}"))
    match = re.search(r"\bLesson\s+(\d+)\b", title, flags=re.IGNORECASE)
    lesson = match.group(1) if match else title
    return template.replace("{lesson}", lesson)


def clean_markdown(value: str) -> str:
    value = re.sub(r"!\[[^]]*\]\([^)]*\)", "", value)
    value = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", value)
    # Square-bracketed phrases in production scripts are delivery directions,
    # not narration (for example: [warm], [slow pace], [short pause]).
    value = re.sub(r"\[[^]\n]{1,100}\]", "", value)
    value = re.sub(r"[*_`>#]", "", value)
    return re.sub(r"\s+", " ", value).strip()


def is_non_spoken_metadata(line: str) -> bool:
    """Return true for script-control text that must never reach TTS."""
    if line.startswith(">"):
        return True
    if line.startswith("**"):
        return True
    return bool(re.fullmatch(r"(?:\[[^]]+\]\s*)+", line))


def split_long_paragraph(text: str, max_words: int = 85) -> list[str]:
    if len(text.split()) <= max_words:
        return [text]
    sentences = [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]
    chunks: list[str] = []
    current: list[str] = []
    count = 0
    for sentence in sentences:
        words = len(sentence.split())
        if current and count + words > max_words:
            chunks.append(" ".join(current))
            current, count = [], 0
        current.append(sentence)
        count += words
    if current:
        chunks.append(" ".join(current))
    return chunks or [text]


def parse_markdown(path: Path) -> tuple[str, list[SourceBlock]]:
    raw = path.read_text(encoding="utf-8")
    title = path.stem.replace("-", " ").title()
    section = "Introduction"
    blocks: list[SourceBlock] = []
    paragraph: list[str] = []
    list_items: list[str] = []

    def flush() -> None:
        nonlocal paragraph, list_items
        if paragraph:
            text = clean_markdown(" ".join(paragraph))
            if text:
                # Keep each authored source scene as one uninterrupted TTS call.
                # Visual changes are timed inside it from real word boundaries.
                blocks.append(SourceBlock(section=section, narration=text, items=[]))
            paragraph = []
        if list_items:
            items = [clean_markdown(item) for item in list_items if clean_markdown(item)]
            if items:
                blocks.append(SourceBlock(section=section, narration=" ".join(items), items=items))
            list_items = []

    for raw_line in raw.splitlines():
        line = raw_line.strip()
        h1 = re.match(r"^#\s+(.+)$", line)
        heading = re.match(r"^#{2,6}\s+(.+)$", line)
        bullet = re.match(r"^(?:[-*+]\s+|\d+[.)]\s+)(.+)$", line)
        if h1:
            flush()
            title = clean_markdown(h1.group(1)) or title
        elif heading:
            flush()
            section = clean_markdown(heading.group(1)) or section
        elif bullet:
            if paragraph:
                flush()
            list_items.append(bullet.group(1))
        elif not line:
            flush()
        elif is_non_spoken_metadata(line):
            flush()
        else:
            if list_items:
                flush()
            paragraph.append(line)
    flush()

    if not blocks:
        raise ValueError(f"{path} contains no narration paragraphs or list items.")
    # A greeting on its own line (for example "السلام عليكم") is spoken with the
    # paragraph that follows it, so it never becomes a separate one-word slide.
    merged: list[SourceBlock] = []
    pending = ""
    for block in blocks:
        if not block.items and len(block.narration.split()) <= 3:
            pending = f"{pending} {block.narration}".strip()
            continue
        if pending and not block.items:
            joiner = "" if pending[-1] in ".!?،؟" else "."
            block.narration = f"{pending}{joiner} {block.narration}"
            pending = ""
        merged.append(block)
    if pending:
        merged.append(SourceBlock(section=blocks[-1].section, narration=pending, items=[]))
    counts: dict[str, int] = {}
    for block in merged:
        counts[block.section] = counts.get(block.section, 0) + 1
    seen: dict[str, int] = {}
    for block in merged:
        seen[block.section] = seen.get(block.section, 0) + 1
        block.key = block.section if counts[block.section] == 1 else f"{block.section} · {seen[block.section]}"
    return title, merged


def short_exact_text(text: str, max_words: int = 14) -> str:
    first = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)[0].strip()
    words = first.split()
    if len(words) <= max_words:
        return first
    return " ".join(words[:max_words]).rstrip(".,;:—-") + "…"


def visual_for(block: SourceBlock, index: int, total: int, title: str) -> dict[str, Any]:
    if index == 0:
        return {"kind": "title", "title": title, "kicker": block.section}
    if block.items:
        # The section heading describes the relationship; individual item words should
        # not accidentally force a layout (for example, a pillar named "Process").
        context = block.section.lower()
        item_text = " ".join(block.items).lower()
        if re.search(r"\b(compare|comparison|versus|\bvs\b|difference|before and after|on the other hand)\b", context) and len(block.items) >= 2:
            kind = "comparison"
        elif re.search(r"\b(cycle|repeat|continuous|iterate|feedback loop|renew)\b", context):
            kind = "cycle"
        elif re.search(r"\b(timeline|milestone|roadmap|journey|year|month|week|phase)\b", context) or re.search(r"\b(?:19|20)\d{2}\b", item_text):
            kind = "timeline"
        elif re.search(r"\b(stair|level|maturity|grow|growth|progress upward|foundation to)\b", context):
            kind = "staircase"
        elif re.search(r"\b(process|step|sequence|first|then|next|finally|workflow|from .* to)\b", context):
            kind = "process"
        elif re.search(r"\b(checklist|check|requirements|required|remember|before you)\b", context):
            kind = "checklist"
        else:
            # Rotate structurally distinct treatments so consecutive list scenes do not
            # collapse into the same stack of cards when the wording is neutral.
            rotation = ["card-grid", "roadmap-path", "mind-map", "process", "layer-stack", "cycle", "target", "timeline", "pyramid", "staircase"]
            kind = rotation[(index - 1) % len(rotation)]
        return {"kind": kind, "title": block.section, "kicker": "Key points", "items": block.items[:6]}
    questions = [q.strip() for q in re.findall(r"[^?]+\?", block.narration) if q.strip()]
    if questions:
        return {"kind": "question", "title": questions[0], "kicker": block.section, "items": questions[:4]}
    if index == total - 1:
        return {"kind": "outro", "title": short_exact_text(block.narration), "kicker": block.section, "items": []}
    return {"kind": "statement", "title": short_exact_text(block.narration), "kicker": block.section}


def validate_visual(visual: Any, context: str) -> dict[str, Any]:
    if not isinstance(visual, dict):
        raise ValueError(f"Visual must be an object: {context}")
    kind = visual.get("kind")
    if kind not in VISUAL_KINDS or not isinstance(visual.get("title"), str):
        raise ValueError(f"Invalid visual: {context}")
    items = visual.get("items")
    if items is not None and (not isinstance(items, list) or not all(isinstance(item, str) for item in items)):
        raise ValueError(f"Visual items must be strings: {context}")
    values = visual.get("values")
    if values is not None:
        if not isinstance(values, list) or not all(isinstance(v, (int, float)) and not isinstance(v, bool) and v >= 0 for v in values):
            raise ValueError(f"Visual values must be non-negative numbers: {context}")
        if not isinstance(items, list) or len(values) != len(items):
            raise ValueError(f"Visual values must match items one-for-one: {context}")
    left_count = visual.get("leftCount")
    if left_count is not None and (not isinstance(left_count, int) or not isinstance(items, list) or not 1 <= left_count < len(items)):
        raise ValueError(f"leftCount must split items into two non-empty columns: {context}")
    backdrop = visual.get("backdrop")
    if backdrop is not None and backdrop not in BACKDROPS:
        raise ValueError(f"Visual backdrop must be one of {', '.join(sorted(BACKDROPS))}: {context}")
    for key in ("unit", "center", "leftLabel", "rightLabel", "joiner"):
        if visual.get(key) is not None and not isinstance(visual.get(key), str):
            raise ValueError(f"Visual {key} must be text: {context}")
    if kind == "quadrant" and (not isinstance(items, list) or len(items) != 4):
        raise ValueError(f"A quadrant visual needs exactly 4 items: {context}")
    if kind == "venn" and (not isinstance(items, list) or not 2 <= len(items) <= 3):
        raise ValueError(f"A venn visual needs 2 or 3 items: {context}")
    if kind in {"balance", "iceberg"} and left_count is None:
        raise ValueError(f"A {kind} visual needs leftCount (items on the left / above the water): {context}")
    if kind == "iceberg" and left_count is not None and left_count > 2:
        raise ValueError(f"An iceberg shows at most 2 items above the water: {context}")
    if kind == "balance" and isinstance(items, list) and left_count is not None and (left_count > 3 or len(items) - left_count > 3):
        raise ValueError(f"A balance holds at most 3 items per side: {context}")
    if kind in {"definition", "decision-tree"} and not visual.get("center"):
        raise ValueError(f"A {kind} visual needs center (the term / the question): {context}")
    if kind == "stat-tiles" and isinstance(items, list) and not all(re.match(r"^\s*[\w.-]+\s*\|\s*\S", item) for item in items):
        raise ValueError(f"stat-tiles items must look like '5|Domains': {context}")
    if kind == "spectrum" and values is not None and not all(0 <= v <= 100 for v in values):
        raise ValueError(f"spectrum values are positions from 0 to 100: {context}")
    validate_lesson_visual(visual, kind, items if isinstance(items, list) else [], values, left_count, context)
    item_phrases = visual.get("itemPhrases")
    if item_phrases is not None:
        if not isinstance(item_phrases, list) or not all(isinstance(phrase, str) and phrase.strip() for phrase in item_phrases):
            raise ValueError(f"Visual itemPhrases must be non-empty strings: {context}")
        if not isinstance(items, list) or len(item_phrases) != len(items):
            raise ValueError(f"Visual itemPhrases must match items one-for-one: {context}")
    return visual


def validate_lesson_visual(visual: dict[str, Any], kind: str, items: list[str], values: Any, left_count: Any, context: str) -> None:
    """Shape rules for the lesson-flow, insight and full-slide designs."""
    def need(ok: bool, message: str) -> None:
        if not ok:
            raise ValueError(f"{message}: {context}")

    reveal = visual.get("revealPhrase")
    need(reveal is None or (isinstance(reveal, str) and reveal.strip() != ""), "revealPhrase must be text")
    if kind in {"quiz-choice", "true-false"}:
        need(bool(reveal), f"A {kind} visual needs revealPhrase (the words where the answer is spoken)")
    if kind == "quiz-choice":
        answer = visual.get("answer")
        need(isinstance(answer, int) and not isinstance(answer, bool) and 1 <= answer <= len(items), "quiz-choice needs answer: the number of the correct option (1 = first)")
    if kind == "true-false":
        need(all(re.search(r"\|\s*(true|false)\s*$", item, re.IGNORECASE) for item in items), "true-false items must look like 'Statement|True' or 'Statement|False'")
    columns = visual.get("columns")
    if columns is not None:
        need(kind in {"comparison-table", "priority-matrix", "kanban"}, "columns is only used by comparison-table, priority-matrix and kanban")
        need(isinstance(columns, list) and all(isinstance(col, str) and col.strip() for col in columns), "columns must be a list of headings")
    if kind == "comparison-table":
        need(isinstance(columns, list) and 2 <= len(columns) <= 4, "comparison-table needs columns: 2 to 4 option headings")
        need(all(item.count("|") == len(columns) for item in items), "comparison-table rows must look like 'Criterion|cell|cell' with one cell per column")
    if kind == "priority-matrix":
        need(isinstance(columns, list) and len(columns) == 4, "priority-matrix needs columns: the 4 quadrant names (top left, top right, bottom left, bottom right)")
        need(bool(visual.get("leftLabel")) and bool(visual.get("rightLabel")), "priority-matrix needs leftLabel (the vertical axis) and rightLabel (the horizontal axis)")
        names = [col.strip().lower() for col in columns]
        need(all(item.count("|") == 1 and item.split("|")[0].strip().lower() in names for item in items), "priority-matrix items must look like 'Quadrant name|text', using a name from columns")
        need(all(sum(1 for item in items if item.split("|")[0].strip().lower() == q) <= 2 for q in names), "priority-matrix holds at most 2 items per quadrant")
    if kind == "kanban":
        names = [col.strip().lower() for col in (columns or ["To do", "Doing", "Done"])]
        need(2 <= len(names) <= 4, "kanban has 2 to 4 columns")
        need(all(item.count("|") == 1 and item.split("|")[0].strip().lower() in names for item in items), f"kanban items must look like 'Column|card', using one of: {', '.join(names)}")
        need(all(sum(1 for item in items if item.split("|")[0].strip().lower() == q) <= 4 for q in names), "kanban holds at most 4 cards per column")
    if kind in {"myth-vs-fact", "pros-cons"}:
        need(left_count is not None, f"A {kind} visual needs leftCount (how many items are myths / pros)")
    if kind == "myth-vs-fact":
        need(left_count * 2 == len(items), "myth-vs-fact needs one fact per myth: list the myths, then the facts, with leftCount = number of myths")
    if kind == "pros-cons" and left_count is not None:
        need(left_count <= 4 and len(items) - left_count <= 4, "pros-cons holds at most 4 items per side")
    if kind == "analogy":
        need(bool(visual.get("leftLabel")) and bool(visual.get("rightLabel")), "analogy needs leftLabel (the new idea) and rightLabel (the familiar thing)")
        need(all(item.count("|") == 1 for item in items), "analogy items must look like 'part of the idea|matching part of the familiar thing'")
    if kind in {"pillars", "hierarchy-tree"}:
        need(bool(visual.get("center")), f"A {kind} visual needs center (the main idea)")
    if kind == "hierarchy-tree":
        branches = [item.strip().lower() for item in items if "|" not in item]
        need(2 <= len(branches) <= 4, "hierarchy-tree needs 2 to 4 branches (items without '|')")
        need(bool(items) and "|" not in items[0], "hierarchy-tree must start with a branch")
        for item in items:
            if "|" in item:
                owner = item.split("|", 1)[0].strip().lower()
                need(owner in branches, f"hierarchy-tree leaf {item!r} must name its branch before the '|'")
        need(all(sum(1 for item in items if item.split("|", 1)[0].strip().lower() == b and "|" in item) <= 3 for b in branches), "hierarchy-tree holds at most 3 details per branch")
    if kind in {"percent-ring", "line-chart"}:
        need(isinstance(values, list) and len(values) == len(items), f"A {kind} visual needs values, one spoken number per item")
    if kind == "percent-ring":
        need(all(0 <= v <= 100 for v in values), "percent-ring values are percentages from 0 to 100")
    if kind == "big-number":
        need(len(items) == 1 and NUMBER_RE.match(items[0]) is not None, "big-number needs one item like '72%|of teachers plan ahead'")
    if kind == "keyword-highlight":
        title = str(visual.get("title", "")).lower()
        need(all(item.strip().lower() in title for item in items), "keyword-highlight items must be words taken from the title sentence")
    if kind == "scenario-card":
        need(all(item.count("|") <= 1 for item in items), "scenario-card items are 'text' or 'Label|text'")
    pair_shapes = {"flip-card": "'Front|Back'", "match-pairs": "'Term|its match'", "dialogue": "'Speaker|what they say'", "glossary": "'Term|meaning'"}
    if kind in pair_shapes:
        need(all(item.count("|") == 1 and all(p.strip() for p in item.split("|")) for item in items), f"{kind} items must look like {pair_shapes[kind]}")
    if kind == "dialogue":
        need(len({item.split("|", 1)[0].strip() for item in items}) <= 2, "dialogue has at most two speakers")
    if kind == "fill-blank":
        title = str(visual.get("title", "")).lower()
        need(all(item.strip().lower() in title for item in items), "fill-blank items must be words taken from the title sentence")
    if kind in {"predict-reveal", "cause-effect", "next-lesson"}:
        need(bool(visual.get("center")), f"A {kind} visual needs center ({'the situation' if kind == 'predict-reveal' else 'the effect' if kind == 'cause-effect' else 'the next lesson'})")
    current = visual.get("current")
    if kind in {"agenda-progress", "gauge"}:
        need(isinstance(current, int) and not isinstance(current, bool) and 1 <= current <= len(items), f"{kind} needs current: the number of the {'part the lesson is at now' if kind == 'agenda-progress' else 'level the needle points to'} (1 = first)")
    elif kind == "chain":
        need(current is None or (isinstance(current, int) and not isinstance(current, bool) and 1 <= current <= len(items)), "chain current (the weakest link) must be an item number, 1 = first")
    elif current is not None:
        raise ValueError(f"current is only used by agenda-progress, gauge and chain: {context}")
    if kind == "q-and-a":
        need(left_count is not None and left_count * 2 == len(items), "q-and-a needs one answer per question: list the questions, then the answers, with leftCount = number of questions")
    if kind == "icon-array":
        need(len(items) == 1 and re.match(r"^\s*\d+\s*/\s*(10|20|50|100)\s*\|\s*\S", items[0]) is not None, "icon-array needs one item like '8/10|teachers plan ahead' (out of 10, 20, 50 or 100)")
        if items:
            part, whole = (int(v) for v in re.findall(r"\d+", items[0].split("|")[0])[:2])
            need(part <= whole, "icon-array: the part cannot be larger than the whole")
    if kind == "number-change":
        need(len(items) == 2 and all(NUMBER_RE.match(item) for item in items), "number-change needs two items like '40%|Before the course' and '75%|After the course'")
    if kind in {"rating-scale", "column-chart"}:
        need(isinstance(values, list) and len(values) == len(items), f"A {kind} visual needs values, one spoken number per item")
    if kind == "rating-scale":
        need(all(0 <= v <= 10 for v in values), "rating-scale values are scores from 0 to 10 (a 5-point scale when all are 5 or less)")
    if kind == "bridge":
        need(bool(visual.get("leftLabel")) and bool(visual.get("rightLabel")), "bridge needs leftLabel (where we are now) and rightLabel (the goal)")
    if kind == "swot":
        keys = [item.split("|")[0].strip().lower()[:1] for item in items]
        need(all(item.count("|") == 1 for item in items) and all(k in "swot" and k for k in keys), "swot items must look like 'Strengths|text', 'Weaknesses|text', 'Opportunities|text' or 'Threats|text'")
        need(all(keys.count(k) <= 2 for k in "swot"), "swot holds at most 2 items per quadrant")
    if kind in {"five-whys", "ripple", "hourglass", "zoom-in"}:
        need(bool(visual.get("center")), f"A {kind} visual needs center ({ {'five-whys': 'the problem', 'ripple': 'the action', 'hourglass': 'the focus in the middle', 'zoom-in': 'the big picture'}[kind] })")
    if kind == "hourglass":
        need(left_count is not None and left_count <= 3 and len(items) - left_count <= 3, "hourglass needs leftCount (inputs at the top), with at most 3 inputs and 3 outcomes")
    if kind == "radar":
        need(isinstance(values, list) and len(values) == len(items), "A radar visual needs values, one spoken score per item")
    if kind == "concept-map":
        need(all(item.count("|") == 2 and all(p.strip() for p in item.split("|")) for item in items), "concept-map items must look like 'Idea|relation|Other idea'")
        nodes = {p.strip() for item in items for p in item.split("|")[::2]}
        need(len(nodes) <= 6, "concept-map joins at most 6 different ideas")
    if kind == "circles-of-control":
        rings = [item.split("|")[0].strip().lower() for item in items]
        need(all(item.count("|") == 1 for item in items) and all(r.split()[0] in {"control", "influence", "concern"} for r in rings if r), "circles-of-control items must look like 'Control|text', 'Influence|text' or 'Concern|text'")
        need(rings.count("control") <= 2 and rings.count("influence") <= 3 and rings.count("concern") <= 3, "circles-of-control holds at most 2 items in Control and 3 in each other ring")
    if kind == "swimlanes":
        need(all(item.count("|") == 1 for item in items), "swimlanes items must look like 'Role|task'")
        need(len({item.split("|")[0].strip() for item in items}) <= 3, "swimlanes has at most 3 roles")
    if kind == "gantt":
        need(all(re.match(r"^[^|]+\|\s*\d+\s*\|\s*\d+\s*$", item) for item in items), "gantt items must look like 'Task|start|end', for example 'Plan|1|2'")
        need(all(1 <= int(item.split("|")[1]) <= int(item.split("|")[2]) <= 12 for item in items if re.match(r"^[^|]+\|\s*\d+\s*\|\s*\d+\s*$", item)), "gantt start and end are numbers from 1 to 12, start first")
    if kind == "week-plan":
        need(all(item.count("|") == 1 for item in items), "week-plan items must look like 'Day|activity'")
    if kind == "time-wheel":
        need(all(re.match(r"^[^|]+\|\s*\d+\s*$", item) for item in items), "time-wheel items must look like 'Part|minutes', for example 'Warm up|10'")
    if kind in {"traffic-light", "then-now-next", "head-heart-hands", "compass"}:
        need(all(item.count("|") <= 1 for item in items), f"{kind} items are 'text' or 'Label|text'")


def load_visual_plan(script_path: Path) -> dict[str, list[dict[str, Any]]]:
    plan_path = script_path.with_suffix(".visuals.json")
    if not plan_path.is_file():
        return {}
    raw = json.loads(plan_path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"Visual plan must be a JSON object: {plan_path}")
    plan: dict[str, list[dict[str, Any]]] = {}
    for section, beats in raw.items():
        if not isinstance(section, str) or not isinstance(beats, list) or not beats:
            raise ValueError(f"Timed visual-plan entry must be a non-empty array: {section}")
        checked: list[dict[str, Any]] = []
        for beat_index, beat in enumerate(beats):
            if not isinstance(beat, dict):
                raise ValueError(f"Invalid beat {beat_index + 1} for {section}")
            at_phrase = beat.get("atPhrase")
            if at_phrase is not None and not isinstance(at_phrase, str):
                raise ValueError(f"atPhrase must be text for {section} beat {beat_index + 1}")
            checked.append({
                "atPhrase": at_phrase,
                "visual": validate_visual(beat.get("visual"), f"{section} beat {beat_index + 1}"),
                "why": beat.get("why", ""),
            })
        if checked[0]["atPhrase"]:
            raise ValueError(f"The first visual beat for {section} must start at scene opening.")
        plan[section] = checked
    return plan


def normalize_token(value: str) -> str:
    return re.sub(r"[^\w]+", "", value, flags=re.UNICODE).casefold()


def resolve_phrase(words: list[dict[str, Any]], phrase: str, context: str) -> float:
    needle = [token for token in (normalize_token(part) for part in phrase.split()) if token]
    haystack = [normalize_token(str(word["text"])) for word in words]
    matches = [
        index for index in range(0, len(haystack) - len(needle) + 1)
        if haystack[index:index + len(needle)] == needle
    ]
    if len(matches) != 1:
        nearby = " ".join(str(word["text"]) for word in words[:80])
        raise ValueError(
            f"Phrase anchor must resolve exactly once ({context}): {phrase!r}; "
            f"matches={len(matches)}; narration words={nearby!r}"
        )
    return float(words[matches[0]]["start"])


STOP_WORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "with", "we", "they", "you",
    "it", "is", "are", "be", "as", "at", "by", "that", "this", "their", "our", "what", "how",
    "can", "may", "also", "but", "then", "now", "through", "about", "more", "not", "learners",
}


def _stem(token: str) -> str:
    return token[:5] if len(token) > 5 else token


def resolve_item_start(words: list[dict[str, Any]], phrase: str, item: str, context: str) -> float:
    """Start time of the word inside `phrase` that actually names `item`.

    Item phrases often include a lead-in ("setting, interactions" for Interactions,
    "but also observes" for Observe). Anchoring to the phrase's first word fires the card
    one word early. Instead, pick the first word in the phrase that shares a stem with
    the item label; fall back to the phrase start when nothing matches.
    """
    needle = [token for token in (normalize_token(part) for part in phrase.split()) if token]
    haystack = [normalize_token(str(word["text"])) for word in words]
    matches = [
        index for index in range(0, len(haystack) - len(needle) + 1)
        if haystack[index:index + len(needle)] == needle
    ]
    if len(matches) != 1:
        return resolve_phrase(words, phrase, context)  # raises with a helpful message
    first = matches[0]
    label = {_stem(tok) for tok in (normalize_token(part) for part in re.split(r"[\s·,/|-]+", item)) if tok and tok not in STOP_WORDS}
    for offset, token in enumerate(needle):
        if token not in STOP_WORDS and _stem(token) in label:
            return float(words[first + offset]["start"])
    return float(words[first]["start"])


def approximate_words(text: str, duration: float) -> list[dict[str, Any]]:
    tokens = text.split()
    if not tokens:
        return []
    each = duration / len(tokens)
    return [
        {"text": token, "start": index * each, "end": (index + 1) * each}
        for index, token in enumerate(tokens)
    ]


def captions_for_interval(
    words: list[dict[str, Any]],
    interval_start: float,
    interval_end: float,
) -> list[dict[str, Any]]:
    local = [
        {
            "text": word["text"],
            "start": max(0.0, float(word["start"]) - interval_start),
            "end": min(interval_end - interval_start, float(word["end"]) - interval_start),
        }
        for word in words
        if float(word["start"]) < interval_end and float(word["end"]) > interval_start
    ]
    return captions_from_words(local, interval_end - interval_start)


def estimated_duration(text: str) -> float:
    return max(4.0, len(text.split()) / 2.45 + 0.8)


def fallback_captions(text: str, duration: float) -> list[dict[str, Any]]:
    words = text.split()
    groups = [words[i : i + 7] for i in range(0, len(words), 7)]
    if not groups:
        return []
    each = duration / len(groups)
    return [
        {"startSeconds": round(i * each, 3), "endSeconds": round(min(duration, (i + 1) * each), 3), "text": " ".join(group)}
        for i, group in enumerate(groups)
    ]


def captions_from_words(words: list[dict[str, Any]], duration: float) -> list[dict[str, Any]]:
    if not words:
        return []
    cues: list[dict[str, Any]] = []
    current: list[dict[str, Any]] = []
    for word in words:
        current.append(word)
        boundary = len(current) >= 7 or re.search(r"[.!?]$", str(word["text"]))
        if boundary:
            cues.append({
                "startSeconds": round(float(current[0]["start"]), 3),
                "endSeconds": round(min(duration, float(current[-1]["end"]) + 0.12), 3),
                "text": " ".join(str(item["text"]) for item in current),
            })
            current = []
    if current:
        cues.append({
            "startSeconds": round(float(current[0]["start"]), 3),
            "endSeconds": round(duration, 3),
            "text": " ".join(str(item["text"]) for item in current),
        })
    return cues


# Pacing: a slightly slower voice and a silent pause after every paragraph, so the
# lesson breathes like the gaps between paragraphs in the script.
VOICE_RATE = "-6%"
PARAGRAPH_PAUSE_SECONDS = 1.3


async def synthesize_once(text: str, output_path: Path, voice: str) -> list[dict[str, Any]]:
    try:
        import edge_tts  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "edge-tts is not installed. Run: python3 -m pip install -r "
            "tools/requirements-script-video.txt"
        ) from exc

    words: list[dict[str, Any]] = []
    communicate = edge_tts.Communicate(
        text,
        voice,
        rate=VOICE_RATE,
        pitch="-1Hz",
        boundary="WordBoundary",
    )
    with output_path.open("wb") as audio:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = float(chunk["offset"]) / TICKS_PER_SECOND
                length = float(chunk["duration"]) / TICKS_PER_SECOND
                words.append({"text": chunk["text"], "start": start, "end": start + length})
    return words


async def synthesize(text: str, output_path: Path, voice: str) -> list[dict[str, Any]]:
    last_error: Exception | None = None
    for attempt in range(8):
        try:
            output_path.unlink(missing_ok=True)
            words = await asyncio.wait_for(synthesize_once(text, output_path, voice), timeout=90)
            # Never accept an empty or unreadable audio file (it would break the render later).
            if not output_path.is_file() or output_path.stat().st_size < 2000 or not words:
                raise RuntimeError("empty audio received")
            probe_duration(output_path)
            return words
        except Exception as exc:  # hosted TTS can throttle or time out transiently
            last_error = exc
            await asyncio.sleep(3 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {output_path.name}: {last_error}")


def greeting_end_seconds(words: list[dict[str, Any]]) -> float:
    """Start of the first Latin-script word when the narration opens with a non-Latin greeting."""
    for index, word in enumerate(words):
        if re.search(r"[A-Za-z]", str(word["text"])):
            return round(float(word["start"]), 3) if index > 0 else 0.0
    return 0.0


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def require_command(name: str) -> None:
    if shutil.which(name) is None:
        raise RuntimeError(f"Required command not found: {name}")


def concatenate_narration(audio_dir: Path, scene_paths: list[Path], slug: str) -> Path:
    """Create one convenient review track while retaining per-scene timing audio."""
    require_command("ffmpeg")
    silence = audio_dir / "pause.mp3"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono",
         "-t", str(PARAGRAPH_PAUSE_SECONDS), "-c:a", "libmp3lame", "-b:a", "48k", str(silence)],
        check=True,
    )
    lines = []
    for index, path in enumerate(scene_paths):
        lines.append(f"file '{path.name}'\n")
        if index < len(scene_paths) - 1:
            lines.append(f"file '{silence.name}'\n")
    concat_file = audio_dir / "concat.txt"
    concat_file.write_text("".join(lines), encoding="utf-8")
    output = audio_dir / f"{slug}-narration.mp3"
    subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "concat", "-safe", "0", "-i", str(concat_file),
            "-c:a", "libmp3lame", "-b:a", "64k", str(output),
        ],
        check=True,
    )
    concat_file.unlink(missing_ok=True)
    silence.unlink(missing_ok=True)
    return output


def srt_timestamp(seconds: float) -> str:
    milliseconds = max(0, round(seconds * 1000))
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def write_lesson_artifacts(manifest: dict[str, Any]) -> None:
    """Retain the current timing manifest and subtitle sidecar with the lesson."""
    match = re.search(r"\bLesson\s+(\d+)\b", str(manifest.get("title", "")), flags=re.IGNORECASE)
    if not match:
        return
    lesson = match.group(1).zfill(2)
    generated_dir = REPO_ROOT / "work" / f"lesson-{lesson}"
    generated_dir.mkdir(parents=True, exist_ok=True)
    (generated_dir / "script-video-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    cues: list[str] = []
    cue_index = 1
    for scene in manifest["scenes"]:
        scene_start = float(scene["startSeconds"])
        for caption in scene["captions"]:
            start = scene_start + float(caption["startSeconds"])
            end = scene_start + float(caption["endSeconds"])
            cues.append(
                f"{cue_index}\n{srt_timestamp(start)} --> {srt_timestamp(end)}\n"
                f"{caption['text']}\n"
            )
            cue_index += 1
    (generated_dir / f"lesson-{lesson}.srt").write_text("\n".join(cues), encoding="utf-8")


async def build_manifest(script_path: Path, voice: str, plan_only: bool) -> dict[str, Any]:
    title, blocks = parse_markdown(script_path)
    visual_plan = load_visual_plan(script_path)
    course_config = json.loads(COURSE_CONFIG_PATH.read_text(encoding="utf-8"))
    slug = slugify(script_path.stem)
    audio_dir = PUBLIC_DIR / slug
    if not plan_only:
        require_command("ffprobe")
        audio_dir.mkdir(parents=True, exist_ok=True)

    scenes: list[dict[str, Any]] = []
    audio_tracks: list[dict[str, Any]] = []
    scene_audio_paths: list[Path] = []
    cursor = 0.0
    greeting_end = 0.0
    for source_index, block in enumerate(blocks):
        source_scene_id = f"source-scene-{source_index + 1:03d}"
        if plan_only:
            duration = estimated_duration(block.narration)
            audio_src = None
            words = approximate_words(block.narration, duration)
        else:
            audio_path = audio_dir / f"{source_scene_id}.mp3"
            print(f"Narrating {source_scene_id} ({source_index + 1}/{len(blocks)})", flush=True)
            words = await synthesize(block.narration, audio_path, voice)
            timing_path = audio_dir / f"{source_scene_id}.words.json"
            timing_path.write_text(
                json.dumps(words, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            duration = probe_duration(audio_path)
            audio_src = f"script-videos/{slug}/{source_scene_id}.mp3"
            scene_audio_paths.append(audio_path)
        if source_index == 0:
            greeting_end = greeting_end_seconds(words)
        audio_tracks.append({
            "id": source_scene_id,
            "startSeconds": round(cursor, 3),
            "durationSeconds": round(duration, 3),
            "audioSrc": audio_src,
            "narration": block.narration,
            "section": block.section,
        })

        beats = visual_plan.get(block.key)
        if not beats:
            beats = [{
                "atPhrase": None,
                "visual": visual_for(block, source_index, len(blocks), title),
            }]
        starts = [0.0]
        for beat_index, beat in enumerate(beats[1:], start=2):
            starts.append(resolve_phrase(words, str(beat["atPhrase"]), f"{block.key} beat {beat_index}"))
        if any(right <= left for left, right in zip(starts, starts[1:])):
            raise ValueError(f"Visual phrase anchors are not strictly increasing in {block.key}")
        ends = [*starts[1:], duration]
        for beat_index, (beat, beat_start, beat_end) in enumerate(zip(beats, starts, ends), start=1):
            beat_words = [str(word["text"]) for word in words if beat_start <= float(word["start"]) < beat_end]
            captions = captions_for_interval(words, beat_start, beat_end)
            visual = dict(beat["visual"])
            item_phrases = visual.pop("itemPhrases", None)
            reveal_phrase = visual.pop("revealPhrase", None)
            if reveal_phrase:
                reveal_start = resolve_phrase(words, str(reveal_phrase), f"{block.key} beat {beat_index} revealPhrase")
                if not beat_start <= reveal_start < beat_end:
                    raise ValueError(f"revealPhrase falls outside its visual beat in {block.key} beat {beat_index}")
                visual["revealStartSeconds"] = round(reveal_start - beat_start, 3)
            if item_phrases:
                item_starts = [
                    max(0.0, resolve_item_start(words, phrase, item_label, f"{block.key} beat {beat_index} item {item_index}") - beat_start)
                    for item_index, (phrase, item_label) in enumerate(zip(item_phrases, visual.get("items") or []), start=1)
                ]
                # Items that share a phrase can resolve to words in a different order than
                # the cards; keep the reveal sequence monotonic.
                if visual.get("kind") not in COLUMN_KINDS:
                    for k in range(1, len(item_starts)):
                        item_starts[k] = max(item_starts[k], item_starts[k - 1])
                if any(start >= beat_end - beat_start for start in item_starts):
                    raise ValueError(f"Item phrase anchor falls outside its visual beat in {block.key} beat {beat_index}")
                ordered = sorted(item_starts)
                for left, right in zip(ordered, ordered[1:]):
                    if right - left < 0.45:
                        print(
                            f"WARNING: two cards appear together ({right - left:.2f}s apart) in "
                            f"{block.key} beat {beat_index} ({visual.get('title')!r}). "
                            "Give each item its own phrase in the .visuals.json.",
                            flush=True,
                        )
                        break
                visual["itemStartSeconds"] = [round(start, 3) for start in item_starts]
            scenes.append({
                "id": f"scene-{source_index + 1:03d}-beat-{beat_index:02d}",
                "sourceSceneId": source_scene_id,
                "startSeconds": round(cursor + beat_start, 3),
                "durationSeconds": round(beat_end - beat_start, 3),
                "audioSrc": None,
                "narration": " ".join(beat_words),
                "section": block.section,
                "background": "dark" if source_index > 0 and source_index % 2 == 0 else "light",
                "visual": visual,
                "captions": captions,
            })
        cursor += duration
        if source_index < len(blocks) - 1:
            # Silent pause: the paragraph's last slide stays on screen through it.
            scenes[-1]["durationSeconds"] = round(scenes[-1]["durationSeconds"] + PARAGRAPH_PAUSE_SECONDS, 3)
            cursor += PARAGRAPH_PAUSE_SECONDS

    narration_audio_src = None
    if not plan_only:
        narration_path = concatenate_narration(audio_dir, scene_audio_paths, slug)
        narration_audio_src = f"script-videos/{slug}/{narration_path.name}"
        print(f"Narration: {narration_path}")

    return {
        "version": 1,
        "slug": slug,
        "title": title,
        "lessonLabel": lesson_label(course_config, title),
        "fps": 30,
        "width": 1920,
        "height": 1080,
        "totalDurationSeconds": round(cursor, 3),
        "greetingEndSeconds": greeting_end,
        "narrationAudioSrc": narration_audio_src,
        "audioTracks": audio_tracks,
        "scenes": scenes,
    }


def refresh_manifest_visuals(script_path: Path) -> dict[str, Any]:
    """Update only lesson visual data while preserving approved audio and timings."""
    if not MANIFEST_PATH.is_file():
        raise FileNotFoundError(f"Manifest not found: {MANIFEST_PATH}")
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    title, blocks = parse_markdown(script_path)
    raise ValueError("Timed visual plans use phrase anchors; rebuild narration to refresh visuals safely.")
    course_config = json.loads(COURSE_CONFIG_PATH.read_text(encoding="utf-8"))
    manifest["title"] = title
    manifest["lessonLabel"] = lesson_label(course_config, title)
    return manifest


def render_video(manifest: dict[str, Any], final: bool, approved_by: str | None) -> Path:
    require_command("npx")
    if final and not approved_by:
        raise ValueError("Final render requires --approved-by NAME after review approval.")
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    suffix = "" if final else "-review"
    output = OUT_DIR / f"{manifest['slug']}{suffix}.mp4"
    crf = "16" if final else "23"
    subprocess.run(
        [
            "npx", "remotion", "render", "src/index.ts", "ScriptVideo", str(output),
            "--codec=h264", f"--crf={crf}", "--audio-codec=aac",
        ],
        cwd=ENGINE_DIR,
        check=True,
    )
    if final:
        approval = OUT_DIR / f"{manifest['slug']}-approval.json"
        approval.write_text(json.dumps({"approvedBy": approved_by}, indent=2) + "\n", encoding="utf-8")
    return output


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create a narrated, branded lesson video from one Markdown narration script.")
    parser.add_argument("script", type=Path, help="Markdown script. H1 is the title; H2 headings organize scenes.")
    parser.add_argument("--voice", default=None, help="Edge voice name (default: course-config.json voice.name).")
    parser.add_argument("--plan-only", action="store_true", help="Build the visual manifest without TTS or rendering.")
    parser.add_argument("--no-render", action="store_true", help="Generate narration and the manifest, but no review MP4.")
    parser.add_argument("--refresh-visuals", action="store_true", help="Update visuals only; preserve existing narration, captions, and timing.")
    parser.add_argument("--final", action="store_true", help="Render the approved CRF 16 final instead of a review MP4.")
    parser.add_argument("--approved-by", help="Reviewer name required with --final.")
    return parser.parse_args()


def apply_voice_settings(args: argparse.Namespace) -> None:
    """Voice, speed and paragraph pause come from course-config.json ("voice" block)."""
    global VOICE_RATE, PARAGRAPH_PAUSE_SECONDS
    voice = {}
    if COURSE_CONFIG_PATH.is_file():
        voice = json.loads(COURSE_CONFIG_PATH.read_text(encoding="utf-8")).get("voice") or {}
    if args.voice is None:
        args.voice = str(voice.get("name") or DEFAULT_VOICE)
    VOICE_RATE = str(voice.get("rate", VOICE_RATE))
    PARAGRAPH_PAUSE_SECONDS = float(voice.get("paragraphPauseSeconds", PARAGRAPH_PAUSE_SECONDS))


async def async_main() -> int:
    args = parse_args()
    apply_voice_settings(args)
    script_path = args.script.expanduser().resolve()
    if not script_path.is_file():
        raise FileNotFoundError(f"Script not found: {script_path}")
    if sum(bool(value) for value in (args.plan_only, args.refresh_visuals, args.final)) > 1:
        raise ValueError("--plan-only, --refresh-visuals, and --final cannot be combined.")

    manifest = refresh_manifest_visuals(script_path) if args.refresh_visuals else await build_manifest(script_path, args.voice, args.plan_only)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    write_lesson_artifacts(manifest)
    print(f"Manifest: {MANIFEST_PATH}")

    if args.plan_only or args.no_render or args.refresh_visuals:
        return 0
    output = render_video(manifest, args.final, args.approved_by)
    print(f"Video: {output}")
    return 0


def main() -> int:
    try:
        return asyncio.run(async_main())
    except (ValueError, FileNotFoundError, RuntimeError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
