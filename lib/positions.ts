/** The seven position files by comparison axis. Static imports, so the comparison and the Builder's panel read the same rows. */
import courts from "@/data/positions/courts.json";
import economy from "@/data/positions/economy.json";
import draft from "@/data/positions/haredi-draft.json";
import pstate from "@/data/positions/palestinian-state.json";
import relig from "@/data/positions/religion-state.json";
import war from "@/data/positions/war-hostages.json";
import wb from "@/data/positions/west-bank.json";
import gaza from "@/data/gaza-security-evidence.json";
import questions from "@/data/comparison-questions.json";
import type { IssueFile } from "./cohesion";
import type { AxisKey } from "./compare";
import { AXES, type PositionRow } from "./compare";
import type { Issue } from "./cohesion";

export const ISSUES: Record<AxisKey, IssueFile> = {
  draft: draft as IssueFile,
  courts: courts as IssueFile,
  war: war as IssueFile,
  wb: wb as IssueFile,
  relig: relig as IssueFile,
  econ: economy as IssueFile,
  pstate: pstate as IssueFile,
};

/** "unstated": the party has not said it publicly (declined questionnaires, strategic silence); the stance is read from its votes, coalition deals or ministers' actions, which the row text names. */
export const isUnstated = (row: Pick<PositionRow, "basis" | "stance"> | undefined | null): boolean => !!row?.stance && row.basis === "unstated";
/** "record": stance from a dated statement, bill or vote because the party skipped the questionnaire. */
export const isRecord = (row: Pick<PositionRow, "basis" | "stance"> | undefined | null): boolean => !!row?.stance && row.basis === "record";
const QUALIFIER = { record: "Record evidence: ", unstated: "Not said publicly: " } as const;
/** The reader-facing qualifier for a row's basis, or "" for a stated answer. */
export const basisQualifier = (row: PositionRow | undefined | null): string => (row?.basis ? QUALIFIER[row.basis] : "");
/** The row text as surfaces should print it: unstated rows lead with "Not said publicly: ". */
export function stanceText(row: PositionRow | undefined | null): string {
  const text = row?.text?.trim() ?? "";
  return isUnstated(row) && text ? `${QUALIFIER.unstated}${text}` : text;
}

/** Source dates describe the evidence, never the date we accessed it. */
export function evidenceLabel(row: PositionRow | undefined): string {
  if (!row) return "No recorded answer in these sources";
  if (row.evidence) return `${row.evidence.kind}, ${row.evidence.date ?? "date unavailable"}; checked ${row.evidence.checkedAt}`;
  const date = row.date?.trim();
  const accessed = !date || /accessed|checked/i.test(date);
  const qualifier = basisQualifier(row);
  return `${qualifier}${accessed ? `evidence date unavailable${date ? ` (${date})` : ""}` : `Source published ${date}`}`;
}

type Question = (typeof questions.questions)[number];
function extractedRow(row: PositionRow, q: Question): PositionRow {
  const answers: Record<string, string | undefined> = q.answers;
  const out: PositionRow = { ...row, stance: answers[row.party], status: answers[row.party] ? undefined : "none" };
  if (q.axis === "courts") {
    if (row.party === "likud") out.evidence = { kind: "Legislative record", date: "Mar 27, 2025", checkedAt: "2026-10-05" };
    else if (row.party === "raam") out.evidence = { kind: "Historical vote, not a current answer", date: "2023; reported Sep 22, 2026", checkedAt: "2026-10-05" };
    else if (["rz", "shas", "utj", "poi", "yashar", "byachad", "yb", "dem", "bw", "res", "jl"].includes(row.party)) {
      out.evidence = { kind: "Party questionnaire answer", date: "Sep 22, 2026", checkedAt: "2026-10-05" };
    }
  }
  if (q.key === "relig-shabbat" && row.party === "byachad") out.evidence = { kind: "Leader statement before the joint list", date: "Apr 20, 2026", checkedAt: "2026-10-05" };
  if (q.axis === "relig" && ["shas", "utj"].includes(row.party) && answers[row.party]) {
    out.source = "Jerusalem Post: Shas/UTJ policy summary";
    out.url = "https://www.jpost.com/israel-election-2026/article-907982";
    out.evidence = { kind: "Secondary policy summary", date: "Sep 10, 2026", checkedAt: "2026-10-05" };
  }
  return out;
}

/** Comparison questions share the original attributed text, with independent classifications. */
export function comparisonIssues(): Issue[] {
  const out: Issue[] = [];
  for (const axis of AXES) {
    const source = ISSUES[axis.key];
    const subs = questions.questions.filter((q) => q.axis === axis.key);
    if (subs.length) {
      for (const q of subs) {
        out.push({ key: q.key, label: q.label, file: {
          ...source, question: q.question, stances: q.stances, note: `${q.note} ${source.note ?? ""}`,
          rows: source.rows.map((row) => extractedRow(row, q)),
        } });
      }
    } else if (axis.key === "econ") {
      out.push({ key: axis.key, label: axis.label, file: { ...source, question: "Which economic priorities have the sources recorded?", stances: [], note: `These priorities can coexist. We do not treat lowering prices, free markets, service benefits or community budgets as opposing policies. No comparable tax-rate or spending-limit answers are established here. ${source.note ?? ""}` } });
    } else out.push({ key: axis.key, label: axis.label, file: source });
  }
  out.push({ key: "gaza-civilian", label: "Gaza: civilian administration", file: gaza as IssueFile });
  return out;
}
