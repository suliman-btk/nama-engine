import type { CourseConfig } from "./schema";

/**
 * Converts the course config's theme block into the shape the existing engine
 * components expect. This is the ONLY place that maps config → internal tokens,
 * so components never need to know which course is running.
 *
 * The returned object is intentionally shaped to be a drop-in replacement for
 * the old hard-coded `theme` export from `components/theme.ts`.
 */
export function buildTheme(cfg: CourseConfig) {
  const c = cfg.theme.colors;
  return {
    colors: {
      navy: c.navy,
      deep: c.deep,
      mid: c.mid,
      surface: c.surface,
      // "gold" / "goldLight" are the engine-internal names for the accent.
      // The config uses "accent" / "accentLight" so it's course-agnostic.
      gold: c.accent,
      goldLight: c.accentLight,
      cream: c.cream,
      sand: c.sand,
      panel: c.panel,
      panelEdge: c.panelEdge,
      inkDim: c.inkDim,
      plumSafe: c.plumSafe ?? "#241738",
      tealSafe: c.tealSafe ?? "#14303C",
    },
    headingFamily: cfg.theme.headingFamily,
    bodyFamily: cfg.theme.bodyFamily,
    headingWeight: cfg.theme.headingWeight,
    type: cfg.theme.type,
    radius: cfg.theme.radius,
  } as const;
}

export type EngineTheme = ReturnType<typeof buildTheme>;
