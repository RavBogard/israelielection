import type { Stance, StanceMap } from "./cohesion";
import type { Lang } from "./i18n";
import builder, { type BuilderText } from "./i18n/builder";

/*
 * Can they govern together? Leads with what can be compared: the questions every chosen party has
 * answered. A party that clearly holds a position it will not say publicly (data/comparison-questions.json
 * `unstated`) counts as an answer, marked "Not said publicly" with its basis. Questions with fewer than
 * two answers are not findings; they are listed once as not enough answers.
 */

/** `lang` is set when the text was localized for an edition: the language `text` is in. */
export type Unstated = { stance: string; text: string; source: string; url?: string | null; date?: string | null; lang?: Lang };
export type UnstatedMap = Record<string, Record<string, Unstated>>;

/** The `unstated` entries of the comparison questions, kept only where the stance is one the question offers. */
export function unstatedFrom(questions: { key: string; unstated?: Record<string, Unstated> }[], map: StanceMap): UnstatedMap {
  const out: UnstatedMap = {};
  for (const q of questions) {
    const m = map[q.key];
    if (!m || !q.unstated) continue;
    for (const [id, u] of Object.entries(q.unstated)) {
      if (u?.stance && m.stances.some((s) => s.id === u.stance)) (out[q.key] ??= {})[id] = u;
    }
  }
  return out;
}

export type Answer = { id: string; stance: string; unstated?: Unstated };
export type GovRow = {
  key: string;
  answers: Answer[];
  groups: { stance: Stance; answers: Answer[] }[];
  /** Chosen parties with no comparable answer. */
  missing: string[];
  /** every: all chosen answered; some: two or more answered; thin: under two; unsorted: options that can coexist, never compared. */
  reach: "every" | "some" | "thin" | "unsorted";
  same: boolean;
};

export type GovReading = { rows: GovRow[]; total: number; comparable: number; agree: number; differ: number };

export function governing(map: StanceMap, unstated: UnstatedMap, ids: string[]): GovReading {
  const rows: GovRow[] = Object.keys(map).map((key) => {
    const m = map[key];
    const answers: Answer[] = [];
    const missing: string[] = [];
    for (const id of ids) {
      const s = m.byParty[id];
      const u = unstated[key]?.[id];
      if (s?.kind === "stance") answers.push({ id, stance: s.stance });
      else if (u) answers.push({ id, stance: u.stance, unstated: u });
      else missing.push(id);
    }
    const groups = m.stances.map((stance) => ({ stance, answers: answers.filter((a) => a.stance === stance.id) })).filter((g) => g.answers.length);
    const reach = !m.stances.length ? "unsorted" : answers.length === ids.length && ids.length >= 2 ? "every" : answers.length >= 2 ? "some" : "thin";
    return { key, answers, groups, missing, reach, same: groups.length === 1 };
  });
  const every = rows.filter((r) => r.reach === "every");
  return { rows, total: rows.length, comparable: every.length, agree: every.filter((r) => r.same).length, differ: every.filter((r) => !r.same).length };
}

/** The one-line summary that leads the section. `P` is the edition's phrasebook (lib/i18n/builder.ts). */
export function governingSummary(g: GovReading, P: BuilderText = builder.en): string {
  if (!g.comparable) return P.govSummaryNone(g.total);
  return P.govSummary(g.comparable, g.total, g.agree, g.differ);
}

/** The reading beside one row's glyph. */
export function rowText(r: GovRow, nameOf: (id: string) => string, selected: number, P: BuilderText = builder.en): string {
  if (r.reach === "every") return r.same ? P.rowSame(selected, r.groups[0].stance.label) : P.rowDifferent(r.groups.length);
  return P.rowSome(r.answers.length, selected, r.same ? r.groups[0].stance.label : null, r.missing.map(nameOf));
}
