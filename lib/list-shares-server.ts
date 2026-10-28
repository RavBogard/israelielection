import { cache } from "react";
import { unstable_rethrow } from "next/navigation";
import { fetchCount, resultsConfig } from "./results-live";
import { results } from "./results";
import type { ListShares } from "./list-status";

/** The live count's vote shares for every list in it, read once per render; null when there is no count to read. */
export const listSharesForRender = cache(async (): Promise<ListShares | null> => {
  try {
    const live = await fetchCount(60);
    if (live.state !== "open" || !live.count.valid) return null;
    const lists = results(live.count, resultsConfig).lists;
    return {
      byParty: Object.fromEntries(lists.filter((l) => l.partyId).map((l) => [l.partyId!, l.pct])),
      byLetters: Object.fromEntries(lists.map((l) => [l.letters, l.pct])),
    };
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
});
