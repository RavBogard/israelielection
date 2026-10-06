import type { Metadata } from "next";
import { alternates } from "@/lib/canonical";
import EmbedFooter from "@/components/EmbedFooter";
import SeatBar from "@/components/SeatBar";
import { averagePoll, blocLabel, mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { partyColor } from "@/lib/party-colors";
import { BLOC_ORDER, BLOC_SEAT_ORDER, SEATS_LABEL, blocTotals, seatFigure } from "@/lib/polls";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Poll average (embed)",
  robots: { index: false },
  alternates: alternates("/embed/average"),
};

/** A segment that spans the 61 tick moves its figure past it (padding in % of the bar, which is 120 seats wide). */
const clear = (start: number, seats: number) => (start < 61 && start + seats > 61 ? { paddingLeft: `calc(${((61 - start) / 120) * 100}% + 6px)` } : undefined);

export default function Page() {
  const rows = parties
    .map((p) => ({ p, seats: averagePoll.results[p.id]?.seats ?? 0 }))
    .filter((r) => r.seats > 0)
    .sort((a, b) => b.seats - a.seats);
  const totals = blocTotals(averagePoll, parties);
  const asOf = mediumDate(mainPolls[0].published);
  return (
    <>
      <h1 className="embed-head">The poll average</h1>
      <p className="embed-sub">
        Seats in the 120-seat Knesset, averaged over the latest {mainPolls.length} polls, one per pollster, to {asOf}.
      </p>
      <figure className="embed-blocs">
        <SeatBar
          size="l"
          className="sb-fit"
          segments={BLOC_SEAT_ORDER.map((b, i) => ({ key: b, style: clear(BLOC_SEAT_ORDER.slice(0, i).reduce((n, x) => n + totals[x], 0), totals[b]), seats: totals[b], color: `var(--b-${b})`, ink: `var(--b-${b}-ink)`, label: totals[b] >= 14 ? seatFigure(totals[b]) : undefined, title: `${blocLabel[b]}: ${seatFigure(totals[b])} seats` }))}
          label={BLOC_ORDER.map((b) => `${blocLabel[b]} ${seatFigure(totals[b])}`).join(", ") + "; a majority is 61 of 120."}
        />
        <figcaption className="fig-key">
          {BLOC_ORDER.map((b) => (
            <span key={b}><i className="sw" style={{ background: `var(--b-${b})` }} aria-hidden="true" />{blocLabel[b]} <b>{seatFigure(totals[b])}</b></span>
          ))}
          <span>The heavy rule is 61, a majority.</span>
        </figcaption>
      </figure>
      <table className="embed-table">
        <thead>
          <tr>
            <th scope="col">Party</th>
            <th scope="col" className="bloc">
              Bloc
            </th>
            <th scope="col" className="num">
              {SEATS_LABEL}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, seats }) => (
            <tr key={p.id}>
              <th scope="row">
                <span className="sw" style={{ background: partyColor(p.id) }} />
                {p.name}
              </th>
              <td className="bloc">{blocLabel[p.bloc]}</td>
              <td className="num">{seatFigure(seats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <EmbedFooter dateLine={`Average of ${mainPolls.length} polls to ${asOf}`} />
    </>
  );
}
