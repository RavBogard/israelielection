/**
 * Server read path for the count-informed estimate: the stored CEC count (never a live fetch) projected with
 * `countNowcast` from a prior frozen for the night (data/count-prior.json), then blended with the current
 * exit-informed snapshot by a weight that rises with coverage. Kept apart from model.ts.
 */
import { readCountRecord } from "../election-lifecycle/count-store";
import countPrior from "../../data/count-prior.json";
import night from "../../data/election-night.json";
import frozen from "../../data/live-forecast-prior.json";
import partyData from "../../data/parties.json";
import results from "../../data/results.json";
import history2022 from "../../public/vote-map/2022.json";
import type { VoteMapElection } from "../votemap";
import { countNowcast, OTHER, parseLocalities, type NowcastOptions, type NowcastResult } from "./count-nowcast";
import { PROFILES_2022, type ProfileMap } from "./geography";
import type { LiveForecastSnapshot } from "./types";

export type CountEstimate = Omit<NowcastResult, "counted" | "projected" | "localities"> & {
  capturedAt: string | null;
  source: "expc";
  method: string;
  /** Revision of the frozen prior the projection is reconciled to; changes only when the prior file does. */
  priorRevision?: string;
  /** Labelled modelling assumptions in force, for the method text. */
  assumptions?: string[];
};

const history = history2022 as VoteMapElection;
const frozenShares = (frozen.forecast.lists ?? {}) as Record<string, { share: number }>;

/** Vote shares implied by the snapshot's median seats; lists below the threshold take the night file's stated share, else their pre-election share. */
export function priorShares(snapshot: Pick<LiveForecastSnapshot, "partySeats">): Record<string, number> {
  const modelled = new Set(Object.keys(PROFILES_2022));
  const seats = Object.fromEntries(snapshot.partySeats.filter((p) => modelled.has(p.id)).map((p) => [p.id, p.seats.median]));
  const out: Record<string, number> = {};
  let below = 0;
  const sub = countPrior.subThreshold as Record<string, number | string>;
  for (const id of modelled) {
    if ((seats[id] ?? 0) > 0) continue;
    const s = (typeof sub[id] === "number" ? (sub[id] as number) : (frozenShares[id]?.share ?? 0)) / 100;
    if (s > 0) (out[id] = s), (below += s);
  }
  const listed = Object.values(frozenShares).reduce((n, l) => n + l.share / 100, 0);
  const other = Math.max(0.01, 1 - listed);
  const seated = Object.values(seats).reduce((a, b) => a + b, 0);
  for (const [id, n] of Object.entries(seats)) if (n > 0) out[id] = ((1 - other - below) * n) / seated;
  out[OTHER] = other;
  return out;
}

/** The night's frozen prior: exit-informed medians at the freeze time plus stated sub-threshold shares. */
export function frozenPriorShares(): Record<string, number> {
  const seats = countPrior.seats as Record<string, number>;
  const sub = Object.fromEntries(Object.entries(countPrior.subThreshold).filter(([, v]) => typeof v === "number")) as Record<string, number>;
  const other = countPrior.other / 100;
  const below = Object.values(sub).reduce((n, v) => n + v / 100, 0);
  const seated = Object.values(seats).reduce((a, b) => a + b, 0);
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(seats)) out[id] = ((1 - other - below) * n) / seated;
  for (const [id, v] of Object.entries(sub)) out[id] = v / 100;
  out[OTHER] = other;
  return out;
}

/** Double envelopes are drawn mostly by soldiers, diplomats, prisoners and the hospitalised. Reservists (a soldiers'
 * list) are assumed to lean into the envelopes like the 2022 Religious Zionism–Otzma list did (the envelope-heaviest
 * list that year), not like the centre-left pool its locality profile uses. Stated in the method text. */
export const ENVELOPE_PROFILES_2022: ProfileMap = { res: ["ט"] };
export const ENVELOPE_SHARE = 0.11;

const invalidRate2022 = (history.national.voted - history.national.valid) / history.national.voted;
/** Expected final valid votes from the CEC turnout figure (voters at 22:00, less the 2022 invalid rate). */
export const expectedFinalValid = () => Math.round(night.turnout.voters * (1 - invalidRate2022));
/** 2026 roll / 2022 roll, from the CEC turnout figure (voters / percentage). */
export const rollGrowth2026 = () => night.turnout.voters / (night.turnout.pct / 100) / history.national.eligible;

export const BLOCS: Record<string, string> = Object.fromEntries(partyData.parties.map((p) => [p.id, p.bloc]));

export type ProjectionInputs = {
  raw: string;
  /** Current exit-informed snapshot, used only for the coverage-weighted blend; null = count only. */
  snapshot: Pick<LiveForecastSnapshot, "partySeats"> | null;
  draws?: number;
  seed?: number;
  detail?: boolean;
  /** Overrides for validation harnesses. */
  options?: Partial<NowcastOptions>;
};

export function assumptions(r: NowcastResult) {
  const t = r.sectorTurnout;
  return [
    `Expected final valid vote ${expectedFinalValid().toLocaleString("en")} (CEC turnout ${night.turnout.pct}% at 22:00, 2022 invalid rate); roll growth ${rollGrowth2026().toFixed(3)} over 2022.`,
    t ? `Turnout ratio against 2022 by sector from the counted boxes: Arab ${t.arab.toFixed(2)}, Haredi ${t.haredi.toFixed(2)}, other Jewish ${t.jewish.toFixed(2)} localities.` : "",
    `Double envelopes ${Math.round((r.envelopes?.expected ?? 0) / 1000)}k (${(ENVELOPE_SHARE * 100).toFixed(0)}% of the expected vote; 9.6% in 2022, more with reservists mobilised), with each list's 2022 envelope lean; Reservists assumed to lean like the 2022 Religious Zionism–Otzma list (${(r.envelopes?.lean.res ?? 1).toFixed(2)}×).`,
    `Blend with the current exit-informed estimate: count weight ${(r.blend?.weight ?? 1).toFixed(2)} at ${(100 * r.coverage.votes).toFixed(0)}% of the expected vote counted (1.25·c/(c+0.25), 1 at full coverage).`,
    `Prior frozen at ${countPrior.frozenAt} (revision ${countPrior.revision.slice(0, 8)}); per-list swing shrinkage 30k votes (hold-out tuned); 80% intervals and pass probabilities from joint draws of sector turnout, envelope volume and lean, per-list swing and exit-prior error.`,
  ].filter(Boolean);
}

/** Pure projection of a raw expc.csv; the server wrapper adds the stored record's metadata. */
export function countProjection({ raw, snapshot, draws = 300, seed = 26, detail = false, options = {} }: ProjectionInputs): NowcastResult | null {
  const observation = parseLocalities(raw, results.letters);
  if (!observation.localities.length && !observation.envelope.valid) return null;
  return countNowcast({
    history,
    prior: frozenPriorShares(),
    observation,
    threshold: results.threshold,
    agreements: results.agreements.map((a) => a.parties as [string, string]),
    envelopeProfiles: { ...ENVELOPE_PROFILES_2022 },
    rollGrowth: rollGrowth2026(),
    expectedFinalValid: expectedFinalValid(),
    envelopeShare: ENVELOPE_SHARE,
    exitPrior: snapshot ? priorShares(snapshot) : null,
    blocs: BLOCS,
    draws,
    seed,
    detail,
    ...options,
  });
}

export async function getCountEstimate(snapshot: Pick<LiveForecastSnapshot, "partySeats">): Promise<CountEstimate | null> {
  try {
    const record = await readCountRecord();
    if (!record?.raw || record.raw.length > 10_000_000) return null;
    const r = countProjection({ raw: record.raw, snapshot, draws: 300 });
    if (!r) return null;
    const { counted: _c, projected: _p, localities: _l, ...rest } = r;
    void _c;
    void _p;
    void _l;
    return {
      ...rest,
      capturedAt: record.current?.capturedAt ?? null,
      source: "expc",
      priorRevision: countPrior.revision,
      assumptions: assumptions(r),
      method:
        "Counted votes plus each uncounted 2022 locality projected from its own 2022 pattern at tonight's turnout (estimated per sector from the counted boxes and anchored to the CEC turnout figure), reconciled to a prior frozen for the night and adjusted by the per-list swing measured where counting has happened; double envelopes projected as a separate pool with their 2022 lean. Blended with the current exit-informed estimate by a weight that rises with coverage. Prior only below 5% of the expected vote counted.",
    };
  } catch {
    return null;
  }
}
