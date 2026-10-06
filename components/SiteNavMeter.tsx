"use client";
import Link from "next/link";
import SeatBar from "./SeatBar";
import { useCountSummary } from "./ResultsStrip";
import { type ExitMeter, type Meter, nightMeter } from "@/lib/nav-facts";
import { BLOC_SEAT_ORDER } from "@/lib/polls";
import { useLang } from "@/lib/i18n/lang";

/**
 * The masthead's thin seat meter: the 120 seats by bloc with the 61 tick and the Netanyahu bloc's figure
 * in words. The polling average until polls close; then the night's figure, from the same count summary
 * the strip under the masthead reads (an exit poll, then the early count, then the count).
 */
export default function SiteNavMeter({ average, exit, closed, pollsClose }: { average: Meter; exit: ExitMeter | null; closed: boolean; pollsClose: string }) {
  const summary = useCountSummary(pollsClose);
  // `average` arrives in the page's edition from its layout; the night's figure is worded here.
  const m = nightMeter(closed, summary, exit, useLang()) ?? average;
  return (
    <Link href={m.href} className={`mast-meter${m.hatch ? " early" : ""}`}>
      <span className="mm-text">{m.value && <b>{m.value}</b>} {m.text}</span>
      {m.seats && <SeatBar size="s" className="mm-bar" segments={BLOC_SEAT_ORDER.map((b) => ({ key: b, seats: m.seats![b] ?? 0, color: `var(--b-${b})` }))} />}
    </Link>
  );
}
