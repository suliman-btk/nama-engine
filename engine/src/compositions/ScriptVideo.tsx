import React from "react";
import { AbsoluteFill, Audio, Sequence, getInputProps, staticFile } from "remotion";
import { QaProbe } from "../qa/QaProbe";
import manifestJson from "../data/script-video.json";
import courseConfigRaw from "../../../course-config.json";
import { CourseConfigContext } from "../course/CourseContext";
import { parseCourseConfig } from "../course/schema";
import { LessonLabelContext } from "../slides/SlideFrame";
import { NamaScriptScene, backdropTurn, logoAreaIsDark } from "../script-video/NamaScriptScene";
import { SubtitleLayer } from "../script-video/SubtitleLayer";
import { SceneTransition } from "../script-video/SceneTransition";
import { validateScriptVideoManifest } from "../script-video/schema";
import { BrandBumper, INTRO_SECONDS, INTRO_FADE_SECONDS, OUTRO_SECONDS, OUTRO_TAIL_SECONDS } from "../brand/BrandBumpers";
import type { ScriptScene } from "../script-video/schema";

const courseConfig = parseCourseConfig(courseConfigRaw);
export const scriptVideoManifest = validateScriptVideoManifest(manifestJson);

/** Full video length: FIRST logo opening + lesson + held last slide + FIRST logo closing. */
export function scriptVideoDurationSeconds(totalLessonSeconds: number) {
  return INTRO_SECONDS + titleHoldSeconds(scriptVideoManifest) + totalLessonSeconds + OUTRO_TAIL_SECONDS + OUTRO_SECONDS;
}

/** Optional silent pause after the greeting (kept at 0: the voice runs continuously). */
export const TITLE_HOLD_SECONDS = 0; // no silence: the voice runs continuously

/** The opening title stays fully on screen until at least this time (s), while the voice continues. */
const TITLE_MIN_SECONDS = 3.8;

/** Where the greeting ends in the first audio track (set by the builder); 0 = no greeting. */
function greetingEnd(manifest: { greetingEndSeconds?: number }) {
  return manifest.greetingEndSeconds && manifest.greetingEndSeconds > 0 ? manifest.greetingEndSeconds : 0;
}

function titleHoldSeconds(manifest: { greetingEndSeconds?: number; scenes: ScriptScene[] }) {
  return greetingEnd(manifest) > 0 && manifest.scenes[0]?.visual.kind === "title" ? TITLE_HOLD_SECONDS : 0;
}

/** The new slide is fully revealed this long before the voice reaches its anchor phrase. */
const CUT_LEAD_SECONDS = 0.2;
/** Length of the reveal of a new slide over the previous one. */
const REVEAL_SECONDS = 0.8;
/** Card highlights land this much before the word that names them. */
const ITEM_LEAD_SECONDS = 0.15;
/** A slide stays fully visible at least this long after its last card appears. */
const MIN_HOLD_SECONDS = 1.0;
/** ...but the next slide may lag its own voice by at most this much. */
const MAX_LAG_SECONDS = 0.25;

function revealSeconds(scenes: ScriptScene[], index: number) {
  if (index === 0) return 0;
  return Math.min(REVEAL_SECONDS, scenes[index].durationSeconds / 3, scenes[index - 1].durationSeconds / 3);
}

/** When each slide is fully on screen (its cut), honouring the minimum hold of the slide before. */
export function slideCuts(scenes: ScriptScene[]): number[] {
  const cuts = scenes.map((scene, index) => {
    if (index === 0) return 0;
    const prev = scenes[index - 1];
    const prevLast = prev.startSeconds + Math.max(0, ...(prev.visual.itemStartSeconds ?? [0]));
    const desired = scene.startSeconds - CUT_LEAD_SECONDS;
    const earliest = prevLast + MIN_HOLD_SECONDS + revealSeconds(scenes, index);
    return Math.min(Math.max(desired, earliest), scene.startSeconds + MAX_LAG_SECONDS);
  });
  // Let the opening title be read: the next slide may arrive a little after its voice.
  if (scenes[0]?.visual.kind === "title" && cuts.length > 1) {
    cuts[1] = Math.max(cuts[1], TITLE_MIN_SECONDS + revealSeconds(scenes, 1));
    for (let i = 2; i < cuts.length; i++) {
      const pushed = cuts[i - 1] + MIN_HOLD_SECONDS + revealSeconds(scenes, i);
      if (cuts[i] >= pushed) break; // back in sync with the voice
      cuts[i] = pushed;
    }
  }
  return cuts;
}

/** Opening-slide captions: the greeting stays briefly into the pause; later cues move past it. */
function holdCaptions(captions: ScriptScene["captions"], greet: number, hold: number) {
  return captions.map((c) =>
    c.startSeconds >= greet - 0.05
      ? { ...c, startSeconds: c.startSeconds + hold, endSeconds: c.endSeconds + hold }
      : { ...c, endSeconds: Math.min(c.endSeconds, greet + 1.0) },
  );
}

export function ScriptVideo() {
  const manifest = scriptVideoManifest;
  const fps = manifest.fps;
  const scenes = manifest.scenes;
  const cuts = slideCuts(scenes);
  const introFrames = Math.round(INTRO_SECONDS * fps);
  const lessonEnd = manifest.totalDurationSeconds;
  const lead = titleHoldSeconds(manifest);
  const greet = greetingEnd(manifest);
  const outroFrom = introFrames + Math.round((lessonEnd + lead + OUTRO_TAIL_SECONDS) * fps);

  return (
    <CourseConfigContext.Provider value={courseConfig}>
      <LessonLabelContext.Provider value={manifest.lessonLabel}>
        <AbsoluteFill style={{ backgroundColor: courseConfig.theme.colors.surface }}>
          <Sequence from={introFrames} name="lesson" style={{ isolation: "isolate", zIndex: 0 }}>
          {/* Voice: continuous, never cut. */}
          {manifest.audioTracks?.map((track, trackIndex) => {
            if (!track.audioSrc) return null;
            if (trackIndex === 0 && lead > 0) {
              // Greeting on the title slide, a held pause, then the rest of the first paragraph.
              const g = Math.round(greet * fps);
              return (
                <React.Fragment key={track.id}>
                  <Sequence from={Math.round(track.startSeconds * fps)} durationInFrames={Math.max(1, g)} name={`${track.id}-greeting`}>
                    <Audio src={staticFile(track.audioSrc)} trimAfter={g} />
                  </Sequence>
                  <Sequence from={Math.round((track.startSeconds + greet + lead) * fps)} durationInFrames={Math.max(1, Math.round(track.durationSeconds * fps) - g)} name={`${track.id}-audio`}>
                    <Audio src={staticFile(track.audioSrc)} trimBefore={g} />
                  </Sequence>
                </React.Fragment>
              );
            }
            return (
              <Sequence key={track.id} from={Math.round((track.startSeconds + lead) * fps)} durationInFrames={Math.max(1, Math.round(track.durationSeconds * fps))} name={`${track.id}-audio`}>
                <Audio src={staticFile(track.audioSrc)} />
              </Sequence>
            );
          })}
          {scenes.map((scene, index) => {
            const cut = index === 0 ? 0 : cuts[index] + lead;
            // The last slide stays on screen under the closing bumper's circle cover.
            const nextCut = index + 1 < scenes.length ? cuts[index + 1] + lead : scene.startSeconds + lead + scene.durationSeconds + OUTRO_TAIL_SECONDS + 1.0;
            const reveal = revealSeconds(scenes, index);
            const visualStart = cut - reveal;
            const from = Math.round(visualStart * fps);
            const durationInFrames = Math.max(1, Math.round(nextCut * fps) - from);
            const voiceOffset = scene.startSeconds + lead - visualStart;
            const shifted = {
              ...scene,
              visual: {
                ...scene.visual,
                itemStartSeconds: scene.visual.itemStartSeconds?.map((s) => Math.max(0, s + voiceOffset - ITEM_LEAD_SECONDS)),
              },
            };
            return (
              <React.Fragment key={scene.id}>
                <Sequence from={from} durationInFrames={durationInFrames} name={scene.id}>
                  <SceneTransition sceneIndex={index} revealFrames={Math.round(reveal * fps)} logoOnDark={logoAreaIsDark(scene, index)} hideLogo={index === 0 && scene.visual.kind === "title"}>
                    <NamaScriptScene scene={shifted} lessonLabel={manifest.lessonLabel} sceneIndex={index} backdropIndex={backdropTurn(scenes, index)} />
                  </SceneTransition>
                </Sequence>
                {courseConfig.subtitles === false ? null : <Sequence from={Math.round((index === 0 ? scene.startSeconds : scene.startSeconds + lead) * fps)} durationInFrames={Math.max(1, Math.round((scene.durationSeconds + (index === 0 ? lead : 0)) * fps))} name={`${scene.id}-captions`}>
                  <SubtitleLayer captions={index === 0 && lead > 0 ? holdCaptions(scene.captions, greet, lead) : scene.captions} />
                </Sequence>}
              </React.Fragment>
            );
          })}
          </Sequence>
          {/* FIRST Framework logo: opening and closing bumpers. */}
          <Sequence from={0} durationInFrames={introFrames + Math.round(INTRO_FADE_SECONDS * fps)} name="opening-first-logo" style={{ isolation: "isolate", zIndex: 10 }}>
            <BrandBumper mode="intro" />
          </Sequence>
          <Sequence from={outroFrom} durationInFrames={Math.round(OUTRO_SECONDS * fps)} name="closing-first-logo" style={{ isolation: "isolate", zIndex: 10 }}>
            <BrandBumper mode="outro" />
          </Sequence>
          {getInputProps().qa === true ? <QaProbe /> : null}
        </AbsoluteFill>
      </LessonLabelContext.Provider>
    </CourseConfigContext.Provider>
  );
}
