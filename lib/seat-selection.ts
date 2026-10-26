import { averagePoll, exitPolls, mainPolls } from "./data";
import { forecastPoll } from "./forecast";
import { getSharedSeatContext } from "./election-lifecycle/server";
import { contextToPoll } from "./seat-context";
import { fetchCount, resultsConfig } from "./results-live";
import { RESULTS_ID, resultsAsPoll } from "./results";
/** Resolve an explicit selection without ever silently replacing unavailable evidence. */
export async function resolveSeatSelection(q: URLSearchParams) {
  const revision = q.get("context"),
    requested = q.get("poll");
  if (revision || !requested || requested === "current") {
    const result = await getSharedSeatContext(revision ? { revision } : {});
    if (result.state !== "ready") return null;
    return { poll: contextToPoll(result.context), context: result.context };
  }
  if (requested === RESULTS_ID) {
    const live = await fetchCount(60);
    return live.state === "open"
      ? {
          poll: resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live),
          context: null,
        }
      : null;
  }
  const poll = [forecastPoll, averagePoll, ...exitPolls, ...mainPolls].find(
    (p) => p.id === requested,
  );
  return poll ? { poll, context: null } : null;
}
