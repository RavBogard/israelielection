import { EXPORTS } from "./i18n/exports";
import type { Lang } from "./i18n";
export type SourcedExport = {
  title: string;
  asOf: string;
  assumptions: string[];
  headers: string[];
  rows: (string | number | null)[][];
  sources: { label: string; url: string }[];
  view: string;
  lang?: Lang;
  originalEvidence?: boolean;
};
/** Quote every cell, preserve unknowns as words, and prevent spreadsheets interpreting source text as formulas. */
export function exportCsv(model: SourcedExport): string {
  const t = EXPORTS[model.lang ?? "en"];
  const cell = (v: string | number | null) => {
    const text = v === null ? t.unknown : String(v);
    return `"${(typeof v === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text).replace(/"/g, '""')}"`;
  };
  const rows = [
    [model.title],
    [t.asOf, model.asOf],
    ...(model.originalEvidence ? [[t.original]] : []),
    ...model.assumptions.map((s) => [t.assumption, s]),
    model.headers,
    ...model.rows,
    [t.sources],
    ...model.sources.map((s) => [s.label, s.url]),
    [t.view, `https://www.israelielection.org${model.view}`],
    [t.attribution, t.credit],
  ];
  return `\uFEFF${rows.map((row) => row.map(cell).join(",")).join("\r\n")}\r\n`;
}
