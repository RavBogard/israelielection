import { mediumDate, shortDate } from "@/lib/format";
import { seatTicks } from "@/lib/poll-chart";
import type { Reading, Result2022 } from "./model";

const W = 520, H = 210, PAD = { l: 30, r: 34, t: 18, b: 26 };

/**
 * The list's seats in every poll since the Knesset dissolved, one dot per poll on a time axis,
 * joined where consecutive polls reported it. Pollsters the alternative average leaves out are
 * hollow, so a list that two publishers read apart from the rest shows it. The 2022 result is a
 * dotted rule. Server-rendered SVG; the readings also ship as a table for assistive technology.
 */
export default function SeatSparkline({ series, result, color, name, variantLabel }: { series: Reading[]; result: Result2022 | null; color: string; name: string; variantLabel: string }) {
  const reported = series.filter((r) => r.seats !== null);
  if (reported.length < 2) return null;
  const t0 = Date.parse(series[0].date), t1 = Date.parse(series[series.length - 1].date);
  const vals = reported.map((r) => r.seats!);
  const ref = result?.seats ?? null;
  let low = Math.min(...vals, ref ?? Infinity), high = Math.max(...vals, ref ?? -Infinity);
  low = Math.max(0, Math.floor((low - 1) / 5) * 5);
  high = Math.ceil((high + 1) / 5) * 5;
  if (high - low < 10) high = low + 10;
  const x = (t: number) => PAD.l + ((t - t0) / Math.max(864e5, t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + ((high - v) / (high - low)) * (H - PAD.t - PAD.b);
  // Join consecutive reported readings; a poll that did not report the list breaks the line.
  const segments: Reading[][] = [];
  let run: Reading[] = [];
  for (const r of series) {
    if (r.seats === null) {
      if (run.length) segments.push(run);
      run = [];
    } else run.push(r);
  }
  if (run.length) segments.push(run);
  const last = reported[reported.length - 1];
  const mid = new Date((t0 + t1) / 2).toISOString().slice(0, 10);
  const hollow = series.some((r) => r.variant && r.seats !== null);
  return (
    <>
      <svg className="pp-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: seats in each of ${reported.length} polls from ${mediumDate(series[0].date)} to ${mediumDate(series[series.length - 1].date)}, latest ${last.seats}. The readings follow as a table.`}>
        {seatTicks(low, high).map((n) => (
          <g key={n}>
            <line className="grid" x1={PAD.l} x2={W - PAD.r} y1={y(n)} y2={y(n)} />
            <text className="tick" x={PAD.l - 8} y={y(n) + 4} textAnchor="end">{n}</text>
          </g>
        ))}
        {ref !== null && (
          <g>
            <line className="ref" x1={PAD.l} x2={W - PAD.r} y1={y(ref)} y2={y(ref)} />
            <text className="reflbl" x={W - PAD.r} y={y(ref) - 6} textAnchor="end">2022: {ref}</text>
          </g>
        )}
        {segments.map((seg, i) => (
          <path key={i} className="line" stroke={color} d={seg.map((r, j) => `${j ? "L" : "M"}${x(Date.parse(r.date)).toFixed(1)},${y(r.seats!).toFixed(1)}`).join("")} />
        ))}
        {reported.map((r) => (
          <circle key={r.id} className={r.variant ? "dot hollow" : "dot"} cx={x(Date.parse(r.date))} cy={y(r.seats!)} r={r.variant ? 4 : 3.4} stroke={color} fill={r.variant ? "var(--sheet)" : color}>
            <title>{`${r.pollster}, ${r.dateUncertain ? "date not given in our register" : mediumDate(r.date)}: ${r.below ? "below the threshold" : `${r.seats} seats`}`}</title>
          </circle>
        ))}
        <text className="end" x={x(Date.parse(last.date)) + 9} y={y(last.seats!) + 5}>{last.seats}</text>
        <text className="tick" x={PAD.l} y={H - 6}>{shortDate(series[0].date)}</text>
        <text className="tick" x={x(Date.parse(mid))} y={H - 6} textAnchor="middle">{shortDate(mid)}</text>
        <text className="tick" x={W - PAD.r} y={H - 6} textAnchor="end">{shortDate(series[series.length - 1].date)}</text>
      </svg>
      {hollow && (
        <p className="pp-key">
          <span className="k"><i className="solid" style={{ background: color }} /> Seven pollsters</span>
          <span className="k"><i className="ring" style={{ borderColor: color }} /> Channel 14 and i24NEWS, which the “{variantLabel}” average leaves out</span>
          {ref !== null && <span className="k"><i className="dash" /> 2022 result</span>}
        </p>
      )}
      <table className="sr-only">
        <caption>{name}: seats in each poll since the Knesset dissolved</caption>
        <thead><tr><th>Published</th><th>Pollster</th><th>Seats</th></tr></thead>
        <tbody>
          {series.map((r) => (
            <tr key={r.id}><td>{mediumDate(r.date)}</td><td>{r.pollster}</td><td>{r.seats === null ? "not reported separately" : r.below ? "below the threshold" : r.seats}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
