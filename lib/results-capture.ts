import { COUNT_TIMELINE } from "./political-record/elections";
/** End of the automatic count window: the official result is expected about 3-5 Nov. Mirrors COUNT_WINDOW_END in the capture workflows. */
export const COUNT_WINDOW_END = COUNT_TIMELINE.countWindowEnd;
/** Capture policy: automatic from close to the end of the count window; manual can resume afterward. */
export function captureAllowed(close: string, now: number, manual: boolean): boolean {
  const start = Date.parse(close); return Number.isFinite(start) && now >= start && (manual || now < COUNT_WINDOW_END);
}
