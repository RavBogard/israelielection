import type { Metadata } from "next";
import Link from "next/link";
import Banner from "@/components/Banner";
import "@/components/interactives.css";
import "@/components/polls.css";
import PollTrends, { type TrendPanel } from "@/components/PollTrends";
import { allPolls, blocs, mainPolls, otherPolls, parties, pollsData } from "@/lib/data";
import { fmt, httpUrl, mediumDate, shortDate } from "@/lib/format";
import { average, pollLabel } from "@/lib/polls";
import { averageTrend } from "@/lib/trend";

export const metadata: Metadata = {
  title: "Polls",
  description: "Every Knesset seat poll of the 2026 campaign we track, the current average, and how each party has moved.",
};

export const revalidate = 3600;

const cfg = pollsData.config;
const tracked = parties.filter((p) => allPolls.some((poll) => poll.results[p.id]));
const excluded = (pollster: string) => cfg.excludedFromAverage.includes(pollster);

export default function Page() {
  const from = allPolls.at(-1)!.published;
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
        bloc: p.bloc,
        trend: averageTrend(p.id, allPolls, cfg),
        dots: allPolls
          .filter((poll) => poll.results[p.id])
          .map((poll) => ({ date: poll.published, seats: poll.results[p.id].seats, pollster: poll.pollster, ref: excluded(poll.pollster) })),
      }))
      .sort((a, b) => (b.trend.at(-1)?.avg ?? 0) - (a.trend.at(-1)?.avg ?? 0)),
  })).filter((g) => g.panels.length);

  const rows = tracked
    .map((p) => {
      const a = average(p.id, mainPolls);
      const vals = mainPolls.map((poll) => poll.results[p.id]?.seats).filter((v): v is number => v !== undefined);
      return { p, a, lo: Math.min(...vals), hi: Math.max(...vals) };
    })
    .filter((r) => r.a)
    .sort((x, y) => blocs.findIndex((b) => b.id === x.p.bloc) - blocs.findIndex((b) => b.id === y.p.bloc) || y.a!.avg - x.a!.avg);

  return (
    <div className="ix pl">
      <Banner />
      <div className="wrap">
        <header className="ix-head">
          <div>
            <h1>The Polls</h1>
            <p className="sub">
              Every seat poll we track since {mediumDate(from)}: {allPolls.length} polls from {new Set(allPolls.map((p) => p.pollster)).size}{" "}
              pollsters. New polls arrive twice a day from Wikipedia&apos;s polling tables and are checked automatically before they appear
              here (seats must add to 120, the pollster must be one we know, and no party may jump more than {cfg.maxSeatMove} seats
              from that pollster&apos;s previous poll).
            </p>
          </div>
        </header>

        <h2 className="sec-h">The current average</h2>
        <p className="note">
          Each pollster&apos;s latest poll from the {cfg.currentWindowDays} days up to {mediumDate(to)} ({mainPolls.length} polls:{" "}
          {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}). The <Link href="/">Coalition Builder</Link> and{" "}
          <Link href="/parties">Party Map</Link> use the same polls. {cfg.excludedReason}
        </p>
        <div className="table-scroll" style={{ display: "inline-block", maxWidth: "100%" }}>
          <table className="avg-table" style={{ margin: "4px 14px" }}>
            <thead>
              <tr>
                <th>Party</th>
                <th className="num">Average</th>
                <th className="num">Range</th>
                <th className="num">Polls</th>
                {otherPolls.map((p) => (
                  <th key={p.id} className="num">{p.pollster}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, a, lo, hi }) => (
                <tr key={p.id}>
                  <td>
                    <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
                    <Link href={`/parties/${p.id}`} style={{ color: "inherit" }}>{p.name}</Link>
                  </td>
                  <td className="num">{lo === 0 && hi === 0 ? <span style={{ color: "var(--ink-3)" }}>below threshold</span> : <b>{fmt(Math.round(a!.avg * 10) / 10)}</b>}</td>
                  <td className="num">{lo === 0 && hi === 0 ? "" : lo === hi ? lo : `${lo}–${hi}`}</td>
                  <td className="num">{a!.n}</td>
                  {otherPolls.map((poll) => (
                    <td key={poll.id} className="num" style={{ color: "var(--ink-3)" }}>
                      {poll.results[p.id] ? (poll.results[p.id].belowThreshold ? "below" : poll.results[p.id].seats) : "n/a"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="sec-h">How each party has moved</h2>
        <p className="note">
          Dots are single polls; the line is the running average as it stood on each date (same rule as above). Every panel uses the
          same 0–{yMax} seat scale, so heights compare across parties. A dot at 0 is a poll that had the party below the 3.25% threshold.
          Hover or use the arrow keys on a panel for the average on a date.
        </p>
        <PollTrends groups={groups} from={from} to={to} yMax={yMax} />

        <h2 className="sec-h">Every poll</h2>
        <p className="note">Newest first. Grey rows are {cfg.excludedFromAverage.join(", ")}, shown but not averaged. “b” = below the threshold; “n/a” = not reported separately.</p>
        <div className="table-scroll">
          <table className="poll-table">
            <thead>
              <tr>
                <th>Published</th>
                <th>Pollster</th>
                <th className="num">n</th>
                {tracked.map((p) => (
                  <th key={p.id} className="num" title={p.name}>{p.short}</th>
                ))}
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {allPolls.map((poll) => (
                <tr key={poll.id} className={excluded(poll.pollster) ? "ref" : undefined}>
                  <td>{shortDate(poll.published)}</td>
                  <td>{pollLabel(poll)}</td>
                  <td className="num">{poll.n ? poll.n.toLocaleString("en-US") : ""}</td>
                  {tracked.map((p) => {
                    const r = poll.results[p.id];
                    const g = poll.combined.find((c) => c.parties.includes(p.id));
                    if (!r) return <td key={p.id} className="num na" title={g ? `${g.seats} combined with ${g.parties.join(" + ")}` : undefined}>{g ? `${g.seats}*` : "n/a"}</td>;
                    if (r.belowThreshold) return <td key={p.id} className="num below" title={r.pct ? `Below threshold at ${r.pct}` : "Below threshold"}>b</td>;
                    return <td key={p.id} className="num">{r.seats}</td>;
                  })}
                  <td>
                    {httpUrl(poll.url) ? (
                      <a href={httpUrl(poll.url)!} target="_blank" rel="noopener">{poll.via ?? new URL(poll.url!).hostname.replace(/^www\./, "")}</a>
                    ) : (
                      poll.via ?? ""
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          * Seats reported only for a group of parties together. Polls imported from{" "}
          <a href="https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election" target="_blank" rel="noopener">
            Wikipedia&apos;s polling tables
          </a>{" "}
          link to the source Wikipedia cites; the hand-checked polls from late September carry their own sources.
        </p>
      </div>
    </div>
  );
}
