import type { Lang } from "./i18n";
import builder, { type BuilderText } from "./i18n/builder";
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

/** The words of a tally's group note in another edition: the phrasebook (lib/i18n/builder.ts), party names and the pollster's name. */
export type TallyText = { P: Pick<BuilderText, "groupSplit" | "groupPartial">; name: (p: Party) => string; pollster: string };

export function tally(selected: Set<string>, parties: Party[], poll: Poll, text?: TallyText): Tally {
  const P = text?.P ?? builder.en;
  const nameOf = text?.name ?? ((p: Party) => p.name);
  const pollster = text?.pollster ?? poll.pollster;
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
    const groupNames = g.parties.map((id) => { const p = parties.find((x) => x.id === id); return p ? nameOf(p) : id; });
    if (inGroup.length === g.parties.length) {
      total += g.seats;
      segments.push({ seats: g.seats, bloc: inGroup[0].bloc, name: inGroup.map((p) => p.name).join(" + ") });
      groupNote = P.groupSplit(pollster, groupNames, g.seats, g.note);
    } else {
      partial = true;
      groupNote = P.groupPartial(pollster, inGroup.map(nameOf), groupNames, g.seats);
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

/**
 * How a warning's words are chosen in another edition: the rule's message (the Hebrew overlay, or the English when
 * there is none, with the language it came back in), each party's name, and the "A and B" join for {and:...}.
 * A message that falls back to English is filled with English names, so one sentence never mixes the two.
 */
export type WarningText = {
  message: (rule: PledgeRule) => { text: string; lang: Lang };
  name: (party: Party) => string;
  and: (names: string[]) => string;
};

function supportedWarnings(cabinet: Set<string>, support: Set<string>, parties: Party[], rules: PledgeRule[], pledgesOnly = false, text?: WarningText) {
  const cab = parties.filter((p) => cabinet.has(p.id));
  const all = parties.filter((p) => cabinet.has(p.id) || support.has(p.id));
  return rules
    .filter((r) => !pledgesOnly || r.kind === "pledge")
    .map((r) => ({ r, chosen: r.support ? all : cab }))
    .filter(({ r, chosen }) => holds(r.when, chosen, cab))
    .map(({ r, chosen }) => ({ warning: warningOf(r, chosen, text), ids: implicated(r.when, chosen, cab) }));
}

function warningOf(r: PledgeRule, chosen: Party[], text?: WarningText): Warning {
  if (!text) return { id: r.id, kind: r.kind, message: fill(r.message, chosen), source: r.source };
  const m = text.message(r);
  const message = m.lang === "en" ? fill(m.text, chosen) : fill(m.text, chosen, text.name, text.and);
  return { id: r.id, kind: r.kind, message, source: r.source, lang: m.lang };
}

/** Fills {and:tag1,tag2} and {comma:tag} with the chosen parties carrying those tags, tag by tag. */
function fill(template: string, chosen: Party[], name: (p: Party) => string = (p) => p.name, and: (names: string[]) => string = joinAnd): string {
  return template.replace(/\{(and|comma):([\w,]+)\}/g, (_, how: string, tags: string) => {
    const names = tags
      .split(",")
      .flatMap((t) => chosen.filter((p) => p.tags.includes(t as Tag)))
      .map(name);
    return how === "and" ? and(names) : names.join(", ");
  });
}

/** `lang` is set only when a WarningText chose the words: the language the message is in. */
export type Warning = { id: string; kind: PledgeRule["kind"]; message: string; source: string; lang?: Lang };

export function warnings(selected: Set<string>, parties: Party[], rules: PledgeRule[]): Warning[] {
  return supportedWarnings(selected, new Set(), parties, rules).map((x) => x.warning);
}

/** Warnings for a cabinet with outside support, read as in supportedPledgeConflicts; `text` picks another edition's words. */
export function warningsWithSupport(cabinet: Set<string>, support: Set<string>, parties: Party[], rules: PledgeRule[], text?: WarningText): Warning[] {
  return supportedWarnings(cabinet, support, parties, rules, false, text).map((x) => x.warning);
}
