import "@/components/article/article.css";
import { matrixRows, shade } from "@/components/compare/model";
import MatchQuiz from "@/components/match/MatchQuiz";
import type { MatchData, MatchQuestion } from "@/components/match/types";
import PageHead from "@/components/PageHead";
import quiz from "@/data/quiz.json";
import { averagePoll, blocLabel, blocs, parties } from "@/lib/data";
import { blocSeats, listSeats } from "@/lib/list-seats";
import { partyColor, partyInk } from "@/lib/party-colors";
import { BLOC_ORDER } from "@/lib/polls";

const listed = parties.filter((p) => p.coalitionCard !== "hidden");
const ids = listed.map((p) => p.id);
const rows = matrixRows(ids);

/** "2026-10-05" → "Oct 5", as the site prints dates beside a figure. */
const shortDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}/.test(iso) ? new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) : iso);

type QuizEntry = { row: string; prompt: string; context: string; options: Record<string, string> };
/** JSON infers one object type per entry; every entry has this shape (pinned in lib/match.test.ts). */
const QUIZ = quiz as unknown as { core: QuizEntry[]; deeper: QuizEntry[] };

function question(q: QuizEntry, round: "core" | "deeper"): MatchQuestion {
  const row = rows.find((r) => r.key === q.row);
  if (!row) throw new Error(`quiz row ${q.row} is not on the Compare matrix`);
  const words = q.options;
  const stances = row.stances.map((s) => ({ id: s.id, label: words[s.id] ?? s.label, position: s.position, n: s.n, color: shade(s.position, s.n) }));
  const said: MatchQuestion["said"] = {};
  for (const r of row.issue.file.rows) if (r.text) said[r.party] = { text: r.text, source: r.source ?? "", url: r.url ?? undefined, date: r.date ?? undefined };
  return {
    key: row.key,
    round,
    label: row.label,
    prompt: q.prompt,
    context: q.context,
    scale: row.scale,
    stances,
    offered: stances.filter((s) => s.id in words).map((s) => s.id),
    stanceLabels: Object.fromEntries(row.stances.map((s) => [s.id, s.label])),
    cells: row.cells,
    said,
  };
}

const data: MatchData = {
  questions: [...QUIZ.core.map((q) => question(q, "core")), ...QUIZ.deeper.map((q) => question(q, "deeper"))],
  parties: listed.map((p) => {
    const s = listSeats(p.id);
    return {
      id: p.id,
      name: p.name,
      short: p.short ?? p.name,
      leader: p.leader,
      bloc: p.bloc,
      color: partyColor(p.id),
      ink: partyInk(p.id),
      seatsText: s.text,
      seats: s.seats,
      below: s.below,
      passing: [s.k, s.n],
      surplus: p.surplusPartner?.text ?? null,
      pledge: p.pledges?.[0] ? { text: p.pledges[0].text, source: p.pledges[0].source ?? "" } : null,
    };
  }),
  blocs: BLOC_ORDER.map((b) => ({ id: b, label: blocLabel[b] ?? blocs.find((x) => x.id === b)?.label ?? b, seats: blocSeats(b) })),
  asOf: shortDate(averagePoll.fieldwork ?? averagePoll.published ?? ""),
};

/** Party match (/match): a short questionnaire on the seven issues, matched against Compare's recorded answers. English only. */
export default function MatchPage() {
  return (
    <div className="wrap match-page">
      <PageHead title="Which Israeli party matches you?" standfirst="Answer seven questions from this campaign and see which lists sit closest to you, and what an Israeli voter would weigh next." />
      <MatchQuiz data={data} />
    </div>
  );
}
