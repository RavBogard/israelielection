/**
 * Loader for scripts/forecast/backtest/data-full/<key>.json (agent D1, round 2).
 *
 *   import { loadFull, KEYS } from "../D1/load.mjs";
 *   const e = loadFull("2021-03", { since: "dissolved", mapInto: true, finalOnly: true });
 *
 * opts.since      "dissolved" | "previousElection" (default) | "YYYY-MM-DD": keep polls published on or after it.
 * opts.mapInto    true: fold component ids into the final list they merged into (`otherLists[id].into`); seats are
 *                 summed, a component printed below the threshold adds 0 seats, and a combined cell whose parties
 *                 all fold into one list becomes that list. Ids with into = null are kept as they are.
 * opts.finalOnly  true: drop polls that still report any id outside `lists` after mapping (pre-merger polls).
 * opts.dropParty  true (default): drop polls commissioned by a party ("Labor (party)", "Yisrael Beiteinu (party)").
 * The returned object is the file with `polls` replaced; nothing else is changed.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KEYS = ["2013-01", "2015-03", "2019-04", "2019-09", "2020-03", "2021-03", "2022-11"];
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../backtest/data-full");

export function foldPoll(p, file) {
  const into = (id) => file.otherLists?.[id]?.into ?? id;
  const results = {}, combined = [];
  const add = (t, r, own) => {
    if (!results[t]) { results[t] = own ? { ...r } : r.seats > 0 ? { seats: r.seats } : { seats: 0, belowThreshold: true }; return; }
    const s = results[t].seats + r.seats;   // two parts of one list in one poll: sum (a printed % is dropped)
    results[t] = s > 0 ? { seats: s } : { seats: 0, belowThreshold: true };
  };
  for (const [id, r] of Object.entries(p.results)) add(into(id), r, into(id) === id);
  for (const c of p.combined ?? []) {
    const ts = [...new Set(c.parties.map(into))];
    if (ts.length === 1) add(ts[0], { seats: c.seats }, false);
    else combined.push({ parties: ts, seats: c.seats });
  }
  return { ...p, results, combined };
}

export function loadFull(key, opts = {}) {
  const f = JSON.parse(fs.readFileSync(path.join(DIR, `${key}.json`), "utf8"));
  const since = opts.since === "dissolved" ? f.dissolved : opts.since && opts.since !== "previousElection" ? opts.since : f.previousElection;
  let polls = f.polls.filter((p) => p.published >= since);
  if (opts.dropParty !== false) polls = polls.filter((p) => !/\(party\)$/.test(p.pollster));
  if (opts.mapInto) polls = polls.map((p) => foldPoll(p, f));
  if (opts.finalOnly) polls = polls.filter((p) => Object.keys(p.results).every((id) => id in f.lists) && (p.combined ?? []).every((c) => c.parties.every((id) => id in f.lists)));
  return { ...f, polls };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const k of KEYS) {
    const all = loadFull(k), fin = loadFull(k, { mapInto: true, finalOnly: true }), finD = loadFull(k, { since: "dissolved", mapInto: true, finalOnly: true });
    console.log(`${k}: ${all.polls.length} polls; ${fin.polls.length} report final lists only after folding components (${finD.polls.length} since dissolution)`);
  }
}
