import "./i18n/overlays";
import { parties } from "./data";
import { editionPath, isLang, type Lang } from "./i18n";
import builder from "./i18n/builder";
import { partyText } from "./i18n/overlay-text";
import { EXPORTS, exportHeader } from "./i18n/exports";
import type { SourcedExport } from "./export";

/** Translate structural labels only. Source evidence remains explicitly original. */
export function localizeExport(
  model: SourcedExport,
  kind: string,
  requested: string | null,
): SourcedExport {
  const lang: Lang = requested && isLang(requested) ? requested : "en";
  if (lang === "en") return model;
  const t = EXPORTS[lang];
  const names = new Map(
    parties.map((p) => [p.name, partyText(p, "name", lang).text]),
  );
  const roles = new Map(
    Object.entries(builder.en.roles).map(([key, value]) => [
      value,
      builder[lang].roles[key as keyof typeof builder.en.roles],
    ]),
  );
  const listIndex = model.headers.indexOf("List"),
    roleIndex = model.headers.indexOf("Assigned role");
  return {
    ...model,
    lang,
    originalEvidence: true,
    title: t[kind as "issue" | "coalition" | "locality"] ?? model.title,
    headers: model.headers.map((h) => exportHeader(h, lang)),
    rows: model.rows.map((row) =>
      row.map((cell, index) =>
        typeof cell === "string"
          ? index === roleIndex
            ? (roles.get(cell) ?? cell)
            : index === listIndex && kind !== "locality"
              ? (names.get(cell) ?? cell)
              : cell
          : cell,
      ),
    ),
    view: editionPath(model.view, lang) ?? model.view,
  };
}
