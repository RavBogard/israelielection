import Link from "next/link";
import type { ReactNode } from "react";
import "@/components/home.css";
import { ELECTION_DAY, daysUntil } from "@/components/Countdown";
import { BuilderGlyph, PartyMapGlyph, PollsGlyph, VoteMapGlyph } from "@/components/HomeGlyphs";
import HomeRace, { type RaceOption } from "@/components/HomeRace";
import renderLiveForecast from "@/components/live-forecast/LiveForecast";
import { homeRaceModel } from "@/lib/home-race";
import briefingsJson from "@/data/briefings/_index.json";
import type { Briefing } from "@/lib/briefing";
import { KNESSET, MAJORITY } from "@/lib/coalition";
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
import { headline, homeHero, night, type Night } from "@/lib/results-phase";
import ExitPollBars from "@/components/results/ExitPollBars";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { blocText, pollsterText } from "@/lib/i18n/overlays";
import chrome from "@/lib/i18n/chrome";
import resultsText from "@/lib/i18n/results";
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
const href = (lang: Lang, en: string, _he?: string) => lang === "en" ? en : editionPath(_he ?? en, lang) ?? en;
/** English text on the Hebrew home (an English-only page's name, the briefing), marked as such. */
const En = ({ children }: { children: ReactNode }) => <span lang="en" dir="ltr">{children}</span>;

/** Bloc labels in this edition, for the slips and the finding. */
const blocsIn = (lang: Lang) => (lang !== "en" ? blocs.map((b) => ({ ...b, label: blocText(b, lang).text })) : blocs);

/** After close and before the count is past early: the channels' exit polls, never the pre-election average. */
function ExitHero({ n, lang }: { n: Night; lang: Lang }) {
  const t = HOME[lang].exit;
  return <section className="hero hero-exit" aria-labelledby="hero-h"><div className="text"><h1 id="hero-h">{headline(n.phase, 0, lang)}</h1><p className="standfirst">{t.standfirst(MAJORITY, KNESSET)}</p></div>
  <div className="race-meta"><p className="race-basis">{t.basis}</p>{n.phase === "early" && n.counted && <p className="race-newest">{t.early((n.counted.share * 100).toFixed(1))}<Link href={href(lang, "/results", "/he/results")}>{t.follow}</Link></p>}</div>
  <ExitPollBars config={resultsConfig} heading={null} className="home-exit" lang={lang} />
  <p className="race-context"><Link href={href(lang, "/results", "/he/results")}>{t.context}</Link>.</p>
 </section>;
}

/** Current modeled seats, with election-night freshness preserved. */
function Race({ poll, live, days, phase, lang }: { poll: Poll; live: boolean; days: number; phase: Night["phase"]; lang: Lang }) {
  const t = HOME[lang].hero, he = lang !== "en";
  const pollsters = new Intl.ListFormat(lang, { type: "conjunction" }).format(mainPolls.map((p) => (he ? pollsterText(p.pollster, lang).text : p.pollster))), newest = live ? null : newestPoll(allPolls), change = live ? null : blocChange(blocSeries(pollsData.polls, parties, pollsData.config));
  const model = homeRaceModel(poll, parties, blocs, lang), net = model.rows.find((r) => r.id === "net")!, cite = live || phase !== "before" ? null : citeText(poll, mainPolls.length, net.label, net.seats, undefined, lang);
  // The bloc list's header says what the numbers are; the note under the grid says where they come from, once.
  const basis = live ? poll.resultState?.freshness === "stale" ? t.basisStale : t.basisLive : t.basis(mainPolls.length, shortDate(mainPolls[0].published, lang));
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
  const options: RaceOption[] | undefined = live ? undefined : [
    { id: "forecast", label: t.pickForecast, detail: t.pickRuns(forecast.runs.toLocaleString(locale(lang))), model: homeRaceModel(forecastPoll, parties, blocs, lang), heading: t.basisForecast(mediumDate(forecast.generated, lang), !!forecast.final), source: <>{t.forecastSource(forecast.majority.net, forecast.majority.oppZionist, forecast.majority.neither)}<Link href={href(lang, "/forecast", "/he/forecast")}>{t.forecastMethod}</Link>.</>, forecast: { blocs: forecast.blocs, majority: forecast.majority } },
    { id: "avg", label: t.pickAverage, detail: t.pickPolls(mainPolls.length), model, change, heading: basis, source: avgSource },
    { id: "latest", label: t.pickLatest, detail: t.pickPollsters(mainPolls.length), model, variants: mainPolls.map(pollOption), variantsLabel: t.pickPoll },
  ];
  return <section className="hero" aria-labelledby="hero-h"><div className="text"><h1 id="hero-h">{headline(phase, days, lang)}</h1><p className="standfirst">{live ? t.standfirstLive : t.standfirst}{t.majority(MAJORITY, KNESSET)}</p></div>
  {options ? <HomeRace options={options} /> : <HomeRace model={model} change={change} heading={basis} />}
  {live && <p className="race-source fig-src">{poll.resultState?.freshness === "stale" && <b>{t.stale}</b>}{t.liveSource(countTime(poll.resultState?.capturedAt ?? poll.published, lang), poll.resultState?.sourceUpdatedAt ? countTime(poll.resultState.sourceUpdatedAt, lang) : t.unrecorded)}<Link href={href(lang, "/results", "/he/results")}>{t.fullResults}</Link>.</p>}
  <p className="race-context">{t.contextBefore}<Link href={href(lang, "/parties", "/he/compare")}>{t.partyMap}</Link>{t.contextMiddle}<Link href={href(lang, "/coalition-builder", "/he/coalition-builder")}>{t.builder}</Link>.</p>
 </section>;
}

/** Since yesterday: the newest polls as slips with one finding from the current polls, then the briefing's first two sentences. */
function Since({ now, lang }: { now: number; lang: Lang }) {
  const t = HOME[lang].since, he = lang !== "en", bl = blocsIn(lang);
  const today = israelDate(now), { polls, fresh } = sincePolls(allPolls, today);
  const finding = findingSentence(mainPolls, parties, bl, "net", lang), b = briefings[0];
  const briefDate = b ? new Intl.DateTimeFormat(locale(lang), { month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${b.date}T12:00:00Z`)) : "";
  // The Hebrew home shows the checked Hebrew briefing, labelled as machine-translated, once the job writes `textHe`;
  // until then (or when its checks fail) the English sentences, marked as English.
  const shown = b ? b.sentences.slice(0, 2) : [], heBrief = lang === "he" && shown.length > 0 && shown.every((s) => s.textHe);
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
          <ul>{shown.map((s, i) => <li key={i}>{he ? heBrief ? s.textHe : <En>{s.text}</En> : s.text} <span className="srcs">{s.sources.map((src, k) => <a key={k} href={src.url} title={src.title} hrefLang={he ? "en" : undefined}>{src.outlet}</a>)}</span></li>)}</ul>
          <Link href="/news" className="more" hrefLang={he ? "en" : undefined}>{t.full}</Link>
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

/** A count timestamp in Israel time ("Oct 27, 10:30 PM Israel time" / "27.10, 22:30 שעון ישראל"); a bare date passes through. */
function countTime(iso: string, lang: Lang): string {
  if (!iso.includes("T")) return iso;
  const when = new Date(iso);
  if (lang !== "en") return resultsText[lang].israelTime(new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(when));
  return `${new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(when)} Israel time`;
}

export default async function HomePage({ lang, revalidate }: { lang: Lang; revalidate: number }) {
  const he = lang !== "en", s = HOME[lang].start, tl = HOME[lang].tools, enLink = he ? "en" : undefined;
  const now = resultsNow();
  const [live, liveForecast] = await Promise.all([fetchCount(revalidate, { now }), renderLiveForecast({ lang, compact: true })]);
  const n = night(live, resultsConfig, now), hero = homeHero(n.phase);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : null;
  const days = daysUntil(ELECTION_DAY);
  // After close the thumbnails follow the count, else the newest exit poll; the average only before close.
  const poll = results ?? (hero === "exit" ? exitPolls[0] : undefined) ?? averagePoll;
  const trendPolls = allPolls.filter((p) => !isExit(p));
  return (
    <div className="home">
      <div className="wrap">
        {hero === "exit" ? <ExitHero n={n} lang={lang} /> : <Race poll={poll} live={!!results} days={days} phase={n.phase} lang={lang} />}
        {liveForecast}

        {n.phase === "before" && <Since now={now} lang={lang} />}

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
            <li>
              <Link href={href(lang, "/coalition-builder", "/he/coalition-builder")}>
                <BuilderGlyph parties={parties} poll={poll} />
                <span className="t">{tl.builder}</span>
                <span className="p">{results ? tl.builderLive : tl.builderText}</span>
              </Link>
            </li>
            <li>
              <Link href="/parties" hrefLang={enLink}>
                <PartyMapGlyph parties={parties} poll={poll} />
                <span className="t">{tl.partyMap}</span>
                <span className="p">{tl.partyMapText}</span>
              </Link>
            </li>
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
          </ul>
        </section>
      </div>
    </div>
  );
}
