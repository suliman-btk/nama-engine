# Making a video from a transcript (for AI agents)

The person gives you a lesson transcript. You prepare the video, show review pictures, and make
the final video only after they confirm. Keep them informed in plain words; do the technical
steps yourself. Everything runs locally on their computer.

## 1. Save the transcript

- Shape: see `transcripts/TEMPLATE-Lesson.md`. First line `# <COURSE> — Lesson <N>: <Title>`,
  then `## Pure narration`, then paragraphs separated by empty lines. An optional short greeting
  on its own line is spoken on the opening title slide.
- The spoken words are **locked**: copy them exactly. Never change, add or remove words. If the
  first line or lesson number is missing, ask for it; do not invent it.
- Save as `transcripts/<COURSE>-Lesson-NN-Short-Title.md` (NN = two digits).

## 2. Plan the slides

Write `<same name>.visuals.json` next to the transcript: for every paragraph, the slides shown
while it is spoken and the exact words that bring in each slide and each card.

- Choose designs with `docs/visual-planning.md` ("How to choose a design"): steps -> process,
  two sides -> comparison, parts around a centre -> mind-map, "not X but Y" -> before-after, a
  term -> definition, and so on. Lesson-flow designs give the video a shape: an `agenda` or
  `learning-objectives` near the start, a `quiz-choice` or `true-false` where the narrator asks a
  question, `key-takeaways` and `next-steps` before the close. Keep plain statement slides to
  about a third or less. `transcripts/NAMA-Lesson-02-Design-Gallery.*` and
  `transcripts/NAMA-Lesson-03-Design-Gallery-2.*` and `transcripts/NAMA-Lesson-04-Design-Gallery-3.*`
  show one slide of each of the newer designs
  with a working plan. Practice designs (`flip-card`, `match-pairs`, `sequence-order`,
  `predict-reveal`, `fill-blank`) make the learner think before the answer is shown.
- Keys are `"Pure narration · 1"`, `"Pure narration · 2"`, ... in paragraph order (the greeting
  joins paragraph 1). Paragraph 1 starts with the title slide (`kind: "title"`).
- Card text comes from the narration and stays short.
- Run `python3 tools/check_visual_plan.py transcripts/<file>.md` and fix every ERROR and WARN.
  Common fixes: an anchor phrase must appear exactly once in its paragraph (add a neighbouring
  word); a card spoken before its slide appears must move; long text must be shortened.

If you cannot write a plan, the engine still works: without a `.visuals.json` it chooses simple
slides by itself. A plan gives much better videos.

## 3. Prepare and check

`./prepare-video transcripts/<file>.md`

It records the voice (needs internet), times every slide to the voice, then checks every slide
at the moment it is complete:

- text cut off at the edge, or not fitting its card;
- texts overlapping each other or running into a logo;
- logos or pictures that fail to load or are hidden against the background;
- text that is invisible or hard to read because of the colours.

Results go to `output/review/<lesson>/`: `report.md` (plain words), one picture per slide, and
review sheets `sheet-1.png`, `sheet-2.png`, ... with many moments of the video (opening, every
slide, closing), each labelled with its time.

If the check finds problems, fix the cause and run `./prepare-video` again:
- cut off / overlap: shorter card text, fewer cards, or another design in the `.visuals.json`;
- hidden logo / colours: `python3 tools/course_setup.py --primary ... --accent ...`, or a white
  logo for dark slides (`--logo-white`).
Items marked "advice" are optional.

## 4. Independent review (reviewer agent)

Ask a separate reviewer agent to look at every picture with `docs/review-checklist.md` (Claude
Code: the `video-reviewer` subagent). It catches what measurements miss, such as a coloured logo
that is hard to see on a dark panel. Fix everything it reports, prepare again, and review again
until it answers PASS. Without sub-agents, do this review yourself.

## 5. Show the review pictures and ask

Open and show the review sheets (and any slide picture with a problem). Summarise `report.md` in
one or two sentences. Ask: "Does everything look right? Shall I make the final video?" Change
and prepare again until they say yes.

## 6. Make the final video

Only after a clear yes: `./render-video`. It renders locally into `output/<lesson>.mp4` (and
keeps the subtitles file in `work/`). Tell the person where the video is.

For several lessons, repeat steps 1-6 for each, one at a time.

## Built-in timing (no action needed)

Voice speed and the pause between paragraphs come from the course settings. Each slide appears
just before its words, never two slides at once, and the opening title stays readable for about
two seconds while the voice continues.
