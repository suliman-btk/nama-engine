import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, formatFigure, grow, landed, parts, shownAt, startAt } from "./NamaKit";
import type { LessonProps } from "./NamaKit";

/*
 * Contrast, structure and data designs.
 *   myth-vs-fact      – a misconception is struck through when the fact is spoken
 *   pros-cons         – advantages and disadvantages of one option
 *   pillars           – a roof idea held up by 3–5 supporting pillars
 *   hierarchy-tree    – one idea broken into parts and sub-parts (top-down)
 *   comparison-table  – a few options compared on a few criteria
 *   percent-ring      – spoken percentages fill their rings
 *   line-chart        – spoken values drawn as a trend, point by point
 */

type P = LessonProps;

/* 31 ─ Myth vs fact: each myth is crossed out the moment its fact is spoken */
export function MythVsFact({ items, dark, itemStartSeconds, leftCount, leftLabel, rightLabel }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const half = Math.min(3, leftCount ?? Math.floor(items.length / 2));
  const pairs = Array.from({ length: Math.min(half, items.length - half) }, (_, i) => ({ myth: items[i], fact: items[half + i], mi: i, fi: half + i }));
  const n = pairs.length;
  const rowH = n === 1 ? 250 : n === 2 ? 180 : 132;
  const font = n === 1 ? 38 : n === 2 ? 32 : 28;
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const cardW = 660;
  const chip = (text: string, fact: boolean) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px 6px 10px", borderRadius: 999, fontSize: 20, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase", background: fact ? c.accent : "transparent", color: fact ? c.navy : c.text, border: fact ? "none" : `2px solid ${c.border}` }}>
      <Icon name={fact ? "check" : "cross"} size={22} color={fact ? c.navy : c.text} stroke={3.2} />
      {text}
    </div>
  );
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", gap: 24 }}>
      {pairs.map(({ myth, fact, mi, fi }) => {
        const busted = landed(frame, fps, fi, itemStartSeconds);
        const factHot = active === fi;
        const mythHot = active === mi;
        return (
          <div key={myth} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ ...itemMotion(frame, fps, mi, itemStartSeconds, 9), position: "relative", width: cardW, height: rowH, borderRadius: 26, padding: "0 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, overflow: "hidden", background: mythHot ? "#FFFFFF" : dark ? "rgba(255,255,255,0.08)" : c.cardSoft, border: `2px ${busted > 0 ? "dashed" : "solid"} ${mythHot ? c.accent : c.border}`, color: mythHot ? c.navy : c.text }}>
              <div>{chip(leftLabel ?? "Myth", false)}</div>
              <div style={{ position: "relative", alignSelf: "flex-start", fontSize: font, fontWeight: 800, lineHeight: 1.18, opacity: 1 - 0.12 * busted }}>
                {myth}
                <div style={{ position: "absolute", left: -6, right: -6, top: "54%", height: 3, borderRadius: 2, background: c.accent, transformOrigin: "left center", transform: `scaleX(${busted})` }} />
              </div>
            </div>
            <svg width={150} height={60} viewBox="0 0 150 60">
              <path d="M 16 30 L 126 30 M 108 12 L 128 30 L 108 48" fill="none" stroke={busted > 0 ? c.accent : c.border} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={busted > 0 ? 1 - busted : 0} />
            </svg>
            <div style={{ ...itemMotion(frame, fps, fi, itemStartSeconds, 9), position: "relative", width: cardW, height: rowH, borderRadius: 26, padding: "0 36px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, overflow: "hidden", background: dark ? "#FFFFFF" : c.navy, border: `3px solid ${factHot ? c.accent : "transparent"}`, boxShadow: factHot ? "0 24px 54px rgba(2,1,129,0.28)" : "0 12px 28px rgba(2,1,129,0.12)", color: dark ? c.navy : "#FFFFFF" }}>
              <ActiveSheen active={factHot} dark={!dark} />
              <div>{chip(rightLabel ?? "Fact", true)}</div>
              <div style={{ fontSize: font, fontWeight: 850, lineHeight: 1.18 }}>{fact}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 32 ─ Pros and cons: two columns weigh one option (center = the option) */
export function ProsCons({ items, dark, itemStartSeconds, leftCount, leftLabel, rightLabel, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const half = Math.min(4, leftCount ?? Math.ceil(items.length / 2));
  const pros = items.slice(0, half);
  const cons = items.slice(half, half + 4);
  const per = Math.max(pros.length, cons.length);
  const cardH = per <= 2 ? 112 : per === 3 ? 94 : 80;
  const font = per <= 2 ? 32 : per === 3 ? 30 : 27;
  const active = activeIndex(frame, fps, pros.length + cons.length, itemStartSeconds);
  const top = clamp01(grow(frame, fps, 0));
  const column = (list: string[], offset: number, pro: boolean) => (
    <div style={{ width: 730, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ height: 84, borderRadius: 22, display: "flex", alignItems: "center", gap: 20, padding: "0 28px", background: pro ? (dark ? "#FFFFFF" : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`) : `linear-gradient(120deg, #E4C862, ${c.accent})`, opacity: top, transform: `translateY(${(1 - top) * -14}px)` }}>
        <IconDisc name={pro ? "plus" : "minus"} size={52} fill={pro ? c.accent : c.navy} color={pro ? c.navy : "#FFFFFF"} />
        <div style={{ color: pro && !dark ? "#FFFFFF" : c.navy, fontSize: 30, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>{pro ? leftLabel ?? "Pros" : rightLabel ?? "Cons"}</div>
      </div>
      {list.map((item, k) => {
        const i = offset + k;
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: cardH, borderRadius: 20, display: "flex", alignItems: "center", gap: 22, padding: "0 28px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, borderLeft: `10px solid ${pro ? (dark ? "#FFFFFF" : c.navy) : c.accent}`, boxShadow: hot ? "0 16px 36px rgba(2,1,129,0.14)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            <Icon name={pro ? "plus" : "minus"} size={30} color={hot ? c.navy : pro ? c.text : c.accent} stroke={3.4} />
            <div style={{ color: hot ? c.navy : c.text, fontSize: font, fontWeight: 800, lineHeight: 1.15 }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      {center ? (
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 34px 12px 16px", borderRadius: 999, background: c.card, border: `2px solid ${c.accent}`, opacity: top }}>
          <IconDisc name="scale" size={50} fill={c.accent} color={c.navy} />
          <div style={{ color: c.text, fontSize: 30, fontWeight: 900 }}>{center}</div>
        </div>
      ) : null}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {column(pros, 0, true)}
        <div style={{ alignSelf: "stretch", width: 4, borderRadius: 2, background: c.border, margin: "10px 0" }} />
        {column(cons, half, false)}
      </div>
    </div>
  );
}

/* 33 ─ Pillars: the main idea (center) is a roof held up by its supporting pillars */
export function Pillars({ items, dark, itemStartSeconds, center, leftLabel }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1400;
  const inset = 70;
  const gap = n > 4 ? 26 : 38;
  const colW = Math.min(290, (W - inset * 2 - gap * (n - 1)) / n);
  const roof = clamp01(grow(frame, fps, 0));
  const all = visible.every((_, i) => shownAt(frame, fps, i, itemStartSeconds));
  const glow = all ? clamp01(grow(frame, fps, Math.max(...visible.map((_, i) => startAt(fps, i, itemStartSeconds))) + 12)) : 0;
  const solid = dark ? "#FFFFFF" : c.navy;
  return (
    <div style={{ position: "relative", width: W, height: 600 }}>
      <svg width={W} height={150} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: roof, transform: `translateY(${(1 - roof) * -30}px)` }}>
        <polygon points={`20,128 ${W / 2},6 ${W - 20},128`} fill={dark ? c.accent : c.navy} stroke={c.accent} strokeWidth={glow > 0 ? 6 * glow : 0} strokeLinejoin="round" />
        <rect x={0} y={128} width={W} height={22} rx={6} fill={dark ? "#FFFFFF" : c.accent} />
      </svg>
      <div style={{ position: "absolute", left: W / 2 - 330, width: 660, top: 58, height: 64, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: dark ? c.navy : "#FFFFFF", fontSize: 34, fontWeight: 900, lineHeight: 1.05, opacity: roof }}>{center}</div>
      <div style={{ position: "absolute", left: inset, right: inset, top: 150, height: 326, display: "flex", justifyContent: "center", gap: n <= 3 ? 90 : gap }}>
        {visible.map((item, index) => {
          const hot = index === active;
          const rise = landed(frame, fps, index, itemStartSeconds);
          const shaft = hot
            ? `linear-gradient(90deg, #D9BC55, #F0DC94 50%, #D9BC55)`
            : dark
              ? "linear-gradient(90deg, rgba(255,255,255,0.16), rgba(255,255,255,0.30) 50%, rgba(255,255,255,0.16))"
              : "linear-gradient(90deg, #E6E6F4, #FFFFFF 50%, #E6E6F4)";
          return (
            <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), width: colW, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: colW + 22, height: 24, borderRadius: 6, background: solid }} />
              <div style={{ position: "relative", width: colW, height: 278, background: shaft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", boxShadow: hot ? "0 0 40px rgba(205,172,59,0.45)" : "none" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `repeating-linear-gradient(90deg, transparent 0 ${Math.max(18, colW / 7)}px, ${hot ? "rgba(2,1,129,0.10)" : dark ? "rgba(255,255,255,0.08)" : "rgba(2,1,129,0.06)"} ${Math.max(18, colW / 7)}px ${Math.max(18, colW / 7) + 4}px)` }} />
                <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${Math.round(rise * 100)}%`, background: c.accent }} />
                <div style={{ position: "relative", padding: "0 16px", textAlign: "center", color: hot ? c.navy : c.text, fontSize: n > 4 ? 25 : 29, fontWeight: 850, lineHeight: 1.15 }}>{item}</div>
              </div>
              <div style={{ width: colW + 22, height: 24, borderRadius: 6, background: solid }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 482, height: 22, borderRadius: 6, background: solid, opacity: roof }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 508, height: 24, borderRadius: 6, background: solid, opacity: roof * 0.75 }} />
      {leftLabel ? (
        <div style={{ position: "absolute", left: 0, right: 0, top: 550, textAlign: "center", color: c.text, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", opacity: roof }}>{leftLabel}</div>
      ) : null}
    </div>
  );
}

/** Split hierarchy items into branches ("Name") and leaves ("Branch|Leaf"). */
export function hierarchyLayout(items: string[]) {
  const branches: { text: string; index: number; leaves: { text: string; index: number }[] }[] = [];
  items.forEach((item, index) => {
    const [a, b] = parts(item);
    if (b === undefined) {
      branches.push({ text: a, index, leaves: [] });
      return;
    }
    const owner = branches.find((br) => br.text.toLowerCase() === a.toLowerCase()) ?? branches[branches.length - 1];
    owner?.leaves.push({ text: b, index });
  });
  return branches.slice(0, 4).map((br) => ({ ...br, leaves: br.leaves.slice(0, 3) }));
}

/* 34 ─ Hierarchy tree: one idea (center) splits into parts, and parts into details */
export function HierarchyTree({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const branches = hierarchyLayout(items);
  const B = Math.max(1, branches.length);
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const W = 1560;
  const colW = W / B;
  const branchW = Math.min(360, colW - 40);
  const rootW = 560;
  const rootH = 92;
  const busY = 132;
  const branchY = 172;
  const branchH = 92;
  const leafY = branchY + branchH + 36;
  const leafH = 72;
  const leafGap = 16;
  const rootIn = clamp01(grow(frame, fps, 0));
  const line = dark ? "rgba(255,255,255,0.55)" : c.navy;
  const node = (text: string, index: number, x: number, y: number, w: number, h: number, leaf: boolean) => {
    const hot = index === active;
    return (
      <div key={`${index}-${text}`} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), position: "absolute", left: x, top: y, width: w, height: h, borderRadius: leaf ? 16 : 22, display: "flex", alignItems: "center", justifyContent: leaf ? "flex-start" : "center", textAlign: leaf ? "left" : "center", padding: leaf ? "0 22px" : "0 24px", overflow: "hidden", background: hot ? c.accent : leaf ? c.card : dark ? "#FFFFFF" : "#FFFFFF", border: `${leaf ? 2 : 3}px solid ${hot ? c.accent : leaf ? c.border : dark ? "transparent" : c.navy}`, color: hot || (!leaf) ? c.navy : c.text, fontSize: leaf ? 25 : 28, fontWeight: leaf ? 750 : 900, lineHeight: 1.12, boxShadow: hot ? "0 16px 34px rgba(205,172,59,0.35)" : leaf ? "none" : "0 10px 24px rgba(2,1,129,0.10)" }}>
        <ActiveSheen active={hot} dark />
        {text}
      </div>
    );
  };
  return (
    <div style={{ position: "relative", width: W, height: 580 }}>
      <svg width={W} height={580} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={W / 2} y1={rootH} x2={W / 2} y2={busY} stroke={line} strokeWidth={4} opacity={rootIn} />
        {branches.map((br, b) => {
          const cx = colW * b + colW / 2;
          const g = landed(frame, fps, br.index, itemStartSeconds);
          const d = `M ${W / 2} ${busY} L ${cx} ${busY} L ${cx} ${branchY}`;
          const stemX = cx - branchW / 2 + 30;
          return (
            <g key={br.text}>
              <path d={d} fill="none" stroke={c.border} strokeWidth={4} />
              <path d={d} fill="none" stroke={line} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />
              {br.leaves.map((leaf, k) => {
                const y = leafY + k * (leafH + leafGap) + leafH / 2;
                const lg = landed(frame, fps, leaf.index, itemStartSeconds);
                const ld = `M ${stemX} ${branchY + branchH} L ${stemX} ${y} L ${stemX + 30} ${y}`;
                return (
                  <g key={leaf.text}>
                    <path d={ld} fill="none" stroke={c.border} strokeWidth={3} />
                    <path d={ld} fill="none" stroke={c.accent} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - lg} />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: W / 2 - rootW / 2, top: 0, width: rootW, height: rootH, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 30px", background: dark ? c.accent : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`, color: dark ? c.navy : "#FFFFFF", fontSize: 34, fontWeight: 900, border: `4px solid ${c.accent}`, boxShadow: "0 18px 40px rgba(2,1,129,0.22)", opacity: rootIn, transform: `scale(${0.9 + 0.1 * rootIn})` }}>
        {center}
      </div>
      {branches.map((br, b) => {
        const cx = colW * b + colW / 2;
        const x = cx - branchW / 2;
        return (
          <React.Fragment key={br.text}>
            {node(br.text, br.index, x, branchY, branchW, branchH, false)}
            {br.leaves.map((leaf, k) => node(leaf.text, leaf.index, x + 60, leafY + k * (leafH + leafGap), branchW - 60, leafH, true))}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type Cell = { kind: "yes" | "no" | "part" | "text"; text: string };

function readCell(raw: string): Cell {
  const v = raw.trim().toLowerCase();
  if (/^(yes|y|✓|✔|true|check|x?yes)$/.test(v)) return { kind: "yes", text: raw };
  if (/^(no|n|✗|✕|×|x|false|none|-|—)$/.test(v)) return { kind: "no", text: raw };
  if (/^(partly|partial|half|~)$/.test(v)) return { kind: "part", text: raw };
  return { kind: "text", text: raw };
}

/* 35 ─ Comparison table: options (columns) compared row by row on the criteria the narrator names */
export function ComparisonTable({ items, dark, itemStartSeconds, columns }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const heads = (columns ?? []).slice(0, 4);
  const m = Math.max(1, heads.length);
  const rows = items.slice(0, 5);
  const n = rows.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1560;
  const firstW = 440;
  const colW = (W - firstW) / m;
  const rowH = n <= 3 ? 108 : n === 4 ? 94 : 82;
  const head = clamp01(grow(frame, fps, 0));
  const mark = (cell: Cell, hot: boolean) => {
    const onLight = hot || !dark;
    if (cell.kind === "yes") return <IconDisc name="check" size={58} fill={c.accent} color={c.navy} />;
    if (cell.kind === "no") return <IconDisc name="cross" size={58} fill={onLight ? theme.colors.plumSafe : "rgba(255,255,255,0.10)"} color={onLight ? theme.colors.inkDim : "rgba(255,255,255,0.7)"} />;
    if (cell.kind === "part") {
      return (
        <svg width={58} height={58} viewBox="0 0 58 58">
          <circle cx={29} cy={29} r={25} fill="none" stroke={onLight ? c.navy : "#FFFFFF"} strokeWidth={4} />
          <path d="M 29 4 A 25 25 0 0 1 29 54 Z" fill={c.accent} />
        </svg>
      );
    }
    return <div style={{ color: hot ? c.navy : c.text, fontSize: 26, fontWeight: 800, lineHeight: 1.12, textAlign: "center", padding: "0 14px" }}>{cell.text}</div>;
  };
  return (
    <div style={{ width: W, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", height: 86, opacity: head, transform: `translateY(${(1 - head) * -14}px)` }}>
        <div style={{ width: firstW }} />
        {heads.map((h, j) => (
          <div key={h} style={{ width: colW, padding: "0 8px" }}>
            <div style={{ height: "100%", borderRadius: "22px 22px 8px 8px", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", background: j === 0 ? `linear-gradient(120deg, #E4C862, ${c.accent})` : dark ? "#FFFFFF" : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`, color: j === 0 || dark ? c.navy : "#FFFFFF", fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{h}</div>
          </div>
        ))}
      </div>
      {rows.map((row, index) => {
        const [criterion, ...cells] = parts(row);
        const hot = index === active;
        return (
          <div key={row} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), position: "relative", height: rowH, display: "flex", alignItems: "center", borderRadius: 20, overflow: "hidden", background: hot ? "#FFFFFF" : index % 2 ? c.cardSoft : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 16px 36px rgba(2,1,129,0.14)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            {hot ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: c.accent }} /> : null}
            <div style={{ width: firstW, padding: "0 30px 0 36px", color: hot ? c.navy : c.text, fontSize: 30, fontWeight: 850, lineHeight: 1.12 }}>{criterion}</div>
            {heads.map((h, j) => (
              <div key={h} style={{ width: colW, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `2px solid ${c.border}` }}>
                {mark(readCell(cells[j] ?? ""), hot)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/* 36 ─ Percent rings: each spoken percentage fills its ring and counts up */
export function PercentRing({ items, dark, itemStartSeconds, values, unit }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 3);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const size = n === 1 ? 400 : n === 2 ? 350 : 310;
  const stroke = n === 1 ? 36 : 30;
  const R = (size - stroke) / 2 - 6;
  const C = 2 * Math.PI * R;
  const suffix = unit ?? "%";
  return (
    <div style={{ width: 1560, display: "flex", alignItems: n === 1 ? "center" : "flex-start", justifyContent: "center", gap: n === 1 ? 90 : 100 }}>
      {visible.map((item, index) => {
        const hot = index === active;
        const target = Math.max(0, Math.min(100, values?.[index] ?? 0));
        const g = landed(frame, fps, index, itemStartSeconds);
        const shown = target * g;
        const decimals = Number.isInteger(target) ? 0 : 1;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), display: "flex", flexDirection: n === 1 ? "row" : "column", alignItems: "center", gap: n === 1 ? 70 : 30 }}>
            <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
              <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", overflow: "visible" }}>
                <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={dark ? "rgba(255,255,255,0.12)" : c.cardSoft} strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={hot ? c.accent : dark ? "#FFFFFF" : c.navy} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} style={{ filter: hot ? "drop-shadow(0 0 14px rgba(205,172,59,0.55))" : "none" }} />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, fontSize: size * 0.24, fontWeight: 900, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
                {formatFigure(shown, decimals)}
                <span style={{ fontSize: size * 0.12, marginLeft: 4, marginTop: size * 0.06 }}>{suffix}</span>
              </div>
            </div>
            <div style={{ width: n === 1 ? undefined : size + 230, maxWidth: n === 1 ? 640 : undefined, textAlign: n === 1 ? "left" : "center", color: c.text, fontSize: n === 1 ? 46 : 32, fontWeight: 850, lineHeight: 1.18 }}>
              {n === 1 ? <div style={{ width: 90, height: 8, borderRadius: 4, background: c.accent, marginBottom: 28 }} /> : null}
              {item}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  return (steps.find((s) => s * p >= v) ?? 10) * p;
}

/* 37 ─ Line chart: a trend drawn point by point as each spoken value lands (center = the insight) */
export function LineChart({ items, dark, itemStartSeconds, values, unit, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const gradId = React.useId().replace(/:/g, "");
  const visible = items.slice(0, 8);
  const n = visible.length;
  const vals = visible.map((_, i) => values?.[i] ?? 0);
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = center ? 1130 : 1560;
  const H = 560;
  const padL = 96;
  const padR = 40;
  const padT = 60;
  const padB = 74;
  const top = niceMax(Math.max(...vals) * 1.08);
  const inner = 56;
  const x = (i: number) => padL + inner + (n === 1 ? 0.5 : i / (n - 1)) * (W - padL - padR - inner * 2);
  const y = (v: number) => padT + (1 - v / top) * (H - padT - padB);
  const base = y(0);
  // Line drawn to the last spoken point, with the newest segment growing in.
  const reached = vals.reduce((last, _, i) => (shownAt(frame, fps, i, itemStartSeconds) ? i : last), -1);
  const pts: [number, number][] = [];
  for (let i = 0; i <= reached; i++) {
    const g = landed(frame, fps, i, itemStartSeconds);
    if (i === 0) pts.push([x(0), y(vals[0] * g)]);
    else pts.push([x(i - 1) + (x(i) - x(i - 1)) * g, y(vals[i - 1] + (vals[i] - vals[i - 1]) * g)]);
  }
  const line = pts.map(([px, py], k) => `${k ? "L" : "M"} ${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const area = pts.length > 1 ? `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${base} L ${pts[0][0].toFixed(1)} ${base} Z` : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const decimals = vals.some((v) => !Number.isInteger(v)) ? 1 : 0;
  const ink = dark ? "#FFFFFF" : c.navy;
  const allIn = reached === n - 1 ? clamp01(grow(frame, fps, startAt(fps, n - 1, itemStartSeconds) + 14)) : 0;
  const slot = Math.min(240, (W - padL - padR - inner * 2) / Math.max(1, n - 1));
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", gap: 50 }}>
      <div style={{ position: "relative", width: W, height: H, flexShrink: 0 }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={dark ? "#FFFFFF" : c.accent} stopOpacity={dark ? 0.22 : 0.45} />
              <stop offset="100%" stopColor={dark ? "#FFFFFF" : c.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          {ticks.map((t) => (
            <line key={t} x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke={c.border} strokeWidth={t === 0 ? 3 : 2} strokeDasharray={t === 0 ? undefined : "6 10"} />
          ))}
          {area ? <path d={area} fill={`url(#${gradId})`} /> : null}
          {line ? <path d={line} fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {vals.map((v, i) => {
            if (i > reached) return <circle key={i} cx={x(i)} cy={base} r={6} fill={c.border} />;
            const g = landed(frame, fps, i, itemStartSeconds);
            const hot = i === active;
            return (
              <g key={i}>
                {hot ? <circle cx={x(i)} cy={y(v)} r={28 * g} fill={c.accent} opacity={0.25} /> : null}
                <circle cx={x(i)} cy={y(v)} r={(hot ? 15 : 11) * g} fill={hot ? c.accent : dark ? c.bg : "#FFFFFF"} stroke={hot ? c.accent : ink} strokeWidth={5} />
              </g>
            );
          })}
        </svg>
        {ticks.map((t) => (
          <div key={t} style={{ position: "absolute", left: 0, width: padL - 20, top: y(t) - 14, textAlign: "right", color: c.muted, fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatFigure(t, top < 10 ? 1 : 0)}</div>
        ))}
        {visible.map((label, i) => (
          <div key={`${label}-${i}`} style={{ position: "absolute", left: x(i) - slot / 2 + 4, width: slot - 8, top: base + 18, textAlign: "center", color: i === active ? c.text : c.muted, fontSize: 24, fontWeight: i === active ? 900 : 750, lineHeight: 1.1 }}>{label}</div>
        ))}
        {vals.map((v, i) => (i > reached ? null : (
          <div key={i} style={{ position: "absolute", left: x(i) - 90, width: 180, top: y(v) - 62, textAlign: "center", opacity: landed(frame, fps, i, itemStartSeconds) }}>
            <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: i === active ? (dark ? "#FFFFFF" : c.navy) : "transparent", color: i === active ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
              {formatFigure(v, decimals)}{unit ?? ""}
            </span>
          </div>
        )))}
      </div>
      {center ? (
        <div style={{ width: 380, flexShrink: 0, borderRadius: 30, padding: "40px 36px", background: dark ? "#FFFFFF" : c.navy, boxShadow: "0 24px 54px rgba(2,1,129,0.25)", opacity: allIn, transform: `translateX(${(1 - allIn) * 40}px)`, display: "flex", flexDirection: "column", gap: 22 }}>
          <IconDisc name="bulb" size={72} fill={c.accent} color={c.navy} />
          <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 34, fontWeight: 850, lineHeight: 1.2 }}>{center}</div>
        </div>
      ) : null}
    </div>
  );
}
