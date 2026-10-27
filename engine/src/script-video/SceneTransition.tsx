import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { useTheme } from "../course/CourseContext";
import { BrandWatermark } from "../brand/BrandWatermark";

/**
 * Incoming-scene reveal. The new scene starts a little before the cut and is revealed
 * ON TOP of the previous scene (which keeps playing underneath), so the screen is never
 * covered or blank: one diagram hands over to the next. The style rotates per cut.
 * The NAMA logo lives inside the revealed layer, so it always matches the background
 * of the scene it sits on (colour on light, white on dark).
 */
export type RevealStyle = "sweep-right" | "sweep-up" | "sweep-left" | "fade";
const ROTATION: RevealStyle[] = ["sweep-right", "sweep-up", "sweep-left", "fade"];

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

export function SceneTransition({
  children,
  sceneIndex,
  revealFrames,
  logoOnDark,
  hideLogo = false,
}: {
  children: React.ReactNode;
  sceneIndex: number;
  /** Frames over which this scene replaces the previous one (0 = hard cut). */
  revealFrames: number;
  logoOnDark: boolean;
  /** The opening slide shows NAMA in its own brand panel, so the corner logo is hidden. */
  hideLogo?: boolean;
}) {
  const frame = useCurrentFrame();
  const theme = useTheme();
  const gold = theme.colors.gold;
  const navy = theme.colors.navy;
  const style = ROTATION[(sceneIndex - 1 + ROTATION.length) % ROTATION.length];
  const raw = sceneIndex > 0 && revealFrames > 0 ? Math.min(1, frame / revealFrames) : 1;
  const revealing = raw < 1;

  // Two slides never share the screen: a panel first covers the old slide completely,
  // then moves on and uncovers the new one. "fade" dips through the background colour.
  let sceneStyle: React.CSSProperties = {};
  let panel: React.ReactNode = null;
  let backdrop: React.ReactNode = null;
  if (revealing) {
    if (style === "fade") {
      // Dip through navy: the old slide fades to navy, then the new slide fades in from navy.
      // The navy stays fully under the new slide, so the old slide never shows through it.
      if (raw < 0.5) {
        sceneStyle = { opacity: 0 };
        panel = <AbsoluteFill style={{ zIndex: 50, background: navy, opacity: easeInOut(raw / 0.5) }} />;
      } else {
        sceneStyle = { opacity: easeInOut((raw - 0.5) / 0.5) };
        backdrop = <AbsoluteFill style={{ background: navy }} />;
      }
    } else {
      const cover = easeInOut(Math.min(1, raw / 0.5)); // 0→1: panel slides in over the old slide
      const uncover = easeInOut(Math.max(0, (raw - 0.5) / 0.5)); // 0→1: panel slides away
      sceneStyle = { opacity: raw < 0.5 ? 0 : 1 };
      const pos = raw < 0.5 ? cover - 1 : uncover; // panel offset as a fraction of the frame
      const axis = style === "sweep-up" ? "Y" : "X";
      const sign = style === "sweep-left" || style === "sweep-up" ? -1 : 1;
      const edgeSide = style === "sweep-up" ? (raw < 0.5 ? "top" : "bottom") : (sign > 0) === (raw < 0.5) ? "right" : "left";
      panel = (
        <AbsoluteFill style={{ zIndex: 50, transform: `translate${axis}(${sign * pos * 100}%)`, background: navy }}>
          <div style={{ position: "absolute", background: gold, boxShadow: `0 0 30px ${gold}`, ...(axis === "X" ? { top: 0, bottom: 0, width: 12, [edgeSide]: -6 } : { left: 0, right: 0, height: 12, [edgeSide]: -6 }) }} />
        </AbsoluteFill>
      );
    }
  }

  return (
    // Each slide is its own layer, so nothing of the previous slide (e.g. its logo) can show through.
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {backdrop}
      <AbsoluteFill style={sceneStyle}>
        {children}
        {hideLogo ? null : <BrandWatermark variant={logoOnDark ? "dark" : "light"} />}
      </AbsoluteFill>
      {panel}
    </AbsoluteFill>
  );
}
