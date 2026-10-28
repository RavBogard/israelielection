import type { ElectionLifecycleSnapshot } from "./election-lifecycle/types";
import { addDays } from "./formation";

/**
 * The dated "What happens next" strip on /government. Which steps are done comes from the
 * lifecycle snapshot (official seats, the statutory publication, confirmed events), never from
 * the clock. Dates are only those fixed by law or sourced; an expectation is marked as one.
 */
export type NextStepId = "envelopes" | "results" | "consultations" | "mandate";
export type NextStep = {
  id: NextStepId;
  state: "done" | "next" | "later";
  /** ISO date: the fixed or expected date, the day it happened, or the legal deadline once known. */
  date: string | null;
  /** "fixed": set by law or a deadline computed from a published date; "expected": our expectation, with a source. */
  basis: "fixed" | "expected" | "happened";
};

/** The CEC counts double-envelope ballots after the regular count; expected complete by this day (election-night reporting, STATE.md 2026-10-28). */
export const ENVELOPES_EXPECTED_THROUGH = "2026-10-29";

type Input = Pick<ElectionLifecycleSnapshot, "seatContext" | "politics">;

export function nextSteps(s: Input, reliable = true): NextStep[] {
  const c = s.seatContext, p = s.politics;
  const published = c.statutoryPublication?.publishedOn ?? null;
  const official = c.seatStatus === "official" || !!published;
  const events = reliable ? p.events.filter((e) => e.status === "confirmed") : [];
  const has = (...t: string[]) => events.some((e) => t.includes(e.type));
  const tasked = has("mandate", "extension", "government_formed", "mandate_returned", "mandate_failed");
  const consulted = has("consultation") || tasked;
  const mandateClock = reliable ? p.clock : null;
  const raw: Omit<NextStep, "state">[] = [
    { id: "envelopes", date: official ? null : ENVELOPES_EXPECTED_THROUGH, basis: official ? "happened" : "expected" },
    published
      ? { id: "results", date: published, basis: "happened" }
      : { id: "results", date: null, basis: official ? "happened" : "expected" },
    { id: "consultations", date: published ? addDays(published, 7) : null, basis: "fixed" },
    { id: "mandate", date: mandateClock && mandateClock.kind !== "publication_to_assignment" ? mandateClock.deadlineAt.slice(0, 10) : null, basis: "fixed" },
  ];
  const done = [official, official, consulted, has("government_formed")];
  let nextSeen = false;
  return raw.map((r, i) => {
    const state = done[i] ? "done" : !nextSeen ? ((nextSeen = true), "next") : "later";
    return { ...r, state };
  });
}
