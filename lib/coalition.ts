import type { BlocId, Condition, Party, PledgeRule, Poll, Tag } from "./types";

export const MAJORITY = 61;
export const KNESSET = 120;

export type Segment = { seats: number; bloc: BlocId; name: string };

export type Tally = {
  total: number;
  segments: Segment[];
  chosen: Party[];
  /** Explains seats a poll reported only for a group of parties; empty when not relevant. */
  groupNote: string;
  /** True when a chosen party's seats are unknown, so the total is a floor. */
  partial: boolean;
};

const joinAnd = (names: string[]) => names.join(" and ");

export function tally(selected: Set<string>, parties: Party[], poll: Poll): Tally {
  const chosen = parties.filter((p) => selected.has(p.id));
  const segments: Segment[] = [];
  const unknown: Party[] = [];
  let total = 0;
  for (const p of chosen) {
    const r = poll.results[p.id];
    if (!r) {
      unknown.push(p);
      continue;
    }
    total += r.seats;
    if (r.seats > 0) segments.push({ seats: r.seats, bloc: p.bloc, name: p.name });
  }
  let groupNote = "";
  let partial = false;
  for (const g of poll.combined) {
    const inGroup = unknown.filter((p) => g.parties.includes(p.id));
    if (!inGroup.length) continue;
    const groupNames = joinAnd(g.parties.map((id) => parties.find((p) => p.id === id)?.name ?? id));
    if (inGroup.length === g.parties.length) {
      total += g.seats;
      segments.push({ seats: g.seats, bloc: inGroup[0].bloc, name: inGroup.map((p) => p.name).join(" + ") });
      groupNote = `${poll.pollster} did not split ${groupNames}. With both in, the total counts their combined ${g.seats} seats (${g.note}).`;
    } else {
      partial = true;
      const missing = joinAnd(inGroup.map((p) => p.name));
      groupNote = `${poll.pollster} did not report ${missing} separately, so this total leaves out ${missing}'s seats. Add both ${groupNames} to count their combined ${g.seats}.`;
    }
  }
  // Averages carry one decimal; round so 60.99999… never misses the 61 line.
  return { total: Math.round(total * 10) / 10, segments, chosen, groupNote, partial };
}

/** `chosen` is every list a rule reads; `cabinet` (default: the same) is what a {cabinet: id} leaf reads. */
export function holds(c: Condition, chosen: Party[], cabinet: Party[] = chosen): boolean {
  if ("party" in c) return chosen.some((p) => p.id === c.party);
  if ("cabinet" in c) return cabinet.some((p) => p.id === c.cabinet);
  if ("tag" in c) return chosen.some((p) => p.tags.includes(c.tag));
  if ("all" in c) return c.all.every((x) => holds(x, chosen, cabinet));
  return c.any.some((x) => holds(x, chosen, cabinet));
}

/** The chosen parties a holding rule names: by id or tag, through the branches that hold. */
export function implicated(c: Condition, chosen: Party[], cabinet: Party[] = chosen): string[] {
  if ("party" in c) return chosen.some((p) => p.id === c.party) ? [c.party] : [];
  if ("cabinet" in c) return cabinet.some((p) => p.id === c.cabinet) ? [c.cabinet] : [];
  if ("tag" in c) return chosen.filter((p) => p.tags.includes(c.tag)).map((p) => p.id);
  const parts = "all" in c ? c.all : c.any.filter((x) => holds(x, chosen, cabinet));
  return [...new Set(parts.flatMap((x) => implicated(x, chosen, cabinet)))];
}

/** Each pledge warning with the chosen parties its rule names, so a figure can mark them. */
export function pledgeConflicts(selected: Set<string>, parties: Party[], rules: PledgeRule[]): { warning: Warning; ids: string[] }[] {
  return supportedPledgeConflicts(selected, new Set(), parties, rules);
}

/**
 * Pledge conflicts for a cabinet with outside support. A rule marked `support` reads the cabinet plus its
 * outside support (a pledge not to rely on, or prop up, a government); every other rule reads the cabinet
 * alone (a pledge not to sit with). {cabinet: id} always reads the cabinet only.
 */
export function supportedPledgeConflicts(cabinet: Set<string>, support: Set<string>, parties: Party[], rules: PledgeRule[]): { warning: Warning; ids: string[] }[] {
  return supportedWarnings(cabinet, support, parties, rules, true);
}

function supportedWarnings(cabinet: Set<string>, support: Set<string>, parties: Party[], rules: PledgeRule[], pledgesOnly = false) {
  const cab = parties.filter((p) => cabinet.has(p.id));
  const all = parties.filter((p) => cabinet.has(p.id) || support.has(p.id));
  return rules
    .filter((r) => !pledgesOnly || r.kind === "pledge")
    .map((r) => ({ r, chosen: r.support ? all : cab }))
    .filter(({ r, chosen }) => holds(r.when, chosen, cab))
    .map(({ r, chosen }) => ({ warning: { id: r.id, kind: r.kind, message: fill(r.message, chosen), source: r.source } as Warning, ids: implicated(r.when, chosen, cab) }));
}

/** Fills {and:tag1,tag2} and {comma:tag} with the chosen parties carrying those tags, tag by tag. */
function fill(template: string, chosen: Party[]): string {
  return template.replace(/\{(and|comma):([\w,]+)\}/g, (_, how: string, tags: string) => {
    const names = tags
      .split(",")
      .flatMap((t) => chosen.filter((p) => p.tags.includes(t as Tag)))
      .map((p) => p.name);
    return how === "and" ? joinAnd(names) : names.join(", ");
  });
}

export type Warning = { id: string; kind: PledgeRule["kind"]; message: string; source: string };

export function warnings(selected: Set<string>, parties: Party[], rules: PledgeRule[]): Warning[] {
  return supportedWarnings(selected, new Set(), parties, rules).map((x) => x.warning);
}

/** Warnings for a cabinet with outside support, read as in supportedPledgeConflicts. */
export function warningsWithSupport(cabinet: Set<string>, support: Set<string>, parties: Party[], rules: PledgeRule[]): Warning[] {
  return supportedWarnings(cabinet, support, parties, rules).map((x) => x.warning);
}
