import "@/components/interactives.css";
import "@/components/coalition.css";
import CoalitionBuilder, { type Preset } from "@/components/CoalitionBuilder";
import { PollSources, ProfileSources } from "@/components/Sources";
import SourcesBox from "@/components/SourcesBox";
import { localizeStanceMap, stanceMap, type StanceMap } from "@/lib/cohesion";
import { unstatedFrom, type Unstated, type UnstatedMap } from "@/lib/coalition-governing";
import questions from "@/data/comparison-questions.json";
import { allPolls, parties } from "@/lib/data";
import { comparisonIssues } from "@/lib/positions";
import { outgoingGovernment } from "@/lib/outgoing-government";
import { resultsAsPoll } from "@/lib/results";
import { fetchCount, resultsConfig } from "@/lib/results-live";
import type { Lang } from "@/lib/i18n";
import builder from "@/lib/i18n/builder";
import { governmentText, positionText, questionText } from "@/lib/i18n/overlays";

type Question = { key: string; unstated?: Record<string, Unstated> };
const QUESTIONS = questions.questions as unknown as Question[];

/** Where each party stands on each issue, for the panel's "Can they govern together?"; no quotes travel to the client. */
const STANCES = stanceMap(comparisonIssues(), parties.map((p) => p.id));
/** Positions a party holds but will not say publicly, counted as answers and marked so. */
const UNSTATED = unstatedFrom(QUESTIONS, STANCES);

/** The positions file behind each comparison row that has no question of its own (lib/positions ISSUES). */
const FILE_OF: Record<string, string> = { draft: "haredi-draft", courts: "courts", war: "war-hostages", wb: "west-bank", relig: "religion-state", econ: "economy", pstate: "palestinian-state" };

/**
 * The stance map in the Hebrew edition: a question's label and stances from the comparison-questions overlay, a row
 * without a question from its positions file (stances) and the phrasebook (label). Each label records its language.
 */
function stancesIn(lang: Lang): StanceMap {
  if (lang === "en") return STANCES;
  const issues = comparisonIssues();
  return localizeStanceMap(STANCES, (key, field, english) => {
    const q = QUESTIONS.find((x) => x.key === key);
    if (q) return questionText(q, field, lang);
    if (field === "label") return { text: builder[lang].axes[key] ?? english, lang };
    const file = issues.find((i) => i.key === key)?.file;
    return file && FILE_OF[key] ? positionText(FILE_OF[key], file, field, lang) : { text: english, lang: "en" };
  });
}

/** The unstated notes in the Hebrew edition, from the comparison-questions overlay ("unstated.<party>.text"). */
function unstatedIn(lang: Lang): UnstatedMap {
  if (lang === "en") return UNSTATED;
  const out: UnstatedMap = {};
  for (const [key, byParty] of Object.entries(UNSTATED)) {
    const q = QUESTIONS.find((x) => x.key === key)!;
    out[key] = Object.fromEntries(Object.entries(byParty).map(([id, u]) => {
      const t = questionText(q, `unstated.${id}.text`, lang);
      return [id, { ...u, text: t.text, lang: t.lang }];
    }));
  }
  return out;
}

/** The outgoing government as a one-tap line-up, with its 2022 seats for the "then vs now" line. */
function presetIn(lang: Lang): Preset {
  const base = { ids: outgoingGovernment.with, label: builder[lang].presetLabel, seats: outgoingGovernment.seats2022, year: 2022 };
  if (lang === "en") return { ...base, note: outgoingGovernment.noam.text };
  const note = governmentText(outgoingGovernment, "noam.text", lang);
  return { ...base, note: note.text, noteLang: note.lang };
}

/** A sources line: the bold head, then the text with the results config's lines filled in. */
function SourceItems({ items, lang }: { items: { head: string; text: string }[]; lang: Lang }) {
  const fill = (text: string) => {
    const m = text.match(/^(\s*)\{(letters|threshold)\}$/);
    if (!m) return text;
    const line = m[2] === "letters" ? resultsConfig.lettersSource : resultsConfig.thresholdSource;
    // The config's source lines are English data with no overlay yet.
    return <>{m[1]}{lang === "en" ? line : <span lang="en" dir="ltr">{line}</span>}</>;
  };
  return (
    <>
      {items.map((x) => (
        <li key={x.head}>
          <b>{x.head}</b>
          {fill(x.text)}
        </li>
      ))}
    </>
  );
}

/** The Coalition Builder page body, in either edition. The route files hold only the metadata. */
export default async function BuilderPage({ lang, revalidate }: { lang: Lang; revalidate: number }) {
  const T = builder[lang];
  const live = await fetchCount(revalidate);
  const results = live.state === "open" ? resultsAsPoll(live.count, resultsConfig, live.fetchedAt, live) : null;
  return (
    <div className="ix builder-page">
      <div className="wrap">
        <CoalitionBuilder results={results} preset={presetIn(lang)} stances={stancesIn(lang)} unstated={unstatedIn(lang)} />

        <SourcesBox count={allPolls.length + 10} lang={lang}>
          <PollSources lang={lang} />
          <SourceItems items={T.sources} lang={lang} />
          <ProfileSources lang={lang} />
          <SourceItems items={T.sourcesAfter} lang={lang} />
        </SourcesBox>
      </div>
    </div>
  );
}
