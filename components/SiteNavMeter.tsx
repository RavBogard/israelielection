"use client";
import Link from "next/link";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import { parties } from "@/lib/data";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { editionPath } from "@/lib/i18n";
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
  const { context, refreshFailed } = useSeatContext();
  const summary = useCountSummary(pollsClose,!context);
  const lang = useLang();
  // `average` arrives in the page's edition from its layout; the night's figure is worded here.
  const m = nightMeter(closed, summary, exit, lang) ?? average;
  if(!context&&refreshFailed)return <Link href={editionPath("/results",lang)??"/results"} className="mast-meter"><span className="mm-text">{LIFECYCLE[lang].notice}: {LIFECYCLE[lang].stale}</span></Link>;
  if (context) {
    const t = LIFECYCLE[lang];
    const known = new Set(parties.map(p => p.id));
    const segments: {key:string;seats:number;color:string}[] = BLOC_SEAT_ORDER.map(b => ({ key:b, seats:parties.filter(p => p.bloc === b).reduce((n,p) => n + (context.pointSeats[p.id] ?? 0),0), color:`var(--b-${b})` }));
    const unknown = Object.entries(context.pointSeats).filter(([id]) => !known.has(id)).reduce((n,[,seats]) => n+seats,0);
    if (unknown) segments.push({key:"unclassified",seats:unknown,color:"var(--ink-3)"});
    return <Link href={editionPath("/results",lang) ?? "/results"} className="mast-meter" data-seat-revision={context.revision}><span className="mm-text">{t[context.basis]} · {t[context.seatStatus]} · {refreshFailed ? t.stale : t[context.freshness.status]}</span><SeatBar size="s" className="mm-bar" segments={segments} /></Link>;
  }
  return (
    <Link href={m.href} className={`mast-meter${m.hatch ? " early" : ""}`}>
      <span className="mm-text">{m.value && <b>{m.value}</b>} {m.text}</span>
      {m.seats && <SeatBar size="s" className="mm-bar" segments={BLOC_SEAT_ORDER.map((b) => ({ key: b, seats: m.seats![b] ?? 0, color: `var(--b-${b})` }))} />}
    </Link>
  );
}
