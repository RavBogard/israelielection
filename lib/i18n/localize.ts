import type { Lang } from "./index";

/**
 * Hebrew data overlays (PLAN.md section 4). data/he/** mirrors only the translated fields of an English data
 * file, keyed by item id, then by field path ("who", "issues.0.text"). Each field stores the Hebrew and `src`,
 * an 8-character hash of the English it answers to. When the English changes, the hash goes stale and the
 * page falls back to English (rendered by the caller in <span lang="en" dir="ltr">) until the Hebrew is redone.
 * Hebrew is written fresh, not translated sentence by sentence; the hash only records which English item it answers.
 */

/** One translated field. `machine` marks job output awaiting Daniel's review. */
export type HeField = { text: string; src: string; machine?: boolean };

/** An overlay file: item id → field path → Hebrew. */
export type HeOverlay = Record<string, Record<string, HeField>>;

/** A field as shown: the text and the language it is actually in. */
export type Localized = { text: string; lang: Lang };

/** FNV-1a 32-bit over the UTF-16 code units, as 8 hex characters. Stable across server, browser and the jobs. */
export function srcHash(english: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < english.length; i++) {
    h ^= english.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Reads a dotted field path ("issues.0.text") from an item; undefined when absent or not a string. */
export function fieldAt(item: unknown, path: string): string | undefined {
  let v: unknown = item;
  for (const key of path.split(".")) {
    if (v == null || typeof v !== "object") return undefined;
    v = (v as Record<string, unknown>)[key];
  }
  return typeof v === "string" ? v : undefined;
}

/** The text to show for one field: the Hebrew when asked for and current, else the English. */
export function localizeText(english: string, he: HeField | undefined, lang: Lang): Localized {
  if (lang === "he" && he && he.text && he.src === srcHash(english)) return { text: he.text, lang: "he" };
  return { text: english, lang: "en" };
}

/** One field of one item, by id and field path. Missing English gives empty English text. */
export function localize(item: { id: string }, field: string, overlay: HeOverlay | undefined, lang: Lang): Localized {
  return localizeText(fieldAt(item, field) ?? "", overlay?.[item.id]?.[field], lang);
}

/** A localizer bound to one data file's overlay: `const t = localizer(partiesHe, lang); t(party, "who")`. */
export function localizer(overlay: HeOverlay | undefined, lang: Lang) {
  return (item: { id: string }, field: string): Localized => localize(item, field, overlay, lang);
}

export type OverlayProblem = { id: string; field: string; problem: "stale" | "orphan" };

/**
 * Overlay fields that no longer answer to the English: `stale` when the English changed since the Hebrew was
 * written (hash mismatch), `orphan` when the item or field no longer exists. Machine translations are checked too;
 * the jobs refresh their hashes when they rewrite them. The data tests fail on any problem.
 */
export function overlayProblems(items: readonly { id: string }[], overlay: HeOverlay): OverlayProblem[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: OverlayProblem[] = [];
  for (const [id, fields] of Object.entries(overlay)) {
    const item = byId.get(id);
    for (const [field, he] of Object.entries(fields)) {
      const english = item ? fieldAt(item, field) : undefined;
      if (english === undefined) out.push({ id, field, problem: "orphan" });
      else if (he.src !== srcHash(english)) out.push({ id, field, problem: "stale" });
    }
  }
  return out;
}

/** Builds an overlay entry for the given English (for the jobs and for test fixtures). */
export function heField(english: string, text: string, machine?: boolean): HeField {
  return machine ? { text, src: srcHash(english), machine: true } : { text, src: srcHash(english) };
}
