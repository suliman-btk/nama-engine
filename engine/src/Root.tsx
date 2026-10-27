import React from "react";
import { Composition } from "remotion";
import { ScriptVideo, scriptVideoManifest, scriptVideoDurationSeconds } from "./compositions/ScriptVideo";

/** NAMA Engine has one composition: the lesson video built from the current transcript. */
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ScriptVideo"
      component={ScriptVideo}
      durationInFrames={Math.max(1, Math.ceil(scriptVideoDurationSeconds(scriptVideoManifest.totalDurationSeconds) * scriptVideoManifest.fps))}
      fps={scriptVideoManifest.fps}
      width={scriptVideoManifest.width}
      height={scriptVideoManifest.height}
    />
  );
};
