/** Agent R: Netanyahu-bloc point (list sum vs median) against the result, per election and seed, v2 and v3. */
import { elections, setup } from "../../backtest/v3.mjs";
import { forecast } from "../../model.mjs";
const SEEDS = [20261027, 1, 2, 3, 4];
for (const [name, opts] of Object.entries({ v2: { v2: true }, v3: {} })) {
  const rows = [];
  for (const e of elections) {
    const act = Object.keys(e.lists).filter((id) => e.blocs[id] === "net").reduce((a, id) => a + (e.result.lists[id]?.seats ?? 0), 0);
    const r = SEEDS.map((seed) => { const f = forecast({ ...setup(e), opts: { runs: 10000, seed, ...opts } }); return [f.blocs.net.listSum, f.blocs.net.median, Object.values(f.blocs).reduce((a, b) => a + b.median, 0)]; });
    rows.push({ e: e.key, actual: act, listSum: r.map((x) => x[0]).join("/"), median: r.map((x) => x[1]).join("/"), sumOfBlocMedians: r.map((x) => x[2]).join("/") });
  }
  console.log(name); console.table(rows);
}
