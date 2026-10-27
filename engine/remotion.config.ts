import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);

// Output quality. The source is only ~2 Mbps, so the encoder must not add a second
// generation of loss on top of it: CRF 16 is visually transparent for this material, and
// near-lossless intermediate frames keep text edges and the gold rules crisp.
Config.setCrf(16);
Config.setJpegQuality(97);

// Chromium.
//
// The cloud sandbox this was built in blocks Remotion's browser-download CDN, so it has to
// borrow the Playwright Chromium already installed there. Anywhere else — your Mac included
// — Remotion should just fetch and manage its own. Hence the existence check rather than a
// hard-coded path: the same file works in both places with nothing to edit.
const SANDBOX_CHROMIUM =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (existsSync(SANDBOX_CHROMIUM)) {
  Config.setBrowserExecutable(SANDBOX_CHROMIUM);
}

// Use all available cores. The sandbox has 2; a MacBook Air has 8-10, which is most of the
// difference in render time between the two.
Config.setConcurrency(null);
