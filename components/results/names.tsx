import type { ReactNode } from "react";
import { ballotLists } from "@/lib/ballot";
import type { Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/i18n/localize";
import { overlays, blocText, partyText, pollsterText } from "@/lib/i18n/overlays";
import { localize } from "@/lib/i18n/localize";
import { lettersOf } from "@/lib/letters";
import resultsText from "@/lib/i18n/results";
import type { ResultsConfig } from "@/lib/results";

/**
 * Names on the election-night page. In Hebrew: the overlay's Hebrew first, then the media short names in
 * lib/i18n/results.ts (keyed by ballot letters), then, for a list the site does not track, the committee's own
 * Hebrew slip name for its letters (data/ballot-directory.json). English stays the English data.
 */


/** A tracked list's name. */
export function listName(party: { id: string; name: string }, lang: Lang): Localized {
  if (lang === "en") return { text: party.name, lang: "en" };
  const o = partyText(party, "name", lang);
  if (o.lang === lang) return o;
  const short = resultsText[lang].lists[lettersOf[party.id]];
  return short ? { text: short, lang } : o;
}

/** Any list by its ballot letters: a tracked list's name, else the committee's Hebrew slip name, else the letters. */
export function lettersName(letters: string, config: ResultsConfig, names: Record<string, string>, lang: Lang): Localized {
  const id = config.letters[letters];
  if (lang === "en") return { text: names[id] ?? letters, lang: "en" };
  if (id && names[id]) return { text: names[id], lang };
  const slip = ballotLists.find((l) => l.letters === letters)?.hebrew;
  return { text: slip ?? letters, lang: "he" };
}

/** A bloc's label. */
export function blocName(bloc: { id: string; label: string }, lang: Lang): Localized {
  if (lang === "en") return { text: bloc.label, lang: "en" };
  const o = blocText(bloc, lang);
  return o.lang === lang ? o : resultsText[lang].blocs[bloc.id] ? { text: resultsText[lang].blocs[bloc.id], lang } : o;
}

/** A pollster or channel as Israelis name it ("Channel 12" → "חדשות 12"). */
export function pollsterName(name: string, lang: Lang): Localized {
  if (lang === "en") return { text: name, lang: "en" };
  const o = pollsterText(name, lang);
  return o.lang === lang ? o : resultsText[lang].channels[name] ? { text: resultsText[lang].channels[name], lang } : o;
}

/** A field of data/results.json ("lettersSource", "thresholdSource", "agreementsNote", "source.label"); overlay key "_". */
export function configText(config: ResultsConfig, field: string, lang: Lang): Localized {
  return lang === "en" ? localize({ ...config, id: "_" }, field, undefined, "en") : localize({ ...config, id: "_" }, field, overlays(lang).results, lang);
}

/** Shows a Localized: as is when it is in the page's language, else marked as English inside the Hebrew page. */
export function T({ v, lang }: { v: Localized; lang: Lang }): ReactNode {
  if (lang === "en" || v.lang === lang) return v.translated ? `${v.text} ${{en:"(translation)", he:"(תרגום)",ar:"(ترجمة)",fa:"(ترجمه)"}[lang]}` : v.text;
  return <span lang={v.lang} dir={v.lang === "en" ? "ltr" : "rtl"}>{v.text}</span>;
}
