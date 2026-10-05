import { byNewest, pollTotal } from "./polls";
import type { Poll, PollsConfig } from "./types";

export const KNESSET_SEATS = 120;

export type Problem = { poll: string; rule: string; detail: string };

/** A stable key for "the same poll": publisher + publication date. */
export const pollKey = (p: Pick<Poll, "pollster" | "published">) => `${p.pollster}|${p.published}`;

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The machine gate on poll data (plan §Dynamic updates). Checks each candidate poll against
 * the rules and against the same pollster's previous reading in `existing`. An empty result
 * means the candidates may be merged without a human.
 */
export function validatePolls(
  candidates: Poll[],
  existing: Poll[],
  config: PollsConfig,
  partyIds: Set<string>,
  today: string
): Problem[] {
  const problems: Problem[] = [];
  const all = [...existing, ...candidates].sort(byNewest);
  const keys = new Set(existing.map(pollKey));
  for (const p of candidates) {
    const label = `${p.pollster}, ${p.published}`;
    const bad = (rule: string, detail: string) => problems.push({ poll: label, rule, detail });

    if (keys.has(pollKey(p))) bad("duplicate", "A poll with this pollster and date is already in the file.");
    keys.add(pollKey(p));

    if (!config.pollsters.includes(p.pollster)) bad("pollster", `"${p.pollster}" is not on the pollster whitelist.`);

    if (!ISO.test(p.published) || Number.isNaN(Date.parse(p.published))) bad("date", `Publication date "${p.published}" is not an ISO date.`);
    else if (p.published < config.dissolved) bad("date", `Published before the Knesset dissolved (${config.dissolved}).`);
    else if (p.published > today) bad("date", "Publication date is in the future.");
    if (!p.fieldwork) bad("fieldwork", "Fieldwork date is missing.");

    const total = pollTotal(p);
    if (total !== KNESSET_SEATS) bad("sum", `Seats add up to ${total}, not ${KNESSET_SEATS}.`);

    const ids = [...Object.keys(p.results), ...p.combined.flatMap((c) => c.parties)];
    for (const id of ids) if (!partyIds.has(id)) bad("party", `Unknown party id "${id}".`);

    for (const [id, r] of Object.entries(p.results)) {
      if (!Number.isInteger(r.seats) || r.seats < 0) bad("seats", `${id}: seats must be a whole number ≥ 0 (got ${r.seats}).`);
      else if (r.seats > 0 && r.seats < 4) bad("seats", `${id}: ${r.seats} seats is below the 4-seat minimum a list can win.`);
      if (r.belowThreshold && r.seats !== 0) bad("threshold", `${id}: flagged below threshold but given ${r.seats} seats.`);
    }

    // Compare with the same pollster's previous poll.
    const prev = all.find((q) => q.pollster === p.pollster && q.published < p.published);
    if (prev) {
      for (const [id, r] of Object.entries(p.results)) {
        const before = prev.results[id];
        if (!before) continue;
        const move = Math.abs(r.seats - before.seats);
        if (move > config.maxSeatMove)
          bad("move", `${id} moved ${move} seats (${before.seats} → ${r.seats}) since ${p.pollster}'s ${prev.published} poll; limit ${config.maxSeatMove}.`);
      }
    }
  }
  return problems;
}
