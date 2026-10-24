/** Q2. Calibration of version 2, leave-future-out: interval coverage, P(pass) Brier and reliability, PIT of list
 *  and bloc seat counts, majority probabilities.   node calib.mjs [runs] [v2|v3]   (default 10000 v2; about 3 s) */
import { forecast } from "./model-g.mjs";
import { elections, runOpts, score, summarise, mulberry } from "./common.mjs";
import { V3 } from "./v3.mjs";
const RUNS = Number(process.argv[2]) || 10_000, VAR = process.argv[3] ?? "v2", OPTS = VAR === "v3" ? V3 : {};
const rng = mulberry(7);
const ss = elections.map((e) => score(e, forecast(runOpts(e, { runs: RUNS, keepRuns: true, ...OPTS })), rng));
console.table([{ variant: VAR, ...summarise(ss) }]);
const it = ss.flatMap((s) => s.items.map((x) => ({ ...x, key: s.key })));
// Coverage by list class.
const cls = { "safe (P(pass) ≥ 0.95)": (x) => x.pPass >= 0.95, "threshold (0.05 < P < 0.95)": (x) => x.pPass > 0.05 && x.pPass < 0.95, "out (≤ 0.05)": (x) => x.pPass <= 0.05 };
console.log("\n90% and 50% interval coverage by class:");
for (const [k, f] of Object.entries(cls)) { const m = it.filter(f); console.log(`  ${k}: n=${m.length}, 90% ${(m.filter((x) => x.y >= x.lo90 && x.y <= x.hi90).length / m.length).toFixed(2)}, 50% ${(m.filter((x) => x.y >= x.lo50 && x.y <= x.hi50).length / m.length).toFixed(2)}, mean width90 ${(m.reduce((a, x) => a + x.hi90 - x.lo90, 0) / m.length).toFixed(1)}`); }
console.log("\nCoverage by election (90% lists): " + ss.map((s) => `${s.key} ${(s.items.filter((x) => x.y >= x.lo90 && x.y <= x.hi90).length)}/${s.items.length}`).join(", "));
console.log("Misses outside 90%: " + it.filter((x) => !(x.y >= x.lo90 && x.y <= x.hi90)).map((x) => `${x.key} ${x.id} ${x.y} [${x.lo90},${x.hi90}] P=${x.pPass.toFixed(2)}`).join("; "));
// PIT histogram for safe lists (continuous enough).
const safe = it.filter((x) => x.pPass >= 0.95), H = Array(5).fill(0); for (const x of safe) H[Math.min(4, Math.floor(x.pit * 5))]++;
console.log(`\nPIT of safe lists in fifths (uniform = ${(safe.length / 5).toFixed(1)} each): ${H.join(" ")}; |PIT−0.5| mean ${(safe.reduce((a, x) => a + Math.abs(x.pit - 0.5), 0) / safe.length).toFixed(3)} (uniform 0.25)`);
// Standardised errors (result − mean)/sd-equivalent of safe lists: share of |z|>1.645.
// Reliability of P(pass).
console.log("\nP(pass) reliability (all 71 lists):");
const bins = [[0, 0.05], [0.05, 0.35], [0.35, 0.65], [0.65, 0.95], [0.95, 1.01]];
for (const [lo, hi] of bins) { const m = it.filter((x) => x.pPass >= lo && x.pPass < hi); if (!m.length) continue; console.log(`  [${lo}, ${hi}): n=${m.length}, mean P ${(m.reduce((a, x) => a + x.pPass, 0) / m.length).toFixed(2)}, passed ${(m.filter((x) => x.passed).length)}/${m.length}  ${m.filter((x) => x.pPass > 0.05 && x.pPass < 0.95).map((x) => `${x.key} ${x.id} ${x.pPass.toFixed(2)}${x.passed ? "✓" : "✗"}`).join(", ")}`); }
// Blocs.
console.log("\nBlocs (seats): result, 90% interval, simulated sd, PIT:");
for (const s of ss) console.log(`  ${s.key}  ` + s.blocItems.map((b) => `${b.b} ${b.y} [${b.lo90},${b.hi90}] sd ${b.sd.toFixed(1)} pit ${b.pit.toFixed(2)}`).join("  "));
console.log("\nMajority: " + ss.map((s) => `${s.key} outcome ${s.outcome}; P(net≥61) ${s.P.net.toFixed(3)} P(opp≥61) ${s.P.oppZionist.toFixed(3)} Brier ${s.brier.toFixed(3)}`).join("\n          "));
