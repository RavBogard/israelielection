import { mediumDate, shortDate } from "@/lib/format";
import { strokeVars } from "@/lib/party-colors";
import { seatTicks } from "@/lib/poll-chart";
import { SEATS_LABEL, seatFigure } from "@/lib/polls";
import "../party-stroke.css";
import type { Reading, Result2022 } from "./model";

const W = 520, H = 210, PAD = { l: 30, r: 52, t: 18, b: 26 };
/** A label's place over the SVG, in percent of the chart, so the text is set in screen pixels (12px floor) at any width. */
const at = (x: number, y: number) => ({ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` });

/**
 * The list's seats in every poll since the Knesset dissolved, one dot per poll on a time axis,
 * joined where consecutive polls reported it. Pollsters the alternative average leaves out are
 * hollow, so a list that two publishers read apart from the rest shows it. The 2022 result is a
 * dotted rule, and the list's seats in the polling average (the figure the rest of the site prints) a short
 * rule at the right end. Server-rendered SVG with its labels in HTML over it (chart units shrink on a phone, the
 * labels do not); the readings also ship as a table for assistive technology.
 */
export default function SeatSparkline({ series, result, id, name, avg }: { series: Reading[]; result: Result2022 | null; id: string; name: string; avg: number | null }) {
  const reported = series.filter((r) => r.seats !== null);
  if (reported.length < 2) return null;
  const t0 = Date.parse(series[0].date), t1 = Date.parse(series[series.length - 1].date);
  const vals = reported.map((r) => r.seats!);
  const ref = result?.seats ?? null;
  let low = Math.min(...vals, ref ?? Infinity, avg ?? Infinity), high = Math.max(...vals, ref ?? -Infinity, avg ?? -Infinity);
  low = Math.max(0, Math.floor((low - 1) / 5) * 5);
  high = Math.ceil((high + 1) / 5) * 5;
  if (high - low < 10) high = low + 10;
  const x = (t: number) => PAD.l + ((t - t0) / Math.max(864e5, t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((high - v) / (high - low)) * (H - PAD.t - PAD.b);
  // The line runs through the main pollsters only; the two the alternative average leaves out stay as unjoined
  // hollow points, so a swing no single pollster recorded is never drawn. A poll that did not report the list breaks the line.
  const segments: Reading[][] = [];
  let run: Reading[] = [];
  for (const r of series) {
    if (r.variant) continue;
    if (r.seats === null) {
      if (run.length) segments.push(run);
      run = [];
    } else run.push(r);
  }
  if (run.length) segments.push(run);
  const last = reported[reported.length - 1];
  const mid = new Date((t0 + t1) / 2).toISOString().slice(0, 10);
  const hollow = series.some((r) => r.variant && r.seats !== null);
  const mainPollsters = new Set(series.filter((r) => !r.variant && r.seats !== null).map((r) => r.pollster)).size;
  const hollowNames = [...new Set(series.filter((r) => r.variant && r.seats !== null).map((r) => r.pollster))];
  return (
    <>
      <div className="pp-sparkwrap">
      <svg className="pp-spark pstroke" style={strokeVars(id)} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: seats in each of ${reported.length} polls from ${mediumDate(series[0].date)} to ${mediumDate(series[series.length - 1].date)}, latest ${last.below ? "below the threshold" : last.seats}${avg !== null ? `; ${seatFigure(avg)} seats in the polling average` : ""}. The readings follow as a table.`}>
        {seatTicks(low, high).map((n) => (
          <g key={n}>
            <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y(n)} y2={y(n)} />
          </g>
        ))}
        {ref !== null && (
          <g>
            <line className="ref" x1={PAD.l} x2={W - PAD.r} y1={y(ref)} y2={y(ref)} />
          </g>
        )}
        {segments.map((seg, i) => (
          <path key={i} className="line" stroke="var(--psx)" d={seg.map((r, j) => `${j ? "L" : "M"}${x(Date.parse(r.date)).toFixed(1)},${y(r.seats!).toFixed(1)}`).join("")} />
        ))}
        {reported.map((r) => (
          <circle key={r.id} className={r.variant ? "dot hollow" : "dot"} cx={x(Date.parse(r.date))} cy={y(r.seats!)} r={r.variant ? 4 : 3.4} stroke="var(--psx)" fill={r.variant ? "var(--sheet)" : "var(--psx)"}>
            <title>{`${r.pollster}, ${r.dateUncertain ? "date not given in our register" : mediumDate(r.date)}: ${r.below ? "below the threshold" : `${r.seats} seats`}`}</title>
          </circle>
        ))}
        {avg !== null && (
          <g>
            <line className="avg" x1={x(Date.parse(last.date)) - 28} x2={W - PAD.r + 4} y1={y(avg)} y2={y(avg)} />
          </g>
        )}
      </svg>
      <div aria-hidden="true">
        {seatTicks(low, high).map((n) => <span key={n} className="sl y" style={at(PAD.l - 8, y(n))}>{n}</span>)}
        {ref !== null && <span className="sl ref" style={at(W - PAD.r, y(ref) - 4)}>2022: {ref}</span>}
        {avg !== null && <span className="sl avg" style={at(W - PAD.r + 7, y(avg))}>{seatFigure(avg)}</span>}
        <span className="sl x" style={at(PAD.l, H - 3)}>{shortDate(series[0].date)}</span>
        <span className="sl x mid" style={at(x(Date.parse(mid)), H - 3)}>{shortDate(mid)}</span>
        <span className="sl x end" style={at(W - PAD.r, H - 3)}>{shortDate(series[series.length - 1].date)}</span>
      </div>
      </div>
      <p className="fig-key pp-key pstroke" style={strokeVars(id)}>
        {avg !== null && <span className="k"><i className="avg" /> {SEATS_LABEL}, {seatFigure(avg)}</span>}
        <span className="k"><i className="solid" style={{ background: "var(--psx)" }} /> {hollow ? `The other ${mainPollsters} publishers, joined` : `${mainPollsters} publishers, joined`}</span>
        {hollow && <span className="k"><i className="ring" style={{ borderColor: "var(--psx)" }} /> {hollowNames.join(" and ")}, which the site’s alternative average leaves out</span>}
        {ref !== null && <span className="k"><i className="dash" /> 2022 result</span>}
      </p>
      <div className="sr-only">
      <table>
        <caption>{name}: seats in each poll since the Knesset dissolved</caption>
        <thead><tr><th>Published</th><th>Pollster</th><th>Seats</th></tr></thead>
        <tbody>
          {series.map((r) => (
            <tr key={r.id}><td>{mediumDate(r.date)}</td><td>{r.pollster}</td><td>{r.seats === null ? "not reported separately" : r.below ? "below the threshold" : r.seats}</td></tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
