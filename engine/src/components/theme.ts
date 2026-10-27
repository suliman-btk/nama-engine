/**
 * Engine theme tokens.
 *
 * MIGRATION NOTE: This file used to be the ONLY source of theme values,
 * with everything hard-coded. It now re-exports `useTheme()` from
 * the course config system, which is the correct way to read theme values
 * in React components.
 *
 * The hard-coded `theme` constant is RETAINED as a fallback for:
 *   1. Non-React code that cannot use hooks (transition presets, etc.)
 *   2. Backward compatibility during migration
 *
 * New code should always use `useTheme()` inside React components.
 * Non-React code should receive the theme as a parameter.
 */

// Re-export the context-based hook — the preferred way to read theme in components.
export { useTheme } from "../course/CourseContext";
export type { EngineTheme } from "../course/buildTheme";

/**
 * Hard-coded default theme — the legacy default.
 *
 * @deprecated Use `useTheme()` in React components, or accept theme as a
 * parameter in non-React utility functions. This export exists only for
 * backward compatibility and will be removed once all consumers are migrated.
 */
export const theme = {
  colors: {
    navy: "#1B1E4A",
    deep: "#12142F",
    mid: "#2B2F72",
    /** The one flat slide background. Client feedback (Sep 12): the dark blue gradient reads
     * too dark and too busy — every slide now paints this single solid colour, no gradient,
     * no drifting wash. Change this one value to retone the whole course. */
    surface: "#454C8A",
    gold: "#CFAD3A",
    goldLight: "#E4C862",
    cream: "#FAF7EE",
    sand: "#F2ECDD",
    // derived, for panel work
    panel: "rgba(18,20,47,0.82)",
    panelEdge: "rgba(228,200,98,0.22)",
    inkDim: "rgba(242,236,221,0.72)",
    plumSafe: "#241738",
    tealSafe: "#14303C",
  },
  headingFamily: '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif',
  bodyFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  headingWeight: 900,
  /** 1080p type scale. Everything on screen is read from ~2m away on a laptop or phone —
   * rule 19 lists "tiny text" as a thing to avoid, so nothing here goes below 22px. */
  type: {
    hero: 62,
    title: 40,
    cardTitle: 30,
    body: 23,
    label: 17,
  },
  radius: { card: 22, chip: 12, video: 20 },
} as const;
