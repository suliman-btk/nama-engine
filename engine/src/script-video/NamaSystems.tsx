import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, grow, landed, parts, shownAt, startAt } from "./NamaKit";
import type { LessonProps } from "./NamaKit";

/*
 * Systems and relationship designs: how things connect, spread, depend and deepen.
 *   concept-map        – "A|relation|B" links between ideas, each labelled
 *   chain              – links that depend on each other (current = the weakest link)
 *   domino             – a chain reaction: each domino tips the next as it is named
 *   ripple             – one action (center) and its widening effects
 *   circles-of-control – what we control, influence, or can only be concerned about
 *   hourglass          – many inputs narrow to one focus (center), then widen to outcomes
 *   zoom-in            – from the big picture (center) down to the detail
 *   spiral             – the same idea revisited, each round deeper
 */

type P = LessonProps;

/* Ideas sit around a ring in the order they first appear, so a chain of links never crosses itself. */
const NODE_SPOTS: Record<number, [number, number][]> = {
  2: [[330, 290], [1230, 290]],
  3: [[280, 440], [780, 120], [1280, 440]],
  4: [[280, 130], [1280, 130], [1280, 460], [280, 460]],
  5: [[780, 90], [1310, 270], [1090, 490], [470, 490], [250, 270]],
  6: [[250, 110], [780, 110], [1310, 110], [1310, 470], [780, 470], [250, 470]],
};

/* 66 ─ Concept map: ideas joined by labelled arrows ("Practice|builds|Fluency"), each drawn as it is said */
export function ConceptMap({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const links = items.slice(0, 5).map((item) => parts(item));
  const nodes: string[] = [];
  links.forEach(([a, , b]) => [a, b].forEach((x) => x && !nodes.includes(x) && nodes.push(x)));
  const spots = NODE_SPOTS[Math.min(6, Math.max(2, nodes.length))];
  const active = activeIndex(frame, fps, links.length, itemStartSeconds);
  const nodeW = 300;
  const nodeH = 92;
  const firstLink = (name: string) => links.findIndex(([a, , b]) => a === name || b === name);
  const ink = dark ? "rgba(255,255,255,0.75)" : c.navy;
  const trim = (x0: number, y0: number, x1: number, y1: number) => {
    // Stop the arrow at the target node's edge.
    const dx = x1 - x0;
    const dy = y1 - y0;
    const t = Math.min(Math.abs((nodeW / 2 + 14) / (dx || 1e-6)), Math.abs((nodeH / 2 + 14) / (dy || 1e-6)));
    return [x1 - dx * Math.min(t, 0.45), y1 - dy * Math.min(t, 0.45)];
  };
  return (
    <div style={{ position: "relative", width: 1560, height: 580 }}>
      <svg width={1560} height={580} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {links.map(([a, , b], k) => {
          const [x0, y0] = spots[nodes.indexOf(a)] ?? [0, 0];
          const [x1raw, y1raw] = spots[nodes.indexOf(b)] ?? [0, 0];
          const [x1, y1] = trim(x0, y0, x1raw, y1raw);
          const g = landed(frame, fps, k, itemStartSeconds);
          const ex = x0 + (x1 - x0) * g;
          const ey = y0 + (y1 - y0) * g;
          const ang = Math.atan2(y1 - y0, x1 - x0);
          const head = (s: number) => `${ex - Math.cos(ang - s) * 22},${ey - Math.sin(ang - s) * 22}`;
          const hot = k === active;
          return (
            <g key={k}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={c.border} strokeWidth={4} strokeDasharray="8 10" />
              <line x1={x0} y1={y0} x2={ex} y2={ey} stroke={hot ? c.accent : ink} strokeWidth={hot ? 7 : 5} strokeLinecap="round" />
              {g > 0.6 ? <polygon points={`${ex},${ey} ${head(0.45)} ${head(-0.45)}`} fill={hot ? c.accent : ink} /> : null}
            </g>
          );
        })}
      </svg>
      {links.map(([a, rel, b], k) => {
        const [x0, y0] = spots[nodes.indexOf(a)] ?? [0, 0];
        const [x1, y1] = spots[nodes.indexOf(b)] ?? [0, 0];
        const hot = k === active;
        return (
          <div key={`rel-${k}`} style={{ ...itemMotion(frame, fps, k, itemStartSeconds, 9), position: "absolute", left: (x0 + x1) / 2 - 120, top: (y0 + y1) / 2 - 24, width: 240, textAlign: "center" }}>
            <span style={{ display: "inline-block", padding: "8px 18px", borderRadius: 999, background: hot ? c.accent : dark ? c.bg : "#FFFFFF", border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? c.navy : c.text, fontSize: 23, fontWeight: 800, fontStyle: "italic" }}>{rel}</span>
          </div>
        );
      })}
      {nodes.map((name, i) => {
        const [x, y] = spots[i];
        const k = firstLink(name);
        const g = k < 0 ? 1 : clamp01(grow(frame, fps, startAt(fps, k, itemStartSeconds) - 6));
        const hot = active >= 0 && (links[active][0] === name || links[active][2] === name);
        return (
          <div key={name} style={{ position: "absolute", left: x - nodeW / 2, top: y - nodeH / 2, width: nodeW, height: nodeH, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px", opacity: 0.35 + 0.65 * g, transform: `scale(${0.9 + 0.1 * g})`, background: hot ? (dark ? "#FFFFFF" : c.navy) : c.card, border: `3px solid ${hot ? c.accent : dark ? "rgba(255,255,255,0.3)" : c.navy}`, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: 28, fontWeight: 900, lineHeight: 1.1, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.25)" : "none" }}>
            {name}
          </div>
        );
      })}
    </div>
  );
}

/* 67 ─ Chain: each link holds the next (current = the weakest link, shown in gold and tagged) */
export function Chain({ items, dark, itemStartSeconds, current }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const weak = current ? current - 1 : -1;
  const pitch = Math.min(250, 1400 / n);
  const x0 = 780 - (pitch * (n - 1)) / 2;
  const cy = 180;
  const rx = pitch * 0.62;
  const ry = 74;
  return (
    <div style={{ position: "relative", width: 1560, height: 560 }}>
      <svg width={1560} height={560} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {visible.map((_, i) => {
          const g = landed(frame, fps, i, itemStartSeconds);
          const isWeak = i === weak;
          const stroke = isWeak && g > 0 ? c.accent : g > 0 ? (dark ? "#FFFFFF" : c.navy) : c.border;
          const x = x0 + pitch * i;
          return (
            <g key={i} transform={`translate(${x} ${cy})`}>
              <ellipse cx={0} cy={0} rx={rx} ry={i % 2 ? ry * 0.55 : ry} fill="none" stroke={stroke} strokeWidth={i % 2 ? 22 : 26} opacity={0.3 + 0.7 * Math.max(g, 0.2)} />
            </g>
          );
        })}
      </svg>
      {visible.map((item, i) => {
        const x = x0 + pitch * i;
        const hot = i === active;
        const isWeak = i === weak;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x - (pitch - 16) / 2, top: 320, width: pitch - 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 34, background: isWeak ? c.accent : c.border, borderRadius: 2 }} />
            <div style={{ position: "relative", width: "100%", minHeight: 104, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12px 16px", overflow: "hidden", background: isWeak ? c.accent : hot ? "#FFFFFF" : c.card, border: `2px solid ${isWeak || hot ? c.accent : c.border}`, color: isWeak || hot ? c.navy : c.text, fontSize: n > 5 ? 23 : 26, fontWeight: 850, lineHeight: 1.15 }}>
              <ActiveSheen active={hot} dark={isWeak} />
              {item}
            </div>
            {isWeak ? <div style={{ padding: "6px 16px", borderRadius: 999, background: dark ? "#FFFFFF" : c.navy, color: dark ? c.navy : "#FFFFFF", fontSize: 20, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", whiteSpace: "nowrap" }}>Weakest link</div> : null}
          </div>
        );
      })}
    </div>
  );
}

/* 68 ─ Domino effect: each domino tips into the next as it is named; the last is the result */
export function Domino({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const pitch = Math.min(250, 1400 / n);
  const x0 = 780 - (pitch * (n - 1)) / 2;
  const base = 300;
  // Taller than the spacing, so each falling domino can rest on the next one.
  const w = 80;
  const h = Math.round(pitch * 1.2);
  const pips = [[0.5, 0.25], [0.3, 0.15, 0.7, 0.35], [0.3, 0.12, 0.5, 0.25, 0.7, 0.38]];
  return (
    <div style={{ position: "relative", width: 1560, height: 560 }}>
      <div style={{ position: "absolute", left: x0 - 120, right: 1560 - (x0 + pitch * (n - 1)) - 120, top: base, height: 6, borderRadius: 3, background: c.border }} />
      {visible.map((item, i) => {
        const g = landed(frame, fps, i, itemStartSeconds);
        const last = i === n - 1;
        const lean = i === n - 2 ? (Math.acos(w / h) * 180) / Math.PI - 1 : (Math.acos(Math.min(1, w / pitch)) * 180) / Math.PI;
        const tilt = last ? 0 : lean * g;
        const x = x0 + pitch * i;
        const fill = last ? c.accent : dark ? "#FFFFFF" : c.navy;
        const dot = last ? c.navy : dark ? c.navy : "#FFFFFF";
        const set = pips[i % 3];
        return (
          <React.Fragment key={item}>
            <div style={{ position: "absolute", left: last ? x - h / 2 : x - w / 2, top: last ? base - w : base - h, width: last ? h : w, height: last ? w : h, borderRadius: 14, background: fill, transformOrigin: "100% 100%", transform: last ? `translateY(${(1 - g) * -60}px)` : `rotate(${tilt}deg)`, boxShadow: "0 12px 26px rgba(2,1,129,0.25)", opacity: 0.4 + 0.6 * Math.max(g, shownAt(frame, fps, i, itemStartSeconds) ? 1 : 0.3) }}>
              {last
                ? <div style={{ position: "absolute", top: 10, bottom: 10, left: h / 2 - 2, width: 4, borderRadius: 2, background: dot, opacity: 0.5 }} />
                : <div style={{ position: "absolute", left: 10, right: 10, top: h / 2 - 2, height: 4, borderRadius: 2, background: dot, opacity: 0.5 }} />}
              {Array.from({ length: set.length / 2 }, (_, k) => (
                <div key={k} style={{ position: "absolute", left: (last ? set[k * 2 + 1] * h : set[k * 2] * w) - 8, top: (last ? set[k * 2] * w : set[k * 2 + 1] * h) - 8, width: 16, height: 16, borderRadius: "50%", background: dot }} />
              ))}
            </div>
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x - (pitch - 16) / 2, top: base + 40, width: pitch - 16, minHeight: 112, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "12px 16px", overflow: "hidden", background: last ? (dark ? "#FFFFFF" : c.navy) : i === active ? "#FFFFFF" : c.card, border: `2px solid ${i === active || last ? c.accent : c.border}`, color: last ? (dark ? c.navy : "#FFFFFF") : i === active ? c.navy : c.text, fontSize: n > 5 ? 23 : 26, fontWeight: 850, lineHeight: 1.15 }}>
              <ActiveSheen active={i === active} dark={last && !dark} />
              {item}
            </div>
          </React.Fragment>
        );
      })}
      <div style={{ position: "absolute", left: x0 - 150, top: base - 150, opacity: clamp01(grow(frame, fps, 0)) }}>
        <Icon name="hand" size={84} color={c.accent} stroke={2.2} style={{ transform: "rotate(90deg)" }} />
      </div>
    </div>
  );
}

/* 69 ─ Ripple effect: one action (center) at the source, its effects spreading outward ring by ring */
export function Ripple({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const cx = 230;
  const cy = 290;
  const step = (1560 - cx - 220) / n;
  const r = (k: number) => 150 + step * k + step * 0.55;
  const enter = clamp01(grow(frame, fps, 0));
  const wave = (frame % 60) / 60;
  return (
    <div style={{ position: "relative", width: 1560, height: 580, overflow: "hidden", borderRadius: 30 }}>
      <svg width={1560} height={580} style={{ position: "absolute", inset: 0 }}>
        {visible.map((_, k) => {
          const g = landed(frame, fps, k, itemStartSeconds);
          const rr = r(k) * (0.85 + 0.15 * g);
          const a = 1.1;
          const d = `M ${cx + Math.cos(-a) * rr} ${cy + Math.sin(-a) * rr} A ${rr} ${rr} 0 0 1 ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
          return <path key={k} d={d} fill="none" stroke={k === active ? c.accent : dark ? "rgba(255,255,255,0.5)" : c.navy} strokeWidth={k === active ? 8 : 5} strokeLinecap="round" opacity={0.18 + 0.82 * g} />;
        })}
        <circle cx={cx} cy={cy} r={110 + wave * 60} fill="none" stroke={c.accent} strokeWidth={3} opacity={(1 - wave) * 0.6 * enter} />
      </svg>
      <div style={{ position: "absolute", left: cx - 120, top: cy - 120, width: 240, height: 240, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: "0 26px", background: dark ? "#FFFFFF" : `radial-gradient(circle at 35% 30%, ${theme.colors.mid}, ${c.navy})`, boxShadow: "0 22px 50px rgba(2,1,129,0.3)", opacity: enter, transform: `scale(${0.8 + 0.2 * enter})` }}>
        <Icon name="drop" size={46} color={c.accent} stroke={2.6} />
        <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 27, fontWeight: 900, lineHeight: 1.1 }}>{center}</div>
      </div>
      {visible.map((item, k) => {
        const hot = k === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, k, itemStartSeconds, 9), position: "absolute", left: cx + r(k) - 125, top: cy - 44, width: 250, minHeight: 88, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "10px 16px", overflow: "hidden", background: hot ? c.accent : dark ? c.bg : "#FFFFFF", border: `3px solid ${hot ? c.accent : dark ? "rgba(255,255,255,0.4)" : c.navy}`, color: hot ? c.navy : c.text, fontSize: 25, fontWeight: 850, lineHeight: 1.15, boxShadow: hot ? "0 16px 36px rgba(205,172,59,0.4)" : "none" }}>
            <ActiveSheen active={hot} dark />
            {item}
          </div>
        );
      })}
    </div>
  );
}

const RINGS = ["control", "influence", "concern"];

/* 70 ─ Circles of control: "Control|…", "Influence|…", "Concern|…" — each item lands inside its ring */
export function CirclesOfControl({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const cx = 780;
  const cy = 580;
  // Wide oval rings: the bands are broad at the sides, where most chips sit.
  const rings = [{ rx: 270, ry: 180 }, { rx: 520, ry: 370 }, { rx: 780, ry: 570 }];
  const fills = dark ? ["#FFFFFF", "rgba(255,255,255,0.20)", "rgba(255,255,255,0.08)"] : [c.navy, "#C9C9F0", "#ECECF8"];
  const inks = dark ? [c.navy, "#FFFFFF", "#FFFFFF"] : ["#FFFFFF", c.navy, c.navy];
  // Chip centres per ring, chosen so each 220×64 chip stays inside its band.
  const spots: [number, number][][] = [
    [[cx - 110, cy - 75], [cx + 110, cy - 75]],
    [[409, cy - 94], [1151, cy - 94], [cx, cy - 275]],
    [[140, cy - 80], [1420, cy - 80], [cx, cy - 470]],
  ];
  const placed = items.map((item, index) => {
    const [ring, text = ""] = parts(item);
    return { ring: Math.max(0, RINGS.findIndex((r) => ring.toLowerCase().startsWith(r))), text, index };
  });
  const enter = (k: number) => clamp01(grow(frame, fps, 2 + (2 - k) * 5));
  return (
    <div style={{ position: "relative", width: 1560, height: 580, overflow: "hidden" }}>
      <svg width={1560} height={580} style={{ position: "absolute", inset: 0 }}>
        {[2, 1, 0].map((k) => (
          <ellipse key={k} cx={cx} cy={cy} rx={rings[k].rx * (0.9 + 0.1 * enter(k))} ry={rings[k].ry * (0.9 + 0.1 * enter(k))} fill={fills[k]} stroke={dark ? "rgba(255,255,255,0.3)" : "rgba(2,1,129,0.18)"} strokeWidth={2} opacity={enter(k)} />
        ))}
      </svg>
      {RINGS.map((name, k) => (
        <div key={name} style={{ position: "absolute", left: cx - 200, width: 400, top: cy - rings[k].ry + 16, textAlign: "center", color: inks[k], fontSize: 22, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", opacity: enter(k) }}>
          {name}
        </div>
      ))}
      {[0, 1, 2].map((k) => {
        const mine = placed.filter((p) => p.ring === k).slice(0, k === 0 ? 2 : 3);
        return mine.map((p, j) => {
          const hot = p.index === active;
          const [x, y] = k === 0 && mine.length === 1 ? [cx, cy - 75] : spots[k][j];
          return (
            <div key={p.index} style={{ ...itemMotion(frame, fps, p.index, itemStartSeconds, 9), position: "absolute", left: x - (k === 0 ? 100 : 110), top: y - 32, width: k === 0 ? 200 : 220, height: 64, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", background: hot ? c.accent : k === 0 ? (dark ? c.navy : "#FFFFFF") : dark ? c.bg : "#FFFFFF", border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? c.navy : k === 0 ? (dark ? "#FFFFFF" : c.navy) : c.text, fontSize: 22, fontWeight: 850, lineHeight: 1.1, boxShadow: hot ? "0 14px 30px rgba(205,172,59,0.4)" : "0 6px 14px rgba(2,1,129,0.08)" }}>
              {p.text}
            </div>
          );
        });
      })}
    </div>
  );
}

/* 71 ─ Hourglass: inputs (first leftCount items) narrow to one focus (center), then open into outcomes */
export function Hourglass({ items, dark, itemStartSeconds, leftCount, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const half = Math.min(3, leftCount ?? Math.ceil(items.length / 2));
  const ins = items.slice(0, half);
  const outs = items.slice(half, half + 3);
  const active = activeIndex(frame, fps, ins.length + outs.length, itemStartSeconds);
  const W = 1560;
  const cx = W / 2;
  const glass = dark ? "rgba(255,255,255,0.08)" : "#FFFFFF";
  const edge = dark ? "rgba(255,255,255,0.45)" : c.navy;
  const enter = clamp01(grow(frame, fps, 0));
  const flow = outs.length ? landed(frame, fps, half, itemStartSeconds) : 0;
  const chip = (text: string, i: number, x: number, y: number, w: number) => {
    const hot = i === active;
    return (
      <div key={`${i}-${text}`} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x - w / 2, top: y - 36, width: w, height: 72, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 14px", background: hot ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? c.navy : c.text, fontSize: 25, fontWeight: 850, lineHeight: 1.12 }}>{text}</div>
    );
  };
  const spread = (list: string[], offset: number, y: number, span: number) => {
    const w = Math.min(220, span / list.length - 24);
    return list.map((t, k) => chip(t, offset + k, cx - span / 2 + (span / list.length) * (k + 0.5), y, w));
  };
  return (
    <div style={{ position: "relative", width: W, height: 600 }}>
      <svg width={W} height={600} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: enter }}>
        <path d={`M ${cx - 560} 20 L ${cx + 560} 20 L ${cx + 60} 270 L ${cx + 60} 330 L ${cx + 560} 580 L ${cx - 560} 580 L ${cx - 60} 330 L ${cx - 60} 270 Z`} fill={glass} stroke={edge} strokeWidth={6} strokeLinejoin="round" />
        <rect x={cx - 590} y={4} width={1180} height={18} rx={9} fill={edge} />
        <rect x={cx - 590} y={578} width={1180} height={18} rx={9} fill={edge} />
        {Array.from({ length: 9 }, (_, k) => {
          const t = ((frame + k * 7) % 40) / 40;
          return <circle key={k} cx={cx + Math.sin(k * 1.7) * 10} cy={250 + t * 160} r={6} fill={c.accent} opacity={flow > 0 ? 0.8 * (1 - t) : 0} />;
        })}
        <path d={`M ${cx - 300 * flow} 572 Q ${cx} ${572 - 60 * flow} ${cx + 300 * flow} 572 Z`} fill={c.accent} opacity={0.85} />
      </svg>
      {spread(ins, 0, 70, 700)}
      {spread(outs, half, 516, 700)}
      <div style={{ position: "absolute", left: cx - 200, top: 262, width: 400, height: 76, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 14, background: dark ? "#FFFFFF" : c.navy, border: `4px solid ${c.accent}`, color: dark ? c.navy : "#FFFFFF", fontSize: 28, fontWeight: 900, boxShadow: "0 16px 36px rgba(2,1,129,0.3)", opacity: enter }}>
        <Icon name="target" size={32} color={c.accent} stroke={2.6} />
        {center}
      </div>
    </div>
  );
}

/* 72 ─ Zoom in: from the big picture (center) to the detail; each level opens from a lens on the last */
export function ZoomIn({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const levels = [center ?? "", ...items.slice(0, 3)];
  const n = levels.length;
  const gap = 50;
  const widths = n === 4 ? [300, 330, 360, 400] : n === 3 ? [380, 420, 470] : [520, 600];
  const total = widths.reduce((a, b) => a + b, 0) + gap * (n - 1);
  const x0 = (1560 - total) / 2;
  const xs = widths.map((_, i) => x0 + widths.slice(0, i).reduce((a, b) => a + b, 0) + gap * i);
  const hs = widths.map((w) => w * 0.78);
  const cy = 300;
  const active = activeIndex(frame, fps, n - 1, itemStartSeconds);
  const show = (i: number) => (i === 0 ? clamp01(grow(frame, fps, 0)) : landed(frame, fps, i - 1, itemStartSeconds));
  const lines = (
    <svg width={1560} height={600} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 2, pointerEvents: "none" }}>
      {levels.slice(0, -1).map((_, i) => {
        const g = show(i + 1);
        const lx = xs[i] + widths[i] - 30;
        const ly = cy - hs[i] / 2 + 40;
        const nx = xs[i + 1];
        const ny0 = cy - hs[i + 1] / 2;
        const ny1 = cy + hs[i + 1] / 2;
        return <path key={i} d={`M ${lx} ${ly} L ${nx} ${ny0} M ${lx} ${ly + 60} L ${nx} ${ny1}`} stroke={c.accent} strokeWidth={3} strokeDasharray="8 8" opacity={g} />;
      })}
    </svg>
  );
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      {lines}
      {levels.map((text, i) => {
        const g = show(i);
        const last = i === n - 1;
        const hot = i > 0 && i - 1 === active;
        return (
          <div key={`${i}-${text}`} style={{ position: "absolute", left: xs[i], top: cy - hs[i] / 2, width: widths[i], height: hs[i], borderRadius: 28, padding: "26px 28px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", opacity: i === 0 ? g : 0.3 + 0.7 * g, transform: `scale(${0.85 + 0.15 * g})`, background: last ? (dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy})`) : hot ? "#FFFFFF" : c.card, border: `${last || hot ? 4 : 2}px solid ${last || hot ? c.accent : c.border}`, boxShadow: last ? "0 26px 60px rgba(2,1,129,0.28)" : "none" }}>
            {i < n - 1 ? <div style={{ position: "absolute", right: 30, top: 40, width: 60, height: 60, borderRadius: 12, border: `3px dashed ${c.accent}` }} /> : null}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconDisc name="search" size={48} fill={last ? c.accent : dark && !hot ? "rgba(255,255,255,0.14)" : c.cardSoft} color={last || !dark || hot ? c.navy : "#FFFFFF"} />
              <div style={{ color: last ? (dark ? theme.colors.inkDim : c.accent) : hot ? theme.colors.inkDim : c.muted, fontSize: 19, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>{i === 0 ? "Big picture" : last ? "Detail" : `Zoom ${i}`}</div>
            </div>
            <div style={{ color: last ? (dark ? c.navy : "#FFFFFF") : hot ? c.navy : c.text, fontSize: n === 4 ? 27 : 31, fontWeight: 850, lineHeight: 1.15 }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
}

/* 73 ─ Spiral: the same idea revisited, each round further out and deeper (numbered on the spiral) */
export function Spiral({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const cx = 330;
  const cy = 300;
  const turns = 2.4;
  const maxT = turns * Math.PI * 2;
  const rAt = (t: number) => 18 + (t / maxT) * 260;
  const pointAt = (t: number) => [cx + Math.cos(t - Math.PI / 2) * rAt(t), cy + Math.sin(t - Math.PI / 2) * rAt(t)];
  const nodeT = (i: number) => maxT * ((i + 1) / n) * 0.96;
  const reached = visible.reduce((last, _, i) => (shownAt(frame, fps, i, itemStartSeconds) ? i : last), -1);
  // The spiral draws out to the newest spoken round.
  const prevT = reached > 0 ? nodeT(reached - 1) : 0.6;
  const drawTo = reached < 0 ? 0.6 : prevT + (nodeT(reached) - prevT) * landed(frame, fps, reached, itemStartSeconds);
  const path = (to: number) => {
    const pts: string[] = [];
    for (let t = 0; t <= to; t += 0.08) pts.push(pointAt(t).map((v) => v.toFixed(1)).join(","));
    return pts.length > 1 ? `M ${pts.join(" L ")}` : "";
  };
  const ink = dark ? "#FFFFFF" : c.navy;
  return (
    <div style={{ position: "relative", width: 1560, height: 600, display: "flex", alignItems: "center" }}>
      <svg width={680} height={600} style={{ flexShrink: 0, overflow: "visible" }}>
        <path d={path(maxT)} fill="none" stroke={c.border} strokeWidth={6} strokeDasharray="4 12" strokeLinecap="round" />
        <path d={path(Math.max(0.1, drawTo))} fill="none" stroke={c.accent} strokeWidth={9} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={7} fill={c.border} />
        {visible.map((_, i) => {
          const [x, y] = pointAt(nodeT(i));
          const on = shownAt(frame, fps, i, itemStartSeconds);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={i === active ? 30 : 24} fill={i === active ? c.accent : on ? ink : dark ? c.bg : "#FFFFFF"} stroke={i === active ? c.accent : ink} strokeWidth={4} />
              <text x={x} y={y + 9} textAnchor="middle" fontSize={24} fontWeight={900} fill={i === active ? c.navy : on ? (dark ? c.navy : "#FFFFFF") : ink}>{i + 1}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, paddingLeft: 30 }}>
        {visible.map((item, i) => {
          const hot = i === active;
          return (
            <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: n === 5 ? 86 : 100, borderRadius: 22, display: "flex", alignItems: "center", gap: 20, padding: "0 28px", marginLeft: i * 26, overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.16)" : "none" }}>
              <ActiveSheen active={hot} dark={false} />
              <div style={{ color: hot ? c.navy : c.muted, fontSize: 20, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase", width: 110, flexShrink: 0 }}>Round {i + 1}</div>
              <div style={{ color: hot ? c.navy : c.text, fontSize: n === 5 ? 28 : 31, fontWeight: 800, lineHeight: 1.15 }}>{item}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
