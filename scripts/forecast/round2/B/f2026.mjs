/**
 * The 2026 forecast (polls through Oct 22, data/polls.json at 9796c34) under version 2 and under agent B's sector
 * turnout term with different centres for 2026 Arab turnout.   node scripts/forecast/round2/B/f2026.mjs [runs]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast } from "./model-b.mjs";
import { arabCalibration, S } from "./common.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, "../../../..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
const RUNS = Number(process.argv[2]) || 20_000;
const { polls, config } = read("data/polls.json");
const parties = (read("data/parties.json").parties ?? read("data/parties.json")).map((p) => ({ id: p.id, bloc: p.bloc }));
const results = read("data/results.json");
const agreements = [...results.agreements, ...(results.unconfirmedAgreements ?? [])].map((a) => a.parties);
const cal = read("scripts/forecast/calibration.json");
const raw = forecast({ polls, config, parties, agreements, cal, opts: { runs: 200, priors: false, lean: 0 } }).lists;
const St = raw.jl.share + raw.raam.share, Ss = raw.jl.share;
const c = arabCalibration("2026-10");
const last = S.series.at(-1), L = last.arabListLoyalty;
const sectorFor = (logShiftSector, sdLog = 0.12) => ({ name: "arab", lists: ["jl"], logShift: Math.log(Math.max(0.3, 1 + (Math.exp(logShiftSector) - 1) * St / Ss)), alphaPts: 0, sdLog: (sdLog * St) / Ss, replacesPriors: true });
const centreI = (TA, TG = 71, loyalty = L) => (TA * loyalty) / TG;
const variants = [
  ["v2", {}, null],
  ["B2, history-only centre (reversion: I = " + c.expected.toFixed(3) + ")", { sectorTurnout: true }, sectorFor(c.logShift)],
  ...[53.2, 55, 57, 60, 63].map((TA) => [`B2, Arab turnout centred ${TA}% (general 71%, loyalty ${L})`, { sectorTurnout: true }, sectorFor(Math.log(centreI(TA) / c.last))]),
  ...[[57, 0.7], [60, 0.7]].map(([TA, b]) => [`B2, ${TA}% centre x pass-through ${b}${TA === 57 ? " (recommended)" : ""}`, { sectorTurnout: true }, sectorFor(b * Math.log(centreI(TA) / c.last), 0.14)]),
  ["B2, 57% centre, sdLog 0.16", { sectorTurnout: true }, sectorFor(Math.log(centreI(57) / c.last), 0.16)],
];
console.log(`2026: polled Arab share ${St.toFixed(2)}% (jl ${raw.jl.share}%, raam ${raw.raam.share}%); 2022 index I = ${c.last.toFixed(3)}, historical mean ${c.mean.toFixed(3)}, k ${c.k}; history-only logShift ${c.logShift.toFixed(3)}; sector alpha (not used in B2) ${c.alphaPts.toFixed(2)} pts`);
const rows = [];
for (const [name, opts, sector] of variants) {
  const f = forecast({ polls, config, parties, agreements, cal: { ...cal, sectorTurnout: { sectors: sector ? [sector] : [] } }, opts: { runs: RUNS, ...opts } });
  rows.push({ variant: name, logShiftJL: sector ? sector.logShift.toFixed(3) : "-", jl: `${f.lists.jl.point} (${f.lists.jl.share}%)`, raam: `${f.lists.raam.point} (${f.lists.raam.passes}%)`, arab: `${f.blocs.arab.point} [${f.blocs.arab.lo}-${f.blocs.arab.hi}]`, net: `${f.blocs.net.point} [${f.blocs.net.lo}-${f.blocs.net.hi}]`, opp: f.blocs.opp.point, mid: f.blocs.mid.point, "P(net>=61)": f.majority.net, "P(opp>=61)": f.majority.oppZionist, "P(opp+mid+arab>=61)": f.majority.oppWithArabAndMid, changed: Object.entries(f.lists).filter(([, l]) => l.point).map(([id, l]) => `${id} ${l.point}`).join(" ") });
}
console.table(rows.map(({ changed, ...r }) => r));
for (const r of rows) console.log(r.variant.padEnd(70), r.changed);
