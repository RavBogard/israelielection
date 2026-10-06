import { mediumDate } from "@/lib/format";
import type { GovernmentEvent } from "@/lib/outgoing-government";

type Events = GovernmentEvent[];

const LO = 56, HI = 80;
const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

/**
 * The outgoing coalition's seats after each dated change, as a step line against the 61-seat
 * majority, from its swearing-in to election day. A change reported as a range ("62 or 63") is
 * drawn as a band. After the Knesset dissolves itself the line goes grey: the coalition governs on
 * as a transitional government until a new one is sworn in.
 */
export default function CoalitionSeats({ events, electionDay }: { events: Events; electionDay: string }) {
  return (
    <figure className="gov-fig">
      <figcaption className="gov-fig-h">The coalition&apos;s seats after each change, against the 61 needed for a majority</figcaption>
      <Plot events={events} electionDay={electionDay} narrow={false} />
      <Plot events={events} electionDay={electionDay} narrow />
      <p className="fig-src gov-fig-src">Grey after the dissolution: the coalition governs on as a transitional government. The band is a change the reports give as 62 or 63 seats.</p>
    </figure>
  );
}

/** One drawing of the chart; phones get a narrower one of their own so the text stays legible. */
function Plot({ events, electionDay, narrow }: { events: Events; electionDay: string; narrow: boolean }) {
  const W = narrow ? 360 : 760, H = narrow ? 240 : 230, P = narrow ? { l: 24, r: 36, t: 30, b: 26 } : { l: 34, r: 86, t: 26, b: 30 };
  const start = t(events[0].date), end = t(electionDay);
  const x = (iso: string) => P.l + ((t(iso) - start) / (end - start)) * (W - P.l - P.r);
  const y = (s: number) => P.t + (1 - (s - LO) / (HI - LO)) * (H - P.t - P.b);
  // Seats in force after each event: a number, a range, or (dissolution) unchanged.
  const steps = events.reduce<{ date: string; lo: number; hi: number; label: string | null; end?: boolean }[]>((acc, e) => {
    const prev = acc.at(-1);
    if (e.seatsAfter !== null) return [...acc, { date: e.date, lo: e.seatsAfter, hi: e.seatsAfter, label: String(e.seatsAfter) }];
    const range = /(\d+)\D+(\d+)/.exec(e.seatsText ?? "");
    if (range) return [...acc, { date: e.date, lo: Number(range[1]), hi: Number(range[2]), label: e.seatsText ?? null }];
    return prev ? [...acc, { date: e.date, lo: prev.lo, hi: prev.hi, label: null, end: true }] : acc;
  }, []);
  const dissolved = steps.find((s) => s.end);
  const solid = steps.filter((s) => !s.end);
  const years = Array.from({ length: new Date(end).getUTCFullYear() - new Date(start).getUTCFullYear() }, (_, i) => `${new Date(start).getUTCFullYear() + i + 1}-01-01`);
  const lastSolidEnd = dissolved?.date ?? electionDay;
  const summary = solid.map((s) => `${mediumDate(s.date)}: ${s.label}`).join("; ");
  return (
      <svg viewBox={`0 0 ${W} ${H}`} className={narrow ? "narrow" : "wide"} role="img" aria-label={`Coalition seats after each change. ${summary}. The Knesset dissolved itself on ${dissolved ? mediumDate(dissolved.date) : "—"}; the coalition governs as a transitional government until a new one is sworn in.`}>
        {(narrow ? [60, 70, 80] : [60, 65, 70, 75, 80]).map((s) => (
          <g key={s}>
            <line className="grid" x1={P.l} x2={W - P.r} y1={y(s)} y2={y(s)} />
            <text className="tick" x={P.l - 6} y={y(s) + 4} textAnchor="end">{s}</text>
          </g>
        ))}
        {years.map((d) => (
          <g key={d}>
            <line className="grid yr" x1={x(d)} x2={x(d)} y1={P.t} y2={H - P.b} />
            <text className="tick" x={x(d) + 4} y={H - 8}>{narrow ? `’${d.slice(2, 4)}` : d.slice(0, 4)}</text>
          </g>
        ))}
        <line className="maj" x1={P.l} x2={W - P.r} y1={y(61)} y2={y(61)} />
        <text className="maj-l" x={P.l + 4} y={y(61) + 16}>{narrow ? "61" : "61, a majority"}</text>
        {solid.map((s, i) => {
          const x1 = x(s.date), x2 = x(solid[i + 1]?.date ?? lastSolidEnd);
          return (
            <g key={s.date}>
              {s.hi > s.lo ? <rect className="band" x={x1} width={x2 - x1} y={y(s.hi)} height={y(s.lo) - y(s.hi)} /> : <line className="seat" x1={x1} x2={x2} y1={y(s.lo)} y2={y(s.lo)} />}
              {i > 0 && <line className="seat" x1={x1} x2={x1} y1={y(Math.min(solid[i - 1].lo, s.lo))} y2={y(Math.max(solid[i - 1].hi, s.hi))} />}
              {/* A range's label is drawn only where it fits inside its step, clear of the next step's line; otherwise the band and the caption carry it. */}
              {!(s.hi > s.lo && (narrow || (s.label ?? "").length * 8 + 10 > x2 - x1)) && <text className="val" x={x1 + 4} y={y(s.hi) - 7}>{s.label}</text>}
            </g>
          );
        })}
        {dissolved && (
          <g>
            <line className="seat after" x1={x(dissolved.date)} x2={x(electionDay)} y1={y(dissolved.lo)} y2={y(dissolved.lo)} />
            <line className="mark" x1={x(dissolved.date)} x2={x(dissolved.date)} y1={P.t - 6} y2={H - P.b} />
            <text className="gov-ann" x={x(dissolved.date) - 6} y={P.t + 2} textAnchor="end">{narrow ? "Dissolved" : "Knesset dissolved"}</text>
            <text className="gov-ann" x={x(dissolved.date) - 6} y={P.t + 16} textAnchor="end">{mediumDate(dissolved.date)}</text>
          </g>
        )}
        <line className="mark" x1={x(electionDay)} x2={x(electionDay)} y1={P.t - 6} y2={H - P.b} />
        {/* Right of its line, in the margin kept for it, so it never meets the dissolution line just before. */}
        <text className="gov-ann" x={x(electionDay) + 5} y={H - P.b - 8}>{narrow ? "Vote" : "Election day"}</text>
      </svg>
  );
}
