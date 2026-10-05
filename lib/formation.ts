/**
 * The government-formation clock after the Oct 27, 2026 election, from
 * data/formation.json. The time limits are those of Basic Law: The Government,
 * arts. 7–11; each milestone's dates are computed from the day the Central
 * Elections Committee publishes the official results (see `scheduleFrom`).
 */

export type Source = { name: string; date: string; url: string };

export type MilestoneStatus = "upcoming" | "done" | "skipped" | "extended";

export type Milestone = {
  id: string;
  title: string;
  rule: string;
  earliest?: string;
  latest?: string;
  actual?: string;
  status: MilestoneStatus;
  who?: string;
  note?: string;
  source: Source;
};

export type Formation = {
  checked: string;
  title: string;
  standfirst: string;
  rulesSource: Source;
  electionDay: string;
  milestones: Milestone[];
};

/**
 * The law's time limits in days, keyed by the article that sets them.
 * The longest path (every period used in full) runs to RESULTS_TO_DISSOLUTION days.
 */
export const LIMITS = {
  /** art. 7: the president assigns the task within 7 days of the published results. */
  assignFirst: 7,
  /** art. 8: the first nominee has 28 days ... */
  firstPeriod: 28,
  /** ... which the president may extend by up to 14 days in all. */
  firstExtension: 14,
  /** art. 9(a): within 3 days the president tasks another member or reports no prospect. */
  assignSecond: 3,
  /** art. 9(c): the second nominee has 28 days, with no extension. */
  secondPeriod: 28,
  /** art. 10(a): 61 members may ask, in writing, within 21 days. */
  knessetRequest: 21,
  /** art. 10(b): the president assigns that member within 2 days. */
  assignThird: 2,
  /** art. 10(c): that member has 14 days. */
  thirdPeriod: 14,
  /** art. 11(b): a new election on the last Tuesday before 90 days have passed. */
  newElectionWithin: 90,
  /** art. 13(b): the Speaker sets the government's presentation within 7 days of notice. */
  presentation: 7,
} as const;

/** Days from the published results to the end of the last period in art. 10 (117). */
export const RESULTS_TO_DISSOLUTION =
  LIMITS.assignFirst +
  LIMITS.firstPeriod +
  LIMITS.firstExtension +
  LIMITS.assignSecond +
  LIMITS.secondPeriod +
  LIMITS.knessetRequest +
  LIMITS.assignThird +
  LIMITS.thirdPeriod;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(s: string): boolean {
  if (!ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** An ISO date plus n calendar days. */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * The last Tuesday on or before day `days` counted from `from` (art. 11(b): "the last
 * Tuesday before the end of 90 days"; the 90th day itself is inside the period).
 */
export function lastTuesdayBefore(from: string, days: number): string {
  let d = addDays(from, days);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 2) d = addDays(d, -1);
  return d;
}

/**
 * The latest date of each step if every period runs out in full, counted from the
 * day the official results are published. Keys match the milestone ids in
 * data/formation.json. "government" is the latest presentation to the Knesset if the
 * third nominee reports a government on the last day (art. 13(b)); "new-election"
 * assumes the president informs the Speaker the day that period ends (art. 11).
 */
export function scheduleFrom(results: string): Record<string, string> {
  const L = LIMITS;
  const firstTasked = addDays(results, L.assignFirst);
  const firstEnds = addDays(firstTasked, L.firstPeriod);
  const extensionEnds = addDays(firstEnds, L.firstExtension);
  const secondTasked = addDays(extensionEnds, L.assignSecond);
  const secondEnds = addDays(secondTasked, L.secondPeriod);
  const knessetEnds = addDays(secondEnds, L.knessetRequest);
  const thirdTasked = addDays(knessetEnds, L.assignThird);
  const thirdEnds = addDays(thirdTasked, L.thirdPeriod);
  return {
    results,
    consultations: firstTasked,
    "first-tasked": firstTasked,
    "first-period": firstEnds,
    "first-extension": extensionEnds,
    "second-tasked": secondTasked,
    "second-period": secondEnds,
    "knesset-request": knessetEnds,
    "third-tasked": thirdTasked,
    "third-period": thirdEnds,
    government: addDays(thirdEnds, L.presentation),
    "new-election": lastTuesdayBefore(thirdEnds, L.newElectionWithin),
  };
}

/**
 * Fills in each milestone's `latest` from the published results date (the results
 * milestone's `actual`). Until the results are published, the clock has no
 * calendar dates and the milestones are returned unchanged.
 */
export function withDates(f: Formation): Formation {
  const published = f.milestones.find((m) => m.id === "results")?.actual;
  if (!published) return f;
  const s = scheduleFrom(published);
  return {
    ...f,
    milestones: f.milestones.map((m) => (m.id in s && m.id !== "results" && !m.latest ? { ...m, latest: s[m.id] } : m)),
  };
}

/** The milestone dates in order, for checking that the clock runs forward. */
export function milestoneDates(m: Milestone): string[] {
  return [m.earliest, m.latest, m.actual].filter((d): d is string => Boolean(d));
}
