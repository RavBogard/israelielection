"use client";

import { useSeatContext } from "../seat-context/SeatContextProvider";
import { FORMATION } from "@/lib/i18n/formation-live";
import { useEffect, useState } from "react";
import { editionPath, isRtl, locale } from "@/lib/i18n";
import type { Interval, LiveForecastSnapshot } from "@/lib/live-forecast/types";
import { mergeSnapshot, primaryThresholds, probability, type ForecastProps } from "./presentation";

const range = (value: Interval) => `${value.median} (${value.lo}–${value.hi})`;

/** Pure presentation also gives the static server baseline and accessible tables identical semantics. */
export function ForecastDisplay({ initial: snapshot, lang, text: t, names, scenarios, compact = false, refreshError = false }: ForecastProps & { refreshError?: boolean }) {
  const date = (value: string | null) => value ? new Intl.DateTimeFormat(locale(lang), { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(value)) : t.unavailable;
  if (!snapshot) return <section className="lf" dir={isRtl(lang) ? "rtl" : "ltr"}><h2>{t.title}</h2><p role="status">{t.unknown}</p></section>;
  const party = (id: string) => id === "tie" ? t.tie : names[id]?.name ?? id;
  const active = primaryThresholds(snapshot);
  const secondary = snapshot.thresholds.filter((row) => !active.some((risk) => risk.id === row.id));
  const leaders = [...snapshot.largestParty].sort((a, b) => b.probability - a.probability);
  const mainLeaders = leaders.filter((row) => row.probability >= .01 || row.id === "tie");
  const phase = snapshot.freshness.status === "stale" || snapshot.changeReason === "acquisition_failed" ? t.paused : t[snapshot.mode];
  const scenarioTitle = (id: string) => scenarios.find((row) => row.id === id)?.title ?? id;
  const history = snapshot.history.length ? snapshot.history : [{ generatedAt: snapshot.generatedAt, revision: snapshot.revision, mode: snapshot.mode, arrangements: snapshot.arrangements }];
  const previous = history.filter((point) => Date.parse(point.generatedAt) < Date.parse(snapshot.generatedAt)).at(-1);
  const moved = snapshot.arrangements.flatMap((row) => { const old = previous?.arrangements.find((item) => item.id === row.id); const change = old ? Math.round((row.probability - old.probability) * 100) : 0; return Math.abs(change) >= 1 ? [{ id: row.id, change }] : []; });
  const thresholdRow = (row: typeof active[number]) => <li key={row.id}>
    <div className="lf-threshold-head"><strong lang={names[row.id]?.lang}>{party(row.id)}</strong><span>{t.threshold} <b dir="ltr">{probability(row.passProbability)}</b></span></div>
    <div className="lf-prob-track" aria-hidden="true"><span style={{ width: `${row.passProbability * 100}%`, background: names[row.id]?.color }} /></div>
    {row.sufficientSupport ? (compact ? [...row.impact].sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)).slice(0, 1) : row.impact).map((impact) => <div className="lf-impact" key={impact.scenarioId}><span>{scenarioTitle(impact.scenarioId)}</span><span>{t.pass} <b dir="ltr">{probability(impact.passSuccess)}</b></span><span>{t.fail} <b dir="ltr">{probability(impact.failSuccess)}</b></span></div>) : <p className="lf-note">{t.insufficient}</p>}
  </li>;
  return <section className={`lf${compact ? " lf-compact" : ""}`} dir={isRtl(lang) ? "rtl" : "ltr"} aria-labelledby="live-forecast-title">
    <header className="lf-head"><h2 id="live-forecast-title">{t.title}</h2><p><span>{t.experimental}</span> · {phase}</p></header>
    <p className="lf-status" role="status">{refreshError ? t.error : t[snapshot.changeReason]}</p>
    {moved.length > 0 && <p className="lf-moved">{t.changeFrom}: {moved.map((row) => <span key={row.id}>{scenarioTitle(row.id)} <b dir="ltr">{row.change > 0 ? "+" : ""}{row.change}</b> </span>)}</p>}
    <div className="lf-questions">
      <section className="lf-question" aria-labelledby="lf-ahead"><h3 id="lf-ahead">{t.ahead}</h3><p className="lf-label">{t.largest}</p>
        <ol className="lf-leaders">{mainLeaders.map((row) => <li key={row.id}><div><span lang={row.id === "tie" ? lang : names[row.id]?.lang}>{party(row.id)}</span><b dir="ltr">{probability(row.probability)}</b></div><div className="lf-prob-track" aria-hidden="true"><span style={{ width: `${row.probability * 100}%`, background: row.id === "tie" ? "var(--ink-2)" : names[row.id]?.color }} /></div></li>)}</ol>
        <p className="lf-note">{t.pm}</p>
        <div className="lf-bloc">{snapshot.blocLead.map((row) => <div key={row.id}><span>{row.id === "net" ? t.net : row.id === "opp" ? t.opp : t.blocTie}</span><b dir="ltr">{probability(row.probability)}</b></div>)}<p>{t.aheadChance}</p></div>
        <p className="lf-margin">{t.margin}<strong dir="ltr">{range(snapshot.blocMargin)}</strong><small>{t.interval}</small></p>
        <details className="lf-details"><summary>{t.seats} · {t.interval}</summary><table><thead><tr><th>{t.seats}</th><th>{t.interval}</th><th>{t.largest}</th></tr></thead><tbody>{[...snapshot.partySeats].sort((a, b) => b.seats.median - a.seats.median).map((row) => <tr key={row.id}><th scope="row" lang={names[row.id]?.lang}>{party(row.id)}</th><td dir="ltr">{range(row.seats)}</td><td dir="ltr">{probability(leaders.find((lead) => lead.id === row.id)?.probability ?? 0)}</td></tr>)}</tbody></table></details>
      </section>
      <section className="lf-question" aria-labelledby="lf-paths"><h3 id="lf-paths">{t.paths}</h3><p className="lf-note">{t.conditional}</p>
        <ol className="lf-arrangements">{snapshot.arrangements.map((row) => {
          const scenario = scenarios.find((item) => item.id === row.id);
          return <li key={row.id}><div className="lf-path-head"><h4 lang={scenario?.titleLang}>{scenarioTitle(row.id)}</h4><b dir="ltr">{probability(row.probability)}</b></div><div className="lf-prob-track" aria-hidden="true"><span style={{ width: `${row.probability * 100}%`, background: row.id === "netanyahu-arrangement" ? "var(--b-net)" : "var(--b-opp)" }} /></div><p className="lf-vote"><span>{t.yes} <b dir="ltr">{range(row.yes)}</b></span><span>{t.no} <b dir="ltr">{range(row.no)}</b></span><small>{t.interval}</small></p>
            {scenario && scenario.warnings.length > 0 && <p className="lf-pledge-caution">{t.pledgeCaution}</p>}
            {scenario && <details className="lf-details"><summary>{t.roles}</summary><dl>{scenario.roles.map((role) => <div key={role.label}><dt>{role.label}</dt><dd>{role.names}</dd></div>)}</dl><p>{t.others}</p>{scenario.warnings.length > 0 && <><h5>{t.pledges}</h5><ul>{scenario.warnings.map((warning, i) => <li key={i} lang={warning.lang}>{warning.text}<small lang="en"> {warning.source}</small></li>)}</ul></>}<a href={scenario.href}>{t.builder} →</a><p className="lf-note">{t.baselineLink}</p></details>}
          </li>;
        })}</ol>
      </section>
      <section className="lf-question" aria-labelledby="lf-changes"><h3 id="lf-changes">{t.changes}</h3><p className="lf-note">{t.association}</p>{active.length ? <ol className="lf-thresholds">{(compact ? active.slice(0, 2) : active).map(thresholdRow)}</ol> : <p>{t.none}</p>}{!compact && secondary.length > 0 && <details className="lf-details"><summary>{t.secondary}</summary><ol className="lf-thresholds">{secondary.map((row) => <li key={row.id}><span lang={names[row.id]?.lang}>{party(row.id)}</span> <b dir="ltr">{probability(row.passProbability)}</b></li>)}</ol></details>}</section>
    </div>
    <p className="lf-stamp">{t.updated}: <time dateTime={snapshot.generatedAt}>{date(snapshot.generatedAt)}</time> · {t.time}</p>
    {compact ? <a className="lf-full" href={`${editionPath("/results", lang)}#live-forecast-title`}>{t.full} →</a> : <>
      <section className="lf-history"><h3>{t.history}</h3>{history.length < 2 ? <p className="lf-note">{t.historyEmpty}</p> : <><svg viewBox="0 0 800 210" role="img" aria-label={t.history}><line x1="32" x2="785" y1="180" y2="180" stroke="var(--line-2)"/><line x1="32" x2="785" y1="95" y2="95" stroke="var(--line)"/><text x="0" y="15" fill="currentColor" fontSize="12">100%</text><text x="0" y="183" fill="currentColor" fontSize="12">0%</text>{scenarios.map((scenario, index) => {
        const points = history.flatMap((point) => { const row = point.arrangements.find((r) => r.id === scenario.id); return row ? [{ at: Date.parse(point.generatedAt), probability: row.probability }] : []; });
        const start = Date.parse(history[0].generatedAt), end = Date.parse(history.at(-1)!.generatedAt);
        return <polyline key={scenario.id} fill="none" stroke={scenario.id === "netanyahu-arrangement" ? "var(--b-net)" : "var(--b-opp)"} strokeWidth="3" strokeDasharray={index === 1 ? "7 5" : undefined} points={points.map((p) => `${32 + (p.at - start) / Math.max(1, end - start) * 750},${180 - p.probability * 170}`).join(" ")} />;
      })}</svg><p className="lf-note">{t.time}: {date(history[0].generatedAt)} – {date(history.at(-1)!.generatedAt)}</p><div className="lf-history-key">{scenarios.map((scenario, index) => <span key={scenario.id}><i style={{ borderColor: scenario.id === "netanyahu-arrangement" ? "var(--b-net)" : "var(--b-opp)", borderStyle: index === 1 ? "dashed" : "solid" }}/>{scenario.title}</span>)}</div></>}
        <details className="lf-details"><summary>{t.dataTable}</summary><div className="lf-table-scroll"><table><caption>{t.probability}</caption><thead><tr><th>{t.time}</th>{scenarios.map((scenario) => <th key={scenario.id}>{scenario.title}</th>)}</tr></thead><tbody>{history.map((point) => <tr key={`${point.generatedAt}-${point.revision}`}><th scope="row"><time dateTime={point.generatedAt}>{date(point.generatedAt)}</time></th>{scenarios.map((scenario) => <td key={scenario.id} dir="ltr">{probability(point.arrangements.find((r) => r.id === scenario.id)?.probability ?? NaN)}</td>)}</tr>)}</tbody></table></div></details>
      </section>
      <section className="lf-method"><h3>{t.method}</h3><p>{t.methodText}</p><a href={editionPath("/forecast", lang) ?? "/forecast"}>{t.priorSource} →</a><dl className="lf-provenance"><div><dt>{t.checked}</dt><dd>{date(snapshot.freshness.lastAttemptAt)}</dd></div><div><dt>{t.successful}</dt><dd>{date(snapshot.freshness.lastSuccessfulAcquisitionAt)}</dd></div><div><dt>{t.frozen}</dt><dd>{snapshot.prior.version} · {snapshot.prior.final ? t.finalPrior : t.provisionalPrior} · {date(snapshot.prior.generatedAt)}</dd></div><div><dt>{t.model}</dt><dd>{snapshot.modelVersion} · {snapshot.diagnostics.runs.toLocaleString(locale(lang))} {t.runs}</dd></div><div><dt>{t.revision}</dt><dd><code>{snapshot.revision}</code></dd></div></dl>
        {snapshot.sources.map((source) => <div className="lf-source" key={source.id}><a href={source.url}>{source.publisher}</a>{source.id === "official-count" && snapshot.diagnostics.countGate === "blocked" && <p>{t.countExcluded}</p>}<dl><div><dt>{t.sourceStatus}</dt><dd>{source.status === "valid" ? t.valid : source.status === "rejected" ? t.rejected : t.unavailable}</dd></div><div><dt>{t.publication}</dt><dd>{date(source.publishedAt)}</dd></div><div><dt>{t.observed}</dt><dd>{date(source.observedAt)}</dd></div><div><dt>{t.revision}</dt><dd><code>{source.revision}</code></dd></div></dl></div>)}
      </section>
    </>}
  </section>;
}

export default function ForecastClient(props: ForecastProps) {
  const {context,forecastComplete}=useSeatContext();const archived=forecastComplete||context?.seatStatus==="official"||context?.freshness.status==="complete";
  const [snapshot, setSnapshot] = useState(props.initial);
  const [refreshError, setRefreshError] = useState(false);
  useEffect(() => {
    if(archived)return;
    let disposed = false;
    let controller: AbortController | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller?.abort();
      const pending = new AbortController();
      controller = pending;
      try {
        const response = await fetch("/api/live-forecast", { signal: pending.signal, cache: "no-store" });
        if (!response.ok) throw new Error("Forecast refresh failed");
        const next = await response.json() as LiveForecastSnapshot & { enabled?: boolean };
        if (!disposed && !pending.signal.aborted) {
          if (next.enabled === false) return;
          if (next.schemaVersion !== 1 || !next.diagnostics?.stable) throw new Error("Invalid forecast response");
          setSnapshot((current) => mergeSnapshot(current, next));
          setRefreshError(next.changeReason === "acquisition_failed" || next.freshness.status === "stale");
        }
      } catch {
        if (!disposed && !pending.signal.aborted) setRefreshError(true);
      } finally {
        if (!disposed && controller === pending) timer = setTimeout(refresh, 30_000);
      }
    };
    const visible = () => { if (document.visibilityState === "visible") { clearTimeout(timer); void refresh(); } else { clearTimeout(timer); controller?.abort(); } };
    document.addEventListener("visibilitychange", visible);
    void refresh();
    return () => { disposed = true; clearTimeout(timer); controller?.abort(); document.removeEventListener("visibilitychange", visible); };
  }, [archived]);
  if(archived)return <details><summary>{FORMATION[props.lang].archive}</summary><ForecastDisplay {...props} initial={snapshot}/></details>;
  return <ForecastDisplay {...props} initial={snapshot} refreshError={refreshError} />;
}
