import {getWorkspaceRegistry} from "@/lib/political-record/workspace-server";
import LiveCount from "@/components/LiveCount";
import {homeEditionBoundary} from "@/components/reference/workspace-view";
import PendingEditionHome from "@/components/reference/PendingEditionHome";
import {briefingSentence} from "@/lib/briefing-locale";
import {briefingCopy,briefingCoverageNote} from "@/lib/i18n/briefing";
import GovernmentLive from "@/components/government/GovernmentLive";
import { lifecycleForRender } from "@/lib/seat-context-server";
import { seatContextForRender } from "@/lib/seat-context-server";
import HomeHero from "@/components/HomeHero";
import ChamberHero, { type ChamberProgress } from "@/components/ChamberHero";
import StandingHome from "@/components/StandingHome";
import { swornGovernment } from "@/lib/standing-home";
import { getLiveForecast } from "@/lib/live-forecast/server";
import { expectedFinalValid, getCountEstimate } from "@/lib/live-forecast/count-estimate";
import { homeHeadlines } from "@/components/HomeHeadlines";
import type {SharedSeatContext} from "@/lib/election-lifecycle/types";
import {contextToPoll} from "@/lib/seat-context";
import {DASHBOARD} from "@/lib/i18n/election-dashboard";
import { forecastPresentation } from "@/components/live-forecast/LiveForecast";
import Link from "next/link";
import type { ReactNode } from "react";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/lib/election-date";
import { BuilderGlyph, BuilderSeatsGlyph, PartyMapGlyph, PollsGlyph, ResultsSeatsGlyph, StepsGlyph, VoteMapGlyph } from "@/components/HomeGlyphs";
import { nextSteps } from "@/lib/government-next";
import type {RaceOption} from "@/components/HomeRace";
import type {CadenceMetadata} from "@/lib/election-lifecycle/cadence";
import renderLiveForecast from "@/components/live-forecast/LiveForecast";
import { homeRaceModel } from "@/lib/home-race";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { MAJORITY } from "@/lib/coalition";
import { allPolls, averagePoll, blocs, exitPolls, mainPolls, parties, pollsData } from "@/lib/data";
import { forecast, forecastPoll } from "@/lib/forecast";
import { mediumDate, shortDate } from "@/lib/format";
import { blocRank, isExit, pollLabel, seatFigure } from "@/lib/polls";
import { citeText, findingSentence, israelDate, noNewLabel, pollSlip, sincePolls, type Slip } from "@/lib/home-since";
import CiteButton from "@/components/CiteButton";
import SeatBar from "@/components/SeatBar";
import { blocChange, blocSeries, newestPoll } from "@/lib/bloc-change";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsNow, resultsConfig } from "@/lib/results-live";
import { exitTime, homeHero, night, type Night } from "@/lib/results-phase";
import ExitPollTable from "@/components/results/ExitPollTable";
import AirTime from "@/components/results/AirTime";
import { pollsterName } from "@/components/results/names";
import { splitExits } from "@/lib/exit-split";
import { EXIT_TABLE } from "@/lib/i18n/exit-table";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { blocText, pollsterText } from "@/lib/i18n/overlays";
import chrome from "@/lib/i18n/chrome";
import HOME from "@/lib/i18n/home";
import type { Poll } from "@/lib/types";

/**
 * The home page, / and /he: the headline and the 120-seat mosaic, since yesterday, the reader's path and the four
 * tools. Words in lib/i18n/home.ts; generated sentences in lib/home-since.ts and lib/results-phase.ts.
 * The route files set `revalidate` (every minute: on election night the hero shows the count as it comes in).
 */

/** Each sentence's `textHe` is the briefing job's checked Hebrew (lib/briefing.ts checkTranslation), when it exists. */
const briefings = briefingsJson as Briefing[];

/** Links within the edition: the Hebrew home links to the Hebrew pages where they exist. */
/** The poll shape the Party Map glyph reads, carrying the shared seat context's seats once the count drives them. */
const seatPoll = (poll: Poll, context: SharedSeatContext): Poll => ({ ...poll, results: Object.fromEntries(Object.entries(context.pointSeats).map(([id, seats]) => [id, { seats }])) } as unknown as Poll);
const href = (lang: Lang, en: string, _he?: string) => lang === "en" ? en : editionPath(_he ?? en, lang) ?? en;
/** English text on the Hebrew home (an English-only page's name, the briefing), marked as such. */
const En = ({ children }: { children: ReactNode }) => <span lang="en" dir="ltr">{children}</span>;

/** Bloc labels in this edition, for the slips and the finding. */
const blocsIn = (lang: Lang) => (lang !== "en" ? blocs.map((b) => ({ ...b, label: blocText(b, lang).text })) : blocs);

/** Current modeled seats, with election-night freshness preserved. */
function Race({ poll, live, days, phase, lang, context, cadence, news, progress }: { progress?: ChamberProgress; news?: ReactNode; cadence?:CadenceMetadata;poll: Poll; live: boolean; days: number; phase: Night["phase"]; lang: Lang; context:SharedSeatContext|null }) {
  // Once the count drives the seats, the hero is the plenum against 61 (Daniel, 2026-10-28, option C).
  if (context && progress && phase !== "before" && (context.basis === "partial_count" || context.basis === "official_seats")) return <ChamberHero initial={context} lang={lang} news={news} progress={progress} />;
  const t = HOME[lang].hero, he = lang !== "en";
  const pollsters = new Intl.ListFormat(lang, { type: "conjunction" }).format(mainPolls.map((p) => (he ? pollsterText(p.pollster, lang).text : p.pollster))), newest = live ? null : newestPoll(allPolls), change = live ? null : blocChange(blocSeries(pollsData.polls, parties, pollsData.config));
  const model = homeRaceModel(poll, parties, blocs, lang), net = model.rows.find((r) => r.id === "net")!, cite = live || phase !== "before" ? null : citeText(poll, mainPolls.length, net.label, net.seats, undefined, lang);
  // The bloc list's header says what the numbers are; the note under the grid says where they come from, once.
  const avgSource = <>{t.avgSource(pollsters)}{newest && <>{t.newest}<Link href={href(lang, "/polls#browser", "/he/polls#browser")}>{pollLabel(newest, lang)}, {mediumDate(newest.published, lang)}</Link>. </>}<Link href={href(lang, "/polls#method", "/he/polls#method")}>{t.method}</Link>.{cite && <> <CiteButton text={cite} /></>}</>;
  // Before the count: the forecast model first (Daniel, 2026-10-23), then the site average, then each pollster's newest
  // poll on a second row, switchable over the bloc list. The average without Filber's firms stays on the polls page.
  const cfg = pollsData.config;
  const pollOption = (p: Poll): RaceOption => {
    const label = he ? pollsterText(p.pollster, lang).text : p.pollster, firm = p.firm ? (he ? pollsterText(p.firm, lang).text : p.firm) : null;
    // The change row is this pollster's own movement: its series of polls, against the one about a week before.
    const own = blocChange(blocSeries(pollsData.polls.filter((q) => q.pollster === p.pollster), parties, cfg));
    return { id: p.id, label, detail: shortDate(p.published, lang), model: homeRaceModel(p, parties, blocs, lang), change: own, heading: t.basisPoll(label, mediumDate(p.published, lang)),
      source: <>{t.pollSource(label, firm, p.n, mediumDate(p.published, lang))}{t.latestNote}{p.url && <><a href={p.url} hrefLang={he ? undefined : "en"}>{t.pollReport}</a>. </>}<Link href={href(lang, "/polls#browser", "/he/polls#browser")}>{t.everyPoll}</Link>.</> };
  };
  // Election night: each channel's latest exit poll as its own comparison (Channel 14 and i24NEWS stay out; they are
  // shown apart in the table under the hero). After the forecast, so the shared context (or the forecast) stays the default.
  const x = EXIT_TABLE[lang], exits = splitExits(allPolls, cfg);
  const exitOption = (p: Poll): RaceOption => {
    const name = pollsterName(p.pollster, lang).text, at = exitTime(p, resultsConfig);
    return { id: p.id, label: name, detail: new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(at)), model: homeRaceModel(p, parties, blocs, lang), heading: <>{pollLabel(p, lang)}, <AirTime at={at} lang={lang} updated={exits.updated.has(p.pollster)} /></>,
      source: <>{x.caution} <Link href={href(lang, "/results", "/he/results")}>{x.more}</Link>.</> };
  };
  // Exit polls are retired from the live surfaces once the count is in (Daniel, 2026-10-28): only on the night before it.
  const exitChoice: RaceOption[] = exits.main.length && (phase === "before" || phase === "exit") ? [{ id: "exits", label: x.pick, detail: x.pickDetail(exits.main.length), model: homeRaceModel(exits.main[0], parties, blocs, lang), variants: exits.main.map(exitOption), variantsLabel: x.pickPoll }] : [];
  // Once polls close, the saved campaign forecast leaves the hero (Daniel, 2026-10-27): live evidence leads;
  // the forecast stays on its own page.
  const afterClose = phase !== "before";
  const options: RaceOption[] = [
    { id:"current",label:DASHBOARD[lang].current,model:homeRaceModel(context?contextToPoll(context):averagePoll,parties,blocs,lang) },
    ...(afterClose ? [] : [{ id: "forecast", label: t.pickForecast, detail: t.pickRuns(forecast.runs.toLocaleString(locale(lang))), model: homeRaceModel(forecastPoll, parties, blocs, lang), heading: t.basisForecast(mediumDate(forecast.generated, lang), !!forecast.final), source: <>{t.forecastSource(forecast.majority.net, forecast.majority.oppZionist, forecast.majority.neither)}<Link href={href(lang, "/forecast", "/he/forecast")}>{t.forecastMethod}</Link>.</>, forecast: { blocs: forecast.blocs, majority: forecast.majority } }]),
    ...exitChoice,
    { id: "avg", label: t.pickAverage, detail: t.pickPolls(mainPolls.length), model:homeRaceModel(averagePoll,parties,blocs,lang), change, heading: t.basis(mainPolls.length,shortDate(mainPolls[0].published,lang)), source: avgSource },
    { id: "latest", label: t.pickLatest, detail: t.pickPollsters(mainPolls.length), model, variants: mainPolls.map(pollOption), variantsLabel: t.pickPoll },
  ];
  return <HomeHero initial={context} options={options} days={days} lang={lang} cadence={cadence} phase={phase} news={news}/>;
}

/** Since yesterday: the newest polls as slips with one finding from the current polls, then the briefing's first two sentences. */
function Since({ now, lang }: { now: number; lang: Lang }) {
  const t = HOME[lang].since, he = lang !== "en", bl = blocsIn(lang);
  const today = israelDate(now), { polls, fresh } = sincePolls(allPolls, today);
  const finding = findingSentence(mainPolls, parties, bl, "net", lang), b = briefings[0];
  const briefDate = b ? new Intl.DateTimeFormat(locale(lang), { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${b.date}T12:00:00Z`)) : "";
  // The Hebrew home shows the checked Hebrew briefing, labelled as machine-translated, once the job writes `textHe`;
  // until then (or when its checks fail) the English sentences, marked as English.
  const shown = b ? b.sentences.slice(0, 2) : [], heBrief = lang !== "en" && shown.length > 0 && shown.every((s) => briefingSentence(s,lang).text);
  return (
    <section className="since" aria-labelledby="since-h">
      <h2 id="since-h">{t.heading}</h2>
      <div className="since-polls">
        {!fresh && <p className="since-none">{noNewLabel(polls[0], lang)}{t.newest}</p>}
        <ul className="since-slips">{polls.map((p) => <PollSlip key={p.id} slip={pollSlip(p, parties, bl, lang)} lang={lang} />)}</ul>
        {finding && <p className="since-finding">{finding} <Link href={href(lang, "/polls", "/he/polls")}>{t.allPolls}</Link></p>}
      </div>
      {b && b.sentences.length > 0 && (
        <div className="since-brief">
          <h3>{b.date === today ? t.today : t.briefing(briefDate)}{he && <small className="since-brief-lang"> {heBrief ? t.machine : t.english}</small>}</h3>
          {b.coverage?.state==="limited"&&<p className="fig-src">{briefingCoverageNote(lang)}</p>}
          <ul>{shown.map((s, i) => <li key={i}>{lang === "en" ? s.text : heBrief ? briefingSentence(s,lang).text : briefingCopy(lang).pendingNote} <span className="srcs">{s.sources.map((src, k) => <a key={k} href={src.url} title={src.title} hrefLang={he ? "en" : undefined}>{src.outlet}</a>)}</span></li>)}</ul>
          <Link href={editionPath("/news",lang)??"/news"} className="more">{t.full}</Link>
        </div>
      )}
    </section>
  );
}

const slipLabel = (label: string) => label.replace(/\s*\(.*\)$/, "");
/** A single poll reports whole seats; keep a decimal only where a poll itself has one. */
const pollSeats = (s: number) => (Number.isInteger(s) ? String(s) : seatFigure(s));
function PollSlip({ slip, lang }: { slip: Slip; lang: Lang }) {
  const t = HOME[lang].since, he = lang !== "en";
  // The bar runs in seat order (slip.blocs); the list under it runs in the site's bloc order.
  const listed = [...slip.blocs].sort((a, b) => blocRank(a.id) - blocRank(b.id));
  const label = `${slip.label}, ${mediumDate(slip.date, lang)}: ${listed.map((b) => `${slipLabel(b.label)} ${pollSeats(b.seats)}`).join(", ")}`;
  const majority = listed.filter((b) => b.majority).map((b) => slipLabel(b.label));
  return (
    <li className="since-slip">
      <p className="ss-head"><b>{slip.label}</b> <span>{shortDate(slip.date, lang)}</span></p>
      <SeatBar segments={slip.blocs.map((b) => ({ key: b.id, seats: b.seats, color: `var(--b-${b.id})` }))} label={label} />
      <ul className="ss-blocs">{listed.map((b) => <li key={b.id} className={b.majority ? "maj" : undefined}><span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />{slipLabel(b.label)}<b>{pollSeats(b.seats)}</b></li>)}</ul>
      {slip.majority.length > 0 && <p className="ss-maj">{t.atMajority(he ? new Intl.ListFormat(lang).format(majority) : majority.join(t.and), MAJORITY)}</p>}
      {slip.url && <a className="ss-src" href={slip.url}>{t.source}</a>}
    </li>
  );
}

export default async function HomePage({ lang, revalidate }: { lang: Lang; revalidate: number }) {
  const edition=homeEditionBoundary(await getWorkspaceRegistry());
  if(edition.state!=="legacy")return <PendingEditionHome lang={lang} id={edition.id}/>;
  const he = lang !== "en", s = HOME[lang].start, tl = HOME[lang].tools, enLink = he ? "en" : undefined;
  const now = resultsNow();
  const [live, liveForecast, context, lifecycle, news, estimate] = await Promise.all([fetchCount(revalidate, { now }), renderLiveForecast({ lang, compact: true }), seatContextForRender(), lifecycleForRender(), homeHeadlines(lang), getLiveForecast().then((s) => getCountEstimate(s)).catch(() => null)]);
  // Once the Knesset record shows a government sworn in, the home becomes the standing reference (Daniel, 2026-10-28).
  // The switch reads only the lifecycle record /government uses, never the date or the seat totals.
  const sworn = swornGovernment(lifecycle);
  if (sworn && lifecycle) return <div className="home"><div className="wrap"><StandingHome government={sworn} snapshot={lifecycle} lang={lang} news={news} /></div></div>;
  const n = night(live, resultsConfig, now), hero = homeHero(n.phase);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : null;
  const days = daysUntil(ELECTION_DAY);
  const progress: ChamberProgress = {
    counted: live.state === "open" && live.count.valid ? live.count.valid / Math.max(expectedFinalValid(), live.count.valid) : null,
    envelopesPending: estimate?.mode === "count" ? (estimate.envelopes?.remaining ?? null) : null,
    blocIntervals: estimate?.mode === "count" ? estimate.blocIntervals : undefined,
  };
  // After close the thumbnails follow the count, else the newest exit poll; the average only before close.
  const poll = results ?? (hero === "exit" ? exitPolls[0] : undefined) ?? averagePoll;
  const trendPolls = allPolls.filter((p) => !isExit(p));
  const countDriven = !!context && n.phase !== "before" && (context.basis === "partial_count" || context.basis === "official_seats");
  return (
    <div className="home">
      <div className="wrap">
        <Race news={news} progress={progress} context={context} cadence={lifecycle?.cadence} poll={poll} live={!!results} days={days} phase={n.phase} lang={lang}/>
        {/* After the hero: the race in numbers with every list's projected seats, then the exit polls (Daniel, 2026-10-28).
            Once the count drives the seats, the count is the only estimate on the page and the exit-poll model steps aside (Daniel, 2026-10-28). */}
        {!(context && (context.basis === "partial_count" || context.basis === "official_seats")) && liveForecast}
        {live.state === "open" && n.phase !== "before" && <LiveCount count={live.count} sourceUpdatedAt={live.sourceUpdatedAt} fetchedAt={live.fetchedAt} lang={lang} now={now} envelopes={estimate?.mode === "count" ? (estimate.envelopes?.expected ?? null) : null} />}
        {(n.phase === "before" || n.phase === "exit") && <ExitPollTable polls={allPolls} pollsConfig={pollsData.config} config={resultsConfig} lang={lang} more />}
        {lifecycle && <GovernmentLive onlyWhenRelevant initial={lifecycle} lang={lang} compact hideSeats {...forecastPresentation(lang)}/>}

        {context?.evidenceStage === "campaign" && n.phase === "before" && <Since now={now} lang={lang} />}

        {he ? (
          <p className="start">
            {s.lead}<Link href="/start" hrefLang="en">{s.route}</Link>{s.middle}<Link href="/how-it-works" hrefLang="en">{s.how}</Link>{s.middle}<Link href="/parties" hrefLang="en">{s.parties}</Link>{s.and}<Link href="/how-it-works/who-votes" hrefLang="en">{s.who}</Link> {chrome[lang].inEnglish}.
          </p>
        ) : (
          <p className="start">
            New here? <Link href="/start">Take a short guided route</Link>, or go straight to <Link href="/how-it-works">how it works</Link>,{" "}
            <Link href="/parties">the parties</Link> and <Link href="/how-it-works/who-votes">who votes</Link>.
          </p>
        )}

        <section className="tools" aria-labelledby="tools-h">
          <h2 id="tools-h">{tl.heading}</h2>
          <ul>
            {countDriven && context && (
              <li>
                <Link href={href(lang, "/results", "/he/results")}>
                  <ResultsSeatsGlyph context={context} />
                  <span className="t">{tl.resultsT}</span>
                  <span className="p">{tl.resultsText}</span>
                </Link>
              </li>
            )}
            {countDriven && lifecycle && (
              <li>
                <Link href={href(lang, "/government", "/he/government")}>
                  <StepsGlyph done={nextSteps(lifecycle).filter((x) => x.state === "done").length} total={4} />
                  <span className="t">{tl.govT}</span>
                  <span className="p">{tl.govText}</span>
                </Link>
              </li>
            )}
            <li>
              <Link href={href(lang, "/coalition-builder", "/he/coalition-builder")}>
                {countDriven && context ? <BuilderSeatsGlyph context={context} /> : <BuilderGlyph parties={parties} poll={poll} />}
                <span className="t">{tl.builder}</span>
                <span className="p">{results ? tl.builderLive : tl.builderText}</span>
              </Link>
            </li>
            <li>
              <Link href="/parties" hrefLang={enLink}>
                <PartyMapGlyph parties={parties} poll={countDriven && context ? seatPoll(poll, context) : poll} />
                <span className="t">{tl.partyMap}</span>
                <span className="p">{countDriven ? tl.partyMapCount : tl.partyMapText}</span>
              </Link>
            </li>
            {!countDriven && (
              <>
                <li>
                  <Link href={href(lang, "/polls", "/he/polls")}>
                    <PollsGlyph polls={trendPolls} parties={parties} config={pollsData.config} />
                    <span className="t">{tl.polls}</span>
                    <span className="p">{tl.pollsText}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/vote-map" hrefLang={enLink}>
                    <VoteMapGlyph />
                    <span className="t">{tl.voteMap}</span>
                    <span className="p">{tl.voteMapText}</span>
                  </Link>
                </li>
              </>
            )}
          </ul>
          {countDriven && (
            <>
              <h2 id="records-h" className="tools-records-h">{tl.recordsH}</h2>
              <ul aria-labelledby="records-h">
                <li>
                  <Link href={href(lang, "/polls", "/he/polls")}>
                    <PollsGlyph polls={trendPolls} parties={parties} config={pollsData.config} />
                    <span className="t">{tl.pollsRecord}</span>
                    <span className="p">{tl.pollsRecordText}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/vote-map" hrefLang={enLink}>
                    <VoteMapGlyph />
                    <span className="t">{tl.voteMap}</span>
                    <span className="p">{tl.voteMapText}</span>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
