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

function holds(c: Condition, chosen: Party[]): boolean {
  if ("party" in c) return chosen.some((p) => p.id === c.party);
  if ("tag" in c) return chosen.some((p) => p.tags.includes(c.tag));
  if ("all" in c) return c.all.every((x) => holds(x, chosen));
  return c.any.some((x) => holds(x, chosen));
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
  const chosen = parties.filter((p) => selected.has(p.id));
  return rules
    .filter((r) => holds(r.when, chosen))
    .map((r) => ({ id: r.id, kind: r.kind, message: fill(r.message, chosen), source: r.source }));
}
