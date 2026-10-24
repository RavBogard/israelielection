/** Round 2, agent F: scoring of a forecast-shaped object against a backtest election (backtest/v2.mjs's columns plus
 *  P(pass) Brier and 90% coverage). Probabilities are read exactly from the draws when present. */
import { MAJ } from "./ensemble.mjs";
export const BLOCS = ["net", "opp", "mid", "arab"];
export function actualBlocs(e) { const t = { net: 0, opp: 0, mid: 0, arab: 0 }; for (const id of Object.keys(e.lists)) t[e.blocs[id]] += e.result.lists[id]?.seats ?? 0; return t; }
/** rng: a seeded uniform for the randomised PIT. */
export function score(e, f, rng = Math.random) {
  const lists = Object.keys(e.lists), res = e.result.lists, y = (id) => res[id]?.seats ?? 0;
  const listErr = lists.reduce((a, id) => a + Math.abs((f.lists[id]?.point ?? 0) - y(id)), 0) / lists.length;
  const act = actualBlocs(e);
  const sum = Object.fromEntries(BLOCS.map((b) => [b, lists.filter((id) => e.blocs[id] === b).reduce((a, id) => a + (f.lists[id]?.point ?? 0), 0)]));
  const med = Object.fromEntries(BLOCS.map((b) => [b, f.blocs[b].median]));
  const own = Object.fromEntries(BLOCS.map((b) => [b, f.blocs[b].point]));
  const be = (pt) => ({ net: Math.abs(pt.net - act.net), mean: BLOCS.reduce((a, b) => a + Math.abs(pt[b] - act[b]), 0) / 4 });
  const pPass = (id) => (f.raw?.passRate?.[id] ?? (f.lists[id]?.passes ?? 0) / 100);
  const wrong = lists.filter((id) => (pPass(id) >= 0.5) !== !!res[id]?.passed).length;
  const passBrier = lists.reduce((a, id) => a + (pPass(id) - (res[id]?.passed ? 1 : 0)) ** 2, 0);
  const outcome = act.net >= MAJ ? "net" : act.opp >= MAJ ? "oppZionist" : "neither";
  const n61 = f.raw?.net61 ?? f.majority.net / 100, o61 = f.raw?.opp61 ?? f.majority.oppZionist / 100;
  const P = { net: n61, oppZionist: o61, neither: 1 - n61 - o61 };
  const top = Object.entries(P).sort((a, b) => b[1] - a[1])[0][0];
  const majBrier = Object.entries(P).reduce((a, [k, v]) => a + (v - (k === outcome ? 1 : 0)) ** 2, 0);
  const out = { key: e.key, n: lists.length, listErr, own: be(own), sum: be(sum), med: be(med), wrong, modal: top === outcome, majBrier, passBrier,
    cov90: lists.filter((id) => y(id) >= Math.round(f.lists[id].lo) && y(id) <= Math.round(f.lists[id].hi)).length, signed: Object.fromEntries(lists.map((id) => [id, (f.lists[id]?.point ?? 0) - y(id)])),
    shareErr: Object.fromEntries(lists.map((id) => [id, (f.lists[id]?.share ?? 0) - (res[id]?.pct ?? 0)])) };
  if (f._draws) {
    const R = f._draws.seatRuns[lists[0]].length;
    let pit90 = 0, eabs = 0;
    for (const id of lists) {
      const arr = f._draws.seatRuns[id]; let lt = 0, eq = 0, ea = 0; const yy = y(id);
      for (let i = 0; i < R; i++) { const n = arr[i]; if (n < yy) lt++; else if (n === yy) eq++; ea += Math.abs(n - yy); }
      const pit = (lt + rng() * eq) / R; if (pit >= 0.05 && pit <= 0.95) pit90++; eabs += ea / R;
    }
    const arr = f._draws.blocRuns.net; let lt = 0, eq = 0, ss = 0, s2 = 0;
    for (let i = 0; i < R; i++) { const n = arr[i]; if (n < act.net) lt++; else if (n === act.net) eq++; ss += n; s2 += n * n; }
    Object.assign(out, { pit90, crps: eabs / lists.length, netPIT: (lt + rng() * eq) / R, netSd: Math.sqrt(s2 / R - (ss / R) ** 2), netIn90: act.net >= f.blocs.net.lo && act.net <= f.blocs.net.hi });
  }
  return out;
}
/** Mean over elections (and seeds: pass an array of per-seed arrays). */
export function summarise(perSeed) {
  const S = perSeed.flat(), k = perSeed.length, m = (g) => S.reduce((a, s) => a + g(s), 0) / S.length, N = S.reduce((a, s) => a + s.n, 0);
  const D = S.filter((s) => s.pit90 != null), has = D.length === S.length, ND = D.reduce((a, s) => a + s.n, 0);
  return { listMAE: m((s) => s.listErr), netErr: m((s) => s.own.net), blocErr: m((s) => s.own.mean), netErrSum: m((s) => s.sum.net), netErrMed: m((s) => s.med.net), blocErrMed: m((s) => s.med.mean),
    wrong: S.reduce((a, s) => a + s.wrong, 0) / k, modal: S.filter((s) => s.modal).length / k, majBrier: m((s) => s.majBrier), passBrier: S.reduce((a, s) => a + s.passBrier, 0) / N,
    cov90: S.reduce((a, s) => a + s.cov90, 0) / N, pit90: has ? D.reduce((a, s) => a + s.pit90, 0) / ND : null, crps: has ? m((s) => s.crps) : null, netSd: has ? m((s) => s.netSd) : null, netIn90: has ? S.filter((s) => s.netIn90).length / k : null,
    perElection: perSeed[0].map((s) => s.listErr.toFixed(2)).join(" ") };
}
export const fmt = (name, r) => ({ variant: name, listMAE: r.listMAE.toFixed(3), netErr: r.netErr.toFixed(2), blocErr: r.blocErr.toFixed(2), "net(med)": r.netErrMed.toFixed(2), "bloc(med)": r.blocErrMed.toFixed(2),
  wrong: +r.wrong.toFixed(1), modal: r.modal.toFixed(1) + "/6", majBrier: r.majBrier.toFixed(3), passBrier: r.passBrier.toFixed(4), cov90: (100 * r.cov90).toFixed(0) + "%", pit90: r.pit90 == null ? "" : (100 * r.pit90).toFixed(0) + "%", crps: r.crps == null ? "" : r.crps.toFixed(3), netSd: r.netSd == null ? "" : r.netSd.toFixed(1), perElection: r.perElection });
