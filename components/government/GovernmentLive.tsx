"use client";
import {referenceText} from "@/lib/i18n/reference";
import { useEffect, useRef, useState } from "react";
import type { ElectionLifecycleSnapshot } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { editionPath, locale } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { FORMATION } from "@/lib/i18n/formation-live";
import {DASHBOARD} from "@/lib/i18n/election-dashboard";
import { acceptsSeatContext } from "@/lib/seat-context";
import type { ForecastProps } from "../live-forecast/presentation";
import { useSeatContext } from "../seat-context/SeatContextProvider";
import CurrentParliament from "../seat-context/CurrentParliament";
import "./government-live.css";
import ProposalLedger from "../reference/ProposalLedger";
type Props = {
  initial: ElectionLifecycleSnapshot;
  lang: Lang;
  compact?: boolean;
  view?: "formation"|"chronology";
  hideSeats?: boolean;
  onlyWhenRelevant?: boolean;
  names: ForecastProps["names"];
  scenarios: ForecastProps["scenarios"];
};
export const claimsExpired=(snapshot:Pick<ElectionLifecycleSnapshot,"cadence">,now:number)=>!!snapshot.cadence&&snapshot.cadence.phase!=="before_close"&&now>Date.parse(snapshot.cadence.expiresAt);
export default function GovernmentLive({
  initial,
  lang,
  names,
  scenarios,
  compact = false,
  view = "formation",
  hideSeats = false,
  onlyWhenRelevant = false,
}: Props) {
  const shared = useSeatContext(initial.seatContext);
  const [state, setState] = useState({ snapshot: initial, failed: false });
  const latest = useRef(initial);
  const lastSuccess = useRef(0);
  useEffect(() => {
    lastSuccess.current=Date.now();
    let disposed = false,
      controller: AbortController | null = null,
      timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      if (disposed || document.visibilityState === "hidden") return;
      controller?.abort();
      const request = new AbortController();
      controller = request;
      const timeout = setTimeout(() => {
        request.abort();
        if (!disposed) setState((s) => ({ ...s, failed: true }));
      }, 10000);
      try {
        const response = await fetch("/api/election-lifecycle", {
          cache: "no-store",
          signal: request.signal,
        });
        if (!response.ok) throw new Error("unavailable");
        const next = (await response.json()) as ElectionLifecycleSnapshot;
        if (
          !next.politics ||
          !next.health ||
          !next.seatContext ||
          next.election !== latest.current.election
        )
          throw new Error("invalid");
        if (disposed || request.signal.aborted) return;
        if (
          next.sequence < latest.current.sequence ||
          !acceptsSeatContext(latest.current.seatContext, next.seatContext)
        ) {
          setState((s) => ({ ...s, failed: true }));
          return;
        }
        lastSuccess.current = Date.now();
        latest.current = next;
        setState({ snapshot: next, failed: false });
      } catch {
        if (!disposed && !request.signal.aborted)
          setState((s) => ({ ...s, failed: true }));
      } finally {
        clearTimeout(timeout);
        if (!disposed && controller === request)
          timer = setTimeout(load, 30000);
      }
    };
    const visible = () => {
      clearTimeout(timer);
      if (document.visibilityState === "visible") {
        if (Date.now() - lastSuccess.current > 60000)
          setState((s) => ({ ...s, failed: true }));
        void load();
      } else controller?.abort();
    };
    const expiry = setInterval(() => {
      if (Date.now() - lastSuccess.current > 90000||claimsExpired(latest.current,Date.now()))
        setState((s) => ({ ...s, failed: true }));
    }, 15000);
    void load();
    document.addEventListener("visibilitychange", visible);
    return () => {
      disposed = true;
      clearInterval(expiry);
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  const snapshot = state.snapshot,
    t = LIFECYCLE[lang],
    f = FORMATION[lang],
    p = snapshot.politics;
  const hidden = state.failed || p.status === "source_unavailable";
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale(lang), {
          timeZone: "Asia/Jerusalem",
          year: "numeric",
          month: "short",
          day: "numeric",
          ...(value.includes("T")
            ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const }
            : {}),
        }).format(new Date(value))
      : t.noTime;
  const name = (id: string) =>
    names[id]?.name ??
    snapshot.seatContext.parties.find((p) => p.id === id)?.label ??
    id;
  const events = hidden ? [] : p.events.filter((e) => e.status === "confirmed");
  if (
    onlyWhenRelevant &&
    shared.context?.seatStatus !== "official" &&
    !events.length &&
    !p.proposals.length
  )
    return null;
  return (
    <div className="government-live">
      {!hideSeats && (
        <CurrentParliament
          initial={snapshot.seatContext}
          lang={lang}
          names={names}
          scenarios={scenarios}
          showScenarios={false}
          compact
        />
      )}
      <section aria-labelledby="negotiations">
        <h2 id="negotiations">{view==="chronology"?referenceText(lang).changes:t.negotiations}</h2>
        {snapshot.cadence&&<p className="seat-times">{DASHBOARD[lang].last}: {date(snapshot.cadence.lastSuccessfulAt)} · {DASHBOARD[lang].next}: {date(snapshot.cadence.nextCheckAt)}</p>}
        <p>{f.caution}</p>
        {hidden && (
          <p className="government-notice" role="status">
            {t.noClaims}
          </p>
        )}
        {!hidden &&view!=="chronology"&&
          p.proposals.map((proposal) => {
            const confirmed = proposal.decisions.filter(
                (d) => d.decision !== "undecided",
              ),
              byParty = new Map(proposal.decisions.map((d) => [d.partyId, d]));
            const undecided = Object.entries(
              snapshot.seatContext.pointSeats,
            ).filter(
              ([id, seats]) =>
                seats > 0 &&
                (!byParty.has(id) || byParty.get(id)?.decision === "undecided"),
            );
            return (
              <section key={proposal.id} className="proposal">
                <h3>
                  {f.target}: {proposal.person}
                </h3>
                <ProposalLedger seats={snapshot.seatContext.pointSeats} decisions={proposal.decisions} lang={lang}/>
                <h4>{t.confirmed}</h4>
                {confirmed.length ? (
                  <ul>
                    {confirmed.map((d) => (
                      <li key={d.partyId}>
                        {name(d.partyId)} · <strong>{f[d.decision]}</strong> ·{" "}
                        {snapshot.seatContext.pointSeats[d.partyId] ?? 0}{" "}
                        {t.seats}{" "}
                        {d.sourceEventIds.map((id) => (
                          <a key={id} href={`#event-${id}`}>
                            ↗<span className="sr-only">{t.source}</span>
                          </a>
                        ))}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>{t.noEvents}</p>
                )}
                <h4>{t.undecided}</h4>
                <p>
                  {undecided
                    .map(([id, seats]) => `${name(id)} (${seats})`)
                    .join(" · ") || "—"}
                </p>
              </section>
            );
          })}
        {!hidden &&view!=="chronology"&& p.clock && (
          <aside className="government-clock">
            <h3>{f.clock}</h3>
            {p.clock.holder && <p>{p.clock.holder}</p>}
            <dl>
              <dt>{f.anchor}</dt>
              <dd>
                <time dateTime={p.clock.anchorAt}>
                  {date(p.clock.anchorAt)}
                </time>
              </dd>
              <dt>{f.deadline}</dt>
              <dd>
                <time dateTime={p.clock.deadlineAt}>
                  {date(p.clock.deadlineAt)}
                </time>
              </dd>
            </dl>
            {p.clock.sourceEventIds.map((id) => (
              <a href={`#event-${id}`} key={id}>
                {t.source} ↗{" "}
              </a>
            ))}
          </aside>
        )}
        {events.length ? (
          <ol className="government-events">
            {(compact ? events.slice(0, 2) : events).map((event) => (
              <li id={`event-${event.id}`} key={event.id}>
                <h3>{f[event.templateKey]}</h3>
                <p>
                  {event.partyIds.map(name).join(" · ")}
                  {event.person && <> · {event.person}</>}
                  {event.proposalId && (
                    <>
                      {" "}
                      · {f.target}:{" "}
                      {p.proposals.find((p) => p.id === event.proposalId)
                        ?.person ??
                        event.person ??
                        t.undecided}
                    </>
                  )}
                  {event.positionScope && (
                    <>
                      {" "}
                      ·{" "}
                      {event.positionScope === "recommendation"
                        ? f.recommendationScope
                        : f[event.positionScope]}
                    </>
                  )}
                  {event.decision && <> · {f[event.decision]}</>}
                </p>
                <p>
                  {f.effective}:{" "}
                  <time dateTime={event.effectiveAt}>
                    {date(event.effectiveAt)}
                  </time>{" "}
                  · {t.published}: {date(event.publishedAt)}
                </p>
                {event.supersedes && <p>{t.corrected}</p>}
                <details>
                  <summary>{f.original}</summary>
                  <blockquote dir="auto">{event.evidenceQuote}</blockquote>
                </details>
                <ul>
                  {event.sources.map((source) => (
                    <li key={source.id}>
                      <a href={source.url}>
                        {source.publisher}: {source.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        ) : (
          !hidden && <p>{t.noEvents}</p>
        )}
      </section>
      {view!=="chronology"&&<CurrentParliament
        initial={snapshot.seatContext}
        lang={lang}
        names={names}
        scenarios={scenarios}
        showSeats={false}
        compact={compact}
      />}
      {!compact && (
        <section>
          <h2>{f.history}</h2>
          <ul>
            {snapshot.alternatives.map((a) => (
              <li key={a.revision}>
                <a
                  href={`${editionPath("/coalition-builder", lang)}?poll=current&context=${a.revision}`}
                >
                  {t[a.basis]} · {date(a.publishedAt)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <details>
        <summary>{t.notice}</summary>
        <ul>
          {snapshot.health.map((h) => (
            <li key={h.sourceId}>
              {snapshot.seatContext.sourceRefs.find((s) => s.id === h.sourceId)
                ?.publisher ?? h.authority.toUpperCase()}
              :{" "}
              {h.status === "healthy"
                ? t.current
                : h.status === "complete"
                  ? t.complete
                  : t.stale}{" "}
              · {t.checked}: {date(h.checkedAt)}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
