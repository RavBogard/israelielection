"use client";
import Link from "next/link";
import SeatBar from "../SeatBar";
import SeatBasis from "./SeatBasis";
import { useSeatContext } from "./SeatContextProvider";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { editionPath } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { ForecastProps } from "../live-forecast/presentation";
import { FORMATION } from "@/lib/i18n/formation-live";

type Props = {
  initial: SharedSeatContext;
  lang: Lang;
  compact?: boolean;
  showSeats?: boolean;
  heading?: string;
  names: ForecastProps["names"];
  /** Arrives with forecastPresentation spreads; scenarios are not rendered. */
  scenarios?: ForecastProps["scenarios"];
};
/** One joint point's seats. Coalition scenarios are not shown (Daniel, 2026-10-27: not our lane). */
export default function CurrentParliament({
  initial,
  lang,
  compact = false,
  showSeats = true,
  heading,
  names,
}: Props) {
  const { context: current, refreshFailed } = useSeatContext(initial);
  const context = current ?? initial,
    t = LIFECYCLE[lang];
  const rows = Object.entries(context.pointSeats)
    .filter(([, seats]) => seats > 0)
    .sort((a, b) => b[1] - a[1]);
  const name = (id: string) =>
    names[id]?.name ?? context.parties.find((p) => p.id === id)?.label ?? id;
  return (
    <section
      className="current-parliament"
      aria-label={t.currentSeats}
      data-seat-revision={context.revision}
    >
      {showSeats && (
        <>
          <h2 id={`current-seats-${compact ? "home" : "full"}`}>
            {heading ?? (context.seatStatus === "official"
              ? t.officialResult
              : t.currentSeats)}
          </h2>
          <SeatBasis context={context} lang={lang} share />
          {refreshFailed && (
            <p role="status">
              {t.notice}: {t.stale}
            </p>
          )}
          <SeatBar
            segments={rows.map(([id, seats]) => ({
              key: id,
              seats,
              color: names[id]?.color ?? "var(--ink-3)",
            }))}
          />
          <div className="parliament-lists">
            {rows.map(([id, seats]) => (
              <span key={id}>
                <i
                  style={{ background: names[id]?.color ?? "var(--ink-3)" }}
                  aria-hidden="true"
                />
                {name(id)} <b>{seats}</b>
              </span>
            ))}
          </div>
          {!compact && (
            <table>
              <caption>
                {t.seats} · {t[context.basis]}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t.seats}</th>
                  <th scope="col">{t[context.seatStatus]}</th>
                  {context.uncertainty && (
                    <th scope="col">{FORMATION[lang].interval}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map(([id, seats]) => (
                  <tr key={id} id={`list-${encodeURIComponent(id)}`}>
                    <th scope="row">{name(id)}</th>
                    <td>{seats}</td>
                    {context.uncertainty && (
                      <td>
                        {context.uncertainty.partyIntervals[id]
                          ? `${context.uncertainty.partyIntervals[id].lo}–${context.uncertainty.partyIntervals[id].hi}`
                          : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      <p>
        <Link href={editionPath("/government", lang) ?? "/government"}>
          {t.negotiations}
        </Link>
      </p>
    </section>
  );
}
