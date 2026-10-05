/** Capture policy: automatic only in the first seven days after close; manual can resume afterward. */
export function captureAllowed(close: string, now: number, manual: boolean): boolean {
  const start = Date.parse(close); return Number.isFinite(start) && now >= start && (manual || now <= start + 7 * 86400_000);
}
