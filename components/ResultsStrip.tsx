"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CountSummary } from "@/app/api/count/route";

const IL = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jerusalem", hour: "numeric", minute: "2-digit" });
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
        if (res.ok && !stopped) setData((await res.json()) as CountSummary);
      } catch {
        // Keep the last good strip; try again next minute.
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
          The count so far
        </Link>
        <ul>
          {data.blocs.map((b) => (
            <li key={b.id}>
              <span className="sw" style={{ background: `var(--b-${b.id})` }} />
              {b.label} <b>{b.seats}</b>
            </li>
          ))}
        </ul>
        <span className="meta">
          {data.localities.toLocaleString("en-US")} localities counted{data.turnout !== null && <>, turnout {(data.turnout * 100).toFixed(1)}%</>}. Fetched{" "}
          {IL.format(when)} Israel time, {ET.format(when)}.
        </span>
      </div>
    </div>
  );
}
