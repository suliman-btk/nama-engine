import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { niceMax } from "./NamaInsights";
import { Icon, IconDisc, clamp01, formatFigure, grow, landed, parseFigure, parts, shownAt, startAt } from "./NamaKit";
import type { LessonProps } from "./NamaKit";

/*
 * Spoken-number designs and visual metaphors. Every number shown here must be said by the narrator.
 *   icon-array     – "8 out of 10": people icons fill in, one by one
 *   number-change  – a value before and after, joined by a trend arrow
 *   rating-scale   – 1–3 things rated on a 5- or 10-point scale
 *   column-chart   – spoken values as rising columns
 *   cause-effect   – a fishbone: several causes lead to one effect
 *   formula        – "A + B = result": ideas that combine into an outcome
 *   bridge         – the planks that close the gap from where we are to the goal
 *   puzzle         – pieces that fit together into one whole
 */

type P = LessonProps;

/** "8/10" → [8, 10]. */
export function splitRatio(raw: string): [number, number] {
  const [a, b] = raw.split("/").map((v) => Number(v.replace(/[^\d.]/g, "")));
  return [a || 0, b || 10];
}

function Person({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>
      <circle cx={12} cy={6.5} r={4} fill={fill} />
      <path d="M4 22v-2.5A6.5 6.5 0 0 1 10.5 13h3a6.5 6.5 0 0 1 6.5 6.5V22z" fill={fill} />
    </svg>
  );
}

/* 49 ─ Icon array: "8/10|label" — out of a crowd of people, the spoken share lights up */
export function IconArray({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const [ratio, label = ""] = parts(items[0] ?? "");
  const [part, whole] = splitRatio(ratio);
  const total = Math.min(100, Math.max(1, whole));
  const cols = 10;
  const rows = Math.ceil(total / cols);
  const size = rows === 1 ? 82 : rows === 2 ? 74 : rows <= 5 ? 50 : 38;
  const gap = rows === 1 ? 6 : rows <= 2 ? 10 : 6;
  const g = landed(frame, fps, 0, itemStartSeconds);
  const lit = part * g;
  const enter = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", gap: 80 }}>
      <div style={{ padding: 40, borderRadius: 34, background: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF", border: `2px solid ${c.border}`, display: "grid", gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap, opacity: enter, flexShrink: 0 }}>
        {Array.from({ length: total }, (_, i) => {
          const on = i < Math.floor(lit) || (i < part && g > 0.98);
          const pop = on ? clamp01((lit - i) * 1.5) : 0;
          return (
            <div key={i} style={{ transform: `scale(${on ? 0.85 + 0.15 * pop : 0.85})` }}>
              <Person size={size} fill={on ? c.accent : dark ? "rgba(255,255,255,0.18)" : "#D9D9EE"} />
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, color: c.text, fontWeight: 900, lineHeight: 1, opacity: 0.3 + 0.7 * g }}>
          <span style={{ fontSize: 170, letterSpacing: -5 }}>{Math.round(lit)}</span>
          <span style={{ fontSize: 56 }}>out of {whole}</span>
        </div>
        <div style={{ width: 110 * g, height: 8, borderRadius: 4, background: c.accent, margin: "30px 0" }} />
        <div style={{ color: c.text, fontSize: 42, fontWeight: 800, lineHeight: 1.2, opacity: 0.3 + 0.7 * g }}>{label}</div>
      </div>
    </div>
  );
}

/* 50 ─ Number change: "40%|Before" → "75%|After", joined by a rising (or falling) arrow */
export function NumberChange({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const pair = items.slice(0, 2).map((item) => {
    const [raw, label = ""] = parts(item);
    return { raw, label, fig: parseFigure(raw) };
  });
  const up = (pair[1]?.fig.value ?? 0) >= (pair[0]?.fig.value ?? 0);
  const arrow = landed(frame, fps, 1, itemStartSeconds);
  const panel = (k: number) => {
    const p = pair[k];
    if (!p) return null;
    const g = landed(frame, fps, k, itemStartSeconds);
    const after = k === 1;
    const shown = p.fig.value == null ? p.raw : `${p.fig.prefix}${formatFigure(p.fig.value * g, p.fig.decimals, p.fig.grouped)}`;
    const fill = after ? (dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`) : dark ? "rgba(255,255,255,0.08)" : "#FFFFFF";
    const ink = after ? (dark ? c.navy : "#FFFFFF") : c.text;
    return (
      <div style={{ ...itemMotion(frame, fps, k, itemStartSeconds, 9), position: "relative", width: 560, height: 430, borderRadius: 36, padding: "44px 48px", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", background: fill, border: after ? `4px solid ${c.accent}` : `2px solid ${c.border}`, boxShadow: after ? "0 30px 70px rgba(2,1,129,0.28)" : "none" }}>
        <ActiveSheen active={after && g > 0} dark={!dark} />
        <div style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: "50%", background: c.accent, opacity: after ? 0.2 : 0.08 }} />
        <div style={{ alignSelf: "flex-start", padding: "8px 20px", borderRadius: 999, background: after ? c.accent : dark ? "rgba(255,255,255,0.12)" : c.cardSoft, color: after || !dark ? c.navy : "#FFFFFF", fontSize: 22, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>{after ? "After" : "Before"}</div>
        <div style={{ display: "flex", alignItems: "baseline", color: after && !dark ? c.accent : ink, fontWeight: 900, letterSpacing: -4, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: 150 }}>{shown}</span>
          {p.fig.value != null && p.fig.suffix ? <span style={{ fontSize: 64, marginLeft: 6, letterSpacing: 0 }}>{p.fig.suffix}</span> : null}
        </div>
        <div style={{ color: ink, fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>{p.label}</div>
      </div>
    );
  };
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", justifyContent: "center", gap: 40 }}>
      {panel(0)}
      <div style={{ position: "relative", width: 240, height: 140, flexShrink: 0 }}>
        <svg width={240} height={140} viewBox="0 0 240 140" style={{ position: "absolute", inset: 0 }}>
          <path d="M 16 100 L 210 100" fill="none" stroke={c.border} strokeWidth={10} strokeLinecap="round" />
          <path d="M 16 100 L 210 100" fill="none" stroke={c.accent} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arrow} />
          <path d="M 186 78 L 214 100 L 186 122" fill="none" stroke={arrow > 0.9 ? c.accent : c.border} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ position: "absolute", left: 76, top: 0, opacity: 0.3 + 0.7 * arrow, transform: `scale(${0.7 + 0.3 * arrow})` }}>
          <IconDisc name={up ? "trendUp" : "trendDown"} size={76} fill={c.accent} color={c.navy} />
        </div>
      </div>
      {panel(1)}
    </div>
  );
}

/* 51 ─ Rating scale: each item fills its 5- (or 10-) point scale to the spoken score */
export function RatingScale({ items, dark, itemStartSeconds, values, unit }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 3);
  const n = visible.length;
  const vals = visible.map((_, i) => values?.[i] ?? 0);
  const max = vals.every((v) => v <= 5) ? 5 : 10;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const segW = max === 5 ? 118 : 56;
  const segGap = max === 5 ? 14 : 8;
  const rowH = n === 1 ? 210 : n === 2 ? 170 : 140;
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", gap: 22 }}>
      {visible.map((item, i) => {
        const g = landed(frame, fps, i, itemStartSeconds);
        const score = vals[i] * g;
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: rowH, borderRadius: 28, display: "flex", alignItems: "center", gap: 40, padding: "0 44px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 20px 46px rgba(2,1,129,0.16)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            <div style={{ width: 420, flexShrink: 0, color: hot ? c.navy : c.text, fontSize: n === 1 ? 40 : 33, fontWeight: 850, lineHeight: 1.15 }}>{item}</div>
            <div style={{ display: "flex", gap: segGap }}>
              {Array.from({ length: max }, (_, k) => {
                const part = clamp01(score - k);
                return (
                  <div key={k} style={{ position: "relative", width: segW, height: 64, borderRadius: 14, overflow: "hidden", background: hot || !dark ? "#E6E6F4" : "rgba(255,255,255,0.12)" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${part * 100}%`, background: c.accent }} />
                    {max === 5 ? (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="star" size={34} color={part > 0.5 ? c.navy : hot || !dark ? "#B9B9DA" : "rgba(255,255,255,0.35)"} stroke={2.2} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", color: hot ? c.navy : c.text, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>
              <span style={{ fontSize: 64 }}>{formatFigure(score, Number.isInteger(vals[i]) ? 0 : 1)}</span>
              <span style={{ fontSize: 30, marginLeft: 6 }}>{unit ?? `/${max}`}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 52 ─ Column chart: spoken values rise as columns (center = the insight, shown when all are in) */
export function ColumnChart({ items, dark, itemStartSeconds, values, unit, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const vals = visible.map((_, i) => values?.[i] ?? 0);
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = center ? 1130 : 1500;
  const H = 560;
  const padL = 90;
  const padB = 80;
  const padT = 70;
  const top = niceMax(Math.max(...vals) * 1.08);
  const base = H - padB;
  const y = (v: number) => padT + (1 - v / top) * (base - padT);
  const slot = (W - padL - 20) / n;
  const barW = Math.min(150, slot * 0.58);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * top);
  const decimals = vals.some((v) => !Number.isInteger(v)) ? 1 : 0;
  const allIn = shownAt(frame, fps, n - 1, itemStartSeconds) ? clamp01(grow(frame, fps, startAt(fps, n - 1, itemStartSeconds) + 14)) : 0;
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", justifyContent: "center", gap: 50 }}>
      <div style={{ position: "relative", width: W, height: H, flexShrink: 0 }}>
        {ticks.map((t) => (
          <React.Fragment key={t}>
            <div style={{ position: "absolute", left: padL, right: 20, top: y(t), height: t === 0 ? 3 : 0, borderTop: t === 0 ? "none" : `2px dashed ${c.border}`, background: t === 0 ? c.border : "transparent" }} />
            <div style={{ position: "absolute", left: 0, width: padL - 20, top: y(t) - 14, textAlign: "right", color: c.muted, fontSize: 22, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{formatFigure(t, top < 10 ? 1 : 0)}</div>
          </React.Fragment>
        ))}
        {visible.map((label, i) => {
          const g = landed(frame, fps, i, itemStartSeconds);
          const hot = i === active;
          const cx = padL + slot * i + slot / 2;
          const h = (base - y(vals[i])) * g;
          return (
            <React.Fragment key={`${label}-${i}`}>
              <div style={{ position: "absolute", left: cx - barW / 2, width: barW, top: base - h, height: h, borderRadius: "18px 18px 4px 4px", background: hot ? `linear-gradient(180deg, #E4C862, ${c.accent})` : dark ? "linear-gradient(180deg, #FFFFFF, rgba(255,255,255,0.75))" : `linear-gradient(180deg, #3434A8, ${c.navy})`, boxShadow: hot ? "0 0 36px rgba(205,172,59,0.45)" : "none" }} />
              <div style={{ position: "absolute", left: cx - 90, width: 180, top: base - h - 56, textAlign: "center", opacity: g }}>
                <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 999, background: hot ? (dark ? "#FFFFFF" : c.navy) : "transparent", color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: 28, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{formatFigure(vals[i] * g, decimals)}{unit ?? ""}</span>
              </div>
              <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: cx - slot / 2 + 6, width: slot - 12, top: base + 16, textAlign: "center", color: hot ? c.text : c.muted, fontSize: 25, fontWeight: hot ? 900 : 750, lineHeight: 1.12 }}>{label}</div>
            </React.Fragment>
          );
        })}
      </div>
      {center ? (
        <div style={{ width: 360, flexShrink: 0, borderRadius: 30, padding: "40px 36px", background: dark ? "#FFFFFF" : c.navy, boxShadow: "0 24px 54px rgba(2,1,129,0.25)", opacity: allIn, transform: `translateX(${(1 - allIn) * 40}px)`, display: "flex", flexDirection: "column", gap: 22 }}>
          <IconDisc name="bulb" size={72} fill={c.accent} color={c.navy} />
          <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 34, fontWeight: 850, lineHeight: 1.2 }}>{center}</div>
        </div>
      ) : null}
    </div>
  );
}

/* 53 ─ Cause and effect: a fishbone — each spoken cause joins the spine that leads to the effect (center) */
export function CauseEffect({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 6);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1560;
  const H = 580;
  const spineY = H / 2;
  const headX = 1190;
  const cols = Math.ceil(n / 2);
  const colW = (headX - 120) / cols;
  const spine = clamp01(grow(frame, fps, 0));
  const ink = dark ? "rgba(255,255,255,0.8)" : c.navy;
  const cardW = Math.min(320, colW - 30);
  const pos = (i: number) => {
    const col = Math.floor(i / 2);
    const upper = i % 2 === 0;
    const x = 60 + colW * col + colW / 2;
    return { x, upper, joinX: x + 110, endY: upper ? 150 : H - 150 };
  };
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <line x1={40} y1={spineY} x2={40 + (headX - 40) * spine} y2={spineY} stroke={ink} strokeWidth={10} strokeLinecap="round" />
        {visible.map((item, i) => {
          const { x, joinX, endY } = pos(i);
          const g = landed(frame, fps, i, itemStartSeconds);
          return (
            <g key={item}>
              <line x1={joinX} y1={spineY} x2={x} y2={endY} stroke={c.border} strokeWidth={5} />
              <line x1={joinX} y1={spineY} x2={joinX + (x - joinX) * g} y2={spineY + (endY - spineY) * g} stroke={i === active ? c.accent : ink} strokeWidth={6} strokeLinecap="round" />
              <circle cx={joinX} cy={spineY} r={g > 0 ? 11 : 7} fill={g > 0 ? c.accent : c.border} />
            </g>
          );
        })}
      </svg>
      {visible.map((item, i) => {
        const { x, upper } = pos(i);
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x - cardW / 2, top: upper ? 46 : H - 146, width: cardW, height: 100, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 20px", overflow: "hidden", background: hot ? c.accent : dark ? "#FFFFFF" : "#FFFFFF", border: `3px solid ${hot ? c.accent : dark ? "transparent" : c.navy}`, color: c.navy, fontSize: 27, fontWeight: 850, lineHeight: 1.15, boxShadow: hot ? "0 18px 40px rgba(205,172,59,0.40)" : "0 10px 24px rgba(2,1,129,0.10)" }}>
            <ActiveSheen active={hot} dark />
            {item}
          </div>
        );
      })}
      <div style={{ position: "absolute", left: headX, top: spineY - 95, width: W - headX, height: 190, display: "flex", alignItems: "center", padding: "0 70px 0 56px", clipPath: "polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%, 7% 50%)", background: dark ? c.accent : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`, opacity: spine }}>
        <div>
          <div style={{ color: dark ? c.navy : c.accent, fontSize: 21, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 8 }}>Effect</div>
          <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 32, fontWeight: 900, lineHeight: 1.12 }}>{center}</div>
        </div>
      </div>
    </div>
  );
}

/* 54 ─ Formula: ideas combine — part + part = result (the last item is the result) */
export function Formula({ items, dark, itemStartSeconds, joiner }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const partW = n === 4 ? 270 : 330;
  const op = joiner ?? "+";
  const sign = (text: string, index: number) => {
    const g = landed(frame, fps, index, itemStartSeconds);
    return (
      <div style={{ width: 84, height: 84, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: c.accent, color: c.navy, fontSize: 52, fontWeight: 900, lineHeight: 1, opacity: 0.25 + 0.75 * g, transform: `scale(${0.6 + 0.4 * g}) rotate(${(1 - g) * -90}deg)` }}>{text}</div>
    );
  };
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", justifyContent: "center", gap: 22 }}>
      {visible.map((item, i) => {
        const result = i === n - 1;
        const hot = i === active;
        return (
          <React.Fragment key={item}>
            {i > 0 ? sign(result ? "=" : op, i) : null}
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", width: result ? 380 : partW, height: result ? 270 : 220, flexShrink: 0, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 30px", overflow: "hidden", background: result ? (dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`) : hot ? "#FFFFFF" : c.card, border: result ? `4px solid ${c.accent}` : `2px solid ${hot ? c.accent : c.border}`, color: result ? (dark ? c.navy : "#FFFFFF") : hot ? c.navy : c.text, fontSize: result ? 40 : 32, fontWeight: 900, lineHeight: 1.15, boxShadow: result ? "0 30px 70px rgba(2,1,129,0.28)" : hot ? "0 18px 40px rgba(2,1,129,0.14)" : "none" }}>
              <ActiveSheen active={hot} dark={result ? !dark : false} />
              {result ? <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, borderRadius: "50%", background: c.accent, opacity: 0.22 }} /> : null}
              <span style={{ position: "relative" }}>{item}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* 55 ─ Bridge: from where we are (leftLabel) to the goal (rightLabel); each spoken step lays a plank */
export function Bridge({ items, dark, itemStartSeconds, leftLabel, rightLabel }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1560;
  const H = 520;
  const deckY = 290;
  const arcY = H + 10;
  const gapL = 300;
  const gapR = W - 300;
  const plankW = (gapR - gapL) / n;
  const land = clamp01(grow(frame, fps, 0));
  const ink = dark ? "rgba(255,255,255,0.75)" : c.navy;
  const done = visible.every((_, i) => shownAt(frame, fps, i, itemStartSeconds));
  const cliff = (side: "left" | "right") => {
    const left = side === "left";
    const x0 = left ? 0 : gapR;
    const fill = left ? (dark ? "#FFFFFF" : c.navy) : c.accent;
    return (
      <>
        <div style={{ position: "absolute", left: x0, top: deckY, width: 300, height: H - deckY, opacity: land, background: fill, clipPath: left ? "polygon(0 0, 100% 0, 78% 100%, 0 100%)" : "polygon(0 0, 100% 0, 100% 100%, 22% 100%)", borderTopLeftRadius: left ? 20 : 0, borderTopRightRadius: left ? 0 : 20 }} />
        <div style={{ position: "absolute", left: x0 + (left ? 20 : 66), top: deckY + 40, width: 214, color: left && !dark ? "#FFFFFF" : c.navy, fontSize: 30, fontWeight: 900, lineHeight: 1.12, opacity: land, textAlign: "left" }}>
          <div style={{ fontSize: 19, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, color: left && !dark ? c.accent : c.navy }}>{left ? "Now" : "Goal"}</div>
          {left ? leftLabel : rightLabel}
        </div>
      </>
    );
  };
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <path d={`M ${gapL} ${deckY + 20} Q ${W / 2} ${arcY} ${gapR} ${deckY + 20}`} fill="none" stroke={c.border} strokeWidth={8} strokeDasharray="14 14" />
        {visible.map((_, i) => {
          const x = gapL + plankW * i + plankW / 2;
          const t = (x - gapL) / (gapR - gapL);
          const arcAt = deckY + 20 + 2 * t * (1 - t) * (arcY - deckY - 20);
          const g = landed(frame, fps, i, itemStartSeconds);
          return <line key={i} x1={x} y1={deckY + 22} x2={x} y2={deckY + 22 + (arcAt - deckY - 22) * g} stroke={ink} strokeWidth={5} />;
        })}
      </svg>
      {cliff("left")}
      {cliff("right")}
      {done ? (
        <div style={{ position: "absolute", left: gapR + 230, top: deckY - 120, opacity: clamp01(grow(frame, fps, startAt(fps, n - 1, itemStartSeconds) + 10)) }}>
          <Icon name="flag" size={86} color={dark ? "#FFFFFF" : c.navy} stroke={2.6} />
        </div>
      ) : null}
      {visible.map((item, i) => {
        const g = landed(frame, fps, i, itemStartSeconds);
        const hot = i === active;
        const x = gapL + plankW * i;
        return (
          <React.Fragment key={item}>
            <div style={{ position: "absolute", left: x + 4, top: deckY - 4 - (1 - g) * 60, width: plankW - 8, height: 30, borderRadius: 8, opacity: 0.2 + 0.8 * g, background: hot ? c.accent : dark ? "#FFFFFF" : c.navy, boxShadow: "0 8px 18px rgba(2,1,129,0.20)" }} />
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x + 12, top: deckY - 150, width: plankW - 24, height: 116, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, color: hot ? c.navy : c.text, fontSize: n > 4 ? 24 : 27, fontWeight: 850, lineHeight: 1.15, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.16)" : "none" }}>
              <ActiveSheen active={hot} dark={false} />
              {item}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Puzzle piece outline: a knob on the right edge, a matching slot on the left. */
function piecePath(w: number, h: number, r: number, slot: boolean, knob: boolean) {
  const cy = h / 2;
  const rad = 22;
  return [
    `M ${rad} 0 H ${w - rad} Q ${w} 0 ${w} ${rad}`,
    knob ? `V ${cy - r} A ${r} ${r} 0 1 1 ${w} ${cy + r}` : "",
    `V ${h - rad} Q ${w} ${h} ${w - rad} ${h} H ${rad} Q 0 ${h} 0 ${h - rad}`,
    slot ? `V ${cy + r} A ${r} ${r} 0 1 0 0 ${cy - r}` : "",
    `V ${rad} Q 0 0 ${rad} 0 Z`,
  ].join(" ");
}

/* 56 ─ Puzzle: pieces drift in and lock together as each is named (center = the whole they make) */
export function Puzzle({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const w = n === 2 ? 460 : n === 3 ? 400 : 330;
  const h = 300;
  const r = 40;
  const fills = dark ? ["#FFFFFF", c.accent, "#C9C9F5", "rgba(255,255,255,0.16)"] : [c.navy, c.accent, "#3434A8", "#FFFFFF"];
  const inks = dark ? [c.navy, c.navy, c.navy, "#FFFFFF"] : ["#FFFFFF", c.navy, "#FFFFFF", c.navy];
  const offsets = [-90, 80, -70, 90];
  const all = visible.every((_, i) => shownAt(frame, fps, i, itemStartSeconds));
  const whole = all ? clamp01(grow(frame, fps, startAt(fps, n - 1, itemStartSeconds) + 12)) : 0;
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
      <div style={{ position: "relative", width: n * w + r, height: h, filter: whole > 0 ? `drop-shadow(0 0 ${24 * whole}px rgba(205,172,59,0.45))` : "none" }}>
        {visible.map((item, i) => {
          const g = landed(frame, fps, i, itemStartSeconds);
          const hot = i === active;
          const enter = clamp01(grow(frame, fps, 2 + i * 4));
          return (
            <div key={item} style={{ position: "absolute", left: i * w, top: 0, width: w + r, height: h, opacity: (0.35 + 0.65 * g) * enter, transform: `translate(${(1 - g) * (i - (n - 1) / 2) * 50}px, ${(1 - g) * offsets[i]}px) rotate(${(1 - g) * (i % 2 ? 7 : -7)}deg)`, zIndex: hot ? 2 : 1 }}>
              <svg width={w + r} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
                <path d={piecePath(w, h, r, i > 0, i < n - 1)} fill={fills[i % 4]} stroke={hot ? c.accent : dark ? c.bg : "#FFFFFF"} strokeWidth={hot ? 6 : 4} />
              </svg>
              <div style={{ position: "absolute", left: i > 0 ? r + 18 : 30, width: w - (i > 0 ? r + 18 : 30) - 30, top: 0, height: h, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", color: inks[i % 4], fontSize: n === 4 ? 29 : 33, fontWeight: 900, lineHeight: 1.15 }}>{item}</div>
            </div>
          );
        })}
      </div>
      {center ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "18px 50px 18px 22px", borderRadius: 999, background: dark ? "#FFFFFF" : c.navy, border: `4px solid ${c.accent}`, boxShadow: "0 24px 54px rgba(2,1,129,0.25)", opacity: whole, transform: `translateY(${(1 - whole) * 20}px) scale(${0.9 + 0.1 * whole})` }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", color: c.navy, fontSize: 46, fontWeight: 900 }}>=</div>
          <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 44, fontWeight: 900 }}>{center}</div>
        </div>
      ) : null}
    </div>
  );
}
