import { connection } from "next/server";
import { fetchCount, resultsConfig, resultsNow } from "./results-live";
import { results } from "./results";
import { expectedFinalValid } from "./live-forecast/count-estimate";

/** The committee's count as the reference pages read it: how much is in, each list's share, and when it was captured. */
export type CountView = {
  valid: number;
  /** Valid votes the count is expected to reach (the same estimate the home page's progress bar uses). */
  expected: number;
  /** Share of the expected vote counted so far, 0 to 1. */
  counted: number;
  /** Share of the expected vote still out, 0 to 1. */
  out: number;
  /** Each tracked list's share of the valid votes counted so far, 0 to 1, by party id. */
  shares: Record<string, number>;
  /** Turnout in the localities counted so far, in percent (one decimal): voters over the eligible roll there. Double envelopes are not in it. */
  turnout: number | null;
  /** When the committee's file was last updated (or, failing that, captured), as an ISO time. */
  at: string;
};

/** Read the saved count (never the committee's site). Null before polls close or when no count is saved. */
export async function countView(): Promise<CountView | null> {
  await connection();
  const live = await fetchCount(60, { now: resultsNow() });
  if (live.state !== "open" || !live.count.valid) return null;
  const expected = Math.max(expectedFinalValid(), live.count.valid);
  const counted = live.count.valid / expected;
  const shares: Record<string, number> = {};
  for (const l of results(live.count, resultsConfig).lists) if (l.partyId) shares[l.partyId] = l.pct;
  return { valid: live.count.valid, expected, counted, out: 1 - counted, shares, turnout: live.count.eligible > 0 ? Math.round((live.count.voted / live.count.eligible) * 1000) / 10 : null, at: live.sourceUpdatedAt ?? live.fetchedAt };
}
