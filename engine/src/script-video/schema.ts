export type ScriptCaption = {
  startSeconds: number;
  endSeconds: number;
  text: string;
};

export type ScriptVisual = {
  kind:
    | "title"
    | "statement"
    | "question"
    | "checklist"
    | "process"
    | "timeline"
    | "cycle"
    | "comparison"
    | "card-grid"
    | "staircase"
    | "bar-chart"
    | "donut"
    | "pyramid"
    | "venn"
    | "mind-map"
    | "target"
    | "quadrant"
    | "roadmap-path"
    | "layer-stack"
    | "before-after"
    | "funnel"
    | "spectrum"
    | "balance"
    | "decision-tree"
    | "iceberg"
    | "stat-tiles"
    | "gears"
    | "definition"
    | "agenda"
    | "learning-objectives"
    | "key-takeaways"
    | "next-steps"
    | "quiz-choice"
    | "true-false"
    | "tip-callout"
    | "scenario-card"
    | "worked-example"
    | "analogy"
    | "myth-vs-fact"
    | "pros-cons"
    | "pillars"
    | "hierarchy-tree"
    | "comparison-table"
    | "percent-ring"
    | "line-chart"
    | "quote"
    | "keyword-highlight"
    | "big-number"
    | "flip-card"
    | "match-pairs"
    | "sequence-order"
    | "predict-reveal"
    | "agenda-progress"
    | "q-and-a"
    | "dialogue"
    | "glossary"
    | "icon-array"
    | "number-change"
    | "rating-scale"
    | "column-chart"
    | "cause-effect"
    | "formula"
    | "bridge"
    | "puzzle"
    | "growth-tree"
    | "swot"
    | "priority-matrix"
    | "five-whys"
    | "traffic-light"
    | "gauge"
    | "radar"
    | "concept-map"
    | "chain"
    | "domino"
    | "ripple"
    | "circles-of-control"
    | "hourglass"
    | "zoom-in"
    | "spiral"
    | "swimlanes"
    | "kanban"
    | "gantt"
    | "week-plan"
    | "time-wheel"
    | "then-now-next"
    | "head-heart-hands"
    | "compass"
    | "fill-blank"
    | "did-you-know"
    | "next-lesson"
    | "outro";
  title: string;
  kicker?: string;
  items?: string[];
  itemStartSeconds?: number[];
  /** Optional numbers for bar-chart / donut, one per item. */
  values?: number[];
  /** Suffix shown after values, e.g. "%". */
  unit?: string;
  /** Centre label for venn overlap / mind-map hub / donut middle. */
  center?: string;
  /** Column headings for before-after (defaults: "Avoid" / "Aim for"). */
  leftLabel?: string;
  rightLabel?: string;
  /** comparison / before-after / balance: items in the left column. iceberg: items above the water (1–2). */
  leftCount?: number;
  /** comparison: badge between the columns (default "VS"; e.g. "+" or "?"). definition: connector word (default "means"). tip-callout: the label ("Tip", "Remember", "Warning", "Note"). analogy: words under ≈ (default "is like"). */
  joiner?: string;
  /** quiz-choice: the correct option, 1-based. */
  answer?: number;
  /** quiz-choice / true-false: when the answer is spoken (seconds from slide start; from `revealPhrase`). */
  revealStartSeconds?: number;
  /** comparison-table: one heading per compared option (2–4). */
  columns?: string[];
  /** agenda-progress: the part the lesson is at now (1-based). */
  current?: number;
  /** Background style for this slide (light: halo, dots, edge, wash, grid, arcs; dark: halo, glow, stripes, constellation, waves, mesh). Default: the next style in turn. */
  backdrop?: string;
};

export type ScriptScene = {
  id: string;
  sourceSceneId?: string;
  startSeconds: number;
  durationSeconds: number;
  audioSrc: string | null;
  narration: string;
  section: string;
  background?: "light" | "dark";
  visual: ScriptVisual;
  captions: ScriptCaption[];
};

export type ScriptAudioTrack = {
  id: string;
  startSeconds: number;
  durationSeconds: number;
  audioSrc: string | null;
  narration: string;
  section: string;
};

export type ScriptVideoManifest = {
  version: 1;
  slug: string;
  title: string;
  lessonLabel: string;
  fps: number;
  width: number;
  height: number;
  totalDurationSeconds: number;
  /** End of the spoken greeting in the first audio track (seconds); the title is held after it. */
  greetingEndSeconds?: number;
  audioTracks?: ScriptAudioTrack[];
  scenes: ScriptScene[];
};

export function validateScriptVideoManifest(value: unknown): ScriptVideoManifest {
  if (!value || typeof value !== "object") {
    throw new Error("Script-video manifest must be an object.");
  }

  const manifest = value as Partial<ScriptVideoManifest>;
  if (manifest.version !== 1 || !manifest.title || !Array.isArray(manifest.scenes) || manifest.scenes.length === 0) {
    throw new Error("Invalid script-video manifest. Re-run the script-video builder.");
  }
  if (!manifest.totalDurationSeconds || manifest.totalDurationSeconds <= 0) {
    throw new Error("Script-video manifest has no positive duration.");
  }
  return manifest as ScriptVideoManifest;
}
