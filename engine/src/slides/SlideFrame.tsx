import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../course/CourseContext";
import type { EngineTheme } from "../course/buildTheme";

/**
 * The chrome every slide shares: a flat background, the kicker, the lesson label and the gold
 * baseline.
 *
 * Three rounds of client feedback shaped this file:
 *  - the background was a dark navy gradient with a drifting radial wash. Both gone: one solid
 *    `theme.colors.surface`, lighter, and static.
 *  - the brand mark used to be drawn HERE, which meant it sat underneath the presenter and was
 *    invisible for most of the runtime. It is now a composition-level overlay (BrandWatermark)
 *    drawn above everything, so it is on screen for the whole video.
 *  - the presenter now ALTERNATES sides. So none of this chrome may assume content-on-left:
 *    the kicker, the lesson label, the content column and the accent stripe all read their
 *    edges from context and flip together.
 */

export type ContentEdges = {
  /** CSS left offset for the content column. */
  left: string;
  /** CSS right offset for the content column. */
  right: string;
  /** Which side the presenter is currently occupying. */
  side: "left" | "right" | "none";
};

const DEFAULT_EDGES: ContentEdges = { left: "4.4%", right: "8%", side: "none" };

/** Lesson label shown on every slide. Supplied once by the composition. */
export const LessonLabelContext = React.createContext<string>("");

/**
 * Where the slide's content column may live this frame, published by the composition.
 *
 * This started as a boolean ("is the corner presenter on?") mapped to a fixed inset, which
 * broke the moment the presenter became a panel — text kept the narrow-corner inset and ran
 * under the speaker (the overlap at 1:18). It then became a single right-inset, which broke
 * again the moment the presenter could appear on the LEFT. It is now both edges, derived
 * continuously from where the presenter actually is, so the column both narrows *with* him and
 * moves to whichever side he is not on.
 */
export const ContentEdgesContext = React.createContext<ContentEdges>(DEFAULT_EDGES);

export function useContentEdges(): ContentEdges {
  return React.useContext(ContentEdgesContext);
}

/** Back-compat for components that only ever needed the right edge. */
export function useContentRightInset(): string {
  return useContentEdges().right;
}

export function SlideFrame({
  kicker,
  bg,
  light,
  lessonLabel,
  children,
  hideChrome,
}: {
  kicker?: string;
  bg?: string;
  light?: boolean;
  lessonLabel?: string;
  children: React.ReactNode;
  hideChrome?: boolean;
}) {
  const theme = useTheme();
  const contextLabel = React.useContext(LessonLabelContext);
  const edges = useContentEdges();
  const label = lessonLabel ?? contextLabel;
  // Flat and static. No gradient, no moving wash.
  const background = bg ?? theme.colors.surface;

  return (
    <AbsoluteFill style={{ background, overflow: "hidden", fontFamily: theme.bodyFamily }}>
      {children}

      {!hideChrome ? (
        <>
          {kicker ? <Kicker text={kicker} light={light} left={edges.left} theme={theme} /> : null}
          {label ? (
            <div
              style={{
                position: "absolute",
                left: edges.left,
                bottom: 26,
                fontSize: 21,
                letterSpacing: 1,
                color: light ? "rgba(20,20,40,0.45)" : "rgba(250,247,238,0.45)",
              }}
            >
              {label}
            </div>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
}

/** The gold edge stripe. Sits on whichever screen edge the CONTENT is against, so it frames the
 * text rather than running down the seam between the text and the presenter. */
export function AccentEdge() {
  const theme = useTheme();
  const { side } = useContentEdges();
  const onLeft = side !== "left"; // presenter right (or absent) -> content is on the left
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 12,
        background: theme.colors.gold,
        ...(onLeft ? { left: 0 } : { right: 0 }),
      }}
    />
  );
}

export function Kicker({ text, light, left = "4.4%", theme: themeOverride }: { text: string; light?: boolean; left?: string; theme?: EngineTheme }) {
  const contextTheme = useTheme();
  const theme = themeOverride ?? contextTheme;
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const x = interpolate(frame, [0, 14], [-14, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left,
        opacity: o,
        transform: `translateX(${x}px)`,
        fontSize: 25,
        fontWeight: 700,
        letterSpacing: 4,
        color: light ? theme.colors.mid : theme.colors.gold,
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

/** Shared content column. Sits on whichever side the presenter is not using. */
export function SlideBody({
  children,
  align = "center",
}: {
  children: React.ReactNode;
  align?: "center" | "top";
}) {
  const edges = useContentEdges();
  return (
    <div
      style={{
        position: "absolute",
        left: edges.left,
        right: edges.right,
        top: 132,
        bottom: 116,
        display: "flex",
        flexDirection: "column",
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      {children}
    </div>
  );
}

/** Entrance helper: fade + rise, clamped so it holds once it has landed. */
export function fadeUp(frame: number, delay = 0, dur = 12) {
  const p = interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - p, 3);
  return { opacity: eased, transform: `translateY(${(1 - eased) * 22}px)` };
}
