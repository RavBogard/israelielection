import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n";
import { blocText, partyText, pollsterText } from "@/lib/i18n/overlay-text";
import { HE_BLOC } from "@/lib/i18n/polls";
import type { BlocId } from "@/lib/types";

/** The polls desk's names in the edition's language: outlets, lists and blocs. English passes through unchanged. */

/** An outlet or firm as Israelis credit it ("Channel 12" → "חדשות 12"); English when the overlay has no entry. */
export const pollsterName = (name: string, lang: Lang) => (lang === "he" ? pollsterText(name, "he").text : name);

/** A list's name; English when the overlay has no current entry. */
export const partyName = (p: { id: string; name: string }, lang: Lang) => (lang === "he" ? partyText(p, "name", "he").text : p.name);

/** A bloc's label: the overlay's Hebrew if written, else the names Daniel confirmed (STYLE.md). */
export function blocName(b: { id: string; label: string }, lang: Lang): string {
  if (lang !== "he") return b.label;
  const l = blocText(b, "he");
  return l.lang === "he" ? l.text : HE_BLOC[b.id as BlocId] ?? b.label;
}

const HEBREW = /[֐-׿]/;

/**
 * A data name inside Hebrew text. A name with no Hebrew letters (an English fallback, or a Latin brand such as i24NEWS)
 * is marked lang="en" and isolated left to right, as OVERLAYS.md asks for English fallbacks. English pages render the plain text.
 */
export function Tx({ text, lang }: { text: string; lang: Lang }) {
  if (lang !== "he" || HEBREW.test(text)) return <>{text}</>;
  return (
    <span lang="en" dir="ltr">
      {text}
    </span>
  );
}

/** A signed figure or a range ("−1.2", "49–53") kept left to right inside Hebrew (<bdi dir="ltr">); plain on English pages. */
export function Ltr({ children, lang }: { children: ReactNode; lang: Lang }) {
  return lang === "he" ? <bdi dir="ltr">{children}</bdi> : <>{children}</>;
}

type Anchor = "start" | "middle" | "end";
/**
 * SVG text props. In Hebrew a chart keeps a left-to-right box (time runs left to right; polls.css and bloc-race.css set
 * direction: ltr on the svg), and a Hebrew label sets its own direction with the anchor mirrored, so it lands where the
 * English one does. English gets exactly the anchor it had (none when it had none).
 */
export function svgText(he: boolean, anchor?: Anchor): { direction?: "rtl"; textAnchor?: Anchor } {
  if (!he) return anchor ? { textAnchor: anchor } : {};
  return { direction: "rtl", textAnchor: anchor === "end" ? "start" : anchor === "middle" ? "middle" : "end" };
}
