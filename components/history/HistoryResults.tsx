"use client";
import { useSeatContext } from "@/components/seat-context/SeatContextProvider";
import { mediumDate } from "@/lib/format";
import type { Lang } from "@/lib/i18n";
import { fill } from "@/lib/i18n/post-count";
import { POST_RECORDS } from "@/lib/i18n/post-records";
import { outgoingSeats } from "@/lib/outgoing-seats";

/** The 2026 marker for a list's history heading: seats on the count so far, or below the threshold; official wording once the result is. Null with no count. */
export function useHistoryMarker(lang: Lang): (id: string) => string | null {
  const { context } = useSeatContext();
  const R = POST_RECORDS[lang];
  return (id) => {
    if (!context) return null;
    const official = context.seatStatus === "official";
    const seats = context.pointSeats[id] ?? 0;
    return seats > 0 ? fill(official ? R.histSeatsOfficial : R.histSeatsSoFar, { n: seats }) : official ? R.histBelowOfficial : R.histBelowSoFar;
  };
}

/** From the last Knesset to now: each profiled list's seats at dissolution beside its seats on the count so far (or official). */
export default function HistoryResults({ lang, rows }: { lang: Lang; rows: { id: string; name: string }[] }) {
  const { context } = useSeatContext();
  if (!context) return null;
  const R = POST_RECORDS[lang];
  const official = context.seatStatus === "official";
  const stamp = (context.publishedAt ?? context.observedAt).slice(0, 10);
  return (
    <section className="history-results" aria-labelledby="hr-h" data-testid="history-results" data-provisional={official ? "false" : "true"}>
      <h2 id="hr-h">{R.histTableTitle}</h2>
      <p>{R.histAdded}: <time dateTime={stamp}>{mediumDate(stamp, lang)}</time></p>
      <div className="table-scroll" tabIndex={0} role="region" aria-label={R.histTableTitle}>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">{R.histColList}</th>
              <th scope="col" className="num">{R.histColLast}</th>
              <th scope="col" className="num">{official ? R.histColNowOfficial : R.histColNow}</th>
              <th scope="col" className="num">{R.histColChange}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => {
              const last = outgoingSeats(h.id);
              const now = context.pointSeats[h.id] ?? 0;
              const d = last === null ? null : now - last;
              return (
                <tr key={h.id}>
                  <th scope="row"><a href={`#${h.id}`}>{h.name}</a></th>
                  <td className="num">{last ?? "–"}</td>
                  <td className="num">{now > 0 ? now : R.histBelowShort}</td>
                  <td className="num"><bdi dir="ltr">{d === null ? "–" : d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : "0"}</bdi></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="fig-src">{R.histNote}</p>
    </section>
  );
}
