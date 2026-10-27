import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, formatFigure, grow, landed, parts, shownAt } from "./NamaKit";
import type { IconName, LessonProps } from "./NamaKit";

/*
 * Analysis and decision designs.
 *   swot             – strengths, weaknesses, opportunities, threats ("Strengths|text")
 *   priority-matrix  – two axes, four named quadrants (columns), items placed by quadrant name
 *   five-whys        – a problem (center) followed down a chain of "why?" to its root cause
 *   traffic-light    – stop / careful / go, each lamp lights as its rule is spoken
 *   gauge            – a dial of levels; the needle swings to the current level
 *   radar            – a profile across 3–6 dimensions from spoken scores
 */

type P = LessonProps;

const SWOT: { key: string; name: string; icon: IconName }[] = [
  { key: "s", name: "Strengths", icon: "shield" },
  { key: "w", name: "Weaknesses", icon: "alert" },
  { key: "o", name: "Opportunities", icon: "rocket" },
  { key: "t", name: "Threats", icon: "bolt" },
];

/* 60 ─ SWOT: four quadrants; each spoken point lands in its quadrant */
export function Swot({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const placed = items.map((item, index) => {
    const [label, text = ""] = parts(item);
    return { q: Math.max(0, SWOT.findIndex((s) => label.toLowerCase().startsWith(s.key))), text, index };
  });
  const look = (q: number) => {
    if (q === 0) return { bg: dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy})`, ink: dark ? c.navy : "#FFFFFF", disc: c.accent, discInk: c.navy, border: "transparent" };
    if (q === 2) return { bg: `linear-gradient(150deg, #E4C862, ${c.accent})`, ink: c.navy, disc: c.navy, discInk: c.accent, border: "transparent" };
    return { bg: c.card, ink: c.text, disc: dark ? "rgba(255,255,255,0.14)" : c.cardSoft, discInk: dark ? "#FFFFFF" : c.navy, border: c.border };
  };
  return (
    <div style={{ width: 1560, height: 580, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 20 }}>
      {SWOT.map((quad, q) => {
        const l = look(q);
        const mine = placed.filter((p) => p.q === q).slice(0, 2);
        const enter = clamp01(grow(frame, fps, 2 + q * 4));
        return (
          <div key={quad.key} style={{ position: "relative", borderRadius: 30, padding: "26px 34px", overflow: "hidden", background: l.bg, border: `2px solid ${l.border}`, opacity: enter, transform: `scale(${0.96 + 0.04 * enter})`, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ position: "absolute", right: 26, top: -36, fontSize: 200, fontWeight: 900, lineHeight: 1, color: l.ink, opacity: 0.08 }}>{quad.key.toUpperCase()}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <IconDisc name={quad.icon} size={56} fill={l.disc} color={l.discInk} />
              <div style={{ color: l.ink, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>{quad.name}</div>
            </div>
            {mine.map((p) => (
              <div key={p.index} style={{ ...itemMotion(frame, fps, p.index, itemStartSeconds, 9), position: "relative", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 16, padding: "10px 18px", borderRadius: 16, background: p.index === active ? (q === 0 || q === 2 ? "rgba(255,255,255,0.18)" : "rgba(205,172,59,0.16)") : "transparent" }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: q === 2 ? c.navy : c.accent, flexShrink: 0 }} />
                <div style={{ color: l.ink, fontSize: 30, fontWeight: p.index === active ? 850 : 700, lineHeight: 1.18 }}>{p.text}</div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* 61 ─ Priority matrix: leftLabel = vertical axis, rightLabel = horizontal axis, columns = quadrant names */
export function PriorityMatrix({ items, dark, itemStartSeconds, columns, leftLabel, rightLabel }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const names = (columns ?? ["Do first", "Plan", "Delegate", "Drop"]).slice(0, 4);
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const axis = clamp01(grow(frame, fps, 0));
  const ink = dark ? "rgba(255,255,255,0.8)" : c.navy;
  const placed = items.map((item, index) => {
    const [quad, text = ""] = parts(item);
    return { q: Math.max(0, names.findIndex((n) => n.toLowerCase() === quad.toLowerCase())), text, index };
  });
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      <svg width={1560} height={600} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={110} y1={540} x2={110} y2={540 - 530 * axis} stroke={ink} strokeWidth={6} strokeLinecap="round" />
        <path d={`M 96 ${26 + (1 - axis) * 500} L 110 ${8 + (1 - axis) * 500} L 124 ${26 + (1 - axis) * 500}`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        <line x1={110} y1={540} x2={110 + 1440 * axis} y2={540} stroke={ink} strokeWidth={6} strokeLinecap="round" />
        <path d={`M ${1532 - (1 - axis) * 1400} 526 L ${1550 - (1 - axis) * 1400} 540 L ${1532 - (1 - axis) * 1400} 554`} fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "absolute", left: 40, top: 270, transform: "translate(-50%, -50%) rotate(-90deg)", color: c.text, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", whiteSpace: "nowrap", opacity: axis }}>{leftLabel} →</div>
      <div style={{ position: "absolute", left: 140, right: 0, top: 558, textAlign: "center", color: c.text, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", opacity: axis }}>{rightLabel} →</div>
      <div style={{ position: "absolute", left: 140, right: 10, top: 0, height: 520, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16 }}>
        {names.map((name, q) => {
          const mine = placed.filter((p) => p.q === q).slice(0, 2);
          const best = q === 0;
          const enter = clamp01(grow(frame, fps, 4 + q * 4));
          return (
            <div key={name} style={{ borderRadius: 26, padding: "20px 26px", display: "flex", flexDirection: "column", gap: 12, opacity: enter, background: best ? (dark ? "rgba(255,255,255,0.12)" : "rgba(205,172,59,0.18)") : c.card, border: `2px ${best ? "solid" : "dashed"} ${best ? c.accent : c.border}` }}>
              <div style={{ alignSelf: "flex-start", padding: "6px 18px", borderRadius: 999, background: best ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, color: best || !dark ? c.navy : "#FFFFFF", fontSize: 21, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase" }}>{name}</div>
              {mine.map((p) => {
                const hot = p.index === active;
                return (
                  <div key={p.index} style={{ ...itemMotion(frame, fps, p.index, itemStartSeconds, 9), position: "relative", padding: "12px 20px", borderRadius: 16, overflow: "hidden", background: hot ? (dark ? "#FFFFFF" : c.navy) : dark ? "rgba(255,255,255,0.10)" : "#FFFFFF", border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: 27, fontWeight: 800, lineHeight: 1.15, boxShadow: hot ? "0 14px 30px rgba(2,1,129,0.2)" : "none" }}>
                    <ActiveSheen active={hot} dark={!dark} />
                    {p.text}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 62 ─ Five whys: from the problem (center), each "why?" steps down until the root cause (last item) */
export function FiveWhys({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const rowH = n >= 5 ? 74 : n === 4 ? 82 : 92;
  const gap = 14;
  const step = n >= 5 ? 80 : 100;
  const top = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ position: "relative", width: 1560, display: "flex", flexDirection: "column", gap }}>
      <div style={{ height: 96, borderRadius: 26, display: "flex", alignItems: "center", gap: 22, padding: "0 30px", width: 1000, background: dark ? "#FFFFFF" : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`, opacity: top, transform: `translateY(${(1 - top) * -14}px)` }}>
        <IconDisc name="alert" size={58} fill={c.accent} color={c.navy} />
        <div style={{ color: dark ? theme.colors.inkDim : c.accent, fontSize: 21, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>Problem</div>
        <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 32, fontWeight: 850, lineHeight: 1.15 }}>{center}</div>
      </div>
      {visible.map((item, i) => {
        const root = i === n - 1;
        const hot = i === active;
        const x = (i + 1) * step;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", marginLeft: x, height: rowH, display: "flex", alignItems: "center", gap: 18 }}>
            <svg width={60} height={rowH} style={{ position: "absolute", left: -66, top: -rowH / 2 - gap, overflow: "visible" }}>
              <path d={`M 20 0 L 20 ${rowH} L 52 ${rowH}`} fill="none" stroke={shownAt(frame, fps, i, itemStartSeconds) ? c.accent : c.border} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ width: 120, height: rowH - 14, flexShrink: 0, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: root ? c.navy : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, color: root ? c.accent : c.text, fontSize: 21, fontWeight: 900, letterSpacing: 1.5, ...(root && dark ? { background: "#FFFFFF", color: c.navy } : {}) }}>
              {root ? <Icon name="search" size={24} color={dark ? c.navy : c.accent} stroke={3} /> : null}
              {root ? "ROOT" : `WHY ${i + 1}`}
            </div>
            <div style={{ position: "relative", height: "100%", flex: 1, maxWidth: 1000, borderRadius: 20, display: "flex", alignItems: "center", padding: "0 28px", overflow: "hidden", background: root ? c.accent : hot ? "#FFFFFF" : c.card, border: `2px solid ${root || hot ? c.accent : c.border}`, color: root || hot ? c.navy : c.text, fontSize: n >= 5 ? 27 : 30, fontWeight: root ? 900 : 800, lineHeight: 1.15, boxShadow: root ? "0 18px 40px rgba(205,172,59,0.35)" : "none" }}>
              <ActiveSheen active={hot} dark={root} />
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const LAMPS = ["#E5484D", "#F5A524", "#30A46C"];
const LAMP_LABELS = ["Stop", "Careful", "Go"];

/* 63 ─ Traffic light: stop / careful / go — each lamp lights as its rule is spoken */
export function TrafficLight({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 3);
  const active = activeIndex(frame, fps, visible.length, itemStartSeconds);
  const box = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ width: 1460, height: 580, display: "flex", alignItems: "center", gap: 70 }}>
      <div style={{ width: 230, height: 580, borderRadius: 60, background: dark ? "rgba(255,255,255,0.10)" : `linear-gradient(180deg, #23236E, ${c.navy})`, border: `4px solid ${dark ? "rgba(255,255,255,0.25)" : c.navy}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-around", padding: "30px 0", flexShrink: 0, opacity: box, boxShadow: "0 26px 60px rgba(2,1,129,0.25)" }}>
        {LAMPS.map((color, i) => {
          const on = landed(frame, fps, i, itemStartSeconds);
          return <div key={color} style={{ width: 140, height: 140, borderRadius: "50%", background: color, opacity: 0.18 + 0.82 * on, boxShadow: on > 0 ? `0 0 ${50 * on}px ${color}, inset 0 -10px 20px rgba(0,0,0,0.18)` : "inset 0 -10px 20px rgba(0,0,0,0.3)", border: "6px solid rgba(0,0,0,0.18)" }} />;
        })}
      </div>
      <div style={{ flex: 1, height: 580, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        {visible.map((item, i) => {
          const [a, b] = parts(item);
          const label = b ? a : LAMP_LABELS[i];
          const text = b ?? a;
          const hot = i === active;
          return (
            <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: 150, borderRadius: 28, display: "flex", alignItems: "center", gap: 30, padding: "0 36px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? LAMPS[i] : c.border}`, borderLeft: `14px solid ${LAMPS[i]}`, boxShadow: hot ? "0 20px 46px rgba(2,1,129,0.16)" : "none" }}>
              <ActiveSheen active={hot} dark={false} />
              <div style={{ width: 170, flexShrink: 0, color: hot ? c.navy : c.text, fontSize: 28, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: hot ? c.navy : c.text, fontSize: 34, fontWeight: 750, lineHeight: 1.2 }}>{text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 64 ─ Gauge: a dial of levels (low → high); the needle swings to the current level as it is named */
export function Gauge({ items, dark, itemStartSeconds, current, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const now = Math.min(n, Math.max(1, current ?? n)) - 1;
  const cx = 780;
  const cy = 480;
  const R = 310;
  const thick = 80;
  const shades = dark ? ["rgba(255,255,255,0.14)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0.30)", "rgba(255,255,255,0.38)", "rgba(255,255,255,0.46)"] : ["#D9D9EE", "#B5B5E2", "#8B8BD6", "#5656C4", "#2B2B9C"];
  const angleAt = (k: number) => Math.PI - (k / n) * Math.PI;
  const pt = (a: number, r: number) => [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
  const arc = (k: number) => {
    const a0 = angleAt(k) - 0.012;
    const a1 = angleAt(k + 1) + 0.012;
    const [x0, y0] = pt(a0, R);
    const [x1, y1] = pt(a1, R);
    const [x2, y2] = pt(a1, R - thick);
    const [x3, y3] = pt(a0, R - thick);
    return `M ${x0} ${y0} A ${R} ${R} 0 0 1 ${x1} ${y1} L ${x2} ${y2} A ${R - thick} ${R - thick} 0 0 0 ${x3} ${y3} Z`;
  };
  const swing = landed(frame, fps, now, itemStartSeconds);
  const needle = Math.PI - swing * (Math.PI - (angleAt(now) + angleAt(now + 1)) / 2);
  const [nx, ny] = pt(needle, R - thick - 30);
  const enter = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      <svg width={1560} height={600} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: enter }}>
        {visible.map((_, k) => (
          <path key={k} d={arc(k)} fill={k === now && swing > 0.9 ? c.accent : shades[Math.round((k / Math.max(1, n - 1)) * 4)]} opacity={shownAt(frame, fps, k, itemStartSeconds) ? 1 : 0.4} />
        ))}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={dark ? "#FFFFFF" : c.navy} strokeWidth={14} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={34} fill={c.accent} stroke={dark ? c.bg : "#FFFFFF"} strokeWidth={8} />
      </svg>
      {visible.map((item, k) => {
        const mid = (angleAt(k) + angleAt(k + 1)) / 2;
        const [x, y] = pt(mid, R + 128);
        const hot = k === now && swing > 0.9;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, k, itemStartSeconds, 9), position: "absolute", left: x - 125, top: y - 34, width: 250, height: 68, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 18px", background: hot ? c.accent : c.card, border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? c.navy : c.text, fontSize: 26, fontWeight: 850, boxShadow: hot ? "0 14px 32px rgba(205,172,59,0.4)" : "none" }}>
            {item}
          </div>
        );
      })}
      {center ? (
        <div style={{ position: "absolute", left: cx - 300, width: 600, top: cy + 48, textAlign: "center", color: c.text, fontSize: 30, fontWeight: 850, opacity: swing }}>{center}</div>
      ) : null}
    </div>
  );
}

/* 65 ─ Radar: a profile across 3–6 dimensions; each spoken score pushes its point outward */
export function Radar({ items, dark, itemStartSeconds, values, unit }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const vals = visible.map((_, i) => values?.[i] ?? 0);
  const top = Math.max(...vals) <= 5 ? 5 : Math.max(...vals) <= 10 ? 10 : 100;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const cx = 780;
  const cy = 300;
  const R = 255;
  const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2;
  const at = (i: number, r: number) => [cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r];
  const grid = [0.25, 0.5, 0.75, 1].map((f) => visible.map((_, i) => at(i, R * f).join(",")).join(" "));
  const shape = visible.map((_, i) => at(i, R * (vals[i] / top) * landed(frame, fps, i, itemStartSeconds)).join(",")).join(" ");
  const enter = clamp01(grow(frame, fps, 0));
  const ink = dark ? "#FFFFFF" : c.navy;
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      <svg width={1560} height={600} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: enter }}>
        {grid.map((g, k) => <polygon key={k} points={g} fill={k === 3 ? (dark ? "rgba(255,255,255,0.05)" : "#FFFFFF") : "none"} stroke={c.border} strokeWidth={2} strokeDasharray={k === 3 ? undefined : "6 8"} />)}
        {visible.map((_, i) => {
          const [x, y] = at(i, R);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={c.border} strokeWidth={2} />;
        })}
        <polygon points={shape} fill={c.accent} fillOpacity={0.35} stroke={c.accent} strokeWidth={5} strokeLinejoin="round" />
        {visible.map((_, i) => {
          const [x, y] = at(i, R * (vals[i] / top) * landed(frame, fps, i, itemStartSeconds));
          return <circle key={i} cx={x} cy={y} r={i === active ? 13 : 9} fill={i === active ? c.accent : ink} stroke={dark ? c.bg : "#FFFFFF"} strokeWidth={4} />;
        })}
      </svg>
      {visible.map((item, i) => {
        const [x, y] = at(i, R + 44 + (Math.abs(ang(i) - Math.PI / 2) < 0.2 ? 18 : 0));
        const hot = i === active;
        const g = landed(frame, fps, i, itemStartSeconds);
        const side = Math.abs(x - cx) < 20 ? "center" : x < cx ? "right" : "left";
        const left = side === "center" ? x - 150 : side === "right" ? x - 300 : x;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left, top: y - 38, width: 300, display: "flex", flexDirection: side === "right" ? "row-reverse" : "row", justifyContent: side === "center" ? "center" : "flex-start", alignItems: "center", gap: 12 }}>
            <div style={{ color: hot ? c.text : c.text, fontSize: 27, fontWeight: hot ? 900 : 800, textAlign: side === "right" ? "right" : side === "center" ? "center" : "left", lineHeight: 1.1 }}>{item}</div>
            <div style={{ padding: "6px 14px", borderRadius: 999, flexShrink: 0, background: hot ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, color: hot || !dark ? c.navy : "#FFFFFF", fontSize: 24, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{formatFigure(vals[i] * g, Number.isInteger(vals[i]) ? 0 : 1)}{unit ?? ""}</div>
          </div>
        );
      })}
    </div>
  );
}

