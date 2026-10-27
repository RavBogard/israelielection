import Link from "next/link";
import Glossary, { type GlossaryLabel } from "@/components/Glossary";
import glossaryJson from "@/data/glossary.json";
import PageHead from "@/components/PageHead";
import { anchorOf, type Glossary as GlossaryData } from "@/lib/glossary";
import { editionPath, type Lang } from "@/lib/i18n";
import { glossaryText } from "@/lib/i18n/glossary";
import { referenceText } from "@/lib/i18n/reference";
import { longDate } from "@/lib/format";
import {
  translatedTool,
  translatedReference,
  referenceDocuments,
} from "@/lib/reference/catalog";
import { ui } from "@/lib/i18n/ui";
import chrome, { HE_NAV_GROUPS } from "@/lib/i18n/chrome";
import "@/lib/i18n/overlays";
import "@/components/article/article.css";
import "@/components/glossary.css";
export default async function GlossaryPage({ lang = "en" }: { lang?: Lang }) {
  const t = glossaryText(lang),
    ref = referenceText(lang),
    edition = translatedTool("tools:glossary", lang, glossaryJson),
    data: GlossaryData = {
      ...edition.data,
      terms: edition.data.terms.map((term, i) => ({
        ...term,
        id: anchorOf(glossaryJson.terms[i].term),
        originalTerm: glossaryJson.terms[i].term,
      })),
    };
  const labels: Record<string, GlossaryLabel> = Object.fromEntries(
    Object.entries({
      "/vote-map": "Vote map",
      "/results": "Results",
      "/polls": "Polls",
      "/parties": "Party Map",
      "/american-lens": "The American lens",
      "/timeline": "Timeline",
    }).map(([href, label]) => {
      const text =
        lang === "he"
          ? (HE_NAV_GROUPS.flatMap((g) => g.items).find(
              (n) => n.href === href || n.href === "/he" + href,
            )?.label ?? label)
          : ui(lang, label);
      return [href, { text, lang: text === label ? "en" : lang }];
    }),
  );
  for (const article of referenceDocuments) {
    const selected = translatedReference(article.path, lang);
    labels[article.path] =
      selected?.state === "ready"
        ? { text: selected.translation.blocks[0].text, lang }
        : { text: article.title, lang: "en" };
  }
  return (
    <div className="wrap article-page glossary-page">
      <PageHead title={t.title} standfirst={t.intro}>
        <p className="ph-meta">
          {t.checked}{" "}
          <time dateTime={data.checked}>{longDate(data.checked, lang)}</time>.
        </p>
      </PageHead>
      <p className="note">{t.historical}</p>
      {lang !== "en" && edition.state !== "ready" && (
        <p className="note">
          <b>{edition.state === "withdrawn" ? ref.withdrawn : ref.pending}.</b>{" "}
          {ref.pendingNote}{" "}
          <Link href="/glossary?original=en">{ref.original}</Link>
        </p>
      )}
      <div className="article-grid solo">
        <article className="article">
          <Glossary
            data={data}
            labels={labels}
            lang={lang}
            contentLang={edition.contentLang}
          />
          <p className="article-correction">
            <Link
              href={
                editionPath("/corrections", lang) ?? "/corrections?original=en"
              }
            >
              {chrome[lang].sources.correction}
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
