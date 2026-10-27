"use client";
import { useEffect, useState } from "react";
import { editionPath, isRtl, locale } from "@/lib/i18n";
import { DASHBOARD } from "@/lib/i18n/election-dashboard";
import { useSeatContext } from "../seat-context/SeatContextProvider";
import type { LiveForecastSnapshot } from "@/lib/live-forecast/types";
import {
  exactBlocs,
  headlineRows,
  pointBlocs,
  mergeSnapshot,
  numericHistorySegments,
  primaryThresholds,
  probability,
  type ForecastProps,
} from "./presentation";
import NowSeats, { NowBlocSeats, NowSeatsKey } from "../NowSeats";
import { outgoingBlocSeats } from "@/lib/outgoing-seats";
import { NOW_SEATS } from "@/lib/i18n/now-seats";

const colors: Record<string, string> = {
  net: "var(--b-net)",
  opp: "var(--b-opp)",
  arab: "var(--b-arab)",
  mid:"var(--b-mid)",
  other: "var(--ink-3)",
};
const interval = (n: { lo: number; median: number; hi: number }) =>
  `${n.median} (${n.lo}–${n.hi})`;
const pct = (n: number) => `${(Math.max(0, Math.min(120, n)) / 120) * 100}%`;
/** One display for server, live client and frozen archive; no coalition-formation probabilities. */
export function ForecastDisplay({
  initial: snapshot,
  context,
  cadence: readCadence,
  lang,
  text: t,
  names,
  compact = false,
  archived = false,
  refreshError = false,
}: ForecastProps & { refreshError?: boolean }) {
  const d = DASHBOARD[lang],
    official = context?.seatStatus === "official";
  const date = (value: string | null | undefined) =>
    value
      ? new Intl.DateTimeFormat(locale(lang), {
          timeZone: "Asia/Jerusalem",
          month: "short",
          day: "numeric",
          ...(value.includes("T")
            ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
            : {}),
        }).format(new Date(value))
      : t.unavailable;
  if (!snapshot)
    return (
      <section className="lf">
        <h2>{d.title}</h2>
        <p role="status">{t.unknown}</p>
      </section>
    );
  const party = (id: string) =>
    id === "tie"
      ? t.tie
      : (names[id]?.name ??
        context?.parties.find((p) => p.id === id)?.label ??
        id);
  const bloc = (id: string) =>
    id === "net"
      ? t.net
      : id === "opp"
        ? t.opp
        : id === "mid"
          ? d.mid
          : id === "arab"
          ? d.arab
          : d.other;
  const watched = primaryThresholds(snapshot).slice(0, 3);
  const leaders = [...snapshot.largestParty]
    .filter((row) => row.probability > 0||row.id==="tie")
    .sort((a, b) => b.probability - a.probability || (a.id < b.id ? -1 : 1));
  const mainLeaders = leaders.filter(
    (row) => row.probability >= 0.01 || row.id === "tie",
  );
  const exact = official ? Object.entries(context.pointSeats) : [],
    maximum = Math.max(0, ...exact.map(([, n]) => n)),
    winners = exact.filter(([, n]) => n === maximum);
  const blocks = (
    official ? exactBlocs(context, names) : headlineRows(snapshot.blocSeats ?? [], context ? pointBlocs(context, names) : null)
  ).filter((row) => row.id !== "other" || row.seats.hi > 0);
  const history = snapshot.history.filter((point) => point.blocSeats?.length);
  const cadence = readCadence ?? snapshot.cadence;
  const phase = official
    ? d.official
    : archived
      ? d.archive
      : cadence?.status === "failed" || refreshError
        ? d.failure
        : cadence?.status === "overdue"
          ? d.overdue
          : snapshot.freshness.status === "stale"
            ? t.paused
            : t[snapshot.mode];
  const probabilityHistory=(kind:"largestParty"|"thresholds",caption:string)=>{const ids=[...new Set(snapshot.history.flatMap(point=>(point[kind]??[]).map(row=>row.id)))].sort();return <div className="lf-table-scroll"><table><caption>{caption}</caption><thead><tr><th>{t.time}</th>{ids.map(id=><th key={id}>{party(id)}</th>)}</tr></thead><tbody>{snapshot.history.map(point=><tr key={point.revision}><th scope="row">{date(point.generatedAt)}</th>{ids.map(id=>{const row=point[kind]?.find(row=>row.id===id);return <td key={id} dir="ltr">{row?probability("probability" in row?row.probability:row.passProbability):"—"}</td>;})}</tr>)}</tbody></table></div>;};
  const thresholdRow = (row: (typeof watched)[number]) => (
    <li key={row.id} data-threshold-id={row.id}>
      <div className="lf-threshold-head">
        <strong lang={names[row.id]?.lang}>{party(row.id)}</strong>
        <span className="lf-fig">
          <b dir="ltr">
            {official
              ? (context.pointSeats[row.id] ?? 0)
              : probability(row.passProbability)}
          </b>
          {official && <NowSeats id={row.id} lang={lang} />}
        </span>
      </div>
      {official ? (
        <p className="lf-note">
          {(context.pointSeats[row.id] ?? 0) > 0 ? d.passed : d.failed}
        </p>
      ) : (
        <>
          <div className="lf-prob-track" aria-hidden="true">
            <span
              style={{
                width: `${row.passProbability * 100}%`,
                background: names[row.id]?.color ?? "var(--ink-3)",
              }}
            />
          </div>
          <small>{t.threshold}</small>
        </>
      )}
    </li>
  );
  return (
    <section
      className={`lf${compact ? " lf-compact" : ""}`}
      dir={isRtl(lang) ? "rtl" : "ltr"}
      aria-labelledby="live-forecast-title"
    >
      <header className="lf-head">
        <h2 id="live-forecast-title">{d.title}</h2>
        <p>
          {!official && (
            <>
              <span>{t.experimental}</span> ·{" "}
            </>
          )}
          {phase}
        </p>
      </header>
      {(refreshError ||
        cadence?.status === "failed" ||
        cadence?.status === "overdue") && (
        <p className="lf-status" role="status">
          {refreshError ? t.error : phase}
        </p>
      )}
      <div className="lf-questions">
        <section className="lf-question" aria-labelledby="lf-ahead">
          <h3 id="lf-ahead">
            {official ? (winners.length > 1 ? d.winners : d.winner) : t.ahead}
          </h3>
          {official ? (
            <ol className="lf-leaders">
              {winners.map(([id, n]) => (
                <li key={id}>
                  <div>
                    <span>{party(id)}</span>
                    <span className="lf-fig">
                      <b dir="ltr">{n}</b>
                      <NowSeats id={id} lang={lang} />
                    </span>
                  </div>
                  <small>{d.official}</small>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <p className="lf-label">{t.largest}</p>
              <ol className="lf-leaders">
                {mainLeaders.map((row) => (
                  <li key={row.id}>
                    <div>
                      <span lang={names[row.id]?.lang}>{party(row.id)}</span>
                      <b dir="ltr">{probability(row.probability)}</b>
                    </div>
                    <div className="lf-prob-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${row.probability * 100}%`,
                          background:
                            row.id === "tie"
                              ? "var(--ink-2)"
                              : names[row.id]?.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
          <p className="lf-note">{t.pm}</p>
          {!official && (
            <details className="lf-details">
              <summary>
                {t.seats} · {t.interval}
              </summary>
              <table>
                <thead>
                  <tr>
                    <th>{t.seats}</th>
                    <th>{t.interval}</th>
                    <th>{t.largest}</th>
                    <th>{NOW_SEATS[lang].col}</th>
                  </tr>
                </thead>
                <tbody>
                  {headlineRows(snapshot.partySeats, context?.pointSeats ?? null)
                    .sort((a, b) => b.seats.median - a.seats.median)
                    .map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{party(row.id)}</th>
                        <td dir="ltr">{interval(row.seats)}</td>
                        <td dir="ltr">
                          {probability(
                            leaders.find((lead) => lead.id === row.id)
                              ?.probability ?? 0,
                          )}
                        </td>
                        <td className="lf-now">
                          <NowSeats id={row.id} lang={lang} bare />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <NowSeatsKey lang={lang} />
            </details>
          )}
        </section>
        <section className="lf-question" aria-labelledby="lf-blocs">
          <h3 id="lf-blocs">{d.blocs}</h3>
          <div className="lf-seat-axis" aria-hidden="true">
            <span>0</span>
            <b>{d.majority}</b>
            <span>120</span>
          </div>
          <ol className="lf-ranges">
            {blocks.map((row) => (
              <li key={row.id}>
                <div className="lf-range-label">
                  <span>{bloc(row.id)}</span>
                  <span className="lf-fig">
                    <b dir="ltr">
                      {official ? row.seats.median : interval(row.seats)}
                    </b>
                    <NowBlocSeats id={row.id} lang={lang} />
                  </span>
                </div>
                <div className="lf-seat-track" aria-hidden="true">
                  <i className="lf-sixty-one" />
                  {outgoingBlocSeats[row.id] !== undefined && <i className="lf-now-mark" style={{ insetInlineStart: pct(outgoingBlocSeats[row.id]) }} />}
                  <span
                    className="lf-seat-range"
                    style={{
                      insetInlineStart: pct(row.seats.lo),
                      width: pct(row.seats.hi - row.seats.lo),
                      background: colors[row.id],
                    }}
                  />
                  <b
                    className="lf-seat-point"
                    style={{
                      insetInlineStart: pct(row.seats.median),
                      background: colors[row.id],
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
          {!blocks.length && <p className="lf-note">{t.unavailable}</p>}
          {!official && (
            <>
              <p className="lf-note">{d.marginal}</p>
              <div className="lf-bloc">
                {snapshot.blocLead.map((row) => (
                  <div key={row.id}>
                    <span>{row.id === "tie" ? t.blocTie : bloc(row.id)}</span>
                    <b dir="ltr">{probability(row.probability)}</b>
                  </div>
                ))}
                <p>{t.aheadChance}</p>
              </div>
              <p className="lf-margin">
                {t.margin}
                <strong dir="ltr">{interval(snapshot.blocMargin)}</strong>
                <small>{t.interval}</small>
              </p>
            </>
          )}
        </section>
        <section className="lf-question" aria-labelledby="lf-changes">
          <h3 id="lf-changes">{official ? d.watched : d.thresholds}</h3>
          {!official&&<p className="lf-note">{d.watch}</p>}
          <ol className="lf-thresholds">{watched.map(thresholdRow)}</ol>
          {!watched.length && <p>{t.none}</p>}
          {compact ? (
            <a
              className="lf-full"
              href={`${editionPath("/results", lang)}#lf-all-thresholds`}
            >
              {d.all} →
            </a>
          ) : (
            <details className="lf-details" id="lf-all-thresholds">
              <summary>{d.all}</summary>
              <ol className="lf-thresholds">
                {primaryThresholds(snapshot).map(thresholdRow)}
              </ol>
            </details>
          )}
        </section>
      </div>
      <p className="lf-stamp">
        {official ? d.official : t.updated}:{" "}
        <time
          dateTime={
            official
              ? (context.publishedAt ?? context.observedAt)
              : snapshot.generatedAt
          }
        >
          {date(official ? context.publishedAt : snapshot.generatedAt)}
        </time>{" "}
        · {t.time}
        <br />
        {cadence?.phase==="before_close"&&!cadence.lastSuccessfulAt?<>{d.begins}: {date(cadence.nextCheckAt)} · {t.time}</>:<>{d.last}: {date(cadence?.lastSuccessfulAt??snapshot.freshness.lastSuccessfulAcquisitionAt)}{!official&&!archived&&<> · {d.next}: {date(cadence?.nextCheckAt)}</>}</>}
      </p>
      {compact ? (
        <a
          className="lf-full"
          href={`${editionPath("/results", lang)}#live-forecast-title`}
        >
          {t.full} →
        </a>
      ) : (
        <>
          <section className="lf-history">
            <h3>{d.history}</h3>
            {history.length < 2 ? (
              <p className="lf-note">{t.historyEmpty}</p>
            ) : (
              <>
                <svg viewBox="0 0 800 210" role="img" aria-label={d.history}>
                  <line
                    x1="32"
                    x2="785"
                    y1="180"
                    y2="180"
                    stroke="var(--line-2)"
                  />
                  <line
                    x1="32"
                    x2="785"
                    y1={180 - (61 / 120) * 170}
                    y2={180 - (61 / 120) * 170}
                    stroke="var(--line)"
                  />
                  <text x="0" y="15" fill="currentColor" fontSize="12">
                    120
                  </text>
                  <text x="0" y="98" fill="currentColor" fontSize="12">
                    61
                  </text>
                  <text x="0" y="183" fill="currentColor" fontSize="12">
                    0
                  </text>
                  {["net","opp","mid","arab","other"].flatMap(id=>{const start=Date.parse(snapshot.history[0].generatedAt),end=Date.parse(snapshot.history.at(-1)!.generatedAt),x=(at:number)=>32+(at-start)/Math.max(1,end-start)*750,y=(seats:number)=>180-seats/120*170;return numericHistorySegments(snapshot.history,id).map((points,index)=>points.length===1?<circle key={id+index} cx={x(points[0].at)} cy={y(points[0].seats)} r="3" fill={colors[id]}/>:<polyline key={id+index} fill="none" stroke={colors[id]} strokeWidth="3" points={points.map(p=>x(p.at)+","+y(p.seats)).join(" ")}/>);})}
                </svg>
                <div className="lf-history-key">
                  {["net", "opp", "mid", "arab", "other"].map((id) => (
                    <span key={id}>
                      <i
                        style={{
                          borderColor: colors[id],
                          borderStyle: "solid",
                        }}
                      />
                      {bloc(id)}
                    </span>
                  ))}
                </div>
              </>
            )}
            {history.length < snapshot.history.length && (
              <p className="lf-note">{d.numericMissing}</p>
            )}
            <details className="lf-details">
              <summary>{t.dataTable}</summary>
              <div className="lf-table-scroll">
                <table>
                  <caption>{d.historyCaption}</caption>
                  <thead>
                    <tr>
                      <th>{t.time}</th>
                      {["net", "opp", "mid", "arab", "other"].map((id) => (
                        <th key={id}>{bloc(id)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.history.map((point) => (
                      <tr key={point.revision}>
                        <th scope="row">{date(point.generatedAt)}</th>
                        {["net", "opp", "mid", "arab", "other"].map((id) => {
                          const row = point.blocSeats?.find((r) => r.id === id);
                          return (
                            <td key={id} dir="ltr">
                              {row ? interval(row.seats) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {probabilityHistory("largestParty",d.largestHistory)}
              {probabilityHistory("thresholds",d.thresholdHistory)}
            </details>
          </section>
          <section className="lf-method">
            <h3>{t.method}</h3>
            <p>{d.method}</p>
            <a href={editionPath("/forecast", lang) ?? "/forecast"}>
              {t.priorSource} →
            </a>
            <dl className="lf-provenance">
              <div>
                <dt>{t.checked}</dt>
                <dd>
                  {date(
                    cadence?.lastAttemptAt ?? snapshot.freshness.lastAttemptAt,
                  )}
                </dd>
              </div>
              <div>
                <dt>{d.last}</dt>
                <dd>
                  {date(
                    cadence?.lastSuccessfulAt ??
                      snapshot.freshness.lastSuccessfulAcquisitionAt,
                  )}
                </dd>
              </div>
              <div>
                <dt>{t.frozen}</dt>
                <dd>
                  {snapshot.prior.version} ·{" "}
                  {snapshot.prior.final ? t.finalPrior : t.provisionalPrior} ·{" "}
                  {date(snapshot.prior.generatedAt)}
                </dd>
              </div>
              <div>
                <dt>{t.model}</dt>
                <dd>
                  {snapshot.modelVersion} ·{" "}
                  {snapshot.diagnostics.runs.toLocaleString(locale(lang))}{" "}
                  {t.runs}
                </dd>
              </div>
            </dl>
            {snapshot.sources.map((source) => (
              <div className="lf-source" key={source.id}>
                <a href={source.url}>{source.publisher}</a>
                {source.id === "official-count" &&
                  snapshot.diagnostics.countGate === "blocked" && (
                    <p>{t.countExcluded}</p>
                  )}
                <dl>
                  <div>
                    <dt>{t.sourceStatus}</dt>
                    <dd>
                      {source.status === "valid"
                        ? t.valid
                        : source.status === "rejected"
                          ? t.rejected
                          : t.unavailable}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.publication}</dt>
                    <dd>{date(source.publishedAt)}</dd>
                  </div>
                  <div>
                    <dt>{t.observed}</dt>
                    <dd>{date(source.observedAt)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </section>
        </>
      )}
    </section>
  );
}

export default function ForecastClient(props: ForecastProps) {
  const shared = useSeatContext(props.context ?? null),
    context = shared.context ?? props.context;
  const archived =
    !!props.archived ||
    !!shared.forecastComplete ||
    context?.seatStatus === "official" ||
    context?.freshness.status === "complete";
  const [snapshot, setSnapshot] = useState(props.initial),
    [refreshError, setRefreshError] = useState(false);
  useEffect(() => {
    if (archived) return;
    let disposed = false,
      controller: AbortController | null = null,
      timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller?.abort();
      const pending = new AbortController();
      controller = pending;
      const timeout = setTimeout(() => {
        pending.abort();
        if (!disposed) setRefreshError(true);
      }, 10000);
      try {
        const response = await fetch("/api/live-forecast", {
          signal: pending.signal,
          cache: "no-store",
        });
        if (!response.ok) throw Error("Forecast unavailable");
        const next = (await response.json()) as LiveForecastSnapshot & {
          enabled?: boolean;
        };
        if (!disposed && !pending.signal.aborted) {
          if (next.enabled === false) return;
          if (next.schemaVersion !== 1 || !next.diagnostics?.stable)
            throw Error("Invalid forecast");
          setSnapshot((current) => mergeSnapshot(current, next));
          setRefreshError(
            next.changeReason === "acquisition_failed" ||
              next.freshness.status === "stale",
          );
        }
      } catch {
        if (!disposed) setRefreshError(true);
      } finally {
        clearTimeout(timeout);
        if (!disposed && controller === pending)
          timer = setTimeout(refresh, 30000);
      }
    };
    const visible = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") void refresh();
      else controller?.abort();
    };
    document.addEventListener("visibilitychange", visible);
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, [archived]);
  return (
    <ForecastDisplay
      {...props}
      context={context}
      cadence={shared.cadence ?? props.cadence}
      initial={snapshot}
      archived={archived}
      refreshError={refreshError}
    />
  );
}
