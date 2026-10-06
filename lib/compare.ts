import type { BlocId, IssueKey, Party, PollResult } from "./types";

/** One row of a data/positions/*.json file. `declined` is honoured if a row ever carries it. */
export type PositionRow = {
  party: string;
  text?: string | null;
  source?: string | null;
  url?: string | null;
  date?: string | null;
  declined?: boolean;
  /** The id of one of the file's `stances`: the comparable option this row's text supports. */
  stance?: string;
  /** "declined": refused the questionnaire; "none": no published position found (text, if present, says what the party said instead). */
  status?: "declined" | "none";
  /** "record": the party declined the questionnaire; the stance comes from a dated statement, bill or vote.
   *  "unstated": the party has not said it publicly; the stance is read from its votes, coalition deals or ministers' actions (see isUnstated in lib/positions). */
  basis?: "record" | "unstated";
  /** When a "none" row was last checked. */
  checked?: string;
  evidence?: { kind: string; date: string | null; checkedAt: string; scope?: string; limitation?: string };
};

export type AxisKey = IssueKey | "pstate";

/** The seven rows of the comparison, in reading order, with their plain labels. */
export const AXES: { key: AxisKey; label: string }[] = [
  { key: "draft", label: "Haredi draft" },
  { key: "courts", label: "Courts and the judicial overhaul" },
  { key: "war", label: "The October 7 inquiry" },
  { key: "wb", label: "West Bank and annexation" },
  { key: "relig", label: "Religion and state" },
  { key: "econ", label: "Cost of living and the economy" },
  { key: "pstate", label: "A Palestinian state" },
];

export const MIN_PICK = 2;
/** The picker's upper bound was four when the comparison was a table of columns; the issue strips take every pickable list. */
export const MAX_PICK = 15;

export const NO_POSITION = "No position found";
export const DECLINED = "Declined to answer";

export type Cell =
  | { kind: "none" }
  | { kind: "declined"; text: string | null; source: string | null; url: string | null }
  | { kind: "position"; text: string; source: string | null; url: string | null };

export type CompareParty = {
  id: string;
  name: string;
  bloc: BlocId;
  letters: string | null;
  cells: Record<AxisKey, Cell>;
};

export const isUrl = (s: string | null | undefined): s is string => !!s && /^https?:\/\/\S+$/i.test(s.trim());

/** A positions-file row as a cell: its source line reads "source, date" unless the source already names the date. */
export function rowCell(row: PositionRow | undefined): Cell {
  if (!row) return { kind: "none" };
  const text = row.text?.trim() || null;
  let source = row.source?.trim() || null;
  const date = row.date?.trim() || null;
  if (source && date && !source.includes(date)) source = `${source}, ${date}`;
  if (!source && date) source = date;
  const url = isUrl(row.url) ? row.url.trim() : null;
  if (row.declined || row.status === "declined") return { kind: "declined", text, source, url };
  if (!text || row.status === "none") return { kind: "none" };
  return { kind: "position", text, source, url };
}

/** All seven cells for a party: six from its `issues`, the seventh from the Palestinian-state rows. */
export function cellsFor(party: Party, stateRows: PositionRow[]): Record<AxisKey, Cell> {
  const cells = {} as Record<AxisKey, Cell>;
  for (const { key } of AXES) {
    if (key === "pstate") continue;
    const v = party.issues?.[key] ?? null;
    const text = v?.text?.trim();
    if (!v || !text) {
      cells[key] = { kind: "none" };
      continue;
    }
    const source = v.source?.trim() || null;
    cells[key] = { kind: "position", text, source, url: isUrl(source) ? source : null };
  }
  cells.pstate = rowCell(stateRows.find((r) => r.party === party.id));
  return cells;
}

/** The page's starting set: the four largest parties in the poll average, largest first (ties keep data order). */
export const DEFAULT_PICK = 4;
export function defaultSelection(ids: string[], results: Record<string, PollResult>, n = DEFAULT_PICK): string[] {
  return ids
    .map((id, i) => ({ id, i, seats: results[id]?.seats ?? -1 }))
    .sort((a, b) => b.seats - a.seats || a.i - b.i)
    .slice(0, n)
    .map((x) => x.id);
}

/**
 * `?p=likud,byachad` as a selection: known ids only, no repeats, at most `max`.
 * Anything giving fewer than two parties falls back to the default.
 */
export function parseSelection(param: string | null | undefined, validIds: string[], fallback: string[], max = MAX_PICK): string[] {
  if (!param) return fallback;
  const valid = new Set(validIds);
  const out: string[] = [];
  for (const raw of param.split(",")) {
    const id = raw.trim().toLowerCase();
    if (valid.has(id) && !out.includes(id)) out.push(id);
    if (out.length === max) break;
  }
  return out.length >= MIN_PICK ? out : fallback;
}

/** Adds or removes a party, keeping at least two and at most `max` chosen; a change that would break the bounds is ignored. */
export function toggle(selection: string[], id: string, max = MAX_PICK): string[] {
  if (selection.includes(id)) return selection.length > MIN_PICK ? selection.filter((x) => x !== id) : selection;
  return selection.length < max ? [...selection, id] : selection;
}
