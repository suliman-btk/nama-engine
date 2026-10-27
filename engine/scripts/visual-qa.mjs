#!/usr/bin/env node
/**
 * Visual QA for the most recently built lesson (src/data/script-video.json).
 *
 * For every slide it renders a picture at the moment the slide is complete (all cards shown)
 * and measures the page: text cut off at the edges, text that does not fit its box, texts that
 * overlap, and text or cards that are hard to see against the background colour.
 *
 *   npm run qa                 (from the engine folder)   or   ./check-video (repo root)
 *
 * Writes pictures and a plain-language report to out/qa/<lesson>/ and exits with code 1 when
 * it finds problems, so agents and scripts can stop before rendering a broken video.
 * Set REMOTION_BROWSER=/path/to/chrome to use a specific browser.
 */
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(engine, "src/data/script-video.json"), "utf8"));
const INTRO_SECONDS = 6.2; // keep in sync with src/brand/BrandBumpers.tsx
const fps = manifest.fps;
const scenes = manifest.scenes;
const outDir = path.join(engine, "..", "output", "review", manifest.slug);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

/** Lesson time (s) when slide i is fully built and not yet leaving. */
function completeTime(i) {
  const s = scenes[i];
  if (i === 0) return 3.0;
  const lastItem = Math.max(0, ...(s.visual.itemStartSeconds ?? [0]), s.visual.revealStartSeconds ?? 0);
  const built = s.startSeconds + lastItem + 0.6;
  const leaving = i + 1 < scenes.length ? scenes[i + 1].startSeconds - 1.1 : s.startSeconds + s.durationSeconds - 0.2;
  let t = Math.min(Math.max(built, s.startSeconds + 0.9), leaving);
  if (i === 1) t = Math.max(t, 4.9); // the opening title holds the first seconds
  return t;
}

function mmssEarly(sec) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const words = {
  edge: (i) => `Text is cut off at the edge of the video: "${i.text}"`,
  clipped: (i) => `Text does not fit in its box and is cut off: "${i.text}"`,
  "image-missing": (i) => `A logo or picture did not load: ${i.text} (check the file name in the course settings)`,
  "logo-hidden": (i) => i.share < 50
    ? `A logo is not clear against the colour behind it (only ${i.share}% of it stands out). Use a white version of the logo on dark slides, or change the colours: ${i.text}`
    : `A logo could stand out more against the colour behind it (${i.share}% of it stands out): ${i.text}`,
  image: (i) => `Text runs into a logo or picture (${i.image}): "${i.text}"`,
  overlap: (i) => `Two texts overlap: "${i.text}" and "${i.with}"`,
  contrast: (i) => i.ratio < 1.8
    ? `Text is almost invisible against its background (contrast ${i.ratio}:1): "${i.text}"`
    : `Text could be easier to read (contrast ${i.ratio}:1; a little more contrast would help): "${i.text}"`,
};
/** Problems that must be fixed. Low-but-visible contrast is only advice. */
const isError = (i) => (i.type === "contrast" ? i.ratio < 1.8 : i.type === "logo-hidden" ? i.share < 50 : true);

const browserExecutable = process.env.REMOTION_BROWSER || null;
console.log(`Checking ${scenes.length} slides of "${manifest.title}"...`);
const serveUrl = await bundle({ entryPoint: path.join(engine, "src/index.ts") });
const inputProps = { qa: true };
const composition = await selectComposition({ serveUrl, id: "ScriptVideo", inputProps, browserExecutable });

const results = [];
for (let i = 0; i < scenes.length; i++) {
  const t = completeTime(i);
  const frame = Math.min(composition.durationInFrames - 1, Math.round((INTRO_SECONDS + t) * fps));
  let found = null;
  const file = path.join(outDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
  await renderStill({
    composition, serveUrl, inputProps, frame, output: file, scale: 0.5, browserExecutable, logLevel: "error",
    onBrowserLog: (log) => {
      const m = /QA_RESULT (.*)$/.exec(log.text);
      if (m) found = JSON.parse(m[1]);
    },
  });
  const issues = found ? found.issues : [{ type: "probe", text: "the check did not run" }];
  results.push({ index: i + 1, title: scenes[i].visual.title, kind: scenes[i].visual.kind, time: INTRO_SECONDS + t, file, issues });
  process.stdout.write(issues.some(isError) ? "x" : ".");
}
process.stdout.write("\n");

// Extra review moments (not measured): the opening animation, the middle of the video, the closing.
const total = composition.durationInFrames / fps;
const extras = [
  { name: "00-opening", time: 2.5, label: "Opening" },
  { name: "00-opening-b", time: 4.8, label: "Opening" },
  { name: "99-closing", time: total - 3.0, label: "Closing" },
];
for (const x of extras) {
  await renderStill({ composition, serveUrl, inputProps: {}, frame: Math.round(x.time * fps), output: path.join(outDir, `${x.name}.png`), scale: 0.5, browserExecutable, logLevel: "error" });
}
const frames = [
  ...extras.slice(0, 2).map((x) => ({ file: `${x.name}.png`, label: `${x.label} · ${mmssEarly(x.time)}`, problem: false })),
  ...results.map((r) => ({ file: path.basename(r.file), label: `Slide ${r.index} · ${mmssEarly(r.time)}`, problem: r.issues.some(isError) })),
  { file: `${extras[2].name}.png`, label: `Closing · ${mmssEarly(extras[2].time)}`, problem: false },
];
fs.writeFileSync(path.join(outDir, "frames.json"), JSON.stringify(frames, null, 1));
const sheetTool = [path.resolve(engine, "../tools/review_sheet.py"), path.resolve(engine, "../scripts/review_sheet.py")].find((p) => fs.existsSync(p));
if (sheetTool) {
  const { spawnSync } = await import("node:child_process");
  const made = spawnSync("python3", [sheetTool, outDir], { encoding: "utf8" });
  if (made.status === 0) process.stdout.write(made.stdout);
  else console.log("(Could not make review sheets: " + (made.stderr || "").trim().split("\n").pop() + ")");
}

// Course-wide advice: a coloured logo on dark slides is often hard to see.
const config = JSON.parse(fs.readFileSync(path.resolve(engine, "..", fs.existsSync(path.resolve(engine, "../course-config.json")) ? "course-config.json" : "../course-config.json"), "utf8"));
const courseAdvice = [];
if (config.brand && config.brand.watermarkLogoColored && config.brand.watermarkLogo === config.brand.watermarkLogoColored) {
  courseAdvice.push("No white version of the logo is set, so the colour logo is also used on dark slides, where it is often hard to see. Add one with: course_setup.py --logo-white <file>");
}
const bad = results.filter((r) => r.issues.some(isError));
const advice = results.filter((r) => !r.issues.some(isError) && r.issues.length);
const say = (i) => (words[i.type] ?? ((x) => `${x.type}: ${x.text}`))(i);
const lines = [
  `# Visual check: ${manifest.title}`,
  "",
  bad.length
    ? `**PROBLEMS: ${bad.length} of ${results.length} slides must be fixed before making the video.**`
    : `**PASSED:** all ${results.length} slides are free of cut-off, overlapping or invisible text.`,
  "",
];
for (const r of bad) {
  lines.push(`## Slide ${r.index} at ${mmss(r.time)} - "${r.title}" (${r.kind})`, "", `Picture: ${path.relative(engine, r.file)}`, "");
  for (const i of r.issues) lines.push(`- ${isError(i) ? "" : "(advice) "}${say(i)}`);
  lines.push("");
}
if (advice.length || courseAdvice.length) {
  lines.push("## Advice only (no need to fix)", "");
  for (const a of courseAdvice) lines.push(`- Whole course: ${a}`);
  for (const r of advice) for (const i of r.issues) lines.push(`- Slide ${r.index} at ${mmss(r.time)}: ${say(i)}`);
  lines.push("");
}
if (bad.length) {
  lines.push("## How to fix", "",
    "- Cut off / does not fit: shorten the card text in the lesson's .visuals.json, or use a design with fewer cards.",
    "- Overlap: use fewer or shorter items on that slide, or a different design.",
    "- Invisible text: the course colours are too close. Choose a darker main colour or a stronger accent",
    "  (python3 tools/course_setup.py --primary ... --accent ...).",
    "");
}
fs.writeFileSync(path.join(outDir, "report.md"), lines.join("\n"));
console.log(lines.join("\n"));
console.log(`Report and pictures: ${path.relative(process.cwd(), outDir)}`);
process.exit(bad.length ? 1 : 0);
