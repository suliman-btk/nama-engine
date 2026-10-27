import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useBrand, useCourseConfig, useTheme } from "../course/CourseContext";
import { NAMA_LOGO, type LogoPath } from "./namaLogoPaths";

/**
 * Opening and closing brand bumpers.
 *
 * `brand.bumper.style` in course-config.json chooses the animation:
 *  - "logo" (default, works for any course): the logo image grows in on white, then a circle
 *    in the course colours hands over to the lesson.
 *  - "nama-animated": made for NAMA Foundation only. The NAMA Foundation logo is the hero and assembles the way it does in the NAMA
 * brand film: navy pieces swirl in and lock into the mark, the gold accents pop in,
 * the wordmark rises letter by letter. A gold circle with a navy core then hands
 * over to the lesson. (The partner logo appears only on the opening title slide.)
 */
export const INTRO_SECONDS = 6.2; // bumper length until the screen is fully navy
export const INTRO_FADE_SECONDS = 0.5; // navy cover fades out over the first lesson slide
export const OUTRO_TAIL_SECONDS = 0.6; // last slide holds this long after the voice ends
export const OUTRO_SECONDS = 7.5;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);
const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const rand = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const NAVY = "#020181";
const [CX, CY] = NAMA_LOGO.center;
const SIZE = NAMA_LOGO.size;
const MARK = NAMA_LOGO.groups.mark.paths;
const MARK_NAVY = MARK.filter((p) => p.f === NAVY);
const MARK_GOLD = MARK.filter((p) => p.f !== NAVY);

const LOGO_PX = 760; // on-screen size of the NAMA logo (it is the hero)
const LOGO_TOP = (1080 - LOGO_PX) / 2;

function PathShape({ p }: { p: LogoPath }) {
  return <path d={p.d} transform={`translate(${p.x} ${p.y})`} fill={p.f} />;
}

/** The NAMA logo, `t` seconds after the assembly starts. */
function LogoAssembly({ t }: { t: number }) {
  const theme = useTheme();
  const settle = 1.06 - 0.06 * easeOut(clamp01(t / 2.6));

  // Navy pieces swirl in from scattered positions and lock into the mark.
  const navy = MARK_NAVY.map((p, n) => {
    const delay = 0.05 + rand(n + 1) * 0.9;
    const k = easeOut(clamp01((t - delay) / 1.1));
    const swirl = ((1 - k) * (-160 - rand(n + 7) * 60) * Math.PI) / 180;
    const radial = 1 + (1 - k) * (0.9 + rand(n + 3) * 1.1);
    const selfRot = (1 - k) * (rand(n + 11) * 320 - 160);
    const vx = (p.cx - CX) * radial;
    const vy = (p.cy - CY) * radial;
    const nx = CX + vx * Math.cos(swirl) - vy * Math.sin(swirl);
    const ny = CY + vx * Math.sin(swirl) + vy * Math.cos(swirl);
    const opacity = clamp01((t - delay) / 0.3) * (0.4 + 0.6 * k);
    return (
      <g key={`n${n}`} opacity={opacity} transform={`translate(${nx - p.cx} ${ny - p.cy}) rotate(${selfRot} ${p.cx} ${p.cy})`}>
        <PathShape p={p} />
      </g>
    );
  });

  // Gold accents pop in, from the centre outwards.
  const maxR = Math.max(...MARK_GOLD.map((p) => Math.hypot(p.cx - CX, p.cy - CY)));
  const gold = MARK_GOLD.map((p, n) => {
    const order = Math.hypot(p.cx - CX, p.cy - CY) / maxR;
    const k = clamp01((t - 1.55 - order * 0.45) / 0.4);
    const s = k <= 0 ? 0 : easeOutBack(k);
    return (
      <g key={`g${n}`} opacity={clamp01(k * 3)} transform={`translate(${p.cx} ${p.cy}) scale(${s}) translate(${-p.cx} ${-p.cy})`}>
        <PathShape p={p} />
      </g>
    );
  });

  // Wordmark: NAMA letters rise one by one; the gold swooshes slide in.
  const nama = NAMA_LOGO.groups.nama;
  const namaLetters = nama.paths.map((p, i) => {
    const isSwoosh = p.f !== NAVY;
    const k = easeOut(clamp01((t - (isSwoosh ? 2.75 : 2.15 + i * 0.09)) / 0.5));
    const transform = isSwoosh ? `translate(${-(1 - k) * 160} 0)` : `translate(0 ${(1 - k) * (nama.bottom - nama.top + 30)})`;
    return (
      <g key={`w${i}`} opacity={clamp01(k * 1.5)} transform={transform}>
        <PathShape p={p} />
      </g>
    );
  });

  const fd = NAMA_LOGO.groups.foundation;
  const fdLetters = fd.paths.map((p, i) => {
    const k = easeOut(clamp01((t - 2.85 - i * 0.05) / 0.45));
    return (
      <g key={`f${i}`} opacity={k} transform={`translate(${(SIZE / 2 - p.cx) * (1 - k) * 0.3} 0)`}>
        <PathShape p={p} />
      </g>
    );
  });

  return (
    <AbsoluteFill style={{ fontFamily: theme.bodyFamily }}>
      <div style={{ position: "absolute", left: 960 - LOGO_PX / 2, top: LOGO_TOP, width: LOGO_PX, height: LOGO_PX, transform: `scale(${settle})` }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={LOGO_PX} height={LOGO_PX} style={{ overflow: "visible" }}>
          <defs>
            <clipPath id="nama-rise">
              <rect x={0} y={nama.top - 20} width={SIZE} height={nama.bottom - nama.top + 40} />
            </clipPath>
          </defs>
          {navy}
          {gold}
          <g clipPath="url(#nama-rise)">{namaLetters}</g>
          {fdLetters}
        </svg>
      </div>
    </AbsoluteFill>
  );
}

/** Gold circle with a navy core, expanding from the centre until it covers the frame. */
function CircleCover({ t }: { t: number }) {
  const theme = useTheme();
  const R = 1150;
  const goldR = easeInOut(clamp01(t / 0.75)) * R;
  const navyR = easeInOut(clamp01((t - 0.22) / 0.75)) * R;
  const dot = 14 * clamp01(t / 0.2); // the navy core is visible from the first moment
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <circle cx={960} cy={540} r={goldR} fill={theme.colors.gold} />
        <circle cx={960} cy={540} r={Math.max(navyR, dot)} fill={theme.colors.navy} />
      </svg>
    </AbsoluteFill>
  );
}

/** Any course logo image: fades and grows in on white, with an accent line and the course name. */
function LogoImageReveal({ t }: { t: number }) {
  const theme = useTheme();
  const brand = useBrand();
  const config = useCourseConfig();
  const file = brand.bumper?.logo ?? brand.watermarkLogoColored ?? brand.watermarkLogo;
  const grow = clamp01(t / 1.1);
  const scale = 0.82 + 0.18 * easeOutBack(grow);
  const opacity = clamp01(t / 0.5);
  const line = easeOut(clamp01((t - 1.0) / 0.8));
  const name = clamp01((t - 1.4) / 0.6);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily: theme.bodyFamily }}>
      <Img src={staticFile(`brand/${file}`)} style={{ width: 620, height: 520, objectFit: "contain", opacity, transform: `scale(${scale})` }} />
      <div style={{ width: 260 * line, height: 6, borderRadius: 3, background: theme.colors.gold, marginTop: 28 }} />
      {config.courseName ? (
        <div style={{ marginTop: 22, color: theme.colors.navy, fontSize: 40, fontWeight: 700, letterSpacing: 1, opacity: name }}>
          {config.courseName}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}

/** Picks the opening/closing animation named in course-config.json (brand.bumper.style). */
export function BrandBumper({ mode }: { mode: "intro" | "outro" }) {
  const brand = useBrand();
  const Logo = brand.bumper?.style === "nama-animated" ? LogoAssembly : LogoImageReveal;
  return <BrandBumpers mode={mode} Logo={Logo} />;
}

export function BrandBumpers({ mode, Logo = LogoAssembly }: { mode: "intro" | "outro"; Logo?: React.ComponentType<{ t: number }> }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const theme = useTheme();
  const t = frame / fps;

  if (mode === "intro") {
    const coverStart = INTRO_SECONDS - 1.0;
    const fadeOut = 1 - clamp01((t - INTRO_SECONDS) / INTRO_FADE_SECONDS);
    return (
      <AbsoluteFill style={{ opacity: fadeOut }}>
        <AbsoluteFill style={{ background: "#FFFFFF" }} />
        <Logo t={t - 0.15} />
        {t >= coverStart && <CircleCover t={t - coverStart} />}
      </AbsoluteFill>
    );
  }

  // Outro: the circle covers the last slide, a white circle opens onto the logos.
  const white = easeInOut(clamp01((t - 0.75) / 0.7)) * 1150;
  const end = 1 - clamp01((t - (OUTRO_SECONDS - 0.7)) / 0.6);
  return (
    <AbsoluteFill>
      <CircleCover t={t} />
      <AbsoluteFill>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute" }}>
          <circle cx={960} cy={540} r={white} fill="#FFFFFF" />
        </svg>
      </AbsoluteFill>
      {t > 0.75 && (
        <AbsoluteFill style={{ opacity: end, clipPath: `circle(${white}px at 960px 540px)` }}>
          <Logo t={t - 1.05} />
        </AbsoluteFill>
      )}
      {t > OUTRO_SECONDS - 0.7 && <AbsoluteFill style={{ background: theme.colors.navy, opacity: 1 - end }} />}
    </AbsoluteFill>
  );
}
