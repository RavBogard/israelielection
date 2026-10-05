"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import "./interactives.css";
import "./map.css";
import ProfileDetail from "./ProfileDetail";
import { blocLabel, blocs, mainPolls, otherPolls, parties } from "@/lib/data";
import { fmt, shortDate } from "@/lib/format";
import { average } from "@/lib/polls";
import { squarify } from "@/lib/treemap";
import type { BlocId, Party } from "@/lib/types";

const averaged = parties
  .map((p) => ({ p, a: average(p.id, mainPolls) }))
  .filter((x): x is { p: Party; a: NonNullable<typeof x.a> } => x.a !== null);
const avgOf = new Map(averaged.map(({ p, a }) => [p.id, a.avg]));
const blocSum = (b: BlocId) => averaged.filter(({ p }) => p.bloc === b).reduce((s, { a }) => s + a.avg, 0);
const offMap = parties.filter((p) => !avgOf.has(p.id));
const fewerPolls = averaged.filter(({ a }) => a.n < mainPolls.length).map(({ p }) => p.name);

const GAP = 6, LBL = 22;

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
  return (
    <>
      <p className="lbl">Average seats by bloc</p>
      <h2 className="ov">Four blocs, 120 seats</h2>
      <table className="btable">
        <tbody>
          {blocs.map((b) => (
            <tr key={b.id}>
              <td>
                <span className="sw" style={{ background: `var(--b-${b.id})`, marginRight: 8, verticalAlign: -2 }} />
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
        {otherPolls.map((p) => p.pollster).join(", ")} is shown in each party&apos;s panel but not averaged.
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
    const h = window.location.hash.slice(1);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore after hydration
    if (parties.some((p) => p.id === h)) setCurrent(h);
  }, []);

  const select = (id: string) => {
    const next = current === id ? null : id;
    setCurrent(next);
    history.replaceState(null, "", next ? `#${next}` : window.location.pathname + window.location.search);
    if (next && window.innerWidth <= 1100) {
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }));
    }
  };

  useLayoutEffect(() => {
    panelRef.current?.scrollTo?.(0, 0);
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
      cells.push(
        <div key={`b-${br.id}`} className="blocname" style={{ left: bx + 2, top: by, width: bw - 4 }}>
          {bw < 230 ? label.split(" ")[0] : label} · {fmt(br.v)}
        </div>
      );
      const ps = averaged
        .filter(({ p }) => p.bloc === br.id)
        .map(({ p, a }) => ({ id: p.id, v: a.avg }))
        .sort((a, b) => b.v - a.v);
      for (const r of squarify(ps, bx, by + LBL, bw, bh - LBL)) {
        const p = parties.find((q) => q.id === r.id)!;
        const cw = r.w - 3, ch = r.h - 3;
        let cls = "cell";
        if (cw < 110 || ch < 70) cls += " tiny";
        if (cw < 80) cls += " xs";
        if (ch < 120 || cw < 130) cls += " nold";
        if (cw < 180) cls += " nosm";
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
              const seats = [...mainPolls, ...otherPolls].map((poll) => {
                const x = poll.results[p.id];
                return `${poll.pollster} ${shortDate(poll.published)}: ${x ? (x.belowThreshold ? "below" : x.seats) : "n/a"}`;
              });
              setTip({ text: `${p.name} · avg ${fmt(r.v)} · ${seats.join(" / ")}`, x: e.clientX, y: e.clientY });
            }}
            style={{
              left: r.x + 1.5, top: r.y + 1.5, width: cw, height: ch,
              ["--fill" as string]: `var(--b-${p.bloc})`, ["--fill-ink" as string]: `var(--b-${p.bloc}-ink)`,
            }}
          >
            <span className="nm">{p.name}</span>
            <span className="ld">{p.leader.split(" (")[0]}</span>
            <span className="av">
              {fmt(r.v)}
              <small>avg seats</small>
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
          <p className="sub">
            Each block&apos;s area is the party&apos;s average seat count across {mainPolls.length} polls (
            {mainPolls.map((p) => `${p.pollster} ${shortDate(p.published)}`).join(", ")}). Tap a party for who they are, who votes for
            them, where they stand, and their seat numbers including {otherPolls.map((p) => p.pollster).join(", ")}.
          </p>
        </div>
        <div className="legend">
          {blocs.map((b) => (
            <span key={b.id}>
              <span className="sw" style={{ background: `var(--b-${b.id})` }} />
              {b.label}
            </span>
          ))}
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
                <span className="sw" style={{ background: `var(--b-${p.bloc})` }} />
                <b>{p.name}</b>
                <em>{p.status}</em>
              </button>
            ))}
          </div>
          <p className="minor">
            38 lists filed for the Oct 27 election (Central Elections Committee approval, Ynet, Sep 27, 2026). 20+ minor lists are not
            shown, including Israel First (Sharren Haskel) and the Haredi Public Party (Moti Leitner).
          </p>
        </div>
        <aside className="panel" ref={panelRef} aria-live="polite">
          {party ? <ProfileDetail party={party} linkToPage /> : <Overview />}
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
