import { chartLabelEdition } from "@/lib/reference/catalog";
import type { ReactNode } from "react";
import type {
  SourceDocument,
  TranslationDocument,
} from "@/lib/reference/translations";
import { isRtl, type Lang } from "@/lib/i18n";
import { longDate } from "@/lib/format";
import { sourceCheckedText, beforeVoteNote } from "@/lib/i18n/reference";
import { editionPath } from "@/lib/i18n";
import { ELECTION_DAY } from "@/lib/election-date";
import Link from "next/link";
import {
  referenceText,
  widgetNotice,
  quotationNotice,
} from "@/lib/i18n/reference";
import { Chart, Positions, positionsTranslated } from "../article/Article";
import WhatIf from "../article/WhatIf";
/** A small text renderer, never MDX/eval. Links must already match the source invariants. */
function inline(text: string): ReactNode[] {
  const result: ReactNode[] = [];
  const re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
  let cursor = 0;
  for (const m of text.matchAll(re)) {
    result.push(text.slice(cursor, m.index));
    result.push(
      m[1] ? (
        <a key={m.index} href={m[2]}>
          {m[1]}
        </a>
      ) : (
        <strong key={m.index}>{m[3]}</strong>
      ),
    );
    cursor = m.index! + m[0].length;
  }
  result.push(text.slice(cursor));
  return result;
}
export default function TranslatedBody({
  source,
  translation,
  lang,
  title,
}: {
  source: SourceDocument;
  translation: TranslationDocument;
  lang: Lang;
  title?: string;
}) {
  const t = referenceText(lang);
  const heading = source.blocks.findIndex((b) => b.kind === "title"),
    summary = source.blocks.findIndex((b) => b.kind === "summary");
  return (
    <div className="article-grid solo">
      <article className="article">
        {(title || heading >= 0) && (
          <h1>{title ?? translation.blocks[heading].text}</h1>
        )}
        {summary >= 0 && (
          <p className="dek">{inline(translation.blocks[summary].text)}</p>
        )}
        <p className="checked">
          {sourceCheckedText(lang)}{" "}
          <time dateTime={source.checked}>
            {/^\d{4}-\d\d-\d\d$/.test(source.checked)
              ? longDate(source.checked, lang)
              : source.checked}
          </time>
          .
          {source.checked < ELECTION_DAY && (
            <>
              {" "}
              <span className="checked-note">
                {beforeVoteNote(lang).lead}
                <Link href={editionPath("/results", lang) ?? "/results"}>{beforeVoteNote(lang).link}</Link>.
              </span>
            </>
          )}
        </p>
        <div className="body">
          {source.blocks.map((block, i) => {
            const text = translation.blocks[i].text;
            if (block.kind === "title" || block.kind === "summary") return null;
            if (block.kind === "heading")
              return <h2 key={block.id}>{inline(text)}</h2>;
            if (block.kind === "quote")
              return (
                <figure key={block.id}>
                  <blockquote>{inline(text)}</blockquote>
                  <figcaption>{quotationNotice(lang)}</figcaption>
                </figure>
              );
            if (block.kind === "attribution")
              return (
                <p className="fig-src" key={block.id}>
                  {inline(text)}
                </p>
              );
            if (block.kind === "widget") {
              const w = block.widget!;
              const chart =
                w.name === "Chart" ? chartLabelEdition(w.attrs.id, lang) : null;
              const localized =
                w.name === "WhatIf" ||
                chart?.state === "ready" ||
                (w.name === "Positions" &&
                  positionsTranslated(w.attrs.issue, lang));
              return (
                <section className="reference-widget" key={block.id}>
                  {!localized && (
                    <p className="fig-src">
                      <a href={source.path + "?original=en"} hrefLang="en">
                        {t.original}
                      </a>
                      . {widgetNotice(lang)}
                    </p>
                  )}
                  <div
                    lang={localized || w.name === "Positions" ? lang : "en"}
                    dir={w.name === "Positions" && isRtl(lang) ? "rtl" : "ltr"}
                  >
                    {w.name === "Chart" ? (
                      <Chart
                        id={w.attrs.id}
                        labels={
                          chart?.state === "ready" ? chart.labels : undefined
                        }
                        lang={chart?.state === "ready" ? lang : "en"}
                      />
                    ) : w.name === "Positions" ? (
                      <Positions issue={w.attrs.issue} lang={lang} />
                    ) : w.name === "WhatIf" ? (
                      <WhatIf lang={lang} />
                    ) : null}
                  </div>
                </section>
              );
            }
            return (
              <p key={block.id} style={{ whiteSpace: "pre-line" }}>
                {inline(text)}
              </p>
            );
          })}
        </div>
      </article>
    </div>
  );
}
