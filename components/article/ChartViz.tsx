import type { Chart, ChartRow } from "@/lib/articles";

/*
 * Visual forms for a data/charts table. The table itself always stays on the page (folded under
 * the figure when a figure draws it), so every number keeps its exact printed value. Which form a
 * table takes is decided from its cells, never set by hand:
 *   - every value a plain percentage, the rows a run of years or elections, four or more rows: lines;
 *   - every value a plain percentage, two to four columns: a dot plot, one mark per column;
 *   - mostly percentages otherwise: the table, each percentage cell shaded by its size.
 * Anything else stays a plain table.
 */

const PCT = /^(\d+(?:\.\d+)?)%$/;
const BLANK = /^(—|–|-|n\/a)?$/i;
export const pct = (s: string | undefined): number | null => {
  const m = PCT.exec((s ?? "").trim());
  return m ? Number(m[1]) : null;
};
const blank = (s: string | undefined) => BLANK.test((s ?? "").trim());

export type ChartForm = "lines" | "dots" | "heat" | "table";

export function formOf(c: Chart): ChartForm {
  if (c.kind !== "table" || !c.columns || c.columns.length < 2) return "table";
  const cells = c.rows.flatMap((r) => r.cells ?? []);
  const filled = cells.filter((x) => !blank(x));
  const share = filled.length ? filled.filter((x) => pct(x) !== null).length / filled.length : 0;
  const series = c.columns.length - 1;
  const timeRows = c.rows.length >= 4 && (/^(year|election|end of year)$/i.test(c.columns[0].trim()) || c.rows.every((r) => /\b(19|20)\d{2}\b/.test(r.label)));
  if (share === 1 && timeRows && series <= 4) return "lines";
  if (share === 1 && series >= 2 && series <= 4 && c.rows.length <= 12) return "dots";
  if (share >= 0.5) return "heat";
  return "table";
}

/** Mark styles by column, in order: what tells the series apart besides position. */
const MARKS = ["solid", "ring", "grey", "grey-ring"] as const;

function Legend({ columns }: { columns: string[] }) {
  return (
    <p className="cv-legend">
      {columns.map((h, i) => (
        <span key={h}>
          <i className={`cv-m ${MARKS[i]}`} aria-hidden="true" />
          {h}
        </span>
      ))}
    </p>
  );
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** A row label as a fractional year ("June 2023" is 2023.42), or null when it names no year. */
function timeOf(label: string): number | null {
  const y = /\b((?:19|20)\d{2})\b/.exec(label);
  if (!y) return null;
  const m = MONTHS.findIndex((mo) => label.toLowerCase().includes(mo));
  return Number(y[1]) + (m >= 0 ? m / 12 : 0.4);
}

const scaleMax = (vals: number[]) => (Math.max(...vals) > 60 ? 100 : Math.max(20, Math.ceil(Math.max(...vals) / 10) * 10));

/** A dot plot: each row a 0-to-max track with one mark per column, joined by a hairline from lowest to highest. */
export function DotPlot({ c }: { c: Chart }) {
  const cols = c.columns!.slice(1);
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pct).filter((v): v is number => v !== null));
  const max = scaleMax(vals);
  const x = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="cv-dots" aria-hidden="true">
      <Legend columns={cols} />
      <ul>
        {c.rows.map((r: ChartRow) => {
          const vs = (r.cells ?? []).map(pct);
          const known = vs.filter((v): v is number => v !== null);
          return (
            <li key={r.label}>
              <span className="lab">{r.label}</span>
              <span className="track">
                {known.length > 1 && <i className="span" style={{ left: x(Math.min(...known)), width: `${((Math.max(...known) - Math.min(...known)) / max) * 100}%` }} />}
                {vs.map((v, i) => (v === null ? null : <i key={i} className={`cv-m ${MARKS[i]}`} style={{ left: x(v) }} title={`${cols[i]}: ${r.cells![i]}`} />))}
              </span>
              <span className="vals">{vs.map((v, i) => (v === null ? null : <b key={i} className={`v-${MARKS[i]}`}>{r.cells![i]}</b>))}</span>
            </li>
          );
        })}
      </ul>
      <p className="cv-axis"><span>0%</span><span>{max}%</span></p>
    </div>
  );
}

/** Lines over a run of years or elections: one line per column, its latest value printed at the end. */
export function Lines({ c }: { c: Chart }) {
  const cols = c.columns!.slice(1);
  const W = 640, H = 260, P = { l: 44, r: 176, t: 14, b: 30 };
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pct).filter((v): v is number => v !== null));
  const max = scaleMax(vals);
  const n = c.rows.length;
  // Space the points by date when every row names a year, so uneven gaps between surveys stay uneven.
  const when = c.rows.map((r) => timeOf(r.label));
  const dated = when.every((t): t is number => t !== null) && when[n - 1]! > when[0]!;
  const x = (i: number) => P.l + (dated ? (when[i]! - when[0]!) / (when[n - 1]! - when[0]!) : i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  // End labels: keep them at least 14 units apart.
  const ends = cols
    .map((h, s) => {
      const last = [...c.rows.keys()].reverse().find((i) => pct(c.rows[i].cells?.[s]) !== null);
      return last === undefined ? null : { s, h, v: pct(c.rows[last].cells![s])!, raw: c.rows[last].cells![s], i: last };
    })
    .filter((e): e is NonNullable<typeof e> => !!e)
    .sort((a, b) => b.v - a.v);
  const placed = ends.reduce<((typeof ends)[number] & { ly: number })[]>((acc, e) => [...acc, { ...e, ly: Math.max(y(e.v), (acc.at(-1)?.ly ?? -Infinity) + 14) }], []);
  return (
    <div className="cv-lines" aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
            <text className="tick" x={P.l - 6} y={y(t) + 4} textAnchor="end">{Math.round(t)}%</text>
          </g>
        ))}
        {c.rows.map((r, i) => (i === 0 || i === n - 1 || n <= 6 || i % 2 === 0 ? <text key={r.label} className="tick" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{r.label}</text> : null))}
        {cols.map((h, s) => {
          const pts = c.rows.map((r, i) => ({ i, v: pct(r.cells?.[s]) })).filter((p): p is { i: number; v: number } => p.v !== null);
          return (
            <g key={h} className={`ser ${MARKS[s]}`}>
              <path d={pts.map((p, k) => `${k ? "L" : "M"}${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join("")} />
              {pts.map((p) => <circle key={p.i} cx={x(p.i)} cy={y(p.v)} r={3.4}><title>{`${h}, ${c.rows[p.i].label}: ${c.rows[p.i].cells![s]}`}</title></circle>)}
            </g>
          );
        })}
        {placed.map((e) => (
          <text key={e.h} className={`end ${MARKS[e.s]}`} x={x(e.i) + 10} y={e.ly + 4}>
            <tspan className="v">{e.raw}</tspan> {e.h.length > 24 ? `${e.h.slice(0, 23)}…` : e.h}
          </text>
        ))}
      </svg>
      <Legend columns={cols} />
    </div>
  );
}

/** Shade for a percentage cell in a heat table: ink over sheet, up to 62% strength at the table's largest value. */
export function heatStyle(cell: string | undefined, max: number): React.CSSProperties | undefined {
  const v = pct(cell);
  if (v === null || max <= 0) return undefined;
  const k = Math.round((v / max) * 62);
  return { background: `color-mix(in oklab, var(--ink) ${k}%, var(--sheet))`, color: k > 34 ? "var(--bg)" : undefined };
}
