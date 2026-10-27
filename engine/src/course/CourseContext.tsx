import React from "react";
import type { CourseConfig } from "./schema";
import { buildTheme, type EngineTheme } from "./buildTheme";

/**
 * Engine components read course config via this context. No component may
 * import a hard-coded theme or brand asset directly — everything flows
 * through here.
 *
 * The composition root wraps the whole lesson in:
 *   <CourseConfigContext.Provider value={courseConfig}>
 *     ...
 *   </CourseConfigContext.Provider>
 */
export const CourseConfigContext = React.createContext<CourseConfig | null>(null);

/** Read the full course config. Throws if no provider is above this component. */
export function useCourseConfig(): CourseConfig {
  const cfg = React.useContext(CourseConfigContext);
  if (!cfg) {
    throw new Error(
      "No CourseConfig provided. Wrap your composition in <CourseConfigContext.Provider>."
    );
  }
  return cfg;
}

/**
 * Read the engine-internal theme derived from the course config.
 *
 * This is the primary hook for components that need colours, typography, or
 * radius tokens. It returns the same shape as the old hard-coded `theme` export,
 * so the migration is a mechanical replacement:
 *
 *   // before:
 *   import { theme } from "../components/theme";
 *
 *   // after (inside a React function component):
 *   const theme = useTheme();
 */
export function useTheme(): EngineTheme {
  return buildTheme(useCourseConfig());
}

/** Read the brand config block. */
export function useBrand() {
  return useCourseConfig().brand;
}

/** Read the presenter grammar config block. */
export function usePresenterGrammar() {
  return useCourseConfig().presenterGrammar;
}
