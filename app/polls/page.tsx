import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {undatedListNames} from "@/lib/poll-browser";
import PollBrowser from "@/components/PollBrowser";
import PollSensitivity from "@/components/PollSensitivity";
import "@/components/interactives.css";
import "@/components/polls.css";
import PollTrends, { type TrendPanel } from "@/components/PollTrends";
import PollComparison from "@/components/PollComparison";
import { allPolls, blocs, mainPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { fmt, mediumDate, shortDate } from "@/lib/format";
import {partyColor} from "@/lib/party-colors";
import { average, inWithoutVariant } from "@/lib/polls";
import { averageTrend } from "@/lib/trend";

export const metadata: Metadata = {
  title: "Polls",
  description: "Every Knesset seat poll of the 2026 campaign we track, the current average, and how each party has moved.",
};

export const revalidate = 3600;

const cfg = pollsData.config;
const tracked = parties.filter((p) => allPolls.some((poll) => poll.results[p.id]));
const variant = cfg.withoutVariant;
const filber = (poll: (typeof allPolls)[number]) => inWithoutVariant(poll, cfg);
const round1 = (x: number) => fmt(Math.round(x * 10) / 10);

export default function Page() {
  const uncertainFigures=[...new Set(allPolls.flatMap(poll=>undatedListNames(poll,parties)))];
  const dates = [...new Set(allPolls.map((p) => p.published))].sort();
  const from = dates[0];
  const to = allPolls[0].published;
  const maxSeats = Math.max(...allPolls.flatMap((p) => Object.values(p.results).map((r) => r.seats)));
  const yMax = Math.max(30, Math.ceil(maxSeats / 5) * 5);

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
        trend: averageTrend(p.id, allPolls, cfg),
        dots: allPolls
          .filter((poll) => poll.results[p.id])
          .map((poll) => ({ date: poll.published, seats: poll.results[p.id].seats, pollster: poll.pollster, ref: filber(poll),dateUncertain:poll.results[p.id].dateUncertain })),
      }))
      .sort((a, b) => (b.trend.at(-1)?.avg ?? 0) - (a.trend.at(-1)?.avg ?? 0)),
  })).filter((g) => g.panels.length);

  const rows = tracked
    .map((p) => {
      const a = average(p.id, mainPolls);
      const w = average(p.id, variantPolls);
      const vals = mainPolls.map((poll) => poll.results[p.id]?.seats).filter((v): v is number => v !== undefined);
      return { p, a, w, lo: Math.min(...vals), hi: Math.max(...vals) };
    })
    .filter((r) => r.a)
    .sort((x, y) => blocs.findIndex((b) => b.id === x.p.bloc) - blocs.findIndex((b) => b.id === y.p.bloc) || y.a!.seats - x.a!.seats || y.a!.avg - x.a!.avg);

  return (
    <div className="ix pl">
      <div className="wrap">
        <header className="page-head">
          <h1>The Polls</h1>
          <p className="standfirst">
            Every seat poll we track since {mediumDate(from)}: {allPolls.length} polls from {new Set(allPolls.map((p) => p.pollster)).size} pollsters.
          </p>
          <p className="note">
            New polls arrive twice a day from Wikipedia&apos;s polling tables and are checked automatically before they appear here: seats must add
            to 120, the pollster must be one we know, and no party may jump more than {cfg.maxSeatMove} seats from that pollster&apos;s previous poll.
          </p>
        </header>

        <h2 id="method" className="sec-h">The current average and its method</h2>
        <p className="note">
          Each pollster&apos;s latest poll from the {cfg.currentWindowDays} days up to {mediumDate(to)} ({mainPolls.length} polls:{" "}
          {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}). The <Link href="/coalition-builder">Coalition Builder</Link> and{" "}
          <Link href="/parties">Party Map</Link> use the same polls. {cfg.inclusionRule}
        </p>
        <p className="note">
          Each list&apos;s average is taken over the polls where it passed the 3.25% threshold, so a list that passes never averages below 4
          seats; &ldquo;passes in k of n&rdquo; counts those polls out of the polls that reported the list. A list that passes in fewer than
          half is shown as near the threshold and left out of the Coalition Builder&apos;s default count. Polls are weighted by the square
          root of their sample size; a poll that reports no sample size counts as the median of those that do. Because small lists sometimes miss the threshold, these averages can add to more than 120; the Coalition Builder, the Party Map and the home page scale them down in proportion only when their sum exceeds 120. This table and the trend lines show passing-poll means before normalization; the builder, Party Map and homepage use normalized coalition values.{" "}
          {variant.note}
        </p>
        {uncertainFigures.length>0&&<p className="note">Figure-date uncertainty: the register includes figures for {uncertainFigures.join(", ")} whose own dates were not recorded. They retain the register entry’s publication date in these charts and calculations; that date is not a confirmed date for each figure. The poll browser marks them † and its method card explains the distinction.</p>}
        <PollComparison panels={groups.flatMap((g) => g.panels)} dates={dates} from={from} to={to} yMax={yMax} />
        <h2 className="sec-h">Current averages by party</h2>
        <div className="avg-layout">
          <div className="table-scroll">
            <table className="data-table avg-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th className="num">Passing-poll mean</th>
                  <th className="num">Range</th>
                  <th className="num">Polls</th>
                  <th className="num">{variant.label}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, a, w, lo, hi }) => (
                  <tr key={p.id}>
                    <td>
                      <span className="sw" style={{ background: partyColor(p.id) }} />
                      <Link href={`/parties/${p.id}`}>{p.name}</Link>
                    </td>
                    <td className="num">
                      {a!.k === 0 ? (
                        <span className="dim">below threshold</span>
                      ) : a!.nearThreshold ? (
                        <span className="dim" title={`${round1(a!.avg)} seats in the polls where it passes`}>near threshold</span>
                      ) : (
                        <b>{round1(a!.avg)}</b>
                      )}
                    </td>
                    <td className="num">{lo === 0 && hi === 0 ? "" : lo === hi ? lo : `${lo}–${hi}`}</td>
                    <td className="num">passes in {a!.k} of {a!.n}</td>
                    <td className="num dim" title={w ? `Passes in ${w.k} of ${w.n} polls without ${variant.pollsters.join(" and ")}` : undefined}>
                      {!w ? "n/a" : w.k === 0 ? "below" : w.nearThreshold ? "near" : round1(w.avg)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        <h2 className="sec-h">How each party has moved</h2>
        <p className="note">
          Dots are single polls; lines are the running passing-poll mean on each publication date, using the same method above. Per-party zoom shows small changes, with a minimum four-seat span and enough range for every dot. The bounds are labeled: heights across zoomed panels do not compare party size. Switch to the shared 0–{yMax} scale to compare size. A reported threshold failure stays at zero; zero is not the 3.25% vote threshold. Gaps mean no separate average. Point, tap or use left/right arrow keys for dated values.
        </p>
        <PollTrends dates={dates} groups={groups} from={from} to={to} yMax={yMax} refLabel={`${variant.pollsters.join(", ")} (averaged; left out of “${variant.label}”)`} />

        <Suspense fallback={<p>Loading the poll browser…</p>}>
          <PollBrowser polls={allPolls} parties={parties} currentIds={mainPolls.map((p) => p.id)} config={cfg} />
          <PollSensitivity polls={allPolls} parties={parties} blocs={blocs} config={cfg} />
        </Suspense>
      </div>
    </div>
  );
}
