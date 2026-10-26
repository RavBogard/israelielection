export const CADENCE_START = Date.parse("2026-10-27T20:00:00Z");
export const REGULAR_START = Date.parse("2026-10-28T06:00:00Z");
export const CADENCE_GRACE = 5 * 60_000;
export type CadenceMetadata = {
  phase: "before_close" | "election_night" | "regular";
  intervalMinutes: 15 | 180;
  nextCheckAt: string;
  lastSuccessfulAt: string | null;
  lastAttemptAt: string | null;
  expiresAt: string;
  dueAt: string;
  status: "waiting" | "current" | "overdue" | "failed";
  graceMinutes: 5;
};
export function cycleAt(now: number): number | null {
  if (now < CADENCE_START) return null;
  const anchor = now < REGULAR_START ? CADENCE_START : REGULAR_START;
  const step = (now < REGULAR_START ? 15 : 180) * 60_000;
  return anchor + Math.floor((now - anchor) / step) * step;
}
export function nextCycleAfter(now: number): number {
  if (now < CADENCE_START) return CADENCE_START;
  const current = cycleAt(now)!;
  return current + (current < REGULAR_START ? 15 : 180) * 60_000;
}
export function cadenceMetadata(
  now: string,
  lastSuccessfulAt: string | null,
  lastAttemptAt: string | null = null,
  failed = false,
): CadenceMetadata {
  const time = Date.parse(now),
    last = lastSuccessfulAt ? Date.parse(lastSuccessfulAt) : CADENCE_START - 1;
  const expires = nextCycleAfter(last) + CADENCE_GRACE;
  return {
    phase:
      time < CADENCE_START
        ? "before_close"
        : time < REGULAR_START
          ? "election_night"
          : "regular",
    intervalMinutes: time < REGULAR_START ? 15 : 180,
    nextCheckAt: new Date(
      time < CADENCE_START ? CADENCE_START : nextCycleAfter(time),
    ).toISOString(),
    lastSuccessfulAt,
    lastAttemptAt,
    expiresAt: new Date(expires).toISOString(),
    dueAt: new Date(nextCycleAfter(last)).toISOString(),
    status:
      time < CADENCE_START
        ? "waiting"
        : failed
          ? "failed"
          : time > expires
            ? "overdue"
            : "current",
    graceMinutes: 5,
  };
}
export const cadenceFresh = (
  now: string,
  last: string | null,
  attempt: string | null = null,
  failed = false,
) => {
  const status = cadenceMetadata(now, last, attempt, failed).status;
  return !!last && status !== "overdue" && status !== "failed";
};
