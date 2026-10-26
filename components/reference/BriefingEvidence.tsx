import type { Briefing } from "@/lib/briefing";
import type { Lang } from "@/lib/i18n";
import { briefingCopy, briefingEvidenceLabel } from "@/lib/i18n/briefing";
import { briefingSentence } from "@/lib/briefing-locale";
export default function BriefingEvidence({
  briefing,
  lang,
}: {
  briefing: Briefing;
  lang: Lang;
}) {
  const t = briefingCopy(lang),
    sentences = briefing.sentences.map((s) => briefingSentence(s, lang)),
    ready = sentences.every((s) => s.text);
  return (
    <section>
      <p>
        <strong>
          {briefing.evidenceVersion === 2 ? t.verified : t.legacy}
        </strong>
        . {briefing.evidenceVersion === 2 ? t.verifiedNote : t.legacyNote}
      </p>
      {ready ? (
        <>
          {lang !== "en" && <p>{t.machine}</p>}
          {briefing.sentences.map((s, i) => (
            <p key={s.claimId ?? i}>
              {s.evidenceClass && (
                <>
                  <strong>
                    {briefingEvidenceLabel(lang, s.evidenceClass)}
                  </strong>
                  {". "}
                </>
              )}
              {sentences[i].text}{" "}
              {s.sources.map((source, index) => (
                <span key={source.url}>
                  {index ? ", " : ""}
                  <a href={source.url} hrefLang="en" rel="noreferrer">
                    {source.outlet}
                  </a>
                </span>
              ))}
            </p>
          ))}
        </>
      ) : (
        <>
          <h3>{t.pending}</h3>
          <p>{t.pendingNote}</p>
          <p>
            <a href={`/news/${briefing.date}?original=en`} hrefLang="en">
              {t.original}
            </a>
          </p>
        </>
      )}
    </section>
  );
}
