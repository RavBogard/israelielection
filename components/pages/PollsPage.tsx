import Link from "next/link";
import { Suspense } from "react";
import { undatedListNames } from "@/lib/poll-browser";
import PollBrowser from "@/components/PollBrowser";
import PollSensitivity from "@/components/PollSensitivity";
import "@/components/interactives.css";
import "@/components/polls.css";
import "@/components/polls/polls-desk.css";
import PollTrends, { type TrendPanel } from "@/components/PollTrends";
import PollComparison from "@/components/PollComparison";
import PollsLists, { PollsAlternative, PollsBlocs } from "@/components/polls/PollsNow";
import PollTabs from "@/components/polls/PollTabs";
import CiteButton from "@/components/CiteButton";
import { allPolls, averagePoll, blocs, mainPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { averageAsPoll, blocTotals, inWithoutVariant, isExit, pollLabel } from "@/lib/polls";
import { blocTrend, scaledTrends } from "@/lib/trend";
import { houseEffects } from "@/lib/house-effects";
import { newestPoll } from "@/lib/bloc-change";
import { averageFinding, citeText, counterText, leaderFinding, leanFinding, majorityCounts, moverFinding, raceFinding, spreadFinding, variantFinding } from "@/lib/polls-desk";
import { resultsConfig } from "@/lib/results-live";
import BlocRace from "@/components/polls/BlocRace";
import HouseEffects from "@/components/polls/HouseEffects";
import PageHead from "@/components/PageHead";
import { blocName as blocLabel, partyName, pollsterName, Tx } from "@/components/polls/names";
import { hePath, type Lang } from "@/lib/i18n";
import { list } from "@/lib/i18n/he-grammar";
import POLLS, { dayMonthHe, HE_METHOD } from "@/lib/i18n/polls";
// Server component: loads the Hebrew overlays that pollLabel, lib/polls-desk and polls/names read in the Hebrew edition.
import "@/lib/i18n/overlays";

const cfg = pollsData.config;
const tracked = parties.filter((p) => allPolls.some((poll) => poll.results[p.id]));
const variant = cfg.withoutVariant;
const filber = (poll: (typeof allPolls)[number]) => inWithoutVariant(poll, cfg);
const WIKI = "https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election";

/** The polls desk, /polls and /he/polls: the bloc race and the facts line, then four tabs. All words in lib/i18n/polls.ts. */
export default function PollsPage({ lang }: { lang: Lang }) {
  const he = lang === "he";
  const t = POLLS[lang];
  // Lists by their name in this edition; the English objects stay for the arithmetic.
  const named = parties.map((p) => ({ ...p, name: partyName(p, lang) }));
  const nameOf = Object.fromEntries(named.map((p) => [p.id, p.name]));
  const uncertainFigures=[...new Set(allPolls.flatMap(poll=>undatedListNames(poll,named)))];
  const dates = [...new Set(allPolls.map((p) => p.published))].sort();
  const from = dates[0];
  const to = allPolls[0].published;
  const maxSeats = Math.max(...allPolls.flatMap((p) => Object.values(p.results).map((r) => r.seats)));
  const yMax = Math.max(30, Math.ceil(maxSeats / 5) * 5);

  const scaled = scaledTrends(allPolls, parties.map((p) => p.id), cfg);
  const groups = blocs.map((b) => ({
    bloc: b.id,
    label: blocLabel(b, lang),
    panels: tracked
      .filter((p) => p.bloc === b.id)
      .map<TrendPanel>((p) => ({
        id: p.id,
        name: nameOf[p.id],
        short: p.short,
        bloc: p.bloc,
        trend: scaled.get(p.id) ?? [],
        dots: allPolls
          .filter((poll) => poll.results[p.id])
          .map((poll) => ({ date: poll.published, seats: poll.results[p.id].seats, pollster: poll.pollster, ref: filber(poll),dateUncertain:poll.results[p.id].dateUncertain })),
      }))
      .sort((a, b) => (b.trend.at(-1)?.avg ?? 0) - (a.trend.at(-1)?.avg ?? 0)),
  })).filter((g) => g.panels.length);

  const blocName = { net: blocLabel(blocs.find((b) => b.id === "net")!, lang), opp: blocLabel(blocs.find((b) => b.id === "opp")!, lang) };
  const race = blocTrend(allPolls, parties, cfg);
  const raceDots = allPolls.filter((p) => !isExit(p)).map((p) => { const t = blocTotals(p, parties); return { id: p.id, date: p.published, pollster: p.pollster, net: t.net, opp: t.opp, hollow: filber(p) }; });
  const avg = blocTotals(averagePoll, parties);
  const asOf = mainPolls.map((p) => p.published).sort().at(-1)!;
  const newest = newestPoll(allPolls);
  const effects = houseEffects(allPolls, parties, cfg);
  const pollsters = new Set(allPolls.map((p) => p.pollster)).size;

  const sensitivity = (
    <Suspense fallback={<p>{t.loadingSensitivity}</p>}>
      <PollSensitivity polls={allPolls} parties={named} blocs={blocs.map((b) => ({ ...b, label: blocLabel(b, lang) }))} config={cfg} />
    </Suspense>
  );

  const method = he ? <>
    <h2 className="sec-h">{t.method.h}</h2>
    <p className="note">{HE_METHOD.intake(cfg.maxSeatMove)}</p>
    <p className="note">
      {HE_METHOD.window(cfg.currentWindowDays, mediumDate(to, lang), mainPolls.length, list(mainPolls.map((p) => `${pollsterName(p.pollster, lang)} ${shortDate(p.published, lang)}`)))}
      {HE_METHOD.sameIn.a}<Link href={hePath("/coalition-builder")!}>{HE_METHOD.sameIn.builder}</Link>{HE_METHOD.sameIn.mid}
      <Link href="/parties" hrefLang="en">{HE_METHOD.sameIn.map}</Link>{HE_METHOD.sameIn.b}{HE_METHOD.inclusionRule}
    </p>
    <p className="note">{HE_METHOD.average}</p>
    <p className="note">{HE_METHOD.scaling}{HE_METHOD.variantNote}</p>
    {uncertainFigures.length>0&&<p className="note">{HE_METHOD.undated(list(uncertainFigures))}</p>}
    <p className="note">{HE_METHOD.sources.a}<a href={WIKI} hrefLang="en">{HE_METHOD.sources.wiki}</a>{HE_METHOD.sources.b}<a href="#every-poll">{HE_METHOD.sources.every}</a>{HE_METHOD.sources.c}</p>
    {sensitivity}
  </> : <>
    <h2 className="sec-h">How the average is made</h2>
    <p className="note">
        New polls arrive twice a day from Wikipedia&apos;s polling tables and are checked automatically before they appear here: seats must add
        to 120, the pollster must be one we know, and no party may jump more than {cfg.maxSeatMove} seats from that pollster&apos;s previous poll.
    </p>
    <p className="note">
      Each pollster&apos;s latest poll from the {cfg.currentWindowDays} days up to {mediumDate(to)} ({mainPolls.length} polls:{" "}
      {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}). The <Link href="/coalition-builder">Coalition Builder</Link> and{" "}
      <Link href="/parties">Party Map</Link> use the same polls. {cfg.inclusionRule}
    </p>
    <p className="note">
      Each list&apos;s average is taken over the polls where it passed the 3.25% threshold, so a list that passes never averages below 4
      seats; &ldquo;passes in k of n&rdquo; counts those polls out of the polls that reported the list. A list that passes in fewer than
      half is shown as near the threshold and left out of the Coalition Builder&apos;s default count. Polls are weighted by the square
      root of their sample size; a poll that reports no sample size counts as the median of those that do. Because small lists sometimes miss the threshold, these averages can add to more than 120; the Coalition Builder, the Party Map and the home page scale them down in proportion only when their sum exceeds 120. Every seat figure on this page, the trend lines included, is that scaled average, as in the builder, the Party Map and the home page.{" "}
      {variant.note}
    </p>
    {uncertainFigures.length>0&&<p className="note">Figure-date uncertainty: the register includes figures for {uncertainFigures.join(", ")} whose own dates were not recorded. They retain the register entry’s publication date in these charts and calculations; that date is not a confirmed date for each figure. The poll browser marks them † and its method card explains the distinction.</p>}
    <p className="note">Sources: <a href={WIKI}>Wikipedia&apos;s polling tables</a> and the reports each poll cites, linked from every row of <a href="#every-poll">Every poll</a>.</p>
    {sensitivity}
  </>;

  const variantNames = variant.pollsters.map((n) => pollsterName(n, lang));
  const tabs = [
    { id: "parties" as const, content: <>
      <PollsLists title={leaderFinding(averagePoll, mainPolls, named, lang)} lang={lang} />
      <PollComparison title={moverFinding(scaled, nameOf, from, lang)} panels={groups.flatMap((g) => g.panels)} dates={dates} from={from} to={to} yMax={yMax} hollowNames={variant.pollsters} />
      <details className="pt-fold"><summary>{t.fold}</summary>
      <PollTrends dates={dates} groups={groups} from={from} to={to} yMax={yMax} refLabel={t.refLabel(variantNames)} />
      <p className="note">
        {he ? t.foldNote(yMax) : <>Dots are single polls; lines are the list&apos;s seats in the site&apos;s polling average on each publication date, scaled to 120 as above. Per-party zoom shows small changes, with a minimum four-seat span and enough range for every dot. The bounds are labeled: heights across zoomed panels do not compare party size. Switch to the shared 0–{yMax} scale to compare size. A reported threshold failure stays at zero; zero is not the 3.25% vote threshold. Gaps mean no separate average. Point, tap or use left/right arrow keys for dated values.</>}
      </p>
      </details>
    </> },
    { id: "pollsters" as const, content: <>
      <PollsBlocs title={spreadFinding(mainPolls, parties, lang)} lang={lang} />
      <HouseEffects title={leanFinding(effects, undefined, lang)} rows={effects} labels={blocName} hollowNames={variant.pollsters} lang={lang} />
      <PollsAlternative title={variantFinding(avg, blocTotals(averageAsPoll(variantPolls, parties.map((p) => p.id)), parties), variant.pollsters, lang)} lang={lang} />
    </> },
    { id: "every-poll" as const, content: (
      <Suspense fallback={<p>{t.loadingBrowser}</p>}>
        <PollBrowser title={t.browserTitle(allPolls.length, pollsters, he ? dayMonthHe(from) : mediumDate(from))} polls={allPolls} parties={named} currentIds={mainPolls.map((p) => p.id)} config={cfg} />
      </Suspense>
    ) },
    { id: "method" as const, content: method },
  ].map((tab) => ({ ...tab, label: t.tabs[tab.id] }));

  return (
    <div className="ix pl">
      <div className="wrap">
        <PageHead title={t.title} standfirst={averageFinding(avg, lang)} />

        <BlocRace title={raceFinding(race, lang)} trend={race} dots={raceDots} labels={blocName} hollowNames={variant.pollsters} windowDays={cfg.currentWindowDays} until={resultsConfig.election}>
          <div className="pd-facts">
            <p className="pd-count">{counterText(majorityCounts(mainPolls, parties), lang)}.</p>
            {newest && (he
              ? <p>{t.facts.newest}<a href="#browser"><Tx text={pollLabel(newest, lang)} lang={lang} />, {dayMonthHe(newest.published)}</a></p>
              : <p>Newest poll: <a href="#browser">{pollLabel(newest)}, {mediumDate(newest.published)}</a></p>)}
            <CiteButton text={citeText(avg, mainPolls.length, asOf, undefined, lang)} label={t.facts.cite} />
          </div>
        </BlocRace>

        <PollTabs tabs={tabs} />
      </div>
    </div>
  );
}
