// model-g.mjs with default options must reproduce model.mjs exactly: the six backtest elections and 2026.   node check-repro.mjs
import { forecast as f2 } from "../../model.mjs";
import { forecast as fg } from "./model-g.mjs";
import { elections, runOpts, inputs2026 } from "./common.mjs";
let bad = 0;
for (const e of elections) if (JSON.stringify(f2(runOpts(e, { runs: 5000 }))) !== JSON.stringify(fg(runOpts(e, { runs: 5000 })))) { bad++; console.log("DIFF", e.key); }
if (JSON.stringify(f2(inputs2026({ runs: 20000 }))) !== JSON.stringify(fg(inputs2026({ runs: 20000 })))) { bad++; console.log("DIFF 2026"); }
console.log(bad ? `${bad} differ` : "model-g.mjs (defaults) == model.mjs on the six elections and on 2026");
