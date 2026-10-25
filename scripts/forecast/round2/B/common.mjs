/** Shared pieces for agent B's sector-turnout prototype: gaps, the Arab turnout index, the leave-future-out calibration. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { forecast } from "../../model.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
export const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
export const cal = read(path.join(here, "../../calibration.json"));
export const S = read(path.join(here, "sectors.json"));
const dataDir = path.join(here, "../../backtest/data");
export const elections = fs.readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort().map((f) => read(path.join(dataDir, f)));

/** model.mjs's own field and seats-to-shares, lean/priors/withdrawals off (as round2/D2/gaps.mjs), in points. */
export function pollShares(e) {
  const pollsters = [...new Set(e.polls.map((p) => p.pollster))], filber = [...new Set(e.polls.filter((p) => p.filber).map((p) => p.pollster))];
  const parties = Object.keys(e.lists).map((id) => ({ id, bloc: e.blocs[id] }));
  const f = forecast({ polls: e.polls, config: { pollsters, withoutVariant: { pollsters: filber } }, parties, agreements: e.agreements, cal: { ...cal, elections: [], listPriors: {}, withdrawn: { lists: [] } }, opts: { runs: 100, priors: false, lean: 0, withdrawn: false } });
  return Object.fromEntries(Object.keys(e.lists).map((id) => [id, f.lists[id].share]));
}
/** Arab-list votes per Arab elector relative to general turnout (turnout x loyalty / general). */
export const I = (r) => (r.arabTurnout * r.arabListLoyalty) / r.generalTurnout;
/** Arab turnout relative to general turnout only. */
export const Iturn = (r) => r.arabTurnout / r.generalTurnout;
/** Share s (fraction) scaled by x with everyone else diluted: the change in s. */
export const mech = (s, x) => (s * x) / (s * x + 1 - s) - s;

/** One row per election with a known Arab gap (2013 from sectors.json, 2015-2022 from the backtest data). */
let _rows;
export function arabRows() {
  if (_rows) return _rows;
  _rows = [];
  for (const [i, r] of S.series.entries()) {
    const prev = S.series[i - 1]; let poll, res, har = null;
    if (r.arabGap) { poll = r.arabGap.pollPct; res = r.arabGap.resultPct; }
    else { const e = elections.find((x) => x.key === r.key); if (!e) continue; const ps = pollShares(e); const ar = Object.keys(e.lists).filter((id) => e.blocs[id] === "arab");
      poll = ar.reduce((a, id) => a + ps[id], 0); res = ar.reduce((a, id) => a + (e.result.lists[id]?.pct ?? 0), 0);
      har = { poll: ps.shas + ps.utj, res: e.result.lists.shas.pct + e.result.lists.utj.pct, shasGap: e.result.lists.shas.pct - ps.shas, utjGap: e.result.lists.utj.pct - ps.utj }; }
    _rows.push({ key: r.key, poll, res, gap: res - poll, xI: I(r) / I(prev), xT: Iturn(r) / Iturn(prev), mechI: 100 * mech(poll / 100, I(r) / I(prev)), mechT: 100 * mech(poll / 100, Iturn(r) / Iturn(prev)), har, hc: r.harediCityTurnout, hcPrev: prev.harediCityTurnout, gT: r.generalTurnout, gTprev: prev.generalTurnout });
  }
  return _rows;
}

/**
 * The Arab sector's calibration for an election, from what was known before it (key = the election's yyyy-mm; for
 * 2026 pass "2026-10"). index: I (turnout x loyalty) or Iturn. k: mean-reversion weight fitted on earlier
 * consecutive pairs (least squares, clamped to [0, 1]). alpha: mean of (gap - mech) over earlier elections, shrunk
 * with `shrinkN` pseudo-elections at 0.
 */
export function arabCalibration(key, { index = I, mechKey = "mechI", shrinkN = 2, k: kFixed = null } = {}) {
  const ser = S.series.filter((r) => r.key < key);
  const pairs = []; for (let j = 2; j < ser.length; j++) { const h = ser.slice(0, j).map(index), m = h.reduce((a, b) => a + b, 0) / h.length; pairs.push({ dev: m - index(ser[j - 1]), ch: index(ser[j]) - index(ser[j - 1]) }); }
  const kFit = pairs.length ? Math.max(0, Math.min(1, pairs.reduce((a, p) => a + p.dev * p.ch, 0) / pairs.reduce((a, p) => a + p.dev ** 2, 0))) : 0;
  const k = kFixed ?? kFit;
  const h = ser.map(index), mean = h.reduce((a, b) => a + b, 0) / h.length, last = index(ser[ser.length - 1]);
  const expected = last + k * (mean - last);
  const past = arabRows().filter((r) => r.key < key);
  const resid = past.map((r) => r.gap - r[mechKey]);
  const alphaPts = past.length ? resid.reduce((a, b) => a + b, 0) / (past.length + shrinkN) : 0;
  return { k, mean, last, expected, logShift: Math.log(expected / last), alphaPts, nPast: past.length };
}
