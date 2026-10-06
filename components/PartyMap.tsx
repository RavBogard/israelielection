"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./interactives.css";
import "./map.css";
import Link from "next/link";
import {partyColor,partyInk,blocColorStrip,PARTY_COLOR_FAMILIES,PARTY_COLOR_NOTE} from "@/lib/party-colors";
import {readPartyMapSelection,partyMapSelectionHref} from "@/lib/party-map-state";
import ProfileDetail from "./ProfileDetail";
import SeatGrid from "./SeatGrid";
import { averagePoll, blocLabel, blocs, mainPolls, parties } from "@/lib/data";
import { fmt, shortDate } from "@/lib/format";
import { average } from "@/lib/polls";
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

const GAP = 6, LBL = 22;
/** Shorter names for a bloc whose block is too narrow for its full label. */
const BLOC_SHORT: Partial<Record<BlocId, string>> = { opp: "Anti-Netanyahu bloc" };
/** The longest bloc name that fits the block's width (about 7.4px a character at 13px); a block too narrow for any keeps only its total and its swatch, which the key below the map names. */
function blocName(id: BlocId, label: string, total: string, room: number) {
  const fits = (t: string) => (t.length + 1 + total.length) * 7.4 <= room;
  const name = [label, BLOC_SHORT[id]].find((t) => t && fits(t));
  return name ? `${name} ${total}` : total;
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

function Overview() {
  const order: BlocId[] = ["net", "mid", "opp", "arab"];
  const segments = order.flatMap((b) => averaged.filter(({p}) => p.bloc===b && seatsOf(p.id)>0).map(({p}) => ({id:p.id,seats:seatsOf(p.id),color:partyColor(p.id),label:p.name,href:`/parties?party=${p.id}`})));
  return (
    <>
      <h2 className="ov">Party shades, four bloc totals</h2>
      <SeatGrid variant="meter" segments={segments} labelRule />
      <table className="btable">
        <tbody>
          {blocs.map((b) => (
            <tr key={b.id}>
              <td>
                <span className="sw" style={{ background: blocColorStrip(b.id), marginRight: 8, verticalAlign: -1 }} />
                {b.label}
              </td>
              <td>{fmt(blocSum(b.id))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="src">
        Our arithmetic: each party&apos;s average across the {mainPolls.length} polls, added up by bloc.
        {fewerPolls.length > 0 &&
          ` ${fewerPolls.join(" and ")} use fewer polls because not every poll reported them separately, so totals add to about 120, not exactly 120.`}{" "}
        Each party&apos;s average is over the polls where it passed the threshold; one that passed in fewer than half counts 0. Because small lists sometimes miss the threshold, those averages can add to more than 120, so they are scaled down in proportion to 120.
      </p>
      <p className="hint">
        Tap any party block or chip for its profile: who they are, who votes for them, where they stand on six issues, key candidates,
        pledges, surplus-vote partner, a quote, and seats in each poll.
      </p>
    </>
  );
}

export default function PartyMap() {
  const [current, setCurrent] = useState<string | null>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const { w: W, h: H } = useSize(mapRef);

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
    const blocItems = (["net", "opp", "arab", "mid"] as BlocId[]).map((b) => ({ id: b, v: blocSum(b) })).sort((a, b) => b.v - a.v);
    for (const br of squarify(blocItems, 0, 0, W, H)) {
      const bx = br.x + GAP / 2, by = br.y + GAP / 2, bw = br.w - GAP, bh = br.h - GAP;
      const label = blocLabel[br.id as BlocId];
      const name = blocName(br.id as BlocId, label, fmt(br.v), bw - 4);
      cells.push(
        <div key={`b-${br.id}`} className="blocname" style={{ left: bx + 2, top: by, width: bw - 4 }} title={`${label} ${fmt(br.v)}`}>
          {name === fmt(br.v) && <><span className="sw" style={{ background: blocColorStrip(br.id), marginRight: 6, verticalAlign: -1 }} aria-hidden="true" /><span className="sr-only">{label} </span></>}
          {name}
        </div>
      );
      const ps = averaged
        .filter(({ p }) => p.bloc === br.id)
        .map(({ p }) => ({ id: p.id, v: seatsOf(p.id) }))
        .sort((a, b) => b.v - a.v);
      for (const r of squarify(ps, bx, by + LBL, bw, bh - LBL)) {
        const p = parties.find((q) => q.id === r.id)!;
        const cw = r.w - 3, ch = r.h - 3;
        let cls = "cell";
        if (cw < 110 || ch < 70) cls += " tiny";
        if (cw < 80) cls += " xs";
        if (ch < 120 || cw < 130) cls += " nold";
        if (cw < 180) cls += " nosm";
        if (ch < 52) cls += " flat";
        cells.push(
          <button
            key={p.id}
            type="button"
            className={cls}
            aria-pressed={current === p.id}
            aria-label={`${p.name}, average ${fmt(r.v)} seats`}
            onClick={() => select(p.id)}
            onPointerMove={(e) => {
              if (e.pointerType !== "mouse") return setTip(null);
              const seats = mainPolls.map((poll) => {
                const x = poll.results[p.id];
                return `${poll.pollster} ${shortDate(poll.published)}: ${x ? (x.belowThreshold ? "below" : x.seats) : "n/a"}`;
              });
              setTip({ text: `${p.name}, average ${fmt(r.v)}. ${seats.join(" / ")}`, x: e.clientX, y: e.clientY });
            }}
            style={{
              left: r.x + 1.5, top: r.y + 1.5, width: cw, height: ch,
              ["--fill" as string]: partyColor(p.id), ["--fill-ink" as string]: partyInk(p.id),
            }}
          >
            <span className="nm">{p.name}</span>
            <span className="ld">{p.leader.split(" (")[0]}</span>
            <span className="av">
              {fmt(r.v)}
              <small>normalized seats</small>
            </span>
          </button>
        );
      }
    }
  }

  const party = parties.find((p) => p.id === current);

  return (
    <div className="pm">
      <header className="ix-head">
        <div>
          <h1>The Party Map</h1>
          <p className="sub">Every list, sized by its seats in the polling average. Tap one for its profile.</p>
        </div>
      </header>

      <div className="layout">
        <div className="mapcol">
          <div className="map" ref={mapRef} role="group" aria-label="Parties sized by average seats" onPointerLeave={() => setTip(null)}>
            {cells}
          </div>
          <div className="offmap">
            {offMap.map((p) => (
              <button key={p.id} type="button" className="chip" aria-pressed={current === p.id} onClick={() => select(p.id)}>
                <span className="sw" style={{ background: partyColor(p.id) }} />
                <b>{p.name}</b>
                <em>{p.status}</em>
              </button>
            ))}
          </div>
          <div className="pm-about">
            <p>
              Each block&apos;s area is the list&apos;s coalition average, scaled to 120 seats, across {mainPolls.length} polls:{" "}
              {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}. <Link href="/polls#method">How the average is made</Link>.
            </p>
            <p>
              38 lists filed for the Oct 27 election (Central Elections Committee approval, Ynet, Sep 27, 2026). 20+ minor lists are not
              shown, including Israel First (Sharren Haskel) and the Haredi Public Party (Moti Leitner).
            </p>
            <p>{PARTY_COLOR_NOTE}</p>
            <details className="party-color-key"><summary>Distinct party shades and political families</summary><ul>{PARTY_COLOR_FAMILIES.map((family)=><li key={family.label}><b>{family.label}</b><div>{family.ids.map((id)=><span key={id}><span className="sw" style={{background:partyColor(id)}}/>{parties.find((p)=>p.id===id)?.name??id}</span>)}</div></li>)}</ul></details>
          </div>
        </div>
        <aside className="panel" ref={panelRef} aria-live="polite" aria-label={party?`${party.name} profile`:"Party Map overview"}>
          {party && <button type="button" className="party-overview" onClick={()=>select(party.id)}>Back to overview</button>}
          {party ? <ProfileDetail party={party} /> : <Overview />}
        </aside>
      </div>
      {tip && (
        <div className="tip" ref={tipRef}>
          {tip.text}
        </div>
      )}
    </div>
  );
}
