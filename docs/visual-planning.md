# Slide planning guide

How to choose the slides for a NAMA Engine video (`transcripts/<lesson>.md` + `<lesson>.visuals.json`).
Check every plan with `python3 tools/check_visual_plan.py transcripts/<lesson>.md`.

## How to choose a design (mandatory reasoning — do not pick for variety)

For every beat, work through these steps before writing it. The design must be the one whose
**shape matches the shape of the information**. If you cannot say why in one line, the design is wrong.

1. **Read the passage and name its structure.** What is the narration actually doing?
   - naming separate examples → a set
   - doing things in order → a sequence
   - one thing made of parts → a whole
   - one thing at the centre with parts around it → a hub
   - two things set against each other → a contrast
   - two things that work together → a partnership
   - something that narrows, builds, balances, repeats, drives, or hides → a movement
   - a rule that depends on a condition → a decision
   - a term being explained → a definition
   - a number being stated → a figure
2. **Match structure → design** with the table below. Take the *first* row whose "use when" is true.
3. **Test the pick** — all three must be yes:
   - Would the viewer understand the relationship with the voice muted?
   - Does every card text come from words the narrator says?
   - Is the number of items within the design's limits, and does the order of the items match the order spoken?
4. **If the test fails, choose the next-best row. If nothing fits, use `statement` or `checklist` — plain is better than a diagram that says the wrong thing.**
5. **Write the reason** in the beat as `"why"` (sibling of `visual`), e.g. `"why": "narrator contrasts delivery with learning → before-after"`. The checker warns when it is missing.

### Design guide: use when / do not use when

| Design | Use when the narration… | Do NOT use when |
|---|---|---|
| `statement` | gives one key sentence to remember | there are several parallel things to show |
| `question` | poses a question to the learner | the question is answered immediately with a list |
| `checklist` | lists things to do, check, or consider (2–6) | the items are ordered, or have a relationship to each other |
| `card-grid` | names separate, equal examples with no order | items are steps, or one is the goal |
| `process` | gives ordered steps, one direction (3–5) | the steps loop, or it is a long journey |
| `roadmap-path` | describes a longer journey with milestones (3–6) | there are only two or three quick steps |
| `timeline` | tells events in time, or a dialogue/sequence of moments | the order is not about time |
| `cycle` | describes a loop that repeats, ending where it began | the last step does not lead back to the first |
| `staircase` | shows growth by levels, each one higher than the last | levels are parallel, not progressive |
| `pyramid` | builds from a foundation up to a peak | there is no top, or items are equal |
| `layer-stack` | describes layers that sit on or align with each other | the items are not stacked in meaning |
| `target` | says several things all aim at one goal (last = goal) | there is no single goal |
| `mind-map` | has one central idea with 3–6 parts around it (`center`) | the parts are ordered, or there are only two |
| `quadrant` | names exactly four areas of one idea | there are 3 or 5 |
| `venn` | shows two or three ideas that overlap into something new | the ideas do not overlap |
| `donut` | shows facets that together make one whole | the facets are steps |
| `bar-chart` | compares quantities that the narration states | no numbers are spoken |
| `comparison` | sets two groups side by side (`joiner` `VS`, `+`, or `?`) | one side is simply wrong or to be avoided |
| `before-after` | says "not X, but Y", "instead of", "rather than" | both sides are equally good |
| `funnel` | narrows many options or inputs to one result | nothing is filtered out |
| `spectrum` | places things on a continuum between two poles | the items are not on one scale |
| `balance` | keeps two sides in balance or weighs them (≤3 per side) | the sides are not in tension |
| `decision-tree` | says "if A then X, if B then Y" — a choice driven by a condition | no condition decides the action |
| `iceberg` | contrasts what is visible with what lies beneath | nothing is hidden |
| `stat-tiles` | states real numbers ("five domains, fifteen principles") | the number is not spoken — never invent one |
| `gears` | says parts drive or depend on each other (2–4) | the parts are independent |
| `definition` | explains a key term and what it means | there is no term being defined |
| `agenda` | previews the parts of the lesson in order (3–6) | it is the content itself, not a preview |
| `learning-objectives` | says what learners "will be able to" do (2–4) | no goals are stated |
| `key-takeaways` | sums up the points to remember (3–5) | it is new content, not a recap |
| `next-steps` | tells learners what to do after the lesson (1–3) | the actions are part of the lesson's own steps |
| `quiz-choice` | asks a question, reads 2–4 options, then says the answer | the answer or the options are not spoken |
| `true-false` | asks "true or false?" about 1–3 statements, then gives the verdict | no verdict is spoken |
| `tip-callout` | gives a tip, a reminder, a note or a warning (1–2 lines) | it is the main teaching point (use `statement`) |
| `scenario-card` | tells a short case: situation → challenge → resolution (2–4 parts) | there is no story, only a list |
| `worked-example` | works through an example step by step, each step with a result (3–6) | the steps have no results (use `process`) |
| `analogy` | says "X is like Y" and maps parts of X onto parts of Y (1–3 pairs) | there is no comparison to something familiar |
| `myth-vs-fact` | corrects misconceptions: "people think X — in fact Y" (1–3 pairs) | nothing false is being corrected (use `before-after`) |
| `pros-cons` | weighs the benefits and costs of one option (≤4 per side) | two different options are compared (use `comparison`) |
| `pillars` | says an idea "rests on" / "is built on" 3–5 supporting parts | the parts are not supports of one idea |
| `hierarchy-tree` | splits one idea into parts, and parts into details (2–4 branches) | there is only one level (use `mind-map` or `card-grid`) |
| `comparison-table` | compares 2–4 options on 2–5 criteria | there is only one criterion (use `comparison`) |
| `percent-ring` | states 1–3 percentages | the percentages are not spoken — never invent one |
| `line-chart` | states values that change over time or steps (3–8 points) | the values are not spoken — never invent one |
| `quote` | quotes a person or a text | it is the narrator's own sentence (use `statement`) |
| `keyword-highlight` | says one key sentence and stresses 1–3 words in it | there are several sentences to show |
| `big-number` | states one memorable figure | the figure is not spoken — never invent one |
| `did-you-know` | opens with one surprising fact (a hook) | the fact is the main point of a later slide |
| `agenda-progress` | says which part of the lesson we are in now ("we are starting with part one") | the parts are only listed (use `agenda`) |
| `glossary` | defines 2–4 terms one after another | only one term (use `definition`) |
| `flip-card` | asks a recall question, then gives the answer (1–3 cards) | the answer is not spoken |
| `fill-blank` | says "complete the sentence" or stresses missing words of one key sentence | there is no single sentence |
| `match-pairs` | links each item to its partner (2–4 pairs) | the items have no partners |
| `sequence-order` | asks to put steps in order, then says the order (3–5) | it is simply a process (use `process`) |
| `predict-reveal` | describes a situation, asks what happens, then tells the result | no result is told |
| `q-and-a` | asks 1–3 questions and answers each | the questions are not answered (use `question`) |
| `dialogue` | reports a conversation between one or two people (2–5 lines) | there is no speaker |
| `icon-array` | says "8 out of 10" (or out of 20, 50, 100) | the numbers are not spoken — never invent them |
| `number-change` | gives a value before and after a change | there is only one value |
| `rating-scale` | rates 1–3 things on a 5- or 10-point scale | no scores are spoken |
| `column-chart` | compares 2–6 spoken values side by side | the values change over time (use `line-chart`) |
| `cause-effect` | names several causes of one effect | the causes happen in order (use `process`) |
| `formula` | says "A plus B equals C" | the parts do not add up to a result |
| `bridge` | describes steps that close a gap from now to a goal | there is no gap or goal |
| `puzzle` | says parts "fit together" into a whole (2–4) | the parts do not depend on each other |
| `growth-tree` | says several practices grow from one root idea | there is no root idea |
| `next-lesson` | closes and names the next lesson (end card) | there is no next lesson (use `outro`) |
| `swot` | names strengths, weaknesses, opportunities and threats | it is not an analysis of one thing |
| `priority-matrix` | sorts tasks by two measures (e.g. impact and effort) into four named groups | there is only one measure (use `spectrum`) |
| `five-whys` | asks "why?" again and again down to a root cause (2–5) | the reasons are parallel (use `cause-effect`) |
| `traffic-light` | gives three rules: stop, be careful, go | there are not exactly three graded rules |
| `gauge` | names levels and says which level we are at now | no current level is named |
| `radar` | scores 3–6 dimensions of one thing | the scores are not spoken — never invent them |
| `concept-map` | says how ideas relate ("A builds B, B improves C") | there are no named relations |
| `chain` | says steps depend on each other like links, maybe with a weakest link | the steps are independent |
| `domino` | describes a chain reaction: each step triggers the next | the steps do not cause each other (use `process`) |
| `ripple` | one action whose effects spread wider and wider | the effects are not growing in reach |
| `circles-of-control` | sorts things into what we control, influence, or only care about | there is no question of control |
| `hourglass` | many inputs narrow to one focus, then open into outcomes | nothing comes out after the focus (use `funnel`) |
| `zoom-in` | goes from the big picture down to a detail (2–3 levels) | the levels are not nested |
| `spiral` | returns to the same idea each round, going deeper | each step is a new idea (use `staircase`) |
| `swimlanes` | says who does which step, in order (≤3 roles) | one person does everything (use `process`) |
| `kanban` | says which tasks are to do, in progress, or done | the tasks have no status |
| `gantt` | gives start and end weeks (or units) for tasks | the times are not spoken — never invent them |
| `week-plan` | gives an activity for each day | there are no days |
| `time-wheel` | says how the minutes of a session are shared | the minutes are not spoken — never invent them |
| `then-now-next` | contrasts past, present and future of one idea | the three are not times |
| `head-heart-hands` | says what learners know, feel and do | it is not about thinking, feeling and doing |
| `compass` | names four guiding values or directions | there are not exactly four |
| `outro` | closes the lesson / points to the next | — |
| `title` | opening slide only (a later one becomes a section divider) | — |

### Common mistakes

- Using `cycle` for steps that do not repeat → use `process`.
- Using `before-after` when both sides are good → use `comparison`.
- Using `mind-map` for a list in a fixed order → use `process` or `checklist`.
- Using `pyramid`/`staircase` when nothing is "higher" than anything else → use `card-grid`.
- Picking a design only because the last slide used a different one.
- Shortening card text until it no longer says what the narrator said.

## Rules for the visual plan

**Content must come from the narration.**
- Every card text is something the voice actually says (shortened is fine, invented is not).
- No numbers in charts unless the narration gives them. `bar-chart` / `donut` values are never made up.

**One card, one spoken moment.**
- Every item has its own `itemPhrases` entry that contains the word naming it.
  The engine anchors the card to that word, not to the start of the phrase.
- Two items must never share a phrase. If the narration names two things in one breath,
  make them one card.
- Phrases must appear exactly once in that section's narration (add a neighbouring word if not).

**Quick lookup by narration pattern** (the guide above gives the full test):

| The narration says… | Use |
|---|---|
| "not X, but Y" / "instead of" / "rather than" | `before-after` (+ `leftCount`, `leftLabel`, `rightLabel`) |
| two groups that work together (not opposites) | `comparison` with `joiner: "+"` and column labels |
| a list of observable things vs. a question to ask | `comparison` with `joiner: "?"` |
| ordered steps / stages of doing something | `process` (≤5) or `roadmap-path` (journey) |
| a repeating loop | `cycle` |
| layers that build on a foundation, with a peak | `pyramid` (first item = base, last = peak) |
| parts that all serve one goal | `target` (last item = goal) or `mind-map` (`center` = goal) |
| things that sit on top of / align with each other | `layer-stack` |
| exactly four areas around one idea | `quadrant` (`center`) |
| two or three ideas that overlap into one | `venn` (`center` = the overlap) |
| facets of one whole | `donut` (no values) |
| a set of separate examples | `card-grid` |
| a checklist the learner should do | `checklist` |
| a single key sentence | `statement`; a question → `question`; closing → `outro` |
| narrowing many things down to one focus / result | `funnel` (first = broadest; `center` = the result) |
| degrees between two poles, "not simply X or Y" | `spectrum` (`leftLabel`/`rightLabel` = poles; optional `values` 0–100 = positions) |
| keeping two sides in balance / weighing | `balance` (`leftCount`, `leftLabel`, `rightLabel`, `center` e.g. "In balance"; ≤3 per side) |
| "if this, then that" — evidence decides the next step | `decision-tree` (`center` = the question; items `"Condition \| Action"`) |
| what is visible vs. what lies beneath | `iceberg` (`leftCount` = 1–2 visible items; rest below) |
| numbers actually spoken in the narration | `stat-tiles` (items `"5\|Domains"`; never invent numbers — the checker blocks it) |
| parts that drive each other / interdependence | `gears` (2–4) |
| "X means…" — a key term and its meaning | `definition` (`center` = term; `joiner` = "means" / "means focusing on") |
| "In this lesson we will…", "first… then… finally…" (preview) | `agenda` |
| "By the end you will be able to…" | `learning-objectives` (`center` = the lead-in sentence; optional) |
| "Let's sum up…", "Remember…" + several points | `key-takeaways` |
| "Your next step…", "Now try…" | `next-steps` |
| "Which… ? Is it A, B or C? The answer is…" | `quiz-choice` (`answer` = number of the right option, 1 = first; `revealPhrase` = where the answer is said) |
| "True or false? … That is false." | `true-false` (items `"Statement\|True"` / `"Statement\|False"`; `revealPhrase`) |
| "Here is a tip…", "Remember…", "Be careful…" (one line) | `tip-callout` (`joiner` = "Tip" / "Remember" / "Note" / "Warning") |
| a short story: what happened, what went wrong, how it was solved | `scenario-card` (items `"Label\|text"` or plain text; default labels Situation / Challenge / Resolution) |
| "Let's work through an example…" with a result per step | `worked-example` (items `"Step\|Result"`; `center` = the problem) |
| "X is like Y: … is the …, and … is the …" | `analogy` (`leftLabel` = X, `rightLabel` = Y; items `"part of X\|part of Y"`) |
| "Many people believe… In fact…" | `myth-vs-fact` (list the myths, then the facts; `leftCount` = number of myths) |
| "It has benefits… but also costs…" | `pros-cons` (`leftCount` = number of pros; `center` = the option; optional `leftLabel`/`rightLabel`) |
| "… rests on three pillars: …" | `pillars` (`center` = the roof idea; optional `leftLabel` = the foundation) |
| "… has two parts. The first covers… the second covers…" | `hierarchy-tree` (`center` = root; branch items `"Content"`, details `"Content\|Examples"`) |
| several options described on the same few criteria | `comparison-table` (`columns` = options; rows `"Criterion\|cell\|cell"`; cells "yes" / "no" / "partly" show as ✓ / ✕ / ◐) |
| "80 percent of… and 45 percent…" | `percent-ring` (`values` = the spoken percentages) |
| "In week one… 50, week two… 58…" | `line-chart` (items = the x labels; `values` = spoken numbers; `center` = the insight) |
| "As … said: '…'" | `quote` (one item = the quotation; `center` = who said it; `title` = small label above) |
| one sentence with key words stressed | `keyword-highlight` (`title` = the sentence; items = words taken from it) |
| one striking figure | `big-number` (one item `"6\|minutes or less keeps learners engaged"`; `center` = source) |
| "Here is something surprising…" at the start | `did-you-know` (`title` = the label, e.g. "Did you know?"; one item = the fact) |
| "This lesson has four parts… we are now in part two" | `agenda-progress` (`current` = number of the part now, 1 = first) |
| "X means… Y means…" | `glossary` (items `"Term\|meaning"`) |
| "What is…? It is…" | `flip-card` (items `"Front\|Back"`; the phrase is where the answer is said) |
| "Complete the sentence: …" | `fill-blank` (`title` = the sentence; items = the missing words, taken from it) |
| "Match each … with …" | `match-pairs` (items `"Left\|its match"`; the right column is shown shuffled) |
| "Put these steps in order. First… second…" | `sequence-order` (items in the correct order; they start shuffled) |
| "What do you think happens? … In fact…" | `predict-reveal` (`center` = the situation; one item = what happened) |
| "People ask… The answer is…" | `q-and-a` (list the questions, then the answers; `leftCount` = number of questions) |
| "Sara asks… Omar answers…" | `dialogue` (items `"Speaker\|line"`; at most two speakers) |
| "eight out of ten…" | `icon-array` (one item `"8/10\|label"`) |
| "from 55 percent to 78 percent" | `number-change` (two items `"55%\|Before…"`, `"78%\|After…"`) |
| "rated 4 out of 5" | `rating-scale` (`values` = the scores) |
| "30 percent… 25 percent… 60 percent" (no time order) | `column-chart` (`values`; optional `center` = the insight) |
| "Why…? Because of A, B and C" | `cause-effect` (`center` = the effect) |
| "A plus B equals C" | `formula` (last item = the result; `joiner` = the sign, default "+") |
| "to get from X to Y, we…" | `bridge` (`leftLabel` = now, `rightLabel` = the goal; items = the steps) |
| "… pieces that fit together" | `puzzle` (optional `center` = what they make together) |
| "From … grow …" | `growth-tree` (`center` = the root) |
| "Thank you… in the next lesson…" | `next-lesson` (`title` = thank-you line; `center` = next lesson; optional items = its topics) |
| "A strength is… a weakness is… an opportunity… a threat…" | `swot` (items `"Strengths\|text"`, `"Weaknesses\|…"`, `"Opportunities\|…"`, `"Threats\|…"`; ≤2 each) |
| "high impact, low effort, so we do it first…" | `priority-matrix` (`columns` = 4 quadrant names: top left, top right, bottom left, bottom right; items `"Name\|task"`; `leftLabel` = vertical axis, `rightLabel` = horizontal axis) |
| "Why? Because… Why? Because…" | `five-whys` (`center` = the problem; last item = the root cause) |
| "Stop when… be careful with… go ahead and…" | `traffic-light` (3 items in that order; optional `"Label\|text"`) |
| "The levels are… we are at…" | `gauge` (items = levels low → high; `current` = the level now, 1 = first) |
| "rated 8, 6, 9 and 4 out of 10" across dimensions | `radar` (`values` = the scores) |
| "A builds B. B improves C." | `concept-map` (items `"A\|builds\|B"`; ≤6 ideas) |
| "… is a chain … the weakest link is…" | `chain` (optional `current` = the weakest link) |
| "this leads to… which leads to…" | `domino` (last item = the final result) |
| "the effect spreads: first… then… soon…" | `ripple` (`center` = the action) |
| "we control… we influence… we can only be concerned about…" | `circles-of-control` (items `"Control\|…"`, `"Influence\|…"`, `"Concern\|…"`) |
| "many … narrow to one … from that come…" | `hourglass` (`leftCount` = inputs; `center` = the focus) |
| "the big picture is… inside it… inside that…" | `zoom-in` (`center` = the big picture) |
| "each term we return to it, deeper" | `spiral` |
| "the teacher does… the students do…" | `swimlanes` (items `"Role\|task"` in spoken order) |
| "to do… doing… done…" | `kanban` (items `"Column\|task"`; optional `columns`) |
| "from week 1 to week 2…" | `gantt` (items `"Task\|start\|end"`; optional `unit`, default "Week") |
| "on Monday… on Wednesday…" | `week-plan` (items `"Day\|activity"`) |
| "10 minutes on…, 30 minutes on…" | `time-wheel` (items `"Part\|minutes"`) |
| "Then… Now… Next…" | `then-now-next` (3 items; optional `"Label\|text"`) |
| "with the head… with the heart… with the hands…" | `head-heart-hands` (3 items in that order) |
| "four values guide us…" | `compass` (4 items: north, east, south, west) |

- `title` is for the opening slide only (it shows the course logo or name). A later `title`
  becomes a section divider without the logo.
- `quote`, `keyword-highlight`, `big-number`, `fill-blank`, `did-you-know` and `next-lesson` fill the whole slide: their `title` is shown as a
  small label (quote, big-number, did-you-know), as the sentence itself (keyword-highlight,
  fill-blank) or as the thank-you line (next-lesson).
- `quiz-choice` and `true-false` need `revealPhrase`: the exact words where the narrator gives the
  answer. The answer lights up at that moment, never before. Read every option and the answer aloud
  in the narration — never add options the narrator does not say.
- No single design on more than ~30% of slides; avoid the same design twice in a row.
- Backgrounds change by themselves: light slides take turns through `halo`, `dots`, `edge`, `wash`,
  `grid`, `arcs`, and dark slides through `halo`, `glow`, `stripes`, `constellation`, `waves`, `mesh`.
  To choose one for a slide, add `"backdrop": "grid"` to its visual (for example `grid` for a plan or
  schedule, `constellation` for connections). A name that does not suit the slide's brightness is ignored.
- Keep card text short: 1–5 words, max ~35 characters.

## Readability guard (checker-enforced)

Text must always be easy to read on screen. `check_visual_plan.py` measures every card:
- Tight designs (mind-map, cycle, roadmap-path, timeline, gears, venn, pyramid, funnel, spectrum, iceberg, quadrant, stat-tiles, staircase, process, target, donut, bar-chart, key-takeaways, pillars, hierarchy-tree, percent-ring, keyword-highlight, fill-blank, agenda-progress, column-chart, cause-effect, formula, bridge, puzzle, growth-tree, gauge, radar, concept-map, chain, domino, ripple, circles-of-control, hourglass, swimlanes, gantt, week-plan, time-wheel, priority-matrix, zoom-in): aim ≤ 32 characters, hard limit 48.
- Wide designs (comparison, before-after, card-grid, balance, decision-tree, definition, layer-stack, checklist-like): aim ≤ 55, hard limit 80.
- Own limits: `line-chart` labels aim ≤ 12, limit 20; `comparison-table` cells aim ≤ 24, limit 40; a `quote` aim ≤ 160, limit 220; a `did-you-know` fact aim ≤ 120, limit 160; a `predict-reveal` result aim ≤ 70, limit 100.
- For items with `|`, every part is measured (the longest counts); for `stat-tiles` and `big-number` only the label.
- Numbers in `stat-tiles`, `big-number`, `percent-ring`, `line-chart`, `icon-array`, `number-change`, `rating-scale`, `column-chart`, `radar`, `gantt` and `time-wheel` must be spoken in that paragraph (digits or words) — the checker blocks invented numbers.
- Over the hard limit is an ERROR (the plan will not pass); over the aim is a WARN — shorten the card text, keep the narrator's words in `itemPhrases`.
- Engine side: card size and font grow when there are few cards (e.g. a balance with one card per side uses 36 px text) and shrink only as far as 22–25 px. Never lower a font below ~22 px in a component.
- Always review the pictures from `./prepare-video` before the final video.
