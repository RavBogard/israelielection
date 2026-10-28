"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useSeatContext } from "./seat-context/SeatContextProvider";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { CHAMBER } from "@/lib/i18n/chamber";
import { NOW_SEATS } from "@/lib/i18n/now-seats";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import { blocText } from "@/lib/i18n/overlays";
import { listName } from "@/components/results/names";
import { blocs } from "@/lib/data";
import { blocOfList, outgoingBlocSeats, outgoingSeats } from "@/lib/outgoing-seats";
import { chamberLayout, seatParties, shadeOf, HALL_ORDER } from "@/lib/chamber";
import "./chamber.css";

/** The count's progress, read on the server with the page: share of the expected vote counted, envelopes still out. */
export type ChamberProgress = {
  counted: number | null;
  envelopesPending: number | null;
  blocIntervals?: Record<string, { lo: number; hi: number }>;
};

const MAJORITY = 61, TOTAL = 120;
const LAYOUT = chamberLayout(TOTAL);
/** A list's step on its bloc's ramp: the bloc colour mixed toward the paper (lib/chamber.ts shadeOf). */
const tone = (bloc: string, shade: number) => (shade >= 100 ? `var(--b-${bloc})` : `color-mix(in srgb, var(--b-${bloc}) ${shade}%, var(--ch-mix))`);
/** The opening sweep: one pass across the hall from right to left, a beat as each bloc completes. */
const LEAD = 350, PER = 19, BEAT = 520, SEEN = "ch-intro-seen";
/**
 * Runs while the HTML parses, before first paint: readers who will see the sweep get blank seats from the start, so the
 * full chamber never flashes first. The headline and the bloc list stay in place throughout (Daniel, 2026-10-28). If the component never takes over, the
 * timeout restores the resting state.
 */
const PRIME = `(function(s){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("${SEEN}"))return;s.dataset.intro="pending";window.__chIntro=setTimeout(function(){delete s.dataset.intro},6000)}catch(e){}})(document.currentScript.parentElement)`;

type Selection = { bloc: string | null; list: string | null };

/**
 * The home hero once the count drives the seats (Daniel, 2026-10-28, option C): the majority question, then the
 * 120 seats drawn as the plenum, the Netanyahu bloc on the right as in the hall, and each bloc's distance from 61.
 * Readers explore it: a bloc opens its lists, a list opens its card (Daniel, 2026-10-28, interactive hero).
 */
export default function ChamberHero({ initial, lang, news, progress }: { initial: SharedSeatContext; lang: Lang; news?: ReactNode; progress: ChamberProgress }) {
  const shared = useSeatContext(initial), context = shared.context ?? initial;
  const t = CHAMBER[lang], loc = locale(lang), n = (x: number) => x.toLocaleString(loc);
  const rtl = lang === "he" || lang === "ar" || lang === "fa";
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
  const blocLists = (bloc: string) => lists.filter((l) => l.bloc === bloc).sort((x, y) => y.seats - x.seats || x.id.localeCompare(y.id));
  const shadeOfList = (id: string) => { const l = lists.find((x) => x.id === id)!; const mine = blocLists(l.bloc); return shadeOf(mine.findIndex((x) => x.id === id), mine.length); };
  const pct = progress.counted != null ? `${Math.round(progress.counted * 100).toLocaleString(loc)}%` : null;
  const env = !official && progress.envelopesPending ? n(Math.round(progress.envelopesPending / 10000) * 10000) : null;
  const summary = rows.map((b) => `${label(b.id)} ${n(b.seats)}`).join(", ");
  // Isolated left to right so the sign stays with its number in Hebrew, Arabic and Persian sentences.
  const signed = (d: number) => { const s = `${d > 0 ? "+" : d < 0 ? "−" : "±"}${n(Math.abs(d))}`; return rtl ? `⁦${s}⁩` : s; };
  const href = (path: string) => editionPath(path, lang) ?? path;

  const [sel, setSel] = useState<Selection>({ bloc: null, list: null });
  const [intro, setIntro] = useState<{ on: boolean; filled: number; tally: string | null }>({ on: false, filled: TOTAL, tally: null });
  const root = useRef<HTMLElement>(null), frame = useRef(0);

  // Right to left across the hall: seat i (sorted left to right) fills at times[TOTAL - 1 - i]; a beat between blocs.
  const sweep = () => {
    const events: { at: number; filled: number; tally: string }[] = [];
    let at = LEAD, k = 0, prev: string | null = null;
    const done = (bloc: string) => { const seats = rows.find((r) => r.id === bloc)?.seats ?? 0; return bloc === "arab" || bloc === "mid" ? t.tally(label(bloc), n(seats)) : t.tallyShort(label(bloc), n(seats), n(Math.max(0, MAJORITY - seats)), n(MAJORITY)); };
    [...placed].reverse().forEach((s, j) => {
      if (prev && s.bloc !== prev) { events.push({ at, filled: j, tally: done(prev) }); at += BEAT; k = 0; }
      k += 1; events.push({ at, filled: j + 1, tally: t.tally(label(s.bloc), n(k)) }); at += PER; prev = s.bloc;
    });
    if (prev) events.push({ at, filled: placed.length, tally: done(prev) });
    return { events, end: at + BEAT };
  };
  const finish = () => {
    cancelAnimationFrame(frame.current);
    if (root.current) delete root.current.dataset.intro;
    setIntro({ on: false, filled: TOTAL, tally: null });
  };
  useEffect(() => {
    const el = root.current;
    if (!el || el.dataset.intro !== "pending") return;
    clearTimeout((window as unknown as { __chIntro?: number }).__chIntro);
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      try { sessionStorage.setItem(SEEN, "1"); } catch {}
      const { events, end } = sweep();
      delete el.dataset.intro;
      const start = performance.now();
      const tick = (now: number) => {
        const at = now - start;
        if (at >= end) { finish(); return; }
        let i = 0; while (i + 1 < events.length && events[i + 1].at <= at) i++;
        const e = events[i].at <= at ? events[i] : null;
        setIntro({ on: true, filled: e?.filled ?? 0, tally: e?.tally ?? null });
        frame.current = requestAnimationFrame(tick);
      };
      setIntro({ on: true, filled: 0, tally: null });
      frame.current = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el.querySelector("svg") ?? el);
    return () => { io.disconnect(); cancelAnimationFrame(frame.current); };
    // Once per mount; the sweep reads the first render's seats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (next: Selection) => { if (intro.on || root.current?.dataset.intro) finish(); setSel(next); };
  const seatPick = (id: string, bloc: string) => (sel.bloc === bloc ? choose({ bloc, list: sel.list === id ? null : id }) : choose({ bloc, list: null }));
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && sel.bloc) choose({ bloc: sel.list ? sel.bloc : null, list: null }); };
  const filledFrom = TOTAL - intro.filled;
  const builder = sel.bloc ? `/coalition-builder?with=${blocLists(sel.bloc).map((l) => l.id).join(",")}` : "/coalition-builder";

  const panel = () => {
    if (!sel.bloc) return <p className="ch-prompt">{t.prompt}</p>;
    const mine = blocLists(sel.bloc);
    if (!sel.list) return (
      <>
        <h2>{label(sel.bloc)}</h2>
        <ul className="ch-panel-lists">
          {mine.map((l) => {
            const was = outgoingSeats(l.id);
            return (
              <li key={l.id}>
                <button type="button" className="ch-lrow" data-list={l.id} onClick={() => choose({ bloc: sel.bloc, list: l.id })}>
                  <span className="ch-dot" style={{ background: tone(l.bloc, shadeOfList(l.id)) }} aria-hidden="true" />
                  <span className="ch-lname">{partyLabel(l.id)}</span>
                  <b className="ch-lseats">{n(l.seats)}</b>
                  <span className="ch-ldelta">{was == null ? null : was === 0 ? t.newList : t.vsLast(signed(l.seats - was))}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="ch-back" onClick={() => choose({ bloc: null, list: null })}>{t.allBlocs}</button>
      </>
    );
    const l = lists.find((x) => x.id === sel.list)!, was = outgoingSeats(l.id), iv = context.uncertainty?.partyIntervals?.[l.id];
    const color = tone(l.bloc, shadeOfList(l.id)), scale = Math.max(40, l.seats, was ?? 0);
    return (
      <div className="ch-card" data-testid="chamber-list-card">
        <h2>{partyLabel(l.id)}</h2>
        <p className="ch-big">{n(l.seats)}<small>{official ? t.inOfficial : t.inEstimate}</small></p>
        <dl>
          {!official && iv && <><dt>{t.rangeLabel}</dt><dd>{iv.lo === iv.hi ? t.settled(n(iv.lo)) : `${n(iv.lo)}–${n(iv.hi)}`}</dd></>}
          {was != null && (
            <>
              <dt>{t.lastLabel}</dt>
              <dd className="ch-was">
                {was === 0 ? t.didNotSit : n(was)}
                {was > 0 && (
                  <>
                    <svg viewBox="0 0 120 14" aria-hidden="true"><rect x="0" y="5" width="120" height="4" style={{ fill: "var(--cell)" }} /><rect x="0" y="3" width={(l.seats / scale) * 120} height="8" style={{ fill: color }} /><rect x={Math.min(118, (was / scale) * 120) - 1} y="0" width="2" height="14" style={{ fill: "var(--ink)" }} /></svg>
                    <span>{signed(l.seats - was)}</span>
                  </>
                )}
              </dd>
            </>
          )}
          <dt>{t.blocLabel}</dt><dd>{label(l.bloc)}</dd>
        </dl>
        {named.get(l.id)?.profiled !== false && <p className="ch-links"><a href={href(`/parties/${l.id}`)}>{t.profile(partyLabel(l.id))}</a></p>}
        <button type="button" className="ch-back" onClick={() => choose({ bloc: sel.bloc, list: null })}>{t.backToBloc}</button>
      </div>
    );
  };

  return (
    <section ref={root} className={`chamber-hero${intro.on ? " is-intro" : ""}`} aria-labelledby="hero-h" data-testid="chamber-hero" onKeyDown={onKey} onPointerDown={() => (intro.on ? finish() : undefined)} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: PRIME }} />
      {news && <div className="ch-news">{news}</div>}
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
        <svg viewBox="0 -30 620 370" role="group" aria-label={t.aria(n(TOTAL), summary)} className={sel.bloc ? "dim" : undefined}>
          {lists.map((l) => (
            <g key={l.id} role="button" tabIndex={0} data-list={l.id} aria-pressed={sel.list === l.id} aria-label={t.listAria(partyLabel(l.id), n(l.seats))}
              onClick={() => seatPick(l.id, l.bloc)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seatPick(l.id, l.bloc); } }}>
              {placed.map((s, i) => s.party !== l.id ? null : (
                <circle key={i} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(1)}
                  className={`ch-seat${(sel.list ? s.party === sel.list : s.bloc === sel.bloc) ? " on" : ""}`}
                  style={{ fill: intro.on && i < filledFrom ? "var(--cell)" : tone(s.bloc, s.shade) }}>
                  <title>{partyLabel(s.party)}</title>
                </circle>
              ))}
            </g>
          ))}
          <line x1="310" x2="310" y1="-8" y2="220" className="ch-mid" />
          <text x="310" y="-14" textAnchor="middle" className="ch-mid-label">{t.centre(n(MAJORITY))}</text>
          <text x="310" y="284" textAnchor="middle" className="ch-total">{n(TOTAL)}</text>
          <text x="310" y="308" textAnchor="middle" className="ch-total-sub">{t.seats}</text>
        </svg>
        <p className="ch-tally" aria-hidden="true">{intro.tally}</p>
        <p className="ch-hint">{t.hint}</p>
        <figcaption>{t.note}</figcaption>
      </figure>
      <div className="ch-side">
        <ul className="ch-blocs">
          {rows.map((b) => {
            const range = official ? null : progress.blocIntervals?.[b.id];
            const gap = MAJORITY - b.seats;
            return (
              <li key={b.id} data-bloc={b.id}>
                <button type="button" className="ch-bloc" aria-pressed={sel.bloc === b.id} onClick={() => choose({ bloc: sel.bloc === b.id && !sel.list ? null : b.id, list: null })}>
                  <span className="sw" style={{ background: `var(--b-${b.id})` }} aria-hidden="true" />
                  <span className="ch-name">{label(b.id)}</span>
                  <b className="ch-seats">{n(b.seats)}</b>
                  <span className="ch-meta">
                    {b.id !== "arab" && b.id !== "mid" && <span className="ch-short">{gap > 0 ? t.short(n(gap), n(MAJORITY)) : t.majority}</span>}
                    {range && range.lo !== range.hi && <span>{t.range(n(range.lo), n(range.hi))}</span>}
                    {outgoingBlocSeats[b.id] !== undefined && <span>{NOW_SEATS[lang].chip(outgoingBlocSeats[b.id])}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="ch-panel" aria-live="polite">{panel()}</div>
        <p className="ch-links">
          <a href={href("/results")}>{t.results}</a>
          <a href={href(builder)}>{t.tryCoalition}</a>
          <a href={href("/government")}>{LIFECYCLE[lang].negotiations}</a>
        </p>
      </div>
    </section>
  );
}
