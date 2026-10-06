import type { Stance, StanceMap } from "./cohesion";

/*
 * Can they govern together? Leads with what can be compared: the questions every chosen party has
 * answered. A party that clearly holds a position it will not say publicly (data/comparison-questions.json
 * `unstated`) counts as an answer, marked "Not said publicly" with its basis. Questions with fewer than
 * two answers are not findings; they are listed once as not enough answers.
 */

export type Unstated = { stance: string; text: string; source: string; url?: string | null; date?: string | null };
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

/** The one-line summary that leads the section. */
export function governingSummary(g: GovReading): string {
  if (!g.comparable) return `None of the ${g.total} questions has an answer from every one of these parties.`;
  const what = !g.differ ? `agree on ${g.agree === g.comparable && g.comparable > 1 ? "all " : ""}${g.agree}` : !g.agree ? `differ on ${g.differ === g.comparable && g.comparable > 1 ? "all " : ""}${g.differ}` : `agree on ${g.agree} and differ on ${g.differ}`;
  return `On the ${g.comparable} of ${g.total} questions with answers from every party, they ${what}.`;
}

/** The reading beside one row's glyph. */
export function rowText(r: GovRow, nameOf: (id: string) => string, selected: number): string {
  const lower = (s: string) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);
  const head = r.reach === "every"
    ? r.same ? `Same answer from all ${selected}: ${lower(r.groups[0].stance.label)}.` : `${r.groups.length} different answers.`
    : `${r.answers.length} of ${selected} answered, ${r.same ? `the same way: ${lower(r.groups[0].stance.label)}` : "differently"}. No answer: ${r.missing.map(nameOf).join(", ")}.`;
  return head;
}
