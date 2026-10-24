/** v2 against agent G's v3 noise on the 2026 polls in data/polls.json (through 2026-10-22), 50,000 runs.
 *  node run2026.mjs */
import { forecast } from "./model-g.mjs";
import { inputs2026 } from "./common.mjs";
import { V3 } from "./v3.mjs";
const a = forecast(inputs2026({ keepRuns: true })), b = forecast(inputs2026({ keepRuns: true, ...V3 }));
console.log("v2 parameters:", JSON.stringify({ lean: a.parameters.leanSeats, resid: a.parameters.historicalResidualSeats, blocSd: a.parameters.blocSdSeats }));
console.log("v3 parameters:", JSON.stringify(b.parameters.v3));
const sd = (arr) => { const n = arr.length, m = arr.reduce((x, y) => x + y, 0) / n; return Math.sqrt(arr.reduce((x, y) => x + (y - m) ** 2, 0) / n).toFixed(2); };
console.table(Object.fromEntries(["net", "opp", "mid", "arab"].map((k) => [k, { "v2 point": a.blocs[k].point, "v2 median": a.blocs[k].median, "v2 90%": `${a.blocs[k].lo}-${a.blocs[k].hi}`, "v2 sd": sd(a.blocRuns[k]), "v3 point": b.blocs[k].point, "v3 median": b.blocs[k].median, "v3 90%": `${b.blocs[k].lo}-${b.blocs[k].hi}`, "v3 sd": sd(b.blocRuns[k]) }])));
console.log("majority v2:", JSON.stringify(a.majority), " v3:", JSON.stringify(b.majority));
console.table(Object.fromEntries(Object.keys(a.lists).map((id) => [id, { "v2 share": a.lists[id].share, "v3 share": b.lists[id].share, "v2 point": a.lists[id].point, "v3 point": b.lists[id].point, "v2 90%": `${a.lists[id].lo}-${a.lists[id].hi}`, "v3 90%": `${b.lists[id].lo}-${b.lists[id].hi}`, "v2 P(pass)": a.lists[id].passes, "v3 P(pass)": b.lists[id].passes }])));
