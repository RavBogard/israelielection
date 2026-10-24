/** Agent R: the field and checks per election under the two Filber rules of backtest/v3.mjs. */
import { elections, setup } from "../../backtest/v3.mjs";
import { forecast } from "../../model.mjs";
for (const e of elections) {
  const fl = e.polls.filter((p) => p.filber).map((p) => `${p.pollster}/${p.firm ?? ""} ${p.published}`);
  if (!fl.length) continue;
  for (const mode of ["poll", "outlet"]) { const f = forecast({ ...setup(e, mode), opts: { runs: 200 } }); console.log(e.key, mode, "field:", f.inputs.field.map((p) => `${p.pollster} ${p.published}`).join(", "), "| checks:", f.inputs.checks.map((p) => `${p.pollster} ${p.published}`).join(", ")); }
}
