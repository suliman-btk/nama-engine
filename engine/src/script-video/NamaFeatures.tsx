import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, formatFigure, grow, landed, parseFigure, parts, startAt } from "./NamaKit";

/*
 * Full-slide designs: no diagram heading, the content itself is the headline.
 *   quote              – a spoken quotation with its source
 *   keyword-highlight  – one key sentence (the title); a marker sweeps over each key word as it is said
 *   big-number         – one spoken figure, very large, with what it counts
 *   fill-blank         – a key sentence (the title) with gaps; each missing word drops in when said
 *   did-you-know       – an opening hook: one surprising fact, lit up
 *   next-lesson        – the closing card: thank you, and what comes next (center = next lesson)
 */

export type FeatureProps = {
  title: string;
  items: string[];
  dark: boolean;
  itemStartSeconds?: number[];
  center?: string;
};

function fadeUp(frame: number, from: number, duration = 14) {
  const p = interpolate(frame, [from, from + duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const e = 1 - Math.pow(1 - p, 3);
  return { opacity: e, transform: `translateY(${Math.round((1 - e) * 22)}px)` };
}

/* 38 ─ Quote: large quotation marks, the words appear in a gentle wave, then the source */
export function Quote({ title, items, dark, itemStartSeconds, center }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const quote = items[0] ?? title;
  const from = itemStartSeconds?.length ? startAt(fps, 0, itemStartSeconds) : 8;
  const words = quote.split(/\s+/);
  const size = quote.length <= 80 ? 68 : quote.length <= 140 ? 58 : 50;
  // A quick wave: the whole quotation is readable within about half a second of being spoken.
  const step = Math.min(1, 10 / words.length);
  const doneAt = from + 8;
  const mark = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", right: -60, top: "50%", width: 400, height: 400, marginTop: -330, borderRadius: "50%", border: `2px dashed ${c.border}`, transform: `rotate(${frame * 0.06}deg)` }} />
      <div style={{ position: "relative", display: "flex", gap: 54, maxWidth: 1340 }}>
        <svg width={150} height={124} viewBox="0 0 150 124" style={{ flexShrink: 0, opacity: mark, transform: `translateY(${(1 - mark) * -20}px) scale(${0.8 + 0.2 * mark})` }}>
          <path d="M 8 120 L 8 70 C 8 30 30 8 64 4 L 64 28 C 44 34 36 46 36 62 L 64 62 L 64 120 Z" fill={c.accent} />
          <path d="M 86 120 L 86 70 C 86 30 108 8 142 4 L 142 28 C 122 34 114 46 114 62 L 142 62 L 142 120 Z" fill={c.accent} />
        </svg>
        <div style={{ paddingTop: 10 }}>
          <div style={{ ...fadeUp(frame, 2), color: c.muted, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 28 }}>{title}</div>
          <div style={{ color: c.text, fontSize: size, fontWeight: 750, lineHeight: 1.26, letterSpacing: -0.5 }}>
            {words.map((word, i) => (
              <span key={`${word}-${i}`} style={{ ...fadeUp(frame, from + i * step, 8), display: "inline-block", marginRight: "0.25em" }}>{word}</span>
            ))}
          </div>
          {center ? (
            <div style={{ ...fadeUp(frame, doneAt, 10), display: "flex", alignItems: "center", gap: 22, marginTop: 44 }}>
              <div style={{ width: 70, height: 6, borderRadius: 3, background: c.accent }} />
              <div style={{ color: c.text, fontSize: 32, fontWeight: 850 }}>{center}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Split `text` around the first case-insensitive occurrence of each key phrase, in order. */
export function highlightSegments(text: string, keys: string[]) {
  const segs: { text: string; key: number }[] = [];
  let rest = text;
  keys.forEach((k, i) => {
    const at = rest.toLowerCase().indexOf(k.toLowerCase());
    if (at < 0 || !k.trim()) return;
    if (at > 0) segs.push({ text: rest.slice(0, at), key: -1 });
    segs.push({ text: rest.slice(at, at + k.length), key: i });
    rest = rest.slice(at + k.length);
  });
  if (rest) segs.push({ text: rest, key: -1 });
  return segs;
}

/* 39 ─ Keyword highlight: the key sentence, with a marker sweeping over each key word as it is spoken */
export function KeywordHighlight({ title, items, dark, itemStartSeconds }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const size = title.length <= 60 ? 86 : title.length <= 100 ? 72 : 62;
  const segs = highlightSegments(title, items.slice(0, 3));
  const bar = clamp01(grow(frame, fps, 14));
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", left: -40, top: "50%", width: 10, height: 300, marginTop: -150, background: c.accent, borderRadius: 5, transform: `scaleY(${bar})` }} />
      <div style={{ maxWidth: 1540 }}>
        <div style={{ ...fadeUp(frame, 4, 18), color: c.text, fontSize: size, fontWeight: 850, lineHeight: 1.3, letterSpacing: -1 }}>
          {segs.map((s, i) => {
            // One text piece per word, so wrapped lines never measure as overlapping text.
            if (s.key < 0) return s.text.split(/(\s+)/).map((w, k) => (/^\s*$/.test(w) ? w : <span key={`${i}-${k}`}>{w}</span>));
            const p = landed(frame, fps, s.key, itemStartSeconds);
            return (
              <span
                key={i}
                style={{
                  color: dark && p > 0.3 ? c.accent : c.text,
                  backgroundImage: dark
                    ? "linear-gradient(rgba(255,255,255,0.14), rgba(255,255,255,0.14))"
                    : `linear-gradient(${c.accent}, ${c.accent})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: dark ? `${p * 100}% 100%` : `${p * 100}% 26%`,
                  backgroundPosition: dark ? "0 50%" : "0 100%",
                  WebkitBoxDecorationBreak: "clone",
                  boxDecorationBreak: "clone",
                  borderRadius: 8,
                  padding: "0 6px",
                  margin: "0 -6px",
                  whiteSpace: "nowrap",
                }}
              >
                {s.text}
              </span>
            );
          })}
        </div>
        <div style={{ width: 110 * bar, height: 8, borderRadius: 4, background: c.accent, marginTop: 50 }} />
      </div>
    </div>
  );
}

/* 40 ─ Big number: one spoken figure counts up, very large, beside what it means (center = source) */
export function BigNumber({ title, items, dark, itemStartSeconds, center }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const [raw, label = ""] = parts(items[0] ?? "");
  const fig = parseFigure(raw);
  const g = landed(frame, fps, 0, itemStartSeconds);
  const shown = fig.value == null ? fig.suffix : `${fig.prefix}${formatFigure(fig.value * g, fig.decimals, fig.grouped)}`;
  const ringShare = fig.value != null && fig.suffix.trim().startsWith("%") && fig.value <= 100 ? fig.value / 100 : null;
  const len = raw.length;
  const size = len <= 3 ? 250 : len <= 5 ? 210 : len <= 7 ? 170 : 140;
  const R = 270;
  const C = 2 * Math.PI * R;
  const enter = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 70 }}>
      <div style={{ position: "relative", width: 640, height: 640, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width={640} height={640} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)", opacity: enter }}>
          <circle cx={320} cy={320} r={R + 30} fill={dark ? "rgba(255,255,255,0.05)" : "#FFFFFF"} />
          <circle cx={320} cy={320} r={R} fill="none" stroke={dark ? "rgba(255,255,255,0.12)" : c.cardSoft} strokeWidth={22} />
          {ringShare != null ? (
            <circle cx={320} cy={320} r={R} fill="none" stroke={c.accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ringShare * g)} />
          ) : (
            <circle cx={320} cy={320} r={R} fill="none" stroke={c.accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${C * 0.08} ${C * 0.04}`} transform={`rotate(${frame * 0.6} 320 320)`} opacity={0.35 + 0.65 * g} />
          )}
        </svg>
        <div style={{ position: "relative", display: "flex", alignItems: "baseline", color: c.text, fontFamily: theme.headingFamily, fontWeight: 900, letterSpacing: -6, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ fontSize: size }}>{shown}</span>
          {fig.value != null && fig.suffix ? <span style={{ fontSize: size * 0.42, marginLeft: 6, letterSpacing: 0 }}>{fig.suffix}</span> : null}
        </div>
      </div>
      <div style={{ flex: 1, maxWidth: 860 }}>
        <div style={{ ...fadeUp(frame, 4), color: c.muted, fontSize: 26, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 26 }}>{title}</div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 26, opacity: 0.3 + 0.7 * g, transform: `translateX(${(1 - g) * -24}px)` }}>
          <div style={{ width: 10, alignSelf: "stretch", borderRadius: 5, background: c.accent, flexShrink: 0 }} />
          <div style={{ color: c.text, fontFamily: theme.headingFamily, fontSize: 60, fontWeight: theme.headingWeight, lineHeight: 1.12 }}>{label}</div>
        </div>
        {center ? <div style={{ ...fadeUp(frame, 30), color: c.muted, fontSize: 26, fontWeight: 700, marginTop: 34 }}>{center}</div> : null}
      </div>
    </div>
  );
}

/* 57 ─ Fill the gap: the key sentence with blanks; each missing word drops into place as it is said */
export function FillBlank({ title, items, dark, itemStartSeconds }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const size = title.length <= 60 ? 80 : title.length <= 100 ? 68 : 58;
  const segs = highlightSegments(title, items.slice(0, 3));
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      <div style={{ maxWidth: 1560 }}>
        <div style={{ ...fadeUp(frame, 2), display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 40 }}>
          <IconDisc name="pencil" size={56} fill={c.accent} color={c.navy} />
          <div style={{ color: c.muted, fontSize: 26, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>Fill the gap</div>
        </div>
        <div style={{ ...fadeUp(frame, 4, 18), color: c.text, fontSize: size, fontWeight: 850, lineHeight: 1.45, letterSpacing: -1 }}>
          {segs.map((seg, i) => {
            // Punctuation right after a gap stays on the gap's line.
            const tail = segs[i - 1]?.key >= 0 ? (seg.text.match(/^[.,;:!?]+/) ?? [""])[0] : "";
            if (seg.key < 0) return seg.text.slice(tail.length).split(/(\s+)/).map((w, k) => (/^\s*$/.test(w) ? w : <span key={`${i}-${k}`}>{w}</span>));
            const p = landed(frame, fps, seg.key, itemStartSeconds);
            const after = segs[i + 1]?.key === -1 ? (segs[i + 1].text.match(/^[.,;:!?]+/) ?? [""])[0] : "";
            return (
              <span key={i} style={{ whiteSpace: "nowrap" }}>
              <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", padding: "0 10px", margin: "0 -4px 0 2px", borderRadius: 14, background: p > 0 ? (dark ? "rgba(205,172,59,0.18)" : "rgba(205,172,59,0.16)") : dark ? "rgba(255,255,255,0.08)" : c.cardSoft, borderBottom: `6px ${p > 0 ? "solid" : "dashed"} ${c.accent}` }}>
                <span style={{ display: "inline-block", color: dark && p > 0.3 ? c.accent : c.text, opacity: p, transform: `translateY(${(1 - p) * -36}px)` }}>{seg.text}</span>
              </span>
              {after ? <span>{after}</span> : null}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* 58 ─ Did you know? An opening hook: a glowing bulb beside one surprising fact (title = the label) */
export function DidYouKnow({ title, items, dark, itemStartSeconds, center }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const fact = items[0] ?? "";
  const from = itemStartSeconds?.length ? startAt(fps, 0, itemStartSeconds) : 10;
  const on = clamp01(grow(frame, fps, from));
  const glow = clamp01(grow(frame, fps, 0));
  const words = fact.split(/\s+/);
  const step = Math.min(1, 10 / words.length);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 90 }}>
      <div style={{ position: "relative", width: 520, height: 520, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: glow }}>
        <div style={{ position: "absolute", inset: 60, borderRadius: "50%", background: `radial-gradient(circle, rgba(205,172,59,${0.18 + 0.22 * on}), transparent 70%)` }} />
        <svg width={520} height={520} style={{ position: "absolute", inset: 0, transform: `rotate(${frame * 0.15}deg)` }}>
          {Array.from({ length: 12 }, (_, k) => {
            const a = (k / 12) * Math.PI * 2;
            const r0 = 175;
            const r1 = 175 + (k % 2 ? 40 : 70) * (0.4 + 0.6 * on);
            return <line key={k} x1={260 + Math.cos(a) * r0} y1={260 + Math.sin(a) * r0} x2={260 + Math.cos(a) * r1} y2={260 + Math.sin(a) * r1} stroke={c.accent} strokeWidth={k % 2 ? 6 : 10} strokeLinecap="round" opacity={0.5 + 0.5 * on} />;
          })}
        </svg>
        <div style={{ transform: `scale(${0.9 + 0.1 * on})` }}>
          <IconDisc name="bulb" size={250} fill={dark ? "#FFFFFF" : c.navy} color={c.accent} ring={dark ? "rgba(255,255,255,0.08)" : "rgba(2,1,129,0.08)"} />
        </div>
      </div>
      <div style={{ flex: 1, maxWidth: 940 }}>
        <div style={{ ...fadeUp(frame, 4), display: "inline-block", padding: "12px 26px", borderRadius: 999, background: c.accent, color: c.navy, fontSize: 26, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", marginBottom: 34 }}>{title}</div>
        <div style={{ color: c.text, fontFamily: theme.headingFamily, fontSize: fact.length <= 70 ? 58 : 50, fontWeight: theme.headingWeight, lineHeight: 1.2 }}>
          {words.map((word, i) => (
            <span key={`${word}-${i}`} style={{ ...fadeUp(frame, from + i * step, 8), display: "inline-block", marginRight: "0.25em" }}>{word}</span>
          ))}
        </div>
        {center ? <div style={{ ...fadeUp(frame, from + 10), color: c.muted, fontSize: 26, fontWeight: 700, marginTop: 34 }}>{center}</div> : null}
      </div>
    </div>
  );
}

/* 59 ─ Up next: thank-you on the left (title), the next lesson (center) and its topics on a card */
export function NextLesson({ title, items, dark, itemStartSeconds, center }: FeatureProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const card = clamp01(grow(frame, fps, 10));
  const pulse = 1 + Math.sin(frame / 9) * 0.05;
  const topics = items.slice(0, 3);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 80 }}>
      <div style={{ flex: 1 }}>
        <div style={{ ...fadeUp(frame, 2), color: c.text, fontFamily: theme.headingFamily, fontSize: 76, fontWeight: theme.headingWeight, lineHeight: 1.08 }}>{title}</div>
        <div style={{ width: 140 * card, height: 8, borderRadius: 4, background: c.accent, marginTop: 40 }} />
      </div>
      <div style={{ position: "relative", width: 720, flexShrink: 0, borderRadius: 40, padding: "52px 56px", overflow: "hidden", background: dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`, border: `4px solid ${c.accent}`, boxShadow: "0 34px 80px rgba(2,1,129,0.30)", opacity: card, transform: `translateX(${(1 - card) * 60}px)` }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 260, height: 260, borderRadius: "50%", border: `36px solid ${dark ? "rgba(2,1,129,0.05)" : "rgba(255,255,255,0.06)"}` }} />
        <div style={{ display: "inline-block", padding: "10px 22px", borderRadius: 999, background: c.accent, color: c.navy, fontSize: 22, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase" }}>Up next</div>
        <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 48, fontWeight: 900, lineHeight: 1.12, margin: "30px 0 30px", paddingRight: 120 }}>{center}</div>
        {topics.map((topic, i) => (
          <div key={topic} style={{ ...fadeUp(frame, itemStartSeconds?.length ? startAt(fps, i, itemStartSeconds) : 24 + i * 6), display: "flex", alignItems: "center", gap: 16, marginTop: 14 }}>
            <Icon name="arrow" size={28} color={c.accent} stroke={3} />
            <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: 30, fontWeight: 700 }}>{topic}</div>
          </div>
        ))}
        <div style={{ position: "absolute", right: 48, top: 52, width: 104, height: 104, borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${pulse})`, boxShadow: "0 0 0 12px rgba(205,172,59,0.22)" }}>
          <svg width={46} height={46} viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill={c.navy} /></svg>
        </div>
      </div>
    </div>
  );
}
