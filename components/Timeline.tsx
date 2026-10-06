"use client";

import { useRef, useState } from "react";
import "./timeline.css";
import { partyColor, partyInk } from "@/lib/party-colors";
import { electionAt, eventAt, governmentAt, labelOf, longDate, monthOf, type Timeline as Data } from "@/lib/timeline";

const ORD = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const KIND: Record<string, string> = { war: "War and security", peace: "Peace and diplomacy", politics: "Politics", law: "Law and courts", society: "Society" };
const surname = (pm: string) => pm.split(" ").slice(-1)[0];
/** A prime minister's party drawn in the colour of the 2026 list that carries it on; Kadima has none. */
const HEIR: Record<string, string | null> = { Likud: "likud", Alignment: "dem", Labor: "dem", "One Israel (Labor)": "dem", "Likud (Kadima from November 2005)": "likud", Kadima: null, Yamina: "byachad", "Yesh Atid": "byachad" };

/**
 * The scrubbable timeline: drag along the track (or use the slider, or step from event to
 * event) and the panel shows who governed, which Knesset sat, and what had just happened.
 */
export default function Timeline({ data, electionDay }: { data: Data; electionDay: string }) {
  const start = monthOf(data.elections[0].date);
  const end = monthOf(electionDay);
  const span = end - start;
  // The month on the scale, and the event picked by a click or a step (several can share a month).
  const [month, setMonthRaw] = useState(start);
  const [pick, setPick] = useState<number | null>(null);
  const setMonth = (m: number) => {
    setMonthRaw(m);
    setPick(null);
  };
  const goTo = (i: number) => {
    setMonthRaw(monthOf(data.events[i].date));
    setPick(i);
  };
  const track = useRef<HTMLDivElement>(null);
  const pct = (m: number) => `${((Math.max(start, Math.min(end, m)) - start) / span) * 100}%`;

  const gov = governmentAt(data.governments, month);
  const el = electionAt(data.elections, month);
  const ei = pick ?? eventAt(data.events, month);
  const ev = ei >= 0 ? data.events[ei] : undefined;
  const { year, month: mName } = labelOf(month);

  const fromPointer = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    setMonth(start + Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * span));
  };

  const decades = [];
  for (let y = 1980; y <= 2020; y += 10) decades.push(y);

  return (
    <div className="tl">
      <div
        className="tl-track"
        ref={track}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) fromPointer(e.clientX);
        }}
      >
        <div className="tl-row tl-evs" aria-label="Events">
          {data.events.map((e, i) => (
            <button
              key={i}
              type="button"
              className={i === ei ? "on" : undefined}
              style={{ left: pct(monthOf(e.date)) }}
              title={`${longDate(e.date)}: ${e.title}`}
              aria-label={`${longDate(e.date)}: ${e.title}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="tl-row tl-els" aria-hidden="true">
          {data.elections.map((e) => (
            <span key={e.date} className={e === el ? "on" : undefined} style={{ left: pct(monthOf(e.date)) }} />
          ))}
          <span className="next" style={{ left: pct(end) }} />
        </div>
        <div className="tl-row tl-pms" aria-hidden="true">
          {data.governments.map((g) => {
            const from = monthOf(g.from);
            const to = g.to ? monthOf(g.to) : end;
            const w = ((to - from) / end) * 100;
            return (
              <span key={g.from} className={g === gov ? "on" : undefined} style={{ left: pct(from), width: `${w}%`, background: HEIR[g.party] ? partyColor(HEIR[g.party]!) : "var(--ink-2)", color: HEIR[g.party] ? partyInk(HEIR[g.party]!) : "var(--bg)" }}>
                {w > 5.5 ? surname(g.pm) : ""}
              </span>
            );
          })}
        </div>
        <div className="tl-axis" aria-hidden="true">
          {decades.map((y) => (
            <span key={y} style={{ left: pct((y - 1977) * 12) }}>
              {y}
            </span>
          ))}
        </div>
        <div className="tl-cursor" style={{ left: pct(month) }} aria-hidden="true" />
      </div>
      <p className="tl-key" aria-hidden="true">
        <span>
          <i className="k-ev" /> Event
        </span>
        <span>
          <i className="k-el" /> Knesset election
        </span>
        <span>
          <i className="k-pm" /> Prime minister&apos;s term, in the colour of the 2026 list that carries the party on (Kadima, grey, has none)
        </span>
      </p>

      <div className="tl-controls">
        <button type="button" disabled={ei <= 0} onClick={() => goTo(ei - 1)}>
          Previous event
        </button>
        <label>
          <span className="sr">Month</span>
          <input
            type="range"
            min={start}
            max={end}
            value={month}
            aria-valuetext={`${mName} ${year}`}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </label>
        <button type="button" disabled={ei >= data.events.length - 1} onClick={() => goTo(ei + 1)}>
          Next event
        </button>
      </div>
      <div className="tl-panel" aria-live="polite">
        <p className="tl-when">
          {mName} {year}
        </p>
        <dl className="tl-facts">
          <div>
            <dt>Prime minister</dt>
            <dd>{gov ? `${gov.pm} (${gov.party}), from ${longDate(gov.from)}` : "The new government was not yet sworn in."}</dd>
          </div>
          <div>
            <dt>Knesset</dt>
            <dd>
              {el && (
                <>
                  {ORD(el.knesset)}, elected {longDate(el.date)}: {el.first.list} {el.first.seats} seats, {el.second.list} {el.second.seats}
                </>
              )}
            </dd>
          </div>
        </dl>
        {ev ? (
          <div className="tl-ev">
            <p className="tl-k">
              {KIND[ev.kind]}, {longDate(ev.date)}
            </p>
            <h3>{ev.title}</h3>
            <p>{ev.text}</p>
            <p className="tl-src">
              <a href={ev.source.url}>
                {ev.source.name}
                {ev.source.date ? `, ${/^\d{4}-\d\d-\d\d$/.test(ev.source.date) ? longDate(ev.source.date) : ev.source.date}` : ""}
              </a>
            </p>
          </div>
        ) : (
          <div className="tl-ev">
            <p>Drag along the line, or step through the events.</p>
          </div>
        )}
      </div>

    </div>
  );
}
