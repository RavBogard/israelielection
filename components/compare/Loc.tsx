import { isUrl } from "@/lib/compare";
import { heDateText } from "@/lib/i18n/compare";
import type { Localized } from "@/lib/i18n/localize";

/**
 * Data text as a page prints it. A plain string is the English edition's text and prints as is. A Localized value
 * is the Hebrew edition's: Hebrew prints as is (with " (תרגום)" when it is a translated quote), and a field that has
 * no current Hebrew yet prints in English, marked <span lang="en" dir="ltr"> (docs/planning/2026-10-06-hebrew/OVERLAYS.md).
 */
export type Txt = string | Localized;

/** The text alone, for attributes (aria-label, title) and sorting. */
export const plain = (t: Txt): string => (typeof t === "string" ? t : t.text);

export default function Loc({ v }: { v: Txt }) {
  if (typeof v === "string") return <>{v}</>;
  if (v.lang === "en") return <span lang="en" dir="ltr">{v.text}</span>;
  return <>{v.translated ? `${v.text} (תרגום)` : v.text}</>;
}

/** English that stays English inside a Hebrew page (an outlet's name, a source line); a plain string in English. */
export function En({ children, lang }: { children: string; lang: "en" | "he" }) {
  return lang === "he" ? <span lang="en" dir="ltr">{children}</span> : <>{children}</>;
}

/**
 * A source line in Hebrew: the outlet as the data writes it (English, marked), then the date in Hebrew when it reads
 * whole ("Sep 22, 2026" → "22 בספטמבר 2026"). The link goes on the outlet, or on the date when there is no outlet.
 */
export function SourceHe({ source: s, url: u, date: d0 }: { source?: string | null; url?: string | null; date?: string | null }) {
  const source = s?.trim() || null;
  const date = d0?.trim() || null;
  const url = isUrl(u) ? u.trim() : null;
  const d = date && !(source ?? "").includes(date) ? heDateText(date) : null;
  if (!source && !d) return url ? <a href={url} rel="noopener" lang="en" dir="ltr">{url}</a> : null;
  return (
    <>
      {source && (url ? <a href={url} rel="noopener" lang="en" dir="ltr">{source}</a> : <span lang="en" dir="ltr">{source}</span>)}
      {source && d ? ", " : ""}
      {d && (!source && url ? <a href={url} rel="noopener"><Loc v={d} /></a> : <Loc v={d} />)}
    </>
  );
}
