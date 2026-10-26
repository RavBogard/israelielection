import Link from "next/link";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { evaluationsFor } from "@/lib/election-lifecycle/evaluation";
import { FORMATION, RECORD_LABELS } from "@/lib/i18n/formation-live";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import SeatBasis from "./SeatBasis";
export default function ElectionRecord({
  context,
  lang,
}: {
  context: SharedSeatContext | null;
  lang: Lang;
}) {
  if (!context)
    return (
      <section className="election-record">
        <h2>{FORMATION[lang].archive}</h2>
        <SeatBasis context={null} lang={lang} />
        <p>{FORMATION[lang].noScoring}</p>
      </section>
    );
  const r = RECORD_LABELS[lang],
    t = FORMATION[lang],
    c = LIFECYCLE[lang],
    rows = context.seatStatus === "official" ? evaluationsFor(context) : [];
  const num = (n: number) =>
    n.toLocaleString(locale(lang), { maximumFractionDigits: 2 });
  return (
    <section className="election-record">
      <h2>{t.archive}</h2>
      <SeatBasis context={context} lang={lang} />
      <p>
        <Link href={editionPath("/results", lang) ?? "/results"}>
          {c.currentSeats}
        </Link>{" "}
        ·{" "}
        <Link href={editionPath("/government", lang) ?? "/government"}>
          {c.negotiations}
        </Link>
      </p>
      <h3>{t.scoring}</h3>
      {rows.length ? (
        <>
          <p>{t.completed}</p>
          <p>{r.scoreNote}</p>
          <div className="record-table">
            <table>
              <thead>
                <tr>
                  <th>{t.prediction}</th>
                  <th>{t.registration}</th>
                  <th>{t.mae}</th>
                  <th>{t.threshold}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.predictionRevision}>
                    <th>
                      {row.label === "forecast"
                        ? c.campaign_forecast
                        : row.label === "forecast_v2"
                          ? `${c.campaign_forecast} V2`
                          : row.label === "average"
                            ? r.average
                            : r.sensitivity}
                    </th>
                    <td>{t[row.registration]}</td>
                    <td>{num(row.listMae)}</td>
                    <td>
                      {row.thresholdCorrect}/{row.thresholdTotal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>{c.view}</summary>
            {rows.map((row) => (
              <div key={row.predictionRevision}>
                <p>
                  {row.label} · {row.generatedAt}
                </p>
                {row.majority && (
                  <p>
                    {r.majority}: {row.majority.predicted.join(" / ")} →{" "}
                    {row.majority.actual} ·{" "}
                    {(row.majority.probabilityOfActual * 100).toFixed(0)}%
                  </p>
                )}
                {row.unexpectedElected.length > 0 && (
                  <p>
                    {r.unexpected}:{" "}
                    {row.unexpectedElected
                      .map(
                        (p) =>
                          `${context.parties.find((x) => x.id === p.id)?.label ?? p.id} ${p.seats}`,
                      )
                      .join(" · ")}
                  </p>
                )}
                <table>
                  <caption>
                    {t.mae} · {c.seats}
                  </caption>
                  <tbody>
                    {Object.entries(row.listErrors).map(([id, error]) => (
                      <tr key={id}>
                        <th>
                          {context.parties.find((p) => p.id === id)?.label ??
                            id}
                        </th>
                        <td>{num(error)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </details>
        </>
      ) : (
        <p>{t.noScoring}</p>
      )}
    </section>
  );
}
