import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import Link from "next/link";
import { Suspense } from "react";
import {undatedListNames} from "@/lib/poll-browser";
import PollBrowser from "@/components/PollBrowser";
import PollSensitivity from "@/components/PollSensitivity";
import "@/components/interactives.css";
import "@/components/polls.css";
import PollTrends, { type TrendPanel } from "@/components/PollTrends";
import PollComparison from "@/components/PollComparison";
import PollsNow from "@/components/polls/PollsNow";
import { allPolls, blocs, mainPolls, parties, pollsData } from "@/lib/data";
import { longDate, mediumDate, shortDate } from "@/lib/format";
import { blocTotals, inWithoutVariant, isExit } from "@/lib/polls";
import { blocTrend, scaledTrends } from "@/lib/trend";
import { houseEffects } from "@/lib/house-effects";
import BlocRace from "@/components/polls/BlocRace";
import HouseEffects from "@/components/polls/HouseEffects";
import PageHead from "@/components/PageHead";

export const metadata: Metadata = {
  title: "Polls",
  description: "Every Knesset seat poll of the 2026 campaign we track, the current average, and how each party has moved.",
  alternates: alternates("/polls"),
};

export const revalidate = 3600;

const cfg = pollsData.config;
const tracked = parties.filter((p) => allPolls.some((poll) => poll.results[p.id]));
const variant = cfg.withoutVariant;
const filber = (poll: (typeof allPolls)[number]) => inWithoutVariant(poll, cfg);

export default function Page() {
  const uncertainFigures=[...new Set(allPolls.flatMap(poll=>undatedListNames(poll,parties)))];
  const dates = [...new Set(allPolls.map((p) => p.published))].sort();
  const from = dates[0];
  const to = allPolls[0].published;
  const maxSeats = Math.max(...allPolls.flatMap((p) => Object.values(p.results).map((r) => r.seats)));
  const yMax = Math.max(30, Math.ceil(maxSeats / 5) * 5);

  const scaled = scaledTrends(allPolls, parties.map((p) => p.id), cfg);
  const groups = blocs.map((b) => ({
    bloc: b.id,
    label: b.label,
    panels: tracked
      .filter((p) => p.bloc === b.id)
      .map<TrendPanel>((p) => ({
        id: p.id,
        name: p.name,
        short: p.short,
        bloc: p.bloc,
        trend: scaled.get(p.id) ?? [],
        dots: allPolls
          .filter((poll) => poll.results[p.id])
          .map((poll) => ({ date: poll.published, seats: poll.results[p.id].seats, pollster: poll.pollster, ref: filber(poll),dateUncertain:poll.results[p.id].dateUncertain })),
      }))
      .sort((a, b) => (b.trend.at(-1)?.avg ?? 0) - (a.trend.at(-1)?.avg ?? 0)),
  })).filter((g) => g.panels.length);

  const blocName = { net: blocs.find((b) => b.id === "net")!.label, opp: blocs.find((b) => b.id === "opp")!.label };
  const race = blocTrend(allPolls, parties, cfg);
  const raceDots = allPolls.filter((p) => !isExit(p)).map((p) => { const t = blocTotals(p, parties); return { id: p.id, date: p.published, pollster: p.pollster, net: t.net, opp: t.opp, hollow: filber(p) }; });

  return (
    <div className="ix pl">
      <div className="wrap">
        <PageHead title="The Polls" standfirst={<>
            Every seat poll we track since {mediumDate(from)}: {allPolls.length} polls from {new Set(allPolls.map((p) => p.pollster)).size} pollsters.
          </>}>
          <p className="ph-meta">Updated {longDate(to).replace(/, \d{4}$/, "")}</p>
        </PageHead>

        <BlocRace trend={race} dots={raceDots} labels={blocName} hollowNames={variant.pollsters} windowDays={cfg.currentWindowDays} />

        <PollsNow />

        <PollComparison panels={groups.flatMap((g) => g.panels)} dates={dates} from={from} to={to} yMax={yMax} hollowNames={variant.pollsters} />
        <details className="pt-fold"><summary>Every list on its own chart</summary>
        <PollTrends dates={dates} groups={groups} from={from} to={to} yMax={yMax} refLabel={`${variant.pollsters.join(" and ")} (averaged; left out only of the alternative average)`} />
        <p className="note">
          Dots are single polls; lines are the list&apos;s seats in the site&apos;s polling average on each publication date, scaled to 120 as above. Per-party zoom shows small changes, with a minimum four-seat span and enough range for every dot. The bounds are labeled: heights across zoomed panels do not compare party size. Switch to the shared 0–{yMax} scale to compare size. A reported threshold failure stays at zero; zero is not the 3.25% vote threshold. Gaps mean no separate average. Point, tap or use left/right arrow keys for dated values.
        </p>
        </details>

        <HouseEffects rows={houseEffects(allPolls, parties, cfg)} labels={blocName} hollowNames={variant.pollsters} />

        <Suspense fallback={<p>Loading the poll browser…</p>}>
          <PollBrowser polls={allPolls} parties={parties} currentIds={mainPolls.map((p) => p.id)} config={cfg} />
          <PollSensitivity polls={allPolls} parties={parties} blocs={blocs} config={cfg} />
        </Suspense>

        <h2 id="method" className="sec-h">How the average is made</h2>
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
      </div>
    </div>
  );
}
