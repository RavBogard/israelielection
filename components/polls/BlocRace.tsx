"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { mediumDate, shortDate } from "@/lib/format";
import { nearestDateIndex } from "@/lib/poll-chart";
import { seatFigure } from "@/lib/polls";
import type { BlocPoint } from "@/lib/trend";
import "./bloc-race.css";

export type RaceDot = { id: string; date: string; pollster: string; net: number; opp: number; hollow: boolean };
const DAY = 86400_000, MAJ = 61, BLOCS = ["net", "opp"] as const;
const one = seatFigure;

/**
 * The bloc race: the Netanyahu and Anti-Netanyahu bloc totals of the site average on each poll
 * date against the 61 line, every poll as a dot, and the range of the current polls shaded.
 */
export default function BlocRace({ trend, dots, labels, hollowNames, windowDays }: { trend: BlocPoint[]; dots: RaceDot[]; labels: Record<"net" | "opp", string>; hollowNames: string[]; windowDays: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [index, setIndex] = useState(trend.length - 1);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  const wide = w >= 640;
  const H = wide ? 400 : 320, PAD = { l: 34, r: wide ? 168 : 14, t: 16, b: 28 };
  const dates = trend.map((t) => t.date);
  const t0 = Date.parse(dates[0]), t1 = Date.parse(dates.at(-1)!);
  const all = [...trend.flatMap((t) => [t.lo.net, t.hi.net, t.lo.opp, t.hi.opp]), ...dots.flatMap((d) => [d.net, d.opp]), MAJ];
  const lo = Math.floor((Math.min(...all) - 1) / 5) * 5, hi = Math.ceil((Math.max(...all) + 1) / 5) * 5;
  const x = (date: string) => PAD.l + ((Date.parse(date) - t0) / Math.max(DAY, t1 - t0)) * (w - PAD.l - PAD.r);
  const y = (n: number) => PAD.t + ((hi - n) / (hi - lo)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: (hi - lo) / 5 + 1 }, (_, i) => lo + i * 5);
  const sel = trend[Math.min(index, trend.length - 1)];
  const last = trend.at(-1)!;
  const inspect = (clientX: number) => { const r = ref.current?.getBoundingClientRect(); if (r) setIndex(nearestDateIndex(dates, t0 + ((clientX - r.left - PAD.l) / Math.max(1, w - PAD.l - PAD.r)) * (t1 - t0))); };
  const line = (b: "net" | "opp") => trend.map((t, i) => `${i ? "L" : "M"}${x(t.date).toFixed(1)},${y(t.avg[b]).toFixed(1)}`).join("");
  const band = (b: "net" | "opp") => `${trend.map((t, i) => `${i ? "L" : "M"}${x(t.date).toFixed(1)},${y(t.hi[b]).toFixed(1)}`).join("")}${[...trend].reverse().map((t) => `L${x(t.date).toFixed(1)},${y(t.lo[b]).toFixed(1)}`).join("")}Z`;
  // End labels sit at the latest average, nudged apart when the two blocs are close.
  const endY = { net: y(last.avg.net), opp: y(last.avg.opp) };
  if (Math.abs(endY.net - endY.opp) < 34) { const mid = (endY.net + endY.opp) / 2, up = last.avg.net >= last.avg.opp ? "net" : "opp"; endY[up] = mid - 17; endY[up === "net" ? "opp" : "net"] = mid + 17; }
  const reading = (b: "net" | "opp") => `${labels[b]} ${one(sel.avg[b])} (current polls ${sel.lo[b]} to ${sel.hi[b]})`;

  return (
    <figure className="br" aria-labelledby="br-h">
      <h2 id="br-h" className="sec-h">The bloc race</h2>
      <div className="br-plot" ref={ref}>
        {w > 0 && (
          <svg width={w} height={H} role="img" tabIndex={0} aria-label={`${labels.net} and ${labels.opp} in the site average from ${mediumDate(dates[0])} to ${mediumDate(last.date)}, against the 61-seat majority. Latest: ${labels.net} ${one(last.avg.net)}, ${labels.opp} ${one(last.avg.opp)}. Left and right arrows step through dates.`} aria-describedby="br-reading"
            onPointerMove={(e) => inspect(e.clientX)} onPointerDown={(e) => inspect(e.clientX)}
            onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setIndex((i) => Math.max(0, Math.min(trend.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)))); } if (e.key === "Home" || e.key === "End") { e.preventDefault(); setIndex(e.key === "Home" ? 0 : trend.length - 1); } }}>
            {ticks.map((n) => <g key={n}><line x1={PAD.l} x2={w - PAD.r} y1={y(n)} y2={y(n)} className="br-grid" /><text x={PAD.l - 8} y={y(n)} textAnchor="end" dominantBaseline="middle" className="br-tick">{n}</text></g>)}
            <text x={PAD.l} y={H - 8} className="br-tick">{shortDate(dates[0])}</text>
            <text x={w - PAD.r} y={H - 8} className="br-tick" textAnchor="end">{shortDate(last.date)}</text>
            {BLOCS.map((b) => <path key={b} d={band(b)} className={`br-band br-band-${b}`} />)}
            <line x1={PAD.l} x2={w - PAD.r} y1={y(MAJ)} y2={y(MAJ)} className="br-maj" />
            <text x={PAD.l + 6} y={y(MAJ) - 6} className="br-majlbl">61, a majority</text>
            {sel && <line x1={x(sel.date)} x2={x(sel.date)} y1={PAD.t} y2={H - PAD.b} className="br-cross" />}
            {BLOCS.map((b) => dots.map((d) => (
              <circle key={`${b}-${d.id}`} cx={x(d.date)} cy={y(d[b])} r={3.5} className={`br-dot${d.hollow ? " hollow" : ""}`} style={{ ["--c" as string]: `var(--b-${b})` }}>
                <title>{`${d.pollster}, ${shortDate(d.date)}: ${labels[b]} ${d[b]}`}</title>
              </circle>
            )))}
            {BLOCS.map((b) => <path key={b} d={line(b)} className="br-line" style={{ stroke: `var(--b-${b})` }} />)}
            {sel && BLOCS.map((b) => <circle key={b} cx={x(sel.date)} cy={y(sel.avg[b])} r={5} className="br-sel" style={{ fill: `var(--b-${b})` }} />)}
            {wide && <text x={x(last.date) - 4} y={y(last.hi.net) - 7} textAnchor="end" className="br-bandlbl">Range of current polls</text>}
            {wide && BLOCS.map((b) => (
              <g key={b} transform={`translate(${w - PAD.r + 12},${endY[b]})`}>
                <rect x={0} y={-6} width={10} height={10} style={{ fill: `var(--b-${b})` }} />
                <text x={16} y={0} dominantBaseline="middle" className="br-end"><tspan className="br-endv">{one(last.avg[b])}</tspan> {b === "net" ? "Netanyahu" : "Anti-Netanyahu"}</text>
              </g>
            ))}
          </svg>
        )}
      </div>
      <p id="br-reading" className="br-reading" role="status" aria-live="polite">{sel && <><b>{mediumDate(sel.date)}</b>: {reading("net")}; {reading("opp")}; {sel.n} current {sel.n === 1 ? "poll" : "polls"}.</>}</p>
      <ul className="fig-key br-key">
        {BLOCS.map((b) => <li key={b}><svg width="22" height="12" aria-hidden="true"><line x1="1" x2="21" y1="6" y2="6" strokeWidth="2.5" style={{ stroke: `var(--b-${b})` }} /></svg>{labels[b]}, site average</li>)}
        <li><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--ink-2)" /></svg>One poll</li>
        <li><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="3.5" fill="none" stroke="var(--ink-2)" strokeWidth="1.5" /></svg>{hollowNames.join(" or ")}</li>
        <li><span className="br-kband" aria-hidden="true" />Range of current polls, lowest to highest</li>
      </ul>
      <p className="fig-note">
        On each date the line is the bloc&apos;s total in the site average then: each pollster&apos;s latest poll from the {windowDays} days up to then,
        each list averaged and scaled to 120 seats, the same figures the Coalition Builder starts from. The shaded band runs from the lowest to the
        highest bloc total among those polls. It is the spread of the polls, not a confidence interval or a forecast. Dots are each poll&apos;s own published totals.
      </p>
      <details className="br-data">
        <summary>The numbers</summary>
        <div className="table-scroll" tabIndex={0} role="region" aria-label="Bloc race data, horizontally scrollable">
          <table className="data-table">
            <caption>Bloc totals in the site average on each poll date, with the lowest and highest current poll</caption>
            <thead><tr><th scope="col">Date</th><th scope="col" className="num">Current polls</th>{BLOCS.map((b) => <th key={b} scope="col" className="num">{labels[b]}</th>)}{BLOCS.map((b) => <th key={b} scope="col" className="num">{labels[b]} range</th>)}</tr></thead>
            <tbody>{[...trend].reverse().map((t) => <tr key={t.date}><th scope="row">{mediumDate(t.date)}</th><td className="num">{t.n}</td>{BLOCS.map((b) => <td key={b} className="num">{one(t.avg[b])}</td>)}{BLOCS.map((b) => <td key={b} className="num">{t.lo[b] === t.hi[b] ? t.lo[b] : `${t.lo[b]}–${t.hi[b]}`}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
