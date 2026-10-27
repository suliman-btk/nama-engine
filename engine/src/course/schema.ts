/**
 * Course configuration schema.
 *
 * Every course branch supplies ONE of these as `course-config.json` at the
 * repository root. The engine reads it at composition init and threads it
 * through React context. No course name, colour, logo path, or grammar rule
 * may be hard-coded in engine code — it comes from here.
 *
 * To create a new course, cut a `course/<slug>` branch from `main`, supply
 * this config and the referenced brand assets, and never touch engine code.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ brand */

export const BrandConfig = z.object({
  /** Watermark logo filename, relative to `public/brand/`. */
  watermarkLogo: z.string(),
  /** Colored watermark logo filename for light backgrounds. */
  watermarkLogoColored: z.string().optional(),
  /** Title-slide logo filename, relative to `public/brand/`. */
  titleLogo: z.string().optional(),
  /** Frame accent element drawn at the bottom of every frame. */
  accentElement: z.enum(["baseline", "none"]).default("baseline"),
  /** Optional course-specific watermark treatment. */
  watermarkStyle: z.string().optional(),
  /** Optional small partner badge on the opening title slide (logo + short text). */
  titleBadge: z
    .object({
      /** Logo filename, relative to `public/brand/`. */
      logo: z.string(),
      /** Short text shown next to the logo. Use "\n" for a line break. */
      text: z.string().default(""),
    })
    .optional(),
  /** Opening and closing animation. */
  bumper: z
    .object({
      /**
       * "logo": the logo image fades and grows in (works with any logo file).
       * "nama-animated": the NAMA Foundation logo assembles piece by piece (NAMA only).
       */
      style: z.enum(["logo", "nama-animated"]).default("logo"),
      /** Logo filename for the animation, relative to `public/brand/` (defaults to the colour logo). */
      logo: z.string().optional(),
    })
    .default({ style: "logo" }),
});

/* ------------------------------------------------------------------ theme */

export const ColorTokens = z.object({
  navy: z.string(),
  deep: z.string(),
  mid: z.string(),
  /** The one flat slide background. */
  surface: z.string(),
  /** Primary accent colour (for example gold or blue). */
  accent: z.string(),
  accentLight: z.string(),
  cream: z.string(),
  sand: z.string(),
  panel: z.string(),
  panelEdge: z.string(),
  inkDim: z.string(),
  /** Optional extras for course-specific component variants. */
  plumSafe: z.string().optional(),
  tealSafe: z.string().optional(),
});

export const TypeScale = z.object({
  hero: z.number().default(62),
  title: z.number().default(40),
  cardTitle: z.number().default(30),
  body: z.number().default(23),
  label: z.number().default(17),
});

export const RadiusTokens = z.object({
  card: z.number().default(22),
  chip: z.number().default(12),
  video: z.number().default(20),
});

export const ThemeConfig = z.object({
  colors: ColorTokens,
  headingFamily: z.string(),
  bodyFamily: z.string(),
  headingWeight: z.number().default(900),
  type: TypeScale,
  radius: RadiusTokens,
});

/* -------------------------------------------------------- presenter grammar */

export const PresenterGrammar = z.object({
  /** Target full-bleed percentage of total runtime. default 0.45. */
  fullBleedTarget: z.number().min(0).max(1).default(0.45),
  /** Width of the split panel as percent of frame. default 40. */
  splitWidthPct: z.number().min(20).max(60).default(40),
  /** Minimum seconds for a full-bleed "turn" beat. default 2.0. */
  minTurnSeconds: z.number().default(2.0),
  /** Whether the presenter must alternate sides between sections. */
  requireSideAlternation: z.boolean().default(true),
  /** Whether every side change must route through full-bleed. */
  requireFullBleedBetweenSides: z.boolean().default(true),
  /** Soft-push amplitude as fraction of frame width. default 0.07. */
  softPushAmplitude: z.number().default(0.07),
});

/* ------------------------------------------------------------ transitions */

export const TransitionConfig = z.object({
  /** Default transition for ordinary scene boundaries. */
  defaultTransition: z.string().default("clean-cut"),
  /** Transition reserved for section changes. */
  sectionTransition: z.string().default("section-reveal"),
});

/* ------------------------------------------------------- top-level config */

export const CourseConfig = z.object({
  /** Human-readable course identifier, e.g. "NAMA", "GTA". */
  courseId: z.string(),
  /** Course name shown on the opening slide when there is no course logo image. */
  courseName: z.string().optional(),
  /** Display label template. Use {lesson} as placeholder.
   *  Example: "NAMA · Lesson {lesson}" */
  lessonLabelTemplate: z.string(),

  brand: BrandConfig,
  theme: ThemeConfig,
  /** Show subtitles at the bottom of the video. */
  subtitles: z.boolean().default(true),
  /** Narration voice (read by the Python builder; listed here so the file is documented). */
  voice: z
    .object({
      name: z.string().default("en-US-AndrewMultilingualNeural"),
      rate: z.string().default("-6%"),
      paragraphPauseSeconds: z.number().default(1.3),
    })
    .optional(),
  presenterGrammar: PresenterGrammar,
  transitions: TransitionConfig,
});

export type CourseConfig = z.infer<typeof CourseConfig>;

/** Parse and validate a raw JSON object as a CourseConfig. */
export function parseCourseConfig(json: unknown): CourseConfig {
  return CourseConfig.parse(json);
}
