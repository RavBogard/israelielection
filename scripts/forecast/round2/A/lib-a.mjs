/**
 * ROUND 2, AGENT A: shared helpers for the house-effect study (docs/research/polls-method/round2/A-house-effects.md).
 *   canonFirm(poll, election)  -> canonical firm key (the primary unit; outlets switch firms)
 *   pollShares(poll, ids)      -> vote shares by list, D'Hondt midpoint as model.mjs step 2 (lists in combined cells left out)
 *   classesOf(election, field) -> list id -> class (likud, haredi, arab, oppLargest, small, netOther, other)
 *   deviations(election)       -> per poll: shares minus the contemporaneous field mean of the other firms
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
export const here = path.dirname(fileURLToPath(import.meta.url));
export const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const THRESHOLD = 0.0325, KNESSET = 120;
export const pctOf = (s) => { if (s == null) return null; const x = parseFloat(String(s).replace(/[<>~%\s]/g, "")); return Number.isFinite(x) ? (String(s).includes("<") ? x / 2 : x) / 100 : null; };

/** Firm strings as printed (backtest data and data/polls.json) -> one key per polling company / lineage. */
export const FIRM_MAP = {
  "midgam": "midgam", "midgam/ipanel": "midgam", "midgam r&c": "midgam",                       // Mano Geva's Midgam (Channel 2/12, Yedioth, Walla, Galei Tzahal)
  "panel project hamidgam": "hamidgam", "panel project hamidgam/statnet": "hamidgam",             // Midgam Project (Channel 13, 2019-20)
  "mp+tm+sn+a": "hamidgam",                                                                       // 2026 Channel 13 consortium (Midgam Project + theMadad + Stat-Net + Askaria): partial lineage
  "panels": "panels", "panels politics": "panels",                                                // Menachem Lazar's Panels Politics
  "lri+p4a": "panels", "lazar": "panels",                                                         // 2026: Lazar Research Institute + Panel4All: same person, new institute (lineage, not identity)
  "tns": "kantar", "kantar": "kantar",
  "smith": "smith",
  "maagar mochot": "maagar", "maagar mohot": "maagar",
  "dialog": "fuchs", "camil fuchs": "fuchs",                                                       // Camil Fuchs ran Dialog's polls (Haaretz, Channel 10) and later Channel 13's
  "direct polls": "direct",
  "sf+nd": "nextdata", "next data / filber": "nextdata",
  "tatika": "tatika", "yossi tatika": "tatika",
  "teleseker": "kantar", "geocartography": "geocartography", "miskar": "miskar", "shvakim panorama": "shvakim", "tri": "tri",
  "ipanel": "midgam", "new wave": "newwave", "tns-teleseker": "kantar",                           // Teleseker became TNS-Teleseker, then TNS, then Kantar
};
import { canonFirm as canon } from "./model-a.mjs";
/** The firm of a poll (model-a.mjs canonFirm with FIRM_MAP): printed firm, else patterns, else the outlet's one firm. */
export const canonFirm = (p, polls) => canon(p, polls, FIRM_MAP);
/** The outlet as a unit (for the firm-vs-outlet comparison): spelling variants and renamed channels merged. */
const OUTLETS = [[/channel 2|channel 12|news company|mako/, "channel 12"], [/channel 10|ten news|channel 13/, "channel 13"], [/kan|channel 1\b|channel1|reshet bet/, "kan"], [/walla/, "walla"], [/maariv|jerusalem post|jpost/, "maariv"], [/103/, "103fm"], [/israel hayom/, "israel hayom"], [/yedi|ynet/, "yedioth"], [/haaretz/, "haaretz"], [/knesset/, "knesset channel"], [/channel 14|channel 20/, "channel 14"], [/makor rishon/, "makor rishon"], [/globes/, "globes"], [/galei tzahal|army radio/, "galei tzahal"]];
export function canonOutlet(p) { const t = String(p.pollster ?? "").toLowerCase(); for (const [re, o] of OUTLETS) if (re.test(t)) return o; return "outlet:" + t; }
export const isImputed = (p) => !p.firm;

/** Shares as model.mjs step 2, simplified: below-threshold lists keep their printed share (else 2%); passing lists the midpoint. */
export function pollShares(p, ids) {
  const s = {}; let below = 0; const pass = [];
  for (const [id, r] of Object.entries(p.results)) {
    if (r.belowThreshold || r.seats === 0) { const v = pctOf(r.pct) ?? 0.02; below += v; if (ids.includes(id)) s[id] = v; }
    else pass.push([id, r.seats]);
  }
  const comb = (p.combined ?? []).map((c) => [c.parties.join("|"), c.seats]);
  const all = [...pass, ...comb]; if (!all.length) return s;
  const P = 1 - below;
  let lam = P / all.reduce((a, [, k]) => a + k + 0.5, 0);
  const at = (k) => (Math.max(THRESHOLD, k * lam) + (k + 1) * lam) / 2;
  for (let it = 0; it < 60; it++) lam *= P / all.reduce((a, [, k]) => a + at(k), 0);
  for (const [id, k] of pass) if (ids.includes(id)) s[id] = at(k);
  return s; // lists inside a combined cell are absent: their deviation is not measured
}

export const CLASS_NAMES = ["likud", "haredi", "arab", "oppLargest", "small", "netOther", "other"];
/** Class of each list. `mean` = the field's mean share by list (knowable before the vote; not the result). */
export function classesOf(blocs, mean) {
  const ids = Object.keys(blocs), c = {};
  const opp = ids.filter((id) => blocs[id] === "opp").sort((a, b) => (mean[b] ?? 0) - (mean[a] ?? 0));
  for (const id of ids) {
    if (id === "likud") c[id] = "likud";
    else if (id === "shas" || id === "utj") c[id] = "haredi";
    else if (blocs[id] === "arab") c[id] = "arab";
    else if (id === opp[0]) c[id] = "oppLargest";
    else if ((mean[id] ?? 0) < 0.05) c[id] = "small";
    else if (blocs[id] === "net") c[id] = "netOther";
    else c[id] = "other";
  }
  return c;
}
/** Summed classes (a class total moves) vs per-list classes (each small list moves by the effect). */
export const SUM_CLASSES = ["likud", "haredi", "arab", "oppLargest", "netOther", "other"];

const day = (d) => Date.parse(d) / 864e5;
/**
 * Deviation of every poll from the contemporaneous field: the mean, firm by firm, of the OTHER firms' polls within
 * ±win days (each firm's polls averaged first, then the firms equally). The reference leaves out the Filber firms
 * (as model.mjs leaves them out of the field) and needs at least `minRef` other firms.
 * Returns [{ poll, firm, imputed, dev: {list: pts}, cls: {class: pts}, net: pts }]; points = vote-share percentage points.
 */
export function deviations(e, { win = 5, minRef = 2, days = Infinity, unit = "firm" } = {}) {
  const ids = Object.keys(e.lists);
  const lastDay = day(e.election);
  const polls = e.polls.filter((p) => p.kind !== "exit" && !/election results/i.test(p.pollster + " " + p.firm) && lastDay - day(p.published) <= days).map((p) => ({ p, firm: unit === "outlet" ? canonOutlet(p) : canonFirm(p, e.polls), s: pollShares(p, ids), t: day(p.published) }));
  // the field mean over the whole set (for the class split): equal firm weight
  const fieldMean = meanByFirm(polls.filter((x) => !x.p.filber), ids);
  const cls = classesOf(e.blocs, fieldMean);
  const out = [];
  for (const x of polls) {
    const ref = polls.filter((y) => y.firm !== x.firm && !y.p.filber && Math.abs(y.t - x.t) <= win);
    if (new Set(ref.map((y) => y.firm)).size < minRef) continue;
    const R = meanByFirm(ref, ids);
    const dev = {}; for (const id of ids) if (x.s[id] != null && R[id] != null) dev[id] = (x.s[id] - R[id]) * 100;
    const cd = {};
    for (const c of CLASS_NAMES) {
      const m = ids.filter((id) => cls[id] === c); if (!m.length) continue;
      if (!m.every((id) => id in dev)) continue;
      cd[c] = SUM_CLASSES.includes(c) ? m.reduce((a, id) => a + dev[id], 0) : m.reduce((a, id) => a + dev[id], 0) / m.length;
    }
    const net = ids.filter((id) => e.blocs[id] === "net");
    const netDev = net.every((id) => id in dev) ? net.reduce((a, id) => a + dev[id], 0) : null;
    out.push({ poll: x.p, firm: x.firm, imputed: isImputed(x.p), filber: !!x.p.filber, dev, cls: cd, net: netDev });
  }
  return { rows: out, classes: cls, fieldMean };
}
export function meanByFirm(xs, ids) {
  const by = {}; for (const x of xs) (by[x.firm] ??= []).push(x.s);
  const firmMeans = Object.values(by).map((ss) => { const m = {}; for (const id of ids) { const v = ss.map((s) => s[id]).filter((v) => v != null); if (v.length) m[id] = v.reduce((a, b) => a + b, 0) / v.length; } return m; });
  const R = {}; for (const id of ids) { const v = firmMeans.map((m) => m[id]).filter((v) => v != null); if (v.length) R[id] = v.reduce((a, b) => a + b, 0) / v.length; }
  return R;
}
/** The elections: data-full/ when present (and complete), else the 28-day files. */
export function loadElections(which = "auto") {
  const d28 = path.join(here, "../../backtest/data"), dfull = path.join(here, "../../backtest/data-full");
  // data-full counts as ready when it holds the six backtest elections and each has polls in its final 28 days
  const ready = () => { if (!fs.existsSync(dfull)) return false; const fsx = fs.readdirSync(dfull).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)); if (fsx.length < 6) return false;
    return fsx.every((f) => { try { const e = read(path.join(dfull, f)); return e.polls.some((p) => Date.parse(e.election) - Date.parse(p.published) <= 28 * 864e5 && Date.parse(p.published) <= Date.parse(e.election)); } catch { return false; } }); };
  const useFull = which === "full" || (which === "auto" && ready());
  const dir = useFull ? dfull : d28;
  const es = fs.readdirSync(dir).filter((f) => /^\d{4}-\d{2}\.json$/.test(f)).sort().map((f) => read(path.join(dir, f)));
  return { source: useFull ? "data-full" : "data", elections: es };
}

/**
 * Firm-election means: for each election, firm and key (a list id, a class, or "net"), the mean deviation over the
 * firm's polls, the number of polls, and the pooled within-firm-election variance by key (for the standard errors).
 */
export function firmElectionMeans(elections, opts = {}) {
  const cells = []; // { key: election key, firm, kind: "list"|"class"|"net", id, d, k }
  const resid = {}; // kind:id -> [sumsq, dof]
  for (const e of elections) {
    const { rows } = deviations(e, opts);
    const by = {}; for (const r of rows) (by[r.firm] ??= []).push(r);
    for (const [firm, rs] of Object.entries(by)) {
      const add = (kind, id, vals) => {
        if (!vals.length) return; const m = vals.reduce((a, b) => a + b, 0) / vals.length;
        cells.push({ election: e.key ?? e.election.slice(0, 7), firm, kind, id, d: m, k: vals.length, filber: rs[0].filber, imputed: rs.every((r) => r.imputed) });
        const R = (resid[kind + ":" + id] ??= [0, 0]); for (const v of vals) R[0] += (v - m) ** 2; R[1] += vals.length - 1;
      };
      const lids = new Set(rs.flatMap((r) => Object.keys(r.dev)));
      for (const id of lids) add("list", id, rs.map((r) => r.dev[id]).filter((v) => v != null));
      for (const c of CLASS_NAMES) add("class", c, rs.map((r) => r.cls[c]).filter((v) => v != null));
      add("net", "net", rs.map((r) => r.net).filter((v) => v != null));
    }
  }
  const within = Object.fromEntries(Object.entries(resid).map(([k, [ss, df]]) => [k, df > 0 ? ss / df : null]));
  return { cells, within };
}

/**
 * Empirical-Bayes shrinkage, firm by firm and key by key:
 *   d_fe = μ_f + η_fe + ε_fe,   μ_f ~ N(0, τ²) (the persistent house effect), η_fe ~ N(0, ω²) (this election's drift),
 *   ε_fe ~ N(0, σ²/k) (poll noise).  τ² = mean over firms of the products d_fe·d_fe' of two different elections
 *   (only the persistent part survives the product); ω² = var(d) − τ² − mean σ²/k. Posterior mean
 *   μ̂_f = Σ(d/v) / (Σ(1/v) + 1/τ²), v = ω² + σ²/k. τ² ≤ 0 → every μ̂ = 0 (no persistent effect to find).
 */
export function shrink(cells, within, { minElections = 1, extraShrink = 1 } = {}) {
  const groups = {}; for (const c of cells) (groups[c.kind + ":" + c.id] ??= []).push(c);
  const out = {}; const hyper = {};
  for (const [key, cs] of Object.entries(groups)) {
    const byFirm = {}; for (const c of cs) (byFirm[c.firm] ??= []).push(c);
    let sp = 0, np = 0;
    for (const xs of Object.values(byFirm)) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) { sp += xs[i].d * xs[j].d; np++; }
    const sig2 = within[key] ?? 0;
    const tot = cs.reduce((a, c) => a + c.d * c.d, 0) / cs.length;
    const noise = cs.reduce((a, c) => a + sig2 / c.k, 0) / cs.length;
    const tau2 = np ? sp / np : 0;
    const omega2 = Math.max(0, tot - Math.max(tau2, 0) - noise);
    hyper[key] = { tau2, omega2, sig2, pairs: np, cells: cs.length, rms: Math.sqrt(tot) };
    for (const [firm, xs] of Object.entries(byFirm)) {
      const n = new Set(xs.map((x) => x.election)).size;
      const raw = xs.reduce((a, x) => a + x.d, 0) / xs.length;
      let est = 0, sd = Math.sqrt(Math.max(tau2, 0)), B = 1;
      if (tau2 > 0 && n >= minElections) {
        let a = 0, w = 0; for (const x of xs) { const v = omega2 + sig2 / x.k; a += x.d / v; w += 1 / v; }
        est = (a / (w + 1 / tau2)) * extraShrink; sd = Math.sqrt(1 / (w + 1 / tau2)); B = (1 / tau2) / (w + 1 / tau2);
      }
      const se = Math.sqrt(xs.reduce((a, x) => a + omega2 + sig2 / x.k, 0)) / xs.length;
      (out[firm] ??= { elections: 0 }); out[firm].elections = Math.max(out[firm].elections, n);
      const [kind, id] = key.split(":");
      ((out[firm][kind] ??= {}))[id] = { raw: r3(raw), se: r3(se), n, shrunk: r3(est), postSd: r3(sd), shrinkToZero: r3(B), byElection: Object.fromEntries(xs.map((x) => [x.election, r3(x.d)])) };
    }
  }
  return { firms: out, hyper: Object.fromEntries(Object.entries(hyper).map(([k, h]) => [k, Object.fromEntries(Object.entries(h).map(([a, b]) => [a, typeof b === "number" ? r3(b) : b]))])) };
}
export const r3 = (x) => Math.round(x * 1000) / 1000;
