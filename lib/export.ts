export type SourcedExport = { title: string; asOf: string; assumptions: string[]; headers: string[]; rows: (string | number | null)[][]; sources: { label: string; url: string }[]; view: string };
/** Quote every cell, preserve unknowns as words, and prevent spreadsheets interpreting source text as formulas. */
export function exportCsv(model: SourcedExport): string {
  const cell = (v: string | number | null) => { const text = v === null ? "Not available" : String(v); return `"${(typeof v === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replace(/"/g,'""')}"`; };
  const rows = [[model.title], ["Data as of",model.asOf], ...model.assumptions.map((s)=>["Assumption / limitation",s]), model.headers, ...model.rows, ["Sources"], ...model.sources.map((s)=>[s.label,s.url]), ["View",`https://www.israelielection.org${model.view}`], ["Attribution","Israel Votes 2026. Original text is CC BY-NC 4.0, credit Rabbi Daniel Bogard; third-party source material retains its own rights."]];
  return `\uFEFF${rows.map((row)=>row.map(cell).join(',')).join('\r\n')}\r\n`;
}
