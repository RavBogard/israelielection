import { seatContextForRender } from "./seat-context-server";
import { countView } from "./count-view";
import { resultsConfig } from "./results-live";
import { LIFECYCLE } from "./i18n/election-lifecycle";
import type { Election, Timeline } from "./timeline";

/**
 * The figures a "counting" election row shows, read from the shared seat context (the two largest lists) and
 * the saved count (turnout), never typed into data/timeline.json, so the same file serves the next cycle.
 */
export async function liveElectionFigures(): Promise<Pick<Election, "first" | "second" | "turnout" | "asOf" | "source"> | null> {
  const context = await seatContextForRender();
  // Only count-based or official seats belong on the row; the saved campaign forecast never stands in for a count.
  if (!context || !(context.basis === "partial_count" || context.seatStatus === "official")) return null;
  const label = new Map(context.parties.map((p) => [p.id, p.label]));
  const [first, second] = Object.entries(context.pointSeats)
    .filter(([, seats]) => seats > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([id, seats]) => ({ list: label.get(id) ?? id, seats }));
  if (!first || !second) return null;
  const count = await countView().catch(() => null);
  return {
    first,
    second,
    ...(count?.turnout != null ? { turnout: count.turnout } : {}),
    asOf: (context.publishedAt ?? context.updatedAt).slice(0, 10),
    source: {
      name: `${LIFECYCLE.en[context.basis]} (Central Elections Committee count)`,
      date: "",
      url: resultsConfig.source.url,
    },
  };
}

export type LiveElectionFigures = NonNullable<Awaited<ReturnType<typeof liveElectionFigures>>>;

/** The timeline with its counting row (if any) filled from the live figures; unchanged when none are available. */
export function applyLiveElection(data: Timeline, live: LiveElectionFigures | null | undefined): Timeline {
  if (!live) return data;
  return { ...data, elections: data.elections.map((e) => (e.status === "counting" ? { ...e, ...live } : e)) };
}
