import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

/**
 * Data text as an edition shows it. In the Hebrew edition a field that fell back to English (no current Hebrew in
 * data/he/**) is marked <span lang="en" dir="ltr">, and a translated quote takes " (תרגום)". In English it is plain text.
 */
export function Loc({ v, page }: { v: { text: string; lang: Lang; translated?: boolean }; page: Lang }) {
  if (page === "en" || v.lang === page) return <>{v.text}{v.translated ? " (תרגום)" : ""}</>;
  return <span lang="en" dir="ltr">{v.text}</span>;
}

/** English text inside a Hebrew page (a citation, a source name), marked so; plain in English. */
export function En({ page, children }: { page: Lang; children: ReactNode }) {
  return page === "en" ? <>{children}</> : <span lang="en" dir="ltr">{children}</span>;
}

/** A phrasebook sentence with **bold** parts (lib/i18n/builder.ts). */
export function rich(s: string): ReactNode[] {
  return s.split(/\*\*(.+?)\*\*/).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));
}
