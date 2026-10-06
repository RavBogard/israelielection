"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./interactives.css";
import "./map.css";
import Link from "next/link";
import {partyColor,partyInk,blocColorStrip,PARTY_COLOR_FAMILIES,PARTY_COLOR_NOTE} from "@/lib/party-colors";
import {readPartyMapSelection,partyMapSelectionHref} from "@/lib/party-map-state";
import PageHead from "./PageHead";
import ProfileDetail from "./ProfileDetail";
import { averagePoll, blocLabel, mainPolls, parties } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { average, BLOC_ORDER, seatFigure } from "@/lib/polls";
import { squarify } from "@/lib/treemap";
import type { BlocId, Party } from "@/lib/types";

const averaged = parties
  .map((p) => ({ p, a: average(p.id, mainPolls) }))
  .filter((x): x is { p: Party; a: NonNullable<typeof x.a> } => x.a !== null);
/** Seats on the map: the average scaled to 120 (see averageAsPoll), as in the Coalition Builder. */
const seatsOf = (id: string) => averagePoll.results[id]?.seats ?? 0;
const avgOf = new Map(averaged.map(({ p }) => [p.id, seatsOf(p.id)]));
const blocSum = (b: BlocId) => Math.round(averaged.filter(({ p }) => p.bloc === b).reduce((s, { p }) => s + seatsOf(p.id), 0) * 10) / 10;
const offMap = parties.filter((p) => !avgOf.has(p.id) || seatsOf(p.id) === 0);
const fewerPolls = averaged.filter(({ a }) => a.n < mainPolls.length).map(({ p }) => p.name);

const GAP = 6, LBL = 22, LINE = 16;
/** Shorter names, longest first, for a bloc whose block is too narrow for its full label. */
const BLOC_SHORT: Record<BlocId, string[]> = { net: ["Netanyahu"], opp: ["Anti-Netanyahu bloc", "Anti-Netanyahu"], mid: ["Between"], arab: ["Joint List, Ra'am"] };
/** Text width in px, measured on a canvas in the page's own face; a rough 7.4px a character before the font is known. */
let ctx2d: CanvasRenderingContext2D | null = null;
function measure(t: string, px: number, family: string) {
  if (!ctx2d && typeof document !== "undefined") ctx2d = document.createElement("canvas").getContext("2d");
  if (!ctx2d || !family) return t.length * px * 0.57;
  ctx2d.font = `600 ${px}px ${family}`;
  return ctx2d.measureText(t).width;
}
/** Lines a phrase takes when wrapped at `room`, or Infinity if one word alone is too wide. */
function lines(t: string, room: number, px: number, family: string) {
  let n = 1, cur = "";
  for (const w of t.split(" ")) {
    if (measure(w, px, family) > room) return Infinity;
    const next = cur ? `${cur} ${w}` : w;
    if (measure(next, px, family) > room) { n++; cur = w; } else cur = next;
  }
  return n;
}
/**
 * Every bloc keeps a name: the longest that fits beside its total on one line; failing that, a name over the total on two
 * or three lines when the block is tall enough to spare them; failing that, the shortest name, cut with an ellipsis.
 */
function blocName(id: BlocId, label: string, total: string, room: number, height: number, family: string) {
  const names = [label, ...BLOC_SHORT[id]];
  const one = names.find((t) => measure(`${t} ${total}`, 13, family) <= room);
  if (one) return { name: one, extra: 0 };
  for (const t of names) {
    const n = lines(t, room, 13, family);
    if (n <= 2 && height - LBL - n * LINE >= 90) return { name: t, extra: n };
  }
  return { name: names.at(-1)!, extra: 0 };
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0, family: "" });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight, family: getComputedStyle(el).fontFamily }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

/** The method notes, folded under the map: bloc totals, how the average is made, what is left off, the colour key. */
function About() {
  return (
    <details className="pm-about">
      <summary>About this map</summary>
      <table className="btable">
        <tbody>
          {BLOC_ORDER.map((b) => (
            <tr key={b}>
              <td>
                <span className="sw" style={{ background: blocColorStrip(b), marginRight: 8, verticalAlign: -1 }} />
                {blocLabel[b]}
              </td>
              <td>{seatFigure(blocSum(b))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Each block&apos;s area is the list&apos;s coalition average, scaled to 120 seats, across {mainPolls.length} polls:{" "}
        {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}. <Link href="/polls#method">How the average is made</Link>.
      </p>
      <p>
        Bloc totals are our arithmetic: each party&apos;s average, added up by bloc.
        {fewerPolls.length > 0 &&
          ` ${fewerPolls.join(" and ")} use fewer polls because not every poll reported them separately, so totals add to about 120, not exactly 120.`}{" "}
        Each party&apos;s average is over the polls where it passed the threshold; one that passed in fewer than half counts 0. Because small lists sometimes miss the threshold, those averages can add to more than 120, so they are scaled down in proportion to 120.
      </p>
      <p>
        38 lists filed for the Oct 27 election (Central Elections Committee approval, Ynet, Sep 27, 2026). 20+ minor lists are not
        shown, including Israel First (Sharren Haskel) and the Haredi Public Party (Moti Leitner).
      </p>
      <p>
        Each profile covers who the party is, who votes for it, where it stands on six issues, key candidates, pledges, its surplus-vote
        partner, a quote, and its seats in each poll.
      </p>
      <p>{PARTY_COLOR_NOTE}</p>
      <details className="party-color-key"><summary>Distinct party shades and political families</summary><ul>{PARTY_COLOR_FAMILIES.map((family)=><li key={family.label}><b>{family.label}</b><div>{family.ids.map((id)=><span key={id}><span className="sw" style={{background:partyColor(id)}}/>{parties.find((p)=>p.id===id)?.name??id}</span>)}</div></li>)}</ul></details>
    </details>
  );
}

export default function PartyMap() {
  const [current, setCurrent] = useState<string | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const { w: W, h: H, family } = useSize(mapRef);

  useEffect(() => {
    const restore = () => setCurrent(readPartyMapSelection(new URLSearchParams(window.location.search),window.location.hash,parties.map((p)=>p.id)));
    restore(); window.addEventListener("popstate",restore); window.addEventListener("hashchange",restore);
    return () => {window.removeEventListener("popstate",restore);window.removeEventListener("hashchange",restore);};
  }, []);

  const select = (id: string) => {
    const next = current === id ? null : id;
    setCurrent(next);
    history.pushState(history.state,"",partyMapSelectionHref(new URLSearchParams(window.location.search),window.location.hash,next,parties.map((p)=>p.id)));
  };

  /** Closing the profile hands focus back to the cell or chip that opened it. */
  const close = () => {
    const id = current;
    if (!id) return;
    select(id);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`.pm [data-party="${id}"]`)?.focus());
  };

  useLayoutEffect(() => {
    panelRef.current?.scrollTo?.(0, 0);
    if(current && window.innerWidth<=1100){ const smooth=!matchMedia("(prefers-reduced-motion: reduce)").matches;requestAnimationFrame(()=>panelRef.current?.scrollIntoView({behavior:smooth?"smooth":"auto",block:"start"})); }
  }, [current]);

  // Keep the tooltip inside the viewport.
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || !tip) return;
    const r = el.getBoundingClientRect();
    el.style.left = `${Math.max(8, Math.min(tip.x + 14, window.innerWidth - r.width - 8))}px`;
    el.style.top = `${tip.y + 16}px`;
  }, [tip]);

  const cells: React.ReactNode[] = [];
  if (W && H) {
    // Squarify lays out largest first; ties keep the site's bloc order.
    const blocItems = BLOC_ORDER.map((b) => ({ id: b, v: blocSum(b) })).sort((a, b) => b.v - a.v);
    for (const br of squarify(blocItems, 0, 0, W, H)) {
      const bx = br.x + GAP / 2, by = br.y + GAP / 2, bw = br.w - GAP, bh = br.h - GAP;
      const label = blocLabel[br.id as BlocId];
      const total = seatFigure(br.v);
      const { name, extra } = blocName(br.id as BlocId, label, total, bw - 4, bh, family);
      const lbl = LBL + extra * LINE;
      cells.push(
        <div key={`b-${br.id}`} className={`blocname${extra ? " stack" : ""}`} style={{ left: bx + 2, top: by, width: bw - 4, height: lbl - 2 }} title={`${label} ${total}`}>
          {name !== label && <span className="sr-only">{label} </span>}
          <span className="bn" aria-hidden={name !== label || undefined}>{name}</span> <span className="bt">{total}</span>
        </div>
      );
      const ps = averaged
        .filter(({ p }) => p.bloc === br.id)
        .map(({ p }) => ({ id: p.id, v: seatsOf(p.id) }))
        .sort((a, b) => b.v - a.v);
      for (const r of squarify(ps, bx, by + lbl, bw, bh - lbl)) {
        const p = parties.find((q) => q.id === r.id)!;
        const cw = r.w - 3, ch = r.h - 3;
        let cls = "cell";
        if (cw < 110 || ch < 70) cls += " tiny";
        if (cw < 80) cls += " xs";
        if (ch < 120 || cw < 130) cls += " nold";
        if (cw < 230) cls += " nosm";
        const nmPx = cls.includes("tiny") || cls.includes("xs") ? 12 : Math.min(19, Math.max(13, (typeof window === "undefined" ? 1440 : window.innerWidth) * 0.0115));
        const room = cw - (cls.includes("tiny") ? 14 : 24);
        const fitsFlat = (t: string) => measure(t, nmPx, family) <= room - 32;
        const fitsStack = (t: string) => lines(t, room, nmPx, family) <= (ch >= 90 ? 3 : ch >= 70 ? 2 : 1);
        // The full name where it fits, else the short one; a short cell sets name and number on one line unless only
        // stacking them leaves room for a name at all.
        let flat = ch < 52, shown = p.name;
        if (flat && !fitsFlat(p.name)) {
          if (fitsFlat(p.short)) shown = p.short;
          else if (ch >= 44 && fitsStack(p.short)) { flat = false; shown = fitsStack(p.name) ? p.name : p.short; }
        } else if (!flat && !fitsStack(p.name) && fitsStack(p.short)) shown = p.short;
        if (flat) cls += " flat";
        cells.push(
          <button
            key={p.id}
            type="button"
            className={cls}
            aria-pressed={current === p.id}
            data-party={p.id}
            aria-label={`${p.name}, ${seatFigure(r.v)} seats, polling average`}
            onClick={() => select(p.id)}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return setTip(null);
              const seats = mainPolls.map((poll) => {
                const x = poll.results[p.id];
                return `${poll.pollster} ${shortDate(poll.published)}: ${x ? (x.belowThreshold || x.seats === 0 ? "below" : x.seats) : "n/a"}`;
              });
              setTip({ text: `${p.name}, ${seatFigure(r.v)} seats, polling average. ${seats.join(" / ")}`, x: e.clientX, y: e.clientY });
            }}
            style={{
              left: r.x + 1.5, top: r.y + 1.5, width: cw, height: ch,
              ["--fill" as string]: partyColor(p.id), ["--fill-ink" as string]: partyInk(p.id),
            }}
          >
            <span className="nm">{shown}</span>
            <span className="ld">{p.leader.split(" (")[0]}</span>
            <span className="av">
              {seatFigure(r.v)}
              <small>seats, polling average</small>
            </span>
          </button>
        );
      }
    }
  }

  const party = parties.find((p) => p.id === current);

  return (
    <div className="pm" onKeyDown={(e) => { if (e.key === "Escape" && current) { e.preventDefault(); close(); } }}>
      <PageHead title="The Party Map" standfirst="Every list, sized by its seats in the polling average. Tap one for its profile." />

      <div className={`layout${party ? " open" : ""}`}>
        <div className="mapcol">
          <div className={`map${party ? " has-sel" : ""}`} ref={mapRef} role="group" aria-label="Parties sized by average seats" onPointerLeave={() => setTip(null)}>
            {cells}
          </div>
          <div className="offmap">
            {offMap.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={current === p.id} data-party={p.id} onClick={() => select(p.id)}>
                <span className="sw" style={{ background: partyColor(p.id) }} />
                <b>{p.name}</b>
                <em>{p.status}</em>
              </button>
            ))}
          </div>
          <About />
        </div>
        {party && (
          <aside className="panel" ref={panelRef} aria-label={`${party.name} profile`}>
            <button type="button" className="party-close" onClick={close}>Close profile</button>
            <ProfileDetail party={party} />
          </aside>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{party ? `Showing the profile of ${party.name}` : ""}</p>
      {tip && (
        <div className="tip" ref={tipRef}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
