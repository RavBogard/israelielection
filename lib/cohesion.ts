/**
 * Can they govern together? For a set of parties, where they agree, where they split and who has
 * said nothing on each of the seven issues, derived mechanically from the stance each party's
 * position row carries (data/positions/*.json, `stances` header plus a `stance` id per row), and
 * how much the set depends on each partner for 61. No score, no prediction: the reading states
 * only what the rows record.
 */
import { MAJORITY, tally } from "./coalition";
import type { AxisKey, PositionRow } from "./compare";
import type { Party, Poll } from "./types";

export type Stance = { id: string; label: string };

/** One data/positions file, with the header fields the comparison reads. */
export type IssueFile = {
  issue: string;
  title: string;
  note?: string;
  columnNote?: string;
  /** The one question every party is answering; shown under the issue label. */
  question?: string;
  /** Comparable options, ordered so neighbours are closest in substance. Absent until the content lane sets it. */
  stances?: Stance[];
  rows: PositionRow[];
};

export type Issue = { key: AxisKey; label: string; file: IssueFile };

/** Where a party stands on one issue: a stance id, or why there is none. */
export type Standing = { kind: "stance"; stance: string } | { kind: "declined" } | { kind: "none" } | { kind: "unsorted" };

/** Per issue, each party's standing; `unsorted` means the file has rows but no `stances` header yet. */
export type StanceMap = Record<AxisKey, { question: string | null; stances: Stance[]; byParty: Record<string, Standing> }>;

export function standingOf(row: PositionRow | undefined, stances: Stance[] | undefined): Standing {
  if (!row) return { kind: "none" };
  if (row.declined || row.status === "declined") return { kind: "declined" };
  if (row.status === "none" || !row.text?.trim()) return { kind: "none" };
  if (!stances?.length) return { kind: "unsorted" };
  const id = row.stance?.trim();
  if (id && stances.some((s) => s.id === id)) return { kind: "stance", stance: id };
  return { kind: "unsorted" };
}

/** The compact map the Builder's panel needs: no quotes, one standing per party per issue. */
export function stanceMap(issues: Issue[], partyIds: string[]): StanceMap {
  const out = {} as StanceMap;
  for (const { key, file } of issues) {
    const byParty: Record<string, Standing> = {};
    for (const id of partyIds) byParty[id] = standingOf(file.rows.find((r) => r.party === id), file.stances);
    out[key] = { question: file.question?.trim() || null, stances: file.stances ?? [], byParty };
  }
  return out;
}

export type Group = { stance: Stance; parties: string[] };

export type IssueReading = {
  key: AxisKey;
  /** Groups in stance order, only those with a party in them. */
  groups: Group[];
  declined: string[];
  none: string[];
  unsorted: string[];
  /** agree: every party with a stance shares one; split: two or more stances; silent: nobody has a stance; unsorted: rows but no stances yet. */
  verdict: "agree" | "split" | "silent" | "unsorted";
};

export function readIssue(key: AxisKey, map: StanceMap, ids: string[]): IssueReading {
  const m = map[key];
  const groups: Group[] = m.stances.map((stance) => ({ stance, parties: [] as string[] }));
  const declined: string[] = [], none: string[] = [], unsorted: string[] = [];
  for (const id of ids) {
    const s = m.byParty[id] ?? { kind: "none" };
    if (s.kind === "stance") groups.find((g) => g.stance.id === s.stance)!.parties.push(id);
    else if (s.kind === "declined") declined.push(id);
    else if (s.kind === "unsorted") unsorted.push(id);
    else none.push(id);
  }
  const filled = groups.filter((g) => g.parties.length);
  const verdict = filled.length >= 2 ? "split" : filled.length === 1 ? "agree" : unsorted.length ? "unsorted" : "silent";
  return { key, groups: filled, declined, none, unsorted, verdict };
}

export type Cohesion = { issues: IssueReading[]; agree: number; split: number; silent: number };

export function cohesion(axes: { key: AxisKey }[], map: StanceMap, ids: string[]): Cohesion {
  const issues = axes.map((a) => readIssue(a.key, map, ids));
  return {
    issues,
    agree: issues.filter((i) => i.verdict === "agree").length,
    split: issues.filter((i) => i.verdict === "split").length,
    silent: issues.filter((i) => i.verdict === "silent").length,
  };
}

const WAYS = ["", "", "two", "three", "four", "five"];
const COUNT = ["none", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

/** The reading beside an issue's glyph, in the panel. Names come from the caller so this stays data-only. */
export function readingText(r: IssueReading, nameOf: (id: string) => string): string {
  const quiet = r.declined.length + r.none.length;
  const quietNote = quiet ? (quiet === 1 ? `; ${nameOf([...r.declined, ...r.none][0])} has no recorded position` : `; ${COUNT[quiet] ?? quiet} have no recorded position`) : "";
  if (r.verdict === "agree") {
    const g = r.groups[0];
    return `Agree: ${lower(g.stance.label)}${quietNote}.`;
  }
  if (r.verdict === "split") return `Split ${WAYS[r.groups.length] ?? r.groups.length} ways${quietNote}.`;
  if (r.verdict === "unsorted") return "Positions recorded, not yet sorted into stances.";
  return "No recorded position among these parties.";
}

const lower = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

export type Dependence = {
  /** Parties whose removal drops the set under 61. Empty when the set is under 61 already. */
  needed: string[];
  /** Parties the set could lose and still hold 61. */
  spare: string[];
  majority: boolean;
};

/** How much a majority depends on each partner, by re-tallying the set without that party. */
export function dependence(selected: Set<string>, parties: Party[], poll: Poll): Dependence {
  const total = tally(selected, parties, poll).total;
  if (total < MAJORITY) return { needed: [], spare: [], majority: false };
  const needed: string[] = [], spare: string[] = [];
  for (const id of selected) {
    const rest = new Set(selected);
    rest.delete(id);
    (tally(rest, parties, poll).total < MAJORITY ? needed : spare).push(id);
  }
  return { needed, spare, majority: true };
}

export function dependenceText(d: Dependence, nameOf: (id: string) => string): string | null {
  if (!d.majority) return null;
  if (!d.spare.length) return `A majority that needs every one of its ${COUNT[d.needed.length] ?? d.needed.length} parties: lose any one and it falls under ${MAJORITY}.`;
  if (!d.needed.length) return `Holds ${MAJORITY} without any one of these parties.`;
  const spare = d.spare.map(nameOf);
  const list = spare.length === 1 ? spare[0] : spare.length === 2 ? `${spare[0]} or ${spare[1]}` : `${spare.slice(0, -1).join(", ")} or ${spare[spare.length - 1]}`;
  return `Holds ${MAJORITY} without ${list}; needs each of the others.`;
}

export const compareHref = (ids: string[]) => `/compare?p=${ids.join(",")}`;
