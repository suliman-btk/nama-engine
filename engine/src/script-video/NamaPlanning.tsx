import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { useTheme } from "../course/CourseContext";
import { ActiveSheen, activeIndex, itemMotion, usePalette } from "./NamaDiagrams";
import { Icon, IconDisc, clamp01, grow, landed, parts, shownAt } from "./NamaKit";
import type { IconName, LessonProps } from "./NamaKit";

/*
 * Planning and perspective designs.
 *   swimlanes        – who does what: "Role|task" placed in each role's lane, in spoken order
 *   kanban           – work by status: "Column|card" in To do / Doing / Done (or columns)
 *   gantt            – a schedule: "Task|start|end" bars on a week (or unit) grid
 *   week-plan        – "Day|activity" calendar pages
 *   time-wheel       – "Part|minutes": how an hour (or the spoken total) is shared
 *   then-now-next    – past, present and future of one idea
 *   head-heart-hands – what learners know, feel and do
 *   compass          – four guiding directions; the needle turns to each one spoken
 */

type P = LessonProps;

/* 74 ─ Swimlanes: one lane per role; each task appears in its lane, linked to the one before */
export function Swimlanes({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 6).map((item) => parts(item));
  const roles: string[] = [];
  visible.forEach(([role]) => !roles.includes(role) && roles.push(role));
  const lanes = roles.slice(0, 3);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1560;
  const H = 580;
  const head = 250;
  const laneGap = 14;
  const laneH = (H - laneGap * (lanes.length - 1)) / lanes.length;
  const colW = (W - head - 20) / n;
  const cardW = Math.min(250, colW - 34);
  const cardH = Math.min(110, laneH - 30);
  const pos = (i: number) => {
    const lane = Math.max(0, lanes.indexOf(visible[i][0]));
    return { x: head + 20 + colW * i + colW / 2, y: lane * (laneH + laneGap) + laneH / 2 };
  };
  const ink = dark ? "rgba(255,255,255,0.75)" : c.navy;
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {lanes.map((role, k) => (
        <div key={role} style={{ position: "absolute", left: 0, right: 0, top: k * (laneH + laneGap), height: laneH, borderRadius: 24, background: k % 2 ? c.cardSoft : dark ? "rgba(255,255,255,0.05)" : "#FFFFFF", border: `2px solid ${c.border}`, opacity: clamp01(grow(frame, fps, 2 + k * 4)) }}>
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: head, borderRadius: "22px 0 0 22px", display: "flex", alignItems: "center", gap: 16, padding: "0 24px", background: dark ? "rgba(255,255,255,0.12)" : c.navy }}>
            <Icon name="users" size={40} color={c.accent} stroke={2.4} />
            <div style={{ color: "#FFFFFF", fontSize: 27, fontWeight: 900, lineHeight: 1.1 }}>{role}</div>
          </div>
        </div>
      ))}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {visible.slice(1).map((_, k) => {
          const a = pos(k);
          const b = pos(k + 1);
          const g = landed(frame, fps, k + 1, itemStartSeconds);
          const x0 = a.x + cardW / 2;
          const x1 = b.x - cardW / 2 - 6;
          const mx = (x0 + x1) / 2;
          const d = `M ${x0} ${a.y} L ${mx} ${a.y} L ${mx} ${b.y} L ${x1} ${b.y}`;
          return (
            <g key={k}>
              <path d={d} fill="none" stroke={ink} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - g} strokeLinejoin="round" />
              {g > 0.9 ? <path d={`M ${x1 - 12} ${b.y - 9} L ${x1} ${b.y} L ${x1 - 12} ${b.y + 9}`} fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /> : null}
            </g>
          );
        })}
      </svg>
      {visible.map(([, task = ""], i) => {
        const { x, y } = pos(i);
        const hot = i === active;
        return (
          <div key={`${i}-${task}`} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: x - cardW / 2, top: y - cardH / 2, width: cardW, height: cardH, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 16px", overflow: "hidden", background: hot ? c.accent : dark ? c.bg : "#FFFFFF", border: `2px solid ${hot ? c.accent : dark ? "rgba(255,255,255,0.35)" : c.navy}`, color: hot ? c.navy : c.text, fontSize: 25, fontWeight: 850, lineHeight: 1.15, boxShadow: hot ? "0 14px 30px rgba(205,172,59,0.4)" : "none" }}>
            <ActiveSheen active={hot} dark />
            {task}
          </div>
        );
      })}
    </div>
  );
}

const KANBAN_ICONS: IconName[] = ["list", "clock", "check"];

/* 75 ─ Kanban: cards land in To do / Doing / Done (or the given columns) as each is named */
export function Kanban({ items, dark, itemStartSeconds, columns }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const cols = (columns ?? ["To do", "Doing", "Done"]).slice(0, 4);
  const active = activeIndex(frame, fps, items.length, itemStartSeconds);
  const placed = items.map((item, index) => {
    const [col, text = ""] = parts(item);
    return { col: Math.max(0, cols.findIndex((x) => x.toLowerCase() === col.toLowerCase())), text, index };
  });
  const most = Math.max(1, ...cols.map((_, k) => Math.min(4, placed.filter((p) => p.col === k).length)));
  return (
    <div style={{ width: 1560, height: 128 + most * 104, display: "flex", gap: 24 }}>
      {cols.map((name, k) => {
        const mine = placed.filter((p) => p.col === k).slice(0, 4);
        const done = k === cols.length - 1;
        const doing = !done && k > 0;
        const enter = clamp01(grow(frame, fps, 2 + k * 4));
        const count = mine.filter((p) => shownAt(frame, fps, p.index, itemStartSeconds)).length;
        return (
          <div key={name} style={{ flex: 1, borderRadius: 28, padding: 20, display: "flex", flexDirection: "column", gap: 14, background: dark ? "rgba(255,255,255,0.06)" : "#E9E9F5", border: `2px solid ${c.border}`, opacity: enter }}>
            <div style={{ height: 70, borderRadius: 18, display: "flex", alignItems: "center", gap: 14, padding: "0 18px", background: done ? c.accent : doing ? "#FFFFFF" : dark ? "rgba(255,255,255,0.14)" : c.navy, border: doing ? `3px solid ${c.accent}` : "3px solid transparent" }}>
              <Icon name={KANBAN_ICONS[Math.min(2, Math.round((k / Math.max(1, cols.length - 1)) * 2))]} size={34} color={done || doing ? c.navy : c.accent} stroke={2.6} />
              <div style={{ flex: 1, color: done || doing ? c.navy : "#FFFFFF", fontSize: 25, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase" }}>{name}</div>
              <div style={{ minWidth: 40, height: 40, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", background: done || doing ? c.navy : "rgba(255,255,255,0.18)", color: done || doing ? c.accent : "#FFFFFF", fontSize: 22, fontWeight: 900 }}>{count}</div>
            </div>
            {mine.map((p) => {
              const hot = p.index === active;
              return (
                <div key={p.index} style={{ ...itemMotion(frame, fps, p.index, itemStartSeconds, 9), position: "relative", minHeight: 88, borderRadius: 18, display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", overflow: "hidden", background: hot ? "#FFFFFF" : dark ? "rgba(255,255,255,0.12)" : "#FFFFFF", border: `2px solid ${hot ? c.accent : "transparent"}`, borderLeft: `8px solid ${done ? c.accent : dark ? "rgba(255,255,255,0.5)" : c.navy}`, boxShadow: hot ? "0 16px 36px rgba(2,1,129,0.2)" : "0 4px 10px rgba(2,1,129,0.06)" }}>
                  <ActiveSheen active={hot} dark={false} />
                  <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: 27, fontWeight: 800, lineHeight: 1.15 }}>{p.text}</div>
                  {done ? <Icon name="check" size={30} color={c.accent} stroke={3.4} /> : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* 76 ─ Gantt: "Task|start|end" bars grow across the week grid as each task is named */
export function Gantt({ items, dark, itemStartSeconds, unit }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const rows = items.slice(0, 6).map((item) => {
    const [task, a = "1", b = "1"] = parts(item);
    return { task, start: Number(a) || 1, end: Number(b) || Number(a) || 1 };
  });
  const n = rows.length;
  const span = Math.min(12, Math.max(...rows.map((r) => r.end)));
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const W = 1560;
  const label = 380;
  const colW = (W - label) / span;
  const rowH = n <= 3 ? 108 : n === 4 ? 96 : 82;
  const head = clamp01(grow(frame, fps, 0));
  const word = unit ?? "Week";
  return (
    <div style={{ position: "relative", width: W }}>
      <div style={{ display: "flex", height: 64, marginLeft: label, opacity: head }}>
        {Array.from({ length: span }, (_, k) => (
          <div key={k} style={{ width: colW, display: "flex", alignItems: "center", justifyContent: "center", color: c.muted, fontSize: span > 8 ? 21 : 23, fontWeight: 800, borderLeft: `2px solid ${c.border}` }}>{span > 6 ? k + 1 : `${word} ${k + 1}`}</div>
        ))}
      </div>
      {rows.map((r, i) => {
        const g = landed(frame, fps, i, itemStartSeconds);
        const hot = i === active;
        return (
          <div key={`${r.task}-${i}`} style={{ position: "relative", height: rowH, display: "flex", alignItems: "center", borderTop: `2px solid ${c.border}` }}>
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), width: label, paddingRight: 24, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: hot ? c.accent : dark ? "#FFFFFF" : c.navy, flexShrink: 0 }} />
              <div style={{ color: c.text, fontSize: n > 4 ? 26 : 29, fontWeight: hot ? 900 : 800, lineHeight: 1.12 }}>{r.task}</div>
            </div>
            {Array.from({ length: span }, (_, k) => <div key={k} style={{ position: "absolute", left: label + colW * k, top: 0, bottom: 0, width: 2, background: c.border, opacity: 0.6 }} />)}
            <div style={{ position: "absolute", left: label + colW * (r.start - 1) + 8, top: rowH / 2 - 26, height: 52, width: Math.max(0, (colW * (r.end - r.start + 1) - 16) * g), borderRadius: 14, background: hot ? `linear-gradient(90deg, ${c.accent}, #E4C862)` : dark ? "linear-gradient(90deg, #FFFFFF, rgba(255,255,255,0.75))" : `linear-gradient(90deg, ${c.navy}, #3434A8)`, boxShadow: hot ? "0 10px 26px rgba(205,172,59,0.45)" : "none" }} />
          </div>
        );
      })}
    </div>
  );
}

/* 77 ─ Week plan: "Day|activity" pages torn from a calendar, one per spoken day */
export function WeekPlan({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 5);
  const n = visible.length;
  const active = activeIndex(frame, fps, n, itemStartSeconds);
  const gap = 26;
  const cardW = Math.min(320, (1560 - gap * (n - 1)) / n);
  return (
    <div style={{ width: 1560, display: "flex", justifyContent: "center", gap }}>
      {visible.map((item, i) => {
        const [day, task = ""] = parts(item);
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", width: cardW, height: 420, borderRadius: 26, overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 26px 56px rgba(2,1,129,0.22)" : "0 10px 24px rgba(2,1,129,0.06)", transform: `translateY(${hot ? -12 : 0}px)` }}>
            <div style={{ position: "relative", height: 130, background: hot ? c.accent : dark ? "rgba(255,255,255,0.16)" : `linear-gradient(140deg, ${theme.colors.mid}, ${c.navy})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {[0.3, 0.7].map((f) => <div key={f} style={{ position: "absolute", top: -12, left: `${f * 100}%`, width: 20, height: 34, marginLeft: -10, borderRadius: 10, background: dark ? c.bg : "#FFFFFF", border: `3px solid ${c.border}` }} />)}
              <Icon name="calendar" size={34} color={hot ? c.navy : c.accent} stroke={2.4} />
              <div style={{ color: hot ? c.navy : "#FFFFFF", fontSize: 30, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{day}</div>
            </div>
            <div style={{ height: 290, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, padding: "0 26px", backgroundImage: `repeating-linear-gradient(180deg, transparent 0 56px, ${hot ? "rgba(2,1,129,0.12)" : c.border} 56px 58px)` }}>
              <div style={{ color: hot ? c.navy : c.text, fontSize: n === 5 ? 28 : 31, fontWeight: 850, lineHeight: 1.2, textAlign: "center" }}>{task}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 78 ─ Time wheel: "Part|minutes" slices fill a clock face in the order spoken */
export function TimeWheel({ items, dark, itemStartSeconds, unit }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const rows = items.slice(0, 5).map((item) => {
    const [label, m = "0"] = parts(item);
    return { label, mins: Number(m.replace(/[^\d.]/g, "")) || 0 };
  });
  const total = rows.reduce((s, r) => s + r.mins, 0);
  const whole = total <= 60 ? 60 : total;
  const active = activeIndex(frame, fps, rows.length, itemStartSeconds);
  const colors = dark ? ["#FFFFFF", c.accent, "#9C9CF0", "#E4C862", "#C9C9F5"] : [c.navy, c.accent, "#5656C4", "#E4C862", "#9C9CF0"];
  const cx = 300;
  const cy = 300;
  const R = 230;
  const C = 2 * Math.PI * R;
  let start = 0;
  const enter = clamp01(grow(frame, fps, 0));
  const word = unit ?? "min";
  return (
    <div style={{ width: 1560, display: "flex", alignItems: "center", gap: 70 }}>
      <svg width={600} height={600} style={{ flexShrink: 0, opacity: enter }}>
        <circle cx={cx} cy={cy} r={R + 46} fill={dark ? "rgba(255,255,255,0.06)" : "#FFFFFF"} stroke={c.border} strokeWidth={3} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={dark ? "rgba(255,255,255,0.10)" : c.cardSoft} strokeWidth={80} />
        {rows.map((r, i) => {
          const share = r.mins / whole;
          const g = landed(frame, fps, i, itemStartSeconds);
          const off = start;
          start += share;
          return <circle key={i} cx={cx} cy={cy} r={R} fill="none" stroke={colors[i]} strokeWidth={i === active ? 92 : 80} strokeDasharray={`${C * share * g} ${C}`} strokeDashoffset={-C * off} transform={`rotate(-90 ${cx} ${cy})`} />;
        })}
        {Array.from({ length: 12 }, (_, k) => {
          const a = (k / 12) * Math.PI * 2;
          return <line key={k} x1={cx + Math.sin(a) * (R + 30)} y1={cy - Math.cos(a) * (R + 30)} x2={cx + Math.sin(a) * (R + 42)} y2={cy - Math.cos(a) * (R + 42)} stroke={c.muted} strokeWidth={k % 3 ? 3 : 6} strokeLinecap="round" />;
        })}
        <circle cx={cx} cy={cy} r={120} fill={dark ? c.bg : "#FFFFFF"} />
        <g transform={`translate(${cx - 44} ${cy - 44})`}>
          <svg width={88} height={88} viewBox="0 0 24 24" fill="none" stroke={dark ? "#FFFFFF" : c.navy} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
            <path d="M12 7v5.2l3.3 2" stroke={c.accent} />
          </svg>
        </g>
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((r, i) => {
          const hot = i === active;
          return (
            <div key={`${r.label}-${i}`} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", height: rows.length === 5 ? 86 : 100, borderRadius: 22, display: "flex", alignItems: "center", gap: 22, padding: "0 30px", overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 16px 36px rgba(2,1,129,0.16)" : "none" }}>
              <ActiveSheen active={hot} dark={false} />
              <div style={{ width: 30, height: 30, borderRadius: 8, background: colors[i], border: `2px solid ${c.border}`, flexShrink: 0 }} />
              <div style={{ flex: 1, color: hot ? c.navy : c.text, fontSize: 30, fontWeight: 800 }}>{r.label}</div>
              <div style={{ color: hot ? c.navy : c.text, fontSize: 34, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{r.mins} <span style={{ fontSize: 22 }}>{word}</span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TNN: { label: string; icon: IconName; size: number }[] = [
  { label: "Then", icon: "clock", size: 210 },
  { label: "Now", icon: "pin", size: 270 },
  { label: "Next", icon: "rocket", size: 230 },
];

/* 79 ─ Then, now, next: one idea seen in the past, the present and the future, along a time arrow */
export function ThenNowNext({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 3);
  const active = activeIndex(frame, fps, visible.length, itemStartSeconds);
  const band = clamp01(grow(frame, fps, 0));
  const cy = 200;
  const xs = [270, 780, 1290];
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      <div style={{ position: "absolute", left: 40, top: cy - 22, height: 44, width: 1440 * band, borderRadius: 22, background: `linear-gradient(90deg, ${dark ? "rgba(255,255,255,0.18)" : "#D9D9EE"}, ${c.accent})` }} />
      <div style={{ position: "absolute", left: 40 + 1440 * band - 10, top: cy - 46, width: 0, height: 0, borderTop: "46px solid transparent", borderBottom: "46px solid transparent", borderLeft: `56px solid ${c.accent}`, opacity: band }} />
      {visible.map((item, i) => {
        const [a, b] = parts(item);
        const label = b ? a : TNN[i].label;
        const text = b ?? a;
        const g = landed(frame, fps, i, itemStartSeconds);
        const hot = i === active;
        const s = TNN[i].size;
        return (
          <React.Fragment key={item}>
            <div style={{ position: "absolute", left: xs[i] - s / 2, top: cy - s / 2, width: s, height: s, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: i === 1 ? (dark ? "#FFFFFF" : c.navy) : dark ? c.bg : "#FFFFFF", border: `8px solid ${hot ? c.accent : dark ? "rgba(255,255,255,0.35)" : c.navy}`, boxShadow: hot ? "0 0 0 14px rgba(205,172,59,0.22)" : "0 14px 34px rgba(2,1,129,0.18)", opacity: 0.35 + 0.65 * g, transform: `scale(${0.85 + 0.15 * g})` }}>
              <Icon name={TNN[i].icon} size={s * 0.42} color={i === 1 ? c.accent : dark ? "#FFFFFF" : c.navy} stroke={2} />
            </div>
            <div style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: xs[i] - 210, top: cy + 160, width: 420, textAlign: "center" }}>
              <div style={{ display: "inline-block", padding: "8px 24px", borderRadius: 999, background: hot ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, color: hot || !dark ? c.navy : "#FFFFFF", fontSize: 24, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase", marginBottom: 16 }}>{label}</div>
              <div style={{ color: c.text, fontSize: 32, fontWeight: hot ? 900 : 750, lineHeight: 1.2 }}>{text}</div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const HHH: { label: string; verb: string; icon: IconName }[] = [
  { label: "Head", verb: "Know", icon: "head" },
  { label: "Heart", verb: "Feel", icon: "heart" },
  { label: "Hands", verb: "Do", icon: "hand" },
];

/* 80 ─ Head, heart, hands: what learners know, feel and do */
export function HeadHeartHands({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const theme = useTheme();
  const visible = items.slice(0, 3);
  const active = activeIndex(frame, fps, visible.length, itemStartSeconds);
  const discs = [dark ? "#FFFFFF" : c.navy, c.accent, dark ? "#C9C9F5" : "#3434A8"];
  const marks = [dark ? c.navy : c.accent, c.navy, dark ? c.navy : "#FFFFFF"];
  return (
    <div style={{ width: 1500, display: "flex", gap: 40 }}>
      {visible.map((item, i) => {
        const [a, b] = parts(item);
        const label = b ? a : HHH[i].label;
        const text = b ?? a;
        const hot = i === active;
        const g = landed(frame, fps, i, itemStartSeconds);
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "relative", flex: 1, height: 520, borderRadius: 34, padding: "40px 34px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 18, overflow: "hidden", background: hot ? "#FFFFFF" : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 26px 60px rgba(2,1,129,0.2)" : "none" }}>
            <ActiveSheen active={hot} dark={false} />
            <div style={{ width: 170, height: 170, borderRadius: "50%", background: discs[i], display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 ${10 + 6 * g}px ${hot ? "rgba(205,172,59,0.28)" : "rgba(2,1,129,0.06)"}`, transform: `scale(${0.9 + 0.1 * g}) rotate(${(1 - g) * -12}deg)` }}>
              <Icon name={HHH[i].icon} size={92} color={marks[i]} stroke={2} />
            </div>
            <div style={{ color: hot ? c.navy : c.text, fontSize: 40, fontWeight: 900, marginTop: 8 }}>{label}</div>
            <div style={{ padding: "6px 20px", borderRadius: 999, background: hot ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft, color: hot || !dark ? c.navy : "#FFFFFF", fontSize: 22, fontWeight: 900, letterSpacing: 4, textTransform: "uppercase" }}>{HHH[i].verb}</div>
            <div style={{ color: hot ? theme.colors.navy : c.text, fontSize: 30, fontWeight: 700, lineHeight: 1.25, marginTop: 6 }}>{text}</div>
          </div>
        );
      })}
    </div>
  );
}

/* 81 ─ Compass: four guiding directions around a compass rose; the needle turns to each one spoken */
export function Compass({ items, dark, itemStartSeconds }: P) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const c = usePalette(dark);
  const visible = items.slice(0, 4);
  const active = activeIndex(frame, fps, visible.length, itemStartSeconds);
  const cx = 780;
  const cy = 300;
  const R = 165;
  const enter = clamp01(grow(frame, fps, 0));
  // The needle eases from the previous direction to the one being spoken.
  const target = Math.max(0, active) * 90;
  const prev = Math.max(0, active - 1) * 90;
  const turn = active >= 0 ? prev + (target - prev) * landed(frame, fps, active, itemStartSeconds) : Math.sin(frame / 14) * 8;
  const ink = dark ? "#FFFFFF" : c.navy;
  const slots = [
    { left: cx - 260, top: 0, w: 520 },
    { left: cx + 250, top: cy - 50, w: 520 },
    { left: cx - 260, top: 500, w: 520 },
    { left: cx - 770, top: cy - 50, w: 520 },
  ];
  return (
    <div style={{ position: "relative", width: 1560, height: 600 }}>
      <svg width={1560} height={600} style={{ position: "absolute", inset: 0, overflow: "visible", opacity: enter }}>
        <circle cx={cx} cy={cy} r={R} fill={dark ? "rgba(255,255,255,0.06)" : "#FFFFFF"} stroke={ink} strokeWidth={6} />
        <circle cx={cx} cy={cy} r={R - 26} fill="none" stroke={c.border} strokeWidth={2} strokeDasharray="4 10" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
          const long = a % 90 === 0;
          const r1 = long ? R - 34 : R - 70;
          const rad = (a * Math.PI) / 180;
          const s = (rad + Math.PI / 2) % (Math.PI * 2);
          return <polygon key={a} points={`${cx + Math.sin(rad) * r1},${cy - Math.cos(rad) * r1} ${cx + Math.sin(s) * 18},${cy - Math.cos(s) * 18} ${cx - Math.sin(rad) * 10},${cy + Math.cos(rad) * 10} ${cx - Math.sin(s) * 18},${cy + Math.cos(s) * 18}`} fill={long ? (dark ? "rgba(255,255,255,0.35)" : "#C9C9F0") : c.border} />;
        })}
        <g transform={`rotate(${turn} ${cx} ${cy})`}>
          <polygon points={`${cx},${cy - R + 30} ${cx + 22},${cy} ${cx - 22},${cy}`} fill={c.accent} />
          <polygon points={`${cx},${cy + R - 30} ${cx + 22},${cy} ${cx - 22},${cy}`} fill={ink} />
        </g>
        <circle cx={cx} cy={cy} r={16} fill={dark ? c.bg : "#FFFFFF"} stroke={c.accent} strokeWidth={6} />
      </svg>
      {visible.map((item, i) => {
        const s = slots[i];
        const hot = i === active;
        return (
          <div key={item} style={{ ...itemMotion(frame, fps, i, itemStartSeconds, 9), position: "absolute", left: s.left, top: s.top, width: s.w, height: 100, borderRadius: 24, display: "flex", alignItems: "center", gap: 18, padding: "0 26px", overflow: "hidden", flexDirection: i === 3 ? "row-reverse" : "row", textAlign: i === 3 ? "right" : "left", background: hot ? (dark ? "#FFFFFF" : c.navy) : c.card, border: `2px solid ${hot ? c.accent : c.border}`, boxShadow: hot ? "0 18px 40px rgba(2,1,129,0.24)" : "none" }}>
            <ActiveSheen active={hot} dark={!dark} />
            <IconDisc name="compass" size={56} fill={hot ? c.accent : dark ? "rgba(255,255,255,0.14)" : c.cardSoft} color={hot || !dark ? c.navy : "#FFFFFF"} />
            <div style={{ flex: 1, color: hot ? (dark ? c.navy : "#FFFFFF") : c.text, fontSize: 29, fontWeight: 850, lineHeight: 1.15 }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
}
