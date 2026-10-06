import Link from "next/link";
import { averagePoll, blocs, mainPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { fmt, mediumDate, shortDate } from "@/lib/format";
import { partyColor } from "@/lib/party-colors";
import { average, blocTotals, inWithoutVariant } from "@/lib/polls";
import type { BlocId } from "@/lib/types";
import "./polls-now.css";

const cfg = pollsData.config;
const MAJORITY = 61, TOTAL = 120;
const one = (x: number) => fmt(Math.round(x * 10) / 10);
const variantNames = cfg.withoutVariant.pollsters;

/** The bloc order along the 120-seat bar: the two blocs from either end, the lists between them in the middle. */
const BAR_ORDER: BlocId[] = ["net", "mid", "arab", "opp"];

/** Where a bloc's total lands in each of the current polls, on a seat axis with the majority line at 61. */
function BlocStrip({ bloc, label }: { bloc: BlocId; label: string }) {
  const pts = mainPolls.map((p) => ({ p, seats: blocTotals(p, parties)[bloc], hollow: inWithoutVariant(p, cfg) })).sort((a, b) => a.seats - b.seats);
  const lo = 40, hi = 70;
  const x = (s: number) => `${((Math.min(hi, Math.max(lo, s)) - lo) / (hi - lo)) * 100}%`;
  const at = pts.filter((t) => t.seats >= MAJORITY).length;
  // Stack polls that land on the same number so every one stays visible.
  const seen = new Map<number, number>();
  return (
    <div className="pn-strip">
      <p className="pn-strip-h">
        <span className="sw" style={{ background: `var(--b-${bloc})` }} aria-hidden="true" />
        <b>{label}</b>
        <span className="pn-strip-read">{at === 0 ? `under 61 in all ${pts.length} polls` : `61 or more in ${at} of ${pts.length} polls`}, from {pts[0].seats} to {pts[pts.length - 1].seats}</span>
      </p>
      <div className="pn-axis" role="img" aria-label={`${label} seats in each current poll: ${pts.map((t) => `${t.p.pollster} ${t.seats}`).join(", ")}. A majority is 61.`}>
        {[40, 45, 50, 55, 60, 65, 70].map((t) => (
          <span key={t} className="tick" style={{ left: x(t) }}>{t}</span>
        ))}
        <span className="maj" style={{ left: x(MAJORITY) }}><b>61</b></span>
        {pts.map((t) => {
          const k = seen.get(t.seats) ?? 0;
          seen.set(t.seats, k + 1);
          return (
            <span key={t.p.id} className={`dot${t.hollow ? " hollow" : ""}`} style={{ left: x(t.seats), ["--fill" as string]: `var(--b-${bloc})`, ["--k" as string]: k }} title={`${t.p.pollster}, ${mediumDate(t.p.published)}: ${t.seats}`}>
              <i className="lbl">{t.p.pollster}</i>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * What the polls say now: the bloc totals of the current average on the 120-seat bar with 61
 * marked, where each bloc lands in each current poll, then every list as a dot per poll with the
 * average drawn as a bar. The numbers the old table carried stay as columns of the same table.
 */
export default function PollsNow() {
  const totals = blocTotals(averagePoll, parties);
  const label = Object.fromEntries(blocs.map((b) => [b.id, b.label])) as Record<BlocId, string>;
  const rows = parties
    .map((p) => {
      const a = average(p.id, mainPolls);
      const w = average(p.id, variantPolls);
      const dots = mainPolls
        .filter((poll) => poll.results[p.id])
        .map((poll) => ({ poll, seats: poll.results[p.id].seats, below: poll.results[p.id].seats === 0 || !!poll.results[p.id].belowThreshold, hollow: inWithoutVariant(poll, cfg) }));
      const vals = dots.map((d) => d.seats);
      return { p, a, w, dots, lo: Math.min(...vals), hi: Math.max(...vals) };
    })
    .filter((r) => r.a)
    .sort((x, y) => blocs.findIndex((b) => b.id === x.p.bloc) - blocs.findIndex((b) => b.id === y.p.bloc) || y.a!.seats - x.a!.seats || y.a!.avg - x.a!.avg);
  const max = Math.max(30, Math.ceil(Math.max(...rows.flatMap((r) => r.dots.map((d) => d.seats))) / 5) * 5);
  const sx = (s: number) => `${(s / max) * 100}%`;
  const from = mainPolls.map((p) => p.published).sort()[0];
  const to = mainPolls.map((p) => p.published).sort().at(-1)!;

  return (
    <section className="pn" aria-labelledby="now-h">
      <h2 id="now-h" className="sec-h">What the polls say now</h2>
      <p className="note">
        The latest poll from each of {mainPolls.length} pollsters, {shortDate(from)} to {mediumDate(to)}. Hollow points are {variantNames.join(" and ")},
        the two the site&apos;s alternative average leaves out. <a href="#method">How the average is made</a>.
      </p>

      <figure className="pn-fig">
        <figcaption className="pn-lbl">The blocs in the average, out of 120 seats</figcaption>
        <div className="pn-bar" role="img" aria-label={BAR_ORDER.map((b) => `${label[b]} ${one(totals[b])}`).join(", ") + ". A majority is 61."}>
          {BAR_ORDER.map((b) => (
            <span key={b} className={`seg seg-${b}`} style={{ width: `${(totals[b] / TOTAL) * 100}%`, background: `var(--b-${b})`, color: `var(--b-${b}-ink)` }}>
              <b>{one(totals[b])}</b>
            </span>
          ))}
          <i className="maj" style={{ left: `${(MAJORITY / TOTAL) * 100}%` }} aria-hidden="true" />
        </div>
        <ul className="pn-barkey">
          {BAR_ORDER.map((b) => (
            <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{label[b]} <b>{one(totals[b])}</b></li>
          ))}
        </ul>
        <BlocStrip bloc="net" label={label.net} />
        <BlocStrip bloc="opp" label={label.opp} />
        <p className="src">
          Bloc totals in the average are the lists&apos; averages scaled to 120 seats, the values the Coalition Builder starts from; each poll&apos;s
          totals are its own published figures. Lists that pass in fewer than half the polls count zero. <Link href="/coalition-builder">Build a coalition from these numbers</Link>.
        </p>
      </figure>

      <figure className="pn-fig">
        <figcaption className="pn-lbl">Every list in every current poll</figcaption>
        <div className="table-scroll">
          <table className="pn-table">
            <thead>
              <tr>
                <th scope="col">List</th>
                <th scope="col" className="chart">
                  <span className="sr-only">Seats in each poll</span>
                  <span className="scale" aria-hidden="true">
                    {[0, 5, 10, 15, 20, 25, 30, 35].filter((t) => t <= max).map((t) => <i key={t} style={{ left: sx(t) }}>{t}</i>)}
                  </span>
                </th>
                <th scope="col" className="num">Average</th>
                <th scope="col" className="num">Range</th>
                <th scope="col" className="num">Passes</th>
                <th scope="col" className="num">{cfg.withoutVariant.label}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, a, w, dots, lo, hi }, i) => {
                const color = partyColor(p.id);
                const first = i === 0 || rows[i - 1].p.bloc !== p.bloc;
                const stated = a!.k > 0 && !a!.nearThreshold;
                return (
                  <tr key={p.id} className={first ? "first" : undefined}>
                    <th scope="row">
                      {first && <span className="blocname" style={{ ["--fill" as string]: `var(--b-${p.bloc})` }}>{label[p.bloc]}</span>}
                      <Link href={`/parties/${p.id}`}><span className="sw" style={{ background: color }} aria-hidden="true" />{p.name}</Link>
                    </th>
                    <td className="chart">
                      <span className="track" aria-hidden="true">
                        <i className="thr" style={{ left: sx(4) }} />
                        {stated && <i className="bar" style={{ width: sx(a!.avg), background: color }} />}
                        {dots.map((d) => (
                          <i key={d.poll.id} className={`pt${d.hollow ? " hollow" : ""}${d.below ? " below" : ""}`} style={{ left: sx(d.seats), ["--c" as string]: color }} title={`${d.poll.pollster}, ${mediumDate(d.poll.published)}: ${d.below ? "below the threshold" : `${d.seats} seats`}`} />
                        ))}
                      </span>
                      <span className="sr-only">{dots.map((d) => `${d.poll.pollster} ${d.below ? "below the threshold" : d.seats}`).join(", ")}</span>
                    </td>
                    <td className="num avg">
                      {a!.k === 0 ? <span className="dim">below threshold</span> : a!.nearThreshold ? <span className="dim" title={`${one(a!.avg)} seats in the polls where it passes`}>near threshold</span> : <b>{one(a!.avg)}</b>}
                    </td>
                    <td className="num">{lo === 0 && hi === 0 ? "" : lo === hi ? lo : `${lo}–${hi}`}</td>
                    <td className="num">{a!.k} of {a!.n}</td>
                    <td className="num dim" title={w ? `Passes in ${w.k} of ${w.n} polls without ${variantNames.join(" and ")}` : undefined}>
                      {!w ? "n/a" : w.k === 0 ? "below" : w.nearThreshold ? "near" : one(w.avg)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="pn-key">
          <span><i className="k pt" aria-hidden="true" />One poll</span>
          <span><i className="k pt hollow" aria-hidden="true" />{variantNames.join(" or ")}</span>
          <span><i className="k bar" aria-hidden="true" />Average, over the polls where the list passes</span>
          <span><i className="k thr" aria-hidden="true" />Threshold: a list that passes wins at least 4 seats</span>
        </p>
        <p className="src">
          Averages weight each poll by the square root of its sample size and are shown before scaling to 120, so they can add to more than 120.
          A point at zero is a poll that had the list below the threshold.
        </p>
      </figure>
    </section>
  );
}
