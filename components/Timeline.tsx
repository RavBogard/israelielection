"use client";

import { useRef, useState, type CSSProperties } from "react";
import "./timeline.css";
import { partyColor, partyInk } from "@/lib/party-colors";
import {
  electionAt,
  eventAt,
  governmentAt,
  monthOf,
  stackLanes,
  type Timeline as Data,
} from "@/lib/timeline";

import {
  historyText,
  historicalDate,
  historicalMonth,
  timelineKind,
} from "@/lib/i18n/history";
import type { Lang } from "@/lib/i18n";

const surname = (pm: string) => pm.split(" ").slice(-1)[0];
/** A prime minister's party drawn in the colour of the 2026 list that carries it on; Kadima has none. */
const HEIR: Record<string, string | null> = {
  Likud: "likud",
  Alignment: "dem",
  Labor: "dem",
  "One Israel (Labor)": "dem",
  "Likud (Kadima from November 2005)": "likud",
  Kadima: null,
  Yamina: "byachad",
  "Yesh Atid": "byachad",
};

/**
 * The scrubbable timeline: drag along the track (or use the slider, or step from event to
 * event) and the panel shows who governed, which Knesset sat, and what had just happened.
 */
export default function Timeline({
  data,
  electionDay,
  lang = "en",
  contentLang = "en",
}: {
  data: Data;
  electionDay: string;
  lang?: Lang;
  contentLang?: Lang;
}) {
  const t = historyText(lang),
    date = (value: string) => historicalDate(value, lang);
  const start = monthOf(data.elections[0].date);
  const end = monthOf(electionDay);
  const span = Math.max(1, end - start);
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
  const pct = (m: number) =>
    `${((Math.max(start, Math.min(end, m)) - start) / span) * 100}%`;

  const gov = governmentAt(data.governments, month);
  const el = electionAt(data.elections, month);
  const ei = pick ?? eventAt(data.events, month);
  const ev = ei >= 0 ? data.events[ei] : undefined;
  const monthLabel = historicalMonth(month, lang);

  const fromPointer = (x: number) => {
    const r = track.current!.getBoundingClientRect();
    setMonth(
      start +
        Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * span),
    );
  };

  // Events close in time stack in lanes instead of overlapping: one set of lanes for a desktop track, one for a phone's.
  const ats = data.events.map((e) => (monthOf(e.date) - start) / span);
  const laneW = stackLanes(ats, 13 / 900),
    laneN = stackLanes(ats, 11 / 358);
  const lanes = {
    "--ln-w": Math.max(0, ...laneW),
    "--ln-n": Math.max(0, ...laneN),
  } as CSSProperties;

  const decades = [];
  for (let y = 1980; y <= 2020; y += 10) decades.push(y);

  return (
    <div className="tl">
      <div
        className="tl-track"
        dir="ltr"
        ref={track}
        style={lanes}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            fromPointer(e.clientX);
        }}
      >
        <div className="tl-row tl-evs" aria-label={t.events}>
          {data.events.map((e, i) => (
            <button
              key={i}
              type="button"
              className={i === ei ? "on" : undefined}
              style={
                {
                  left: pct(monthOf(e.date)),
                  "--l-w": laneW[i],
                  "--l-n": laneN[i],
                } as CSSProperties
              }
              title={`${date(e.date)}: ${e.title}`}
              aria-label={`${date(e.date)}: ${e.title}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="tl-row tl-els" aria-hidden="true">
          {data.elections.map((e) => (
            <span
              key={e.date}
              className={e === el ? "on" : undefined}
              style={{ left: pct(monthOf(e.date)) }}
            />
          ))}
          <span className="next" style={{ left: pct(end) }} />
        </div>
        <div className="tl-row tl-pms" aria-hidden="true">
          {data.governments.map((g) => {
            const from = monthOf(g.from);
            const to = g.to ? monthOf(g.to) : end;
            const w = ((to - from) / span) * 100;
            return (
              <span
                key={g.from}
                className={g === gov ? "on" : undefined}
                style={{
                  left: pct(from),
                  width: `${w}%`,
                  background: HEIR[g.party]
                    ? partyColor(HEIR[g.party]!)
                    : "var(--ink-2)",
                  color: HEIR[g.party] ? partyInk(HEIR[g.party]!) : "var(--bg)",
                }}
              >
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
        <div
          className="tl-cursor"
          style={{ left: pct(month) }}
          aria-hidden="true"
        />
      </div>
      <p className="fig-key tl-key" aria-hidden="true">
        <span>
          <i className="k-ev" /> {t.events}
        </span>
        <span>
          <i className="k-el" /> {t.election}
        </span>
        <span>
          <i className="k-pm" /> {t.termLegend}
        </span>
      </p>

      <div className="tl-controls">
        <button type="button" disabled={ei <= 0} onClick={() => goTo(ei - 1)}>
          {t.previous}
        </button>
        <label>
          <span className="sr">{t.month}</span>
          <input
            type="range"
            dir="ltr"
            min={start}
            max={end}
            value={month}
            aria-valuetext={monthLabel}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          disabled={ei >= data.events.length - 1}
          onClick={() => goTo(ei + 1)}
        >
          {t.next}
        </button>
      </div>
      <div className="tl-panel" aria-live="polite">
        <p className="tl-when">{monthLabel}</p>
        <dl className="tl-facts">
          <div>
            <dt>{t.primeMinisters}</dt>
            <dd>
              {gov
                ? `${gov.pm} (${gov.party}), ${t.from} ${date(gov.from)}`
                : t.unknownGovernment}
            </dd>
          </div>
          <div>
            <dt>{t.election}</dt>
            <dd>
              {el && (
                <>
                  {el.knesset}, {t.elected} {date(el.date)}
                  {el.first && el.second && (
                    <>
                      :{" "}
                      <span lang={contentLang} dir="auto">
                        {el.first.list}
                      </span>{" "}
                      {el.first.seats} {t.seats},{" "}
                      <span lang={contentLang} dir="auto">
                        {el.second.list}
                      </span>{" "}
                      {el.second.seats}
                    </>
                  )}
                  {el.status === "counting" && (
                    <>
                      {" "}
                      ({t.counting}
                      {el.asOf ? `. ${t.countAsOf} ${date(el.asOf)}` : ""})
                    </>
                  )}
                </>
              )}
            </dd>
          </div>
        </dl>
        {ev ? (
          <div className="tl-ev">
            <h2 lang={contentLang} dir="auto">
              {ev.title}
            </h2>
            <p className="tl-k">
              {timelineKind(ev.kind, lang)}, {date(ev.date)}
              {ev.expected ? `, ${t.expected}` : ""}
            </p>
            <p lang={contentLang} dir="auto">
              {ev.text}
            </p>
            <p className="fig-src tl-src">
              <a href={ev.source.url}>
                {ev.source.name}
                {ev.source.date
                  ? `, ${/^\d{4}-\d\d-\d\d$/.test(ev.source.date) ? date(ev.source.date) : ev.source.date}`
                  : ""}
              </a>
            </p>
          </div>
        ) : (
          <div className="tl-ev">
            <p>{t.drag}</p>
          </div>
        )}
      </div>
    </div>
  );
}
