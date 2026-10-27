import "@/components/article/article.css";
import { seatContextForRender } from "@/lib/seat-context-server";
import SeatBasis from "@/components/seat-context/SeatBasis";
import UnprofiledLists from "../election-readiness/UnprofiledLists";
import { readiness } from "@/lib/i18n/election-readiness";
import { matrixRows, matrixText, shade } from "@/components/compare/model";
import MatchQuiz from "@/components/match/MatchQuiz";
import type { MatchData, MatchQuestion } from "@/components/match/types";
import PageHead from "@/components/PageHead";
import quiz from "@/data/quiz.json";
import { blocs, parties } from "@/lib/data";
import { blocSeats } from "@/lib/list-seats";
import { partyColor, partyInk } from "@/lib/party-colors";
import { BLOC_ORDER } from "@/lib/polls";
import { partyText, blocText } from "@/lib/i18n/overlays";
import type { Lang } from "@/lib/i18n";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { translatedTool } from "@/lib/reference/catalog";
import { matchText } from "@/lib/i18n/match";
import { longDate } from "@/lib/format";

type QuizEntry = {
  row: string;
  prompt: string;
  context: string;
  options: Record<string, string>;
};
export function buildMatchData(
  lang: Lang,
  context: SharedSeatContext,
): MatchData {
  const listed = parties.filter(
      (p) =>
        p.coalitionCard !== "hidden" || (context.pointSeats[p.id] ?? 0) > 0,
    ),
    ids = listed.map((p) => p.id),
    rows = matrixRows(ids),
    text = matrixText(rows, lang),
    edition = translatedTool("tools:quiz", lang, quiz);
  const source = edition.data as unknown as {
    core: QuizEntry[];
    deeper: QuizEntry[];
  };
  function question(q: QuizEntry, round: "core" | "deeper"): MatchQuestion {
    const row = rows.find((r) => r.key === q.row);
    if (!row) throw Error("quiz_row_unavailable");
    const local = text[row.key],
      stances = row.stances.map((s) => ({
        id: s.id,
        label: q.options[s.id] ?? local.stances[s.id]?.text ?? s.label,
        position: s.position,
        n: s.n,
        color: shade(s.position, s.n),
      }));
    const said: MatchQuestion["said"] = {};
    for (const r of row.issue.file.rows)
      if (r.text) {
        const quote = local.said[r.party];
        said[r.party] = {
          text: quote?.text ?? r.text,
          lang: quote?.lang ?? "en",
          translated: quote?.translated,
          source: r.source ?? "",
          url: r.url ?? undefined,
          date: r.date ?? undefined,
        };
      }
    return {
      key: row.key,
      round,
      label: local.label.text,
      labelLang: local.label.lang,
      textLang: edition.contentLang,
      prompt: q.prompt,
      context: q.context,
      scale: row.scale,
      stances,
      offered: stances.filter((s) => s.id in q.options).map((s) => s.id),
      stanceLabels: Object.fromEntries(
        row.stances.map((s) => [s.id, local.stances[s.id]?.text ?? s.label]),
      ),
      stanceLang: Object.fromEntries(
        row.stances.map((s) => [s.id, local.stances[s.id]?.lang ?? "en"]),
      ),
      cells: row.cells,
      said,
    };
  }
  return {
    lang,
    copyLang: edition.contentLang,
    copyState: edition.state,
    context,
    questions: [
      ...source.core.map((q) => question(q, "core")),
      ...source.deeper.map((q) => question(q, "deeper")),
    ],
    parties: listed.map((p) => {
      const name = partyText(p, "name", lang),
        short = partyText(p, "short", lang),
        leader = partyText(p, "leader", lang),
        surplus = partyText(p, "surplusPartner.text", lang),
        pledge = partyText(p, "pledges.0.text", lang);
      return {
        id: p.id,
        name: name.text,
        short: short.text || name.text,
        leader: leader.text,
        nameLang: name.lang,
        leaderLang: leader.lang,
        bloc: p.bloc,
        color: partyColor(p.id),
        ink: partyInk(p.id),
        seatsText: String(context.pointSeats[p.id] ?? 0),
        seats: context.pointSeats[p.id] ?? 0,
        below: !(context.pointSeats[p.id] ?? 0),
        passing: [0, 0],
        surplus: p.surplusPartner ? surplus.text : null,
        surplusLang: surplus.lang,
        pledge: p.pledges?.[0]
          ? { text: pledge.text, source: p.pledges[0].source ?? "" }
          : null,
        pledgeLang: pledge.lang,
      };
    }),
    blocs: BLOC_ORDER.map((id) => {
      const b = blocs.find((b) => b.id === id)!;
      return {
        id,
        label: blocText(b, lang).text,
        seats: blocSeats(id, context),
      };
    }),
    asOf: longDate(
      (context.publishedAt ?? context.observedAt).slice(0, 10),
      lang,
    ),
  };
}
export default async function MatchPage({ lang = "en" }: { lang?: Lang }) {
  const context = await seatContextForRender(),
    t = matchText(lang);
  return (
    <div className="wrap match-page">
      <PageHead title={t.title} standfirst={t.intro} />
      <SeatBasis context={context} lang={lang} share />
      <p className="note">{readiness(lang).matchNote}</p>
      {context && (
        <>
          <UnprofiledLists
            initial={context}
            knownIds={parties.map((p) => p.id)}
            lang={lang}
          />
          <MatchQuiz data={buildMatchData(lang, context)} />
        </>
      )}
    </div>
  );
}
