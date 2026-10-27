import { recordHash } from "./hash";
import { lifecycleStore } from "../election-lifecycle/store";
import { resolveLifecycle } from "../election-lifecycle/resolver";
/** Live claims must still be visible now; published historical indicator observations remain sourced records. */
export async function deliveryFactEligible(
  fact: Record<string, unknown>,
  now: string,
) {
  if (fact.kind === "claim") {
    const provenance = fact.provenance as { parserVersion?: unknown };
    const payload = fact.payload as {
      bundleHash?: unknown;
      classification?: unknown;
    };
    return (
      provenance?.parserVersion === "reviewed-briefing-claim-v1" &&
      typeof payload?.bundleHash === "string" &&
      /^[a-f0-9]{64}$/.test(payload.bundleHash) &&
      ["reported_corroborated", "attributed_analysis"].includes(
        String(payload.classification),
      )
    );
  }
  if (fact.kind === "indicator_observation")
    return (
      (fact.provenance as { parserVersion?: unknown })?.parserVersion ===
      "cbs-price-v1"
    );
  if (fact.kind === "snapshot") {
    const snapshot = (
      fact.payload as { snapshot?: { basis?: unknown; revision?: unknown } }
    )?.snapshot;
    if (snapshot?.basis !== "official_seats") return false;
    try {
      const ledger = await lifecycleStore()?.load();
      return (
        !!ledger &&
        resolveLifecycle(ledger, now).seatContext.revision === snapshot.revision
      );
    } catch {
      return false;
    }
  }
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
