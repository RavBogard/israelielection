"use client";
import Link from "next/link";
import SeatBar from "../SeatBar";
import SeatBasis from "./SeatBasis";
import { useSeatContext } from "./SeatContextProvider";
import { contextRoleTotals, pinnedSeatHref } from "@/lib/seat-context";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { editionPath } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import type { ForecastProps } from "../live-forecast/presentation";
import { FORMATION } from "@/lib/i18n/formation-live";
import { LIVE_FORECAST } from "@/lib/i18n/live-forecast";

type Props = {
  initial: SharedSeatContext;
  lang: Lang;
  compact?: boolean;
  showSeats?: boolean;
  showScenarios?: boolean;
  names: ForecastProps["names"];
  scenarios: ForecastProps["scenarios"];
};
/** Exact arithmetic on one joint point. These values are never government-formation probabilities. */
export default function CurrentParliament({
  initial,
  lang,
  compact = false,
  showSeats = true,
  showScenarios = true,
  names,
  scenarios,
}: Props) {
  const { context: current, refreshFailed } = useSeatContext(initial);
  const context = current ?? initial,
    t = LIFECYCLE[lang],
    f = LIVE_FORECAST[lang];
  const rows = Object.entries(context.pointSeats)
    .filter(([, seats]) => seats > 0)
    .sort((a, b) => b[1] - a[1]);
  const name = (id: string) =>
    names[id]?.name ?? context.parties.find((p) => p.id === id)?.label ?? id;
  return (
    <section
      className="current-parliament"
      aria-label={showSeats ? t.currentSeats : t.scenarios}
      data-seat-revision={context.revision}
    >
      {showSeats && (
        <>
          <h2 id={`current-seats-${compact ? "home" : "full"}`}>
            {context.seatStatus === "official"
              ? t.officialResult
              : t.currentSeats}
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
                  <tr key={id}>
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
      {showScenarios && (
        <>
          <h3>{t.scenarios}</h3>
          <p>{FORMATION[lang].hypothesis}</p>
          <div className="parliament-scenarios">
            {scenarios.map((s) => {
              const url = new URL(s.href, "https://www.israelielection.org");
              url.searchParams.set("poll", "current");
              const cabinet = new Set(
                (url.searchParams.get("with") ?? "").split(","),
              );
              const roles: Record<string, "support" | "abstain"> = {};
              for (const role of ["support", "abstain"] as const)
                for (const id of (url.searchParams.get(role) ?? "")
                  .split(",")
                  .filter(Boolean))
                  roles[id] = role;
              const total = contextRoleTotals(context, cabinet, roles);
              return (
                <article key={s.id}>
                  <h4>
                    <Link
                      href={pinnedSeatHref(url.pathname + url.search, context)}
                      lang={s.titleLang}
                    >
                      {s.title}
                    </Link>
                  </h4>
                  <p className="parliament-vote">
                    <b>{total.yes}</b> {f.yes} · <b>{total.no}</b> {f.no} ·{" "}
                    {total.abstain} {f.abstain}
                  </p>
                  <p>
                    {f.cabinet}: {total.cabinet} · {t[context.basis]}
                  </p>
                  {s.warnings.length > 0 && (
                    <details>
                      <summary>{f.pledgeCaution}</summary>
                      {s.warnings.map((w, i) => (
                        <p key={i} lang={w.lang}>
                          {w.text}
                        </p>
                      ))}
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      <p>
        <Link href={editionPath("/government", lang) ?? "/government"}>
          {t.negotiations}
        </Link>{" "}
        ·{" "}
        <Link
          href={pinnedSeatHref(
            `${editionPath("/coalition-builder", lang)}?poll=current`,
            context,
          )}
        >
          {t.scenarios}
        </Link>
      </p>
    </section>
  );
}
