import { average, byNewest, currentPolls, isExit, pollWeights } from "./polls";
import { allocate } from "./results";
import type { Poll, PollsConfig } from "./types";
export type Weighting = "sqrt" | "equal";

/** Complete selection sums only; partial combined/missing reports never masquerade as zero. */
export function selectedPollTotal(poll: Poll, selected: string[]) {
  const wanted = new Set(selected);
  const covered = new Set<string>();
  let total = 0;
  for (const id of wanted) if (poll.results[id]) { total += poll.results[id].seats; covered.add(id); }
  const combined: string[][] = [];
  for (const group of poll.combined) {
    const members = group.parties.filter((id) => wanted.has(id));
    if (members.length === group.parties.length && group.parties.every((id) => !covered.has(id))) {
      total += group.seats; group.parties.forEach((id) => covered.add(id)); combined.push(group.parties);
    }
  }
  const missing = [...wanted].filter((id) => !covered.has(id));
  return { total: Math.round(total * 10) / 10, complete: missing.length === 0 && wanted.size > 0, missing, combined };
}

/** Window is anchored before exclusions, so hiding the newest publisher does not shift time. */
export function sensitivityPool(polls: Poll[], config: PollsConfig, days: number, excluded: string[]) {
  const campaigns = polls.filter((p) => !isExit(p) && config.pollsters.includes(p.pollster)).sort(byNewest);
  const anchor = campaigns[0]?.published ?? "";
  const recent = currentPolls(campaigns, { ...config, currentWindowDays: days });
  return { polls: recent.filter((p) => !excluded.includes(p.pollster)), anchor, eligible: recent };
}

export function effectiveWeights(polls: Poll[], weighting: Weighting) {
  const known = polls.map((p) => p.n).filter((n): n is number => typeof n === "number" && n > 0).sort((a, b) => a - b);
  const middle = known.length >> 1;
  const fallback = known.length ? known.length % 2 ? known[middle] : (known[middle - 1] + known[middle]) / 2 : null;
  const weights = weighting === "sqrt" ? pollWeights(polls) : new Map(polls.map((p) => [p, 1]));
  return polls.map((poll) => ({ poll, weight: weights.get(poll)!, usedN: weighting === "sqrt" ? poll.n && poll.n > 0 ? poll.n : fallback : null, imputed: weighting === "sqrt" && !(poll.n && poll.n > 0) }));
}

export function sensitivityAverages(polls: Poll[], ids: string[], weighting: Weighting) {
  const weights = effectiveWeights(polls, weighting);
  const rows = ids.map((id) => {
    const baseline = average(id, polls);
    if (!baseline) return { id, average: null };
    if (weighting === "sqrt") return { id, average: baseline };
    const passing = polls.filter((p) => p.results[id] && p.results[id].seats > 0 && !p.results[id].belowThreshold);
    const raw = passing.length ? passing.reduce((sum, p) => sum + p.results[id].seats, 0) / passing.length : 0;
    return { id, average: { ...baseline, avg: raw, seats: baseline.k === 0 || baseline.nearThreshold ? 0 : raw } };
  });
  const rawSum = rows.reduce((sum, row) => sum + (row.average?.seats ?? 0), 0);
  const scale = rawSum > 120 ? 120 / rawSum : 1;
  return { rows: rows.map((row) => ({ ...row, normalized: row.average ? Math.round(row.average.seats * scale * 10) / 10 : null })), rawSum, scale, weights };
}

/** Entirely fictional vote shares; never derives vote share or uncertainty from real seat polls. */
export function syntheticThresholdSeats(smallShare: number) {
  const share = Math.max(2.5, Math.min(4.5, smallShare));
  const votes = { A: 31000, B: 19000, C: 15000, D: 35000 - Math.round(share * 1000), E: Math.round(share * 1000) };
  const allocation = allocate(votes, 100000, 0.0325, []);
  return { votes, seats: allocation.seats, coalition: (allocation.seats.A ?? 0) + (allocation.seats.B ?? 0), passed: allocation.passing.includes("E") };
}

/** Slider values are explicitly synthetic, never derived from real poll estimates. */
export function readSyntheticShare(input:string|null):number {const value=Number(input);return input!==null&&Number.isFinite(value)&&value>=2.5&&value<=4.5?Math.round(value*10)/10:3.2;}
export function writeSensitivityView(base:URLSearchParams,settings:{selected:string[];days:number;weighting:Weighting;excluded:string[];fiction:number}):URLSearchParams {
 const next=new URLSearchParams(base);next.set("with",settings.selected.join(","));next.set("window",String(settings.days));next.set("weight",settings.weighting);next.set("synthetic",String(readSyntheticShare(String(settings.fiction))));if(settings.excluded.length)next.set("exclude",settings.excluded.join(","));else next.delete("exclude");return next;
}
