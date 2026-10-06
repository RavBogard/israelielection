import Link from "next/link";
import { mainPolls, parties } from "@/lib/data";
import { mediumDate } from "@/lib/format";
import { partyColor } from "@/lib/party-colors";
import { average, inWithoutVariant } from "@/lib/polls";
import { pollsData } from "@/lib/data";
import { listSeats } from "@/lib/list-seats";
import type { Lang } from "@/lib/i18n";
import resultsText from "@/lib/i18n/results";
import { listName, pollsterName, T } from "./names";
import { edHref } from "./rich";

const MAX = 10;
const FLOOR = 4;

/**
 * The lists the night may turn on: every list that misses the threshold in at least one current
 * poll, or averages six seats or fewer, with a dot for each poll. A list either clears 3.25% and
 * wins at least four seats, or wins none, so the gap between zero and four is the threshold itself.
 * Seats are a magnitude, so in Hebrew the axis starts at the right (PLAN.md section 5): positions are set from the inline start.
 */
export default function ThresholdWatch({ closed = false, lang = "en" }: { closed?: boolean; lang?: Lang }) {
  const t = resultsText[lang].pollThreshold;
  const side = lang === "he" ? "right" : "left";
  const who = (pollster: string) => pollsterName(pollster, lang).text;
  const said = (seats: number) => (seats ? t.seats(seats) : t.below);
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
      <figcaption className="tw-h">{t.caption(closed)}</figcaption>
      <ul className="tw-rows">
        <li className="tw-axis" aria-hidden="true">
          <span />
          <span className="tw-track">
            {[0, 2, 4, 6, 8, 10].map((n) => <i key={n} style={{ [side]: x(n) }}>{n}</i>)}
          </span>
          <span className="tw-read">{t.passesIn}</span>
        </li>
        {rows.map(({ p, dots }) => {
          const k = dots.filter((d) => d.seats > 0).length;
          const ls = listSeats(p.id), avg = ls.below ? null : ls.text;
          const seen = new Map<number, number>();
          const count = new Map<number, number>();
          const name = listName(p, lang);
          for (const d of dots) count.set(d.seats, (count.get(d.seats) ?? 0) + 1);
          return (
            <li key={p.id}>
              <Link href={edHref(`/parties/${p.id}`, lang)} className="tw-name">
                <span className="sw" style={{ background: partyColor(p.id) }} aria-hidden="true" />
                <T v={name} lang={lang} />
              </Link>
              <span className="tw-track" style={{ ["--n" as string]: Math.max(...count.values()) }} role="img" aria-label={`${name.text}: ${dots.map((d) => `${who(d.poll.pollster)} ${said(d.seats)}`).join(", ")}`}>
                <i className="tw-gap" style={{ [side]: 0, width: x(FLOOR) }} aria-hidden="true" />
                {dots.map((d) => {
                  const n = seen.get(d.seats) ?? 0;
                  seen.set(d.seats, n + 1);
                  return <i key={d.poll.id} className={`tw-dot${d.hollow ? " hollow" : ""}${d.seats === 0 ? " out" : ""}`} style={{ [side]: x(d.seats), ["--c" as string]: partyColor(p.id), ["--k" as string]: n - ((count.get(d.seats) ?? 1) - 1) / 2 }} title={`${who(d.poll.pollster)}, ${mediumDate(d.poll.published, lang)}: ${said(d.seats)}`} />;
                })}
              </span>
              <span className="tw-read">
                <b>{k}</b>{t.of(dots.length)}
                {k > 0 && avg && <span className="tw-avg">{t.average(avg)}</span>}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="fig-src tw-src">{t.src(mainPolls.length)}</p>
    </figure>
  );
}
