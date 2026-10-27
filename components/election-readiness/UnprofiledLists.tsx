"use client";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import type { Lang } from "@/lib/i18n";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { readiness } from "@/lib/i18n/election-readiness";
import { useSeatContext } from "../seat-context/SeatContextProvider";

export default function UnprofiledLists({ initial, knownIds, lang = "en" }: { initial?: SharedSeatContext | null; knownIds: string[]; lang?: Lang }) {
  const { context } = useSeatContext(initial);
  const lists = context && Object.entries(context.pointSeats).filter(([id, seats]) => seats > 0 && !knownIds.includes(id));
  if (!lists?.length || !context) return null;
  const t = readiness(lang);
  return <section className="election-record"><h2>{t.unprofiled}</h2><p>{t.unknownPositions}</p><ul>{lists.map(([id, seats]) => <li key={id}><bdi>{context.parties.find(p => p.id === id)?.label ?? id}</bdi>: {seats} {LIFECYCLE[lang].seats}. {LIFECYCLE[lang][context.seatStatus]}.</li>)}</ul></section>;
}
