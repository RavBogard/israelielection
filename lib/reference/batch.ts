import { LANGS, type Lang } from "@/lib/i18n";
import {
  selectTranslation,
  type SourceDocument,
  type TranslationDocument,
} from "./translations";
export type BatchOptions = {
  ids: string[];
  langs: string[];
  maxEditions: number;
  maxMinutes: number;
};
export function referenceBatchPlan(
  sources: SourceDocument[],
  ledger: TranslationDocument[],
  options: BatchOptions,
) {
  if (
    !Number.isInteger(options.maxEditions) ||
    options.maxEditions < 1 ||
    options.maxEditions > 132 ||
    !Number.isInteger(options.maxMinutes) ||
    options.maxMinutes < 10 ||
    options.maxMinutes > 120
  )
    throw Error("invalid_batch_cap");
  const ids = [...new Set(options.ids)],
    langs = [...new Set(options.langs)];
  if (
    !ids.length ||
    ids.some((id) => !sources.some((s) => s.id === id)) ||
    !langs.length ||
    langs.some((l) => l === "en" || !LANGS.includes(l as Lang))
  )
    throw Error("unknown_batch_selection");
  const pending: { id: string; lang: Exclude<Lang, "en"> }[] = [],
    skipped: { id: string; lang: string }[] = [];
  for (const id of ids) {
    const source = sources.find((s) => s.id === id)!;
    for (const selected of langs) {
      const lang = selected as Exclude<Lang, "en">;
      if (selectTranslation(source, lang, ledger).state === "ready")
        skipped.push({ id, lang });
      else pending.push({ id, lang });
    }
  }
  return {
    selected: pending.slice(0, options.maxEditions),
    deferred: pending.slice(options.maxEditions),
    skipped,
  };
}
/** Includes ten seconds of local write/report headroom beyond the provider's540s maximum. */
export const canStartReferenceEdition = (deadline: number, now: number) =>
  deadline - now >= 550000;
