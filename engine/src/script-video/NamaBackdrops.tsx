import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { useTheme } from "../course/CourseContext";

/*
 * Slide backgrounds. Light and dark slides each have six quiet, slowly moving styles in the
 * course colours. A slide gets the next style in turn, so neighbouring slides never look alike;
 * a beat can pick one with `backdrop` in its visual. Patterns fade out towards the middle of the
 * slide, where the diagrams sit, so no background line is ever read as part of a diagram.
 */

export const LIGHT_BACKDROPS = ["halo", "dots", "edge", "wash", "grid", "arcs"] as const;
export const DARK_BACKDROPS = ["halo", "glow", "stripes", "constellation", "waves", "mesh"] as const;
export type BackdropName = (typeof LIGHT_BACKDROPS)[number] | (typeof DARK_BACKDROPS)[number];

export const BackdropContext = React.createContext<BackdropName | undefined>(undefined);

/** The style for a slide: its own choice when it suits the slide's brightness, else the next in turn. */
export function pickBackdrop(dark: boolean, sceneIndex: number, wanted?: string): BackdropName {
  const list: readonly string[] = dark ? DARK_BACKDROPS : LIGHT_BACKDROPS;
  if (wanted && list.includes(wanted)) return wanted as BackdropName;
  return list[sceneIndex % list.length] as BackdropName;
}

/** "#020181" + 0.1 → "rgba(2,1,129,0.1)". */
function tint(hex: string, alpha: number) {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const W = 1920;
const H = 1080;
const fill: React.CSSProperties = { position: "absolute", inset: 0 };
/* Shows decoration only towards the edges; the content area in the middle stays clear. */
const EDGE_MASK = "radial-gradient(ellipse 78% 72% at 50% 52%, transparent 58%, black 100%)";
const MASKED = new Set(["dots", "grid", "arcs", "stripes"]);

/* Stable pseudo-random points for the constellation, kept to the frame around the content. */
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (k: number) => {
    const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { x: 20 + r(1) * 1880, y: 210 + r(2) * 850, s: 2 + r(3) * 3 };
}).filter((p) => (p.x < 230 && p.y < 960) || p.x > 1700 || (p.y > 950 && p.x > 420));

export function Backdrop({ dark }: { dark: boolean }) {
  const name = React.useContext(BackdropContext) ?? "halo";
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { navy, deep, mid, gold, plumSafe } = theme.colors;
  const driftX = Math.sin(frame / 42) * 18;
  const driftY = Math.cos(frame / 51) * 14;
  const rule = <div style={{ position: "absolute", left: 0, right: 0, top: 124, height: 1, background: dark ? "rgba(255,255,255,0.06)" : tint(navy, 0.06) }} />;
  const spark = <div style={{ position: "absolute", right: 350 - driftX * 0.4, top: 115 + driftY * 0.5, width: 18, height: 18, borderRadius: "50%", background: gold, opacity: 0.7 + Math.sin(frame / 12) * 0.18 }} />;

  const art = (() => {
    switch (name) {
      case "dots":
        return (
          <>
            <div style={{ ...fill, top: 140, bottom: 72, backgroundImage: `radial-gradient(${tint(navy, 0.22)} 2.2px, transparent 2.6px)`, backgroundSize: "36px 36px", backgroundPosition: `${frame * 0.15}px 0` }} />
            <div style={{ position: "absolute", right: -190, bottom: -190, width: 380, height: 380, borderRadius: "50%", border: `5px solid ${gold}`, opacity: 0.55, transform: `scale(${1 + Math.sin(frame / 40) * 0.03})` }} />
          </>
        );
      case "edge": {
        const pulse = 0.5 + Math.sin(frame / 30) * 0.15;
        return (
          <>
            <div style={{ position: "absolute", top: 210, bottom: 0, right: 0, width: 72, background: plumSafe, borderTopLeftRadius: 36 }} />
            <div style={{ position: "absolute", top: 250, bottom: 0, right: 72, width: 4, background: gold, opacity: 0.7 }} />
            {[0, 1, 2, 3, 4].map((k) => (
              <div key={k} style={{ position: "absolute", right: 26, top: 300 + k * 140, width: 20, height: 20, transform: "rotate(45deg)", background: k === 2 ? gold : tint(navy, 0.18), opacity: k === 2 ? pulse + 0.3 : 1 }} />
            ))}
          </>
        );
      }
      case "wash":
        return (
          <>
            <div style={{ ...fill, background: `linear-gradient(135deg, #FFFFFF 0%, ${theme.colors.surface} 45%, ${plumSafe} 100%)` }} />
            <div style={{ position: "absolute", right: -160 + driftX, bottom: -200 + driftY, width: 720, height: 720, borderRadius: "50%", background: tint(gold, 0.16), filter: "blur(70px)" }} />
            <div style={{ position: "absolute", left: -200 - driftX, top: 160 - driftY, width: 620, height: 620, borderRadius: "50%", background: tint(mid, 0.10), filter: "blur(80px)" }} />
          </>
        );
      case "grid":
        return (
          <div style={{ ...fill, backgroundImage: `linear-gradient(${tint(navy, 0.09)} 2px, transparent 2px), linear-gradient(90deg, ${tint(navy, 0.09)} 2px, transparent 2px), linear-gradient(${tint(navy, 0.045)} 1px, transparent 1px), linear-gradient(90deg, ${tint(navy, 0.045)} 1px, transparent 1px)`, backgroundSize: "240px 240px, 240px 240px, 48px 48px, 48px 48px", backgroundPosition: `${-frame * 0.2}px 0` }} />
        );
      case "arcs":
        return (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <g transform={`rotate(${frame * 0.02} ${W + 60} ${H + 60})`}>
              {[300, 460, 620, 780, 940].map((r, k) => (
                <circle key={r} cx={W + 60} cy={H + 60} r={r} fill={k === 0 ? plumSafe : "none"} stroke={navy} strokeWidth={k === 2 ? 4 : 2.5} opacity={k === 0 ? 0.8 : k === 2 ? 0.16 : 0.1} strokeDasharray={k === 2 ? "18 14" : undefined} />
              ))}
            </g>
          </svg>
        );
      case "glow":
        return (
          <>
            <div style={{ ...fill, background: `radial-gradient(circle at ${72 + Math.sin(frame / 80) * 3}% 32%, ${mid} 0%, ${navy} 38%, ${deep} 78%)` }} />
            <div style={{ position: "absolute", left: -220 + driftX, bottom: -260, width: 760, height: 760, borderRadius: "50%", background: tint(gold, 0.14), filter: "blur(90px)" }} />
          </>
        );
      case "stripes":
        return (
          <>
            <div style={{ ...fill, backgroundImage: "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 30px)", backgroundPosition: `${frame * 0.3}px 0` }} />
            <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
              <line x1={W - 200} y1={H + 20} x2={W + 20} y2={H - 200} stroke={gold} strokeWidth={10} opacity={0.5} />
              <line x1={W - 260} y1={H + 20} x2={W + 20} y2={H - 260} stroke="#FFFFFF" strokeWidth={3} opacity={0.12} />
            </svg>
          </>
        );
      case "constellation": {
        const dx = Math.sin(frame / 90) * 10;
        return (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <g transform={`translate(${dx} ${dx * 0.5})`}>
              {STARS.map((a, i) => STARS.slice(i + 1).filter((b) => Math.hypot(a.x - b.x, a.y - b.y) < 200).map((b, k) => (
                <line key={`${i}-${k}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeWidth={1.5} opacity={0.2} />
              )))}
              {STARS.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.s + 1} fill="#FFFFFF" opacity={0.7 * (0.75 + 0.25 * Math.sin(frame / 15 + i))} />
              ))}
            </g>
          </svg>
        );
      }
      case "waves": {
        const wave = (amp: number, y0: number, len: number, phase: number) => {
          const pts: string[] = [];
          for (let x = 0; x <= W; x += 40) pts.push(`${x},${(y0 + Math.sin(x / len + phase) * amp).toFixed(1)}`);
          return pts.join(" ");
        };
        const p = frame / 40;
        return (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <polygon points={`0,${H} ${wave(22, 985, 260, p)} ${W},${H}`} fill="#FFFFFF" opacity={0.04} />
            <polygon points={`0,${H} ${wave(26, 1020, 200, -p * 0.8)} ${W},${H}`} fill="#FFFFFF" opacity={0.05} />
            <polyline points={wave(18, 1000, 230, p * 1.2)} fill="none" stroke={gold} strokeWidth={3} opacity={0.5} />
          </svg>
        );
      }
      case "mesh":
        return (
          <>
            <div style={{ ...fill, background: `linear-gradient(160deg, ${navy} 0%, ${deep} 70%)` }} />
            <div style={{ position: "absolute", right: -120 + driftX, top: 120, width: 640, height: 640, borderRadius: "50%", background: tint(mid, 0.55), filter: "blur(40px)" }} />
            <div style={{ position: "absolute", right: 380 - driftX, bottom: -220, width: 520, height: 520, borderRadius: "50%", background: tint(mid, 0.35), filter: "blur(50px)" }} />
            <div style={{ position: "absolute", left: 300 + driftY, bottom: -300, width: 560, height: 560, borderRadius: "50%", background: tint(gold, 0.08), filter: "blur(60px)" }} />
          </>
        );
      case "halo":
      default: {
        const sweep = interpolate(frame, [0, 36], [-18, 118], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <>
            <div style={{ position: "absolute", left: `${sweep}%`, top: 0, bottom: 0, width: 8, transform: "skewX(-12deg)", background: dark ? "rgba(255,255,255,0.07)" : tint(navy, 0.05) }} />
            <div style={{ position: "absolute", right: -200 + driftX, bottom: -150 + driftY, width: 420, height: 420, borderRadius: "50%", border: `46px solid ${dark ? "rgba(255,255,255,0.09)" : plumSafe}`, transform: `rotate(${frame * 0.08}deg)` }} />
            <div style={{ position: "absolute", right: -60 + driftX * 0.5, bottom: -10 + driftY * 0.5, width: 140, height: 140, borderRadius: "50%", border: `4px solid ${gold}`, opacity: 0.5 }} />
          </>
        );
      }
    }
  })();

  const masked = MASKED.has(name) ? { WebkitMaskImage: EDGE_MASK, maskImage: EDGE_MASK } : {};
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ ...fill, ...masked }}>{art}</div>
      {rule}
      {spark}
    </div>
  );
}
