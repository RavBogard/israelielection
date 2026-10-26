import { allocate, parseExpc } from "../results";
import { splitCsv, type VoteMapElection } from "../votemap";
export type LocalityCount = { code: number; eligible: number; voted: number; valid: number; votes: Record<string, number>; envelope: boolean };
/** Reuses the strict public parser before retaining locality rows. A corrected complete snapshot replaces the previous one. */
export function parseLocalitySnapshot(csv: string, letters: Record<string, string>): LocalityCount[] {
  parseExpc(csv);
  const { head, rows } = splitCsv(csv), col = (s: string) => head.indexOf(s), valid = col("כשרים");
  const unknown = head.slice(valid + 1).filter((l) => !(l in letters));
  if (unknown.some((l) => rows.some((r) => Number(r[col(l)]) > 0))) throw new Error("Unmapped official ballot letters");
  return rows.map((r) => ({ code: Number(r[col("סמל ישוב")]), eligible: Number(r[col("בזב")]), voted: Number(r[col("מצביעים")]), valid: Number(r[valid]), votes: Object.fromEntries(head.slice(valid + 1).filter((l) => l in letters).map((l) => [letters[l], Number(r[col(l)])])), envelope: /^9{4,5}$/.test(r[col("סמל ישוב")]) }));
}
export type ProfileMap = Record<string, string[]>;
// Continuing lists retain their profiles. New/split lists use the pooled historical bloc, never a fabricated exact predecessor.
export const PROFILES_2022: ProfileMap = {
  likud: ["מחל"], shas: ["שס"], utj: ["ג"], yb: ["ל"], raam: ["עם"],
  otzma: ["מחל", "ט", "שס", "ג"], rz: ["מחל", "ט", "שס", "ג"], poi: ["מחל", "ט", "שס", "ג"], noam: ["מחל", "ט", "שס", "ג"],
  yashar: ["פה", "כן", "אמת", "מרצ", "ל"], byachad: ["פה", "כן", "אמת", "מרצ", "ל"], dem: ["אמת", "מרצ"], bw: ["פה", "כן", "אמת", "מרצ", "ל"], res: ["פה", "כן", "אמת", "מרצ", "ל"], jl: ["ום", "ד"],
};
export function historicalProfiles(history: VoteMapElection, prior: Record<string, number>, mapping: ProfileMap = PROFILES_2022) {
  const ids = Object.keys(prior), nationalValid = history.rows.reduce((n, r) => n + r[3], 0);
  const rows = history.rows.map((r) => {
    const scores = Object.fromEntries(ids.map((id) => {
      const columns = mapping[id]; if (!columns?.length) throw new Error(`Historical profile missing: ${id}`);
      const indices = columns.map((l) => history.lists.findIndex((x) => x.letters === l));
      if (indices.some((i) => i < 0)) throw new Error("Historical list missing");
      return [id, Math.max(1e-8, indices.reduce((n, i) => n + r[4 + i], 0) / Math.max(1, r[3]))];
    }));
    return { code: r[0], expectedValid: r[3], scores };
  });
  // Iterative proportional fitting: preserve local contrasts and reconcile the weighted national prior.
  const priorTotal = Object.values(prior).reduce((a, b) => a + b, 0);
  for (let iteration = 0; iteration < 100; iteration++) {
    for (const r of rows) { const sum = Object.values(r.scores).reduce((a, b) => a + b, 0); for (const id of ids) r.scores[id] /= sum; }
    const totals = Object.fromEntries(ids.map((id) => [id, rows.reduce((n, r) => n + r.expectedValid * r.scores[id], 0) / nationalValid]));
    for (const r of rows) for (const id of ids) r.scores[id] *= (prior[id] / priorTotal) / totals[id];
  }
  return rows;
}
function rng(seed: number) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
/** Research-only count nowcast. Publication remains blocked until real source semantics and replay are validated.
 * priorDraws carry national uncertainty. Counts replace reported votes; partial rows require explicit station coverage.
 * Nothing interprets eligible voters of reporting places as percent counted.
 */
export function geographicReplay({ history, counts, priorDraws, blocs, agreements, coverage = {}, profileMap = PROFILES_2022, envelopeComplete = false, seed = 26 }: { history: VoteMapElection; counts: LocalityCount[]; priorDraws: Record<string, number>[]; blocs: Record<string, string>; agreements: [string, string][]; coverage?: Record<number, { countedStations: number; totalStations: number }>; profileMap?: ProfileMap; envelopeComplete?: boolean; seed?: number }) {
  const random = rng(seed), normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, random()))) * Math.cos(2 * Math.PI * random());
  const reported = new Map(counts.filter((c) => !c.envelope).map((c) => [c.code, c]));
  const known = new Set(history.rows.map((r) => r[0]));
  if ([...reported.keys()].some((id) => !known.has(id))) throw new Error("New locality requires profile mapping");
  for (const c of counts) if (c.valid < 0 || Math.abs(Object.values(c.votes).reduce((a,b)=>a+b,0) - c.valid) > 1e-6) throw new Error("Invalid locality snapshot");
  const draws = priorDraws.map((prior) => {
    const profiles = historicalProfiles(history, prior, profileMap), ids = Object.keys(prior);
    const votes = Object.fromEntries(ids.map((id) => [id, 0]));
    const turnout = Math.exp(.08 * normal()), blocError = Object.fromEntries([...new Set(Object.values(blocs))].map((id) => [id, .12 * normal()]));
    for (const profile of profiles) {
      const actual = reported.get(profile.code), stations = coverage[profile.code];
      if (actual && (!stations || stations.countedStations < 0 || stations.totalStations <= 0 || stations.countedStations > stations.totalStations)) throw new Error("Partial locality coverage semantics required");
      const fraction = actual ? stations.countedStations / stations.totalStations : 0;
      const localityError = .15 * normal();
      const weights = Object.fromEntries(ids.map((id) => [id, profile.scores[id] * Math.exp((blocError[blocs[id]] ?? 0) + localityError * (blocs[id] === "net" ? 1 : -1))]));
      const sum = Object.values(weights).reduce((a,b)=>a+b,0);
      // The unreported stations may differ: do not expand a partial locality's observed party shares to its full size.
      const remaining = profile.expectedValid * turnout * (1 - fraction);
      for (const id of ids) votes[id] += (actual?.votes[id] ?? 0) + remaining * weights[id] / sum;
    }
    const envelope = counts.filter((c) => c.envelope), envelopeValid = envelope.reduce((n,c)=>n+c.valid,0);
    // No envelope coverage metadata is verified: carry broad remaining-envelope uncertainty and retain actual votes.
    const remainingEnvelopes = envelopeComplete ? 0 : Math.max(0, history.envelopes.valid * turnout * Math.exp(.2 * normal()) - envelopeValid);
    const sum = Object.values(prior).reduce((a,b)=>a+b,0);
    for (const id of ids) votes[id] += envelope.reduce((n,c)=>n+(c.votes[id] ?? 0),0) + remainingEnvelopes * prior[id] / sum;
    const valid = Object.values(votes).reduce((a,b)=>a+b,0);
    return allocate(votes, valid, .0325, agreements).seats;
  });
  return { draws, publicationEligible: false as const, gate: "verified_station_coverage_or_completed_locality_flags_required" as const };
}
