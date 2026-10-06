import type { Chart, ChartRow } from "@/lib/articles";

/*
 * Visual forms for a data/charts table. The table itself always stays on the page (folded under
 * the figure when a figure draws it), so every number keeps its exact printed value. Which form a
 * table takes is decided from its cells, never set by hand:
 *   - every value a plain percentage, the rows a run of years or elections, four or more rows: lines;
 *   - every value a plain percentage, two to four columns: a dot plot, one mark per column;
 *   - two or more columns, mostly cells carrying one percentage: the table, each such cell shaded
 *     by its size (turnout columns stay unshaded, since turnout is a share of a different whole).
 * Anything else stays a plain table.
 */

const PCT = /^(\d+(?:\.\d+)?)%$/;
const BLANK = /^(—|–|-|n\/a)?$/i;
export const pct = (s: string | undefined): number | null => {
  const m = PCT.exec((s ?? "").trim());
  return m ? Number(m[1]) : null;
};
/** The one percentage a cell carries ("Religious Zionism 17.0%" is 17), or null when it carries none or several. */
export const pctIn = (s: string | undefined): number | null => {
  const all = [...(s ?? "").matchAll(/(\d+(?:\.\d+)?)%/g)];
  return all.length === 1 ? Number(all[0][1]) : null;
};
const blank = (s: string | undefined) => BLANK.test((s ?? "").trim());
/** Columns never shaded in a heat table: turnout is a share of eligible voters, not of the vote. */
export const unshaded = (header: string) => /turnout/i.test(header);

export type ChartForm = "lines" | "dots" | "heat" | "table";

export function formOf(c: Chart): ChartForm {
  if (c.kind !== "table" || !c.columns || c.columns.length < 2) return "table";
  const cells = c.rows.flatMap((r) => r.cells ?? []);
  const filled = cells.filter((x) => !blank(x));
  const share = (f: (s: string) => number | null) => (filled.length ? filled.filter((x) => f(x) !== null).length / filled.length : 0);
  const series = c.columns.length - 1;
  const timeRows = c.rows.length >= 4 && (/^(year|election|end of year)$/i.test(c.columns[0].trim()) || c.rows.every((r) => /\b(19|20)\d{2}\b/.test(r.label)));
  if (share(pct) === 1 && timeRows && series <= 4) return "lines";
  if (share(pct) === 1 && series >= 2 && series <= 4 && c.rows.length <= 12) return "dots";
  if (series >= 2 && share(pctIn) >= 0.5) return "heat";
  return "table";
}

export const scaleMax = (vals: number[]) => (Math.max(...vals) > 60 ? 100 : Math.max(20, Math.ceil(Math.max(...vals) / 10) * 10));

/** The value a heat table's darkest shade stands for: the scale maximum of the shaded cells. */
export function heatMax(c: Chart): number {
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map((x, i) => (unshaded(c.columns![i + 1] ?? "") ? null : pctIn(x))).filter((v): v is number => v !== null));
  return vals.length ? scaleMax(vals) : 0;
}

export const rowSource = (r: ChartRow) => r.source && r.url && <span className="rs"><a href={r.url}>{r.source}{r.date ? `, ${r.date}` : ""}</a></span>;

/** Mark styles by column, in order: what tells the series apart besides position. */
const MARKS = ["solid", "ring", "grey", "grey-ring"] as const;

function Legend({ columns }: { columns: string[] }) {
  return (
    <p className="fig-key cv-legend">
      {columns.map((h, i) => (
        <span key={h}>
          <i className={`cv-m ${MARKS[i]}`} aria-hidden="true" />
          {h}
        </span>
      ))}
    </p>
  );
}

const MONTH = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:\d{1,2},?\s+)?((?:19|20)\d{2})\b/i;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** A label as a fractional year ("June 2023" is 2023.42), or null when it names no year. A month counts only directly before its year. */
function timeOf(label: string): number | null {
  const m = MONTH.exec(label);
  if (m) return Number(m[2]) + MONTHS.indexOf(m[1].toLowerCase()) / 12;
  const y = /\b((?:19|20)\d{2})\b/.exec(label);
  return y ? Number(y[1]) + 0.4 : null;
}
/** A shorter x label: months cut to three letters. */
const shortLabel = (s: string) => s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]+\b/gi, "$1");

/** A dot plot: each row a 0-to-max track with one mark per column; every row shares one track width. */
export function DotPlot({ c }: { c: Chart }) {
  const cols = c.columns!.slice(1);
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pct).filter((v): v is number => v !== null));
  const max = scaleMax(vals);
  const x = (v: number) => `${(v / max) * 100}%`;
  // Each column keeps a fixed slot in the values, as wide as its longest cell.
  const widths = cols.map((_, i) => Math.max(2, ...c.rows.map((r) => (r.cells?.[i] ?? "").length)));
  // Only a run of dates makes lowest-to-highest a change; otherwise the marks stand alone.
  const dated = cols.every((h) => timeOf(h) !== null);
  return (
    <div className="cv-dots">
      <Legend columns={cols} />
      <ul>
        {c.rows.map((r: ChartRow) => {
          const vs = (r.cells ?? []).map(pct);
          const known = vs.filter((v): v is number => v !== null);
          return (
            <li key={r.label}>
              <span className="lab">
                {r.label}
                {rowSource(r)}
              </span>
              <span className="track" aria-hidden="true">
                {dated && known.length > 1 && <i className="span" style={{ left: x(Math.min(...known)), width: `${((Math.max(...known) - Math.min(...known)) / max) * 100}%` }} />}
                {vs.map((v, i) => (v === null ? null : <i key={i} className={`cv-m ${MARKS[i]}`} style={{ left: x(v) }} title={`${cols[i]}: ${r.cells![i]}`} />))}
              </span>
              <span className="vals" aria-hidden="true">
                {cols.map((_, i) => (
                  <b key={i} className={`v-${MARKS[i]}`} style={{ width: `${widths[i]}ch` }}>{vs[i] === null ? "" : r.cells![i]}</b>
                ))}
              </span>
            </li>
          );
        })}
        <li className="cv-axis" aria-hidden="true">
          <span className="lab" />
          <span className="ax"><span>0%</span><span>{max}%</span></span>
          <span />
        </li>
      </ul>
    </div>
  );
}

type Box = { W: number; H: number; P: { l: number; r: number; t: number; b: number } };
const WIDE: Box = { W: 640, H: 260, P: { l: 54, r: 176, t: 14, b: 30 } };
const NARROW: Box = { W: 360, H: 250, P: { l: 40, r: 52, t: 12, b: 28 } };

/** Text that fits `room` units at about `unit` units a character, cut at a word. */
function fit(s: string, room: number, unit: number) {
  const n = Math.floor(room / unit);
  if (s.length <= n) return s;
  const cut = s.slice(0, Math.max(1, n - 1));
  const at = cut.lastIndexOf(" ");
  return `${(at > 0 ? cut.slice(0, at) : cut).trim()}…`;
}

function Plot({ c, box, narrow }: { c: Chart; box: Box; narrow: boolean }) {
  const cols = c.columns!.slice(1);
  const { W, H, P } = box;
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pct).filter((v): v is number => v !== null));
  const max = scaleMax(vals);
  const n = c.rows.length;
  // Space the points by date when every row names a year, so uneven gaps between surveys stay uneven.
  const when = c.rows.map((r) => timeOf(r.label));
  const dated = when.every((t): t is number => t !== null) && when[n - 1]! > when[0]!;
  const x = (i: number) => P.l + (dated ? (when[i]! - when[0]!) / (when[n - 1]! - when[0]!) : i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const ticks = [0, max / 4, max / 2, (3 * max) / 4, max];
  // X labels: the first and last always; between them (wide drawing only), any that keeps clear of its neighbours.
  const gap = 70;
  const between = narrow ? [] : c.rows.slice(1, -1).reduce<number[]>((acc, _, k) => {
    const i = k + 1;
    return x(i) - x(acc.at(-1) ?? 0) >= gap && x(n - 1) - x(i) >= gap ? [...acc, i] : acc;
  }, []);
  const shown = [0, ...between, n - 1];
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
    <svg viewBox={`0 0 ${W} ${H}`} className={narrow ? "narrow" : "wide"}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid" x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} />
          <text className="tick" x={P.l - 6} y={y(t) + 4} textAnchor="end">{Math.round(t)}%</text>
        </g>
      ))}
      {shown.map((i) => (
        <text key={i} className="tick" x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>{shortLabel(c.rows[i].label)}</text>
      ))}
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
          <tspan className="v">{e.raw}</tspan>
          {!narrow && ` ${fit(e.h, P.r - 24 - e.raw.length * 8.5, 6.6)}`}
        </text>
      ))}
    </svg>
  );
}

/** Lines over a run of years or elections: one line per column, its latest value printed at the end. Phones get a narrower drawing of their own, so the text stays legible. */
export function Lines({ c }: { c: Chart }) {
  return (
    <div className="cv-lines" aria-hidden="true">
      <Plot c={c} box={WIDE} narrow={false} />
      <Plot c={c} box={NARROW} narrow />
      <Legend columns={c.columns!.slice(1)} />
    </div>
  );
}

/* The heat ramp runs between fixed endpoints (the light theme's text and paper), so a shade means one
   size in light, dark and print. Text on a cell is black or white by the cell's luminance. */
const HEAT_LO = [0xf6, 0xf5, 0xf1], HEAT_HI = [0x2a, 0x29, 0x25];
const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Shade for a percentage cell in a heat table, up to 62% strength at the scale maximum. */
export function heatStyle(cell: string | undefined, max: number): React.CSSProperties | undefined {
  const v = pctIn(cell);
  if (v === null || max <= 0) return undefined;
  const k = Math.round((Math.min(v, max) / max) * 62);
  const rgb = HEAT_LO.map((lo, i) => lo + (HEAT_HI[i] - lo) * (k / 100));
  const L = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  return { background: `color-mix(in oklab, #2a2925 ${k}%, #f6f5f1)`, color: L > 0.179 ? "#000" : "#fff" };
}
