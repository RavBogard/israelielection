import { recordHash } from "./hash";
import { lifecycleStore } from "../election-lifecycle/store";
import { resolveLifecycle } from "../election-lifecycle/resolver";
/** Live claims must still be visible now; published historical indicator observations remain sourced records. */
export async function deliveryFactEligible(
  fact: Record<string, unknown>,
  now: string,
) {
  if (fact.kind === "indicator_observation")
    return (
      (fact.provenance as { parserVersion?: unknown })?.parserVersion ===
      "cbs-price-v1"
    );
  if (fact.kind !== "event") return false;
  const event = (
    fact.payload as {
      event?: { id?: unknown; revision?: unknown; sources?: unknown };
    }
  )?.event;
  if (typeof event?.id !== "string") return false;
  const store = lifecycleStore();
  if (!store) return false;
  try {
    const ledger = await store.load();
    return (
      !!ledger &&
      resolveLifecycle(ledger, now).politics.events.some(
        (current) =>
          current.id === event.id &&
          current.revision === event.revision &&
          recordHash(
            current.sources
              .map((source) => [
                source.id,
                source.url,
                source.authority,
                source.captureHash,
              ])
              .sort(),
          ) ===
            recordHash(
              Array.isArray(event.sources)
                ? event.sources
                    .map((source) => [
                      source.id,
                      source.url,
                      source.authority,
                      source.captureHash,
                    ])
                    .sort()
                : [],
            ),
      )
    );
  } catch {
    return false;
  }
}
