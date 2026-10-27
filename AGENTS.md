# NAMA Engine - instructions for AI agents

This file is for every AI agent (Claude Code, Codex, Cursor, Gemini, Copilot, ...). NAMA Engine
is provided by NAMA Foundation. It turns a lesson transcript into a narrated video with timed
slides, subtitles and the user's branding. Follow the workflow below exactly.

## Who you are talking to

Assume the person is **not technical**. Use simple words and short sentences. Ask one question
at a time and offer choices with a recommended default. Do every technical step yourself
(commands, files, fixes) and report in plain language: what happened, what they need to decide,
what comes next. Never ask them to edit files or read code. Show pictures, not logs.

## The workflow (always in this order)

### 1. Install (once per computer)
Run `./setup`. If it shows `[!!]` lines, explain them simply and help fix them, then run it again.

### 2. Make it their own copy (once)
Run `git remote -v`. If it shows a link to the original NAMA Engine project
(`suliman-btk/nama-engine`), say: "This folder is still linked to the original NAMA Engine. I'll
make it your own copy so your changes stay with you." Then run `./detach-copy`. Skip this only if
the person says they maintain the original NAMA Engine.

### 3. Set up the course (once per course)
If `.course-setup-done` does not exist, run the setup interview in `docs/setup-interview.md`:
course name, logos, colours, voice, speed, pauses, subtitles. Apply the answers with
`python3 tools/course_setup.py ...`, show `./preview-brand` pictures, adjust until they are
happy, then run `python3 tools/course_setup.py --done`.

### 4. Ask for the transcript
Say: **"I'm ready. Please give me the transcript of your lesson."** (Pasted text or a file.)

### 5. Prepare and review (never skip)
Follow `docs/making-a-video.md`:
1. Save the transcript unchanged in `transcripts/` in the template shape. The spoken words are
   locked: never change, add or remove them. If something looks wrong, ask.
2. Write the slide plan (`<transcript>.visuals.json`) using `docs/visual-planning.md`, and run
   `python3 tools/check_visual_plan.py transcripts/<file>.md` until it passes.
3. Run `./prepare-video transcripts/<file>.md`. It records the voice, times every slide and
   checks every slide for overlapping or cut-off text, hidden or missing logos, and colours that
   make text or logos hard to see. Fix every problem it reports and run it again until it passes.
4. **Independent visual review (reviewer agent).** Measurements do not catch everything (for
   example a coloured logo that is hard to see on a dark panel). Start a separate reviewer
   agent - in Claude Code the `video-reviewer` subagent; in other tools any sub-agent or a fresh
   session - and give it `docs/review-checklist.md` and the folder `output/review/<lesson>/`.
   If your tool has no sub-agents, do the review yourself with the same checklist, opening every
   picture. If the reviewer answers FIX, fix every item, run `./prepare-video` again and review
   again. Continue only when both the automatic check and the reviewer pass.
5. Show the person the review pictures from `output/review/<lesson>/` (`sheet-1.png`,
   `sheet-2.png`, ... - many moments of the video, each labelled with its time) and the short
   summary from `report.md`. Ask: **"Does everything look right? Shall I make the final video?"**
6. If they want changes, make them, run `./prepare-video` again, review again, and show the new pictures.

### 6. Make the final video (only after a clear "yes")
Run `./render-video`. It renders **locally on this computer** into `output/<lesson>.mp4`. Tell
them where the file is. Never render before the person has confirmed the review pictures.

## Commands

| Command | What it does |
|---|---|
| `./setup` | Checks and installs Python packages, Node.js packages, ffmpeg |
| `./detach-copy` | Disconnects this folder from the original NAMA Engine project |
| `python3 tools/course_setup.py --show` / `--help` | Shows / changes course settings (name, logos, colours, voice, speed, pause, subtitles, font) |
| `python3 tools/course_setup.py --colors-from-logo <file>` | Suggests colours from a logo |
| `./preview-brand` | 3 preview pictures in `output/brand-preview/` |
| `python3 tools/check_visual_plan.py <transcript>.md` | Checks a slide plan |
| `./prepare-video <transcript>.md` | Voice + timing + full slide check + review pictures in `output/review/` |
| `./check-video` | Re-runs only the slide check and review pictures for the prepared lesson |
| `./render-video` | Makes the final MP4 locally in `output/` (after confirmation) |
| `cd engine && npm start` | Live preview in the browser |

## Golden rules

- Keep everything **local**: build and render on the person's computer. Never upload their
  transcripts, logos or videos anywhere.
- The transcript's spoken words are locked.
- Branding lives only in `course-config.json` and `engine/public/brand/`, written by
  `tools/course_setup.py`. Do not edit engine code for one course.
- Never render without a passing slide check and the person's confirmation of the review pictures.
- Prepare one lesson at a time (lessons share one working file).
- Never push to, open pull requests on, or create branches in the original NAMA Engine project.
- Ask before anything hard to undo (deleting files, publishing).
