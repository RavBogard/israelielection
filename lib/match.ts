import type { MatrixCell } from "@/components/compare/model";

/**
 * Party match (/match): how close each list's recorded answers sit to the reader's. Pure, so the
 * page and the tests share it. Spec: docs/planning/2026-10-08-match/SPEC.md. The score is a
 * description of distance on the Compare matrix rows, never a recommendation (Daniel, 2026-10-08).
 */

/** 0: a little, 1: matters (the default), 2: deal-breaker. */
export type Importance = 0 | 1 | 2;
export const WEIGHTS: Record<Importance, number> = { 0: 0.5, 1: 1, 2: 2 };
export type Answer = { stance: string; importance: Importance };
export type Answers = Record<string, Answer | null | undefined>;

/** The part of a Compare matrix row the match reads. */
export type MatchRow = {
  key: string;
  /** False for priorities that can coexist (the economy): only the same answer agrees. */
  scale: boolean;
  stances: { id: string; position: number | null }[];
  cells: Record<string, MatrixCell>;
};

export type QuestionScore = { key: string; agreement: number | null; cell: MatrixCell | undefined };
export type PartyScore = {
  id: string;
  /** 0 to 1; null when the list shares no answered question with the reader. */
  match: number | null;
  /** Questions both answered. */
  both: number;
  /** Questions the reader answered. */
  asked: number;
  coverage: number;
  questions: QuestionScore[];
  /** Deal-breaker questions on which the list sits more than halfway across the scale from the reader. */
  clashes: string[];
};

/** The share of answered questions a list must also have answered to be ranked. */
export const MIN_COVERAGE = 0.5;
/** Core questions the reader answers before results show. */
export const MIN_ANSWERS = 4;

/** How close the list's answer on one row is to the reader's, 0 to 1, or null when it cannot be compared. */
export function agreement(row: MatchRow, mine: string, cell: MatrixCell | undefined): number | null {
  if (!cell || cell.kind !== "stance") return null;
  if (!row.scale) return cell.stance === mine ? 1 : 0;
  const u = row.stances.find((s) => s.id === mine)?.position;
  const p = cell.position;
  if (u == null || p == null) return cell.stance === mine ? 1 : 0;
  return 1 - Math.abs(u - p);
}

export function scoreParty(id: string, rows: MatchRow[], answers: Answers): PartyScore {
  let sum = 0, weight = 0, both = 0, asked = 0;
  const questions: QuestionScore[] = [];
  const clashes: string[] = [];
  for (const row of rows) {
    const a = answers[row.key];
    if (!a) continue;
    asked++;
    const cell = row.cells[id];
    const g = agreement(row, a.stance, cell);
    questions.push({ key: row.key, agreement: g, cell });
    if (g === null) continue;
    both++;
    sum += WEIGHTS[a.importance] * g;
    weight += WEIGHTS[a.importance];
    if (a.importance === 2 && g < 0.5) clashes.push(row.key);
  }
  return { id, match: weight ? sum / weight : null, both, asked, coverage: asked ? both / asked : 0, questions, clashes };
}

/** Every list scored, the ones with enough on record ranked by match, then coverage, then the given order. */
export function rankParties(ids: string[], rows: MatchRow[], answers: Answers): { ranked: PartyScore[]; thin: PartyScore[] } {
  const all = ids.map((id) => scoreParty(id, rows, answers));
  const placed = (s: PartyScore) => s.match !== null && s.coverage >= MIN_COVERAGE;
  const ranked = all.filter(placed).sort((a, b) => b.match! - a.match! || b.coverage - a.coverage || ids.indexOf(a.id) - ids.indexOf(b.id));
  return { ranked, thin: all.filter((s) => !placed(s)) };
}

/**
 * Answers in a URL: two characters per question in quiz order, the option's index and the
 * importance, or "--" for a question skipped or not reached. Trailing blanks are dropped.
 */
export function encodeAnswers(order: { key: string; options: string[] }[], answers: Answers): string {
  const out = order.map(({ key, options }) => {
    const a = answers[key];
    const i = a ? options.indexOf(a.stance) : -1;
    return a && i >= 0 && i < 10 ? `${i}${a.importance}` : "--";
  }).join("");
  return out.replace(/(--)+$/, "");
}

export function decodeAnswers(order: { key: string; options: string[] }[], code: string | null | undefined): Answers {
  const out: Answers = {};
  if (!code) return out;
  order.forEach(({ key, options }, n) => {
    const pair = code.slice(n * 2, n * 2 + 2);
    const m = /^(\d)([012])$/.exec(pair);
    if (m && options[+m[1]]) out[key] = { stance: options[+m[1]], importance: +m[2] as Importance };
  });
  return out;
}
