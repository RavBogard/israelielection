/**
 * Parser for the seat-projection tables on Wikipedia's "Opinion polling for the 2026 Israeli
 * legislative election". Deterministic on purpose: numbers are read, never generated.
 * Wikitext conventions (verified 2026-10-04): dates are {{Opdrts|start|end|Mon|Year}}; merged
 * lists use colspan=2; below-threshold readings are {{small|(1.3%)}}; missing values are {{n/a}};
 * non-poll event rows span ~22 columns; scenario variants share cells via rowspan.
 */

export type ColumnKind = "date" | "firm" | "publisher" | "sample" | "party" | "others" | "gov" | "other";
export type Column = { kind: ColumnKind; target: string | null; label: string };

export type Reading = { seats: number } | { below: true; pct: string | null } | null;

export type RawPoll = {
  /** ISO date of the last fieldwork day. */
  end: string;
  fieldwork: string;
  firm: string;
  publisherTarget: string | null;
  publisherLabel: string;
  sample: number | null;
  ref: { url: string | null; date: string | null; work: string | null };
  /** Reading per header link target (sub-columns of one list are combined). */
  readings: Map<string, Reading>;
  /** The row is shaded #FFD, the "Exit poll" colour key on these tables (the 2022 page's election-night rows). */
  shaded: boolean;
};

export type ParsedTable = { columns: Column[]; polls: RawPoll[]; skippedRows: number };

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Splits on `sep` only outside [[links]], {{templates}} and <ref>…</ref>. */
export function topSplit(s: string, sep: string): string[] {
  const out: string[] = [];
  let depthL = 0, depthT = 0, inRef = false, cur = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (!inRef && /^<ref[\s>]/i.test(s.slice(i, i + 5))) {
      const close = s.indexOf(">", i);
      if (close > 0 && s[close - 1] !== "/") inRef = true; // <ref name=x/> is self-closing
    }
    if (inRef && s.slice(i, i + 6).toLowerCase() === "</ref>") { inRef = false; cur += s.slice(i, i + 6); i += 5; continue; }
    if (two === "[[") { depthL++; cur += two; i++; continue; }
    if (two === "]]" && depthL) { depthL--; cur += two; i++; continue; }
    if (two === "{{") { depthT++; cur += two; i++; continue; }
    if (two === "}}" && depthT) { depthT--; cur += two; i++; continue; }
    if (!depthL && !depthT && !inRef && s.startsWith(sep, i)) { out.push(cur); cur = ""; i += sep.length - 1; continue; }
    cur += s[i];
  }
  out.push(cur);
  return out;
}

/** Removes a balanced {{name…}} template wherever it appears. */
function dropTemplate(s: string, name: RegExp): string {
  let out = s;
  for (;;) {
    const m = out.match(new RegExp(`\\{\\{\\s*(?:${name.source})\\s*[|}]`, "i"));
    if (!m || m.index === undefined) return out;
    let depth = 0, j = m.index;
    for (; j < out.length; j++) {
      if (out.startsWith("{{", j)) { depth++; j++; }
      else if (out.startsWith("}}", j)) { depth--; j++; if (!depth) break; }
    }
    out = out.slice(0, m.index) + out.slice(j + 1);
  }
}

export function stripNoise(s: string): string {
  let t = s.replace(/<!--[\s\S]*?-->/g, "");
  t = t.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  t = dropTemplate(t, /efn/);
  return t.replace(/'''?/g, "").replace(/<br\s*\/?>/gi, " ").trim();
}

/** First [[Target|label]] in s → { target, label }. */
export function firstLink(s: string): { target: string; label: string } | null {
  const m = s.match(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
  return m ? { target: m[1].trim(), label: (m[2] ?? m[1]).replace(/''/g, "").trim() } : null;
}
function allLinks(s: string): string[] {
  return [...s.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)].map((m) => m[1].trim());
}

type Cell = { attrs: string; value: string; colspan: number; rowspan: number };

function parseCell(raw: string): Cell {
  const parts = topSplit(raw, "|");
  let attrs = "", value = raw;
  if (parts.length > 1 && /^\s*(style|colspan|rowspan|class|align|bgcolor|width|scope|data-sort-value)\s*=/i.test(parts[0])) {
    attrs = parts[0];
    value = parts.slice(1).join("|");
  }
  const num = (k: string) => Number(attrs.match(new RegExp(`${k}\\s*=\\s*"?(\\d+)`, "i"))?.[1] ?? 1);
  return { attrs, value: value.trim(), colspan: num("colspan"), rowspan: num("rowspan") };
}

/**
 * Splits a table body into rows of raw cell strings, joining multi-line cells. `attrs`, when given, receives
 * each row's attributes from its "|-" line (style="background:#FFD"), index for index with the rows.
 */
function rowsOf(table: string, marker: "|" | "!", attrs?: string[]): string[][] {
  const rows: string[][] = [];
  let row: string[] | null = null;
  for (const line of table.split("\n")) {
    if (line.startsWith("|-")) { row = []; rows.push(row); attrs?.push(line.slice(2)); continue; }
    if (line.startsWith("{|") || line.startsWith("|}") || line.startsWith("|+")) continue;
    if (!row) { row = []; rows.push(row); attrs?.push(""); }
    if (line.startsWith(marker)) row.push(...topSplit(line.slice(1), marker + marker));
    else if ((line.startsWith("|") || line.startsWith("!")) === false && row.length) row[row.length - 1] += "\n" + line;
  }
  return rows;
}

function headerColumns(table: string): Column[] {
  const first = rowsOf(table.split(/\n\|-/)[0], "!").find((r) => r.length) ?? [];
  const cols: Column[] = [];
  for (const raw of first) {
    const c = parseCell(raw);
    const text = stripNoise(c.value).replace(/\s+/g, " ");
    const links = allLinks(c.value);
    let kind: ColumnKind = "other";
    if (/fieldwork/i.test(text)) kind = "date";
    else if (/polling firm/i.test(text)) kind = "firm";
    else if (/publisher/i.test(text)) kind = "publisher";
    else if (/sample/i.test(text)) kind = "sample";
    else if (/^others/i.test(text)) kind = "others";
    else if (/^gov/i.test(text)) kind = "gov";
    else if (links.length) kind = "party";
    for (let k = 0; k < c.colspan; k++) {
      const target = kind === "party" ? (links[Math.min(k, links.length - 1)] ?? null) : null;
      cols.push({ kind, target, label: text });
    }
  }
  return cols;
}

export function parseOpdrts(s: string): { end: string; fieldwork: string } | null {
  const m = s.match(/\{\{\s*Opdrts\s*\|([^|}]*)\|([^|}]*)\|([^|}]*)\|([^|}]*)/i);
  if (!m) return null;
  const [, a, b, mon, yr] = m.map((x) => x.trim());
  const month = MONTHS[mon.slice(0, 3).toLowerCase()];
  const year = Number(yr), endDay = Number(b);
  if (!month || !year || !endDay) return null;
  const end = `${year}-${pad(month)}-${pad(endDay)}`;
  const startDay = Number(a);
  let fieldwork = `${MON[month - 1]} ${endDay}, ${year}`;
  if (startDay && startDay !== endDay) {
    fieldwork = startDay < endDay
      ? `${MON[month - 1]} ${startDay}–${endDay}, ${year}`
      : `${MON[(month + 10) % 12]} ${startDay}–${MON[month - 1]} ${endDay}, ${year}`;
  }
  return { end, fieldwork };
}

/** "4 October 2026", "October 4, 2026" or "2026-10-04" → ISO, else null. */
export function parseRefDate(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return t;
  m = t.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (m && MONTHS[m[2].slice(0, 3).toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[2].slice(0, 3).toLowerCase()])}-${pad(+m[1])}`;
  m = t.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m && MONTHS[m[1].slice(0, 3).toLowerCase()]) return `${m[3]}-${pad(MONTHS[m[1].slice(0, 3).toLowerCase()])}-${pad(+m[2])}`;
  return null;
}

/** A named parameter of the first {{cite …}} in s, split only on top-level pipes (values may hold [[a|b]] links). */
function citeField(s: string, field: string): string | null {
  const start = s.search(/\{\{\s*cite/i);
  if (start < 0) return null;
  let depth = 0, end = start;
  for (; end < s.length; end++) {
    if (s.startsWith("{{", end)) { depth++; end++; }
    else if (s.startsWith("}}", end)) { depth--; end++; if (!depth) break; }
  }
  const inner = s.slice(start + 2, end - 1);
  for (const part of topSplit(inner, "|").slice(1)) {
    const m = part.match(/^\s*([\w-]+)\s*=\s*([\s\S]*)$/);
    if (m && m[1].toLowerCase() === field) return m[2].trim() || null;
  }
  return null;
}

export function parseReading(raw: string): Reading {
  const v = stripNoise(raw);
  if (!v || /^\{\{\s*(n\/a|dunno)/i.test(v) || /^[–—-]$/.test(v)) return null;
  const small = v.match(/^\{\{\s*small\s*\|\s*\(([^)]*)\)\s*\}\}$/i);
  if (small) return { below: true, pct: small[1].includes("%") ? small[1].trim() : null };
  const n = v.match(/^(\d+)$/);
  if (n) return Number(n[1]) === 0 ? { below: true, pct: null } : { seats: Number(n[1]) };
  return null;
}

function combine(a: Reading, b: Reading): Reading {
  if (!a) return b;
  if (!b) return a;
  const sa = "seats" in a ? a.seats : 0, sb = "seats" in b ? b.seats : 0;
  return sa + sb > 0 ? { seats: sa + sb } : a;
}

export function parseTable(table: string): ParsedTable {
  const columns = headerColumns(table);
  const body = table.split(/\n\|-/).slice(1).join("\n|-");
  const attrs: string[] = [];
  const all = rowsOf("|-\n" + body, "|", attrs);
  const shadedRow = all.map((_, i) => /background:\s*#(?:ffd|ffffdd)\b/i.test(attrs[i] ?? "")).filter((_, i) => all[i].length);
  const rows = all.filter((r) => r.length);
  // pending[i] = how many more rows column i is filled by a rowspan from above.
  const pending: number[] = new Array(columns.length).fill(0);
  const polls: RawPoll[] = [];
  let skippedRows = 0;
  for (const [rowIndex, raw] of rows.entries()) {
    const placed: (Cell | null)[] = new Array(columns.length).fill(null);
    const occupied = pending.map((n) => n > 0);
    const continuation = occupied[0];
    for (let i = 0; i < pending.length; i++) if (occupied[i]) pending[i]--;
    let col = 0;
    for (const r of raw) {
      while (occupied[col]) col++;
      const c = parseCell(r);
      for (let k = 0; k < c.colspan && col + k < columns.length; k++) {
        if (k === 0) placed[col] = c;
        if (c.rowspan > 1) pending[col + k] = c.rowspan - 1;
      }
      col += c.colspan;
    }

    const cellOf = (kind: ColumnKind) => placed[columns.findIndex((c) => c.kind === kind)];
    const dateCell = cellOf("date");
    const date = dateCell ? parseOpdrts(dateCell.value) : null;
    // Scenario variants, event rows (one wide cell), and rows without a parsable date are skipped.
    if (continuation || !date || raw.length < columns.length / 2) { skippedRows++; continue; }

    const pub = cellOf("publisher")?.value ?? "";
    const link = firstLink(stripNoise(pub));
    const readings = new Map<string, Reading>();
    columns.forEach((c, i) => {
      if (c.kind !== "party" || !c.target) return;
      const cell = placed[i];
      if (!cell) return; // covered by a colspan to its left
      readings.set(c.target, combine(readings.get(c.target) ?? null, parseReading(cell.value)));
      // A merged cell (colspan) covers every sub-column; record it once under the first target.
    });
    const sampleTxt = stripNoise(cellOf("sample")?.value ?? "").replace(/,/g, "");
    polls.push({
      end: date.end,
      fieldwork: date.fieldwork,
      firm: stripNoise(cellOf("firm")?.value ?? ""),
      publisherTarget: link?.target ?? null,
      publisherLabel: link?.label ?? stripNoise(pub),
      sample: /^\d+$/.test(sampleTxt) ? Number(sampleTxt) : null,
      ref: { url: citeField(pub, "url"), date: parseRefDate(citeField(pub, "date")), work: citeField(pub, "work") ?? citeField(pub, "website") ?? citeField(pub, "publisher") },
      readings,
      shaded: shadedRow[rowIndex],
    });
  }
  return { columns, polls, skippedRows };
}

/** All seat-projection tables in the "=== 2026 ===" subsection of "== Seat projections ==". */
export function seatTables(wikitext: string): string[] {
  const start = wikitext.indexOf("== Seat projections ==");
  if (start < 0) throw new Error('Section "== Seat projections ==" not found');
  const sub = wikitext.indexOf("=== 2026 ===", start);
  const nextSection = wikitext.slice(sub + 12).search(/\n===? ?[^=]/);
  const sec = wikitext.slice(sub, nextSection < 0 ? undefined : sub + 12 + nextSection);
  const tables: string[] = [];
  let i = 0;
  while ((i = sec.indexOf("{|", i)) >= 0) {
    const j = sec.indexOf("\n|}", i);
    tables.push(sec.slice(i, j < 0 ? undefined : j));
    i = j < 0 ? sec.length : j + 3;
  }
  return tables;
}
