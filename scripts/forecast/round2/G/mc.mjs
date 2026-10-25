/** Q4. Monte Carlo sensitivity of the yardstick: v2's per-list error under different run counts and seeds.
 *  node mc.mjs */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, score, summarise } from "./common.mjs";
const rows = [];
for (const runs of [2000, 10_000, 20_000, 50_000]) for (const seed of [20261027, 1, 2, 3]) {
  const ss = elections.map((e) => score(e, forecast(runOpts(e, { runs, seed }))));
  const s = summarise(ss); rows.push({ runs, seed, listMAE: s.listMAE, netErr: s.netErr, blocErr: s.blocErr, wrong: s.wrong, majBrier: s.majBrier, perElection: ss.map((x) => x.listErr.toFixed(2)).join(" ") });
}
console.table(rows);
