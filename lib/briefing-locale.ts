import type { Briefing } from "./briefing";
import type { Lang } from "./i18n";
import { sentenceHash, translatedSentence } from "./briefing-verified";
/** New translations must match actual English bytes, not just a saved revision field. */
export function briefingSentence(
  sentence: Briefing["sentences"][number],
  lang: Lang,
) {
  if (lang === "en") return { text: sentence.text, state: "original" as const };
  if (sentence.sourceHash) {
    const hash = sentenceHash(sentence.text);
    const text = translatedSentence(
      sentence.text,
      lang,
      sentence.translations?.[lang],
      hash,
    );
    return text
      ? { text, state: "ready" as const }
      : { text: null, state: "pending" as const };
  }
  if (lang === "he" && sentence.textHe)
    return { text: sentence.textHe, state: "legacy" as const };
  return { text: null, state: "pending" as const };
}
