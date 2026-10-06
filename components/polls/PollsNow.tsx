import Link from "next/link";
import type { CSSProperties } from "react";
import { averagePoll, blocs, mainPolls, parties, pollsData, variantPolls } from "@/lib/data";
import { mediumDate, shortDate } from "@/lib/format";
import { contrast, partyColor, partyStroke, STROKE_CONTRAST } from "@/lib/party-colors";
import { average, averageAsPoll, BLOC_ORDER, BLOC_SEAT_ORDER, blocRank, blocTotals, inWithoutVariant, SEATS_LABEL, seatFigure } from "@/lib/polls";
import "../party-stroke.css";
import type { BlocId } from "@/lib/types";
import SeatBar from "../SeatBar";
import "./polls-now.css";

const cfg = pollsData.config;
const MAJORITY = 61, TOTAL = 120;
const one = seatFigure;
const variantNames = cfg.withoutVariant.pollsters;
/** Pixels per seat on the 40 to 70 axis at the narrowest width that shows pollster labels (760px). */
const LABEL_PX_PER_SEAT = 23;

/** The bloc order along the 120-seat bar, as on every 120-seat bar and the home mosaic. */
const BAR_ORDER = BLOC_SEAT_ORDER;
const variantAverage = averageAsPoll(variantPolls, parties.map((p) => p.id), { id: "avg-variant" });
/** What the lists' passing-poll averages add to before they are scaled to 120. */
/** The light paper behind the list chart (--bg, the darker of --bg and --sheet). */
const LIGHT_PAPER = "#f6f5f1";
const mixBlack = (hex: string, t: number) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0")).join("");
/** A list's mark colour at 3:1 on either paper: on light paper darkened just far enough, on dark paper partyStroke's lighter stroke. */
function markVars(id: string) {
  const c = partyColor(id);
  let light = c;
  for (let t = 0; t <= 1 && contrast(light, LIGHT_PAPER) < STROKE_CONTRAST; t += 0.02) light = mixBlack(c, t);
  return { "--ps": light, "--ps-dark": partyStroke(id, "dark") } as CSSProperties;
}
const rawSum = Math.round(parties.reduce((s, p) => s + (average(p.id, mainPolls)?.seats ?? 0), 0) * 10) / 10;

/** Where a bloc's total lands in each of the current polls, on a seat axis with the majority line at 61. */
function BlocStrip({ bloc, label }: { bloc: BlocId; label: string }) {
  const pts = mainPolls.map((p) => ({ p, seats: blocTotals(p, parties)[bloc], hollow: inWithoutVariant(p, cfg) })).sort((a, b) => a.seats - b.seats);
  const lo = 40, hi = 70;
  const x = (s: number) => `${((Math.min(hi, Math.max(lo, s)) - lo) / (hi - lo)) * 100}%`;
  const at = pts.filter((t) => t.seats >= MAJORITY).length;
  // Stack polls that land on the same number so every one stays visible.
  const seen = new Map<number, number>();
  const stacked = pts.map((t) => { const k = seen.get(t.seats) ?? 0; seen.set(t.seats, k + 1); return { ...t, k }; });
  // One label per stack of polls on the same number, level above the tallest stack, in as many
  // lanes as it takes for none to overlap, joined to the stack by a leader. Widths are in seats at
  // the narrowest axis that shows labels.
  const top = Math.max(...stacked.map((t) => t.k)) + 1;
  const ends: number[] = [];
  const names = new Map<number, string>();
  for (const t of stacked) names.set(t.seats, names.has(t.seats) ? `${names.get(t.seats)}, ${t.p.pollster}` : t.p.pollster);
  const lanes = new Map<number, number>();
  for (const [seats, text] of names) {
    const half = (text.length * 6.8 + 12) / 2 / LABEL_PX_PER_SEAT;
    let lane = ends.findIndex((end) => end < seats - half);
    if (lane < 0) { lane = ends.length; ends.push(0); }
    ends[lane] = seats + half;
    lanes.set(seats, lane);
  }
  const labelled = stacked.map((t) => { const head = !stacked.some((o) => o.seats === t.seats && o.k > t.k); return { ...t, label: head ? names.get(t.seats)! : null, lift: (top - t.k) * 22 - 13 + lanes.get(t.seats)! * 17 }; });
  const height = 6 + top * 22 + ends.length * 17 + 14;
  return (
    <div className="pn-strip">
      <p className="pn-strip-h">
        <span className="sw" style={{ background: `var(--b-${bloc})` }} aria-hidden="true" />
        <b>{label}</b>
        <span className="pn-strip-read">{at === 0 ? `under 61 in all ${pts.length} polls` : `61 or more in ${at} of ${pts.length} polls`}, from {pts[0].seats} to {pts[pts.length - 1].seats}</span>
      </p>
      <div className="pn-axis" style={{ ["--h" as string]: `${height}px` }} role="img" aria-label={`${label} seats in each current poll: ${pts.map((t) => `${t.p.pollster} ${t.seats}`).join(", ")}. A majority is 61.`}>
        {[40, 45, 50, 55, 60, 65, 70].map((t) => (
          <span key={t} className="tick" style={{ left: x(t) }}>{t}</span>
        ))}
        <span className="maj" style={{ left: x(MAJORITY) }}><b>61</b></span>
        {labelled.map((t) => (
          <span key={t.p.id} className={`dot${t.hollow ? " hollow" : ""}`} style={{ left: x(t.seats), ["--fill" as string]: `var(--b-${bloc})`, ["--k" as string]: t.k, ["--lift" as string]: `${t.lift}px` }} title={`${t.p.pollster}, ${mediumDate(t.p.published)}: ${t.seats}`}>
            {t.label && <><i className="ldr" /><i className="lbl">{t.label}</i></>}
          </span>
        ))}
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
      const w = average(p.id, variantPolls), scaled = averagePoll.results[p.id]?.seats ?? 0, wScaled = variantAverage.results[p.id]?.seats ?? 0;
      const dots = mainPolls
        .filter((poll) => poll.results[p.id])
        .map((poll) => ({ poll, seats: poll.results[p.id].seats, below: poll.results[p.id].seats === 0 || !!poll.results[p.id].belowThreshold, hollow: inWithoutVariant(poll, cfg) }));
      const vals = dots.map((d) => d.seats);
      return { p, a, w, scaled, wScaled, dots, lo: Math.min(...vals), hi: Math.max(...vals) };
    })
    .filter((r) => r.a)
    .sort((x, y) => blocRank(x.p.bloc) - blocRank(y.p.bloc) || y.a!.seats - x.a!.seats || y.a!.avg - x.a!.avg);
  const max = Math.max(30, Math.ceil(Math.max(...rows.flatMap((r) => r.dots.map((d) => d.seats))) / 5) * 5);
  const sx = (s: number) => `${(s / max) * 100}%`;
  const from = mainPolls.map((p) => p.published).sort()[0];
  const to = mainPolls.map((p) => p.published).sort().at(-1)!;

  return (
    <section className="pn" aria-labelledby="now-h">
      <h2 id="now-h" className="sec-h">What the polls say now</h2>

      <figure className="pn-fig">
        <figcaption className="pn-lbl">The blocs in the average, out of 120 seats</figcaption>
        <SeatBar
          size="xl"
          total={TOTAL}
          majority={MAJORITY}
          segments={BAR_ORDER.map((b) => ({ key: b, seats: totals[b], color: `var(--b-${b})`, ink: `var(--b-${b}-ink)`, label: one(totals[b]), className: `pn-seg pn-seg-${b}` }))}
          label={BAR_ORDER.map((b) => `${label[b]} ${one(totals[b])}`).join(", ") + ". A majority is 61."}
        />
        <ul className="fig-key pn-barkey">
          {BLOC_ORDER.map((b) => (
            <li key={b}><span className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{label[b]} <b>{one(totals[b])}</b></li>
          ))}
        </ul>
        <BlocStrip bloc="net" label={label.net} />
        <BlocStrip bloc="opp" label={label.opp} />
        <p className="fig-src">
          The latest poll from each of {mainPolls.length} pollsters, {shortDate(from)} to {mediumDate(to)}; hollow points are {variantNames.join(" and ")},
          the two the site&apos;s alternative average leaves out. <a href="#method">How the average is made</a>. Bloc totals in the average are the lists&apos; averages scaled to 120 seats, the values the Coalition Builder starts from; each poll&apos;s
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
                <th scope="col" className="num">{SEATS_LABEL}</th>
                <th scope="col" className="num">Range</th>
                <th scope="col" className="num">Passes</th>
                <th scope="col" className="num">{cfg.withoutVariant.label}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ p, a, w, scaled, wScaled, dots, lo, hi }, i) => {
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
                      <span className="track pstroke" style={markVars(p.id)} aria-hidden="true">
                        <i className="thr" style={{ left: sx(4) }} />
                        {stated && <i className="bar" style={{ width: sx(scaled) }} />}
                        {dots.map((d) => (
                          <i key={d.poll.id} className={`pt${d.hollow ? " hollow" : ""}${d.below ? " below" : ""}`} style={{ left: sx(d.seats), ["--c" as string]: "var(--psx)" }} title={`${d.poll.pollster}, ${mediumDate(d.poll.published)}: ${d.below ? "below the threshold" : `${d.seats} seats`}`} />
                        ))}
                      </span>
                      <span className="sr-only">{dots.map((d) => `${d.poll.pollster} ${d.below ? "below the threshold" : d.seats}`).join(", ")}</span>
                    </td>
                    <td className="num avg">
                      {a!.k === 0 ? <span className="dim">below</span> : a!.nearThreshold ? <span className="dim" title={`Near the threshold: ${one(a!.avg)} seats in the polls where it passes`}>below</span> : <b>{one(scaled)}</b>}
                    </td>
                    <td className="num" data-label="Range">{lo === 0 && hi === 0 ? "" : lo === hi ? lo : `${lo}–${hi}`}</td>
                    <td className="num" data-label="Passes in">{a!.k} of {a!.n}</td>
                    <td className="num dim" data-label={cfg.withoutVariant.label} title={w ? `Passes in ${w.k} of ${w.n} polls without ${variantNames.join(" and ")}` : undefined}>
                      {!w ? "n/a" : w.k === 0 || w.nearThreshold || !wScaled ? "below" : one(wScaled)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="fig-key pn-key">
          <span><i className="k pt" aria-hidden="true" />One poll</span>
          <span><i className="k pt hollow" aria-hidden="true" />{variantNames.join(" or ")}</span>
          <span><i className="k bar" aria-hidden="true" />{SEATS_LABEL}, scaled to 120</span>
          <span><i className="k thr" aria-hidden="true" />Threshold: a list that passes wins at least 4 seats</span>
        </p>
        <p className="fig-src">
          Each list&apos;s average weights each poll by the square root of its sample size, over the polls where the list passed. Those averages add to {rawSum}, so
          every one is scaled down in proportion to 120 seats, the figure every page of the site prints; the alternative average is scaled the same way. &ldquo;Below&rdquo; is a list
          that passes in fewer than half the polls, which counts 0. A point at zero is a poll that had the list below the threshold.
        </p>
      </figure>
    </section>
  );
}
