"use client";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { nextCountSummary } from "@/lib/results-summary";
import type { CountSummary } from "@/app/api/count/route";
import { blocRank } from "@/lib/polls";
import type { BlocId } from "@/lib/types";
import { useLang } from "@/lib/i18n/lang";
import chrome from "@/lib/i18n/chrome";
import type { Localized } from "@/lib/i18n/localize";

const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
/** Hebrew: day first, 24-hour, never the short month (STYLE.md). The Hebrew strip gives Israel time only. */
const IL_HE = new Intl.DateTimeFormat("he-IL", { timeZone: "Asia/Jerusalem", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

/**
 * One count summary per page, shared by this strip and the masthead's seat meter: nothing is fetched
 * before polls close; from then on /api/count is polled every minute while anything is subscribed.
 */
let summary: CountSummary | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined, running = false, gen = 0;
function start(pollsClose: string) {
  if (running) return;
  running = true;
  const mine = ++gen, live = () => running && mine === gen;
  const tick = async () => {
    if (!live()) return;
    if (Date.now() < Date.parse(pollsClose)) { timer = setTimeout(tick, Math.min(Date.parse(pollsClose) - Date.now(), 3_600_000)); return; }
    let incoming: CountSummary | null = null;
    try { const res = await fetch("/api/count", { cache: "no-store" }); incoming = res.ok ? await res.json() as CountSummary : null; } catch { incoming = null; }
    if (!live()) return;
    summary = nextCountSummary(summary, incoming, new Date().toISOString());
    listeners.forEach((l) => l());
    timer = setTimeout(tick, 60_000);
  };
  tick();
}
export function useCountSummary(pollsClose: string): CountSummary | null {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    start(pollsClose);
    return () => { listeners.delete(cb); if (!listeners.size) { running = false; gen++; if (timer) clearTimeout(timer); } };
  }, [pollsClose]);
  return useSyncExternalStore(subscribe, () => summary, () => null);
}

/**
 * One line under the masthead on every page once polls close: seats by bloc from the count so
 * far, how much is counted, and when it was fetched. Polls the count summary every minute.
 */
export default function ResultsStrip({ pollsClose, blocLabels }: { pollsClose: string; /** Hebrew edition: the bloc labels to show, from the overlay (English ones are marked lang="en"). */ blocLabels?: Record<string, Localized> }) {
  const data = useCountSummary(pollsClose);
  const lang = useLang();
  if (lang === "he") return <HebrewStrip data={data} labels={blocLabels ?? {}} />;
  if (data?.state === "error" && data.phase === "exit")
    return (
      <div className="live-strip" role="status" aria-live="polite">
        <div className="row">
          <Link href="/results" className="lead">Polls have closed</Link>
          <span>The channels&apos; exit polls are on the results page; the committee&apos;s count follows.</span>
        </div>
      </div>
    );
  if (!data || data.state !== "open") return null;
  const when = new Date(data.fetchedAt);
  return (
    <div className="live-strip" role="status" aria-live="polite">
      <div className="row">
        <Link href="/results" className="lead">
          {data.freshness === "stale" ? "Saved count (stale)" : data.phase === "early" ? "Early count" : "The count so far"}
        </Link>
        <ul>
          {[...data.blocs].sort((a, b) => blocRank(a.id as BlocId) - blocRank(b.id as BlocId)).map((b) => (
            <li key={b.id}>
              <span className="sw" style={{ background: `var(--b-${b.id})` }} />
              {b.label} <b>{b.seats}</b>
            </li>
          ))}
        </ul>
        <span className="meta">
          {data.localities.toLocaleString("en-US")} regular localities{data.turnout !== null && <>, turnout where counted {(data.turnout * 100).toFixed(1)}%</>}. Captured{" "}
          {IL.format(when)} Israel time, {ET.format(when)}. Source time {data.sourceUpdatedAt ? IL.format(new Date(data.sourceUpdatedAt)) : "not provided"}.
        </span>
      </div>
    </div>
  );
}

/** The same line in the Hebrew edition, linking to /he/results. */
function HebrewStrip({ data, labels }: { data: CountSummary | null; labels: Record<string, Localized> }) {
  const t = chrome.he.strip;
  if (data?.state === "error" && data.phase === "exit")
    return (
      <div className="live-strip" role="status" aria-live="polite">
        <div className="row">
          <Link href="/he/results" className="lead">{t.closed}</Link>
          <span>{t.closedNote}</span>
        </div>
      </div>
    );
  if (!data || data.state !== "open") return null;
  const when = new Date(data.fetchedAt);
  return (
    <div className="live-strip" role="status" aria-live="polite">
      <div className="row">
        <Link href="/he/results" className="lead">
          {data.freshness === "stale" ? t.stale : data.phase === "early" ? t.early : t.count}
        </Link>
        <ul>
          {[...data.blocs].sort((a, b) => blocRank(a.id as BlocId) - blocRank(b.id as BlocId)).map((b) => (
            <li key={b.id}>
              <span className="sw" style={{ background: `var(--b-${b.id})` }} />
              {labels[b.id] ? labels[b.id].lang === "he" ? labels[b.id].text : <span lang="en" dir="ltr">{labels[b.id].text}</span> : <span lang="en" dir="ltr">{b.label}</span>} <b>{b.seats}</b>
            </li>
          ))}
        </ul>
        <span className="meta">
          {t.localities(data.localities)}{data.turnout !== null && t.turnout((data.turnout * 100).toFixed(1))}. {t.captured} <bdi dir="ltr">{IL_HE.format(when)}</bdi> {t.israelTime}. {t.sourceTime}{" "}
          {data.sourceUpdatedAt ? <bdi dir="ltr">{IL_HE.format(new Date(data.sourceUpdatedAt))}</bdi> : t.notProvided}.
        </span>
      </div>
    </div>
  );
}
