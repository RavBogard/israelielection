import type { Lang } from "./index";
import { editionText } from "./edition-text";

/** Static authored message templates. Dynamic values are substituted after translation. */
export function ui(lang: Lang, source: string, ...values: (string | number)[]): string {
  const text = lang === "ar" || lang === "fa" ? editionText<Record<string, string>>(lang, "messages")[source] ?? source : source;
  return text.replace(/\{(\d+)\}/g, (_, index: string) => String(values[Number(index)]));
}
