import { mediumDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/post-count";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import type { PollsterAccuracy as Row } from "@/lib/post-records";
import { Ltr, pollsterName, Tx } from "./names";
import "./bloc-race.css";

/**
 * Each pollster's final poll against the count projection: mean seat error per list and the error in each contender
 * bloc's total. Provisional while the count is, and the same table becomes final when the context turns official.
 * The pollsters the site keeps apart from its averages are listed after the rest, never mixed into the ranking.
 */
export default function PollsterAccuracy({ rows, labels, official, lang = "en" }: { rows: Row[]; labels: Record<"net" | "opp", string>; official: boolean; lang?: Lang }) {
  const T = POST_RECORDS[lang];
  const title = official ? T.accTitleOfficial : T.accTitle;
  const basis = official ? T.officialResult : T.countSoFar;
  const seats = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return (
    <section className="acc" aria-labelledby="acc-h" data-testid="pollster-accuracy" data-provisional={official ? "false" : "true"}>
      <h2 id="acc-h" className="sec-h">{title}</h2>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={T.accCaption}>
        <table className="acc-table">
          <caption className="sr-only">{T.accCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{T.accPollster}</th>
              <th scope="col">{T.accFinal}</th>
              <th scope="col" className="num">{T.accLists}</th>
              <th scope="col" className="num">{T.accMae}</th>
              {(["net", "opp"] as const).map((b) => <th key={b} scope="col" className="num">{fill(T.accBloc, { bloc: labels[b] })}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pollster} className={r.apart ? "apart" : undefined} data-apart={r.apart ? "true" : undefined}>
                <th scope="row"><Tx text={pollsterName(r.pollster, lang)} lang={lang} />{r.apart && <small className="fig-src"> {T.accApart}</small>}</th>
                <td><time dateTime={r.published}>{mediumDate(r.published, lang)}</time></td>
                <td className="num">{r.lists}</td>
                <td className="num"><Ltr lang={lang}>{seats(r.mae)}</Ltr></td>
                {(["net", "opp"] as const).map((b) => <td key={b} className="num"><Ltr lang={lang}>{seats(r.bloc[b])}</Ltr></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fig-note acc-note">{fill(T.accNote, { label: basis })}</p>
    </section>
  );
}
