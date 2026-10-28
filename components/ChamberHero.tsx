"use client";
import type { ReactNode } from "react";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { CHAMBER } from "@/lib/i18n/chamber";
import { NOW_SEATS } from "@/lib/i18n/now-seats";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import HOME from "@/lib/i18n/home";
import { blocText } from "@/lib/i18n/overlays";
import { listName } from "@/components/results/names";
import { blocs } from "@/lib/data";
import { blocOfList, outgoingBlocSeats } from "@/lib/outgoing-seats";
import { chamberLayout, seatParties, HALL_ORDER } from "@/lib/chamber";
import "./chamber.css";

/** The count's progress, read on the server with the page: share of the expected vote counted, envelopes still out. */
export type ChamberProgress = {
  counted: number | null;
  envelopesPending: number | null;
  blocIntervals?: Record<string, { lo: number; hi: number }>;
};

const MAJORITY = 61, TOTAL = 120;
const LAYOUT = chamberLayout(TOTAL);
const shade = (bloc: string, n: number) => (n ? `color-mix(in srgb, var(--b-${bloc}) 62%, var(--bg))` : `var(--b-${bloc})`);

/**
 * The home hero once the count drives the seats (Daniel, 2026-10-28, option C): the majority question, then the
 * 120 seats drawn as the plenum, the Netanyahu bloc on the right as in the hall, and each bloc's distance from 61.
 */
export default function ChamberHero({ initial, lang, news, progress }: { initial: SharedSeatContext; lang: Lang; news?: ReactNode; progress: ChamberProgress }) {
  const shared = useSeatContext(initial), context = shared.context ?? initial;
  const t = CHAMBER[lang], loc = locale(lang), n = (x: number) => x.toLocaleString(loc);
  const official = context.seatStatus === "official";
  const named = new Map(context.parties.map((p) => [p.id, p]));
  const lists = Object.entries(context.pointSeats)
    .filter(([, seats]) => seats > 0)
    .map(([id, seats]) => ({ id, seats, bloc: named.get(id)?.bloc ?? blocOfList[id] ?? "other" }));
  const rows = HALL_ORDER.slice().reverse()
    .map((id) => ({ id, seats: lists.filter((l) => l.bloc === id).reduce((a, l) => a + l.seats, 0) }))
    .filter((b) => b.seats > 0 && b.id !== "other");
  const label = (id: string) => { const b = blocs.find((x) => x.id === id); return b ? blocText(b, lang).text : id; };
  const partyLabel = (id: string) => listName({ id, name: named.get(id)?.label ?? id }, lang).text;
  const leader = rows.find((b) => b.seats >= MAJORITY && b.id !== "arab");
  const placed = seatParties(LAYOUT, lists);
  const pct = progress.counted != null ? `${Math.round(progress.counted * 100).toLocaleString(loc)}%` : null;
  const env = !official && progress.envelopesPending ? n(Math.round(progress.envelopesPending / 10000) * 10000) : null;
  const summary = rows.map((b) => `${label(b.id)} ${n(b.seats)}`).join(", ");
  const h = HOME[lang].hero;
  return (
    <section className="chamber-hero" aria-labelledby="hero-h" data-testid="chamber-hero">
      <div className="ch-intro">
        {(official || pct) && (
          <p className="ch-status">
            {!official && progress.counted != null && <span className="ch-meter" aria-hidden="true"><i style={{ inlineSize: `${Math.min(1, progress.counted) * 100}%` }} /></span>}
            {official ? t.official : t.counted(pct!, !!env)}
          </p>
        )}
        <h1 id="hero-h">{leader ? t.hasMajority(label(leader.id), n(leader.seats)) : t.noMajority(n(MAJORITY))}</h1>
        <p className="ch-dek">{official ? t.dekOfficial(n(MAJORITY), n(TOTAL)) : t.dekCount(n(MAJORITY), n(TOTAL), env)}</p>
      </div>
      <figure className="ch-chart">
        <svg viewBox="0 -30 620 370" role="img" aria-label={t.aria(n(TOTAL), summary)}>
          {placed.map((s, i) => (
            <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(1)} style={{ fill: shade(s.bloc, s.shade) }}>
              <title>{partyLabel(s.party)}</title>
            </circle>
          ))}
          <line x1="310" x2="310" y1="-8" y2="220" className="ch-mid" />
          <text x="310" y="-14" textAnchor="middle" className="ch-mid-label">{t.centre(n(MAJORITY))}</text>
          <text x="310" y="284" textAnchor="middle" className="ch-total">{n(TOTAL)}</text>
          <text x="310" y="308" textAnchor="middle" className="ch-total-sub">{t.seats}</text>
        </svg>
        <figcaption>{t.note}</figcaption>
      </figure>
      <div className="ch-side">
        <ul className="ch-blocs">
          {rows.map((b) => {
            const range = official ? null : progress.blocIntervals?.[b.id];
            const gap = MAJORITY - b.seats;
            return (
              <li key={b.id} data-bloc={b.id}>
                <span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />
                <span className="ch-name">{label(b.id)}</span>
                <b className="ch-seats">{n(b.seats)}</b>
                <span className="ch-meta">
                  {b.id !== "arab" && b.id !== "mid" && <span className="ch-short">{gap > 0 ? t.short(n(gap), n(MAJORITY)) : t.majority}</span>}
                  {range && range.lo !== range.hi && <span>{t.range(n(range.lo), n(range.hi))}</span>}
                  {outgoingBlocSeats[b.id] !== undefined && <span>{NOW_SEATS[lang].chip(outgoingBlocSeats[b.id])}</span>}
                </span>
                <span className="ch-lists">
                  {lists.filter((l) => l.bloc === b.id).sort((x, y) => y.seats - x.seats).map((l) => `${partyLabel(l.id)} ${n(l.seats)}`).join(" · ")}
                </span>
              </li>
            );
          })}
        </ul>
        {news}
        <p className="ch-links">
          <a href={editionPath("/results", lang) ?? "/results"}>{t.results}</a>
          <a href={editionPath("/coalition-builder", lang) ?? "/coalition-builder"}>{h.builder}</a>
          <a href={editionPath("/government", lang) ?? "/government"}>{LIFECYCLE[lang].negotiations}</a>
        </p>
      </div>
    </section>
  );
}
