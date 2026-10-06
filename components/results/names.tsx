import type { ReactNode } from "react";
import { ballotLists } from "@/lib/ballot";
import type { Lang } from "@/lib/i18n";
import type { Localized } from "@/lib/i18n/localize";
import { OVERLAYS, blocText, partyText, pollsterText } from "@/lib/i18n/overlays";
import { localize } from "@/lib/i18n/localize";
import { lettersOf } from "@/lib/letters";
import resultsText from "@/lib/i18n/results";
import type { ResultsConfig } from "@/lib/results";

/**
 * Names on the election-night page. In Hebrew: the overlay's Hebrew first, then the media short names in
 * lib/i18n/results.ts (keyed by ballot letters), then, for a list the site does not track, the committee's own
 * Hebrew slip name for its letters (data/ballot-directory.json). English stays the English data.
 */
const he = resultsText.he;

/** A tracked list's name. */
export function listName(party: { id: string; name: string }, lang: Lang): Localized {
  if (lang === "en") return { text: party.name, lang: "en" };
  const o = partyText(party, "name", "he");
  if (o.lang === "he") return o;
  const short = he.lists[lettersOf[party.id]];
  return short ? { text: short, lang: "he" } : o;
}

/** Any list by its ballot letters: a tracked list's name, else the committee's Hebrew slip name, else the letters. */
export function lettersName(letters: string, config: ResultsConfig, names: Record<string, string>, lang: Lang): Localized {
  const id = config.letters[letters];
  if (lang === "en") return { text: names[id] ?? letters, lang: "en" };
  if (id && names[id]) return { text: names[id], lang: "he" };
  const slip = ballotLists.find((l) => l.letters === letters)?.hebrew;
  return { text: slip ?? letters, lang: "he" };
}

/** A bloc's label. */
export function blocName(bloc: { id: string; label: string }, lang: Lang): Localized {
  if (lang === "en") return { text: bloc.label, lang: "en" };
  const o = blocText(bloc, "he");
  return o.lang === "he" ? o : he.blocs[bloc.id] ? { text: he.blocs[bloc.id], lang: "he" } : o;
}

/** A pollster or channel as Israelis name it ("Channel 12" → "חדשות 12"). */
export function pollsterName(name: string, lang: Lang): Localized {
  if (lang === "en") return { text: name, lang: "en" };
  const o = pollsterText(name, "he");
  return o.lang === "he" ? o : he.channels[name] ? { text: he.channels[name], lang: "he" } : o;
}

/** A field of data/results.json ("lettersSource", "thresholdSource", "agreementsNote", "source.label"); overlay key "_". */
export function configText(config: ResultsConfig, field: string, lang: Lang): Localized {
  return lang === "en" ? localize({ ...config, id: "_" }, field, undefined, "en") : localize({ ...config, id: "_" }, field, OVERLAYS.results, "he");
}

/** Shows a Localized: as is when it is in the page's language, else marked as English inside the Hebrew page. */
export function T({ v, lang }: { v: Localized; lang: Lang }): ReactNode {
  if (lang === "en" || v.lang === lang) return v.translated ? `${v.text} (תרגום)` : v.text;
  return <span lang="en" dir="ltr">{v.text}</span>;
}
