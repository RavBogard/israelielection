import type { ElectionLifecycleSnapshot, PoliticalEvent } from "./election-lifecycle/types";

/** Test fixtures for the standing-reference home: a lifecycle record before and after a government is sworn in. */
const seats = { likud: 27, otzma: 7, utj: 7, shas: 6, rz: 6, yashar: 22, byachad: 12, dem: 8, yb: 7, jl: 11, raam: 7 };
const bloc: Record<string, string> = { likud: "net", otzma: "net", utj: "net", shas: "net", rz: "net", yashar: "opp", byachad: "opp", dem: "opp", yb: "opp", jl: "arab", raam: "arab" };
const source = { id: "knesset-swearing", publisher: "Knesset", title: "Fixture", url: "https://main.knesset.gov.il/", authority: "knesset" as const, publishedAt: "2026-12-15T16:00:00Z", observedAt: "2026-12-15T16:05:00Z", captureHash: "c".repeat(64) };
const formed = (): PoliticalEvent => ({
  id: "e1", revision: "r1", claimKey: "k1", type: "government_formed", election: "il-knesset-26", effectiveAt: "2026-12-15T15:00:00Z",
  publishedAt: "2026-12-15T16:00:00Z", observedAt: "2026-12-15T16:05:00Z", partyIds: ["likud", "otzma", "utj", "shas", "rz", "yb", "dem"],
  person: "Fixture Person", decision: null, durationDays: null, status: "confirmed", sources: [source],
  evidenceQuote: "The government was sworn in before the Knesset.", supersedes: null, templateKey: "government_formed",
});
const base = (): ElectionLifecycleSnapshot => ({
  selection: { mode: "current", seatRevision: "a".repeat(64), politics: "current" }, schemaVersion: 1, election: "il-knesset-26", revision: "f".repeat(64), sequence: 9,
  updatedAt: "2026-12-15T16:10:00Z",
  seatContext: {
    schemaVersion: 1, election: "il-knesset-26", revision: "a".repeat(64), snapshotRevision: "b".repeat(64), sequence: 3, updatedAt: "2026-11-05T12:00:00Z",
    evidenceStage: "official", basis: "official_seats", seatStatus: "official", pointMethod: "published_official_allocation", pointSeats: { ...seats },
    parties: Object.keys(seats).map((id) => ({ id, label: id, profiled: true, bloc: bloc[id] })), sourceRefs: [], publishedAt: "2026-11-05T12:00:00Z",
    observedAt: "2026-11-05T12:00:00Z", correctionOf: null, freshness: { status: "complete", checkedAt: null, lastAttemptAt: null }, reasonCodes: [],
  },
  alternatives: [],
  politics: { formationState: "forming", activeProposalId: null, proposals: [], activeStages: [], events: [], decisions: [], clock: null, withheldCount: 0, status: "active" },
  health: [], archive: { electionForecast: "complete", completedAt: "2026-11-05T12:00:00Z" }, geographyRevision: null,
});
export const formingSnapshot = base;
export function governingSnapshot(): ElectionLifecycleSnapshot {
  const s = base();
  s.politics = { ...s.politics, formationState: "governing", status: "formed", events: [formed()], activeStages: ["government_formed"] };
  return s;
}
