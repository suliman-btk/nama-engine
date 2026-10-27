# NAMA Engine

**Provided by NAMA Foundation.**

NAMA Engine turns a lesson transcript (plain text) into a finished teaching video: a natural
narrator's voice, animated slides and diagrams that appear exactly when the voice talks about
each idea, subtitles, and your own logo and colours. No filming and no editing. Everything,
including the final video, is made on your own computer.

## How it works

1. **Install** - prepare your computer once.
2. **Set up your course** - answer a few simple questions: course name, logo, colours, voice.
3. **Give your transcript** - the text of one lesson.
4. **Review** - you get pictures of many moments of the video, checked for overlapping text,
   hidden logos and colour problems.
5. **Confirm** - when you are happy, the final video is made on your computer.

## The easy way: with an AI assistant

Open this folder with an AI coding assistant (Claude Code, Codex, Cursor, Gemini CLI, GitHub
Copilot, ...) and say:

> **"Set up NAMA Engine for my course."**

The assistant follows [`AGENTS.md`](AGENTS.md): it installs what is needed, asks you simple
questions one at a time, shows you previews, then says **"I'm ready - please give me the
transcript"**. Send your lesson text, look at the review pictures it shows you, and confirm.
Your video is saved in the `output` folder.

## Doing it yourself

You need a Mac or Linux computer and an internet connection (for the voice).

| Step | Command |
|---|---|
| Prepare the computer (once) | `./setup` |
| Make this your own copy (once) | `./detach-copy` |
| See or change course settings | `python3 tools/course_setup.py --show` / `--help` |
| Preview the look | `./preview-brand` |
| Prepare a lesson + review pictures | `./prepare-video transcripts/<lesson>.md` |
| Make the final video | `./render-video` |

Write transcripts like [`transcripts/TEMPLATE-Lesson.md`](transcripts/TEMPLATE-Lesson.md).

## Your copy is yours

When you download or clone NAMA Engine, run `./detach-copy` once (your assistant offers this).
It disconnects your folder from the original NAMA Engine project, so your changes stay with you
and can never be sent back to the original.

## Folders

| Folder | What is inside |
|---|---|
| `transcripts/` | Your lesson transcripts and their slide plans |
| `output/` | Your finished videos and review pictures (stays on your computer) |
| `course-config.json` | Your course settings (made by the setup questions) |
| `docs/` | Guides used by the AI assistant |
| `engine/` | The video engine itself |
| `tools/` | Helper tools |
