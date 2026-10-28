import Link from "next/link";
import { Suspense } from "react";
import CorrectionReport from "@/components/CorrectionReport";
import entriesData from "@/data/corrections.json";
import channel from "@/data/correction-channel.json";
import { NAV } from "@/lib/site";
import { longDate } from "@/lib/format";
import { editionPath, type Lang } from "@/lib/i18n";
import { correctionText } from "@/lib/i18n/corrections";
import { referenceText } from "@/lib/i18n/reference";
import { translatedTool } from "@/lib/reference/catalog";
import { HE_NAV_GROUPS } from "@/lib/i18n/chrome";
import { ui } from "@/lib/i18n/ui";
import "@/lib/i18n/overlays";
import PageHead from "@/components/PageHead";
import "@/components/interactives.css";
import "@/components/corrections.css";
export default function CorrectionsPage({ lang = "en" }: { lang?: Lang }) {
  const t = correctionText(lang),
    ref = referenceText(lang),
    edition = translatedTool("tools:corrections", lang, entriesData),
    local = (href: string) => editionPath(href, lang) ?? href;
  const pageTitle = (href: string) => {
    const english =
        NAV.find((item) => item.href === href.split("#")[0])?.label ?? href,
      text =
        lang === "he"
          ? (HE_NAV_GROUPS.flatMap((g) => g.items).find(
              (item) => item.href === href || item.href === "/he" + href,
            )?.label ?? english)
          : ui(lang, english);
    return (
      <span lang={text === english ? "en" : lang} dir="auto">
        {text}
      </span>
    );
  };
  return (
    <div className="wrap ix">
      <PageHead title={t.title} standfirst={t.intro} />
      <section
        id="media"
        className="media-inquiries"
        aria-labelledby="media-title"
      >
        <h2 id="media-title">{t.media}</h2>
        <p>{t.mediaNote}</p>
        <p>
          <bdi lang="en">{channel.reviewer}</bdi>:{" "}
          <a
            href={`mailto:${channel.email}?subject=${encodeURIComponent(t.media)}`}
            dir="ltr"
          >
            {channel.email}
          </a>
          .
        </p>
        <p className="fig-note">
          <a href="#report">{t.mediaHint}</a>
        </p>
      </section>
      <div className="correction-register">
        <p>
          {t.responsible}: <bdi lang="en">{channel.reviewer}</bdi>. {t.method}{" "}
          <Link href={local("/about")}>{t.methodLink}</Link>.
        </p>
        <p className="fig-note">{t.methodNote}</p>
        <p className="fig-note">
          {t.changesNote}
          <Link href={local("/changes")}>{t.changesLink}</Link>.
        </p>
        <h2>{t.substantive}</h2>
        {lang !== "en" && edition.state !== "ready" && (
          <p className="note">
            <b>
              {edition.state === "withdrawn" ? ref.withdrawn : ref.pending}.
            </b>{" "}
            {ref.pendingNote}{" "}
            <Link href="/corrections?original=en">{ref.original}</Link>
          </p>
        )}
        {!edition.data.entries.length ? (
          <p>{t.empty}</p>
        ) : (
          edition.data.entries.map((entry) => (
            <article key={entry.id} id={entry.id}>
              <h3>
                <Link href={local(entry.page)}>{pageTitle(entry.page)}</Link>,{" "}
                <time dateTime={entry.date}>{longDate(entry.date, lang)}</time>
              </h3>
              <dl>
                <dt>{t.previous}</dt>
                <dd lang={edition.contentLang} dir="auto">
                  {entry.before}
                </dd>
                <dt>{t.corrected}</dt>
                <dd lang={edition.contentLang} dir="auto">
                  {entry.after}
                </dd>
              </dl>
              <p lang={edition.contentLang} dir="auto">
                {entry.explanation}
              </p>
              <ul>
                {entry.evidence.map((e) => (
                  <li key={e.url}>
                    <a href={e.url} lang="en" dir="ltr">
                      {e.title}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="fig-src">
                {t.sourceReview}:{" "}
                <span lang={edition.contentLang} dir="auto">
                  {entry.reviewedBy}
                </span>
                .
              </p>
            </article>
          ))
        )}
      </div>
      <Suspense fallback={<p>{t.loading}</p>}>
        <CorrectionReport lang={lang} />
      </Suspense>
    </div>
  );
}
