/**
 * Server read path for the count-informed estimate: the stored CEC count (never a live fetch) plus
 * the current exit-informed snapshot as prior, projected with `countNowcast`. Kept apart from model.ts.
 */
import { readCountRecord } from "../election-lifecycle/count-store";
import frozen from "../../data/live-forecast-prior.json";
import results from "../../data/results.json";
import history2022 from "../../public/vote-map/2022.json";
import type { VoteMapElection } from "../votemap";
import { countNowcast, OTHER, parseLocalities, type NowcastResult } from "./count-nowcast";
import { PROFILES_2022 } from "./geography";
import type { LiveForecastSnapshot } from "./types";

export type CountEstimate = Omit<NowcastResult, "counted" | "projected"> & {
  capturedAt: string | null;
  source: "expc";
  method: string;
};

const frozenShares = (frozen.forecast.lists ?? {}) as Record<string, { share: number }>;

/** Vote shares implied by the snapshot's median seats; lists below the threshold keep their pre-election share. */
export function priorShares(snapshot: Pick<LiveForecastSnapshot, "partySeats">): Record<string, number> {
  const modelled = new Set(Object.keys(PROFILES_2022));
  const seats = Object.fromEntries(snapshot.partySeats.filter((p) => modelled.has(p.id)).map((p) => [p.id, p.seats.median]));
  const out: Record<string, number> = {};
  let below = 0;
  for (const id of modelled) {
    if ((seats[id] ?? 0) > 0) continue;
    const s = (frozenShares[id]?.share ?? 0) / 100;
    if (s > 0) (out[id] = s), (below += s);
  }
  const listed = Object.values(frozenShares).reduce((n, l) => n + l.share / 100, 0);
  const other = Math.max(0.01, 1 - listed);
  const seated = Object.values(seats).reduce((a, b) => a + b, 0);
  for (const [id, n] of Object.entries(seats)) if (n > 0) out[id] = ((1 - other - below) * n) / seated;
  out[OTHER] = other;
  return out;
}

export async function getCountEstimate(snapshot: Pick<LiveForecastSnapshot, "partySeats">): Promise<CountEstimate | null> {
  try {
    const record = await readCountRecord();
    if (!record?.raw || record.raw.length > 10_000_000) return null;
    const observation = parseLocalities(record.raw, results.letters);
    if (!observation.localities.length && !observation.envelope.valid) return null;
    const r = countNowcast({
      history: history2022 as VoteMapElection,
      prior: priorShares(snapshot),
      observation,
      threshold: results.threshold,
      agreements: results.agreements.map((a) => a.parties as [string, string]),
      draws: 300,
    });
    const { counted: _c, projected: _p, ...rest } = r;
    void _c;
    void _p;
    return {
      ...rest,
      capturedAt: record.current?.capturedAt ?? null,
      source: "expc",
      method:
        "Counted votes plus each uncounted 2022 locality projected from its own 2022 pattern, reconciled to the exit-informed prior and adjusted by the swing measured where counting has happened. Prior only below 5% of expected votes counted.",
    };
  } catch {
    return null;
  }
}
