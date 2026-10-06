"use client";
import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { mediumDate, shortDate } from "@/lib/format";
import { nearestDateIndex } from "@/lib/poll-chart";
import { seatFigure } from "@/lib/polls";
import type { BlocPoint } from "@/lib/trend";
import { useLang } from "@/lib/i18n/lang";
import POLLS from "@/lib/i18n/polls";
import { Ltr, pollsterName, svgText } from "./names";
import "./bloc-race.css";

export type RaceDot = { id: string; date: string; pollster: string; net: number; opp: number; hollow: boolean };
const DAY = 86400_000, MAJ = 61, BLOCS = ["net", "opp"] as const;
const one = seatFigure;

/**
 * The bloc race: the Netanyahu and Anti-Netanyahu bloc totals of the site average on each poll
 * date against the 61 line, every poll as a dot, and the range of the current polls as two thin
 * edges. The date axis runs in weeks counted back from election day, which it marks; the weeks
 * still to come are left plain. `children` sit under the key (the counter and the cite line).
 */
export default function BlocRace({ trend, dots, labels, hollowNames, windowDays, until, title, children }: { trend: BlocPoint[]; dots: RaceDot[]; labels: Record<"net" | "opp", string>; hollowNames: string[]; windowDays: number; until: string; title: string; children?: ReactNode }) {
  const lang = useLang(), he = lang === "he", T = POLLS[lang], R = T.race, END = R.end;
  const sd = (d: string) => shortDate(d, lang), md = (d: string) => mediumDate(d, lang);
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(trend.length - 1);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  const wide = w >= 640;
  const H = wide ? 400 : 320, PAD = { l: 34, r: 14, t: 16, b: 30 };
  const dates = trend.map((t) => t.date);
  const t0 = Date.parse(dates[0]), t1 = Math.max(Date.parse(dates.at(-1)!), Date.parse(until));
  const all = [...trend.flatMap((t) => [t.lo.net, t.hi.net, t.lo.opp, t.hi.opp]), ...dots.flatMap((d) => [d.net, d.opp]), MAJ];
  const lo = Math.floor((Math.min(...all) - 1) / 5) * 5, hi = Math.ceil((Math.max(...all) + 1) / 5) * 5;
  const xt = (t: number) => PAD.l + ((t - t0) / Math.max(DAY, t1 - t0)) * (w - PAD.l - PAD.r);
  const x = (date: string) => xt(Date.parse(date));
  const y = (n: number) => PAD.t + ((hi - n) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5);
  // Weeks back from election day; on a narrow plot every other label, election day always labelled.
  const weeks: number[] = [];
  for (let t = Date.parse(until); t >= t0; t -= 7 * DAY) weeks.unshift(t);
  const every = weeks.length > 1 && xt(weeks[1]) - xt(weeks[0]) < 52 ? 2 : 1;
  const sel = trend[Math.min(index, trend.length - 1)];
  const last = trend.at(-1)!;
  const tLast = Date.parse(last.date);
  const inspect = (clientX: number) => { const r = ref.current?.getBoundingClientRect(); if (!r) return; const t = t0 + ((clientX - r.left - PAD.l) / Math.max(1, w - PAD.l - PAD.r)) * (t1 - t0); setIndex(nearestDateIndex(dates, Math.min(t, tLast))); };
  const path = (pick: (t: BlocPoint) => number) => trend.map((t, i) => `${i ? "L" : "M"}${x(t.date).toFixed(1)},${y(pick(t)).toFixed(1)}`).join("");
  // End labels sit right of the latest average, nudged apart when the two blocs are close; names only where the weeks to come leave room.
  const room = w - PAD.r - x(last.date) - 12;
  const named = room >= 150, showEnd = room >= 46;
  const endY = { net: y(last.avg.net), opp: y(last.avg.opp) };
  if (Math.abs(endY.net - endY.opp) < 34) { const mid = (endY.net + endY.opp) / 2, up = last.avg.net >= last.avg.opp ? "net" : "opp"; endY[up] = mid - 17; endY[up === "net" ? "opp" : "net"] = mid + 17; }
  const reading = (b: "net" | "opp") => R.reading(labels[b], one(sel.avg[b]), sel.lo[b], sel.hi[b]);
  const hollow = hollowNames.map((n) => pollsterName(n, lang));

  return (
    <figure className="br" aria-labelledby="br-h">
      <h2 id="br-h" className="sec-h">{title}</h2>
      <div className="br-plot" ref={ref}>
        {w > 0 && (
          <svg width={w} height={H} role="img" tabIndex={0} aria-label={R.aria(labels.net, labels.opp, md(dates[0]), md(last.date), md(until), one(last.avg.net), one(last.avg.opp))} aria-describedby="br-reading"
            onPointerMove={(e) => inspect(e.clientX)} onPointerDown={(e) => inspect(e.clientX)}
            onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setIndex((i) => Math.max(0, Math.min(trend.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)))); } if (e.key === "Home" || e.key === "End") { e.preventDefault(); setIndex(e.key === "Home" ? 0 : trend.length - 1); } }}>
            {ticks.map((n) => <g key={n}><line x1={PAD.l} x2={w - PAD.r} y1={y(n)} y2={y(n)} className="br-grid" /><text x={PAD.l - 8} y={y(n)} textAnchor="end" dominantBaseline="middle" className="br-tick">{n}</text></g>)}
            {weeks.map((t, i) => {
              const label = (weeks.length - 1 - i) % every === 0;
              return <g key={t}><line x1={xt(t)} x2={xt(t)} y1={H - PAD.b} y2={H - PAD.b + 5} className="br-wk" />{label && <text x={xt(t)} y={H - 8} className="br-tick" textAnchor={i === weeks.length - 1 ? "end" : "middle"}>{sd(new Date(t).toISOString().slice(0, 10))}</text>}</g>;
            })}
            <line x1={xt(Date.parse(until))} x2={xt(Date.parse(until))} y1={PAD.t} y2={H - PAD.b} className="br-eday" />
            <text x={xt(Date.parse(until)) - 6} y={PAD.t + 12} {...svgText(he, "end")} className="br-edaylbl">{R.electionDay}</text>
            {BLOCS.map((b) => <g key={b} style={{ stroke: `var(--b-${b})` }}><path d={path((t) => t.hi[b])} className="br-edge" /><path d={path((t) => t.lo[b])} className="br-edge" /></g>)}
            <line x1={PAD.l} x2={w - PAD.r} y1={y(MAJ)} y2={y(MAJ)} className="br-maj" />
            <text x={PAD.l + 6} y={y(MAJ) - 6} {...svgText(he)} className="br-majlbl">{R.majority}</text>
            {sel && <line x1={x(sel.date)} x2={x(sel.date)} y1={PAD.t} y2={H - PAD.b} className="br-cross" />}
            {BLOCS.map((b) => dots.map((d) => (
              <circle key={`${b}-${d.id}`} cx={x(d.date)} cy={y(d[b])} r={3.5} className={`br-dot${d.hollow ? " hollow" : ""}`} style={{ ["--c" as string]: `var(--b-${b})` }}>
                <title>{R.dot(pollsterName(d.pollster, lang), sd(d.date), labels[b], d[b])}</title>
              </circle>
            )))}
            {BLOCS.map((b) => <path key={b} d={path((t) => t.avg[b])} className="br-line" style={{ stroke: `var(--b-${b})` }} />)}
            {sel && BLOCS.map((b) => <circle key={b} cx={x(sel.date)} cy={y(sel.avg[b])} r={5} className="br-sel" style={{ fill: `var(--b-${b})` }} />)}
            {wide && <text x={x(last.date) - 4} y={y(last.hi.net) - 7} {...svgText(he, "end")} className="br-bandlbl">{R.band}</text>}
            {showEnd && BLOCS.map((b) => (
              <g key={b} transform={`translate(${x(last.date) + 12},${endY[b]})`}>
                <rect x={0} y={-6} width={10} height={10} style={{ fill: `var(--b-${b})` }} />
                <text x={16} y={0} dominantBaseline="middle" className="br-end"><tspan className="br-endv">{one(last.avg[b])}</tspan>{named && ` ${END[b]}`}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <p id="br-reading" className="br-reading" role="status" aria-live="polite">{sel && (he ? <><b>{md(sel.date)}</b>: {reading("net")}; {reading("opp")}; {R.readingTail(sel.n)}</> : <><b>{mediumDate(sel.date)}</b>: {reading("net")}; {reading("opp")}; {sel.n} current {sel.n === 1 ? "poll" : "polls"}.</>)}</p>
      <ul className="fig-key br-key">
        {BLOCS.map((b) => <li key={b}><svg width="22" height="12" aria-hidden="true"><line x1="1" x2="21" y1="6" y2="6" strokeWidth="2.5" style={{ stroke: `var(--b-${b})` }} /></svg>{R.keyLine(labels[b])}</li>)}
        <li><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--ink-2)" /></svg>{T.common.onePoll}</li>
        <li><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="3.5" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" /></svg>{T.common.or(hollow)}</li>
        <li><svg width="22" height="12" aria-hidden="true"><path d="M1 3h20M1 9h20" stroke="var(--ink-2)" strokeWidth="1" /></svg>{R.keyRange}</li>
      </ul>
      {children}
      <p className="fig-note">{R.note}</p>
      <details className="pd-how">
        <summary>{T.common.howToRead}</summary>
        {he ? <p className="fig-note">{R.how(windowDays, md(until))}</p> : <p className="fig-note">
          On each date the line is the bloc&apos;s total in the site average then: each pollster&apos;s latest poll from the {windowDays} days up to then,
          each list averaged and scaled to 120 seats, the same figures the Coalition Builder starts from. The two thin edges run from the lowest to the
          highest bloc total among those polls. It is the spread of the polls, not a confidence interval or a forecast. Dots are each poll&apos;s own published totals.
          The axis runs in weeks to election day, {mediumDate(until)}; nothing is drawn for the weeks still to come.
        </p>}
      </details>
      <details className="br-data">
        <summary>{R.numbers}</summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label={R.tableAria}>
          <table className="data-table">
            <caption>{R.caption}</caption>
            <thead><tr><th scope="col">{R.date}</th><th scope="col" className="num">{R.currentPolls}</th>{BLOCS.map((b) => <th key={b} scope="col" className="num">{labels[b]}</th>)}{BLOCS.map((b) => <th key={b} scope="col" className="num">{he ? R.range(labels[b]) : <>{labels[b]} range</>}</th>)}</tr></thead>
            <tbody>{[...trend].reverse().map((t) => <tr key={t.date}><th scope="row">{md(t.date)}</th><td className="num">{t.n}</td>{BLOCS.map((b) => <td key={b} className="num">{one(t.avg[b])}</td>)}{BLOCS.map((b) => <td key={b} className="num">{t.lo[b] === t.hi[b] ? t.lo[b] : <Ltr lang={lang}>{`${t.lo[b]}–${t.hi[b]}`}</Ltr>}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
