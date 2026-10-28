import { ELECTION_DAY } from "@/lib/election-date";
import Link from "next/link";
import type { ReactNode } from "react";
import PageHead from "@/components/PageHead";
import SeatBasis from "@/components/seat-context/SeatBasis";
import {
  BuilderGlyph,
  PartyMapGlyph,
  PollsGlyph,
  VoteMapGlyph,
} from "@/components/HomeGlyphs";
import {
  BallotGlyph,
  CompareGlyph,
  FamilyGlyph,
  GlossaryGlyph,
  LensGlyph,
  ResultsGlyph,
  SheetsGlyph,
  TimelineGlyph,
} from "@/app/(en)/resources/glyphs";
import questions from "@/data/comparison-questions.json";
import glossary from "@/data/glossary.json";
import history from "@/data/party-history.json";
import timeline from "@/data/timeline.json";
import election2022 from "@/public/vote-map/2022.json";
import { COMMUNITIES, GUIDES, ISSUES } from "@/lib/articles";
import { ballotLists } from "@/lib/ballot";
import { currentElection } from "@/lib/political-record/registry";
import { allPolls, mainPolls, parties, pollsData } from "@/lib/data";
import { initialOf } from "@/lib/glossary";
import { journeys } from "@/lib/journeys";
import { isExit } from "@/lib/polls";
import { seatContextForRender } from "@/lib/seat-context-server";
import { contextToPoll } from "@/lib/seat-context";
import type { SharedSeatContext } from "@/lib/election-lifecycle/types";
import { NAV_GROUPS, NAV_UTILITIES, type NavItem } from "@/lib/site";
import { editionPath, enPath, locale, type Lang } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";
import chrome, { HE_NAV_GROUPS, HE_NAV_UTILITIES } from "@/lib/i18n/chrome";
import { referenceText } from "@/lib/i18n/reference";
import { LIFECYCLE } from "@/lib/i18n/election-lifecycle";
import {
  resourcesText,
  resourceFact,
  resourceElection,
  resourceGroups,
  resourceOpen,
} from "@/lib/i18n/resources";
import { subscriptionText } from "@/lib/i18n/subscriptions";
import { glossaryText } from "@/lib/i18n/glossary";
import { correctionText } from "@/lib/i18n/corrections";
import "@/lib/i18n/overlays";
import "@/components/home.css";
import "@/app/(en)/resources/resources.css";

/** Current thumbnails never substitute the saved campaign average when current evidence is absent. */
export function resourceTiles(
  context: SharedSeatContext | null,
  lang: Lang,
): Record<string, { fig: ReactNode; caption: string }> {
  const t = resourcesText(lang),
    fact = resourceFact,
    current = context ? contextToPoll(context) : null;
  const basis = context
    ? `${LIFECYCLE[lang][context.basis]}. ${LIFECYCLE[lang][context.seatStatus]}.`
    : t.currentUnavailable;
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale(lang), {
      dateStyle: "medium",
      timeZone: "Asia/Jerusalem",
    }).format(new Date(iso));
  const lanes = history.histories.map((h) =>
    h.events.map((e) => e.date.slice(0, 4)),
  );
  const empty = () => <SheetsGlyph n={0} k="guides" />;
  return {
    "/polls": {
      fig: (
        <PollsGlyph
          polls={allPolls.filter((p) => !isExit(p))}
          parties={parties}
          config={pollsData.config}
        />
      ),
      caption: fact(
        t.historicalPolls,
        mainPolls.length,
        date(mainPolls[0].published),
      ),
    },
    "/news": { fig: <SheetsGlyph n={1} k="news" />, caption: t.reportedNews },
    "/results": {
      fig: (
        <ResultsGlyph
          closed={!!context && context.evidenceStage !== "campaign"}
        />
      ),
      caption: basis,
    },
    "/government": {
      fig: current ? (
        <BuilderGlyph parties={parties} poll={current} />
      ) : (
        empty()
      ),
      caption: referenceText(lang).evidence,
    },
    "/parties": {
      fig: current ? (
        <PartyMapGlyph parties={parties} poll={current} />
      ) : (
        empty()
      ),
      caption: basis,
    },
    "/compare": {
      fig: (
        <CompareGlyph
          questions={questions.questions.length}
          lists={parties.length}
        />
      ),
      caption: fact(t.positions, questions.questions.length, parties.length),
    },
    "/coalition-builder": {
      fig: current ? (
        <BuilderGlyph parties={parties} poll={current} />
      ) : (
        empty()
      ),
      caption: basis,
    },
    "/party-history": {
      fig: <FamilyGlyph lanes={lanes} />,
      caption: fact(t.histories, lanes.length),
    },
    "/ballot": {
      fig: <BallotGlyph letters={ballotLists.map((l) => l.letters)} />,
      caption: fact(t.savedBallot, ballotLists.length, resourceElection(lang, currentElection().termNumber)),
    },
    "/vote-map": {
      fig: <VoteMapGlyph />,
      caption: fact(t.historicMap, election2022.rows.length, resourceElection(lang, election2022.knesset)),
    },
    "/communities": {
      fig: <SheetsGlyph n={COMMUNITIES.length} k="communities" />,
      caption: fact(t.communities, COMMUNITIES.length),
    },
    "/issues": {
      fig: <SheetsGlyph n={ISSUES.length} k="issues" />,
      caption: fact(t.issues, ISSUES.length),
    },
    "/how-it-works": {
      fig: <SheetsGlyph n={GUIDES.length} k="guides" />,
      caption: fact(t.guides, GUIDES.length),
    },
    "/timeline": {
      fig: (
        <TimelineGlyph
          elections={timeline.elections.map((e) => e.date)}
          terms={timeline.governments.map((g) => ({
            from: g.from,
            to: g.to || ELECTION_DAY,
          }))}
        />
      ),
      caption: fact(
        t.timeline,
        timeline.elections.length,
        timeline.events.length,
      ),
    },
    "/glossary": {
      fig: (
        <GlossaryGlyph
          initials={glossary.terms.map((x) => initialOf(x.term))}
        />
      ),
      caption: fact(t.terms, glossary.terms.length),
    },
    "/american-lens": { fig: <LensGlyph />, caption: "" },
  };
}
function words(n: NavItem, lang: Lang) {
  const path = enPath(n.href),
    reference = referenceText(lang);
  const special: Record<string, string> = {
    "/resources": resourcesText(lang).title,
    "/subscriptions": subscriptionText(lang).title,
    "/glossary": glossaryText(lang).title,
    "/corrections": correctionText(lang).title,
    "/elections": reference.elections,
    "/parliament": reference.parliament,
    "/policies": reference.policies,
    "/changes": reference.changes,
    "/reference": reference.reference,
  };
  const he = [
    ...HE_NAV_GROUPS.flatMap((g) => g.items),
    ...HE_NAV_UTILITIES,
  ].find((item) => enPath(item.href) === path);
  const heTitles: Record<string, string> = {
    "/communities": "קהילות",
    "/issues": "סוגיות",
    "/american-lens": "נקודת המבט האמריקאית",
  };
  const title =
    special[path] ??
    (lang === "he" ? heTitles[path] : undefined) ??
    (lang === "he" ? (he?.label ?? n.label) : ui(lang, n.label));
  const translatedDescription =
    lang === "he" ? he?.description || n.description : ui(lang, n.description);
  const description =
    lang !== "en" && translatedDescription === n.description
      ? resourceOpen(lang)
      : translatedDescription;
  return {
    title,
    titleLang: title === n.label ? "en" : lang,
    description,
    descriptionLang: description === n.description ? "en" : lang,
  };
}
export default async function ResourcesPage({ lang = "en" }: { lang?: Lang }) {
  const context = await seatContextForRender(),
    t = resourcesText(lang),
    tiles = resourceTiles(context, lang);
  return (
    <div className="wrap resource-directory">
      <PageHead title={t.title} standfirst={t.intro} />
      <SeatBasis context={context} lang={lang} />
      <p className="fig-note">{t.currentTools}</p>
      {NAV_GROUPS.map((group, index) => (
        <section
          key={group.id}
          className="rd-group"
          aria-labelledby={`resources-${group.id}`}
        >
          <h2 id={`resources-${group.id}`} className="sec-h3">
            {resourceGroups[lang][index]}
          </h2>
          <ul className="rd-tiles">
            {group.items.map((n) => {
              const label = words(n, lang),
                tile = tiles[n.href];
              return (
                <li key={n.href}>
                  <Link
                    href={editionPath(n.href, lang) ?? `${n.href}?original=en`}
                    hrefLang={editionPath(n.href, lang) ? lang : "en"}
                  >
                    {tile?.fig ?? <SheetsGlyph n={1} k="guides" />}
                    <span className="t" lang={label.titleLang} dir="auto">
                      {label.title}
                      {lang !== "en" && label.titleLang === "en"
                        ? ` ${chrome[lang].inEnglish}`
                        : ""}
                    </span>
                    <span
                      className="p"
                      lang={tile?.caption ? lang : label.descriptionLang}
                      dir="auto"
                    >
                      {tile?.caption || label.description}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      <section className="rd-group" aria-labelledby="resources-more">
        <h2 id="resources-more" className="sec-h3">
          {t.more}
        </h2>
        <ul className="rd-more">
          {NAV_UTILITIES.filter((n) => n.href !== "/resources").map((n) => {
            const label = words(n, lang);
            return (
              <li key={n.href}>
                <Link
                  href={editionPath(n.href, lang) ?? `${n.href}?original=en`}
                  lang={label.titleLang}
                  dir="auto"
                >
                  {label.title}
                  {lang !== "en" && label.titleLang === "en"
                    ? ` ${chrome[lang].inEnglish}`
                    : ""}
                </Link>
                <p
                  lang={n.href === "/start" ? lang : label.descriptionLang}
                  dir="auto"
                >
                  {n.href === "/start"
                    ? resourceFact(t.routes, journeys.routes.length)
                    : label.description}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
