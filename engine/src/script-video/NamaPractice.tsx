import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, grow, landed, parts, shownAt, startAt } from "./NamaKit";
import type { LessonProps } from "./NamaKit";

/*
 * Practice and conversation designs: the learner recalls, matches, orders and predicts, and the
 * lesson talks with them.
 *   flip-card       – a prompt card turns over to its answer when the answer is spoken
 *   match-pairs     – two columns; each pair is linked as it is named
 *   sequence-order  – shuffled cards slide into their place in the order spoken
 *   predict-reveal  – a situation, a pause to predict, then what happened
 *   agenda-progress – the lesson map: parts done, the part now, the parts to come
 *   q-and-a         – questions that open to show their answers
 *   dialogue        – two people talking, as speech bubbles
 *   glossary        – a few terms and what they mean
 */

type P = LessonProps;

/* Deterministic shuffles with no item left in its own place. */
const DERANGE: Record<number, number[]> = { 2: [1, 0], 3: [2, 0, 1], 4: [2, 0, 3, 1], 5: [3, 0, 4, 1, 2] };

/* 41 ─ Flip card: each "front|back" card turns over when its answer is spoken */
export function FlipCard({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 3);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = n === 1 ? 680 : n === 2 ? 600 : 480;
  const H = n === 1 ? 400 : n === 2 ? 380 : 360;
  return (
    <div style={{ width: 1560, display: "flex", justifyContent: "center", gap: 50 }}>
      {visible.map((item, index) => {
        const [front, back = ""] = parts(item);
        const enter = clamp01(grow(frame, fps, 4 + index * 6));
        const turn = landed(frame, fps, index, itemStartSeconds);
        const angle = 180 * turn;
        const showBack = angle >= 90;
        const hot = index === active && turn > 0;
        return (
          <div key={item} style={{ width: W, height: H, perspective: 1600, opacity: enter, transform: `translateY(${(1 - enter) * 30}px)` }}>
            <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transform: `rotateY(${angle}deg) scale(${1 + 0.06 * Math.sin(Math.PI * turn)})` }}>
              <div style={{ position: "absolute", inset: 0, borderRadius: 32, backfaceVisibility: "hidden", opacity: showBack ? 0 : 1, overflow: "hidden", padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: dark ? "#FFFFFF" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`, boxShadow: "0 26px 60px rgba(2,1,129,0.25)" }}>
                <div style={{ position: "absolute", right: -60, bottom: -60, width: 220, height: 220, borderRadius: "50%", border: `30px solid ${dark ? "rgba(2,1,129,0.06)" : "rgba(255,255,255,0.07)"}` }} />
                <IconDisc name="flip" size={64} fill={c.accent} color={c.navy} />
                <div style={{ color: dark ? c.navy : "#FFFFFF", fontSize: n === 3 ? 38 : 46, fontWeight: 900, lineHeight: 1.12 }}>{front}</div>
              </div>
              <div style={{ position: "absolute", inset: 0, borderRadius: 32, backfaceVisibility: "hidden", opacity: showBack ? 1 : 0, transform: "rotateY(180deg)", overflow: "hidden", padding: "38px 44px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 24, background: "#FFFFFF", border: `4px solid ${c.accent}`, boxShadow: hot ? "0 30px 70px rgba(205,172,59,0.40)" : "0 20px 44px rgba(2,1,129,0.16)" }}>
                <ActiveSheen active={hot} dark={false} />
                <div style={{ color: theme.colors.inkDim, fontSize: n === 3 ? 22 : 25, fontWeight: 750, lineHeight: 1.25, paddingBottom: 22, borderBottom: `2px dashed ${c.border}` }}>{front}</div>
                <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 8, padding: "8px 18px 8px 12px", borderRadius: 999, background: c.accent, color: c.navy, fontSize: 21, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>
                  <Icon name="check" size={22} color={c.navy} stroke={3.2} />
                  Answer
                </div>
                <div style={{ color: c.navy, fontSize: n === 3 ? 30 : 38, fontWeight: 850, lineHeight: 1.2 }}>{back}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 42 ─ Match the pairs: terms on the left, shuffled partners on the right; each link draws as it is named */
export function MatchPairs({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const n = visible.length;
  const perm = DERANGE[n] ?? visible.map((_, i) => i);
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1500;
  const cardW = 500;
  const rowH = n <= 2 ? 130 : n === 3 ? 112 : 98;
  const gap = 26;
  const H = n * rowH + (n - 1) * gap;
  const yAt = (slot: number) => slot * (rowH + gap) + rowH / 2;
  const letters = ["A", "B", "C", "D"];
  const card = (text: string, side: "left" | "right", slot: number, matched: number, hot: boolean, tag: string) => {
    const enter = clamp01(grow(frame, fps, 4 + slot * 5 + (side === "right" ? 8 : 0)));
    const on = matched > 0.6;
    return (
      <div key={`${side}-${text}`} style={{ position: "absolute", [side]: 0, top: slot * (rowH + gap), width: cardW, height: rowH, borderRadius: 24, display: "flex", alignItems: "center", gap: 20, padding: "0 28px", overflow: "hidden", opacity: enter, background: hot ? "#FFFFFF" : on && dark ? "rgba(255,255,255,0.16)" : c.card, border: `3px solid ${on ? c.accent : c.border}`, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.18)" : "none", flexDirection: side === "left" ? "row" : "row-reverse", textAlign: side === "left" ? "left" : "right" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, background: on ? c.accent : dark && !hot ? "rgba(255,255,255,0.12)" : c.cardSoft, color: on || !dark || hot ? c.navy : "#FFFFFF" }}>{tag}</div>
        <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: n === 4 ? 28 : 32, fontWeight: 800, lineHeight: 1.15 }}>{text}</div>
      </div>
    );
  };
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {visible.map((_, k) => {
          const g = landed(frame, fps, k, itemStartSeconds);
          const y1 = yAt(k);
          const y2 = yAt(perm[k]);
          const x1 = cardW + 6;
          const x2 = W - cardW - 6;
          const d = `M ${x1} ${y1} C ${x1 + 170} ${y1}, ${x2 - 170} ${y2}, ${x2} ${y2}`;
          return (
            <g key={k}>
              <circle cx={x1} cy={y1} r={9} fill={g > 0 ? c.accent : c.border} />
              <circle cx={x2} cy={y2} r={9} fill={g > 0.95 ? c.accent : c.border} />
              <path d={d} fill="none" stroke={k === active ? c.accent : dark ? "rgba(255,255,255,0.7)" : c.navy} strokeWidth={k === active ? 7 : 5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} />
            </g>
          );
        })}
      </svg>
      {visible.map((item, k) => {
        const [left] = parts(item);
        return card(left, "left", k, landed(frame, fps, k, itemStartSeconds), k === active, String(k + 1));
      })}
      {visible.map((item, k) => {
        const [, right = ""] = parts(item);
        return card(right, "right", perm[k], landed(frame, fps, k, itemStartSeconds), k === active, letters[perm[k]]);
      })}
    </div>
  );
}

/* 43 ─ Put in order: cards start shuffled and each slides into its numbered place when spoken */
export function SequenceOrder({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const perm = DERANGE[n] ?? visible.map((_, i) => i);
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const rowH = n <= 3 ? 108 : n === 4 ? 96 : 82;
  const gap = 18;
  const H = n * rowH + (n - 1) * gap;
  const tilt = [-2.2, 1.6, -1.2, 2, -1.6];
  return (
    <div style={{ position: "relative", width: 1300, height: H }}>
      {visible.map((_, slot) => {
        const filled = shownAt(frame, fps, slot, itemStartSeconds);
        return (
          <div key={slot} style={{ position: "absolute", left: 0, top: slot * (rowH + gap), width: 1300, height: rowH, borderRadius: 24, border: `3px dashed ${filled ? "transparent" : c.border}`, display: "flex", alignItems: "center", paddingLeft: 20 }}>
            <div style={{ width: rowH - 30, height: rowH - 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, background: filled ? c.accent : "transparent", border: `3px solid ${filled ? c.accent : c.border}`, color: filled || !dark ? c.navy : "#FFFFFF" }}>{slot + 1}</div>
          </div>
        );
      })}
      {visible.map((item, k) => {
        const g = landed(frame, fps, k, itemStartSeconds);
        const enter = clamp01(grow(frame, fps, 4 + perm[k] * 5));
        const from = perm[k] * (rowH + gap);
        const to = k * (rowH + gap);
        const y = from + (to - from) * g;
        const hot = k === active;
        const placed = g > 0.9;
        return (
          <div key={item} style={{ position: "absolute", left: rowH + 10, top: y, width: 1300 - rowH - 10, height: rowH, borderRadius: 22, display: "flex", alignItems: "center", gap: 22, padding: "0 30px", overflow: "hidden", opacity: enter, zIndex: hot ? 2 : 1, transform: `translateX(${(1 - g) * 60}px) rotate(${(1 - g) * tilt[k]}deg)`, background: hot ? (dark ? "#FFFFFF" : c.navy) : placed ? c.card : dark ? "rgba(255,255,255,0.14)" : "#FFFFFF", border: `2px solid ${hot || placed ? c.accent : c.border}`, boxShadow: hot ? "0 22px 48px rgba(2,1,129,0.25)" : "0 10px 24px rgba(2,1,129,0.08)" }}>
            <ActiveSheen active={hot} dark={!dark} />
            <div style={{ flex: 1, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: n === 5 ? 28 : 32, fontWeight: 800, lineHeight: 1.15 }}>{item}</div>
            {placed ? <Icon name="check" size={34} color={c.accent} stroke={3.4} style={{ opacity: g }} /> : null}
          </div>
        );
      })}
    </div>
  );
}

/* 44 ─ Predict, then reveal: the situation (center), a pause to predict, then what happened */
export function PredictReveal({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const r = landed(frame, fps, 0, itemStartSeconds);
  const ask = startAt(fps, 0, itemStartSeconds);
  const wait = clamp01((frame - 20) / Math.max(1, ask - 20));
  const left = clamp01(grow(frame, fps, 0));
  const R = 70;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ width: 1560, height: 480, display: "flex", alignItems: "center", gap: 40 }}>
      <div style={{ position: "relative", width: 700, height: 440, borderRadius: 34, padding: "48px 50px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, overflow: "hidden", background: dark ? "rgba(255,255,255,0.08)" : `linear-gradient(150deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`, border: dark ? "2px solid rgba(255,255,255,0.18)" : "none", boxShadow: dark ? "none" : "0 24px 60px rgba(2,1,129,0.25)", opacity: left, transform: `translateX(${(1 - left) * -40}px)` }}>
        <div style={{ position: "absolute", right: -70, top: -70, width: 240, height: 240, borderRadius: "50%", border: "30px solid rgba(255,255,255,0.06)" }} />
        <IconDisc name="pin" size={72} fill={c.accent} color={c.navy} />
        <div style={{ color: c.accent, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>The situation</div>
        <div style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 800, lineHeight: 1.22 }}>{center}</div>
      </div>
      <svg width={80} height={60} viewBox="0 0 80 60" style={{ flexShrink: 0 }}>
        <path d="M 8 30 L 64 30 M 48 14 L 66 30 L 48 46" fill="none" stroke={r > 0 ? c.accent : c.border} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ position: "relative", width: 700, height: 440 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: 34, border: `3px dashed ${c.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, opacity: 1 - r }}>
          <div style={{ position: "relative", width: 2 * R + 30, height: 2 * R + 30 }}>
            <svg width={2 * R + 30} height={2 * R + 30} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
              <circle cx={R + 15} cy={R + 15} r={R} fill="none" stroke={c.border} strokeWidth={12} />
              <circle cx={R + 15} cy={R + 15} r={R} fill="none" stroke={c.accent} strokeWidth={12} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * wait} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: c.text, fontSize: 84, fontWeight: 900 }}>?</div>
          </div>
          <div style={{ color: c.text, fontSize: 34, fontWeight: 850, textAlign: "center", padding: "0 40px" }}>What do you think happens?</div>
        </div>
        <div style={{ position: "absolute", inset: 0, borderRadius: 34, padding: "48px 50px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 26, overflow: "hidden", background: "#FFFFFF", border: `4px solid ${c.accent}`, boxShadow: "0 28px 64px rgba(205,172,59,0.30)", opacity: r, transform: `perspective(1400px) rotateY(${(1 - r) * -70}deg)`, transformOrigin: "left center" }}>
          <ActiveSheen active={r > 0} dark={false} />
          <IconDisc name="flag" size={72} fill={c.navy} color={c.accent} />
          <div style={{ color: theme.colors.inkDim, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>What happened</div>
          <div style={{ color: c.navy, fontSize: 34, fontWeight: 850, lineHeight: 1.22 }}>{items[0]}</div>
        </div>
      </div>
    </div>
  );
}

/* 45 ─ Lesson progress: parts already covered are ticked, the current part is marked "you are here" */
export function AgendaProgress({ items, dark, itemStartSeconds, current }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const now = Math.min(n, Math.max(1, current ?? 1)) - 1;
  const W = 1560;
  const slot = W / n;
  const x = (i: number) => slot * i + slot / 2;
  const ty = 230;
  const fill = clamp01(grow(frame, fps, 6));
  const pulse = 1 + Math.sin(frame / 8) * 0.06;
  const pin = clamp01(grow(frame, fps, 24));
  return (
    <div style={{ position: "relative", width: W, height: 520 }}>
      <div style={{ position: "absolute", left: x(0), width: x(n - 1) - x(0), top: ty - 5, height: 10, borderRadius: 5, background: c.border }} />
      <div style={{ position: "absolute", left: x(0), width: (x(now) - x(0)) * fill, top: ty - 5, height: 10, borderRadius: 5, background: c.accent }} />
      <div style={{ position: "absolute", left: x(now) - 130, width: 260, top: ty - 160, display: "flex", flexDirection: "column", alignItems: "center", opacity: pin, transform: `translateY(${(1 - pin) * -20}px)` }}>
        <div style={{ padding: "10px 24px", borderRadius: 999, background: dark ? "#FFFFFF" : c.navy, color: dark ? c.navy : "#FFFFFF", fontSize: 22, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" }}>You are here</div>
        <div style={{ width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: `14px solid ${dark ? "#FFFFFF" : c.navy}` }} />
      </div>
      {visible.map((item, i) => {
        const done = i < now;
        const isNow = i === now;
        const size = isNow ? 100 : 70;
        return (
          <React.Fragment key={item}>
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 6), position: "absolute", left: x(i) - size / 2, top: ty - size / 2, width: size, height: size, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: isNow ? 36 : 26, fontWeight: 900, background: isNow ? c.accent : done ? (dark ? "#FFFFFF" : c.navy) : c.bg, border: `4px solid ${isNow ? c.accent : done ? (dark ? "#FFFFFF" : c.navy) : c.border}`, color: c.navy, boxShadow: isNow ? `0 0 0 ${12 * pulse}px rgba(205,172,59,0.22)` : "none" }}>
              {done ? <Icon name="check" size={34} color={dark ? c.navy : "#FFFFFF"} stroke={3.4} /> : <span style={{ color: isNow || !dark ? c.navy : "#FFFFFF" }}>{i + 1}</span>}
            </div>
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 6), position: "absolute", left: x(i) - slot / 2 + 12, width: slot - 24, top: ty + 76, minHeight: 120, borderRadius: 22, padding: "20px 18px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", background: isNow ? "#FFFFFF" : "transparent", border: isNow ? `3px solid ${c.accent}` : "3px solid transparent", boxShadow: isNow ? "0 20px 44px rgba(2,1,129,0.18)" : "none", color: isNow ? c.navy : done ? c.text : c.muted, fontSize: n > 5 ? 25 : 29, fontWeight: isNow ? 900 : 750, lineHeight: 1.18 }}>
              {item}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* 46 ─ Questions and answers: each question opens to show its answer when the answer is spoken */
export function QandA({ items, dark, itemStartSeconds, leftCount }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const half = Math.min(3, leftCount ?? Math.floor(items.length / 2));
  const pairs = Array.from({ length: Math.min(half, items.length - half) }, (_, i) => ({ q: items[i], a: items[half + i], qi: i, ai: half + i }));
  const n = pairs.length;
  const qH = n === 1 ? 112 : n === 2 ? 98 : 84;
  const aH = n === 1 ? 140 : n === 2 ? 108 : 90;
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  return (
    <div style={{ width: 1460, display: "flex", flexDirection: "column", gap: 20 }}>
      {pairs.map(({ q, a, qi, ai }) => {
        const r = landed(frame, fps, ai, itemStartSeconds);
        const open = Math.min(1, r * 1.12);
        const hot = active === qi || active === ai;
        return (
          <div key={q} style={{ ...itemMotion(frame, fps, qi, itemStartSeconds, 9), borderRadius: 26, overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 20px 46px rgba(2,1,129,0.16)" : "none" }}>
            <div style={{ height: qH, display: "flex", alignItems: "center", gap: 24, padding: "0 30px" }}>
              <IconDisc name="question" size={58} fill={c.accent} color={c.navy} />
              <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: n === 1 ? 36 : 31, fontWeight: 850, lineHeight: 1.15 }}>{q}</div>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: `3px solid ${hot ? c.navy : c.border}`, position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", left: 10, right: 10, top: 19.5, height: 3, background: hot ? c.navy : c.muted, borderRadius: 2 }} />
                <div style={{ position: "absolute", top: 10, bottom: 10, left: 19.5, width: 3, background: hot ? c.navy : c.muted, borderRadius: 2, transform: `scaleY(${1 - open})` }} />
              </div>
            </div>
            <div style={{ height: aH * open, overflow: "hidden" }}>
              <div style={{ height: aH, display: "flex", alignItems: "center", gap: 24, padding: "0 30px 0 112px", borderTop: `2px dashed ${hot ? "rgba(205,172,59,0.5)" : c.border}`, background: hot ? "rgba(205,172,59,0.08)" : "transparent" }}>
                <div style={{ color: hot ? c.navy : c.text, fontSize: n === 1 ? 34 : 29, fontWeight: 650, lineHeight: 1.22 }}>{a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 47 ─ Dialogue: "Speaker|line" bubbles — the first speaker on the left, the second on the right */
export function Dialogue({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const speakers: string[] = [];
  visible.forEach((item) => {
    const [who] = parts(item);
    if (!speakers.includes(who)) speakers.push(who);
  });
  const font = n >= 5 ? 30 : n === 4 ? 34 : 38;
  const avatar = n >= 5 ? 72 : 88;
  return (
    <div style={{ width: 1460, display: "flex", flexDirection: "column", gap: n >= 5 ? 14 : 22 }}>
      {visible.map((item, i) => {
        const [who, line = ""] = parts(item);
        const right = speakers.indexOf(who) === 1;
        const hot = i === active;
        const bubble = right ? (dark ? "#FFFFFF" : c.navy) : hot ? "#FFFFFF" : c.card;
        const ink = right ? (dark ? c.navy : "#FFFFFF") : hot ? c.navy : c.text;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), display: "flex", flexDirection: right ? "row-reverse" : "row", alignItems: "flex-end", gap: 20 }}>
            <div style={{ width: avatar, height: avatar, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: avatar * 0.42, fontWeight: 900, background: right ? c.accent : dark ? "#FFFFFF" : c.navy, color: right || dark ? c.navy : "#FFFFFF", boxShadow: hot ? `0 0 0 7px ${dark ? "rgba(205,172,59,0.25)" : "rgba(205,172,59,0.3)"}` : "none" }}>
              {who.slice(0, 1).toUpperCase()}
            </div>
            <div style={{ position: "relative", maxWidth: 1100, minWidth: 420, padding: n >= 5 ? "16px 32px" : "22px 38px", borderRadius: 28, borderBottomLeftRadius: right ? 28 : 6, borderBottomRightRadius: right ? 6 : 28, background: bubble, border: `2px solid ${hot ? c.accent : right ? "transparent" : c.border}`, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.18)" : "none", overflow: "hidden" }}>
              <ActiveSheen active={hot} dark={right && !dark} />
              <div style={{ color: right ? (dark ? c.navy : c.accent) : hot ? c.navy : c.muted, fontSize: 21, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 6, textAlign: right ? "right" : "left" }}>{who}</div>
              <div style={{ color: ink, fontSize: font, fontWeight: 750, lineHeight: 1.22 }}>{line}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 48 ─ Glossary: "Term|meaning" rows, each term with its letter tile */
export function Glossary({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const rowH = n <= 2 ? 150 : n === 3 ? 128 : 108;
  return (
    <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 18 }}>
      {visible.map((item, i) => {
        const [term, meaning = ""] = parts(item);
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: rowH, borderRadius: 26, display: "flex", alignItems: "center", gap: 30, padding: "0 36px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 20px 46px rgba(2,1,129,0.16)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            <div style={{ width: rowH - 44, height: rowH - 44, borderRadius: 20, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: hot ? c.accent : dark ? "rgba(255,255,255,0.12)" : c.cardSoft, color: hot || !dark ? c.navy : "#FFFFFF", fontSize: rowH * 0.36, fontWeight: 900 }}>{term.slice(0, 1).toUpperCase()}</div>
            <div style={{ width: 400, flexShrink: 0, color: hot ? c.navy : c.text, fontSize: n === 4 ? 31 : 35, fontWeight: 900, lineHeight: 1.1 }}>{term}</div>
            <div style={{ width: 3, alignSelf: "stretch", margin: "24px 0", background: hot ? c.accent : c.border, borderRadius: 2 }} />
            <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: n === 4 ? 27 : 30, fontWeight: 550, lineHeight: 1.25 }}>{meaning}</div>
          </div>
        );
      })}
    </div>
  );
}
