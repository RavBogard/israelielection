/**
 * ROUND 2, AGENT A: the 2026 forecast (data/polls.json, the 62 polls through Oct 22) under model-a.mjs with and
 * without the all-history house effects, and the 2026 firms' own within-campaign house effects beside their record.
 *   node scripts/forecast/round2/A/run2026.mjs [runs] [--he=house-effects.json]
 */
import path from "node:path";
import { forecast } from "./model-a.mjs";
import { here, read, deviations, canonFirm } from "./lib-a.mjs";
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=")[1] : d; };
const RUNS = Number(process.argv[2]) || 50_000;
const root = path.join(here, "../../../..");
const HE = read(arg("he", path.join(here, "house-effects.json")));
const { polls, config } = read(path.join(root, "data/polls.json"));
const parties = (read(path.join(root, "data/parties.json")).parties).map((p) => ({ id: p.id, bloc: p.bloc }));
const results = read(path.join(root, "data/results.json"));
const cal = read(path.join(root, "scripts/forecast/calibration.json"));
const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
const T = HE.tables.all.firms;

// 1. Which 2026 firms have a record
console.log(`house effects: ${HE.source}, trained on ${HE.tables.all.trainedOn.join(", ")}`);
const firms26 = {}; for (const p of polls) { const f = canonFirm(p, polls); (firms26[f] ??= { outlets: new Set(), n: 0 }); firms26[f].outlets.add(p.pollster); firms26[f].n++; }
console.log("\n| 2026 firm (canonical) | outlets | polls | elections of record | shrunk effect: net | likud | haredi | arab | oppLargest | other |\n|---|---|---|---|---|---|---|---|---|---|");
for (const [f, v] of Object.entries(firms26)) { const h = T[f]; const c = h?.class ?? {}; const x = (y) => (y == null ? "—" : (y >= 0 ? "+" : "−") + Math.abs(y).toFixed(2)); console.log(`| ${f} | ${[...v.outlets].join(", ")} | ${v.n} | ${h?.elections ?? 0} | ${x(h?.net)} | ${x(c.likud)} | ${x(c.haredi)} | ${x(c.arab)} | ${x(c.oppLargest)} | ${x(c.other)} |`); }

// 2. 2026 within-campaign effects (same definition) vs the record
const filber = new Set(config.withoutVariant.pollsters);
// lists most polls report (Noam and the withdrawn Blue and White are absent from most, which would void every class sum)
const common = parties.filter((p) => polls.filter((q) => q.results[p.id]).length >= polls.length / 2);
const e26 = { key: "2026-10", election: "2026-10-27", lists: Object.fromEntries(common.map((p) => [p.id, p.id])), blocs: Object.fromEntries(common.map((p) => [p.id, p.bloc])), polls: polls.map((p) => ({ ...p, filber: filber.has(p.pollster) })) };
const { rows, classes } = deviations(e26, { win: HE.windowDays });
console.log("\n2026 classes:", JSON.stringify(classes));
const by = {}; for (const r of rows) (by[r.firm] ??= []).push(r);
console.log("\n| 2026 firm | polls | 2026 effect: net | likud | haredi | arab | oppLargest | small | other | record: net | record: haredi |\n|---|---|---|---|---|---|---|---|---|---|---|");
const m = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null; const x = (y) => (y == null ? "—" : (y >= 0 ? "+" : "−") + Math.abs(y).toFixed(2));
for (const [f, rs] of Object.entries(by)) console.log(`| ${f} | ${rs.length} | ${x(m(rs.map((r) => r.net).filter((v) => v != null)))} | ` + ["likud", "haredi", "arab", "oppLargest", "small", "other"].map((c) => x(m(rs.map((r) => r.cls[c]).filter((v) => v != null)))).join(" | ") + ` | ${x(T[f]?.net)} | ${x(T[f]?.class?.haredi)} |`);

// 2b. Does the record predict 2026? firm × class pairs (record shrunk, 2026 observed), firms with a record
for (const withFilber of [false, true]) {
  const pairs = []; for (const [f, rs] of Object.entries(by)) { if (!T[f] || (!withFilber && f === "direct")) continue; for (const c of ["likud", "haredi", "arab", "oppLargest", "other"]) { const o = m(rs.map((r) => r.cls[c]).filter((v) => v != null)); const h = T[f].class?.[c]; if (o != null && h != null && h !== 0) pairs.push([h, o]); } const o = m(rs.map((r) => r.net).filter((v) => v != null)); if (o != null && T[f].net) pairs.push([T[f].net, o]); }
  const agree = pairs.filter(([h, o]) => Math.sign(h) === Math.sign(o)).length;
  const mx = m(pairs.map((p) => p[0])), my = m(pairs.map((p) => p[1]));
  const r = pairs.reduce((a, [h, o]) => a + (h - mx) * (o - my), 0) / Math.sqrt(pairs.reduce((a, [h]) => a + (h - mx) ** 2, 0) * pairs.reduce((a, [, o]) => a + (o - my) ** 2, 0));
  const rmsNone = Math.sqrt(m(pairs.map(([, o]) => o * o))), rmsCorr = Math.sqrt(m(pairs.map(([h, o]) => (o - h) ** 2)));
  console.log(`\nrecord vs 2026 (${withFilber ? "with" : "without"} Direct Polls): ${pairs.length} firm×class cells, sign agreement ${agree}/${pairs.length}, r = ${r.toFixed(2)}; rms 2026 deviation ${rmsNone.toFixed(2)} → ${rmsCorr.toFixed(2)} after subtracting the record`);
}

// 3. The forecast under each switch
const V = {
  "v2 (no house effects)": {},
  "A: per-class, shrunk (all history)": { houseEffects: { table: T, firmMap: HE.firmMap, mode: "class" } },
  "A: per-list, shrunk": { houseEffects: { table: T, firmMap: HE.firmMap, mode: "list" } },
  "A: Netanyahu bloc only, shrunk": { houseEffects: { table: T, firmMap: HE.firmMap, mode: "net" } },
  "A: per-class, firms with 3+ elections": { houseEffects: { table: T, firmMap: HE.firmMap, mode: "class", minElections: 3 } },
};
const ids = parties.map((p) => p.id).filter((id) => id !== "bw");
console.log(`\n${RUNS} runs\n| variant | net / opp / mid / arab | P(net ≥ 61) | ` + ids.join(" | ") + " | net share of field (pts) | applied (net pts per poll) |\n|---|---|---|" + ids.map(() => "---").join("|") + "|---|---|");
for (const [k, opts] of Object.entries(V)) {
  const f = forecast({ polls, config, parties, agreements, cal, opts: { runs: RUNS, ...opts } });
  const netShare = ids.filter((id) => parties.find((p) => p.id === id).bloc === "net").reduce((a, id) => a + (f.lists[id]?.share ?? 0), 0);
  console.log(`| ${k} | ${f.blocs.net.point} / ${f.blocs.opp.point} / ${f.blocs.mid.point} / ${f.blocs.arab.point} | ${f.majority.net}% | ` + ids.map((id) => `${f.lists[id]?.point ?? "—"}${f.lists[id] ? ` (${f.lists[id].passes}%)`.replace(/ \(100%\)/, "") : ""}`).join(" | ") + ` | ${netShare.toFixed(2)} | ${f.inputs.houseEffects.map((h) => h.pollster + " " + (h.applied ? (h.netPoints >= 0 ? "+" : "") + h.netPoints : "none")).join(", ") || "—"} |`);
}
