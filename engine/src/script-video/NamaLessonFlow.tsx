import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, grow, landed, parts, revealFrame, shownAt, startAt } from "./NamaKit";
import type { IconName, LessonProps } from "./NamaKit";

/*
 * Lesson-flow designs: how a lesson opens, checks understanding, teaches by example and closes.
 *   agenda              – the parts the lesson will cover, in order
 *   learning-objectives – what the learner will be able to do by the end
 *   key-takeaways       – the points to remember, as pinned notes
 *   next-steps          – what to do after the lesson
 *   quiz-choice         – a question with options; the right one lights up when it is spoken
 *   true-false          – statements that receive a TRUE / FALSE stamp when the answer is spoken
 *   tip-callout         – a framed tip, reminder, note or warning
 *   scenario-card       – a short case told as situation → challenge → resolution
 *   worked-example      – a solution revealed step by step, each step with its result
 *   analogy             – "X is like Y", with the matching parts side by side
 */

type P = LessonProps;

/* Navy brand panel used beside lists (agenda, objectives). */
function BrandPanel({ dark, width, children }: { dark: boolean; width: number; children: React.ReactNode }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = clamp01(grow(frame, fps, 0));
  return (
    <div
      style={{
        position: "relative",
        width,
        flexShrink: 0,
        borderRadius: 34,
        overflow: "hidden",
        padding: "46px 40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: dark ? "rgba(255,255,255,0.08)" : `linear-gradient(160deg, ${theme.colors.mid}, ${theme.colors.navy} 58%, ${theme.colors.deep})`,
        border: dark ? `2px solid ${theme.colors.gold}` : "none",
        boxShadow: dark ? "none" : "0 24px 60px rgba(2,1,129,0.25)",
        opacity: g,
        transform: `translateX(${(1 - g) * -40}px)`,
      }}
    >
      <div style={{ position: "absolute", right: -90, bottom: -90, width: 300, height: 300, borderRadius: "50%", border: "34px solid rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", right: 40, top: 46, width: 16, height: 16, borderRadius: "50%", background: theme.colors.gold, opacity: 0.85 }} />
      {children}
    </div>
  );
}

/* 21 ─ Agenda: the lesson's parts on a rail that fills as each part is named */
export function Agenda({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const rowH = n <= 3 ? 116 : n === 4 ? 102 : n === 5 ? 88 : 76;
  const gap = n > 4 ? 12 : 18;
  const font = n <= 4 ? 34 : n === 5 ? 30 : 28;
  const span = (n - 1) * (rowH + gap);
  const reached = visible.reduce((last, _, i) => (shownAt(frame, fps, i, itemStartSeconds) ? i : last), -1);
  const fill = reached <= 0 ? 0 : ((reached - 1) + clamp01(grow(frame, fps, startAt(fps, reached, itemStartSeconds)))) / Math.max(1, n - 1);
  return (
    <div style={{ width: 1560, height: Math.max(470, n * rowH + (n - 1) * gap), display: "flex", gap: 60 }}>
      <BrandPanel dark={dark} width={360}>
        <IconDisc name="list" size={96} fill={c.accent} color={c.navy} />
        <div>
          <div style={{ color: c.accent, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 22 }}>In this lesson</div>
          <div style={{ display: "flex", gap: 8 }}>
            {visible.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 10, borderRadius: 5, background: i <= reached ? c.accent : "rgba(255,255,255,0.18)" }} />
            ))}
          </div>
        </div>
      </BrandPanel>
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap }}>
          <div style={{ position: "absolute", left: 35, top: rowH / 2, height: span, width: 4, borderRadius: 2, background: c.border }} />
          <div style={{ position: "absolute", left: 35, top: rowH / 2, height: span * fill, width: 4, borderRadius: 2, background: c.accent }} />
          {visible.map((item, index) => {
            const hot = index === active;
            const shown = index <= reached;
            return (
              <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), display: "flex", alignItems: "center", gap: 26, height: rowH }}>
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: 74,
                    height: 74,
                    borderRadius: "50%",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 27,
                    fontWeight: 900,
                    background: hot ? c.accent : shown ? (dark ? "#FFFFFF" : c.navy) : c.bg,
                    border: `4px solid ${hot ? c.accent : shown ? (dark ? "#FFFFFF" : c.navy) : c.border}`,
                    color: hot || dark ? c.navy : "#FFFFFF",
                    boxShadow: hot ? `0 0 0 9px ${dark ? "rgba(205,172,59,0.22)" : "rgba(205,172,59,0.25)"}` : "none",
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    height: "100%",
                    borderRadius: 22,
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                    padding: "0 34px",
                    overflow: "hidden",
                    background: hot ? "#FFFFFF" : c.card,
                    border: `2px solid ${hot ? c.accent : c.border}`,
                    boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.16)" : "none",
                    color: hot ? c.navy : c.text,
                    fontSize: font,
                    fontWeight: 800,
                    lineHeight: 1.15,
                  }}
                >
                  <ActiveSheen active={hot} dark={false} />
                  {hot ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 8, background: c.accent }} /> : null}
                  <span style={{ flex: 1 }}>{item}</span>
                  {hot ? <Icon name="arrow" size={34} color={c.navy} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** The first word (usually the action verb) is set heavier, in the accent colour on dark cards. */
function VerbFirst({ text, verbColor }: { text: string; verbColor: string }) {
  const at = text.indexOf(" ");
  const first = at < 0 ? text : text.slice(0, at);
  const rest = at < 0 ? "" : text.slice(at);
  return (
    <span style={{ fontWeight: 400 }}>
      <span style={{ color: verbColor, fontWeight: 900 }}>{first}</span>
      {rest}
    </span>
  );
}

/* 22 ─ Learning objectives: "by the end you will be able to…" — each goal is ticked as it is named */
export function LearningObjectives({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const cardH = n <= 2 ? 150 : n === 3 ? 128 : 108;
  return (
    <div style={{ width: 1560, height: 540, display: "flex", gap: 56 }}>
      <BrandPanel dark={dark} width={470}>
        <IconDisc name="target" size={104} fill={c.accent} color={c.navy} />
        <div>
          <div style={{ color: c.accent, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 18 }}>Learning goals</div>
          <div style={{ color: "#FFFFFF", fontSize: 38, fontWeight: 800, lineHeight: 1.2 }}>{center ?? "By the end of this lesson, you will be able to"}</div>
        </div>
      </BrandPanel>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
        {visible.map((item, index) => {
          const hot = index === active;
          const tick = landed(frame, fps, index, itemStartSeconds);
          return (
            <div
              key={item}
              style={{
                ...itemMotion(frame, fps, index, itemStartSeconds, 9),
                position: "relative",
                height: cardH,
                borderRadius: 24,
                display: "flex",
                alignItems: "center",
                gap: 30,
                padding: "0 38px",
                overflow: "hidden",
                background: hot ? "#FFFFFF" : c.card,
                border: `2px solid ${hot ? c.accent : c.border}`,
                boxShadow: hot ? "0 18px 44px rgba(2,1,129,0.16)" : "none",
              }}
            >
              <ActiveSheen active={hot} dark={false} />
              <div style={{ width: 60, height: 60, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: tick > 0 ? c.accent : "transparent", border: `3px solid ${tick > 0 ? c.accent : c.border}` }}>
                <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={c.navy} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray={24} strokeDashoffset={24 * (1 - tick)} />
                </svg>
              </div>
              <div style={{ color: hot ? c.navy : c.text, fontSize: n <= 2 ? 38 : 34, fontWeight: 800, lineHeight: 1.18 }}>
                <VerbFirst text={item} verbColor={dark && !hot ? c.accent : c.navy} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const NOTE_TILT = [-1.6, 1.3, -0.9, 1.6, -1.2];

/* 23 ─ Key takeaways: points to remember, pinned up like notes as each is spoken */
export function KeyTakeaways({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const gap = n > 4 ? 26 : 36;
  const W = 1560;
  const cardW = (W - gap * (n - 1)) / n;
  return (
    <div style={{ width: W, height: 520, display: "flex", gap, alignItems: "center" }}>
      {visible.map((item, index) => {
        const hot = index === active;
        const g = landed(frame, fps, index, itemStartSeconds);
        const fill = hot ? (dark ? "#FFFFFF" : c.navy) : dark ? "rgba(255,255,255,0.10)" : "#FFFFFF";
        const ink = hot ? (dark ? c.navy : "#FFFFFF") : c.text;
        return (
          <div key={item} style={{ width: cardW, transform: `rotate(${NOTE_TILT[index]}deg) translateY(${hot ? -12 : 0}px)` }}>
            <div
              style={{
                ...itemMotion(frame, fps, index, itemStartSeconds, 9),
                position: "relative",
                height: 440,
                borderRadius: 26,
                padding: "62px 32px 36px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: fill,
                border: `2px solid ${hot ? c.accent : c.border}`,
                boxShadow: hot ? "0 30px 60px rgba(2,1,129,0.28)" : "0 14px 30px rgba(2,1,129,0.10)",
                overflow: "hidden",
              }}
            >
              <ActiveSheen active={hot} dark={!dark} />
              <div style={{ position: "absolute", left: "50%", top: 18, width: 30, height: 30, marginLeft: -15, borderRadius: "50%", background: c.accent, boxShadow: "0 4px 10px rgba(0,0,0,0.25), inset -4px -4px 0 rgba(0,0,0,0.12)" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ color: hot && !dark ? c.accent : dark && !hot ? c.accent : c.navy, fontSize: n > 4 ? 76 : 92, fontWeight: 900, lineHeight: 1, letterSpacing: -3 }}>{String(index + 1).padStart(2, "0")}</div>
                <Icon name="key" size={n > 4 ? 40 : 48} color={hot ? c.accent : c.muted} />
              </div>
              <div>
                <div style={{ color: ink, fontSize: n > 4 ? 28 : n === 4 ? 31 : 34, fontWeight: 850, lineHeight: 1.2 }}>{item}</div>
                <div style={{ width: `${Math.round(g * 70)}%`, height: 7, borderRadius: 4, background: c.accent, marginTop: 26 }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 24 ─ Next steps: a path climbs to a flag while each action to take next is named */
export function NextSteps({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 3);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const cardH = n === 1 ? 210 : n === 2 ? 160 : 128;
  const progress = visible.reduce((sum, _, i) => sum + landed(frame, fps, i, itemStartSeconds), 0) / n;
  const stroke = dark ? "rgba(255,255,255,0.85)" : c.navy;
  const path = "M 40 470 C 150 470, 120 330, 220 300 S 330 150, 330 110";
  return (
    <div style={{ width: 1560, height: 520, display: "flex", alignItems: "center", gap: 60 }}>
      <svg width={420} height={520} viewBox="0 0 420 520" style={{ flexShrink: 0, overflow: "visible" }}>
        <circle cx={230} cy={290} r={190} fill={dark ? "rgba(255,255,255,0.05)" : c.cardSoft} />
        <path d={path} fill="none" stroke={c.border} strokeWidth={10} strokeLinecap="round" strokeDasharray="2 22" />
        <path d={path} fill="none" stroke={c.accent} strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - progress} />
        <circle cx={40} cy={470} r={16} fill={stroke} />
        <g transform={`translate(330 110) scale(${0.6 + 0.4 * progress})`}>
          <line x1={0} y1={0} x2={0} y2={-120} stroke={stroke} strokeWidth={8} strokeLinecap="round" />
          <path d="M 4 -118 L 92 -96 L 4 -70 Z" fill={c.accent} />
          <ellipse cx={0} cy={4} rx={34} ry={9} fill={stroke} opacity={0.3} />
        </g>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        {visible.map((item, index) => {
          const hot = index === active;
          const go = landed(frame, fps, index, itemStartSeconds);
          return (
            <div
              key={item}
              style={{
                ...itemMotion(frame, fps, index, itemStartSeconds, 9),
                position: "relative",
                height: cardH,
                borderRadius: 28,
                display: "flex",
                alignItems: "center",
                gap: 32,
                padding: "0 40px",
                overflow: "hidden",
                background: hot ? (dark ? "#FFFFFF" : c.navy) : c.card,
                border: `2px solid ${hot ? c.accent : c.border}`,
                boxShadow: hot ? "0 24px 54px rgba(2,1,129,0.24)" : "none",
              }}
            >
              <ActiveSheen active={hot} dark={!dark} />
              <div style={{ color: hot ? (dark ? theme.colors.inkDim : c.accent) : c.muted, fontSize: 22, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", width: 96, flexShrink: 0, lineHeight: 1.1 }}>
                Step<div style={{ fontSize: 46, letterSpacing: 0, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text }}>{index + 1}</div>
              </div>
              <div style={{ flex: 1, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: n === 1 ? 44 : 36, fontWeight: 850, lineHeight: 1.15 }}>{item}</div>
              <div style={{ width: 84, height: 84, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: hot ? c.accent : c.cardSoft, transform: `translateX(${(1 - go) * -30}px)` }}>
                <Icon name="arrow" size={40} color={hot ? c.navy : c.muted} stroke={2.8} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 25 ─ Quiz: options appear as they are read, a timer counts down, then the right answer lights up */
export function QuizChoice({ items, dark, itemStartSeconds, answer, revealStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const n = visible.length;
  const right = Math.min(n, Math.max(1, answer ?? 1)) - 1;
  const rf = revealFrame(fps, n, itemStartSeconds, revealStartSeconds);
  const r = frame >= rf ? clamp01(grow(frame, fps, rf)) : 0;
  const askFrom = startAt(fps, n - 1, itemStartSeconds) + 10;
  const clock = clamp01((frame - askFrom) / Math.max(1, rf - askFrom));
  const active = r > 0 ? right : activeIndex(frame, fps, n, itemStartSeconds);
  const cols = n === 3 ? 3 : 2;
  const rows = Math.ceil(n / cols);
  const cardH = rows === 2 ? 178 : n === 3 ? 300 : 240;
  const letters = ["A", "B", "C", "D"];
  const R = 96;
  const C = 2 * Math.PI * R;
  return (
    <div style={{ width: 1580, height: 560, display: "flex", alignItems: "center", gap: 60 }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26 }}>
        {visible.map((item, index) => {
          const isRight = index === right;
          const hot = index === active;
          const lit = isRight ? r : 0;
          return (
            <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9) }}>
              <div
                style={{
                  position: "relative",
                  height: cardH,
                  borderRadius: 26,
                  display: "flex",
                  flexDirection: n === 3 ? "column" : "row",
                  alignItems: n === 3 ? "flex-start" : "center",
                  justifyContent: n === 3 ? "space-between" : "flex-start",
                  gap: 26,
                  padding: n === 3 ? "34px 32px" : "0 34px",
                  overflow: "hidden",
                  background: lit > 0.5 ? c.accent : hot && r === 0 ? "#FFFFFF" : c.card,
                  border: `3px solid ${lit > 0.5 || (hot && r === 0) ? c.accent : c.border}`,
                  boxShadow: lit > 0.5 ? "0 26px 60px rgba(205,172,59,0.40)" : hot ? "0 16px 40px rgba(2,1,129,0.14)" : "none",
                  opacity: isRight ? 1 : 1 - 0.3 * r,
                  transform: `scale(${1 + 0.035 * lit})`,
                }}
              >
                <ActiveSheen active={lit > 0.5} dark />
                {lit > 0.5 ? (
                  <div style={{ position: "absolute", right: 20, top: 20, transform: `scale(${lit})` }}>
                    <IconDisc name="check" size={52} fill={c.navy} color="#FFFFFF" />
                  </div>
                ) : null}
                <div style={{ width: 66, height: 66, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, background: lit > 0.5 ? c.navy : hot && r === 0 ? c.accent : c.cardSoft, color: lit > 0.5 ? "#FFFFFF" : c.navy, border: lit > 0.5 || (hot && r === 0) ? "none" : `2px solid ${c.border}` }}>
                  <span style={{ color: lit > 0.5 ? "#FFFFFF" : dark && !(hot && r === 0) ? "#FFFFFF" : c.navy }}>{letters[index]}</span>
                </div>
                <div style={{ color: lit > 0.5 || (hot && r === 0) ? c.navy : c.text, fontSize: n === 3 ? 34 : 32, fontWeight: 850, lineHeight: 1.18 }}>{item}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div style={{ position: "relative", width: 2 * R + 40, height: 2 * R + 40 }}>
          <svg width={2 * R + 40} height={2 * R + 40} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx={R + 20} cy={R + 20} r={R} fill={r > 0 ? c.accent : dark ? "rgba(255,255,255,0.06)" : "#FFFFFF"} stroke={c.border} strokeWidth={16} />
            <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke={r > 0 ? c.navy : c.accent} strokeWidth={16} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={r > 0 ? 0 : C * clock} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: 1 - r, color: c.text, fontSize: 110, fontWeight: 900 }}>?</div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: r, transform: `scale(${0.6 + 0.4 * r})`, color: c.navy, fontSize: 104, fontWeight: 900 }}>{letters[right]}</div>
        </div>
        <div style={{ color: c.muted, fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", opacity: 1 - r, height: 30 }}>Think first</div>
      </div>
    </div>
  );
}

/* 26 ─ True or false: each statement waits with both pills; the spoken verdict stamps one of them */
export function TrueFalse({ items, dark, itemStartSeconds, revealStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 3);
  const n = visible.length;
  const rf = revealFrame(fps, n, itemStartSeconds, revealStartSeconds);
  const r = frame >= rf ? clamp01(grow(frame, fps, rf)) : 0;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const rowH = n === 1 ? 260 : n === 2 ? 190 : 150;
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", gap: 26 }}>
      {visible.map((item, index) => {
        const [statement, verdict = "True"] = parts(item);
        const isTrue = /^(t|yes|correct|right)/i.test(verdict);
        const hot = index === active && r === 0;
        const pill = (label: string, chosen: boolean) => {
          const fade = chosen ? 1 : 1 - 0.4 * r;
          const on = chosen && r > 0.5;
          return (
            <div
              style={{
                position: "relative",
                width: 172,
                height: 72,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 2.5,
                opacity: fade,
                background: on ? (label === "TRUE" ? c.accent : dark ? "#FFFFFF" : c.navy) : "transparent",
                color: on ? (label === "TRUE" || dark ? c.navy : "#FFFFFF") : c.text,
                border: `3px solid ${on ? (label === "TRUE" ? c.accent : dark ? "#FFFFFF" : c.navy) : c.border}`,
                transform: on ? `scale(${1 + 0.18 * (1 - r) + 0.08}) rotate(${-5 * r}deg)` : "none",
                boxShadow: on ? "0 14px 30px rgba(2,1,129,0.25)" : "none",
              }}
            >
              {on ? <Icon name={label === "TRUE" ? "check" : "cross"} size={28} color={label === "TRUE" || dark ? c.navy : "#FFFFFF"} stroke={3.2} /> : null}
              {label}
              {!chosen && r > 0 ? <div style={{ position: "absolute", left: 30, right: 30, top: "50%", height: 3, borderRadius: 2, background: c.text, transformOrigin: "left center", transform: `scaleX(${r})` }} /> : null}
            </div>
          );
        };
        return (
          <div
            key={item}
            style={{
              ...itemMotion(frame, fps, index, itemStartSeconds, 9),
              position: "relative",
              height: rowH,
              borderRadius: 28,
              display: "flex",
              alignItems: "center",
              gap: 34,
              padding: "0 40px",
              overflow: "hidden",
              background: hot ? "#FFFFFF" : c.card,
              border: `2px solid ${hot || r > 0.5 ? c.accent : c.border}`,
              boxShadow: hot ? "0 18px 44px rgba(2,1,129,0.16)" : "none",
            }}
          >
            <ActiveSheen active={hot} dark={false} />
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 10, background: r > 0.5 ? (isTrue ? c.accent : dark ? "#FFFFFF" : c.navy) : c.border }} />
            <svg width={n === 1 ? 64 : 50} height={n === 1 ? 54 : 42} viewBox="0 0 150 124" style={{ flexShrink: 0 }}>
              <path d="M 8 120 L 8 70 C 8 30 30 8 64 4 L 64 28 C 44 34 36 46 36 62 L 64 62 L 64 120 Z M 86 120 L 86 70 C 86 30 108 8 142 4 L 142 28 C 122 34 114 46 114 62 L 142 62 L 142 120 Z" fill={c.accent} />
            </svg>
            <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: n === 1 ? 44 : n === 2 ? 36 : 32, fontWeight: 800, lineHeight: 1.2 }}>{statement}</div>
            <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
              {pill("TRUE", isTrue)}
              {pill("FALSE", !isTrue)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function tipStyle(label: string): { icon: IconName; warn: boolean } {
  const l = label.toLowerCase();
  if (/warn|caution|careful|avoid|danger/.test(l)) return { icon: "alert", warn: true };
  if (/remember|key|important/.test(l)) return { icon: "bookmark", warn: false };
  if (/note|info|did you know/.test(l)) return { icon: "info", warn: false };
  return { icon: "bulb", warn: false };
}

/* 27 ─ Tip callout: a framed tip / reminder / note / warning (joiner = the label) */
export function TipCallout({ items, dark, itemStartSeconds, joiner }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 2);
  const label = joiner ?? "Tip";
  const { icon, warn } = tipStyle(label);
  const g = clamp01(grow(frame, fps, 0));
  const pulse = 1 + Math.sin(frame / 9) * 0.04;
  const panelBg = warn ? `linear-gradient(160deg, #E4C862, ${c.accent})` : `linear-gradient(160deg, ${theme.colors.mid}, ${c.navy} 60%, ${theme.colors.deep})`;
  return (
    <div style={{ width: 1440, height: 420, display: "flex", borderRadius: 36, overflow: "hidden", background: dark ? "rgba(255,255,255,0.08)" : "#FFFFFF", boxShadow: dark ? "none" : "0 28px 70px rgba(2,1,129,0.16)", border: dark ? "2px solid rgba(255,255,255,0.16)" : "none", opacity: g, transform: `scale(${0.96 + 0.04 * g})` }}>
      <div style={{ width: 330, flexShrink: 0, background: panelBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, position: "relative" }}>
        <div style={{ position: "absolute", left: -60, top: -60, width: 200, height: 200, borderRadius: "50%", border: `26px solid ${warn ? "rgba(2,1,129,0.08)" : "rgba(255,255,255,0.06)"}` }} />
        <div style={{ transform: `scale(${pulse})` }}>
          <IconDisc name={icon} size={150} fill={warn ? c.navy : c.accent} color={warn ? c.accent : c.navy} ring={warn ? "rgba(2,1,129,0.12)" : "rgba(205,172,59,0.25)"} />
        </div>
        <div style={{ color: warn ? c.navy : "#FFFFFF", fontSize: 30, fontWeight: 900, letterSpacing: 5, textTransform: "uppercase", textAlign: "center", padding: "0 20px" }}>{label}</div>
      </div>
      <div style={{ position: "relative", flex: 1, padding: "0 72px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 34 }}>
        <div style={{ position: "absolute", inset: 18, borderRadius: 24, border: `2px dashed ${dark ? "rgba(205,172,59,0.45)" : "rgba(205,172,59,0.6)"}` }} />
        <div style={{ position: "absolute", right: 0, top: 0, width: 0, height: 0, borderLeft: "64px solid transparent", borderTop: `64px solid ${c.accent}` }} />
        {visible.map((item, index) => (
          <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), display: "flex", gap: 26, alignItems: "flex-start" }}>
            <div style={{ width: 10, alignSelf: "stretch", borderRadius: 5, background: c.accent, flexShrink: 0 }} />
            <div style={{ color: c.text, fontSize: visible.length === 1 ? 46 : 38, fontWeight: 800, lineHeight: 1.25 }}>{item}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCENARIO_LABELS: Record<number, string[]> = {
  2: ["Problem", "Solution"],
  3: ["Situation", "Challenge", "Resolution"],
  4: ["Situation", "Challenge", "Action", "Result"],
};

function scenarioIcon(label: string, index: number, n: number): IconName {
  const l = label.toLowerCase();
  if (/situation|context|setting|background/.test(l)) return "pin";
  if (/challenge|problem|issue|conflict/.test(l)) return "bolt";
  if (/action|approach|step|response|try/.test(l)) return "pencil";
  if (/resolution|result|solution|outcome|lesson/.test(l)) return "flag";
  return index === n - 1 ? "flag" : "star";
}

/* 28 ─ Scenario: a short case told in panels — situation → challenge → resolution */
export function ScenarioCard({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 4);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const arrowW = 64;
  const W = 1560;
  const panelW = (W - arrowW * (n - 1)) / n;
  const defaults = SCENARIO_LABELS[n] ?? SCENARIO_LABELS[3];
  return (
    <div style={{ width: W, height: 420, display: "flex", alignItems: "center" }}>
      {visible.map((item, index) => {
        const [a, b] = parts(item);
        const label = b ? a : defaults[index] ?? `Part ${index + 1}`;
        const text = b ?? a;
        const hot = index === active;
        const last = index === n - 1;
        const solid = last && shownAt(frame, fps, index, itemStartSeconds);
        const fill = solid ? (dark ? "#FFFFFF" : c.navy) : hot ? "#FFFFFF" : c.card;
        const ink = solid ? (dark ? c.navy : "#FFFFFF") : hot ? c.navy : c.text;
        const arrow = index < n - 1 ? landed(frame, fps, index + 1, itemStartSeconds) : 0;
        return (
          <React.Fragment key={item}>
            <div
              style={{
                ...itemMotion(frame, fps, index, itemStartSeconds, 9),
                position: "relative",
                width: panelW,
                height: 330,
                borderRadius: 30,
                padding: "40px 34px",
                display: "flex",
                flexDirection: "column",
                gap: 22,
                overflow: "hidden",
                background: fill,
                border: `2px solid ${hot || solid ? c.accent : c.border}`,
                boxShadow: hot ? "0 26px 56px rgba(2,1,129,0.20)" : "none",
              }}
            >
              <ActiveSheen active={hot} dark={solid ? !dark : false} />
              <div style={{ position: "absolute", right: -30, top: -30, width: 130, height: 130, borderRadius: "50%", background: c.accent, opacity: hot ? 0.2 : 0.08 }} />
              <IconDisc name={scenarioIcon(label, index, n)} size={82} fill={hot || solid ? c.accent : dark ? "rgba(255,255,255,0.12)" : c.cardSoft} color={hot || solid ? c.navy : dark ? "#FFFFFF" : c.navy} />
              <div style={{ color: solid ? (dark ? theme.colors.inkDim : c.accent) : hot ? c.navy : c.muted, fontSize: 23, fontWeight: 900, letterSpacing: 3.5, textTransform: "uppercase" }}>{label}</div>
              <div style={{ color: ink, fontSize: n === 4 ? 29 : 33, fontWeight: 800, lineHeight: 1.22 }}>{text}</div>
            </div>
            {index < n - 1 ? (
              <svg width={arrowW} height={60} viewBox="0 0 64 60" style={{ flexShrink: 0 }}>
                <path d="M 10 30 L 50 30 M 36 16 L 50 30 L 36 44" fill="none" stroke={arrow > 0 ? c.accent : c.border} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={arrow > 0 ? 1 - arrow : 0} />
              </svg>
            ) : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* 29 ─ Worked example: a worksheet where each step is written out with its result */
export function WorkedExample({ items, dark, itemStartSeconds, center }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 6);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const area = center ? 440 : 540;
  const rowH = Math.min(100, (area - (n - 1) * 10) / n);
  const font = rowH >= 90 ? 32 : rowH >= 76 ? 29 : 27;
  const band = clamp01(grow(frame, fps, 0));
  return (
    <div style={{ width: 1560, display: "flex", flexDirection: "column", gap: 22 }}>
      {center ? (
        <div style={{ height: 100, borderRadius: 26, display: "flex", alignItems: "center", gap: 28, padding: "0 34px", background: dark ? "rgba(255,255,255,0.10)" : `linear-gradient(120deg, ${theme.colors.mid}, ${c.navy})`, border: dark ? `2px solid ${c.accent}` : "none", opacity: band, transform: `translateY(${(1 - band) * -16}px)` }}>
          <div style={{ padding: "10px 22px", borderRadius: 999, background: c.accent, color: c.navy, fontSize: 22, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", flexShrink: 0 }}>Example</div>
          <div style={{ color: "#FFFFFF", fontSize: 34, fontWeight: 800, lineHeight: 1.15 }}>{center}</div>
        </div>
      ) : null}
      <div style={{ position: "relative", borderRadius: 30, padding: "22px 34px", background: dark ? "rgba(255,255,255,0.06)" : "#FFFFFF", border: `2px solid ${c.border}`, boxShadow: dark ? "none" : "0 20px 50px rgba(2,1,129,0.10)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ position: "absolute", left: 118, top: 0, bottom: 0, width: 2, background: dark ? "rgba(205,172,59,0.35)" : "rgba(205,172,59,0.45)" }} />
        {visible.map((item, index) => {
          const [step, result] = parts(item);
          const hot = index === active;
          const last = index === n - 1;
          const write = landed(frame, fps, index, itemStartSeconds);
          return (
            <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), position: "relative", height: rowH, display: "flex", alignItems: "center", gap: 40, margin: "0 -18px", padding: "0 18px", borderRadius: 16, background: hot ? (dark ? "rgba(205,172,59,0.16)" : "rgba(205,172,59,0.12)") : "transparent", borderBottom: last || hot ? "none" : `2px dashed ${c.border}` }}>
              {hot ? <div style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 7, borderRadius: 4, background: c.accent, opacity: write }} /> : null}
              <div style={{ width: 56, height: 56, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900, background: hot ? c.accent : dark ? "rgba(255,255,255,0.12)" : c.cardSoft, color: hot || !dark ? c.navy : "#FFFFFF" }}>{index + 1}</div>
              <div style={{ flex: 1, color: c.text, fontSize: font, fontWeight: hot ? 850 : 750, lineHeight: 1.15 }}>{step}</div>
              {result ? (
                <div style={{ minWidth: 200, padding: "12px 26px", borderRadius: 16, textAlign: "center", fontSize: font, fontWeight: 900, fontVariantNumeric: "tabular-nums", background: last ? c.accent : dark ? "rgba(255,255,255,0.12)" : c.cardSoft, color: last || !dark ? c.navy : "#FFFFFF", border: last ? "none" : `2px solid ${c.border}`, boxShadow: last ? "0 12px 28px rgba(205,172,59,0.35)" : "none" }}>
                  {result}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 30 ─ Analogy: the new idea (left) is like a familiar one (right); matching parts line up in rows */
export function Analogy({ items, dark, itemStartSeconds, leftLabel, rightLabel, joiner }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 3);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const colW = 610;
  const midW = 220;
  const rowH = n === 1 ? 150 : n === 2 ? 120 : 100;
  const head = clamp01(grow(frame, fps, 0));
  const pulse = 1 + Math.sin(frame / 10) * 0.03;
  return (
    <div style={{ width: colW * 2 + midW, display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", alignItems: "center", opacity: head }}>
        <div style={{ width: colW, height: 130, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 30px", background: dark ? "#FFFFFF" : `linear-gradient(140deg, ${theme.colors.mid}, ${c.navy})`, color: dark ? c.navy : "#FFFFFF", fontSize: 40, fontWeight: 900, lineHeight: 1.1, transform: `translateX(${(1 - head) * -40}px)` }}>{leftLabel}</div>
        <div style={{ width: midW, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ width: 112, height: 112, borderRadius: "50%", background: c.accent, display: "flex", alignItems: "center", justifyContent: "center", color: c.navy, fontSize: 72, fontWeight: 900, lineHeight: 1, transform: `scale(${pulse})`, boxShadow: `0 0 0 10px ${dark ? "rgba(205,172,59,0.18)" : "rgba(205,172,59,0.22)"}` }}>≈</div>
          <div style={{ color: c.text, fontSize: 24, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{joiner ?? "is like"}</div>
        </div>
        <div style={{ width: colW, height: 130, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 30px", background: `linear-gradient(140deg, #E4C862, ${c.accent})`, color: c.navy, fontSize: 40, fontWeight: 900, lineHeight: 1.1, transform: `translateX(${(1 - head) * 40}px)` }}>{rightLabel}</div>
      </div>
      {visible.map((item, index) => {
        const [a, b = ""] = parts(item);
        const hot = index === active;
        const link = landed(frame, fps, index, itemStartSeconds);
        const card = (text: string, side: "left" | "right") => (
          <div style={{ position: "relative", width: colW, height: rowH, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, borderLeft: side === "left" ? `10px solid ${dark ? "#FFFFFF" : c.navy}` : undefined, borderRight: side === "right" ? `10px solid ${c.accent}` : undefined, color: hot ? c.navy : c.text, fontSize: n === 1 ? 38 : 32, fontWeight: 800, lineHeight: 1.18, boxShadow: hot ? "0 16px 36px rgba(2,1,129,0.14)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            {text}
          </div>
        );
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, index, itemStartSeconds, 9), display: "flex", alignItems: "center" }}>
            {card(a, "left")}
            <svg width={midW} height={40} viewBox={`0 0 ${midW} 40`}>
              <line x1={14} y1={20} x2={midW - 14} y2={20} stroke={c.border} strokeWidth={4} strokeDasharray="4 10" strokeLinecap="round" />
              <line x1={14} y1={20} x2={14 + (midW - 28) * link} y2={20} stroke={c.accent} strokeWidth={5} strokeLinecap="round" />
              <circle cx={14} cy={20} r={9} fill={dark ? "#FFFFFF" : c.navy} />
              <circle cx={midW - 14} cy={20} r={9} fill={link > 0.95 ? c.accent : c.border} />
            </svg>
            {card(b, "right")}
          </div>
        );
      })}
    </div>
  );
}
