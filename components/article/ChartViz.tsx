
import type { Chart, ChartRow } from "@/lib/articles";
import { clearLabels, pct, pctIn, scaleMax, sparks, timeOf, unshaded } from "@/lib/chart-form";

/*
 * Visual forms for a data/charts table; lib/chart-form.ts decides which one a table takes. The
 * table itself always stays on the page (folded under the figure when a figure draws it), so every
 * number keeps its exact printed value.
 */

export { formOf, pct, pctIn, scaleMax, unshaded, type ChartForm } from "@/lib/chart-form";

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

/** A shorter x label: months cut to three letters. */
const shortLabel = (s: string) => s.replace(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]+\b/gi, "$1");

/** Where a dot plot prints each value beside its mark: the lowest to its left, the highest to its right, any between above, then below. */
type Side = "l" | "r" | "t" | "b";
function sidesOf(vs: (number | null)[]) {
  const known = vs.map((v, i) => ({ v, i })).filter((p): p is { v: number; i: number } => p.v !== null).sort((a, b) => a.v - b.v || a.i - b.i);
  const side: Record<number, Side> = {};
  if (known.length === 1) side[known[0].i] = "r";
  else known.forEach((p, k) => (side[p.i] = k === 0 ? "l" : k === known.length - 1 ? "r" : k === 1 ? "t" : "b"));
  return side;
}

/** A dot plot: each row a 0-to-max track with one mark per column, each value printed beside its mark; every row shares one track width. */
export function DotPlot({ c }: { c: Chart }) {
  const cols = c.columns!.slice(1);
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pct).filter((v): v is number => v !== null));
  const max = scaleMax(vals);
  const x = (v: number) => `${(v / max) * 100}%`;
  // Only a run of dates makes lowest-to-highest a change; otherwise the marks stand alone.
  const dated = cols.every((h) => timeOf(h) !== null);
  const lanes = Math.max(...c.rows.map((r) => (r.cells ?? []).filter((v) => pct(v) !== null).length));
  return (
    <div className={`cv-dots${lanes >= 3 ? " up" : ""}${lanes >= 4 ? " down" : ""}`}>
      <Legend columns={cols} />
      <ul>
        {c.rows.map((r: ChartRow) => {
          const vs = (r.cells ?? []).map(pct);
          const known = vs.filter((v): v is number => v !== null);
          const side = sidesOf(vs);
          return (
            <li key={r.label}>
              <span className="lab">
                {r.label}
                {rowSource(r)}
              </span>
              <span className="track" aria-hidden="true">
                <span className="tk">
                  {dated && known.length > 1 && <i className="span" style={{ left: x(Math.min(...known)), width: `${((Math.max(...known) - Math.min(...known)) / max) * 100}%` }} />}
                  {vs.map((v, i) => (v === null ? null : <i key={i} className={`cv-m ${MARKS[i]}`} style={{ left: x(v) }} title={`${cols[i]}: ${r.cells![i]}`} />))}
                  {vs.map((v, i) => (v === null ? null : <b key={i} className={`dv dv-${side[i]} v-${MARKS[i]}`} style={{ left: x(v) }}>{r.cells![i]}</b>))}
                </span>
              </span>
            </li>
          );
        })}
        <li className="cv-axis" aria-hidden="true">
          <span className="lab" />
          <span className="ax"><span>0%</span><span>{max}%</span></span>
        </li>
      </ul>
    </div>
  );
}

/**
 * Elections across, one sparkline per row, every row on the same 0-to-max scale so heights compare
 * down the column. The first and last values are printed at either end; where the cells name the
 * list (the largest list in a town, say), each change of list is named under the line from its point.
 */
export function Sparklines({ c }: { c: Chart }) {
  const { cols, max, rows } = sparks(c);
  const at = (a: number) => `${a * 100}%`;
  const top = (v: number) => `${(1 - v / max) * 100}%`;
  // X labels: all that keep about 70px clear on a desktop track, the first and last on phones.
  const shown = new Set(clearLabels(cols.map((h) => h.at), 0.2));
  return (
    <div className="cv-sparks" aria-hidden="true">
      <ul>
        {rows.map(({ row, pts, runs, labels, lanes }) => (
          <li key={row.label} className={lanes ? `ln-${lanes}` : undefined}>
            <span className="lab">
              {row.label}
              {rowSource(row)}
            </span>
            <span className="v0">{pts.length > 1 ? pts[0].txt : ""}</span>
            <span className="sp">
              <span className="tk">
                {cols.map((h) => <i key={h.label} className="g" style={{ left: at(h.at) }} />)}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  {runs.filter((r) => r.length > 1).map((r) => (
                    <path key={r[0].j} d={r.map((p, k) => `${k ? "L" : "M"}${(cols[p.j].at * 100).toFixed(2)},${((1 - p.v / max) * 100).toFixed(2)}`).join("")} vectorEffect="non-scaling-stroke" />
                  ))}
                </svg>
                {pts.map((p) => <i key={p.j} className="pt" style={{ left: at(cols[p.j].at), top: top(p.v) }} title={`${cols[p.j].label}: ${p.raw}`} />)}
              </span>
              {labels.length > 0 && (
                <span className="lists">
                  {labels.map((l) => (
                    <span key={`${l.list}-${l.at}`} className={`ls ln${l.lane}${l.end ? " end" : ""}`} style={l.end ? { right: 0, maxWidth: at(l.width) } : { left: at(l.at), maxWidth: at(l.width) }} title={l.list}>{l.list}</span>
                  ))}
                </span>
              )}
            </span>
            <span className="v1">{pts.length ? pts.at(-1)!.txt : ""}</span>
          </li>
        ))}
        <li className="cv-axis">
          <span className="lab">Every row 0 to {max}%</span>
          <span className="v0" />
          <span className="ax">
            {cols.map((h, j) => (
              <span key={h.label} className={`${j === 0 ? "first" : j === cols.length - 1 ? "last" : "mid"}${shown.has(j) ? "" : " crowd"}`} style={{ left: at(h.at) }}>{shortLabel(h.label)}</span>
            ))}
          </span>
          <span className="v1" />
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
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pctIn).filter((v): v is number => v !== null));
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
      const last = [...c.rows.keys()].reverse().find((i) => pctIn(c.rows[i].cells?.[s]) !== null);
      const v = last === undefined ? null : pctIn(c.rows[last].cells![s])!;
      return last === undefined || v === null ? null : { s, h, v, raw: pct(c.rows[last].cells![s]) !== null ? c.rows[last].cells![s].trim() : (/\d+(?:\.\d+)?%/.exec(c.rows[last].cells![s])?.[0] ?? `${v}%`), i: last };
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
        const pts = c.rows.map((r, i) => ({ i, v: pctIn(r.cells?.[s]) })).filter((p): p is { i: number; v: number } => p.v !== null);
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
