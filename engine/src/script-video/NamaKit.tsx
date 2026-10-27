import React from "react";
import { spring } from "remotion";
import type { MoreChartProps } from "./NamaCharts";

/*
 * Shared helpers and line icons for the lesson-flow designs (NamaLessonFlow, NamaInsights,
 * NamaFeatures). Icons are drawn as simple strokes on a 24×24 grid so they stay crisp at any size
 * and take the brand colours they are given.
 */

export type LessonProps = MoreChartProps & {
  /** quiz-choice: the correct option (1-based). */
  answer?: number;
  /** quiz-choice / true-false: when the answer is spoken (seconds from slide start). */
  revealStartSeconds?: number;
  /** comparison-table: one heading per compared option. */
  columns?: string[];
  /** agenda-progress: the part the lesson is at now (1-based). */
  current?: number;
};

export function startAt(fps: number, index: number, starts?: number[], gap = 9) {
  return starts?.length ? Math.round(starts[index] * fps) - 4 : 14 + index * gap;
}

export function grow(frame: number, fps: number, from: number) {
  return spring({ frame: frame - from, fps, config: { damping: 18, mass: 0.9, stiffness: 90 } });
}

export function shownAt(frame: number, fps: number, index: number, starts?: number[], gap = 9) {
  return frame >= startAt(fps, index, starts, gap);
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Eased progress (0→1) of an item from the moment it is spoken. */
export function landed(frame: number, fps: number, index: number, starts?: number[], gap = 9) {
  return shownAt(frame, fps, index, starts, gap) ? clamp01(grow(frame, fps, startAt(fps, index, starts, gap))) : 0;
}

/** Frame of the spoken answer; without a reveal phrase the answer shows after the last item. */
export function revealFrame(fps: number, count: number, starts?: number[], reveal?: number) {
  if (reveal != null) return Math.round(reveal * fps) - 2;
  return startAt(fps, Math.max(0, count - 1), starts) + Math.round(fps * 2.5);
}

/** "Label|text|more" → trimmed parts. */
export function parts(text: string): string[] {
  return text.split("|").map((p) => p.trim());
}

/** "72%" → { prefix: "", value: 72, decimals: 0, suffix: "%" }; non-numbers keep value null. */
export function parseFigure(raw: string) {
  const m = raw.match(/^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return { prefix: "", value: null as number | null, decimals: 0, suffix: raw };
  const digits = m[2].replace(/,/g, "");
  return { prefix: m[1], value: Number(digits), decimals: (digits.split(".")[1] ?? "").length, suffix: m[3], grouped: m[2].includes(",") };
}

export function formatFigure(value: number, decimals: number, grouped = false) {
  const fixed = value.toFixed(decimals);
  if (!grouped) return fixed;
  const [int, dec] = fixed.split(".");
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec ? `.${dec}` : "");
}

const PATHS: Record<string, string[]> = {
  check: ["M5 12.5l4.5 4.5L19 7.5"],
  cross: ["M6.5 6.5l11 11M17.5 6.5l-11 11"],
  plus: ["M12 5v14M5 12h14"],
  minus: ["M5 12h14"],
  arrow: ["M4.5 12h14M13 6l6 6-6 6"],
  bulb: ["M9.2 18h5.6M10.2 21h3.6", "M12 3a6 6 0 0 0-3.7 10.7c.8.7 1.2 1.4 1.2 2.3h5c0-.9.4-1.6 1.2-2.3A6 6 0 0 0 12 3z"],
  alert: ["M12 3.5L2.5 20h19L12 3.5z", "M12 10v4.2", "M12 17.2v.2"],
  bookmark: ["M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z"],
  info: ["M12 11v6", "M12 7.3v.2", "M12 2.8a9.2 9.2 0 1 0 0 18.4 9.2 9.2 0 0 0 0-18.4z"],
  flag: ["M5.5 21V3.5", "M5.5 4h11.5l-2.4 4.2L17 12.5H5.5"],
  pin: ["M12 21s-7-6.2-7-11.2a7 7 0 0 1 14 0C19 14.8 12 21 12 21z", "M12 7.3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"],
  bolt: ["M13.5 2.5L4.5 14h7l-1 7.5 9-11.5h-7z"],
  target: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z", "M12 11.2v1.6"],
  star: ["M12 3.2l2.7 5.5 6 .9-4.35 4.25 1 6L12 17l-5.35 2.85 1-6L3.3 9.6l6-.9z"],
  list: ["M9 6.5h11M9 12h11M9 17.5h11", "M4.5 6.5h.5M4.5 12h.5M4.5 17.5h.5"],
  key: ["M8.5 11.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", "M11.4 12.6L20 4M16.5 7.5l2.5 2.5"],
  pencil: ["M4 20h4.2L19.5 8.7l-4.2-4.2L4 15.8z", "M13.5 6.3l4.2 4.2"],
  route: ["M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M8 17h7.5a3 3 0 0 0 0-6h-7a3 3 0 0 1 0-6H16"],
  question: ["M9.2 9a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.2-1.5 2.2v.6", "M12 17.6v.2"],
  scale: ["M12 4v16M7 20h10", "M5 8h14", "M5 8l-2.5 6a2.8 2.8 0 0 0 5 0L5 8zM19 8l-2.5 6a2.8 2.8 0 0 0 5 0L19 8z"],
  trendUp: ["M3.5 17l6-6 4 4 7-7.5", "M15 7.5h5.5V13"],
  trendDown: ["M3.5 7l6 6 4-4 7 7.5", "M15 16.5h5.5V11"],
  play: ["M8 5.5v13l10.5-6.5z"],
  flip: ["M4 12a8 8 0 0 1 13.8-5.5", "M18.5 3.5v3.6h-3.6", "M20 12a8 8 0 0 1-13.8 5.5", "M5.5 20.5v-3.6h3.6"],
  person: ["M12 3.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z", "M5 21v-1.5a5.5 5.5 0 0 1 5.5-5.5h3a5.5 5.5 0 0 1 5.5 5.5V21"],
  pause: ["M9 5.5v13M15 5.5v13"],
  heart: ["M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"],
  hand: ["M7.5 12V6.8a1.4 1.4 0 0 1 2.8 0V11", "M10.3 10.6V5.2a1.4 1.4 0 0 1 2.8 0v5.4", "M13.1 10.6V6.3a1.4 1.4 0 0 1 2.8 0v5.2", "M15.9 11.3V9.4a1.4 1.4 0 0 1 2.8 0v4.4c0 4-2.6 6.9-6.6 6.9-2.8 0-4.4-1.3-5.7-3.4l-2-3.3a1.4 1.4 0 0 1 2.4-1.4l.7 1.1"],
  head: ["M9 21v-3.2a7.2 7.2 0 1 1 9.8-4.6l1.4 2.7-1.9.6V18a2 2 0 0 1-2 2H14v1", "M10.5 9.5a2.2 2.2 0 1 1 3 2.1c-.6.3-1 .8-1 1.4"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M12 7v5.2l3.3 2"],
  calendar: ["M4.5 6h15v14h-15z", "M4.5 10h15", "M8.5 3.5v4.5M15.5 3.5v4.5"],
  compass: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z", "M15.6 8.4l-2 5.2-5.2 2 2-5.2z"],
  users: ["M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11z", "M3 20v-.8A5 5 0 0 1 8 14h2a5 5 0 0 1 5 5.2v.8", "M16 4.8a3.2 3.2 0 0 1 0 6.2", "M18 14.2a5 5 0 0 1 3 4.6v1.2"],
  link: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"],
  drop: ["M12 3.5s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"],
  search: ["M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z", "M15.5 15.5L20 20"],
  shield: ["M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z", "M8.8 12l2.2 2.2 4.2-4.4"],
  rocket: ["M12.5 15.5l-4-4c1.6-4.6 5-7.6 11-8-.4 6-3.4 9.4-7 12z", "M8.5 11.5L5 12l-1.5 2.5 3.8.8", "M12.5 15.5L12 19l-2.5 1.5-.8-3.8", "M15.3 7.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z"],
  stop: ["M8.3 3h7.4L21 8.3v7.4L15.7 21H8.3L3 15.7V8.3z", "M8 12h8"],
  board: ["M4 4.5h4.5v15H4z", "M9.75 4.5h4.5v9h-4.5z", "M15.5 4.5H20v12h-4.5z"],
  spiral: ["M12 12.5a1.2 1.2 0 0 1 1.2-1.2 2.5 2.5 0 0 1 2.5 2.5 3.8 3.8 0 0 1-3.8 3.8 5 5 0 0 1-5-5A6.3 6.3 0 0 1 13.2 6.3a7.5 7.5 0 0 1 7.5 7.5"],
  gauge: ["M4 16a8 8 0 1 1 16 0", "M12 16l4-5", "M12 16v.2"],
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 32, color, stroke = 2.4, style }: { name: IconName; size?: number; color: string; stroke?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0, ...style }}>
      {PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Round medallion holding an icon; `hot` fills it with the accent. */
export function IconDisc({ name, size = 64, fill, color, ring }: { name: IconName; size?: number; fill: string; color: string; ring?: string }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: fill, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: ring ? `0 0 0 6px ${ring}` : "none" }}>
      <Icon name={name} size={size * 0.5} color={color} stroke={2.6} />
    </div>
  );
}
