import type { Metadata } from "next";
import EmbedFooter from "@/components/EmbedFooter";
import { averagePoll, blocLabel, mainPolls, parties } from "@/lib/data";
import { fmt, mediumDate } from "@/lib/format";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Poll average (embed)",
  robots: { index: false },
};

export default function Page() {
  const rows = parties
    .map((p) => ({ p, seats: averagePoll.results[p.id]?.seats ?? 0 }))
    .filter((r) => r.seats > 0)
    .sort((a, b) => b.seats - a.seats);
  const asOf = mediumDate(mainPolls[0].published);
  return (
    <>
      <h1 className="embed-head">The poll average</h1>
      <p className="embed-sub">
        Seats in the 120-seat Knesset, averaged over the latest {mainPolls.length} polls, one per pollster, to {asOf}.
      </p>
      <table className="embed-table">
        <thead>
          <tr>
            <th scope="col">Party</th>
            <th scope="col" className="bloc">
              Bloc
            </th>
            <th scope="col" className="num">
              Seats
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ p, seats }) => (
            <tr key={p.id}>
              <th scope="row">
                <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
                {p.name}
              </th>
              <td className="bloc">{blocLabel[p.bloc]}</td>
              <td className="num">{fmt(Math.round(seats * 10) / 10)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <EmbedFooter dateLine={`Average of ${mainPolls.length} polls to ${asOf}`} />
    </>
  );
}
