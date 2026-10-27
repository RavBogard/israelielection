import type { Lang } from "@/lib/i18n";
import { referenceText } from "@/lib/i18n/reference";
import { recordText } from "@/lib/i18n/records";
import { briefingEvidenceLabel } from "@/lib/i18n/briefing";
import { recordDate } from "@/lib/reference/record-format";
import type { GlobalNotices } from "@/lib/political-record/global-notices";

/** Current global publications supplement the independent election chronology. */
export default function ChangesPage({
  lang,
  notices,
}: {
  lang: Lang;
  notices: GlobalNotices;
}) {
  const t = referenceText(lang),
    r = recordText(lang);
  if (
    notices.state === "disabled" ||
    (notices.state === "available" && !notices.notices.length)
  )
    return null;
  return (
    <section
      aria-label={t.evidence}
      data-global-publications
      style={{ minWidth: 0, overflowWrap: "anywhere" }}
    >
      <h2>{t.evidence}</h2>
      {(notices.state === "unavailable" || !notices.complete) && (
        <p role="status">{r.partial}</p>
      )}
      {notices.notices.map((notice) => (
        <article
          key={notice.revisionId}
          id={`revision-${notice.revisionId}`}
          data-publication-revision={notice.revisionId}
        >
          <h3>
            {notice.state === "reviewed" ? notice.content!.subject : t.pending}
          </h3>
          <p>
            {r.checked}:{" "}
            <time dateTime={notice.observedAt}>
              {recordDate(notice.observedAt, lang)}
            </time>
          </p>
          {notice.state === "reviewed" ? (
            <>
              <p>
                {[...new Set(notice.evidenceClasses)].map((value) => {
                  const label =
                    value === "primary_confirmed"
                      ? t.confirmed
                      : value === "reported_corroborated"
                        ? briefingEvidenceLabel(lang, "corroborated_reporting")
                        : value === "attributed_analysis"
                          ? briefingEvidenceLabel(
                              lang,
                              "attributed_perspective",
                            )
                          : null;
                  return label ? (
                    <span key={value} data-evidence-class={value}>
                      {label}
                      {" · "}
                    </span>
                  ) : null;
                })}
              </p>
              <p style={{ whiteSpace: "pre-line" }} dir="auto">
                {notice.content!.text}
              </p>
              <ul>
                {notice.sources.map((source) => (
                  <li key={source.id}>
                    <a href={source.url} dir="auto">
                      {source.publisher}: {source.title}
                    </a>{" "}
                    · {r.checked}:{" "}
                    <time dateTime={source.observedAt}>
                      {recordDate(source.observedAt, lang)}
                    </time>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p>{t.pendingNote}</p>
          )}
          <details>
            <summary>{t.revision}</summary>
            <a href={`#revision-${notice.revisionId}`}>
              <code>{notice.revisionId}</code>
            </a>
            {notice.previousRevisionId && (
              <p>
                <code>{notice.previousRevisionId}</code>
              </p>
            )}
          </details>
        </article>
      ))}
    </section>
  );
}
