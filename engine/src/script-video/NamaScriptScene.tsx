import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand, useCourseConfig, useTheme } from "../course/CourseContext";
import {
  CardConstellation,
  ComparisonPanel,
  OrbitCycle,
  ProcessFlow,
  Staircase,
  TimelineRoadmap,
} from "./NamaDiagrams";
import { BarChart, BeforeAfter, DonutChart, LayerStack, MindMap, Pyramid, Quadrant, RoadmapPath, Target, Venn } from "./NamaCharts";
import { Balance, DecisionTree, Definition, Funnel, Gears, Iceberg, Spectrum, StatTiles } from "./NamaShapes";
import type { ScriptScene } from "./schema";

function enter(frame: number, delay = 0, duration = 14) {
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  return { opacity: eased, transform: `translateY(${Math.round((1 - eased) * 22)}px)` };
}

function AmbientMotion({ dark }: { dark: boolean }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 42) * 18;
  const driftY = Math.cos(frame / 51) * 14;
  const sweep = interpolate(frame, [0, 36], [-18, 118], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: `${sweep}%`, top: 0, bottom: 0, width: 8, transform: "skewX(-12deg)", background: dark ? "rgba(255,255,255,0.07)" : "rgba(2,1,129,0.05)" }} />
      <div style={{ position: "absolute", right: -120 + driftX, bottom: 70 + driftY, width: 390, height: 390, borderRadius: "50%", border: `42px solid ${dark ? "rgba(255,255,255,0.045)" : theme.colors.plumSafe}`, transform: `rotate(${frame * 0.08}deg)` }} />
      <div style={{ position: "absolute", right: 350 - driftX * 0.4, top: 115 + driftY * 0.5, width: 18, height: 18, borderRadius: "50%", background: theme.colors.gold, opacity: 0.7 + Math.sin(frame / 12) * 0.18 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 124, height: 1, background: dark ? "rgba(255,255,255,0.06)" : "rgba(2,1,129,0.06)" }} />
    </div>
  );
}

function AnimatedHeadline({ text, dark, size = 64 }: { text: string; dark: boolean; size?: number }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  return (
    <div style={{ color: dark ? "#FFFFFF" : theme.colors.navy, fontFamily: theme.headingFamily, fontWeight: theme.headingWeight, fontSize: size, lineHeight: 1.15, maxWidth: 1450 }}>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} style={{ ...enter(frame, 5 + index * 1.7, 12), display: "inline-block", marginRight: "0.26em" }}>
          {word}
        </span>
      ))}
    </div>
  );
}

function CourseChrome({
  section,
  label,
  dark = false,
  labelOnDark = false,
}: {
  section: string;
  label: string;
  dark?: boolean;
  labelOnDark?: boolean;
}) {
  const theme = useTheme();
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 54,
          color: dark ? "#FFFFFF" : theme.colors.navy,
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 3.2,
          textTransform: "uppercase",
        }}
      >
        {section}
      </div>
      <div
        style={{
          position: "absolute",
          left: 84,
          bottom: 28,
          color: dark || labelOnDark ? "rgba(255,255,255,0.68)" : "rgba(1,0,95,0.48)",
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: 1,
        }}
      >
        {label}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 8, background: theme.colors.gold }} />
    </>
  );
}

/**
 * Opening slide. The course logo (brand.titleLogo) leads on the left; the organisation logo
 * (brand.watermarkLogo) is shown large in a coloured panel on the right; an optional partner
 * badge (brand.titleBadge) stays small at the panel's foot.
 */
function NamaTitle({ title, section, label }: { title: string; section: string; label: string }) {
  const theme = useTheme();
  const brand = useBrand();
  const frame = useCurrentFrame();
  const courseConfig = useCourseConfig();
  const courseName = courseConfig.courseName ?? courseConfig.courseId;
  const ease = (a: number, b: number) => {
    const p = interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return 1 - Math.pow(1 - p, 3);
  };
  const panel = ease(0, 20); // navy panel slides in from the right
  const logoWipe = ease(6, 30); // course logo wipes in from the left
  const nama = ease(16, 36);
  const edu = ease(34, 52);

  return (
    <AbsoluteFill style={{ background: "#FFFFFF", fontFamily: theme.bodyFamily, overflow: "hidden" }}>
      {/* Navy brand panel */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: 640,
          transform: `translateX(${(1 - panel) * 660}px)`,
          background: `linear-gradient(160deg, ${theme.colors.mid}, ${theme.colors.navy} 55%, ${theme.colors.deep})`,
          borderTopLeftRadius: 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Img
          src={staticFile(`brand/${brand.watermarkLogo ?? "nama-logo-white.png"}`)}
          style={{ width: 380, height: 380, objectFit: "contain", opacity: nama, transform: `scale(${0.85 + 0.15 * nama})`, marginTop: -170 }}
        />
        {brand.titleBadge ? (
          <div
            style={{
              position: "absolute",
              bottom: 64,
              left: 0,
              right: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              opacity: edu,
              transform: `translateY(${(1 - edu) * 16}px)`,
            }}
          >
            {brand.titleBadge.text ? (
              <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 19, fontWeight: 700, letterSpacing: 2.4, textTransform: "uppercase", textAlign: "right", lineHeight: 1.45, whiteSpace: "pre-line" }}>
                {brand.titleBadge.text}
              </div>
            ) : null}
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
              <Img src={staticFile(`brand/${brand.titleBadge.logo}`)} style={{ width: 176, height: 167, objectFit: "contain", display: "block" }} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Course logo + lesson title */}
      <div style={{ position: "absolute", left: 130, top: 215, width: 1050 }}>
        <div style={{ clipPath: `inset(0 ${(1 - logoWipe) * 100}% 0 0)` }}>
          {brand.titleLogo ? (
            <Img src={staticFile(`brand/${brand.titleLogo}`)} style={{ width: 760, height: 324, objectFit: "contain", display: "block", objectPosition: "left center" }} />
          ) : (
            <div style={{ height: 324, display: "flex", alignItems: "flex-end", color: theme.colors.navy, fontFamily: theme.headingFamily, fontSize: 120, fontWeight: 800, lineHeight: 1 }}>
              {courseName}
            </div>
          )}
        </div>
        <div style={{ width: interpolate(frame, [28, 48], [0, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), height: 5, borderRadius: 3, background: theme.colors.gold, marginTop: 48 }} />
        <div style={{ ...enter(frame, 34), color: theme.colors.gold, fontSize: 22, fontWeight: 800, letterSpacing: 4, textTransform: "uppercase", marginTop: 40 }}>
          {section}
        </div>
        <div style={{ ...enter(frame, 40, 18), color: theme.colors.navy, fontFamily: theme.headingFamily, fontSize: 76, fontWeight: theme.headingWeight, lineHeight: 1.08, marginTop: 14 }}>
          {title}
        </div>
      </div>
      <CourseChrome section="" label={label} />
    </AbsoluteFill>
  );
}

/** Mid-video section break: no course logo — the logo title is reserved for the opening. */
function SectionDivider({ title, section, label }: { title: string; section: string; label: string }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const ring = interpolate(frame, [0, 40], [0.6, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bar = interpolate(frame, [18, 40], [0, 220], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 78% 40%, ${theme.colors.mid}, ${theme.colors.navy} 55%, ${theme.colors.deep})`, fontFamily: theme.bodyFamily, overflow: "hidden" }}>
      {[520, 380, 240].map((size, i) => (
        <div key={size} style={{ position: "absolute", right: 210 - size / 2 + 120, top: 432 - size / 2, width: size, height: size, borderRadius: "50%", border: `${i === 2 ? 10 : 3}px solid ${i === 2 ? theme.colors.gold : "rgba(255,255,255,0.14)"}`, transform: `scale(${ring}) rotate(${frame * (i % 2 ? -0.15 : 0.1)}deg)`, borderStyle: i === 1 ? "dashed" : "solid" }} />
      ))}
      <div style={{ position: "absolute", left: 120, top: "50%", transform: "translateY(-50%)", maxWidth: 1100 }}>
        <div style={{ ...enter(frame, 6), color: theme.colors.gold, fontSize: 24, fontWeight: 900, letterSpacing: 5, textTransform: "uppercase", marginBottom: 26 }}>{section}</div>
        <AnimatedHeadline text={title} dark size={92} />
        <div style={{ width: bar, height: 8, borderRadius: 4, background: theme.colors.gold, marginTop: 40 }} />
      </div>
      <CourseChrome section="" label={label} dark />
    </AbsoluteFill>
  );
}

function LightStatement({ scene, label, dark }: { scene: ScriptScene; label: string; dark: boolean }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: dark ? theme.colors.deep : theme.colors.surface, fontFamily: theme.bodyFamily }}>
      <AmbientMotion dark={dark} />
      <div style={{ position: "absolute", left: 84, right: 230, top: 238 }}>
        <AnimatedHeadline text={scene.visual.title} dark={dark} size={68} />
        <div style={{ ...enter(frame, 22), marginTop: 42 }}>
          <div style={{ width: 72, height: 6, borderRadius: 3, background: theme.colors.gold }} />
        </div>
      </div>
      <CourseChrome section={scene.section} label={label} dark={dark} />
    </AbsoluteFill>
  );
}

function Checklist({ scene, label, dark }: { scene: ScriptScene; label: string; dark: boolean }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.visual.items ?? [];
  const starts = scene.visual.itemStartSeconds;
  const elapsed = frame / fps;
  const active = starts
    ? starts.reduce((latest, start, index) => elapsed >= start ? index : latest, -1)
    : Math.min(items.length - 1, Math.max(0, Math.floor((frame - 24) / 38)));
  return (
    <AbsoluteFill style={{ background: dark ? theme.colors.deep : theme.colors.surface, fontFamily: theme.bodyFamily }}>
      <AmbientMotion dark={dark} />
      <div style={{ position: "absolute", left: 84, right: 120, top: 148, bottom: 132, display: "flex", flexDirection: "column" }}>
        <div style={{ ...enter(frame, 4), color: dark ? "#FFFFFF" : theme.colors.navy, fontFamily: theme.headingFamily, fontSize: 52, fontWeight: theme.headingWeight, marginBottom: 14 }}>
          {scene.visual.title}
        </div>
        <div style={{ width: 108, height: 6, borderRadius: 4, background: theme.colors.gold, marginBottom: 20 }} />
        <div style={{ flex: 1, display: "grid", alignContent: "center", gridTemplateColumns: items.length > 3 ? "1fr 1fr" : "1fr", gap: 20 }}>
          {items.map((item, index) => (
            <div
              key={item}
              style={{
                ...(starts
                  ? {
                      opacity: index <= active ? 1 : 0.34,
                      transform: `translateY(${index <= active ? 0 : 14}px) scale(${index === active ? 1.02 : 1})`,
                    }
                  : enter(frame, 14 + index * 7)),
                display: "flex",
                alignItems: "center",
                gap: 20,
                minHeight: 140,
                padding: "24px 32px",
                background: dark ? (index === active ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.07)") : (index === active ? "#FFFFFF" : theme.colors.plumSafe),
                border: `2px solid ${index === active ? theme.colors.gold : dark ? "rgba(255,255,255,0.13)" : "rgba(2,1,129,0.06)"}`,
                borderRadius: 20,
                boxShadow: index === active ? "0 14px 34px rgba(2,1,129,0.10)" : "none",
              }}
            >
              <div style={{ color: index === active ? theme.colors.gold : dark ? "rgba(255,255,255,0.68)" : theme.colors.navy, fontWeight: 900, fontSize: 34, flexShrink: 0 }}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div style={{ color: dark ? "#FFFFFF" : theme.colors.deep, fontSize: 32, lineHeight: 1.26, fontWeight: 750 }}>{item}</div>
            </div>
          ))}
        </div>
      </div>
      <CourseChrome section={scene.section} label={label} dark={dark} />
    </AbsoluteFill>
  );
}

function BrandBeat({ scene, label, dark, closing = false }: { scene: ScriptScene; label: string; dark: boolean; closing?: boolean }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: dark ? `linear-gradient(145deg, ${theme.colors.navy}, ${theme.colors.deep})` : theme.colors.surface, fontFamily: theme.bodyFamily }}>
      <AmbientMotion dark={dark} />
      <div style={{ position: "absolute", left: 110, top: 190, right: 180 }}>
        <div style={{ ...enter(frame, 4), color: theme.colors.gold, fontSize: closing ? 22 : 116, fontWeight: 800, lineHeight: 1, marginBottom: 30 }}>
          {closing ? "KEY TAKEAWAY" : "?"}
        </div>
        <div style={{ ...enter(frame, 12, 18), color: dark ? "#FFFFFF" : theme.colors.navy, fontFamily: theme.headingFamily, fontWeight: theme.headingWeight, fontSize: closing ? 64 : 58, lineHeight: 1.18, maxWidth: 1450 }}>
          {scene.visual.title}
        </div>
        <div style={{ ...enter(frame, 30), width: 130, height: 6, borderRadius: 3, background: theme.colors.gold, marginTop: 38 }} />
      </div>
      <CourseChrome section={scene.section} label={label} dark={dark} />
    </AbsoluteFill>
  );
}

function DiagramScene({ scene, label, dark }: { scene: ScriptScene; label: string; dark: boolean }) {
  const theme = useTheme();
  const frame = useCurrentFrame();
  const items = scene.visual.items ?? [];
  const common = { items, dark, title: scene.visual.title, itemStartSeconds: scene.visual.itemStartSeconds };
  const chart = { ...common, values: scene.visual.values, unit: scene.visual.unit, center: scene.visual.center, leftLabel: scene.visual.leftLabel, rightLabel: scene.visual.rightLabel, leftCount: scene.visual.leftCount, joiner: scene.visual.joiner };
  const diagram = (() => {
    switch (scene.visual.kind) {
      case "process": return <ProcessFlow {...common} />;
      case "timeline": return <TimelineRoadmap {...common} />;
      case "cycle": return <OrbitCycle {...common} />;
      case "comparison": return <ComparisonPanel {...chart} />;
      case "staircase": return <Staircase {...common} />;
      case "bar-chart": return <BarChart {...chart} />;
      case "donut": return <DonutChart {...chart} />;
      case "pyramid": return <Pyramid {...chart} />;
      case "venn": return <Venn {...chart} />;
      case "mind-map": return <MindMap {...chart} />;
      case "target": return <Target {...chart} />;
      case "quadrant": return <Quadrant {...chart} />;
      case "roadmap-path": return <RoadmapPath {...chart} />;
      case "layer-stack": return <LayerStack {...chart} />;
      case "before-after": return <BeforeAfter {...chart} />;
      case "funnel": return <Funnel {...chart} />;
      case "spectrum": return <Spectrum {...chart} />;
      case "balance": return <Balance {...chart} />;
      case "decision-tree": return <DecisionTree {...chart} />;
      case "iceberg": return <Iceberg {...chart} />;
      case "stat-tiles": return <StatTiles {...chart} />;
      case "gears": return <Gears {...chart} />;
      case "definition": return <Definition {...chart} />;
      case "card-grid":
      default: return <CardConstellation {...common} />;
    }
  })();
  return (
    <AbsoluteFill style={{ background: dark ? theme.colors.deep : theme.colors.surface, fontFamily: theme.bodyFamily }}>
      <AmbientMotion dark={dark} />
      <div style={{ position: "absolute", left: 84, right: 100, top: 146, bottom: 132, display: "flex", flexDirection: "column" }}>
        <div style={{ ...enter(frame, 2), color: dark ? "#FFFFFF" : theme.colors.navy, fontFamily: theme.headingFamily, fontWeight: theme.headingWeight, fontSize: 58, lineHeight: 1.12, marginBottom: 16 }}>
          {scene.visual.title}
        </div>
        <div style={{ width: 110, height: 6, borderRadius: 4, background: theme.colors.gold }} />
        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 18 }}>
          {diagram}
        </div>
      </div>
      <CourseChrome section={scene.section} label={label} dark={dark} />
    </AbsoluteFill>
  );
}

/** Is the area behind the top-right NAMA logo dark in this scene's actual layout? */
export function logoAreaIsDark(scene: ScriptScene, sceneIndex: number): boolean {
  if (scene.visual.kind === "title") return true; // opening title: navy brand panel on the right; dividers: navy
  return scene.background ? scene.background === "dark" : sceneIndex > 0 && sceneIndex % 2 === 0;
}

export function NamaScriptScene({ scene, lessonLabel, sceneIndex }: { scene: ScriptScene; lessonLabel: string; sceneIndex: number }) {
  const dark = scene.background ? scene.background === "dark" : sceneIndex > 0 && sceneIndex % 2 === 0;
  const displaySection = scene.visual.kicker ?? scene.section;
  const displayScene = { ...scene, section: displaySection };
  switch (scene.visual.kind) {
    case "title":
      return sceneIndex === 0
        ? <NamaTitle title={scene.visual.title} section={displaySection} label={lessonLabel} />
        : <SectionDivider title={scene.visual.title} section={displaySection} label={lessonLabel} />;
    case "checklist":
      return <Checklist scene={displayScene} label={lessonLabel} dark={dark} />;
    case "process":
    case "timeline":
    case "cycle":
    case "comparison":
    case "card-grid":
    case "staircase":
    case "bar-chart":
    case "donut":
    case "pyramid":
    case "venn":
    case "mind-map":
    case "target":
    case "quadrant":
    case "roadmap-path":
    case "layer-stack":
    case "before-after":
    case "funnel":
    case "spectrum":
    case "balance":
    case "decision-tree":
    case "iceberg":
    case "stat-tiles":
    case "gears":
    case "definition":
      return <DiagramScene scene={displayScene} label={lessonLabel} dark={dark} />;
    case "question":
      return <BrandBeat scene={displayScene} label={lessonLabel} dark={dark} />;
    case "outro":
      return <BrandBeat scene={displayScene} label={lessonLabel} dark={dark} closing />;
    case "statement":
    default:
      return <LightStatement scene={displayScene} label={lessonLabel} dark={dark} />;
  }
}
