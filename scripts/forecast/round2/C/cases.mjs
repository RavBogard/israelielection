/**
 * Round 2, agent C: the case table. For every list in every election in scripts/forecast/backtest/data/ (or
 * data-full/ when CDATA=full), the version-2 field share (model-c.mjs `fieldShare`: the 7-day latest-per-outlet
 * field, Filber firms out, D'Hondt midpoints, the 1.5% fringe) at the newest poll, 7 and 14 days earlier, the result,
 * and the list's class. Writes ./cases.json and prints the table.   node scripts/forecast/round2/C/cases.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { allElections as elections, run, asOf, CLASSES, here, FULL } from "./common.mjs";
/** First run as a new list (round1/C-threshold.md's eight, 2015-2022 subset), and first solo runs of a list that had sat inside a joint list. */
export const NEW = { "2013-01": ["otzma", "amshalem", "hatnuah", "ya"], "2015-03": ["yachad", "kulanu"], "2019-04": ["nr", "zehut", "gesher", "bw"], "2019-09": ["du"], "2020-03": [], "2021-03": ["nep", "nh"], "2022-11": ["nu"] };
export const SOLO = { "2013-01": [], "2015-03": [], "2019-04": [], "2019-09": ["otzma", "yamina"], "2020-03": [], "2021-03": ["rz", "yamina"], "2022-11": ["jh", "balad"] };
const out = [];
for (const e of elections) {
  const f0 = run(e, { runs: 100 });
  const f7 = run(e, { runs: 100 }, asOf(e.polls, 7));
  const f14 = run(e, { runs: 100 }, asOf(e.polls, 14));
  const f28 = FULL ? run(e, { runs: 100 }, asOf(e.polls, 28)) : null;
  const field = f0.inputs.field;
  for (const id of Object.keys(e.lists)) {
    const r = e.result.lists[id];
    const below = field.filter((p) => { const x = e.polls.find((q) => q.id === p.id).results[id]; return x && (x.belowThreshold || x.seats === 0); }).length;
    out.push({
      key: e.key, id, name: e.lists[id], bloc: e.blocs[id],
      isNew: NEW[e.key].includes(id), isSolo: SOLO[e.key].includes(id), arab: e.blocs[id] === "arab",
      prior: CLASSES[e.key][id] ?? 0,
      share: +(f0.fieldShare[id] * 100).toFixed(3), share7: +(f7.fieldShare[id] * 100).toFixed(3), share14: +(f14.fieldShare[id] * 100).toFixed(3), share28: f28 ? +(f28.fieldShare[id] * 100).toFixed(3) : null, threshold: (e.threshold ?? 0.0325) * 100,
      nField: field.length, nBelow: below,
      result: +r.pct.toFixed(3), passed: r.passed, seats: r.seats,
      v2pass: f0.lists[id].passes, v2point: f0.lists[id].point,
    });
  }
}
fs.writeFileSync(path.join(here, FULL ? "cases-full.json" : "cases.json"), JSON.stringify(out, null, 1) + "\n");
const rows = out.filter((c) => c.share >= 1.5 && c.share <= 8.5).sort((a, b) => a.share - b.share);
console.table(rows.map((c) => ({ el: c.key, id: c.id, bloc: c.bloc, cls: c.isNew ? "new" : c.isSolo ? "solo" : c.arab ? "arab" : "", field: c.share.toFixed(2), d7: (c.share - c.share7).toFixed(2), d14: (c.share - c.share14).toFixed(2), below: `${c.nBelow}/${c.nField}`, result: c.result.toFixed(2), miss: (c.result - c.share).toFixed(2), passed: c.passed, v2pass: c.v2pass })));
