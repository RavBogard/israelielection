import resultsConfig from "@/data/results.json";
import { parseGeography } from "./election-lifecycle/geography";
import type { CountRecord } from "./election-lifecycle/count-store";
import { communityBlock, COMMUNITY_TOWNS, type CommunityBlock } from "./communities-2026";
import { PRIOR_ROLL } from "./results-phase";

export type CommunityCountResponse =
  | { state: "ready"; slug: string; block: CommunityBlock; fileTime: string; countedShare: number; basis: "roll" | "prior" }
  | { state: "unavailable"; reason: "unknown_community" | "no_count" | "unusable_count" };

/**
 * One community's 2026 block from the stored count record: the CEC locality file kept by the count worker (never a live
 * fetch), its own last-modified time when it gave one (else when we captured it), and the share of the roll counted.
 */
export function communityCount(slug: string, record: Pick<CountRecord, "raw" | "current"> | null): CommunityCountResponse {
  const def = COMMUNITY_TOWNS[slug];
  if (!def) return { state: "unavailable", reason: "unknown_community" };
  if (!record?.raw || !record.current) return { state: "unavailable", reason: "no_count" };
  try {
    const fileTime = record.current.sourceUpdatedAt ?? record.current.capturedAt;
    const geo = parseGeography(record.raw, fileTime, null);
    const roll = (resultsConfig as { roll?: { eligible: number } }).roll?.eligible;
    const denominator = roll || PRIOR_ROLL.eligible;
    return { state: "ready", slug, block: communityBlock(geo, def), fileTime, countedShare: Math.min(1, geo.totals.eligible / denominator), basis: roll ? "roll" : "prior" };
  } catch {
    return { state: "unavailable", reason: "unusable_count" };
  }
}
