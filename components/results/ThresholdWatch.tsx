import Link from "next/link";
import { mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { partyColor } from "@/lib/party-colors";
import { average, inWithoutVariant } from "@/lib/polls";
import { pollsData } from "@/lib/data";
import { listSeats } from "@/lib/list-seats";

const MAX = 10;
const FLOOR = 4;

/**
 * The lists the night may turn on: every list that misses the threshold in at least one current
 * poll, or averages six seats or fewer, with a dot for each poll. A list either clears 3.25% and
 * wins at least four seats, or wins none, so the gap between zero and four is the threshold itself.
 */
export default function ThresholdWatch() {
  const rows = parties
    .filter((p) => p.coalitionCard !== "hidden")
    .map((p) => {
      const dots = mainPolls.filter((poll) => poll.results[p.id]).map((poll) => {
        const r = poll.results[p.id];
        return { poll, seats: r.belowThreshold ? 0 : r.seats, hollow: inWithoutVariant(poll, pollsData.config) };
      });
      return { p, dots, av: average(p.id, mainPolls) };
    })
    .filter(({ dots, av }) => dots.length && (dots.some((d) => d.seats === 0) || (av && av.avg <= 6)))
    .sort((a, b) => (b.av?.k ?? 0) / (b.av?.n || 1) - (a.av?.k ?? 0) / (a.av?.n || 1) || (b.av?.avg ?? 0) - (a.av?.avg ?? 0));
  const x = (s: number) => `${(Math.min(s, MAX) / MAX) * 100}%`;
  return (
    <figure className="tw-fig">
      <figcaption className="tw-h">The lists near the threshold, in each current poll</figcaption>
      <ul className="tw-rows">
        <li className="tw-axis" aria-hidden="true">
          <span />
          <span className="tw-track">
            {[0, 2, 4, 6, 8, 10].map((t) => <i key={t} style={{ left: x(t) }}>{t}</i>)}
          </span>
          <span className="tw-read">Passes in</span>
        </li>
        {rows.map(({ p, dots }) => {
          const k = dots.filter((d) => d.seats > 0).length;
          const ls = listSeats(p.id), avg = ls.below ? null : ls.text;
          const seen = new Map<number, number>();
          const count = new Map<number, number>();
          for (const d of dots) count.set(d.seats, (count.get(d.seats) ?? 0) + 1);
          return (
            <li key={p.id}>
              <Link href={`/parties/${p.id}`} className="tw-name">
                <span className="sw" style={{ background: partyColor(p.id) }} aria-hidden="true" />
                {p.name}
              </Link>
              <span className="tw-track" style={{ ["--n" as string]: Math.max(...count.values()) }} role="img" aria-label={`${p.name}: ${dots.map((d) => `${d.poll.pollster} ${d.seats ? `${d.seats} seats` : "below the threshold"}`).join(", ")}`}>
                <i className="tw-gap" style={{ left: 0, width: x(FLOOR) }} aria-hidden="true" />
                {dots.map((d) => {
                  const n = seen.get(d.seats) ?? 0;
                  seen.set(d.seats, n + 1);
                  return <i key={d.poll.id} className={`tw-dot${d.hollow ? " hollow" : ""}${d.seats === 0 ? " out" : ""}`} style={{ left: x(d.seats), ["--c" as string]: partyColor(p.id), ["--k" as string]: n - ((count.get(d.seats) ?? 1) - 1) / 2 }} title={`${d.poll.pollster}, ${mediumDate(d.poll.published)}: ${d.seats ? `${d.seats} seats` : "below the threshold"}`} />;
                })}
              </span>
              <span className="tw-read">
                <b>{k}</b> of {dots.length}
                {k > 0 && avg && <span className="tw-avg"> {avg} avg</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="fig-src tw-src">
        Each dot is one of the latest {mainPolls.length} polls; a dot at zero is a poll that had the list below the threshold. The shaded gap is the threshold itself:
        3.25% of valid votes is about four seats, so a list that passes wins at least four and one that misses wins none. The right column counts the polls where
        the list passes. Each list that crosses or misses on the night moves about four seats between the blocs.
      </p>
    </figure>
  );
}
