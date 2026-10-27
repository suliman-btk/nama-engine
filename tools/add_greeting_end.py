#!/usr/bin/env python3
"""Add greetingEndSeconds to already-built script-video manifests (no new voice needed).

Usage: python3 tools/add_greeting_end.py <manifest.json> [...]
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "engine" / "public"

for arg in sys.argv[1:]:
    path = Path(arg)
    manifest = json.loads(path.read_text(encoding="utf-8"))
    track = (manifest.get("audioTracks") or [{}])[0]
    words_path = PUBLIC / "script-videos" / manifest["slug"] / f"{track.get('id', 'source-scene-001')}.words.json"
    end = 0.0
    if words_path.is_file():
        words = json.loads(words_path.read_text(encoding="utf-8"))
        for index, word in enumerate(words):
            if re.search(r"[A-Za-z]", str(word["text"])):
                end = round(float(word["start"]), 3) if index > 0 else 0.0
                break
    manifest["greetingEndSeconds"] = end
    path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path}: greetingEndSeconds={end}")
