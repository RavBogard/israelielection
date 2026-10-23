import Link from "next/link";
import PageHead from "@/components/PageHead";
import SeatBar from "@/components/SeatBar";
import "@/components/polls/polls-now.css";
import "./forecast-page.css";
import calibration from "@/scripts/forecast/calibration.json";
import changelogJson from "@/data/forecast-changelog.json";
import historyJson from "@/data/forecast-history.json";
import { blocs, parties, pollsData } from "@/lib/data";
import { forecast, type Forecast } from "@/lib/forecast";
import { mediumDate, shortDate } from "@/lib/format";
import { BLOC_ORDER, BLOC_SEAT_ORDER, blocRank } from "@/lib/polls";
import type { Lang } from "@/lib/i18n";
import { list } from "@/lib/i18n/he-grammar";
import FORECAST from "@/lib/i18n/forecast";
import { blocName, Ltr, partyName, pollsterName, Tx } from "@/components/polls/names";
import type { BlocId } from "@/lib/types";
// Server component: loads the Hebrew overlays that partyName and pollsterName read in the Hebrew edition.
import "@/lib/i18n/overlays";

const REPO = "https://github.com/RavBogard/israelielection/blob/main/";
type HistoryRun = { generated: string; final?: boolean; blocs: Record<BlocId, number>; majority: Forecast["majority"]; parameters?: { version?: number } };
const history = (historyJson as { runs: HistoryRun[] }).runs;
const changelog = (changelogJson as { entries: { date: string; en: string; he: string }[] }).entries;

/** A signed seat miss, kept left to right in Hebrew. */
const signed = (x: number) => (x === 0 ? "0" : `${x > 0 ? "+" : "−"}${Math.abs(x).toFixed(1)}`);

/**
 * The forecast page, /forecast and /he/forecast: the prediction on the record, what goes in, the nine steps, the record
 * the rules come from, the daily runs and the scoring rule. Every figure is read from data/forecast.json, so the page
 * follows each day's run; the words are in lib/i18n/forecast.ts.
 */
export default function ForecastPage({ lang }: { lang: Lang }) {
  const t = FORECAST[lang], he = lang === "he", f = forecast, p = f.parameters, days = pollsData.config.currentWindowDays;
  const runs = f.runs.toLocaleString(he ? "he" : "en");
  const date = mediumDate(f.generated, lang);
  const label = Object.fromEntries(blocs.map((b) => [b.id, blocName(b, lang)])) as Record<BlocId, string>;
  const nameOf = (id: string) => { const party = parties.find((x) => x.id === id); return party ? partyName(party, lang) : id; };
  const checkNames = f.inputs.checks.map((c) => pollsterName(c.pollster, lang));
  const checks = he ? list(checkNames) : checkNames.join(" and ");
  const through = mediumDate(f.inputs.field.map((q) => q.published).sort().at(-1)!, lang);
  const lists = Object.entries(f.lists).map(([id, l]) => ({ id, ...l, bloc: parties.find((x) => x.id === id)?.bloc as BlocId })).sort((a, b) => blocRank(a.bloc) - blocRank(b.bloc) || b.share - a.share);
  const priorEntries = Object.entries(p.listPriors ?? {}).filter((e): e is [string, number] => typeof e[1] === "number" && e[1] !== 0).sort((a, b) => b[1] - a[1]).map(([id, pts]) => t.inputs.priorEntry(nameOf(id), pts));
  const largest = Object.entries(f.largestList).sort((a, b) => b[1] - a[1]).map(([id, pct]) => t.prediction.largestEntry(nameOf(id), pct));
  const thresholdCases = calibration.thresholdLists.cases;
  const cal = calibration.elections.map((e) => ({ ...e, miss: Math.round((e.result - e.field) * 10) / 10 }));
  const year = (iso: string) => (he ? new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" }) : new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" })).format(new Date(`${iso}T12:00:00Z`));
  const num = (x: number) => x.toLocaleString(he ? "he" : "en");
  const sourceLinks = [
    <a key="s" href={`${REPO}scripts/forecast/forecast.mjs`} hrefLang={he ? "en" : undefined}>{t.sources.script}</a>,
    <a key="d" href={`${REPO}data/forecast.json`} hrefLang={he ? "en" : undefined}>{t.sources.data}</a>,
    <a key="h" href={`${REPO}data/forecast-history.json`} hrefLang={he ? "en" : undefined}>{t.sources.history}</a>,
    <a key="b" href={`${REPO}scripts/forecast/backtest/`} hrefLang={he ? "en" : undefined}>{t.sources.backtest}</a>,
    <a key="m" href={`${REPO}docs/research/polls-method/`} hrefLang={he ? "en" : undefined}>{t.sources.memo}</a>,
  ];
  return (
    <div className="wrap forecast-page">
      <PageHead title={t.title} standfirst={t.standfirst(date, !!f.final)}>
        <p className="ph-meta">{t.meta2(runs, f.inputs.field.length)}</p>
      </PageHead>

      <section aria-labelledby="fc-pred">
        <h2 id="fc-pred" className="sec-h">{t.prediction.h(date, !!f.final)}</h2>
        <figure className="pn-fig fc-bar">
          <figcaption className="pn-lbl">{t.prediction.barCaption}</figcaption>
          <SeatBar size="xl" total={120} majority={61}
            segments={BLOC_SEAT_ORDER.map((b) => ({ key: b, seats: f.blocs[b].point, color: `var(--b-${b})`, ink: `var(--b-${b}-ink)`, label: f.blocs[b].point || undefined, className: `pn-seg pn-seg-${b}` }))}
            label={BLOC_ORDER.map((b) => `${label[b]} ${f.blocs[b].point}`).join(", ")} />
        </figure>
        <div className="table-scroll">
          <table className="data-table fc-table">
            <thead><tr><th scope="col">{t.prediction.cols.bloc}</th><th scope="col" className="num">{t.prediction.cols.central}</th><th scope="col" className="num">{t.prediction.cols.median}</th><th scope="col" className="num">{t.prediction.cols.mean}</th><th scope="col" className="num">{t.prediction.cols.range}</th><th scope="col" className="num">{t.prediction.cols.chance}</th></tr></thead>
            <tbody>{BLOC_ORDER.map((b) => (
              <tr key={b}><th scope="row"><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" /> {label[b]}</th><td className="num"><b>{f.blocs[b].point}</b></td><td className="num">{f.blocs[b].median ?? ""}</td><td className="num">{f.blocs[b].mean}</td><td className="num"><Ltr lang={lang}>{t.prediction.range(f.blocs[b].lo, f.blocs[b].hi)}</Ltr></td><td className="num">{b === "net" ? t.prediction.pct(f.majority.net) : b === "opp" ? t.prediction.pct(f.majority.oppZionist) : ""}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="note">{t.prediction.majority(f.majority.net, f.majority.oppZionist, f.majority.neither, f.majority.oppWithArabAndMid)} {t.prediction.netLarger(f.netLargerThanOpp)} {t.prediction.largest(he ? list(largest) : largest.join(", "))}</p>
        <div className="table-scroll">
          <table className="data-table fc-table">
            <thead><tr><th scope="col">{t.prediction.cols.list}</th><th scope="col" className="num">{t.prediction.cols.share}</th><th scope="col" className="num">{t.prediction.cols.prior}</th><th scope="col" className="num">{t.prediction.cols.central}</th><th scope="col" className="num">{t.prediction.cols.mean}</th><th scope="col" className="num">{t.prediction.cols.range}</th><th scope="col" className="num">{t.prediction.cols.passes}</th></tr></thead>
            <tbody>{lists.map((l) => (
              <tr key={l.id} className={l.passes < 50 ? "dim" : undefined}><th scope="row"><span className="sw" style={{ background: `var(--b-${l.bloc})` }} aria-hidden="true" /> <Tx text={nameOf(l.id)} lang={lang} /></th><td className="num">{l.share.toFixed(1)}%</td><td className="num">{l.prior ? <Ltr lang={lang}>{`${l.prior > 0 ? "+" : "−"}${Math.abs(l.prior).toFixed(1)}`}</Ltr> : ""}</td><td className="num"><b>{l.point}</b></td><td className="num">{l.mean}</td><td className="num"><Ltr lang={lang}>{t.prediction.range(l.lo, l.hi)}</Ltr></td><td className="num">{t.prediction.pct(l.passes)}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <p className="fig-src">{t.prediction.centralNote}</p>
      </section>

      <section aria-labelledby="fc-in">
        <h2 id="fc-in" className="sec-h">{t.inputs.h}</h2>
        <p className="note">{t.inputs.field(f.inputs.field.length, through, days)}</p>
        <div className="table-scroll">
          <table className="data-table fc-table fc-inputs">
            <thead><tr><th scope="col">{t.inputs.cols.publisher}</th><th scope="col">{t.inputs.cols.firm}</th><th scope="col">{t.inputs.cols.published}</th><th scope="col" className="num">{t.inputs.cols.sample}</th><th scope="col" className="num">{t.inputs.cols.weight}</th></tr></thead>
            <tbody>{f.inputs.field.map((q) => <tr key={q.id}><th scope="row"><Tx text={pollsterName(q.pollster, lang)} lang={lang} /></th><td>{q.firm ? <Tx text={pollsterName(q.firm, lang)} lang={lang} /> : ""}</td><td>{mediumDate(q.published, lang)}</td><td className="num">{q.n ? num(q.n) : t.inputs.noSample}</td><td className="num">{q.weight ?? ""}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="note">{t.inputs.checks(checks)}</p>
        <p className="note">{t.inputs.agreements(f.inputs.agreements.length)}{he ? list(f.inputs.agreements.map(([a, b]) => t.inputs.pair(nameOf(a), nameOf(b)))) : f.inputs.agreements.map(([a, b]) => t.inputs.pair(nameOf(a), nameOf(b))).join("; ")}.{(f.inputs.withdrawn?.length ?? 0) > 0 && <> {t.inputs.withdrawn(he ? list(f.inputs.withdrawn!.map(nameOf)) : f.inputs.withdrawn!.map(nameOf).join(", "))}</>}</p>
      </section>

      <section aria-labelledby="fc-how">
        <h2 id="fc-how" className="sec-h">{t.steps.h}</h2>
        <p className="note">{t.steps.intro}</p>
        <ol className="fc-steps">
          <li>{t.steps.s1(f.inputs.field.length, checks, days)}</li>
          <li>{t.steps.s2}</li>
          <li>{t.steps.s3(p.fringeShare ?? 0)}</li>
          <li>{t.steps.s4(he ? list(priorEntries) : priorEntries.join(", "))}</li>
          <li>{t.steps.s5(p.leanSeats, p.historicalResidualSeats)}</li>
          <li>{t.steps.s6}</li>
          <li>{t.steps.s7(p.blocSdSeats)}</li>
          <li>{t.steps.s8(p.listSdPointsAt8pct, p.listSdFloorPoints ?? 0, p.arabSwingSdSeats ?? 0)}</li>
          <li>{t.steps.s9(p.consolidateSdSeats)}</li>
          <li>{t.steps.s10(f.inputs.agreements.length, runs)}</li>
          <li>{t.steps.s11}</li>
        </ol>
      </section>

      <section aria-labelledby="fc-cal">
        <h2 id="fc-cal" className="sec-h">{t.calibration.h}</h2>
        <p className="note">{t.calibration.intro}</p>
        <div className="table-scroll">
          <table className="data-table fc-table">
            <thead><tr><th scope="col">{t.calibration.cols.election}</th><th scope="col" className="num">{t.calibration.cols.field}</th><th scope="col" className="num">{t.calibration.cols.dp}</th><th scope="col" className="num">{t.calibration.cols.result}</th><th scope="col" className="num">{t.calibration.cols.miss}</th></tr></thead>
            <tbody>{cal.map((e) => <tr key={e.date}><th scope="row">{year(e.date)}</th><td className="num">{e.field.toFixed(1)}</td><td className="num">{e.directPolls ?? t.calibration.none}</td><td className="num">{e.result}</td><td className="num"><Ltr lang={lang}>{signed(e.miss)}</Ltr></td></tr>)}</tbody>
          </table>
        </div>
        <p className="fig-src">{t.calibration.threshold(thresholdCases.filter((c) => c.passed).length, thresholdCases.length)}</p>
      </section>

      <section aria-labelledby="fc-rec">
        <h2 id="fc-rec" className="sec-h">{t.record.h}</h2>
        <p className="note">{t.record.intro}</p>
        <div className="table-scroll">
          <table className="data-table fc-table">
            <thead><tr><th scope="col">{t.record.cols.date}</th><th scope="col" className="num">{t.record.cols.version}</th><th scope="col" className="num">{t.record.cols.net}</th><th scope="col" className="num">{t.record.cols.opp}</th><th scope="col" className="num">{t.record.cols.arab}</th><th scope="col" className="num">{t.record.cols.mid}</th><th scope="col" className="num">{t.record.cols.chance}</th><th scope="col">{t.record.cols.status}</th></tr></thead>
            <tbody>{history.map((r, i) => <tr key={i}><th scope="row">{shortDate(r.generated, lang)}</th><td className="num">{r.parameters?.version ?? 1}</td><td className="num">{r.blocs.net}</td><td className="num">{r.blocs.opp}</td><td className="num">{r.blocs.arab}</td><td className="num">{r.blocs.mid}</td><td className="num">{t.prediction.pct(r.majority.net)}</td><td>{r.final ? <b>{t.record.final}</b> : t.record.draft}</td></tr>)}</tbody>
          </table>
        </div>
        <h3 className="sec-h3 fc-sub">{t.record.changesH}</h3>
        <p className="note">{t.record.changesIntro}</p>
        <ul className="fc-changes">{changelog.map((c) => <li key={c.date}><b>{shortDate(c.date, lang)}</b> {he ? c.he : c.en}</li>)}</ul>
      </section>

      <section aria-labelledby="fc-score">
        <h2 id="fc-score" className="sec-h">{t.scoring.h}</h2>
        <p className="note">{t.scoring.intro}</p>
        <ol className="fc-steps">
          <li>{t.scoring.r1}</li><li>{t.scoring.r2}</li><li>{t.scoring.r3}</li><li>{t.scoring.r4}</li><li>{t.scoring.r5}</li>
        </ol>
      </section>

      <section aria-labelledby="fc-wrong">
        <h2 id="fc-wrong" className="sec-h">{t.wrong.h}</h2>
        <p className="note">{t.wrong.text(f.majority.net)}</p>
        <p className="fig-src fc-sources">{t.sources.lead}{sourceLinks.flatMap((l, i) => (i === 0 ? [l] : [i === sourceLinks.length - 1 ? t.sources.and : t.sources.sep, l]))}{t.sources.tail}{" "}
          <Link href={he ? "/he" : "/"}>{he ? "לעמוד הראשי" : "Home"}</Link>{" · "}<Link href={he ? "/he/polls" : "/polls"}>{he ? "סקרים" : "Polls"}</Link>{" · "}<Link href={he ? "/he/coalition-builder" : "/coalition-builder"}>{he ? "מרכיבים קואליציה" : "Coalition Builder"}</Link></p>
      </section>
    </div>
  );
}
