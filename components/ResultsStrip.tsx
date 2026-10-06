"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { nextCountSummary } from "@/lib/results-summary";
import type { CountSummary } from "@/app/api/count/route";
import { blocRank } from "@/lib/polls";
import type { BlocId } from "@/lib/types";

const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ET = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

/**
 * One line under the masthead on every page once polls close: seats by bloc from the count so
 * far, how much is counted, and when it was fetched. Polls the count summary every minute.
 */
export default function ResultsStrip({ pollsClose }: { pollsClose: string }) {
  const [data, setData] = useState<CountSummary | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const tick = async () => {
      if (Date.now() < Date.parse(pollsClose)) {
        timer = setTimeout(tick, Math.min(Date.parse(pollsClose) - Date.now(), 3_600_000));
        return;
      }
      try {
        const res = await fetch("/api/count", { cache: "no-store" });
        const incoming = res.ok ? await res.json() as CountSummary : null;
        if (!stopped) setData((previous) => nextCountSummary(previous, incoming, new Date().toISOString()));
      } catch {
        if (!stopped) setData((previous) => nextCountSummary(previous, null, new Date().toISOString()));
      }
      if (!stopped) timer = setTimeout(tick, 60_000);
    };
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [pollsClose]);

  if (!data || data.state !== "open") return null;
  const when = new Date(data.fetchedAt);
  return (
    <div className="live-strip" role="status" aria-live="polite">
      <div className="row">
        <Link href="/results" className="lead">
          {data.freshness === "stale" ? "Saved count (stale)" : "The count so far"}
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
