# Course setup interview (for AI agents)

Use this when someone wants to make videos for their own course, or when the file
`.course-setup-done` does not exist in the repository root. The goal: brand the engine for their
course by asking simple questions, then apply the answers with one command.

## How to talk to the person

- Assume they are **not technical**. Never say: JSON, config, repo, branch, terminal, flag,
  hex, render, manifest, Remotion, TTS. Say instead: settings, project folder, colour code,
  make the video, voice.
- Ask **one question at a time**. Offer simple choices with a recommended default, for example
  "A) Man's voice (recommended) B) Woman's voice". If your tool can show multiple-choice
  questions, use it.
- Explain *why* you ask in one short sentence ("This colour is used for titles and dark slides").
- If they don't know or don't care, use the default and say so. Never block on a question.
- Before saving, read back a short summary and ask "Shall I save this?".
- After saving, show them the preview pictures and ask if they are happy. Change and repeat
  until they are.

Do all the technical work yourself (copying files, running commands). The person only answers
questions and looks at pictures.

## Step 0 - Check and welcome

1. Run `python3 tools/course_setup.py --show` to see the current settings.
2. If `git remote -v` still shows the original NAMA Engine project (`suliman-btk/nama-engine`),
   explain in one sentence and run `./detach-copy` so this becomes their own copy (AGENTS.md step 2).
3. If the computer has never been prepared, run `./setup` first (it checks and installs what is
   needed). Explain any `[!!]` line in plain words and help fix it.
4. Say in two or three sentences what the engine does: "You give me the transcript of a lesson. I
   turn it into a video with a narrator's voice, animated slides that appear exactly when the
   voice mentions each idea, subtitles, and your logo and colours."

## The questions (in this order)

| # | Ask (plain words) | Default if they skip | Becomes |
|---|---|---|---|
| 1 | "What is the short name of your course? It appears in the corner of every slide, like 'GTA · Lesson 3'." | - (required) | `--course-id` |
| 2 | "What is the full name of the course?" | same as short name | `--course-name` |
| 3 | "Please send me your organisation's logo in colour." (PNG with a transparent background is best) | keep current | `--logo` |
| 4 | "Do you also have a white version of the logo? It looks better on dark slides." | use the colour one | `--logo-white` |
| 5 | "Is there a separate logo for the course itself? It is shown big on the opening slide. If not, I'll write the course name there." | course name as text | `--course-logo` / `--no-course-logo` |
| 6 | "Would you like a small partner logo on the opening slide, with a short line like 'In partnership with ...'?" | none | `--badge-logo`, `--badge-text` / `--no-badge` |
| 7 | "Which colours should the videos use? I can take them from your logo." | colours from the logo | `--primary`, `--accent` |
| 8 | "Should the narrator be a man or a woman, and which accent?" | man, American | `--voice` |
| 9 | "How fast should the voice speak? A) Normal B) A bit slower (recommended for teaching) C) A bit faster" | a bit slower | `--speed` (`+0%`, `-6%`, `+6%`) |
| 10 | "How long should the voice pause between paragraphs? A) Short B) Normal (recommended) C) Long" | normal | `--pause` (`0.8`, `1.3`, `2.0`) |
| 11 | "Show subtitles at the bottom of the video?" | yes | `--subtitles on/off` |
| 12 | "Any font your organisation uses? (It must be installed on this computer.)" | the standard clean font | `--font` |

Notes for each question:

- **Logos (3–6):** ask them to drag the file into the chat, or to tell you where it is (for
  example "Desktop, file logo.png"). If you cannot receive files, ask them to put the files in a
  folder called `my-brand` inside the project folder. You pass the file path to the command;
  it copies the file into the engine for you.
- **Colours (7):** run `python3 tools/course_setup.py --colors-from-logo <logo>`.
  Describe the result in words ("dark blue" and "gold") and recommend the darkest strong colour
  as the **main colour** (titles, dark slides) and a bright contrasting one as the **accent**
  (highlights, lines). If they name colours ("dark green and orange"), choose fitting colour
  codes yourself and show them in the preview. The command warns if titles would be hard to
  read; if it does, suggest a darker shade and explain why.
- **Voice (8):** pick from this list (all free Microsoft voices). To hear a voice before
  choosing, make a short sample: `python3 -m edge_tts --voice <name> --text "Hello, welcome to the course." --write-media sample.mp3`, and play it for them.

  | Choice | Voice name |
  |---|---|
  | Man, American, warm (recommended) | `en-US-AndrewMultilingualNeural` |
  | Woman, American | `en-US-AvaMultilingualNeural` |
  | Man, British | `en-GB-RyanNeural` |
  | Woman, British | `en-GB-SoniaNeural` |
  | Man, Arabic | `ar-SA-HamedNeural` |
  | Woman, Arabic | `ar-SA-ZariyahNeural` |

  The full list: `python3 -m edge_tts --list-voices`. Be honest: the slide designs are made for
  left-to-right text; if the whole course is in Arabic, say that slide text may need checking.
- **Opening animation:** do not ask. Use `--animation logo` (works with any logo). The
  `nama-animated` style animates the NAMA Foundation logo itself; use it only for NAMA's own courses.

## Save, preview, confirm

1. Read back a short summary in plain words, ask "Shall I save this?".
2. Run one command with all answers, for example:

   ```
   python3 tools/course_setup.py --course-id GTA --course-name "Green Teachers Academy" \
     --logo my-brand/logo.png --logo-white my-brand/logo-white.png --no-course-logo --no-badge \
     --primary "#0B5D3B" --accent "#E07A1F" --voice en-GB-SoniaNeural --speed -6% --pause 1.3 \
     --subtitles on --animation logo
   ```
3. Run `./preview-brand` and show the three pictures it saves in
   `output/brand-preview/` (opening animation, title slide, a normal slide).
   Explain that the slide text is from a sample lesson; their own lessons will show their text.
   Then run `./check-video`: it checks every slide of the sample lesson with the new colours and
   reports text or logos that would be hidden or hard to read. Fix colour problems before going on.
4. Ask "Are you happy with how this looks?" Adjust with the same command (only the changed
   options) and preview again until they are.
5. Finish with `python3 tools/course_setup.py --done`, then say:
   **"I'm ready. Please give me the transcript of your lesson."**

Never edit engine code to apply branding. Everything above is stored in `course-config.json`
and the logo files; that is what makes the engine reusable.
