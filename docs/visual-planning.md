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
| `outro` | closes the lesson / points to the next | — |
| `title` | opening slide only | any later slide |

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

- `title` is for the opening slide only (it shows the course logo or name). A later `title`
  becomes a section divider without the logo.
- No single design on more than ~30% of slides; avoid the same design twice in a row.
- Keep card text short: 1–5 words, max ~35 characters.

## Readability guard (checker-enforced)

Text must always be easy to read on screen. `check_visual_plan.py` measures every card:
- Tight designs (mind-map, cycle, roadmap-path, timeline, gears, venn, pyramid, funnel, spectrum, iceberg, quadrant, stat-tiles, staircase, process, target, donut, bar-chart): aim ≤ 32 characters, hard limit 48.
- Wide designs (comparison, before-after, card-grid, balance, decision-tree, definition, layer-stack, checklist-like): aim ≤ 55, hard limit 80.
- Over the hard limit is an ERROR (the plan will not pass); over the aim is a WARN — shorten the card text, keep the narrator's words in `itemPhrases`.
- Engine side: card size and font grow when there are few cards (e.g. a balance with one card per side uses 36 px text) and shrink only as far as 22–25 px. Never lower a font below ~22 px in a component.
- Always review the pictures from `./prepare-video` before the final video.
