import type { Chart, ChartRow } from "./articles";

/*
 * Which visual form a data/charts table takes, decided from its cells, never set by hand
 * (components/article/ChartViz.tsx draws them):
 *   - every value a plain percentage, the rows a run of years or elections, four or more rows: lines;
 *   - every value a plain percentage, two to four columns: a dot plot, one mark per column;
 *   - the columns a run of three or more elections or dates, the cells carrying one percentage each
 *     (a list's name may come with it): transposed, so time runs across. Up to four rows become
 *     lines ("trend"); more become one sparkline per row on a shared scale ("sparks");
 *   - the rows a run of elections, cells carrying two percentages ("33.8% / 9.7%") under headings that
 *     name both ("Likud: settlements / Israel"): one small panel of two lines per such column ("pairs");
 *   - counts split into parts with a last "Total" column the parts add up to: one stacked bar per row;
 *   - two or more columns, mostly cells carrying one percentage: the table, each such cell shaded
 *     by its size (turnout columns stay unshaded, since turnout is a share of a different whole).
 * Anything else stays a plain table. A figure always keeps the table in its "The numbers" fold.
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
export const blank = (s: string | undefined) => BLANK.test((s ?? "").trim());
/** Columns never shaded in a heat table: turnout is a share of eligible voters, not of the vote. */
export const unshaded = (header: string) => /turnout/i.test(header);

export const scaleMax = (vals: number[]) => (Math.max(...vals) > 60 ? 100 : Math.max(20, Math.ceil(Math.max(...vals) / 10) * 10));

const MONTH = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:\d{1,2},?\s+)?((?:19|20)\d{2})\b/i;
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
/** A label as a fractional year ("June 2023" is 2023.42), or null when it names no year. A month counts only directly before its year. */
export function timeOf(label: string): number | null {
  const m = MONTH.exec(label);
  if (m) return Number(m[2]) + MONTHS.indexOf(m[1].toLowerCase()) / 12;
  const y = /\b((?:19|20)\d{2})\b/.exec(label);
  return y ? Number(y[1]) + 0.4 : null;
}
/** A heading that is only a date: "2022", "Nov 2022", "March 2, 2020" (not "Likud 2022"). */
export const isDate = (h: string) => /^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(?:\d{1,2},?\s+)?)?(?:19|20)\d{2}$/i.test(h.trim());

export type ChartForm = "lines" | "dots" | "trend" | "sparks" | "pairs" | "stack" | "heat" | "table";

/** A plain count ("90,600", "1,215", "42"), or null. */
export const count = (s: string | undefined): number | null => {
  const t = (s ?? "").trim();
  return /^\d{1,3}(,\d{3})+$|^\d+$/.test(t) ? Number(t.replace(/,/g, "")) : null;
};

export function formOf(c: Chart): ChartForm {
  if (c.kind !== "table" || !c.columns || c.columns.length < 2) return "table";
  const cells = c.rows.flatMap((r) => r.cells ?? []);
  const filled = cells.filter((x) => !blank(x));
  const share = (f: (s: string) => number | null) => (filled.length ? filled.filter((x) => f(x) !== null).length / filled.length : 0);
  const series = c.columns.length - 1;
  const timeRows = c.rows.length >= 4 && (/^(year|election|end of year)$/i.test(c.columns[0].trim()) || c.rows.every((r) => /\b(19|20)\d{2}\b/.test(r.label)));
  if (share(pct) === 1 && timeRows && series <= 4) return "lines";
  if (share(pct) === 1 && series >= 2 && series <= 4 && c.rows.length <= 12) return "dots";
  if (timeColumns(c) && share(pctIn) >= 0.8 && c.rows.every((r) => (r.cells ?? []).some((x) => pctIn(x) !== null))) return c.rows.length <= 4 ? "trend" : "sparks";
  if (timeRows && pairCols(c).length) return "pairs";
  if (stackable(c)) return "stack";
  if (series >= 2 && share(pctIn) >= 0.5) return "heat";
  return "table";
}

/** Two or three parts and a last "Total" column, every cell a count, each row's parts adding up to its total. */
function stackable(c: Chart) {
  const cols = c.columns!.slice(1);
  if (cols.length < 3 || cols.length > 4 || !/^total$/i.test(cols.at(-1)!.trim())) return false;
  return c.rows.every((r) => {
    const v = (r.cells ?? []).map(count);
    if (v.length !== cols.length || v.some((x) => x === null)) return false;
    const parts = (v as number[]).slice(0, -1).reduce((a, x) => a + x, 0);
    return Math.abs(parts - v.at(-1)!) <= v.at(-1)! * 0.005;
  });
}

export type Stack = { parts: string[]; max: number; rows: { row: ChartRow; values: number[]; cells: string[]; total: string }[] };
/** A stacked bar per row: the parts in column order, every row on one scale from zero to the largest total. */
export function stacks(c: Chart): Stack {
  const cols = c.columns!.slice(1);
  const rows = c.rows.map((row) => ({ row, values: row.cells!.slice(0, -1).map((x) => count(x)!), cells: row.cells!.slice(0, -1), total: row.cells!.at(-1)! }));
  return { parts: cols.slice(0, -1), max: Math.max(...c.rows.map((r) => count(r.cells!.at(-1))!)), rows };
}

/*
 * Heat shading: each cell mixes the theme's ink into its page ground, so more is always more ink, in
 * light and dark. The mix stops at HEAT_TOP, where ink text still reads at 4.5:1 in both themes
 * (pinned in chart-form.test.ts), so every cell keeps one text colour.
 */
export const HEAT_TOP = 42;
/** A cell's share of ink (0 to HEAT_TOP), or null when it carries no single percentage. */
export function heatShare(cell: string | undefined, max: number): number | null {
  const v = pctIn(cell);
  return v === null || max <= 0 ? null : Math.round((Math.min(v, max) / max) * HEAT_TOP);
}

/**
 * Text cut into lines at words: the first line `first` characters wide, the rest `rest`. When even the
 * first word does not fit the first line, that line stays empty and the text starts on the next.
 */
export function wrapWords(s: string, first: number, rest: number): string[] {
  const lines = [""];
  for (const w of s.split(/\s+/).filter(Boolean)) {
    const n = lines.length, cur = lines[n - 1], next = cur ? `${cur} ${w}` : w;
    if (next.length <= (n === 1 ? first : rest)) lines[n - 1] = next;
    else lines.push(w);
  }
  return lines;
}

/** Three or more columns after the first, each only a date, running forward in time. */
function timeColumns(c: Chart) {
  const cols = c.columns!.slice(1);
  if (cols.length < 3 || !cols.every(isDate)) return false;
  const ts = cols.map((h) => timeOf(h)!);
  return ts.every((t, i) => !i || t > ts[i - 1]);
}

/** A table with dates across the columns turned so the dates run down the rows: each old row becomes a column (a series). */
export function transpose(c: Chart): Chart {
  const cols = c.columns!.slice(1);
  return {
    ...c,
    columns: [c.columns![0], ...c.rows.map((r) => r.label)],
    rows: cols.map((h, j): ChartRow => ({ label: h, cells: c.rows.map((r) => r.cells?.[j] ?? "") })),
  };
}

/** The list named in a cell beside its percentage ("Blue and White 45.7%" is "Blue and White"), or "" when there is none. */
export const listIn = (cell: string) => cell.replace(/(\d+(?:\.\d+)?)%/, "").replace(/[()]/g, "").replace(/\s+/g, " ").trim();

/** A point: its column, value, the cell, and the percentage as the cell prints it ("17.0%"). */
export type SparkPoint = { j: number; v: number; raw: string; txt: string };
/** A list name under a sparkline: where it starts (0–1 along the track), how much room it has, its lane and alignment. */
export type SparkLabel = { list: string; at: number; width: number; lane: 0 | 1; end: boolean; from: string };
/** `flow`: where a name will not fit its room under the line, on a small phone (xs), a phone (s) or wider (l), the names are listed under it instead, each with the election it starts at. */
export type SparkRow = { row: ChartRow; pts: SparkPoint[]; runs: SparkPoint[][]; labels: SparkLabel[]; lanes: number; flow: { xs: boolean; s: boolean; l: boolean } };
export type Sparks = { cols: { label: string; at: number }[]; max: number; rows: SparkRow[] };

/** Room a list name at the right end is given, as a share of the track. */
const END_ROOM = 0.3;
/** Narrowest room a name is given before the names go on two lanes. */
const MIN_ROOM = 0.3;
/** About how wide a sparkline track is, in px, on a 320px phone, a 390px phone and wider, and a 12px name's width a character. */
const TRACK = { xs: 150, s: 220, l: 290 }, CH = 6.6;

/**
 * One sparkline per row on one shared scale: elections placed by date, a gap where a cell is blank,
 * and, where cells name their list, each change of list named under the line from the point it starts.
 */
export function sparks(c: Chart): Sparks {
  const heads = c.columns!.slice(1);
  const ts = heads.map((h) => timeOf(h)!);
  const at = (j: number) => (ts.length > 1 ? (ts[j] - ts[0]) / (ts[ts.length - 1] - ts[0]) : 0);
  const vals = c.rows.flatMap((r) => (r.cells ?? []).map(pctIn).filter((v): v is number => v !== null));
  const rows = c.rows.map((row): SparkRow => {
    const pts = (row.cells ?? []).map((raw, j) => ({ j, v: pctIn(raw), raw, txt: /\d+(?:\.\d+)?%/.exec(raw)?.[0] ?? "" })).filter((p): p is SparkPoint => p.v !== null);
    const runs = pts.reduce<SparkPoint[][]>((acc, p) => {
      const last = acc.at(-1);
      if (last && last.at(-1)!.j === p.j - 1) last.push(p);
      else acc.push([p]);
      return acc;
    }, []);
    const changes = pts.filter((p, k) => listIn(p.raw) && (k === 0 || listIn(pts[k - 1].raw) !== listIn(p.raw)));
    const place = (lanes: 1 | 2): SparkLabel[] =>
      changes.map((p, k) => {
        const lane = (lanes === 2 ? k % 2 : 0) as 0 | 1;
        const end = at(p.j) > 1 - END_ROOM / 2;
        const next = changes.slice(k + 1).find((_, n) => lanes === 1 || n % 2 === 1);
        const stop = next ? (at(next.j) > 1 - END_ROOM / 2 ? 1 - END_ROOM : at(next.j)) : 1;
        return { list: listIn(p.raw), at: at(p.j), width: end ? END_ROOM : Math.max(0, stop - at(p.j)), lane, end, from: heads[p.j] };
      });
    const one = place(1);
    const labels = one.every((l) => l.width >= MIN_ROOM || l.end) ? one : place(2);
    const fits = (px: number) => labels.every((l) => l.list.length * CH + 6 <= l.width * px);
    return { row, pts, runs, labels, lanes: labels.length ? Math.max(...labels.map((l) => l.lane)) + 1 : 0, flow: { xs: !fits(TRACK.xs), s: !fits(TRACK.s), l: !fits(TRACK.l) } };
  });
  return { cols: heads.map((label, j) => ({ label, at: at(j) })), max: vals.length ? scaleMax(vals) : 100, rows };
}

/** X labels that keep `gap` (a share of the track) clear of each other: the first and last always. */
export function clearLabels(ats: number[], gap: number): number[] {
  const n = ats.length;
  if (n < 2) return [...ats.keys()];
  const mid = ats.slice(1, -1).reduce<number[]>((acc, a, k) => (a - ats[acc.at(-1) ?? 0] >= gap && ats[n - 1] - a >= gap ? [...acc, k + 1] : acc), []);
  return [0, ...mid, n - 1];
}

export type BarRef = { label: string; value: number; heavy: boolean };

/**
 * Reference rules for a bar chart: a row that is the threshold comes out of the bars and is drawn
 * as a 1px rule; a chart of seats out of 120 gets the 61 majority as the 2px rule.
 */
export function barRefs(c: Chart, print: (r: ChartRow) => string): { rows: ChartRow[]; refs: BarRef[] } {
  const isRef = (r: ChartRow) => /^(the )?(electoral )?threshold$/i.test(r.label.trim()) && r.value !== undefined;
  const refs: BarRef[] = c.rows.filter(isRef).map((r) => ({ label: `${r.label}, ${print(r)}`, value: r.value!, heavy: false }));
  const max = c.max ?? Math.max(...c.rows.map((r) => r.value ?? 0));
  if (c.unit === "seats" && max >= 61) refs.push({ label: "61 seats, a majority", value: 61, heavy: true });
  return { rows: c.rows.filter((r) => !isRef(r)), refs };
}

const PAIR = /^(\d+(?:\.\d+)?%)\s*\/\s*(\d+(?:\.\d+)?%)$/;
const PAIR_HEAD = /^(.+?):\s*(.+?)\s*\/\s*(.+)$/;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/**
 * Columns (indexes into a row's cells) whose every filled cell is two percentages and whose heading
 * names the two ("Likud: settlements / Israel"), all naming the same two; the rest must carry no percentage.
 */
export function pairCols(c: Chart): number[] {
  const cols = c.columns!.slice(1);
  const idx = cols.flatMap((h, j) => (PAIR_HEAD.test(h) && c.rows.every((r) => blank(r.cells?.[j]) || PAIR.test((r.cells?.[j] ?? "").trim())) && c.rows.some((r) => PAIR.test((r.cells?.[j] ?? "").trim())) ? [j] : []));
  const names = new Set(idx.map((j) => PAIR_HEAD.exec(cols[j])!.slice(2).map((x) => x.toLowerCase()).join("/")));
  const others = cols.map((_, j) => j).filter((j) => !idx.includes(j));
  return names.size === 1 && others.every((j) => c.rows.every((r) => !/\d%/.test(r.cells?.[j] ?? ""))) ? idx : [];
}

export type Pairs = { series: [string, string]; max: number; panels: { title: string; chart: Chart }[] };
/**
 * A panel per pair column, each a two-line chart over the rows on one shared scale. The cells keep
 * their printed values. A heading that points back ("Those lists") takes its title from the text column before it.
 */
export function pairs(c: Chart): Pairs {
  const cols = c.columns!.slice(1), idx = pairCols(c);
  const [, , a, b] = PAIR_HEAD.exec(cols[idx[0]])!;
  const series: [string, string] = [cap(a), cap(b)];
  const panels = idx.map((j) => {
    const name = PAIR_HEAD.exec(cols[j])![1];
    const title = /^(those|these|the same)\b/i.test(name) && j > 0 && !idx.includes(j - 1) ? cols[j - 1] : name;
    const rows = c.rows.map((r): ChartRow => {
      const m = PAIR.exec((r.cells?.[j] ?? "").trim());
      return { label: r.label, cells: m ? [m[1], m[2]] : ["", ""] };
    });
    return { title, chart: { ...c, columns: [c.columns![0], ...series], rows } };
  });
  const vals = panels.flatMap((p) => p.chart.rows.flatMap((r) => r.cells!.map(pct).filter((v): v is number => v !== null)));
  return { series, max: scaleMax(vals), panels };
}
