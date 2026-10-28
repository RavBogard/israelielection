import { ui } from "./i18n/ui";
/**
 * The polls desk: the sentences that head the page and its sections, computed from the polls so a
 * heading states a finding only when the data carries one. Every function is pure and tested.
 */
import { longDate, shortDate } from "./format";
import { blocTotals, seatFigure } from "./polls";
import type { BlocPoint, TrendPoint } from "./trend";
import type { HouseEffect } from "./house-effects";
import type { BlocId, Party, Poll } from "./types";
import type { Lang } from "./i18n";
import { pollsterText } from "./i18n/overlay-text";
import { list } from "./i18n/he-grammar";
import { dayMonthHe, HE_BLOC, HE_FIND as H } from "./i18n/polls";

export const MAJ = 61;
/** The two contenders by their short names, as the bloc race labels them. */
export const BLOC_NAME = { net: "Netanyahu bloc", opp: "Anti-Netanyahu bloc" } as const;
type Two = Record<"net" | "opp", number>;
const signed = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${seatFigure(Math.abs(n))}`;
const times = (k: number) => (k === 1 ? "once" : k === 2 ? "twice" : `${k} times`);
/** Hebrew editions of the findings below: the same computation, the sentence from lib/i18n/polls.ts (HE_FIND). Outlet names through the pollsters overlay. */
const outletHe = (name: string) => pollsterText(name, "he").text;

/** The page's standfirst: whether either bloc reaches 61 in the average. */
export function averageFinding(avg: Two, lang: Lang = "en"): string {
  const at = (["net", "opp"] as const).filter((b) => avg[b] >= MAJ);
  if (lang === "he") return !at.length ? H.averageNone : at.length === 2 ? H.averageBoth : H.averageOne(HE_BLOC[at[0]]);
  if (!at.length) return ui(lang, "Neither bloc reaches 61 in the average.");
  if (at.length === 2) return ui(lang, "Both blocs reach 61 in the average, which the 120 seats cannot hold.");
  return ui(lang, "The {0} reaches 61 in the average.", ui(lang, BLOC_NAME[at[0]]));
}

/** How many current polls put each bloc at 61 or more. */
export function majorityCounts(polls: Poll[], parties: Party[]): Two & { n: number } {
  const t = polls.map((p) => blocTotals(p, parties));
  return { net: t.filter((x) => x.net >= MAJ).length, opp: t.filter((x) => x.opp >= MAJ).length, n: polls.length };
}
export const counterText = (c: Two & { n: number }, lang: Lang = "en") =>
  lang === "he" ? H.counter(HE_BLOC.net, HE_BLOC.opp, H.inPolls(c.net, c.n), H.inPolls(c.opp, c.n)) :
  ui(lang, "61 or more: {0} {1} of {2} {3}, {4} {5} of {6}", ui(lang, BLOC_NAME.net), c.net, c.n, c.n === 1 ? ui(lang, "poll") : ui(lang, "polls"), ui(lang, BLOC_NAME.opp), c.opp, c.n);

/** The bloc race heading: who has led the average, or how often the lead has changed. */
export function raceFinding(trend: Pick<BlocPoint, "date" | "avg">[], lang: Lang = "en"): string {
  if (!trend.length) return lang === "he" ? H.raceNone : ui(lang, "The bloc race");
  const from = shortDate(trend[0].date, lang);
  const lead = trend.map((t) => Math.sign(t.avg.net - t.avg.opp)).filter((s) => s !== 0);
  if (lang === "he") {
    const since = dayMonthHe(trend[0].date);
    if (!lead.length) return H.raceLevel(since);
    if (lead.every((s) => s > 0)) return H.raceLed(HE_BLOC.net, since);
    if (lead.every((s) => s < 0)) return H.raceLed(HE_BLOC.opp, since);
    return H.raceChanges(lead.slice(1).filter((s, i) => s !== lead[i]).length, since);
  }
  if (!lead.length) return ui(lang, "The blocs have been level since {0}", from);
  if (lead.every((s) => s > 0)) return ui(lang, "The {0} has led the average on every date since {1}", ui(lang, BLOC_NAME.net), from);
  if (lead.every((s) => s < 0)) return ui(lang, "The {0} has led the average on every date since {1}", ui(lang, BLOC_NAME.opp), from);
  const changes = lead.slice(1).filter((s, i) => s !== lead[i]).length;
  return ui(lang, "The lead has changed hands {0} since {1}", lang === "en" ? times(changes) : String(changes), from);
}

/** The parties tab heading: the largest list in the average and in how many current polls it leads outright. */
export function leaderFinding(average: Poll, polls: Poll[], parties: Pick<Party, "id" | "name">[], lang: Lang = "en"): string {
  const seats = (p: Poll, id: string) => (p.results[id] && !p.results[id].belowThreshold ? p.results[id].seats : 0);
  const top = [...parties].sort((a, b) => seats(average, b.id) - seats(average, a.id))[0];
  if (!top || !seats(average, top.id)) return lang === "he" ? H.leaderNone : ui(lang, "Every list in every current poll");
  const leads = polls.filter((p) => parties.every((q) => q.id === top.id || seats(p, q.id) < seats(p, top.id))).length;
  if (lang === "he") return leads === polls.length ? H.leaderAll(top.name, polls.length) : H.leaderSome(top.name, leads, polls.length);
  return leads === polls.length ? ui(lang, "{0} leads in all {1} current polls", top.name, polls.length) : ui(lang, "{0} is largest in the average, ahead outright in {1} of {2} current polls", top.name, leads, polls.length);
}

/** The largest move in any list's average from its own first point to its latest, or a plain label when nothing moved a seat. */
export function moverFinding(trends: Map<string, TrendPoint[]>, names: Record<string, string>, from: string, lang: Lang = "en"): string {
  let best: { id: string; d: number; since: string } | null = null;
  for (const [id, t] of trends) { if (t.length < 2) continue; const d = Math.round((t.at(-1)!.avg - t[0].avg) * 10) / 10; if (!best || Math.abs(d) > Math.abs(best.d)) best = { id, d, since: t[0].date }; }
  if (lang === "he") return !best || Math.abs(best.d) < 1 ? H.moverNone(dayMonthHe(from)) : H.mover(names[best.id] ?? best.id, best.d > 0, seatFigure(Math.abs(best.d)), dayMonthHe(best.since));
  if (!best || Math.abs(best.d) < 1) return ui(lang, "No list has moved a full seat in the average since {0}", shortDate(from, lang));
  return ui(lang, "The largest move: {0}, {1} seats since {2}", names[best.id] ?? best.id, signed(best.d), shortDate(best.since, lang));
}

/** The pollsters heading: the pollster with at least `min` polls furthest from the average on the Netanyahu bloc. */
export function leanFinding(rows: HouseEffect[], min = 3, lang: Lang = "en"): string {
  const r = rows.filter((x) => x.n >= min).sort((a, b) => Math.abs(b.gap.net) - Math.abs(a.gap.net))[0];
  if (lang === "he") return !r || Math.abs(r.gap.net) < 0.5 ? H.leanNone : H.lean(outletHe(r.pollster), HE_BLOC.net, seatFigure(Math.abs(r.gap.net)), r.gap.net > 0);
  if (!r || Math.abs(r.gap.net) < 0.5) return ui(lang, "How each pollster leans");
  return ui(lang, "{0} shows the {1} {2} seats {3} the average", r.pollster, ui(lang, BLOC_NAME.net), seatFigure(Math.abs(r.gap.net)), r.gap.net > 0 ? ui(lang, "above") : ui(lang, "below"));
}

/** Where each bloc lands across the current polls. */
export function spreadFinding(polls: Poll[], parties: Party[], lang: Lang = "en"): string {
  if (!polls.length) return lang === "he" ? H.spreadNone : ui(lang, "Where each bloc lands in each current poll");
  const t = polls.map((p) => blocTotals(p, parties));
  const span = (b: BlocId) => { const xs = t.map((x) => x[b]); const lo = Math.min(...xs), hi = Math.max(...xs); return lang === "he" ? H.span(lo, hi) : lo === hi ? `${lo}` : ui(lang, "{0} to {1}", lo, hi); };
  if (lang === "he") return H.spread(polls.length, HE_BLOC.net, span("net"), HE_BLOC.opp, span("opp"));
  return ui(lang, "Across the {0} current polls the {1} runs {2}, the {3} {4}", polls.length, ui(lang, BLOC_NAME.net), span("net"), ui(lang, BLOC_NAME.opp), span("opp"));
}

/** The alternative average's effect on the Netanyahu bloc. */
export function variantFinding(main: Two, variant: Two, left: string[], lang: Lang = "en"): string {
  const d = Math.round((variant.net - main.net) * 10) / 10, who = left.join(ui(lang, " and "));
  if (lang === "he") { const w = list(left.map(outletHe)); return Math.abs(d) < 0.1 ? H.variantNone(w, HE_BLOC.net) : H.variant(w, HE_BLOC.net, seatFigure(variant.net), seatFigure(Math.abs(d)), d < 0); }
  if (Math.abs(d) < 0.1) return ui(lang, "Leaving out {0} does not move the {1}", who, ui(lang, BLOC_NAME.net));
  return ui(lang, "Without {0} the {1} has {2}, {3} {4}", who, ui(lang, BLOC_NAME.net), seatFigure(variant.net), seatFigure(Math.abs(d)), d < 0 ? ui(lang, "fewer") : ui(lang, "more"));
}

/** The copyable citation for the average. */
export const citeText = (avg: Two, n: number, date: string, url?: string, lang: Lang = "en") =>
  lang === "he" ? H.cite(n, longDate(date, "he"), HE_BLOC.net, seatFigure(avg.net), HE_BLOC.opp, seatFigure(avg.opp), url ?? "https://www.israelielection.org/he/polls") :
  ui(lang, "Israel Votes, polling average of {0} current polls as of {1}: {2} {3}, {4} {5} of 120 seats. {6}", n, longDate(date, lang), ui(lang, BLOC_NAME.net), seatFigure(avg.net), ui(lang, BLOC_NAME.opp), seatFigure(avg.opp), url ?? "https://www.israelielection.org/polls");

export const DESK_TABS = [
  { id: "parties", label: "Parties" },
  { id: "pollsters", label: "Pollsters" },
  { id: "every-poll", label: "Every poll" },
  { id: "method", label: "Method" },
] as const;
export type DeskTab = (typeof DESK_TABS)[number]["id"];
/** Shared links into the poll browser or the sensitivity tool open the tab that holds them. */
const QUERY_TAB: Record<string, DeskTab> = { from: "every-poll", to: "every-poll", pollster: "every-poll", party: "every-poll", with: "method", window: "method", weight: "method", exclude: "method", synthetic: "method" };
/** The tab a URL opens: ?tab=, then a hash naming a tab, then the tool a query belongs to, else Parties. A hash inside a panel is resolved in the page. */
export function initialTab(search: string, hash: string): DeskTab {
  const q = new URLSearchParams(search), ids = DESK_TABS.map((t) => t.id) as string[];
  const tab = q.get("tab"), h = hash.replace(/^#/, "");
  if (tab && ids.includes(tab)) return tab as DeskTab;
  if (ids.includes(h)) return h as DeskTab;
  for (const k of q.keys()) if (QUERY_TAB[k]) return QUERY_TAB[k];
  return "parties";
}
