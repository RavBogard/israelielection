import SeatGrid from "@/components/SeatGrid";
import { Ltr, Tx, blocName, partyName, pollsterName } from "@/components/polls/names";
import { averagePoll, blocs, exitPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { forecast } from "@/lib/forecast";
import { forecastScorecard, type ForecastScorecard as Scorecard, type ScoredPrediction } from "@/lib/election-lifecycle/evaluation";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { longDate, mediumDate } from "@/lib/format";
import { isRtl, locale, type Lang } from "@/lib/i18n";
import { SCORECARD } from "@/lib/i18n/scorecard";
import { averageAsPoll, BLOC_ORDER, BLOC_SEAT_ORDER } from "@/lib/polls";
import "./scorecard.css";

/** The scorecard's inputs: the locked forecast, the two final averages, each broadcaster's last exit poll. */
export function scorecardFor(context: SharedSeatContext | null): Scorecard | null {
  const apart = pollsData.config.withoutVariant.pollsters;
  return forecastScorecard(context, {
    forecast,
    averages: [
      { kind: "average", id: averagePoll.id, published: averagePoll.published, results: averagePoll.results },
      ...(() => {
        const v = averageAsPoll(variantPolls, parties.map((p) => p.id));
        return [{ kind: "average_without_checks" as const, id: "avg-variant", published: v.published, results: v.results }];
      })(),
    ],
    exits: exitPolls,
    apartPollsters: apart,
  });
}

/**
 * /forecast#scorecard: the locked forecast against the official seats (Daniel, 2026-10-28). Renders nothing until the
 * shared seat context is official, so it publishes itself the moment the certified allocation arrives.
 */
export default function ForecastScorecard({ context, lang }: { context: SharedSeatContext | null; lang: Lang }) {
  const s = scorecardFor(context);
  if (!s || !context) return null;
  const t = SCORECARD[lang], rtl = isRtl(lang);
  const nameOf = (id: string) => {
    const p = parties.find((x) => x.id === id);
    return p ? partyName(p, lang) : (context.parties.find((x) => x.id === id)?.label ?? id);
  };
  const blocLabel = (id: string) => {
    const b = blocs.find((x) => x.id === id);
    return b ? blocName(b, lang) : id;
  };
  const list = (values: string[]) => new Intl.ListFormat(locale(lang)).format(values);
  const num = (x: number, digits = 0) => x.toLocaleString(locale(lang), { maximumFractionDigits: digits, minimumFractionDigits: digits });
  /** Misses are shown as the official seats minus the prediction, as the calibration table on this page shows them. */
  const signed = (x: number, digits = Number.isInteger(x) ? 0 : 1) => (Math.abs(x) < 0.05 ? num(0) : `${x > 0 ? "+" : "−"}${num(Math.abs(x), digits)}`);
  const blocSegments = (seats: (b: string) => number) =>
    BLOC_SEAT_ORDER.map((b) => ({ id: b, seats: seats(b), color: `var(--b-${b})`, label: `${blocLabel(b)} ${seats(b)}` }));
  const forecastBloc = (b: string) => s.blocs.find((x) => x.id === b)?.point ?? 0;
  const officialBloc = (b: string) => s.blocs.find((x) => x.id === b)?.actual ?? 0;
  const max = Math.max(...s.lists.map((l) => Math.max(l.hi, l.actual)), 1);
  const at = (n: number) => `${(n / max) * 100}%`;
  const lists = [...s.lists].sort((a, b) => BLOC_ORDER.indexOf(a.bloc as never) - BLOC_ORDER.indexOf(b.bloc as never) || b.actual - a.actual || b.point - a.point);
  const pct = num(s.largest.chance);
  const leaders = list(s.largest.actual.map(nameOf));
  const rowName = (r: ScoredPrediction) =>
    r.kind === "forecast"
      ? t.forecastRow
      : r.kind === "average"
        ? t.averageRow
        : r.kind === "average_without_checks"
          ? t.averageWithoutRow(list(pollsData.config.withoutVariant.pollsters.map((p) => pollsterName(p, lang))))
          : t.exitRow(pollsterName(r.pollster ?? "", lang));
  const main = s.rows.filter((r) => !r.apart), apart = s.rows.filter((r) => r.apart);
  const row = (r: ScoredPrediction) => (
    <tr key={r.id} data-testid={`scorecard-row-${r.kind}`}>
      <th scope="row"><Tx text={rowName(r)} lang={lang} /></th>
      <td>{mediumDate(r.published.slice(0, 10), lang)}</td>
      <td className="num">{num(r.listMae, 1)}</td>
      <td className="num"><Ltr lang={lang}>{signed(-r.blocErrors.net)}</Ltr></td>
      <td className="num"><Ltr lang={lang}>{signed(-r.blocErrors.opp)}</Ltr></td>
      <td className="num"><Ltr lang={lang}>{`${r.thresholdCorrect}/${r.thresholdTotal}`}</Ltr></td>
      <td>{r.largestRight ? t.right : t.wrong}</td>
    </tr>
  );
  return (
    <section id="scorecard" className="scorecard" aria-labelledby="sc-h" data-testid="forecast-scorecard" data-seat-revision={s.officialRevision}>
      <h2 id="sc-h" className="sec-h">{t.h}</h2>
      <div className="sc-grids">
        {([[t.gridForecast, forecastBloc, "forecast"], [t.gridOfficial, officialBloc, "official"]] as const).map(([title, seats, key]) => (
          <figure key={key} data-testid={`scorecard-grid-${key}`}>
            <figcaption className="pn-lbl">{title}</figcaption>
            <SeatGrid segments={blocSegments(seats)} labelRule rtl={rtl} lang={lang} title={title} />
            <ul className="sc-key">
              {BLOC_ORDER.map((b) => (
                <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" /> {blocLabel(b)} <b>{seats(b)}</b></li>
              ))}
            </ul>
          </figure>
        ))}
      </div>
      <p className="sc-largest" data-testid="scorecard-largest">
        <strong>{s.largest.right ? t.largestHit(nameOf(s.largest.called), pct) : t.largestMiss(nameOf(s.largest.called), pct, leaders)}</strong>
      </p>
      <p className="note">
        {t.coverage(s.coverage.lists.inside, s.coverage.lists.total, s.coverage.blocs.inside, s.coverage.blocs.total)}{" "}
        {t.threshold(s.threshold.correct, s.threshold.total)}
        {s.threshold.missed.length > 0 && <> {t.thresholdMissed(list(s.threshold.missed.map(nameOf)))}</>}
      </p>
      <p className="fig-src">{t.note(longDate(s.certifiedOn, lang), longDate(s.forecastGeneratedAt.slice(0, 10), lang))}</p>

      <figure className="sc-ranges">
        <figcaption className="pn-lbl">{t.listsCaption}</figcaption>
        <ul>
          {lists.map((l) => (
            <li key={l.id} className={l.inside ? undefined : "out"}>
              <span className="sc-name"><Tx text={nameOf(l.id)} lang={lang} /></span>
              <span className="sc-track" aria-hidden="true">
                <span className="sc-band" style={{ insetInlineStart: at(l.lo), width: `calc(${at(l.hi - l.lo)} + 2px)`, background: `var(--b-${l.bloc ?? "mid"})` }} />
                <span className="sc-point" style={{ insetInlineStart: at(l.point) }} />
                <span className="sc-dot" style={{ insetInlineStart: at(l.actual), background: `var(--b-${l.bloc ?? "mid"}-ink, var(--ink))` }} />
              </span>
              <span className="sc-fig num"><b>{l.actual}</b> <Ltr lang={lang}>{signed(-l.error)}</Ltr></span>
            </li>
          ))}
        </ul>
      </figure>

      <div className="table-scroll">
        <table className="data-table fc-table" data-testid="scorecard-lists">
          <thead><tr><th scope="col">{t.cols.list}</th><th scope="col" className="num">{t.cols.forecast}</th><th scope="col" className="num">{t.cols.range}</th><th scope="col" className="num">{t.cols.official}</th><th scope="col" className="num">{t.cols.miss}</th><th scope="col">{t.cols.inside}</th><th scope="col">{t.cols.threshold}</th></tr></thead>
          <tbody>
            {lists.map((l) => (
              <tr key={l.id}>
                <th scope="row"><span className="sw" style={{ background: `var(--b-${l.bloc ?? "mid"})` }} aria-hidden="true" /> <Tx text={nameOf(l.id)} lang={lang} /></th>
                <td className="num">{l.point}</td>
                <td className="num"><Ltr lang={lang}>{`${l.lo}–${l.hi}`}</Ltr></td>
                <td className="num"><b>{l.actual}</b></td>
                <td className="num"><Ltr lang={lang}>{signed(-l.error)}</Ltr></td>
                <td>{l.inside ? t.yes : t.no}</td>
                <td>{l.callRight ? t.right : t.wrong}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-scroll">
        <table className="data-table fc-table" data-testid="scorecard-blocs">
          <thead><tr><th scope="col">{t.cols.bloc}</th><th scope="col" className="num">{t.cols.forecast}</th><th scope="col" className="num">{t.cols.range}</th><th scope="col" className="num">{t.cols.official}</th><th scope="col" className="num">{t.cols.miss}</th><th scope="col">{t.cols.inside}</th></tr></thead>
          <tbody>
            {s.blocs.map((b) => (
              <tr key={b.id}>
                <th scope="row"><span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" /> {blocLabel(b.id)}</th>
                <td className="num">{b.point}</td>
                <td className="num"><Ltr lang={lang}>{`${b.lo}–${b.hi}`}</Ltr></td>
                <td className="num"><b>{b.actual}</b></td>
                <td className="num"><Ltr lang={lang}>{signed(-b.error)}</Ltr></td>
                <td>{b.inside ? t.yes : t.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="sec-h3 fc-sub">{t.compareH}</h3>
      <div className="table-scroll">
        <table className="data-table fc-table" data-testid="scorecard-compare">
          <thead><tr><th scope="col">{t.compareCols.prediction}</th><th scope="col">{t.compareCols.published}</th><th scope="col" className="num">{t.compareCols.listMae}</th><th scope="col" className="num">{t.compareCols.blocMiss(blocLabel("net"))}</th><th scope="col" className="num">{t.compareCols.blocMiss(blocLabel("opp"))}</th><th scope="col" className="num">{t.compareCols.threshold}</th><th scope="col">{t.compareCols.largest}</th></tr></thead>
          <tbody>{main.map(row)}</tbody>
          {apart.length > 0 && <tbody className="sc-apart" data-testid="scorecard-apart">{apart.map(row)}</tbody>}
        </table>
      </div>
      <p className="fig-src">{t.missNote} {t.exitNote}{apart.length > 0 && <> {t.apartNote(list([...new Set(apart.map((r) => pollsterName(r.pollster ?? "", lang)))]))}</>}</p>
    </section>
  );
}
